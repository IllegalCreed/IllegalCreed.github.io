---
layout: doc
---

# Rspack

基于 Rust 的高性能 Web 打包器（**a fast Rust-based bundler for the web**），由字节跳动开源（MIT）。官方定位：「以现代化的 webpack API 实现对 webpack 的无缝替换，同时提供极快的构建速度」。它的解法不是 Vite 式「开发期免打包」，而是把打包本身做快：**Rust 实现 + 高度并行 + 针对 HMR 的增量编译 + 内置关键能力**（SWC 转译、Lightning CSS、压缩器、CSS 抽离等全在 Rust 侧）。配置结构与 **webpack 5 对齐**——entry/output/module.rules/resolve/plugins/optimization 可直接迁移，社区 loader 几乎全兼容，Top 50 高下载 webpack 插件 85% 以上可用或有替代。**2026-06 现状**：**Rspack 2.0**（2026-04 发布）为当前主版本——核心包纯 ESM、要求 Node 20.19+/22.12+，experiments 大批转正（cache/incremental/lazyCompilation 顶层化），npm 周下载约 500 万。上层还有同生态的 Rsbuild（一体化构建，对位 Vite），本篇聚焦 Rspack 底层本身。

## 评价

**优点**

- **快**：官方基准从 1.0 的 5.6s 优化到 2.0 的 3.1s（无缓存）/1.4s（持久缓存），HMR 约 118ms；增量编译 1.4 起默认开启
- **webpack 迁移成本极低**：配置结构、loader 协议、插件 hooks 对齐 webpack 5，多数项目改包名 + 少量替换即可切换
- **内置 SWC**：`builtin:swc-loader` 在 Rust 侧完成 TS/JSX 转译与降级，告别 babel-loader 这类 JS 瓶颈
- **原生 CSS 支持**：`type: 'css/auto'` 直接处理 CSS/CSS Modules，常规场景不再需要 css-loader
- **生产级特性齐全**：splitChunks、tree-shaking（usedExports/sideEffects/innerGraph）、Module Federation（内置 v1.5，可升 v2.0）
- **Rstack 生态分层清晰**：Rsbuild（一体化）/Rslib（库）/Rspress（文档）/Rsdoctor（分析）/Rstest（测试）各管一段
- **生产验证充分**：字节内部大规模使用，Nuxt/Storybook/Docusaurus/TanStack Router 等 30+ 项目接入

**缺点**

- **少数 webpack 插件不兼容**：深度依赖 webpack 内部实现的插件（官方清单列有 8 个不兼容项）需找替代或等适配
- **JS loader 仍是性能短板**：兼容性靠 JS 侧运行换来，重型 JS loader（postcss-loader 等）会拖慢整条 Rust 流水线
- **2.0 升级有迁移成本**：纯 ESM + Node 20.19+/22.12+ 门槛、experiments 大搬家、devtool 等默认值变更、`.swcrc` 不再读取
- **裸用配置量大**：对位 webpack 的底层定位意味着 rules/插件都要自己写，开箱体验不如上层 Rsbuild
- **调试 Rust 侧不如 JS 透明**：内部行为要靠 RSPACK_PROFILE/Rsdoctor 等工具观测，不能直接断点

## 文档地址

[Rspack](https://rspack.rs/)

## GitHub 地址

[web-infra-dev/rspack](https://github.com/web-infra-dev/rspack)

## 幻灯片地址

<a href="/SlideStack/rspack-slide/" target="_blank">Rspack</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=rspack" target="_blank" rel="noopener noreferrer">Rspack 测试题</a>
