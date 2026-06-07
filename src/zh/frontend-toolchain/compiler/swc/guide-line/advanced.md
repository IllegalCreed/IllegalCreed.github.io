---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 基于 **@swc/core 1.15.x**。`env` 与 preset-env 对位、polyfill、装饰器、`externalHelpers`、`baseUrl`/`paths`，以及 `swc-loader` / `@swc/jest` 集成——把 SWC 用进真实项目。

## 一、env：SWC 版的 preset-env

`env` 让你**按目标环境（browserslist）反推该降级什么**，对位 Babel 的 `@babel/preset-env`：

```jsonc
{
  "env": {
    "targets": "> 0.25%, not dead",
    "mode": "usage",
    "coreJs": "3"
  }
}
```

| 字段 | 作用 |
|---|---|
| `targets` | 目标环境（browserslist 查询，或 `{ chrome: "100" }`） |
| `mode` | polyfill 注入策略：`"usage"` / `"entry"`（不写则不注入 polyfill） |
| `coreJs` | core-js 版本（如 `"3"`），配合 `mode` 决定补哪些 API |
| `shippedProposals` | 是否包含已落地的提案特性 |

::: warning env 与 jsc.target 互斥
官方明确：SWC 的 `env` 是 `preset-env` 的替代，但 **「this does not work with `jsc.target`」**。**二者只能选一个**：要按 browserslist 反推就用 `env`，要钉死某个 ES 版本就用 `jsc.target`，同时写会冲突。
:::

## 二、polyfill：mode usage vs entry

`env.mode` 决定 core-js polyfill 怎么注入（**SWC 默认不注入，必须显式配 `mode` + `coreJs`**）：

| mode | 行为 | 类比 |
|---|---|---|
| `"usage"` | 按文件**实际用到**的 API 自动按需注入 | preset-env `useBuiltIns: "usage"` |
| `"entry"` | 在入口的 `import "core-js"` 处，按 `targets` 展开成所需 polyfill | preset-env `useBuiltIns: "entry"` |

```jsonc
// usage：最省心，按需
{ "env": { "targets": "defaults", "mode": "usage", "coreJs": "3" } }

// entry：需在入口手写 import "core-js";
{ "env": { "targets": "defaults", "mode": "entry", "coreJs": "3" } }
```

> 注意：在「SWC emit + 打包器」的工程里，polyfill 经常交给打包器层统一处理，SWC 侧不一定开 `env.mode`。

## 三、装饰器：多个开关要联动

装饰器涉及**解析**和**转换**两步，常一起配：

```jsonc
{
  "jsc": {
    "parser": { "syntax": "typescript", "decorators": true },
    "transform": {
      "legacyDecorator": true,    // 旧版（stage 1 / TS experimentalDecorators）
      "decoratorMetadata": true   // 对应 TS 的 emitDecoratorMetadata
    }
  }
}
```

- `parser.decorators: true`：先让 parser **认识**装饰器语法。
- `transform.legacyDecorator: true`：按旧版（TypeScript `experimentalDecorators`）语义**转换**。
- `transform.decoratorMetadata: true`：需要反射元数据（如 NestJS、TypeORM 依赖注入）时再加，对应 TS 的 `emitDecoratorMetadata`。

> ⚠️ 三者缺一会出问题：只开 parser 不开 transform，装饰器不会被正确降级；用 NestJS 这类依赖元数据的框架，必须把 `decoratorMetadata` 也打开。

## 四、externalHelpers 复盘

进阶项目几乎都会开 `externalHelpers`，避免每个文件内联重复 helper：

```jsonc
{ "jsc": { "externalHelpers": true } }
```

```bash
npm i @swc/helpers
```

配合 `module.type: "es6"` 时，helper 以 ESM import 形式引入，打包器可做去重与 tree-shaking。**忘记装 `@swc/helpers` 会在运行时报找不到模块**。

## 五、baseUrl / paths：路径别名

SWC 支持与 TypeScript 同形的路径映射：

```jsonc
{
  "jsc": {
    "baseUrl": "/abs/path/to/project", // 官方要求：必须是绝对路径
    "paths": { "@/*": ["src/*"] }
  }
}
```

- `baseUrl` **必须是绝对路径**（官方：「The path must be specified as an absolute path」）。
- `paths` 依赖 `baseUrl`，语法与 tsconfig 的 `paths` 一致。
- 与 tsc 类似，这套别名是**编译期重写 import 路径**；但若打包器另有自己的 alias 解析，要保证两边一致，避免「SWC 这边过、打包器那边找不到」。

## 六、type-only import 的坑

SWC 逐文件转译，**看不到完整类型系统**，无法判断某个 import 是不是「只用作类型」。为避免把纯类型 import 错误保留进产物（或漏删），应：

- 在 TS 侧开 `verbatimModuleSyntax`，并对纯类型导入显式写 `import type`；
- 让「是值还是类型」所见即所得，SWC 就能正确决定保留/删除。

```ts
import { type Foo, bar } from "./mod"; // Foo 是类型应删，bar 是值要留
import type { Baz } from "./types";    // 整行删除
```

## 七、集成：swc-loader 与 @swc/jest

**Webpack** 用 `swc-loader` 取代 babel-loader：

```js
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: "swc-loader", // 配置同 .swcrc 的 jsc 等
        },
      },
    ],
  },
};
```

**Jest** 用 `@swc/jest` 取代 ts-jest / babel-jest：

```jsonc
// jest.config.js / package.json
{ "transform": { "^.+\\.(t|j)sx?$": ["@swc/jest"] } }
```

> 两者都只是「把转译换成 SWC」，**类型检查仍要单独跑 `tsc --noEmit`**——测试通过不代表类型正确。

---

进入 [指南 · 专家](./expert)：Wasm 插件机制与版本耦合、自写插件 VisitMut、parse→print、与 Oxc 竞争、spack 局限。
