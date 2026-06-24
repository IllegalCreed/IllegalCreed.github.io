---
layout: doc
outline: [2, 3]
---

# Date 与 Temporal

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- `Date` 七大坑：**月份从 0 开始**、`getDay()` 是星期几（非几号）、可变、只到毫秒、时区只有本地/UTC、解析不一致、无内建格式化
- 建 `Date`：`new Date()` 当前、`new Date(2026, 5, 25)`（月份 5 = 6 月！）、`new Date("2026-06-25")`（**当 UTC**）、`new Date(ms)`
- 读：`getFullYear` / `getMonth`（0–11）/ `getDate`（1–31，几号）/ `getDay`（0–6，星期）/ `getHours`…；带 `getUTC*` 变体
- 时间戳：`Date.now()` 与 `date.getTime()` 返回自 1970-01-01 UTC 的毫秒数
- **`Temporal`**：TC39 **Stage 4**、列入 **ES2026**；已发 **Chrome/Edge 144+、Firefox 139+**，**Safari 暂未**（约 65% 全球）→ 非 Baseline，生产用配 polyfill
- `Temporal` 优势：**不可变**、**纳秒精度**、**月份从 1 开始**、**显式时区**、**多日历系统**
- `Temporal` 类型：`Temporal.Now` / `Instant` / `ZonedDateTime` / `PlainDate` / `PlainTime` / `PlainDateTime` / `PlainYearMonth` / `PlainMonthDay` / `Duration`
- polyfill：`@js-temporal/polyfill`（提案冠军维护）或 `temporal-polyfill`（FullCalendar）
- `Intl`：`Intl.DateTimeFormat` 按地区格式化日期、`Intl.NumberFormat` 格式化数字/货币、`Intl.RelativeTimeFormat` 相对时间
- 过渡期实战：旧代码 + 没把握用 Temporal → 仍可用成熟库（date-fns / Day.js）；新项目可在配 polyfill 下试用 Temporal

## `Date`：用了 30 年，坑也攒了 30 年

`Date` 是 JavaScript 自诞生起的日期 API，照搬了早期 Java 的设计，缺陷众多。先看怎么用，再逐个数坑。

```js
// 四种构造方式
new Date(); // 当前时刻
new Date(2026, 5, 25); // 2026 年 6 月 25 日（注意月份参数 5 = 6 月！）
new Date("2026-06-25"); // 解析字符串（仅日期串按 UTC 解释，见下方警告）
new Date(1782000000000); // 由毫秒时间戳构造

// 读取（注意各方法的取值范围与命名陷阱）
const d = new Date(2026, 5, 25, 14, 30);
d.getFullYear(); // 2026
d.getMonth(); // 5（0–11，要 +1 才是人类月份！）
d.getDate(); // 25（1–31，是"几号"）
d.getDay(); // 4（0–6，是"星期几"，0=周日）
d.getHours(); // 14
Date.now(); // 当前毫秒时间戳
d.getTime(); // 该日期的毫秒时间戳
```

### 七大坑

1. **月份从 0 开始**：`new Date(2026, 5, 25)` 是 6 月不是 5 月；`getMonth()` 返回 5。日期类 Bug 的头号来源。
2. **`getDate` 与 `getDay` 极易混**：`getDate()` 是「几号」(1–31)，`getDay()` 是「星期几」(0–6)。命名反直觉。
3. **可变（mutable）**：`date.setMonth(...)` 等 setter 原地修改对象，传给函数后被偷改是常见副作用源。
4. **只到毫秒**：精度止步毫秒，无法表达微秒/纳秒。
5. **时区支持薄弱**：只能在「本地时区」和「UTC」之间切，无法表达任意指定时区（如「东京时间」）。
6. **解析不一致**：字符串解析行为历史上各浏览器有别；尤其 `new Date("2026-06-25")` 这种**纯日期串按 UTC** 解释，而 `new Date("2026-06-25T00:00")` 按**本地**——同一天可能差出一天。
7. **无内建格式化**：想输出「2026年6月25日 周四」得手动拼，或借助 `Intl`。

```js
// 可变性的坑：原对象被偷改
const d = new Date(2026, 0, 31);
d.setMonth(d.getMonth() + 1); // 想 +1 个月……
d.getMonth(); // 2（3 月！因为 1 月 31 + 1 月溢出到 3 月初）—— 边界更要命
```

::: warning `new Date("...")` 的解析陷阱
`new Date("2026-06-25")`（纯日期，无时间）被当成 **UTC 午夜**；在东八区读出来会变成「6 月 25 日 08:00」甚至显示为前一天。而 `new Date("2026-06-25T00:00:00")`（带时间）按**本地时区**。需要稳定行为时，要么用 `new Date(年, 月, 日)` 数字构造，要么改用下面的 `Temporal`。
:::

## `Temporal`：根治 `Date` 的下一代 API

`Temporal` 是从零设计的现代日期时间 API，专门解决上述所有问题。

### 现状：已经落地了（重点）

- **标准进度**：TC39 **Stage 4**（2024 年达成，已是「定案、等待并入规范」的最高阶段），列入 **ECMAScript 2026**。
- **浏览器支持**：已在 **Chrome 144+、Edge 144+、Firefox 139+** 发布；**Safari 尚未支持**（仅在 Technology Preview 中、默认关闭）。Node.js 也在新版逐步跟进。
- **Baseline 状态**：因 Safari 缺席，**目前不是 Baseline**（属「有限可用 / limited availability」，约 65% 全球用户覆盖）。

结论：**Temporal 不再是「纸面提案」，主流浏览器已能直接运行**——值得现在就学、在能控制运行环境的场景（如装了 polyfill 的应用、或仅面向 Chromium/Firefox 的内部工具）开始用。但因 Safari 未支持，**面向公网的生产代码需配 polyfill 降级**。

```bash
# 生产降级：装官方/社区 polyfill 即可在所有环境用上 Temporal
npm i @js-temporal/polyfill   # 提案冠军维护
# 或 npm i temporal-polyfill  # FullCalendar 维护
```

```js
// polyfill 用法：从包里导入 Temporal（原生支持的环境可直接用全局 Temporal）
import { Temporal } from "@js-temporal/polyfill";
```

### Temporal 解决了什么

| `Date` 的问题 | `Temporal` 的做法 |
| --- | --- |
| 可变，setter 有副作用 | **不可变**：`.with()` / `.add()` 等都返回新对象 |
| 只到毫秒 | **纳秒精度** |
| 月份从 0 开始 | **月份从 1 开始**，符合直觉 |
| 时区只有本地 / UTC | **显式时区**：`ZonedDateTime` 接受任意 IANA 时区 |
| 只支持公历 | **多日历系统**：默认 ISO 8601，可用希伯来 / 中国农历 / 日本等 |
| 一个对象身兼数职、易误用 | **按用途拆成多个专注的类型** |

### 核心类型一览

| 类型 | 表示什么 |
| --- | --- |
| `Temporal.Now` | 获取「当前」时间的命名空间（类似 `Math` 那样的工具集） |
| `Temporal.Instant` | 时间轴上的一个精确点（纳秒，无时区无日历） |
| `Temporal.ZonedDateTime` | 带时区与日历的完整日期时间（最「全」的类型） |
| `Temporal.PlainDate` | 只有日期，无时间无时区（如「生日」） |
| `Temporal.PlainTime` | 只有时间，无日期无时区（如「每天 9:00」） |
| `Temporal.PlainDateTime` | 日期 + 墙上时间，但**不绑定时区** |
| `Temporal.PlainYearMonth` | 只有年月（如「2026 年 6 月」整月活动） |
| `Temporal.PlainMonthDay` | 只有月日（如每年「6 月 25 日」） |
| `Temporal.Duration` | 一段时长（年月日时分秒…的组合） |

### 常用示例

```js
// 取"当前"：Temporal.Now 命名空间
Temporal.Now.instant(); // 当前精确时刻（Instant，纳秒）
Temporal.Now.zonedDateTimeISO(); // 当前带本地时区的完整日期时间
Temporal.Now.plainDateISO(); // 当前日期（PlainDate）

// 创建与解析（月份从 1 开始！）
const date = Temporal.PlainDate.from("2026-06-25");
date.year; // 2026
date.month; // 6（终于不是 5 了）
date.day; // 25

// 不可变运算：返回新对象，原对象不变
const next = date.add({ months: 1, days: 3 }); // 2026-07-28
date.toString(); // "2026-06-25"（原对象纹丝不动）

// 显式时区：同一时刻在不同城市
const tokyo = Temporal.Now.zonedDateTimeISO("Asia/Tokyo");
const ny = tokyo.withTimeZone("America/New_York"); // 转纽约时间，同一时刻

// 计算两日期之差，得到 Duration
const diff = Temporal.PlainDate.from("2026-12-31").since("2026-06-25");
diff.days; // 相差天数

// 与传统 Date 互转
const legacy = new Date();
const inst = legacy.toTemporalInstant(); // Date → Temporal.Instant（原生环境提供）
```

::: tip 学 Temporal、但别急着全量替换线上 Date
Temporal 已经可用且明显更好，**值得现在就掌握**。但在 Safari 仍占重要份额的公网生产环境，要么配 polyfill，要么暂用成熟的第三方库过渡（date-fns、Day.js 这类轻量库 API 稳定、兼容性好）。判断标准是「你能否控制运行环境」——能（内部系统 / 已装 polyfill）就放心用，不能就先降级。
:::

## `Intl`：国际化格式化（概览）

`Date` 没有内建格式化，但 JavaScript 有强大的 `Intl` 命名空间，按用户**地区（locale）**自动产出本地化文本——它是独立于 `Date`/`Temporal` 的标准设施，两者都能配合：

```js
// 日期按地区格式化（不用手拼"年月日"）
new Intl.DateTimeFormat("zh-CN", { dateStyle: "long" }).format(new Date());
// "2026年6月25日"
new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date());
// "June 25, 2026"

// 数字与货币
new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" }).format(1999.5);
// "¥1,999.50"
new Intl.NumberFormat("en-US").format(1234567.89); // "1,234,567.89"（千分位）

// 相对时间（"3 天前" / "in 2 hours"）
new Intl.RelativeTimeFormat("zh-CN", { numeric: "auto" }).format(-3, "day"); // "3天前"
```

`Intl` 还有 `Collator`（按地区排序）、`PluralRules`（复数规则）、`ListFormat`（列表连接）等，是做多语言应用绕不开的标准工具——且 `Temporal` 与 `Intl.DateTimeFormat` 设计上深度协作，未来格式化 `Temporal` 对象就走 `Intl`。

## 小结

`Date` 是必须会用但坑极多的遗留 API——牢记「月份从 0、`getDay` 是星期、可变、纯日期串按 UTC」四件事就能避开多数事故。`Temporal` 是已经落地（ES2026、Chrome/Edge 144+、Firefox 139+，Safari 待跟进）的新一代方案：不可变、纳秒精度、月份从 1、显式时区、多日历——值得现在就学，公网生产配 polyfill 降级。格式化交给 `Intl`。下一页是全叶速查与链接：[参考](../reference)。
