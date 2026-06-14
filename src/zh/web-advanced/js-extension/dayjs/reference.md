---
layout: doc
outline: [2, 3]
---

# 参考

> Day.js 常用 API、format token 与官方插件清单速查。版本基线 **Day.js 1.11.x**。标注「插件」者需先 `dayjs.extend()`。

## 一、解析（构造）

| 写法 | 说明 |
|---|---|
| `dayjs()` | 当前时刻（本地时区） |
| `dayjs('2024-01-15')` | ISO 8601 字符串（核心可靠支持） |
| `dayjs(new Date())` | 原生 Date |
| `dayjs(1705276800000)` | Unix **毫秒**时间戳 |
| `dayjs.unix(1705276800)` | Unix **秒**时间戳（× 1000） |
| `dayjs(existing)` / `.clone()` | 克隆 |
| `dayjs(str, format)` | 自定义格式（**插件** customParseFormat） |
| `dayjs.utc(...)` | UTC 模式解析（**插件** utc） |
| `dayjs.tz(str, zone)` | 按时区解析（**插件** timezone，依赖 utc） |
| `dayjs({ year, month, day })` | 对象（**插件** objectSupport） |

## 二、取值 / 设值

| 方法 | 含义 | 备注 |
|---|---|---|
| `year()` / `year(v)` | 年 | |
| `month()` / `month(v)` | 月 | **零基**（一月=0） |
| `date()` / `date(v)` | 月中第几天 | 1-31 |
| `day()` / `day(v)` | 星期几 | **0=周日**, 6=周六 |
| `hour()` / `minute()` / `second()` / `millisecond()` | 时/分/秒/毫秒 | |
| `get(unit)` / `set(unit, v)` | 通用取/设值 | 返回新实例 |
| `quarter()` | 季度 | **插件** quarterOfYear |
| `week()` / `isoWeek()` | 周 | **插件** weekOfYear / isoWeek |
| `dayOfYear()` | 一年第几天 | **插件** dayOfYear |

> 所有 setter 都遵循**不可变**——返回新实例，不改原对象。

## 三、操作

| 方法 | 作用 |
|---|---|
| `add(v, unit)` | 增（返回新实例） |
| `subtract(v, unit)` | 减 |
| `startOf(unit)` | 单位起点（如当月 1 号 00:00） |
| `endOf(unit)` | 单位终点（如当天 23:59:59.999） |

单位：`year/y`、`month/M`、`week/w`、`day/d`、`hour/h`、`minute/m`、`second/s`、`millisecond/ms`。

## 四、查询

| 方法 | 来源 |
|---|---|
| `isBefore(d[, unit])` | 核心 |
| `isAfter(d[, unit])` | 核心 |
| `isSame(d[, unit])` | 核心（带粒度参数） |
| `isValid()` | 核心 |
| `isBetween(a, b)` | **插件** isBetween |
| `isSameOrBefore` / `isSameOrAfter` | **插件**（各一个） |
| `isLeapYear()` | **插件** isLeapYear |
| `isToday` / `isYesterday` / `isTomorrow` | **插件**（各一个） |

## 五、显示 / 输出

| 方法 | 返回 |
|---|---|
| `format([template])` | 字符串；无模板→ ISO 8601 |
| `diff(d[, unit[, float]])` | 差值（默认毫秒；第三参 true 返回浮点） |
| `valueOf()` | 毫秒时间戳 |
| `unix()` | 秒时间戳 |
| `toDate()` | 原生 Date |
| `toISOString()` | UTC ISO 字符串 |
| `toJSON()` / `toString()` | JSON / 字符串 |
| `daysInMonth()` | 当月天数 |
| `fromNow()` / `from()` / `toNow()` / `to()` | 相对时间（**插件** relativeTime） |
| `toArray()` / `toObject()` | **插件** toArray / toObject |

## 六、format token

| token | 输出 | token | 输出 |
|---|---|---|---|
| `YYYY` / `YY` | 2024 / 24 | `dddd` / `ddd` / `dd` | Sunday / Sun / Su |
| `MM` / `M` | 01-12 / 1-12 | `HH` / `H` | 00-23（24 时制） |
| `MMMM` / `MMM` | January / Jan | `hh` / `h` | 01-12（12 时制） |
| `DD` / `D` | 01-31 / 1-31 | `mm` / `ss` | 00-59 |
| `A` / `a` | AM PM / am pm | `SSS` | 000-999（毫秒） |
| `Z` / `ZZ` | +08:00 / +0800 | `[文本]` | 方括号转义 |

> 本地化 `L`/`LL`/`LLL`/`LLLL`/`LT`/`LTS` → **插件** localizedFormat。进阶 `Q`/`Do`/`k`/`X`(秒戳)/`x`(毫秒戳)/`w` → **插件** advancedFormat。

## 七、本地化

| API | 作用 |
|---|---|
| `import 'dayjs/locale/zh-cn'` | 加载语言文件（默认仅内置 `en`） |
| `dayjs.locale('zh-cn')` | 全局切换语言 |
| `dayjs().locale('zh-cn')` | 实例级语言（不动全局） |
| `dayjs.updateLocale('en', {...})` | 改语言配置（**插件** updateLocale） |

## 八、官方插件清单（按需 extend）

| 插件 | 作用 |
|---|---|
| `utc` | UTC 模式（`dayjs.utc`/`.utc()`/`.local()`） |
| `timezone` | IANA 时区（依赖 utc，靠 Intl） |
| `relativeTime` | `.fromNow()` 等相对时间 |
| `customParseFormat` | 自定义格式解析 + 严格模式 |
| `localizedFormat` | `L`/`LL`/`LLL` 本地化 token |
| `advancedFormat` | `Q`/`Do`/`X`/`x`/`k` 进阶 token |
| `duration` | `dayjs.duration()` 时长 |
| `isBetween` | `.isBetween()` |
| `isSameOrBefore` / `isSameOrAfter` | 含相等的比较 |
| `isLeapYear` | `.isLeapYear()` |
| `isToday` / `isYesterday` / `isTomorrow` | 日期判断 |
| `quarterOfYear` | `.quarter()` |
| `weekOfYear` / `isoWeek` / `weekYear` | 周相关 |
| `dayOfYear` | `.dayOfYear()` |
| `objectSupport` / `arraySupport` | 对象 / 数组解析 |
| `toArray` / `toObject` | 输出为数组 / 对象 |
| `updateLocale` / `localeData` | 定制 / 读取语言数据 |
| `calendar` | `.calendar()` 日历式措辞 |
| `badMutable` | 让对象可变（仅兼容，不推荐） |

---

API 查完，进 [指南 · 基础](./guide-line/base) 理解不可变与插件机制，或 [指南 · 进阶](./guide-line/advanced) 看时区 / Duration / 迁移实战。
