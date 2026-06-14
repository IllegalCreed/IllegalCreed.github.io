---
layout: doc
---

# type-fest

::: tip 本篇范围
本篇聚焦 **type-fest**——Sindre Sorhus 维护的「a collection of essential TypeScript types」。重点在：**纯类型、零运行时**的本质（只 `import type`）、补齐 TS 内置工具类型空白的几大类型族——对象（`PartialDeep`/`ReadonlyDeep`/`SetOptional`/`SetRequired`/`Merge`/`OverrideProperties`/`RequireAtLeastOne`）、字符串（`CamelCase`/`SnakeCase`/`Split`/`Replace`）、标称类型（`Tagged`，旧名 `Opaque`）、JSON（`Jsonify`/`JsonValue`）、其它（`Simplify`/`LiteralUnion`/`Except`/`Promisable`/`UnionToIntersection`），以及与手写工具类型的取舍、TS 版本要求。版本基线 **type-fest 4.x**（本地 4.41.0，要求 **TypeScript ≥5.1 + `strict: true`**）。
:::

type-fest 由 **Sindre Sorhus** 发起，官方一句话定位是「**A collection of essential TypeScript types**」——一组开箱即用的实用 TypeScript 类型。它最关键的特征是**纯类型、零运行时**：所有导出都是 `type` 声明，编译后**不产生任何 JavaScript 代码**，因此只能、也应当用 `import type` 引入。它的使命是补齐 TS 内置工具类型（`Partial`/`Pick`/`Omit`/`Readonly`…）覆盖不到的常见需求。

理解 type-fest 的关键，是认清这些类型大多对应一个「**社区普遍需要、但 TS 尚未内置**」的能力——很多类型的源码注释里直接链到对应的 TypeScript issue 并呼吁「upvote if you want this as a built-in」（如 `ReadonlyDeep` → microsoft/TypeScript#13923，`Promisable` → #31394，`LiteralUnion` → #29729）。它把这些边界极多、手写极易出错的类型（深层递归、分布式条件、索引签名处理…）做成**经过充分测试、社区验证**的实现。**2026 年的现状**：主版本是 **type-fest 4.x**；标称类型的 `Opaque`/`UnwrapOpaque` 已被**标记 deprecated，推荐改用 `Tagged`/`UnwrapTagged`**（`Tagged` 支持多标签 + 每标签元数据）；`Simplify` 既能摊平交叉类型改善编辑器悬浮提示，又能把 `interface` 密封成 `type`；`LiteralUnion` 解决「字面量联合被坍缩成 `string` 而丢失自动补全」的老问题。

## 评价

**优点**

- **纯类型、零运行时**：编译后不产生任何 JS，对运行时性能与打包体积零影响，`import type` 即用即走
- **补齐内置空白**：深层 `PartialDeep`/`ReadonlyDeep`/`RequiredDeep`、标称类型 `Tagged`、字符串大小写、JSON 序列化形态、「至少/恰好一个键」等内置做不到的变换
- **经过验证、文档完善**：每个类型的 source 注释都附带用例与设计动机，覆盖大量边界，省去自己手写递归类型的踩坑
- **单一职责的 essential 类型**：类型粒度小、组合性强，可像积木一样拼出复杂约束
- **改善开发体验**：`Simplify` 让悬浮提示从一长串交叉变成干净对象；`LiteralUnion` 在「推荐值 + 允许自定义」时保住补全
- **与内置/语言演进互补**：TS 一旦内置某能力，对应类型会标记废弃并平滑让位（如 `Opaque`→`Tagged`）

**缺点**

- **纯类型，不做运行时校验**：与 `zod`/`valibot` 是两个维度——校验用户输入合法性这类需求它无能为力
- **复杂类型可能拖慢编译**：深层变换、长路径推导等极复杂递归类型会增加 `tsc`/编辑器的类型检查耗时（与运行时无关）
- **版本/API 演进需留心**：`Opaque` 已废弃改用 `Tagged`，老教程与新版混用易踩坑；不同 4.x 小版本对 TS 基线要求可能抬高
- **与同类库功能重叠**：`ts-toolbelt`、`utility-types` 等定位相近，宜择一为主，避免概念重复
- **强约束类型的局限**：如 `RequireExactlyOne` 受限于「TS 无法编译期穷举运行时所有键」，对未知额外键无能为力

## 文档地址

[type-fest README](https://github.com/sindresorhus/type-fest#readme)

## GitHub 地址

[sindresorhus/type-fest](https://github.com/sindresorhus/type-fest)

## 幻灯片地址

<a href="/SlideStack/type-fest-slide/" target="_blank">type-fest</a>
