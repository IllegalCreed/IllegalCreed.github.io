---
layout: doc
---

# View Transitions API

View Transitions API 让**浏览器自动为「DOM 更新前后的视觉状态」生成快照并补间**，把跨状态、跨页面的转场从「手写每一帧中间态」降为「声明式一句话 + 少量 CSS」。它的心智模型只有一句：抓旧状态快照 → 更新 DOM（此间渲染被抑制）→ 抓新状态快照 → 在一棵 `::view-transition` 伪元素树上跑动画。同一套机制覆盖两种场景——**同文档（SPA）**用 `document.startViewTransition(updateCallback)` 触发，**跨文档（MPA）**用 CSS `@view-transition { navigation: auto }` 在同源导航时自动触发。规范是 **W3C CSS View Transitions Module Level 1/2**：**同文档核心已于 2025-10 进入 Baseline Newly available**（Chrome 111 / Safari 18 / Firefox 144），而 **view transition types 与跨文档转场因 Firefox 尚未跟进、仍未进 Baseline**。本叶专注 **API 与 CSS 编程**：伪元素树与生命周期、命名与定制、SPA/MPA 与类型、工程降级与坑位。

## 评价

**优点**

- **消灭「中间态代码」**：过去做「元素从列表位置飞到详情页大图」要手算起止坐标、逐帧插值；现在给两处元素同一个 `view-transition-name`，浏览器自动补间位置与尺寸的形变，代码量断崖式下降
- **声明式 + 可编程双轨**：默认交叉淡入淡出零配置可用；要精细控制就用 CSS `animation` 覆盖伪元素，或在 `transition.ready` 后用 Web Animations API 接管——渐进增强，不锁死
- **同文档与跨文档同一套心智**：SPA 的 `startViewTransition` 和 MPA 的 `@view-transition` 共享同一棵伪元素树与命名规则，学一次两处通用，MPA 甚至可以**零 JavaScript** 纯 CSS 落地
- **与框架路由天然契合**：Astro、SvelteKit、Vue Router、Next 等都已内建或有一行开关，配路由过渡是「填空题」
- **生成的快照是真元素**：`::view-transition-old/new` 以「被替换内容」（类似 `<img>`）渲染，可用 `object-fit`、`animation`、`clip-path`、`mix-blend-mode` 常规 CSS 手段处理

**局限**

- **Firefox 是当前最大短板**：Firefox 144 只补齐了同文档核心，**不含 view transition types，也不支持跨文档 `@view-transition`**——依赖这两者必须特性检测 + 降级
- **`view-transition-name` 唯一性是硬约束**：同一时刻页面上两个渲染中的元素撞同名 → `ready` 直接 reject、整个过渡被跳过（不是「凑合animate」而是「彻底不animate」）
- **默认根转场易「全屏闪」**：不命名任何元素时，`:root` 默认承担整页交叉淡入淡出，大面积内容跳变时观感突兀，需要主动拆分快照或收敛动画
- **无障碍要自己兜**：转场是纯视觉动效，必须尊重 `prefers-reduced-motion`，否则对前庭敏感用户不友好
- **不是「动画库」**：它只管「前后两态之间」的补间，不做时间线编排、物理弹簧、手势跟随、SVG 路径动画——那些仍是 [WAAPI / GSAP / Framer Motion / Anime.js 的地盘](/zh/frontend-visualization/)（见下方边界说明）

一句话选型：**做「状态切换 / 页面导航」的转场——列表进详情、Tab 切换、路由跳转——就用 View Transitions**，它把最烦人的形变补间交给浏览器；**做「持续的、可编排的、交互驱动的」动画**（时间线、手势、循环、物理）仍然找 JS 动画库；**元素自身属性的入场/悬停/状态过渡**是 CSS `transition`/`@keyframes` 的活（见[三大语言 · CSS 叶](/zh/base/language/css/css-animation-effects/)）。三者是分工不是替代。

## 本叶地图

- [入门](./getting-started) —— 定位（前后态快照 + 浏览器补间）、`startViewTransition` 一分钟上手、与 CSS 动画 / JS 动画库的分工、支持现状（同文档 Baseline / 跨文档 + types 仍缺 Firefox）
- [基础与伪元素树](./guide-line/basics-pseudo) —— `startViewTransition(updateCallback)`、`ViewTransition` 对象（`ready`/`finished`/`updateCallbackDone`/`skipTransition()`）、`::view-transition` 伪元素树五层、默认根元素交叉淡入淡出、快照捕获与 DOM 更新的时序
- [命名与定制](./guide-line/naming-customization) —— `view-transition-name` 唯一性、`view-transition-class` 批量样式化、`view-transition-name: match-element` 自动命名、自定义 old/new 动画、位置尺寸形变补间、多元素独立过渡、`animation` 覆盖默认
- [SPA / MPA 与类型](./guide-line/spa-mpa-types) —— 同文档 SPA 实践、跨文档 MPA 的 `@view-transition`（Chrome 126+ / Safari 18.2+，**Firefox 不支持**）、view transition types（Chrome/Safari 支持，**Firefox 144 不含**）、`pageswap`/`pagereveal`、`:active-view-transition-type()`、框架集成点到
- [工程模式与降级](./guide-line/patterns-fallback) —— 特性检测渐进增强、尊重 `prefers-reduced-motion`、`skipTransition()`、性能与快照开销、常见坑（唯一名冲突、根元素全屏、回调里的异步、内容跳变、快照过多）
- [参考](./reference) —— `ViewTransition` API 速查、伪元素树表、相关 CSS 属性表、同文档 vs 跨文档支持矩阵、事件表、易错点清单、资源链接

## 文档地址

[MDN View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)

## GitHub 地址

[WICG/view-transitions](https://github.com/WICG/view-transitions)（explainer 与 issue；现行规范在 [w3c/csswg-drafts](https://github.com/w3c/csswg-drafts) 的 css-view-transitions-1 / -2）

## 幻灯片地址

<a href="/SlideStack/view-transitions-slide/" target="_blank">View Transitions API</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=view-transitions-api" target="_blank" rel="noopener noreferrer">View Transitions API 测试题</a>
