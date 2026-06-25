---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- DNS = 域名 → IP 分布式数据库；分层 根 → TLD → 二级 → 子域
- 四类服务器：根 / TLD / 权威 + 递归解析器
- 解析：浏览器→OS→递归解析器→根→TLD→权威；递归（对客户端）vs 迭代（对上游）
- 传输：默认 UDP 53；大响应（>512B）或区域传送用 TCP 53
- 记录：A/AAAA/CNAME/MX/TXT/NS/SOA/PTR/CAA/SRV
- CNAME 限制：不指 IP、同名不共存、根域禁用、MX/NS 不指向 CNAME
- 多级缓存 + TTL（权威下发秒数）；迁移前先降 TTL
- 负缓存：NXDOMAIN 由 SOA minimum 控制；hosts 优先级高于 DNS
- 前端：dns-prefetch（只 DNS）/ preconnect（DNS+TCP+TLS，2~4 关键源）
- preconnect 坑：字体等漏 `crossorigin` 等于白连；别合并 rel（Safari bug）
- 安全：DoT(853) / DoH(443,RFC8484) 加密；DNSSEC 验真非加密

## 常见 DNS 记录

| 类型 | 作用 | 示例值 |
| --- | --- | --- |
| `A` | 域名 → IPv4 | `93.184.216.34` |
| `AAAA` | 域名 → IPv6 | `2606:2800:220:1::` |
| `CNAME` | 别名 → 另一域名 | `www → example.com` |
| `MX` | 邮件服务器（带优先级） | `10 mail.example.com` |
| `TXT` | 任意文本（SPF/DKIM/验证） | `v=spf1 ...` |
| `NS` | 指定权威域名服务器 | `ns1.example.com` |
| `SOA` | 起始授权（区域元信息，唯一） | 含 Serial/Refresh/Minimum |
| `PTR` | 反向解析 IP → 域名 | `in-addr.arpa` |
| `CAA` | 限定可签发证书的 CA | `0 issue "letsencrypt.org"` |
| `SRV` | 服务定位（优先级/权重/端口） | `_sip._tcp...` |

> CNAME 四限制：① 不能指 IP ② 同名不能与其他记录共存 ③ 根域（apex）不能用 CNAME ④ MX/NS 不能指向 CNAME。根域需「类 CNAME」用 ALIAS/ANAME（厂商私有，底层即 CNAME flattening）。

## 解析流程与查询类型

| 阶段 | 谁问谁 | 查询类型 |
| --- | --- | --- |
| 客户端 → 递归解析器 | 「给我最终 IP」 | 递归查询 |
| 递归解析器 → 根 / TLD / 权威 | 「下一步问谁」 | 迭代查询 |
| 命中缓存 | 直接返回 | 非递归 |

> 报文五段：Header / Question / Answer / Authority / Additional；UDP 53 默认，TC=1 截断或 >512B 转 TCP 53，区域传送（AXFR）走 TCP。

## 缓存与 TTL

| 缓存层 | 位置 |
| --- | --- |
| 浏览器 DNS 缓存 | `chrome://net-internals/#dns` |
| 操作系统 stub resolver | `ipconfig /flushdns`（Win）/ `dscacheutil -flushcache`（mac） |
| 路由器 / 递归解析器 | 受 TTL 控制 |

> TTL 权衡：长 TTL（3600~86400s）省查询、生效慢；短 TTL（30~300s）更新快、查询多。迁移/换 IP 前 1~2 天调低 TTL，传播时间 ≈ 旧 TTL 最大值。

## 前端优化：dns-prefetch vs preconnect

| | dns-prefetch | preconnect |
| --- | --- | --- |
| 做的事 | 仅 DNS 解析 | DNS + TCP + TLS |
| 代价 | 极轻 | 占真实连接，~10s 回收 |
| 用于 | 可能用到 / 域名多时广撒 | 确定马上要用的关键源（2~4 个） |
| crossorigin | 不需要 | 字体等 CORS 资源**必须加** |

```html
<link rel="dns-prefetch" href="//cdn.example.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

> 资源提示由轻到重：`dns-prefetch`（只解析）< `preconnect`（热连接）< `preload`/`prefetch`（下载字节）。HTTP/2 后域名分片是反模式，应做域名收敛。

## DNS 安全对比

| 方案 | 端口 | 作用 |
| --- | --- | --- |
| 传统 DNS | UDP 53 | 明文，易窃听/劫持/投毒 |
| DoT | TLS 853 | 加密查询，端口专一（网管可见） |
| DoH | HTTPS 443 | 加密且混入 HTTPS 流量，难识别封锁 |
| DNSSEC | — | 数字签名**验真**（防篡改），不加密内容 |

> 加密只挡链路旁观者，所选解析器仍知道你查什么（隐私 = 选信任对象）。

## 权威链接

- [Cloudflare: DNS 学习中心](https://www.cloudflare.com/learning/dns/what-is-dns/) · [DNS 记录](https://www.cloudflare.com/learning/dns/dns-records/) · [DoT](https://www.cloudflare.com/learning/dns/dns-over-tls/)
- [MDN: DNS](https://developer.mozilla.org/en-US/docs/Glossary/DNS) · [dns-prefetch](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/dns-prefetch) · [preconnect](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preconnect)
- [web.dev: preconnect 与 dns-prefetch](https://web.dev/articles/preconnect-and-dns-prefetch) · [RFC 1034](https://www.rfc-editor.org/rfc/rfc1034) / [1035](https://www.rfc-editor.org/rfc/rfc1035)

## 相关页

- [入门](./getting-started) · [DNS 作用与域名层级体系](./guide-line/dns-role-hierarchy) · [解析流程：递归与迭代查询](./guide-line/dns-resolution)
- [常见记录类型](./guide-line/dns-record-types) · [DNS 缓存与 TTL](./guide-line/dns-cache-ttl)
- [前端 DNS 优化](./guide-line/dns-frontend-optimization) · [DoH/DoT 与 DNS 安全](./guide-line/doh-dot-security)
