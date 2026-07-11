---
layout: doc
outline: [2, 3]
---

# 数据传输与 OffscreenCanvas

> 基于 WHATWG HTML 现行标准（Web workers 章）与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **两种传数据的方式**：**结构化克隆**（默认，深拷贝，两边各一份）vs **Transferable 移交**（零拷贝，把底层资源的**所有权**从这边搬到那边）。
- **克隆 = 拷贝，transfer = 搬家**：克隆后原对象照常可用、内存里有两份；transfer 后**原对象 detached 失效**、内存里始终只有一份。
- **transfer 语法**：`postMessage(msg, [transferList])`——第二个参数是要移交的可转移对象数组，`msg` 里引用到它们的地方会指向搬过去的那份。
- **转移后原对象失效**：`worker.postMessage(buf, [buf])` 之后，主线程再读 `buf.byteLength` 得到 `0`（已 detached），继续用抛错——这是 transfer 的核心语义，不是 bug。
- **可转移类型**：`ArrayBuffer`、`MessagePort`、`ImageBitmap`、`OffscreenCanvas`、`ReadableStream`/`WritableStream`/`TransformStream`，以及媒体类 `VideoFrame`/`AudioData`/`MediaStreamTrack`、`RTCDataChannel` 等。
- **TypedArray 本身不可转移**：转移的是它的 `.buffer`——`postMessage(view, [view.buffer])`；`view` 会被拷贝壳、底层 buffer 被搬走后 `view` 也变空。
- **`structuredClone()` 全局函数**：主线程做深拷贝的标准手段，与 `postMessage` 同算法；也支持 `structuredClone(obj, { transfer: [buf] })` 在克隆时移交部分资源。
- **`SharedArrayBuffer` = 真共享内存**：不是拷贝也不是移交，而是**两条线程同时读写同一块内存**，配 `Atomics` 做同步。
- **SAB 的门槛**：用 `SharedArrayBuffer` 要求页面**跨源隔离**——发 `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp` 两个响应头（Spectre 缓解后的硬性要求），可用 `crossOriginIsolated` 全局布尔量自检。
- **OffscreenCanvas = 把渲染搬进 worker**：`canvas.transferControlToOffscreen()` 拿到一个可转移的 `OffscreenCanvas`，transfer 给 worker 后，worker 直接对它 `getContext("webgl"/"2d")` 渲染，主线程免阻塞。
- **OffscreenCanvas 两种用法**：① 主线程 `transferControlToOffscreen()` 交给 worker（渲染上屏由浏览器自动同步）；② worker 内 `new OffscreenCanvas(w, h)` 离屏渲染 + `transferToImageBitmap()` 出图。
- **worker 里能用 `requestAnimationFrame`**：`OffscreenCanvas` 场景下 worker 有自己的 rAF，渲染循环整个跑在 worker 线程。
- **OffscreenCanvas 兼容性**：Chrome 69+/Firefox 105+/Safari 17+，**2025 末进入 Baseline（广泛可用）**，Safari 17 是最后补齐的一环。
- **`ImageBitmap`**：可解码、可转移的位图；`createImageBitmap(src)`（主线程或 worker 均可）把图片/`Blob`/`ImageData` 解码成 `ImageBitmap`，transfer 给 worker 零拷贝上屏。
- **`transferToImageBitmap()`**：从 `OffscreenCanvas` 抓当前帧成 `ImageBitmap`，再用主线程 `<canvas>` 的 `bitmaprenderer` 上下文 `transferFromImageBitmap()` 显示。
- **选择口诀**：小对象随便克隆；**大 `ArrayBuffer`/位图务必 transfer**；要两线程**同时**读写同一块内存才上 `SharedArrayBuffer`（并接受 COOP/COEP 门槛）；渲染重就 `OffscreenCanvas`。
- **transfer 的坑**：移交后原对象不能再用——若主线程还要保留数据，要么先 `structuredClone` 留副本再 transfer 副本，要么干脆用克隆不用 transfer。

## 一、结构化克隆 vs Transferable：拷贝还是搬家

`postMessage` 默认走**结构化克隆**——把数据深拷贝一份送到对方世界。小数据无所谓，但传一个 50MB 的 `ArrayBuffer` 时，深拷贝要**实打实复制 50MB 内存**，既慢又翻倍占用。**Transferable（可转移对象）**给出另一条路：不复制，直接把底层资源的**所有权**从发送方**搬**到接收方——零拷贝，代价是**发送方从此失去它**。

```js
const buf = new ArrayBuffer(50 * 1024 * 1024); // 50MB

// 方式一：结构化克隆（默认）——复制 50MB，主线程仍持有 buf
worker.postMessage(buf); // 慢、内存翻倍
console.log(buf.byteLength); // 52428800（原对象照常可用）

// 方式二：Transferable 移交——零拷贝，主线程失去 buf
worker.postMessage(buf, [buf]); // ⚡ 第二参数列出要移交的对象
console.log(buf.byteLength); // 0 —— buf 已 detached，读到 0，继续用抛错
```

一句话记牢：**克隆是「复印一份给你」，transfer 是「把原件给你、我这份作废」**。选择标准很直接——传大二进制（buffer、位图、canvas、流）就 transfer；传小对象/要保留原件就克隆。

### 1.1 TypedArray 的转移：搬的是 buffer

`Uint8Array` 这类 TypedArray **本身不在可转移列表里**，可转移的是它背后的 `ArrayBuffer`。所以要转移一个视图，得把它的 `.buffer` 放进 transfer 列表：

```js
const view = new Uint8Array(1024 * 1024).map((_, i) => i & 0xff);

// ✅ 转移底层 buffer（view 是壳、buffer 是肉）
worker.postMessage(view, [view.buffer]);
console.log(view.byteLength); // 0 —— buffer 被搬走，view 也空了
```

注意消息体里放的是 `view`（对方会收到一个指向搬过去 buffer 的 `Uint8Array`），transfer 列表里放的是 `view.buffer`。

### 1.2 structuredClone：主线程内的深拷贝与移交

`structuredClone()` 是与 `postMessage` **同款算法**的全局函数，用来在**同一个线程内**做深拷贝（比 `JSON.parse(JSON.stringify())` 强，能搬 `Map`/`Set`/`Date`/循环引用/`ArrayBuffer`）：

```js
const original = { when: new Date(), data: new Uint8Array([1, 2, 3]) };
const copy = structuredClone(original); // 深拷贝，两者独立

// 也能在克隆时移交部分资源（transfer 选项）
const src = new Uint8Array(1024);
const moved = structuredClone(src, { transfer: [src.buffer] });
console.log(moved.byteLength); // 1024
console.log(src.byteLength); // 0 —— src.buffer 被移交，src 失效
```

## 二、可转移类型清单

不是所有对象都能 transfer，只有实现了「可转移」语义的少数类型可以。常用的：

| 可转移类型 | 典型场景 |
| --- | --- |
| **`ArrayBuffer`** | 传大块二进制（文件字节、解码后的音视频、WASM 内存） |
| **`MessagePort`** | 传递通信端口（`MessageChannel` 的两端、共享 worker 的 port） |
| **`ImageBitmap`** | 解码好的位图零拷贝送进 worker 或上屏 |
| **`OffscreenCanvas`** | 把 canvas 控制权交给 worker 渲染（见第四节） |
| **`ReadableStream` / `WritableStream` / `TransformStream`** | 把流的一端交给另一线程处理 |
| `VideoFrame` / `AudioData` | WebCodecs 的帧数据跨线程移交 |
| `MediaStreamTrack` / `RTCDataChannel` | 媒体轨道 / WebRTC 数据通道跨上下文移交 |

不在列表里的（普通对象、TypedArray 视图本身、`Blob`、`Date` 等）只能被**克隆**，不能被转移——它们照样能 `postMessage`，只是走深拷贝。完整表见[参考页](../reference)。

## 三、SharedArrayBuffer：真正的共享内存

克隆和 transfer 都是「一份数据只在一个地方」。`SharedArrayBuffer`（SAB）打破这点——它让**主线程和 worker 同时映射到同一块物理内存**，一边写、另一边立刻能读，无需再 `postMessage`。这是唯一的「共享内存」原语，配 `Atomics` 做无锁同步：

```js
// ---------- 主线程 ----------
// 先自检环境是否跨源隔离（否则 SharedArrayBuffer 不可用）
if (!crossOriginIsolated) {
  throw new Error("需要 COOP + COEP 头才能用 SharedArrayBuffer");
}

const sab = new SharedArrayBuffer(1024); // 一块共享内存
const view = new Int32Array(sab);
worker.postMessage(sab); // 注意：SAB 是【共享】，不放 transfer 列表、也不 detached

// worker 改了这块内存，主线程能直接读到
Atomics.wait(view, 0, 0); // 用 Atomics 做线程同步（此处仅示意）
```

```js
// ---------- worker 端 ----------
self.onmessage = (e) => {
  const view = new Int32Array(e.data); // 同一块内存，不是拷贝
  view[0] = 42; // 主线程立刻可见
  Atomics.notify(view, 0); // 唤醒等待的主线程
};
```

**部署门槛（必须满足，否则 `SharedArrayBuffer` 直接不可用）**：Spectre 幽灵漏洞之后，浏览器要求使用 SAB 的页面处于**跨源隔离**状态，即服务器给文档返回这两个响应头：

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

两个头都到位后，`window.crossOriginIsolated` 才为 `true`，`SharedArrayBuffer` 才能构造。代价是页面会被限制加载不带 CORP/CORS 许可的跨源资源（图片、脚本、iframe），接入前要评估对现有第三方资源的影响。**绝大多数「传数据」需求用 transfer 就够了**，只有确实需要两线程高频共享同一状态（如共享的物理引擎状态、音频环形缓冲）才值得上 SAB。

## 四、OffscreenCanvas：把渲染卸到 worker

`<canvas>` 绑在 DOM 上、只能在主线程画——复杂的 WebGL/2D 渲染因此会和 UI 抢主线程。`OffscreenCanvas` 把画布从 DOM 解耦，让**渲染整个跑在 worker 线程**，主线程只管把它显示出来。它本身是可转移对象。

**用法一：主线程 `transferControlToOffscreen()`，交给 worker 渲染（最常用）**

```js
// ---------- 主线程 main.js ----------
const canvas = document.getElementById("scene");
// 把这个 <canvas> 的绘制控制权转出成一个 OffscreenCanvas
const offscreen = canvas.transferControlToOffscreen();

const worker = new Worker(new URL("./render.worker.js", import.meta.url), {
  type: "module",
});
// OffscreenCanvas 是可转移对象，放进 transfer 列表移交给 worker
worker.postMessage({ canvas: offscreen }, [offscreen]);
// 此后主线程不再直接画这个 canvas，worker 画什么就自动显示什么
```

```js
// ---------- render.worker.js（worker 端）----------
self.onmessage = (e) => {
  const canvas = e.data.canvas; // 收到的 OffscreenCanvas
  const gl = canvas.getContext("webgl"); // worker 里直接拿 WebGL 上下文

  // worker 里有自己的 requestAnimationFrame，渲染循环整条跑在后台线程
  function frame(t) {
    // …用 gl 绘制一帧（主线程全程不参与、不阻塞）…
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};
```

这种用法下，worker 画到 `OffscreenCanvas` 上的内容会被浏览器**自动**同步显示到页面上那个原始 `<canvas>`，你不用手动搬像素。整条渲染流水线（包括动画循环）都在 worker，主线程哪怕在跑别的重活，画面也照样流畅。

**用法二：worker 内 `new OffscreenCanvas()` 离屏出图**

```js
// ---------- worker 端：离屏渲染，手动出图 ----------
const off = new OffscreenCanvas(512, 512); // 无需绑定任何 DOM canvas
const ctx = off.getContext("2d");
// …画一些东西…
const bitmap = off.transferToImageBitmap(); // 抓当前帧成 ImageBitmap（可转移）
self.postMessage({ bitmap }, [bitmap]); // 零拷贝送回主线程
```

```js
// ---------- 主线程：用 bitmaprenderer 上下文显示 ----------
worker.onmessage = (e) => {
  const canvas = document.getElementById("view");
  const ctx = canvas.getContext("bitmaprenderer"); // 专用于贴 ImageBitmap
  ctx.transferFromImageBitmap(e.data.bitmap); // 零拷贝上屏
};
```

**兼容性**：`OffscreenCanvas` 于 Chrome 69+/Firefox 105+/Safari 17+ 支持，**2025 末进入 Baseline（广泛可用）**——Safari 17（2023 秋）是最后补齐的浏览器。目标含较老 Safari 时要么做特性检测（`"OffscreenCanvas" in window`）+ 回落主线程渲染，要么确认最低版本。

## 五、ImageBitmap：可转移的解码位图

`ImageBitmap` 是一种**已解码、可转移**的位图对象——把「解码图片」这件事（往往不便宜）挪进 worker，或在线程间零拷贝传图像。`createImageBitmap()` 在主线程和 worker 里都能用：

```js
// worker 里解码一张图，避免主线程解码卡顿
self.onmessage = async (e) => {
  const blob = e.data.blob; // 主线程传来的图片 Blob（Blob 走克隆）
  const bitmap = await createImageBitmap(blob); // worker 里解码成 ImageBitmap
  // 直接把解码好的位图零拷贝送回主线程上屏
  self.postMessage({ bitmap }, [bitmap]);
};
```

`ImageBitmap` 能被 `drawImage()` 直接绘制、能 transfer、能配 `OffscreenCanvas` 与 `bitmaprenderer` 上下文——是把图像处理管线搬进 worker 的关键拼图。

## 六、传输方式怎么选：一张对照表

| 需求 | 用什么 | 关键点 |
| --- | --- | --- |
| 传小对象、配置、结果 | 结构化克隆（直接 `postMessage`） | 简单；函数/DOM 传不了 |
| 传大 `ArrayBuffer`/TypedArray | **transfer**（`postMessage(v, [v.buffer])`） | 零拷贝；原对象 detached |
| 传解码位图 / canvas 帧 | `ImageBitmap` transfer | 配 `bitmaprenderer` 上屏 |
| 把整个渲染搬到 worker | `OffscreenCanvas` transfer | worker 内 rAF；注意 Safari 17+ |
| 两线程**同时**读写同一状态 | `SharedArrayBuffer` + `Atomics` | 需 COOP + COEP，门槛高 |
| 主线程内深拷贝 | `structuredClone()` | 同 `postMessage` 算法 |

一句话决策：**默认克隆，遇到大二进制就 transfer，渲染重就 OffscreenCanvas，非共享内存不可的高频协作才上 SAB（并接受跨源隔离代价）。**

下一页把这些原始 API 收进工程封装——[工程模式与 Comlink](./patterns-comlink)。
