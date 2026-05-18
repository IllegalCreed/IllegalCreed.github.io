---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Astro 5.x（最新稳定 5.13+）+ Vite 6 + Node 18.20+ / 20.3+ / 22+ 编写

## 速查

- 系统要求：Node.js **18.20.8+** / **20.3.0+** / **22.0.0+**（Astro 5），奇数版本（19/21/23）不支持；TypeScript 5+；Vite 6+
- 创建：`npm create astro@latest`（官方 CLI，交互选模板 / TS / 集成）
- 启动：`npm run dev`（默认 `http://localhost:4321`，Vite HMR）
- 入口：`src/pages/index.astro`（首页）+ `astro.config.mjs`（配置）+ `tsconfig.json`（继承 `astro/tsconfigs/base`）
- 文件路由：`src/pages/about.astro` → `/about`；`src/pages/blog/[slug].astro` → `/blog/:slug`
- `.astro` 文件结构：
  - **frontmatter**（`---` 包裹）—— 服务端 JS / TS，仅在构建/请求时执行
  - **template**（HTML + `{ expr }`）—— 输出 HTML
  - **`<style>`** —— 默认 scoped
  - **`<script>`** —— 默认 ES module，自动 bundle，仅在浏览器执行
- 渲染指令：`client:load` / `client:idle` / `client:visible` / `client:media` / `client:only="<framework>"` / `server:defer`
- 集成：`npx astro add react vue svelte solid mdx tailwind sitemap partytown ...`
- Adapter：`@astrojs/node` / `@astrojs/vercel` / `@astrojs/netlify` / `@astrojs/cloudflare`

## 安装与首次启动

最快路径（官方脚手架）：

```bash
# 推荐方式
npm create astro@latest

# pnpm / yarn / bun
pnpm create astro@latest
yarn create astro
bun create astro@latest
```

交互式提问：

```text
 dir   Where should we create your new project?
       ./my-astro-site

 tmpl  How would you like to start your new project?
       ◉ Use blog template
       ◯ Include sample files
       ◯ Empty
       ◯ Use template from GitHub

 ts    Do you plan to write TypeScript?
       Yes

 use   How strict should TypeScript be?
       Strict

 deps  Install dependencies?
       Yes

 git   Initialize a new git repository?
       Yes
```

接着：

```bash
cd my-astro-site
npm run dev
```

打开 `http://localhost:4321` 即看默认页。**Vite HMR** 默认开启。

> Astro 5 改名 `create-astro` → 仍是 `npm create astro@latest`，不再有 `create-astro` 单独 npm 包。

### 安装时直接加集成（`--add`）

```bash
npm create astro@latest -- --add react --add tailwind --add sitemap
```

### 用 GitHub 模板

```bash
# 官方 example（在 withastro/astro 的 examples 目录）
npm create astro@latest -- --template blog

# 第三方模板（任意 GitHub 仓库）
npm create astro@latest -- --template username/repo
```

> 官方 examples 列表：[github.com/withastro/astro/tree/main/examples](https://github.com/withastro/astro/tree/main/examples)

### Node 版本

Astro 5 最低支持：

- **Node 18.20.8+**（18 LTS 最后一档）
- **Node 20.3.0+**
- **Node 22.0.0+**（推荐）

```bash
# 用 nvm 安装 22 LTS
nvm install 22
nvm use 22
node -v   # v22.x.x
```

> Astro 6（2025.10）已升 Node 22.12+；如果用 Astro 6，请用 `nvm install --lts`。

### 手动安装

```bash
mkdir my-astro-site && cd my-astro-site
npm init --yes
npm install astro
```

补 `package.json` scripts：

```json
{
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro"
  }
}
```

建最小 `astro.config.mjs` / `tsconfig.json` / `src/pages/index.astro`：

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({});
```

```json
// tsconfig.json
{
  "extends": "astro/tsconfigs/strict"
}
```

```astro
---
// src/pages/index.astro
---
<!DOCTYPE html>
<html lang="zh">
  <head>
    <meta charset="utf-8" />
    <title>Astro</title>
  </head>
  <body>
    <h1>Hello Astro</h1>
  </body>
</html>
```

跑 `npm run dev` 即可。

## 项目结构

`npm create astro@latest` 选 minimal 模板生成：

```
my-astro-site/
├── public/                       # 静态资源（按原样拷贝到 dist/）
│   └── favicon.svg
├── src/
│   ├── components/               # 公共组件（.astro / .tsx / .vue / .svelte 都可）
│   ├── content/                  # Markdown / MDX 内容（配合 Content Collections）
│   ├── content.config.ts         # Content Layer 配置（Astro 5+）
│   ├── layouts/                  # 布局组件
│   ├── pages/                    # 文件路由（核心）
│   │   ├── index.astro           # /
│   │   └── about.astro           # /about
│   ├── styles/                   # 全局样式（可选）
│   ├── env.d.ts                  # TS 类型补丁（含 astro/client 引用）
│   └── middleware.ts             # 中间件（可选）
├── astro.config.mjs              # 配置文件
├── tsconfig.json
├── package.json                  # 必须 "type": "module"
└── node_modules/
```

> `src/pages/` 和 `astro.config.mjs` 是仅有的两个**必需**位置。其余目录都是约定俗成，可任意改名 / 取消（`src/components` / `src/layouts` 等）。

### 关键文件

**`src/pages/index.astro`** —— `/` 路由的页面组件：

```astro
---
const greeting = 'Hello';
const name = 'Astro';
---

<!DOCTYPE html>
<html lang="zh">
  <head>
    <meta charset="utf-8" />
    <title>{name}</title>
  </head>
  <body>
    <h1>{greeting}, {name}!</h1>
  </body>
</html>
```

**`astro.config.mjs`** —— 核心配置：

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://example.com',
  integrations: [react()],
  output: 'static',                       // 默认；也可 'server'
  // adapter: node({ mode: 'standalone' }), // SSR 必填
});
```

**`tsconfig.json`** —— 继承官方推荐：

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": ["src/**/*", ".astro/types.d.ts", "astro.config.mjs"],
  "exclude": ["dist"]
}
```

三档：`base` / `strict` / `strictest`，可按团队偏好选。

**`src/env.d.ts`** —— TS 全局类型补丁：

```ts
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
```

> Astro 4.14+ 起，运行 `astro sync` 会自动生成 `.astro/types.d.ts`；`dev` / `build` 启动时也会自动同步。

### CLI 命令

```bash
astro dev              # 启动 dev server（默认 :4321）
astro build            # 构建生产产物到 dist/
astro preview          # 本地预览 dist/（仅静态）
astro check            # TS / Astro 类型检查（含 astro-check）
astro sync             # 重新生成 .astro/types.d.ts、Content Collection 类型
astro add <integration># 安装并自动配置集成（react / tailwind / mdx 等）
astro telemetry disable# 关闭遥测
```

## 第一个页面

`src/pages/index.astro` 对应 `/`：

```astro
---
// frontmatter（仅服务端执行）
const title = 'Hello Astro';
---

<html lang="zh">
  <head>
    <meta charset="utf-8" />
    <title>{title}</title>
  </head>
  <body>
    <h1>{title}</h1>
    <p>这是一个最小的 Astro 页面。</p>
  </body>
</html>
```

加 `/about`：

```astro
---
// src/pages/about.astro
---
<html lang="zh">
  <head><title>About</title></head>
  <body>
    <h1>About</h1>
    <a href="/">Home</a>
  </body>
</html>
```

跳转用**原生 `<a>`**：

```astro
<a href="/about">About</a>
```

> Astro 不提供 `<Link>` 组件。装了 `<ClientRouter />` 后，原生 `<a>` 自动走客户端路由（无 reload）；未装则就是普通 MPA 跳转。

## `.astro` 文件语法详解

`.astro` 文件三段式：**frontmatter** + **模板** + **样式 / 脚本**。

```astro
---
// === Frontmatter（服务端执行）===
import Layout from '../layouts/Base.astro';
import Card from '../components/Card.astro';

// 可以 fetch、读文件、调数据库
const res = await fetch('https://api.example.com/posts');
const posts = await res.json();

// Props 接收（容后说）
const { title } = Astro.props;
---

<!-- === 模板（HTML + 表达式）=== -->
<Layout title={title}>
  <h1>{title}</h1>
  <ul>
    {posts.map((p) => <li><Card post={p} /></li>)}
  </ul>
</Layout>

<!-- === Scoped 样式（默认）=== -->
<style>
  h1 {
    color: rebeccapurple;
  }
</style>

<!-- === 客户端脚本（默认 ESM bundle）=== -->
<script>
  console.log('Runs in browser');
</script>
```

要点：

- frontmatter 只在 **服务端**（构建期或请求期）执行，**不进浏览器**
- frontmatter 可以用 `await`（顶层 await）
- 模板里 `{ expr }` 是 JS 表达式
- `<style>` 默认 **scoped**（Astro 编译器自动加 `data-astro-cid-xxx` 属性）
- `<script>` 默认 **ES module + bundle**，仅浏览器执行（不能访问 frontmatter 变量，要传值用 `define:vars` 指令）

### 表达式与控制流

```astro
---
const items = ['Apple', 'Banana', 'Cherry'];
const show = true;
const user = { name: 'Alice', age: 30 };
---

<!-- 简单插值 -->
<p>Hello, {user.name}</p>

<!-- 三元 / 短路 -->
<p>{user.age > 18 ? '成年' : '未成年'}</p>
{show && <p>Visible</p>}

<!-- 循环（用 .map 而不是 for）-->
<ul>
  {items.map((item) => <li>{item}</li>)}
</ul>

<!-- 条件渲染 -->
{user.age >= 18 ? <strong>成年</strong> : <em>未成年</em>}

<!-- 多行 / Fragment -->
{items.length > 0 ? (
  <ul>
    {items.map((item) => <li>{item}</li>)}
  </ul>
) : (
  <p>暂无数据</p>
)}
```

> Astro 模板基于 JSX-like 语法（但更接近原生 HTML：`class` 而不是 `className`，`for` 而不是 `htmlFor`）。

### Props（组件参数）

```astro
---
// src/components/Greet.astro
interface Props {
  name: string;
  age?: number;
}

const { name, age = 18 } = Astro.props;
---

<p>Hello, {name} ({age})</p>
```

使用：

```astro
---
import Greet from './Greet.astro';
---

<Greet name="Alice" age={30} />
<Greet name="Bob" />            <!-- age 用默认值 18 -->
```

### Slots（插槽）

默认 slot + 命名 slot：

```astro
---
// src/components/Card.astro
---

<div class="card">
  <header><slot name="header" /></header>
  <main><slot /></main>
  <footer><slot name="footer">© 默认页脚</slot></footer>
</div>
```

使用：

```astro
<Card>
  <h2 slot="header">标题</h2>
  <p>内容</p>
  <p slot="footer">自定义页脚</p>
</Card>
```

slot fallback（默认内容）：

```astro
<slot>这里是默认内容（无传入时显示）</slot>
```

## 第一个 Layout

布局是普通 `.astro` 组件，用 slot 承接子内容：

```astro
---
// src/layouts/Base.astro
interface Props {
  title: string;
}

const { title } = Astro.props;
---

<!DOCTYPE html>
<html lang="zh">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
  </head>
  <body>
    <header>
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
      </nav>
    </header>

    <main>
      <slot />
    </main>

    <footer>© 2026</footer>
  </body>
</html>
```

使用：

```astro
---
// src/pages/index.astro
import Base from '../layouts/Base.astro';
---

<Base title="首页">
  <h1>Hello Astro</h1>
  <p>用 Layout 包页面。</p>
</Base>
```

## 动态路由

文件名用方括号 `[param]` 即动态段：

```
src/pages/
├── blog/
│   ├── index.astro                # /blog
│   └── [slug].astro               # /blog/:slug
└── shop/
    └── [...path].astro            # /shop/* catch-all
```

静态构建（`output: 'static'`）需要 `getStaticPaths()` 告诉 Astro 要生成哪些 URL：

```astro
---
// src/pages/blog/[slug].astro
export async function getStaticPaths() {
  const posts = await fetch('https://api.example.com/posts').then((r) => r.json());

  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post },           // 可选：传 props 给页面
  }));
}

const { post } = Astro.props;
---

<article>
  <h1>{post.title}</h1>
  <p>{post.body}</p>
</article>
```

服务端模式（`output: 'server'` 或单页 `prerender = false`）不需要 `getStaticPaths`，`Astro.params` 直接拿运行时参数：

```astro
---
// src/pages/blog/[slug].astro
export const prerender = false;

const { slug } = Astro.params;
const post = await fetch(`/api/posts/${slug}`).then((r) => r.json());
---

<article>
  <h1>{post.title}</h1>
</article>
```

## 第一个 Island（互动组件）

`.astro` 文件默认不进 JS。要做"按钮点击改文本"这类交互，要么写 client `<script>`，要么用 framework component + `client:*`。

### 用原生 `<script>`

```astro
---
// src/pages/counter.astro
---

<button id="btn">Count: <span id="n">0</span></button>

<script>
  const btn = document.getElementById('btn')!;
  const n = document.getElementById('n')!;
  let count = 0;
  btn.addEventListener('click', () => {
    n.textContent = String(++count);
  });
</script>
```

### 用 React Island

先装 React 集成：

```bash
npx astro add react
```

`astro.config.mjs` 自动加：

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
});
```

写 React 组件：

```tsx
// src/components/Counter.tsx
import { useState } from 'react';

export default function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>Count: {n}</button>;
}
```

在 `.astro` 里用，**必须**加 `client:*`：

```astro
---
// src/pages/counter.astro
import Counter from '../components/Counter.tsx';
---

<h1>Counter</h1>
<Counter client:load />           <!-- 立即 hydrate -->
<Counter client:idle />           <!-- 浏览器空闲后 hydrate -->
<Counter client:visible />        <!-- 进入视口后 hydrate -->
```

> 不加 `client:*` 的 framework component 会被服务端渲染成 HTML，但**没有 JS**（变成静态卡片）。

### 多框架混用

同一页可以同时用 React + Svelte + Vue：

```bash
npx astro add react svelte vue
```

```astro
---
import ReactCounter from '../components/Counter.tsx';
import SvelteToggle from '../components/Toggle.svelte';
import VueSearch from '../components/Search.vue';
---

<ReactCounter client:load />
<SvelteToggle client:idle />
<VueSearch client:visible />
```

> 每个 island **完全独立**（自己的 React/Svelte/Vue 实例）；想跨 island 共享状态用 [Nano Stores](https://github.com/nanostores/nanostores)。

## Content Collections（内容集合）

Astro 5 引入 Content Layer API，统一处理 Markdown / MDX / JSON / YAML / 远程 API 内容。

### 配置 `src/content.config.ts`

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  // Content Layer：loader 决定数据从哪来
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),

  // Zod schema 校验 frontmatter
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog };
```

### 写 Markdown

```md
---
title: 我的第一篇博客
pubDate: 2026-05-18
description: 用 Astro 写博客
tags: [astro, web]
---

# 我的第一篇博客

Markdown 内容……
```

文件路径：`src/content/blog/my-first-post.md`

### 列出 + 渲染

```astro
---
// src/pages/blog/index.astro
import { getCollection } from 'astro:content';

const posts = await getCollection('blog');
posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
---

<h1>Blog</h1>
<ul>
  {posts.map((post) => (
    <li>
      <a href={`/blog/${post.id}`}>{post.data.title}</a>
      <small>{post.data.pubDate.toLocaleDateString()}</small>
    </li>
  ))}
</ul>
```

```astro
---
// src/pages/blog/[id].astro
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { id: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);
---

<article>
  <h1>{post.data.title}</h1>
  <time>{post.data.pubDate.toLocaleDateString()}</time>
  <Content />
</article>
```

> Astro 5 的 `render(entry)` 是**独立函数**（从 `astro:content` 导入），不再是 entry 上的方法（`entry.render()` 在 5.x deprecated、6.x 移除）。

## 集成（Integrations）

`astro add` 一键安装并改 config：

```bash
# UI 框架
npx astro add react preact vue svelte solid alpinejs

# 内容 / 渲染
npx astro add mdx markdoc

# 工具
npx astro add tailwind sitemap partytown

# DB
npx astro add db

# Adapter（SSR）
npx astro add node vercel netlify cloudflare
```

也可以一行装多个：

```bash
npx astro add react tailwind mdx sitemap
```

完整列表见 [Astro Integrations Directory](https://astro.build/integrations/)（官方 + 社区，800+ 个）。

## 第一个 API 端点

Astro 把 `src/pages/` 下的 `.ts` / `.js` 文件视为端点（**不是**页面）：

```ts
// src/pages/api/hello.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  return new Response(
    JSON.stringify({ message: 'Hello' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  return new Response(JSON.stringify({ received: body }), { status: 201 });
};
```

访问 `/api/hello` 即得 JSON。

> 默认（`output: 'static'`）下，端点只在构建期跑一次（生成静态 JSON 文件）。要按请求跑，加 `export const prerender = false` 或全局 `output: 'server'`。

带动态段：

```ts
// src/pages/api/users/[id].ts
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const user = await db.user.findUnique({ where: { id: params.id } });
  if (!user) return new Response('Not Found', { status: 404 });
  return Response.json(user);
};
```

## 部署

### Static 站（默认）

```bash
npm run build           # 输出 dist/
```

`dist/` 是纯静态文件，丢任意 CDN / S3 / Cloudflare Pages / Netlify / Vercel 都行。

### SSR 部署

装 adapter：

```bash
npx astro add node       # Node.js 自托管
npx astro add vercel     # Vercel
npx astro add netlify    # Netlify
npx astro add cloudflare # Cloudflare Workers / Pages
```

`astro.config.mjs` 自动补：

```js
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
});
```

```bash
npm run build
node ./dist/server/entry.mjs   # Node standalone 模式
```

详见 [指南 - 高级](./guide-line/expert.md) 的部署章节。

## 一份能跑的最小示例

```
my-astro-site/
├── src/
│   ├── components/
│   │   └── Counter.tsx
│   ├── content/
│   │   └── blog/
│   │       ├── first-post.md
│   │       └── second-post.md
│   ├── content.config.ts
│   ├── layouts/
│   │   └── Base.astro
│   └── pages/
│       ├── index.astro
│       ├── about.astro
│       ├── blog/
│       │   ├── index.astro
│       │   └── [id].astro
│       └── api/
│           └── hello.ts
├── astro.config.mjs
├── tsconfig.json
└── package.json
```

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
});
```

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const collections = {
  blog: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
    schema: z.object({
      title: z.string(),
      pubDate: z.coerce.date(),
    }),
  }),
};
```

```astro
---
// src/layouts/Base.astro
const { title } = Astro.props;
---

<html lang="zh">
  <head><title>{title}</title></head>
  <body>
    <nav>
      <a href="/">Home</a> | <a href="/about">About</a> | <a href="/blog">Blog</a>
    </nav>
    <slot />
  </body>
</html>
```

```astro
---
// src/pages/index.astro
import Base from '../layouts/Base.astro';
import Counter from '../components/Counter.tsx';
---

<Base title="首页">
  <h1>Hello Astro</h1>
  <Counter client:load />
</Base>
```

```astro
---
// src/pages/blog/index.astro
import Base from '../../layouts/Base.astro';
import { getCollection } from 'astro:content';

const posts = await getCollection('blog');
---

<Base title="Blog">
  <h1>Blog</h1>
  <ul>
    {posts.map((p) => (
      <li><a href={`/blog/${p.id}`}>{p.data.title}</a></li>
    ))}
  </ul>
</Base>
```

```astro
---
// src/pages/blog/[id].astro
import Base from '../../layouts/Base.astro';
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({ params: { id: post.id }, props: { post } }));
}

const { post } = Astro.props;
const { Content } = await render(post);
---

<Base title={post.data.title}>
  <article>
    <h1>{post.data.title}</h1>
    <Content />
  </article>
</Base>
```

```tsx
// src/components/Counter.tsx
import { useState } from 'react';

export default function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>Count: {n}</button>;
}
```

`npm run dev` 打开 `http://localhost:4321` 即看完整 App。

## 下一步

- `.astro` 完整语法 / Islands / 客户端指令 / 文件路由 / Layouts / 端点 见 [指南 - 基础](./guide-line/base.md)
- SSR / On-demand / Server Islands / Actions / View Transitions / Image / Adapter 见 [指南 - 进阶](./guide-line/advanced.md)
- Content Layer 深度 / DB / i18n / Streaming / Middleware / 多框架混用 / 部署模式 见 [指南 - 高级](./guide-line/expert.md)
- vs Next.js / Nuxt / SvelteKit / Astro 5 → 6 升级 / 常见踩坑 见 [指南 - 其他](./guide-line/other.md)
- 全部文件约定 / `Astro` 全局对象 / 配置 / 指令速查 见 [参考](./reference.md)
