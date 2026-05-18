---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Qwik 1.x（`@builder.io/qwik` / `@builder.io/qwik-city`）编写。Qwik 2.0 将切换包名为 `@qwik.dev/core` / `@qwik.dev/router`，开发中。

## 速查

- 系统要求：**Node.js 18.17+**（推荐 20+）+ TypeScript 5+ + 现代浏览器（ES2020+）
- 创建项目：`pnpm create qwik@latest`（npm / yarn / bun 同理）
- 启动 dev server：`pnpm run start`（端口 5173，Vite）
- 生产构建：`pnpm run build`（同时跑 build.client + build.server）
- 生产预览：`pnpm run preview`（`localhost:4173`）
- 添加适配器：`pnpm run qwik add`（交互式菜单选 Vercel / Cloudflare / Node / 等）
- 创建组件 / 路由：`pnpm run qwik new Button` / `pnpm run qwik new /contact`
- 核心包：`@builder.io/qwik`（核心 runtime + JSX）/ `@builder.io/qwik-city`（路由 + loaders + actions）
- 第一个组件：`component$(() => <div>Hello</div>)`
- 响应式：`useSignal(0)` 单值 / `useStore({...})` 对象（深响应）
- 事件：`onClick$={() => count.value++}`（**$ 不能省**）
- 路由文件：`src/routes/index.tsx`（首页）/ `src/routes/about/index.tsx`（`/about`）/ `src/routes/blog/[slug]/index.tsx`（动态路由）
- 数据加载：`routeLoader$(async (ev) => fetch(...))` + 组件内 `const data = useFoo()`
- 表单：`routeAction$()` + `<Form action={action}>`（无 JS 也可工作）
- RPC：`server$(async function(arg) { ... })` 客户端可像普通异步函数调用

## Qwik 是「Resumable 框架」不是「另一个 React」

理解 Qwik 必须先理解它**不是什么**——它**不是**「JSX 版本的 Vue」「更快的 React」「细粒度的 Solid」——它是**完全不同的范式**：

| 维度 | Qwik 1.x | React 19 | Vue 3.5 | Solid 1.x | Astro 5 |
|---|---|---|---|---|---|
| 启动模式 | **Resumable**（无 hydration） | Hydration | Hydration | Hydration | Island（部分 hydration） |
| 首屏 JS | **~1KB（Qwikloader）** | ~45KB + app | ~25KB + app | ~7KB + app | 0（纯 HTML island） |
| 状态序列化 | **HTML 属性中** | client 重建 | client 重建 | client 重建 | 每 island 独立 hydrate |
| 代码拆分 | **自动**（`$` 边界） | 手动 `lazy()` | 手动 `defineAsyncComponent` | 手动 `lazy()` | island 级 |
| 响应式 | Signals（细粒度） | useState（粗粒度） | ref/reactive（中粒度） | Signals（细粒度） | 不适用 |
| 模板 | JSX/TSX | JSX | SFC | JSX | Astro 模板 + island |
| 路由 | Qwik City（文件） | 无内置 | 无内置 | Solid Start | 文件 |
| 后端 | `server$` / `routeLoader$` / `routeAction$` | Server Actions（19） | Nitro（Nuxt） | server functions | endpoint |
| 部署 | Edge / Node / SSG | 多端 | 多端 | 多端 | 静态优先 |
| 心智模型 | **可序列化闭包** | 重渲染 | 响应式代理 | 响应式 signal | 静态优先 |
| 学习曲线 | **陡**（Resumability + `$`） | 中 | 平 | 平 | 平 |

**含义**：

- Qwik 解决的是「**hydration is pure overhead**」这个根本问题（Misko Hevery 的著名论断）
- 与 Astro 的对比：Astro 用 Island 架构「**部分**」hydration，Qwik 是「**无**」hydration——本质不同
- 与 Solid Start 的对比：Solid Start 是「细粒度响应式 + 传统 hydration」，Qwik 是「Signals + Resumability」——细粒度但更激进
- **不适合**：纯客户端 SPA（不需要 SSR 时 Qwik 的 Resumability 优势消失）、原型阶段（心智成本高）
- **适合**：内容站、电商、博客、营销页、需要极致首屏 TTI 的应用

## 安装与首次启动

### 创建新项目

最简单的起点：

```bash
pnpm create qwik@latest
# 或：npm create qwik@latest / yarn create qwik / bun create qwik@latest
```

交互式菜单：

```
? Where would you like to create your new project? › ./my-app
? Select a starter
  ❯ Empty App     # 最小化空模板，仅 Qwik + Qwik City
    Basic        # 含 demo 路由（推荐学习用）
    Library     # 用于发布 Qwik 组件库
? Would you like to install pnpm dependencies? › Yes
```

完成后：

```bash
cd my-app
pnpm run start
# 浏览器自动打开 http://localhost:5173
```

> Empty App vs Basic
>
> - **Empty App**：仅 `src/root.tsx` + `src/routes/index.tsx`，干净起点
> - **Basic**：含示例路由（`/`, `/flower`, `/demo/todolist`）+ 样式 + 完整组件演示——**新手强烈推荐**

### Node 版本要求

```bash
node -v   # 必须 ≥ 18.17.0，推荐 v20 LTS 或 v22 LTS
```

```bash
nvm install --lts && nvm use --lts
```

### 关键脚本（package.json）

| 脚本 | 命令 | 用途 |
|---|---|---|
| `start` | `vite --open --mode ssr` | 开发模式（SSR） |
| `dev` | `vite --mode ssr` | 等价 start 但不自动开浏览器 |
| `dev.debug` | `node --inspect-brk vite ...` | 调试模式 |
| `build` | `qwik build` | 完整构建（client + server） |
| `build.client` | `vite build` | 仅构建 client bundle |
| `build.server` | `vite build -c adapters/.../vite.config.ts` | 构建服务端入口（需先 add adapter） |
| `build.preview` | `vite build --ssr src/entry.preview.tsx` | 构建本地预览 |
| `preview` | `qwik build preview && vite preview` | 本地启动生产预览（4173） |
| `qwik` | `qwik` | Qwik CLI（用于 add / new） |

### 添加适配器

默认项目没有 adapter——只能本地预览。要部署生产，先添加 adapter：

```bash
pnpm run qwik add
# 交互式菜单：
#   ❯ Adapter: Cloudflare Pages
#     Adapter: Vercel Edge
#     Adapter: Netlify Edge
#     Adapter: Node Express
#     Adapter: Node Fastify
#     Adapter: Static Site (SSG)
#     Adapter: Deno
#     Adapter: Bun
#     Adapter: AWS Lambda
#     ...
```

添加后会在项目中生成 `adapters/{name}/vite.config.ts` 和入口文件 `src/entry.{name}.tsx`，并更新 `package.json` 的构建脚本。

## 项目结构

最常见的 Qwik + Qwik City 项目：

```
my-app/
├── src/
│   ├── routes/                    # ✨ 文件路由（核心）
│   │   ├── layout.tsx             # 根布局（包裹所有页面）
│   │   ├── index.tsx              # 首页 (/)
│   │   ├── about/
│   │   │   └── index.tsx          # /about
│   │   ├── blog/
│   │   │   ├── index.tsx          # /blog
│   │   │   └── [slug]/
│   │   │       └── index.tsx      # /blog/:slug
│   │   ├── api/
│   │   │   └── posts/
│   │   │       └── index.ts       # GET/POST /api/posts（endpoint）
│   │   └── [...catchall]/
│   │       └── index.tsx          # 兜底（404）
│   ├── components/                # 可复用组件（非路由）
│   │   ├── header/
│   │   │   ├── header.tsx
│   │   │   └── header.css
│   │   └── footer/
│   │       └── footer.tsx
│   ├── entry.ssr.tsx              # SSR 入口（renderToString）
│   ├── entry.dev.tsx              # 开发入口
│   ├── entry.preview.tsx          # 预览入口
│   ├── root.tsx                   # 应用根（html / head / body）
│   └── global.css                 # 全局样式
├── public/                        # 静态资源（直接拷贝到 dist）
│   ├── favicon.svg
│   └── manifest.json
├── adapters/                      # 部署适配器（add 后生成）
│   └── cloudflare-pages/
│       └── vite.config.ts
├── vite.config.ts                 # Vite 主配置
├── tsconfig.json
└── package.json
```

### root.tsx

应用的根 HTML 框架——所有页面共享：

```tsx
// src/root.tsx
import { component$ } from '@builder.io/qwik'
import {
  QwikCityProvider,
  RouterOutlet,
  ServiceWorkerRegister,
} from '@builder.io/qwik-city'
import { RouterHead } from './components/router-head/router-head'

import './global.css'

export default component$(() => {
  return (
    <QwikCityProvider>
      <head>
        <meta charSet="utf-8" />
        <link rel="manifest" href="/manifest.json" />
        <RouterHead />
        <ServiceWorkerRegister />
      </head>
      <body lang="en">
        <RouterOutlet />
      </body>
    </QwikCityProvider>
  )
})
```

**关键点**：

- `<QwikCityProvider>`：注入 Qwik City context（路由 / loaders / actions），必须在根
- `<RouterOutlet>`：根据 URL 渲染匹配的路由 + layout
- `<RouterHead>`：从各路由的 `head` 导出动态生成 meta 标签
- `<ServiceWorkerRegister>`：注册 PWA / 预加载 Service Worker（可选）

### entry.ssr.tsx

SSR 渲染入口——构建时被 adapter 调用：

```tsx
// src/entry.ssr.tsx
import { renderToStream, type RenderToStreamOptions } from '@builder.io/qwik/server'
import { manifest } from '@qwik-client-manifest'
import Root from './root'

export default function (opts: RenderToStreamOptions) {
  return renderToStream(<Root />, {
    manifest,
    ...opts,
    containerAttributes: {
      lang: 'en-us',
      ...opts.containerAttributes,
    },
  })
}
```

## 第一个组件

```tsx
// src/components/counter/counter.tsx
import { component$, useSignal } from '@builder.io/qwik'

/**
 * 简单计数器组件
 * - useSignal 创建响应式值，访问用 .value
 * - onClick$ 的 $ 是 Optimizer 的 lazy boundary 标记
 */
export const Counter = component$(() => {
  const count = useSignal(0)

  return (
    <div>
      <button onClick$={() => count.value++}>
        Clicked {count.value} times
      </button>
    </div>
  )
})
```

在路由中使用：

```tsx
// src/routes/index.tsx
import { component$ } from '@builder.io/qwik'
import { Counter } from '~/components/counter/counter'

export default component$(() => {
  return (
    <section>
      <h1>Welcome to Qwik</h1>
      <Counter />
    </section>
  )
})
```

**核心点**：

- `component$()` 包装组件——`$` 是 lazy boundary，Optimizer 把该函数拆成独立 chunk
- `useSignal(0)`：创建 Signal，类型 `Signal<number>`，访问 `count.value`
- `onClick$={() => ...}`：事件处理器**必须用 `$` 后缀**——不是 `onClick` 也不是 `onClick$=function()`
- JSX 用 `class` 而非 `className`（HTML 原生标签名）
- 不需要手动 `import { jsx } from 'react'`——Qwik 用自己的 JSX runtime

### 完整的可交互组件

```tsx
import { component$, useSignal, useStore } from '@builder.io/qwik'

interface TodoItem {
  id: number
  text: string
  done: boolean
}

export const TodoList = component$(() => {
  // 输入框值
  const input = useSignal('')
  // 列表（store 自动深响应）
  const todos = useStore<{ items: TodoItem[] }>({ items: [] })

  return (
    <div>
      <input
        type="text"
        bind:value={input}
        placeholder="Add a todo..."
      />
      <button
        onClick$={() => {
          if (!input.value.trim()) return
          todos.items.push({
            id: Date.now(),
            text: input.value,
            done: false,
          })
          input.value = ''
        }}
      >
        Add
      </button>

      <ul>
        {todos.items.map((todo) => (
          <li
            key={todo.id}
            style={{
              textDecoration: todo.done ? 'line-through' : 'none',
            }}
          >
            <input
              type="checkbox"
              checked={todo.done}
              onChange$={() => (todo.done = !todo.done)}
            />
            <span>{todo.text}</span>
          </li>
        ))}
      </ul>

      <p>Total: {todos.items.length}</p>
    </div>
  )
})
```

**关键观察**：

- `useStore` 比 `useSignal` 更适合对象——默认深响应（嵌套对象 / 数组也会自动追踪）
- `bind:value={signal}` 双向绑定（自动生成 `value={signal.value}` + `onInput$`）
- `todo.done = !todo.done`：直接赋值即可，store 的属性赋值自动触发响应式
- `key={todo.id}`：列表 key 必填（不要用数组 index）

## Signals：单值响应式

```tsx
import { component$, useSignal } from '@builder.io/qwik'

export default component$(() => {
  const count = useSignal(0)
  const name = useSignal<string>('Qwik')
  const user = useSignal<{ id: number; name: string } | null>(null)

  return (
    <>
      <p>Count: {count.value}</p>
      <button onClick$={() => count.value++}>+1</button>

      <p>Name: {name.value}</p>
      <input bind:value={name} />

      <button onClick$={() => (user.value = { id: 1, name: 'Bob' })}>
        Login
      </button>
      {user.value && <p>Logged in as {user.value.name}</p>}
    </>
  )
})
```

**Signal 核心规则**：

- 一个 signal 持有一个值——任意类型（基本类型 / 对象 / 数组）
- 读写都通过 `.value`
- **只追踪顶层赋值**——如果 signal 持有对象，对象内部属性变化**不会**触发响应式（这时用 store）
- 是 Qwik 响应式的基础——`useTask$` / `useComputed$` 都通过 signal 追踪订阅

## Stores：对象深响应式

```tsx
import { component$, useStore } from '@builder.io/qwik'

export default component$(() => {
  const state = useStore({
    count: 0,
    user: { name: 'Qwik', age: 5 },
    todos: ['Learn Qwik', 'Build app'],
  })

  return (
    <>
      <button onClick$={() => state.count++}>+1: {state.count}</button>

      <input
        bind:value={
          /* 注意：bind 只能用于 signal，不能用于 store；这里要手写 */
          state.user.name
        }
        onInput$={(_, el) => (state.user.name = el.value)}
      />
      <p>User: {state.user.name}</p>

      {state.todos.map((todo, i) => (
        <li key={i}>{todo}</li>
      ))}
      <button onClick$={() => state.todos.push(`Todo ${state.todos.length + 1}`)}>
        Add Todo
      </button>
    </>
  )
})
```

**Store 核心规则**：

- 默认**深响应**——嵌套对象 / 数组的任意层级修改都会触发依赖该路径的组件重渲染
- 可选 `useStore(obj, { deep: false })` 关闭深响应（性能优化，仅追踪顶层）
- store 的属性赋值（`state.count++`）即触发响应——不需要 setter
- 数组 push / pop / splice 也会触发响应

### Signal vs Store

| 维度 | useSignal | useStore |
|---|---|---|
| 持有 | 单值 | 对象 |
| 访问 | `.value` | 直接属性访问 |
| 响应粒度 | 顶层 | **深层（默认）** |
| 与 `bind:` | 支持 | 不支持（要手写 onInput$） |
| 适用 | 计数 / 单个 string / 引用 | 表单 / 嵌套数据 / 列表 |

**经验法则**：

- 单值（数字 / 字符串 / boolean）→ `useSignal`
- 对象 / 数组 / 嵌套数据 → `useStore`
- props 间需要传递「响应式引用」→ 必须是 `Signal<T>`（store 不能跨组件传，要用 context）

## 第一个路由

Qwik City 用文件系统路由——`src/routes/` 下的目录 + `index.tsx` 自动成为页面。

### 创建静态路由

```bash
pnpm run qwik new /about
```

生成 `src/routes/about/index.tsx`：

```tsx
import { component$ } from '@builder.io/qwik'
import type { DocumentHead } from '@builder.io/qwik-city'

export default component$(() => {
  return (
    <div>
      <h1>About Page</h1>
      <p>This is the about page.</p>
    </div>
  )
})

/** 该路由的 head meta（被 RouterHead 渲染到 <head>） */
export const head: DocumentHead = {
  title: 'About',
  meta: [
    {
      name: 'description',
      content: '关于我们',
    },
  ],
}
```

访问 `http://localhost:5173/about` 即可看到。

### 动态路由

`src/routes/blog/[slug]/index.tsx`：

```tsx
import { component$ } from '@builder.io/qwik'
import { useLocation } from '@builder.io/qwik-city'

export default component$(() => {
  const loc = useLocation()
  // loc.params.slug 自动推断
  return <h1>Blog post: {loc.params.slug}</h1>
})
```

访问 `/blog/hello-world` → 渲染「Blog post: hello-world」。

### 链接与导航

```tsx
import { component$ } from '@builder.io/qwik'
import { Link, useNavigate } from '@builder.io/qwik-city'

export default component$(() => {
  const nav = useNavigate()

  return (
    <nav>
      {/* 推荐：使用 Link 组件，自动 prefetch，SPA 切换 */}
      <Link href="/about">About</Link>
      <Link href="/blog/intro" prefetch>Blog</Link>

      {/* 不推荐：原生 a 标签会全量 reload */}
      <a href="/contact">Contact</a>

      {/* 编程式导航 */}
      <button onClick$={() => nav('/dashboard')}>Go Dashboard</button>
      <button onClick$={() => nav('/')}>Home</button>
    </nav>
  )
})
```

`<Link>` 的默认行为：

- 用户**鼠标 hover** 时自动 prefetch 下一页（含 loader 数据）
- 点击时 SPA 切换，无 full page reload
- 可加 `prefetch` 强制立即 prefetch

## 第一个 `routeLoader$`

服务器端数据加载——每次导航执行，结果传递到组件：

```tsx
// src/routes/products/[id]/index.tsx
import { component$ } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'

/**
 * 路由级数据加载器
 * - 仅在服务器端执行
 * - 每次导航到该路由时触发
 * - 返回值通过 use[Name]() hook 给组件访问
 */
export const useProduct = routeLoader$(async (requestEvent) => {
  const id = requestEvent.params.id
  const res = await fetch(`https://api.example.com/products/${id}`)

  if (!res.ok) {
    // 触发 404
    requestEvent.status(404)
    return { error: 'Product not found' }
  }

  const product = await res.json()
  return product
})

export default component$(() => {
  // signal 自动响应——导航时 loader 重跑，signal 自动更新
  const product = useProduct()

  if ('error' in product.value) {
    return <div>Not found</div>
  }

  return (
    <article>
      <h1>{product.value.name}</h1>
      <p>{product.value.description}</p>
      <p>Price: ${product.value.price}</p>
    </article>
  )
})
```

**核心点**：

- `routeLoader$` 返回的不是数据本身，而是一个 hook（用 `use[Name]()` 调用）
- 命名约定：`useXxx`（以 `use` 开头，便于一眼识别为 hook）
- 必须从 `index.tsx` 或 `layout.tsx` 导出（不能从 components 里导出）
- 返回值必须**可序列化**（class 实例 / function / Promise 等需要特殊处理）
- 失败用 `requestEvent.fail(status, data)`，组件读取 `result.value.failed` 判断

### 多个 loader

```tsx
export const useUser = routeLoader$(async ({ cookie }) => {
  const session = cookie.get('session')?.value
  return session ? await db.users.find(session) : null
})

export const useProducts = routeLoader$(async () => {
  return await db.products.list()
})

// loader 之间依赖（resolveValue）
export const useUserOrders = routeLoader$(async (ev) => {
  const user = await ev.resolveValue(useUser)
  if (!user) return []
  return await db.orders.byUserId(user.id)
})

export default component$(() => {
  const user = useUser()
  const products = useProducts()
  const orders = useUserOrders()

  return (
    <div>
      {user.value && <p>Welcome, {user.value.name}</p>}
      {/* ... */}
    </div>
  )
})
```

## 第一个 `routeAction$`

表单 + 副作用（数据库写入 / 邮件发送等）——配合 `<Form>` 组件无 JS 也可用：

```tsx
// src/routes/contact/index.tsx
import { component$ } from '@builder.io/qwik'
import { Form, routeAction$, zod$, z } from '@builder.io/qwik-city'

/**
 * 表单提交动作
 * - 仅在服务器端执行
 * - 仅在显式触发时执行（提交表单 / 调用 action.submit()）
 * - zod$ 自动校验输入
 */
export const useContactAction = routeAction$(
  async (data, requestEvent) => {
    // data 已通过 zod$ 校验和类型推断
    console.log('Server received:', data)

    // 模拟发送邮件
    await sendEmail({
      to: 'admin@example.com',
      from: data.email,
      subject: data.subject,
      body: data.message,
    })

    // 返回成功响应（出现在 action.value）
    return {
      success: true,
      message: 'Thanks for reaching out!',
    }
  },
  zod$({
    email: z.string().email('请输入有效邮箱'),
    subject: z.string().min(5, '主题至少 5 字'),
    message: z.string().min(10, '内容至少 10 字'),
  })
)

export default component$(() => {
  const action = useContactAction()

  return (
    <div>
      <h1>Contact Us</h1>

      <Form action={action}>
        <label>
          Email: <input type="email" name="email" />
          {action.value?.failed && action.value.fieldErrors?.email && (
            <span class="error">{action.value.fieldErrors.email}</span>
          )}
        </label>

        <label>
          Subject: <input type="text" name="subject" />
          {action.value?.failed && action.value.fieldErrors?.subject && (
            <span class="error">{action.value.fieldErrors.subject}</span>
          )}
        </label>

        <label>
          Message: <textarea name="message" />
        </label>

        <button type="submit">Send</button>
      </Form>

      {action.value?.success && (
        <p class="success">{action.value.message}</p>
      )}
    </div>
  )
})
```

**核心点**：

- `routeAction$` 默认返回 `{ value, isRunning, submit, formData }`
- `<Form action={action}>`：包装原生 `<form>`，**JS 禁用时也能工作**（progressive enhancement）
- `zod$()` 校验：第二参数传 zod schema，自动验证 + TypeScript 类型推断
- 校验失败：`action.value.failed = true`，错误字段在 `action.value.fieldErrors`
- 成功：`action.value` 是 loader 返回值
- `routeAction$` vs `globalAction$`：前者只能在 routes 文件中，后者可以全局复用

### 程序化触发（不用 Form）

```tsx
import { component$ } from '@builder.io/qwik'
import { routeAction$ } from '@builder.io/qwik-city'

export const useLikeAction = routeAction$(async (data) => {
  await db.likes.add(data)
  return { ok: true }
})

export default component$(() => {
  const action = useLikeAction()

  return (
    <button
      onClick$={async () => {
        // 不通过表单提交
        const result = await action.submit({ postId: 123 })
        console.log(result.value)
      }}
      disabled={action.isRunning}
    >
      {action.isRunning ? 'Liking...' : 'Like'}
    </button>
  )
})
```

## `$` 后缀的真正含义

理解 `$` 是用好 Qwik 的关键——它**不是装饰糖**，是 Optimizer 的**编译时标记**。

### `$` 表示「lazy boundary」

```tsx
import { component$ } from '@builder.io/qwik'

export default component$(() => {
  return (
    <button onClick$={() => console.log('clicked')}>
      Click me
    </button>
  )
})
```

经 Optimizer 编译后变成：

```js
// app.js (main chunk)
const App = componentQrl(
  qrl(() => import('./app_component_xxxxxx.js'), 'App_component')
)

// app_component_xxxxxx.js (lazy chunk 1)
export const App_component = () => {
  return _jsx('button', {
    onClick$: qrl(
      () => import('./app_component_button_onClick_yyyyyy.js'),
      'App_component_button_onClick'
    ),
    children: 'Click me',
  })
}

// app_component_button_onClick_yyyyyy.js (lazy chunk 2)
export const App_component_button_onClick = () => console.log('clicked')
```

**关键观察**：

- 组件被拆成独立 chunk
- 事件处理器又被拆成独立 chunk
- HTML 里 button 的 onclick 属性变成 `<button on:click="./app_component_button_onClick_yyyyyy.js#App_component_button_onClick">`
- 浏览器**只在点击时**才 fetch 这个 chunk——这就是 Qwik 的「真·lazy loading」

### `$` 函数的限制

捕获的闭包变量必须满足：

```tsx
// ❌ 错误：let 声明
component$(() => {
  let foo = 'value'
  return <div onClick$={() => console.log(foo)} />
})

// ✅ 正确：const 声明
component$(() => {
  const foo = 'value'
  return <div onClick$={() => console.log(foo)} />
})

// ❌ 错误：非可序列化值（class 实例）
component$(() => {
  const foo = new MyCustomClass(12)
  return <div onClick$={() => console.log(foo)} />
})

// ✅ 正确：纯对象
component$(() => {
  const foo = { data: 12 }
  return <div onClick$={() => console.log(foo)} />
})
```

> **原因**：所有跨 `$` 边界的闭包变量都要被**序列化到 HTML**——这样浏览器才能在事件触发时重建闭包上下文。`let` 变量在 reactivity 系统外，无法被追踪；class 实例无法被 JSON 序列化（除非自定义 `toJSON`）。

### 何时需要 `$`

| 场景 | API | 必填 `$` 吗 |
|---|---|---|
| 组件定义 | `component$(...)` | **是** |
| 事件处理 | `onClick$` / `onInput$` / ... | **是** |
| 任务 | `useTask$` / `useVisibleTask$` | **是** |
| 资源 | `useResource$` | **是** |
| Server 函数 | `server$(...)` | **是** |
| Computed | `useComputed$` | **是** |
| 路由 loader | `routeLoader$` | **是** |
| 路由 action | `routeAction$` | **是** |
| 样式 | `useStyles$` / `useStylesScoped$` | **是** |
| 直接函数（非 hook 上下文） | `$(() => ...)` 包装 | **是**（除非传给 hook 的内联函数） |

口诀：**任何会被 Optimizer 提取的代码都需要 `$`**——简单说，凡是**事件处理 / 生命周期 / 异步**类的回调都需要 `$`。

## Qwik vs Qwik City 的区别

很多新手分不清这两者：

| 维度 | Qwik | Qwik City |
|---|---|---|
| 定位 | Core runtime（JSX + Resumability + Optimizer） | Meta-framework（路由 + SSR + 后端） |
| 包名 | `@builder.io/qwik` | `@builder.io/qwik-city` |
| 类比 | React | Next.js |
| 提供 | `component$` / `useSignal` / `useStore` / `useTask$` / Slot / 等核心 API | 路由 / `<Link>` / `<Form>` / `routeLoader$` / `routeAction$` / `server$` / middleware / 部署 adapter |
| 必需吗 | 是（核心） | 否（但 99% 项目都用） |

实际项目中——**两者一起用是默认配置**。`pnpm create qwik@latest` 默认就装了两者，你可以认为 Qwik = runtime，Qwik City = framework。

## 调试

- **Vite DevTools**：开发模式自带 vite 提供的错误显示页面
- **Qwik Insights**：[官方性能分析工具](https://qwik.dev/docs/labs/insights/)，仍在 labs
- **浏览器 DevTools**：
  - Network 面板能看到 `q-*.js` chunks 的按需加载
  - HTML 里搜 `on:click` / `on:document:` / `q:slot` / `q:container` 看序列化标记
- 开发模式可以打开 `__qContext`、`__qManifest` 等内部对象（仅 dev build）

## 接下来读什么

完成本入门后建议按顺序读：

- [指南](./guide-line.md)：Resumability 原理 / Lazy Loading / Signals 高级 / Tasks 全集 / Server Functions / Middleware / Adapter / Image / 常见踩坑
- [参考](./reference.md)：API 速查 / 文件约定 / `qwik.config.ts` / 适配器列表 / 命名约定
