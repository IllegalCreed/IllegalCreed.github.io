---
layout: doc
---

# 链路层与局域网

链路层（数据链路层）负责在**同一局域网内、相邻节点之间**把比特组织成帧并传输，靠 **MAC 地址**寻址。它是 IP 包真正「上路」前的最后一层封装：网络层管「跨网络端到端」，链路层管「单跳内怎么把帧送到下一个设备」。本叶讲清数据链路层与 MAC 寻址、以太网帧结构、交换机如何按 MAC 转发、VLAN 如何逻辑隔离、ARP 如何把 IP 解析成 MAC（及其欺骗风险），以及 Wi-Fi 无线局域网。

## 概述

- **数据链路层职责**：成帧、单跳投递、差错检测（FCS/CRC，只检错不纠错）；用 **MAC 地址**（48 位、烧录、单跳寻址）。
- **以太网**（IEEE 802.3）：最普及的有线 LAN；帧含前导码 / 目的源 MAC / 类型 / 载荷 / FCS；最小 64B、最大 1518B、MTU 1500。
- **交换机**：二层设备，靠 **MAC 地址表自学习**转发；每端口一个冲突域，默认整网一个广播域。
- **VLAN**：用 802.1Q 标签逻辑划分广播域，隔离 + 安全 + 灵活；VLAN 间通信需三层设备。
- **ARP**：把同网段 IP 解析为 MAC（广播请求/单播应答）；ARP 欺骗可致中间人攻击。
- **Wi-Fi**（IEEE 802.11）：无线 LAN，用 CSMA/CA（避免冲突，因无线无法边发边听）；WPA3、Wi-Fi 7。

## 本叶地图

- [入门](./getting-started) —— 链路层全景，MAC 寻址与局域网设备
- [数据链路层与 MAC 寻址](./guide-line/datalink-mac) —— 链路层职责、MAC 地址、MAC vs IP
- [以太网帧结构](./guide-line/ethernet-frame) —— 帧字段、FCS、最小/最大帧、MTU
- [交换机工作原理](./guide-line/switch) —— MAC 表自学习、冲突域/广播域、vs 集线器
- [VLAN 与局域网隔离](./guide-line/vlan) —— 802.1Q 标签、Access/Trunk、VLAN 间通信
- [ARP 协议与 ARP 欺骗](./guide-line/arp) —— IP→MAC 解析、ARP 缓存、欺骗与防护
- [Wi-Fi/802.11 无线局域网](./guide-line/wifi) —— SSID/AP、频段信道、CSMA/CA、WPA3、Wi-Fi 7
- [参考](./reference) —— MAC/以太网帧 + 交换机/VLAN + ARP/Wi-Fi + 权威链接

## 文档地址

- [MDN: MAC 地址](https://developer.mozilla.org/en-US/docs/Glossary/MAC_address)
- [Cloudflare: 网络交换机](https://www.cloudflare.com/learning/network-layer/what-is-a-network-switch/) · [ARP](https://www.cloudflare.com/learning/network-layer/what-is-arp/)
- [Wikipedia: Ethernet frame](https://en.wikipedia.org/wiki/Ethernet_frame) · [Wi-Fi](https://en.wikipedia.org/wiki/Wi-Fi) · [RFC 826: ARP](https://www.rfc-editor.org/rfc/rfc826)

## 幻灯片地址

<a href="/SlideStack/net-link-lan-slide/" target="_blank">链路层与局域网</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=%E9%93%BE%E8%B7%AF%E5%B1%82%E4%B8%8E%E5%B1%80%E5%9F%9F%E7%BD%91" target="_blank" rel="noopener noreferrer">链路层与局域网 测试题</a>
