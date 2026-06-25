---
layout: doc
outline: [2, 3]
---

# SSE 服务器推送

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- **SSE（Server-Sent Events）**：服务器向浏览器**单向**持续推送的标准（WHATWG HTML 规范一部分），基于普通 HTTP，无需新协议、无需升级握手。
- **一条长连接**：客户端发一个普通 GET，服务器**不结束响应**，而是持续把事件写入同一条响应流；连接保持开放。
- **响应头**：`Content-Type: text/event-stream`，配合 `Cache-Control: no-cache`；反向代理还常加 `X-Accel-Buffering: no` 关闭缓冲。
- **事件流格式**：纯文本、行式结构，四个字段 `data:` / `event:` / `id:` / `retry:`，**空行（`\n\n`）分隔一个事件**。
- **`data:`**：消息体；多条连续 `data:` 行按换行拼接成一条数据（末尾换行被去掉）。
- **`event:`**：事件类型名，省略时默认 `message`（对应 `onmessage`）；命名事件用 `addEventListener` 监听。
- **`id:`**：事件 ID，写入浏览器的"最后事件 ID"。
- **`retry:`**：重连等待毫秒数（仅 ASCII 数字有效）。
- **冒号开头行**是注释，整行忽略，常用作心跳保活（如 `: ping`）。
- **自动重连**：连接断开浏览器**自动重连**，并把上次 `id` 通过请求头 `Last-Event-ID` 带回，服务器据此**断点续传**。
- **纯文本 UTF-8**：必须以 UTF-8 编码，只能传文本（要传二进制需先编码）；这是与 WebSocket 二进制能力的关键差异。
- **局限**：单向（仅服务器→客户端）；HTTP/1.1 下每域同时连接数受限（Chrome/Firefox 约 6 条），**HTTP/2 多路复用可缓解**。

## 什么是 SSE

**SSE（Server-Sent Events，服务器发送事件）** 是 W3C / WHATWG HTML 标准的一部分，让网页能从服务器**持续接收文本事件流**。它解决的是"服务器有新数据时主动告知浏览器"这一需求——而无需客户端反复轮询。

与上一页[实时通信方案演进](./polling-evolution)里的长轮询相比，SSE 的本质区别是：**一次请求对应一条长期不关闭的响应**，服务器源源不断地往这条流里写事件，而非"一问一答、答完即断、再发起下一次"。

::: tip SSE 的定位
SSE = **HTTP + 一条不结束的响应 + 约定好的文本格式 + 浏览器内建的自动重连**。它不引入新协议，复用现有 HTTP 基础设施（CDN、鉴权、压缩、HTTP/2），是"轻量服务器推送"的标准答案。
:::

## 基于 HTTP 的长连接

SSE 不做协议升级（不像 WebSocket 要 `Upgrade: websocket` 握手），它就是一次普通的 HTTP 请求/响应，只不过响应**迟迟不结束**：

```http
GET /events HTTP/1.1
Host: example.com
Accept: text/event-stream
```

服务器返回的响应头声明这是事件流，然后保持连接开放、不断写入：

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

::: warning 中间层缓冲是常见坑
Nginx 等反向代理默认会缓冲后端响应，导致事件"攒一批才下发"，破坏实时性。需为该路由关闭缓冲（Nginx：`X-Accel-Buffering: no` 响应头或 `proxy_buffering off;`）。同理 gzip 缓冲、各类 CDN 缓存也要针对 `text/event-stream` 放行。
:::

## 事件流格式

事件流是**纯文本、逐行**的格式，MIME 类型固定为 `text/event-stream`，必须 UTF-8 编码。每行形如 `字段名: 值`，**一个空行（连续两个换行）触发一次事件分发**。规范定义四个字段：

| 字段     | 含义                                                          |
| -------- | ------------------------------------------------------------- |
| `data:`  | 数据负载；多条连续 `data:` 行用换行拼接成一段                  |
| `event:` | 事件类型名；省略则为默认类型 `message`                        |
| `id:`    | 事件 ID，写入浏览器的"最后事件 ID"，重连时回传                 |
| `retry:` | 重连前等待的毫秒数（仅当值全为 ASCII 数字时生效）              |

最简单的数据流（默认 `message` 事件）：

```text
: 这是一条注释行，会被忽略，可用作心跳

data: 第一条消息

data: 第二条消息
data: 它跨了两行
```

上面第二个事件的 `data` 最终为 `第二条消息\n它跨了两行`——多条 `data:` 行按换行拼接，末尾换行被去掉。

带类型、ID 与重连间隔的完整示例：

```text
retry: 10000

event: price
id: 42
data: {"symbol": "YHOO", "price": 79.10}

event: price
id: 43
data: {"symbol": "YHOO", "price": 79.30}

: keep-alive
```

::: info 默认事件类型是 message
不写 `event:` 字段时，事件类型默认为 `message`，由 `EventSource.onmessage` 接收；写了 `event: price` 则需用 `addEventListener("price", ...)` 监听。注意 `data` 始终是字符串，传 JSON 需自己 `JSON.parse`。
:::

## 自动重连与断点续传

SSE 最实用的内建能力是**自动重连**：当连接因网络抖动、服务器重启或代理超时而中断，浏览器会在等待一段时间（默认值由浏览器决定，可被 `retry:` 字段覆盖）后**自动重新发起请求**，无需任何客户端代码。

断点续传靠 `id:` 与请求头 `Last-Event-ID` 配合完成：

1. 服务器为事件附带 `id:`，浏览器记下它作为"最后事件 ID"。
2. 连接断开、浏览器重连时，**自动**在请求头里带上 `Last-Event-ID: <上次的 id>`。
3. 服务器读取该头，从断点之后继续推送，避免漏发或重发。

```text
事件下发：  id: 42  →  浏览器记住 42
（连接断开，浏览器等待 retry 后重连）
重连请求头：Last-Event-ID: 42  →  服务器从 43 继续
```

::: tip 自动重连不是"永不掉线"
浏览器只在连接"非正常关闭"时重连；若服务器主动以 `204 No Content` 或非 `text/event-stream` 响应回应，浏览器会**停止**重连。要实现真正可靠的续传，服务端需为事件分配单调 ID、并按 `Last-Event-ID` 正确补发。
:::

## EventSource API 一句话

浏览器端用内建的 **`EventSource`** 接口消费 SSE：`const es = new EventSource("/events")`，再监听 `onmessage` 或具名事件即可，重连等细节由它自动处理。

::: info JS 用法细节在别处
`EventSource` 的完整用法（`onopen` / `onerror` / `readyState`、`withCredentials` 跨域、`close()`、具名事件监听等）属于浏览器 API 范畴，本叶不展开，详见「Web 进阶 > Web API」章。本叶聚焦协议与网络原理。
:::

## SSE vs WebSocket

二者都用于实时通信，但定位迥异（WebSocket 详见下一页[WebSocket 协议握手与帧](./websocket-protocol)）：

| 维度       | SSE                                | WebSocket                          |
| ---------- | ---------------------------------- | ---------------------------------- |
| 方向       | **单向**（服务器→客户端）          | **全双工**双向                     |
| 底层       | 普通 HTTP（一条长响应）            | 独立协议，经 HTTP 握手后升级       |
| 数据类型   | **纯文本 UTF-8**                   | 文本 + **二进制**                  |
| 自动重连   | **浏览器内建**（含 Last-Event-ID） | 无，需自己实现                     |
| 客户端 API | `EventSource`                      | `WebSocket`                        |
| 协议/基建  | 复用 HTTP 鉴权/压缩/CDN/HTTP-2     | 需对 WS 单独处理鉴权、代理、心跳   |

::: tip 一句话选型
**只需服务器单向推文本**（通知、行情、日志、进度、AI 流式输出）选 SSE——更简单、自带重连、复用 HTTP；**需要双向、低延迟、或传二进制**（聊天、协同编辑、游戏、信令）选 WebSocket。完整对比见本叶最后一页[实时方案对比与选型](./realtime-comparison)。
:::

## 适用场景与局限

**适合 SSE 的典型场景**（共性是"服务器主动推、客户端只读、内容是文本"）：

- **通知 / 提醒**：站内信、系统公告、订单状态变更。
- **实时行情**：股价、汇率、加密货币价格刷新。
- **日志 / 进度流**：构建日志、长任务进度条、部署输出实时滚动。
- **AI 流式输出**：大模型逐 token 返回（许多 LLM 接口的流式响应正是 SSE 格式）。

**局限**：

- **单向**：客户端要发数据得另开普通请求，无法在同一条流上回传。
- **纯文本**：传二进制须先 Base64 等编码，有体积与 CPU 开销。
- **连接数限制（HTTP/1.1）**：浏览器对**每个域**的并发 HTTP 连接有上限（Chrome、Firefox 约 6 条），多个标签页各开一条 SSE 很容易耗尽——该限制在 Chrome/Firefox 被标记为"不修复"。

::: warning HTTP/2 缓解连接数限制
切到 **HTTP/2** 后，同一域的多条 SSE 复用单条 TCP 连接的多路流，上限由 `SETTINGS_MAX_CONCURRENT_STREAMS` 决定（默认约 100），远高于 HTTP/1.1 的 6 条，基本消除"开几个标签页就连不上"的窘境。这也是生产环境部署 SSE 强烈建议启用 HTTP/2 的原因。
:::

## 小结

SSE 是**基于普通 HTTP 的服务器单向推送标准**：客户端发一个 GET，服务器以 `Content-Type: text/event-stream` 回应并保持响应不结束，按 `data:` / `event:` / `id:` / `retry:` 四字段、**空行分隔**的纯文本格式持续写入事件。它的杀手锏是**浏览器内建的自动重连**，并通过 `id:` 与 `Last-Event-ID` 请求头实现断点续传，客户端仅用 `EventSource` 即可消费。相比 WebSocket，SSE 单向、纯文本 UTF-8、复用 HTTP 基建，适合通知、行情、日志、进度与 AI 流式输出；局限在于不能双向、不便传二进制，以及 HTTP/1.1 下每域连接数受限——而启用 **HTTP/2 多路复用**即可有效缓解。

---

上一页：[实时通信方案演进](./polling-evolution) · 下一页：[WebSocket 协议握手与帧](./websocket-protocol)
