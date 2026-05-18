---
layout: doc
outline: [2, 3]
---

# 指南 - 其他

> 生态对比、版本迁移、常见踩坑

## 速查

- **vs Next.js**：SvelteKit 体积小 / 编译时 runtime；Next.js 生态大 / RSC + Server Actions
- **vs Nuxt**：SvelteKit 文件路由更细粒度；Nuxt module 生态大、auto-import 多
- **vs Astro**：Astro 多框架 + 默认 0 JS；SvelteKit 单框架 + 强 SPA
- **vs Remix / React Router**：理念接近（progressive enhancement + loaders + actions），但 Remix 基于 React、SvelteKit 基于 Svelte
- **Svelte 4 → 5**：`let` 隐式响应 → `$state`；`export let` → `$props()`；`createEventDispatcher` → callback props；`<slot>` → `{@render children()}`；`onMount` 仍兼容但 `$effect` 更通用
- **SvelteKit 1 → 2**：`error()`/`redirect()` 不再 `throw`；`cookies.set()` 必须 `path`；`load` top-level promise 不自动 await；`use:enhance` 回调参数改名；`$app/stores` deprecated → `$app/state`

## 与 Next.js 对比

| 维度 | SvelteKit | Next.js |
|---|---|---|
| 底层 UI | Svelte 5（编译型） | React 19 + RSC |
| Bundle 体积 | ~5-20KB（编译时） | ~80-120KB（runtime + RSC framework） |
| 渲染模型 | SSR / CSR / SSG，每路由选项 | SSR / SSG / ISR + RSC + Streaming + PPR |
| 服务端组件 | `+page.server.ts` load + Form Actions（明确边界） | RSC（`'use client'` 切边界） |
| 文件路由 | 文件后缀 `+page` / `+layout` / `+server` / `+error` | 文件名 `page.tsx` / `layout.tsx` / `route.ts` / `error.tsx` |
| 数据获取 | `load` 函数返回 data | RSC 里直接 `async/await` |
| 表单 | Form Actions + `use:enhance`（progressive） | Server Actions + `useFormState` |
| 缓存模型 | 简单：`load` 配 `depends`/`invalidate` | 复杂四层缓存（Request Memo / Data / Full Route / Router） |
| 部署 | Adapter 切换 5 平台 | Vercel 首发 / Node / Docker / Static / Cloudflare 等 |
| 学习曲线 | 中（runes + 文件约定） | 中高（RSC + 缓存语义 + 'use client' 传染） |
| 生态 | 中小（shadcn-svelte / Skeleton / Bits UI） | 大（shadcn-ui / Radix / MUI / Ant Design / Material） |
| TS 类型 | 自动生成 `./$types`，可推断 | 自动 `next/types` + RSC 推断 |
| 招聘市场 | 较小 | 大 |

**选 SvelteKit 的场景**：

- 重视 bundle 体积 / 首屏速度
- 喜欢编译型框架（CSS scoping、模板编译为 JS）
- 团队接受 Svelte 5 runes 心智
- 中小项目、博客、SaaS、Marketing site

**选 Next.js 的场景**：

- 已有 React 团队 / 招聘需要 React
- 需要 RSC / Server Actions / Suspense 等 React 19 生态
- 重 enterprise，需要大量 UI 库 / SDK / 第三方集成
- 部署 Vercel 想要最佳支持

## 与 Nuxt 对比

| 维度 | SvelteKit | Nuxt |
|---|---|---|
| 底层 UI | Svelte 5 | Vue 3 |
| 状态 | runes / store | Pinia / Composables |
| 数据 | `+page.ts` / `+page.server.ts` load | `useFetch` / `useAsyncData` / Server Routes |
| 路由 | 文件 `+page.svelte` | 文件 `pages/index.vue` |
| Auto-import | 仅 `$lib` / `$app/*` / `$env/*` | 全自动（components / composables / utils） |
| 中间件 | hooks `handle` | `middleware/` 目录 |
| Module 生态 | 较小 | 非常丰富（nuxt-content / image / SEO / Auth / 国际化） |
| Adapter | 5 个官方 | Nitro（统一 server，支持 12+ 平台） |

**选 SvelteKit**：体积、编译时、明确边界。

**选 Nuxt**：Vue 团队、Auto-import 提效、Nitro 跨平台、Nuxt Module 丰富。

## 与 Astro 对比

| 维度 | SvelteKit | Astro |
|---|---|---|
| 框架支持 | 仅 Svelte | React / Vue / Svelte / Solid / Preact 混用 |
| 默认 JS | SPA hydrate 完整 | **0 JS**，按需 `client:load` 加 island |
| 适用 | 重交互 SaaS、SPA-like | 内容站、Blog、Marketing |
| 路由 | `+page.svelte` | `pages/index.astro` / `.md` / `.mdx` |
| 数据 | `load` 函数 | `getStaticPaths` + frontmatter |
| 部署 | Adapter | Adapter（Vercel / Node / Cloudflare / Static） |
| MDX / Markdown | mdsvex（非官方） | 原生支持 `.md` / `.mdx` |
| Content Collections | 无（手写或 mdsvex） | 内置 Content Collections |

**选 Astro**：内容站、博客、文档站、希望 0 JS / 选择性 island。

**选 SvelteKit**：交互应用、SaaS、Dashboard。

## 与 Remix / React Router 对比

Remix 在 2024 年 5 月被并入 React Router v7，但理念延续。

| 维度 | SvelteKit | Remix / RR v7 (framework mode) |
|---|---|---|
| 底层 | Svelte 5 | React |
| Loader / Action | `load` / `actions` | `loader` / `action` |
| Form | Progressive `<form>` + `use:enhance` | Progressive `<Form>` + `useFetcher` |
| 路由 | 文件路由 `src/routes/` | 文件路由 `app/routes/` |
| 嵌套布局 | `+layout.svelte` | `_layout.tsx` |
| 错误边界 | `+error.svelte` | `ErrorBoundary` export |
| 设计哲学 | "Web Standards + Progressive Enhancement"（一致） | 同 |

> 二者理念近乎一致 —— **建在 Web Standards 上，先 HTML 再 JS**。差异仅在 UI 库（Svelte vs React）。SvelteKit 用户切 Remix / RR 几乎无心智成本。

## Svelte 4 → 5 迁移

Svelte 5（2024.10 正式发布）引入 runes，是底层响应式重写。**仍兼容 Svelte 4 语法**（同时存在），但官方推荐迁到 runes。

### 1. 响应式状态

```svelte
<!-- Svelte 4 -->
<script>
  let count = 0;        // 隐式响应：组件顶层 let 自动响应
  $: doubled = count * 2;
  $: console.log(count);
</script>

<button on:click={() => count++}>{count}</button>
<p>{doubled}</p>
```

```svelte
<!-- Svelte 5 -->
<script lang="ts">
  let count = $state(0);
  let doubled = $derived(count * 2);

  $effect(() => {
    console.log(count);
  });
</script>

<button onclick={() => count++}>{count}</button>
<p>{doubled}</p>
```

要点：

- `let count = 0` → `let count = $state(0)`
- `$: doubled = ...` → `let doubled = $derived(...)`
- `$: { 副作用 }` → `$effect(() => { ... })`
- `on:click` → `onclick`（属性而非 directive）

### 2. Props

```svelte
<!-- Svelte 4 -->
<script>
  export let name;
  export let age = 18;
</script>
```

```svelte
<!-- Svelte 5 -->
<script lang="ts">
  let { name, age = 18 } = $props();
</script>
```

类型 + rest：

```svelte
<script lang="ts">
  interface Props {
    name: string;
    age?: number;
    onclick?: () => void;
  }
  let { name, age = 18, onclick, ...rest }: Props = $props();
</script>
```

### 3. 事件

```svelte
<!-- Svelte 4：DOM 事件用 on: 指令 -->
<button on:click={handler}>Click</button>

<!-- Svelte 4：组件事件用 createEventDispatcher -->
<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  dispatch('save', { id: 1 });
</script>
```

```svelte
<!-- Svelte 5：DOM 事件改为属性 -->
<button onclick={handler}>Click</button>

<!-- Svelte 5：组件事件改为 callback props -->
<script lang="ts">
  let { onsave }: { onsave?: (data: { id: number }) => void } = $props();
  onsave?.({ id: 1 });
</script>
```

### 4. Slot → Snippet

```svelte
<!-- Svelte 4 -->
<script>
  // Modal.svelte
</script>
<div class="modal">
  <slot />
  <slot name="footer" />
</div>

<!-- 使用 -->
<Modal>
  <h2>Title</h2>
  <button slot="footer">Close</button>
</Modal>
```

```svelte
<!-- Svelte 5 -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  let { children, footer }: { children: Snippet; footer?: Snippet } = $props();
</script>
<div class="modal">
  {@render children()}
  {@render footer?.()}
</div>

<!-- 使用 -->
<Modal>
  <h2>Title</h2>
  {#snippet footer()}
    <button>Close</button>
  {/snippet}
</Modal>
```

带参数：

```svelte
<!-- 列表组件 -->
<script lang="ts">
  let { items, item }: { items: Item[]; item: Snippet<[Item]> } = $props();
</script>

<ul>
  {#each items as it}
    <li>{@render item(it)}</li>
  {/each}
</ul>

<!-- 使用 -->
<List items={posts}>
  {#snippet item(post)}
    <h3>{post.title}</h3>
  {/snippet}
</List>
```

### 5. 生命周期

`onMount` / `onDestroy` / `beforeUpdate` / `afterUpdate` 仍兼容。但更推荐 `$effect`：

```svelte
<!-- Svelte 4 -->
<script>
  import { onMount, onDestroy } from 'svelte';
  let id;
  onMount(() => {
    id = setInterval(tick, 1000);
  });
  onDestroy(() => clearInterval(id));
</script>
```

```svelte
<!-- Svelte 5 -->
<script lang="ts">
  $effect(() => {
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  });
</script>
```

### 6. Store

Svelte 4 的 `writable` / `readable` / `derived` store 仍可用。但对于组件内状态，`$state` 更直接：

```ts
// Svelte 4 模式
import { writable } from 'svelte/store';
export const count = writable(0);
```

```ts
// Svelte 5 模式：跨文件共享 → 改成 .svelte.ts 用 $state
// src/lib/state/count.svelte.ts
export const counter = $state({ value: 0 });
```

```svelte
<script>
  import { counter } from '$lib/state/count.svelte';
</script>

<button onclick={() => counter.value++}>{counter.value}</button>
```

> 跨文件用 `$state` 必须改后缀为 `.svelte.ts` / `.svelte.js`，普通 `.ts` 不能用 runes。

### 7. 组件实例化（imperative）

```ts
// Svelte 4
import App from './App.svelte';
const app = new App({
  target: document.body,
  props: { name: 'world' }
});
app.$set({ name: 'svelte' });
app.$destroy();
```

```ts
// Svelte 5
import { mount, unmount } from 'svelte';
import App from './App.svelte';

const app = mount(App, {
  target: document.body,
  props: { name: 'world' }
});

// 改 props：直接 mutate 响应式 state
unmount(app);
```

### 自动迁移工具

```bash
npx sv migrate svelte-5
```

会自动转化大部分 Svelte 4 → 5 语法（runes / props / events / slots）。仍需要手动 review，特别是逻辑复杂的 `$:` 语句。

## SvelteKit 1 → 2 迁移

SvelteKit 2（2023.12 发布）是次要的 API 重整。

### 1. `error()` / `redirect()` 不再 throw

```ts
// SvelteKit 1
import { error, redirect } from '@sveltejs/kit';
throw error(404, 'Not found');
throw redirect(303, '/login');

// SvelteKit 2
import { error, redirect } from '@sveltejs/kit';
error(404, 'Not found');     // 内部仍 throw，但调用方不写 throw
redirect(303, '/login');
```

在 try/catch 里要区分：

```ts
import { isHttpError, isRedirect } from '@sveltejs/kit';

try {
  await load();
} catch (e) {
  if (isHttpError(e) || isRedirect(e)) throw e;
  // 真正的意外错误
  console.error(e);
}
```

### 2. `cookies.set()` / `cookies.delete()` 必须 `path`

```ts
// SvelteKit 1
cookies.set('sessionid', value);
cookies.delete('sessionid');

// SvelteKit 2
cookies.set('sessionid', value, { path: '/' });
cookies.delete('sessionid', { path: '/' });
```

### 3. `load` top-level promise 不再自动 await

```ts
// SvelteKit 1：会被自动 await
export const load = async () => {
  return {
    user: fetchUser(),     // SK1 自动 await
    posts: fetchPosts()
  };
};

// SvelteKit 2：top-level promise 不自动 await
// 想并行：
export const load = async () => {
  const [user, posts] = await Promise.all([fetchUser(), fetchPosts()]);
  return { user, posts };
};

// 想流式 stream（仅 server load）：
export const load = async () => {
  return {
    user: await fetchUser(),
    posts: fetchPosts()          // 不 await，作为流式 Promise
  };
};
```

### 4. `use:enhance` 回调参数改名

```svelte
<!-- SvelteKit 1 -->
<form use:enhance={({ data, form }) => {
  return ({ result, update }) => { ... };
}}>

<!-- SvelteKit 2 -->
<form use:enhance={({ formData, formElement }) => {
  return ({ result, update }) => { ... };
}}>
```

### 5. 文件上传必须 `enctype`

`<input type="file">` 的 form 不写 `enctype="multipart/form-data"` 会报错：

```svelte
<form method="POST" enctype="multipart/form-data" use:enhance>
  <input type="file" name="avatar" />
</form>
```

### 6. `goto` 不接外部 URL

```ts
// SvelteKit 1
goto('https://other.com');

// SvelteKit 2
window.location.href = 'https://other.com';
```

### 7. `$app/stores` deprecated → `$app/state`（2.12+）

```ts
// SvelteKit 1 / 2 之前
import { page, navigating } from '$app/stores';
// 模板里用 $page、$navigating

// SvelteKit 2.12+
import { page, navigating } from '$app/state';
// 模板里直接 page.url（去掉 $，且不需要 . 前的 $）
```

### 8. 最低版本

- Node 18.13+
- Svelte 4+（推荐 5）
- Vite 5+
- TypeScript 5+
- 各 adapter：cloudflare 3、netlify 3、node 2、static 3、vercel 4

### 9. `vitePreprocess` 改 import 路径

```ts
// SvelteKit 1
import { vitePreprocess } from '@sveltejs/kit/vite';

// SvelteKit 2
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
```

### 自动迁移

```bash
npx sv migrate sveltekit-2
```

会处理大部分破坏性变更。

## 常见踩坑

### 1. Hydration mismatch

**症状**：浏览器 console 警告 "Hydration completed but contains mismatches" 或元素被替换。

**原因**：服务端渲染的 HTML 与客户端预期不一致。常见：

- `new Date()` / `Math.random()` 在 component body
- `window` / `document` 在 component body（应在 `onMount` / `$effect`）
- 用户 agent / cookies 判断渲染不同内容
- 第三方库 (如 `<canvas>`) 改了 DOM

**解决**：

```svelte
<script lang="ts">
  import { browser } from '$app/environment';
  let now = $state<Date | null>(null);

  $effect(() => {
    if (browser) now = new Date();
  });
</script>

{now ? now.toLocaleString() : '...'}
```

或用 `<svelte:options>`：

```svelte
<!-- 跳过 SSR -->
<svelte:options ssr={false} />
```

### 2. `load` 依赖追踪没生效

**症状**：明明改了 `?page=2`，`load` 没重跑。

**原因**：用了 `event.url.searchParams` **destructure** 出来用，SvelteKit 没法追踪。

```ts
// ❌ destructure 后丢失追踪
export const load = async ({ url }) => {
  const { searchParams } = url;
  const page = searchParams.get('page');
  // ...
};

// ✅ 直接访问 url
export const load = async ({ url }) => {
  const page = url.searchParams.get('page');
};
```

或显式 `depends`：

```ts
export const load = async ({ depends }) => {
  depends('paginated:list');
  // ...
};
// 客户端 invalidate('paginated:list')
```

### 3. SSR 状态共享陷阱

**症状**：用户 A 提交的数据，用户 B 看到了。

**原因**：服务端代码用了**模块级变量**存状态。SSR 时模块在用户之间共享。

```ts
// ❌ 灾难性的设计
// src/lib/server/cache.ts
let cachedUser = null;          // 所有请求共享！

export function getCachedUser() {
  return cachedUser;
}

export function setCachedUser(u) {
  cachedUser = u;
}
```

**解决**：

- 数据放 `event.locals`（请求级）
- 全局缓存用专门工具（Redis / KV）+ 明确 key

```ts
// ✅ 走 hooks + locals
export const handle = async ({ event, resolve }) => {
  event.locals.user = await getUser(event.cookies.get('sessionid'));
  return resolve(event);
};
```

### 4. Form action `enhance` 提交后 form 没重置

**症状**：`use:enhance` 后字段值还在。

**原因**：默认 `enhance` 只重置非 file input，且只在没有 redirect/error 时。

**解决**：

```svelte
<form use:enhance={() => {
  return async ({ result, update, formElement }) => {
    if (result.type === 'success') {
      formElement.reset();
    }
    await update();
  };
}}>
```

或用 `await update({ reset: true })`（默认行为）。

### 5. Cookie 在客户端 fetch 时丢

**症状**：客户端 `fetch('/api/...')` 没带 cookie。

**原因**：跨子域或 SameSite 限制。

**解决**：

- 同源 / 子域：`fetch(url, { credentials: 'include' })`
- 跨站：cookies 要 `sameSite: 'none' + secure: true`
- Server load 里用 `event.fetch` 自动转发 cookie

### 6. `+page.server.ts` 改了但 page 没刷新

**症状**：dev 改了 server load，但页面用的还是旧数据。

**原因**：HMR 对 `+page.server.ts` 的处理仅推服务端，不自动 invalidate 客户端 data。

**解决**：

- 浏览器手动刷新
- 或 `invalidateAll()` 一次

### 7. `+page.svelte` 用 `await import()` 导入 server-only 模块

```svelte
<!-- ❌ 编译报错 -->
<script>
  if (someCondition) {
    const { db } = await import('$lib/server/db');
  }
</script>
```

**原因**：SvelteKit 静态分析 import 链，server-only 模块不能被客户端可达模块 import（即使是动态 import）。

**解决**：把逻辑放 server load 里。

### 8. `tsconfig.json` 报错说找不到 `$lib`

**原因**：`.svelte-kit/tsconfig.json` 没生成（脚手架还没跑过 dev / build / `svelte-kit sync`）。

**解决**：

```bash
pnpm dev      # 或
pnpm exec svelte-kit sync
```

### 9. CSS `@apply` / Tailwind 在组件作用域里不生效

**原因**：Svelte 的 `<style>` 默认作用域隔离，Tailwind 类**不在生成的 CSS 选择器范围**。

**解决**：

- 在 `app.css` 全局写 Tailwind utility
- 或 `<style global>` 但谨慎污染
- 或用 `:global(.tailwind-class)` 包

### 10. `+server.ts` GET 默认缓存？

**误解**：不像 Next.js 15 之前的 GET handler，SvelteKit 的 `+server.ts` 默认**不缓存**。要缓存自己设 `cache-control`：

```ts
export const GET: RequestHandler = async ({ setHeaders }) => {
  setHeaders({ 'cache-control': 'public, max-age=3600' });
  return json(data);
};
```

或导出 `export const prerender = true;` 在构建期生成静态文件。

### 11. `enhanced:img` plugin 顺序错

**症状**：`<enhanced:img>` 没被转换，浏览器报 unknown element。

**解决**：`enhancedImages()` **必须在 `sveltekit()` 之前**：

```ts
// ✅
export default defineConfig({
  plugins: [enhancedImages(), sveltekit()]
});
```

### 12. Cloudflare Workers `fs` 找不到

**原因**：CF 无 Node fs。

**解决**：

- 静态文件用 `read` from `$app/server`
- 或用 `import.meta.glob` Vite 静态注入
- 或 prerender 后走 CDN

### 13. `process.env` 在客户端是 undefined

**原因**：客户端没 `process` 对象。

**解决**：用 `$env/*` 系列模块，由 Vite 编译时 inline。

```ts
// ❌
const url = process.env.PUBLIC_API_URL;

// ✅
import { PUBLIC_API_URL } from '$env/static/public';
```
