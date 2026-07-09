---
layout: doc
---

# HTMX

Carson Gross 2020 年开源、目前由其本人在 Big Sky Software 维护的「**hypermedia 驱动**」前端库——把 AJAX、CSS Transition、WebSocket、SSE 全部以 HTML 属性的形式暴露出来，让服务端**返回 HTML 片段**取代 JSON，前端只需要在元素上写 `hx-get="/users"` `hx-target="#list"` `hx-swap="innerHTML"` 这样的属性就能完成完整交互流程。这是对 90 年代 REST 论文里 **HATEOAS（Hypermedia As The Engine Of Application State）** 原则的现代复兴——和 SPA「前端拿 JSON 自己拼界面 + 自己管路由 + 自己管状态」的范式完全相反，HTMX 路线认为「**服务端早就有完整的 HTML 渲染层，前端再写一遍 SPA 是重复劳动**」，只要让 HTML 自身具备触发 HTTP 请求 + 局部替换 DOM 的能力，就能避开 JSON API + SPA 状态机器 + 前后端类型同步这一整套复杂度。HTMX 本体仅 ~14 KB（gzip），无构建步骤、无虚拟 DOM、无组件框架，与 Django / Rails / Laravel / FastAPI / ASP.NET 这种**服务端渲染 HTML 的后端**配合最自然。Carson 同时主导 [_hyperscript](https://hyperscript.org/)（HTML 内嵌的事件 DSL）项目，并和 Adam Stepinski / Deniz Akşimşek 等人合著《[Hypermedia Systems](https://hypermedia.systems/)》——把 HTMX 当作案例去重新讲述 hypermedia / REST / HATEOAS 的工程哲学。HTMX 2.0（2024）相比 1.x 移除了对 IE11 的支持、`hx-on:` 替代 `hx-on`、默认行为收紧等。

## 评价

**优点**

- **心智模型回归 HTML 原生**：不学新语言、不学新构建、不学新生命周期——会写 HTML / CSS / 后端模板（Jinja / ERB / Blade / Razor）即可上手；学习曲线对全栈/后端工程师极平缓
- **复杂度大幅下降**：没有 JSON Schema、没有前后端类型同步、没有 SPA 路由器、没有 Pinia / Redux / Zustand 状态机器、没有 Suspense / Loading 状态机；整个应用的「状态机」就是数据库 + 后端 controller
- **Bundle 体积极小**：~14 KB（gzip）一次性下载，无 chunk 分包；首屏完全交给服务端渲染，TTFB / FCP 通常优于 SPA
- **HATEOAS 工程化**：服务端返回的 HTML 同时包含「数据 + 可用动作 + 状态过渡」，前端无需查 API 文档去知道「下一步能做什么」——按钮在就能点，按钮不在就不能点
- **渐进增强**：所有 hx-get/hx-post 都基于原生 `<a>` / `<form>`，禁用 JavaScript 后仍能用（配合 `hx-boost` 和 `<noscript>` 友好降级）
- **与服务端框架天然契合**：Django views / Rails partials / Laravel Blade / FastAPI Jinja / Phoenix LiveView / ASP.NET Razor 这些「**返回 HTML 片段**」原本就是后端框架的强项，HTMX 让前端复用这一能力
- **扩展生态实用**：response-targets / idiomorph / sse / ws / preload / loading-states / class-tools / json-enc 覆盖 90% 工程需求
- **可与 Alpine.js / _hyperscript 互补**：HTMX 负责服务端通信，Alpine 处理纯客户端状态（下拉菜单 / Modal 显隐 / 表单本地校验），分工明确

**缺点**

- **不适合「高度本地状态」的应用**：图形编辑器、Excel-like 表格、3D 游戏、协同白板等需要在客户端维护大量短生命周期状态的场景，仍然是 SPA 的主场
- **离线 / PWA 弱**：每次交互都依赖服务端往返，离线优先 / 后台同步 / Service Worker 拦截这些 PWA 范式不天然适配
- **大量小请求**：用户输入 / 列表筛选 / 下拉切换都触发独立 HTTP；后端没有缓存层或 HTTP/2 多路复用时容易压力倍增
- **前端工具链断层**：没有 Vite/HMR 体验、没有 TypeScript 强类型、没有 ESLint 针对组件的规则；很多前端工程师会感觉「**回到 2005 年**」
- **测试范式不同**：单元测试组件不再有意义，主体是端到端测试（Cypress / Playwright）+ 后端集成测试；React/Vue 那套 mount + 断言模板的工具栈不通用
- **后端必须配合**：后端如果只能返回 JSON（典型如纯 API 后端 + 第三方移动端），HTMX 落地价值急剧下降；强行让后端写两套渲染逻辑反而麻烦
- **大型团队心智不一致**：前端团队习惯 SPA + 设计系统 + Storybook 流程，转 HTMX 范式社会成本高；招聘市场也偏向 React/Vue
- **HATEOAS 哲学有争议**：HATEOAS 本身在 REST 社区争议了 20 年（Roy Fielding 原意 vs 工程实践），HTMX 把这一思想极化，部分工程师认为「**回到 90 年代**」

## 文档地址

[htmx.org](https://htmx.org/) | [docs](https://htmx.org/docs/) | [reference](https://htmx.org/reference/) | [extensions](https://htmx.org/extensions/) | [essays](https://htmx.org/essays/) | [examples](https://htmx.org/examples/)

## GitHub 地址

[bigskysoftware/htmx](https://github.com/bigskysoftware/htmx)

## 配套书籍

[Hypermedia Systems](https://hypermedia.systems/) —— Carson Gross / Adam Stepinski / Deniz Akşimşek 合著，Mike Amundsen 作序；Creative Commons 开源，免费在线 + 纸质/电子付费。把 HTMX 当作案例讲述 HATEOAS / REST / hypermedia 工程哲学，覆盖 Web + 移动端（Hyperview）。

## 兄弟项目

- [_hyperscript](https://hyperscript.org/) —— Carson 主导的 HTML 内嵌事件 DSL，与 HTMX 搭配实现「**纯 hypermedia 全栈**」
- [Idiomorph](https://github.com/bigskysoftware/idiomorph) —— HTMX 推荐的 DOM 合并算法，基于 id + 内容相似度匹配
- [Hyperview](https://hyperview.org/) —— HTMX 移动端对应方案，把 hypermedia 思想搬到 iOS / Android

## 版本里程碑

- **0.x（2020）**：intercooler.js 改名 htmx，去 jQuery 依赖
- **1.0（2020.11）**：首个稳定版，确立 hx-* 属性范式
- **1.9（2023.5）**：response-targets / preload 稳定
- **2.0（2024.6）**：移除 IE11 支持、`hx-on:` 多属性语法、默认行为收紧
- **2.0.10（2025）**：当前稳定版

## 幻灯片地址

<a href="/SlideStack/htmx-slide/" target="_blank">HTMX</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=htmx" target="_blank" rel="noopener noreferrer">HTMX 测试题</a>
