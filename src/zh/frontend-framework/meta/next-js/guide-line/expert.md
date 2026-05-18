---
layout: doc
outline: [2, 3]
---

# 指南 - 高级

> Middleware/Proxy、Edge Runtime、Image / Font 优化、i18n、Auth、Instrumentation、部署

## 速查

- Middleware（Next.js 15）/ Proxy（Next.js 16）：请求级中间件，rewrite / redirect / 设 headers / cookies / CORS / 鉴权
- Edge Runtime vs Node Runtime：Edge 跑 V8 isolate，启动快但 API 少；Node 全功能但启动慢
- `next/image`：自动 WebP / AVIF + 响应式 + 懒加载；本地图片自动推断 width/height；远程图片需 `remotePatterns`
- `next/font`：构建期下载并自托管 Google Fonts / 本地字体；零运行时；自动 `font-display: swap`
- `instrumentation.ts`：服务启动钩子；集成 OpenTelemetry（`@vercel/otel`）；`register()` 函数
- i18n：基于 Middleware 检测 locale + `[lang]` 动态段 + 字典懒加载
- Auth：Server Action + cookies + JWT；Auth.js / Clerk / Lucia / Better Auth 等库
- Draft Mode：CMS 预览未发布内容（`draftMode()` API）
- 部署：Vercel / Docker (`output: 'standalone'`) / Static Export / Adapter API
- Turbopack：Next.js 15 dev 默认；Next.js 16 dev + build 都默认

## Middleware（Next.js 15）/ Proxy（Next.js 16）

请求到达路由前先跑一段代码：鉴权、重定向、改 headers、A/B test。

### 文件位置

- **Next.js 15**：项目根 `middleware.ts`（或 `src/middleware.ts`）
- **Next.js 16**：项目根 `proxy.ts`（`middleware.ts` 仍可用但 deprecated）

> 升级用 codemod：`npx @next/codemod@canary middleware-to-proxy .`

### 基础

```ts
// proxy.ts（Next.js 16）/ middleware.ts（Next.js 15）
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // 鉴权示例
  const token = request.cookies.get('token')?.value
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/dashboard/:path*',
}
```

> Next.js 15 用 `export function middleware(...)`；Next.js 16 用 `export function proxy(...)`。功能基本一致。

### `matcher` —— 路径匹配

```ts
export const config = {
  matcher: [
    // 字符串
    '/about',
    '/dashboard/:path*',

    // 排除静态资源（最常用模式）
    '/((?!api|_next/static|_next/image|favicon.ico).*)',

    // 复杂条件
    {
      source: '/api/:path*',
      has: [
        { type: 'header', key: 'Authorization', value: 'Bearer Token' },
        { type: 'cookie', key: 'role', value: 'admin' },
      ],
      missing: [
        { type: 'cookie', key: 'session' },
      ],
    },
  ],
}
```

不写 `matcher` 时**每个请求都跑**（包括静态资源），所以**强烈建议**至少排除 `_next/*` 与图片。

### `NextResponse` —— 响应工具

```ts
import { NextResponse } from 'next/server'

// 继续到下一步（路由处理器或文件系统）
NextResponse.next()

// 重定向（302）
NextResponse.redirect(new URL('/login', request.url))

// 重写 URL（用户看到原 URL，实际渲染另一路由）
NextResponse.rewrite(new URL('/maintenance', request.url))

// 直接返回响应
NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

// 改请求 headers
const requestHeaders = new Headers(request.headers)
requestHeaders.set('x-user-id', '123')
NextResponse.next({
  request: { headers: requestHeaders },   // 后续路由能读到 x-user-id
})

// 设 cookie
const response = NextResponse.next()
response.cookies.set('locale', 'zh', {
  httpOnly: false,
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
})
```

### A/B 测试

```ts
export function proxy(request: NextRequest) {
  const bucket = request.cookies.get('bucket')?.value
    ?? (Math.random() > 0.5 ? 'a' : 'b')

  const response = NextResponse.rewrite(
    new URL(`/_variants/${bucket}${request.nextUrl.pathname}`, request.url)
  )
  response.cookies.set('bucket', bucket)
  return response
}
```

### 设置 CORS

```ts
import { NextResponse } from 'next/server'

const allowedOrigins = ['https://acme.com', 'https://app.acme.com']

export function proxy(request: NextRequest) {
  const origin = request.headers.get('origin') ?? ''
  const isAllowed = allowedOrigins.includes(origin)

  // Preflight
  if (request.method === 'OPTIONS') {
    return NextResponse.json({}, {
      headers: {
        'Access-Control-Allow-Origin': isAllowed ? origin : '',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  // 普通请求
  const response = NextResponse.next()
  if (isAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  return response
}

export const config = {
  matcher: '/api/:path*',
}
```

### Runtime

- **Next.js 15 middleware**：默认 Edge Runtime（V8 isolate），15.2+ 可改 Node.js（`export const runtime = 'nodejs'`），15.5 起 Node 稳定
- **Next.js 16 proxy**：**只支持 Node.js Runtime**，无法配 Edge。要 Edge 须继续用 `middleware.ts`（保留兼容）

### `waitUntil` —— 后台异步工作

```ts
import { NextResponse, NextFetchEvent } from 'next/server'

export function proxy(request: NextRequest, event: NextFetchEvent) {
  event.waitUntil(
    fetch('https://analytics.example.com', {
      method: 'POST',
      body: JSON.stringify({ path: request.nextUrl.pathname }),
    })
  )

  return NextResponse.next()
}
```

请求会立即返回，analytics 在后台跑完。

## Edge Runtime vs Node.js Runtime

Next.js 有两个服务端 runtime：

| | Edge Runtime | Node.js Runtime |
|---|---|---|
| 启动 | 极快（cold start ms 级） | 较慢（cold start 百 ms） |
| 全球分布 | 是（V8 isolate 边缘节点） | 通常区域部署 |
| API | Web Standard（fetch, Crypto, TextEncoder） | 全 Node.js（fs, child_process, Buffer） |
| `node_modules` | 限 ESM + 无 Node.js native | 全部 |
| 内存 / CPU | 受限（~128MB） | 充足 |
| 用途 | Middleware、轻量 Route Handler、SSR | 重业务逻辑、DB 直连、文件处理 |

### 配置 runtime

Route Handler 或 page：

```ts
// app/api/edge/route.ts
export const runtime = 'edge'

export async function GET() {
  return Response.json({ message: 'Hello from edge' })
}
```

或 layout / page：

```tsx
// app/edge-page/page.tsx
export const runtime = 'edge'

export default async function Page() {
  return <h1>Rendered on edge</h1>
}
```

### Edge 支持的 API

- **Network**: `fetch`、`Request`、`Response`、`Headers`、`FormData`、`WebSocket`
- **Encoding**: `TextEncoder`、`TextDecoder`、`atob`、`btoa`
- **Streams**: `ReadableStream`、`WritableStream`、`TransformStream`
- **Crypto**: `crypto.subtle`、`crypto.randomUUID`
- **Standard JS**: `Promise`、`Map`、`Set`、`URL`、`URLSearchParams`
- **Next.js polyfill**: `AsyncLocalStorage`

### Edge 不支持

- Node.js 内置：`fs`、`path`、`child_process`、`net`、`http`、`Buffer`
- `eval`、`new Function(string)`
- `WebAssembly.compile`、`WebAssembly.instantiate`（动态实例化）
- ISR（Incremental Static Regeneration）

如果用了不支持的 API，Next.js build 时报错。临时关闭检查：

```ts
// middleware.ts
export const config = {
  unstable_allowDynamic: ['**/node_modules/some-pkg/**'],
}
```

但运行时仍会抛错。

### 选用

- **Middleware / Proxy** → Edge（Next.js 15）/ Node（Next.js 16）
- **轻量 API（鉴权、redirect、读 KV）** → Edge
- **DB 直连（Prisma / Drizzle）** → Node
- **文件处理（图片、PDF）** → Node
- **SSR with `cookies()`/`headers()`** → 都行，Edge 更快

## `next/image` 完整用法

```tsx
import Image from 'next/image'

// 1. 本地图片（推荐）—— static import 自动推断 width/height/blurDataURL
import profile from '@/public/profile.png'

<Image
  src={profile}
  alt="Profile"
  placeholder="blur"   // 用 blurDataURL 做模糊预览
/>

// 2. 远程图片 —— 必须配 next.config.ts
<Image
  src="https://cdn.example.com/banner.jpg"
  alt="Banner"
  width={1200}
  height={400}
  priority             // LCP 图片用，跳过懒加载
  sizes="(max-width: 768px) 100vw, 1200px"
/>

// 3. fill 模式 —— 父容器决定尺寸
<div style={{ position: 'relative', width: '100%', height: '300px' }}>
  <Image
    src="/cover.jpg"
    alt="Cover"
    fill
    style={{ objectFit: 'cover' }}
  />
</div>
```

### 配置 `images.remotePatterns`

```ts
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudfront.net',   // 通配符
      },
    ],
    // Next.js 16 起默认 minimumCacheTTL 从 60s 提升到 4 小时
    minimumCacheTTL: 60 * 60 * 4,
    // qualities 限制（Next.js 16 默认 [75]）
    qualities: [75, 90, 100],
  },
}
```

### 自定义 loader

接 Cloudinary / Imgix 等外部图片服务：

```ts
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
  },
}
```

```ts
// lib/image-loader.ts
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: { src: string; width: number; quality?: number }) {
  return `https://res.cloudinary.com/demo/image/upload/w_${width},q_${quality || 'auto'}/${src}`
}
```

### 注意事项

- **`alt` 必填**：可访问性 + SEO
- **`width` + `height` 或 `fill` 二选一**（防止 CLS）
- **`priority` 只给 LCP**（首屏关键图片），过度用反而拖累
- **`sizes`**：响应式时给浏览器选最合适的图，少则浪费带宽
- **Static export**（`output: 'export'`）下需 `unoptimized: true` 或自定义 loader

## `next/font` 完整用法

构建期下载字体并自托管，**无运行时**，自动 `font-display: swap`。

### Google Fonts

```tsx
// app/layout.tsx
import { Geist, Inter, Roboto } from 'next/font/google'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',     // 用 CSS 变量
})

const inter = Inter({
  subsets: ['latin'],
})

// 非 variable 字体必须指定 weight
const roboto = Roboto({
  weight: ['400', '700'],
  subsets: ['latin'],
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${inter.className}`}>
      <body>{children}</body>
    </html>
  )
}
```

CSS 里用变量：

```css
/* globals.css */
.heading {
  font-family: var(--font-geist), system-ui, sans-serif;
}
```

### Local Fonts

```tsx
import localFont from 'next/font/local'

const myFont = localFont({
  src: './my-font.woff2',
})

// 或多个文件
const roboto = localFont({
  src: [
    { path: './Roboto-Regular.woff2', weight: '400', style: 'normal' },
    { path: './Roboto-Bold.woff2', weight: '700', style: 'normal' },
    { path: './Roboto-Italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-roboto',
})
```

### 子集与子集划分

```tsx
const geist = Geist({
  subsets: ['latin', 'latin-ext'],
})
```

未指定的字符（如中文）不被打包，bundle 小。中文用本地 woff2 + variable axis 字体（VF）效果好。

### 局部使用

字体作用域到使用的组件：

```tsx
// app/components/Heading.tsx
import { Playfair_Display } from 'next/font/google'

const playfair = Playfair_Display({ subsets: ['latin'] })

export default function Heading({ children }: { children: React.ReactNode }) {
  return <h1 className={playfair.className}>{children}</h1>
}
```

## Internationalization (i18n)

App Router 没有内置 i18n config（Pages Router 有），用 Middleware/Proxy + 动态段实现：

### 1. Middleware 检测 locale + redirect

```ts
// proxy.ts（或 middleware.ts）
import { NextResponse } from 'next/server'
import { match } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'

const locales = ['en', 'zh', 'ja']
const defaultLocale = 'en'

function getLocale(request: NextRequest) {
  const headers = { 'accept-language': request.headers.get('accept-language') ?? '' }
  const languages = new Negotiator({ headers }).languages()
  return match(languages, locales, defaultLocale)
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 已带 locale 的路径不处理
  if (locales.some(l => pathname.startsWith(`/${l}/`) || pathname === `/${l}`)) {
    return
  }

  // 重定向到带 locale 的路径
  const locale = getLocale(request)
  request.nextUrl.pathname = `/${locale}${pathname}`
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
}
```

### 2. `[lang]` 动态段

```
app/
└── [lang]/
    ├── layout.tsx
    ├── page.tsx
    └── about/page.tsx
```

```tsx
// app/[lang]/page.tsx
export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const dict = await getDictionary(lang)
  return <h1>{dict.greeting}</h1>
}
```

### 3. 字典懒加载

```ts
// app/[lang]/dictionaries.ts
import 'server-only'

const dictionaries = {
  en: () => import('./dictionaries/en.json').then(m => m.default),
  zh: () => import('./dictionaries/zh.json').then(m => m.default),
  ja: () => import('./dictionaries/ja.json').then(m => m.default),
}

export type Locale = keyof typeof dictionaries

export const hasLocale = (l: string): l is Locale => l in dictionaries
export const getDictionary = (l: Locale) => dictionaries[l]()
```

```json
// app/[lang]/dictionaries/en.json
{ "greeting": "Hello", "products": { "cart": "Add to Cart" } }
```

```json
// app/[lang]/dictionaries/zh.json
{ "greeting": "你好", "products": { "cart": "加入购物车" } }
```

### 4. 静态生成各 locale

```tsx
// app/[lang]/layout.tsx
export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'zh' }, { lang: 'ja' }]
}
```

build 时为每个 lang 生成静态页，CDN 直接命中。

### 第三方库

更完整方案：

- **next-intl** —— 类型安全 + ICU 消息格式 + 跨 RSC / Client 复用
- **next-international** —— TS 优先，零配置
- **paraglide-next** —— 静态字典 + 自动 tree-shaking
- **lingui** —— ICU + i18n CLI

```bash
pnpm add next-intl
```

## 鉴权（Authentication）

完整体系在 [getting-started](../getting-started.md) 的简化版基础上，进阶要点：

### Session 管理

两种：

- **Stateless**（JWT in cookie）：简单、无状态、Edge 友好；难撤销
- **Database session**（id in cookie + table）：可撤销、可记录设备；多一次 DB 查询

### Stateless（JWT）

```ts
// lib/session.ts
import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secretKey = process.env.SESSION_SECRET
const encodedKey = new TextEncoder().encode(secretKey)

export async function encrypt(payload: { userId: string; expiresAt: Date }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}

export async function decrypt(session: string) {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload
  } catch {
    return null
  }
}

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await encrypt({ userId, expiresAt })
  const cookieStore = await cookies()
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}
```

### Server Action 登录

```ts
// app/actions/auth.ts
'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { createSession, deleteSession } from '@/lib/session'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function login(prevState: any, formData: FormData) {
  const validated = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { error: 'Invalid credentials' }
  }

  const { email, password } = validated.data
  const user = await db.user.findUnique({ where: { email } })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { error: 'Invalid credentials' }
  }

  await createSession(user.id)
  redirect('/dashboard')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
```

### Data Access Layer (DAL)

集中所有数据访问 + 鉴权检查：

```ts
// lib/dal.ts
import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { decrypt } from './session'

export const verifySession = cache(async () => {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = session ? await decrypt(session) : null

  if (!payload?.userId) {
    redirect('/login')
  }

  return { userId: payload.userId as string }
})

export const getUser = cache(async () => {
  const { userId } = await verifySession()
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },   // 只 select 必要字段
  })
  return user
})
```

```tsx
// app/dashboard/page.tsx
import { getUser } from '@/lib/dal'

export default async function Dashboard() {
  const user = await getUser()   // 内部已 verifySession，未登录会 redirect
  return <h1>Welcome {user.name}</h1>
}
```

### Middleware/Proxy 做"乐观"检查

Middleware 跑在每个请求前，可以读 cookie 做快速重定向（不查 DB）：

```ts
// proxy.ts
import { NextResponse } from 'next/server'
import { decrypt } from '@/lib/session'

const protectedRoutes = ['/dashboard', '/settings']
const publicRoutes = ['/login', '/signup']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = protectedRoutes.some(r => pathname.startsWith(r))
  const isPublic = publicRoutes.includes(pathname)

  const session = request.cookies.get('session')?.value
  const payload = session ? await decrypt(session) : null

  if (isProtected && !payload?.userId) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (isPublic && payload?.userId) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

> Middleware 鉴权只是优化，**真正的鉴权必须在 DAL / Server Action / Route Handler 里**。Middleware 跑在 prefetch 时也会跑，频繁查 DB 会拖性能。

### 第三方库（推荐）

| 库 | 特点 |
|---|---|
| **Auth.js (NextAuth v5)** | 老牌，社区大；OAuth providers 多；上手快 |
| **Clerk** | 商业产品；UI 组件齐；社交登录 + 多组织 + WebAuthn 开箱 |
| **Better Auth** | 新兴 TS-first；插件式；Server Action 友好 |
| **Lucia** | 极简、可控；session table 自己设计 |
| **Stack Auth** | 开源 Clerk 替代 |
| **WorkOS / Auth0 / Stytch / Supabase Auth** | 商业 SaaS |

## Draft Mode（预览模式）

CMS 编辑时预览未发布内容：

```ts
// app/api/draft/route.ts
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const slug = searchParams.get('slug')

  if (secret !== process.env.DRAFT_SECRET || !slug) {
    return new Response('Invalid token', { status: 401 })
  }

  // 验证 slug 存在
  const post = await getPostDraft(slug)
  if (!post) return new Response('Post not found', { status: 404 })

  // 开启 draft mode
  const draft = await draftMode()
  draft.enable()

  redirect(`/posts/${post.slug}`)
}
```

```tsx
// app/posts/[slug]/page.tsx
import { draftMode } from 'next/headers'

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { isEnabled } = await draftMode()

  const post = isEnabled
    ? await getPostDraft(slug)    // CMS 草稿 API
    : await getPostPublished(slug) // 已发布

  return <article>{post.title}</article>
}
```

退出 draft：

```ts
// app/api/disable-draft/route.ts
import { draftMode } from 'next/headers'

export async function GET() {
  const draft = await draftMode()
  draft.disable()
  return new Response('Draft mode disabled')
}
```

`draftMode().enable()` 设一个 cookie 给客户端，后续请求都识别为 draft。

## `instrumentation.ts` 与 OpenTelemetry

服务启动钩子，用于集成监控 / tracing：

```ts
// instrumentation.ts（项目根，不在 app/）
import { registerOTel } from '@vercel/otel'

export function register() {
  registerOTel('my-next-app')
}
```

`register` 在 Next.js 服务启动时被调一次（dev / build / production 都跑），完成前不接请求。

### 区分 runtime

```ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation-node')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./instrumentation-edge')
  }
}
```

```ts
// instrumentation-node.ts
import { registerOTel } from '@vercel/otel'
import { Resource } from '@opentelemetry/resources'

registerOTel({
  serviceName: 'my-app',
  resource: new Resource({ 'deployment.environment': process.env.NODE_ENV }),
})
```

### `onRequestError` hook

捕获 Next.js 内未捕获的错误（Server Component、Route Handler、Server Action）：

```ts
// instrumentation.ts
export async function onRequestError(
  err: unknown,
  request: { path: string; method: string; headers: { [key: string]: string } },
  context: { routerKind: 'Pages Router' | 'App Router'; routePath: string; routeType: 'render' | 'route' | 'action' }
) {
  // 推到 Sentry / Datadog / 自定义日志
  await fetch('https://errors.example.com', {
    method: 'POST',
    body: JSON.stringify({ err, request, context }),
  })
}
```

### `instrumentation-client.ts`

Next.js 15.x 起客户端也可以有 instrumentation：

```ts
// instrumentation-client.ts（项目根）
// 在客户端启动时跑一次
import { initSentry } from '@sentry/nextjs'
initSentry({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN })
```

## 部署

### Vercel（最顺）

推 GitHub → Vercel dashboard import → 自动部署。

- App Router 全功能（PPR、ISR、Streaming、Edge、Image Optimization）
- 全球 CDN + 自动缓存
- Preview 部署（每个 PR）
- 环境变量管理
- Analytics + Speed Insights

`next.config.ts` 无需特殊配置。

### Node.js Server（自托管）

```bash
pnpm build
NODE_ENV=production pnpm start    # 默认 3000
```

支持所有 Next.js 特性。需要自己解决：

- 反向代理（nginx / Caddy）
- SSL 证书
- CDN 缓存（Cloudflare 等）
- ISR cache 持久化（默认内存，重启丢）
- Image Optimization（自带 `sharp`，需 `pnpm add sharp` 或用 Adapter）

详见 [self-hosting guide](https://nextjs.org/docs/app/guides/self-hosting)。

### Docker（`output: 'standalone'`）

```ts
// next.config.ts
const nextConfig: NextConfig = {
  output: 'standalone',
}
```

```dockerfile
# Dockerfile（多阶段构建）
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

镜像比 `pnpm install + pnpm start` 小一个量级（standalone 只含运行时依赖）。

### Static Export（纯静态）

```ts
// next.config.ts
const nextConfig: NextConfig = {
  output: 'export',
}
```

`pnpm build` 生成 `out/`，传任意静态 CDN（GitHub Pages、S3、Cloudflare Pages）。

**不支持**：

- Server Actions
- Route Handler（除 GET + `dynamic = 'force-static'`）
- `cookies()` / `headers()`
- ISR / Streaming
- Image Optimization（除非配自定义 loader）
- Middleware / Proxy

适合：博客 / 文档 / 营销站。

### Adapter API

平台可写 adapter 自定义 build / deploy 流程：

```ts
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    adapterPath: require.resolve('@cloudflare/next-on-pages/adapter'),
  },
}
```

已验证的 adapter：

- **Vercel** —— 内置
- **Bun** —— `bun create next-app` 默认

平台原生支持但未走 Adapter API：

- Cloudflare（@cloudflare/next-on-pages）
- Netlify
- AWS Amplify
- Deno Deploy
- Firebase App Hosting

## Turbopack

Rust 写的增量打包器，Webpack 的替代。

- **Next.js 15.0**：`next dev --turbopack` 稳定（`build` 仍 Webpack）
- **Next.js 15.5**：`next build --turbopack` beta
- **Next.js 16.0**：**默认** 用 Turbopack（dev + build）；`--webpack` 显式回退

### 优势

- HMR 比 Webpack 快 ~10x（大项目尤其明显）
- 首次启动快得多
- 默认开启 Lightning CSS（CSS 处理也用 Rust）
- 与 RSC 集成更好（单一图）

### 限制

- **`webpack` 配置不识别**：迁到 `turbopack` 配置项
- **Webpack plugins 不支持**：能用 webpack loaders（部分），但 plugins 不行
- **sassOptions.functions 不支持**：纯 JS 函数无法跑在 Rust 内
- **Yarn PnP 不支持**
- **磁盘缓存**：beta（`experimental.turbopackFileSystemCacheForDev`）

### 配置

```ts
// next.config.ts（Next.js 16）
const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      '@components': './src/components',
    },
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
}
```

> Next.js 15 配置在 `experimental.turbopack`；Next.js 16 提升到顶层 `turbopack`。

## Cache Handler（自托管 ISR）

ISR 缓存默认存内存，重启丢。自托管时建议接 Redis：

```ts
// next.config.ts
const nextConfig: NextConfig = {
  cacheHandler: require.resolve('./cache-handler.js'),
  cacheMaxMemorySize: 0,   // 禁用默认内存缓存
}
```

```js
// cache-handler.js（实现 Cache Handler 接口）
const { CacheHandler } = require('@neshca/cache-handler')
const { createClient } = require('redis')

CacheHandler.onCreation(async () => {
  const client = createClient({ url: process.env.REDIS_URL })
  await client.connect()
  return {
    handlers: [createRedisHandler({ client })],
  }
})

module.exports = CacheHandler
```

社区方案：`@neshca/cache-handler`（最完整）。

## 性能监控

### Web Vitals

```tsx
// app/web-vitals.tsx
'use client'
import { useReportWebVitals } from 'next/web-vitals'

export function WebVitals() {
  useReportWebVitals(metric => {
    fetch('/api/vitals', {
      method: 'POST',
      body: JSON.stringify(metric),
      keepalive: true,
    })
  })
  return null
}
```

```tsx
// app/layout.tsx
import { WebVitals } from './web-vitals'

<html>
  <body>
    <WebVitals />
    {children}
  </body>
</html>
```

### Vercel Speed Insights

```bash
pnpm add @vercel/speed-insights
```

```tsx
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next'

<html>
  <body>
    {children}
    <SpeedInsights />
  </body>
</html>
```

自动收集 LCP / FCP / CLS / TTFB / INP，Vercel dashboard 看。

## Bundle 分析

```bash
pnpm add -D @next/bundle-analyzer
```

```ts
// next.config.ts
import withBundleAnalyzer from '@next/bundle-analyzer'

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default bundleAnalyzer({
  // ...其它 Next.js 配置
})
```

```bash
ANALYZE=true pnpm build
```

build 后自动打开浏览器看 bundle 树状图。

## 环境变量

```bash
# .env.local（gitignore）
DATABASE_URL=postgresql://...
API_KEY=secret123

# .env.production
NEXT_PUBLIC_API_URL=https://api.example.com
```

加载优先级（高 → 低）：

1. `process.env`
2. `.env.$(NODE_ENV).local`
3. `.env.local`（test 时不加载）
4. `.env.$(NODE_ENV)`
5. `.env`

**只有 `NEXT_PUBLIC_*` 前缀的变量进客户端 bundle**，其他只在服务端可用。

```tsx
// Server Component
const apiKey = process.env.API_KEY    // ✅

// Client Component
'use client'
const url = process.env.NEXT_PUBLIC_API_URL    // ✅
const apiKey = process.env.API_KEY              // ❌ undefined（被替换成空字符串）
```

运行时读：用 `await connection()`（防 build 时 inline）：

```tsx
import { connection } from 'next/server'

export default async function Page() {
  await connection()
  const runtime = process.env.RUNTIME_VAR     // build 不 inline，请求时读
  return <p>{runtime}</p>
}
```

## ESLint / Prettier

Next.js 16 起 `next build` 不再自动跑 lint。手动配：

```bash
pnpm add -D eslint @next/eslint-plugin-next eslint-config-next
```

```js
// eslint.config.mjs（Flat Config，Next.js 16 默认）
import nextPlugin from '@next/eslint-plugin-next'

export default [
  {
    plugins: { '@next/next': nextPlugin },
    rules: { ...nextPlugin.configs.recommended.rules },
  },
]
```

`package.json`：

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

或用 Biome（更快）：

```bash
pnpm add -D --save-exact @biomejs/biome
pnpm biome init
```

```json
{
  "scripts": {
    "lint": "biome check",
    "format": "biome format --write"
  }
}
```

## 总结

进阶到高级要掌握的：

- **Middleware / Proxy** 控制请求 + 鉴权 / redirect / 改 headers
- **Edge vs Node Runtime** 选择标准（启动速度 vs 完整 API）
- **`next/image` + `next/font`** 零运行时优化
- **i18n** 用 Middleware + `[lang]` 段
- **Auth** 用 Server Action + Session + DAL 三件套
- **Instrumentation** 接 OTel / Sentry
- **部署** Vercel / Docker / 平台 Adapter 选型
- **Turbopack** 默认（Next.js 16），熟悉迁移与限制

下一步 [指南 - 其他](./other.md)：与 Remix / Nuxt / SvelteKit / Astro 对比、Pages Router 迁移、常见坑。
