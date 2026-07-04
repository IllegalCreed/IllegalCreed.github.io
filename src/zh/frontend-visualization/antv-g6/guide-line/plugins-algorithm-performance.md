---
layout: doc
outline: [2, 3]
---

# 插件、算法与性能：Plugin / Transform / 图算法 / 渲染器

> 基于 **AntV G6 v5.1**（npm latest 5.1.1）· 核于 2026-07

## 速查

- **概念层级**：`Extension`（扩展）是所有可注册内容（元素 / 布局 / 行为 / 插件）的统称，`Plugin`（插件）只是其中一种特殊的、面向功能扩展的 Extension
- **Plugin vs Behavior 分工**：Behavior 处理「交互逻辑」，Plugin 通常用来「挂载额外的图形组件」（缩略图、工具栏）或实现独立功能（撤销重做）
- **视觉增强插件**：`grid-line`（参考网格，**父容器必须设置具体宽高**，Graph 的 width/height 对它无效）/`background`（背景图 / 色）/`watermark`（水印）/`hull`（轮廓包围，凸包 / 凹包，`members` 指定节点、`concavity: Infinity` 为凸包）/`bubble-sets`（气泡集，更柔和的轮廓）/`snapline`（拖动对齐参考线）
- **导航概览插件**：`minimap`（缩略图导航，`size`/`position`/`padding` 配置，**不兼容 React Node 渲染机制**）/`fullscreen`（全屏）/`timebar`（时间轴筛选 / 播放）
- **交互控件插件**：`toolbar`（工具栏，内置按钮 zoom-in/zoom-out/redo/undo/edit/delete/auto-fit/export/reset/request-fullscreen/exit-fullscreen）/`contextmenu`（右键菜单，`getItems` 支持返回 Promise）/`tooltip`（悬浮提示，`trigger` hover 默认 / click，`getContent` 自定义内容）/`legend`（图例）
- **数据探索插件**：`fisheye`（鱼眼放大镜，`r` 半径默认 120、`d` 畸变系数默认 1.5、`trigger` pointermove 默认 / click / drag）/`edge-filter-lens`（边过滤镜）/`edge-bundling`（FEDB 算法把相似走向的边捆在一起，关键参数 `bundleThreshold`/`K`/`cycles`）
- **高级插件**：`history`（撤销 / 重做，替代 v4 的 `getUndoStack`/`pushStack`）
- **插件用法**：`plugins` 数组，字符串或 `{ type, key, ... }` 对象；`graph.updatePlugin({ key, ... })` 按 key 动态更新
- **数据转换器 Transform（v5 新概念）**：在绘制前（`beforeDraw`）或布局后（`afterLayout`）处理数据的可插拔中间件，替代 v4「写一堆手动预处理函数」的做法
- **内置 Transform**：`map-node-size`（beforeDraw，按中心性映射节点大小）/`place-radial-labels`（afterLayout，辐射布局下调整标签角度避免倒置）/`process-parallel-edges`（beforeDraw，处理平行边，不处理会完全重叠看起来像一条边）
- **图算法两个来源**：①独立包 `@antv/algorithm`（npm latest 0.1.26，纯函数不含渲染）；②G6 内置节点中心性（`NodeCentralityOptions`，在 transform 等场景直接可配，不需单独引入算法包）
- **`@antv/algorithm` 函数清单**：`dijkstra`（单源最短路径）/`floydWarshall`（多源最短路径）/`findPath`（两点间路径）/`connectedComponent`（连通分量）/`detectCycle`（环检测）/`dfs`（深度优先遍历）/`degree`（度数统计）/`adjacentMatrix`（邻接矩阵）/`labelPropagation`（标签传播）/`louvain`（社区发现）/`pageRank`（重要性排序）/`neighbors`（邻居查询）
- **内置节点中心性 5 种**：`degree`/`betweenness`/`closeness`/`eigenvector`/`pagerank`
- **易混淆点**：`polyline` 边的 `shortest-path` 路由用 **A\*** 算法做正交布线避障（视觉走线最短），和 `@antv/algorithm` 里的 `dijkstra`（图论节点间最短路径）是两个不同层面的概念
- **三种渲染器**：Canvas（默认）/ SVG / WebGL，实例化时传 `renderer` 参数切换；因分层（layer）架构，`renderer` 还可接收回调函数按图层类型返回不同渲染器，实现**混合渲染**
- **官方明确没有单独切换渲染器的 API**，动态切换需通过 `setOptions()` 整体更新配置
- **大规模图性能优化五件套**：Web Worker 布局 + WASM/GPU 加速布局 + 视口裁剪（只渲染可见元素，配合 `optimize-viewport-transform` 行为）+ Canvas 渲染器选型 + 边聚合（`edge-bundling`/`process-parallel-edges` 减少视觉密度）

## 一、插件 Plugin：G6 最灵活的扩展机制

插件（Plugin）是 G6 中最灵活的扩展机制，官方原话：「插件是 G6 中最灵活的扩展机制」。与 Behavior 的区别：Behavior 处理「交互逻辑」，Plugin 通常用来「挂载额外的图形组件」（如缩略图、工具栏）或实现独立功能（撤销重做）。FAQ 特别澄清了概念层级：「**Extension** 是所有可注册内容（元素 / 布局 / 行为 / 插件）的统称，**Plugin** 是其中一种特殊的、面向功能扩展的 Extension」。

| 分类 | 插件 | 功能 |
| --- | --- | --- |
| 视觉增强 | `grid-line` | 画布参考网格（注意：**父容器必须设置具体宽高**，Graph 的 width/height 配置对它无效，这是文档明确标注的常见坑） |
| | `background` | 背景图 / 背景色 |
| | `watermark` | 水印 |
| | `hull` | 轮廓包围（凸包 / 凹包），圈定一组节点，`members` 指定节点 id 列表，`concavity: Infinity` 为凸包 |
| | `bubble-sets` | 气泡集，更平滑的轮廓（比 hull 视觉效果柔和） |
| | `snapline` | 拖动对齐参考线 |
| 导航概览 | `minimap` | 缩略图导航，`size`/`position`/`padding` 配置；**不兼容 React Node 渲染机制** |
| | `fullscreen` | 全屏 |
| | `timebar` | 时间轴筛选 / 播放（时序数据） |
| 交互控件 | `toolbar` | 工具栏，内置按钮：`zoom-in`/`zoom-out`/`redo`/`undo`/`edit`/`delete`/`auto-fit`/`export`/`reset`/`request-fullscreen`/`exit-fullscreen` |
| | `contextmenu` | 右键菜单，`getItems` 支持返回 Promise（异步加载菜单项） |
| | `tooltip` | 悬浮提示，`trigger`（`hover` 默认 / `click`）、`getContent` 自定义内容、`enable` 可按元素类型过滤 |
| | `legend` | 图例 |
| 数据探索 | `fisheye` | 鱼眼放大镜（focus+context），`r`（半径默认 120）、`d`（畸变系数默认 1.5）、`trigger`（`pointermove` 默认 / `click` / `drag`） |
| | `edge-filter-lens` | 边过滤镜（区域内边筛选） |
| | `edge-bundling` | 边绑定，用 FEDB（Force-Directed Edge Bundling）算法把相似走向的边「捆」在一起，减少大图视觉混乱、突出宏观模式；关键参数 `bundleThreshold`/`K`/`cycles` |
| 高级 | `history` | 撤销 / 重做（替代 v4 的 `getUndoStack`/`pushStack`） |

```javascript
const graph = new Graph({
  plugins: [
    'grid-line',
    {
      type: 'tooltip',
      key: 'my-tooltip',
      getContent: (e) => `<div>节点：${e.target.id}</div>`, // 自定义提示内容
    },
  ],
});

// 按 key 动态更新插件配置
graph.updatePlugin({ key: 'my-tooltip', getContent: (e) => `更新内容：${e.target.id}` });
```

## 二、数据转换器 Transform（v5 新概念）

Transform 是 v5 新引入的数据处理管线机制：「在绘制前（`beforeDraw`）或布局后（`afterLayout`）处理数据，方便用户封装和解耦数据处理逻辑」，本质是可插拔的数据中间件，替代 v4 时代「写一堆手动预处理函数」的做法。

| Transform | 时机 | 作用 |
| --- | --- | --- |
| `map-node-size` | beforeDraw | 按节点中心性（`degree`/`betweenness`/`closeness`/`eigenvector`/`pagerank`）自动映射节点大小 |
| `place-radial-labels` | afterLayout | 辐射状布局下自动调整标签角度 / 位置，避免文字倒置 |
| `process-parallel-edges` | beforeDraw | 处理同一对节点间的多条平行边（自动分散 / 合并展示），常见坑：不处理会导致多条边完全重叠看起来像一条 |

```javascript
new Graph({ transforms: ['process-parallel-edges'] });
graph.setTransforms((prev) => [...prev, { type: 'map-node-size', maxSize: 100, minSize: 20 }]);
```

## 三、图算法：@antv/algorithm + 内置中心性

G6 官方文档站没有独立的「图算法」教程页（仅有示例画廊展示效果），算法能力实际来自两处：

**① 独立包 `@antv/algorithm`**（npm 实测 0.1.26，纯函数、不含渲染逻辑，需自行把结果映射回 style）：

| 算法 | 说明 |
| --- | --- |
| `dijkstra` | 单源最短路径 |
| `floydWarshall` | 多源最短路径 |
| `findPath` | 两点间路径（最短路径 / 所有路径） |
| `connectedComponent` | 连通分量 |
| `detectCycle` | 环检测 |
| `dfs` | 深度优先遍历 |
| `degree` | 度数统计（in-degree/out-degree） |
| `adjacentMatrix` | 邻接矩阵构建 |
| `labelPropagation` | 标签传播（社区发现） |
| `louvain` | Louvain 社区发现（模块度优化） |
| `pageRank` | PageRank 重要性排序 |
| `neighbors` | 邻居节点查询 |

**② G6 内置的节点中心性**（`NodeCentralityOptions`，在 `transform`/`map-node-size` 等场景直接可配，不需要单独引入算法包）：`degree`/`betweenness`/`closeness`/`eigenvector`/`pagerank` 五种中心性算法，用于按重要性动态映射节点大小或标签优先级（见[状态与交互](./state-and-behavior)里的 `auto-adapt-label` 行为）。

**③ 边路由算法（易混淆点）**：`polyline` 边类型的 `shortest-path` 路由器使用 **A\* 算法**做正交布线自动避障——这是「两点间视觉走线最短」，和 `@antv/algorithm` 里的 `dijkstra`（图论意义上的「节点间最短路径」）是两个不同层面的概念，容易混为一谈：一个解决的是「画出来的线怎么绕开障碍最短」，另一个解决的是「图结构上两个节点之间的最短路径是哪条」。

## 四、渲染器与大规模图性能

G6 v5 支持三种渲染器：**Canvas**（默认）、**SVG**、**WebGL**，实例化时传入 `renderer` 参数切换；由于采用分层（layer）架构，`renderer` 还可以接收回调函数，按图层类型（如 `'main'` 主画布）返回不同渲染器实例，实现**混合渲染**。官方明确「没有提供单独的 API 来切换渲染器」，动态切换需通过 `setOptions()` 整体更新配置。

大规模图（数千节点）优化手段：

- **Web Worker 布局**：几乎所有非树形布局都支持 `enableWorker: true`，避免迭代计算阻塞主线程交互；
- **WASM/GPU 加速布局**：Fruchterman/ForceAtlas2/Force/Dagre 提供 WASM 版本，Fruchterman/GForce 支持 WebGPU；
- **视口裁剪**：只渲染视口内可见元素，配合 `optimize-viewport-transform` 行为优化视图变换性能；
- **渲染器选型**：Canvas 大图下交互流畅度通常优于 SVG/HTML 方案（这也是 G6 相比 X6 在超大规模图上的优势来源）；
- **边聚合**：`edge-bundling`/`process-parallel-edges` 减少边的视觉密度。

## 五、易错点

- **`minimap` 插件不兼容 React Node 渲染机制**：用了 React 自定义节点时缩略图可能无法正常渲染，需改用内置节点或 Canvas 自定义节点。
- **平行边（同一对节点间多条边）默认会完全重叠**，需要 `process-parallel-edges` transform 处理，否则视觉上「看起来只有一条边」。
- **画布残影 / 脏渲染**：图形样式含非法值（`null`/`NaN`）容易导致 Canvas 残影，官方建议样式属性尽量用整数值，或切换 SVG/WebGL 渲染器规避。
- **误以为有独立的渲染器切换 API**：官方明确没有提供单独切换渲染器的方法，运行时切换需要走 `setOptions()` 整体更新，不要在文档里找一个不存在的 `setRenderer()`。
- **`grid-line` 插件的尺寸误区**：以为 Graph 构造函数里的 `width`/`height` 会决定网格范围，实际网格依赖**父容器自身**的 CSS 宽高，Graph 配置对它无效。

---

从元素、状态交互到布局、插件与性能，G6 的核心概念地图已经走完一圈；完整的速查表、API 汇总与 v4 → v5 迁移对照见[参考](../reference)。
