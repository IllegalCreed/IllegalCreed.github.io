---
layout: doc
outline: [2, 3]
---

# 共享 Worker：多标签共享单实例

> 基于 WHATWG HTML 现行标准（Web workers 章）与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **一句话定位**：`SharedWorker` 是**同源多个页面/标签/iframe 共享的同一个 worker 实例**——专用 worker 是「一页一个」，共享 worker 是「多页一个」。
- **解决什么**：多标签共用**一条 WebSocket / SSE 长连接**、一份内存状态、一个计算缓存，省掉「每个标签各连各的」的重复与不一致。
- **构造**：`const sw = new SharedWorker("shared.js", { type, name })`；不像专用 worker 直接 `postMessage`，而是**通过 `sw.port`（一个 `MessagePort`）通信**。
- **主线程侧**：`sw.port.postMessage(data)` 发、`sw.port.onmessage = …` 收；用 `addEventListener` 监听时**必须 `sw.port.start()`** 手动开闸。
- **worker 侧入口是 `onconnect`**：每有一个新页面连上就触发一次；`const port = e.ports[0]` 拿到这条连接的端口，再在 `port` 上收发。
- **`port.start()` 时机**：用 `port.onmessage = …` 赋值会**隐式**开闸；用 `port.addEventListener("message", …)` 则**必须显式** `port.start()`，否则消息永远不来。
- **单实例、多端口**：worker 只有一个（全局状态共享），但每个连接的页面各自持有一条 `MessagePort`；worker 要**自己维护端口列表**才能广播给所有页面。
- **生命周期**：只要**还有一个页面**连着，共享 worker 就活着；所有页面都关闭/断开后它被回收。
- **广播模式**：worker 把每个 `onconnect` 拿到的 `port` 存进数组，状态变化时遍历数组逐个 `port.postMessage`——这是多标签同步的核心手法。
- **兼容性**：桌面 Chrome/Edge/Firefox/Safari 支持普通 `SharedWorker`；**Firefox 不支持 `{ type: "module" }` 的 SharedWorker**（普通脚本型可用）；**移动端支持有限**，用前必须验目标环境。
- **调试**：Chrome/Edge 开 `chrome://inspect/#workers`（或 `edge://inspect`）能看到并 inspect 共享 worker；Firefox 用 `about:debugging#workers`。共享 worker 不挂在某个标签的 DevTools 上，得从这里进。
- **Comlink 配 port**：主线程 `Comlink.wrap(sw.port)`；worker 内 `onconnect = (e) => Comlink.expose(api, e.ports[0])`——把多端口 RPC 也变成 async 调用。
- **vs BroadcastChannel**：只要**广播同源消息**用更简单的 `BroadcastChannel`；需要**共享计算/状态/单一连接**（有「主」逻辑）才用 SharedWorker。
- **vs Service Worker**：SW 也能跨标签共享，但它是网络代理、生命周期独立、会被浏览器随时唤醒/回收，不适合存易失内存状态；持久共享状态 + 长连接才是 SharedWorker 的地盘（SW 见 [SW 叶](/zh/web-advanced/web-api/service-worker-pwa/)）。
- **错误与关闭**：`sw.onerror` 接错误；单个页面 `port.close()` 断开自己；worker 内可 `self.close()` 关整个实例。
- **同源约束**：所有连接方必须与 worker 脚本严格同源，跨源拿不到同一实例。

## 一、专用 vs 共享：从「一对一」到「多对一」

专用 worker 的模型是「一个页面独占一个 worker」——你开三个标签，就有三个互不相干的 worker，各算各的。共享 worker 把它翻转成「**多个页面连同一个 worker**」：

```
专用 Worker                     共享 SharedWorker
标签A ── Worker①                标签A ─┐
标签B ── Worker②                标签B ─┼─ port ─→ 同一个 SharedWorker（单实例）
标签C ── Worker③                标签C ─┘         （共享内存/状态/连接）
```

这带来一个专用 worker 给不了的能力：**跨标签页共享状态与资源**。最典型的场景——一个 Web 应用开了多个标签，你不希望每个标签各建一条 WebSocket（服务器要扛 N 倍连接、消息还要在标签间对齐）。用共享 worker，让**唯一的实例**持有那条 WebSocket，所有标签通过各自的 port 复用它：

- 消息来了，worker 广播给所有连着的标签；
- 任一标签要发消息，通过 port 交给 worker、由 worker 统一发出；
- 服务器眼里永远只有一条连接。

代价是通信模型更绕（多了 `port` 和 `onconnect` 一层），且兼容性不如专用 worker（见第五节）。

## 二、通信模型：port 与 onconnect

共享 worker 不能像专用 worker 那样直接 `worker.postMessage`——因为它要区分「消息来自哪个页面」。答案是 **`MessagePort`**：每个连上来的页面，主线程侧拿到 `sw.port`，worker 侧在 `onconnect` 里拿到对应的 `e.ports[0]`，两端靠这条**专属端口**通信。

**主线程侧**：

```js
// 每个页面都这样连（同源的话拿到的是同一个 worker 实例）
const sw = new SharedWorker(
  new URL("./shared.worker.js", import.meta.url),
  { type: "module", name: "app-hub" },
);

// 通过 port 收发；用 onmessage 赋值会【隐式】start，无需手动 start
sw.port.onmessage = (e) => {
  console.log("收到共享 worker 广播：", e.data);
};

// 发消息给共享 worker
sw.port.postMessage({ type: "subscribe", topic: "prices" });

// ⚠️ 若改用 addEventListener 监听，必须显式开闸：
// sw.port.addEventListener("message", handler);
// sw.port.start(); // 否则消息永远不会到达
```

**worker 侧**（入口是 `onconnect`，每个新页面连上触发一次）：

```js
// ---------- shared.worker.js ----------
const ports = new Set(); // 维护所有连上来的端口，才能广播

self.onconnect = (e) => {
  const port = e.ports[0]; // 这个新页面对应的端口
  ports.add(port);

  port.onmessage = (msg) => {
    // 处理来自某个页面的消息
    if (msg.data.type === "subscribe") {
      // …订阅逻辑…
    }
  };

  // 用 onmessage 赋值时隐式 start；若用 addEventListener 则需 port.start()
  port.start();
};

// 状态变化时广播给所有页面（这就是多标签同步的核心）
function broadcast(data) {
  for (const port of ports) port.postMessage(data);
}
```

`port.start()` 的规则值得单独记：**`port.onmessage = fn`（属性赋值）会隐式开闸**；**`port.addEventListener("message", fn)` 不会，必须再调 `port.start()`**。忘了 start 是共享 worker「消息发了收不到」最常见的坑。

## 三、实战：多标签共享一条 WebSocket

把共享 worker 最经典的用途写全——唯一实例持有 WebSocket，所有标签复用：

```js
// ---------- ws-hub.worker.js（共享 worker）----------
const ports = new Set();
let socket;

// 懒建：第一个页面连上时才真正建立 WebSocket
function ensureSocket() {
  if (socket) return;
  socket = new WebSocket("wss://example.com/live"); // worker 里可用 WebSocket
  socket.onmessage = (e) => {
    // 服务器来消息 → 广播给所有标签
    for (const port of ports) port.postMessage({ type: "data", payload: e.data });
  };
}

self.onconnect = (e) => {
  const port = e.ports[0];
  ports.add(port);
  ensureSocket();

  port.onmessage = (msg) => {
    if (msg.data.type === "send") {
      socket?.send(msg.data.payload); // 任一标签发消息，由唯一连接统一发出
    }
  };
  port.start();
};
```

```js
// ---------- 任意页面 main.js ----------
const sw = new SharedWorker(new URL("./ws-hub.worker.js", import.meta.url), {
  type: "module",
});
sw.port.onmessage = (e) => {
  if (e.data.type === "data") render(e.data.payload); // 收到推送
};
// 这个标签要发东西，交给 hub 统一发
document.querySelector("#send").onclick = () => {
  sw.port.postMessage({ type: "send", payload: "hello" });
};
```

效果：开多少个标签，服务器都只看到**一条** WebSocket；消息到达时所有标签同步收到；任一标签发送都走同一条连接。这是 `BroadcastChannel`（只能标签间转发消息、没有「持有连接」的中心）做不到的。

## 四、Comlink 配 SharedWorker：把 port 也 RPC 化

共享 worker 的 `port` 一样能交给 Comlink，把多端口的手工消息路由变成 async 方法调用（Comlink 详见[工程模式页](./patterns-comlink)）：

```js
// ---------- shared.worker.js ----------
import * as Comlink from "comlink";

const api = {
  counter: 0,
  inc() { this.counter++; return this.counter; },
};

self.onconnect = (e) => {
  // 关键：把这条连接的端口交给 Comlink 暴露 api
  Comlink.expose(api, e.ports[0]);
};
```

```js
// ---------- main.js ----------
import * as Comlink from "comlink";

const sw = new SharedWorker(new URL("./shared.worker.js", import.meta.url), {
  type: "module",
});
// 关键：wrap 的是 sw.port，不是 sw 本身
const api = Comlink.wrap(sw.port);

await api.inc(); // 像调本地 async 函数一样调共享 worker
console.log(await api.counter); // 多标签共享同一个 counter
```

记住两个「配 port」的差异点：主线程 `Comlink.wrap(sw.port)`（不是 `sw`），worker 内 `Comlink.expose(api, e.ports[0])`（多传一个端口参数）。

## 五、兼容性与调试：用前必看

共享 worker 的支持面明显窄于专用 worker，这是选型时绕不开的现实：

- **桌面**：Chrome、Edge、Firefox、Safari 都支持**普通（脚本型）** `SharedWorker`。
- **Firefox 的模块限制**：**Firefox 不支持 `{ type: "module" }` 的 SharedWorker**——要兼容 Firefox 就别给共享 worker 传 `type: "module"`，回落经典脚本 + `importScripts`。这一点和专用 worker 不同（专用 worker 的模块类型 Firefox 114+ 已支持）。
- **移动端**：支持有限、历史上长期缺位，**上线前务必在目标移动浏览器实测**，并准备「不支持就回落到每标签各自专用 worker / 各自连接」的降级路径。

**调试**：共享 worker 不属于任何单个标签，普通 DevTools 的 Sources 面板里找不到它，得走专门入口：

```text
Chrome / Edge：地址栏输入  chrome://inspect/#workers   （Edge 为 edge://inspect）
                → 找到你的 SharedWorker → 点 inspect 打开独立调试器
Firefox：地址栏输入        about:debugging#workers
                → This Firefox → 找到 Shared Workers → Inspect
```

在这个独立调试器里能下断点、看 console、查网络——和调普通脚本一样。共享 worker「改了代码不生效」时，记得它可能还活着（有别的标签连着），需要关掉所有连接的标签或在调试器里手动 terminate 让它重建。

## 六、什么时候用 SharedWorker，什么时候别用

| 需求 | 更合适的选择 |
| --- | --- |
| 只是把同源消息**广播**到其他标签 | `BroadcastChannel`（更简单，无需 worker 脚本） |
| 多标签**共享一条长连接 / 一份内存状态 / 一个计算中心** | **SharedWorker** |
| **离线缓存、请求拦截、推送**（网络代理，生命周期独立） | Service Worker（见 [SW 叶](/zh/web-advanced/web-api/service-worker-pwa/)） |
| 单页面内的**纯后台计算** | 专用 Worker（见[专用 Worker 页](./dedicated-worker)） |
| 需要跨标签**持久化**存储 | `IndexedDB`（见 [IndexedDB 叶](/zh/web-advanced/web-api/indexeddb/)），可配 SharedWorker 做协调 |

判断口诀：**要不要一个「有状态的中心」**？要（一条连接、一份缓存、一个协调者）→ SharedWorker；不要、只是消息转发 → BroadcastChannel；是网络层的事 → Service Worker。再叠加兼容性现实：**目标含 Firefox 就别用 module 型、含移动端就先验证并备降级**。

下一页看跨线程**高效传大数据**与**把渲染搬进 worker**——[数据传输与 OffscreenCanvas](./transfer-offscreen)。
