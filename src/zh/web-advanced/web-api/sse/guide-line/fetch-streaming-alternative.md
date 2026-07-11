---
layout: doc
outline: [2, 3]
---

# fetch 流式替代方案

> 基于 WHATWG HTML 现行标准（Server-sent events 章）· 核于 2026-07

## 速查

- **一句话结论**：AI 流式接口（ChatGPT 类）的响应**仍是 SSE 格式**，但浏览器端的主流消费方式是 **fetch + `ReadableStream` 手动解析**，而不是 `EventSource`。
- **EventSource 的四堵墙**：只能 GET（对话上下文塞不进 URL）；无法带 `Authorization` 等自定义头；非 200 时拿不到错误响应体；**响应正常结束也自动重连**（一次性生成会被反复触发）。
- **fetch 全都能**：任意方法 / 请求头 / JSON body，`AbortController` 随时取消，非 200 可读完整错误体，流结束就是结束。
- **代价**：`EventSource` 白送的全要自己造——SSE 解析、自动重连、`Last-Event-ID` 记账、连接状态管理。
- **读流三件套**：`res.body`（`ReadableStream`）→ `pipeThrough(new TextDecoderStream())`（字节转文本，跨块多字节字符安全）→ `getReader()` 循环 `read()`。
- **解析心法**：攒缓冲 → 按空行切事件块（**末段可能不完整，留到下一轮**）→ 块内逐行解析 `data:` / `event:` / `id:`。
- **OpenAI 风格**：一连串 `data: {JSON}` 块 + 终止哨兵 `data: [DONE]`。
- **Anthropic 风格**：命名事件流（`event: message_start` / `content_block_delta` / `message_stop` 等），解析必须读 `event:` 字段分派。
- **取消**：`AbortController` + `fetch(url, { signal })`；`abort()` 后 `read()` 以 `AbortError` 拒绝——"停止生成"按钮的标准实现。
- **手动重连要点一**：自己从 `id:` 行记账 lastEventId，重连时手动带 `Last-Event-ID` 请求头（跨域自定义头会触发 CORS 预检，服务端需 allow）。
- **手动重连要点二**：指数退避 + 随机抖动；4xx 当致命错误停止，网络错误才重试；`AbortError` 不重试。
- **一次性生成通常不续流**：AI 对话失败的主流做法是**整个请求重发**，不是断点续推——重连逻辑按业务性质裁剪，别照抄订阅型方案。
- **TextDecoder 细节**：不用 `TextDecoderStream` 而手写 `TextDecoder` 时必须 `decode(value, { stream: true })`，否则跨块的多字节字符出乱码。
- **行尾兼容**：规范允许 CRLF / LF / CR；手写解析至少处理 `\r?\n`；生产可直接用 eventsource-parser 这类久经考验的解析器（Vercel AI SDK 等封装底层同路线）。
- **怎么选**：常驻订阅（通知 / 行情 / 日志）选 `EventSource`，白送的重连续推是真香；一次性、带认证头、要 POST 的流式生成选 fetch 流式。
- **相关叶**：fetch 请求本身的完整能力见 [Fetch API 叶](/zh/web-advanced/web-api/fetch/)；`ReadableStream` 等流原语在本章后续 Streams API 叶展开。

## 一、EventSource 的四堵墙：AI 场景为什么绕开它

`EventSource` 为"长期订阅"设计得恰到好处，但拿它对接"发一段上下文、流式收一段生成结果"的 AI 接口，四堵墙依次撞上：

1. **只能 GET、无请求体**——对话历史、系统提示动辄几十 KB，塞 URL query 不现实（长度限制、日志泄露）；AI 接口清一色 POST + JSON body。
2. **无法自定义请求头**——`Authorization: Bearer sk-xxx` 是 LLM API 的标准门禁，`EventSource` 连塞的地方都没有（[上一页](./reconnect-and-limits)的 Cookie / ticket 出路对第三方 API 也不适用）。
3. **错误响应不可读**——配额用尽时接口回 `429 + JSON 错误详情`，`EventSource` 只给你一个不带任何信息的 `error` 事件，状态码和错误体全都拿不到。
4. **"响应正常结束也重连"**——生成完毕、服务器体面收流，`EventSource` 视为断线，隔几秒**自动重发请求**：同一个 prompt 被反复触发、token 反复计费。订阅型场景的贴心设计，在一次性任务里是事故。

于是行业默契形成：**服务端继续用 SSE 格式下发**（简单、可调试、基建友好），**浏览器端换 fetch 消费**——四堵墙全拆。

## 二、AI 接口的响应仍是 SSE：两种风格

抓包看主流 LLM API 的流式响应，`Content-Type` 依旧是 `text/event-stream`，事件流语法与[前页](./eventsource-api)所讲完全一致，只是客户端读法变了。两种代表风格：

**OpenAI 风格**——只用 `data:` 字段，以 `data: [DONE]` 哨兵收尾：

```text
data: {"choices": [{"delta": {"content": "你"}}]}

data: {"choices": [{"delta": {"content": "好"}}]}

data: [DONE]
```

**Anthropic 风格**——命名事件流，用 `event:` 字段区分阶段：

```text
event: message_start
data: {"type": "message_start", "message": {"id": "msg_01", "usage": {}}}

event: content_block_delta
data: {"type": "content_block_delta", "delta": {"type": "text_delta", "text": "你好"}}

event: message_stop
data: {"type": "message_stop"}
```

解析器必须两种都伺候得了：前者只看 `data:` 行 + 识别哨兵；后者还要读 `event:` 字段按类型分派。

## 三、fetch + ReadableStream 手动解析

完整可运行的通用实现——一个忠于规范解析规则的块解析器，加一个流式读取主循环：

```js
/**
 * 解析一个事件块（两个空行之间的部分），返回 { event, data, id }
 * 忠于规范：冒号后一个空格剥掉、多行 data 以 \n 拼接、注释行忽略、id 含 NULL 忽略
 */
function parseBlock(block) {
  const evt = { event: "message", data: "", id: undefined };
  const dataLines = [];
  for (const line of block.split(/\r?\n/)) {
    if (!line || line.startsWith(":")) continue; // 空行 / 注释行
    const idx = line.indexOf(":");
    const field = idx === -1 ? line : line.slice(0, idx); // 无冒号：整行是字段名
    let value = idx === -1 ? "" : line.slice(idx + 1);
    if (value.startsWith(" ")) value = value.slice(1); // 冒号后恰好一个空格剥掉
    if (field === "event") evt.event = value;
    else if (field === "data") dataLines.push(value);
    else if (field === "id" && !value.includes("\0")) evt.id = value;
    // 其余字段忽略（retry 对 fetch 方案无意义：重连节奏自己定）
  }
  evt.data = dataLines.join("\n");
  return evt;
}

/**
 * 发起请求并流式消费 SSE 响应；每解析出一个事件调用一次 onEvent
 */
async function streamSSE(url, { onEvent, ...init }) {
  const res = await fetch(url, init);

  // EventSource 做不到的事之一：非 200 时读出完整错误细节
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    err.body = await res.text(); // 例如 429 的配额错误 JSON
    throw err;
  }

  // 字节流 → 文本流：TextDecoderStream 兜住跨 chunk 的多字节 UTF-8 字符
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();

  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break; // 流结束就是结束——不会像 EventSource 那样自动重连
    buffer += value;

    // 按空行切事件块；末段可能只到了一半，留在缓冲里等下一轮
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop();

    for (const block of blocks) {
      const evt = parseBlock(block);
      if (evt.data) onEvent(evt); // 与规范一致：没有 data 的块不派发
    }
  }
}
```

对接 OpenAI 风格接口的用法——注意 `EventSource` 做不到的三件事（POST、认证头、取消）全在这几行里：

```js
const controller = new AbortController();
stopButton.onclick = () => controller.abort(); // "停止生成"按钮

try {
  await streamSSE("/v1/chat/completions", {
    method: "POST", // 墙一：可 POST，上下文放 body
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // 墙二：可带认证头
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ model: "gpt-x", messages, stream: true }),
    signal: controller.signal, // 墙三之外的赠品：随时取消
    onEvent({ data }) {
      if (data === "[DONE]") return; // OpenAI 风格终止哨兵
      const delta = JSON.parse(data).choices?.[0]?.delta?.content ?? "";
      outputEl.textContent += delta; // 逐段上屏
    },
  });
} catch (err) {
  if (err.name === "AbortError") return; // 用户主动停止，不算错误
  showError(err.status, err.body); // 墙三：错误细节完整可用
}
```

两个容易写错的细节：

- **残块缓冲不能省**：网络分包与事件边界无关，一个事件块经常被劈在两个 chunk 里——`blocks.pop()` 留下的末段必须攒着，少了这步就会随机丢事件或 `JSON.parse` 炸在半截 JSON 上；
- **文本解码要流式**：不用 `TextDecoderStream` 而手写 `new TextDecoder().decode(value)` 时，必须传 `{ stream: true }`，否则一个汉字的三个字节被劈开时会解出乱码。

## 四、对比 EventSource：得失清单

| 能力 | EventSource | fetch 流式 |
| --- | --- | --- |
| 请求方法 / 请求体 | 仅 GET、无体 | 任意方法 + 任意 body |
| 自定义请求头 | 不能 | 任意（跨域非简单头触发预检） |
| SSE 解析 | 内建 | 手写或用解析库 |
| 自动重连 + Last-Event-ID | 内建 | 全手写 |
| 非 200 的错误细节 | 拿不到（只有干瘪的 `error` 事件） | 状态码、响应体完整可读 |
| 取消 | `close()` | `AbortController`（signal 可贯穿业务层） |
| 流结束语义 | 视为断线，自动重连（订阅心智） | `done` 即结束（一次性心智） |
| 连接状态 | `readyState` 现成 | 自己维护 |
| 代码量 | 3 行 | 几十行起（或引解析库） |
| 典型场景 | 通知、行情、日志、进度等常驻订阅 | AI 生成、带认证的一次性流式任务 |

一句话：**fetch 换来的是请求侧的全部自由，付出的是响应侧的全部手工**。哪边成本低，取决于场景是"常驻订阅"还是"一次性生成"。

## 五、手动重连要点

选了 fetch，就同时接过了 `EventSource` 内建的可靠性职责。订阅型场景（用 fetch 是为了认证头，但流本身是长期的）需要补齐这些：

```js
/**
 * 带断点续推的订阅循环：退避重连 + lastEventId 记账
 */
async function subscribeWithRetry(url, onEvent, { signal } = {}) {
  let lastEventId = "";
  let delay = 3000;

  while (!signal?.aborted) {
    try {
      await streamSSE(url, {
        signal,
        // EventSource 自动做的事，这里手动做：带上断点凭据
        // 注意：跨域时这个自定义头会触发 CORS 预检，服务端需 Access-Control-Allow-Headers
        headers: lastEventId ? { "Last-Event-ID": lastEventId } : {},
        onEvent(evt) {
          if (evt.id !== undefined) lastEventId = evt.id; // 自己记账
          delay = 3000; // 收到数据说明链路健康，重置退避
          onEvent(evt);
        },
      });
      // 走到这里 = 流正常结束：订阅型选择重连；一次性任务应改为 return
    } catch (err) {
      if (err.name === "AbortError") return; // 主动取消，不重连
      if (err.status >= 400 && err.status < 500) throw err; // 4xx 致命：重试无意义
      // 网络错误 / 5xx：落入退避重连
    }
    // 指数退避 + 随机抖动：防止服务恢复瞬间被重连风暴打挂
    await new Promise((r) => setTimeout(r, delay + Math.random() * 1000));
    delay = Math.min(delay * 2, 30000);
  }
}
```

要点归纳：

- **lastEventId 自己记**：从每个事件的 `id` 更新本地变量，重连请求手动带 `Last-Event-ID` 头——服务端的续推逻辑（见[上一页](./reconnect-and-limits)）两种客户端通用；
- **错误分级**：`AbortError` 不重试（用户意志）；4xx 不重试（重发也是同样的错）；网络错误与 5xx 才进退避循环；
- **退避 + 抖动**：固定间隔的整齐重连会在服务恢复瞬间形成"重连风暴"，指数退避加随机抖动是标准解；
- **一次性生成别照抄**：AI 对话流断了，主流产品的做法是提示用户**重发整个请求**（幂等成本低、服务端无需续推设施），而不是断点续流——重连策略永远跟着业务性质走。

## 六、选型与生态

决策树很短：

- **常驻订阅、服务端可控、Cookie 认证够用** → `EventSource`：三行代码 + 白送的重连续推，没有理由手写；
- **需要 `Authorization` 头 / POST 大参数 / 一次性流式生成 / 精细错误处理** → fetch 流式：请求自由换手工解析；
- **服务端不用二选一**：同一个 `text/event-stream` 端点天然同时服务两种客户端（fetch 侧记得带 `Accept: text/event-stream`）。

生态一句话：Vercel AI SDK 等 AI 前端封装的底层正是"fetch + SSE 解析"这条路线；不想手写解析器可用 eventsource-parser 这类独立库（处理了 CR / CRLF、残块等全部边界）；社区还有 @microsoft/fetch-event-source 这种"带请求头与 POST 的类 EventSource"封装可作参考实现。而 `res.body` 背后 `ReadableStream` 的通用能力（tee、背压、管道）超出本叶范围，留给本章后续 Streams API 叶展开。

到这里，"正统 EventSource"与"fetch 替代"两条线都走完了。最后一页把全叶浓缩成速查表与易错点清单：[参考](../reference)。
