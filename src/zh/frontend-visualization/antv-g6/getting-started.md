---
layout: doc
outline: [2, 3]
---

# 入门：定位、安装与第一个图

> 基于 **AntV G6 v5.1**（npm latest 5.1.1）· 核于 2026-07

## 速查

- **定位**：蚂蚁 AntV 出品的图可视化引擎，专注「关系数据」（点 Node + 边 Edge + 分组 Combo）的绘制 / 布局 / 交互 / 分析 / 动画；**不是**统计图表库（柱状 / 折线 / 饼图找 G2 / ECharts），**不是**画布编辑器（流程图 / DAG 编辑找 X6）
- **版本基线**：`@antv/g6` npm latest **5.1.1**（2026-05-08 发布）；v5（2023 GA）是彻底重写，与 v4 API 几乎不兼容，是官网唯一维护版本线
- **渲染引擎**：底层换成自研 `@antv/g`（类似 zrender），支持 Canvas（默认）/ SVG / WebGL 混合渲染
- **安装**：`npm install @antv/g6`（或 pnpm / yarn）；CDN `unpkg.com/@antv/g6@5/dist/g6.min.js`
- **唯一入口类**：`Graph`（v5 统一图与树图，**不再有独立的 `TreeGraph`**）
- **最小可用示例**：`new Graph({ container, data })` → `await graph.render()`
- **容器必须有明确宽高**，否则图不显示或渲染异常；`grid-line` 插件尤其敏感（父容器尺寸对它无效，需容器自身有具体宽高）
- **`render()` 是异步方法**，返回 `Promise<void>`，需要 `await` 或 `.then()`
- **三类元素**：`nodes` / `edges` / `combos`；节点 `id` 必须唯一，边必须有 `source` / `target`
- **核心设计原则**：数据（`data`）与样式（`style`）强制分离——业务字段放 `data`，视觉字段放 `style`
- **`behaviors` 数组配交互、`plugins` 数组配插件**，元素可写字符串（用默认参数）或对象（带 `type`/`key` 等自定义参数）
- **`destroy()` 销毁实例释放资源**，销毁后不可复用，需重新 `new Graph()`
- **实例常用配置项**：`container`/`width`/`height`/`data`/`node`/`edge`/`combo`/`layout`/`behaviors`/`plugins`/`theme`/`animation`/`autoFit`/`autoResize`/`zoomRange`/`padding`/`background`/`rotation`
- vs 统计图表库（ECharts / G2）：ECharts 的 `graph` series 只适合几十节点内的简单关系图，样式与交互定制成本高；G6 专职关系图，交互 / 布局 / 算法专业度高出一个量级
- vs 裸写 D3-force：D3-force 是数据驱动的物理模拟库，**无内置交互**、需手写渲染循环；G6 开箱即用 10+ 种交互 + 18 种布局，省去大量样板代码
- vs AntV X6：X6 定位「图编辑」（流程图 / DAG / 低代码画布，可增删改连线），G6 定位「图展示与分析」（以只读探索为主）；大图性能 G6 通常优于 X6（Canvas 单一渲染树 vs X6 基于 HTML/SVG，DOM 节点数受限）
- **依赖体系**：内部已整合 d3-force、dagre 等可选算法库，无需单独安装
- **`@antv/algorithm`**：配套图算法包（npm latest 0.1.26），纯函数、不含渲染逻辑，结果需自行映射回 `style`
- **React / Vue 集成范式**：`useRef` / 模板 ref 缓存实例，挂载时创建、卸载时 `destroy()`；更新前判断 `!graph.destroyed`，规避 React 严格模式二次挂载导致的重复创建
- 官方推荐但不强制的 React 封装：`@antv/graphin`
- **鉴别 v4 老资料**：平铺字段 `{ id, label, size }`、`modes` 配置、`registerNode()` 等多函数注册，见到即 v4 语法，完整迁移表见[参考](./reference)
- **进阶顺序**：[Graph 与元素](./guide-line/graph-and-elements) → [状态与交互](./guide-line/state-and-behavior) → [布局](./guide-line/layout) → [插件、算法与性能](./guide-line/plugins-algorithm-performance) → [参考](./reference)

## 一、G6 是什么：关系数据可视化引擎

官方对 G6 的定义是：「G6 是一个图可视化引擎，它提供了图的绘制、布局、分析、交互、动画等图可视化能力」。这里的「图」特指**关系图**（graph，点 + 边），不是统计学意义上的「图表」（chart）。典型场景：社交网络、知识图谱、软件依赖图、组织架构图、资金链路图——凡是「一堆实体 + 实体之间的关系」都是 G6 的用武之地。

理解 G6 最关键的一步，是把它和两类容易混淆的邻居区分开：

- **统计图表库**（G2、ECharts、Chart.js……）解决的是「数量对比、趋势、占比」——图表是数据的统计摘要。
- **G6** 解决的是「实体与实体之间的拓扑关系」——图是数据本身的结构，节点和边都承载语义（谁连向谁、连接的强弱、分组归属）。

两者不是竞品关系，很多产品会同时用到：用 G2/ECharts 做仪表盘统计图，用 G6 单独做一个关系图谱面板。

## 二、选型对比：G6 vs ECharts graph / 裸写 D3-force / X6

| 维度 | AntV G6 | ECharts `graph` 系列 | 裸写 D3-force | AntV X6 |
| --- | --- | --- | --- | --- |
| 定位 | **专职**关系图可视化引擎 | 通用图表库里的一个 series 类型 | 数据驱动的物理模拟 + DOM/SVG 操作库（非图专用） | **图编辑**引擎（流程图 / DAG / 低代码画布） |
| 渲染 | Canvas（默认，可切 SVG/WebGL） | Canvas/SVG（zrender） | 通常手写 SVG（也可接 Canvas） | Canvas + SVG/HTML 混合 |
| 内置交互 | 丰富且开箱即用：拖拽 / 缩放 / 框选 / 套索 / 连线 / 展开收起等 10+ 种 Behavior | 基础缩放拖拽，交互定制成本高 | **无内置交互**，全部手写 | 面向「编辑」的高级交互：增删改连线、节点 resize、对齐吸附 |
| 布局 | 18 种内置布局，含 WASM/GPU 加速 | 内置力导向 / 环形 / 桑基等少量布局，参数可调性弱 | 需自己拼装 d3-force 的力，灵活但要手写渲染循环 | 布局能力弱，通常配合 dagre 手动跑一次 |
| 大规模图 | 数千节点仍流畅（Canvas + Worker/WASM） | 大图卡顿明显，非其设计目标 | 取决于自己的实现质量，默认 SVG 方案大图会卡 | HTML/SVG DOM 节点数受限，大图（200+ 节点）性能明显下降 |
| 生态 / 算法 | 自带 `@antv/algorithm`（最短路径 / 连通分量 / 社区发现等）+ 内置中心性 | 无配套图算法包 | 需要另配图算法库 | 无配套图算法包（聚焦编辑） |
| 学习曲线 | 中等，v5 概念新但文档完整 | 低（已用 ECharts 时加个 series 很快） | 高（需理解 D3 的 data-join、手写渲染） | 中等，偏「画布编辑器」心智模型 |
| 典型场景 | 知识图谱、社交网络、依赖关系图、组织架构图、资金链路图 | 已用 ECharts，想顺手加个简单关系图 | 需要完全定制化的非常规效果 | 流程图编辑器、审批流设计器、ER 图设计工具 |

**何时选 G6**：需要**展示 / 分析**关系数据（而非用户在线**编辑**图结构）→ 选 G6，不选 X6；图规模从几十到几千节点、需要流畅拖拽缩放 → 选 G6（Canvas 性能优势）；已用 ECharts 且节点数很小（几十个以内）、不需要复杂交互 → 用 ECharts 的 `graph` series 更省事；需要流程图 / 审批流 / ER 图这类「用户在画布上增删改连线」的编辑器场景 → 选 X6。

## 三、安装

```bash
npm install @antv/g6
# 或
pnpm add @antv/g6
yarn add @antv/g6
```

也可通过 CDN 引入：`https://unpkg.com/@antv/g6@5/dist/g6.min.js`。G6 内部已经整合了 d3-force、dagre 等可选算法库作为布局实现，不需要额外单独安装这些依赖。

## 四、第一个图

```javascript
import { Graph } from '@antv/g6';

// 创建 Graph 实例：唯一入口类，v5 不再区分 Graph 与 TreeGraph
const graph = new Graph({
  container: 'container', // DOM id 或 HTMLElement，容器必须有明确宽高
  width: 800,
  height: 600,
  data: {
    // 数据驱动：节点、边、组合分别用 nodes/edges/combos 三个数组描述
    nodes: [{ id: 'node-1' }, { id: 'node-2' }],
    edges: [{ source: 'node-1', target: 'node-2' }], // 边必须声明 source/target
  },
  node: { type: 'circle', style: { size: 20, fill: '#5B8FF9' } }, // 全局节点默认样式
  edge: { type: 'line', style: { stroke: '#99ADD1' } }, // 全局边默认样式
  layout: { type: 'force' }, // 力导向布局，通用场景的默认选择
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'], // 拖拽画布/缩放/拖拽节点
  plugins: ['minimap'], // 缩略图导航
  theme: 'light', // 'light' | 'dark'
});

// render() 是异步方法，返回 Promise，需要 await 才能确保渲染完成
await graph.render();
```

几个初次上手最容易踩的点：

- **容器没有明确宽高**（尤其 flex/grid 布局下容器高度塌陷成 0）会导致图不显示或渲染异常。
- **忘记 `await`**：`render()` 返回 `Promise<void>`，如果渲染完成后要立即做其它操作（截图、绑定后续逻辑），必须等它完成。
- 节点 / 边 / Combo 三类元素的字段结构是一致的：`id`/`type`/`data`/`style`/`states`，具体规则见[Graph 与元素](./guide-line/graph-and-elements)。

## 五、Graph 实例与 data 驱动

Graph 的实例化参数很多，最常用的一批是：`container`/`width`/`height`/`data`/`node`/`edge`/`combo`/`layout`/`behaviors`/`plugins`/`theme`/`animation`/`autoFit`（`'view'` 缩放适配或 `'center'` 居中）/`autoResize`（容器尺寸变化时自动适配）/`zoomRange`/`padding`/`background`/`rotation`。实例还有两个只读属性：`graph.destroyed`、`graph.rendered`，常用于框架集成时判断实例状态。

数据驱动是 G6 的核心心智：`data` 里描述业务实体和关系，`style` 里描述视觉呈现，两者可以联动——`style` 字段支持传回调函数读取 `data`，例如按数值动态调整节点大小：

```javascript
// 节点半径按 data.value 动态计算：值越大节点越大
node: {
  style: {
    size: (d) => d.data.value * 2, // d 是节点数据对象，d.data 是业务字段
  },
},
```

Graph 实例的生命周期方法（创建、渲染、增删数据、销毁）、数据模型的完整规则、以及节点 / 边 / Combo 的全部内置类型，在[Graph 与元素](./guide-line/graph-and-elements)里展开。

## 六、在 React / Vue 中集成

官方原生只提供 `@antv/g6` 核心库，**推荐但不强制**通过 `@antv/graphin`（React 封装）获得更完善的 React 集成体验。直接手写集成时，核心范式是「实例存 ref、挂载创建、卸载销毁」：

```jsx
// React：useRef 缓存实例，两个 useEffect 分工——一个管生命周期创建/销毁
const containerStyle = { width: 800, height: 600 }; // 容器必须有明确宽高，抽成常量避免内联双花括号

function GraphView({ data }) {
  const containerRef = useRef(null);
  const graphRef = useRef(null);

  useEffect(() => {
    const graph = new Graph({ container: containerRef.current, data });
    graph.render();
    graphRef.current = graph;
    return () => graph.destroy(); // 卸载时销毁，防内存泄漏
  }, []);

  useEffect(() => {
    // 数据变化时更新：更新前判断 !graph.destroyed，规避严格模式二次挂载导致的野指针
    const graph = graphRef.current;
    if (graph && !graph.destroyed) {
      graph.setData(data);
      graph.render();
    }
  }, [data]);

  return <div ref={containerRef} style={containerStyle} />;
}
```

- **Vue** 同理：`onMounted` 里创建实例，`onUnmounted` 里 `destroy()`，容器用模板 ref。
- React 严格模式（StrictMode）会让组件二次挂载，若不判断 `!graph.destroyed` 就直接操作实例，容易踩到「野指针」问题——这是集成时最容易踩的坑。
- 3D 场景另有独立的 3D 元素 / 3D 布局 / 沉浸式交互能力，属于进阶话题，本笔记不展开。

## 七、鉴别 v4 老资料

v5 与 v4 **API 几乎完全不兼容**（架构重写）。网络上大量存量教程、AI 生成的示例代码默认援引 v4 语法，抄错概率很高。几个一眼可辨的信号：

- 节点数据用平铺字段（`{ id, label, size }`），而不是 `data`/`style` 分离；
- 用 `modes` 配置交互，而不是 `behaviors` 数组；
- 用 `registerNode()`/`registerEdge()`/`registerLayout()` 等多个独立函数注册自定义扩展，而不是统一的 `register()`；
- 用 `data()`/`changeData()`/`save()` 操作数据，而不是 `setData()`/`getData()`。

命中任何一条即 v4 资料，照抄必报错。完整的 v4 → v5 迁移对照表见[参考](./reference)。

---

理解了「G6 是什么、装完能跑起来」之后，下一步是吃透 Graph 实例的完整生命周期与数据模型：[Graph 与元素](./guide-line/graph-and-elements)。
