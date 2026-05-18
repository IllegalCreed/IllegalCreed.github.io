---
layout: doc
outline: [2, 3]
---

# 指南 - 基础

> App Router 基础：文件约定、Server / Client Components、Server Actions、Route Handler

## 速查

- 文件约定：`layout` / `page` / `loading` / `error` / `not-found` / `route` / `template` / `default` / `global-error`
- 路由：文件夹 = URL 段，方括号 `[slug]` = 动态，`[...slug]` = catch-all，`[[...slug]]` = 可选 catch-all
- 路由分组：`(group)` 不影响 URL；私有目录 `_folder` 不参与路由
- Server Component：默认；`async`，无 hooks，可直连 DB
- Client Component：`'use client'`；可用 hooks / events / browser API
- Server Actions：`'use server'`；`<form action={fn}>` 或事件调用；POST 提交
- Route Handler：`route.ts`；GET / POST / PUT / DELETE / PATCH / HEAD / OPTIONS
- `params` / `searchParams` / `cookies()` / `headers()` 都是 **Promise**，必须 `await`
- 数据获取：Server Component 里 `async/await`；Client 用 `use()` + `<Suspense>` 或 SWR / TanStack Query

## 文件约定全貌

App Router 用文件名约定决定每个路由段的行为。一个完整路由段可以包含：

```
app/dashboard/
├── layout.tsx          # 包子树的 UI（共享头/侧边栏）
├── template.tsx        # 类似 layout 但每次导航重新挂载
├── loading.tsx         # Suspense fallback（包子 page）
├── error.tsx           # Error boundary（'use client'）
├── not-found.tsx       # 404 UI（notFound() 触发）
├── page.tsx            # 路由公开页面
└── route.ts            # API 端点（与 page.tsx 互斥）
```

组件树嵌套层级：

```
<Layout>
  <Template>
    <ErrorBoundary fallback={<Error />}>
      <Suspense fallback={<Loading />}>
        <ErrorBoundary fallback={<NotFound />}>
          <Page />   {/* 或 nested <Layout> 包子段 */}
        </ErrorBoundary>
      </Suspense>
    </ErrorBoundary>
  </Template>
</Layout>
```

### `layout.tsx` —— 共享 UI

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dashboard-shell">
      <aside>Sidebar</aside>
      <main>{children}</main>
    </div>
  )
}
```

特性：

- **导航时不重新渲染**：从 `/dashboard/a` 到 `/dashboard/b`，layout 保持挂载，状态、scroll 都保留
- **嵌套**：任意子目录可加 `layout.tsx`，自动包子树
- **根布局必需 `<html>` + `<body>`**：唯一可以加这两个标签的地方
- 只能拿 `params`，**不能拿 `searchParams` / `pathname`**（拿了也会因为不重渲染而陈旧）

要在 Layout 里拿当前 pathname 必须用 Client Component 子组件：

```tsx
// app/components/NavLinks.tsx
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function NavLinks() {
  const pathname = usePathname()
  return (
    <nav>
      <Link href="/" className={pathname === '/' ? 'active' : ''}>Home</Link>
      <Link href="/about" className={pathname === '/about' ? 'active' : ''}>About</Link>
    </nav>
  )
}
```

### `template.tsx` —— 每次导航重新挂载

Template 包子 layout / page，与 layout 不同的是它**每次导航都重新挂载** —— 状态丢、useEffect 重跑。适合：

- 进入路由的 enter/leave 动画
- 每次访问都要重置的 form
- 依赖 `useEffect` 的日志 / analytics

```tsx
// app/dashboard/template.tsx
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="fade-in">{children}</div>
}
```

> 大多数情况用 `layout.tsx` 即可。Template 是少数场景的逃生口。

### `loading.tsx` —— Suspense fallback

```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return <div className="skeleton">Loading dashboard...</div>
}
```

Next.js 自动把它包成 `<Suspense>` 围住 `page.tsx` 与其子树：

```tsx
<Layout>
  <Suspense fallback={<Loading />}>
    <Page />
  </Suspense>
</Layout>
```

只对 **`page.tsx` 内的 async 工作**生效。如果 layout 自己有 async 拿请求数据（如 `cookies()`），loading 不会触发（layout 比 Suspense 边界更外层），需要在 layout 内手动包 Suspense。

### `error.tsx` —— Error Boundary

```tsx
// app/dashboard/error.tsx
'use client'   // 必须是 Client Component

import { useEffect } from 'react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
    // reportError(error)
  }, [error])

  return (
    <div>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

> Next.js 16 起 `reset` 改名 `unstable_retry`（仍然存在，但 API 升级中）。
>
> Error boundary 只捕获 React **渲染**中的错误。事件处理 / `useEffect` 中的错误不捕获，需手动 `try/catch`。

### `not-found.tsx` —— 404

```tsx
// app/blog/[slug]/not-found.tsx
export default function NotFound() {
  return (
    <div>
      <h2>Post not found</h2>
    </div>
  )
}
```

```tsx
// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation'

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()      // 抛出，触发最近的 not-found.tsx

  return <article>{post.title}</article>
}
```

### `global-error.tsx` —— 根级 error boundary

捕获**根布局**自身的错误。必须自己写 `<html>` + `<body>`（替换根布局）：

```tsx
// app/global-error.tsx
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <h2>Critical error</h2>
        <button onClick={reset}>Try again</button>
      </body>
    </html>
  )
}
```

### `route.ts` —— API 端点

详见下面 [Route Handler](#route-handler-完整) 章节。

## 路由

### 嵌套路由

```
app/
├── page.tsx                     # /
├── blog/
│   ├── page.tsx                 # /blog
│   └── [slug]/
│       └── page.tsx             # /blog/:slug
└── shop/
    ├── page.tsx                 # /shop
    └── [...slug]/
        └── page.tsx             # /shop/* (catch-all)
```

### 动态段

```tsx
// app/blog/[slug]/page.tsx
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params   // Next.js 15+: 必须 await
  return <h1>Post: {slug}</h1>
}
```

多个动态段：

```tsx
// app/shop/[category]/[item]/page.tsx → /shop/clothing/shirts
export default async function Page({
  params,
}: {
  params: Promise<{ category: string; item: string }>
}) {
  const { category, item } = await params
  return <h1>{category} / {item}</h1>
}
```

Catch-all：

```tsx
// app/docs/[...slug]/page.tsx → /docs/a, /docs/a/b/c
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params  // ['a'] 或 ['a', 'b', 'c']
  return <h1>Docs: {slug.join(' / ')}</h1>
}
```

可选 catch-all：`[[...slug]]` 多匹配 `/docs`（slug 为空数组）。

### `searchParams`

只在 **`page.tsx`** 可拿（layout 拿不到，会陈旧），是 Promise：

```tsx
// app/shop/page.tsx → /shop?sort=asc&page=2
export default async function Shop({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { sort = 'asc', page = '1' } = await searchParams
  const products = await fetchProducts({ sort, page: +page })
  return <ProductList products={products} />
}
```

使用 `searchParams` 会**强制路由进入 dynamic rendering**（每次请求都跑），无法静态化。

### 路由分组 `(group)`

括号包裹的目录**不参与 URL** 但能共享 layout：

```
app/
├── (marketing)/
│   ├── layout.tsx               # 营销页布局
│   ├── page.tsx                 # /
│   └── about/page.tsx           # /about
└── (shop)/
    ├── layout.tsx               # 商城布局
    ├── products/page.tsx        # /products
    └── cart/page.tsx            # /cart
```

`(marketing)` 与 `(shop)` 完全不出现在 URL；两个分组可以有完全不同的 layout，互不影响。

### 私有目录 `_folder`

下划线开头的目录**不参与路由**，用来放工具组件、helper：

```
app/blog/
├── _components/                 # 不会变成路由
│   └── PostCard.tsx
├── _lib/
│   └── api.ts
└── [slug]/page.tsx
```

需要 URL 里真带下划线，用 `%5F` 编码。

### Parallel Routes（并行路由）

同一 URL 渲染多个 page，slot 名以 `@` 开头：

```
app/dashboard/
├── layout.tsx
├── page.tsx
├── @analytics/page.tsx          # slot 1
└── @team/page.tsx               # slot 2
```

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  analytics,
  team,
}: {
  children: React.ReactNode
  analytics: React.ReactNode
  team: React.ReactNode
}) {
  return (
    <>
      {children}
      <section>
        {analytics}
        {team}
      </section>
    </>
  )
}
```

> Next.js 16 起 parallel routes 的每个 slot 都**必须** 有 `default.tsx`（用 `notFound()` 或返回 `null`），否则 build 失败。

### Intercepting Routes（拦截路由）

`(.)folder` / `(..)folder` / `(...)folder` 在当前 layout 内渲染另一路由（典型用法：列表 → 模态框预览）：

```
app/
├── feed/page.tsx                # /feed
├── photo/[id]/page.tsx          # /photo/:id（独立访问）
└── feed/
    └── (..)photo/[id]/page.tsx  # 从 /feed 点击进入时，作为模态层覆盖在 /feed 上
```

## Server Components

App Router 默认所有组件都是 Server Component。它们：

- 在**服务端**渲染，产物是 RSC Payload（紧凑的二进制流），传给客户端
- 不进客户端 JS bundle
- 可以 `async/await` 拉数据
- 可以读 `cookies()` / `headers()` / 环境变量 / 数据库
- **不能**用 `useState` / `useEffect` 等 hooks，**不能**用浏览器 API、事件处理

### 在 Server Component 里拉数据

```tsx
// app/products/page.tsx
export default async function Products() {
  const res = await fetch('https://api.example.com/products', {
    next: { revalidate: 3600 },   // 1 小时 ISR
  })
  const products = await res.json()

  return (
    <ul>
      {products.map((p: any) => (
        <li key={p.id}>{p.name} - ${p.price}</li>
      ))}
    </ul>
  )
}
```

### 直连数据库 / ORM

凭据与查询完全不进客户端：

```tsx
// app/users/page.tsx
import { db, users } from '@/lib/db'

export default async function Users() {
  const allUsers = await db.select().from(users)
  return <ul>{allUsers.map(u => <li key={u.id}>{u.name}</li>)}</ul>
}
```

### `server-only` 防止误导入

为防止 server-only 代码被误导入 Client Component，用 `server-only` 包：

```ts
// lib/data.ts
import 'server-only'

export async function getSecretData() {
  return fetch('https://api.example.com', {
    headers: { authorization: `Bearer ${process.env.API_KEY}` },
  })
}
```

如果 Client Component import 这个模块，build 会报错。

对应的 `client-only` 标记客户端独占的代码（如读 `window`）。

## Client Components

文件顶部加 `'use client'` 即标为 Client Component：

```tsx
'use client'

import { useState, useEffect } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    console.log('mounted')
  }, [])

  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

### `'use client'` 是边界

加了 `'use client'` 的文件 + 它**直接 import 的所有模块** 都进客户端 bundle。

- ✅ Client Component A → import Client Component B：B 也进 bundle
- ✅ Client Component A → import Server Component S：**不允许**（直接 import），但允许通过 `children` prop 传入

```tsx
// app/components/Modal.tsx
'use client'

export default function Modal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return open ? <div>{children}</div> : null
}
```

```tsx
// app/page.tsx（Server Component）
import Modal from './components/Modal'
import ServerOnlyContent from './ServerOnlyContent'

export default function Page() {
  return (
    <Modal>
      <ServerOnlyContent />   {/* Server Component 作为 children 传入 */}
    </Modal>
  )
}
```

`ServerOnlyContent` 在服务端渲染，渲染结果作为 RSC Payload 传给客户端，由 `Modal` 控制何时显示 —— 它的代码不进 bundle。

### Context Provider 必须是 Client Component

React Context 在 RSC 中不支持，需要包 Client Component：

```tsx
// app/theme-provider.tsx
'use client'

import { createContext, useState } from 'react'

export const ThemeContext = createContext('light')

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme] = useState('dark')
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}
```

```tsx
// app/layout.tsx（Server Component）
import ThemeProvider from './theme-provider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
```

Provider 包 `{children}`，里面的 Server Components 仍在服务端渲染，但任意子 Client Component 都能 `useContext` 拿到。

### 跨边界传 props 必须可序列化

```tsx
// ✅ 字符串、数字、对象、数组、Date、Map、Set、Promise（不 await）
<ClientComp str="x" num={1} obj={{ a: 1 }} arr={[1]} date={new Date()} />

// ❌ 函数（除 Server Action）、Symbol、Error 实例、JSX（除 children）
<ClientComp fn={() => {}} />
```

唯一允许"跨边界"的函数：**Server Action**（自动序列化为 RPC 调用）。

## Server Actions

异步函数标 `'use server'`，可从客户端调用：

### 创建

**方式 1：独立文件**，整文件标 use server：

```ts
// app/actions.ts
'use server'

export async function createPost(formData: FormData) {
  await db.post.create({
    data: { title: formData.get('title') as string },
  })
}

export async function deletePost(id: number) {
  await db.post.delete({ where: { id } })
}
```

**方式 2：内联在 Server Component**：

```tsx
// app/page.tsx
export default function Page() {
  async function createPost(formData: FormData) {
    'use server'
    // ...
  }

  return <form action={createPost}>...</form>
}
```

### 调用：作为 form action

```tsx
import { createPost } from '@/app/actions'

export default function Page() {
  return (
    <form action={createPost}>
      <input name="title" required />
      <button type="submit">Create</button>
    </form>
  )
}
```

**渐进增强**：JS 没加载好时表单依然能提交（标准 HTML POST），React 加载后接管为 SPA 提交。

### 调用：在 Client Component 里

```tsx
'use client'

import { useTransition } from 'react'
import { createPost } from '@/app/actions'

export default function CreateButton() {
  const [pending, startTransition] = useTransition()

  return (
    <button
      onClick={() => {
        startTransition(async () => {
          await createPost(new FormData())
        })
      }}
      disabled={pending}
    >
      {pending ? 'Creating...' : 'Create'}
    </button>
  )
}
```

### `useActionState` —— 处理返回值

React 19 的 hook，把 action 跟一个 state 绑定：

```tsx
// app/actions.ts
'use server'

export async function submitContact(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  if (!email.includes('@')) {
    return { error: 'Invalid email' }
  }

  await db.contact.create({ data: { email } })
  return { success: true }
}
```

```tsx
'use client'

import { useActionState } from 'react'
import { submitContact } from '@/app/actions'

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContact, null)

  return (
    <form action={formAction}>
      <input name="email" type="email" />
      <button disabled={pending}>{pending ? 'Submitting...' : 'Submit'}</button>
      {state?.error && <p style={{ color: 'red' }}>{state.error}</p>}
      {state?.success && <p style={{ color: 'green' }}>Sent!</p>}
    </form>
  )
}
```

### `useFormStatus` —— 表单子组件读 pending

```tsx
'use client'

import { useFormStatus } from 'react-dom'

export function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button disabled={pending}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  )
}
```

放在 `<form>` 内任意层级，自动读父表单的 pending 状态。

### Server Action 配合 `redirect` / `revalidate`

```ts
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPost(formData: FormData) {
  const post = await db.post.create({
    data: { title: formData.get('title') as string },
  })

  revalidatePath('/posts')         // /posts 缓存失效，下次访问重新拉
  // 或 revalidateTag('posts')      // 所有 tag='posts' 的 fetch 失效
  redirect(`/posts/${post.id}`)   // 抛出 redirect，函数后续不执行
}
```

### Server Actions 安全

> Server Actions 可以被**直接 POST 请求触发**，不只通过你的表单 UI。
>
> **必须**在每个 action 内做权限校验，**不要**信任 UI 拒绝就够了。

```ts
'use server'

import { auth } from '@/lib/auth'

export async function deletePost(id: number) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const post = await db.post.findUnique({ where: { id } })
  if (post?.userId !== session.user.id) throw new Error('Forbidden')

  await db.post.delete({ where: { id } })
}
```

## Route Handler 完整

`route.ts` / `route.js` 创建一个 API 端点。**与同一目录的 `page.tsx` 互斥**（同一段不能同时是页面和 API）。

### 基础

```ts
// app/api/hello/route.ts
export async function GET() {
  return Response.json({ message: 'Hello' })
}
```

支持的方法：`GET` / `HEAD` / `POST` / `PUT` / `DELETE` / `PATCH` / `OPTIONS`。

未定义的方法返回 405。OPTIONS 不定义时 Next.js 自动实现（用于 CORS preflight）。

### 读 Request

```ts
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  // JSON body
  const body = await request.json()

  // 表单 body
  const formData = await request.formData()

  // 文本 body
  const text = await request.text()

  // Query string
  const query = request.nextUrl.searchParams.get('q')

  // Headers
  const auth = request.headers.get('authorization')

  // Cookies
  const sessionId = request.cookies.get('session')?.value

  return Response.json({ ok: true })
}
```

### 动态段

```ts
// app/api/users/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await db.user.findUnique({ where: { id } })
  if (!user) return new Response('Not Found', { status: 404 })
  return Response.json(user)
}
```

### 设置 Cookie / Header

```ts
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.set('session', 'abc123', {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return new Response('OK', {
    headers: { 'X-Custom': 'foo' },
  })
}
```

### 缓存（Next.js 15+ 默认 dynamic）

```ts
// 默认：每次请求都跑（dynamic）
export async function GET() { ... }

// 强制静态：build 时跑一次，存为静态
export const dynamic = 'force-static'
export async function GET() { ... }

// ISR：60 秒 revalidate
export const revalidate = 60
export async function GET() {
  const data = await fetch('https://api.example.com/data')
  return Response.json(await data.json())
}
```

> Next.js 15 起 `GET` 默认 dynamic（之前默认 static）。要静态必须显式 `dynamic = 'force-static'`。

### Streaming（流式响应）

```ts
function iteratorToStream(iterator: AsyncIterator<Uint8Array>) {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next()
      if (done) controller.close()
      else controller.enqueue(value)
    },
  })
}

async function* generate() {
  const encoder = new TextEncoder()
  yield encoder.encode('<p>One</p>')
  await new Promise(r => setTimeout(r, 200))
  yield encoder.encode('<p>Two</p>')
}

export async function GET() {
  return new Response(iteratorToStream(generate()))
}
```

常配 OpenAI / Anthropic 等 LLM 的 SSE 流。

### CORS

单个 Route Handler 设 CORS：

```ts
export async function GET() {
  return Response.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
```

跨多个 Route 用 Middleware/Proxy（详见高级章节）或 `next.config.ts` 的 `headers()` 配置。

### Webhook

```ts
import crypto from 'node:crypto'

export async function POST(request: Request) {
  const signature = request.headers.get('x-webhook-signature')
  const body = await request.text()

  const expected = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')

  if (signature !== expected) {
    return new Response('Invalid signature', { status: 401 })
  }

  const data = JSON.parse(body)
  // process webhook...
  return new Response('OK')
}
```

### Static Generation

```ts
// app/api/posts/[id]/route.ts
export const dynamic = 'force-static'

export async function generateStaticParams() {
  const posts = await getAllPostIds()
  return posts.map(id => ({ id }))
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const post = await getPost(id)
  return Response.json(post)
}
```

build 时为 `generateStaticParams` 返回的每个 id 生成静态 JSON。

## 数据获取（Server Component）

### `fetch` 选项

```ts
// 不缓存（默认，Next.js 15+）
await fetch(url)

// 强制缓存（直到 build 或 revalidate）
await fetch(url, { cache: 'force-cache' })

// 不缓存（显式）
await fetch(url, { cache: 'no-store' })

// ISR：指定秒数 revalidate
await fetch(url, { next: { revalidate: 60 } })

// 打 tag
await fetch(url, { next: { tags: ['posts', 'user-1'] } })

// 组合：缓存 + 打 tag
await fetch(url, {
  next: { revalidate: 3600, tags: ['posts'] },
})
```

### 并行 vs 串行

**串行**（一个等另一个）：

```ts
const user = await getUser()
const posts = await getPosts(user.id)   // posts 等 user
```

**并行**（同时发起）：

```ts
const userPromise = getUser()
const postsPromise = getPosts()
const [user, posts] = await Promise.all([userPromise, postsPromise])
```

或在不同子组件里分别 await（每个 Server Component 自己 await，并行不阻塞）：

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <>
      <Suspense fallback={<div>Loading user...</div>}>
        <UserSection />
      </Suspense>
      <Suspense fallback={<div>Loading posts...</div>}>
        <PostsSection />
      </Suspense>
    </>
  )
}

async function UserSection() {
  const user = await getUser()
  return <h1>{user.name}</h1>
}

async function PostsSection() {
  const posts = await getPosts()
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>
}
```

`UserSection` 与 `PostsSection` 并行渲染，谁先 ready 谁先 stream 到客户端。

### `React.cache` —— 同一渲染内去重

非 `fetch` 的数据获取（ORM 调用）多次重复时用 `cache()`：

```ts
import { cache } from 'react'

export const getUser = cache(async (id: string) => {
  return db.user.findUnique({ where: { id } })
})
```

```tsx
// 一个 layout 与一个 page 都需要 user
async function Layout() {
  const user = await getUser('1')   // DB 查询 1 次
}

async function Page() {
  const user = await getUser('1')   // 复用 layout 的结果，不会再查
}
```

`React.cache` 的作用域是**单次 render**（per-request），不跨请求。`fetch` 自动 memoize，不需要包 `cache()`。

## 客户端数据获取

### `use()` + Promise + Suspense

```tsx
// app/page.tsx（Server Component）
import { Suspense } from 'react'
import Posts from './posts'

export default function Page() {
  const postsPromise = fetch('https://api.example.com/posts').then(r => r.json())
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Posts posts={postsPromise} />
    </Suspense>
  )
}
```

```tsx
// app/posts.tsx（Client Component）
'use client'
import { use } from 'react'

export default function Posts({ posts }: { posts: Promise<any[]> }) {
  const data = use(posts)
  return <ul>{data.map(p => <li key={p.id}>{p.title}</li>)}</ul>
}
```

### SWR / TanStack Query

纯客户端拉数据（轮询、交互后再拉）用社区库：

```tsx
'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function Profile() {
  const { data, error, isLoading } = useSWR('/api/me', fetcher)

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error</div>
  return <div>Hello {data.name}</div>
}
```

## `cookies()` / `headers()` —— 读请求信息

**都是异步函数**（Next.js 15+ 起），只能在 Server Component / Server Action / Route Handler 里调用：

```tsx
import { cookies, headers } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const theme = cookieStore.get('theme')?.value || 'light'

  const headersList = await headers()
  const userAgent = headersList.get('user-agent')

  return (
    <div>
      <p>Theme: {theme}</p>
      <p>UA: {userAgent}</p>
    </div>
  )
}
```

**`cookies()` / `headers()` 让组件进入 dynamic rendering**（每次请求都跑），无法静态化。

写 cookie 只能在 **Server Action** / **Route Handler** 内：

```ts
'use server'
import { cookies } from 'next/headers'

export async function setTheme(theme: string) {
  const cookieStore = await cookies()
  cookieStore.set('theme', theme, {
    httpOnly: false,
    secure: true,
    sameSite: 'lax',
    path: '/',
  })
}
```

## `redirect` / `notFound`

```ts
import { redirect, notFound, permanentRedirect } from 'next/navigation'

// 302 临时重定向
redirect('/login')

// 308 永久重定向
permanentRedirect('/new-url')

// 触发 not-found.tsx
notFound()
```

这些函数**抛出异常**，函数后续代码不会执行：

```tsx
async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await getPost(id)
  if (!post) notFound()    // 抛出，下面不执行

  return <h1>{post.title}</h1>
}
```

在 Server Action 里用 `redirect()` 是常见模式 —— 数据写入后跳转。

## `<Link>` 导航组件

```tsx
import Link from 'next/link'

<Link href="/dashboard">Dashboard</Link>
<Link href="/blog/[slug]" as="/blog/hello">Hello</Link>   // 不需要 as，自动解析
<Link href={{ pathname: '/search', query: { q: 'react' } }}>Search</Link>

// 不滚动
<Link href="/big-page" scroll={false}>Section</Link>

// 替换历史（不推 push）
<Link href="/login" replace>Login</Link>

// 关闭 prefetch
<Link href="/expensive" prefetch={false}>Expensive</Link>
```

`<Link>` 自动 **prefetch** 进入视口的链接（仅生产环境），快速 SPA 切换。

### `useRouter` —— 编程式导航

```tsx
'use client'

import { useRouter } from 'next/navigation'

export default function LoginButton() {
  const router = useRouter()

  async function login() {
    await fetch('/api/login', { method: 'POST' })
    router.push('/dashboard')
    // router.replace('/dashboard')   // 不推历史
    // router.back()
    // router.forward()
    // router.refresh()                // 重新拉当前路由数据
  }

  return <button onClick={login}>Login</button>
}
```

注意：`useRouter` 从 `next/navigation`（App Router）import，**不是** `next/router`（Pages Router）。

## `<Image>` 与 `<Script>`

```tsx
import Image from 'next/image'
import Script from 'next/script'

<Image src={profile} alt="Profile" placeholder="blur" />
<Image src="https://..." alt="" width={500} height={500} priority />

<Script src="https://analytics.example.com/script.js" strategy="afterInteractive" />
```

Script 策略：

- `beforeInteractive`：HTML 阻塞，hydration 前加载（关键脚本）
- `afterInteractive`（默认）：hydration 后加载（分析）
- `lazyOnload`：浏览器空闲时加载（聊天 widget）

## `metadata` 与 `<head>`

App Router 用 **Metadata API**，**不要手写 `<head>`**：

```tsx
// app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My App',
  description: 'Built with Next.js',
  openGraph: {
    title: 'My App',
    images: ['/og.png'],
  },
}
```

动态：

```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  return {
    title: post.title,
    description: post.excerpt,
  }
}
```

模板（继承父级标题）：

```ts
export const metadata: Metadata = {
  title: {
    template: '%s | My Site',
    default: 'My Site',
  },
}
```

子页 `title: 'Blog'` 渲染为 `Blog | My Site`。

## 总结

App Router 的基础就这些：

- **文件名 = 行为**：`layout` / `page` / `loading` / `error` / `not-found` / `route` / `template`
- **目录 = 路由段**：嵌套、动态、分组、私有、并行、拦截
- **默认 Server Component**：可异步、可直连 DB；要交互就独立成 Client Component
- **数据**：Server Component 里 `async/await`、Client 里用 `use()` + Suspense 或 SWR
- **变更数据**：Server Actions 替代手写 API + fetch；表单 `<form action={fn}>` 直接调
- **API 端点**：Route Handler，与 `page.tsx` 互斥

下一步是 [指南 - 进阶](./advanced.md)：渲染模式 / 缓存策略 / Streaming 深入。
