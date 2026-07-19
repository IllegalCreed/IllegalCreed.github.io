---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 RFC 9113（HTTP/2）/ RFC 9114（HTTP/3）/ RFC 9000（QUIC）/ RFC 7541（HPACK）/ RFC 9204（QPACK）/ RFC 9218（Priority）/ RFC 8297（103 Early Hints）官方文档，对照 MDN 与 Chrome for Developers 编写

## 速查

- **HTTP/1.1 痛点**：应用层队头阻塞（一条连接一次只能跑一个请求）、每 origin ~6 条连接上限、需域名分片、重复 TCP+TLS 握手
- **HTTP/2（RFC 9113，2022-06 取代 RFC 7540）**：单 TCP 连接 + 二进制分帧 + **多路复用**（一条连接并行上百条 stream）+ **HPACK 头部压缩**（静态表 61 项 + 动态表 + 静态 Huffman）
- **HTTP/2 帧头**：9 字节 = Length(24bit) + Type(8bit) + Flags(8bit) + Reserved(1bit) + Stream ID(31bit)；10 种帧类型（DATA / HEADERS / SETTINGS / WINDOW_UPDATE / GOAWAY / PUSH_PROMISE…）
- **Server Push 已弃用**：Chrome 106（2022-09）默认禁用、采用率从 1.25% 跌到 0.7%、HTTP/3 多数未实现；改用 **103 Early Hints（RFC 8297）** + `<link rel="preload">`
- **新优先级方案**：RFC 9113 弃用旧 PRIORITY 帧（weight 1-256 + dependency tree），改用 RFC 9218 `Priority: u=<0-7>; i=?<0|1>` 头；HTTP/3 用 **PRIORITY_UPDATE 帧**
- **HTTP/3（RFC 9114，2022-06）**：传输层换成 QUIC（基于 **UDP**），TLS 1.3 内嵌，**消除 TCP 队头阻塞**（丢包只阻塞该流）+ **0-RTT 重连** + **连接迁移**（Connection ID）
- **QPACK（RFC 9204）**：HTTP/3 的头部压缩，静态表 **99 项**，用独立 Encoder/Decoder 单向流做显式 ACK 消除压缩层 HOL
- **Alt-Svc 协商 HTTP/3**：`Alt-Svc: h3=":443"; ma=86400` —— 首次仍走 h2，缓存后下次才尝试 h3（**UDP/443 必须放通**）
- **Fetch Priority API**：HTML 层 `fetchpriority="high|low|auto"` 与协议优先级协作，弥补浏览器启发式无法识别 hero/LCP 资源
- **域名分片在 h2 失效**：单连接多路复用让 static1/static2 分片变成纯开销（DNS + TCP + TLS 重复）
- **0-RTT 重放风险**：early data 仅放幂等 GET/HEAD，POST / 支付必须等 1-RTT

## HTTP/2·HTTP/3 是什么

HTTP/2 与 HTTP/3 是 HTTP 语义在**传输层**的两次升级，HTTP 方法、状态码、头字段等语义保持不变，但底层帧格式、连接管理、头部编码完全重写：

- **HTTP/2**：把请求/响应搬到「单 TCP 连接上的二进制多路复用流」，配合 HPACK 头部压缩。所有现代浏览器与主流服务器（nginx 1.9.5+ / Apache 2.4.17+ / Cloudflare / Caddy / Node.js / h2o）默认支持
- **HTTP/3**：传输层从 TCP+TLS 换成 QUIC（基于 UDP），握手与加密合并、流独立、连接可迁移。Chrome 87+ / Firefox 88+ / Safari 14+ / Edge 87+ 全部默认支持；nginx 1.25.0+ / Cloudflare / Fastly / Akamai / CDN 普遍提供

> HTTP/2 ≠ HTTP/3。前者解决「应用层队头阻塞」，后者进一步解决「TCP 层队头阻塞」并引入连接迁移、0-RTT。

## HTTP/1.1 痛点回顾

理解 HTTP/2 / HTTP/3 的优化价值，必须先看 HTTP/1.1 的两大顽疾：

**痛点 1：应用层队头阻塞**

HTTP/1.1 一条 TCP 连接同一时刻只能处理一个请求/响应——前一个响应未完成，后续请求必须排队。浏览器只能开多条连接来缓解，但每个 origin 默认只有 ~6 条连接上限。

**痛点 2：域名分片（Domain Sharding）**

为绕开 ~6 条连接上限，HTTP/1.1 时代发明了「域名分片」——把资源分散到 `static1.example.com` / `static2.example.com` / `cdn.example.com` 多个子域，每个子域独立 6 条连接。代价是每个分片都要额外 DNS + TCP + TLS 三次握手。

**痛点 3：重复握手开销**

每条 TCP 连接都要 DNS（RTT）+ TCP 三次握手（1 RTT）+ TLS 握手（1-2 RTT）。HTTP/1.1 时代页面动辄开 12-18 条连接，握手往返开销巨大。

**痛点 4：未压缩的文本头**

HTTP/1.1 的 header 是 ASCII 文本，Cookie + User-Agent + Accept-* 这些字段在每个请求里原样重复传输，浪费带宽。

## HTTP/2·HTTP/3 速览

| 维度 | HTTP/1.1 | HTTP/2 | HTTP/3 |
| --- | --- | --- | --- |
| 传输层 | TCP | TCP | **QUIC（UDP）** |
| 加密 | 可选（HTTPS） | 必须 TLS（事实标准） | **TLS 1.3 内嵌** |
| 多路复用 | 无（每连接一请求） | **有**（单 TCP 上多 stream） | **有**（单 QUIC 上多 stream） |
| 队头阻塞 | 应用层 + TCP 层 | 应用层解决、**TCP 层仍在** | **应用层与传输层都解决** |
| 头部压缩 | 无 | **HPACK** | **QPACK** |
| 连接迁移 | 不支持 | 不支持 | **支持**（Connection ID） |
| 重连握手 | 3 RTT（TCP + TLS） | 3 RTT | **0-RTT**（重连）/ 1-RTT（首次） |
| Server Push | 无 | 有（**已弃用**，Chrome 106 禁用） | 多数未实现 |
| 优先级 | 无 | RFC 9218 Priority 头 | RFC 9218 + PRIORITY_UPDATE 帧 |
| 标准 RFC | 7230-7235（现 9110-9112） | **9113**（2022-06） | **9114**（2022-06） |

> 三代协议语义一致（HTTP 方法 / 状态码 / 头字段不变），但传输层与帧格式完全不同。

## 当前版本状态

| 项 | 取值 |
| --- | --- |
| HTTP/2 现行标准 | RFC 9113（2022-06，取代 RFC 7540） |
| HPACK 现行标准 | RFC 7541（2015-05，未变） |
| HTTP/3 现行标准 | RFC 9114（2022-06） |
| QUIC 传输 | RFC 9000（2021-05） |
| QUIC TLS 集成 | RFC 9001 |
| QUIC 丢包与拥塞 | RFC 9002 |
| QPACK | RFC 9204（2022-06） |
| 优先级方案 | RFC 9218（取代 RFC 7540 PRIORITY 帧） |
| Server Push | Chrome 106（2022-09）默认禁用，事实废弃 |
| 0-RTT | TLS 1.3（RFC 8446）派生，仅推荐幂等场景 |

## 下一步

- [核心机制详解](./guide-line.md)：HTTP/2 多路复用 + HPACK + Server Push 弃用 + 流优先级 + HTTP/3 QUIC + QPACK + 域名分片失效 + 反模式
- [参考](./reference.md)：HTTP/1.1 vs 2 vs 3 完整对比表 + 协议特性矩阵 + 官方资源
