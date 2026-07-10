---
layout: doc
---

# type-fest

::: tip 本篇范围
本篇聚焦 **type-fest**——Sindre Sorhus 维护的「a collection of essential TypeScript types」。重点在：**纯类型、零运行时**的本质（只 `import type`）、补齐 TS 内置工具类型空白的几大类型族——对象（`PartialDeep`/`ReadonlyDeep`/`SetOptional`/`SetRequired`/`Merge`/`OverrideProperties`/`RequireAtLeastOne`）、字符串（`CamelCase`/`SnakeCase`/`Split`/`Replace`）、标称类型（`Tagged`；旧 API `Opaque` 已废弃）、JSON（`Jsonify`/`JsonValue`）、其它（`Simplify`/`LiteralUnion`/`Except`/`Promisable`/`UnionToIntersection`），以及与手写工具类型的取舍、TS 版本要求。版本基线 **type-fest 5.8.0**，要求 **Node.js ≥20、TypeScript ≥5.9、ESM 与 `strict: true`**。
:::

type-fest 由 **Sindre Sorhus** 发起，官方一句话定位是「**A collection of essential TypeScript types**」——一组开箱即用的实用 TypeScript 类型。它最关键的特征是**纯类型、零运行时**：所有导出都是 `type` 声明，编译后**不产生任何 JavaScript 代码**，因此应当用 `import type` 引入。它的使命是补齐 TS 内置工具类型（`Partial`/`Pick`/`Omit`/`Readonly`…）覆盖不到的常见需求。

理解 type-fest 的关键，是认清这些类型大多对应一个「**社区普遍需要、但 TS 尚未内置**」的能力——很多类型的源码注释会链接到对应的 TypeScript issue。它把这些边界极多、手写极易出错的类型（深层递归、分布式条件、索引签名处理等）做成**经过测试、社区验证**的实现。当前基线是 **5.8.0**；`Opaque`/`UnwrapOpaque` 仍有导出但已标记 deprecated，推荐改用能力更完整的 `Tagged`/`UnwrapTagged`；`Simplify` 可摊平交叉类型改善编辑器悬浮提示，`LiteralUnion` 则解决「字面量联合被 `string` 吸收后丢失补全」的问题。

## 评价

**优点**

- **纯类型、零运行时**：编译后不产生任何 JS，对运行时性能与打包体积零影响，`import type` 即用即走
- **补齐内置空白**：深层 `PartialDeep`/`ReadonlyDeep`/`RequiredDeep`、标称类型 `Tagged`、字符串大小写、JSON 序列化形态、「至少/恰好一个键」等内置做不到的变换
- **经过验证、文档完善**：每个类型的 source 注释都附带用例与设计动机，覆盖大量边界，省去自己手写递归类型的踩坑
- **单一职责的 essential 类型**：类型粒度小、组合性强，可像积木一样拼出复杂约束
- **改善开发体验**：`Simplify` 让悬浮提示从一长串交叉变成干净对象；`LiteralUnion` 在「推荐值 + 允许自定义」时保住补全
- **与内置/语言演进互补**：内置能力足够时优先用标准类型，type-fest 聚焦仍缺失或边界更完整的部分

**缺点**

- **纯类型，不做运行时校验**：与 `zod`/`valibot` 是两个维度——校验用户输入合法性这类需求它无能为力
- **复杂类型可能拖慢编译**：深层变换、长路径推导等极复杂递归类型会增加 `tsc`/编辑器的类型检查耗时（与运行时无关）
- **工具链基线较新**：5.8.0 要求 Node.js ≥20、TypeScript ≥5.9、ESM 与 strict；升级主版本前要先核对 CI、编辑器和下游库
- **与同类库功能重叠**：`ts-toolbelt`、`utility-types` 等定位相近，宜择一为主，避免概念重复
- **强约束类型的局限**：如 `RequireExactlyOne` 受限于「TS 无法编译期穷举运行时所有键」，对未知额外键无能为力

## 文档地址

[type-fest README](https://github.com/sindresorhus/type-fest#readme)

## GitHub 地址

[sindresorhus/type-fest](https://github.com/sindresorhus/type-fest)

## 幻灯片地址

<a href="/SlideStack/type-fest-slide/" target="_blank">type-fest</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=type-fest" target="_blank" rel="noopener noreferrer">type-fest 测试题</a>
