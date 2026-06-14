---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **Luxon 3.x**。深入边界与工程实践：有效性模型与 `throwOnInvalid`、相对时间与 Intl 兼容性、ICU 环境要求、token 体系对位、与 Moment/Day.js/date-fns 的取舍。

## 一、有效性模型：默认软失败

Luxon 遇到坏数据**不抛异常**，而是产出「无效 DateTime」。无效来源主要三类：

- **越界**：`DateTime.local(2024, 2, 40)`（2 月 40 日）、`hour: 28`、`-4 pm`。
- **不支持的时区**：`DateTime.now().setZone("America/Blorp").isValid` 为 `false`。
- **自相矛盾**：`DateTime.fromObject({ year: 2017, month: 5, day: 25, weekday: 3 }).isValid` 为 `false`（5-25 实际是周四，与 weekday:3 冲突）。

无效对象的「退化值」：

```ts
const bad = DateTime.fromISO("not-a-date");
bad.isValid;            // false
bad.invalidReason;      // 'unparsable'（短码）
bad.invalidExplanation; // 人类可读说明
bad.year;               // NaN
bad.toString();         // 'Invalid DateTime'
bad.toISO();            // null
bad.toObject();         // {}
```

无效性会**沿运算传播**：无效 DateTime 的 `diff`/`diffNow` 得到无效 `Duration`；`Interval` 在起点晚于终点、或由无效对象构造时也无效。

```ts
DateTime.local(2017, 28).diffNow().isValid; // false（28 月越界 → 传播为无效 Duration）
```

## 二、让无效尽早暴露：throwOnInvalid

软失败宽容，但可能让坏数据悄悄流过。要尽早暴露，开全局开关：

```ts
import { Settings } from "luxon";
Settings.throwOnInvalid = true;
// 之后任何产生无效 DateTime/Duration/Interval 的操作都直接抛错（含 reason + explanation）
```

**取舍**：好处是问题尽早定位；代价是「软失败」变「硬失败」——所有可能产无效值的路径都需 `try/catch` 或前置校验，否则会中断流程。库作者通常保持默认（不抛）以免连累调用方；应用层若希望 fail-fast 可以打开。

## 三、相对时间：唯一的「部分支持」特性

`toRelative` / `toRelativeCalendar` 依赖 `Intl.RelativeTimeFormat`：

```ts
DateTime.now().minus({ days: 2 }).toRelative();         // '2 days ago'
DateTime.now().plus({ months: 1 }).toRelative();        // 'in 1 month'
DateTime.now().minus({ days: 1 }).toRelativeCalendar();  // 'yesterday'
DateTime.now().minus({ days: 2 }).setLocale("fr").toRelative(); // 'il y a 2 jours'
```

官方 support matrix 明确：若环境缺 `Intl.RelativeTimeFormat`（如 Edge 18、Safari 13、React Native 旧版），Luxon 会「fall back to using English」——**其余功能正常，只有非英文相对时间退回英文**。可探测：

```ts
import { Info } from "luxon";
Info.features(); //=> { relative: false } 表示缺该能力
```

> 另注：Luxon **没有** Moment `Duration#humanize`（把时长本身人性化成「a few seconds」）的等价物。`toRelative` 是「相对某时刻」，语义不同。

## 四、ICU 环境要求：i18n 的隐形前提

Luxon 的本地化与时区**全部来自宿主 Intl（底层 ICU）**，库不打包任何数据。这带来一个常见坑：

> 在缺完整 ICU 的环境里用非英文 locale，会悄悄输出英文或乱码。

- **Node**：13+ 内置完整 ICU，无需动作；更老版本需 `full-icu` 包或带 full ICU 的构建。
- **浏览器**：现代浏览器（最近两个版本）普遍 OK。
- **React Native <0.70（Android）**：默认不带 Intl，需在 `android/app/build.gradle` 把 jsc 切到 `android-jsc-intl`：

```text
- def jscFlavor = 'org.webkit:android-jsc:+'
+ def jscFlavor = 'org.webkit:android-jsc-intl:+'
```

排查口诀：**非英文出不来 → 先怀疑环境 ICU，而不是 Luxon 缺词库**（Luxon 根本不带词库）。

## 五、token 体系对位（迁移必看）

Luxon 的 `toFormat` token 与 Moment **不通用**，文档明说「the same format string cannot be used between the two」：

| 含义 | Luxon | Moment |
|---|---|---|
| 4 位年 | `yyyy` | `YYYY` |
| 2 位年 | `yy` | `YY` |
| 日（补零） | `dd` | `DD` |
| 月名全称 | `MMMM` / `LLLL` | `MMMM` |
| 星期全称 | `EEEE` / `cccc` | `dddd` |
| 24 小时 | `HH` | `HH` |

迁移时**逐个核对格式串**，不能照搬。另外注意 Luxon 区分 `M`（format 形态）与 `L`（standalone 形态）、`E` 与 `c`——在俄语等有词形变化的语言里输出不同（如俄语 `LLLL`='август'、`MMMM`='августа'），英文下通常一致。

## 六、选型：Luxon vs Moment vs Day.js vs date-fns

| 维度 | Luxon | Moment（维护模式） | Day.js | date-fns |
|---|---|---|---|---|
| 范式 | 面向对象 + 不可变 | 面向对象 + 可变 | 面向对象链式 | 纯函数式 |
| 体积 | 中等（富功能） | 较大 | 极小（~2KB 核心 + 插件） | 按需引入，最易 tree-shaking |
| 时区 | 原生 Intl（不打包数据） | moment-timezone 打包数据 | 插件 | 配套 date-fns-tz |
| i18n | 原生 Intl | 自带 locale 文件 | 插件 | 自带 locale 模块 |
| Duration/Interval | 原生齐备 | Duration 有，Interval 需插件 | 弱 | 函数式 |

**选型建议**：

- 需要**一流时区 + 不可变 + 富类型**，且不在意体积 → **Luxon**。
- 极致**包体优先**、API 像 Moment → **Day.js**。
- **纯函数式 + 极致 tree-shaking**、习惯操作原生 `Date` → **date-fns**。
- 新项目**不建议**再选 Moment（已进入维护模式，可变 + 体积大）。

## 七、辨析：记牢这几条边界

- **不打包 tz/locale 数据**：能力随环境 Intl 变，缺 ICU 时 i18n 失灵。
- **不可变**：`plus`/`set` 永远返回新实例，原对象不变。
- **机器 vs 人类**：接口用 `toISO`，显示用 `toLocaleString`，`toFormat` 仅特殊自定义。
- **token 与 Moment 不通用**：`yyyy`≠`YYYY`、`dd`≠`DD`。
- **解析严格**：给程序读的数据用 ISO，别依赖宽松解析。
- **相对时间依赖 Intl.RelativeTimeFormat**：缺失回退英文，且无 `humanize` 等价物。

---

回到 [入门](../getting-started) 复习核心 API，或查 [参考](../reference) 速览 token 与 `Settings`。
