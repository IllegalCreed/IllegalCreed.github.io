---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 SolidStart 1.x（`@solidjs/start` / `@solidjs/router` / `@solidjs/meta`） —— 文件路由全集 / 嵌套 layout / Server Functions 深入 / `query` + `action` 数据流 / Middleware / Session / Cookie / API Routes / Meta SEO / 渲染模式 / Adapter / v1 → v2 迁移 / 常见踩坑

## 文件路由：完整规则

SolidStart 的路由是基于 `@solidjs/router` 的「**文件即路由**」约定——通过 `<FileRoutes />` 自动从 `src/routes/` 加载路由树。

### 路径映射规则

| 文件路径 | URL | 说明 |
|---|---|---|
| `src/routes/index.tsx` | `/` | 首页 |
| `src/routes/about.tsx` | `/about` | 静态路由 |
| `src/routes/about/index.tsx` | `/about` | 等价（更适合有子路由时） |
| `src/routes/users/[id].tsx` | `/users/:id` | 动态段（必填） |
| `src/routes/users/[[id]].tsx` | `/users` 或 `/users/:id` | 可选动态段（v2 起） |
| `src/routes/blog/[...rest].tsx` | `/blog/*`（捕获所有） | 通配段 |
| `src/routes/(marketing)/about.tsx` | `/about` | 路由组（括号不映射 URL） |
| `src/routes/users.tsx` + `routes/users/`目录 | `/users` 嵌套 layout | 同名文件即 layout |
| `src/routes/api/hello.ts` | `/api/hello`（API） | 无 default export，导出 `GET`/`POST` 等 |

### 动态段：`useParams`

`useParams` 返回响应式 getter 对象——**不能解构**：

```tsx
import { useParams } from "@solidjs/router";

export default function UserPage() {
  const params = useParams<{ id: string }>();
  // ✅ 正确：params.id 是 getter，路由变化自动更新
  return <div>User {params.id}</div>;
}
```

```tsx
// ❌ 错误：解构会失去响应性
export default function UserPage() {
  const { id } = useParams();
  return <div>User {id}</div>;  // 路由变化时不更新
}
```

### 通配段：`[...rest]`

```tsx
// src/routes/files/[...path].tsx
import { useParams } from "@solidjs/router";

export default function FilesPage() {
  const params = useParams<{ path: string }>();
  // 访问 /files/a/b/c.txt → params.path === "a/b/c.txt"
  return <p>路径: {params.path}</p>;
}
```

### 路由组：`(name)`

括号包裹的目录名**不映射到 URL**，只用于组织文件 / 共享 layout：

```text
src/routes/
├── (marketing)/         <- 路由组（不在 URL 中体现）
│   ├── about.tsx        <- /about
│   └── contact.tsx      <- /contact
└── (app)/
    ├── dashboard.tsx    <- /dashboard
    └── settings.tsx     <- /settings
```

通常用于「**不同 layout 的页面分组**」——见下方嵌套 Layout。

### 用括号转义嵌套

有时你想让一个 URL 的不同段使用**完全不同的 layout**——用括号转义嵌套：

```text
src/routes/
├── users.tsx                 <- /users 的 layout
├── users/
│   ├── index.tsx             <- /users（用上面的 layout）
│   └── projects.tsx          <- /users/projects（用上面的 layout）
├── users(details).tsx        <- 不同的 layout
└── users(details)/
    └── [id].tsx              <- /users/:id（用新的 layout）
```

`users(details).tsx` 实际是 `/users/:id` 的 layout——文件名 `users(details)` 表示「URL 是 users，但 layout 文件名加 `(details)` 后缀以避免与上面的 `users.tsx` 冲突」。

## 嵌套 Layout

### 同名 layout 文件

最简单的嵌套——`routes/blog.tsx` 是 `routes/blog/` 下所有路由的 layout：

```tsx
// src/routes/blog.tsx —— /blog/* 共享的 layout
import { RouteSectionProps } from "@solidjs/router";

export default function BlogLayout(props: RouteSectionProps) {
  return (
    <div class="blog-layout">
      <header>
        <h1>博客</h1>
        <nav>
          <a href="/blog">首页</a> | <a href="/blog/archive">归档</a>
        </nav>
      </header>
      <main>{props.children}</main>
      <footer>© 2026 My Blog</footer>
    </div>
  );
}
```

```tsx
// src/routes/blog/index.tsx —— /blog
export default function BlogHome() {
  return <p>欢迎来到博客</p>;
}

// src/routes/blog/[slug].tsx —— /blog/:slug
import { useParams } from "@solidjs/router";
export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  return <article>正在阅读：{params.slug}</article>;
}
```

访问 `/blog/hello-world` → `BlogLayout` 包裹 `BlogPost`。

### 根 layout（`app.tsx` 的 `root` prop）

整个应用共享的最外层 layout 在 `app.tsx` 的 `Router.root` prop 中定义：

```tsx
// src/app.tsx
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";

export default function App() {
  return (
    <Router
      root={(props) => (
        <>
          <header class="site-header">
            <nav>
              <a href="/">Home</a>
              <a href="/blog">Blog</a>
            </nav>
          </header>
          <Suspense>{props.children}</Suspense>
          <footer class="site-footer">© 2026</footer>
        </>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
```

> **嵌套 vs 根 layout**：`app.tsx` 的 `root` prop 永远在最外层（所有路由都用）；同名 layout 文件（如 `blog.tsx`）只对该子树生效。

### 路由组的 layout

把不同 layout 的页面用路由组分开：

```text
src/routes/
├── (marketing).tsx          <- /about /contact 用这个 layout
├── (marketing)/
│   ├── about.tsx
│   └── contact.tsx
├── (app).tsx                <- /dashboard /settings 用这个 layout
└── (app)/
    ├── dashboard.tsx
    └── settings.tsx
```

`(marketing).tsx` 和 `(app).tsx` 是各自分组的 layout。

## Server Functions（`"use server"` 指令）

### 基础用法

任何 async 函数顶部加 `"use server"` 即变为服务器函数：

```tsx
// 函数级 directive
const greet = async (name: string) => {
  "use server";
  // 这段代码只在服务器执行
  return `Hello, ${name}!`;
};

// 在 client 端调用
const message = await greet("World");
console.log(message); // Hello, World!
```

或者整个文件级：

```ts
// src/lib/db.ts
"use server";  // ← 整个文件都是服务器函数

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client);

export async function getUsers() {
  return await db.select().from(users);
}

export async function createUser(name: string) {
  return await db.insert(users).values({ name }).returning();
}
```

### 编译后的样子

`"use server"` 函数会被 SolidStart 的 Vite plugin 改写——client 端的引用变成 fetch 调用：

```tsx
// 源代码
const greet = async (name: string) => {
  "use server";
  return `Hello, ${name}!`;
};

// Client 端编译后大致
const greet = async (name) => {
  const res = await fetch("/_server", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-server-id": "greet#abc123",
    },
    body: JSON.stringify([name]),
  });
  return await res.json();
};
```

**关键点**：

- Server 端 bundle 包含真实实现
- Client 端 bundle 只包含「fetch wrapper」
- 函数 id 通过 hash 自动生成（不会与其他函数冲突）

### 序列化限制

函数参数 + 返回值会被自动序列化——**不可序列化的值会报错**：

| 类型 | 可序列化吗 |
|---|---|
| 字符串 / 数字 / boolean / null / undefined | ✅ |
| 普通对象 / 数组 | ✅ |
| `Date` | ✅ |
| `Map` / `Set` | ✅（JSON 模式可能丢失，建议 JS 模式） |
| `BigInt` | ✅ |
| `FormData` | ✅（action 专用） |
| `File` / `Blob` | ✅（通过 FormData） |
| Promise（已 resolved） | ✅ |
| `Response` 对象 | ✅（特殊处理） |
| **class 实例** | ❌ |
| **function** | ❌ |
| **DOM 元素** | ❌ |
| **Symbol** | ❌ |

### 在 server function 中访问请求上下文

服务器函数可以通过 vinxi/http 访问当前请求：

```tsx
import { getRequestEvent } from "solid-js/web";
import { getCookie, getHeader, useSession } from "vinxi/http";

async function getCurrentUser() {
  "use server";
  // 方式 1：getRequestEvent
  const event = getRequestEvent();
  const cookie = event?.request.headers.get("cookie");

  // 方式 2：vinxi/http 的辅助函数（推荐）
  const sessionCookie = getCookie("session");
  const userAgent = getHeader("user-agent");

  // 方式 3：session helper
  const session = await useSession({
    password: process.env.SESSION_SECRET!,
    name: "session",
  });

  return { userId: session.data.userId, userAgent };
}
```

## `query()`：数据加载

`query()` 是 SolidStart 数据流的**核心**——它包装一个 async 函数，提供：

1. **缓存**（同样的 key + 参数命中缓存）
2. **revalidation**（action 完成后自动 refresh）
3. **single-flight mutation**（mutation + revalidate 合并为单次请求）
4. **preload**（路由级提前加载）

### 基础形式

```tsx
import { query, createAsync, For } from "solid-js";

const getPosts = query(async () => {
  "use server";
  return await db.posts.findMany();
}, "posts");  // ← 第二参数是 cache key，全局唯一

// 在组件中订阅
export default function Page() {
  const posts = createAsync(() => getPosts());
  return (
    <ul>
      <For each={posts()}>{(p) => <li>{p.title}</li>}</For>
    </ul>
  );
}
```

### 带参数的 query

参数会作为 cache key 的一部分——相同的 key + 不同参数会有独立缓存：

```tsx
const getPost = query(async (id: string) => {
  "use server";
  return await db.posts.findUnique({ where: { id } });
}, "post");

// 调用
const post = createAsync(() => getPost("1"));
// 自动 cache key: ["post", "1"]

const post2 = createAsync(() => getPost("2"));
// 自动 cache key: ["post", "2"]，不互相影响
```

### `route.preload`：路由级预加载

`route.preload` 会在「**路由切换前**」就开始执行——配合 `<A>` 组件的 hover prefetch 实现「点击前数据已就绪」：

```tsx
import { query, createAsync, type RouteDefinition } from "@solidjs/router";

const getPost = query(async (id: string) => {
  "use server";
  return await db.posts.findUnique({ where: { id } });
}, "post");

// 关键：导出 route 对象 + preload
export const route = {
  preload: ({ params }) => getPost(params.id),
} satisfies RouteDefinition;

export default function PostPage(props: { params: { id: string } }) {
  const post = createAsync(() => getPost(props.params.id));
  return <article>{post()?.title}</article>;
}
```

**preload 的执行时机**：

1. **hover `<A>` 链接**：开始 preload（与导航并行）
2. **点击 `<A>` 链接**：如果 preload 已完成，立即渲染；否则继续等待
3. **直接访问 URL（SSR）**：preload 在 server 上执行
4. **路由切换（SPA）**：preload 在 client 上执行

### `createAsync()` 选项

```tsx
const post = createAsync(() => getPost(id), {
  // 初始值（fallback，Suspense 不触发）
  initialValue: { id, title: "Loading..." },
  // 默认 deferStream: false（流式 SSR）；
  // 如果 query 可能设置 headers / redirect，需要 deferStream: true
  deferStream: true,
});
```

### `deferStream`：流式 SSR 的陷阱

> 「Cannot set headers after they are sent to the client」是 SolidStart 最常见的 SSR 错误——一旦流开始发送，就不能再设 headers。

如果你的 query 可能调用 `redirect()` 或修改 cookie：

```tsx
const getUserOrRedirect = query(async () => {
  "use server";
  const session = await useSession({ /* ... */ });
  if (!session.data.userId) throw redirect("/login");
  return await db.user.get(session.data.userId);
}, "user");

// ❌ 错误：流可能已开始，redirect 报错
const user = createAsync(() => getUserOrRedirect());

// ✅ 正确：deferStream 让 SSR 等数据完成再开始流
const user = createAsync(() => getUserOrRedirect(), { deferStream: true });
```

## `action()`：表单与副作用

`action()` 用于「**写操作**」——配合 `<form>` 提交，**渐进增强**（无 JS 也可用）。

### 基础用法

```tsx
import { action } from "@solidjs/router";

const createPost = action(async (formData: FormData) => {
  "use server";
  const title = formData.get("title") as string;
  await db.posts.create({ title });
}, "createPost");

export default function NewPostPage() {
  return (
    <form action={createPost} method="post">
      <input name="title" required />
      <button>Create</button>
    </form>
  );
}
```

### 渐进增强的工作原理

- **有 JS**：SolidStart 拦截 `<form>` 的 submit 事件 → 调用 action → 显示返回值 / 错误
- **无 JS**：浏览器原生 POST 当前页面 → SolidStart 服务端拦截 → 调用 action → 重新渲染

> **关键**：原生 `<form action={createPost}>` 中 `createPost` 不是字符串 URL，是 action 对象——SolidStart 的 router 把它转成「向自身 POST + 附带 action id」的 form。

### `useSubmission`：单次提交状态

```tsx
import { Show } from "solid-js";
import { action, useSubmission } from "@solidjs/router";

const submitForm = action(async (formData: FormData) => {
  "use server";
  await new Promise((r) => setTimeout(r, 1000));
  return { success: true, id: Date.now() };
}, "submitForm");

export default function Page() {
  // 订阅最近一次的提交
  const submission = useSubmission(submitForm);

  return (
    <form action={submitForm} method="post">
      <input name="name" />
      <button disabled={submission.pending}>
        {submission.pending ? "提交中..." : "提交"}
      </button>

      <Show when={submission.error}>
        {(err) => <p style={{ color: "red" }}>{err().message}</p>}
      </Show>

      <Show when={submission.result}>
        {(r) => <p>成功：ID = {r().id}</p>}
      </Show>
    </form>
  );
}
```

### `useSubmissions`：多次提交（列表场景）

如果用户连续点击「点赞」等按钮，可以追踪所有进行中的提交：

```tsx
import { For } from "solid-js";
import { action, useSubmissions } from "@solidjs/router";

const likePost = action(async (postId: string) => {
  "use server";
  await db.likes.create({ postId });
}, "likePost");

export default function PostList() {
  // 订阅所有 likePost 的提交（数组）
  const submissions = useSubmissions(likePost);

  return (
    <div>
      <button onClick={() => likePost("1")}>Like Post 1</button>
      <button onClick={() => likePost("2")}>Like Post 2</button>

      <p>进行中：{submissions.filter((s) => s.pending).length}</p>
      <For each={submissions}>
        {(s) => <div>提交于 {s.input?.[0]}</div>}
      </For>
    </div>
  );
}
```

### `action.with()`：预填参数

如果 action 需要额外参数（不在 FormData 里），用 `.with()` 预填：

```tsx
const addComment = action(async (postId: string, formData: FormData) => {
  "use server";
  const content = formData.get("content") as string;
  await db.comments.create({ postId, content });
}, "addComment");

export default function PostPage(props: { params: { id: string } }) {
  return (
    // .with(props.params.id) 把第一参数预填，FormData 是第二参数
    <form action={addComment.with(props.params.id)} method="post">
      <textarea name="content" />
      <button>添加评论</button>
    </form>
  );
}
```

### 程序化触发 action

如果不想用 `<form>`，可以直接调用 action：

```tsx
const likePost = action(async (postId: string) => {
  "use server";
  await db.likes.create({ postId });
}, "likePost");

export default function PostCard(props: { id: string }) {
  return (
    <button onClick={() => likePost(props.id)}>Like</button>
  );
}
```

> **注意**：直接调用 action 是个返回 Promise 的异步操作——`useSubmission` 仍然可以订阅它。

## Single-flight Mutation：自动 revalidate

SolidStart 的杀手锏——**action 成功后自动 revalidate 同 key 的 query**，并把 mutation + revalidate 合并为单次请求：

```tsx
import { query, action, createAsync, type RouteDefinition } from "@solidjs/router";

const getPosts = query(async () => {
  "use server";
  return await db.posts.findMany();
}, "posts");

const createPost = action(async (formData: FormData) => {
  "use server";
  const title = formData.get("title") as string;
  await db.posts.create({ title });
  // ← 不需要手动 revalidate；SolidStart 自动 refresh getPosts
}, "createPost");

export const route = {
  preload: () => getPosts(),
} satisfies RouteDefinition;

export default function PostsPage() {
  const posts = createAsync(() => getPosts());

  return (
    <div>
      <ul>
        <For each={posts()}>{(p) => <li>{p.title}</li>}</For>
      </ul>

      <form action={createPost} method="post">
        <input name="title" />
        <button>添加</button>
      </form>
    </div>
  );
}
```

**Single-flight 的含义**：

- 用户提交表单 → 浏览器发出**一次** POST
- 服务器执行 createPost → 同时执行 getPosts（revalidate）→ 把新列表流式回传
- 浏览器收到响应 → action.result 更新 + posts 数据更新 → UI 一次性刷新

无需手动 `revalidate()` / `mutate()`——靠 query key 自动追踪。

### 手动控制 revalidate

如果你需要更细粒度控制：

```tsx
import { revalidate, reload } from "@solidjs/router";

const createPost = action(async (formData: FormData) => {
  "use server";
  await db.posts.create({ /* ... */ });

  // 显式 revalidate 指定 key
  revalidate("posts");

  // 或全部 revalidate
  revalidate();

  // 或 reload 整个路由（含 layout）
  reload();
}, "createPost");
```

| API | 行为 |
|---|---|
| `revalidate(key?)` | 刷新指定 key 的 query；不传 key 则刷新所有 |
| `revalidate(key, false)` | 标记 stale 但不立即刷新 |
| `reload()` | 重新加载当前路由（含 preload） |

## `redirect` & `reload` & `json`

服务器函数 / action 中通过 `throw` 或 `return` 来重定向 / 设置 headers：

### `redirect`

```tsx
import { redirect, action } from "@solidjs/router";

const logout = action(async () => {
  "use server";
  const session = await useSession({ /* ... */ });
  await session.clear();

  // 重定向到登录页
  throw redirect("/login");
}, "logout");
```

**为什么是 `throw` 而非 `return`**：

- `throw redirect("/login")` 让 TypeScript 把它当 `never`——后续代码不会被认为可能执行
- `return redirect("/login")` 也可以，但 TS 类型推断不如 throw 自然

### `reload`

`reload()` 重新加载当前路由的所有 query：

```tsx
import { reload } from "@solidjs/router";

const refreshProfile = action(async () => {
  "use server";
  await syncFromExternal();
  throw reload();
}, "refresh");
```

### `json`：自定义响应

服务器函数返回 `json(data, { headers, status })` 可以控制 HTTP 响应：

```tsx
import { json } from "@solidjs/router";

const getApi = async () => {
  "use server";
  return json(
    { hello: "world" },
    {
      status: 200,
      headers: {
        "Cache-Control": "max-age=60",
        "X-Custom": "value",
      },
    }
  );
};
```

## Middleware

Middleware 在「**所有路由 / action / query**」之前执行——用于鉴权 / 日志 / CORS / nonce / 等。

### 启用 Middleware

在 `app.config.ts`（v1）声明 middleware 文件：

```ts
// app.config.ts
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  middleware: "src/middleware/index.ts",
});
```

### 定义 Middleware

```ts
// src/middleware/index.ts
import { createMiddleware } from "@solidjs/start/middleware";

export default createMiddleware({
  // 请求开始时执行
  onRequest: (event) => {
    console.log("Request:", event.request.url);
    // 记录开始时间到 locals（请求作用域共享数据）
    event.locals.startTime = Date.now();
  },
  // 响应发送前执行
  onBeforeResponse: (event) => {
    const duration = Date.now() - event.locals.startTime;
    console.log(`Took ${duration}ms`);
    // 添加响应 header
    event.response.headers.set("Server-Timing", `total;dur=${duration}`);
  },
});
```

### `event.locals`：请求作用域共享

`event.locals` 是 per-request 的存储——middleware 可以塞数据，server function 通过 `getRequestEvent()` 读取：

```ts
// src/middleware/index.ts
import { createMiddleware } from "@solidjs/start/middleware";
import { useSession } from "vinxi/http";

export default createMiddleware({
  onRequest: async (event) => {
    const session = await useSession({
      password: process.env.SESSION_SECRET!,
      name: "session",
    });
    // 把用户 ID 塞到 locals
    event.locals.userId = session.data.userId;
  },
});
```

```ts
// 任意 server function 都能拿到
import { getRequestEvent } from "solid-js/web";

async function getProfile() {
  "use server";
  const event = getRequestEvent();
  const userId = event?.locals.userId;
  if (!userId) throw redirect("/login");
  return await db.user.findUnique({ where: { id: userId } });
}
```

### 中间件中拦截响应

```ts
import { createMiddleware } from "@solidjs/start/middleware";
import { json } from "@solidjs/router";

export default createMiddleware({
  onRequest: (event) => {
    // 拦截：未授权直接返回 401
    if (event.request.url.includes("/api/private")) {
      const auth = event.request.headers.get("Authorization");
      if (!auth) return json({ error: "Unauthorized" }, { status: 401 });
    }
  },
});
```

返回 Response 会**中断 middleware chain**，直接发回客户端。

## Sessions & Cookies

SolidStart 使用 Vinxi（基于 H3 / unjs）提供的 session 工具——加密 cookie 模式（不需要服务器存储）。

### 配置 session

```ts
// 在 server function / middleware 中
import { useSession } from "vinxi/http";

async function getOrCreateSession() {
  "use server";
  const session = await useSession({
    password: process.env.SESSION_SECRET!,  // 必须 32+ 字符
    name: "session",
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 天
    },
  });
  return session;
}
```

**`session` 对象的 API**：

```ts
session.data       // 当前 session 数据（typed）
await session.update({ userId: 1 })  // 更新（自动写 Set-Cookie）
await session.clear()                 // 清空（自动写 Set-Cookie 过期）
```

### 完整的 Auth 流程

```ts
// src/lib/auth.ts
"use server";

import { useSession } from "vinxi/http";
import { redirect } from "@solidjs/router";

type SessionData = { userId?: number };

export async function getSession() {
  return await useSession<SessionData>({
    password: process.env.SESSION_SECRET!,
    name: "session",
  });
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session.data.userId) return null;
  return await db.user.findUnique({ where: { id: session.data.userId } });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw redirect("/login");
  return user;
}
```

```tsx
// src/routes/login.tsx
import { action, redirect } from "@solidjs/router";
import { getSession } from "~/lib/auth";

const loginAction = action(async (formData: FormData) => {
  "use server";
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // 验证（伪代码）
  const user = await verifyCredentials(email, password);
  if (!user) throw new Error("Invalid credentials");

  // 设 session
  const session = await getSession();
  await session.update({ userId: user.id });

  throw redirect("/dashboard");
}, "login");

export default function LoginPage() {
  return (
    <form action={loginAction} method="post">
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button>登录</button>
    </form>
  );
}
```

```tsx
// src/routes/dashboard.tsx —— 受保护页面
import { query, createAsync, type RouteDefinition } from "@solidjs/router";
import { requireUser } from "~/lib/auth";

const getUser = query(async () => {
  "use server";
  return await requireUser();  // 未登录直接 throw redirect
}, "currentUser");

export const route = {
  preload: () => getUser(),
} satisfies RouteDefinition;

export default function Dashboard() {
  // deferStream 让 redirect 在 streaming 开始前生效
  const user = createAsync(() => getUser(), { deferStream: true });
  return <h1>欢迎，{user()?.name}</h1>;
}
```

### 直接读写 cookie

不用 session 的话可以直接操作 cookie：

```ts
import { getCookie, setCookie, deleteCookie } from "vinxi/http";

async function setTheme(theme: "light" | "dark") {
  "use server";
  setCookie("theme", theme, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}

async function getTheme() {
  "use server";
  return getCookie("theme") ?? "light";
}
```

## API Routes

`src/routes/api/` 下的文件如果**只导出 HTTP method**（无 default export），就是 API endpoint：

```ts
// src/routes/api/posts.ts
import type { APIEvent } from "@solidjs/start/server";

export async function GET(event: APIEvent) {
  const posts = await db.posts.findMany();
  return Response.json(posts);
}

export async function POST(event: APIEvent) {
  const body = await event.request.json();
  const post = await db.posts.create(body);
  return Response.json(post, { status: 201 });
}
```

```ts
// src/routes/api/posts/[id].ts
import type { APIEvent } from "@solidjs/start/server";

export async function GET(event: APIEvent) {
  const id = event.params.id;
  const post = await db.posts.findUnique({ where: { id } });
  if (!post) return new Response("Not Found", { status: 404 });
  return Response.json(post);
}

export async function DELETE(event: APIEvent) {
  await db.posts.delete({ where: { id: event.params.id } });
  return new Response(null, { status: 204 });
}
```

### `APIEvent` 接口

```ts
interface APIEvent {
  request: Request;
  params: Record<string, string>;
  // 内部 fetch（同源调用其他 API 不用担心 origin）
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
  // 平台特定（CF Workers / Vercel Edge）
  nativeEvent?: H3Event;
  locals: Record<string, unknown>;
}
```

### 复用同一个 handler

```ts
async function handler(event: APIEvent) {
  // ...
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
```

### tRPC 集成示例

```ts
// src/routes/api/trpc/[...trpc].ts
import { type APIEvent } from "@solidjs/start/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "~/lib/router";

const handler = (event: APIEvent) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req: event.request,
    router: appRouter,
    createContext: () => ({}),
  });

export const GET = handler;
export const POST = handler;
```

### Server Functions vs API Routes 的选择

| 场景 | 推荐 |
|---|---|
| 仅 client 端调用（自家应用内） | **Server Function**（更紧凑，自动序列化） |
| 移动端 / 第三方 / curl 等外部调用 | **API Route**（标准 HTTP，REST） |
| GraphQL / tRPC 端点 | **API Route**（通用 fetch adapter） |
| Webhook 接收方 | **API Route**（接收外部 POST） |

## Head & Metadata（SEO）

SolidStart 不内置 meta 库——用官方推荐的 `@solidjs/meta`：

```bash
pnpm add @solidjs/meta
```

### 在根挂载 MetaProvider

```tsx
// src/app.tsx
import { MetaProvider, Title, Meta, Link } from "@solidjs/meta";

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Title>我的应用</Title>
          <Meta name="description" content="默认描述" />
          <Meta charset="utf-8" />
          <Meta name="viewport" content="width=device-width, initial-scale=1" />
          <Link rel="icon" href="/favicon.ico" />
          <Suspense>{props.children}</Suspense>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
```

### 页面级覆盖

页面挂载 `<Title>` / `<Meta>` 会**覆盖**根级的同名标签：

```tsx
// src/routes/about.tsx
import { Title, Meta } from "@solidjs/meta";

export default function About() {
  return (
    <>
      <Title>关于我们 | 我的应用</Title>
      <Meta name="description" content="关于我们的故事" />
      <Meta property="og:title" content="关于我们" />
      <Meta property="og:image" content="https://example.com/og.png" />

      <main>
        <h1>关于</h1>
      </main>
    </>
  );
}
```

### 动态 meta（基于数据）

```tsx
import { Suspense } from "solid-js";
import { query, createAsync } from "@solidjs/router";
import { Title, Meta } from "@solidjs/meta";

const getPost = query(async (id: string) => {
  "use server";
  return await db.posts.findUnique({ where: { id } });
}, "post");

export default function PostPage(props: { params: { id: string } }) {
  const post = createAsync(() => getPost(props.params.id));

  return (
    <article>
      <Suspense>
        <Title>{post()?.title} | Blog</Title>
        <Meta name="description" content={post()?.excerpt} />
        <Meta property="og:title" content={post()?.title} />

        <h1>{post()?.title}</h1>
      </Suspense>
    </article>
  );
}
```

## HTTP 状态码与响应头

### `<HttpStatusCode>`：设置状态码

```tsx
import { HttpStatusCode } from "@solidjs/start";

export default function NotFound() {
  return (
    <>
      <HttpStatusCode code={404} text="Not Found" />
      <h1>404 - 页面不存在</h1>
    </>
  );
}
```

> 仅在 SSR 时生效（影响 HTTP 响应）；client 端 navigation 时该组件不影响任何东西。

### `<HttpHeader>`：设置响应头

```tsx
import { HttpHeader } from "@solidjs/start";

export default function CachedPage() {
  return (
    <>
      <HttpHeader name="Cache-Control" value="max-age=3600" />
      <h1>缓存 1 小时</h1>
    </>
  );
}
```

### 404 路由

把 `src/routes/[...404].tsx` 作为兜底：

```tsx
// src/routes/[...404].tsx
import { HttpStatusCode } from "@solidjs/start";
import { Title } from "@solidjs/meta";

export default function NotFound() {
  return (
    <>
      <Title>404 Not Found</Title>
      <HttpStatusCode code={404} />
      <main>
        <h1>页面不存在</h1>
        <a href="/">返回首页</a>
      </main>
    </>
  );
}
```

## 渲染模式

SolidStart 支持 4 种渲染模式——通过 `app.config.ts` 控制：

### SSR（默认 + Streaming）

```ts
// app.config.ts
export default defineConfig({
  ssr: true,  // 默认
});
```

默认是 **streaming SSR**——`<Suspense>` 准备好的部分先发，未准备好的部分稍后流式补上。

### Sync SSR（关闭流式）

```ts
// app.config.ts
export default defineConfig({
  ssr: true,
  server: {
    experimental: {
      asyncContext: true,
    },
  },
});
```

或者在 `createHandler` 的 mode 参数控制：

```tsx
// src/entry-server.tsx
export default createHandler(
  (event) => <StartServer document={Document} />,
  { mode: "async" }  // 'sync' | 'async' | 'stream'（默认）
);
```

| Mode | 行为 |
|---|---|
| `sync` | 同步渲染（`renderToString`），无 Suspense |
| `async` | 异步渲染（`renderToStringAsync`），等所有 Suspense 完成再发响应 |
| `stream` | 流式（默认），Suspense 准备好就发，未准备好稍后流 |

### CSR（纯客户端，无 SSR）

```ts
// app.config.ts
export default defineConfig({
  ssr: false,
});
```

变成纯 SPA——服务器只发 HTML shell + JS bundle，所有渲染在 client 端。

### SSG（静态生成）

```ts
// app.config.ts
export default defineConfig({
  server: {
    prerender: {
      // 显式指定要预渲染的路由
      routes: ["/", "/about", "/blog"],
    },
  },
});
```

或者自动爬取所有 `<a>` 链接：

```ts
export default defineConfig({
  server: {
    prerender: {
      crawlLinks: true,  // 自动跟随 <a> 链接预渲染
    },
  },
});
```

build 后所有路由生成静态 HTML——可以部署到任何 CDN（GitHub Pages / Vercel Static / CloudFront / 等）。

## 部署 Adapter（Nitro Preset）

SolidStart 通过 Nitro 支持 **17+ 部署目标**——只改 `app.config.ts` 的 `server.preset` 即可切换平台。

### 常用 Preset

| Preset | 平台 | 备注 |
|---|---|---|
| `node-server` | 普通 Node.js Server | 默认 |
| `node-cluster` | Node.js Cluster | 多进程 |
| `node-listener` | Node.js Listener | 用于嵌入 |
| `vercel` | Vercel Serverless Functions | |
| `vercel_edge` | Vercel Edge Functions | |
| `netlify` | Netlify Functions | |
| `netlify_edge` | Netlify Edge Functions | |
| `cloudflare-pages` | Cloudflare Pages | |
| `cloudflare_module` | Cloudflare Workers (ESM) | 需 `nodejs_compat` |
| `aws-lambda` | AWS Lambda | |
| `aws-lambda@edge` | Lambda@Edge | |
| `bun` | Bun runtime | |
| `deno-server` | Deno | |
| `deno-deploy` | Deno Deploy | |
| `static` | Static SSG | 与 `prerender` 配合 |
| `github_pages` | GitHub Pages（静态） | |

### Vercel

```ts
// app.config.ts
export default defineConfig({
  server: {
    preset: "vercel",  // 或 "vercel_edge"
  },
});
```

部署：`vercel deploy`（用 Vercel CLI）或 push 到关联 git 仓库。

### Cloudflare Workers

```ts
export default defineConfig({
  server: {
    preset: "cloudflare_module",
    rollupConfig: {
      external: ["__STATIC_CONTENT_MANIFEST", "node:async_hooks"],
    },
  },
});
```

`wrangler.toml`：

```toml
name = "my-app"
compatibility_date = "2026-01-01"
compatibility_flags = ["nodejs_compat"]
main = ".output/server/index.mjs"
```

### Netlify

```ts
export default defineConfig({
  server: { preset: "netlify_edge" },
});
```

push 到 Netlify 关联仓库即自动部署。

### Static SSG

```ts
export default defineConfig({
  server: {
    preset: "static",
    prerender: {
      crawlLinks: true,
    },
  },
});
```

build 后 `.output/public/` 目录是完全静态站点，可以部署到任何 CDN。

## v1 → v2 迁移要点

> v2 当前是 alpha 阶段（`@solidjs/start@2.0.0-alpha.x`），生产仍建议用 v1。本节简要说明主要变化。

### 包变更

```bash
# 移除 vinxi
pnpm remove vinxi

# 升级 @solidjs/start，安装 nitro v2 plugin 和 vite 7
pnpm add @solidjs/start@2.0.0-alpha.2 @solidjs/vite-plugin-nitro-2 vite@7
```

### 配置文件迁移

v1 用 `app.config.ts`：

```ts
// app.config.ts（v1）
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  middleware: "src/middleware/index.ts",
  ssr: true,
});
```

v2 改为 `vite.config.ts`：

```ts
// vite.config.ts（v2）
import { solidStart } from "@solidjs/start/config";
import { defineConfig } from "vite";
import { nitroV2Plugin } from "@solidjs/vite-plugin-nitro-2";

export default defineConfig(() => ({
  plugins: [
    solidStart({
      middleware: "./src/middleware/index.ts",
    }),
    nitroV2Plugin(),
  ],
}));
```

### 脚本变更

v1：

```json
{
  "scripts": {
    "dev": "vinxi dev",
    "build": "vinxi build",
    "start": "vinxi start"
  }
}
```

v2：

```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "start": "vite preview"
  }
}
```

### 环境变量

v1 用 Vinxi 的注入：

```ts
// 在代码中
const url = process.env.DATABASE_URL;
```

v2 用 Vite 的 `environments.ssr.define`：

```ts
// vite.config.ts
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    environments: {
      ssr: {
        define: {
          "process.env.DATABASE_URL": JSON.stringify(env.DATABASE_URL),
        },
      },
    },
  };
});
```

### tsconfig 类型

v2 需要新的类型：

```json
{
  "compilerOptions": {
    "types": ["@solidjs/start/env"]
  }
}
```

### 应用代码

**几乎不需要改**——`query` / `action` / `createAsync` / `useSubmission` / Router 等 API 完全兼容。

## 常见踩坑

### 1. 解构 props / params 失去响应性

```tsx
// ❌ 错误
export default function Page() {
  const { params } = useNavigate(); // 假设拆出 params
  const { id } = useParams();
  return <div>User {id}</div>;  // 不更新
}

// ✅ 正确
export default function Page() {
  const params = useParams();
  return <div>User {params.id}</div>;
}
```

`useParams` / `useSearchParams` / `useLocation` 都是 getter 对象，**不能解构**。

### 2. `<Suspense>` 缺失

如果根 layout 没有 `<Suspense>`，任何 `createAsync` 都会触发 hydration 错误：

```tsx
// ❌ 错误：缺 Suspense
<Router root={(props) => <>{props.children}</>}>
  <FileRoutes />
</Router>

// ✅ 正确
<Router root={(props) => <Suspense>{props.children}</Suspense>}>
  <FileRoutes />
</Router>
```

### 3. `"use server"` 写在错误位置

```ts
// ❌ 错误：directive 不在函数顶部
async function getUser() {
  console.log("before");
  "use server"; // ← 不生效
  return await db.users.findFirst();
}

// ✅ 正确：必须是函数体的第一行
async function getUser() {
  "use server";
  return await db.users.findFirst();
}
```

### 4. 在 server function 中返回不可序列化的值

```ts
// ❌ 错误：返回 class 实例
const getUser = query(async () => {
  "use server";
  return new User(); // class 实例无法序列化
}, "user");

// ✅ 正确：返回普通对象
const getUser = query(async () => {
  "use server";
  const user = new User();
  return { id: user.id, name: user.name }; // 转换为 POJO
}, "user");
```

### 5. 在 client 端代码引用了 server-only 模块

```tsx
// ❌ 错误：直接 import server-only 模块
import { db } from "~/lib/db"; // ← db.ts 顶部有 "use server"

export default function Page() {
  const users = createSignal([]);
  // 直接调用 db.method() 在 client 端会报错
}

// ✅ 正确：把数据库访问封装在 server function 内
import { query, createAsync } from "@solidjs/router";

const getUsers = query(async () => {
  "use server";
  const { db } = await import("~/lib/db");
  return await db.users.findMany();
}, "users");

export default function Page() {
  const users = createAsync(() => getUsers());
}
```

### 6. 在 streaming 模式下 redirect

```tsx
// ❌ 错误：在 streaming 开始后 redirect 报错
const getProfile = query(async () => {
  "use server";
  const session = await getSession();
  if (!session.data.userId) throw redirect("/login");
  return ...;
}, "profile");

export default function Profile() {
  // 没加 deferStream，可能流已开始 → headers can't be set
  const profile = createAsync(() => getProfile());
}

// ✅ 正确：加 deferStream
export default function Profile() {
  const profile = createAsync(() => getProfile(), { deferStream: true });
}
```

### 7. action 的 cache key 冲突

```tsx
// ❌ 错误：两个 action 用同一个 key
const createPost = action(async () => { /* ... */ }, "create");
const createComment = action(async () => { /* ... */ }, "create");
// → useSubmission 会混淆

// ✅ 正确：每个 action 独一无二的 key
const createPost = action(async () => { /* ... */ }, "createPost");
const createComment = action(async () => { /* ... */ }, "createComment");
```

建议命名规范：「动词 + 名词」（`createUser` / `deletePost` / `updateProfile`）。

### 8. Vinxi 配置层（v1）的调试困难

v1 的 `app.config.ts` 实际是 Vinxi 配置层——错误信息有时指向 Vinxi 内部。常见做法：

- 检查 `.vinxi/` 目录的临时输出
- 改 `vite.plugins` 时记得加在正确的 router（`vite: { plugins: [...] }` 是全局，按 router 类型加用 `vite: (router) => ...`）
- v2 切换到原生 Vite 后这一层消失

### 9. Server Function 在客户端调用看起来正常但回包巨大

`"use server"` 的函数会被打包成 HTTP 端点——返回的所有数据都会被序列化到响应中。如果你不小心返回了整个数据库的内容，会变成几 MB 的 JSON。

```ts
// ❌ 危险：返回整个 row 含敏感字段 + relations
async function getUser(id: string) {
  "use server";
  return await db.user.findUnique({
    where: { id },
    include: { posts: true, comments: true, sessions: true }, // 全拉
  });
}

// ✅ 正确：select 必要字段
async function getUser(id: string) {
  "use server";
  return await db.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });
}
```

### 10. `<form action={fn}>` 不是 string URL

```tsx
// ✅ 正确：fn 是 action 对象（被 router 转成 POST + action id）
const myAction = action(async (formData) => { /* ... */ }, "myAction");

<form action={myAction} method="post">
  ...
</form>

// 如果你想要传统 URL 提交（如 POST 到外部）
<form action="/api/external-endpoint" method="post">
  ...
</form>
```

## 与 Solid 本体配合

SolidStart 完全基于 Solid——你在 Solid 笔记里学的所有响应式 API 都可用：

- 信号：`createSignal` / `createMemo` / `createEffect` / `createResource`
- Store：`createStore` / `produce` / `unwrap` / `reconcile`
- 控制流组件：`<For>` / `<Show>` / `<Switch>` / `<Match>` / `<Index>` / `<Dynamic>` / `<ErrorBoundary>` / `<Suspense>`
- 生命周期：`onMount` / `onCleanup`
- Context：`createContext` + `useContext`
- 入口：在 SolidStart 中由 `entry-client.tsx` / `entry-server.tsx` 处理，无需手写 `render()`

> 详见 [Solid 笔记 - 指南](../../ui/solid/guide-line.md)。

## 接下来读什么

- [参考](./reference.md)：API 速查 / 内置组件 / 文件约定 / `app.config.ts` 全部选项 / Adapter Preset 列表 / 常见 import 来源
- [Solid 笔记](../../ui/solid/index.md)：响应式原理 / 控制流 / Store / Resource——SolidStart 的全部 UI 层基础
