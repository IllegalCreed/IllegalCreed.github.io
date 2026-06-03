---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 基于 **Webpack 5.x**。本篇覆盖 Mode、代码分割、动态 import 与 magic comments、tree-shaking、生产构建。

## 一、Mode 模式

`mode` 取 `'none' | 'development' | 'production'`，**默认 `production`**，会自动启用对应环境的内置优化：

| mode | 关键内置行为 |
|---|---|
| `production` | `NODE_ENV='production'`、`minimize`（TerserPlugin）、`moduleIds/chunkIds='deterministic'`、`usedExports`/`sideEffects`/`concatenateModules`/`realContentHash`=true |
| `development` | `NODE_ENV='development'`、`moduleIds/chunkIds='named'`、`devtool='eval'`、`cache={type:'memory'}`、`pathinfo=true`、不压缩 |
| `none` | opt out 所有默认优化，完全手动 |

::: warning mode ≠ webpack.config.js 里的 NODE_ENV
`mode` 只在**构建过程内部**通过 DefinePlugin 设置 `process.env.NODE_ENV`（供你的 `/src` 源码使用）。**配置文件自身**访问的 `process.env.NODE_ENV` 不会被 `mode` 自动设置——要它得显式 `NODE_ENV=production webpack ...`。
:::

## 二、Optimization 与代码分割

### 三种代码分割方式

1. **多入口**：手动分，但 `index` 和 `another` 都 `import lodash` 会**各打一份**（最大缺陷）。
2. **防重复**：`dependOn`（入口间共享）或 `SplitChunksPlugin`（自动抽公共依赖）。
3. **动态 `import()`**：内联分割点，生成独立 chunk。

### SplitChunksPlugin

```js
optimization: {
  splitChunks: {
    chunks: "all", // 默认 'async' 只拆动态 import；'all' 才提取 vendor
  },
  runtimeChunk: "single", // 把 runtime/manifest 抽到共享 chunk
}
```

默认值：`chunks: 'async'`、`minSize: 20000`（20KB）、`maxAsyncRequests/maxInitialRequests: 30`、`enforceSizeThreshold: 50000`（超此值忽略 minSize 强制拆）。默认两个 cacheGroups：`defaultVendors`（`/node_modules/`，priority -10）、`default`（minChunks 2，priority -20）。

提取 vendor 经典写法：

```js
splitChunks: {
  cacheGroups: {
    vendor: { test: /[\\/]node_modules[\\/]/, name: "vendors", chunks: "all" },
  },
}
```

> ⚠️ `chunks` 默认 `'async'` **不拆入口代码**；要提取 vendor 必须设 `'all'`。官方建议不要为工具/共享模块乱建 entry（会重复打包），改用 SplitChunks。

## 三、动态 import() 与 Magic Comments

```js
button.addEventListener("click", () => {
  import(/* webpackChunkName: "print" */ "./print.js").then((module) => {
    module.default(); // CommonJS 模块需 .default 取默认导出
  });
});
```

`import()` 返回 Promise、生成独立 chunk。Magic comments **必须用 `/* */` 块注释**（行注释 `//` 和 JSDoc `/** */` 都不生效）：

| 注释 | 作用 |
|---|---|
| `webpackChunkName` | 命名 chunk（支持 `[index]` / `[request]`） |
| `webpackMode` | `lazy`（默认，每个 import 一个 chunk）/ `lazy-once`（共用单 chunk）/ `eager`（不额外分 chunk，Promise 预 resolve）/ `weak` |
| `webpackPrefetch` | 未来导航用，**空闲时**加载（`<link rel=prefetch>`，低优先级） |
| `webpackPreload` | 当前导航用，**与父 chunk 并行**加载（`<link rel=preload>`，中高优先级） |
| `webpackExports` | 只打包指定导出，配合 tree-shaking |
| `webpackIgnore` | `true` 禁用解析 |

> ⚠️ **prefetch vs preload**：prefetch 父 chunk 加载完**之后**才开始（两次往返）；preload 与父 chunk **并行**（一次往返）。动态路径不能完全是变量，至少要有静态目录前缀（如 `` `./locale/${lang}.json` ``），webpack 才能生成 context。

### 懒加载

懒加载建立在代码分割之上：构建时分 chunk，**运行时由用户交互触发**真正加载。`import()` 若不绑交互、脚本一跑就执行，就失去了懒加载意义。`require.context` 的 ES6 等价物是 `import.meta.webpackContext`。

## 四、Tree Shaking

Tree shaking = 死代码消除，**依赖 ES2015 `import`/`export` 的静态结构**——CommonJS（`require`）无法 tree shake。

```jsonc
// package.json —— 声明无副作用，可安全剪枝
{ "sideEffects": false }
```

- `optimization.usedExports`（生产默认 true）**只标记**未使用导出，真正删除靠 **minification（TerserPlugin）**——所以 tree-shaking 通常只在 `production` 完全生效。
- `@babel/preset-env` 必须设 `{ modules: false }` 保留 ES 模块，否则转 CJS 后无法 shake。

::: warning sideEffects 误删 CSS 经典坑
组件库设 `"sideEffects": false` 后，`import './Button.css'` 这种**有副作用**的导入会被当死代码删掉，组件失去样式。正确写法是列出有副作用的文件：

```jsonc
{ "sideEffects": ["**/*.css", "**/*.scss"] }
```

polyfill、原型修改、事件监听注册等隐性副作用文件同理，别被 `sideEffects: false` 误删。
:::

`/*#__PURE__*/` 标记单个函数调用无副作用，配合 `innerGraph`（生产默认 true）。

## 五、生产构建

推荐用 **webpack-merge** 拆分配置：

```js
// webpack.common.js → 公共
// webpack.dev.js
const { merge } = require("webpack-merge");
module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  devServer: { static: "./dist" },
});
// webpack.prod.js
module.exports = merge(common, {
  mode: "production",
  devtool: "source-map", // 生产用 source-map，避免 inline-*/eval-*
});
```

```jsonc
"scripts": {
  "start": "webpack serve --open --config webpack.dev.js",
  "build": "webpack --config webpack.prod.js"
}
```

- **devtool**：开发推荐 `'eval-cheap-module-source-map'`（快重建 + 可调试）；生产用 `'source-map'` 或 `'hidden-source-map'`。`inline-*` / `eval-*` 增大 bundle 或性能差，**不用于生产**。
- 应用代码里的 `process.env.NODE_ENV`（经 mode/DefinePlugin 设置）让 React 等库在生产移除开发警告、显著减小 bundle。

## 六、环境变量

`webpack --env` 把变量传给**配置函数**（注意：不是 `process.env`，要读它配置必须 export 函数）：

```js
// webpack.config.js
module.exports = (env, argv) => ({
  mode: argv.mode,
  // npx webpack --env production → env.production === true
  // npx webpack --env goal=local → env.goal === 'local'
  devtool: env.production ? "source-map" : "eval-source-map",
});
```

把环境变量**注入 bundle 代码**则用 `DefinePlugin`（字符串替换）或 `EnvironmentPlugin`（读 `process.env`）——这与配置层的 `--env` 是两套东西。

---

进入 [指南 · 高级](./expert)：长效缓存、构建性能、库打包、Module Federation。
