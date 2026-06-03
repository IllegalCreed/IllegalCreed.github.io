---
layout: doc
outline: [2, 3]
---

# 指南

> 本篇深入 Remix v2 的路由数据加载、变更表单、渲染数据流、生态部署，并强调与 React Router v7 的收敛关系。v2 的 API 在 RR7 Framework Mode 同名同义，仅从 `react-router` 导入。

## 路由与数据加载

### 嵌套路由 + 并行 loader

```tsx
// 父路由：用 <Outlet/> 渲染匹配的子路由；父子 loader 并行加载（非瀑布）
import { Outlet } from '@remix-run/react'
export default function Parent() {
  return <div><h1>布局</h1><Outlet /></div>
}
```

### loader（服务端数据加载）

```tsx
export async function loader({ params, request, context }: LoaderFunctionArgs) {
  // 仅服务端运行；request 是标准 Request；返回 json/data/原始值
  return json({ data: await fetchData(params.id) })
}
```

- `useLoaderData<typeof loader>()` 读**当前路由**的 loader 数据（类型安全）
- `useRouteLoaderData(routeId)` 读**其它路由**的 loader 数据
- `json()` / `data()`（设状态码/headers 不用包 Response）/ `redirect()`（可 `return` 或 `throw`）
- 数据经 **JSON 序列化**

> ⚠️ **RR7 Single Fetch 下 `json()` / `defer()` 已弃用**：改用普通对象返回、`data()` 设状态/头、原始 Promise 流式（都从 `react-router` 导入）。Remix v2 仍用 `json`/`defer`。

## 变更与表单

### action + Form（渐进增强）

```tsx
export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData()      // 服务端；非 GET；在 loaders 前运行
  return redirect('/done')
}
// <Form method="post"> 原生表单提交，无 JS 也工作；JS 加载后拦截为客户端导航
```

- `useActionData<typeof action>()` 读 action 返回（如校验错误）
- action 完成后 loaders **自动重新校验**；一次提交**只跑一个 action**（最深路由，index 路由用父级）
- `<Form>` 原生只支持 `GET` + `POST`

### useFetcher（不导航的交互）

```tsx
const fetcher = useFetcher()
// fetcher.Form / fetcher.submit() / fetcher.load() —— 不改 URL、不导航
// fetcher.state（idle/submitting/loading）/ fetcher.data / fetcher.formData
fetcher.submit({ liked: 'true' }, { method: 'post', action: '/like' })
```

> `useFetcher` 适合**点赞、加购、自动保存**等不希望导航的服务端交互。

### useNavigation / useSubmit（pending UI 与命令式提交）

```tsx
const navigation = useNavigation()
// navigation.state: 'idle' | 'loading' | 'submitting' —— 做全局/局部 pending UI
const busy = navigation.state === 'submitting'

const submit = useSubmit()  // 命令式提交（如表单 onChange 自动提交）
```

> 乐观 UI：用 `navigation.formData` 或 `fetcher.formData` 在请求完成前先渲染预期结果。

## 渲染与数据流

### 流式渲染 defer + Await

```tsx
import { defer } from '@remix-run/node'
import { Await } from '@remix-run/react'

export async function loader({ params }) {
  const critical = await getProduct(params.id) // 关键数据先 await
  const reviews = getReviews(params.id)         // 次要数据不 await，流式
  return defer({ critical, reviews })
}
// 组件里：<Suspense fallback={...}><Await resolve={reviews}>{(r) => ...}</Await></Suspense>
```

> ⚠️ **版本差异**：Remix v2 用 `defer({...})` 包装未 await 的 Promise；**React Router v7 改为直接从 loader 返回原始 Promise**（返回值须是带 key 的对象），不再需要 `defer()`。

### ErrorBoundary（路由级错误边界）

```tsx
import { useRouteError, isRouteErrorResponse } from '@remix-run/react'
export function ErrorBoundary() {
  const error = useRouteError()
  if (isRouteErrorResponse(error)) return <p>{error.status} {error.statusText}</p>
  return <p>{error instanceof Error ? error.message : '未知错误'}</p>
}
```

- 捕获**本路由组件 / loader / action** 中的错误；就近兜底、不整页崩
- 两类错误：主动 `throw` 的 Response（`isRouteErrorResponse` 为真）/ 普通异常
- v2 起 **CatchBoundary 已并入 ErrorBoundary**

### meta / links / headers + 模块分离

```tsx
export const meta: MetaFunction<typeof loader> = ({ data }) => [{ title: data?.title }]
export const links: LinksFunction = () => [{ rel: 'stylesheet', href: styles }]
export const headers: HeadersFunction = ({ loaderHeaders, parentHeaders }) => ({ 'Cache-Control': 'max-age=300' })
```

- `meta` 子路由**不自动合并**父级（用 `matches` 手动处理）；`headers` **最深路由优先**
- `.server.ts` / `.client.ts`：显式标记整个模块只在服务端 / 客户端运行（防服务端代码泄漏到客户端 bundle）

## 生态与部署

- **Vite 插件**：`import { vitePlugin as remix } from '@remix-run/dev'`（v2 默认，Classic Compiler 已弃用）
- **不是 HTTP 服务器**：Remix 是「嵌在现有服务器里的 handler」——多运行时（Node / Cloudflare Workers / Deno）+ adapters
- **cookies**：`createCookie(name, options)`（`secrets` 签名、`maxAge` 等）
- **sessions**：`createCookieSessionStorage` / `createSessionStorage` 等，返回 `{ getSession, commitSession, destroySession }`
- **React Router v7 三种模式**：Declarative（基础路由）/ Data（带 loader/action 的数据路由）/ **Framework（= 原 Remix 框架能力）**

## 常见坑

- **版本三者别混**（头号坑）：`Remix v2`（最后独立）/「原计划 Remix v3 = **React Router v7**」/「**Remix 3** = 全新去 React 的 Preact 重构」
- **新项目用 RR7**：standalone Remix 停在 v2，官方建议升级到 React Router v7
- **RR7 弃用 `json()` / `defer()`**：Single Fetch 下用普通对象、`data()`、原始 Promise；v2 仍用 json/defer
- **loader/action/headers 服务端专用**：客户端用 `clientLoader`/`clientAction`；用 `.server`/`.client` 分离
- **嵌套 loader 并行加载**（非瀑布）；**一次提交一个 action**（最深路由）
- **`<Form>` 原生只 GET+POST**；`useFetcher` 不导航不改 URL
- **`useLoaderData` 只读当前路由**：读别的路由用 `useRouteLoaderData`
- **meta 子路由不自动合并父级**：用 `matches` 处理
- **Remix 不是 HTTP 服务器**：需 adapter 嵌入运行时
