---
layout: doc
outline: [2, 3]
---

# getStats 统计调试与 Encoded Transform

> 基于 WebRTC 1.0（W3C Recommendation）与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **三个入口**：`pc.getStats()`（全连接）、`sender.getStats()`（只出站）、`receiver.getStats()`（只入站）；都返回 `Promise<RTCStatsReport>`。
- **报告形态**：`RTCStatsReport` 是**只读 Map-like**——`forEach()`/`values()`/`keys()`/`entries()`/`get(id)`/`has(id)`/`size`，按插入序迭代。
- **三公共字段**：每条统计字典都有 `id`（被监测对象的唯一标识，连接生命周期内稳定）、`timestamp`（高精度采样时刻）、`type`（字典类型）。
- **高频 type**：`inbound-rtp`（收流质量）/ `outbound-rtp`（发流质量）/ `remote-inbound-rtp`（**对端收我**的视角，RTT 主来源）/ `candidate-pair`（候选对连通性）/ `transport`（传输层，含**当前选中候选对**）/ `codec` / `media-source` / `data-channel`。
- **找当前线路**：`transport` 条目的 `selectedCandidatePairId` → `get()` 出 `candidate-pair` → 其 `localCandidateId`/`remoteCandidateId` → 候选的 `candidateType` 为 `"relay"` 即走了 TURN 中继。
- **多为累计值**：`bytesReceived`/`packetsLost` 等从连接建立起累加——**必须两次采样求差**才是实时速率；`timestamp` 差就是分母。
- **丢包率**：Δ`packetsLost` / (Δ`packetsLost` + Δ`packetsReceived`)（inbound 侧）；出站看 `remote-inbound-rtp` 的 `packetsLost`/`fractionLost`。
- **RTT**：`candidate-pair.currentRoundTripTime`（STUN 实测，秒）或 `remote-inbound-rtp.roundTripTime`。
- **码率**：Δ`bytesReceived`（或 Δ`bytesSent`）× 8 / Δt；视频帧率直接读 `inbound-rtp.framesPerSecond`。
- **浏览器内置调试台**：`chrome://webrtc-internals`（Chrome/Edge）与 `about:webrtc`（Firefox）——事件时间线、SDP 全文、全量 stats 曲线，排障第一站。
- **Encoded Transform 定位**：在**编码后（发端）/ 解码前（收端）**的帧管线里插一段跑在 **Worker** 里的 `TransformStream`——E2E 加密、水印、自定义帧头的正门。
- **支持现状**：**2025 达成 Baseline**；特性检测 `window.RTCRtpSender && "transform" in RTCRtpSender.prototype`。
- **三步接线**：主线程 `new RTCRtpScriptTransform(worker, options, [transferables])` → 赋给 `sender.transform` / `receiver.transform` → worker 里监听 `rtctransform` 事件接管道。
- **worker 侧样板**：`event.transformer.readable.pipeThrough(new TransformStream({ transform })).pipeTo(event.transformer.writable)`；帧对象是 `RTCEncodedVideoFrame`/`RTCEncodedAudioFrame`，改 `data`（`ArrayBuffer`）后 `controller.enqueue()` 放行。
- **与普通流的差异**：构造对象里传 `writableStrategy`/`readableStrategy` **会被忽略**——排队策略由浏览器管。
- **挂载时机**：`addTrack()` 后立刻挂 sender 端、`track` 事件里挂 receiver 端，保证**第一帧**就被变换。
- **运行时通信**：`MessageChannel` 的 `port2` 作为构造 options 传入并转移（transfer），worker 在 `event.transformer.options.port` 上收发——换密钥等运行时指令的标准通路。
- **关键帧两方法**：发端 `transformer.generateKeyFrame(rid?)` 让编码器出关键帧；收端 `transformer.sendKeyFrameRequest()` 向对端索要——E2EE 会议新人进场必用。

## 一、getStats：三个入口与报告模型

「视频卡不卡、为什么卡」不能靠猜。`getStats()` 是 WebRTC 的标准化仪表盘，三个入口对应三种范围：

```js
const all = await pc.getStats(); // 整条连接：收发、传输、候选全量
const outbound = await sender.getStats(); // 某条出站轨的相关统计
const inbound = await receiver.getStats(); // 某条入站轨的相关统计
```

产出的 `RTCStatsReport` 是只读 Map-like：键是统计对象的 `id`，值是统计字典。**用法与只读 `Map` 完全一致**，惯用姿势是遍历 + 按 `type` 筛选：

```js
const report = await pc.getStats();
report.forEach((stat) => {
  if (stat.type === "inbound-rtp" && stat.kind === "video") {
    console.log(stat.framesPerSecond, stat.packetsLost, stat.jitter);
  }
});
```

每条字典必有三个公共字段：`id`（被监测对象的稳定标识——用它跨采样对齐同一对象）、`timestamp`（采样时刻）、`type`（字典类型）。

## 二、报告里有什么：类型速览

| `type` | 内容 | 排障时看什么 |
| --- | --- | --- |
| `inbound-rtp` | 本端**收**流状态 | `packetsLost`、`jitter`、`framesPerSecond`、`bytesReceived` |
| `outbound-rtp` | 本端**发**流状态 | `bytesSent`、`framesEncoded`、`qualityLimitationReason`（带宽/CPU 限档原因） |
| `remote-inbound-rtp` | **对端收我**的视角（RTCP 回报） | `packetsLost`（我发丢了多少）、`roundTripTime` |
| `remote-outbound-rtp` | 对端发送侧的自述 | 与 inbound 对账 |
| `candidate-pair` | 每个被检查的候选对 | `state`、`nominated`、`currentRoundTripTime`、`availableOutgoingBitrate` |
| `local-candidate` / `remote-candidate` | 单个候选详情 | `candidateType`（`host`/`srflx`/`relay`）、`protocol` |
| `transport` | 传输层（ICE+DTLS） | **`selectedCandidatePairId`**、`dtlsState`、收发总字节 |
| `codec` | 会话中用到的编解码 | `mimeType`、`clockRate` |
| `media-source` | 编码前的本地源 | 源分辨率/帧率（对比 outbound 判断是采集差还是编码差） |
| `data-channel` | 每条数据通道 | `messagesSent`/`bytesReceived`、`state` |
| `peer-connection` | 连接级杂项 | 打开过的通道数等 |
| `certificate` | DTLS 证书 | 指纹排查 |

## 三、指标食谱

### 走的直连还是 TURN 中继

连接「通了但流量走哪」直接决定延迟与服务器成本——从 `transport` 顺藤摸瓜：

```js
const report = await pc.getStats();
let pair;
report.forEach((s) => {
  // transport 条目记录了当前选中的候选对
  if (s.type === "transport" && s.selectedCandidatePairId) {
    pair = report.get(s.selectedCandidatePairId);
  }
});
if (pair) {
  const local = report.get(pair.localCandidateId);
  const remote = report.get(pair.remoteCandidateId);
  // candidateType 为 "relay" 说明这一侧在走 TURN 中继
  console.log(
    `线路：${local.candidateType} ↔ ${remote.candidateType}`,
    `RTT：${(pair.currentRoundTripTime * 1000).toFixed(0)}ms`,
  );
}
```

### 实时码率 / 丢包率 / 帧率（定时采样求差）

绝大多数计数器是**累计值**，单次快照没有意义——定时采样、与上次求差：

```js
const last = new Map(); // id → 上一次快照

setInterval(async () => {
  const report = await pc.getStats();
  report.forEach((stat) => {
    if (stat.type !== "inbound-rtp" || stat.kind !== "video") return;
    const prev = last.get(stat.id);
    if (prev) {
      const dt = (stat.timestamp - prev.timestamp) / 1000; // 秒
      const kbps = ((stat.bytesReceived - prev.bytesReceived) * 8) / dt / 1000;
      const dLost = stat.packetsLost - prev.packetsLost;
      const dRecv = stat.packetsReceived - prev.packetsReceived;
      const lossRate = dLost / Math.max(1, dLost + dRecv); // 区间丢包率
      console.log(
        `码率 ${kbps.toFixed(0)} kbps`,
        `丢包 ${(lossRate * 100).toFixed(1)}%`,
        `帧率 ${stat.framesPerSecond ?? "-"}`, // 瞬时值，直接读
        `抖动 ${(stat.jitter * 1000).toFixed(1)}ms`,
      );
    }
    last.set(stat.id, stat);
  });
}, 1000);
```

发送质量的两问：**我发出去多少**看 `outbound-rtp`（`qualityLimitationReason` 会直说是 `"bandwidth"` 还是 `"cpu"` 在压画质）；**对方收到多少**看 `remote-inbound-rtp`（RTCP 回报的 `packetsLost`/`roundTripTime`）。

## 四、浏览器内置调试台

写代码采样之前，先认识两个免费仪表盘：

- **`chrome://webrtc-internals`**（Chrome/Edge）：每条连接的 API 调用时间线（谁在什么时候 setLocalDescription）、SDP 全文、候选对试探过程、全量 stats 实时曲线——「协商为什么失败」基本都能在时间线里看到；
- **`about:webrtc`**（Firefox）：同类信息，另有 ICE 统计表与日志导出。

经验路径：**先内置调试台定位问题层**（协商没谈拢？ICE 没打通？打通了但质量差？），**再用 `getStats()` 把关键指标产品化**（上报监控、驱动降级策略）。

## 五、Encoded Transform：在编码帧管线上做手脚

常规管线里，帧从编码器出来直接进 RTP 打包发走，应用碰不到。**Encoded Transform** 把这段管线切开，让你插入一段跑在 **Worker** 里的 `TransformStream`：

```text
发端：采集 → 编码器 ──►〔你的 Transform（Worker）〕──► RTP 打包 → 网络
收端：网络 → RTP 解包 ──►〔你的 Transform（Worker）〕──► 解码器 → 渲染
```

处理的是**编码后**的帧（`RTCEncodedVideoFrame` / `RTCEncodedAudioFrame`），不是原始像素——所以开销小，也正好落在「加密/加水印/塞自定义元数据」该在的位置。典型场景是**端到端加密（E2EE）**：发端变换里加密、收端变换里解密，中间的 SFU 转发服务器只见密文。

支持现状（核于 2026-07）：**2025 年达成 Baseline**，全主流浏览器可用；上线前照常特性检测：

```js
const supported = window.RTCRtpSender && "transform" in RTCRtpSender.prototype;
```

## 六、三步接线

**第一步/第二步（主线程）**：构造 `RTCRtpScriptTransform` 并赋给 sender / receiver 的 `transform` 属性。挂载时机讲究「不漏第一帧」：

```js
const worker = new Worker("transform-worker.js");

// 发送侧：addTrack 返回 sender，紧接着挂上，保证第一个编码帧就被处理
const sender = pc.addTrack(track, stream);
sender.transform = new RTCRtpScriptTransform(worker, {
  name: "senderTransform", // options 会原样出现在 worker 侧
});

// 接收侧：track 事件里给 event.receiver 挂上
pc.ontrack = (event) => {
  event.receiver.transform = new RTCRtpScriptTransform(worker, {
    name: "receiverTransform",
  });
  remoteVideo.srcObject = event.streams[0];
};
```

**第三步（Worker）**：监听 `rtctransform` 事件，把 `readable → TransformStream → writable` 接成管道。下面是 MDN 的按位取反演示（发端加扰、收端同法还原）：

```js
// transform-worker.js
onrtctransform = (event) => {
  // options 里带的 name 区分这是发端还是收端的管线
  const isSender = event.transformer.options.name === "senderTransform";

  const transform = new TransformStream({
    async transform(encodedFrame, controller) {
      // encodedFrame：RTCEncodedVideoFrame / RTCEncodedAudioFrame
      const view = new DataView(encodedFrame.data);
      const newData = new ArrayBuffer(encodedFrame.data.byteLength);
      const newView = new DataView(newData);
      for (let i = 0; i < encodedFrame.data.byteLength; ++i) {
        newView.setInt8(i, ~view.getInt8(i)); // 演示：逐字节取反（异或式对称）
      }
      encodedFrame.data = newData; // 整块替换帧数据
      controller.enqueue(encodedFrame); // 放回管线继续走
    },
  });

  event.transformer.readable
    .pipeThrough(transform)
    .pipeTo(event.transformer.writable);
};
```

与普通 `TransformStream` 的两处差异（规范明确）：构造对象里的 `writableStrategy`/`readableStrategy` **被忽略**（排队策略由浏览器全权管理）；`transform()` 收到的不是任意 chunk，而是编码帧对象。

## 七、E2EE 场景要点

真实的端到端加密还差两块拼图——运行时换密钥与关键帧管理：

**运行时通信用 `MessageChannel`**：主线程随时要给 worker 里的变换递新密钥。比起裸 `postMessage`，把端口作为构造选项传入更顺手——处理帧时上下文里直接可用：

```js
// 主线程：port2 作为 option 传入，并放进 transfer 列表转移所有权
const channel = new MessageChannel();
sender.transform = new RTCRtpScriptTransform(
  worker,
  { name: "senderTransform", port: channel.port2 },
  [channel.port2],
);
channel.port1.start();
channel.port1.postMessage({ key: newEncryptionKey }); // 会中换密钥
```

```js
// worker：端口就挂在 options 上
event.transformer.options.port.onmessage = ({ data }) => {
  currentKey = data.key; // 变换算法立即用新密钥
};
```

**关键帧两方法**：视频编码是「关键帧 + 增量帧」结构，新入会者拿不到用**新密钥加密的关键帧**就只能黑屏等待。`event.transformer`（`RTCRtpScriptTransformer`）为此提供两个方法：

- 发端：`transformer.generateKeyFrame(rid?)`——命令编码器立刻产出关键帧（`rid` 指定 simulcast 的哪一层）；
- 收端：`transformer.sendKeyFrameRequest()`——向发送端索要关键帧。

换密钥后立刻 `generateKeyFrame()`，新成员的首屏时间从「等下一个周期关键帧」缩到毫秒级。

## 八、易错点

- **单次 `getStats()` 读速率**：计数器是累计值，不求差全是「自连接建立以来的总量」。
- **跨采样用数组下标对齐**：条目顺序无保证，**用 `id` 对齐**同一对象的两次快照。
- **只看本端 `outbound-rtp` 断言发送质量**：丢没丢要问对端——`remote-inbound-rtp` 才是回执。
- **拿 `candidate-pair` 里随便一条当当前线路**：候选对有一堆（试探过的都在），认准 `transport.selectedCandidatePairId`。
- **在主线程构造 `TransformStream` 处理帧**：Encoded Transform 的变换必须活在 Worker 里（`RTCRtpScriptTransform` 构造第一参就是 worker）。
- **`ontrack` 之外的地方挂 receiver transform**：晚了就漏帧——第一帧可能未经变换直接进解码器（E2EE 下即花屏/黑屏）。
- **E2EE 换密钥不触发关键帧**：老密钥的增量帧链对新密钥持有者毫无意义——换钥必配 `generateKeyFrame()`。
- **给变换流传排队策略**：`writableStrategy`/`readableStrategy` 会被静默忽略，别指望它控内存。

到这里，从采集、连接、协商、数据到统计与帧级加工，API 编排的主线走完了。最后一页把全叶浓缩成速查表与易错点清单：[参考](../reference)。
