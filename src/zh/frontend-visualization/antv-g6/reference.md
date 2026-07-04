---
layout: doc
outline: [2, 3]
---

# 参考：G6 速查表

> 基于 **AntV G6 v5.1**（npm latest 5.1.1）· 核于 2026-07

## 速查

- **定位**：蚂蚁 AntV 关系数据图可视化引擎（点 + 边 + Combo），非统计图表库、非画布编辑器
- **唯一入口类** `Graph`：`new Graph({ container, data, node, edge, layout, behaviors, plugins, theme })` → `await graph.render()` → `graph.destroy()`
- **数据 / 样式分离**：`data` 装业务字段，`style` 装视觉字段；三类元素 `id`/`type`/`data`/`style`/`states` 结构一致
- **节点 10 种**：circle/rect/ellipse/diamond/triangle/hexagon/star/donut/image/html；**边 6 种**：line/polyline（A* 避障）/quadratic/cubic/cubicVertical/cubicHorizontal；**Combo 2 种**：circle/rect
- **状态 5 种**：selected/active/highlight/inactive/disabled；样式优先级（低到高）：`主题默认 < 调色板 < 数据样式 < 图默认 < 主题状态 < 图状态`
- **18 种布局**：力导向系（force/d3-force/d3-force-3d/force-atlas2/fruchterman）、层次树系（dagre/antv-dagre/树形四种）、环形辐射系（circular/radial/concentric）、结构化（grid/random/snake/fishbone）、分组（combo-combined）、降维（mds）
- **`antv-dagre` vs `dagre`**：增强版多 `nodeOrder`/`edgeLabelSpace`/`sortByCombo` 配置，官方未定性能优劣，按需选型
- **Behavior 5 大类**：画布导航（drag-canvas/zoom-canvas/scroll-canvas）、选择（click-select/brush-select/lasso-select）、编辑（create-edge/drag-element）、数据探索（collapse-expand/focus-element/hover-activate）、视觉优化（fix-element-size/auto-adapt-label）
- **Plugin 5 大类**：视觉增强（grid-line/background/watermark/hull/bubble-sets/snapline）、导航概览（minimap/fullscreen/timebar）、交互控件（toolbar/contextmenu/tooltip/legend）、数据探索（fisheye/edge-filter-lens/edge-bundling）、高级（history）
- **Extension ⊃ Plugin**：Extension 是元素 / 布局 / 行为 / 插件所有可注册内容的统称，Plugin 只是其中面向功能扩展的一种
- **Transform（v5 新概念）**：`process-parallel-edges`（平行边处理）/`map-node-size`（按中心性映射大小）/`place-radial-labels`（辐射标签防倒置），时机分 `beforeDraw`/`afterLayout`
- **图算法两来源**：`@antv/algorithm`（dijkstra/floydWarshall/connectedComponent/louvain/pageRank 等纯函数）+ G6 内置中心性（degree/betweenness/closeness/eigenvector/pagerank）
- **易混淆点**：`polyline` 的 `shortest-path` 用 A* 做视觉走线避障，`@antv/algorithm` 的 `dijkstra` 是图论最短路径，两个不同概念
- **渲染器三选一**：Canvas（默认）/SVG/WebGL，`renderer` 可按图层回调实现混合渲染；**无独立切换 API**，动态切换走 `setOptions()`
- **事件统一 pointer**：`目标类型:动作` 命名，`node:click`/`edge:click`/`canvas:wheel`；生命周期成对 `before/after`（`beforerender`/`afterrender` 等）
- **v4 → v5 是断代式重写**：数据样式分离、`behaviors` 替代 `modes`、`setData()` 替代 `data()`/`changeData()`、统一 `register()` 替代多个 `registerXxx()`，完整对照见下表六
- **性能五件套**：Web Worker 布局 + WASM/GPU 加速 + 视口裁剪 + Canvas 渲染器 + 边聚合（edge-bundling/process-parallel-edges）
- **框架集成范式**：ref 缓存实例 + 挂载创建 / 卸载 `destroy()` + 更新前判断 `!graph.destroyed`；数据变化用 `setData()`+`render()`，不重建实例
- **选型口径**：展示 / 分析关系数据选 G6；用户在线编辑图结构选 X6；节点数很小且已用 ECharts 选它的 `graph` series；纯统计图表选 G2/ECharts

## 一、布局速查表

| 分类 | 算法 | 关键参数 / 说明 |
| --- | --- | --- |
| 力导向 | `force` | `nodeStrength`(1000)/`edgeStrength`(500)/`linkDistance`(200)/`gravity`(10)/`preventOverlap`(true)/`damping`(0.9) |
| | `d3-force` | link/many-body/center/collide/radial 五力独立调参 |
| | `d3-force-3d` | 3D 力导向 |
| | `force-atlas2` | 大规模复杂图力导向变体 |
| | `fruchterman` | 经典算法，支持 GPU/WASM |
| 层次 / 树 | `dagre` | `rankdir`(TB默认)/`align`/`nodesep`(50)/`ranksep`(100)/`ranker` |
| | `antv-dagre` | dagre 基础 + `nodeOrder`/`edgeLabelSpace`/`sortByCombo` |
| | `compact-box`/`dendrogram`/`indented`/`mindmap` | 树形图专用（紧凑树 / 谱系树 / 缩进树 / 脑图） |
| 环形 / 辐射 | `circular` | 扁平非层级网络，可调起止半径形成螺旋 |
| | `radial` | `focusNode`/`unitRadius`(100)/`linkDistance`(50)/`strictRadial`(true)，有明确中心焦点 |
| | `concentric` | `sortBy`(默认 degree)，重要节点居中 |
| 结构化 | `grid` | 矩阵 / 表格式排列 |
| | `random`/`snake`/`fishbone` | 随机 / 蛇形 / 鱼骨排列 |
| 分组 | `combo-combined` | `innerLayout`(默认 ConcentricLayout)+`outerLayout`(默认 ForceLayout) |
| 降维 | `mds` | 高维相似度矩阵降维定位 |

预布局（dagre/circular/grid，一次性算完）vs 实时布局（force 系持续迭代，可 `maxIteration`/`minMovement` 提前终止，配合 `drag-element-force` 拖拽实时反馈）。加速：`enableWorker: true`（Web Worker）/ WASM（Fruchterman/ForceAtlas2/Force/Dagre）/ WebGPU（Fruchterman/GForce）。手动控制：`graph.layout()`/`graph.setLayout()`/`graph.stopLayout()`。

## 二、Behavior 速查表

| 分类 | Behavior | 关键参数 / 说明 |
| --- | --- | --- |
| 画布导航 | `drag-canvas` | 拖动画布视图 |
| | `zoom-canvas` | 缩放画布 |
| | `scroll-canvas` | 滚轮滚动 |
| | `optimize-viewport-transform` | 大图场景优化视图变换性能 |
| 选择 | `click-select` | 点击选择 |
| | `brush-select` | `mode`(union/intersect/diff/default)、`trigger`(默认 `['shift']`)、`enableElements` |
| | `lasso-select` | 套索选择 |
| 编辑 | `create-edge` | `trigger`(drag 默认/click)、`onCreate`/`onFinish` |
| | `drag-element` | 拖动节点 / Combo，`dropEffect: 'link'` 可重分配 Combo 归属 |
| | `drag-element-force` | 力导向布局中拖动并联动模拟 |
| 数据探索 | `collapse-expand` | `trigger`(默认 dblclick)、`onCollapse`/`onExpand`；程序化 API `collapseElement`/`expandElement` |
| | `focus-element` | 聚焦元素并调整视图 |
| | `hover-activate` | 悬停高亮 |
| 视觉优化 | `fix-element-size` | 缩放画布时固定元素大小 |
| | `auto-adapt-label` | 按中心性自动调整标签显隐 / 位置 |

自定义 Behavior 需先 `register()` 注册。动态管理：`graph.setBehaviors([...])` 整体替换、`graph.updateBehavior({ key, ... })` 改单个参数。

## 三、插件 Plugin 速查表

| 分类 | 插件 | 关键参数 / 说明 |
| --- | --- | --- |
| 视觉增强 | `grid-line` | 参考网格，**父容器需自身有具体宽高** |
| | `background` | 背景图 / 背景色 |
| | `watermark` | 水印 |
| | `hull` | `members`、`concavity: Infinity` 为凸包 |
| | `bubble-sets` | 更柔和的轮廓 |
| | `snapline` | 拖动对齐参考线 |
| 导航概览 | `minimap` | `size`/`position`/`padding`；**不兼容 React Node** |
| | `fullscreen` | 全屏 |
| | `timebar` | 时间轴筛选 / 播放 |
| 交互控件 | `toolbar` | 内置 zoom-in/zoom-out/redo/undo/edit/delete/auto-fit/export/reset/request-fullscreen/exit-fullscreen |
| | `contextmenu` | `getItems` 支持返回 Promise |
| | `tooltip` | `trigger`(hover 默认/click)、`getContent` |
| | `legend` | 图例 |
| 数据探索 | `fisheye` | `r`(120)/`d`(1.5)/`trigger`(pointermove 默认/click/drag) |
| | `edge-filter-lens` | 区域内边筛选 |
| | `edge-bundling` | FEDB 算法，`bundleThreshold`/`K`/`cycles` |
| 高级 | `history` | 撤销 / 重做 |

动态更新：`graph.updatePlugin({ key, ... })` 按 `key` 定位。

## 四、API 速查

**Graph 生命周期与数据方法**：

| 方法 | 作用 |
| --- | --- |
| `render()` | 完整流程：处理数据 → 计算布局 → 绘制（返回 `Promise<void>`） |
| `draw()` | 只重绘不重算布局，纯样式 / 状态更新用 |
| `setData(data)` / `getData()` | 覆盖式设置 / 读取全部数据 |
| `addNodeData()`/`addEdgeData()`/`addComboData()` | 增量添加，支持函数 `(prev) => next` |
| `updateNodeData()`/`updateEdgeData()` | 增量更新变化字段 |
| `removeNodeData()`/`removeEdgeData()` | 增量删除 |
| `getNodeData()`/`getEdgeData()`/`getComboData()` | 数据查询 |
| `fitView(options?, animation?)` / `fitCenter(animation?)` | 缩放适配可见 / 仅居中 |
| `zoomTo(zoom)` / `zoomBy`/`translateBy`/`translateTo` | 绝对 / 相对缩放平移 |
| `collapseElement(id)`/`expandElement(id)` | 程序化收起 / 展开 |
| `setElementState(id, state)`/`getElementState(id)`/`getElementDataByState(type, state)` | 状态编程 API |
| `setBehaviors()`/`updateBehavior()`/`updatePlugin()` | 交互 / 插件动态管理 |
| `setTheme()`/`getTheme()` | 主题切换 |
| `setTransforms()`/`updateTransform()` | 数据转换器管理 |
| `layout()`/`setLayout()`/`stopLayout()` | 布局手动控制 |
| `destroy()` | 销毁释放资源 |

**元素类型速记**：节点 10 种（circle/rect/ellipse/diamond/triangle/hexagon/star/donut/image/html）；边 6 种（line/polyline/quadratic/cubic/cubicVertical/cubicHorizontal）；Combo 2 种（circle/rect）；Shape 体系：keyShape（包围盒 + 交互检测 + 状态默认作用对象）/labelShape/haloShape/badgeShape/portShape。

**主题与调色板**：`light`/`dark` 两套主题（背景 + 节点 + 边 + Combo 四部分）；调色板 5 种离散色板 spectral/tableau/oranges/greens/blues，三种模式（简单 / 分组 / 数值映射），节点 Combo 作用于 `fill`、边作用于 `stroke`。

**事件命名**：`目标类型:动作`，节点 `node:click`/`pointerenter`/`dragstart`……，边 / Combo 同构，画布额外 `canvas:wheel`；生命周期成对 `beforerender`/`afterrender`、`beforelayout`/`afterlayout`、`beforetransform`/`aftertransform`、`beforeelementstatechange`/`afterelementstatechange`、`beforedestroy`/`afterdestroy`、`batchstart`/`batchend`；事件对象 `target`/`targetType`/`originalTarget`/`originalEvent`。

## 五、图算法与中心性速查

| 来源 | 内容 |
| --- | --- |
| `@antv/algorithm`（纯函数包） | `dijkstra`/`floydWarshall`/`findPath`/`connectedComponent`/`detectCycle`/`dfs`/`degree`/`adjacentMatrix`/`labelPropagation`/`louvain`/`pageRank`/`neighbors` |
| G6 内置中心性 | `degree`/`betweenness`/`closeness`/`eigenvector`/`pagerank`，直接在 `transform`（如 `map-node-size`）里配置，无需额外引入算法包 |
| 边路由算法 | `polyline` 边 `shortest-path` 路由用 A* 算法做视觉走线避障，与图论最短路径 `dijkstra` 是不同概念 |

## 六、v4 → v5 迁移对照表

v5 是一次彻底的架构重写，核心迁移对照：

| v4 | v5 | 说明 |
| --- | --- | --- |
| `{ id, label, size }` 平铺字段 | `{ id, data: { label }, style: { size } }` | 数据 / 样式强制分离 |
| `fitView`/`fitCenter`（配置项） | `autoFit: 'view' \| 'center'` | 合并为统一枚举配置 |
| `fitViewPadding` | `padding` | 改名 |
| `linkCenter` | （移除，自动处理边连接点） | — |
| `modes` | `behaviors` | 交互模式 → 行为数组 |
| `defaultNode` | `node.style` | 样式层级下沉 |
| `nodeStateStyles` | `node.state` | 状态样式重组织 |
| `animate`/`animateCfg` | `animation` | 合并 |
| `minZoom`/`maxZoom` | `zoomRange: [min, max]` | 数组形式 |
| `data()`/`changeData()` | `setData()` | — |
| `save()` | `getData()` | — |
| `getNodes()`/`getEdges()`/`findById()` | `getNodeData()`/`getEdgeData()` | 数据查询 API 化 |
| `zoom()`/`translate()`/`moveTo()` | `zoomBy()`/`translateBy()`/`translateTo()` | 视图操作改名 |
| `focusItem()` | `focusElement()`（行为） | — |
| `addItem()`/`updateItem()`/`removeItem()` | `addNodeData()` 等数据 API | 移除 Item 概念 |
| `setMode()`/`setCurrentMode()` | `setBehaviors()` | — |
| `getUndoStack()`/`pushStack()` | `history` 插件 | 撤销重做迁移为插件 |
| `registerNode()`/`registerEdge()`/`registerLayout()`… | 统一 `register()` | 多函数合一 |
| `mouse`/`touch` 事件 | 统一 `pointer` 事件 | — |
| `graphstatechange` | `beforeelementstatechange`/`afterelementstatechange` | — |
| `viewportchange` | `beforetransform`/`aftertransform` | — |
| `TreeGraph` 独立类 | 统一用 `Graph` | 图与树图融合 |

判别 v4 老资料：见到平铺字段、`modes`、多个 `registerXxx()` 独立函数、`data()`/`changeData()`/`save()` 即弃用写法。

## 七、易错点清单

- **容器无尺寸**：`container` 没有明确 CSS 宽高（flex/grid 布局下高度塌陷成 0）会导致图不显示或异常；`grid-line` 插件对此尤其敏感，且父容器尺寸是唯一有效来源。
- **`setData()` 之后忘记 `render()`**：`setData` 只更新内部数据模型，不会自动触发重绘。
- **`draw()` 与 `render()` 混淆**：只改样式 / 状态用 `draw()`（不重算布局，更快）；数据结构变化或布局配置变化必须用 `render()`。
- **布局是异步的**：`render()` 返回 `Promise`，力导向类甚至持续多帧收敛，需要 `await` 或监听 `AFTER_RENDER`/`AFTER_LAYOUT`。
- **自定义元素 / 布局 / 行为 / 插件忘记注册**：v5 所有可扩展点统一走 `register()`，未注册的自定义 `type` 会报错或静默失败。
- **Vue 响应式对象 / Immer.js 包装对象直接作为 `data`**：会干扰内部 diff 逻辑导致更新异常，建议传 `toRaw()`/`JSON.parse(JSON.stringify())` 后的纯净对象。
- **`minimap` 插件不兼容 React Node 渲染机制**：用了 React 自定义节点时缩略图可能无法正常渲染。
- **平行边默认完全重叠**：需要 `process-parallel-edges` transform 处理。
- **Combo 拖拽 / 折叠的连线重定向容易被忽略**：折叠后外部到内部节点的边自动接到 Combo 本身，展开后恢复，自定义边样式需覆盖这两种状态。
- **动画 / 样式覆盖优先级记反**：图的状态样式优先级最高，主题默认最低，「设置了却不生效」先查是否被更高优先级覆盖。
- **键盘快捷键行为不生效**：需用标准按键名（`Control`/`Shift`/`Alt`/`Meta`），大小写或别名写错导致 `trigger` 不触发。
- **画布残影 / 脏渲染**：样式含非法值（`null`/`NaN`）易致 Canvas 残影，建议样式属性用整数值，或切换 SVG/WebGL 渲染器。
- **文本超长不省略**：需显式配置 `labelWordWrap`/`labelWordWrapWidth`，默认不会自动省略。
- **误以为存在独立的渲染器切换 API**：官方明确没有，动态切换需走 `setOptions()` 整体更新。

## 八、选型对比速记

| 维度 | G6 | ECharts `graph` | 裸写 D3-force | X6 |
| --- | --- | --- | --- | --- |
| 定位 | 专职关系图引擎 | 图表库里一个 series | 物理模拟 + 手写渲染 | 图编辑引擎 |
| 内置交互 | 10+ 种开箱即用 | 基础缩放拖拽 | 无，全手写 | 面向编辑的高级交互 |
| 布局 | 18 种 + WASM/GPU | 少量，可调性弱 | 需自行拼装 d3-force | 弱，常配合 dagre |
| 大规模图 | 数千节点流畅 | 明显卡顿 | 取决于实现 | 200+ 节点性能下降 |
| 算法生态 | `@antv/algorithm` + 内置中心性 | 无 | 需另配 | 无（聚焦编辑） |
| 典型场景 | 知识图谱 / 依赖图 / 组织架构图 | 简单关系图（几十节点内） | 完全定制化效果 | 流程图 / 审批流 / ER 图编辑器 |

**何时选 G6**：展示 / 分析关系数据（非在线编辑）、几十到几千节点需要流畅拖拽缩放。**何时不选**：节点数很小且已有 ECharts（用它的 `graph` series 更省事）；需要用户在画布上增删改连线的编辑器场景（选 X6）；纯统计图表（选 G2/ECharts）。

## 九、权威链接

- [AntV G6 官方文档](https://g6.antv.antgroup.com) —— 手册 / 示例 / API
- [简介](https://g6.antv.antgroup.com/manual/introduction) —— 定位与核心能力
- [快速上手](https://g6.antv.antgroup.com/manual/getting-started/quick-start)、[安装](https://g6.antv.antgroup.com/manual/getting-started/installation)、[React 集成](https://g6.antv.antgroup.com/manual/getting-started/integration/react)
- [Graph 实例](https://g6.antv.antgroup.com/manual/graph/graph)、[数据模型](https://g6.antv.antgroup.com/manual/data)
- [元素：节点](https://g6.antv.antgroup.com/manual/element/node/overview)、[边](https://g6.antv.antgroup.com/manual/element/edge/overview)、[Combo](https://g6.antv.antgroup.com/manual/element/combo/overview)、[状态](https://g6.antv.antgroup.com/manual/element/state)、[Shape](https://g6.antv.antgroup.com/manual/element/shape/overview)
- [布局总览](https://g6.antv.antgroup.com/manual/layout/overview)、[Dagre](https://g6.antv.antgroup.com/manual/layout/dagre-layout)、[AntV Dagre](https://g6.antv.antgroup.com/manual/layout/antv-dagre-layout)、[力导向](https://g6.antv.antgroup.com/manual/layout/force-layout)
- [交互总览](https://g6.antv.antgroup.com/manual/behavior/overview)、[插件总览](https://g6.antv.antgroup.com/manual/plugin/overview)
- [主题](https://g6.antv.antgroup.com/manual/theme/overview)、[动画](https://g6.antv.antgroup.com/manual/animation/animation)、[数据转换](https://g6.antv.antgroup.com/manual/transform/overview)、[渲染器](https://g6.antv.antgroup.com/manual/further-reading/renderer)
- [升级指南](https://g6.antv.antgroup.com/manual/whats-new/upgrade)、[FAQ](https://g6.antv.antgroup.com/manual/faq)
- [GitHub: antvis/G6](https://github.com/antvis/G6) —— 源码与 issue
- [`@antv/algorithm` README](https://unpkg.com/@antv/algorithm/README.md) —— 图算法函数清单
