---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- **根本问题**：HTTP 请求-响应、连接由客户端发起，服务器无法主动推送——实时方案都在绕开它
- **短轮询**：客户端定时发请求问「有新数据吗」；简单但开销大、延迟高（约半个间隔）
- **长轮询**：服务器 hold 住请求直到有数据或超时才返回；降延迟，但仍是 HTTP 开销
- **SSE**：服务器**单向**推送；基于 HTTP、`text/event-stream`、字段 `data:`/`event:`/`id:`/`retry:`；**自动重连** + `Last-Event-ID`
- **WebSocket**：**全双工双向**；HTTP `Upgrade` 握手 → `101 Switching Protocols` → 单条 TCP 复用；`ws://`(80)/`wss://`(443)
- WebSocket 帧：opcode（文本 0x1 / 二进制 0x2 / 关闭 0x8 / ping 0x9 / pong 0xA）；客户端→服务器帧**必须掩码**
- **WebRTC**：浏览器间 **P2P** 音视频/数据；难点 NAT 穿透 → 信令交换 SDP + **ICE** + **STUN**(打洞) / **TURN**(中继)
- 对称型 NAT 最难穿透，需 TURN 中继兜底
- **选型**：单向推 → SSE；双向交互 → WebSocket；P2P 音视频 → WebRTC；简单偶发 → 轮询
- 趋势：SSE 因 AI 逐 token 流式输出回潮；WebTransport over HTTP/3 新兴
- 本叶讲**协议/网络原理**；EventSource/WebSocket/RTCPeerConnection 的 JS 用法见「Web 进阶 > Web API」章

## 四类方案，一张全景

| 方案 | 方向 | 底层 | 典型场景 |
| --- | --- | --- | --- |
| 短轮询/长轮询 | 客户端拉（模拟推） | HTTP | 简单、偶发更新 |
| SSE | 服务器→客户端单向 | HTTP（长连接） | 通知、行情、AI 流式 |
| WebSocket | 双向全双工 | TCP（HTTP 升级） | 聊天、协作、游戏 |
| WebRTC | P2P 双向 | UDP（P2P） | 音视频通话、文件直传 |

一句话选型：**单向推送用 SSE，双向交互用 WebSocket，浏览器间 P2P 音视频用 WebRTC，简单偶发用轮询兜底。**

::: tip 为什么 HTTP 不够用
HTTP 是「客户端问、服务器答」，服务器没法在「有新消息时」主动找客户端。轮询是「不停地问」来模拟推送（治标）；SSE/WebSocket 则建立**持久连接**，让服务器能真正主动发数据（治本）；WebRTC 更进一步，让两个浏览器**直接**通信、不经服务器中转媒体流。
:::

## 一个澄清：本叶 vs Web API 章

本叶聚焦**协议层面**：WebSocket 怎么握手、帧长什么样、WebRTC 怎么穿透 NAT。而 `EventSource`、`WebSocket`、`RTCPeerConnection` 这些**浏览器 JS API 的具体调用**（`new WebSocket(url)`、`onmessage`、`createDataChannel`）属于「Web 进阶 > Web API」章。先懂协议原理，再写 API 调用会更踏实。

下面各页逐一展开：先看 [实时通信方案演进](./guide-line/polling-evolution)。
