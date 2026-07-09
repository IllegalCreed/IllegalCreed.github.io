---
layout: doc
---

# Remix

**全栈 React Web 框架（Full-stack React web framework）**——构建在 React Router 之上，强调**拥抱 Web 标准/Web Fundamentals、嵌套路由、服务端渲染与渐进增强（progressive enhancement，表单无 JS 也能用）**；由 **Ryan Florence 与 Michael Jackson**（React Router 团队）创建，**2022 年 10 月被 Shopify 收购并维护**。**⚠️ 2026 年最重要、也最易混的事实——Remix 与 React Router 已收敛**：

- **`Remix v2` 是 Remix 框架的最后一个独立主版本**；
- **原计划的「Remix v3」改为以 `React Router v7` 名义发布**（RR7 稳定版 **2024-11-22**），把 Remix 的编译器 + 服务端运行时合并进 React Router 的「**Framework Mode**」——**官方明确建议所有 Remix v2 用户升级到 React Router v7**（用 codemod `npx codemod remix/2/react-router/upgrade`，本质是把 `@remix-run/*` 导入换成 `react-router`）；
- **而「Remix 3」是另一回事**——2025-05-28「Wake up, Remix!」公布的**全新、去 React（基于 Preact）的重构方向**（2026-04-30 Beta），用 Web 原语而非 Hooks，**不是 v2 的升级路径**。

**核心数据模型（v2，RR7 Framework Mode 同名同义、只是从 `react-router` 导入）**：每个路由模块可导出 **`loader`**（服务端 GET 数据加载，`useLoaderData` 读）+ **`action`**（服务端非 GET 变更，在 loaders 前运行，`useActionData` 读）+ `default`（组件）+ `ErrorBoundary` + `meta` + `links` + `headers` + `clientLoader`/`clientAction` 等；**`<Form>`** 渐进增强提交（无 JS 也工作）；**`useFetcher`** 不导航地调 loader/action；**`useNavigation`** 拿导航/提交状态做 pending UI；**嵌套路由的 loader 并行加载**（非瀑布）、action 后**自动重新校验（revalidate）**。**流式渲染**：v2 用 `defer()` + `<Await>` + `<Suspense>`（RR7 改为直接从 loader 返回原始 Promise）。**ErrorBoundary** 路由级错误边界（`useRouteError` / `isRouteErrorResponse`，v2 已并入 CatchBoundary）。**`.server.ts` / `.client.ts`** 标记模块运行环境。**构建**：v2 起用 **Vite 插件**（`@remix-run/dev` 的 `vitePlugin as remix`，Classic Compiler 已弃用）。**部署**：Remix **不是 HTTP 服务器，而是嵌在现有服务器里的 handler**——多运行时（Node / Cloudflare / Deno）+ adapters；`createCookie` / `createCookieSessionStorage` 管 cookie 与 session。**与 Next.js 的区别**：Remix 更贴 Web 标准、用 `loader`/`action` 数据模型，Next App Router 主推 RSC。**典型用户群**：**追求 Web 标准、渐进增强、SSR + 嵌套路由数据流的全栈 React 应用**——但**新项目官方建议直接用 React Router v7**（即 Remix 框架能力的延续）。

## 评价

**优点**

- **Web 标准优先 + 渐进增强**：`<Form>` / `loader` / `action` 基于原生表单与 HTTP，**无 JS 也能用**，JS 加载后增强为 SPA 体验
- **`loader`/`action` 数据模型清晰**：数据加载（loader）与变更（action）与路由共置，**嵌套路由 loader 并行加载**消除瀑布、action 后自动重新校验
- **嵌套路由强大**：父子路由 UI（`<Outlet>`）+ 数据 + 错误边界各自就近，天然支持复杂布局
- **路由级错误边界**：`ErrorBoundary` + `useRouteError` 让错误就近兜底，不整页崩
- **`useFetcher` 无导航交互**：点赞、自动保存、加购等不改 URL 的服务端交互一把梭
- **内建流式渲染**：`defer` + `<Await>` 关键数据先到、次要数据流式补齐
- **多运行时部署**：作为 handler 嵌入 Node / Cloudflare Workers / Deno 等，灵活
- **平滑并入 React Router v7**：v2 的能力成为 RR7 Framework Mode，**心智与 API 延续**、迁移基本是导入改名

**缺点**

- **版本格局复杂、极易混淆**（最大的坑）：`Remix v2`（最后独立版）/「**原计划 Remix v3 = React Router v7**」/「**Remix 3 = 全新去 React 的 Preact 重构**」——**三者必须分清**，把「Remix v3」当成 RR7 的薄包装或把 Remix 3 当 v2 升级都是错的
- **新项目应直接用 React Router v7**：standalone Remix 停在 v2，**继续学纯 Remix v2 的边际价值在下降**（虽然心智可迁移到 RR7）
- **RR7 的破坏性差异**：`json()` / `defer()` 在 RR7 Single Fetch 下**已弃用**（改用普通对象、`data()`、原始 Promise）——跨 v2/RR7 写法不同
- **服务端心智**：`loader`/`action`/`headers` 服务端专用、`.server`/`.client` 分离——需要理解服务端/客户端边界
- **不是 HTTP 服务器**：需配 adapter 嵌入运行时，部署模型与「一体化框架」略不同
- **生态/规模 vs Next.js**：Next.js 生态、招聘、Vercel 一体化更大；Remix（RR7）胜在 Web 标准与数据模型
- **一个提交只跑一个 action**：复杂多动作表单需用 `useFetcher` 或拆路由

## 文档地址

[Remix 官网](https://remix.run/) | [文档（v2）](https://v2.remix.run/docs) | [合并 Remix 与 React Router](https://remix.run/blog/merging-remix-and-react-router) | [从 Remix 升级到 RR7](https://reactrouter.com/upgrading/remix) | [React Router v7](https://reactrouter.com/)

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=remix" target="_blank" rel="noopener noreferrer">Remix 测试题</a>


## GitHub 地址

[remix-run/remix](https://github.com/remix-run/remix)（主仓库，MIT；v2 为最后独立线）| [remix-run/react-router](https://github.com/remix-run/react-router)（React Router v7，Remix 框架能力的延续）

## 学习路径

- [入门](./getting-started.md)：Remix 是什么（全栈 React、Web 标准、渐进增强） / **Remix 与 React Router v7 的收敛关系（最高频考点）** / 路由模块导出（`loader`/`action`/`default`/`ErrorBoundary`） / 第一个 `loader` + `useLoaderData` / 第一个 `action` + `<Form>` / Vite 插件 / 对比 Next.js
- [指南](./guide-line.md)：**路由与数据加载**（嵌套路由 `<Outlet>` / loader 并行加载 / `LoaderFunctionArgs` / `useLoaderData`·`useRouteLoaderData` / `json`·`data`·`redirect`） / **变更与表单**（`action` / `<Form>` 渐进增强 / `useActionData` / `useFetcher` / `useNavigation` pending UI / `useSubmit` / 乐观 UI） / **渲染与数据流**（SSR / `defer`+`<Await>`+`<Suspense>` 流式 / `ErrorBoundary`+`useRouteError`+`isRouteErrorResponse` / `meta`·`links`·`headers` / `.server`·`.client`） / **生态与部署**（Vite 插件 / 运行时与 adapter / cookies·sessions / **Remix↔RR7↔Remix 3 三者关系**） / **常见坑**（版本混淆、RR7 弃用 json/defer、action 服务端专用、一提交一 action）
