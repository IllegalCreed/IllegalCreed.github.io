---
layout: doc
---

# Canvas

Canvas 2D 是浏览器原生的**立即模式（immediate mode）位图绘图 API**：JavaScript 逐条命令把像素画进 `<canvas>` 元素的位图缓冲，画完即忘、不保留图形对象——想「移动一个圆」，只能清屏后以新坐标重画一帧。它是数据可视化、2D 游戏、图像处理、自定义图形编辑器的底层基座，ECharts、Konva、Fabric、Excalidraw 都建在其上。能力面很全（路径 / 文本 / 图像 / 像素 / 合成 / 导出），性能上限也高（分层 + 离屏 + OffscreenCanvas Worker 可支撑万级图元流畅动画），但抽象层级低：无场景图、无内建事件、无障碍支持差，状态机全靠自己管理。学习与面试的重点不是背 API，而是吃透三条底层主线：**状态机（save/restore）、双坐标系（位图缓冲 vs CSS 显示）、像素管线（getImageData 代价与跨域污染）**。

## 概述

- **立即模式是一切推论的根**：浏览器不记得「这里有个矩形」，改一处 = 自己重画一帧；所有交互（点击命中、拖拽）都要自建模型。SVG/DOM 则是保留模式——对象树可直接改、天然有事件。
- **双坐标系必须分清**：`width`/`height` **属性**决定位图缓冲尺寸（默认 300×150），CSS 宽高只负责显示拉伸——两者比例不一致图像必失真；高清屏要走「CSS 尺寸 → 缓冲 ×devicePixelRatio → `ctx.scale(dpr, dpr)`」三步法。
- **上下文是状态机**：fillStyle / 变换 / 裁剪等一经设置持续生效，靠 `save()`/`restore()` 栈管理；**当前路径不属于状态**，`beginPath()` 与 save/restore 互不相干。
- **像素管线有代价**：`getImageData` 是 GPU→CPU 同步回读（昂贵），高频回读要声明 `willReadFrequently: true`；未经 CORS 的跨域图一旦画入即**污染 canvas**，读取/导出全部抛 `SecurityError`。
- **动画范式固定**：`requestAnimationFrame` + delta time（基于时间而非帧数）+ 每帧「清屏 → save → 绘制 → restore」。
- **性能有成套打法**：离屏预渲染、分层 canvas、脏矩形、批量绘制减状态切换、`OffscreenCanvas + Worker` 把渲染彻底移出主线程。
- **2026 基线**：核心 API 早已 Widely；`roundRect`/`createConicGradient`（2023-04）、`ctx.reset()`（2023-12）、OffscreenCanvas（2023-03）均已全浏览器可用；`willReadFrequently` 2024-09 起 Newly Baseline；`ctx.filter` **至今非 Baseline**（Safari 稳定版缺席）。

## 本叶地图

- [入门](./getting-started) —— 定位（立即模式 vs SVG）、getContext 与上下文选项、宽高与高清屏适配（devicePixelRatio 三步法）、第一个绘制
- [绘图基础](./guide-line/drawing-basics) —— 路径系统（beginPath/Path2D/填充规则）、样式与线型、渐变与图案、阴影与 filter、文本
- [图像与像素](./guide-line/images-and-pixels) —— drawImage 三种签名、ImageData 像素操作、跨域污染、willReadFrequently、导出（toDataURL/toBlob/captureStream）
- [变换与状态](./guide-line/transforms-and-state) —— translate/rotate/scale 与矩阵、save/restore 状态栈、合成 globalCompositeOperation、裁剪 clip
- [动画](./guide-line/animation) —— rAF 范式、清屏三法、基于时间的动画、交互拾取（isPointInPath/hit-canvas/坐标换算）
- [性能优化](./guide-line/performance) —— 离屏预渲染、分层 canvas、OffscreenCanvas + Worker、优化清单
- [参考](./reference) —— API 速查表、新 API 基线状态表、选型对比与资源链接

## 文档地址

- [MDN Canvas API](https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API) —— 教程 + 参考的主信源（注意部分中文教程页内容陈旧，以 API 参考页 + Baseline 标注为准）
- [WHATWG HTML 规范 · Canvas](https://html.spec.whatwg.org/multipage/canvas.html) —— `<canvas>` 与 2D 上下文的权威规范
- [web.dev Canvas 性能](https://web.dev/articles/canvas-performance) —— 性能最佳实践

## 幻灯片地址

- <a href="/SlideStack/canvas-slide/" target="_blank">Canvas</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=canvas" target="_blank" rel="noopener noreferrer">Canvas 测试题</a>
