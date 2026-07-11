---
layout: doc
outline: [2, 3]
---

# 完美协商与数据通道

> 基于 WebRTC 1.0（W3C Recommendation）与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **解决什么**：**glare（协商碰撞）**——双方几乎同时发 offer，朴素编排双双卡死；perfect negotiation 是 **MDN 官方推荐**的信令编排样板，两端跑**同一套代码**，不再区分呼叫方/应答方。
- **角色二分**：**polite**（有礼貌端）碰撞时**让步**——放弃自己的 offer 转而应答对方；**impolite**（不让步端）碰撞时**无视**对方的 offer。两端必须一 polite 一 impolite。
- **角色怎么定**：信令层面约定即可（如先进房间的 polite / 用随机数比大小），与业务上谁「发起呼叫」无关；**caller/callee 角色在过程中可以互换**。
- **三个标志位**：`makingOffer`（正在出 offer）、`ignoreOffer`（正在无视碰撞 offer）、`isSettingRemoteAnswerPending`（正在落位对方的 answer）。
- **出价样板**：`onnegotiationneeded` → `makingOffer = true` → `await pc.setLocalDescription()`（无参）→ 发 `pc.localDescription` → finally 里复位标志。
- **碰撞判定**：`offerCollision = 收到 offer && (makingOffer || signalingState !== "stable" 且不在等自己的 answer)`。
- **impolite 的处理**：`ignoreOffer = !polite && offerCollision`，为真直接 `return`——连带无视该 offer 配套候选的 `addIceCandidate` 报错。
- **polite 的处理**：什么都不用做——直接 `setRemoteDescription(offer)`，规范保证在 `have-local-offer` 状态收 offer 时**自动回滚**自己的提案（隐式 rollback）。
- **显式回滚**：`setLocalDescription({ type: "rollback" })` 回到上一个 `stable`；**只有 offer 能被回滚**，answer 不存在回滚。
- **收 offer 后应答**：`setRemoteDescription(offer)` → 无参 `setLocalDescription()`（自动生成 answer）→ 发回。
- **DataChannel 创建**：`pc.createDataChannel(label, options)` 立即返回实例；**首条通道会触发 `negotiationneeded`**（要搭 SCTP 传输）；等 `open` 事件才能 `send()`。
- **两种协商模式**：默认 **in-band**（一端创建、对端 `datachannel` 事件接住）；`negotiated: true` + **双端同 `id`** 各自创建（对称代码，无 `datachannel` 事件）。
- **可靠性三选项**：`ordered`（默认 `true` 有序）；`maxRetransmits`（最多重传 N 次）与 `maxPacketLifeTime`（最多重传 N 毫秒）**互斥，同时设置抛 `SyntaxError`**——设其一即进入「部分可靠」模式。
- **两个典型档位**：默认（可靠 + 有序）= TCP 风格，适合文件/聊天；`{ ordered: false, maxRetransmits: 0 }` = UDP 风格，适合游戏状态/实时遥测。
- **收发**：`send()` 支持 string / `Blob` / `ArrayBuffer` / `ArrayBufferView`；收端 `binaryType` 默认 **`"arraybuffer"`**（注意 WebSocket 默认是 `"blob"`）。
- **消息大小**：跨端安全线看 SDP `max-message-size`（缺省按 64 KB 估）；大消息还会**队头阻塞**同连接其他通道——大文件一律分块（16 KiB 是稳妥块大小）。
- **背压**：`send()` 只入队不阻塞、缓冲大小无法配置——盯 `bufferedAmount`，配 `bufferedAmountLowThreshold` + `bufferedamountlow` 事件写发送循环。
- **规模上限**：每连接最多 **65,534** 条通道（`id` 0–65534）；`label` 不要求唯一。
- **可转移**：`RTCDataChannel` 是 Transferable，可 `postMessage` 转给 Worker 收发。

## 一、glare：朴素编排为什么会撞车

[上一页](./peer-connection)的呼叫方/应答方编排有个隐含假设：**同一时刻只有一端想协商**。现实里很容易破功——双方同时点「开视频」、网络恢复后两端同时 `restartIce()`……于是两端同时进入 `have-local-offer`，又同时收到对方的 offer：

```text
   端 A                                端 B
    │ setLocalDescription(offerA)       │ setLocalDescription(offerB)
    │ ──────── offerA ───────────►      │
    │      ◄─────────── offerB ──────── │
    │ 状态 have-local-offer，            │ 状态 have-local-offer，
    │ 收到 offerB：现在怎么办？？          │ 收到 offerA：现在怎么办？？
```

直接 `setRemoteDescription(offerB)` 在旧实现里会抛状态错误；两端都放弃重来又可能再次同时出价、无限互撞。手写「谁赢谁让」的补丁代码，时序竞态防不胜防——`signalingState` 的变化是异步的，判断它的瞬间可能已经过期。

**Perfect negotiation** 是 MDN 官方推荐的终极答案：把「碰撞怎么办」抽成一条与业务无关的规则，两端跑完全相同的代码。

## 二、polite 与 impolite：一个让、一个不让

样板给两端各分配一个**协商人格**（与连接状态、与谁发起呼叫都无关）：

- **polite peer**：可以出 offer，但收到对方 offer 时哪怕撞车也**让步**——「好吧，当我没说，先议你的」，靠 rollback 放弃自己的提案转而应答；
- **impolite peer**：撞车时**无视**对方的 offer，绝不让步——反正对方会让。

一让一不让，碰撞就有了确定性的解法。角色分配随意但必须**恰好一端一种**：常见做法是信令服务器指定（如先进房间者 polite），或双方交换随机数比大小。还有个重要推论：**polite 端让步后就从 caller 变成了 callee**——业务代码不该假设自己固定是哪一方，这正是样板把协商逻辑与业务解耦的意义。

## 三、官方样板逐段解读

以下即 MDN 官方样板（配中文注释）。假定 `signaler` 是你的信令通道封装，`polite` 由信令层约定：

```js
const pc = new RTCPeerConnection(config);
const polite = true; // 由信令层约定：两端必须一真一假

// ── 第一段：需要协商时自动出价 ──
let makingOffer = false;

pc.onnegotiationneeded = async () => {
  try {
    makingOffer = true; // 上锁：从「打算出价」起就算数
    await pc.setLocalDescription(); // 无参：stable 状态下自动 createOffer 并设置
    signaler.send({ description: pc.localDescription });
  } catch (err) {
    console.error(err);
  } finally {
    makingOffer = false; // 出完（或失败）解锁
  }
};

// ── 第二段：本端候选逐个外发 ──
pc.onicecandidate = ({ candidate }) => signaler.send({ candidate });

// ── 第三段：统一处理信令来件（描述或候选）──
let ignoreOffer = false;
let isSettingRemoteAnswerPending = false;

signaler.onmessage = async ({ data: { description, candidate } }) => {
  try {
    if (description) {
      // 「此刻能收 offer 吗」：没在出价，且状态稳定（或只是在等自己 answer 落位）
      const readyForOffer =
        !makingOffer &&
        (pc.signalingState === "stable" || isSettingRemoteAnswerPending);
      const offerCollision = description.type === "offer" && !readyForOffer;

      ignoreOffer = !polite && offerCollision; // impolite：碰撞 offer 直接无视
      if (ignoreOffer) return;

      isSettingRemoteAnswerPending = description.type === "answer";
      await pc.setRemoteDescription(description); // polite 撞车时：这里自动回滚己方 offer
      isSettingRemoteAnswerPending = false;

      if (description.type === "offer") {
        await pc.setLocalDescription(); // 无参：have-remote-offer 下自动生成 answer
        signaler.send({ description: pc.localDescription });
      }
    } else if (candidate) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (err) {
        if (!ignoreOffer) throw err; // 正无视 offer 时，其配套候选的报错一并吞掉
      }
    }
  } catch (err) {
    console.error(err);
  }
};
```

样板的三处精妙，正是手写版本最容易翻车的地方：

1. **`makingOffer` 而不是 `signalingState` 判碰撞**：`signalingState` 异步变化，「打算出价但状态还没变」的窗口期足以漏判碰撞——布尔标志在 `setLocalDescription()` **之前**就置位，把窗口焊死；
2. **无参 `setLocalDescription()`**：按当前状态自动生成该出的东西（offer 或 answer），省去 `createOffer/createAnswer` 的分支——`negotiationneeded` 只在 stable 触发，所以第一段里它必然产出 offer；
3. **`ignoreOffer` 连带吞候选错误**：无视了 offer，就没告诉本地 ICE 层这回事，对方随后送来的配套候选自然 `addIceCandidate` 报错——预期内，静音处理，避免错误噪声。

## 四、rollback：回滚的两种触达

回滚是把连接的提案状态**退回上一个 `stable`**（撤销未生效的 offer），有两种触达方式：

- **隐式（样板依赖的）**：处于 `have-local-offer` 时调用 `setRemoteDescription(收到的 offer)`，规范要求自动先回滚己方提案再受理对方的——polite 端「什么都不用写」的让步就是它；
- **显式**：`setLocalDescription({ type: "rollback" })`，描述对象里其余属性一律忽略。

注意边界：**只有 offer 可以被回滚**——answer 落位即 `stable`，无「反悔」一说；已经 `current` 的描述也不会被回滚动到（回滚撤销的是 pending 提案，运行中的通话不受影响）。

## 五、RTCDataChannel：创建与两种协商模式

数据通道把「WebSocket 般的收发体验」搬到 P2P 通路上（API 刻意对齐），底层是 SCTP over DTLS（`"UDP/DTLS/SCTP"`），加密与穿透复用同一条 ICE 通路。创建有两种模式：

```js
// ── 模式一：in-band（默认，最常用）──
// 一端创建，WebRTC 层自动告知对端
const dc = pc.createDataChannel("chat"); // 首条通道会触发 negotiationneeded
dc.onopen = () => dc.send("通道就绪！"); // 必须等 open 才能 send

// 对端：靠 datachannel 事件接住
pc.ondatachannel = ({ channel }) => {
  channel.onmessage = ({ data }) => console.log("收到：", data);
};
```

```js
// ── 模式二：negotiated（双侧对称建）──
// 双端各自创建，靠相同的 id 对上号；没有 datachannel 事件
const dc = pc.createDataChannel("chat", { negotiated: true, id: 0 });
dc.onopen = () => dc.send("双侧同码，谁先 open 谁先说");
dc.onmessage = ({ data }) => console.log(data);
```

in-band 简单、适合动态开通道；negotiated 让两端代码完全对称、通道拓扑写死在代码里（配完美协商的「同一套代码」哲学很搭）。`label` 只是人类可读名、不要求唯一；`id` 取值 0–65534，一条连接最多 **65,534** 条通道。

## 六、可靠性光谱：三选项两档位

TCP 的可靠有序不是免费的——一个包丢了，后面全部等它重传（队头阻塞），实时场景宁可丢也不等。数据通道把选择权给你，三个创建选项：

| 选项 | 默认 | 含义 |
| --- | --- | --- |
| `ordered` | `true` | 是否保证到达顺序 |
| `maxRetransmits` | `null` | 放弃前最多重传**次数**（次数计的部分可靠） |
| `maxPacketLifeTime` | `null` | 放弃前最多重传**毫秒数**（时间计的部分可靠） |

**后两者互斥**：同时给非 `null` 值抛 `SyntaxError`；都不给 = 无限重传 = 完全可靠。两个典型档位：

```js
// TCP 风格（默认）：可靠 + 有序——文件传输、聊天记录、控制指令
const fileDC = pc.createDataChannel("file");

// UDP 风格：不保序 + 不重传——游戏状态、实时坐标（旧包重传到了也没用）
const gameDC = pc.createDataChannel("game", {
  ordered: false,
  maxRetransmits: 0,
});
```

判断轨道语义时读通道实例的同名只读属性（`dc.ordered`/`dc.maxRetransmits`/`dc.maxPacketLifeTime`）即可。

## 七、收发数据与二进制

`readyState` 走 `connecting → open → closing → closed`；`open`/`message`/`closing`/`close`/`error` 五个事件对应齐全。`send()` 收 string、`Blob`、`ArrayBuffer`、`ArrayBufferView`；接收侧的二进制形态由 `binaryType` 决定——**默认 `"arraybuffer"`**（`WebSocket` 默认是 `"blob"`，两个 API 长得像，这里是分水岭）：

```js
dc.binaryType = "arraybuffer"; // 默认值，显式写出防跨 API 记混
dc.onmessage = ({ data }) => {
  if (typeof data === "string") {
    handleText(data); // 文本消息
  } else {
    handleChunk(data); // ArrayBuffer 二进制块
  }
};
```

**消息大小是真实的互操作边界**：SCTP 层用 SDP 的 `max-message-size` 声明对端愿意收多大的消息，**该属性缺席时按 64 KB 假定**；而且没有消息交错（RFC 8260）时，一条大消息会**队头阻塞**同一连接上其他数据通道的消息。结论：别赌浏览器上限，**大数据一律分块**。

## 八、背压与大文件直传

`send()` 是纯入队、不阻塞也不节流；缓冲区大小由浏览器管理、**无法配置**，只能观测——塞得比消费快，`bufferedAmount` 就一路涨。正确姿势是用低水位事件写发送循环：

```js
const CHUNK = 16 * 1024; // 16 KiB：跨浏览器稳妥的块大小
dc.bufferedAmountLowThreshold = 1 * 1024 * 1024; // 缓冲降到 1 MB 以下就续弹

async function sendFile(file) {
  let offset = 0;
  while (offset < file.size) {
    // 背压闸门：缓冲高于阈值就暂停，等 bufferedamountlow 再继续
    if (dc.bufferedAmount > dc.bufferedAmountLowThreshold) {
      await new Promise((resolve) =>
        dc.addEventListener("bufferedamountlow", resolve, { once: true }),
      );
    }
    const chunk = await file.slice(offset, offset + CHUNK).arrayBuffer();
    dc.send(chunk); // 只入队；真正的发送节奏由 SCTP 层调度
    offset += CHUNK;
  }
  dc.send(JSON.stringify({ done: true, size: file.size })); // 结束标记
}
```

`bufferedAmountLowThreshold` 默认 0（缓冲彻底清空才触发），实践中调高些能让管道保持「始终有货、又不撑爆」。

## 九、易错点

- **没等 `open` 就 `send()`**：通道创建是异步搭传输的，`connecting` 期间发送抛错——一切发送从 `open` 事件开始。
- **`negotiated: true` 忘了对齐 `id`**：两端各建各的、永远对不上号；此模式下也**没有** `datachannel` 事件可等。
- **`maxRetransmits` 与 `maxPacketLifeTime` 一起设**：`SyntaxError`，二选一。
- **拿 WebSocket 的直觉用 `binaryType`**：这边默认 `"arraybuffer"`、那边默认 `"blob"`，跨 API 复用收包代码时先对表。
- **单条大消息梭哈**：超对端 `max-message-size` 可能直接失败，还队头阻塞其他通道——分块 + 结束标记。
- **发送循环不看 `bufferedAmount`**：内存一路涨、延迟不可控——低水位事件是标配。
- **polite/impolite 两端配成一样**：要么都让（重新互撞），要么都不让（死锁）——必须一真一假。
- **样板里自作聪明改动**：`makingOffer` 的置位时机、`ignoreOffer` 吞错误的范围都是精确设计——照抄，别「优化」。

连接通了、数据在流，下一页解决「跑得好不好」与「帧级加工」：[getStats 统计调试与 Encoded Transform](./stats-transform)。
