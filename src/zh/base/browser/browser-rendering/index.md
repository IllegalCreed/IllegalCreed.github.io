---
layout: doc
---

# 浏览器渲染原理

从收到 HTML 字节流到屏幕亮起像素，渲染进程要走完一条长长的流水线：解析出 DOM 与 CSSOM、合成 render tree、计算布局、生成绘制指令、栅格化、分层合成。这一叶把这条流水线完整拆开：既讲经典 5 步关键渲染路径（Critical Rendering Path）这套通用心智模型——它解释了为什么读 `offsetWidth` 会强制布局、为什么 `transform` 动画不掉帧、为什么滚动监听要 `passive`；也讲 Chromium 现代实现 RenderingNG 的 12 阶段管线与 property trees，让你知道 2018 年的经典文章哪些说法已被引擎改写。进程/线程背景见[浏览器架构与进程模型](../browser-architecture/)（可与本叶互参）。

## 概述

- **经典管线**：HTML→**DOM**、CSS→**CSSOM**，合成 **render tree** → **layout**（几何）→ **paint**（像素指令）→ **composite**（分层合成），前一步的产物是后一步的输入。
- **越靠前越贵**：改布局属性要重跑 layout+paint+composite；只改 `transform`/`opacity` 可跳过 layout 与 paint，全程在**合成器线程**完成——这是流畅动画的根本原理。
- **阻塞关系**：JS 会暂停 HTML 解析（`document.write` 之毒），CSS 不阻塞解析但阻塞渲染与 JS 执行；**preload scanner** 并行预取资源缓解阻塞。
- **帧预算 = 显示器刷新率**：60Hz≈16.7ms、120Hz≈8.3ms；主线程 vs 合成器线程分工决定了滚动为何流畅、`passive` 监听为何能救滚动。
- **RenderingNG 现代化**：property trees（transform/clip/effect/scroll 四棵树）取代单一 layer tree 心智、LayoutNG 不可变 fragment tree、paint 后才分层（CompositeAfterPaint）、Viz 进程统一聚合与 GPU 光栅化。

## 本叶地图

- [入门](./getting-started) —— 经典 5 步 CRP 总览、前端为什么要懂渲染管线
- [HTML 解析与 DOM 构建](./guide-line/dom-construction) —— tokenization、增量解析、preload scanner、JS 阻塞、async/defer
- [CSSOM 与 render tree](./guide-line/cssom-render-tree) —— render-blocking、级联计算、可见性规则、选择器匹配
- [布局与重排](./guide-line/layout-reflow) —— 几何计算、重排触发清单、强制同步布局与 layout thrashing
- [绘制与合成](./guide-line/paint-compositing) —— paint records、栅格化、分层、will-change、合成器动画
- [帧生命周期与输入](./guide-line/frame-input) —— 帧预算、主线程 vs 合成器、rAF/rIC、hit test、事件合并、passive
- [现代架构 RenderingNG](./guide-line/renderingng) —— property trees、LayoutNG、Viz、12 阶段管线与术语映射
- [参考](./reference) —— 管线/重排重绘/脚本加载/图层提升/术语映射速查表

## 文档地址

- [Inside look at modern web browser (part 3)](https://developer.chrome.com/blog/inside-browser-part3) · [(part 4)](https://developer.chrome.com/blog/inside-browser-part4)
- [MDN: Critical rendering path](https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path) · [MDN: How browsers work](https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work)
- [Chromium: RenderingNG architecture](https://developer.chrome.com/docs/chromium/renderingng-architecture) · [RenderingNG data structures](https://developer.chrome.com/docs/chromium/renderingng-data-structures)

## 幻灯片地址

<a href="/SlideStack/browser-rendering-slide/" target="_blank">浏览器渲染原理</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=%E6%B5%8F%E8%A7%88%E5%99%A8%E6%B8%B2%E6%9F%93%E5%8E%9F%E7%90%86" target="_blank" rel="noopener noreferrer">浏览器渲染原理 测试题</a>
