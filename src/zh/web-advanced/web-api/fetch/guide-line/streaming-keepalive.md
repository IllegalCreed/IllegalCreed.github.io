---
layout: doc
outline: [2, 3]
---

# 流式与离页请求：response.body、keepalive 与 fetchLater

> 基于 WHATWG Fetch 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **`response.body`** 是 `ReadableStream`（`Uint8Array` 字节块流）——`json()`/`text()` 等六读方法只是它的"全量收完"封装；直接读它就能**边到边处理**。
- **可移植读法**：`const reader = response.body.getReader()` + `while` 循环 `await reader.read()`（`{ value, done }` 协议）——全浏览器安全。
- **`for await...of` 兼容注**：ReadableStream 异步迭代 Chrome 124 / Firefox 110 支持，**Safari 要到 27 才补**——2026-07 时点还不能跨浏览器裸用，示例别照抄 MDN。
- **锁定语义**：`getReader()` 后流 **locked**，`json()` 等再读必炸；读过即 **disturbed**——流式读取与全量读取二选一。
- **下载进度公式**：总量取 `Content-Length` 响应头，累计每块 `value.byteLength` ÷ 总量——fetch 版 `onprogress`；注意 gzip 传输时 Content-Length 是压缩后字节数、可能缺失。
- **文本解码**：管道式 `response.body.pipeThrough(new TextDecoderStream())`（Chrome 71 / Firefox 105 / Safari 14.1，全绿）；或手动 `new TextDecoder().decode(value, { stream: true })`——`stream: true` 防多字节字符跨块截断乱码。
- **上传流**：`body` 传 `ReadableStream` + **必须 `duplex: "half"`**——请求未备齐就开始发送（边生成边传）。**仅 Chromium 105+**（Firefox/Safari 未实现），非 Baseline。
- **上传流四硬限**：`duplex: "half"` 必填（浏览器不支持 full duplex）；遇 **303 以外的重定向直接 reject**（流不可重放）；**必触发 CORS 预检**（无 Content-Length 属新型请求，`no-cors` 禁用）；**HTTP/1.x 连接直接 reject**（仅 H2/H3）。
- **half duplex 含义**：整个请求体发完才能开始读响应——想"边发边收"要拆成两个 fetch（一发一收，服务端按 ID 关联）。
- **WritableStream 接法**：`new TransformStream()` 恒等管道——`writable` 端给生产者写，`readable` 端当 fetch body；配 `CompressionStream` 可实现"边压边传"。
- **`keepalive: true`**：页面卸载后请求**继续存活**——离页埋点/会话收尾上报的 Baseline 主线（**2024-11 Firefox 133 补齐**；Chrome 66 / Safari 13 早已支持）。
- **keepalive 64 KiB 配额**：body 上限 64 KiB，且与**同在途的 keepalive 请求共享**——超限立即 reject TypeError；大报文先压缩或拆分。
- **vs sendBeacon**：keepalive fetch 可任意方法/自定义头/读响应/在 SW 用；`navigator.sendBeacon()` 只有 POST、无自定义头、拿不到响应——新代码选 keepalive fetch。
- **`fetchLater()`**（前沿）：**注册"稍后必发"的延迟请求**——页面销毁时或 `activateAfter` 毫秒数到点（先到者）由浏览器代发；解决"unload 系事件不可靠"的根问题。**Chrome/Edge 135+，非 Baseline**（Firefox/Safari 立场积极未实现）。
- **fetchLater 返回**：`FetchLaterResult`，仅一个 `activated` 布尔（是否已发出）；**响应完全不可读**；改 payload = `AbortController.abort()` 旧的再注册新的。
- **fetchLater 配额体系**：顶级文档共 **640 KiB** = 512 KiB（顶级+同源子框架）+ 128 KiB（跨域子框架池，每框架默认 **8 KiB**、约前 16 个有份）；**单上报源并发上限 64 KiB**（URL+头+体全计入）；超限/被 Permissions Policy 限制统一抛 **`QuotaExceededError`**——**调用必须防御性 try/catch**。
- **fetchLater 硬限制**：仅 **HTTPS**（不受信 URL 抛 TypeError）；**body 不能是流**（长度必须已知）；`activateAfter` 负值抛 RangeError；实际发送时机浏览器可为省电/批量微调。
- **本页边界**：服务端推送的事件流见 [SSE 叶](/zh/web-advanced/web-api/sse/)；背压、`TransformStream` 深水区与流的通用模型放本章后续 Streams API 叶——本页只讲 fetch 侧的读写。

## 一、response.body：把响应当流读

`json()`/`text()` 都要**等 body 全部到达**才兑现；而 `response.body` 直接暴露底层 `ReadableStream`，数据一到就能处理——大文件、AI 逐 token 输出、日志尾随这类场景的根基。

可移植读法（`getReader()` + read 循环，全浏览器安全）：

```js
const response = await fetch("/api/large-file");
if (!response.ok) throw new Error(`HTTP ${response.status}`);

const reader = response.body.getReader();

while (true) {
  // 每块是一个 Uint8Array；块大小由网络与浏览器决定，不可假设
  const { value, done } = await reader.read();
  if (done) break;
  process(value); // 边到边处理
}
```

两个语义要点：

- **锁定与消费**：`getReader()` 让流进入 **locked** 状态（此后 `json()` 等全量方法抛 TypeError）；读过任何数据即 **disturbed**——流式与全量**二选一**，要两样都来先 `clone()`（见[三对象页](./request-response)）。
- **`for await...of` 先别裸用**：ReadableStream 的异步迭代 Chrome 124（2024-04）/ Firefox 110 已支持，**Safari 直到 27 才补齐**——核于 2026-07 还不是跨浏览器安全写法，MDN 示例里的 `for await (const chunk of stream)` 移植时换回 `getReader()` 循环。

取消流式读取走同一套 AbortSignal：fetch 时传 `signal`，中途 `abort()` 会让 `reader.read()` 以 `AbortError` reject（也可以 `reader.cancel()` 只弃读不报错）。

## 二、下载进度：fetch 版 onprogress

XHR 有 `onprogress`，fetch 的等价物要自己搭：**总量看 `Content-Length`，进度靠累计**：

```js
/**
 * 带进度回调的下载
 * @param {string} url
 * @param {(loaded: number, total: number) => void} onProgress total 为 0 表示未知
 */
async function fetchWithProgress(url, onProgress, { signal } = {}) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  // 总字节数：可能缺失（分块传输/服务端没给），要按"未知总量"降级
  const total = Number(response.headers.get("Content-Length")) || 0;

  const reader = response.body.getReader();
  const chunks = [];
  let loaded = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    onProgress(loaded, total); // total 为 0 时 UI 显示"已下载 X MB"而非百分比
  }

  return new Blob(chunks); // 拼回完整数据
}
```

两个精度陷阱：

1. **压缩传输的口径差**：`Content-Length` 是**线上传输字节数**（gzip 后），而 `reader.read()` 拿到的是**解压后字节**——两者相除会算出超过 100% 的进度；跨域时还需服务端暴露该头（`Access-Control-Expose-Headers: Content-Length`）。
2. **`Content-Length` 可能没有**：分块传输编码（chunked）下无此头——进度条要能降级成"不确定态"。

## 三、文本解码：跨块安全是关键

`response.body` 给的是**字节**，转文本有两条路：

```js
// 路线一（推荐）：TextDecoderStream 管道 —— Chrome 71 / Firefox 105 / Safari 14.1，全绿
const response = await fetch("/api/stream-text");
const reader = response.body
  .pipeThrough(new TextDecoderStream()) // 字节流 → 字符串流（默认 UTF-8）
  .getReader();

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  appendToUI(value); // value 已是 string
}
```

```js
// 路线二：手动 TextDecoder —— 注意 stream: true
const decoder = new TextDecoder(); // 默认 utf-8
const reader = response.body.getReader();

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  // stream: true 让解码器"记住"跨块截断的多字节序列，下一块续上
  appendToUI(decoder.decode(value, { stream: true }));
}
appendToUI(decoder.decode()); // 收尾：冲刷缓冲的残余字节
```

`stream: true` 不是可选优化——UTF-8 里一个汉字占 3 字节，网络分块**随时可能把它拦腰截断**，不带该选项每块独立解码就会周期性输出乱码替换符。这也是 AI 打字机效果偶发"锟斤拷"的经典病根。按行/按 SSE 事件切分等更复杂的分帧，属于流处理通用话题，放本章后续 Streams API 叶展开。

## 四、上传流：duplex: "half" 的 Chromium 现状

反方向——**请求体也可以是流**：不等数据备齐就开始发送（录音边采边传、大文件边读边传、客户端实时日志）：

```js
// 仅 Chromium 105+：Firefox（bugzil.la/1792434）/ Safari（webkit.org/b/245671）未实现
const stream = new ReadableStream({
  async start(controller) {
    for (const part of generateParts()) {
      controller.enqueue(part); // 需要是 Uint8Array 字节块
    }
    controller.close();
  },
}).pipeThrough(new TextEncoderStream()); // 字符串生产者要先编码成字节

await fetch("/api/upload-stream", {
  method: "POST",
  body: stream,
  duplex: "half", // body 为流时必填，缺了直接 TypeError
});
```

**四条硬限制**（Chrome 官方文档口径）：

| 限制 | 原因 |
| --- | --- |
| `duplex: "half"` 必填 | 浏览器只支持半双工：**请求体发完才开始给你响应**；Deno 等运行时曾默认全双工，显式声明消除歧义 |
| 遇 **303 以外**的重定向直接 reject | 重放 body 需要缓冲整条流，违背流式初衷；303 会改成 GET 丢弃 body，所以放行 |
| **必触发 CORS 预检**，`no-cors` 禁用 | 无 `Content-Length` 的请求属于"新型请求"，一律先预检 |
| **HTTP/1.x 连接直接 reject** | HTTP/1.1 请求体要么带长度要么 chunked，而请求方向的 chunked 兼容风险大——仅 H2/H3 |

想"边发边收"（真双工）目前的替代方案是**两个 fetch**：一个流式上行、一个流式下行，服务端用 ID 关联。另一个实用技巧是用恒等 `TransformStream` 拿到 **WritableStream 接口**：

```js
// TransformStream 不传参 = 恒等管道：writable 进什么，readable 出什么
const { readable, writable } = new TransformStream();

const uploadPromise = fetch("/api/upload-stream", {
  method: "POST",
  body: readable,
  duplex: "half",
});

// 生产侧拿到 writer 随写随传；配 CompressionStream 还能边压边传
const writer = writable.getWriter();
await writer.write(new TextEncoder().encode("part 1"));
await writer.close();
```

**特性检测**（来自 Chrome 官方，利用"不支持的 body 类型会被 toString 成字符串"的行为）：

```js
const supportsRequestStreams = (() => {
  let duplexAccessed = false;
  const hasContentType = new Request("", {
    body: new ReadableStream(),
    method: "POST",
    get duplex() {
      duplexAccessed = true; // 支持流式上传的浏览器才会读取 duplex
      return "half";
    },
  }).headers.has("Content-Type"); // 不支持时 body 变字符串，自动带上 text/plain
  return duplexAccessed && !hasContentType;
})();
```

工程判断：上传流是**渐进增强项**——检测支持则流式，否则回退整体上传（`Blob`/`FormData`）；此外链路上任何一环（反代、CDN、安全软件）缓冲请求体都会让流式退化，服务端要实测。

## 五、keepalive：离页存活的可移植主线

页面卸载瞬间的"最后一发"上报（会话时长、性能指标、未保存草稿）有个经典困境：普通 fetch 会随页面销毁被**取消**。`keepalive: true` 让请求**脱离页面生命周期**：

```js
// pagehide/visibilitychange 里发最后一包：页面关了请求也会送达
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(collectMetrics()),
      keepalive: true, // 关键：卸载不中断
    });
  }
});
```

规则与现状：

- **64 KiB 配额**：keepalive 请求的 body 上限 64 KiB，且这个额度由**所有在途 keepalive 请求共享**（规范口径：新请求 body + 在途 keepalive 字节 ≤ 64 KiB）——超限**立即 reject TypeError**，不是排队。大报文要压缩、采样或拆分。
- **Baseline Newly available 2024-11**：Chrome 66（2018）/ Safari 13（2019）早已支持，**Firefox 133（2024-11）补齐**后才真正"全绿"——需要兼容更老 Firefox 的产品要留 `sendBeacon` 兜底。
- **对比 `navigator.sendBeacon()`**：

| 维度 | `fetch(..., { keepalive: true })` | `navigator.sendBeacon()` |
| --- | --- | --- |
| 方法 | 任意（GET/POST/PUT…） | 仅 POST |
| 自定义头 | 可以（如 `Content-Type: application/json`、认证头） | 不可（Content-Type 受限于 body 类型） |
| 响应 | **可读**（Promise 正常兑现） | 拿不到（只返回入队布尔） |
| Service Worker 内 | 可用 | 不可用 |
| 体积限制 | 64 KiB（在途共享） | 同级配额（实现相关） |
| 支持面 | Baseline 2024-11 | 多年全绿 |

结论：**新代码一律 keepalive fetch**，`sendBeacon` 的定位退为老浏览器回退。但两者共同的残留问题是"**什么时机调用**"——`unload`/`beforeunload` 不可靠（多家浏览器干脆不发）、`pagehide`/`visibilitychange` 移动端仍有缺口——这正是 fetchLater 要根治的。

## 六、fetchLater()：把"何时发"交还浏览器（前沿）

`fetchLater()` 换了思路：不是"在正确的时机发请求"，而是**提前注册一个延迟请求**，由浏览器保证在**页面销毁时或 `activateAfter` 超时到点（先到者）**发出——开发者从此不赌 unload 系事件：

```js
// 防御性 try/catch 是标配：配额受第三方脚本挤占，随时可能抛 QuotaExceededError
let result = null;
let aborter = null;

function queueReport(data) {
  // 更新 payload 的唯一方式：废掉旧的，注册新的
  if (result && !result.activated) aborter.abort();

  aborter = new AbortController();
  try {
    result = fetchLater("/api/session-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      activateAfter: 60_000, // 最迟 60s 后发；页面先关则提前发
      signal: aborter.signal,
    });
  } catch (e) {
    if (e.name === "QuotaExceededError") {
      sendFallback(data); // 配额没了：降级走 keepalive fetch
    } else {
      throw e;
    }
  }
}
```

要点全表：

- **返回值**：`FetchLaterResult`，只有一个 `activated` 布尔（是否已发出）；**发出后的响应（状态、头、体）完全不可读、被丢弃**——它是纯上报通道。
- **配额体系**（防止离页带宽被滥用，单位 KiB）：顶级文档总额 **640** = **512**（顶级文档 + 同源直接子框架共享）+ **128**（跨域子框架公共池：每个跨域 iframe 入 DOM 时预分配 **8**，约前 16 个有份）；同一**上报源**（请求 URL 的 origin）在途合计不超 **64**；**URL 长度 + 头 + 体全部计入**。`Permissions-Policy: deferred-fetch` / `deferred-fetch-minimal` 可重划（如把某跨域子框架升到 64，或整池收回）。
- **超限行为**：抛 **`QuotaExceededError`**——且 Permissions Policy 拒绝与真超额**不可区分**（同一个错误），所以官方口径是"几乎所有调用都应 try/catch"。
- **硬限制**：仅 **HTTPS**（http:// 抛 TypeError）；**body 不能是 `ReadableStream`**（延迟请求长度必须已知）；`activateAfter` 为负抛 RangeError；分离窗口（已移除 iframe 的 window）调用无效；实际发送时刻浏览器可能为批量/省电**前后微调**。
- **支持面**：**Chrome/Edge 135+（2025-04），非 Baseline**——Firefox/Safari 标准立场积极但未实现（BCD 核于 2026-07）。生产采用姿势：`if ("fetchLater" in window)` 渐进增强，主线仍是 keepalive fetch + `pagehide`/`visibilitychange` 双保险。

一句话定位三者：**keepalive 解决"发了别断"（Baseline，主线）；sendBeacon 是它的老式简配（兜底）；fetchLater 解决"何时发"这个更根本的问题（Chromium 前沿，增强）**。

## 七、易错点

- **`for await` 遍历 `response.body` 直接上生产**：Safari 27 之前不支持——用 `getReader()` 循环，或加特性检测。
- **流式读完又想 `json()`**：流已 locked/disturbed，抛 TypeError——要两用先 `clone()`。
- **进度按 Content-Length 算出 120%**：压缩传输的口径差（线上字节 vs 解压字节）——同源关压缩、或改按"已收字节数"展示。
- **跨域拿不到 Content-Length**：CORS 响应头白名单没它——服务端加 `Access-Control-Expose-Headers`。
- **`TextDecoder.decode()` 不带 `stream: true`**：多字节字符跨块截断，周期性乱码——流式解码必带，结尾再 `decode()` 一次冲刷。
- **上传流忘了 `duplex: "half"`**：TypeError——body 为流时必填。
- **上传流打到 HTTP/1.1 源站**：直接 reject——链路必须全程 H2/H3，反代终止 H2 再以 H1 回源也会缓冲破坏流式。
- **给上传流配 `no-cors`**：禁用组合——流式上传必走 CORS 且必预检。
- **keepalive 塞大报文**：64 KiB 在途共享配额，超限立即 TypeError——压缩/采样/拆包，或考虑放弃部分数据。
- **在 `unload` 里发 keepalive 请求**：事件本身不可靠（部分浏览器不触发）且破坏 BFCache——用 `pagehide` + `visibilitychange (hidden)` 双监听。
- **fetchLater 不包 try/catch**：第三方脚本共享配额，`QuotaExceededError` 随时可能——防御性捕获 + keepalive 降级。
- **想读 fetchLater 的响应**：设计上不可读（发出即丢弃）——需要回执的上报走普通 fetch/keepalive。
- **用 fetchLater 传敏感大 payload 不算账**：URL+头+体全计入 64 KiB 单源配额——先估算再注册。

最后一页把全叶收拢成表——选项全表、API 速查、错误分类与易错点清单：[参考](../reference)。
