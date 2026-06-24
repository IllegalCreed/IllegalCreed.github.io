---
layout: doc
---

# CSS Grid 网格布局

CSS Grid 是浏览器原生的**二维布局系统**——同时控制行与列，把页面划成一张由「线、轨道、单元格、区域」构成的网格，再把元素摆进去。它和 Flexbox 不是竞争关系：Flexbox 沿一根主轴排一串内容（一维），Grid 则同时对齐两个方向（二维），处理「整页骨架、卡片画廊、仪表盘」这类需要横竖都对齐的版面时，它是最直接、最少 hack 的工具。本叶讲透从轨道定义、模板区域、放置语法，到隐式网格、`subgrid` 子网格与实战配方的完整链路。

## 概述

- **它管什么**：用 `grid-template-columns` / `grid-template-rows` 划出**轨道**（行、列），用 `fr` / `minmax()` / `repeat()` 控制每条轨道的尺寸；再用基于线的坐标（`grid-column` / `grid-row`）或命名区域（`grid-template-areas`）把每个子元素放到网格里。
- **为什么值得认真学**：响应式画廊一行 `repeat(auto-fit, minmax(200px, 1fr))` 就能自适应列数、不用一个媒体查询；整页「头/侧/主/脚」骨架用 `grid-template-areas` 画成 ASCII 图、可读性碾压一切；横竖同时对齐是 Flexbox 做不到的。这套能力一旦上手，会重写你对 CSS 布局的直觉。
- **现代化关注点**：`subgrid` 子网格（让嵌套网格继承父级轨道，2023 年 9 月起 Baseline 广泛可用，彻底解决「卡片内部对不齐」）、`repeat(auto-fit/auto-fill, minmax())` 的 RAM 响应式模式、`min-content` / `max-content` / `fit-content()` 内容驱动尺寸、`gap` 统一间距；`masonry`（瀑布流）仍是实验特性、尚未进入 Baseline，需降级。

## 本叶地图

- [入门](./getting-started) —— 五个核心概念（容器 / 轨道 / 线 / 单元格 / 区域）+ 一张「能跑」的最小网格，建立全局直觉
- [网格轨道与 fr/minmax/repeat](./guide-line/grid-tracks) —— `grid-template-columns/rows` 的轨道尺寸：`fr` 弹性单位、`minmax()`、`repeat()`、内容关键字
- [模板区域 `grid-template-areas`](./guide-line/template-areas) —— 用 ASCII 图画版面，`grid-area` 命名，`.` 留空，`grid-template` 简写
- [基于线与区域放置](./guide-line/line-area-placement) —— `grid-column/row` 坐标、`span` 跨越、负数线 `-1`、命名线，以及 `grid-area` 的两种含义
- [隐式网格与自动布局](./guide-line/implicit-grid) —— `grid-auto-rows/columns`、`grid-auto-flow`（含 `dense`），以及 `auto-fill` vs `auto-fit` 的关键差异
- [`subgrid` 子网格](./guide-line/subgrid) —— 嵌套网格继承父级轨道 / 命名线 / 间距，核准 Baseline 状态，解决卡片对齐难题
- [Grid 实战](./guide-line/grid-patterns) —— 响应式画廊、整页仪表盘、RAM 模式、圣杯布局等可直接抄走的配方
- [参考](./reference) —— 速查表 + 容器 / 项目属性表 + RAM 配方 + Baseline 状态 + 权威链接

## 文档地址

- [web.dev: Learn CSS — Grid](https://web.dev/learn/css/grid)
- [MDN: CSS grid layout（指南）](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout)
- [MDN: Basic concepts of grid layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Basic_concepts_of_grid_layout)
- [MDN: Subgrid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Subgrid)

## 幻灯片地址

<a href="/SlideStack/css-grid-slide/" target="_blank">CSS Grid 网格布局</a>
