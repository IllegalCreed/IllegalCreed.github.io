---
layout: doc
outline: [2, 3]
---

# 指南 - 基础

> Astro 核心思想：Islands Architecture、`.astro` 模板、客户端指令、文件路由、Layout、端点

## 速查

- **Islands Architecture**：默认 0 JS，只有显式 `client:*` / `server:defer` 的组件才会送 JS
- **`.astro` 文件**：`---` frontmatter（服务端 JS / TS）+ HTML 模板 + 可选 `<style>` / `<script>`
- **Client 指令**：
  - `client:load` —— 页面加载后立即 hydrate
  - `client:idle` —— `requestIdleCallback` 后 hydrate
  - `client:visible` —— IntersectionObserver 进入视口后 hydrate
  - `client:media="(min-width: 768px)"` —— 媒体查询匹配后 hydrate
  - `client:only="<framework>"` —— **跳过服务端渲染**，仅客户端 render（必须指定框架）
- **文件路由**：`src/pages/` 下 `.astro` / `.md` / `.mdx` / `.html` / `.ts` 即路由
- **动态段**：`[slug]` / `[...rest]`；静态构建需 `getStaticPaths`，server 模式直接读 `Astro.params`
- **Layout**：普通 `.astro` 组件 + `<slot />`；多层嵌套用 named slot
- **端点（API Route）**：`src/pages/api/foo.ts` 导出 `GET` / `POST` / ...
- **Props**：`const { name } = Astro.props`；类型用 `interface Props`
- **Slot**：`<slot />` 默认，`<slot name="x" />` 命名

## Islands Architecture

Astro 的核心范式：**默认 0 JavaScript**，只有显式标注的"岛屿"才送 JS。

### Client Islands

```astro
---
import ReactCounter from '../components/Counter.tsx';
---

<!-- 默认：服务端渲染成 HTML，不送 JS（静态）-->
<ReactCounter />

<!-- 标 client:* 后变成 client island -->
<ReactCounter client:load />
```

每个 island 是**独立 React/Vue/Svelte 实例**：

```astro
---
import A from '../components/A.tsx';
import B from '../components/B.tsx';
---

<A client:load />
<B client:load />
<!-- A 和 B 是两个独立 React app，state 互不共享 -->
```

要跨 island 共享状态，用 [Nano Stores](https://github.com/nanostores/nanostores)（Astro 官方推荐）：

```ts
// src/store/cart.ts
import { atom } from 'nanostores';

export const cart = atom<string[]>([]);
```

```tsx
// src/components/AddButton.tsx
import { cart } from '../store/cart';

export default function AddButton({ id }: { id: string }) {
  return (
    <button onClick={() => cart.set([...cart.get(), id])}>
      Add
    </button>
  );
}
```

```tsx
// src/components/CartIcon.tsx
import { useStore } from '@nanostores/react';
import { cart } from '../store/cart';

export default function CartIcon() {
  const items = useStore(cart);
  return <span>Cart ({items.length})</span>;
}
```

```astro
<AddButton id="p1" client:load />
<CartIcon client:load />
<!-- 两个 island 通过 nanostores 共享状态 -->
```

### Server Islands

`server:defer` 让组件延后到服务端按需渲染：

```astro
---
import Avatar from '../components/Avatar.astro';
import GenericAvatar from '../components/GenericAvatar.astro';
---

<Avatar server:defer>
  <GenericAvatar slot="fallback" />     <!-- 主壳里先显示 fallback -->
</Avatar>
```

详见 [指南 - 进阶](./advanced.md) 的 Server Islands 章节。

## 客户端指令全表

| 指令 | 何时 hydrate | 何时用 |
|---|---|---|
| `client:load` | 页面加载后立即 | 关键交互（导航 / 表单 / 头部 CTA） |
| `client:idle` | `requestIdleCallback` 后（兜底 200ms） | 次要交互、聊天 widget |
| `client:visible` | IntersectionObserver 进入视口 | 长页底部组件、carousel |
| `client:media` | 媒体查询匹配 | 仅桌面端的工具栏、仅移动端的抽屉 |
| `client:only="react"` | **跳过 SSR**，仅客户端 render | 用了 `window` / `document` / 第三方 only-client 库 |

代码示例：

```astro
<!-- 立即 hydrate -->
<Counter client:load />

<!-- 空闲 hydrate -->
<NewsletterPopup client:idle />

<!-- 视口可见才 hydrate（懒加载关键）-->
<Comments client:visible />

<!-- 桌面端才 hydrate -->
<DesktopSidebar client:media="(min-width: 1024px)" />

<!-- 仅客户端（不 SSR）-->
<MapWidget client:only="react" />
```

### `client:only` 的细节

```astro
<!-- 必须指定框架，Astro 编译时不知道 MapWidget 用哪个框架 -->
<MapWidget client:only="react" />
<MapWidget client:only="vue" />
<MapWidget client:only="svelte" />
<MapWidget client:only="solid-js" />
<MapWidget client:only="preact" />
```

不指定会报错。

### `transition:` 指令（配合 View Transitions）

```astro
<!-- 跨页元素同 transition:name 自动产生 morph 动画 -->
<img src="/hero.jpg" transition:name="hero" />

<!-- 自定义动画 -->
<div transition:animate="slide">...</div>

<!-- 持久化（导航时不重新创建 / 重新执行）-->
<audio transition:persist src="/podcast.mp3" controls></audio>
```

详见 [指南 - 进阶](./advanced.md) 的 View Transitions 章节。

## `.astro` 文件深入

### Frontmatter（组件脚本）

`---` 之间的代码是**服务端**执行：

```astro
---
// 完整 ES module，可用 import / 顶层 await
import Layout from '../layouts/Base.astro';
import { getCollection } from 'astro:content';

// 顶层 await
const posts = await getCollection('blog');

// 读环境变量
const apiUrl = import.meta.env.PUBLIC_API_URL;

// 接 props
const { title, description } = Astro.props;
---

<Layout title={title}>
  <h1>{title}</h1>
  <p>{description}</p>
  <ul>
    {posts.map((post) => (
      <li>{post.data.title}</li>
    ))}
  </ul>
</Layout>
```

> Frontmatter 是 ES module 上下文：可以 `import` / `export` / 顶层 `await`，但**不能**用 React hooks / Vue Composition API。

### Astro.props 与类型

```astro
---
// src/components/Card.astro
interface Props {
  title: string;
  description?: string;
  variant?: 'primary' | 'secondary';
}

const {
  title,
  description = '默认描述',
  variant = 'primary',
} = Astro.props;
---

<div class={`card card--${variant}`}>
  <h3>{title}</h3>
  <p>{description}</p>
</div>
```

> `interface Props` 是 Astro 的约定，由编译器读取生成调用方类型提示。

### Slot 与 named slot

```astro
---
// src/components/Layout.astro
---

<html>
  <head>
    <slot name="head" />
  </head>
  <body>
    <header>
      <slot name="header">默认 header</slot>     <!-- fallback -->
    </header>
    <main>
      <slot />                                    <!-- 默认 slot -->
    </main>
    <footer>
      <slot name="footer" />
    </footer>
  </body>
</html>
```

调用：

```astro
<Layout>
  <meta slot="head" name="description" content="Hello" />
  <nav slot="header">导航条</nav>

  <h1>主内容</h1>
  <p>放在默认 slot</p>

  <p slot="footer">© 2026</p>
</Layout>
```

### Slot transfer（slot 透传）

把当前组件接到的 slot 透传给嵌套组件：

```astro
---
// src/layouts/Page.astro
import Base from './Base.astro';
const { title } = Astro.props;
---

<Base title={title}>
  <!-- 把外部传来的 head slot 透传给 Base 的 head slot -->
  <slot name="head" slot="head" />

  <article>
    <slot />
  </article>
</Base>
```

### Style：scoped + global

```astro
<!-- 默认 scoped：自动加 data-astro-cid 属性 -->
<style>
  h1 { color: red; }       /* 只影响本组件的 h1 */
</style>

<!-- 显式 global -->
<style is:global>
  body { margin: 0; }      /* 全局生效 */
</style>

<!-- SCSS / Less / Stylus -->
<style lang="scss">
  $primary: dodgerblue;
  h1 {
    color: $primary;
    &.large { font-size: 2rem; }
  }
</style>

<!-- :global() 选择器（部分穿透）-->
<style>
  article :global(p) { line-height: 1.6; }
  /* article 是 scoped，但内部 p 全局生效 */
</style>
```

### Script：默认 ESM bundle

```astro
<!-- 默认：作为 ES module 处理，自动 bundle / minify -->
<script>
  import { initCarousel } from '../scripts/carousel';
  initCarousel();
</script>

<!-- is:inline：保持原样不 bundle -->
<script is:inline>
  console.log('Inlined, not bundled');
</script>

<!-- define:vars：从 frontmatter 注入变量 -->
---
const userId = '123';
---
<script define:vars={{ userId }}>
  console.log('User:', userId);   // 编译时把 userId 字面量插入
</script>

<!-- 外链脚本 -->
<script src="/external.js" is:inline></script>
```

> Astro 5+ 起，多个 `<script>` 不再合并 bundle；按出现顺序逐个处理。

## 文件路由

`src/pages/` 下的文件 = URL：

```
src/pages/
├── index.astro                  # /
├── about.astro                  # /about
├── contact/
│   └── index.astro              # /contact
├── blog/
│   ├── index.astro              # /blog
│   └── [slug].astro             # /blog/:slug
├── shop/
│   └── [...path].astro          # /shop/* (catch-all)
└── api/
    └── posts.ts                 # /api/posts (端点)
```

### 支持的页面文件类型

| 扩展名 | 说明 |
|---|---|
| `.astro` | Astro 组件页面 |
| `.md` / `.mdx` / `.markdoc` | Markdown 页面（含 frontmatter `layout`） |
| `.html` | 静态 HTML |
| `.ts` / `.js` | 端点（API route） |

### 动态路由

```astro
---
// src/pages/blog/[slug].astro

// 静态模式（output: 'static'）必须 getStaticPaths
export async function getStaticPaths() {
  return [
    { params: { slug: 'first-post' }, props: { title: 'First' } },
    { params: { slug: 'second-post' }, props: { title: 'Second' } },
  ];
}

const { slug } = Astro.params;
const { title } = Astro.props;
---

<h1>{title} ({slug})</h1>
```

Server 模式：

```astro
---
// src/pages/blog/[slug].astro
export const prerender = false;   // 这个页面按需 SSR

const { slug } = Astro.params;
const post = await db.post.findUnique({ where: { slug } });
---

<h1>{post.title}</h1>
```

### Catch-all `[...rest]`

```astro
---
// src/pages/shop/[...path].astro
export async function getStaticPaths() {
  return [
    { params: { path: undefined } },              // /shop
    { params: { path: 'shoes' } },                // /shop/shoes
    { params: { path: 'shoes/men' } },            // /shop/shoes/men
  ];
}

const { path } = Astro.params;
---

<h1>Shop: {path ?? 'home'}</h1>
```

### Route 优先级

静态 > 动态命名 > catch-all：

```
src/pages/
├── blog/[slug].astro    # /blog/specific 优先
└── blog/[...path].astro # /blog/foo/bar/baz 兜底
```

### 重定向（配置）

```js
// astro.config.mjs
export default defineConfig({
  redirects: {
    '/old-blog/[slug]': '/blog/[slug]',           // 308 永久
    '/old-about': '/about',                       // 308
    '/temp': { status: 302, destination: '/' },   // 自定义状态码
  },
});
```

页面里也可以 redirect：

```astro
---
// src/pages/old.astro
return Astro.redirect('/new', 301);
---
```

### Rewrites（URL 不变，内容换）

```astro
---
// src/pages/region/[id].astro
const { id } = Astro.params;
if (id === 'us') {
  return Astro.rewrite('/region/north-america');
}
---
```

服务端、构建期都可用。

## Layout 模式

Layout 就是普通 `.astro` 组件，关键是用 `<slot />` 接子内容。

### 基础 Layout

```astro
---
// src/layouts/Base.astro
interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<!DOCTYPE html>
<html lang="zh">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
    <slot name="head" />
  </head>
  <body>
    <header>
      <a href="/">Logo</a>
      <nav>
        <a href="/blog">Blog</a>
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

<Base title="首页" description="欢迎">
  <link slot="head" rel="canonical" href="https://example.com" />

  <h1>Hello</h1>
  <p>主内容</p>
</Base>
```

### 嵌套 Layout

```astro
---
// src/layouts/BlogPost.astro
import Base from './Base.astro';

interface Props {
  title: string;
  pubDate: Date;
}

const { title, pubDate } = Astro.props;
---

<Base title={title}>
  <article>
    <header>
      <h1>{title}</h1>
      <time datetime={pubDate.toISOString()}>
        {pubDate.toLocaleDateString()}
      </time>
    </header>

    <slot />

    <footer>
      <a href="/blog">← 返回博客</a>
    </footer>
  </article>
</Base>
```

```astro
---
// src/pages/blog/hello.astro
import BlogPost from '../../layouts/BlogPost.astro';
---

<BlogPost title="Hello" pubDate={new Date('2026-05-18')}>
  <p>正文……</p>
</BlogPost>
```

### Markdown / MDX 用 `layout` frontmatter

```md
---
layout: ../../layouts/BlogPost.astro
title: 我的博客
pubDate: 2026-05-18
---

# 正文

Markdown 内容会自动塞进 layout 的默认 slot。
```

Layout 接收 frontmatter：

```astro
---
// BlogPost.astro
const { frontmatter } = Astro.props;
---

<h1>{frontmatter.title}</h1>
<time>{frontmatter.pubDate}</time>
<slot />
```

> 推荐：组织博客用 Content Collections（见 [指南 - 高级](./expert.md)），而不是直接在 `src/pages/` 下放 `.md` —— Collections 提供 Zod 校验 + 类型推断。

## 端点（API Route）

`src/pages/` 下的 `.ts` / `.js` 文件就是端点。

### 静态端点（构建期生成）

```ts
// src/pages/data.json.ts
export async function GET() {
  const data = { users: ['Alice', 'Bob'] };
  return new Response(JSON.stringify(data));
}
```

构建后产物：`dist/data.json`，直接当静态文件服务。

### 服务端端点（按需）

```ts
// src/pages/api/users.ts
import type { APIRoute } from 'astro';

export const prerender = false;   // 或全局 output: 'server'

export const GET: APIRoute = async ({ request, url }) => {
  const page = Number(url.searchParams.get('page') ?? 1);
  const users = await db.user.findMany({ skip: (page - 1) * 10, take: 10 });
  return Response.json(users);
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const created = await db.user.create({ data: body });
  return Response.json(created, { status: 201 });
};

export const DELETE: APIRoute = async ({ params, request }) => {
  // ...
  return new Response(null, { status: 204 });
};

// ALL: 捕获未声明的方法
export const ALL: APIRoute = () => {
  return new Response('Method Not Allowed', { status: 405 });
};
```

支持的方法：`GET` / `POST` / `PUT` / `PATCH` / `DELETE` / `OPTIONS` / `ALL`。
`HEAD` 不写时默认走 `GET`。

### 动态段

```ts
// src/pages/api/posts/[id].ts
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const post = await db.post.findUnique({ where: { id: params.id } });
  if (!post) return new Response('Not Found', { status: 404 });
  return Response.json(post);
};
```

### Context 对象

`APIRoute` 接收的 context 对象：

```ts
export const POST: APIRoute = async ({
  request,        // 标准 Request
  url,            // URL 对象
  params,         // 路由参数
  cookies,        // AstroCookies
  redirect,       // 重定向函数
  rewrite,        // 改写函数
  site,           // import.meta.env.SITE
  generator,      // Astro 版本
  preferredLocale,// 浏览器首选 locale
  locals,         // 中间件设置的 context（含 user / db 等）
  session,        // Astro.session（需启 sessions）
  clientAddress,  // 客户端 IP
}) => {
  // ...
  return Response.json({ ok: true });
};
```

## 中间件

`src/middleware.ts` 在每个 page / endpoint 请求前执行：

```ts
// src/middleware.ts
import { defineMiddleware, sequence } from 'astro:middleware';

const auth = defineMiddleware(async (context, next) => {
  // 从 cookie 读 session
  const token = context.cookies.get('session')?.value;

  if (token) {
    const user = await verifyToken(token);
    context.locals.user = user;    // 放进 locals
  }

  return next();   // 继续执行下一中间件 / 页面
});

const logger = defineMiddleware(async (context, next) => {
  const start = Date.now();
  const response = await next();
  console.log(`${context.request.method} ${context.url.pathname} ${Date.now() - start}ms`);
  return response;
});

// 多个中间件用 sequence 串
export const onRequest = sequence(logger, auth);
```

页面里读 locals：

```astro
---
// src/pages/dashboard.astro
const { user } = Astro.locals;
if (!user) return Astro.redirect('/login');
---

<h1>Hello {user.name}</h1>
```

TypeScript 扩展 locals 类型：

```ts
// src/env.d.ts
declare namespace App {
  interface Locals {
    user?: { id: string; name: string };
  }
}
```

> 中间件在静态页面**构建期**跑一次（不影响产物），在服务端页面**每次请求**跑。

### Rewrite in middleware

```ts
export const onRequest = defineMiddleware(async (context, next) => {
  if (context.url.pathname === '/old') {
    return context.rewrite('/new');   // URL 不变，跑 /new 的逻辑
  }
  return next();
});
```

## Cookies

`Astro.cookies` 在 `.astro` 文件、端点、中间件里都能用。

### 读

```astro
---
// src/pages/dashboard.astro
const token = Astro.cookies.get('session')?.value;
const has = Astro.cookies.has('session');
---
```

### 写

```ts
// src/pages/api/login.ts
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const { email, password } = await request.json();
  const user = await authenticate(email, password);

  cookies.set('session', user.token, {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,   // 7 天
  });

  return Response.json({ ok: true });
};
```

### 删除

```ts
cookies.delete('session', { path: '/' });
```

### TypeScript 类型化（5.4+）

```ts
// src/env.d.ts
declare namespace App {
  interface Cookies {
    session: { value: string };
  }
}
```

## 表单提交

Astro 没有 SvelteKit 那种"Form Actions"原生模型，常用方式：

### 1. 走端点

```astro
---
// src/pages/login.astro
export const prerender = false;
---

<form method="POST" action="/api/login">
  <input name="email" type="email" required />
  <input name="password" type="password" required />
  <button>登录</button>
</form>
```

```ts
// src/pages/api/login.ts
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const data = await request.formData();
  const email = data.get('email');
  const password = data.get('password');
  // 处理 + 设置 cookie ...
  return redirect('/dashboard');
};
```

### 2. 用 Actions（Astro 4.15+ 稳定）

更类型安全的方式，详见 [指南 - 进阶](./advanced.md) 的 Actions 章节。

## CSS / Styling

### Scoped 默认

```astro
<h1>Hello</h1>

<style>
  h1 { color: red; }    /* 仅影响本组件 */
</style>
```

编译后：

```html
<h1 class="astro-2x3y4z">Hello</h1>
<style>
  h1.astro-2x3y4z { color: red; }
</style>
```

### Global

```astro
<style is:global>
  body { margin: 0; font-family: system-ui; }
</style>
```

### 全局 stylesheet 文件

```css
/* src/styles/global.css */
:root {
  --color-primary: dodgerblue;
}
body {
  margin: 0;
  font-family: system-ui;
}
```

```astro
---
// src/layouts/Base.astro
import '../styles/global.css';
---
```

### CSS 变量（动态值）

```astro
---
const fg = 'rebeccapurple';
const size = 24;
---

<h1 style={`color: ${fg}; font-size: ${size}px`}>Hello</h1>

<!-- 也可绑定到 :root 变量 -->
<div style={`--bg: ${fg}`}>...</div>
<style>
  div { background: var(--bg); }
</style>
```

### Tailwind

```bash
npx astro add tailwind     # Tailwind 4 + @tailwindcss/vite
```

`astro.config.mjs` 自动加：

```js
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: { plugins: [tailwindcss()] },
});
```

`src/styles/global.css`：

```css
@import 'tailwindcss';
```

`src/layouts/Base.astro`：

```astro
---
import '../styles/global.css';
---
```

> Tailwind 4 不再需要 `tailwind.config.js`，所有配置都在 CSS 文件用 `@theme` 指令写。

### SCSS / Sass

```bash
npm install -D sass
```

```astro
<style lang="scss">
  $primary: dodgerblue;

  .btn {
    background: $primary;
    &--lg { font-size: 1.5rem; }
  }
</style>
```

### CSS Modules

```css
/* src/components/Button.module.css */
.btn {
  background: dodgerblue;
}
```

```astro
---
import styles from './Button.module.css';
---

<button class={styles.btn}>Click</button>
```

### 动态 class（`class:list`）

```astro
---
const isActive = true;
const isPrimary = true;
const extraClass = 'shadow';
---

<button class:list={[
  'btn',
  { active: isActive, primary: isPrimary },
  extraClass,
]}>
  Click
</button>

<!-- 等价于 -->
<button class={`btn ${isActive ? 'active' : ''} ${isPrimary ? 'primary' : ''} ${extraClass}`}>
  Click
</button>
```

## 客户端 `<script>`

`.astro` 的顶层 `<script>` 默认走 Vite bundle：

```astro
<script>
  // 仅在浏览器执行
  import { format } from 'date-fns';

  document.querySelectorAll('time').forEach((el) => {
    el.textContent = format(new Date(el.dateTime), 'yyyy-MM-dd');
  });
</script>
```

### `define:vars`：传 frontmatter 变量

```astro
---
const apiKey = import.meta.env.PUBLIC_API_KEY;
const userId = Astro.locals.user?.id;
---

<script define:vars={{ apiKey, userId }}>
  // 这里能拿到 apiKey 和 userId（编译时插入字面量）
  fetch(`/api/posts?userId=${userId}`, {
    headers: { 'X-API-Key': apiKey },
  });
</script>
```

> `define:vars` 注入的值会**被序列化为 JSON**，所以传 `Map` / `Set` / `Function` 会失败。

### `is:inline`：不打包

```astro
<script is:inline>
  // 原样输出到 HTML，不走 Vite
  window.dataLayer = window.dataLayer || [];
</script>
```

## Layout 与 Page 数据流

整个数据流（最复杂的情形）：

```
请求到达
  ↓
middleware（设置 locals）
  ↓
Page frontmatter（顶层 await，准备数据）
  ↓
Page 模板渲染（含子组件、子 layout、islands 的 SSR HTML）
  ↓
插入 client island scripts（hydrate 标记）
  ↓
返回 HTML 给浏览器
  ↓
浏览器加载 island JS → hydrate
  ↓
（可选）Server Islands 异步加载并替换 fallback
```

理解这个流是写好 Astro 应用的关键。

## 静态资源

### `public/` 目录

`public/favicon.svg` → `https://yoursite.com/favicon.svg`，原样拷贝、不处理。

```astro
<link rel="icon" href="/favicon.svg" />
<img src="/logo.png" alt="Logo" />
```

### `src/` import 资源

```astro
---
import logo from '../assets/logo.png';     // 自动 hash + 优化
---

<img src={logo.src} width={logo.width} height={logo.height} alt="Logo" />
```

更强大的是 `<Image />` 组件，详见 [指南 - 进阶](./advanced.md)。

## 下一步

- SSR / Server Islands / Actions / View Transitions / Image 见 [指南 - 进阶](./advanced.md)
- Content Layer 深度 / DB / i18n / Streaming / 多框架混用 / 部署 见 [指南 - 高级](./expert.md)
- vs Next.js / SvelteKit / Nuxt / Astro 升级 见 [指南 - 其他](./other.md)
- 全部文件约定 / API / 配置速查 见 [参考](../reference.md)
