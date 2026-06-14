---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇讲 **date-fns 的核心用法**：安装、具名导入、格式化 / 解析、增减 / 差值 / 比较、相对时间。版本基线 **date-fns 4.x**。对比对象：Moment（已维护模式）、Day.js（链式）、Luxon（OO）。

## 速查

- 安装：`npm install date-fns`（或 `pnpm add` / `yarn add` / `bun add date-fns`）
- 核心认知：**纯函数 + 不可变**——`addDays(d, 1)` 返回新 `Date`，`d` 不变
- 导入：**具名导入** `import { format, addDays } from "date-fns"`（利于 tree-shaking）
- 格式化：`format(date, "yyyy-MM-dd")` → 字符串
- 解析：ISO 字符串用 `parseISO(str)`；自定义格式用 `parse(str, fmt, refDate)`
- 增减：`addDays` / `subDays` / `addMonths` / `addHours`…（返回新 Date）
- 差值：`differenceInDays(a, b)` / `differenceInHours`…（返回数字）
- 比较：`isBefore` / `isAfter` / `isSameDay` / `compareAsc`
- ⚠️ token 与 Moment **不同**：年用 `yyyy`（非 `YYYY`），日用 `dd`（非 `DD`）
- ⚠️ 时区需装 `@date-fns/tz`，配 `{ in: tz("...") }` 选项（v4 起）

## 一、date-fns 是什么

官方一句话定位：「**modern JavaScript date utility library**」。三个关键点：

1. **函数式 + 纯函数**：每个能力是一个独立函数，接收原生 `Date`、返回新值，无副作用。
2. **不可变**：`addDays`、`startOfDay`、`setHours` 等都返回**全新** `Date`，绝不修改入参——和 Moment 的可变对象恰好相反。
3. **可 tree-shaking**：200+ 个互相独立的小函数 + ESM，配合具名导入，打包器只保留你 `import` 的那几个。

```js
import { format, addDays } from "date-fns";

const d = new Date(2024, 0, 1); // 2024-01-01（注意月份 0-based）
const d2 = addDays(d, 5); // 新 Date：2024-01-06
format(d, "yyyy-MM-dd"); //=> '2024-01-01'（d 没被改动）
```

> 边界提醒：date-fns 不在 `Date.prototype` 挂方法，没有 `date.addDays(1)` 这种写法；也没有 `new DateFns(...)` 这种包装类。一切都是「函数(数据)」。

## 二、安装与第一个函数

```bash
npm install date-fns
```

```js
import { format, compareAsc } from "date-fns";

format(new Date(2014, 1, 11), "yyyy-MM-dd");
//=> '2014-02-11'

// 排序：compareAsc 返回 -1 / 0 / 1
const dates = [new Date(1995, 6, 2), new Date(1987, 1, 11), new Date(1989, 6, 10)];
dates.sort(compareAsc);
//=> [1987-02-11, 1989-07-10, 1995-07-02]
```

## 三、格式化：format

`format(date, formatString, options?)` 按 token 把 `Date` 转成字符串。token 遵循 **Unicode TR#35**：

| 含义 | token | 示例 |
|---|---|---|
| 四位日历年 | `yyyy` | 2024 |
| 两位月 | `MM` | 02 |
| 两位月内日 | `dd` | 11 |
| 24 小时制时 | `HH` | 14 |
| 分 / 秒 | `mm` / `ss` | 30 / 00 |
| 月名（按 locale） | `MMMM` | February |
| 星期几 | `EEEE` | Monday |
| 长本地化日期 | `PPP` | May 29th, 1453 |

```js
format(new Date(2024, 1, 11, 14, 30), "yyyy-MM-dd HH:mm"); //=> '2024-02-11 14:30'
```

::: warning 与 Moment 不同的高频坑
- 年份用小写 `yyyy`，**大写 `YYYY` 是「本地周编号年」**，并非日历年；
- 月内日用小写 `dd`，**大写 `DD` 是「一年中的第几天」**（day of year）；
- date-fns 默认把 `YYYY`/`DD` 当「受保护 token」，直接用会告警或抛错。

迁移 Moment 的 `'YYYY-MM-DD'` 请改成 `'yyyy-MM-dd'`。
:::

字面量文字用**单引号**转义（不是 Moment 的方括号）：

```js
format(new Date(2024, 1, 11), "yyyy '年' MM '月' dd '日'"); //=> '2024 年 02 月 11 日'
```

## 四、解析：parseISO 与 parse

```js
import { parseISO, parse } from "date-fns";

// 1) ISO 8601 字符串 → 用 parseISO（行为比 new Date 更可控）
parseISO("2024-02-11T11:30:30"); //=> 对应 Date

// 2) 自定义格式 → 用 parse(字符串, 格式串, 参考日期)
parse("11.02.2024", "dd.MM.yyyy", new Date()); //=> 2024-02-11
```

> `parse` 的第三个参数 `referenceDate` **必须传**：它为被解析串中缺失的字段提供默认值（上下文）。不确定传什么就传 `new Date()`。

## 五、增减：addX / subX

```js
import { addDays, subDays, addMonths, addHours } from "date-fns";

addDays(new Date(2024, 0, 1), 7); //=> 2024-01-08
subDays(new Date(2024, 0, 10), 3); //=> 2024-01-07
addMonths(new Date(2024, 0, 31), 1); //=> 2024-02-29（自动处理月末）
addHours(new Date(2024, 0, 1, 23), 2); //=> 2024-01-02 01:00
```

> 全是纯函数，返回新 `Date`。`subDays(d, 3)` 等价 `addDays(d, -3)`，但语义更直接。

## 六、差值：differenceInX

```js
import { differenceInDays, differenceInHours, differenceInCalendarDays } from "date-fns";

differenceInDays(new Date(2024, 0, 10), new Date(2024, 0, 1)); //=> 9
differenceInHours(new Date(2024, 0, 1, 12), new Date(2024, 0, 1)); //=> 12
```

> `differenceInDays` 数「完整 24 小时段」；`differenceInCalendarDays` 数「跨了几个日历日界限」（忽略时分秒），两者在跨午夜但不足 24h 时结果不同。

## 七、比较：isBefore / isSameDay / compareAsc

```js
import { isBefore, isAfter, isEqual, isSameDay, compareAsc } from "date-fns";

isBefore(new Date(2024, 0, 1), new Date(2024, 0, 2)); //=> true
isSameDay(new Date(2024, 0, 1, 9), new Date(2024, 0, 1, 22)); //=> true（同一天，忽略时分秒）
isEqual(new Date(2024, 0, 1, 9), new Date(2024, 0, 1, 22)); //=> false（比到毫秒）
```

## 八、相对时间：formatDistance

```js
import { formatDistance, formatDistanceToNow, subDays } from "date-fns";

formatDistance(subDays(new Date(), 3), new Date(), { addSuffix: true });
//=> "3 days ago"

formatDistanceToNow(subDays(new Date(), 3), { addSuffix: true });
//=> "3 days ago"（以「现在」为基准的便捷版）
```

---

掌握核心用法后，进入 [指南 · 基础](./guide-line/base)：纯函数/不可变心智、token 体系、locale 本地化、`Invalid Date` 处理。
