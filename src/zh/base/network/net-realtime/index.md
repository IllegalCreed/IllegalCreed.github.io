---
layout: doc
---

# 实时通信协议

HTTP 的请求-响应模型有个根本局限：**服务器无法主动向客户端推送**。但聊天、协作、实时通知、音视频这些场景偏偏需要「服务器有数据就立刻送达」。本叶讲清前端为突破这一局限演进出的一整套实时通信方案——从模拟推送的**轮询/长轮询**，到服务器单向推送的 **SSE**、全双工双向的 **WebSocket**，再到浏览器间 P2P 的 **WebRTC**——侧重**协议与网络原理**（握手、帧、NAT 穿透）；它们的浏览器 API 用法归「Web 进阶 > Web API」章。

## 概述

- **轮询**：短轮询定时拉、长轮询 hold 住请求——用「拉」模拟「推」，简单但有开销与延迟。
- **SSE**：服务器单向推送，基于 HTTP、`text/event-stream`、自动重连——适合通知、行情、AI 流式输出。
- **WebSocket**：HTTP `Upgrade` 握手（`101`）后在单条 TCP 上全双工双向——适合聊天、协作、游戏。
- **WebRTC**：浏览器间 P2P 音视频/数据；难点是 NAT 穿透——靠信令 + ICE + STUN（打洞）/ TURN（中继）。
- **选型**：单向推 → SSE；双向交互 → WebSocket；P2P 音视频 → WebRTC；简单偶发 → 轮询兜底。

## 本叶地图

- [入门](./getting-started) —— 实时通信全景，四类方案的分工
- [实时通信方案演进（轮询→长轮询）](./guide-line/polling-evolution) —— HTTP 局限、短轮询、长轮询、Comet
- [SSE 服务器推送](./guide-line/sse) —— event-stream 格式、自动重连、Last-Event-ID、适用场景
- [WebSocket 协议握手与帧](./guide-line/websocket-protocol) —— Upgrade 握手 101、帧格式、opcode、掩码、ws/wss
- [WebSocket 心跳·重连·工程实践](./guide-line/websocket-practice) —— 心跳保活、断线重连、代理、鉴权、HTTP/2
- [WebRTC 与 NAT 穿透](./guide-line/webrtc-nat) —— 信令、ICE、STUN 打洞、TURN 中继、DataChannel
- [实时方案对比与选型](./guide-line/realtime-comparison) —— 五方案对比、选型决策树、WebTransport 趋势
- [参考](./reference) —— 五方案对比 + 协议要点 + 选型 + 权威链接

## 文档地址

- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) · [WebSockets API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) · [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [RFC 6455: WebSocket](https://datatracker.ietf.org/doc/html/rfc6455) · [WebRTC for the Curious](https://webrtcforthecurious.com/)
- [MDN: WebTransport](https://developer.mozilla.org/en-US/docs/Web/API/WebTransport)

## 幻灯片地址

<a href="/SlideStack/net-realtime-slide/" target="_blank">实时通信协议</a>
