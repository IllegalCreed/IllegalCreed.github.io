---
layout: doc
outline: [2, 3]
---

# 参考：API 速查 / 对比 / 易错点

> 基于 WHATWG HTML 现行标准（Server-sent events 章）· 核于 2026-07

## 速查

- **API 面**：构造 `new EventSource(url, { withCredentials? })` + 只读 `url` / `withCredentials` / `readyState` + `close()` + 事件 `open` / `message` / `error` / 任意命名事件；继承 `EventTarget`，暴露于 Window 与 Worker。
- **readyState**：`CONNECTING(0)` 首连或重连等待、`OPEN(1)` 派发中、`CLOSED(2)` 已放弃或已关闭；常量挂在 `EventSource` 类上。
- **请求语义**：固定 GET、缓存 `no-store`、可能自带 `Accept: text/event-stream`、301/307 跟随、**请求头不可自定义**。
- **响应铁律**：**200** + **`text/event-stream`** + 保持不结束；违者致命失败、不重连。
- **四字段**：`data`（多行以 `\n` 拼接、末尾换行剥掉）、`event`（命名事件须 `addEventListener`）、`id`（写入最后事件 ID，空值重置）、`retry`（纯 ASCII 数字毫秒）；未知字段忽略、字段名大小写敏感。
- **注释**：冒号开头整行忽略；心跳惯例约 15 秒一条；**客户端完全无感**（不产生任何事件、喂不了看门狗）。
- **派发规则**：空行触发派发；data 缓冲为空则不派发；EOF 时未收尾的残块整体丢弃。
- **onmessage 范围**：只收"无 `event:` 字段"与 `event: message` 两种；其他命名事件只进对应的 `addEventListener`。
- **MessageEvent 三件**：`data`（永远字符串）/ `lastEventId`（沿用最近 `id:`）/ `origin`（校验来源）。
- **重连语义**：网络错误与**响应正常结束**都重连（CONNECTING + `error`，等 retry 间隔，可退避）；非 200、MIME 错、请求中止 → CLOSED 永不重连；**204 是规范钦点的停止信号**；重连自动带 `Last-Event-ID` 头。
- **六连接红线**：HTTP/1.1 每"浏览器 + 域名"约 6 条（跨标签页累计，Chrome/Firefox Won't fix）；HTTP/2 协商上限（默认 100）或 SharedWorker 共享一条连接。
- **认证局限**：构造仅 `withCredentials`（Cookie 路线）；`Authorization` 头无门——URL 短时效 ticket 或改用 fetch 流式。
- **fetch 流式**：任意方法 / 头 / 体 + `AbortController` + 错误体可读；代价是解析、重连、lastEventId 记账全手写——AI 流式接口的主流消费方式。
- **生命周期**：挂着监听器的实例不被 GC、**置 null 不断连**——必须显式 `close()`（无 close 事件）；仅 Document 销毁才强制关闭。
- **调试**：事件流纯文本，`curl -N` 直读；Chrome DevTools 网络面板选中请求后有 EventStream 标签逐条看事件。

## 一、EventSource 接口

### 构造与成员

| 成员 | 说明 |
| --- | --- |
| `new EventSource(url, options?)` | 构造即连接；`url` 可相对（按当前文档解析），非法抛 `SyntaxError`；`options` 仅 `{ withCredentials: boolean }`（默认 `false`） |
| `url` | 只读；解析后的绝对 URL |
| `withCredentials` | 只读；跨域凭据模式是否为 include |
| `readyState` | 只读；`0 CONNECTING` / `1 OPEN` / `2 CLOSED` |
| `close()` | 中止连接与重连计划，置 CLOSED；幂等；**无事件通知**；实例不可复用 |

### 事件

| 事件 | 事件对象 | 触发时机 |
| --- | --- | --- |
| `open` | `Event` | 响应通过校验（200 + 正确 MIME），readyState 变 OPEN；每次重连成功都触发 |
| `message` | `MessageEvent` | 收到无 `event:` 字段或 `event: message` 的消息 |
| 命名事件 | `MessageEvent` | 收到 `event: xxx` 的消息，须 `addEventListener("xxx")` |
| `error` | `Event` | 进入重连（readyState 为 CONNECTING）或致命失败（CLOSED）；事件对象无细节，**靠 readyState 区分** |

### MessageEvent 关键属性

| 属性 | 说明 |
| --- | --- |
| `data` | 消息内容，**永远是字符串**；JSON 自行 parse |
| `lastEventId` | 连接的"最后事件 ID"当前值；本条未带 `id:` 时沿用旧值 |
| `origin` | 事件流最终 URL（重定向后）的源；敏感操作前校验 |

## 二、事件流格式

MIME 固定 `text/event-stream`；UTF-8（无替代编码机制）；行尾 CRLF / LF / CR 均可；流首 BOM 剥掉。

### 字段处理

| 字段 | 处理规则 |
| --- | --- |
| `data` | 值追加进数据缓冲 + 一个换行；派发时剥掉末尾一个换行（多行 data 因此以 `\n` 拼接） |
| `event` | 设置本次事件类型；派发后重置回 `message` |
| `id` | 值不含 NULL → 写入"最后事件 ID"（空值 = 重置为空，之后重连不带 `Last-Event-ID` 头）；派发后**不**重置 |
| `retry` | 纯 ASCII 数字 → 设为重连等待毫秒数；否则整行忽略 |
| 其他字段 | 忽略；字段名**大小写敏感**（`Data:` 算未知字段） |

### 行解析

| 行形态 | 处理 |
| --- | --- |
| 空行 | 派发累积的事件；数据缓冲为空则不派发（`event:` 独行不产生事件） |
| `: 开头` | 注释，忽略；惯用作保活心跳 |
| 含冒号 | 第一个冒号切分字段名 / 值；值的**一个**前导空格剥掉（`data:test` 等价 `data: test`） |
| 无冒号 | 整行为字段名、值为空串（裸 `id` 行即"重置最后事件 ID"） |

### 最小合法示例

```text
retry: 10000

: 心跳注释，客户端不可见

data: 普通消息

event: price
id: 42
data: {"symbol": "AAPL"}
data: {"line": 2}
```

最后一个块派发 `price` 事件，`e.data` 为两行 JSON 以 `\n` 拼接，`e.lastEventId` 为 `"42"`。

## 三、连接状态与重连语义

| 情形 | 处置 | readyState | 事件 |
| --- | --- | --- | --- |
| 响应通过校验 | 开始派发 | `OPEN` | `open` |
| 网络错误（掉线 / 超时 / 服务崩溃） | **自动重连**（等 retry 间隔，浏览器可叠加退避） | `CONNECTING` | `error`（每轮一次） |
| **响应正常结束**（服务器 end） | **自动重连**（一次性任务的重复触发陷阱） | `CONNECTING` | `error` |
| 状态码非 200（含 204 / 4xx / 5xx） | 致命失败，**永不重连** | `CLOSED` | `error` |
| `Content-Type` 非 `text/event-stream` | 致命失败 | `CLOSED` | `error` |
| 请求被中止 | 致命失败 | `CLOSED` | `error` |
| `close()` | 关闭 | `CLOSED` | 无 |

重连附带行为：readyState 先变 `CONNECTING` 并触发 `error` → 等待重连间隔（初始值实现自定、几秒量级；`retry:` 覆盖；连续失败可指数退避）→ 重发请求，"最后事件 ID"非空时自动带 `Last-Event-ID` 请求头。

## 四、服务端清单

### 响应头

| 响应头 | 值 | 说明 |
| --- | --- | --- |
| `Content-Type` | `text/event-stream` | **必须**；错了客户端致命失败 |
| `Cache-Control` | `no-cache` | 防中间层缓存攒响应（浏览器侧本就 `no-store`） |
| `Connection` | `keep-alive` | HTTP/1.1 长连接（HTTP/2 无此头概念） |
| `X-Accel-Buffering` | `no` | 让 Nginx 类反代关闭该响应的缓冲 |
| `Access-Control-Allow-Origin` (+ `-Credentials`) | 按需 | 跨域时必配；带 Cookie 须明确源 + `true` |

### 工程检查单

- 每约 **15 秒**一行 `: ping` 注释保活（防代理空闲超时）；客户端需要测活时改用真实事件（`event: ping` + `data:`）
- 事件带**单调递增 `id`** + 按 `Last-Event-ID` 补发（保留窗口 + 客户端幂等消费兜底）
- 一次性流的收尾策略：对重连请求回 **204** 拦停，或业务结束标记后由客户端 `close()`
- 生产部署启用 **HTTP/2**（绕开每域 6 连接红线）
- `text/event-stream` 路由**关闭代理缓冲**、慎用响应压缩
- 监听请求的 `close` 事件释放定时器与连接资源
- 调试：`curl -N http://host/events`（`-N` 关缓冲）裸看事件流

## 五、EventSource vs fetch 流式

| 维度 | EventSource | fetch + ReadableStream |
| --- | --- | --- |
| 请求方法 / 体 | 仅 GET、无体 | 任意 |
| 自定义请求头 | 不能（仅 `withCredentials`） | 任意（跨域非简单头触发预检） |
| SSE 解析 | 内建 | 手写或 eventsource-parser |
| 自动重连 + Last-Event-ID | 内建 | 全手写（退避、记账、分级重试） |
| 非 200 错误细节 | 不可读（干瘪 `error` 事件） | 状态码 + 响应体完整可读 |
| 取消 | `close()` | `AbortController` |
| 流结束语义 | 视为断线 → 自动重连 | `done` 即结束 |
| 连接状态 | `readyState` | 自己维护 |
| 典型场景 | 通知、行情、日志、进度（常驻订阅） | AI 流式生成、带认证头的一次性流 |

## 六、易错点清单

- **服务端加了 `event:`，客户端还挂 `onmessage`**：收不到——`onmessage` 只收无 `event:` 字段与 `event: message` 的消息。
- **MIME 忘设 `text/event-stream`**：立即 `error` 且**不重连**；`text/plain`、`application/json` 都是死刑。
- **以为 5xx 会自动重试**：非 200 一律致命失败（含 502 网关抖动）——生产需在 `onerror` 里对 `readyState === CLOSED` 自建带退避的重建逻辑。
- **把 SSE 端点当一次性接口**：响应正常结束也触发自动重连，任务被反复执行——回 204 拦停或客户端 `close()`。
- **`e.data` 当对象用**：永远是字符串，JSON 自己 parse。
- **期待多行 data 原样保留**：以 `\n` 拼接、末尾一个换行剥掉；`data:` 冒号后恰好一个空格被剥。
- **`retry: 5s` / `retry: 1_000`**：非纯 ASCII 数字整行忽略，重连间隔并没有改。
- **字段名写成 `Data:` / `EVENT:`**：大小写敏感，按未知字段忽略——流"看着对"但客户端毫无反应。
- **只发 `event: xxx` 不发 `data`**：空行到来时不派发任何事件——心跳事件至少带一行 `data:`。
- **拿注释行喂客户端看门狗**：`: ping` 不产生任何 JS 事件，只能骗过代理；客户端测活要真实事件。
- **不知道裸 `id` 行的副作用**：把"最后事件 ID"重置为空，之后重连不再带 `Last-Event-ID`。
- **等一个不存在的 close 事件**：`close()` 静默生效；结束通知要自己广播。
- **置 null 想断连**：挂监听器的实例被全局强引用，不 GC、不断连、掉线还自动重连——SPA 卸载钩子必须显式 `close()`。
- **多标签页 + HTTP/1.1**：每域 6 连接跨标签页累计，第 7 页整站挂起——上 HTTP/2 或 SharedWorker 共享。
- **Nginx 默认缓冲**：事件攒批到达、`open` 迟迟不来——`X-Accel-Buffering: no` / `proxy_buffering off`。
- **跨域带 Cookie 配了 `Access-Control-Allow-Origin: *`**：凭据模式下必须明确源 + `Access-Control-Allow-Credentials: true`。
- **长期 token 拼 URL**：落入访问日志与浏览器历史——先换短时效一次性 ticket 再开流。
- **fetch 手写解析不留残块缓冲**：事件块被网络分包劈开，随机丢消息或 `JSON.parse` 炸半截——`split` 后的末段必须留到下一轮。
- **手写 `TextDecoder` 忘了 `{ stream: true }`**：跨 chunk 的多字节字符解出乱码——或直接用 `TextDecoderStream`。
- **fetch 跨域手动带 `Last-Event-ID`**：自定义头触发 CORS 预检，服务端 `Access-Control-Allow-Headers` 要放行。

## 七、权威链接

- [MDN: Server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) —— 总览入口
- [MDN: Using server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) —— 官方使用指南（含六连接警告原文）
- [MDN: EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource) —— 接口参考
- [HTML Living Standard: Server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html) —— 规范原文（事件流 ABNF、解析与重连处理模型、作者注）
- [whatwg/html](https://github.com/whatwg/html) —— 标准仓库
- 站内：[网络章 SSE 协议页](/zh/base/network/net-realtime/guide-line/sse)（协议层与选型）｜ [Fetch API 叶](/zh/web-advanced/web-api/fetch/)（请求侧通用能力）
