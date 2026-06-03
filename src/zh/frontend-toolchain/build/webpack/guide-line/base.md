---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 基于 **Webpack 5.x**。本篇覆盖入口出口、Asset Modules、常用 loaders 与 plugins——把「能构建」用到「会配置」。

## 一、Entry 入口

入口默认 `./src/index.js`，有三种语法：

```js
module.exports = {
  // ① 单文件 shorthand —— 等价于 { main: './src/index.js' }
  entry: "./src/index.js",

  // ② 数组（multi-main）—— 多文件合并进同一个 chunk，常用于在主入口前注入 polyfill
  entry: ["./src/polyfills.js", "./src/index.js"],

  // ③ 对象 —— 最可扩展，支持多页应用（MPA）
  entry: {
    home: "./src/home.js",
    about: "./src/about.js",
  },
};
```

**入口间共享模块**用 `dependOn`，避免重复打包：

```js
entry: {
  index: { import: "./src/index.js", dependOn: "shared" },
  shared: "lodash", // lodash 抽到独立 shared chunk，index 复用
}
```

::: warning dependOn 的约束
- `dependOn` 与 `runtime` **不能同时**用于同一入口（共享 runtime 才能共享模块）。
- `dependOn` **不能循环**（a 依赖 b 同时 b 依赖 a 报错）。
- 数组入口（multi-main）只是简单拼接，**不做代码分离**。
- 同一 HTML 页面挂多入口，必须配 `optimization.runtimeChunk: 'single'`，否则运行时冲突。
:::

## 二、Output 出口

```js
const path = require("path");
output: {
  path: path.resolve(__dirname, "dist"), // 必须绝对路径
  filename: "[name].[contenthash].js",   // 入口产物名
  chunkFilename: "[name].[contenthash].js", // 非入口 chunk
  clean: true,            // Webpack 5 内置清空 dist
  publicPath: "auto",     // 资源公共路径前缀（CDN/子路径）
}
```

### 文件名占位符

| 占位符 | 何时变化 | 用途 |
|---|---|---|
| `[name]` | 入口名 | 可读命名 |
| `[id]` | chunk id | — |
| `[hash]` / `[fullhash]` | **整次编译** hash（任意文件变都变） | 不利缓存 |
| `[chunkhash]` | 该 chunk 或依赖变 | chunk 级缓存 |
| `[contenthash]` | **该文件内容变** | ✅ 长效缓存首选 |

可截断：`[contenthash:8]`（默认长度 20）。

> ⚠️ **`output.hashFunction` 在 Webpack 5 仍默认 `md4`**（不是 xxhash64）——只有 `experiments.futureDefaults: true` 才切 xxhash64。md4 在 OpenSSL 3.0 下默认被禁用，FIPS 环境需手动换 xxhash64。社区资料常误写「v5 默认 xxhash64」，以官方 `defaults.js` 为准。

## 三、Loaders 概念

Loaders 把非 JS/JSON 文件转换成有效模块。在 `module.rules` 里配置：

```js
module: {
  rules: [
    {
      test: /\.css$/i,                  // 正则，不带引号
      use: ["style-loader", "css-loader"], // 链：右到左执行
      exclude: /node_modules/,
    },
  ],
}
```

::: warning Loader 链从右到左、从下到上
`['style-loader', 'css-loader', 'sass-loader']` 实际执行顺序是 **sass → css → style**。写反顺序会导致转换失败。
:::

- `Rule` 核心属性：`test` / `use` / `loader`（单 loader 简写）/ `options` / `include` / `exclude` / `enforce` / `oneOf` / `resourceQuery` / `type`。
- `enforce: 'pre' | 'post'` 控制 loader 执行阶段。
- `oneOf` 命中第一条匹配即停。
- inline loader 写法（`import 'css-loader!./x.css'`）在 **Webpack 5 已弃用**，优先用 `module.rules`。

### 常用 loaders

```js
rules: [
  // Babel 转译现代 JS
  { test: /\.m?js$/, exclude: /node_modules/, use: "babel-loader" },
  // CSS：开发用 style-loader 注入，生产用 MiniCssExtractPlugin.loader
  { test: /\.css$/i, use: ["style-loader", "css-loader"] },
  // Sass：链尾 sass-loader 先编译
  { test: /\.s[ac]ss$/i, use: ["style-loader", "css-loader", "sass-loader"] },
]
```

- **babel-loader**：装 `babel-loader @babel/core @babel/preset-env`，务必 `exclude: /node_modules/`（已转译，跳过大幅提速）。要保留 tree-shaking，`@babel/preset-env` 须设 `{ modules: false }`，否则 ESM 被转成 CJS。
- **css-loader**：解析 CSS 里的 `@import` / `url()`，**只解析不注入页面**；`importLoaders` 要等于它前面的 loader 数（如配 postcss + sass 设 `2`）。
- **style-loader**：把 CSS 通过 `<style>` 注入 DOM（开发用）；生产换成 `MiniCssExtractPlugin.loader`。**二者不可同用**。
- **sass-loader**：需另装 `sass`（Dart Sass）或 `sass-embedded`；`additionalData` 可注入全局变量。

## 四、Asset Modules（Webpack 5）

Webpack 5 内置 Asset Modules，**取代** `file-loader` / `url-loader` / `raw-loader`，无需额外 loader：

```js
rules: [
  { test: /\.(png|svg|jpg|gif)$/i, type: "asset/resource" }, // 发射文件，导出 URL
  { test: /\.svg$/i, type: "asset/inline" },                 // data URI
  { test: /\.txt$/i, type: "asset/source" },                 // 源码字符串
  {
    test: /\.png$/i,
    type: "asset", // 按大小自动：< 8KB 内联，否则发射文件
    parser: { dataUrlCondition: { maxSize: 8 * 1024 } },
  },
]
```

| type | 取代 | 导入返回 |
|---|---|---|
| `asset/resource` | file-loader | 最终 URL |
| `asset/inline` | url-loader | `data:...base64` 串 |
| `asset/source` | raw-loader | 源码字符串 |
| `asset` | url-loader（带阈值） | 按 8KB 自动选 |

- 阈值默认 **8192 字节**（`parser.dataUrlCondition.maxSize`）。
- 输出名：`output.assetModuleFilename`（全局）或 `Rule.generator.filename`（单规则，优先级更高）。
- Webpack 5.38+ 自动从 `new URL('./logo.svg', import.meta.url)` 创建 asset module。

> ⚠️ JSON 内置支持，但命名导入 `import { foo } from './data.json'` 会触发不符 ESM 规范的警告，建议只用默认导入。

## 五、Plugins

Plugin 是带 `apply(compiler)` 方法的对象，通过 tapable 钩子接入整个编译生命周期，做 loader 做不到的事（优化、产物管理、注入变量）。

```js
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

plugins: [
  new HtmlWebpackPlugin({ title: "My App" }), // 生成 HTML 并自动注入 bundle
  new webpack.DefinePlugin({                   // 编译期常量
    "process.env.API": JSON.stringify("https://api.example.com"),
  }),
  new webpack.ProvidePlugin({ $: "jquery" }),  // 全局免 import
]
```

- **Loader vs Plugin**：loader 转换**单个文件**、作用域局限模块；plugin 访问**整个 compilation**、生成文件/优化 bundle。
- 内置插件挂在 `webpack` 命名空间（`new webpack.DefinePlugin(...)`），需 `require('webpack')`。
- **HtmlWebpackPlugin**（社区）：自动注入所有 bundle 的 `<script>` 与抽出的 CSS `<link>`；默认 `scriptLoading: 'defer'`、`inject: true`；多次实例化生成多页。
- **DefinePlugin**：值**必须 `JSON.stringify`**（字符串当代码片段使用），最常见坑是写 `VERSION: '1.0'` 而非 `JSON.stringify('1.0')` 导致被当变量名报错；配合 minifier 做死代码消除。
- **MiniCssExtractPlugin**：把 CSS 抽成独立文件（生产用），`rules` 里用 `MiniCssExtractPlugin.loader` 取代 `style-loader`，且**必须配 HtmlWebpackPlugin** 才能自动注入 `<link>`。

---

进入 [指南 · 进阶](./advanced)：Mode、代码分割、动态 import 与 magic comments、tree-shaking。
