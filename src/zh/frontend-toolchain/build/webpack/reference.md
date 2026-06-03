---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 **Webpack 5.x**。配置项默认值、API、常用 loader/plugin 速查。

## 配置文件五种导出形态

```js
// ① 对象（最常见）
module.exports = { mode: "production", entry: "./src/index.js" };
// ② 函数（动态）—— env 来自 CLI --env，argv 含 mode
module.exports = (env, argv) => ({ mode: argv.mode });
// ③ Promise（异步加载）
module.exports = async () => ({ /* ... */ });
// ④ 数组（multi-compiler，一次构建多目标）
module.exports = [serverConfig, clientConfig];
```

支持 TypeScript（`webpack.config.ts`，需 `ts-node` + `typescript`）。`--config <file>` 指定文件。

## 核心默认值速查

| 配置 | 默认值 |
|---|---|
| `mode` | `'production'` |
| `entry` | `'./src/index.js'` |
| `output.path` | `dist/`（必须绝对路径） |
| `output.filename` | `'[name].js'` |
| `output.chunkFilename` | `'[id].js'` |
| `output.assetModuleFilename` | `'[hash][ext][query]'` |
| `output.hashFunction` | `'md4'`（非 xxhash64） |
| `output.globalObject` | `'self'` |
| `resolve.extensions` | `['.js', '.json', '.wasm']` |
| `resolve.modules` | `['node_modules']` |
| `target` | 有 browserslist 则 `'browserslist'`，否则 `'web'` |
| `devtool` | development 偏 `eval` 类 |

## optimization 默认（按 mode）

| 选项 | production | development |
|---|---|---|
| `minimize` | `true`（TerserPlugin） | `false` |
| `moduleIds` / `chunkIds` | `'deterministic'` | `'named'` |
| `usedExports` / `sideEffects` | `true` | `'flag'` |
| `concatenateModules` | `true` | `false` |
| `realContentHash` | `true` | `false` |

- `runtimeChunk`: `false`（默认）/ `'single'` / `'multiple'` / `true`。
- `splitChunks`: `chunks:'async'`、`minSize:20000`、`maxAsyncRequests/maxInitialRequests:30`、`enforceSizeThreshold:50000`；cacheGroups `defaultVendors`(/node_modules/, -10) + `default`(minChunks 2, -20)。
- `minimizer: ['...']` 中 `'...'` 保留默认 minimizer。

## devServer 默认

| 选项 | 默认 |
|---|---|
| `port` | `8080` |
| `host` | `'localhost'` |
| `hot` | `true` |
| `liveReload` | `true` |
| `compress` | `true` |
| `client.overlay` | `true` |
| `static` | 服务 `'public'` |
| `historyApiFallback` | `false` |
| `allowedHosts` | `'auto'` |

## performance 默认

`hints`: production `'warning'` / 否则 `false`；`maxAssetSize` / `maxEntrypointSize` 各 `250000` 字节；`assetFilter` 默认排除 `.map`。

## cache 默认

development `{ type: 'memory' }` / production `false`。开持久化：`{ type: 'filesystem', buildDependencies: { config: [__filename] } }`，目录 `node_modules/.cache/webpack`。

## Asset Modules 类型

| type | 取代 | 导入返回 |
|---|---|---|
| `asset/resource` | file-loader | URL |
| `asset/inline` | url-loader | data URI |
| `asset/source` | raw-loader | 字符串 |
| `asset` | url-loader | 按 8KB 自动 |

## 常用内置插件（`webpack` 命名空间）

`DefinePlugin`（编译期常量，值须 `JSON.stringify`）、`EnvironmentPlugin`、`ProvidePlugin`（全局免 import）、`IgnorePlugin`（排 moment locale）、`BannerPlugin`、`SplitChunksPlugin`、`ModuleConcatenationPlugin`（scope hoisting）、`HotModuleReplacementPlugin`、`container.ModuleFederationPlugin`、`DllPlugin`。

## 常用社区插件

`html-webpack-plugin`（生成 HTML 注入 bundle）、`mini-css-extract-plugin`（抽 CSS）、`css-minimizer-webpack-plugin`（压缩 CSS）、`copy-webpack-plugin`、`compression-webpack-plugin`、`fork-ts-checker-webpack-plugin`、`webpack-bundle-analyzer`、`webpack-merge`。

## Module Methods / Variables（API）

```js
import(/* webpackChunkName: "x" */ "./x.js"); // 动态导入（split point）
require.context(dir, recursive, filter, "sync"); // mode 默认 'sync'
import.meta.webpackContext(dir, { recursive, regExp, mode }); // ES6 等价
```

- 运行时变量：`__webpack_public_path__`（可运行时赋值）、`module.hot` / `import.meta.webpackHot`、`__webpack_require__`、`__non_webpack_require__`、`__webpack_hash__`。
- `node.__dirname` / `__filename`：`false`=undefined、`'mock'`、`true`=Node 实际值。
- 文件类型强制：`.mjs` / `"type": "module"` 只允许 ESM 且 import 须带扩展名；`.cjs` / `"type": "commonjs"` 只允许 CommonJS。

## CLI 速查

```bash
npx webpack                      # 默认读 webpack.config.js
npx webpack --mode development
npx webpack --config prod.config.js
npx webpack --env production goal=local
npx webpack serve --open --port 9000
npm run build -- --color         # npm script 透传参数
```
