---
layout: doc
outline: [2, 3]
---

# 参考：Canvas API 速查

> 基于 Canvas 2D API（2026 浏览器基线）· 核于 2026-07

## 速查

- **模型**：立即模式位图——画完即忘；状态机（save/restore 栈）+ 双坐标系（缓冲 vs CSS）+ 像素管线（回读贵/跨域污染）是三条主线。
- **元素**：默认 **300×150**；属性宽高 = 缓冲，CSS = 拉伸（比例不一致必失真）；`</canvas>` 结束标签必需，标签内是 fallback。
- **重设 width**：赋值（即使同值）= 清位图 + 重置全部状态；常规清屏用 `clearRect` / `ctx.reset()`。
- **上下文**：`getContext("2d", options)`；options：`alpha: false` 加速、`willReadFrequently: true` 高频回读、`desynchronized`（Blink 专属）、`colorSpace: "display-p3"`。
- **高清屏三步**：CSS 尺寸 → 缓冲 ×dpr → `ctx.scale(dpr, dpr)`；事件坐标乘 `canvas.width / rect.width` 换算。
- **监听 dpr 变化**：`matchMedia("(resolution: ...dppx)")` 的 change 事件里重跑三步法。
- **路径**：`beginPath` → 命令 → `closePath?` → `fill`/`stroke`；fill 自动闭合、stroke 不闭合；`fill("evenodd")` 挖洞；Path2D 吃 SVG path 字符串。
- **矩形两族**：`fillRect`/`strokeRect`/`clearRect` 立即画；`rect`/`roundRect(x,y,w,h,radii)` 入路径（radii 同 CSS border-radius 顺时针）。
- **曲线**：`arc`（弧度！anticlockwise 默认 false）/ `arcTo` / `ellipse` / `quadraticCurveTo`（1 控制点）/ `bezierCurveTo`（2 控制点）。
- **样式**：`fillStyle`/`strokeStyle` = 颜色|渐变|图案，设置后持续生效；线型 `lineWidth`(1.0, 居中)/`lineCap`(butt)/`lineJoin`(miter)/`miterLimit`(10)；虚线 `setLineDash` + `lineDashOffset`。
- **渐变图案**：`createLinearGradient(4参)` / `createRadialGradient(6参)` / `createConicGradient(角+心)` + `addColorStop(0~1, c)`；`createPattern(img, repeat...)`。
- **阴影**：`shadowColor` 默认全透明黑——不设色看不见；`shadowBlur` 昂贵。
- **文本**：`font`(默认 `10px sans-serif`)/`textAlign`(start)/`textBaseline`(alphabetic)/`direction`；`fillText(t, x, y, maxWidth?)`；`measureText().width` 布局宽，墨迹高用 `actualBoundingBox*`、字体框用 `fontBoundingBox*`。
- **文本红线**：canvas 文本不进无障碍树、放大即糊——正文用 HTML/SVG，canvas 只做图形标注。
- **图像**：drawImage 三签名，九参「source 先行」；必等 `img.onload`；`imageSmoothingEnabled=false` 关插值。
- **像素**：`getImageData`（贵：GPU→CPU 同步回读）/ `createImageData`（透明黑）/ `putImageData`（无视变换/合成/alpha）；`data` = Uint8ClampedArray RGBA，索引 `(row*w+col)*4+c`。
- **污染**：跨域图画入即污染；drawImage 不报错，`getImageData`/`toDataURL`/`toBlob`/`captureStream` 抛 SecurityError；解法 `crossOrigin="anonymous"` + ACAO 头。
- **变换**：`translate`/`rotate`(绕原点)/`scale`(负值镜像)；`transform` 叠乘、`setTransform` 绝对、`resetTransform` 归一；绕中心 = translate(c)→rotate→translate(-c)。
- **矩阵六参**：`a` 水平缩放、`b` 垂直倾斜、`c` 水平倾斜、`d` 垂直缩放、`e`/`f` 水平/垂直位移。
- **状态栈**：save/restore 保存变换+样式+gCO+裁剪路径等全套；**当前路径不在内**；循环范式 save→变换→画→restore。
- **合成**：gCO 默认 `source-over`，共 26 值；`destination-out` 橡皮擦、`destination-over` 垫背景、`source-in` 蒙版、`lighter` 发光。
- **裁剪**：`clip()` 取当前路径、多次取交集、无法单独撤销 → save/restore 包裹。
- **动画**：rAF 四步「清屏→save→画→restore」；delta time 帧率无关（帧数递增在 120Hz 高刷屏上速度翻倍）。
- **清屏三法**：`clearRect`（只清像素）/ 重设 width（慢+丢状态）/ `ctx.reset()`（2023-12，全重置）；带变换清屏先回单位矩阵。
- **拾取**：`isPointInPath`（坐标不受变换影响）/ 数学命中 / hit-canvas 颜色编码 O(1)。
- **导出**：`toDataURL`（同步 base64）/ `toBlob`（异步二进制，大图优先）/ `captureStream(fps)`。
- **OffscreenCanvas**：模式 A `transferControlToOffscreen` + Worker rAF（主线程卡死不掉帧）；模式 B `transferToImageBitmap` + `bitmaprenderer`；移交后原 canvas getContext 抛 InvalidStateError。
- **基线要点**：roundRect/createConicGradient 2023-04、reset 2023-12、OffscreenCanvas 2023-03、willReadFrequently 2024-09 Newly（Widely 预计 2027-03）。
- **两处非 Baseline**：`ctx.filter`（Safari 稳定版缺席，需特性检测 + 降级）；`desynchronized`（Blink 专属提示）。
- **选型**：交互富/无障碍 → SVG；上万图元 → Canvas 2D；十万级+/3D → WebGL。

## 一、API 速查表

### 画布与上下文

| API | 说明 |
| --- | --- |
| `canvas.getContext(type, options?)` | type：`"2d"`/`"webgl"`/`"webgl2"`/`"webgpu"`/`"bitmaprenderer"`；同类型二次调用同实例，异类型返回 null |
| `canvas.width` / `canvas.height` | 位图缓冲尺寸（默认 300×150）；赋值（即使同值）= 清屏 + 重置全部状态 |
| `canvas.toDataURL(type?, quality?)` | 同步 base64；默认 PNG，JPEG 可带 0~1 质量 |
| `canvas.toBlob(cb, type?, quality?)` | 异步二进制；大图优先 |
| `canvas.captureStream(fps?)` | MediaStream；不传参 = 画布变化才产帧 |
| `canvas.transferControlToOffscreen()` | 移交控制权给 OffscreenCanvas |

### 绘制

| 类别 | API |
| --- | --- |
| 矩形（立即） | `fillRect` / `strokeRect` / `clearRect(x, y, w, h)` |
| 路径管理 | `beginPath()` / `closePath()` / `fill(rule?)` / `stroke()` |
| 路径命令 | `moveTo` / `lineTo` / `rect` / `roundRect(x, y, w, h, radii)` |
| 曲线 | `arc(x, y, r, s, e, ccw?)` / `arcTo(x1, y1, x2, y2, r)` / `ellipse(...)` / `quadraticCurveTo(cpx, cpy, x, y)` / `bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)` |
| 路径对象 | `new Path2D(svgPath?)` / `path.addPath(other, transform?)` |
| 文本 | `fillText` / `strokeText(text, x, y, maxWidth?)` / `measureText(text)` |
| 图像 | `drawImage(img, dx, dy)` / `(img, dx, dy, dW, dH)` / `(img, sx, sy, sW, sH, dx, dy, dW, dH)` |
| 像素 | `getImageData(l, t, w, h)` / `createImageData(w, h)` / `putImageData(data, dx, dy, dirty...?)` |
| 拾取 | `isPointInPath([path,] x, y[, rule])` / `isPointInStroke([path,] x, y)` |

### 状态与样式属性

| 类别 | 属性（默认值） |
| --- | --- |
| 填充/描边 | `fillStyle` (#000) / `strokeStyle` (#000) / `globalAlpha` (1.0) |
| 线型 | `lineWidth` (1.0) / `lineCap` (butt) / `lineJoin` (miter) / `miterLimit` (10) / `setLineDash()` / `lineDashOffset` |
| 阴影 | `shadowOffsetX/Y` (0) / `shadowBlur` (0) / `shadowColor`（全透明黑） |
| 文本 | `font` (10px sans-serif) / `textAlign` (start) / `textBaseline` (alphabetic) / `direction` (inherit) |
| 图像 | `imageSmoothingEnabled` (true) / `imageSmoothingQuality` |
| 合成 | `globalCompositeOperation` (source-over) / `filter` (none，非 Baseline) |
| 变换 | `translate` / `rotate` / `scale` / `transform` / `setTransform` / `resetTransform` / `getTransform` |
| 状态 | `save()` / `restore()` / `reset()` / `clip(path?, rule?)` |

### 渐变与图案

| API | 参数 |
| --- | --- |
| `createLinearGradient` | `(x0, y0, x1, y1)` 起点→终点 |
| `createRadialGradient` | `(x0, y0, r0, x1, y1, r1)` 圆 1→圆 2 |
| `createConicGradient` | `(startAngle, x, y)` 起始角（弧度）+ 中心 |
| `gradient.addColorStop` | `(0~1, color)` |
| `createPattern` | `(image, "repeat" \| "repeat-x" \| "repeat-y" \| "no-repeat")` |

### OffscreenCanvas

| API | 说明 |
| --- | --- |
| `new OffscreenCanvas(w, h)` | 独立离屏画布（窗口/Worker 均可用） |
| `transferControlToOffscreen()` | 页面 canvas → OffscreenCanvas，配 `postMessage(msg, [offscreen])` 零拷贝移交 |
| `transferToImageBitmap()` | 取出渲染结果（零拷贝），配 `bitmaprenderer` 上下文的 `transferFromImageBitmap()` |
| `convertToBlob(options)` | 替代 toBlob，返回 Promise |

## 二、2d 上下文选项

| 选项 | 默认 | 作用 |
| --- | --- | --- |
| `alpha` | true | false = 背景不透明，跳过 alpha 合成加速 |
| `willReadFrequently` | false | true = 强制软件渲染，免 GPU 回读，适合高频 getImageData |
| `desynchronized` | — | 解耦绘制与事件循环降延迟；Blink（Chrome/Edge）专属提示 |
| `colorSpace` | "srgb" | 可选 `"display-p3"` 广色域 |

## 三、新 API 基线状态（2026-07）

| API | 基线状态 | 备注 |
| --- | --- | --- |
| Canvas 2D 核心 | Widely（2015-07 起） | 路径/样式/图像/像素/变换/合成 |
| `roundRect` | **2023-04 全浏览器** | 老中文教程「不存在原生 roundRect」已过时 |
| `createConicGradient` | **2023-04 全浏览器** | 锥形渐变 |
| `ctx.reset()` | **2023-12 Baseline** | 标准化「回到全新上下文」 |
| OffscreenCanvas（含 transferControlToOffscreen） | **2023-03 起全支持**，2026 已属 Widely | 中文页「实验性」横幅过时；`gl.commit()` 已从规范移除 |
| `willReadFrequently` | **Newly（2024-09，Safari 18 补齐）** | Widely 预计 2027-03 |
| `ctx.filter` | **非 Baseline** | Safari 稳定版至今未上线；生产需特性检测 + 降级 |
| `desynchronized` | 非标准跨浏览器 | Blink 专属提示，其他引擎忽略 |
| `colorSpace: "display-p3"` | 约 2023 起三大浏览器 | Chrome 94+ / Safari 15.4+ / Firefox 111+ |
| canvas `letterSpacing`/`wordSpacing` | Newly（约 2024-09） | Safari 18 / Firefox 126 补齐 |
| `captureStream` | 2020-01 Baseline | 接 MediaRecorder / WebRTC |

## 四、易错点清单

- 只用 CSS 设 canvas 大小 → 300×150 缓冲被拉伸发虚；高清屏没走 dpr 三步法 → Retina 模糊。
- 忘 `beginPath()` → 历史路径带新样式重画；对 `stroke()` 期待自动闭合 → 三角形少条边。
- 1px 线发糊 → 坐标偏移 0.5 或偶数线宽。
- 角度传了度数 → 90 弧度 ≈ 14.3 圈；一律 `deg * Math.PI / 180`。
- 图片未加载就 drawImage → 静默画空白；onload 先挂再赋 src。
- drawImage 九参顺序记反 → 「source 先行」。
- 只设 `shadowBlur` 不设 `shadowColor` → 永远看不见影子（默认全透明黑）。
- save/restore 不配对 → clip/变换泄漏、栈越积越深。
- 跨域污染：画的时候不报错，导出/读取才抛 SecurityError；`crossOrigin` + ACAO 头，本地走 http 别用 `file://`。
- 每帧 `getImageData` 卡死 → `willReadFrequently: true` 或降频/Worker。
- 带变换 `clearRect` 清不净 → 先回单位矩阵再清，或 `ctx.reset()`。
- `canvas.width = canvas.width` 清屏 → 状态全丢、dpr 适配失效。
- rAF 回调忘续链 → 只动一帧；忘清屏 → 拖影满屏。
- 拾取坐标不换算 → dpr 适配后命中区错位一倍。
- 大图用 `toDataURL` → 同步长 base64 内存/主线程双杀；用 `toBlob`。
- 误信旧文档：roundRect「不存在」、gCO「12 种」（实为 26 值）、OffscreenCanvas「实验性」+ `gl.commit()`、带前缀 imageSmoothing——均已过时。
- 把正文文本画进 canvas → 不可选中、不进无障碍树；正文用 HTML/SVG。

## 五、选型对比：Canvas 2D vs SVG vs WebGL

| 维度 | Canvas 2D | SVG | WebGL |
| --- | --- | --- | --- |
| 渲染模型 | 立即模式·位图 | 保留模式·矢量 DOM | 立即模式·GPU 光栅 |
| 图形是对象？ | 否（画完即忘） | 是（节点，可 CSS/JS 直接改） | 否（顶点/着色器） |
| 事件 | 元素级，内部自建拾取 | 天然每图形可绑事件 | 自建（射线/颜色拾取） |
| 缩放 | 位图，放大糊 | 矢量，无限清晰 | 位图 |
| 无障碍/SEO | 差（需 fallback） | 好（文本可读可选） | 差 |
| 首选数据量级 | 数千~数万图元 | 数百~数千节点（DOM 开销） | 数万~百万级（粒子/3D） |
| 上手/调试 | 中（命令式） | 低（声明式，DevTools 可查） | 高（通常借 Three.js/PixiJS） |
| 典型场景 | 图表大数据、游戏 2D、图像处理、签名/白板 | 图标、少量交互图形、信息图、地图注记 | 3D、海量粒子、GPU 滤镜 |

面试口径：节点少、交互富、要无障碍 → SVG；上万点散点图/实时 K 线 → Canvas 2D（SVG 的 DOM 数量先崩）；十万级以上或 3D → WebGL（/WebGPU）。业界佐证：ECharts 默认 canvas 可选 svg；D3 大数据量官方建议切 canvas；Mapbox GL 直接 WebGL。混合策略常见：底层海量数据 canvas/WebGL + 顶层交互控件 SVG/HTML。

## 六、权威链接

- [MDN Canvas API 总览](https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API) —— 教程与参考导航
- [MDN Canvas 教程](https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API/Tutorial/Basic_usage) —— 基础用法起步（部分中文页内容陈旧，以 API 参考页 + Baseline 标注为准）
- [MDN CanvasRenderingContext2D](https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D) —— 2D 上下文全属性/方法
- [MDN OffscreenCanvas](https://developer.mozilla.org/zh-CN/docs/Web/API/OffscreenCanvas) —— 离屏画布与 Worker
- [MDN getContext（英文）](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext) —— 上下文选项最全（中文页缺 desynchronized/colorSpace/webgpu）
- [WHATWG HTML 规范 · Canvas](https://html.spec.whatwg.org/multipage/canvas.html) —— 权威规范
- [web.dev Canvas 性能](https://web.dev/articles/canvas-performance) —— 性能最佳实践
