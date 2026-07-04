---
layout: doc
outline: [2, 3]
---

# 布局：18 种布局算法全解与加速

> 基于 **AntV G6 v5.1**（npm latest 5.1.1）· 核于 2026-07

## 速查

- **布局是重点必考内容**：G6 内置 **18 种布局算法**，`layout.type` 指定，`render()` 时自动应用；也可手动调用 `graph.layout()`/`graph.setLayout()`/`graph.stopLayout()` 控制
- **六大分类**：力导向系 / 层次树系 / 环形辐射系 / 结构化 / 分组 / 降维
- **力导向系**：`force`（内置力导向，通用场景）/`d3-force`（5 种力灵活组合，适合精细调参 / 聚类）/`d3-force-3d`（3D）/`force-atlas2`（大规模复杂图变体）/`fruchterman`（经典算法，支持 GPU/WASM 加速）
- **Force 关键参数**：`nodeStrength`（节点斥力，默认 1000）/`edgeStrength`（边拉力，默认 500）/`linkDistance`（边长度，默认 200）/`gravity`（向心力，默认 10）/`preventOverlap`（防重叠，默认 true）/`nodeSize`（碰撞半径）/`damping`（阻尼系数，默认 0.9）/`clustering`/`nodeClusterBy`（聚类）/`onTick`/`monitor`（迭代回调）
- **层次 / 树系**：`dagre`（DAG 有向无环图分层，用于流程图 / 依赖图）/`antv-dagre`（dagre 的增强版）/`compact-box`/`dendrogram`/`indented`/`mindmap`（树形图专用：缩进树、谱系树、脑图等）
- **`antv-dagre` vs `dagre`**：`antv-dagre` 在 dagre 基础上新增 `nodeOrder`（同层节点顺序）、`edgeLabelSpace`（边标签预留空间）、`sortByCombo`（Combo 排序）等实用配置；**官方文档未明确说明两者的性能差异或给出推荐取舍**，选型时以「是否需要这些增强配置」为准，不是简单的谁更快
- **Dagre / AntVDagre 关键参数**：`rankdir`（方向 TB/BT/LR/RL，默认 TB）/`align`（对齐 UL/UR/DL/DR）/`nodesep`（同层间距，默认 50）/`ranksep`（层间距，默认 100）/`ranker`（排序算法：network-simplex/tight-tree/longest-path）
- **环形 / 辐射系**：`circular`（扁平非层级网络，设置不同起止半径可形成螺旋）/`radial`（以 `focusNode` 为中心分层放射，与 circular 的区别是**有明确的中心焦点节点**）/`concentric`（按 `sortBy`，默认 `degree`，分层排布同心圆，重要节点居中）
- **Radial 关键参数**：`focusNode`/`unitRadius`（每层半径，默认 100）/`linkDistance`（默认 50）/`preventOverlap`/`strictRadial`（是否严格贴圆，默认 true）/`sortBy`/`sortStrength`
- **结构化**：`grid`（矩阵 / 表格式排列）/`random`/`snake`/`fishbone`（随机 / 蛇形 / 鱼骨排列）
- **分组**：`combo-combined`（专为带 Combo 的图设计：`innerLayout` 组内布局，默认 `ConcentricLayout` + `outerLayout` 组间布局，默认 `ForceLayout`）
- **降维**：`mds`（高维数据降维定位）
- **预布局 vs 实时布局**：多数布局在 `render()` 时一次性计算完坐标（预布局，如 dagre/circular/grid）；力导向类（force/d3-force）默认持续迭代模拟到收敛（可配 `maxIteration`/`minMovement` 提前终止），拖拽节点时可继续实时反馈（`drag-element-force` 行为）
- **加速手段三种**：①**Web Worker**（几乎所有非树布局都支持 `enableWorker: true`，把迭代计算挪出主线程防卡顿）；②**WASM 版本**（Fruchterman/ForceAtlas2/Force/Dagre 有 WASM 实现，大图计算更快）；③**GPU 加速**（Fruchterman、GForce 支持 WebGPU）
- **布局是异步的**：`render()` 返回 `Promise`，力导向类布局甚至可能持续多帧收敛，需要「渲染完成后再执行下一步」要监听 `GraphEvent.AFTER_RENDER`/`AFTER_LAYOUT` 或 `await graph.render()`

## 一、布局总览：18 种算法分类与手动控制

| 分类 | 算法 | 适用场景 |
| --- | --- | --- |
| 力导向 | `force`（内置力导向） | 通用关系图，节点少到中等规模，效果自然 |
| | `d3-force` | 基于 d3-force 库，5 种力（link/many-body/center/collide/radial）组合灵活，适合需要精细力学调参、聚类效果的场景 |
| | `d3-force-3d` | 3D 力导向 |
| | `force-atlas2` | 大规模复杂图的力导向变体，视觉效果好 |
| | `fruchterman` | 经典力导向算法，支持 GPU/WASM 加速 |
| 层次 / 树 | `dagre` | DAG 有向无环图分层（流程图、依赖图） |
| | `antv-dagre` | dagre 的增强版：新增 `nodeOrder`/`edgeLabelSpace`/`sortByCombo` 等实用配置（选型见下） |
| | `compact-box`/`dendrogram`/`indented`/`mindmap` | 树形图专用（缩进树、谱系树、脑图等） |
| 环形 / 辐射 | `circular` | 扁平、非层级、地位均等的网络；设置不同起止半径可形成螺旋，适合隐式层级 / 时序数据 |
| | `radial` | 以某个 `focusNode` 为中心分层放射，展示层级结构 / 社群分析，与 circular 的区别是**有明确的中心焦点节点** |
| | `concentric` | 按 `sortBy`（默认 `degree`）分层排布同心圆，重要节点居中，用于展示层级重要性 |
| 结构化 | `grid` | 矩阵 / 表格式排列 |
| | `random`/`snake`/`fishbone` | 随机 / 蛇形 / 鱼骨排列 |
| 分组 | `combo-combined` | 专为带 Combo 的图设计：`innerLayout`（组内布局，默认 ConcentricLayout）+ `outerLayout`（组间布局，默认 ForceLayout）组合配置 |
| 降维 | `mds` | 高维数据降维定位 |

`layout.type` 在 `new Graph()` 时指定，`render()` 会自动应用；也可以运行时手动调用 `graph.layout()`（重新计算并应用布局）/`graph.setLayout(cfg)`（更换布局配置）/`graph.stopLayout()`（提前终止仍在迭代的布局，常用于力导向类）。

## 二、力导向系：force / d3-force / d3-force-3d / force-atlas2 / fruchterman

力导向是关系图最通用的默认选择——不需要预设层级关系，靠节点间的斥力、边的拉力自然收敛出一个「看起来舒服」的布局：

```javascript
const graph = new Graph({
  layout: {
    type: 'force',
    nodeStrength: 1000,   // 节点斥力：越大节点越分散
    edgeStrength: 500,    // 边拉力：越大连接的节点越靠近
    linkDistance: 200,    // 边的理想长度
    gravity: 10,          // 向心力：防止节点飘散出画布
    preventOverlap: true, // 防止节点重叠
    damping: 0.9,         // 阻尼系数，越小收敛越快但越容易震荡
  },
});
```

**Force 布局关键参数**（最常考）：`nodeStrength`（节点斥力，默认 1000）、`edgeStrength`（边拉力，默认 500）、`linkDistance`（边长度，默认 200）、`gravity`（向心力，默认 10）、`preventOverlap`（防重叠，默认 true）、`nodeSize`（碰撞半径）、`damping`（阻尼系数，默认 0.9）、`clustering`/`nodeClusterBy`（聚类）、`onTick`/`monitor`（迭代回调）。

其余力导向变体各有侧重：`d3-force` 把力拆成 link / many-body / center / collide / radial 五种可以分别调参，适合需要精细控制或聚类效果的场景；`d3-force-3d` 是它的 3D 版本；`force-atlas2` 针对大规模复杂图做了变体优化，视觉效果更好；`fruchterman` 是经典力导向算法，是少数支持 GPU（WebGPU）加速的布局之一。

## 三、层次 / 树系：dagre / antv-dagre / 树形四种

有明确「谁依赖谁」「谁是谁的上级」这类方向性层级关系时，力导向不是最佳选择，应该用分层布局：

```javascript
const graph = new Graph({
  layout: {
    type: 'antv-dagre',
    rankdir: 'TB', // 方向：TB（从上到下，默认）/ BT / LR / RL
    nodesep: 50,   // 同层节点间距
    ranksep: 50,   // 层间距
  },
});
```

**Dagre / AntVDagre 关键参数**：`rankdir`（方向 TB/BT/LR/RL，默认 TB）、`align`（对齐 UL/UR/DL/DR）、`nodesep`（同层间距，默认 50）、`ranksep`（层间距，默认 100）、`ranker`（排序算法：network-simplex/tight-tree/longest-path）。

**`antv-dagre` 与 `dagre` 怎么选**：`antv-dagre` 是 dagre 的增强版，在 dagre 基础上新增了 `nodeOrder`（同层节点顺序控制）、`edgeLabelSpace`（边标签预留空间）、`sortByCombo`（Combo 排序）等实用配置项。但官方文档**没有明确说明两者存在性能差异，也没有给出「优先选谁」的官方推荐**——这不是一个「新版本一定更好」的关系，而是「增强版多了一些配置维度」的关系。选型时应以「是否需要这些增强配置」为判断标准：不需要同层排序 / 边标签预留空间 / Combo 排序时，用基础 `dagre` 已经足够；需要精细控制这些细节时再上 `antv-dagre`。

树形图场景（组织架构图、文件目录、族谱、脑图）用专门的树形布局族：`compact-box`（紧凑树，常规默认）、`dendrogram`（谱系树，叶子对齐）、`indented`（缩进树，类文件目录）、`mindmap`（脑图，中心向两侧展开）。

## 四、环形 / 辐射系：circular / radial / concentric

三者都是把节点摆在圆周或同心圆上，但语义不同：

- **`circular`**：适合扁平、非层级、地位均等的网络——所有节点摆在一个圆周上。设置不同的起止半径还能形成螺旋效果，适合隐式层级或时序数据（比如按时间顺序摆成螺旋）。
- **`radial`**：以某个 `focusNode` 为中心向外分层放射，用于展示层级结构或社群分析。**和 circular 的核心区别是有明确的中心焦点节点**——circular 没有「谁是中心」的概念，radial 有。关键参数：`focusNode`、`unitRadius`（每层半径，默认 100）、`linkDistance`（默认 50）、`preventOverlap`、`strictRadial`（是否严格贴圆，默认 true）、`sortBy`/`sortStrength`。
- **`concentric`**：按 `sortBy`（默认 `degree`，即节点的连接数）把节点分层排布成同心圆，重要节点（度数高）自然落在中心，用于直观展示节点的层级重要性。

## 五、结构化 / 分组 / 降维

- **`grid`**：矩阵 / 表格式排列，节点整齐分布在网格上，没有语义上的层级或聚类关系，纯粹为了整齐可读。
- **`random`/`snake`/`fishbone`**：随机、蛇形、鱼骨排列，用于特定的展示效果或作为其它布局的初始状态。
- **`combo-combined`**：专为带 Combo（分组）的图设计，把布局拆成两层——`innerLayout`（组内布局，默认 `ConcentricLayout`）负责每个 Combo 内部节点怎么摆，`outerLayout`（组间布局，默认 `ForceLayout`）负责 Combo 之间怎么摆，两层可以分别配置参数。
- **`mds`**（多维缩放）：把高维数据（比如节点间的相似度矩阵）降维定位到二维平面，节点间距离近似反映高维空间里的相似程度。

## 六、预布局 vs 实时布局，及加速手段

**预布局 vs 实时布局**：多数布局在 `render()` 时**一次性计算完坐标**（预布局，如 dagre / circular / grid，算完就定，不再变化）；力导向类（force / d3-force）默认**持续迭代模拟到收敛**（可配 `maxIteration`/`minMovement` 提前终止收敛判定），拖拽节点时还可以继续实时反馈（配合 `drag-element-force` 行为，拖动一个节点时其它节点跟着重新模拟）。

**大图场景的三种加速手段**：

1. **Web Worker**：几乎所有非树布局都支持 `enableWorker: true`，把迭代计算挪到主线程之外的 Worker 线程里跑，避免布局计算卡住页面交互。
2. **WASM 版本**：`Fruchterman`/`ForceAtlas2`/`Force`/`Dagre` 提供 WASM 实现，大图计算比纯 JS 版本更快。
3. **GPU 加速**：`Fruchterman`、`GForce` 支持 WebGPU，把力学模拟计算挪到 GPU 上执行。

三种手段可以叠加使用，具体用哪种取决于图的规模和目标运行环境（是否有 WebGPU 支持）。

## 七、易错点

- **布局是异步的**：`render()` 返回 `Promise`，力导向类布局甚至可能持续多帧收敛才稳定下来。需要「渲染完成后再执行下一步」的逻辑，要么监听 `GraphEvent.AFTER_RENDER`/`AFTER_LAYOUT`，要么 `await graph.render()`，不要假设布局在同步代码执行完就已经稳定。
- **混淆「新版本」与「更好的版本」**：看到 `antv-dagre` 名字里带 `antv-` 前缀容易默认认为它是 dagre 的正式升级替代品，但官方并未给出性能或推荐层面的定论，两者是并存关系，按需选择。
- **力导向布局的收敛耗时未评估**：大图上不加 `enableWorker`/WASM/GPU 加速直接跑力导向，可能长时间阻塞主线程，交互卡顿；节点规模上千时应优先考虑加速手段或换用预布局类算法。

---

节点摆好位置之后，让用户能快速定位、探索细节、做二次分析，就要靠插件与算法能力：[插件、算法与性能](./plugins-algorithm-performance)。
