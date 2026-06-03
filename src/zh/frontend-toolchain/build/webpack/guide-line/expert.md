---
layout: doc
outline: [2, 3]
---

# 指南 · 高级

> 基于 **Webpack 5.x**。本篇覆盖长效缓存、构建性能、库打包、Externals 与 Module Federation。

## 一、长效缓存（Caching）

目标：内容不变的文件 hash 不变，最大化浏览器缓存命中。三件套：

```js
output: {
  filename: "[name].[contenthash].js", // ① 内容 hash
},
optimization: {
  runtimeChunk: "single",               // ② 抽离 runtime/manifest
  moduleIds: "deterministic",           // ③ 稳定 module id（生产已默认）
  splitChunks: {
    cacheGroups: {
      vendor: { test: /node_modules/, name: "vendors", chunks: "all" }, // 分离第三方
    },
  },
}
```

- `[contenthash]` 仅内容变才变；`[hash]`/`[fullhash]` 任意文件变都变（破坏缓存）；`[chunkhash]` chunk 或依赖变才变。
- **runtime/manifest** 每次构建都注入 bundle，即使源码没改 `contenthash` 也会漂移 → 用 `runtimeChunk: 'single'` 抽离。
- 新增/删 `import` 会改变 module 解析顺序导致 id 漂移 → `moduleIds: 'deterministic'`（Webpack 5 生产默认，取代 Webpack 4 的 `HashedModuleIdsPlugin`）基于内容/路径分配稳定 id。

## 二、构建性能（Build Performance）

- **限制 loader 范围**：`babel-loader` 必须 `include: path.resolve(__dirname, 'src')` 或 `exclude: /node_modules/`，否则对 `node_modules` 全跑、极慢。
- **持久化缓存（最大提速点）**：

```js
cache: {
  type: "filesystem",
  buildDependencies: { config: [__filename] }, // 强烈推荐
}
```

> ⚠️ 不配 `buildDependencies.config: [__filename]`，改了 `webpack.config.js` 缓存不会失效、会用旧产物——常见踩坑。`cache` 默认 development 为 `memory`、production 为 `false`（需手动开 filesystem）。这是 Webpack 5 新特性，**取代** Webpack 4 的 `cache-loader` / `hard-source-webpack-plugin`。

- **开发态**：用内置 `watch`，`devtool` 用 `eval-cheap-module-source-map`，**避免生产专用工具**（Terser、`[contenthash]`、ModuleConcatenationPlugin）。
- **TypeScript 提速**：`ts-loader` 设 `transpileOnly: true` 关类型检查 + `ForkTsCheckerWebpackPlugin` 单独进程检查。
- `thread-loader` 开工作池，但别开太多 worker（IPC 传输昂贵）。

## 三、库打包（Authoring Libraries）

```js
module.exports = {
  output: {
    filename: "my-lib.js",
    library: { name: "MyLib", type: "umd" }, // 暴露方式
    globalObject: "this", // 同时支持 Node + 浏览器
  },
  externals: { lodash: { commonjs: "lodash", amd: "lodash", root: "_" } }, // 排除 peer 依赖
};
```

- `library.type` 取值：`var`（默认）/ `umd` / `commonjs2` / `module`（ESM，需 `experiments.outputModule: true`）/ `amd` / `system` 等。
- `library.export` 指定暴露哪个导出（如 `'default'`）。
- **别把 peer 依赖打进库**，用 `externals` 排除，改运行时从消费者获取。
- 同构库导出**数组**两份配置：`[serverConfig(target:'node'), clientConfig(target:'web')]`。

## 四、Externals

`externals` 阻止把指定包打进 bundle，改运行时从外部获取（主要服务库开发）：

```js
externals: {
  jquery: "jQuery",          // 运行时读全局 jQuery
},
externalsType: "umd",        // 默认 'var'
externalsPresets: { node: true }, // 批量外置 Node 内置模块
```

- 形式：string / array / object（UMD 各模块系统）/ function（动态）/ regex。
- `externalsType` 取值 `var`（默认，当全局变量读）/ `module` / `commonjs` / `node-commonjs` / `script` 等。`module` / `import` 需 `experiments.outputModule`；`script` 注入 `<script>` 从 URL 加载（脚本必须是 classic script，不能含顶层 `import`/`export`）。
- `externalsPresets.node` 让 Node 内置模块经 `require` 外置。

## 五、Module Federation（模块联邦）

Webpack 5 独有：让多个**独立构建**在运行时组成单一应用，是微前端 / 跨团队共享模块的事实标准。每个构建既是 **container**（暴露模块）又是 **consumer**（消费远程模块）。

```js
const { ModuleFederationPlugin } = require("webpack").container;

new ModuleFederationPlugin({
  name: "app1",
  filename: "remoteEntry.js",
  exposes: { "./Button": "./src/Button" }, // 暴露（key 必须带 './'）
  remotes: { app2: "app2@http://localhost:3002/remoteEntry.js" }, // 消费
  shared: {
    react: { singleton: true, requiredVersion: "^18.0.0" },
  },
});
```

`shared` 子选项：`singleton`（默认 false，只允许一个版本，React 这类必须 true）、`requiredVersion`、`strictVersion`（默认 true）、`eager`（默认 false）。

::: warning Module Federation 三大坑
- **`Shared module is not available for eager consumption`**：因为同步执行了共享代码。推荐解法是建**异步边界**——入口 `index.js` 只写 `import('./bootstrap')`，真正逻辑放 `bootstrap.js`；**不推荐** `shared.eager: true`。
- **`Module "./Button" does not exist in container`**：`exposes` 的 key **必须带 `'./'` 前缀**。
- **`output.uniqueName`** 必须每个联邦构建间全局唯一（默认从 `package.json` name 派生），同名会运行时静默冲突。
:::

---

进入 [指南 · 其他](./other)：开发服务器 / HMR、模块解析、目标环境、Webpack 4→5 迁移。
