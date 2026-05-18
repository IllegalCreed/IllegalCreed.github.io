---
layout: doc
outline: [2, 3]
---

# 指南 - 其他

> 生态对比、版本迁移、常见踩坑

## 速查

- **vs Next.js**：Astro 默认 0 JS / 多框架 / 内容站强；Next.js 重交互 / RSC / 单一 React
- **vs Nuxt**：Astro 多框架 / Islands；Nuxt 单一 Vue / 路由更精细 / Module 多
- **vs SvelteKit**：Astro 多框架 / 内容站；SvelteKit 单一 Svelte / SPA 强 / Form Actions
- **vs Remix / React Router 7**：理念都基于 Web Standards；Remix 偏 SPA、Astro 偏 MPA
- **Astro 4 → 5**：Content Layer 取代 v2 collections；Server Islands；`astro:env`；Vite 6；`output: 'hybrid'` 合并进 `'static'`；`Astro.glob` 删；`<ViewTransitions>` 改名
- **Astro 5 → 6**：Node ≥ 22.12；legacy collections 彻底删；`<ViewTransitions>` 彻底删；`entry.slug` / `entry.render()` 删；Vite 7 / Zod 4 / Shiki 4
- **常见踩坑**：`.astro` 顶层不能用 React hooks；`client:only` 必须指定框架；island 间状态隔离；Server Islands props 必须可序列化 + ≤ 2KB；`<script>` 不能直接读 frontmatter 变量

## 与 Next.js 对比

| 维度 | Astro | Next.js |
|---|---|---|
| 底层 UI | `.astro` 模板 + 任意框架混用 | React 19 + RSC |
| 默认 JS | **0 JS**（按需 island） | 包含 React runtime + RSC framework |
| Bundle 体积（首屏） | ~0-30KB | ~80-120KB |
| 渲染模型 | Static + on-demand + Server Islands | SSR / SSG / ISR + RSC + Streaming + PPR |
| 数据获取 | frontmatter `await fetch()` + Content Collections | RSC 里直接 `async/await` + `fetch` 缓存 |
| 表单 | Actions（type-safe RPC） | Server Actions |
| 路由 | `src/pages/` 文件路由 | `app/` 文件路由 + RSC 边界 |
| 多框架支持 | React / Vue / Svelte / Solid / Preact / Lit 混用 | 仅 React |
| Content 处理 | 一等公民（Content Layer + MD / MDX / JSON / YAML） | 第三方（`next-mdx-remote` / `contentlayer` 等） |
| 部署 | Static / Adapter 切换（Node / Vercel / Netlify / Cloudflare） | Vercel 首发 / Node / Docker / Cloudflare |
| 学习曲线 | 低-中（`.astro` 几小时上手；Content Layer 有学习成本） | 中-高（RSC + 缓存 + `'use client'` 传染） |
| 招聘市场 | 较小 | 大 |

**选 Astro 的场景**：

- 内容站（博客、文档、营销页、Marketing）
- 性能敏感（Lighthouse 高分要求）
- 多框架团队（"React 主业但有人喜欢 Vue 组件"）
- 不愿学 RSC 心智模型

**选 Next.js 的场景**：

- React 团队 / 招聘 React
- 重交互 SaaS / Dashboard
- 需要 RSC / Server Actions / Suspense 等 React 19 生态
- Vercel 全栈一体化

## 与 Nuxt 对比

| 维度 | Astro | Nuxt |
|---|---|---|
| 底层 UI | 多框架 | 仅 Vue 3 |
| 默认 JS | 0 JS | 包含 Vue runtime + Nuxt framework |
| Auto-import | 否（除 `Astro` / `astro:*` 模块） | 全自动（components / composables / utils） |
| 状态 | Nano Stores（跨 island） | Pinia / `useState` |
| 数据 | frontmatter `await` / Content Collections | `useFetch` / `useAsyncData` / Server Routes |
| 路由 | 文件路由 + 端点 + `getStaticPaths` | 文件路由 + `definePageMeta` + 中间件 |
| Module 生态 | 800+ integrations（多数小） | nuxt-content / nuxt-image / @nuxtjs/sitemap / 国际化等（大且精） |
| 部署 | Adapter | Nitro（统一 server，支持 12+ 平台） |
| Content 处理 | Content Layer（5.0 重写） | nuxt-content（v3 也重写为类似 model） |

**选 Astro**：多框架混用、Islands 0 JS、内容站。

**选 Nuxt**：纯 Vue 团队、auto-import 提效、Nitro 跨平台部署。

## 与 SvelteKit 对比

| 维度 | Astro | SvelteKit |
|---|---|---|
| 底层 UI | 多框架 | 仅 Svelte 5 |
| 默认 JS | 0 JS | Svelte runtime（极小，但每页都有 hydrate） |
| 数据 | frontmatter / Content Collections | `+page.ts` / `+page.server.ts` load |
| 表单 | Actions（4.15+） | Form Actions + `use:enhance` |
| Server 模型 | Server Islands + on-demand | SSR + Universal load + Server load |
| 路由 | `src/pages/*.astro` | `src/routes/+page.svelte` |
| Content 处理 | 内置 Content Collections | mdsvex（第三方） |
| 部署 | Adapter | Adapter |

**选 Astro**：内容驱动 / 多框架。

**选 SvelteKit**：交互应用 / Svelte 团队 / 编译时 runtime。

## 与 Remix / React Router 7 对比

Remix 2024.5 并入 React Router v7（framework mode）。

| 维度 | Astro | Remix / RR v7 |
|---|---|---|
| 默认范式 | MPA（Multi-Page） | SPA-leaning（带 SSR） |
| 默认 JS | 0 JS | React runtime |
| 路由 | `src/pages/` | `app/routes/` |
| Loader / Action | `frontmatter await` + Actions | `loader` + `action` |
| 渐进增强 | View Transitions + 原生 form | `<Form>` + `useFetcher` |

**选 Astro**：MPA / 内容站 / 多框架。

**选 Remix/RR v7**：React 团队 + 重 form / nested routing / loader / action 模型偏好。

## Astro 4 → 5 升级

最大变化是 **Content Layer**、**Server Islands**、**`astro:env`**。

### Content Layer

**之前（v2 collections）**：

```ts
// src/content/config.ts
const blog = defineCollection({
  type: 'content',   // 或 'data'
  schema: z.object({ title: z.string() }),
});
```

**之后（Content Layer）**：

```ts
// src/content.config.ts （路径改了）
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({ title: z.string() }),
});
```

迁移：

1. `src/content/config.ts` → `src/content.config.ts`
2. 加 `loader: glob({...})`，去掉 `type: 'content' | 'data'`
3. `entry.slug` → `entry.id`（5.x 还兼容，6.x 移除）
4. `entry.render()` → `import { render } from 'astro:content'; await render(entry)`
5. （过渡）暂时用 `legacy: { collections: true }` 维持 v2 行为

### `<ViewTransitions />` → `<ClientRouter />`

```astro
<!-- v4 -->
import { ViewTransitions } from 'astro:transitions';
<ViewTransitions />

<!-- v5 -->
import { ClientRouter } from 'astro:transitions';
<ClientRouter />
```

旧名在 5.x 仍可用（deprecated），6.x 移除。

### `output: 'hybrid'` 删除

合并进 `'static'`：

```js
// v4
export default defineConfig({ output: 'hybrid', adapter: node() });

// v5
export default defineConfig({ output: 'static', adapter: node() });
// 单页加 export const prerender = false 即按需 SSR
```

### `Astro.glob` 删除

```ts
// v4
const posts = await Astro.glob('./posts/*.md');

// v5
const posts = Object.values(import.meta.glob('./posts/*.md', { eager: true }));
```

更推荐：用 Content Collections + `getCollection()`。

### `compiledContent()` 异步

```ts
// v4
const html = post.compiledContent();   // 同步

// v5
const html = await post.compiledContent();   // 必须 await
```

### `astro:content` 不可在客户端

不能在 `.tsx` / `.vue` 等 framework component 里直接 `import { getCollection } from 'astro:content'`，必须在 frontmatter 里拿数据后通过 props 传。

### CSRF 默认开启

```js
// v5 默认
security: { checkOrigin: true }
```

要兼容老 form 提交，显式关闭：

```js
security: { checkOrigin: false }
```

### 其他

- Vite 6（之前 Vite 5）
- `@astrojs/mdx@4`（之前 3.x）
- `@astrojs/lit` 移除（Lit 集成挪到社区）
- Squoosh image service 移除（只剩 Sharp）
- Script 不再 hoist 到 `<head>`，多个 script 不再 bundle 到一起
- `injectRoute` 行为微调

### 自动迁移

```bash
npx @astrojs/upgrade
```

会改 package.json + 装新版 + 提示破坏性变更。

## Astro 5 → 6 升级（最新）

### Node 22.12+

放弃 Node 18 / 20，必须 ≥ 22.12.0。

### `<ViewTransitions />` 彻底移除

必须用 `<ClientRouter />`。

### Legacy collections 彻底移除

```js
// 删掉
legacy: { collections: true }
```

必须迁到 Content Layer。同时：

- `entry.slug` 删 → `entry.id`
- `entry.render()` 删 → `await render(entry)`
- `getDataEntryById()` / `getEntryBySlug()` 删 → `getEntry()`

### `Astro.glob` 彻底移除

用 `import.meta.glob` 或 Content Collections。

### Image API

- `emitESMImage()` → `emitImageMetadata()`
- 默认服务**默认 crop**（不需要 `fit`）
- 图片**永不放大**（默认服务）
- Responsive image 改用 `data-*` 属性而不是 inline style

### Adapter API

- `NodeApp` deprecated → `createApp()`
- `loadManifest()` / `loadApp()` deprecated
- `app.render()` 旧签名删 → 必须 `{ routeData, locals }` object
- `entryPoints` from `astro:build:ssr` 删
- `astro:ssr-manifest` 虚拟模块删 → `astro:config/server`

### Zod 4 / Vite 7 / Shiki 4

```ts
// 旧
import { z } from 'astro:schema';
import { z } from 'astro:content';

// 新（6.x）
import { z } from 'astro/zod';
```

Shiki 4：themes 配置 API 微调。Vite 7：plugins 接口基本兼容。

### Endpoint 文件扩展名 + trailing slash

`src/pages/data.json.ts` 现在**不能**用 trailing slash：访问必须是 `/data.json`，不能 `/data.json/`。

### i18n

`routing.redirectToDefaultLocale` 默认 `false`（之前 `true`）。原行为想保留，显式设 `true`。

### Markdown heading ID

不再去掉末尾连字符（`my-heading-` 现在保留，之前会被剥成 `my-heading`）。

### Experimental flags 清空

`csp` / `fonts` / `liveContentCollections` / `preserveScriptOrder` / `staticImportMetaEnv` / `headingIdCompat` / `failOnPrerenderConflict` 都不再是 experimental（要么默认开、要么直接删）。

### 升级

```bash
npx @astrojs/upgrade
```

## 何时选择 Astro

**强烈推荐**：

- 个人 / 公司博客
- 文档站点（API docs / handbook / changelog）
- 营销 landing page / 产品官网
- 文章型 / 内容型 SaaS（如 CMS 配套站）
- 多框架团队（React + Vue 历史包袱）

**也合适**：

- 中小型 SPA + 内容混合站（"主站 0 JS + 后台 React"）
- 静态导出后丢 CDN 的 PWA
- 含少量个性化的电商首页（用 Server Islands）

**不推荐**：

- 重交互应用（dashboard / SaaS 后台 / IDE）→ Next.js / SvelteKit / Nuxt
- 实时协同 / 复杂客户端状态 → SPA 框架直接上
- 仅前端无 SSR 需求 → Vite + 任意 SPA 框架就够

## 常见踩坑

### `.astro` 顶层不能用 hooks

```astro
---
// ❌ frontmatter 是服务端纯 TS，没有 React 上下文
import { useState } from 'react';
const [count, setCount] = useState(0);   // 报错
---
```

正确：写 React 组件并 import + `client:*`：

```tsx
// Counter.tsx
import { useState } from 'react';
export default function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}
```

```astro
<Counter client:load />
```

### `client:only` 必须指定框架

```astro
<!-- ❌ -->
<MapWidget client:only />

<!-- ✅ -->
<MapWidget client:only="react" />
<MapWidget client:only="vue" />
<MapWidget client:only="svelte" />
```

Astro 编译时不知道你用哪个框架，必须告诉它。

### Island 状态隔离

```astro
<Counter client:load />
<Counter client:load />
<!-- 两个独立 React app，状态互不共享 -->
```

要共享：

- 同一 island 内嵌套（一个组件包另一个）
- 或用 Nano Stores 跨 island

### Server Islands 的 props 限制

```astro
<!-- ❌ -->
<Avatar server:defer onClick={() => alert('hi')} />
<!-- 函数不能序列化 -->

<!-- ❌ -->
<Avatar server:defer user={hugeObject} />
<!-- > 2048 字节会转 POST，破坏缓存 -->

<!-- ✅ -->
<Avatar server:defer userId={123} />
<!-- 用 ID，让 island 自己去拉 -->
```

### `<script>` 不能直接读 frontmatter 变量

```astro
---
const userId = '123';
---

<!-- ❌ frontmatter 是服务端、script 是浏览器，两个完全不同的上下文 -->
<script>
  console.log(userId);   // ReferenceError
</script>

<!-- ✅ 用 define:vars -->
<script define:vars={{ userId }}>
  console.log(userId);
</script>

<!-- ✅ 或写到 data-* 属性 -->
<div id="app" data-user-id={userId}>...</div>
<script>
  const el = document.getElementById('app');
  console.log(el.dataset.userId);
</script>
```

### `getStaticPaths` 不能用 Astro 全局

```astro
---
// ❌ Astro.props 等在 getStaticPaths 里都是 undefined
export async function getStaticPaths() {
  console.log(Astro.url);   // undefined
}
---
```

`getStaticPaths` 在构建期独立执行，没有"当前请求"。

### 默认不能 hydrate `.astro`

```astro
<!-- ❌ .astro 不能加 client:* -->
<MyAstroComponent client:load />
```

要加交互，要么：

- 写 framework component
- 在 `.astro` 里直接放 `<script>`（不进 hydrate 链，但能跑代码）

### Markdown 的图片相对路径

```md
<!-- ✅ Astro 自动优化（src/ 下） -->
![alt](./hero.png)

<!-- ❌ public/ 下不优化 -->
![alt](/hero.png)
```

要优化必须从 src/ 来。

### Content Collection 名字 = 目录名

```ts
defineCollection({ loader: glob({ base: './src/content/blog' }) });
// 那么 collection 名必须是 'blog'：
export const collections = { blog: defineCollection({...}) };
```

`getCollection('blog')` 用的名字必须和 `export const collections = { 这里 }` 对上。

### `astro check` 必须装

```bash
npm install -D @astrojs/check typescript
npx astro check
```

光 `tsc --noEmit` 不能检查 `.astro` 模板。CI 必须跑 `astro check`。

### `output: 'static'` 下用 cookie 会失败

```astro
---
// ❌ 静态构建期没有"请求"
const token = Astro.cookies.get('session');
---
```

要么改 `output: 'server'`、要么加 `export const prerender = false`。

### Sharp 在 ARM Mac / Alpine Docker 安装失败

```bash
# 强制装当前平台版本
npm install --include=optional sharp

# Alpine 镜像
npm install --os=linux --libc=musl --arch=arm64 sharp
```

### Vite 6 升级后某些 plugin 不兼容

某些老 Vite 5 插件在 Vite 6 下报错（特别是 ESM CJS 互操作问题）。解决：

- 升级到该插件的最新版本
- 在 `vite.optimizeDeps.include` 或 `ssr.noExternal` 里手动加

## 学习路径建议

1. 跑 `npm create astro@latest` 选 blog 模板，看 5 分钟
2. 读 [入门](../getting-started.md)，把 minimal 例子敲一遍
3. 读 [指南 - 基础](./base.md)，把 Islands / 文件路由 / Layout 弄熟
4. 读 [指南 - 进阶](./advanced.md)，掌握 SSR / Server Islands / View Transitions
5. 按需读 [指南 - 高级](./expert.md) 的 Content Layer / DB / i18n / 部署
6. 遇到坑回来翻本页

## 参考资源

- [官方文档](https://docs.astro.build/) —— 一手最新
- [GitHub](https://github.com/withastro/astro) —— 源码 + Discussions
- [Astro Blog](https://astro.build/blog/) —— 大版本发布说明
- [Awesome Astro](https://github.com/one-aalam/awesome-astro) —— 第三方教程 / 主题 / 工具
- [Astro Studio Discord](https://astro.build/chat) —— 实时问答

## 下一步

- 全部文件约定 / `Astro` 全局对象 / 配置 / 指令速查 见 [参考](../reference.md)
