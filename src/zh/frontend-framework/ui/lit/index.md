---
layout: doc
---

# Lit

Google 维护（原 Polymer 团队）的 Web Components 框架，以「**标准浏览器 Web Components + 高效模板引擎 + 响应式属性**」三件套为核心。Lit 不是 React/Vue 那类「重写组件模型」的库——它把 `LitElement` 设计为标准 `HTMLElement` 的薄层封装，组件**就是浏览器原生 custom element**，可以直接在任何框架（React / Vue / Angular / 原生 HTML）里 `<my-button>` 使用。配合 `html` tagged template 的「**有界更新（dirty-checking 仅对绑定槽位）**」与默认开启的 Shadow DOM 样式隔离，Lit 长期被用作**跨框架设计系统**与**大型企业组件库**的底层（Adobe Spectrum / IBM Carbon Web Components / Salesforce Lightning / SAP UI5 Web Components / Microsoft FAST 部分线）。Lit 3（2023.11）把基线升到 ES2021、对齐 TC39 装饰器、移除 IE11；3.x 的小版本（3.2 / 3.3）继续打磨 SSR、Signals Labs、TypeScript 5 装饰器。

## 评价

**优点**

- **基于 Web Standards**：Custom Elements / Shadow DOM / ES Modules / HTML Templates 全部是 W3C 标准——组件可以脱离 Lit 在原生 HTML 里直接 `<my-button>` 使用
- **跨框架**：同一个组件可以在 React / Vue / Angular / Svelte / 静态 HTML 中复用——**唯一适合做跨框架设计系统的方案**
- **包体积极小**：Lit 核心 ~5-7 KB（min+gzip），比 React 小一个数量级；适合嵌入到其他应用 / SDK / 微前端
- **样式天然隔离**：默认 Shadow DOM，组件样式不会污染外部，外部也无法穿透——彻底解决 CSS 命名冲突
- **企业背书强**：Google / Adobe / IBM / Salesforce / SAP / Microsoft 多家在用，Polymer 早期到 Lit 已经 10+ 年沉淀
- **TypeScript 一流**：装饰器全套类型 + `HTMLElementTagNameMap` 让 `document.createElement('my-el')` 也有类型推导
- **学习曲线平缓**：API 表面小（LitElement + 装饰器 + `html` 模板 + Reactive Controllers），周末看完就能写
- **Reactive Controllers 替代 Mixin**：组合复用机制，比 React HOC 干净，比 Vue mixin 类型友好
- **Lit Labs 实验线丰富**：`@lit-labs/ssr` / `@lit-labs/signals` / `@lit-labs/preact-signals` / `@lit-labs/observers` / `@lit-labs/router` / `@lit-labs/virtualizer` 等

**缺点**

- **不是 SPA 框架**：Lit 没有内置路由 / 状态管理 / 数据获取——这些都要自己组合或用社区方案（`@lit-labs/router`、Pinia 兼容、外部 store）
- **Shadow DOM 限制**：全局样式（reset.css / Tailwind utility）穿不进 Shadow DOM——需要把样式放进每个组件或用 `:host` CSS Custom Properties 主题
- **SSR 仍在 Labs**：`@lit-labs/ssr` 已经可用但仍标 Labs；Next.js / Astro / Eleventy / 11ty 有官方集成，但相对 React SSR 不够成熟
- **生态规模有限**：UI 组件库（Shoelace / FAST / Carbon WC）数量级远小于 React 生态；招聘市场也小
- **状态管理无官方**：要么自己用 Reactive Controllers，要么用第三方（MobX / @lit-labs/signals）
- **React 集成需要 wrapper**：React 18 之前对 Web Components 支持差，需要 `@lit/react` 的 `createComponent` 包装；React 19 原生支持自定义元素但仍建议 wrapper
- **Web Components 心智不同**：Shadow DOM / Slots / 事件冒泡的 `composed: true` / Light DOM 模式都需要重学
- **vs Stencil**：Stencil 提供编译器优化 + 默认无 Shadow DOM 友好选项；Lit 更轻量但需要自己解决 SSR / 编译优化

## 文档地址

[Lit 官网](https://lit.dev/) | [Lit 3 文档](https://lit.dev/docs/) | [Lit Labs](https://lit.dev/docs/libraries/labs/)

## GitHub 地址

[lit/lit](https://github.com/lit/lit)

## 幻灯片地址

<a href="/SlideStack/lit-slide/" target="_blank">Lit</a>
