---
layout: doc
---

# TypeScript

**TypeScript**——由微软开发、Anders Hejlsberg 主导的 **JavaScript 超集**，在 JS 之上叠加了一套「可选、渐进、结构化」的**静态类型系统**。它的心智模型一句话就能说清：**TypeScript = JavaScript + 静态类型 + 编译期检查**。任何合法的 JS 都是合法的 TS，写下类型注解后，编译器（`tsc`）在运行前就能抓出「值的类型对不上」这类最常见的 bug；而这些类型在编译后会被**完全擦除**（type erasure），产物是不含任何类型信息的普通 JavaScript，不引入运行时开销、也不改变 JS 语义。当前稳定版是 **TypeScript 6.0**（npm `latest` 为 6.0.3），它被定位为迈向 **7.0 原生（Go）重写编译器**的「过渡版本」——把 `strict`、`module`、`target` 等默认值升级到现代做法，并弃用一批老选项（`target es5`、`module amd/umd`、`moduleResolution node10` 等）为 7.0 的彻底移除铺路。TypeScript 的价值不在语法糖，而在它用**结构化类型 + 类型推断 + 控制流窄化**这三根支柱，把「大规模 JS 工程的可维护性」提升了一个量级：从编辑器里的自动补全与重构安全，到联合类型/泛型/条件类型/映射类型撑起的类型级建模能力，它已是现代前端与 Node 后端的事实基础设施。

## 评价

**优点**

- **超集 + 渐进式**：JS 是 TS 的子集，`.js` 可逐文件迁移到 `.ts`，也能只靠 `// @ts-check` + JSDoc 给纯 JS 加类型，迁移成本可控、可回退
- **编译期抓 bug**：把「访问 undefined 的属性」「参数类型不匹配」「漏处理联合分支」等高频错误从运行时提前到编译期，`strict` 家族尤其能挡下空值类崩溃
- **一流的编辑器体验**：类型驱动的自动补全、跳转、重命名、内联提示，是 TS 相对 JS 最直接的生产力收益，重构大型代码库时如有护栏
- **强大的类型建模**：联合/交叉/字面量/泛型/`keyof`/条件类型/映射类型/模板字面量类型组合出极强的类型表达力，能把业务约束编码进类型（可辨识联合 + `never` 穷尽检查是范式级实践）
- **结构化类型贴合 JS**：按「形状」而非「名称」判定兼容，天然契合 JS 大量使用匿名对象、鸭子类型的习惯，无需 Java 式的显式 `implements`
- **生态与工具链成熟**：`@types/*` 覆盖海量库、Vite/esbuild/SWC/tsx 提供极速转译、几乎所有主流框架（React/Vue/Angular/Nest）都以 TS 为一等公民

**缺点**

- **只在编译期有效**：类型运行时被擦除，无法用类型做运行时校验——外部数据（接口响应、表单）仍需 Zod/Valibot 等运行时校验库兜底，类型 ≠ 保证
- **类型体操的复杂度**：条件类型、递归类型、映射类型能写出极其晦涩的「类型代码」，可读性与编译性能都可能受损，团队需克制
- **配置门槛**：`tsconfig.json` 选项繁多（strict 家族、module/target/moduleResolution 的组合坑），新手容易配错；6.0 又大改默认值，升级需留意
- **`any` 逃生舱侵蚀**：一旦滥用 `any` 或断言，类型安全会悄悄瓦解，需靠 lint 规则（`no-explicit-any`）与 code review 守住
- **构建链多一环**：相比直接跑 JS，多了一步编译/转译；虽有 esbuild/SWC 极速方案，但「类型检查」本身仍慢（这正是 7.0 用 Go 重写要解决的痛点）
- **与新特性的错位**：装饰器长期停留在 `experimentalDecorators`，标准装饰器（5.0）语义又与旧版不同，Angular/Nest 生态迁移需谨慎

## 文档地址

[TypeScript 官网](https://www.typescriptlang.org/) ｜ [Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) ｜ [TSConfig Reference](https://www.typescriptlang.org/tsconfig/) ｜ [Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/) ｜ [Playground](https://www.typescriptlang.org/play)

## GitHub 地址

[microsoft/TypeScript](https://github.com/microsoft/TypeScript) ｜ [DefinitelyTyped（@types 仓库）](https://github.com/DefinitelyTyped/DefinitelyTyped) ｜ [type-challenges（类型体操）](https://github.com/type-challenges/type-challenges)

## 幻灯片地址

<a href="/SlideStack/typescript-slide/" target="_blank">TypeScript</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=typescript" target="_blank" rel="noopener noreferrer">TypeScript 测试题</a>
