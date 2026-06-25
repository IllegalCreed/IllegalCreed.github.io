---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- 网络规模：PAN < LAN < MAN < WAN（互联网是最大 WAN）
- 接入网 = 最后一公里；ISP 分层 + 对等/转接
- 宽带：DSL（电话线）/ FTTH（PON）/ Cable（同轴）/ 卫星 LEO
- bit vs Byte：100 Mbps ≈ 12.5 MB/s
- 蜂窝 2G→5G；5G 三场景 eMBB/URLLC/mMTC；Sub-6 vs 毫米波
- 移动弱网：高延迟/抖动/丢包；RRC 唤醒延迟 + 尾延迟耗电
- CDN：边缘缓存、命中/回源、DNS 调度 vs Anycast、抗 DDoS
- 性能指标：带宽/延迟/RTT/丢包/抖动；延迟 = 传播+传输+处理+排队
- 延迟常是瓶颈（光速物理限制）；弱网优化 = 减往返

## 网络规模与接入

| 类型 | 范围 | 例子 |
| --- | --- | --- |
| PAN | 个人（≤10m） | 蓝牙、NFC |
| LAN | 一栋楼 | 家庭/办公 Wi-Fi、以太网 |
| MAN | 一座城市 | 城域网 |
| WAN | 跨地域/全球 | 互联网（最大 WAN） |

> 接入网 = 最后一公里（用户 ↔ ISP）；核心网 = ISP ↔ ISP。ISP 分 Tier-1（对等免费）/ 二级（买转接）/ 本地。

## 宽带接入技术

| 技术 | 介质 | 特点 |
| --- | --- | --- |
| 拨号 | 电话线 | 窄带 56 kbps，已淘汰 |
| DSL/ADSL | 电话线 | 非对称（下行 ≫ 上行） |
| FTTH（PON） | 光纤 | 主流；GPON→XGS-PON（对称 10G） |
| Cable（HFC） | 同轴+光纤 | DOCSIS，上行偏弱 |
| 卫星 LEO | 无线 | Starlink，低轨低延迟 20~50ms |

> bit vs Byte：网速用 bit（小写 b，Mbps），文件大小用 Byte（大写 B，MB）；1 Byte = 8 bit。

## 蜂窝移动网络

| 代际 | 技术 | 特征 |
| --- | --- | --- |
| 2G | GSM/GPRS | 数字语音 + 短信 + 窄带数据 |
| 3G | WCDMA | 移动互联网（Mbps） |
| 4G | LTE | 全 IP、宽带（数十~百 Mbps） |
| 5G | NR | eMBB / URLLC / mMTC，Gbps + 毫秒延迟 |

> 蜂窝原理：小区 + 基站 + 切换 handover（移动不断线）。5G 频谱：Sub-6GHz（覆盖）+ 毫米波（高速近距）。

## CDN 与性能指标

| 项 | 要点 |
| --- | --- |
| CDN | 就近缓存静态内容，降低延迟 |
| 边缘节点 PoP | 分布全球的缓存服务器 |
| 命中/回源 | hit 就近返回；miss 回源 origin 取 |
| DNS 调度 | 按地理位置返回最近节点 IP |
| Anycast | 多节点共享 IP、BGP 路由到最近、抗 DDoS |
| 带宽 | 吞吐上限（Mbps/Gbps） |
| 延迟/RTT | 往返时间；= 传播+传输+处理+排队 |
| 抖动 jitter | 延迟波动，影响实时音视频 |

> 延迟构成中**传播延迟**受距离/光速限制（CDN 就近的根因），**排队延迟**是弱网拥塞抖动的主因。

## 前端弱网优化

- 减少请求数与往返、资源压缩（Brotli/WebP/AVIF）、`preconnect`/`dns-prefetch` 提前建连
- CDN 就近、自适应加载（按 `effectiveType`/`saveData` 降质）、Service Worker 离线缓存
- 超时 + 指数退避重试；`navigator.connection` 特性检测后渐进增强
- 测量：DevTools（网络限速）、Lighthouse（移动节流打分）、WebPageTest（多地真机）

## 权威链接

- [Cloudflare: CDN](https://www.cloudflare.com/learning/cdn/what-is-a-cdn/) · [Anycast](https://www.cloudflare.com/learning/cdn/glossary/anycast-network/) · [5G](https://www.cloudflare.com/learning/network-layer/what-is-5g/)
- [High Performance Browser Networking](https://hpbn.co/) · [hpbn: 延迟与带宽](https://hpbn.co/primer-on-latency-and-bandwidth/)
- [web.dev: 自适应加载](https://web.dev/articles/adaptive-loading-cds-2019) · [MDN: Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API)

## 相关页

- [入门](./getting-started) · [接入网与 LAN/WAN/MAN](./guide-line/access-lan-wan) · [宽带接入技术](./guide-line/broadband)
- [蜂窝移动网络 2G→5G](./guide-line/cellular-2g-5g) · [移动弱网对前端的挑战](./guide-line/mobile-weak-network)
- [CDN 网络原理](./guide-line/cdn-principle) · [网络性能指标与弱网优化](./guide-line/network-performance)
