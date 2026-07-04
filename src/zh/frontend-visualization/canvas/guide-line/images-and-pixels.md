---
layout: doc
outline: [2, 3]
---

# 图像与像素：drawImage / ImageData / 跨域污染

> 基于 Canvas 2D API（2026 浏览器基线）· 核于 2026-07

## 速查

- **图像源（CanvasImageSource）**：`HTMLImageElement`、`HTMLVideoElement`（取当前帧）、`HTMLCanvasElement`、`ImageBitmap`、`OffscreenCanvas`、SVG image。
- **video 源**：drawImage 取视频**当前帧**——视频逐帧处理/截帧的入口。
- **canvas 源**：canvas 画 canvas = **离屏预渲染**的基础（见[性能页](./performance)）。
- **drawImage 三种签名**：
  - `drawImage(image, dx, dy)` —— 原尺寸画到目标点；
  - `drawImage(image, dx, dy, dW, dH)` —— 缩放到目标宽高；
  - `drawImage(image, sx, sy, sW, sH, dx, dy, dW, dH)` —— 切片：**源矩形在前、目标矩形在后**（记「source 先行」，顺序记反是高频坑）。
- **必须等加载完成**：`img.onload` 里再画（onload 先挂再赋 src），否则**静默画空白**。
- **多图加载**：`Promise.all` 等所有 load 事件，或用 Promise 化的 `img.decode()`。
- **imageSmoothingEnabled**（默认 true）：false = 关闭插值，放大呈马赛克（像素画/放大镜必备）；配套 `imageSmoothingQuality`（low/medium/high）；现代浏览器**直接用无前缀属性**（moz/webkit/ms 前缀已成历史）。
- **ImageData 结构**：`data` 是 `Uint8ClampedArray`，RGBA 连续存储、每通道 0-255，长度 = w × h × 4；索引公式 `(row * width + col) * 4 + channel`（0=R,1=G,2=B,3=A）。
- **读**：`getImageData(left, top, w, h)`，画布外区域为透明黑；取色器 = `getImageData(x, y, 1, 1).data`（a 除 255 得 CSS alpha）。
- **灰度滤镜公式**：RGB 三通道取均值回写；反色 = `255 - 通道值`。
- **色彩空间读出**：`getImageData` 也可指定色彩空间（配 display-p3 广色域画布）。
- **建**：`createImageData(w, h)` 全部预填**透明黑**；也接受 `createImageData(other)`（只取尺寸）。
- **写**：`putImageData(imageData, dx, dy)` **无视变换/合成/globalAlpha**；七参版只写脏区 `(dirtyX, dirtyY, dirtyW, dirtyH)`。
- **getImageData 是昂贵操作**：GPU→CPU **同步回读 + 内存拷贝**；管线尽量「一次读、批量算、一次写」。
- **willReadFrequently: true**：创建上下文时声明高频回读 → 强制**软件渲染**，免去 GPU 回读反而更快（取色/视频逐帧处理）；2024-09 起 Newly Baseline（Safari 18 补齐），Widely 预计 2027-03。
- **软件渲染的代价**：放弃硬件加速、常规绘制变慢——只在高频回读场景净收益为正。
- **跨域污染（taint，必考）**：
  - 未经 CORS 允许的跨域图（含 `file://` 本地图）一旦画入 → canvas **永久污染**；
  - `drawImage` **那一刻不报错**；`getImageData` / `toDataURL` / `toBlob` / `captureStream` 才抛 `SecurityError`，难排查；
  - 解法：`img.crossOrigin = "anonymous"` **且**服务器返回 `Access-Control-Allow-Origin`；同源图/dataURL 图不污染；本地调试走 http 服务而非 `file://`。
- **导出**：
  - `toDataURL("image/png")` **同步** base64（默认 PNG）；`toDataURL("image/jpeg", 0.9)` 质量 0~1；
  - `toBlob(cb, "image/jpeg", 0.9)` **异步**二进制，大图优先（同步长 base64 = 内存与主线程双杀）；
  - `captureStream(25)` 输出 MediaStream（25fps；不传参 = 画布变化才产帧），接 MediaRecorder 录屏 / WebRTC 推流（2020-01 Baseline）。
- **convertToBlob(options)**：OffscreenCanvas 版导出，替代 toBlob、返回 Promise。
- **hit-canvas 拾取**：`getImageData(x, y, 1, 1)` 反查「颜色 → 对象」映射，任意形状 O(1) 命中（详见[动画页](./animation)）。
- **性能**：不要每帧用 drawImage 现场缩放大图——各尺寸提前缓存到离屏画布（见[性能页](./performance)）。

## 一、drawImage：把图像画上画布

图像源不只是 `<img>`——`HTMLImageElement`、`HTMLVideoElement`（取当前帧，视频逐帧处理的入口）、`HTMLCanvasElement`（canvas 画 canvas，离屏预渲染的基础）、`ImageBitmap`、`OffscreenCanvas`、SVG image 都可以。

```js
drawImage(image, dx, dy);                          // ① 原尺寸画到 (dx, dy)
drawImage(image, dx, dy, dWidth, dHeight);         // ② 缩放到目标宽高
drawImage(image, sx, sy, sW, sH, dx, dy, dW, dH);  // ③ 切片：源矩形在前，目标矩形在后
```

九参版是精灵图（sprite sheet）的标配：从源图裁 `(sx, sy, sW, sH)` 画到目标 `(dx, dy, dW, dH)`。**顺序记反是高频坑**——记「**s**ource 先行」。

第二个高频坑是**图片未加载就画**：`drawImage` 会静默画空白、不报错。标准姿势：

```js
const img = new Image();
img.onload = () => ctx.drawImage(img, 0, 0); // onload 先挂再赋 src
img.src = "myImage.png";
// 多图：用 Promise.all 等所有 load 事件（或 img.decode()）
```

### 缩放品质

- `imageSmoothingEnabled`（默认 true）：设 false 关闭插值，放大呈马赛克——像素画、放大镜场景必备；配套 `imageSmoothingQuality`（`"low"` / `"medium"` / `"high"`）。
- 老文档里的 `mozImageSmoothingEnabled` 等前缀属性已成历史，现代浏览器**直接用无前缀版**。
- 性能提醒：**别每帧用 drawImage 现场缩放大图**，把各尺寸提前缓存到离屏画布再拷贝。

## 二、ImageData：逐像素读写

```js
const imageData = ctx.getImageData(left, top, width, height); // 读（画布外区域为透明黑）
imageData.width;  imageData.height;
imageData.data; // Uint8ClampedArray，RGBA 顺序，每通道 0-255，长度 = w * h * 4
// 第 row 行 col 列的通道 c（0=R, 1=G, 2=B, 3=A）：
// imageData.data[row * (imageData.width * 4) + col * 4 + c]

const blank = ctx.createImageData(width, height); // 全部预填【透明黑】；也接受 createImageData(other)
ctx.putImageData(imageData, dx, dy);              // 写回（putImageData 无视变换/合成/alpha）
ctx.putImageData(imageData, dx, dy, dirtyX, dirtyY, dirtyW, dirtyH); // 只写脏区
```

注意 `putImageData` 的特殊性：它**无视当前变换、globalAlpha 与合成模式**，是纯粹的像素块写入。

### 经典滤镜：灰度与反色

```js
const data = imageData.data;
for (let i = 0; i < data.length; i += 4) {
  const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
  data[i] = data[i + 1] = data[i + 2] = avg; // 灰度；反色则 255 - data[i]
}
ctx.putImageData(imageData, 0, 0);
```

### 取色器

```js
const [r, g, b, a] = ctx.getImageData(x, y, 1, 1).data; // a 除 255 得 CSS alpha
```

## 三、getImageData 的代价与 willReadFrequently

`getImageData` 慢的本质：canvas 默认走 GPU 渲染，回读像素意味着 **GPU→CPU 同步回读 + 内存拷贝**，主线程被阻塞。两条对策：

1. **管线设计**：尽量「一次读、批量算、一次写」，不要每帧、每对象各读一小块；或降频/移到 Worker。
2. **声明回读意图**：创建上下文时传 `willReadFrequently: true`，强制**软件渲染**——放弃硬件加速，换来 `getImageData` 不再跨 GPU 回读，高频读取场景反而更快：

```js
// 取色器、视频逐帧处理等高频回读场景
const ctx = canvas.getContext("2d", { willReadFrequently: true });
```

基线状态：2024-09 起 Newly Baseline（Safari 18 补齐），Widely 预计 2027-03。老 MDN 中文 getContext 页对它的描述陈旧（标 Gecko-only），以英文页为准。

## 四、跨域污染（taint）：必考坑

安全模型：canvas 可以读出像素（`getImageData`）与导出图像（`toDataURL`/`toBlob`），这可能泄露跨域图像内容——于是有了污染机制：

- **未经 CORS 允许的跨域图像（含 `file://` 本地图）一旦画入，canvas 被永久污染**。
- **`drawImage` 本身不报错**——绘制那一刻风平浪静；等到调 `getImageData` / `toDataURL` / `toBlob`（以及 `captureStream`）才抛 `SecurityError`，排查时容易一头雾水。
- **解法**：请求图像时带 CORS——`img.crossOrigin = "anonymous"`，且服务器返回 `Access-Control-Allow-Origin`。两者缺一不可。
- 同源图、dataURL 图不污染；本地调试用 http 服务而不是双击打开 `file://` 页面。

## 五、导出与流

```js
canvas.toDataURL("image/png");           // 同步返回 base64 data URL（默认 PNG）
canvas.toDataURL("image/jpeg", 0.9);     // JPEG，质量 0~1
canvas.toBlob((blob) => { /* 上传/下载 */ }, "image/jpeg", 0.9); // 异步、二进制，大图优先
const stream = canvas.captureStream(25); // MediaStream，25fps；不传参 = 画布变化才产帧
// stream 可接 MediaRecorder 录屏 / WebRTC 推流（2020-01 Baseline）
```

- **大图导出用 `toBlob`**：`toDataURL` 同步生成超长 base64 字符串，内存与主线程双杀；`toBlob`（配 `URL.createObjectURL`）或 `OffscreenCanvas.convertToBlob()`（返回 Promise）才是正解。
- 污染的 canvas 调以上任何导出 API 均抛 `SecurityError`。

像素是「内容」层面的操作；下一页[变换与状态](./transforms-and-state)回到坐标系层面——变换矩阵、save/restore 状态栈、合成与裁剪。
