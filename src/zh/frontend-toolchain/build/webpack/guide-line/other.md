---
layout: doc
outline: [2, 3]
---

# 指南 · 其他

> 基于 **Webpack 5.x**。本篇覆盖开发服务器与 HMR、模块解析、目标环境，以及 Webpack 4→5 迁移清单。

## 一、开发服务器（webpack-dev-server）

```bash
npx webpack serve --open
```

```js
devServer: {
  static: "./dist",          // 取代 Webpack 4 的 contentBase
  port: 8080,                // 默认端口
  hot: true,                 // HMR，默认已开
  historyApiFallback: true,  // SPA 路由：404 回退 index.html
  proxy: [{ context: ["/api"], target: "http://localhost:3000" }],
  client: { overlay: true }, // 浏览器全屏错误遮罩
}
```

- dev-server **不落盘**，bundle 只存内存从服务器根路径提供（磁盘看不到新文件属正常）。
- 三种自动重编译：`webpack --watch`（需手动刷新）、**webpack-dev-server**（推荐，内存 + live reload）、`webpack-dev-middleware`（配 Express 自定义服务器）。

> ⚠️ **v4→v5 迁移**：`contentBase`→`static`；`before`/`after`/`onBeforeSetupMiddleware` → `setupMiddlewares`；很多顶层选项迁入 `static` / `client` / `server`。用 Node.js API 时配置文件里的 `devServer` 会被忽略，必须传给构造函数。

## 二、HMR（热模块替换）

HMR 在运行时增删替换模块而不整页刷新，**保留应用状态**。**仅开发用，绝不用于生产**。

```js
if (module.hot) {
  module.hot.accept("./print.js", () => {
    // 接受 ./print.js 的更新，在此重新执行/重绑
  });
}
```

- 流程：runtime 检查更新 → 异步下载 update manifest（含新 hash + 更新 chunk 列表）+ update chunk → 应用更新。
- dev-server v4+ HMR **默认开启**（`devServer.hot: true`），无需再手动加 `HotModuleReplacementPlugin`。
- 必须用 `if (module.hot)` 守卫（生产中为 `undefined`，会被 tree-shaking 移除）。strict ESM 中用 `import.meta.webpackHot` 代替 `module.hot`。
- **无 handler 时更新沿依赖树向上冒泡**，最终可能退化成整页刷新。
- 框架方案：React Fast Refresh、Vue Loader 内置、Angular HMR。

> ⚠️ HMR 后旧事件处理器仍指向旧函数，必须在 `accept` 回调里重渲染 / 重绑（移除旧 DOM 后重新创建再 append）。

## 三、模块解析（Module Resolution）

Webpack 用 enhanced-resolve 解析模块。三类导入：绝对路径、相对路径、模块路径（在 `resolve.modules` 各目录查找）。

```js
resolve: {
  extensions: [".ts", "..."], // '...' 保留默认 ['.js','.json','.wasm']
  alias: { "@": path.resolve(__dirname, "src") }, // 尾加 $ 精确匹配
  modules: ["node_modules"],
  fallback: { crypto: false }, // Webpack 5 关键
}
```

::: warning Webpack 5 移除 Node 核心 polyfill
Webpack 5 **不再自动注入** Node 核心模块的 polyfill（`crypto` / `stream` / `http` / `buffer` / `path`…）。升级后常报 `Module not found: Can't resolve 'crypto'`，必须配 `resolve.fallback` 指向 `crypto-browserify` 等 polyfill 包，或设 `false` 禁用。全局 `Buffer` / `process` 也被移除，需用 `ProvidePlugin` 注入。
:::

- `resolve.extensions` 自定义后**覆盖**默认，需用 `'...'` 保留 `.js`/`.json`/`.wasm`。
- `resolve.mainFields`：web target 默认 `['browser', 'module', 'main']`。
- npm link 场景可设 `resolve.symlinks: false`。
- Webpack 5.105+ 内置 `resolve.tsconfig` 支持 TS path mapping，取代 `tsconfig-paths-webpack-plugin`。

## 四、目标环境（Targets）

```js
target: "web",            // 默认（有 browserslist 配置则 'browserslist'）
// target: "node18.12",   // Node 环境，可带版本号
// target: ["web", "es5"],// Webpack 5 支持多目标（取公共子集）
```

- 默认：有 browserslist 配置则 `'browserslist'`，否则 `'web'`。
- 取值：`web` / `node` / `webworker` / `electron-main` / `es5` / `es2020` / `browserslist` 等。
- **Webpack 5 支持数组多目标**（`['web', 'es5']`），Webpack 4 不支持；`web` 与 `node` 不能混。
- 别与 `output.libraryTarget`（库暴露方式）混淆。

## 五、Webpack 4 → 5 迁移清单

| 项 | Webpack 4 | **Webpack 5** |
|---|---|---|
| 资源加载 | file/url/raw-loader | **Asset Modules**（`type: 'asset/*'`） |
| 清空输出 | clean-webpack-plugin | **`output.clean: true`** |
| 持久化缓存 | cache-loader / hard-source | **`cache: { type: 'filesystem' }`** |
| 稳定 module id | HashedModuleIdsPlugin | **`moduleIds: 'deterministic'`** |
| Node core polyfill | 自动注入 | **移除**，需 `resolve.fallback` |
| dev-server 静态目录 | `contentBase` | **`static`** |
| 微前端 | 无 | **Module Federation** |

> ⚠️ 升级最常见的报错来源是 **Node core polyfill 移除**（`crypto`/`stream`/`buffer` not found）；其次是忘记把 file/url-loader 换成 Asset Modules（混用会双重处理）。`watchOptions.aggregateTimeout` 在 v5 默认降到 20ms（v4 是 200~300ms）。

## 六、TypeScript 集成

```js
{ test: /\.tsx?$/, use: "ts-loader", exclude: /node_modules/ }
```

- `ts-loader`：完整类型检查（慢）；提速用 `transpileOnly: true` + `ForkTsCheckerWebpackPlugin` 把类型检查放单独进程。
- 或用 `babel-loader` + `@babel/preset-typescript`：快但**不做类型检查**（只剥离类型），需另跑 `tsc --noEmit`。

---

配置项默认值、API、常用 loader/plugin 速查见 [参考](../reference)。
