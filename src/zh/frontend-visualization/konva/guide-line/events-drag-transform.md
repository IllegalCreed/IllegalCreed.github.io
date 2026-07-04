---
layout: doc
outline: [2, 3]
---

# 事件系统、拖拽与 Transformer 变换器

> 基于 Konva v10.3（npm latest 10.3.0）· 核于 2026-07

## 速查

- **绑定语法**：`node.on('click', fn)`，支持空格分隔同时绑定多个事件类型，如 `node.on('mouseover mouseout', fn)`；解绑用 `node.off('click')`。
- **五大事件族**：
  - 鼠标：`mouseover`/`mouseout`/`mouseenter`/`mouseleave`/`mousemove`/`mousedown`/`mouseup`/`wheel`/`click`/`dblclick`。
  - 触摸（移动端自动支持）：`tap`/`dbltap`/`touchstart`/`touchmove`/`touchend`。
  - 指针：`pointerdown`/`pointermove`/`pointerup`/`pointercancel`/`pointerover`/`pointerenter`/`pointerout`/`pointerleave`/`pointerclick`/`pointerdblclick`。
  - 拖拽：`dragstart`/`dragmove`/`dragend`。
  - 变换：`transformstart`/`transform`/`transformend`。
- **冒泡**：事件默认从子节点冒泡到父容器（如 Circle → Layer）；`evt.cancelBubble = true` 阻止继续冒泡；支持在 Layer/Stage 上做事件委托，通过 `evt.target` 判断具体点击的子节点。
- **拖拽**：`draggable: true` 即自动开启桌面 + 移动端拖拽，无需手写状态机；`dragstart`/`dragmove`/`dragend` 三个生命周期事件。
- **方向限制两种方式**：`dragmove` 事件里直接改坐标（教程写法，更直观）；`dragBoundFunc(pos)` 接收/返回**绝对坐标**（API 写法，更声明式，专为约束设计）。
- **Transformer 基础**：`new Konva.Transformer({ nodes: [shape] })` 或动态 `tr.nodes([shape])` 绑定；`rotateEnabled`/`enabledAnchors`/`anchorSize`/`centeredScaling` 控制外观与交互。
- **选中/多选官方范式**：`stage.on('click tap', ...)` 里判断 `e.target === stage` 清空选中，`evt.shiftKey`/`ctrlKey` 判断是否累加/移除选中集合。
- **关键机制（必考坑）**：Transformer 缩放改变的是 `scaleX`/`scaleY`，**不是** `width`/`height`；需要真实像素尺寸时须在 `transformend` 里手动换算并把 scale 重置为 1。
- **`boundBoxFunc(oldBox, newBox)`**：限制缩放/旋转后的边界框（绝对坐标系），返回 `oldBox` 即拒绝本次变换，可用于最大/最小尺寸限制。
- **Transformer 进阶**：`anchorDragBoundFunc` 做锚点吸附对齐；`rotationSnaps` 设旋转吸附角度数组；`centeredScaling` 或按住 ALT 做居中缩放。
- **进阶顺序**：本页承接 [Stage/Layer/Shape](./stage-layer-shape)，下一步是[动画与滤镜](./animation-filters)。

## 一、事件系统：绑定、事件族与冒泡

```javascript
circle.on("click", (evt) => {
  console.log("clicked", evt.target);
});

circle.on("mouseover mouseout", (evt) => {
  /* 支持空格分隔多事件同绑 */
});
```

事件按用途分五族，覆盖桌面、移动端与新一代指针输入：

- **鼠标事件**：`mouseover`/`mouseout`/`mouseenter`/`mouseleave`/`mousemove`/`mousedown`/`mouseup`/`wheel`/`click`/`dblclick`。
- **触摸事件**（移动端自动支持）：`tap`/`dbltap`/`touchstart`/`touchmove`/`touchend`。
- **指针事件**：`pointerdown`/`pointermove`/`pointerup`/`pointercancel`/`pointerover`/`pointerenter`/`pointerout`/`pointerleave`/`pointerclick`/`pointerdblclick`。
- **拖拽/变换事件**：`dragstart`/`dragmove`/`dragend`、`transformstart`/`transform`/`transformend`。

**事件冒泡与取消**：事件默认从子节点冒泡到父容器（如 Circle → Layer）；`evt.cancelBubble = true` 阻止继续向上冒泡。事件解绑用 `node.off('click')`；也支持事件委托——在 Layer/Stage 上统一监听，通过 `evt.target` 判断具体点击的是哪个子节点，避免给每个节点单独绑定。

## 二、拖拽 Drag and Drop

```javascript
const rect = new Konva.Rect({
  x: 50,
  y: 50,
  width: 100,
  height: 100,
  fill: "yellow",
  draggable: true,
});

rect.on("dragstart", () => console.log("start"));
rect.on("dragmove", () => console.log("moving", rect.x(), rect.y()));
rect.on("dragend", () => console.log("end"));
```

`draggable: true` 即自动开启桌面鼠标 + 移动端触摸拖拽，无需手写 mousedown/mousemove/mouseup 状态机。

**限制拖拽方向**有两种写法，文档里都会出现，各有适用场景：

官方教程用 `dragmove` 事件覆盖坐标的方式，更直观：

```javascript
horizontalOnly.on("dragmove", function () {
  this.y(50);
}); // 锁定 y，只能水平拖
verticalOnly.on("dragmove", function () {
  this.x(200);
}); // 锁定 x，只能垂直拖
```

`dragBoundFunc`（Node/Stage 官方 API）是另一种边界约束方式，返回受限后的**绝对坐标**，更声明式、专为拖拽约束设计：

```javascript
node.dragBoundFunc(function (pos) {
  // pos 是拖拽中试图到达的绝对坐标，需返回被约束后的绝对坐标
  return { x: this.absolutePosition().x, y: pos.y }; // 只允许垂直移动
});
```

复杂约束（限制在圆形/多边形区域内、限制在 Stage 边界内）都是在这两种回调里做数学判断，选择哪种主要看习惯——教程页倾向 `dragmove` 事件直接改坐标，API 参考页提供 `dragBoundFunc` 更结构化的方案。

## 三、变换器 Transformer：基础用法与选中范式

```javascript
const tr = new Konva.Transformer({
  nodes: [rect], // 绑定要变换的节点（也可用 tr.nodes([rect]) 动态设置）
  boundBoxFunc: (oldBox, newBox) => {
    if (newBox.width > 200 || newBox.width < 20) return oldBox; // 限制缩放范围
    return newBox;
  },
  rotateEnabled: true,
  enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"], // 只显示部分控制点
  anchorSize: 10,
  centeredScaling: false, // true 则双向同时缩放（或按住 ALT 临时启用）
});
layer.add(tr);

// 点击选中/取消选中/多选（官方推荐范式）
stage.on("click tap", (e) => {
  if (e.target === stage) {
    tr.nodes([]);
    return;
  } // 点空白处取消选中
  const isSelected = tr.nodes().includes(e.target);
  const metaPressed = e.evt.shiftKey || e.evt.ctrlKey;
  if (metaPressed && !isSelected) tr.nodes([...tr.nodes(), e.target]); // Shift/Ctrl 多选
  else if (!metaPressed) tr.nodes([e.target]);
});
```

这段"点击空白清空选中 + Shift/Ctrl 累加选中"的范式，是设计器类应用最标准的选中交互模型，值得直接复用。

## 四、Transformer 关键机制：scale 不是 size（必考坑）

**Transformer 缩放时不改变节点的 `width`/`height`，而是改变 `scaleX`/`scaleY`**。若业务逻辑依赖真实像素宽高，需要在 `transformend` 里手动换算并重置 scale：

```javascript
rect.on("transformend", () => {
  rect.width(rect.width() * rect.scaleX());
  rect.height(rect.height() * rect.scaleY());
  rect.scaleX(1);
  rect.scaleY(1);
});
```

这是 Konva 最容易踩的坑之一：拖拽 Transformer 手柄缩放后 `width()`/`height()` 值不变，变的是 `scaleX()`/`scaleY()`。业务上如果直接读 `width` 计算布局会拿到错误的"视觉尺寸"，必须用 `width * scaleX` 换算，或者像上面这样在 `transformend` 里回写归一化。

## 五、Transformer 进阶能力

除了基础的缩放/旋转，`Transformer` 还提供几个设计器级的进阶能力：

- **`boundBoxFunc(oldBox, newBox)`**：限制缩放/旋转后的边界框（绝对坐标系），返回 `oldBox` 即拒绝本次变换。Resize Limits（最大/最小尺寸限制）就是用它实现的，思路与前面的 `dragBoundFunc` 一致——一个限制拖拽位置，一个限制变换后的包围盒。
- **`anchorDragBoundFunc(oldAbsPos, newAbsPos, event)`**：控制"锚点吸附"，如靠近参考线 10px 内自动吸附对齐，是设计器辅助线功能的实现基础。
- **`rotationSnaps`**：设置旋转吸附角度数组（如 `[0, 90, 180, 270]`），拖到接近这些角度时自动吸附。
- **`centeredScaling`**：居中缩放（双侧同时变化）或按住 ALT 临时触发。

**注意**：`node.destroy()` 前如果该节点还绑定在某个 `Transformer.nodes()` 里，需要先 `tr.nodes([])` 或从数组里移除，否则 Transformer 可能引用到已销毁的节点导致报错。

事件、拖拽、Transformer 解决了"用户怎么点、怎么拖、怎么变换"；图形怎么动起来（补间/帧动画）、怎么加滤镜特效，是下一页的内容：[动画：Animation / Tween / Easings 与滤镜](./animation-filters)。
