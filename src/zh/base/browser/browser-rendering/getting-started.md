---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Chromium 现代架构 · 核于 2026-07

## 速查

- **关键渲染路径（Critical Rendering Path，CRP）**：浏览器把 HTML/CSS/JS 变成屏幕像素的步骤序列
- 经典 5 步：**DOM → CSSOM → render tree → layout → paint**（现代补第 6 步 **composite**）
- **DOM 构建是增量的**；**CSSOM 不是**——后面的规则可覆盖前面的，必须完整解析才能用
- render tree 只含**可见节点**：`display: none` 连子孙一起排除；`visibility: hidden` 保留（占位）
- **layout** 算几何（尺寸+坐标），首次叫 layout，之后的重算叫 **reflow（重排）**
- **paint** 生成绘制指令并转成像素；load 后只重绘受影响区域
- 代价链：**改布局 > 改绘制 > 只改合成**；`transform`/`opacity` 动画可全程走合成器线程
- 帧预算 = 显示器刷新率：**60Hz≈16.7ms、120Hz≈8.3ms**，超预算即掉帧（jank）
- 渲染发生在**渲染进程**：主线程干重活（解析/样式/布局/绘制），合成器线程独立出帧
- 本叶讲**原理与代价**；任务调度归[事件循环](/zh/base/language/javascript/js-async/guide-line/event-loop)，指标与工具归前端优化章

## 一、经典 5 步：关键渲染路径

MDN 对 CRP 的定义：**浏览器将 HTML、CSS 和 JavaScript 转换为屏幕上像素所经历的步骤序列**。它是理解一切渲染性能问题的主线心智模型：

```
HTML ──解析──▶ DOM ──┐
                     ├──▶ render tree ──▶ layout ──▶ paint ──▶ (composite)
CSS ──解析──▶ CSSOM ─┘      (可见节点)      (几何)     (像素)      (分层合成)
```

| 步骤 | 产物 | 干什么 |
| --- | --- | --- |
| ① 解析 HTML | **DOM** | 字节流 → token → 节点 → 树；**增量构建**，边下边建 |
| ② 解析 CSS | **CSSOM** | 规则树 + 级联；**非增量**，必须完整才能用 |
| ③ 样式合成 | **render tree** | DOM + CSSOM 结合，只收**可见节点**及其计算样式 |
| ④ 布局 layout | 几何信息 | 从根遍历，算出每个盒子的尺寸与位置（依赖视口大小） |
| ⑤ 绘制 paint | 屏幕像素 | 把盒子转成实际像素：文字、颜色、边框、阴影、图片 |
| ⑥ 合成 composite | 合成帧 | 内容分到多个**图层（layer）**，分别栅格化后按序拼合 |

两个关键性质：

- **流水线级联**：每一步的输出是下一步的输入。Chrome 官方原文——「在渲染管线的每一步，前一个操作的结果被用来创建新数据」。改了 layout，受影响部分的 paint、composite 都要重来；反过来只改合成层属性（如 `transform`），前面的步骤可以整体跳过。
- **第 6 步是现代补充**：MDN CRP 原文只列 5 步；合成是浏览器为了让重绘更快、滚动动画不经过主线程而引入的机制，如今是理解性能的必备一环，本叶将其并入主线。

## 二、为什么前端必须懂渲染管线

### 2.1 重排重绘的代价是真实的

这些日常代码都在触碰管线的不同深度：

```js
// ① 改几何 → 重跑 layout + paint + composite（最贵）
el.style.width = "300px";

// ② 只改颜色 → 跳过 layout，重跑 paint + composite
el.style.background = "red";

// ③ 只改 transform/opacity → layout、paint 都跳过，合成器线程直接出帧（最便宜）
el.style.transform = "translateX(100px)";
```

更隐蔽的是**读取**也有代价：在改样式之后立刻读 `offsetWidth`，浏览器为了给你精确值必须**立即同步执行布局**（强制同步布局）。循环里交替读写，就是经典的 **layout thrashing**——详见[布局与重排](./guide-line/layout-reflow)。

### 2.2 动画流畅性取决于走哪条路径

显示器以固定频率刷新（常见 60Hz，高刷屏 120Hz+），每帧留给渲染的预算就是 `1000ms / 刷新率`。主线程既跑 JS 又跑样式/布局/绘制，任何一环超时就丢帧。而**合成器线程不需要等待样式计算或 JavaScript 执行**（Chrome 原文），所以：

- `transform`/`opacity` 动画由合成器独立驱动，主线程卡死也照样丝滑；
- 滚动默认由合成器处理，但一个不当的 `touchstart` 监听就能把它拖回主线程——这是 `passive: true` 存在的意义，详见[帧生命周期与输入](./guide-line/frame-input)。

### 2.3 加载性能的一半答案在解析阶段

为什么 `<script>` 要放底部或加 `defer`？为什么 CSS 要尽早给？因为 JS 会**暂停 HTML 解析**、CSS 会**阻塞渲染与 JS 执行**。理解 preload scanner、async/defer 的行为差异，才能解释各种「首屏白屏」——详见 [HTML 解析与 DOM 构建](./guide-line/dom-construction)。

## 三、渲染发生在哪：进程与线程的最小背景

渲染工作发生在**渲染进程（renderer process）**内，它「负责标签页里发生的一切」。内部几个角色（完整拆解见[浏览器架构与进程模型](../browser-architecture/)）：

| 线程 | 职责 |
| --- | --- |
| **主线程（main thread）** | 解析 HTML/CSS、样式计算、layout、paint、执行 JS——管线的大头 |
| **合成器线程（compositor thread）** | 分层合成、滚动、合成器动画；**不等主线程**独立出帧 |
| **栅格线程（raster threads）** | 把绘制指令栅格化成像素（GPU 纹理块） |
| worker 线程 | Web Worker / Service Worker 的 JS |

现代 Chromium 还把「最终画到屏幕」交给独立的 **Viz 进程**（display compositor + GPU），聚合多个渲染进程与浏览器 UI 的合成帧统一绘制——这是 [RenderingNG](./guide-line/renderingng) 的内容。

> 一句话记住分工：**主线程生产画面内容，合成器线程保证画面流畅**——性能优化的大量招式（transform 动画、passive 监听、读写分离）本质都是「别让合成器等主线程」。

## 四、三个经典症状，先挂个号

入门阶段先把最常见的三类问题挂到对应页，读完全叶你能自己开处方：

| 症状 | 管线视角的病因 | 详见 |
| --- | --- | --- |
| **首屏白屏久** | 关键路径被堵：同步 `<script>` 暂停解析、CSS 未就绪不渲染、关键资源没进 preload scanner 视野 | [DOM 构建](./guide-line/dom-construction)、[CSSOM](./guide-line/cssom-render-tree) |
| **交互/动画掉帧** | 主线程超帧预算：动画碰了盒模型属性走全管线、循环读写触发 layout thrashing | [布局与重排](./guide-line/layout-reflow)、[绘制与合成](./guide-line/paint-compositing) |
| **滚动发闷、跟手差** | 合成器快速通道被监听器拖回主线程：非快速滚动区、缺 `passive` | [帧生命周期与输入](./guide-line/frame-input) |

一个统一的判断框架：**先问「这次改动/操作落在管线哪一步」，再问「它在哪个线程执行、要不要等主线程」**——本叶所有页面都在反复练这两问。

## 五、本叶边界：不重讲什么

| 主题 | 归属 | 本叶只讲 |
| --- | --- | --- |
| 事件循环 / 宏微任务 / Promise 调度 | [js-async 事件循环](/zh/base/language/javascript/js-async/guide-line/event-loop) | 渲染侧**帧时序**：rAF/rIC 何时执行、渲染与任务的穿插 |
| DOM / 事件 API 用法（`addEventListener`、委托写法） | [js-dom-events](/zh/base/language/javascript/js-dom-events/) | 浏览器**内部**事件路由：hit test、事件合并、passive 的机理 |
| 性能指标与工具（LCP、Lighthouse、DevTools 面板） | 前端优化章 | **原理与代价**：重排为什么贵、帧预算怎么来 |
| 进程模型 / 站点隔离 / 导航流程 | [浏览器架构与进程模型](../browser-architecture/) | 渲染进程内部的流水线 |

## 小结

- CRP 经典 5 步（DOM→CSSOM→render tree→layout→paint）+ 现代第 6 步 composite，是贯穿本叶的主线心智模型。
- 记住代价链：**layout > paint > composite**——写代码时的每个样式选择都在选管线深度。
- 主线程负责生产内容，合成器线程负责流畅呈现；能交给合成器的（transform/opacity 动画、滚动）就别拖回主线程。
- 经典模型面试通用、MDN 背书；引擎真实实现已进化为 RenderingNG，最后一页给出术语映射，两套话语都能对上。

下一步：从流水线源头开始——[HTML 解析与 DOM 构建](./guide-line/dom-construction)。
