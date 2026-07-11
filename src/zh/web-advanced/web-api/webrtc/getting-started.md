---
layout: doc
outline: [2, 3]
---

# 入门：API 视角、三大件与最小连接模型

> 基于 WebRTC 1.0（W3C Recommendation）与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **一句话定位**：WebRTC API 是浏览器暴露的**实时通信协议栈开口**——两个端点直连传音视频与任意数据，媒体不过服务器、传输强制加密。
- **三大件**：**媒体捕获**（`navigator.mediaDevices.getUserMedia()` / `getDisplayMedia()` 产出 `MediaStream`）、**点对点连接**（`RTCPeerConnection`：协商、ICE、加密、收发）、**数据通道**（`RTCDataChannel`：任意数据，API 刻意仿 WebSocket）。
- **与协议层分工**：本叶讲 **API 编排**；ICE/STUN/TURN/SDP/NAT 穿透原理见[网络章 · WebRTC 与 NAT 穿透](/zh/base/network/net-realtime/guide-line/webrtc-nat)，不在此重复展开。
- **信令不在标准内**：WebRTC 刻意不规定 offer/answer 与候选怎么送达对端——自备通道（常用 WebSocket），信令服务器只在建连阶段牵线。
- **最小连接五步**：`getUserMedia` 拿流 → `new RTCPeerConnection({ iceServers })` → `addTrack()` 放轨 → offer/answer 经信令互换（四个 set/create 调用）→ 候选互递 + `ontrack` 收远端媒体。
- **SDP 的 API 投影**：会话描述在 API 里是 `RTCSessionDescription`（`{ type, sdp }`），由 `createOffer()`/`createAnswer()` 产出、`setLocalDescription()`/`setRemoteDescription()` 落位。
- **ICE 候选的 API 投影**：本端候选从 `icecandidate` 事件逐个冒出（Trickle ICE），经信令送对端后用 `addIceCandidate()` 喂入。
- **STUN/TURN 的 API 投影**：只是构造参数 `iceServers: [{ urls: "stun:…" }, { urls: "turn:…", username, credential }]`，服务器本身要自己找/自己架。
- **媒体模型**：`MediaStream` 是轨道容器，`MediaStreamTrack` 才是音/视频实体；接 `<video>` 用 `srcObject`（不是 `src`）。
- **三个状态机**：`signalingState`（协商到哪步）、`iceConnectionState`（ICE 通没通）、`connectionState`（聚合总态，日常监控看它）。
- **数据通道一句话**：`pc.createDataChannel(label)` 创建、对端 `datachannel` 事件接住；`open` 后 `send()`/`message` 收发，用法与 WebSocket 几乎一致。
- **安全底线**：媒体捕获仅**安全上下文**（HTTPS/localhost）可用；媒体走 SRTP、数据走 DTLS，**没有不加密的 WebRTC**。
- **标准状态**：WebRTC 1.0 **2021-01 成为 W3C Recommendation**；`RTCPeerConnection`/`RTCDataChannel`/`getUserMedia` 全绿多年（Baseline Widely available）。
- **较新的能力**：Encoded Transform（编码帧变换，E2EE）**2025 达成 Baseline**；`setCodecPreferences` 自 Firefox 128（2024 中）补齐后全浏览器可用。
- **adapter.js 的位置**：历史上抹平前缀与实现差异的官方 shim；现代浏览器写标准 API 基本不再需要，但老教程里几乎必现，读到别慌。
- **接口地形**：连接管理（`RTCPeerConnection` 系）、媒体收发（`RTCRtpSender`/`RTCRtpReceiver`/`RTCRtpTransceiver`）、统计（`RTCStatsReport`）、编码帧变换（`RTCRtpScriptTransform` 系）、电话互通（DTMF）、身份（Identity）。
- **进阶顺序**：本页 → [媒体捕获与设备](./guide-line/media-capture) → [RTCPeerConnection 生命周期](./guide-line/peer-connection) → [完美协商与数据通道](./guide-line/negotiation-datachannel) → [getStats 与 Encoded Transform](./guide-line/stats-transform) → [参考](./reference)。

## 一、定位：浏览器里的实时通信协议栈开口

到 WebRTC 之前，浏览器的网络能力全是**客户端 ↔ 服务器**形态：fetch 请求-响应、SSE 单向推送、WebSocket 双工——数据都必须经过你的服务器。WebRTC 打开的是另一个维度：**端点 ↔ 端点**。两个浏览器各自完成 NAT 穿透后直接互发媒体与数据，服务器只在「牵线」阶段出场。

从 API 视角看，它是三块拼图（MDN 官方口径）：

| 拼图 | 核心 API | 规范归属 | 解决什么 |
| --- | --- | --- | --- |
| **媒体捕获** | `MediaDevices.getUserMedia()` / `getDisplayMedia()` → `MediaStream` | Media Capture and Streams / Screen Capture | 把摄像头、麦克风、屏幕内容变成可编程的**媒体流** |
| **点对点连接** | `RTCPeerConnection` | WebRTC 1.0（w3c/webrtc-pc） | 两端之间的**协商、打通、加密、收发**全生命周期 |
| **数据通道** | `RTCDataChannel` | WebRTC 1.0 | 在同一条 P2P 通路上传**任意数据**，可靠性语义可调 |

三块可独立使用：纯数据场景（文件直传、联机游戏）只用后两块，不碰摄像头；媒体捕获也常单独服务于拍照、录屏（配 MediaRecorder）等本地场景。

## 二、与协议层的分工：哪些概念去网络章看

WebRTC 的水下部分（ICE/STUN/TURN/SDP/NAT）本站已在网络章完整产出。本叶的原则：**协议概念只讲它在 API 上的投影**，原理链接过去不重复。

| 协议概念 | 在 API 里的样子 | 原理去处 |
| --- | --- | --- |
| SDP 会话描述 / Offer-Answer 模型 | `RTCSessionDescription`（`{ type: "offer" \| "answer", sdp }`），`createOffer()`/`createAnswer()` 产出 | [网络章 · 信令与 SDP](/zh/base/network/net-realtime/guide-line/webrtc-nat) |
| ICE 框架与候选（host/srflx/relay） | `icecandidate` 事件、`RTCIceCandidate`、`addIceCandidate()` | [网络章 · ICE 四阶段](/zh/base/network/net-realtime/guide-line/webrtc-nat) |
| STUN / TURN 服务器 | 构造参数 `iceServers` 里的一条条 URL | [网络章 · STUN 打洞与 TURN 兜底](/zh/base/network/net-realtime/guide-line/webrtc-nat) |
| NAT 类型与打洞成败 | API 无感知，表现为连接状态是否到 `connected` | [网络章 · NAT 与 DHCP](/zh/base/network/net-ip-routing/guide-line/nat-dhcp) |

::: info 信令服务器同样不展开
信令通道的**实现**（WebSocket 服务、房间管理、消息转发）是普通后端工程，不属于 WebRTC API；本叶只讲 API 侧「什么时候该把什么对象发出去/喂进来」的编排。
:::

## 三、最小连接心智模型

一次点对点连接的编排轴线——记住这张图，后面每一页都在给它的某一段加细节：

```text
   端 A                         信令服务器（自备）                      端 B
    │                                                                  │
    │ getUserMedia() 拿本地流                                          │
    │ new RTCPeerConnection()                                          │
    │ addTrack() 放入轨道                                              │
    │                                                                  │
    │ createOffer() → setLocalDescription()                            │
    │ ────────────── offer (SDP) ──────► 转发 ──────────────────────► │ setRemoteDescription(offer)
    │                                                                  │ addTrack() 放自己的轨道
    │                                                                  │ createAnswer() → setLocalDescription()
    │ setRemoteDescription(answer) ◄──── 转发 ◄────── answer (SDP) ── │
    │                                                                  │
    │ ═══ 双方 icecandidate 事件逐个冒候选，经信令互递给对方 addIceCandidate() ═══
    │                                                                  │
    │ ◄═════════════ ICE 打通后：媒体/数据 P2P 直连，不再过服务器 ══════════════► │
    │ ontrack 收到远端轨道                                 ontrack 收到远端轨道 │
```

下面是一个**保存为单个 HTML 文件就能跑**的最小例子——把「两端」放在同一个页面里（信令退化为变量直传），用数据通道验证全流程。真实项目里，标了「信令」的行换成经 WebSocket 发给对端即可：

```html
<script>
  // 本地演示：同页两个 RTCPeerConnection 互连，省去信令服务器
  const pcA = new RTCPeerConnection(); // 同机直连，可不配 iceServers
  const pcB = new RTCPeerConnection();

  // A 创建数据通道；B 靠 datachannel 事件接住对端建的通道
  const channel = pcA.createDataChannel("demo");
  channel.onopen = () => channel.send("你好，B！");
  pcB.ondatachannel = ({ channel: ch }) => {
    ch.onmessage = ({ data }) => console.log("B 收到：", data);
  };

  // ICE 候选互递（真实场景这两行经信令服务器转发）
  pcA.onicecandidate = ({ candidate }) =>
    candidate && pcB.addIceCandidate(candidate); // 信令
  pcB.onicecandidate = ({ candidate }) =>
    candidate && pcA.addIceCandidate(candidate); // 信令

  // offer/answer 编排：四个调用、两次跨端投递
  (async () => {
    await pcA.setLocalDescription(await pcA.createOffer()); // A 出价
    await pcB.setRemoteDescription(pcA.localDescription); // 信令：offer 送达 B
    await pcB.setLocalDescription(await pcB.createAnswer()); // B 应价
    await pcA.setRemoteDescription(pcB.localDescription); // 信令：answer 送回 A
  })();
</script>
```

第一次接触就该立住的几个事实：

- **四个核心调用两两成对**：`create*` 只是「生成描述」，必须再 `setLocalDescription()` 才生效；对端的描述用 `setRemoteDescription()` 落位——每端各存本地/远端两份描述。
- **候选是异步陆续到的**：`setLocalDescription()` 之后 ICE 层才开始收集候选，`icecandidate` 事件一个个冒出来（Trickle ICE，边收集边发，不等收齐）。
- **连接真正可用看事件**：数据通道等 `open` 事件、媒体等 `track` 事件——offer/answer 换完只是「谈妥了」，ICE 打通才是「路通了」。

## 四、真实世界的形态：信令通道

上例把信令退化成了变量传递；真实两台设备之间，offer/answer 与候选必须经**你自己的服务器**中转。要求是「双向、低延迟、可即时推送」，所以工程上几乎都用 [WebSocket](/zh/base/network/net-realtime/guide-line/websocket-protocol)。两个要点：

1. **信令服务器只管转发**：它不理解 SDP 内容，收到消息原样投给房间里的另一端即可，建连完成后媒体/数据不再经过它；
2. **朴素编排有坑**：双方同时发 offer 会碰撞（glare）。别自己发明处理逻辑——MDN 官方给出的 **perfect negotiation 样板**已把碰撞、回滚、竞态全部解决，见[完美协商页](./guide-line/negotiation-datachannel)。

## 五、接口地形图

WebRTC 的接口很多，按 MDN 官方分类建立地形感（详表见[参考页](./reference)）：

| 类别 | 主要成员 | 一句话 |
| --- | --- | --- |
| **连接建立与管理** | `RTCPeerConnection`、`RTCSessionDescription`、`RTCIceCandidate`、`RTCIceTransport`、`RTCSctpTransport` | 连接生命周期的主战场 |
| **媒体收发** | `RTCRtpSender`、`RTCRtpReceiver`、`RTCRtpTransceiver`、`RTCTrackEvent` | 每条轨道的编码发送/接收解码控制 |
| **数据通道** | `RTCDataChannel`、`RTCDataChannelEvent` | 任意数据的双向管道 |
| **统计** | `RTCStatsReport` 及各类 stats 字典 | `getStats()` 的产出，调试与监控 |
| **编码帧变换** | `RTCRtpScriptTransform`、`RTCRtpScriptTransformer`、`RTCEncodedVideoFrame`/`RTCEncodedAudioFrame` | 在编码帧管线插 Worker 变换（E2EE/水印） |
| **电话互通** | `RTCDTMFSender` | 向 PSTN 网关发 DTMF 拨号音，Web 场景少用 |
| **身份** | `RTCIdentityProvider`、`RTCCertificate` 等 | 身份断言与证书，多数应用用不到 |

配套的媒体侧接口（`MediaDevices`、`MediaStream`、`MediaStreamTrack`）属于 Media Capture and Streams 规范，是下一页的主角。

## 六、标准与浏览器支持现状

| 能力 | 状态（核于 2026-07） |
| --- | --- |
| `RTCPeerConnection` / `RTCDataChannel` / `getUserMedia` | **全浏览器全绿多年**（Baseline Widely available） |
| `getDisplayMedia` 屏幕共享 | 全绿（桌面端；移动端能力受系统限制） |
| 无参 `setLocalDescription()` / `restartIce()` / perfect negotiation 依赖的现代行为 | 全绿 |
| `setCodecPreferences` 编解码偏好 | **Firefox 128（2024 中）补齐后全绿**；Chrome M124 起严格校验入参 |
| Encoded Transform（`RTCRtpScriptTransform`） | **2025 达成 Baseline Newly available** |
| `addStream()` 等老 API | 已废弃，一律用 `addTrack()`/`ontrack` |

结论：**「能不能用」在 2026 年完全不是问题**——WebRTC 1.0 是 2021-01 定稿的 W3C Recommendation，核心能力全绿多年，连 adapter.js 这个历史兼容 shim 都基本退休了。真正的功课在「怎么把编排写对」：约束系统、状态机、协商样板，这正是后面四页的内容。

下一页从数据的源头开始——摄像头、麦克风与屏幕如何变成可编程的媒体流：[媒体捕获与设备](./guide-line/media-capture)。
