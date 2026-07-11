---
layout: doc
outline: [2, 3]
---

# 参考：三类流 API / 策略 / 易错点

> 基于 WHATWG Streams 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **三类流**：`ReadableStream`（读源，underlying source）/ `WritableStream`（写汇，underlying sink）/ `TransformStream`（读+写成对，transformer，可插管道）。
- **读**：`getReader()` → `ReadableStreamDefaultReader`；`read()` → `{ done, value }`；`releaseLock()`/`cancel()`/`closed`；`for await`（Safari 27）；`tee()` 分两支；`locked`。
- **写**：`getWriter()` → `WritableStreamDefaultWriter`；`write(chunk)`/`ready`（背压钩子）/`close()`/`abort()`/`desiredSize`/`closed`/`releaseLock()`。
- **变换**：`new TransformStream(transformer)`；`transformer.transform(chunk,ctrl)`/`flush(ctrl)`；两端 `ts.writable`/`ts.readable`；恒等流 = `new TransformStream()`。
- **控制器**：可读 `ReadableStreamDefaultController`（`enqueue`/`close`/`error`/`desiredSize`）；字节 `ReadableByteStreamController`（多 `byobRequest`）；可写 `WritableStreamDefaultController`（`error`/`signal`）；转换 `TransformStreamDefaultController`（`enqueue`/`terminate`/`error`/`desiredSize`）。
- **underlying source**：`start(ctrl)` 一次 / `pull(ctrl)` 续喂（背压钩子）/ `cancel(reason)` 取消。
- **underlying sink**：`start(ctrl)` 一次 / `write(chunk,ctrl)` 每块（返回 Promise=背压）/ `close(ctrl)` / `abort(reason)`。
- **管道**：`readable.pipeThrough(transform, opts)` 串变换、返回下游 readable；`readable.pipeTo(writable, opts)` 汇入终点、返回 Promise；**自动背压 + 错误传播 + 锁定**。
- **pipe 选项**：`preventClose` / `preventAbort` / `preventCancel`（默认全 false=善始善终、错误双向传播）/ `signal`（`AbortSignal` 取消管道）。
- **排队策略**：`{ highWaterMark, size }`；`desiredSize = highWaterMark − 队列 size 之和`（≤0 触发背压）；内建 `CountQueuingStrategy`（按条）/`ByteLengthQueuingStrategy`（按字节）。
- **背压钩子**：可读 push 源看 `controller.desiredSize`；可写侧 `await writer.ready`；**用管道则全自动**。
- **字节流**：`new ReadableStream({ type:"bytes", autoAllocateChunkSize })`；BYOB `getReader({ mode:"byob" })` + `read(view)` 自带缓冲区减拷贝；源侧 `byobRequest.respond(n)`。
- **压缩**：`CompressionStream`/`DecompressionStream` 是转换流；Baseline 格式 `gzip`/`deflate`/`deflate-raw`；`brotli`/`zstd` 非 Baseline 先查支持。
- **编解码**：`TextDecoderStream`/`TextEncoderStream`（转换流，跨块多字节安全，Baseline）。
- **Baseline 时点**：`ReadableStream` 2019-01 / `TransformStream` 2022-06 / Compression Streams 2023-05 / byte streams+BYOB 随 Firefox 133（2024-11）进 Baseline；`for await` 待 Safari 27。
- **Node 互操作**：`node:stream/web` 同款 Web Streams；`Readable.fromWeb/toWeb`、`Writable.fromWeb/toWeb` 与老式流互转。
- **边界**：`response.body` 读取 / 下载进度 / 上传流 → [fetch 叶](/zh/web-advanced/web-api/fetch/guide-line/streaming-keepalive)；SSE 流式解析 → [SSE 叶](/zh/web-advanced/web-api/sse/guide-line/fetch-streaming-alternative)；本叶讲流的通用模型。

## 一、三类流对比

| | `ReadableStream` | `WritableStream` | `TransformStream` |
| --- | --- | --- | --- |
| 角色 | 读源：数据流出 | 写汇：数据落地 | 中间变换：写入端进、读取端出 |
| 背后 | underlying **source** | underlying **sink** | **transformer** |
| 构造 | `new ReadableStream(src, strat)` | `new WritableStream(sink, strat)` | `new TransformStream(tf, wStrat, rStrat)` |
| 取手柄 | `getReader()` → reader | `getWriter()` → writer | 无 reader/writer，用两端 `readable`/`writable` |
| 核心方法 | `read` / `cancel` / `tee` / `pipeTo` / `pipeThrough` | `write` / `close` / `abort` | `transform` / `flush`（在 transformer 里） |
| 背压钩子 | `controller.desiredSize`（push 源） | `writer.ready` | 两端各自策略、端到端贯通 |
| Baseline | 2019-01（Widely） | 现行版全绿 | 2022-06 |

## 二、ReadableStream API

### 2.1 构造与 underlying source

```js
new ReadableStream(underlyingSource?, queuingStrategy?)
```

| underlying source 方法 | 时机 | 职责 |
| --- | --- | --- |
| `start(controller)` | 构造后立即一次 | 初始化、（可选）同步 enqueue 首批 |
| `pull(controller)` | 队列未满时反复 | 续喂 chunk（返回 Promise 则等其兑现）——背压钩子 |
| `cancel(reason)` | 消费者取消时 | 释放数据源、清副作用 |

字节流额外字段：`type: "bytes"`、`autoAllocateChunkSize`。

### 2.2 实例成员

| 成员 | 说明 |
| --- | --- |
| `getReader()` | 拿 `ReadableStreamDefaultReader`，流锁定 |
| `getReader({ mode:"byob" })` | 拿 `ReadableStreamBYOBReader`（仅字节流） |
| `pipeThrough(transform, opts?)` | 接转换流，返回下游 `readable` |
| `pipeTo(writable, opts?)` | 汇入写汇，返回 `Promise` |
| `tee()` | 分成两个独立分支 `[a, b]`，原流锁定 |
| `cancel(reason?)` | 取消：丢弃未读 chunk + 调 source `cancel` |
| `locked` | 布尔：是否已被 reader/管道锁定 |

### 2.3 reader / controller

| `ReadableStreamDefaultReader` | 说明 |
| --- | --- |
| `read()` | → `Promise<{ done, value }>` |
| `releaseLock()` | 释放锁 |
| `cancel(reason?)` | 取消流 |
| `closed` | 关闭 Promise（正常 resolve、出错 reject） |

| `ReadableStreamDefaultController` | 说明 |
| --- | --- |
| `enqueue(chunk)` | 入队一块 |
| `close()` | 关流（已入队仍可读完） |
| `error(e)` | 进错误态 |
| `desiredSize` | 背压信号（`highWaterMark − 队列大小`） |

`ReadableByteStreamController` 额外有 `byobRequest`（BYOB 读请求）、`byobRequest.respond(bytesWritten)` / `respondWithNewView(view)`。

## 三、WritableStream API

### 3.1 构造与 underlying sink

```js
new WritableStream(underlyingSink?, queuingStrategy?)
```

| underlying sink 方法 | 时机 | 职责 |
| --- | --- | --- |
| `start(controller)` | 构造后一次 | 初始化 sink |
| `write(chunk, controller)` | 每块一次 | 落地一块；**返回 Promise = 背压基础** |
| `close(controller)` | 正常收尾 | 冲刷缓冲、关句柄 |
| `abort(reason)` | 异常中止 | 丢弃、回滚、释放 |

### 3.2 writer / controller

| `WritableStreamDefaultWriter` | 说明 |
| --- | --- |
| `write(chunk)` | 写一块，返回 Promise |
| `ready` | **背压钩子** Promise：可再收时兑现 |
| `close()` | 等写完再关，触发 sink `close` |
| `abort(reason?)` | 立即弃写、进错误态，触发 sink `abort` |
| `desiredSize` | 期望大小（≤0 该等 `ready`） |
| `closed` | 关闭 Promise |
| `releaseLock()` | 释放锁 |

`WritableStreamDefaultController`：`error(reason)`（从 sink 侧让流出错）、`signal`（`AbortSignal`，abort 时触发）。

## 四、TransformStream API

```js
new TransformStream(transformer?, writableStrategy?, readableStrategy?)
```

| transformer 方法 | 时机 | 职责 |
| --- | --- | --- |
| `start(controller)` | 构造后一次 | 初始化 |
| `transform(chunk, controller)` | 每块一次 | 变换后 `controller.enqueue(...)`（可 0/1/多次） |
| `flush(controller)` | 写入端关闭后一次 | 冲刷尾巴、收尾 |

| 实例成员 | 说明 |
| --- | --- |
| `readable` | 读取端 `ReadableStream` |
| `writable` | 写入端 `WritableStream` |

`TransformStreamDefaultController`：`enqueue(chunk)` / `terminate()`（关两端）/ `error(e)`（两端进错误态）/ `desiredSize`。

- **恒等流**：`new TransformStream()` 不传 transformer，chunk 原样透传——造"一对相连读写端"的常用手法。

## 五、排队策略与背压

| 策略 | `size(chunk)` | highWaterMark 单位 | 默认 highWaterMark | 适合 |
| --- | --- | --- | --- | --- |
| 默认（不传 size） | 恒 1 | 条数 | 1（可读/转换） | 一般对象流 |
| `CountQueuingStrategy({ highWaterMark })` | 恒 1 | 条数 | 需显式传 | 记录流、控条数 |
| `ByteLengthQueuingStrategy({ highWaterMark })` | `chunk.byteLength` | 字节 | 需显式传 | 字节流、控内存 |

- **公式**：`desiredSize = highWaterMark − 队列中所有 chunk 的 size 之和`；`≤0` 触发背压。
- **背压钩子**：可读 push 源读 `controller.desiredSize` 自我限压；可写侧 `await writer.ready`；**`pipeTo`/`pipeThrough` 全自动**。

## 六、pipe 选项

| 选项 | 默认 | 设 `true` 的效果 |
| --- | --- | --- |
| `preventClose` | false | 源结束时不关 destination（多段拼接用） |
| `preventAbort` | false | 源出错时不 abort destination |
| `preventCancel` | false | destination 出错时不 cancel 源 |
| `signal` | — | 传 `AbortSignal` 取消整条管道 |

## 七、字节流与 BYOB vs 默认 reader

| | 默认 reader（`getReader()`） | BYOB reader（`getReader({ mode:"byob" })`） |
| --- | --- | --- |
| 适用流 | 任意可读流 | **仅字节流**（`type:"bytes"`） |
| buffer 归属 | 流内部分配 | **消费者提供**（`read(view)`） |
| 拷贝 | 队列 → 消费者（含拷贝） | 直接写进消费者 buffer（**减拷贝**） |
| 读取粒度 | 由源决定 | 消费者精确控制（定长头/变长体解析利器） |
| 兼容 | 广 | 随 Firefox 133（2024-11）进 Baseline，**保留回退** |
| `autoAllocateChunkSize` | 设了也能走 `byobRequest` 零拷贝 | — |

## 八、压缩格式

| 格式 | 说明 | 状态 |
| --- | --- | --- |
| `"gzip"` | gzip 封装（RFC 1952） | **Baseline**（2023-05） |
| `"deflate"` | zlib 封装 DEFLATE（RFC 1950） | **Baseline** |
| `"deflate-raw"` | 裸 DEFLATE、无头无校验（RFC 1951） | **Baseline** |
| `"brotli"` | Brotli（RFC 7932） | 近期新增、**非 Baseline**，先查支持 |
| `"zstd"` | Zstandard（RFC 8478） | 近期新增、**非 Baseline**，先查支持 |

- 压/解格式必须一致；`deflate` 与 `deflate-raw` 不通用；非法格式抛 `TypeError`。
- `response.body` 已被浏览器按 `Content-Encoding` 自动解压——别二次解压（见[字节流与压缩](./guide-line/bytes-compression)）。

## 九、易错点清单

- **手写 read-write 循环丢背压**：只 `reader.read()` + `writer.write()` 不 `await writer.ready` → 退化成一把梭——优先 `pipeTo`。
- **忘记 `releaseLock()`**：手写 read 循环后不释放，流一直锁着，`tee`/`pipeTo` 全用不了——`try/finally` 里释放。
- **裸用 `for await` 遍历流**：Safari 27 才支持——跨端用 `getReader()` 循环（与 fetch 叶一致）。
- **push 源不看 `desiredSize`**：`enqueue` 无脑堆队列 → 内存涨——push 源要自我限压。
- **tee 后慢分支不读**：慢支内部队列累积内存——两支速度别差太多，或别 tee 出闲置分支。
- **同一流开两个 reader**：`getReader()` 时流已 locked → 抛 `TypeError`——要读两遍用 `tee()`。
- **转换流漏写 `flush`**：跨 chunk 攒的半行/残字节/半个包丢在结尾——收尾冲刷放 `flush`。
- **对 `response.body` 二次解压**：浏览器已按 `Content-Encoding` 自动解压——手动解压只对自定义压缩 payload。
- **手动 `TextDecoder.decode` 漏 `stream:true`**：多字节字符跨块乱码——用 `TextDecoderStream` 或全程带 `stream:true` + 结尾冲刷。
- **误以为 `brotli`/`zstd` 可直接用**：2026-07 非 Baseline——查 caniuse / 实测或退回 gzip。
- **BYOB 当必选**：BYOB 是优化不是必需——不可用时回退默认 reader（字节流默认 reader 照样读）。
- **小数据也套流**：几 KB JSON 直接 `res.json()` 更好——流是为"大 / 陆续到达 / 可组合"准备的。
- **`writer.write` 只 `await write` 当背压**：`write` 兑现≠队列没满——`ready` 才是背压信号。
- **误改 `preventClose` 默认行为**：默认 false（善始善终）适合绝大多数场景——只有多段拼接/共享 dest 才设 true。

## 十、权威链接

- [MDN: Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API) —— 总览与接口入口
- [MDN: Streams API Concepts](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Concepts) —— 概念（source/sink、背压、tee、管道）原文
- [MDN: Using readable streams](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams) ｜ [Using writable streams](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_writable_streams) ｜ [Using readable byte streams](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_byte_streams) —— 三份官方使用指南
- [MDN: TransformStream](https://developer.mozilla.org/en-US/docs/Web/API/TransformStream) ｜ [ReadableStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream) ｜ [WritableStream](https://developer.mozilla.org/en-US/docs/Web/API/WritableStream) —— 接口参考
- [MDN: Compression Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Compression_Streams_API) ｜ [CompressionStream](https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream) —— 压缩流与格式
- [MDN: TextDecoderStream](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoderStream) ｜ [TextEncoderStream](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoderStream) —— 编解码流
- [web.dev: Streams—The definitive guide](https://web.dev/articles/streams) —— 概念 + 实战权威长文
- [Streams Standard（WHATWG）](https://streams.spec.whatwg.org/) —— 规范原文
- [whatwg/streams](https://github.com/whatwg/streams) —— 规范仓库、参考实现与 issue
- 本站相邻内容：[Fetch API 叶 · 流式与离页请求](/zh/web-advanced/web-api/fetch/guide-line/streaming-keepalive) ｜ [SSE 叶 · fetch 流式替代方案](/zh/web-advanced/web-api/sse/guide-line/fetch-streaming-alternative)
