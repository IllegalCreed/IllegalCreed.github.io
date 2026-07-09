---
layout: doc
---

# Qwik

Builder.io 团队（Miško Hevery，Angular 原作者）打造的「**Resumable 元框架**」，以「**HTML 序列化执行状态而非 hydration**」为核心理念。Qwik 是目前唯一在工业级生产中实现「**真·零 JavaScript 启动**」的框架——传统 SSR + Hydration 方案（React / Vue / Solid / Svelte）启动时必须下载并执行整棵组件树以重建 listener 位置和应用状态（即 hydration），而 Qwik 把这些信息**全部序列化到 HTML 属性**中（如 `<button on:click="./chunk.js#handler">`），浏览器只需要一个 ~1KB 的 Qwikloader 监听全局事件即可——交互发生时再按需 fetch 对应代码块。**`$` 后缀**（如 `component$` / `onClick$` / `useTask$`）是 Optimizer 的 lazy boundary 标记——编译时自动把这些函数拆分到独立 chunk 中、生成 QRL 引用，实现真正的细粒度按需加载。配套的 **Qwik City** 是元框架层，提供基于文件的路由（`src/routes/`）、`routeLoader$`（服务器数据加载）、`routeAction$`（表单 + 副作用）、`server$`（RPC 风格调用）、middleware、SSG/SSR/Edge 部署适配器（Vercel / Cloudflare / Netlify / Node / Deno / Bun / AWS Lambda 等十多种）。**Qwik 2.0**（开发中）将整合 Qwik + Qwik City 并使用 `@qwik.dev/*` 包名；目前生产用 1.x 版本（`@builder.io/qwik`），由 Builder.io 团队官方维护。

## 评价

**优点**

- **Resumability 革命性架构**：首屏 ~1KB 启动 JS（仅 Qwikloader），无需 hydration——大型应用首屏可交互时间（TTI）远低于任何 hydration 框架
- **自动 lazy loading**：`$` 标记的每个函数都成为独立 chunk，Optimizer 自动拆分；事件处理器、组件、tasks 全部按需加载，无需开发者操心 bundle size
- **细粒度响应式**：基于 Signals 的细粒度更新——只有依赖某 signal 的 DOM 节点 / 组件会重渲染，不是整树 reconcile
- **JSX + TSX**：语法对 React/Solid 开发者友好（用 `class` 而非 `className`，事件用 `onClick$` 而非 `onClick`）
- **服务器函数完善**：`routeLoader$` / `routeAction$` / `server$` 三件套覆盖数据加载 / 表单 / RPC 全场景；`server$` 提供 RPC 风格的客户端→服务器调用，自动生成端点
- **无表单 JS 也可用**：`<Form>` 组件结合 `routeAction$` 支持无 JS 提交（progressive enhancement），符合 web 标准
- **多端部署**：官方适配器覆盖 Vercel Edge / Cloudflare Workers / Netlify Edge / Node Express / Deno / Bun / AWS Lambda / Azure SWA / Firebase / Google Cloud Run / GitHub Pages（SSG）等
- **Image Optimization 内置**：`vite-imagetools` 零运行时图片优化（自动 webp / 响应式 srcset / 防 CLS），可选 `@unpic/qwik` 集成各大 CDN
- **背书**：Builder.io 自己的 PaaS / CMS 完全基于 Qwik，是生产验证的「dogfooding」框架

**缺点**

- **心智模型独特**：Resumability + 序列化要求所有跨 `$` 边界的闭包必须可序列化（`const` 声明 + 可序列化值）——这是新手最大的坑
- **`$` 后缀污染**：所有事件、生命周期、组件都需要 `$` 后缀，初学者难以分辨「为什么有的函数要 `$` 有的不要」
- **生态规模有限**：相比 React / Vue / Svelte，社区组件库、教程、招聘市场都小一个数量级
- **不可序列化值需 `noSerialize`**：第三方库（如 Monaco / Three.js）实例必须 `noSerialize()` 包装，SSR 后 client 端要重新初始化
- **`useVisibleTask$` 是反模式**：官方明确说「**最后手段**」——客户端 eager 执行违背 Resumability 理念；但 DOM 操作 / 第三方库初始化只能用它
- **Server / Client 状态同步**：服务器端创建的 Signal 在 client 端恢复后，需重新订阅响应式；某些 Date / Map / Set 实例的序列化行为需要特别注意
- **Qwik 2.0 迁移在即**：2.x 将切换包名为 `@qwik.dev/core`，目前 1.x 的代码未来需要迁移
- **调试体验弱于 React DevTools**：Qwik DevTools 仍在完善；Resumability 让传统 React DevTools 那样的「组件树 + state 探查」难以实现
- **vs Astro / Remix / Solid Start**：Astro 用 Island 架构实现「部分 hydration」；Solid Start 用 Solid 的细粒度响应式；Qwik 是「无 hydration」——三者解决同一类问题但路径完全不同

## 文档地址

[Qwik 官网](https://qwik.dev/) | [Qwik 文档](https://qwik.dev/docs/) | [Qwik City 文档](https://qwik.dev/docs/qwikcity/) | [Qwik 教程](https://qwik.dev/tutorial/) | [Qwik Playground](https://qwik.dev/playground/)

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=qwik" target="_blank" rel="noopener noreferrer">Qwik 测试题</a>


## GitHub 地址

[QwikDev/qwik](https://github.com/QwikDev/qwik)

## 学习路径

- [入门](./getting-started.md)：创建 Qwik 项目 / 项目结构 / 第一个 `component$` / `useSignal` / 第一个路由 / `routeLoader$` / `routeAction$` / Qwik vs Qwik City / `$` 后缀的真正含义
- [指南](./guide-line.md)：Resumability 原理 / Lazy Loading 边界 / Signals 响应式 / Tasks 全集 / Server Functions / Loaders / Actions / Middleware / Adapter / Image Optimization / Resumability vs Hydration 深度对比 / 常见踩坑
- [参考](./reference.md)：API 速查 / 文件约定 / 命名约定 / 配置选项 / 常见 import 来源
