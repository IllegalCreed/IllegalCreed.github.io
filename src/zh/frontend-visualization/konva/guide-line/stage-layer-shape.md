---
layout: doc
outline: [2, 3]
---

# Stage / Layer / Shape：架构与节点操作

> 基于 Konva v10.3（npm latest 10.3.0）· 核于 2026-07

## 速查

- **四层树**：`Stage`（舞台，绑定 DOM 容器）→ `Layer`（图层，一个独立 `<canvas>`）→ `Group`（分组，纯容器不渲染）→ `Shape`（具体图形）。
- **Layer 双画布**：每个 Layer 内部维护「可见 canvas + 隐藏 hit canvas」两张画布，hit canvas 专门做事件命中检测，避免每次事件都跑几何运算。
- **Stage 关键 API**：
  - `container`：DOM 元素 id 或引用，浏览器端必填，Node.js 端可省略。
  - `stage.getPointerPosition()`：获取鼠标/触摸相对 Stage 的坐标（已处理缩放换算），比自算 `clientX - rect.left` 更可靠。
  - `Konva.pixelRatio`：全局设像素比，Retina 屏默认按 devicePixelRatio 放大，设 `1` 换性能。
- **Layer/Group 操作**：
  - `stage.add(layer)`、`layer.add(...nodes)` 可一次加多个。
  - `node.moveTo(container)`：跨 Stage/Layer/Group 转移节点。
  - `node.zIndex()`、`moveToTop()`/`moveToBottom()`/`moveUp()`/`moveDown()`：控制同容器内绘制层级（先绘制的在下层）。
- **内置形状（共 19 种）**：Rect、Circle、Ellipse、Line（含 Blob/Polygon/Simple Line/Spline 变体）、Text、TextPath、Image、Sprite、Path（SVG path data）、RegularPolygon、Star、Ring、Arc、Wedge、Arrow、Label、Group。
- **通用属性**：`x/y`、`width/height`、`fill/stroke/strokeWidth`、`rotation`、`scaleX/scaleY`、`offsetX/offsetY`、`opacity`、`draggable`、`visible/listening`、`name/id`。
- **Text 扩展属性**：`fontSize/fontFamily/fontStyle/align/wrap/ellipsis/lineHeight/padding` + 通用 `shadowColor/shadowBlur/shadowOffsetX·Y/shadowOpacity`。
- **样式补充**：Fill 支持纯色/图案（`fillPatternImage`）/线性渐变（`fillLinearGradientColorStops`）/径向渐变（`fillRadialGradientColorStops`）；`lineJoin` 控制折线连接处样式；`globalCompositeOperation` 做混合模式（也用于橡皮擦）。
- **自定义 Shape**：`new Konva.Shape({ sceneFunc(context, shape) {...} })`，样式必须用 `context.fillStrokeShape(shape)` 委托，不要手动调 `fill()`/`stroke()`。
- **sceneFunc 五条最佳实践**：够快、无副作用、复杂命中检测另定义 `hitFunc`、位置变换交给 Konva、样式统一走 `fillStrokeShape`。
- **选择器**：`layer.findOne('#id')`（返回单个）、`layer.find('.name')`（返回数组）、`layer.find('TypeName')`（按类型，如 `find('Circle')`）。
- **节点操作**：`node.clone(overrideAttrs)` 克隆并覆盖属性、`node.destroy()` 销毁并从父容器移除、`node.getAttrs()` 读全部配置、`node.setAttrs({...})` 批量设置。
- **进阶顺序**：本页承接[入门](../getting-started)，下一步是[事件、拖拽与 Transformer](./events-drag-transform)。

## 一、架构总览：Stage → Layer → Group → Shape

Konva 的场景树是一棵四层节点树，可以直接类比 DOM：

```
Stage（舞台，对应一个 DOM 容器，可含多个 Layer）
 └─ Layer（图层，每个 Layer = 一个独立 <canvas> 元素，含"可见 canvas + 隐藏 hit canvas"两张画布）
     └─ Group（分组容器，本身不渲染，只用于批量管理/变换子节点）
         └─ Shape（具体图形：Rect/Circle/Text/Image/自定义…）
```

**为什么要多 Layer**：把"很少变化的背景"和"频繁移动的元素"分到不同 Layer，更新时只需重绘变化的 Layer，不必重绘整个场景——这是 Konva 性能优化的第一原则，但代价是每个 Layer 都是一个真实 DOM canvas，Layer 数量本身也是开销，需要权衡（详见[性能优化](./serialization-react-performance)）。

官方设计理念是把 Canvas 命令式绘制（"画完就忘"）升级为保留模式（retained mode）的节点树：节点可持续被查询、变换、监听事件、二次修改，而不必重新绘制整个画面。

## 二、Stage：挂载容器与坐标转换

```javascript
import Konva from "konva";

const stage = new Konva.Stage({
  container: "container", // DOM 元素 id 或 element 引用
  width: 500,
  height: 500,
});

const layer = new Konva.Layer();
stage.add(layer);

const circle = new Konva.Circle({
  x: 250,
  y: 250,
  radius: 70,
  fill: "red",
  stroke: "black",
  strokeWidth: 4,
});
layer.add(circle);
// layer.draw() 是隐式的：add 后 Konva 会在下一帧自动重绘，
// 但手动多次修改属性时建议用 layer.batchDraw() 合批
```

- `Stage` 可以包含多个 `Layer`，但 **Node.js 环境下创建 Stage 不需要 `container`**（无 DOM，完整写法见[参考页](../reference)）。
- **坐标转换**：`stage.getPointerPosition()` 返回鼠标/触摸相对 Stage 的坐标（已做好 DPR/缩放换算），是获取"用户点了画布上哪个坐标"的标准方法，比自己算 `event.clientX - canvas.getBoundingClientRect().left` 更可靠。
- `Konva.pixelRatio` 可全局设置像素比（Retina 屏默认按设备像素比放大画布，设置为 `1` 可换性能）。

## 三、Layer 与 Group

- **Layer**：`stage.add(layer)`；每个 Layer 是独立 canvas，适合按"更新频率"或"渲染层次"切分场景（如背景层/内容层/UI 覆盖层）。
- **Group**：`new Konva.Group()`，本身不渲染任何像素，只是容器，可以对整组节点统一 `draggable`、统一变换（旋转/缩放整组）、统一 `visible`/`opacity`。
- **跨容器移动节点**：`node.moveTo(newContainer)`，容器可以是另一个 Stage、Layer 或 Group，用于重组场景结构。
- **层级顺序（zIndex）**：`node.zIndex()`、`node.moveToTop()`/`moveToBottom()`/`moveUp()`/`moveDown()` 控制同容器内的绘制顺序（先绘制的在下层）。

```javascript
const group = new Konva.Group({ draggable: true });
group.add(rect1, rect2); // 可一次性 add 多个节点
layer.add(group);

rect1.moveToTop(); // 只在其父容器内调整层级
shape.moveTo(anotherLayer); // 换容器
```

## 四、Shape：内置形状与通用属性

内置形状（官方 Shapes 分类，共 19 种）：`Rect`（矩形，支持 `cornerRadius` 数字或 `[左上,右上,右下,左下]` 数组）、`Circle`、`Ellipse`、`Line`（含 Blob/Polygon/Simple Line/Spline 变体）、`Text`、`TextPath`、`Image`、`Sprite`、`Path`（SVG path data）、`RegularPolygon`、`Star`、`Ring`、`Arc`、`Wedge`、`Arrow`、`Label`（带背景的文本标签）、`Group`。

通用属性（几乎所有 Shape 都支持）：

```javascript
{
  x, y,                      // 位置
  width, height,             // 尺寸（部分形状用 radius 等专属属性代替）
  fill, stroke, strokeWidth, // 填充/描边
  rotation,                  // 旋转角度（度数）
  scaleX, scaleY,            // 缩放
  offsetX, offsetY,          // 变换原点偏移（见下方"易错点"）
  opacity,                   // 透明度
  draggable,                 // 是否可拖拽
  visible, listening,        // 显隐 / 是否参与事件与命中检测
  name, id,                  // 供选择器查找
}
```

Text 常用扩展属性：`fontSize`/`fontFamily`/`fontStyle`/`align`（left/center/right）/`wrap`/`ellipsis`/`lineHeight`/`padding`，以及通用的 `shadowColor`/`shadowBlur`/`shadowOffsetX/Y`/`shadowOpacity`。

**样式补充**（Styling）：

- **Fill**：纯色（`fill: 'red'`）、图案（`fillPatternImage`）、线性渐变（`fillLinearGradientColorStops`）、径向渐变（`fillRadialGradientColorStops`）。
- **Stroke**：`stroke`/`strokeWidth`，`lineJoin`（miter/round/bevel）控制折线连接处样式。
- **Shadow**：`shadowColor`/`shadowBlur`/`shadowOffset`/`shadowOpacity`。
- **Blend Mode**：`globalCompositeOperation`，也用于自由绘画的橡皮擦实现。
- **Cursor Style**：常在 `mouseover`/`mouseout` 事件里配合 `stage.container().style.cursor = 'pointer'` 切换鼠标样式（事件写法见[下一页](./events-drag-transform)）。

**易错点：Offset 影响的是旋转/缩放原点，不是位置**——改 `offsetX/offsetY` 之后节点视觉位置也会跟着变（因为绘制起点变了），常见误解是"offset 只影响旋转中心、不影响显示位置"，实际二者是耦合的，调完 offset 往往需要连带调整 `x`/`y`；不改 offset 时矩形类默认从左上角旋转、圆形类从中心旋转。

## 五、自定义 Shape：sceneFunc

内置形状不够用时，用 `Konva.Shape` + 自定义绘制函数：

```javascript
const triangle = new Konva.Shape({
  fill: "#00D2FF",
  stroke: "black",
  strokeWidth: 4,
  sceneFunc(context, shape) {
    context.beginPath();
    context.moveTo(0, 50);
    context.lineTo(100, 50);
    context.lineTo(50, 0);
    context.closePath();
    // 关键：用 fillStrokeShape 代替手动 fill()/stroke()，
    // 这样 shape 的 fill/stroke/shadow 等属性会自动生效
    context.fillStrokeShape(shape);
  },
});
```

官方五条最佳实践：① `sceneFunc` 每秒可能被调用很多次，逻辑要够快；② 避免在其中产生副作用（修改外部状态）；③ 命中检测复杂形状时应定义独立 `hitFunc`；④ 不要手动处理位置变换，交给 Konva 内部处理；⑤ 样式统一通过 `fillStrokeShape(shape)` 委托，不要自己调 `context.fill()`/`context.stroke()`——手动调用原生 Canvas API 会绕过 Konva 的属性系统，导致后续改 `fill` 属性不生效。

## 六、节点操作与选择器

```javascript
layer.findOne("#myRect"); // 按 id（# 前缀），返回单个节点
layer.find(".myCircle"); // 按 name（. 前缀），返回节点数组，可批量操作
layer.find("Circle"); // 按类型名（无前缀），返回该类型所有节点
node.clone({ x: 100 }); // 克隆节点并覆盖部分属性
node.destroy(); // 销毁节点（从父容器移除并释放）
node.getAttrs(); // 读取全部配置属性
node.setAttrs({ x: 10, y: 20 }); // 批量设置属性
```

`find`/`findOne` 常用于"点击后要统一操作一批同类节点"的场景（如批量做动画）。需要注意：`node.destroy()` 前如果该节点还绑定在某个 `Transformer.nodes()` 里，需要先清空绑定，否则 Transformer 可能引用到已销毁的节点导致报错——这条坑在下一页讲到 Transformer 时会再次提到。

架构、内置形状与节点操作是静态骨架，接下来该让场景"动起来、能交互"：[事件系统、拖拽与 Transformer 变换器](./events-drag-transform)。
