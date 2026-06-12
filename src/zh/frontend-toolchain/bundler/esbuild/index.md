---
layout: doc
---

# esbuild

极快的 Web 打包器（**An extremely fast bundler for the web**），用 **Go 编写并编译为原生代码**，主打「**无需缓存的极致速度**」——官网基准（打包 10 份 three.js、含 minify + sourcemap）中 esbuild 0.39s，约为 webpack 5（41.21s）的 **100 倍**。它**内置 JS / CSS / TypeScript / JSX** 四类内容支持，提供 **CLI / JS / Go 三套 API**，覆盖 bundle、tree shaking、minify、source map、watch、本地开发服务器与插件机制。关键边界同样清晰：**不做类型检查**（剥类型需另跑 `tsc --noEmit`）、**不支持降级到 ES5**、**不做 HMR**、不内置 Vue/Svelte 等其他语言。**2026 年它是「基础设施级」工具**：版本仍是 **0.2x**（当前 0.28.x，minor 即破坏性变更，官方建议 `--save-exact`），处于维护态但被海量工具底层依赖——Vite（7 及之前）用它做依赖预打包与 TS/JSX 转译、tsup 基于它打库、Amazon CDK / Phoenix 用它打包；Rust 系（Rolldown/Rspack/Oxc）正在崛起，但 esbuild 仍是开启「JS 工具原生化」浪潮并依旧极主流的那一个。

## 评价

**优点**

- **快到改变行业认知**：Go 原生代码 + parse/link/codegen 全阶段并行 + 一切自研 + AST 只过约三遍，无缓存也比传统打包器快两个数量级
- **开箱即用**：JS/CSS/TS/JSX 内置，零配置即可打包；CLI / JS / Go 三套 API 形态一致
- **CSS 一等公民**：CSS 可作入口、`.module.css` 原生 CSS Modules、按 target 自动加前缀/降级现代语法
- **完整的现代产物能力**：tree shaking（`sideEffects` / `@__PURE__`）、esm 代码拆分、metafile 体积分析、define/drop/mangleProps 等优化选项齐全
- **开发体验内建**：watch 增量重建 + serve 按请求构建（永远最新产物）+ 基于 SSE 的 live reload
- **插件机制克制而高效**：onResolve/onLoad 作用于模块边界，filter 走 Go 正则先行筛选，虚拟模块等模式表达力足够
- **生态地位稳固**：Vite、tsup、Amazon CDK、Phoenix 等把它当底层引擎，是事实上的基础设施

**缺点**

- **不做类型检查**：TS 只剥类型，类型错误照样产出，必须另跑 `tsc --noEmit`，也不能生成 `.d.ts`
- **不支持 ES5**：无法把 ES6+ 语法降级到 ES5（遇到会直接报错），旧浏览器兼容要外接 Babel/SWC
- **没有 HMR**：live reload 只是整页刷新，模块级热替换被官方列入「不做」清单，应用开发体验不如 Vite/webpack
- **代码拆分仍「初级」**：splitting 仅支持 esm 输出，产物拆分策略远不如 Rollup/webpack 精细可控
- **插件不能动 AST**：不暴露 AST 操作 API，表达式级改写要在 onLoad 里自接 Babel 等工具
- **版本语义反直觉**：0.x 下 minor 版本承载破坏性变更，升级需读 changelog、锁精确版本
- **维护态 + 单一维护者**：作者明确当前不做活跃特性开发，新需求（如 HTML 支持）推进缓慢

## 文档地址

[esbuild](https://esbuild.github.io/)

## GitHub 地址

[evanw/esbuild](https://github.com/evanw/esbuild)

## 幻灯片地址

<a href="/SlideStack/esbuild-slide/" target="_blank">esbuild</a>
