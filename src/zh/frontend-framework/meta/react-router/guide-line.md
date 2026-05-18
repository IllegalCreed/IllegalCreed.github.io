---
layout: doc
outline: [2, 3]
---

# 指南

> 本指南覆盖 React Router v7 **Framework 模式** 全部核心功能与常见踩坑。基础概念已在 [入门](./getting-started.md) 介绍，本文聚焦深度用法。

## 路由配置（`app/routes.ts`）

`app/routes.ts` 是路由清单——所有 URL ↔ 模块文件映射的唯一来源。

### Helper API 全集

```ts
// app/routes.ts
import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from '@react-router/dev/routes'

export default [
  // 1. index() —— 父路由的默认子路由（路径与父相同）
  index('./routes/home.tsx'), // / 路径

  // 2. route(pattern, file) —— 普通路由
  route('about', './routes/about.tsx'), // /about
  route('settings/profile', './routes/settings-profile.tsx'), // /settings/profile

  // 3. route(pattern, file, children) —— 嵌套路由
  route('dashboard', './routes/dashboard.tsx', [
    index('./routes/dashboard-home.tsx'), // /dashboard
    route('settings', './routes/dashboard-settings.tsx'), // /dashboard/settings
    route('users/:id', './routes/dashboard-user.tsx'), // /dashboard/users/:id
  ]),

  // 4. layout(file, children) —— 纯布局（不增加 URL 段）
  layout('./routes/auth-layout.tsx', [
    route('login', './routes/login.tsx'), // /login（共享 auth-layout）
    route('register', './routes/register.tsx'), // /register
  ]),

  // 5. prefix(path, children) —— 批量加 URL 前缀
  ...prefix('admin', [
    index('./routes/admin-home.tsx'), // /admin
    route('users', './routes/admin-users.tsx'), // /admin/users
    route('settings', './routes/admin-settings.tsx'), // /admin/settings
  ]),
] satisfies RouteConfig
```

### 动态段（Dynamic Segments）

URL 模式中的 `:xxx` 是动态参数：

```ts
// /products/:productId
route('products/:productId', './routes/product.tsx'),

// /c/:categoryId/p/:productId（多个动态段）
route('c/:categoryId/p/:productId', './routes/product-detail.tsx'),
```

```tsx
// app/routes/product.tsx
import type { Route } from './+types/product'

export async function loader({ params }: Route.LoaderArgs) {
  // params 类型自动为 { productId: string }
  return { product: await db.products.findUnique({ where: { id: params.productId } }) }
}
```

### 可选段（Optional Segments）

URL 模式中的 `?` 后缀让段可选：

```ts
// /:lang? + /categories（lang 可省略）
//   /categories       → params.lang = undefined
//   /zh/categories    → params.lang = 'zh'
route(':lang?/categories', './routes/categories.tsx'),

// /users/:userId/edit?（edit 可省略）
//   /users/123        → 渲染用户详情
//   /users/123/edit   → 渲染编辑
route('users/:userId/edit?', './routes/user.tsx'),
```

### Splat 路由（Catchall）

`/*` 匹配剩余所有路径段（包含 `/`）：

```ts
// /files/path/to/file.txt → params['*'] = 'path/to/file.txt'
route('files/*', './routes/files.tsx'),

// 顶级 404 兜底
route('*', './routes/not-found.tsx'),
```

```tsx
// app/routes/files.tsx
export async function loader({ params }: Route.LoaderArgs) {
  const splat = params['*'] // 类型: string
  // ...
}
```

### Nested Routes 与 `<Outlet/>`

父路由必须渲染 `<Outlet/>`，否则子路由不显示：

```ts
// app/routes.ts
route('dashboard', './routes/dashboard.tsx', [
  index('./routes/dashboard-home.tsx'),
  route('settings', './routes/dashboard-settings.tsx'),
]),
```

```tsx
// app/routes/dashboard.tsx
import { NavLink, Outlet } from 'react-router'

export default function Dashboard() {
  return (
    <div className="grid grid-cols-[200px_1fr]">
      <aside>
        <nav>
          <NavLink to="/dashboard" end>概览</NavLink>
          <NavLink to="/dashboard/settings">设置</NavLink>
        </nav>
      </aside>
      <main>
        <Outlet />
        {/* 子路由（dashboard-home 或 dashboard-settings）渲染在这里 */}
      </main>
    </div>
  )
}
```

**Parallel Loaders**：父路由 `dashboard.tsx` 的 loader 与子路由 `dashboard-home.tsx` / `dashboard-settings.tsx` 的 loader **并行执行**——不是 Next.js Pages Router 那种瀑布。

### 跨路由的 layout 共享

`layout()` 让多个不相关的 URL 共享外壳，但 URL 不加段：

```ts
layout('./routes/auth-layout.tsx', [
  route('login', './routes/login.tsx'), // /login
  route('register', './routes/register.tsx'), // /register
  route('forgot-password', './routes/forgot-password.tsx'), // /forgot-password
]),
```

```tsx
// app/routes/auth-layout.tsx
import { Outlet } from 'react-router'

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-96 rounded-lg bg-white p-8 shadow">
        <h1>欢迎</h1>
        <Outlet />
      </div>
    </div>
  )
}
```

### 文件路由：`@react-router/fs-routes`

如果偏好「文件命名即路由」，安装 `@react-router/fs-routes`：

```bash
npm install @react-router/fs-routes
```

```ts
// app/routes.ts
import { type RouteConfig } from '@react-router/dev/routes'
import { flatRoutes } from '@react-router/fs-routes'

export default flatRoutes() satisfies RouteConfig
```

**命名约定**（flat routes）：

```
app/routes/
├── _index.tsx                    → /
├── about.tsx                     → /about
├── concerts.tsx                  → /concerts（父布局）
├── concerts._index.tsx           → /concerts（index 子路由）
├── concerts.$city.tsx            → /concerts/:city
├── concerts.trending.tsx         → /concerts/trending
├── _auth.tsx                     → 无 URL 段（pathless layout）
├── _auth.login.tsx               → /login（嵌套在 _auth 下）
├── _auth.register.tsx            → /register
├── ($lang)._index.tsx            → / 或 /:lang
├── files.$.tsx                   → /files/*
├── sitemap[.]xml.tsx             → /sitemap.xml（转义 .）
└── app._index/                   → 用文件夹组织
    ├── route.tsx                 → 实际路由模块
    ├── components.tsx            → 同目录辅助文件
    └── helpers.ts
```

**核心约定**：

- **`.` 分隔 URL 段**：`concerts.trending.tsx` → `/concerts/trending`
- **`$` 前缀是动态段**：`concerts.$city.tsx` → `/concerts/:city`
- **`_` 前缀是 pathless layout**：`_auth.tsx` 不增加 URL 段
- **`_index.tsx` 是父路由的索引子路由**
- **`($xx)` 是可选段**：`($lang)._index.tsx` → `/` 或 `/:lang`
- **`$.tsx` 是 splat**：`files.$.tsx` → `/files/*`
- **`[]` 转义特殊字符**：`sitemap[.]xml.tsx` → `/sitemap.xml`
- **文件夹 + `route.tsx`**：把辅助文件放在同目录但不污染路由

### 混合用法：`routes.ts` + 文件路由

可以同时使用：

```ts
// app/routes.ts
import { type RouteConfig, route } from '@react-router/dev/routes'
import { flatRoutes } from '@react-router/fs-routes'

export default [
  // 手动定义特殊路由
  route('/admin/*', './routes/admin.tsx'),

  // 其余走文件路由
  ...(await flatRoutes({
    ignoredRouteFiles: ['admin.tsx'], // 排除已手动定义的
  })),
] satisfies RouteConfig
```

## Route Module 全部导出

每个路由模块（`app/routes/*.tsx`）支持以下导出，**全部可选**（除了想做完整功能时的 default）：

```tsx
import type { Route } from './+types/my-route'

// ── 服务端 ──
export async function loader(args: Route.LoaderArgs) { /* ... */ }
export async function action(args: Route.ActionArgs) { /* ... */ }
export function headers() { /* ... */ }
export const middleware = [/* ... */] // unstable

// ── 客户端 ──
export async function clientLoader(args: Route.ClientLoaderArgs) { /* ... */ }
export async function clientAction(args: Route.ClientActionArgs) { /* ... */ }
export const clientMiddleware = [/* ... */] // unstable

// ── 文档 ──
export function meta(args: Route.MetaArgs) { /* ... */ }
export function links() { /* ... */ }

// ── 边界 ──
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) { /* ... */ }
export function HydrateFallback() { /* ... */ }

// ── 控制 ──
export function shouldRevalidate(arg: ShouldRevalidateFunctionArgs) { /* ... */ }
export const handle = { /* 自定义数据，给 useMatches() 用 */ }

// ── 组件 ──
export default function MyRoute({ loaderData, actionData, params }: Route.ComponentProps) {
  return <div />
}
```

下文逐个详解。

## Loader：服务端数据加载

### 基础用法

```tsx
// app/routes/posts.tsx
import type { Route } from './+types/posts'

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const page = Number(url.searchParams.get('page') ?? '1')

  const posts = await db.posts.findMany({
    skip: (page - 1) * 20,
    take: 20,
  })

  return { posts, page }
}

export default function Posts({ loaderData }: Route.ComponentProps) {
  const { posts, page } = loaderData
  return (
    <ul>
      {posts.map(p => <li key={p.id}>{p.title}</li>)}
    </ul>
  )
}
```

**核心机制**：

- loader **只在服务器执行**——client bundle 中完全 tree-shake 掉，敏感代码（DB 凭据、私密 API key）安全
- 首屏 SSR 时 loader 与 server 渲染同步执行
- Client navigation 时 React Router 通过 `fetch('/posts.data?page=2')` 调服务器拿数据，**不重新加载 HTML**
- 多个嵌套路由的 loader **并行执行**（不是瀑布）

### `loader` 返回类型

支持 JSON-serializable + 一些扩展类型：

```ts
return {
  string: 'ok',
  number: 42,
  boolean: true,
  null: null,
  date: new Date(), // ✓ 支持
  map: new Map([['key', 'value']]), // ✓ 支持
  set: new Set([1, 2, 3]), // ✓ 支持
  array: [1, 2, 3],
  nested: { foo: { bar: 'baz' } },
  promise: fetchSomething(), // ✓ 支持（用于 streaming）
}
```

**不支持**：

- 函数、类实例（除 Date / Map / Set 等）
- `undefined`（顶层值会丢失，建议返回 `null`）
- `BigInt`、`Symbol`
- 循环引用

### Loader 抛错

抛 `Response` 触发 `ErrorBoundary`：

```tsx
import { data } from 'react-router'

export async function loader({ params }: Route.LoaderArgs) {
  const post = await db.posts.findUnique({ where: { id: params.id } })
  if (!post) {
    // 方式 1：抛 Response
    throw new Response('Post not found', { status: 404 })
    // 方式 2：用 data() helper（更类型友好）
    throw data({ message: 'Post not found' }, { status: 404 })
  }
  return { post }
}
```

```tsx
import { isRouteErrorResponse } from 'react-router'

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return <h1>404 - {error.data}</h1>
    }
    return <h1>{error.status} {error.statusText}</h1>
  }
  return <h1>未知错误</h1>
}
```

### Server-only Imports

服务端独有的模块可以放心 import——React Router 会自动 tree-shake：

```tsx
// app/routes/users.tsx
import { db } from '~/db.server' // .server 后缀强制只在服务端
import { sendEmail } from '~/email.server'
import bcrypt from 'bcryptjs' // 即使无 .server 后缀，loader/action 内调用也会被 tree-shake

export async function loader() {
  const users = await db.users.findMany()
  return { users }
}

// 组件内只能 import client-safe 代码
export default function Users() { /* ... */ }
```

> **`.server` / `.client` 后缀约定**：文件名带 `.server.ts` 表示只能在服务器导入，编译时 client bundle 中引用会报错；`.client.ts` 反之。这是 Remix 的约定，v7 保留。

## ClientLoader：客户端数据加载

### 三种使用场景

**场景 1：纯客户端 fetch（无服务端 loader）**

```tsx
// app/routes/profile.tsx
import type { Route } from './+types/profile'

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  // 直接调外部 API（绕过 React Router server）
  const res = await fetch(`https://api.example.com/users/${params.id}`)
  return res.json()
}

// SSR 首屏时显示 fallback
export function HydrateFallback() {
  return <p>加载中…</p>
}

export default function Profile({ loaderData }: Route.ComponentProps) {
  return <h1>{loaderData.name}</h1>
}
```

**场景 2：server + client 组合**

```tsx
export async function loader({ params }: Route.LoaderArgs) {
  // 首屏 SSR 数据
  return await db.products.findUnique({ where: { id: params.id } })
}

export async function clientLoader({
  params,
  serverLoader,
}: Route.ClientLoaderArgs) {
  // 客户端导航时叠加额外数据
  const [serverData, clientData] = await Promise.all([
    serverLoader(), // 调用服务端 loader
    fetch(`/api/extras/${params.id}`).then(r => r.json()),
  ])
  return { ...serverData, ...clientData }
}

// 让 clientLoader 在初始 hydration 也运行
clientLoader.hydrate = true as const

export function HydrateFallback() {
  return <p>初始化…</p>
}
```

**场景 3：客户端缓存**

```tsx
const cache = new Map<string, any>()

export async function clientLoader({
  params,
  serverLoader,
}: Route.ClientLoaderArgs) {
  if (cache.has(params.id)) {
    return cache.get(params.id) // 命中缓存
  }
  const data = await serverLoader()
  cache.set(params.id, data)
  return data
}
```

### `clientLoader.hydrate`

默认 `clientLoader` **不参与 SSR hydration**——首屏数据来自 `loader`，client navigation 时才用 `clientLoader`。

显式设为 `true` 让 `clientLoader` 也在初始 hydration 运行（此时必须配 `HydrateFallback`）：

```ts
clientLoader.hydrate = true as const
```

## Action：数据 mutation

### 基础用法

```tsx
// app/routes/projects.new.tsx
import { Form, redirect } from 'react-router'
import type { Route } from './+types/projects.new'

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const title = String(formData.get('title'))
  const description = String(formData.get('description'))

  // 服务端校验
  const errors: Record<string, string> = {}
  if (!title || title.length < 3) {
    errors.title = '标题至少 3 个字符'
  }
  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  // 业务逻辑
  const project = await db.projects.create({ data: { title, description } })

  // 重定向到详情页
  return redirect(`/projects/${project.id}`)
}

export default function NewProject({ actionData }: Route.ComponentProps) {
  return (
    <Form method="post">
      <input name="title" />
      {actionData?.errors?.title && <p>{actionData.errors.title}</p>}
      <textarea name="description" />
      <button type="submit">创建</button>
    </Form>
  )
}
```

### 触发 action 的三种方式

**方式 1：`<Form>` 提交（导航）**

```tsx
<Form method="post" action="/projects/new">
  <input name="title" />
  <button type="submit">提交</button>
</Form>
```

**方式 2：`useSubmit()`（编程式导航 + action）**

```tsx
import { useSubmit } from 'react-router'

function MyComponent() {
  const submit = useSubmit()

  return (
    <button onClick={() => {
      submit(
        { quizTimedOut: 'true' },
        { method: 'post', action: '/end-quiz' },
      )
    }}>
      结束测验
    </button>
  )
}
```

**方式 3：`useFetcher()`（无导航）**

```tsx
import { useFetcher } from 'react-router'

function DeleteButton({ id }: { id: string }) {
  const fetcher = useFetcher()

  return (
    <fetcher.Form method="post" action="/delete">
      <input type="hidden" name="id" value={id} />
      <button type="submit">
        {fetcher.state !== 'idle' ? '删除中…' : '删除'}
      </button>
    </fetcher.Form>
  )
}
```

### Action 完成后的自动 revalidation

**核心机制**：action 成功后（状态码 2xx），React Router 自动 revalidate **当前页所有 loader**——UI 与 server 数据始终同步。

```tsx
export async function loader() {
  return { todos: await db.todos.findMany() }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  await db.todos.create({ data: { title: formData.get('title') as string } })
  return { ok: true }
  // ⬆ action 返回后，loader 自动重跑，UI 自动更新
}
```

> **状态码控制**：如果 action 返回 `data({ errors }, { status: 400 })`，**4xx / 5xx 状态码不触发 revalidation**——这是 form validation 场景的标准行为，避免无意义的数据回流。

### Server-side Validation

完整模式——服务端校验 + 错误 → 400 → 不 revalidate → 表单保留错误信息：

```tsx
import { data } from 'react-router'

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const email = String(formData.get('email'))
  const password = String(formData.get('password'))

  const errors: Record<string, string> = {}
  if (!email.includes('@')) {
    errors.email = '无效的邮箱地址'
  }
  if (password.length < 12) {
    errors.password = '密码至少 12 位'
  }

  if (Object.keys(errors).length > 0) {
    // 400 状态：不触发 revalidation
    return data({ errors }, { status: 400 })
  }

  await createUser({ email, password })
  return redirect('/dashboard')
}

export default function Signup() {
  const fetcher = useFetcher<typeof action>()
  const errors = fetcher.data?.errors

  return (
    <fetcher.Form method="post">
      <input type="email" name="email" />
      {errors?.email && <em>{errors.email}</em>}
      <input type="password" name="password" />
      {errors?.password && <em>{errors.password}</em>}
      <button type="submit">注册</button>
    </fetcher.Form>
  )
}
```

> **进阶**：搭配 [Zod](https://zod.dev/) / [Valibot](https://valibot.dev/) / [Conform](https://conform.guide/) 做类型安全的 schema 校验。Conform 专为 React Router / Remix 设计。

## Form vs. Fetcher：核心区别

| 维度 | `<Form>` | `useFetcher()` |
|---|---|---|
| 是否导航 | **是**（URL 改变） | **否** |
| 状态字段 | `navigation.state` | `fetcher.state` |
| 提交数据 | `navigation.formData` | `fetcher.formData` |
| 返回数据 | `actionData` / `useActionData()` | `fetcher.data` |
| 适用场景 | 新建记录 → 跳详情 / 登录 → 跳首页 / 删除当前页内容 → 跳列表 | 列表删除项 / 单个字段保存 / popover 加载数据 |

**经验法则**：

- **URL 应该改变** → `<Form>`
- **URL 不应该改变**（保持当前列表/页面）→ `useFetcher()`

### `useFetcher` 高级用法

**加载数据（不提交）**：

```tsx
function UserAvatar({ userId }: { userId: string }) {
  const fetcher = useFetcher<typeof loader>()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open && fetcher.state === 'idle' && !fetcher.data) {
      fetcher.load(`/api/users/${userId}`)
    }
  }, [open, fetcher, userId])

  return (
    <div onMouseEnter={() => setOpen(true)}>
      <img src="/avatar.png" />
      {open && fetcher.data && <UserPopup user={fetcher.data} />}
    </div>
  )
}
```

**编程式提交（无 Form）**：

```tsx
fetcher.submit(
  { id: '123', action: 'delete' },
  { method: 'post', action: '/items' },
)
```

**`useFetchers()`：访问所有活跃 fetcher**

```tsx
import { useFetchers } from 'react-router'

function GlobalProgress() {
  const fetchers = useFetchers()
  const busy = fetchers.some(f => f.state !== 'idle')
  return busy ? <Spinner /> : null
}
```

### Optimistic UI

`fetcher.formData` 保留提交中的数据——可立即更新 UI：

```tsx
function Task({ task }: { task: { id: string, status: string } }) {
  const fetcher = useFetcher()

  // 乐观：如果有提交中的数据，立即用它替代 task.status
  let status = task.status
  if (fetcher.formData) {
    status = fetcher.formData.get('status') as string
  }

  return (
    <fetcher.Form method="post">
      <input type="hidden" name="id" value={task.id} />
      <button
        name="status"
        value={status === 'complete' ? 'incomplete' : 'complete'}
      >
        {status === 'complete' ? '✓' : '○'}
      </button>
    </fetcher.Form>
  )
}
```

## Pending UI 状态

### `useNavigation`：全局导航状态

```tsx
import { useNavigation } from 'react-router'

export default function Root() {
  const navigation = useNavigation()
  const isNavigating = navigation.state !== 'idle'

  return (
    <>
      {isNavigating && <GlobalSpinner />}
      <Outlet />
    </>
  )
}
```

**`navigation.state` 取值**：

- `'idle'`：无导航中
- `'loading'`：正在加载新页面（loaders 执行中）
- `'submitting'`：正在提交表单（action 执行中）

**其他字段**：

```tsx
navigation.location // 目标 URL
navigation.formAction // 当前提交的 action URL
navigation.formData // 提交的 FormData
navigation.formMethod // 'GET' | 'POST' | ...
```

### `<NavLink>` 局部 pending

```tsx
<NavLink to="/dashboard">
  {({ isActive, isPending, isTransitioning }) => (
    <span className={
      [isActive && 'active', isPending && 'pending', isTransitioning && 'transitioning']
        .filter(Boolean)
        .join(' ')
    }>
      Dashboard
      {isPending && <Spinner />}
    </span>
  )}
</NavLink>
```

`<NavLink>` 自动加 CSS class：

```css
a.active { color: red; }
a.pending { animation: pulse 1s infinite; }
a.transitioning { /* view transition 进行中 */ }
```

### `useRevalidator`：手动 revalidate

某些场景（WebSocket 推送、setInterval 轮询）需要主动 revalidate 所有 loader：

```tsx
import { useRevalidator } from 'react-router'

function Dashboard() {
  const revalidator = useRevalidator()

  useEffect(() => {
    const id = setInterval(() => {
      revalidator.revalidate()
    }, 30_000)
    return () => clearInterval(id)
  }, [revalidator])

  // revalidator.state: 'idle' | 'loading'
  return revalidator.state === 'loading' ? <Spinner /> : null
}
```

## `shouldRevalidate`：控制 revalidation

默认每次 navigation / action 完成后**所有 loader 都重跑**——但某些路由数据稳定（如全站设置）不必每次刷：

```tsx
// app/routes/settings.tsx
import type { ShouldRevalidateFunctionArgs } from 'react-router'

export async function loader() {
  // 全站设置，几乎不变
  return { theme: await getGlobalTheme() }
}

export function shouldRevalidate({
  currentUrl,
  currentParams,
  nextUrl,
  nextParams,
  formMethod,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  // 只在 URL / params 变化时 revalidate
  if (currentParams.userId !== nextParams.userId) {
    return true
  }

  // POST/PUT/DELETE 触发的 action 不刷此 loader
  if (formMethod && formMethod !== 'GET') {
    return false
  }

  return defaultShouldRevalidate
}
```

> **慎用**：过度跳过 revalidation 会导致 UI 与 server 不同步。仅在确实昂贵且稳定的 loader 上使用。

## Meta：文档元信息

### v7 用法（`meta` 导出）

```tsx
import type { Route } from './+types/product'

export function meta({ data, params, matches }: Route.MetaArgs) {
  return [
    { title: `${data?.product.name} - 商品详情` },
    { name: 'description', content: data?.product.description },
    { property: 'og:title', content: data?.product.name },
    { property: 'og:image', content: data?.product.image },
    { tagName: 'link', rel: 'canonical', href: `https://example.com/products/${params.id}` },
  ]
}
```

**项目类型**：

- `{ title }` → `<title>`
- `{ name, content }` → `<meta name="..." content="...">`
- `{ property, content }` → `<meta property="..." content="...">`（OpenGraph）
- `{ tagName: 'link', rel, href }` → `<link>`
- `{ tagName: 'script', type, children }` → `<script>`（如 JSON-LD）

### React 19 用法（推荐）

React 19 原生支持把 `<title>` / `<meta>` / `<link>` 写在组件 JSX 中——React 自动 hoist 到 `<head>`：

```tsx
export default function Product({ loaderData }: Route.ComponentProps) {
  const { product } = loaderData
  return (
    <>
      <title>{product.name} - 商品详情</title>
      <meta name="description" content={product.description} />
      <meta property="og:title" content={product.name} />
      <link rel="canonical" href={`https://example.com/products/${product.id}`} />
      <h1>{product.name}</h1>
    </>
  )
}
```

> 这种写法更直观且支持子组件嵌套，但 SSR 时 React 还是会输出到 `<head>`。`meta` 导出函数仍有用——特别是需要根据父级数据 / matches 决定 meta 时。

## Links：预加载 / 样式表

```tsx
// app/routes/home.tsx
export function links() {
  return [
    // 预加载图片
    { rel: 'preload', href: '/hero.webp', as: 'image' },
    // 预连接外部资源
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    // 加载样式表
    { rel: 'stylesheet', href: 'https://example.com/styles.css' },
    // Icon
    { rel: 'icon', href: '/favicon.ico', type: 'image/x-icon' },
  ]
}
```

被 `<Links />`（root.tsx 中）聚合输出。

## Prefetching：链接预取

`<Link>` 的 `prefetch` prop 让链接被发现时预加载目标路由的 JS + loader 数据：

```tsx
import { Link } from 'react-router'

<Link to="/dashboard" prefetch="intent">Dashboard</Link>
```

**`prefetch` 取值**：

- `"none"`（默认）：不预取
- `"intent"`：鼠标 hover / focus 时预取（推荐）
- `"render"`：链接渲染时立即预取（适合首屏关键导航）
- `"viewport"`：链接进入视口时预取

```tsx
<Link to="/products" prefetch="viewport">查看商品</Link>
```

> **效果**：用户点击时数据已就绪，几乎零等待。慎用 `"render"` 防止预加载过多。

## Streaming with Suspense

把非关键数据返回为 Promise（**不 await**），UI 先渲染关键部分，非关键部分用 `<Suspense>` 包裹：

```tsx
// app/routes/dashboard.tsx
import * as React from 'react'
import { Await } from 'react-router'
import type { Route } from './+types/dashboard'

export async function loader() {
  // 关键数据：必须 await
  const user = await getCurrentUser()

  // 非关键数据：返回 Promise（不 await）
  const slowAnalytics = getSlowAnalytics() // 假设要 3 秒

  return {
    user,
    slowAnalytics, // ⬅ 这是 Promise<...>
  }
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { user, slowAnalytics } = loaderData

  return (
    <div>
      <h1>{user.name}</h1>
      <p>关键数据先渲染</p>

      {/* 非关键数据用 Suspense */}
      <React.Suspense fallback={<p>加载分析数据…</p>}>
        <Await resolve={slowAnalytics}>
          {analytics => <AnalyticsView data={analytics} />}
        </Await>
      </React.Suspense>
    </div>
  )
}
```

### React 19 用法：`React.use()`

```tsx
import * as React from 'react'

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { user, slowAnalytics } = loaderData

  return (
    <>
      <h1>{user.name}</h1>
      <React.Suspense fallback={<p>加载中…</p>}>
        <AnalyticsView promise={slowAnalytics} />
      </React.Suspense>
    </>
  )
}

function AnalyticsView({ promise }: { promise: Promise<Analytics> }) {
  const data = React.use(promise) // ⬅ React 19 新 API
  return <div>{data.pageViews}</div>
}
```

### Stream Timeout 配置

默认 4950ms 后 pending Promise 被 reject。修改：

```tsx
// app/entry.server.tsx
export const streamTimeout = 10_000 // 10 秒
```

> **重要**：`loader` 必须返回**对象包裹**的 Promise，不能直接 `return somePromise`：
>
> ```tsx
> // ❌ 错
> return slowFetch()
> // ✓ 对
> return { data: slowFetch() }
> ```

## 渲染策略

`react-router.config.ts` 控制三种策略：

### SSR（默认）

```ts
import type { Config } from '@react-router/dev/config'

export default {
  ssr: true,
} satisfies Config
```

每次请求 server 端渲染——loader 在服务器执行 + 返回完整 HTML。需要支持 SSR 的部署平台。

### SPA（`ssr: false`）

```ts
export default {
  ssr: false,
} satisfies Config
```

构建时只渲染 root 路由生成 `index.html`，运行时纯客户端。**所有数据走 `clientLoader`** + 必须配 `HydrateFallback`：

```tsx
// app/root.tsx
export function HydrateFallback() {
  return <div>加载应用…</div>
}
```

```tsx
// app/routes/products.tsx
export async function clientLoader() {
  const res = await fetch('/api/products')
  return res.json()
}

export function HydrateFallback() {
  return <p>加载商品…</p>
}
```

部署到静态 host（GitHub Pages / Cloudflare Pages / Vercel Static）—— 配置所有路径都返回 `index.html`：

```
# Netlify _redirects
/*    /index.html   200
```

### SSG（Pre-rendering）

构建时为指定 URL 生成静态 HTML + `.data` 文件：

```ts
export default {
  ssr: true, // 与 SSR 共存
  async prerender() {
    const slugs = await getPostSlugs()
    return ['/', '/about', ...slugs.map(s => `/blog/${s}`)]
  },
} satisfies Config
```

**完全静态部署（无 server）**：

```ts
export default {
  ssr: false, // SPA + SSG
  prerender: true, // 预渲染所有静态路径
} satisfies Config
```

**SPA Fallback 模式**：

```ts
export default {
  ssr: false,
  prerender: ['/', '/about-us'], // 仅预渲染指定路径，其他走 SPA fallback
} satisfies Config
```

输出：

```
build/client/
├── index.html
├── about-us/index.html
├── blog/post-1/index.html
└── __spa-fallback.html  # 其他路径用这个
```

### 并发预渲染

```ts
export default {
  ssr: true,
  prerender: {
    paths: ['/', '/about', ...slugs.map(s => `/blog/${s}`)],
    concurrency: 4, // 并发预渲染数量
  },
} satisfies Config
```

## Sessions：会话管理

### 创建 session storage

```tsx
// app/sessions.server.ts
import { createCookieSessionStorage } from 'react-router'

type SessionData = {
  userId: string
}

type SessionFlashData = {
  error: string
}

const { getSession, commitSession, destroySession } = createCookieSessionStorage<SessionData, SessionFlashData>({
  cookie: {
    name: '__session',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 一周
    path: '/',
    sameSite: 'lax',
    secrets: [process.env.SESSION_SECRET!], // 签名 secret
    secure: process.env.NODE_ENV === 'production',
  },
})

export { commitSession, destroySession, getSession }
```

### 登录

```tsx
// app/routes/login.tsx
import { redirect } from 'react-router'
import { commitSession, getSession } from '~/sessions.server'
import type { Route } from './+types/login'

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get('Cookie'))
  const formData = await request.formData()
  const email = String(formData.get('email'))
  const password = String(formData.get('password'))

  const userId = await validateCredentials(email, password)
  if (!userId) {
    session.flash('error', '用户名或密码错误')
    return redirect('/login', {
      headers: { 'Set-Cookie': await commitSession(session) },
    })
  }

  session.set('userId', userId)
  return redirect('/dashboard', {
    headers: { 'Set-Cookie': await commitSession(session) },
  })
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get('Cookie'))
  // flash 数据读取后自动清除
  const error = session.get('error')
  return new Response(JSON.stringify({ error }), {
    headers: { 'Set-Cookie': await commitSession(session) },
  })
}
```

### 登出

```tsx
import { destroySession, getSession } from '~/sessions.server'

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get('Cookie'))
  return redirect('/login', {
    headers: { 'Set-Cookie': await destroySession(session) },
  })
}
```

### Session 方法

- `session.get(key)`：读取值
- `session.set(key, value)`：写入值
- `session.flash(key, value)`：写入一次性值（读取后自动清除）
- `session.has(key)`：检查 key 是否存在
- `session.unset(key)`：删除 key

## Cookies：低层 cookie 操作

```tsx
// app/cookies.server.ts
import { createCookie } from 'react-router'

export const userPrefs = createCookie('user-prefs', {
  maxAge: 60 * 60 * 24 * 7, // 一周
  secrets: [process.env.COOKIE_SECRET!],
})
```

```tsx
// app/routes/preferences.tsx
import { redirect } from 'react-router'
import { userPrefs } from '~/cookies.server'
import type { Route } from './+types/preferences'

export async function loader({ request }: Route.LoaderArgs) {
  const cookieHeader = request.headers.get('Cookie')
  const cookie = (await userPrefs.parse(cookieHeader)) || {}
  return { showBanner: cookie.showBanner }
}

export async function action({ request }: Route.ActionArgs) {
  const cookieHeader = request.headers.get('Cookie')
  const cookie = (await userPrefs.parse(cookieHeader)) || {}
  const formData = await request.formData()

  if (formData.get('bannerVisibility') === 'hidden') {
    cookie.showBanner = false
  }

  return redirect('/', {
    headers: { 'Set-Cookie': await userPrefs.serialize(cookie) },
  })
}
```

## Resource Routes：API endpoints

**没有 default export** 的路由模块就是 Resource Route——用于返回非 HTML 响应：

```tsx
// app/routes/reports.$id[.pdf].ts
import type { Route } from './+types/reports.$id.pdf'

export async function loader({ params }: Route.LoaderArgs) {
  const report = await getReport(params.id)
  const pdf = await generatePDF(report)

  return new Response(pdf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="report-${params.id}.pdf"`,
    },
  })
}
```

### JSON API

```tsx
// app/routes/api.users.ts
import type { Route } from './+types/api.users'

export async function loader() {
  const users = await db.users.findMany()
  return Response.json({ users })
}

export async function action({ request }: Route.ActionArgs) {
  const body = await request.json()
  const user = await db.users.create({ data: body })
  return Response.json({ user }, { status: 201 })
}
```

### 链接到 Resource Route

正常 `<Link to="/api/users">` **不会工作**（React Router 会尝试客户端导航）——用 `reloadDocument`：

```tsx
<Link reloadDocument to="/reports/123.pdf">下载 PDF</Link>

// 或原生 <a>
<a href="/reports/123.pdf">下载 PDF</a>
```

### 错误处理

```tsx
export async function loader({ params }: Route.LoaderArgs) {
  const data = await fetchData(params.id)
  if (!data) {
    // throw new Response → 不触发 handleError，按你的状态码返回
    throw new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // throw new Error → 触发 handleError，返回 500
  if (!data.isPublic) {
    throw new Error('Permission denied')
  }

  return Response.json(data)
}
```

## Type Safety：自动类型生成

### 工作原理

React Router Vite plugin 在 dev / build 时：

1. 读取 `app/routes.ts`
2. 为每个路由生成 `.react-router/types/+types/<route>.d.ts`
3. `tsconfig.json` 的 `rootDirs` 让你能像同级文件一样 import

### 配置

```json
// tsconfig.json
{
  "include": [".react-router/types/**/*"],
  "compilerOptions": {
    "rootDirs": [".", "./.react-router/types"],
    "types": ["@react-router/node", "vite/client"],
    "verbatimModuleSyntax": true
  }
}
```

```
# .gitignore
.react-router/
```

### 使用

```tsx
// app/routes/product.tsx
import type { Route } from './+types/product' // ✨ 自动生成的类型

export async function loader({ params }: Route.LoaderArgs) {
  // params 类型自动为 { productId: string }（基于 routes.ts 中的 ":productId"）
  return { product: await getProduct(params.productId) }
}

export default function Product({ loaderData }: Route.ComponentProps) {
  // loaderData 类型自动推导
  return <h1>{loaderData.product.name}</h1>
}
```

### 生成的类型

每个路由的 `+types/<file>.d.ts` 提供：

- `Route.LoaderArgs`
- `Route.ClientLoaderArgs`
- `Route.ActionArgs`
- `Route.ClientActionArgs`
- `Route.MetaArgs`
- `Route.ErrorBoundaryProps`
- `Route.HydrateFallbackProps`
- `Route.ComponentProps`（含 `loaderData` / `actionData` / `params` / `matches`）

### `typegen` 命令

```bash
# 手动生成
npx react-router typegen

# Watch 模式
npx react-router typegen --watch

# 在 CI 中作为 typecheck 前置
"scripts": {
  "typecheck": "react-router typegen && tsc"
}
```

### Type AppLoadContext

如果用自定义服务器传入 context：

```ts
// app/load-context.ts
import 'react-router'

declare module 'react-router' {
  interface AppLoadContext {
    db: Database
    user: User | null
  }
}
```

```tsx
export async function loader({ context }: Route.LoaderArgs) {
  // context.db 已类型化
  return { users: await context.db.users.findMany() }
}
```

## 客户端代码切割

### Lazy Route Discovery（v7 默认）

React Router 自动 code-split 每个路由——访问 `/about` 才下载 `about.tsx` 的 bundle：

```
build/client/assets/
├── root-abc123.js          # root.tsx
├── home-def456.js          # routes/home.tsx
├── about-ghi789.js         # routes/about.tsx（仅访问 /about 时下载）
└── dashboard-jkl012.js     # routes/dashboard.tsx
```

无需手动 `React.lazy()`——Vite plugin 全自动。

### `.client` 模块：仅客户端代码

某些模块只能在客户端运行（如 Three.js / Monaco Editor）：

```tsx
// app/lib/monaco.client.tsx
import * as monaco from 'monaco-editor'
export function createEditor(el: HTMLElement) {
  return monaco.editor.create(el, { /* ... */ })
}
```

```tsx
// app/routes/editor.tsx
import { useEffect, useRef } from 'react'
import { createEditor } from '~/lib/monaco.client'

export default function Editor() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      createEditor(ref.current)
    }
  }, [])

  return <div ref={ref} style={{ height: 600 }} />
}
```

> 文件名带 `.client.tsx` 后缀——server bundle 中此 import 会变 `undefined`，必须在 `useEffect` 中使用。

### `.server` 模块：仅服务端代码

```tsx
// app/db.server.ts
import { PrismaClient } from '@prisma/client'
export const db = new PrismaClient()
```

```tsx
// app/routes/users.tsx
import { db } from '~/db.server' // ✓ 在 loader / action 中安全

export async function loader() {
  return { users: await db.users.findMany() }
}

// ❌ 错误：组件代码会进 client bundle
// const allUsers = await db.users.findMany()
```

> client bundle 中 import `.server.ts` 文件会**编译错误**——这是 React Router 强制的安全检查。

## 进阶：Middleware（unstable）

v7.3+ 开始加入 `middleware` 支持——还在 unstable，需在 config 中启用：

```ts
// react-router.config.ts
export default {
  future: {
    unstable_middleware: true,
  },
} satisfies Config
```

```tsx
// app/routes/admin.tsx
import type { Route } from './+types/admin'

async function authMiddleware({ request, context }: Route.MiddlewareArgs, next: Route.MiddlewareNext) {
  const user = await getUserFromSession(request)
  if (!user || user.role !== 'admin') {
    return new Response('Unauthorized', { status: 401 })
  }

  // 把 user 写入 context 供下游 loader 使用
  context.user = user
  return next()
}

async function loggingMiddleware({ request }: Route.MiddlewareArgs, next: Route.MiddlewareNext) {
  const start = performance.now()
  const response = await next()
  console.log(`${request.method} ${request.url} - ${performance.now() - start}ms`)
  return response
}

export const middleware = [loggingMiddleware, authMiddleware]

export async function loader({ context }: Route.LoaderArgs) {
  // context.user 已被 middleware 注入
  return { user: context.user }
}
```

> middleware 与 Next.js / SolidStart 的差异：React Router 的 middleware **沿路由树执行**——父路由的 middleware 先于子路由的 middleware。

## 部署 Adapter

### Node + react-router-serve（默认）

```bash
npm run build
npm run start
# 启动 react-router-serve 在端口 3000
```

适合开发预览，生产建议自定义 Express server 或用专用 adapter。

### 自定义 Express server

```ts
// server.ts
import { createRequestHandler } from '@react-router/express'
import express from 'express'

const app = express()
app.use(express.static('build/client'))
app.all('*', createRequestHandler({
  build: await import('./build/server/index.js'),
}))
app.listen(3000)
```

### Cloudflare Workers

```ts
// app/load-context.ts
import 'react-router'
import type { Env } from './worker-configuration'

declare module 'react-router' {
  interface AppLoadContext {
    cloudflare: {
      env: Env
      ctx: ExecutionContext
    }
  }
}
```

```ts
// workers/app.ts
import { createRequestHandler } from 'react-router'

export default {
  fetch(request, env, ctx) {
    const handler = createRequestHandler(
      // @ts-expect-error
      () => import('virtual:react-router/server-build'),
      import.meta.env.MODE,
    )
    return handler(request, { cloudflare: { env, ctx } })
  },
} satisfies ExportedHandler<Env>
```

### Vercel

用官方模板：

```bash
npx create-react-router@latest --template remix-run/react-router-templates/vercel
```

或在已有项目添加 `vercel.json`：

```json
{
  "buildCommand": "react-router build",
  "framework": "react-router"
}
```

### Netlify

```bash
npx create-react-router@latest --template netlify-templates/react-router-template
```

## 与 TanStack Router 对比

| 维度 | React Router v7 (Framework) | TanStack Router |
|---|---|---|
| 定位 | 路由 + 元框架 | 纯客户端路由（无元框架） |
| SSR | ✓ 内置 | 用 TanStack Start 补足 |
| 路由配置 | `routes.ts` + 文件路由可选 | 文件路由（首选） |
| 类型生成 | `react-router typegen` | 自动 + 完美 |
| Search Params 类型 | 弱（手动 parse） | 强（schema 校验） |
| 数据加载 | `loader` + `clientLoader` | `loader` + Query 库（TanStack Query） |
| Mutation | `action` + `Form` | 手写（搭配 Mutation 库） |
| 生态 | React 路由市占第一 | 新兴，类型粉丝多 |
| 适用 | 全栈 React 应用 | 客户端类型敏感的 SPA |

> **结论**：需要全栈 + 表单友好选 React Router；纯客户端 + 极致 TypeScript 选 TanStack Router；想要 SSR + TanStack 选 TanStack Start。

## 常见踩坑

### 1. `.client` / `.server` 边界

**错误**：

```tsx
// app/routes/page.tsx
import { db } from '~/db' // 没加 .server 后缀

// 组件里调用——会进 client bundle，运行时报错
export default function Page() {
  // ❌ Module not found: Can't resolve 'pg' (server only deps)
  const users = db.users.findAll()
  return <div>{users.length}</div>
}
```

**修复**：

```tsx
// app/db.server.ts
export const db = new PrismaClient()

// app/routes/page.tsx
import { db } from '~/db.server'

// 只能在 loader / action 调用
export async function loader() {
  return { users: await db.users.findMany() }
}
```

### 2. Loader 序列化失败

**错误**：

```tsx
export async function loader() {
  return {
    user: { name: 'Alice', logout: () => signOut() }, // ❌ 函数不可序列化
  }
}
```

**修复**：loader 返回值只放数据，函数留在 client：

```tsx
export async function loader() {
  return { user: { name: 'Alice' } }
}

export default function Profile({ loaderData }: Route.ComponentProps) {
  const logout = () => signOut() // ✓ 函数在客户端定义
  return (
    <>
      {loaderData.user.name}
      <button onClick={logout}>退出</button>
    </>
  )
}
```

### 3. Action 后没自动刷新

**症状**：删除一条 todo 后列表不更新。

**原因**：action 返回了 4xx 状态码：

```tsx
import { data } from 'react-router'

export async function action() {
  // 即使要返回错误也别用 status:400 + ok:false
  // 改为 throw 错误 或 return 200 ok
  return data({ ok: false }, { status: 400 }) // ⚠️ 不会触发 revalidation
}
```

**修复**：

```tsx
export async function action({ request }: Route.ActionArgs) {
  try {
    await deleteTodo(formData.get('id'))
    return { ok: true } // ✓ 200，触发 revalidation
  }
  catch (e) {
    // 业务错误用 4xx + 不 revalidate（保留错误信息）
    return data({ ok: false, error: '删除失败' }, { status: 400 })
  }
}
```

### 4. 子路由数据没 type 推导

**症状**：

```tsx
// app/routes/posts.tsx（父路由）
export async function loader() {
  return { posts: await getPosts() }
}

// app/routes/posts.detail.tsx（子路由）
export default function Detail() {
  // ❌ 怎么拿 父 loader 的 posts？
}
```

**修复**：用 `useRouteLoaderData`：

```tsx
// 给父路由起 id（在 routes.ts）
route('posts', './routes/posts.tsx', {
  id: 'posts', // 给路由起名
}, [
  route(':id', './routes/posts.detail.tsx'),
])
```

```tsx
import { useRouteLoaderData } from 'react-router'
import type { loader as postsLoader } from './posts'

export default function Detail() {
  const parentData = useRouteLoaderData<typeof postsLoader>('posts')
  return <div>父路由有 {parentData?.posts.length} 篇文章</div>
}
```

### 5. SPA 模式下 `loader` 不工作

**错误**：

```ts
// react-router.config.ts
export default { ssr: false }
```

```tsx
// app/routes/page.tsx
export async function loader() {
  // ⚠️ ssr: false 时这个 loader 仅在构建时（SSG）运行一次
  return { data: await fetchData() }
}
```

**修复**：SPA 模式用 `clientLoader`：

```tsx
export async function clientLoader() {
  return { data: await fetchData() }
}

export function HydrateFallback() {
  return <p>加载中…</p>
}
```

### 6. 表单提交后 URL 变了但页面没跳转

**症状**：

```tsx
<Form method="post">
  {/* action 提交后 URL 变成 /posts?_data=xxx，没跳转 */}
</Form>
```

**原因**：action 没返回 `redirect()`。

**修复**：

```tsx
import { redirect } from 'react-router'

export async function action() {
  await createPost(...)
  return redirect('/posts') // ✓ 主动重定向
}
```

### 7. Remix → v7 迁移后 `LinksFunction` / `MetaFunction` 类型不存在

**症状**：

```tsx
// 旧 Remix v2 代码
import type { MetaFunction } from '@remix-run/node'

export const meta: MetaFunction = () => [{ title: 'Home' }]
```

**修复**：用 `Route.MetaArgs`：

```tsx
import type { Route } from './+types/home'

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Home' }]
}
```

### 8. Search Params 类型化

**症状**：`useSearchParams` 返回的全是 `string | null`，没有自动推导。

**修复**：手动 parse 或用 Zod：

```tsx
import { useSearchParams } from 'react-router'
import { z } from 'zod'

const searchSchema = z.object({
  page: z.coerce.number().default(1),
  q: z.string().default(''),
})

function SearchPage() {
  const [searchParams] = useSearchParams()
  const { page, q } = searchSchema.parse(Object.fromEntries(searchParams))
  // page: number, q: string
}
```

> 如果对 search params 类型有强需求，考虑 TanStack Router——它原生支持 search params schema。

### 9. ScrollRestoration 与单页 modal

**症状**：开 modal 时滚动位置丢了。

**原因**：`<ScrollRestoration />` 在 navigation 时重置滚动；如果你通过 `useNavigate` 改 URL 开 modal，滚动会重置。

**修复**：用 `preventScrollReset`：

```tsx
import { useNavigate } from 'react-router'

const navigate = useNavigate()
navigate('?modal=true', { preventScrollReset: true })
```

或 `<Link preventScrollReset>`。

## 测试

详见 [入门 - 测试](./getting-started.md) 章节简介。完整测试方案：

- 单元测试：用 `createRoutesStub` 把组件包在 router context 中
- E2E：[Playwright](https://playwright.dev/) / [Cypress](https://www.cypress.io/) 跑真实浏览器

```tsx
// __tests__/login-form.test.tsx
import { createRoutesStub } from 'react-router'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '~/components/login-form'

test('显示验证错误', async () => {
  const Stub = createRoutesStub([
    {
      path: '/login',
      Component: LoginForm,
      action: () => ({
        errors: { email: '无效邮箱' },
      }),
    },
  ])

  render(<Stub initialEntries={['/login']} />)
  await userEvent.click(screen.getByRole('button', { name: '登录' }))
  expect(await screen.findByText('无效邮箱')).toBeInTheDocument()
})
```

## 下一步

- [参考](./reference.md)：所有 Hooks / Components / Route Module exports / 配置项的速查表
