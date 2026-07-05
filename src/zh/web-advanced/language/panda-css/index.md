---
layout: doc
---

# Panda CSS

**构建期（build-time）的类型安全 CSS-in-JS 样式引擎**：在构建阶段静态分析源码里的样式对象，用 PostCSS 管线把它们提取成原子 CSS（atomic CSS），并 codegen 出一套类型安全的样式工具（`css()`、tokens、recipes、patterns、`styled` JSX 工厂）。由 **Chakra 团队**打造，当前主线 `@pandacss/dev` 实测 **1.11.4**（MIT）。它诞生的核心动机，是解决 Emotion / styled-components 这类**运行时** CSS-in-JS 与 React Server Components 的不兼容——Panda 运行时**既不在浏览器里生成样式，也不向 `<head>` 注入样式**，只在构建期产出静态 CSS，因此天然适配 RSC / SSR / SSG。它把「原子 CSS 的性能」「设计 token 体系」「变体配方（recipe）」「布局模式（pattern）」和「完整 TypeScript 类型推导」揉进一套开箱即用、贴近 Chakra 式开发体验的样式方案里。

## 评价

**优点**

- **零/轻运行时 + 服务端优先**：样式构建期定稿为静态原子 CSS，运行时只剩一小段「拼类名」的轻量函数，不在浏览器产出或注入样式，天然兼容 Server Components / SSR，无 hydration 样式闪烁负担
- **完整的设计系统层**：`css()` 之外还内建 tokens / semanticTokens（明暗模式）/ textStyles / recipes（`cva` 变体、slot recipes）/ patterns（stack/grid/flex 布局原语），一套装齐，不用再拼装第三方
- **类型安全是一等公民**：codegen 出的类型让属性名、token 值、变体 props 全程自动补全与校验；`strictTokens` 可把「只准用 token」约束到编译期，配合方括号逃生舱保留可控例外
- **现代 CSS 底座**：用 CSS cascade layers（`@layer reset,base,tokens,recipes,utilities`）+ `:where()` 低特异性管理覆盖顺序，样式覆盖可预测，不靠 `!important` 与选择器权重堆叠
- **广泛的框架集成**：以 PostCSS 插件形式接入，凡支持 PostCSS 的框架（Next.js / Vite / Astro / Remix / Solid / Qwik / Vue 等）都能用，另有 CLI 方案兜底

**缺点**

- **有构建期 codegen 心智**：需要生成并维护 `styled-system` 目录（通常进 `.gitignore` + `prepare` 脚本重生），初次上手比「装个库就写」要重一些
- **受静态分析约束**：值必须可被静态分析——运行时才算出的动态值、运行时重命名属性等写法会导致样式漏提，需改用 token / CSS 变量 / recipe 变体表达
- **不是组件库**：本身不提供任何成品组件（要现成组件是 Chakra UI v3 的事，它底层才用 Panda），做界面仍要自己搭组件
- **生态与心智仍在扩散期**：相对 Tailwind 的社区体量与现成资源，Panda 的模板、示例、招聘熟练度都偏新，团队引入有一定学习成本

## 文档地址

[Panda CSS 官网](https://panda-css.com) ｜ [文档首页](https://panda-css.com/docs)

## GitHub 地址

[chakra-ui/panda](https://github.com/chakra-ui/panda)

## 幻灯片地址

<a href="/SlideStack/panda-css-slide/" target="_blank">Panda CSS</a>
