---
layout: doc
---

# PixiJS

网页端最快、最轻量的 **2D 渲染引擎**，基于 WebGL（默认）与 WebGPU（可选）双后端，专为游戏、交互式应用与数据可视化等需要大量图形对象、高帧率渲染的场景设计。当前主线是 **v8**（npm 实测 `8.19.0`），相对 v7 是一次架构级重写——为原生支持 WebGPU，`Application` 初始化、`Graphics` 绘图 API、事件系统、`ParticleContainer` 等核心模块几乎全部推倒重来，同时强制 ES Module 心智：单包 `pixi.js` 通过 `exports` 字段暴露 `pixi.js/accessibility`、`pixi.js/advanced-blend-modes` 等按需子入口。核心心智模型是**场景图（Scene Graph）**：一棵以 `app.stage` 为根的 `Container` 树，每帧沿树累积计算世界变换（`worldTransform`）与透明度（`worldAlpha`，父子相乘），再交给渲染管线批处理成尽量少的 GPU draw call。

## 评价

**优点**

- **性能是第一卖点**：GPU 批处理、纹理图集、`ParticleContainer`/`Particle` 等专为「海量精灵」设计的机制，60fps 下可承载成百上千乃至数十万交互对象
- **场景图模型清晰**：`Container`/`Sprite`/`Graphics` 职责彻底分离（v8 起叶子节点不可再 `addChild`）、贴近游戏引擎心智，`Transform` 继承直观
- **图形/文本/滤镜体系成熟**：v8 全新链式 Graphics API（先画形状再 `fill()`/`stroke()`）、Text/BitmapText/HTMLText 三档文本方案各有取舍、内置滤镜 + 自定义 Filter 双后端（WebGL/WebGPU）支持
- **资源与事件自成体系**：`Assets` 是基于 Promise 的现代加载器（Manifest/Bundle 分组懒加载、Resolver 多分辨率解析）；Federated Events 提供 DOM 风格交互 API（`eventMode` 精细控制）
- **官方 DevTools**：浏览器扩展可视化查看场景图层级与渲染性能，调试体验完整自成一体

**缺点**

- **v8 是破坏性重写**：相对 v7 几乎所有核心 API 都变了（`Application` 改异步 init、Graphics 全新链式调用、`eventMode` 取代 `interactive`、大量类改名如 `NineSlicePlane`→`NineSliceSprite`），历史项目升级成本高
- **不是图表库/UI 框架**：本身不提供图表、按钮、布局组件，做数据可视化或界面需要自己在渲染引擎之上搭建图形逻辑，这正是它区别于 ECharts 这类「开箱即用」库的地方
- **学习曲线不算低**：需要理解 `Container`/`Texture`/`Assets` 异步加载、`eventMode` 五态等概念，对「只想画个静态图表」的轻量需求偏重
- **量级小就没必要上**：一次性绘制、图元数量有限的场景，原生 Canvas 2D 已经足够，上 PixiJS 属于杀鸡用牛刀

## 文档地址

[PixiJS 官网](https://pixijs.com) ｜ [8.x 指南](https://pixijs.com/8.x/guides/getting-started/intro)

## GitHub 地址

[pixijs/pixijs](https://github.com/pixijs/pixijs)

## 幻灯片地址

<a href="/SlideStack/pixi-slide/" target="_blank">PixiJS</a>
