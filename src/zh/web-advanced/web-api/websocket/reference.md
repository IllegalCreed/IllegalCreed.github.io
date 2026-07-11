---
layout: doc
outline: [2, 3]
---

# 参考：API 速查 / 对比 / 易错点

> 基于 WHATWG WebSockets 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **构造**：`new WebSocket(url[, protocols])`——即连接，返回 `CONNECTING` 态；`url` 收 `ws` / `wss` / `http` / `https`（2024 起）/ 相对 URL，带 fragment 或非法 scheme 抛 `SyntaxError`。
- **protocols**：字符串或数组，最终**只选中一个**；握手后读只读属性 `protocol`；数组重复 / 非法格式抛 `SyntaxError`。
- **不能自定义握手头**：`Authorization` / `Sec-*` 都设不了——鉴权路线见[网络章](/zh/base/network/net-realtime/guide-line/websocket-practice)。
- **readyState 四态**：`CONNECTING(0)` / `OPEN(1)` / `CLOSING(2)` / `CLOSED(3)`，只读、单向流动、实例不可复用。
- **send 五类型**：`string`（文本帧）+ `ArrayBuffer` / `Blob` / `TypedArray` / `DataView`（二进制帧）；`CONNECTING` 调用抛 `InvalidStateError`，`CLOSING` / `CLOSED` **静默丢弃**，缓冲满自动断连。
- **close 约束**：`code` 只能 `1000` 或 `3000`–`4999`，其余抛 `InvalidAccessError`；`reason` UTF-8 ≤ 123 字节否则 `SyntaxError`；不丢已排队消息、对已关连接是空操作。
- **四事件**：`open`（`Event`）/ `message`（`MessageEvent`）/ `error`（`Event`，**无细节**）/ `close`（`CloseEvent`）。
- **MessageEvent**：`data`（`string` 或二进制，取决于 `binaryType`）/ `origin` / `lastEventId`（WS 恒空）。
- **CloseEvent 三件**：`code` / `reason` / `wasClean`；`1006`=异常无 Close 帧、`1005`=无状态码、`1015`=TLS 失败，**这三个只能读不能用 `close()` 写**。
- **error 无信息 + 必跟 close**：诊断看 `CloseEvent` 的 `code` / `wasClean`，重连逻辑挂 `onclose`。
- **binaryType**：唯一可写属性，`"blob"`（默认）/ `"arraybuffer"`；只影响**接收**；默认值与 `RTCDataChannel` 相反。
- **bufferedAmount**：发送侧唯一背压信号，已排队未发出的字节数、发完归 0；**无** `bufferedamountlow` 事件（那是 `RTCDataChannel` 的），节流靠轮询。
- **接收无背压**：标准 WebSocket 的能力短板，靠 Worker / 采样 / 服务端限速缓解。
- **生命周期**：不 `close` 就泄漏且挡 bfcache；离场 `pagehide` 关、`pageshow` 判 `persisted` 重建；切勿 `unload`。
- **WebSocketStream 前沿**：Chrome 124+、**非标准、仅 Chromium**；`opened`→`{ readable, writable, extensions, protocol }`，`closed`→`{ closeCode, reason }`，`close({ closeCode, reason })`，构造支持 `signal`。
- **边界**：握手 / 帧 / 心跳 / 重连策略 / 关闭码运维语义 / 代理 LB / 鉴权 / 子协议协商机制 / `wss` / HTTP2 上的 WS 全在[网络章](/zh/base/network/net-realtime/guide-line/websocket-protocol)。

## 一、WebSocket 接口速查

### 构造与属性

| 成员 | 读写 | 说明 |
| --- | --- | --- |
| `new WebSocket(url[, protocols])` | — | 构造即连接；`url` 支持 `ws`/`wss`/`http`/`https`/相对；非法 URL / fragment / scheme 抛 `SyntaxError` |
| `url` | 只读 | 解析后的绝对 URL |
| `protocol` | 只读 | 服务端选中的子协议（未选为空串） |
| `extensions` | 只读 | 服务端选中的扩展（通常空串） |
| `readyState` | 只读 | `0` CONNECTING / `1` OPEN / `2` CLOSING / `3` CLOSED |
| `bufferedAmount` | 只读 | 已 `send` 未发出的字节数；发完归 0 |
| `binaryType` | **读写** | `"blob"`（默认）/ `"arraybuffer"`，仅影响接收 |

### 方法

| 方法 | 说明 | 异常 |
| --- | --- | --- |
| `send(data)` | 排队发送，异步；五类型（见下） | `CONNECTING` 态抛 `InvalidStateError`；`CLOSING`/`CLOSED` 静默丢弃 |
| `close([code[, reason]])` | 发起关闭握手，不丢已排队消息，幂等 | `code` 非 `1000`/`3000`–`4999` 抛 `InvalidAccessError`；`reason` UTF-8 > 123 字节抛 `SyntaxError` |

### send 数据类型

| 类型 | 帧 | 备注 |
| --- | --- | --- |
| `string` | 文本帧 | UTF-8 编码 |
| `ArrayBuffer` | 二进制帧 | 原始字节 |
| `TypedArray`（`Uint8Array` 等） | 二进制帧 | 视图字节 |
| `DataView` | 二进制帧 | 视图字节 |
| `Blob` | 二进制帧 | `Blob.type` 被忽略 |

## 二、事件与 CloseEvent

### 四个事件

| 事件 | 事件对象 | 触发时机 | 关键点 |
| --- | --- | --- | --- |
| `open` | `Event` | 握手成功、进入 `OPEN` | 之后才能 `send` |
| `message` | `MessageEvent` | 收到一条消息 | **无命名事件**，全进这里 |
| `error` | `Event` | 连接出错 | **无任何细节**（安全设计），后必跟 `close` |
| `close` | `CloseEvent` | 连接关闭 | 诊断信息在此 |

### MessageEvent 属性

| 属性 | 说明 |
| --- | --- |
| `data` | `string`（文本帧）或 `Blob` / `ArrayBuffer`（二进制帧，取决于 `binaryType`） |
| `origin` | 消息来源的源 |
| `lastEventId` | WebSocket 场景恒为空串 |

### CloseEvent 属性

| 属性 | 说明 |
| --- | --- |
| `code` | 关闭码（含只读的 `1005`/`1006`/`1015`） |
| `reason` | 服务端给的原因文本（UTF-8，可能空） |
| `wasClean` | 是否走完关闭握手；`false` 常伴 `1006` |

## 三、合法关闭码（API 约束视角）

关键区分：**你能主动传给 `close(code)` 的**，与**你能在 `CloseEvent.code` 里读到的**，是两个不同的集合。

| 码 / 范围 | `close()` 能传？ | `CloseEvent` 能读到？ | 说明 |
| --- | --- | --- | --- |
| `0`–`999` | ✗ 抛 `InvalidAccessError` | ✗ | 未使用 |
| `1000` | ✓ | ✓ | 正常关闭（`close()` 不传参的默认） |
| `1001`–`1015`（除保留） | ✗ 抛 `InvalidAccessError` | ✓ | 协议 / 浏览器产生，JS 不能主动传 |
| `1005` | ✗ | ✓（合成） | 无状态码；**只读** |
| `1006` | ✗ | ✓（合成） | 异常断开、无 Close 帧；**只读**，重连判据 |
| `1015` | ✗ | ✓（合成） | TLS 握手失败；**只读** |
| `3000`–`3999` | ✓ | ✓ | 库 / 框架 / 应用（IANA 注册） |
| `4000`–`4999` | ✓ | ✓ | 私有约定 |

> 上表只讲 **API 层「哪些码合法、谁产生」**。各码的**运维语义**（`1001` 端点离开、`1011` 服务端错误、`1013` 过载退避……分别意味着什么、该怎么处置）见[网络章](/zh/base/network/net-realtime/guide-line/websocket-practice)与 [MDN CloseEvent.code](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code)。

## 四、binaryType 对比

| | `WebSocket.binaryType` | `RTCDataChannel.binaryType` |
| --- | --- | --- |
| 默认值 | **`"blob"`** | **`"arraybuffer"`** |
| 可选值 | `"blob"` / `"arraybuffer"` | `"blob"` / `"arraybuffer"` |
| 影响 | 仅接收的二进制帧类型 | 同左 |
| 迁移坑 | 两者默认相反——跨 API 复用 `onmessage` 逻辑必显式设 | — |

选择建议：**要同步随机读字节**（`DataView` / WASM / 二进制协议解析）→ `"arraybuffer"`；**大文件 / 整体转手**（`createObjectURL`、下载）→ `"blob"`。

## 五、与 SSE / WebTransport 的 API 视角选型

| 维度 | WebSocket | SSE（`EventSource`） | WebTransport |
| --- | --- | --- | --- |
| 方向 | **全双工双向** | 服务器 → 客户端单向 | 双向 |
| API 形态 | 事件驱动（`onmessage` + `send`） | 事件驱动（`onmessage`，只收） | Streams + datagrams（Promise / 流） |
| 数据类型 | 文本 + 二进制 | **仅文本**（UTF-8） | 文本 + 二进制 |
| 自动重连 | **无**（自己写） | **内建**（自带 `Last-Event-ID`） | 无 |
| 背压 | 接收无、发送靠轮询 `bufferedAmount` | 无（只收，量通常小） | **Streams 天然背压** |
| 底层 | TCP（HTTP/1.1 Upgrade，或 RFC 8441 走 H2） | HTTP 长响应 | **HTTP/3 over QUIC**（多路复用、无队头阻塞） |
| 消息边界 | 有（一帧一消息） | 有（空行分隔） | 流无固定边界 / datagram 有 |
| 标准化 | 现行标准、全绿 | 现行标准、全绿 | 较新，浏览器支持推进中 |
| API 侧一句话 | 双向、二进制、自管重连 | 单向、纯文本、省心自带重连 | 双向 + 背压 + 不可靠 datagram，面向新场景 |

选型速断（**API 能力视角**，协议 / 性能取舍见[网络章](/zh/base/network/net-realtime/guide-line/websocket-protocol)）：

- **只要服务器单向推文本**（通知、日志、进度、行情）→ **SSE**，省一大堆重连代码。
- **要双向、要二进制、要低延迟互推** → **WebSocket**。
- **要双向 + 背压 + 可选不可靠 datagram（音视频 / 游戏状态）且能接受较新支持面** → **WebTransport**（了解为主）。

## 六、易错点清单

- **`new` 完立刻 `send`**：此刻 `readyState` 是 `CONNECTING`，抛 `InvalidStateError`——必须等 `open`。
- **`CLOSING` / `CLOSED` 态 `send`**：**静默丢弃、不报错**，消息神秘消失的头号嫌疑。
- **`close(1001)` / `close(500)`**：只能传 `1000` 或 `3000`–`4999`，其余抛 `InvalidAccessError`；协议保留码你读得到、传不了。
- **`reason` 超 123 字节**：按 UTF-8 **字节**算（中文每字 3 字节），超了抛 `SyntaxError`。
- **指望 `error` 事件给原因**：它没有任何细节（安全设计）；诊断看随后 `close` 的 `code` / `wasClean`。
- **以为断线会自动重连**：WebSocket **不自动重连**（这点和 SSE 相反），得自己写（骨架见[生命周期页](./guide-line/lifecycle-patterns)）。
- **复用作废实例重连**：`CLOSED` 的实例不能 reopen，重连必须 `new` 新的。
- **等一个「命名事件」**：WebSocket 没有 SSE 的 `event:` 概念，所有消息进同一个 `message`——消息类型自己在 payload 里带。
- **二进制默认当 `ArrayBuffer` 用**：默认 `binaryType` 是 `"blob"`，`e.data` 是 `Blob` 不是 `ArrayBuffer`；要字节先设 `"arraybuffer"` 或 `await blob.arrayBuffer()`。
- **从 RTCDataChannel 搬代码忘了默认相反**：`WebSocket` 默认 `"blob"`、`RTCDataChannel` 默认 `"arraybuffer"`，`instanceof` 判断会走错分支。
- **狂发不看 `bufferedAmount`**：缓冲膨胀、内存涨，满了浏览器**自动断连**；大流量必须节流（轮询 `bufferedAmount`）。
- **等 `bufferedamountlow` 事件**：标准 WebSocket **没有**这事件（那是 RTCDataChannel 的）；发送背压只能轮询。
- **接收侧想施加背压**：标准 API 做不到，只能 Worker / 采样 / 让服务端限速，或了解 `WebSocketStream`。
- **文本体积用 `.length`**：那是字符数不是字节数；按 UTF-8 字节用 `new TextEncoder().encode(s).length`。
- **忘了 `close()`**：连接常驻后台（幽灵连接）、还挡 bfcache；SPA 组件卸载 / 离开页面必关。
- **用 `unload` / `beforeunload` 收尾**：会**破坏 bfcache**；离场一律 `pagehide`，恢复用 `pageshow` 判 `persisted`。
- **HTTPS 页发 `ws://`**：被混合内容拦截、连接失败（不是构造异常）；生产一律 `wss`。
- **把 `WebSocketStream` 当生产 API**：**非标准、仅 Chromium**，Firefox / Safari 无；用前特性检测 + 降级。
- **想在浏览器设握手头**：`Authorization` / `Sec-*` 都设不了；鉴权走 Cookie / ticket / 子协议夹带（见[网络章](/zh/base/network/net-realtime/guide-line/websocket-practice)）。

## 七、权威链接

- [MDN: WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) —— 接口参考（构造、属性、方法、事件）
- [MDN: Writing WebSocket client applications](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications) —— 官方客户端编写指南（含 bfcache / `pagehide` 示例）
- [MDN: WebSocket.close()](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/close) —— 合法码与异常原文
- [MDN: CloseEvent.code](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code) —— 全部关闭码与保留段
- [MDN: WebSocketStream](https://developer.mozilla.org/en-US/docs/Web/API/WebSocketStream) —— 前沿流式 API（标注非标准）
- [Chrome: WebSocketStream](https://developer.chrome.com/docs/capabilities/web-apis/websocketstream) —— 背压动机与用法
- [WHATWG WebSockets Standard](https://websockets.spec.whatwg.org/) —— `WebSocket` 对象接口规范原文
- [whatwg/websockets](https://github.com/whatwg/websockets) —— 标准仓库
- 站内：[网络章 · 协议握手与帧](/zh/base/network/net-realtime/guide-line/websocket-protocol)｜[网络章 · 心跳重连工程实践](/zh/base/network/net-realtime/guide-line/websocket-practice)｜[SSE 叶](/zh/web-advanced/web-api/sse/)｜[WebRTC 叶](/zh/web-advanced/web-api/webrtc/)
