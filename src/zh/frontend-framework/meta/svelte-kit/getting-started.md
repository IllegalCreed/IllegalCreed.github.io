---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 SvelteKit 2.x + Svelte 5（runes）+ Vite 5 编写

## 速查

- 系统要求：Node.js **18.13+**（SvelteKit 2 最低）/ 推荐 Node 20 LTS；TypeScript 5+；Vite 5+
- 创建：`npx sv create my-app`（官方 CLI `sv`，交互选 SvelteKit + TS + Svelte 5）
- 启动：`npm run dev`（默认 `http://localhost:5173`，HMR + Vite）
- 入口：`src/routes/+page.svelte`（首页）+ `src/app.html`（HTML 模板）+ `src/app.d.ts`（App 类型）
- 文件路由：`src/routes/about/+page.svelte` → `/about`；`src/routes/blog/[slug]/+page.svelte` → `/blog/:slug`
- 后缀含义：
  - `+page.svelte` —— 页面组件（默认 SSR + CSR 双渲染）
  - `+page.ts` —— Universal load（服务端 + 客户端都跑）
  - `+page.server.ts` —— Server-only load + Form Actions
  - `+layout.svelte` / `+layout.ts` / `+layout.server.ts` —— 共享布局
  - `+error.svelte` —— 错误边界 UI
  - `+server.ts` —— API 端点（HTTP 方法导出）
- Svelte 5 runes：`$state(value)` 响应式状态 / `$derived(expr)` 派生 / `$effect(() => ...)` 副作用 / `$props()` 接 props
- Adapter：`@sveltejs/adapter-auto`（默认）/ `adapter-node` / `adapter-vercel` / `adapter-cloudflare` / `adapter-static`

## 安装与首次启动

最快路径（官方 CLI `sv`，对应 npm 包 `sv`）：

```bash
# 官方脚手架（推荐）
npx sv create my-app

# 交互式提问，典型选择：
# √ Which template would you like? · SvelteKit minimal
# √ Add type checking with TypeScript? · Yes, using TypeScript syntax
# √ Select additional options (use arrow keys/space bar) ·
#   ◉ Add ESLint for code linting
#   ◉ Add Prettier for code formatting
#   ◉ Add Playwright for browser testing
#   ◉ Add Vitest for unit testing
# √ Which package manager do you want to install dependencies with? · pnpm

cd my-app
pnpm install
pnpm dev
```

打开 `http://localhost:5173` 即看默认页。**Vite HMR + Svelte 编译器**默认开启。

> SvelteKit 2 + Svelte 5 模板会自动用 runes（`$state` / `$props` 等），不再是 Svelte 4 的 `export let` / `$:` 写法。

### Node 版本

- **SvelteKit 2** 最低 Node 18.13.0
- 推荐 Node 20 LTS（与多数 adapter 默认 runtime 一致）

```bash
nvm install --lts && nvm use --lts
node -v   # v20.x.x
```

### `sv` CLI

`sv` 是 SvelteKit 与 Svelte 项目的官方 CLI（独立包，替代旧的 `create-svelte`）。

```bash
# 创建项目
npx sv create my-app

# 给已有项目加集成（Tailwind / Drizzle / Lucia / mdsvex / ...）
npx sv add tailwindcss

# 类型/语法检查（svelte-check 的便捷入口）
npx sv check

# 升级到最新主版本
npx sv migrate
```

> 旧版命令 `npm create svelte@latest` 仍可用，但官方推荐 `sv`。

### 手动安装

如果不用 `sv`，从零拼装：

```bash
mkdir my-app && cd my-app
pnpm init
pnpm add -D @sveltejs/kit @sveltejs/vite-plugin-svelte svelte vite typescript @sveltejs/adapter-auto
```

`package.json` 加 scripts：

```json
{
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json"
  }
}
```

最少配置 `vite.config.js` / `svelte.config.js`（见下文「项目结构」），创建 `src/app.html` + `src/routes/+page.svelte` + `src/app.d.ts`，跑 `pnpm dev` 即可。

## 项目结构

`sv create` 默认生成的目录：

```
my-app/
├── src/
│   ├── lib/                    # 公共代码 / 组件，通过 $lib 别名访问
│   │   └── server/             # 仅服务端模块，通过 $lib/server 访问
│   ├── params/                 # 路由参数 matcher（可选）
│   ├── routes/                 # 路由根（核心）
│   │   ├── +page.svelte        # / 路由
│   │   └── +layout.svelte      # 根布局（可选）
│   ├── app.html                # HTML 模板，含 %sveltekit.head% 占位
│   ├── app.d.ts                # App 类型声明（App.Locals / App.Error / ...）
│   ├── error.html              # 兜底错误页（可选）
│   ├── hooks.client.ts         # 客户端 hooks（handleError / init / ...）
│   ├── hooks.server.ts         # 服务端 hooks（handle / handleFetch / handleError / ...）
│   ├── hooks.ts                # 通用 hooks（reroute / transport）
│   └── service-worker.ts       # Service Worker（可选）
├── static/                     # 直接拷贝的静态资源（favicon / robots.txt）
├── tests/                      # Playwright 测试
├── svelte.config.js            # Svelte + SvelteKit 配置（adapter / alias / prerender）
├── vite.config.ts              # Vite 配置
├── tsconfig.json               # TS 配置（继承 .svelte-kit/tsconfig.json）
├── package.json                # 必须有 "type": "module"
└── .svelte-kit/                # 生成目录（每次 dev/build 自动生成，安全删除）
```

> `src/` 下除 `routes/` 和 `app.html` 之外都是**可选**的。SvelteKit 不强求 hooks / service-worker 等。

### 关键文件

**`src/app.html`** —— HTML 模板，含占位变量：

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%sveltekit.assets%/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

占位变量：

| 占位 | 作用 |
|---|---|
| `%sveltekit.head%` | 注入 `<svelte:head>` 内容 + preload links |
| `%sveltekit.body%` | 应用根 DOM 节点 |
| `%sveltekit.assets%` | `paths.assets`（CDN 地址）或 `paths.base`（默认） |
| `%sveltekit.nonce%` | CSP nonce |
| `%sveltekit.env.[NAME]%` | 注入公共环境变量 |
| `%sveltekit.version%` | 应用版本号 |

**`src/app.d.ts`** —— App 命名空间类型：

```ts
declare global {
  namespace App {
    // interface Error {}        // 错误对象形状（可扩展 code/id 等）
    // interface Locals {}       // event.locals 类型（user / session 等）
    // interface PageData {}     // 所有页面共享的 data 字段
    // interface PageState {}    // pushState/replaceState 的 state 类型
    // interface Platform {}     // adapter 提供的 platform.env 类型
  }
}
export {};
```

**`svelte.config.js`** —— 核心配置：

```js
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter()
  }
};

export default config;
```

**`vite.config.ts`** —— Vite 入口：

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()]
});
```

### 路由后缀全表

`src/routes/` 下用文件名前缀约定路由能力：

| 文件 | 作用 | 运行位置 |
|---|---|---|
| `+page.svelte` | 页面组件（叶子） | SSR + CSR |
| `+page.ts` | Universal load | 服务端 + 客户端 |
| `+page.server.ts` | Server-only load + Form Actions | 仅服务端 |
| `+layout.svelte` | 共享布局，包子路由 | SSR + CSR |
| `+layout.ts` | Universal layout load | 服务端 + 客户端 |
| `+layout.server.ts` | Server-only layout load | 仅服务端 |
| `+error.svelte` | 错误边界 UI | SSR + CSR |
| `+server.ts` | HTTP 端点（GET/POST/...） | 仅服务端 |

> `+page` 与 `+server` **在同一段路由可以共存**：会根据 `Accept` header 判断 —— `text/html` 优先走 `+page`，其他走 `+server`。

## 第一个页面

`src/routes/+page.svelte` 对应路由 `/`：

```svelte
<!-- src/routes/+page.svelte -->
<h1>Hello SvelteKit</h1>
<p>这是一个最小的 SvelteKit 页面。</p>
```

加 `/about` 路由：

```svelte
<!-- src/routes/about/+page.svelte -->
<h1>About</h1>
```

链接导航：

```svelte
<!-- src/routes/+page.svelte -->
<h1>Hello SvelteKit</h1>
<a href="/about">About</a>
```

`<a href="...">` 在 SvelteKit 里**自动**走客户端路由（无需 `<Link>` 组件）—— 不刷页面，按 `data-sveltekit-preload-data="hover"`（默认在 `app.html` 上）自动 prefetch。

## 根布局 `+layout.svelte`

`src/routes/+layout.svelte` 是**根布局**，包所有路由。**注意 SvelteKit 不在 layout 里手动写 `<html>` / `<body>`**（那是 `app.html` 的责任），layout 只写应用内的 shell：

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  let { children } = $props();
</script>

<header>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
  </nav>
</header>

<main>
  {@render children()}
</main>

<footer>© 2026</footer>

<style>
  header { padding: 1rem; background: #eee; }
  main { padding: 2rem; }
</style>
```

要点：

- `let { children } = $props()` —— 用 `$props` rune 接 children snippet
- `{@render children()}` —— Svelte 5 渲染 snippet 的语法，替代 Svelte 4 的 `<slot />`
- `<style>` 块默认**作用域隔离到当前组件**（Svelte 编译器自动加 hash 类名）

### 嵌套布局

任意子目录可加 `+layout.svelte`，会包该目录及子路由：

```
src/routes/
├── +layout.svelte              # 根布局
├── +page.svelte                # /
└── dashboard/
    ├── +layout.svelte          # 包 /dashboard 及子路由
    ├── +page.svelte            # /dashboard
    └── settings/
        └── +page.svelte        # /dashboard/settings
```

```svelte
<!-- src/routes/dashboard/+layout.svelte -->
<script lang="ts">
  let { children } = $props();
</script>

<section class="dashboard">
  <aside>Sidebar</aside>
  <div class="content">
    {@render children()}
  </div>
</section>
```

## 动态路由

文件夹名加方括号 `[param]` 即动态段。捕获后通过 load 的 `params` 拿到：

```
src/routes/
├── blog/
│   ├── +page.svelte            # /blog
│   └── [slug]/
│       ├── +page.svelte        # /blog/:slug
│       └── +page.ts
└── shop/
    └── [...path]/
        └── +page.svelte        # /shop/* catch-all
```

```ts
// src/routes/blog/[slug]/+page.ts
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
  const res = await fetch(`/api/posts/${params.slug}`);
  if (!res.ok) error(404, 'Post not found');

  const post = await res.json();
  return { post };
};
```

```svelte
<!-- src/routes/blog/[slug]/+page.svelte -->
<script lang="ts">
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
</script>

<article>
  <h1>{data.post.title}</h1>
  <div>{@html data.post.content}</div>
</article>
```

要点：

- `params` 是**普通对象**，不像 Next.js 那样是 Promise
- `data` 通过 `$props()` 拿，类型由自动生成的 `./$types` 提供
- `error(404, '...')` 直接调用即可（SvelteKit 2 不再需要 `throw`）

### 高级路由

- `[[lang]]/home` —— 可选参数，匹配 `/home` 与 `/en/home`
- `[...rest]` —— catch-all，捕获多段
- `(group)` —— 路由组，**不影响 URL**，用于共享 layout
- `[slug=fruit]` —— matcher 限制，在 `src/params/fruit.ts` 定义验证函数
- `_folder` / `_file` —— 下划线前缀**不参与路由**（私有文件夹）

详见 [指南 - 基础](./guide-line/base.md) 与 [指南 - 进阶](./guide-line/advanced.md)。

## 第一个 `load` 函数

Universal load（双端跑）—— 适合公共 API 拉数据：

```ts
// src/routes/blog/+page.ts
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  const res = await fetch('/api/posts');
  const posts = await res.json();
  return { posts };
};
```

Server-only load —— 适合数据库、私密 env：

```ts
// src/routes/blog/+page.server.ts
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async () => {
  const posts = await db.post.findMany({ orderBy: { publishedAt: 'desc' } });
  return { posts };
};
```

在页面里拿：

```svelte
<!-- src/routes/blog/+page.svelte -->
<script lang="ts">
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
</script>

<h1>Latest Posts</h1>
<ul>
  {#each data.posts as post}
    <li>
      <a href="/blog/{post.slug}">{post.title}</a>
    </li>
  {/each}
</ul>
```

**关键区别**：

| 特性 | Universal `+page.ts` | Server `+page.server.ts` |
|---|---|---|
| 运行位置 | 服务端 + 客户端 | 仅服务端 |
| 返回值序列化 | 任意（含组件、类、Map） | 必须 devalue 兼容（JSON / Date / Map / Set / BigInt） |
| 数据库访问 | ❌（会泄露到客户端） | ✅ |
| 私密 env | ❌ | ✅ `$env/static/private` |
| Cookies | ❌ | ✅ `cookies.get()` / `cookies.set()` |
| 同时有 server load | 拿得到 server 返回的 data | — |

> 同时有 `+page.ts` 和 `+page.server.ts`：先跑 server，再跑 universal；universal 可以通过 `data` 参数拿到 server 的返回值。

## Svelte 5 runes 基础

SvelteKit 2.x 默认配 Svelte 5。这里只列最常用的 5 个 runes，详细见 Svelte 章节。

### `$state` —— 响应式状态

```svelte
<script lang="ts">
  let count = $state(0);

  function increment() {
    count += 1;   // 直接赋值，自动响应式
  }
</script>

<button onclick={increment}>
  Count: {count}
</button>
```

数组 / 对象**深度响应式**（Proxy）：

```svelte
<script lang="ts">
  let todos = $state([
    { done: false, text: '写文档' }
  ]);

  function add(text: string) {
    todos.push({ done: false, text });   // 直接 push，自动响应
  }

  function toggle(i: number) {
    todos[i].done = !todos[i].done;
  }
</script>

<ul>
  {#each todos as todo, i}
    <li>
      <input type="checkbox" checked={todo.done} onchange={() => toggle(i)} />
      <span class:done={todo.done}>{todo.text}</span>
    </li>
  {/each}
</ul>
```

> 类实例**不会**自动 proxify，需要在 class field 上用 `$state`。

```ts
class Todo {
  done = $state(false);
  text: string;

  constructor(text: string) {
    this.text = text;
  }
}
```

### `$derived` —— 派生值

```svelte
<script lang="ts">
  let count = $state(0);
  let doubled = $derived(count * 2);
</script>

<button onclick={() => count++}>
  {count} doubled is {doubled}
</button>
```

复杂派生用 `$derived.by(() => { ... })`：

```svelte
<script lang="ts">
  let numbers = $state([1, 2, 3]);

  let total = $derived.by(() => {
    let sum = 0;
    for (const n of numbers) sum += n;
    return sum;
  });
</script>

<p>{numbers.join(' + ')} = {total}</p>
```

> `$derived(...)` **必须无副作用**（不能写状态、不能发请求）—— 副作用用 `$effect`。

### `$effect` —— 副作用

```svelte
<script lang="ts">
  let size = $state(50);
  let canvas: HTMLCanvasElement;

  $effect(() => {
    // 每当 size 变化都跑
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, size, size);
  });
</script>

<input type="range" bind:value={size} min="10" max="200" />
<canvas bind:this={canvas} width="200" height="200"></canvas>
```

返回 cleanup：

```svelte
<script lang="ts">
  let count = $state(0);

  $effect(() => {
    const id = setInterval(() => count++, 1000);
    return () => clearInterval(id);
  });
</script>
```

> `$effect` 在 DOM 挂载后异步跑（microtask）；同步读的响应式值才会被追踪，`await` / `setTimeout` 之后的读取不追踪。

### `$props` —— 接组件 props

```svelte
<!-- src/lib/Button.svelte -->
<script lang="ts">
  interface Props {
    label: string;
    variant?: 'primary' | 'secondary';
    onclick?: (e: MouseEvent) => void;
  }

  let { label, variant = 'primary', onclick }: Props = $props();
</script>

<button class={variant} {onclick}>
  {label}
</button>
```

调用：

```svelte
<script>
  import Button from '$lib/Button.svelte';
</script>

<Button label="Save" variant="primary" onclick={() => console.log('clicked')} />
```

rest props：

```svelte
<script lang="ts">
  let { class: className, ...rest } = $props();
</script>

<div class={className} {...rest}>...</div>
```

### `$bindable` —— 父组件双向绑定

```svelte
<!-- src/lib/Input.svelte -->
<script lang="ts">
  let { value = $bindable('') } = $props();
</script>

<input bind:value />
```

```svelte
<script lang="ts">
  import Input from '$lib/Input.svelte';
  let name = $state('');
</script>

<Input bind:value={name} />
<p>Hello {name}</p>
```

## 第一个 API 端点 `+server.ts`

`src/routes/api/posts/+server.ts` 暴露为 `/api/posts`：

```ts
// src/routes/api/posts/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const posts = await db.post.findMany();
  return json(posts);
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const created = await db.post.create({ data: body });
  return json(created, { status: 201 });
};
```

支持的方法：`GET` / `POST` / `PUT` / `PATCH` / `DELETE` / `HEAD` / `OPTIONS`。还可导出 `fallback` 捕获其他方法。

带动态段：

```ts
// src/routes/api/users/[id]/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  const user = await db.user.findUnique({ where: { id: params.id } });
  if (!user) error(404, 'User not found');
  return json(user);
};
```

> `json()` 是 `Response.json()` 的便捷封装；返回 `Response` 对象即可，是标准 Fetch API。

## 第一个 Form Action

Form Action 是定义在 `+page.server.ts` 的 `actions` 对象，处理 form 提交。**无 JS 也能跑**（progressive enhancement）。

```ts
// src/routes/login/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ cookies, request }) => {
    const data = await request.formData();
    const email = data.get('email') as string;
    const password = data.get('password') as string;

    if (!email || !password) {
      return fail(400, { email, missing: true });
    }

    const user = await authenticate(email, password);
    if (!user) {
      return fail(401, { email, invalid: true });
    }

    cookies.set('sessionid', user.sessionId, { path: '/', httpOnly: true });
    redirect(303, '/dashboard');
  }
};
```

```svelte
<!-- src/routes/login/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageProps } from './$types';

  let { form }: PageProps = $props();
</script>

<form method="POST" use:enhance>
  <input name="email" type="email" value={form?.email ?? ''} />
  {#if form?.missing}<p class="error">请填写邮箱</p>{/if}

  <input name="password" type="password" />
  {#if form?.invalid}<p class="error">账号或密码错误</p>{/if}

  <button type="submit">登录</button>
</form>
```

要点：

- `<form method="POST">` 没有 `action` 属性 → 提交到当前路由的 `default` action
- `cookies.set()` 必须传 `path`（SvelteKit 2 强制）
- `redirect(303, ...)` 直接调用，不要 `throw`
- `use:enhance` 升级为 SPA 体验，无 JS 时降级为传统表单提交
- `form` prop 自动注入 action 返回的对象（`fail()` / 普通 return）

命名 action（多个）：

```ts
export const actions: Actions = {
  login: async (event) => { /* ... */ },
  register: async (event) => { /* ... */ }
};
```

```svelte
<form method="POST" action="?/login">...</form>
<form method="POST" action="?/register">...</form>
```

## CSS / Tailwind

- **组件作用域样式**：`.svelte` 里写 `<style>` 默认作用域隔离
- **全局样式**：`<style global>` 或在 layout 里 import `.css`
- **Tailwind CSS**：用 `npx sv add tailwindcss` 一键集成；Tailwind 4 与 SvelteKit 完全兼容
- **预处理器**：`vitePreprocess()` 已支持 SCSS、PostCSS、TypeScript 等，在 `<style lang="scss">` / `<script lang="ts">` 标注即可

```svelte
<script lang="ts">
  let active = $state(false);
</script>

<button class:active onclick={() => active = !active}>
  Toggle
</button>

<style>
  button {
    padding: 0.5rem 1rem;
    background: #eee;
    border: none;
    border-radius: 0.25rem;
  }
  button.active {
    background: dodgerblue;
    color: white;
  }
</style>
```

## 图片优化 `@sveltejs/enhanced-img`

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
    enhancedImages(),   // ⚠️ 必须放 sveltekit() 之前
    sveltekit()
  ]
});
```

```svelte
<script>
  // 静态 import 自动推断 width/height/blurDataURL
  import logo from '$lib/assets/logo.png?enhanced';
</script>

<enhanced:img src="./hero.jpg" alt="Hero" />
<enhanced:img src={logo} alt="Logo" />

<!-- 响应式 srcset -->
<enhanced:img
  src="./banner.png?w=1280;640;400"
  sizes="(min-width: 1920px) 1280px, (min-width: 1080px) 640px, 400px"
  alt="Banner"
/>
```

构建期自动生成 AVIF / WebP、移除 EXIF、计算 placeholder。

## 字体 / 静态资源

- 静态资源：丢 `static/` 直接 `/file.png` 访问
- 字体：放 `static/fonts/`，CSS `@font-face` 引用；或用 Fontsource：`pnpm add @fontsource/inter` → `import '@fontsource/inter'`

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter.woff2') format('woff2');
  font-display: swap;
}
```

## 路径别名 `$lib`

`src/lib/` 自动通过 `$lib` 别名访问；`src/lib/server/` 通过 `$lib/server` 访问且**禁止客户端 import**。

```ts
// 任意位置
import Button from '$lib/Button.svelte';
import { db } from '$lib/server/db';
```

要加自定义别名，在 `svelte.config.js` 的 `kit.alias` 配置（自动同步到 `tsconfig.json` 和 Vite）：

```js
// svelte.config.js
const config = {
  kit: {
    alias: {
      '@components': 'src/components'
    }
  }
};
```

## 部署

最快：推 GitHub → 连 Vercel → 自动部署（默认 `@sveltejs/adapter-auto` 会探测部署平台并安装对应 adapter）。

其他选项：

```bash
# Node.js server（自托管）
pnpm add -D @sveltejs/adapter-node
# svelte.config.js: import adapter from '@sveltejs/adapter-node'
pnpm build
node build

# Static（SSG，0 运行时）
pnpm add -D @sveltejs/adapter-static
# svelte.config.js: adapter + 根 layout 加 export const prerender = true
pnpm build
# 生成 build/，传任意静态 CDN

# Cloudflare Workers / Pages
pnpm add -D @sveltejs/adapter-cloudflare
# wrangler deploy
```

详见 [指南 - 高级](./guide-line/expert.md) 的部署章节。

## 一份能跑的最小示例

```
my-app/
├── src/
│   ├── routes/
│   │   ├── +layout.svelte
│   │   ├── +page.svelte
│   │   ├── about/
│   │   │   └── +page.svelte
│   │   ├── blog/
│   │   │   ├── +page.svelte
│   │   │   ├── +page.ts
│   │   │   └── [slug]/
│   │   │       ├── +page.svelte
│   │   │       └── +page.ts
│   │   └── api/
│   │       └── posts/
│   │           └── +server.ts
│   ├── app.html
│   └── app.d.ts
├── static/
├── svelte.config.js
├── vite.config.ts
└── package.json
```

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  let { children } = $props();
</script>

<nav>
  <a href="/">Home</a>
  <a href="/blog">Blog</a>
  <a href="/about">About</a>
</nav>

<main>{@render children()}</main>

<style>
  nav { display: flex; gap: 1rem; padding: 1rem; background: #f5f5f5; }
  main { padding: 2rem; }
</style>
```

```svelte
<!-- src/routes/+page.svelte -->
<h1>Hello SvelteKit</h1>
<p>Welcome.</p>
```

```ts
// src/routes/blog/+page.ts
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
  const posts = await res.json();
  return { posts };
};
```

```svelte
<!-- src/routes/blog/+page.svelte -->
<script lang="ts">
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
</script>

<h1>Posts</h1>
<ul>
  {#each data.posts as post}
    <li><a href="/blog/{post.id}">{post.title}</a></li>
  {/each}
</ul>
```

```ts
// src/routes/blog/[slug]/+page.ts
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
  const res = await fetch(
    `https://jsonplaceholder.typicode.com/posts/${params.slug}`
  );
  const post = await res.json();
  return { post };
};
```

```svelte
<!-- src/routes/blog/[slug]/+page.svelte -->
<script lang="ts">
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
</script>

<article>
  <h1>{data.post.title}</h1>
  <p>{data.post.body}</p>
</article>
```

```ts
// src/routes/api/posts/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=10');
  const posts = await res.json();
  return json(posts);
};
```

`pnpm dev` 打开 `http://localhost:5173` 即看完整 App。

## 下一步

- 文件路由 / `load` 函数 / Form Actions / Hooks 完整讲解见 [指南 - 基础](./guide-line/base.md)
- 渲染模式 / `prerender` / `ssr` / `csr` / Streaming / Server-Only Modules 见 [指南 - 进阶](./guide-line/advanced.md)
- 适配器 / Edge / Image / i18n / Auth / 部署优化见 [指南 - 高级](./guide-line/expert.md)
- 与 Next.js / Nuxt / Astro 对比、SvelteKit 1 → 2 升级、Svelte 4 → 5 runes 迁移见 [指南 - 其他](./guide-line/other.md)
- 全部文件约定 / Hook / API / 配置速查见 [参考](./reference.md)
