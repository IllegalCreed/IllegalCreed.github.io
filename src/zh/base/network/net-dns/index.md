---
layout: doc
---

# DNS 域名系统

DNS（Domain Name System，域名系统）是互联网的「电话簿」——把人类好记的域名（`example.com`）翻译成机器通信用的 IP 地址。每次访问网站，浏览器的第一步就是 DNS 解析。本叶讲清 DNS 的分层体系、一次解析的完整流程（递归与迭代）、常见记录类型、多级缓存与 TTL，再到前端最关心的 DNS 性能优化（`dns-prefetch`/`preconnect`）与现代 DNS 安全（DoH/DoT/DNSSEC）。

## 概述

- **它管什么**：把域名翻译成 IP——一个分层、去中心化的分布式数据库；换 IP 不用换域名，一个 IP 也能挂多个域名。
- **分层体系**：根域 `.` → 顶级域 TLD → 二级域 → 子域；四类服务器（根 / TLD / 权威 + 递归解析器）协作完成解析。
- **解析流程**：浏览器 → OS → 递归解析器 → 根 → TLD → 权威；递归解析器对客户端是**递归**、对各级服务器是**迭代**；默认走 **UDP 53**。
- **前端关切点**：DNS 解析是首字节前的隐形延迟——用 `dns-prefetch`（只解析）/ `preconnect`（DNS+TCP+TLS）提速；DoH/DoT 加密查询、DNSSEC 验真。

## 本叶地图

- [入门](./getting-started) —— 一次 DNS 解析的全过程，分层与缓存速览
- [DNS 作用与域名层级体系](./guide-line/dns-role-hierarchy) —— 域名分层、FQDN、四类服务器、根服务器
- [解析流程：递归与迭代查询](./guide-line/dns-resolution) —— 8 步解析、递归 vs 迭代、DNS 报文、UDP/TCP 53
- [常见记录类型](./guide-line/dns-record-types) —— A/AAAA/CNAME/MX/TXT/NS/SOA/PTR/CAA/SRV、CNAME 限制
- [DNS 缓存与 TTL](./guide-line/dns-cache-ttl) —— 多级缓存、TTL 权衡、迁移降 TTL、hosts、清缓存
- [前端 DNS 优化](./guide-line/dns-frontend-optimization) —— dns-prefetch、preconnect、crossorigin 坑、域名收敛
- [DoH/DoT 与 DNS 安全](./guide-line/doh-dot-security) —— 明文风险、DoT/DoH、DNSSEC 验真、隐私权衡
- [参考](./reference) —— 记录类型表 + 解析流程 + 缓存 TTL + 安全对比 + 权威链接

## 文档地址

- [Cloudflare: What is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/)
- [MDN: DNS 术语](https://developer.mozilla.org/en-US/docs/Glossary/DNS) · [dns-prefetch](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/dns-prefetch)
- [web.dev: preconnect 与 dns-prefetch](https://web.dev/articles/preconnect-and-dns-prefetch) · [RFC 1034](https://www.rfc-editor.org/rfc/rfc1034) / [1035](https://www.rfc-editor.org/rfc/rfc1035)

## 幻灯片地址

<a href="/SlideStack/net-dns-slide/" target="_blank">DNS 域名系统</a>
