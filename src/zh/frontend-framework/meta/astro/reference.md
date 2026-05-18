---
layout: doc
outline: [2, 3]
---

# 参考

> Astro 5.x（最新 5.13+）全部文件约定 / API / 指令 / 配置速查

## 文件约定

### `src/pages/`

| 文件 | 路径示例 | URL | 说明 |
|---|---|---|---|
| `index.astro` | `src/pages/index.astro` | `/` | 首页 |
| `[name].astro` | `src/pages/blog/[slug].astro` | `/blog/:slug` | 动态段 |
| `[...rest].astro` | `src/pages/shop/[...path].astro` | `/shop/*` | catch-all |
| `[name].ts` | `src/pages/api/posts.ts` | `/api/posts` | 端点 |
| `name.json.ts` | `src/pages/data.json.ts` | `/data.json` | 静态端点 |
| `index.md` | `src/pages/about.md` | `/about` | Markdown 页 |
| `index.mdx` | `src/pages/article.mdx` | `/article` | MDX 页 |
| `404.astro` | `src/pages/404.astro` | 兜底 404 | 自定义 404 |

### `src/` 其他特殊文件

| 文件 | 作用 |
|---|---|
| `src/middleware.ts` | 全局中间件 |
| `src/content.config.ts` | Content Collections 配置（Astro 5+） |
| `src/live.config.ts` | Live Collections 配置（5.10+） |
| `src/actions/index.ts` | Actions 入口 |
| `src/env.d.ts` | TS 全局类型补丁 |

### 根目录

| 文件 | 必需 | 作用 |
|---|---|---|
| `astro.config.mjs` | ✅ | 主配置 |
| `package.json` | ✅ | `"type": "module"` 必需 |
| `tsconfig.json` | 推荐 | 继承 `astro/tsconfigs/strict` |
| `public/` | 可选 | 静态资源原样拷贝 |
| `db/config.ts` | 可选 | Astro DB 配置 |
| `db/seed.ts` | 可选 | Astro DB seed |

## `.astro` 文件语法

### 完整模板

```astro
---
// === Frontmatter（服务端 TS）===
import Layout from '../layouts/Base.astro';
import { getCollection } from 'astro:content';

interface Props {
  title: string;
  description?: string;
}

const { title, description = '' } = Astro.props;
const posts = await getCollection('blog');
---

<!-- === Template（HTML + 表达式）=== -->
<Layout title={title}>
  <h1>{title}</h1>
  {description && <p>{description}</p>}
  <ul>
    {posts.map((post) => (
      <li><a href={`/blog/${post.id}`}>{post.data.title}</a></li>
    ))}
  </ul>
</Layout>

<!-- === Style（默认 scoped）=== -->
<style>
  h1 { color: rebeccapurple; }
</style>

<style lang="scss" is:global>
  body { margin: 0; }
</style>

<!-- === Script（浏览器执行）=== -->
<script>
  console.log('Hello from browser');
</script>
```

### 表达式

| 写法 | 说明 |
|---|---|
| `{ variable }` | 插入变量 |
| `{ items.map(...) }` | 数组渲染 |
| `{ show && <p>...</p> }` | 条件 |
| `{ a ? <X /> : <Y /> }` | 三元 |
| `{ fn() }` | 调用函数 |
| `<a href={url}>...</a>` | 属性绑定 |
| `<a class={cls}>...</a>` | class 绑定 |
| `<a class:list={[...]}>` | 动态 class（数组 / 对象） |
| `<X {prop1} {prop2} />` | 简写（与变量名同名） |
| `<X {...spreadObj} />` | spread 属性 |

### 动态标签名

```astro
---
const Element = 'h1';   // 也可以是组件
---

<Element>动态标签</Element>
```

### Comment

```astro
{/* JSX 注释（不出现在 HTML） */}

<!-- HTML 注释（出现在最终 HTML） -->
```

## 模板指令全表

### Common（通用）

| 指令 | 例 | 说明 |
|---|---|---|
| `class:list` | `<a class:list={['btn', { active }]}>` | 动态 class（clsx 风格） |
| `set:html` | `<div set:html={rawHtml} />` | 插入原始 HTML（注意 XSS） |
| `set:text` | `<div set:text={str} />` | 插入文本（自动转义） |

### Client（hydration）

| 指令 | 说明 |
|---|---|
| `client:load` | 页面加载后立即 hydrate |
| `client:idle` | `requestIdleCallback` 后 |
| <span v-pre>`client:idle={{ timeout: 1000 }}`</span> | 兜底超时 |
| `client:visible` | IntersectionObserver 进入视口 |
| <span v-pre>`client:visible={{ rootMargin: '200px' }}`</span> | 自定义 IO 配置 |
| `client:media="(min-width: 768px)"` | 媒体查询匹配 |
| `client:only="<framework>"` | 仅客户端 render，跳过 SSR；必须指定框架 |

### Server

| 指令 | 说明 |
|---|---|
| `server:defer` | 服务端 island，异步加载 |

### Script / Style

| 指令 | 说明 |
|---|---|
| `is:global` | `<style is:global>` 退出 scoped |
| `is:inline` | `<script is:inline>` 原样输出，不 bundle |
| <span v-pre>`define:vars={{ x, y }}`</span> | 把 frontmatter 变量编译时注入 script / style |

### 其他

| 指令 | 说明 |
|---|---|
| `is:raw` | 子内容不解析（用于显示 `{ }` 模板字面量） |
| `transition:name="x"` | 跨页元素配对（View Transitions） |
| `transition:animate="fade"` | 动画方式（fade / slide / initial / none / 自定义） |
| `transition:persist` | 跨页保留 DOM / 状态 |
| `transition:persist-props` | 持久化时是否保留 props |
| `data-astro-reload` | `<a>` 强制整页刷新（绕过 ClientRouter） |
| `data-astro-history="replace"` | 替换历史而非 push |
| `data-astro-prefetch` | 配 `prefetch.defaultStrategy = 'tap'` 时显式启用 |

## `Astro` 全局对象

仅在 `.astro` 文件可用。

### Props / Params / URL

| 字段 | 类型 | 说明 |
|---|---|---|
| `Astro.props` | 任意 | 父组件传入的 props（含 `getStaticPaths` 的 `props`） |
| `Astro.params` | `Record<string, string \| undefined>` | 动态路由参数 |
| `Astro.url` | `URL` | 当前请求 URL |
| `Astro.site` | `URL \| undefined` | `config.site` |
| `Astro.generator` | `string` | `'Astro v5.x.x'` |
| `Astro.routePattern` | `string` | 当前路由模式（如 `/blog/[slug]`） |
| `Astro.originPathname` | `string` | 中间件 rewrite 之前的原 pathname |
| `Astro.isPrerendered` | `boolean` | 是否在预渲染中 |

### Request / Response

| 字段 | 类型 | 说明 |
|---|---|---|
| `Astro.request` | `Request` | Web 标准 Request 对象 |
| `Astro.response` | `ResponseInit` | 可写 `status` / `statusText` / `headers` |
| `Astro.clientAddress` | `string` | 客户端 IP（仅 on-demand） |
| `Astro.preferredLocale` | `string \| undefined` | 浏览器首选 locale（与 `i18n.locales` 取交集） |
| `Astro.preferredLocaleList` | `string[]` | 全部按优先级 |
| `Astro.currentLocale` | `string \| undefined` | 当前页 locale |

### Cookies

| 方法 | 说明 |
|---|---|
| `Astro.cookies.get(name)` | 读 cookie，返回 `AstroCookie \| undefined` |
| `Astro.cookies.set(name, value, options)` | 写 cookie |
| `Astro.cookies.delete(name, options)` | 删除（写空 + 过期） |
| `Astro.cookies.has(name)` | 是否存在 |
| `Astro.cookies.merge(otherCookies)` | 合并另一个 AstroCookies |
| `Astro.cookies.headers()` | 返回 Set-Cookie 头数组 |
| `Astro.cookies.consume()` | 返回 + 阻止后续修改 |

```ts
Astro.cookies.set('session', token, {
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7,
  expires: new Date('2026-12-31'),
  domain: '.example.com',
  encode: encodeURIComponent,
});
```

### Session（5.7+）

| 方法 | 说明 |
|---|---|
| `Astro.session.get(key)` | 读 |
| `Astro.session.set(key, value)` | 写 |
| `Astro.session.regenerate()` | 换新 session ID |
| `Astro.session.destroy()` | 销毁 session |
| `Astro.session.load(sessionId)` | 手动加载特定 session |

### Locals

| 字段 | 说明 |
|---|---|
| `Astro.locals` | 中间件传过来的任意数据（`App.Locals` 接口扩展） |

### Slots

| 方法 | 说明 |
|---|---|
| `Astro.slots.has(name)` | 是否有 slot 内容 |
| `Astro.slots.render(name, args?)` | 异步把 slot 渲染成 HTML 字符串 |

```astro
---
const hasFooter = Astro.slots.has('footer');
const headerHtml = await Astro.slots.render('header');
---

<header set:html={headerHtml} />
{hasFooter && <footer><slot name="footer" /></footer>}
```

### 其他

| 字段 / 方法 | 说明 |
|---|---|
| `Astro.self` | 递归引用当前组件（树形结构很有用） |
| `Astro.redirect(path, status?)` | 返回重定向 Response |
| `Astro.rewrite(path \| URL \| Request)` | 不跳转，渲染另一路由 |
| `Astro.callAction(action, input)` | 在 `.astro` 中调用 action |
| `Astro.getActionResult(action)` | 拿 form action 的结果（POST 后渲染同页时） |
| `Astro.csp.insertDirective(...)` | 运行时插入 CSP 指令 |
| `Astro.csp.insertScriptResource(...)` | 插入 script-src 资源 |
| `Astro.csp.insertStyleResource(...)` | 插入 style-src 资源 |

## `APIRoute` Context（端点）

```ts
import type { APIRoute, APIContext } from 'astro';

export const GET: APIRoute = ({
  request,         // Request
  url,             // URL
  params,          // Record<string, string>
  cookies,         // AstroCookies（同 Astro.cookies）
  redirect,        // (path, status?) => Response
  rewrite,         // (path \| URL \| Request) => Response
  site,            // URL \| undefined
  generator,       // string
  preferredLocale, // string \| undefined
  preferredLocaleList,
  currentLocale,
  locals,          // App.Locals
  session,         // 同 Astro.session
  clientAddress,   // string
  request,         // Request
  callAction,      // 调 action
  getActionResult,
}: APIContext) => {
  return new Response('Hi');
};
```

完全镜像 `Astro` 全局对象。

## `Astro:*` 虚拟模块

### `astro:assets`

```ts
import { Image, Picture, getImage, inferRemoteSize } from 'astro:assets';
import type { ImageMetadata } from 'astro:assets';
```

### `astro:content`

```ts
import {
  defineCollection,
  getCollection,
  getEntry,
  getEntries,
  reference,
  render,
  z,            // Astro 5；Astro 6 改 astro/zod
} from 'astro:content';

import { glob, file } from 'astro/loaders';
```

Live collections（5.10+）：

```ts
import {
  defineLiveCollection,
  getLiveCollection,
  getLiveEntry,
} from 'astro:content';
```

### `astro:actions`

```ts
import { defineAction, ActionError } from 'astro:actions';
import { actions } from 'astro:actions';
import { z } from 'astro:schema';   // 5.x；6.x 改 astro/zod
```

### `astro:middleware`

```ts
import { defineMiddleware, sequence } from 'astro:middleware';
import type { MiddlewareHandler } from 'astro:middleware';
```

### `astro:transitions` / `astro:transitions/client`

```ts
// 服务端 / 模板
import { ClientRouter, fade, slide } from 'astro:transitions';

// 客户端脚本
import { navigate, supportsViewTransitions, getFallback } from 'astro:transitions/client';
```

### `astro:i18n`

```ts
import {
  getRelativeLocaleUrl,
  getAbsoluteLocaleUrl,
  getRelativeLocaleUrlList,
  getAbsoluteLocaleUrlList,
  getPathByLocale,
  getLocaleByPath,
  redirectToDefaultLocale,
  redirectToFallback,
  notFound,
  middleware,
} from 'astro:i18n';
```

### `astro:env`

```ts
// 客户端可读的 public
import { PUBLIC_API_URL } from 'astro:env/client';

// 服务端
import { DATABASE_URL, getSecret } from 'astro:env/server';
```

### `astro:db`

```ts
import { db, Author, Post } from 'astro:db';
import { eq, desc, asc, and, or, gt, lt, like, sql, count } from 'astro:db';
import { isDbError, getDbError } from 'astro:db';
```

### `astro:schema`（Zod 重导出，5.x）

```ts
import { z } from 'astro:schema';
```

> Astro 6 改为 `astro/zod`，`astro:schema` deprecated。

### `astro:config/server` / `astro:config/client`

```ts
// 编译时注入的配置
import { trailingSlash, BASE_URL, build } from 'astro:config/server';
```

## `astro.config.mjs` 字段全表

```js
import { defineConfig, envField } from 'astro/config';

export default defineConfig({
  // === 站点 / URL ===
  site: 'https://example.com',         // 部署 URL
  base: '/docs',                       // path 前缀
  trailingSlash: 'never',              // 'always' | 'never' | 'ignore'

  // === 渲染 ===
  output: 'static',                    // 'static' | 'server'
  adapter: node({ mode: 'standalone' }), // SSR 必填

  // === 目录 ===
  root: '.',                           // 项目根
  srcDir: './src',
  publicDir: './public',
  outDir: './dist',
  cacheDir: './node_modules/.astro',

  // === 集成 ===
  integrations: [
    react(),
    mdx(),
    sitemap(),
  ],

  // === Build ===
  build: {
    format: 'directory',               // 'file' | 'directory' | 'preserve'
    assets: '_astro',                  // 资源目录名
    assetsPrefix: 'https://cdn.example.com', // CDN 前缀
    inlineStylesheets: 'auto',         // 'always' | 'auto' | 'never'
    concurrency: 4,                    // 并行渲染数
    serverEntry: 'entry.mjs',
    redirects: true,                   // 用 HTML / Adapter redirects
    client: './dist/client',
    server: './dist/server',
  },

  // === Dev server ===
  server: {
    host: '0.0.0.0',                   // 监听地址
    port: 4321,
    open: '/blog',                     // 启动后打开页面
    headers: { 'X-Custom': 'value' },
    allowedHosts: ['my-tunnel.com'],
  },

  // === Markdown ===
  markdown: {
    syntaxHighlight: 'shiki',          // 'shiki' | 'prism' | false
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      langs: ['ts', 'astro', 'svelte'],
      wrap: true,
    },
    remarkPlugins: [],
    rehypePlugins: [],
    gfm: true,
    smartypants: true,
    remarkRehype: {},
  },

  // === Image ===
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
    domains: ['cdn.example.com'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.example.com' },
    ],
    layout: 'constrained',
    objectFit: 'cover',
    objectPosition: 'center',
    breakpoints: [320, 640, 1024, 1280, 1920],
    experimentalDefaultStyles: true,
  },

  // === i18n ===
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en', 'ja'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: true,
      fallbackType: 'redirect',        // 'redirect' | 'rewrite'
    },
    fallback: { ja: 'en' },
    domains: { en: 'https://en.example.com' },
  },

  // === Redirects ===
  redirects: {
    '/old-blog/[slug]': '/blog/[slug]',
    '/temp': { status: 302, destination: '/' },
  },

  // === Prefetch ===
  prefetch: {
    prefetchAll: true,                 // 全站默认 prefetch
    defaultStrategy: 'hover',          // 'hover' | 'tap' | 'viewport' | 'load'
  },

  // === Security ===
  security: {
    checkOrigin: true,                 // CSRF 防护（默认 true）
    csp: {
      enabled: true,
      directives: ["default-src 'self'"],
    },
    allowedDomains: ['example.com'],
  },

  // === Session（5.7+） ===
  session: {
    driver: 'fs',                      // 'fs' | 'redis' | 'memory' | adapter 默认
    options: { url: process.env.REDIS_URL },
    cookie: 'astro-session',
    ttl: 60 * 60 * 24 * 7,
  },

  // === Env（type-safe） ===
  env: {
    schema: {
      PUBLIC_API_URL: envField.string({ context: 'client', access: 'public' }),
      DATABASE_URL: envField.string({ context: 'server', access: 'secret' }),
    },
    validateSecrets: true,
  },

  // === Compress / Style scoping ===
  compressHTML: true,
  scopedStyleStrategy: 'attribute',    // 'where' | 'class' | 'attribute'

  // === DevToolbar ===
  devToolbar: { enabled: true },

  // === Legacy（Astro 5 过渡，6 删）===
  legacy: { collections: false },

  // === Experimental ===
  experimental: {
    // Astro 5 现存：
    // session（已稳定为顶层 session）
    // serverIslands（已稳定）
    // contentLayer（已稳定）
    // 都已默认开
  },

  // === Vite 透传 ===
  vite: {
    plugins: [],
    resolve: { alias: { '@': '/src' } },
    optimizeDeps: {},
    ssr: { noExternal: [] },
  },
});
```

## CLI 命令

```bash
astro --help

astro dev                # 启动 dev server
astro build              # 构建
astro preview            # 预览 dist/
astro check              # TS + Astro 类型检查（含 .astro 模板）
astro check --watch      # watch 模式
astro sync               # 重新生成 .astro/types.d.ts
astro add <name>         # 安装并配置集成（react / tailwind / mdx / sitemap / node / vercel / netlify / cloudflare ...）
astro telemetry disable  # 关闭遥测
astro info               # 打印环境信息（debug 用）
astro docs               # 在浏览器打开文档

# Astro DB
astro db push
astro db push --remote
astro db verify
astro db execute seed.ts

# 升级
npx @astrojs/upgrade
```

### dev 命令选项

```bash
astro dev --port 8080
astro dev --host 0.0.0.0
astro dev --open
astro dev --site https://example.com
astro dev --base /docs
astro dev --root /path/to/project
astro dev --config astro.config.production.mjs
astro dev --verbose
astro dev --silent
```

### build 命令选项

```bash
astro build
astro build --remote               # Astro DB 用远程 DB 构建
astro build --site https://...
astro build --base /docs
```

## TS 配置档位

```json
// 三档（继承自 astro/tsconfigs/）
{ "extends": "astro/tsconfigs/base" }       // 宽松
{ "extends": "astro/tsconfigs/strict" }     // 推荐
{ "extends": "astro/tsconfigs/strictest" }  // 最严
```

### App 类型扩展

```ts
// src/env.d.ts

/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user?: { id: string; name: string };
    requestId: string;
  }

  interface SessionData {
    cart: string[];
    user: { id: string; name: string };
  }
}
```

## Actions API

```ts
import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';

export const server = {
  myAction: defineAction({
    accept: 'json',                            // 'json'（默认） | 'form'
    input: z.object({ name: z.string() }),     // Zod schema（可选）
    handler: async (input, context) => {
      // input 严格匹配 schema
      // context = APIContext
      if (!input.name) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: '需要 name',
        });
      }
      return { greeting: `Hello ${input.name}` };
    },
  }),
};
```

### `ActionError.code` 列表

`BAD_REQUEST` / `UNAUTHORIZED` / `FORBIDDEN` / `NOT_FOUND` / `TIMEOUT` / `CONFLICT` / `PRECONDITION_FAILED` / `PAYLOAD_TOO_LARGE` / `UNSUPPORTED_MEDIA_TYPE` / `UNPROCESSABLE_CONTENT` / `TOO_MANY_REQUESTS` / `CLIENT_CLOSED_REQUEST` / `INTERNAL_SERVER_ERROR`。

### 调用

```ts
// Client
import { actions } from 'astro:actions';

const { data, error } = await actions.myAction({ name: 'Alice' });
// 或
const data = await actions.myAction.orThrow({ name: 'Alice' });

// .astro
const result = await Astro.callAction(actions.myAction, { name: 'Alice' });

// Form action
<form method="POST" action={actions.myAction}>
  <input name="name" />
  <button>OK</button>
</form>

// Form action 提交后读结果
const result = Astro.getActionResult(actions.myAction);
```

## Content Collections API

### 定义

```ts
import { defineCollection, reference, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    cover: image().optional(),                 // ImageMetadata
    author: reference('authors'),
    tags: z.array(z.string()).default([]),
  }),
});
```

### Loader 接口

```ts
import type { Loader } from 'astro/loaders';

const myLoader: Loader = {
  name: 'my-loader',
  load: async ({ store, logger, parseData, meta, generateDigest }) => {
    const items = await fetch('https://api.example.com').then((r) => r.json());
    for (const item of items) {
      const data = await parseData({ id: String(item.id), data: item });
      const digest = generateDigest(data);
      store.set({ id: String(item.id), data, digest });
    }
  },
  schema: z.object({ /* ... */ }),
};
```

### Query

```ts
import { getCollection, getEntry, getEntries, render } from 'astro:content';

// 全部
const all = await getCollection('blog');

// 过滤
const published = await getCollection('blog', ({ data }) => !data.draft);

// 单个
const post = await getEntry('blog', 'hello');

// 多个（reference 列表）
const related = await getEntries(post.data.relatedPosts);

// 渲染 Markdown
const { Content, headings, remarkPluginFrontmatter } = await render(post);
```

### Entry 形状

```ts
interface CollectionEntry<C> {
  id: string;
  collection: C;
  data: InferEntrySchema<C>;
  body?: string;
  filePath?: string;
  digest?: string;
}
```

## Astro Image API

```ts
import { Image, Picture, getImage, inferRemoteSize } from 'astro:assets';
import type { ImageMetadata } from 'astro:assets';
```

### `<Image />` props

```astro
<Image
  src={importedImage}    // ImageMetadata 或 string（远程必须配 domains/remotePatterns）
  alt="..."              // 必填
  width={1280}
  height={720}
  format="webp"          // 'avif' | 'webp' | 'jpg' | 'png' | 'gif' | 'svg'
  quality={80}
  loading="lazy"         // 'lazy' | 'eager'
  decoding="async"
  fetchpriority="auto"
  inferSize             // 远程图自动 fetch 尺寸
  densities={[1, 2]}    // [1, 2] = 1x / 2x retina
  widths={[400, 800, 1200]}
  sizes="(max-width: 768px) 100vw, 50vw"
  layout="constrained"  // 'constrained' | 'full-width' | 'fixed' | 'none'
  fit="cover"
  position="center"
/>
```

### `<Picture />` props

```astro
<Picture
  src={importedImage}
  alt="..."
  formats={['avif', 'webp', 'jpg']}  // 输出多源
  fallbackFormat="png"
  widths={[400, 800, 1200]}
  sizes="..."
  pictureAttributes={{ class: 'my-picture' }}
  // 其他属性同 <Image />
/>
```

### `getImage()`

```ts
const optimized = await getImage({
  src: hero,
  width: 800,
  format: 'webp',
  quality: 80,
});

console.log(optimized.src);          // /_astro/hero.xxx.webp
console.log(optimized.width);
console.log(optimized.height);
console.log(optimized.attributes);   // { src, width, height, loading, decoding, ... }
```

### `inferRemoteSize()`

```ts
const { width, height } = await inferRemoteSize('https://cdn.example.com/photo.jpg');
```

## Adapter 配置

### `@astrojs/node`

```ts
import node from '@astrojs/node';

adapter: node({
  mode: 'standalone',     // 'standalone'（自带 server）| 'middleware'（嵌入 Express）
  experimentalStaticHeaders: false,
})
```

### `@astrojs/vercel`

```ts
import vercel from '@astrojs/vercel';

adapter: vercel({
  webAnalytics: { enabled: true },
  speedInsights: { enabled: true },
  imageService: true,
  imagesConfig: { sizes: [320, 640, 1024] },
  isr: { expiration: 60 * 60 },
  edgeMiddleware: true,
  maxDuration: 30,
  includeFiles: ['./public/some-asset.json'],
})
```

### `@astrojs/netlify`

```ts
import netlify from '@astrojs/netlify';

adapter: netlify({
  edgeMiddleware: true,
  cacheOnDemandPages: true,
  imageCDN: true,
})
```

### `@astrojs/cloudflare`

```ts
import cloudflare from '@astrojs/cloudflare';

adapter: cloudflare({
  platformProxy: { enabled: true },     // dev 时连本地 KV / D1 / R2
  imageService: 'compile',              // 'compile' | 'cloudflare' | 'passthrough'
  routes: {
    extend: { include: [{ pattern: '/api/*' }] },
  },
})
```

## Middleware API

```ts
import { defineMiddleware, sequence } from 'astro:middleware';
import type { MiddlewareHandler } from 'astro:middleware';

const a: MiddlewareHandler = async (context, next) => {
  // context 完全等同 APIContext（除了 props / params 等页面属性）
  context.locals.foo = 'bar';
  const response = await next();
  response.headers.set('X-Custom', 'value');
  return response;
};

export const onRequest = sequence(a, b, c);
```

## View Transitions API

### Component

```astro
import { ClientRouter } from 'astro:transitions';

<ClientRouter
  fallback="animate"        <!-- 'animate' | 'swap' | 'none' -->
/>
```

### Directives

```astro
<div transition:name="hero" />
<div transition:animate="fade" />
<div transition:animate="slide" />
<div transition:animate="initial" />
<div transition:animate="none" />

<!-- 自定义动画 -->
---
import { fade, slide } from 'astro:transitions';
const myFade = fade({ duration: '0.4s' });
const mySlide = slide({ duration: '0.3s' });
---
<div transition:animate={myFade}>...</div>

<!-- 持久化 -->
<audio transition:persist transition:persist-props />
```

### 事件

```ts
document.addEventListener('astro:before-preparation', (e) => { /* ... */ });
document.addEventListener('astro:after-preparation', (e) => { /* ... */ });
document.addEventListener('astro:before-swap', (e) => { /* ... */ });
document.addEventListener('astro:after-swap', (e) => { /* ... */ });
document.addEventListener('astro:page-load', (e) => { /* ... */ });
```

### 程序化

```ts
import { navigate } from 'astro:transitions/client';

navigate('/about');
navigate('/about', { history: 'replace' });  // 'auto' | 'push' | 'replace'
navigate('/about', { formData });            // 提交表单方式跳
```

## `astro:env` API

```ts
// astro.config.mjs
import { defineConfig, envField } from 'astro/config';

env: {
  schema: {
    PUBLIC_API_URL: envField.string({
      context: 'client',
      access: 'public',
      default: 'https://api.example.com',
      optional: true,
    }),
    LOG_LEVEL: envField.enum({
      values: ['debug', 'info', 'warn', 'error'],
      context: 'server',
      access: 'public',
      default: 'info',
    }),
    MAX_FILES: envField.number({
      context: 'server',
      access: 'public',
      default: 100,
    }),
    ENABLE_BETA: envField.boolean({
      context: 'server',
      access: 'public',
      default: false,
    }),
  },
}
```

字段类型：`envField.string` / `envField.number` / `envField.boolean` / `envField.enum`。
属性：`context: 'client' | 'server'`、`access: 'public' | 'secret'`、`default`、`optional`。

```ts
import { PUBLIC_API_URL } from 'astro:env/client';
import { LOG_LEVEL, MAX_FILES, getSecret } from 'astro:env/server';

const stripeKey = getSecret('STRIPE_API_KEY');
```

## `astro:i18n` API

```ts
import {
  getRelativeLocaleUrl,         // (locale, path) => string
  getAbsoluteLocaleUrl,         // (locale, path) => string
  getRelativeLocaleUrlList,     // (path) => string[]
  getAbsoluteLocaleUrlList,
  getPathByLocale,              // (locale) => string
  getLocaleByPath,              // (path) => string
  redirectToDefaultLocale,      // (context, statusCode?) => Response
  redirectToFallback,           // (context, response) => Response
  notFound,                     // (context, response?) => Response
  middleware,                   // (options) => MiddlewareHandler
} from 'astro:i18n';
```

```astro
---
const enUrl = getRelativeLocaleUrl('en', 'about');    // '/en/about'
const fullUrl = getAbsoluteLocaleUrl('en', 'about');  // 'https://example.com/en/about'
---
```

## Astro DB API

```ts
import { db, eq, ne, gt, lt, gte, lte, like, isNull, isNotNull, and, or, not,
         asc, desc, sql, count, sum, avg, max, min } from 'astro:db';
import { Author, Post } from 'astro:db';

// SELECT
const rows = await db.select().from(Post).where(eq(Post.id, 'x'));
const rows2 = await db.select({ title: Post.title }).from(Post);

// JOIN
await db.select().from(Post)
  .innerJoin(Author, eq(Post.authorId, Author.id))
  .where(eq(Author.id, 'alice'));

// INSERT
await db.insert(Post).values({ id: 'x', title: 'X', /* ... */ });
await db.insert(Post).values([{ /* ... */ }, { /* ... */ }]);

// UPDATE
await db.update(Post).set({ views: 100 }).where(eq(Post.id, 'x'));

// DELETE
await db.delete(Post).where(eq(Post.id, 'x'));

// Transaction（5.4+）
await db.transaction(async (tx) => {
  await tx.insert(Author).values({ /* ... */ });
  await tx.insert(Post).values({ /* ... */ });
});

// Raw SQL
await db.run(sql`UPDATE Post SET views = views + 1 WHERE id = ${id}`);
```

### 列类型

```ts
column.text({ primaryKey, optional, unique, default, references })
column.number({ primaryKey, optional, unique, default, references })
column.boolean({ optional, default })
column.date({ optional, default })
column.json({ optional, default })
```

## 集成开发 API

```ts
// my-integration.ts
import type { AstroIntegration } from 'astro';

export default function myIntegration(): AstroIntegration {
  return {
    name: 'my-integration',
    hooks: {
      'astro:config:setup': ({ config, updateConfig, addRenderer, injectRoute, injectScript, addDevToolbarApp, addMiddleware, command, isRestart, logger }) => {
        // ...
      },
      'astro:config:done': ({ config, setAdapter, injectTypes, logger }) => { /* ... */ },
      'astro:server:setup': ({ server, logger }) => { /* ... */ },
      'astro:server:start': ({ address, logger }) => { /* ... */ },
      'astro:server:done': ({ logger }) => { /* ... */ },
      'astro:build:start': ({ logger }) => { /* ... */ },
      'astro:build:setup': ({ vite, pages, target, logger }) => { /* ... */ },
      'astro:build:generated': ({ dir, logger }) => { /* ... */ },
      'astro:build:ssr': ({ manifest, entryPoints, middlewareEntryPoint, logger }) => { /* ... */ },
      'astro:routes:resolved': ({ routes, logger }) => { /* ... */ },
      'astro:build:done': ({ pages, dir, logger }) => { /* ... */ },
    },
  };
}
```

## 错误码 / `ActionError.code`

完整 HTTP 状态码映射：

| Code | HTTP |
|---|---|
| `BAD_REQUEST` | 400 |
| `UNAUTHORIZED` | 401 |
| `FORBIDDEN` | 403 |
| `NOT_FOUND` | 404 |
| `METHOD_NOT_ALLOWED` | 405 |
| `TIMEOUT` | 408 |
| `CONFLICT` | 409 |
| `PRECONDITION_FAILED` | 412 |
| `PAYLOAD_TOO_LARGE` | 413 |
| `UNSUPPORTED_MEDIA_TYPE` | 415 |
| `UNPROCESSABLE_CONTENT` | 422 |
| `TOO_MANY_REQUESTS` | 429 |
| `CLIENT_CLOSED_REQUEST` | 499 |
| `INTERNAL_SERVER_ERROR` | 500 |

## 默认环境变量

```ts
import.meta.env.MODE              // 'development' | 'production'
import.meta.env.PROD              // boolean
import.meta.env.DEV               // boolean
import.meta.env.SSR               // boolean（true = 服务端）
import.meta.env.BASE_URL          // config.base
import.meta.env.SITE              // config.site
import.meta.env.ASSETS_PREFIX     // build.assetsPrefix
```

## 文档与社区

- [docs.astro.build](https://docs.astro.build/) —— 官方文档
- [github.com/withastro/astro](https://github.com/withastro/astro) —— 源码 + Issues + Discussions
- [astro.build/blog](https://astro.build/blog/) —— 发布说明
- [astro.build/integrations](https://astro.build/integrations/) —— 800+ 集成
- [astro.build/chat](https://astro.build/chat) —— Discord
