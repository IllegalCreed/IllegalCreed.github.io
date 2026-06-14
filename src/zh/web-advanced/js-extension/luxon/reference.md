---
layout: doc
outline: [2, 3]
---

# 参考

> Luxon **3.x** 常用 API、`toFormat` token、`toLocaleString` 预设、`Settings` 速查。机器交换优先 `toISO`，人类阅读优先 `toLocaleString`，`toFormat` 仅用于特殊自定义格式。

## 一、DateTime 创建

| 方法 | 作用 |
|---|---|
| `DateTime.now()` | 当前时刻（本地时区），等价无参 `local()` |
| `DateTime.local(y, mo, d, h, mi, s)` | 本地时区构造，月份 1-based |
| `DateTime.utc(...)` | UTC 时区构造 |
| `DateTime.fromObject(obj, opts)` | 由 `{ year, month, ... }` 构造，`opts` 可含 `zone`/`locale`/`numberingSystem` |
| `DateTime.fromISO(str, opts)` | 解析 ISO 8601（宽松），`opts` 可含 `zone`/`setZone` |
| `DateTime.fromFormat(str, fmt, opts)` | 按 token 严格解析，`opts` 可含 `locale`/`zone` |
| `DateTime.fromRFC2822` / `fromHTTP` / `fromSQL` | 解析对应技术格式 |
| `DateTime.fromMillis` / `fromSeconds` | 由 Unix 时间戳构造 |
| `DateTime.fromJSDate(date, opts)` | 由原生 `Date` 构造 |

## 二、DateTime 取值（getter 属性）

| 属性 | 含义 |
|---|---|
| `year` / `month` / `day` | 年 / 月（1-based） / 日 |
| `hour` / `minute` / `second` / `millisecond` | 时 / 分 / 秒 / 毫秒 |
| `weekday` | ISO 星期（周一=1 … 周日=7） |
| `ordinal` / `quarter` / `weekNumber` | 年内第几天 / 季度 / ISO 周数 |
| `zoneName` / `offset` | IANA 时区名 / 偏移分钟数 |
| `offsetNameShort` / `offsetNameLong` | 'EDT' / 'Eastern Daylight Time' |
| `isInDST` / `isOffsetFixed` | 是否夏令时 / 是否固定偏移 |
| `isValid` / `invalidReason` / `invalidExplanation` | 有效性与失败原因 |
| `locale` / `numberingSystem` / `outputCalendar` | 本地化设置 |

## 三、运算与修改（均返回新实例）

| 方法 | 作用 |
|---|---|
| `plus(dur)` / `minus(dur)` | 加 / 减（对象或 `Duration`），多单位从高阶到低阶 |
| `set(obj)` | 设置字段，如 `set({ hour: 3 })` |
| `startOf(unit)` / `endOf(unit)` | 单位起点 / 终点（`'day'`/`'month'`/`'year'`…） |
| `setZone(zone, opts)` | 换时区，`{ keepLocalTime }` 保留钟点 |
| `toUTC()` / `toLocal()` | 转 UTC / 系统本地 |
| `setLocale(loc)` / `reconfigure(opts)` | 改语言 / 重配置 |
| `diff(other, units?)` | 差值 → `Duration`（默认毫秒；可传单位数组） |
| `diffNow(units?)` | 与现在的差值 |
| `hasSame(other, unit)` | 是否同一日历刻度（同年/月/日） |
| `equals(other)` | 元数据感知的相等（时区/locale 也要一致） |

## 四、DateTime 输出

| 方法 | 输出示例 |
|---|---|
| `toISO()` | `'2024-05-15T11:32:00.000-04:00'`（机器首选） |
| `toISODate()` / `toISOTime()` / `toISOWeekDate()` | `'2024-05-15'` / `'11:32:00.000-04:00'` / `'2024-W20-3'` |
| `toLocaleString(opts?)` | 本地化串（人类首选），传预设或 Intl 选项 |
| `toFormat(fmt, opts?)` | 自定义 token 格式 |
| `toRFC2822()` / `toHTTP()` | 邮件 / HTTP 头格式 |
| `toRelative()` / `toRelativeCalendar()` | `'2 days ago'` / `'yesterday'`（依赖 Intl.RelativeTimeFormat） |
| `toMillis()` / `valueOf()` | Unix 毫秒数（`valueOf` 支撑 `+dt` 与大小比较） |
| `toSeconds()` / `toUnixInteger()` | 带小数秒 / 取整秒 |
| `toObject()` / `toJSDate()` | 字段对象 / 原生 `Date` |

## 五、toFormat 常用 token

| token | 含义 | 示例 |
|---|---|---|
| `yyyy` / `yy` | 年（4 位 / 2 位） | `2024` / `24` |
| `M` / `MM` | 月数字（不补零 / 补零） | `5` / `05` |
| `MMM` / `MMMM` | 月名（缩写 / 全称，format 形态） | `May` / `May` |
| `LLL` / `LLLL` | 月名（standalone 形态，词形变化语言下不同） | `May` / `May` |
| `d` / `dd` | 日（不补零 / 补零） | `5` / `05` |
| `H` / `HH` | 24 小时制 | `9` / `13` |
| `h` / `hh` | 12 小时制 | `1` / `01` |
| `m` / `mm` / `s` / `ss` | 分 / 秒 | `7` / `07` |
| `a` | 上午/下午 | `AM` |
| `E` / `EEE` / `EEEE` | 星期（数字 / 缩写 / 全称，format） | `3` / `Wed` / `Wednesday` |
| `ccc` / `cccc` | 星期（standalone 缩写 / 全称） | `Wed` / `Wednesday` |
| `ZZ` / `ZZZ` | 偏移（`+05:00` / `+0500`） | — |
| `ZZZZ` / `ZZZZZ` | 时区名（缩写 / 全称） | `EST` / `Eastern Standard Time` |
| `z` | IANA 时区 | `America/New_York` |
| `X` / `x` | Unix 秒 / 毫秒 | — |
| `'文字'` | 单引号转义字面量；`''` 表示一个字面单引号 | — |

> 宏 token：`D`/`DD`/`DDD`（本地化日期）、`t`/`tt`（本地化时间）、`f`/`ff`/`F`/`FF`（日期+时间），借 Intl 产出与 `toLocaleString` 预设对应的串。

## 六、toLocaleString 预设常量（部分）

| 常量 | en-US 示例 |
|---|---|
| `DATE_SHORT` | `10/14/1983` |
| `DATE_MED` | `Oct 14, 1983` |
| `DATE_FULL` | `October 14, 1983` |
| `DATE_HUGE` | `Friday, October 14, 1983` |
| `TIME_SIMPLE` | `1:30 PM` |
| `TIME_24_SIMPLE` | `13:30` |
| `DATETIME_MED` | `Oct 14, 1983, 1:30 PM` |
| `DATETIME_FULL` | `October 14, 1983 at 1:30 PM EDT` |
| `DATETIME_HUGE` | `Friday, October 14, 1983 at 1:30 PM Eastern Daylight Time` |

> 预设本质是 `Intl.DateTimeFormat` 选项对象，可解构修改：`{ ...DateTime.DATE_SHORT, weekday: "long" }`。也可直接传自定义 Intl 选项：`toLocaleString({ month: "long", day: "numeric" })`。

## 七、Duration / Interval 常用方法

| Duration 方法 | 作用 |
|---|---|
| `Duration.fromObject({ hours, minutes })` | 创建 |
| `as(unit)` | 换算为单一单位的**数字** |
| `shiftTo(...units)` | 重分配到给定单位，返回 **Duration** |
| `plus` / `minus` / `negate` | 加 / 减 / 取负 |
| `normalize()` / `rescale()` | 进位归一 / 自动选最合适单位 |
| `toObject()` / `toISO()` | `{ hours, minutes }` / `'PT2H7M'` |

| Interval 方法 | 作用 |
|---|---|
| `Interval.fromDateTimes(start, end)` | 创建 |
| `length(unit?)` | 区间长度（传单位返回数字，每次重算） |
| `contains(dt)` / `overlaps(other)` | 包含某点 / 与另一区间重叠 |
| `intersection` / `union` | 交集 / 并集 |
| `splitBy(dur)` / `splitAt(...dts)` / `divideEqually(n)` | 按时长切 / 按点切 / 等分（返回 `Interval[]`） |

## 八、Settings 与 Info

```ts
import { Settings, Info } from "luxon";

Settings.defaultZone = "Asia/Tokyo";       // 全局默认时区（恢复用 "system"）
Settings.defaultLocale = "zh";             // 全局默认语言
Settings.defaultNumberingSystem = "latn";  // 全局默认数字系统
Settings.throwOnInvalid = true;            // 无效操作改为抛错
Settings.twoDigitCutoffYear = 70;          // 两位数年份世纪分界（默认 60）

Info.months("long", { locale: "fr" });     // ['janvier', 'février', ...]
Info.weekdays("long", { locale: "fr" });   // ['lundi', 'mardi', ...]
Info.features();                            // { relative: false } 等能力探测
```

---

命令查完，进 [指南 · 基础](./guide-line/base) 理解日历数学，或 [指南 · 进阶](./guide-line/advanced) 看时区与本地化实战。
