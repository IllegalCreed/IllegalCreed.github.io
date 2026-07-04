---
layout: doc
outline: [2, 3]
---

# 交互与事件：控件 / 事件系统 / 自由绘制 / 动画

> 基于 Fabric.js v7.4.0 · 核于 2026-07

## 速查

- **控件外观类属性**：`cornerSize`（默认 13）/`touchCornerSize`（触屏热区更大，默认 24）/`transparentCorners`/`cornerColor`/`cornerStyle`（`'rect'` \| `'circle'`，已标记 deprecated，优先用自定义 controls）/`borderColor`/`hasBorders`。
- **锁定类属性**：`lockMovementX`/`lockRotation`/`lockScalingFlip` 等——禁止对应交互，但对象仍可见/可能仍可选中。
- **禁用类属性**：`selectable: false` 完全禁止被选中；`evented: false` 完全不响应鼠标事件（连 hover 都不触发）；`hasControls: false` 隐藏所有控制点但仍可移动（若 `selectable` 为 true）。
- **自定义控件三级手段**：单实例传参、类默认值（构造函数里改默认属性）、全局共享（改类的静态 `createControls` 方法，影响该类所有实例）。
- **控件独立性**：官方强调每个实例的 `controls` 对象是构造时独立创建的，避免多个实例共享同一份控件配置导致互相污染。
- **事件分两级**：对象级 `obj.on('mousedown', cb)` / `obj.off()`；画布级 `canvas.on('mouse:down', cb)`。
- **画布级常用事件**：`mouse:down`（`opt.target` 为命中的对象，可能为 null）、`object:modified`（用户完成一次变换操作后触发）、`selection:created`（`opt.selected`）、`path:created`（自由绘制生成一条新路径后触发）。
- **事件坐标属性（v7 命名）**：`opt.scenePoint`（画布坐标系）、`opt.viewportPoint`（视口坐标系）——**v7 删除了 `pointer`/`absolutePointer`**，语义不变、纯改名。
- **官方承认事件清单不完整**：文档明确声明"没有一份人工维护、带完整参数说明的事件清单"，建议用 `/demos/events-inspector/` 演示页实时打印，或靠 TS 编辑器自动补全发现 `on()` 支持的事件名全集——写题/写笔记不要假装有完整清单。
- **自由绘制三步**：`canvas.isDrawingMode = true` → `canvas.freeDrawingBrush = new PencilBrush(canvas)` → 设 `width`/`color`。
- **内置笔刷 4 种**：`PencilBrush`（普通铅笔线）、`CircleBrush`（圆点喷绘）、`SprayBrush`（喷雾效果）、`PatternBrush`（图案填充笔触）。
- **每笔画完触发 `path:created`**：在 canvas 上生成一个 `Path` 对象，可在事件回调里做后处理（记录历史、同步协作等）。
- **动画高层 API**：对 `FabricObject` 直接调用 `rect.animate({ left, angle }, { duration, onChange, onComplete })`。
- **动画底层 API**：`util.animate` 对任意标量/数组值插值，自己接管 `onChange`；**rAF 回调里用 `renderAll()` 而非 `requestRenderAll()`**。
- **内置缓动函数 20 余种**：`easeInQuad`/`easeOutQuad`/`easeInOutQuad`/`easeInCubic`……`easeOutBounce`/`easeInElastic` 等标准缓动曲线。
- **复杂动画编排官方建议**：时间轴、交错动画等接第三方动画库，不硬凑 Fabric 自带能力。
- **v7 鼠标事件默认值反转（易埋雷）**：`fireMiddleClick`/`fireRightClick`/`stopContextMenu` 默认值由 `false` 改为 `true`；旧代码给这两类事件挂了处理器但没按 `event.button` 过滤，升级后可能出现意料之外的触发。
- **进阶顺序**：[入门](../getting-started) → [Canvas 与对象模型](./canvas-and-objects) → [文本、图片与群组](./text-image-group) → 本页 → [序列化与自定义](./serialization-and-custom) → [参考](../reference)。

## 一、交互控件 controls

```javascript
rect.set({
  cornerSize: 10,          // 控制点像素大小，默认 13
  touchCornerSize: 24,     // 触屏下控制点热区更大，默认 24
  transparentCorners: false,
  cornerColor: '#2b6cb0',
  cornerStyle: 'circle',   // 'rect' | 'circle'（已标记 deprecated，优先用自定义 controls）
  borderColor: '#2b6cb0',
  hasBorders: true,

  // 锁定类：禁止对应交互但对象仍可见/可能仍可选中
  lockMovementX: true,
  lockRotation: true,
  lockScalingFlip: true,

  selectable: false,   // 完全禁止被选中
  evented: false,      // 完全不响应鼠标事件（连 hover 都不触发）
  hasControls: false,  // 隐藏所有控制点，但仍可移动（若 selectable 为 true）
})
```

自定义控件有三级手段，按影响范围从小到大排列：单实例传参（如上面的 `set()` 调用）、类默认值（构造函数里改默认属性，影响该类之后新建的实例）、全局共享（改类的静态 `createControls` 方法，影响该类所有实例）。官方特别强调**每个实例的 `controls` 对象是构造时独立创建的**，避免多个实例共享同一份控件配置导致互相污染——这也延续了 v6 子类化改为标准 `class extends` 后「实例属性不共享原型可变对象」的设计原则。

## 二、事件系统

```javascript
// 对象级事件
const off = circle.on('mousedown', (opt) => {
  console.log(opt.scenePoint)     // 画布坐标系下的事件点（v7 命名）
  console.log(opt.viewportPoint)  // 视口坐标系下的事件点
})
circle.off('mousedown', handler)  // 或直接调用 on() 返回的 disposer

// 画布级事件
canvas.on('mouse:down', (opt) => { /* opt.target 为命中的对象，可能为 null */ })
canvas.on('object:modified', (opt) => { /* 用户完成一次变换操作后触发 */ })
canvas.on('selection:created', (opt) => { console.log(opt.selected) })
canvas.on('path:created', (opt) => { /* 自由绘制生成一条新路径后触发 */ })
```

事件分两级：**对象级**（`obj.on()`/`obj.off()`，只关心特定对象上发生了什么）和**画布级**（`canvas.on()`，统一在画布层监听所有交互，靠 `opt.target` 判断命中了哪个对象）。v7 把事件对象上的坐标属性做了改名：原来的 `pointer`/`absolutePointer` 已删除，只保留 `viewportPoint`（视口坐标系）/`scenePoint`（画布坐标系），语义不变、纯改名。

事件清单本身是 Fabric 文档里少数几处「官方承认不完整」的地方——文档明确声明没有一份人工维护、带完整参数说明的事件清单，建议通过 `/demos/events-inspector/` 演示页在浏览器里实时打印所有触发的事件名，或依赖 TypeScript 编辑器自动补全来发现 `on()` 支持的事件名全集。写题/写笔记时不要凭记忆"默写"一份完整事件列表去充数。

**v7 升级提醒**：鼠标右键/中键相关事件默认值发生反转——`fireMiddleClick`/`fireRightClick`/`stopContextMenu` 默认值由 `false` 改为 `true`。如果旧代码给这两类事件挂了处理器但没有按 `event.button` 做过滤，升级到 v7 后可能出现意料之外的触发，这是 v7 breaking change 清单里除 origin 默认值之外的第二个高频坑。

## 三、自由绘制

```javascript
import { PencilBrush, CircleBrush, SprayBrush, PatternBrush } from 'fabric'

canvas.isDrawingMode = true
canvas.freeDrawingBrush = new PencilBrush(canvas)
canvas.freeDrawingBrush.width = 30
canvas.freeDrawingBrush.color = '#ff0000'

// 切换笔刷类型
canvas.freeDrawingBrush = new CircleBrush(canvas)
```

开启自由绘制只需要三步：把 `canvas.isDrawingMode` 设为 `true`、指定 `canvas.freeDrawingBrush` 为某个笔刷实例、按需设置 `width`/`color`。内置笔刷有 4 种：`PencilBrush`（普通铅笔线）、`CircleBrush`（圆点喷绘）、`SprayBrush`（喷雾效果）、`PatternBrush`（用图案填充笔触）。每次画完一笔会在 canvas 上触发 `path:created` 事件、生成一个 `Path` 对象——白板/签名板类应用常在这个事件里做撤销历史记录或多端同步。

## 四、动画 API

```javascript
// 高层 API：直接对 FabricObject 调用 animate()
rect.animate({ left: 300, angle: 360 }, {
  duration: 800,
  onChange: () => canvas.renderAll(),
  onComplete: () => console.log('done'),
})

// 底层 API：util.animate 对任意标量/数组值做插值，自己接管 onChange
import { animate } from 'fabric/util'
animate({
  startValue: 1, endValue: 0,
  onChange: (v) => { rect.set('opacity', v); canvas.renderAll() }, // 在 rAF 回调里用 renderAll 而非 requestRenderAll
})
```

高层 API 直接对 `FabricObject` 调用 `animate()`，传入目标属性值与 `duration`/`onChange`/`onComplete` 配置，适合「把某个对象的几个属性动画到目标值」这类场景。底层 `util.animate` 更通用，对任意标量/数组值做插值、自己接管每一帧的 `onChange` 回调，适合驱动非对象属性（如自定义状态）的动画。两者都提供了 20 余种标准缓动曲线（`easeInQuad`/`easeOutQuad`/`easeInOutQuad`……`easeOutBounce`/`easeInElastic` 等）。复杂动画编排（时间轴、交错动画）官方建议接第三方动画库，而不是硬凑 Fabric 自带能力。

控件、事件、绘制与动画构成了 Fabric 的完整交互闭环，下一页[序列化与自定义](./serialization-and-custom)讲这些交互结果怎么存下来、怎么导出、以及怎么用子类化扩展 Fabric 本身。
