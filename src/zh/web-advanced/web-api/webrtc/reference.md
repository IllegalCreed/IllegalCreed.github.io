---
layout: doc
outline: [2, 3]
---

# 参考：API 速查 / 状态机 / 易错点

> 基于 WebRTC 1.0（W3C Recommendation）与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **三大件**：媒体捕获（`getUserMedia`/`getDisplayMedia` → `MediaStream`）、点对点连接（`RTCPeerConnection`）、数据通道（`RTCDataChannel`）；核心 API **全绿多年**（WebRTC 1.0 = W3C Recommendation，2021-01）。
- **本叶分工**：只讲浏览器 API 编排；ICE/STUN/TURN/SDP/NAT 原理见[网络章](/zh/base/network/net-realtime/guide-line/webrtc-nat)。
- **最小编排**：`getUserMedia` → `addTrack` → `createOffer`/`setLocalDescription` → 信令互换描述与候选 → `addIceCandidate` + `ontrack`。
- **无参 `setLocalDescription()`**：按 `signalingState` 自动生成 offer（stable）或 answer（have-remote-offer）——现代样板标准姿势。
- **完美协商**：polite 端靠 `setRemoteDescription(offer)` **隐式 rollback** 让步；impolite 端 `ignoreOffer` 无视碰撞；三标志位 `makingOffer`/`ignoreOffer`/`isSettingRemoteAnswerPending`。
- **三状态机**：`signalingState`（协商步点）/ `iceConnectionState`（ICE 通路）/ `connectionState`（**聚合总态，日常只看它**）。
- **故障分寸**：`disconnected` 可自愈先等待；`failed` 才 `restartIce()`；`closed` 终态必须新建实例。
- **getUserMedia 约束**：裸值/`ideal` 尽力不失败；`min`/`max`/`exact` 强制、无解 `OverconstrainedError`（弹权限框之前就失败，属指纹面）。
- **媒体异常分诊**：`NotAllowedError`（拒绝/策略）/ `NotFoundError`（无设备）/ `NotReadableError`（被占用）/ `OverconstrainedError`（约束无解）/ `TypeError`（空约束或 HTTP 页）。
- **屏幕共享三铁律**：不可预选源、权限不可持久化（每次弹框）、需瞬时用户激活；约束禁 `min`/`exact`。
- **设备枚举**：授权前 `label` 全空串——先 `getUserMedia` 再 `enumerateDevices`；插拔听 `devicechange`。
- **DataChannel 可靠性**：`ordered`（默认 true）+ `maxRetransmits` **或** `maxPacketLifeTime`（互斥，同设 `SyntaxError`）；默认全可靠 = TCP 风格，`{ ordered:false, maxRetransmits:0 }` = UDP 风格。
- **DataChannel 细节**：`binaryType` 默认 `"arraybuffer"`（WebSocket 默认 `"blob"`）；大数据分块（16 KiB 稳）+ `bufferedAmount`/`bufferedamountlow` 背压；每连接至多 65,534 条。
- **getStats**：`Promise<RTCStatsReport>`（只读 Map-like）；累计值**两次采样求差**；当前线路 = `transport.selectedCandidatePairId` → `candidate-pair` → 两端 `candidateType`（`relay` = 走 TURN）。
- **setCodecPreferences**：入参必须来自 `RTCRtpReceiver.getCapabilities()`（Chrome M124 严格校验）；Firefox 128 补齐后全绿；**不触发 `negotiationneeded`**，重协商才生效。
- **Encoded Transform**：**Baseline 2025**；`new RTCRtpScriptTransform(worker, options, [transfer])` 赋给 `sender.transform`/`receiver.transform`；worker 里 `rtctransform` 事件接 `readable → TransformStream → writable`；关键帧 `generateKeyFrame()`/`sendKeyFrameRequest()`。
- **换轨不重协商**：`sender.replaceTrack(newTrack)`——摄像头 ↔ 屏幕共享无缝切。
- **调试台**：`chrome://webrtc-internals` / `about:webrtc`——时间线、SDP、stats 曲线，排障第一站。

## 一、接口总览

| 类别 | 接口 | 一句话 |
| --- | --- | --- |
| 连接管理 | `RTCPeerConnection` | 连接生命周期主对象 |
| | `RTCSessionDescription` | `{ type, sdp }` 会话描述 |
| | `RTCIceCandidate` | 单个 ICE 候选 |
| | `RTCIceTransport` / `RTCDtlsTransport` / `RTCSctpTransport` | ICE / DTLS / SCTP 传输层对象 |
| 媒体收发 | `RTCRtpSender` / `RTCRtpReceiver` | 单轨的发送/接收控制（`replaceTrack`、`getStats`、`transform`） |
| | `RTCRtpTransceiver` | sender+receiver 配对（`direction`、`setCodecPreferences`） |
| | `RTCTrackEvent` | `track` 事件对象（`track`/`streams`/`receiver`） |
| 数据通道 | `RTCDataChannel` / `RTCDataChannelEvent` | 任意数据管道 / `datachannel` 事件对象 |
| 统计 | `RTCStatsReport` | `getStats()` 产出的 Map-like 报告 |
| 编码帧变换 | `RTCRtpScriptTransform` / `RTCRtpScriptTransformer` | 主线程句柄 / worker 侧对象（`readable`/`writable`/`options`/关键帧方法） |
| | `RTCEncodedVideoFrame` / `RTCEncodedAudioFrame` | 可改写 `data` 的编码帧 |
| 电话互通 | `RTCDTMFSender` | 发 DTMF 拨号音（PSTN 网关场景） |
| 身份 | `RTCCertificate`、`RTCIdentityProvider` 等 | 证书与身份断言，多数应用不触碰 |
| 媒体侧配套 | `MediaDevices` / `MediaStream` / `MediaStreamTrack` | 捕获入口 / 轨道容器 / 音视频轨（Media Capture 规范） |

## 二、RTCPeerConnection 成员速查

### 属性

| 属性 | 说明 |
| --- | --- |
| `connectionState` | 聚合总态：`new`/`connecting`/`connected`/`disconnected`/`failed`/`closed` |
| `iceConnectionState` | ICE 通路：`new`/`checking`/`connected`/`completed`/`disconnected`/`failed`/`closed` |
| `iceGatheringState` | 候选收集：`new`/`gathering`/`complete` |
| `signalingState` | 协商步点：`stable`/`have-local-offer`/`have-remote-offer`/`have-local-pranswer`/`have-remote-pranswer`/`closed` |
| `localDescription` / `remoteDescription` | 快捷读法：pending 非空取 pending，否则取 current |
| `pendingLocalDescription` / `currentLocalDescription`（remote 同构） | 提议中 / 已敲定的描述 |
| `sctp` | 数据通道的 `RTCSctpTransport`（含 `maxMessageSize`） |
| `canTrickleIceCandidates` | 对端是否支持 Trickle ICE（setRemoteDescription 后可读） |

### 方法

| 方法 | 说明 |
| --- | --- |
| `createOffer()` / `createAnswer()` | 生成描述（不落位） |
| `setLocalDescription(desc?)` | 落位本地描述；**无参自动生成**；`{ type: "rollback" }` 显式回滚 |
| `setRemoteDescription(desc)` | 落位远端描述；`have-local-offer` 时收 offer **隐式回滚** |
| `addIceCandidate(candidate)` | 喂入对端候选（须已 setRemoteDescription） |
| `addTrack(track, ...streams)` | 放轨，返回 `RTCRtpSender`；触发 `negotiationneeded` |
| `removeTrack(sender)` | 移轨（入参是 sender）；触发重协商 |
| `addTransceiver(kind \| track, init?)` | 显式建收发器；`direction: "sendrecv"/"sendonly"/"recvonly"/"inactive"` |
| `createDataChannel(label, options?)` | 建数据通道；首条触发 `negotiationneeded` |
| `getSenders()` / `getReceivers()` / `getTransceivers()` | 当前全部收发器 |
| `getStats(selector?)` | 统计报告 |
| `restartIce()` | 重跑 ICE（触发带 iceRestart 的 `negotiationneeded`），`failed` 的标准解 |
| `setConfiguration(config)` | 运行时改 ICE 服务器等（配合 restartIce 换 TURN） |
| `close()` | 关闭，终态不可复用 |

### 事件

| 事件 | 触发 |
| --- | --- |
| `negotiationneeded` | 需要（重）协商；仅 `stable` 状态触发 |
| `icecandidate` | 本端新候选（`candidate` 空串 = 本代收集完**要转发**；`null` = 结束哨兵不用发） |
| `icecandidateerror` | 某 STUN/TURN 服务器出错（诊断用，不等于连接失败） |
| `track` | 远端轨道到达（`RTCTrackEvent`） |
| `datachannel` | 对端建了 in-band 数据通道 |
| `connectionstatechange` / `iceconnectionstatechange` / `icegatheringstatechange` / `signalingstatechange` | 四个状态机各自的变更通知 |

## 三、状态机对照

一次顺利建连的时间线：

```text
signalingState:      stable ──► have-local-offer ────────────► stable
                              （呼叫方视角；应答方走 have-remote-offer）
iceGatheringState:   new ─────► gathering ──────► complete
iceConnectionState:  new ─────► checking ─► connected（► completed）
connectionState:     new ─────► connecting ─────► connected
                                                     │
                              网络抖动 ◄─ disconnected（可自愈，等待）
                                                     │
                              确认失败 ◄─ failed ──► restartIce() 重打通
                                                     │
                                        close() ──► closed（终态）
```

| 关注点 | 结论 |
| --- | --- |
| 日常监控 | 只挂 `connectionstatechange`，看 `connectionState` |
| `disconnected` | 瞬断（如 WiFi 切 4G），**规范允许自愈**——别立刻重建 |
| `failed` | ICE 确认无路可走——`restartIce()`，媒体管线保留 |
| `connected` 的含义 | 所有在用传输就绪（ICE 通 + DTLS 握手完） |
| `iceConnectionState` 的 `completed` | 候选检查全部收尾（比 `connected` 更「尘埃落定」） |
| `signalingState` 用途 | 协商编排内部判断（完美协商样板）；业务层少碰 |

## 四、媒体捕获速查

### getUserMedia 约束

| 写法 | 强度 | 失败行为 |
| --- | --- | --- |
| `width: 1280` / `{ ideal: 1280 }` | 尽力（有引力，按 fitness distance 择优） | 不失败 |
| `{ min }` / `{ max }` / `{ exact }` | 强制 | 无解 `OverconstrainedError`（先于权限框，指纹面） |

常用键：`width` / `height` / `frameRate` / `aspectRatio` / `facingMode`（`"user"`/`"environment"`）/ `deviceId` / `resizeMode`（`"none"`/`"crop-and-scale"`）；音频 `echoCancellation` / `noiseSuppression` / `autoGainControl`。

轨道四件套：`getCapabilities()`（可行范围）/ `getSettings()`（当前实际）/ `getConstraints()`（我要求过的）/ `applyConstraints()`（运行时改）。

### 异常速查

| `err.name` | 原因 | 对策 |
| --- | --- | --- |
| `NotAllowedError` | 用户拒绝 / Permissions Policy 禁止 | 引导重开权限；iframe 查 `allow="camera; microphone"` |
| `NotFoundError` | 无满足要求的设备 | 放宽约束/提示接设备 |
| `NotReadableError` | 系统层拿不到（被占用等） | 提示关闭占用应用；移动端切摄像头先 `stop()` |
| `OverconstrainedError` | 约束无解（`err.constraint` 指认） | 降级为 ideal 重试 |
| `TypeError` | 约束全空/全 false；HTTP 页 `mediaDevices` 为 `undefined` | 修约束/上 HTTPS |
| `AbortError` / `SecurityError` / `InvalidStateError` | 设备启动异常 / 文档禁用媒体 / 文档非活动 | 按场景处理 |

### getDisplayMedia 专属

| 要点 | 内容 |
| --- | --- |
| 三铁律 | 不可预选源（选项仅在用户选定后套用）、权限不可持久化（每次弹框）、需瞬时用户激活 |
| 约束限制 | `video: false` 抛 `TypeError`；禁 `min`/`exact` |
| 专属选项 | `preferCurrentTab`、`selfBrowserSurface`（防镜中镜）、`surfaceSwitching`、`systemAudio`、`monitorTypeSurfaces`、`windowAudio`、`controller`（`CaptureController`） |
| 收尾正门 | 视频轨 `ended` 事件（用户点浏览器「停止共享」条） |
| 接进通话 | `sender.replaceTrack(screenTrack)`——不重协商 |

## 五、RTCDataChannel 速查

### createDataChannel 选项

| 选项 | 默认 | 说明 |
| --- | --- | --- |
| `ordered` | `true` | 是否保序 |
| `maxRetransmits` | `null` | 最多重传次数（与下互斥，同设 `SyntaxError`） |
| `maxPacketLifeTime` | `null` | 最多重传毫秒数 |
| `negotiated` | `false` | `false` = in-band（对端 `datachannel` 事件）；`true` = 双端同 `id` 各自建 |
| `id` | 自动 | 0–65534；negotiated 模式必须两端一致 |
| `protocol` | `""` | 子协议名（≤ 65,535 字节；`label` 同限） |

### 实例属性与事件

| 成员 | 说明 |
| --- | --- |
| `readyState` | `connecting` → `open` → `closing` → `closed`；**`open` 后才能 `send()`** |
| `binaryType` | 默认 **`"arraybuffer"`**（WebSocket 默认 `"blob"`） |
| `bufferedAmount` / `bufferedAmountLowThreshold`（默认 0） | 发送缓冲字节数 / 低水位阈值 |
| `label` / `id` / `protocol` / `negotiated` | 创建期参数的只读反射 |
| `ordered` / `maxRetransmits` / `maxPacketLifeTime` | 可靠性配置只读反射 |
| 事件 | `open` / `message` / `bufferedamountlow` / `closing` / `close` / `error` |

### 可靠性组合

| 配置 | 语义 | 场景 |
| --- | --- | --- |
| 默认（全缺省） | 可靠 + 有序（TCP 风格） | 文件、聊天、控制指令 |
| `{ ordered: false }` | 可靠 + 不保序 | 独立消息、顺序自带序号 |
| `{ ordered: false, maxRetransmits: 0 }` | 不可靠 + 不保序（UDP 风格） | 游戏状态、实时坐标 |
| `{ maxPacketLifeTime: 500 }` | 限时重传 | 过期即弃的实时数据 |

大数据传输三件套：**分块**（16 KiB 稳妥；`pc.sctp.maxMessageSize` 可读协商上限，SDP 缺席按 64 KB 估）、**背压**（`bufferedAmount` 高于阈值就等 `bufferedamountlow`）、**结束标记**（自定义协议告知对端收完）。

## 六、getStats 速查

| 常用 `type` | 关键字段 |
| --- | --- |
| `inbound-rtp` | `packetsLost` / `jitter` / `framesPerSecond` / `bytesReceived` / `kind` |
| `outbound-rtp` | `bytesSent` / `framesEncoded` / `qualityLimitationReason`（`"bandwidth"`/`"cpu"`） |
| `remote-inbound-rtp` | 对端收我的回执：`packetsLost` / `roundTripTime` / `fractionLost` |
| `candidate-pair` | `state` / `nominated` / `currentRoundTripTime` / `availableOutgoingBitrate` |
| `local-candidate` / `remote-candidate` | `candidateType`（`host`/`srflx`/`relay`）/ `protocol` |
| `transport` | **`selectedCandidatePairId`** / `dtlsState` |
| `media-source` | 编码前源帧率/分辨率（对比 outbound 定位瓶颈在采集还是编码） |
| `data-channel` | `messagesSent` / `bytesReceived` / `state` |

三条铁律：**累计值两次采样求差**；**跨采样用 `id` 对齐**；**当前线路从 `transport.selectedCandidatePairId` 顺藤摸瓜**（`candidateType === "relay"` 即走 TURN）。

## 七、Encoded Transform 速查

| 要点 | 内容 |
| --- | --- |
| 定位 | 编码后/解码前帧管线插 Worker 里的 `TransformStream`（E2EE、水印、自定义帧头） |
| 支持 | **Baseline 2025**；检测 `"transform" in RTCRtpSender.prototype` |
| 主线程 | `new RTCRtpScriptTransform(worker, options, [transferables])` → `sender.transform` / `receiver.transform`（`ontrack` 里挂保证首帧） |
| Worker | `rtctransform` 事件 → `event.transformer.readable.pipeThrough(ts).pipeTo(event.transformer.writable)` |
| 帧对象 | `RTCEncodedVideoFrame` / `RTCEncodedAudioFrame`——改 `data`（`ArrayBuffer`）后 `enqueue` |
| 差异 | `writableStrategy`/`readableStrategy` 被忽略（排队策略浏览器管） |
| 通信 | `MessageChannel` 端口作 option 传入并 transfer；worker 读 `event.transformer.options.port` |
| 关键帧 | 发端 `transformer.generateKeyFrame(rid?)`；收端 `transformer.sendKeyFrameRequest()`；E2EE 换密钥必配 |

## 八、易错点清单

**编排与协商**

- `createOffer()` 后忘 `setLocalDescription()`——候选收集永远不开始。
- 在 `negotiationneeded` 里手写 `createOffer` 不处理碰撞——用完美协商样板；样板的标志位时序**别「优化」**。
- polite/impolite 配成两端一样——都让 = 反复互撞，都不让 = 死锁。
- 候选比描述先到就丢弃——先缓存，`setRemoteDescription` 后再喂。
- 空字符串候选（end-of-candidates）没转发——对端 ICE 多等超时。
- `setCodecPreferences` 后以为立即生效——不触发 `negotiationneeded`，须重协商；入参必须来自 `RTCRtpReceiver.getCapabilities()`。

**状态与恢复**

- 把 `disconnected` 当 `failed`——杀死能自愈的连接；`failed` 才 `restartIce()`。
- `close()` 后复用实例——`closed` 是终态，重连新建。
- 用 `signalingState` 判「通话中」——它只管协商步点，通不通看 `connectionState`。

**媒体捕获**

- HTTP 页调用报 `TypeError`——`mediaDevices` 仅安全上下文存在。
- 先 `enumerateDevices` 后授权——`label` 全空串。
- 只置空 `srcObject` 当停止——设备仍占用；逐轨 `track.stop()`。
- 公开页滥用 `exact`/`min`——`OverconstrainedError` 先于权限框，还是指纹面。
- 移动端不 `stop()` 直接切 `facingMode`——`NotReadableError`。
- 想预选 `getDisplayMedia` 共享源——API 设计上不存在这能力。

**数据通道**

- 没等 `open` 就 `send()`——抛错；一切从 `open` 事件开始。
- `negotiated: true` 两端 `id` 不一致——永远对不上，且没有 `datachannel` 事件。
- `maxRetransmits` + `maxPacketLifeTime` 同设——`SyntaxError`。
- 拿 WebSocket 直觉用 `binaryType`——这边默认 `"arraybuffer"`。
- 单条大消息梭哈——超 `max-message-size` 失败 + 队头阻塞；分块 + 背压。

**统计与变换**

- 单次快照读速率——累计值必须求差。
- 随便挑条 `candidate-pair` 当当前线路——认 `transport.selectedCandidatePairId`。
- receiver transform 不在 `ontrack` 里挂——漏首帧，E2EE 下直接花屏。
- E2EE 换密钥不 `generateKeyFrame()`——新人黑屏到下个周期关键帧。

## 九、权威链接

- [MDN: WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API) —— 总览、接口分类与全部指南入口
- [MDN: getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) ｜ [getDisplayMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia) —— 约束、异常与隐私安全细则
- [MDN: WebRTC connectivity](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Connectivity) —— offer/answer 全流程与 pending/current 描述
- [MDN: Perfect negotiation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation) —— 官方样板原文
- [MDN: Using WebRTC data channels](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels) ｜ [RTCDataChannel](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel) —— 缓冲、消息大小与全成员
- [MDN: Using WebRTC Encoded Transforms](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_Encoded_Transforms) —— 变换接线、MessageChannel 与关键帧
- [MDN: RTCStatsReport](https://developer.mozilla.org/en-US/docs/Web/API/RTCStatsReport) —— 报告模型与统计类型总表
- [W3C: WebRTC 1.0](https://www.w3.org/TR/webrtc/) ｜ [w3c/webrtc-pc](https://github.com/w3c/webrtc-pc) —— 规范正文与仓库
- [W3C: Media Capture and Streams](https://www.w3.org/TR/mediacapture-streams/) ｜ [Screen Capture](https://www.w3.org/TR/screen-capture/) —— 捕获侧规范
- [webrtc.org](https://webrtc.org/) ｜ [WebRTC samples](https://webrtc.github.io/samples/) —— 官方示例集（每个 API 一个可跑 demo）
- 本站配套：[网络章 · WebRTC 与 NAT 穿透](/zh/base/network/net-realtime/guide-line/webrtc-nat) —— ICE/STUN/TURN/SDP 协议原理
