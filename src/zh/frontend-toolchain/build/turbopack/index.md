---
layout: doc
---

# Turbopack

Vercel 用 **Rust** 编写、**内置于 Next.js** 的增量打包器（incremental bundler），针对 JavaScript / TypeScript 优化，目标是替代 Next.js 中的 webpack。它底层用 **SWC** 编译 JS/TS/JSX、用 **Lightning CSS** 处理 CSS，靠 Turbo engine 的**函数级增量缓存**与**懒打包**做到极快的开发与构建。经过 v13 alpha → v15 dev stable → 多个里程碑，**Next.js 16（2025-10）起 Turbopack 成为默认打包器**，对 dev 与 production builds 均达到 stable、无需任何配置，官方数据生产构建快 2–5×、Fast Refresh 最多约 10×。需要注意：Turbopack 不是独立的 npm 包，**随 Next.js 分发**，源码在 `vercel/next.js` 仓库；它与同样来自 Vercel、名字相近的 **Turborepo**（monorepo 任务编排器）是**完全不同**的两个东西。

::: tip Turbopack ≠ Turborepo
- **Turbopack** = 打包器（bundler），替代 webpack，处理模块打包 / Fast Refresh / 依赖图。
- **Turborepo** = monorepo 任务编排 / 缓存系统，处理 `turbo.json`、task pipeline、远程缓存、`--filter`。

两者都来自 Vercel、命名相近，但职责完全不同。Turbopack **没有** `turbo.json`。
:::

## 评价

**优点**

- **极快**：Rust 编写 + 函数级增量计算（结果缓存到函数级别，做过的工作不重复）+ 懒打包（只编译 dev server 实际请求的内容）；Next 16 生产构建快 2–5×、Fast Refresh 最多约 10×
- **Next 16 起默认、零配置**：`next dev` / `next build` / `next start` 无需任何 flag，dev 与 build 均 stable
- **统一图（Unified Graph）**：用单一图管理 client / server 多个输出环境，避免多 compiler 拼接的繁琐
- **零配置支持广**：TS、JSX/TSX、CSS / CSS Modules / CSS Nesting / PostCSS / Sass、RSC、Fast Refresh、静态资源、JSON、`tsconfig` paths 全部开箱即用
- **文件系统缓存**：`next dev` 的持久化缓存自 16.1 起 stable
- **兼容大量 webpack loader**：babel-loader、@svgr/webpack、yaml-loader、raw-loader 等可直接用

**缺点**

- **强绑 Next.js**：不是通用独立构建工具，无独立 npm 包，离开 Next 无法单独使用
- **不支持 webpack plugins**（只支持 loaders）——这是从 webpack 迁移的**最大坑**，依赖插件体系的集成会失效
- **不做类型检查**：即使 build 通过，类型错误也不会被捕获，需自行跑 `tsc --watch` 或靠 IDE
- **部分 webpack-only 特性不支持/不计划**：`sassOptions.functions`、Yarn PnP、`urlImports`、`esmExternals` 永不支持
- **迁移暗坑**：Sass 的 `~` 波浪号静默失效、CSS Module 按 import 顺序排序可能致渲染微变、`root` 外的 link 依赖默认不解析
- **平台限制**：无 native binding 的平台（FreeBSD / OpenBSD）回退 WASM，**不支持 Turbopack**，必须 `--webpack`

## 文档地址

[Turbopack](https://nextjs.org/docs/app/api-reference/turbopack)

## GitHub 地址

[vercel/next.js](https://github.com/vercel/next.js)

## 幻灯片地址

<a href="/SlideStack/turbopack-slide/" target="_blank">Turbopack</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=turbopack" target="_blank" rel="noopener noreferrer">Turbopack 测试题</a>
