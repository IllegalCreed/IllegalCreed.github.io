---
layout: doc
outline: [2, 3]
---

# 二进制与背压：binaryType 与 bufferedAmount

> 基于 WHATWG WebSockets 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **binaryType 两值**：`"blob"`（默认）或 `"arraybuffer"`——决定**接收**的二进制帧在 `message` 事件里以什么类型出现。
- **默认与 RTCDataChannel 相反**：`WebSocket.binaryType` 默认 `"blob"`，而 `RTCDataChannel.binaryType` 默认 `"arraybuffer"`——迁移代码时最常踩的坑。
- **选 arraybuffer 的场景**：要**同步、随机地读字节**（`DataView` / `TypedArray` 解析二进制协议、WASM 内存）时用 `"arraybuffer"`——数据直接在内存。
- **选 blob 的场景**：大文件 / 只需整体转手（塞进 `URL.createObjectURL`、`<img>`、下载）时用 `"blob"`——惰性、不立刻占内存。
- **可随时切换**：`binaryType` 可在连接存续期间改，但**只影响此后到达的消息**；通常在 `open` 前设好。
- **只影响接收**：`binaryType` 与 `send()` 无关——发什么类型由你传给 `send` 的参数决定（`ArrayBuffer` / `Blob` / `TypedArray` / `DataView` 都发二进制帧）。
- **bufferedAmount 语义**：已 `send()` 入本地缓冲、但**尚未发到网络**的字节数；随发送推进回落，全部发完归 `0`。
- **它是发送侧的唯一背压信号**：标准 `WebSocket` **没有** `bufferedamountlow` 事件（那是 `RTCDataChannel` 的）——发送节流只能**轮询** `bufferedAmount`。
- **send 是异步且无阻塞**：`send()` 入缓冲即返回，不等发出；狂发不看 `bufferedAmount` → 缓冲膨胀 → 内存涨，甚至连接被自动关闭。
- **缓冲满会自动断连**：数据无法排入缓冲（满了）时浏览器**自动关闭连接**——大流量必须节流。
- **接收无背压**：这是标准 `WebSocket` 的能力短板——消息到达快过 `onmessage` 处理时，只能在渲染进程里堆积（内存涨 / 100% CPU），API 层无流控入口。
- **大消息接收用分片自拼**：应用层给大消息切块加序号，接收端按序号拼——协议帧分片浏览器已处理，这里指**应用层**再切。
- **Blob 转 ArrayBuffer**：拿到 `Blob` 要读字节用 `await blob.arrayBuffer()`；反之 `ArrayBuffer` 包成 `Blob` 用 `new Blob([buf])`。
- **发送前测量体积**：文本按 UTF-8 字节计（`new TextEncoder().encode(s).length`），二进制按 `byteLength`——据此决定是否分片 / 节流。
- **背压前沿**：`WebSocketStream` 用 Streams 天然背压（收发都限速），但**非标准、仅 Chromium**——详见[生命周期页](./lifecycle-patterns)。

## 一、binaryType：接收二进制帧的两种「装法」

WebSocket 能收发二进制。**发**什么由你传给 `send()` 的参数决定；**收**到的二进制帧长什么样，则由 `binaryType` 这个**唯一可写属性**控制：

```js
const ws = new WebSocket("wss://host/stream");
ws.binaryType = "arraybuffer"; // 改成 arraybuffer；默认是 "blob"

ws.onmessage = (e) => {
  if (typeof e.data === "string") {
    // 文本帧，永远是字符串（不受 binaryType 影响）
  } else if (e.data instanceof ArrayBuffer) {
    // 二进制帧，且 binaryType === "arraybuffer"
    const view = new DataView(e.data);
    console.log(view.getUint32(0)); // 可同步随机读字节
  }
  // 若 binaryType 保持默认 "blob"，这里 e.data 会是 Blob
};
```

| `binaryType` | 二进制帧的 `e.data` 类型 | 适合 |
| --- | --- | --- |
| `"blob"`（默认） | `Blob` | 大文件 / 整体转手（`createObjectURL`、下载、`<img>` src）；惰性、不立刻进内存 |
| `"arraybuffer"` | `ArrayBuffer` | 要同步随机读字节：解析二进制协议、喂 `DataView` / `TypedArray` / WASM |

::: warning 默认值与 RTCDataChannel 正好相反
`WebSocket.binaryType` 默认 `"blob"`，但 `RTCDataChannel.binaryType` 默认 `"arraybuffer"`。**在两套 API 间搬代码时这是最隐蔽的坑**——同一段 `onmessage` 里 `e.data instanceof ArrayBuffer` 的判断，换个 API 默认就走了另一分支。跨 API 复用逻辑时**永远显式设一次 `binaryType`**，别依赖默认。
:::

### 切换时机

`binaryType` 可在连接存续期间随时改，但**只影响改之后到达的消息**——已在途或已派发的不受影响。稳妥做法是**在 `open` 之前就设好**（构造后立刻设），避免竞态：

```js
const ws = new WebSocket(url);
ws.binaryType = "arraybuffer"; // 构造后立即设，早于任何消息到达
```

### Blob 与 ArrayBuffer 互转

用默认 `"blob"` 却临时要读字节，或反过来，转换很简单：

```js
// Blob → ArrayBuffer（异步，Blob 是惰性的）
ws.onmessage = async (e) => {
  if (e.data instanceof Blob) {
    const buf = await e.data.arrayBuffer(); // 读出字节
    const bytes = new Uint8Array(buf);
  }
};

// ArrayBuffer / 字节 → Blob（发送侧要发 Blob 时）
const blob = new Blob([new Uint8Array([0x01, 0x02])]);
ws.send(blob);
```

## 二、bufferedAmount：发送侧唯一的背压信号

`send()` 是**异步、非阻塞**的——它把数据塞进浏览器的本地发送缓冲就立即返回，真正发到网络是后台的事。那「到底发出去没有」怎么知道？靠只读属性 `bufferedAmount`：

> `bufferedAmount` = 已通过 `send()` 排队、但**尚未发送到网络**的字节数。

```js
ws.send(bigPayload);
console.log(ws.bufferedAmount); // 刚 send，缓冲里还压着一批字节
// 随着数据陆续发出，这个值回落；全部发完归 0
```

关键语义：

- **入队即增、发出即减**：每次 `send()` 让它增加（文本按 UTF-8 字节、二进制按 `byteLength`），后台发出数据让它回落，全部发完归 `0`。它是一个**实时水位表**，不是累计计数器。
- **它是发送侧背压的**唯一**入口**：想知道「现在还能不能接着发、发了会不会撑爆缓冲」，只能读它。

::: warning 标准 WebSocket 没有 bufferedamountlow 事件
`RTCDataChannel` 有 `bufferedamountlow` 事件 + `bufferedAmountLowThreshold`，能在缓冲降到阈值时**回调通知**你继续发。但**标准 `WebSocket` 没有**——你无法「等一个事件」，只能**主动轮询** `bufferedAmount`（配合计时器或 `requestAnimationFrame`）。这是 WebSocket 发送节流比 WebRTC 更「手动」的根本原因。
:::

### 发送节流骨架：轮询 bufferedAmount

要往连接里灌大量数据（比如上传大文件、批量推送），不能无脑 `for` 循环 `send`——那样 `bufferedAmount` 会飙升、内存膨胀，缓冲满时连接被自动关闭。正确姿势是**看水位、留余量、再喂下一块**：

```js
/**
 * 带背压的分块发送：bufferedAmount 低于阈值才喂下一块
 * @param {WebSocket} ws 已 OPEN 的连接
 * @param {Uint8Array} data 要发送的大块数据
 * @param {number} chunkSize 每块字节数
 * @param {number} highWaterMark 缓冲水位上限，超过就等
 */
function sendWithBackpressure(ws, data, chunkSize = 16 * 1024, highWaterMark = 1 * 1024 * 1024) {
  let offset = 0;
  function pump() {
    // 一直喂，直到缓冲水位逼近上限就让出，等下一帧再看
    while (offset < data.length) {
      if (ws.readyState !== WebSocket.OPEN) return; // 连接没了就停
      if (ws.bufferedAmount > highWaterMark) {
        // 缓冲高了：让出主线程，下一帧再检查水位（模拟「等背压释放」）
        requestAnimationFrame(pump);
        return;
      }
      ws.send(data.subarray(offset, offset + chunkSize)); // 发一块
      offset += chunkSize;
    }
  }
  pump();
}
```

要点：**没有事件可等**，就用 `requestAnimationFrame`（或 `setTimeout`）周期回来看 `bufferedAmount` 是否降下去了——这是标准 WebSocket 发送背压的标准手写模式。（`WebSocketStream` 用 Streams 让这一切变成 `await writer.write()` 天然背压，见[生命周期页](./lifecycle-patterns)。）

## 三、接收无背压：WebSocket 的能力短板

发送侧至少还有 `bufferedAmount` 可看；**接收侧连这个都没有**。

标准 `WebSocket` 的 `onmessage` 是**推模型**：消息一到浏览器就立刻回调你，**你没有任何办法告诉浏览器「慢点、我还没处理完」**。当消息到达速度快过你的处理速度：

- 消息在渲染进程里**越堆越多**（内存持续上涨）；
- 或者 `onmessage` 里的处理逻辑把主线程**占到 100% CPU**、页面卡死；
- 或者两者同时发生。

```js
// 反面教材：处理慢、消息快 → 无从施加背压，只能眼看内存 / CPU 爆掉
ws.onmessage = (e) => {
  heavyProcess(e.data); // 假设这一步很慢
  // 下一条消息不会等 heavyProcess 完成——它一到就再次触发回调
};
```

**API 层没有解**——这是标准 WebSocket 的设计短板，也正是 `WebSocketStream` 试图解决的问题：用 `ReadableStream` 让你 `await reader.read()`，读得慢时背压自动传导到发送端。但它**非标准、仅 Chromium**，只能作为前沿了解（见[生命周期页](./lifecycle-patterns)）。

在标准 API 下，接收侧只能靠**应用层缓解**：

- 把重处理**移到 Web Worker**，别堵渲染主线程；
- 处理逻辑里做**采样 / 丢帧 / 合并**（比如高频行情只渲染最新值，中间态丢弃）；
- 让**服务端限速**（服务端才是真正能控制推送节奏的一方）。

## 四、大消息的浏览器侧处理

协议层的帧分片（一条大消息拆成多个 `FIN=0` 的续帧）由浏览器**自动处理**——你在 `onmessage` 拿到的永远是**重组好的完整消息**，看不到分片（帧分片细节见[网络章](/zh/base/network/net-realtime/guide-line/websocket-protocol)）。

但这带来一个现实问题：**一条几十 MB 的消息，浏览器要把它整个重组进内存后才触发 `onmessage`**。对超大负载，靠谱做法是**在应用层自己切块**，别依赖单条大消息：

```js
// 发送侧：应用层把大数据切块 + 加序号，配合上面的背压发送
async function sendLargeFile(ws, file) {
  const CHUNK = 64 * 1024;
  const total = Math.ceil(file.size / CHUNK);
  for (let i = 0; i < total; i++) {
    const slice = file.slice(i * CHUNK, (i + 1) * CHUNK);
    const buf = await slice.arrayBuffer();
    // 简单信封：4 字节序号 + 数据；接收端按序号拼
    const envelope = new Uint8Array(4 + buf.byteLength);
    new DataView(envelope.buffer).setUint32(0, i);
    envelope.set(new Uint8Array(buf), 4);
    // 生产中这里要配合 bufferedAmount 背压（见上文）
    ws.send(envelope);
  }
}
```

发送前**先量体积**再决定切不切、怎么节流：

```js
// 文本按 UTF-8 字节数（不是 .length 字符数！）
const textBytes = new TextEncoder().encode(jsonStr).length;
// 二进制直接看 byteLength
const binBytes = arrayBuffer.byteLength;
```

::: tip 应用层分片 vs 协议帧分片
两者别混：**协议帧分片**（`opcode=0x0` 续帧）是传输层的事，浏览器自动收发、你看不见（见[网络章](/zh/base/network/net-realtime/guide-line/websocket-protocol)）。**应用层分片**（上面这段）是你在业务里主动切块加序号，目的是**避免单条巨消息占满内存、并能配合背压逐块发**——两者层次不同，解决的是不同问题。
:::

## 小结

`binaryType` 决定**接收**的二进制帧是 `Blob`（默认，惰性转手）还是 `ArrayBuffer`（同步读字节），默认值与 `RTCDataChannel` 相反是最大的坑。`bufferedAmount` 是**发送侧唯一的背压信号**——标准 WebSocket 没有 `bufferedamountlow` 事件，节流只能轮询它、缓冲满会自动断连。**接收侧则完全无背压**，是标准 API 的能力短板，只能靠 Worker / 采样 / 服务端限速缓解，或了解 `WebSocketStream` 这一前沿方案。下一页讲页面生命周期协作与框架封装：[生命周期与封装模式](./lifecycle-patterns)。
