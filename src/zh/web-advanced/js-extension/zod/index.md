---
layout: doc
---

# Zod

::: tip 本篇范围
本篇聚焦 **Zod**——TypeScript 优先的 schema 声明与校验库。重点在：**「声明一次 schema，同时得到运行时校验 + 静态类型」**的核心范式、`z.infer` 类型推导、`parse` 与 `safeParse` 的取舍、`refine`/`superRefine`/`transform`/`pipe` 的组合校验、`coerce` 与默认值/可选/可空、`ZodError` 与 v4 新的错误格式化函数，以及 tRPC / React Hook Form / env 校验等生态。版本基线 **Zod 4**（当前最新 4.4.x），并在关键处点明 **v3 ↔ v4 差异**。
:::

Zod 由 **Colin McDonnell** 发起，官方一句话定位是「**TypeScript-first schema validation with static type inference**」——以 TypeScript 为先的 schema 校验，带静态类型推导。它在运行时校验数据的同时，让你用 `z.infer` 从 schema 直接反推出 TypeScript 类型：**一份 schema 既是运行时校验规则，又是类型的唯一来源**，省掉「手写 interface + 另写校验」的双份维护。

理解 Zod 的关键是它的 **链式 API**：`z.string().min(5).email()` 这样在 schema 上逐级点方法，每个方法返回一个**新的不可变 schema**。拿到 schema 后用 `.parse(data)`（失败抛 `ZodError`）或 `.safeParse(data)`（返回 `{ success, data | error }` 判别联合，不抛错）校验。**2026 年的现状**：主版本已是 **Zod 4**——错误定制统一到单个 `error` 键（取代 v3 的 `message`/`invalid_type_error`/`required_error`/`errorMap`）；字符串格式提升为顶层函数（`z.email()` 取代 `z.string().email()`）；错误格式化改用顶层 `z.treeifyError`/`z.flattenError`/`z.prettifyError`（取代 v3 实例方法 `error.format()`/`error.flatten()`）；内置 `z.toJSONSchema`；并推出可摇树的极小变体 **Zod Mini**（`zod/mini`）。

## 评价

**优点**

- **声明一次，类型与校验同源**：`z.infer<typeof Schema>` 从 schema 推导静态类型，杜绝「interface 与校验规则不一致」
- **链式 API 人体工学好**：`z.string().min(5).email()` 直观可读，组合性强，IDE 自动补全友好
- **零依赖、环境无关**：纯 TS 实现，前端/Node/Deno/Bun 通用，import 即用
- **校验能力完整**：原语、对象/数组/元组/联合/判别联合/枚举/记录、`refine`/`superRefine`/`transform`/`pipe`/`coerce`、默认值/可选/可空一应俱全
- **错误信息结构化**：`ZodError.issues` 带 `code`/`path`/`message`，v4 的 `treeifyError`/`flattenError`/`prettifyError` 便于对接表单与日志
- **生态庞大**：tRPC、React Hook Form（`@hookform/resolvers/zod`）、env 校验（T3 Env）、`drizzle-zod`、OpenAPI 等深度集成；v4 实现 **Standard Schema** 规范，可被通用工具直接消费
- **v4 全面升级**：解析更快、TypeScript 编译开销更低、核心体积更小，并提供 `zod/mini` 进一步压缩 bundle

**缺点**

- **v3 ↔ v4 差异需留心**：错误定制、字符串格式方法、错误格式化、`z.record`/`z.function` 签名等均有变化，老教程与新版混用易踩坑
- **链式不如函数式好摇树**：Classic 把方法挂在类上，未用到的功能不易被 tree-shake（为此才有 `zod/mini`）
- **运行时有成本**：复杂 schema 的逐字段校验有开销，热路径需评估（v4 已显著优化）
- **类型推导可能拖慢 tsc**：超大/深层嵌套 schema 会增加类型实例化负担（v4 大幅缓解，但仍需注意）
- **默认值语义变了**：v4 的 `.default()` 短路解析（值须匹配输出类型），从 v3 迁移时若依赖旧行为要改用 `.prefault()`

## 文档地址

[Zod Documentation](https://zod.dev)

## GitHub 地址

[colinhacks/zod](https://github.com/colinhacks/zod)

## 幻灯片地址

<a href="/SlideStack/zod-slide/" target="_blank">Zod</a>
