---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 TanStack Router v1.x（`@tanstack/react-router`）—— File-based 全规则 / 动态参数 / Code-based 拼装 / Type-safe Search Params / Loader + beforeLoad / Pending UI / 错误边界 / Code Splitting / Preloading / Context / 与 TanStack Query 协作 / Scroll Restoration / useBlocker / 测试 / 常见踩坑。

## 速查

- **动态参数**：文件名 `$param.tsx` 对应路径 `:param`，组件中 `Route.useParams().param`
- **Splat / Catch-all**：文件名 `$.tsx` 或 `posts.$.tsx` —— 匹配剩余路径，参数 `_splat`
- **Index 路由**：文件名 `index.tsx` 对应父路由的根路径
- **Pathless layout**：文件名 `_layout.tsx` —— 提供布局但不影响 URL（前缀 `_` 后部分作为 id）
- **Pathless group**：目录 `(group)/` —— 组织文件但不影响 URL
- **Route file alternatives**：`posts.tsx` 与 `posts/route.tsx` 与 `posts.route.tsx` 等价
- **Lazy file**：`posts.$postId.lazy.tsx` —— component 部分单独 chunk（loader 留在主 bundle）
- **Search Params 校验**：`validateSearch: zSchema`（Zod v4）或 `validateSearch: (search) => parsed`（手写）
- **读 search**：`useSearch({ from: '/path' })` 自动推导类型
- **更新 search**：`<Link search={(prev) => ({ ...prev, page: 2 })}>` 或 `navigate({ search: { page: 2 } })`
- **Loader**：`loader: async ({ params, deps, context }) => ...` 数据获取，组件 `Route.useLoaderData()`
- **beforeLoad**：路由进入前调用，返回值合并到 context，可 throw redirect 做认证
- **loaderDeps**：`loaderDeps: ({ search }) => ({ page: search.page })` 显式 search 依赖
- **缓存**：`staleTime` / `preloadStaleTime` / `gcTime` 控制 SWR 行为
- **Pending UI**：`pendingComponent` 路由级 / `defaultPendingMs` + `defaultPendingMinMs` 全局
- **错误边界**：`errorComponent` catch loader / 渲染错误
- **404**：`throw notFound()` + `notFoundComponent` 路由级 / `defaultNotFoundComponent` 全局
- **Preload**：`defaultPreload: 'intent'` hover / touchstart 预加载
- **Context**：`createRootRouteWithContext<{ queryClient }>()` + `beforeLoad` 链式注入
- **Redirect**：`throw redirect({ to: '/login', search: { redirect: location.href } })`
- **测试**：`createMemoryHistory()` + `RouterProvider`

## File-based 路由完整规则

TanStack Router 的 File-based routing 基于一套**精心设计的文件名约定**——掌握这套约定能用最少的代码表达最复杂的嵌套布局 + 动态路由。

### 默认目录结构

```
src/
└── routes/
    ├── __root.tsx              # 根路由（必需）
    ├── index.tsx               # /
    ├── about.tsx               # /about
    ├── posts.tsx               # /posts（layout 路由，含 children）
    ├── posts.index.tsx         # /posts（index）
    ├── posts.$postId.tsx       # /posts/:postId
    └── posts.$postId.edit.tsx  # /posts/:postId/edit
```

或用嵌套目录（等价）：

```
src/
└── routes/
    ├── __root.tsx
    ├── index.tsx
    ├── about.tsx
    └── posts/
        ├── route.tsx           # /posts（layout）
        ├── index.tsx           # /posts（index）
        ├── $postId/
        │   ├── route.tsx       # /posts/:postId（layout）
        │   ├── index.tsx       # /posts/:postId（index）
        │   └── edit.tsx        # /posts/:postId/edit
        └── new.tsx             # /posts/new
```

### 文件命名约定全表

| 文件名 / 目录 | URL | 用途 |
|---|---|---|
| `__root.tsx` | （根路由） | 整棵路由树的根（HTML 壳 / 全局布局）—— **必需** |
| `index.tsx` | `/` | 父路由的 index（默认子路由） |
| `about.tsx` | `/about` | 静态路径 |
| `posts.tsx` | `/posts` | layout 路由（含子路由） |
| `posts.index.tsx` | `/posts` | 父 `posts` 的 index |
| `posts.$postId.tsx` | `/posts/:postId` | 动态段（`$param` 语法） |
| `posts.$postId.edit.tsx` | `/posts/:postId/edit` | 嵌套动态 |
| `posts/route.tsx` | `/posts` | 等价于 `posts.tsx`（目录写法） |
| `posts/index.tsx` | `/posts` | 等价于 `posts.index.tsx` |
| `posts/$postId.tsx` | `/posts/:postId` | 等价于 `posts.$postId.tsx` |
| `_layout.tsx` | （pathless layout） | 提供布局但不出现在 URL |
| `_layout.dashboard.tsx` | `/dashboard` | 在 `_layout` 下 |
| `(group)/` 目录 | （pathless group） | 组织文件不影响 URL |
| `files.$.tsx` | `/files/*` | Splat / catch-all（参数 `_splat`） |
| `posts.$postId.lazy.tsx` | `/posts/:postId` | Lazy 加载组件部分 |
| `-component.tsx` | （非路由文件） | 前缀 `-` 排除（不被识别为路由） |

### 动态路径参数

文件名中 `$` 前缀表示动态段——对应 React Router 的 `:param`、Next.js 的 `[param]`：

```tsx
// src/routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    // params.postId 自动推导为 string
    return fetchPost(params.postId)
  },
  component: PostDetail,
})

function PostDetail() {
  const { postId } = Route.useParams()
  const post = Route.useLoaderData()
  return (
    <div>
      <h1>文章 {postId}</h1>
      <p>{post.title}</p>
    </div>
  )
}
```

**多个动态段**：

```
src/routes/users.$userId.posts.$postId.tsx
↓
URL: /users/:userId/posts/:postId
```

```tsx
export const Route = createFileRoute('/users/$userId/posts/$postId')({
  loader: ({ params }) => {
    // params.userId + params.postId 都是 string
    return fetchUserPost(params.userId, params.postId)
  },
})
```

### Splat / Catch-all 路由

文件名 `$.tsx` 或 `xxx.$.tsx`——匹配剩余所有路径段，参数挂在 `_splat`：

```tsx
// src/routes/files/$.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/files/$')({
  component: FileBrowser,
})

function FileBrowser() {
  const { _splat } = Route.useParams()
  // /files/docs/2024/report.pdf → _splat = 'docs/2024/report.pdf'
  return <div>路径：{_splat}</div>
}
```

**典型场景**：文档浏览器、文件管理器、404 fallback。

### Index 路由

父路由有 children 时，需要一个 index 路由对应「访问父路径本身」的情况：

```
src/routes/
├── posts.tsx          # /posts 的 layout（含 <Outlet />）
├── posts.index.tsx    # /posts 的 index 路由
└── posts.new.tsx      # /posts/new
```

```tsx
// posts.tsx —— layout
export const Route = createFileRoute('/posts')({
  component: () => (
    <div>
      <h1>文章</h1>
      <Outlet />
    </div>
  ),
})

// posts.index.tsx —— /posts 的内容
export const Route = createFileRoute('/posts/')({
  component: () => <p>请选择一篇文章。</p>,
})
```

> **注意**：`createFileRoute('/posts/')` 末尾的 `/` 区分了 layout (`/posts`) 与 index (`/posts/`)——这是 TSR 1.x 文件路径的细节。

### Pathless Layout（无路径布局）

文件名前缀 `_`（如 `_layout.tsx`）—— 提供布局但**不在 URL 中出现**，用于把多个路由组织到同一个布局下：

```
src/routes/
├── __root.tsx
├── _dashboard.tsx            # 不影响 URL
├── _dashboard.overview.tsx   # /overview
├── _dashboard.users.tsx      # /users
├── _public.tsx               # 不影响 URL
├── _public.login.tsx         # /login
└── _public.register.tsx      # /register
```

```tsx
// _dashboard.tsx —— 共享布局（侧边栏 + 顶栏）
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  return (
    <div className="flex">
      <aside className="w-64 bg-gray-100 p-4">
        <Link to="/overview">概览</Link>
        <Link to="/users">用户</Link>
      </aside>
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  )
}
```

```tsx
// _dashboard.overview.tsx —— /overview 路径，自动套上 _dashboard 布局
export const Route = createFileRoute('/_dashboard/overview')({
  component: () => <h1>概览</h1>,
})
```

**含义**：访问 `/overview` 时，渲染链是 `__root` → `_dashboard` → `overview`，但 URL 里没有 `_dashboard` 这一段。

> 用法对比：React Router v7 用 `<Route>` 嵌套实现、Next.js App Router 用 `(group)` 实现——TSR 用 `_` 前缀实现同样的「pathless layout」概念。

### Pathless Group（无路径分组）

目录 `(group)/`（带括号）—— 仅用于**文件组织**，不影响路由也不提供布局：

```
src/routes/
├── __root.tsx
├── index.tsx
├── (app)/
│   ├── dashboard.tsx       # /dashboard
│   ├── settings.tsx        # /settings
│   └── users.tsx           # /users
└── (auth)/
    ├── login.tsx           # /login
    └── register.tsx        # /register
```

**含义**：`(app)` / `(auth)` 目录纯粹是文件系统层面的分组——URL 中不会出现 `(app)/`，也不会引入新的布局层级。

> **vs pathless layout**：`_layout.tsx` 是文件（提供布局）、`(group)/` 是目录（仅分组）——两者目的不同。

### Route 文件的等价写法

同一个路由可以用**多种文件名表达**——TSR 提供了灵活性：

| 写法 1 | 写法 2 | 写法 3 | URL |
|---|---|---|---|
| `posts.tsx` | `posts/route.tsx` | `posts.route.tsx` | `/posts`（layout） |
| `posts.index.tsx` | `posts/index.tsx` | — | `/posts`（index） |
| `posts.$postId.tsx` | `posts/$postId.tsx` | `posts/$postId/route.tsx` | `/posts/:postId` |

**选哪个？**

- **小项目**：用点分隔（`posts.$postId.tsx`）——文件少、扁平
- **大项目**：用目录嵌套（`posts/$postId/route.tsx`）——按 URL 层级分组、易找

### Lazy 文件（`.lazy.tsx`）

`.lazy.tsx` 后缀——把 component 部分单独分包，loader / beforeLoad 仍在主 bundle：

```tsx
// src/routes/posts/$postId.tsx —— 主文件（含 loader）
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => fetchPost(params.postId),
  // 不写 component
})
```

```tsx
// src/routes/posts/$postId.lazy.tsx —— 懒加载组件
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/posts/$postId')({
  component: PostDetail,
})

function PostDetail() {
  const post = Route.useLoaderData()
  return <article>{post.title}</article>
}
```

**意义**：

- loader 在主 bundle → 数据并行加载（无需等组件 chunk）
- 组件单独 chunk → 减小初始 bundle 体积
- 这是 TSR 实现 **「数据先行 + UI 后到」** 的关键

> **`autoCodeSplitting: true`**（Vite 插件默认）下，TSR 会**自动**做这件事——你不需要手动写 `.lazy.tsx`。

## Code-based 路由完整

如果不用文件路由，可以用 `createRootRoute` + `createRoute` 手动拼装。

### 基础拼装

```tsx
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router'

// 1. 根路由
const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

// 2. 子路由
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <h1>首页</h1>,
})

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'about',
  component: () => <h1>关于</h1>,
})

// 3. 嵌套
const postsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'posts',
})

const postsIndexRoute = createRoute({
  getParentRoute: () => postsRoute,
  path: '/',
  component: () => <p>选择文章</p>,
})

const postRoute = createRoute({
  getParentRoute: () => postsRoute,
  path: '$postId',
  component: function Post() {
    const { postId } = postRoute.useParams()
    return <p>文章 {postId}</p>
  },
})

// 4. 拼装路由树（addChildren）
const routeTree = rootRoute.addChildren([
  indexRoute,
  aboutRoute,
  postsRoute.addChildren([postsIndexRoute, postRoute]),
])

// 5. 创建 router
export const router = createRouter({ routeTree })
```

### Pathless Layout（Code-based）

Code-based 中 pathless layout 用 `id` 替代 `path`：

```tsx
const pathlessLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'pathlessLayout', // 注意：id 而非 path
  component: PathlessLayout,
})

const routeARoute = createRoute({
  getParentRoute: () => pathlessLayoutRoute,
  path: 'route-a',
})

const routeBRoute = createRoute({
  getParentRoute: () => pathlessLayoutRoute,
  path: 'route-b',
})

const routeTree = rootRoute.addChildren([
  pathlessLayoutRoute.addChildren([routeARoute, routeBRoute]),
])
```

**含义**：访问 `/route-a` 时渲染链是 `root` → `pathlessLayout` → `routeA`，URL 里没有 `pathlessLayout`。

### Splat 路由（Code-based）

```tsx
const filesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'files/$', // 注意：path 是 'files/$'
  component: function Files() {
    const { _splat } = filesRoute.useParams()
    return <div>路径：{_splat}</div>
  },
})
```

## Type-safe Search Params

**Search params 是 TanStack Router 的招牌特性**——URL 中的 `?page=2&sort=newest` 被当作**结构化状态**而非纯字符串，自动 JSON 序列化 + 校验 + 类型推导。

### 基础用法

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const productSearchSchema = z.object({
  page: z.number().catch(1),
  filter: z.string().catch(''),
  sort: z.enum(['newest', 'oldest', 'price']).catch('newest'),
})

export const Route = createFileRoute('/shop/products')({
  validateSearch: productSearchSchema,
  component: ProductList,
})

function ProductList() {
  // 自动推导：{ page: number, filter: string, sort: 'newest' | 'oldest' | 'price' }
  const search = Route.useSearch()

  return (
    <div>
      <p>页码：{search.page}</p>
      <p>筛选：{search.filter}</p>
      <p>排序：{search.sort}</p>
    </div>
  )
}
```

**要点**：

- `validateSearch` 接受任何 validator 函数（输入 `Record<string, unknown>`，输出强类型对象）
- Zod v4 可直接传 schema（自动适配）
- `Route.useSearch()` 返回值类型从 schema 自动推导

### 使用 Zod v4（直接传 schema）

```tsx
import { z } from 'zod' // v4+

const schema = z.object({
  page: z.number().default(1),
  q: z.string().default(''),
})

export const Route = createFileRoute('/shop/products')({
  // Zod v4 支持直接传 schema，无需适配器
  validateSearch: schema,
})
```

### 使用 Zod v3 或其它（需要 .catch / .parse）

```tsx
import { z } from 'zod' // v3

const schema = z.object({
  page: z.number().catch(1),  // 校验失败时回退
  q: z.string().catch(''),
})

export const Route = createFileRoute('/shop/products')({
  validateSearch: (search) => schema.parse(search),
})
```

**`.catch()` vs `.parse()`**：

- `.catch(fallback)`：校验失败时**用 fallback 而不报错**——用户体验最好（拼错 URL 不会白屏）
- `.parse()`：校验失败时**抛错**——交给 `errorComponent` 处理

### 自定义 validator（不用 Zod）

```tsx
export const Route = createFileRoute('/shop/products')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      page: typeof search.page === 'number' ? search.page : 1,
      filter: typeof search.filter === 'string' ? search.filter : '',
    }
  },
})
```

### 更新 Search Params

**用 `<Link>` 的 `search` prop（推荐）**：

```tsx
// 直接传新值
<Link to="/shop/products" search={{ page: 2, filter: '', sort: 'newest' }}>
  第 2 页
</Link>

// 函数式（基于上一次 search）
<Link
  from={Route.fullPath}
  search={(prev) => ({ ...prev, page: prev.page + 1 })}
>
  下一页
</Link>
```

**用 `useNavigate`**：

```tsx
const navigate = useNavigate()
navigate({
  to: '/shop/products',
  search: (prev) => ({ ...prev, page: prev.page + 1 }),
})
```

### Search 作为应用状态

把 Search Params 当 Redux/Pinia 来用——分页 / 筛选 / 排序 / 标签切换全部存 URL：

```tsx
// 表格组件读 search
function ProductTable() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  return (
    <table>
      <thead>
        <tr>
          <th onClick={() => navigate({
            search: (prev) => ({
              ...prev,
              sort: prev.sort === 'newest' ? 'oldest' : 'newest',
            }),
          })}>
            日期 {search.sort === 'newest' ? '↓' : '↑'}
          </th>
        </tr>
      </thead>
      ...
    </table>
  )
}
```

**优点**：

- **可分享**：URL 包含完整状态，复制粘贴就能复现
- **可后退**：浏览器 back 按钮自动回到上一次的筛选状态
- **可深链**：直接访问 `?page=3&sort=price` 就能落到第 3 页
- **无需 Pinia / Zustand / Redux**——状态在 URL 即可

## Loader 数据获取

**Loader 是 TanStack Router 的核心数据获取机制**——路由进入前并行加载、Suspense / Pending UI 自动协调、SWR 缓存内置。

### 基础 Loader

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const res = await fetch(`/api/posts/${params.postId}`)
    return res.json()
  },
  component: PostDetail,
})

function PostDetail() {
  // 自动推导：post 类型 = loader 返回值
  const post = Route.useLoaderData()
  return <article>{post.title}</article>
}
```

**Loader 参数**：

| 字段 | 类型 | 说明 |
|---|---|---|
| `params` | object | 路径参数（自动推导） |
| `deps` | object | `loaderDeps` 返回值（search 等） |
| `context` | object | Route Context（来自 root + beforeLoad） |
| `location` | object | 当前 location |
| `abortController` | AbortController | 用于取消请求 |
| `preload` | boolean | 当前是否预加载调用 |
| `cause` | string | 触发原因（`'enter'` / `'stay'` / `'preload'`） |

### `useLoaderData` 完整签名

```tsx
// 方式 1：从 Route.useLoaderData()（最简单）
const data = Route.useLoaderData()

// 方式 2：全局 hook + from
import { useLoaderData } from '@tanstack/react-router'
const data = useLoaderData({ from: '/posts/$postId' })

// 方式 3：select 优化（避免不必要的重渲染）
const title = Route.useLoaderData({ select: (data) => data.title })
```

### beforeLoad（认证 + Context 注入）

`beforeLoad` 在 loader 之前调用——**典型用法是认证 + 注入 context**：

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          // 登录后重定向回来
          redirect: location.href,
        },
      })
    }
    // 返回值合并到 context，传给子路由和 loader
    return {
      username: context.auth.user.name,
    }
  },
  loader: async ({ context }) => {
    // context.username 已被 beforeLoad 注入
    return fetchDashboardData(context.username)
  },
})
```

**`beforeLoad` 参数**：

| 字段 | 类型 | 说明 |
|---|---|---|
| `params` | object | 路径参数 |
| `search` | object | search params（已经过 validateSearch） |
| `context` | object | 父路由 context |
| `location` | object | 当前 location |
| `navigate` | function | 编程式导航 |
| `cause` | string | 触发原因 |

**beforeLoad vs loader**：

- `beforeLoad` 串行：父 → 子 → 子子（用于 context 链 + 守卫）
- `loader` 并行：所有路由的 loader 同时跑（性能优势）

### loaderDeps（依赖追踪）

`loaderDeps` 显式声明 loader 依赖哪些 search 字段——只有这些字段变化时才重新调用 loader：

```tsx
export const Route = createFileRoute('/posts')({
  validateSearch: z.object({
    page: z.number().catch(1),
    pageSize: z.number().catch(20),
    filter: z.string().catch(''),
  }),

  // 只关心 page 和 pageSize（filter 变化不重新加载）
  loaderDeps: ({ search }) => ({
    page: search.page,
    pageSize: search.pageSize,
  }),

  loader: async ({ deps }) => {
    return fetchPosts({ page: deps.page, pageSize: deps.pageSize })
  },
})
```

**反例（不要这么写）**：

```tsx
// ❌ 把整个 search 当 deps —— 任何 search 字段变化都重新加载
loaderDeps: ({ search }) => search,
loader: ({ deps }) => fetchPosts({ page: deps.page }),
```

```tsx
// ✅ 只把真正用到的字段当 deps
loaderDeps: ({ search }) => ({ page: search.page }),
loader: ({ deps }) => fetchPosts({ page: deps.page }),
```

### Stale-While-Revalidate 缓存

Loader 数据带 `staleTime` / `preloadStaleTime` / `gcTime`——SWR 行为内置：

```tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: ({ params }) => fetchPost(params.postId),

  // 5 分钟内视为新鲜数据，不重新加载
  staleTime: 5 * 60 * 1000,

  // 预加载时的 staleTime（默认 30s）
  preloadStaleTime: 30 * 1000,

  // 10 分钟内保留在内存（导航离开后）
  gcTime: 10 * 60 * 1000,
})
```

**全局默认**：

```tsx
const router = createRouter({
  routeTree,
  defaultStaleTime: 5000,      // 默认 0（立即过期）
  defaultPreloadStaleTime: 30000, // 默认 30s
  defaultGcTime: 5 * 60 * 1000,   // 默认 5min
})
```

**stale 数据行为**：

- 数据未过期（< staleTime）→ 直接返回缓存、不重新加载
- 数据过期（> staleTime）→ 返回旧数据 + 后台重新加载（SWR）
- 配 `staleReloadMode: 'blocking'` → 过期时阻塞导航等新数据

```tsx
loader: {
  handler: () => fetchPosts(),
  staleReloadMode: 'blocking', // 强制阻塞
},
```

### shouldReload（精细化重载控制）

`shouldReload` 函数返回布尔值/对象，决定是否触发 loader：

```tsx
export const Route = createFileRoute('/posts')({
  loader: () => fetchPosts(),
  shouldReload: ({ cause }) => {
    // 只在首次进入和路径变化时重新加载，stay 时不重新
    return cause !== 'stay'
  },
})
```

## Pending UI（加载状态）

Pending UI 处理 loader 还没完成时的展示——TSR 提供**双阈值**避免「加载状态闪烁」问题。

### 路由级 pendingComponent

```tsx
export const Route = createFileRoute('/posts')({
  loader: () => fetchPosts(),
  pendingComponent: () => <div className="p-4">加载中...</div>,
  component: PostList,
})
```

### 全局 pendingComponent + 双阈值

```tsx
const router = createRouter({
  routeTree,
  defaultPendingComponent: () => <Spinner />,
  defaultPendingMs: 1000,    // 加载 > 1s 才显示 pending（避免闪烁）
  defaultPendingMinMs: 500,  // 一旦显示，至少展示 500ms（避免闪一下又消失）
})
```

**两个阈值的含义**：

- `defaultPendingMs` **触发阈值**——loader < 1s 完成时直接展示新内容，不出现加载态
- `defaultPendingMinMs` **最短时长**——一旦展示加载态，至少保持 500ms 避免用户感觉到「闪一下」

这是 TanStack Router 在用户体验上的精细之处——比 `<Suspense>` 简单的 fallback 强很多。

### 与 React Suspense 集成

如果 loader 内部用了 `useSuspenseQuery` 或其它 Suspense API，Pending UI 会自动协调：

```tsx
export const Route = createFileRoute('/posts')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(postsQueryOptions),
  pendingComponent: () => <Spinner />,
  component: () => {
    // useSuspenseQuery 会触发 Suspense
    const { data } = useSuspenseQuery(postsQueryOptions)
    return <PostList posts={data} />
  },
})
```

## 错误边界

### `errorComponent`（路由级错误边界）

捕获 loader / beforeLoad / 组件渲染中的错误：

```tsx
import { createFileRoute, ErrorComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await fetchPost(params.postId)
    if (!post) throw new Error('文章不存在')
    return post
  },
  errorComponent: ({ error }) => (
    <div className="p-4 text-red-500">
      <h2>加载失败</h2>
      <p>{error.message}</p>
    </div>
  ),
})
```

**或用默认 `<ErrorComponent>`**：

```tsx
import { ErrorComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/posts')({
  errorComponent: ErrorComponent, // 提供默认 UI
})
```

**全局**：

```tsx
const router = createRouter({
  routeTree,
  defaultErrorComponent: ({ error }) => (
    <div>全局错误：{error.message}</div>
  ),
})
```

### `notFoundComponent` + `throw notFound()`

404 是错误的特例——TSR 有专门的 API：

```tsx
import { createFileRoute, notFound } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await getPost(params.postId)
    if (!post) {
      throw notFound() // 触发 notFoundComponent
    }
    return post
  },
  notFoundComponent: () => (
    <div className="p-4">
      <h2>文章未找到</h2>
      <p>抱歉，这篇文章不存在或已被删除。</p>
    </div>
  ),
})
```

**指定 notFound 的处理路由**：

```tsx
// 让某个父路由处理 not found，而不是当前路由
throw notFound({ routeId: '/_pathlessLayout' })
```

**全局默认**：

```tsx
const router = createRouter({
  routeTree,
  defaultNotFoundComponent: () => (
    <div>
      <h1>404</h1>
      <Link to="/">回到首页</Link>
    </div>
  ),
})
```

> **注意**：`defaultNotFoundComponent` 只对**有子路由的路由**生效——叶子路由还是用自己的 `notFoundComponent`。

### `redirect()` 重定向

`beforeLoad` / `loader` 中 throw redirect 触发跳转：

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    if (!isAuthenticated()) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
  },
})
```

**`redirect` 选项**：

| 字段 | 类型 | 说明 |
|---|---|---|
| `to` | 路径 | 目标路径 |
| `params` | object | 路径参数 |
| `search` | object | search params |
| `hash` | string | URL hash |
| `replace` | boolean | replace 而非 push |
| `code` | number | HTTP status code（SSR 用） |
| `throw` | boolean | 是否抛错（默认 true） |

## Code Splitting

### 自动分包（默认）

Vite 插件 `autoCodeSplitting: true`（默认开启）下，TSR 会**自动**把路由组件单独分包：

```ts
// vite.config.ts
tanstackRouter({
  target: 'react',
  autoCodeSplitting: true, // 默认 true
})
```

- loader / beforeLoad / errorComponent 留在主 bundle（数据需要先加载）
- component 单独 chunk（lazy 加载）
- 体积优化效果显著（首屏只下载首页 chunk）

### 手动分包（`.lazy.tsx`）

不想自动？用 `createLazyFileRoute` 显式控制：

```tsx
// src/routes/posts/$postId.tsx —— 主文件（数据）
export const Route = createFileRoute('/posts/$postId')({
  loader: ({ params }) => fetchPost(params.postId),
  // 不写 component
})

// src/routes/posts/$postId.lazy.tsx —— 懒加载组件
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/posts/$postId')({
  component: PostDetail,
})
```

**Code-based 等价**：`.lazy()` 方法

```tsx
const postRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/posts/$postId',
  loader: ({ params }) => fetchPost(params.postId),
}).lazy(() => import('./posts.lazy').then((d) => d.Route))
```

## Preloading（预加载）

### 全局策略

```tsx
const router = createRouter({
  routeTree,
  defaultPreload: 'intent', // 推荐
})
```

**策略选项**：

| 策略 | 触发 | 适合 |
|---|---|---|
| `false` | 不预加载 | 默认（手动） |
| `'intent'` | hover / focus / touchstart | **推荐**——零成本提升体验 |
| `'viewport'` | 进入视口（IntersectionObserver） | 长列表、卡片网格 |
| `'render'` | 渲染时立即预加载 | 高优先级的关键路径 |

### 链接级覆盖

```tsx
<Link to="/posts" preload="viewport">列表（视口预加载）</Link>
<Link to="/expensive" preload={false}>不预加载</Link>
```

### 预加载延迟

```tsx
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadDelay: 50, // hover 50ms 后才预加载（避免手滑触发）
})
```

## Route Context

Context 是 TSR 的**类型安全状态注入机制**——比 React Context 更强大、配合 beforeLoad 链式注入。

### `createRootRouteWithContext`

```tsx
import {
  createRootRouteWithContext,
  createRouter,
} from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'

// 声明 context 类型
interface MyRouterContext {
  queryClient: QueryClient
  auth: AuthState
}

// 根路由
const rootRoute = createRootRouteWithContext<MyRouterContext>()({
  component: RootLayout,
})

// 创建 router 时注入
const queryClient = new QueryClient()
const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: undefined!, // 占位，运行时注入
  },
})

// 渲染时通过 RouterProvider context prop 注入运行时值
function App() {
  const auth = useAuth()
  return (
    <RouterProvider
      router={router}
      context={{ auth }}
    />
  )
}
```

### `beforeLoad` 链式注入

`beforeLoad` 返回值会**合并到子路由的 context**：

```tsx
// /_authenticated 路由
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
    return {
      user: context.auth.user, // 注入到子路由
    }
  },
})

// /_authenticated/dashboard 路由
export const Route = createFileRoute('/_authenticated/dashboard')({
  loader: ({ context }) => {
    // context 包含 root 的 { queryClient, auth } + _authenticated 的 { user }
    return fetchDashboard(context.user.id)
  },
})
```

### `useRouteContext`

```tsx
import { useRouteContext } from '@tanstack/react-router'

function MyComponent() {
  const { user, queryClient } = useRouteContext({ from: '/_authenticated/dashboard' })
  // ...
}
```

## 与 TanStack Query 协作

最佳实践——TSR 负责路由 / Loader 触发预取，TanStack Query 负责缓存 / mutations / 乐观更新。

### 集成步骤

```tsx
// 1. 安装
// pnpm add @tanstack/react-query

// 2. 创建 QueryClient + 注入 context
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'

interface MyRouterContext {
  queryClient: QueryClient
}

const rootRoute = createRootRouteWithContext<MyRouterContext>()({
  component: () => <Outlet />,
})

const queryClient = new QueryClient()
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0, // 让 Query 控制缓存，路由不再单独缓存
})

// 3. 应用入口
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
```

### Loader 预取 + 组件读取

```tsx
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

const postQueryOptions = (postId: string) =>
  queryOptions({
    queryKey: ['post', postId],
    queryFn: () => fetchPost(postId),
  })

export const Route = createFileRoute('/posts/$postId')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(postQueryOptions(params.postId)),
  component: PostDetail,
})

function PostDetail() {
  const { postId } = Route.useParams()
  // 数据已经 ensureQueryData 预取过，立即返回
  const { data: post } = useSuspenseQuery(postQueryOptions(postId))
  return <article>{post.title}</article>
}
```

**优势**：

- **SSR 友好**：`ensureQueryData` 在服务端预取、客户端 hydrate 时复用
- **导航预取**：`<Link preload="intent">` hover 时也调 `ensureQueryData`，几乎零延迟
- **Mutations**：用 TanStack Query 的 `useMutation` 写改动，自动失效 + 重新预取
- **乐观更新**：Query 的 `setQueryData` 实现乐观 UI

### Mutation 后失效缓存

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

function EditPostForm({ postId }: { postId: string }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: (data: PostData) => updatePost(postId, data),
    onSuccess: () => {
      // 失效缓存 → 下次访问自动重新加载
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
      navigate({ to: '/posts/$postId', params: { postId } })
    },
  })

  return <form onSubmit={(e) => mutation.mutate(...)}>...</form>
}
```

## History Types

TSR 支持三种 history 实现：

### Browser History（HTML5，默认）

```tsx
import { createBrowserHistory, createRouter } from '@tanstack/react-router'

const router = createRouter({
  routeTree,
  // 默认就是 browser history，可省略
  history: createBrowserHistory(),
})
```

- URL 形如 `https://example.com/posts/1`
- 需要服务端 fallback 处理 SPA 路由（nginx try_files / vercel rewrites）

### Hash History

```tsx
import { createHashHistory } from '@tanstack/react-router'

const router = createRouter({
  routeTree,
  history: createHashHistory(),
})
```

- URL 形如 `https://example.com/#/posts/1`
- 零服务端配置（hash 不发到服务器）
- SEO 差

### Memory History（测试 / SSR）

```tsx
import { createMemoryHistory } from '@tanstack/react-router'

const memoryHistory = createMemoryHistory({
  initialEntries: ['/posts/1'],
})

const router = createRouter({
  routeTree,
  history: memoryHistory,
})
```

- 路由状态在内存（不修改浏览器 URL）
- 用于**单元测试 / Storybook / SSR**

## Scroll Restoration

启用浏览器原生的滚动恢复 + 路由级滚动管理：

```tsx
const router = createRouter({
  routeTree,
  scrollRestoration: true,
})
```

- 浏览器 back/forward 时**自动恢复**之前的滚动位置
- 新导航时**滚到顶部**（除非 `<Link resetScroll={false}>`）

### 滚动行为

```tsx
const router = createRouter({
  routeTree,
  scrollRestoration: true,
  scrollRestorationBehavior: 'instant', // 'smooth' | 'instant' | 'auto'
})
```

### 锚点滚动

`<Link>` 支持 `hash` prop，导航时滚到锚点：

```tsx
<Link to="/docs" hash="installation">安装</Link>
// → /docs#installation，滚到 id="installation" 的元素
```

## `useBlocker`（离开拦截）

在表单未保存时拦截路由跳转：

```tsx
import { useBlocker } from '@tanstack/react-router'

function EditForm() {
  const [isDirty, setIsDirty] = useState(false)

  useBlocker({
    shouldBlockFn: () => {
      if (isDirty) {
        return !window.confirm('未保存的更改将丢失，确定离开吗？')
      }
      return false
    },
    enableBeforeUnload: true, // 浏览器关闭时也拦截
  })

  return <form>...</form>
}
```

**带 resolver 模式**（控制 modal 显示）：

```tsx
const blocker = useBlocker({
  shouldBlockFn: () => isDirty,
  withResolver: true,
})

return (
  <>
    <form>...</form>
    {blocker.status === 'blocked' && (
      <Modal>
        <p>确定离开吗？</p>
        <button onClick={blocker.proceed}>离开</button>
        <button onClick={blocker.reset}>取消</button>
      </Modal>
    )}
  </>
)
```

## 测试

### 单元测试（vitest + React Testing Library）

用 `createMemoryHistory` 隔离测试环境：

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  createRouter,
  createRootRoute,
  createRoute,
  createMemoryHistory,
  RouterProvider,
} from '@tanstack/react-router'

describe('PostDetail', () => {
  it('显示 postId', async () => {
    // 构造测试 router
    const rootRoute = createRootRoute()
    const postRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/posts/$postId',
      component: function Post() {
        const { postId } = postRoute.useParams()
        return <div>Post: {postId}</div>
      },
    })

    const router = createRouter({
      routeTree: rootRoute.addChildren([postRoute]),
      history: createMemoryHistory({ initialEntries: ['/posts/42'] }),
    })

    render(<RouterProvider router={router} />)

    expect(await screen.findByText('Post: 42')).toBeInTheDocument()
  })
})
```

### Mock loader

```tsx
const postRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/posts/$postId',
  loader: () => Promise.resolve({ id: '42', title: 'Test' }), // 直接 mock
  component: PostDetail,
})
```

### E2E（Cypress / Playwright）

E2E 测试与普通 SPA 无差异——配 base URL + 等待元素渲染即可。

## 常见踩坑

### 1. Loader 返回值类型不推导

**现象**：`Route.useLoaderData()` 返回 `unknown`。

**原因**：loader 没有显式返回类型或缺 `await`。

**修复**：

```tsx
// ❌ 没返回
loader: async ({ params }) => {
  await fetchPost(params.postId) // 没 return
},

// ✅ 显式返回
loader: async ({ params }) => {
  return await fetchPost(params.postId)
},
```

### 2. `useSearch` 没传 `from`

**现象**：`useSearch()` 返回 `Partial<FullSearchSchema>`，类型不准。

**修复**：

```tsx
// ❌
const search = useSearch() // 类型 = 整个路由树的 search 联合

// ✅ 指定 from
const search = useSearch({ from: '/shop/products' })
```

或用 `Route.useSearch()` 自动绑定。

### 3. Pathless layout 路径冲突

**错误**：`_dashboard.users.tsx` 和 `users.tsx` 同时存在 → URL `/users` 不知道匹配哪个。

**修复**：要么删掉一个，要么用 `(group)/` 目录分组（不影响 URL）。

### 4. `beforeLoad` 抛错没 catch

**现象**：beforeLoad throw Error 时白屏。

**修复**：用 `errorComponent` 处理：

```tsx
export const Route = createFileRoute('/protected')({
  beforeLoad: () => {
    if (!auth) throw new Error('未登录')
  },
  errorComponent: ({ error }) => <div>{error.message}</div>,
})
```

或在 beforeLoad 中改用 `throw redirect(...)`（不当作错误而是跳转）。

### 5. loader 中调用 React Hook

**错误**：

```tsx
// ❌ loader 不在 React 渲染中，不能用 hook
loader: () => {
  const auth = useAuth() // 报错
}
```

**修复**：通过 context 注入，或在组件层调用：

```tsx
// ✅ 通过 context
loader: ({ context }) => {
  return fetchData(context.auth.token)
}
```

### 6. `defaultPreloadStaleTime` 与 Query 冲突

**现象**：与 TanStack Query 整合时，loader 数据被 router 缓存，Query 失效不生效。

**修复**：让 Query 完全控制缓存：

```tsx
const router = createRouter({
  routeTree,
  defaultPreloadStaleTime: 0, // 不让 router 缓存
})
```

### 7. 路径参数被当作 number

**现象**：`params.postId` 类型是 string，但你期望 number。

**修复**：手动 parse：

```tsx
const postId = Number(Route.useParams().postId)
```

或在 loader 中转换：

```tsx
loader: ({ params }) => {
  const id = Number(params.postId)
  if (Number.isNaN(id)) throw notFound()
  return fetchPost(id)
}
```

### 8. `routeTree.gen.ts` 被 Git diff 污染

**现象**：每次 dev 启动都生成新版本，PR diff 一堆变化。

**修复**：加入 `.gitignore`，CI 启动时让插件重新生成：

```gitignore
src/routeTree.gen.ts
```

### 9. Devtools 出现在生产

**修复**：

```tsx
{import.meta.env.DEV && <TanStackRouterDevtools />}
```

### 10. `<Link to>` 类型推导丢失

**现象**：`<Link to>` 的 `to` 显示为 `string`，没有补全。

**原因**：忘了 `declare module '@tanstack/react-router' { interface Register { ... } }`。

**修复**：

```tsx
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
```

确保这段代码在**任何** `<Link>` 使用之前执行——通常放在 `main.tsx` 顶部。

## 文件路由 vs 代码路由：怎么选

### 用 File-based 当...

- 项目从零开始，能配 Vite 插件
- 团队熟悉 Next.js / Remix 的文件路由心智
- 想要最少代码 / 最强约定
- 路由结构相对稳定（不需要运行时增删）

### 用 Code-based 当...

- 不想用 Vite 插件（用 Webpack / esbuild 等）
- 需要运行时动态增删路由
- 想要极致控制（不受文件名约定限制）
- 在大型 monorepo 中复用路由模块

> **混用**：TSR 允许同时使用——`createRoute` 创建的路由也可以加入 `rootRoute.addChildren([...])`。文件路由生成的 `routeTree.gen.ts` 实际上就是 code-based 输出。

## 与 React Router v7 对比迁移

如果从 React Router v7 迁移过来，心智差异：

| 概念 | React Router v7 | TanStack Router |
|---|---|---|
| Loader | `loader: () => fetch(...)` | `loader: async ({ params }) => ...` |
| Action | `action: async () => ...` | 用 mutation 工具（如 React Query mutation） |
| Form | `<Form>` 组件 | 标准 `<form>` + 手动 onSubmit |
| Outlet | `<Outlet />` | `<Outlet />`（同名） |
| 嵌套路由 | `<Route>` 嵌套 / `routes.ts` | `addChildren()` / 文件嵌套 |
| Params | `useParams()` 返回 `Record<string, string>` | `useParams({ from })` 完全推导 |
| Search | URLSearchParams（手动） | `validateSearch` + `useSearch` 强类型 |
| 错误 | `errorElement` | `errorComponent` |
| 404 | `errorElement` + `useRouteError().status === 404` | `notFoundComponent` + `throw notFound()` |
| 重定向 | `redirect()` from action | `throw redirect(...)` from beforeLoad/loader |
| Code splitting | `lazy: () => import(...)` | `.lazy.tsx` 或 `autoCodeSplitting` 自动 |

**迁移最难的点**：

1. 把所有 search params 转成 `validateSearch + Zod`
2. 把 action 改成 React Query mutation
3. 把 `<Form>` 改成普通 form

通常迁移时间 1-2 周（中型项目）。

下一步推荐：[参考](./reference.md) —— 全部 API 速查 / RouteOptions / RouterOptions / Hooks 完整签名。
