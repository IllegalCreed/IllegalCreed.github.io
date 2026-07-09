---
layout: doc
---

# 传输层 TCP 与 UDP

传输层在 IP（负责主机到主机）之上，提供**进程到进程**的逻辑通信——靠端口区分应用。它有两大协议：**TCP**（面向连接、可靠、有序，代价是握手开销与队头阻塞）和 **UDP**（无连接、轻量、快，代价是不保证送达）。本叶从端口与复用分用讲起，拆解 UDP 的极简、TCP 的三次握手/四次挥手、可靠传输（序列号/确认/重传）、流量控制与拥塞控制，最后到 TCP vs UDP 选型与 TCP 队头阻塞——也就是 QUIC 诞生的动机。

## 概述

- **传输层职责**：进程到进程通信，靠**端口**（16 位）区分应用；复用（多应用共享网络发送）与分用（按端口分发给进程）；`socket = IP + 端口`。
- **UDP**：无连接、8 字节首部、不保证可靠/有序——换来低延迟低开销，适合 DNS、实时音视频、游戏、QUIC。
- **TCP**：面向连接（三次握手建连、四次挥手断开）、可靠（序列号 + 确认 + 重传 + SACK）、有序（字节流）。
- **两种「控制」**：流量控制（滑动窗口 rwnd，护**接收方**不被压垮）vs 拥塞控制（cwnd + 慢启动/拥塞避免/AIMD，护**网络**不被压垮）。
- **队头阻塞**：TCP 保证有序交付，一个段丢失会阻塞后面已到达的段——这是 HTTP/2 仍受困、QUIC 改用 UDP 的根因（详见「HTTP 演进与性能」叶）。

## 本叶地图

- [入门](./getting-started) —— 传输层全景，TCP 与 UDP 的分工
- [传输层与端口·复用分用](./guide-line/transport-ports-mux) —— 进程到进程、端口分类、复用/分用、socket
- [UDP 协议与适用场景](./guide-line/udp-protocol) —— 无连接、8 字节首部、低延迟场景
- [TCP 三次握手与四次挥手](./guide-line/tcp-handshake) —— 建连/断连、为什么三次/四次、TIME_WAIT、SYN 洪水
- [TCP 可靠传输](./guide-line/tcp-reliable) —— 序列号、累积确认、超时/快速重传、SACK、滑动窗口
- [流量控制与拥塞控制](./guide-line/flow-congestion-control) —— rwnd vs cwnd、慢启动、AIMD、Reno/CUBIC/BBR
- [TCP vs UDP 选型与队头阻塞](./guide-line/tcp-vs-udp-hol) —— 全面对比、选型决策、TCP 队头阻塞与 QUIC
- [参考](./reference) —— TCP vs UDP 对比 + 握手 + 可靠传输 + 流控拥控 + 权威链接

## 文档地址

- [MDN: TCP](https://developer.mozilla.org/en-US/docs/Glossary/TCP) · [UDP](https://developer.mozilla.org/en-US/docs/Glossary/UDP) · [TCP 握手](https://developer.mozilla.org/en-US/docs/Glossary/TCP_handshake)
- [RFC 9293: TCP](https://www.rfc-editor.org/rfc/rfc9293) · [RFC 768: UDP](https://www.rfc-editor.org/rfc/rfc768)
- [Cloudflare: TCP/IP](https://www.cloudflare.com/learning/ddos/glossary/tcp-ip/) · [High Performance Browser Networking](https://hpbn.co/)

## 幻灯片地址

<a href="/SlideStack/net-transport-slide/" target="_blank">传输层 TCP 与 UDP</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=%E4%BC%A0%E8%BE%93%E5%B1%82-tcp-%E4%B8%8E-udp" target="_blank" rel="noopener noreferrer">传输层 TCP 与 UDP 测试题</a>
