---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 web.dev/articles/content-delivery-networks、MDN Cache-Control、Cloudflare/AWS 官方文档编写，对照 RFC 9111（HTTP Caching）与当前主流 CDN 行为

## 速查

- **CDN = 共享缓存层**：内容缓存到离用户近的边缘 PoP，命中即返回、未命中则回源拉取
- **三要素**：① 更短 RTT（物理距离近）② 连接预热/复用（TLS 1.3 1-RTT、HTTP/2 multiplexing、HTTP/3 QUIC）③ 缓存卸载回源（CHR ≥ 90% 目标）
- **origin pull vs purge**：未命中时 CDN 主动回源拉一份缓存下来；purge 是手动让已有缓存失效
- **s-maxage vs max-age**：`s-maxage` 仅共享/CDN 缓存生效（覆盖 `max-age`），浏览器忽略仍按 `max-age` 走
- **no-cache ≠ no-store ≠ private**：no-cache=可存但每次复用前必 revalidate；no-store=完全不存；private=只进浏览器
- **cache-busting**：版本化文件名（hash）+ `max-age=31536000, immutable`；HTML 入口配 `no-cache`
- **CDN 专属头**：`CDN-Cache-Control`（透传下游）、`Cloudflare-CDN-Cache-Control`（仅本 CDN）、`Surrogate-Control`（本 CDN 识别不透传）
- **分组失效**：`Surrogate-Key`/`Cache-Tag` 给资源打标签，按 key 批量 purge，远胜 `purge-all`
- **可用性**：`stale-while-revalidate`（过期先返旧后台刷新）、`stale-if-error`（源站 5xx 时复用旧值）
- **CHR 杀手**：query 参数未归一化（utm_id）、滥用 Vary、带 Set-Cookie 的响应

## CDN 是什么

CDN（Content Delivery Network，内容分发网络）是部署在全球多地边缘节点（PoP, Point of Presence）的**共享缓存层**。用户请求先打到最近的 PoP：

- **缓存命中**：边缘直接返回缓存内容，无需回源
- **未命中**：边缘代用户向源站发起 origin pull，拉到的内容缓存一份再返回给用户

与浏览器私有缓存不同，CDN 缓存会被同一资源的多个用户共享复用，所以 Cache-Control 的语义需要按"共享"维度去配。

> 本章只讲 CDN 这一共享缓存层。浏览器私有缓存的完整协议语义属 HTTP 缓存章，本章只在"CDN 如何解读这些指令"层面引用。

## CDN 的三要素

CDN 性能收益不只有"缓存"，而是三件事的叠加：

| 要素 | 含义 | 对前端指标的影响 |
| --- | --- | --- |
| **更短 RTT** | 边缘节点离用户物理距离更近，TCP/TLS 握手与首字节往返大幅缩短 | 直接降 TTFB → 改善 LCP / FCP |
| **连接预热/复用** | 边缘与源之间维持长连接、TLS 1.3 1-RTT、HTTP/2 多路复用、HTTP/3 QUIC 消除连接级队头阻塞 | 回源时握手开销几乎可忽略 |
| **缓存卸载回源** | 命中率高时绝大多数请求在边缘终结，源站压力骤降 | 高 CHR（≥ 90%）= 源几乎不被打 |

> 三要素缺一不可：光有缓存但 RTT 长、或 RTT 短但每次都回源，CDN 的性能增益都打折扣。

## origin pull 与 purge

| 操作 | 触发 | 行为 |
| --- | --- | --- |
| **origin pull** | 缓存未命中（首次访问、缓存过期、被驱逐） | CDN 代用户向源站发起请求，拉到的内容缓存一份再返回 |
| **purge** | 内容变更时手动调用 Purge API | 让已有缓存条目立即失效；下次请求触发新的 origin pull |
| **eviction** | 边缘缓存空间不足、TTL 到期 | LRU 等策略淘汰旧条目，与新请求无关 |
| **soft purge** | 内容变更但希望平滑 | 把缓存标记为过期但继续服务，直到新版本就绪 |

> hold-till-told caching：用长 TTL + 内容变更时调 Purge API 触发失效，适合"动态但可短暂缓存"的内容（如首页、列表 API）。

## cache hit ratio（CHR）

**CHR = 缓存命中请求数 / 总请求数**。目标 **≥ 90%**。CHR 杀手常见三类：

- **query 参数未归一化**：`?utm_id=123` 与 `?utm_id=456` 默认被当不同 cache key，造成缓存碎片
- **滥用 Vary**：`Vary: User-Agent` 不做归一化会让同一资源在 CDN 里有几千份缓存
- **带 Set-Cookie 的响应**：缓存层通常不会缓存含 Set-Cookie 的响应，且若漏加 `private` 会泄漏他人数据

> 在 CDN 配置中**忽略无关 query 参数**（utm/referral_id）并对 query 排序归一化、归一化 Accept-Language 等头，是 CHR 治理的基本功。

## cache-busting 模式

**核心思路**：让内容永不变的资源走激进缓存（长 max-age + immutable），让会变的入口走每次 revalidate。

```text
# 静态资源（带内容 hash 的文件名）
/assets/index-a3f9c2b1.js   Cache-Control: public, max-age=31536000, immutable
/assets/logo-9e8d7c6f.webp  Cache-Control: public, max-age=31536000, immutable

# HTML 入口
/index.html                 Cache-Control: no-cache
```

- 文件名带内容 hash，内容变了 → hash 变 → URL 变 → 自然走新 URL，旧缓存安静过期即可
- `immutable`：新鲜期内浏览器不发条件请求（省一次往返；Firefox/Safari 支持，Chromium 仍会发条件请求）
- HTML 用 `no-cache` 让浏览器每次都 revalidate，从而看到新 hash 引用

> 这是替代频繁 purge 的根本解：purge 在大规模下成本高且有传播延迟，hash 化让新版本自动走新 URL。

## s-maxage：CDN 与浏览器解耦

```text
Cache-Control: public, max-age=600, s-maxage=86400
```

- **浏览器**按 `max-age=600` 缓存 10 分钟
- **CDN**按 `s-maxage=86400` 缓存 1 天（`s-maxage` 覆盖 `max-age` 仅对共享缓存生效）

> 这是把"用户感知新鲜度"与"CDN 命中率"解耦的关键指令。

## 三者语义辨析

| 指令 | 含义 | 典型误用 |
| --- | --- | --- |
| `no-cache` | 可存储但**每次复用前必须向源站 revalidate** | 误以为"不缓存"，其实是"边缓存边校验" |
| `no-store` | **任何缓存都不得存储** | 该用 no-store 时用了 no-cache，仍会被存储 |
| `private` | 只进浏览器私有缓存，不进共享缓存 | 个性化响应漏加 private → 共享给他人 = 数据泄漏 |

> 要完全不缓存：`no-store`。要让浏览器每次 revalidate：`no-cache`。要只缓存到浏览器：`private`。

## 下一步

- [核心实践](./guide-line.md)：边缘缓存 + origin pull + purge / Surrogate-Key / s-maxage vs max-age / CDN-Cache-Control / stale-while-revalidate / CloudFront TTL / Image CDN / 反模式
- [参考](./reference.md)：Cache-Control 指令表 + CDN 头表 + Cloudflare/CloudFront 配置 + 官方资源
