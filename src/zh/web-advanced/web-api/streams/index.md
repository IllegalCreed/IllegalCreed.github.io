---
layout: doc
---

# Streams API

Streams API 是 **WHATWG Streams 标准定义的流式数据处理原语**：把"陆续到达的数据"抽象成三类对象——可读流（`ReadableStream`，读源）、可写流（`WritableStream`，写汇）、转换流（`TransformStream`，读 + 写、可插进管道），以 **chunk（数据块）** 为单位边到边处理、以 **背压（backpressure）** 反向协调上下游速度、以 **管道（`pipeThrough` / `pipeTo`）** 声明式串联处理链。核心的 `ReadableStream` 自 2019-01 起 **Baseline Widely available**，`WritableStream` 与 `TransformStream`（2022-06 补齐）亦已 Baseline，Compression Streams 2023-05 转 Widely；**readable byte streams + BYOB reader** 随 Firefox 133（2024-11）补齐后进入 Baseline（newly available），异步迭代（`for await`）仍待 Safari 27。它是 fetch `response.body`、`Request` body、`CompressionStream`、`TextDecoderStream`、WebTransport、File System Access 等一众平台能力的共同底座，Node 18+ / Deno / Bun 也内置同一套接口。[Fetch API 叶](/zh/web-advanced/web-api/fetch/)已讲透 `response.body` 的读取与下载进度这一"应用面"，本叶专注流的**完整模型**：三类流的构造与生命周期、背压与排队策略、字节流与 BYOB、tee 分流、管道与转换流。

## 评价

**优点**

- **边到边处理、内存与数据量解耦**：不必等整份数据下载/读入，chunk 一到就处理，峰值内存恒定——大文件、AI 逐 token 输出、日志尾随、串口/媒体流的共同根基
- **背压内建**：管道链自动协调上下游速度，下游忙不过来时信号反向传播让上游放慢，天然防内存爆掉与丢数据，无需手写节流
- **组合式管道**：`pipeThrough` 串联转换流（解压、文本解码、自定义变换）、`pipeTo` 汇入 sink，声明式拼装数据处理链，各段可独立复用与测试
- **平台深度打通**：fetch `response.body` / `Request` body、`CompressionStream` / `DecompressionStream`、`TextDecoderStream` / `TextEncoderStream`、WebTransport、File System Access `createWritable()` 全以流为接口；流对象可跨 window / Worker `transfer`
- **跨端同一套标准**：WHATWG Streams 现行标准，Node 18+ / Deno / Bun 内置 Web Streams，浏览器与服务端互操作、代码可移植

**局限**

- **概念门槛高**：reader / writer / controller / underlying source-sink / queuing strategy 一大串概念，锁定（locked）、背压、活跃期与错误传播都要建立完整心智，比一次性 API 陡
- **前沿面非 Baseline**：`ReadableStream` 异步迭代（`for await`）Safari 27 才补、`WritableStream()` 构造与 byte streams/BYOB 是近两年才补齐、fetch 上传流仅 Chromium——兼容性要逐特性查
- **样板与调试成本**：逐块 `read()` 循环、错误传播、`releaseLock()` 都得手动照顾；流是惰性异步的，锁状态、背压是否生效、中途出错点都不直观
- **只能顺序前进、不能回退**：要重复消费同一份数据得 `tee()` 分流，而慢的一支会在内部队列累积内存
- **小数据是过度工程**：几 KB 的一次性 JSON 直接 `await res.json()` 就好，套流反而增加复杂度

一句话选型：**数据量大、或来源"陆续到达"（网络响应、文件、串口、媒体、AI 输出）、需要边到边处理 + 恒定内存 + 可组合管道时，就用 Streams API**；一次性小数据直接全量读。`response.body` 的读取与下载进度落在 [fetch 叶](/zh/web-advanced/web-api/fetch/guide-line/streaming-keepalive)、SSE 的流式解析落在 [SSE 叶](/zh/web-advanced/web-api/sse/guide-line/fetch-streaming-alternative)；流本身的完整模型（三类流 / 背压 / 排队 / BYOB / tee / 管道 / 转换流）在本叶。

## 本叶地图

- [入门](./getting-started) —— 三类流（Readable / Writable / Transform）定位、chunk 与背压心智模型、"陆续到达"的判据、与 fetch 叶/SSE 叶的分工、何时该用流何时别用
- [ReadableStream](./guide-line/readable-stream) —— underlying source 的 start/pull/cancel、控制器 enqueue/close/error、`getReader()` 默认 reader、read 循环与 done/value、`for await` 异步迭代、releaseLock、cancel、**tee 分流两份**、locked 锁定语义
- [WritableStream 与 TransformStream](./guide-line/writable-transform) —— underlying sink 的 write/close/abort、`getWriter()` 与 write/ready/close、TransformStream 的 transform/flush、pipeThrough 串联、自定义转换流、identity（恒等）转换流
- [背压与排队策略](./guide-line/backpressure-strategy) —— 背压信号反向传播原理、highWaterMark 与 size 函数、CountQueuingStrategy 与 ByteLengthQueuingStrategy、`controller.desiredSize`、`writer.ready` 背压钩子、pipeTo 自动背压、pipe 的 preventClose/preventAbort/preventCancel
- [字节流与压缩实战](./guide-line/bytes-compression) —— readable byte streams + **BYOB reader 自带缓冲区减少拷贝**（type:"bytes" / autoAllocateChunkSize）、CompressionStream/DecompressionStream 的 gzip/deflate/deflate-raw、结合 fetch `response.body` 流式处理、TextDecoderStream/TextEncoderStream、Node 与浏览器 Web Streams 互操作
- [参考](./reference) —— 三类流对比表、三大流 API 速查、排队策略表、背压钩子、压缩格式表、BYOB vs 默认 reader、易错点清单、资源链接

## 文档地址

[MDN Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)

## GitHub 地址

[whatwg/streams](https://github.com/whatwg/streams)（Streams Standard 规范仓库，含参考实现与 issue）

## 幻灯片地址

<a href="/SlideStack/streams-slide/" target="_blank">Streams API</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=streams-api" target="_blank" rel="noopener noreferrer">Streams API 测试题</a>
