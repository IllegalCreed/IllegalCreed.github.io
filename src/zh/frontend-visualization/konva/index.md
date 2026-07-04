---
layout: doc
---

# Konva

Konva 是一个把「DOM 树 + 事件模型」搬进 HTML5 Canvas 的**声明式 2D 场景图框架**——用 Stage → Layer → Group → Shape 的节点树代替裸 Canvas 的命令式绘制，开箱即带事件系统、拖拽、变换器（Transformer）、补间动画、滤镜与序列化，让「可交互的 2D 图形应用」（设计器、白板、图表编辑、地图标注）不必从零手撸命中检测和状态管理。作者 Anton Lavrenov 2014 年基于自己更早的 KineticJS 项目重写，MIT 协议持续维护，当前版本 **`konva@10.3.0`**（2026-04-30 发布，npm 实测），周边官方绑定 `react-konva@19.2.5`（强绑定 React 19）、`vue-konva@3.4.0`（仅支持 Vue 3），另有 Svelte、Angular 官方包。v9 → v10 的关键差异集中在 **Node.js 服务端渲染方式**：v10 起移除了自动后端探测，需显式导入 `canvas-backend` 或 `skia-backend`；日常浏览器端业务 API（Rect/Circle/事件/拖拽/Transformer/动画/滤镜）v9 与 v10 用法一致，可视为同一套心智模型。

## 评价

**优点**

- **心智模型清晰**：像操作 DOM 节点一样操作图形节点，场景树可持续查询、修改、监听，区别于原生 Canvas 的「画完即忘」
- **`Transformer` 开箱即用**：缩放/旋转/多选交互是同类库里最省心的实现之一，设计器/白板类应用几乎不用自己写变换逻辑
- **框架绑定质量高**：React/Vue/Svelte/Angular 官方包齐全、更新及时，TypeScript 类型内置无需 `@types`
- **文档对选型友好**：官方文档站每页都配 Vanilla/React/Vue 三套可运行示例（CodeSandbox）

**局限**

- **基于 2D Canvas API（非 WebGL）**：不适合大规模粒子/高频动画场景，这类场景 PixiJS（WebGL）更合适
- **Layer 数量是隐形成本**：每个 Layer 都是一个独立 `<canvas>` DOM 元素，滥用分层会直接拖垮性能，需要开发者主动做分层规划
- **序列化非存档方案**：官方明确不建议把 `toJSON`/`Node.create` 直接用于复杂应用的存档，推荐「业务状态驱动」模式

官方 About 页列出 Meta、Microsoft、Labelbox（数据标注）、Polotno（设计工具）等生产使用者。**适用边界**：需要「点击/拖拽/缩放/旋转」等 UI 级交互的 2D 图形场景（设计器、白板、标注工具、图表编辑器）首选 Konva；纯展示型一次性绘制可用原生 Canvas 足够；游戏/粒子/高帧率动画场景应转向 PixiJS 或 WebGL 方案。本仓库技术栈是 Vue 3，`vue-konva` 是对应的集成方案。

## 本叶地图

- [入门](./getting-started) —— 定位（声明式场景图 vs Fabric/PixiJS/原生 Canvas）、安装、第一个 Stage-Layer-Shape、架构心智模型
- [Stage / Layer / Shape](./guide-line/stage-layer-shape) —— 架构总览、Stage 坐标转换、Layer 与 Group、19 种内置形状与通用属性、自定义 Shape、节点操作与选择器
- [事件、拖拽与 Transformer](./guide-line/events-drag-transform) —— 事件系统、拖拽 draggable 与方向限制、Transformer 变换器基础与进阶
- [动画与滤镜](./guide-line/animation-filters) —— Konva.Animation 帧循环、Konva.Tween 与 Easings、滤镜 Filters 与 cache
- [序列化、react-konva 与性能](./guide-line/serialization-react-performance) —— 数据序列化最佳实践、React/Vue 框架集成、性能优化全景
- [参考](./reference) —— 类/形状/事件/API 速查表 + 选型对比 + 资源链接

## 文档地址

[Konva](https://konvajs.org/) ｜ [Docs](https://konvajs.org/docs/index.html)

## GitHub 地址

[konvajs/konva](https://github.com/konvajs/konva)

## 幻灯片地址

<a href="/SlideStack/konva-slide/" target="_blank">Konva</a>
