---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 React Router v7.x（`react-router` + `@react-router/dev`）—— API 速查 / 文件约定 / 配置选项 / 命名约定。本笔记面向 **Framework 模式**。

## 包结构

| 包 | 用途 | 必需 |
|---|---|---|
| `react-router` | 核心运行时（Hooks / Components / Router 工厂 / 工具函数） | **是** |
| `react-router/dom` | Browser hydration 入口（`HydratedRouter`） | client 入口 |
| `@react-router/dev` | Vite plugin + CLI（`reactRouter()` / `react-router build` / `typegen`） | **是**（Framework 模式） |
| `@react-router/dev/routes` | 路由配置 helper（`route` / `index` / `layout` / `prefix`） | **是** |
| `@react-router/dev/config` | 配置文件类型（`Config`） | **是** |
| `@react-router/fs-routes` | 文件系统路由扫描器（`flatRoutes()`） | 可选 |
| `@react-router/node` | Node.js runtime adapter | Node 部署 |
| `@react-router/serve` | 简易 Express 服务器（dev / 小项目） | 默认部署 |
| `@react-router/express` | Express middleware adapter | 自定义 Express |
| `@react-router/cloudflare` | Cloudflare Workers / Pages adapter | CF 部署 |
| `@react-router/architect` | AWS Lambda + API Gateway adapter | AWS |
| `isbot` | UA 检测（区分爬虫与浏览器） | SSR 时推荐 |

## CLI（`@react-router/dev`）

| 命令 | 用途 |
|---|---|
| `react-router dev` | 开发模式（Vite SSR HMR，端口 5173） |
| `react-router build` | 生产构建（client + server bundle） |
| `react-router-serve <build>` | 启动 Express SSR 服务器（端口 3000） |
| `react-router typegen` | 生成 `.react-router/types/+types/*.d.ts` |
| `react-router typegen --watch` | Watch 模式生成类型 |
| `react-router routes` | 打印当前路由树 |

## `react-router.config.ts` 配置

```ts
import type { Config } from '@react-router/dev/config'

export default {
  // ── 渲染策略 ──
  /** 是否启用 SSR（默认 true） */
  ssr: true,
  /** 静态预渲染：true / string[] / async function */
  prerender: ['/', '/about'],
  // prerender: { paths: [...], concurrency: 4 },
  // prerender: async ({ getStaticPaths }) => [...]

  // ── 目录配置 ──
  /** 应用代码目录（默认 'app'） */
  appDirectory: 'app',
  /** 路由清单路径（默认 'app/routes.ts'） */
  routes: 'app/routes.ts',
  /** 构建输出根目录（默认 'build'） */
  buildDirectory: 'build',
  /** server bundle 文件名（默认 'index.js'） */
  serverBuildFile: 'index.js',

  // ── 部署 ──
  /** Module format（默认 'esm'） */
  serverModuleFormat: 'esm',

  // ── future flags（启用 unstable 特性） ──
  future: {
    unstable_middleware: false,
    unstable_optimizeDeps: false,
    unstable_splitRouteModules: false,
    unstable_subResourceIntegrity: false,
    unstable_viteEnvironmentApi: false,
  },
} satisfies Config
```

## `vite.config.ts`

```ts
import { reactRouter } from '@react-router/dev/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    reactRouter(),
    tsconfigPaths(), // 可选：让 ~/xxx 等路径别名生效
  ],
})
```

## `app/routes.ts` Helper API

```ts
import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from '@react-router/dev/routes'
```

| Helper | 签名 | 用途 |
|---|---|---|
| `index` | `index(file: string, opts?: { id? }): RouteConfigEntry` | 父路由的默认子路由（路径同父级） |
| `route` | `route(path: string, file: string, opts?, children?): RouteConfigEntry` | 标准路由 |
| `layout` | `layout(file: string, opts?, children?): RouteConfigEntry` | 纯布局（不增加 URL 段） |
| `prefix` | `prefix(path: string, children: RouteConfigEntry[]): RouteConfigEntry[]` | 给一组路由批量加 URL 前缀 |

```ts
export default [
  index('./routes/home.tsx'),
  route('about', './routes/about.tsx'),
  route('dashboard', './routes/dashboard.tsx', [
    index('./routes/dashboard-home.tsx'),
    route('settings', './routes/dashboard-settings.tsx'),
  ]),
  layout('./routes/auth-layout.tsx', [
    route('login', './routes/login.tsx'),
    route('register', './routes/register.tsx'),
  ]),
  ...prefix('admin', [
    route('users', './routes/admin-users.tsx'),
  ]),
] satisfies RouteConfig
```

**URL 模式语法**：

- `/users/:id` — 动态段
- `/users/:id?` — 可选段
- `/files/*` — splat（剩余路径）
- `:lang?/categories` — 可选前缀

## `@react-router/fs-routes` 文件路由

```ts
import { type RouteConfig } from '@react-router/dev/routes'
import { flatRoutes } from '@react-router/fs-routes'

export default flatRoutes({
  rootDirectory: 'routes', // 路由目录（相对 app/）
  ignoredRouteFiles: ['**/*.css'], // 排除的文件
}) satisfies RouteConfig
```

**命名约定**（flat routes）：

| 文件名 | URL |
|---|---|
| `_index.tsx` | `/` |
| `about.tsx` | `/about` |
| `concerts.tsx` | `/concerts`（父布局） |
| `concerts._index.tsx` | `/concerts`（index 子路由） |
| `concerts.trending.tsx` | `/concerts/trending` |
| `concerts.$city.tsx` | `/concerts/:city` |
| `_auth.tsx` | （无 URL 段，pathless layout） |
| `_auth.login.tsx` | `/login`（嵌套在 `_auth` 下） |
| `($lang)._index.tsx` | `/` 或 `/:lang` |
| `files.$.tsx` | `/files/*` |
| `sitemap[.]xml.tsx` | `/sitemap.xml`（转义 `.`） |
| `app._index/route.tsx` | `/` + 同目录辅助文件 |

## Route Module 导出

每个路由文件（`app/routes/*.tsx`）可导出以下成员，**全部可选**：

| 导出 | 类型 | 何时运行 | 用途 |
|---|---|---|---|
| `default` | `React.FC<Route.ComponentProps>` | 渲染时 | **组件**（必有才能渲染 UI） |
| `loader` | `(args: Route.LoaderArgs) => Promise<any>` | 服务器 | 服务端数据加载 |
| `clientLoader` | `(args: Route.ClientLoaderArgs) => Promise<any>` | 客户端 | 客户端数据加载 |
| `clientLoader.hydrate` | `true` | — | 让 `clientLoader` 参与初始 hydration |
| `action` | `(args: Route.ActionArgs) => Promise<any>` | 服务器 | 服务端 mutation |
| `clientAction` | `(args: Route.ClientActionArgs) => Promise<any>` | 客户端 | 客户端 mutation |
| `meta` | `(args: Route.MetaArgs) => MetaDescriptor[]` | 渲染时 | `<meta>` / `<title>` 标签 |
| `links` | `() => LinkDescriptor[]` | 渲染时 | `<link>` 标签 |
| `headers` | `(args) => HeadersInit` | 服务器 | HTTP 响应头 |
| `ErrorBoundary` | `React.FC<Route.ErrorBoundaryProps>` | 出错时 | 错误边界 |
| `HydrateFallback` | `React.FC<Route.HydrateFallbackProps>` | hydration 期间 | SSR fallback UI |
| `shouldRevalidate` | `(args: ShouldRevalidateFunctionArgs) => boolean` | navigation 后 | 控制是否 revalidate |
| `handle` | `unknown` | 渲染时 | 自定义数据（`useMatches`） |
| `middleware` | `Middleware[]`（unstable） | 服务器 | 服务端中间件 |
| `clientMiddleware` | `ClientMiddleware[]`（unstable） | 客户端 | 客户端中间件 |

### `Route.LoaderArgs`

```ts
interface LoaderArgs {
  request: Request // Web Standard Request
  params: Record<string, string> // URL 参数（类型从 URL pattern 推导）
  context: AppLoadContext // 自定义 context（自定义服务器传入）
}
```

### `Route.ActionArgs`

```ts
interface ActionArgs extends LoaderArgs {
  // request.method 通常是 POST/PUT/PATCH/DELETE
  // request.formData() 拿到表单数据
  // request.json() 拿 JSON body
}
```

### `Route.ClientLoaderArgs`

```ts
interface ClientLoaderArgs {
  request: Request
  params: Record<string, string>
  serverLoader: () => Promise<unknown> // 调用服务端 loader
}
```

### `Route.ClientActionArgs`

```ts
interface ClientActionArgs {
  request: Request
  params: Record<string, string>
  serverAction: () => Promise<unknown> // 调用服务端 action
}
```

### `Route.ComponentProps`

```ts
interface ComponentProps {
  loaderData: <从 loader 返回值推导>
  actionData: <从 action 返回值推导> | undefined
  params: Record<string, string>
  matches: RouteMatch[]
}
```

### `Route.MetaArgs`

```ts
interface MetaArgs {
  data: <loader 返回值> | undefined
  params: Record<string, string>
  location: Location
  matches: MetaMatch[]
}
```

### `Route.ErrorBoundaryProps`

```ts
interface ErrorBoundaryProps {
  error: unknown // 可能是 ErrorResponse / Error / 其他
  params: Record<string, string>
  loaderData: <可能 undefined>
  actionData: <可能 undefined>
}
```

## Components（`react-router` 导出）

### 路由相关

| 组件 | 用途 |
|---|---|
| `<Outlet />` | 渲染当前路由的子路由 |
| `<Outlet context={...} />` | 通过 `useOutletContext()` 向子路由传 context |
| `<Link to="/path">` | 客户端导航 |
| `<Link to="/path" prefetch="intent">` | 鼠标 hover/focus 时预取 |
| `<NavLink to="/path">` | 带 active / pending 状态的 Link |
| `<Navigate to="/path" />` | 渲染时立即重定向（声明式） |
| `<Routes>` + `<Route>` | Declarative 模式路由树（不推荐 Framework 用） |

```tsx
import { Link, NavLink, Outlet } from 'react-router'

<Link to="/about" prefetch="intent">关于</Link>

<NavLink
  to="/dashboard"
  end
  className={({ isActive, isPending }) =>
    isActive ? 'active' : isPending ? 'pending' : ''}
>
  Dashboard
</NavLink>

<Outlet />
```

### 表单相关

| 组件 | 用途 |
|---|---|
| `<Form method="post" action="/x">` | 增强 `<form>`（progressive enhancement） |
| `<Form method="get">` | 提交为 URL search params |
| `<Await resolve={promise}>` | 处理 streaming Promise（配 `<Suspense>`） |

```tsx
import { Await, Form } from 'react-router'

<Form method="post" action="/api/save">
  <input name="title" />
  <button>提交</button>
</Form>

<React.Suspense fallback={<Loading />}>
  <Await resolve={slowDataPromise}>
    {value => <DataView data={value} />}
  </Await>
</React.Suspense>
```

### 文档相关（用在 `root.tsx`）

| 组件 | 用途 |
|---|---|
| `<Meta />` | 聚合所有路由 `meta` 导出 |
| `<Links />` | 聚合所有路由 `links` 导出 |
| `<Scripts />` | 注入 hydration 脚本（**必需**） |
| `<ScrollRestoration />` | 客户端导航恢复滚动位置 |
| `<PrefetchPageLinks page="/x" />` | 编程式预取 |

### Router（程序化）

| 组件 | 模式 |
|---|---|
| `<HydratedRouter />` | Framework client 入口（从 `react-router/dom`） |
| `<ServerRouter context={...} url={...} />` | Framework server 入口 |
| `<RouterProvider router={...} />` | Data 模式（`createBrowserRouter` 创建） |
| `<BrowserRouter />` | Declarative 模式（v6 兼容） |
| `<HashRouter />` | 用 hash 而非 history API |
| `<MemoryRouter />` | 测试 / 嵌入式（内存中） |
| `<StaticRouter />` | 自定义 SSR 用 |

## Hooks（`react-router` 导出）

### 数据访问

| Hook | 签名 | 用途 |
|---|---|---|
| `useLoaderData<T>()` | `(): T` | 取当前路由 loader 数据 |
| `useActionData<T>()` | `(): T \| undefined` | 取当前路由 action 返回值 |
| `useRouteLoaderData<T>(id)` | `(routeId): T \| undefined` | 取指定路由的 loader 数据 |
| `useMatches()` | `(): RouteMatch[]` | 所有匹配路由（含 `handle`） |
| `useParams<T>()` | `(): T` | 当前路由所有 URL 参数 |
| `useLocation()` | `(): Location` | 当前 URL location 对象 |
| `useSearchParams()` | `(): [URLSearchParams, setter]` | 读 / 写 URL search params |
| `useMatch(pattern)` | `(): PathMatch \| null` | 检查当前 URL 是否匹配 pattern |

```tsx
import {
  useActionData,
  useLoaderData,
  useMatches,
  useParams,
  useSearchParams,
} from 'react-router'

const data = useLoaderData<typeof loader>()
const action = useActionData<typeof action>()
const { id } = useParams<{ id: string }>()
const [searchParams, setSearchParams] = useSearchParams()
const matches = useMatches() // [{ id, pathname, params, data, handle, ... }, ...]
```

### 导航

| Hook | 签名 | 用途 |
|---|---|---|
| `useNavigate()` | `(): NavigateFunction` | 编程式导航 |
| `useNavigation()` | `(): Navigation` | 全局 navigation 状态 |
| `useNavigationType()` | `(): 'POP' \| 'PUSH' \| 'REPLACE'` | 上次导航类型 |
| `useHref(to)` | `(to: To): string` | 解析 To 为完整 URL（含 basename） |
| `useResolvedPath(to)` | `(to: To): Path` | 解析为绝对路径 |
| `useFormAction(action?)` | `(action?: string, opts?): string` | 计算当前路由 action URL |

```tsx
import { useNavigate, useNavigation } from 'react-router'

const navigate = useNavigate()
navigate('/dashboard') // push
navigate('/dashboard', { replace: true })
navigate(-1) // 后退
navigate('/profile', { preventScrollReset: true })

const navigation = useNavigation()
// navigation.state: 'idle' | 'loading' | 'submitting'
// navigation.location: 目标 URL
// navigation.formData / formAction / formMethod
```

### Fetcher（无导航 mutation / 数据加载）

| Hook | 签名 | 用途 |
|---|---|---|
| `useFetcher<T>()` | `(): Fetcher<T>` | 独立 fetcher 实例 |
| `useFetcher<T>({ key })` | `({ key }): Fetcher<T>` | 命名 fetcher（跨组件共享状态） |
| `useFetchers()` | `(): Fetcher[]` | 所有活跃 fetcher（全局加载条用） |

```tsx
import { useFetcher } from 'react-router'

const fetcher = useFetcher<typeof action>()
// fetcher.Form / fetcher.submit / fetcher.load
// fetcher.state: 'idle' | 'submitting' | 'loading'
// fetcher.data: action / loader 返回值
// fetcher.formData / formAction / formMethod
```

### Revalidation

| Hook | 签名 | 用途 |
|---|---|---|
| `useRevalidator()` | `(): { state, revalidate }` | 主动触发所有 loader revalidate |

```tsx
const revalidator = useRevalidator()
revalidator.revalidate() // 触发所有 loader 重跑
// revalidator.state: 'idle' | 'loading'
```

### Form / Submit

| Hook | 签名 | 用途 |
|---|---|---|
| `useSubmit()` | `(): SubmitFunction` | 编程式提交（触发 action + 导航） |
| `useLinkClickHandler(to, opts?)` | `(): clickHandler` | 自定义 Link click |

```tsx
const submit = useSubmit()
submit(formData, { method: 'post', action: '/save' })
submit(null, { method: 'post' }) // 无数据提交
```

### 错误 / 边界

| Hook | 签名 | 用途 |
|---|---|---|
| `useRouteError()` | `(): unknown` | 在 ErrorBoundary 内取 error |
| `useAsyncError()` | `(): unknown` | 在 `<Await>` 的 errorElement 内取 error |
| `useAsyncValue()` | `(): unknown` | 在 `<Await>` 的 children 内取 value（非 render-prop 用法） |

```tsx
import { isRouteErrorResponse, useRouteError } from 'react-router'

function ErrorBoundary() {
  const error = useRouteError()
  if (isRouteErrorResponse(error)) {
    return <div>{error.status} {error.statusText}</div>
  }
  return <div>Unknown</div>
}
```

### 阻塞 / 监听

| Hook | 签名 | 用途 |
|---|---|---|
| `useBlocker(shouldBlock)` | `((args) => boolean): Blocker` | 拦截 navigation（确认离开未保存修改） |
| `useBeforeUnload(handler, opts?)` | `(handler): void` | 浏览器关闭前回调 |
| `usePrompt(opts)` | `({ when, message })` | 简化版 `useBlocker`（v6 风格） |

```tsx
const blocker = useBlocker(
  ({ currentLocation, nextLocation }) =>
    isDirty && currentLocation.pathname !== nextLocation.pathname,
)
if (blocker.state === 'blocked') {
  // 显示确认对话框
  // blocker.proceed() / blocker.reset()
}
```

### Outlet Context

| Hook | 签名 | 用途 |
|---|---|---|
| `useOutletContext<T>()` | `(): T` | 接收父路由 `<Outlet context={...} />` 传入的值 |
| `useOutlet()` | `(): React.ReactElement \| null` | 拿到要渲染的子路由（手动控制） |

```tsx
// 父路由
<Outlet context={{ user, theme }} />

// 子路由
const { user, theme } = useOutletContext<{ user: User, theme: Theme }>()
```

### View Transitions

| Hook | 签名 | 用途 |
|---|---|---|
| `useViewTransitionState(to)` | `(to: To): boolean` | View Transition 进行中 |

```tsx
<Link to="/about" viewTransition>关于</Link>
// 然后用 useViewTransitionState 检测
```

### Router Context（高级）

| Hook | 签名 | 用途 |
|---|---|---|
| `useInRouterContext()` | `(): boolean` | 检查是否在 Router context 内 |
| `useRoutes(routes)` | `(routes: RouteObject[], opts?): React.ReactElement` | 渲染配置式路由 |
| `useRouterState()` | `(): RouterState` | Data Router 完整状态 |
| `useResolvedPath(to)` | `(to: To): Path` | 解析 to 为 path |

## 工具函数（`react-router` 导出）

### 响应

| 函数 | 签名 | 用途 |
|---|---|---|
| `redirect(url, init?)` | `(url: string, init?): Response` | 302 重定向 Response |
| `redirectDocument(url, init?)` | `(url: string, init?): Response` | 文档级重定向（不走 client navigation） |
| `replace(url, init?)` | `(url: string, init?): Response` | replace 重定向 |
| `data(value, init?)` | `(value, init?): Response` | 包装数据 + 自定义 status / headers |

```ts
return redirect('/dashboard')
return data({ ok: false, error: '...' }, { status: 400 })
return data(payload, { headers: { 'Cache-Control': 'no-store' } })
```

### Cookies / Sessions

| 函数 | 签名 | 用途 |
|---|---|---|
| `createCookie(name, opts?)` | `(name, opts): Cookie` | 创建签名 cookie |
| `createCookieSessionStorage<D, F>(opts)` | `(opts): SessionStorage` | Cookie-based session |
| `createSessionStorage<D, F>(strategy)` | `(strategy): SessionStorage` | 自定义存储策略（Redis / DB） |
| `createMemorySessionStorage(opts?)` | `(opts): SessionStorage` | 内存 session（测试） |

```ts
const userPrefs = createCookie('user-prefs', {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7,
  secrets: ['secret1'],
})

const { getSession, commitSession, destroySession }
  = createCookieSessionStorage({
    cookie: { name: '__session', secrets: ['s1'] },
  })
```

### 路由匹配

| 函数 | 签名 | 用途 |
|---|---|---|
| `matchRoutes(routes, location)` | `(routes, location, basename?): RouteMatch[] \| null` | 给定路由树和 URL，返回匹配结果 |
| `matchPath(pattern, pathname)` | `(pattern, pathname): PathMatch \| null` | 单个路径匹配 |
| `generatePath(pattern, params?)` | `(pattern, params?): string` | 用 params 替换 pattern 中的占位符 |
| `parsePath(path)` | `(path): Partial<Path>` | 解析 URL 为 `{ pathname, search, hash }` |
| `resolvePath(to, fromPathname?)` | `(to, from?): Path` | 相对路径解析 |
| `createPath(path)` | `(path): string` | 反向生成 URL |

### 类型守卫

| 函数 | 签名 | 用途 |
|---|---|---|
| `isRouteErrorResponse(error)` | `(error): error is ErrorResponse` | 区分 throw new Response vs throw Error |

### Static handler（自定义 SSR）

| 函数 | 签名 | 用途 |
|---|---|---|
| `createStaticHandler(routes, opts?)` | `(routes, opts): StaticHandler` | 创建静态 handler（自定义 SSR 用） |
| `createStaticRouter(routes, context, opts?)` | `(routes, context, opts): Router` | 配 `<StaticRouterProvider>` 使用 |

## 渲染策略对比

| 模式 | `react-router.config.ts` | 部署 | 适用 |
|---|---|---|---|
| SSR | `{ ssr: true }` | 需要 Node / Workers | 动态内容 / SEO 友好 |
| SPA | `{ ssr: false }` | 静态 host（CF Pages / GitHub Pages） | 后台管理 / 内部工具 |
| SSG（含 SSR） | `{ ssr: true, prerender: [...] }` | 任意 | 内容站 + 部分动态 |
| 完全静态 | `{ ssr: false, prerender: true }` | 静态 host | 纯静态站 |
| SPA Fallback | `{ ssr: false, prerender: ['/'] }` | 静态 host | SEO 关键页 + SPA 其余 |

## Adapter 部署

| Adapter | 包 | 适用平台 |
|---|---|---|
| Node Express | `@react-router/express` | Node.js 自定义 Express |
| Node Serve | `@react-router/serve` | 内置极简 Express（默认） |
| Node | `@react-router/node` | 通用 Node runtime |
| Cloudflare | `@react-router/cloudflare` | Cloudflare Workers / Pages |
| AWS Architect | `@react-router/architect` | AWS Lambda + API Gateway |
| Bun | （内置 Node compat） | Bun runtime |
| Deno | （内置 Web standard） | Deno deploy |

**官方模板**（`npx create-react-router --template`）：

- `remix-run/react-router-templates/default` — Node Docker + Tailwind
- `remix-run/react-router-templates/node-custom-server` — 自定义 Express
- `remix-run/react-router-templates/node-postgres` — + Postgres + Drizzle
- `remix-run/react-router-templates/cloudflare` — CF Workers
- `remix-run/react-router-templates/vercel` — Vercel
- `remix-run/react-router-templates/aws` — AWS Lambda
- `remix-run/react-router-templates/netlify` — Netlify

## 关键文件约定

```
app/
├── root.tsx                    # ✨ 必需，根路由 / HTML 文档骨架
├── routes.ts                   # ✨ 路由清单
├── routes/                     # ⚙️ 默认路由目录（约定，可改）
│   ├── home.tsx
│   ├── about.tsx
│   └── ...
├── entry.client.tsx            # 客户端入口（可选，默认隐式）
├── entry.server.tsx            # 服务端入口（可选）
├── load-context.ts             # ⚙️ AppLoadContext 类型扩展
├── *.server.ts                 # 仅服务端模块（client bundle 中报错）
├── *.client.ts                 # 仅客户端模块（server bundle 中为 undefined）
└── app.css                     # 全局样式

public/                         # 静态资源
.react-router/types/+types/     # ⚙️ 类型生成（不提交）
build/client/                   # 客户端 bundle
build/server/                   # 服务端 bundle
react-router.config.ts          # ✨ 全局配置
vite.config.ts                  # Vite 配置
tsconfig.json
```

## 命名约定

| 类型 | 风格 | 例 |
|---|---|---|
| 路由模块文件名 | `kebab-case.tsx` 或 `flat.routes.tsx` | `user-profile.tsx` / `users.$id.tsx` |
| 组件名 | `PascalCase` | `UserProfile` |
| Loader / Action 函数 | `loader` / `action` | `export async function loader() {}` |
| 类型 import 别名 | `Route` | `import type { Route } from './+types/...'` |
| Server-only 模块 | `*.server.ts` | `db.server.ts` / `email.server.ts` |
| Client-only 模块 | `*.client.ts` | `monaco.client.ts` |
| Session secret env | `SESSION_SECRET` | `.env` |
| Cookie env | `COOKIE_SECRET` | `.env` |

## 三种模式 API 速查

| Feature | Declarative | Data | Framework |
|---|---|---|---|
| `<BrowserRouter>` / `<Routes>` / `<Route>` | ✓ | — | — |
| `createBrowserRouter` / `<RouterProvider>` | — | ✓ | — |
| Vite plugin (`@react-router/dev`) | — | — | ✓ |
| `routes.ts` + file routes | — | — | ✓ |
| `loader` / `action` | — | ✓ | ✓ |
| `useFetcher` | — | ✓ | ✓ |
| `useNavigation` | — | ✓ | ✓ |
| Pending UI / Optimistic UI | — | ✓ | ✓ |
| 类型自动生成 (`Route.LoaderArgs`) | — | — | ✓ |
| SSR / SSG / SPA 模式 | — | 手动 | ✓ 内置 |
| `ErrorBoundary` 路由级 | — | ✓ | ✓ |
| Sessions / Cookies | — | — | ✓ |
| `react-router-serve` | — | — | ✓ |
| Adapter | — | — | ✓ |

## 与同类对比

| 维度 | React Router v7 Framework | Next.js 15 App Router | Remix v2 | SolidStart | SvelteKit | Qwik City |
|---|---|---|---|---|---|---|
| 渲染 | SSR/SPA/SSG | SSR + RSC | SSR | SSR/SSG/CSR | SSR/SSG/CSR | Resumable |
| 路由 | `routes.ts` / file | file | file | file | file | file |
| 数据加载 | `loader` | RSC / `fetch()` | `loader` | `query()` | `+page.ts load` | `routeLoader$` |
| Mutation | `action` + Form | Server Actions | `action` + Form | `action()` | `+page.server.ts action` | `routeAction$` |
| 表单 | `<Form>` (PE) | Server Actions / 手动 | `<Form>` (PE) | `<form action={x}>` | `<form>` (PE) | `<Form>` (PE) |
| 服务器组件 | unstable RSC | ✓ 默认 | — | — | — | — |
| 类型自动生成 | ✓ | 部分 | 部分 | ✓ | ✓ (v2+) | ✓ |
| 包体积（最小） | ~50KB | ~85KB+ | ~50KB | ~20KB | ~20KB | ~1KB (resumable) |
| Adapter 数量 | 7+ | Vercel-first | 10+ | 17+ (Nitro) | 10+ | 10+ |
| 学习曲线 | 中（三模式） | 陡（RSC） | 中 | 中（Solid） | 平 | 陡（resumable） |
| 生态规模 | 最大 | 次大 | （已合并） | 小 | 中 | 小 |

## 资源链接

- [React Router 官网](https://reactrouter.com/)
- [API Reference (auto-gen)](https://api.reactrouter.com/v7/)
- [GitHub](https://github.com/remix-run/react-router)
- [Discord 社区](https://rmx.as/discord)
- [Twitter @remix_run](https://twitter.com/remix_run)
- [Code Sandbox 模板](https://reactrouter.com/start/framework/installation)
- [Codemod 迁移工具](https://app.codemod.com/registry/remix/2/react-router/upgrade)
- [Conform 表单库](https://conform.guide/)（搭配 schema 校验）
- [React Router for Next.js 用户](https://reactrouter.com/start/modes#framework)
