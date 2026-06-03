---
layout: doc
---

# Rsbuild

字节跳动 **Rstack** 工具链出品、官方定义为 **「a modern build tool for web applications, powered by Rspack」**（基于 Rspack 的现代 Web 应用构建工具）。Rsbuild 的角色是 **Rspack 之上的「集成层 / build tool」**：底层真正干打包活的是 Rust 写的 **Rspack**（webpack 兼容内核），Rsbuild 在其上提供**开箱即用的零配置 + 语义化构建配置 API**（`source` / `output` / `server` / `tools` 等分层配置）和优秀的开发体验——这层关系恰如 **Vite ︰ Rolldown**（Vite 是集成层、底层是 bundler）。它定位为 **Create React App / Vue CLI / Vite 的替代方案**，把 bundler 从 webpack 换成 Rspack，带来 5–10× 的构建性能提升。底层全是 Rust 工具：**Rspack** 打包、**SWC** 转译/压缩（替代 Babel/Terser）、**Lightning CSS** 降级加前缀（替代 autoprefixer）。当前 **Rsbuild 2.0（latest 2.0.10，底层 Rspack 2.0.6）**。它属于 Rstack 七件套之一——Rspack（打包器）/ **Rsbuild（构建工具）** / Rslib（库）/ Rspress（站点）/ Rsdoctor（分析）/ Rstest（测试）/ Rslint（检查）。

::: tip Rsbuild ≠ Rspack（也 ≠ Rstack）
- **Rspack** = 底层 Rust **bundler**（打包器），暴露 webpack 风格的 `module.rules` / `plugins` / `resolve`。
- **Rsbuild** = 其上的**集成层 / build tool**，提供语义化分层配置与开发体验；真正打包靠 Rspack。
- **Rstack** = 整个工具链/生态的**总称**，Rsbuild 只是其中一员。

「Rsbuild 的底层 bundler 是谁？」答 **Rspack**。
:::

## 评价

**优点**

- **开箱即用 + 语义化配置**：零配置可启动，又提供 `source`/`output`/`server`/`tools` 等高层语义化配置，比手写 webpack 配置友好
- **极快**：底层 Rspack（Rust），官方基准 dev 构建比 webpack 快 5–10×
- **生产一致性**：dev 与 prod **都用 Rspack 打包**，避免 Vite 开发态原生 ESM（unbundled）可能带来的 dev/prod 不一致
- **兼容 webpack/Rspack 插件生态**：`tools.rspack` 逃生舱可直接用 Rspack/webpack 原生插件与配置
- **Module Federation 一等支持**：微前端开箱友好
- **框架无关**：插件支持 React / Vue / Svelte / Solid / Preact
- **迁移友好**：从 webpack / CRA 迁移最省力（配置/插件/loader 模型刻意对齐）
- **Rstack 生态完整**：配合 Rslib（库）、Rspress（文档）、Rsdoctor（分析）、Rstest（测试）

**缺点**

- **强绑 Rspack**：`tools.rspack` 透传的底层配置可能随迭代变化且不走 semver，深度自定义有失效风险
- **默认不做类型检查**：SWC 只剥类型，需 `@rsbuild/plugin-type-check` 或 `tsc`
- **框架支持全走插件**：核心包不内置框架能力，React/Vue 等都要手动装对应插件
- **并非每项都最快**：官方基准里 Vite 在生产 build 和 HMR 上数字反而略优，别误以为「全面碾压 Vite」
- **2.0 破坏性变化多**：`@rsbuild/core` 纯 ESM、Node 门槛升到 20.19+、`server.host` 默认改 `localhost`、`performance.chunkSplit` 废弃
- **分层概念多**：`dev` 段 vs `server` 段、顶层 `plugins` vs `tools.rspack.plugins`、Rsbuild vs Rspack，新手易混
- **生态/社区规模**：不及 webpack / Vite 成熟，部分能力依赖社区插件

## 文档地址

[Rsbuild](https://rsbuild.rs/)

## GitHub 地址

[web-infra-dev/rsbuild](https://github.com/web-infra-dev/rsbuild)

## 幻灯片地址

<a href="/SlideStack/rsbuild-slide/" target="_blank">Rsbuild</a>
