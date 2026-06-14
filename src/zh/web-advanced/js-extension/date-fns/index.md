---
layout: doc
---

# date-fns

::: tip 本篇范围
本篇聚焦 **date-fns —— 一个函数式、纯函数、不可变、可 tree-shaking 的现代 JS 日期工具库**（200+ 个独立函数，直接操作原生 `Date`）。它与 Day.js（极小体积、链式）、Luxon（面向对象 + 富类型）同属「日期时间」选型方向，本篇在对比与定位时一笔带过另两者。版本基线 **date-fns 4.x**（v4 起内置一等时区支持）。
:::

date-fns 由 Sasha Koss（@kossnocorp）等维护，官方定位是「**modern JavaScript date utility library**」。它的设计哲学可浓缩成四点：**函数式**（每个能力是一个独立函数，而非对象方法）、**纯函数**（同输入同输出、无副作用）、**不可变**（`addDays`/`startOfDay` 等都返回**新** `Date`，绝不原地改入参）、**可摇树**（配合 ESM 与具名导入，只把用到的函数打进产物）。它直接操作原生 `Date`，不引入包装对象，也不污染 `Date.prototype`。

它最该被记牢的一条易错点是：**`format` 的 token 与 Moment.js 不同**——遵循 Unicode Technical Standard #35，四位日历年是小写 `yyyy`（大写 `YYYY` 是「周编号年」）、月内日是小写 `dd`（大写 `DD` 是「一年中的第几天」）。Moment 用户照搬 `YYYY-MM-DD` 多数时候看似正常，年末跨周时却会出错，因此 date-fns 默认把 `YYYY`/`DD` 当「受保护 token」拦截。**2026 年的现状**：最新主版本是 **v4**（v4.0 于 2024-09 发布、首次内置一等时区支持，v4.1 给 `format` 系列补全时区）；时区通过配套包 **`@date-fns/tz`**（`TZDate` 类 + `tz()` 辅助 + 函数的 `in` 选项）实现，旧的第三方 `date-fns-tz` 仍可用但属不同方案。

## 评价

**优点**

- **极致 tree-shaking**：200+ 个独立具名导出函数 + ESM，用 3 个函数就只打 3 个函数的代码，包体随用量增长
- **纯函数 / 不可变**：返回新 `Date`、不改入参、无全局可变状态，契合 React 等不可变数据流，杜绝「别处偷偷改了我的日期」
- **直接用原生 `Date`**：无包装对象、无需 `.toDate()` 往返，与原生 API、第三方库零摩擦
- **覆盖面广**：`format`/`parse`、`addX`/`subX`、`differenceInX`、`startOfX`/`endOfX`、`isX` 比较、`eachXOfInterval`、`Duration` 等一应俱全
- **真正的国际化**：内置 80+ 语言 locale，按需具名导入经 `{ locale }` 选项传入，不把全部语言打进产物
- **v4 一等时区**：`@date-fns/tz` 的 `TZDate` + `tz()` + `in` 选项，让「在某时区计算」明确可控；另有 `@date-fns/utc` 的 `UTCDate` 做纯 UTC 计算
- **稳健的有效性模型**：坏输入多返回 `Invalid Date`（时间值 NaN）而非抛异常，用 `isValid` 守卫

**缺点**

- **写法是函数组合而非链式**：`format(addDays(d,1),'...')` 的嵌套不如 Day.js `dayjs().add(1,'day').format()` 顺手（可用 `date-fns/fp` 做管道缓解）
- **token 与 Moment 不通用**：`yyyy` vs `YYYY`、`dd` vs `DD` 是迁移高频坑，格式串不能照搬
- **时区需额外装包**：核心库不含时区数据，跨时区要装 `@date-fns/tz`（或旧的 `date-fns-tz`），概念上比「自带时区」的库多一层
- **大版本有破坏性变更**：v3 是 ESM 化大重构（默认导出改具名、扁平结构、IE 不再支持），从 v2 升级需改导入写法
- **运行时校验少**：v3 起不再检查参数个数/类型（交给 TypeScript），纯 JS 误用时少了运行时拦截
- **原生 `Date` 的固有坑仍在**：如构造函数月份 0-based（`new Date(2024,1,11)` 是二月），date-fns 沿用原生语义不会替你纠正

## 文档地址

[date-fns Documentation](https://date-fns.org/docs/Getting-Started)

## GitHub 地址

[date-fns/date-fns](https://github.com/date-fns/date-fns)

## 幻灯片地址

<a href="/SlideStack/date-fns-slide/" target="_blank">date-fns</a>
