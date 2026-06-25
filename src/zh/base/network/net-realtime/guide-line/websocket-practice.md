---
layout: doc
outline: [2, 3]
---

# WebSocket 心跳·重连·工程实践

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- **心跳保活**：用协议级控制帧 **Ping（opcode `0x9`）/ Pong（opcode `0xA`）**，控制帧 payload ≤ **125 字节**、不可分片；浏览器**不暴露**收发 ping 的 JS API，由浏览器自动回 pong，应用层心跳（业务 JSON `{"type":"ping"}`）才是前端唯一可控手段。
- **检测死连接**：TCP「半开连接」对端无感知，必须靠「**发心跳 + 限时等回包**」主动探活——超时未回即判定断线并主动 `close()`。
- **断线重连**：**指数退避 + 随机抖动**（`min(base·2^n, cap) + random`），避免服务端重启时「重连风暴」（thundering herd）；上限 cap 一般 30s。
- **消息可靠性**：WebSocket **只保证帧按序到达、不保证应用层送达**（`send()` 返回 ≠ 对端已处理）；需自建 **ACK + 消息序号 + 重发**，断线期间靠**服务端缓冲 + 重连后按 last-seen-id 补偿**。
- **关闭语义**：Close 帧 opcode `0x8`；常见关闭码 `1000` 正常、`1001` 端点离开、`1006` 异常断开（无 Close 帧，**重连判据**）、`1011` 服务端内部错误、`1013` Try Again Later（过载，应退避）。
- **代理 / LB**：反向代理须显式转发 `Upgrade: websocket` + `Connection: Upgrade`；**L4（TCP）LB 天然透传**，**L7 LB 需开 WebSocket 支持**；有状态服务需**粘性会话**，无状态优先。
- **鉴权**：握手是标准 HTTP 请求，可带 **Cookie** 或 URL query 中的 token；**浏览器无法自定义握手头**（`Authorization`、`Sec-*` 都设不了），故常用 Cookie / `Sec-WebSocket-Protocol` 夹带 token / 短期一次性 ticket。
- **子协议**：客户端 `Sec-WebSocket-Protocol: v1.chat, v2.chat`，服务端**选一个回显**（或不回表示不选）；用域名式命名（`chat.example.com`）防冲突。
- **wss 优先**：`wss://`（over TLS）对企业代理 / 中间盒穿透更可靠——加密流量代理无法窥探篡改，避免被「优化」掉 Upgrade。
- **HTTP/2 上的 WebSocket**：RFC 8441 用**扩展 CONNECT**（`:protocol = websocket` + `SETTINGS_ENABLE_CONNECT_PROTOCOL`）把 WS 映射到单条 H2 流，复用连接、免单独握手；HTTP/3 由 RFC 9220 对应支持。

## 一、心跳保活：为什么必须主动探活

WebSocket 建立在一条长连接的 TCP 之上。问题在于：**TCP 不会主动告诉你对端已经没了**。

::: warning 半开连接（Half-Open Connection）
对端进程崩溃、手机切后台被杀、网线被拔、NAT 映射超时被回收——这些情况下，**没有任何 FIN/RST 包**发回来。你这一侧的 socket 仍是 `ESTABLISHED`，`send()` 也不报错（数据进了内核发送缓冲区），但对端**永远收不到**。这就是「半开连接」，纯靠系统级 TCP Keepalive（默认 2 小时才探测）根本来不及发现。
:::

解药是**应用层主动探活**：周期性发一个探测包，并**限时等待回包**，超时即判定连接已死。WebSocket 协议为此内建了一对控制帧。

### 协议级 Ping / Pong 控制帧

RFC 6455 定义了两个控制帧 opcode：**Ping = `0x9`，Pong = `0xA`**。两条规则要记牢：

> All control frames MUST have a payload length of 125 bytes or less and MUST NOT be fragmented.（RFC 6455）

任意一方都可在握手后随时发 Ping，收到方**必须尽快回 Pong，且 Pong 的 payload 要与 Ping 完全相同**；也允许发**未经请求的（unsolicited）Pong**作为单向保活信号，对端可忽略。MDN 还补充：若来不及回、攒了多个 Ping，**只回最后一个 Pong**即可。

```
保活时序（任一方探活）：
  A ──Ping(0x9)──▶ B          A 启动「等 Pong」定时器（如 10s）
  A ◀──Pong(0xA)── B          收到 → 重置定时器，连接健康
  ……
  A ──Ping(0x9)──▶ ✗          B 已死：定时器到点未收 Pong
  A: 判定断线 → close() → 进入重连
```

::: tip 浏览器端的关键限制
**浏览器的 WebSocket API 不暴露收发 ping 的能力**：你无法在 JS 里主动发 Ping，浏览器收到 Ping 也只是**自动回 Pong**，不通知页面。因此前端**唯一可控的心跳是「应用层心跳」**——双方约定一条业务消息（如 <code v-pre>{{ "type": "ping" }}</code> / <code v-pre>{{ "type": "pong" }}</code>），走普通 text 帧。协议级 Ping/Pong 主要由**服务端 / 网关 / Node 等非浏览器端**使用。
:::

### 心跳还要对抗「中间设备超时」

即便连接物理可达，**中间设备也会因「长时间无数据」主动掐断**：NAT 设备回收空闲映射、企业代理 / 云 LB 设有 **idle timeout**（如 AWS ALB 默认 60s、Nginx `proxy_read_timeout` 默认 60s）。心跳的第二重作用就是**制造周期流量**让这些设备认为连接活跃。经验值：**心跳间隔取「最小中间超时」的 1/2 ~ 2/3**（如链路上最短 idle 是 60s，心跳取 25~30s）。

## 二、断线重连：指数退避 + 抖动

连接断了（无论是心跳超时、`onclose`、还是 `onerror`），不能立刻无脑重连——**服务端重启的瞬间，成千上万客户端同时回连会形成「重连风暴」把刚起来的服务再次打垮**（thundering herd）。

正确做法是 **指数退避（exponential backoff）+ 随机抖动（jitter）**：

```
第 n 次重连等待 = min(base · 2^n, cap) + random(0, jitter)

例：base=1s, cap=30s
  第1次失败 → 等 ~1s     第2次 → ~2s     第3次 → ~4s
  第4次 → ~8s            第5次 → ~16s    第6次起 → 封顶 ~30s
  每次再叠加 0~1s 随机抖动，把回连时刻「打散」，避免同步尖峰
```

::: tip 重连工程要点
- **抖动不可省**：纯指数退避会让所有客户端**步调一致**地在同一时刻重连，抖动才能真正削峰。
- **`1006` 是主要触发器**：异常断开（无 Close 帧）`onclose` 给到关闭码 `1006`，这是「网络掉了」的典型信号，应进入重连；而 `1000`（正常关闭）通常是业务主动关，**不该**重连。
- **服务端过载用 `1013`**：服务端可用关闭码 `1013`（Try Again Later）显式要求客户端**退避后再来**，客户端应据此拉长间隔。
- **可见性联动**：页面 `visibilitychange` 切回前台、`navigator.onLine` 由 false 转 true 时，**立即重置退避计数并重连**，提升恢复速度。
- **重连成功后要恢复状态**：重新发送鉴权、重新订阅频道 / 房间、补偿断线期间丢失的消息（见下一节）。
:::

## 三、消息可靠性：WebSocket 不替你保证送达

一个高频误区：以为 `socket.send(msg)` 成功就等于对端收到了。**并非如此**——`send()` 只是把数据交给本地发送缓冲区，**应用层是否处理、断线瞬间在途的消息是否丢失，协议一概不保证**。要做到「不丢不重不乱」，必须在应用层自建一套机制：

| 机制 | 作用 |
| --- | --- |
| **消息序号（seq / id）** | 每条消息带单调递增 ID，接收端可去重、检测缺号 |
| **ACK 确认** | 接收端回 `ack: id`，发送端收到才视为「真正送达」 |
| **超时重发** | 发出后启动定时器，超时未收 ACK 则重发（配合 seq 去重） |
| **断线补偿** | 重连后客户端上报 `last-received-id`，服务端**补发**之后缓冲的消息 |

::: warning 至少一次 vs 幂等
有了「超时重发」就可能**重复投递**（ACK 在回程丢了，发送端误判重发）。这是典型的「**至少一次（at-least-once）**」语义——必须靠**接收端按 seq 去重**或**业务幂等**兜底，才能对用户呈现「恰好一次」。断线期间的消息要靠**服务端缓冲队列 + 重连后按 last-seen-id 重放**来补偿，缓冲需设上限与 TTL，防止离线用户撑爆内存。
:::

## 四、代理与负载均衡：让 Upgrade 活着穿过去

WebSocket 握手是一次带 `Upgrade: websocket` 的 HTTP 请求。**很多反向代理 / LB 默认不会透传这两个头**，导致握手在中途被「降级」成普通 HTTP 而失败。

### 反向代理必须显式转发 Upgrade

以 Nginx 为例，**关键是把逐跳头 `Upgrade` / `Connection` 显式传给上游，并拉长读超时**：

```nginx
location /ws/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;                 # WebSocket 需 HTTP/1.1
    proxy_set_header Upgrade $http_upgrade;  # 透传 Upgrade: websocket
    proxy_set_header Connection "upgrade";   # 升级连接
    proxy_set_header Host $host;
    proxy_read_timeout 3600s;                # 拉长 idle，配合心跳
}
```

### L4 vs L7 负载均衡

- **L4（TCP/传输层）LB**：只转发 TCP 字节流，**对 WebSocket 天然透明**，握手与帧原样穿过，配置最省心。
- **L7（HTTP/应用层）LB**：会解析 HTTP，**必须显式开启 WebSocket 支持**（识别 `Upgrade` 后切到隧道模式），并设置足够长的 idle timeout，否则连接会被周期性掐断。

::: tip 粘性会话与 wss
- **粘性会话（sticky session）**：若服务端把连接状态存在内存（房间、会话），LB 必须保证**同一客户端始终路由到同一后端实例**；多实例间则需 Redis 等共享状态 + Pub/Sub 广播，否则优先做**无状态**设计。
- **wss 穿透更可靠**：`wss://`（WebSocket over TLS）的流量对中间盒是**密文**，企业代理 / 防火墙无法窥探或「优化」掉 Upgrade 头，**穿透成功率显著高于明文 `ws://`**。生产环境一律用 `wss`。
- **CDN / 云 LB idle**：务必把 idle timeout 调到大于心跳间隔（如 ALB 默认 60s，心跳就要 < 60s），否则「没说话就被踢」。
:::

## 五、鉴权、子协议与 HTTP/2/3 关系

### 握手鉴权：受困于「不能自定义头」

握手是标准 HTTP 请求，理论上可带任意头，但**浏览器的 WebSocket API 不允许自定义请求头**——`Authorization`、以及任何 `Sec-*` 头都设不了。RFC 6455 也明确：

> fields starting with |Sec-| cannot be set by an attacker from a web browser using only HTML and JavaScript APIs.（RFC 6455）

因此浏览器侧常见三种鉴权途径：① **Cookie**——同源下浏览器自动带上，握手时服务端校验 session；② **URL query token**（`wss://host/ws?token=xxx`）——简单但 token 会进日志，宜用**短期一次性 ticket**（先经普通 HTTPS 接口换取）；③ 把 token 塞进 **`Sec-WebSocket-Protocol`** 子协议头夹带。非浏览器客户端（Node、移动原生）则可自由设 `Authorization` 头。

### 子协议 Sec-WebSocket-Protocol

客户端在握手头里列出可接受的子协议，**服务端从中选一个回显**（或不回表示都不选）：

```http
# 请求（客户端）
Sec-WebSocket-Protocol: v2.chat.example.com, v1.chat.example.com
# 响应（服务端，101 Switching Protocols）
Sec-WebSocket-Protocol: v2.chat.example.com
```

它用于**协商消息格式 / 版本**（如选 WAMP、STOMP、或自定义协议版本），用域名式命名防冲突。服务端**最多回一个**该头；客户端若没拿到想要的子协议，可以直接关闭连接。

### 与 HTTP/2、HTTP/3 的关系（RFC 8441）

经典 WebSocket 跑在 HTTP/1.1 的 `Upgrade` 机制上，**每条连接独占一条 TCP**，无法复用 HTTP/2 连接。**RFC 8441《Bootstrapping WebSockets with HTTP/2》**用 **扩展 CONNECT（Extended CONNECT）** 解决了这一点：

- 新增 HTTP/2 SETTINGS 参数 **`SETTINGS_ENABLE_CONNECT_PROTOCOL`**，服务端发 `=1` 表示支持；
- 客户端用扩展 CONNECT，在请求里携带新伪头 **`:protocol`**，对 WebSocket **其值必须为 `websocket`**，并同时带上 `:scheme`、`:path`；
- 握手成功后，**这条 HTTP/2 流就当作 RFC 6455 里的那条 TCP 连接来用**——WebSocket 帧在流内收发，从而**复用同一条 H2 连接、免去单独的 TCP + TLS 握手**。流的正常关闭用 `END_STREAM`，异常用 `RST_STREAM`。

::: info HTTP/3 呢？
RFC 8441 本身**只针对 HTTP/2**。HTTP/3 上的 WebSocket 由后续的 **RFC 9220《Bootstrapping WebSockets with HTTP/3》** 对应支持，思路一致（扩展 CONNECT + `:protocol = websocket`），把 WS 映射到一条 QUIC 流。需注意：**这要求两端都支持**，浏览器与服务端实现仍在逐步铺开，传统 HTTP/1.1 Upgrade 仍是兼容性最广的方案。
:::

## 小结

WebSocket 的「难」不在握手与帧（那是协议本身），而在**长连接的工程化运维**：用 **Ping/Pong 或应用层心跳**探活半开连接、用 **指数退避 + 抖动**优雅重连、用 **ACK + 序号 + 服务端缓冲**补回协议不保证的可靠性、让 **代理 / LB 正确透传 Upgrade 并配粘性会话**、在「不能自定义头」的约束下用 **Cookie / ticket / 子协议**完成鉴权。再往上，RFC 8441 / 9220 让 WebSocket 能搭上 HTTP/2、HTTP/3 复用连接的便车。

握手与帧格式的底层细节见上一页 [WebSocket 协议握手与帧](./websocket-protocol)；当实时场景从「客户端-服务器」转向「点对点音视频 / 数据通道」时，就该看下一页 [WebRTC 与 NAT 穿透](./webrtc-nat) 了。
