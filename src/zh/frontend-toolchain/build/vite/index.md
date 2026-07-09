---
layout: doc
---

# Vite

Evan You 创建、现由社区团队维护的现代前端**构建工具**（读音 `/vit/`，法语「快」）。Vite 不是单纯的打包器，而是一套「**开发服务器 + 构建命令**」的完整工具：开发态用浏览器原生 ESM **按需**提供源码、配合极快的 HMR，启动几乎瞬时且与项目大小无关；生产态再用打包器产出优化后的静态资源。**Vite 8（2026-03 稳定）** 是一次架构跃迁——用单一 Rust 打包器 **Rolldown** 统一了过去的 esbuild（dev 转译）+ Rollup（prod 打包）双工具组合，并以 **Oxc** 接管 TS/JSX 转译与 JS 压缩、**Lightning CSS** 做 CSS 压缩，最快把生产构建提速 10–30 倍，同时抹平 dev 与 prod 的行为差异。如今几乎所有现代框架（Vue / React / Svelte / Solid / Qwik / Lit）的官方脚手架都基于 Vite，主流元框架（Nuxt / SvelteKit / Astro / Remix / Vike）也把 Vite 作为底层，它已是前端构建工具的事实标准。

## 评价

**优点**

- **开发启动几乎瞬时**：依赖用原生工具预打包一次、源码经原生 ESM 按需供给，浏览器只加载当前页面所需，启动时间与应用规模解耦
- **HMR 快且精确**：基于原生 ESM 的热更新只替换变动模块，不整页刷新、不全量 rebuild，大型项目热更新仍在毫秒级
- **Vite 8 用 Rolldown 统一 dev/prod**：一套 Rust 工具链贯穿开发与构建，消除「dev 用 esbuild、prod 用 Rollup」带来的行为不一致，构建最快提速 10–30×
- **开箱即用**：TypeScript / JSX / CSS（含 CSS Modules、Sass/Less/Stylus 预处理器）、静态资源、`import.meta.glob`、Web Worker、WebAssembly 全部内置，多数场景无需找插件
- **生态最大**：几乎所有现代 UI 框架官方脚手架与主流元框架都构建在 Vite 之上，插件接口兼容 Rollup，社区插件丰富
- **库模式一流**：`build.lib` 一条配置即可产出 ES / UMD / CJS 多格式 + 类型友好的 npm 库
- **面向多运行时**：Environment API（Vite 6 引入）把 client / ssr / edge 等环境形式化，为框架作者提供统一的多环境构建能力
- **配置简洁**：`defineConfig` + 合理默认，简单项目零配置可用，复杂项目通过插件与 `rolldownOptions` 精细控制

**缺点**

- **只转译不类型检查**：Vite 出于速度只对 `.ts` 做语法转译，类型错误不会让 dev/build 失败，必须额外跑 `tsc --noEmit` 或 `vite-plugin-checker`
- **dev 与 prod 历史上存在行为差异**：开发态原生 ESM、生产态打包，少数依赖在两端表现不一致（Vite 8 的 Rolldown 统一显著缓解了这一点，但 SSR/库构建仍需留意）
- **版本演进快、破坏性变化多**：Vite 6 的 Environment API、Vite 8 的 Rolldown 切换都带来迁移成本（`rollupOptions → rolldownOptions`、`manualChunks → advancedChunks`、顶层 `esbuild → oxc` 等）
- **桶文件（barrel file）拖慢 dev**：从 `index.js` 统一导出再按需引用，会让 dev 加载整个目录，是大型项目开发态变慢的隐形元凶
- **依赖 Rollup/Rolldown 插件生态**：少数 Rollup 选项（如 `generatedCode`）Rolldown 不支持；个别插件在原生（`enableNativePlugin`）模式下需 `withFilter` 适配
- **SSR / Environment API 门槛较高**：中间件模式、两次构建、`ssrManifest`、ModuleRunner / HotChannel 等高级用法对新手不友好
- **环境变量与 mode 易混淆**：`NODE_ENV` 与 `mode` 是两个独立概念、`.env` 加载优先级、`VITE_` 前缀暴露规则都是常见踩坑点

## 文档地址

[Vite](https://vite.dev/)

## GitHub 地址

[vitejs/vite](https://github.com/vitejs/vite)

## 幻灯片地址

<a href="/SlideStack/vite-slide/" target="_blank">Vite</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=vite" target="_blank" rel="noopener noreferrer">Vite 测试题</a>
