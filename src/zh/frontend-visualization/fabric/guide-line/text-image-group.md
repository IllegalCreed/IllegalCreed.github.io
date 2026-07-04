---
layout: doc
outline: [2, 3]
---

# 文本、图片与群组：Text / IText / Textbox / 滤镜 / Group

> 基于 Fabric.js v7.4.0 · 核于 2026-07

## 速查

- **文本三层继承**：`FabricText`（静态渲染，v6 前称 `fabric.Text`）→ `IText` 叠加「可编辑」能力 → `Textbox` 继承 `IText` 再叠加自动换行。
- **`FabricText`**：只读标题/标签类文本，`new FabricText('文案', { fontSize: 24, fontFamily: 'Arial' })`。
- **`IText` 编辑相关 API**：`editable`/`isEditing`/`selectionStart`/`selectionEnd`/`styles`（字符级样式）/`enterEditing()`/`exitEditing()`/`selectAll()`/`selectWord()`。
- **`Textbox` 自动换行**：`width` 是唯一可由用户拖拽改变的维度，改 `width` 触发重排；**Y 方向缩放被锁死**，高度随内容自动变化。
- **图片异步加载**：v6 起 `FabricImage.fromURL()` 是 **Promise API**（v5 是回调），务必 `await`/`.then()`。
- **跨域必设 `crossOrigin`**：不设置 `crossOrigin: 'anonymous'`，后续 `toDataURL()`/应用滤镜会因画布「被污染」抛 `SecurityError`。
- **滤镜使用两步**：`img.filters.push(new Grayscale())` 推入数组 → 显式调用 `img.applyFilters()` 才真正生效，随后 `canvas.renderAll()`。
- **内置滤镜**：`Grayscale`/`Brightness`/`Blur`/`Contrast`/`Saturation`/`Vibrance`/`Invert`/`Pixelate`/`ColorMatrix` 等。
- **滤镜渲染后端**：以 **WebGL** 为主（性能更好）；`Blur` 历史上有 Canvas2D 兜底实现，**v7 起该兜底已移除**、统一走 WebGL。
- **`Group`**：通用容器对象，把多个对象打包成一个可整体操作的复合对象；`group.forEachObject(cb)` 遍历成员，`group.removeAll()` 清空成员。
- **`ActiveSelection extends Group`**：专用于 canvas 框选/shift 多选产生的**临时选中态**，由 Canvas 内部管理；业务代码一般不需要手动 `new ActiveSelection()`。
- **`ActiveSelectionLayoutManager`**：`ActiveSelection` 使用专门的布局管理器，保证多选操作不破坏各对象原有布局。
- **`multiSelectionStacking` 两值**：`'canvas-stacking'`（遵循画布原本堆叠顺序）或 `'selection-order'`（按选择先后顺序），控制多选对象的层级排序策略。
- **嵌套 Group**：Group 内可再放 Group；子对象的 `parent` 属性指向父级；`layoutManager` 控制布局策略（自动包围盒/固定尺寸等）。
- **Group 内坐标系**：子对象一旦加入 Group，其 `left`/`top` 变为相对父 Group 的坐标而非画布绝对坐标（详见[上一页](./canvas-and-objects)坐标系一节）。
- **性能提示**：`Path`/长文本/大量子对象的 `Group` 开启 `objectCaching` 收益明显，简单形状收益很低（详见[序列化与自定义页](./serialization-and-custom)性能一节）。
- **进阶顺序**：[入门](../getting-started) → [Canvas 与对象模型](./canvas-and-objects) → 本页 → [交互与事件](./interaction-and-events) → [序列化与自定义](./serialization-and-custom) → [参考](../reference)。

## 一、文本三兄弟：Text / IText / Textbox

```javascript
import { FabricText, IText, Textbox } from 'fabric'

const label = new FabricText('只读标题', { fontSize: 24, fontFamily: 'Arial' })

const editable = new IText('点击我可编辑', { fontSize: 18 })
editable.enterEditing()   // 进入编辑态（也可由用户双击触发）
editable.exitEditing()

const wrapped = new Textbox('这是一段会根据宽度自动换行的正文……', {
  width: 200,           // 唯一可由用户拖拽改变的维度
  fontSize: 16,
})
```

三者是递进的继承关系：

- **`FabricText`**（静态渲染，v6 前称 `fabric.Text`）——只负责把文字画出来，不可编辑。
- **`IText`** 在其上叠加「可编辑」能力：`editable`/`isEditing` 标志位、`selectionStart`/`selectionEnd` 选区、`styles` 支持字符级样式（同一段文字不同字符可以不同颜色/字号）、`enterEditing()`/`exitEditing()`/`selectAll()`/`selectWord()` 一整套编辑态方法。
- **`Textbox`** 继承 `IText` 再叠加自动换行：改 `width` 会触发重新排版，**Y 方向缩放被锁死**（高度随内容自动变化），只有宽度可以手动缩放——这是与普通 `IText` 最直观的区别：`IText` 缩放会等比拉伸文字本身，`Textbox` 拉宽只改变换行宽度。

## 二、图片与滤镜

```javascript
import { FabricImage } from 'fabric'
import { Grayscale, Brightness, Blur } from 'fabric/filters' // 具体导出路径以实际版本为准

// v6 起 fromURL 是异步 Promise API（v5 是回调）
const img = await FabricImage.fromURL('/assets/photo.jpg', {
  crossOrigin: 'anonymous',   // 跨域图片必须设置，否则 toDataURL/滤镜会因画布"被污染"而抛异常
})
canvas.add(img)

// 应用滤镜：push 进 filters 数组后显式调用 applyFilters()
img.filters.push(new Grayscale())
img.filters.push(new Brightness({ brightness: 0.1 }))
img.applyFilters()
canvas.renderAll()
```

两个必须记住的细节：

1. **异步加载**：`FabricImage.fromURL()` 是 Promise，v5 遗留的回调式写法语义不对，必须 `await`/`.then()`。
2. **跨域污染**：加载跨域图片不设置 `crossOrigin: 'anonymous'`，后续调用 `toDataURL()`/应用滤镜时会触发浏览器的 canvas tainted 安全异常——这与原生 [Canvas 的跨域污染机制](../../canvas/guide-line/images-and-pixels)是同一套浏览器安全模型。

滤镜以 **WebGL** 为主渲染后端（性能更好），历史上部分滤镜有 Canvas2D 兜底实现（如 `Blur`），**v7 起 `Blur` 的 `drawImage` 兜底实现已被移除**、统一走 WebGL。内置滤镜含 `Grayscale`/`Brightness`/`Blur`/`Contrast`/`Saturation`/`Vibrance`/`Invert`/`Pixelate`/`ColorMatrix` 等，自定义滤镜可继承 `BaseFilter` 编写。

## 三、群组与选择：Group / ActiveSelection

```javascript
import { Group, ActiveSelection } from 'fabric'

// Group：通用容器对象，把多个对象打包成一个可整体操作的复合对象
const group = new Group([rect, circle], { left: 50, top: 50 })
canvas.add(group)

group.forEachObject(obj => console.log(obj.type))
group.removeAll()   // 清空成员
```

`ActiveSelection extends Group`，专用于「canvas 框选 / shift 多选」产生的临时选中态，由 Canvas 内部管理，使用专门的 `ActiveSelectionLayoutManager` 保证多选操作不破坏各对象原有布局；其 `multiSelectionStacking` 属性控制多选对象的层级排序策略：`'canvas-stacking'`（遵循画布原本堆叠顺序）或 `'selection-order'`（按选择先后顺序）。业务代码一般不需要手动 `new ActiveSelection()`，Fabric 会在用户框选/shift 点选时自动创建；只有需要自定义多选行为时才继承覆写。

嵌套场景：Group 内可再放 Group，子对象的 `parent` 属性指向父级，`layoutManager` 控制布局策略（自动包围盒/固定尺寸等）。和上一页提到的坐标系规则一致——子对象一旦加入 Group，其 `left`/`top` 就变成相对父 Group 的坐标而非画布绝对坐标。

内容类型讲完了，下一页[交互与事件](./interaction-and-events)进入用户怎么操作这些对象：控制点自定义、事件系统、自由绘制与动画。
