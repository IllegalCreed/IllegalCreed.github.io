---
layout: doc
outline: [2, 3]
---

# 入门：Konva 是什么、安装与第一个场景

> 基于 Konva v10.3（npm latest 10.3.0）· 核于 2026-07

## 速查

- **定位**：Konva 是把 **DOM 树 + 事件模型搬进 HTML5 Canvas** 的声明式 2D 场景图框架，核心心智是 `Stage → Layer → Group → Shape` 四层节点树，替代原生 Canvas 的命令式绘制。
- **保留模式 vs 立即模式**：Konva 节点持续存在于树中、可反复查询修改（**保留模式** retained mode）；原生 Canvas 画完即忘（**立即模式**），无法单独修改已绘制图形——这是选型 Konva 而非纯 Canvas API 的根本原因。
- **选型速览**：
  - vs **Fabric.js**：同为 2D Canvas + 保留模式，架构接近；Fabric 更偏图像合成/对象级图片编辑，Konva 更偏 UI 交互（`Transformer` 是差异化优势）。
  - vs **PixiJS**：基于 WebGL（GPU 加速），适合成百上千高频动画精灵、游戏渲染；Konva 是 CPU 2D 光栅化，数千形状级别够用，海量精灵场景会遇性能天花板。
  - vs **原生 Canvas API**：只需一次性绘制、无需交互与状态管理时，原生 API 足够，引入 Konva 反而是不必要的抽象开销。
- **安装**：
  - 浏览器：`npm install konva`；CDN `<script src="https://unpkg.com/konva@10/konva.min.js"></script>`。
  - React：`npm install react-konva konva`（`react-konva@19.2.5`，强绑定 React 19，peerDeps 兼容 Konva 7~10）。
  - Vue：`npm install vue-konva konva`（`vue-konva@3.4.0`，**仅支持 Vue 3**）。
  - 另有官方 Svelte、Angular 绑定；TypeScript 类型内置，无需额外装 `@types/konva`。
- **最小可用代码**：`new Konva.Stage({container, width, height})` → `new Konva.Layer()` → `stage.add(layer)` → 创建 Shape → `layer.add(shape)`。
- **Stage 必须绑定 DOM 容器**：`container` 为元素 id 或 element 引用，浏览器端场景不能省略（Node.js 环境例外，见下）。
- **Layer 的本质**：一个独立的 `<canvas>` DOM 元素，内部含「可见 canvas + 隐藏 hit canvas」两张画布，hit canvas 专门加速事件命中判断。
- **Group 是纯容器**：不渲染任何像素，只用于批量管理/统一变换一组节点，本身可设 `draggable`。
- **Shape 通用属性**：`x/y/width/height/fill/stroke/strokeWidth/rotation/scaleX/scaleY/opacity/draggable/visible/listening/name/id`。
- **`draggable: true`**：即可让形状同时支持桌面鼠标拖拽和移动端触摸拖拽，无需手写 mousedown/mousemove/mouseup 状态机。
- **坐标获取**：`stage.getPointerPosition()` 是获取鼠标/触摸相对 Stage 坐标的标准 API，已处理好缩放换算，比自算 `clientX - rect.left` 更可靠。
- **像素比**：`Konva.pixelRatio` 全局设置，Retina 屏默认按设备像素比放大画布，设为 `1` 可换性能。
- **重绘范式**：`add` 后 Konva 会在下一帧自动重绘；手动多次修改属性时建议 `layer.batchDraw()` 合批。
- **Node.js 服务端渲染（v10 关键变更）**：v9 及更早 `npm install konva` 后端直接可用；**v10 起需显式**导入 `konva/canvas-backend` 或 `konva/skia-backend`，并额外安装 `canvas`/`skia-canvas` 依赖包，Stage 不需要 `container`。
- **学习资源**：官方文档站每页配 Vanilla/React/Vue 三套可运行示例（CodeSandbox）；Demos/Sandbox 索引页收录大量可运行示例，适合速查具体交互写法。
- **生产背书**：Meta、Microsoft、Labelbox、Polotno 等在生产环境使用（官方 About 页列出）；MIT 协议，持续维护。
- **架构心智**：把 Canvas 的「画完就忘」升级为保留模式的节点树，节点可持续被查询、变换、监听事件、二次修改，而不必重新绘制整个画面。
- **进阶顺序**：本页 → [Stage/Layer/Shape](./guide-line/stage-layer-shape) → [事件/拖拽/Transformer](./guide-line/events-drag-transform) → [动画与滤镜](./guide-line/animation-filters) → [序列化/react-konva/性能](./guide-line/serialization-react-performance) → [参考](./reference)。

## 一、Konva 是什么：保留模式场景图 vs Fabric / PixiJS / 原生 Canvas

原生 Canvas 2D API 是**立即模式**（immediate mode）绘图：调用 `fillRect`/`arc` 之后只剩下像素，浏览器不记得「这里有个矩形」，想让图形动起来只能清屏、以新坐标重画一帧；想知道「点击落在哪个图形上」，也只能自己维护对象数组做命中检测。Konva 把这套命令式绘制升级为**保留模式**（retained mode）的节点树：`Stage`（舞台）→ `Layer`（图层）→ `Group`（分组）→ `Shape`（具体图形）四层结构，每个节点持续存在，可以反复被查询、修改属性、绑定事件、二次变换——这一条差异是「选 Konva 还是纯 Canvas API」的根本判断依据。

面对同类库时的选型口径：

- **vs Fabric.js**：底层同为 2D Canvas API、同为保留模式，架构思路接近（两者都要面对「每个 Layer/canvas 都是一份开销」这类问题）。差异在定位——Fabric 更偏图像合成、对象级图片编辑（更像 Photoshop 式操作），Konva 更偏「点击/拖拽/缩放/旋转」这类 UI 级交互，`Transformer` 开箱即用的变换体验是 Konva 的差异化优势。
- **vs PixiJS**：PixiJS 基于 **WebGL**（可回退 Canvas），依靠 GPU 渲染管线，天生适合成百上千高频动画精灵、粒子特效、游戏渲染；Konva 基于 CPU 的 2D Canvas 光栅化，数千形状级别的 UI 交互场景完全够用，但拉到「海量精灵 + 高帧率」这个量级会先遇到性能天花板。一句话口径：**交互 UI 用 Konva，游戏/海量精灵动画用 PixiJS**。
- **vs 原生 Canvas API**：如果只是「画一次性静态图表、不需要后续交互查改」，原生 API 已经足够，引入 Konva 反而是不必要的抽象开销；一旦需要"用户能点选、拖拽已有图形"，保留模式的价值就体现出来了。

## 二、安装：npm / CDN / 框架绑定

浏览器端最基础的安装只需要一个包：

```bash
npm install konva
```

或直接用 CDN（适合原型验证、无构建工具的页面）：

```html
<script src="https://unpkg.com/konva@10/konva.min.js"></script>
```

如果项目走 React 或 Vue，官方绑定包会把所有内置形状映射成同名组件：

```bash
# React（react-konva@19.2.5，强绑定 React ^19.2.0，peerDeps 同时兼容 Konva 7/8/9/10）
npm install react-konva konva --save

# Vue（vue-konva@3.4.0，仅支持 Vue 3，peerDeps 要求 konva > 7）
npm install vue-konva konva --save
```

官方同时提供 Svelte、Angular 的官方绑定，覆盖本仓库之外的主流前端框架。TypeScript 类型内置在 `konva` 包里，不需要再单独装 `@types/konva`。

需要特别提醒的是**运行环境的分野**：以上安装方式默认针对浏览器。如果要在 Node.js 里做服务端渲染（生成分享图、报表配图等），`konva@10.x` 起需要额外显式导入渲染后端（`konva/canvas-backend` 或 `konva/skia-backend`）并安装对应依赖包——这是 v9 → v10 最容易踩的兼容性变更，完整写法见[参考页的 Node.js 小节](./reference)。

## 三、第一个 Stage → Layer → Shape

Konva 的最小可用代码固定是四步：创建 Stage → 创建 Layer 并挂到 Stage → 创建 Shape → 把 Shape 加到 Layer。

```javascript
import Konva from "konva";

// ① Stage：舞台，必须绑定一个 DOM 容器（元素 id 或 element 引用）
const stage = new Konva.Stage({
  container: "container", // 对应页面上一个空 div 的 id
  width: 500,
  height: 500,
});

// ② Layer：图层，本质是一个独立的 <canvas> 元素
const layer = new Konva.Layer();
stage.add(layer);

// ③ Shape：具体图形，这里创建一个圆
const circle = new Konva.Circle({
  x: 250,
  y: 250,
  radius: 70,
  fill: "red",
  stroke: "black",
  strokeWidth: 4,
});

// ④ 把 Shape 加入 Layer——add 之后 Konva 会在下一帧自动重绘
layer.add(circle);
// 手动多次修改属性（而非新增节点）时，建议改用 layer.batchDraw() 合批，
// 避免每次 setAttr 都触发一次重绘
```

几个第一次接触就要记住的事实：

- `Stage` 可以包含多个 `Layer`，但浏览器端场景下 `container` 不能省略。
- `add()` 触发的重绘是隐式、异步的（下一帧自动生效）；如果是「一次性修改多个已存在节点的属性」而非新增节点，显式调用 `layer.batchDraw()` 能避免多次重复重绘。
- 坐标原点在 Stage 左上角，`x`/`y` 分别向右、向下增长，和原生 Canvas 一致。

## 四、架构心智模型：像操作 DOM 一样操作图形节点

把 Konva 的四层结构类比成浏览器 DOM 树，是最快建立心智模型的方式：

```
Stage（舞台，对应一个 DOM 容器，可含多个 Layer）
 └─ Layer（图层，每个 Layer = 一个独立 <canvas> 元素，含"可见 canvas + 隐藏 hit canvas"两张画布）
     └─ Group（分组容器，本身不渲染，只用于批量管理/变换子节点）
         └─ Shape（具体图形：Rect/Circle/Text/Image/自定义…）
```

几个关键设计事实，决定了后续所有进阶主题的走向：

- **每个 `Layer` 内部维护两张 canvas**：一张正常显示场景，一张隐藏的「hit graph」（命中检测图）专门用于快速判断事件命中哪个节点，避免每次事件都做几何运算。这也是 Konva 的事件系统能做到「点哪个图形就精确响应哪个图形」而不需要开发者手写碰撞检测的底层原因。
- **为什么要多 Layer**：把「很少变化的背景」和「频繁移动的元素」分到不同 Layer，更新时只需重绘变化的 Layer，不必重绘整个场景——这是 Konva 性能优化的第一原则。但代价是每个 Layer 都是一个真实 DOM canvas，Layer 数量本身也是开销，需要权衡（详见[性能优化](./guide-line/serialization-react-performance)）。
- **保留模式的价值**：节点可持续被查询（`find`/`findOne`）、变换（改 `x`/`rotation`/`scaleX`）、监听事件、二次修改，而不必像原生 Canvas 那样重新绘制整个画面——这正是文档开篇强调的「像操作 DOM 节点一样操作图形节点」。

理解了这棵四层树，下一页就从 `Stage` 的坐标转换、`Layer`/`Group` 的容器语义、19 种内置形状讲起：[Stage / Layer / Shape：架构与节点操作](./guide-line/stage-layer-shape)。
