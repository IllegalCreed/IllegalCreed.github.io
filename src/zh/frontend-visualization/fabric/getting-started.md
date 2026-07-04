---
layout: doc
outline: [2, 3]
---

# 入门：定位、安装与第一个可交互对象

> 基于 Fabric.js v7.4.0（npm latest，v6 ESM 语法在 v7 延续）· 核于 2026-07

## 速查

- **一句话定位**：Fabric.js = 给裸 Canvas 补上一层**类似浏览器 DOM 的对象模型 + 事件系统**——每个图形都是可选中、可拖拽、可缩放旋转、可序列化的「对象」，而不是画完即忘的像素。
- **立即模式 vs 对象模型**：原生 Canvas 是立即模式（画完即忘，想动一个图形要清屏重画、命中检测自己写）；Fabric 在其上维护一棵对象树，「移动一个矩形」只需改 `left`/`top` 属性再渲染一帧。
- **选型口径**：少量、精细可编辑的图形对象（设计工具/白板/证件照编辑器）→ **Fabric.js** 或 **Konva**（二者定位高度重叠，技术栈是 React 时 Konva 的 `react-konva` 略有优势）；海量对象/粒子特效/游戏级帧率 → **PixiJS**（WebGL 渲染管线优先）；只需要「画出来看」不要求对象级交互 → 原生 [Canvas](../canvas/getting-started) 更轻量。
- **版本基线**：npm 最新 **v7.4.0**（2026-05-18）；v6 系列止步于 **6.9.1**（2025-12-15）；**v7.0.0** 于 2025-12-22 发布，随后连续迭代到 7.4.0。
- **v6 是地基级重写**：ES Modules + TypeScript 原生重写 + 命名导出 + 回调 API 大量改 Promise + 子类化改标准 `class extends`，这是 Fabric 历史上最大的一次架构重写；**v7 相对 v6 只是「装修级」调整**（默认值反转、少量 API 改名/删除），v6 语法在 v7 下完全有效。
- **安装**：`npm i --save fabric`。
- **引入（浏览器/打包器环境）**：具名导出 `import { Canvas, Rect } from 'fabric'`，取代 v5 的 `fabric.xxx` 命名空间写法。
- **引入（Node.js 环境）**：走 `fabric/node` 子路径，内部依赖 `node-canvas` 做无头渲染，`node-canvas` 在 v7 起锁定 `canvas@3.2.x`。
- **`fabric/es` 子路径**：官方标注「谨慎使用」，`loadFromJSON`/SVG 加载等安全边界未必覆盖，不确定含义时不要用。
- **CDN 引入**：`<script src="https://cdn.jsdelivr.net/npm/fabric@latest/dist/index.min.js"></script>`；生产环境应把 `@latest` 换成锁定版本号（如 `@7.4.0`）并自行生成 `integrity`/`crossorigin`，防止 CDN 被劫持后静默篡改脚本。
- **v5 语法照抄会报错**：网上大量老教程是 `import { fabric } from 'fabric'` + `fabric.Canvas` 命名空间写法，v6 起彻底失效，必须改具名导出。
- **三个特殊改名（v5→v6，延续到 v7）**：`fabric.Object` → `FabricObject`、`fabric.Text` → `FabricText`、`fabric.Image` → `FabricImage`（规避 JS 保留字/全局对象命名冲突）；其余类名（`Canvas`/`Rect`/`Circle`/`Group`……）不变，只是从命名空间属性变成具名导出。
- **Canvas vs StaticCanvas**：`new Canvas(el)` 支持选中/拖拽/缩放/旋转/事件的完整交互画布；`new StaticCanvas(el)` 是纯渲染画布，无交互，用于展示/缩略图/服务端出图（继承关系与渲染方法详见[下一页](./guide-line/canvas-and-objects)）。
- **添加/移除对象**：`canvas.add(rect, circle)` 一次可传多个对象；`canvas.remove(rect)` 移除。
- **FabricObject 是万物基类**：`Rect`/`Circle`/`Path`/`FabricText`/`FabricImage`……都继承自它，共享一套通用属性：`left`/`top`/`width`/`height`/`fill`/`stroke`/`strokeWidth`/`angle`/`opacity`/`originX`/`originY`。
- **origin 是定位基准点**：`originX`/`originY` 决定对象以哪一点作为 `left`/`top` 的定位基准；**v6 默认 `'left'/'top'`，v7 默认改为 `'center'`**——升级踩坑高发点，本页示例显式指定避免歧义，完整迁移提示见[参考页](./reference)。
- **手动触发渲染**：`canvas.renderAll()` 立即同步渲染整棵对象树；日常业务更常用的 `requestRenderAll()`（合并多次修改到下一帧）留到[下一页](./guide-line/canvas-and-objects)细讲。
- **进阶顺序**：本页 → [Canvas 与对象模型](./guide-line/canvas-and-objects) → [文本、图片与群组](./guide-line/text-image-group) → [交互与事件](./guide-line/interaction-and-events) → [序列化与自定义](./guide-line/serialization-and-custom) → [参考](./reference)。

## 一、定位：Canvas 之上的交互式对象模型

原生 Canvas 2D 是**立即模式**绘图 API：JS 逐条命令把像素画进位图缓冲，画完即忘——想让一个圆「动起来」，只能清屏后以新坐标重画一帧；想知道「点击落在哪个图形上」，也只能自己维护对象数组做命中检测。Fabric.js 的核心价值就是在这层立即模式 API 之上，补一层**类似浏览器 DOM 的对象模型**：每个图形（`Rect`/`Circle`/`FabricText`……）都是一个持久存在的对象，有属性、有事件、可被选中拖拽缩放旋转，改一个属性调用渲染方法即可反映到画面上，不需要手写命中检测和重绘逻辑。

这也是 Fabric 与同类库的选型分野所在：

- **vs 原生 Canvas API**：原生 Canvas 无对象概念，需自己实现选中/拖拽/变换矩阵；只需要「画出来看」的场景（图表、游戏原型、高度定制 UI）用原生 Canvas 更轻量。
- **vs Konva**：Konva 是与 Fabric 高度相似的交互对象模型库，内置 `Transformer` 组件对标 Fabric 的 `controls` 系统；`react-konva` 是官方一线 React 绑定，React 技术栈下 Konva 集成更顺滑，两者定位重叠、可视团队栈二选一。
- **vs PixiJS**：PixiJS 是 WebGL 优先的高性能渲染引擎，无内置交互层（需自建或接 `pixi-viewport`），性能定位是万级以上对象/粒子/大规模可视化；Fabric/Konva 是「每个对象都有属性面板」的编辑器思路，PixiJS 是「渲染吞吐量优先」的引擎思路——上万对象、游戏级帧率场景选 PixiJS。

一句话选型口诀：**要做"设计工具/白板/证件照编辑器"选 Fabric 或 Konva；要做"游戏/粒子特效/大数据点图"选 PixiJS。**

## 二、安装与引入

```bash
npm i --save fabric
```

不同运行环境的引入方式不同，v6 起统一走 ES Modules 具名导出：

```javascript
// 浏览器 / 现代打包器环境：具名导出，取代 v5 的 fabric.xxx 命名空间写法
import { Canvas, Rect, Circle } from 'fabric'

// Node.js 环境：走 fabric/node 子路径，内部依赖 node-canvas 做无头渲染
// v7 起 node-canvas 锁定 canvas@3.2.x，engines.node 要求 >= 20
import { Canvas, Rect } from 'fabric/node'

// 只需要精简子集、清楚自己在做什么时可用 fabric/es
// 官方标注"谨慎使用"：loadFromJSON / SVG 加载等安全边界未必覆盖
import { StaticCanvas, Rect } from 'fabric/es'
```

```html
<!-- CDN 引入（浏览器全局脚本方式，内部自带 UMD 打包） -->
<script src="https://cdn.jsdelivr.net/npm/fabric@latest/dist/index.min.js"></script>
<!-- 生产环境建议：把 @latest 换成锁定的具体版本号（如 @7.4.0），
     并按需自行生成 integrity="sha384-…" + crossorigin="anonymous"，
     防止 CDN 被劫持后静默篡改脚本内容。 -->
```

**v5 语法照抄会报错**：网上大量老教程 / Stack Overflow 代码是 `import { fabric } from 'fabric'` + `fabric.Canvas` 命名空间写法，v6 起彻底失效，必须改成具名导出。批量替换旧代码时还要留意三个容易漏改的特殊改名——为避开 JS 保留字/全局对象命名冲突，`fabric.Object` → `FabricObject`、`fabric.Text` → `FabricText`、`fabric.Image` → `FabricImage`；其余类名（`Canvas`/`Rect`/`Circle`/`Group`……）在 v6 中保持原名，只是从「命名空间属性」变成「具名导出」。

## 三、第一个可交互对象

```javascript
import { Canvas, Rect, Circle } from 'fabric'

// 交互式画布：支持选中/拖拽/缩放/旋转/事件，第一个参数是 <canvas> 元素的 id
const canvas = new Canvas('canvas-el-id', {
  width: 800,
  height: 600,
  backgroundColor: '#f0f0f0',
})

const rect = new Rect({
  left: 100,
  top: 100,
  width: 120,
  height: 80,
  fill: 'rgba(255,0,0,0.6)',
  stroke: '#333',
  strokeWidth: 2,
  angle: 15,        // 旋转角度（度）
  opacity: 0.9,
  originX: 'left',  // 变换原点 X：v7 默认改为 'center'，此处显式指定避免歧义
  originY: 'top',
})

const circle = new Circle({ left: 260, top: 100, radius: 50, fill: 'blue' })

canvas.add(rect, circle)  // 一次可传多个对象
canvas.remove(rect)       // 从画布移除（对象仍在内存中，可再次 add）
```

短短几行代码已经体现了 Fabric 与原生 Canvas 的根本差异：`rect`/`circle` 是持久存在的对象，`canvas.add()`/`canvas.remove()` 操作的是对象树而不是像素；后续要移动矩形，只需要 `rect.set({ left: 300 })` 再触发一次渲染，不需要手动清屏重画。

## 四、对象心智模型：FabricObject

所有可视对象（`Rect`/`Circle`/`Path`/`FabricText`/`FabricImage`……）都继承自同一个基类 `FabricObject`（v6 前称 `fabric.Object`），这是理解 Fabric 的第一心智模型：**先有一套通用属性/方法，再有各具体形状的特化行为**。常见通用属性：

| 属性 | 含义 |
| --- | --- |
| `left` / `top` | 定位坐标（相对 `originX`/`originY` 指定的基准点） |
| `width` / `height` | 对象的原始尺寸（未经缩放） |
| `fill` / `stroke` / `strokeWidth` | 填充色 / 描边色 / 描边宽度 |
| `angle` | 旋转角度（单位是度，非弧度） |
| `opacity` | 不透明度 |
| `originX` / `originY` | 变换原点：决定 `left`/`top` 以对象的哪一点为基准 |

`originX`/`originY` 是最容易被忽视但影响巨大的一对属性：默认值决定了「不设置时对象以哪个点对齐坐标」——**v6 默认 `'left'/'top'`（左上角对齐），v7 默认改为 `'center'`（中心对齐）**。这是 v6 升级到 v7 的头号踩坑点：沿用旧代码把对象放在 `(0,0)`，在 v7 下会有四分之三的对象跑到画布外。本页示例显式写出 `originX: 'left', originY: 'top'`，绕开默认值差异；升级场景的完整应对（含官方迁移辅助方法）见[参考页](./reference)。

渲染层面，改了对象属性后需要手动告诉画布「该重画了」——`canvas.renderAll()` 立即同步渲染整棵对象树。更完整的渲染方法对比（含日常业务优先使用的 `requestRenderAll()`）、Canvas 与 StaticCanvas 的三层继承关系、内置形状清单，都在下一页[Canvas 与对象模型](./guide-line/canvas-and-objects)展开。
