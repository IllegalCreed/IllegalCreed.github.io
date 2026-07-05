---
layout: doc
outline: [2, 3]
---

# 配置·模块·互操作：tsconfig、声明文件、枚举与 6.0/7.0

> 基于 TypeScript 6.0 · 核于 2026-07

## 速查

- **`strict: true`** = 一组开关总闸：`noImplicitAny`/`strictNullChecks`/`strictFunctionTypes`/`strictBindCallApply`/`strictPropertyInitialization`/`noImplicitThis`/`useUnknownInCatchVariables`/`alwaysStrict`。**新项目务必开**。
- **`target`**：编译产物的 ES 版本（`es2022`/`esnext`…）；**`lib`**：可用的内置 API 类型（`dom`/`es2023`…）。
- **`module`**：产物模块格式（`esnext`/`nodenext`/`node20`/`commonjs`）；**`moduleResolution`**：模块解析策略（`bundler`/`nodenext`/`node20`）。
- **打包器项目**（Vite/webpack）：`module: esnext` + `moduleResolution: bundler`；**Node 直跑**：`nodenext` 或 `node20`。
- **`paths`**：路径别名（`"@/*": ["src/*"]`）；⚠️ 只改类型解析，**运行时需打包器/`tsconfig-paths` 配套**。
- **声明文件 `.d.ts`**：只描述类型、无运行时代码；**`declare`** 声明外部实现（全局/JS 库/环境）；`@types/*` 靠它供类型。
- **模块**：优先 **ESM**（`import`/`export`）；`esModuleInterop`（6.0 起**恒为 true**）让默认导入 CJS 更顺；`import type` 只导入类型（编译擦除）。
- **枚举取舍**：`enum`（有运行时对象、数字枚举有反向映射）→ 慎用 **`const enum`**（内联、与 `isolatedModules` 冲突）→ 官方多推 **`as const` 对象 + 索引联合**。
- **装饰器**：旧版需 `experimentalDecorators`（Angular/Nest/TypeORM）；**标准装饰器自 5.0 起免标志**，语义不同。
- **JS 互操作**：`allowJs`/`checkJs` + `// @ts-check` + JSDoc 渐进迁移；`// @ts-expect-error` 优于 `// @ts-ignore`（前者「过期会报错」）。
- **TS 6.0（当前稳定，`latest` 6.0.3）**：过渡版，改默认（`strict`/`module`/`target`/`types`）、弃用旧选项；**7.0 = 原生 Go 重写 + 并行类型检查**。

## 一、tsconfig.json 关键项

`tsconfig.json` 控制编译行为。抓住几组核心即可（完整清单见[官方 TSConfig Reference](https://www.typescriptlang.org/tsconfig/)）。

### strict 家族——最重要的开关

`"strict": true` 是「总闸」，一次开启一整组严格检查：

| 子开关 | 作用 |
| --- | --- |
| `noImplicitAny` | 推断不出类型而隐式 `any` 时报错 |
| `strictNullChecks` | `null`/`undefined` 不再默认属于其他类型（**最有价值**） |
| `strictFunctionTypes` | 函数参数按逆变更严格检查（方法参数例外仍双变） |
| `strictPropertyInitialization` | 类属性必须初始化 |
| `strictBindCallApply` | `bind`/`call`/`apply` 参数类型检查 |
| `noImplicitThis` | `this` 为隐式 `any` 时报错 |
| `useUnknownInCatchVariables` | `catch (e)` 中 `e` 类型为 `unknown` 而非 `any` |
| `alwaysStrict` | 输出 `"use strict"` |

::: tip 新项目一律开 strict
`strict` 是 TS 价值的核心来源。老项目迁移可先关部分子项、逐步开启；新项目直接全开（6.0 已把 `strict` 默认设为 `true`）。

另有一组「非 strict 但强烈推荐」的检查：`noUncheckedIndexedAccess`（索引访问带 `undefined`）、`noImplicitReturns`、`noFallthroughCasesInSwitch`、`exactOptionalPropertyTypes`。
:::

### target / lib / module / moduleResolution

```jsonc
{
  "compilerOptions": {
    "target": "es2022",           // 产物语法级别
    "lib": ["es2023", "dom"],     // 可用的内置 API 类型
    "module": "esnext",           // 产物模块格式
    "moduleResolution": "bundler" // 模块解析策略
  }
}
```

**如何组合**（最常见两类）：

- **用打包器**（Vite/webpack/esbuild）：`module: "esnext"` + `moduleResolution: "bundler"`——允许无扩展名导入、认 `package.json` 的 `exports`。
- **Node 直接跑**：`module: "nodenext"`（跟随 Node 演进）或 `"node20"`（锁定 Node 20 语义、不随版本变、隐含 `target es2023`）。

::: warning 别再用被弃用的老策略
`moduleResolution: "node"`（node10）、`"classic"` 面向老式 CommonJS，已在 6.0 被**弃用**，7.0 移除。新项目用 `bundler` 或 `nodenext`/`node20`。
:::

### paths：路径别名

```jsonc
{
  "compilerOptions": {
    "paths": { "@/*": ["src/*"] } // import x from "@/utils"
  }
}
```

⚠️ `paths` **只影响 TS 的类型解析**，不改运行时。要让运行时也认这些别名，需打包器（Vite `resolve.alias`）或 `tsconfig-paths`/`tsx` 等配套——否则编译通过、运行报「找不到模块」。

## 二、模块与声明文件

### 优先 ESM

现代 TS 项目优先用 ESM（`import`/`export`）。`esModuleInterop`（**6.0 起恒为 `true`、不可关**）让「默认导入 CommonJS 模块」更符合直觉：

```ts
import express from "express"; // 恒开 interop 后，CJS 默认导入正常工作
```

**`import type`** 只导入类型、编译后完全擦除，避免不必要的运行时依赖与副作用：

```ts
import type { User } from "./types"; // 仅类型，产物里不留 import
```

### 声明文件 `.d.ts` 与 `declare`

`.d.ts` 文件**只描述类型、不含任何实现**，是给「无类型的 JS 库、全局变量、环境 API」补类型的机制。`declare` 关键字声明「存在但由外部提供实现」的东西：

```ts
// globals.d.ts —— 给全局变量/环境补类型
declare const __APP_VERSION__: string;      // 构建期注入的全局常量
declare module "*.svg" {                     // 让 import logo from "./a.svg" 有类型
  const src: string;
  export default src;
}
```

海量 `@types/*` 包（如 `@types/node`、`@types/lodash`）本质就是一堆 `.d.ts`，由 DefinitelyTyped 社区维护。更老的**三斜线指令** `/// <reference types="node" />` 用于声明文件间依赖，现代项目多改用 `import`/`types` 字段。

## 三、枚举与装饰器的取舍

### enum → const enum → as const 对象

TS 的 `enum` 会**生成运行时对象**（数字枚举还带**反向映射**：`E[0] === "A"`）：

```ts
enum Direction { Up, Down } // 编译出真实对象，占运行时体积
```

`const enum` 会在编译时**内联**成字面量、不留运行时对象，但坑很大：

```ts
const enum Dir { Up, Down }
const d = Dir.Up; // 直接内联成 const d = 0;
```

::: warning const enum 的坑
`const enum` 与 **`isolatedModules`**（Babel/esbuild/SWC 等**单文件转译器**）**不兼容**——单文件转译看不到枚举定义、无法内联；跨包发布时，下游内联的可能是**旧版本的值**，导致与运行时不一致的诡异 bug，且测试常因依赖版本一致而漏掉。因此许多团队用 lint 禁用 `const enum`。
:::

**官方与社区普遍更推荐 `as const` 对象 + 索引联合**——贴近标准 JS、无额外运行时坑：

```ts
const Direction = { Up: "UP", Down: "DOWN" } as const;
type Direction = typeof Direction[keyof typeof Direction]; // "UP" | "DOWN"
```

### 装饰器：experimental vs 标准

装饰器有**两套并存**的实现：

| 维度 | 旧版（实验性） | 标准装饰器 |
| --- | --- | --- |
| 提案 | 早期 TC39（过时） | TC39 **Stage 3** |
| 开启 | 需 `experimentalDecorators` | **5.0 起免标志** |
| 元数据 | 配 `emitDecoratorMetadata` + `reflect-metadata` | 提案演进中 |
| 生态 | Angular / NestJS / TypeORM 依赖 | 未来方向 |

```jsonc
// 依赖 Angular/Nest/TypeORM 时仍需旧版
{ "compilerOptions": { "experimentalDecorators": true, "emitDecoratorMetadata": true } }
```

两套语义**并不完全相同**，装饰器目标涵盖类、方法、访问器、属性、参数（旧版）。新代码若无框架约束，倾向标准装饰器；有 Angular/Nest 依赖则维持 `experimentalDecorators`。

## 四、与 JS 互操作、渐进迁移

TS 能与 JS 混跑，支持**渐进式迁移**：

```jsonc
{ "compilerOptions": { "allowJs": true, "checkJs": true } }
```

单文件也可用注释控制：文件顶部 `// @ts-check` 开启对该 JS 文件的检查，配合 **JSDoc** 标注类型：

```js
// @ts-check
/** @param {string} name @returns {string} */
function greet(name) { return "hi " + name; }
```

抑制错误的两种注释，**优先用 `@ts-expect-error`**：

```ts
// @ts-expect-error 这行预期报错；若哪天不报了，TS 反过来会提醒你删掉注释
const x: number = "oops";
// @ts-ignore 无脑忽略下一行错误——错误消失也不会提醒，容易留死注释
```

## 五、TypeScript 6.0 / 7.0：版本变化

**TypeScript 6.0** 是当前稳定版（`npm i -D typescript` 的 `latest` = 6.0.3），定位为迈向 **7.0** 的**过渡版本**，与 5.9 保持 API 兼容，主要动作有二：

**① 升级默认值**（更贴合现代工程）：

| 选项 | 旧默认 | 6.0 新默认 |
| --- | --- | --- |
| `strict` | `false` | `true` |
| `module` | `commonjs` | `esnext` |
| `target` | `es5` | 当年 ES（现 `es2025`，浮动） |
| `types` | 所有 `@types/*` | `[]`（空） |
| `rootDir` | 推断 | `.`（tsconfig 所在目录） |

::: warning types 默认变 [] 的影响
6.0 后 `types` 默认空数组，不再自动加载所有 `@types/*`。若用到 Node/Jest 全局，需显式写 `"types": ["node", "jest"]`。
:::

**② 弃用一批旧选项**（7.0 将彻底移除）：`target es5`、`downlevelIteration`、`module amd/umd/systemjs/none`、`moduleResolution node`(node10)/`classic`、`baseUrl`、`outFile`，以及 `esModuleInterop`/`allowSyntheticDefaultImports`/`alwaysStrict` 不再允许设 `false`。升级期可用 `"ignoreDeprecations": "6.0"` 暂时静默。

**TypeScript 7.0** 是用 **Go 原生重写**的编译器（社区称 tsgo / Project Corsa），带来**并行类型检查**与数量级的性能提升——这正是为解决「类型检查慢」这一 TS 最大痛点。6.0 把该弃用的都弃用掉，就是为 7.0 的干净启程铺路。

---

至此语言核心与工程配置已成体系。进入 [参考](./reference) 查阅速查表、工具类型清单、tsconfig 对照与常见错误汇总。
