---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **Remix v2**（`@remix-run/*`；官网 [remix.run](https://remix.run/)，文档现重定向到 [v2.remix.run](https://v2.remix.run/docs)）。**新项目官方建议直接用 React Router v7**（Remix 框架能力的延续）。

## 速查

- 定位：**全栈 React Web 框架**——Web 标准、嵌套路由、SSR、渐进增强；Shopify 维护
- **版本现状（必记）**：Remix v2 = 最后独立版；原计划 Remix v3 → 以 **React Router v7** 发布（2024-11-22 稳定）；Remix 3 = 全新去 React 的 Preact 重构（2026 Beta）
- 路由模块导出：`loader`（服务端数据）/ `action`（服务端变更）/ `default` / `ErrorBoundary` / `meta` / `links` / `headers`
- 读数据：`useLoaderData()`；变更：`<Form method="post">` + `action` + `useActionData()`
- 无导航交互：`useFetcher()`；pending UI：`useNavigation()`
- 构建：`@remix-run/dev` 的 Vite 插件（`vitePlugin as remix`）
- 升级到 RR7：`npx codemod remix/2/react-router/upgrade`（导入从 `@remix-run/*` 换 `react-router`）

## Remix 是什么

Remix 是 **Ryan Florence 与 Michael Jackson** 创建、**Shopify** 维护的**全栈 React Web 框架**，一句话定位：「**拥抱 Web 标准、用 `loader`/`action` 数据模型 + 嵌套路由 + 渐进增强构建全栈 React 应用**」。

```tsx
// 一个路由模块：loader（服务端取数）+ 组件（渲染）
import { json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'

export async function loader() {
  return json({ user: await getUser() }) // 仅服务端运行
}

export default function Profile() {
  const { user } = useLoaderData<typeof loader>() // 类型安全
  return <h1>你好，{user.name}</h1>
}
```

### ⚠️ Remix 与 React Router v7 的收敛关系（最高频考点）

这是 2026 年关于 Remix 最容易答错、也最常考的点，务必分清**三个不同的东西**：

| 名称 | 是什么 | 关键事实 |
|---|---|---|
| **Remix v2** | Remix 框架的**最后一个独立主版本** | 官方建议升级到 React Router v7 |
| **「原计划的 Remix v3」** | **就是 React Router v7** | RR7 稳定于 **2024-11-22**，把 Remix 能力并入「Framework Mode」（RR7 = v6 + Remix） |
| **Remix 3** | **全新、去 React（基于 Preact）的重构** | 2025-05-28「Wake up, Remix!」公布，2026-04-30 Beta，用 Web 原语而非 Hooks，**不是 v2 升级路径** |

> **错法警示**：把「Remix v3」说成「基于 React Router 的薄包装」是错的（它直接以 RR7 名义发布）；把「Remix 3」当成用 React/Hooks 的 v2 升级也是错的（它去掉了 React）。

### 与 Next.js 的区别

| 维度 | Remix（→ RR7） | Next.js |
|---|---|---|
| 数据模型 | **`loader` / `action` + 嵌套路由** | App Router + RSC |
| 哲学 | **Web 标准、渐进增强（表单无 JS 可用）** | React 优先、RSC 优先 |
| 路由 | 嵌套路由 + 并行 loader | 文件路由 + RSC |
| 部署 | handler 嵌入多运行时 | Vercel 一体化为主 |

**含义**：偏好 Web 标准、渐进增强、清晰 loader/action 数据流选 Remix（RR7）；要 RSC + Vercel 一体化生态选 Next.js。

## 路由模块导出

Remix 的核心是**路由模块约定**——一个路由文件按需导出这些：

```tsx
export async function loader({ params, request }) {}   // 服务端：GET 数据加载
export async function action({ request }) {}            // 服务端：非 GET 变更（在 loaders 前跑）
export default function Route() {}                       // 路由组件
export function ErrorBoundary() {}                       // 路由级错误边界
export const meta = () => [...]                          // SEO meta
export const links = () => [...]                         // <link> 样式/预加载
export const headers = () => ({})                        // HTTP 响应头
// 还有 clientLoader / clientAction（浏览器端）/ HydrateFallback / shouldRevalidate / handle
```

> `loader` / `action` / `headers` **仅在服务端运行**；`clientLoader` / `clientAction` 在浏览器运行。

## 第一个 loader（读数据）

```tsx
import { json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'

export async function loader({ params }: LoaderFunctionArgs) {
  const invoice = await db.invoice.find(params.id)
  if (!invoice) throw json('Not Found', { status: 404 }) // 抛出进 ErrorBoundary
  return json({ invoice })
}

export default function Invoice() {
  const { invoice } = useLoaderData<typeof loader>()
  return <div>{invoice.total}</div>
}
```

> 嵌套路由的多个 loader **并行加载**（不是瀑布）；数据经 JSON 序列化。

## 第一个 action + Form（变更）

```tsx
import { redirect } from '@remix-run/node'
import { Form } from '@remix-run/react'

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData()
  const todo = await createTodo({ title: form.get('title') })
  return redirect(`/todos/${todo.id}`) // 重定向（也可 throw）
}

export default function New() {
  // <Form> 渐进增强：无 JS 也能提交；JS 加载后变 SPA 体验
  return (
    <Form method="post">
      <input name="title" />
      <button type="submit">创建</button>
    </Form>
  )
}
```

> `action` 在 loaders **之前**运行，完成后 loaders **自动重新校验**；一次提交**只跑一个 action**（最深匹配路由）；`<Form>` 原生只支持 GET + POST。

## Vite 插件

```ts
// vite.config.ts（v2 起用 Vite，Classic Compiler 已弃用）
import { vitePlugin as remix } from '@remix-run/dev'
import { defineConfig } from 'vite'

export default defineConfig({ plugins: [remix()] })
```

## 升级到 React Router v7

```bash
# v2 → RR7：先开 v2 future flags（v3_singleFetch 等），再跑 codemod
npx codemod remix/2/react-router/upgrade
# 导入从 @remix-run/* 换成 react-router；RemixBrowser → HydratedRouter
```

## 下一步

- [指南](./guide-line.md)：**路由与数据加载**（嵌套路由 `<Outlet>` / 并行 loader / `useLoaderData`·`useRouteLoaderData` / `json`·`data`·`redirect`） / **变更与表单**（`action` / `<Form>` / `useFetcher` / `useNavigation` / 乐观 UI） / **渲染与数据流**（`defer`+`<Await>` 流式 / `ErrorBoundary` / `meta`·`links`·`headers` / `.server`·`.client`） / **生态与部署**（运行时·adapter / cookies·sessions / **Remix↔RR7↔Remix 3 三者关系**） / **常见坑**
