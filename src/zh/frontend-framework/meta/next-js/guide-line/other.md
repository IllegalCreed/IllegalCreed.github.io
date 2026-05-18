---
layout: doc
outline: [2, 3]
---

# 指南 - 其他

> Pages Router vs App Router、与 Remix / Nuxt / SvelteKit / Astro 对比、Next.js 15 → 16 升级、常见坑

## 速查

- App Router 推荐用于新项目；Pages Router 仍长期维护，老项目可继续用
- 元框架对比：Next.js（React 圈最大）/ Remix（嵌套路由 + 标准 Web API）/ Nuxt（Vue 圈对应）/ SvelteKit / Astro
- Next.js 14 → 15：`fetch` 默认不缓存、async `params` / `cookies` / `headers`、React 19 RC
- Next.js 15 → 16：`middleware` → `proxy`、Turbopack 默认、Cache Components、同步访问 Request API 移除
- 常见坑：hydration mismatch、`'use client'` 传染性、Server Action 被直接 POST 滥用、dev vs prod 缓存差异

## Pages Router vs App Router

Next.js 长期同时维护两套路由系统：

| | Pages Router（`pages/`） | App Router（`app/`） |
|---|---|---|
| 引入 | 一开始就有 | Next.js 13.4（2023.5）稳定 |
| 路由文件 | `pages/index.tsx` → `/` | `app/page.tsx` → `/` |
| 默认渲染 | CSR（SPA） | RSC（Server Components） |
| 数据获取 | `getStaticProps` / `getServerSideProps` / `getStaticPaths` | Server Component 里 `async/await` + `fetch` |
| API | `pages/api/*.ts` 函数 | `app/.../route.ts` Web Standard |
| 布局 | 在 `_app.tsx` 全局、或自定义 `getLayout` | 文件系统 `layout.tsx` 嵌套 |
| 中间件 | `middleware.ts` | 同 + Next.js 16 改 `proxy.ts` |
| 元数据 | `next/head` 手写 `<head>` | Metadata API（`export const metadata`） |
| 字体 | `@next/font`（已废弃） | `next/font`（内建） |
| Image | `next/image`（同） | `next/image`（同） |
| Streaming | 不支持 | 支持（`<Suspense>` + RSC） |
| 学习曲线 | 简单（普通 React） | 高（要学 RSC / Server Actions / Boundary） |

### 何时选哪个

- **新项目** → App Router（推荐）
- **小型 SPA / dashboard** → Pages Router 也行，简单
- **重 SEO / 内容站** → App Router（更好的 SSG + Streaming）
- **老项目** → 不强行迁移，两者**可以共存**（在同一项目里）

### 共存

`pages/` 与 `app/` 同一项目可并存：

```
my-app/
├── app/                  # 新路由用 App Router
│   ├── layout.tsx
│   └── about/page.tsx    # /about
└── pages/                # 老路由用 Pages Router
    └── legacy.tsx        # /legacy
```

> 同一 URL 不能两边都定义。`app/about/page.tsx` 与 `pages/about.tsx` 冲突，构建报错。

逐步迁移策略：

1. 把 `app/layout.tsx` 加上（包 `<html>`/`<body>`）
2. 一个个新页面写在 `app/`
3. 老页面继续在 `pages/`，慢慢搬

### 迁移：`getServerSideProps` → Server Component

```tsx
// Pages Router
// pages/blog.tsx
export async function getServerSideProps() {
  const posts = await fetch('https://...').then(r => r.json())
  return { props: { posts } }
}

export default function Blog({ posts }) {
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>
}
```

```tsx
// App Router
// app/blog/page.tsx
export default async function Blog() {
  const posts = await fetch('https://...', { cache: 'no-store' }).then(r => r.json())
  return <ul>{posts.map((p: any) => <li key={p.id}>{p.title}</li>)}</ul>
}
```

### 迁移：`getStaticProps` → ISR fetch

```tsx
// Pages Router
export async function getStaticProps() {
  const posts = await fetch('https://...').then(r => r.json())
  return { props: { posts }, revalidate: 60 }
}
```

```tsx
// App Router
export const revalidate = 60

export default async function Blog() {
  const posts = await fetch('https://...').then(r => r.json())
  return <ul>...</ul>
}
```

### 迁移：API Routes → Route Handlers

```ts
// pages/api/hello.ts
export default function handler(req, res) {
  res.status(200).json({ message: 'Hello' })
}
```

```ts
// app/api/hello/route.ts
export async function GET() {
  return Response.json({ message: 'Hello' })
}
```

Codemod 辅助迁移：

```bash
npx @next/codemod@canary upgrade latest
```

## Next.js 14 → 15 升级

主要破坏性变更：

### 1. React 19（最低 19）

```bash
pnpm add react@latest react-dom@latest @types/react@latest @types/react-dom@latest
```

- `useFormState` deprecated → 换 `useActionState`
- `useFormStatus` 多了 `data` / `method` / `action`

### 2. Async Request APIs

`cookies()` / `headers()` / `draftMode()` / `params` / `searchParams` 都改成 Promise：

```tsx
// Before（14）
const cookieStore = cookies()
const token = cookieStore.get('token')

// After（15）
const cookieStore = await cookies()
const token = cookieStore.get('token')
```

```tsx
// Before
export default function Page({ params }: { params: { id: string } }) {
  const { id } = params
}

// After
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
}
```

15 时代仍支持同步访问（打 dev 警告），**16 完全移除**。

Codemod 自动迁移：

```bash
npx @next/codemod@canary next-async-request-api .
```

### 3. `fetch` 默认不缓存

```tsx
// Before（14）：默认 force-cache
await fetch(url)   // 缓存

// After（15）：默认 auto no cache
await fetch(url)                                    // 不缓存
await fetch(url, { cache: 'force-cache' })           // 显式缓存
await fetch(url, { next: { revalidate: 60 } })       // ISR
```

恢复 14 的行为：

```ts
// layout 或 page 顶部
export const fetchCache = 'default-cache'
```

### 4. Route Handler GET 默认不缓存

```ts
// Before：GET 默认 static
export async function GET() { ... }

// After：GET 默认 dynamic
export async function GET() { ... }

// 要静态化必须显式
export const dynamic = 'force-static'
export async function GET() { ... }
```

### 5. Client Cache 改动

`<Link>` 导航的 page 不再被默认 cache：

```ts
// next.config.ts 恢复 14 行为
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30,   // 30 秒内复用 cache
      static: 180,
    },
  },
}
```

### 6. `next/font` 内建（`@next/font` 移除）

```ts
// Before
import { Inter } from '@next/font/google'

// After
import { Inter } from 'next/font/google'
```

Codemod：

```bash
npx @next/codemod@canary built-in-next-font .
```

### 7. `NextRequest.geo` / `.ip` 移除

```ts
// Before
const { city } = request.geo
const ip = request.ip

// After（Vercel）
import { geolocation, ipAddress } from '@vercel/functions'
const { city } = geolocation(request)
const ip = ipAddress(request)
```

### 8. 一键升级

```bash
npx @next/codemod@canary upgrade latest
```

会自动跑大部分 codemod。

## Next.js 15 → 16 升级

### 1. Node 20.9+

最低 Node 18 → Node 20.9。CI 镜像先升。

### 2. Turbopack 默认

```json
// Before（15）
{ "scripts": { "dev": "next dev --turbopack", "build": "next build" } }

// After（16）
{ "scripts": { "dev": "next dev", "build": "next build" } }
```

不想用 Turbopack：`--webpack`。

如果有自定义 `webpack` 配置但运行 `next build`（默认 Turbopack），会**build 失败**。要么迁配置，要么显式 `--webpack`。

### 3. `middleware` → `proxy`

```bash
# Codemod
npx @next/codemod@canary middleware-to-proxy .

# 手动
mv middleware.ts proxy.ts
```

```ts
// Before（15）
export function middleware(request) { ... }

// After（16）
export function proxy(request) { ... }
```

`proxy` 只支持 Node Runtime，不再支持 Edge。要 Edge 继续用 `middleware`（会有 deprecation 警告）。

### 4. 同步访问 Request APIs 全删

15 时代支持的同步访问 `cookies()` 等，16 直接报错。必须 await。

### 5. `revalidateTag` 第二参数必填

```ts
// Before（15）
revalidateTag('posts')

// After（16）
revalidateTag('posts', 'max')   // 或 'seconds' / 'minutes' / 'hours' / 'days' / 'weeks'
```

### 6. Parallel routes 必须有 `default.tsx`

```tsx
// app/@modal/default.tsx
export default function Default() {
  return null
}
```

### 7. `next/image` 默认变化

- `minimumCacheTTL` 60s → 4 小时
- `qualities` 全部 → `[75]`
- `imageSizes` 默认数组去掉 16
- `dangerouslyAllowLocalIP` 默认 false
- `maximumRedirects` 默认 3
- `images.domains` deprecated → `remotePatterns`
- `next/legacy/image` deprecated

```ts
// 恢复 15 行为
const nextConfig: NextConfig = {
  images: {
    minimumCacheTTL: 60,
    qualities: [50, 75, 100],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}
```

### 8. AMP / `next lint` / 运行时配置 全删

- `<amp>` / `next/amp` / `config.amp` 移除
- `next lint` 命令删除，自己跑 `eslint` / `biome`
- `serverRuntimeConfig` / `publicRuntimeConfig` 删除，用 env vars

### 9. ESLint Flat Config 默认

`@next/eslint-plugin-next` 默认 Flat Config（`eslint.config.mjs`）。

### 10. React 19.2 + Compiler

- 内建 View Transitions / `useEffectEvent` / `Activity`
- React Compiler 稳定（`reactCompiler: true`）

### 11. Cache Components（可选）

```ts
const nextConfig: NextConfig = {
  cacheComponents: true,
}
```

启用后：

- 默认 PPR（Partial Prerendering）
- `'use cache'` / `cacheLife` / `cacheTag` 可用
- 未缓存的运行时数据必须包 `<Suspense>`

老项目可以**暂不开**，继续传统缓存模型。

### 一键升级

```bash
npx @next/codemod@canary upgrade latest
```

## 与其它元框架对比

### vs Remix

| | Next.js | Remix |
|---|---|---|
| 渲染 | RSC（默认）+ SSR + SSG + ISR + PPR | SSR + 嵌套数据加载 |
| 数据 | Server Component `async fetch` + Server Actions | `loader` + `action`（嵌套路由 colocate） |
| 路由 | 文件系统（嵌套） | 文件系统（嵌套，扁平/约定） |
| 表单 | Server Action + `<form action>` | 标准 `<form>` + `action()` 函数 |
| 缓存 | 4 层（Next.js 自己实现） | 走 HTTP cache header（标准） |
| 部署 | Vercel 最顺；Adapter API | 多平台 Adapter（Cloudflare / Fastly / Node） |
| 心智模型 | RSC 边界、Server Action、'use client' | 标准 Web（Fetch / Response / Headers） |
| 生态 | 大（背靠 Vercel） | 较小但稳定 |

Remix 路线：拥抱 Web 标准、强制数据 colocate 在路由文件、轻框架重平台。Remix 2024 与 React Router v7 合并，未来生态可能进一步整合。

**选 Next.js**：大型应用、需要 RSC / Server Actions、Vercel 部署。
**选 Remix**：偏好标准 Web API、要部署到 Cloudflare 边缘、团队熟悉传统 SSR。

### vs Nuxt（Vue 圈）

Vue 圈的 Next.js 对应物。

| | Next.js | Nuxt |
|---|---|---|
| 基础 | React | Vue |
| 路由 | App Router（文件系统） | `pages/` 文件系统 |
| 数据 | RSC `async fetch` + Server Actions | `useFetch` / `useAsyncData`（SSR + 客户端复用） |
| API | `route.ts` | `server/api/*.ts`（自动暴露） |
| 自动导入 | 无 | `components/` / `composables/` 自动导入 |
| 服务引擎 | Next.js server | Nitro（H3） |
| 部署 | Vercel + Adapter | 多平台开箱（Node / Vercel / Netlify / Cloudflare / Deno / Bun） |
| Devtools | Next.js Devtools | Nuxt Devtools（内建） |
| 模块生态 | npm 库 | 官方模块体系（`@nuxt/image` / `@nuxt/content` / `@pinia/nuxt`） |

详见 [Nuxt 笔记](../../nuxt/index.md)。

### vs SvelteKit

| | Next.js | SvelteKit |
|---|---|---|
| 基础 | React | Svelte（编译时框架，无 VDOM） |
| Bundle | 中（React + RSC runtime） | 极小（Svelte 编译产物 < 10KB） |
| 路由 | 文件系统 | 文件系统（`+page.svelte` / `+server.ts`） |
| 数据 | RSC `async fetch` + Server Actions | `load` 函数 + `form actions` |
| 学习曲线 | 高（RSC） | 中（Svelte 语法简单，框架直白） |
| 生态 | 巨大 | 中小但精 |
| 心智模型 | RSC 边界 | 接近原生 HTML/JS |

SvelteKit 性能极佳，bundle 小，DX 干净。但 React 圈库 / 工具远多于 Svelte 圈。

### vs Astro

| | Next.js | Astro |
|---|---|---|
| 定位 | 通用 React 元框架 | 内容站（博客、文档、营销） |
| 渲染 | RSC + SSR + SSG | Islands Architecture（默认 0 JS）+ SSR |
| 框架 | React 锁定 | 框架无关（React + Vue + Svelte + Solid 混用） |
| JS 量 | 中（RSC 减少了） | 极少（默认完全静态 HTML，交互组件单独 island） |
| MDX | 支持 | 一等公民 |
| SSR | 主推 | 渐进开启 |

Astro 适合**内容为主**的站；要复杂应用还是 Next.js。

### 横向

| 场景 | 推荐 |
|---|---|
| React 通用应用 | Next.js |
| Cloudflare 边缘部署 | Remix / SvelteKit |
| Vue 应用 | Nuxt |
| 内容站（博客 / 文档） | Astro / VitePress / Next.js（看团队） |
| 极致 bundle 小 | SvelteKit / Astro / Solid Start |
| 学习曲线最低 | SvelteKit / Astro |

## 常见坑

### 1. Hydration mismatch

服务端渲染的 HTML 与客户端 hydrate 后不一致 → 报 `Hydration failed`。

常见原因：

```tsx
// ❌ 服务端 Date.now() 与客户端不同
export default function Page() {
  return <p>Now: {Date.now()}</p>
}

// ❌ 浏览器 API 在初始渲染就读
'use client'
export default function Page() {
  return <p>Width: {window.innerWidth}</p>   // SSR 时 window 不存在
}

// ❌ 不同区域格式化日期
new Date().toLocaleString()
```

修复：

```tsx
// ✅ 用 useEffect 把客户端独占的逻辑推迟到 mount 后
'use client'
import { useEffect, useState } from 'react'

export default function Page() {
  const [width, setWidth] = useState<number | null>(null)
  useEffect(() => setWidth(window.innerWidth), [])
  return <p>Width: {width ?? '...'}</p>
}

// ✅ 显式标 client：suppressHydrationWarning（最后手段）
<time suppressHydrationWarning>{new Date().toLocaleString()}</time>
```

### 2. `'use client'` 传染性

加了 `'use client'` 的组件 + 它直接 import 的所有模块都进 client bundle。

```tsx
// ❌ Layout 整层 client，子组件全进 bundle
'use client'
export default function Layout({ children }) {
  const [open, setOpen] = useState(false)
  return <>...</>
}
```

```tsx
// ✅ 只把交互按钮独立成 Client Component
// app/components/Toggle.tsx
'use client'
export default function Toggle() { ... }

// app/layout.tsx（Server）
import Toggle from './components/Toggle'
export default function Layout({ children }) {
  return (
    <>
      <Toggle />
      {children}
    </>
  )
}
```

### 3. Server Action 被直接 POST 滥用

Server Action 暴露为 POST 端点，可被任意客户端直接调。**必须在 action 内做权限校验**：

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

不要假设 UI 隐藏按钮就够 —— 攻击者直接 POST 路径 + body 就能调。

### 4. fetch 缓存语义乱

```tsx
// 我以为缓存了，但是没有：
await fetch('https://...')   // Next.js 15+ 默认不缓存

// 我以为没缓存，但是缓存了：
// Next.js 14 - 默认 force-cache
await fetch('https://...')   // 14 默认缓存

// 升级到 15 时大量旧 fetch 调用行为变化
```

修复：

- 升级到 15 前**逐个 review** `fetch` 调用
- 关键 fetch 显式标 cache：`{ cache: 'force-cache' }` / `{ cache: 'no-store' }`
- 整段 layout / page 用 `export const fetchCache = 'default-cache'` 锁定

### 5. dev vs prod 行为差异

**dev**：

- 所有 page 每次访问都重新渲染（无 cache）
- `revalidate` 不严格按时间，而是按 HMR
- `fetch` HMR 期间走 HMR cache（可关 `experimental.serverComponentsHmrCache: false`）

**prod**：

- Static page 是真的静态
- ISR 按 `revalidate` 时间
- `fetch` 按真实 cache 策略

→ 别只在 dev 验证缓存行为，要 `pnpm build && pnpm start` 验证。

### 6. `params` / `cookies()` 忘 await

Next.js 15+ 必须 await：

```tsx
// ❌ 不会报错但行为错
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = params   // 这里 id 是 undefined（params 是 Promise）
}

// ✅
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
}
```

Next.js 15 dev 会打警告，Next.js 16 直接报错。Codemod 帮迁移。

### 7. Server Component 里 import Client Component 模块的副作用

```tsx
// app/page.tsx（Server）
import { Toaster } from 'react-hot-toast'   // 这是 Client lib
```

```tsx
// 实际 react-hot-toast 内部 'use client'，所以 Toaster 是 Client Component
// 但 Server Component 不能直接 render Client Component 之外的 export
// 如果它还导出非组件 helper（如 toast.success），需要在 Client 文件用
```

修复：在 Client Component 文件里 wrap 一下：

```tsx
// app/components/ToastProvider.tsx
'use client'
export { Toaster, toast } from 'react-hot-toast'

// app/page.tsx
import { Toaster } from './components/ToastProvider'   // ✅
```

### 8. 大量数据传给 Client Component → bundle 膨胀

```tsx
// app/page.tsx（Server）
const posts = await db.post.findMany()    // 1000 条
return <PostList posts={posts} />          // 全部序列化进 RSC Payload
```

序列化的 1000 条都通过 RSC Payload 传到客户端。如果 PostList 只展示标题列表，浪费带宽。

修复：在 Server Component 里只 select / 转换需要的字段：

```tsx
const posts = await db.post.findMany({
  select: { id: true, title: true },     // 只 title + id
  take: 50,                               // 分页
})
```

### 9. Layout 拿不到 pathname / searchParams

Layout **不重新渲染**，所以拿到的 pathname / searchParams 是初始值，导航后陈旧。

```tsx
// ❌ Layout 里拿不到当前 pathname
import { usePathname } from 'next/navigation'   // ❌ Server Component 不能用 hook
```

修复：在子 Client Component 里拿：

```tsx
// app/components/NavLinks.tsx
'use client'
import { usePathname } from 'next/navigation'

export default function NavLinks() {
  const pathname = usePathname()   // ✅ Client Component 会重新渲染
  // ...
}
```

### 10. Server Action 内部 redirect 后代码继续执行

```ts
'use server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  await createSession(formData)
  redirect('/dashboard')          // 抛出异常
  console.log('after')             // ❌ 不会执行
}
```

`redirect()` 抛出特殊异常被框架捕获处理。**别 try/catch 包裹它**，否则 redirect 失效：

```ts
// ❌
try {
  redirect('/dashboard')
} catch (e) {
  // 捕获了 redirect 的异常 → redirect 不生效
}

// ✅ 让它自然抛出
redirect('/dashboard')
```

### 11. `cookies().set()` 在 Server Component 里抛错

Server Component **不能写 cookie**（只能读），必须在 Server Action / Route Handler / Middleware 写：

```tsx
// ❌ Server Component
import { cookies } from 'next/headers'
export default async function Page() {
  const cookieStore = await cookies()
  cookieStore.set('theme', 'dark')   // ❌ 抛错
}

// ✅ Server Action
'use server'
import { cookies } from 'next/headers'
export async function setTheme(theme: string) {
  const cookieStore = await cookies()
  cookieStore.set('theme', theme)    // ✅
}
```

### 12. 大文件 / 资源放 `public/` 而非 import

`public/` 文件不经 Webpack/Turbopack，直接 serve。**不会 fingerprint**，不利于 cache。

```tsx
// ❌ 改图标后浏览器还吃旧 cache
<img src="/icon.png" />

// ✅ static import → 自动 fingerprint（icon.abc123.png）
import icon from '@/public/icon.png'
<Image src={icon} alt="icon" />
```

例外：`robots.txt` / `favicon.ico` / `sitemap.xml` 等必须固定路径的文件放 `public/`。

### 13. 第三方 Client lib 没标 `'use client'`

Server Component 里 import 第三方 Client lib（用 `useState`、`window`）会 build 错。修复：

```tsx
// app/components/Carousel.tsx
'use client'
import { Carousel } from 'acme-carousel'
export default Carousel
```

然后在 Server Component import 自己的 wrapper。

### 14. Vercel deploy 时 build cache 与 dev 不一致

Vercel 部署看到 build 错但本地 build 正常：

- Vercel 用 `next build` + 干净 install，可能 `node_modules` 不同（lockfile 锁版本）
- 本地用 `pnpm dev` 没跑过 `next build`
- HMR cache 让 dev 行为与 build 不同

修复：本地 `rm -rf .next && pnpm build && pnpm start` 验证再 deploy。

## Pages Router 长尾

Pages Router 仍长期维护，不会强制删除。但新功能基本都只加到 App Router：

- RSC、Server Actions、Streaming、PPR、Cache Components → 只有 App Router
- `next/font`、`next/image`、Metadata API → 两者都有
- `cookies()` / `headers()` 函数 → 只 App Router；Pages Router 用 `req.cookies` / `req.headers`

如果项目纯 Pages Router 跑得好，没强需求不用迁。新模块可以放 `app/` 共存。

## 移动端 / 桌面端

Next.js 是 Web 框架。要打包成移动 / 桌面 app：

- **Capacitor**：把 Next.js 的 `output: 'export'` 静态产物打成 iOS / Android（不支持 SSR / Server Action）
- **Tauri**：用 Rust 内核包前端，做桌面 app
- **Electron**：传统桌面 app；可包 Next.js dev server 但启动重

Next.js 本身没有官方移动 / 桌面适配方案。React Native 与 Next.js 是不同栈，不能直接共享组件（但能共享 hook / 业务逻辑）。

## 文档与笔记

官方资源：

- [文档](https://nextjs.org/docs)
- [GitHub](https://github.com/vercel/next.js)
- [Learn Next.js](https://nextjs.org/learn) —— 官方互动教程
- [Examples](https://github.com/vercel/next.js/tree/canary/examples) —— 100+ 模板项目
- [Blog](https://nextjs.org/blog) —— 每个版本发布说明

社区：

- [Vercel Discord](https://vercel.community/) —— Next.js 频道活跃
- [Reddit r/nextjs](https://www.reddit.com/r/nextjs/)
- [Theo - t3.gg](https://www.youtube.com/@t3dotgg) —— 实战教程 YouTuber

## 总结

- App Router 是主推方向，新项目用 App Router
- Pages Router 不会删，老项目继续用 / 共存迁移
- Next.js 升级激进，每个大版本看完 upgrade 文档再升
- 元框架横向：React 选 Next.js / Remix；Vue 选 Nuxt；不限框架选 Astro
- 常见坑多在 RSC 边界、缓存语义、async API、'use client' 传染上
