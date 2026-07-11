---
layout: doc
outline: [2, 3]
---

# 入门：WebSocket 对象一分钟、事件模型与分工边界

> 基于 WHATWG WebSockets 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **一句话定位**：`WebSocket` 对象是浏览器发起并维护全双工连接的原生入口——`new WebSocket(url)` 开一条持久双向通道，之后任意一方随时可 `send`。
- **四步上手**：`const ws = new WebSocket("wss://host/path")` → `ws.onopen` 里开始发 → `ws.onmessage` 收 → 不用时 `ws.close()`。
- **本叶边界**：握手 / 帧 / 掩码、心跳 / 重连 / 关闭码运维语义 / 鉴权 / 子协议协商机制 / `wss` / HTTP2 上的 WS 全在[网络章两页](/zh/base/network/net-realtime/guide-line/websocket-protocol)；本叶**只讲浏览器 `WebSocket` 对象的 API 面**。
- **构造即连接**：`new WebSocket(url[, protocols])`；`url` 支持 `ws` / `wss`，2024 起新增 `http` / `https` 与相对 URL（`http`→`ws`、`https`→`wss`）。
- **readyState 四态**：`CONNECTING(0)` / `OPEN(1)` / `CLOSING(2)` / `CLOSED(3)`——比 `EventSource` 的三态多一个 `CLOSING`。
- **四事件**：`open` / `message` / `error` / `close`；没有 SSE 那种「命名事件」概念，服务端所有消息都进 `message`。
- **send 四类型**：`string`（文本帧）+ `ArrayBuffer` / `Blob` / `TypedArray` / `DataView`（二进制帧），一个方法通吃。
- **send 时机**：在 `CONNECTING` 态调用 `send()` 抛 `InvalidStateError`——**必须等 `open` 之后再发**。
- **收二进制默认 Blob**：`binaryType` 默认 `"blob"`，与 `RTCDataChannel` 默认 `"arraybuffer"` **正好相反**；要直接读字节改成 `"arraybuffer"`。
- **close 合法码**：`close(code, reason)` 的 `code` **只能是 `1000` 或 `3000`–`4999`**，其余抛 `InvalidAccessError`；`reason` ≤ 123 字节（UTF-8）否则 `SyntaxError`。
- **CloseEvent 三件**：`code` / `reason` / `wasClean`；`1006` = 异常断开（没收到 Close 帧），是「网络掉了」的 API 层信号。
- **error 干瘪**：`error` 事件**不带任何错误详情**（安全设计），且 `error` 之后必定紧跟一个 `close`——排错看 `close` 的 `code` / `wasClean`。
- **子协议 API 侧**：构造第二参传字符串数组，握手完成后读只读属性 `ws.protocol` 拿到服务端选中的那一个。
- **必须手动 close**：SPA 路由切走 / 组件卸载 / 离开页面都要显式 `close()`，否则连接常驻后台，还可能挡住 bfcache。
- **背压是短板**：标准 `WebSocket` **无接收背压**（消息快过处理只能堆内存）；发送背压靠轮询 `bufferedAmount`（**没有** `bufferedamountlow` 事件）。
- **前沿只需了解**：`WebSocketStream`（Promise 化 + Streams 背压）是 **Chromium 专属、非标准**，Firefox / Safari 无——知道形态即可，不当主线。
- **支持现状**：`WebSocket` 对象 Baseline Widely available（Chrome 5 / Safari 5 / Firefox 11）；构造接受 `http` / `https` / 相对 URL 是 2024 年的新基线。

## 一、定位：给「双向、随时互推」一个原生对象

「服务器有新数据主动告诉页面」用 [SSE](/zh/web-advanced/web-api/sse/) 就够——但那是**单向**的：服务端能持续推，客户端只能在建连时发一次请求。一旦场景变成「双方都要随时主动说话」（聊天、协同编辑、实时对战、行情下单），就需要一条**全双工**通道。

协议层的完整故事——WebSocket 如何借 HTTP 握手升级、帧怎么切、掩码为何非对称、心跳 / 重连 / 鉴权该怎么做——[网络章的两页](/zh/base/network/net-realtime/guide-line/websocket-protocol)已经讲透。**本叶站在它的结论之上**：假定你已确认「双向文本 / 二进制推送选 WebSocket」，聚焦浏览器端唯一的入口——**`WebSocket` 对象**——怎么用对。

它把「发起连接、升级、按帧收发、关闭握手」全部藏在对象内部，暴露给你的只是一个事件目标（继承自 `EventTarget`）：

```js
const ws = new WebSocket("wss://example.com/chat"); // 构造即开始连接
ws.onopen = () => ws.send("hello"); // 连上后才能发
ws.onmessage = (e) => console.log("收到:", e.data);
```

## 二、心智模型：一个对象、四个事件、两态切换

`EventSource`（SSE）的世界观是「订阅一条永不结束的响应」；`WebSocket` 的世界观不一样——**它是一条双向的、有明确开合两端的连接**。三个心智锚点：

1. **连接有四个状态，且不可逆地流动**：`CONNECTING`（握手中）→ `OPEN`（可收发）→ `CLOSING`（关闭握手中）→ `CLOSED`（已关）。一个 `WebSocket` 实例走完这条线就作废，**不能复用**，重连必须 `new` 一个新的。（对比 `EventSource` 只有三态、且自带重连——`WebSocket` 两者都不同。）

2. **一切通过事件通知你**：

   | 事件 | 何时触发 | 事件对象 |
   | --- | --- | --- |
   | `open` | 握手成功、进入 `OPEN` | `Event` |
   | `message` | 收到一条消息（文本或二进制） | `MessageEvent` |
   | `error` | 连接出错（**无细节**，随后必有 `close`） | `Event` |
   | `close` | 连接关闭（无论正常 / 异常） | `CloseEvent`（带 `code` / `reason` / `wasClean`） |

   注意与 SSE 的关键差异：**WebSocket 没有「命名事件」**。服务端发来的每条消息，无论内容如何，都只进 `message`——「消息类型」得由你在应用层自己约定（比如 JSON 里放一个 `type` 字段）。

3. **收发是异步且无背压的**：`send()` 只是把数据塞进本地发送缓冲区就立即返回，不等真正发出（进度看 `bufferedAmount`）；`message` 何时到、到多少由对端决定，浏览器**不会替你限速**——这正是背压问题的根源（详见[二进制与背压页](./guide-line/binary-backpressure)）。

## 三、一分钟上手：最小可运行回声示例

一个零依赖的完整例子。服务端用 Node（`ws` 库）起一个回声服务，浏览器连上后互发消息：

```js
// server.mjs —— 需要 `npm i ws`
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 3000 });
wss.on("connection", (socket) => {
  socket.on("message", (data) => {
    // 原样回声：收到什么发回什么
    socket.send(`echo: ${data}`);
  });
  socket.send("欢迎，连接已建立"); // 连上立即主动推一条
});
console.log("ws://localhost:3000");
```

```html
<!-- 浏览器端：连接、发送、接收、关闭的完整四件套 -->
<script type="module">
  const ws = new WebSocket("ws://localhost:3000");

  // 1) open：只有到这里 readyState 才是 OPEN，之前 send 会抛异常
  ws.onopen = () => {
    console.log("已连接, readyState =", ws.readyState); // 1 = OPEN
    ws.send("第一条消息"); // 连上后才发
  };

  // 2) message：服务端所有消息都到这里；e.data 是 string 或二进制
  ws.onmessage = (e) => {
    console.log("收到:", e.data);
  };

  // 3) error：不带任何错误细节，仅作「出问题了」的信号，随后必有 close
  ws.onerror = () => console.log("连接出错（细节看随后的 close）");

  // 4) close：CloseEvent 才是排错的信息来源
  ws.onclose = (e) => {
    console.log(`已关闭 code=${e.code} reason=${e.reason} 干净=${e.wasClean}`);
  };

  // 页面卸载前主动关，避免「幽灵连接」与 bfcache 失效
  window.addEventListener("pagehide", () => ws.close(1000, "leaving"));
</script>
```

**建议做一次断线实验**：页面跑起来后 `Ctrl+C` 杀掉 Node 进程，控制台会打出 `close` 且 `code=1006`、`wasClean=false`——这就是「网络异常断开」在 API 层的样子。**注意：浏览器不会自动重连**（这一点和 SSE 相反），重连逻辑得你自己写（骨架见[生命周期页](./guide-line/lifecycle-patterns)，退避 / 抖动策略见[网络章](/zh/base/network/net-realtime/guide-line/websocket-practice)）。

## 四、第一次就该记住的事实

- **`new` 即连接、构造函数不阻塞**：`new WebSocket(url)` 立刻返回一个 `CONNECTING` 态的实例，握手在后台进行。**别急着 `send`**——必须等 `open` 事件，否则抛 `InvalidStateError`。
- **URL 只认 WebSocket 语义**：传 `ws://` / `wss://`；2024 起也接受 `http://` / `https://`（自动升级为 `ws` / `wss`）和相对 URL。带 `#fragment` 或非法 scheme 会抛 `SyntaxError`。生产一律 `wss`（原因见[网络章](/zh/base/network/net-realtime/guide-line/websocket-protocol)）。
- **消息没有「类型」这一层**：所有 `message` 都进同一个回调，要区分业务消息只能自己在 payload 里带字段——这是与 SSE `event:` 命名事件最大的用法差异。
- **`error` 不解释、`close` 才解释**：`error` 事件对象是空的（防信息泄露），真正的诊断信息在 `close` 的 `code` / `reason` / `wasClean` 里。
- **实例用完即弃**：走到 `CLOSED` 的 `WebSocket` 不能重开；`close()` 之后要重连，必须 `new` 一个新实例。
- **不 `close` 就是资源泄漏**：挂着监听器的连接会一直占着 TCP / 后端会话，SPA 里组件卸载不关就是「幽灵连接」，还会让页面进不了 bfcache（详见[生命周期页](./guide-line/lifecycle-patterns)）。

## 五、与协议层、SSE 的分工

一张表厘清「这个问题去哪读」：

| 问题 | 归属 |
| --- | --- |
| WebSocket 握手 / 帧 / 掩码 / `wss` 原理 | [网络章 · 协议握手与帧](/zh/base/network/net-realtime/guide-line/websocket-protocol)（协议层，已产出） |
| 心跳 / 重连 / 消息可靠性 / 关闭码运维语义 / 代理 LB / 鉴权 / 子协议协商机制 / HTTP2 上的 WS | [网络章 · 心跳重连工程实践](/zh/base/network/net-realtime/guide-line/websocket-practice)（工程策略，已产出） |
| `WebSocket` 对象怎么构造、四事件怎么用、`send` / `close` 约束 | 本叶 [API 全解](./guide-line/api-deep-dive) |
| `binaryType` / `bufferedAmount` / 二进制收发与背压 | 本叶 [二进制与背压](./guide-line/binary-backpressure) |
| bfcache / `visibilitychange` / 重连封装骨架 / 框架 hook / `WebSocketStream` | 本叶 [生命周期与封装模式](./guide-line/lifecycle-patterns) |
| 服务器单向推送（不需要客户端上行） | [SSE 叶](/zh/web-advanced/web-api/sse/)（更省、自带重连） |
| 点对点音视频 / 超低延迟数据通道 | [WebRTC 叶](/zh/web-advanced/web-api/webrtc/) |

## 六、浏览器支持现状

| 能力 | 状态（核于 2026-07） |
| --- | --- |
| `WebSocket` 对象全接口 | **Baseline Widely available**：Chrome 5（2010）/ Safari 5（2010）/ Firefox 11（2012）/ Edge 全绿 |
| 构造函数接受 `http` / `https` / 相对 URL | **较新基线**：Chrome 125 / Firefox 124 / Safari 17.3（均 2024）；旧浏览器只认 `ws` / `wss` |
| Worker 中使用 | 支持（接口暴露于 Window 与 Worker 全局） |
| `WebSocketStream` | **实验、非标准、仅 Chromium**（Chrome 124+）；Firefox / Safari 无 |

结论：**`WebSocket` 对象本身的兼容性在 2026 年完全不是问题**——它是 Web 平台里又一个「十几年稳定」的 API。要花心思的是它「刻意不管」的工程封装，以及背压这块唯一的能力短板。

下一页把 API 面一寸寸铺开——构造与 URL 约束、`readyState` 四态、`send()` 四类型、`close()` 合法码与异常、`MessageEvent` / `CloseEvent` 细节：[API 全解](./guide-line/api-deep-dive)。
