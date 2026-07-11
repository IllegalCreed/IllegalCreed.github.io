---
layout: doc
outline: [2, 3]
---

# EventSource API 全解

> 基于 WHATWG HTML 现行标准（Server-sent events 章）· 核于 2026-07

## 速查

- **接口全貌**：构造 `new EventSource(url, { withCredentials? })` + 只读属性 `url` / `withCredentials` / `readyState` + 方法 `close()` + 事件 `open` / `message` / `error`（外加任意命名事件）——这就是全部 API 面。
- **构造**：URL 可用相对路径（按当前文档解析）；非法 URL 抛 `SyntaxError`；选项字典只有 `withCredentials` 一项，默认 `false`。
- **请求语义**：固定 GET、无请求体；缓存模式固定 `no-store`（不走 HTTP 缓存）；浏览器可能自动带 `Accept: text/event-stream`；301/307 重定向照常跟随；**请求头无法自定义**。
- **跨域**：默认不带凭据（跨域请求不带 Cookie）；`withCredentials: true` 时凭据模式为 include，服务端须 `Access-Control-Allow-Credentials: true` 且 `Access-Control-Allow-Origin` 指明确来源（不能 `*`）。
- **readyState 三态**：`EventSource.CONNECTING`（0，首连或重连等待中）、`OPEN`（1，已连通派发中）、`CLOSED`（2，致命失败或已 close，不再重连）。
- **open 事件**：响应通过校验（200 + `text/event-stream`）时触发，readyState 变为 OPEN；每次重连成功都会再触发。
- **error 事件双语义**：进入重连流程（此刻 readyState 为 CONNECTING）与致命失败（此刻为 CLOSED）都触发 `error`，事件对象本身几乎无信息——**靠 readyState 区分**。
- **onmessage 只收两种消息**：无 `event:` 字段的消息 + `event: message` 的消息；**其他命名事件不会派发给它**。
- **命名事件**：服务器写 `event: xxx` → 客户端 `es.addEventListener("xxx", handler)`；避开 `open` / `error` 这类保留名，混在同一 target 上难分辨。
- **MessageEvent 三件**：`e.data`（字符串）、`e.lastEventId`（最近一次 `id:` 的值，未再设置则沿用）、`e.origin`（事件流最终 URL 的源，安全校验用）。
- **`data:` 字段**：多条连续 `data:` 行以 `\n` 拼接、末尾一个换行剥掉；`data` 永远是字符串，JSON 自己 parse。
- **`id:` 字段**：更新连接的"最后事件 ID"（重连回传凭据）；**空值 `id` 行把它重置为空**；值含 NULL 字符则整行忽略；派发后不清空、持续沿用。
- **`retry:` 字段**：重连等待毫秒数，值必须纯 ASCII 数字否则忽略；对之后的所有重连生效。
- **解析边界**：字段名**大小写敏感**（`Data:` 按未知字段忽略）；冒号后**恰好一个空格**被剥掉；无冒号的行整行当字段名、值为空；未知字段一律忽略。
- **空 data 不派发**：一个块里只有 `event:` / `id:` / `retry:` 而没有任何 `data` 行，空行到来时**不派发事件**（id / retry 的副作用照常生效）。
- **注释与心跳**：冒号开头的行整行忽略、不产生任何客户端事件；惯例每 15 秒左右发一条 `: ping` 防代理掐线。
- **close() 语义**：中止连接、readyState 置 CLOSED；幂等；**没有 close 事件**。
- **GC 规则**：挂着监听器的实例被全局对象强引用——**置 null 不断连、不回收**，组件销毁必须显式 `close()`。

## 一、接口全貌

`EventSource` 继承自 `EventTarget`，暴露在 Window 与 Worker 全局。全部成员一屏放得下：

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `new EventSource(url, options?)` | 构造函数 | `options` 仅 `{ withCredentials: boolean }`；URL 非法抛 `SyntaxError` |
| `url` | 只读字符串 | 解析后的绝对 URL |
| `withCredentials` | 只读布尔 | 构造时定死，默认 `false` |
| `readyState` | 只读数字 | 0 / 1 / 2，类上有同名常量 `CONNECTING` / `OPEN` / `CLOSED` |
| `close()` | 方法 | 中止连接并置 CLOSED；幂等；无事件通知 |
| `open` / `message` / `error` | 事件 | 也可用 `onopen` / `onmessage` / `onerror` 属性挂 |
| 任意命名事件 | 事件 | 服务器 `event: xxx` 对应 `addEventListener("xxx")` |

两个内部状态值得知道但**没有**读取入口：重连间隔（`retry:` 设置的值）与"最后事件 ID"（`id:` 设置的值）都存在对象内部，前者完全不可见，后者只能通过每个消息事件的 `e.lastEventId` 间接观察。

## 二、构造函数与请求语义

```js
// 相对 URL：按当前文档地址解析
const es1 = new EventSource("/api/events");

// 跨域 + 带 Cookie
const es2 = new EventSource("https://api.example.com/events", {
  withCredentials: true,
});

new EventSource("http://[非法 URL"); // 抛 SyntaxError
```

构造即发起连接，没有"先建对象再手动 connect"的阶段。这条请求的固定特征（规范逐条规定，作者无法更改）：

- **方法固定 GET，无请求体**——参数只能拼进 URL query；
- **缓存模式固定 `no-store`**——事件流永不命中 HTTP 缓存（服务端仍建议 `Cache-Control: no-cache` 防中间层）；
- **浏览器可能自动附带 `Accept: text/event-stream`**（Chrome / Firefox 实际会带）；
- **301 / 307 重定向照常跟随**；
- **请求头没有任何自定义入口**——这是 `EventSource` 最大的工程局限，展开见[重连与局限页](./reconnect-and-limits)。

### withCredentials 与跨域

`EventSource` 请求走 CORS 模型：

- **同源**：Cookie 照常携带，无需任何配置；
- **跨域默认（`withCredentials` 缺省）**：请求不带 Cookie，服务端回 `Access-Control-Allow-Origin: *` 或明确源即可；
- **跨域带凭据（`withCredentials: true`）**：请求带 Cookie，服务端必须同时满足——`Access-Control-Allow-Origin` 写**明确来源**（不能 `*`）、`Access-Control-Allow-Credentials: true`；跨站 Cookie 本身还需 `SameSite=None; Secure`。

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
```

## 三、readyState 与三个连接事件

连接的状态流转一张表说清：

| 时机 | readyState | 触发事件 |
| --- | --- | --- |
| 构造之初 | `CONNECTING`（0） | — |
| 响应通过校验（200 + 正确 MIME） | `OPEN`（1） | `open` |
| 断线进入重连等待 | `CONNECTING`（0） | `error`（每轮重连一次） |
| 致命失败（非 200 / MIME 错 / 请求被中止） | `CLOSED`（2） | `error` |
| 调用 `close()` | `CLOSED`（2） | 无 |

关键在 **`error` 的双语义**：它既在"掉线了、我正准备重连"时触发，也在"彻底放弃"时触发，且事件对象上几乎没有可用信息（规范因此专门建议浏览器在 DevTools 里补充诊断细节）。标准判别姿势：

```js
es.onerror = () => {
  if (es.readyState === EventSource.CONNECTING) {
    // 浏览器已接管：等待 retry 间隔后自动重连，无需人工干预
    showBanner("连接波动，恢复中…");
  } else if (es.readyState === EventSource.CLOSED) {
    // 非 200 / MIME 错误 / 请求被中止：浏览器已死心，要重来只能 new 一个
    showBanner("连接已断开");
  }
};
```

`open` 在**每次**成功建立连接时都触发（含重连成功），适合用来消除上面挂出的横幅。

## 四、onmessage 与命名事件

事件流里的 `event:` 字段决定消息派发给谁。服务器发出：

```text
data: 无类型消息

event: price
data: {"symbol": "AAPL", "price": 211.5}

event: message
data: 显式写 event: message 的消息
```

客户端对应的接收方：

```js
const es = new EventSource("/events");

// 第 1、3 条到这里：onmessage 收"无 event: 字段"与"event: message"两种
es.onmessage = (e) => console.log("message:", e.data);

// 第 2 条只到这里：命名事件必须 addEventListener 监听
es.addEventListener("price", (e) => {
  const quote = JSON.parse(e.data); // data 永远是字符串
  console.log(quote.symbol, quote.price);
});
```

三条精确语义（MDN 明确口径）：

1. `onmessage`（等价于 `addEventListener("message")`）只接收**没有 `event:` 字段**的消息和 **`event: message`** 的消息；
2. 任何其他命名事件**不会**触发 `onmessage`——"服务端加了 `event:`、客户端还挂在 `onmessage` 上"是"收不到消息"的第一嫌疑；
3. 事件类型可以是任意字符串，但**避开 `open` / `error`**：`event: error` 会和连接错误事件混在同一个 target 上（业务消息是带 `data` 的 `MessageEvent`，连接错误是普通 `Event`，虽可用 `"data" in e` 区分，但徒增心智负担）。

## 五、MessageEvent：data、lastEventId、origin

`message` 与所有命名事件的事件对象都是 `MessageEvent`，三个字段有用：

| 属性 | 含义 |
| --- | --- |
| `data` | 消息内容，**永远是字符串**（多行 `data:` 已按 `\n` 拼好） |
| `lastEventId` | 连接当前的"最后事件 ID"：最近一次 `id:` 字段的值；本条消息没带 `id:` 时**沿用旧值** |
| `origin` | 事件流最终 URL（重定向后）的源 |

`origin` 的用途是防御性校验——事件流 URL 可能经重定向落到别处，处理敏感指令前核对来源：

```js
es.onmessage = (e) => {
  if (e.origin !== "https://api.example.com") return; // 来源不对，丢弃
  applyUpdate(JSON.parse(e.data));
};
```

## 六、事件流格式与解析规则

`EventSource` 之所以"零解析成本"，是因为浏览器内置了一套严格定义的行式解析器。**写服务端**时必须按它的规则产出。

### 6.1 四个字段

事件流是 UTF-8 纯文本，每行 `字段名: 值`，**空行**（连续两个换行）宣告一个事件完整、触发派发：

| 字段 | 语义 |
| --- | --- |
| `data:` | 值追加进数据缓冲并补一个换行；派发时剥掉末尾一个换行 → **多条 `data:` 行以 `\n` 拼接** |
| `event:` | 设置本次事件类型；派发后清空回默认的 `message` |
| `id:` | 值不含 NULL 时写入"最后事件 ID"（**空值 = 重置为空**）；派发后**不**清空、持续沿用 |
| `retry:` | 值为纯 ASCII 数字时设为重连等待毫秒数；否则整行忽略 |
| 其他 | 一律忽略（向前兼容）；字段名**大小写敏感**，`Data:` / `EVENT:` 都算"其他" |

### 6.2 行级解析规则

| 行形态 | 处理 |
| --- | --- |
| 空行 | 派发当前累积的事件；若数据缓冲为空则**不派发**，仅清空缓冲 |
| 以冒号开头 | 注释，整行忽略（不产生任何客户端事件） |
| 含冒号 | 第一个冒号前为字段名、后为值；值若以一个空格开头则剥掉**这一个**空格 |
| 不含冒号 | 整行是字段名，值为空字符串（裸 `data` 行 = 追加空串加换行） |

补充边界（规范原文逐条核实）：

- 行尾 CRLF / LF / CR 三种都合法；流开头的一个 BOM 会被剥掉；
- **编码只能 UTF-8**，没有声明其他字符集的机制；
- `data:test` 与 `data: test` 等价（冒号后一个空格被剥），`data:  两个空格` 则保留一个前导空格；
- 流在半途断掉时，**未以空行收尾的残块整体丢弃**、不派发不完整事件。

### 6.3 一段演示流

用 Node 写一段"每种规则各来一下"的流（任何能持续写响应的框架同理）：

```js
// 假设 res 已按 SSE 三件套 writeHead（见入门页完整示例）
res.write(": 已连接，这行是注释，客户端完全看不到\n\n");

res.write("retry: 10000\n\n"); // 无事件产生，但之后的重连间隔改为 10 秒

res.write("data: 你好\n\n"); // → onmessage，e.data === "你好"

res.write("data: 第一行\ndata: 第二行\n\n"); // → e.data === "第一行\n第二行"

res.write(`event: price\nid: 42\ndata: {"symbol": "AAPL"}\n\n`);
// → addEventListener("price") 收到，e.lastEventId === "42"

res.write("data: 这条没带 id\n\n"); // → e.lastEventId 仍是 "42"（沿用）

res.write("id\ndata: 上一行把最后事件 ID 重置为空\n\n"); // → e.lastEventId === ""

res.write("event: ping\n\n"); // 没有 data → 空行到来时不派发任何事件
```

最后一行是高频误解：**只有 `event:` 没有 `data` 的块不产生事件**——想发"空心跳事件"至少给一行 `data:`（哪怕值为空）。

## 七、注释行与心跳

以冒号开头的行是协议级注释，浏览器解析器直接丢弃。它的实际用途是**保活**：旧代理、负载均衡器常把"一段时间没有字节流动"的连接掐掉，规范作者注建议**每 15 秒左右发一行注释**：

```js
const heartbeat = setInterval(() => res.write(": ping\n\n"), 15000);
req.on("close", () => clearInterval(heartbeat));
```

必须想清楚的一点：**注释对客户端 JS 完全不可见**——不触发 `onmessage`、不触发任何事件。所以它能骗过代理，却喂不了客户端的"看门狗"（超时检测）；想让客户端也感知心跳，得发真实事件（如 `event: ping` + `data:` 行），取舍见[重连与局限页](./reconnect-and-limits)。

## 八、close() 与生命周期管理

`close()` 中止当前连接（以及重连计划），把 readyState 置为 `CLOSED`；对已关闭的实例调用没有任何效果。两个容易踩的点：

- **没有 close 事件**——`close()` 静默生效，`error` 也不会触发；需要通知别处"订阅结束了"得自己广播；
- **CLOSED 是终态**——关掉的实例无法复用，重新订阅只能 `new` 一个新的。

更隐蔽的是垃圾回收规则。规范明确要求：只要实例处于 CONNECTING 且挂有 `open` / `message` / `error` 任一监听器，或处于 OPEN 且挂有 `message` / `error` 监听器，全局对象就**强引用**它——也就是说：

```js
let es = new EventSource("/events");
es.onmessage = handle;
es = null; // 连接不会断！实例不会被回收，后台继续接收、掉线继续重连
```

**把变量置 null 不是关闭**。唯一正确姿势是显式 `close()`，SPA 里挂到组件卸载钩子：

```js
// Vue 3 组件内的标准生命周期管理
let es;
onMounted(() => {
  es = new EventSource("/api/events");
  es.onmessage = (e) => items.value.push(JSON.parse(e.data));
});
onUnmounted(() => es?.close()); // 不关就是一条常驻后台、断线还自动重连的"幽灵订阅"
```

浏览器只在 Document 永久销毁（关标签页、整页跳转）时才强制关闭页面上的 `EventSource`——SPA 路由切换不算，全靠你自觉。

API 面到此铺完。`EventSource` 真正的深水区在连接的"生死"上——什么情况重连、什么情况放弃、断点怎么续、连接数怎么省：[重连机制与工程局限](./reconnect-and-limits)。
