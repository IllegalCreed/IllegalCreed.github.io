---
layout: doc
outline: [2, 3]
---

# 核心机制详解

> 基于 RFC 9113（HTTP/2）/ RFC 9114（HTTP/3）/ RFC 9000（QUIC）/ RFC 7541（HPACK）/ RFC 9204（QPACK）/ RFC 9218（Priority）/ RFC 8297（103 Early Hints）官方文档编写

## 速查

- **HTTP/2 多路复用**：单 TCP 连接上的二进制分帧，一条连接并行跑 2^31-1 个并发 stream，**消除应用层队头阻塞**
- **HTTP/2 帧**：9 字节帧头（Length/Type/Flags/Stream ID）+ 10 种帧类型（DATA/HEADERS/SETTINGS/WINDOW_UPDATE/GOAWAY/PUSH_PROMISE…）
- **HPACK 三件套**：静态表 61 项 + 动态表（FIFO，受 SETTINGS_HEADER_TABLE_SIZE 控制，默认 4096 字节）+ 静态 Huffman 编码（抗 CRIME 类压缩预言机攻击）
- **Server Push 弃用**：Chrome 106（2022-09）默认禁用、采用率从 1.25% 跌到 0.7%、HTTP/3 多数未实现；替代方案 **103 Early Hints**（RFC 8297）+ `<link rel="preload">`
- **流优先级（RFC 9218）**：`Priority: u=<0-7>; i=?<0|1>` 头，u=0 最高 / u=7 最低；HTTP/3 用 **PRIORITY_UPDATE 帧**（type 0x24/0x25）
- **HTML 层**：`fetchpriority="high|low|auto"` 与协议优先级协作，给 LCP 关键资源打标
- **HTTP/3 QUIC 四大优势**：基于 UDP、独立 stream HOL 消除、0-RTT 重连、Connection ID 连接迁移
- **QUIC 连接迁移**：Connection ID 标识连接（非 IP+Port 4 元组），Wi-Fi→蜂窝 IP 变化不掉线
- **0-RTT 重放风险**：early data 缺前向保密、可被重放，仅放幂等 GET/HEAD；POST / 支付必须等 1-RTT
- **QPACK vs HPACK**：静态表 99 vs 61 项、独立 Encoder/Decoder 单向流做显式 ACK、Insert Count 阈值避免压缩层 HOL
- **Alt-Svc 协商 HTTP/3**：`Alt-Svc: h3=":443"; ma=86400`，首次仍走 h2，缓存后下次尝试 h3
- **域名分片在 h2 失效**：多路复用让分片变成纯开销，应移除 static1/static2 子域
- **不要过度 bundle/inline**：HTTP/2 后过度打包牺牲缓存粒度与流优先级，小粒度独立文件更优

## HTTP/2 多路复用

### 二进制分帧层

HTTP/2 把请求/响应拆成**二进制帧**，每个帧由 9 字节帧头 + payload 组成：

```text
+-----------------------------------------------+
|                 Length (24)                    |  ← payload 字节数
+---------------+---------------+---------------+
|   Type (8)    |   Flags (8)   |
+-+-------------+---------------+-------------------------------+
|R|                 Stream Identifier (31)                      |  ← 流 ID
+=+=============================================================+
|                   Frame Payload (0...)                       |
+---------------------------------------------------------------+
```

**10 种帧类型**

| Type | 名称 | 用途 |
| --- | --- | --- |
| 0x0 | DATA | 请求/响应 body |
| 0x1 | HEADERS | 头部（含 HPACK 压缩后的 header block fragment） |
| 0x2 | PRIORITY | 流优先级（**RFC 9113 已弃用**） |
| 0x3 | RST_STREAM | 终止流 |
| 0x4 | SETTINGS | 连接参数协商 |
| 0x5 | PUSH_PROMISE | Server Push（**已弃用**） |
| 0x6 | PING | 心跳 / RTT 测量 |
| 0x7 | GOAWAY | 优雅关闭连接 |
| 0x8 | WINDOW_UPDATE | 流级 / 连接级流量控制 |
| 0x9 | CONTINUATION | HEADERS 的续帧 |

### Stream（流）

**Stream 是双向字节序列**，承载一次请求 + 一次响应。一条 TCP 连接可同时跑 2^31-1 个并发 stream。客户端发起的 stream 用奇数 ID，服务端推送的（PUSH_PROMISE，已弃用）用偶数。

**Stream 状态机**：idle → open → half-closed → closed。RST_STREAM 可立即终止。

> 关键意义：浏览器不再需要为绕开队头阻塞而开多条 TCP 连接——所有请求复用一条连接，按 stream 切片并行传输。

### 流量控制

HTTP/2 在**连接级**与**stream 级**两层做流量控制（WINDOW_UPDATE 帧），允许接收端反压发送端。默认 `SETTINGS_INITIAL_WINDOW_SIZE` 为 65535 字节，可调。

## HPACK 头部压缩

HPACK（RFC 7541）是 HTTP/2 的头部压缩方案，三件套：

### ① 静态表（Static Table）

61 项预定义首部，常见 header 直接用索引号代替：

| 索引 | 头字段 |
| --- | --- |
| 2 | `:method: GET` |
| 4 | `:path: /` |
| 8 | `:status: 200` |
| 28 | `user-agent` （值待填） |

### ② 动态表（Dynamic Table）

FIFO 队列，受 `SETTINGS_HEADER_TABLE_SIZE` 控制（默认 4096 字节）。首次请求带完整 `Cookie: sessionid=...`，后续请求相同 Cookie 只需引用动态表索引，省下大量重复字节。

### ③ 静态 Huffman 编码

非自适应的 Huffman 表——**不会响应明文频率**，因此**抗 CRIME 类压缩预言机攻击**（攻击者无法通过观察压缩后长度反推秘密字段）。

> CRIME（2012）攻击利用了 SPDY/gzip 头部压缩的自适应性。HPACK 的静态 Huffman 是安全替代方案，**绝不要给 HTTP 头部外加 gzip**。

### SETTINGS 协商项

| 参数 | 含义 | 默认值 |
| --- | --- | --- |
| `SETTINGS_HEADER_TABLE_SIZE` (0x1) | HPACK 动态表上限 | 4096 字节 |
| `SETTINGS_ENABLE_PUSH` (0x2) | 是否允许 Push（**RFC 9113 建议设 0**） | 1（旧默认） |
| `SETTINGS_MAX_CONCURRENT_STREAMS` (0x3) | 并发流上限 | 无上限（实现限制） |
| `SETTINGS_INITIAL_WINDOW_SIZE` (0x4) | 流级流量控制初始窗口 | 65535 |
| `SETTINGS_MAX_FRAME_SIZE` (0x5) | 单帧 payload 上限 | 16384（上限 16777215） |

## Server Push 弃用与 103 Early Hints

### Server Push 已事实性废弃

HTTP/2 Server Push 允许服务端在客户端请求 HTML 之前主动推送 CSS / JS / 图片。但业界实测采用率从 1.25% 跌到 **0.7%**，主要问题：

- **重复推送已缓存资源**：服务端无法可靠知道浏览器缓存了什么，常把已缓存资源再推一遍
- **与浏览器缓存撞车**：push promise 与 cache 语义冲突
- **HTTP/3 多数未实现**：nginx HTTP/3、Cloudflare HTTP/3 都未提供 push
- **采用率持续下滑**：Chrome 团队于 **2022-08** 公告，**Chrome 106（2022-09）默认禁用**，Firefox / Safari 跟进

> Server Push 已可视为事实废弃。**新项目不要再用**，存量项目应迁移到 103 Early Hints + `<link rel="preload">`。

### 替代方案：103 Early Hints（RFC 8297）

服务器在最终响应前先发一个 **103 状态码**响应：

```text
HTTP/1.1 103 Early Hints
Link: </style.css>; rel="preload"; as="style"
Link: </app.js>; rel="preload"; as="script"

HTTP/1.1 200 OK
Content-Type: text/html
...
```

浏览器在「server think time」（服务端处理 200 响应期间）并行预取关键资源，但**由浏览器决定是否实际加载**（缓存命中即跳过）。这把「是否加载」的决定权交还给浏览器，避免了 Push 的撞车问题。

## 流优先级

### 旧方案（RFC 7540，已弃用）

旧 HTTP/2 PRIORITY 帧用 **weight 1-256 + dependency tree**（依赖树）表达优先级。RFC 9113（2022-06）正式弃用此方案，新服务器会忽略 PRIORITY 帧。

### 新方案（RFC 9218 Extensible Prioritization）

用 `Priority` 头字段：

```text
Priority: u=0; i=?1
```

- **u=urgency**：0-7，0 最高 / 7 最低
- **i=?incremental**：`?1` 表示可增量交付（流式），`?0` 表示一次性

HTTP/2 用 `Priority` 头承载；HTTP/3 用 **PRIORITY_UPDATE 帧**（type 0x24 流级 / 0x25 流级）承载相同语义。

### HTML 层：Fetch Priority API

浏览器启发式按资源类型默认排序（CSS > script > img），但无法识别「hero 图 / 首屏字体」这种**语义优先级**。HTML 属性 `fetchpriority` 弥补此缺陷：

```html
<!-- hero 图高优先级，影响 LCP -->
<img src="hero.webp" fetchpriority="high" />

<!-- 非关键图片低优先级 -->
<img src="below-fold.webp" loading="lazy" fetchpriority="low" />

<!-- 关键脚本高优先级 -->
<script src="app.js" fetchpriority="high"></script>
```

`fetchpriority` 可用于 `<img>` / `<script>` / `<link>` / `<iframe>` / `fetch()`。HTML 解析瞬间就会影响 HTTP/2 / HTTP/3 流优先级。

## HTTP/3 与 QUIC

### QUIC 是什么

QUIC（RFC 9000）是基于 **UDP** 的可靠传输协议，**TLS 1.3 内嵌**（RFC 9001），把握手与加密合并为 1-RTT，重连可降至 0-RTT。HTTP/3（RFC 9114）跑在 QUIC 之上。

### QUIC 四大核心优势

**① 独立 stream，消除 TCP 队头阻塞**

TCP 是字节流协议，一个包丢了，后续包都要等重传完成才能交付应用层——所有 stream 都被卡住。QUIC 把每条 stream 独立加密、独立重传，丢包**只阻塞丢包的 stream**，其他 stream 照常交付。

**② 0-RTT 重连**

首次连接 1-RTT（握手 + 加密合并），重连时使用上次会话密钥派生 **0-RTT early data**，客户端首个请求数据就能立即发出。Cloudflare 实测重复访问 TTFB 从 h2 201ms 降到 h3 176ms（-12.4%）。

**③ Connection ID 与连接迁移**

TCP 用 4 元组（源 IP / 源端口 / 目的 IP / 目的端口）标识连接，IP 变了连接就断了。QUIC 用 **Connection ID**（8 字节可变）标识连接，与 IP 解耦——Wi-Fi 切蜂窝时 IP 变化，连接不丢、流不重传。

服务端通过 **NEW_CONNECTION_ID 帧**预发新 CID，客户端切换路径时用新 CID 标识同一逻辑连接。

**④ TLS 1.3 内嵌**

QUIC 把 TLS 1.3 握手直接嵌进自己的握手包里，不再像 TCP+TLS 那样两层握手。这同时避免了 TCP 头部加密语义缺失（中间盒无法再窥视 TCP 字段）。

### QPACK（HTTP/3 头部压缩）

QPACK（RFC 9204）是 HPACK 的 HTTP/3 版本，关键差异：

| 维度 | HPACK（h2） | QPACK（h3） |
| --- | --- | --- |
| 静态表 | 61 项 | **99 项**（多出 date / server 等） |
| ACK 机制 | 共享 TCP 流，天然有序 | **独立 Encoder/Decoder 单向流**（Stream type 0x02/0x03） |
| HOL 阻塞 | 受 TCP HOL 影响 | 编码端用 **Insert Count 阈值**避免引用未确认条目（超过则退化为字面量） |

> QPACK 显式 ACK 的目的：在 QUIC 无序到达的前提下，不让头部压缩本身成为新的队头阻塞源。

## Alt-Svc 协商 HTTP/3

浏览器**不能**直接发起 HTTP/3 请求（DNS 只告诉 IP，不知道服务器支持 h3）。协商靠 **Alt-Svc 响应头**：

```text
Alt-Svc: h3=":443"; ma=86400, h3-29=":443"
```

- 首次访问：浏览器走 HTTP/2，收到响应后**缓存** Alt-Svc
- 后续访问：浏览器尝试 HTTP/3（UDP/443），失败则回退 HTTP/2
- `ma=86400`：max-age，缓存有效期
- `persist=1`：可跨浏览器会话保留

> **必须放通 UDP/443**。许多企业网 / 中间盒对 UDP 限速或丢弃，导致 QUIC 包丢失，浏览器不断回退 h2 还要付出重试开销。

## 域名分片在 HTTP/2 失效

HTTP/1.1 时代为绕开「每 origin 6 条连接」上限发明了域名分片——把资源分散到 `static1.x.com` / `static2.x.com`。HTTP/2 多路复用让一个 origin 用一条 TCP 连接即可并行跑上百条 stream，分片变成**纯开销**：

- 每个分片额外 DNS + TCP + TLS 握手
- 每个分片独立拥塞控制，反而拖慢整体
- 缓存命中率下降（不同子域资源无法共享连接级状态）

Cloudflare 与 MDN 均明确：**HTTP/2 下应移除域名分片**。把 static1/static2 合并到主域或一个静态子域即可。

## 反模式（避坑）

- **HTTP/2 上继续域名分片**：多路复用让分片变成纯开销（DNS + TCP + TLS 重复），且每分片独立拥塞控制反而拖慢整体
- **继续使用 Server Push 主动推资源**：Chrome / Firefox / Safari 已默认禁用或限制，采用率仅 0.7%；推已缓存资源浪费带宽、push promise 与缓存撞车；HTTP/3 多数服务器根本未实现
- **把所有 JS/CSS 打成一个超大 bundle**：HTTP/2 多路复用后 bundle 已非性能必需，反而牺牲缓存粒度、流优先级与按需加载；正确做法是细粒度模块 + 合理 HTTP 优先级
- **在 0-RTT early data 中处理非幂等 POST / 支付 / 写操作**：重放攻击会重复执行事务，造成扣两次款 / 重复创建等业务故障；必须强制等 1-RTT 握手完成
- **假设 HTTP/3 永远比 HTTP/2 快**：大对象传输时 QUIC 拥塞算法（默认 New Reno / CUBIC）可能不如调优过的 h2 + BBR（Cloudflare 实测 1MB 页面 h3 2.33s vs h2 2.30s）；是否升级需基于自身业务画像
- **忽视 RFC 9113 已弃用旧优先级树**：继续依赖 PRIORITY 帧的 dependency tree（weight 1-256）会被新服务器忽略；新方案是 RFC 9218 的 Priority 头（u=0..7, i=?1），HTTP/3 用 PRIORITY_UPDATE 帧
- **开启 HTTP/3 但不放通 UDP/443**：防火墙 / LB 丢弃 QUIC 包导致浏览器回退 HTTP/2 并产生重试开销；某些企业网 / 中间盒对 UDP 限速，需先验证链路
- **期望浏览器自动识别 LCP / hero 资源**：HTTP/2 默认按资源类型排序，CSS 优先于图片，未标 fetchpriority 的 hero 图可能被排到异步脚本之后，拖慢 LCP
- **关闭 HTTP/2 后还按 h1 调优**：开 h2 / h3 但保留 h1 时代的域名分片 / 过度 bundle / sprite 合图，等于自废武功
- **HPACK 动态表配得太小**：动态表上限过低会让条目频繁淘汰退化为字面量，头部压缩率从 ~30% 提升退化到几乎为零；必要时设到 65536

## 下一步

- [参考](./reference.md)：HTTP/1.1 vs 2 vs 3 完整对比表、协议特性矩阵、RFC 与官方资源
