---
layout: doc
---

# Luxon

::: tip 本篇范围
本篇聚焦 **Luxon —— 一个不可变、基于原生 Intl 的现代 JS 日期时间库**（`DateTime` / `Duration` / `Interval`）。它是 Moment 团队认可的「精神继任者」，与 Day.js（极小体积）、date-fns（纯函数式）同属「日期时间」选型方向，本篇在对比与定位时一笔带过另两者。版本基线 **Luxon 3.x**。
:::

Luxon 由 Moment 维护者 Isaac Cambron 从零写就，后被 Moment 团队接纳为官方「labs project」。它的设计哲学可以浓缩成四点：**所有类型不可变**（`plus`/`set` 都返回新实例，绝不原地修改）、**明确的 API**（不同方法做不同的事、选项定义清晰）、**时区与本地化复用宿主的原生 Intl**（不在库里打包时区数据库 / locale 数据）、**把日期、时长、区间拆成独立类型**（`DateTime` / `Duration` / `Interval`，外加 `Info` / `Settings` / `Zone`）。

它最该被记牢的一条边界是：**Luxon 不打包时区数据**。`'America/New_York'` 这类 IANA 时区、各国语言的月份/星期名，全都来自运行环境的 `Intl`（底层 ICU）。好处是库体积可控、跟随系统时区数据自动更新；代价是能力随环境而变——老旧或受限环境（如 React Native <0.70 的 Android 默认不带 Intl）可能缺时区或相对时间能力。**2026 年的现状**：现代浏览器（官方支持「最近两个版本」）与 Node 13+（内置完整 ICU）几乎都满足需求；唯一「部分支持」的特性是相对时间 `toRelative`（依赖 `Intl.RelativeTimeFormat`），缺失时回退英文。

## 评价

**优点**

- **不可变**：`plus`/`minus`/`set`/`setZone` 都返回新实例，杜绝「别处偷偷改了我的日期」这类隐蔽 bug
- **一流的时区支持**：基于原生 Intl，直接用任意 IANA 时区，`setZone` / `keepLocalTime` / `Settings.defaultZone` 一应俱全，无需 moment-timezone 那样打包数据
- **真正的国际化**：`toLocaleString` 基于 Intl 自动本地化，`setLocale` 一行切语言，连 `fromFormat` 解析都能本地化
- **富类型**：原生 `Duration`（时长）与 `Interval`（区间），区间运算（`contains`/`overlaps`/`splitBy`/`intersection`）比 Moment 完善
- **清晰的「机器 vs 人类」分工**：机器交换用 ISO（`toISO`/`toISODate`），人类阅读用 `toLocaleString`，自定义格式才用 `toFormat`
- **有效性模型**：坏数据默认产出「无效 DateTime」而非抛错，可查 `isValid`/`invalidReason`；也能开 `Settings.throwOnInvalid` 改为抛错

**缺点**

- **能力依赖环境 Intl**：缺完整 ICU 的老 Node、受限 WebView、React Native 旧版需额外配置，否则本地化/时区可能失灵
- **相对时间未完全成熟**：`toRelative` 依赖 `Intl.RelativeTimeFormat`，环境缺失时回退英文；且没有 Moment `Duration#humanize` 的等价物
- **token 与 Moment 不通用**：年份 `yyyy` vs `YYYY`、日 `dd` vs `DD`，迁移时格式串不能照搬
- **体积不是最小**：富功能换来的体积大于 Day.js（~2KB 核心），极致包体场景未必首选
- **不是纯函数式**：面向对象 + 不可变，不像 date-fns 那样按函数极致 tree-shaking
- **学习曲线**：日历数学 vs 时间数学、Duration vs Interval、`as` vs `shiftTo` 等概念需要理解到位

## 文档地址

[Luxon Documentation](https://moment.github.io/luxon/)

## GitHub 地址

[moment/luxon](https://github.com/moment/luxon)

## 幻灯片地址

<a href="/SlideStack/luxon-slide/" target="_blank">Luxon</a>
