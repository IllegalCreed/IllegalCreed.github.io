---
layout: doc
outline: [2, 3]
---

# 指南

> 本指南覆盖 TanStack Start v1.x RC **Framework 模式** 全部核心功能与常见踩坑。基础概念已在 [入门](./getting-started.md) 介绍，本文聚焦深度用法。

## 文件命名约定全规则

TanStack Start 的路由来自 `src/routes/` 下的文件——Vite 插件扫描后生成 `routeTree.gen.ts`。命名规则一共这些：

### 速查表

| 模式 | 含义 | URL 示例 |
|---|---|---|
| `__root.tsx` | 根路由文件（必须有这个名字） | (始终匹配，无 URL) |
| `index.tsx` | 父路径的 index 路由（精确匹配父路径） | `/posts/` for `posts/index.tsx` |
| `$param.tsx` | 动态段 → `params.param` | `/posts/123` for `posts/$postId.tsx` |
| `$.tsx` | Splat / catchall → `params._splat` | `/files/a/b/c` for `files/$.tsx` |
| `_layout.tsx` | Pathless 布局（不增加 URL 段） | (布局壳) |
| `_layout.child.tsx` | 走 `_layout` 包裹的 `child` | `/child` for `_layout.child.tsx` |
| `(group)/...` | Pathless group（仅组织文件，不影响 URL） | `/posts` for `(admin)/posts.tsx` |
| `-name.tsx` / `-folder/` | 排除（不生成路由，可作为辅助文件 / 文件夹） | (无) |
| `foo.bar.tsx` | 扁平嵌套（点号代替斜杠） | `/foo/bar` |
| `foo_.bar.tsx` | 非嵌套（后缀 `_` 让 `bar` 不继承 `foo` 父布局） | `/foo/bar`（独立树） |
| `foo[.]bar.tsx` | 转义点号 | `/foo.bar`（字面点号） |
| `foo/route.tsx` | 文件夹路径下的「父路由」文件（等价于 `foo.tsx`） | `/foo` |
| `{-$param}.tsx` | 可选参数 | `/posts` 或 `/posts/tech` |

### `__root.tsx` 根路由

唯一一个由路径名钦定的文件——必须叫 `__root.tsx`，必须有：

```tsx
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import type { ReactNode } from 'react'

export const Route = createRootRoute({
  // head() 返回全局 meta / title / link / script —— SSR 时注入 <head>
  head: () => ({
    meta: [{ charSet: 'utf-8' }, { title: '我的应用' }],
    links: [{ rel: 'icon', href: '/favicon.ico' }],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <html lang="zh-CN">
      <head><HeadContent /></head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  )
}
```

要给整个应用注入上下文（如 `QueryClient`），用 `createRootRouteWithContext`：

```tsx
import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext } from '@tanstack/react-router'

interface MyRouterContext {
  queryClient: QueryClient
  user?: { id: string } // 可选——在 beforeLoad 里填
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  // ...
})
```

### `index.tsx` 父路径默认子路由

`routes/posts/index.tsx` 在精确访问 `/posts` 时渲染——区别于 `routes/posts/$postId.tsx`（需要参数）：

```
routes/
├── posts.tsx           ← /posts 父布局（共享 Outlet）
└── posts/
    ├── index.tsx       ← /posts 时显示（默认子）
    └── $postId.tsx     ← /posts/123 时显示
```

匹配规则：

- 访问 `/posts` → 渲染 `posts.tsx` + `posts/index.tsx`
- 访问 `/posts/1` → 渲染 `posts.tsx` + `posts/$postId.tsx`

### 动态参数（`$param`）

```tsx
// routes/posts/$postId.tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: ({ params }) => fetchPost(params.postId),
  component: PostDetail,
})

function PostDetail() {
  const { postId } = Route.useParams() // 类型：{ postId: string }
  return <h1>{postId}</h1>
}
```

多参数：

```tsx
// routes/c/$categoryId/p/$productId.tsx
export const Route = createFileRoute('/c/$categoryId/p/$productId')({
  loader: ({ params }) => {
    const { categoryId, productId } = params // 都是 string
    return fetchProduct(categoryId, productId)
  },
})
```

### Splat / Catchall 路由（`$.tsx`）

```tsx
// routes/files/$.tsx
export const Route = createFileRoute('/files/$')({
  component: FileViewer,
})

function FileViewer() {
  const params = Route.useParams() // { _splat: 'docs/a/b.txt' }
  return <pre>{params._splat}</pre>
}
```

URL `/files/docs/a/b.txt` → `params._splat = 'docs/a/b.txt'`。

### Pathless 布局（`_layout`）

下划线开头的路由文件**包裹**子路由，但不占用 URL 段：

```
routes/
├── _auth.tsx              ← 布局壳（不在 URL 出现）
├── _auth.login.tsx        ← /login（被 _auth 包裹）
├── _auth.register.tsx     ← /register（被 _auth 包裹）
└── _auth/                 ← 等价的文件夹写法
    ├── login.tsx
    └── register.tsx
```

```tsx
// routes/_auth.tsx
import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className="auth-shell">
      <h1>登录 / 注册</h1>
      <Outlet />
    </div>
  )
}
```

访问 `/login` → 渲染 `_auth` 包裹的 `login.tsx`，URL 路径 `/login` 完全不含 `_auth`。

### Pathless group（`(group)`）

括号包围的文件夹**只用于组织代码**，不影响 URL：

```
routes/
├── (marketing)/
│   ├── about.tsx     ← /about（不是 /marketing/about）
│   └── pricing.tsx   ← /pricing
└── (app)/
    ├── dashboard.tsx ← /dashboard
    └── settings.tsx  ← /settings
```

适合：把同类页面文件夹分组、共享同类型 loader，但不想给它们共享布局（如果要共享布局，用 `_layout`）。

### 排除文件（`-` 前缀）

短横线开头的文件 / 文件夹**不**生成路由——纯粹用来组织辅助代码：

```
routes/
├── posts.tsx
├── -posts-utils.ts        ← 不是路由
└── -components/           ← 整个文件夹也不是路由
    ├── PostCard.tsx
    └── PostHeader.tsx
```

`posts.tsx` 内可以：

```tsx
import { PostCard } from './-components/PostCard'
// 或
import { formatPost } from './-posts-utils'
```

### 扁平 vs 文件夹

两种写法**等价**——选你喜欢的：

```
扁平：
posts.tsx
posts.index.tsx
posts.$postId.tsx
posts.$postId.edit.tsx

文件夹：
posts.tsx
posts/
├── index.tsx
├── $postId.tsx
└── $postId/
    └── edit.tsx
```

实际项目可**混用**：

```
posts.tsx           ← 扁平（少量路由）
posts.index.tsx
posts/$postId.tsx
posts/$postId/      ← 详情子树用文件夹（路由多）
├── edit.tsx
└── comments.tsx
```

### 非嵌套（后缀 `_`）

某个子路由**不**想继承父布局时，路径段后加 `_`：

```
routes/
├── posts.tsx                  ← /posts 父布局
├── posts/$postId.tsx          ← /posts/123（被父包裹）
└── posts_/$postId/edit.tsx    ← /posts/123/edit（独立，不被父包裹）
```

`posts_.$postId.edit.tsx` 与 `posts/$postId.tsx` 的差别：

- `/posts/123` → 渲染 `posts.tsx` 父布局 + `posts/$postId.tsx`（嵌套）
- `/posts/123/edit` → 仅渲染 `posts_/$postId/edit.tsx`（独立组件树）

适合：编辑页 / 全屏模式需要跳出父布局。

### 可选参数（`{-$param}`）

最新版本支持的可选参数语法：

```tsx
// routes/posts/{-$category}/index.tsx
export const Route = createFileRoute('/posts/{-$category}/')({
  component: Posts,
})

function Posts() {
  const params = Route.useParams() // { category: string | undefined }
  return <div>分类：{params.category ?? '全部'}</div>
}
```

匹配：
- `/posts` → `category = undefined`
- `/posts/tech` → `category = 'tech'`

## 类型安全导航

TanStack Router 的导航 API 让所有路径 / 参数 / search 都参与类型推导：

### `<Link>` 组件

```tsx
import { Link } from '@tanstack/react-router'

function Nav() {
  return (
    <nav>
      {/* 静态路径 */}
      <Link to="/">首页</Link>
      <Link to="/about">关于</Link>

      {/* 带动态参数（params 必填） */}
      <Link to="/posts/$postId" params={{ postId: '1' }}>第一篇</Link>

      {/* 带 search params */}
      <Link to="/search" search={{ q: 'react', page: 1 }}>搜索</Link>

      {/* search 函数式（基于 prev） */}
      <Link
        to="."
        search={prev => ({ ...prev, page: prev.page + 1 })}
      >
        下一页
      </Link>

      {/* hash */}
      <Link to="/docs" hash="install">安装章节</Link>

      {/* 替换历史（不留 back） */}
      <Link to="/login" replace>登录（不留历史）</Link>

      {/* 激活样式 */}
      <Link
        to="/about"
        activeProps={{ className: 'active' }}
        inactiveProps={{ className: 'inactive' }}
      >
        关于
      </Link>

      {/* preload 时机（默认从 router 配置继承） */}
      <Link to="/dashboard" preload="intent">仪表盘</Link>
    </nav>
  )
}
```

> **核心**：`to` 字符串自动补全；缺 `params` / search 类型不匹配会直接编译报错。

### `useNavigate()` 编程式导航

```tsx
import { useNavigate } from '@tanstack/react-router'

function LoginForm() {
  const navigate = useNavigate()

  async function onSubmit() {
    await login()
    // 类型化导航 —— 路径 / 参数 / search 全推导
    navigate({ to: '/dashboard', replace: true })
  }
}
```

`from` 选项可让相对路径解析正确：

```tsx
const navigate = useNavigate({ from: '/posts/$postId' })

// "." 表示当前路由的层级
navigate({ to: '.', search: prev => ({ ...prev, sort: 'newest' }) })

// ".." 表示父级
navigate({ to: '..' })
```

### `linkOptions()` 可重用的 link 选项

```tsx
import { linkOptions, Link } from '@tanstack/react-router'

// 提取可重用的链接配置
const dashboardLink = linkOptions({
  to: '/dashboard',
  search: { tab: 'overview' as const },
})

// 多处使用
<Link {...dashboardLink}>仪表盘</Link>
<Link {...dashboardLink} activeProps={{ className: 'active' }}>仪表盘</Link>
```

### `Router.invalidate()` 手动重新加载

```tsx
import { useRouter } from '@tanstack/react-router'

function RefreshButton() {
  const router = useRouter()
  // 重跑所有匹配路由的 loader / beforeLoad
  return <button onClick={() => router.invalidate()}>刷新</button>
}
```

## 类型安全的 search params

TanStack Start 把 search params 视为**正经状态**——通过 `validateSearch` 编译期 + 运行期校验。

### 基础：用 Zod schema

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

// Zod v4（最新版本，直接传 schema）
const SearchSchema = z.object({
  q: z.string().default(''),
  page: z.number().default(1),
  sort: z.enum(['newest', 'oldest', 'popular']).default('newest'),
})

export const Route = createFileRoute('/posts')({
  validateSearch: SearchSchema,
  component: Posts,
})

function Posts() {
  const { q, page, sort } = Route.useSearch() // 类型完全推导
  return (
    <div>
      搜索 "{q}"，第 {page} 页，排序：{sort}
    </div>
  )
}
```

Zod v3 时代用 `zodValidator`：

```tsx
import { zodValidator } from '@tanstack/zod-adapter'
import { z } from 'zod'

const SearchSchema = z.object({
  q: z.string().catch(''), // .catch() 容错（v3 的 .default()）
})

export const Route = createFileRoute('/posts')({
  validateSearch: zodValidator(SearchSchema),
})
```

### 在导航时传 search

```tsx
<Link to="/posts" search={{ q: 'react', page: 2, sort: 'popular' }}>
  Page 2
</Link>

{/* 函数式：基于上次 search */}
<Link to="." search={prev => ({ ...prev, page: prev.page + 1 })}>
  下一页
</Link>
```

### `useSearch()` 取出搜参

```tsx
// 在路由组件内
const search = Route.useSearch() // 完整类型

// 在子组件或其它路由
import { getRouteApi } from '@tanstack/react-router'

const postsApi = getRouteApi('/posts')

function Filters() {
  const { sort } = postsApi.useSearch()
  // ...
}
```

### `retainSearchParams` 跨导航保留

某些参数希望在所有导航中被保留（比如 `lang=zh` 或 `theme=dark`）：

```tsx
// routes/__root.tsx
import { createRootRoute, retainSearchParams } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { z } from 'zod'

const RootSearch = z.object({
  lang: z.string().optional(),
  theme: z.enum(['light', 'dark']).optional(),
})

export const Route = createRootRoute({
  validateSearch: zodValidator(RootSearch),
  search: {
    middlewares: [retainSearchParams(['lang', 'theme'])],
  },
})
```

效果：在任意 `<Link>` 不显式覆盖 `lang` / `theme` 时，它们会被自动**保留**到新 URL。

### `stripSearchParams` 去除默认值

URL 里 `?page=1&sort=newest` 这种默认值看着丑——`stripSearchParams` 在导航时自动剥离：

```tsx
const defaults = { page: 1, sort: 'newest' as const }

export const Route = createFileRoute('/posts')({
  validateSearch: SearchSchema,
  search: {
    middlewares: [
      stripSearchParams(defaults),
    ],
  },
})
```

- <span v-pre>`<Link to="/posts" search={{ q: 'react', page: 1, sort: 'newest' }}>`</span> → URL 变成 `/posts?q=react`
- <span v-pre>`<Link to="/posts" search={{ q: 'react', page: 2 }}>`</span> → URL 是 `/posts?q=react&page=2`

### 链式 middleware

```tsx
export const Route = createFileRoute('/search')({
  validateSearch: zodValidator(searchSchema),
  search: {
    middlewares: [
      retainSearchParams(['lang']),         // 保留 lang
      stripSearchParams({ page: 1 }),       // 去除 page=1
    ],
  },
})
```

## Loaders（数据加载）

每个路由可以挂 `loader`——在路由进入前预取数据。Loader 由 router 调度：**首次 SSR 时在 server 跑、导航时在 client 跑**。

### 基础 loader

```tsx
export const Route = createFileRoute('/posts')({
  loader: () => fetchPosts(),
  component: PostsList,
})

function PostsList() {
  // 完整类型推导
  const posts = Route.useLoaderData() // typeof fetchPosts() 返回值
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>
}
```

### Loader 参数

```tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({
    params,           // { postId: string }
    deps,             // 来自 loaderDeps 的返回值
    context,          // 上层 beforeLoad / router context 合并
    abortController,  // 路由卸载时 abort
    preload,          // boolean - 是否是预加载触发
    location,         // 当前 location
    cause,            // 'enter' | 'preload' | 'stay'
    route,            // 路由本身
  }) => {
    const post = await fetchPost(params.postId, { signal: abortController.signal })
    return post
  },
})
```

### `loaderDeps`：基于 search 重新加载

仅当某些 search params 变化时才重跑 loader：

```tsx
export const Route = createFileRoute('/posts')({
  validateSearch: z.object({
    page: z.number().default(1),
    sort: z.enum(['newest', 'oldest']).default('newest'),
    theme: z.string().optional(), // ← 无关 loader 的 UI 状态
  }),
  // ✅ 仅 page / sort 变化触发 loader 重跑
  loaderDeps: ({ search }) => ({ page: search.page, sort: search.sort }),
  loader: ({ deps }) => fetchPosts(deps),
})
```

**反例**：

```tsx
// ❌ 任意 search 变化都重跑（哪怕只切了 theme）
loaderDeps: ({ search }) => search,
```

### Loader 缓存：SWR + staleTime

TanStack Router 内置 SWR 缓存——重复访问时使用缓存值，后台 revalidate：

```tsx
export const Route = createFileRoute('/posts')({
  loader: () => fetchPosts(),
  staleTime: 10_000,          // 10 秒内认为数据 fresh，不重新加载
  preloadStaleTime: 30_000,   // preload 时 30 秒新鲜（默认 30s）
  gcTime: 30 * 60 * 1000,     // 30 分钟后回收（默认 30min）
})
```

全局默认值：

```tsx
const router = createRouter({
  routeTree,
  defaultStaleTime: 5_000,
  defaultPreloadStaleTime: 30_000,
  defaultGcTime: 5 * 60 * 1000,
})
```

### `staleReloadMode`：背景 vs 阻塞

- `'background'`（默认）：先显示旧数据 + 同时后台 revalidate
- `'blocking'`：等新数据到才渲染（旧数据丢弃）

```tsx
export const Route = createFileRoute('/dashboard')({
  loader: {
    handler: () => getDashboard(),
    staleReloadMode: 'blocking', // 等新数据
  },
})
```

### `shouldReload` 自定义重载逻辑

```tsx
export const Route = createFileRoute('/posts')({
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ deps }) => fetchPosts(deps),
  // false → 仅 deps 变化时重跑（不管 staleTime）
  shouldReload: false,
})
```

### Pending state（loading 占位）

```tsx
export const Route = createFileRoute('/posts')({
  loader: () => fetchPosts(),
  pendingComponent: () => <div>加载中...</div>,
  pendingMs: 500,         // 500ms 后才显示 pendingComponent（避免闪烁）
  pendingMinMs: 300,      // 显示至少 300ms（避免一闪而过）
})
```

### Error handling

```tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: ({ params }) => fetchPost(params.postId),
  errorComponent: ({ error, reset }) => (
    <div>
      <p>加载失败：{error.message}</p>
      <button onClick={() => reset()}>重试</button>
    </div>
  ),
  // 错误时回调
  onError: ({ error }) => {
    console.error(error)
  },
})
```

全局默认错误组件：

```tsx
const router = createRouter({
  routeTree,
  defaultErrorComponent: ({ error }) => <p>Oops: {error.message}</p>,
})
```

### `redirect()` 与 `notFound()`

```tsx
import { redirect, notFound } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await fetchPost(params.postId)
    if (!post)
      throw notFound() // 触发 404 / notFoundComponent
    if (post.deleted)
      throw redirect({ to: '/posts' }) // 跳转
    return post
  },
})
```

## `beforeLoad`（路由守卫 / 上下文注入）

`beforeLoad` 在 `loader` 之前跑——典型用途是**鉴权**或**注入上下文**：

```tsx
export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location, context }) => {
    const user = await context.queryClient.fetchQuery({
      queryKey: ['user'],
      queryFn: getCurrentUser,
    })

    if (!user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }

    // 返回值合并到 context，子路由可访问
    return { user }
  },
})

// 子路由：routes/_authed/dashboard.tsx
export const Route = createFileRoute('/_authed/dashboard')({
  loader: ({ context }) => {
    // context.user 已通过 beforeLoad 注入
    return fetchDashboardFor(context.user.id)
  },
})
```

### 上下文链路：根 → beforeLoad → 子路由

```tsx
// 1. 根路由声明 context shape
export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  // ...
})

// 2. createRouter 时传初值
const router = createRouter({
  routeTree,
  context: { queryClient: new QueryClient() },
})

// 3. 中间路由的 beforeLoad 追加
export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ context }) => {
    const user = await getUser()
    return { user } // 合并到 context
  },
})

// 4. 末端 loader 看到完整 context
export const Route = createFileRoute('/_authed/posts')({
  loader: ({ context }) => {
    context.queryClient // ← 根注入
    context.user        // ← _authed 注入
  },
})
```

## Server Functions 全集

`createServerFn()` 是 TanStack Start 的核心 RPC 机制。

### 基础：GET / POST

```tsx
import { createServerFn } from '@tanstack/react-start'

// GET（默认）
export const getData = createServerFn().handler(async () => {
  return { message: 'Hello from server!' }
})

// POST
export const saveData = createServerFn({ method: 'POST' }).handler(async () => {
  return { success: true }
})
```

### 输入校验：类型推断式

```tsx
export const greet = createServerFn({ method: 'GET' })
  .inputValidator((data: { name: string }) => data)
  .handler(async ({ data }) => `Hello, ${data.name}!`)

// 客户端调用
await greet({ data: { name: 'Alice' } })
```

### 输入校验：Zod schema

```tsx
import { z } from 'zod'

const UserInput = z.object({
  name: z.string().min(1),
  age: z.number().int().nonnegative(),
})

export const createUser = createServerFn({ method: 'POST' })
  .inputValidator(UserInput)
  .handler(async ({ data }) => {
    // data 已通过 Zod 校验
    return { id: crypto.randomUUID(), ...data }
  })

// ✅ TS 编译期就拦截错误输入
await createUser({ data: { name: 'Bob', age: 30 } })
```

### 输入校验：FormData

```tsx
export const submitForm = createServerFn({ method: 'POST' })
  .inputValidator((data) => {
    if (!(data instanceof FormData))
      throw new Error('Expected FormData')
    return {
      name: data.get('name')?.toString() ?? '',
      email: data.get('email')?.toString() ?? '',
    }
  })
  .handler(async ({ data }) => {
    return { ok: true }
  })

// 客户端
const fd = new FormData()
fd.append('name', 'Alice')
fd.append('email', 'a@b.com')
await submitForm({ data: fd })
```

### 错误 / redirect / notFound

```tsx
import { notFound, redirect } from '@tanstack/react-router'

export const fetchPost = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const post = await db.findPost(data.id)
    if (!post) throw notFound() // → 404
    return post
  })

export const requireAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getCurrentUser()
  if (!user) throw redirect({ to: '/login' }) // → 跳转
  return user
})

export const risky = createServerFn().handler(async () => {
  if (Math.random() > 0.5)
    throw new Error('Boom!')
  return { ok: true }
})

// 客户端
try {
  await risky()
} catch (e) {
  console.error(e.message)
}
```

### 从客户端组件调用：`useServerFn`

```tsx
import { useServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'

function PostList() {
  // 包装后能感知 router state（如自动取消 in-flight）
  const fetch = useServerFn(fetchPosts)

  const { data } = useQuery({
    queryKey: ['posts'],
    queryFn: () => fetch(),
  })

  return <ul>{data?.map(p => <li key={p.id}>{p.title}</li>)}</ul>
}
```

### 从 loader 调用

```tsx
export const Route = createFileRoute('/posts')({
  loader: () => fetchPosts(),
})
```

### 服务端响应自定义

```tsx
import {
  getRequest,
  getRequestHeader,
  setResponseHeaders,
  setResponseStatus,
} from '@tanstack/react-start/server'

export const getPublic = createServerFn({ method: 'GET' }).handler(async () => {
  setResponseHeaders(new Headers({ 'Cache-Control': 'public, max-age=300' }))
  setResponseStatus(200)
  return fetchPublic()
})
```

### 严格模式 / 序列化约束

默认 `strict: true`——输入输出必须可序列化（JSON / Date / Map / Set / FormData）。如要传递任意值（一般不推荐）：

```tsx
export const loose = createServerFn({ strict: false })
  .inputValidator((data: { value: unknown }) => data)
  .handler(async ({ data }) => data.value)
```

### 文件组织约定

```
src/utils/
├── users.functions.ts   ← export 各种 createServerFn 包装（客户端可 import）
├── users.server.ts      ← server-only 辅助函数（DB 查询 / 文件读写）
└── schemas.ts           ← 共享类型 / Zod schema
```

```ts
// users.server.ts —— 仅在 server fn handler 内被调用
import { db } from '~/db'
export async function findUserById(id: string) {
  return db.users.findUnique({ where: { id } })
}

// users.functions.ts —— 客户端 import 后被 bundle 替换为 RPC stub
import { createServerFn } from '@tanstack/react-start'
import { findUserById } from './users.server'

export const getUser = createServerFn()
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => findUserById(data.id))
```

> **关键**：客户端代码可以 `import { getUser } from './users.functions'` 而**不会**把 `users.server.ts` 打包进客户端——Vite 插件在客户端 bundle 中把 handler 实现替换为 `fetch` stub。

### Streaming：从 server fn 流式返回数据

#### `ReadableStream` 写法

```ts
const streamMessages = createServerFn().handler(async () => {
  const msgs = generateMessages()
  return new ReadableStream<Message>({
    async start(ctrl) {
      for (const m of msgs)
        ctrl.enqueue(m)
      ctrl.close()
    },
  })
})
```

客户端：

```ts
const stream = await streamMessages()
const reader = stream.getReader()
while (true) {
  const { value, done } = await reader.read()
  if (done) break
  appendMessage(value) // value 类型 Message
}
```

#### Async generator（更清爽）

```ts
const streamFn = createServerFn().handler(async function* () {
  for (const m of generateMessages())
    yield m
})

// 客户端
for await (const m of await streamFn())
  appendMessage(m)
```

## Middleware 三类

`createMiddleware()` 创建跨切面逻辑（认证 / 日志 / CSRF / 限流），有三种类型：

| 类型 | 用途 | 调用语法 |
|---|---|---|
| **Request middleware** | 拦截所有服务端请求（routes / SSR / server fn） | `createMiddleware()` |
| **Server function middleware** | 仅服务于 `createServerFn`，可定义 client / server 双端逻辑 | `createMiddleware({ type: 'function' })` |
| **Global middleware** | 在 `createStart` 中注册的全局中间件 | 同上两种，但挂载在全局 |

### 基础：Request middleware

```tsx
import { createMiddleware } from '@tanstack/react-start'

const loggingMw = createMiddleware().server(async ({ next, request }) => {
  const start = Date.now()
  const result = await next() // 必须 await next 并返回它
  console.log(`${request.method} ${request.url} took ${Date.now() - start}ms`)
  return result
})
```

### Function middleware：client + server 双端

```tsx
const authMw = createMiddleware({ type: 'function' })
  .client(async ({ next }) => {
    // 客户端发起前可加 header
    return next({ headers: { Authorization: `Bearer ${getToken()}` } })
  })
  .server(async ({ next, request }) => {
    // 服务端处理时校验
    const session = await getSession(request.headers)
    if (!session)
      throw new Error('Unauthorized')
    return next({ context: { session } })
  })
```

### 链式组合（`.middleware([deps])`）

```tsx
const logMw = createMiddleware().server(...)

const authMw = createMiddleware()
  .middleware([logMw]) // ← 依赖 logMw（先执行 logMw）
  .server(async ({ next, context }) => {
    // ...
    return next({ context: { user: ... } }) // 上下文注入
  })
```

### 输入校验中间件

```tsx
import { zodValidator } from '@tanstack/zod-adapter'

const validationMw = createMiddleware({ type: 'function' })
  .inputValidator(zodValidator(z.object({ workspaceId: z.string().uuid() })))
  .server(({ next, data }) => {
    console.log('workspaceId:', data.workspaceId)
    return next()
  })

const fn = createServerFn()
  .middleware([validationMw])
  .handler(async ({ data }) => {
    // data 已校验
  })
```

### Context 双向传递

#### server → 下一个 middleware

```tsx
const mw = createMiddleware({ type: 'function' }).server(({ next }) => {
  return next({ context: { startTime: Date.now() } })
})
```

#### client → server（**必须显式** `sendContext`）

客户端 context 默认**不**发送到服务端（防止意外发送大 payload）：

```tsx
const mw = createMiddleware({ type: 'function' })
  .client(async ({ next, context }) => {
    return next({
      // 仅这部分送到 server
      sendContext: { workspaceId: context.workspaceId },
    })
  })
  .server(async ({ next, context }) => {
    // context.workspaceId 现在在 server 端可见
    return next()
  })
```

> **安全提醒**：永远**校验**客户端发来的 context：

```tsx
.server(async ({ next, context }) => {
  // 1. 校验形状
  const workspaceId = z.string().uuid().parse(context.workspaceId)

  // 2. 校验权限（用服务端真实 session 检查）
  const member = await db.findMembership({
    userId: context.session.userId, // 来自服务端可信 session
    workspaceId,
  })
  if (!member) throw new Error('Forbidden')

  return next({ context: { workspaceId } })
})
```

> 客户端能发的任何东西都可能被篡改——session 永远从服务端 cookies + DB 派生，**不要**信 `sendContext`。

#### server → client

```tsx
const serverMw = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  return next({ sendContext: { serverTime: Date.now() } })
})

const clientMw = createMiddleware({ type: 'function' })
  .middleware([serverMw])
  .client(async ({ next }) => {
    const result = await next()
    console.log('Server time:', result.context.serverTime)
    return result
  })
```

### 在路由上挂中间件

```tsx
export const Route = createFileRoute('/admin')({
  server: {
    middleware: [authMw, loggingMw],
    handlers: {
      GET: async ({ context }) => Response.json({ ok: true }),
    },
  },
})
```

仅对某个 method 挂中间件：

```tsx
export const Route = createFileRoute('/api/users')({
  server: {
    handlers: ({ createHandlers }) => createHandlers({
      GET: {
        middleware: [cacheMw],
        handler: async () => Response.json(allUsers),
      },
      POST: {
        middleware: [authMw, validateMw],
        handler: async ({ request }) => Response.json(await createUser(request)),
      },
    }),
  },
})
```

### 全局中间件（`createStart`）

```tsx
// src/start.ts
import { createStart, createMiddleware } from '@tanstack/react-start'

const globalLogging = createMiddleware().server(async ({ next, request }) => {
  console.log(`[REQ] ${request.method} ${request.url}`)
  return next()
})

const globalFunctionLog = createMiddleware({ type: 'function' }).client(async ({ next }) => {
  console.log('[CLIENT] calling server fn')
  return next()
})

export const startInstance = createStart(() => ({
  requestMiddleware: [globalLogging],
  functionMiddleware: [globalFunctionLog],
}))
```

### CSRF 保护

默认自动启用——除非你定义了 `src/start.ts` 但忘了加 CSRF middleware：

```tsx
// src/start.ts
import { createStart, createCsrfMiddleware } from '@tanstack/react-start'

const csrfMw = createCsrfMiddleware({
  // 仅对 server fn 启用（不对普通路由），默认就是这样
  filter: ctx => ctx.handlerType === 'serverFn',
  // 如果你的 server 域名跟客户端不同，需要指定 origin：
  // origin: 'https://app.example.com',
})

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMw],
}))
```

### 执行顺序

依赖优先（深度优先），全局先于本地：

```
1. globalMiddleware（按声明顺序）
2. 本地 middleware 链路（最深的依赖先）
3. 真正的 handler
```

### 完整鉴权 + 授权示例

```tsx
// middleware/auth.ts
import { createMiddleware } from '@tanstack/react-start'

export const authMw = createMiddleware().server(async ({ next, request }) => {
  const session = await getSession(request.headers)
  if (!session) throw new Error('Unauthorized')
  return next({ context: { session } })
})

// middleware/authz.ts —— 工厂函数，按权限定制
export function authzMw(perms: Record<string, string[]>) {
  return createMiddleware({ type: 'function' })
    .middleware([authMw])
    .server(async ({ next, context }) => {
      const ok = await hasPerm(context.session, perms)
      if (!ok) throw new Error('Forbidden')
      return next()
    })
}

// utils/users.functions.ts
import { authzMw } from '../middleware/authz'

export const deleteUser = createServerFn({ method: 'POST' })
  .middleware([authzMw({ user: ['delete'] })])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    // context.session 已被 authMw 注入
    await db.users.delete({ where: { id: data.id } })
    return { ok: true }
  })
```

### 服务端代码 tree-shaking

> **关键安全特性**：`.server()` 内的代码**绝不**出现在客户端 bundle 中。
>
> 数据库连接 / API 密钥 / 服务端逻辑可以自由写在 server middleware / server functions 里，Vite 在客户端构建时把它们替换为 RPC stub。

## Server Routes（API 端点）

TanStack Start 用 file routes 同时表达**页面**和**API 端点**——一个文件同时导出 `component` 和 `server.handlers` 即可。

### 纯 API 端点

```ts
// src/routes/api/hello.ts
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/hello')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return new Response('Hello, World!')
      },
      POST: async ({ request }) => {
        const body = await request.json()
        return Response.json({ greeting: `Hi, ${body.name}!` })
      },
    },
  },
})
```

访问：

```bash
curl http://localhost:3000/api/hello
curl -X POST -H 'Content-Type: application/json' \
  -d '{"name":"Alice"}' http://localhost:3000/api/hello
```

### 带动态参数

```ts
// src/routes/api/users/$id.ts
export const Route = createFileRoute('/api/users/$id')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const user = await db.users.findById(params.id)
        if (!user) return new Response('Not Found', { status: 404 })
        return Response.json(user)
      },
      DELETE: async ({ params }) => {
        await db.users.delete(params.id)
        return new Response(null, { status: 204 })
      },
    },
  },
})
```

### 同时是页面 + API

```tsx
// src/routes/blog.$slug.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/blog/$slug')({
  component: BlogPage,
  loader: ({ params }) => loadPost(params.slug),
  server: {
    handlers: {
      // 当客户端请求 .json 后缀时返回 JSON（举例，需自己处理路由）
      GET: async ({ request, params }) => {
        const accept = request.headers.get('accept') ?? ''
        if (accept.includes('application/json'))
          return Response.json(await loadPost(params.slug))
        // 否则交给路由的 SSR / component 处理（默认行为）
      },
    },
  },
})

function BlogPage() {
  const post = Route.useLoaderData()
  // 渲染 HTML 页面
}
```

### 返回 Response 各种姿势

```ts
// 文本
return new Response('hello')

// JSON（最常用）
return Response.json({ a: 1 })

// 带状态码 / headers
return new Response('Not Found', {
  status: 404,
  headers: { 'X-Reason': 'gone' },
})

// 重定向
return new Response(null, { status: 302, headers: { Location: '/login' } })

// Stream（SSE 风格）
return new Response(
  new ReadableStream({
    async start(controller) {
      controller.enqueue('data: hello\n\n')
      controller.close()
    },
  }),
  { headers: { 'Content-Type': 'text/event-stream' } },
)
```

### Handler 上下文

每个 handler 收到：

- `request`: 标准 `Request` 对象
- `params`: 动态路径参数
- `context`: 来自 middleware 的注入

```ts
GET: async ({ request, params, context }) => {
  context.session // ← 来自 authMw
  request.headers.get('accept')
  return Response.json({ ok: true })
}
```

## Selective SSR（逐路由 SSR 控制）

每个路由可独立设置 SSR 行为：

### `ssr: true`（默认）

```tsx
export const Route = createFileRoute('/posts/$postId')({
  ssr: true, // 默认值，可省略
  // beforeLoad / loader 首次在 server 跑，导航时 client；component server 渲染
})
```

### `ssr: false`：纯客户端

```tsx
export const Route = createFileRoute('/admin/realtime')({
  ssr: false,
  beforeLoad: () => {/* 仅 client */},
  loader: () => {/* 仅 client */},
  component: RealTimeDashboard, // 仅 client render
})
```

适合：仅登录后可见、实时性强、SEO 不重要的路由。

### `ssr: 'data-only'`：server 跑数据，client 渲染组件

```tsx
export const Route = createFileRoute('/posts/$postId')({
  ssr: 'data-only',
  // ✅ beforeLoad / loader 仍在 server 跑（数据在 HTML 里 hydrate）
  // ❌ component 仅在 client 渲染（避开 hydration mismatch）
  loader: ({ params }) => fetchPost(params.postId),
  component: PostDetail, // ← 仅 client 渲染
})
```

适合：组件用了浏览器 API（`window` / `localStorage`），但数据可以 SSR 预取。

### 函数式动态决策

```tsx
export const Route = createFileRoute('/docs/$docType/$docId')({
  validateSearch: z.object({ details: z.boolean().optional() }),
  ssr: ({ params, search }) => {
    // params / search 都是 discriminated union：{ status: 'success', value } | { status: 'error', error }
    if (params.status === 'success' && params.value.docType === 'spreadsheet')
      return false
    if (search.status === 'success' && search.value.details)
      return 'data-only'
    return true
  },
  // ...
})
```

### 全局默认

```tsx
// src/start.ts
import { createStart } from '@tanstack/react-start'

export const startInstance = createStart(() => ({
  defaultSsr: false, // 整个应用默认 SPA，仅个别路由 opt-in SSR
}))
```

### 继承规则

子路由 SSR 设置只能**收紧**（不能放松）：

```
✅ true → 'data-only' → false
❌ 'data-only' → true（被忽略，仍是 'data-only'）
❌ false → true（被忽略，仍是 false）
```

### 关闭根组件 SSR

整个 HTML 壳必须 SSR（不然没法发出 HTML），但你可以让根组件**内**的内容只在客户端渲染——用 `shellComponent`：

```tsx
export const Route = createRootRoute({
  shellComponent: RootShell,
  component: RootComponent,
  ssr: false,
})

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  )
}

function RootComponent() {
  return (
    <div className="layout">
      <Sidebar />
      <Outlet />
    </div>
  )
}
```

## SPA Mode（完全 SPA）

```ts
// vite.config.ts
export default defineConfig({
  plugins: [
    tanstackStart({
      spa: { enabled: true },
    }),
    viteReact(),
  ],
})
```

构建时仅生成根路由的 HTML 壳（`_shell.html`）+ 客户端 bundle。所有路由在 client 渲染。

### 部署 SPA：需要 fallback redirect

Netlify `_redirects`：

```
/_serverFn/* /_serverFn/:splat 200
/api/* /api/:splat 200
/* /_shell.html 200
```

Cloudflare Pages `_redirects` 同上。

Vercel `vercel.json`：

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/_shell.html" }
  ]
}
```

### 检测是否在渲染壳

```tsx
function Root() {
  const router = useRouter()
  if (router.isShell()) {
    return <div>Loading...</div>
  }
  return <Outlet />
}
```

## Static Prerendering（SSG）

```ts
// vite.config.ts
export default defineConfig({
  plugins: [
    tanstackStart({
      prerender: {
        enabled: true,

        // 自动顺着 <Link> 爬取
        crawlLinks: true,

        // 自动发现「无参数」路由
        autoStaticPathsDiscovery: true,

        // 把 /about → /about/index.html（漂亮 URL）
        autoSubfolderIndex: true,

        concurrency: 14,
        retryCount: 2,
        retryDelay: 1000,
        maxRedirects: 5,
        failOnError: true,

        // 过滤：哪些路径不渲染
        filter: ({ path }) => !path.startsWith('/_internal'),

        // 渲染完成钩子
        onSuccess: ({ page }) => {
          console.log(`✓ Rendered ${page.path}`)
        },
      },
    }),
    viteReact(),
  ],
})
```

### 动态路由的 prerender

动态路径（如 `/posts/$postId`）默认不会自动渲染——必须**显式列出**或被 `<Link>` 爬到：

```ts
// 显式列出
tanstackStart({
  prerender: {
    enabled: true,
    pages: [
      { path: '/posts/1', prerender: { enabled: true } },
      { path: '/posts/2', prerender: { enabled: true } },
      // 也可用 outputPath 自定义文件名
      { path: '/specials', prerender: { enabled: true, outputPath: '/specials/index.html' } },
    ],
  },
})
```

也可以让 build 期 fetch 一份 ID 列表后批量生成（typical SSG pattern）。

## 同构 / Server-Only / Client-Only

### 默认：同构

所有代码**默认**同时存在于 client + server bundle。route loader / 工具函数 / 格式化器都两端跑。

### 服务端独占（不可出现在 client bundle）

#### 方式 1：`createServerFn` RPC

```tsx
export const getSecret = createServerFn().handler(() => process.env.SECRET)
// 客户端 import 时 handler 被替换为 fetch stub
```

#### 方式 2：`createServerOnlyFn` 工具函数（不是 RPC）

```tsx
import { createServerOnlyFn } from '@tanstack/react-start'

// 客户端调用会抛错（不像 RPC 那样跨网络调用）
const getDbUrl = createServerOnlyFn(() => process.env.DATABASE_URL)
```

#### 方式 3：`.server.ts` 后缀

```ts
// src/lib/db.server.ts
import { db } from './client'
export async function findUser(id: string) {
  return db.users.findUnique({ where: { id } })
}
```

如果客户端代码 `import` 这个文件 → 开发期 warn，生产构建 error。

#### 方式 4：`import '@tanstack/react-start/server-only'` 标记

```ts
// src/lib/secrets.ts（文件名没有 .server.ts，需显式标记）
import '@tanstack/react-start/server-only'

export const API_KEY = process.env.API_KEY
```

### 客户端独占

#### `createClientOnlyFn` / `<ClientOnly>`

```tsx
import { createClientOnlyFn } from '@tanstack/react-start'
import { ClientOnly } from '@tanstack/react-router'

const saveLocal = createClientOnlyFn((k: string, v: any) => {
  localStorage.setItem(k, JSON.stringify(v))
})

function Analytics() {
  return (
    <ClientOnly fallback={null}>
      <GoogleAnalytics />
    </ClientOnly>
  )
}
```

#### `.client.ts` 后缀

```ts
// src/lib/storage.client.ts
import '@tanstack/react-start/client-only'

export function saveTheme(theme: string) {
  localStorage.setItem('theme', theme)
}
```

服务端 import 会被拒绝。

### `useHydrated()` 区分 SSR / hydration

```tsx
import { useHydrated } from '@tanstack/react-start'

function TimezoneDisplay() {
  const hydrated = useHydrated()
  const tz = hydrated
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : 'UTC' // server 端用 UTC 兜底
  return <div>时区：{tz}</div>
}
```

### `createIsomorphicFn` 双端不同实现

```tsx
import { createIsomorphicFn } from '@tanstack/react-start'

const getInfo = createIsomorphicFn()
  .server(() => ({ type: 'server', platform: process.platform }))
  .client(() => ({ type: 'client', ua: navigator.userAgent }))
```

## 环境变量 + 运行时 env 读取

### `VITE_` 前缀规则

```bash
# .env
DATABASE_URL=...          # 服务端独占
JWT_SECRET=...            # 服务端独占
VITE_API_URL=...          # 客户端可见
VITE_APP_NAME=...         # 客户端可见
```

服务端：`process.env.DATABASE_URL`
客户端：`import.meta.env.VITE_API_URL`

### **关键陷阱**：永远在 handler 内读 env，不在模块顶层

```tsx
// ❌ 错（模块加载时执行，Cloudflare Workers 等 edge 平台读不到 per-request env）
const apiKey = process.env.API_KEY
export const fetchExternal = createServerFn().handler(() => callApi(apiKey))

// ✅ 对（请求时读）
export const fetchExternal = createServerFn().handler(() => callApi(process.env.API_KEY))
```

### 类型化

```ts
// src/env.d.ts
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_NAME: string
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly DATABASE_URL: string
      readonly JWT_SECRET: string
    }
  }
}
```

### `.env` 文件层级

```
.env
.env.development        # dev 时加载
.env.production         # build 时加载
.env.local              # 本地覆盖（gitignore）
.env.development.local  # 本地 dev 覆盖
```

后加载的覆盖先加载的。

## Authentication 完整示例

### 1. Session helper

```tsx
// src/utils/session.ts
import { useSession } from '@tanstack/react-start/server'

interface SessionData {
  userId?: string
  email?: string
}

export function useAppSession() {
  return useSession<SessionData>({
    name: 'app-session',
    password: process.env.SESSION_SECRET!, // 32+ 字符
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true,
    },
  })
}
```

### 2. Server functions

```tsx
// src/utils/auth.functions.ts
import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useAppSession } from './session'

export const loginFn = createServerFn({ method: 'POST' })
  .inputValidator((d: { email: string, password: string }) => d)
  .handler(async ({ data }) => {
    const user = await authenticate(data.email, data.password)
    if (!user)
      return { error: 'Invalid credentials' as const }

    const session = await useAppSession()
    await session.update({ userId: user.id, email: user.email })
    throw redirect({ to: '/dashboard' })
  })

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await useAppSession()
  await session.clear()
  throw redirect({ to: '/' })
})

export const getCurrentUserFn = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await useAppSession()
  return session.data.userId ? await getUserById(session.data.userId) : null
})
```

### 3. 守卫路由（`_authed` 布局）

```tsx
// src/routes/_authed.tsx
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { getCurrentUserFn } from '../utils/auth.functions'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }) => {
    const user = await getCurrentUserFn()
    if (!user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
    return { user } // → context
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  const { user } = Route.useRouteContext()
  return (
    <div>
      <header>欢迎 {user.email}</header>
      <Outlet />
    </div>
  )
}
```

### 4. 受保护的子路由

```tsx
// src/routes/_authed/dashboard.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/dashboard')({
  component: () => <div>Dashboard</div>,
})

// URL 仍是 /dashboard（_authed 不出现）
```

### 5. 登录页 + 表单

```tsx
// src/routes/login.tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { loginFn } from '../utils/auth.functions'

export const Route = createFileRoute('/login')({
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  component: LoginPage,
})

function LoginPage() {
  const submit = useServerFn(loginFn)
  const navigate = useNavigate()
  const { redirect: redirectTo } = Route.useSearch()
  const [error, setError] = useState<string>()

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const result = await submit({
      data: {
        email: fd.get('email') as string,
        password: fd.get('password') as string,
      },
    })
    if ('error' in result) setError(result.error)
    else navigate({ to: redirectTo ?? '/dashboard' })
  }

  return (
    <form onSubmit={onSubmit}>
      <input name="email" type="email" placeholder="邮箱" />
      <input name="password" type="password" placeholder="密码" />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button>登录</button>
    </form>
  )
}
```

## Error Boundaries

### Route 级 `errorComponent`

```tsx
import { ErrorComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  loader: ({ params }) => fetchPost(params.postId),
  errorComponent: ({ error, reset }) => (
    <div>
      <h2>加载文章失败</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>重试</button>
    </div>
  ),
})
```

### 全局默认错误组件

```tsx
const router = createRouter({
  routeTree,
  defaultErrorComponent: ({ error }) => <ErrorComponent error={error} />,
})
```

### 用 `router.invalidate()` 触发重试

```tsx
import { useRouter } from '@tanstack/react-router'

export const Route = createFileRoute('/posts')({
  errorComponent: ({ error }) => {
    const router = useRouter()
    return (
      <div>
        <p>{error.message}</p>
        <button onClick={() => router.invalidate()}>重新加载</button>
      </div>
    )
  },
})
```

### 自定义错误类型

```tsx
export const Route = createFileRoute('/posts')({
  loader: () => fetchPosts(),
  errorComponent: ({ error }) => {
    if (error instanceof MyAuthError) {
      return <p>请先登录</p>
    }
    return <ErrorComponent error={error} />
  },
})
```

## 部署 adapter

### Cloudflare Workers（Official Partner）

```bash
pnpm add -D @cloudflare/vite-plugin wrangler
```

```ts
// vite.config.ts
import { cloudflare } from '@cloudflare/vite-plugin'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart(),
    viteReact(),
  ],
})
```

```jsonc
// wrangler.jsonc
{
  "name": "my-app",
  "compatibility_date": "2025-09-02",
  "compatibility_flags": ["nodejs_compat"],
  "main": "@tanstack/react-start/server-entry"
}
```

```bash
pnpm run build && pnpm run deploy
```

### Netlify（Official Partner）

```bash
pnpm add -D @netlify/vite-plugin-tanstack-start
```

```ts
import netlify from '@netlify/vite-plugin-tanstack-start'

export default defineConfig({
  plugins: [tanstackStart(), netlify(), viteReact()],
})
```

```bash
npx netlify deploy
```

### Nitro 通用 adapter（Vercel / AWS / Bun / Node Docker）

```bash
pnpm add nitro
```

```ts
import { nitro } from 'nitro/vite'

export default defineConfig({
  plugins: [tanstackStart(), nitro(), viteReact()],
})
```

Nitro 自动检测目标平台（Vercel / Netlify / Cloudflare / AWS Lambda / etc）。可显式指定：

```ts
nitro({ preset: 'vercel' })       // Vercel
nitro({ preset: 'cloudflare-pages' })
nitro({ preset: 'aws-lambda' })
nitro({ preset: 'bun' })          // Bun
nitro({ preset: 'node-server' })  // 通用 Node（默认）
```

### Node.js / Docker

不需要 adapter，默认 build 即可：

```json
{
  "scripts": {
    "build": "vite build",
    "start": "node .output/server/index.mjs"
  }
}
```

Dockerfile 示例：

```dockerfile
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

### Railway（Official Partner）

按 Nitro 配置后连 GitHub repo 即可，Railway 自动检测 build / start 命令。

## 与 TanStack Query 协作

### 完整集成模板

```tsx
// src/router.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
      },
    },
  })

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0, // 让 Query 接管缓存
    Wrap: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    ),
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
```

### Loader + `ensureQueryData` 预取

```tsx
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'

const postsQuery = queryOptions({
  queryKey: ['posts'],
  queryFn: () => fetchPosts(),
})

export const Route = createFileRoute('/posts')({
  loader: ({ context }) => context.queryClient.ensureQueryData(postsQuery),
  component: Posts,
})

function Posts() {
  // suspense 自动跟 loader 协调（不会 double-fetch）
  const { data } = useSuspenseQuery(postsQuery)
  return <ul>{data.map(p => <li key={p.id}>{p.title}</li>)}</ul>
}
```

### 带参数 + search

```tsx
const postQuery = (id: string) =>
  queryOptions({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
  })

export const Route = createFileRoute('/posts/$postId')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(postQuery(params.postId)),
  component: PostDetail,
})

function PostDetail() {
  const { postId } = Route.useParams()
  const { data: post } = useSuspenseQuery(postQuery(postId))
  return <article>{post.title}</article>
}
```

### Mutation + invalidate

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

function NewPostForm() {
  const qc = useQueryClient()
  const create = useServerFn(createPost)

  const mutation = useMutation({
    mutationFn: (data: { title: string, body: string }) => create({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      mutation.mutate({ title: 'Hi', body: '...' })
    }}>
      {/* ... */}
    </form>
  )
}
```

## 与 React Router v7 / Next.js / SolidStart 对比

### vs React Router v7（Framework 模式）

| 维度 | TanStack Start | React Router v7 |
|---|---|---|
| 路由配置 | 文件路由 + `routeTree.gen.ts` 自动生成 | `routes.ts` 手动或 `fs-routes` |
| Search params 类型化 | `validateSearch` + Zod 完整 | 弱 |
| 数据加载 | `loader` + `beforeLoad` + context | `loader` + `clientLoader` |
| Mutation | `createServerFn`（RPC） | `action` + `<Form>` |
| 中间件 | `createMiddleware`（稳定，三类） | `middleware`（unstable） |
| 表单 progressive enhancement | 较弱（依赖 JS） | 强（`<Form>` 无 JS 可用） |
| 路由 params 类型推导 | 完美 | 完美（v7 加了 `Route.LoaderArgs`） |
| RSC | experimental | unstable |
| 构建工具 | Vite | Vite |
| 心智负担 | 中（routeTree 自动生成） | 高（三种 mode + Remix 升级） |
| 生态 / 招聘 | 小 | 大（React 路由市占第一） |

**选择建议**：

- 看重 search params / loader 类型化 → TanStack Start
- 看重 progressive enhancement / 表单不依赖 JS → React Router v7
- 从 Remix v2 升级 → React Router v7（一行 codemod）

### vs Next.js App Router

| 维度 | TanStack Start | Next.js 15 App Router |
|---|---|---|
| 组件默认 | 客户端组件 + 显式 server fn | RSC 默认 + `'use client'` opt-in |
| 缓存 | 显式（loader staleTime + Query） | 多层隐式（request memo / data cache / route cache） |
| 数据加载 | `loader` + `createServerFn` | `fetch()` + Server Components |
| 类型安全 | 编译期（routes / search / serverFn） | 部分（Server Actions 边界弱） |
| RSC | experimental | 默认 |
| 路由 | TanStack Router（最强类型路由） | 内置（弱类型） |
| 构建 | Vite | Turbopack / Webpack |
| 部署 | 平台中立（CF / Netlify / AWS / Nitro） | Vercel 优先 |
| 学习曲线 | 中等（类型推导丰富） | 陡峭（RSC + 缓存语义） |

**选择建议**：

- 看重 RSC bundle 削减 → Next.js
- 看重平台中立 / 拒绝 Vercel 锁定 → TanStack Start
- 重度 TanStack Query 用户 → TanStack Start（无缝）

### vs SolidStart

| 维度 | TanStack Start | SolidStart |
|---|---|---|
| UI 框架 | React | Solid |
| 数据加载 | `loader` + `createServerFn` | `query()` + `createAsync()` |
| Mutation | `createServerFn` | `action()` |
| Server fn 语义 | 显式 `createServerFn` | `"use server"` 字符串 |
| 路由类型化 | TanStack Router（极强） | 完整泛型 |
| 心智模型 | nested loaders + RPC | Solid 细粒度响应式 + RPC |

**选择建议**：

- 选 React → TanStack Start
- 选 Solid（更少运行时 + 真正细粒度响应式） → SolidStart

## 常见踩坑

### 1. `routeTree.gen.ts` 不更新

**现象**：你修改了 `src/routes/` 的文件名，但 `routeTree.gen.ts` 没刷新，`<Link to>` 自动补全还是旧的。

**原因**：Vite 插件有时检测文件变化迟钝（特别在 WSL / Docker 卷上）。

**修复**：

```bash
rm src/routeTree.gen.ts
pnpm dev
```

或在 `vite.config.ts` 里启用更激进的 watcher：

```ts
tanstackStart({
  tsr: {
    routesDirectory: 'src/routes',
    generatedRouteTree: 'src/routeTree.gen.ts',
    autoCodeSplitting: true,
  },
})
```

### 2. 客户端意外打包到服务端代码

**现象**：客户端 bundle 体积膨胀，devtools 看到 `pg` / `bcrypt` 等服务端依赖。

**原因**：忘了把数据库调用包到 `createServerFn` 里——客户端 `import` 了一个直接调 `db.query()` 的模块。

**修复**：

- 所有服务端代码放进 `*.server.ts` 文件 → 客户端 import 时构建会 error
- 或直接用 `createServerFn` 包装

### 3. `process.env.X` 在 Cloudflare 上是 `undefined`

**原因**：CF Workers 在请求时注入 env，模块加载时（顶层）读不到。

**修复**：在 `.handler()` 内读：

```tsx
// ❌
const key = process.env.API_KEY
export const fn = createServerFn().handler(() => useApi(key))

// ✅
export const fn = createServerFn().handler(() => useApi(process.env.API_KEY))
```

### 4. 自定义 `src/start.ts` 后 CSRF 失效

**原因**：定义 `start.ts` 后，自动 CSRF middleware **不再**自动加载。

**修复**：手动注册：

```tsx
import { createCsrfMiddleware, createStart } from '@tanstack/react-start'

const csrfMw = createCsrfMiddleware({
  filter: ctx => ctx.handlerType === 'serverFn',
})

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMw],
}))
```

### 5. SPA Mode 部署后 404

**原因**：CDN 没配置 SPA fallback——访问 `/posts/123` 时 CDN 找不到对应静态文件，返回 404。

**修复**：配置 SPA fallback（参考 [SPA Mode](#spa-mode完全-spa) 章节）。

### 6. `useServerFn` vs 直接调用

```tsx
// ❌ 不推荐：直接调用（不感知 router state）
function Comp() {
  const handle = async () => {
    await myServerFn({ data: ... })
    // router 不知道这次调用，不会自动刷新
  }
}

// ✅ 推荐：useServerFn 包装
function Comp() {
  const myFn = useServerFn(myServerFn)
  const router = useRouter()
  const handle = async () => {
    await myFn({ data: ... })
    router.invalidate() // 显式触发重新加载
  }
}
```

### 7. Hydration mismatch

**现象**：控制台报「Hydration failed」错误。

**常见原因**：

- 组件在 server / client 渲染出不同 HTML（如直接 `new Date().toString()`）
- localStorage / window 在 server 端访问（应该用 `useHydrated()` 或 `<ClientOnly>`）
- 第三方库 `noSerialize` 实例没正确处理

**修复**：

```tsx
// ❌ Hydration mismatch
function Now() {
  return <p>{new Date().toLocaleString()}</p>
}

// ✅ 用 useEffect 在 hydration 后再渲染
function Now() {
  const [now, setNow] = useState<string>()
  useEffect(() => { setNow(new Date().toLocaleString()) }, [])
  return <p>{now ?? 'Loading...'}</p>
}
```

### 8. Server Function 调用没有类型推导

**原因**：通常是 TS 配置不完整，或者忘了在 `router.tsx` 末尾 `declare module`。

**修复**：

```tsx
// src/router.tsx 末尾
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
```

并确保 `tsconfig.json` 开 `"strict": true`。

### 9. Search params 拼错的运行时错误

**现象**：手敲 URL `?paeg=2`（拼错），页面崩溃。

**原因**：`validateSearch` 抛错→触发 `errorComponent`。

**修复**：用 `.catch()` / `.default()` 容错：

```ts
// Zod v4
const Schema = z.object({
  page: z.number().default(1),
  q: z.string().default(''),
})

// Zod v3 + adapter
const Schema = z.object({
  page: z.number().catch(1),
  q: z.string().catch(''),
})
```

### 10. `createServerFn` 返回大对象 / Date 序列化

**现象**：返回值里 `Date` 变成字符串、`Map` / `Set` 不见了。

**原因**：默认走 JSON 序列化。

**修复方案**：

- 简单 Date → 服务端 `.toISOString()`，客户端 `new Date(s)` 还原
- 复杂结构 → 用 SuperJSON 等可逆序列化（自己包一层）
- 大数据 → 用 streaming server function（见上文）

### 11. Import protection 在 dev 不报错，生产构建炸

**原因**：dev 模式只 warn，prod 模式才 fail build。

**修复**：在 CI 上跑一次 `pnpm build` 验证；或在 dev 启用严格模式：

```ts
tanstackStart({
  // 让 dev 也报错
  customization: {
    importProtection: { mode: 'strict' },
  },
})
```

### 12. SSR 时第三方库出错（如 `window is not defined`）

**修复**：用 `<ClientOnly>` 或 `ssr: false`：

```tsx
import { ClientOnly } from '@tanstack/react-router'

function Map() {
  return (
    <ClientOnly fallback={<div>加载地图...</div>}>
      <LeafletMap />
    </ClientOnly>
  )
}
```

### 13. 不同路由 `loaderDeps` 选错

**反例**：

```tsx
loaderDeps: ({ search }) => search, // 整个 search 都成 deps → 任何 search 变化都触发 reload
```

**正例**：

```tsx
loaderDeps: ({ search }) => ({ page: search.page, sort: search.sort }),
```

### 14. 拼错 `__root.tsx` 文件名

文件必须叫 `__root.tsx`（两个下划线），不能叫 `_root.tsx` 或 `root.tsx`——否则 routeTree 找不到根。

### 15. Beta 阶段 API 变动

部分 API 在 RC → v1 阶段可能小调整：

- `server: { handlers }` 取代过去的 `createAPIFileRoute`
- `createServerFn().method()` 链式接口 → 已稳定为 `createServerFn({ method })` 选项
- `createStart` 全局配置 → RC 阶段成熟
- RSC 仍 experimental，不建议生产使用

**建议**：生产项目锁定具体 minor 版本（如 `"@tanstack/react-start": "1.0.0-rc.x"`），升级前看 CHANGELOG。

## 下一步

- API 速查 → [参考](./reference.md)
- 官方文档 → [tanstack.com/start](https://tanstack.com/start/latest/docs/framework/react/overview)
- 示例集合 → [tanstack.com/start examples](https://tanstack.com/start/latest/docs/framework/react/examples)
- 与 Router 关联 → [TanStack Router 文档](https://tanstack.com/router/latest)
