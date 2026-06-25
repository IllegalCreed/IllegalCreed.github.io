---
layout: doc
---

# 网络层与路由

网络层负责把数据包从源主机跨越**多个网络**送达目标主机——靠 **IP 地址**做逻辑寻址、靠**路由器**逐跳转发。它是互联网「网际互联」的核心：上面的传输层只管端到端，下面的链路层只管单跳，唯有网络层把全球无数个网络拼成一张可达的大网。本叶讲清 IP 协议与 IPv4 寻址、子网掩码与 CIDR、IPv6 与过渡、路由原理、ICMP 诊断工具（ping/traceroute），以及 NAT 与 DHCP 两个日常基础设施。

## 概述

- **IP 寻址**：IPv4 32 位点分十进制；公网 vs 私有地址（`10/8`、`172.16/12`、`192.168/16`）；尽力而为、无连接、不可靠。
- **子网与 CIDR**：子网掩码区分网络号/主机号；CIDR `/24` 前缀取代 ABC 分类；可算网络地址、广播地址、可用主机数。
- **IPv6**：128 位、零压缩 `::`、无需 NAT、SLAAC 自动配置；双栈/隧道/NAT64 过渡。
- **路由**：路由器查路由表、**最长前缀匹配**、逐跳转发、TTL−1；默认网关 `0.0.0.0/0`；静态 vs 动态（RIP/OSPF/BGP）。
- **诊断与基础设施**：ICMP（ping 测连通、traceroute 借 TTL 探路径）；NAT（私网共享公网 IP）；DHCP（DORA 四步自动配置）。

## 本叶地图

- [入门](./getting-started) —— 网络层全景，IP 与路由如何协作
- [IP 协议与 IPv4 寻址](./guide-line/ip-protocol-ipv4) —— IP 职责、IPv4 地址、私有/特殊地址、IP 首部
- [子网掩码与 CIDR 划分](./guide-line/subnet-cidr) —— 掩码、CIDR、子网计算、VLSM、路由聚合
- [IPv6 与过渡技术](./guide-line/ipv6) —— 128 位、零压缩、优势、地址类型、双栈/隧道/NAT64
- [路由原理与路由器/网关](./guide-line/routing-router-gateway) —— 路由表、最长前缀匹配、默认网关、静态/动态路由
- [ICMP 与 ping/traceroute](./guide-line/icmp-ping-traceroute) —— ICMP 报文、ping、traceroute 借 TTL 探路
- [NAT 与 DHCP](./guide-line/nat-dhcp) —— NAT/PAT、SNAT/DNAT、NAT 穿透、DHCP DORA
- [参考](./reference) —— IP 寻址 + 子网计算 + 路由表 + ICMP/NAT/DHCP + 权威链接

## 文档地址

- [Cloudflare: Internet Protocol](https://www.cloudflare.com/learning/network-layer/internet-protocol/) · [What is routing](https://www.cloudflare.com/learning/network-layer/what-is-routing/) · [What is NAT](https://www.cloudflare.com/learning/network-layer/what-is-nat/)
- [RFC 791: IPv4](https://www.rfc-editor.org/rfc/rfc791) · [RFC 8200: IPv6](https://www.rfc-editor.org/rfc/rfc8200) · [RFC 792: ICMP](https://www.rfc-editor.org/rfc/rfc792)
- [MDN: IP 地址](https://developer.mozilla.org/en-US/docs/Glossary/IP_Address)

## 幻灯片地址

<a href="/SlideStack/net-ip-routing-slide/" target="_blank">网络层与路由</a>
