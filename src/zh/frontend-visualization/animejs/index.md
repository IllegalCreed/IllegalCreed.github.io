---
layout: doc
---

# Anime.js

官网一句话定位：**"A fast and flexible JavaScript library to animate the web."**（快速灵活的网页动画 JS 库），npm description 则简写为 `"JavaScript animation engine"`——关键词是**轻量、模块化、ESM-first、tree-shakeable、框架无关**（vanilla JS 为核心心智，官方文档另给 React 接入范式）。当前版本 **v4.5.0**（2026-06-22 发布，npm 实测，MIT 协议，作者 Julian Garnier）。**2025-04-03 的 v4.0.0 是一次完全重写**——官方 release note 原话："A complete rewrite of Anime.js, with a modular, ESM-first API, improved performance, and TONS of new features."，`package.json` 的 `exports` 字段暴露十余个可独立按需引入的子路径（`./animation` `./timeline` `./draggable` `./svg` `./easings` `./utils` 等），是"模块化 ESM 架构"的直接证据。v4 时代的 Anime.js 已不只是一个补间动画库，而是扩展成一整套动画引擎家族：Timer（计时器）/ Animation（补间）/ Timeline（编排）/ Animatable（高频取值）/ Draggable（拖拽物理）/ ScrollObserver（滚动联动）/ Scope（框架作用域）/ SVG（形变+描边+路径运动）/ Text（拆字+scramble）/ Layout（自动布局）/ Adapters（Three.js 等非 DOM 目标），功能广度已追近 GSAP 生态。**v4 内部也持续演进**：v4.1.0 加 `text.split()`/`scope.addOnce()`，v4.4.0 是一次含 breaking change 的更新（transform 渲染顺序固定、函数式回调第三参数变化），v4.5.0 新增 `registerAdapter()` 与内置 Three.js adapter——写代码/查资料都要认清版本号，不能假设"v4"是铁板一块。

## 评价

**优点**

- **轻量可按需引入**：ESM-first 具名导出，`waapi.animate()` 轻量入口约 3KB，完整 JS 版 `animate()` 约 10KB，还可以走子路径导入进一步裁剪体积
- **框架无关但有官方接入范式**：vanilla JS 为核心心智，`createScope()` + `useEffect` 给 React 等框架提供标准接入方式
- **SVG 特色能力突出**：`svg.morphTo()` 形变、`svg.createDrawable()` 描边、`svg.createMotionPath()` 路径运动，声明式思路比手工计算 `stroke-dashoffset` 直观得多
- **缓动体系丰富**：内置 ease 全家族（`in`/`out`/`inOut`/`outIn` 四态）之外还有物理级 `spring()`、`steps()`、`cubicBezier()`、`linear()`、`irregular()`
- **MIT 完全免费开源**：无商业限制，作者 + 社区维护
- **持续扩展新目标**：v4.5.0 `registerAdapter()` 让 `animate()`/`utils.set()` 可以扩展到 Three.js 等非 DOM 目标

**缺点**

- **历史包袱重**：v3→v4 是不兼容的完全重写，网上大量 v3 教程/StackOverflow 答案（`anime({targets, easing:'easeInOutQuad'})` 写法）在 v4 下直接报 `anime is not a function`
- **TypeScript 非设计时优先**：类型是文档化提供，不是"设计时即 TS-first"
- **部分模块仍在快速迭代**：Draggable/ScrollObserver/Layout 是 v4 才补齐的能力，边缘案例覆盖不如 GSAP 插件生态打磨得久
- **v4 内部也有 breaking change**：v4.4.0 就动了 transform 渲染顺序和函数式取值回调的第三参数，不能认为"过了 v3→v4 这道坎就一劳永逸"

**适用场景**

需要**轻量、免费、非框架绑定**、又要 SVG 形变/描边/路径运动这类"特色效果"时优先 Anime.js；vs [GSAP](../gsap/) 更看重插件生态成熟度与极致边缘案例稳定性时选 GSAP；vs [原生 WAAPI](../waapi/) 只需零依赖极简单一次性过渡时手写 WAAPI；vs [Framer Motion](../framer-motion/)（已更名 Motion）已是 React/Vue 技术栈且要动画状态与组件状态强绑定时选它。完整对比表见[参考页](./reference)。

## 本叶地图

- [入门](./getting-started) —— 定位（轻量模块化 ESM-first vs GSAP/WAAPI）、v4 完全重写背景与安装、`animate()` 第一个动画、v3→v4 迁移提醒
- [animate() 与参数](./guide-line/animate-and-parameters) —— targets 四种类型、可动画属性与 transform 渲染顺序、Tween Value 六种写法、`duration`/`delay`/`loop`/`ease` 等核心参数
- [Timeline 与 stagger](./guide-line/timeline-and-stagger) —— Timer 基类、`createTimeline()` 位置参数编排、`stagger()` 交错三维度、keyframes 四种写法
- [SVG 与 Draggable](./guide-line/svg-and-draggable) —— `morphTo` 形变、`createDrawable` 描边、`createMotionPath` 路径运动、`createDraggable` 拖拽物理
- [ScrollObserver / utils / eases](./guide-line/scroll-utils-eases) —— `onScroll()` 滚动联动、`utils` 工具函数、eases 缓动全家族与 `spring()`、Engine 性能配置
- [参考](./reference) —— API 速查表 + v3→v4 对照 + 选型对比 + 资源链接

## 文档地址

[Anime.js 官网](https://animejs.com) ｜ [文档](https://animejs.com/documentation/)

## GitHub 地址

[juliangarnier/anime](https://github.com/juliangarnier/anime)

## 幻灯片地址

<a href="/SlideStack/animejs-slide/" target="_blank">Anime.js</a>
