---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 MDN Cache-Control、Cloudflare Cache 文档、AWS CloudFront Expiration、web.dev/articles/content-delivery-networks 编写，对照 RFC 9111（HTTP Caching）/ RFC 5861（stale-while-revalidate）/ RFC 8246（immutable）

## 速查

- **静态资源**：`public, max-age=31536000, immutable`（hash 文件名）
- **HTML 入口**：`no-cache`（强制每次 revalidate）
- **个性化响应**：`private` 或 `no-store`
- **CDN 解耦**：`max-age=600, s-maxage=86400`（浏览器 10min / CDN 1 天）
- **可用性**：`stale-while-revalidate=600, stale-if-error=86400`
- **CDN 专属头**：`CDN-Cache-Control`（透传） / `Cloudflare-CDN-Cache-Control`（仅本 CDN） / `Surrogate-Control`（不透传）
- **分组失效**：`Surrogate-Key` / `Cache-Tag` 响应头 → Purge API 按 key 失效
- **CHR 目标**：≥ 90%；忽略无关 query、归一化 Vary、避免缓存 Set-Cookie 响应
- **CloudFront TTL**：`clamp(源站 max-age, MinTTL, MaxTTL)`；Min TTL > 0 覆盖 no-store
- **CDN 协议增益**：Brotli（11/4）、TLS 1.3（1-RTT）、HTTP/2（multiplexing）、HTTP/3（QUIC）

## Cache-Control 响应指令表

| 指令 | 作用域 | 行为 |
| --- | --- | --- |
| `max-age=N` | 私有 + 共享 | 新鲜期 N 秒 |
| `s-maxage=N` | 仅共享/CDN | 覆盖 `max-age` 仅对共享缓存生效，浏览器忽略 |
| `no-cache` | 全部 | 可存储但每次复用前必须 revalidate |
| `no-store` | 全部 | 任何缓存都不得存储 |
| `private` | 共享 | 只进浏览器私有缓存，不进共享缓存 |
| `public` | 共享 | 允许共享缓存，尤其解锁带 Authorization 响应的共享缓存 |
| `must-revalidate` | 全部 | 一旦过期必须 revalidate，禁止断网时复用过期响应 |
| `proxy-revalidate` | 共享 | 共享缓存版的 must-revalidate（私有缓存可继续复用过期响应） |
| `immutable` | 私有 | 新鲜期内浏览器不发条件请求（Firefox/Safari 支持，Chromium 不支持） |
| `stale-while-revalidate=N` | 全部 | 过期后 N 秒内可先返旧值后台刷新 |
| `stale-if-error=N` | 全部 | 源站 5xx / 不可达时复用旧响应 |
| `must-understand` | 全部 | 不理解状态码语义则不缓存 |
| `no-transform` | 全部 | 禁止中间代理改写内容（如压缩图像） |

## Cache-Control 请求指令表

| 指令 | 行为 |
| --- | --- |
| `max-age=0` | reload，相当于 no-cache 的兼容写法 |
| `no-cache` | 强制 reload |
| `max-stale=N` | 接受过期 N 秒内的响应（主流浏览器不支持） |
| `min-fresh=N` | 要求至少还有 N 秒新鲜期 |
| `only-if-cached` | 只用缓存，无则 504 |

> 注意：CloudFront 会忽略 viewer 请求里的 Cache-Control/Pragma，无法靠客户端头强制 CDN 回源——必须用 purge 或源站响应头。

## CDN 专属头表（Cloudflare 实现）

| 头 | 透传性 | 行为 |
| --- | --- | --- |
| `CDN-Cache-Control` | 透传给下游其他 CDN | 控制本 CDN + 下游 CDN 缓存 |
| `Cloudflare-CDN-Cache-Control` | 仅本 CDN，不透传 | 只想控制 Cloudflare 不影响下游 |
| `Surrogate-Control` | 本 CDN 识别但不透传 | 存在时覆盖 `Cache-Control` 决策 |
| `Cache-Control` | 全程透传（兜底） | 浏览器 + 所有共享缓存 |

> 优先级：`Surrogate-Control` > `CDN-Cache-Control` > `Cache-Control`（细节依厂商实现）。

## 辅助响应头

| 头 | 作用 |
| --- | --- |
| `Age` | 响应已在共享缓存中存放的秒数（浏览器/下游从 max-age 中扣除） |
| `Vary` | 按请求头派生不同变体（如 `Accept-Encoding`、`Accept`）；CDN 支持有限，滥用会击穿命中率 |
| `Expires` | HTTP/1.0 绝对过期时间，被 `max-age` 覆盖 |
| `ETag` / `If-None-Match` | 条件请求 → 304 Not Modified |
| `Last-Modified` / `If-Modified-Since` | 条件请求（HTTP/1.0 风格） |
| `Surrogate-Key` / `Cache-Tag` | 给资源打标签，Purge API 按标签批量失效 |

## Cloudflare Cache 配置

| 配置 | 作用 |
| --- | --- |
| **Cache Rules** | Edge TTL 覆盖 `CDN-Cache-Control`；Browser Cache TTL 只改下游 `Cache-Control` |
| **Cache Reserve** | 持久化上层缓存，要求资源 TTL ≥ 10 小时 |
| **Tiered Cache** | 边缘 PoP 未命中时查中心 PoP 而非直接回源 |
| **Purge API** | 按 URL 或按 Surrogate-Key 即时失效；soft purge 标记过期但可继续服务 |

**Cloudflare 头部响应示例**：

```text
Cache-Control: public, max-age=600
Cloudflare-CDN-Cache-Control: public, max-age=86400, stale-while-revalidate=600
Surrogate-Key: footer user123
```

## CloudFront 配置

### cache policy TTL 矩阵

```text
源站 Cache-Control: max-age=N
最终 TTL = clamp(N, MinTTL, MaxTTL)
```

| 源站指令 | 行为 |
| --- | --- |
| 源站有 `max-age=N` | 夹在 [Min, Max] 区间内取 N |
| 源站无 Cache-Control | 用 Default TTL |
| 源站 `no-cache` / `no-store` / `private` | 正常情况下不缓存 |
| **Min TTL > 0** | 覆盖 `no-cache` / `no-store` / `private`（坑）；配 `stale-if-error=0` 才能强制报错 |

### CloudFront 关键能力

| 能力 | 作用 |
| --- | --- |
| **Origin Shield** | 边缘与源之间的中间缓存层，集中回源、提升 CHR |
| **Managed-CachingOptimized** | 最小化 cache key 的托管策略 |
| **stale-while-revalidate / stale-if-error** | 与 Max TTL 取较小值生效 |
| **cache key** | URL path + 选定 query + headers + cookies |

## CDN 缓存命中决策流程

```text
1. 收到请求 → 提取 cache key（URL + query 归一化 + Vary 派生）
2. 查边缘 PoP 缓存
   ├─ 命中且未过期 → 直接返回（CHR +1）
   ├─ 命中但过期 + stale-while-revalidate → 先返旧值后台刷新
   ├─ 命中但过期 + 无 SWR → 条件请求（ETag/If-None-Match）→ 304 续命 / 200 拉新
   └─ 未命中 → origin pull
3. origin pull 失败 + stale-if-error → 返旧值（兜底）
4. 拉到的内容按源站 Cache-Control / CDN-Cache-Control / Surrogate-Control 决定 TTL 写入缓存
```

## cache-busting 速查

| 资源类型 | 配置 | 理由 |
| --- | --- | --- |
| 静态资源（hash 文件名） | `public, max-age=31536000, immutable` | 内容永不变 → 激进缓存，immutable 省条件请求 |
| HTML 入口 | `no-cache` | HTML 没法 hash 化，必须每次 revalidate 拿新 hash 引用 |
| 个性化响应 | `private` 或 `no-store` | 不能进共享缓存 |
| 动态但可短暂缓存 | `s-maxage` 短 TTL（5–30s）或 hold-till-told + Purge API | 高流量下哪怕 5s 也卸源 |

## CHR 优化清单

- **忽略无关 query 参数**：在 CDN 配置中忽略 `utm_*`、`referral_id` 等
- **query 排序归一化**：`?a=1&b=2` 与 `?b=2&a=1` 当同一 key
- **归一化请求头**：`Accept-Language`、`User-Agent` 不稳定时归一化或剔除出 cache key
- **避免缓存带 `Set-Cookie` 的响应**：缓存层通常不会缓存，且漏加 `private` 会泄漏
- **目标 CHR ≥ 90%**：低于这个数字先排查 query 与 Vary

## Image CDN URL 参数速查

```text
https://cdn.example.com/image.jpg?width=480&quality=75&format=auto&fit=cover&metadata=drop
```

| 参数 | 作用 |
| --- | --- |
| `width` / `height` | 输出尺寸 |
| `quality` | 压缩质量（0–100） |
| `format=auto` | 按 `Accept` 头协商 AVIF / WebP / JPEG |
| `fit=contain` / `cover` / `crop` | 缩放策略 |
| `crop` | 裁剪区域 |
| `metadata=keep` / `drop` | EXIF 保留或剥离 |

**主流实现**：Cloudflare Image Resizing、imgix、Cloudinary、CloudFront Image Resizing、Optimizely DXP——各有私有 URL 参数约定，迁移需重写 URL。

## 版本与标准化状态

| 项 | 状态 |
| --- | --- |
| `Cache-Control` | RFC 9111（HTTP Caching），MDN Baseline widely available（2015-07 起） |
| `s-maxage` | RFC 9111 标准 |
| `stale-while-revalidate` / `stale-if-error` | RFC 5861 标准 |
| `immutable` | RFC 8246 标准（Firefox/Safari 支持，Chromium 不支持） |
| `CDN-Cache-Control` | IETF 草案 draft-ietf-httpapi-cache-headers（Cloudflare 已实现） |
| HTTP/3 | RFC 9114（基于 QUIC） |
| TLS 1.3 | RFC 8446 |
| `<img srcset/sizes>` / `<picture>` | HTML Living Standard，全浏览器支持 |
| Image CDN | 厂商能力，非标准 |

## 官方资源

- web.dev CDN：[https://web.dev/articles/content-delivery-networks](https://web.dev/articles/content-delivery-networks)
- web.dev Image CDN：[https://web.dev/articles/serve-responsive-images](https://web.dev/articles/serve-responsive-images)
- MDN Cache-Control：[https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- Cloudflare CDN-Cache-Control：[https://developers.cloudflare.com/cache/about/cdn-cache-control/](https://developers.cloudflare.com/cache/about/cdn-cache-control/)
- AWS CloudFront Expiration：[https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html)
- RFC 9111（HTTP Caching）：[https://www.rfc-editor.org/rfc/rfc9111](https://www.rfc-editor.org/rfc/rfc9111)
- RFC 5861（stale-while-revalidate）：[https://www.rfc-editor.org/rfc/rfc5861](https://www.rfc-editor.org/rfc/rfc5861)
- RFC 8246（immutable）：[https://www.rfc-editor.org/rfc/rfc8246](https://www.rfc-editor.org/rfc/rfc8246)
- CDN-Cache-Control 草案：[https://datatracker.ietf.org/doc/draft-ietf-httpapi-cache-headers/](https://datatracker.ietf.org/doc/draft-ietf-httpapi-cache-headers/)
