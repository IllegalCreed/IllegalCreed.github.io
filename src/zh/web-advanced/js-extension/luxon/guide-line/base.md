---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **Luxon 3.x**。本篇把「会用」用到「懂机制」：不可变到底意味着什么、日历数学 vs 时间数学、`startOf`/`endOf`、`diff` 返回 `Duration`、`hasSame` 与比较。

## 速查

- **全对象不可变**：DateTime、Duration、Interval 的修改 API 都返回新对象；`plus`、`setZone`、`startOf` 不改变原值。
- **日历数学**：年 / 月 / 周 / 天保持当地日历语义，跨 DST 时“加 1 天”不保证等于 24 小时。
- **时间数学**：小时 / 分 / 秒 / 毫秒按固定时长计算；跨 DST 时与日历单位结果可能不同。
- **多单位顺序**：一次 `plus({ months, days })` 从高阶到低阶应用，不一定等于交换顺序的多次调用。
- **边界归一**：`startOf(unit)` / `endOf(unit)` 返回该日历单位的起止 DateTime。
- **差值**：`diff()` 返回 Duration，默认单位是毫秒；要数字用属性或 `.as(unit)`。
- **三类比较**：时间戳比较绝对时刻，`equals()` 还比较 zone / locale，`hasSame()` 比较本地日历刻度并忽略时区元数据。

## 一、不可变：贯穿全库的第一原则

文档原话：「Luxon objects are immutable. That means that you can't alter them in place, just create altered copies.」

```ts
const d1 = DateTime.now();
const d2 = d1.plus({ hours: 1 });

d1 === d2;   // false —— 两个不同对象
// d1 完全没变，d2 是「d1 加一小时」的新副本
```

这条规则适用于 `DateTime`、`Duration`、`Interval` 的**所有**修改方法：`plus`/`minus`/`set`/`setZone`/`startOf`/`reconfigure`……一律返回新实例。带来的直接好处：日期对象可以安全地传来传去、放进缓存或状态，不必担心被别处偷偷改掉。

> 对位 Moment：Moment 的 `add()` 等会**原地修改**原对象，这是它最容易踩的坑之一。Luxon 从设计上消灭了这类问题。

## 二、日历数学 vs 时间数学（最重要的概念）

Luxon 把单位分成两类：

- **日历单位**（长度可变）：年、季度、月、周、天 —— 因为闰年、月份长度、夏令时，它们的「实际时长」随上下文变化。
- **时间单位**（长度固定）：时、分、秒、毫秒 —— 永远是固定的毫秒数。

加日历单位走「日历运算」（保持当地钟点），加时间单位走「时间运算」（精确加毫秒）。跨夏令时（DST）切换时，二者结果会不同：

```ts
const start = DateTime.local(2017, 3, 11, 10); // 美东 DST 切换前一天 10 点

start.plus({ days: 1 }).hour;   // 10 —— 虽然这天只有 23 小时，钟点仍保持 10
start.plus({ hours: 24 }).hour; // 11 —— 精确加 24 小时，跨过 DST 多出 1 小时
```

文档点评：「In adding a day, we kept the hour at 10, even though that's only 23 hours later.」**记牢：加「天」保钟点，加「小时」保时长。**

## 三、多单位运算：从高阶到低阶

一次 `plus` 传多个单位时，Luxon「from highest order to lowest order」依次运算：

```ts
DateTime.fromISO("2017-04-30").plus({ months: 1, days: 1 }).toISODate();
//=> '2017-05-31'
// 先加 1 个月：4-30 → 5-30；再加 1 天：5-30 → 5-31
```

注意：拆成两次独立调用，**顺序变了，结果也变**：

```ts
DateTime.fromISO("2017-04-30").plus({ days: 1 }).plus({ months: 1 }).toISODate();
//=> '2017-06-01'
// 先加 1 天：4-30 → 5-01；再加 1 个月：5-01 → 6-01
```

所以「一次 plus 多单位」≠「多次 plus 单单位」，需要哪种语义要想清楚。

## 四、startOf / endOf：按单位归一

```ts
const dt = DateTime.local(2024, 5, 15, 14, 30, 45);

dt.startOf("day").toISOTime();  // '00:00:00.000-04:00'
dt.endOf("day").toISOTime();    // '23:59:59.999-04:00'
dt.startOf("month").day;        // 1
dt.startOf("year").month;       // 1
```

它们返回新 DateTime（不改原对象），常用于「按天/按月分组」「比较是否同一天」前的归一化。

## 五、diff：差值是一个 Duration

`diff()` 返回 **`Duration`**（不是数字！）：

```ts
const end = DateTime.fromISO("2017-03-13");
const start = DateTime.fromISO("2017-02-13");

end.diff(start, "months").toObject();  //=> { months: 1 }
end.diff(start).toObject();            //=> { milliseconds: 2415600000 }（默认毫秒）
end.diff(start, ["months", "days"]).toObject(); //=> { months: 1, days: 0 }
```

要拿到标量数字，再 `.months` 或 `.as("months")`；`diffNow()` 是与当前时刻的差值。

## 六、比较：时刻相等用时间戳，同日历刻度用 hasSame

```ts
const d1 = DateTime.fromISO("2024-05-15T12:00");
const d2 = DateTime.fromISO("2024-05-15T14:00");

d1 < d2;                       // true（依赖 valueOf）
+d1 === +d2;                   // false（绝对时刻是否相同）
d1.toMillis() === d2.toMillis(); // 等价上一行
d1.equals(d2);                 // 元数据感知：连时区/locale 都要一致
d1.hasSame(d2, "day");         // true（是否同一日历日）
d1.hasSame(d2, "hour");        // false
```

::: warning 三种「相等」别混淆
- `+d1 === +d2`：**同一绝对时刻**（忽略时区/locale 元数据）—— 最常用。
- `d1.equals(d2)`：**元数据也相同**才算相等（时区/locale 不同就 false）。
- `d1.hasSame(d2, 'day')`：**同一日历日**（不是「相差不超过一天」！23:59 与次日 00:01 相差 2 分却不同天）。
:::

---

进入 [指南 · 进阶](./advanced)：时区与 `keepLocalTime`、本地化与 Intl、`Duration` 的 `as`/`shiftTo`、`Interval` 区间运算。
