---
layout: doc
---

# Analog

由 Brandon Roberts（Angular 团队前成员、NgRx 维护者之一）主导的「**Angular 元框架**」——基于 [Vite](https://vitejs.dev/) + [Vitest](https://vitest.dev/) + [Nitro](https://nitro.unjs.io/) 构建，对标 React 的 Next.js、Vue 的 Nuxt、Svelte 的 SvelteKit、Solid 的 SolidStart——填补了 Angular 长期缺乏「**官方风格元框架**」的空白。核心包是 `@analogjs/platform`（Vite 插件 + Nitro 集成）/ `@analogjs/router`（文件路由 + `provideFileRouter` + Server Load）/ `@analogjs/content`（Markdown 内容路由 + Shiki / Prism 语法高亮 + `MarkdownComponent` + `injectContent`）/ `@analogjs/vite-plugin-angular`（编译 Angular 组件 + 装饰器 + standalone API）。

定位上类似 **Nuxt for Angular**——文件路由（`src/app/pages/*.page.ts`）+ Server Routes（`src/server/routes/api/*.ts`，基于 [h3](https://h3.unjs.io/)）+ Server-Side Data Fetching（`*.server.ts` 中的 `load` 函数 + 组件内 `injectLoad`）+ Form Server Actions（`FormAction` 指令 + `action()` 函数 + `redirect()` / `json()` / `fail()` 返回辅助）+ Markdown Content Routes（`*.md` 文件直接作为路由 / `injectContent` 读取 frontmatter）+ Hybrid SSR/SSG（默认开启 SSR / `prerender.routes` 配置静态化 / `routeRules` 精细切换 / `staticData` 预渲染服务端数据）。**与传统 Angular CLI 项目最关键的差异**：用 Vite 替代 esbuild + Webpack（构建快 10 倍以上）/ 用 Vitest 替代 Karma + Jasmine（HMR + 现代 ESM 测试体验）/ 用 Nitro 替代 Angular Universal（可部署到 17+ 个 preset：Node / Vercel / Netlify / Cloudflare Pages / Firebase / Bun / Deno / AWS Lambda / 静态站点 / ...）/ 文件路由 + Server Functions（Angular CLI 项目里没有内置概念）/ 默认 `@Component({ standalone: true })`（Angular 19+ 后这点对齐了）。

**与 Angular 标准项目共存**：Analog 不是 Angular 的替代——它是 Angular 之上的「**生产力层**」。Standalone Components、Signals、Component Input Bindings、Zoneless（Angular 18+）、`@if` / `@for` / `@switch` 控制流（Angular 17+）等 Angular 核心特性在 Analog 中都原生可用——你写的依然是 Angular 组件、Angular Router、Angular HttpClient、Angular DI。Analog 提供的是「**文件路由 + 服务端数据 + 全栈部署**」的**元框架体验**，而**不是**新的组件模型。

> **版本说明**：本笔记主要基于 **Analog v1.x**（与 Angular v17 / v18 / v19 配合，依然兼容到 Angular v15）+ Vite v5/v6 + Nitro v2。Analog 的版本号紧贴 Angular（如 1.10.x 对应 Angular 18.x），但 API 层面在 1.x 内基本稳定。Brandon Roberts 与 Angular 团队保持紧密协作，Analog 也是 Angular 生态中目前发展最活跃的元框架项目。

## 评价

**优点**

- **官方风格 + Angular 团队亲缘**：Brandon Roberts 主导，与 Angular 团队（Mark Thompson、Minko Gechev 等）频繁协作，重大特性同步——`@defer`、Signals、Component Input Bindings 等 Angular 新特性在 Analog 中第一时间得到适配
- **Vite + Vitest + Nitro 生态加持**：Angular 历史上构建慢、测试设置繁琐——Analog 直接替换为 Vite（dev 启动 < 1s）+ Vitest（HMR 测试）+ Nitro（17+ 部署 preset）—— DX 一步到位
- **文件路由灵活而强大**：5 种主路由类型（Index / Static / Dynamic / Layout / Catch-all）+ 路由组 `(group)` + 嵌套布局 + 通过 `withDebugRoutes()` 可视化整个路由树（访问 `__analog/routes`）
- **Server Load + `injectLoad` 优雅**：`.server.ts` 中导出 `load` 函数 + 组件中 `injectLoad<typeof load>()`——类型安全、可享 SSR transferState 缓存、可独立预渲染 (`staticData: true`)
- **Form Server Actions 仿 Remix/SvelteKit**：`FormAction` 指令绑定 `<form method="post">`、`.server.ts` 导出 `action()`、内置 `redirect()` / `json()` / `fail()` 辅助——**JS 禁用下也能用**（progressive enhancement）
- **Markdown Content 一体化**：`*.md` 作为路由 / Frontmatter / Shiki / Prism / Mermaid / 子目录递归 / `injectContent` 读单文件 / `injectContentFiles` 列目录——比 Astro 的内容功能更轻量，比 VitePress 更灵活（嵌入 Angular 组件）
- **SSR/SSG 混合切换简单**：默认 SSR、`prerender.routes` 配置预渲染、`routeRules: { '/admin/**': { ssr: false } }` 精细控制——同一份代码可全部 SSR / 全部 SSG / 局部 CSR
- **Astro Angular 集成**：`@analogjs/astro-angular` 让 Angular 组件可以在 Astro 中作为 Island 使用——这是其他 Angular 元框架做不到的
- **Nx / Angular CLI 双支持**：`create-analog` 既可生成纯 Analog 项目，也可与 Nx workspaces 集成；现有 Angular CLI 项目可通过 `@analogjs/platform:migrate` schematic 一键迁移
- **TypeScript 与 Signals 一流**：`PageServerLoad` / `PageServerAction` / `LoadResult<typeof load>` / `RouteMeta` / `injectResponse` / `injectRequest` 等类型完整；与 Angular Signals + `toSignal()` 无缝配合
- **TransferState 自动**：所有通过 `HttpClient + requestContextInterceptor` 发起的请求在 SSR 阶段都通过 TransferState 缓存，client 端 hydration 不会重复请求

**缺点**

- **生态规模仍小**：相比 Next.js / Nuxt / SvelteKit / SolidStart，Analog 的社区 starter / 教程 / 招聘市场都小 1-2 个数量级；Angular 自身的社区相比 React/Vue 也较小，元框架层更稀缺
- **Angular CLI 已有大量内置功能**：Angular 19+ 后 Standalone API / Zoneless / Component Input Bindings / SSR 都已内置——Angular CLI 项目想要 Analog 的功能，需要额外引入 `@analogjs/router` + `@analogjs/content`，与 Nuxt-for-Vue 的「完全替代 CLI」定位有差异
- **Nitro 配置层增加调试难度**：Vite + Nitro 双层配置，问题排查需要理解 Vite plugin、`analog()` 插件、Nitro preset 三者关系——初学者容易在 `vite.config.ts` 的 `analog({...})` 嵌套配置中迷失
- **路由 + 文件命名约定较多**：`(home).page.ts` / `[id].page.ts` / `[...slug].page.ts` / `*.server.ts` / `*.md` / `*.layout.ts`（实际是「parent 同名 + 子文件夹」）—— 新手必须先打开 `__analog/routes` 才能搞清楚最终路由表
- **Zoneless 仍在过渡**：Angular 18+ 才完整支持 Zoneless，Analog 在 SSR 场景下仍需 `zone.js/node` import 才能 bootstrap——这是 Angular SSR 长期遗留问题，Analog 还无法完全摆脱
- **Server Load 与 Angular Resolver 模型重叠**：`PageServerLoad` 实际是 Angular Route Resolver 的封装，但语义与 `RouteMeta.resolve` 部分重叠—— `getLoadResolver()` 是两者之间的桥接，但学习曲线高
- **第三方 Angular 库的 SSR 兼容性**：很多 Angular 库（如 Apollo、Spartan、Material 部分组件）不原生兼容 SSR，需手动加到 `ssr.noExternal` 中——这是 Vite SSR 通用问题
- **缺少官方 RPC 方案**：Next.js 有 Server Actions、Solid Start 有 `"use server"` 指令、Qwik 有 `server$`——Analog 目前只有 API Routes + Server Load 两种模式，client 直接「调用 server 函数」需要自己包装
- **vs Nuxt / SvelteKit / SolidStart**：四者都是「Vite + Nitro + 文件路由」组合，差异在底层框架（Vue / Svelte / Solid / Angular）。Analog 的独特优势在 **Angular 团队亲缘** 与 **NgRx / RxJS / DI / TypeScript 强类型** 的生态延续——但代价是 Angular 本身的复杂度
- **文档相对薄**：相比 Nuxt 多年沉淀的详尽文档，Analog 文档许多边缘场景需要看 GitHub examples / Discord 问；某些功能（如 Component Routes 子分类、嵌套 redirect）的 best practice 仍在演进

## 文档地址

[Analog 官网](https://analogjs.org/) | [文档首页](https://analogjs.org/docs) | [路由](https://analogjs.org/docs/features/routing/overview) | [服务端数据](https://analogjs.org/docs/features/data-fetching/server-side-data-fetching) | [API Routes](https://analogjs.org/docs/features/api/overview) | [SSR](https://analogjs.org/docs/features/server/server-side-rendering) | [SSG](https://analogjs.org/docs/features/server/static-site-generation) | [部署](https://analogjs.org/docs/features/deployment/overview) | [迁移指南](https://analogjs.org/docs/guides/migrating)

## GitHub 地址

[analogjs/analog](https://github.com/analogjs/analog)（含 examples / packages / docs 子目录） | [Brandon Roberts](https://github.com/brandonroberts)（创始人 + 主要维护者）

## 学习路径

- [入门](./getting-started.md)：`npm create analog@latest` 脚手架 / 项目结构 / `app.config.ts` / `app.component.ts` / 第一个组件 / 第一个路由 (`(home).page.ts`) / 文件路由约定（Index / Static / Dynamic / Layout / Catch-all）/ 第一个 `*.server.ts` + `load` / 第一个 `injectLoad` / 第一个 API route (`src/server/routes/api/*.ts`) / Vite + `analog()` 插件配置 / 与 Angular CLI 项目对比
- [指南](./guide-line.md)：**核心**：文件路由全集（5 种主类型 + 路由组 + Pathless Layouts + Catch-all 404 + `withExtraRoutes` + `withDebugRoutes` 可视化）/ Layouts 嵌套与 `<router-outlet>` / Server Routes + h3 + Nitro Routing / Dynamic API Routes / HTTP 方法后缀（`.get.ts` / `.post.ts`）/ WebSocket + SSE / Server-Side Data Fetching（`PageServerLoad` / `injectLoad` / `getLoadResolver`）/ Form Server Actions（`FormAction` 指令 / `PageServerAction` / `redirect` / `json` / `fail`）/ Route Metadata（`RouteMeta` / 重定向 / OG 标签）/ Middleware / 401 守卫 / Markdown Content Routes（Frontmatter / Shiki vs Prism / Mermaid / 子目录）/ SSR（hybrid / `routeRules` / `ssr: false`）/ SSG（Prerender / `contentDir` + `transform` / `staticData` / sitemap）/ Astro Islands-like Angular 组件激活 / Nitro Adapter（Node / Vercel / Cloudflare / Netlify / Firebase / Static / 17+ presets）/ 与 Angular 标准项目共存策略 / 常见踩坑（zoneless / Standalone API only / Nitro 调试 / Vite SSR noExternal）
- [参考](./reference.md)：**API 速查**：文件约定（`app.pages/*.page.ts` / `app.pages/*.server.ts` / `app.pages/*.md` / `app.pages/*.layout.ts` / `server/routes/api/*.ts` / `server/middleware/*.ts`）/ Routing helpers（`provideFileRouter` / `withExtraRoutes` / `withDebugRoutes` / `withComponentInputBinding` / `withNavigationErrorHandler`）/ `injectLoad` / `RouteMeta` / `getLoadResolver` / `injectResponse` / `injectRequest` / `injectBaseURL` / `provideServerContext` / `requestContextInterceptor` / Form Action helpers（`redirect` / `json` / `fail`）/ Content helpers（`injectContent` / `injectContentFiles` / `MarkdownComponent` / `withPrismHighlighter` / `withShikiHighlighter`）/ API handler helpers（h3 的 `defineEventHandler` / `getRouterParam` / `getQuery` / `readBody` / `setCookie` / `parseCookies` / `createError`）/ `vite.config.ts`（`analog()` 选项 + `prerender` + `nitro` + `ssr` + `content` + `fileReplacements` + `liveReload`）/ Nitro Preset 列表 / 常用集成（`@analogjs/content` / `@analogjs/trpc` / `@analogjs/astro-angular` / `@analogjs/platform:vite` for libraries）
