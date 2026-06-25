---
layout: doc
outline: [2, 3]
---

# WebSocket 协议握手与帧

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- **WebSocket = 全双工双向通信协议**（RFC 6455），在一条 TCP 连接上让客户端与服务端**随时互推消息**，彻底摆脱「请求—响应」的轮询模型。
- **借 HTTP 发起握手**：客户端发一个特殊的 `GET` 请求，带 `Upgrade: websocket` + `Connection: Upgrade` + `Sec-WebSocket-Key` + `Sec-WebSocket-Version: 13`。
- **服务端回 `101 Switching Protocols`**：带回 `Upgrade: websocket`、`Connection: Upgrade` 和 `Sec-WebSocket-Accept`——这一刻起连接「升级」为 WebSocket。
- **`Sec-WebSocket-Accept` 算法**：取客户端 `Sec-WebSocket-Key` **拼接魔术字符串** `258EAFA5-E914-47DA-95CA-C5AB0DC85B11` → **SHA-1** → **Base64**。它只防误升级，**不是安全机制**。
- **握手后脱离 HTTP**：复用**同一条 TCP 连接**，不再有 HTTP 报文头，双方按 WebSocket **帧（frame）**收发二进制数据。
- **帧首两字节**：`FIN`(1) + `RSV1~3`(3) + `opcode`(4) + `MASK`(1) + `Payload len`(7)，后面跟可选的扩展长度、掩码键、载荷。
- **opcode**：`0x1` 文本、`0x2` 二进制（数据帧）；`0x8` 关闭、`0x9` ping、`0xA` pong（控制帧）；`0x0` 续帧（分片用）。
- **载荷长度 7/16/64 位三档**：7 位值 ≤125 直接用；=126 读后续 **16 位**；=127 读后续 **64 位**（必须用最短编码）。
- **掩码（masking）非对称强制**：**客户端→服务端的每一帧都必须用 4 字节掩码键做 XOR**；**服务端→客户端绝不能掩码**。违反则对方按协议错误关闭连接。
- **`ws://`（默认 80）vs `wss://`（默认 443，over TLS）**：`wss` 在 TCP 之上先做 TLS 握手再走 WebSocket，与 HTTPS 复用 443 端口。
- **与 HTTP 端口共用**：因握手本身是 HTTP，WebSocket 天然走 80/443，**无需为它单开端口**，能顺利穿过大多数防火墙与代理。
- **本页只讲协议与原理**；浏览器 `WebSocket` 对象（`send` / `onmessage` 等）的用法见 Web API 章，心跳与重连等工程实践见[下一页](./websocket-practice)。

## 一、WebSocket 解决了什么

[上一页 SSE](./sse) 讲的服务器推送是**单向**的——服务端能持续推、客户端却只能在建连时发一次请求。但聊天、协同编辑、实时游戏这类场景需要**双方都能随时主动发消息**。用 HTTP 硬扛只能靠轮询或长轮询，要么延迟高、要么频繁重建连接，开销巨大（这些方案的演进见 [实时通信方案演进](./polling-evolution)）。

**WebSocket（RFC 6455）** 给出的答案是：在客户端与服务端之间建立一条**持久的、全双工的** TCP 通道。一旦建立，任意一方都能在任意时刻向对方推送数据，且**没有 HTTP 那一层层的请求头开销**——每条消息只裹一个极小的帧头。

::: tip 全双工 vs 半双工
**全双工（full-duplex）** 指通信双方可以**同时**收发，互不阻塞——WebSocket 即如此。对比 SSE（服务端单向推）、HTTP 请求—响应（一问一答的半双工式交互），WebSocket 是唯一在单连接上做到双向同时通信的浏览器原生协议。
:::

## 二、握手：借 HTTP 完成「协议升级」

WebSocket 巧妙地**复用 HTTP 来发起连接**，因此能共用 80/443 端口、穿过现有代理与防火墙。整个升级靠的是 HTTP 的[协议升级机制](../../net-http-basics/guide-line/http-headers)（`Upgrade` 首部）。

### 客户端：发一个带 Upgrade 的 GET

```http
GET /chat HTTP/1.1
Host: example.com:8000
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
Origin: https://example.com
Sec-WebSocket-Protocol: chat, superchat
```

逐行看关键首部：

| 首部 | 作用 |
| --- | --- |
| `GET` + `HTTP/1.1` | 方法**必须是 GET**，HTTP 版本**至少 1.1** |
| `Upgrade: websocket` | 声明要升级到的目标协议 |
| `Connection: Upgrade` | 逐跳首部，告诉中间节点「这是一次升级请求」 |
| `Sec-WebSocket-Key` | 客户端随机生成的 16 字节、Base64 编码的 nonce |
| `Sec-WebSocket-Version` | 协议版本，**当前为 13** |
| `Sec-WebSocket-Protocol` | 可选，列出希望使用的**子协议**，由服务端选一个回告 |

### 服务端：回 101 Switching Protocols

```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
Sec-WebSocket-Protocol: chat
```

**`101 Switching Protocols`** 是这次握手的灵魂：它告诉客户端「我同意切换协议，从现在起这条 TCP 连接讲 WebSocket」。客户端必须校验状态码确为 101、`Upgrade`/`Connection` 首部正确、且 `Sec-WebSocket-Accept` 与本地算出的值一致，否则按失败处理。

::: warning 只能客户端发起，且仅限 HTTP/1.1
协议升级**只能由客户端请求**，服务端无法主动发起。该机制是 **HTTP/1.1 专属**——**HTTP/2 明确禁止**用 `Upgrade` 升级（HTTP/2 上的 WebSocket 改用 RFC 8441 的扩展 `CONNECT`，是另一套机制）。
:::

### Sec-WebSocket-Accept：握手的「暗号」

服务端如何证明自己真的懂 WebSocket、而不是把这个 `GET` 当普通请求误处理？靠一个**确定性的暗号计算**：

```
拼接：  Sec-WebSocket-Key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
            ↓  对客户端原始 Key 字符串直接拼接（不解码 Base64）
SHA-1： 对拼接后的字符串做 SHA-1，得到 20 字节摘要
            ↓
Base64：把摘要 Base64 编码 → 即 Sec-WebSocket-Accept
```

以规范给出的样例 Key `dGhlIHNhbXBsZSBub25jZQ==` 为例：

```
"dGhlIHNhbXBsZSBub25jZQ==" + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
  → SHA-1 → Base64 → "s3pPLMBiTxaQ9kYGzzhZRbK+xOo="
```

那串 `258EAFA5-...` 是 RFC 6455 写死的**魔术字符串（magic GUID）**，全世界所有实现都用同一个。

::: info Sec-WebSocket-Key 不是安全机制
`Sec-WebSocket-Key` / `Accept` 的目的**只是防止「意外升级」**——比如缓存代理或非 WebSocket 服务把请求当成普通 HTTP 误处理。它**不提供任何认证或加密**。真正的传输安全来自 `wss://`（TLS），鉴权要靠 Cookie、Token 等额外手段。
:::

## 三、握手之后：复用同一条 TCP 连接

握手成功后，这条 **TCP 连接不会关闭**，而是被 WebSocket「接管」：

- **不再有 HTTP 报文**：双方不再发请求行、状态行、HTTP 首部，改用紧凑的 WebSocket 帧。
- **复用同一连接全双工**：升级请求所用的那条 TCP 连接，直接变成双向数据通道——无需另开连接。
- **持久存活**：连接保持打开，直到任意一方发**关闭帧（`0x8`）**走关闭握手，或 TCP 断开。

这正是 WebSocket 高效的根源：一次握手、长期复用，每条消息只付出几字节帧头的代价。

## 四、帧格式（Framing）

握手后的数据按**帧**传输。每帧的结构（RFC 6455 §5.2）如下：

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
|     Extended payload length continued, if payload len == 127  |
+ - - - - - - - - - - - - - - - +-------------------------------+
|                               | Masking-key, if MASK set to 1 |
+-------------------------------+-------------------------------+
|    Masking-key (continued)    |          Payload Data         |
+-------------------------------- - - - - - - - - - - - - - - - +
:                     Payload Data continued ...                :
+---------------------------------------------------------------+
```

逐字段拆解：

| 字段 | 位宽 | 含义 |
| --- | --- | --- |
| `FIN` | 1 | 是否为消息的**最后一帧**（1=结束；0=后面还有分片续帧） |
| `RSV1~3` | 各 1 | 保留位，供扩展用，无扩展时全为 0 |
| `opcode` | 4 | 帧类型（见下表） |
| `MASK` | 1 | 载荷是否被掩码（客户端发出=1；服务端发出=0） |
| `Payload len` | 7 | 载荷长度的第一档（0~125 直接用；126/127 触发扩展长度） |
| `Extended len` | 16 或 64 | 当上面=126 读 16 位；=127 读 64 位（最高位须为 0） |
| `Masking-key` | 32 | 仅当 `MASK=1` 时存在，4 字节随机掩码键 |
| `Payload Data` | 变长 | 实际数据（文本须为 UTF-8） |

### opcode 速查

| opcode | 类型 | 类别 | 说明 |
| --- | --- | --- | --- |
| `0x0` | Continuation 续帧 | 数据帧 | 分片消息的后续帧 |
| `0x1` | Text 文本 | 数据帧 | UTF-8 文本 |
| `0x2` | Binary 二进制 | 数据帧 | 任意二进制数据 |
| `0x8` | Close 关闭 | 控制帧 | 发起/响应关闭握手，可带 2 字节状态码 |
| `0x9` | Ping | 控制帧 | 心跳探测，对端须回 Pong |
| `0xA` | Pong | 控制帧 | 对 Ping 的回应，载荷须与 Ping 相同 |

::: tip 控制帧的两条铁律
**控制帧（`0x8`/`0x9`/`0xA`）载荷必须 ≤125 字节，且不可分片**。这保证心跳与关闭信令能被立刻、完整地处理，不会被大消息的分片卡住。Ping/Pong 的工程化用法（间隔、超时判定）见[下一页](./websocket-practice)。
:::

### 载荷长度的三档编码

为兼顾小消息的紧凑与大消息的容量，长度分三档：

```
7 位值 0~125  →  长度就是这个值，无扩展字节
7 位值 = 126  →  读后续 2 字节（16 位无符号）作为真实长度（最大 65535）
7 位值 = 127  →  读后续 8 字节（64 位无符号，最高位为 0）作为真实长度
```

规范要求**用能表达的最短编码**：124 字节的消息只能编成 `124`，不能写成 `126, 0, 124`。

### 掩码（Masking）：方向非对称的强制要求

WebSocket 对掩码有一条**不对称的硬规定**：

- **客户端 → 服务端：每一帧都必须掩码**（`MASK=1`，带 4 字节随机键）。
- **服务端 → 客户端：绝不能掩码**（`MASK=0`，无掩码键）。

掩码就是把载荷每个字节与掩码键循环 XOR；解码用同样的运算（XOR 自反）：

```
解码后[i] = 载荷[i] XOR 掩码键[i mod 4]
```

::: warning 为什么客户端必须掩码？
这是为**防御缓存投毒攻击**：恶意页面若能让浏览器发出「看起来像合法 HTTP 请求」的字节流，可能毒化中间代理的缓存。强制客户端用**随机掩码键**异或载荷，使攻击者无法预测最终上线的字节，从而堵死这类攻击。**收到未掩码客户端帧的服务端必须按协议错误关闭连接**，反之亦然。
:::

## 五、ws:// 与 wss://：端口与加密

WebSocket 有两种 URI 方案，与 HTTP/HTTPS 一一对应：

| 方案 | 默认端口 | 传输安全 | 类比 |
| --- | --- | --- | --- |
| `ws://` | 80 | 明文 TCP | HTTP |
| `wss://` | 443 | **TLS 加密** | HTTPS |

`wss://` 的工作方式：先在 TCP 之上完成 **TLS 握手**（与 HTTPS 同一套，详见 [TLS 握手流程](../../net-https-tls/guide-line/tls-handshake)），再在加密信道里跑 WebSocket 握手与帧。因为它复用 443 端口、流量被 TLS 包裹，能更顺畅地穿过企业代理。

::: tip 生产环境一律用 wss://
和「站点都该上 HTTPS」同理，**生产环境的 WebSocket 应一律用 `wss://`**：① 加密防窃听/篡改；② 许多浏览器禁止 HTTPS 页面里发起明文 `ws://` 连接（混合内容拦截）；③ 对代理与防火墙的兼容性更好。
:::

## 小结

WebSocket（RFC 6455）在单条 TCP 连接上实现**全双工双向通信**，弥补了 HTTP 轮询与 SSE 单向推的不足。它**借 HTTP 发起握手**：客户端发带 `Upgrade: websocket` + `Connection: Upgrade` + `Sec-WebSocket-Key` 的 `GET`，服务端回 **`101 Switching Protocols`** 并带上由「Key + 魔术字符串 → SHA-1 → Base64」算出的 `Sec-WebSocket-Accept`；握手后**脱离 HTTP、复用同一连接**按帧收发。帧首字节含 `FIN`/`opcode`，次字节含 `MASK` 与三档（7/16/64 位）载荷长度；`opcode` 区分文本 `0x1`/二进制 `0x2`/关闭 `0x8`/ping `0x9`/pong `0xA`；**客户端帧必须掩码、服务端帧绝不掩码**。`ws://`（80）与 `wss://`（443，over TLS）和 HTTP 端口共用，生产环境一律用 `wss://`。理解了握手与帧，就理解了 WebSocket「一次升级、长期全双工」的全部地基。

---

- 上一页：[SSE 服务器推送](./sse)
- 下一页：[WebSocket 心跳·重连·工程实践](./websocket-practice)
