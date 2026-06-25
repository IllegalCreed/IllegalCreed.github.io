---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- 分层 = 分而治之；服务/接口纵向、协议对等层横向
- OSI 七层（参考）：物理/数据链路/网络/传输/会话/表示/应用
- TCP/IP 四层（事实标准）：网络接口/网际/传输/应用；五层 = 拆网络接口为物理+数据链路
- PDU：数据 → 段/数据报 → 包 → 帧 → 比特
- 封装自顶向下加头、解封装自底向上剥头（镜像）
- 协议归层：HTTP/DNS 应用、TCP/UDP 传输、IP/ICMP 网络、Ethernet/ARP 链路
- 设备归层：hub 物理层、switch 数据链路层、router 网络层
- 端到端：MAC 逐跳重写、IP 端到端不变；TTL 逐跳 −1

## 三模型对照

| OSI 七层 | TCP/IP 四层 | 五层教学 | 数据单元(PDU) |
| --- | --- | --- | --- |
| 7 应用 / 6 表示 / 5 会话 | 应用层 | 应用层 | 数据 / 报文 |
| 4 传输 | 传输层 | 传输层 | 段 / 数据报 |
| 3 网络 | 网际层 | 网络层 | 包 / 分组 |
| 2 数据链路 | 网络接口层 | 数据链路层 | 帧 |
| 1 物理 | 网络接口层 | 物理层 | 比特 |

## OSI 七层职责

| 层 | 职责 | 典型协议/设备 |
| --- | --- | --- |
| 7 应用 | 为应用提供网络服务 | HTTP/DNS/SMTP |
| 6 表示 | 编码、加密、压缩 | TLS、编码格式 |
| 5 会话 | 建立/管理会话 | 会话管理 |
| 4 传输 | 进程到进程、可靠/不可靠 | TCP/UDP、端口 |
| 3 网络 | 逻辑寻址与路由 | IP/ICMP、路由器 |
| 2 数据链路 | 相邻节点成帧与 MAC 寻址 | Ethernet、交换机 |
| 1 物理 | 比特与物理信号 | 网线、网卡、集线器 |

## 协议与设备归层

| TCP/IP 层 | 协议 | 设备 |
| --- | --- | --- |
| 应用层 | HTTP/HTTPS/DNS/FTP/SMTP/WebSocket/SSH | —（网关做协议翻译） |
| 传输层 | TCP/UDP | — |
| 网际层 | IP/ICMP/IGMP | 路由器 router |
| 网络接口层 | Ethernet/Wi-Fi/PPP/ARP | 交换机 switch / 集线器 hub |

> ARP 归属有争议：OSI 语境常归第 2 层、TCP/IP 语境归链路层，实务答「链路层 / OSI 第 2 层」最稳。设备隔离：hub 不隔离、switch 隔离冲突域、router 隔离广播域。

## 封装与解封装

```
发送方（自顶向下封装）          接收方（自底向上解封装）
  HTTP 报文                        HTTP 报文
  + TCP 头 → 段                    ↑ 剥 TCP 头
  + IP 头  → 包                    ↑ 剥 IP 头
  + 帧头尾 → 帧                    ↑ 剥帧头尾（校验 FCS）
  → 比特上线路  ───────────────▶  比特进网卡
```

> 每层只认自己的首部（关注点分离）：链路层校验 FCS、网络层认目的 IP、传输层按端口分用。MTU 超限触发 IP 分片，现代用 PMTUD 规避。

## 端到端旅程要点

- 输入 URL → ① DNS 解析（域名→IP）→ ② TCP 三次握手 → ③ TLS 握手 → ④ HTTP 请求/响应。
- 发送方自顶向下封装、接收方自底向上解封装；响应原路返回。
- 中途：**交换机**按目的 MAC 转发（二层）；**路由器**拆 IP 头、查路由表逐跳转发（三层），每跳重写 MAC、TTL −1，但**源/目的 IP 端到端不变**。

## 权威链接

- [Cloudflare: OSI 模型](https://www.cloudflare.com/learning/ddos/glossary/open-systems-interconnection-model-osi/)
- [Wikipedia: OSI model](https://en.wikipedia.org/wiki/OSI_model) · [Internet protocol suite](https://en.wikipedia.org/wiki/Internet_protocol_suite)
- [RFC 1122: Host Requirements](https://www.rfc-editor.org/rfc/rfc1122) · [MDN: Protocol](https://developer.mozilla.org/en-US/docs/Glossary/Protocol)

## 相关页

- [入门](./getting-started) · [为什么要分层](./guide-line/why-layering) · [OSI 七层逐层职责](./guide-line/osi-seven-layers)
- [TCP/IP 四层与五层教学模型](./guide-line/tcpip-five-layer) · [数据封装与解封装](./guide-line/encapsulation)
- [两模型对照与协议归层](./guide-line/model-comparison) · [一个 HTTP 请求穿越协议栈的端到端旅程](./guide-line/end-to-end-journey)
