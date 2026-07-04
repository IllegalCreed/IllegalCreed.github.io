---
layout: doc
outline: [2, 3]
---

# 参考：X6 速查表

> 基于 **AntV X6 v3.1**（npm latest 3.1.7）· 核于 2026-07

## 速查

- **定位**：蚂蚁集团图**编辑**引擎（基于 HTML + SVG），非可视化/分析引擎（那是 G6）
- **版本**：npm latest **3.1.7**（2026-03-18）；3.x 于 2025-11-22 转正，距今约 8 个月，是非常新的大版本切换
- **v3 核心变更**：11 个 `@antv/x6-plugin-*` 独立包 + `x6-common`/`x6-geometry` 全部整合进主包 `@antv/x6`；框架 shape 包（vue/react/angular）**未整合**，仍需单独装并对齐大版本
- **安装**：`npm install @antv/x6`；CDN 用 unpkg/jsdelivr，注意官方教程页 cdnjs 示例锁死 `2.18.1`
- **最小示例**：`new Graph({ container, width, height })` → `addNode()`/`addEdge()` 或 `fromJSON()`
- **节点 8 形状**：rect/circle/ellipse/polygon/polyline/path/image/html；**边 4 种 source/target 写法**：节点引用/节点 ID/坐标/`{cell,port}`
- **markup + attrs**：结构 + 样式分离，类比 HTML + CSS，是节点/边外观定制核心机制
- **router 6 种**：normal/orth/oneSide/manhattan/metro/er；**connector 4 种**：normal/rounded/smooth/jumpover；两者独立、可组合
- **marker 9 种**：block/classic/diamond/cross/async/path/circle/circlePlus/ellipse
- **Port 两层**：groups + items；**position 7 种布局**：absolute/left/right/top/bottom/line/ellipse(Spread)
- **Port 连接规则不在 Port 里**：统一由 `connecting.allowPort`/`validateConnection`/`validateMagnet` 在 Graph 级别校验
- **connecting 三个校验回调时机**：`validateMagnet`（按下）→ `validateConnection`（拖动中）→ `validateEdge`（松手后）
- **插件与扩展 11 种全部 3.x 起从主包导出**：Selection/Snapline/Transform/Keyboard/Clipboard/History/Stencil/Dnd/MiniMap/Scroller/Export
- **Scroller 会默认禁用原生 panning**，需用自身 `pannable` 替代
- **History 批量**：`startBatch`/`stopBatch` 或 `batchUpdate()` 合并为一条撤销记录
- **自定义节点 3 种**：HTML（主包内置）/React（`x6-react-shape`）/Vue（`x6-vue-shape`，需渲染 `getTeleport()` 的 `TeleportContainer`）
- **数据序列化**：`toJSON()`/`fromJSON()` 整图；`cell.setData()`（默认深度合并，`{overwrite:true}` 才整体替换）/`getData()`
- **群组嵌套**：`embedding: { enabled, findParent }`；树形查询 `getAncestors()`/`getDescendants({breadthFirst})`
- **事件命名**："目标:动作"，如 `node:click`/`edge:connected`/`node:change:position`
- **v3 动画 `animate()`**：基于 Web Animations API，完全替代 v2.x `transition`，属性路径用 `'/'` 分隔
- **Export**：`toPNG`/`toSVG` 系列返回 dataURI，`exportPNG`/`exportSVG` 系列直接触发下载
- **选型口径**：用户需要拖拽编辑图结构 → X6；只需要展示/分析关系数据 → G6（Canvas 性能更优，大图首选）
- **X6 无内置自动布局**，DAG 场景需自行接入 `dagre`

## 一、节点速查

| 内置形状 | 说明 |
| --- | --- |
| `rect` | 矩形，最常用 |
| `circle` | 圆形 |
| `ellipse` | 椭圆 |
| `polygon` | 多边形 |
| `polyline` | 折线 |
| `path` | 路径 |
| `image` | 图片 |
| `html` | 借助 `foreignObject` 渲染任意 HTML 片段 |

**基础属性**：`x`/`y`（位置 px）、`width`/`height`（尺寸 px，默认均为 1）、`angle`（旋转角度，默认 0）、`visible`、`zIndex`。

**修改已有节点**：`node.prop('size', { width, height })`、`node.attr('rect/fill', '#ccc')`。**自定义形状**：`Node.register()`/`Graph.registerNode()`。

## 二、边速查

**source/target 四种写法**：节点引用（`source: rect1`）、节点 ID（`source: 'rect1'`）、坐标点（`source: { x, y }`）、带连接桩（`source: { cell, port }`）。

| router（路由算法） | 说明 | connector（连接器） | 说明 |
| --- | --- | --- | --- |
| `normal` | 直连 | `normal` | 直线/折线 |
| `orth` | 正交折线 | `rounded` | 圆角 |
| `oneSide` | 单侧出线 | `smooth` | 贝塞尔平滑曲线 |
| `manhattan` | 曼哈顿，自动避障 | `jumpover` | 跨越其它边时画"跳线"缺口 |
| `metro` | 地铁图风格，45° 角 | — | — |
| `er` | ER 图专用 | — | — |

**箭头 marker 9 种**：`block`/`classic`/`diamond`/`cross`/`async`/`path`/`circle`/`circlePlus`/`ellipse`，配置在 `attrs.line.sourceMarker`/`targetMarker`。**labels**：数组 `[{ attrs: { label: { text } } }]` 或简化字符串 `['edge']`。**修改已有边**：`edge.prop('target', {...})`、`edge.attr('line/stroke', '#ccc')`。

## 三、连接桩与 connecting 速查

| 概念 | 字段/方法 | 说明 |
| --- | --- | --- |
| Port 分组 | `PortGroupMetadata`：`markup`/`attrs`/`zIndex`/`position`/`label` | 定义连接桩的外观与布局模板 |
| Port 单个 | `PortMetadata`：`id`/`group`/`args`/`markup`/`attrs`/`zIndex`/`label` | 引用分组，可覆盖分组配置 |
| position 布局 | `absolute`/`left`/`right`/`top`/`bottom`/`line`/`ellipse`/`ellipseSpread` | 7 种连接桩坐标分布算法 |
| `connecting.snap` | `boolean` 或 `{ radius, anchor }` | 拖拽吸附 |
| `allowBlank`/`allowLoop`/`allowNode`/`allowEdge`/`allowPort`/`allowMulti` | 布尔或函数 | 六个连接范围开关，默认基本为 `true` |
| `anchor`（默认 `center`） | 节点锚点 | 决定计算方向的参照基准 |
| `connectionPoint`（默认 `boundary`） | 连接点算法 | 决定线段落在元素边框的哪一点 |
| `validateMagnet` | 按下 magnet 时 | 校验能否起始新边 |
| `validateConnection` | 拖动过程中 | 持续校验目标是否有效 |
| `validateEdge` | 松手停止拖动后 | 最终校验，`false` 则清除该边 |
| `highlighting` | `default`/`embedding`/`nodeAvailable`/`magnetAvailable`/`magnetAdsorbed` | 各阶段高亮样式，配合 `connecting.highlight` |

## 四、插件速查

| 插件 | 关键配置/API | 说明 |
| --- | --- | --- |
| `Selection` | `multiple`/`rubberband`/`strict`/`filter` | 多选与框选，3.x 起从主包导出 |
| `Snapline` | `tolerance`(10)/`sharp`/`resizing`/`clean` | 拖拽对齐参考线 |
| `Transform` | `resizing`/`rotating`（`grid` 步进） | 缩放与旋转手柄 |
| `Keyboard` | `global`，`graph.bindKey()` | 快捷键绑定 |
| `Clipboard` | `copy`/`cut`/`paste({offset, useLocalStorage})` | 复制粘贴 |
| `History` | `stackSize`/`startBatch`/`stopBatch`/`batchUpdate` | 撤销重做 |
| `Stencil` | `groups`/`search`/`layoutOptions`，`stencil.load()` | 模具面板，基于 `Dnd` 封装 |
| `Dnd` | `dnd.start(node, e)` | 底层拖拽能力 |
| `MiniMap` | 独立 `container`，`scalable`/`minScale`/`maxScale` | 小地图导航 |
| `Scroller` | `pannable`/`pageVisible`/`autoResize` | 滚动画布，**默认禁用原生 panning** |
| `Export` | `exportPNG`/`toPNG` 等 | 导出图片/SVG，注意 `exportXxx` 触发下载而 `toXxx` 返回 dataURI |

## 五、事件速查

| 分类 | 示例 | 说明 |
| --- | --- | --- |
| 交互类 | `cell:click`/`node:dblclick`/`edge:contextmenu`/`blank:mouseenter` | 均有 `cell:`/`node:`/`edge:`/`blank:` 前缀变体 |
| 画布类 | `scale`/`resize`/`translate` | 视图变换 |
| 生命周期类 | `node:added`/`node:removed`/`node:changed`/`node:embedded` | 元素增删改与嵌套变化 |
| 连接类 | `edge:connected` | 连接生命周期终点，参数含 `isNew`/`previousCell`/`currentCell`/`previousPort`/`currentPort` |
| 细粒度变更 | `node:change:position`/`cell.on('change:zIndex', cb)` | `change:xxx` 系列，可在 `graph` 或 `cell` 实例上监听 |

监听 API：`graph.on(name, cb)`/`graph.off(name, cb)`。

## 六、动画与数据 API 速查

| API | 作用 |
| --- | --- |
| `node.animate(keyframes, options)` | 命令式动画，属性路径用 `'/'` 分隔（如 `'position/x'`） |
| `animation: [[keyframes, options]]` | 声明式动画，随节点添加自动触发 |
| `pause()`/`play()`/`cancel()`/`finish()`/`reverse()`/`updatePlaybackRate()` | 动画播放控制 |
| `graph.toJSON()` / `graph.fromJSON(data)` | 整图数据导出/导入，`{ cells: [...] }` 或 `{ nodes, edges }` |
| `cell.setData(data)` / `cell.setData(data, { overwrite: true })` | 深度合并 / 整体替换业务数据 |
| `cell.getData()` / `cell.toJSON({ diff: true })` | 读取业务数据 / 只导出差异字段 |
| `child.setParent(parent)` / `parent.addChild(child)` | 建立父子（群组）关系 |
| `node.getAncestors()` / `node.getDescendants({ breadthFirst })` | 树形关系查询 |
| `graph.resize()`/`translate()`/`zoom()`/`zoomTo()`/`zoomToFit()`/`centerContent()` | 画布视图操作 |

## 七、v2 → v3 迁移对照表

| v2.x | v3.x | 说明 |
| --- | --- | --- |
| `@antv/x6-plugin-selection` 等 11 个独立包 | 全部从主包 `@antv/x6` 导出 | `graph.use()` 用法不变，只改导入路径 |
| `@antv/x6-common`/`@antv/x6-geometry` | 整合进主包 | 不再需要单独安装 |
| `node.transition(...)` | `node.animate(keyframes, options)` | 基于 Web Animations API 完全重写，API 不兼容 |
| 画布 `panning` 默认关闭 | 默认**开启** | 升级后可能出现"意外可以拖拽画布"的行为差异 |
| React shape `Portal.getProvider()` | `getProvider()` | 方法改名，breaking change |
| 无虚拟渲染 | `virtual: true`（3.1.x 新增） | 大图仅渲染可视区域 + 缓冲边距，应对 DOM 节点数受限 |
| 框架 shape 包（vue/react/angular） | **未整合**，仍独立安装 | 且必须与主包大版本严格对齐 |

判别 2.x 老资料：独立 `x6-plugin-*` 包导入、`transition` 动画写法、CDN 固定 `2.18.1`，命中任意一条即弃用写法，完整背景见[入门](./getting-started)。

## 八、易错点清单

- **版本认知过时是最大风险**：大量存量教程/AI 生成代码基于 2.x（独立插件包导入），直接套用在 3.x 项目会报"模块找不到"；反之 3.x 代码拿到 2.x 项目里也会报错。
- **插件已整合但 shape 包没有**：容易想当然认为"3.x 都合并了"，结果 Vue/React/Angular shape 仍要单独装且要求版本严格对齐主包大版本号。
- **`Scroller` 与 `panning` 隐性冲突**：同时配置画布 `panning: true` 和 `Scroller` 插件，实际生效的是 Scroller 覆盖后的行为。
- **Port 连接规则的位置误判**：规则统一收敛在 `connecting.allowPort`/`validateConnection`/`validateMagnet`，Port 本身只管视觉布局。
- **`setData()` 默认深度合并 vs 整体替换**：不传 `{ overwrite: true }` 时是合并旧数据，容易在"清空某字段"场景下出现旧值残留。
- **markup 与 attrs selector 不匹配**：样式静默不生效（不会报错），排查成本高。
- **CDN 示例锁定旧版本**：官方教程页 cdnjs 链接固定写着 `2.18.1`，需手动替换。
- **`animate` 与 `transition` 不能混用**：v3 项目里的 `transition` 相关示例已失效。
- **History 与批量操作**：连续多次变更不包在 `startBatch`/`stopBatch`（或 `batchUpdate`）里，`undo()` 一次只撤销最后一步。
- **自定义 HTML/React/Vue 节点内部点击事件冒泡**：需要显式阻止事件冒泡，官方文档未系统提及此坑。
- **`toPNG`/`exportPNG` 混淆**：前者返回 dataURI，后者直接触发下载。

## 九、选型对比

| 维度 | AntV X6 | AntV G6（v5.1.1） | LogicFlow（v2.2.3） | React Flow / xyflow（v12.11.1） | Mermaid |
| --- | --- | --- | --- | --- | --- |
| 定位 | **图编辑**引擎（DAG/ER/流程图/白板） | 图**可视化/分析**引擎（关系数据展示+算法） | 流程图**编辑**框架（滴滴出品） | React 专属节点式编辑器组件 | **文本转图表**，非拖拽画布 |
| 渲染 | SVG + HTML（`foreignObject`）混合 | Canvas 默认（可切 SVG/WebGL） | SVG | SVG/HTML（React 组件树） | SVG（一次性渲染，不可交互编辑） |
| 框架支持 | 框架无关核心 + 独立 Vue/React/Angular shape 包 | 框架无关核心，React 靠 `@antv/graphin` | 框架无关核心 + Vue/React 扩展包 | React 专属（姊妹项目 Svelte Flow） | 框架无关，纯文本 DSL |
| 自动布局 | **无**，需自行接入 dagre 等外部算法 | 18 种内置布局 | 弱，多手动摆放 | 无内置，社区常配 dagre/elkjs | 内置排版算法，不可拖拽调整 |
| 大规模图性能 | DOM 节点数受限，几百节点后明显下降 | Canvas + Worker/WASM，数千节点仍流畅 | 与 X6 量级相近 | 与 X6 量级相近，社区有虚拟化插件 | 不适用 |
| 典型场景 | 流程图编辑器、审批流设计器、ER 图设计工具 | 知识图谱、社交网络、依赖关系图 | 中后台流程配置（国产替代） | AI workflow 编排 UI 等 | 文档里嵌入的静态流程图 |

**何时选 X6**：用户需要在浏览器里拖拽绘制/编辑流程图、DAG、ER 图 → 选 X6；需要节点内嵌完整 Vue/React 组件 → X6 的 HTML/Vue/React shape 是强项；纯 React 栈且看重 hooks 原生融合 → 优先看 React Flow；只需静态嵌入一张图表 → 用 Mermaid；图规模上到几千节点且核心诉求是"分析关系"而非"手工编辑" → 选 G6。

## 十、权威链接

- [AntV X6 官方文档](https://x6.antv.antgroup.com) —— 教程/API 分离
- [简介](https://x6.antv.antgroup.com/tutorial/about)、[快速上手](https://x6.antv.antgroup.com/tutorial/getting-started)、[升级指南](https://x6.antv.antgroup.com/tutorial/update)（2.x→3.x 迁移）
- [基础教程：Graph](https://x6.antv.antgroup.com/tutorial/basic/graph)、[Node](https://x6.antv.antgroup.com/tutorial/basic/node)、[Edge](https://x6.antv.antgroup.com/tutorial/basic/edge)、[Port](https://x6.antv.antgroup.com/tutorial/basic/port)、[Interacting](https://x6.antv.antgroup.com/tutorial/basic/interacting)、[Events](https://x6.antv.antgroup.com/tutorial/basic/events)、[Serialization](https://x6.antv.antgroup.com/tutorial/basic/serialization)、[Animation](https://x6.antv.antgroup.com/tutorial/basic/animation)
- [进阶教程：连接点](https://x6.antv.antgroup.com/tutorial/intermediate/connection-point)、[群组](https://x6.antv.antgroup.com/tutorial/intermediate/group)、[React](https://x6.antv.antgroup.com/tutorial/intermediate/react)、[Vue](https://x6.antv.antgroup.com/tutorial/intermediate/vue)、[HTML](https://x6.antv.antgroup.com/tutorial/intermediate/html)
- [插件教程：Stencil](https://x6.antv.antgroup.com/tutorial/plugins/stencil)、[MiniMap](https://x6.antv.antgroup.com/tutorial/plugins/minimap)、[Snapline](https://x6.antv.antgroup.com/tutorial/plugins/snapline)、[Clipboard](https://x6.antv.antgroup.com/tutorial/plugins/clipboard)、[Keyboard](https://x6.antv.antgroup.com/tutorial/plugins/keyboard)、[History](https://x6.antv.antgroup.com/tutorial/plugins/history)、[Scroller](https://x6.antv.antgroup.com/tutorial/plugins/scroller)、[Selection](https://x6.antv.antgroup.com/tutorial/plugins/selection)、[Transform](https://x6.antv.antgroup.com/tutorial/plugins/transform)、[Export](https://x6.antv.antgroup.com/tutorial/plugins/export)
- [API：Cell](https://x6.antv.antgroup.com/api/model/cell) —— `getData`/`setData`/父子关系
- [GitHub: antvis/X6](https://github.com/antvis/X6) —— 源码与 issue
- [AntV G6 官方文档](https://g6.antv.antgroup.com) —— 选型对比参照
- [React Flow / xyflow](https://reactflow.dev) —— 选型对比参照
