---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 SolidStart 1.x（`@solidjs/start` / `@solidjs/router` / `@solidjs/meta`）编写。SolidStart **2.x alpha** 已发布，底层从 Vinxi 切换到 Vite + `@solidjs/vite-plugin-nitro-2`，配置文件名从 `app.config.ts` 改为 `vite.config.ts`，API 层面基本兼容——本文以 1.x 为主，文末说明 v2 迁移要点。

## 速查

- 系统要求：**Node.js 20+**（推荐 22 LTS）+ TypeScript 5+（可选）
- 创建项目：`pnpm create solid`（npm / yarn / bun / deno 同理）
- 启动 dev：`pnpm dev`（端口 `3000`，Vinxi）
- 生产构建：`pnpm build`
- 生产预览：`pnpm start`（v1）或 `vite preview`（v2）
- 核心包：`@solidjs/start`（运行时 + 入口工具）/ `@solidjs/router`（文件路由 + `query` / `action` / `createAsync`）/ `@solidjs/meta`（meta 标签）/ `vinxi`（v1 构建/运行时，v2 不需要）
- 入口文件：`src/app.tsx`（应用根）/ `src/entry-server.tsx`（SSR 入口）/ `src/entry-client.tsx`（hydration 入口）
- 配置文件：`app.config.ts`（v1，基于 `defineConfig` from `@solidjs/start/config`）/ `vite.config.ts`（v2）
- 路由：`src/routes/index.tsx` 是 `/`，`src/routes/about.tsx` 是 `/about`，`src/routes/[id].tsx` 是 `/:id`
- 服务器函数：在 async function **顶部**加 `"use server"`（或整个文件顶部）即可标记为服务器函数
- 数据加载：`query(fn, "key")` 定义 + `createAsync(() => fn())` 订阅
- 表单/副作用：`action(fn, "key")` 定义 + `<form action={fn} method="post">` 调用
- 提交状态：`useSubmission(fn)`（单次）/ `useSubmissions(fn)`（多次）
- 头部 meta：`<Title>` / `<Meta>` / `<Link>` from `@solidjs/meta`
- HTTP：`<HttpStatusCode code={404} />` / `<HttpHeader name="x" value="y" />` from `@solidjs/start`

## SolidStart 是「Solid 的官方元框架」

理解 SolidStart 的关键定位——**它把 Solid 从「纯 UI 库」升级为「全栈应用框架」**：

| 维度 | SolidStart 1.x | Solid 1.9（裸） | Next.js 15 | Nuxt 4 | SvelteKit 2 | Astro 5 |
|---|---|---|---|---|---|---|
| 自我定位 | 元框架（Solid + Vinxi） | 纯 UI 库 | 元框架（React + RSC） | 元框架（Vue + Nitro） | 元框架（Svelte） | 内容站元框架 |
| 路由 | `@solidjs/router`（文件路由） | 无内置 | App Router | Vue Router + 文件 | 文件路由 | 文件路由 |
| 服务器函数 | **`"use server"` 指令** | 无 | Server Actions（`"use server"`） | `defineEventHandler` | `+server.ts` actions | endpoint |
| 数据加载 | `query()` + `createAsync()` | 无 | RSC fetch / use | `useFetch` / `useAsyncData` | `load()` | 静态优先 |
| 表单 | `action()` + `<form>` | 无 | Server Actions + `<form>` | `useSubmit` | form actions | 不内置 |
| 渲染模式 | **CSR / SSR / Streaming / SSG** | CSR | RSC + Streaming | SSR / SSG / SPA | SSR / SSG | Static + Island |
| 后端 | Nitro（多平台预设） | 无 | Node only / Edge | Nitro | Node / Edge | Node / Edge |
| 心智模型 | 细粒度响应式 + 服务器函数 | 细粒度响应式 | RSC 边界 + 重渲染 | 响应式代理 + SSR | rune + signal | 静态优先 |
| Bundle 体积 | **较小**（~20KB） | 最小（~7KB） | 较大（~80KB+） | 中（~30KB） | 较小（~20KB） | 0（纯 HTML） |

**含义**：

- 如果你写 Solid，需要文件路由 / SSR / 服务器函数 → 用 SolidStart
- 如果你写 Solid，只要纯 SPA / 嵌入老项目 → 直接 Vite + `vite-plugin-solid`
- 与 Next.js 比，SolidStart 更**显式**——`query` / `action` 是函数式 API，不像 RSC 那样模糊 client/server 边界
- 与 Astro 比，SolidStart 偏「**应用**」（数据写入 / 实时 UI），Astro 偏「**内容**」

## 安装与首次启动

### 创建新项目

最简单的起点，官方脚手架 `create-solid`：

```bash
pnpm create solid
# 或：npm init solid / yarn create solid / bun create solid / deno init --npm solid
```

交互式菜单：

```text
◆ Project Name?
│ my-app
◆ Is this a SolidStart project?
│ Yes / No   <- 选 Yes（用 SolidStart）；选 No 是裸 Solid（Vite 模板）
◆ Which template would you like to use?
│ ● basic          <- 推荐起点：含示例页面 + 路由 + Counter
│ ○ bare           <- 最小化空模板
│ ○ with-solidbase <- 文档站模板（VitePress 风格）
│ ○ with-auth      <- 含简单 cookie session 鉴权示例
│ ○ with-authjs    <- 含 Auth.js 集成
│ ○ with-drizzle   <- 含 Drizzle ORM 示例
│ ○ with-mdx       <- 含 MDX 支持
│ ○ with-prisma    <- 含 Prisma 示例
│ ○ with-solid-styled
│ ○ with-tailwindcss <- 含 Tailwind CSS 集成
│ ○ with-vitest    <- 含单元测试
│ ○ hackernews     <- 完整 HN 克隆（最完善的范例项目）
│ ○ todomvc        <- TodoMVC 实现
◆ Use TypeScript?
│ Yes / No
```

完成后：

```bash
cd my-app
pnpm install
pnpm dev
# 浏览器打开 http://localhost:3000
```

> **basic vs bare**
>
> - **basic**：含 `routes/index.tsx`（首页 + Counter 演示）+ `routes/about.tsx` + `app.tsx`（Router 装配）+ 样式——**新手强烈推荐**
> - **bare**：最小化，只有空 `routes/index.tsx`——干净起点，适合从头搭建

### Node 版本要求

```bash
node -v   # 推荐 ≥ 20.19 / 22 LTS（Vite 7 要求）
```

```bash
nvm install --lts && nvm use --lts
```

### 关键脚本（package.json）

v1（Vinxi）项目典型脚本：

```json
{
  "scripts": {
    "dev": "vinxi dev",
    "build": "vinxi build",
    "start": "vinxi start",
    "version": "vinxi version"
  }
}
```

| 脚本 | 命令 | 用途 |
|---|---|---|
| `dev` | `vinxi dev` | 开发模式（HMR + SSR），端口 3000 |
| `build` | `vinxi build` | 生产构建（同时输出 client / server bundle） |
| `start` | `vinxi start` | 启动构建好的生产服务器 |
| `version` | `vinxi version` | 输出 Vinxi 版本 |

v2（Vite 直接）：

```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "start": "vite preview"
  }
}
```

## 项目结构

`basic` 模板生成的典型结构：

```text
my-app/
├── public/                       # 静态资源（不经 bundler）
│   └── favicon.ico
├── src/
│   ├── routes/                   # ✨ 文件路由（核心）
│   │   ├── index.tsx             # /（首页）
│   │   └── about.tsx             # /about
│   ├── components/               # 可复用组件（非路由）
│   │   └── Counter.tsx
│   ├── app.tsx                   # 应用根（Router + FileRoutes）
│   ├── app.css                   # 全局样式
│   ├── entry-client.tsx          # 客户端 hydration 入口
│   └── entry-server.tsx          # 服务端渲染入口
├── app.config.ts                 # SolidStart 配置（v1，基于 defineConfig）
├── tsconfig.json
├── vite.config.ts                # v2 替代 app.config.ts
└── package.json
```

`src/` 通过 path alias `~/` 引用——`import { Counter } from "~/components/Counter"`。

### `app.tsx`：应用根

这是「HTML 渲染根」——Router + FileRoutes 在这里装配：

```tsx
// src/app.tsx
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";

export default function App() {
  return (
    <Router
      root={(props) => (
        <>
          <nav>
            <a href="/">Home</a> | <a href="/about">About</a>
          </nav>
          {/* Suspense 包裹 children 避免 hydration 错误 */}
          <Suspense>{props.children}</Suspense>
        </>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
```

**关键点**：

- `<Router>` 是 `@solidjs/router` 的路由根
- `root` prop 是「**所有路由共享的外层布局**」——把 `<nav>` / `<header>` 放这里
- `<FileRoutes />` 是 `@solidjs/start/router` 提供的「自动从 `src/routes/` 加载路由表」组件
- `<Suspense>` 包裹 `props.children` 几乎是必须的——因为 `query()` / `createAsync()` 数据加载需要 Suspense

> **`<Suspense>` 为什么必须？** SolidStart 的数据加载基于 Solid 的 Resource + Suspense 机制——`createAsync()` 在数据未就绪时会 throw promise，由最近的 `<Suspense>` 捕获并显示 fallback。没有 Suspense 会触发 hydration 错误。

### `entry-server.tsx`：SSR 入口

服务端渲染的「HTML shell」——包裹应用，注入 assets / scripts：

```tsx
// src/entry-server.tsx
// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="zh-CN">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
```

**关键点**：

- `createHandler` 创建服务端处理函数——默认是 **stream 模式**（Suspense 准备好的部分先发，未准备好的部分稍后流式发送）
- `<StartServer document={...}>` 把整个 `<html>` 树交给你定义
- `assets` / `scripts` / `children` 三个 prop 是 SolidStart 注入的：
  - `assets`：CSS link 标签等，必须放 `<head>`
  - `children`：应用渲染结果，放 `<body>` 内
  - `scripts`：hydration 所需 JS，放 `</body>` 前

> **几乎不需要改这个文件**——除非要加 nonce / CSP / 自定义 `<head>` 标签。

### `entry-client.tsx`：客户端 hydration 入口

```tsx
// src/entry-client.tsx
// @refresh reload
import { mount, StartClient } from "@solidjs/start/client";

mount(() => <StartClient />, document.getElementById("app")!);
```

**关键点**：

- `mount()` 是 SolidStart 提供的 hydration 入口
- 在 islands 模式下会自动处理 island hydration
- **几乎不需要改这个文件**——除非要注册 Service Worker 或 polyfill

```tsx
// 示例：注册 Service Worker（仅生产）
mount(() => <StartClient />, document.getElementById("app")!);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}
```

### `app.config.ts`：SolidStart 配置（v1）

```ts
// app.config.ts
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  // 默认 SSR + Streaming
  ssr: true,
  // 部署预设（Nitro）——可选 17+ 平台
  server: {
    preset: "node-server", // 默认；可改 vercel / cloudflare-pages / netlify / static / ...
  },
});
```

> **空配置也合法**：`export default defineConfig({})` 即用全部默认值——SSR + Streaming + node-server 预设。

## 第一个组件 + 路由

### 文件路由约定

| 文件路径 | URL |
|---|---|
| `src/routes/index.tsx` | `/` |
| `src/routes/about.tsx` | `/about` |
| `src/routes/blog/index.tsx` | `/blog` |
| `src/routes/blog/[slug].tsx` | `/blog/:slug` |
| `src/routes/users/[id]/profile.tsx` | `/users/:id/profile` |
| `src/routes/files/[...rest].tsx` | `/files/*`（捕获所有剩余路径） |
| `src/routes/(marketing)/about.tsx` | `/about`（括号目录不映射 URL，仅分组） |
| `src/routes/api/hello.ts` | `/api/hello`（API 路由，导出 `GET` / `POST` 等） |

### 第一个静态页面

```tsx
// src/routes/about.tsx
export default function About() {
  return (
    <main>
      <h1>关于我们</h1>
      <p>这是一个 SolidStart 应用。</p>
    </main>
  );
}
```

访问 `http://localhost:3000/about` 即可看到。

### 第一个动态路由

```tsx
// src/routes/users/[id].tsx
import { useParams } from "@solidjs/router";

export default function UserPage() {
  const params = useParams();
  // params.id 自动从 URL 提取
  return (
    <main>
      <h1>用户 {params.id}</h1>
    </main>
  );
}
```

访问 `/users/42` → 渲染「用户 42」。

> **注意**：`params` 是「**响应式的 getter**」——`params.id` 是 getter，路由变化时自动更新。不能解构 `const { id } = params`，会失去响应性。

### 第一个计数器组件

```tsx
// src/components/Counter.tsx
import { createSignal } from "solid-js";

/**
 * 简单计数器组件
 * - createSignal 返回 [getter, setter]
 * - 组件函数只运行一次，count 后续变化只更新单个文本节点
 */
export function Counter() {
  const [count, setCount] = createSignal(0);
  return (
    <button onClick={() => setCount(count() + 1)}>
      Clicked {count()} times
    </button>
  );
}
```

在路由中使用：

```tsx
// src/routes/index.tsx
import { Counter } from "~/components/Counter";

export default function Home() {
  return (
    <main>
      <h1>Welcome to SolidStart</h1>
      <Counter />
    </main>
  );
}
```

**Solid 与 React 的核心差异**（详见 Solid 笔记的 [getting-started](../../ui/solid/getting-started.md)）：

- `class` 不是 `className`
- 信号是 getter 函数：`count()` 而非 `count`
- 组件**只运行一次**——`createSignal` 之后的代码只在组件挂载时跑
- 事件用 `onClick` 或 `onclick`（都可以）

### 导航：`<a>` 与 `<A>`

`@solidjs/router` 提供了 `<A>` 组件，是 SPA 风格的链接：

```tsx
import { A } from "@solidjs/router";

export default function Nav() {
  return (
    <nav>
      {/* 推荐：SPA 风格导航（不重新加载页面） */}
      <A href="/">首页</A>
      <A href="/about" activeClass="active">关于</A>
      <A href="/blog/intro" inactiveClass="muted">博客</A>

      {/* 也可以用原生 <a>（会全量 reload）——除非显式禁用 */}
      <a href="/contact">联系（reload）</a>
    </nav>
  );
}
```

> **`<A>` 自动 prefetch**：默认 hover 时预取目标路由（含 query 数据）；点击切换 SPA 不重新加载页面。

编程式导航：

```tsx
import { useNavigate } from "@solidjs/router";

export default function LoginButton() {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate("/dashboard")}>
      去仪表盘
    </button>
  );
}
```

## 第一个 `query()` + `createAsync()`：数据加载

这是 SolidStart 数据流的**核心 API**——`query()` 定义「带 key 的可缓存数据获取函数」，`createAsync()` 在组件中订阅它：

```tsx
// src/routes/posts.tsx
import { For, ErrorBoundary, Suspense } from "solid-js";
import { query, createAsync, type RouteDefinition } from "@solidjs/router";

/**
 * 定义一个可缓存的数据加载函数
 * - query 第二参数 "posts" 是全局唯一 key
 * - 函数顶部加 "use server" → 仅在服务器执行（API 密钥安全）
 */
const getPosts = query(async () => {
  "use server";
  const res = await fetch("https://jsonplaceholder.typicode.com/posts");
  return (await res.json()) as Array<{ id: number; title: string }>;
}, "posts");

/**
 * 路由级 preload——在路由切换时先于组件渲染开始加载数据
 * 配合 <A> 的 hover prefetch 实现「点击前数据已就绪」
 */
export const route = {
  preload: () => getPosts(),
} satisfies RouteDefinition;

export default function PostsPage() {
  // createAsync 订阅 query 结果——返回 () => T | undefined
  const posts = createAsync(() => getPosts());

  return (
    <main>
      <h1>所有文章</h1>
      <ErrorBoundary fallback={(err) => <p>加载失败: {err.message}</p>}>
        <Suspense fallback={<p>加载中...</p>}>
          <ul>
            <For each={posts()}>
              {(post) => <li>{post.title}</li>}
            </For>
          </ul>
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
```

**关键点**：

- `query(fn, "key")` 返回一个**带缓存的可调用函数**——同样的 key + 参数会命中缓存
- `"use server"` 指令让函数仅在服务器执行（敏感操作 / 数据库 / API 密钥安全）
- `createAsync(() => getPosts())` 返回的是 `Accessor<T | undefined>`——访问用 `posts()`
- `route.preload` 是 SolidStart 的路由级 preload——在路由切换时立即调用，与组件渲染并行
- `<For each={...}>` 是 Solid 的细粒度列表组件（自动 key，避免重新渲染）
- `<Suspense>` 处理「数据未就绪」期间的 fallback；`<ErrorBoundary>` 处理 query 抛出的错误

### 带参数的 query

```tsx
// src/routes/posts/[id].tsx
import { ErrorBoundary, Suspense } from "solid-js";
import { query, createAsync, type RouteDefinition } from "@solidjs/router";

const getPost = query(async (id: string) => {
  "use server";
  const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);
  if (!res.ok) throw new Error("Not Found");
  return (await res.json()) as { id: number; title: string; body: string };
}, "post");

// preload 接收 RouteSectionProps，可拿到 params
export const route = {
  preload: ({ params }) => getPost(params.id),
} satisfies RouteDefinition;

export default function PostPage(props: { params: { id: string } }) {
  const post = createAsync(() => getPost(props.params.id));

  return (
    <article>
      <ErrorBoundary fallback={<p>文章不存在</p>}>
        <Suspense fallback={<p>加载中...</p>}>
          <h1>{post()?.title}</h1>
          <p>{post()?.body}</p>
        </Suspense>
      </ErrorBoundary>
    </article>
  );
}
```

**核心点**：

- `query` 接受参数；调用时参数会作为 cache key 的一部分（如 `["post", "1"]` / `["post", "2"]` 独立缓存）
- 参数从 `params` 拿到——SolidStart 自动注入

## 第一个 `action()`：表单 + 副作用

`action()` 用于「**写操作 + 副作用**」（数据库写入 / 邮件发送 / 登录 / 等）——配合原生 `<form>` 提交，**无 JS 也可工作**：

```tsx
// src/routes/contact.tsx
import { action } from "@solidjs/router";

/**
 * 定义一个 action
 * - 第一参数：处理函数（接收 FormData）
 * - 第二参数：全局唯一 key（用于 useSubmission 订阅）
 * - "use server" 让函数仅在服务器执行
 */
const sendContactAction = action(async (formData: FormData) => {
  "use server";
  const name = formData.get("name")?.toString();
  const message = formData.get("message")?.toString();

  // 模拟发邮件 / 数据库写入
  console.log("收到留言：", { name, message });
  await new Promise((r) => setTimeout(r, 500)); // 模拟延迟
}, "sendContact");

export default function ContactPage() {
  return (
    <main>
      <h1>联系我们</h1>
      {/* 注意：action 直接传给 form 的 action 属性 */}
      <form action={sendContactAction} method="post">
        <label>
          姓名：<input name="name" required />
        </label>
        <label>
          留言：<textarea name="message" required />
        </label>
        <button>发送</button>
      </form>
    </main>
  );
}
```

**核心点**：

- `action(fn, "key")` 返回的对象可直接传给 `<form action={...}>`
- 表单 `method="post"` 是必须的——SolidStart 拦截 POST 提交并调用 action
- 处理函数接收的是浏览器原生 `FormData`——用 `.get("name")` 读取字段
- `"use server"` 让处理函数仅在服务器执行
- **JS 禁用时也能工作**——原生 `<form>` 会作为 POST 请求发送到当前页面，SolidStart 服务端拦截并执行 action（渐进增强）

### 显示提交状态：`useSubmission`

```tsx
import { Show } from "solid-js";
import { action, useSubmission } from "@solidjs/router";

const sendContactAction = action(async (formData: FormData) => {
  "use server";
  await new Promise((r) => setTimeout(r, 1000));
}, "sendContact");

export default function ContactPage() {
  // 订阅 action 的提交状态
  const submission = useSubmission(sendContactAction);

  return (
    <form action={sendContactAction} method="post">
      <input name="name" required />
      <textarea name="message" required />
      <button disabled={submission.pending}>
        {submission.pending ? "发送中..." : "发送"}
      </button>
      <Show when={submission.error}>
        <p style={{ color: "red" }}>提交失败：{submission.error?.message}</p>
      </Show>
      <Show when={submission.result !== undefined && !submission.pending}>
        <p style={{ color: "green" }}>发送成功！</p>
      </Show>
    </form>
  );
}
```

**`useSubmission` 返回字段**：

- `pending: boolean`：提交进行中
- `result: T | undefined`：成功后的返回值
- `error: Error | undefined`：失败的错误
- `input: any[]`：提交时的参数（FormData 等）
- `clear()`：重置状态
- `retry()`：用相同参数重新提交

## `"use server"` 指令：服务器函数

这是 SolidStart 的**核心机制**——任何 async function 顶部加 `"use server"`，即变为「**在服务器执行的函数**」，但可以**从 client 直接调用**：

```ts
// src/lib/db.ts
"use server";  // 整个文件都是服务器函数

import { drizzle } from "drizzle-orm/postgres-js";
// ... drizzle 初始化
export const db = drizzle(/* ... */);

export async function getUsers() {
  return await db.select().from(users);
}

export async function createUser(name: string) {
  return await db.insert(users).values({ name });
}
```

```tsx
// src/routes/users.tsx
import { createAsync, query } from "@solidjs/router";
import { getUsers } from "~/lib/db";

// query 包装一下让它支持缓存 + preload
const getUsersQuery = query(() => getUsers(), "users");

export default function UsersPage() {
  const users = createAsync(() => getUsersQuery());
  return <ul>{/* ... */}</ul>;
}
```

**核心点**：

- `"use server"` 可放在 **函数顶部**（仅该函数）或 **文件顶部**（整个文件）
- 标记为 server function 的函数会被 SolidStart 的 Vite plugin 转换——client 端调用时变为 HTTP 请求
- 函数参数和返回值会被自动序列化（JSON 或 JS payload，可配置）
- **不可序列化的参数会报错**：class 实例 / function / Symbol / DOM 等
- 你可以**从 client 端任意位置调用** `getUsers()`，效果是 fetch 到 SolidStart 自动创建的端点

### `"use server"` 与 React Server Components 的差异

| 维度 | SolidStart `"use server"` | React Server Components `"use server"` |
|---|---|---|
| 含义 | 函数会在**服务器执行**，可从 client 调用 | 同样（React 19 的 Server Actions） |
| 边界标记 | 函数级 / 文件级 | 函数级 / 文件级 |
| 调用方式 | 直接 `await fn(args)` | 直接 `await fn(args)` 或绑定 `<form action={fn}>` |
| RSC 概念 | **没有 Server Components / Client Components 区分** | 有；默认是 Server Component |
| `"use client"` | **不需要** | 需要（标记 Client Component） |
| 渲染模型 | 整个组件树都在 client 渲染（hydrate） | Server Components 在服务器渲染并发送 RSC payload |
| 心智模型 | **更简单**——只有「函数在哪边执行」 | 更复杂——既要管「组件在哪边」又要管「函数在哪边」 |

**含义**：SolidStart 的 `"use server"` 名字与 React 完全相同，但**整个心智模型简单一档**——你不需要分 Server / Client Components，只需要分 Server Functions / 客户端代码。

### 隔离规则

```tsx
// ❌ 错误：服务器函数引用了客户端模块
const queryWindow = query(async () => {
  "use server";
  return window.location.href; // ReferenceError: window is not defined
}, "windowQuery");

// ❌ 错误：从 server function 返回不可序列化的值
const getDb = query(async () => {
  "use server";
  return db; // class 实例不能序列化
}, "getDb");

// ✅ 正确：在服务器读取环境变量 / 数据库 / 文件系统
const getSecret = query(async () => {
  "use server";
  return process.env.API_SECRET; // 仅服务器有此变量
}, "secret");

// ✅ 正确：返回 JSON 友好的数据
const getUser = query(async (id: string) => {
  "use server";
  const user = await db.users.findUnique({ where: { id } });
  return user; // 普通对象，可序列化
}, "user");
```

## 第一个完整示例：博客详情 + 评论

把上面的 `query` + `action` + `useSubmission` 串起来：

```tsx
// src/routes/posts/[id].tsx
import { For, Show, Suspense, ErrorBoundary } from "solid-js";
import {
  query,
  action,
  createAsync,
  useSubmission,
  type RouteDefinition,
} from "@solidjs/router";

/** 获取文章详情 */
const getPost = query(async (id: string) => {
  "use server";
  // 模拟数据库
  return {
    id,
    title: "Hello SolidStart",
    body: "这是文章内容",
  };
}, "post");

/** 获取该文章的所有评论 */
const getComments = query(async (postId: string) => {
  "use server";
  return [
    { id: 1, postId, author: "Alice", content: "👍" },
    { id: 2, postId, author: "Bob", content: "🎉" },
  ];
}, "comments");

/** 添加评论 */
const addComment = action(async (formData: FormData) => {
  "use server";
  const postId = formData.get("postId")?.toString();
  const author = formData.get("author")?.toString();
  const content = formData.get("content")?.toString();
  // 模拟写入数据库
  await new Promise((r) => setTimeout(r, 500));
  console.log("新评论：", { postId, author, content });
  // action 完成后 SolidStart 会自动 revalidate 同 key 的 query
}, "addComment");

export const route = {
  preload: ({ params }) => {
    // 同时预加载文章 + 评论
    getPost(params.id);
    getComments(params.id);
  },
} satisfies RouteDefinition;

export default function PostPage(props: { params: { id: string } }) {
  const post = createAsync(() => getPost(props.params.id));
  const comments = createAsync(() => getComments(props.params.id));
  const submission = useSubmission(addComment);

  return (
    <main>
      <ErrorBoundary fallback={<p>加载失败</p>}>
        <Suspense fallback={<p>加载中...</p>}>
          <article>
            <h1>{post()?.title}</h1>
            <p>{post()?.body}</p>
          </article>

          <section>
            <h2>评论</h2>
            <ul>
              <For each={comments()}>
                {(c) => <li><b>{c.author}</b>: {c.content}</li>}
              </For>
              {/* Optimistic UI：提交中显示「即将添加的评论」 */}
              <Show when={submission.pending}>
                <li style={{ opacity: 0.5 }}>
                  <b>{submission.input?.[0]?.get("author")?.toString()}</b>:{" "}
                  {submission.input?.[0]?.get("content")?.toString()}
                </li>
              </Show>
            </ul>

            <form action={addComment} method="post">
              <input type="hidden" name="postId" value={props.params.id} />
              <input name="author" placeholder="你的名字" required />
              <textarea name="content" placeholder="评论内容" required />
              <button disabled={submission.pending}>
                {submission.pending ? "提交中..." : "提交评论"}
              </button>
            </form>
          </section>
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
```

**这个示例展示了**：

- `query` 拿数据 + `route.preload` 预加载
- `action` 写数据 + `useSubmission` 显示状态
- Optimistic UI（`submission.pending` 时显示乐观更新）
- Single-flight mutation——action 成功后**自动 revalidate** 同 key 的 query（评论会自动刷新）

## 添加 Meta 标签（SEO）

```bash
pnpm add @solidjs/meta
```

```tsx
// src/app.tsx
import { MetaProvider, Title, Meta } from "@solidjs/meta";

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Title>我的 SolidStart 应用</Title>
          <Meta name="description" content="一个 SolidStart 示例" />
          <Suspense>{props.children}</Suspense>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
```

页面级覆盖：

```tsx
// src/routes/about.tsx
import { Title, Meta } from "@solidjs/meta";

export default function About() {
  return (
    <main>
      <Title>关于我们 | 我的 SolidStart 应用</Title>
      <Meta name="description" content="关于页面" />
      <h1>关于我们</h1>
    </main>
  );
}
```

> **`<Title>` 的覆盖规则**：页面级 `<Title>` 会**覆盖**根级的——SolidStart 会按组件挂载顺序应用。

## API Routes：自定义 endpoint

`src/routes/api/` 下的文件如果导出 `GET` / `POST` / `PATCH` / `DELETE` 等命名导出（**没有 default export**），就是 API 路由：

```ts
// src/routes/api/hello.ts
import type { APIEvent } from "@solidjs/start/server";

export async function GET(event: APIEvent) {
  return new Response(JSON.stringify({ message: "Hello" }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(event: APIEvent) {
  const body = await event.request.json();
  return new Response(JSON.stringify({ received: body }));
}
```

```ts
// src/routes/api/users/[id].ts
import type { APIEvent } from "@solidjs/start/server";

export async function GET(event: APIEvent) {
  const id = event.params.id;
  return Response.json({ id, name: "Alice" });
}
```

调用：

```bash
curl http://localhost:3000/api/users/42
# {"id":"42","name":"Alice"}
```

> **API 路由 vs Server Function**：服务器函数（`"use server"`）是「**在 client 端代码中调用的远程函数**」，SolidStart 自动生成端点；API 路由是「**显式的 HTTP endpoint**」，可被任何 HTTP 客户端（curl / 移动端 / 第三方）调用。

## 调试

### Solid Devtools

```bash
pnpm add -D solid-devtools
```

在 `vite.config.ts` 或 `app.config.ts` 加 plugin：

```ts
// app.config.ts (v1)
import { defineConfig } from "@solidjs/start/config";
import devtools from "solid-devtools/vite";

export default defineConfig({
  vite: {
    plugins: [devtools()],
  },
});
```

浏览器装 [Solid Devtools 扩展](https://github.com/thetarnav/solid-devtools)，可看响应式图 / signal 依赖 / 组件树。

### Network 调试

- 服务器函数调用：DevTools 的 Network 面板能看到对 `/_server` 端点的 POST 请求（payload 是函数参数 + 函数 id）
- 路由切换：能看到 RSC 风格的 streaming 响应
- HMR：Vinxi / Vite 提供热更新

## 接下来读什么

完成本入门后建议按顺序读：

- [指南](./guide-line.md)：文件路由全集 / 嵌套 layout / 路由组 / Server Functions 深入 / `query()` 缓存机制 / `action()` 高级（`.with` / `useSubmissions` / single-flight） / Middleware / Session / Cookie / API Routes / Head & Metadata / 渲染模式 / Adapter / v1 → v2 迁移
- [参考](./reference.md)：API 速查 / 内置组件 / 文件约定 / `app.config.ts` 全部选项 / Adapter Preset 列表 / 常见 import 来源
