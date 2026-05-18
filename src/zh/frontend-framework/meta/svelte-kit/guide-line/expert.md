---
layout: doc
outline: [2, 3]
---

# 指南 - 高级

> 深度优化与部署：Adapters / Edge / 图像 / 字体 / 链接预加载 / 国际化 / Auth / 性能

## 速查

- Adapter：`@sveltejs/adapter-node` / `adapter-vercel` / `adapter-cloudflare` / `adapter-netlify` / `adapter-static` / `adapter-auto`
- Edge vs Node：edge 启动快、地理就近、限制多（Web Standards only）；Node 兼容性高
- Image：`@sveltejs/enhanced-img` 自动生成 AVIF/WebP + 多尺寸；CDN 用 `@unpic/svelte`
- Link 预加载：`data-sveltekit-preload-data="hover"`（默认）/ `"tap"` / `"false"`；`preload-code` 控制代码层
- 国际化：`@inlang/paraglide-sveltekit`（官方推荐）
- Auth：推荐 `better-auth` / `lucia`（cookies + locals.user 模式）
- 性能：开 SSR + prerender + link preload + image optimize + parallel load 是基线

## Adapter 全景

SvelteKit 通过 adapter 把同一份代码部署到不同平台。adapter 在 `vite build` 之后运行，把 `.svelte-kit/` 转成平台特定产物。

### `adapter-auto`（默认）

`sv create` 默认装 `@sveltejs/adapter-auto`。**只在已知平台**（Vercel / Netlify / Cloudflare Pages 等）的环境变量被设置时**自动安装并使用对应 adapter**。

适合：你不确定最终部署平台的早期项目。

不适合：

- 想要稳定的 production 环境
- 想要平台特定优化
- 自托管（auto 不知道选啥）

**建议**：一旦确定平台，**换成具体 adapter** 并加入 devDeps。

### `adapter-node` —— 自托管 Node.js

```bash
pnpm add -D @sveltejs/adapter-node
```

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-node';

export default {
  kit: {
    adapter: adapter({
      out: 'build',
      precompress: true,        // 生成 .gz / .br
      envPrefix: ''
    })
  }
};
```

构建 → 运行：

```bash
pnpm build
node build                              # 默认监听 0.0.0.0:3000
PORT=8080 ORIGIN=https://my.site node build
```

#### 环境变量

| 变量 | 默认 | 说明 |
|---|---|---|
| `PORT` | 3000 | 监听端口 |
| `HOST` | 0.0.0.0 | 监听地址 |
| `SOCKET_PATH` | — | Unix socket，覆盖 PORT/HOST |
| `ORIGIN` | — | 应用 URL（生产必须设；否则 form action / CSRF 校验失败） |
| `PROTOCOL_HEADER` | — | 信任的协议头（如 `x-forwarded-proto`） |
| `HOST_HEADER` | — | 信任的 host 头（如 `x-forwarded-host`） |
| `ADDRESS_HEADER` | — | 客户端 IP 头（如 `x-forwarded-for`） |
| `XFF_DEPTH` | 1 | XFF 信任跳数 |
| `BODY_SIZE_LIMIT` | 512K | 最大请求体 |
| `SHUTDOWN_TIMEOUT` | 30 | 优雅停机等待秒数 |

> 生产建议：反向代理（Nginx / Caddy / Traefik）后置；记得 set `ORIGIN` + `PROTOCOL_HEADER=x-forwarded-proto` + `HOST_HEADER=x-forwarded-host`，否则 SvelteKit 拿不到真正 URL 会导致 form CSRF 报错。

#### 嵌入 Express / Connect

```js
// my-server.js
import { handler } from './build/handler.js';
import express from 'express';

const app = express();
app.get('/healthz', (req, res) => res.end('ok'));
app.use(handler);   // SvelteKit 处理其余路由
app.listen(3000);
```

#### Graceful shutdown

`SIGINT` / `SIGTERM` 时：拒绝新连接 → 等 in-flight 完成 → 超时强制关。监听自定义清理：

```js
process.on('sveltekit:shutdown', async (reason) => {
  await closeDB();
});
```

### `adapter-vercel` —— Vercel

```bash
pnpm add -D @sveltejs/adapter-vercel
```

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-vercel';

export default {
  kit: {
    adapter: adapter({
      runtime: 'nodejs20.x',          // 'nodejs20.x' | 'nodejs22.x' | 'edge'
      regions: ['iad1'],              // 默认 ['iad1']
      split: false,                   // 每个路由单独函数
      memory: 1024,                   // 仅 serverless
      maxDuration: 60,
      isr: false                      // 见下文
    })
  }
};
```

#### Per-route 配置

```ts
// src/routes/api/heavy/+server.ts
export const config = {
  runtime: 'edge',
  regions: ['iad1', 'hnd1']
};
```

#### ISR（Incremental Static Regeneration）

```ts
// src/routes/blog/[slug]/+page.server.ts
export const config = {
  isr: {
    expiration: 60,                   // 缓存 60s
    bypassToken: process.env.BYPASS_TOKEN,   // 带 token 跳过 cache
    allowQuery: ['q']                 // 把 ?q= 算 cache key
  }
};
```

### `adapter-cloudflare` —— Cloudflare Workers / Pages

```bash
pnpm add -D @sveltejs/adapter-cloudflare
```

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-cloudflare';

export default {
  kit: {
    adapter: adapter({
      config: 'wrangler.toml',
      platformProxy: {
        configPath: 'wrangler.toml',
        environment: undefined,
        persist: true
      },
      fallback: 'plaintext',          // 404 fallback
      routes: {
        include: ['/*'],
        exclude: ['<all>']            // 让静态资源直接走 CDN
      }
    })
  }
};
```

#### `wrangler.toml` 最少配置

```toml
name = "my-app"
main = ".svelte-kit/cloudflare/_worker.js"
compatibility_date = "2024-09-25"
compatibility_flags = ["nodejs_compat"]

[assets]
directory = ".svelte-kit/cloudflare"
binding = "ASSETS"
```

#### 访问 bindings

```ts
// src/app.d.ts
import type { D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types';

declare global {
  namespace App {
    interface Platform {
      env: {
        DB: D1Database;
        KV: KVNamespace;
        BUCKET: R2Bucket;
      };
    }
  }
}
```

```ts
// 任意 server load / +server.ts
export const load: PageServerLoad = async ({ platform }) => {
  const result = await platform?.env.DB.prepare('SELECT * FROM users').all();
  return { users: result?.results ?? [] };
};
```

#### CF 限制

- **没有 Node fs**：用 `read` from `$app/server` 替代
- **Worker 体积有限**：CF Workers 免费版 1 MiB（gzip 后）/ 付费 10 MiB
- **`/functions` 目录无效**：用 SvelteKit `+server.ts` 代替 Pages Functions

### `adapter-netlify` —— Netlify

```bash
pnpm add -D @sveltejs/adapter-netlify
```

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-netlify';

export default {
  kit: {
    adapter: adapter({
      edge: false,        // true → Netlify Edge Functions（Deno based）
      split: false        // 每路由独立函数（与 edge 互斥）
    })
  }
};
```

`netlify.toml`：

```toml
[build]
  command = "pnpm build"
  publish = "build"
```

`_redirects` / `_headers` 文件放 `static/` 下，Netlify 自动识别。

### `adapter-static` —— SSG / SPA

```bash
pnpm add -D @sveltejs/adapter-static
```

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-static';

export default {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: undefined,      // 设 '200.html' / 'index.html' / '404.html' 进入 SPA 模式
      precompress: false,
      strict: true              // 检查所有页面都被 prerender 或有 fallback
    })
  }
};
```

`src/routes/+layout.ts`：

```ts
export const prerender = true;
```

#### GitHub Pages

```js
// svelte.config.js
const dev = process.argv.includes('dev');

export default {
  kit: {
    adapter: adapter({ fallback: '404.html' }),
    paths: {
      base: dev ? '' : '/repo-name'   // 仓库名（非 user.github.io 仓库）
    }
  }
};
```

GitHub Actions：

```yaml
name: Deploy to GH Pages
on:
  push: { branches: [main] }
jobs:
  build_site:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install
      - run: pnpm build
        env: { BASE_PATH: '/repo-name' }
      - uses: actions/upload-pages-artifact@v3
        with: { path: build/ }
  deploy:
    needs: build_site
    runs-on: ubuntu-latest
    permissions: { pages: write, id-token: write }
    environment: { name: github-pages, url: ${{ steps.deploy.outputs.page_url }} }
    steps:
      - uses: actions/deploy-pages@v4
        id: deploy
```

## Edge vs Node Runtime

| 维度 | Edge | Node |
|---|---|---|
| 启动时间 | <10ms | 100-500ms（cold start） |
| 地理位置 | CDN 边缘节点 | 单点 region |
| API 支持 | Web Standards only（无 Node 内置） | 完整 Node + npm |
| 数据库 | 需 edge-compatible driver（postgres.js + connection pooling） | 任意 |
| 文件系统 | 无 | 完整 fs |
| 适用 | 接近用户的轻量 API、A/B、地理路由 | 复杂业务、ORM 重的逻辑 |

> SvelteKit 写代码用 Web Standards（`Request` / `Response` / `Headers` / `FormData` / `URL` / `crypto`），切换 runtime 通常零成本。但 ORM、原生 Node 模块在 edge 上不可用。

## Image 优化

### `@sveltejs/enhanced-img`

```bash
pnpm add -D @sveltejs/enhanced-img
```

```ts
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    enhancedImages(),     // ⚠️ 必须在 sveltekit() 前面
    sveltekit()
  ]
});
```

```svelte
<!-- 基础用法 -->
<enhanced:img src="./hero.jpg" alt="Hero" />

<!-- 响应式 srcset（多尺寸） -->
<enhanced:img
  src="./hero.jpg?w=1920;1280;640"
  sizes="(min-width: 1080px) 1280px, (min-width: 768px) 640px, 100vw"
  alt="Hero"
/>

<!-- 处理参数：modular query syntax -->
<enhanced:img src="./avatar.jpg?w=200&blur=4" alt="Avatar" />

<!-- 关键图片：跳懒加载 + 高优先级 -->
<enhanced:img
  src="./logo.svg"
  alt="Logo"
  loading="eager"
  fetchpriority="high"
/>

<!-- 动态 import -->
<script>
  import banner from '$lib/assets/banner.jpg?enhanced';
</script>
<enhanced:img src={banner} alt="Banner" />
```

构建期：

- 生成 AVIF / WebP / 原格式 fallback
- 自动算 `width` / `height`（避免 layout shift）
- 移除 EXIF（隐私 + 体积）
- 不同尺寸 srcset

### 远程 / CDN 图片

`enhanced:img` 只处理本地静态 import。CDN 图片用 `@unpic/svelte`：

```svelte
<script>
  import { Image } from '@unpic/svelte';
</script>

<Image
  src="https://cdn.example.com/hero.jpg"
  width={1280}
  height={640}
  alt="Hero"
  layout="constrained"
/>
```

或 Vercel 平台直接用 `/_vercel/image` 端点（adapter-vercel 自动配）。

## Link 预加载

SvelteKit `<a>` 默认走客户端导航。`data-sveltekit-*` 属性精细控制预加载策略。

### `data-sveltekit-preload-data`

| 值 | 触发时机 |
|---|---|
| `"hover"`（推荐） | 鼠标 hover / touchstart |
| `"tap"` | 点击 / touchstart（最保守，省流量） |
| `"off"` 或 `"false"` | 不预加载 |

通常在 `app.html` 全局开启 `hover`：

```html
<body data-sveltekit-preload-data="hover">
```

特定链接覆盖：

```svelte
<a href="/heavy" data-sveltekit-preload-data="tap">Heavy Page</a>
<a href="/private" data-sveltekit-preload-data="false">Private</a>
```

### `data-sveltekit-preload-code`

更激进的代码预加载（不调 load，只下载 JS / CSS）：

| 值 | 触发时机 |
|---|---|
| `"eager"` | 页面 load 完立刻预加载所有链接 |
| `"viewport"` | 链接进入视口时 |
| `"hover"` | hover 时 |
| `"tap"` | 点击时 |

### `data-sveltekit-reload`

强制全页刷新（不走客户端路由）：

```svelte
<a href="/external-app" data-sveltekit-reload>External App</a>
```

### `data-sveltekit-replacestate` / `data-sveltekit-keepfocus` / `data-sveltekit-noscroll`

- `replacestate` —— `history.replaceState` 而不是 `push`
- `keepfocus` —— 不重置焦点
- `noscroll` —— 不滚到顶

```svelte
<a href="/results?page=2" data-sveltekit-noscroll>Next page</a>
```

## 国际化（i18n）

SvelteKit 官方推荐 [`@inlang/paraglide-sveltekit`](https://inlang.com/m/dxnzrydw/paraglide-sveltekit-i18n)（**编译时 i18n**，零运行时）。

### 安装

```bash
npx sv add paraglide
```

`sv add` 会：

- 装 `@inlang/paraglide-sveltekit`
- 加 Vite 插件
- 创建 `project.inlang/` 配置目录
- 加 `src/hooks.server.ts` 的 `i18n.handle()` 中间件
- 加 `src/routes/+layout.svelte` 的 `<ParaglideJS>` wrapper

### 写消息

`messages/en.json` / `messages/zh.json`：

```json
{
  "hello_world": "Hello, world!",
  "welcome": "Welcome, {name}!"
}
```

在组件用：

```svelte
<script>
  import * as m from '$lib/paraglide/messages';
</script>

<h1>{m.hello_world()}</h1>
<p>{m.welcome({ name: 'Alice' })}</p>
```

构建时**只打包当前语言的消息**，按路由自动切换。

### URL 策略

默认走前缀：`/about` → `/de/about` / `/fr/about`。可改 cookie / domain。

### 备选方案

- `svelte-i18n` —— 老牌，运行时 i18n
- `typesafe-i18n` —— TS 类型严格
- 手写 + `$app/state` `page.params.lang` —— 简单项目够用

## Auth 模式

SvelteKit 官方不内置 auth；推荐第三方：

- **better-auth** —— 多 provider，类型友好
- **lucia** —— session-based，可控性高（v3 后)
- **Auth.js** (`@auth/sveltekit`) —— 兼容 NextAuth 思路

通用 pattern（cookies + locals）：

```ts
// src/app.d.ts
declare namespace App {
  interface Locals {
    user: { id: string; email: string; role: 'admin' | 'user' } | null;
  }
}
```

```ts
// src/hooks.server.ts
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';

const authenticate: Handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get('sessionid');
  event.locals.user = sessionId ? await loadUser(sessionId) : null;
  return resolve(event);
};

const protectRoutes: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith('/admin') && event.locals.user?.role !== 'admin') {
    return new Response(null, { status: 303, headers: { location: '/login' } });
  }
  return resolve(event);
};

export const handle = sequence(authenticate, protectRoutes);
```

```ts
// src/routes/login/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';

export const actions = {
  default: async ({ cookies, request }) => {
    const data = await request.formData();
    const email = data.get('email') as string;
    const password = data.get('password') as string;

    const user = await verifyCredentials(email, password);
    if (!user) return fail(401, { email, error: 'Invalid credentials' });

    const sessionId = await createSession(user.id);
    cookies.set('sessionid', sessionId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7
    });

    redirect(303, '/dashboard');
  }
};
```

### Session vs Token

| | Session | Token (JWT) |
|---|---|---|
| 存储 | DB（每次校验查询） | 客户端 cookie / localStorage |
| 撤销 | 立即（删 DB 记录） | 难（需要 blacklist） |
| 状态 | 有 | 无 |
| 适用 | 大多数 Web App | 跨服务、Mobile API |

> 一般 Web App 用 session 即可（更安全）。Mobile / 跨域 API 用 token。

## 性能优化清单

### SvelteKit 默认就做的

- 代码分割（按路由 + 按动态 import）
- 资源 hash 缓存
- 链接 prefetch（`preload-data="hover"`）
- 并行 load（同级 page + layout load 并发）
- SSR 数据 inline 到 HTML（hydrate 不重复请求）
- HTTP/2 push hints（部分 adapter）

### 手动可做的

#### 1. 开启 Service Worker（offline + cache）

放 `src/service-worker.ts`，见[指南 - 进阶](./advanced.md#service-worker)。

#### 2. 选择合适的渲染模式

- 静态内容 → `prerender = true`
- 需要 SEO + 动态 → SSR（默认）
- 重客户端 → `ssr = false`
- 纯文本 → `csr = false`

#### 3. 用 `enhanced:img` + AVIF/WebP

```svelte
<enhanced:img src="./hero.jpg?w=1920;1280;640" sizes="..." alt="..." />
```

#### 4. 流式加载非关键数据

```ts
return {
  critical: await loadCritical(),
  belowFold: loadBelowFold()       // 不 await
};
```

#### 5. 用 link preload 控制粒度

```html
<!-- app.html -->
<body data-sveltekit-preload-data="hover">
```

```svelte
<!-- 关键路由：viewport preload code -->
<a href="/dashboard" data-sveltekit-preload-code="viewport">Dashboard</a>
```

#### 6. 监控 web vitals

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';

  onMount(async () => {
    if (import.meta.env.PROD) {
      const { onCLS, onFCP, onLCP, onINP, onTTFB } = await import('web-vitals');
      const report = (metric: any) => {
        navigator.sendBeacon('/api/vitals', JSON.stringify(metric));
      };
      onCLS(report);
      onFCP(report);
      onLCP(report);
      onINP(report);
      onTTFB(report);
    }
  });
</script>
```

#### 7. Bundle 分析

```bash
pnpm add -D rollup-plugin-visualizer
```

```ts
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    sveltekit(),
    visualizer({ open: true, filename: 'bundle-stats.html' })
  ]
});
```

#### 8. 用 third-party scripts 隔离

第三方分析 / 广告挪到 Web Worker（Partytown）：

```bash
pnpm add @builder.io/partytown
```

#### 9. 优先 Server load > Universal load

数据库读取在 server 跑，避免暴露 endpoint + 减少 round trip。

## 可访问性（a11y）

### 路由播报

SvelteKit 自动在导航后用 live region 朗读新页面 `<title>`。所以**每页都要有独特的 `<title>`**：

```svelte
<svelte:head>
  <title>用户列表 - My App</title>
</svelte:head>
```

### 焦点管理

默认导航后焦点回到 `<body>`，模拟传统页面跳转行为。带 `autofocus` 的元素会自动获得焦点。

要自定义焦点位置：

```ts
import { afterNavigate } from '$app/navigation';

afterNavigate(() => {
  document.querySelector<HTMLElement>('main h1')?.focus();
});
```

### `lang` 属性

`app.html` 默认 `<html lang="en">`，多语言项目要动态：

```ts
// src/hooks.server.ts
export const handle: Handle = async ({ event, resolve }) => {
  const lang = event.cookies.get('lang') ?? 'en';
  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace('%lang%', lang)
  });
};
```

```html
<!-- app.html -->
<html lang="%lang%">
```

## CSP（Content Security Policy）

```js
// svelte.config.js
export default {
  kit: {
    csp: {
      mode: 'auto',              // 'hash' | 'nonce' | 'auto'
      directives: {
        'script-src': ['self'],
        'style-src': ['self', 'unsafe-inline']
      }
    }
  }
};
```

SvelteKit 自动给 inline `<style>` / `<script>` 加 hash / nonce。

### Prerendered 页面

无法发 header，用 `<meta http-equiv="content-security-policy">` 标签替代。SvelteKit 自动处理。

## CSRF 防护

默认开启。检查 POST / PUT / PATCH / DELETE 的 `origin` 头是否匹配当前域。

```js
// svelte.config.js
export default {
  kit: {
    csrf: {
      checkOrigin: true,                  // 默认 true（已 deprecated 的选项形式）
      trustedOrigins: ['https://payments.example.com']
    }
  }
};
```

> 仅生产生效，dev 跳过。如果第三方 webhook 报 403，加入 `trustedOrigins` 或在该 `+server.ts` 里手动允许。

## 部署常见问题

### 1. `ORIGIN` 没设导致 form 报 403

adapter-node 必须设 `ORIGIN=https://your.domain`，否则 SvelteKit 拿不到真正 URL，CSRF 校验视所有 POST 为跨域。

### 2. Cookies 在生产丢失

- 检查 `secure: true` 是否匹配 HTTPS
- `sameSite: 'lax'` 是否符合场景（跨站 POST 用 `'none' + secure: true`）
- `path: '/'` 是否设置（SvelteKit 2 强制）

### 3. Cloudflare Workers 体积超限

- 用 `dynamic import()` 拆代码
- 移除大依赖（lodash → 自己写、moment → date-fns）
- `compatibility_flags = ["nodejs_compat"]` 启用 polyfill

### 4. Vercel cold start 慢

- 选 `runtime: 'edge'` 大幅降低 cold start
- 选小内存（128MB）也能减少 init 时间
- 静态部分用 `prerender = true`

### 5. adapter-static + 动态路由 → 404

动态路由必须 `entries()`：

```ts
export const entries: EntryGenerator = async () => {
  const slugs = await fetchAllSlugs();
  return slugs.map(s => ({ slug: s }));
};
```

### 6. SvelteKit 1 项目迁 2 后 cookies 报错

`cookies.set()` / `cookies.delete()` 必须传 `path`。批量改：用 codemod 或全文搜索 `cookies.set(` 一个个补。
