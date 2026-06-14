---
layout: doc
outline: [2, 3]
---

# 参考

> date-fns **常用函数、format token、子模块与时区 API** 速查。版本基线 date-fns 4.x。

## 一、常用函数分组

| 分组 | 代表函数 | 说明 |
|---|---|---|
| 格式化 | `format` · `formatISO` · `formatISO9075` · `formatRFC3339` · `formatRFC7231` | Date → 字符串 |
| 相对时间 | `formatDistance` · `formatDistanceToNow` · `formatDistanceStrict` · `intlFormatDistance` | 人类可读距离 |
| 时长 | `formatDuration` · `intervalToDuration` | Duration 渲染 / 计算 |
| 解析 | `parse` · `parseISO` · `parseJSON` | 字符串 → Date |
| 增减 | `addDays/Months/Years/Hours/Minutes/Weeks` · `subX` · `add` · `sub` | 返回新 Date |
| 差值 | `differenceInDays/Hours/Months/Years/Minutes/Seconds` · `differenceInCalendarDays` · `differenceInBusinessDays` | 返回数字 |
| 起止 | `startOfDay/Week/Month/Year/Hour` · `endOfX` | 归一到边界 |
| 比较 | `isBefore` · `isAfter` · `isEqual` · `compareAsc` · `compareDesc` | 顺序判断 |
| 同周期 | `isSameDay/Month/Year/Hour/Week` | 是否同一周期 |
| 校验 | `isValid` · `isDate` · `isWeekend` · `isFuture` · `isPast` | 谓词 |
| 区间 | `isWithinInterval` · `areIntervalsOverlapping` · `eachDayOfInterval` · `interval` | Interval 操作 |
| 取值 | `getTime` · `getUnixTime` · `getDay` · `getDaysInMonth` · `getISOWeek` | 读字段 |
| 设值 | `set` · `setHours/Minutes/Date/Month/Year` | 返回新 Date |
| 取最值 | `min` · `max` · `closestTo` · `closestIndexTo` · `clamp` | 数组/区间 |
| 取整 | `roundToNearestMinutes` · `roundToNearestHours` | 取整到最近单位 |

## 二、format / parse 常用 token（Unicode TR#35）

| 含义 | token | 示例 | 备注 |
|---|---|---|---|
| 日历年 | `y` `yy` `yyyy` | 2024 / 24 / 2024 | **不是 `Y`** |
| 周编号年 | `Y` `YYYY` | — | 受保护，需 `useAdditionalWeekYearTokens` |
| 月 | `M` `MM` `MMM` `MMMM` | 2 / 02 / Feb / February | |
| 月内日 | `d` `dd` | 11 / 11 | **不是 `D`** |
| 年内日 | `D` `DD` | 283 | 受保护，需 `useAdditionalDayOfYearTokens` |
| 星期 | `E..EEE` `EEEE` `EEEEE` | Mon / Monday / M | 格式型 |
| ISO 星期 | `i` `ii` `iii` `iiii` | 1 / 01 / Mon / Monday | 周一=1 |
| 时(0-23) | `H` `HH` | 14 / 14 | |
| 时(1-12) | `h` `hh` | 2 / 02 | 配 `a` |
| 分 / 秒 | `m` `mm` / `s` `ss` | 30 / 00 | |
| 毫秒 | `S` `SS` `SSS` | 0 / 00 / 000 | |
| AM/PM | `a` `aa` | AM / PM | |
| 时区偏移 | `X` `XX` `XXX` | Z / +0530 / +05:30 | |
| 长本地化日期 | `P` `PP` `PPP` `PPPP` | 按 locale | |
| 长本地化时间 | `p` `pp` | 按 locale | |

> 字面量用单引号转义，连续两个单引号 `''` 表示一个真正的单引号。

## 三、format 常用 options

| 选项 | 含义 |
|---|---|
| `locale` | 本地化语言（从 `date-fns/locale` 具名导入） |
| `weekStartsOn` | 一周第一天：0=周日（默认）…6=周六 |
| `firstWeekContainsDate` | 一年的第一周须包含的日期 |
| `useAdditionalWeekYearTokens` | 允许使用 `YY`/`YYYY` |
| `useAdditionalDayOfYearTokens` | 允许使用 `D`/`DD` |
| `in` | 计算/输出所用时区（配 `@date-fns/tz` 的 `tz()`，v4+） |

## 四、子模块

| 子模块 | 用途 | 导入示例 |
|---|---|---|
| `date-fns` | 主模块（200+ 函数） | `import { format } from "date-fns"` |
| `date-fns/fp` | 函数式变体（柯里化、参数重排） | `import { addYears } from "date-fns/fp"` |
| `date-fns/locale` | 80+ 语言 locale | `import { zhCN } from "date-fns/locale"` |
| `date-fns/constants` | 常量（v3 起移出顶层） | `import { daysInYear } from "date-fns/constants"` |

```js
// fp：柯里化 + 数据在最后，便于组合
import { addYears } from "date-fns/fp";
const addFiveYears = addYears(5); // 等待日期的函数
```

## 五、时区扩展（v4）

`npm install @date-fns/tz`

| 导出 | 类型 | 作用 |
|---|---|---|
| `TZDate` | 类 | 带时区的 Date 扩展（含格式化器） |
| `TZDateMini` | 类 | 轻量版（无格式化器，体积更小） |
| `tz(timeZone)` | 函数 | 给 date-fns 函数的 `in` 选项提供时区上下文 |
| `tzOffset(tz, date)` | 函数 | 取 UTC 偏移（分钟） |
| `tzScan(tz, interval)` | 函数 | 探测 DST 切换 |
| `tzName(tz, date, fmt)` | 函数 | 取时区名 |

```js
import { addDays, isSameDay } from "date-fns";
import { TZDate, tz } from "@date-fns/tz";

// 用法一：TZDate 实例
new TZDate(2024, 2, 13, "Asia/Singapore");

// 用法二：in 选项 + tz()
isSameDay(a, b, { in: tz("Asia/Singapore") });
```

> 旧方案 `date-fns-tz`（第三方）提供 `formatInTimeZone` / `toZonedTime` / `fromZonedTime`，与 `@date-fns/tz` 是不同的包。纯 UTC 计算可用 `@date-fns/utc` 的 `UTCDate`。

## 六、全局默认

```js
import { setDefaultOptions, getDefaultOptions } from "date-fns";
import { zhCN } from "date-fns/locale";

setDefaultOptions({ locale: zhCN, weekStartsOn: 1 }); // 设默认 locale / 周起始
getDefaultOptions(); // 读当前默认
```

> 只设 locale / weekStartsOn / firstWeekContainsDate 等；**不设时区**（时区走 `in` 选项）。

---

命令查完，进 [指南 · 基础](./guide-line/base) 理解机制，或看 [指南 · 进阶](./guide-line/advanced) / [指南 · 专家](./guide-line/expert)。
