---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 RFC 9113（HTTP/2）/ RFC 9114（HTTP/3）/ RFC 9000（QUIC）/ RFC 7541（HPACK）/ RFC 9204（QPACK）/ RFC 9218（Priority）/ RFC 8297（103 Early Hints）官方文档编写

## 速查

- HTTP/2 = RFC 9113（2022-06，取代 RFC 7540）；HPACK = RFC 7541；HTTP/3 = RFC 9114 + QUIC（RFC 9000）；QPACK = RFC 9204
- HTTP/2 关键机制：单 TCP 多 stream 二进制分帧、HPACK 头部压缩、Server Push（**已弃用**）、RFC 9218 Priority 头
- HTTP/3 关键机制：QUIC（UDP）独立 stream HOL 消除、0-RTT 重连、Connection ID 连接迁移、QPACK、PRIORITY_UPDATE 帧
- **Server Push 弃用时间线**：Chrome 106（2022-09）默认禁用、采用率 1.25% → 0.7%、HTTP/3 多数未实现
- **Alt-Svc 头**：`Alt-Svc: h3=":443"; ma=86400` 协商 HTTP/3，**UDP/443 必须放通**
- **新优先级头**：`Priority: u=0..7; i=?0|1`（u=0 最高）
- **Fetch Priority API**：HTML 层 `fetchpriority="high|low|auto"`
- **0-RTT 重放风险**：仅放幂等 GET/HEAD，POST / 支付必须等 1-RTT
- 完整说明见 [入门](./getting-started.md) / [核心机制详解](./guide-line.md)

## HTTP/1.1 vs HTTP/2 vs HTTP/3 对比表

| 维度 | HTTP/1.1 | HTTP/2 | HTTP/3 |
| --- | --- | --- | --- |
| **制定年代** | 1997 / 2014 重写 | 2015（RFC 7540）/ **2022**（RFC 9113） | **2022**（RFC 9114） |
| **传输层** | TCP | TCP | **QUIC（UDP）** |
| **加密** | 可选 | 必须 TLS（事实标准） | **TLS 1.3 内嵌** |
| **帧格式** | ASCII 文本 | **二进制分帧** | 二进制分帧（QUIC frame） |
| **多路复用** | 无（每连接一请求） | **单 TCP 多 stream** | **单 QUIC 多 stream** |
| **应用层 HOL** | 有 | **解决** | **解决** |
| **传输层 HOL** | 有 | 仍存在（TCP HOL） | **解决**（stream 独立） |
| **头部格式** | 原样 ASCII | **HPACK** | **QPACK** |
| **连接上限** | 每 origin ~6 | 单连接足够 | 单连接足够 |
| **域名分片** | 需要 | **失效** | 失效 |
| **握手往返** | 1 RTT (TCP) + 1-2 RTT (TLS) | 同左 | **1-RTT 首次 / 0-RTT 重连** |
| **连接迁移** | 不支持 | 不支持 | **支持**（Connection ID） |
| **Server Push** | 无 | 有（**已弃用**） | 多数未实现 |
| **优先级** | 无 | RFC 9218 Priority 头 | Priority 头 + PRIORITY_UPDATE 帧 |
| **流量控制** | TCP 级 | 连接级 + stream 级 | 连接级 + stream 级 |
| **典型端口** | 80 / 443 | 443 | **443 / UDP** |
| **状态** | 现行 | 现行 | 现行 |

## HTTP/2 帧类型完整表

| Type | 名称 | 用途 |
| --- | --- | --- |
| 0x0 | DATA | 请求 / 响应 body |
| 0x1 | HEADERS | 头部（HPACK 压缩） |
| 0x2 | PRIORITY | 流优先级（**RFC 9113 已弃用**） |
| 0x3 | RST_STREAM | 终止流 |
| 0x4 | SETTINGS | 连接参数协商 |
| 0x5 | PUSH_PROMISE | Server Push（**已弃用**） |
| 0x6 | PING | 心跳 / RTT 测量 |
| 0x7 | GOAWAY | 优雅关闭 |
| 0x8 | WINDOW_UPDATE | 流 / 连接级流量控制 |
| 0x9 | CONTINUATION | HEADERS 续帧 |

**帧头格式**（9 字节）：Length(24bit) + Type(8bit) + Flags(8bit) + Reserved(1bit) + Stream ID(31bit)。

## SETTINGS 协商项

| 参数 | ID | 含义 | 默认值 |
| --- | --- | --- | --- |
| `SETTINGS_HEADER_TABLE_SIZE` | 0x1 | HPACK 动态表上限 | 4096 字节 |
| `SETTINGS_ENABLE_PUSH` | 0x2 | 是否允许 Push（**RFC 9113 建议设 0**） | 1 |
| `SETTINGS_MAX_CONCURRENT_STREAMS` | 0x3 | 并发流上限 | 无（实现限制） |
| `SETTINGS_INITIAL_WINDOW_SIZE` | 0x4 | 流级流量控制初始窗口 | 65535 |
| `SETTINGS_MAX_FRAME_SIZE` | 0x5 | 单帧 payload 上限 | 16384（上限 16777215） |
| `SETTINGS_MAX_HEADER_LIST_SIZE` | 0x6 | 头部列表上限（防 DoS） | 无限 |

## HPACK vs QPACK 对比

| 维度 | HPACK（h2） | QPACK（h3） |
| --- | --- | --- |
| RFC | 7541 | 9204 |
| 静态表条目数 | 61 | **99** |
| 动态表 | FIFO，受 SETTINGS_HEADER_TABLE_SIZE 控制 | 同左 |
| Huffman | 静态 | 静态 |
| ACK 机制 | 共享 TCP，天然有序 | **独立 Encoder/Decoder 单向流** |
| 压缩层 HOL | 受 TCP HOL 影响 | **Insert Count 阈值避免**（超过则退化为字面量） |
| Stream type | （h2 无） | Encoder 0x02 / Decoder 0x03 |

## 优先级方案演进

| 方案 | 载体 | 字段 | 状态 |
| --- | --- | --- | --- |
| RFC 7540 PRIORITY 帧 | PRIORITY 帧 | weight 1-256 + dependency tree | **RFC 9113 弃用** |
| RFC 9218（HTTP/2） | Priority 头 | `u=0..7; i=?0|1` | 现行 |
| RFC 9218（HTTP/3） | PRIORITY_UPDATE 帧（0x24 / 0x25） | 同上 | 现行 |
| HTML 层 | `<img fetchpriority="...">` | high / low / auto | 现行（Fetch Priority API） |

**字段语义**：

- `u=0..7`：urgency，**0 最高** / 7 最低
- `i=?1`：incremental，可增量交付（流式）
- `i=?0`：non-incremental，一次性交付

## QUIC Connection ID

| 维度 | TCP 4 元组 | QUIC Connection ID |
| --- | --- | --- |
| 标识 | 源 IP + 源端口 + 目的 IP + 目的端口 | 8 字节可变 CID |
| 网络切换 | IP 变 → 连接断 | **IP 变 → 连接不断** |
| 复用 | 不可 | 服务端按 CID 复用连接状态 |
| 预发 | 无 | NEW_CONNECTION_ID 帧 |
| 多路径 | 不支持 | 支持（迁移 + 路径验证） |

## Alt-Svc 协商流程

```text
[首次访问 example.com]
浏览器  →  GET /  (HTTP/2 over TCP/443)
服务器  →  200 OK
         Alt-Svc: h3=":443"; ma=86400
浏览器  ← 缓存 Alt-Svc（86400 秒）

[后续访问]
浏览器  →  GET /  (尝试 HTTP/3 over UDP/443)
         若 UDP/443 不通 → 回退 HTTP/2
         若通 → 持续走 h3
```

**关键字段**：

- `h3=":443"`：协议 + 端口
- `ma=86400`：max-age，缓存有效期（秒）
- `h3-29=":443"`：可指定 draft 版本
- `persist=1`：跨浏览器会话保留

## 103 Early Hints vs Server Push

| 维度 | Server Push（已弃用） | 103 Early Hints |
| --- | --- | --- |
| RFC | RFC 7540 / 9113 | RFC 8297 |
| 决策方 | **服务端**（推什么、推多少） | **浏览器**（是否加载） |
| 缓存撞车 | 经常推已缓存资源 | 浏览器命中缓存即跳过 |
| HTTP/3 支持 | 多数未实现 | 已广泛支持 |
| 浏览器禁用 | Chrome 106 默认禁用 | 全部支持 |
| 推荐度 | **不要再使用** | 推荐替代方案 |

**103 响应示例**：

```text
HTTP/1.1 103 Early Hints
Link: </style.css>; rel="preload"; as="style"
Link: </app.js>; rel="preload"; as="script"

HTTP/1.1 200 OK
Content-Type: text/html
```

## 0-RTT 安全注意

| 维度 | 1-RTT 数据 | 0-RTT early data |
| --- | --- | --- |
| 前向保密 | 有 | **缺** |
| 重放风险 | 无 | **有** |
| 推荐请求 | 所有 | **仅幂等 GET / HEAD** |
| 禁用场景 | —— | **POST / 支付 / 写操作** |
| 来源 | TLS 1.3 握手后 | 上次会话密钥派生 |

> RFC 9001 E.5、Cloudflare / ETH 调研均强调：0-RTT early data 不能用于非幂等操作，否则攻击者重放会导致重复执行事务。

## 浏览器与服务器支持矩阵

### 浏览器（HTTP/2）

| 浏览器 | 起始版本 |
| --- | --- |
| Chrome | 41+（2015） |
| Firefox | 36+ |
| Safari | 9+ |
| Edge | 12+ |

### 浏览器（HTTP/3）

| 浏览器 | 起始版本 |
| --- | --- |
| Chrome | 87+（2020-11） |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 87+ |

### 服务器

| 服务器 | HTTP/2 | HTTP/3 |
| --- | --- | --- |
| nginx | 1.9.5+（默认开） | **1.25.0+**（实验） |
| Apache | 2.4.17+（mod_http2） | 仍在路上（实验模块） |
| Cloudflare | 默认 | 默认 |
| Fastly | 默认 | 默认 |
| Akamai | 默认 | 默认 |
| Caddy | 默认 | 2.6+ |
| Node.js | 内置（http2） | 实验模块 |
| h2o | 默认 | 默认 |

## RFC 与版本状态

| RFC | 标题 | 年代 | 状态 |
| --- | --- | --- | --- |
| 7540 | HTTP/2 | 2015-05 | **被 RFC 9113 取代** |
| 7541 | HPACK | 2015-05 | 现行 |
| 8297 | 103 Early Hints | 2017-12 | 现行 |
| 9000 | QUIC 传输 | 2021-05 | 现行 |
| 9001 | QUIC + TLS 集成 | 2021-05 | 现行 |
| 9002 | QUIC 丢包与拥塞 | 2021-05 | 现行 |
| **9113** | **HTTP/2** | **2022-06** | **现行** |
| **9114** | **HTTP/3** | **2022-06** | **现行** |
| 9204 | QPACK | 2022-06 | 现行 |
| 9218 | Extensible Prioritization | 2022-06 | 现行 |

## 官方资源

- HTTP/2：[https://http2.github.io/](https://http2.github.io/) · [RFC 9113](https://www.rfc-editor.org/rfc/rfc9113)
- HTTP/3：[https://http3-explained.haxx.se/](https://http3-explained.haxx.se/) · [RFC 9114](https://www.rfc-editor.org/rfc/rfc9114)
- QUIC：[https://quicwg.org/](https://quicwg.org/) · [RFC 9000](https://www.rfc-editor.org/rfc/rfc9000)
- HPACK：[RFC 7541](https://www.rfc-editor.org/rfc/rfc7541) · QPACK：[RFC 9204](https://www.rfc-editor.org/rfc/rfc9204)
- Priority：[RFC 9218](https://www.rfc-editor.org/rfc/rfc9218) · [web.dev Fetch Priority](https://web.dev/articles/fetch-priority)
- 103 Early Hints：[RFC 8297](https://www.rfc-editor.org/rfc/rfc8297) · [web.dev Early Hints](https://web.dev/articles/ease-your-cache-with-103-early-hints)
- MDN：[HTTP/2 词汇表](https://developer.mozilla.org/en-US/docs/Glossary/HTTP_2) · [HTTP/3 词汇表](https://developer.mozilla.org/en-US/docs/Glossary/HTTP_3)
- Chrome：[Removing HTTP/2 Server Push](https://developer.chrome.com/blog/removing-push)
- cloudflare/quiche：[https://github.com/cloudflare/quiche](https://github.com/cloudflare/quiche)
- Cloudflare HTTP/3：[https://www.cloudflare.com/learning/performance/what-is-http3/](https://www.cloudflare.com/learning/performance/what-is-http3/)
- nginx HTTP/3：[https://nginx.org/en/docs/http/ngx_http_v3_module.html](https://nginx.org/en/docs/http/ngx_http_v3_module.html)
