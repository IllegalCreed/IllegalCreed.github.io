---
layout: doc
---

# AntV G6

蚂蚁集团 AntV 出品的图可视化引擎（当前 **v5.1.x**，npm latest **5.1.1**，MIT 协议），专注于「关系数据」——点（Node）、边（Edge）及其分组（Combo）——的绘制、布局、交互、分析与动画能力，服务于社交网络、知识图谱、软件依赖图、组织架构图、资金链路图等场景。**v5 于 2023 年 GA，是一次彻底的架构重写**：渲染层换成自研的 `@antv/g`（类似 zrender 的图形引擎，支持 Canvas / SVG / WebGL 混合渲染），强制拆分「数据（`data`）」与「样式（`style`）」，统一图与树图为单一 `Graph` 类（不再有独立的 `TreeGraph`），元素 / 布局 / 行为 / 插件四大扩展点都走统一的 `register()` 机制，与 v4 API 几乎完全不兼容。截至本次调研，v5 是官方文档站（g6.antv.antgroup.com）唯一维护的版本线，v4 文档已归档到独立域名。

## 评价

**优点**

- v5 的架构重构红利明显：数据与样式强制分离、图与树图统一、扩展点统一注册，工程一致性与可维护性相比 v4 有质的提升。
- **18 种内置布局** + **10+ 种内置 Behavior 交互** + 丰富插件（minimap / tooltip / toolbar / contextmenu / fisheye / hull / edge-bundling 等），常见的关系图展示与探索需求开箱即用，很少需要手写。
- Canvas 默认渲染 + Web Worker / WASM / GPU 三种加速手段，数千节点级别的大图仍能流畅拖拽缩放，这是相比纯 HTML / SVG 的编辑类引擎（如 X6）的明显优势。
- 自带 `@antv/algorithm` 图算法包（最短路径、连通分量、社区发现、PageRank 等）+ 内置节点中心性，关系分析场景不需要另配算法库。
- UMD 包体积相比 v4 减小近一半（1.8MB → 0.96MB），模块化良好，未用到的元素 / 布局 / 行为 / 插件不会打进最终产物。

**缺点**

- v4 → v5 API 几乎推倒重来，网络上大量存量教程、AI 生成代码默认援引 v4 语法，抄错概率高，必须认版本号交叉验证。
- 定位专一：只做「关系数据」的展示与分析，不是通用统计图表库（柱状 / 折线 / 饼图找 G2 / ECharts），也不是可编辑的流程图 / 低代码画布引擎（那是 X6 的定位）。
- 3D 图、WebGPU / WASM 加速布局等属于进阶能力，多数几百到几千节点的常规业务场景用不到，学习性价比一般。
- 官方文档站没有独立的「图算法」教程页，算法能力散落在 `@antv/algorithm` 包 README 与内置中心性配置里，不如布局 / 交互文档体系完整。

## 本叶地图

- [入门](./getting-started) —— 定位（关系数据可视化 vs 统计图表 / 裸写 D3）、安装、第一个图、Graph 实例与 data 驱动、React / Vue 集成
- [Graph 与元素](./guide-line/graph-and-elements) —— Graph 生命周期方法全表、数据模型（`data`/`style` 分离与优先级）、节点 / 边 / Combo / Shape 体系、主题调色板、动画
- [状态与交互](./guide-line/state-and-behavior) —— 内置 5 种状态、Behavior 交互体系全表、事件系统（pointer 统一、生命周期 before/after）
- [布局](./guide-line/layout) —— 18 种布局全解：力导向系、层次树系、环形辐射系、结构化、分组、降维，及 Web Worker / WASM / GPU 加速
- [插件、算法与性能](./guide-line/plugins-algorithm-performance) —— 插件体系全表、数据转换器 Transform、`@antv/algorithm` 图算法、渲染器与大规模图性能优化
- [参考](./reference) —— 布局 / behavior / 插件速查表、API 速查、v4 → v5 迁移对照、易错点清单、选型对比、权威链接

## 文档地址

[AntV G6 官方文档](https://g6.antv.antgroup.com)

## GitHub 地址

[antvis/G6](https://github.com/antvis/G6)

## 幻灯片地址

<a href="/SlideStack/antv-g6-slide/" target="_blank">AntV G6</a>
