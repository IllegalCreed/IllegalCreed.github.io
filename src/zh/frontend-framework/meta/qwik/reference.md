---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Qwik 1.x（`@builder.io/qwik` / `@builder.io/qwik-city`）—— API 速查 / 文件约定 / 配置选项 / 命名约定 / 与同类对比

## 包结构

| 包 | 用途 | 必需 |
|---|---|---|
| `@builder.io/qwik` | 核心 runtime（JSX + Resumability + Optimizer） | **是** |
| `@builder.io/qwik/server` | 服务端渲染（`renderToString` / `renderToStream`） | SSR 时 |
| `@builder.io/qwik/optimizer` | Vite/Rollup plugin（编译时 `$` 拆分） | **是** |
| `@builder.io/qwik/build` | 构建时常量（`isServer` / `isDev` / `isBrowser`） | 常用 |
| `@builder.io/qwik-city` | 元框架（路由 + loaders + actions + middleware） | 几乎必需 |
| `@builder.io/qwik-city/vite` | Vite plugin（路由扫描） | **是** |
| `@builder.io/qwik-city/middleware/*` | 各 adapter 的请求适配器 | 部署时 |
| `@builder.io/qwik-city/adapters/*` | 各 adapter 的 Vite 配置工厂 | 部署时 |
| `@unpic/qwik` | 图片优化（CDN 集成） | 可选 |
| `qwik-image` | 自定义 image loader | 可选 |
| `styled-vanilla-extract` | CSS-in-JS（零运行时） | 可选 |
| `@modular-forms/qwik` | 复杂表单库 | 可选 |
| `valibot` / `zod` | 校验库（配 `validator$` / `zod$`） | 可选 |

## Qwik 核心 API（`@builder.io/qwik`）

### 组件

```ts
// 定义 lazy-loaded 组件
component$<T>(onMount: (props: T) => JSXNode): Component<T>

// 内联组件（不 lazy load）
const InlineComp = (props) => <div>{props.x}</div>
```

```tsx
import { component$ } from '@builder.io/qwik'

export const Button = component$<{ label: string }>(({ label }) => {
  return <button>{label}</button>
})
```

### Signals & Stores

| API | 签名 | 说明 |
|---|---|---|
| `useSignal` | `useSignal<T>(initial?: T): Signal<T>` | 创建响应式单值 |
| `useStore` | `useStore<T>(state: T, options?: { deep?: boolean, reactive?: boolean }): T` | 创建响应式对象（默认深响应） |
| `useComputed$` | `useComputed$<T>(fn: () => T): ReadonlySignal<T>` | 同步派生值 |
| `useConstant` | `useConstant<T>(value: T \| (() => T)): T` | 持久化常量（跨 render 稳定） |

```tsx
import { useSignal, useStore, useComputed$ } from '@builder.io/qwik'

const count = useSignal(0)            // Signal<number>
const user = useStore({ name: 'A' })  // 直接属性访问
const double = useComputed$(() => count.value * 2)  // ReadonlySignal<number>
```

### Tasks（生命周期）

| API | 签名 | 何时运行 |
|---|---|---|
| `useTask$` | `useTask$(fn: (ctx: TaskCtx) => void \| Promise<void>): void` | 渲染前（server + client） |
| `useVisibleTask$` | `useVisibleTask$(fn, options?: { strategy }): void` | 客户端，组件可见时 |
| `useResource$` | `useResource$<T>(fn: (ctx) => Promise<T>): ResourceReturn<T>` | 异步数据 + 状态 |

```tsx
import { useTask$, useVisibleTask$, useResource$ } from '@builder.io/qwik'

useTask$(async ({ track, cleanup }) => {
  const value = track(() => signal.value)
  cleanup(() => console.log('cleanup'))
})

useVisibleTask$(
  ({ cleanup }) => { /* DOM 操作 */ },
  { strategy: 'intersection-observer' }
)

const data = useResource$<Data>(async ({ track, cleanup }) => {
  const id = track(() => idSignal.value)
  const ctrl = new AbortController()
  cleanup(() => ctrl.abort())
  return await fetch(`/api/${id}`, { signal: ctrl.signal }).then(r => r.json())
})
```

### Context

| API | 签名 | 说明 |
|---|---|---|
| `createContextId` | `createContextId<T>(name: string): ContextId<T>` | 创建 context 标识 |
| `useContextProvider` | `useContextProvider<T>(ctx: ContextId<T>, value: T): void` | 在组件内提供 context |
| `useContext` | `useContext<T>(ctx: ContextId<T>): T` | 消费 context |

```tsx
import { createContextId, useContext, useContextProvider } from '@builder.io/qwik'

export const ThemeId = createContextId<Signal<string>>('app.theme')

// Provider
const theme = useSignal('dark')
useContextProvider(ThemeId, theme)

// Consumer
const theme = useContext(ThemeId)
```

### 样式

| API | 签名 | 说明 |
|---|---|---|
| `useStyles$` | `useStyles$(styles: string): void` | 全局样式 |
| `useStylesScoped$` | `useStylesScoped$(styles: string): { scopeId }` | 组件作用域样式 |

```tsx
import styles from './card.css?inline'

useStyles$(styles)
useStylesScoped$(`.card { padding: 1rem; }`)
```

### 事件 Hooks

| API | 签名 | 说明 |
|---|---|---|
| `useOn` | `useOn(event: string, qrl: QRL<...>): void` | 给当前组件加事件监听 |
| `useOnDocument` | `useOnDocument(event: string, qrl): void` | document 事件 |
| `useOnWindow` | `useOnWindow(event: string, qrl): void` | window 事件 |

```tsx
import { useOnDocument, $ } from '@builder.io/qwik'

useOnDocument('mousemove', $((e: MouseEvent) => {
  console.log(e.clientX, e.clientY)
}))
```

### 序列化

| API | 签名 | 说明 |
|---|---|---|
| `$` | `$<T>(fn: T): QRL<T>` | 把函数包装成 QRL（lazy reference） |
| `noSerialize` | `noSerialize<T>(value: T): NoSerialize<T>` | 标记值不参与序列化 |
| `useLexicalScope` | `useLexicalScope<T>(): T` | 在 QRL 内部访问闭包（Optimizer 生成代码用） |

```tsx
import { $, noSerialize, type NoSerialize } from '@builder.io/qwik'

const handler = $(() => console.log('lazy'))
const store = useStore<{ x: NoSerialize<MyClass> | undefined }>({ x: undefined })
```

### 内置组件

| 组件 | 用途 |
|---|---|
| `<Slot />` | 内容投影槽 |
| `<Slot name="x" />` | 命名 slot |
| `<Fragment />` 或 `<>` | 多元素包装 |
| `<Resource value={r} onPending onRejected onResolved />` | useResource$ 三态渲染 |
| `<SSRStream>` | 流式 SSR |

### 其他工具

| API | 用途 |
|---|---|
| `useId()` | 生成跨服务器/客户端一致的唯一 ID |
| `useErrorBoundary()` | 错误边界 |
| `event$` / `eventQrl$` | 显式标记事件 QRL |
| `sync$` | 同步事件处理（用于 preventDefault） |
| `implicit$FirstArg` | 把函数的第一参数自动 `$` 包装（库作者用） |
| `untrack` | 在 task 内不追踪某段代码 |

## `@builder.io/qwik/build`：构建时常量

```ts
import { isServer, isBrowser, isDev } from '@builder.io/qwik/build'

if (isServer) {
  // 编译时这块代码只保留在服务端 bundle
}
if (isBrowser) {
  // 仅客户端
}
if (isDev) {
  // 仅开发模式
}
```

> **关键特性**：这些常量是**编译时**条件——`if (isServer)` 块会被 dead code elimination 完全移除，不增加 client bundle。

## Qwik City API（`@builder.io/qwik-city`）

### 路由 Hooks

| API | 签名 | 说明 |
|---|---|---|
| `useLocation` | `useLocation(): RouteLocation` | 当前 URL / params / 等 |
| `useNavigate` | `useNavigate(): NavigationFn` | 编程式导航 |
| `useContent` | `useContent(): { headings, menu }` | 当前页面的内容元数据 |
| `useDocumentHead` | `useDocumentHead(): DocumentHead` | 当前页面 head meta |

```tsx
import { useLocation, useNavigate } from '@builder.io/qwik-city'

const loc = useLocation()
// loc.url, loc.params, loc.pathname, loc.search, loc.isNavigating

const nav = useNavigate()
nav('/about')                   // 跳转
nav('/about', { replaceState: true })  // 替换 history
nav()                           // 刷新当前页
```

### 数据加载

| API | 签名 | 说明 |
|---|---|---|
| `routeLoader$` | `routeLoader$<T>(fn: (ev: RequestEvent) => T \| Promise<T>): RouteLoader<T>` | 路由数据加载 |
| `routeAction$` | `routeAction$<T, I>(fn, validator?): Action<T, I>` | 路由副作用 |
| `globalAction$` | `globalAction$(...)` | 跨路由 action |
| `server$` | `server$<T>(fn: function): T` | RPC 风格远程调用 |
| `validator$` | `validator$(fn): Validator` | 自定义校验器 |
| `zod$` | `zod$(schema)` 或 `zod$((z, ev) => schema)` | Zod 校验器 |

```tsx
import { routeLoader$, routeAction$, server$, zod$, z } from '@builder.io/qwik-city'

export const useUser = routeLoader$(async ({ cookie }) => {
  return await db.user.fromSession(cookie.get('s')?.value)
})

export const useSaveUser = routeAction$(
  async (data, ev) => { /* ... */ },
  zod$({
    name: z.string().min(1),
    email: z.string().email(),
  })
)

export const greet = server$(function (name: string) {
  return `Hello ${name}, your IP: ${this.headers.get('x-forwarded-for')}`
})
```

### 内置组件

| 组件 | 用途 |
|---|---|
| `<QwikCityProvider>` | 应用根（注入路由 context） |
| `<RouterOutlet />` | 渲染当前路由 |
| `<Link href prefetch reload>` | SPA 链接（自动 prefetch） |
| `<Form action={...} spaReset onSubmitCompleted$>` | 表单（含无 JS 支持） |
| `<ServiceWorkerRegister />` | 注册 PWA |
| `<QwikCityMockProvider>` | 测试用 mock provider |

```tsx
<Link href="/about" prefetch>About</Link>
<Link href="/refresh" reload>Reload</Link>

<Form action={action} spaReset onSubmitCompleted$={() => console.log('done')}>
  ...
</Form>
```

### Middleware 类型

```ts
type RequestHandler = (ev: RequestEvent) => Promise<void> | void

// 在 layout.tsx / index.tsx 中导出
export const onRequest: RequestHandler = async (ev) => { /* 所有 */ }
export const onGet: RequestHandler = async (ev) => { /* GET */ }
export const onPost: RequestHandler = async (ev) => { /* POST */ }
export const onPut: RequestHandler = async (ev) => { /* PUT */ }
export const onPatch: RequestHandler = async (ev) => { /* PATCH */ }
export const onDelete: RequestHandler = async (ev) => { /* DELETE */ }
```

### RequestEvent 接口

```ts
interface RequestEvent {
  // 路径 / 方法
  url: URL
  pathname: string
  basePathname: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD'
  query: URLSearchParams
  params: Record<string, string>
  request: Request

  // 响应控制
  status(code?: number): number
  headers: Headers
  cacheControl(control: CacheControl): void
  cookie: Cookie
  send(response: Response): void
  send(status: number, body: string | Uint8Array | ReadableStream): void
  json(status: number, data: unknown): void
  html(status: number, html: string): void
  text(status: number, text: string): void
  redirect(status: number, url: string): RedirectMessage  // throw 来重定向
  error(status: number, message: string): ErrorResponse   // throw 来报错
  fail(status: number, data: T): FailReturn<T>            // return 失败响应

  // 上下文
  sharedMap: Map<string, unknown>
  env: EnvGetter      // env.get(key)
  platform: unknown   // 平台特定 API（CF Workers / Vercel / 等）
  locale(locale?: string): string

  // 流程控制
  next(): Promise<void>           // 调用下一个 middleware
  exit(): never                   // 跳过后续处理
  resolveValue<T>(loader: T): Promise<T>  // 等待其他 loader

  // 输入解析
  parseBody(): Promise<unknown>
  getWritableStream(): WritableStream
}
```

## DocumentHead 类型

```ts
type DocumentHead = DocumentHeadValue | ((ev: DocumentHeadProps) => DocumentHeadValue)

interface DocumentHeadValue {
  title?: string
  meta?: DocumentMeta[]
  links?: DocumentLink[]
  styles?: DocumentStyle[]
  scripts?: DocumentScript[]
  frontmatter?: Record<string, unknown>
}
```

```tsx
// 静态
export const head: DocumentHead = {
  title: 'About',
  meta: [
    { name: 'description', content: 'About page' },
    { property: 'og:title', content: 'About' },
  ],
  links: [
    { rel: 'canonical', href: 'https://example.com/about' },
  ],
}

// 动态（基于 loader）
export const head: DocumentHead = ({ resolveValue, params }) => {
  const product = resolveValue(useProduct)
  return {
    title: `Buy ${product.name}`,
    meta: [
      { name: 'description', content: product.description },
    ],
  }
}
```

## 文件约定

### 路由文件

| 文件 | 路径 | 含义 |
|---|---|---|
| `src/routes/index.tsx` | `/` | 首页 |
| `src/routes/about/index.tsx` | `/about` | 静态路由 |
| `src/routes/blog/[slug]/index.tsx` | `/blog/:slug` | 动态段 |
| `src/routes/docs/[...rest]/index.tsx` | `/docs/*` | 捕获所有 |
| `src/routes/(marketing)/index.tsx` | `/` | 分组（括号目录不映射 URL） |
| `src/routes/layout.tsx` | - | 根 layout |
| `src/routes/admin/layout.tsx` | - | 嵌套 layout（仅 /admin/*） |
| `src/routes/api/posts/index.ts` | `/api/posts` | API endpoint（无 default export） |
| `src/routes/404.tsx` | - | 404 页面 |
| `src/routes/500.tsx` | - | 500 错误页面 |
| `src/routes/sitemap.xml/index.ts` | `/sitemap.xml` | 自定义响应 |

### 入口文件

| 文件 | 用途 |
|---|---|
| `src/root.tsx` | 应用根（含 `<html>` / `<head>` / `<body>`） |
| `src/entry.ssr.tsx` | SSR 渲染入口（被 adapter 调用） |
| `src/entry.dev.tsx` | 开发模式入口 |
| `src/entry.preview.tsx` | 本地预览入口 |
| `src/entry.{adapter}.tsx` | 各 adapter 的运行时入口 |
| `src/global.css` | 全局样式 |
| `src/plugin@*.ts` | 全局 middleware（在所有 layout 之前） |

### 配置文件

| 文件 | 用途 |
|---|---|
| `vite.config.ts` | 主 Vite 配置 |
| `adapters/{name}/vite.config.ts` | 各 adapter 的 Vite 配置 |
| `tsconfig.json` | TypeScript 配置 |
| `tailwind.config.js` | Tailwind 配置（v3）/ v4 直接在 CSS 内 |
| `package.json` | 含 scripts: `start` / `build` / `preview` / `qwik` |

## Optimizer 行为

### `$` 后缀的位置

| 类型 | 示例 | 自动 QRL 化 |
|---|---|---|
| API 名以 `$` 结尾 | `component$(fn)` / `$(fn)` | 第一参数 |
| JSX 事件属性以 `$` 结尾 | `<button onClick$={fn}>` | 属性值 |
| Props 类型 `QRL<T>` | `onClick$: QRL<...>` | 自动包装 |

### 闭包变量规则

| 变量类型 | 跨 `$` 边界 |
|---|---|
| `const` + 可序列化 | ✅ |
| `let` / `var` | ❌ |
| `const` + class 实例 | ❌（用 `noSerialize`） |
| `const` + function | ❌（用 `$()` 包装） |
| 模块级 `export const` | ✅（始终允许） |
| 模块级未导出常量 | ❌ |
| import 的符号 | ✅ |

### Optimizer 输出

源代码：

```tsx
export const Hello = component$((props: { name: string }) => {
  const count = useSignal(0)
  return (
    <div>
      Hello {props.name}
      <button onClick$={() => count.value++}>{count.value}</button>
    </div>
  )
})
```

构建后大致：

```js
// main.js
export const Hello = componentQrl(
  qrl(() => import('./q-abc123.js'), 'Hello_component')
)

// q-abc123.js
export const Hello_component = (props) => {
  const count = useSignal(0)
  return _jsx('div', {
    children: ['Hello ', props.name,
      _jsx('button', {
        onClick$: qrl(() => import('./q-def456.js'), 'Hello_button_onClick', [count]),
        children: count.value,
      })
    ]
  })
}

// q-def456.js
export const Hello_button_onClick = () => {
  const [count] = useLexicalScope()
  count.value++
}
```

## 适配器速查

### Vercel Edge

```ts
// adapters/vercel-edge/vite.config.ts
import { vercelEdgeAdapter } from '@builder.io/qwik-city/adapters/vercel-edge/vite'

vercelEdgeAdapter({
  ssg: {
    include: ['/blog/*'],   // 这些路由 SSG 预渲染
    origin: 'https://example.com',
  },
})
```

### Cloudflare Pages

```ts
// adapters/cloudflare-pages/vite.config.ts
import { cloudflarePagesAdapter } from '@builder.io/qwik-city/adapters/cloudflare-pages/vite'

cloudflarePagesAdapter({
  ssg: { /* ... */ },
})
```

### Node.js（Express / Fastify）

```ts
// adapters/express/vite.config.ts
import { nodeServerAdapter } from '@builder.io/qwik-city/adapters/node-server/vite'

nodeServerAdapter({ name: 'express' })
```

### Static SSG

```ts
// adapters/static/vite.config.ts
import { staticAdapter } from '@builder.io/qwik-city/adapters/static/vite'

staticAdapter({
  origin: 'https://example.com',
})
```

### Bun / Deno

```ts
// adapters/bun/vite.config.ts
import { bunServerAdapter } from '@builder.io/qwik-city/adapters/bun-server/vite'
bunServerAdapter({ name: 'bun' })

// adapters/deno/vite.config.ts
import { denoServerAdapter } from '@builder.io/qwik-city/adapters/deno-server/vite'
denoServerAdapter({ name: 'deno' })
```

## 命名约定

| 类型 | 推荐 | 示例 |
|---|---|---|
| 组件 | PascalCase | `Counter` / `UserCard` |
| Loader hook | `use{Name}` + 类似动词后缀 | `useUser` / `useProducts` |
| Action hook | `use{Action}Action` | `useSignupAction` / `useLikeAction` |
| Context ID | camelCase + Id 后缀 | `themeContextId` / `userContextId` |
| Context 命名 | 反向域名 | `'app.theme'` / `'myapp.feature.user'` |
| 文件名 | kebab-case | `counter.tsx` / `user-card.tsx` |
| `routeLoader$` 导出 | `useXxx` | `useProduct` 而非 `productLoader` |
| Server function | 动词为主 | `greet` / `fetchUser` |
| Slot 命名 | kebab 或 camelCase | `q:slot="title"` / `q:slot="footer"` |

## 配置：vite.config.ts

```ts
import { defineConfig } from 'vite'
import { qwikVite } from '@builder.io/qwik/optimizer'
import { qwikCity } from '@builder.io/qwik-city/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(() => {
  return {
    plugins: [
      qwikCity({
        // 路由配置
        routesDir: 'src/routes',         // 默认
        platform: undefined,             // 平台特定（CF / Vercel）
        rewriteRoutes: [                  // i18n 路由重写
          // {
          //   prefix: 'zh',
          //   paths: { 'about': 'guanyu' },
          // },
        ],
      }),
      qwikVite({
        // Qwik 编译器配置
        srcDir: 'src',                   // 默认
        client: {
          devInput: 'src/entry.dev.tsx',
        },
      }),
      tsconfigPaths(),
    ],
    server: {
      port: 5173,
    },
    preview: {
      port: 4173,
    },
  }
})
```

## 校验器：Zod / Valibot

### Zod

```tsx
import { routeAction$, zod$, z } from '@builder.io/qwik-city'

export const useSignup = routeAction$(
  async (data) => {
    // data 类型：z.infer<schema>
    return await db.users.create(data)
  },
  zod$({
    email: z.string().email(),
    password: z.string().min(8),
    age: z.coerce.number().min(18),
    role: z.enum(['user', 'admin']).default('user'),
  })
)

// 动态 schema（基于 RequestEvent）
zod$((z, ev) => {
  const isAdmin = ev.sharedMap.get('user')?.role === 'admin'
  return z.object({
    name: z.string(),
    role: isAdmin ? z.enum(['user', 'admin']) : z.literal('user'),
  })
})
```

### Valibot

```tsx
import { routeAction$, valibot$ } from '@builder.io/qwik-city'
import * as v from 'valibot'

export const useSignup = routeAction$(
  async (data) => { /* ... */ },
  valibot$(
    v.object({
      email: v.pipe(v.string(), v.email()),
      password: v.pipe(v.string(), v.minLength(8)),
    })
  )
)
```

## 测试

### 单元测试（Vitest）

```bash
pnpm add -D vitest @builder.io/qwik
```

```ts
// counter.test.ts
import { describe, expect, test } from 'vitest'
import { createDOM } from '@builder.io/qwik/testing'
import { Counter } from './counter'

describe('Counter', () => {
  test('renders initial value', async () => {
    const { screen, render } = await createDOM()
    await render(<Counter />)
    expect(screen.outerHTML).toContain('Clicked 0 times')
  })

  test('increments on click', async () => {
    const { screen, render, userEvent } = await createDOM()
    await render(<Counter />)
    await userEvent('button', 'click')
    expect(screen.outerHTML).toContain('Clicked 1 times')
  })
})
```

### E2E（Playwright）

```bash
pnpm create playwright@latest
```

```ts
// e2e/home.spec.ts
import { test, expect } from '@playwright/test'

test('home page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Qwik/)
  await page.getByRole('button', { name: '+1' }).click()
})
```

## 常见 import 来源速查

```ts
// === Qwik core ===
import {
  component$,
  $,
  useSignal,
  useStore,
  useComputed$,
  useResource$,
  useTask$,
  useVisibleTask$,
  useContext,
  useContextProvider,
  createContextId,
  useStyles$,
  useStylesScoped$,
  useOn,
  useOnDocument,
  useOnWindow,
  useId,
  useConstant,
  noSerialize,
  type NoSerialize,
  type Signal,
  type QRL,
  type Component,
  type PropFunction,
  Slot,
  Resource,
  Fragment,
  sync$,
  event$,
  implicit$FirstArg,
  useErrorBoundary,
  useTaskQrl,
  untrack,
} from '@builder.io/qwik'

// === Build-time constants ===
import { isServer, isBrowser, isDev } from '@builder.io/qwik/build'

// === SSR ===
import {
  renderToString,
  renderToStream,
  type RenderToStreamOptions,
} from '@builder.io/qwik/server'

// === Optimizer ===
import { qwikVite } from '@builder.io/qwik/optimizer'

// === Qwik City ===
import {
  // Hooks
  useLocation,
  useNavigate,
  useContent,
  useDocumentHead,
  // Loaders / Actions / Server
  routeLoader$,
  routeAction$,
  globalAction$,
  server$,
  // Validators
  validator$,
  zod$,
  z,
  valibot$,
  // Components
  QwikCityProvider,
  QwikCityMockProvider,
  RouterOutlet,
  Link,
  Form,
  ServiceWorkerRegister,
  // Types
  type DocumentHead,
  type RequestHandler,
  type RequestEvent,
  type RouteLocation,
  type Cookie,
} from '@builder.io/qwik-city'

// === Qwik City Vite plugin ===
import { qwikCity } from '@builder.io/qwik-city/vite'

// === Image (optional) ===
import { Image } from '@unpic/qwik'
import { Image as QwikImage } from 'qwik-image'
```

## 与同类元框架对比

| 维度 | Qwik | Next.js 15 | Nuxt 4 | SvelteKit | Solid Start | Astro 5 |
|---|---|---|---|---|---|---|
| 底层 UI | Qwik | React | Vue | Svelte | Solid | 多框架 |
| Server Components | - | RSC | Nitro | - | - | island |
| 启动模式 | **Resumable** | Hydration（含 RSC） | Hydration | Hydration | Hydration | Island |
| 首屏 JS | **~1KB** | 数十 KB | 数十 KB | 数 KB | 数 KB | 0 |
| 数据加载 | `routeLoader$` | `fetch` 在 RSC | `useFetch` | `+page.server.ts` | `createAsync` | `Astro.props` |
| 表单 | `routeAction$` + `<Form>` | Server Actions | Form 提交 | Form Actions | `action()` | - |
| RPC | `server$` | Server Actions | `defineEventHandler` | `+server.ts` | `server function` | endpoint |
| 路由 | 文件 | 文件 | 文件 | 文件 | 文件 | 文件 |
| 部署 | 12+ | Vercel + 多 | Nitro 多 | adapter 多 | adapter 多 | 静态 + 多 |
| 心智 | Resumability + `$` | RSC + Hydration | Composition + Auto-import | Stores + Reactive | Signals | 静态优先 |
| 适合 | 内容站 / 电商 / 极致 TTI | 通用 | 通用 | 现代 SPA | 高性能 SPA | 内容站 / 文档 |

## 性能基准（典型场景）

### Bundle Size 对比（生产构建后）

| 框架 | Hello World | 含路由 + 表单 | 含 100 组件 |
|---|---|---|---|
| Qwik | 1-2 KB（启动） | 1-2 KB（启动） | 1-2 KB（启动） |
| React + Next | 80 KB | 120 KB | 250 KB+ |
| Vue + Nuxt | 60 KB | 90 KB | 200 KB+ |
| Svelte + SvelteKit | 15 KB | 30 KB | 80 KB |
| Solid + Start | 10 KB | 25 KB | 70 KB |

> **注意**：Qwik 的「启动」JS 不变，但用户交互**累计**下载量与其他框架相近——只是「分摊到交互」而非「一次性下载」。

### TTI（Time to Interactive）

| 框架 | 简单页 | 中等页 | 复杂页 |
|---|---|---|---|
| Qwik | <100ms | <100ms | <100ms |
| Astro Island | 0（无 JS）/ <100ms（有 island） | 同左 | 同左 |
| Next.js 15（RSC） | 200ms | 500ms | 1.5s |
| SvelteKit | 150ms | 400ms | 1.2s |
| Nuxt 4 | 200ms | 600ms | 1.8s |

## 学习资源

- [Qwik 官网](https://qwik.dev/)
- [Qwik 教程](https://qwik.dev/tutorial/)
- [Qwik Playground](https://qwik.dev/playground/)
- [Awesome Qwik](https://github.com/QwikDev/awesome-qwik)
- [Qwik 2.0 RFC](https://github.com/QwikDev/qwik/discussions)
- [Resumability 论文](https://www.builder.io/blog/hydration-is-pure-overhead)
- [Qwik Discord](https://qwik.dev/chat)

## Qwik 1.x → 2.0 主要差异（待定）

| 1.x | 2.0（预期） |
|---|---|
| `@builder.io/qwik` | `@qwik.dev/core` |
| `@builder.io/qwik-city` | `@qwik.dev/router`（合并） |
| `useTask$` | 可能保留 / 改名待定 |
| `useVisibleTask$` | 标记 deprecated（推荐 `useTask$ + useOnVisible$`） |
| `routeLoader$` | 保留 |
| `server$` | 增强（更好的流式 / 类型） |

> Qwik 2.0 仍在 alpha 阶段，迁移时官方会提供 codemod 工具。建议生产环境继续用 1.x stable。
