---
layout: doc
outline: [2, 3]
---

# API 全解：构造、状态、收发与关闭

> 基于 WHATWG WebSockets 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **构造签名**：`new WebSocket(url[, protocols])`——构造即发起连接，返回 `CONNECTING` 态实例，不阻塞。
- **URL scheme**：接受 `ws` / `wss`；2024 起也接受 `http` / `https`（自动升为 `ws` / `wss`）与相对 URL；带 `#fragment` 或非法 scheme 抛 `SyntaxError`。
- **protocols 第二参**：字符串或字符串数组，按偏好排序；值取自 IANA 子协议注册表或双方自定义名；**同一连接最终只会选中一个**。
- **子协议 API 侧**：握手完成后读只读属性 `ws.protocol` 得服务端选中的那个（未选中则为空串）；协商机制本身见[网络章](/zh/base/network/net-realtime/guide-line/websocket-practice)。
- **不能自定义握手头**：浏览器侧连 `Authorization` / `Sec-*` 都设不了——这是硬约束，鉴权路线（Cookie / ticket / 子协议夹带）见[网络章](/zh/base/network/net-realtime/guide-line/websocket-practice)。
- **readyState 四态**：`CONNECTING(0)` / `OPEN(1)` / `CLOSING(2)` / `CLOSED(3)`，只读；常量挂在 `WebSocket` 类与实例上。
- **send 五类型**：`string`（UTF-8 文本帧）+ `ArrayBuffer` / `Blob` / `TypedArray` / `DataView`（二进制帧）。
- **send 异常与静默**：`CONNECTING` 态调用抛 `InvalidStateError`；`CLOSING` / `CLOSED` 态调用**静默丢弃**、不报错；缓冲满到发不出去时连接被自动关闭。
- **send 是异步**：只入本地缓冲即返回，不等真正发出；进度看 `bufferedAmount`。
- **close 签名**：`close([code[, reason]])`；不传 `code` 默认按 `1000` 正常关闭。
- **close 合法码**：`code` **只能 `1000` 或 `3000`–`4999`**，其余抛 `InvalidAccessError`；`reason` UTF-8 编码后 ≤ 123 字节，超出抛 `SyntaxError`。
- **close 是优雅关闭**：发起关闭握手，且**不丢弃已排队的消息**——会等它们发完再走关闭握手；对已 `CLOSED` 连接调用是空操作。
- **MessageEvent 关键**：`data`（`string` 或二进制，取决于帧类型与 `binaryType`）、`origin`、`lastEventId`（WS 恒空）。
- **CloseEvent 三件**：`code`（收到的关闭码）/ `reason`（UTF-8 文本）/ `wasClean`（是否走完关闭握手）；`1006` = 无 Close 帧的异常断开，**你无法用 `close()` 主动设它**。
- **error 无细节**：`error` 事件对象不含错误信息（安全设计），且 `error` 后必跟 `close`——诊断看 `CloseEvent`。
- **只读属性一览**：`url` / `protocol` / `extensions` / `readyState` / `bufferedAmount`；可写仅 `binaryType`。

## 一、构造：`new WebSocket(url[, protocols])`

构造函数**即发起连接**——它同步返回一个 `readyState` 为 `CONNECTING` 的实例，握手在后台进行，成功后触发 `open`：

```js
// 第一参：URL；第二参：可选的子协议（字符串或数组）
const ws = new WebSocket("wss://example.com/chat", ["v2.chat", "v1.chat"]);
console.log(ws.readyState); // 0 = CONNECTING（构造后立即读）
```

### URL 约束

`url` 的解析规则（构造时校验，违反抛 `SyntaxError`）：

| 规则 | 说明 |
| --- | --- |
| scheme 白名单 | `ws` / `wss`，以及 2024 起新增的 `http` / `https`（自动升级为 `ws` / `wss`） |
| 相对 URL | 允许，按当前脚本的 base URL 解析（2024 起的新基线） |
| 禁止 fragment | URL 不能带 `#...`，否则 `SyntaxError` |
| 非法 scheme | 除白名单外的 scheme（如 `ftp`）抛 `SyntaxError` |

::: tip 混合内容不是构造异常
HTTPS 页面里发起明文 `ws://` 连接会被浏览器按「混合内容」拦截——但这**不是构造函数抛的异常**，而是连接建立失败，走 `error` → `close`。生产环境一律 `wss://`（原因见[网络章](/zh/base/network/net-realtime/guide-line/websocket-protocol)）。
:::

### 子协议：API 侧只有「传数组 + 读属性」

第二参 `protocols` 是**声明客户端能接受哪些子协议**，按偏好排序：

```js
const ws = new WebSocket("wss://host/ws", ["v2.chat.example.com", "v1.chat.example.com"]);
ws.onopen = () => {
  // 握手完成后，protocol 属性是服务端从上面选中的那一个
  console.log("服务端选中的子协议:", ws.protocol); // 如 "v2.chat.example.com"
};
```

- 数组里的值不能重复、且要符合 `Sec-WebSocket-Protocol` 头的格式，否则构造抛 `SyntaxError`。
- **同一连接最终只会有一个子协议被选中**；服务端可以一个都不选，此时 `ws.protocol` 为空串。
- 至于「服务端怎么从数组里挑、用它协商消息格式 / 版本、命名防冲突」——那是协商**机制**，属工程策略，见[网络章](/zh/base/network/net-realtime/guide-line/websocket-practice)。本叶只关心 API 面：**传什么、读什么**。

::: warning 浏览器不能自定义握手头
`WebSocket` 构造函数**没有传自定义请求头的入口**——`Authorization`、任意 `Sec-*` 头都设不了。这是浏览器安全模型的硬约束。因此浏览器侧鉴权只能走 Cookie（同源自动带）、URL query 短时效 ticket、或把 token 塞进 `Sec-WebSocket-Protocol` 夹带——这些路线的取舍见[网络章鉴权小节](/zh/base/network/net-realtime/guide-line/websocket-practice)。（Node / 移动原生客户端不受此限，可自由设头。）
:::

## 二、readyState：四个状态，不可逆流动

`readyState` 是只读数字，取四个常量之一。与 `EventSource` 的三态相比，**WebSocket 多了一个 `CLOSING`**（关闭握手进行中）：

| 常量 | 值 | 含义 |
| --- | --- | --- |
| `WebSocket.CONNECTING` | `0` | 连接尚未建立（构造后的初始态） |
| `WebSocket.OPEN` | `1` | 连接已就绪，可收发 |
| `WebSocket.CLOSING` | `2` | 关闭握手已发起，尚未完成 |
| `WebSocket.CLOSED` | `3` | 连接已关闭或从未成功建立 |

```js
// 常量既挂在类上，也挂在实例上，两种写法等价
if (ws.readyState === WebSocket.OPEN) ws.send("safe to send");
if (ws.readyState === ws.OPEN) ws.send("same thing");
```

状态**单向流动、不可逆**：`CONNECTING → OPEN → CLOSING → CLOSED`（握手失败则从 `CONNECTING` 直接到 `CLOSED`）。走到 `CLOSED` 的实例作废，**要重连必须 `new` 一个新的**——这与 `EventSource` 自带重连、SSE 实例可长期存活截然不同。

## 三、send()：一个方法，五种数据

`send(data)` 把数据排入本地发送缓冲，**立即返回**（异步，不等真正发出）。它接受五种数据，分文本帧与二进制帧两类：

```js
ws.onopen = () => {
  ws.send("纯文本"); // string → UTF-8 文本帧
  ws.send(JSON.stringify({ type: "chat", body: "hi" })); // JSON 也是文本帧

  const buf = new ArrayBuffer(8);
  ws.send(buf); // ArrayBuffer → 二进制帧

  ws.send(new Uint8Array([1, 2, 3])); // TypedArray → 二进制帧
  ws.send(new DataView(buf)); // DataView → 二进制帧

  const blob = new Blob([new Uint8Array([0xff])]);
  ws.send(blob); // Blob → 二进制帧（Blob.type 被忽略）
};
```

| 数据类型 | 帧类型 | 说明 |
| --- | --- | --- |
| `string` | 文本帧 | 以 UTF-8 编码入缓冲；`bufferedAmount` 按 UTF-8 字节数增加 |
| `ArrayBuffer` | 二进制帧 | 原始字节入缓冲 |
| `TypedArray`（`Uint8Array` 等） | 二进制帧 | 视图指向的字节入缓冲 |
| `DataView` | 二进制帧 | 同上 |
| `Blob` | 二进制帧 | 排入 Blob 的原始数据，`Blob.type` 被忽略 |

### send 的时机与异常

`send()` 对连接状态**非常敏感**：

| 调用时的 readyState | 结果 |
| --- | --- |
| `CONNECTING(0)` | **抛 `InvalidStateError`**——最常见的新手错误：`new` 完立刻 `send`。必须等 `open` |
| `OPEN(1)` | 正常入缓冲发送 |
| `CLOSING(2)` / `CLOSED(3)` | **静默丢弃**，既不发送也不报错——排查「消息神秘丢失」的第一嫌疑 |

::: warning 缓冲满会自动关闭连接
如果数据无法被发送——比如需要缓冲但缓冲已满——**浏览器会自动关闭连接**。这就是为什么发大量数据前要看 `bufferedAmount`、做发送节流（详见[二进制与背压页](./guide-line/binary-backpressure)）。
:::

## 四、close()：优雅关闭与合法码

`close([code[, reason]])` 发起**关闭握手**，把状态推向 `CLOSING` → `CLOSED`，完成后触发 `close`：

```js
ws.close(); // 不传参 → 默认按 1000（正常关闭）
ws.close(1000, "user logout"); // 带码带原因（推荐成对给）
ws.close(4001, "session expired"); // 应用私有码（3000–4999）
```

### code：只有两种合法输入

这是 `close()` 最容易踩的 API 约束——**你能主动传的 `code` 只有两类**：

| code 取值 | 结果 |
| --- | --- |
| `1000` | 合法：正常关闭 |
| `3000`–`4999` | 合法：`3000`–`3999` 供库 / 框架 / 应用（IANA 注册），`4000`–`4999` 私有约定 |
| 其他任意整数（含 `1001`–`1015`、`0`–`999`） | **抛 `InvalidAccessError`** |

也就是说，像 `1001`（Going Away）、`1011`（Internal Error）这些**协议保留码，浏览器 JS 不允许你手动传给 `close()`**——它们只能由浏览器 / 服务端在协议层产生，你在 `CloseEvent.code` 里**读得到**、却**写不进**。

### reason：≤ 123 字节

```js
// reason 会被 UTF-8 编码，编码后字节数不能超过 123
ws.close(1000, "再见"); // "再见" 两个汉字 = 6 字节，OK
```

- `reason` UTF-8 编码后**超过 123 字节抛 `SyntaxError`**。
- 注意非 ASCII 字符每个占 2–4 字节，123 个中文字符早就超限——按**字节**而非字符数算。

### close 的两条行为约定

- **不丢已排队的消息**：`close()` 不会丢弃之前 `send()` 但尚未发出的消息——关闭握手会等它们发完才开始。想「立刻硬断」浏览器侧没有直接手段。
- **对已关闭连接是空操作**：连接已是 `CLOSED` 时再调 `close()` 什么都不做（幂等），不报错。

## 五、事件对象细节

### MessageEvent（`message` 事件）

| 属性 | 说明 |
| --- | --- |
| `data` | 消息内容：文本帧 → `string`；二进制帧 → `Blob` 或 `ArrayBuffer`（取决于 `binaryType`，详见[二进制页](./guide-line/binary-backpressure)） |
| `origin` | 消息来源的源；敏感操作前可校验 |
| `lastEventId` | WebSocket 场景**恒为空串**（这属性是 SSE 用的，WS 上无意义） |

```js
ws.onmessage = (e) => {
  if (typeof e.data === "string") {
    const msg = JSON.parse(e.data); // 文本：通常是 JSON，自己 parse
  } else {
    // 二进制：Blob（默认）或 ArrayBuffer（若设了 binaryType）
  }
};
```

### CloseEvent（`close` 事件）

`CloseEvent` 是排错的核心信息源，三个关键属性：

| 属性 | 说明 |
| --- | --- |
| `code` | 收到的关闭码（`1000` 正常、`1006` 异常无 Close 帧、`1011` 服务端错误……语义见[网络章](/zh/base/network/net-realtime/guide-line/websocket-practice)） |
| `reason` | 服务端给的人类可读原因（UTF-8 字符串，可能为空） |
| `wasClean` | 是否走完了关闭握手——`true` = 双方正常挥手，`false` = 连接被硬断（典型伴随 `code=1006`） |

```js
ws.onclose = (e) => {
  if (e.wasClean) {
    console.log(`正常关闭 code=${e.code} reason=${e.reason}`);
  } else {
    // wasClean=false 且 code=1006：网络异常断开，是「该重连」的判据
    console.log("异常断开，考虑重连");
  }
};
```

::: info 1006 你读得到、写不进
`1006`（Abnormal Closure）表示「连接异常断开、没收到 Close 帧」。它是**浏览器在 `CloseEvent` 里合成**给你的信号——**你无法用 `close(1006)` 主动产生它**（会抛 `InvalidAccessError`）。同理 `1005`（无状态码）、`1015`（TLS 失败）也都是只读不可写的保留码。
:::

### error 事件：刻意的「无信息」

`error` 事件**不携带任何错误细节**——事件对象里没有错误码、没有原因。这是**安全设计**：暴露底层网络失败的细节可能泄露信息（比如探测内网端口）。因此：

- 不要指望从 `error` 事件里读出「为什么失败」；
- `error` 之后**必定紧跟一个 `close`**，真正可用的诊断信息（`code` / `wasClean`）在 `CloseEvent` 里；
- 实践中 `onerror` 往往只用来打一行日志，重连 / 恢复逻辑挂在 `onclose` 上。

## 六、只读属性小结

除 `binaryType`（可写，见[下一页](./guide-line/binary-backpressure)）外，`WebSocket` 的其余属性全部只读：

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `url` | `string` | 解析后的绝对 URL |
| `readyState` | `number` | 四态之一（见上文） |
| `protocol` | `string` | 服务端选中的子协议（未选为空串） |
| `extensions` | `string` | 服务端选中的扩展（如压缩扩展 `permessage-deflate`），通常为空串 |
| `bufferedAmount` | `number` | 已 `send` 但未发出的字节数（详见[背压页](./guide-line/binary-backpressure)） |
| `binaryType` | `string` | **唯一可写**：`"blob"`（默认）或 `"arraybuffer"` |

下一页深入二进制收发与背压——`binaryType` 的选择、`bufferedAmount` 的语义与发送节流、大消息在浏览器侧怎么处理：[二进制与背压](./guide-line/binary-backpressure)。
