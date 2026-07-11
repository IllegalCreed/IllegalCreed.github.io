---
layout: doc
outline: [2, 3]
---

# 字节流与压缩实战：BYOB、压缩流、编解码流

> 基于 WHATWG Streams 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **字节流（byte stream）**：`new ReadableStream({ type:"bytes", ... })` 造的可读流，chunk 是 `Uint8Array`；控制器是 `ReadableByteStreamController`，支持零拷贝路径。
- **BYOB reader（bring your own buffer，自带缓冲区）**：`stream.getReader({ mode:"byob" })` 拿 `ReadableStreamBYOBReader`，`read(view)` 传入**你自己的 `ArrayBufferView`**，数据直接写进这块 buffer——**减少一次拷贝**。
- **BYOB 的 Baseline**：readable byte streams + BYOB 随 **Firefox 133（2024-11）** 补齐后进入 Baseline（newly available）；2026-07 主流可用，但仍在"widely available"窗口内，**生产建议保留默认 reader 回退**。
- **`byobRequest`**：`ReadableByteStreamController.byobRequest`——消费者发来 BYOB 读请求时非 `null`；源把数据写进 `byobRequest.view.buffer`，再 `byobRequest.respond(bytesWritten)` 完成零拷贝交付。
- **`autoAllocateChunkSize`**：字节流可设它——即便消费者用**默认 reader**，浏览器也自动分配该大小的 buffer 走 `byobRequest`，让默认 reader 也享受零拷贝。
- **默认 reader 也能读字节流**：`getReader()`（不带 mode）读字节流照样工作，拿到 `Uint8Array` chunk；BYOB 只是**额外**的低拷贝优化路径。
- **Compression Streams**：`CompressionStream(format)` / `DecompressionStream(format)` 本身就是 `TransformStream`，`pipeThrough` 即用；免打包压缩库。
- **Baseline 压缩格式（放心用）**：`"gzip"`（RFC 1952）、`"deflate"`（zlib 包裹，RFC 1950）、`"deflate-raw"`（无头无校验，RFC 1951）——2023-05 起 Baseline Widely。
- **非 Baseline 格式（先查支持）**：规范近期新增 `"brotli"`、`"zstd"`，Chromium 系逐步落地，**2026-07 非 Baseline**，跨端前必测 / 查 caniuse，别默认可用。
- **流式解压 fetch 响应**：`response.body.pipeThrough(new DecompressionStream("gzip"))`——注意浏览器对 `Content-Encoding` 已**自动解压**，手动解压只用于**自定义封装**（如 body 是你自己 gzip 的数据）。
- **`TextDecoderStream`**：字节流转文本的转换流，`pipeThrough(new TextDecoderStream())` 自动处理**跨 chunk 的多字节字符**（别手动 `decode` 漏 `stream:true`）。
- **`TextEncoderStream`**：文本转 `Uint8Array` 字节的转换流，管道里"文本 → 字节"用它。
- **编解码流已 Baseline**：`TextDecoderStream`/`TextEncoderStream` Chrome 71 / Firefox 105 / Safari 14.1 起全绿，可放心用。
- **典型压缩管道**：`readable.pipeThrough(new CompressionStream("gzip")).pipeTo(writable)`——边读边压边写、恒定内存。
- **Node 互操作**：Node 18+ / Deno / Bun 内置同款 Web Streams（`node:stream/web`）；Node 老式流用 `Readable.fromWeb()` / `Readable.toWeb()` 互转。
- **`Response` 收流**：`new Response(anyReadableStream)` 可把任意可读流转成 `Response`，再 `.blob()`/`.text()`/`.arrayBuffer()` 一把收完——常用作"流转整体"的桥。
- **fetch 边界**：`response.body` 的读取、下载进度、上传流在 [fetch 叶](/zh/web-advanced/web-api/fetch/guide-line/streaming-keepalive)；本页只讲"拿到字节流之后"的字节级 / 压缩 / 编解码处理。

## 一、字节流：为二进制而生的可读流

普通可读流的 chunk 可以是任意值；**字节流**专门流字节（`Uint8Array`），并解锁一条**零拷贝**读取路径。用 `type:"bytes"` 声明：

```js
const byteStream = new ReadableStream({
  type: "bytes", // ⭐ 声明为字节流：控制器变成 ReadableByteStreamController
  autoAllocateChunkSize: 4096, // 可选：让默认 reader 也走 byobRequest 零拷贝
  pull(controller) {
    // controller 是 ReadableByteStreamController
  },
});
```

字节流的两点不同：

- **控制器是 `ReadableByteStreamController`**（多了 `byobRequest`）；
- **支持 BYOB reader**，能把数据**直接写进消费者提供的 buffer**，绕过流的内部队列拷贝。

普通可读流做不到 BYOB——所以要零拷贝二进制读取，源头就得建成 `type:"bytes"`。

## 二、BYOB reader：自带缓冲区，减少拷贝

**BYOB = Bring Your Own Buffer（自带缓冲区）**。常规读取里，源把数据放进流的内部队列，消费者 `read()` 时再拷到消费者手里——**两次拷贝**。BYOB 让消费者**先把一块 buffer 交给流**，源直接往这块 buffer 写，**省掉中间拷贝**：

```js
const reader = byteStream.getReader({ mode: "byob" }); // 拿 BYOB reader

let buffer = new ArrayBuffer(4096);
async function readInto() {
  // 把自己的 buffer 交给流；数据直接写进这里（零拷贝）
  const { done, value } = await reader.read(new Uint8Array(buffer, 0, 4096));
  if (done) return;
  // value 是一个指向【同一底层 buffer】的 Uint8Array，装着刚读到的字节
  process(value);
  // 注意：value 转移了 buffer 所有权，下一轮要用 value.buffer 续读
  buffer = value.buffer;
  return readInto();
}
```

源侧配合 `byobRequest` 完成零拷贝交付：

```js
new ReadableStream({
  type: "bytes",
  async pull(controller) {
    const view = controller.byobRequest.view; // 消费者提供的 buffer 视图
    const bytesRead = await readFileInto(view.buffer, view.byteOffset, view.byteLength);
    if (bytesRead === 0) {
      controller.close();
      controller.byobRequest.respond(0);
    } else {
      controller.byobRequest.respond(bytesRead); // ⭐ 告知写入了多少字节，完成零拷贝
    }
  },
});
```

### 2.1 autoAllocateChunkSize：默认 reader 也享零拷贝

设了 `autoAllocateChunkSize`，即使消费者用**普通 `getReader()`**，浏览器也会自动分配该大小的 buffer 并暴露 `byobRequest`——源照样能走零拷贝，消费者无感：

```js
new ReadableStream({
  type: "bytes",
  autoAllocateChunkSize: 4096, // 默认 reader 每次读也自动配 4096 字节 buffer
  pull(controller) {
    const view = controller.byobRequest.view; // 自动分配的 buffer，也能零拷贝写
    const n = fillWithData(view);
    controller.byobRequest.respond(n);
  },
});
```

### 2.2 Baseline 状态与回退

**readable byte streams + BYOB reader 随 Firefox 133（2024-11）补齐后进入 Baseline（newly available）**——Chrome/Safari 更早，Firefox 补齐后三大引擎齐活。核于 2026-07 主流浏览器均可用，但仍处在"Baseline widely available"的 30 个月窗口内。工程建议：

- **能力检测 + 回退**：BYOB 只是优化，`getReader({ mode:"byob" })` 不可用时回退默认 `getReader()`（字节流用默认 reader 照样能读，拿到 `Uint8Array`）；
- 大二进制、需要精确控制每次读取大小（如解析定长头 + 变长体）时 BYOB 收益最大；一般流式读取用默认 reader 足够。

## 三、Compression Streams：免库压缩

`CompressionStream` / `DecompressionStream` **本身就是 `TransformStream`**——`pipeThrough` 一接就用，无需打包 pako 这类压缩库：

```js
// 流式压缩：边读边 gzip 边写，恒定内存
async function gzipTo(readable, writable) {
  await readable.pipeThrough(new CompressionStream("gzip")).pipeTo(writable);
}

// 流式解压一个 Blob
async function gunzipBlob(blob) {
  const ds = new DecompressionStream("gzip");
  const decompressed = blob.stream().pipeThrough(ds);
  return new Response(decompressed).blob(); // 用 Response 一把收成 Blob
}
```

### 3.1 格式：三个 Baseline + 两个前沿

| 格式字符串 | 含义 | 状态 |
| --- | --- | --- |
| `"gzip"` | gzip 封装（RFC 1952），带头 + CRC 校验 | **Baseline**（2023-05 Widely），放心用 |
| `"deflate"` | zlib 封装的 DEFLATE（RFC 1950），带 zlib 头 + Adler-32 校验 | **Baseline**，放心用 |
| `"deflate-raw"` | 裸 DEFLATE（RFC 1951），**无头无校验** | **Baseline**，放心用 |
| `"brotli"` | Brotli（RFC 7932） | 规范近期新增、**非 Baseline**，先查支持 |
| `"zstd"` | Zstandard（RFC 8478） | 规范近期新增、**非 Baseline**，先查支持 |

- **压缩解压格式必须一致**：`CompressionStream("gzip")` 压出来的，只能 `DecompressionStream("gzip")` 解；`deflate` 与 `deflate-raw` 头不同、不通用。
- **非法格式抛 `TypeError`**。
- **`brotli`/`zstd` 别默认可用**：2026-07 仅部分引擎（Chromium 系较前）落地，跨端前查 caniuse / 实测，或退回 gzip。

### 3.2 与 fetch response.body 的边界

`response.body` 是字节流，天然能接压缩流。但有个**关键坑**：浏览器对 HTTP 响应的 `Content-Encoding`（gzip/br 等）**已经自动解压**了——`response.body` 给你的是解压后的字节。所以：

- **不要**对普通 `response.body` 再 `DecompressionStream`——那是二次解压、必错；
- 手动解压只用于 **body 本身是你自定义压缩的数据**（如接口返回一段你自己 gzip 的 payload、或读本地 `.gz` 文件），此时才 `response.body.pipeThrough(new DecompressionStream("gzip"))`。
- `response.body` 的读取套路（`getReader` 循环、进度、`for await` 的 Safari 兼容）见 [fetch 叶 · 流式与离页请求](/zh/web-advanced/web-api/fetch/guide-line/streaming-keepalive)，本页不重复。

## 四、TextDecoderStream / TextEncoderStream：编解码转换流

字节流转文本，最稳的是 `TextDecoderStream`——它是转换流，**自动处理跨 chunk 的多字节字符**（一个 UTF-8 汉字被拆在两个 chunk 边界时不会乱码）：

```js
// 字节流 → 文本流：跨块多字节字符安全
const textStream = byteStream.pipeThrough(new TextDecoderStream("utf-8"));
for await (const text of textStream) {
  // 注意 for await 的 Safari 兼容，跨端用 getReader 循环
  render(text);
}
```

反向用 `TextEncoderStream`（文本 → `Uint8Array` 字节）：

```js
// 文本流 → 字节流 → gzip → 落地：一条管道搞定"编码 + 压缩 + 写"
await textReadable
  .pipeThrough(new TextEncoderStream())
  .pipeThrough(new CompressionStream("gzip"))
  .pipeTo(fileWritable);
```

- **别手动 `new TextDecoder().decode(chunk)` 漏 `stream:true`**：手动解码时多字节字符跨块会截断乱码；要么全程 `decode(chunk, { stream:true })` + 结尾冲刷，要么直接用 `TextDecoderStream`（它内部就带流式语义）。这点与 [fetch 叶](/zh/web-advanced/web-api/fetch/guide-line/streaming-keepalive) 的结论一致。
- **兼容性**：`TextDecoderStream`/`TextEncoderStream` 自 Chrome 71 / Firefox 105 / Safari 14.1 起全绿，Baseline，可放心用。

## 五、Node 与浏览器互操作

Web Streams 不是浏览器专属——**Node 18+ / Deno / Bun 都内置同一套**：

```js
// Node：从 node:stream/web 拿到与浏览器同款的构造器
import { ReadableStream, TransformStream } from "node:stream/web";
```

与 Node 传统流（`node:stream`）互转：

```js
import { Readable, Writable } from "node:stream";

// Node 老式可读流 → Web 可读流
const webReadable = Readable.toWeb(nodeReadable);
// Web 可读流 → Node 老式可读流
const nodeReadable2 = Readable.fromWeb(webReadable);
// 可写侧同理：Writable.fromWeb() / Writable.toWeb()
```

意义：**同一段"用 Web Streams 写的流处理逻辑"能在浏览器和服务端复用**——比如一个自定义 `TransformStream` 解析器，前后端共用。`fetch`（Node 18+ 内置）的 `response.body` 在 Node 里也是 Web `ReadableStream`，与浏览器代码无缝对齐。

## 六、Response：流转整体的桥

`new Response(stream)` 能把任意可读流包成 `Response`，再用它的读取方法**一把收完**——在"流"和"整体"之间搭桥：

```js
// 把一个（解压后的）字节流收成字符串 / Blob / ArrayBuffer
const text = await new Response(decompressedStream).text();
const blob = await new Response(decompressedStream).blob();
const buf = await new Response(decompressedStream).arrayBuffer();
```

反过来，`new Response(stream)` 也常用于把自造流交给需要 `Response` 的 API（如 Service Worker 的 `fetch` 事件 `respondWith`）。

至此三类流、背压、字节流与压缩都已讲全。API 速查、对比表、易错点清单见[参考](../reference)。
