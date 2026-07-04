---
layout: doc
outline: [2, 3]
---

# 连接桩与连接交互：Port 与 connecting 校验

> 基于 **AntV X6 v3.1**（npm latest 3.1.7）· 核于 2026-07

## 速查

- **Port 两层配置**：`groups`（连接桩分组，定义外观/布局模板）+ `items`（单个连接桩，引用某个分组）
- **PortGroupMetadata 字段**：`markup`（DOM 结构）/`attrs`（样式）/`zIndex`/`position`/`label`
- **PortMetadata 字段**：`id`/`group`/`args`/`markup`/`attrs`/`zIndex`/`label`（可覆盖分组配置）
- **position 内置布局算法 7 种**：`absolute`（绝对定位）/`left`/`right`/`top`/`bottom`（矩形四边均匀分布）/`line`（沿指定线均匀分布）/`ellipse`/`ellipseSpread`（沿椭圆弧分布/均匀分布）
- **⚠️ 最易混淆点**：Port 分组**不**声明"哪些桩允许连接"，那是 `connecting` 在 **Graph 级别**统一校验的，Port 只负责视觉呈现和坐标布局
- **`connecting` 是 Graph 构造配置的一个字段**，统一控制"拖拽创建/移动边"整个生命周期的规则
- **`snap` 吸附**：`boolean` 或 `{ radius, anchor }` 对象形式
- **六个布尔/函数开关**：`allowBlank`（连接到空白处）/`allowLoop`（自环）/`allowNode`（直连节点）/`allowEdge`（连到另一条边）/`allowPort`（连到连接桩）/`allowMulti`（同起止点多条边，也可填 `'withPort'`）
- **`highlight`**：拖拽时高亮可用的连接目标，配合顶层 `highlighting` 配置各阶段高亮样式
- **`anchor`（默认 `center`）**：节点锚点，决定计算方向时参照元素的哪个基准点；`sourceAnchor`/`targetAnchor` 可分别指定
- **`edgeAnchor`（默认 `ratio`）**：连到边上的锚点；`sourceEdgeAnchor`/`targetEdgeAnchor` 同理
- **`connectionPoint`（默认 `boundary`）**：连接点算法，决定线段最终落在元素边框上的哪一点
- **连接点 vs 锚点**：`connectionPoint` 决定线段落点，`anchor` 决定计算参照基准，两者可独立配置 `sourceConnectionPoint`/`targetConnectionPoint`
- **`createEdge()`**：自定义新建边的默认样式回调
- **三个校验回调的触发时机差异（高频考点）**：`validateMagnet`（按下 magnet 时，校验能否起始新边）→ `validateConnection`（拖动过程中，持续校验目标是否有效）→ `validateEdge`（松手停止拖动后，最终校验，返回 `false` 则清除该边）
- **`highlighting` 顶层配置**：可自定义各阶段高亮样式（`default`/`embedding`/`nodeAvailable`/`magnetAvailable`/`magnetAdsorbed`），内置高亮器 `stroke`/`className`
- **官方文档缺口**：Port 教程页未展开"仅 hover 时显示连接桩"的配置，通常靠 CSS `opacity`/`visibility` 配合鼠标事件自行实现，非内置声明式选项
- **进阶顺序**：本页承接[画布与节点边](./graph-nodes-edges)，下一步是[交互与插件](./interaction-and-plugins)

## 一、连接桩 Port：分组与布局

```typescript
// Group 配置（PortGroupMetadata）
interface PortGroupMetadata {
  markup?: Markup           // 连接桩 DOM 结构
  attrs?: Attr.CellAttrs    // 样式
  zIndex?: number | 'auto'
  position?: [number, number] | string | { name: string; args?: object }
  label?: { markup?: Markup; position?: { name: string; args?: object } }
}
// 单个 Port（PortMetadata）：id / group / args / markup / attrs / zIndex / label（可覆盖分组配置）
```

**position 内置布局算法**：`absolute`（绝对定位）、`left`/`right`/`top`/`bottom`（矩形四边均匀分布）、`line`（沿指定线均匀分布）、`ellipse`/`ellipseSpread`（沿椭圆弧分布/均匀分布）。

```javascript
graph.addNode({
  shape: 'rect', x: 40, y: 40, width: 100, height: 40,
  ports: {
    groups: { in: { position: 'top', attrs: { circle: { r: 4, fill: '#fff', stroke: '#666' } } } },
    items: [{ id: 'port1', group: 'in' }],
  },
})
```

**⚠️ 易混淆点**：Port 分组本身**不**声明"哪些桩允许连接"这类连接规则——那是 `connecting.allowPort`/`validateConnection`/`validateMagnet` 在 **Graph 级别**统一校验的（见下节），Port 只负责视觉呈现和坐标布局。官方 Port 教程页也未展开"仅 hover 时显示连接桩"的配置（通常靠 CSS `opacity`/`visibility` 配合鼠标事件自行实现，需在 markup/attrs 层面自行处理，非内置声明式选项）。

## 二、连接交互 connecting（必考）

`connecting` 是 Graph 构造配置的一个对象字段，统一控制"拖拽创建/移动边"整个生命周期的规则：

```javascript
const graph = new Graph({
  connecting: {
    snap: true,              // 吸附；也可写 { radius: 20, anchor: 'center' | 'bbox' }
    allowBlank: true,        // 允许连接到画布空白处
    allowLoop: true,         // 允许自环（连接到自身）
    allowNode: true,         // 允许边直接连到节点（非仅连接桩）
    allowEdge: true,         // 允许边连到另一条边
    allowPort: true,         // 允许边连到连接桩
    allowMulti: true,        // 同起止点间允许多条边；也可填 'withPort' 仅限定端口维度
    highlight: true,         // 拖拽时高亮可用的连接目标
    anchor: 'center',        // 节点锚点，默认 center；sourceAnchor/targetAnchor 可分别指定
    edgeAnchor: 'ratio',     // 连到边上的锚点，默认 ratio；sourceEdgeAnchor/targetEdgeAnchor 同理
    connectionPoint: 'boundary', // 连接点算法，默认 boundary（与元素边框交点）；也有 anchor 等
    router: 'normal',        // connecting 层面的默认 router（可被 edge 自身配置覆盖）
    connector: 'normal',
    createEdge() {           // 自定义新建边的默认样式
      return this.createEdge({ shape: 'edge', attrs: { line: { stroke: '#8f8f8f' } } })
    },
    validateMagnet({ cell, view, magnet, e }) { return true },   // 按下 magnet 时校验能否起始新边
    validateConnection(args) { return true },                    // 移动边过程中校验目标是否有效
    validateEdge({ edge, type, previous }) { return true },       // 松手停止拖动后最终校验，false 则清除
  },
})
```

**三个校验回调的触发时机差异**（高频考点）：

| 回调 | 触发时机 | 用途 |
| --- | --- | --- |
| `validateMagnet` | 按下连接桩（magnet）的瞬间 | 校验能否从这个点起始新边 |
| `validateConnection` | 拖动边的过程中（持续触发） | 实时校验当前悬停的目标是否是合法的连接对象 |
| `validateEdge` | 松手停止拖动后 | 最终一次性校验，返回 `false` 则清除刚创建/修改的边 |

**高亮细节**：`highlighting` 顶层配置可自定义各阶段高亮样式（`default`/`embedding`/`nodeAvailable`/`magnetAvailable`/`magnetAdsorbed`），内置高亮器 `stroke`/`className`：

```javascript
new Graph({ highlighting: { magnetAvailable: { name: 'stroke', args: { padding: 4, attrs: { stroke: 'red' } } } } })
```

**连接点 vs 锚点**：`connectionPoint`（默认 `boundary`）决定线段最终落在元素**边框**上的哪一点；`anchor`（默认 `center`）决定计算方向时参照元素的哪个基准点；两者可独立配置 `sourceConnectionPoint`/`targetConnectionPoint`、`sourceAnchor`/`targetAnchor`。

## 三、易错点

- **Port 连接规则的位置误判**：新手常尝试在 `ports.groups` 里找"connectable"之类字段限制连接范围，实际规则统一收敛在 `connecting.allowPort`/`validateConnection`/`validateMagnet`，Port 本身只管视觉布局。
- **三个 validate 回调时机混淆**：把"起始校验"（`validateMagnet`）、"过程校验"（`validateConnection`）、"最终校验"（`validateEdge`）搞混，会导致某些非法连接在中间态被短暂允许、松手后才被清除，看起来像"抖动"。
- **连接桩仅 hover 显示**没有现成的声明式配置，容易误认为存在内置选项，实际需要结合 CSS + 鼠标事件自行实现。

---

理解了节点怎么精确对接、连线怎么被校验之后，下一步看画布交互体系与常用插件：[交互与插件](./interaction-and-plugins)。
