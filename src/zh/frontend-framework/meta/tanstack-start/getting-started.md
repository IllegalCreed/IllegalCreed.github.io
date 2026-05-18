---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 TanStack Start v1.x **Release Candidate**（`@tanstack/react-start` + `@tanstack/react-router`）编写。RC 阶段 API 已稳定但仍建议锁定具体版本号。

## 速查

- 系统要求：**Node.js 20+** + React 19（或 18） + TypeScript 5+
- 创建项目（推荐）：`npx @tanstack/cli@latest create`
- 启动 dev server：`npm run dev`（端口 3000，Vite）
- 生产构建：`npm run build`
- 核心包：`@tanstack/react-start`（Start 运行时 + RPC）+ `@tanstack/react-router`（路由核心）
- Vite 插件：`tanstackStart()` 来自 `@tanstack/react-start/plugin/vite`
- 路由目录：`src/routes/`，根路由 `src/routes/__root.tsx`
- 自动生成：`src/routeTree.gen.ts` 由 Vite 插件在 dev / build 启动时生成
- 入口：`src/router.tsx`（构造 `Router` 实例）
- 三种模式：**SSR**（默认）/ **SSG**（`prerender.enabled`）/ **SPA**（`spa.enabled`）
- 类型安全核心：`createFileRoute('/path/$param')` 中的字符串由插件自动管理
- Server Functions：`createServerFn({ method: 'POST' }).inputValidator(z).handler(fn)`
- API 路由：`src/routes/api/*.ts` 中导出 `Route` + `server.handlers.GET/POST/...`

## TanStack Start 是什么

TanStack Start 是 [TanStack Router](https://tanstack.com/router/) 在 Vite 之上的「全栈元框架」发行版——把路由 / SSR / RPC / 中间件 / API 路由 / SSG / SPA 全捏在一个开发体验里：

- **核心定位**：「类型安全到极致的 Next.js / Remix 替代品」
- **底层栈**：Vite（构建 / HMR） + TanStack Router（类型化路由 / 加载 / 上下文）+ `createServerFn`（RPC）+ `createMiddleware`（请求中间件）+ 各平台 Vite 插件（Cloudflare / Netlify / Nitro）
- **当前状态**：v1 **Release Candidate**——API 完整、可生产，但建议锁版本依赖；从 RC 到 v1 应该不会很久

它与同类元框架的关键差异：

| 维度 | TanStack Start | Next.js App Router | React Router v7 | SolidStart | SvelteKit |
|---|---|---|---|---|---|
| 渲染模式 | SSR / SSG / SPA / Selective | SSR + RSC | SSR / SSG / SPA | SSR / SSG / SPA | SSR / SSG / SPA |
| 路由方式 | 文件路由 + 代码路由 | 文件路由 | `routes.ts` 配置或文件路由 | 文件路由 | 文件路由 |
| 数据加载 | `loader` + `beforeLoad` | `fetch()` (RSC) | `loader` + `clientLoader` | `query()` + `createAsync()` | `+page.server.ts` |
| 数据 mutation | `createServerFn` | Server Actions | `action` + `Form` | `action()` | `actions` |
| 路由类型化 | **完整泛型**（params / search / loader 全推导）| 半自动 | 完整泛型 | 完整泛型 | 半自动 |
| Search params 类型化 | `validateSearch` + Zod | 手动 | 手动 | 手动 | 手动 |
| Server functions | `createServerFn` + 输入校验 + 中间件 | Server Actions | `action` (无中间件) | `"use server"` | `+server.ts` |
| RSC | experimental | 默认 | unstable | 否 | 否 |
| 构建工具 | Vite | Turbopack/Webpack | Vite | Vite | Vite |
| 部署 | 任意平台 + Nitro | Vercel 优化 | 任意平台 | 任意平台 | 任意平台 |
| 心智模型 | nested loaders + RPC + 类型 | RSC + 客户端组件 | nested loaders + 表单 | `"use server"` + Solid | `+files` 约定 |

**含义**：

- TanStack Start 不押注 RSC（把它当 experimental），坚持「**全组件都是客户端组件 + server functions 通过 RPC 暴露**」的 Remix 模型，但比 Remix / React Router 多了路由类型推导和 search params 验证
- 与 Next.js 哲学对立：Next.js 信「服务端默认 + 客户端 opt-in」，TanStack Start 信「同构默认 + 显式拆分（`.server.ts` / `createServerFn`）」
- 不适合：极端 SEO 内容站（用 Astro）、需要 RSC 的项目（用 Next.js）、不写 TypeScript（你会浪费 80% 的卖点）
- 适合：在意 search params 状态管理的应用（Dashboard / Saas / 电商）、想要 Next.js 全栈但讨厌 Vercel 锁定、需要 Vite 插件生态、TanStack Query 重度用户

## 创建项目

### 方式 1：CLI（推荐）

```bash
npx @tanstack/cli@latest create
```

交互式选择：

- 包管理器：`pnpm` / `npm` / `yarn` / `bun`
- 可选特性：Tailwind CSS / ESLint / shadcn 组件 / 等
- 模板：`Basic` / `+ React Query` / `Clerk Auth` / `Supabase Auth` / `WorkOS` / `Material UI` 等

### 方式 2：克隆官方示例

```bash
# 基础模板
npx gitpick TanStack/router/tree/main/examples/react/start-basic start-basic
cd start-basic
pnpm install
pnpm dev

# 含 React Query
npx gitpick TanStack/router/tree/main/examples/react/start-basic-react-query start-rq
```

### 方式 3：从零手搭

如果你想完全控制 setup，参考下文「项目结构」与「从零手搭」章节。

## 项目结构

CLI 创建的默认结构：

```
my-app/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── router.tsx              # 构造 Router 实例
│   ├── routeTree.gen.ts        # ⚙️ 自动生成，勿手动编辑
│   ├── styles.css
│   └── routes/
│       ├── __root.tsx          # 根路由（HTML 壳 + 全局布局）
│       ├── index.tsx           # / 路由
│       ├── about.tsx           # /about
│       └── posts/
│           ├── index.tsx       # /posts
│           └── $postId.tsx     # /posts/:postId
└── public/
```

**关键文件**：

- `vite.config.ts`：注册 `tanstackStart()` + `viteReact()` 插件
- `src/router.tsx`：导出 `getRouter()` 工厂——Start 会自动调用
- `src/routes/__root.tsx`：唯一的根路由——必须返回完整 HTML（含 `<head>` / `<body>` / `<Scripts />`）
- `src/routeTree.gen.ts`：Vite 插件 dev / build 时自动生成的路由树类型——**多数项目加入 `.gitignore`**，启动时由插件重新写出
- `src/routes/`：所有文件路由

## 从零手搭

完整复刻 CLI 生成的最小骨架（适合理解每个文件的作用）。

### `package.json`

```json
{
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "start": "node .output/server/index.mjs"
  },
  "dependencies": {
    "@tanstack/react-router": "latest",
    "@tanstack/react-start": "latest",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "vite": "^7.0.0"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "target": "ES2022",
    "skipLibCheck": true,
    "strictNullChecks": true,
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "noEmit": true,
    "isolatedModules": true,
    "allowSyntheticDefaultImports": true,
    "types": ["vite/client"]
  },
  "include": ["src", "vite.config.ts"]
}
```

### `vite.config.ts`

```ts
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    // 等价于自动加上 vite-tsconfig-paths
    tsconfigPaths: true,
  },
  plugins: [
    tanstackStart(), // 必须在 viteReact 之前
    viteReact(),
  ],
})
```

> **顺序很重要**：`tanstackStart()` 必须放在 `viteReact()` 之前，因为它会注入 client / server entry 与转换 routes 目录。

### `src/router.tsx`

```tsx
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

/**
 * 构造路由器实例 —— TanStack Start 在 SSR / 客户端 hydration 时
 * 都会调用这个工厂获取 router 实例
 */
export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent', // 鼠标悬浮即预加载
    defaultPreloadStaleTime: 0, // 配合外部缓存（如 TanStack Query）
  })

  return router
}

/**
 * 注册 router 类型 —— 让 useNavigate / Link 等 hook 获得全局类型推断
 */
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
```

### `src/routes/__root.tsx`

根路由必须返回完整 HTML 文档（这是 TanStack Start 与 Next.js 的关键差异——你自己写 `<html>` 壳）：

```tsx
/// <reference types="vite/client" />
import type { ReactNode } from 'react'
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'TanStack Start Starter' },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <head>
        {/* 渲染所有 meta / title / link / 子路由的 head() 内容 */}
        <HeadContent />
      </head>
      <body>
        {children}
        {/* 注入 client bundle / hydration */}
        <Scripts />
      </body>
    </html>
  )
}
```

> **核心 API**：`HeadContent` 渲染 `<head>` 内的 meta / title / link / 脚本；`Scripts` 注入客户端 JS——两者**缺一不可**，没有 `Scripts` 就没有 hydration，纯 HTML 文档。

### `src/routes/index.tsx`

第一个文件路由——展示 loader + server function 的组合：

```tsx
import * as fs from 'node:fs'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

const filePath = 'count.txt'

/** 服务端读取计数（普通函数，仅在 server fn 内被调用，不会被打包到客户端） */
async function readCount() {
  return Number.parseInt(
    await fs.promises.readFile(filePath, 'utf-8').catch(() => '0'),
  )
}

/** GET server function —— 客户端可调用，实际在服务端执行 */
const getCount = createServerFn({
  method: 'GET',
}).handler(() => readCount())

/** POST server function —— 接受一个 number 输入，并增加到文件 */
const updateCount = createServerFn({ method: 'POST' })
  .inputValidator((d: number) => d)
  .handler(async ({ data }) => {
    const count = await readCount()
    await fs.promises.writeFile(filePath, `${count + data}`)
  })

/** 文件路由 —— `'/'` 由 Vite 插件自动写入，开发者不用手填 */
export const Route = createFileRoute('/')({
  component: Home,
  // loader 同构：首次 SSR 在 server 跑，导航时在 client 跑
  loader: async () => await getCount(),
})

function Home() {
  const router = useRouter()
  const state = Route.useLoaderData()

  return (
    <button
      type="button"
      onClick={() => {
        updateCount({ data: 1 }).then(() => {
          router.invalidate() // 重新执行 loader → 拿最新计数
        })
      }}
    >
      Add 1 to {state}?
    </button>
  )
}
```

启动 `pnpm dev` 后：

1. Vite 插件扫描 `src/routes/`，生成 `src/routeTree.gen.ts`（首次启动会写入这个文件）
2. 浏览器访问 `http://localhost:3000` → 服务端跑 `loader` → SSR 输出 HTML（含初始 count）
3. hydration 后点击按钮 → 客户端用 `fetch` 调 `updateCount` → 服务端写文件 → `router.invalidate()` 重跑 loader → 页面计数 +1

## `routeTree.gen.ts` 自动生成

这是理解 TanStack Start 类型安全的核心机制：

1. 你在 `src/routes/` 下创建 `posts/$postId.tsx`
2. Vite 插件检测到新文件，**自动写入** `src/routes/posts/$postId.tsx` 顶部的 `createFileRoute('/posts/$postId')`（如果你之前是 `createFileRoute('/旧路径')`）
3. **同时更新** `src/routeTree.gen.ts`——把这个新路由注册到全局类型树
4. 全应用任何地方写 <span v-pre>`<Link to="/posts/$postId" params={{ postId: '1' }}>`</span> 都会立刻获得自动补全 + 类型校验

实际效果：

```tsx
// ✅ TS 知道 /posts/$postId 路由存在
<Link to="/posts/$postId" params={{ postId: '1' }}>Post 1</Link>

// ❌ TS 报错：'/posts/wrong' 不存在
<Link to="/posts/wrong">x</Link>

// ❌ TS 报错：缺少 params.postId
<Link to="/posts/$postId">x</Link>
```

> **是否提交 `routeTree.gen.ts`**：大多数项目把它加入 `.gitignore`，dev / build 启动时由 Vite 插件重新生成。如果你想 commit（避免 first-build 类型缺失），插件支持配置。

## 第一个嵌套路由

新建 `src/routes/posts.tsx`（父布局）+ `src/routes/posts/index.tsx`（列表）+ `src/routes/posts/$postId.tsx`（详情）：

```tsx
// src/routes/posts.tsx —— 共享布局
import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts')({
  component: PostsLayout,
})

function PostsLayout() {
  return (
    <div>
      <h1>所有文章</h1>
      <nav>
        <Link to="/posts">列表</Link> | <Link to="/posts/$postId" params={{ postId: '1' }}>第一篇</Link>
      </nav>
      <main>
        {/* 子路由占位符 */}
        <Outlet />
      </main>
    </div>
  )
}
```

```tsx
// src/routes/posts/index.tsx —— /posts 路径展示
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/')({
  component: () => <p>请选择左侧文章</p>,
})
```

```tsx
// src/routes/posts/$postId.tsx —— /posts/:postId 详情
import { createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

interface Post {
  id: string
  title: string
  body: string
}

const fetchPost = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<Post> => {
    const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${data.id}`)
    if (res.status === 404)
      throw notFound()
    return res.json()
  })

export const Route = createFileRoute('/posts/$postId')({
  component: PostDetail,
  loader: ({ params }) => fetchPost({ data: { id: params.postId } }),
})

function PostDetail() {
  const post = Route.useLoaderData()
  const params = Route.useParams() // { postId: string }

  return (
    <article>
      <h2>{post.title}（ID: {params.postId}）</h2>
      <p>{post.body}</p>
    </article>
  )
}
```

> **重要**：所有 `createFileRoute('/...')` 中的字符串都由 Vite 插件自动写入与维护——你**只需要**保证文件名正确（`posts/$postId.tsx`），插件会在保存时更新对应的路径字符串。

## 第一个 `createServerFn`

Server Functions 是 TanStack Start 的核心 RPC 机制——客户端调用时是 `fetch`，但 TypeScript 看到的是普通函数：

```tsx
// src/utils/users.functions.ts
import { z } from 'zod'
import { createServerFn } from '@tanstack/react-start'

/** 输入校验 schema —— 同时用于 TS 类型推导 + 运行时校验 */
const CreateUserInput = z.object({
  name: z.string().min(1).max(50),
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
})

/** Server function —— 默认 method 是 'GET'，传 'POST' 才能写 */
export const createUser = createServerFn({ method: 'POST' })
  .inputValidator(CreateUserInput)
  .handler(async ({ data }) => {
    // 在这里访问 db / secrets / fs / 等服务端资源
    const user = { id: crypto.randomUUID(), ...data }
    // 持久化逻辑...
    return user
  })
```

客户端调用：

```tsx
// src/routes/signup.tsx
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { createUser } from '../utils/users.functions'

export const Route = createFileRoute('/signup')({
  component: SignupPage,
})

function SignupPage() {
  // useServerFn 包装后才能感知 router state（建议方式）
  const submit = useServerFn(createUser)
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    // ✅ TS 知道 data 必须是 { name, email, age } —— 不传 age 会编译报错
    const user = await submit({ data: { name, email, age: 25 } })
    console.log('created:', user)
    router.navigate({ to: '/' })
  }

  return (
    <form onSubmit={onSubmit}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="姓名" />
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="邮箱" />
      <button>注册</button>
    </form>
  )
}
```

**幕后发生了什么**：

1. 客户端 bundle 中，`createUser` 被替换为 `fetch('/_serverFn/...')` 的 RPC stub（实现代码不打包进客户端）
2. 用户点击按钮 → 客户端发送 POST 请求 → 服务端找到对应 handler
3. 输入经 Zod 校验（不通过则 400）
4. handler 在服务端执行，返回值序列化（JSON）回客户端
5. TypeScript 编译期保证客户端传入的类型与 handler 期望一致——**真·端到端类型安全**

## 与 TanStack Query 配合

`@tanstack/react-query` 是 TanStack 自家的服务端状态库。在 TanStack Start 中典型用法：

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

```tsx
// src/router.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30 秒
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

让根路由认识 `QueryClient` 上下文：

```tsx
// src/routes/__root.tsx
import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, ... } from '@tanstack/react-router'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  // ...同前
})
```

在 loader 里预取 + 共用客户端缓存：

```tsx
// src/routes/posts.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'

const fetchPosts = createServerFn({ method: 'GET' }).handler(async () => {
  const r = await fetch('https://jsonplaceholder.typicode.com/posts')
  return r.json() as Promise<Array<{ id: number, title: string }>>
})

const postsQueryOptions = queryOptions({
  queryKey: ['posts'],
  queryFn: () => fetchPosts(),
})

export const Route = createFileRoute('/posts')({
  // loader 内 ensureQueryData → SSR 时填充 client，hydration 后 Query 直接命中
  loader: ({ context }) => context.queryClient.ensureQueryData(postsQueryOptions),
  component: PostsPage,
})

function PostsPage() {
  const { data } = useSuspenseQuery(postsQueryOptions)
  return (
    <ul>
      {data.map(p => <li key={p.id}>{p.title}</li>)}
    </ul>
  )
}
```

**好处**：

- SSR 时 loader 预取 → HTML 包含初始数据，无白屏
- hydration 后 Query 接管缓存 → 跨路由共享、自动重新订阅、乐观更新
- `useSuspenseQuery` 让 React Suspense 自动处理 loading 状态
- `defaultPreloadStaleTime: 0` 让 Router preload 总是检查 Query 缓存——避免双重缓存

## 三种渲染模式辨析

TanStack Start 同一份 `routes/` 可在三种模式间切换：

### SSR 模式（默认）

```ts
// vite.config.ts
export default defineConfig({
  plugins: [tanstackStart(), viteReact()],
})
```

- 每次请求服务端跑 `beforeLoad` + `loader` → 返回 HTML
- 客户端 hydration 后继续 SPA 导航（导航时 loader 在 client 执行）
- 适合：登录后 dashboard、用户个性化、需要鉴权的页面

### SSG / Static Prerender 模式

```ts
export default defineConfig({
  plugins: [
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true, // 自动顺着 <Link> 爬取
        // 或显式列出 paths:
        // paths: ['/', '/about', '/blog'],
      },
    }),
    viteReact(),
  ],
})
```

- 构建期跑所有 loader → 生成静态 HTML 文件
- 部署到任何 CDN（Cloudflare Pages / Netlify / GitHub Pages 都行）
- 适合：博客 / 文档站 / 营销页 / 内容不频繁更新的应用

### SPA 模式

```ts
export default defineConfig({
  plugins: [
    tanstackStart({
      spa: { enabled: true },
    }),
    viteReact(),
  ],
})
```

- 仅预渲染根路由的 HTML 壳（`_shell.html`）
- 所有页面都在客户端渲染（loader 仅 client 端跑）
- 部署需配置 SPA fallback：所有 404 → 重定向到 `_shell.html`
- 适合：内部工具 / Admin / 不在乎 SEO 的应用

也可以**混合**——多数路由 SSR，部分路由用 `ssr: false` 跳过：

```tsx
// src/routes/admin/dashboard.tsx —— 这个路由不走 SSR
export const Route = createFileRoute('/admin/dashboard')({
  ssr: false,
  component: Dashboard,
})
```

详见 [指南 - Selective SSR](./guide-line.md#selective-ssr-逐路由-ssr-控制)。

## 路由命名速查

| 文件路径 | URL | 说明 |
|---|---|---|
| `routes/__root.tsx` | (始终匹配) | 根布局，必须包含 `<html>` 壳 |
| `routes/index.tsx` | `/` | 根 index 路由 |
| `routes/about.tsx` | `/about` | 静态路由 |
| `routes/posts.tsx` | `/posts` + 子路由共享 | 父布局 |
| `routes/posts/index.tsx` | `/posts` | posts 父的 index |
| `routes/posts/$postId.tsx` | `/posts/123` | 动态参数 → `params.postId` |
| `routes/posts/$postId/edit.tsx` | `/posts/123/edit` | 嵌套（带参数父） |
| `routes/posts.$postId.tsx` | `/posts/123` | 扁平写法（点号代替斜杠） |
| `routes/files/$.tsx` | `/files/foo/bar` | Splat → `params._splat = 'foo/bar'` |
| `routes/_layout.tsx` | (不增加 URL) | Pathless 布局，下划线开头 |
| `routes/_layout.dashboard.tsx` | `/dashboard` | 走 `_layout` 包裹的 dashboard |
| `routes/(group)/posts.tsx` | `/posts` | Group 文件夹不影响 URL |
| `routes/-utils.tsx` | (不生成路由) | 短横线开头 → 排除 |
| `routes/posts_.$postId.edit.tsx` | `/posts/123/edit` | 后缀 `_` → 不继承 posts 父布局 |
| `routes/posts/{-$category}/index.tsx` | `/posts` 或 `/posts/tech` | 可选参数（v1.x+） |

完整说明见 [指南 - 文件命名约定全规则](./guide-line.md#文件命名约定全规则)。

## 开发体验

启动 `pnpm dev` 后会看到：

```
  VITE v7.0.0  ready in 350 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help

  ✓ TanStack Start: route tree generated to src/routeTree.gen.ts
```

**Devtools**：默认在右下角有个 TanStack Router 浮动按钮——点开后看到：

- 当前匹配的路由链
- 每个路由的 `params` / `search` / `loader data` / `context`
- 加载状态 / 错误 / 缓存命中情况
- 路由历史

按住 `Ctrl/Cmd + R` 可触发 `router.invalidate()` 重跑所有 loader。

## 项目脚本

CLI 项目默认有这些脚本：

```json
{
  "scripts": {
    "dev": "vite dev",                              // 开发模式（HMR + SSR）
    "build": "vite build",                          // 生产构建（client + server bundle）
    "start": "node .output/server/index.mjs",       // 启动生产服务器
    "lint": "eslint .",                             // ESLint
    "format": "prettier --write \"src/**/*.{ts,tsx}\""
  }
}
```

**构建产物**：

```
.output/
├── public/                  # 静态资源（CSS / JS / 图片）
└── server/
    ├── index.mjs            # Server entry（Node.js）
    └── ...
```

对应 SSG 模式会额外产出 `.output/public/*.html` 静态 HTML。

## 路由树常见操作

### 强制重新生成 `routeTree.gen.ts`

如果路由树不正常（比如 `routes/` 修改但 `routeTree.gen.ts` 没刷新），可以删了重启：

```bash
rm src/routeTree.gen.ts
pnpm dev
```

Vite 插件会在启动时重新扫描并生成。

### 看路由树长啥样

启动 dev 后访问 devtools 中的 Routes 标签，或在代码里：

```ts
import { routeTree } from './routeTree.gen'
console.log(JSON.stringify(routeTree, null, 2))
```

## 常见问题（入门级）

### 1. `routeTree.gen.ts` 报错或找不到

**原因**：第一次 `pnpm install` 后直接 `pnpm build`，没跑过 `dev` —— 插件没机会生成文件。

**修复**：先 `pnpm dev` 一次（按 Ctrl+C 退出即可），或在 `package.json` `prebuild` 钩子里跑 `vite build --mode generate` 让插件先生成。

### 2. `<html>` `<body>` 错位 / hydration 失败

**原因**：`__root.tsx` 没正确返回完整 HTML 壳（漏了 `<head>` / `<body>`），或 `<Scripts />` 没放在 `<body>` 内。

**修复**：照搬本文「`src/routes/__root.tsx`」章节的模板，确保：
- `<HeadContent />` 在 `<head>` 内
- `<Scripts />` 在 `<body>` 末尾、子内容之后

### 3. `createServerFn` 类型推导失败

**原因**：通常是 TypeScript 版本 < 5 或 `tsconfig.json` 没开 `"strict": true`。

**修复**：升 TS 到 5+，开启 strict。

### 4. `Link` to 字符串没有自动补全

**原因**：`declare module '@tanstack/react-router' { interface Register { router: ... } }` 没声明，TS 不知道你的路由树。

**修复**：在 `src/router.tsx` 末尾加上：

```ts
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
```

### 5. 部署到 Cloudflare 后 `process.env` 是 `undefined`

**原因**：CF Workers 不支持顶层 `process.env` 读取——env 是 per-request 注入。

**修复**：永远在 `.handler()` 内访问 env：

```ts
// ❌ 错（模块加载时就读，CF 上读不到）
const apiKey = process.env.API_KEY
export const fn = createServerFn().handler(() => useApi(apiKey))

// ✅ 对（请求时再读）
export const fn = createServerFn().handler(() => useApi(process.env.API_KEY))
```

详见 [指南 - 环境变量](./guide-line.md#环境变量--运行时-env-读取)。

### 6. 想在某个路由禁用 SSR

```tsx
export const Route = createFileRoute('/admin')({
  ssr: false, // 这个路由仅在 client 端渲染
  component: Admin,
})
```

详见 [指南 - Selective SSR](./guide-line.md#selective-ssr-逐路由-ssr-控制)。

## 下一步

入门到此为止，深入主题：

- **路由进阶**：嵌套 / pathless layout / splat / group / 非嵌套 / 可选参数 → [指南 - 文件命名约定](./guide-line.md#文件命名约定全规则)
- **类型化导航**：`<Link>` / `useNavigate` / `linkOptions` 全集 → [指南 - 类型安全导航](./guide-line.md#类型安全导航)
- **类型化 search params**：`validateSearch` + Zod + 中间件 → [指南 - 类型安全的-search-params](./guide-line.md#类型安全的-search-params)
- **Server Functions 全集**：输入校验 / FormData / streaming / 错误 → [指南 - Server Functions](./guide-line.md#server-functions-全集)
- **Middleware**：server / client / function 三类 → [指南 - Middleware 三类](./guide-line.md#middleware-三类)
- **Server Routes（API 端点）**→ [指南 - Server Routes（API 端点）](./guide-line.md#server-routes-api-端点)
- **Selective SSR + SPA + SSG** → [指南 - Selective SSR](./guide-line.md#selective-ssr-逐路由-ssr-控制)
- **部署**：Cloudflare / Netlify / Nitro → [指南 - 部署 adapter](./guide-line.md#部署-adapter)
- **常见踩坑** → [指南 - 常见踩坑](./guide-line.md#常见踩坑)
- **API 速查** → [参考](./reference.md)
