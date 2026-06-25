---
layout: doc
outline: [2, 3]
---

# 实时方案对比与选型

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- **五种方案一句话**：短轮询（定时拉，浪费）、长轮询（挂起拉，伪推送）、SSE（HTTP 单向推）、WebSocket（TCP 全双工）、WebRTC（浏览器间 P2P，多走 UDP）。
- **通信方向**：短轮询/长轮询 = 客户端拉；SSE = 服务器单向推；WebSocket = 双向；WebRTC = 端到端双向（音视频/数据）。
- **底层协议**：轮询与 SSE 都跑在 **HTTP** 上；WebSocket 握手用 HTTP 升级、之后是独立的 **`ws`/`wss`（TCP）**；WebRTC 媒体走 **UDP（SRTP/DTLS）**，并需 STUN/TURN 穿透 NAT。
- **服务器单向推通知** → 首选 **SSE**（`EventSource` 自带断线重连 + `Last-Event-ID` 续传，纯文本，最省心）。
- **双向交互**（聊天、协作、多人游戏状态同步）→ **WebSocket**（全双工、低延迟、支持二进制帧）。
- **浏览器间 P2P 音视频/文件** → **WebRTC**（数据不经服务器中转，延迟最低，但要信令 + NAT 穿透）。
- **简单偶发更新**（兼容性优先、低频）→ **轮询**兜底；长轮询比短轮询省无效请求，但仍非真推送。
- **SSE 的 HTTP/1.1 坑**：同源最多 **6 条**并发连接（多标签页会顶满）；升级到 **HTTP/2** 多路复用即解除该限制。
- **WebSocket vs SSE 关键差**：SSE 单向/纯文本/原生自动重连；WebSocket 双向/支持二进制/重连需自己实现（或用 Socket.IO 等库）。
- **HTTP/2 Server Push ≠ 实时推送**：它是「随响应预推静态资源」，且 **Chrome 106（2022）已默认移除**，与本叶方案无关（详见 HTTP 演进叶）。
- **现代趋势**：SSE 因 **AI 流式输出**（逐 token 推送，Vercel AI SDK 默认即用 SSE）强势回潮；**WebTransport over HTTP/3** 作为 WebSocket 的 UDP 化继任者新兴（Baseline 2026）。

## 一、五种方案全维度对比

前面五页已分别拆解了各方案的机制（演进/SSE/WebSocket 握手与帧/工程实践/WebRTC）。本页做收口式横向对比——先看一张全维度大表：

| 维度 | 短轮询 | 长轮询 | SSE | WebSocket | WebRTC |
| --- | --- | --- | --- | --- | --- |
| 通信方向 | 客户端拉 | 客户端拉 | **服务器单向推** | **双向（全双工）** | **端到端双向** |
| 底层协议 | HTTP | HTTP | HTTP | `ws`/`wss`（TCP） | **UDP**（SRTP/DTLS）+ 信令 |
| 连接形态 | 反复短连接 | 挂起的长连接 | 单条长连接 | 单条持久连接 | P2P（尽量绕开服务器） |
| 实时性 | 差（受轮询间隔） | 中（有挂起延迟） | 好 | **很好** | **极好**（媒体优化） |
| 服务器开销 | 高（大量无效请求） | 中（连接长期挂起） | 低 | 低 | 低（数据不中转） |
| 数据格式 | 任意 | 任意 | **仅 UTF-8 文本** | 文本 + **二进制** | 媒体流 + 任意二进制 |
| 自动重连 | 不适用 | 需自己实现 | **原生**（含续传） | 需自己实现 | 需信令重协商 |
| 浏览器 API | `fetch`/`XHR` | `fetch`/`XHR` | `EventSource` | `WebSocket` | `RTCPeerConnection` |
| 浏览器支持 | 全部 | 全部 | 广泛（IE 除外） | 广泛 | 广泛（需 HTTPS） |
| 典型场景 | 低频兼容兜底 | 老式即时通知 | 通知/行情/AI 流式 | 聊天/协作/游戏 | 音视频通话/屏共/文件直传 |

::: tip 一句话记忆
**拉 vs 推**是第一刀：轮询是「客户端反复问」，SSE/WebSocket/WebRTC 是「服务器/对端主动给」。
**单向 vs 双向**是第二刀：只需服务器→客户端用 SSE，需要双向用 WebSocket，浏览器之间直连用 WebRTC。
:::

### 协议归属：谁跑在 HTTP 上

- **轮询与 SSE 完全是 HTTP**：复用现有的 HTTP 基础设施（鉴权、Cookie、代理、CDN、防火墙包检测都天然兼容）。SSE 只是把响应体做成 `text/event-stream` 的长连接。
- **WebSocket 借 HTTP 起步**：靠 `Upgrade: websocket` 头完成一次性握手，之后切换为独立的 `ws`/`wss` 帧协议，不再是 HTTP（机制见 [WebSocket 协议握手与帧](./websocket-protocol)）。
- **WebRTC 基本脱离 HTTP**：媒体与数据走 UDP（带拥塞控制与丢包恢复），HTTP 仅用于**信令交换**（SDP/ICE）这一辅助环节。

## 二、选型决策树

实际项目里不必纠结「哪个最先进」，而要问「我的通信形态是什么」。按下面这棵树走，多数场景一两步就能定：

```text
需要服务器实时把数据送到客户端吗？
├─ 否 → 普通 HTTP 请求/响应即可，无需实时方案
└─ 是
   ├─ 只需「服务器 → 客户端」单向推？
   │   └─ 是 → ✅ SSE（EventSource 自带重连/续传，纯文本最省心；AI 流式输出首选）
   │
   ├─ 需要「客户端 ⇄ 服务器」双向、低延迟交互？
   │   （聊天、协作编辑、多人游戏状态、实时仪表盘指令）
   │   └─ 是 → ✅ WebSocket（全双工 + 二进制；心跳/重连见「工程实践」页）
   │
   ├─ 需要「浏览器 ⇄ 浏览器」端到端、媒体级低延迟？
   │   （音视频通话、屏幕共享、P2P 文件直传）
   │   └─ 是 → ✅ WebRTC（数据不经服务器中转；需信令 + STUN/TURN 穿透 NAT）
   │
   └─ 只是简单、偶发、低频更新，且兼容性优先？
       └─ 是 → ✅ 轮询兜底（优先长轮询，比短轮询省无效请求）
```

::: warning 别过度设计
能用 SSE 就别上 WebSocket，能用 WebSocket 就别硬套 WebRTC——每往「更强」走一步，工程复杂度（重连、信令、NAT 穿透、TURN 中继成本）都会陡增。**通信形态决定方案，而非「越新越好」。**
:::

### WebSocket 与 SSE 的取舍细节

二者最常被拿来对比，差异集中在三点（据 Ably 2026 对比）：

- **方向与格式**：SSE 单向、仅 UTF-8 文本；WebSocket 双向、支持二进制帧。要发图片/音频分片等二进制，SSE 直接出局。
- **重连成本**：SSE 由 `EventSource` 原生自动重连，并用 `Last-Event-ID` 从断点续传；WebSocket 断开即彻底丢失，重连得自己写逻辑或借 Socket.IO（详见 [WebSocket 心跳·重连·工程实践](./websocket-practice)）。
- **连接数限制**：HTTP/1.1 下 SSE 同源最多 **6 条**并发，多标签页易顶满；切到 **HTTP/2 多路复用**即解除。WebSocket 无此每源上限。

## 三、与 HTTP/2 Server Push 的区别

很多人把 **HTTP/2 Server Push** 误当成「服务器实时推送」的方案，这是个常见混淆：

- **它不是实时通信**：Server Push 是服务器**随某次 HTTP 响应**用 `PUSH_PROMISE` 帧**预推静态资源**（如 CSS/JS），目的是省掉客户端的二次请求，与「持续把业务数据推给前端」无关。
- **它已被废弃**：因采用率极低（约 0.7%-1.25%）、收益小且常引发缓存与性能问题，**Chrome 106（2022）已默认移除**；现代替代是 `103 Early Hints`（见 HTTP 演进叶的 [HPACK 与服务器推送](../../net-http-evolution/guide-line/http2-hpack-push)）。
- **要服务器单向推业务数据，请用 SSE**，而不是 Server Push——前者是为「持续事件流」设计的，后者只是资源预加载优化。

## 四、现代趋势

实时通信领域 2026 年有两条值得关注的动向：

### SSE 在 AI 流式输出中回潮

大模型逐 token 输出天然契合 SSE 的「服务器单向推文本流」模型：**Vercel AI SDK 默认即用 SSE 作为传输**，前端用 `EventSource` 或 `fetch` 流式读取即可实现打字机效果。但 SSE 的单向性在「**Agent 化**」场景成为瓶颈——工具调用、中途取消、多设备续传、离线后台任务等需要客户端反向发信号，此时要么补 WebSocket，要么靠服务端 resume token 续传机制兜底。

### WebTransport over HTTP/3 新兴

**WebTransport** 是 WebSocket 的 UDP 化继任者，跑在 **HTTP/3（QUIC/UDP）** 上，已达 **Baseline 2026**（2026-03 起主流浏览器可用）：

- **多路复用流 + 不可靠数据报**：既能像 WebSocket 那样开多条双向流，又能像 UDP 那样发「不可靠、无序」的 datagram（适合游戏位置同步、实时媒体这类「丢了就丢了、要的是新鲜」的数据）。
- **更低延迟 + 连接迁移**：继承 QUIC 的 0-RTT 重连、流间无队头阻塞、切换 Wi-Fi/4G 不断连等红利（对比见 [TCP 与 UDP·队头阻塞](../../net-transport/guide-line/tcp-vs-udp-hol)）。
- **现状**：标准已落地、浏览器支持成熟，但生态（服务端框架、CDN、调试工具）仍在追赶，短期内 WebSocket 仍是双向实时的主力，WebTransport 适合对延迟极致敏感、可控两端的新项目先行尝试。

::: tip 趋势记忆
方向上看：**单向推**正被 AI 流式带火（SSE 复兴）；**双向低延迟**正从 TCP（WebSocket）向 QUIC/UDP（WebTransport）演进。
:::

## 小结

本叶六页串起了实时通信的完整图景：从[方案演进](./polling-evolution)（短轮询 → 长轮询 → 真推送）出发，依次拆解了 [SSE](./sse)、[WebSocket 协议](./websocket-protocol)与[工程实践](./websocket-practice)、以及 [WebRTC 与 NAT 穿透](./webrtc-nat)，到本页做横向对比与选型收口。

记住选型的两刀：先分**拉 / 推**，再分**单向 / 双向 / 端到端**——

- **服务器单向推**用 **SSE**（最省心，且正搭 AI 流式回潮）；
- **双向交互**用 **WebSocket**（全双工 + 二进制，生态最成熟）；
- **浏览器间 P2P 媒体**用 **WebRTC**（延迟最低，代价是信令与 NAT 穿透）；
- **简单偶发**用**轮询**兜底（优先长轮询）。

至于 HTTP/2 Server Push，它从来不是实时方案且已废弃；而 **WebTransport over HTTP/3** 是值得持续关注的下一站。各方案的机制细节与代码请回看对应分页，本站术语与外部规范链接见 [参考](../reference)。
