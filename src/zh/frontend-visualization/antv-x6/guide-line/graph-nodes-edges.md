---
layout: doc
outline: [2, 3]
---

# 画布与节点边：markup/attrs、router 与 connector

> 基于 **AntV X6 v3.1**（npm latest 3.1.7）· 核于 2026-07

## 速查

- **Graph 画布常用配置**：`container`（必须，渲染挂载点）/`width`/`height`/`autoResize`/`grid`（`type`: `dot`/`fixedDot`/`mesh`/`doubleMesh`）/`background`/`panning`（3.x 默认开启）/`mousewheel`
- **Graph 常用实例方法**：`resize(w,h)`/`translate(dx,dy)`/`zoom(delta)`/`zoomTo(ratio)`/`zoomToFit()`/`centerContent()`/`fromJSON(data)`/`toJSON()`
- **内置节点形状 8 种**：`rect`/`circle`/`ellipse`/`polygon`/`polyline`/`path`/`image`/`html`
- **markup**：定义节点由哪些 SVG 元素组成（如矩形 + 文本），每个元素带 `selector` 供 attrs 定位
- **attrs**：以 selector 为 key，把样式/属性映射到对应 SVG 元素，如 `attrs: { body: { fill }, label: { text } }`
- **markup + attrs 类比**：HTML 结构 + CSS 样式，是 X6 定制节点外观的核心机制
- **节点基础属性**：`x`/`y`（位置 px）/`width`/`height`（尺寸 px，默认均为 1）/`angle`（旋转角度，默认 0）/`visible`/`zIndex`
- **修改已有节点**：`node.prop('size', { width, height })`、`node.attr('rect/fill', '#ccc')`
- **自定义形状**：`Node.register()`/`Graph.registerNode()` 注册复用配置（详见[自定义节点与数据](./customization-and-data)）
- **边 source/target 四种写法**：节点引用、节点 ID、坐标点、`{ cell, port }` 带连接桩
- **`vertices`**：边按顺序途经的路径点数组
- **`router` 六种**：`normal`/`orth`（正交）/`oneSide`/`manhattan`（曼哈顿，自动避障）/`metro`（地铁图风格，45° 角）/`er`（ER 图专用）
- **`connector` 四种**：`normal`（直线/折线）/`rounded`（圆角）/`smooth`（贝塞尔平滑曲线）/`jumpover`（跨越其他边时画"跳线"缺口）
- **router vs connector 的区别**：router 处理 `vertices` 生成实际折线路径，connector 决定 vertices/路由输出点之间怎么画线，两者独立配置、可以任意组合
- **箭头 marker 9 种**：`block`/`classic`/`diamond`/`cross`/`async`/`path`/`circle`/`circlePlus`/`ellipse`，通过 `attrs.line.sourceMarker`/`targetMarker` 配置
- **marker 对象形式**：支持自定义参数，如 `{ name: 'ellipse', rx: 10, ry: 6 }`
- **`labels`**：支持多标签数组 `[{ attrs: { label: { text } } }]`，也支持简化字符串写法 `['edge']`
- **修改已有边**：`edge.prop('target', {...})`、`edge.attr('line/stroke', '#ccc')`
- **写法优先级**：`router`/`connector` 既可以写字符串简写（`router: 'orth'`），也可以写对象带参数（`{ name: 'orth', args: {} }`）
- **易错点**：markup 自定义后若 attrs 引用的 selector 名称不一致，样式会静默不生效（不报错），排查成本高
- **`embedding` 群组嵌套**配置属于父子关系范畴，详见[自定义节点与数据](./customization-and-data)
- **`ports` 连接桩配置**只涉及节点自身声明，分组/布局/连接规则详见[连接桩与连接交互](./ports-and-connecting)

## 一、Graph 画布：容器与基础配置

```javascript
import { Graph } from '@antv/x6'

const graph = new Graph({
  container: document.getElementById('container'), // 必须，渲染挂载点
  width: 800,
  height: 600,
  autoResize: true, // 容器尺寸变化时自动适配画布大小
  grid: { visible: true, type: 'doubleMesh', size: 10 }, // 网格：type 还有 dot/fixedDot/mesh 等
  background: { color: '#F2F7FA' }, // 也支持背景图片
  panning: true, // 鼠标拖拽平移画布（3.x 默认开启，2.x 默认关闭）
  mousewheel: true, // 滚轮缩放
})
```

常用实例方法一览：

| 方法 | 作用 |
| --- | --- |
| `resize(w, h)` | 重设画布尺寸 |
| `translate(dx, dy)` | 平移画布 |
| `zoom(delta)` / `zoomTo(ratio)` | 相对缩放 / 绝对缩放 |
| `zoomToFit()` | 缩放适配使内容完整可见 |
| `centerContent()` | 内容居中 |
| `fromJSON(data)` / `toJSON()` | 数据读写（详见[自定义节点与数据](./customization-and-data)） |

`embedding` 相关的节点嵌套（群组）配置见[自定义节点与数据](./customization-and-data)。

## 二、节点 Node：内置形状、markup/attrs

**内置形状**：`rect`（矩形）、`circle`（圆形）、`ellipse`（椭圆）、`polygon`（多边形）、`polyline`（折线）、`path`（路径）、`image`（图片）、`html`（借助 `foreignObject` 渲染任意 HTML 片段）。

```javascript
graph.addNode({ shape: 'rect', x: 100, y: 40, width: 100, height: 40 })
```

**markup / attrs 是 X6 定制节点外观的核心机制**（类比 HTML 结构 + CSS 样式）：

- **markup**：定义节点由哪些 SVG 元素组成（如一个矩形加一段文本），每个元素带 `selector` 供 attrs 定位。
- **attrs**：以 selector 为 key，把样式/属性映射到对应 SVG 元素，如下例中的 `body`/`label` 就是两个 selector：

```javascript
graph.addNode({
  shape: 'rect',
  x: 100, y: 40, width: 100, height: 40,
  attrs: {
    body: { fill: '#fff', stroke: '#333' }, // selector: body，对应矩形本体
    label: { text: 'hello' },               // selector: label，对应文本
  },
})
```

**基础属性**：`x`/`y`（位置，px）、`width`/`height`（尺寸，px，默认均为 1）、`angle`（旋转角度，默认 0）、`visible`、`zIndex`。修改已有节点：

```javascript
node.prop('size', { width: 120, height: 50 }) // 修改尺寸
node.attr('rect/fill', '#ccc')                // 修改某个 selector 对应的样式
```

自定义形状通过 `Node.register()`/`Graph.registerNode()` 注册（复用配置），详见[自定义节点与数据](./customization-and-data)；节点的 `ports` 连接桩配置见[连接桩与连接交互](./ports-and-connecting)。

## 三、边 Edge：source/target、路径与样式

```javascript
// source/target 四种写法：节点引用、节点ID、坐标点、带 port 信息
graph.addEdge({ source: rect1, target: rect2 })
graph.addEdge({ source: 'rect1', target: 'rect2' })
graph.addEdge({ source: 'rect1', target: { x: 100, y: 120 } })
graph.addEdge({
  source: { cell: rect1, port: 'out-port-1' },
  target: { cell: 'rect2', port: 'in-port-1' },
})

// vertices：边按顺序途经的路径点
graph.addEdge({ source: rect1, target: rect2, vertices: [{ x: 100, y: 200 }] })
```

**router 与 connector 是两套独立的机制，容易混为一谈**：

| 概念 | 作用 | 内置选项 |
| --- | --- | --- |
| `router`（路由算法） | 处理 `vertices`，生成实际的折线路径 | `normal`、`orth`（正交）、`oneSide`、`manhattan`（曼哈顿，自动避障）、`metro`（地铁图风格，45° 角）、`er`（ER 图专用） |
| `connector`（连接器） | 决定 vertices/路由输出点之间怎么画线 | `normal`（直线/折线）、`rounded`（圆角）、`smooth`（贝塞尔平滑曲线）、`jumpover`（跨越其他边时画"跳线"缺口） |

两者写法一致，都支持字符串简写或对象带参数：

```javascript
graph.addEdge({ source: rect1, target: rect2, router: 'orth' })
graph.addEdge({ source: rect1, target: rect2, router: { name: 'manhattan', args: {} }, connector: 'rounded' })
```

**箭头 marker**：内置 `block`、`classic`、`diamond`、`cross`、`async`、`path`、`circle`、`circlePlus`、`ellipse`，通过 `attrs.line.sourceMarker`/`targetMarker` 配置，支持对象形式自定义参数：

```javascript
graph.addEdge({
  source: rect1, target: rect2,
  attrs: { line: { targetMarker: { name: 'ellipse', rx: 10, ry: 6 } } }, // 自定义箭头参数
})
```

**labels 标签**：支持多标签数组、简化字符串写法：

```javascript
graph.addEdge({ labels: [{ attrs: { label: { text: 'edge' } } }] })
graph.addEdge({ labels: ['edge'] }) // 简化写法
```

修改已有边：`edge.prop('target', {...})`、`edge.attr('line/stroke', '#ccc')`。

## 四、易错点

- **markup 与 attrs selector 不匹配**：自定义 markup 后，若 attrs 里引用的 selector 名称与 markup 定义不一致，样式静默不生效（不会报错），排查成本高。
- **router 与 connector 职责搞混**：router 决定"折线拐几个弯、走哪条路径"，connector 决定"这条路径最终用什么线型画出来"，两者独立配置、互不替代。
- **`node.prop()` 局部覆盖 vs 整体替换**：`prop('size', {...})` 只更新指定路径，不会清空其它属性；需要整体替换建议直接操作完整对象。

---

画布、节点、边是静态骨架；节点之间怎么精确对接、拖拽连线时怎么校验，靠的是另一套体系：[连接桩与连接交互](./ports-and-connecting)。
