---
layout: doc
outline: [2, 3]
---

# 性能优化：离屏 / 分层 / OffscreenCanvas

> 基于 Canvas 2D API（2026 浏览器基线）· 核于 2026-07

## 速查

- **离屏预渲染**：重复出现的复杂图形先画到 `document.createElement("canvas")`，每帧 `drawImage(off, x, y)` 拷贝——把「几十条绘制命令」换成「一次位图拷贝」。
- **离屏尺寸必须紧贴内容**：松散大画布的拷贝开销会吃掉收益（web.dev 强调）。
- **别实时缩放 drawImage**：各尺寸提前缓存到离屏画布，每帧只做等尺寸拷贝。
- **分层 canvas**：背景层（低频/静止）与前景层（每帧）拆成多个**绝对定位 + z-index 叠放**的 canvas，各层独立重绘——本质是**重绘频率分治**。
- **静态大背景交给 CSS**：`<div>` + `background`，别每帧画。
- **整屏缩放用 CSS transform**（走 GPU）。
- **小画布放大优于大画布缩小**（少填充像素）。
- **不透明画布**：`getContext("2d", { alpha: false })` 跳过 alpha 合成，加速绘制。
- **整数坐标**：非整坐标触发亚像素抗锯齿运算，`Math.floor()` 取整（GPU 加速普及后重要性降低，大量图元时仍有效）。
- **批量绘制**：多条线段并入一条 path、一次 stroke。
- **按样式分组**：改 fillStyle 是状态机开销——同色对象连画，别「每个对象设一次色」。
- **脏矩形**：跟踪变化区域包围盒，只 clear/重绘该区域，而非整屏。
- **规避昂贵特性**：`shadowBlur`、大量 `fillText`、每帧 `getImageData`。
- **shadowBlur 替代**：阴影内容预渲染到离屏画布，或改用 CSS 阴影。
- **高频回读**：上下文创建时声明 `willReadFrequently: true` 切软件渲染（详见[图像与像素](./images-and-pixels)）。
- **低延迟提示**：`desynchronized: true` 解耦绘制与事件循环（手写笔场景，Blink 专属）。
- **rAF + delta time**：动画驱动基线（见[动画页](./animation)）。
- **OffscreenCanvas（2023-03 Baseline）**：与 DOM 解耦的画布，窗口与 Worker 均可用（Worker 里也能直接 `new OffscreenCanvas(w, h)`），两种模式：
  - **模式 A（最常用）**：`canvas.transferControlToOffscreen()` → `worker.postMessage({ canvas: offscreen }, [offscreen])`，第二参数是 **transfer 列表、零拷贝移交所有权**；
  - Worker 里 getContext + rAF 跑完整渲染循环，**主线程卡死也不影响动画**；
  - **模式 B**：`new OffscreenCanvas(w, h)` 独立绘制 → `transferToImageBitmap()` 取结果（零拷贝）→ 页面 canvas 的 `"bitmaprenderer"` 上下文 `transferFromImageBitmap(bitmap)` 显示。
- **A/B 选型**：A = 页面画布常驻动画绑定 Worker（异步显示）；B = 同步显示 / 多画布共享一条渲染管线。
- **交互转发**：Worker 里没有 DOM 事件——主线程监听、`postMessage` 把数据与交互事件发给 Worker。
- **移交后的红线**：已 `transferControlToOffscreen()` 的原 canvas 再调 getContext 抛 `InvalidStateError`。
- **Worker 里有 rAF**：可跑完整渲染循环；老示例的 `gl.commit()` 已从规范移除，现行做法就是 Worker 内 rAF，别沿用。
- **大图导出**：`toDataURL` 同步生成超长 base64、内存与主线程双杀——用异步 `toBlob`。
- **convertToBlob(options)**：OffscreenCanvas 版导出，替代 toBlob、返回 Promise。
- **典型收益**：图表/地图/游戏把渲染放 Worker，主线程只发数据与交互事件，长任务不再掉帧。
- **优先级心法**：先算法层（少画：脏矩形/分层/离屏缓存）→ 再状态层（少切换：批量/分组）→ 最后并行层（Worker）。
- **量化先行**：优化前后用 DevTools Performance 面板实测帧率与耗时，别凭感觉堆技巧。

## 一、离屏预渲染：画一次，贴 N 次

重复出现的复杂图形（精灵、带阴影的卡片、网格背景）不该每帧重画，而是**先画到一张离屏 canvas，每帧 `drawImage` 拷贝**——把「几十条绘制命令」换成「一次位图拷贝」：

```js
const off = document.createElement("canvas");
off.width = 64;  off.height = 64;      // 紧贴精灵尺寸
drawSprite(off.getContext("2d"));      // 复杂绘制只做一次
// 每帧：
ctx.drawImage(off, x, y);              // 一次拷贝
```

两条配套纪律：

1. **离屏画布尺寸必须紧贴内容**——松散的大离屏画布，每帧拷贝的空白区域开销会把收益吃掉（web.dev 强调）。
2. **别实时缩放**：`drawImage` 现场缩放大图每帧都在做重采样；各目标尺寸提前各缓存一张，每帧只做等尺寸拷贝。

同理，`shadowBlur` 这类昂贵效果：把带阴影的内容预渲染进离屏画布，动画中只拷贝；或干脆用 CSS 阴影。

## 二、分层 canvas 与「能不画就不画」

- **分层**：把静止/低频内容（背景、网格）与每帧变化内容（角色、指针）拆到**多张绝对定位、z-index 叠放**的 canvas 上，各层按自己的频率重绘——背景层可能几分钟才画一次，前景层每帧画，但每帧要画的东西少得多。
- **静态大背景交给 CSS**：一张不变的背景图用 `<div>` + `background` 呈现，根本不进 canvas。
- **整屏缩放用 CSS transform**：走 GPU 合成，不触发重绘；小画布放大优于大画布缩小（少填充像素）。
- **脏矩形**：跟踪本帧变化区域的包围盒，只 `clearRect` + 重绘该区域，而非整屏刷新。

## 三、状态机层面的省钱

- **批量绘制**：多条线段并入一条 path、一次 `stroke()`，别一条一 stroke。
- **按样式分组**：改 `fillStyle`/`strokeStyle` 本身是状态机开销——把同色对象分组连画，不要「每个对象设一次色」。
- **整数坐标**：非整坐标触发亚像素抗锯齿；`Math.floor()` 取整（GPU 加速普及后重要性降低，大量图元时仍有效）。
- **不透明画布**：确定背景不透明时 `getContext("2d", { alpha: false })`，跳过 alpha 合成。
- **规避昂贵调用**：动画循环里的 `shadowBlur`、大量 `fillText`、每帧 `getImageData`（高频回读见[图像与像素页](./images-and-pixels)的 `willReadFrequently`）。

## 四、OffscreenCanvas + Worker：渲染彻底离开主线程

OffscreenCanvas（2023-03 起 Baseline，中文 MDN 页残留的「实验性技术」横幅已过时）是与 DOM 解耦的画布，窗口与 Worker 中均可用。两种模式：

### 模式 A：主线程移交控制权（异步显示，最常用）

```js
// main.js —— transferControlToOffscreen 后原 canvas 不能再 getContext
const offscreen = document.getElementById("canvas").transferControlToOffscreen();
const worker = new Worker("render.worker.js");
worker.postMessage({ canvas: offscreen }, [offscreen]); // 第二参数 transfer 列表：零拷贝移交所有权

// render.worker.js —— Worker 里也有 requestAnimationFrame
onmessage = (evt) => {
  const canvas = evt.data.canvas;
  const ctx = canvas.getContext("2d");
  function render(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ...绘制；主线程卡死也不影响这里的动画
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
};
```

要点：

- `postMessage` 第二参数是 **transfer 列表**——零拷贝移交所有权，不是结构化克隆。
- **移交后原 canvas 不能再 getContext**（抛 `InvalidStateError`）。
- **Worker 里有 rAF**，可跑完整渲染循环；主线程被长任务阻塞时 Worker 动画照跑不误。
- 老示例里的 `gl.commit()` 已从规范移除，现行做法就是 Worker 内 rAF 循环，别沿用。

### 模式 B：独立离屏画布 + 位图搬运（同步显示）

```js
const offscreen = new OffscreenCanvas(256, 256);
const octx = offscreen.getContext("2d");
// ...绘制
const bitmap = offscreen.transferToImageBitmap();   // 取出渲染结果（零拷贝）
document.getElementById("view")
  .getContext("bitmaprenderer")
  .transferFromImageBitmap(bitmap);                 // 显示
```

`transferToImageBitmap` + `"bitmaprenderer"` 上下文 = 零拷贝把离屏渲染结果搬上屏，适合多画布共享一条渲染管线。另有 `convertToBlob(options)`（替代 `toBlob`，返回 Promise）做导出。

**典型收益**：图表、地图、游戏把渲染放进 Worker，主线程只负责发数据与转发交互事件——主线程再多长任务，画面也不掉帧。

## 五、优化清单（按优先级）

| # | 手段 | 一句话 |
| --- | --- | --- |
| 1 | 离屏预渲染 | 复杂图形画一次、每帧拷贝；离屏尺寸紧贴内容 |
| 2 | 整数坐标 | `Math.floor()`，避开亚像素抗锯齿 |
| 3 | 别实时缩放 drawImage | 各尺寸提前缓存 |
| 4 | 分层 canvas | 静/动分离，各层独立重绘频率 |
| 5 | 静态背景交给 CSS | `background` 而非每帧绘制 |
| 6 | 整屏缩放用 CSS transform | 走 GPU；小画布放大优于大画布缩小 |
| 7 | `{ alpha: false }` | 不透明画布跳过合成 |
| 8 | 批量绘制、减状态切换 | 合并 path、按样式分组 |
| 9 | 脏矩形 | 只清/重绘变化区域 |
| 10 | 规避昂贵特性 | shadowBlur / 大量 fillText / 每帧 getImageData |
| 11 | rAF + delta time | 与刷新同步、帧率无关（见[动画页](./animation)） |
| 12 | OffscreenCanvas + Worker | 渲染彻底移出主线程 |

到这里 Canvas 2D 的主线走完了：模型与适配（[入门](../getting-started)）→ 画（[绘图基础](./drawing-basics)）→ 图像像素（[图像与像素](./images-and-pixels)）→ 坐标与状态（[变换与状态](./transforms-and-state)）→ 动起来（[动画](./animation)）→ 跑得快（本页）。查 API 与基线状态，见[参考页](../reference)。
