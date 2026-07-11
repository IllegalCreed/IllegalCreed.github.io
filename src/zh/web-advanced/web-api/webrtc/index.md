---
layout: doc
---

# WebRTC API

WebRTC（Web Real-Time Communication）是**浏览器原生的实时通信 API 集**：不装插件、不经服务器中转，让两个端点（浏览器之间、或浏览器与原生应用）直接传输**音视频与任意数据**。它由三大件构成——**媒体捕获**（`getUserMedia` / `getDisplayMedia`，属 Media Capture and Streams / Screen Capture 规范）、**点对点连接**（`RTCPeerConnection`，负责 offer/answer 协商、ICE 打通与加密传输）、**数据通道**（`RTCDataChannel`，可靠性语义可调的任意数据管道）。WebRTC 1.0 于 **2021-01 成为 W3C Recommendation**，核心 API 已在全部主流浏览器全绿多年；近年增量也在补齐——**Encoded Transform**（编码帧管线插 `TransformStream`，端到端加密的正门）**2025 年达成 Baseline**，`setCodecPreferences` 自 Firefox 128（2024 年中）补齐后全浏览器可用。本叶只讲**浏览器 API 的编排**；ICE/STUN/TURN/SDP 与 NAT 穿透的协议原理已在[网络章 · WebRTC 与 NAT 穿透](/zh/base/network/net-realtime/guide-line/webrtc-nat)产出，两边配合读。

## 评价

**优点**

- **浏览器原生 P2P**：无插件、无第三方 SDK，标准 API 直连两端——媒体与数据尽量不过服务器，延迟压到最低、服务器带宽成本降到几乎为零
- **传输默认强制加密**：媒体走 SRTP、数据走 DTLS/SCTP，规范层面没有「明文模式」可选，安全性是内建属性而非附加配置
- **三大件正交组合**：只传数据可以不碰摄像头；音视频与数据通道复用同一条打通的 ICE 通路，一次穿透全家受益
- **数据通道语义可调**：同一个 API 既能配成「可靠 + 有序」（TCP 风格，文件直传），也能配成「不可靠 + 无序」（UDP 风格，实时游戏状态），按场景取舍
- **标准成熟且仍在演进**：W3C Recommendation + 核心全绿多年；Encoded Transform（E2EE/水印）、`restartIce()`、无参 `setLocalDescription()` 等现代能力持续落地
- **统计体系完备**：`getStats()` 标准化了上百项指标，丢包、RTT、码率、当前线路都有据可查

**局限**

- **信令自备**：标准刻意不规定信令通道，起步就得自建服务器（常用 WebSocket）转发 offer/answer 与候选——「Hello World 门槛」远高于普通 Web API
- **连接编排复杂**：三个状态机并行推进，offer/answer 有时序陷阱（双方同时出价的 glare 碰撞），必须按 perfect negotiation 样板写才稳
- **NAT 穿透有成本**：对称型 NAT 下打洞必败、只能走 TURN 中继，TURN 带宽费用是生产部署的主要开销（原理见[网络章](/zh/base/network/net-realtime/guide-line/webrtc-nat)）
- **多人场景超出 P2P**：全互连 mesh 的上行带宽随人数平方增长，生产级多方会议要引入 SFU/MCU 媒体服务器——那已是服务端架构问题，浏览器 API 管不到
- **调试门槛高**：异步协商 + 网络分层，出问题得靠 `getStats()` / `chrome://webrtc-internals` 逐层排查，报错信息往往离根因很远
- **历史包袱不少**：`addStream()` 等废弃 API、过时教程满天飞，读旧资料需认准现行标准形态（`addTrack`/`ontrack`、无参 `setLocalDescription()`）

一句话选型：**要在两个端点之间传实时音视频或低延迟数据（视频通话、屏幕共享、文件直传、联机对战），WebRTC 是浏览器里唯一的原生答案**；纯客户端-服务器的推送/双工需求用 SSE/WebSocket 即可，不必引入 P2P 的复杂度。

## 本叶地图

- [入门](./getting-started) —— API 视角定位（媒体捕获/点对点连接/数据通道三大件）、最小连接心智模型、与协议层的分工边界、接口地形图与支持现状
- [媒体捕获与设备](./guide-line/media-capture) —— `getUserMedia` 与约束系统（ideal/exact）、权限模型与异常处理、`enumerateDevices` 设备选择、`getDisplayMedia` 屏幕共享
- [RTCPeerConnection 生命周期](./guide-line/peer-connection) —— 构造配置、`addTrack`/`ontrack`、offer/answer 编排、ICE 候选事件、三个状态机与 `restartIce()` 故障恢复、transceiver 与编解码控制
- [完美协商与数据通道](./guide-line/negotiation-datachannel) —— glare 碰撞、polite/impolite 角色与 rollback、官方样板逐段解读；`RTCDataChannel` 可靠性三选项、二进制收发与背压
- [getStats 统计调试与 Encoded Transform](./guide-line/stats-transform) —— 统计报告模型与指标食谱（丢包/RTT/码率/当前线路）、`RTCRtpScriptTransform` 编码帧变换与 E2EE 场景
- [参考](./reference) —— API 速查表 + 状态机图表 + 易错点清单 + 资源链接

## 文档地址

[MDN WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

## GitHub 地址

[w3c/webrtc-pc](https://github.com/w3c/webrtc-pc)（WebRTC 1.0 规范仓库）

## 幻灯片地址

<a href="/SlideStack/webrtc-slide/" target="_blank">WebRTC API</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=webrtc-api" target="_blank" rel="noopener noreferrer">WebRTC API 测试题</a>
