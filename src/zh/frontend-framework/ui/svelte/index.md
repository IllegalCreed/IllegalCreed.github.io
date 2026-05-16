---
layout: doc
---

# Svelte

Rich Harris 2016 年开源、目前由其本人在 Vercel 全职维护的「**编译器框架**」——和 React / Vue 把响应式追踪、Virtual DOM diff 这些工作放在 runtime 不同，Svelte 把组件在**构建时**编译成精简的命令式 JavaScript，运行时仅留下最小化的响应式胶水代码，没有 Virtual DOM、没有 reconciler、没有运行时 diff。这个「**编译器即框架**」的路线让 Svelte 在 bundle 体积、首屏性能、内存占用上都领先一档；同时模板语法保持接近 HTML 原生写法，初学者上手成本极低。Svelte 5（2024.10 稳定）引入了**Runes**（`$state` / `$derived` / `$effect` / `$props` / `$bindable` / `$inspect` / `$host`），把 Svelte 4 时代隐式的 `let count = 0` 改成显式的 `let count = $state(0)`——这是一次根本架构升级，把响应式从「编译器静态分析变量声明」改成「运行时基于 signals 的细粒度追踪」，原理与 Solid / Vue 3 Composition API 更接近，但保留了 Svelte 模板的极简写法。配套元框架 **SvelteKit**（基于 Vite，类比 Vue 的 Nuxt / React 的 Next.js）提供文件路由、SSR、Server Functions、表单 Actions 与多种部署 adapter（Node / Static / Vercel / Cloudflare / Netlify），与 Svelte 一起构成完整的全栈方案。

## 评价

**优点**

- **编译时优化极致**：模板编译成命令式 DOM 操作，无 Virtual DOM、无 diff 算法，运行时代码量比 React / Vue 少一个数量级；Hello World 应用 gzip 后通常 <10 KB（React 同等约 45 KB+）
- **心智模型最简**：组件文件就是「**`<script>` + 模板 + `<style>`**」三段式，模板用接近 HTML 的写法（`{}` 表达式、`{#if}` / `{#each}` 控制流），没有 JSX 也没有 Vue 模板指令的 `v-` 前缀；初学者一天就能写出真实组件
- **Runes 设计优雅**：Svelte 5 的 `$state` / `$derived` / `$effect` 与 React Hooks / Vue Composition API 同级抽象，但 API 更少（5-7 个 Runes vs React 20+ Hooks）；无依赖数组、无 Rules of Hooks
- **响应式细粒度**：基于 signals（与 Solid / Preact Signals 同思路），状态变更只更新相关 DOM 节点，不需要重新执行组件函数；天然性能优势
- **样式 Scoped 内置**：`<style>` 默认作用域到当前组件，不需要 CSS Modules / styled-components / Tailwind 那种额外的工具；`:global()` 显式开洞
- **SvelteKit 元框架成熟**：文件路由、SSR、Server-only modules、Form Actions、type-safe loaders、多 adapter 部署一应俱全；与 SolidStart / Astro / Remix 同档
- **过渡与动画一等公民**：内置 `transition:` / `in:` / `out:` / `animate:` 指令，零依赖实现 fade / fly / slide / scale / crossfade 等动画
- **官方文档质量高**：[svelte.dev](https://svelte.dev/) 的交互式 Tutorial 让用户在浏览器里跑代码学习，是行业标杆之一

**缺点**

- **生态规模较小**：UI 库（Skeleton UI / shadcn-svelte / Flowbite Svelte / SVAR / Svelte Material UI）数量比 React 少 10 倍，企业级深度组件库（如类似 AG Grid / Material UI 那种规模）较少
- **Svelte 5 迁移成本**：从 Svelte 4 的 `let count = 0` + `$:` reactive statement 迁移到 Runes 心智不同；旧项目升级需要逐文件改写（官方提供 `npx sv migrate svelte-5`）
- **招聘市场偏小**：北美 / 欧洲 / 国内 Svelte 候选人都比 React / Vue 少一个数量级；企业落地选 Svelte 时招人困难
- **TypeScript 集成历史包袱**：Svelte 模板里的类型推导（如 `bind:`、`on:` 在 Svelte 4 时代）一直不够顺；Svelte 5 + svelte-check 配合 vue-tsc 同款方案才补齐
- **SvelteKit 强绑定**：SSR 几乎只有 SvelteKit 一条路（不像 React 的 Next.js / Remix / Astro / TanStack Start 多选项），生态集中度高
- **跨端方案弱**：Svelte Native（基于 NativeScript）社区维护已久未活跃，移动端跨端用 Capacitor / Tauri（共用 Web 视图），不像 React Native 那样有原生编译方案
- **Signal-based reactivity 调试稍难**：与 Vue 3 Proxy / React render 模型相比，Svelte 5 的细粒度 signal 在 DevTools 里追问「为什么这个值更新了」需要 `$inspect.trace()` 辅助

## 文档地址

[Svelte](https://svelte.dev/)

## GitHub 地址

[sveltejs/svelte](https://github.com/sveltejs/svelte)

## 幻灯片地址

<a href="/SlideStack/svelte-slide/" target="_blank">Svelte</a>
