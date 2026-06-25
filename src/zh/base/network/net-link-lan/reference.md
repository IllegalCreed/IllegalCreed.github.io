---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- 链路层 = 成帧 + 单跳投递 + 差错检测；MAC 48 位、单跳寻址
- 广播 MAC `FF:FF:FF:FF:FF:FF`；MAC 逐跳重写、IP 端到端不变
- 以太网帧：前导码/目的源 MAC/类型/载荷/FCS；最小 64B、最大 1518B、MTU 1500
- FCS = CRC-32，只检错不纠错，坏帧丢弃
- 交换机二层、MAC 表自学习、每端口一冲突域、默认整网一广播域
- 交换机 vs 集线器：智能转发/全双工 vs 傻广播/半双工
- VLAN 802.1Q 标签（VID 12 位，1~4094）；Access vs Trunk；VLAN 间通信需三层
- ARP：IP→MAC（广播请求/单播应答）；ARP 欺骗 → 中间人；防护 DAI + DHCP Snooping
- Wi-Fi 802.11：CSMA/CA（不能边发边听）；2.4/5/6G；WPA2→WPA3；Wi-Fi 7

## 以太网帧字段

| 字段 | 长度 | 作用 |
| --- | --- | --- |
| 前导码 + SFD | 7 + 1 B | 同步（不计入帧本体） |
| 目的 MAC | 6 B | 接收方地址 |
| 源 MAC | 6 B | 发送方地址 |
| 类型/长度 | 2 B | EtherType（≥1536）或长度（≤1500） |
| 载荷 | 46~1500 B | 上层数据（IP 包），MTU=1500 |
| FCS | 4 B | CRC-32 差错检测 |

> 常见 EtherType：IPv4 `0x0800`、ARP `0x0806`、IPv6 `0x86DD`、VLAN `0x8100`。最小帧 64B（不足补零），最大 1518B（VLAN 1522B）。

## 交换机与冲突域/广播域

| 概念 | 要点 |
| --- | --- |
| MAC 地址表 | 端口↔MAC 映射，自学习（看源学/查目的转），有老化时间 |
| 泛洪 | 未知目的单播 / 广播帧 → 所有其他端口 |
| 冲突域 | 交换机每端口一个独立冲突域（全双工已无冲突） |
| 广播域 | 默认整个交换网络一个；用 VLAN 分割 |
| 交换机 vs 集线器 | 二层智能转发/独享带宽/全双工 vs 物理层傻广播/共享/半双工 |

## VLAN

| 项 | 要点 |
| --- | --- |
| 作用 | 逻辑划分广播域：隔离广播、提升安全与灵活 |
| 802.1Q | 帧中插 4 字节标签（TPID `0x8100` + VID 12 位，1~4094） |
| Access 端口 | 属单一 VLAN，收发不带标签 |
| Trunk 端口 | 承载多 VLAN，带标签（Native VLAN 例外） |
| VLAN 间通信 | 需三层设备（单臂路由 / 三层交换机 SVI） |

## ARP 与 Wi-Fi

| 项 | 要点 |
| --- | --- |
| ARP | IP→MAC（同网段）；广播 Request → 单播 Reply；有缓存 |
| 跨网段 | 解析的是**网关** MAC（帧发给网关，IP 仍指最终目的） |
| ARP 欺骗 | 伪造应答冒充网关 → 中间人/嗅探/断网；防护 DAI + DHCP Snooping |
| ARP ≠ DNS | ARP 解析 IP→MAC（链路层）；DNS 解析域名→IP（应用层） |
| Wi-Fi | IEEE 802.11；SSID/AP/BSS；2.4G 穿透 / 5G·6G 速率 |
| CSMA/CA | 无线不能边发边听 → 先听后发 + 退避 + 逐帧 ACK（避免而非检测冲突） |
| 信道 | 2.4GHz 仅 1/6/11 不重叠 |
| 安全 | WEP（废）→ WPA2（KRACK）→ WPA3（推荐）；链路加密 ≠ 端到端，仍需 HTTPS |
| 标准 | Wi-Fi 4/5/6/6E/7 ↔ 802.11n/ac/ax/be（Wi-Fi 7 = 802.11be，2024） |

## 权威链接

- [MDN: MAC 地址](https://developer.mozilla.org/en-US/docs/Glossary/MAC_address)
- [Cloudflare: 网络交换机](https://www.cloudflare.com/learning/network-layer/what-is-a-network-switch/) · [ARP](https://www.cloudflare.com/learning/network-layer/what-is-arp/) · [LAN](https://www.cloudflare.com/learning/network-layer/what-is-a-lan/)
- [Wikipedia: Ethernet frame](https://en.wikipedia.org/wiki/Ethernet_frame) · [VLAN](https://en.wikipedia.org/wiki/VLAN) · [Wi-Fi](https://en.wikipedia.org/wiki/Wi-Fi) · [RFC 826: ARP](https://www.rfc-editor.org/rfc/rfc826)

## 相关页

- [入门](./getting-started) · [数据链路层与 MAC 寻址](./guide-line/datalink-mac) · [以太网帧结构](./guide-line/ethernet-frame)
- [交换机工作原理](./guide-line/switch) · [VLAN 与局域网隔离](./guide-line/vlan)
- [ARP 协议与 ARP 欺骗](./guide-line/arp) · [Wi-Fi/802.11 无线局域网](./guide-line/wifi)
