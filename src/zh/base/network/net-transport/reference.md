---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- 传输层 = 进程到进程；端口 16 位三段（知名/注册/动态）；socket = IP + 端口
- UDP：无连接、8 字节首部、不保证；TCP：面向连接、可靠有序、20~60 字节首部
- 三次握手 SYN→SYN+ACK→ACK；四次挥手 FIN→ACK→FIN→ACK；TIME_WAIT 等 2MSL
- 可靠传输：序列号（按字节）+ 累积确认 + 超时重传 RTO + 快速重传（3 重复 ACK）+ SACK
- 流量控制 rwnd（护接收方）vs 拥塞控制 cwnd（护网络）；发送窗口 = min(rwnd, cwnd)
- 拥塞四阶段：慢启动（指数）/ 拥塞避免（线性）/ 快重传 / 快恢复；AIMD
- 拥塞算法：Reno → CUBIC（Linux 默认）→ BBR
- TCP 队头阻塞：有序交付代价；HTTP/2 仍受困 → QUIC 用 UDP 绕开

## TCP vs UDP 全面对比

| 维度 | TCP | UDP |
| --- | --- | --- |
| 连接 | 面向连接（三次握手） | 无连接 |
| 可靠性 | 可靠（确认 + 重传） | 尽力而为，不保证 |
| 顺序 | 有序（字节流） | 不保证顺序 |
| 速度 | 较慢 | 快 |
| 首部开销 | 20~60 字节 | 8 字节 |
| 流量控制 | 有（rwnd） | 无 |
| 拥塞控制 | 有（cwnd） | 无 |
| 广播/多播 | 不支持 | 支持 |
| 典型应用 | 网页/API/文件/邮件 | DNS/音视频/游戏/QUIC |

## 三次握手与四次挥手

| 阶段 | 报文 | 要点 |
| --- | --- | --- |
| 建连 | SYN → SYN+ACK → ACK | 同步双向初始序列号；三次才能确认双向收发能力 + 防历史连接 |
| 断连 | FIN → ACK → FIN → ACK | 全双工各自关闭；中间有半关闭 |
| TIME_WAIT | 主动关闭方等 2MSL | 保证最后 ACK 送达 + 旧报文消亡 |
| CLOSE_WAIT 堆积 | 应用忘 `close()` | 排查信号：被动关闭方未主动关闭 |

> SYN 洪水：伪造源 IP 海量 SYN 塞满半连接队列；防护用 SYN Cookie（不预分配资源，信息编码进 ISN）。

## 可靠传输机制

| 机制 | 作用 |
| --- | --- |
| 序列号 | 按字节编号，支持有序与去重 |
| 累积确认 ACK | 确认号 = 期待的下一个字节，确认其前所有字节已收 |
| 超时重传 RTO | 按 RTT 动态估算（RFC 6298）；Karn 算法 + 指数退避 |
| 快速重传 | 收到 3 个重复 ACK 即重传，不等超时 |
| SACK | 选择确认，只重传真正丢失的段 |

## 流量控制 vs 拥塞控制

| | 流量控制 | 拥塞控制 |
| --- | --- | --- |
| 保护对象 | **接收方**（别被压垮） | **网络**（别拥塞崩溃） |
| 核心变量 | 接收窗口 rwnd（入报文） | 拥塞窗口 cwnd（发送方本地估算） |
| 机制 | 滑动窗口、零窗口探测 | 慢启动/拥塞避免/快重传/快恢复 |

> 发送窗口 = min(rwnd, cwnd)，谁更紧听谁的。拥塞算法：Reno（丢包砍半）→ CUBIC（Linux 默认，三次函数）→ BBR（Google，基于带宽与时延建模，不靠丢包）。

## TCP 队头阻塞与 QUIC

- **TCP 队头阻塞（HOL）**：TCP 向应用层保证有序交付，一个段丢失，后面已到达的段也被卡住等重传。
- HTTP/2 多路复用消除了**应用层**队头阻塞，但所有流跑在一条 TCP 上，仍困于 **TCP 层**队头阻塞——弱网下甚至不如多连接的 HTTP/1.1。
- **QUIC** 基于 UDP 自建传输，每个流独立重传，丢包只影响该流——这是 HTTP/3 的根基（详见 [HTTP 演进与性能](../net-http-evolution/guide-line/http3-quic)）。

## 权威链接

- [MDN: TCP](https://developer.mozilla.org/en-US/docs/Glossary/TCP) · [UDP](https://developer.mozilla.org/en-US/docs/Glossary/UDP) · [TCP 握手](https://developer.mozilla.org/en-US/docs/Glossary/TCP_handshake) · [慢启动](https://developer.mozilla.org/en-US/docs/Glossary/TCP_slow_start)
- [RFC 9293: TCP](https://www.rfc-editor.org/rfc/rfc9293) · [RFC 768: UDP](https://www.rfc-editor.org/rfc/rfc768) · [RFC 6298: RTO](https://www.rfc-editor.org/rfc/rfc6298)
- [Cloudflare: TCP/IP](https://www.cloudflare.com/learning/ddos/glossary/tcp-ip/) · [High Performance Browser Networking](https://hpbn.co/)

## 相关页

- [入门](./getting-started) · [传输层与端口·复用分用](./guide-line/transport-ports-mux) · [UDP 协议与适用场景](./guide-line/udp-protocol)
- [TCP 三次握手与四次挥手](./guide-line/tcp-handshake) · [TCP 可靠传输](./guide-line/tcp-reliable)
- [流量控制与拥塞控制](./guide-line/flow-congestion-control) · [TCP vs UDP 选型与队头阻塞](./guide-line/tcp-vs-udp-hol)
