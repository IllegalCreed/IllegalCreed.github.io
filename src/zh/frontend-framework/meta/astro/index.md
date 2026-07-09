---
layout: doc
---

# Astro

内容驱动型多框架元框架（content-focused multi-framework meta-framework）。建在 Vite 之上，把"零运行时静态站"升级成「文件路由 + Islands Architecture（默认 0 JS）+ Content Collections + Server Islands + Actions + View Transitions + 多框架混用（React / Vue / Svelte / Solid / Preact / Lit）+ SSR / SSG / On-demand + Adapter 多平台部署」一整套。Astro 5（2024.12）是分水岭版本：**Content Layer API** 取代 v2 collections、**Server Islands** 让"静态壳 + 动态条带"原生协作、**`astro:env`** 提供类型安全的环境变量、`output: 'hybrid'` 合并进 `'static'`、`Astro.glob()` 被 `import.meta.glob()` 取代。Astro 6（2025.10）继续清理（`<ViewTransitions />` → `<ClientRouter />`、`legacy.collections` 完全移除、Node ≥ 22.12），但 5.x 的核心理念基本沿用。

## 评价

**优点**

- **默认 0 JavaScript**：`.astro` 文件在服务端编译为 HTML，浏览器收到的就是纯 HTML/CSS；只有显式打 `client:*` 的 island 才送 JS。同体量内容站，TTI / Lighthouse 通常比 Next.js / Nuxt 高 20-40 分
- **Islands Architecture 原生支持**：客户端 island（`client:load` / `client:idle` / `client:visible` / `client:media` / `client:only`）+ 服务端 island（`server:defer` + fallback）双轨制；前者按需 hydrate、后者按需流式补齐，缓存模型清晰
- **多框架混用**：同一页可以同时 import React、Vue、Svelte、Solid、Preact 组件并独立 hydrate；适合"主力 React、个别交互复用 Vue 组件"或"团队迁移过渡期"
- **Content Collections + Content Layer**：原生支持 `.md` / `.mdx` / `.json` / `.yaml`，Zod schema 校验 frontmatter 类型，自动生成 `getCollection()` 的 TypeScript 类型；5.0 引入的 Content Layer 还能 `loader: glob(...)` / `loader: file(...)` / 自定义远程 loader
- **Server Islands**：用 `server:defer` 给个别组件加 fallback，主壳秒出 + CDN 缓存；服务端 island 异步拉数据填进去，原生协议（无需 SSE / RSC 边界传染）
- **Adapter 解耦部署**：`@astrojs/node` / `@astrojs/vercel` / `@astrojs/netlify` / `@astrojs/cloudflare`，同一份代码切换；`output: 'static'` 默认 + 个别页 `export const prerender = false` 即"按需服务端"
- **View Transitions**：`<ClientRouter />` 一行接入 MPA → SPA 体验；`transition:name` / `transition:animate` / `transition:persist` 三个指令搞定首页 hero 跨页过渡和持久播放器
- **astro:env**：用 `envField.string({ context: 'server', access: 'secret' })` 在 `astro.config.mjs` 里定义带类型 / 必填 / 默认值的环境变量；client / server 双 namespace 区分泄露风险

**缺点**

- **不适合重交互 SPA**：Islands 之间状态隔离（每个 island 是独立 React/Vue/Svelte 实例），无统一 store；做 dashboard / SaaS 仍需主力选 Next.js / SvelteKit / Nuxt
- **`.astro` 文件不能用 React hooks / Vue Composition API**：frontmatter 只能写纯 TS，组件内不能 `useState`；要 hook 必须切到 framework component + `client:*`
- **Islands 的 props 必须可序列化**：传函数 / 类实例 / 闭包过 island 边界会报错；要交互复杂的状态共享得用 Nano Stores / Zustand 等跨 island 库
- **`client:only` 仍要指定框架**：`<MyChart client:only="react" />` —— Astro 编译时不知道你用哪个框架，必须显式标注
- **Server Islands props 走 URL query**：默认 GET 加密；超过 2048 字节自动转 POST（破坏 CDN 缓存）。复杂 props 直接砍 server island 缓存
- **Astro 5 → 6 破坏性变更不少**：`<ViewTransitions />` → `<ClientRouter />`、legacy collections 完全移除、`entry.slug` / `entry.render()` 改 `entry.id` / 独立 `render()`、Node 22.12+；Zod v4 / Vite 7 / Shiki 4 都升大版本

## Astro 5 关键变化（vs 4.x）

- **Content Layer API**：取代 v2 collections；`defineCollection` 接 `loader: glob(...)` / `loader: file(...)` / 自定义 loader；`src/content/config.ts` → `src/content.config.ts`
- **Server Islands**：`server:defer` 指令 + `slot="fallback"` 实现"页面瞬出 + 动态条带异步补齐"；缓存友好
- **`astro:env`**：`envField.string({ context, access })` 定义类型安全环境变量；从 `astro:env/client` / `astro:env/server` 导入
- **Sessions**（5.7+）：`Astro.session.get()` / `set()` / `regenerate()`；`session.driver` 配 Redis / 文件系统等
- **`output: 'hybrid'` 移除**：合并进 `'static'`，单页用 `export const prerender = false` 就行；语义化更清晰
- **`Astro.glob()` 移除**：用 `import.meta.glob()` 替代
- **`<ViewTransitions />` → `<ClientRouter />`**：5.5+ 改名；旧名 deprecated
- **`compiledContent()` 改 async**：必须 `await`
- **`astro:content` 不再可在客户端 import**
- **CSRF 默认开启**：`security.checkOrigin: true` 默认
- **Vite 6**、`@astrojs/mdx@4`、`@astrojs/lit` 移除、Squoosh image service 移除

## Astro 6 关键变化（vs 5.x）

- **Node 最低 22.12**（之前 18.20 / 20.3）
- **`<ViewTransitions />` 彻底移除**：必须用 `<ClientRouter />`
- **legacy collections 彻底移除**：所有 collection 必须用 Content Layer；`entry.slug` / `entry.render()` 改 `entry.id` + 独立 `render()`
- **`Astro.glob()` 彻底移除**
- **Vite 7 / Zod 4 / Shiki 4**
- **`i18n.routing.redirectToDefaultLocale` 默认 false**（之前 true）
- **`<script>` / `<style>` 按声明顺序渲染**（之前不固定）
- **`emitESMImage()` → `emitImageMetadata()`**
- **Adapter API**：`NodeApp` deprecated → `createApp()`；`loadManifest()` / `loadApp()` deprecated；`app.render()` 旧签名移除
- **`astro:schema` 和 `z` from `astro:content` deprecated**：改 `astro/zod`
- **Experimental 标签清空**：`csp` / `fonts` / `liveContentCollections` / `preserveScriptOrder` 等稳定或删除

> 本文档默认 **Astro 5.x**（5.13+，主流生产版本）。Astro 6 的破坏性变更在「指南 - 其他」专章列出。

## 文档地址

[Astro Documentation](https://docs.astro.build/)

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=astro" target="_blank" rel="noopener noreferrer">Astro 测试题</a>


## GitHub 地址

[withastro/astro](https://github.com/withastro/astro)
