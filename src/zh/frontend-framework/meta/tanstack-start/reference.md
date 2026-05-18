---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 TanStack Start v1.x RC（`@tanstack/react-start` + `@tanstack/react-router`）—— API 速查 / 文件约定 / 配置选项 / 命名约定。

## 包结构

| 包 | 用途 | 必需 |
|---|---|---|
| `@tanstack/react-start` | Start 运行时 + `createServerFn` / `createMiddleware` / `createStart` 等 | **是** |
| `@tanstack/react-router` | 路由核心（`createFileRoute` / `Link` / hooks） | **是** |
| `@tanstack/react-start/plugin/vite` | Vite 插件 `tanstackStart()` | **是** |
| `@tanstack/react-start/server` | 服务端工具（`useSession` / `getRequest` / `setResponseHeaders` 等） | 用到时 |
| `@tanstack/react-start/server-only` | 标记服务端独占模块 | 用到时 |
| `@tanstack/react-start/client-only` | 标记客户端独占模块 | 用到时 |
| `@tanstack/zod-adapter` | Zod 适配器（`zodValidator`） | Zod 用户 |
| `@tanstack/react-query` | TanStack Query（数据缓存） | 可选 |
| `@tanstack/react-router-devtools` | 路由 devtools | dev only |
| `@cloudflare/vite-plugin` | Cloudflare Workers 适配 | CF 部署 |
| `@netlify/vite-plugin-tanstack-start` | Netlify 适配 | Netlify 部署 |
| `nitro` / `nitro/vite` | 通用部署 adapter（Vercel / AWS / Bun 等） | 多平台 |

## CLI（`@tanstack/cli`）

| 命令 | 用途 |
|---|---|
| `npx @tanstack/cli@latest create` | 创建新项目（交互式选择模板 / 包管理器 / 特性） |
| `npx @tanstack/cli@latest add <plugin>` | 添加官方插件（Tailwind / shadcn 等） |

部署相关命令视平台不同（`pnpm run deploy` / `netlify deploy` / `wrangler deploy` 等）。

## `vite.config.ts` —— `tanstackStart()` 选项

```ts
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  server: { port: 3000 },
  resolve: { tsconfigPaths: true },
  plugins: [
    tanstackStart({
      // ── 路由生成 ──
      tsr: {
        routesDirectory: 'src/routes',           // 路由目录（默认）
        generatedRouteTree: 'src/routeTree.gen.ts', // 生成文件路径
        autoCodeSplitting: true,                 // 自动 code-splitting（默认 true）
        quoteStyle: 'single',                    // 生成代码的引号风格
        semicolons: false,                       // 生成代码是否带分号
      },

      // ── Server functions ──
      server: {
        // Server function ID 生成策略（影响生产环境的端点 URL 稳定性）
        functionIdStrategy: 'hashed',  // 'hashed' | 'filename'
      },

      // ── SPA 模式 ──
      spa: {
        enabled: false,
        // 当 enabled=true 时，仅渲染 _shell.html
      },

      // ── Static prerendering（SSG） ──
      prerender: {
        enabled: false,
        autoSubfolderIndex: true,            // /about → /about/index.html
        autoStaticPathsDiscovery: true,
        concurrency: 14,
        crawlLinks: true,                    // 顺着 <Link> 爬取
        filter: ({ path }) => true,
        retryCount: 2,
        retryDelay: 1000,
        maxRedirects: 5,
        failOnError: true,
        onSuccess: ({ page }) => {},
        pages: [
          {
            path: '/specials',
            prerender: { enabled: true, outputPath: '/specials/index.html' },
          },
        ],
      },

      // ── 入口自定义 ──
      // 默认 entry: '@tanstack/react-start/server-entry'
      // 平台 adapter 可能覆盖

      // ── 导入保护严格度 ──
      // dev: 'warn'（默认）/ prod: 'error'
    }),
    viteReact(),
  ],
})
```

## Router 类型注册

```ts
// src/router.tsx
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
```

注册后：

- `Link.to` 字符串获得整棵路由树自动补全
- `useNavigate` / `useParams` / `useSearch` 获得对应路由的类型推导
- `<Link to>` 缺 `params` 或 `params` 类型错时编译报错

## `createRouter` 选项

```ts
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

const router = createRouter({
  routeTree,

  // ── Preload ──
  defaultPreload: 'intent',        // 'intent' | 'viewport' | false
  defaultPreloadStaleTime: 30_000, // preload 缓存有效期
  defaultPreloadDelay: 50,         // intent 触发延迟（ms）
  defaultPreloadGcTime: 30 * 60_000,

  // ── 加载 ──
  defaultStaleTime: 0,             // 路由数据 fresh 时长（默认 0 → 每次重跑）
  defaultGcTime: 30 * 60_000,      // 缓存回收时长（默认 30min）

  // ── Pending ──
  defaultPendingMs: 1000,          // 1s 后才显示 pendingComponent
  defaultPendingMinMs: 500,        // pendingComponent 显示至少 500ms

  // ── 组件 ──
  defaultComponent: () => <Outlet />,
  defaultPendingComponent: () => <div>Loading...</div>,
  defaultErrorComponent: ({ error, reset }) => <p>{error.message}</p>,
  defaultNotFoundComponent: () => <h1>404</h1>,

  // ── 上下文 ──
  context: { queryClient },        // 与 createRootRouteWithContext 配套

  // ── Wrap：在 RouterProvider 外层包一层 ──
  Wrap: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,

  // ── InnerWrap：在路由组件外层包一层（如 i18n） ──
  InnerWrap: ({ children }) => <I18nProvider>{children}</I18nProvider>,

  // ── History ──
  basepath: '/app',                // 全应用前缀（默认 '/'）
  scrollRestoration: true,         // 自动恢复滚动位置（默认 false）

  // ── 错误时的行为 ──
  defaultOnCatch: ({ error }) => { /* 全局 catch */ },
})
```

## `createFileRoute()` 选项

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/path/$param')({
  // ── 组件 ──
  component: MyComponent,              // 路由组件
  errorComponent: ({ error, reset }) => ...,
  pendingComponent: () => <Loading />,
  notFoundComponent: () => <NotFound />,

  // ── 数据加载 ──
  loader: async ({ params, deps, context, abortController, preload, location, cause }) => {...},
  loaderDeps: ({ search }) => ({ ... }),    // 返回 loader 的 deps
  beforeLoad: async ({ context, location, params, search }) => { return { extra: '...' } },

  // ── 缓存 ──
  staleTime: 10_000,
  preloadStaleTime: 30_000,
  gcTime: 30 * 60_000,
  shouldReload: false,                 // 是否在 deps 不变时重跑

  // ── 渲染策略 ──
  pendingMs: 500,
  pendingMinMs: 300,

  // ── SSR 控制 ──
  ssr: true,                           // true | false | 'data-only' | ({ params, search }) => ...

  // ── Search params ──
  validateSearch: SearchSchema,        // Zod schema 或函数 (s: unknown) => MySearch
  search: {
    middlewares: [
      retainSearchParams(['lang']),
      stripSearchParams({ page: 1 }),
    ],
  },

  // ── Server routes（API 端点） ──
  server: {
    middleware: [authMw],
    handlers: {
      GET: async ({ request, params, context }) => Response.json({...}),
      POST: ...,
      PUT: ...,
      PATCH: ...,
      DELETE: ...,
    },
    // 或带逐方法 middleware：
    // handlers: ({ createHandlers }) => createHandlers({...})
  },

  // ── Head ──
  head: () => ({
    meta: [{ title: '页面标题' }, { name: 'description', content: '...' }],
    links: [{ rel: 'canonical', href: '...' }],
    scripts: [{ src: '...' }],
  }),

  // ── Lifecycle hooks ──
  onEnter: (match) => {},
  onStay: (match) => {},
  onLeave: (match) => {},
  onError: ({ error }) => {},
  onCatch: ({ error, errorInfo }) => {},
})
```

## `createRootRoute` / `createRootRouteWithContext`

```tsx
import { createRootRoute, createRootRouteWithContext } from '@tanstack/react-router'

// 不带上下文
export const Route = createRootRoute({
  head: () => ({ meta: [{ title: 'App' }] }),
  component: RootComponent,
})

// 带上下文（用于 QueryClient / auth user / 等全局）
interface MyContext {
  queryClient: QueryClient
  user?: User
}

export const Route = createRootRouteWithContext<MyContext>()({
  head: () => ({...}),
  component: RootComponent,
})
```

## Components

### `<HeadContent />`

在 `<head>` 内渲染所有路由的 head 内容（meta / title / link / script）。

```tsx
<head>
  <HeadContent />
</head>
```

### `<Scripts />`

注入客户端 JS bundle / hydration 数据，必须在 `<body>` 末尾。

```tsx
<body>
  <Outlet />
  <Scripts />
</body>
```

### `<Outlet />`

渲染下一级匹配的子路由（或 `null`）。

```tsx
function Layout() {
  return (
    <div>
      <Header />
      <Outlet />
      <Footer />
    </div>
  )
}
```

### `<Link>`

类型安全的导航链接。

```tsx
<Link
  to="/posts/$postId"
  params={{ postId: '1' }}
  search={{ q: 'react' }}
  hash="comments"
  replace={false}                       // 默认 false
  preload="intent"                      // 'intent' | 'viewport' | false
  activeProps={{ className: 'active' }}
  inactiveProps={{ className: 'inactive' }}
  activeOptions={{ exact: false, includeHash: false, includeSearch: false }}
  resetScroll={true}
  startTransition={true}
  ignoreBlocker={false}                 // 跳过 useBlocker
  reloadDocument={false}                // 强制完整重载
  from="/current/path"                  // 相对路径基准
  search={prev => ({ ...prev, page: prev.page + 1 })} // 函数式
>
  Post 1
</Link>
```

### `<ClientOnly>`

仅在客户端渲染（server 端显示 fallback）。

```tsx
import { ClientOnly } from '@tanstack/react-router'

<ClientOnly fallback={<div>Loading...</div>}>
  <ThirdPartyMap />
</ClientOnly>
```

### `<Navigate>`

声明式跳转（少用，多用 `redirect()` / `useNavigate`）。

```tsx
<Navigate to="/login" replace />
```

### `<MatchRoute>`

条件渲染（基于路由匹配）。

```tsx
<MatchRoute to="/posts/$postId" params={{ postId: '1' }}>
  {(match) => match ? <div>当前是 Post 1</div> : null}
</MatchRoute>
```

### `<ErrorComponent>`

默认错误组件（用于 fallback / 自定义错误组件包装）。

```tsx
import { ErrorComponent } from '@tanstack/react-router'

errorComponent: ({ error }) => <ErrorComponent error={error} />
```

## Hooks

### 路由内（`Route.useXxx()`）

```tsx
const params = Route.useParams()         // 当前路由的 params（typed）
const search = Route.useSearch()         // 当前路由的 search（typed）
const data = Route.useLoaderData()       // loader 返回值
const ctx = Route.useRouteContext()      // 当前路由的 context
const match = Route.useMatch()           // 当前路由的 match 信息
```

### 路由外（`getRouteApi`）

```tsx
import { getRouteApi } from '@tanstack/react-router'

const api = getRouteApi('/posts/$postId')

function Comp() {
  const { postId } = api.useParams()
  const post = api.useLoaderData()
}
```

### 全局 hooks

| Hook | 用途 |
|---|---|
| `useRouter()` | 获取 router 实例（`router.invalidate()` / `router.navigate()`） |
| `useNavigate()` | 编程式导航函数 |
| `useLocation()` | 当前 location（pathname / search / hash） |
| `useMatches()` | 所有匹配路由的 match 数组 |
| `useMatch()` | 单个 match（按 routeId 查找） |
| `useChildMatches()` | 当前路由的子 match 数组 |
| `useParentMatches()` | 当前路由的父 match 数组 |
| `useRouterState()` | 完整 router state（包含 transition state） |
| `useBlocker()` | 拦截导航（如未保存提示） |
| `useCanGoBack()` | 是否可后退 |
| `useSearch({ from })` | 任意路由的 search |
| `useParams({ from })` | 任意路由的 params |
| `useLoaderData({ from })` | 任意路由的 loader data |
| `useLoaderDeps({ from })` | 任意路由的 loader deps |
| `useRouteContext({ from })` | 任意路由的 context |

## 函数 / 工具

### 导航 / 重定向

```tsx
import { redirect, notFound } from '@tanstack/react-router'

// 抛出重定向
throw redirect({ to: '/login', search: { redirect: location.href } })

// 抛出 404
throw notFound()

// 抛出业务错误（被 errorComponent 捕获）
throw new Error('something failed')
```

### `linkOptions()`

```tsx
import { linkOptions } from '@tanstack/react-router'

export const homeLink = linkOptions({
  to: '/',
})

export const postLink = (id: string) =>
  linkOptions({
    to: '/posts/$postId',
    params: { postId: id },
  })

// 使用
<Link {...homeLink}>Home</Link>
<Link {...postLink('1')}>Post 1</Link>
```

### `retainSearchParams()` / `stripSearchParams()`

```tsx
import { retainSearchParams, stripSearchParams } from '@tanstack/react-router'

search: {
  middlewares: [
    retainSearchParams(['lang', 'theme']),
    stripSearchParams({ page: 1, sort: 'newest' }),
  ],
}
```

### `useBlocker`

```tsx
import { useBlocker } from '@tanstack/react-router'

useBlocker({
  shouldBlockFn: () => isDirty,
  withResolver: false,
  enableBeforeUnload: true,
})
```

## `createServerFn` API

```tsx
import { createServerFn } from '@tanstack/react-start'

const fn = createServerFn({
  method: 'POST',         // 'GET' | 'POST'（默认 GET）
  strict: true,           // 序列化检查（默认 true）
  // strict: { input: false } —— 仅关闭输入检查
  type: 'static',         // 'dynamic' | 'static'（static = 构建期执行）
})
  .inputValidator(schemaOrFn)         // 输入校验
  .middleware([mw1, mw2])             // 中间件链
  .handler(async ({ data, context, signal }) => {
    return { /* 返回值，必须可序列化 */ }
  })

// 客户端调用
await fn({ data: {...}, headers: {...}, fetch: customFetch })
```

### `useServerFn`

```tsx
import { useServerFn } from '@tanstack/react-start'

const myFn = useServerFn(originalFn) // 返回包装后的可调用函数
```

## `createMiddleware` API

```tsx
import { createMiddleware } from '@tanstack/react-start'

// Request middleware（默认）
const reqMw = createMiddleware()
  .middleware([dep1])
  .server(async ({ next, request, context }) => {
    return next({ context: { ... } })
  })

// Function middleware（仅 createServerFn 用）
const fnMw = createMiddleware({ type: 'function' })
  .inputValidator(schema)
  .middleware([dep1])
  .client(async ({ next, context }) => {
    return next({
      sendContext: { /* 显式送到 server */ },
      headers: { /* 自定义 header */ },
      fetch: customFetch,
    })
  })
  .server(async ({ next, context, data, request }) => {
    return next({ context: { ... }, sendContext: { /* 回传 client */ } })
  })
```

## `createStart` —— 全局配置

```tsx
// src/start.ts
import { createStart, createMiddleware, createCsrfMiddleware } from '@tanstack/react-start'

const csrfMw = createCsrfMiddleware({
  filter: ctx => ctx.handlerType === 'serverFn',
  origin: 'https://app.example.com', // 可选
})

const globalLog = createMiddleware().server(async ({ next, request }) => {
  console.log(request.method, request.url)
  return next()
})

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMw, globalLog],
  functionMiddleware: [/* server function 专属全局 mw */],
  defaultSsr: true,                  // 全局 SSR 默认值
  serverFns: {
    fetch: customFetch,              // 全局 fetch 实现
  },
}))
```

## Server-side 工具（`@tanstack/react-start/server`）

```tsx
import {
  getRequest,
  getRequestHeader,
  getRequestHeaders,
  setResponseHeaders,
  setResponseHeader,
  setResponseStatus,
  useSession,
} from '@tanstack/react-start/server'

// 拿请求
const req = getRequest()
const auth = getRequestHeader('authorization')

// 改响应
setResponseHeader('X-Foo', 'bar')
setResponseHeaders(new Headers({ 'Cache-Control': '...' }))
setResponseStatus(201)

// Session
const session = await useSession<{ userId: string }>({
  name: 'app-session',
  password: process.env.SESSION_SECRET!,
  cookie: { httpOnly: true, secure: true, sameSite: 'lax' },
})

await session.update({ userId: 'u1' })  // 设置
session.data.userId                      // 读取
await session.clear()                    // 清空
```

## 同构 / 独占 API（`@tanstack/react-start`）

```tsx
import {
  createServerFn,         // RPC（推荐）
  createServerOnlyFn,     // 仅服务端工具（客户端调用抛错）
  createClientOnlyFn,     // 仅客户端工具
  createIsomorphicFn,     // 双端不同实现
  useHydrated,            // hydration 状态 hook
} from '@tanstack/react-start'

// 仅服务端
const getEnv = createServerOnlyFn(() => process.env.SECRET)

// 仅客户端
const saveLocal = createClientOnlyFn((k: string, v: any) =>
  localStorage.setItem(k, JSON.stringify(v)),
)

// 双端不同实现
const getInfo = createIsomorphicFn()
  .server(() => ({ env: 'server', platform: process.platform }))
  .client(() => ({ env: 'client', ua: navigator.userAgent }))
```

## 文件命名约定速查

| 模式 | 含义 | URL |
|---|---|---|
| `__root.tsx` | 根路由 | (始终匹配) |
| `index.tsx` | 父 index | `/parent/` |
| `name.tsx` | 静态段 | `/name` |
| `$param.tsx` | 动态参数 | `/123` → `params.param = '123'` |
| `$.tsx` | Splat | `/a/b/c` → `params._splat = 'a/b/c'` |
| `_layout.tsx` | Pathless 布局（包裹子路由） | (无 URL) |
| `(group)/x.tsx` | Pathless group（仅组织） | `/x` |
| `-name.tsx` | 排除（不生成路由） | (无) |
| `foo.bar.tsx` | 扁平嵌套 | `/foo/bar` |
| `foo_.bar.tsx` | 非嵌套（不继承父） | `/foo/bar`（独立树） |
| `foo[.]bar.tsx` | 转义点号 | `/foo.bar` |
| `foo/route.tsx` | 文件夹下的父路由 | `/foo` |
| `{-$param}.tsx` | 可选参数 | `/posts` 或 `/posts/tech` |

## `routeTree.gen.ts`

Vite 插件自动生成的文件，包含：

- 整棵路由树的运行时（`routeTree`）
- 全应用路径字符串 / params / search 的类型定义
- `Register` 接口扩展

```ts
// 由插件自动生成 —— 切勿手动编辑
import { Route as IndexRoute } from './routes/index'
import { Route as AboutRoute } from './routes/about'
import { Route as PostsRoute } from './routes/posts'
// ...

export const routeTree = rootRoute.addChildren([
  IndexRoute,
  AboutRoute,
  PostsRoute.addChildren([/* ... */]),
])

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': { /* ... */ }
    '/about': { /* ... */ }
    '/posts/$postId': { /* ... */ }
  }
}
```

通常加入 `.gitignore`，dev / build 时自动重新生成。

## 项目结构约定

```
my-app/
├── package.json
├── tsconfig.json
├── vite.config.ts                    # Vite + tanstackStart() 插件
├── src/
│   ├── router.tsx                    # createRouter + Register 类型注册
│   ├── routeTree.gen.ts              # ⚙️ 自动生成（gitignore）
│   ├── start.ts                      # （可选）createStart + 全局中间件 + CSRF
│   ├── env.d.ts                      # 环境变量类型
│   ├── routes/
│   │   ├── __root.tsx                # 根路由 + HTML 壳
│   │   ├── index.tsx                 # / 路由
│   │   ├── _authed.tsx               # 鉴权 layout（pathless）
│   │   ├── _authed/
│   │   │   ├── dashboard.tsx         # /dashboard
│   │   │   └── settings.tsx          # /settings
│   │   ├── posts/
│   │   │   ├── index.tsx             # /posts
│   │   │   └── $postId.tsx           # /posts/:id
│   │   └── api/
│   │       └── users.ts              # /api/users (API only)
│   ├── utils/
│   │   ├── users.functions.ts        # createServerFn 包装
│   │   ├── users.server.ts           # server-only 工具
│   │   └── schemas.ts                # 共享 Zod schema
│   ├── middleware/
│   │   ├── auth.ts                   # 认证中间件
│   │   └── authz.ts                  # 授权中间件
│   ├── components/                   # 共享组件
│   └── styles.css
├── .env                              # 共享 env
├── .env.development                  # dev 环境 env
├── .env.production
└── .env.local                        # 本地覆盖（gitignore）
```

## 默认端口 / URL

| 用途 | URL / 端口 |
|---|---|
| Dev server | `http://localhost:3000` |
| Server function endpoint | `/_serverFn/<hashed-id>` |
| API routes | 按文件路径（如 `/api/users`） |
| SPA shell | `/_shell.html` |
| Devtools 浮按钮 | 默认右下角（dev 模式） |

## 构建产物

```
.output/
├── public/             # 静态资源（HTML / CSS / JS / 图片）
│   ├── index.html      # SPA shell（仅 SPA / SSG 模式）
│   ├── assets/
│   │   ├── *.js
│   │   └── *.css
│   └── *.html          # SSG 静态 HTML
└── server/
    ├── index.mjs       # Node.js server entry
    └── chunks/
```

## 错误码 / 异常

| 异常 | 触发 | 处理 |
|---|---|---|
| `redirect({...})` | `loader` / `beforeLoad` / server fn 内抛 | 自动跳转 |
| `notFound()` | 同上 | 显示 `notFoundComponent` |
| `Error` | 任意位置抛 | 显示 `errorComponent` |
| 400 / 422 | server fn 输入校验失败 | client 端 throw |
| 401 / 403 | CSRF / auth middleware 抛 | client 端 throw |

## 与 TanStack Query 协作 API

```tsx
import { QueryClient, queryOptions, useSuspenseQuery, useMutation } from '@tanstack/react-query'

// 在 createRouter 时注入 client
const queryClient = new QueryClient()
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreloadStaleTime: 0,                 // 让 Query 接管缓存
  Wrap: ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  ),
})

// 定义 queryOptions（可复用）
const postsQuery = queryOptions({
  queryKey: ['posts'],
  queryFn: () => fetchPosts(),
})

// loader 预取
loader: ({ context }) => context.queryClient.ensureQueryData(postsQuery)

// 组件消费
const { data } = useSuspenseQuery(postsQuery)
```

## ImportProtection 标记

```ts
// 服务端独占（如果文件没有 .server.ts 后缀）
import '@tanstack/react-start/server-only'

// 客户端独占（如果文件没有 .client.ts 后缀）
import '@tanstack/react-start/client-only'
```

## 环境变量约定

```bash
# 服务端独占（无前缀）
DATABASE_URL=postgresql://...
JWT_SECRET=secret-32-chars-min
SESSION_SECRET=another-secret

# 客户端可见（VITE_ 前缀）
VITE_API_URL=https://api.example.com
VITE_APP_NAME=My App
VITE_SENTRY_DSN=...
```

读取：

- 服务端：`process.env.X` —— 必须在 `.handler()` 内读（避免 edge 平台坑）
- 客户端：`import.meta.env.VITE_X`

## SSR 控制速查

| 设置 | beforeLoad | loader | Component HTML |
|---|---|---|---|
| `ssr: true` | server | server | server |
| `ssr: 'data-only'` | server | server | client only |
| `ssr: false` | client | client | client only |
| `ssr: fn(...)` | 函数返回值决定 | 同上 | 同上 |

> **继承**：子路由只能让 SSR **更严格**（true → 'data-only' → false），不能放松。

## Server Routes Handler 上下文

```tsx
GET: async ({
  request,       // 标准 Request 对象
  params,        // 动态路径参数
  context,       // middleware 注入的上下文
}) => {
  return new Response('...')
  // 或
  return Response.json({...})
  // 或
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } })
}
```

支持的 HTTP method：`GET` / `POST` / `PUT` / `PATCH` / `DELETE` / `OPTIONS` / `HEAD`。

## 部署 Preset（Nitro）速查

| 平台 | preset | 备注 |
|---|---|---|
| Vercel | `vercel` | Edge / Node runtime |
| Cloudflare Workers | `cloudflare`（用 `@cloudflare/vite-plugin` 更佳） | nodejs_compat |
| Cloudflare Pages | `cloudflare-pages` | |
| Netlify | `netlify`（用 `@netlify/vite-plugin-tanstack-start` 更佳） | |
| AWS Lambda | `aws-lambda` | API Gateway |
| Bun | `bun` | 需要 React 19 |
| Node | `node-server`（默认） | 通用 Node |
| Deno | `deno-server` | |
| Static | `static` | SSG only |

## 调试

### Router Devtools

dev 模式下右下角浮动按钮：

- Routes：当前匹配链 / 全部路由树
- Search：当前 search params + middleware 链
- Matches：每个 match 的 params / loader data / context
- Cache：SWR 缓存状态

### 路由 ID 日志

```tsx
const router = createRouter({
  routeTree,
  // 显示路由调试信息
  notFoundMode: 'fuzzy', // 'fuzzy' | 'root'
})
```

### Server function 调用日志

dev 时浏览器 Network 面板看 `/_serverFn/...` 请求：

- Request：JSON 化的 `data` 输入
- Response：JSON 化的返回值
- Status：400 = 输入校验失败 / 403 = CSRF / 500 = handler 抛错

## 升级路径（RC → v1）

- 锁定具体 minor 版本：`"@tanstack/react-start": "1.0.0-rc.X"`
- 关注 [CHANGELOG](https://github.com/TanStack/router/blob/main/packages/start-react/CHANGELOG.md)
- 部分 unstable 特性：
  - RSC（experimental）
  - `unstable_*` 前缀的配置项

## 学习资源

- [TanStack Start 官方文档](https://tanstack.com/start/latest/docs/framework/react/overview)
- [TanStack Router 文档](https://tanstack.com/router/latest)
- [示例代码](https://tanstack.com/start/latest/docs/framework/react/examples)
- [TanStack/router GitHub](https://github.com/TanStack/router)
- [Discord 社区](https://discord.com/invite/yjUNbvbraC)
