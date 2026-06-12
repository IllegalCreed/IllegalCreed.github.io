---
layout: doc
outline: [2, 3]
---

# 参考

> 版本基线 **Rspack 2.0**。包替换、内置插件/loader 替代、2.0 配置搬迁与默认值变更速查。

## CLI 速查

```bash
rspack dev        # 开发服务器（需安装 @rspack/dev-server）
rspack build      # 生产构建
rspack preview    # 本地预览构建产物
rspack build -c rspack.prod.config.mjs   # 指定配置文件
RSPACK_PROFILE=ALL rspack build          # 产出性能 trace（可用 perfetto 查看）
```

## 包替换对照（webpack → Rspack）

| webpack 包 | Rspack 对应 |
|---|---|
| `webpack` | `@rspack/core` |
| `webpack-cli` | `@rspack/cli` |
| `webpack-dev-server` | `@rspack/dev-server` |
| `webpack-dev-middleware` | `@rspack/dev-middleware` |
| `webpack-chain` | `rspack-chain` |
| `webpack-merge` | `rspack-merge` |

## 内置插件替代速查

| webpack 生态插件 | Rspack 方案 |
|---|---|
| `webpack.DefinePlugin` | `rspack.DefinePlugin`（选项一致） |
| `copy-webpack-plugin` | `rspack.CopyRspackPlugin` |
| `mini-css-extract-plugin` | `rspack.CssExtractRspackPlugin`（loader 也要换） |
| `terser-webpack-plugin` | `rspack.SwcJsMinimizerRspackPlugin` |
| `css-minimizer-webpack-plugin` | `rspack.LightningCssMinimizerRspackPlugin` |
| `html-webpack-plugin` | 兼容可用；更快的内置版 `rspack.HtmlRspackPlugin` |
| `fork-ts-checker-webpack-plugin` | `ts-checker-rspack-plugin`（社区包） |
| `tsconfig-paths-webpack-plugin` | 内置配置 `resolve.tsConfig` |
| `circular-dependency-plugin` | `rspack.CircularCheckRspackPlugin` |

> 兼容性总况：Top 50 高下载 webpack 插件 **85%+ 可用或有替代**；官方清单分五档——完全兼容（28）/内置替代（5）/替代方案（10）/部分兼容（3）/不兼容（8，如 `@ngtools/webpack`）。

## loader 替代速查（性能向）

| 慢（JS 侧） | 快（Rust 侧） |
|---|---|
| `babel-loader` / `swc-loader` | `builtin:swc-loader` |
| `postcss-loader`（常规前缀/降级） | `builtin:lightningcss-loader` |
| `file-loader` / `url-loader` / `raw-loader` | `type: 'asset/resource' / 'asset/inline' / 'asset/source'` |
| `less-loader` | `sass-loader` + `sass-embedded`（官方性能建议） |

## 2.0 配置搬迁速查（experiments 转正）

| 1.x | 2.0 |
|---|---|
| `experiments.cache` | 顶层 `cache`（`{ type: 'persistent' }`） |
| `experiments.incremental` | 顶层 `incremental` |
| `experiments.lazyCompilation` | 顶层 `lazyCompilation`（1.5 起已顶层化） |
| `experiments.outputModule` | `output.module` |
| `experiments.css` | 移除——CSS 由 `module.rules` 的 `type` 控制 |
| `experiments.topLevelAwait` | 移除——已稳定，ESM 默认启用 |
| `experiments.rspackFuture` | 移除——`bundlerInfo` 迁至 `output.bundlerInfo` |
| `experiments.parallelLoader` | 移除——已稳定默认启用 |

## 2.0 默认值变更速查

| 配置 | 1.x | 2.0 |
|---|---|---|
| `devtool`（开发） | `eval` | `cheap-module-source-map` |
| `devtool`（生产 + CLI） | `source-map` | `false` |
| `output.chunkLoadingGlobal` | `webpackChunk*` | `rspackChunk*` |
| `output.hotUpdateGlobal` | `webpackHotUpdate*` | `rspackHotUpdate*` |
| `module.parser.javascript.exportsPresence` | `'warn'` | `'error'` |
| `experiments.asyncWebAssembly` | `false` | `true` |
| `resolve.extensions` | 含 `.wasm` | 不含（需显式） |

## 与 Rstack 生态分工

| 工具 | 职责 | 何时用 |
|---|---|---|
| **Rspack** | 底层打包器（对位 webpack） | webpack 迁移、需要底层完全控制 |
| Rsbuild | 一体化构建（对位 Vite/CRA） | 新应用、要开箱体验 |
| Rslib | 库构建（基于 Rsbuild） | npm 包/组件库 |
| Rspress | 静态文档站 | 文档/官网 |
| Rsdoctor | 构建分析 | 性能瓶颈定位、重复依赖 |
| Rstest | 测试框架 | 与 Rspack 同管线的测试 |

## 版本现状（2026-06）

| 项 | 状态 |
|---|---|
| 最新主版本 | **2.0**（2026-04-22 发布） |
| Node 要求 | **20.19+ / 22.12+**（1.x 为 18.12+） |
| 发布格式 | 核心包**纯 ESM**（Node 20+ `require(esm)` 可加载） |
| 性能基准 | 生产构建 3.1s（无缓存）/ **1.4s**（持久缓存）；HMR ~118ms |
| 1.x 维护 | 关键修复持续，新特性进 2.x |

> 2.0 升级细节（纯 ESM、`.swcrc` 不再读取、`EsmLibraryPlugin` 移除等）见[专家篇](./guide-line/expert)。
