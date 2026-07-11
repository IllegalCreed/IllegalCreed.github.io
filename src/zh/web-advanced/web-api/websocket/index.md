---
layout: doc
---

# WebSocket

WebSocket 是**浏览器发起并维护全双工连接的原生对象**：一个 `new WebSocket(url)` 就能在客户端与服务端之间开一条持久、双向、任意一方随时可推消息的通道，彻底摆脱「请求—响应」的轮询模型。它的 API 面极简——一个构造函数、`open` / `message` / `error` / `close` 四个事件、`send()` / `close()` 两个方法，外加 `readyState` / `bufferedAmount` / `binaryType` / `protocol` / `extensions` 几个只读属性——却把连接的建立、二进制收发、发送缓冲、关闭握手全部打包。核心接口在各主流浏览器**全绿十几年**（Baseline Widely available，Chrome 5 / Safari 5 / Firefox 11 起），2024 年还补上了「构造函数直接接受 `http` / `https` 与相对 URL」这块新基线（Chrome 125 / Firefox 124 / Safari 17.3）。真正需要花心思的，从来不是这套薄薄的 API，而是它**刻意不管**的那些事——心跳、重连、鉴权、消息可靠性——那部分的「为什么与策略」由[网络章](/zh/base/network/net-realtime/guide-line/websocket-protocol)负责，本叶只把「浏览器侧这个对象怎么用对、封装骨架怎么搭」讲透。

## 评价

**优点**

- **原生、全双工、长寿命**：唯一在单条连接上做到「双方同时收发」的浏览器原生协议，接口十几年不变、零依赖，聊天 / 协同编辑 / 实时游戏 / 行情推送的通用底座
- **API 极简且完备**：一个构造 + 四事件 + `send` / `close` + 几个只读属性即覆盖全部用法，学习曲线平缓
- **二进制一等公民**：`send()` 直收 `string` / `ArrayBuffer` / `Blob` / `TypedArray` / `DataView` 五类，接收端用 `binaryType` 在 `Blob` 与 `ArrayBuffer` 间切换——文本与二进制无缝
- **与页面生命周期有正规协作点**：`pagehide` / `pageshow` 配合 bfcache、`visibilitychange` 配合前后台切换，都有明确的挂接方式，不必靠猜

**局限**

- **API 太「薄」，工程全靠自封装**：心跳探活、断线重连、消息去重补偿协议一概不管，都得在应用层自己写（这些机制的「为什么与策略」在[网络章实践页](/zh/base/network/net-realtime/guide-line/websocket-practice)）
- **无接收背压**：消息到达快过处理时只能在内存里越堆越多（甚至 100% CPU），标准 WebSocket 没有任何流控入口——`WebSocketStream` 想解决它，但**非标准、仅 Chromium**
- **发送背压只能轮询**：靠周期读 `bufferedAmount` 判断「发得出去吗」，没有 `bufferedamountlow` 事件（那是 `RTCDataChannel` 的），节流得自己搭
- **握手头不可定制**：浏览器侧连 `Authorization` 都设不了，鉴权受限（可行路线见网络章）；`error` 事件也刻意不带任何错误细节（安全设计），排错只能靠关闭码

一句话选型：**需要浏览器与服务端「双向、随时、互推」时，WebSocket 对象是原生答案**；只要服务器单向推送，选更省、自带重连的 [SSE](/zh/web-advanced/web-api/sse/)；点对点音视频或超低延迟数据通道，选 [WebRTC](/zh/web-advanced/web-api/webrtc/)。

## 本叶地图

- [入门](./getting-started) —— WebSocket 对象一分钟上手、事件模型心智、与网络章 / SSE 叶的分工边界、Baseline 现状
- [API 全解](./guide-line/api-deep-dive) —— 构造与 URL 约束、子协议 API 侧、`readyState` 四态、`send()` 四类型、`close(code, reason)` 合法码范围与异常、`MessageEvent` / `CloseEvent`（`code` / `reason` / `wasClean`）细节
- [二进制与背压](./guide-line/binary-backpressure) —— `binaryType` 默认 `blob`（与 `RTCDataChannel` 相反）、`ArrayBuffer` 选择、`bufferedAmount` 语义与发送节流、大消息浏览器侧处理
- [生命周期与封装模式](./guide-line/lifecycle-patterns) —— bfcache 与断开、`visibilitychange`、重连封装骨架（策略链接网络章）、Vue / React hook 封装、`WebSocketStream` 前沿
- [参考](./reference) —— API 速查表 + 事件与 `CloseEvent` 表 + 合法关闭码 API 约束表 + `binaryType` 对比 + 与 SSE / WebTransport 的 API 视角选型 + 易错点清单 + 资源链接

## 文档地址

[MDN WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## GitHub 地址

[whatwg/websockets](https://github.com/whatwg/websockets)（WebSocket 对象接口的现行标准仓库）

## 幻灯片地址

<a href="/SlideStack/websocket-slide/" target="_blank">WebSocket</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=websocket" target="_blank" rel="noopener noreferrer">WebSocket 测试题</a>
