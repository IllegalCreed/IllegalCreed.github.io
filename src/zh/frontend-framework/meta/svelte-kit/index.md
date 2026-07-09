---
layout: doc
---

# SvelteKit

Svelte 官方维护的全栈元框架。建在 Svelte 之上，把"编译型 UI 库 Svelte"升级成「文件路由 + Universal/Server `load` + Form Actions + Hooks + SSR / SSG / SPA / Streaming + 服务端 API + 适配器多平台部署（Node / Vercel / Cloudflare / Netlify / Static）+ Vite HMR」一整套。SvelteKit 2.x（2024+）配合 Svelte 5（runes、`$state` / `$derived` / `$effect` / `$props`）是当前事实标准 —— 比 SvelteKit 1 + Svelte 4 的 store / `$:` reactive statement 心智模型更可预测，与 Next.js App Router、Nuxt 3 形成「React / Vue / Svelte 各自的三足鼎立」。

## 评价

**优点**

- **Svelte 5 runes 让响应式更显式**：`$state` / `$derived` / `$effect` / `$props` 用 `$`-前缀控制符替代 Svelte 4 时代的 "魔法 `let` + `$:`"，跨 `.svelte` / `.svelte.ts` 文件共享状态、TS 类型推断、组件树嵌套都一致
- **编译时框架体积近零**：Svelte 编译器把组件转成手写般的 vanilla JS，runtime 极小；首屏 HTML 体积、TTI 一般是 React/Vue 同类项目的 1/3 ~ 1/2
- **文件路由清晰**：`+page.svelte` / `+page.ts` / `+page.server.ts` / `+layout.*` / `+server.ts` / `+error.svelte` 后缀显式标注角色 —— 不像 Next.js App Router 必须靠文件名约定 + RSC 边界区分服务端/客户端
- **`load` 函数极规整**：Universal `+page.ts`（双端跑）+ Server `+page.server.ts`（仅服务端，可拿数据库 / 私密 env）两种 load，parent / depends / invalidate API 完整；返回的 data 类型通过自动生成的 `$types` 全链路推断
- **Form Actions + Progressive Enhancement**：`<form action="?/login" method="POST">` 默认无 JS 也能跑；加 `use:enhance` 自动升级 SPA 体验；天然契合「先 HTML、再 JS」的渐进式哲学
- **适配器架构清晰**：`@sveltejs/adapter-node` / `adapter-vercel` / `adapter-cloudflare` / `adapter-netlify` / `adapter-static` 同一份代码切换部署目标，比 Next.js 的 `output: 'standalone'` 思路更解耦
- **基于 Vite + Web Standards**：`Request` / `Response` / `Headers` / `FormData` / `URL` / `crypto` 等 Web API，零运行时锁定；Vite 5 + HMR + Rolldown 路线已确定

**缺点**

- **生态规模仍小于 React/Vue**：UI 库（虽有 shadcn-svelte、Skeleton、Bits UI）、SaaS SDK、招聘岗位都比 Next.js / Nuxt 少；中文社区资料、第三方教程稀
- **Svelte 4 → 5 是大跨越**：从 reactive declaration (`$:`) / store (`writable` / `readable`) 迁到 runes 不仅是语法替换，是心智重构；旧库 / 旧文档 / Stack Overflow 答案大量是 Svelte 4 写法
- **runes 只能在 `.svelte` / `.svelte.ts` 用**：普通 `.ts` 文件用不了 `$state`；要跨模块共享响应式状态必须改后缀，与 Vue Composition API 的"任意 `.ts` 都能 `ref()`"不同
- **SvelteKit 1 → 2 也有破坏性变更**：`error()` / `redirect()` 不再 throw、`cookies.set()` 必须传 `path`、load 中 top-level promise 不再自动 await、`use:enhance` 回调 `data`/`form` 改成 `formData`/`formElement` 等等；维护项目升级成本不小
- **`$app/stores` deprecated → `$app/state`**：SvelteKit 2.12+ 引入 runes-based `$app/state`（导出 `page` / `navigating` / `updated`）替代 `$app/stores`（`$page` / `$navigating` / `$updated`）—— 老代码全部需要替换
- **远程函数（Remote Functions）仍 experimental**：`query` / `command` / `form` / `prerender` 提供 RPC-like 端到端类型安全，但仍需在 `svelte.config.js` 显式 `experimental: { remoteFunctions: true }` 开启

## SvelteKit 2 关键变化（vs SvelteKit 1）

- **`error()` / `redirect()` 不再需要 `throw`**：直接 `error(404, '...')` / `redirect(303, '/login')` 即可；要在 try/catch 里区分用 `isHttpError` / `isRedirect` 判断
- **`cookies.set()` / `cookies.delete()` 必须传 `path`**：基本都用 `path: '/'`
- **load 函数 top-level promise 不再自动 await**：要并行用 `Promise.all`，要串行显式 `await`；从而避免 N+1 waterfall
- **`goto()` 不接受外部 URL**：跳外站用 `window.location.href`
- **`use:enhance` 回调 `data`/`form` 改成 `formData`/`formElement`**
- **Vite 5 / Svelte 4+（5 推荐）/ TypeScript 5 / Node 18.13+ / `@sveltejs/vite-plugin-svelte@3` peer dep**
- **`$app/stores` deprecated（2.12+）**：迁到 `$app/state`，去掉 `$` 前缀
- **`vitePreprocess` 改从 `@sveltejs/vite-plugin-svelte` 导入**

## Svelte 5 runes 关键变化（vs Svelte 4）

- **响应式声明**：`let count = 0` + `$: doubled = count * 2` → `let count = $state(0)` + `let doubled = $derived(count * 2)`
- **生命周期 / 副作用**：`onMount` + `$:` 副作用 → `$effect(() => { ... })`，可返回 cleanup
- **Props 声明**：`export let foo` → `let { foo } = $props()`，含默认值、rest、重命名
- **Store**：`writable(0)` / `$count` → 一般场景可改用 `$state(0)`；store 仍兼容
- **跨文件共享状态**：从 `.ts` 改成 `.svelte.ts`，里面用 `$state`/`$derived` 自由 export
- **`{@render children()}`**：替代 Svelte 4 的 `<slot>`，配合 `Snippet` 类型

## 文档地址

[SvelteKit Documentation](https://svelte.dev/docs/kit)、[Svelte Documentation](https://svelte.dev/docs/svelte)

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=sveltekit" target="_blank" rel="noopener noreferrer">SvelteKit 测试题</a>


## GitHub 地址

[sveltejs/kit](https://github.com/sveltejs/kit)、[sveltejs/svelte](https://github.com/sveltejs/svelte)
