---
layout: doc
outline: [2, 3]
---

# 入门：三类 worker、postMessage 心智模型与何时用

> 基于 WHATWG HTML 现行标准（Web workers 章）与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **一句话定位**：Web Worker 是**跑在后台线程的 JS**，有独立全局作用域（`self`）、独立事件循环，与主线程**不共享变量、碰不到 DOM**，只能靠 `postMessage` 收发消息。它解决的唯一问题是**别让 CPU 密集计算卡住主线程**。
- **三类 worker**：**Dedicated（专用）** 一个页面独占一个（最常用）；**Shared（共享）** 多页面/多标签共享同一实例（靠 `MessagePort`）；**Service（服务）** 是网络代理型特殊 worker（离线缓存/推送，本叶只点到，见 [SW 叶](/zh/web-advanced/web-api/service-worker-pwa/)）。
- **构造**：`const w = new Worker("worker.js")`；模块 worker 传 `{ type: "module" }`（可在 worker 内 `import`）；Vite/打包器下用 `new Worker(new URL("./worker.js", import.meta.url), { type: "module" })`。
- **心智模型 = 消息传递，不是共享内存**：主线程和 worker 是两个**隔离的世界**，唯一的门是 `postMessage(data)` 发、`onmessage = (e) => e.data` 收，双向对称。
- **传的是拷贝不是引用**：`postMessage` 走**结构化克隆算法**深拷贝数据——改一边不影响另一边；对象/数组/`Date`/`Map`/`Set`/`ArrayBuffer`/`Blob` 都能传，**函数、DOM 节点、类方法传不过去**（`DataCloneError`）。
- **大数据可零拷贝移交**：把 `ArrayBuffer` 等放进 `postMessage` 的第二个参数（transfer 列表）就是**所有权移交**，原对象随即失效——详见[数据传输页](./guide-line/transfer-offscreen)。
- **「主线程不阻塞」的意义**：浏览器主线程既跑你的 JS 又管布局、绘制、输入响应；一段跑 200ms 的同步循环会**冻结整个 UI**（点击无反应、动画卡顿）。把它挪进 worker，主线程始终空出来响应用户。
- **worker 内有什么**：`self`、`postMessage`、`fetch`、`WebSocket`、`IndexedDB`、`WebAssembly`、`OffscreenCanvas`、Streams、`setTimeout`、`importScripts`（经典 worker）等。
- **worker 内没什么**：`window`、`document`、`parent`、任何 DOM——要更新界面，把结果 `postMessage` 回主线程再由主线程改 DOM。
- **同源约束**：worker 脚本必须与页面**同源**；子 worker（worker 里再开 worker）也须与父页面同源。
- **经典 vs 模块**：经典 worker 用 `importScripts("a.js", "b.js")` 同步加载依赖；模块 worker（`type:"module"`）用标准 `import`/`export`，**Firefox 114+（2023 中）起全绿、已 Baseline**。
- **销毁**：主线程 `worker.terminate()` 立即杀掉；worker 内部 `self.close()` 自行了结。二者都不给「善后」机会。
- **错误处理**：worker 内未捕获错误冒泡到主线程的 `worker.onerror`（`ErrorEvent`，带 `message`/`filename`/`lineno`）；消息反序列化失败触发 `messageerror`。
- **何时用**：加解密、压缩、图像/音视频/点云处理、大 JSON/CSV 解析、语法高亮、物理与布局计算、WASM 重活——凡是**同步、耗时、会卡 UI** 的纯计算。
- **何时别用**：只是想「稍后执行」而非「并行」（用 `setTimeout`/`requestIdleCallback`）；任务极短（启动 + 通信成本超过收益）；需要频繁读写 DOM（worker 够不着）。
- **别裸写生产代码**：`postMessage` + 手工 `switch(type)` 路由样板极多——工程上用 [Comlink](https://github.com/GoogleChromeLabs/comlink)（~1.1KB）把 worker 方法变成普通 async 调用，见[工程模式页](./guide-line/patterns-comlink)。
- **进阶顺序**：本页 → [专用 Worker](./guide-line/dedicated-worker) → [共享 Worker](./guide-line/shared-worker) → [数据传输与 OffscreenCanvas](./guide-line/transfer-offscreen) → [工程模式与 Comlink](./guide-line/patterns-comlink) → [参考](./reference)。

## 一、为什么需要 worker：主线程是单线程的

浏览器给每个页面**一条主线程**，它要轮流干三件事：跑你的 JavaScript、计算布局与绘制、响应用户输入（点击、滚动、键盘）。这三件事在同一条线程上**排队**——所以只要你的 JS 里出现一段长时间的同步计算，后面的布局、绘制、输入响应就全被堵在后面：

```js
// 主线程上的灾难：这段同步循环跑多久，页面就冻结多久
function sortHugeArray(arr) {
  // 假设这里是 300ms 的排序/加密/解析……
  // 期间：按钮点不动、输入框不响应、动画定格、滚动卡住
  return heavyPureComputation(arr);
}
button.onclick = () => {
  const result = sortHugeArray(millionRecords); // UI 冻结 300ms
  render(result);
};
```

`setTimeout`／`requestIdleCallback` 只是把这段计算**推迟**执行，真正跑起来时照样在主线程、照样冻结——它们解决的是「什么时候跑」，不是「在哪条线程跑」。要让这段计算**真正并行**、跑的时候主线程还能响应用户，只有一条路：**把它搬到另一条线程**，也就是 Worker。

```js
// 交给 worker：主线程发出去就返回，UI 全程流畅
const worker = new Worker(new URL("./sort.worker.js", import.meta.url), {
  type: "module",
});
button.onclick = () => {
  worker.postMessage(millionRecords); // 立即返回，主线程不阻塞
};
worker.onmessage = (e) => render(e.data); // 算完了，结果送回来再渲染
```

一句话记住 worker 的定位：**它不是让代码「变快」，是让重活「不挡道」**——总计算量没少，但主线程被解放出来专心伺候用户。

## 二、三类 worker：先分清定位再选型

「Web Workers」这个大伞下其实有三种 worker，能力和用途差别很大：

| 类型 | 谁能连它 | 生命周期 | 典型用途 | 本站位置 |
| --- | --- | --- | --- | --- |
| **Dedicated Worker（专用）** | **只有创建它的那个页面** | 随创建它的文档 | 绝大多数后台计算 | [专用 Worker 页](./guide-line/dedicated-worker) |
| **Shared Worker（共享）** | 同源的**多个页面/标签/iframe** | 只要还有一个页面连着就活 | 多标签共享一条 WebSocket、一份状态、一个缓存 | [共享 Worker 页](./guide-line/shared-worker) |
| **Service Worker（服务）** | 注册它的作用域内所有页面 | **独立于页面**、可被唤醒 | 离线缓存、请求拦截、推送通知（网络代理） | [SW 与 PWA 叶](/zh/web-advanced/web-api/service-worker-pwa/) |

三者的关系：**Dedicated 是基础**，学会它就掌握了 worker 的核心（构造、消息、错误、传输），Shared 只是把「一对一」换成「多对一」，两者都是**为计算服务**的。**Service Worker 是另一个物种**——它不是用来做计算的，而是坐在页面和网络之间当代理，有自己的注册、安装、激活生命周期；它「碰巧也是 worker」（同样没有 DOM、同样靠事件驱动），但用途、API、心智完全不同，所以单开一叶。本叶后续所有内容都围绕 **Dedicated 与 Shared**，Service Worker 只在对比时点名。

> WASM 常和 worker 搭配——把 WebAssembly 编译好的重计算模块放进 worker 跑，既拿到接近原生的速度、又不卡主线程。worker 内 `WebAssembly` 全局可用，具体编译/实例化/内存模型见 [WebAssembly 叶](/zh/web-advanced/web-api/webassembly/)，本叶不展开。

## 三、postMessage 心智模型：两个隔离世界之间的一扇门

理解 worker 只需要建立一个模型：**主线程和 worker 是两个完全隔离的 JS 世界**，各有自己的全局对象、自己的内存、自己的事件循环。它们**不能读写对方的变量**，唯一的联系是一扇双向的门——`postMessage` 往门里塞数据、`onmessage` 在门这边接数据：

```js
// ---------- 主线程 main.js ----------
const worker = new Worker(new URL("./echo.worker.js", import.meta.url), {
  type: "module",
});

// 发：往 worker 世界塞一条消息
worker.postMessage({ type: "greet", name: "worker" });

// 收：监听 worker 送回来的消息，e.data 就是对方 postMessage 的内容
worker.onmessage = (e) => {
  console.log("主线程收到：", e.data); // → "你好，来自 worker"
};
```

```js
// ---------- worker 端 echo.worker.js ----------
// worker 里没有 window，全局对象是 self（可省略）
self.onmessage = (e) => {
  // e.data 是主线程发来内容的【一份拷贝】，不是同一个对象
  if (e.data.type === "greet") {
    self.postMessage(`你好，来自 ${e.data.name}`); // 送回主线程
  }
};
```

这个模型有三个必须内化的推论：

1. **传的是拷贝，不是引用**。`postMessage` 底层用**结构化克隆算法**把数据**深拷贝**一份送过去。所以主线程 `postMessage(obj)` 之后再改 `obj`，worker 收到的还是发出那一刻的快照；反之亦然。想避免大对象拷贝开销，用 Transferable 移交所有权（见[数据传输页](./guide-line/transfer-offscreen)）。
2. **不是什么都能传**。结构化克隆能搬普通对象、数组、`Date`、`RegExp`、`Map`、`Set`、`ArrayBuffer`、`Blob`、`File`、`ImageData` 等，但**函数、DOM 节点、类的方法/原型链传不过去**——含这些的对象会抛 `DataCloneError`。传数据，不传行为。
3. **通信是异步的**。`postMessage` 发出即返回，不等对方处理；对方的回应过一会儿才经 `onmessage` 到达。所以「发一个请求、等一个响应」需要你自己把请求和响应关联起来（加个 `id`），或者直接用 Comlink 把这套异步往返包成一次 `await`（见[工程模式页](./guide-line/patterns-comlink)）。

## 四、第一个 worker：完整闭环

一个可直接运行的最小例子——主线程发两个数，worker 算乘积送回：

```js
// ---------- main.js（主线程）----------
const worker = new Worker(new URL("./multiply.worker.js", import.meta.url), {
  type: "module",
});

// 收结果（先挂监听，再发消息，避免竞态）
worker.onmessage = (e) => {
  console.log("乘积 =", e.data); // → 乘积 = 12
};

// worker 内部出错时冒泡到这里
worker.onerror = (err) => {
  console.error(`worker 出错：${err.message}（${err.filename}:${err.lineno}）`);
};

// 发计算请求
worker.postMessage([3, 4]);
```

```js
// ---------- multiply.worker.js（worker 端）----------
self.onmessage = (e) => {
  const [a, b] = e.data; // 收到主线程发来的数组拷贝
  self.postMessage(a * b); // 把结果送回主线程
};
```

几个第一次就该记住的点：

- **先挂 `onmessage` 再 `postMessage`**：worker 可能很快就回消息，监听器挂晚了会漏。
- **worker 里更新不了界面**：`multiply.worker.js` 里没有 `document`，算完只能把结果发回主线程，由主线程改 DOM。
- **模块 worker 用 `new URL(...)`**：`new Worker(new URL("./x.worker.js", import.meta.url), { type: "module" })` 是 Vite/Rollup/webpack 都认的写法，打包器会据此单独产出 worker 文件——比字符串路径可靠得多，见[工程模式页](./guide-line/patterns-comlink)。

## 五、何时用、何时别用：一张决策清单

Worker 有实打实的成本（启动要下载解析脚本、通信要序列化拷贝），不是所有活都该往里塞。判断标准只有一条：**这段活是不是「同步、耗时、会卡 UI 的纯计算」**。

**适合下放（同步重计算，且输入输出可序列化）**

- 加解密、哈希、压缩/解压
- 大 JSON/CSV/Protobuf 解析与序列化
- 图像滤镜、缩放、音视频转码、点云/几何处理
- 代码语法高亮、Markdown/模板编译、正则大规模匹配
- 物理模拟、寻路、布局计算、大数组排序统计
- WebAssembly 重计算模块（见 [WASM 叶](/zh/web-advanced/web-api/webassembly/)）

**不适合下放**

- **只是想延后执行**：用 `setTimeout`/`queueMicrotask`/`requestIdleCallback`，别为并行付启动税。
- **任务极短**：一次调用几毫秒的活，worker 的启动 + 两趟消息拷贝可能比计算本身还贵。
- **需要频繁操作 DOM**：worker 够不着 DOM，来回 `postMessage` 改界面反而更慢——DOM 活留在主线程。
- **强耦合共享状态且改动频繁**：来回同步状态的消息开销会吃掉并行收益（除非用 `SharedArrayBuffer`，但那有 COOP/COEP 门槛，见[数据传输页](./guide-line/transfer-offscreen)）。

一个实用的经验值：**主线程上单次同步执行超过约 50ms 的纯计算，就值得考虑 worker**（50ms 是「用户能感知到卡顿」的大致门槛）；低于这个量级，通常不值得。

下一页进入最常用的 **Dedicated Worker** 的完整编程面：构造选项、经典与模块 worker、双向通信、错误处理、销毁与作用域——[专用 Worker](./guide-line/dedicated-worker)。
