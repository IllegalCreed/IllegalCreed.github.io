---
layout: doc
outline: [2, 3]
---

# MessageChannel 与 MessagePort：私有双向管道

> 基于 WHATWG HTML（跨文档消息 / 通道消息 / 广播频道）现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **定位**：`MessageChannel` 建一条**私有双向管道**，两端是一对 `MessagePort`；把一端**转移**给 `<iframe>` / Worker，两个上下文即可点对点直连，不再挤在同一个 `window.onmessage`。
- **创建**：`const { port1, port2 } = new MessageChannel();`——两个 port 由管道连通（entangled），一端发、另一端收。
- **收发**：`port.postMessage(data, transfer?)` 发；`port.onmessage = (e) => e.data` 或 `port.addEventListener("message", ...)` 收。
- **`port.start()` 坑（本页核心）**：MDN 原文「only needed when using `EventTarget.addEventListener`; it is implied when using `onmessage`」——用 `addEventListener("message")` **必须显式 `port.start()`**，只有 `onmessage = ` 赋值才隐式启动。
- **为什么**：端口的消息队列**初始是禁用（disabled）的**；`start()` 或首次设 `onmessage` 才启用，之后消息才被派发。漏掉 `start()` = 一条都收不到、且不报错。
- **转移 port**：`目标.postMessage(初始数据, targetOrigin/transfer, [port2])`——第三参数（窗口）或第二参数（Worker）的 transfer 列表放 `port2`。
- **接收 port**：对端在 `message` 事件里从 `event.ports[0]` 取出转移来的 port，再挂 `onmessage`（或 `addEventListener` + `start()`）。
- **端口独属一个上下文**：`MessagePort` 是 **Transferable**，**转移后原上下文里那个 port 立即失效（neutered）**，只能在新宿主用——一个 port 同一时刻只属于一个上下文。
- **`window.postMessage` vs `port.postMessage`**：前者带 `targetOrigin` 且撞在全局 `window.onmessage`；后者只在这对 port 间流动、**无 `targetOrigin` 参数**（管道已私有）。
- **`close()`**：`port.close()` 断开端口、停止收发、利于回收；一端关另一端发消息不再送达。
- **`messageerror` 事件**：收到无法反序列化（结构化克隆失败）的消息时触发，与 `message` 分开处理。
- **典型用途**：给每个 Worker 任务开独立通道多路复用、让两个 `<iframe>` / 两个 Worker **不经主线程中转直连**、RPC 库（如 Comlink）的底座。
- **结构化克隆 + transfer**：`port.postMessage` 同样走结构化克隆，也支持第二参数 transfer 零拷贝移交（含再转移别的 port）。
- **多次转移**：port 可被再转移（A→B→C），每次转移后前一持有者失效；但同一时刻只能有一个活跃持有者。
- **Baseline**：`MessageChannel` / `MessagePort` 自 2015-09 起 Baseline Widely available，Worker 内也可用。

## 一、为什么要 MessageChannel：从「公共广场」到「专线」

`window.postMessage` 的所有消息都撞在接收窗口**同一个** `window.onmessage` 上——多个来源、多种消息混在一起，得靠 `origin` + `type` 分拣，像在公共广场喊话。

`MessageChannel` 给你一条**专线**：`new MessageChannel()` 一次造出**一对用管道连通的 `MessagePort`**（`port1` / `port2`）。留一端自用、把另一端转移给对端，之后两端各用自己的 port 收发，消息**只在这对 port 之间流动**，互不干扰。好处：

- **多路复用**：给每个子任务 / 每个 Worker 请求开一条独立通道，天然隔离。
- **直连**：把两端分别交给两个 `<iframe>`（或两个 Worker），它们可**不经主线程中转**直接通信。
- **RPC 底座**：请求 / 响应式封装（Comlink 等）就建在成对 port 上。

```js
// 一次造出一对连通的端口
const channel = new MessageChannel();
channel.port1; // 我方留用
channel.port2; // 待转移给对端
```

## 二、收发：postMessage 与 onmessage

同一个页面内先感受收发（两端都在本上下文，仅演示 API）：

```js
const { port1, port2 } = new MessageChannel();

// port2 端收
port2.onmessage = (event) => {
  console.log("port2 收到：", event.data);
  port2.postMessage("port2 回复：已收到");
};

// port1 端收
port1.onmessage = (event) => {
  console.log("port1 收到：", event.data);
};

// port1 端发——消息只会到 port2，不会撞到别处
port1.postMessage("port1 发：你好");
```

与 `window.postMessage` 的关键差别：

- `port.postMessage(data)` **没有 `targetOrigin` 参数**——管道已经是私有专线，不需要再限定收方源。
- 消息只在**这一对** port 间流动，不会广播到 `window.onmessage`。

## 三、`port.start()`：本页头号坑

`MessagePort` 的消息队列**初始是禁用的**（WHATWG 原文：「A port message queue can be enabled or disabled, and is initially disabled」）。队列没启用，消息进不来。启用它有两种方式，**行为不同**：

```js
// 方式 A：赋值 onmessage —— 隐式启用队列（等同自动调用了 start()）
port.onmessage = (e) => console.log(e.data); // ✅ 立刻开始收

// 方式 B：addEventListener —— 必须显式 start()，否则永远收不到
port.addEventListener("message", (e) => console.log(e.data));
port.start(); // ⭐ 少了这一行，回调一次都不触发，且不报错
```

MDN 对 `start()` 的原话（直译）：「Starts the sending of messages queued on the port（**only needed when using `EventTarget.addEventListener`; it is implied when using `onmessage`**）」。WHATWG 补充：「The first time a MessagePort object's `onmessage` IDL attribute is set, the port's port message queue must be enabled, as if the `start()` method had been called」。

一句话记牢：

- **`port.onmessage = fn`** → 自动 `start()`，直接能收。
- **`port.addEventListener("message", fn)`** → **必须手动 `port.start()`**。

这是「代码看着没错、一条消息都收不到、又不报任何错」的经典排查点——用 `addEventListener` 风格时，检查是否漏了 `start()`。

## 四、把 port 转移出去：建立真正的跨上下文直连

单页内的一对 port 意义不大；`MessageChannel` 的威力在于**把一端转移给另一个上下文**。转移用 `postMessage` 的 **transfer 列表**（Transferable 机制）：

### 4.1 主页面 ↔ `<iframe>` 直连

```js
// 父页面：造通道，留 port1，把 port2 转移给 <iframe>
const iframe = document.querySelector("iframe");
const channel = new MessageChannel();

// 我方用 port1 收发（onmessage 隐式 start）
channel.port1.onmessage = (event) => {
  console.log("父页面经专线收到：", event.data);
};

iframe.addEventListener("load", () => {
  // 用一次 window.postMessage 把 port2 转移过去：
  //   第二参数是 targetOrigin，第三参数 transfer 列表放 port2
  iframe.contentWindow.postMessage("端口交付", "https://widget.example", [channel.port2]);
});

// 之后就用 port1 发，走专线，不再撞全局 window.onmessage
channel.port1.postMessage({ type: "ping" });
```

```js
// <iframe> 侧：从 event.ports[0] 取出转移来的 port2
window.addEventListener("message", (event) => {
  if (event.origin !== "https://host.example") return; // 转移这一步仍要校验来源
  const port = event.ports[0]; // 拿到 port2
  port.onmessage = (e) => {
    // onmessage 赋值 → 隐式 start，直接能收
    console.log("<iframe> 经专线收到：", e.data);
    port.postMessage({ type: "pong" });
  };
});
```

要点：

- **转移那一次 `window.postMessage` 仍要遵守 postMessage 安全**——`targetOrigin` 写明、接收端校验 `event.origin`（见 [postMessage 页](./postmessage)）。握手完成后，专线上的后续消息才不必再带 `targetOrigin`。
- 对端从 **`event.ports[0]`** 取 port（`ports` 是数组，转移几个取几个）。

### 4.2 主页面 ↔ Worker（及 Worker ↔ Worker 直连）

Worker 的 `postMessage` 签名是 `postMessage(message, transfer?)`（无 `targetOrigin`），transfer 是第二参数：

```js
// 主线程：把 port2 交给 worker
const worker = new Worker("worker.js");
const channel = new MessageChannel();
channel.port1.onmessage = (e) => console.log("主线程收到：", e.data);
worker.postMessage({ type: "port" }, [channel.port2]); // 第二参数 transfer

channel.port1.postMessage("主线程经专线问候");
```

```js
// worker.js
self.onmessage = (event) => {
  const port = event.ports[0];
  port.onmessage = (e) => {
    console.log("worker 经专线收到：", e.data);
    port.postMessage("worker 已回复");
  };
};
```

把两个 port 分别交给**两个不同的 Worker**，它们就能**绕过主线程直接通信**——主线程只负责牵线、不做转发中转，这是 `MessageChannel` 相对纯 `postMessage` 的独特能力。

## 五、端口只属一个上下文：转移即失效

`MessagePort` 是 **Transferable 对象**。转移的本质是**移交所有权**——WHATWG / MDN 原义：「A port, after it is sent, can no longer be used by the original context」（端口一经发送，原上下文即不可再用它）。

```js
const channel = new MessageChannel();
iframe.contentWindow.postMessage("交付", "*", [channel.port2]);

// ❌ port2 已转移，本上下文里它已 neutered（失效）
channel.port2.postMessage("still here?"); // 抛错 / 无效
```

推论：

- **一个 port 同一时刻只属于一个上下文**——转移给谁，就只有谁能用。
- port 可以**多次接力转移**（A→B→C），但每转移一次，前一持有者立即失效；任一时刻只有一个活跃持有者。
- 这套语义和 `postMessage` 转移 `ArrayBuffer`（转移后 `byteLength` 变 0）完全一致——都是零拷贝移交所有权。

## 六、close 与 messageerror

- **`port.close()`**：断开这一端，停止收发，利于垃圾回收。一端 `close` 后，另一端再 `postMessage` 不会送达（也不报错）。通道用完（一次性 RPC 完成、组件卸载）应主动 `close`，避免端口悬挂。
- **`messageerror` 事件**：当收到一条**无法反序列化**（结构化克隆失败）的消息时，在 port（或 `window`）上触发，与正常 `message` 分开：

```js
port.addEventListener("message", (e) => handle(e.data));
port.addEventListener("messageerror", (e) => {
  console.error("收到无法反序列化的消息", e); // 单独处理坏消息
});
port.start(); // addEventListener 风格：别忘了 start()
```

## 七、易错点

- **`addEventListener("message")` 后漏 `port.start()`**：一条都收不到且不报错——要么改用 `port.onmessage = `（隐式 start），要么显式补 `port.start()`。
- **转移后还用原 port**：port 转移即 neutered——转移前把要发的先发，转移后只用新宿主里的 port。
- **对端忘了从 `event.ports[0]` 取 port**：转移来的 port 不在 `event.data` 里，在 `event.ports`——按数组下标取。
- **给 `port.postMessage` 传 `targetOrigin`**：port 版没有这个参数（第二参数是 transfer 列表）——`targetOrigin` 只属于 `window.postMessage`。
- **转移 port 的那次 window.postMessage 用 `*` / 不校验来源**：握手这一步仍是普通 postMessage，安全规则照旧（见 [postMessage 页](./postmessage)）。
- **通道用完不 `close`**：端口悬挂、内存不回收——一次性通道用完主动 `close`。
- **误以为 `<iframe>` 一 append 就能收 port**：仍要等其脚本就绪——转移前等 `load` 或做 `ready` 握手。
- **把请求 / 响应当同步**：port 通信是异步消息，没有内建 RPC——自己配 id 匹配 + 超时，或上 Comlink（见 [Web Workers 叶的 Comlink 模式](/zh/web-advanced/web-api/web-workers/guide-line/patterns-comlink)）。

下一页：从「点对点专线」转到「同源一对多广播」——[BroadcastChannel](./broadcast-channel)。
