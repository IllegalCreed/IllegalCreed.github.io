---
layout: doc
---

# CSS 过渡、动画与视觉

让界面「动起来」与「好看起来」，是 CSS 在排版之外的另一条主线。从最轻的 `transition`（一个值变化时自动补间），到 `@keyframes` + `animation`（脱离触发、自主播放的多帧动画），再到 `transform`（平移 / 缩放 / 旋转，不扰乱布局且能上合成层）与 `filter` / `mix-blend-mode` / `clip-path` 这一组视觉效果，最后到 View Transitions（页面切换的整体过渡）与滚动驱动动画（把动画进度绑到滚动位置）这两项现代能力——本叶把「怎么动、怎么补间、怎么不卡、怎么降级」一次讲透。

## 概述

- **它管什么**：状态改变时的平滑补间（`transition`）、自主播放的关键帧动画（`@keyframes` + `animation`）、不触发重排的几何变换（`transform` / 独立 `translate`·`rotate`·`scale`）、像素级视觉效果（`filter` / `backdrop-filter` / `mix-blend-mode` / `clip-path` / `mask`），以及页面级过渡（View Transitions）与滚动联动（滚动驱动动画）。
- **为什么值得认真学**：动画做错的代价不是报错，而是「卡」「晕」「费电」——动 `width` / `top` 触发重排掉帧、忽略 `prefers-reduced-motion` 让前庭敏感用户头晕、滥用 `will-change` 反而吃显存。把动画收敛到 `transform` / `opacity` 这两个能跑在合成线程上的属性，配合无障碍降级，才是「既顺滑又得体」的现代做法。
- **现代化关注点**：`linear()` 缓动函数（弹簧 / 回弹，Baseline 2023）、独立变换属性 `translate` / `rotate` / `scale`（Baseline 2022，可单独过渡）、`@starting-style` + `transition-behavior: allow-discrete`（进场动画与 `display:none` 过渡，Baseline 2024）、View Transitions（**同文档** Baseline 2025；**跨文档**仍 Chromium-only 需降级）、滚动驱动动画（`animation-timeline`，**尚非 Baseline**，纯渐进增强）、`prefers-reduced-motion`（无障碍红线）。

## 本叶地图

- [入门](./getting-started) —— 一张「过渡 vs 动画 vs 变换」选择表 + 一段最小可用动画，把本叶各页串成主线
- [过渡与缓动](./guide-line/transitions) —— `transition` 全属性、`cubic-bezier()` / `linear()` 缓动、进/出场不同曲线、`@starting-style`
- [关键帧与 animation](./guide-line/keyframes-animation) —— `@keyframes` 写法、`animation` 八个子属性、`fill-mode` / `direction` / `play-state` 全解
- [transform 与合成层](./guide-line/transforms) —— 2D/3D 变换函数、独立 `translate`·`rotate`·`scale`、`transform-origin`、3D 透视、为何能上合成层
- [滤镜·混合·裁剪](./guide-line/filters-blend-clip) —— `filter` / `backdrop-filter` / `mix-blend-mode` / `clip-path` / `mask` 这组像素级视觉效果
- [View Transitions 与滚动驱动动画](./guide-line/view-transitions-scroll) —— 页面级过渡（同文档 Baseline / 跨文档降级）+ 把动画绑到滚动位置（尚非 Baseline）
- [动画性能与无障碍](./guide-line/animation-performance) —— 合成层、`will-change` 的正确用法、`prefers-reduced-motion` 降级
- [参考](./reference) —— 速查表 + 缓动表 + 变换函数表 + 标准 / Baseline / 调试工具链接

## 文档地址

- [web.dev: Learn CSS — Transitions](https://web.dev/learn/css/transitions) · [Animations](https://web.dev/learn/css/animations)
- [MDN: Using CSS transforms](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_transforms/Using_CSS_transforms)
- [MDN: View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) · [CSS scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations)
- [MDN: Using CSS transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_transitions/Using_CSS_transitions) · [Using CSS animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations/Using_CSS_animations)

## 幻灯片地址

<a href="/SlideStack/css-animation-effects-slide/" target="_blank">CSS 过渡、动画与视觉</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=css-%E8%BF%87%E6%B8%A1-%E5%8A%A8%E7%94%BB%E4%B8%8E%E8%A7%86%E8%A7%89" target="_blank" rel="noopener noreferrer">CSS 过渡、动画与视觉 测试题</a>
