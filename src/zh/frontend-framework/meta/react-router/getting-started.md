---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 React Router v7.x（`react-router` + `@react-router/dev`）编写。**React Router v7 = Remix v3 合并发布**——从 Remix v2 升级请看末尾「从 Remix 迁移」章节。

## 速查

- 系统要求：**Node.js 20+** + React 19（或 18） + TypeScript 5+
- 创建项目：`npx create-react-router@latest my-app`
- 启动 dev server：`npm run dev`（端口 5173，Vite）
- 生产构建：`npm run build`（输出 `build/client` + `build/server`）
- 生产启动：`npm run start`（`react-router-serve build/server/index.js`）
- 生成类型：`npx react-router typegen`（`.react-router/types/+types/<route>.d.ts`）
- 三种模式：**Framework**（推荐，本笔记主讲）/ **Data**（Data Router）/ **Declarative**（v6 兼容）
- 核心配置文件：`react-router.config.ts`（SSR / SSG / 路由发现等） + `app/routes.ts`（路由清单） + `app/root.tsx`（根 HTML）
- 路由：`app/routes.ts` 用 `route()` / `index()` / `layout()` / `prefix()` 配置；或装 `@react-router/fs-routes` 用文件路由
- Route Module：每个路由文件可导出 `default`（组件）+ `loader` / `clientLoader` / `action` / `clientAction` / `ErrorBoundary` / `meta` / `links` / `headers` / `HydrateFallback` / `shouldRevalidate` / `handle`
- 类型安全：`import type { Route } from "./+types/<file>"` 拿到 `Route.LoaderArgs` / `Route.ComponentProps` 等
- 数据：`loader` 服务端 + `clientLoader` 客户端 + `useLoaderData()` 取数 + `Route.ComponentProps.loaderData` props 注入
- 表单：`<Form method="post" action="...">` 触发同路由 `action` + `useActionData()` / `Route.ComponentProps.actionData` 拿返回
- 无导航 mutation：`useFetcher()` → `<fetcher.Form>` / `fetcher.submit()` / `fetcher.load()` / `fetcher.state` / `fetcher.data`
- 导航：`<Link to="/about">` / `<NavLink>`（带 active 状态）/ `useNavigate()`（编程式）/ `redirect()`（loader/action 内）

## React Router 是「路由 + 元框架二合一」不是「另一个 Next.js」

理解 React Router v7 必须先理解它**两种身份**——作为「**纯客户端路由库**」（Declarative / Data 模式，覆盖 React 路由市场第一）+ 作为「**全栈元框架**」（Framework 模式，Remix 的官方继任者）：

| 维度 | React Router v7 (Framework) | Next.js 15 App Router | Remix v2 | SolidStart | Qwik City |
|---|---|---|---|---|---|
| 渲染模式 | SSR / SPA / SSG | SSR + RSC | SSR | SSR / SPA / SSG | Resumable |
| 路由方式 | `routes.ts` 配置或文件路由 | 文件路由 | 文件路由 | 文件路由 | 文件路由 |
| 数据加载 | `loader` + `clientLoader` | `fetch()` (RSC) / `useEffect` | `loader` | `query()` / `createAsync()` | `routeLoader$` |
| 数据 mutation | `action` + `Form` / `useFetcher` | Server Actions | `action` | `action()` | `routeAction$` |
| 状态推送 | 自动 revalidate loader | `revalidatePath` / `revalidateTag` | 自动 | 自动 | 自动 |
| 服务器组件 | 否（unstable RSC 已加） | 是（RSC 默认） | 否 | 否 | 否 |
| Bundle 模型 | 全 client + server fn | client + server 二分 | 全 client + server fn | 全 client + server fn | resumable + lazy `$` |
| 类型生成 | `react-router typegen` 自动 | 半自动 | 半自动 | 完整泛型 | 完整泛型 |
| 迁移路径 | Remix → 1 codemod | 从头写 | （已停） | 从头写 | 从头写 |
| 心智模型 | nested loaders + 表单 | RSC + 客户端组件 | nested loaders + 表单 | `"use server"` + Solid 响应式 | resumable + `$` |

**含义**：

- React Router v7 沿用 Remix 的「**nested route + parallel loaders**」核心模型——父路由 loader 与子路由 loader **并行**执行，不是 Next.js Pages Router 那种串行瀑布
- 与 Next.js App Router 的根本差异：**Next.js 押 RSC**（服务器组件 + 客户端组件二分），React Router v7 仍是「**全组件都是客户端组件 + server functions 通过 loader/action 暴露**」——更接近传统 Web 模型，但缺少 RSC 的极致 bundle 削减
- 与 Astro 的对比：Astro 是「内容站」优先 + Island；React Router v7 是「应用」优先 + nested loaders——两者解决不同类问题
- **不适合**：极端 SEO 内容站（用 Astro）、对 RSC 有要求的项目（用 Next.js）、想用 Solid / Svelte（用对应框架）
- **适合**：从 Remix v2 升级（一条 codemod）/ React 全栈应用 / 需要 SSR + SSG + SPA 灵活切换 / 看重 React 生态丰富度

## 三种模式辨析

React Router v7 提供三种使用模式，**特性递增（Declarative ⊂ Data ⊂ Framework）**：

### Declarative 模式：纯 v6 兼容

最简单的用法——`<BrowserRouter>` + `<Routes>` + `<Route>`，仅做 URL ↔ Component 映射，无 loader / action / pending state。

```tsx
// main.tsx（Vite + React 19）
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import App from './App'
import About from './About'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/about" element={<About />} />
    </Routes>
  </BrowserRouter>,
)
```

**适合**：从 v6 升级（仅改 `react-router-dom` → `react-router` 包名）、纯 SPA、自己有数据层（SWR / TanStack Query）。

### Data 模式：v6.4+ Data Router

通过 `createBrowserRouter()` + `<RouterProvider>` 配置路由——加入 loader / action / `useFetcher` / pending state，但不含 Vite plugin / SSR / 类型生成。

```tsx
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'

const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    loader: async () => ({ user: await getUser() }),
    children: [
      { index: true, Component: Home },
      { path: 'about', Component: About },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />,
)
```

**适合**：需要 loader/action 但要自己控制 bundling、服务器（自定义 SSR）、从 v6.4+ 升级。

### Framework 模式：完整元框架（本笔记主讲）

`@react-router/dev` 提供的 Vite plugin——文件 / 配置路由 + 类型自动生成 + SSR / SSG / SPA 三种渲染策略 + adapter 部署。

```tsx
// app/routes.ts
import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('./routes/home.tsx'),
  route('about', './routes/about.tsx'),
] satisfies RouteConfig
```

```tsx
// app/routes/home.tsx
import type { Route } from './+types/home'

export async function loader() {
  return { message: 'Hello from server!' }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <h1>{loaderData.message}</h1>
}
```

**适合**：新建项目（推荐起点）、从 Remix v2 升级、需要全栈 SSR / SSG。

## 安装与首次启动

### 创建新项目

最简单的起点：

```bash
npx create-react-router@latest my-app
```

交互式菜单：

```
? Where would you like to create your app? › ./my-app
? Initialize a new git repository? › Yes
? Install dependencies with npm? › Yes
```

完成后：

```bash
cd my-app
npm run dev
# 浏览器打开 http://localhost:5173
```

### 使用指定模板

官方维护一系列模板，覆盖不同部署目标：

```bash
# 默认 Node Docker 模板（含 Tailwind）
npx create-react-router@latest --template remix-run/react-router-templates/default

# Node + Express 自定义服务器
npx create-react-router@latest --template remix-run/react-router-templates/node-custom-server

# Node + Postgres + Drizzle ORM
npx create-react-router@latest --template remix-run/react-router-templates/node-postgres

# Cloudflare Workers
npx create-react-router@latest --template remix-run/react-router-templates/cloudflare

# Vercel
npx create-react-router@latest --template remix-run/react-router-templates/vercel
```

完整模板清单见 [remix-run/react-router-templates](https://github.com/remix-run/react-router-templates)。

### Node 版本要求

```bash
node -v   # 必须 ≥ 20.0.0，推荐 v22 LTS
```

> React Router v7 强制 Node 20+——使用 18 启动 dev server 会报 `Unsupported Node version`。

### 关键脚本（package.json）

| 脚本 | 命令 | 用途 |
|---|---|---|
| `dev` | `react-router dev` | 开发模式（Vite SSR HMR） |
| `build` | `react-router build` | 完整构建（client + server） |
| `start` | `react-router-serve ./build/server/index.js` | 生产 SSR 服务器（端口 3000） |
| `typecheck` | `react-router typegen && tsc` | 类型生成 + tsc 类型检查 |

> `react-router-serve` 是 React Router 内置的极简 Express 服务器，仅适合开发预览 / 小型项目；生产建议用 adapter 或自定义服务器。

## 项目结构

`create-react-router` 生成的默认项目结构：

```
my-app/
├── app/                         # ✨ 应用代码根目录
│   ├── routes/                  # 路由模块（不强制目录名，但约定俗成）
│   │   ├── home.tsx             # / 路由
│   │   └── about.tsx            # /about 路由
│   ├── routes.ts                # ✨ 路由清单（核心配置）
│   ├── root.tsx                 # ✨ 根组件（HTML 文档骨架）
│   ├── entry.client.tsx         # 客户端入口（默认隐式，需自定义时显式创建）
│   ├── entry.server.tsx         # 服务端入口（默认隐式）
│   ├── welcome/                 # 模板自带组件目录
│   │   └── welcome.tsx
│   └── app.css                  # 全局样式（含 Tailwind 引入）
├── public/                      # 静态资源（直接服务）
│   └── favicon.ico
├── build/                       # ⚙️ 构建输出（不提交）
│   ├── client/                  # 客户端 bundle
│   └── server/                  # 服务端 bundle
├── .react-router/               # ⚙️ 类型生成目录（不提交，加入 .gitignore）
│   └── types/+types/            # 自动生成的路由类型
├── react-router.config.ts       # ✨ 全局配置（SSR / SSG / prerender / 适配器）
├── vite.config.ts               # Vite 配置（含 reactRouter Vite plugin）
├── tsconfig.json
└── package.json
```

### `react-router.config.ts`

全局配置——SSR / SSG / 路由发现：

```ts
import type { Config } from '@react-router/dev/config'

export default {
  /** 是否启用 SSR（默认 true）；false 时即 SPA 模式 */
  ssr: true,

  /** 静态预渲染（SSG）：数组 / 函数 / true 全静态路径 */
  // prerender: ['/', '/about'],
  // prerender: async ({ getStaticPaths }) => [...getStaticPaths(), '/blog/post-1'],

  /** 应用代码目录（默认 'app'） */
  // appDirectory: 'app',

  /** 路由清单文件路径 */
  // routes: 'app/routes.ts',

  /** 服务器输出目录（默认 'build/server'） */
  // serverBuildFile: 'index.js',
} satisfies Config
```

### `app/root.tsx`

应用唯一**必需**的路由——所有路由都嵌套在它下面。负责渲染根 `<html>` 文档：

```tsx
// app/root.tsx
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from 'react-router'
import type { Route } from './+types/root'
import './app.css'

/**
 * Layout 组件：渲染 HTML 文档外壳
 * - 同时包裹默认组件 / HydrateFallback / ErrorBoundary
 * - 避免 ErrorBoundary 渲染时丢失 <head> 中的 styles / scripts
 */
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

/** 默认导出：根组件，渲染子路由 */
export default function App() {
  return <Outlet />
}

/** 错误边界：捕获子路由所有未处理错误 */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details = error.status === 404 ? 'The requested page could not be found.' : error.statusText || details
  }
  else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && <pre><code>{stack}</code></pre>}
    </main>
  )
}
```

**关键组件**：

- `<Outlet />`：渲染匹配的子路由
- `<Scripts />`：注入客户端 hydration 脚本（**必需**，没有它客户端不能 hydrate）
- `<ScrollRestoration />`：客户端导航后恢复 / 重置滚动位置（**强烈推荐**）
- `<Meta />`：聚合所有路由 `meta` 导出的标签
- `<Links />`：聚合所有路由 `links` 导出的 `<link>` 标签

> **Layout 组件的作用**：`Layout` 会同时包裹默认组件、`HydrateFallback`、`ErrorBoundary`——保证错误页 / loading 页也有完整的 HTML 文档。这是 v7 推荐用法，比直接把 `<html>` 写在 default export 里更安全。

### `app/routes.ts`

路由清单——告诉 React Router 哪些 URL 走哪些路由模块：

```ts
// app/routes.ts
import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('./routes/home.tsx'),
  route('about', './routes/about.tsx'),
] satisfies RouteConfig
```

**API 速览**：

- `index(file)`：父路由的索引子路由（默认子路由）
- `route(pattern, file, children?)`：URL 模式 + 模块文件 + 嵌套子路由
- `layout(file, children)`：纯 layout 路由（不增加 URL 段，仅共享布局）
- `prefix(path, children)`：批量给一组路由加 URL 前缀

完整用法见 [指南](./guide-line.md) 「路由配置」章节。

## 第一个路由

### 简单页面

```tsx
// app/routes/home.tsx
export default function Home() {
  return <h1>Hello, React Router!</h1>
}
```

```ts
// app/routes.ts
import { type RouteConfig, index } from '@react-router/dev/routes'

export default [
  index('./routes/home.tsx'),
] satisfies RouteConfig
```

访问 `http://localhost:5173/`——浏览器显示 `Hello, React Router!`。

### 嵌套路由 + Outlet

父路由通过 `<Outlet />` 渲染子路由。比如 `/dashboard` 下嵌套 `/dashboard/settings`：

```tsx
// app/routes/dashboard.tsx
import { Outlet, NavLink } from 'react-router'

export default function Dashboard() {
  return (
    <div>
      <nav>
        <NavLink to="/dashboard" end>概览</NavLink>
        {' '}
        <NavLink to="/dashboard/settings">设置</NavLink>
      </nav>
      {/* 子路由渲染在这里 */}
      <Outlet />
    </div>
  )
}
```

```tsx
// app/routes/dashboard-home.tsx
export default function DashboardHome() {
  return <h2>概览</h2>
}
```

```tsx
// app/routes/dashboard-settings.tsx
export default function DashboardSettings() {
  return <h2>设置</h2>
}
```

```ts
// app/routes.ts
import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('./routes/home.tsx'),
  // dashboard 作为父路由，渲染 dashboard.tsx 的 <Outlet/>
  route('dashboard', './routes/dashboard.tsx', [
    index('./routes/dashboard-home.tsx'), // /dashboard
    route('settings', './routes/dashboard-settings.tsx'), // /dashboard/settings
  ]),
] satisfies RouteConfig
```

> **要点**：父路由必须渲染 `<Outlet/>` 否则子路由不会显示；`<NavLink to="/dashboard" end>` 的 `end` prop 让该链接**仅在精确匹配 `/dashboard`** 时显示 active 样式，否则在 `/dashboard/settings` 时也会高亮。

## 第一个 Loader（服务端数据加载）

`loader` 是路由模块导出的 async 函数——React Router 在**服务端**调用（SSR 首屏 / client navigation 时通过 fetch 调服务端 endpoint），把返回值序列化给客户端组件。

```tsx
// app/routes/posts.tsx
import type { Route } from './+types/posts'

/**
 * 服务端加载文章列表
 * - 这个函数只在服务器运行，client bundle 中会被 tree-shaken 移除
 * - 因此可以放心 import 服务端专属代码（数据库、文件 IO、私密 API key）
 */
export async function loader() {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5')
  const posts = await res.json() as Array<{ id: number, title: string, body: string }>
  return { posts }
}

/**
 * 组件接收 loaderData prop（类型自动从 loader 推导）
 */
export default function Posts({ loaderData }: Route.ComponentProps) {
  const { posts } = loaderData
  return (
    <div>
      <h1>Posts</h1>
      <ul>
        {posts.map(p => (
          <li key={p.id}>{p.title}</li>
        ))}
      </ul>
    </div>
  )
}
```

```ts
// app/routes.ts
import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('./routes/home.tsx'),
  route('posts', './routes/posts.tsx'),
] satisfies RouteConfig
```

**关键点**：

- `loader` **只在服务器执行**——返回值由 React Router 序列化（JSON 化）后注入 client 组件
- 组件用 `Route.ComponentProps` 拿到 `loaderData`——**类型从 loader 自动推导**（运行 `react-router typegen` 生成）
- 也可以用 `useLoaderData()` hook 拿数据——但 `Route.ComponentProps` 的 props 注入方式类型更精确
- 客户端 navigation（`<Link>`）时，React Router 通过 fetch 调服务端 `/posts.data` endpoint 拿新数据，不刷整页

### 动态路由参数

URL 模式中的 `:xxx` 占位符在 `params` 中可读：

```tsx
// app/routes/post-detail.tsx
import type { Route } from './+types/post-detail'

export async function loader({ params }: Route.LoaderArgs) {
  // params.id 自动类型化为 string（基于 routes.ts 中的 ":id" 模式）
  const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${params.id}`)
  if (!res.ok) {
    throw new Response('Post not found', { status: 404 })
  }
  const post = await res.json()
  return { post }
}

export default function PostDetail({ loaderData }: Route.ComponentProps) {
  const { post } = loaderData
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
    </article>
  )
}
```

```ts
// app/routes.ts
route('posts/:id', './routes/post-detail.tsx'),
```

**关键点**：

- `Route.LoaderArgs` 已包含 `params` / `request` / `context`——所有类型自动从 `routes.ts` 推导
- 抛出 `Response` 触发最近的 `ErrorBoundary`——404 / 500 等场景标准用法

## 第一个 Action（数据 mutation）

`action` 接收表单提交 / `useFetcher.submit()` / `useSubmit()` 调用，**只在服务器执行**：

```tsx
// app/routes/contact.tsx
import { Form, redirect } from 'react-router'
import type { Route } from './+types/contact'

/**
 * 接收表单提交，保存数据后重定向
 */
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const name = String(formData.get('name'))
  const message = String(formData.get('message'))

  // 简单校验
  if (!name || !message) {
    return { error: '姓名和留言均为必填' }
  }

  // 假装保存到数据库
  await saveContact({ name, message })

  // 重定向到成功页（loader/action 内用 redirect()）
  return redirect('/contact/thanks')
}

export default function Contact({ actionData }: Route.ComponentProps) {
  return (
    <Form method="post">
      <p>
        <label>
          姓名：
          <input name="name" type="text" required />
        </label>
      </p>
      <p>
        <label>
          留言：
          <textarea name="message" required />
        </label>
      </p>
      {actionData?.error && <p style={{ color: 'red' }}>{actionData.error}</p>}
      <button type="submit">提交</button>
    </Form>
  )
}

async function saveContact(_: { name: string, message: string }) {
  // 占位
}
```

**关键点**：

- `<Form method="post">` 是 React Router 提供的**增强 `<form>`**——拦截原生提交，调用同路由 `action`，**JS 禁用时也能工作**（progressive enhancement）
- `action` 返回值通过 `actionData` 注入组件 props（或用 `useActionData()` hook）
- `redirect(url)`：loader/action 内的标准重定向——返回 302 Response
- **action 成功后，所有同级 loader 自动 revalidate**——UI 保持与 server 状态一致

### `useNavigation` 显示提交状态

```tsx
import { Form, useNavigation } from 'react-router'

export default function ContactForm() {
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  return (
    <Form method="post">
      <input name="email" />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '提交中…' : '提交'}
      </button>
    </Form>
  )
}
```

### `useFetcher` 无导航并发 mutation

需要在列表中点删除、又不想 URL 改变？用 `useFetcher`：

```tsx
import { useFetcher, useLoaderData } from 'react-router'
import type { Route } from './+types/todos'

export async function loader() {
  return { todos: await db.todos.findAll() }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const id = formData.get('id') as string
  await db.todos.delete(id)
  return { ok: true }
}

export default function Todos() {
  const { todos } = useLoaderData<typeof loader>()

  return (
    <ul>
      {todos.map(todo => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  )
}

function TodoItem({ todo }: { todo: { id: string, title: string } }) {
  const fetcher = useFetcher()
  const isDeleting = fetcher.state !== 'idle'

  return (
    <li style={{ opacity: isDeleting ? 0.5 : 1 }}>
      {todo.title}
      <fetcher.Form method="post">
        <input type="hidden" name="id" value={todo.id} />
        <button type="submit" disabled={isDeleting}>
          {isDeleting ? '删除中…' : '删除'}
        </button>
      </fetcher.Form>
    </li>
  )
}

declare const db: any
```

**关键点**：

- `fetcher.Form` vs `Form`：`Form` **会改 URL**（导航 + 同步 loaders）；`fetcher.Form` **不改 URL**（同时多个 fetcher 互不影响）
- `fetcher.state`：`"idle"` / `"submitting"` / `"loading"`——比 `useNavigation.state` 更细粒度
- 操作完成后 React Router 同样自动 revalidate 当前页所有 loaders——UI 保持一致

## 第一个 Meta / Links / Headers

每个路由可导出 `meta` / `links` / `headers` 自定义文档元信息：

```tsx
// app/routes/about.tsx
import type { Route } from './+types/about'

export function meta(_: Route.MetaArgs) {
  return [
    { title: '关于 - My App' },
    { name: 'description', content: '这是一个 React Router 示例应用' },
    { property: 'og:title', content: '关于 - My App' },
  ]
}

export function links() {
  return [
    { rel: 'stylesheet', href: 'https://example.com/styles.css' },
    { rel: 'preload', href: '/banner.jpg', as: 'image' },
  ]
}

export function headers() {
  return {
    'Cache-Control': 'max-age=300, s-maxage=3600',
    'X-Custom-Header': 'value',
  }
}

export default function About() {
  return <h1>关于</h1>
}
```

**关键点**：

- `meta` 数组项渲染为 `<title>` / `<meta>`，由 `<Meta />`（root.tsx 中）聚合输出
- `links` 数组项渲染为 `<link>`，由 `<Links />` 聚合输出——可做 preload / prefetch
- `headers` 只在 SSR 时影响 HTTP 响应头，SPA 模式下无效

> **React 19 优势**：React 19 原生支持 `<title>` / `<meta>` / `<link>` 标签在组件 JSX 中自动 hoist 到 `<head>`，所以新写法可以**直接在 JSX 里写**，不用 `meta` / `links` 导出：
>
> ```tsx
> export default function About() {
>   return (
>     <>
>       <title>关于 - My App</title>
>       <meta name="description" content="示例应用" />
>       <h1>关于</h1>
>     </>
>   )
> }
> ```

## 第一个 ErrorBoundary

每个路由可导出 `ErrorBoundary` 捕获自己 / 子路由的错误：

```tsx
// app/routes/posts.tsx
import { isRouteErrorResponse } from 'react-router'
import type { Route } from './+types/posts'

export async function loader() {
  // 模拟错误
  throw new Response('Database connection failed', { status: 500 })
}

export default function Posts() {
  return <h1>Posts</h1>
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    // 抛出的 Response（throw new Response(...)）走这条分支
    return (
      <div>
        <h1>
          {error.status}
          {' '}
          {error.statusText}
        </h1>
        <p>{error.data}</p>
      </div>
    )
  }
  else if (error instanceof Error) {
    // 未捕获的 Error 走这条分支
    return (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
        {import.meta.env.DEV && <pre>{error.stack}</pre>}
      </div>
    )
  }
  return <h1>未知错误</h1>
}
```

**关键点**：

- `isRouteErrorResponse(error)` 区分「主动抛出的 Response」vs「意外的 Error」
- 子路由没有 ErrorBoundary 时，错误会 bubble 到最近的父级 ErrorBoundary
- Production 模式下 server 错误堆栈会自动 sanitize（防止泄露敏感信息）

## 从 Remix v2 迁移

如果你有 Remix v2 项目，迁移到 React Router v7 仅需 4 步：

### 1. 启用所有 Remix v2 future flags

先在 `remix.config.js` 启用所有 future flags 并修复警告：

```js
// remix.config.js
module.exports = {
  future: {
    v3_fetcherPersist: true,
    v3_lazyRouteDiscovery: true,
    v3_relativeSplatPath: true,
    v3_singleFetch: true,
    v3_throwAbortReason: true,
  },
}
```

### 2. 跑官方 codemod

```bash
npx codemod remix/2/react-router/upgrade
npm install
```

codemod 会自动：

- 改包名：`@remix-run/react` → `react-router`，`@remix-run/node` → `@react-router/node`，`@remix-run/dev` → `@react-router/dev`
- 改 import：`import { redirect } from '@remix-run/node'` → `import { redirect } from 'react-router'`
- 改 `package.json` 脚本：`remix dev` → `react-router dev`，`remix build` → `react-router build`
- 改 `vite.config.ts`：`vitePlugin as remix` → `reactRouter`
- 改 `entry.client.tsx`：`<RemixBrowser>` → `<HydratedRouter>`
- 改 `entry.server.tsx`：`<RemixServer>` → `<ServerRouter>`

### 3. 新建 `app/routes.ts` + `react-router.config.ts`

Remix v2 的文件路由约定保留，但需新建 `app/routes.ts` 显式导出：

```ts
// app/routes.ts
import { type RouteConfig } from '@react-router/dev/routes'
import { flatRoutes } from '@react-router/fs-routes'

export default flatRoutes() satisfies RouteConfig
```

```ts
// react-router.config.ts
import type { Config } from '@react-router/dev/config'

export default {
  ssr: true,
} satisfies Config
```

如果不再装 `@react-router/fs-routes`，可直接用 `route()` / `index()` 等 helper 手动配置。

### 4. 启用类型生成

`tsconfig.json`：

```json
{
  "include": [".react-router/types/**/*"],
  "compilerOptions": {
    "rootDirs": [".", "./.react-router/types"],
    "types": ["@react-router/node", "vite/client"]
  }
}
```

`.gitignore` 加 `.react-router/`。

完成后跑 `npm run dev`——绝大多数情况下零代码改动即可工作。

### codemod 不处理的边缘情况

- **自定义 Express server**：如果原本用 `remix-serve` 之外的自定义服务器（如 `@remix-run/express`），需手动迁移到 `@react-router/express`
- **Cloudflare Workers**：runtime 适配器从 `@remix-run/cloudflare` 改为 `@react-router/cloudflare`，部分 fetch 行为略有差异
- **AppLoadContext 类型扩展**：原本写在 `remix.env.d.ts`，迁移到 `app/load-context.ts` 并 `declare module 'react-router'`
- **MDX 等内容路由**：Remix v2 的 `mdx` 配置在 v7 暂未官方支持，需用第三方 Vite plugin

## 下一步

完成入门后，建议阅读：

- [指南](./guide-line.md)：完整的路由配置、loader/action 进阶、表单、Suspense streaming、Sessions / Cookies、Resource Routes、Type Safety、常见踩坑
- [参考](./reference.md)：所有 hooks / components / route module exports / `react-router.config.ts` 配置项的速查
