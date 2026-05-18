---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 SolidStart 1.x（`@solidjs/start` / `@solidjs/router` / `@solidjs/meta`） —— API 速查 / 内置组件 / 文件约定 / `app.config.ts` 全部选项 / Adapter Preset 列表 / 命名约定 / 常见 import 来源

## 包结构

| 包 | 用途 | 必需 |
|---|---|---|
| `solid-js` | Solid 核心（信号 / store / JSX runtime） | **是** |
| `@solidjs/start` | SolidStart 运行时（`createHandler` / `StartServer` / `StartClient` / `mount` / `clientOnly` / `HttpStatusCode` / `HttpHeader`） | **是** |
| `@solidjs/start/config` | `defineConfig` —— v1 配置文件用 | v1 |
| `@solidjs/start/router` | `<FileRoutes />` 自动路由表 | **是** |
| `@solidjs/start/server` | SSR 服务端入口（`createHandler` / `StartServer`） | **是** |
| `@solidjs/start/client` | 客户端 hydration 入口（`mount` / `StartClient`） | **是** |
| `@solidjs/start/middleware` | `createMiddleware` | 可选 |
| `@solidjs/start/env` | 环境变量类型（v2 必需） | v2 |
| `@solidjs/router` | 路由 + `query` / `action` / `createAsync` / `redirect` / 等 | 99% 项目用 |
| `@solidjs/meta` | head meta 标签管理（`Title` / `Meta` / `Link`） | SEO 时 |
| `vinxi` | v1 底层构建/运行时 | v1 |
| `vinxi/http` | v1 HTTP 工具（`useSession` / `getCookie` / `setCookie`） | v1 |
| `@solidjs/vite-plugin-nitro-2` | v2 底层 Nitro plugin | v2 |
| `vite` | 底层构建工具 | **是** |

## 核心 API（`@solidjs/router`）

### 数据加载

| API | 签名 | 说明 |
|---|---|---|
| `query` | `query<Args, R>(fn: (...args: Args) => Promise<R>, key: string): QueryFn` | 创建可缓存数据加载函数 |
| `createAsync` | `createAsync<T>(fn: () => Promise<T>, options?: { initialValue, deferStream }): Accessor<T \| undefined>` | 订阅 query 结果 |
| `revalidate` | `revalidate(key?: string \| string[], force?: boolean): Promise<void>` | 手动刷新 query 缓存 |
| `reload` | `reload(): Response` | 重新加载当前路由 |
| `redirect` | `redirect(url: string, init?: ResponseInit): Response` | 重定向（throw 或 return） |
| `json` | `json<T>(data: T, init?: ResponseInit): Response` | 返回自定义 JSON 响应 |

```tsx
import { query, createAsync, revalidate, redirect, reload, json } from "@solidjs/router";

// 定义 query
const getPosts = query(async () => {
  "use server";
  return await db.posts.findMany();
}, "posts");

// 订阅 query
const posts = createAsync(() => getPosts(), { deferStream: true });

// 手动 revalidate
await revalidate("posts");           // 刷新指定 key
await revalidate(["posts", "user"]); // 刷新多个 key
await revalidate();                   // 刷新全部

// redirect / reload
throw redirect("/login");
throw reload();
return json({ ok: true }, { status: 200, headers: { "X-Custom": "v" } });
```

### 副作用

| API | 签名 | 说明 |
|---|---|---|
| `action` | `action<Args, R>(fn: (...args: Args) => Promise<R>, key: string): ActionFn` | 创建副作用函数 |
| `useSubmission` | `useSubmission(action): { pending, result, error, input, clear, retry }` | 订阅单次提交 |
| `useSubmissions` | `useSubmissions(action): Array<Submission>` | 订阅所有提交（数组） |
| `useAction` | `useAction(action): (...args) => Promise<R>` | 拿到 action 的程序化调用版 |

```tsx
import { action, useSubmission, useSubmissions, useAction } from "@solidjs/router";

const createPost = action(async (formData: FormData) => {
  "use server";
  return await db.posts.create(/* ... */);
}, "createPost");

// 1. 表单提交
<form action={createPost} method="post">...</form>

// 2. 程序化调用
const submit = useAction(createPost);
await submit(formData);

// 3. .with() 预填参数
const addComment = action(
  async (postId: string, formData: FormData) => { /* ... */ },
  "addComment"
);
<form action={addComment.with(postId)} method="post">...</form>

// 4. 状态订阅
const submission = useSubmission(createPost);
// submission.pending / submission.result / submission.error / submission.input
// submission.clear() / submission.retry()

const submissions = useSubmissions(createPost);
// 数组形式，所有进行中的提交
```

### 路由

| API | 签名 | 说明 |
|---|---|---|
| `Router` | `Router({ root, base }: RouterProps): JSX.Element` | 根 Router 组件 |
| `Route` | `Route({ path, component, load, ... })` | 单个路由（手写时用） |
| `<A>` | `A(props: { href, activeClass, inactiveClass, end, ... })` | SPA 风格链接 |
| `useLocation` | `useLocation(): Location` | 当前 URL / pathname / query |
| `useNavigate` | `useNavigate(): NavigateFn` | 编程式导航 |
| `useParams` | `useParams<T>(): T` | 动态段（getter） |
| `useSearchParams` | `useSearchParams<T>(): [T, SetterFn]` | URL 查询参数 |
| `useMatch` | `useMatch(path): () => MatchResult \| undefined` | 路径匹配检查 |
| `useBeforeLeave` | `useBeforeLeave(handler): void` | 离开前钩子 |
| `useResolvedPath` | `useResolvedPath(path: string): () => string` | 解析相对路径 |

```tsx
import {
  Router, A, useLocation, useNavigate, useParams, useSearchParams,
} from "@solidjs/router";

// 1. Router 配置
<Router base="/app" root={(props) => <Layout>{props.children}</Layout>}>
  <FileRoutes />
</Router>

// 2. 链接
<A href="/about" activeClass="active" inactiveClass="muted" end={true}>
  About
</A>

// 3. 编程式导航
const navigate = useNavigate();
navigate("/dashboard");                    // 跳转
navigate("/login", { replace: true });    // 替换 history
navigate(-1);                              // 回退

// 4. URL 解析
const location = useLocation();
// location.pathname / location.search / location.hash / location.state

// 5. 动态段
const params = useParams<{ id: string }>();
console.log(params.id);  // ← getter，不能解构

// 6. 查询参数
const [search, setSearch] = useSearchParams<{ q?: string }>();
setSearch({ q: "hello" });  // ?q=hello
```

### `<FileRoutes>`（`@solidjs/start/router`）

```tsx
import { FileRoutes } from "@solidjs/start/router";

// 用法：放在 <Router> 内
<Router>
  <FileRoutes />
</Router>
```

**行为**：

- 自动扫描 `src/routes/` 下的所有文件
- 根据约定（见下方「文件约定」）生成 Route 配置
- 支持 dynamic / catch-all / route group / nested layout

### `RouteDefinition`：路由元数据

```ts
import type { RouteDefinition } from "@solidjs/router";

export const route = {
  // 路由级 preload（路由切换时立即执行）
  preload: ({ params, location, intent }) => {
    getPost(params.id);
    getComments(params.id);
  },
  // 离开前钩子
  preventLeave: () => confirm("Unsaved changes, leave?"),
  // 路由匹配模式
  matchFilters: {
    id: /^\d+$/,
  },
} satisfies RouteDefinition;
```

### `RouteSectionProps`：路由组件的 props 类型

```ts
import type { RouteSectionProps } from "@solidjs/router";

export default function PostPage(props: RouteSectionProps<unknown, "id">) {
  // props.params.id（typed）
  // props.location
  // props.children（嵌套 layout 的子内容）
  // props.data（旧 API，已废弃，用 query + createAsync 替代）
}
```

## 服务端 API（`@solidjs/start/server`）

### `createHandler`

```ts
function createHandler(
  fn: (event: PageEvent) => JSX.Element,
  options?: {
    mode?: "sync" | "async" | "stream";
    onCompleteShell?(): void;
    onCompleteAll?(): void;
  },
  load?: (event: PageEvent) => Record<string, unknown>
): RequestHandler;
```

```tsx
// src/entry-server.tsx
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler((event) => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html>
        <head>{assets}</head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));

// 带 mode + load
export default createHandler(
  (event) => <StartServer document={Document} />,
  { mode: "async" },
  (event) => ({ nonce: event.locals.nonce })  // 注入到 props.data
);
```

| Mode | 含义 |
|---|---|
| `sync` | `renderToString` — 无 Suspense |
| `async` | `renderToStringAsync` — 等所有 Suspense 完成再发响应 |
| `stream` | **默认** — Suspense 准备好就发，未准备好稍后流式补 |

### `<StartServer>`

```tsx
import { StartServer } from "@solidjs/start/server";

type DocumentComponentProps = {
  assets: JSX.Element;
  scripts: JSX.Element;
  children?: JSX.Element;
};

<StartServer document={(props) => <html>...</html>} />
```

### `APIEvent`：API 路由参数

```ts
import type { APIEvent } from "@solidjs/start/server";

interface APIEvent {
  request: Request;
  params: Record<string, string>;
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
  nativeEvent?: H3Event;  // 平台特定
  locals: Record<string, unknown>;
}

// 使用
export async function GET(event: APIEvent) {
  const id = event.params.id;
  return Response.json({ id });
}
```

### `<HttpStatusCode>`

```tsx
import { HttpStatusCode } from "@solidjs/start";

<HttpStatusCode code={404} text="Not Found" />
```

| Prop | 类型 | 说明 |
|---|---|---|
| `code` | `number` | HTTP 状态码（必填） |
| `text` | `string` | 状态文本（可选） |

仅 SSR 时影响响应；client 端 navigation 时该组件不影响任何东西。

### `<HttpHeader>`

```tsx
import { HttpHeader } from "@solidjs/start";

<HttpHeader name="Cache-Control" value="max-age=3600" />
<HttpHeader name="Set-Cookie" value="theme=dark" append />
```

| Prop | 类型 | 说明 |
|---|---|---|
| `name` | `string` | header 名（必填） |
| `value` | `string` | header 值（必填） |
| `append` | `boolean` | true 时追加；false（默认）覆盖 |

仅 SSR 时生效。

## 客户端 API（`@solidjs/start/client`）

### `mount` + `<StartClient>`

```tsx
// src/entry-client.tsx
import { mount, StartClient } from "@solidjs/start/client";

mount(() => <StartClient />, document.getElementById("app")!);
```

| API | 签名 | 说明 |
|---|---|---|
| `mount` | `mount(fn: () => JSX.Element, el: MountableElement): (() => void) \| undefined` | hydration 入口 |
| `StartClient` | `() => JSX.Element` | 客户端应用根 |

### `clientOnly`：仅客户端组件

```tsx
import { clientOnly } from "@solidjs/start";

// 服务器端渲染 fallback；客户端 hydration 后加载真实组件
const Map = clientOnly(() => import("./Map"), { lazy: true });

export default function Page() {
  return <Map fallback={<p>加载地图中...</p>} />;
}
```

| 选项 | 类型 | 说明 |
|---|---|---|
| `lazy` | `boolean` | true 时不立即 import，仅在组件渲染时加载 |

## Middleware API

```ts
import { createMiddleware } from "@solidjs/start/middleware";

export default createMiddleware({
  onRequest: (event) => {
    // 请求开始
    event.locals.startTime = Date.now();
  },
  onBeforeResponse: (event) => {
    // 响应前
    const duration = Date.now() - event.locals.startTime;
    event.response.headers.set("Server-Timing", `total;dur=${duration}`);
  },
});

// 也可以传数组（顺序执行）
export default createMiddleware({
  onRequest: [authMiddleware, loggingMiddleware],
});
```

### `FetchEvent` 接口

```ts
interface FetchEvent {
  request: Request;
  response: { headers: Headers; status: number; statusText: string };
  locals: Record<string, unknown>;
  nativeEvent: H3Event;
}
```

## Session API（`vinxi/http`）

```ts
import {
  useSession, getSession, updateSession, clearSession,
  getCookie, setCookie, deleteCookie,
  getHeader, getHeaders,
  appendResponseHeader, setResponseHeader,
  parseCookies,
} from "vinxi/http";

// 在 server function 中使用
async function exampleSession() {
  "use server";

  // Session
  const session = await useSession<{ userId?: number }>({
    password: process.env.SESSION_SECRET!,   // 必须 32+ 字符
    name: "session",
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    },
  });
  // session.data / session.update(...) / session.clear()

  // Cookies
  const theme = getCookie("theme");
  setCookie("theme", "dark", { maxAge: 60 * 60 * 24 * 365 });
  deleteCookie("theme");

  // Headers
  const ua = getHeader("user-agent");
  setResponseHeader("X-Custom", "value");
}
```

## `@solidjs/meta`：SEO 标签

```tsx
import { MetaProvider, Title, Meta, Link, Style } from "@solidjs/meta";

// 在根挂载 MetaProvider
<MetaProvider>
  <Title>默认标题</Title>
  <Meta name="description" content="..." />
  <Link rel="canonical" href="https://example.com" />
  <App />
</MetaProvider>
```

| 组件 | 用途 |
|---|---|
| `<MetaProvider>` | 上下文 provider（根挂载） |
| `<Title>` | 设置 `<title>` |
| `<Meta>` | 设置 `<meta>` |
| `<Link>` | 设置 `<link>` |
| `<Style>` | 设置 `<style>` |

**覆盖规则**：

- 多个 `<Title>` 同时挂载时，**最后挂载**的生效（通常是嵌套最深的子组件）
- `<Meta>` / `<Link>` 按 `name` / `property` / `rel` 等键去重，**后挂载覆盖**前者

## 文件约定

### 路由文件

| 文件 | URL | 含义 |
|---|---|---|
| `src/routes/index.tsx` | `/` | 首页 |
| `src/routes/about.tsx` | `/about` | 静态路由 |
| `src/routes/blog/index.tsx` | `/blog` | 索引页 |
| `src/routes/users/[id].tsx` | `/users/:id` | 动态段 |
| `src/routes/users/[id]/posts.tsx` | `/users/:id/posts` | 嵌套 |
| `src/routes/files/[...rest].tsx` | `/files/*` | 通配 |
| `src/routes/(group)/about.tsx` | `/about` | 路由组（括号不映射） |
| `src/routes/blog.tsx` + `routes/blog/...` | - | 嵌套 layout |
| `src/routes/api/hello.ts` | `/api/hello` | API endpoint |
| `src/routes/[...404].tsx` | - | 404 兜底 |

### 入口与配置文件

| 文件 | 用途 |
|---|---|
| `src/app.tsx` | 应用根（Router + FileRoutes） |
| `src/entry-server.tsx` | SSR 入口（createHandler + StartServer） |
| `src/entry-client.tsx` | 客户端 hydration 入口（mount + StartClient） |
| `src/middleware/index.ts` | 全局 middleware（需在 `app.config.ts` 声明路径） |
| `app.config.ts` | SolidStart 配置（v1） |
| `vite.config.ts` | Vite 配置（v2） / 可选（v1 时） |
| `tsconfig.json` | TypeScript 配置 |
| `package.json` | scripts（dev / build / start） |

### 静态资源

- `public/` 目录的所有文件直接复制到生产输出（`/favicon.ico` → `https://site/favicon.ico`）
- `src/` 内的资源 import 后经 Vite 处理（hash 命名 / 优化）

## `app.config.ts` 全部选项

```ts
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  // 应用根目录（默认 src）
  appRoot: "./src",

  // 路由目录（默认 ./routes，相对于 appRoot）
  routeDir: "./routes",

  // 路由文件扩展名
  extensions: ["tsx", "ts", "jsx", "js"],

  // 中间件文件路径（可选）
  middleware: "./src/middleware/index.ts",

  // 是否启用 SSR（默认 true）
  ssr: true,

  // 是否开发覆盖层（默认 true）
  devOverlay: true,

  // Solid 编译选项（vite-plugin-solid）
  solid: {
    // hydratable: true,
    // ssr: true,
    // ...
  },

  // 服务器配置（Nitro）
  server: {
    // 部署预设
    preset: "node-server",

    // 预渲染（SSG）
    prerender: {
      crawlLinks: false,
      routes: ["/", "/about"],
      // failOnError: true,
    },

    // 路由规则
    routeRules: {
      "/api/**": { cors: true },
      "/blog/**": { isr: 60 },
    },

    // 平台特定配置
    rollupConfig: {
      external: ["__STATIC_CONTENT_MANIFEST", "node:async_hooks"],
    },

    // 实验特性
    experimental: {
      asyncContext: true,
    },
  },

  // Vite 配置（透传）
  vite: {
    plugins: [],
    resolve: { alias: { /* ... */ } },
    server: { port: 3000 },
  },

  // 实验特性
  experimental: {
    islands: false, // islands 模式（实验）
  },

  // 序列化模式
  serialization: {
    mode: "js", // "json" | "js"（默认 js，更小但 CSP 弱）
  },
});
```

### `serialization.mode`

| 模式 | 优点 | 缺点 |
|---|---|---|
| `js` (默认) | payload 更小、性能更好 | 需要 `unsafe-eval` CSP |
| `json` | 更严格的 CSP 兼容 | payload 略大 |

```ts
defineConfig({
  serialization: { mode: "json" },  // 严格 CSP 站点用
});
```

## Nitro Preset 列表

可用值（`server.preset`）：

### Node.js

| Preset | 说明 |
|---|---|
| `node-server` | Express-style HTTP server（默认） |
| `node-cluster` | 多进程 Node.js |
| `node-listener` | 仅 listener（嵌入用） |

### 主流 PaaS

| Preset | 平台 |
|---|---|
| `vercel` | Vercel Serverless Functions |
| `vercel_edge` | Vercel Edge Functions |
| `vercel_static` | Vercel 纯静态 |
| `netlify` | Netlify Functions |
| `netlify_edge` | Netlify Edge Functions |
| `netlify_static` | Netlify 纯静态 |
| `cloudflare-pages` | Cloudflare Pages |
| `cloudflare_module` | Cloudflare Workers (ESM) |
| `cloudflare` | Cloudflare Workers (Service Worker syntax，旧) |

### AWS

| Preset | 平台 |
|---|---|
| `aws-lambda` | AWS Lambda |
| `aws-amplify` | AWS Amplify |
| `cloudfront` | Lambda@Edge |

### 其他

| Preset | 平台 |
|---|---|
| `bun` | Bun runtime |
| `deno-server` | Deno 自托管 |
| `deno-deploy` | Deno Deploy |
| `firebase` | Firebase Functions |
| `azure` | Azure Static Web Apps |
| `digital-ocean` | DO App Platform |
| `heroku` | Heroku Dynos |

### SSG / 静态

| Preset | 说明 |
|---|---|
| `static` | 完全静态（生成 `.output/public/`） |
| `github_pages` | GitHub Pages 静态 |
| `nitro-prerender` | 仅 prerender |

> 完整最新列表见 [Nitro Preset 文档](https://nitro.build/deploy)。

## 命名约定

| 类型 | 推荐 | 示例 |
|---|---|---|
| 组件 | PascalCase | `Counter` / `UserCard` |
| 信号 | camelCase | `[count, setCount]` / `[user, setUser]` |
| Query | `get` / `fetch` + 名词 | `getPosts` / `fetchUser` |
| Query key | camelCase 名词 | `"posts"` / `"user"` / `"userPosts"` |
| Action | 动词 + 名词 | `createPost` / `updateUser` / `deleteComment` |
| Action key | 与函数名一致 | `"createPost"` / `"deleteComment"` |
| Server function | 动词为主 | `getCurrentUser` / `sendEmail` |
| Context ID | camelCase + Context 后缀 | `ThemeContext` / `UserContext` |
| 文件名 | kebab-case 或 PascalCase | `user-card.tsx` 或 `UserCard.tsx` |
| 路由文件 | kebab-case + 段（小写） | `users/[id].tsx` / `(marketing)/about.tsx` |
| API 文件 | kebab-case | `api/posts/[id].ts` |
| Middleware | kebab-case | `middleware/index.ts` |

## 常见 import 来源速查

```ts
// === Solid 核心 ===
import {
  // 响应式
  createSignal, createMemo, createEffect, createResource, createComputed,
  // Store
  createStore, produce, unwrap, reconcile,
  // 控制流
  For, Show, Switch, Match, Index, Dynamic, Portal, ErrorBoundary, Suspense, SuspenseList,
  // Context / 生命周期
  createContext, useContext, onMount, onCleanup,
  // 工具
  batch, untrack, lazy, splitProps, mergeProps, children,
} from "solid-js";

// === Solid Web（DOM）===
import { render, hydrate, isServer, getRequestEvent } from "solid-js/web";

// === SolidStart 运行时 ===
import {
  HttpStatusCode,
  HttpHeader,
  clientOnly,
} from "@solidjs/start";

// === SolidStart Server ===
import {
  createHandler,
  StartServer,
} from "@solidjs/start/server";
import type { APIEvent } from "@solidjs/start/server";

// === SolidStart Client ===
import {
  mount,
  StartClient,
} from "@solidjs/start/client";

// === SolidStart Router 组件 ===
import { FileRoutes } from "@solidjs/start/router";

// === SolidStart Middleware ===
import { createMiddleware } from "@solidjs/start/middleware";

// === SolidStart 配置 ===
import { defineConfig } from "@solidjs/start/config";

// === Solid Router ===
import {
  // 路由
  Router, Route, A,
  // Hooks
  useLocation, useNavigate, useParams, useSearchParams, useMatch, useBeforeLeave,
  // 数据流
  query, action, createAsync, useSubmission, useSubmissions, useAction,
  // 工具
  revalidate, reload, redirect, json,
} from "@solidjs/router";
import type {
  RouteDefinition,
  RouteSectionProps,
  Location,
  Navigator,
} from "@solidjs/router";

// === Solid Meta ===
import {
  MetaProvider,
  Title,
  Meta,
  Link,
  Style,
} from "@solidjs/meta";

// === Vinxi HTTP（v1）===
import {
  useSession,
  getCookie, setCookie, deleteCookie, parseCookies,
  getHeader, getHeaders,
  setResponseHeader, appendResponseHeader,
  getRequestURL, getRequestIP,
  readBody, readMultipartFormData,
} from "vinxi/http";
```

## 数据加载完整模式速查

### 模式 1：基础 query + Suspense

```tsx
const getX = query(async () => {
  "use server";
  return await db.x.findMany();
}, "x");

export default function Page() {
  const x = createAsync(() => getX());
  return (
    <Suspense fallback={<Loading />}>
      <For each={x()}>{(item) => <Item {...item} />}</For>
    </Suspense>
  );
}
```

### 模式 2：preload + ErrorBoundary

```tsx
const getX = query(async (id: string) => {
  "use server";
  return await db.x.findUnique({ where: { id } });
}, "x");

export const route = {
  preload: ({ params }) => getX(params.id),
} satisfies RouteDefinition;

export default function Page(props: RouteSectionProps) {
  const x = createAsync(() => getX(props.params.id));
  return (
    <ErrorBoundary fallback={<Error />}>
      <Suspense fallback={<Loading />}>
        <Detail value={x()} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

### 模式 3：受保护路由（deferStream）

```tsx
const getUser = query(async () => {
  "use server";
  const session = await getSession();
  if (!session.data.userId) throw redirect("/login");
  return await db.user.findUnique({ where: { id: session.data.userId } });
}, "currentUser");

export const route = {
  preload: () => getUser(),
} satisfies RouteDefinition;

export default function Protected() {
  // deferStream 让 redirect 在 streaming 开始前生效
  const user = createAsync(() => getUser(), { deferStream: true });
  return <h1>欢迎，{user()?.name}</h1>;
}
```

### 模式 4：action + 自动 revalidate

```tsx
const getPosts = query(async () => {
  "use server";
  return await db.posts.findMany();
}, "posts");

const createPost = action(async (formData: FormData) => {
  "use server";
  await db.posts.create({ title: formData.get("title") as string });
  // 自动 revalidate getPosts
}, "createPost");

export const route = {
  preload: () => getPosts(),
} satisfies RouteDefinition;

export default function Page() {
  const posts = createAsync(() => getPosts());
  return (
    <>
      <For each={posts()}>{(p) => <li>{p.title}</li>}</For>
      <form action={createPost} method="post">
        <input name="title" />
        <button>添加</button>
      </form>
    </>
  );
}
```

### 模式 5：Optimistic UI（乐观更新）

```tsx
const addItem = action(async (formData: FormData) => {
  "use server";
  await db.items.create({ /* ... */ });
}, "addItem");

export default function Page() {
  const items = createAsync(() => getItems());
  const submission = useSubmission(addItem);

  return (
    <>
      <ul>
        <For each={items()}>{(item) => <li>{item.name}</li>}</For>
        <Show when={submission.pending}>
          <li style={{ opacity: 0.5 }}>
            {submission.input?.[0]?.get("name")?.toString()}
          </li>
        </Show>
      </ul>
      <form action={addItem} method="post">
        <input name="name" />
        <button>添加</button>
      </form>
    </>
  );
}
```

## 与 Solid 的差异速查

| 维度 | 裸 Solid（Vite + vite-plugin-solid） | SolidStart |
|---|---|---|
| 路由 | 手动装配 `<Router>` + `<Route>` | `<FileRoutes />` 自动 |
| 数据加载 | 无内置 | `query` + `createAsync` |
| 副作用 | 无内置 | `action` + `useSubmission` |
| SSR | 需要手写 `renderToString` | `createHandler` + `<StartServer>` |
| Server function | 无 | `"use server"` 指令 |
| 部署 adapter | 无 | Nitro 17+ 预设 |
| Meta 管理 | 需要 `@solidjs/meta` 自配 | 同（推荐安装） |
| Session | 无 | `useSession` from `vinxi/http` |
| 文件结构 | 自由 | 约定（`routes/` / `entry-*.tsx`） |

## 与其他元框架对比

| 维度 | SolidStart 1.x | Next.js 15 | Nuxt 4 | SvelteKit 2 | Remix 2 / RR v7 |
|---|---|---|---|---|---|
| UI 库 | Solid | React | Vue | Svelte | React |
| 文件路由 | ✅ `src/routes/` | ✅ `app/` | ✅ `pages/` | ✅ `src/routes/` | ✅ `app/routes/` |
| Server functions | `"use server"` 指令 | Server Actions（同名） | `defineEventHandler` | form actions | loader / action |
| RSC 概念 | **无**（整树 client 渲染） | 有（默认 Server Components） | 无 | 无 | 无 |
| 数据加载 | `query` + `createAsync` | RSC fetch / `use()` | `useFetch` / `useAsyncData` | `load()` | `loader` |
| 表单 | `action` + `<form>` | Server Actions + `<form>` | `useSubmit` | form actions | `Form` |
| 渲染模式 | CSR / SSR / Streaming / SSG | RSC + Streaming + ISR | SSR / SSG / SPA / ISR | SSR / SSG / SPA | SSR / SPA |
| 底层 server | Nitro | Node / Edge | Nitro | Node / Edge | Node / Edge |
| Bundle 体积 | 小（~20KB） | 较大（~80KB+） | 中（~30KB） | 较小（~20KB） | 较大（基于 React） |
| 心智模型 | 细粒度响应式 + 服务器函数 | RSC 边界 + 重渲染 | 响应式代理 + Composables | rune + signal | loader/action |

## 调试与开发工具

| 工具 | 用途 |
|---|---|
| [Solid Devtools](https://github.com/thetarnav/solid-devtools) 浏览器扩展 | 看响应式图 / signal 依赖 / 组件树 |
| Vite DevServer | HMR + 错误覆盖层 |
| Vinxi CLI | `vinxi dev` / `vinxi build` / `vinxi start` |
| Browser DevTools | Network 面板看 `/_server` 端点（server function 调用） |
| Vitest + `vite-plugin-solid` | 单元测试 |
| Playwright | E2E 测试（与 SolidStart 兼容良好） |

## 学习资源

- [SolidStart 官方文档](https://docs.solidjs.com/solid-start) — 一手参考
- [Solid 主文档](https://docs.solidjs.com/) — Solid 本体
- [Solid 教程](https://www.solidjs.com/tutorial) — 交互式 Solid 教程
- [Templates 仓库](https://github.com/solidjs/solid-start/tree/main/examples) — 各场景示例项目
- [HackerNews 克隆](https://github.com/solidjs/solid-start/tree/main/examples/hackernews) — 最完整的范例（含 SSR / 路由 / 数据加载）
- [TodoMVC 实现](https://github.com/solidjs/solid-start/tree/main/examples/todomvc) — 基础范例
- [Kobalte UI](https://kobalte.dev/) — 推荐的无障碍组件库
- [Solid Primitives](https://primitives.solidjs.community/) — 官方 primitives 集合（含 i18n / Storage / Devices / 等）
- [Solid Discord](https://discord.com/invite/solidjs) — 官方社区
