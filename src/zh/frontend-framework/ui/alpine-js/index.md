---
layout: doc
---

# Alpine.js

Caleb Porzio 创建并维护的极轻量 JavaScript 框架（gzip 约 ~16KB，runtime ~7KB），自我定位「**Sprinkle JS**——HTML 上的 jQuery」。设计理念与 Vue 早期（template + 指令）一脉相承，但目标完全不同：不是「写 SPA」，而是「**给服务端渲染（SSR）页面加交互**」。15 个指令 + 9 个魔术属性几乎全部体现在 HTML 属性中，零构建工具就能用 CDN 直接上手，被 Laravel / Rails / Django / WordPress 等后端模板生态广泛采用。Alpine 与 Caleb 同时维护的 [Livewire](https://livewire.laravel.com/) 深度集成（Laravel 全栈框架的「声明式后端 + 声明式前端」），也常与 [HTMX](https://htmx.org/)（请求层）互补搭配——HTMX 负责「换 HTML 片段」，Alpine 负责「换完之后的交互」。

## 评价

**优点**

- **包体极小**：CDN 版 ~16KB（gzip ~7KB）；首屏开销几乎可以忽略，老网页加点交互不会拖性能
- **零构建工具可用**：`<script defer src="cdn.jsdelivr.net/.../alpine.min.js">` 一行接入；不需要 webpack / Vite / npm 也能用全部能力
- **学习曲线极平缓**：15 个指令 + 9 魔术属性看一遍文档就基本上手；与早期 Vue（`v-` 改 `x-`）几乎一致
- **HTML-first**：状态、行为、绑定都写在 HTML 属性里；老网页 / 后端模板（Blade、ERB、Twig、Django Template）天然兼容
- **与后端框架配合佳**：Laravel + Alpine + Livewire 是「TALL Stack」（Tailwind / Alpine / Laravel / Livewire）的核心；Rails 7+ 的 Hotwire 之外 Alpine 也很流行
- **响应式可靠**：底层用 Vue 3 同款响应式（`@vue/reactivity`）；`$watch` / `x-effect` / `Alpine.store` 体验丝滑
- **官方插件覆盖常见需求**：Persist / Intersect / Mask / Morph / Focus / Anchor / Sort / Collapse / Resize 9 个官方插件几乎覆盖 SPA 常见交互
- **与 HTMX 完美互补**：HTMX 处理 AJAX 换片段，Alpine 处理客户端交互；两者职责清晰、几乎无冲突
- **CSP 友好版**：`@alpinejs/csp` 提供受限版本，可在严格 Content Security Policy 下运行

**缺点**

- **不适合 SPA**：没有路由、没有 SSR、没有数据流方案；要做大型应用还是 React / Vue / Solid 更合适
- **HTML 模板能力有限**：所有逻辑塞 HTML 属性，复杂表达式会非常难读；不如 `<script setup>` / JSX 干净
- **单文件组件缺失**：没有 SFC、没有 props 类型推导、没有编译期检查；TypeScript 支持是「编辑器插件」级别
- **没有官方 CLI / 脚手架**：完全靠用户自己 npm + bundler 接入；不像 Vue / React 有官方 starter
- **生态规模小**：第三方组件库覆盖度远低于 React / Vue；UI 组件常常要自己写
- **调试体验弱**：没有 Vue DevTools / React DevTools 这种「专属调试器」；只能 console.log + 浏览器 DOM 面板
- **性能边界**：1000+ 元素列表 + 频繁更新场景，Alpine 的「DOM 遍历 + 表达式求值」比编译期优化的 Solid / Svelte 差一截
- **测试稍麻烦**：Cypress / Playwright 这种基于 DOM 的 E2E 测试可以用，但「组件单元测试」不像 React Testing Library 那样成熟

## 文档地址

[alpinejs.dev](https://alpinejs.dev/) | [Start Here](https://alpinejs.dev/start-here) | [Components](https://alpinejs.dev/components)

## GitHub 地址

[alpinejs/alpine](https://github.com/alpinejs/alpine)

## 幻灯片地址

<a href="/SlideStack/alpine-js-slide/" target="_blank">Alpine.js</a>
