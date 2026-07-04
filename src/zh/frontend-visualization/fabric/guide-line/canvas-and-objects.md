---
layout: doc
outline: [2, 3]
---

# Canvas 与对象模型：StaticCanvas / FabricObject / 坐标系

> 基于 Fabric.js v7.4.0 · 核于 2026-07

## 速查

- **三层继承（官方 API 文档实测）**：`Canvas extends SelectableCanvas extends StaticCanvas`——`StaticCanvas` 只管渲染栈，`SelectableCanvas` 叠加选中/多选能力，`Canvas` 再叠加鼠标事件、绘图模式等完整交互。三层而非两层，是容易被小看的实现细节。
- **`StaticCanvas`**：纯渲染画布，无交互，用于展示/缩略图/服务端出图。
- **`Canvas`**：交互式画布，支持选中/拖拽/缩放/旋转/事件。
- **渲染方法二选一**：`renderAll()` 立即同步渲染整棵对象树；`requestRenderAll()` 用 `requestAnimationFrame` 合并多次修改到下一帧渲染——**日常业务优先用后者**避免掉帧。
- **Canvas 关键属性**：`isDrawingMode`（自由绘制开关）、`freeDrawingBrush`（当前画笔实例）、`selection`（是否允许框选）、`viewportTransform`（缩放平移矩阵）、`enableRetinaScaling`（高分屏适配）。
- **FabricObject 是万物基类**：`Rect`/`Circle`/`Path`/`FabricText`/`FabricImage`……都继承自它（v6 前称 `fabric.Object`），共享一套通用属性与方法。
- **内置形状 8 种**：`Rect`、`Circle`、`Ellipse`、`Triangle`、`Line`、`Polygon`、`Polyline`、`Path`（接收 SVG path 字符串或坐标数组）。
- **常用方法**：`set(props)`/`get(key)` 读写属性、`scale(v)` 等比缩放、`rotate(angle)`、`scaleToWidth/Height(px)` 按目标像素反推缩放比、`clone()` 克隆、`setCoords()` 刷新包围盒与控制点坐标、`calcTransformMatrix()` 计算含父级的完整变换矩阵。
- **改属性优先走 `set()`**：Fabric 通过 `set()` 感知 `cacheProperties` 里的字段变化来自动置位 `dirty`，直接赋值可能不会正确标记缓存失效。
- **忘调 `setCoords()`**：手动改 `left`/`top`/`scaleX` 等且没有触发内部同步逻辑时，对象的包围盒与控制点位置可能与视觉外观不同步。
- **矩阵六参数**：`[a, b, c, d, e, f]`——`[a,b]`/`[c,d]` 是变换后的两个基向量，`[e,f]` 是对象中心相对父平面原点的偏移；`angle`/`scaleX`/`scaleY`/`skewX`/`skewY` 都是从矩阵分解出的「人类可读」表现值。
- **两个计算矩阵的方法**：`calcOwnTransform()` 只算对象自身矩阵，不含父级/画布变换；`calcTransformMatrix()` 计算包含父 Group / clipPath 平面的完整矩阵。
- **两个设置中心点的方法**：`setCenterPoint(point)` 按画布坐标系；`setRelativeCenterPoint(point)` 按其所在父平面坐标系。
- **Group 内坐标系陷阱**：对象一旦被加入 `Group`，其 `left`/`top` 变为相对父 `Group` 的坐标而非画布绝对坐标；`ungroup` 后 Fabric 自动换算回绝对坐标，但自定义逻辑直接读子对象坐标要注意判断是否处于 Group 内。
- **viewport 变换与对象变换分层**：`canvas.zoomToPoint(new Point(x, y), zoomLevel)` 缩放整个画布视口；`canvas.viewportTransform` 是当前视口矩阵 `[a,b,c,d,e,f]`，与单个对象的变换矩阵是两层独立机制。
- **v7 origin 默认值坑（升级重灾区）**：v6 时代 `originX`/`originY` 默认 `'left'/'top'`，v7 默认改成 `'center'`——沿用旧代码把对象放在 `(0,0)` 会导致对象四分之三跑到画布外。
- **v7 移除的 Canvas 方法**：`getCenter()` → `getCenterPoint()`、`getPointer()` → `getScenePoint()`/`getViewportPoint()`、`setWidth()`/`setHeight()` → `setDimensions({ width, height })`。
- **进阶顺序**：[入门](../getting-started) → 本页 → [文本、图片与群组](./text-image-group) → [交互与事件](./interaction-and-events) → [序列化与自定义](./serialization-and-custom) → [参考](../reference)。

## 一、Canvas 与 StaticCanvas

```javascript
import { Canvas, StaticCanvas } from 'fabric'

// 交互式画布：支持选中/拖拽/缩放/旋转/事件
const canvas = new Canvas('canvas-el-id', {
  width: 800,
  height: 600,
  backgroundColor: '#f0f0f0',
})

// 纯渲染画布：无交互，用于展示/缩略图/服务端出图
const staticCanvas = new StaticCanvas('canvas-el-id')
```

继承关系（官方 API 文档实测）是三层而非两层：`Canvas extends SelectableCanvas extends StaticCanvas`。`StaticCanvas` 只负责渲染栈管理（对象树、背景、导出）；`SelectableCanvas` 在其上叠加选中/多选能力；`Canvas` 再叠加鼠标事件、绘图模式等完整交互能力。选服务端出图/纯展示场景时，用 `StaticCanvas` 就够了，没必要为了不需要的交互层付出额外开销。

渲染方法有两个，语义不同：

- `renderAll()`：立即同步渲染整棵对象树。
- `requestRenderAll()`：用 `requestAnimationFrame` 把同一帧内的多次修改合并到下一帧统一渲染——**日常业务优先用这个**，避免连续修改多个属性时反复触发同步渲染造成掉帧。

Canvas 上几个值得记住的关键属性：`isDrawingMode`（自由绘制开关，详见[交互与事件页](./interaction-and-events)）、`freeDrawingBrush`（当前画笔实例）、`selection`（是否允许框选）、`viewportTransform`（缩放平移矩阵）、`enableRetinaScaling`（高分屏适配）。

## 二、FabricObject 对象模型

所有可视对象都继承自 `FabricObject`（v6 前称 `fabric.Object`），共享一套通用属性与方法：

```javascript
import { Canvas, Rect, Circle } from 'fabric'

const canvas = new Canvas('c')

const rect = new Rect({
  left: 100, top: 100,
  width: 120, height: 80,
  fill: 'rgba(255,0,0,0.6)',
  stroke: '#333',
  strokeWidth: 2,
  angle: 15,           // 旋转角度（度）
  opacity: 0.9,
  originX: 'left',     // 变换原点 X（v7 默认改为 'center'，见下文坑点）
  originY: 'top',
})

const circle = new Circle({ left: 260, top: 100, radius: 50, fill: 'blue' })

canvas.add(rect, circle)   // 一次可传多个对象
canvas.remove(rect)
```

常用方法一览：

| 方法 | 作用 |
| --- | --- |
| `set(props)` / `get(key)` | 读写属性——**改属性优先走 `set()`**，Fabric 靠它感知 `cacheProperties` 字段变化来自动置位 `dirty`，直接赋值可能不会正确触发缓存失效 |
| `scale(v)` | 等比缩放 |
| `rotate(angle)` | 旋转到指定角度 |
| `scaleToWidth(px)` / `scaleToHeight(px)` | 按目标像素反推缩放比 |
| `clone()` | 克隆对象 |
| `setCoords()` | 刷新包围盒与控制点坐标——手动改了 `left`/`top`/`scaleX` 等属性后若发现包围盒/控制点跟视觉外观对不上，多半是忘了调这个 |
| `calcTransformMatrix()` | 计算含父级（Group/clipPath）的完整变换矩阵 |

## 三、内置形状

```javascript
import { Path } from 'fabric'
const path = new Path('M 0 0 L 200 100 L 170 200 z', { fill: 'green' })
```

Fabric 内置 8 种基础形状：`Rect`、`Circle`、`Ellipse`、`Triangle`、`Line`、`Polygon`、`Polyline`、`Path`（接收 SVG path 字符串或坐标数组，语法与 [SVG 路径](../../svg/guide-line/paths) 的 `d` 命令同源）。复杂图形（星形、自定义 icon）通常走 `Path` 或者子类化 `FabricObject` 自绘（见[序列化与自定义页](./serialization-and-custom)）。

## 四、坐标系与变换矩阵

Fabric 内部用标准 2D 变换矩阵 `[a, b, c, d, e, f]` 描述每个对象：`[a,b]`/`[c,d]` 是变换后的两个基向量，`[e,f]` 是对象中心相对父平面原点的偏移；`angle`/`scaleX`/`scaleY`/`skewX`/`skewY` 都是从矩阵中分解出的「人类可读」表现值，方便业务代码直接读写，不必手算矩阵。

```javascript
obj.calcOwnTransform()      // 只计算对象自身矩阵，不含父级/画布变换
obj.calcTransformMatrix()   // 计算包含父 Group / clipPath 平面的完整矩阵
obj.setCenterPoint(point)          // 按画布坐标系设置对象中心
obj.setRelativeCenterPoint(point)  // 按其所在父平面坐标系设置中心
```

对象若处于 Group / clipPath 等「父平面」中，其 `left`/`top` 是**相对父平面而非画布**的坐标，这是嵌套结构下最容易读错坐标的地方——加入 `Group` 后坐标系原点从画布切换到 Group 内部，`ungroup` 后 Fabric 会自动换算回绝对坐标，但自定义逻辑里直接读取子对象坐标时要先判断对象是否处于 Group 内。

viewport 变换（画布整体缩放平移）与单个对象的变换是分层的两套机制：

```javascript
import { Point } from 'fabric'
canvas.zoomToPoint(new Point(x, y), zoomLevel)
canvas.viewportTransform // [a,b,c,d,e,f] 当前视口矩阵
```

**v7 升级提醒**：`originX`/`originY` 默认值从 v6 的 `'left'/'top'` 改为 v7 的 `'center'`，是升级重灾区；同时 v7 移除了几个 Canvas 方法：`getCenter()` 改用 `getCenterPoint()`、`getPointer()` 拆成 `getScenePoint()`/`getViewportPoint()`、`setWidth()`/`setHeight()` 合并为 `setDimensions({ width, height })`。完整迁移对照见[参考页](../reference)。

掌握了 Canvas 结构、对象模型与坐标系，下一页[文本、图片与群组](./text-image-group)进入更具体的内容类型：可编辑文本、图片滤镜与多对象群组。
