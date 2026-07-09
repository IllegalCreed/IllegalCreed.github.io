---
layout: doc
---

# SolidStart

Ryan Carniato 团队为 [Solid](https://www.solidjs.com/) 打造的「**官方元框架**」——基于 [Vinxi](https://vinxi.vercel.app/)（Vite + Nitro 的组合器）构建，提供文件路由 / SSR / SSG / 服务器函数 / 多目标部署。与 Solid 共享同一组核心包：[`@solidjs/router`](https://github.com/solidjs/solid-router)（路由）/ [`@solidjs/meta`](https://github.com/solidjs/solid-meta)（meta 标签）/ [`@solidjs/start`](https://github.com/solidjs/solid-start)（运行时） —— 但 **SolidStart 本身刻意保持「非 opinionated」**：路由 / meta 库可换（默认 `@solidjs/router` + `@solidjs/meta`，也支持 TanStack Router 等替代），由用户在创建项目时选模板决定。

定位上类似 **Next.js for React / Nuxt for Vue / SvelteKit for Svelte**——文件路由 + Server Functions + 部署 adapter，但用 Solid 的「**细粒度响应式 + 组件只运行一次**」语义代替 React 的 reconcile / RSC。核心 API 是「**`"use server"` 指令 + `query()` + `action()` + `createAsync()`**」三件套 ——`query()` 包装的服务器函数自动支持 preload / cache / revalidate / single-flight mutation；`action()` 接受 FormData 提交，渐进增强（无 JS 也可工作）；`createAsync()` 在组件中以 Suspense 友好的方式订阅 query 结果。**渲染模式**支持 CSR（纯客户端）/ SSR（同步 / 异步 / 流式）/ SSG（预渲染），通过 `defineConfig({ ssr: false / true, server: { prerender: {...} } })` 切换。底层依赖 Nitro 实现「**一套代码部署到 Vercel / Netlify / Cloudflare / AWS Lambda / Node / Bun / Deno / Static**」——切换平台只改一行 `preset`。

> **版本说明**：当前稳定版是 **v1.x**（基于 Vinxi），本笔记主要基于 v1。**v2 正在 alpha 阶段**（`@solidjs/start@2.0.0-alpha.x`），底层从 Vinxi 切换到原生 Vite + `@solidjs/vite-plugin-nitro-2`，配置文件从 `app.config.ts` 改为 `vite.config.ts`，API 层面基本兼容。文末「迁移」一节会简要说明 v1 → v2 的差异。

## 评价

**优点**

- **官方维护 + 与 Solid 同节奏**：Ryan Carniato 团队直接出品，Solid 核心 API 升级时 SolidStart 同步跟进；不像第三方元框架可能滞后
- **「非 opinionated」哲学**：路由 / meta / CSS 方案都可换——比 Next.js 灵活，比 Astro 更接近完整应用框架
- **`"use server"` 指令优雅**：与 React Server Components 神似但**更简单**——单个 async function 顶部加 `"use server"` 即变服务器函数，无需 Server / Client Components 区分
- **`query()` + `createAsync()` 数据流**：query 是「带 key 的可缓存服务器函数」，preload / revalidate / single-flight mutation 全自动；比 Next.js App Router 的 `fetch()` cache 更显式可控
- **`action()` 渐进增强**：基于原生 `<form>`，JS 禁用时依然能提交（与 Remix / Qwik 同思路）；优化 UI 用 `useSubmission` / `useSubmissions` 几行搞定
- **细粒度响应式继承自 Solid**：组件只跑一次，路由切换不重新渲染未变化的部分；列表 / 表格 / 实时数据场景性能远超 React
- **多目标部署**：Nitro 提供 17+ 预设（Vercel / Cloudflare Workers / Cloudflare Pages / Netlify / Netlify Edge / AWS Lambda / Bun / Deno / Node / Static / ...），切换平台改一行 `preset`
- **Bundle 体积小**：Solid 的优势 + 没有 React 那种「runtime 重」的负担——HelloWorld 通常 ~20KB（gzip）
- **streaming SSR 默认**：`createHandler` 默认 stream 模式，与 React Suspense / Solid Resource 配合实现「先发首屏 → 异步数据后到」
- **TypeScript 一流**：所有 API 都有完整泛型推导；`RouteSectionProps` / `RouteDefinition` / `APIEvent` 等类型开箱即用

**缺点**

- **生态规模仍小**：相比 Next.js / Nuxt / SvelteKit，社区 starter、UI 库、教程、招聘市场都小 1-2 个数量级
- **「Solid 心智模型 + SolidStart 边界」双重学习曲线**：从 React Next.js 来的人要先适应 Solid 的细粒度响应式，再适应 `"use server"` 与 RSC 的细微差异
- **`"use server"` 与 React Server Components 的差异**：SolidStart 的 `"use server"` 是「函数会在服务器执行」，可以从 client 调用；不是 React 的「这是 Server Component」概念——名字相似但语义不同（详见指南）
- **Vinxi 配置层增加调试难度**：v1 的 `app.config.ts` 实际是 Vinxi 配置，问题排查时需要理解 Vinxi → Vite → Nitro 三层
- **v2 alpha 切换 Vite + Nitro 直连**：v1 → v2 迁移已开始，长期看更稳定，但短期 alpha 阶段 issue 较多
- **`query()` 的 key 必须唯一字符串**：第二参数是 cache key，全局唯一；项目大了容易冲突，需要团队约定命名空间
- **prerender 文档相对薄**：相比 Astro / SvelteKit 在 SSG 上的成熟度，SolidStart 的 prerender 配置较少 example
- **没有官方 i18n 方案**：与 Next.js 自带 i18n 路由 / Nuxt 有 `@nuxtjs/i18n` 不同，SolidStart 需要自己处理（社区有 `@solid-primitives/i18n`）
- **第三方组件库稀缺**：可用的有 [Kobalte](https://kobalte.dev/) / [Park UI](https://park-ui.com/) / [Hope UI](https://hope-ui.com/)，但企业级后台组件库（类似 antd / Element Plus）几乎没有
- **vs Astro / Remix / Next.js**：Astro 偏静态 + Island；Remix（React Router v7）强调 nested loaders + form-first；Next.js 押注 RSC + edge；SolidStart 在「Solid 生态内做完整 SSR/SSG 元框架」这个生态位独占

## 文档地址

[SolidStart 官方文档](https://docs.solidjs.com/solid-start) | [Solid 主文档](https://docs.solidjs.com/) | [solid-router](https://docs.solidjs.com/solid-router) | [solid-meta](https://docs.solidjs.com/solid-meta)

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=solidstart" target="_blank" rel="noopener noreferrer">SolidStart 测试题</a>


## GitHub 地址

[solidjs/solid-start](https://github.com/solidjs/solid-start)（含 examples 与 templates 子目录）

## 学习路径

- [入门](./getting-started.md)：`npm init solid` 脚手架 / 模板选择（bare / basic / with-tailwindcss / with-auth / ...）/ 项目结构 / `app.tsx` / `entry-server.tsx` / `entry-client.tsx` / 第一个 `<FileRoutes />` 路由 / 第一个 `query()` + `createAsync()` / 第一个 `action()` + `<form>` / `"use server"` 指令初探
- [指南](./guide-line.md)：文件路由全集 / 嵌套 layout / 路由组 / 动态段 / Server Functions（`"use server"` 指令的两种写法 / 隔离规则 / 序列化限制）/ `query()` 数据加载（preload / revalidate / single-flight）/ `action()` 表单（useSubmission / useSubmissions / `action.with()`）/ 错误处理与 redirect / Middleware / Session / Cookie / API Routes / Head & Metadata / 渲染模式（CSR / SSR / Streaming / SSG）/ Adapter（Vercel / Cloudflare / Netlify / Node / Static）/ 常见踩坑（Server vs Client 边界 / Vinxi 配置层 / v1 ↔ v2 差异）
- [参考](./reference.md)：API 速查（`createAsync` / `query` / `action` / `useSubmission` / `useSubmissions` / `revalidate` / `redirect` / `reload` / `cache`）/ 内置组件（`<FileRoutes>` / `<HttpStatusCode>` / `<HttpHeader>` / `<Title>` / `<Meta>` / `<MetaProvider>`）/ 文件约定（`app.tsx` / `entry-server.tsx` / `entry-client.tsx` / `routes/*` / `middleware`）/ `app.config.ts` 全部选项 / Adapter Preset 列表 / Vinxi 选项 / 命名约定
