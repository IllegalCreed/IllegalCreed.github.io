---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 基于 **Parcel 2.x**。本篇覆盖 Targets、语言支持、生产优化细节与 `.parcelrc` 插件体系。

## 一、Targets（构建目标）

一个 **target** 是 Parcel 编译源码的一种方式；同一份源码可同时编译成多个 target。入口可在 CLI 指定、用 glob（**必须单引号** `parcel './src/*.html'` 防 shell 展开），或用 `package.json` 的 `source` 字段。

```jsonc
{
  "source": "src/index.html", // 单值或数组
  "targets": {
    "default": { "distDir": "./output" } // 默认 target 字面名就是 default
  }
}
```

### 库模式（`main` / `module` / `browser` / `types`）

这四个字段会被自动识别为构建目标：

| 字段 | 输出 |
|---|---|
| `main` | CommonJS（若 `.mjs` 或 `"type": "module"` 则 ESM） |
| `module` | **始终 ESM** |
| `browser` | `main` 的浏览器特定覆盖 |
| `types` | `.d.ts` 声明 |

```jsonc
{
  "main": "dist/main.cjs",
  "module": "dist/module.mjs",
  "types": "dist/types.d.ts"
}
```

库 target 的默认行为：**不打包 node_modules**（`includeNodeModules: false`）、默认禁压缩、**强制开启 scope hoisting（不能关）**。`outputFormat: 'global'` 对库不可用（库必须 esmodule 或 commonjs）。

### 环境（engines / browserslist / context）

- 浏览器目标用 **`browserslist`**；Node 目标用 `engines.node`。
- `context` 枚举 7 值：`node` / `browser` / `web-worker` / `service-worker` / `worklet` / `electron-main` / `electron-renderer`。
- `outputFormat`：`global`（经典 `<script>`）/ `esmodule` / `commonjs`。
- `sourceMap` 默认开启（`--no-source-maps` 关）；`publicUrl` 默认 `/`，Parcel 优先用相对路径。

## 二、语言支持

### JavaScript

底层用 **SWC**（等价于 `@babel/preset-env` + react + typescript + flow）。**Babel 仅在检测到 `.babelrc` / `babel.config.json` 时启用**，且是在内置默认之上做增强。

```jsonc
// package.json —— 不配 browserslist 就不降级
{ "browserslist": "> 0.5%, last 2 versions, not dead" }
```

> ⚠️ 避免 `.babelrc.js` / `babel.config.js` 等 **JS 形式的 Babel 配置**，会破坏缓存。

### TypeScript

默认 **SWC 转译、不做类型检查**——只剥离类型。类型安全靠三种方式：① IDE；② CI 跑 `tsc --noEmit`；③ 实验性 `@parcel/validator-typescript`。

```jsonc
// tsconfig.json —— 建议显式开 isolatedModules，让 IDE 提前报错
{ "compilerOptions": { "isolatedModules": true } }
```

> ⚠️ 因逐文件处理**隐式启用 `isolatedModules`**，不能用 `const enum` 等需跨文件分析的特性。要用 `tsc` 编译器可换 `@parcel/transformer-typescript-tsc`。

### CSS

默认处理器是 **Lightning CSS**（Rust，原 parcel-css）。`@import` 会被**内联**进单一 bundle；`url()` 引用的资源会被重写匹配输出文件名。声明 `browserslist` 后自动加厂商前缀、降级 `color-mix()` / `oklch()` / 逻辑属性 / 媒体查询范围等现代语法。

- **CSS Modules**：`.module.css` 约定（也适用 `.module.scss`/`.less`），JS 用命名空间导入 `import * as classes from './x.module.css'`（**tree shaking 要求命名空间/命名导入**，default 导入不摇树）。
- **CSS Nesting** 默认关闭，需 `@parcel/transformer-css.drafts.nesting: true`。

> ⚠️ CSS **自定义属性（custom property）里的 `url()` 必须用绝对路径**——变量在使用处而非定义处解析，相对路径会错。PostCSS 仍可用（`.postcssrc`），但优先 `.json` 形式（JS 形式削弱缓存）。

### Sass / Less

检测到 `.scss` / `.sass` / `.less` 时**自动安装** `@parcel/transformer-sass`（底层 Dart Sass）/ `@parcel/transformer-less`。支持 `.module.scss` 的 CSS Modules，配置用 `.sassrc.json` / `.lessrc`（避免 JS 形式）。

## 三、生产优化细节

### 压缩底层工具（易混考点）

| 资源 | 底层引擎 | 配置文件名 |
|---|---|---|
| JS | **SWC**（非 Terser/UglifyJS） | `.terserrc`（SWC 兼容 Terser 配置） |
| CSS | **Lightning CSS**（非 PostCSS/cssnano） | — |
| SVG | **oxvg** | `svgo.config.json` |
| HTML | 内置 minifier | `.htmlnanorc` |

> ⚠️ 配置文件名与实际底层引擎是**分离**的（如 SVG 引擎是 oxvg 但配置文件仍叫 `svgo.config.json`），是高频混淆点。

### Tree Shaking 与 sideEffects

静态分析移除未用代码，支持 ESM + CommonJS + 动态 `import()` + 跨语言（含 CSS Modules）。

```jsonc
// package.json —— 默认所有模块都被当作有副作用保留
{ "sideEffects": false }              // 全部无副作用
{ "sideEffects": ["**/*.css"] }       // 仅列出的文件有副作用
```

> ⚠️ **经典坑**：`sideEffects: false` 后有副作用的 CSS 等可能被误删；`export *` 会让 Parcel 无法得知可用导出。诊断 bailout 用 `parcel build --log-level verbose`。

### Scope Hoisting

把多模块拼进单一作用域（**默认仅生产启用**，`--no-scope-hoist` 关）。bailout 情形：ESM 的动态属性访问 `math[op]()` / 命名空间整体传走；CommonJS 的 `exports[var]` / 重新赋值 / 动态 `require`；`eval()` 会打破它（改用 `Function` 构造器）。**库 target 强制开启，无法关闭**。

### Content Hashing 与缓存

文件名默认含内容哈希（`--no-content-hash` 关）；**入口 bundle、service worker、HTML link 引用不加哈希**。内容哈希在 **Optimizing 阶段**计算（虽然文件名首先由 Namer 生成）。

### 代码分割与 shared bundle

动态 `import()` 自动分包（返回 Promise）。多入口/多动态 import 共享同一模块达阈值时自动拆 **shared bundle**。

> ⚠️ 动态 `import()` 仅是 hint，**不保证产生独立 bundle**：同一模块既被同步又被异步 import 时会被 **internalize** 到同一 bundle（包一层 Promise 保语义）。共享拆分阈值在 `@parcel/bundler-default` 调（`http: 2` 默认 `minBundleSize: 20000` / `maxParallelRequests: 25`）。

## 四、`.parcelrc` 插件体系

`.parcelrc`（JSON5）用 `extends` 继承默认配置，按八/十一类插件角色配置：

```jsonc
{
  "extends": "@parcel/config-default",
  "transformers": {
    "*.{png,jpg}": ["@parcel/transformer-image"]
  },
  "compressors": {
    "*.{js,css,html}": ["...", "@parcel/compressor-gzip"]
  }
}
```

- 插件角色：**Resolver / Transformer / Bundler / Namer / Runtime / Packager / Optimizer / Compressor / Validator / Reporter / Config**。
- 构建七阶段：Resolving & Transforming（**并行**）→ Bundling → Naming → Packaging → **Optimizing（算内容哈希）** → Compressing → Writing。
- **`"..."` token** 把默认/继承的管线嵌入当前管线（**扩展**而非覆盖）；省略它会整体 **REPLACE** 默认（常见构建崩溃原因）。
- Glob map 按**声明顺序**定优先级，具体 glob 放宽 glob 前面。
- 插件命名约定：官方 `@parcel/{type}-{name}`，社区 `parcel-{type}-{name}`，且 `package.json` 必须含 `engines.parcel`。

> ⚠️ gzip/brotli **不是默认行为**，需装 `@parcel/compressor-gzip` 等并在 `.parcelrc` 配 `compressors`；漏写 `"..."` 会导致原始未压缩文件不被输出（只剩 `.gz`/`.br`）。
