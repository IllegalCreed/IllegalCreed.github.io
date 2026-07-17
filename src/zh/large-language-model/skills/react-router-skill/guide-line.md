---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 remix-run/react-router 官方 Agent Skill（`.agents/skills/react-router`）与已归档的 remix-run/agent-skills 各模式 SKILL.md（2026-07 读取）编写。

## 速查

- **先认模式**：Framework / Data / Declarative / unstable RSC——不同模式套路不同，别把框架模式硬套给声明式应用
- **识别信号**：见 `@react-router/dev`、`react-router.config.ts`、`app/routes.ts` → 框架模式；见 `createBrowserRouter` + `<RouterProvider>` → 数据模式；见 `<BrowserRouter>` + `<Routes>`/`<Route>` → 声明式；见 `unstable_reactRouterRSC`、`@vitejs/plugin-rsc` → RSC
- **文档真相源**：读 `node_modules/react-router/docs/`，只应用 `[MODES: ...]` 标记匹配的文档
- **表单**：搜索用 `<Form method="get">`；内联变更用 `useFetcher`（不导航）；`<Form method="post">` 用于「变更后跳转」
- **乐观 UI**：用 `fetcher.formData` 立刻显示预期结果
- **布局**：全局 UI 放 `root.tsx`，分区布局用嵌套路由 + `<Outlet />`
- **`meta`**：用 `loaderData`，不用弃用的 `data`
- **渲染策略**（框架模式，`react-router.config.ts`）：`ssr:true`（默认 SSR）/ `ssr:false`（SPA，用 `clientLoader`）/ `prerender`（预渲染）
- **版本门槛**：中间件需 v7.9.0+（`v8_middleware` flag）；核心特性 v7.0.0+

## 模式感知：先认模式再动手

新 skill 的第一条原则就是「React Router is mode-specific」——**先识别应用处于哪种模式，加载匹配的 reference，再读随包安装的文档**。绝不能在没打算迁移模式时，把框架 / 数据模式的写法硬塞给声明式应用。识别信号：

| 模式 | 关键信号 |
| --- | --- |
| **Framework** | `@react-router/dev`、`react-router.config.ts`、`app/routes.ts`、`entry.server.tsx`/`entry.client.tsx`、`app/routes/` 下的路由模块、`loader`/`action`/`clientLoader`/`clientAction`/`ErrorBoundary`/`meta`/`links`/`headers` 导出、`./+types/...` 导入、`@react-router/dev/vite` 插件 |
| **Data** | `createBrowserRouter`/`createHashRouter`/`createMemoryRouter`/`createStaticRouter`、`<RouterProvider router={router}>`、含 `path`/`children`/`loader`/`action`/`Component`/`ErrorBoundary`/`lazy` 的路由对象、**无** Vite 插件 |
| **Declarative** | `<BrowserRouter>`/`<HashRouter>`/`<MemoryRouter>`、`<Routes>` + `<Route>` JSX、`element={<Component />}`、无数据路由、无路由模块约定、无 `loader`/`action` |
| **unstable RSC** | `unstable_reactRouterRSC`、`@vitejs/plugin-rsc`、`unstable_RSCRouteConfig`、`entry.rsc`、`ServerComponent`/`ServerErrorBoundary`/`ServerLayout`/`ServerHydrateFallback`、`"use client"`/`"server-only"`/`"client-only"` 指令 |

## 三种（+RSC）模式各覆盖什么

### 框架模式（Framework Mode）

React Router 的全栈开发体验：基于文件的路由、服务端 / 客户端 / 静态渲染策略、数据加载与变更、类型安全的路由模块 API。覆盖：

- **路由**：`app/routes.ts` 用 `route`/`index`/`layout`/`prefix` 配置，嵌套路由、动态段 `:id`、可选段 `?`、splat `*`
- **数据加载**：`loader`（服务端）/ `clientLoader`（浏览器），流式、缓存
- **变更**：`action`（服务端）/ `clientAction`（浏览器），表单、校验；action 完成后页面所有 loader **自动重新校验**（revalidate）
- **导航**：`<Link>`、`<NavLink>`、`<Form>`、`redirect`、`useNavigate`
- **pending / optimistic UI**、**错误边界**（`ErrorBoundary`）、**渲染策略**（SSR / SPA / 预渲染）、**中间件**（v7.9.0+）、**会话与鉴权**（cookie session、受保护路由）、**类型安全**（自动生成路由类型 `./+types/...`）

### 数据模式（Data Mode）

用 `createBrowserRouter` + `RouterProvider` 开启数据加载、action、pending UI，**不需要框架的 Vite 插件**——适合给已有 React 应用补数据能力。

```tsx
import { createBrowserRouter, RouterProvider } from "react-router";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "about", Component: About },
    ],
  },
]);

ReactDOM.createRoot(root).render(<RouterProvider router={router} />);
```

覆盖：路由对象属性、`loader`、`action`、`useNavigation` 做 pending UI、`useFetcher` 无导航变更、乐观更新、数据模式下的 SSR。

### 声明式模式（Declarative Mode）

最简单的模式：`<BrowserRouter>` + `<Routes>` + `<Route>` 做基础客户端路由，**没有** `loader`/`action` 等数据能力。

```tsx
import { BrowserRouter, Routes, Route } from "react-router";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="dashboard" element={<Dashboard />}>
          <Route index element={<DashboardHome />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="users/:userId" element={<User />} />
      </Routes>
    </BrowserRouter>
  );
}
```

覆盖：JSX 路由、`<Link>`/`<NavLink>` 导航（`NavLink` 的 `isActive` 激活样式）、用 `useParams` 读动态段、`useSearchParams` 读查询串、`useLocation` 读位置——**无数据加载**。

### unstable RSC 模式

React Server Components 支持仍是 **unstable**，分 RSC Framework 与 RSC Data 两种变体。信号见上表（`unstable_reactRouterRSC` 等）。RSC Framework 读 `framework-mode.md` + `rsc.md`；RSC Data 读 `data-mode.md` + `rsc.md`；主文档在 `node_modules/react-router/docs/how-to/react-server-components.md`。因是 unstable，勿在生产强依赖。

## skill 瘦身 + 引导读 `node_modules` 文档的设计

旧版三个模式技能各自把大量细节写进 `SKILL.md` + `references/`。新版的关键设计是**把 skill 本体瘦身，改为引导 agent 直接读随包安装的文档**：

- **真相源在包里**：`node_modules/react-router/docs/`，版本 = 你装的库版本
- **模式标记护栏**：文档顶部 `[MODES: framework, data, declarative]`，只应用匹配当前模式的文档
- **迁移文档索引**：若用户明确要切换模式，skill 给出「读哪个目标模式 reference + 哪些迁移文档」的对照表（如声明式 → 数据、声明式/数据 → 框架、框架 SSR/SPA/预渲染调整、future flags/升级）

**为什么这样更好**：skill 不再自带一份会滞后的知识副本。库升级 → 随包文档升级 → agent 读到新版。这解决了「AI 用过时 API 写代码」的老问题——训练数据可能停在旧版，但 `node_modules` 里的文档永远是当前版本。

## loaders / actions / forms 核心模式

三种模式里凡涉及数据的，表单与变更的正确姿势高度一致：

**搜索表单用 `<Form method="get">`**，别手动 `onSubmit` + `setSearchParams`：

```tsx
// ✅ 正确：Form method="get" 自动把输入序列化进 URL search params
<Form method="get">
  <input name="q" />
</Form>

// ❌ 错误：手动处理 search params
<form onSubmit={(e) => { e.preventDefault(); setSearchParams(/* ... */); }}>
```

**内联变更用 `useFetcher`**（不触发页面导航），而非 `<Form>`：

```tsx
function FavoriteButton({ itemId, isFavorite }) {
  const fetcher = useFetcher();
  // 乐观 UI：优先用提交中的 formData，回退到服务端状态
  const optimistic = fetcher.formData
    ? fetcher.formData.get("favorite") === "true"
    : isFavorite;

  return (
    <fetcher.Form method="post" action={`/items/${itemId}/favorite`}>
      <input type="hidden" name="favorite" value={String(!optimistic)} />
      <button>{optimistic ? "★" : "☆"}</button>
    </fetcher.Form>
  );
}
```

选型速记：

| 场景 | 用法 | 原因 |
| --- | --- | --- |
| 搜索 / 筛选表单 | `<Form method="get">` | 自动更新 URL search params |
| 变更后跳转 | `<Form method="post">` | 创建后 redirect |
| 无导航的变更（点赞 / 评分 / 内联编辑） | `useFetcher` | 独立状态、不刷新、可乐观更新 |
| 一页多个变更 | `useFetcher` | 每个 fetcher 状态独立 |

**默认用 `useFetcher` 做变更**——更顺滑、可乐观更新、无整页刷新。服务端 `action` 里校验失败用 `data({ errors }, { status: 400 })` 返回错误，成功 `redirect`。

## 渲染策略（框架模式）

在 `react-router.config.ts` 配置：

```ts
import type { Config } from "@react-router/dev/config";

export default {
  ssr: true, // 默认：服务端渲染
  // ssr: false,          // SPA：单页应用，改用 clientLoader
  // prerender: ["/", "/about"], // 预渲染指定路径（也可 true 或 async 函数）
} satisfies Config;
```

| 策略 | 配置 | `loader` | 适用 |
| --- | --- | --- | --- |
| SSR | `ssr: true`（默认） | 首屏 + 导航都在服务端 | 动态内容、SEO、依赖鉴权 |
| SPA | `ssr: false` | 不运行（改用 `clientLoader`） | 鉴权后台、仪表盘、无 Node 服务器 |
| 预渲染 | `prerender` | 构建时 | 营销页、博客、文档、CDN 缓存 |

## 反模式

- ❌ 把**框架 / 数据模式**的 `loader`/`action` 套用到**声明式**应用（除非有意迁移）
- ❌ 搜索用手动 `onSubmit` + `setSearchParams`（应 `<Form method="get">`）
- ❌ 内联变更用 `<Form>` 导致整页导航（应 `useFetcher`）
- ❌ `meta` 里用弃用的 `data`（应 `loaderData`）
- ❌ 为导航 / 页脚单独造 layout 文件（全局 UI 放 `root.tsx`）
- ❌ 扁平路由不共享布局（应嵌套路由 + `layout` + `<Outlet />`）
- ❌ 依赖训练数据里的旧 API（应读 `node_modules/react-router/docs/` 版本对齐的文档）

## 与相邻叶的边界

- 本叶只讲 **React Router**；**TanStack Router & Start Skills**、**Redux Toolkit Skills** 在同组相邻叶
- 旧版「三模式各一技能」已归档，落地请用主仓库的单一 `react-router` 技能

## 下一步

- [参考](./reference) —— 三模式（+RSC）速查表、安装命令、`references/` 组织、`node_modules` 文档路径、版本、许可、链接
- 上游：[React Router 文档](https://reactrouter.com/docs) · [discussion #15099](https://github.com/remix-run/react-router/discussions/15099)
