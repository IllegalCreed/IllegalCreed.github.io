---
layout: doc
---

# Web Workers API

Web Workers 是浏览器把 **JavaScript 搬到主线程之外的后台线程**运行的标准机制：worker 有独立的全局作用域（`self`／`WorkerGlobalScope`）、独立的事件循环，与主线程之间**只能靠 `postMessage` 传消息**（结构化克隆拷贝，或 Transferable 零拷贝移交），不共享变量、也**碰不到 DOM**。规范上它属于 **WHATWG HTML 现行标准的「Web workers」章**——基础的专用 Worker（Dedicated）自 2015 年起就是 Baseline，`{ type: "module" }` 模块 worker 随 Firefox 114（2023 中）补齐而进入 Baseline，`SharedWorker`（多页共享单实例）与 `OffscreenCanvas`（把 canvas 渲染卸到 worker）也已在主流浏览器落地。本叶专注**浏览器 Worker 的编程面**：三类 worker 的定位、`postMessage` 心智模型、双向通信与错误处理、数据传输与所有权移交、以及 Comlink 把裸消息收发变成 async 调用的工程模式。

> 边界：**WASM 在 worker 里跑**只在需要时点一句、深入见 [WebAssembly 叶](/zh/web-advanced/web-api/webassembly/)；**Service Worker** 是一种「特殊 worker」（网络代理 + 生命周期），本叶只在对比时点到，完整生命周期见 [Service Worker 与 PWA 叶](/zh/web-advanced/web-api/service-worker-pwa/)。

## 评价

**优点**

- **真并行，主线程不阻塞**：把加解密、图像/音视频处理、大 JSON 解析、物理/布局计算等 CPU 密集活挪进 worker，主线程专心响应输入与渲染，60fps 不掉帧——这是 worker 唯一但决定性的价值
- **隔离干净、心智简单**：worker 无共享内存（`SharedArrayBuffer` 除外）、无锁、无数据竞争，一切靠消息传递，比多数语言的线程模型好写得多
- **传大数据可零拷贝**：`ArrayBuffer`／`OffscreenCanvas`／`ImageBitmap` 等 Transferable 对象能**移交所有权**而非深拷贝，几十 MB 缓冲区跨线程近乎免费
- **能力可观**：worker 内有 `fetch`、`WebSocket`、`IndexedDB`、`WebAssembly`、`OffscreenCanvas`、Streams、`Cache` 等——足以承载完整的数据层与渲染层，只是没有 DOM
- **有共享与卸载两张王牌**：`SharedWorker` 让多个标签页共用一个后台实例（单一 WebSocket、统一状态），`OffscreenCanvas` 把 WebGL/2D 渲染整个搬进 worker

**局限**

- **通信有成本、有边界**：`postMessage` 走结构化克隆——**函数、DOM 节点、类的方法都传不过去**（`DataCloneError`）；大对象深拷贝本身也耗时，不是所有活都值得下放
- **启动不是免费的**：新建 worker 要下载并解析脚本、建独立上下文，冷启动几毫秒到几十毫秒；短平快的小任务下放反而更慢
- **裸 API 样板重**：`postMessage` + `onmessage` + 手工 `switch(type)` 路由 + 手工关联请求响应，写多了又臭又长——工程上几乎必配 [Comlink](https://github.com/GoogleChromeLabs/comlink) 这类 RPC 封装
- **共享内存门槛高**：`SharedArrayBuffer` 需要页面发送 **COOP + COEP 两个响应头**（Spectre 缓解后的硬门槛），部署不满足就用不了
- **SharedWorker 兼容性参差**：桌面主流支持，但 **Firefox 不支持 `{ type: "module" }` 的 SharedWorker**，移动端支持也有限——用前必须验目标环境

一句话选型：**页面上有一段会「卡住」用户的同步 JS 计算，就把它挪进 Worker**；要在多标签页间共享一条长连接/一份状态用 `SharedWorker`；要把复杂图形渲染搬离主线程用 `OffscreenCanvas`；一旦通信超过三五条消息，就上 Comlink 把它变成普通 async 函数调用。反过来，只是想「延后执行」而非「并行计算」，`setTimeout`／`requestIdleCallback` 就够，别为它付 worker 的启动与通信税。

## 本叶地图

- [入门](./getting-started) —— 三类 worker（Dedicated／Shared／Service）定位与选择、`postMessage` 心智模型（消息传递而非共享内存）、「主线程不阻塞」到底意味着什么、何时用与何时别用
- [专用 Worker](./guide-line/dedicated-worker) —— `new Worker` 构造、经典 vs 模块 worker（`type: "module"` 与 `importScripts`）、双向 `postMessage`／`onmessage`、结构化克隆传值、`onerror`／`messageerror` 错误处理、`terminate()` 与 `self.close()`、worker 内可用的 API 范围
- [共享 Worker](./guide-line/shared-worker) —— `SharedWorker` 与 `onconnect`／`MessagePort`／`port.start()`、多页多标签共享单实例、`chrome://inspect` 调试、Comlink 配 `port` 用法、Firefox 对 module SharedWorker 的限制
- [数据传输与 OffscreenCanvas](./guide-line/transfer-offscreen) —— 结构化克隆 vs Transferable 所有权移交（转移后原对象 detached）、可转移类型清单、`SharedArrayBuffer` 与 COOP/COEP 头、`OffscreenCanvas` 把渲染卸到 worker、`ImageBitmap`
- [工程模式与 Comlink](./guide-line/patterns-comlink) —— 裸 `postMessage` 样板痛点、Comlink 用 `Proxy` 把 worker 调用变 async 函数、自动处理 transferable、worker 池模式、Vite 的 `new Worker(new URL(...), { type: "module" })` 导入、何时不值得下放
- [参考](./reference) —— 三类 worker 对比表、Worker API 速查、可转移类型表、结构化克隆 vs transfer 对比、worker 内可用/不可用 API、易错点清单、资源链接

## 文档地址

[MDN Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)

## GitHub 地址

[whatwg/html](https://github.com/whatwg/html)（HTML 现行标准仓库，「Web workers」章为规范原文）

## 幻灯片地址

<a href="/SlideStack/web-workers-slide/" target="_blank">Web Workers API</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=web-workers-api" target="_blank" rel="noopener noreferrer">Web Workers API 测试题</a>
