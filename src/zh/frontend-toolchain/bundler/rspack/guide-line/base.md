---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **Rspack 2.0**。本篇覆盖日常配置主干：entry/output/resolve、module.rules 与资源模块、原生 CSS 的四种 type、devServer 与 HMR。所有概念与 webpack 5 同构，可带着 webpack 经验直接读。

## 一、entry / output / resolve

```js
import { defineConfig } from '@rspack/core';

export default defineConfig({
  entry: { main: './src/index.tsx' },
  output: {
    path: 'dist',
    filename: '[name].[contenthash].js',
    clean: true,                    // 构建前清空 dist
  },
  resolve: {
    extensions: ['...', '.ts', '.tsx'],  // '...' 保留默认扩展名再追加
    alias: { '@': './src' },
    tsConfig: './tsconfig.json',    // 读 tsconfig 的 paths（替代 tsconfig-paths-webpack-plugin）
  },
});
```

- 字段语义与 webpack 5 一致；`resolve.extensions` 里的 `'...'` 是「展开默认值」的占位写法。
- `resolve.tsConfig` 是 Rspack 内置能力：直接消化 tsconfig 的 `paths`/`references`，**不需要**第三方插件；注意它不会自动开启，要显式配置。
- ⚠️ 2.0 起 `resolve.extensions` 默认**不再包含 `.wasm`**，用到需显式追加。

## 二、module.rules 与资源模块

规则匹配模型与 webpack 相同：`test` 匹配文件 → `use`/`loader` 串转换 → `type` 决定模块类型。

静态资源用 **Asset Modules**（webpack 5 同款），告别 file-loader/url-loader/raw-loader：

```js
module: {
  rules: [
    { test: /\.(png|jpe?g|gif|webp)$/i, type: 'asset/resource' }, // 输出独立文件
    { test: /\.svg$/i, type: 'asset/inline' },                    // 内联 data URI
    { test: /\.txt$/i, type: 'asset/source' },                    // 按原始文本导入
    {
      test: /\.(woff2?|ttf)$/i,
      type: 'asset',                                              // 按体积自动二选一
      parser: { dataUrlCondition: { maxSize: 4 * 1024 } },
    },
  ],
},
```

JS/TS 转译规则（内置 SWC）：

```js
{
  test: /\.(?:js|mjs|jsx|ts|tsx)$/,
  exclude: [/node_modules/],
  loader: 'builtin:swc-loader',
  options: { detectSyntax: 'auto' },
  type: 'javascript/auto',
},
```

> `builtin:` 前缀 = Rust 侧内置 loader，无需安装、没有 JS 跨语言开销。社区 JS loader 几乎全兼容（loader context 协议被完整实现），但跑在 JS 侧——能换 builtin 的尽量换，详见[专家篇](./expert)的性能部分。

## 三、原生 CSS：四种 type

Rspack 原生支持 CSS，`module.rules` 的 `type` 决定处理方式：

| type | 行为 |
|---|---|
| `css` | 普通 CSS，不做 Modules 作用域转换 |
| `css/module` | 一律按 CSS Modules（类名局部化） |
| `css/auto` | **按文件名分流**：`*.module.css` 走 Modules，其余普通 CSS |
| `css/global` | 全局作用域模式，`:local()` 才局部化 |

```js
module: {
  rules: [
    { test: /\.css$/i, type: 'css/auto' },
    { test: /\.scss$/i, use: ['sass-loader'], type: 'css/auto' },  // Sass 编译后交原生管线
    { test: /\.less$/i, use: ['less-loader'], type: 'css/auto' },
  ],
},
```

CSS Modules 的导入支持命名空间/具名导入：

```ts
import * as styles from './index.module.css';
// 或 import { red } from './index.module.css';
```

### 原生管线 vs CssExtractRspackPlugin

两条**互斥**的 CSS 管线，同一类文件二选一：

| 方案 | rule 的 type | 适用 |
|---|---|---|
| 原生 CSS（推荐） | `css/auto` 等 | 新项目；默认产出独立 CSS 文件 |
| `CssExtractRspackPlugin.loader` + `css-loader` | **`javascript/auto`** | webpack 迁移、依赖 css-loader 选项生态 |

```js
// 迁移 mini-css-extract-plugin 的写法
import { rspack } from '@rspack/core';
export default {
  plugins: [new rspack.CssExtractRspackPlugin()],
  module: {
    rules: [{
      test: /\.css$/i,
      use: [rspack.CssExtractRspackPlugin.loader, 'css-loader'],
      type: 'javascript/auto',   // ⚠️ 不能再用 css/* type
    }],
  },
};
```

> ⚠️ 经典坑：原生 type 与 extract 插件**叠加使用**会构建异常。原生管线本身就输出独立 CSS 文件，多数场景直接用 `css/auto` 即可。

## 四、devServer 与 HMR

`rspack dev` 由 `@rspack/dev-server` 驱动（基于 webpack-dev-server 演化，配置兼容；2.0 起需手动安装）：

```js
devServer: {
  port: 3000,
  hot: true,                       // 默认即 true，HMR 开发模式默认开启
  historyApiFallback: true,        // SPA 路由回退
  proxy: [
    { context: ['/api'], target: 'http://localhost:8080', changeOrigin: true },
  ],
},
```

- HMR 默认开启，`hot: false` 可关闭；React 组件级热更新要再配 `@rspack/plugin-react-refresh`（见[进阶篇](./advanced)）。
- ⚠️ CSS HMR 场景：`output.cssFilename` 不要用 `[hash]`/`[contenthash]`，否则热更新可能异常。

## 五、mode 与产物基线

- `mode: 'development'`：保调试体验；2.0 默认 `devtool: 'cheap-module-source-map'`。
- `mode: 'production'`：默认开启压缩（SWC 压 JS、Lightning CSS 压 CSS）与整套 tree-shaking；2.0 经 CLI 构建默认**不再产出 source map**（`devtool: false`），需要时显式配置。

---

进入 [指南 · 进阶](./advanced)：builtin:swc-loader 完整配置（降级/polyfill/React）、webpack 迁移五步、插件兼容策略、splitChunks 与 Module Federation。
