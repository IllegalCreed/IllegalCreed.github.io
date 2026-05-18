---
layout: doc
outline: [2, 3]
---

# 指南 - 高级

> Content Layer 深度、Astro DB、i18n、Streaming、Middleware 进阶、多框架混用、部署详解

## 速查

- **Content Layer**（Astro 5）：`defineCollection({ loader, schema })`；`loader` 是核心抽象，决定数据从哪来
- **内置 loader**：`glob({ pattern, base })` / `file({ path })`；可写自定义 loader 抓远程 API
- **Live Collections**（5.10+）：`defineLiveCollection` 让 collection 在请求时刷新
- **Astro DB**：`@astrojs/db`，基于 libSQL（Turso），本地 sqlite + 云端，type-safe queries
- **i18n**：`astro.config.mjs` 的 `i18n` 字段；`prefixDefaultLocale` / `redirectToDefaultLocale` / `domains` / `fallback`
- **Streaming**：Astro 默认流式 SSR；`server:defer` 是流式协议的关键
- **多框架混用**：同一页可 React + Vue + Svelte + Solid + Preact + Alpine，每个 island 独立
- **部署模式**：Static / Static + on-demand / Full SSR / Edge

## Content Layer API（Astro 5）

Astro 5 重新设计 Content Collections —— 引入 **loader** 抽象：

```ts
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

export const collections = {
  // 用 glob loader 拉本地 markdown
  blog: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
    schema: z.object({
      title: z.string(),
      pubDate: z.coerce.date(),
      author: z.string(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
    }),
  }),

  // 用 file loader 拉一个 JSON 文件里的多条记录
  authors: defineCollection({
    loader: file('src/data/authors.json'),
    schema: z.object({
      id: z.string(),
      name: z.string(),
      bio: z.string().optional(),
    }),
  }),
};
```

### 内置 loaders

**`glob()`** —— 从目录抓多个文件：

```ts
import { glob } from 'astro/loaders';

// 抓 src/content/blog/**/*.md
glob({ pattern: '**/*.md', base: './src/content/blog' });

// 多扩展名
glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' });

// 排除草稿
glob({ pattern: ['**/*.md', '!**/_drafts/**'], base: './src/content/blog' });
```

ID 由文件路径自动生成：

```
src/content/blog/2026/hello.md   → id: '2026/hello'
src/content/blog/about.md        → id: 'about'
```

**`file()`** —— 从单文件抓多条记录：

```ts
import { file } from 'astro/loaders';

// JSON 数组
file('src/data/authors.json');

// YAML / TOML（5.9+）
file('src/data/sites.yaml');
```

JSON 内容：

```json
[
  { "id": "alice", "name": "Alice", "bio": "..." },
  { "id": "bob", "name": "Bob" }
]
```

每条记录必须有 `id` 字段。

### 自定义 loader（拉远程 API）

```ts
import { defineCollection, z } from 'astro:content';
import type { Loader } from 'astro/loaders';

function apiLoader(url: string): Loader {
  return {
    name: 'api-loader',
    load: async ({ store, logger, parseData }) => {
      logger.info('Fetching from API');
      const res = await fetch(url);
      const items = await res.json();

      // 清空旧数据
      store.clear();

      // 写新数据
      for (const item of items) {
        const data = await parseData({ id: String(item.id), data: item });
        store.set({ id: String(item.id), data });
      }
    },
    schema: z.object({
      id: z.number(),
      title: z.string(),
      body: z.string(),
    }),
  };
}

export const collections = {
  posts: defineCollection({
    loader: apiLoader('https://jsonplaceholder.typicode.com/posts'),
  }),
};
```

> 自定义 loader 可以做增量同步、按 hash diff 跳过未变记录。

### 查询 API

```ts
import { getCollection, getEntry, getEntries, render } from 'astro:content';

// 拿所有
const allPosts = await getCollection('blog');

// 带过滤
const published = await getCollection('blog', ({ data }) => !data.draft);

// 拿单条
const post = await getEntry('blog', 'hello');

// 拿多条（关联）
const posts = await getEntries([
  { collection: 'blog', id: 'a' },
  { collection: 'blog', id: 'b' },
]);

// 渲染 markdown 内容
const { Content, headings, remarkPluginFrontmatter } = await render(post);
```

### 渲染 markdown

```astro
---
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { id: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content, headings } = await render(post);
---

<article>
  <h1>{post.data.title}</h1>

  <!-- 目录 -->
  <nav>
    {headings.map((h) => (
      <a href={`#${h.slug}`} style={`padding-left: ${(h.depth - 1) * 12}px`}>
        {h.text}
      </a>
    ))}
  </nav>

  <!-- 主体 -->
  <Content />
</article>
```

### Collection 之间关联（references）

```ts
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    cover: image(),                            // ImageMetadata 类型
    author: reference('authors'),              // 关联 authors collection
    relatedPosts: z.array(reference('blog')),  // 关联自己
  }),
});

const authors = defineCollection({
  loader: file('src/data/authors.json'),
  schema: z.object({ id: z.string(), name: z.string() }),
});

export const collections = { blog, authors };
```

```ts
import { getEntry, getEntries } from 'astro:content';

const post = await getEntry('blog', 'hello');
const author = await getEntry(post.data.author);          // 解引用
const related = await getEntries(post.data.relatedPosts); // 解多个
```

### 图片 schema

```ts
schema: ({ image }) => z.object({
  cover: image(),               // Astro 自动转 ImageMetadata
}),
```

```astro
---
import { Image } from 'astro:assets';
const { post } = Astro.props;
---

<Image src={post.data.cover} alt={post.data.title} />
```

### Live Collections（5.10+）

按请求刷新的 collection（替代 fetch + cache 模式）：

```ts
// src/live.config.ts
import { defineLiveCollection } from 'astro:content';

export const collections = {
  weather: defineLiveCollection({
    loader: async () => {
      const res = await fetch('https://api.weather.com/now');
      return [{ id: 'now', data: await res.json() }];
    },
  }),
};
```

```astro
---
import { getLiveCollection } from 'astro:content';

export const prerender = false;   // live 必须 on-demand

const weather = await getLiveCollection('weather');
---

<p>气温：{weather[0].data.temperature}℃</p>
```

> Live collections 需要 adapter（必须 on-demand）。

### Legacy collections（Astro 5 过渡）

Astro 4 写法仍可通过 legacy 标志维持：

```js
// astro.config.mjs
export default defineConfig({
  legacy: { collections: true },   // 4.x 风格继续可用
});
```

> Astro 6 已完全移除 legacy，必须迁到 Content Layer。

## Astro DB（`@astrojs/db`）

基于 libSQL（SQLite 兼容），开发本地、生产连 Turso 云。

### 安装

```bash
npx astro add db
```

`astro.config.mjs` 自动加：

```js
import db from '@astrojs/db';

export default defineConfig({
  integrations: [db()],
});
```

### 定义 schema

```ts
// db/config.ts
import { defineDb, defineTable, column } from 'astro:db';

const Author = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    name: column.text(),
    bio: column.text({ optional: true }),
  },
});

const Post = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    title: column.text(),
    body: column.text(),
    publishedAt: column.date(),
    views: column.number({ default: 0 }),
    authorId: column.text({ references: () => Author.columns.id }),
  },
  indexes: [
    { on: ['authorId'], unique: false },
  ],
});

export default defineDb({
  tables: { Author, Post },
});
```

列类型：`column.text()` / `column.number()` / `column.boolean()` / `column.date()` / `column.json()`。

### Seed（开发数据）

```ts
// db/seed.ts
import { db, Author, Post } from 'astro:db';

export default async function seed() {
  await db.insert(Author).values([
    { id: 'alice', name: 'Alice', bio: '...' },
    { id: 'bob', name: 'Bob' },
  ]);

  await db.insert(Post).values([
    {
      id: 'hello',
      title: 'Hello',
      body: '...',
      publishedAt: new Date('2026-01-01'),
      authorId: 'alice',
    },
  ]);
}
```

`pnpm dev` 时自动跑（开发库会清空 + seed）。

### 查询

```astro
---
import { db, Post, Author, eq, desc } from 'astro:db';

// SELECT * FROM Post ORDER BY publishedAt DESC LIMIT 10
const posts = await db
  .select()
  .from(Post)
  .orderBy(desc(Post.publishedAt))
  .limit(10);

// JOIN
const postsWithAuthor = await db
  .select()
  .from(Post)
  .innerJoin(Author, eq(Post.authorId, Author.id));

// WHERE
const myPosts = await db
  .select()
  .from(Post)
  .where(eq(Post.authorId, 'alice'));
---

<ul>
  {posts.map((p) => <li>{p.title}</li>)}
</ul>
```

### Insert / Update / Delete

```ts
import { db, Post, eq } from 'astro:db';

// INSERT
await db.insert(Post).values({
  id: 'new',
  title: 'New',
  body: '...',
  publishedAt: new Date(),
  authorId: 'alice',
});

// UPDATE
await db.update(Post).set({ views: 100 }).where(eq(Post.id, 'hello'));

// DELETE
await db.delete(Post).where(eq(Post.id, 'old'));
```

### 部署到 Turso

```bash
# 创建 Turso 数据库
turso db create my-app

# 拿连接信息
turso db show my-app --url     # libsql://...
turso db tokens create my-app  # token

# 环境变量
ASTRO_DB_REMOTE_URL=libsql://...
ASTRO_DB_APP_TOKEN=...

# 推 schema
pnpm astro db push --remote
```

构建：

```bash
pnpm build --remote     # 用 remote DB 构建
```

### CLI 命令

```bash
astro db push          # 推 schema 到本地（开发）
astro db push --remote # 推到 Turso（生产）
astro db verify        # 校验 schema
astro db execute seed.ts --remote   # 跑 seed 文件
```

> Astro DB 在 5.x 仍是 stable 集成，但生态规模和扩展性不及 Drizzle / Prisma 直连。中等以上项目建议直接接成熟 ORM。

## 国际化（i18n）

```js
// astro.config.mjs
export default defineConfig({
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en', 'ja'],

    routing: {
      prefixDefaultLocale: false,        // / 是默认（zh），/en/about 是英文
      redirectToDefaultLocale: true,     // 直接访问根强制跳 /zh（默认 true，Astro 6 改 false）
    },

    fallback: {
      ja: 'en',   // 没有 ja 翻译时退回 en
    },
  },
});
```

### 目录结构

```
src/pages/
├── index.astro              # / （默认 zh）
├── about.astro              # /about
├── en/
│   ├── index.astro          # /en
│   └── about.astro          # /en/about
└── ja/
    ├── index.astro          # /ja
    └── about.astro          # /ja/about
```

### `astro:i18n` 工具函数

```astro
---
import {
  getRelativeLocaleUrl,
  getAbsoluteLocaleUrl,
  getLocaleByPath,
} from 'astro:i18n';

const aboutEn = getRelativeLocaleUrl('en', 'about');      // /en/about
const aboutEnAbs = getAbsoluteLocaleUrl('en', 'about');   // https://site.com/en/about
const currentLocale = getLocaleByPath(Astro.url.pathname);
---

<a href={aboutEn}>English</a>
```

### `Astro.preferredLocale`

```astro
---
const preferred = Astro.preferredLocale;       // 浏览器 Accept-Language 与 locales 的交集
const list = Astro.preferredLocaleList;        // 全部按优先级排列
const current = Astro.currentLocale;           // 当前页 locale
---
```

### Manual routing（关闭自动）

```js
i18n: {
  defaultLocale: 'zh',
  locales: ['zh', 'en'],
  routing: 'manual',     // 关闭自动 middleware，自己写
},
```

```ts
// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const accept = context.request.headers.get('accept-language') ?? '';
  if (accept.startsWith('en') && !context.url.pathname.startsWith('/en')) {
    return context.redirect('/en' + context.url.pathname);
  }
  return next();
});
```

### Domains 模式

```js
i18n: {
  defaultLocale: 'zh',
  locales: ['zh', 'en'],
  routing: { prefixDefaultLocale: false },
  domains: {
    en: 'https://en.example.com',
  },
},
```

`getAbsoluteLocaleUrl('en', 'about')` → `https://en.example.com/about`（不带 `/en/` 前缀）。

## Middleware 进阶

### 多 middleware 串行

```ts
// src/middleware.ts
import { defineMiddleware, sequence } from 'astro:middleware';

const auth = defineMiddleware(async (context, next) => {
  const token = context.cookies.get('session')?.value;
  context.locals.user = token ? await verify(token) : null;
  return next();
});

const cors = defineMiddleware(async (context, next) => {
  const response = await next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  return response;
});

const logger = defineMiddleware(async (context, next) => {
  const start = Date.now();
  const response = await next();
  console.log(`${context.url.pathname} ${Date.now() - start}ms`);
  return response;
});

export const onRequest = sequence(logger, auth, cors);
```

### Rewrite（不跳转）

```ts
export const onRequest = defineMiddleware(async (context, next) => {
  if (context.url.pathname === '/legacy') {
    return context.rewrite('/new');     // URL 仍是 /legacy，但内容是 /new 的
  }
  return next();
});
```

### Locals 类型扩展

```ts
// src/env.d.ts
declare namespace App {
  interface Locals {
    user: { id: string; name: string } | null;
    requestId: string;
  }
}
```

### Error 处理

```ts
export const onRequest = defineMiddleware(async (context, next) => {
  try {
    return await next();
  } catch (err) {
    console.error('Middleware caught:', err);
    return new Response('Internal Error', { status: 500 });
  }
});
```

### 在 endpoint / action 里读 locals

```ts
// src/pages/api/profile.ts
export const GET: APIRoute = ({ locals }) => {
  if (!locals.user) return new Response('Unauthorized', { status: 401 });
  return Response.json({ user: locals.user });
};
```

```ts
// src/actions/index.ts
defineAction({
  handler: async (input, context) => {
    const userId = context.locals.user?.id;
    // ...
  },
});
```

## Streaming + Server Islands 协议

Astro SSR 默认按 chunk 流式发送 HTML：

1. 主壳 HTML 立即发出（含 `<Suspense>` 等待区）
2. fallback HTML 占位
3. `<script>` 占位会去拉 server island 内容（带加密 props）
4. island HTML 替换占位

整个过程对 CDN 友好：主壳可缓存。

### 实战：用户主页

```astro
---
// src/pages/index.astro
import Layout from '../layouts/Base.astro';
import HeroPromo from '../components/HeroPromo.astro';
import RecommendedPosts from '../components/RecommendedPosts.astro';
import UserDashboard from '../components/UserDashboard.astro';
---

<Layout title="主页">
  <!-- 静态主壳：CDN 缓存几小时 -->
  <h1>欢迎来到 ACME</h1>
  <HeroPromo />

  <!-- 个性化推荐：每次请求都重算，但不阻塞主壳 -->
  <UserDashboard server:defer>
    <div slot="fallback" class="skeleton">加载中…</div>
  </UserDashboard>

  <!-- 推荐文章：30 分钟缓存 -->
  <RecommendedPosts server:defer>
    <div slot="fallback">…</div>
  </RecommendedPosts>
</Layout>
```

> 主壳 + fallback HTML 几十毫秒就回；server island 异步追加，用户感知 TTFB 极短。

## 多框架混用

同一页可以 import 任意几个框架的组件：

```bash
npx astro add react svelte vue solid preact
```

`astro.config.mjs` 自动配：

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import svelte from '@astrojs/svelte';
import vue from '@astrojs/vue';
import solid from '@astrojs/solid-js';
import preact from '@astrojs/preact';

export default defineConfig({
  integrations: [
    react({ include: ['**/react/*'] }),         // 只在子目录用
    preact({ include: ['**/preact/*'] }),
    svelte(),
    vue(),
    solid({ include: ['**/solid/*'] }),
  ],
});
```

> React 和 Preact 同时启用时**必须**用 `include` / `exclude` 隔开，否则 Astro 不知道某个 `.tsx` 用哪个。

```astro
---
import ReactCounter from '../components/react/Counter.tsx';
import SvelteToggle from '../components/Toggle.svelte';
import VueSearch from '../components/Search.vue';
import SolidChart from '../components/solid/Chart.tsx';
---

<ReactCounter client:load />
<SvelteToggle client:visible />
<VueSearch client:idle />
<SolidChart client:visible />
```

### 嵌套规则

| 父 | 子 | 行为 |
|---|---|---|
| `.astro` | `.astro` | ✅ 正常嵌套 |
| `.astro` | framework component | ✅ 可加 `client:*` 让子 hydrate |
| framework component | `.astro` | ❌ 不支持（除非通过 slot 透传） |
| framework component | 同框架 component | ✅ 正常嵌套 |
| framework component | 不同框架 component | ❌ 不支持 |

### Slot 透传（让 `.astro` 内容塞进 framework component）

`.astro` 父 → framework 子，子的 children 是 `.astro` 渲染的 HTML：

```tsx
// Card.tsx
export default function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}
```

```astro
---
import Card from './Card.tsx';
---

<Card client:load>
  <h2>这是 Astro 渲染的 HTML</h2>
  <p>会作为 children 传给 React Card</p>
</Card>
```

> 注意：`Card` 是 React，它收到的 `children` 是 server 端渲染好的静态 HTML，不能再用 `React.Children.map` 拿到原始 React 元素。

### Named slot 在 framework component 中

```tsx
// Layout.tsx
export default function Layout({
  children,
  header,
  footer,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div>
      <header>{header}</header>
      <main>{children}</main>
      <footer>{footer}</footer>
    </div>
  );
}
```

```astro
<Layout client:load>
  <h2 slot="header">头部</h2>
  <p>主体</p>
  <p slot="footer">© 2026</p>
</Layout>
```

Astro 把 `slot="header"` / `slot="footer"` 自动映射为 props（`header` / `footer`）。

## RSS

```bash
npm install @astrojs/rss
```

```ts
// src/pages/rss.xml.ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('blog');
  return rss({
    title: 'My Blog',
    description: '...',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.id}/`,
    })),
  });
}
```

访问 `/rss.xml`。

## Sitemap

```bash
npx astro add sitemap
```

```js
// astro.config.mjs
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://example.com',
  integrations: [sitemap()],
});
```

构建产物：`dist/sitemap-index.xml` + `dist/sitemap-0.xml`。

## Markdown / MDX 高级

### `@astrojs/mdx`

```bash
npx astro add mdx
```

MDX 可在 markdown 里用 React/Vue/Svelte 组件：

```mdx
---
title: 我的 MDX 文章
---

import Counter from '../components/Counter.tsx';

# 标题

<Counter client:load />

正文 markdown……
```

### 配置 Shiki / Prism

```js
// astro.config.mjs
export default defineConfig({
  markdown: {
    syntaxHighlight: 'shiki',      // 默认；也可 'prism' / false
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      langs: ['ts', 'js', 'astro', 'svelte', 'vue'],
      wrap: true,
    },
  },
});
```

### Remark / Rehype 插件

```js
import remarkToc from 'remark-toc';
import rehypeAccessibleEmojis from 'rehype-accessible-emojis';

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkToc],
    rehypePlugins: [rehypeAccessibleEmojis],
  },
});
```

## 部署详解

### Static（任意 CDN）

```bash
npm run build
# dist/ 含所有 .html / .js / .css，直传 CDN
```

部署到：

- **Vercel / Netlify / Cloudflare Pages**：连 Git 自动构建（默认探测 Astro）
- **GitHub Pages**：用 `actions/checkout@v4` + `withastro/action`
- **S3 / R2 / 阿里 OSS**：`aws s3 sync dist/ s3://my-bucket/`
- **Docker**：拷 `dist/` 进 nginx 镜像

### Node Standalone

```bash
npx astro add node
```

```js
adapter: node({ mode: 'standalone' })
```

```bash
npm run build
node ./dist/server/entry.mjs        # 默认 :4321
HOST=0.0.0.0 PORT=8080 node ./dist/server/entry.mjs
```

Dockerfile：

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 8080
CMD ["node", "./dist/server/entry.mjs"]
```

### Vercel

```bash
npx astro add vercel
```

```js
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',
  adapter: vercel({
    webAnalytics: { enabled: true },
    imageService: true,                    // 用 Vercel image service
  }),
});
```

`git push` → Vercel 自动构建部署。Image / Server Islands / Edge 都开箱可用。

### Cloudflare Workers

```bash
npx astro add cloudflare
```

```js
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: { enabled: true },     // dev 时连本地 KV / D1 / R2
  }),
});
```

```bash
npm run build
npx wrangler deploy
```

> Cloudflare runtime 不是 Node，是 Workers（V8 isolate）。某些 Node API 不可用，要检查兼容性（`nodejs_compat` flag）。

### Netlify

```bash
npx astro add netlify
```

```js
import netlify from '@astrojs/netlify';

export default defineConfig({
  output: 'server',
  adapter: netlify({
    edgeMiddleware: true,                  // 中间件跑 Edge
  }),
});
```

## TypeScript 配置

```json
// tsconfig.json
{
  "extends": "astro/tsconfigs/strict",     // base / strict / strictest 三档
  "include": ["src/**/*", ".astro/types.d.ts", "astro.config.mjs"],
  "exclude": ["dist"]
}
```

`.astro` 文件的类型由编译器 + `astro check` 提供：

```bash
npm install -D @astrojs/check typescript
npx astro check
```

CI / pre-commit 跑 `astro check`，确保 `.astro` 模板 / Content schema / actions 都过 TS。

## Vite 配置覆盖

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  vite: {
    plugins: [/* vite plugins */],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    optimizeDeps: {
      exclude: ['some-package'],
    },
    ssr: {
      noExternal: ['some-esm-only-pkg'],
    },
  },
});
```

> Astro 用 Vite 6（5.x），Astro 6 升 Vite 7；自定义 Vite 插件接口完全兼容。

## 性能优化

- 默认 0 JS：避免给 `.astro` 文件加 `client:*`
- 用 `<Image />` / `<Picture />` 而不是 `<img>`
- 滚到视口才 hydrate：优先 `client:visible` > `client:idle` > `client:load`
- 静态内容用 `prerender = true`，CDN 缓存
- 动态内容用 `server:defer`，主壳照样可缓存
- `<style>` 默认 scoped + 自动 critical CSS inline
- 多页用 `<ClientRouter />`：跨页保持 KeepAlive，preload 提速

## 下一步

- vs Next.js / SvelteKit / Nuxt 对比、Astro 5 → 6 升级、常见踩坑 见 [指南 - 其他](./other.md)
- 全部文件约定 / `Astro` 全局对象 / 配置 / 指令速查 见 [参考](../reference.md)
