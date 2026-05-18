---
layout: doc
outline: [2, 3]
---

# 指南 - 进阶

> 渲染模式（Static / Dynamic / Streaming / ISR / PPR）、缓存四层模型、Cache Components

## 速查

- 4 种渲染：Static（默认 build 时跑）/ Dynamic（每次请求跑）/ Streaming（SSR + Suspense 流式）/ ISR（定期 revalidate）
- 进入 dynamic 的触发：`cookies()` / `headers()` / `searchParams` / `fetch({ cache: 'no-store' })` / `dynamic = 'force-dynamic'`
- 4 层缓存：Request Memoization（React，同 render 内）/ Data Cache（fetch，跨请求）/ Full Route Cache（HTML + RSC Payload）/ Router Cache（客户端，导航复用）
- `fetch` 选项：`cache: 'force-cache' | 'no-store'`、`next: { revalidate, tags }`
- 失效：`revalidatePath('/path')` / `revalidateTag('tag')` / Next.js 16 的 `updateTag()`（read-your-writes）
- `unstable_cache` 包非 fetch 函数（DB 调用）做缓存
- Suspense + `loading.tsx` 实现 streaming
- Next.js 16 新机制：Cache Components（`cacheComponents: true`）+ `'use cache'` + `cacheLife()` + `cacheTag()`
- Partial Prerendering (PPR)：静态壳 + 动态部分，Cache Components 启用后默认行为

## 4 种渲染模式

每个路由的最终行为是这 4 种之一（或它们的组合）。Next.js 自动选择，但你能通过 API 影响。

### Static Rendering（默认）

build 时生成 HTML + RSC Payload 文件，部署到 CDN，每个用户拿到的是同一份缓存。

```tsx
// app/blog/page.tsx —— 默认 static
export default async function Blog() {
  const posts = await fetch('https://...', { cache: 'force-cache' }).then(r => r.json())
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>
}
```

build 输出会显示 `○ /blog (Static)`。

### Dynamic Rendering

每次请求服务端跑一次。一旦组件用了"request-time API"，整个路由进入 dynamic：

```tsx
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()   // → 整个 page 变 dynamic
  const theme = cookieStore.get('theme')?.value
  return <div>Theme: {theme}</div>
}
```

触发 dynamic 的：

- `cookies()` / `headers()` / `draftMode()`
- `searchParams` 在 `page.tsx` 里
- `fetch(url, { cache: 'no-store' })` 或默认（Next.js 15+）
- `fetch(url, { next: { revalidate: 0 } })`
- 显式 `export const dynamic = 'force-dynamic'`

build 输出 `λ /page (Dynamic)` 或 `ƒ`。

### Streaming SSR

用 `<Suspense>` 包慢组件，先 stream HTML 壳，慢部分**异步流式发送**：

```tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <>
      <h1>Welcome</h1>
      <Suspense fallback={<SkeletonList />}>
        <SlowProducts />     {/* 这里慢，但用户先看到 h1 + skeleton */}
      </Suspense>
    </>
  )
}

async function SlowProducts() {
  const data = await fetchProductsSlowly()
  return <ProductGrid products={data} />
}
```

或用 `loading.tsx` 自动包整段路由：

```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return <DashboardSkeleton />
}
```

Next.js 自动等价于：

```tsx
<Suspense fallback={<Loading />}>
  <Page />
</Suspense>
```

### Incremental Static Regeneration (ISR)

build 时生成 + 后台定期刷新，结合 static 的速度与新鲜度：

```tsx
// 整段路由 60 秒 revalidate
export const revalidate = 60

export default async function Page() {
  const posts = await fetch('https://...', { next: { revalidate: 60 } }).then(r => r.json())
  return <PostList posts={posts} />
}
```

第一个用户访问 → 返回缓存 + 后台触发新构建 → 下次用户拿到新版本。**stale-while-revalidate** 模式。

按需 revalidate：

```ts
'use server'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function publishPost(id: number) {
  await db.post.update({ where: { id }, data: { published: true } })
  revalidateTag('posts')
  revalidatePath('/blog')
}
```

## 4 层缓存模型

Next.js 在不同层做缓存。理解它们能避免"为什么不更新"的迷之 bug。

| 层 | 范围 | 内容 | 失效 |
|---|---|---|---|
| **Request Memoization** | 单次 render（React） | `fetch` 同 URL + method | render 结束 |
| **Data Cache** | 跨请求（持久） | `fetch` 响应 | `revalidate` 时间 / `revalidateTag` / `revalidatePath` |
| **Full Route Cache** | 跨请求（持久） | RSC Payload + HTML | `revalidate` / `revalidateTag` / `revalidatePath` / 部署新版本 |
| **Router Cache** | 单用户浏览器（内存） | 已访问的 RSC Payload | session 结束 / `router.refresh()` |

### Request Memoization（React 提供）

同一 render 内多次 `fetch` 同 URL，React 只跑一次：

```tsx
async function Page() {
  // Layout 与 Page 都调用了 getUser('1')，React 自动 memoize，DB 查询 1 次
  const user = await getUser('1')
}

const getUser = (id: string) => fetch(`/api/users/${id}`).then(r => r.json())
```

非 `fetch` 用 `React.cache` 包：

```ts
import { cache } from 'react'
import { db } from '@/lib/db'

export const getPost = cache(async (id: number) => {
  return db.post.findUnique({ where: { id } })
})
```

### Data Cache（Next.js 持久缓存）

`fetch` 配 `cache: 'force-cache'` 或 `next: { revalidate }` 时，响应存到持久缓存（本地 `.next/cache/`，生产部署到平台缓存如 Vercel CDN）：

```ts
// 永久缓存（直到 revalidate 或部署新版本）
fetch(url, { cache: 'force-cache' })

// 60 秒后过期
fetch(url, { next: { revalidate: 60 } })

// 永不缓存
fetch(url, { cache: 'no-store' })   // Next.js 15+ 默认
```

按 tag 失效：

```ts
// 写入时打 tag
fetch(url, { next: { tags: ['posts', `post-${id}`] } })

// 失效时按 tag 触发
revalidateTag('posts')         // 失效所有 tag='posts' 的缓存
revalidateTag(`post-${id}`)    // 只失效某个 post
```

### Full Route Cache

整段路由的渲染产物（HTML + RSC Payload）build 时生成，存到磁盘。Static 路由的访问就是从这层取。

进入 dynamic 时**没有** Full Route Cache（每次请求都重新渲染）。

### Router Cache（客户端）

浏览器内存里缓存已访问的 RSC Payload，导航时复用：

- **Layout / loading**：永远缓存
- **Page**（动态部分）：Next.js 15 默认**不缓存**（每次导航重新拉）
- **配置**：`next.config.ts` 的 `experimental.staleTimes.dynamic`

```ts
// next.config.ts
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30,      // 动态 page 30 秒内复用 cache
      static: 180,      // 静态 page 3 分钟内复用
    },
  },
}
```

手动失效：`router.refresh()` 或 Server Action 里 `revalidatePath`。

## `fetch` 完整选项

```ts
// 缓存：默认（Next.js 15+ 不缓存）
await fetch(url)

// 强制缓存
await fetch(url, { cache: 'force-cache' })

// 强制不缓存（显式）
await fetch(url, { cache: 'no-store' })

// ISR：60 秒
await fetch(url, { next: { revalidate: 60 } })

// 永久缓存
await fetch(url, { next: { revalidate: false } })

// 不缓存（等价 no-store）
await fetch(url, { next: { revalidate: 0 } })

// 打 tag
await fetch(url, { next: { tags: ['posts'] } })

// 组合
await fetch(url, {
  next: { revalidate: 3600, tags: ['posts'] },
})

// 标准 Web fetch 选项也支持
await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ... }),
})
```

冲突的选项会被忽略并打 dev 警告：

```ts
// ❌ revalidate 与 cache: 'no-store' 冲突
fetch(url, { cache: 'no-store', next: { revalidate: 60 } })   // 两个都被忽略
```

## Route Segment Config

每个 layout / page / route 文件可以 export 配置覆盖默认行为：

```ts
// page.tsx / layout.tsx / route.ts
export const dynamic = 'auto'
// 'auto' | 'force-dynamic' | 'force-static' | 'error'

export const dynamicParams = true
// true: 动态段未在 generateStaticParams 中的也按 dynamic 渲染（默认）
// false: 未在 generateStaticParams 中的返回 404

export const revalidate = false
// false / 0 / number（秒）

export const fetchCache = 'auto'
// 'auto' | 'default-cache' | 'only-cache' | 'force-cache'
// 'default-no-store' | 'only-no-store' | 'force-no-store'

export const runtime = 'nodejs'
// 'nodejs'（默认）| 'edge'

export const preferredRegion = 'auto'
// 'auto' | 'global' | 'home' | string | string[]

export const maxDuration = 5
// 函数最长执行秒数（Vercel）
```

### `dynamic = 'force-static'`

强制路由静态化（即使用了 `cookies()` 也忽略，返回空值）：

```tsx
export const dynamic = 'force-static'

export default async function Page() {
  // cookies() 返回空对象，不抛错
  const cookieStore = await cookies()
  // 实际 cookieStore.get(...) 返回 undefined
}
```

### `dynamic = 'force-dynamic'`

强制 dynamic（覆盖默认 static 推断）：

```tsx
export const dynamic = 'force-dynamic'

export default function Page() {
  return <div>Always rendered at request time</div>
}
```

### `fetchCache = 'default-cache'`

让所有未指定 `cache` 选项的 `fetch` 默认 force-cache（恢复 Next.js 14 行为）：

```ts
// app/layout.tsx 或 page.tsx
export const fetchCache = 'default-cache'

export default async function Page() {
  const a = await fetch('https://...')                          // 缓存（force-cache）
  const b = await fetch('https://...', { cache: 'no-store' })    // 不缓存（显式）
}
```

## `generateStaticParams`

为动态段在 build 时预生成路径：

```tsx
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await fetchAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)
  return <article>{post.title}</article>
}
```

build 时为每个 slug 生成静态 HTML。未列出的 slug 在请求时按 dynamic 渲染（除非 `dynamicParams = false`）。

多个动态段：

```tsx
// app/shop/[category]/[item]/page.tsx
export async function generateStaticParams() {
  return [
    { category: 'clothing', item: 'shirt' },
    { category: 'clothing', item: 'pants' },
    { category: 'food', item: 'apple' },
  ]
}
```

## Streaming 深入

### `<Suspense>` 用法

```tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      <Header />   {/* 立即渲染 */}
      <Suspense fallback={<Skeleton />}>
        <SlowSection />   {/* 异步 */}
      </Suspense>
      <Footer />   {/* 也立即 */}
    </div>
  )
}

async function SlowSection() {
  const data = await fetchSlowly()    // 5 秒
  return <Content data={data} />
}
```

行为：

1. 服务端立刻 stream `<Header />` + `<Skeleton />` + `<Footer />` 的 HTML
2. 服务端继续等 `SlowSection` 渲染完成
3. 完成后 stream 一段 inline script，把 `Skeleton` 替换成实际内容

用户体验：先看到 header + skeleton + footer（即时），慢部分逐步填充。

### `loading.tsx` 等价于整段路由 Suspense

```
app/dashboard/
├── layout.tsx
├── loading.tsx
└── page.tsx
```

等价：

```tsx
<Layout>
  <Suspense fallback={<Loading />}>
    <Page />
  </Suspense>
</Layout>
```

> Layout 自己的 async 工作（包括 `cookies()`）**不被** `loading.tsx` 覆盖。如果 layout 慢，整段路由就卡在 layout。把慢部分推到 page 或单独 Suspense。

### `use()` API + Promise

Server Component 不 await，把 Promise 传给 Client Component，Client 用 `use()`：

```tsx
// app/page.tsx（Server）
import { Suspense } from 'react'
import Posts from './posts'

export default function Page() {
  const postsPromise = fetch('https://...').then(r => r.json())
  return (
    <Suspense fallback={<Skeleton />}>
      <Posts postsPromise={postsPromise} />
    </Suspense>
  )
}
```

```tsx
// app/posts.tsx（Client）
'use client'
import { use } from 'react'

export default function Posts({ postsPromise }: { postsPromise: Promise<any[]> }) {
  const posts = use(postsPromise)   // 触发 Suspense；resolved 后渲染
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>
}
```

这样 Posts 可以是 Client（响应交互），但数据拉取从服务端开始。

## `unstable_cache` —— 包非 fetch 函数

`fetch` 自动有 Data Cache。非 `fetch` 调用（如 DB 查询）默认不缓存，用 `unstable_cache` 包：

```ts
// lib/data.ts
import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'

export const getCachedUser = unstable_cache(
  async (id: string) => {
    return db.user.findUnique({ where: { id } })
  },
  ['user'],                                 // cache key prefix
  {
    tags: ['user', 'users'],
    revalidate: 3600,
  }
)
```

调用方式与原函数相同：

```tsx
const user = await getCachedUser('1')
```

参数自动进入 cache key —— 不同 id 不同缓存条目。

按 tag 失效：

```ts
'use server'
import { revalidateTag } from 'next/cache'

export async function updateUser(id: string) {
  await db.user.update({ where: { id }, data: { ... } })
  revalidateTag('users')
}
```

> 名字带 `unstable_` 但实际生产可用。Next.js 16 起 `cacheLife` / `cacheTag` 已稳定，`unstable_cache` 转向 Cache Components 模型。

## `revalidatePath` vs `revalidateTag`

```ts
import { revalidatePath, revalidateTag } from 'next/cache'

// 失效某个路由的 Full Route Cache
revalidatePath('/blog')               // 精确路径
revalidatePath('/blog/[slug]', 'page') // 模板路径（所有 blog 详情页）
revalidatePath('/', 'layout')          // 根 layout（基本全站失效）

// 失效带某 tag 的所有 fetch / unstable_cache
revalidateTag('posts')
revalidateTag('user-1')
```

选用：

- **`revalidatePath`**：知道要失效的路由路径时
- **`revalidateTag`**：知道要失效的数据 tag 时，跨多个路由

Server Action 内调用即生效。

## Next.js 16 新机制：Cache Components

Next.js 16 引入了**新的缓存模型**，需要在 config 启用：

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
}

export default nextConfig
```

启用后默认行为变成 **Partial Prerendering (PPR)**：

- 路由的"静态部分"在 build 时预渲染（变成静态壳）
- 路由的"动态部分"在请求时按需渲染并 stream
- 一个页面里两者共存

### `'use cache'` 指令

标在函数 / 组件顶部，缓存其返回值：

```tsx
import { cacheLife } from 'next/cache'

export async function getUsers() {
  'use cache'
  cacheLife('hours')
  return db.query('SELECT * FROM users')
}
```

或缓存整个组件：

```tsx
import { cacheLife } from 'next/cache'

export default async function ProductsList() {
  'use cache'
  cacheLife('hours')

  const products = await db.product.findMany()
  return <ul>{products.map(p => <li key={p.id}>{p.name}</li>)}</ul>
}
```

参数自动进入 cache key —— `getUsers(id1)` 与 `getUsers(id2)` 是不同条目。

### `cacheLife` —— 缓存生命周期

```ts
import { cacheLife } from 'next/cache'

async function getData() {
  'use cache'
  cacheLife('minutes')   // 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'max'
  // 或自定义 profile
  cacheLife({ revalidate: 60, expire: 3600, stale: 600 })
}
```

### `cacheTag` —— 加 tag

```ts
import { cacheTag } from 'next/cache'

async function getPosts(category: string) {
  'use cache'
  cacheTag(`posts-${category}`, 'posts')
  return db.post.findMany({ where: { category } })
}
```

### `updateTag` vs `revalidateTag`（Next.js 16）

```ts
import { revalidateTag, updateTag } from 'next/cache'

// revalidateTag：标记过期，下次请求 stale-while-revalidate
revalidateTag('posts', 'max')   // Next.js 16 第二参数必填

// updateTag：立即过期 + 当前请求强制刷新（read-your-writes）
updateTag('user-profile')        // 用户改了个人资料，立刻看到
```

选用：

- **`revalidateTag`**：可接受短暂 stale 的内容（博客文章、产品目录）
- **`updateTag`**：用户期望立即看到自己的改动（表单提交后）

### 与 Suspense 配合

```tsx
import { Suspense } from 'react'
import { cookies } from 'next/headers'

export default function Page() {
  return (
    <>
      {/* 静态部分：build 时预渲染 */}
      <Header />
      <Suspense fallback={<NavSkeleton />}>
        {/* 动态部分：请求时渲染 */}
        <UserNav />
      </Suspense>
    </>
  )
}

async function UserNav() {
  const cookieStore = await cookies()
  const user = await getUser(cookieStore.get('session')?.value)
  return <nav>Hi {user.name}</nav>
}
```

Cache Components 强制要求："访问 request-time API 或未缓存数据的组件"必须包 `<Suspense>` 或用 `'use cache'` —— 否则 build 报错（`Uncached data was accessed outside of <Suspense>`）。

### Cache Components 与原模型的差异

| | 传统模型（Next.js 15）| Cache Components（Next.js 16） |
|---|---|---|
| 默认行为 | static 推断 + dynamic 推断 | Partial Prerendering（静态壳 + 动态部分） |
| 缓存声明 | `fetch` 的 cache 选项 + `unstable_cache` | `'use cache'` + `cacheLife()` + `cacheTag()` |
| 强制要求 | 无 | 未缓存的运行时数据**必须**包 Suspense |
| 启用 | 默认 | `cacheComponents: true` |

> 用户用 Next.js 15 时，仍是传统模型。本笔记以传统模型为主，Cache Components 作为补充说明。

## `unstable_after` —— 响应后跑

在响应返回后跑一些非阻塞工作（日志、analytics）：

```ts
import { unstable_after as after } from 'next/server'

export default async function Page() {
  after(() => {
    // 响应已发给用户后再跑
    fetch('https://analytics.example.com', {
      method: 'POST',
      body: JSON.stringify({ event: 'page_view' }),
    })
  })

  return <h1>Hello</h1>
}
```

可以在 Server Component、Route Handler、Server Action 里用。Next.js 16 起稳定（去掉 `unstable_` 前缀）。

## `connection` —— 强制 dynamic

显式声明组件依赖请求时的非确定性数据（如 `Math.random()`、`Date.now()`）：

```tsx
import { connection } from 'next/server'

async function RandomUUID() {
  await connection()         // 显式：等到请求时才执行
  const uuid = crypto.randomUUID()
  return <p>{uuid}</p>
}

export default function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <RandomUUID />
    </Suspense>
  )
}
```

Cache Components 启用时，没标 `connection()` 又用了非确定值会 build 错。

## `dynamicParams = false` —— 动态段白名单

```tsx
// app/blog/[slug]/page.tsx
export const dynamicParams = false

export async function generateStaticParams() {
  return [{ slug: 'hello' }, { slug: 'world' }]
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  // ...
}
```

只有 `/blog/hello` / `/blog/world` 可访问，其它 404。

## `fetch` 在开发模式下的缓存

Next.js dev 下用 HMR Cache 缓存 `fetch` 响应跨 HMR 刷新：

```ts
// next.config.ts
const nextConfig = {
  experimental: {
    serverComponentsHmrCache: true,    // 默认 true
  },
}
```

要清理：

- 浏览器 hard refresh（Ctrl+Shift+R）
- 浏览器 DevTools "Disable cache"
- 完整 reload（不是 HMR）

要看 fetch 调用细节：

```ts
const nextConfig = {
  logging: {
    fetches: { fullUrl: true },
  },
}
```

## 多请求重用同一 promise

跨 Server / Client 共享 promise，配合 `<Suspense>` + `React.cache`：

```ts
// app/lib/user.ts
import { cache } from 'react'

export const getUser = cache(async () => {
  return fetch('/api/me').then(r => r.json())
})
```

```tsx
// app/user-context.tsx
'use client'
import { createContext } from 'react'

export const UserContext = createContext<Promise<User> | null>(null)

export default function UserProvider({
  userPromise,
  children,
}: {
  userPromise: Promise<User>
  children: React.ReactNode
}) {
  return <UserContext value={userPromise}>{children}</UserContext>
}
```

```tsx
// app/layout.tsx（Server）
import { getUser } from './lib/user'
import UserProvider from './user-context'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const userPromise = getUser()   // 不 await
  return (
    <html>
      <body>
        <UserProvider userPromise={userPromise}>{children}</UserProvider>
      </body>
    </html>
  )
}
```

```tsx
// app/profile/page.tsx（Server）
import { getUser } from '../lib/user'

export default async function Profile() {
  const user = await getUser()    // 同请求内 cached，不会重复
  return <h1>Hi {user.name}</h1>
}
```

```tsx
// app/components/Avatar.tsx（Client）
'use client'
import { use, useContext } from 'react'
import { UserContext } from '../user-context'

export default function Avatar() {
  const userPromise = useContext(UserContext)!
  const user = use(userPromise)   // 同一 promise，已 cache
  return <img src={user.avatarUrl} />
}
```

## `searchParams` 与 dynamic rendering

使用 `searchParams` 让整个 page 进入 dynamic：

```tsx
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  // 整个 page 现在 dynamic
}
```

只想"客户端读 search params 但不影响渲染"用 `useSearchParams` hook：

```tsx
'use client'
import { useSearchParams } from 'next/navigation'

export default function ClientSearch() {
  const params = useSearchParams()
  const q = params.get('q')
  return <input defaultValue={q ?? ''} />
}
```

`useSearchParams` 是 Client hook，不会触发 dynamic（但 Client Component 自己渲染）。

## 实战模式：列表 + 详情共享数据

```tsx
// app/posts/page.tsx —— 列表
import Link from 'next/link'

export const revalidate = 60

export default async function PostList() {
  const posts = await fetch('/api/posts', { next: { tags: ['posts'] } }).then(r => r.json())
  return (
    <ul>
      {posts.map(p => (
        <li key={p.id}>
          <Link href={`/posts/${p.id}`}>{p.title}</Link>
        </li>
      ))}
    </ul>
  )
}
```

```tsx
// app/posts/[id]/page.tsx —— 详情
export const revalidate = 60

export default async function PostDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const post = await fetch(`/api/posts/${id}`, {
    next: { tags: ['posts', `post-${id}`] },
  }).then(r => r.json())
  return <article>{post.title}</article>
}
```

```ts
// app/actions.ts
'use server'
import { revalidateTag } from 'next/cache'

export async function createPost(formData: FormData) {
  await db.post.create({ data: { title: formData.get('title') } })
  revalidateTag('posts')          // 列表与所有详情都失效
}

export async function editPost(id: number, data: any) {
  await db.post.update({ where: { id }, data })
  revalidateTag(`post-${id}`)     // 只失效这个详情
}
```

## 静态导出（output: 'export'）

把 Next.js 应用导出为纯静态 HTML：

```ts
// next.config.ts
const nextConfig = {
  output: 'export',
}
```

`pnpm build` 生成 `out/`，可以传任意 CDN（GitHub Pages、S3、Cloudflare Pages）。

不支持的特性：

- Server Actions
- Route Handlers（除 GET 且 force-static）
- `cookies()` / `headers()`
- ISR（`revalidate`）
- Image Optimization（除非提供自定义 loader）
- Middleware / Proxy

适合：**纯静态站**（博客、文档、营销页）。详见高级章节部署部分。

## `output: 'standalone'` —— 自托管最小镜像

```ts
const nextConfig = {
  output: 'standalone',
}
```

build 后生成 `.next/standalone/`，里面只有最小运行所需的 `node_modules` 子集 + server.js。常用于 Docker 镜像：

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY . .
RUN pnpm install && pnpm build

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

镜像比直接打包 `node_modules` 小一个量级。

## 性能优化清单

1. **优先 Server Components**：减少客户端 JS
2. **`'use client'` 下推到叶子**：减小 bundle
3. **Suspense 包慢部分**：让快内容先 stream
4. **`<Link>` 默认 prefetch**：导航即时
5. **`next/image` 替代 `<img>`**：自动 lazy + WebP + 响应式
6. **`next/font` 替代手动 link**：消除字体引起的 CLS
7. **缓存策略**：能 static 就 static；能 ISR 就 ISR；最后才 dynamic
8. **`generateStaticParams`**：build 时预生成可能的动态段
9. **`output: 'standalone'`**：自托管时减小镜像
10. **CDN**：把 `_next/static/*` 跟 image optimization 走 CDN

## 总结

进阶部分核心是搞懂**渲染模式与缓存的关系**：

- **想 static** → 默认就是，不动 `fetch`、不读 cookies
- **想 dynamic** → 用 `cookies()` / `searchParams` / `fetch({ cache: 'no-store' })` 或 `dynamic = 'force-dynamic'`
- **想 ISR** → `fetch({ next: { revalidate } })` 或 `export const revalidate`
- **想 streaming** → `<Suspense>` 包慢部分，或加 `loading.tsx`

缓存失效记住三个 API：

- **`revalidatePath`**：按路径
- **`revalidateTag`**：按 tag
- **`updateTag`**（Next.js 16）：read-your-writes

下一步是 [指南 - 高级](./expert.md)：Middleware/Proxy、Edge Runtime、Image、Font、i18n、Auth、部署。
