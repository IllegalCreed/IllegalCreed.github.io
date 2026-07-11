---
layout: doc
outline: [2, 3]
---

# 参考：三类 worker / API 速查 / 易错点

> 基于 WHATWG HTML 现行标准（Web workers 章）与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **三类 worker**：`Worker`（专用，一页一个）/ `SharedWorker`（共享，多页一实例，靠 `MessagePort`）/ `ServiceWorker`（网络代理型特殊 worker，见 [SW 叶](/zh/web-advanced/web-api/service-worker-pwa/)）。
- **构造**：`new Worker(url, { type, credentials, name })`；`type` = `"classic"`（默认，用 `importScripts`）| `"module"`（用 `import`，**Baseline：Chrome/Edge 80+、Safari 15+、Firefox 114+**）。
- **打包器写法**：`new Worker(new URL("./x.worker.js", import.meta.url), { type: "module" })`。
- **通信**：`postMessage(msg, transferList?)` 发；`onmessage`/`message` 事件收，`e.data` 是**结构化克隆**拷贝；双向对称。
- **传数据三法**：结构化克隆（默认深拷贝）/ Transferable（`postMessage(m, [buf])` 零拷贝移交、原对象 detached）/ `SharedArrayBuffer`（共享内存，需 COOP+COEP）。
- **可转移类型**：`ArrayBuffer`、`MessagePort`、`ImageBitmap`、`OffscreenCanvas`、`ReadableStream`/`WritableStream`/`TransformStream`、`VideoFrame`/`AudioData` 等；**TypedArray 传 `.buffer`**。
- **错误**：`worker.onerror`（`ErrorEvent`：`message`/`filename`/`lineno`）接 worker 内未捕获异常；`messageerror` 接反序列化失败；生产建议在 worker 内 `try/catch` 把错误当消息回传。
- **销毁**：主线程 `worker.terminate()` 强杀；worker 内 `self.close()` 自关；均无优雅收尾事件。
- **作用域**：`self` = `DedicatedWorkerGlobalScope`/`SharedWorkerGlobalScope`；**无 `window`/`document`/`parent`/DOM/localStorage**；有 `fetch`/`WebSocket`/`IndexedDB`/`WebAssembly`/`OffscreenCanvas`/Streams/`crypto`。
- **SharedWorker**：`sw.port` 通信、`onconnect`→`e.ports[0]`、`addEventListener` 时需 `port.start()`；**Firefox 不支持 module 型 SharedWorker**；移动端支持有限；调试走 `chrome://inspect/#workers`。
- **OffscreenCanvas**：`canvas.transferControlToOffscreen()` 交 worker 渲染 / worker 内 `new OffscreenCanvas` + `transferToImageBitmap()`；Chrome 69+/Firefox 105+/Safari 17+，2025 末 Baseline。
- **SharedArrayBuffer**：需 `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp`；`crossOriginIsolated` 自检。
- **Comlink**：~1.1KB（brotli），`Comlink.expose(obj)` / `Comlink.wrap(worker)` 把 worker 调用变 async；回调 `Comlink.proxy(fn)`、移交 `Comlink.transfer(v, [buf])`、配 SharedWorker 用 `sw.port`。
- **同源**：worker 脚本与子 worker 均须同源；跨源脚本触发 `error`（可用内联 blob worker 绕）。
- **成本账**：启动（下载解析脚本 + 建上下文，几~几十 ms）+ 通信（序列化拷贝）都不免费；**单次同步 > ~50ms 才值得下放**，高频用 worker 池。
- **边界**：WASM 在 worker 跑见 [WebAssembly 叶](/zh/web-advanced/web-api/webassembly/)；worker 内持久存储用 [IndexedDB 叶](/zh/web-advanced/web-api/indexeddb/)（无 Web Storage）。

## 一、三类 worker 对比

| 维度 | `Worker`（专用） | `SharedWorker`（共享） | `ServiceWorker`（服务） |
| --- | --- | --- | --- |
| 谁能连 | 仅创建它的页面 | 同源多个页面/标签/iframe | 注册作用域内所有页面 |
| 实例数 | 一页一个 | 多页共享一个 | 作用域一个 |
| 通信 | `worker.postMessage` 直连 | 经 `sw.port`（`MessagePort`） | `postMessage` + 事件/`Clients` |
| 生命周期 | 随创建它的文档 | 只要还有页面连着就活 | **独立于页面**，可被唤醒/回收 |
| 主要用途 | 后台计算 | 跨标签共享连接/状态/缓存 | 网络代理、离线缓存、推送 |
| `terminate()` | 有 | 无（`self.close`） | **无**（浏览器托管） |
| 模块类型 | 全支持（FF 114+） | **Firefox 不支持 module 型** | 支持 |
| 本站 | [专用 Worker](./guide-line/dedicated-worker) | [共享 Worker](./guide-line/shared-worker) | [SW 与 PWA 叶](/zh/web-advanced/web-api/service-worker-pwa/) |

## 二、Worker 构造与 API 速查

### 2.1 构造选项

| 选项 | 取值 | 说明 |
| --- | --- | --- |
| `type` | `"classic"`（默认）/ `"module"` | 决定 worker 内用 `importScripts` 还是 `import` |
| `credentials` | `omit`/`same-origin`/`include` | 模块 worker 拉取脚本时的凭据策略 |
| `name` | 字符串 | worker 名，`self.name` 可读、调试面板可见 |

### 2.2 `Worker` 实例成员

| 成员 | 说明 |
| --- | --- |
| `postMessage(msg, transfer?)` | 向 worker 发消息；`transfer` 为可选移交列表 |
| `terminate()` | 立即强杀 worker，无收尾 |
| `onmessage` / `message` 事件 | 收 worker 发来的消息，`e.data` 为拷贝 |
| `onmessageerror` / `messageerror` | 消息无法反序列化时触发 |
| `onerror` / `error` 事件 | worker 内未捕获异常冒泡，`ErrorEvent` |

### 2.3 worker 内（`self` / `WorkerGlobalScope`）

| 成员 | 说明 |
| --- | --- |
| `self.postMessage(msg, transfer?)` | 向创建它的页面发消息 |
| `self.onmessage` / `onmessageerror` | 收主线程消息 / 反序列化失败 |
| `self.onerror` | worker 自身未捕获异常 |
| `self.close()` | worker 自我关闭 |
| `self.name` | 构造时传入的 `name` |
| `importScripts(...urls)` | **仅经典 worker**，同步加载外部脚本，失败抛 `NetworkError` |

### 2.4 `SharedWorker` 与 `MessagePort`

| 成员 | 说明 |
| --- | --- |
| `new SharedWorker(url, { type, name })` | 创建/连接共享 worker |
| `sw.port` | 与该实例通信的 `MessagePort` |
| `port.postMessage(msg, transfer?)` | 发消息 |
| `port.onmessage` | 收消息（属性赋值隐式 `start`） |
| `port.start()` | 开闸；用 `addEventListener` 监听时**必须**调 |
| `port.close()` | 断开本端口 |
| worker 内 `onconnect` | 新页面连上触发，`e.ports[0]` 为该连接端口 |

## 三、可转移类型表

| 类型 | 说明 |
| --- | --- |
| `ArrayBuffer` | 大块二进制；TypedArray 传其 `.buffer` |
| `MessagePort` | 通信端口（`MessageChannel`、SharedWorker port） |
| `ImageBitmap` | 已解码位图，配 `bitmaprenderer` 上屏 |
| `OffscreenCanvas` | 把 canvas 渲染控制权交给 worker |
| `ReadableStream` / `WritableStream` / `TransformStream` | 流的一端跨线程移交 |
| `VideoFrame` / `AudioData` | WebCodecs 帧数据 |
| `MediaStreamTrack` / `RTCDataChannel` | 媒体轨 / WebRTC 数据通道 |

> 不在表内的（普通对象、`Date`、`Map`/`Set`、`Blob`、TypedArray 视图本身）只能被**克隆**，不能被转移。

## 四、结构化克隆 vs Transfer vs SharedArrayBuffer

| 维度 | 结构化克隆 | Transferable 移交 | `SharedArrayBuffer` |
| --- | --- | --- | --- |
| 语义 | 深拷贝一份 | 移交所有权 | 共享同一块内存 |
| 内存 | 两份 | 一份（搬家） | 一份（两线程都映射） |
| 原对象 | 仍可用 | **detached 失效** | 仍可用（就是共享的） |
| 速度 | 随大小线性变慢 | 零拷贝、近乎瞬时 | 无需传输 |
| 语法 | `postMessage(m)` | `postMessage(m, [buf])` | `postMessage(sab)`（不放 transfer 列表） |
| 门槛 | 无 | 无 | **需 COOP + COEP** |
| 适用 | 小对象、结果 | 大 buffer / 位图 / canvas | 高频共享同一状态 |

## 五、worker 内可用 / 不可用 API

| ✅ 可用 | ❌ 不可用 |
| --- | --- |
| `self`、`location`、`navigator` | `window`、`parent`、`frames` |
| `setTimeout`/`setInterval`/`queueMicrotask` | `document` 与任何 DOM 节点 |
| `fetch`、`XMLHttpRequest`、`WebSocket`、`EventSource` | `alert`/`confirm`/`prompt` |
| `IndexedDB`、`caches`（Cache API） | **`localStorage` / `sessionStorage`**（Web Storage 不可用） |
| `WebAssembly`、`crypto`（Web Crypto） | 直接操作 `<canvas>` DOM 元素 |
| `OffscreenCanvas`、`createImageBitmap` | |
| `ReadableStream`/`WritableStream`/`TransformStream` | |
| `importScripts`（经典）/ `import`（模块） | |

> worker 里要「持久键值存储」用 `IndexedDB`（[IndexedDB 叶](/zh/web-advanced/web-api/indexeddb/)）顶替不可用的 Web Storage；要更新界面把结果 `postMessage` 回主线程改 DOM。

## 六、易错点清单

- **在 worker 里找 DOM**：worker 没有 `window`/`document`——把结果发回主线程改 DOM，别在 worker 里碰界面。
- **postMessage 传函数/DOM 节点/类实例的方法**：抛 `DataCloneError` / 方法丢失——只传纯数据，行为在对面重建。
- **传大 buffer 只靠克隆**：几十 MB 深拷贝又慢又翻倍内存——放 transfer 列表 `postMessage(m, [buf])` 零拷贝。
- **transfer 后还用原对象**：移交后 `buf` 已 detached，读到 0、写即抛错——要保留就先 `structuredClone` 留副本。
- **忘了 `port.start()`**：SharedWorker 用 `addEventListener("message")` 却没 `start()`，消息永远不来——改属性赋值或补 `start()`。
- **给 SharedWorker 传 `type:"module"` 还要兼容 Firefox**：Firefox 不支持 module 型 SharedWorker——回落经典脚本。
- **假设移动端支持 SharedWorker**：支持有限——上线前实测 + 备降级（每标签各自专用 worker）。
- **裸字符串路径建 worker**：`new Worker("./x.js")` 打包后路径易错——用 `new URL("./x.js", import.meta.url)`。
- **经典 worker 里写 `import`**：语法错误——经典 worker 用 `importScripts`，或改 `type:"module"`。
- **在 worker 内用 `localStorage`**：不可用——用 `IndexedDB`/`caches`。
- **依赖 `onerror` 拿业务错误**：拿不到结构化上下文——worker 内 `try/catch` 把 `{ ok, error }` 当消息回传。
- **`error` 与 `messageerror` 混为一谈**：前者是 worker 代码抛异常，后者是消息反序列化失败——分别处理。
- **每次任务都新建 worker**：启动成本乘以次数——长期任务复用同一个或用 worker 池。
- **短任务也下放**：几 ms 的活，启动 + 通信比计算还贵——`setTimeout` 就够，别用 worker。
- **想「延后」却用了 worker**：worker 是「并行」不是「延后」——延后用 `setTimeout`/`requestIdleCallback`。
- **用 `SharedArrayBuffer` 没发 COOP/COEP**：直接不可用——先发两个头、`crossOriginIsolated` 自检。
- **OffscreenCanvas 不做兼容检测**：老 Safari（<17）缺失——`"OffscreenCanvas" in window` 检测 + 回落主线程渲染。
- **worker 里跑 WASM 却在本叶找细节**：编译/实例化/内存模型见 [WebAssembly 叶](/zh/web-advanced/web-api/webassembly/)——本叶只讲 worker 编程面。

## 七、权威链接

- [MDN: Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) —— 总览与指南入口
- [MDN: Using web workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) —— 官方完整教程
- [MDN: Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker) ｜ [SharedWorker](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker) —— 两类 worker 接口
- [MDN: Transferable objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects) —— 可转移对象与移交语义
- [MDN: OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) ｜ [ImageBitmap](https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap) —— 把渲染卸到 worker
- [MDN: Functions and classes available to Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Functions_and_classes_available_to_workers) —— worker 内可用 API 全表
- [MDN: SharedArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/API/SharedArrayBuffer) ｜ [跨源隔离](https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated) —— 共享内存与 COOP/COEP
- [WHATWG HTML 标准：Web workers 章](https://html.spec.whatwg.org/multipage/workers.html) —— 规范原文
- [GoogleChromeLabs/comlink](https://github.com/GoogleChromeLabs/comlink) —— RPC 封装库
- 本站相邻内容：[WebAssembly 叶](/zh/web-advanced/web-api/webassembly/) ｜ [IndexedDB 叶](/zh/web-advanced/web-api/indexeddb/) ｜ [Service Worker 与 PWA 叶](/zh/web-advanced/web-api/service-worker-pwa/)
