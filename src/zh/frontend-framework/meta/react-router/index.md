---
layout: doc
---

# React Router

[Remix](https://remix.run/) 团队（Michael Jackson + Ryan Florence + Brooks Lybrand 等，原 Reach UI 作者）打造的「**JavaScript 路由 + 元框架二合一**」。**React Router v7 = Remix v3 的合并发布**——2024 年 11 月，Shopify / Remix 团队正式宣布将 Remix 合并入 React Router，新版本 `react-router@7` 一口气吞下了 Remix 几乎所有元框架能力（loader / action / Form / SSR / SSG / Sessions / Cookies / 多目标部署 adapter），同时保留了原 React Router v6 的纯客户端路由用法。换言之：从 Remix v2 升级到 React Router v7 只是改包名 + 一行 codemod，新建项目则用 `npx create-react-router@latest`。

定位上，React Router v7 提供 **三种模式**（mode），三者**特性递增**——`Declarative ⊂ Data ⊂ Framework`：

- **Declarative 模式**：经典 `<BrowserRouter>` + `<Routes>` + `<Route>` 用法（v6 用户的零迁移路径），仅 URL ↔ Component 匹配，无 loader/action
- **Data 模式**：`createBrowserRouter()` + `<RouterProvider>`（v6.4+ data router 衍生），加入 loader / action / `useFetcher` / 等待状态等数据能力，但仍由用户自管 bundling 与服务器
- **Framework 模式**：在 Data 之上加 Vite plugin（`@react-router/dev`）—— 提供 file-based routing、类型自动生成（`Route.LoaderArgs` / `Route.ComponentProps`）、智能 code splitting、SSR / SSG / SPA 三种渲染策略、多目标部署 adapter；**这是 Remix 的直接替代品**，本笔记主讲此模式

本笔记主要覆盖 **Framework 模式**，简介 Data / Declarative 模式（用于路由库场景）。

## 评价

**优点**

- **Remix 的官方继任者**：所有 Remix v2 API 完整保留，迁移仅需 `npx codemod remix/2/react-router/upgrade` + 改包名（10 分钟级）
- **三模式渐进式架构**：可从 v6 `<BrowserRouter>` 平滑升级——纯客户端用 Declarative，需要 loader/action 上 Data，需要 SSR/SSG 上 Framework；同一套核心库覆盖路由 + 元框架两个生态位
- **类型安全一流**：`react-router typegen` 自动生成 `.react-router/types/+types/<route>.d.ts`，组件用 `Route.LoaderArgs` / `Route.ActionArgs` / `Route.ComponentProps`，loader 返回类型自动推导到组件 props，**params 也根据 URL 模式自动解析**（`/products/:id` → `params: { id: string }`）
- **`Form` + `action` 表单流**：原生 `<form method="post">` 即可触发 action（progressive enhancement），无 JS 也能用；动态部分用 `useFetcher` 无导航并发 mutation；与 SolidStart `action()` / Qwik `routeAction$` 同思路但更早成熟
- **nested routes + loader 并发**：父子路由 loader 并发执行（不是瀑布），首屏数据加载性能远超 Next.js Pages Router
- **SSR / SSG / SPA 切换简单**：`react-router.config.ts` 一行 `ssr: false` 切 SPA，加 `prerender: ["/", "/about"]` 切 SSG；同一套 routes/loaders 三种渲染策略复用
- **Resource Routes 内置 API**：路由模块不导出 default 组件时即变 API 路由（返回 `Response`），适合 RSS / sitemap / webhook / PDF
- **Sessions / Cookies / 验证**：`createCookieSessionStorage` 一行搞定 session；`createCookie` 处理签名 cookie；与 Express middleware 思路相近但 Web Standard Request/Response 全程透传
- **Streaming with Suspense**：loader 返回未 await 的 Promise + `<Await>` / React 19 `React.use()`，实现「关键数据先到 + 非关键数据后到」
- **多平台部署**：官方模板覆盖 Node Docker / Vercel / Cloudflare Workers / Netlify / AWS / Railway / Fly.io
- **生态最大**：React 路由市占率第一，社区组件库、教程、Stack Overflow 答案、Tailwind / shadcn 集成都最完善

**缺点**

- **三模式心智成本**：新人面对「Declarative / Data / Framework」三种模式 + 「从 v6 / 从 Remix 迁移」两条迁移路径，文档阅读成本明显大于 Next.js / SvelteKit
- **`routes.ts` 与文件路由共存**：默认是 `routes.ts` 手动配置，要文件路由需额外装 `@react-router/fs-routes` 调用 `flatRoutes()`，比 Next.js / Nuxt / SolidStart 默认文件路由稍绕
- **`.client` / `.server` 边界**：与 Remix 一样，client-only 模块需放 `.client/` 目录或后缀，服务器代码放 `.server/`，违反会编译报错；初学者常踩
- **Loader 序列化限制**：loader 返回值只能是「JSON + Promise + Map + Set + Date」等可序列化值——函数 / 类实例 / Symbol / FormData 不行；client navigation 时网络传输需 JSON 化
- **vs Next.js App Router**：Next.js 押注 RSC（Server Components）走「服务器组件 + 客户端组件」边界，React Router v7 仍是「全组件都在 client + loader/action 在 server」的 Remix 模型——简单但**没有 RSC 的极致 bundle 削减**；v7 的 RSC 支持仍 unstable
- **vs TanStack Router**：TanStack Router 强调 TypeScript 类型完美 + Search Params 类型化 + 100% client；React Router v7 提供更完整的全栈但对 search params 类型支持弱
- **没有内置中间件 / Auth 方案**：与 Next.js `middleware.ts` + Auth.js 集成不同，React Router v7 的 `middleware` 仍 unstable（v7.3+ 起加入），认证仍需自己写
- **状态序列化坑**：和 Next.js / Qwik 类似，server loader 数据序列化到 client 时 `Date` 会变 string、`undefined` 会丢、`bigint` 不支持——大型应用要注意
- **Remix → v7 迁移虽自动但需检查**：codemod 不处理所有 edge case，特别是自定义 server / adapter / Cloudflare Workers 项目

## 文档地址

[React Router 官方文档](https://reactrouter.com/) | [Framework 模式](https://reactrouter.com/start/framework/installation) | [API Reference](https://api.reactrouter.com/v7/) | [Tutorials](https://reactrouter.com/tutorials/quickstart) | [How-Tos](https://reactrouter.com/how-to/) | [GitHub](https://github.com/remix-run/react-router)

## GitHub 地址

[remix-run/react-router](https://github.com/remix-run/react-router)（同时是 [remix-run/remix](https://github.com/remix-run/remix) 的合并目的地，Remix 已停止独立发版）

## 学习路径

- [入门](./getting-started.md)：`npx create-react-router@latest` / 项目结构 / `react-router.config.ts` / `root.tsx` / 第一个路由（`app/routes/_index.tsx` 或 `routes.ts`）/ 第一个 loader / 第一个 action / `Form` / `<Outlet>` / `useLoaderData` / `useActionData` / 三种模式辨析 / 从 Remix v2 迁移
- [指南](./guide-line.md)：file-based routing / `routes.ts` 配置 / nested routes 嵌套布局 / loaders + actions / `Form` 组件 / `useNavigation` / `useFetcher` / `useRevalidator` / Error Boundaries / Meta / Headers / Links / Prefetching / Streaming with `defer` / SSR / SSG (`prerender`) / SPA / Sessions / Cookies / Server-side Validation / Resource Routes / Type Safety / 与 TanStack Router 对比 / 常见踩坑（`.client` / `.server` / loader 序列化 / Remix→v7 迁移）
- [参考](./reference.md)：API 速查（Hooks / Components / Route Module 导出 / `react-router.config.ts` 配置 / CLI / Adapter）
