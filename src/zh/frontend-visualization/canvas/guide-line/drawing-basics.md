---
layout: doc
outline: [2, 3]
---

# 绘图基础：路径 / 样式 / 渐变图案 / 文本

> 基于 Canvas 2D API（2026 浏览器基线）· 核于 2026-07

## 速查

- **路径四步**：`beginPath()` → 画图命令（moveTo/lineTo/arc…）→ `closePath()`（可选）→ `stroke()`/`fill()`。
- **moveTo/lineTo**：`moveTo` 提笔移动**不画线**，`lineTo` 画直线段；新子路径以 moveTo 开头。
- **beginPath 必调**：它清空子路径列表开新路径；不调则旧路径越积越多，再次 stroke/fill 会把历史路径带新样式重画一遍。
- **fill vs stroke 闭合语义**：`fill()` 对未闭合子路径**自动闭合**；`stroke()` **不闭合**——三角形少一条边、接缝处 lineJoin 不生效，需显式 `closePath()`。
- **两族矩形 API**：`fillRect`/`strokeRect`/`clearRect` **立即绘制不进路径**；`rect()`/`roundRect()` 只把矩形**加入路径**。
- **roundRect（2023-04 Baseline）**：`roundRect(x, y, w, h, radii)`，radii 数字或 1/2/3/4 元数组，分配语义同 CSS border-radius 顺时针；空数组/负半径抛 `RangeError`，负 w/h 翻转。
- **圆弧**：`arc(x, y, r, start, end, anticlockwise=false)`（角差 ≥ 2π 即整圆）；`arcTo(x1, y1, x2, y2, r)` 切线圆角；`ellipse(x, y, rx, ry, rotation, start, end, ccw?)`。
- **贝塞尔**：`quadraticCurveTo(cpx, cpy, x, y)` 1 控制点；`bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)` 2 控制点。
- **填充规则**：`fill("nonzero")` 默认非零环绕；`fill("evenodd")` 奇偶——同心双圆 + evenodd = 圆环挖洞。
- **Path2D**：可保存/复用/组合的路径对象；构造器直接吃 **SVG path 字符串**；`addPath()` 合并；`fill`/`stroke`/`clip`/`isPointInPath` 都接受它。
- **样式即状态**：`fillStyle`/`strokeStyle` 接受 CSS 颜色 | CanvasGradient | CanvasPattern，默认 `#000`，**设置后持续生效**。
- **样式残留坑**：上一段设的 fillStyle/globalAlpha/gCO 会影响下一段——模块化绘制函数自带 save/restore，或开头显式重设。
- **globalAlpha**（默认 1.0）：影响之后一切绘制；单图形透明用 rgba 颜色更细粒度。
- **线型**：`lineWidth` 默认 1.0（以路径为**中心**两侧各展一半）；`lineCap` 默认 `butt`；`lineJoin` 默认 `miter`；`miterLimit` 默认 10（尖角超限退化 bevel）。
- **1px 线发糊**：整数坐标 + 奇数线宽 → 线体跨两列像素各染一半；坐标偏移 0.5（如 `moveTo(3.5, 1)`）或用偶数线宽。
- **虚线**：`setLineDash([实, 空])` + 递增 `lineDashOffset` = 蚂蚁线动画。
- **渐变三种**（先建对象 → `addColorStop(0~1, color)` → 赋给 fillStyle/strokeStyle）：
  - `createLinearGradient(x0, y0, x1, y1)` 起点→终点；
  - `createRadialGradient(x0, y0, r0, x1, y1, r1)` 圆 1→圆 2；
  - `createConicGradient(startAngle, x, y)` 锥形（2023-04 Baseline）。
  - 渐变坐标是**画布全局坐标**，不随形状走。
- **图案**：`createPattern(image, "repeat" | "repeat-x" | "repeat-y" | "no-repeat")`，image 可为 img/另一 canvas/video，必须等加载完成。
- **阴影**：`shadowOffsetX/Y`、`shadowBlur`（非像素单位）、`shadowColor` **默认全透明黑——不设颜色永远看不见影子**；shadowBlur 渲染昂贵，动画慎用。
- **阴影不随变换走**：`shadowOffsetX/Y` 不受 transform 影响。
- **filter 非 Baseline**：`ctx.filter = "blur(4px)"`（CSS filter 同语法，含 `url(#svgFilter)` 引 SVG 滤镜）**Safari 稳定版至今不支持**，生产需特性检测/替代。
- **filter 语义**：默认 `"none"`，只影响**之后**的绘制。
- **文本**：`font` 默认 `"10px sans-serif"`；`textAlign` 默认 `start`（受 `direction` 影响）；`textBaseline` 默认 `alphabetic`，垂直居中用 `middle`；`fillText(text, x, y, maxWidth?)` 超宽整体压缩。
- **measureText**：返回 TextMetrics；`width` 是布局宽，真实墨迹高度用 `actualBoundingBoxAscent + actualBoundingBoxDescent`。
- **TextMetrics 两族**：`actualBoundingBox*` 测**墨迹**框，`fontBoundingBox*` 测**字体**框。
- **strokeText**：描边文本，与 `fillText` 同参（含可选 maxWidth）；新扩展 `letterSpacing`/`wordSpacing` 约 2024-09 起三家补齐（Newly）。
- **文本无障碍**：canvas 文本不进无障碍树、放大即糊；正文/可交互文本用 HTML/SVG，canvas 文本只用于图形标注。

## 一、路径系统

矩形三件套之外的一切图形都靠路径。标准四步：

```js
ctx.beginPath();            // 清空子路径列表，开新路径（不调则旧路径越积越多）
ctx.moveTo(75, 50);         // 提笔移动（不画）
ctx.lineTo(100, 75);        // 画直线段
ctx.lineTo(100, 25);
ctx.closePath();            // 画一条回到子路径起点的直线闭合（可选）
ctx.stroke();               // 描边；不会自动闭合
// ctx.fill();              // 填充；未闭合的子路径会被【自动闭合】
```

两个高频坑都在这段代码里：

1. **忘 `beginPath()`**：旧子路径残留，再次 stroke/fill 会把历史路径重画一遍（还带着新样式）。规矩：每个独立图形前 `beginPath()`。
2. **对 `stroke()` 期待自动闭合**：`fill()` 会自动闭合未闭合子路径，`stroke()` 不会——三角形会少一条边，且起终点接缝处 lineJoin 不生效。需要闭合时显式 `closePath()`。

### 矩形与圆角矩形

- **立即绘制（不入路径）**：`fillRect(x, y, w, h)` / `strokeRect` / `clearRect`（清成透明黑）。
- **入路径版**：`rect(x, y, w, h)`；**`roundRect(x, y, w, h, radii)`**（2023-04 起 Baseline，老 MDN 中文教程页「不存在原生 roundRect」的说法已过时）。radii 可为数字或数组，分配语义完全对齐 CSS border-radius 顺时针：`[全部]` / `[左上+右下, 右上+左下]` / `[左上, 右上+左下, 右下]` / `[左上, 右上, 右下, 左下]`；空数组或负半径抛 `RangeError`；负 w/h 分别水平/垂直翻转。

### 圆弧与贝塞尔

```js
// 圆弧：角差 ≥ 2π 即整圆；第六参 anticlockwise 默认 false（顺时针）
ctx.arc(x, y, r, startAngle, endAngle, anticlockwise);
// 切线圆角（常用于圆角折线）
ctx.arcTo(x1, y1, x2, y2, r);
// 椭圆弧：多了半径对 rx/ry 与旋转角
ctx.ellipse(x, y, rx, ry, rotation, start, end, ccw);
// 二次贝塞尔：1 个控制点
ctx.quadraticCurveTo(cpx, cpy, x, y);
// 三次贝塞尔：2 个控制点
ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
```

再强调一次：**Canvas 的角度全部用弧度**，`弧度 = (Math.PI / 180) × 角度`。

### 填充规则：nonzero vs evenodd

`fill(fillRule)` 接受 `"nonzero"`（默认，非零环绕）和 `"evenodd"`（奇偶）。经典用法——同心双圆 + evenodd 挖出圆环：

```js
ctx.beginPath();
ctx.arc(50, 50, 30, 0, Math.PI * 2, true);
ctx.arc(50, 50, 15, 0, Math.PI * 2, true);
ctx.fill("evenodd"); // 内圆挖空
```

### Path2D：可复用的路径对象

路径也可以是对象——保存、复用、组合，`fill`/`stroke`/`clip`/`isPointInPath` 都接受它：

```js
const rectangle = new Path2D();
rectangle.rect(10, 10, 50, 50);

const circle = new Path2D();
circle.arc(100, 35, 25, 0, 2 * Math.PI);

const svgPath = new Path2D("M10 10 h 80 v 80 h -80 Z"); // 直接吃 SVG path 语法

ctx.stroke(rectangle);
ctx.fill(circle);
// path.addPath(other, transform?) 合并路径
```

Path2D 配合 `isPointInPath` 做命中检测最顺手（见[动画页](./animation)的拾取一节）。

## 二、样式：颜色与线型

- `fillStyle` / `strokeStyle`：CSS 颜色字符串 | CanvasGradient | CanvasPattern，默认 `#000`；**一经设置对后续所有绘制持续生效**（状态机——模块化绘制函数应自带 save/restore 或开头显式重设，防止样式残留）。
- `globalAlpha`（默认 1.0）：全局透明度，影响之后一切绘制；单个图形要透明，用 rgba 颜色更细粒度。
- 线型四件：

| 属性 | 默认 | 说明 |
| --- | --- | --- |
| `lineWidth` | 1.0 | 以路径为**中心**向两侧各展一半 |
| `lineCap` | `butt` | 端点样式：`butt` / `round` / `square` |
| `lineJoin` | `miter` | 拐角样式：`miter` / `round` / `bevel` |
| `miterLimit` | 10.0 | 尖角超限退化为 bevel |

**1px 线发糊**是「线宽以路径为中心」的直接推论：整数坐标 + 奇数线宽 → 线体跨两列像素各染一半，发虚。修正：坐标偏移 0.5（如 `moveTo(3.5, 1)`），或改用偶数线宽。

### 虚线与蚂蚁线

`setLineDash([实, 空])` 设虚线模式，配合递增的 `lineDashOffset` 得到「蚂蚁线」动画（选区框经典效果）：

```js
let offset = 0;
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setLineDash([4, 2]);      // 4px 实线 + 2px 空白
  ctx.lineDashOffset = -offset; // 偏移递增产生爬行感
  ctx.strokeRect(10, 10, 100, 100);
}
function march() {
  offset = (offset + 1) % 6;    // 6 = 4 + 2，一个虚线周期
  draw();
  setTimeout(march, 20);
}
march();
```

## 三、渐变与图案

渐变的套路固定：**先建对象 → `addColorStop(0~1, color)` → 赋给 fillStyle/strokeStyle**。注意渐变坐标是**画布全局坐标**，不随形状走——形状不在渐变区间内就取端点色。

```js
// 线性：起点 → 终点
const lin = ctx.createLinearGradient(0, 0, 0, 150);
lin.addColorStop(0, "#00ABEB");
lin.addColorStop(1, "#fff");

// 径向：圆 1 (x, y, r) → 圆 2
const rad = ctx.createRadialGradient(45, 45, 10, 52, 50, 30);

// 锥形（2023-04 Baseline）：起始角（弧度，从右侧水平线顺时针）+ 中心
const conic = ctx.createConicGradient(0, 100, 100);
ctx.fillStyle = conic;
ctx.fillRect(20, 20, 200, 200);
```

图案：`createPattern(image, repetition)`，repetition 为 `"repeat"` / `"repeat-x"` / `"repeat-y"` / `"no-repeat"`；image 可为 img 元素、另一个 canvas 或 video，**必须等图加载完成**再创建。

## 四、阴影与 filter

- 阴影四件：`shadowOffsetX/Y`（默认 0，**不受变换影响**）、`shadowBlur`（默认 0，非像素单位）、`shadowColor`——**默认全透明黑，不设颜色就永远看不见影子**（高频坑）。`shadowBlur` 渲染昂贵，动画中慎用（替代方案见[性能页](./performance)）。
- `ctx.filter = "blur(4px) contrast(1.4)"`：CSS filter 同语法（含 `url(#svgFilter)`），默认 `"none"`，只影响**之后**的绘制。**注意：至今非 Baseline，Safari 稳定版不支持**——生产使用需特性检测 + 降级（SVG 滤镜预处理、手写像素滤镜）。

## 五、文本

```js
ctx.font = "48px serif";        // CSS font 语法，默认 "10px sans-serif"
ctx.textAlign = "center";       // start(默认)|end|left|right|center（相对锚点 x）
ctx.textBaseline = "middle";    // alphabetic(默认)|top|hanging|middle|ideographic|bottom
ctx.direction = "ltr";          // ltr|rtl|inherit(默认)；影响 start/end 语义
ctx.fillText("你好世界", 75, 75); // 第四参可选 maxWidth：超宽整体压缩
ctx.strokeText("你好世界", 75, 75);

const m = ctx.measureText("foo");                        // TextMetrics
m.width;                                                 // 布局宽度
m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;  // 实际墨迹高度（测真实高度用这对）
```

- `textAlign` 是相对锚点 x 的对齐，`start`/`end` 的语义受 `direction` 影响；垂直居中用 `textBaseline = "middle"`。
- TextMetrics 进阶：`width` 只是布局宽；测**墨迹**高度用 `actualBoundingBoxAscent/Descent`，测**字体框**用 `fontBoundingBox*` 系列。
- `letterSpacing`/`wordSpacing`/`fontKerning`/`fontStretch`/`textRendering` 为较新扩展（约 2024-09 起三家补齐，Newly）。
- **无障碍红线**：canvas 文本不进无障碍树、放大即糊。正文/可交互文本 MDN 明确建议用 HTML/SVG；canvas 文本只用于图形标注，并提供 fallback/aria。

路径、样式、文本是「画什么」；下一页[图像与像素](./images-and-pixels)进入「把现成图像画上来、再逐像素处理」的管线。
