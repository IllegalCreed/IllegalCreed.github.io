---
layout: doc
---

# Web Animations API

Web Animations API（WAAPI）是浏览器原生的 **JavaScript 动画编程接口**——`element.animate(keyframes, options)` 一行代码创建动画，并立刻拿到一个可编程控制的 `Animation` 对象（play/pause/reverse/变速/跳转进度）。**关键认知**：CSS `@keyframes`/`animation` 动画在浏览器底层同样由这套引擎驱动——WAAPI 不是与 CSS 动画平行的另一套系统，而是其原生实现层/超集，`document.getAnimations()` 甚至能"反向"拿到纯 CSS 写的动画来操控。心智定位介于「声明式 CSS 动画」与「手写 `requestAnimationFrame`」之间：比 CSS 动画更可编程（暴露 JS 对象、Promise、运行时改写能力），比 rAF 更省心（浏览器负责插值计算，通常能跑在合成器线程）。**2026 年现状**：核心 API（`Element.animate()`/`Animation`/`KeyframeEffect`/`DocumentTimeline`/`getAnimations()`）自 2020 年起已是 **Baseline 广泛可用**，可放心用于生产；但 Scroll-driven animations（`ScrollTimeline`/`ViewTimeline`）截至 2026-07 仍**非 Baseline**——Chrome/Edge 已可用（2024-12 起），Firefox 历史滞后，Safari 原生尚未支持，需特性检测或 polyfill 兜底。

## 评价

**优点**

- 原生免依赖，无需引入任何第三方库
- `getAnimations()` 能"反向"拿到并操控页面上**所有**动画（含纯 CSS 写的）
- `finished`/`ready` 是 Promise，天然可 `await`/链式，比 `animationend` 事件更顺手
- 支持运行时动态改写关键帧（`setKeyframes()`）和 timing（`updateTiming()`），CSS 动画做不到
- 与 CSS 动画同源同性能——`transform`/`opacity` 等属性同样能跑在合成器线程

**局限**

- 仍是命令式关键帧思维，写法比 GSAP 啰嗦
- 复杂物理缓动（弹簧/惯性）、大规模时间轴编排（stagger、labels、嵌套时间轴）不如专业动画库趁手
- Scroll-driven 部分 2026 年仍未完全跨浏览器落地，核心交互场景需要降级方案

CSS-Tricks 的评价很精准——"它们不应被视为竞争对手"：即便动画代码写的是 CSS，也能用 `getAnimations()` 拿到并动态调速/暂停/等待完成，两套 API 共享同一引擎。

## 本叶地图

- [入门](./getting-started) —— 定位（原生 JS 动画 vs CSS/rAF/GSAP）、`Element.animate()` 第一个动画、关键帧与选项概览
- [Element.animate 与关键帧](./guide-line/animate-and-keyframes) —— `Element.animate()` 完整语法与等价三步写法、关键帧数组/object 两种格式、EffectTiming 选项详解、`fill` 高频坑
- [Animation 播放控制](./guide-line/animation-control) —— 播放控制方法、`playbackRate`/`currentTime` 变速与跳转、`ready`/`finished` Promise、`commitStyles`/`persist`
- [Timeline 与合成](./guide-line/timeline-and-composite) —— `KeyframeEffect` 可复用效果、`composite`/`iterationComposite` 合成模式、Timeline 家族、`getAnimations()` 查询
- [滚动驱动与互操作](./guide-line/scroll-and-interop) —— `ScrollTimeline`/`ViewTimeline`、CSS 等价写法、2026 浏览器现状与降级、性能优势、与 CSS 动画互操作边界
- [参考](./reference) —— API/选项/方法速查表 + 易错点清单 + 选型对比 + 资源链接

## 文档地址

- [MDN Web Animations API](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Animations_API) —— 总览与使用指南
- [Web Animations Level 1（W3C/CSSWG 草案）](https://drafts.csswg.org/web-animations-1/) —— 规范文本

## 幻灯片地址

- <a href="/SlideStack/waapi-slide/" target="_blank">Web Animations API</a>
