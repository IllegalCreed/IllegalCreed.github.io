---
layout: doc
---

# AntV X6

**X6 是蚂蚁集团开源的、基于 HTML 和 SVG 的图编辑引擎**（当前 **v3.1.x**，npm latest **3.1.7**，2026-03-18 发布）。官方原话："X6 是基于 HTML 和 SVG 的图编辑引擎，提供低成本的定制能力和开箱即用的内置扩展，方便我们快速搭建 DAG 图、ER 图、流程图、血缘图等应用。"四大特性：**极易定制**（SVG/HTML/React/Vue/Angular 均可定制节点）、**开箱即用**（10+ 内置扩展：框选、对齐线、小地图等）、**数据驱动**（MVC 架构）、**事件驱动**（图内任何操作皆可监听）。3.x 是近 8 个月内的重大重构：原本 11 个独立 `@antv/x6-plugin-*` 插件包（连同 `x6-common`/`x6-geometry`）全部整合进主包 `@antv/x6` 统一导出，动画系统也从 `transition` 换成基于 Web Animations API 的 `animate`。

## 评价

**优点**

- 渲染上用 SVG 承载节点/边的图形骨架，`shape: 'html'` 节点还能借 `foreignObject` 内嵌任意 HTML——可以把 Vue/React 组件直接"种"进节点里，这是 X6 相比纯 Canvas 方案最大的差异化能力。
- markup（结构）+ attrs（样式）机制类比 HTML + CSS，定制节点外观的心智负担很低，`Node.register()`/`Graph.registerNode()` 可复用配置。
- 3.x 插件包全部收编进主包，`npm install @antv/x6` 一个包即可覆盖 Selection/Snapline/Transform/Keyboard/Clipboard/History/Stencil/MiniMap/Scroller/Export 十种能力，安装心智成本大幅下降。
- 官方中文文档结构清晰、教程与 API 分离，国内团队友好。

**缺点**

- 大图场景 DOM 节点数会成为性能瓶颈（通常几百节点开始掉帧），大规模关系图场景应优先看 Canvas 方案的同门 AntV G6。
- 框架 shape 包（`x6-vue-shape`/`x6-react-shape`/`x6-angular-shape`）**未被 3.x 整合**，仍需单独安装且必须与主包大版本严格对齐，是新手最容易踩的升级坑。
- X6 **没有内置自动布局算法**，DAG 场景需要业务方自行引入 `dagre` 计算节点坐标。
- v3 转正距今仅约 8 个月，网络上大量存量教程/AI 生成代码仍停留在 2.x 语法（独立插件包导入、`transition` 动画），版本鉴别成本高。

X6 与同门 **AntV G6** 的分野是本领域必考选型题：G6 是"图**可视化/分析**引擎"（面向关系数据的只读展示），X6 是"图**编辑**引擎"（面向用户在画布上增删改连线的交互式编辑场景）。二者共享"图"这个数据结构，但服务的用户操作完全不同——需要用户拖拽绘制/编辑流程图、DAG、ER 图 → 选 X6；只需要展示/分析关系数据 → 选 G6。

## 本叶地图

- [入门](./getting-started) —— 定位（图编辑引擎 vs G6 图分析）、安装、第一个画布、Graph 与节点边基础
- [画布与节点边](./guide-line/graph-nodes-edges) —— Graph 画布配置、节点内置形状与 markup/attrs 机制、边 source/target 写法与 router/connector
- [连接桩与连接交互](./guide-line/ports-and-connecting) —— Port 分组与布局算法、`connecting` 拖拽创建/校验规则（必考）
- [交互与插件](./guide-line/interaction-and-plugins) —— Selection/Snapline/Transform/Keyboard/Clipboard/History + Stencil/MiniMap 插件，v3 插件整合进主包
- [自定义节点与数据](./guide-line/customization-and-data) —— HTML/Vue/React 自定义节点、序列化 fromJSON/toJSON、事件系统、动画 animate、导出
- [参考](./reference) —— 节点/边/连接桩/插件/事件速查表 + v2→v3 迁移对照 + 权威链接

## 文档地址

[AntV X6 官方文档](https://x6.antv.antgroup.com)

## GitHub 地址

[antvis/X6](https://github.com/antvis/X6)

## 幻灯片地址

<a href="/SlideStack/antv-x6-slide/" target="_blank">AntV X6</a>
