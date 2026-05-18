---
layout: doc
outline: [2, 3]
---

# 参考

> Next.js 15.x（App Router）全部 API / 文件约定 / 配置 / Hook 速查

## 文件约定

`app/` 目录里的特殊文件名决定其在路由中的角色。

| 文件 | 路径 | 作用 |
|---|---|---|
| `layout` | 任意段 | 共享布局，导航时保持挂载 |
| `page` | 任意段 | 路由公开页面（叶子） |
| `loading` | 任意段 | Suspense fallback |
| `error` | 任意段 | Error boundary（Client） |
| `not-found` | 任意段 | 404 UI |
| `global-error` | `app/` | 根 error boundary（替换 root layout） |
| `route` | 任意段 | API 端点（与 `page` 互斥） |
| `template` | 任意段 | 类似 layout 但每次导航重新挂载 |
| `default` | 任意段 | parallel route fallback |
| `middleware` / `proxy` | 项目根 | 请求级中间件（15 是 middleware；16 改 proxy） |
| `instrumentation` | 项目根 | 服务启动钩子 |
| `instrumentation-client` | 项目根 | 客户端启动钩子（Next.js 15.x） |

支持扩展名：`.tsx` / `.jsx` / `.ts` / `.js`（`route` 不支持 jsx/tsx）。

### `layout.tsx`

```tsx
export default function Layout({
  children,
  params,           // Promise<{ ... }>，可选
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  return <section>{children}</section>
}

// 可选：导出 metadata
export const metadata = { title: 'My App' }

// 可选：generateMetadata
export async function generateMetadata({ params }) {
  return { title: 'Dynamic' }
}
```

**根布局必须有 `<html>` + `<body>`**。子布局不要。

### `page.tsx`

```tsx
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { slug } = await params
  const { q } = await searchParams
  return <h1>{slug}</h1>
}
```

### `loading.tsx`

```tsx
export default function Loading() {
  return <div>Loading...</div>
}
```

### `error.tsx`

```tsx
'use client'   // 必须

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

> Next.js 16 起 `reset` 改名 `unstable_retry`，签名 `unstable_retry: () => void`。

### `not-found.tsx`

```tsx
export default function NotFound() {
  return <h2>Page not found</h2>
}
```

### `global-error.tsx`

```tsx
'use client'

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body>
        <p>Critical: {error.message}</p>
        <button onClick={reset}>Try again</button>
      </body>
    </html>
  )
}
```

### `route.ts`

```ts
import type { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return Response.json({ ok: true })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  return Response.json(body)
}

export const dynamic = 'auto'
export const revalidate = 60
export const runtime = 'nodejs'
```

支持的方法：`GET`、`HEAD`、`POST`、`PUT`、`PATCH`、`DELETE`、`OPTIONS`。

### `template.tsx`

```tsx
export default function Template({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}
```

每次导航重新挂载（状态丢失），适合 enter/leave 动画。

### `default.tsx`

parallel route 未匹配时的 fallback：

```tsx
export default function Default() {
  return null
}
```

> Next.js 16 起 parallel route 的每个 slot **必须**有 `default.tsx`，否则 build 失败。

### `instrumentation.ts`

```ts
export function register() {
  // 服务启动时跑一次
}

export async function onRequestError(err, request, context) {
  // 捕获未捕获的服务端错误
}
```

### `proxy.ts` / `middleware.ts`

```ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {     // Next.js 16
// export function middleware(request: NextRequest) {  // Next.js 15
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
```

## 路由约定

| 模式 | 例 | URL |
|---|---|---|
| 静态段 | `app/about/page.tsx` | `/about` |
| 动态段 | `app/blog/[slug]/page.tsx` | `/blog/hello` |
| Catch-all | `app/shop/[...slug]/page.tsx` | `/shop/a/b/c` |
| 可选 catch-all | `app/docs/[[...slug]]/page.tsx` | `/docs`、`/docs/a/b` |
| 路由分组 | `app/(marketing)/about/page.tsx` | `/about`（无 `(marketing)`） |
| 私有目录 | `app/blog/_lib/api.ts` | 不参与路由 |
| Parallel | `app/dashboard/@analytics/page.tsx` | slot 注入到父 layout |
| Intercepting same | `app/feed/(.)photo/[id]/page.tsx` | 拦截同级 `/photo/:id` |
| Intercepting parent | `app/feed/(..)photo/[id]/page.tsx` | 拦截父级 |
| Intercepting root | `app/feed/(...)photo/[id]/page.tsx` | 拦截根 |

## 指令（Directives）

| 指令 | 作用 |
|---|---|
| `'use client'` | 文件首行：标为 Client Component；可用 hooks / events / browser API |
| `'use server'` | 函数首行 / 文件首行：标为 Server Action / Server Functions |
| `'use cache'` | （Next.js 16+ Cache Components）函数 / 组件首行：缓存返回值 |
| `'use cache: private'` | 私有缓存（不跨用户共享） |
| `'use cache: remote'` | 远程持久缓存 |

## 函数 API（`next/navigation` / `next/headers` / `next/cache`）

### Navigation 函数

| 函数 | 签名 | 用途 |
|---|---|---|
| `redirect(url)` | `(url: string, type?: 'replace' \| 'push') => never` | 302 临时重定向（抛异常） |
| `permanentRedirect(url)` | 同上 | 308 永久重定向 |
| `notFound()` | `() => never` | 触发最近的 `not-found.tsx` |
| `forbidden()` | `() => never` | 触发 `forbidden.tsx`（canary） |
| `unauthorized()` | `() => never` | 触发 `unauthorized.tsx`（canary） |

```ts
import { redirect, notFound, permanentRedirect } from 'next/navigation'

if (!user) redirect('/login')
if (!post) notFound()
permanentRedirect('/new-url')
```

### Headers / Cookies 函数（都是 async）

| 函数 | 签名 | 用途 |
|---|---|---|
| `cookies()` | `() => Promise<ReadonlyRequestCookies \| RequestCookies>` | 读 / 写 cookie |
| `headers()` | `() => Promise<ReadonlyHeaders>` | 读 request headers |
| `draftMode()` | `() => Promise<{ isEnabled: boolean; enable(): void; disable(): void }>` | 草稿模式开关 |

```ts
import { cookies, headers, draftMode } from 'next/headers'

const cookieStore = await cookies()
cookieStore.get('session')
cookieStore.set('theme', 'dark')   // 仅 Server Action / Route Handler
cookieStore.delete('session')

const headersList = await headers()
headersList.get('user-agent')

const draft = await draftMode()
if (draft.isEnabled) { ... }
```

### Cache 函数（`next/cache`）

| 函数 | 用途 |
|---|---|
| `revalidatePath(path, type?)` | 失效路径的 Full Route Cache（`type: 'page' \| 'layout'`） |
| `revalidateTag(tag, cacheLife?)` | 失效带 tag 的 Data Cache（Next.js 16 第二参数必填） |
| `updateTag(tag)` | （Next.js 16）立即失效 + 当前请求强制刷新（read-your-writes） |
| `refresh()` | （Next.js 16）刷新客户端 router |
| `unstable_cache(fn, keys, opts)` | 缓存非 fetch 函数 |
| `unstable_noStore()` | 显式声明组件依赖 request-time 数据 |
| `cacheLife(profile)` | （Cache Components）设置缓存生命周期 |
| `cacheTag(...tags)` | （Cache Components）给 `'use cache'` 加 tag |

```ts
import {
  revalidatePath, revalidateTag, updateTag, refresh,
  unstable_cache, unstable_noStore,
  cacheLife, cacheTag,
} from 'next/cache'

revalidatePath('/blog')
revalidatePath('/blog/[slug]', 'page')   // 模板路径
revalidateTag('posts')

// Next.js 16
revalidateTag('posts', 'max')
updateTag('user-profile')

// unstable_cache 用法
const getCached = unstable_cache(
  async (id) => db.query(id),
  ['user-by-id'],
  { tags: ['users'], revalidate: 3600 }
)

// Cache Components 用法
async function getProducts() {
  'use cache'
  cacheLife('hours')
  cacheTag('products')
  return db.product.findMany()
}
```

### `connection` —— 强制 dynamic

```ts
import { connection } from 'next/server'

async function Component() {
  await connection()
  // 后续代码确保在请求时执行（不会被 prerendered）
  const random = crypto.randomUUID()
  return <p>{random}</p>
}
```

### `unstable_after` —— 响应后跑

```ts
import { unstable_after as after } from 'next/server'

after(() => {
  // 响应已发给用户后再跑
  trackAnalytics()
})
```

### `userAgent`

```ts
import { userAgent } from 'next/server'

export function proxy(request: NextRequest) {
  const { device, browser, os } = userAgent(request)
  // device.type: 'mobile' | 'tablet' | 'desktop' | undefined
}
```

### Metadata 函数

| 函数 | 用途 |
|---|---|
| `generateMetadata({ params, searchParams })` | 动态生成 metadata（async） |
| `generateStaticParams()` | 为动态段预生成 params（build 时） |
| `generateImageMetadata({ params })` | 为 OG image / icon 生成多个变体 |
| `generateSitemaps()` | 生成多个 sitemap（大型站） |
| `generateViewport()` | 动态 viewport |

```ts
// 静态 metadata
export const metadata: Metadata = {
  title: 'My App',
  description: '...',
  openGraph: { title: 'OG title', images: ['/og.png'] },
  twitter: { card: 'summary_large_image' },
  alternates: { canonical: 'https://...' },
  robots: { index: true, follow: true },
}

// 动态
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  return { title: post.title }
}
```

`Metadata` 类型字段（部分）：

| 字段 | 类型 | 例 |
|---|---|---|
| `title` | string \| { default, template, absolute } | `'About'` |
| `description` | string | `'About page'` |
| `keywords` | string \| string[] | `['nextjs']` |
| `authors` | { name, url }[] | `[{ name: 'Tom' }]` |
| `openGraph` | object | `{ title, images, url, type, locale }` |
| `twitter` | object | `{ card, title, images }` |
| `alternates` | object | `{ canonical, languages }` |
| `icons` | object | `{ icon, apple, shortcut }` |
| `robots` | object \| string | `{ index, follow, nocache }` |
| `metadataBase` | URL | `new URL('https://example.com')` |
| `verification` | object | `{ google: '...' }` |
| `appLinks` / `appleWebApp` | object | iOS app 关联 |

## Hooks（`next/navigation`）

| Hook | 用途 |
|---|---|
| `useRouter()` | 编程式导航：`push` / `replace` / `back` / `forward` / `refresh` / `prefetch` |
| `usePathname()` | 当前路径（如 `/blog/hello`） |
| `useSearchParams()` | 当前 search params（`URLSearchParams` 实例） |
| `useParams()` | 当前动态段 params（**同步**，与 page props 的 `params` 不同） |
| `useSelectedLayoutSegment(slot?)` | 当前 layout 下选中的子段 |
| `useSelectedLayoutSegments(slot?)` | 当前 layout 下所有选中子段（数组） |
| `useLinkStatus()` | 监听 `<Link>` 的 pending 状态（用 in nav 组件） |
| `useReportWebVitals(callback)` | Web Vitals 上报 |

```tsx
'use client'

import {
  useRouter, usePathname, useSearchParams, useParams,
  useSelectedLayoutSegment, useSelectedLayoutSegments,
} from 'next/navigation'

function MyComponent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const params = useParams<{ slug: string }>()   // 同步！
  const segment = useSelectedLayoutSegment()
  const segments = useSelectedLayoutSegments()

  // router 方法
  router.push('/dashboard')
  router.replace('/login')
  router.back()
  router.forward()
  router.refresh()                                 // 重拉当前 RSC
  router.prefetch('/expensive')
}
```

> `useParams` 在 hook 里同步；`page.tsx` 的 `params` prop 是 Promise。两套机制不同。

## React 19 新 Hooks（在 App Router 中常用）

| Hook | 用途 |
|---|---|
| `useActionState(action, initialState)` | 绑定 Server Action + state（替代 `useFormState`） |
| `useFormStatus()` | 表单子组件读 pending |
| `useTransition()` | 标记非紧急更新（pending state） |
| `use(promise)` | 解开 Promise（触发 Suspense） |
| `use(context)` | 替代 useContext（也支持） |
| `useOptimistic(state, updateFn)` | 乐观更新 |

```tsx
'use client'

import { useActionState, useFormStatus, useOptimistic } from 'react'

// useActionState
const [state, formAction, pending] = useActionState(action, null)
<form action={formAction}>...</form>

// useFormStatus
function SubmitButton() {
  const { pending, data, method, action } = useFormStatus()
  return <button disabled={pending}>Submit</button>
}

// useOptimistic
const [optimisticPosts, addOptimisticPost] = useOptimistic(
  posts,
  (state, newPost) => [...state, { ...newPost, pending: true }]
)

async function add(formData: FormData) {
  addOptimisticPost({ title: formData.get('title') })
  await createPostAction(formData)
}
```

## 组件（`next/*`）

### `<Link>`

```tsx
import Link from 'next/link'

<Link
  href="/dashboard"
  replace={false}
  scroll={true}
  prefetch="auto"     // 'auto' | true | false | null
  onNavigate={(e) => { /* e.preventDefault() 取消 */ }}
  transitionTypes={['slide-in']}   // Next.js 16+
>
  Dashboard
</Link>
```

| Prop | 类型 | 默认 | 作用 |
|---|---|---|---|
| `href` | string \| UrlObject | 必填 | 路径 / URL 对象 |
| `replace` | boolean | false | 替换历史而非 push |
| `scroll` | boolean | true | 导航后滚动到 page 顶 |
| `prefetch` | boolean \| null \| 'auto' | 'auto' | 静态全 prefetch；动态 partial prefetch |
| `onNavigate` | `(e) => void` | - | 客户端导航时触发 |
| `transitionTypes` | string[] | - | （Next.js 16）View Transitions 类型 |

### `<Image>`

```tsx
import Image from 'next/image'

<Image
  src="/profile.png"
  alt="Profile"
  width={500}
  height={500}
  fill={false}
  sizes="(max-width: 768px) 100vw, 500px"
  quality={75}
  placeholder="blur"   // 'blur' | 'empty' | data URL
  blurDataURL="data:image/png;base64,..."
  priority={false}
  loading="lazy"       // 'lazy' | 'eager'
  unoptimized={false}
  loader={customLoader}
  onLoad={(e) => {}}
  onError={(e) => {}}
/>
```

| Prop | 默认 | 用途 |
|---|---|---|
| `src` | 必填 | 本地 import / 远程 URL |
| `alt` | 必填 | 可访问性 |
| `width` / `height` | - | 必须给（除非 fill） |
| `fill` | false | 填充父容器（父需 `position: relative`） |
| `sizes` | - | 响应式 hint |
| `priority` | false | LCP 图片，跳过懒加载 |
| `quality` | 75 | 1-100；Next.js 16 默认 qualities 限制为 [75] |
| `placeholder` | 'empty' | 'blur' / data URL |
| `loading` | 'lazy' | 'eager' 立即加载 |

### `<Script>`

```tsx
import Script from 'next/script'

<Script
  src="https://analytics.example.com/script.js"
  strategy="afterInteractive"
  onLoad={() => console.log('loaded')}
  onError={(e) => console.error(e)}
/>
```

| Strategy | 时机 |
|---|---|
| `beforeInteractive` | HTML 阻塞，hydration 前 |
| `afterInteractive`（默认） | hydration 后 |
| `lazyOnload` | 浏览器空闲时 |
| `worker` | Web Worker 里跑（experimental） |

### `<Form>`（Next.js 15.x）

```tsx
import Form from 'next/form'

<Form action="/search">
  <input name="q" />
  <button>Search</button>
</Form>
```

类似 `<form>` 但提交时走客户端导航 + prefetch action 路由 + RSC 复用。适合 GET 搜索表单。

## `NextRequest` / `NextResponse`

### `NextRequest`

```ts
import type { NextRequest } from 'next/server'

export function handler(request: NextRequest) {
  request.url                       // 完整 URL string
  request.nextUrl                   // URL 实例 + 扩展
  request.nextUrl.pathname
  request.nextUrl.searchParams
  request.nextUrl.clone()

  request.method
  request.headers.get('...')

  request.cookies.get('name')?.value
  request.cookies.getAll()
  request.cookies.set('name', 'value')
  request.cookies.delete('name')
  request.cookies.has('name')

  // 不同 platform 可能加自己的字段（geo / ip 等 Vercel 提供）
}
```

### `NextResponse`

```ts
import { NextResponse } from 'next/server'

NextResponse.next()
NextResponse.next({ request: { headers: newHeaders } })

NextResponse.redirect(new URL('/login', request.url))
NextResponse.redirect(new URL('/login', request.url), 301)

NextResponse.rewrite(new URL('/page', request.url))

NextResponse.json({ ok: true }, { status: 200 })

// 修改 response
const response = NextResponse.next()
response.headers.set('x-custom', '1')
response.cookies.set('name', 'value', { httpOnly: true, secure: true })
return response
```

## `ImageResponse`（动态生成 OG 图）

```tsx
// app/og/route.tsx
import { ImageResponse } from 'next/og'

export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        display: 'flex',
        background: '#fff',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 60,
      }}>
        Hello World
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
```

或文件约定：

```
app/
└── about/
    └── opengraph-image.tsx
```

```tsx
// app/about/opengraph-image.tsx
import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OG() {
  return new ImageResponse(<div>About</div>, { ...size })
}
```

## Route Segment Config

每个 `layout.tsx` / `page.tsx` / `route.ts` 可 export 这些常量：

| 配置 | 类型 | 默认 | 作用 |
|---|---|---|---|
| `dynamic` | `'auto' \| 'force-dynamic' \| 'force-static' \| 'error'` | `'auto'` | 强制渲染模式 |
| `dynamicParams` | `boolean` | `true` | `generateStaticParams` 之外的 params 是否允许 dynamic |
| `revalidate` | `false \| 0 \| number` | `false` | 路由级 revalidate（秒） |
| `fetchCache` | 7 种 | `'auto'` | 覆盖该段所有 fetch 的默认 cache |
| `runtime` | `'nodejs' \| 'edge'` | `'nodejs'` | 运行时 |
| `preferredRegion` | `'auto' \| 'global' \| 'home' \| string \| string[]` | `'auto'` | 区域偏好（Vercel） |
| `maxDuration` | `number` | 平台默认 | 函数最长执行秒数（Vercel） |

```ts
// app/page.tsx
export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = 60
export const fetchCache = 'default-cache'
export const runtime = 'nodejs'
export const preferredRegion = 'auto'
export const maxDuration = 5
```

### `fetchCache` 详解

| 值 | 行为 |
|---|---|
| `'auto'` | 默认，按各 fetch 自身的 cache 选项 |
| `'default-cache'` | 没指定 cache 选项的 fetch 默认 `'force-cache'` |
| `'only-cache'` | 没指定 cache 选项的 fetch 默认 `'force-cache'`；用 `'no-store'` 报错 |
| `'force-cache'` | 所有 fetch 强制 `'force-cache'` |
| `'default-no-store'` | 没指定 cache 选项的 fetch 默认 `'no-store'` |
| `'only-no-store'` | 没指定 cache 选项的 fetch 默认 `'no-store'`；用 `'force-cache'` 报错 |
| `'force-no-store'` | 所有 fetch 强制 `'no-store'` |

## `next.config.ts` 配置项

完整字段（按字母序常用）：

| 配置 | 类型 | 用途 |
|---|---|---|
| `appDir` | boolean | 启用 App Router（Next.js 13.4+ 默认 true） |
| `assetPrefix` | string | CDN 前缀 |
| `basePath` | string | 子路径部署（`/docs`） |
| `cacheComponents` | boolean | （Next.js 16）启用 Cache Components / PPR |
| `cacheHandler` | string | 自定义 ISR cache handler 路径 |
| `compress` | boolean | gzip 响应（默认 true） |
| `crossOrigin` | 'anonymous' \| 'use-credentials' | `<script>` crossOrigin |
| `cssChunking` | 'loose' \| 'strict' \| false | CSS 文件切分策略 |
| `deploymentId` | string | 版本 skew 保护 |
| `devIndicators` | object | 开发指示器配置 |
| `distDir` | string | 输出目录（默认 `.next`） |
| `env` | object | 静态注入的 env vars |
| `eslint` | object | ESLint 行为（Next.js 16 移除） |
| `experimental` | object | 实验性 flags |
| `expireTime` | number | ISR 过期 SWR 时间 |
| `generateBuildId` | () => string | 自定义 build id |
| `generateEtags` | boolean | 生成 etag（默认 true） |
| `headers` | () => Headers[] | 全局自定义 response headers |
| `htmlLimitedBots` | string[] | 给特定 bot 阻塞渲染 |
| `httpAgentOptions` | object | HTTP Keep-Alive |
| `images` | object | next/image 配置 |
| `logging` | object | dev 日志 |
| `output` | 'standalone' \| 'export' | 输出模式 |
| `pageExtensions` | string[] | 路由文件扩展名 |
| `poweredByHeader` | boolean | `X-Powered-By: Next.js`（默认 true） |
| `productionBrowserSourceMaps` | boolean | prod source map |
| `proxyClientMaxBodySize` | string \| number | proxy 请求 body 大小限制（Next.js 16） |
| `reactCompiler` | boolean | （Next.js 16）启用 React Compiler |
| `reactStrictMode` | boolean | StrictMode（默认 true） |
| `redirects` | () => Redirect[] | 永久 / 临时重定向 |
| `rewrites` | () => Rewrite[] | URL 重写 |
| `sassOptions` | object | Sass 编译选项 |
| `serverActions` | object | Server Action 配置（body 大小等） |
| `serverComponentsHmrCache` | boolean | dev fetch HMR cache |
| `serverExternalPackages` | string[] | 不打包进 RSC bundle 的包 |
| `staleTimes` | object | Router Cache 时长 |
| `taint` | boolean | 启用 taint API |
| `trailingSlash` | boolean | URL 末尾 / |
| `transpilePackages` | string[] | 强制 transpile 的包 |
| `turbopack` | object | Turbopack 配置（Next.js 16 顶层） |
| `typedRoutes` | boolean | 静态类型的 `<Link>` href |
| `typescript` | object | TS 行为（如 `ignoreBuildErrors`） |
| `webVitalsAttribution` | string[] | Web Vitals attribution |
| `webpack` | (config) => config | 自定义 Webpack 配置（Turbopack 不识别） |

### `images` 完整字段

```ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.example.com', pathname: '/**' },
    ],
    localPatterns: [    // Next.js 16
      { pathname: '/assets/**', search: '?v=1' },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],    // Next.js 16 去掉 16
    formats: ['image/webp'],                              // 或 'image/avif'
    qualities: [75],                                      // Next.js 16 默认仅 [75]
    minimumCacheTTL: 60,                                  // Next.js 16 默认 4h
    dangerouslyAllowSVG: false,
    dangerouslyAllowLocalIP: false,                       // Next.js 16
    contentSecurityPolicy: "default-src 'self'; ...",
    contentDispositionType: 'attachment',
    maximumRedirects: 3,                                  // Next.js 16
    loader: 'default',                                    // 或 'custom'
    loaderFile: './lib/image-loader.ts',
    unoptimized: false,
    path: '/_next/image',
  },
}
```

### `headers()` / `redirects()` / `rewrites()`

```ts
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'X-Custom', value: 'value' },
        ],
      },
    ]
  },

  async redirects() {
    return [
      {
        source: '/old',
        destination: '/new',
        permanent: true,   // 308 永久
      },
      {
        source: '/blog/:slug',
        destination: '/posts/:slug',
        permanent: false,  // 307 临时
      },
    ]
  },

  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'https://external.example.com/:path*',
      },
    ]
    // 也可以 [beforeFiles, afterFiles, fallback] 数组
  },
}
```

### `experimental`（常用 flag）

```ts
const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
    staleTimes: { dynamic: 30, static: 180 },
    optimizePackageImports: ['lucide-react', 'date-fns'],
    typedRoutes: true,                              // Next.js 15.x，16 提升到顶层
    ppr: true,                                       // Next.js 15 PPR；16 改 cacheComponents
    reactCompiler: true,                             // Next.js 15 实验；16 提升到顶层
    serverComponentsHmrCache: true,
    turbopackFileSystemCacheForDev: true,            // Next.js 16
  },
}
```

## CLI

### `next` 命令

```bash
next dev [dir]              # 启动 dev server
  --port, -p 3000
  --hostname, -H localhost
  --turbopack                # Next.js 15 启用 Turbopack（16 默认）
  --webpack                  # Next.js 16 回退 Webpack
  --experimental-https       # 自签 HTTPS

next build [dir]            # 生产 build
  --debug
  --profile                  # 启用 React profiler
  --no-lint                  # Next.js 15
  --turbopack / --webpack

next start [dir]            # 启动生产 server（需先 build）
  --port, -p 3000
  --hostname, -H localhost

next lint                   # Next.js 16 已删除
  --dir / --file / --fix

next info                   # 输出环境信息（提 issue 用）
next telemetry [enable|disable|status]
next typegen                # 生成 PageProps/LayoutProps/RouteContext 类型
next upgrade                # Next.js 16.1+ 升级命令
```

### `create-next-app`

```bash
pnpm create next-app@latest [name]
  --typescript
  --javascript
  --tailwind
  --eslint
  --app                      # App Router
  --src-dir                  # src/ 目录
  --import-alias "@/*"
  --use-pnpm
  --yes                      # 跳过交互
```

## 文件路径 / 环境 / Magic

### 路径别名

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 环境变量

| 文件 | 加载场景 | git track |
|---|---|---|
| `.env` | 所有环境 | ✅ |
| `.env.local` | 所有环境（test 除外） | ❌ |
| `.env.development` | dev | ✅ |
| `.env.production` | prod | ✅ |
| `.env.development.local` | dev | ❌ |
| `.env.production.local` | prod | ❌ |

**`NEXT_PUBLIC_*` 前缀**变量才会进客户端 bundle。

### Runtime 检测

```ts
process.env.NEXT_RUNTIME       // 'nodejs' | 'edge' | undefined（build / typegen）
process.env.NODE_ENV            // 'development' | 'production' | 'test'
process.env.NEXT_PUBLIC_*       // 客户端可见
```

### 全局类型 helpers（Next.js 15.5+）

`next typegen` / `next dev` / `next build` 生成：

```ts
PageProps<'/blog/[slug]'>     // 自动推断 params 类型
LayoutProps<'/dashboard'>      // 自动推断 children + 命名 slot
RouteContext<'/users/[id]'>    // Route Handler 的 ctx 类型
```

无需 import，全局可用：

```tsx
export default async function Page(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params
  return <h1>{slug}</h1>
}
```

## 内置 metadata 文件约定

| 文件 | 用途 |
|---|---|
| `favicon.ico` | favicon |
| `icon.png` / `apple-icon.png` | app icon |
| `icon.tsx` / `apple-icon.tsx` | 代码生成 icon（用 `ImageResponse`） |
| `opengraph-image.png` / `twitter-image.png` | OG image / Twitter card |
| `opengraph-image.tsx` / `twitter-image.tsx` | 代码生成 OG / Twitter image |
| `sitemap.xml` | 静态 sitemap |
| `sitemap.ts` | 动态生成 sitemap |
| `robots.txt` | 静态 robots |
| `robots.ts` | 动态生成 robots |
| `manifest.json` / `manifest.ts` | PWA manifest |

### `sitemap.ts` 示例

```ts
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts()
  return [
    { url: 'https://example.com', lastModified: new Date() },
    ...posts.map((post) => ({
      url: `https://example.com/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ]
}
```

### `robots.ts` 示例

```ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/admin/',
    },
    sitemap: 'https://example.com/sitemap.xml',
  }
}
```

### `manifest.ts` 示例

```ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'My App',
    short_name: 'App',
    start_url: '/',
    display: 'standalone',
    background_color: '#fff',
    theme_color: '#000',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
```

## 内置 imports（`next/*`）

| 模块 | 主要 export |
|---|---|
| `next/link` | `Link` |
| `next/image` | `Image`, `getImageProps` |
| `next/script` | `Script` |
| `next/form` | `Form` |
| `next/font/google` | `Inter`, `Roboto`, `Geist`, ... |
| `next/font/local` | `localFont` |
| `next/navigation` | `useRouter`, `usePathname`, `useSearchParams`, `useParams`, `redirect`, `notFound`, `permanentRedirect`, `useSelectedLayoutSegment`, `useSelectedLayoutSegments`, `useLinkStatus` |
| `next/headers` | `cookies`, `headers`, `draftMode` |
| `next/cache` | `revalidatePath`, `revalidateTag`, `unstable_cache`, `unstable_noStore`, `updateTag`, `refresh`, `cacheLife`, `cacheTag` |
| `next/server` | `NextRequest`, `NextResponse`, `NextFetchEvent`, `userAgent`, `connection`, `after`, `ImageResponse` |
| `next/og` | `ImageResponse` |
| `next/dynamic` | `dynamic`（异步组件） |
| `next/web-vitals` | `useReportWebVitals` |

### `next/dynamic`

```ts
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <p>Loading...</p>,
  ssr: false,    // 仅客户端（'use client' 文件里可用）
})
```

## Server Component vs Client Component 速查

| 能力 | Server | Client |
|---|---|---|
| `async/await` 函数体 | ✅ | ❌ |
| `useState` / `useReducer` | ❌ | ✅ |
| `useEffect` / `useLayoutEffect` | ❌ | ✅ |
| `useContext` | ❌ | ✅ |
| 浏览器 API (`window`, `localStorage`) | ❌ | ✅ |
| 事件处理 (`onClick`, `onChange`) | ❌ | ✅ |
| `cookies()` / `headers()` 调用 | ✅ | ❌ |
| 直连数据库 / ORM | ✅ | ❌ |
| 用 `process.env.SECRET_*` | ✅ | ❌（只能 `NEXT_PUBLIC_*`） |
| 接收任意类型 props | ✅ | ❌（必须可序列化） |
| 作为子组件 props 给 Client Component | ✅（通过 `children` 等） | ✅ |

## CSS / 样式

| 方式 | 文件约定 |
|---|---|
| Global CSS | `app/globals.css` + `import './globals.css'` |
| CSS Modules | `Component.module.css` |
| Tailwind CSS | `tailwind.config.ts` + `globals.css` |
| Sass / SCSS | `.scss` / `.sass` 开箱即用 |
| CSS-in-JS（runtime） | styled-components / Emotion + Client Component wrapper |
| CSS-in-JS（zero-runtime） | Linaria / vanilla-extract / Pigment CSS |

## 总结

`app/` 目录里：

- **文件名 = 行为**：layout / page / loading / error / not-found / route
- **目录 = URL 段**：嵌套 / 动态 / catch-all / 分组 / 私有 / parallel / intercept
- **指令决定边界**：`'use client'`、`'use server'`、`'use cache'`

每个 API 大概知道在哪个 import：

- `next/navigation` —— 导航、redirect、hook
- `next/headers` —— cookies / headers / draftMode（async）
- `next/cache` —— revalidate / 缓存指令
- `next/server` —— NextRequest / NextResponse / connection / userAgent
- `next/image` / `next/font` / `next/link` / `next/script` —— UI 组件 + 优化

更多细节回到 [getting-started](./getting-started.md) / [guide-line/base](./guide-line/base.md) / [advanced](./guide-line/advanced.md) / [expert](./guide-line/expert.md) / [other](./guide-line/other.md)。
