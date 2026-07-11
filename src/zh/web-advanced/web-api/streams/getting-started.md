---
layout: doc
outline: [2, 3]
---

# 入门：三类流、chunk 与背压心智模型

> 基于 WHATWG Streams 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **一句话定位**：Streams API 把"陆续到达的数据"抽象成流，以 **chunk（数据块）** 为单位边到边处理，**内存占用与数据总量解耦**——大文件、网络响应、AI 逐 token、串口/媒体流的共同底座。
- **三类流**：`ReadableStream`（读源，数据从这里流出）/ `WritableStream`（写汇，数据流入这里落地）/ `TransformStream`（读 + 写成对、可插进管道中间做变换）。
- **chunk**：流里流动的**单块数据**，可以是一个字节、一个 `Uint8Array`（如 16 KiB）、一个字符串或任意对象；同一个流里各 chunk 大小/类型可以不同。
- **背压（backpressure）**：管道链里下游忙不过来时，信号**反向传播**让上游放慢或暂停生产，防止内存里堆积无限 chunk——是流区别于"一把梭"的核心价值，详见[背压与排队策略](./guide-line/backpressure-strategy)。
- **underlying source / sink**：可读流背后是 **underlying source**（数据从哪来：网络、文件、生成器），可写流背后是 **underlying sink**（数据往哪去：磁盘、网络、DOM）；你用 `start/pull/cancel` 或 `write/close/abort` 定义它们。
- **reader / writer**：读要先 `stream.getReader()` 拿 reader、写要先 `stream.getWriter()` 拿 writer；拿到后流被 **locked**，同一时刻只能有一个 reader/writer。
- **locked（锁定）**：`getReader()`/`getWriter()` 后流锁定，`stream.locked` 为 `true`；不 `releaseLock()` 就换不了新 reader，也不能 `pipeTo`。
- **read 循环**：`reader.read()` 返回 `Promise<{ done, value }>`——`done:false` 时 `value` 是 chunk，`done:true` 时流已读完（`value` 为 `undefined`）。
- **`for await...of`**：`ReadableStream` 是异步可迭代对象，可 `for await (const chunk of stream)`——但 **Safari 27 才支持**，2026-07 跨浏览器不能裸用，可移植写法仍是 `getReader()` 循环（与 [fetch 叶](/zh/web-advanced/web-api/fetch/guide-line/streaming-keepalive)口径一致）。
- **管道**：`readable.pipeThrough(transform)` 串一段转换、`readable.pipeTo(writable)` 汇入终点；管道**自动处理背压与错误传播**，比手写 read-write 循环健壮。
- **tee 分流**：`stream.tee()` 把一个可读流复制成两个独立分支，各自有 reader（如"一边给浏览器渲染、一边写缓存"）；**慢的一支会在内部队列累积内存**。
- **排队策略**：`{ highWaterMark, size }`——highWaterMark 是队列"高水位"、size 计每个 chunk 的大小；内建 `CountQueuingStrategy`（按条数）与 `ByteLengthQueuingStrategy`（按字节）。
- **字节流 + BYOB**：`new ReadableStream({ type:"bytes" })` 是字节流，可用 **BYOB reader（bring your own buffer，自带缓冲区）** 读进开发者提供的 buffer、减少拷贝——随 Firefox 133（2024-11）进 Baseline，详见[字节流与压缩](./guide-line/bytes-compression)。
- **压缩即转换流**：`CompressionStream("gzip")` / `DecompressionStream("gzip")` 本身就是 `TransformStream`，`response.body.pipeThrough(new DecompressionStream("gzip"))` 即可流式解压。
- **文本编解码即转换流**：`TextDecoderStream` / `TextEncoderStream` 是转换流，流式解码时正确处理**跨 chunk 的多字节字符**（别手动 `decode` 不带 `stream:true`）。
- **与 fetch 叶分工**：`response.body` 是 `ReadableStream`——它的**读取、下载进度、上传流**在 [fetch 叶](/zh/web-advanced/web-api/fetch/guide-line/streaming-keepalive)；SSE 的流式解析在 [SSE 叶](/zh/web-advanced/web-api/sse/guide-line/fetch-streaming-alternative)；**流的通用能力（三类流/背压/排队/BYOB/tee/管道/转换流）在本叶**，不重复展开 fetch 用法。
- **何时用流**：数据大 / 陆续到达 / 需要边到边处理或组合管道时用；几 KB 一次性小数据直接全量读，别套流。
- **Node 也有**：Node 18+ / Deno / Bun 内置同一套 Web Streams（`node:stream/web`），可与浏览器代码互操作，也能与 Node 老式 `stream` 互转。
- **进阶顺序**：本页 → [ReadableStream](./guide-line/readable-stream) → [WritableStream 与 TransformStream](./guide-line/writable-transform) → [背压与排队策略](./guide-line/backpressure-strategy) → [字节流与压缩](./guide-line/bytes-compression) → [参考](./reference)。

## 一、本叶与相邻内容的分工

流相关内容在本站分三处，各管一段，先划清边界再进 API：

| 问题 | 去哪读 |
| --- | --- |
| `fetch` 的 `response.body` 怎么读、下载进度、上传流、`keepalive` | [Fetch API 叶 · 流式与离页请求](/zh/web-advanced/web-api/fetch/guide-line/streaming-keepalive) |
| SSE / AI 流式响应用 fetch + `ReadableStream` 怎么手动解析 | [SSE 叶 · fetch 流式替代方案](/zh/web-advanced/web-api/sse/guide-line/fetch-streaming-alternative) |
| **流本身：三类流、背压、排队策略、字节流/BYOB、tee、管道、转换流** | **本叶** |

一句话记忆：**fetch 叶讲"把响应体当流读"的应用，本叶讲"流是什么、怎么造、怎么组合"的通用模型**。下文出现 `response.body` 时只点到、给链接，不重复 fetch 的读取套路。

## 二、为什么要有流：一把梭 vs 边到边

传统"一把梭"处理数据要**等全部到齐**再动手：`await res.text()` 要等整份响应下载完、`fs.readFileSync` 要把整个文件读进内存。数据一大，这两点就崩：

- **内存**：10 GB 文件全读进内存直接 OOM；
- **延迟**：得等最后一个字节到了才能开始处理，首字节到末字节这段时间白等。

流的思路相反——**数据分成 chunk，一到就处理、处理完就丢**，于是：

- **峰值内存与数据总量解耦**：无论 10 MB 还是 10 GB，同一时刻内存里只有正在处理的少量 chunk；
- **首块即处理**：第一个 chunk 到了就能开工（进度条、逐 token 渲染、边下边解压）。

这就是流的全部动机。剩下的概念都是为"安全地边到边处理"服务的：谁生产 chunk、谁消费、生产快于消费怎么办（背压）、多段处理怎么串（管道）。

## 三、三类流：读源、写汇、中间变换

WHATWG Streams 定义三类流对象，对应数据流动的三个位置：

| 流类型 | 角色 | 背后是 | 典型来源/去向 |
| --- | --- | --- | --- |
| `ReadableStream` | **读源**：数据从这里流出 | underlying **source** | `fetch` 响应体、文件、生成器、串口、媒体 |
| `WritableStream` | **写汇**：数据流入这里落地 | underlying **sink** | 磁盘文件、网络上传、DOM、`console` |
| `TransformStream` | **中间变换**：一端写入、另一端读出 | transformer | 解压、文本编解码、格式转换、自定义处理 |

`TransformStream` 是"读 + 写"的组合体——它有一个 `writable` 端（你往里写）和一个 `readable` 端（变换后的数据从这里出），因此能插进管道中间：

```js
// 一条典型管道：读源 →（解压）→（转文本）→ 汇入 sink
readable
  .pipeThrough(new DecompressionStream("gzip")) // 转换流 1：流式解压
  .pipeThrough(new TextDecoderStream()) // 转换流 2：字节转文本
  .pipeTo(writable); // 终点：写汇
```

三类流各自的构造与用法分列后续三页：[ReadableStream](./guide-line/readable-stream)、[WritableStream 与 TransformStream](./guide-line/writable-transform)。

## 四、chunk：流里流动的单块数据

**chunk** 是流一次读/写的**最小单元**。它可以是：

- 一个字节、一个 `Uint8Array`（字节流里常见 16 KiB 一块）；
- 一个字符串、一个对象（对象流——每个 chunk 是一条记录）。

两个要点：

- **同一个流里各 chunk 大小/类型可以不同**：网络分片给的 `Uint8Array` 长度并不固定，别假设"每块一样大"。
- **chunk 的"大小"由排队策略里的 `size` 函数定义**：默认按"条数"计（每块算 1），字节流常按 `byteLength` 计——这决定了背压何时触发（见第五节与[背压页](./guide-line/backpressure-strategy)）。

## 五、背压：流最关键的心智模型

**背压（backpressure）** 是流区别于"一把梭"的核心。设想一条管道：上游飞快生产 chunk、下游慢慢消费。若不加协调，未消费的 chunk 会在中间**无限堆积**，内存照样爆——流化了个寂寞。

背压就是这条协调机制：**下游忙不过来时，信号沿管道反向传播回上游，让上游放慢甚至暂停生产**，等下游腾出手再恢复。

```
上游（source） ──chunk──▶ [内部队列] ──chunk──▶ 下游（sink）
       ▲                                              │
       └────────── "我满了，慢点/停一下" ◀────────────┘
                        背压信号反向传播
```

它靠两个量运转（细节见[背压与排队策略](./guide-line/backpressure-strategy)）：

- **highWaterMark（高水位）**：内部队列"愿意缓冲的上限"。队列里 chunk 的总大小达到它，就认为"满了"。
- **desiredSize（期望大小）** = `highWaterMark − 队列中 chunk 总大小`：还能再收多少。降到 0 或负数，就是背压生效的信号。

心智模型先记这一句：**用 `pipeTo` / `pipeThrough` 拼管道，背压全自动**——`ReadableStreamDefaultController.desiredSize` 与 `writer.ready` 这些底层钩子由管道内部照顾好了。**只有手写 reader-writer 循环时，才需要自己读这些信号**（否则就丢了背压、退化成一把梭）。这是"优先用管道、少手写循环"的根本原因。

## 六、锁定（locked）：一个流同一时刻只有一个消费者

读一个流要先 `getReader()`、写要先 `getWriter()`。拿到 reader/writer 的那一刻，流就 **locked**：

```js
const reader = stream.getReader();
console.log(stream.locked); // true —— 已锁定
// 此时再 stream.getReader() 或 stream.pipeTo(...) 都会抛 TypeError
reader.releaseLock(); // 释放后才能重新取 reader / 接管道
console.log(stream.locked); // false
```

- **锁定保证 chunk 不被两个消费者抢**：流只能顺序前进，两个 reader 同时 `read()` 会争抢同一批 chunk，语义不清，所以规范禁止。
- **要"读两遍"只能 `tee()` 分流**：`const [a, b] = stream.tee()` 复制成两个独立分支，各自加锁、各自读（见 [ReadableStream 页](./guide-line/readable-stream)）。
- **`pipeTo` / `pipeThrough` 会自动加锁/解锁**：管道期间流是锁定的，管道结束自动释放——这也是优先用管道的又一好处。

## 七、何时用流、何时别用

- **该用**：数据大（大文件、大响应）；数据陆续到达（网络、串口、媒体、AI 逐 token）；要边到边处理（进度、边下边转）；要组合多段处理（解压 + 解码 + 落盘串成一条管道）。
- **别用**：几 KB 的一次性小数据——`await res.json()`、`await res.text()` 更直接，套流是过度工程。
- **fetch 场景的判据**：只要最终结果、不关心中间过程 → 用 `res.json()`/`res.text()`（内部帮你收流）；要进度/逐块/边到边 → 读 `res.body`（在 [fetch 叶](/zh/web-advanced/web-api/fetch/guide-line/streaming-keepalive)）。

下一页从**读**开始：`ReadableStream` 的构造（underlying source）、读取（reader 与 read 循环）、分流（tee）与生命周期——[ReadableStream](./guide-line/readable-stream)。
