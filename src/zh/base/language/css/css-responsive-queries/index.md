---
layout: doc
---

# CSS 响应式与现代查询

过去十年里，「响应式」几乎等同于「写一堆 `@media (max-width)` 断点」——按**视口宽度**切几套布局。但视口宽度从来不是组件真正关心的东西：同一张卡片，放进窄侧栏和放进宽正文，该长得不一样，可它们处在同一个视口里。现代 CSS 把「响应」的维度彻底拓宽了：媒体查询补上了更顺手的 **range 语法**（`width >= 600px`）和一整组**用户偏好**特征（暗色、减弱动效、对比度）；**容器查询**让组件按「自己所在容器的尺寸」而非视口来排版，真正实现了组件级响应式；`@supports` **特性查询**让你先探测浏览器能力、再渐进增强；**逻辑属性**则把 `left/right` 换成 `inline-start/inline-end`，一套样式自动适配中英文与阿拉伯语的不同书写方向。本叶把这套「现代查询家族」讲透。

## 概述

- **它管什么**：让页面与组件根据「环境」自我调整——环境可以是视口尺寸、容器尺寸、用户系统偏好（暗色 / 减弱动效）、浏览器能力，或文档的书写方向。
- **从「视口响应」到「组件响应」**：媒体查询按**视口**决策，是页面级的；容器查询按**祖先容器**决策，是组件级的——同一个组件丢到任何宽度的容器里都能自适应，这是过去做不到的。
- **从「适配设备」到「尊重用户」**：现代媒体查询的重心已从「屏幕多大」转向「用户想要什么」——`prefers-color-scheme`、`prefers-reduced-motion`、`prefers-contrast` 让页面尊重系统设置，这关乎无障碍而非美观。
- **现代化关注点**：媒体查询 range 语法（`width >= 600px`）、容器查询（size + style，Baseline 2023）、`@supports` 渐进增强、逻辑属性与书写模式（i18n / RTL 天然适配）、多列布局。

## 本叶地图

- [入门](./getting-started) —— 五分钟认全「现代查询家族」五件套，建立从视口到容器、从设备到用户的全景
- [媒体查询与 range 语法](./guide-line/media-queries) —— `@media` 类型 / 特征 / 操作符，以及现代 `width >= 600px` range 语法
- [用户偏好查询](./guide-line/user-preferences) —— `prefers-color-scheme` / `prefers-reduced-motion` / `prefers-contrast`，让页面尊重系统设置
- [容器查询](./guide-line/container-queries) —— `container-type`、`@container`、cq* 单位、style 查询，组件级响应式（核 Baseline）
- [`@supports` 特性查询](./guide-line/supports-feature-queries) —— 探测浏览器能力、`selector()`、渐进增强与降级
- [逻辑属性与书写模式](./guide-line/logical-properties) —— `margin-inline` / `inset-block` / `writing-mode`，一套样式适配 LTR 与 RTL
- [多列布局与响应式综合](./guide-line/multicol-patterns) —— `columns` / `column-*`，与各类查询协同的实战配方
- [参考](./reference) —— 速查表 + 媒体特征表 + 逻辑属性映射表 + Baseline 状态 + 权威链接

## 文档地址

- [web.dev: Learn CSS — Container Queries](https://web.dev/learn/css/container-queries)
- [web.dev: Learn CSS — Logical Properties](https://web.dev/learn/css/logical-properties)
- [MDN: Using container size and style queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)
- [MDN: `@media`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media) · [`@supports`](https://developer.mozilla.org/en-US/docs/Web/CSS/@supports)

## 幻灯片地址

<a href="/SlideStack/css-responsive-queries-slide/" target="_blank">CSS 响应式与现代查询</a>
