---
layout: doc
outline: [2, 3]
---

# RTCPeerConnection 生命周期

> 基于 WebRTC 1.0（W3C Recommendation）与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **构造**：`new RTCPeerConnection({ iceServers: [{ urls: "stun:…" }, { urls: "turn:…", username, credential }] })`；STUN/TURN 原理见[网络章](/zh/base/network/net-realtime/guide-line/webrtc-nat)，API 侧它们只是配置项。
- **强制中继**：`iceTransportPolicy: "relay"` 只用 TURN 候选（隐藏真实 IP / 验证 TURN 部署）。
- **放媒体**：`pc.addTrack(track, stream)` 返回 `RTCRtpSender`；`stream` 参数只作分组标记，对端在 `track` 事件的 `streams` 里按组收到。
- **收媒体**：`pc.ontrack = ({ track, streams, receiver }) => …`；老的 `addStream()`/`onaddstream` 已废弃，一律轨道模型。
- **换轨不重协商**：`sender.replaceTrack(newTrack)`——摄像头 ↔ 屏幕共享无缝切换的正门。
- **呼叫方五连**：`createOffer()` → `setLocalDescription(offer)` → 信令送 offer → 收 answer → `setRemoteDescription(answer)`。
- **应答方四连**：`setRemoteDescription(offer)` → `addTrack()` 放自己的媒体 → `createAnswer()` → `setLocalDescription(answer)` → 信令回传。
- **无参 `setLocalDescription()`**：按当前 `signalingState` 自动生成该出的描述（stable 出 offer、have-remote-offer 出 answer）——现代样板的标准姿势。
- **描述五属性**：`localDescription`/`remoteDescription` 是快捷读法 = `pending*` 非空取 `pending*`、否则取 `current*`；pending 表「提议中」、current 表「双方已敲定」。
- **候选外发**：`icecandidate` 事件逐个冒出本端候选（Trickle ICE），原样经信令发对端；**`candidate` 为空字符串是「本代收集完」通知，也要发**；`null` 是终止哨兵（等价 `iceGatheringState` 变 `complete`），不用发。
- **候选进来**：`await pc.addIceCandidate(candidate)`；必须在 `setRemoteDescription` 之后喂。
- **三个状态机**：`signalingState`（协商对话走到哪）、`iceConnectionState`（ICE 通路状态）、`connectionState`（ICE+DTLS 聚合总态）——**日常监控看 `connectionState`**。
- **connectionState 六值**：`new` → `connecting` → `connected`；`disconnected`（瞬断，**可自愈，先别动**）；`failed`（确认失败，**该出手了**）；`closed`。
- **故障恢复**：`pc.restartIce()` 重跑一轮 ICE 收集与检查（触发 `negotiationneeded` 带 iceRestart），**不必推倒连接**；`close()` 后实例不可复用，重连要新建。
- **`negotiationneeded`**：连接需要（重）协商时触发——`addTrack()`、首个 `createDataChannel()`、`restartIce()` 都会引发；**只在 `signalingState === "stable"` 时触发**。
- **transceiver 模型**：每条媒体 m-line 对应一个 `RTCRtpTransceiver`（sender + receiver 对）；`addTransceiver(kind, { direction })` 可显式声明 `sendrecv`/`sendonly`/`recvonly`/`inactive`。
- **编解码偏好**：`transceiver.setCodecPreferences(codecs)`——入参**必须来自 `RTCRtpReceiver.getCapabilities()`**（Chrome M124 起严格校验）；Firefox 128（2024 中）补齐后全绿；调用**不触发 `negotiationneeded`**，要重协商才生效。
- **成员导航**：`getSenders()`/`getReceivers()`/`getTransceivers()` 拿当前全部收发器。

## 一、构造与配置

`RTCPeerConnection` 是一次点对点连接的化身：从构造到 `close()`，协商、打洞、加密、收发全在它身上。构造参数里最重要的是 ICE 服务器列表：

```js
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:stun.example.com" }, // STUN：发现公网映射，辅助打洞直连
    {
      urls: "turn:turn.example.com", // TURN：打洞失败时的中继兜底
      username: "alice",
      credential: "secret",
    },
  ],
  // iceTransportPolicy: "relay", // 可选：只用 TURN 中继（隐藏真实 IP / 测 TURN）
});
```

STUN/TURN 各自解决什么、为什么对称 NAT 必须 TURN，这些在[网络章](/zh/base/network/net-realtime/guide-line/webrtc-nat)已完整展开；API 视角只需记住：**它们是配置项，服务器要自己准备**（公网有免费 STUN，TURN 因耗带宽通常自建，如 coturn）。不配 `iceServers` 也能构造——局域网/本机直连（host 候选可达）时依然能通。

## 二、媒体轨道的进与出

现行标准是**轨道模型**：`addTrack()` 送出、`track` 事件接收，`MediaStream` 只作为「哪些轨道属于同一组」的标记随行。

```js
// —— 发送侧：把本地流的每条轨放进连接 ——
const stream = await navigator.mediaDevices.getUserMedia({
  audio: true,
  video: true,
});
for (const track of stream.getTracks()) {
  pc.addTrack(track, stream); // 返回 RTCRtpSender，供后续控制该轨的发送
}

// —— 接收侧：远端轨道到达（协商成功后触发，每轨一次）——
pc.ontrack = ({ track, streams }) => {
  // streams[0] 是对端 addTrack 时标记的分组；直接整流接给 <video>
  track.onunmute = () => {
    remoteVideo.srcObject ??= streams[0]; // 已设置过就不重复赋值
  };
};
```

两个高频操作：

- **移除**：`pc.removeTrack(sender)`——注意收的是 `addTrack` 返回的 sender，不是 track；会触发重协商；
- **替换**：`await sender.replaceTrack(newTrack)`——同类轨道热替换**不需要重协商**，摄像头与屏幕共享互切、换摄像头都走这条路（见[媒体捕获页](./media-capture)的屏幕共享示例）。

`addStream()`/`onaddstream` 是废弃 API，老教程里见到一律换成上面的轨道写法。

## 三、offer/answer 编排全流程

连接的「谈判」环节：双方各自维护**本地描述**与**远端描述**两份 SDP，经信令通道互换。呼叫方（caller）与应答方（callee）的完整编排：

```js
// ═══════════ 呼叫方 ═══════════
const pc = new RTCPeerConnection(config);
for (const track of localStream.getTracks()) pc.addTrack(track, localStream);

// 1. 生成并设置 offer，经信令送出
await pc.setLocalDescription(await pc.createOffer());
signaling.send({ description: pc.localDescription });

// 2. 候选边收集边发（Trickle ICE，见下一节）
pc.onicecandidate = ({ candidate }) => signaling.send({ candidate });

// 3. 等 answer 回来落位
signaling.onmessage = async ({ description, candidate }) => {
  if (description?.type === "answer") {
    await pc.setRemoteDescription(description); // 双方配置齐了，媒体开始流动
  } else if (candidate) {
    await pc.addIceCandidate(candidate); // 对端候选喂给本地 ICE 层
  }
};
```

```js
// ═══════════ 应答方 ═══════════
signaling.onmessage = async ({ description, candidate }) => {
  if (description?.type === "offer") {
    await pc.setRemoteDescription(description); // 1. 先记下对方的提案
    for (const track of localStream.getTracks()) {
      pc.addTrack(track, localStream); // 2. 把自己的媒体放进去
    }
    await pc.setLocalDescription(await pc.createAnswer()); // 3. 生成并设置 answer
    signaling.send({ description: pc.localDescription }); // 4. 回传
  } else if (candidate) {
    await pc.addIceCandidate(candidate);
  }
};
```

**pending 与 current**：重协商时新提案可能被拒，所以描述有两档——`setLocalDescription()`/`setRemoteDescription()` 先把描述放进 `pendingLocalDescription`/`pendingRemoteDescription`（提议中），双方敲定后才晋升为 `currentLocalDescription`/`currentRemoteDescription`（生效中）。日常读的 `localDescription`/`remoteDescription` 是快捷属性：**pending 非空读 pending，否则读 current**。

现代写法还可以更省：`setLocalDescription()` **无参调用**会按当前状态自动 `createOffer` 或 `createAnswer` 并设置——这是[完美协商样板](./negotiation-datachannel)的基石。

## 四、ICE 候选交换

`setLocalDescription()` 一落位，ICE 层就开始收集候选地址，每发现一个就触发一次 `icecandidate` 事件——**边收集边发**（Trickle ICE），不等收齐，显著缩短建连时间：

```js
// 本端候选 → 信令 → 对端
pc.onicecandidate = ({ candidate }) => {
  // candidate 为 null 表示「全部收集结束」（终止哨兵，不必发给对端）
  // candidate.candidate 为空字符串表示「本代收集完」——这个要照常发！
  if (candidate) signaling.send({ candidate });
};

// 对端候选 → 本地 ICE 层（必须已 setRemoteDescription）
await pc.addIceCandidate(candidate);
```

三个配套事件/属性别混：

- `icegatheringstatechange`：`iceGatheringState` 在 `new` → `gathering` → `complete` 间迁移，`complete` 是「候选收集完」的现代判据（`null` 哨兵是 legacy 等价物）；
- `icecandidateerror`：某个 STUN/TURN 服务器不可达/鉴权失败时触发——**单个服务器报错不代表连接失败**（其他候选可能已经通了），当诊断日志用；
- **end-of-candidates**：事件里 `candidate.candidate === ""`（空字符串）是「本代候选收集完毕」的通知，**应照常经信令转发**并 `addIceCandidate()`，让对端 ICE 层知道别再等了。

## 五、三个状态机

连接推进过程中有三个状态属性并行变化，各答各的问题：

| 状态机 | 回答什么 | 取值 |
| --- | --- | --- |
| `signalingState` | **协商对话**走到哪步 | `stable` / `have-local-offer` / `have-remote-offer` / `have-local-pranswer` / `have-remote-pranswer` / `closed` |
| `iceConnectionState` | **ICE 通路**通没通 | `new` / `checking` / `connected` / `completed` / `disconnected` / `failed` / `closed` |
| `connectionState` | **连接总体**能不能用（聚合 ICE + DTLS 传输） | `new` / `connecting` / `connected` / `disconnected` / `failed` / `closed` |

一次顺利建连的时间线：

```text
signalingState:      stable ─► have-local-offer ─────────► stable（answer 落位）
iceConnectionState:  new ────► checking ─► connected（► completed）
connectionState:     new ────► connecting ─────► connected
```

**日常监控只看 `connectionState`**——它聚合了所有 ICE 与 DTLS 传输的状态，是「用户能不能听到对方」的最诚实答案：

```js
pc.onconnectionstatechange = () => {
  switch (pc.connectionState) {
    case "connected": // 全部传输就绪，媒体/数据在流动
      hideSpinner();
      break;
    case "disconnected": // 瞬断：WiFi 切 4G 等场景，多数能自愈——先等，别急着重建
      showReconnectingHint();
      break;
    case "failed": // 确认失败：重跑一轮 ICE，不必推倒整个连接
      pc.restartIce();
      break;
    case "closed": // close() 之后：实例不可复用，重连 = 新建 RTCPeerConnection
      cleanupUI();
      break;
  }
};
```

`disconnected` 与 `failed` 的分寸感是工程关键：**`disconnected` 是「可能是暂时的」**（丢了几个 STUN 心跳），规范允许它自己回到 `connected`，此时贸然重建反而把能自愈的连接杀死；**`failed` 才是「试过了，不行」**，标准动作是 `restartIce()`——它让 ICE 层带着新的 ufrag/密码重新收集与检查候选，走一轮重协商（触发 `negotiationneeded`），期间媒体管线与已协商的编解码都保留。`restartIce()` 也治不了的（如 TURN 都不可达），再考虑销毁重建 + 提示用户检查网络。

## 六、negotiationneeded：重协商的统一入口

连接的配置每次「变到需要对端知情」的程度，浏览器就触发 `negotiationneeded` 事件——把「什么时候该发 offer」的判断从你的业务代码里剥离出来：

- 首次 `addTrack()`、后续增删轨道；
- 第一条 `createDataChannel()`（数据通道搭 SCTP 传输需要协商）；
- `restartIce()`；
- **注意不触发的**：`setCodecPreferences()`（见下节）、`replaceTrack()`（同类热替换免协商）。

它**只在 `signalingState === "stable"` 时触发**（协商进行中不会叠加触发），标准处理就是无参 `setLocalDescription()` + 发信令。但「双方同时触发」的碰撞问题必须解决——这正是下一页 perfect negotiation 的主题。

## 七、transceiver 与编解码控制

`addTrack()` 背后，每条媒体线（SDP 的 m-line）对应一个 `RTCRtpTransceiver`——sender 与 receiver 的配对体。需要精细控制时直接操作 transceiver：

```js
// 显式声明方向：我只收不发（如观众端），省去先拿本地媒体的步骤
const transceiver = pc.addTransceiver("video", { direction: "recvonly" });
// direction 四值：sendrecv / sendonly / recvonly / inactive
```

**编解码偏好**用 `setCodecPreferences()`——三条已核实的现状（2026-07）：

```js
// 入参必须来自接收能力列表 RTCRtpReceiver.getCapabilities()
// （Chrome M124 起严格校验，混入自造 codec 对象会抛错）
const { codecs } = RTCRtpReceiver.getCapabilities("video");
const preferred = [
  ...codecs.filter((c) => c.mimeType === "video/AV1"), // 想优先的排前面
  ...codecs.filter((c) => c.mimeType !== "video/AV1"),
];
transceiver.setCodecPreferences(preferred);
// 注意：这个调用不触发 negotiationneeded——
// 偏好只影响「下一次」协商产出的 SDP，要生效需自己发起一轮重协商
```

1. **可用性**：Firefox 128（2024 年中）补齐后**全浏览器可用**；
2. **入参校验**：codec 必须来自 `RTCRtpReceiver.getCapabilities()` 返回的能力集（Chrome M124 起严格执行）；
3. **不触发 `negotiationneeded`**：设置后需要重协商（比如再走一次完美协商流程）才真正落到 SDP。

## 八、易错点

- **忘了 `setLocalDescription`**：`createOffer()` 只是生成，不设置就永远不会开始收集候选。
- **candidate 到得比 offer 早就丢弃**：信令乱序时先缓存候选，等 `setRemoteDescription` 后再喂。
- **把 `disconnected` 当 `failed` 处理**：杀死了本可自愈的连接；等 `failed` 再 `restartIce()`。
- **`close()` 后复用实例**：`closed` 是终态，重连必须新建。
- **空字符串候选没转发**：对端 ICE 层收不到 end-of-candidates，某些实现会多等一段超时。
- **在 `negotiationneeded` 里手写 `createOffer`**：能跑，但碰撞（glare）没处理——用下一页的样板。

单端编排会了，双端同时动手怎么不打架？下一页解决协商碰撞，并把数据通道补完：[完美协商与数据通道](./negotiation-datachannel)。
