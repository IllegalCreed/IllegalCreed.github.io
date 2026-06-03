---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 基于 **Vite 8.x**。本篇覆盖「开箱即用的内置特性」——TypeScript、CSS、JSX、静态资源、环境变量。很多你以为需要插件的能力，Vite 其实已经内置。

## 一、内置特性总览

Vite 的一个核心理念是：**先查 [Features](https://vite.dev/guide/features.html)，再找插件**。下列能力无需任何插件即可使用：

- **TypeScript / JSX / TSX**：内置转译（Vite 8 用 Oxc Transformer）
- **CSS**：导入即注入、`@import` 内联、CSS Modules、PostCSS、Sass/Less/Stylus 预处理器
- **静态资源**：图片、字体、JSON、`?url` / `?raw` 等特殊导入
- **`import.meta.glob`**：批量导入一个目录
- **Web Worker / WebAssembly**：`?worker` / `?init` 等约定
- **环境变量**：`import.meta.env` 与 `.env` 文件

框架相关能力（Vue SFC、React Fast Refresh）才需要对应的官方插件。

## 二、TypeScript

### 只转译，不做类型检查

这是 Vite 最重要的 TS 心智：**Vite 只对 `.ts` 做语法转译（transpilation），不做类型检查**。类型错误**不会**让 `dev` / `build` 失败。

- 转译器：Vite 8 是 **Oxc Transformer**（Vite ≤7 是 esbuild），热更新约 50ms 反映。
- 类型检查需自己跑：

```bash
# 生产构建前检查
tsc --noEmit
# 开发时持续检查
tsc --noEmit --watch
```

或用 [`vite-plugin-checker`](https://github.com/fi3ework/vite-plugin-checker) 把类型错误直接报到浏览器。

::: warning 为什么不内置检查？
类型检查与转译是两套工作量级——Oxc 转译是「逐文件、无类型信息」的，速度极快；而类型检查需要构建完整类型图，慢得多。把检查交给 `tsc` 是 Vite 用速度换来的取舍。
:::

### 必须开启的 tsconfig 选项

```jsonc
{
  "compilerOptions": {
    // Oxc/esbuild 逐文件转译、无类型信息，必须开启
    "isolatedModules": true,
    // 客户端类型（import.meta.env、资源导入 shim、import.meta.hot）
    "types": ["vite/client"]
  }
}
```

- **`isolatedModules: true` 必须开**：转译器缺类型信息，不支持 `const enum`、不支持隐式的 type-only import。
- **`import type`**：导入仅用于类型的成员时务必用 `import type`，避免被错误打包。
- **`useDefineForClassFields`**：ES2022+ 目标默认 `true`，否则 `false`。

### Vite 忽略 tsconfig 的 target

一个高频坑：**Vite 忽略 tsconfig 里的 `target`**。

- 开发态用 `oxc.target`（默认 `esnext`）
- 生产态用 `build.target`（默认 `baseline-widely-available`）

```ts
// vite.config.ts
export default defineConfig({
  // Vite 8：顶层 oxc（Vite ≤7 是顶层 esbuild）
  oxc: { target: "es2020" },
  build: { target: "es2015" },
});
```

### 客户端类型

`src/vite-env.d.ts` 引入客户端类型（提供资源导入、`import.meta.env`、`import.meta.hot` 的类型）：

```ts
/// <reference types="vite/client" />
```

> ⚠️ `vite-env.d.ts` 里**不能写 `import` 语句**，否则会把它从「全局类型增强」变成普通模块，破坏类型增强。

## 三、CSS

### 导入与 HMR

直接 `import './style.css'` 会把样式注入 `<style>` 并支持 HMR；`@import` 会被内联，且其中的 URL 自动 rebase（尊重 alias），由预配置的 PostCSS 处理。

### CSS Modules

任何以 `.module.css` 结尾的文件是 CSS Module，导入得到类名映射对象：

```ts
import styles from "./button.module.css";
document.querySelector("#app")!.className = styles.danger;
```

配 `css.modules.localsConvention: 'camelCaseOnly'` 可启用命名导入。CSS Modules 可与预处理器组合（`.module.scss`）。

### 预处理器

Vite 内置支持，但需自行安装对应包：

```bash
pnpm add -D sass-embedded   # .scss / .sass（官方推荐 sass-embedded）
pnpm add -D less            # .less
pnpm add -D stylus          # .styl / .stylus
```

> ⚠️ **Stylus 的差异**：因其 API 限制，Stylus **不支持** `@import` alias 与 `url()` rebase；而 Sass / Less 都支持。

### `?inline` 与 Lightning CSS

- `import x from './bar.css?inline'`：**禁用 CSS 注入**，把内容作为字符串返回。
- **Lightning CSS**（实验）：`css.transformer: 'lightningcss'` 用 Rust 处理全部 CSS。Vite 8 中 `build.cssMinify` 默认已是 `'lightningcss'`（Vite ≤7 是 `'esbuild'`）。

```ts
export default defineConfig({
  css: {
    modules: { localsConvention: "camelCaseOnly" },
    // 实验性：用 Lightning CSS 替代 PostCSS 全流程
    // transformer: "lightningcss",
  },
});
```

## 四、JSX 与框架插件

### JSX / TSX

`.jsx` / `.tsx` 原生支持，Vite 8 用 **Oxc Transformer** 转译。自定义 JSX 走 `oxc` 选项：

```ts
export default defineConfig({
  oxc: {
    jsx: { importSource: "preact" }, // 自定义 JSX importSource
    jsxInject: `import React from 'react'`, // 自动注入，免去每文件手写
  },
});
```

> ⚠️ Vite 8 中 JSX 配置走 `oxc`（`jsxFactory` / `jsxFragment` 同理）；Vite ≤7 走 `esbuild`。

### 官方框架插件矩阵

| 框架 | 插件 | HMR 机制 |
|---|---|---|
| Vue | `@vitejs/plugin-vue` | Vue SFC 官方集成 |
| Vue JSX | `@vitejs/plugin-vue-jsx` | — |
| React | `@vitejs/plugin-react` | React Fast Refresh |
| React（SWC） | `@vitejs/plugin-react-swc` | React Fast Refresh |
| RSC | `@vitejs/plugin-rsc` | — |
| Preact | `@preact/preset-vite`（`@prefresh/vite`） | Preact 热刷新 |

create-vite 的模板已经预配置好了对应插件，开箱即用。

## 五、静态资源与特殊导入

### 资源导入

导入资源得到解析后的公共 URL；通过查询后缀控制行为：

| 写法 | 含义 |
|---|---|
| `import url from './img.png'` | 解析后的 URL（默认） |
| `import url from './img.png?url'` | 显式要 URL |
| `import str from './shader.glsl?raw'` | 作为字符串读取 |
| `import Worker from './w.js?worker'` | 作为 Web Worker |

小于 `build.assetsInlineLimit`（默认 4096 字节）的资源会被内联成 base64 data URI；设 `0` 可禁用内联。

### JSON 导入

```ts
import pkg from "./package.json"; // 整体导入
import { version } from "./package.json"; // 命名导入（可 tree-shake）
```

### `public` 目录

`public/`（默认）下的文件**不经处理**，以根路径原样拷贝到 `dist`，用于 `robots.txt`、`favicon` 等需要固定文件名、不被打包的资源。代码里用绝对路径 `/file.txt` 引用。

## 六、环境变量与模式

### `import.meta.env` 五个内置常量

| 常量 | 含义 |
|---|---|
| `MODE` | 当前模式字符串（`development` / `production` / 自定义） |
| `BASE_URL` | 由 `base` 配置决定的公共基础路径 |
| `PROD` | 是否生产（或 `NODE_ENV=production`） |
| `DEV` | 是否开发（与 `PROD` 相反） |
| `SSR` | 是否服务端渲染上下文 |

### `VITE_` 前缀暴露规则

**只有 `VITE_` 前缀的变量会暴露给客户端代码**，其余仅服务端可见：

```bash
# .env
VITE_API_URL=https://api.example.com   # 客户端可见
DB_PASSWORD=secret                      # 客户端为 undefined
```

```ts
console.log(import.meta.env.VITE_API_URL); // ✅
console.log(import.meta.env.DB_PASSWORD); // undefined
```

前缀可用 `envPrefix` 改（默认 `'VITE_'`），但**不能设为空串 `''`**（会暴露所有 env，Vite 报错阻止）。

> ⚠️ `VITE_*` 变量在构建时**硬编码进源码**，绝不能放 API key 等敏感信息！env 值始终是**字符串**，布尔 / 数字需手动转换。

### `.env` 文件加载顺序

后者覆盖前者：

```
.env                # 所有情况加载
.env.local          # 所有情况加载，被 git 忽略
.env.[mode]         # 仅指定 mode 加载
.env.[mode].local   # 仅指定 mode 加载，被 git 忽略
```

优先级：**已存在的进程环境变量 > 模式特定文件 > 通用文件**。把 `*.local` 加入 `.gitignore` 避免误提交密钥。

### mode 与 NODE_ENV 是两个独立概念

这是最容易混淆的地方：

| | 决定什么 | 默认值 |
|---|---|---|
| **mode** | 加载哪些 `.env.[mode]` 文件 | `vite dev`→`development`，`vite build`→`production` |
| **NODE_ENV** | `import.meta.env.PROD` / `DEV` 的值 | 由命令决定，可被命令行覆盖 |

```bash
# mode=staging，但 NODE_ENV 仍是 production（加载 .env.staging，PROD 仍为 true）
vite build --mode staging

# NODE_ENV=development 时 build：PROD=false，但 mode 仍是 production
NODE_ENV=development vite build
```

### HTML 中替换常量

HTML 里用 `%CONST_NAME%` 替换常量：

```html
<title>%VITE_APP_TITLE% - %MODE%</title>
```

不存在的变量保持原样不报错；复杂条件用 `transformIndexHtml` 钩子（见[高级篇](./expert)）。

### 在 `vite.config` 里读 env

`.env` 不会在 `vite.config.*` 运行期自动注入 `process.env`，必须手动 `loadEnv`：

```ts
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // 第三参 '' 表示加载所有变量（不限 VITE_ 前缀）
  const env = loadEnv(mode, process.cwd(), "");
  return {
    define: { __API__: JSON.stringify(env.VITE_API_URL) },
  };
});
```

---

掌握了内置特性，下一步是 [进阶篇](./advanced)：`import.meta.glob`、Worker / Wasm、依赖预构建、CLI、生产构建、库模式。
