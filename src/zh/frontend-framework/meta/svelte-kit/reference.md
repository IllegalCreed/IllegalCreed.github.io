---
layout: doc
outline: [2, 3]
---

# 参考

> SvelteKit 2.x（Svelte 5 runes）全部 API / 文件约定 / 配置 / Hook 速查

## 文件约定

`src/routes/` 下的特殊文件名决定其在路由中的角色。

| 文件 | 路径 | 作用 | 运行位置 |
|---|---|---|---|
| `+page.svelte` | 任意段 | 页面组件（叶子） | SSR + CSR |
| `+page.ts` | 任意段 | Universal load + 页面选项 | 双端 |
| `+page.server.ts` | 任意段 | Server load + Form Actions | 仅 server |
| `+layout.svelte` | 任意段 | 共享布局 | SSR + CSR |
| `+layout.ts` | 任意段 | Universal layout load | 双端 |
| `+layout.server.ts` | 任意段 | Server layout load | 仅 server |
| `+error.svelte` | 任意段 | 错误边界 UI | SSR + CSR |
| `+server.ts` | 任意段 | HTTP 端点（GET/POST/...） | 仅 server |
| `app.html` | `src/` | HTML 模板 | — |
| `error.html` | `src/` | 兜底错误页 | — |
| `app.d.ts` | `src/` | App 命名空间类型 | — |
| `hooks.server.ts` | `src/` | 服务端 hooks | 仅 server |
| `hooks.client.ts` | `src/` | 客户端 hooks | 仅 client |
| `hooks.ts` | `src/` | 通用 hooks（reroute / transport） | 双端 |
| `service-worker.ts` | `src/` | Service Worker | 浏览器 SW |
| `instrumentation.server.ts` | `src/` | 启动 instrumentation | 仅 server |

支持扩展名：`.ts` / `.js`（`+page.svelte` / `+layout.svelte` / `+error.svelte` 是 `.svelte`）。

### `+page.svelte`

```svelte
<script lang="ts">
  import type { PageProps } from './$types';
  let { data, form }: PageProps = $props();
</script>

<h1>{data.title}</h1>
```

可选导出（页面选项）：

```ts
// 也可写在 +page.ts 或 +page.server.ts
export const prerender = true;
export const ssr = true;
export const csr = true;
export const trailingSlash = 'never';
export const config = { runtime: 'edge' };
```

### `+page.ts`（Universal Load）

```ts
import type { PageLoad } from './$types';

export const load: PageLoad = async ({
  fetch, params, url, route, parent, depends, untrack, data
}) => {
  return { title: 'Hello' };
};

// 页面选项
export const prerender = true;
export const ssr = true;
export const csr = true;
```

`LoadEvent` 字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `fetch` | 增强 fetch | 自动转 cookie，server 上调内部 endpoint 不走 HTTP |
| `params` | `Record<string,string>` | 路由参数 |
| `url` | `URL` | 当前 URL |
| `route` | `{ id: string }` | 路由 ID（`/blog/[slug]`） |
| `parent` | `() => Promise<ParentData>` | 拿父 load 数据 |
| `depends` | `(...deps: string[]) => void` | 注册自定义依赖 |
| `untrack` | `<T>(fn: () => T) => T` | 排除依赖追踪 |
| `data` | `PageServerData` | 同路由 server load 的返回（合并到 page data） |
| `setHeaders` | `(headers: Record<string,string>) => void` | 设响应 header（仅 server 阶段生效） |

### `+page.server.ts`（Server Load + Actions）

```ts
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({
  fetch, params, url, route, parent, depends, untrack,
  cookies, locals, request, setHeaders, platform, isDataRequest
}) => {
  return { posts: await db.post.findMany() };
};

export const actions: Actions = {
  default: async ({ cookies, request, locals, url, params }) => {
    const data = await request.formData();
    if (!data.get('email')) return fail(400, { missing: true });
    // ...
    redirect(303, '/done');
  },
  login: async (event) => { /* ... */ },
  register: async (event) => { /* ... */ }
};

// 动态路由的 prerender entries
export const entries: EntryGenerator = async () => {
  return [{ slug: 'a' }, { slug: 'b' }];
};
```

`ServerLoadEvent` 额外字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `cookies` | `Cookies` | 读写 cookie |
| `locals` | `App.Locals` | hooks 注入的请求级数据 |
| `request` | `Request` | 原始 Request 对象 |
| `platform` | `App.Platform` | adapter 平台数据（CF bindings 等） |
| `isDataRequest` | `boolean` | 是否是导航触发的 data 请求 |
| `isSubRequest` | `boolean` | 是否是从同 SvelteKit 应用内部 fetch 调用 |

### `+layout.svelte`

```svelte
<script lang="ts">
  import type { LayoutProps } from './$types';
  let { data, children }: LayoutProps = $props();
</script>

<aside>{data.user?.name}</aside>
<main>{@render children()}</main>
```

> **根 layout 不写 `<html>`/`<body>`**，那是 `app.html` 的职责。

### `+layout.ts` / `+layout.server.ts`

签名与 `+page.ts` / `+page.server.ts` 类似，类型用 `LayoutLoad` / `LayoutServerLoad`。

```ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  return { user: locals.user };
};
```

> `+layout.server.ts` **不支持 `actions`**（actions 必须放 `+page.server.ts`）。

### `+error.svelte`

```svelte
<script lang="ts">
  import { page } from '$app/state';
</script>

<h1>{page.status}</h1>
<p>{page.error?.message ?? '出错了'}</p>
```

无 props；通过 `$app/state` 的 `page` 拿 `status` / `error`。

### `+server.ts`

```ts
import { json, error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, params, fetch, cookies, locals, request, setHeaders, platform }) => {
  return json({ ok: true });
};

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  return new Response(null, { status: 201 });
};

export const PUT: RequestHandler = async () => json({});
export const PATCH: RequestHandler = async () => json({});
export const DELETE: RequestHandler = async () => json({});
export const HEAD: RequestHandler = async () => new Response();
export const OPTIONS: RequestHandler = async () => new Response();

// 兜底
export const fallback: RequestHandler = async ({ request }) => {
  return new Response(`${request.method} not allowed`, { status: 405 });
};

// 页面选项
export const prerender = true;
export const config = { runtime: 'edge' };
```

### `app.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%sveltekit.assets%/favicon.png" />
    <meta name="viewport" content="width=device-width" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

占位变量：

| 占位 | 说明 |
|---|---|
| `%sveltekit.head%` | `<svelte:head>` 内容 + preload links |
| `%sveltekit.body%` | 应用根 DOM |
| `%sveltekit.assets%` | `paths.assets` 或 `paths.base` |
| `%sveltekit.nonce%` | CSP nonce |
| `%sveltekit.env.[NAME]%` | 公共 env 变量注入 |
| `%sveltekit.version%` | 应用版本 |

### `error.html`

```html
<!DOCTYPE html>
<html>
  <body>
    <h1>%sveltekit.status%</h1>
    <p>%sveltekit.error.message%</p>
  </body>
</html>
```

### `app.d.ts`

```ts
declare global {
  namespace App {
    interface Error {
      message: string;
      errorId?: string;
      code?: string;
    }
    interface Locals {
      user: { id: string; name: string } | null;
    }
    interface PageData {
      flash?: { type: 'success' | 'error'; message: string };
    }
    interface PageState {
      showModal?: boolean;
      selected?: string;
    }
    interface Platform {
      env?: { DB: D1Database };
    }
  }
}

export {};
```

## Hooks

### `hooks.server.ts`

```ts
import type { Handle, HandleServerError, HandleFetch } from '@sveltejs/kit';

// 每个请求都过
export const handle: Handle = async ({ event, resolve }) => {
  event.locals.user = await getUser(event.cookies.get('sessionid'));
  const response = await resolve(event, {
    transformPageChunk: ({ html, done }) => html.replace('%foo%', 'bar'),
    filterSerializedResponseHeaders: (name) => name.startsWith('x-'),
    preload: ({ type, path }) => type === 'js' || type === 'css'
  });
  response.headers.set('x-custom', 'value');
  return response;
};

// 改写服务端 fetch
export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
  if (request.url.startsWith('https://api.example.com')) {
    request = new Request(request.url.replace('api.example.com', 'internal:8080'), request);
  }
  return fetch(request);
};

// 错误捕获（服务端）
export const handleError: HandleServerError = async ({ error, event, status, message }) => {
  console.error('[server]', error);
  return { message: 'Whoops!', errorId: crypto.randomUUID() };
};

// remote function 参数校验失败
export function handleValidationError({ issues }) {
  return { message: '参数错误' };
}

// 启动钩子（仅一次）
export async function init() {
  await connectDB();
}
```

`Handle` 的 `resolve` 选项：

```ts
type ResolveOptions = {
  transformPageChunk?: (input: { html: string; done: boolean }) => MaybePromise<string>;
  filterSerializedResponseHeaders?: (name: string, value: string) => boolean;
  preload?: (input: { type: 'font' | 'css' | 'js' | 'asset'; path: string }) => boolean;
};
```

### `hooks.client.ts`

```ts
import type { HandleClientError } from '@sveltejs/kit';

export const handleError: HandleClientError = async ({ error, event, status, message }) => {
  console.error('[client]', error);
  return { message: '客户端错误，请刷新' };
};

export async function init() {
  // 客户端首次启动钩子
}
```

### `hooks.ts`（通用）

```ts
import type { Reroute, Transport } from '@sveltejs/kit';

// URL → 路由映射
export const reroute: Reroute = ({ url, fetch }) => {
  if (url.pathname === '/old') return '/new';
};

// 自定义类型序列化
export const transport: Transport = {
  Vector: {
    encode: (value) => value instanceof Vector && [value.x, value.y],
    decode: ([x, y]) => new Vector(x, y)
  }
};
```

### `sequence` —— 串联多个 handle

```ts
import { sequence } from '@sveltejs/kit/hooks';

export const handle = sequence(authHandle, i18nHandle, customHandle);
```

## `@sveltejs/kit` 导出

### 错误 / 重定向

```ts
import { error, redirect, isHttpError, isRedirect, fail, json, text } from '@sveltejs/kit';

error(404, 'Not found');                                    // 仅 status + message
error(404, { message: 'Not found', code: 'NOT_FOUND' });    // 带额外字段（需在 App.Error 声明）

redirect(303, '/login');                                    // 303 / 307 / 308

if (isHttpError(e)) { /* 是 error() 抛的 */ }
if (isRedirect(e)) { /* 是 redirect() 抛的 */ }

// 仅 actions 用：返回校验失败
fail(400, { email, missing: true });

// Response 便捷封装
json({ ok: true }, { status: 200 });
text('hello', { status: 200 });
```

### 类型

```ts
import type {
  Handle, HandleServerError, HandleClientError, HandleFetch,
  Reroute, Transport,
  RequestHandler, RequestEvent,
  LoadEvent, ServerLoadEvent, Actions, ActionResult,
  Cookies, Navigation, Page, Snapshot, EntryGenerator,
  ParamMatcher, Config, Adapter
} from '@sveltejs/kit';
```

## `$app/state`（2.12+）

替代老的 `$app/stores`。

```ts
import { page, navigating, updated } from '$app/state';
```

### `page`

```ts
interface Page {
  url: URL;
  params: Record<string, string>;
  route: { id: string | null };
  status: number;
  error: App.Error | null;
  data: App.PageData & Record<string, any>;
  form: any;
  state: App.PageState;
}
```

模板里**直接用**（runes 自动响应）：

```svelte
<script>
  import { page } from '$app/state';
</script>

<p>Path: {page.url.pathname}</p>
<p>User: {page.data.user?.name}</p>
{#if page.error}<p>{page.error.message}</p>{/if}
```

### `navigating`

```ts
interface Navigating {
  from: NavigationTarget | null;
  to: NavigationTarget | null;
  type: 'enter' | 'form' | 'leave' | 'link' | 'goto' | 'popstate' | null;
  willUnload: boolean | null;
  delta: number | null;
  complete: Promise<void> | null;
}
```

```svelte
{#if navigating.to}
  <progress>Loading {navigating.to.url.pathname}...</progress>
{/if}
```

### `updated`

```ts
interface Updated {
  current: boolean;
  check: () => Promise<boolean>;
}
```

要启用，在 `svelte.config.js` 设 `kit.version.pollInterval`。

## `$app/navigation`

```ts
import {
  goto,
  invalidate,
  invalidateAll,
  preloadCode,
  preloadData,
  beforeNavigate,
  afterNavigate,
  onNavigate,
  pushState,
  replaceState,
  disableScrollHandling
} from '$app/navigation';
```

### `goto`

```ts
function goto(
  url: string | URL,
  opts?: {
    replaceState?: boolean;
    noScroll?: boolean;
    keepFocus?: boolean;
    invalidateAll?: boolean;
    invalidate?: (string | URL | ((url: URL) => boolean))[];
    state?: App.PageState;
  }
): Promise<void>;
```

> SvelteKit 2 起**不接受外部 URL**。

### `invalidate` / `invalidateAll`

```ts
await invalidate('app:posts');                              // 自定义依赖
await invalidate('/api/posts');                             // URL 依赖
await invalidate((url) => url.pathname.startsWith('/api')); // 自定义判断
await invalidateAll();                                      // 全部
```

### `preloadCode` / `preloadData`

```ts
await preloadCode('/blog');                  // 只下载 JS/CSS
const result = await preloadData('/blog/x'); // 下载 + 调 load
// result: { type: 'loaded'; data } | { type: 'redirect'; location }
```

### 导航生命周期

```ts
beforeNavigate(({ cancel, to, from, type, willUnload, delta }) => {
  if (hasChanges) cancel();
});

afterNavigate(({ to, from, type }) => {
  track(to?.url.pathname);
});

onNavigate(({ to, from, type, complete }) => {
  if (!document.startViewTransition) return;
  return new Promise((resolve) => {
    document.startViewTransition(async () => {
      resolve();
      await complete;
    });
  });
});
```

### Shallow Routing

```ts
import { pushState, replaceState } from '$app/navigation';

pushState('', { showModal: true });                     // 加历史项 + state
replaceState('', { selected: 'foo' });                  // 替换当前
pushState('/new-url', {});                              // 也可改 URL
```

```svelte
<script>
  import { page } from '$app/state';
</script>

{#if page.state.showModal}<Modal />{/if}
```

### `disableScrollHandling`

```ts
disableScrollHandling();   // 在 beforeNavigate / afterNavigate 调用，跳过自动滚动
```

## `$app/forms`

```ts
import { enhance, applyAction, deserialize } from '$app/forms';
```

### `enhance`

```svelte
<script>
  import { enhance } from '$app/forms';
</script>

<form method="POST" use:enhance>...</form>

<form method="POST" use:enhance={({ formElement, formData, action, cancel, submitter }) => {
  // 提交前
  return async ({ result, formElement, formData, action, update }) => {
    // 提交后；result: ActionResult
    await update();   // 默认更新 form prop + 重跑 load
  };
}}>...</form>
```

### `applyAction`

手动应用 ActionResult：

```ts
import { applyAction, deserialize } from '$app/forms';

const response = await fetch('/?/login', { method: 'POST', body: formData });
const result = deserialize(await response.text());
await applyAction(result);
```

## `$app/environment`

```ts
import { browser, dev, building, version } from '$app/environment';

if (browser) { /* 浏览器里 */ }
if (dev) { /* dev mode */ }
if (building) { /* prerender 时 */ }
console.log(version);    // svelte.config.js 的 version.name
```

## `$app/paths`

```ts
import { base, assets, resolveRoute } from '$app/paths';

// base 是 svelte.config.js 的 paths.base
// assets 是 paths.assets
console.log(`${base}/about`);

// 类型安全的 URL 拼装（SvelteKit 2 替代 deprecated 的 resolvePath）
const url = resolveRoute('/blog/[slug]', { slug: 'hello' });
// → '/blog/hello'（已含 base）
```

## `$app/server`

仅服务端：

```ts
import { read } from '$app/server';
import asset from '$lib/data.txt';

const file = read(asset);   // 读 import 的静态资源（兼容 CF Workers）
```

## `$app/stores`（已 deprecated，2.12+）

仍可用，但官方推荐 `$app/state`。差异是 `$app/stores` 返回 Svelte store（用 `$` 前缀订阅）：

```ts
// Deprecated
import { page, navigating, updated } from '$app/stores';
// 模板里：$page.url、$navigating
```

→ 改成 `$app/state` 去掉 `$` 前缀即可。

## `$env/*`

四个模块见 [指南 - 进阶](./guide-line/advanced.md#环境变量四件套)。签名：

```ts
// 仅服务端，build 期 inline
import { DATABASE_URL, STRIPE_SECRET } from '$env/static/private';

// 任意端，build 期 inline；必须 PUBLIC_ 前缀
import { PUBLIC_API_URL } from '$env/static/public';

// 仅服务端，运行时读
import { env } from '$env/dynamic/private';
env.DATABASE_URL;

// 任意端，运行时读
import { env } from '$env/dynamic/public';
env.PUBLIC_API_URL;
```

## `$lib`

```ts
// src/lib/* → $lib
import Button from '$lib/Button.svelte';
import { format } from '$lib/utils';

// src/lib/server/* → $lib/server（仅服务端）
import { db } from '$lib/server/db';
```

## `$service-worker`

仅在 `src/service-worker.ts` 内可用：

```ts
import { build, files, prerendered, version, base } from '$service-worker';
```

| 导出 | 类型 | 说明 |
|---|---|---|
| `build` | `string[]` | Vite 生成的所有 chunk 路径 |
| `files` | `string[]` | `static/` 下的文件 |
| `prerendered` | `string[]` | 已 prerender 的页面 |
| `version` | `string` | 应用版本 |
| `base` | `string` | `paths.base` |

## 页面选项

在 `+page.ts` / `+page.server.ts` / `+layout.ts` / `+layout.server.ts` / `+server.ts` 顶层导出：

```ts
export const prerender = true;          // false | true | 'auto'
export const ssr = true;                // false | true
export const csr = true;                // false | true
export const trailingSlash = 'never';   // 'never' | 'always' | 'ignore'
export const config = {};               // adapter 选项

// 仅动态路由 + prerender
export const entries: EntryGenerator = async () => [{ slug: 'a' }];
```

## Form Action

```ts
// +page.server.ts
import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const actions: Actions = {
  default: async (event) => {
    const data = await event.request.formData();
    return { success: true };
  },
  login: async ({ cookies, request, locals }) => { /* ... */ },
  register: async ({ cookies, request, locals }) => { /* ... */ }
};
```

`fail()` 与普通 return 都注入到 `form` prop。`redirect()` 后无 `form` 数据。

### ActionResult

```ts
type ActionResult =
  | { type: 'success'; status: number; data?: Record<string, any> }
  | { type: 'failure'; status: number; data?: Record<string, any> }
  | { type: 'redirect'; status: number; location: string }
  | { type: 'error'; status: number; error: any };
```

## `link options`（HTML 属性）

| 属性 | 值 | 说明 |
|---|---|---|
| `data-sveltekit-preload-data` | `'hover'` / `'tap'` / `'off'` / `'false'` | 预加载 load 数据 |
| `data-sveltekit-preload-code` | `'eager'` / `'viewport'` / `'hover'` / `'tap'` / `'off'` / `'false'` | 预加载路由代码 |
| `data-sveltekit-reload` | `''` / `true` / `'off'` | 强制全页刷新 |
| `data-sveltekit-replacestate` | `''` / `true` / `'off'` | 用 replace 而非 push |
| `data-sveltekit-keepfocus` | `''` / `true` / `'off'` | 不重置焦点 |
| `data-sveltekit-noscroll` | `''` / `true` / `'off'` | 不滚到顶 |

可用在任意祖先节点（继承），或单个 `<a>` / `<form method="GET">` 上。

## Cookies API

仅服务端：

```ts
event.cookies.get(name: string, opts?: CookieParseOptions): string | undefined;
event.cookies.getAll(opts?: CookieParseOptions): Array<{ name: string; value: string }>;
event.cookies.set(name: string, value: string, opts: CookieSerializeOptions & { path: string }): void;
event.cookies.delete(name: string, opts: CookieSerializeOptions & { path: string }): void;
event.cookies.serialize(name: string, value: string, opts: CookieSerializeOptions & { path: string }): string;
```

`CookieSerializeOptions`（基于 `cookie` 库）：

```ts
{
  domain?: string;
  encode?: (value: string) => string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path: string;            // SvelteKit 2 强制
  priority?: 'low' | 'medium' | 'high';
  sameSite?: 'strict' | 'lax' | 'none' | boolean;
  secure?: boolean;
}
```

## `svelte.config.js`

```js
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  compilerOptions: {
    runes: true                       // 默认 Svelte 5 自动判
  },
  extensions: ['.svelte'],
  kit: {
    adapter: adapter(),
    alias: { '@components': 'src/components' },
    appDir: '_app',
    csp: {
      mode: 'auto',
      directives: { 'script-src': ['self'] }
    },
    csrf: {
      checkOrigin: true,
      trustedOrigins: []
    },
    env: {
      dir: '.',
      publicPrefix: 'PUBLIC_',
      privatePrefix: ''
    },
    files: {
      assets: 'static',
      hooks: { client: 'src/hooks.client', server: 'src/hooks.server', universal: 'src/hooks' },
      lib: 'src/lib',
      params: 'src/params',
      routes: 'src/routes',
      serviceWorker: 'src/service-worker',
      appTemplate: 'src/app.html',
      errorTemplate: 'src/error.html'
    },
    inlineStyleThreshold: 0,
    moduleExtensions: ['.js', '.ts'],
    outDir: '.svelte-kit',
    output: {
      preloadStrategy: 'modulepreload',     // 'modulepreload' | 'preload-js' | 'preload-mjs'
      bundleStrategy: 'split'                // 'split' | 'single' | 'inline'
    },
    paths: {
      assets: '',
      base: '',
      relative: true
    },
    prerender: {
      concurrency: 1,
      crawl: true,
      entries: ['*'],
      handleHttpError: 'fail',               // 'fail' | 'warn' | 'ignore' | function
      handleMissingId: 'fail',
      handleEntryGeneratorMismatch: 'fail',
      origin: 'http://sveltekit-prerender'
    },
    router: {
      type: 'pathname',                      // 'pathname' | 'hash'
      resolution: 'client'                   // 'client' | 'server'
    },
    serviceWorker: {
      register: true,
      files: (filepath) => !/\.DS_Store/.test(filepath)
    },
    typescript: {
      config: (config) => config              // 改生成的 tsconfig.json
    },
    version: {
      name: process.env.COMMIT_HASH ?? Date.now().toString(),
      pollInterval: 0
    }
  }
};

export default config;
```

## `vite.config.ts`

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],

  server: {
    port: 5173,
    proxy: {
      '/api/external': 'http://localhost:8080'
    }
  },

  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom'
  }
});
```

## Svelte 5 Runes 速查

| Rune | 用途 |
|---|---|
| `$state(value)` | 响应式状态（深 Proxy） |
| `$state.raw(value)` | 浅响应式（只在重新赋值时触发） |
| `$state.snapshot(state)` | 拿当前 state 的非响应式快照 |
| `$derived(expr)` | 派生值（必须无副作用） |
| `$derived.by(() => ...)` | 复杂派生（函数体） |
| `$effect(() => ...)` | 副作用（DOM 更新后异步跑） |
| `$effect.pre(() => ...)` | 副作用（DOM 更新前） |
| `$effect.root(() => ...)` | 非追踪的 effect scope |
| `$effect.tracking()` | 当前是否在 tracking context |
| `$props()` | 接收组件 props |
| `$props.id()` | 生成唯一 ID（form for / aria） |
| `$bindable(default?)` | 标记 prop 可被父组件 bind |
| `$inspect(value).with(fn)` | 调试响应式值 |
| `$host()` | 拿宿主元素（custom element） |

```svelte
<script lang="ts">
  // 状态
  let count = $state(0);
  let items = $state<string[]>([]);
  let userBox = $state.raw({ name: '' });   // 浅响应

  // 派生
  let doubled = $derived(count * 2);
  let total = $derived.by(() => items.reduce((a, b) => a + b.length, 0));

  // 副作用
  $effect(() => {
    console.log('count changed:', count);
    return () => console.log('cleanup');
  });

  // Props
  interface Props { name: string; age?: number; onclick?: () => void; }
  let { name, age = 18, onclick, ...rest }: Props = $props();

  // bindable
  let { value = $bindable('') } = $props();

  // ID
  const id = $props.id();
</script>

<input {id} bind:value />
<label for={id}>...</label>
```

### Snippet 类型

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    footer?: Snippet;
    item: Snippet<[number, string]>;   // 带参数
  }
  let { children, footer, item }: Props = $props();
</script>

{@render children()}
{@render footer?.()}
{@render item(1, 'foo')}
```

## CLI 命令

### `sv`（官方 CLI）

```bash
npx sv create my-app          # 新建项目
npx sv add tailwindcss        # 加集成（drizzle / lucia / tailwind / paraglide / ...）
npx sv check                  # svelte-check 入口
npx sv migrate svelte-5       # 迁移到 Svelte 5
npx sv migrate sveltekit-2    # 迁移到 SvelteKit 2
```

### Vite 命令

```bash
vite dev                       # 开发，HMR
vite build                     # 生产构建（出 build/ 或 .svelte-kit/output/）
vite preview                   # 本地预览 build 产物
```

### `svelte-kit sync`

```bash
svelte-kit sync                # 生成 .svelte-kit/tsconfig.json + ./$types
```

`prepare` 脚本里自动跑：

```json
{
  "scripts": {
    "prepare": "svelte-kit sync || echo ''"
  }
}
```

## Adapter 速查

| Adapter | 平台 | 关键选项 |
|---|---|---|
| `adapter-auto` | 自动探测（Vercel / Netlify / CF Pages 等） | — |
| `adapter-node` | 自托管 Node.js | `out` / `precompress` / `envPrefix` |
| `adapter-vercel` | Vercel | `runtime` / `regions` / `split` / `memory` / `maxDuration` / `isr` |
| `adapter-cloudflare` | CF Workers / Pages | `config` / `platformProxy` / `fallback` / `routes` |
| `adapter-netlify` | Netlify | `edge` / `split` |
| `adapter-static` | SSG / SPA | `pages` / `assets` / `fallback` / `precompress` / `strict` |

### 安装

```bash
pnpm add -D @sveltejs/adapter-<name>
```

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-<name>';

export default {
  kit: { adapter: adapter({ /* opts */ }) }
};
```

## `entries` 函数

仅 prerender 动态路由用：

```ts
// +page.server.ts 或 +page.ts 或 +server.ts
export const prerender = true;

export const entries: EntryGenerator = async () => {
  return [
    { slug: 'hello' },
    { slug: 'world' }
  ];
};
```

> `entries` 返回的 params 与路由参数名严格对应。多动态段（`/[a]/[b]`）就返回 `{ a, b }`。

## Matcher

```ts
// src/params/integer.ts
import type { ParamMatcher } from '@sveltejs/kit';

export const match: ParamMatcher = (param) => /^\d+$/.test(param);
```

```
src/routes/
└── posts/
    └── [id=integer]/       # /posts/123 ✓  /posts/abc ✗ (404)
        └── +page.svelte
```

## Snapshot

```svelte
<script lang="ts">
  import type { Snapshot } from './$types';

  let value = $state('');

  export const snapshot: Snapshot<string> = {
    capture: () => value,
    restore: (v) => value = v
  };
</script>
```

## Service Worker 类型

```ts
/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;
import { build, files, prerendered, version } from '$service-worker';
```

## Remote Functions（experimental）

启用：

```js
// svelte.config.js
export default {
  kit: { experimental: { remoteFunctions: true } },
  compilerOptions: { experimental: { async: true } }
};
```

文件后缀 `.remote.ts`：

```ts
// src/lib/posts.remote.ts
import { query, command, form, prerender } from '$app/server';
import * as v from 'valibot';
import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';

export const getPosts = query(async () => {
  return await db.post.findMany();
});

export const getPost = query(v.string(), async (slug) => {
  const [p] = await db.post.findMany({ where: { slug } });
  if (!p) error(404);
  return p;
});

export const likePost = command(v.string(), async (id) => {
  await db.post.update({ where: { id }, data: { likes: { increment: 1 } } });
});

export const createPost = form(
  v.object({
    title: v.pipe(v.string(), v.nonEmpty()),
    content: v.pipe(v.string(), v.nonEmpty())
  }),
  async ({ title, content }) => {
    const post = await db.post.create({ data: { title, content } });
    redirect(303, `/blog/${post.slug}`);
  }
);

export const prerenderPostList = prerender(async () => {
  return await db.post.findMany({ select: { slug: true } });
});
```

```svelte
<!-- 任意 .svelte 文件 -->
<script lang="ts">
  import { getPosts, likePost, createPost } from '$lib/posts.remote';

  const posts = getPosts();
</script>

{#await posts}
  Loading...
{:then list}
  <ul>
    {#each list as p}
      <li>
        {p.title}
        <button onclick={() => likePost(p.id)}>Like</button>
      </li>
    {/each}
  </ul>
{/await}

<form {...createPost}>
  <input name="title" />
  <textarea name="content"></textarea>
  <button>Create</button>
</form>
```

> Remote Functions 仍 experimental，API 可能变化。⚠️ 详见官方文档最新状态。

## App 命名空间完整字段

```ts
// src/app.d.ts
declare global {
  namespace App {
    interface Error {
      message: string;
      // 自定义字段
      code?: string;
      errorId?: string;
    }

    interface Locals {
      user: { id: string; name: string } | null;
      session?: { id: string; expiresAt: Date };
    }

    interface PageData {
      // 共享 data，会与每个 page 的 data 合并
      user?: { id: string; name: string };
    }

    interface PageState {
      showModal?: boolean;
      selected?: string;
    }

    interface Platform {
      // adapter 注入；如 Cloudflare bindings
      env?: { DB: D1Database; KV: KVNamespace };
      context?: ExecutionContext;
    }
  }
}

export {};
```

## `transport` —— 自定义 devalue 类型

```ts
// src/hooks.ts
import type { Transport } from '@sveltejs/kit';
import { Decimal } from 'decimal.js';

export const transport: Transport = {
  Decimal: {
    encode: (value) => value instanceof Decimal && value.toString(),
    decode: (str) => new Decimal(str)
  }
};
```

之后 server load 可以直接 return Decimal 实例，客户端拿到的也是 Decimal。

## 备忘速记

- **路由**：文件夹 = URL 段；`[slug]` 动态；`[...rest]` catch-all；`[[opt]]` 可选；`(group)` 不参与；`_folder` 私有
- **后缀**：`+page` 页面、`+layout` 布局、`+server` API、`+error` 错误；`.svelte` 组件、`.ts` 逻辑、`.server.ts` 仅服务端
- **响应**：`load` 返回 plain object；`+server.ts` 返回 `Response`；actions 返回 `fail()` / object / `redirect()`
- **状态**：组件内 `$state` / `$derived` / `$effect`；跨文件改 `.svelte.ts`；全局还可用 store / context
- **导航**：`<a href>` 自动 SPA；`goto()` 编程式；`invalidate()` 失效；`page` / `navigating` 拿状态
- **数据**：universal load 双端 + server load 仅服务端；`parent()` 拿父 / `depends()` 注册依赖
- **表单**：Form Actions + `use:enhance`；命名 action `?/login`；`fail()` 校验失败
- **错误**：`error(status, ...)` 渲染最近 `+error.svelte`；`handleError` 钩子记录日志
- **部署**：选 adapter → `svelte.config.js` 注入 → `pnpm build`
