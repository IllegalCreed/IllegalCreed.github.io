---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **Luxon 3.x**。把 Luxon 用进真实项目：时区与 `keepLocalTime`、基于 Intl 的本地化、`Duration` 的 `as` vs `shiftTo`、`Interval` 区间运算、`fromFormat` 严格解析。

## 速查

- **换时区默认语义**：`setZone(zone)` 保持绝对时刻，只改变当地显示；`keepLocalTime: true` 保持钟点并改变时间戳，通常应谨慎使用。
- **全局默认**：`Settings.defaultZone` 影响之后的本地构造；恢复系统时区用 `system`。
- **Intl 本地化**：`setLocale()` / `toLocaleString()` 使用宿主 Intl，不需要 locale 包；预设常量本质是 `Intl.DateTimeFormat` options。
- **格式 locale**：`toFormat` / `fromFormat` 未显式配置 locale 时按 en-US 处理，不等同于 `toLocaleString` 的本地化路径。
- **Duration 换算**：`as(unit)` 返回数字；`shiftTo`、`normalize`、`rescale` 返回新的 Duration；`toHuman()` 生成单位列表文案。
- **Interval 语义**：区间按 `[start, end)` 理解，支持 contains、overlaps、intersection、union、split 与 length。
- **精确跨单位**：需要锚定真实起止点时用 Interval；孤立 Duration 的月 / 年换算依赖 conversionAccuracy 近似规则。
- **自定义解析**：`fromFormat` 按 token 解析并返回有效 / 无效 DateTime；失败时用 `fromFormatExplain` 查看 tokens、regex 与 matches。

## 一、时区：同一时刻 vs 同一钟点

Luxon 时区基于原生 Intl，能直接用任意 IANA 时区。`setZone` 默认**保持绝对时刻**，只换展示时区：

```ts
const local = DateTime.local(2024, 5, 15, 12);
local.zoneName;  // 'America/New_York'
local.toISO();   // '2024-05-15T12:00:00.000-04:00'

const tokyo = local.setZone("Asia/Tokyo");
tokyo.toISO();   // '2024-05-16T01:00:00.000+09:00'（同一时刻，东京是次日凌晨 1 点）
local.toMillis() === tokyo.toMillis(); // true
```

加 `{ keepLocalTime: true }` 则相反：**保持当地钟点不变**，底层时间戳改变：

```ts
const kept = local.setZone("Asia/Tokyo", { keepLocalTime: true });
kept.toISO();    // '2024-05-15T12:00:00.000+09:00'（钟点还是 12 点，但变成东京的 12 点）
local.toMillis() === kept.toMillis(); // false
```

其它常用：

```ts
local.toUTC();                  // 转 UTC
DateTime.utc(2024, 5, 15);      // 直接在 UTC 构造
local.offset;                   // -240（分钟）
local.offsetNameShort;          // 'EDT'
local.isInDST;                  // true / false
```

::: tip 全局默认时区
`Settings.defaultZone = "Asia/Tokyo"` 让之后所有 `DateTime.local()` 默认用东京时区；恢复用 `"system"`，UTC 用 `"utc"`。
:::

## 二、本地化：一行切语言，全靠 Intl

```ts
const dt = DateTime.local(2024, 5, 15, 14, 30);

dt.setLocale("zh").toLocaleString(DateTime.DATE_FULL);    // '2024年5月15日'
dt.setLocale("fr").toLocaleString(DateTime.DATETIME_MED); // '15 mai 2024, 14:30'
dt.setLocale("de").toLocaleString(DateTime.DATE_FULL);    // '15. Mai 2024'

// 构造时指定
DateTime.fromISO("2024-05-15", { locale: "ja" });
// 全局默认
Settings.defaultLocale = "zh";
```

预设常量本质是 `Intl.DateTimeFormat` 选项对象，可解构定制；也可直接传自定义 Intl 选项：

```ts
dt.toLocaleString({ ...DateTime.DATE_SHORT, weekday: "long" }); // 'Wednesday, 5/15/2024'
dt.toLocaleString({ month: "long", day: "numeric" });          // 'May 15'
```

数字系统也能配（如孟加拉数字、阿拉伯数字）：

```ts
dt.reconfigure({ locale: "it", numberingSystem: "beng" })
  .toLocaleString(DateTime.DATE_FULL); // '१५ maggio २०२४' 形态
```

::: warning toFormat / fromFormat 默认 en-US
`DateTime.fromFormat` 与 `DateTime#toFormat` **默认回退 en-US**（因为常用于对 locale 不敏感的接口场景）。要非英文，必须显式 `setLocale` 或传 `{ locale }`。这与跟随系统的 `toLocaleString` 不同。
:::

## 三、Duration：as 取数字，shiftTo 重分配

```ts
import { Duration } from "luxon";

const dur = Duration.fromObject({ hours: 2, minutes: 7 });

dur.as("seconds");                       // 7620（数字标量）
dur.shiftTo("hours", "minutes").toObject(); // { hours: 2, minutes: 7 }（Duration）
Duration.fromObject({ minutes: 90 }).shiftTo("hours", "minutes").toObject();
//=> { hours: 1, minutes: 30 }
dur.plus({ minutes: 3 }).toObject();     // { hours: 2, minutes: 10 }
dur.negate().toObject();                 // { hours: -2, minutes: -7 }
Duration.fromMillis(90000).rescale().toObject(); // { minutes: 1, seconds: 30 }
dur.toISO();                             // 'PT2H7M'
```

**记牢区别**：`as(unit)` 返回**数字**；`shiftTo(...units)` / `normalize()` / `rescale()` 返回**新的 Duration**。

## 四、Interval：区间运算

`Interval` 锚定起止点，长度按需重算，区间运算丰富：

```ts
import { Interval, DateTime } from "luxon";

const i1 = Interval.fromDateTimes(
  DateTime.fromISO("2024-05-15T09:00"),
  DateTime.fromISO("2024-05-15T12:00")
);
const i2 = Interval.fromDateTimes(
  DateTime.fromISO("2024-05-15T11:00"),
  DateTime.fromISO("2024-05-15T14:00")
);

i1.contains(DateTime.fromISO("2024-05-15T10:00")); // true
i1.overlaps(i2);                                   // true
i1.intersection(i2);                               // 11:00–12:00
i1.union(i2);                                      // 09:00–14:00
i1.length("hours");                                // 3
i1.splitBy({ hours: 1 }).length;                   // 3（切成 3 个 Interval）
i1.divideEqually(3).length;                        // 3（等分成 3 段）
```

::: tip 用 Interval 避免信息损失
`diff('months').as('days')` 是 casual 近似（1 月≈30 天），可能不等于真实天数。`Interval.length('days')` 每次查询都基于起止点重算，得到的是真实值——需要精确跨单位时优先用 Interval。
:::

## 五、fromFormat：严格按 token 解析

人类输入的自定义格式用 `fromFormat`，它**严格**匹配（与 Moment 的宽松不同）：

```ts
DateTime.fromFormat("May 25 1982", "LLLL dd yyyy");        // ok
DateTime.fromFormat("mai 25 1982", "LLLL dd yyyy", { locale: "fr" }); // 本地化解析
```

并非所有 token 都能用于解析：带歧义的**时区名** `ZZZZ`/`ZZZZZ`、**单字母**月/星期、含偏移名的**宏 token**（`ttt`/`FFFF`）不可解析。两位数年份按 `Settings.twoDigitCutoffYear`（默认 60）判世纪：`'60'`→2060、`'61'`→1961。

调试解析失败用 `fromFormatExplain`：

```ts
DateTime.fromFormatExplain("Aug 6 1982", "MMMM d yyyy");
// 返回 { input, tokens, regex, matches, result, zone }
// 这里 MMMM 期待完整月名而输入是缩写 → matches 为空，一眼看出不匹配
```

---

进入 [指南 · 专家](./expert)：有效性模型与 `throwOnInvalid`、相对时间与 Intl 兼容性、Intl/ICU 环境要求、与 Moment/Day.js/date-fns 的取舍。
