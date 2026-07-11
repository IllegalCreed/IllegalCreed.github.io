---
layout: doc
outline: [2, 3]
---

# 重连机制与工程局限

> 基于 WHATWG HTML 现行标准（Server-sent events 章）· 核于 2026-07

## 速查

- **重连是内建默认行为**：连接断开后浏览器自动重发请求，零代码；每轮重连前 readyState 变 `CONNECTING` 并触发一次 `error`。
- **触发重连的两种情况**：网络层错误（掉线、超时、服务崩溃），以及**响应正常结束**（服务器主动 end）——后者常被忽视：SSE 端点"发完就关"会被浏览器无限重连。
- **触发致命失败（CLOSED、不再重连）**：请求被中止、状态码**非 200**（含 204 / 4xx / 5xx）、`Content-Type` 不是 `text/event-stream`；规范原文：一旦 fail 就**绝不**再重连。
- **规范钦点的停止信号**：**HTTP 204 No Content**——服务端想让客户端别再重连时返回它。
- **重连间隔**：初始值由浏览器实现自定（规范提示"几秒量级"）；`retry: 毫秒数` 字段覆盖；规范允许浏览器再叠加指数退避、等网络恢复，**不保证恰好等于 retry 值**。
- **`retry:` 只认纯 ASCII 数字**：其他写法（如 `retry: 5s`）整行忽略；一次设置对这条连接之后的所有重连生效。
- **lastEventId 记账**：消息带 `id:` 字段时其值写入连接的"最后事件 ID"并暴露为 `e.lastEventId`；之后的消息不带 `id:` 也沿用旧值。
- **Last-Event-ID 请求头**：重连时浏览器**自动**携带 `Last-Event-ID: 最后事件 ID`（值为空则不带）——服务端断点续推的唯一钩子。
- **重置钩子**：发送**空值 `id`**（裸 `id` 行或 `id:`）把最后事件 ID 重置为空，下次重连不再带头；ID 值不能含 NULL / 换行（含 NULL 整行忽略）。
- **断点续推设计**：服务端给事件编**单调递增 ID** + 保留近期事件窗口 + 收到 `Last-Event-ID` 从其后补发；补不了（太旧）就全量重推并让客户端幂等消费。
- **HTTP/1.1 六连接红线**：浏览器对每个域名的并发连接上限约 **6 条**，且按"**浏览器 + 域名**"计（跨标签页累计）——多开标签页 SSE 就把配额吃光，Chrome / Firefox 标记 **Won't fix**。
- **解法一 HTTP/2**：多路复用后并发流上限由双方协商（**默认 100**），六连接问题基本消失——生产部署 SSE 应默认上 HTTP/2。
- **解法二 SharedWorker**：多标签页共享一条 `EventSource`（规范作者注推荐的路线之一），一条物理连接广播给所有页面。
- **代理缓冲坑**：Nginx 等中间层默认缓冲响应 → 事件"攒批到达"甚至 `open` 都不来；`X-Accel-Buffering: no` / `proxy_buffering off`、对 `text/event-stream` 慎用压缩与分块干扰。
- **保活双保险**：服务端每约 15 秒一行 `: ping` 注释防代理掐线；客户端可加**看门狗**——超时没收到任何事件就 `close()` 重建，防"半开连接"假死（注意：注释行喂不了看门狗）。
- **认证是最大局限**：构造仅 `withCredentials`，**无法自定义任何请求头**——`Authorization: Bearer` 无门；只剩 Cookie（跨域要 CORS 凭据三件套）与 URL 短时效 ticket 两条路，都不行就换 [fetch 流式](./fetch-streaming-alternative)。
- **其他边界**：只能 GET、无请求体；纯文本 UTF-8；同 URL 的两个实例就是两条独立连接（不去重）。

## 一、重连状态机：什么时候重连、什么时候放弃

`EventSource` 对"连接结束"的处置分两类，规范用两个动词严格区分——**reestablish**（重连）与 **fail**（致命失败，此后绝不重连）：

| 情形 | 处置 | readyState | 事件 |
| --- | --- | --- | --- |
| 网络错误（掉线、DNS、超时、服务崩溃） | 重连 | `CONNECTING` | `error`（每轮一次） |
| **响应正常结束**（服务器 end 掉响应） | **重连** | `CONNECTING` | `error` |
| 响应状态码非 200（含 204 / 4xx / 5xx；重定向已在请求层跟随） | **致命失败** | `CLOSED` | `error` |
| `Content-Type` 不是 `text/event-stream` | 致命失败 | `CLOSED` | `error` |
| 请求被中止 | 致命失败 | `CLOSED` | `error` |
| 调用 `close()` | 关闭 | `CLOSED` | 无 |

两条最反直觉、也最重要：

1. **"正常结束"不算结束**。SSE 的世界观里响应就不该有尽头，服务器体面地写完收尾，浏览器照样判定"断线"、照样重连。后果：把 SSE 端点当一次性接口用（比如推完一轮 AI 生成就 end），浏览器会隔几秒再来一次，**服务端就被反复触发**。出口有两个——服务端在"没有更多数据"时对重连请求回 **204**（规范钦点的停止信号），或客户端收到业务上的结束标记后自己 `close()`。
2. **非 200 一律死刑，不只 204**。401、500、502 都会让 `EventSource` 直接 CLOSED——**它不会"过一会儿再试试"**。网关偶发一个 502 就能永久杀死页面的订阅，所以生产代码通常在 `onerror` 里检测 `readyState === CLOSED` 后自建"新建实例"的兜底重连（带退避），补齐这块短板。

```js
// 兜底：致命失败后延迟重建（浏览器内建重连只管非致命断线）
function subscribe(url, handlers, delay = 5000) {
  const es = new EventSource(url);
  Object.assign(es, handlers);
  es.onerror = () => {
    if (es.readyState === EventSource.CLOSED) {
      // 非 200 / MIME 错等致命场景：内建重连已放弃，自己起新实例
      setTimeout(() => subscribe(url, handlers, Math.min(delay * 2, 60000)), delay);
    }
    // CONNECTING 场景不用管：浏览器正在自动重连
  };
  return es;
}
```

## 二、retry: 字段与重连节奏

重连不是立刻发生：浏览器先等一段"重连时间"。这个值的来源与边界：

- **初始值**：实现自定，规范只说"大概几秒的量级"（Chrome / Firefox 实测约 3 秒上下，不应依赖具体值）；
- **服务端覆盖**：事件流里任意时刻发 `retry: 10000`（纯 ASCII 数字，单位毫秒），之后这条连接的重连等待就是 10 秒；非纯数字（`retry: 5s`、`retry: 1_000`）整行忽略；
- **浏览器有权加码**：规范明确允许在此之上叠加**指数退避**（连续失败时）或等待操作系统报告网络恢复——所以 `retry:` 是"建议值"，不是精确契约。

实践建议：把 `retry:` 作为流的第一段写出去（连上就发），让第一次意外断线就用你定的节奏；对"推送稀疏"的业务把值调大（省服务器），对"实时性敏感"的调小（1~3 秒）。

## 三、lastEventId 与 Last-Event-ID：断点续推的钩子

重连解决"连得上"，`Last-Event-ID` 解决"**不丢数据**"。机制全貌：

```text
服务器                                   浏览器
  │ id: 41 ↵ data: …  ────────────────────▶ 记住 41
  │ id: 42 ↵ data: …  ────────────────────▶ 记住 42
  ✕ 连接断开（网络抖动 / 服务重启 / 代理掐线）
  │                          等待 retry 间隔（可退避）
  │ ◀──────── GET /events
  │           Last-Event-ID: 42 ──────────  自动带上，零代码
  │ 从 43 开始补发 ────────────────────────▶ 无缝续上
```

逐条规则（规范核实）：

- `id:` 字段的值写入连接的"最后事件 ID"，并在**之后每个**消息事件上以 `e.lastEventId` 可见（本条没带 `id:` 也沿用旧值）；
- 重连时浏览器**自动**在请求头带 `Last-Event-ID`；最后事件 ID 为空字符串时**不带**这个头；
- **空值 `id` 行**（裸 `id` 或 `id:`）把最后事件 ID 重置为空——服务端可借此宣告"之前的进度作废"；
- ID 值本质是任意 UTF-8 字符串，但不能含 NULL（含 NULL 整行忽略）、不可能含换行（行式协议切不出来）；
- `Last-Event-ID` 只在**浏览器内建重连**时发送——第一次连接没有；页面刷新后也没有（"最后事件 ID"是连接对象的内存状态，不落盘）。想跨页面生命周期续推，得自己把进度存 localStorage 并拼进 URL。

## 四、断点续推的服务端设计

`Last-Event-ID` 只是钩子，续推能力要服务端配合设计。最小骨架：

```js
// 环形缓冲保留最近 1000 条，支撑断线窗口内的补发
const buffer = []; // 元素形如 { id, data }
let nextId = 1;

function publish(data) {
  const item = { id: nextId++, data };
  buffer.push(item);
  if (buffer.length > 1000) buffer.shift();
  for (const res of clients) send(res, item); // 推给所有在线连接
}

function onSSERequest(req, res) {
  // ……SSE 响应头三件套，略（见入门页）……
  const last = Number(req.headers["last-event-id"]); // 浏览器重连自动带来
  if (Number.isFinite(last)) {
    // 补发断线期间漏掉的事件
    for (const item of buffer) if (item.id > last) send(res, item);
  }
  clients.add(res);
  req.on("close", () => clients.delete(res));
}

function send(res, { id, data }) {
  res.write(`id: ${id}\ndata: ${JSON.stringify(data)}\n\n`);
}
```

设计清单：

- **ID 单调递增**（数字或可比较的游标），"从某点之后"才有意义；
- **保留窗口有限**：断线太久、`Last-Event-ID` 已滑出窗口时，退化为全量重推 + 客户端**幂等消费**（按业务主键去重），别硬保证不重不漏；
- **多实例部署**要把事件缓冲放共享存储（Redis Stream 一类），否则重连落到另一台实例上无从补发；
- 事件本身尽量**自包含**（带完整状态或带主键的增量），让"重复收到"无害。

## 五、HTTP/1.1 六连接红线与 HTTP/2

MDN 在 `EventSource` 文档里用加粗警告标注的坑：**不经 HTTP/2 时，浏览器对每个域名的并发连接上限约 6 条，且这个配额按"浏览器 + 域名"计、跨标签页累计**。用户开 6 个标签页、每页挂一条 SSE，第 7 个标签页的 SSE（以及同域的一切请求）就会排队挂起——现象是"新标签页整个网站卡死"。Chrome 与 Firefox 对此明确标记 **Won't fix**。

两条正解：

1. **上 HTTP/2**（治本）：多路复用让同域所有 SSE 共享一条 TCP 连接，并发流上限由服务器与客户端协商，**默认 100**——部署层启用 HTTP/2 后此问题基本消失。这也是生产环境跑 SSE 的默认前提。
2. **SharedWorker 共享连接**（治标也治费）：规范作者注给出的路线——多标签页共用一条物理连接，还顺带省了服务器的连接数：

```js
// shared-worker.js —— 所有同源标签页共享这一条 SSE 连接
const ports = [];
const es = new EventSource("/events");
es.onmessage = (e) => ports.forEach((p) => p.postMessage(e.data));

onconnect = (evt) => {
  const port = evt.ports[0];
  ports.push(port);
  port.start();
};
```

```js
// 页面侧：从 SharedWorker 取数据，而不是自己开 EventSource
const worker = new SharedWorker("/shared-worker.js");
worker.port.onmessage = (e) => render(e.data);
```

## 六、代理缓冲坑与保活

SSE 的实时性依赖"每个事件立即冲到客户端"，而 HTTP 链路上的每一层都可能在攒缓冲。协议侧原理[网络章](/zh/base/network/net-realtime/guide-line/sse)已展开，这里只留**浏览器侧症状 → 排查**视角：

| 症状（浏览器侧） | 高概率原因 | 处理 |
| --- | --- | --- |
| `open` 迟迟不触发 | 中间层在攒响应头/首包 | 关闭该路由的代理缓冲：Nginx 加响应头 `X-Accel-Buffering: no` 或配置 `proxy_buffering off` |
| 事件成批延迟到达 | 代理 / 压缩层缓冲 | 同上；`text/event-stream` 路由禁用响应压缩，或确认压缩层支持逐块 flush |
| 每隔固定几十秒断一次（然后自动重连） | 代理空闲超时掐线 | 服务端每约 15 秒发一行 `: ping` 注释（规范作者注的经典建议） |
| 断了但 `error` 不来、数据也不来 | **半开连接**：对端悄悄消失，TCP 没收到 FIN | 客户端看门狗：超时无事件就 `close()` 重建（见下） |

看门狗有一个协议层的暗礁：**注释行心跳（`: ping`）对客户端 JS 完全不可见**——它救得了代理超时，喂不了看门狗。要让客户端能测活，服务端心跳得用真实事件：

```js
// 服务端：心跳用真实事件而非注释，客户端才能感知
setInterval(() => res.write("event: ping\ndata: 1\n\n"), 15000);
```

```js
// 客户端看门狗：40 秒没有任何事件（业务或 ping）就重建，防半开假死
let es, watchdog;
function connect() {
  es?.close();
  es = new EventSource("/events");
  const feed = () => {
    clearTimeout(watchdog);
    watchdog = setTimeout(connect, 40000); // 超时阈值 > 心跳间隔 × 2
  };
  feed();
  es.onmessage = (e) => { feed(); render(e.data); };
  es.addEventListener("ping", feed);
  es.onerror = feed; // 正在自动重连时别误杀
}
connect();
```

## 七、认证局限：无法自定义请求头

`EventSource` 构造函数的选项字典只有 `withCredentials` 一项——**没有任何塞自定义请求头的入口**，`Authorization: Bearer xxx` 这种现代 API 的标配认证方式直接无门。可选的出路只有两条：

**出路一：Cookie**。同源自动携带、零配置；跨域要凑齐三件套（`withCredentials: true` + 服务端明确 `Access-Control-Allow-Origin` + `Access-Control-Allow-Credentials: true`），跨站 Cookie 还需 `SameSite=None; Secure`。适合"本来就用 Cookie 会话"的传统架构。

**出路二：URL 携带短时效 ticket**。长期 token 直接拼 URL 会落入服务器访问日志、代理日志与浏览器历史，风险不可接受；正确姿势是**先用正经带 `Authorization` 的请求换一张一次性短票，再拿票开流**：

```js
// 1. 用带认证头的普通请求换短时效 ticket（如 60 秒有效、一次性）
const { ticket } = await (
  await fetch("/api/sse-ticket", {
    headers: { Authorization: `Bearer ${token}` },
  })
).json();

// 2. ticket 拼进 URL 开流——即使进了日志，票也早已失效
const es = new EventSource(`/events?ticket=${encodeURIComponent(ticket)}`);
```

两条都嫌绕、或后端就是只认 `Authorization` 头？那就是 `EventSource` 的能力边界到了——**换 fetch 流式读取**，自定义头、POST、精细重连全部解锁，代价是把浏览器白送的解析与重连自己造一遍：[fetch 流式替代方案](./fetch-streaming-alternative)。
