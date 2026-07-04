---
layout: doc
outline: [2, 3]
---

# 动画与交互：rAF / 清屏 / 时间驱动 / 拾取

> 基于 Canvas 2D API（2026 浏览器基线）· 核于 2026-07

## 速查

- **每帧四步（MDN 原文）**：① 清空 canvas（clearRect）→ ② save 状态 → ③ 绘制 → ④ restore。
- **rAF 优先**：与显示器刷新同步（通常 60fps）、后台标签页自动暂停省电；回调收到**高精度时间戳**。
- **setInterval/setTimeout 的问题**：不与渲染对齐，可能掉帧/空转——动画驱动一律 rAF。
- **rAF 断链坑**：回调内忘了再 `requestAnimationFrame(frame)` → 动画只走一帧；固定模板「清屏 → 画 → 尾部 rAF(next)」。
- **忘清屏 = 拖影满屏**：每帧开头 `clearRect` 整屏（或脏矩形，见[性能页](./performance)）。
- **循环内变换/样式**：每轮 `save()` → 变换 → 画 → `restore()`，防累积偏移（见[变换与状态](./transforms-and-state)）。
- **基于时间的动画（必考）**：
  - 初始化 `let last = performance.now()`；每帧用 rAF 时间戳算 `dt = (now - last) / 1000`（毫秒 → 秒）；
  - 速度按「像素/秒」定义：`x += 120 * dt`，与帧率无关；
  - 基于帧数递增（`x += 2`）在 120Hz 高刷屏上**速度翻倍**——必须用 delta time。
- **清屏三法**：
  - `clearRect(0, 0, w, h)` —— 常规最优：只清像素、保留状态；
  - 重设 `canvas.width`（即使同值）—— 清像素 + **重置全部状态** + 重分配缓冲，慢且副作用大；
  - `ctx.reset()`（2023-12 Baseline）—— 标准化「回到全新上下文」：清位图 + 状态栈 + 路径 + 样式 + 变换 + 裁剪全重置。
- **重置类清屏后重跑初始化**：重设 width / `ctx.reset()` 连 dpr 的 `scale` 一起清掉，记得重跑三步法。
- **带变换清屏清不净**：translate 后 `clearRect(0,0,w,h)` 清的是**变换后的矩形**，残影。标准姿势：`save()` → `setTransform(1,0,0,1,0,0)` → `clearRect` → `restore()`；或 `ctx.reset()`。
- **蚂蚁线**：`setLineDash([4, 2])` + 递增 `lineDashOffset`。
- **时钟**：translate 到中心 + rotate 逐针；秒针平滑用 `getSeconds() + getMilliseconds() / 1000`。
- **太阳系**：`globalCompositeOperation = "destination-over"` 先画前景、后垫背景。
- **交互全靠自建**（立即模式推论）：canvas 内部图形没有 DOM 事件，事件只落在 `<canvas>` 元素上——点击命中、拖拽都要自己建模。
- **拾取三条路**：
  1. **isPointInPath**：配 Path2D 最顺；四种重载 `(x,y)` / `(x,y,fillRule)` / `(path,x,y)` / `(path,x,y,fillRule)`；**传入坐标是未经变换的画布坐标**（不受当前 transform 影响）。
  2. **数学命中**：圆 = 距离比半径；矩形 = 区间判断；自绘场景图 = 对象数组 + **倒序遍历**命中最上层。
  3. **hit-canvas 颜色拾取**：每个对象以唯一纯色画到同尺寸隐藏 canvas，点击时 `getImageData(x, y, 1, 1)` 查「颜色 → 对象」映射（Konva 内部方案，任意形状 O(1)）。
- **isPointInStroke**：测**描边**命中（与 isPointInPath 同族）。
- **Path2D 复用**：同一个 Path2D 既给 `fill`/`stroke` 绘制、又给 `isPointInPath` 拾取——一份图形定义两处使用。
- **事件坐标换算（必做）**：事件给的是 CSS 像素；缓冲尺寸 ≠ CSS 尺寸（dpr 适配后必现）时须换算，否则命中区错位一倍：
  - `x = (event.clientX - rect.left) * (canvas.width / rect.width)`；
  - `y = (event.clientY - rect.top) * (canvas.height / rect.height)`。
- **动画性能红线**：循环里规避 `shadowBlur`、大量 `fillText`、每帧 `getImageData`（对策见[性能优化](./performance)）。

## 一、动画范式：rAF 每帧四步

立即模式下「动」= 不断重画。MDN 给出的每帧四步：**① 清空 canvas → ② save 状态 → ③ 绘制 → ④ restore**。驱动用 `requestAnimationFrame`：与显示器刷新同步（通常 60fps）、后台标签页自动暂停（省电），优于 `setInterval`/`setTimeout`（不与渲染对齐，可能掉帧或空转）。

```js
let last = performance.now();
let x = 0;
function frame(now) {             // rAF 回调收到高精度时间戳
  const dt = (now - last) / 1000; // 秒
  last = now;
  x += 120 * dt;                  // 【基于时间】：120px/秒，与帧率无关
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillRect(x, 20, 40, 40);
  requestAnimationFrame(frame);   // 忘了这句动画只走一帧
}
requestAnimationFrame(frame);
```

两个模板级细节：

- **尾部续链**：回调内没再 `requestAnimationFrame` → 动画只走一帧；忘 `clearRect` → 拖影满屏。固定模板「清屏 → 画 → 尾部 rAF(next)」。
- **循环内有变换/样式**：套上一页的「save → 变换 → 画 → restore」，防累积。

## 二、基于时间的动画（帧率无关）

上面代码里 `x += 120 * dt` 是关键：**速度按「像素/秒」定义，用 delta time 推进**。如果写成基于帧数的 `x += 2`，在 60Hz 屏上是 120px/s，在 120Hz 高刷屏上就变成 240px/s——**速度翻倍**。rAF 的回调频率跟随显示器刷新率，不是常量，所以必须用时间差驱动。

经典应用：时钟的秒针平滑摆动——不是每秒跳一格，而是用 `getSeconds() + getMilliseconds() / 1000` 得到连续秒数再转角度（MDN 时钟例：translate 到中心 + rotate 逐针）。

## 三、清屏策略三法

| 方法 | 清什么 | 保留什么 | 适用 |
| --- | --- | --- | --- |
| `clearRect(0, 0, w, h)` | 像素（清成透明黑） | 全部状态（变换/样式/裁剪） | **常规每帧清屏最优** |
| 重设 `canvas.width`（即使同值） | 像素 + 全部状态 | 无（缓冲也重新分配） | 基本别用：慢、dpr 适配失效 |
| `ctx.reset()`（2023-12 Baseline） | 像素 + 状态栈 + 路径 + 样式 + 变换 + 裁剪 | 无 | 标准化「回到全新上下文」 |

**带变换时 clearRect 清不净**是高频坑：translate 之后 `clearRect(0, 0, w, h)` 清的是**变换后坐标系里的矩形**，画布上留残影。标准姿势：

```js
ctx.save();
ctx.setTransform(1, 0, 0, 1, 0, 0); // 回单位矩阵
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.restore();
```

或者直接 `ctx.reset()`（连状态一起归零，注意 dpr 的 scale 也要重设）。

顺带两个 MDN 教程的合成小套路：太阳系例用 `globalCompositeOperation = "destination-over"` **先画前景、后垫背景**；蚂蚁线动画靠递增 `lineDashOffset`（见[绘图基础](./drawing-basics)）。

## 四、交互拾取：canvas 里没有「点击图形」

canvas 内部图形没有 DOM 事件——事件只落在 `<canvas>` 元素本身上。「点到了哪个图形」要自己算，三条路：

### 1. isPointInPath / isPointInStroke（配 Path2D 最顺）

```js
const circle = new Path2D();
circle.arc(150, 75, 50, 0, 2 * Math.PI);
canvas.addEventListener("mousemove", (event) => {
  const hit = ctx.isPointInPath(circle, event.offsetX, event.offsetY);
  // 四种重载：isPointInPath(x, y) / (x, y, fillRule) / (path, x, y) / (path, x, y, fillRule)
  // 传入坐标是【未经变换的画布坐标】（不受当前 transform 影响）
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = hit ? "green" : "red";
  ctx.fill(circle);
});
```

`isPointInStroke` 同理，测的是**描边**命中（细线可点区域小，常配加宽的隐形路径）。

### 2. 数学命中检测

圆 = 「点到圆心距离 ≤ 半径」；矩形 = 区间判断。编辑器类应用自建场景图：对象数组按绘制顺序存放，命中时**倒序遍历**（后画的在上层，先命中）。这正是立即模式的本质推论——Excalidraw 类编辑器都是「自建场景模型 + 全量/增量重绘」。

### 3. hit-canvas 颜色拾取

每个对象以**唯一纯色**画到一张同尺寸的隐藏 canvas 上；点击时 `getImageData(x, y, 1, 1)` 读那一点的颜色，查「颜色 → 对象」映射表。任意复杂形状都是 O(1) 命中（Konva 内部就是这个方案）。

### 坐标换算：dpr 适配后的必修课

事件给的是 **CSS 像素**坐标；一旦缓冲尺寸 ≠ CSS 尺寸（dpr 适配后必然如此），直接把 `event.offsetX` 喂给绘制/拾取会**错位一倍**。换算公式：

```js
const rect = canvas.getBoundingClientRect();
const x = (event.clientX - rect.left) * (canvas.width / rect.width);
const y = (event.clientY - rect.top) * (canvas.height / rect.height);
```

（或者统一在 CSS 坐标系里画 + 测，让 `ctx.scale(dpr, dpr)` 消化差异。）

动画每帧都在烧 CPU/GPU——下一页[性能优化](./performance)讲怎么让重绘便宜下来：离屏预渲染、分层、脏矩形，以及把渲染整个搬进 Worker 的 OffscreenCanvas。
