---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Next.js 15.x（App Router）+ React 19 编写，少量提及 Next.js 16 的变化

## 速查

- 系统要求：Node.js **18.18+**（Next.js 15）/ **20.9+**（Next.js 16）；TypeScript 5.1+
- 创建：`pnpm create next-app@latest`（推荐 App Router + TS + ESLint + Tailwind）
- 启动：`pnpm dev`（默认 `http://localhost:3000`，HMR + RSC + Fast Refresh）
- 入口：`app/layout.tsx` + `app/page.tsx`（根布局 + 首页）
- 路由：文件路由 —— `app/dashboard/page.tsx` → `/dashboard`、`app/blog/[slug]/page.tsx` → `/blog/:slug`
- Server Component（默认）：可 `async`/`await`，可直连数据库；不能 `useState` / `useEffect` / 浏览器 API
- Client Component：文件顶部 `'use client'`，可用 hooks、事件、浏览器 API
- 数据：在 Server Component 里直接 `await fetch(...)` 或 ORM；客户端用 `use()` / SWR / TanStack Query
- Server Actions：`'use server'`，作为 `<form action={...}>` 提交或事件处理调用
- 部署：Vercel / Node.js / Docker（`output: 'standalone'`）/ Static Export / 平台 Adapter

## 安装与首次启动

最快路径：

```bash
# 官方脚手架（推荐）
pnpm create next-app@latest my-app

# 交互式提问，典型选择：
# √ Would you like to use TypeScript? … Yes
# √ Would you like to use ESLint? … Yes
# √ Would you like to use Tailwind CSS? … Yes
# √ Would you like your code inside a `src/` directory? … No
# √ Would you like to use App Router? (recommended) … Yes
# √ Would you like to customize the import alias (`@/*`)? … No

cd my-app
pnpm install
pnpm dev
```

打开 `http://localhost:3000` 即看默认页。**HMR + Fast Refresh 默认开启**。Next.js 15 用 `--turbopack` 启用 Turbopack；Next.js 16 默认就用 Turbopack。

### Node 版本

- **Next.js 15** 最低 Node 18.18.0
- **Next.js 16** 最低 Node 20.9.0（LTS），不再支持 Node 18

CI 镜像和同事机器都升到 Node 20 LTS：

```bash
nvm install --lts && nvm use --lts
```

### 手动安装

如果不用 `create-next-app`，手动方式：

```bash
pnpm i next@latest react@latest react-dom@latest
```

`package.json` 加 scripts：

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  }
}
```

> Next.js 16 起 `next build` 不再自动跑 lint，需手动调 ESLint / Biome；Next.js 15 仍会自动 lint。

然后建 `app/layout.tsx` 与 `app/page.tsx`，跑 `pnpm dev` 即可。

## 项目结构

`create-next-app` 默认生成的目录：

```
my-app/
├── app/                         # App Router 根目录（核心）
│   ├── layout.tsx               # 根布局，必备，包 <html> + <body>
│   ├── page.tsx                 # / 路由的页面
│   ├── globals.css              # 全局样式
│   └── favicon.ico
├── public/                      # 直接拷贝的静态资源（图片 / robots.txt）
├── next.config.ts               # 主配置
├── tsconfig.json                # TypeScript 配置
├── package.json
├── .gitignore
├── .env / .env.local            # 环境变量
└── eslint.config.mjs            # ESLint 配置（Next.js 16 默认 Flat Config）
```

可选项：

- `src/` 子目录：把 `app/` 放进 `src/app/`，分离应用代码与配置文件
- `instrumentation.ts`：服务启动钩子（OpenTelemetry 等监控集成）
- `proxy.ts`（Next.js 16）/ `middleware.ts`（Next.js 15）：请求级代理 / 中间件
- `app/api/`：放 Route Handler（用 `route.ts` 文件）

### `app/` 目录的特殊文件

App Router 用约定文件名定义路由能力：

| 文件 | 作用 |
|---|---|
| `layout.tsx` | 共享布局，包子路由，**导航时不重新渲染** |
| `page.tsx` | 路由公开页面，**叶子** |
| `loading.tsx` | Suspense fallback，整段路由的 loading UI |
| `error.tsx` | Error boundary，必须 `'use client'` |
| `not-found.tsx` | 404 UI（`notFound()` 触发） |
| `route.ts` | Route Handler，API 端点 |
| `template.tsx` | 类似 layout 但**每次导航都重新渲染** |
| `default.tsx` | parallel route 的 fallback |
| `global-error.tsx` | 根级 error boundary |

## 第一个页面

`app/page.tsx` 对应路由 `/`。**默认是 Server Component**（在服务端渲染，不进客户端 bundle）：

```tsx
// app/page.tsx
export default function Home() {
  return (
    <main>
      <h1>Hello Next.js</h1>
      <p>This is a Server Component by default.</p>
    </main>
  )
}
```

加一个 `/about` 路由：

```tsx
// app/about/page.tsx
export default function About() {
  return <h1>About Page</h1>
}
```

加 Link 导航：

```tsx
// app/page.tsx
import Link from 'next/link'

export default function Home() {
  return (
    <main>
      <h1>Hello Next.js</h1>
      <Link href="/about">About</Link>
    </main>
  )
}
```

`<Link>` 是 Next.js 的客户端导航组件，**自动 prefetch** 进入视口的链接、走 SPA 切换不刷页面。

## 根布局 `layout.tsx`

`app/layout.tsx` 是**根布局**，必备，必须包 `<html>` 与 `<body>`：

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'My App',
  description: 'Built with Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <header>
          <nav>...</nav>
        </header>
        <main>{children}</main>
        <footer>...</footer>
      </body>
    </html>
  )
}
```

`children` 自动注入子路由的 `page.tsx` 或嵌套 `layout.tsx`。

### 嵌套布局

任意子目录都可以放 `layout.tsx`，会包住该目录及其子路由：

```
app/
├── layout.tsx                   # 根布局
├── page.tsx                     # /
└── dashboard/
    ├── layout.tsx               # 包 /dashboard 及子路由
    ├── page.tsx                 # /dashboard
    └── settings/
        └── page.tsx             # /dashboard/settings
```

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <section>
      <aside>Sidebar</aside>
      <div>{children}</div>
    </section>
  )
}
```

> 子布局**不要写** `<html>` / `<body>`，只有根布局写。

### Layout 不会重新渲染

切换 `/dashboard/a` → `/dashboard/b`，`DashboardLayout` 保持挂载（状态、scroll 位置都保留），只 `page.tsx` 切换。这是 Layout 与 Template 的本质区别 —— Template 每次都重新挂载。

## Server Component vs Client Component

App Router 默认**所有组件都是 Server Component**。它们在服务端运行，产物是 RSC Payload（不发 JS 到客户端）。

**Server Component 可以**：

- 直接 `async/await`，从数据库 / API 拉数据
- 用 `process.env.API_KEY` 等服务端密钥（不会泄露给客户端）
- 用 `cookies()` / `headers()` 读请求信息
- 用 `import 'server-only'` 的库（如 ORM、Node.js 内置模块）

**Server Component 不能**：

- 用 `useState` / `useEffect` / `useReducer` 等需要客户端的 hooks
- 用 `onClick` / `onChange` 等事件处理
- 用 `window` / `document` / `localStorage`
- 用 React Context 的 `useContext`

要交互就**加 Client Component**。在文件顶部加 `'use client'` 指令：

```tsx
// app/components/Counter.tsx
'use client'

import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)

  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  )
}
```

```tsx
// app/page.tsx（Server Component，自然 import Client Component）
import Counter from './components/Counter'

export default function Home() {
  return (
    <main>
      <h1>Home</h1>
      <Counter />   {/* Client Component 嵌入 Server Component 没问题 */}
    </main>
  )
}
```

### `'use client'` 的传染性

加了 `'use client'` 的文件 + 它**直接 import** 的所有组件 / 模块都进客户端 bundle。

要减小 bundle，**尽量把交互压到叶子组件**：

```tsx
// ❌ 整个 Layout 标 'use client'，子组件全进 bundle
'use client'
import { useState } from 'react'
export default function Layout({ children }) {
  const [open, setOpen] = useState(false)
  return <>...</>
}

// ✅ 只把交互按钮独立成 Client Component
// app/components/MenuToggle.tsx
'use client'
import { useState } from 'react'
export default function MenuToggle() { ... }

// app/layout.tsx（Server Component）
import MenuToggle from './components/MenuToggle'
export default function Layout({ children }) {
  return (
    <div>
      <MenuToggle />
      {children}
    </div>
  )
}
```

### 跨边界传 props

Server → Client 传 props **必须可序列化**（不能传函数、Date、Symbol、Promise 例外）。

特例：传 Promise（不 `await`）配合 `use()`：

```tsx
// app/page.tsx（Server Component）
import { Suspense } from 'react'
import Posts from './posts'

export default function Page() {
  // 不 await，直接传 Promise
  const postsPromise = fetchPosts()

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

export default function Posts({ posts }: { posts: Promise<Post[]> }) {
  const data = use(posts)   // 解开 Promise，触发 Suspense
  return <ul>{data.map(p => <li key={p.id}>{p.title}</li>)}</ul>
}
```

## 动态路由

文件夹名加方括号即动态段：

```
app/
├── blog/
│   ├── page.tsx                 # /blog
│   └── [slug]/
│       └── page.tsx             # /blog/:slug
└── shop/
    └── [...slug]/
        └── page.tsx             # /shop/* catch-all（/shop/a/b/c）
```

`params` 在 **Next.js 15+ 是 Promise**，必须 `await`（或在 Client Component 用 `use()`）：

```tsx
// app/blog/[slug]/page.tsx
export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await fetchPost(slug)

  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  )
}
```

可选 catch-all：`[[...slug]]` 匹配 `/shop` 与 `/shop/a/b`。

## 第一个 fetch

Server Component 里直接 `async/await`：

```tsx
// app/blog/page.tsx
export default async function Blog() {
  // 注意：Next.js 15+ fetch 默认不缓存，每次请求都跑
  const res = await fetch('https://api.example.com/posts')
  const posts = await res.json()

  return (
    <ul>
      {posts.map((post: any) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

要缓存：

```ts
// 永久缓存（直到下次 build 或 revalidate）
await fetch(url, { cache: 'force-cache' })

// ISR：缓存 60 秒
await fetch(url, { next: { revalidate: 60 } })

// 打 tag，方便 on-demand 失效
await fetch(url, { next: { tags: ['posts'] } })
```

按需失效：

```ts
import { revalidateTag, revalidatePath } from 'next/cache'

// Server Action 里
revalidateTag('posts')         // 所有 tag='posts' 的 fetch 缓存失效
revalidatePath('/blog')        // 整段路由缓存失效
```

> Next.js 15 之前（14 及之前）`fetch` 默认 `force-cache`，升级到 15 时大量请求行为变化，是最重要的破坏性变更之一。

### 直连数据库

Server Component 可以用 ORM / 数据库客户端：

```tsx
// app/users/page.tsx
import { db, users } from '@/lib/db'

export default async function Users() {
  const allUsers = await db.select().from(users)
  return (
    <ul>
      {allUsers.map(u => <li key={u.id}>{u.name}</li>)}
    </ul>
  )
}
```

凭据 / SQL 都不会进客户端 bundle。

## 第一个 API 端点（Route Handler）

`app/api/hello/route.ts` 暴露为 `/api/hello`：

```ts
// app/api/hello/route.ts
export async function GET() {
  return Response.json({ message: 'Hello' })
}

export async function POST(request: Request) {
  const body = await request.json()
  return Response.json({ received: body })
}
```

支持的方法：`GET` / `POST` / `PUT` / `PATCH` / `DELETE` / `HEAD` / `OPTIONS`。

带动态段：

```ts
// app/api/users/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await db.user.findUnique({ where: { id } })
  return Response.json(user)
}
```

> Next.js 15 起 GET 方法默认**不缓存**。要静态化需 `export const dynamic = 'force-static'`。

## 第一个 Server Action

Server Action 是**异步函数**，标 `'use server'`，可以从客户端表单 / 事件调用，跑在服务端。

```tsx
// app/actions.ts
'use server'

import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string

  await db.post.create({ data: { title, content } })

  revalidatePath('/posts')
}
```

```tsx
// app/posts/new/page.tsx
import { createPost } from '@/app/actions'

export default function NewPostPage() {
  return (
    <form action={createPost}>
      <input name="title" required />
      <textarea name="content" required />
      <button type="submit">Create</button>
    </form>
  )
}
```

表单提交 → 浏览器 POST 到当前路由 → 服务端跑 `createPost` → 数据库写入 → `revalidatePath` 触发 `/posts` 重新渲染。**无需写 API Route**，无需 fetch，无需 JSON 序列化。

显示加载状态用 `useActionState` hook（React 19）：

```tsx
'use client'

import { useActionState } from 'react'
import { createPost } from '@/app/actions'

export default function NewPostForm() {
  const [state, formAction, pending] = useActionState(createPost, null)

  return (
    <form action={formAction}>
      <input name="title" required />
      <button disabled={pending}>
        {pending ? 'Creating...' : 'Create'}
      </button>
    </form>
  )
}
```

## CSS / Tailwind

- **全局 CSS**：在 `app/layout.tsx` import `globals.css`
- **CSS Modules**：`Component.module.css` → `import styles from './Component.module.css'` → `className={styles.foo}`
- **Tailwind CSS**：`create-next-app` 默认配好；Tailwind 4 与 Next.js 完全兼容
- **CSS-in-JS**：styled-components / Emotion 在 RSC 下有限制，需 wrapper Client Component
- **Sass / SCSS**：开箱即用，无需配置

```tsx
// app/page.tsx
import styles from './page.module.css'

export default function Page() {
  return <div className={styles.container}>Hello</div>
}
```

## next/image 自动优化

```tsx
import Image from 'next/image'

// 本地图片：静态 import 自动推断 width / height / blurDataURL
import profile from '@/public/profile.png'

export default function Page() {
  return (
    <>
      <Image src={profile} alt="Profile" />

      {/* 远程图片：必须配 next.config.ts 的 images.remotePatterns */}
      <Image
        src="https://cdn.example.com/banner.jpg"
        alt="Banner"
        width={1200}
        height={400}
        priority   // LCP 图片用 priority 跳过懒加载
      />
    </>
  )
}
```

`next.config.ts` 配远程域名白名单：

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
```

## next/font 字体优化

```tsx
// app/layout.tsx
import { Geist } from 'next/font/google'

const geist = Geist({
  subsets: ['latin'],
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.className}>
      <body>{children}</body>
    </html>
  )
}
```

构建期下载字体并自托管 —— 用户不会向 Google 发请求，**零运行时**。变量字体（如 `Geist`、`Inter`）最佳；非变量字体需指定 `weight`。

## 路径别名 `@/`

`tsconfig.json` 配 `paths`：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

之后 `import X from '@/components/X'` 代替 `'../../../components/X'`。`create-next-app` 默认配好。

## 部署

最快：推 GitHub → 连 Vercel → 自动部署。详见 [指南 - 高级](./guide-line/expert.md) 的部署章节。

其它选项：

```bash
# Node.js server（任意 Node 主机）
pnpm build
pnpm start

# Docker（要 next.config.ts 配 output: 'standalone'）
docker build -t my-app .
docker run -p 3000:3000 my-app

# 静态导出（无 SSR，等于 SPA + 多 HTML 文件）
# next.config.ts: output: 'export'
pnpm build
# 生成 out/ 目录，传任意静态 CDN
```

## 一份能跑的最小示例

```
my-app/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── about/
│   │   └── page.tsx
│   ├── blog/
│   │   └── [slug]/
│   │       └── page.tsx
│   ├── api/
│   │   └── posts/
│   │       └── route.ts
│   └── actions.ts
├── public/
├── next.config.ts
└── package.json
```

```tsx
// app/layout.tsx
import './globals.css'

export const metadata = { title: 'My App' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

```tsx
// app/page.tsx
import Link from 'next/link'

export default async function Home() {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5', {
    next: { revalidate: 60 },
  })
  const posts = await res.json()

  return (
    <main>
      <h1>Latest Posts</h1>
      <ul>
        {posts.map((p: any) => (
          <li key={p.id}>
            <Link href={`/blog/${p.id}`}>{p.title}</Link>
          </li>
        ))}
      </ul>
      <Link href="/about">About</Link>
    </main>
  )
}
```

```tsx
// app/blog/[slug]/page.tsx
export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${slug}`)
  const post = await res.json()

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
    </article>
  )
}
```

```ts
// app/api/posts/route.ts
export async function GET() {
  const data = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=10')
  const posts = await data.json()
  return Response.json(posts)
}
```

`pnpm dev` 打开 `http://localhost:3000` 即看完整 App。

## 下一步

- App Router 文件约定 / RSC 边界 / Server Actions / Route Handler 完整讲解见 [指南 - 基础](./guide-line/base.md)
- 渲染模式 / 缓存策略 / Streaming / Suspense / Cache Components 见 [指南 - 进阶](./guide-line/advanced.md)
- Middleware/Proxy / Edge Runtime / Image / Font / i18n / Auth / 部署优化见 [指南 - 高级](./guide-line/expert.md)
- 与 Remix / Nuxt / SvelteKit / Astro 对比、Pages Router 迁移、Next.js 16 升级 见 [指南 - 其他](./guide-line/other.md)
- 全部 API / 文件约定 / 配置 / Hook 速查见 [参考](./reference.md)
