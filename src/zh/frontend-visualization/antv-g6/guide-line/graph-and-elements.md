---
layout: doc
outline: [2, 3]
---

# Graph 与元素：生命周期、数据模型与样式体系

> 基于 **AntV G6 v5.1**（npm latest 5.1.1）· 核于 2026-07

## 速查

- **唯一入口类** `Graph`：v5 统一图与树图，**不再有独立的 `TreeGraph`**
- **实例化关键配置**：`container`/`width`/`height`/`data`/`node`/`edge`/`combo`/`layout`/`behaviors`/`plugins`/`theme`/`animation`/`autoFit`/`autoResize`/`zoomRange`/`padding`/`background`/`rotation`
- **只读实例属性**：`graph.destroyed`、`graph.rendered`
- **生命周期主线**：`new Graph()` → `render()` → 数据 / 视图操作 → `destroy()`
- **`render()` vs `draw()`**：`render()` 是完整流程（处理数据 → 计算布局 → 绘制），`draw()` 只重绘、**不重新计算布局**，纯样式 / 状态更新用 `draw()` 性能更优
- **`setData()`/`getData()`**：覆盖式设置 / 读取全部数据（替代 v4 的 `data()`/`changeData()`/`save()`）
- **`addNodeData()`/`addEdgeData()`/`addComboData()`**：增量添加，支持传函数 `(prev) => next`
- **`updateNodeData()`/`updateEdgeData()`**：增量更新，只需传变化字段
- **`removeNodeData()`/`removeEdgeData()`**：增量删除
- **`getNodeData()`/`getEdgeData()`/`getComboData()`**：数据查询
- **`getElementData(id)`/`setElementState(id, state)`/`getElementState(id)`**：元素级数据与状态操作
- **`fitView(options?, animation?)`**：缩放并平移使内容完整可见；`options.when: 'overflow'|'always'`，`direction: 'x'|'y'|'both'`
- **`fitCenter(animation?)`**：仅居中，不缩放
- **`zoomTo(zoom, animation?, origin?)`**：绝对缩放；`zoomBy`/`translateBy`/`translateTo` 是相对缩放 / 平移
- **`collapseElement(id)`/`expandElement(id)`**：程序化收起 / 展开节点或 Combo
- **`setBehaviors(fn)`/`updateBehavior(cfg)`**：动态增删改交互；**`updatePlugin(cfg)`** 按 `key` 定位动态更新插件
- **`setTheme(name)`/`getTheme()`**：动态切换主题；**`setTransforms(fn)`/`updateTransform(cfg)`**：动态增删改数据转换器
- **`destroy()`**：销毁实例释放资源，销毁后不可再操作，需重新 `new Graph()`
- **核心设计原则**：数据（`data`）与样式（`style`）强制分离，业务字段放 `data`，视觉字段放 `style`
- **三类元素结构一致**：`id`/`type`/`data`/`style`/`states`（Combo 额外有 `combo` 父级字段）
- **数据驱动样式**：`style` 里可传回调读 `data`，如 `size: (d) => d.data.value * 2`
- 避免用 `id`/`type`/`style` 作为自定义业务字段名（保留字冲突）
- **样式配置优先级**：`数据中的 style 属性 < 全局 node.style < 动态 graph.setNode() 配置`（越靠右优先级越高）
- **内置节点类型 10 种**：`circle`/`rect`/`ellipse`/`diamond`/`triangle`/`hexagon`/`star`/`donut`/`image`/`html`
- **内置边类型 6 种**：`line`/`polyline`（`shortest-path` 路由用 A* 算法避障）/`quadratic`/`cubic`/`cubicVertical`/`cubicHorizontal`
- **Combo 内置 2 种**：`circle`/`rect`；双击可折叠 / 展开；折叠后外部到内部节点的连线自动重定向到 Combo 本身
- **keyShape 三大作用**：决定包围盒（用于计算边连接点）、承担交互检测（点击 / hover 判定范围）、状态样式默认作用对象
- **辅助 Shape**：`labelShape`（文本标签）/`haloShape`（光晕）/`badgeShape`（角标）/`portShape`（连接桩，精确控制边连入 / 连出点）
- **配置方式优先级（高到低）**：动态 `graph.setNode()`/`graph.setEdge()`（渲染前调用）＞全局配置（`node`/`edge`/`combo` 选项）＞数据中内嵌的 `type`/`style`
- **内置主题 2 种**：`light`（默认，白底蓝色节点 `#1783ff`）/`dark`；`setTheme()`/`getTheme()` 动态切换
- **主题包含四部分**：画布背景、节点配置（样式 / 调色板 / 状态 / 动画）、边配置、Combo 配置
- **调色板 5 种离散色板**：`spectral`/`tableau`/`oranges`/`greens`/`blues`；分离散（颜色数组循环使用）和连续（0-1 插值函数）两类
- **调色板三种模式**：简单模式（自动分配不同色）/ 分组模式（按 `data.category` 分组同色）/ 数值映射模式（连续色板）
- **调色板作用范围**：节点 / Combo 作用于 `fill`，边作用于 `stroke`；**样式映射会覆盖调色板设置**
- **动画三分类**：进退场（enter/exit，元素新增 / 移除）/ 更新（update，属性变化过渡）/ 持续（蚂蚁线、呼吸效果，靠自定义元素 `onCreate()` 钩子循环触发）
- **动画配置层级**：全局关闭 `animation: false`；全局时长 `animation: { duration: 500 }`；元素级配置会覆盖全局，但**全局需先启用**
- 布局切换、状态切换（selected/active）、视口变化（`zoomTo`/`fitView` 带 `animation` 参数）均可配独立过渡动画

## 一、Graph 实例：容器、配置与生命周期

Graph 是 G6 的唯一入口类，v5 统一了图与树图，**不再有独立的 `TreeGraph`**：

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container', // DOM id 或 HTMLElement，容器必须有明确宽高
  width: 800,
  height: 600,
  autoResize: true, // 容器尺寸变化时自动适配
  data: {
    nodes: [{ id: 'node-1' }, { id: 'node-2' }],
    edges: [{ source: 'node-1', target: 'node-2' }],
  },
  node: { type: 'circle', style: { size: 20, fill: '#5B8FF9' } },
  edge: { type: 'line', style: { stroke: '#99ADD1' } },
  layout: { type: 'force' },
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
  plugins: ['minimap'],
  theme: 'light', // 'light' | 'dark'
  animation: true,
  autoFit: 'view', // 'view'（缩放适配） | 'center'（居中）
  zoomRange: [0.1, 10],
  padding: 10,
});

await graph.render(); // 首次渲染：render() 是异步的，返回 Promise
```

实例属性 `graph.destroyed`、`graph.rendered` 常用于框架集成时判断当前状态（例如更新前先判断 `!graph.destroyed`，规避 React 严格模式二次挂载导致的重复创建）。

**生命周期与核心方法**（`new` → `render` → 数据 / 视图操作 → `destroy`）：

| 方法 | 作用 |
| --- | --- |
| `render(): Promise<void>` | 完整渲染流程：处理数据 → 计算布局 → 绘制。初次渲染 / 布局变化 / 大批量增删元素时用 |
| `draw(): Promise<void>` | 只重绘、**不重新计算布局**，用于纯样式 / 状态更新，性能优于 `render()` |
| `setData(data)` | 覆盖式设置全部数据（替代 v4 的 `data()`/`changeData()`） |
| `getData()` | 获取当前全部数据（替代 v4 的 `save()`） |
| `addNodeData(data[])` / `addEdgeData(data[])` / `addComboData(data[])` | 增量添加节点 / 边 / 组合数据，支持传函数 `(prev) => next` |
| `updateNodeData(partial[])` / `updateEdgeData(partial[])` | 增量更新，只需传变化字段 |
| `removeNodeData(ids[])` / `removeEdgeData(ids[])` | 增量删除 |
| `getNodeData()` / `getEdgeData()` / `getComboData()` | 数据查询 |
| `getElementData(id)` / `setElementState(id, state)` / `getElementState(id)` | 元素级数据与状态操作 |
| `fitView(options?, animation?)` | 缩放并平移使内容完整可见；`options.when: 'overflow' \| 'always'`，`direction: 'x'\|'y'\|'both'` |
| `fitCenter(animation?)` | 仅居中，不缩放 |
| `zoomTo(zoom, animation?, origin?)` | 绝对缩放到指定比例（1 为原始大小） |
| `zoomBy` / `translateBy` / `translateTo` | 相对缩放 / 平移（替代 v4 的 `zoom()`/`translate()`/`moveTo()`） |
| `collapseElement(id)` / `expandElement(id)` | 程序化收起 / 展开节点或 Combo |
| `setBehaviors(fn)` / `updateBehavior(cfg)` | 动态增删改交互 |
| `updatePlugin(cfg)` | 动态更新插件配置（按 `key` 定位） |
| `setTheme(name)` / `getTheme()` | 动态切换主题 |
| `setTransforms(fn)` / `updateTransform(cfg)` | 动态增删改数据转换器 |
| `destroy()` | 销毁实例释放资源，销毁后不可再操作，需重新 `new Graph()` |

## 二、数据模型：data（node / edge / combo）

G6 v5 最核心的设计原则：**数据（`data`）与样式（`style`）分离**，业务字段放 `data`，视觉字段放 `style`，避免用回调函数把业务值「翻译」成视觉值时到处写 if-else：

```javascript
// 节点
{
  id: 'node-1',                          // 必须，唯一标识
  type: 'circle',                        // 元素类型（可省略，用全局 node.type）
  data: { name: 'alice', role: 'admin' }, // 业务数据，自定义
  style: { x: 100, y: 200, size: 32, fill: 'violet' }, // 视觉属性
  states: ['selected'],                  // 初始状态
  combo: 'comboA',                       // 所属分组 id，无分组则 null
}

// 边：source/target 必须
{ id: 'edge-1', source: 'node-1', target: 'node-2', type: 'line', style: { stroke: 'orange' } }

// 组合 Combo：分组容器，可嵌套（combo 字段指向父 combo）
{ id: 'comboA', type: 'circle', style: { fill: '#eee' } }
```

**要点**：

- 三类元素结构一致：`id`/`type`/`data`/`style`/`states`（Combo 额外有 `combo` 父级字段）。
- **数据驱动样式**：`style` 里可以传回调函数读取 `data`，如 `size: (d) => d.data.value * 2`，实现「值越大节点越大」。
- 避免用 `id`/`type`/`style` 作为自定义业务字段名（保留字冲突）。
- 配置优先级（同一属性多处配置时）：`数据中的 style 属性 < 全局 node.style < 动态 graph.setNode() 配置`（越靠后优先级越高）；官方 FAQ 特别提示「数据样式不生效」多半是全局样式映射函数覆盖了数据自带的 `style`，需要在回调里显式读取数据值兜底。

## 三、元素 Element：节点 / 边 / 组合的类型与样式

**内置节点类型（10 种，都无需注册直接用）**：

| 类型 | registration name | 典型用途 |
| --- | --- | --- |
| 圆形 | `circle` | 常规实体（默认） |
| 矩形 | `rect` | 展示较多文本 / 详情 |
| 椭圆 | `ellipse` | 圆形变体 |
| 菱形 | `diamond` | 决策点 / 特殊标记 |
| 三角形 | `triangle` | 方向指示 |
| 六边形 | `hexagon` | 网格 / 蜂窝布局 |
| 五角星 | `star` | 突出重要节点 |
| 环形图 | `donut` | 占比 / 进度展示 |
| 图片 | `image` | 头像 / 产品图（配置 `style.src`） |
| HTML | `html` | 自定义 HTML 内容（如富交互卡片） |

**内置边类型（6 种）**：`line`（直线，默认）、`polyline`（折线，支持 `shortest-path` 路由用 A* 算法自动避障）、`quadratic`（二次贝塞尔曲线）、`cubic`（三次贝塞尔曲线）、`cubicVertical`、`cubicHorizontal`（垂直 / 水平三次贝塞尔，常用于树形图）。

**Combo 内置类型（2 种）**：`circle`（圆形容器）、`rect`（矩形容器）。Combo 是「分组 / 容器」概念，官方原话：「组合（Combo）……可以包含节点和子组合，类似『群组』或『容器』的概念」，典型场景：部门包含员工、城市包含区域。双击可折叠 / 展开；折叠后，外部节点与 Combo 内节点之间的连线会自动重定向连接到 Combo 本身；`drag-element` 行为设置 `dropEffect: 'link'` 可在拖拽时重新分配节点的 Combo 归属。

**元素的图形组成（Shape / keyShape）**：每个节点 / 边 / Combo 由一个或多个 Shape（圆、矩形、文本、路径等）组合而成，其中恰好一个被称为 **keyShape**（关键图形）。keyShape 的作用：①决定元素的包围盒（用于计算边的连接点）；②承担交互检测（点击 / hover 判定范围）；③状态样式（selected/active 等）默认作用在 keyShape 上。除 keyShape 外还有 `labelShape`（文本标签）、`haloShape`（光晕）、`badgeShape`（角标）、`portShape`（连接桩，用于精确控制边的连入 / 连出点）等辅助图形。

**配置方式优先级（从高到低）**：①动态调用 `graph.setNode()`/`graph.setEdge()`（渲染前调用）；②全局配置（实例化 `node`/`edge`/`combo` 选项）；③数据中直接内嵌的 `type`/`style`。

## 四、主题 Theme 与调色板 Palette

内置两套主题：`light`（默认，白底、蓝色节点 `#1783ff`、灰色边）、`dark`（黑底，对比色调整）。主题包含四部分：画布背景、节点配置（样式 / 调色板 / 状态 / 动画）、边配置、Combo 配置。

```javascript
new Graph({ theme: 'light' });
graph.setTheme('dark');
graph.getTheme();
```

**调色板（Palette）**：内置 5 套离散色板 `spectral`/`tableau`/`oranges`/`greens`/`blues`，分离散色板（颜色数组，超出数量循环使用）和连续色板（0-1 插值函数）两类。

```javascript
// 简单模式：每个节点自动分配不同颜色
node: { palette: 'tableau' }

// 分组模式：同类别节点同色，按 data.category 分组
node: { palette: { type: 'group', field: 'category', color: 'tableau' } }

// 数值映射模式：连续色板
node: { palette: { type: 'value', field: 'value', color: (v) => `rgb(${v * 255},0,0)` } }
```

调色板对节点 / Combo 作用于 `fill`，对边作用于 `stroke`；**样式映射会覆盖调色板设置**（同前面提到的优先级规则）。

## 五、动画 Animation

动画指「元素在一段时间内的状态变化，例如节点的位置、大小、颜色等」，分类：**进退场动画**（enter/exit，元素新增 / 移除时）、**更新动画**（update，属性变化时的过渡）、**持续动画**（如蚂蚁线边、呼吸效果节点，靠自定义元素的 `onCreate()` 生命周期钩子循环触发）。

```javascript
// 全局关闭
new Graph({ animation: false });
// 全局配置时长
new Graph({ animation: { duration: 500 } });
// 元素级配置（覆盖全局，但全局需先启用）
new Graph({ node: { animation: { enter: 'fade', exit: 'fade', update: 'translate' } } });
```

布局切换、状态切换（selected/active）、视口变化（`zoomTo`/`fitView` 带 `animation` 参数）均可配独立过渡动画。

## 六、易错点

- **容器无尺寸**：`container` 对应 DOM 元素若没有明确的 CSS 宽高（尤其是 flex/grid 布局下容器高度塌陷成 0），图会不显示或渲染异常；`grid-line` 插件文档特别强调「父容器必须设置具体的宽高尺寸，Graph 配置中的尺寸设置无效」。
- **`setData()` 之后忘记 `render()`**：`setData` 只是更新内部数据模型，不会触发重绘，必须显式调用 `render()`（或至少 `draw()`）画布才会更新。
- **`draw()` 与 `render()` 混淆**：只改样式 / 状态用 `draw()`（不重算布局，性能更好）；数据结构变化（增删节点边）或布局配置变化必须用 `render()`。
- **Vue 响应式对象 / Immer.js 包装对象直接作为 `data` 数据源**：官方 FAQ 明确警告要避免，响应式代理会干扰 G6 内部的数据比较（diff）逻辑，导致更新异常；建议传普通对象（如 `toRaw()`/`JSON.parse(JSON.stringify())` 后的纯净数据）。
- **动画 / 样式覆盖优先级记反**：完整优先级（低到高）是 `主题默认样式 < 调色板样式 < 数据样式 < 图的默认样式 < 主题状态样式 < 图的状态样式`；发现「设置了却不生效」先检查是否被更高优先级配置覆盖。
- **文本超长不省略**：需要显式配置 `labelWordWrap`/`labelWordWrapWidth`，默认不会自动省略。

---

Graph 实例、数据模型与元素样式是静态的骨架；让用户能点选、拖拽、框选、联动高亮，靠的是另一套体系：[状态与交互](./state-and-behavior)。
