---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- 网络层 = IP 寻址 + 路由（逐跳转发）；IP 尽力而为、无连接、不可靠
- IPv4 32 位；私有 `10/8`·`172.16/12`·`192.168/16`；环回 `127.0.0.1`；任意/监听 `0.0.0.0`
- 子网掩码 AND IP = 网络地址；CIDR `/n`；可用主机 = `2^(32−n) − 2`
- IPv6 128 位、零压缩 `::` 仅一次、`/64` 前缀、SLAAC、无需 NAT
- 路由器：最长前缀匹配、逐跳转发、TTL−1；默认网关 `0.0.0.0/0`
- 静态路由（手工）vs 动态路由（RIP 跳数 / OSPF 链路状态 / BGP 域间）
- ICMP 协议号 1；ping=Echo(8/0)、traceroute 借 Time Exceeded(11)
- NAT 改写 IP+端口、PAT 端口复用共享公网 IP；SNAT 改源、DNAT 改目的
- DHCP DORA：Discover→Offer→Request→Ack；UDP 67/68

## IPv4 地址

| 类别 | 范围 | 用途 |
| --- | --- | --- |
| 私有 A | `10.0.0.0/8` | 大型内网 |
| 私有 B | `172.16.0.0/12` | 中型内网 |
| 私有 C | `192.168.0.0/16` | 家用/小型 |
| 环回 | `127.0.0.0/8` | 本机（`127.0.0.1`） |
| 链路本地 | `169.254.0.0/16` | 自动私有地址 |
| 任意/监听 | `0.0.0.0` | 监听所有接口 / 默认路由 |
| 受限广播 | `255.255.255.255` | 本网段广播 |

## 子网与 CIDR 计算

| CIDR | 掩码 | 地址数 | 可用主机 |
| --- | --- | --- | --- |
| `/24` | 255.255.255.0 | 256 | 254 |
| `/25` | 255.255.255.128 | 128 | 126 |
| `/26` | 255.255.255.192 | 64 | 62 |
| `/30` | 255.255.255.252 | 4 | 2（点对点） |
| `/31` | — | 2 | 2（RFC 3021 点对点） |
| `/32` | — | 1 | 1（单主机） |

> 网络地址 = IP AND 掩码（主机位清零）；广播地址 = 主机位全 1；可用主机 = 地址数 − 2（扣网络/广播地址）。

## IPv6 要点

| 项 | 说明 |
| --- | --- |
| 长度 | 128 位，8 组十六进制，冒号分隔 |
| 零压缩 | 连续全零组用 `::` 折叠，**全址仅一次** |
| 前缀 | `/64` 网络前缀 + 64 位接口标识 |
| 全局单播 | `2000::/3` |
| 链路本地 | `fe80::/10`（接口必有） |
| 组播 | `ff00::/8`（IPv6 无广播） |
| 过渡 | 双栈 / 隧道 6in4 / NAT64+DNS64 |

## 路由与诊断

| 项 | 要点 |
| --- | --- |
| 路由表 | 目的网络/掩码、下一跳、出接口、度量 |
| 最长前缀匹配 | 多条命中选最具体（前缀最长）的 |
| 默认网关 | `0.0.0.0/0`，前缀长 0，最后兜底 |
| ICMP 报文 | Echo(8/0)、Unreachable(3)、Time Exceeded(11)、Redirect(5) |
| ping | Echo Request/Reply 测连通 + RTT；常被防火墙拦 |
| traceroute | TTL 递增逐跳暴露路径；Linux UDP、Windows ICMP |

## NAT 与 DHCP

| 项 | 要点 |
| --- | --- |
| NAT | 私网↔公网，改写 IP（+端口），维护转换表 |
| PAT/NAPT | 端口复用，多设备共享一个公网 IP |
| SNAT / DNAT | 改源（出网）/ 改目的（端口转发让外部进入） |
| NAT 穿透 | NAT 阻碍 P2P → WebRTC 用 STUN/TURN/ICE（见实时通信叶） |
| DHCP DORA | Discover → Offer → Request → Ack；UDP 67/68 |
| 租约 | T1（50%）单播续租、T2（87.5%）广播续租 |

## 权威链接

- [Cloudflare: Internet Protocol](https://www.cloudflare.com/learning/network-layer/internet-protocol/) · [routing](https://www.cloudflare.com/learning/network-layer/what-is-routing/) · [subnet](https://www.cloudflare.com/learning/network-layer/what-is-a-subnet/) · [NAT](https://www.cloudflare.com/learning/network-layer/what-is-nat/)
- [RFC 791: IPv4](https://www.rfc-editor.org/rfc/rfc791) · [RFC 8200: IPv6](https://www.rfc-editor.org/rfc/rfc8200) · [RFC 792: ICMP](https://www.rfc-editor.org/rfc/rfc792) · [RFC 1918: 私有地址](https://www.rfc-editor.org/rfc/rfc1918)

## 相关页

- [入门](./getting-started) · [IP 协议与 IPv4 寻址](./guide-line/ip-protocol-ipv4) · [子网掩码与 CIDR 划分](./guide-line/subnet-cidr)
- [IPv6 与过渡技术](./guide-line/ipv6) · [路由原理与路由器/网关](./guide-line/routing-router-gateway)
- [ICMP 与 ping/traceroute](./guide-line/icmp-ping-traceroute) · [NAT 与 DHCP](./guide-line/nat-dhcp)
