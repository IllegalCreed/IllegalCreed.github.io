---
layout: doc
outline: [2, 3]
---

# 背压与排队策略：让快慢自动匹配

> 基于 WHATWG Streams 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **背压（backpressure）**：管道链里下游消费不过来时，信号**反向传播**回上游，让上游放慢/暂停生产，防止未消费 chunk 无限堆积——流的核心价值。
- **内部队列**：每个流有一条内部队列缓冲"已产出但未消费"的 chunk；队列涨到高水位就触发背压。
- **排队策略（queuing strategy）**：`{ highWaterMark, size }` 二元组，决定"队列多满算满"。构造流时作第二参（可写/转换流分 writable/readable 两侧各一份）。
- **highWaterMark（高水位）**：队列愿意缓冲的"chunk 总大小"上限。默认对非字节流是 **1**。
- **size(chunk)**：算**每个 chunk 的大小**的函数；决定 highWaterMark 用什么单位衡量。默认每块算 1（按条数）。
- **desiredSize** = `highWaterMark − 队列中所有 chunk 的 size 之和`：还能再收多少。**降到 0 或负数 = 背压生效信号**。
- **`ReadableStreamDefaultController.desiredSize`**：可读流的背压钩子——push 源据它判断"是否该暂停往 `enqueue`"。
- **`writer.ready`**：可写流的背压钩子——一个 Promise，`desiredSize > 0`（可再收）时兑现；**写前 `await writer.ready`** 就自动跟随 sink 速度。
- **`CountQueuingStrategy({ highWaterMark })`**：内建策略，**按条数**计（`size` 恒为 1）；适合对象流/chunk 数量重要的场景。
- **`ByteLengthQueuingStrategy({ highWaterMark })`**：内建策略，**按字节**计（`size` 取 `chunk.byteLength`）；适合字节流，用字节数控内存。
- **pull 源自动背压**：队列满（`desiredSize <= 0`）时浏览器**不再调 `pull`**——你什么都不用做就有背压。
- **push 源要自己让压**：数据源不停产（WebSocket、定时器），要读 `controller.desiredSize`，≤0 时暂停生产（或用 `pull`/`cancel` 调控源）。
- **`pipeTo` / `pipeThrough` 全自动背压**：管道内部替你读 `desiredSize`、等 `ready`——**这是"优先用管道、少手写循环"的头号理由**。
- **手写循环易丢背压**：`reader.read()` + `writer.write()` 裸循环若不 `await writer.ready`，就退化成"一把梭"、失去背压。
- **`pipeTo(dest, options)` 三开关**：`preventClose`（源结束不自动关 dest）、`preventAbort`（源出错不 abort dest）、`preventCancel`（dest 出错不 cancel 源）——默认都 false（自动传播关闭/错误）。
- **多段汇入同一 writable**：靠 `preventClose:true` 让前几段结束不关 dest，最后一段才关（顺序 `pipeTo` 拼接多个源）。
- **`signal` 选项**：`pipeTo(dest, { signal })` 传 `AbortSignal`，可中途取消整条管道。
- **highWaterMark=0 的用法**：可读流设 0 表示"不预取、纯按需"；此时 `desiredSize` 常为 0/负，全靠消费拉动。

## 一、背压到底在防什么

设想没有背压的管道：上游每毫秒产一块、下游每秒才消费一块。差速持续下去，未消费的 chunk 在中间**无限堆积**，内存爆炸——流化了个寂寞。背压就是消除这种堆积的机制：

> **下游忙不过来时，让上游慢下来。**

信号沿管道**反向**传播（数据正向流、压力反向传）：

```
上游 source ──▶ [队列A] ──▶ transform ──▶ [队列B] ──▶ 下游 sink
     ▲                                                    │
     │            desiredSize<=0 / ready 未兑现             │
     └──────────────── 背压反向传播 ◀─────────────────────┘
```

每个流用**内部队列 + 排队策略**在本地判断"我满没满"，满了就通过"不再被 `pull`"或"`ready` 不兑现"把压力递给上一段。逐段相连，就成了端到端的自动限速。

## 二、排队策略：highWaterMark 与 size

构造流时的第二个参数是**排队策略**，决定"队列多满算满"：

```js
new ReadableStream(underlyingSource, {
  highWaterMark: 3, // 高水位：队列愿意缓冲的 chunk 总大小上限
  size: () => 1, // 每个 chunk 的大小（这里每块算 1，即按条数）
});
```

- **highWaterMark（高水位）**：队列缓冲的上限，单位由 `size` 定义。非字节流默认 **1**（即"缓冲一块就算满"）。
- **size(chunk)**：给每个 chunk 计一个"大小"。默认返回 1（按条数计）；字节流常返回 `chunk.byteLength`（按字节计）。
- **desiredSize**（核心公式）：

```
desiredSize = highWaterMark − 队列中所有 chunk 的 size 之和
```

`desiredSize > 0` 表示"还能收 N 个大小"，`<= 0` 表示"满了，该背压了"。例如每块 size=1、highWaterMark=3，则最多缓冲 3 块，第 4 块入队前 `desiredSize` 已 ≤0。

### 2.1 两个内建策略

不想自己写 `size` 时用内建的：

| 策略 | size 语义 | highWaterMark 单位 | 适合 |
| --- | --- | --- | --- |
| `CountQueuingStrategy({ highWaterMark })` | 恒为 **1** | **条数** | 对象流、记录流——"最多缓冲 N 条" |
| `ByteLengthQueuingStrategy({ highWaterMark })` | 取 `chunk.byteLength` | **字节** | 字节流——"最多缓冲 N 字节"，直接控内存 |

```js
// 按条数：最多缓冲 16 条记录
new WritableStream(sink, new CountQueuingStrategy({ highWaterMark: 16 }));

// 按字节：最多缓冲 64 KiB 字节（字节流用它控内存最直观）
new ReadableStream(source, new ByteLengthQueuingStrategy({ highWaterMark: 64 * 1024 }));
```

## 三、背压钩子：desiredSize 与 ready

背压对"用管道"的人是隐形的，但**手写源/汇时要主动读钩子**。

### 3.1 可读流：controller.desiredSize（push 源）

`pull` 型源天然有背压（队列满就不再被 `pull`）。**push 型源**（数据自己不停来）必须自己看 `desiredSize`：

```js
const stream = new ReadableStream({
  start(controller) {
    socket.onmessage = (e) => {
      controller.enqueue(e.data);
      // ⭐ push 源自我限压：队列满了就暂停底层源，别继续 enqueue 堆内存
      if (controller.desiredSize <= 0) {
        socket.pause(); // 让数据源停一下
      }
    };
  },
  pull() {
    // 消费者又要数据了 → 队列有空位 → 恢复源
    socket.resume();
  },
  cancel() {
    socket.close();
  },
});
```

要点：push 源不看 `desiredSize` 就等于**没有背压**——`enqueue` 会无脑堆队列直到内存吃紧。

### 3.2 可写流：writer.ready（写入侧）

写入侧的背压钩子是 `writer.ready`——写前等它，就自动跟随 sink 速度：

```js
const writer = writable.getWriter();
for (const chunk of source) {
  await writer.ready; // ⭐ sink 忙（desiredSize<=0）就在此等，直到能再收
  writer.write(chunk); // 有 ready 保证节奏，这里不必 await 每次 write
}
await writer.close();
```

`writer.desiredSize` 是同一信息的数值版；`ready` 是它的 Promise 化，更好用。

## 四、pipeTo / pipeThrough：背压全自动

**只要用管道，上面这些钩子你一个都不用碰**——管道内部替你读 `desiredSize`、等 `ready`、逐段回压：

```js
// 这一行就包含了端到端的自动背压：readable 快、writable 慢时 readable 自动降速
await readable.pipeTo(writable);
```

这就是"**优先用 `pipeTo`/`pipeThrough`、少手写 read-write 循环**"的头号理由。手写循环的典型翻车是丢背压：

```js
// ❌ 反例：丢了背压，退化成一把梭
const reader = readable.getReader();
const writer = writable.getWriter();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  writer.write(value); // 没 await writer.ready！writable 慢时队列无限涨 → 失去背压
}

// ✅ 要么补上 await writer.ready，要么干脆用 readable.pipeTo(writable)
```

## 五、pipeTo 的三个 prevent 开关与 signal

`pipeTo(destination, options)` 与 `pipeThrough(transform, options)` 的 `options` 控制**结束与错误如何传播**：

| 选项 | 默认 | 作用（设为 `true` 时） |
| --- | --- | --- |
| `preventClose` | `false` | 源正常结束时，**不**自动关闭 destination（留着继续接别的源） |
| `preventAbort` | `false` | 源出错时，**不** abort destination（错误不往下游传） |
| `preventCancel` | `false` | destination 出错时，**不** cancel 源（错误不往上游传） |
| `signal` | — | 传 `AbortSignal`，可中途取消整条管道 |

默认（全 false）语义是"**善始善终、错误双向传播**"：源结束就关 dest、任一端出错就连带处理另一端。要改这套默认行为时才动开关。

### 5.1 典型用途：多段顺序汇入同一 writable

把多个源依次写进同一个 `writable`，靠 `preventClose:true` 让前几段结束别关 dest，最后一段才关：

```js
// 把多个响应体按顺序拼进同一个可写流；除最后一段外都保留 dest 不关
async function concatInto(sources, writable) {
  for (let i = 0; i < sources.length; i++) {
    const isLast = i === sources.length - 1;
    await sources[i].pipeTo(writable, { preventClose: !isLast });
  }
}
```

### 5.2 典型用途：signal 取消管道

```js
const ac = new AbortController();
cancelButton.onclick = () => ac.abort();

try {
  await readable.pipeTo(writable, { signal: ac.signal }); // 中途 abort 会让整条管道以 AbortError 终止
} catch (e) {
  if (e.name === "AbortError") console.log("管道被取消");
}
```

## 六、常见误区

- **push 源不读 `desiredSize`**：`enqueue` 无脑堆队列 → 内存涨 → 背压形同虚设。push 源必须自我限压。
- **手写 write 不 `await ready`**：只 `await write` 不代表队列没满——高频写会越过高水位，失去背压。要么补 `ready`，要么用 `pipeTo`。
- **highWaterMark 拍脑袋设很大**：等于放宽缓冲、削弱背压，内存峰值随之上去；除非确有理由，字节流用 `ByteLengthQueuingStrategy` 按字节设更可控。
- **误以为 `pipeTo` 会丢背压**：恰相反，`pipeTo` 是**唯一自带完整背压**的方式，手写循环才容易丢。
- **`tee` 的慢分支累积**：tee 出的两支若一快一慢，慢支的内部队列会堆积——本质也是背压问题，别让某分支长期不读（见 [ReadableStream 页](./readable-stream)）。

下一页进入字节世界：readable byte streams + BYOB reader 怎么"自带缓冲区"减少拷贝，以及 Compression Streams、TextDecoder/EncoderStream 与 Node 互操作——[字节流与压缩实战](./bytes-compression)。
