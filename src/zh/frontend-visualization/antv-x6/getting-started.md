---
layout: doc
outline: [2, 3]
---

# 入门：定位、安装与第一个画布

> 基于 **AntV X6 v3.1**（npm latest 3.1.7）· 核于 2026-07

## 速查

- **定位**：蚂蚁集团开源的**图编辑引擎**，基于 HTML + SVG 渲染；**不是**图可视化/分析引擎（那是同门 G6 的定位），服务于用户在画布上增删改连线的交互式编辑场景（DAG 图/ER 图/流程图/血缘图）
- **版本基线**：`@antv/x6` npm latest **3.1.7**（2026-03-18 发布）；3.x 于 2025-11 从 beta 起步、2025-11-22 转正 latest，距今约 8 个月，是非常新的大版本切换
- **⚠️ 版本鉴别是最大风险**：大量存量教程/AI 生成代码仍是 2.x 语法（独立 `x6-plugin-*` 包导入、`transition` 动画），写代码/出题前必须先确认目标项目实际锁定的版本
- **包结构变化（v3 核心变更）**：v2.x 的 11 个 `@antv/x6-plugin-*` 独立包 + `x6-common` + `x6-geometry` 全部整合进主包 `@antv/x6`，`graph.use()` 用法不变，只是导入路径从独立包改成主包
- **框架 shape 包仍独立**：`@antv/x6-vue-shape`/`x6-react-shape`/`x6-angular-shape` **未被整合**，需单独安装且必须与主包大版本严格对齐
- **安装**：`npm install @antv/x6` 一个包覆盖核心 + 全部内置插件
- **CDN 引入**：`unpkg.com/@antv/x6/dist/index.js`、`cdn.jsdelivr.net/npm/@antv/x6/dist/index.js` 均可用；官方教程页展示的 cdnjs 链接锁死 `2.18.1`，属于文档滞后未同步的坑，实际引入需手动替换版本号
- **最小可用示例**：`new Graph({ container, width, height })` → `graph.addNode()`/`graph.addEdge()` 或 `graph.fromJSON(data)`
- **Graph 画布基础配置**：`grid`/`background`/`panning`/`mousewheel`/`autoResize` 最常用
- **内置节点形状 8 种**：`rect`/`circle`/`ellipse`/`polygon`/`polyline`/`path`/`image`/`html`（`html` 借助 `foreignObject` 渲染任意 HTML）
- **markup + attrs**：节点/边外观定制的核心机制，markup 定义 SVG 结构、attrs 以 selector 为 key 映射样式，类比 HTML + CSS
- **边的四种 source/target 写法**：节点引用、节点 ID、坐标点、`{ cell, port }` 带连接桩
- **`router` 六种**：`normal`/`orth`/`oneSide`/`manhattan`/`metro`/`er`，决定折线路径算法
- **`connector` 四种**：`normal`/`rounded`/`smooth`/`jumpover`，决定线条最终渲染样式
- **内置箭头 marker 9 种**：`block`/`classic`/`diamond`/`cross`/`async`/`path`/`circle`/`circlePlus`/`ellipse`
- **`labels`** 支持多标签数组和简化字符串写法（`labels: ['text']`）
- **Port 两层配置**：`groups`/`items`，`position` 支持 `absolute`/`left`/`right`/`top`/`bottom`/`line`/`ellipse` 等布局算法
- **`zoomToFit()`/`centerContent()`** 用于画布内容自适应展示
- **`node.prop()`/`node.attr()`** 用于创建后修改节点属性/样式
- **`graph.on('node:click', cb)`** 事件监听，命名格式"目标:动作"，`graph.off()` 取消
- **`graph.toJSON()`/`graph.fromJSON()`** 做整图数据持久化，结构为 `{ cells: [] }` 或 `{ nodes, edges }`
- **X6 定位于「编辑」，G6 定位于「可视化/分析」**——两者是姊妹产品但服务场景不同，选型必考
- **v3 全新动画系统 `animate()`**：基于 Web Animations API，完全替代 v2.x 的 `transition`，属性路径用 `'/'` 分隔（如 `'position/x'`）
- **v3 交互默认值变化**：画布 `panning` 默认从关闭改为开启，升级后可能出现"意外可以拖拽画布"的行为差异
- **v3.1.x 新增 `virtual: true`** 大图虚拟渲染（仅渲染可视区域 + 缓冲边距），应对 HTML/SVG DOM 节点数受限的固有短板
- **X6 没有内置自动布局算法**，DAG 场景需自行引入 `dagre` 计算坐标后再 `fromJSON()` 渲染
- **Stencil 模具面板基于 Dnd 拖拽能力封装**，是侧边栏拖拽创建节点的完整 UI（详见[交互与插件](./guide-line/interaction-and-plugins)）
- **MiniMap 需要独立 `container`**，`scalable`/`minScale`/`maxScale` 控制小地图自身缩放
- **修改已有节点/边**：`node.prop('size', { width, height })`、`edge.prop('target', {...})` 是运行时动态修改的标准写法
- **进阶顺序**：本页 → [画布与节点边](./guide-line/graph-nodes-edges) → [连接桩与连接交互](./guide-line/ports-and-connecting) → [交互与插件](./guide-line/interaction-and-plugins) → [自定义节点与数据](./guide-line/customization-and-data) → [参考](./reference)

## 一、X6 是什么：定位与四大特性

官方对 X6 的定义是："X6 是基于 HTML 和 SVG 的图编辑引擎，提供低成本的定制能力和开箱即用的内置扩展，方便我们快速搭建 DAG 图、ER 图、流程图、血缘图等应用。"这里的"图"特指用户**可编辑**的图结构——一张流程图不是画完就完事的静态展示，而是允许用户持续拖拽节点、连接/断开边、调整样式的交互式画布。

四大特性：

- **极易定制**：节点外观可以是纯 SVG 图形，也可以借 `foreignObject` 内嵌任意 HTML，甚至直接渲染 React/Vue/Angular 组件。
- **开箱即用**：内置 10+ 扩展（框选、对齐线、小地图、撤销重做、剪贴板、快捷键……），常见编辑器功能不需要从零手写。
- **数据驱动**：底层是 MVC 架构，画布上的一切最终都归结为 `cells`（节点 + 边）数据，可以随时 `toJSON()`/`fromJSON()` 整体读写。
- **事件驱动**：图内任何操作（点击、拖拽、连接、缩放……）皆可监听，命名统一遵循"目标:动作"格式。

理解 X6 最关键的一步，是把它和"关系数据可视化"类工具区分开——这是本领域的必考选型题，见下节。

## 二、选型对比：X6 vs G6（简表，详见参考）

| 维度 | AntV X6 | AntV G6 |
| --- | --- | --- |
| 定位 | **图编辑**引擎（DAG/ER 图/流程图/白板，用户可增删改连线） | 图**可视化/分析**引擎（关系数据只读展示 + 图算法） |
| 渲染 | SVG + HTML（`foreignObject`）混合 | Canvas 默认（可切 SVG/WebGL） |
| 自动布局 | **无**，需自行接入 `dagre` | 18 种内置布局 |
| 大规模图性能 | HTML/SVG DOM 节点数受限，几百节点后明显下降 | Canvas + Worker/WASM，数千节点仍流畅 |
| 典型场景 | 流程图编辑器、审批流设计器、ER 图设计工具 | 知识图谱、社交网络、依赖关系图、组织架构图 |

**简单判断**：用户需要**拖拽绘制/编辑**图结构 → X6；只需要**展示/分析**关系数据 → G6。二者共享"图"这个数据结构，但服务的操作完全不同，不是同类竞品。LogicFlow、React Flow（xyflow）等其它编辑类引擎的完整对比表见[参考](./reference)。

## 三、安装

```bash
# 主包一次装齐核心 + 全部内置插件（3.x 起插件已整合进主包）
npm install @antv/x6
# 或
pnpm add @antv/x6
yarn add @antv/x6
```

也可通过 CDN 引入：`https://unpkg.com/@antv/x6/dist/index.js` 或 `https://cdn.jsdelivr.net/npm/@antv/x6/dist/index.js`。**注意**：官方教程页展示的 `cdnjs.cloudflare.com` 链接固定写着 `2.18.1`，是文档滞后未同步的坑，实际引入需要手动确认并替换成所需版本号。

如果需要在节点里渲染 React/Vue/Angular 组件，还要单独装配套的框架 shape 包，并**严格对齐主包大版本**：

```bash
npm install @antv/x6-react-shape  # React（2.0.8+ 仅支持 React 18+）
npm install @antv/x6-vue-shape    # Vue
npm install @antv/x6-angular-shape # Angular
```

## 四、第一个画布

```javascript
import { Graph } from '@antv/x6'

// container 必须是已挂载的 DOM 元素，是画布的渲染挂载点
const graph = new Graph({
  container: document.getElementById('container'),
  width: 800,
  height: 600,
  autoResize: true, // 容器尺寸变化时自动适配画布大小
  grid: { visible: true, type: 'doubleMesh', size: 10 }, // 网格：type 还有 dot/fixedDot/mesh 等
  background: { color: '#F2F7FA' }, // 也支持背景图片
  panning: true, // 鼠标拖拽平移画布（3.x 默认开启，2.x 默认关闭）
  mousewheel: true, // 滚轮缩放
})

// 添加一个矩形节点
const rect1 = graph.addNode({ shape: 'rect', x: 100, y: 40, width: 100, height: 40, label: '开始' })
const rect2 = graph.addNode({ shape: 'rect', x: 100, y: 160, width: 100, height: 40, label: '结束' })

// 添加一条连接两个节点的边
graph.addEdge({ source: rect1, target: rect2 })
```

几个初次上手最容易踩的点：

- `container` 必须是真实挂载到 DOM 的元素，通常在组件 `mounted`/`onMounted` 之后才能拿到。
- `panning` 的默认值在 v3 里从关闭变成了开启，如果代码是从 2.x 项目迁移过来的，可能会遇到"画布突然可以被拖拽了"的意外行为。
- 也可以不用 `addNode`/`addEdge` 逐个创建，而是一次性用 `graph.fromJSON({ nodes: [...], edges: [...] })` 从数据渲染整张图，这是更常见的业务用法。

## 五、Graph 与节点边基础（预览）

节点的内置形状有 8 种：`rect`（矩形）、`circle`（圆形）、`ellipse`（椭圆）、`polygon`（多边形）、`polyline`（折线）、`path`（路径）、`image`（图片）、`html`（借助 `foreignObject` 渲染任意 HTML 片段）。

边的 `source`/`target` 支持四种写法：

```javascript
graph.addEdge({ source: rect1, target: rect2 })                          // 节点引用
graph.addEdge({ source: 'rect1', target: 'rect2' })                      // 节点 ID
graph.addEdge({ source: 'rect1', target: { x: 100, y: 120 } })           // 坐标点
graph.addEdge({
  source: { cell: rect1, port: 'out-port-1' },                          // 带连接桩
  target: { cell: 'rect2', port: 'in-port-1' },
})
```

节点/边外观的定制核心是 **markup（结构）+ attrs（样式）** 机制：markup 定义由哪些 SVG 元素组成（每个元素带 `selector` 供 attrs 定位），attrs 以 selector 为 key 把样式映射到对应元素，类比 HTML 结构 + CSS 样式。创建后修改已有节点/边用 `node.prop()`/`node.attr()`/`edge.prop()`/`edge.attr()`。

Graph 实例还有一批常用方法：`resize(w, h)` 重设尺寸、`translate(dx, dy)` 平移、`zoom(delta)`/`zoomTo(ratio)`/`zoomToFit()` 缩放、`centerContent()` 内容居中、`fromJSON(data)`/`toJSON()` 数据读写。这些概念的完整规则（markup/attrs 详解、router/connector 全部选项、连接桩与连接交互校验）在后续几个章节逐一展开，从[画布与节点边](./guide-line/graph-nodes-edges)开始。

## 六、鉴别 v2 老资料

3.x 转正距今只有约 8 个月，网络上（包括 AI 生成代码）大量存量示例仍是 2.x 语法，照抄容易报错。几个一眼可辨的信号：

- 单独引入 `@antv/x6-plugin-selection`、`@antv/x6-plugin-scroller` 等独立插件包（3.x 起这些能力统一从主包 `@antv/x6` 导出）。
- 使用 `transition` 相关 API 做节点动画（3.x 已完全替换为基于 Web Animations API 的 `animate()`，属性路径写法也是新概念）。
- React shape 里出现 `Portal.getProvider()`（3.x 已改名为 `getProvider()`，属于 breaking change）。
- CDN 引用固定写死 `2.18.1` 版本号（官方教程页遗留，需手动替换）。

命中任何一条即 2.x 资料，照抄大概率报错或行为不一致。完整的版本差异细节见[参考](./reference)。

---

理解了"X6 是什么、装完能跑起来"之后，下一步是吃透画布配置、节点的 markup/attrs 机制与边的路由/连接器：[画布与节点边](./guide-line/graph-nodes-edges)。
