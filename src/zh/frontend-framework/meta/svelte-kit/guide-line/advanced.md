---
layout: doc
outline: [2, 3]
---

# 指南 - 进阶

> 渲染与适配：CSR / SSR / SSG / Streaming / Server-Only Modules / Service Worker

## 速查

- 三种渲染：**SSR**（默认）+ **CSR**（默认）+ **SSG**（按需 `prerender`）
- 页面选项（在 `+page.ts` / `+page.server.ts` / `+layout.*` 导出）：`prerender` / `ssr` / `csr` / `trailingSlash` / `config`
- `prerender = true` → 构建期生成 HTML；`false` → 每请求渲染；`'auto'` → 能 prerender 就 prerender
- 动态路由的 `entries()` 函数告诉 prerenderer 要生成哪些参数组合
- Streaming：server load 返回**未 await 的 Promise**，配合 `{#await}` 流式渲染
- Server-Only Modules：`$lib/server/` 或 `.server.ts` 后缀；构建期防止泄露到客户端
- Service Worker：在 `src/service-worker.ts` 自动注册；用 `$service-worker` 模块拿 build / files / version
- Snapshots：组件级临时状态（表单未提交内容、滚动位置）—— 离开页面后回来仍在

## 三种渲染模式

SvelteKit 默认 **SSR + CSR**：服务端渲 HTML 首屏 + 客户端 hydrate 接管交互。可在每个路由独立选：

| 模式 | `prerender` | `ssr` | `csr` | 适用场景 |
|---|---|---|---|---|
| SSR + CSR（默认） | `false` | `true` | `true` | 动态内容、需要 SEO、需要交互 |
| SSG | `true` | `true` | `true` | 文档 / Blog / 营销页 |
| SSG 无 JS | `true` | `true` | `false` | 纯文本静态页（不需要任何交互） |
| SPA | `false` | `false` | `true` | 完全客户端应用（避免 SSR 复杂度） |
| 仅服务端 | `false` | `true` | `false` | 罕见，渲完就丢，无 JS 升级 |

### `prerender` —— 静态生成

```ts
// src/routes/blog/[slug]/+page.ts
export const prerender = true;
```

构建期把页面 HTML 写到 `build/` 目录。**所有用户拿到同一份内容**，CDN 友好，无服务器成本。

值：

- `true` —— 强制 prerender
- `false`（默认） —— 不 prerender，每请求渲染
- `'auto'` —— 能 prerender 就 prerender，依赖请求数据时 fallback 到 dynamic

```ts
// src/routes/+layout.ts
export const prerender = true;        // 整个 app SSG
```

**限制**：

- 页面有 form action → **不能** prerender（POST 必须服务端处理）
- 动态路由必须有 `entries()` 告诉哪些参数

### `entries()` —— 动态路由的参数列表

```ts
// src/routes/blog/[slug]/+page.server.ts
import { db } from '$lib/server/db';
import type { EntryGenerator } from './$types';

export const prerender = true;

export const entries: EntryGenerator = async () => {
  const posts = await db.post.findMany({ select: { slug: true } });
  return posts.map(p => ({ slug: p.slug }));
};
```

构建时 SvelteKit 会调 `entries()`，按返回的参数组合生成每个 `/blog/<slug>` 的 HTML。可以从数据库 / CMS / 文件系统拿。

### `ssr` —— 关闭服务端渲染

```ts
// src/routes/dashboard/+layout.ts
export const ssr = false;
```

效果：服务端只返回空壳 HTML，浏览器加载完 JS 才渲染。适合：

- 用了 `document` / `window` / `localStorage` 等浏览器 only API
- 重客户端应用（admin / 仪表盘）

> 关 SSR 牺牲首屏速度和 SEO，慎用。

### `csr` —— 关闭客户端 hydrate

```ts
// src/routes/legal/+page.ts
export const csr = false;
```

效果：**不发任何 JS**。页面是纯 HTML + CSS。链接走全页刷新，form 走传统提交，`<script>` 不执行，`use:enhance` / HMR 都失效。

适合：政策页、纯文本页、追求极致 LCP 的场景。

### 单页应用（SPA）模式

```ts
// src/routes/+layout.ts
export const ssr = false;
```

加 `adapter-static` + fallback：

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-static';

export default {
  kit: {
    adapter: adapter({
      fallback: '200.html'   // Vercel/Netlify 用 'index.html'，Surge 用 '200.html'
    })
  }
};
```

效果：构建产物是纯静态文件 + 一个 fallback HTML 拦截所有路由。**没有服务器**，CDN 即可托管。

> SPA 模式仍然可以**选择性 prerender 部分页面**（混合）：在某个具体页面写 `export const prerender = true;` + `export const ssr = true;`，那个页面会生成完整 HTML，其余靠 fallback + client routing。

### `trailingSlash` —— 末尾斜杠

```ts
// src/routes/+layout.ts
export const trailingSlash = 'always';   // 'never' | 'always' | 'ignore'
```

- `'never'`（默认）—— `/about/` 重定向到 `/about`
- `'always'` —— `/about` 重定向到 `/about/`（影响 prerender 输出文件名）
- `'ignore'` —— 两种都接受（不推荐，SEO 角度等于双 URL）

### `config` —— adapter 配置

per-route 覆盖 adapter 选项：

```ts
// src/routes/api/heavy/+server.ts
export const config = {
  runtime: 'nodejs22.x',          // adapter-vercel
  memory: 3008,
  maxDuration: 60
};
```

详见对应 adapter 文档。

## Streaming Promises in load

仅 **server load** 能 stream（universal load 必须 await）。

### 基本用法

```ts
// src/routes/dashboard/+page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  return {
    // ↓ 同步 await，关键 above-the-fold 数据
    user: await loadUser(locals.userId),

    // ↓ 不 await，作为 Promise stream 给客户端
    notifications: loadNotifications(locals.userId),
    recentOrders: loadOrders(locals.userId),
    suggestions: loadSuggestions(locals.userId)
  };
};
```

```svelte
<!-- src/routes/dashboard/+page.svelte -->
<script lang="ts">
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
</script>

<h1>Hi {data.user.name}</h1>

<section>
  <h2>未读消息</h2>
  {#await data.notifications}
    <div class="skeleton">加载中...</div>
  {:then notifications}
    <ul>{#each notifications as n}<li>{n.title}</li>{/each}</ul>
  {:catch e}
    <p class="error">加载失败：{e.message}</p>
  {/await}
</section>

<section>
  <h2>最近订单</h2>
  {#await data.recentOrders}<p>...</p>{:then orders}<ul>{#each orders as o}<li>{o.id}</li>{/each}</ul>{/await}
</section>
```

### 工作原理

1. SSR 立刻把已 await 的 `user` 渲到 HTML，未 await 的 `notifications` 留 placeholder
2. 同时把 `notifications` 的 Promise resolve 之后的数据**流式追加**到 HTML 末尾
3. 客户端的 `{#await}` 自动接收并切换到 `:then` 分支

效果：用户先看到框架 + 关键内容，慢数据陆续填进来；首屏 TTFB 不被最慢的请求拖累。

### 注意

- **错误必须捕获**：未 await 的 Promise 如果 reject 没有 `{:catch}` 会变成 unhandled rejection
- **HTTP/2 / HTTP/3 才有真正流式**：HTTP/1.1 会一直保持连接到所有 promise 完成
- **不能 stream 头部**：响应头在第一个 chunk 之前必须确定
- 想关闭 stream：所有数据都 `await`

## Server-Only Modules

防止后端代码（数据库、密钥）泄露到客户端 bundle 的核心机制。

### 三种隔离

1. **`$lib/server/`** —— 该目录下任意文件都是 server-only
2. **`*.server.ts` 后缀** —— 任意位置的 `foo.server.ts` 是 server-only
3. **内置 server-only 模块** —— `$env/static/private` / `$env/dynamic/private` / `$app/server` / `+page.server.ts` / `+layout.server.ts` / `+server.ts` / `hooks.server.ts`

```ts
// src/lib/server/db.ts —— 仅服务端
import { PrismaClient } from '@prisma/client';
import { DATABASE_URL } from '$env/static/private';

export const db = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });
```

```ts
// src/lib/secrets.server.ts —— 仅服务端（通过文件名后缀）
export const SIGNING_KEY = process.env.SIGNING_KEY!;
```

### 依赖链分析

SvelteKit 在 build 时分析 import 链：**任何客户端可达的模块**（`+page.svelte` / `+page.ts` / `+layout.svelte` / `+layout.ts` / `hooks.client.ts` / `service-worker.ts`）如果**直接或间接** import 了 server-only 模块，构建报错。

```ts
// ❌ src/lib/helpers.ts
import { db } from '$lib/server/db';   // helpers.ts 是客户端可见，会报错
```

```ts
// ✅ src/lib/server/helpers.ts —— 改名加 server-only 路径
import { db } from './db';
```

```ts
// 客户端要拿数据库内容 → 走 +page.server.ts 或 +server.ts
// src/routes/posts/+page.server.ts
import { db } from '$lib/server/db';

export const load = async () => {
  return { posts: await db.post.findMany() };
};
```

### `$app/server`

服务端独享 utilities：

```ts
// src/routes/file/+server.ts
import { read } from '$app/server';
import type { RequestHandler } from './$types';

import asset from '$lib/data.txt';

export const GET: RequestHandler = async () => {
  const file = read(asset);     // 直接读 import 的静态资源，不走 fs
  return new Response(file);
};
```

> `$app/server` 提供的 `read()` 让 adapter-cloudflare 也能在 Workers 里读静态资源（CF Workers 没有 Node `fs`）。

### 动态 import 也被追踪

```ts
// ❌ 不安全
const mod = await import(userInput);

// SvelteKit 会**静态分析**，如果路径里能拼出 $lib/server/* 也会报错
```

### 测试模式跳过

`process.env.TEST === 'true'` 时跳过 server-only 隔离（Vitest 默认这么做）。

## 环境变量四件套

SvelteKit 提供 4 个 `$env/*` 模块，按「时机 × 权限」组合：

| 模块 | 注入时机 | 哪边可用 | 用途 |
|---|---|---|---|
| `$env/static/private` | 构建期 | 仅服务端 | 私密 env，build 期 inline，可 tree-shake |
| `$env/static/public` | 构建期 | 服务端 + 客户端 | 公开 env，inline 进 bundle |
| `$env/dynamic/private` | 运行时 | 仅服务端 | 容器 / Docker 跑时读 `process.env` |
| `$env/dynamic/public` | 运行时 | 服务端 + 客户端 | 客户端拿运行时 env（多走一次 fetch） |

**关键约束**：

- 公共 env 名必须以 `PUBLIC_` 前缀开头（可改 `kit.env.publicPrefix`）
- 私密 env 名**不能**以 `PUBLIC_` 开头
- 错误前缀会在 build / 访问时报错

### 示例

`.env` / `.env.local`：

```bash
DATABASE_URL=postgres://...
STRIPE_SECRET=sk_test_xxx
PUBLIC_API_URL=https://api.example.com
PUBLIC_GA_ID=G-XXX
```

```ts
// 仅服务端，build inline
import { DATABASE_URL, STRIPE_SECRET } from '$env/static/private';

// 任意端，build inline
import { PUBLIC_API_URL } from '$env/static/public';

// 仅服务端，运行时读 process.env
import { env } from '$env/dynamic/private';
console.log(env.DATABASE_URL);

// 任意端，运行时读
import { env } from '$env/dynamic/public';
console.log(env.PUBLIC_API_URL);
```

### Static vs Dynamic 选择

- **想要 dead-code elimination / 最小 bundle** → `static`
- **同一份镜像跑多环境（dev / staging / prod）** → `dynamic`
- **Vercel / Netlify 等无状态部署** → 一般 `static` 就够
- **Docker / Kubernetes** → 常用 `dynamic` 让运行时注入

> `dynamic/public` 在 prerendered 页面**不可用**（构建时没有运行时值）。SvelteKit 用 `/_app/env.js` 请求拿。

## Service Worker

`src/service-worker.ts` 自动注册（dev 模式不打包）：

```ts
// src/service-worker.ts
/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `cache-${version}`;
const ASSETS = [...build, ...files];

sw.addEventListener('install', (event) => {
  async function addFilesToCache() {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
  }
  event.waitUntil(addFilesToCache());
});

sw.addEventListener('activate', (event) => {
  // 删除旧 cache
  async function deleteOldCaches() {
    for (const key of await caches.keys()) {
      if (key !== CACHE) await caches.delete(key);
    }
  }
  event.waitUntil(deleteOldCaches());
});

sw.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  async function respond() {
    const url = new URL(event.request.url);
    const cache = await caches.open(CACHE);

    // 已缓存的静态资源 → cache first
    if (ASSETS.includes(url.pathname)) {
      const cached = await cache.match(url.pathname);
      if (cached) return cached;
    }

    // 其他请求 → network first，失败回 cache
    try {
      const response = await fetch(event.request);
      if (response.status === 200) cache.put(event.request, response.clone());
      return response;
    } catch {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      throw new Error('No network and no cache');
    }
  }

  event.respondWith(respond());
});
```

### `$service-worker` 模块

| 导出 | 类型 | 说明 |
|---|---|---|
| `build` | `string[]` | Vite 构建出的所有 chunk 路径 |
| `files` | `string[]` | `static/` 下的所有文件 |
| `prerendered` | `string[]` | 已 prerender 的页面路径 |
| `version` | `string` | 应用版本（用作 cache key 命名） |
| `base` | `string` | `paths.base` 配置值 |

dev 模式 `build` / `prerendered` 为空，避免 SW 缓存到旧版本。

### 关闭自动注册

```js
// svelte.config.js
export default {
  kit: {
    serviceWorker: {
      register: false       // 关闭，自己调 navigator.serviceWorker.register
    }
  }
};
```

## Snapshots

`+page.svelte` / `+layout.svelte` 导出 `snapshot` 对象，离开页面前 `capture` 状态，回来时 `restore`：

```svelte
<!-- src/routes/contact/+page.svelte -->
<script lang="ts">
  import type { Snapshot } from './$types';

  let comment = $state('');

  export const snapshot: Snapshot<string> = {
    capture: () => comment,
    restore: (value) => comment = value
  };
</script>

<textarea bind:value={comment}></textarea>
```

效果：用户填了一半，点链接看其他页 → 回来 textarea 还在。

要点：

- 数据**必须可 JSON 序列化**（存 `sessionStorage`）
- 状态绑当前历史记录，不跨 session
- 仅 forward / back / replace 时触发；外部 URL 进入是新 entry
- 避免存大对象，会吃 storage 配额

## 数据持久化思路

SvelteKit 不内置 ORM / 数据层，按需选：

| 类型 | 工具 | 备注 |
|---|---|---|
| 关系型 ORM | Drizzle / Prisma / Kysely | `$lib/server/db.ts` 单例 |
| Edge KV | Cloudflare KV / Vercel KV / Upstash Redis | 用 `platform.env` 拿 binding |
| 文件 / Markdown | mdsvex + `$lib/server` 读 fs | 适合 blog |
| Headless CMS | Contentful / Sanity / Strapi | universal load `fetch` 即可 |
| 直连 PostgreSQL | postgres.js / pg | server load 里直连 |

> 重点：**数据库连接**写在 `$lib/server/db.ts` 单例化，由 server load 调用；客户端**永远不直接连数据库**。

### Drizzle 示例

```ts
// src/lib/server/db.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { DATABASE_URL } from '$env/static/private';
import * as schema from './schema';

const client = postgres(DATABASE_URL);
export const db = drizzle(client, { schema });
```

```ts
// src/routes/users/+page.server.ts
import { db } from '$lib/server/db';
import { users } from '$lib/server/schema';

export const load = async () => {
  const list = await db.select().from(users);
  return { users: list };
};
```

### 单例 vs 连接池

Node adapter 默认会复用 module 级单例；serverless（Vercel / Cloudflare）每次 cold start 新建连接，记得用连接池或 `postgres.js` 的 `max: 1` + edge-compatible driver。

## SEO & 元数据

### `<svelte:head>`

```svelte
<!-- src/routes/blog/[slug]/+page.svelte -->
<script lang="ts">
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>{data.post.title} | My Blog</title>
  <meta name="description" content={data.post.excerpt} />
  <meta property="og:title" content={data.post.title} />
  <meta property="og:image" content={data.post.coverUrl} />
</svelte:head>
```

`<svelte:head>` 内容会注入到 `app.html` 的 `%sveltekit.head%` 占位。

### Sitemap

```ts
// src/routes/sitemap.xml/+server.ts
import { db } from '$lib/server/db';

export const prerender = true;

export const GET = async () => {
  const posts = await db.post.findMany({ select: { slug: true, updatedAt: true } });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${posts.map(p => `
    <url>
      <loc>https://example.com/blog/${p.slug}</loc>
      <lastmod>${p.updatedAt.toISOString()}</lastmod>
    </url>
  `).join('')}
</urlset>`;

  return new Response(xml, {
    headers: { 'content-type': 'application/xml' }
  });
};
```

### URL 规范化

SvelteKit 自动处理 trailing slash（`trailingSlash` 选项），减少重复 URL 收录。`canonical` link 自己加：

```svelte
<svelte:head>
  <link rel="canonical" href="https://example.com{page.url.pathname}" />
</svelte:head>
```

## 优化 `load` 的几个常见 pattern

### 1. 公共数据放 layout load，避免重复请求

```ts
// src/routes/+layout.server.ts
export const load: LayoutServerLoad = async ({ locals }) => {
  return { user: locals.user };   // 所有页面都拿得到，且只查一次
};
```

### 2. 用 `parent()` 复用而不是重新拉

```ts
// src/routes/dashboard/[id]/+page.server.ts
export const load: PageServerLoad = async ({ params, parent }) => {
  const { user } = await parent();
  if (user.id !== params.id) error(403);
  // ...
};
```

### 3. `depends` + `invalidate` 实现「按需刷新」

```ts
// list page
export const load = async ({ depends }) => {
  depends('app:posts');
  return { posts: await loadPosts() };
};
```

```ts
// 提交后
import { invalidate } from '$app/navigation';
await invalidate('app:posts');
```

### 4. 避免 server load 里调自己的 +server.ts

server load 跑在服务端，调本地 `+server.ts` 走 HTTP 是浪费 —— 直接 import 业务函数：

```ts
// ❌ server load 里 fetch 内部 API
export const load = async ({ fetch }) => {
  const res = await fetch('/api/posts');
  return { posts: await res.json() };
};

// ✅ 直接调
import { getPosts } from '$lib/server/posts';
export const load = async () => {
  return { posts: await getPosts() };
};
```

> Universal load 调内部 `+server.ts` 也不会真的走 HTTP（SvelteKit 优化为直接调 handler），但可读性差。能直接 import 就直接 import。

## 测试

SvelteKit 推荐：

- **单元测试**：Vitest（`sv create` 可选集成）
- **组件测试**：Vitest + `@testing-library/svelte`
- **E2E 测试**：Playwright（默认 `tests/` 目录）

```ts
// vitest.config.ts（sv create 生成）
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}']
  }
});
```

### 测试 server load

```ts
// src/routes/blog/+page.server.test.ts
import { describe, it, expect } from 'vitest';
import { load } from './+page.server';

describe('blog +page.server', () => {
  it('returns posts list', async () => {
    const result = await load({
      locals: { user: null },
      url: new URL('http://localhost/blog'),
      // ... mock 其他 event 字段
    } as any);
    expect(result.posts).toBeInstanceOf(Array);
  });
});
```

### 测试组件

```ts
import { render, screen } from '@testing-library/svelte';
import Counter from '$lib/Counter.svelte';

it('increments on click', async () => {
  render(Counter);
  const btn = screen.getByRole('button');
  await btn.click();
  expect(btn).toHaveTextContent('1');
});
```

### Playwright E2E

```ts
// tests/home.spec.ts
import { test, expect } from '@playwright/test';

test('home page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
```

`sv create` 配的 Playwright 默认会先 `vite preview` 起服务再跑测试。
