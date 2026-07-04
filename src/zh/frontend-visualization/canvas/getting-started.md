---
layout: doc
outline: [2, 3]
---

# 入门：定位、getContext 与高清屏适配

> 基于 Canvas 2D API（2026 浏览器基线）· 核于 2026-07

## 速查

- **定位**：Canvas 2D = **立即模式位图绘图 API**——JS 逐条命令把像素画进位图缓冲，**画完即忘、不保留对象**；改一处 = 自己清屏重画一帧。
- **立即 vs 保留**：SVG/DOM 是**保留模式**（浏览器持有对象树，改属性自动重渲染、天然有事件）；Canvas 内部图形**没有 DOM 事件**，点击命中、拖拽全要自建模型。
- **选型口径**：节点少、交互富、要无障碍 → SVG；上万点散点图 / 实时 K 线 → Canvas 2D（SVG 的 DOM 数量先崩）；十万级以上或 3D → WebGL。
- **混合策略**：底层海量数据 canvas/WebGL + 顶层少量交互控件 SVG/HTML 叠加（ECharts 默认 canvas 可选 svg；D3 大数据量官方建议切 canvas）。
- **立即模式推论**：canvas 无法「选中已画图形」——Excalidraw 类编辑器全是**自建场景模型 + 全量/增量重绘**。
- **元素基础**：
  - `</canvas>` **结束标签必需**；标签内是不支持时的替代内容（也是无障碍出口）。
  - 不写 `width`/`height` 属性时默认 **300×150**。
  - **属性宽高 = 位图缓冲尺寸；CSS 宽高 = 显示拉伸**——两者比例不一致 → 图像失真/模糊。
- **getContext**：
  - `canvas.getContext("2d")` 取 2D 上下文；`if (canvas.getContext)` 做支持性检测。
  - contextType 可选：`"2d"` / `"webgl"` / `"webgl2"` / `"webgpu"` / `"bitmaprenderer"`。
  - 同一 canvas 同类型二次调用返回**同一实例**；已设为其他模式则返回 **null**；已 `transferControlToOffscreen()` 再调 getContext 抛 `InvalidStateError`。
- **2d 上下文选项**（getContext 第二参数）：
  - `alpha`（默认 true）：设 false 声明背景不透明，可加速绘制。
  - `willReadFrequently`（默认 false）：声明频繁回读像素 → 强制软件渲染，省去 GPU→CPU 回读（2024-09 起 Newly Baseline）。
  - `desynchronized`：解耦绘制与事件循环降输入延迟，**Blink（Chrome/Edge）专属提示**。
  - `colorSpace`：`"srgb"`（默认）/ `"display-p3"` 广色域（约 2023 起三大浏览器可用）。
- **模糊原理**：缓冲尺寸 = CSS 尺寸时，1 个画布像素被拉伸到 **dpr² 个物理像素** → 必糊。
- **高清屏三步法**（`devicePixelRatio` = 物理像素 / CSS 像素，Retina 常为 2）：
  1. CSS 设显示尺寸（逻辑像素）：`canvas.style.width = "200px"`。
  2. 位图缓冲 = 逻辑尺寸 × dpr：`canvas.width = Math.floor(200 * dpr)`。
  3. 坐标系放大：`ctx.scale(dpr, dpr)`，之后照旧用 CSS 像素坐标绘制。
- **监听 dpr 变化**（拖到别的屏 / 浏览器缩放）：`matchMedia("(resolution: ...dppx)")` 的 `change` 事件里重跑三步法。
- **事件坐标换算**：dpr 适配后缓冲 ≠ CSS 尺寸，`event.offsetX` 须乘 `canvas.width / rect.width` 再用于绘制/拾取。
- **重设 width 的副作用**：给 `canvas.width` 赋值（**即使同值**）= 清空位图 + **重置全部上下文状态**（变换/样式全丢）。
- **坐标与角度**：原点在**左上角**，x 向右、y 向下；角度一律**弧度**——`rad = deg * Math.PI / 180`。
- **第一个绘制**：`fillRect`/`strokeRect`/`clearRect` 三兄弟**直接绘制、不进路径**；`fillStyle` 接受 CSS 颜色/渐变/图案，默认黑，**一经设置持续生效**（状态机）。
- **clearRect 语义**：把矩形区域清成**透明黑**。
- **进阶顺序**：本页 → [绘图基础](./guide-line/drawing-basics) → [图像与像素](./guide-line/images-and-pixels) → [变换与状态](./guide-line/transforms-and-state) → [动画](./guide-line/animation) → [性能优化](./guide-line/performance)。

## 一、定位：立即模式 vs 保留模式

Canvas 与 SVG 的本质分野在**渲染模型**：

- **Canvas = 立即模式**：调用 `fillRect` 后只剩下像素，浏览器不记得「这里有个矩形」。想让一个圆动起来，只能**清屏 → 以新坐标重画**；想知道「点击落在哪个图形上」，只能自己维护对象数组做命中检测。
- **SVG/DOM = 保留模式**：浏览器持有完整对象树，改属性即自动重渲染，每个图形天然可绑事件、可被 CSS 控制、可被无障碍工具读取。

这条差异衍生出选型口径（面试高频）：**节点少、交互富、要无障碍 → SVG；上万点的散点图、实时刷新的 K 线 → Canvas 2D**（SVG 的 DOM 数量先崩）；**十万级以上图元或 3D → WebGL**。业界佐证：ECharts 默认 canvas 渲染、可选 svg；D3 默认操 DOM/SVG、大数据量官方建议切 canvas。混合策略也很常见：底层海量数据走 canvas/WebGL，顶层少量交互控件用 SVG/HTML 叠加。完整对比表见[参考页](./reference)。

## 二、canvas 元素：宽高属性与替代内容

```html
<!-- 结束标签必需；标签内是不支持时的替代内容（也是无障碍出口） -->
<canvas id="tutorial" width="150" height="150">
  <img src="images/clock.png" width="150" height="150" alt="时钟" />
</canvas>
```

两个关键事实：

1. **不写 `width`/`height` 属性时默认 300×150**。
2. **属性宽高决定位图缓冲尺寸，CSS 宽高只负责显示拉伸**。若只用 CSS 把 canvas 撑大，300×150 的缓冲会被拉伸得发虚——MDN 原文：绘制时图像会伸缩以适应框架尺寸。正确姿势是用属性（或 JS）设缓冲尺寸，CSS 仅控显示，或直接走下文的 dpr 三步法。

另一个隐蔽副作用：**给 `canvas.width` 赋值（即使赋同值）会清空位图并重置全部上下文状态**——变换、样式、裁剪全丢。有人用 `canvas.width = canvas.width` 清屏，代价是 dpr 适配的 `scale` 也随之失效，需要重跑初始化；常规清屏应该用 `clearRect` 或 `ctx.reset()`（见[动画页](./guide-line/animation)）。

## 三、getContext 与上下文选项

```js
const canvas = document.getElementById("tutorial");
if (canvas.getContext) {
  // 支持性检测：老浏览器没有 getContext 方法
  const ctx = canvas.getContext("2d");
}
```

- **contextType**：`"2d"`、`"webgl"`、`"webgl2"`、`"webgpu"`、`"bitmaprenderer"`。
- **同一 canvas 同类型二次调用返回同一实例**；如果已设置为其他模式（比如先取了 webgl 再要 2d），返回 **null**。
- 已经 `transferControlToOffscreen()` 移交控制权的 canvas，再调 getContext 抛 `InvalidStateError`。

2d 上下文还接受第二个参数（上下文属性对象），四个选项都值得知道：

| 选项 | 默认 | 作用 |
| --- | --- | --- |
| `alpha` | `true` | 设 `false` 声明背景不透明，跳过 alpha 合成、加速绘制 |
| `willReadFrequently` | `false` | 声明将频繁回读像素 → 强制**软件渲染**（放弃硬件加速），高频 `getImageData` 时省去 GPU→CPU 回读反而更快（2024-09 起 Newly Baseline，Safari 18 补齐） |
| `desynchronized` | — | 提示解耦画布绘制与事件循环以降低输入延迟（手写笔场景）；**Blink 专属提示**，其他引擎忽略 |
| `colorSpace` | `"srgb"` | 可设 `"display-p3"` 广色域（Chrome 94+ / Safari 15.4+ / Firefox 111+，约 2023 起可用） |

```js
// 典型：取色器/视频逐帧处理这类高频回读场景
const ctx = canvas.getContext("2d", { willReadFrequently: true });
// 典型：不透明背景的游戏画布
const ctx2 = canvas2.getContext("2d", { alpha: false });
```

## 四、高清屏适配：devicePixelRatio 三步法（必考）

`window.devicePixelRatio` = 物理像素 / CSS 像素（Retina 常为 2）。若位图缓冲尺寸 = CSS 尺寸，1 个画布像素会被拉伸到 dpr² 个物理像素 → **模糊**。修正三步：

```js
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const size = 200; // 期望的 CSS 逻辑尺寸

// ① CSS 显示尺寸（逻辑像素）
canvas.style.width = `${size}px`;
canvas.style.height = `${size}px`;

// ② 位图缓冲尺寸 = 逻辑尺寸 × dpr（物理像素）
const dpr = window.devicePixelRatio;
canvas.width = Math.floor(size * dpr);
canvas.height = Math.floor(size * dpr);

// ③ 坐标系放大 dpr 倍，后续绘制照旧用 CSS 像素坐标
ctx.scale(dpr, dpr);
```

补充两点：

- **监听 dpr 变化**（窗口拖到别的屏 / 浏览器缩放）：

```js
matchMedia(`(resolution: ${devicePixelRatio}dppx)`).addEventListener(
  "change",
  update, // dpr 变了重跑三步法
);
```

- **事件坐标要换算**：dpr 适配后缓冲尺寸 ≠ CSS 尺寸，`event.offsetX` 直接喂给绘制/拾取会错位，须乘 `canvas.width / rect.width`（详见[动画页的拾取一节](./guide-line/animation)）。

## 五、第一个绘制

矩形三件套**直接绘制、不进路径**，是最快看到像素的方式：

```js
const canvas = document.getElementById("tutorial");
const ctx = canvas.getContext("2d");

ctx.fillStyle = "#09F";          // CSS 颜色字符串，默认 #000；设置后对后续绘制持续生效
ctx.fillRect(10, 10, 100, 100);  // 填充矩形 (x, y, w, h)

ctx.strokeStyle = "red";
ctx.strokeRect(130, 10, 100, 100); // 描边矩形

ctx.clearRect(40, 40, 40, 40);   // 清成透明黑（在填充矩形上挖个洞）
```

三个立刻能体会到的「Canvas 脾气」：

1. **坐标原点在左上角**，x 向右、y 向下。
2. **角度一律用弧度**：`arc`/`rotate` 传 90 期望直角，实际是 90 弧度 ≈ 14.3 圈——`rad = deg * Math.PI / 180`。
3. **`fillStyle` 是状态不是参数**：一经设置对后续所有绘制持续生效，这就是「上下文是状态机」的第一次照面。

矩形之外的一切图形（三角形、圆、曲线）都要走**路径系统**：`beginPath()` → 画图命令 → `closePath()`（可选）→ `stroke()`/`fill()`。下一页[绘图基础](./guide-line/drawing-basics)从路径系统讲起。
