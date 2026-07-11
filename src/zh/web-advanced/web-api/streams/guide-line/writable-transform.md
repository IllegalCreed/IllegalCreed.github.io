---
layout: doc
outline: [2, 3]
---

# WritableStream 与 TransformStream：写汇与管道变换

> 基于 WHATWG Streams 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **WritableStream = 写汇**：数据往哪落地的抽象；`new WritableStream(underlyingSink, strategy)`，背后是 underlying **sink**（磁盘、网络、DOM…）。
- **underlying sink 四方法**：`start(controller)`（构造后一次，初始化）、`write(chunk, controller)`（每块调一次，**返回 Promise 用来施加背压**）、`close(controller)`（正常收尾、冲刷缓冲）、`abort(reason)`（异常中止、进入错误态）。
- **拿 writer**：`stream.getWriter()` 返回 `WritableStreamDefaultWriter` 并**锁定**流；同一时刻只能一个 writer。
- **`writer.write(chunk)`**：写一块，返回 Promise（chunk 被 sink 接受即兑现）；高频写别只 `await write`，要配合 `ready`。
- **`writer.ready`**——**背压钩子**：一个 Promise，队列低于高水位（可再接收）时兑现；写前 `await writer.ready` 就能让写入速度自动跟随 sink 消费速度。
- **`writer.close()`**：等前面所有 chunk 写完再关流，触发 sink 的 `close()`；`writer.abort(reason)` 立即弃写、进错误态、触发 sink 的 `abort()`。
- **`writer.desiredSize` / `writer.closed`**：期望大小（`highWaterMark − 已排队`，负数=超压）/ 关闭 Promise（正常 resolve、abort/error reject）。
- **`releaseLock()`**：释放 writer 锁；释放后 `write`/`close` 不可再用，需重新 `getWriter`。
- **`WritableStreamDefaultController`**：只有一个常用成员 `error(reason)`（从 sink 侧主动让流出错）与 `signal`（`AbortSignal`，abort 时触发，可中断正在进行的写）。
- **TransformStream = 读 + 写成对**：有 `writable`（往里写）与 `readable`（变换后读出）两端；`new TransformStream(transformer, writableStrategy, readableStrategy)`。
- **transformer 三方法**：`start(controller)`（一次）、`transform(chunk, controller)`（每块：变换后 `controller.enqueue(...)` 推到 readable 端）、`flush(controller)`（写入端关闭后调一次，冲刷尾巴/收尾）。
- **`TransformStreamDefaultController`**：`enqueue(chunk)`（推到 readable 端）、`terminate()`（关闭两端）、`error(e)`（两端进错误态）、`desiredSize`（readable 端背压）。
- **identity（恒等）转换流**：`new TransformStream()` 不传 transformer，chunk 原样透传——常用来"凭空造一对相连的 writable/readable"。
- **`pipeThrough(transform)`**：`readable.pipeThrough(ts)` = 把 readable 接到 `ts.writable`、返回 `ts.readable`；串联多段变换、**自动背压 + 错误传播**。
- **1 进 N 出 / N 进 1 出**：`transform` 里可 `enqueue` 多次（拆分）或攒够才 `enqueue`（合并/分帧）——转换流不必"一进一出"。
- **背压天然贯通**：TransformStream 的 readable 端满了会回压到 writable 端，进而回压上游——管道背压是端到端的（见[背压页](./backpressure-strategy)）。
- **别在 sink 里吞错**：`write`/`close` reject 会让整条管道 abort；要局部容错就在 `transform`/`write` 内自行 `try/catch` 决定放行还是 `error`。

## 一、WritableStream：把数据写到某处

`WritableStream` 抽象"数据的去处"。第一个参数是 **underlying sink**，四个可选方法描述"怎么落地"：

```js
const stream = new WritableStream(
  {
    start(controller) {
      // 构造后立即一次：打开文件/连接、初始化缓冲
    },
    // 每块调一次；返回的 Promise 兑现前，writer 视为"忙"，据此施加背压
    write(chunk, controller) {
      return doWrite(chunk); // 真正落地一块（写磁盘 / 发网络 / 塞 DOM）
    },
    close(controller) {
      return flushAndClose(); // 正常收尾：冲刷缓冲、关句柄
    },
    abort(reason) {
      return cleanup(reason); // 异常中止：丢弃、回滚、释放
    },
  },
  new CountQueuingStrategy({ highWaterMark: 1 }), // 排队策略，见背压页
);
```

关键在 **`write` 返回 Promise**：它兑现之前，这块被视为"还在写"，浏览器不会催下一块——**这就是可写流背压的实现基础**。sink 写得慢，`write` 的 Promise 就晚兑现，上游自然被拖慢。

### 1.1 用 writer 写：ready 是背压钩子

写要先 `getWriter()` 拿 `WritableStreamDefaultWriter`（流随即锁定）。**高频写入的正确姿势是"先 `await ready` 再 `write`"**：

```js
async function writeAll(stream, chunks) {
  const writer = stream.getWriter(); // 拿 writer，流锁定
  try {
    for (const chunk of chunks) {
      await writer.ready; // ⭐ 背压钩子：sink 忙就在此等，直到能再收
      writer.write(chunk); // 不必 await 每次 write —— ready 已保证节奏
    }
    await writer.ready; // 关前再等一次，确保队列已排空到可关
    await writer.close(); // 等所有 chunk 写完再关，触发 sink 的 close()
  } catch (e) {
    await writer.abort(e); // 出错则中止，触发 sink 的 abort()
  } finally {
    writer.releaseLock();
  }
}
```

`WritableStreamDefaultWriter` 的成员：

| 成员 | 说明 |
| --- | --- |
| `write(chunk)` | 写一块，返回 Promise（被 sink 接受即兑现） |
| `ready` | **背压钩子** Promise：队列低于高水位（可再收）时兑现 |
| `close()` | 等前面写完再关，触发 sink `close()`；返回 Promise |
| `abort(reason)` | 立即弃写、进错误态，触发 sink `abort()` |
| `desiredSize` | `highWaterMark − 已排队大小`；≤0 表示该等 `ready` 了 |
| `closed` | 流关闭 Promise：正常 resolve、abort/error reject |
| `releaseLock()` | 释放锁；之后 write/close 不可用 |

> **只 `await write` 不看 `ready` 会怎样？** `write` 的 Promise 只表示"这块被接受"，不代表"队列没满"。高频只 `await write` 可能让队列涨过高水位、`desiredSize` 变负——虽然仍能写，但丢了背压保护。**`ready` 才是"该不该继续写"的信号。**

### 1.2 controller：从 sink 侧让流出错

`start`/`write`/`close` 收到的 `WritableStreamDefaultController` 成员很少，最常用的是 `error()` 与 `signal`：

```js
const stream = new WritableStream({
  start(controller) {
    // controller.signal 是 AbortSignal：writer.abort() 时触发，可用来中断正在进行的写
    controller.signal.addEventListener("abort", () => stopInFlightWrite());
  },
  write(chunk, controller) {
    if (!valid(chunk)) {
      controller.error(new TypeError("非法 chunk")); // 从 sink 侧主动让流进错误态
      return;
    }
    return doWrite(chunk);
  },
});
```

## 二、TransformStream：管道中间的变换

`TransformStream` 是**读 + 写的组合体**：它有一个 `writable` 端（你往里写原始 chunk）和一个 `readable` 端（变换后的 chunk 从这里出）。写入端进的数据，经 `transform` 处理后出现在读取端——这让它能插进管道中间。

```js
const ts = new TransformStream(
  {
    start(controller) {
      // 可选：初始化（一次）
    },
    // 每块调一次：变换后用 controller.enqueue 推到 readable 端
    transform(chunk, controller) {
      controller.enqueue(transformOne(chunk));
    },
    // writable 端关闭后调一次：冲刷内部累积的尾巴、做收尾
    flush(controller) {
      const tail = drainBuffer();
      if (tail) controller.enqueue(tail);
    },
  },
  { highWaterMark: 1 }, // writableStrategy：写入端排队策略
  { highWaterMark: 1 }, // readableStrategy：读取端排队策略
);

ts.writable; // WritableStream —— 往这写
ts.readable; // ReadableStream —— 从这读
```

`TransformStreamDefaultController` 成员：`enqueue(chunk)`（推到 readable 端）、`terminate()`（关闭两端、结束流）、`error(e)`（两端一起进错误态）、`desiredSize`（readable 端的背压信号）。

### 2.1 transform 不必"一进一出"

`transform` 里 `enqueue` 的次数不受限——这让转换流能做**拆分**、**合并**、**分帧**：

```js
// 例：把"字节流"重新切成"按行"的文本流（合并 + 拆分）
function makeLineSplitter() {
  let buffer = "";
  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk; // chunk 是已解码的文本片段
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // 最后一段可能是半行，留到下次
      for (const line of lines) controller.enqueue(line); // 一进多出：逐行推出
    },
    flush(controller) {
      if (buffer) controller.enqueue(buffer); // 冲刷结尾残行
    },
  });
}
```

- **`flush` 是收尾的唯一机会**：跨 chunk 攒着的半行、解码器里的残字节、分帧器里的半个包，都在 `flush` 里冲刷——漏写 `flush` 会丢结尾数据。
- 这类"文本按行切"的场景，SSE 解析里也用到（见 [SSE 叶](/zh/web-advanced/web-api/sse/guide-line/fetch-streaming-alternative)），底层正是转换流的思路。

### 2.2 identity（恒等）转换流：造一对相连的读写端

`new TransformStream()` 不传 transformer 时是**恒等流**——写进去什么、原样读出来。它的妙用是"**凭空造一对相连的 `writable`/`readable`**"：一处往 `writable` 写、另一处从 `readable` 读，充当管道/缓冲的接头。

```js
// 恒等转换流：拿到一对相连的读写端
const { readable, writable } = new TransformStream();

// 一处：把 readable 交给需要 ReadableStream 的 API（如 new Response(readable)）
const response = new Response(readable);

// 另一处：往 writable 写，数据就出现在 readable 端
const writer = writable.getWriter();
await writer.write(new TextEncoder().encode("hello "));
await writer.write(new TextEncoder().encode("streams"));
await writer.close();
```

fetch 上传流拿 `WritableStream` 接口的技巧，用的正是这个恒等转换流套路（见 [fetch 叶](/zh/web-advanced/web-api/fetch/guide-line/streaming-keepalive)）。

## 三、pipeThrough：把变换串进管道

有了转换流，就能用 `pipeThrough` 声明式串联：

```js
// readable.pipeThrough(ts) 等价于：把 readable 接到 ts.writable，并返回 ts.readable
const out = readable
  .pipeThrough(new DecompressionStream("gzip")) // 段 1：解压（转换流）
  .pipeThrough(new TextDecoderStream()) // 段 2：字节转文本（转换流）
  .pipeThrough(makeLineSplitter()); // 段 3：切成行（自定义转换流）

for await (const line of out) {
  // 注意 for await 的 Safari 兼容，跨端用 getReader 循环
  console.log(line);
}
```

`pipeThrough` 的价值：

- **自动背压**：末端读得慢，回压会一路传到最上游（`DecompressionStream` 之前），全链自动降速——不用手写任何节流。
- **自动错误传播**：任一段 `error`，默认会把错误传给上下游、整条链 abort（可用 `preventAbort` 等微调，见[背压页](./backpressure-strategy)）。
- **自动锁定/解锁**：管道期间各流锁定，结束自动释放。

对比手写"读一段 → 变换 → 写一段"的循环，`pipeThrough`/`pipeTo` 把背压、错误、锁全照顾好了——**优先用管道**。

## 四、`WritableStream()` 构造的兼容注

`ReadableStream` 与 `TransformStream` 早已 Baseline，`WritableStream()` **构造函数**落地稍晚（MDN 老文档曾标"limited availability"）。核于 2026-07，主流浏览器（Chrome/Edge/Firefox/Safari 现行版）均已支持 `new WritableStream()`，可放心使用；仅在需要覆盖很老版本时才检测降级。用作管道终点的 `WritableStream`（如 File System Access 的 `createWritable()`、`ts.writable`）本就随各自 API 提供，无此顾虑。

下一页把背压讲透：信号怎么反向传播、highWaterMark 与 size 怎么定、两个内建排队策略、以及 `pipeTo` 的 `preventClose`/`preventAbort`/`preventCancel`——[背压与排队策略](./backpressure-strategy)。
