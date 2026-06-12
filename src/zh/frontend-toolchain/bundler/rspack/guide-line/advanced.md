---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **Rspack 2.0**。builtin:swc-loader 完整配置、webpack 迁移实操五步、插件兼容策略与压缩器陷阱、splitChunks/tree-shaking、Module Federation 三档支持。

## 一、builtin:swc-loader 完整配置

### 语法识别：detectSyntax

2.0 推荐 `detectSyntax: 'auto'`——按扩展名自动推断 parser（`.ts`→typescript、`.tsx`→typescript+tsx、`.js/.jsx`→ecmascript+jsx），一条 rule 吃下混合代码库。显式写了 `jsc.parser.syntax` 时以显式配置为准，不再推断。

### 降级目标：jsc.target 与 env.targets 二选一

```js
options: {
  // 方式 A：ECMA 版本
  jsc: { target: 'es2015' },
  // 方式 B：browserslist（二者不能同时配置！）
  // env: { targets: ['chrome >= 87', 'firefox >= 78', 'safari >= 14'] },
},
```

> 2.0 改进：两者都不配时，builtin:swc-loader（连同内置压缩器）**自动从顶层 `target` 派生**降级目标，不必重复声明。

### polyfill：env.mode

对位 Babel 的 `useBuiltIns`：

```js
options: {
  env: {
    mode: 'usage',          // 按实际用到的 API 注入（也可 'entry'）
    coreJs: '3.44',
    targets: ['chrome >= 87'],
  },
},
```

⚠️ 必须把 `core-js` **排除出转译范围**（core-js 自身被 SWC 编译会失效），并把它装进 `dependencies`。

### React：JSX 与 Fast Refresh

```js
import ReactRefreshPlugin from '@rspack/plugin-react-refresh';
const isDev = process.env.NODE_ENV === 'development';

export default {
  plugins: [isDev && new ReactRefreshPlugin()].filter(Boolean),
  module: {
    rules: [{
      test: /\.(jsx?|tsx?)$/,
      loader: 'builtin:swc-loader',
      options: {
        detectSyntax: 'auto',
        jsc: { transform: { react: {
          runtime: 'automatic', development: isDev, refresh: isDev,
        } } },
      },
      type: 'javascript/auto',
    }],
  },
};
```

`@babel/preset-react` 与 Babel 版 react-refresh 插件都不再需要。**类型检查仍是独立流程**：`tsc --noEmit` 并行跑，或上 `ts-checker-rspack-plugin`。

## 二、webpack 迁移实操五步

1. **换包**：`npm add @rspack/core @rspack/cli @rspack/dev-server -D`，再 `npm remove webpack webpack-cli webpack-dev-server`；`webpack-chain`/`webpack-merge` 换 `rspack-chain`/`rspack-merge`。
2. **改配置入口**：`webpack.config.js` → `rspack.config.js`（默认读取，无需指路径）；scripts 改 `rspack dev/build`。
3. **换 loader**：`babel-loader`/`swc-loader` → `builtin:swc-loader`；file/url/raw-loader → asset modules；`postcss-loader`（常规场景）→ `builtin:lightningcss-loader`。
4. **换插件**：`webpack.DefinePlugin` → `rspack.DefinePlugin`；`copy-webpack-plugin` → `rspack.CopyRspackPlugin`；`mini-css-extract-plugin` → `rspack.CssExtractRspackPlugin`（loader 同步换）；其余查[官方兼容清单](https://rspack.rs/guide/compatibility/plugin)。
5. **对齐压缩器**：`terser-webpack-plugin` → `rspack.SwcJsMinimizerRspackPlugin`，`css-minimizer-webpack-plugin` → `rspack.LightningCssMinimizerRspackPlugin`。

::: warning 自定义 minimizer 的整体失效陷阱
一旦显式配置 `optimization.minimizer`，Rspack 的**默认压缩器全部失效**。只配了 JS 压缩器 → CSS 不再被压缩。两类要一起写：

```js
optimization: {
  minimizer: [
    new rspack.SwcJsMinimizerRspackPlugin(),
    new rspack.LightningCssMinimizerRspackPlugin(),
  ],
},
```
:::

## 三、插件兼容策略

官方口径：Top 50 高下载 webpack 插件 **85%+ 可直接使用或有替代**；API 对齐基准是 **webpack 5**。兼容清单分五档：

| 档位 | 数量 | 例子 |
|---|---|---|
| 完全兼容 | 28 | html-webpack-plugin、webpack-bundle-analyzer、compression-webpack-plugin、@sentry/webpack-plugin |
| 内置替代 | 5 | copy/mini-css-extract/terser/css-minimizer/circular-dependency |
| 替代方案 | 10 | fork-ts-checker → ts-checker-rspack-plugin |
| 部分兼容 | 3 | webpack-assets-manifest（仅基本用法） |
| 不兼容 | 8 | @ngtools/webpack、critters-webpack-plugin 等 |

不兼容的根因通常是**深度触碰 webpack 内部实现**（JS 侧内部对象/未对齐 hooks）。处理顺序：查清单找替代 → 看内置能力（如 SRI 用 `SubresourceIntegrityPlugin`）→ 提 issue。

## 四、splitChunks 与 tree-shaking

### splitChunks：webpack 配置直接搬

```js
optimization: {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendor: { test: /[\\/]node_modules[\\/]/, name: 'vendors', priority: -10 },
    },
  },
},
```

`chunks`/`cacheGroups`/`minSize`/`maxSize` 语义与 webpack 一致；2.0 补齐 `enforceSizeThreshold`（生产默认 50000）。

### tree-shaking：生产默认全开

`mode: 'production'` 自动启用 `usedExports`、`sideEffects`、`providedExports`、`innerGraph`。2.0 进一步增强静态分析：CommonJS `require` 的解构/属性访问分析、`#__NO_SIDE_EFFECTS__` 编译器注解、`optimization.inlineExports` 等。日常要做的只有两件事：包内正确声明 `package.json` 的 `sideEffects`；少写动态访问破坏静态结构。

## 五、Module Federation：三档支持

| 档位 | 来源 | 适用 |
|---|---|---|
| v1.0 | `rspack.container.ModuleFederationPluginV1` | 与 webpack MF 对齐，迁移期用 |
| **v1.5** | 内置 `rspack.container.ModuleFederationPlugin` | v1.0 全功能 + 运行时插件，多数项目推荐 |
| v2.0 | `@module-federation/enhanced/rspack` | 动态 TS 类型提示、DevTools、预加载，大规模微前端 |

```js
import { rspack } from '@rspack/core';
export default {
  output: { uniqueName: 'app1' },
  plugins: [
    new rspack.container.ModuleFederationPlugin({
      name: 'app1',
      exposes: { './Button': './src/Button' },
      remotes: { app2: 'app2@http://localhost:3002/remoteEntry.js' },
      shared: { react: { singleton: true } },
    }),
  ],
};
```

2.0 增强：**shared 依赖支持 tree-shaking**（裁剪到实际使用面）；`@module-federation/runtime-tools` 改为可选 peerDependency。与 webpack 应用同页共存时注意 2.0 的 `chunkLoadingGlobal` 默认改名 `rspackChunk*`（反而避免了全局冲突）。

---

进入 [指南 · 专家](./expert)：为什么快（并行/增量架构）、性能三件套（incremental/持久缓存/lazyCompilation）、性能剖析、2.0 迁移清单与库构建。
