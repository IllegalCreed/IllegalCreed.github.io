---
layout: doc
outline: [2, 3]
---

# 参考

> TanStack Router v1.x API 速查（`@tanstack/react-router`）。所有签名 / 类型 / 选项与官方文档对齐。

## 包结构

| 包 | 用途 | 必需 |
|---|---|---|
| `@tanstack/react-router` | 路由核心（创建函数、组件、hooks） | **是** |
| `@tanstack/router-plugin` | Vite / Rspack / Webpack 插件（File-based routing） | File-based 必需 |
| `@tanstack/react-router-devtools` | 路由 devtools | dev only |
| `@tanstack/router-cli` | CLI（`tsr generate` / `tsr watch`） | 不用插件时备选 |
| `@tanstack/solid-router` | Solid 实现 | Solid 用户 |
| `@tanstack/router-core` | 框架无关核心（内部使用） | 一般不直接用 |
| `zod` | Search params 校验（推荐 v4） | 可选 |

## 全部主要导出

```ts
// from '@tanstack/react-router'
import {
  // ===== 路由创建 =====
  createRouter,
  createRootRoute,
  createRootRouteWithContext,
  createRoute,
  createFileRoute,
  createLazyFileRoute,
  createLazyRoute,

  // ===== History =====
  createBrowserHistory,
  createHashHistory,
  createMemoryHistory,

  // ===== 组件 =====
  RouterProvider,
  Link,
  Outlet,
  Navigate,
  ErrorComponent,

  // ===== Hooks =====
  useRouter,
  useRouterState,
  useNavigate,
  useParams,
  useSearch,
  useLoaderData,
  useLoaderDeps,
  useMatch,
  useMatches,
  useChildMatches,
  useParentMatches,
  useRouteContext,
  useLocation,
  useBlocker,
  useCanGoBack,
  useLinkProps,
  useMatchRoute,
  useAwaited,
  getRouteApi,
  rootRouteId,

  // ===== 工具 =====
  redirect,
  notFound,
  isRedirect,
  isNotFound,

  // ===== 类型 =====
  type Router,
  type RouterOptions,
  type RouterState,
  type RouteOptions,
  type RouteMatch,
  type LinkProps,
  type LinkOptions,
  type NavigateOptions,
  type AnyRoute,
  type AnyContext,
  type Register,
  type FileRoutesByPath,
  type RouterHistory,
  type ParsedLocation,
  type HistoryAction,
  type ErrorComponentProps,
  type NotFoundError,
  type ShouldBlockFn,
  type ShouldBlockFnArgs,
} from '@tanstack/react-router'
```

## 核心创建函数

### `createRouter()`

创建 router 实例。

```ts
function createRouter(options: RouterOptions): Router
```

**完整 `RouterOptions`**：

| 选项 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `routeTree` | `AnyRoute` | 必填 | 路由树（来自 `__root` 或 `createRootRoute().addChildren(...)`） |
| `history` | `RouterHistory` | `createBrowserHistory()` | history 实现 |
| `basepath` | `string` | `/` | 应用基准路径 |
| `context` | `object` | `{}` | 初始 context（与 `createRootRouteWithContext` 匹配） |
| `defaultPreload` | `false \| 'intent' \| 'viewport' \| 'render'` | `false` | 默认预加载策略 |
| `defaultPreloadDelay` | `number` | `50` | 预加载延迟（ms） |
| `defaultStaleTime` | `number` | `0` | 默认 staleTime（ms） |
| `defaultPreloadStaleTime` | `number` | `30000` | 预加载 staleTime |
| `defaultGcTime` | `number` | `5 * 60 * 1000` | 默认 gcTime |
| `defaultPendingComponent` | `Component` | — | 全局 pending UI |
| `defaultPendingMs` | `number` | `1000` | pending 触发阈值 |
| `defaultPendingMinMs` | `number` | `500` | pending 最短时长 |
| `defaultErrorComponent` | `Component` | — | 全局错误边界 |
| `defaultNotFoundComponent` | `Component` | — | 全局 404 |
| `scrollRestoration` | `boolean` | `false` | 启用滚动恢复 |
| `scrollRestorationBehavior` | `'smooth' \| 'instant' \| 'auto'` | `'auto'` | 滚动行为 |
| `routeMasks` | `RouteMask[]` | — | 路由掩码（URL 美化） |
| `caseSensitive` | `boolean` | `false` | 路径大小写敏感 |
| `transformer` | `RouterTransformer` | — | 序列化器（SSR 用） |
| `Wrap` | `Component` | — | 包裹 router 的额外组件 |
| `InnerWrap` | `Component` | — | 包裹 router 内层 |

**示例**：

```ts
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
```

### `createRootRoute()`

创建根路由。

```ts
function createRootRoute(options?: Omit<RouteOptions, 'path' | 'id' | 'getParentRoute'>): RootRoute
```

**示例**：

```ts
import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => <Outlet />,
})
```

### `createRootRouteWithContext()`

创建带类型 context 的根路由（推荐用于注入 queryClient / auth 等）。

```ts
function createRootRouteWithContext<TRouterContext>(): typeof createRootRoute
```

**示例**：

```ts
import {
  createRootRouteWithContext,
  createRouter,
} from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

const rootRoute = createRootRouteWithContext<MyRouterContext>()({
  component: RootLayout,
})

const router = createRouter({
  routeTree: rootRoute.addChildren([/* ... */]),
  context: {
    queryClient: new QueryClient(),
  },
})
```

### `createRoute()`

创建子路由（Code-based）。

```ts
function createRoute(options: RouteOptions): Route
```

**核心选项**：

| 选项 | 类型 | 说明 |
|---|---|---|
| `getParentRoute` | `() => AnyRoute` | 必填——父路由（点号或函数） |
| `path` | `string` | 路径段（不含父路径） |
| `id` | `string` | pathless 路由用 id 替代 path |
| `component` | `Component` | 路由组件 |
| `pendingComponent` | `Component` | pending UI |
| `errorComponent` | `Component` | 错误边界 |
| `notFoundComponent` | `Component` | 404 组件 |
| `loader` | `Function` | 数据加载器 |
| `beforeLoad` | `Function` | 加载前钩子（守卫 / 注入 context） |
| `loaderDeps` | `Function` | 依赖追踪 |
| `validateSearch` | `validator` | search params 校验 |
| `staleTime` | `number` | 数据新鲜时间 |
| `preloadStaleTime` | `number` | 预加载新鲜时间 |
| `gcTime` | `number` | 缓存回收时间 |
| `shouldReload` | `Function \| boolean` | 是否重载 |
| `parseParams` | `Function` | 解析路径参数 |
| `stringifyParams` | `Function` | 序列化路径参数 |

**示例**：

```ts
const postRoute = createRoute({
  getParentRoute: () => postsRoute,
  path: '$postId',
  loader: ({ params }) => fetchPost(params.postId),
  component: PostDetail,
  errorComponent: PostError,
})
```

### `createFileRoute()`

文件路由（File-based）。

```ts
function createFileRoute(path: string): (options: RouteOptions) => Route
```

**示例**：

```ts
// src/routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  loader: ({ params }) => fetchPost(params.postId),
  component: PostDetail,
})

function PostDetail() {
  const data = Route.useLoaderData()
  return <article>{data.title}</article>
}
```

**特点**：

- 字符串路径由 Vite 插件自动维护
- 必须导出为 `Route`（插件按这个名字扫描）
- Route 实例上有 `useParams` / `useSearch` / `useLoaderData` 等方法（自动绑定到当前路由）

### `createLazyFileRoute()`

懒加载文件路由（component 单独 chunk）。

```ts
function createLazyFileRoute(path: string): (options: LazyRouteOptions) => Route
```

**示例**：

```ts
// src/routes/posts/$postId.lazy.tsx
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/posts/$postId')({
  component: PostDetail,
})
```

> 配对：主文件 `posts.$postId.tsx`（含 loader）+ `posts.$postId.lazy.tsx`（含 component）。

### `createLazyRoute()`

Code-based 懒加载路由。

```ts
function createLazyRoute(id: string): (options: LazyRouteOptions) => Route
```

**示例**：

```ts
const postRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'posts/$postId',
  loader: ({ params }) => fetchPost(params.postId),
}).lazy(() => import('./posts.lazy').then((d) => d.Route))
```

## History API

### `createBrowserHistory()`

HTML5 history（推荐，默认）。

```ts
function createBrowserHistory(): RouterHistory
```

### `createHashHistory()`

Hash history（零服务端配置）。

```ts
function createHashHistory(): RouterHistory
```

### `createMemoryHistory()`

内存 history（测试 / SSR）。

```ts
function createMemoryHistory(options?: {
  initialEntries?: string[]
  initialIndex?: number
}): RouterHistory
```

**示例**：

```ts
import { createMemoryHistory } from '@tanstack/react-router'

const history = createMemoryHistory({
  initialEntries: ['/posts/1'],
})
```

## 组件 API

### `<RouterProvider>`

应用入口组件。

```tsx
<RouterProvider router={router} />
```

**Props**：

| Prop | 类型 | 说明 |
|---|---|---|
| `router` | `Router` | 必填——router 实例 |
| `context` | `object` | 运行时注入的额外 context |
| `defaultPreload` | string | 覆盖 router 配置 |
| `defaultPendingMs` | number | 覆盖 router 配置 |
| `Wrap` | Component | 包裹整个 router 树 |
| `InnerWrap` | Component | 包裹内层 |

**示例**：

```tsx
function App() {
  const auth = useAuth()
  return (
    <RouterProvider
      router={router}
      context={{ auth }}
    />
  )
}
```

### Link 组件

路由链接组件。

**主要 props**：

| Prop | 类型 | 说明 |
|---|---|---|
| `to` | 路径模板 | 目标路径（自动推导） |
| `params` | object | 路径参数（自动推导必填字段） |
| `search` | object 或 `(prev) => object` | search params |
| `hash` | string | URL hash |
| `state` | object | History state |
| `replace` | boolean | replace 而非 push |
| `resetScroll` | boolean | 是否重置滚动（默认 true） |
| `preload` | `false \| 'intent' \| 'viewport' \| 'render'` | 覆盖全局策略 |
| `activeProps` | object 或 function | 激活时合并 props |
| `inactiveProps` | object 或 function | 非激活时合并 props |
| `activeOptions` | `{ exact, includeHash, includeSearch }` | 激活判定 |
| `from` | string | 相对导航起点 |
| `disabled` | boolean | 禁用导航 |

**示例**：

```tsx
import { Link } from '@tanstack/react-router'

// 基础
<Link to="/posts">文章</Link>

// 动态路径
<Link to="/posts/$postId" params={{ postId: '1' }}>详情</Link>

// 函数式更新 search
<Link
  from={Route.fullPath}
  search={(prev) => ({ ...prev, page: prev.page + 1 })}
>
  下一页
</Link>

// 激活样式
<Link
  to="/about"
  activeProps={{ style: { fontWeight: 'bold' } }}
  activeOptions={{ exact: true }}
>
  关于
</Link>

// 预加载
<Link to="/heavy" preload="intent">重型页面</Link>
```

### Outlet 组件

渲染子路由的占位（类似 Vue Router 的 `<RouterView>`）。

```tsx
import { Outlet } from '@tanstack/react-router'

function Layout() {
  return (
    <div>
      <header>...</header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
```

### Navigate 组件

声明式重定向。

```tsx
import { Navigate } from '@tanstack/react-router'

<Navigate to="/login" replace />
```

> 通常更推荐 `throw redirect(...)` 而非 `<Navigate>` —— 后者要在组件渲染后才触发跳转。

### ErrorComponent 组件

默认错误展示组件。

```tsx
import { ErrorComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/posts')({
  errorComponent: ErrorComponent,
})
```

或自定义：

```tsx
import type { ErrorComponentProps } from '@tanstack/react-router'

function PostError({ error, reset }: ErrorComponentProps) {
  return (
    <div>
      <h2>出错了</h2>
      <p>{error.message}</p>
      <button onClick={reset}>重试</button>
    </div>
  )
}
```

**`ErrorComponentProps`**：

| 字段 | 类型 | 说明 |
|---|---|---|
| `error` | `Error` | 错误对象 |
| `reset` | `() => void` | 重置 / 重试 |
| `info` | `{ componentStack }` | React 错误信息 |

## Hooks

### `useRouter()`

获取 router 实例。

```ts
function useRouter(): Router
```

```tsx
import { useRouter } from '@tanstack/react-router'

function MyComponent() {
  const router = useRouter()
  router.history.back() // 后退
  router.invalidate()    // 强制重新加载所有数据
}
```

> **重要**：`router.state` 不是响应式的——要响应式状态用 `useRouterState`。

### `useRouterState()`

订阅 router 状态变化（响应式）。

```ts
function useRouterState<T = RouterState>(opts?: {
  select?: (state: RouterState) => T
}): T
```

```tsx
import { useRouterState } from '@tanstack/react-router'

function NavStatus() {
  const status = useRouterState({ select: (s) => s.status })
  return <div>状态：{status}</div>
}
```

### `useNavigate()`

编程式导航。

```ts
function useNavigate(opts?: { from?: string }): NavigateFn
```

**`NavigateOptions`**：

| 字段 | 类型 | 说明 |
|---|---|---|
| `to` | 路径 | 目标路径 |
| `params` | object | 路径参数 |
| `search` | object 或 `(prev) => object` | search params |
| `hash` | string | URL hash |
| `state` | object | History state |
| `replace` | boolean | replace 而非 push |
| `from` | string | 相对起点 |
| `resetScroll` | boolean | 是否重置滚动 |
| `viewTransition` | boolean | 启用 View Transitions |

**示例**：

```tsx
import { useNavigate } from '@tanstack/react-router'

function LoginButton() {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate({
      to: '/dashboard',
      search: { tab: 'overview' },
    })}>
      进入控制台
    </button>
  )
}
```

### `useParams()`

读取路径参数。

```ts
function useParams<T>(opts?: {
  from?: string
  strict?: boolean
  shouldThrow?: boolean
  select?: (params: AllParams) => T
}): AllParams | T | undefined
```

**示例**：

```tsx
import { useParams } from '@tanstack/react-router'

// 指定 from（推荐）
const params = useParams({ from: '/posts/$postId' })
// 类型：{ postId: string }

// select 优化
const postId = useParams({
  from: '/posts/$postId',
  select: (p) => p.postId,
})

// strict: false（loose 模式）
const looseParams = useParams({ strict: false })
// 类型：Partial<AllParams>
```

或从 Route 实例：

```tsx
const { postId } = Route.useParams()
```

### `useSearch()`

读取 search params。

```ts
function useSearch<T>(opts?: {
  from?: string
  strict?: boolean
  shouldThrow?: boolean
  select?: (search: FullSearchSchema) => T
  structuralSharing?: boolean
}): FullSearchSchema | T | undefined
```

**示例**：

```tsx
import { useSearch } from '@tanstack/react-router'

const search = useSearch({ from: '/shop/products' })
// 类型从 validateSearch 自动推导

// select 优化
const page = useSearch({
  from: '/shop/products',
  select: (s) => s.page,
})
```

### `useLoaderData()`

读取 loader 返回值。

```ts
function useLoaderData<T>(opts?: {
  from?: string
  strict?: boolean
  select?: (data: TLoaderData) => T
  structuralSharing?: boolean
}): TLoaderData | T
```

**示例**：

```tsx
import { useLoaderData } from '@tanstack/react-router'

const data = useLoaderData({ from: '/posts/$postId' })
// 类型 = loader 返回值
```

或从 Route 实例：

```tsx
const data = Route.useLoaderData()
```

### `useLoaderDeps()`

读取 loader 依赖（用于调试）。

```ts
function useLoaderDeps(opts?: { from?: string; select?: Function }): TLoaderDeps
```

### `useMatch()`

读取单个路由 match 对象。

```ts
function useMatch<T>(opts: {
  from?: string
  strict?: boolean
  shouldThrow?: boolean
  select?: (match: RouteMatch) => T
}): RouteMatch | T | undefined
```

**示例**：

```tsx
import { useMatch, rootRouteId } from '@tanstack/react-router'

// 指定路由
const match = useMatch({ from: '/posts/$postId' })

// 根 match
const rootMatch = useMatch({ from: rootRouteId })

// 检查路由是否当前激活
const isActive = useMatch({ from: '/posts', shouldThrow: false }) !== undefined
```

**`RouteMatch` 主要字段**：

| 字段 | 说明 |
|---|---|
| `id` | match ID |
| `routeId` | 路由 ID |
| `params` | 路径参数 |
| `search` | search params |
| `context` | 完整 context |
| `loaderData` | loader 返回值 |
| `status` | `'pending' \| 'success' \| 'error' \| 'notFound'` |
| `error` | 错误对象（status 为 error 时） |
| `pathname` | 当前路径 |
| `fullPath` | 完整路径 |

### `useMatches()`

读取所有当前 match。

```ts
function useMatches(): RouteMatch[]
```

```tsx
import { useMatches } from '@tanstack/react-router'

function Breadcrumbs() {
  const matches = useMatches()
  return (
    <nav>
      {matches.map((match) => (
        <span key={match.id}>{match.pathname}</span>
      ))}
    </nav>
  )
}
```

### `useChildMatches()` / `useParentMatches()`

读取子 / 父 match 链。

```ts
function useChildMatches(): RouteMatch[]
function useParentMatches(): RouteMatch[]
```

### `useRouteContext()`

读取 context。

```ts
function useRouteContext<T>(opts: {
  from?: string
  select?: (ctx: RouteContext) => T
}): RouteContext | T
```

```tsx
const { queryClient, user } = useRouteContext({
  from: '/_authenticated/dashboard',
})
```

### `useLocation()`

读取当前 location（响应式）。

```ts
function useLocation<T>(opts?: {
  select?: (loc: ParsedLocation) => T
}): ParsedLocation | T
```

```tsx
const location = useLocation()
// location.pathname / location.search / location.hash / location.state
```

### `useBlocker()`

阻止导航。

```ts
function useBlocker(opts: {
  shouldBlockFn: ShouldBlockFn
  disabled?: boolean
  enableBeforeUnload?: boolean | (() => boolean)
  withResolver?: boolean
}): void | BlockerResolver
```

**示例**：

```tsx
useBlocker({
  shouldBlockFn: ({ current, next }) => {
    return isDirty && !window.confirm('确定离开吗？')
  },
})

// 或带 resolver
const blocker = useBlocker({
  shouldBlockFn: () => isDirty,
  withResolver: true,
})

if (blocker.status === 'blocked') {
  // blocker.proceed() / blocker.reset()
}
```

### `useCanGoBack()`

检查是否可后退。

```ts
function useCanGoBack(): boolean
```

```tsx
const canGoBack = useCanGoBack()
const router = useRouter()
{canGoBack && <button onClick={() => router.history.back()}>返回</button>}
```

### `useLinkProps()`

低层 API（手动构造 link props）。

```ts
function useLinkProps(options: LinkOptions): LinkPropsResult
```

用于构建自定义 Link 组件时。

### `useMatchRoute()`

测试给定路径是否匹配某个路由。

```ts
function useMatchRoute(): (opts: MatchRouteOptions) => params | false
```

```tsx
const matchRoute = useMatchRoute()
const isPostsPage = matchRoute({ to: '/posts' })
```

### `useAwaited()`

读取 `defer()` 包裹的 promise。

```ts
function useAwaited<T>(opts: { promise: Promise<T> }): [T, ...]
```

### `getRouteApi()`

获取路由 API（用于多文件复用）。

```ts
function getRouteApi(routeId: string): RouteApi
```

```tsx
import { getRouteApi } from '@tanstack/react-router'

const routeApi = getRouteApi('/posts/$postId')

function PostDetail() {
  const params = routeApi.useParams()
  const data = routeApi.useLoaderData()
  return <article>...</article>
}
```

### `rootRouteId`

根路由的 ID 常量。

```ts
const rootRouteId: '__root__'
```

```tsx
import { rootRouteId, useMatch } from '@tanstack/react-router'

const rootMatch = useMatch({ from: rootRouteId })
```

## 工具函数

### `redirect()`

抛出重定向（在 loader / beforeLoad 中用）。

```ts
function redirect(opts: RedirectOptions): never
```

**选项**：

| 字段 | 类型 | 说明 |
|---|---|---|
| `to` | 路径 | 目标路径 |
| `params` | object | 路径参数 |
| `search` | object | search params |
| `hash` | string | URL hash |
| `replace` | boolean | replace 而非 push |
| `code` | number | HTTP 状态码（SSR） |
| `throw` | boolean | 是否抛错（默认 true） |
| `headers` | object | HTTP headers（SSR） |

**示例**：

```ts
import { redirect } from '@tanstack/react-router'

beforeLoad: ({ location }) => {
  if (!isAuth()) {
    throw redirect({
      to: '/login',
      search: { redirect: location.href },
    })
  }
}
```

### `notFound()`

抛出 404（触发 `notFoundComponent`）。

```ts
function notFound(opts?: {
  routeId?: string
  throw?: boolean
  data?: any
}): NotFoundError
```

**示例**：

```ts
import { notFound } from '@tanstack/react-router'

loader: async ({ params }) => {
  const post = await getPost(params.postId)
  if (!post) throw notFound()
  return post
}

// 指定父路由处理
throw notFound({ routeId: '/_pathlessLayout' })
```

### `isRedirect()` / `isNotFound()`

判断错误类型。

```ts
function isRedirect(error: unknown): error is RedirectError
function isNotFound(error: unknown): error is NotFoundError
```

```tsx
errorComponent: ({ error }) => {
  if (isNotFound(error)) return <div>未找到</div>
  return <div>错误：{error.message}</div>
}
```

## Vite 插件配置

### `tanstackRouter()` 选项

```ts
import { tanstackRouter } from '@tanstack/router-plugin/vite'

tanstackRouter({
  target: 'react',                              // 'react' | 'solid'，必填
  routesDirectory: './src/routes',              // 路由目录
  generatedRouteTree: './src/routeTree.gen.ts', // 生成文件路径
  autoCodeSplitting: true,                      // 自动 code splitting（默认 true）
  routeFileIgnorePrefix: '-',                   // 排除的文件前缀
  routeFileIgnorePattern: undefined,            // 排除的正则
  quoteStyle: 'single',                         // 'single' | 'double'
  semicolons: false,                            // 是否带分号
  apiBase: '/api',                              // API 路由前缀（用于 TanStack Start）
  disableTypes: false,                          // 禁用类型生成
  addExtensions: false,                         // 文件扩展名
  enableRouteTreeFormatting: true,              // 启用 prettier 格式化
  virtualRouteConfig: undefined,                // 虚拟路由配置文件
})
```

| 选项 | 默认 | 说明 |
|---|---|---|
| `target` | 必填 | `'react'` / `'solid'` |
| `routesDirectory` | `'./src/routes'` | 扫描的路由目录 |
| `generatedRouteTree` | `'./src/routeTree.gen.ts'` | 生成的路由树文件 |
| `autoCodeSplitting` | `true` | 自动分包路由 component |
| `routeFileIgnorePrefix` | `'-'` | 此前缀的文件不视为路由 |
| `routeFileIgnorePattern` | — | 排除的文件正则 |
| `quoteStyle` | `'single'` | 生成代码引号 |
| `semicolons` | `false` | 是否带分号 |
| `disableTypes` | `false` | 跳过类型生成（不推荐） |
| `enableRouteTreeFormatting` | `true` | 格式化生成代码 |
| `virtualRouteConfig` | — | 虚拟路由配置文件路径 |

### Webpack / Rspack / esbuild 插件

```ts
// webpack
import { tanstackRouter } from '@tanstack/router-plugin/webpack'

// rspack
import { tanstackRouter } from '@tanstack/router-plugin/rspack'

// esbuild
import { tanstackRouter } from '@tanstack/router-plugin/esbuild'
```

选项与 Vite 插件一致。

## CLI（`@tanstack/router-cli`）

不用 Vite 插件时备选——手动生成 routeTree。

```bash
# 安装
pnpm add -D @tanstack/router-cli

# 生成一次
npx tsr generate

# 监听模式
npx tsr watch
```

`tsr.config.json` 配置：

```json
{
  "routesDirectory": "./src/routes",
  "generatedRouteTree": "./src/routeTree.gen.ts",
  "autoCodeSplitting": true,
  "quoteStyle": "single",
  "semicolons": false
}
```

## TypeScript 类型扩展

### `Register` 接口

注册路由树类型（**必需**）。

```ts
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
```

注册后所有 `<Link>` / `useNavigate` / hooks 自动推导路由树。

### `FileRoutesByPath`

文件路由路径到 Route 的映射（插件生成）。

```ts
import type { FileRoutesByPath } from '@tanstack/react-router'

type PostRoute = FileRoutesByPath['/posts/$postId']
```

### `AnyRoute` / `AnyContext`

通用类型——库内部 / 第三方扩展用。

```ts
import type { AnyRoute, AnyContext } from '@tanstack/react-router'

function processRoute(route: AnyRoute<AnyContext>) {
  // ...
}
```

## 文件命名约定速查

| 文件 / 目录 | URL | 说明 |
|---|---|---|
| `__root.tsx` | （根） | 根路由（必需） |
| `index.tsx` | `/` | 父的 index |
| `about.tsx` | `/about` | 静态 |
| `posts.tsx` | `/posts` | layout |
| `posts.index.tsx` 或 `posts/index.tsx` | `/posts` | index |
| `posts.$postId.tsx` 或 `posts/$postId.tsx` | `/posts/:postId` | 动态参数 |
| `$.tsx` 或 `xxx.$.tsx` | `/*` | splat（参数 `_splat`） |
| `_layout.tsx` | （pathless） | pathless layout |
| `(group)/` 目录 | （pathless） | pathless group |
| `posts.route.tsx` 或 `posts/route.tsx` | `/posts` | 等价 `posts.tsx` |
| `posts.$postId.lazy.tsx` | `/posts/:postId` | 懒加载组件 |
| `-component.tsx` | （排除） | 不视为路由 |

## RouteOptions 完整字段

```ts
interface RouteOptions {
  // ===== 基础 =====
  getParentRoute: () => AnyRoute  // Code-based 必填
  path?: string
  id?: string
  caseSensitive?: boolean

  // ===== 组件 =====
  component?: Component
  pendingComponent?: Component
  errorComponent?: Component
  notFoundComponent?: Component

  // ===== 数据 =====
  loader?: (ctx: LoaderContext) => Promise<any> | any
  beforeLoad?: (ctx: BeforeLoadContext) => Promise<any> | any
  loaderDeps?: (ctx: LoaderDepsContext) => Record<string, any>
  validateSearch?: (search: Record<string, unknown>) => any
  staticData?: any

  // ===== 缓存 =====
  staleTime?: number
  preloadStaleTime?: number
  gcTime?: number
  shouldReload?: boolean | ((ctx: ShouldReloadContext) => boolean)
  preload?: boolean | 'intent' | 'viewport' | 'render'

  // ===== Pending UI =====
  pendingMs?: number
  pendingMinMs?: number

  // ===== Params =====
  parseParams?: (params: Record<string, string>) => any
  stringifyParams?: (params: any) => Record<string, string>

  // ===== 元数据 =====
  meta?: () => Array<{ title?: string; meta?: any; link?: any; script?: any }>
  head?: (ctx) => HeadConfig
  scripts?: any[]
}
```

## 完整示例 —— 复杂应用骨架

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000 },
  },
})

const router = createRouter({
  routeTree,
  context: { queryClient, auth: undefined! },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  defaultPendingMs: 1000,
  defaultPendingMinMs: 500,
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function App() {
  const auth = useAuth() // 你的 auth hook
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} context={{ auth }} />
    </QueryClientProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

```tsx
// src/routes/__root.tsx
import { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

interface MyRouterContext {
  queryClient: QueryClient
  auth: { isAuthenticated: boolean; user?: { id: string; name: string } }
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
})
```

```tsx
// src/routes/_authenticated.tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
    return { user: context.auth.user! }
  },
  component: () => <Outlet />,
})
```

```tsx
// src/routes/_authenticated/posts.$postId.tsx
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { z } from 'zod'

const postQueryOptions = (postId: string) =>
  queryOptions({
    queryKey: ['post', postId],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${postId}`)
      if (!res.ok) throw new Error('Network error')
      const data = await res.json()
      if (!data) throw notFound()
      return data
    },
  })

export const Route = createFileRoute('/_authenticated/posts/$postId')({
  validateSearch: z.object({
    view: z.enum(['preview', 'edit']).catch('preview'),
  }),
  loaderDeps: ({ search }) => ({ view: search.view }),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(postQueryOptions(params.postId)),
  component: PostDetail,
})

function PostDetail() {
  const { postId } = Route.useParams()
  const { view } = Route.useSearch()
  const { data: post } = useSuspenseQuery(postQueryOptions(postId))
  return (
    <article>
      <h1>{post.title}</h1>
      {view === 'edit' ? <Editor post={post} /> : <Preview post={post} />}
    </article>
  )
}
```

## 相关资源

- [TanStack Router 官网](https://tanstack.com/router) —— 完整文档
- [Routing Concepts](https://tanstack.com/router/v1/docs/routing/routing-concepts) —— 路由概念
- [File-Based Routing](https://tanstack.com/router/v1/docs/routing/file-based-routing) —— 文件路由完整指南
- [API Reference](https://tanstack.com/router/v1/docs/api/router) —— 完整 API 速查
- [Examples](https://tanstack.com/router/v1/docs/framework/react/examples) —— 官方示例库
- [TanStack/router GitHub](https://github.com/TanStack/router) —— 源码 / Issues
- [TanStack Discord](https://discord.com/invite/WrRKjPJ) —— 社区
