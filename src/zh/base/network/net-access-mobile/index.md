---
layout: doc
---

# 接入与移动网络

前面各叶讲的是数据在网络里「怎么传」，这一叶讲数据如何「**接入**」网络，以及移动场景的特殊挑战。本叶从接入网与网络规模分类讲起，覆盖宽带接入技术（光纤/PON/卫星）、蜂窝移动网络（2G→5G）、移动弱网对前端的真实影响、CDN 网络原理，最后落到网络性能指标与前端弱网优化。它既是「计算机网络基础」章面向接入侧的补全，也是把全章知识落回**前端性能**的收尾。

## 概述

- **接入网与规模**：PAN/LAN/MAN/WAN 按地理规模分；接入网是「最后一公里」，ISP 分层互联成「网络的网络」。
- **宽带接入**：拨号 → DSL → 光纤（FTTH/PON）；同轴 Cable、卫星 LEO（Starlink）；注意 bit vs Byte。
- **蜂窝移动**：2G→3G→4G→5G 演进；5G 三场景 eMBB/URLLC/mMTC；小区、切换、Sub-6/毫米波。
- **移动弱网**：高延迟/抖动/丢包、RRC 无线电状态机（唤醒延迟 + 尾延迟耗电）——「频繁小请求」在移动端尤其糟。
- **CDN 与性能**：CDN 就近缓存（边缘节点/Anycast/回源）；核心指标带宽/延迟/RTT/丢包/抖动——**延迟常是瓶颈**，弱网优化围绕减往返展开。

## 本叶地图

- [入门](./getting-started) —— 接入与移动网络全景，从最后一公里到前端性能
- [接入网与 LAN/WAN/MAN](./guide-line/access-lan-wan) —— 网络规模分类、接入网、ISP 分层
- [宽带接入技术](./guide-line/broadband) —— DSL、FTTH/PON、同轴、卫星、bit vs Byte
- [蜂窝移动网络 2G→5G](./guide-line/cellular-2g-5g) —— 蜂窝原理、各代演进、5G 三场景
- [移动弱网对前端的挑战](./guide-line/mobile-weak-network) —— 弱网特点、RRC 状态机、Network Information API
- [CDN 网络原理](./guide-line/cdn-principle) —— 边缘节点、回源、DNS 调度 vs Anycast
- [网络性能指标与弱网优化](./guide-line/network-performance) —— 带宽/延迟/RTT、延迟构成、前端优化
- [参考](./reference) —— 网络分类 + 宽带/蜂窝 + CDN + 性能指标 + 权威链接

## 文档地址

- [Cloudflare: 什么是 CDN](https://www.cloudflare.com/learning/cdn/what-is-a-cdn/) · [Anycast](https://www.cloudflare.com/learning/cdn/glossary/anycast-network/) · [什么是 5G](https://www.cloudflare.com/learning/network-layer/what-is-5g/)
- [High Performance Browser Networking](https://hpbn.co/) · [web.dev: 自适应加载](https://web.dev/articles/adaptive-loading-cds-2019)
- [MDN: Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API)

## 幻灯片地址

<a href="/SlideStack/net-access-mobile-slide/" target="_blank">接入与移动网络</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=%E6%8E%A5%E5%85%A5%E4%B8%8E%E7%A7%BB%E5%8A%A8%E7%BD%91%E7%BB%9C" target="_blank" rel="noopener noreferrer">接入与移动网络 测试题</a>
