---
layout: doc
outline: [2, 3]
---

# 指南 - 基础

> SvelteKit 核心思想：文件路由、`load` 函数、Form Actions、Hooks、Cookies / Headers

## 速查

- 路由约定：`+page.svelte` / `+page.ts` / `+page.server.ts` / `+layout.*` / `+error.svelte` / `+server.ts`
- 动态段：`[slug]` / `[...rest]` / `[[optional]]`；matcher 写在 `src/params/`
- 路由组：`(group)` 不影响 URL，仅共享 layout；私有目录 `_folder` 不参与路由
- `load`：Universal `+page.ts` 双端跑；Server `+page.server.ts` 仅服务端
- Form Action：定义在 `+page.server.ts` 的 `actions` 对象；`<form method="POST">` 自动提交；`use:enhance` 升级 SPA
- Hooks：`hooks.server.ts`（`handle` / `handleFetch` / `handleError` / `init` / `handleValidationError`）；`hooks.client.ts`（`handleError` / `init`）；`hooks.ts`（`reroute` / `transport`）
- `$app/state`：`page` / `navigating` / `updated`（runes-based，**Svelte 5 推荐**）
- `$app/navigation`：`goto` / `invalidate` / `invalidateAll` / `preloadCode` / `preloadData` / `beforeNavigate` / `afterNavigate` / `pushState` / `replaceState`
- Cookies：`event.cookies.get(name)` / `event.cookies.set(name, value, { path: '/' })`
- Headers：`event.request.headers` 读；`setHeaders({ ... })` 写响应头（不含 set-cookie）

## 文件路由全貌

`src/routes/` 目录结构 = URL 结构。文件名前缀决定文件的角色：

```
src/routes/
├── +layout.svelte              # 根 layout（所有路由都包）
├── +layout.server.ts           # 根 server layout load
├── +page.svelte                # /
├── +error.svelte               # 根 error boundary
├── about/
│   └── +page.svelte            # /about
├── blog/
│   ├── +page.svelte            # /blog
│   ├── +page.ts                # /blog 的 universal load
│   └── [slug]/
│       ├── +page.svelte        # /blog/:slug
│       ├── +page.server.ts     # 仅服务端 load
│       └── +error.svelte       # 这一段的 error UI
├── dashboard/
│   ├── +layout.svelte          # /dashboard 子树共享 layout
│   ├── +layout.server.ts       # /dashboard 子树的 server load（拿用户）
│   └── +page.svelte            # /dashboard
└── api/
    └── users/
        └── +server.ts          # /api/users（GET/POST/...）
```

组件树嵌套：

```
<RootLayout data={rootData}>
  <DashboardLayout data={mergedData}>
    <ErrorBoundary fallback={<Error />}>
      <Page data={mergedData} />
    </ErrorBoundary>
  </DashboardLayout>
</RootLayout>
```

### `+page.svelte` —— 页面组件

最常见的文件，接收 `data` 和 `form` props：

```svelte
<!-- src/routes/blog/+page.svelte -->
<script lang="ts">
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();
</script>

<h1>Blog</h1>
<ul>
  {#each data.posts as post}
    <li><a href="/blog/{post.slug}">{post.title}</a></li>
  {/each}
</ul>
```

- `data` —— 由 `+page.ts` / `+page.server.ts` / 上层 `+layout.*.ts` 的 `load` 返回值合并
- `form` —— 由 form action 返回的对象，提交后注入
- 类型由自动生成的 `./$types` 模块提供（隐藏在 `.svelte-kit/types/` 下）

### `+page.ts` / `+page.server.ts` —— `load` 函数

Universal load（两端都跑）：

```ts
// src/routes/blog/+page.ts
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, url }) => {
  const res = await fetch(`/api/posts?page=${url.searchParams.get('page') ?? 1}`);
  return { posts: await res.json() };
};
```

Server-only load（数据库 / 私密 env / cookies）：

```ts
// src/routes/blog/+page.server.ts
import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
  const page = Number(url.searchParams.get('page') ?? 1);
  const posts = await db.post.findMany({
    skip: (page - 1) * 10,
    take: 10
  });
  return { posts, user: locals.user };
};
```

### `+layout.svelte` —— 共享布局

```svelte
<!-- src/routes/dashboard/+layout.svelte -->
<script lang="ts">
  import type { LayoutProps } from './$types';

  let { data, children }: LayoutProps = $props();
</script>

<aside>
  <h2>Welcome {data.user.name}</h2>
  <nav>
    <a href="/dashboard">Overview</a>
    <a href="/dashboard/settings">Settings</a>
  </nav>
</aside>

<section>
  {@render children()}
</section>
```

特性：

- **导航时不重新挂载**：从 `/dashboard/a` 到 `/dashboard/b`，layout 保持挂载，DOM 状态、scroll 都保留
- **嵌套**：任意子目录可放 `+layout.svelte`，包子树
- **根布局不写 `<html>`/`<body>`**（那是 `app.html` 的责任）

### `+layout.ts` / `+layout.server.ts`

```ts
// src/routes/dashboard/+layout.server.ts
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(303, '/login');
  }
  return { user: locals.user };
};
```

子页面通过 `data.user` 拿到（自动合并 layout + page data）。

### `+error.svelte` —— 错误边界

```svelte
<!-- src/routes/+error.svelte -->
<script lang="ts">
  import { page } from '$app/state';
</script>

<h1>{page.status}</h1>
<p>{page.error?.message ?? '出错了'}</p>

{#if page.status === 404}
  <a href="/">回首页</a>
{/if}
```

SvelteKit 从抛错位置**向上查找最近的 `+error.svelte`**；找不到走 `src/error.html` 兜底。

### `+server.ts` —— API 端点

```ts
// src/routes/api/users/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const users = await db.user.findMany();
  return json(users);
};

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  const user = await db.user.create({ data });
  return json(user, { status: 201 });
};

// 兜底：处理未定义的方法
export const fallback: RequestHandler = async ({ request }) => {
  return new Response(`${request.method} not implemented`, { status: 405 });
};
```

支持 `GET` / `HEAD` / `POST` / `PUT` / `PATCH` / `DELETE` / `OPTIONS`。

**Content Negotiation**：如果同一段路由既有 `+page.svelte` 又有 `+server.ts`，且方法是 `GET`/`POST`/`HEAD`：

- `Accept: text/html` 优先 → 走 `+page`
- 否则走 `+server`

便于「页面 + 同 URL 的 JSON API」共存（如 `/api/users` 同时给页面和 fetch 用）。

## `load` 函数完整指南

### 参数

`load` 函数接收 `LoadEvent`（universal）或 `ServerLoadEvent`（server-only），常用字段：

| 字段 | 描述 | 仅 server？ |
|---|---|---|
| `fetch` | 增强版 fetch，自动转发 cookie / SSR 时直接调内部 endpoint 不走 HTTP | 否 |
| `params` | 动态路由参数对象 | 否 |
| `url` | `URL` 实例（含 `searchParams`） | 否 |
| `route` | `{ id: '/blog/[slug]' }` | 否 |
| `parent` | 拿父 layout load 返回值 | 否 |
| `depends` | 注册自定义依赖 | 否 |
| `setHeaders` | 设置响应 header（不含 set-cookie） | 仅 server |
| `cookies` | 读写 cookie | 仅 server |
| `locals` | 在 hooks 里塞进去的请求级数据（user / session） | 仅 server |
| `request` | 原始 `Request` 对象 | 仅 server |
| `platform` | adapter 注入的平台数据（如 Cloudflare bindings） | 仅 server |
| `untrack` | 排除某个值的依赖追踪 | 否 |
| `isDataRequest` | 是否是导航触发的 data 请求（false = 初次 SSR） | 否 |

### 返回值

任意可序列化对象。**Server load 必须 devalue 兼容**（JSON 基础 + Date / BigInt / Map / Set / RegExp）；Universal load 可以返回组件、类等。

```ts
export const load: PageLoad = async ({ fetch, params }) => {
  const res = await fetch(`/api/posts/${params.slug}`);
  return {
    post: await res.json(),
    loadedAt: new Date()   // server load 可以；客户端拿到的也是 Date 实例
  };
};
```

### `fetch` 增强

`event.fetch` 与全局 `fetch` 相比：

- **服务端**：相对路径（`/api/...`）自动加 origin；调内部 `+server.ts` **不走 HTTP**，直接调用 handler（性能好且省一次 round trip）
- **SSR 时**：把响应 inline 到 HTML，客户端 hydrate 时同一份请求**不会重复发**
- **客户端**：自动转发 cookie / authorization header（同源 / 子域）

### Promise.all & 并行加载

SvelteKit 2 **不再**自动 await load 返回的 top-level promise，避免 waterfall：

```ts
// ❌ Waterfall：postsP 等到 userP 完成后才开始
export const load = async ({ fetch }) => {
  const user = await fetch('/api/user').then(r => r.json());
  const posts = await fetch('/api/posts').then(r => r.json());
  return { user, posts };
};

// ✅ 并行
export const load = async ({ fetch }) => {
  const [user, posts] = await Promise.all([
    fetch('/api/user').then(r => r.json()),
    fetch('/api/posts').then(r => r.json())
  ]);
  return { user, posts };
};
```

### `parent()` —— 拿父 load 数据

```ts
// src/routes/dashboard/settings/+page.ts
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  const { user } = await parent();    // 拿 +layout.ts 的返回
  return { settings: await loadSettings(user.id) };
};
```

> 调 `parent()` 会**等父 load 完成**，可能形成 waterfall。能不调就不调。

### `depends()` & `invalidate()` —— 手动失效

`load` 自动追踪 `fetch(url)` 和 `params` / `url` 的依赖。要追踪**自定义键**用 `depends`，从客户端用 `invalidate` 触发重跑：

```ts
// src/routes/random/+page.ts
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ depends }) => {
  depends('app:random');
  return { value: Math.random() };
};
```

```svelte
<script lang="ts">
  import { invalidate } from '$app/navigation';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<p>Value: {data.value}</p>
<button onclick={() => invalidate('app:random')}>Refresh</button>
```

或按 URL 失效：

```ts
import { invalidate } from '$app/navigation';
await invalidate('/api/posts');                       // 失效用过这个 URL 的 load
await invalidate((url) => url.pathname.startsWith('/api'));   // 按规则
```

强制全部重跑：

```ts
import { invalidateAll } from '$app/navigation';
await invalidateAll();
```

### `error()` & `redirect()`

```ts
import { error, redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
  const post = await fetchPost(params.slug);

  if (!post) error(404, 'Post not found');                       // 渲染最近的 +error.svelte
  if (post.draft && !user) redirect(303, `/login?redirectTo=${url.pathname}`);

  return { post };
};
```

要点：

- **SvelteKit 2 不要 `throw`**（throw 也仍能跑，但官方文档推荐直接调）
- `error()` 接受 `(status, message)` 或 `(status, { message, ...extra })`
- `redirect()` 用 303（POST 后跳转）或 307/308（保持方法）
- 在 try/catch 里要区分内部 throw 与 error/redirect 用 `isHttpError(e)` / `isRedirect(e)`

### Streaming（Promise 流式返回）

Server load 可以返回**未 await 的 Promise**，让客户端先渲染壳，再流式补齐：

```ts
// src/routes/blog/[slug]/+page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  return {
    // 立刻 await，关键数据
    post: await loadPost(params.slug),

    // 返回 Promise，流式补齐
    comments: loadComments(params.slug),
    related: loadRelated(params.slug)
  };
};
```

页面用 `{#await}` 块处理：

```svelte
<script lang="ts">
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
</script>

<article>
  <h1>{data.post.title}</h1>
  <p>{data.post.content}</p>
</article>

<h2>Comments</h2>
{#await data.comments}
  <p>Loading comments...</p>
{:then comments}
  <ul>
    {#each comments as c}
      <li>{c.body}</li>
    {/each}
  </ul>
{:catch error}
  <p class="error">Failed: {error.message}</p>
{/await}
```

> 仅 **server load** 能 stream。Universal load 必须 await。

## Form Actions

定义在 `+page.server.ts` 的 `actions` 对象，处理 POST 表单。无 JS 也能跑。

### default action（默认）

```ts
// src/routes/contact/+page.server.ts
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const email = data.get('email') as string;
    const message = data.get('message') as string;

    if (!email) return fail(400, { email, missing: true });

    await sendEmail({ to: 'support@example.com', from: email, body: message });
    return { success: true };
  }
};
```

```svelte
<!-- src/routes/contact/+page.svelte -->
<script lang="ts">
  import type { PageProps } from './$types';
  let { form }: PageProps = $props();
</script>

{#if form?.success}
  <p class="ok">已收到，会尽快回复你。</p>
{/if}

<form method="POST">
  <input name="email" value={form?.email ?? ''} />
  {#if form?.missing}<span class="error">请填写邮箱</span>{/if}

  <textarea name="message"></textarea>

  <button>发送</button>
</form>
```

### 命名 action（多按钮 / 多 form）

```ts
// src/routes/account/+page.server.ts
export const actions: Actions = {
  updateProfile: async ({ request, locals }) => { /* ... */ },
  changePassword: async ({ request, locals }) => { /* ... */ },
  deleteAccount: async ({ locals }) => { /* ... */ }
};
```

```svelte
<form method="POST" action="?/updateProfile">
  <input name="nickname" />
  <button>保存</button>
</form>

<form method="POST" action="?/changePassword">
  <input name="oldPassword" type="password" />
  <input name="newPassword" type="password" />
  <button>修改密码</button>
</form>
```

单个 form 多个按钮：

```svelte
<form method="POST">
  <button formaction="?/save">保存</button>
  <button formaction="?/publish">发布</button>
</form>
```

### `fail()` —— 校验失败

```ts
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const email = data.get('email');

    if (!email) {
      return fail(400, { email, missing: true });
      //                     ^^^^^^^^^^^^^^^^^^^^ 透传到 form prop
    }
  }
};
```

`fail()` 返回的对象作为 `form` prop 注入页面，状态码用 4xx。不要把密码等敏感字段 echo 回去。

### `redirect()` —— 成功后跳转

```ts
import { redirect } from '@sveltejs/kit';

export const actions: Actions = {
  default: async ({ request, cookies, url }) => {
    const data = await request.formData();
    // ... 验证
    cookies.set('sessionid', sessionId, { path: '/', httpOnly: true });

    const next = url.searchParams.get('redirectTo') ?? '/';
    redirect(303, next);
  }
};
```

> SvelteKit 2 起 `redirect()` / `error()` 不再需要 `throw`。

### `use:enhance` —— 渐进增强

加 `use:enhance` 自动升级为 SPA 体验：

```svelte
<script>
  import { enhance } from '$app/forms';
</script>

<form method="POST" use:enhance>
  ...
</form>
```

无 JS 时退化为传统表单提交。有 JS 时：

1. fetch 提交，不刷页
2. 自动更新 `form` prop
3. 自动重跑当前页的 load
4. 自动重置非 file input

### 自定义 `use:enhance`

```svelte
<script lang="ts">
  import { enhance } from '$app/forms';
  let submitting = $state(false);
</script>

<form
  method="POST"
  use:enhance={({ formData, formElement, cancel }) => {
    // 提交前
    submitting = true;
    // formData.append('csrf', token);   // 可改写

    // 返回提交后回调
    return async ({ result, update }) => {
      // result.type: 'success' | 'failure' | 'redirect' | 'error'
      if (result.type === 'success') {
        formElement.reset();
      }
      await update();           // 默认行为：更新 form prop + 重跑 load
      submitting = false;
    };
  }}
>
  <button disabled={submitting}>{submitting ? '提交中…' : '提交'}</button>
</form>
```

> **SvelteKit 2 注意**：回调参数从 `data` / `form` 改名为 `formData` / `formElement`。

## Hooks

三个文件：

- `src/hooks.server.ts` —— 服务端 hooks
- `src/hooks.client.ts` —— 客户端 hooks
- `src/hooks.ts` —— 通用 hooks（reroute / transport）

### `handle` —— 服务端请求拦截

每个 HTTP 请求都过：

```ts
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // 拦截 / 重写
  if (event.url.pathname.startsWith('/internal')) {
    return new Response('Not allowed', { status: 403 });
  }

  // 注入 locals（后续 load / actions / +server 可用）
  const sessionId = event.cookies.get('sessionid');
  if (sessionId) {
    event.locals.user = await getUserBySession(sessionId);
  }

  // 真正处理路由
  const response = await resolve(event);

  // 改响应
  response.headers.set('x-served-by', 'sveltekit');
  return response;
};
```

`resolve` 可传选项：

```ts
const response = await resolve(event, {
  transformPageChunk: ({ html }) => html.replace('%foo%', 'bar'),
  filterSerializedResponseHeaders: (name) => name === 'content-type',
  preload: ({ type, path }) => type === 'font' || type === 'css'
});
```

### `sequence` —— 串联多个 handle

```ts
import { sequence } from '@sveltejs/kit/hooks';
import { Auth } from '@auth/sveltekit';
import { paraglide } from '$lib/paraglide.server';

export const handle = sequence(Auth, paraglide, customHandle);
```

每个 handle 拿到的 `event.locals` / response 都是上一个处理后的。

### `handleFetch` —— 改写服务端 fetch

```ts
// src/hooks.server.ts
import type { HandleFetch } from '@sveltejs/kit';

export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
  // 把 api.example.com 改成内网地址
  if (request.url.startsWith('https://api.example.com/')) {
    request = new Request(
      request.url.replace('https://api.example.com', 'http://internal:8080'),
      request
    );
  }
  return fetch(request);
};
```

### `handleError` —— 错误捕获

服务端 + 客户端都有 `handleError`（在对应文件里导出）：

```ts
// src/hooks.server.ts
import type { HandleServerError } from '@sveltejs/kit';
import * as Sentry from '@sentry/node';

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
  const errorId = crypto.randomUUID();
  Sentry.captureException(error, { extra: { event, errorId, status } });

  return {
    message: 'Whoops! 请稍后重试',
    errorId   // 透传到 +error.svelte 的 page.error
  };
};
```

要扩展 error 形状，改 `src/app.d.ts`：

```ts
declare global {
  namespace App {
    interface Error {
      message: string;
      errorId?: string;
    }
  }
}
```

### `handleValidationError`

`remote function`（experimental）参数校验失败时调：

```ts
// src/hooks.server.ts
export function handleValidationError({ issues }) {
  return { message: '参数无效' };
}
```

### `init` —— 启动钩子

服务端启动 / 客户端首次加载时跑一次：

```ts
// src/hooks.server.ts
import * as db from '$lib/server/db';

export async function init() {
  await db.connect();
  console.log('DB connected');
}
```

### `reroute` —— URL → 路由的映射

```ts
// src/hooks.ts
import type { Reroute } from '@sveltejs/kit';

const translated: Record<string, string> = {
  '/en/about': '/about',
  '/de/ueber-uns': '/about',
  '/fr/a-propos': '/about'
};

export const reroute: Reroute = ({ url }) => {
  return translated[url.pathname];
};
```

异步版本（SvelteKit 2.18+）：

```ts
export const reroute: Reroute = async ({ url, fetch }) => {
  const r = await fetch(`/api/translate?path=${url.pathname}`).then(r => r.json());
  return r.pathname;
};
```

### `transport` —— 自定义类型序列化

`load` 返回值默认通过 [devalue](https://github.com/Rich-Harris/devalue) 序列化（支持 Date / Map / Set / 等）。要传自定义类，在 `hooks.ts` 里注册：

```ts
// src/hooks.ts
import { Vector } from '$lib/math';
import type { Transport } from '@sveltejs/kit';

export const transport: Transport = {
  Vector: {
    encode: (value) => value instanceof Vector && [value.x, value.y],
    decode: ([x, y]) => new Vector(x, y)
  }
};
```

## `$app/state` & `$app/navigation`

SvelteKit 2.12+ 引入 **runes-based** `$app/state`，**替代** 老的 `$app/stores`。

### `page` —— 当前页面信息

```svelte
<script lang="ts">
  import { page } from '$app/state';
</script>

<h1>{page.url.pathname}</h1>
<p>Status: {page.status}</p>
<p>User: {page.data.user?.name ?? '游客'}</p>
{#if page.error}<p class="error">{page.error.message}</p>{/if}
```

`page` 字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `url` | `URL` | 当前 URL |
| `params` | `Record<string,string>` | 路由参数 |
| `route` | `{ id: string \| null }` | 路由 ID（如 `/blog/[slug]`） |
| `status` | `number` | HTTP 状态码 |
| `error` | `App.Error \| null` | 错误对象 |
| `data` | `App.PageData` | load 返回的合并 data |
| `form` | `any` | 当前 form action 返回值 |
| `state` | `App.PageState` | pushState / replaceState 设置的状态 |

> **Svelte 4 → 5 / SvelteKit 1 → 2 用户**：原来 `import { page } from '$app/stores'; $page.url` → 现在 `import { page } from '$app/state'; page.url`（去掉 `$`，去掉 `.` 前的 `$`）。

### `navigating` —— 导航中状态

```svelte
<script lang="ts">
  import { navigating } from '$app/state';
</script>

{#if navigating.to}
  <progress>Loading {navigating.to.url.pathname}...</progress>
{/if}
```

### `updated` —— 应用版本更新检测

```svelte
<script lang="ts">
  import { updated } from '$app/state';
</script>

{#if updated.current}
  <button onclick={() => location.reload()}>有新版本，点此刷新</button>
{/if}
```

启用：在 `svelte.config.js` 配 `kit.version.pollInterval` 周期检查。

### `goto` —— 编程式导航

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
</script>

<button onclick={() => goto('/dashboard')}>Go</button>
<button onclick={() => goto('/login', { replaceState: true, invalidateAll: true })}>
  Login
</button>
```

参数：

- `replaceState` —— 替换历史而不是 push
- `noScroll` —— 不重置滚动位置
- `keepFocus` —— 保持当前焦点
- `invalidateAll` —— 跳转后强制重跑所有 load
- `invalidate: string[]` —— 跳转后失效特定依赖
- `state: App.PageState` —— 注入 `page.state`

> SvelteKit 2 起 `goto` **不接受外部 URL**，跳外站用 `window.location.href`。

### `invalidate` / `invalidateAll` / `preloadCode` / `preloadData`

```ts
import {
  invalidate,
  invalidateAll,
  preloadCode,
  preloadData
} from '$app/navigation';

await invalidate('app:random');             // 失效特定依赖
await invalidate('/api/posts');             // 按 URL
await invalidateAll();                       // 全部
await preloadCode('/blog');                  // 预热路由代码（不调 load）
await preloadData('/blog/foo');             // 预热路由 + 调 load
```

### `beforeNavigate` / `afterNavigate` / `onNavigate`

```svelte
<script lang="ts">
  import { beforeNavigate, afterNavigate } from '$app/navigation';

  beforeNavigate(({ cancel, to, from, type }) => {
    if (hasUnsavedChanges && !confirm('未保存，确认离开？')) {
      cancel();
    }
  });

  afterNavigate(({ to }) => {
    track('pageview', to?.url.pathname);
  });
</script>
```

`onNavigate` 是过渡专用，在 DOM 更新前跑（支持 View Transitions API）。

### `pushState` / `replaceState` —— Shallow Routing

不导航的情况下加历史项（modal / drawer 场景）：

```svelte
<script lang="ts">
  import { pushState } from '$app/navigation';
  import { page } from '$app/state';
</script>

<button onclick={() => pushState('', { showModal: true })}>
  Open
</button>

{#if page.state.showModal}
  <div class="modal" onclick={() => history.back()}>...</div>
{/if}
```

`App.PageState` 在 `app.d.ts` 加类型：

```ts
declare namespace App {
  interface PageState {
    showModal?: boolean;
  }
}
```

## Cookies

只能在**服务端**用（hooks / `+page.server.ts` / `+server.ts` / `+layout.server.ts`）。

```ts
export const load: PageServerLoad = async ({ cookies }) => {
  const theme = cookies.get('theme') ?? 'light';
  return { theme };
};

export const actions: Actions = {
  default: async ({ cookies, request }) => {
    const data = await request.formData();
    cookies.set('theme', data.get('theme') as string, {
      path: '/',                // ⚠️ SvelteKit 2 必填
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
  }
};
```

API：

- `cookies.get(name)` —— 读，返回 string 或 undefined
- `cookies.getAll()` —— 全部
- `cookies.set(name, value, options)` —— 设；`path` 必填
- `cookies.delete(name, options)` —— 删；`path` 必填
- `cookies.serialize(name, value, options)` —— 拿 Set-Cookie 字符串

> **重要变更（SvelteKit 2）**：`cookies.set` / `cookies.delete` / `cookies.serialize` 都必须传 `path`。基本都用 `'/'`。

## Headers

读请求头：

```ts
export const load: PageServerLoad = async ({ request }) => {
  const ua = request.headers.get('user-agent');
  return { ua };
};
```

写响应头：

```ts
export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
  const res = await fetch('/api/data');
  setHeaders({
    'cache-control': res.headers.get('cache-control') ?? 'no-cache',
    'age': res.headers.get('age') ?? '0'
  });
  return { data: await res.json() };
};
```

> `setHeaders` 不能设 `set-cookie`（用 `cookies.set` 代替）。同名 header 只能设一次，再设报错。

## `locals` —— 请求级数据

在 `handle` hook 里塞数据，后续 `load` / `actions` / `+server.ts` 都能拿：

```ts
// src/app.d.ts
declare global {
  namespace App {
    interface Locals {
      user: { id: string; name: string } | null;
    }
  }
}
```

```ts
// src/hooks.server.ts
export const handle: Handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get('sessionid');
  event.locals.user = sessionId ? await getUserBySession(sessionId) : null;
  return resolve(event);
};
```

```ts
// 任意 +page.server.ts
export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) redirect(303, '/login');
  return { user: locals.user };
};
```

## 高级路由（基础部分）

### 路由组 `(group)`

不影响 URL，仅用于共享 layout。常用于「应用区 / 营销区」分组：

```
src/routes/
├── (marketing)/
│   ├── +layout.svelte       # 营销页 layout（landing 风格）
│   ├── +page.svelte         # /
│   └── pricing/
│       └── +page.svelte     # /pricing
└── (app)/
    ├── +layout.svelte       # 应用 layout（带导航 / 用户菜单）
    ├── dashboard/
    │   └── +page.svelte     # /dashboard
    └── settings/
        └── +page.svelte     # /settings
```

`(marketing)` 和 `(app)` 都不出现在 URL 里。

### 跳出 layout `@`

`+page@.svelte` 跳出所有 layout，回到根；`+page@(app).svelte` 跳到特定 layout：

```
src/routes/
├── +layout.svelte                          # 根
└── (app)/
    ├── +layout.svelte
    └── full-screen/
        └── +page@.svelte                   # 不要 (app) layout，也不要根 layout
```

### Matcher

`src/params/integer.ts`：

```ts
import type { ParamMatcher } from '@sveltejs/kit';

export const match: ParamMatcher = (param) => {
  return /^\d+$/.test(param);
};
```

```
src/routes/
└── posts/
    └── [id=integer]/
        └── +page.svelte       # /posts/123 匹配，/posts/abc 不匹配（404）
```

### 私有目录 `_folder`

下划线前缀的文件夹**不参与路由**，用于放路由相关但不公开的组件 / utils：

```
src/routes/
├── blog/
│   ├── _components/
│   │   └── PostCard.svelte    # 这个文件不会变成路由
│   └── +page.svelte
```

## 常见问题

### 1. layout 改了但页面没生效

`+layout.svelte` 在导航时**不重新挂载**，但 `data` 会重算。如果你只是给 layout 加 `<style>`，刷新页面即可。Layout 的 `load` 默认**不会**因子页变化重跑（除非依赖被 invalidate）。

### 2. `load` 跑了两次

Universal load 在 SSR 跑一次，hydration 时再跑一次。这是正常行为 —— 要确保**幂等**。要避免重复请求，把数据拿到 server load。

### 3. `params.slug` 是 `undefined`

如果路由是 `[slug]` 但定义在 `[[slug]]`（可选），未传时 `params.slug` 就是 `undefined`。

### 4. `request.formData()` 拿不到 file

`<input type="file">` 的 form 必须加 `enctype="multipart/form-data"`，否则 SvelteKit 2 起 `use:enhance` 会报错。

### 5. `error()` 之后代码还在跑

`error()` / `redirect()` 内部会 throw，TypeScript 的控制流分析能正确识别。但如果你在 try/catch 里捕获，要用 `isHttpError` / `isRedirect` 重新抛出：

```ts
import { error, isHttpError, isRedirect } from '@sveltejs/kit';

try {
  // ...
  error(404, 'not found');
} catch (e) {
  if (isHttpError(e) || isRedirect(e)) throw e;
  console.error(e);
  error(500, 'unexpected');
}
```
