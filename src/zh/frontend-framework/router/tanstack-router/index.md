---
layout: doc
---

# TanStack Router

[TanStack](https://tanstack.com) 团队（Tanner Linsley，TanStack Query / Table / Form / Virtual 等 headless 库作者）打造的「**100% type-safe 路由库**」，是 [TanStack Start](../../meta/tanstack-start/) 全栈元框架背后的**路由层**，也可作为**独立的客户端路由库**单独使用。截至 2026 年 5 月最新稳定版 **v1.x**，定位是「**类型安全到极致的 React Router 替代品**」。TanStack Router 与 React Router / Next.js App Router / Vue Router 最大的差异——**路由参数、Search Params、Loader 返回值、Context 链全部由 TypeScript 编译期推导**，通过 `routeTree.gen.ts`（Vite 插件 dev / build 时自动写出）把整棵路由树的类型注册到全局 `Register` 接口，让 <span v-pre>`<Link to="/posts/$postId" params={{ postId: "1" }}>`</span> 在拼错路径、漏参数、search 校验失败时**直接编译报错**。核心特性矩阵：**File-based routing 默认**（`src/routes/` 目录约定 + `$param` 动态 + `_layout` pathless layout + `(group)` 分组 + `__root` 根路由 + splat / catch-all）**和 Code-based routing 任选**（`createRootRoute` + `createRoute` + `getParentRoute` 显式拼装）/ **Type-safe Search Params**（`validateSearch` 接 Zod / Valibot / 自写 validator，URL 参数被当作**一等公民的应用状态**而非纯字符串）/ **Loader + beforeLoad 路由级数据获取**（loaderDeps 依赖追踪 / stale-while-revalidate 缓存 / 并行加载 / 自动重试）/ **Pending UI**（`defaultPendingMs` + `defaultPendingMinMs` 双阈值避免闪烁）/ **错误边界**（`errorComponent` + `notFoundComponent` 路由级）/ **Code splitting 自动化**（Vite 插件 `autoCodeSplitting: true`，`createLazyFileRoute` 也可手动）/ **Preloading**（`defaultPreload: 'intent'` 鼠标 hover / touchstart 触发预加载）/ **Built-in Cache**（loader 数据带 staleTime / gcTime，类似 TanStack Query 的 SWR 行为）/ **与 TanStack Query 协作**（`queryClient` 注入 router context，loader 调 `queryClient.ensureQueryData()`，组件用 `useSuspenseQuery` 读，享受双层缓存）/ **三种 History 实现**（`createBrowserHistory` / `createHashHistory` / `createMemoryHistory`）/ **Scroll Restoration**（路由级 + 浏览器原生 back/forward 位置保留）/ **Route Context**（`beforeLoad` 返回值合并到 context 链，向下传递认证 / queryClient / api 实例）/ **框架无关**（React 主推，也有 Solid 实现 `@tanstack/solid-router`）。**典型用户群**：所有重度使用 search params 作为应用状态的 SaaS / Dashboard / 电商列表 / 复杂筛选器项目；TanStack Query 重度用户；想要 React Router v7 的 loader/action 心智但讨厌 Remix/Next.js 约束的团队；从 React Location 迁移过来的项目（同作者）。

## 评价

**优点**

- **路由类型安全冠绝群雄**：`createFileRoute('/posts/$postId')` 中的路径字符串由 Vite 插件自动管理（你不用手写）；`params.postId` 类型推导到组件 / loader / `<Link>` 全链路；search params 通过 `validateSearch: zSchema` 编译期 + 运行期双校验——其它路由库做不到
- **Search Params 一等公民**：URL 中的 `?page=2&sort=newest` 不是简单字符串而是**结构化对象**（自动 JSON.stringify / parse + Zod 校验 + 默认值）；用 `useSearch({ from: ... })` 拿到完全推导的对象；导航时用 `<Link search={(prev) => ({ ...prev, page: prev.page + 1 })}>` 函数式更新
- **Loader + beforeLoad 双层数据获取**：`beforeLoad` 在所有 loader 之前并行执行（做认证 / 注入 context），`loader` 拿 `params` + `deps` + `context` 返回数据；嵌套路由的所有 loader **并行加载**——比 React Router v7 的 sequential loader 更快
- **loaderDeps 精细依赖追踪**：`loaderDeps: ({ search }) => ({ page: search.page })` 显式声明 loader 依赖哪些 search 字段——只有这些字段变了才重新加载，避免无关 search 变化触发重新请求
- **Stale-While-Revalidate 内置**：`staleTime` 内数据视为新鲜直接返回，过期后返回旧数据 + 后台重新加载；`gcTime` 控制内存回收——开箱即用的高效缓存，无需 TanStack Query 也能享受类似体验
- **File-based + Code-based 双轨**：File-based 默认（`src/routes/` 约定 + 自动生成 routeTree） / Code-based 手动（`createRootRoute` + `createRoute` + `getParentRoute`）/ 还可以混用——比 React Router 更灵活，比 Next.js App Router 更不约束
- **Code splitting 全自动**：Vite 插件 `autoCodeSplitting: true` 默认开启，路由 component / loader / errorComponent 自动按需分包；不想自动也可显式 `createLazyFileRoute` + `.lazy.tsx` 文件
- **Preloading 多策略**：`defaultPreload: 'intent'` hover / touchstart 预加载、`'viewport'` 进入视口预加载、`'render'` 渲染时预加载——大幅提升大型应用首屏导航体验
- **Pending UI 不闪烁**：`defaultPendingMs: 1000` + `defaultPendingMinMs: 500` 双阈值——只有加载 > 1s 才显示 loading 且至少展示 500ms，避免快网络下闪一下又消失的难看体验
- **错误边界路由级**：每个路由可定义 `errorComponent`（catch 渲染 + loader 错误）/ `notFoundComponent`（throw notFound() 时渲染），错误隔离在该路由层级而不影响兄弟路由
- **与 TanStack Query 完美协作**：`createRootRouteWithContext<{ queryClient }>()` 注入 queryClient → loader 用 `queryClient.ensureQueryData()` 预取 → 组件用 `useSuspenseQuery` 读取——loader 保证有数据、Query 提供乐观更新 / 失效 / 重试，双层缓存
- **Route Context 链式注入**：`beforeLoad` 返回的对象会**合并到子路由的 context**——root 注入 queryClient，`_authenticated` 注入 user，叶子路由就能拿到完整链——比 React Context Provider 嵌套优雅
- **Built-in Devtools**：`@tanstack/react-router-devtools` 显示路由匹配 / loader 状态 / search params 解析 / context 链 / pending 路由——调试体验远超 React Router DevTools
- **从 React Location 迁移友好**：作者同人（Tanner Linsley），API 设计延续 React Location 的「**Loader-first**」哲学但补足了类型化
- **框架无关**：React 主推（`@tanstack/react-router`）/ Solid 实现（`@tanstack/solid-router`）/ Vue / Svelte 在 roadmap——内核与 framework adapter 解耦

**缺点**

- **学习曲线陡**：`createFileRoute` / `createRoute` / `createRootRoute` / `createRootRouteWithContext` / `getParentRoute` / `addChildren` 一堆概念加上 `routeTree.gen.ts` 自动生成「魔法」——新手前两天会迷失
- **`routeTree.gen.ts` 是生成产物**：Vite 插件在 dev / build 时自动写入 `src/routeTree.gen.ts`，需决定提交 git 还是 gitignore（多数项目选 gitignore + dev 启动时再生成）——团队要统一约定
- **路由约定密集**：`__root.tsx` / `_layout` / `$param` / `_` 后缀（非嵌套）/ `-` 前缀（排除）/ `(group)` / `.route.tsx` / `.lazy.tsx` 等多种文件名规则——一起出现时复杂
- **search params 必须 JSON-serializable**：`validateSearch` 只接受可序列化值（string / number / boolean / array / object），不能传 Date / Map / Set / function——与 URL 状态本质契合但仍是限制
- **Loader 阻塞导航**：默认 loader 完成前不渲染（与 React Router 一致）；要 streaming 需手动用 `defer` API；不像 RSC 那样自然 streaming
- **bundle 偏大**：核心 + devtools ~50KB gzip（vs Vue Router ~10KB / React Router 7 ~15KB）——主要是类型系统运行时支持
- **vs React Router v7**：RR7 也有 type-safe（`typegen`）但是**生成 `.d.ts` 而不是路由树注册**，类型推导深度不如 TSR；RR7 路由配置更接近 Express、TSR 更接近文件系统
- **vs Next.js App Router**：Next.js 押注 RSC（默认服务端组件 + 客户端 opt-in），TSR + Start 押注同构（默认全客户端组件 + `createServerFn` 显式服务端）；两套哲学不可直接对比
- **vs Vue Router**：Vue Router 是配置驱动 + Vue Reactivity 深度集成、TSR 是文件路由 + 100% TS——一个 Vue 一个 React，不可对应迁移
- **Solid 版本滞后**：`@tanstack/solid-router` 跟 React 版同仓库但功能完整度略差、社区资料更少
- **不适合**：不写 TypeScript（浪费 80% 卖点）、极简 SPA（Vue Router / React Router v6 心智更低）、需要 RSC（用 Next.js）
- **生态规模小**：模板 / 教程 / Stack Overflow 答案数量级少于 React Router / Next.js；招聘市场基本看不到「TanStack Router 工程师」职位（但岗位描述里会写「熟悉 React Router / TanStack Router 任一」）

## 文档地址

[TanStack Router 官网](https://tanstack.com/router) | [Overview](https://tanstack.com/router/v1/docs/framework/react/overview) | [Quick Start](https://tanstack.com/router/v1/docs/framework/react/quick-start) | [Routing Concepts](https://tanstack.com/router/v1/docs/routing/routing-concepts) | [File-Based Routing](https://tanstack.com/router/v1/docs/routing/file-based-routing) | [Code-Based Routing](https://tanstack.com/router/v1/docs/routing/code-based-routing) | [API Reference](https://tanstack.com/router/v1/docs/api/router)

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=tanstack-router" target="_blank" rel="noopener noreferrer">TanStack Router 测试题</a>


## GitHub 地址

[TanStack/router](https://github.com/TanStack/router)（TanStack Router 与 TanStack Start 共仓库，Router 位于 `packages/react-router` / `packages/solid-router` / `packages/router-core`，插件位于 `packages/router-plugin`）

## 学习路径

- [入门](./getting-started.md)：`pnpm add @tanstack/react-router` 安装 / `@tanstack/router-plugin/vite` Vite 插件配置 / 第一个 File-based 路由（`src/routes/` 目录约定 + `routeTree.gen.ts` 自动生成）/ 第一个 Code-based 路由（`createRootRoute` + `createRoute` + `addChildren`）/ `createRouter` + `<RouterProvider>` 入口 / 导航（`<Link>` + `useNavigate`）/ 类型推导（`declare module '@tanstack/react-router'` + `Register` 接口）/ Devtools 集成 / 第一个完整 Demo
- [指南](./guide-line.md)：**核心**：File-based 文件命名约定全集（`index.tsx` / `posts.tsx` / `posts.$postId.tsx` / `_layout.tsx` / `(group)/` / `__root.tsx` / `.route.tsx` / `.lazy.tsx` / splat `$`）/ Code-based 路由树拼装（`getParentRoute` / `addChildren` / pathlessLayoutRoute）/ Type-safe params 推导链 / Search Params + `validateSearch` + Zod / `useSearch` + `<Link search={...}>` / Loader 数据获取 / beforeLoad 认证 + redirect / loaderDeps 依赖追踪 / Stale-While-Revalidate 缓存（staleTime / gcTime / preloadStaleTime）/ Pending UI（pendingComponent / defaultPendingMs / defaultPendingMinMs）/ Error Boundary（errorComponent / notFoundComponent）/ Preloading（intent / viewport / render）/ Code Splitting（autoCodeSplitting / createLazyFileRoute）/ Route Context（createRootRouteWithContext + beforeLoad 注入）/ 与 TanStack Query 协作（queryClient.ensureQueryData + useSuspenseQuery）/ Scroll Restoration / useBlocker 离开拦截 / 测试 / 常见踩坑
- [参考](./reference.md)：**API 速查**：`@tanstack/react-router` 全部导出 / `createRouter` + RouterOptions / `createRootRoute` / `createRootRouteWithContext` / `createRoute` / `createFileRoute` / `createLazyFileRoute` / RouteOptions 全字段 / `<RouterProvider>` / `<Link>` props 完整签名 / `<Outlet>` / Hooks（`useRouter` / `useNavigate` / `useParams` / `useSearch` / `useLoaderData` / `useMatch` / `useMatches` / `useRouteContext` / `useBlocker` / `useLocation` / `useRouterState`）/ `redirect()` / `notFound()` / History types（`createBrowserHistory` / `createHashHistory` / `createMemoryHistory`）/ Vite 插件 `tanstackRouter()` 选项 / Register 接口 + 类型扩展
