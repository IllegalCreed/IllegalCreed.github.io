---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- HTTP 局限：服务器不能主动推 → 轮询/SSE/WebSocket/WebRTC 绕开
- 短轮询定时拉、长轮询 hold 请求；SSE 单向推、WebSocket 双向、WebRTC P2P
- SSE：HTTP + `text/event-stream` + 自动重连 + `Last-Event-ID`
- WebSocket：`Upgrade` 握手 → `101` → 单 TCP 全双工；客户端帧必须掩码
- WebSocket 心跳 ping/pong（浏览器 JS 不能主动发 ping，需应用层心跳）；重连指数退避
- WebRTC：信令交换 SDP + ICE + STUN（打洞）/ TURN（中继）；对称 NAT 需 TURN
- 选型：单向 SSE / 双向 WebSocket / P2P WebRTC / 偶发轮询
- 趋势：SSE 在 AI 流式回潮；WebTransport over HTTP/3 新兴

## 五方案对比

| 方案 | 方向 | 底层协议 | 实时性 | 开销 | 典型场景 |
| --- | --- | --- | --- | --- | --- |
| 短轮询 | 客户端拉 | HTTP | 低（间隔决定） | 高（空请求） | 简单偶发 |
| 长轮询 | 客户端拉（hold） | HTTP | 中高 | 中 | 兼容性兜底 |
| SSE | 服务器单向推 | HTTP 长连接 | 高 | 低 | 通知/行情/AI 流式 |
| WebSocket | 双向全双工 | TCP（HTTP 升级） | 高 | 低 | 聊天/协作/游戏 |
| WebRTC | P2P 双向 | UDP（P2P） | 极高 | 低（直连） | 音视频/文件直传 |

## WebSocket 协议要点

| 项 | 要点 |
| --- | --- |
| 握手 | `GET` + `Upgrade: websocket` + `Sec-WebSocket-Key` → `101 Switching Protocols` + `Sec-WebSocket-Accept` |
| Accept | Key + 魔术串 → SHA-1 → Base64（仅防误升级，非安全机制） |
| 连接 | 握手后脱离 HTTP、复用同一 TCP 全双工 |
| opcode | 文本 `0x1` / 二进制 `0x2` / 关闭 `0x8` / ping `0x9` / pong `0xA` |
| 掩码 | 客户端→服务器帧必须掩码（防缓存投毒）；反向不掩码 |
| 协议 | `ws://`(80) / `wss://`(443，over TLS，生产首选) |
| HTTP/2/3 | RFC 8441（H2）/ RFC 9220（H3）扩展 CONNECT 支持 |

## WebSocket 工程实践

| 项 | 要点 |
| --- | --- |
| 心跳 | ping/pong 探活；浏览器 JS 不能主动发 ping，需应用层心跳对抗 NAT/代理超时 |
| 重连 | 指数退避 + 抖动（防 thundering herd）；`1006` 重连、`1000` 不重连 |
| 可靠性 | 协议不保证应用层送达，需 ACK + 序号 + 重发 |
| 代理/LB | 反向代理需透传 `Upgrade`；`wss` 穿透企业代理更可靠 |
| 鉴权 | 浏览器不能自定义握手头 → Cookie / URL ticket / 子协议夹带 token |

## WebRTC 与 NAT 穿透

| 项 | 要点 |
| --- | --- |
| 用途 | 浏览器间 P2P 实时音视频/数据，无需插件 |
| 信令 | 交换 SDP（媒体能力/候选）；WebRTC 不规定信令通道，常用 WebSocket |
| ICE | 收集候选地址、连通性检查、择优；候选类型 host/srflx/relay |
| STUN | 发现公网映射地址、尝试 UDP 打洞 |
| TURN | 打洞失败时中继（保证连通但耗带宽）；对称 NAT 需 TURN |
| DataChannel | 基于 SCTP/DTLS、默认加密、可配可靠/不可靠 |

> NAT 基础见 [网络层与路由 · NAT 与 DHCP](../net-ip-routing/guide-line/nat-dhcp)。

## 权威链接

- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) · [WebSockets API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) · [WebRTC Connectivity](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Connectivity)
- [RFC 6455: WebSocket](https://datatracker.ietf.org/doc/html/rfc6455) · [RFC 8441: WebSocket over HTTP/2](https://datatracker.ietf.org/doc/html/rfc8441) · [WebRTC for the Curious](https://webrtcforthecurious.com/)
- [MDN: WebTransport](https://developer.mozilla.org/en-US/docs/Web/API/WebTransport)

## 相关页

- [入门](./getting-started) · [实时通信方案演进](./guide-line/polling-evolution) · [SSE 服务器推送](./guide-line/sse)
- [WebSocket 协议握手与帧](./guide-line/websocket-protocol) · [WebSocket 心跳·重连·工程实践](./guide-line/websocket-practice)
- [WebRTC 与 NAT 穿透](./guide-line/webrtc-nat) · [实时方案对比与选型](./guide-line/realtime-comparison)
