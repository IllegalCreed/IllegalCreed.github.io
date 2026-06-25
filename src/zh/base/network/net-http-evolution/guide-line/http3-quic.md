---
layout: doc
outline: [2, 3]
---

# HTTP/3 与 QUIC

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- **HTTP/3 = HTTP over QUIC**，语义与 HTTP/1.1、HTTP/2 完全一致（仍是请求/响应、方法、状态码、头部），只换掉了底层传输（RFC 9114）。
- **QUIC 是基于 UDP 构建的新传输协议**（RFC 9000），运行在用户态，可随浏览器/服务端更新快速演进，绕开了 TCP 被操作系统内核与中间设备「焊死」的困境。
- **彻底解决 TCP 层队头阻塞**：HTTP/2 的多路复用仍跑在单条 TCP 上，一个包丢失会卡住该连接的所有流；QUIC 为每个流独立做丢包检测与重传，丢包只影响那一个流。
- **内置 TLS 1.3 加密**：QUIC 把 TLS 1.3 握手融进自己的握手里，连接建立即加密，没有「明文 QUIC」。
- **更少往返**：首次连接 **1-RTT** 即可发数据；对已访问过的源可做 **0-RTT**，握手包里直接捎带请求，首屏更快。
- **连接迁移（Connection ID）**：连接由 Connection ID 而非「四元组」标识，Wi-Fi ↔ 蜂窝切换、IP 变化不断连，对移动端意义重大。
- **QPACK**（RFC 9204）：HPACK 的 QUIC 适配版，用独立的编码器/解码器流化解「动态表更新」与「流乱序到达」的矛盾。
- **升级靠 Alt-Svc 头**：浏览器通常先用 HTTP/2 连上，看到响应里的 `Alt-Svc: h3=":443"` 后，后续请求才异步切到 HTTP/3。
- **支持现状（caniuse，2026-06）**：HTTP/3 全球可用率约 **92%**，Chrome 87+ / Edge 87+ / Firefox 88+ / Safari 16+ / Opera 74+ 均默认开启；主流 CDN（Cloudflare、Fastly、Akamai、Google、Cloudfront 等）已大面积铺开。

## 一、为什么 HTTP/2 还不够：TCP 层的队头阻塞

[上一篇](./http2-hpack-push)讲到 HTTP/2 用二进制分帧 + 多路复用，消除了 HTTP/1.1 的「应用层」队头阻塞——多个请求可以在一条连接上并发交错。但它把所有流塞进**同一条 TCP 连接**，于是问题下沉到了传输层。

TCP 是一个**严格有序的字节流**：它向上层保证「按发送顺序、无缺漏」地交付数据。一旦某个 TCP 报文段丢失，后到的报文段即使已经在接收端内核缓冲区里，也必须**等待重传补齐**，才能继续向上交付。

::: warning TCP 层队头阻塞（TCP Head-of-Line Blocking）
HTTP/2 在一条 TCP 连接上跑了流 A、B、C。如果属于流 A 的一个 TCP 包丢了，**B 和 C 的数据明明已经到达接收端，却被 TCP 卡着不交付**——因为 TCP 不知道「流」的存在，它只认字节序。结果：一次丢包，全连接所有流一起阻塞。

这正是 HTTP/2 在弱网/高丢包环境下，有时反而不如「多条 TCP 连接的 HTTP/1.1」的原因。
:::

MDN 一句话点破：

> HTTP/2 runs over a single TCP connection, so packet loss detection and retransmission handled at the TCP layer can block all streams.

要根治，必须让传输层「认识流」，对每个流独立处理丢包——而 TCP 做不到。于是 QUIC 登场。

## 二、QUIC 是什么：跑在 UDP 上的新传输层

**QUIC** 是一个多路复用的传输协议，构建在 **UDP** 之上（RFC 9000）。UDP 是无连接、不保证顺序与可靠的「裸数据报」，QUIC 在其之上**自己实现**了连接管理、可靠传输、丢包检测、重传、拥塞控制和流量控制——相当于把 TCP 的能力在用户态重新造了一遍，但造得更聪明。

```
┌───────────────────────────────┐   ┌───────────────────────────────┐
│            HTTP/2              │   │            HTTP/3              │
├───────────────────────────────┤   ├───────────────────────────────┤
│             TLS               │   │   QUIC（含 TLS 1.3、多路复用、  │
├───────────────────────────────┤   │   可靠传输、拥塞控制、流控）    │
│             TCP               │   ├───────────────────────────────┤
├───────────────────────────────┤   │             UDP               │
│             IP                │   ├───────────────────────────────┤
└───────────────────────────────┘   │             IP                │
                                     └───────────────────────────────┘
```

::: info 为什么是 UDP，而不是改造 TCP？
TCP 实现在**操作系统内核**里，且全球海量中间设备（防火墙、NAT、负载均衡）对 TCP 行为有硬编码假设。想给 TCP 加新特性，等内核升级 + 设备更新可能要十年。QUIC 选择把协议栈放进**用户态**（随浏览器、随服务端程序分发），可以像普通软件一样快速迭代发版。而 UDP 几乎在所有网络里都能通行，是承载新协议的理想「管道」。
:::

## 三、QUIC 如何解决队头阻塞：流是一等公民

QUIC 把「流（stream）」做成了传输层的原生概念。一条 QUIC 连接里有多个独立的流，**每个流独立维护自己的丢包检测与重传状态**。

> QUIC runs multiple streams over UDP and implements packet loss detection and retransmission independently for each stream, so that if an error occurs, only the stream with data in that packet is blocked.
> ——MDN, Evolution of HTTP

| 场景 | HTTP/2 over TCP | HTTP/3 over QUIC |
| --- | --- | --- |
| 流 A 的一个包丢失 | B、C 已到达也被卡住，全连接阻塞 | 只有流 A 等重传，B、C 照常交付 |
| 传输层是否「认识流」 | 否，只认字节序 | 是，流是一等公民 |
| 弱网/高丢包表现 | 丢包放大，整体变慢 | 影响被隔离在单个流内 |

这就是 QUIC 相对 HTTP/2 最核心的传输层改进：**把队头阻塞从「连接级」降到「流级」**。注意——单个流内部仍然是有序可靠的，丢包仍会阻塞「这个流自己」，只是不再殃及其他流。

## 四、连接建立：1-RTT 与 0-RTT

QUIC 把 **TLS 1.3 握手融进了自己的握手**，加密与连接建立一次完成，没有「先 TCP 三次握手、再 TLS 握手」的串行等待。

> QUIC integrates the TLS handshake into the initial QUIC handshake, reducing the number of messages that must be exchanged during setup.
> ——MDN, Glossary: QUIC

| 阶段 | TCP + TLS 1.3（HTTP/2） | QUIC（HTTP/3） |
| --- | --- | --- |
| 传输层握手 | TCP 三次握手：**1 RTT** | 与 TLS 合并 |
| 加密握手 | TLS 1.3：**1 RTT** | 合并进 QUIC 握手 |
| 首次连接合计 | 约 **2 RTT** 才能发首个请求 | **1 RTT**（首次） |
| 恢复已知源 | TLS 1.3 也支持 0-RTT，但传输层仍需 TCP 握手 | **0-RTT**：握手包直接捎带请求数据 |

::: tip 0-RTT 对首屏的意义
对**回头客**（之前连过的源），QUIC 可缓存握手参数，客户端在第一个数据包里就把 HTTP 请求一起发出去——**零往返即开始传业务数据**。在移动端高延迟（RTT 动辄上百毫秒）场景，省下的往返直接转化为更快的首屏。
:::

::: warning 0-RTT 的安全代价：重放攻击
0-RTT 数据在握手完成前发出，理论上可被**重放（replay）**。因此规范要求：**只有幂等且无副作用的请求**（如 `GET`）才适合走 0-RTT，绝不能把「下单」「转账」这类有副作用的写操作放进 0-RTT 包。这是协议层的硬约束，前端发起预连接/预请求时需留意。
:::

## 五、连接迁移：换网不断连（移动端杀手锏）

TCP 连接由「**四元组**」标识：源 IP、源端口、目的 IP、目的端口。手机从 Wi-Fi 切到蜂窝，源 IP 一变，四元组失效，**TCP 连接直接断开**，必须重新握手——表现就是视频卡顿、下载中断、页面要重连。

QUIC 用一个与网络路径无关的 **Connection ID** 来标识连接。IP/端口变了，只要 Connection ID 不变，服务端就知道「还是同一个连接」，**无缝继续**，无需重新握手。

::: tip 为什么这对移动端特别重要
移动用户网络切换是常态：进电梯、出地铁、Wi-Fi 信号衰减自动回落蜂窝……每一次切换在 TCP 时代都意味着断连重连。QUIC 的连接迁移让长连接（视频流、长轮询、WebTransport、实时推送）在切网时**不中断**，体验连续性大幅提升。
:::

## 六、QPACK：HPACK 在乱序世界里的适配版

HTTP/2 用 **HPACK** 压缩头部，靠一张「动态表」记忆最近用过的头部字段。但 HPACK 严重依赖 TCP 的**有序交付**——动态表的增删必须严格按顺序应用，否则编解码两端的表会错位。

而 QUIC 的流是**乱序到达**的（这正是它不阻塞的代价）。如果照搬 HPACK，一旦携带「更新动态表」的帧晚于「引用该表项」的帧到达，解码就会失败。

**QPACK**（RFC 9204）为此而生：

- 头部数据仍随各自的请求流传输，但**动态表的更新指令走两条专用单向流**——编码器流（encoder stream）与解码器流（decoder stream）。
- 引用动态表时，QPACK 允许「**阻塞流（blocked stream）**」：若某个请求引用了尚未通过编码器流送达的表项，该请求流会短暂等待表项就绪，**而不会阻塞其他流**。
- 编码器可通过配置（如 `SETTINGS_QPACK_BLOCKED_STREAMS`）控制允许多少阻塞流，在**压缩率**与**队头阻塞风险**之间权衡：用动态表越激进，压缩越好，但乱序导致的等待风险越高。

::: info 一句话记住 QPACK
HPACK 假设「头部按序到」，QPACK 承认「头部可能乱序到」——它把易引发依赖的动态表更新拆到独立流，并允许个别流为等表项而短暂阻塞，从而在保留头部压缩收益的同时，不破坏 QUIC「流间互不阻塞」的根本优势。
:::

## 七、HTTP/3 怎么协商：先 HTTP/2，再靠 Alt-Svc 升级

浏览器**不会**对一个新域名直接发 HTTP/3——它不知道对方支不支持，且 UDP 443 可能被网络封锁。实际流程是「**先连上、再升级**」：

1. 浏览器照常用 HTTPS（HTTP/2 over TCP）连接源站。
2. 服务端在响应头里带上 **`Alt-Svc`**，声明「我在某端口也提供 HTTP/3」。
3. 浏览器记下这条信息，**后续请求**才异步尝试用 HTTP/3（QUIC）连接；若 QUIC 连不通，自动回退到 HTTP/2。

```http
HTTP/2 200 OK
content-type: text/html
# 声明本源在 443 端口也支持 h3，缓存 1 小时；同时列出 h2 备选
alt-svc: h3=":443"; ma=3600, h2=":443"; ma=3600
```

MDN 对 `Alt-Svc` 的定位：

> [它] allows new protocol versions to be advertised without affecting in-flight requests... Using an alternative service is not visible to the end user; it does not change the URL or the origin of the request and does not introduce additional round trips.

常用参数：

- `h3=":443"`：ALPN 协议标识 `h3` + 备用授权地址（`":443"` 表示同主机 443 端口）。早期草案曾用 `h3-29`、`h3-25` 等带版本号的标识，现已统一为 `h3`。
- `ma=<秒>`：该声明的有效期（max-age），不写默认 24 小时。
- `persist=1`：网络配置变化后仍保留该条目（可选）。

::: tip 前端如何确认走的是 HTTP/3
打开 DevTools → Network 面板，把 **Protocol** 列调出来：值为 `h3` 即 HTTP/3，`h2` 即 HTTP/2。注意「冷启动」第一次访问往往仍是 `h2`，需刷新或后续请求才升级到 `h3`——这是 Alt-Svc 机制的正常现象，不是配置错误。
:::

## 八、部署与浏览器支持现状（2026-06）

依据 [caniuse.com/http3](https://caniuse.com/http3)：

| 浏览器 | 默认支持版本 |
| --- | --- |
| Chrome / Edge | 87+ |
| Firefox | 88+ |
| Safari（含 iOS） | 16.0+ |
| Opera | 74+ |

- **全球可用率约 92%**，HTTP/3 已是现代浏览器的标配（IE 与 Opera Mini 不支持）。
- **CDN/服务端**：Cloudflare、Fastly、Akamai、Google、CloudFront 等主流 CDN 均已支持，多数只需在控制台开关即可启用；Nginx 自 1.25 起原生支持 QUIC/HTTP/3。
- **回退健壮**：由于走 Alt-Svc「先 H2 后升级」，即便客户端或中间网络不支持 QUIC（如封禁 UDP 443），也会安全回退到 HTTP/2，不影响可用性——这让「开启 HTTP/3」成为低风险的纯增益操作。

## 小结

HTTP/3 没有改动 HTTP 的语义，而是把底座从 TCP 换成了**跑在 UDP 上、用户态、内置 TLS 1.3 的 QUIC**。它用「流是一等公民」根治了 HTTP/2 残留的 TCP 层队头阻塞，用「握手合并」把首次连接压到 1-RTT、回头客做到 0-RTT，用 **Connection ID** 实现换网不断连，并以 **QPACK** 在乱序传输下守住头部压缩收益。对前端而言，开启它通常只是 CDN 上的一个开关 + Alt-Svc 声明，借助安全回退几乎零风险，却能在弱网与移动端换来实打实的延迟与连续性收益。下一篇我们横向拉通三代协议，落到具体的前端性能实践。

---

- 上一页：[HPACK 头部压缩与服务器推送](./http2-hpack-push)
- 下一页：[版本对比与前端性能实践](./version-comparison-performance)
