---
layout: doc
---

# Valibot

::: tip 本篇范围
本篇聚焦 **Valibot**——模块化、类型安全的 schema 校验库，定位为 **Zod 的极小体积替代**。重点在：相比 Zod 的 **bundle 体积优势**（起步 < 700 字节，官方对比小约 90%）、**函数式 `pipe()` 管道**与方法链的根本差异、schema + action（校验/转换）的心智模型、`parse`/`safeParse` 与 `InferInput`/`InferOutput`、以及从 Zod 迁移的取舍。版本基线 **Valibot 1.x**（当前最新 1.4.1）。
:::

Valibot 是由 **Fabian Hiller** 发起的开源 schema 校验库，官方一句话定位是「**The modular and type-safe schema library for validating structural data**」。它在运行时校验结构化数据，同时由 schema 静态推导 TypeScript 类型——一份 schema 既是**运行时校验规则**又是**类型来源**。它主打三个特性：**极小体积**（起步不到 700 字节，官方对比比标准 Zod 小约 90%）、**完全类型安全**（`InferInput`/`InferOutput` 双向推导）、**模块化的函数式 API**（每个能力都是独立小函数，用 `pipe()` 组合）。

它的体积优势源自**架构而非压缩**：把每个能力拆成独立函数，配合 `package.json` 的 `"sideEffects": false`，打包器能把没 import 的函数彻底 **tree-shake** 掉。这与 Zod「方法挂在对象/类上」形成对比——官方原话：Zod 那些带额外功能的方法，当前打包器在它们未被调用时**很难摇掉**。所以同样写一个邮箱校验，Valibot 只把 `string`、`email`、`pipe` 这几个用到的函数打进产物。

**心智模型**是理解 Valibot 的关键，分三类构件：**schema**（`string`/`number`/`object`/`array`…定义数据类型，是一切起点）、**action**（`email`/`minLength`/`trim`/`transform`…做校验、转换或元数据，**只能通过 `pipe()` 使用**）、**method**（`parse`/`safeParse`/`pick`/`partial`…以 schema 为第一个参数来使用或改造它）。于是 Zod 的 `z.string().email().minLength(5)` 在 Valibot 里写成 `v.pipe(v.string(), v.email(), v.minLength(5))`——这就是从「方法链」到「函数式管道」的范式转变。

## 评价

**优点**

- **极小 bundle 体积**：起步 < 700 字节，官方对比比标准 Zod 小约 90%、比 Zod Mini 小约 73%；模块化函数式 + `sideEffects:false` 带来彻底 tree-shaking
- **完全类型安全**：一份 schema 同时给出运行时校验与静态类型，`InferInput`/`InferOutput` 区分输入/输出类型，避免「interface + 校验」双份维护
- **零运行时依赖**：dependencies 为空，降低供应链风险与依赖膨胀
- **函数式管道清晰**：`pipe(schema, ...actions)` 数据从左到右逐步处理，校验与转换可读、可组合、可复用
- **API 表达力强**：丰富的 schema（`object`/`strictObject`/`looseObject`/`variant`/`lazy`…）与 action（`transform`/`brand`/`readonly`/`check`/`forward`…），覆盖递归、判别联合、跨字段校验
- **ESM + CommonJS 双格式**：同时提供 `.mjs`/`.cjs` 与对应类型声明，跨 Node / Deno / Bun / 浏览器
- **生态与标准**：实现社区 **Standard Schema** 规范，可被 React Hook Form、TanStack Form 等通过 resolver 直接接入；官方提供 `@valibot/zod-to-valibot` codemod 从 Zod 迁移

**缺点**

- **运行时速度仅中游**：官方坦言约为 Zod v3 的 2 倍，但**明显慢于** Typia、TypeBox（后者用编译器/`Function` 构造器生成优化代码）——它优先小体积与快启动
- **写法范式切换有成本**：从 Zod 的方法链转到 `pipe()` 函数式，初期需适应；大量旧教程基于 0.x，要认准 1.x
- **保留字函数命名**：`enum`/`null`/`undefined`/`void`/`function` 是 JS 保留字，源码导出为 `enum_`/`null_`… 并别名；通配符可写 `v.enum()`，具名导入要写 `enum_`
- **optional 缺省陷阱**：对象里 optional 键缺失且未给默认值时，该字段 pipe（含 transform）不会执行，易踩坑
- **概念密度高**：schema / action / method 三分，加上 `forward`/`partialCheck`/`variant`/`lazy` 等高级件，上手曲线比「一条链点到底」略陡

## 文档地址

[Valibot Documentation](https://valibot.dev)

## GitHub 地址

[fabian-hiller/valibot](https://github.com/fabian-hiller/valibot)

## 幻灯片地址

<a href="/SlideStack/valibot-slide/" target="_blank">Valibot</a>
