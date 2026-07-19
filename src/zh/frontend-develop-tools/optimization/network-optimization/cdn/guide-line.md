---
layout: doc
outline: [2, 3]
---

# 核心实践

> 基于 Cloudflare Cache 文档、AWS CloudFront Expiration、MDN Cache-Control、web.dev/articles/content-delivery-networks 编写，对照 RFC 9111（HTTP Caching）与 RFC 5861（stale-while-revalidate）

## 速查

- **静态资源**：`public, max-age=31536000, immutable`（带 hash 的文件名）
- **HTML 入口**：`no-cache`（每次 revalidate 拿新 hash 引用）
- **个性化响应**：`private`（或 `no-store`），否则会被共享缓存复用给他人
- **s-maxage 解耦**：`max-age=600, s-maxage=86400` 浏览器 10min / CDN 1 天
- **CDN-Cache-Control**（透传下游）> `Cloudflare-CDN-Cache-Control`（仅本 CDN）> `Cache-Control`（兜底）；`Surrogate-Control` 被 CDN 识别但不透传
- **分组失效**：`Surrogate-Key: footer user123` → purge 时按 key 批量失效，远胜 `purge-all`
- **可用性**：`max-age=3600, stale-while-revalidate=600, stale-if-error=86400`
- **CloudFront TTL**：Min/Default/Max TTL 把源站值夹在区间内取值；Min TTL > 0 会覆盖 no-store（坑）
- **CHR ≥ 90%**：忽略无关 query（utm）、归一化 Vary、避免缓存带 Set-Cookie 的响应
- **Image CDN**：URL 参数（width/quality/format=auto/fit）按需变换 + Accept 头自动协商 AVIF/WebP
- **CDN 协议增益**：Brotli（静态 11 / 动态 4）、TLS 1.3（1-RTT）、HTTP/2（multiplexing）、HTTP/3（QUIC 消除队头阻塞）

## 边缘缓存与 origin pull

CDN 边缘 PoP 的缓存生命周期：

1. **未命中**：首次请求 / 缓存过期 / 被 purge / 被驱逐（eviction）
2. **origin pull**：边缘代用户向源站拉取，拉到的内容缓存一份再返回
3. **命中**：后续请求直接返回缓存（毫秒级，无回源开销）
4. **过期**：TTL 到期后，下次请求触发新的 origin pull（或借助 `stale-while-revalidate` 后台刷新）

### origin pull vs purge vs eviction

| 操作 | 触发者 | 行为 |
| --- | --- | --- |
| **origin pull** | 缓存未命中（被动） | CDN 代用户向源站请求并缓存 |
| **purge** | 用户主动（Purge API） | 让已有缓存立即失效；下次请求触发新 origin pull |
| **eviction** | 边缘空间不足（自动） | LRU 淘汰旧条目 |
| **soft purge** | 用户主动 | 标记过期但继续服务，直到新版本就绪 |

> hold-till-told caching：长 TTL + 内容变更时调 Purge API。适合"动态但可短暂缓存"的内容（首页、列表 API），高流量下哪怕 5 秒缓存也能大幅卸源。

## purge 与 Surrogate-Key 分组失效

CDN 的失效手段从粗到细：

| 手段 | 粒度 | 适用 |
| --- | --- | --- |
| **purge-all** | 全站 | 极端情况才用；整站 CHR 瞬时归零、源站被打 |
| **purge by URL** | 单 URL | 单页更新 |
| **purge by Surrogate-Key / Cache-Tag** | 按标签批量 | 内容更新影响一批资源（如 footer 改了 purge 所有引用它的页） |
| **soft purge** | 同上但标记过期 | 平滑过渡，避免瞬时大量 origin pull |

```text
# 源站给响应打标签
Surrogate-Key: footer user123
Cache-Tag: article-list

# 内容变更时按 key 批量 purge
POST /purge_cache
{ "surrogate-key": "footer" }
```

> purge-all 是最后手段：整站命中率瞬时归零、源站被 origin pull 风暴打。Surrogate-Key/Cache-Tag 分组失效才是正确解。

## s-maxage vs max-age

```text
Cache-Control: public, max-age=600, s-maxage=86400
```

| 缓存位置 | 生效指令 | TTL |
| --- | --- | --- |
| 浏览器私有缓存 | `max-age=600` | 10 分钟 |
| CDN 共享缓存 | `s-maxage=86400` | 1 天 |

- `s-maxage` 仅对共享缓存生效，覆盖 `max-age`，**浏览器忽略 `s-maxage`**
- 用途：让用户感知新鲜度（浏览器 10 分钟内强制刷新拿新内容）与 CDN 命中率（CDN 缓存 1 天卸源）解耦

> 把 `max-age` 当 CDN 缓存时长是反模式——浏览器和 CDN 共用一个 TTL 无法独立调优。

## CDN 专属头：CDN-Cache-Control 家族

CDN 层需要管理五层独立 TTL：① origin cache ② network shared cache ③ 本 CDN ④ 下游其他 CDN ⑤ 浏览器。`Cache-Control` 上的 `s-maxage` 对所有共享缓存一视同仁，无法逐层区分，于是有了 CDN 专属头：

| 头 | 透传性 | 行为 |
| --- | --- | --- |
| `CDN-Cache-Control` | **透传**给下游其他 CDN | 控制本 CDN + 下游 CDN 缓存 |
| `Cloudflare-CDN-Cache-Control` | **不透传**，只对本 CDN 生效 | 只想控制 Cloudflare 而不影响下游 |
| `Surrogate-Control` | 被**本 CDN 识别但不透传** | 存在时覆盖 `Cache-Control` 的决策 |
| `Cache-Control` | 全程透传（兜底） | 浏览器 + 所有共享缓存 |

```text
# 只让 Cloudflare 缓存 1 天，但下游 CDN 与浏览器只缓存 10 分钟
Cache-Control: public, max-age=600
Cloudflare-CDN-Cache-Control: public, max-age=86400
```

> CDN-Cache-Control 是 IETF 草案（draft-ietf-httpapi-cache-headers），Cloudflare 已实现，非全行业标准但被主流 CDN 跟进。

## stale-while-revalidate 与 stale-if-error

```text
Cache-Control: max-age=3600, stale-while-revalidate=600, stale-if-error=86400
```

| 指令 | 行为 |
| --- | --- |
| `stale-while-revalidate=N` | 过期后 N 秒内可**先返旧值后台刷新**（隐藏用户感知的延迟） |
| `stale-if-error=N` | 源站返回 5xx / 不可达时，N 秒内仍复用旧响应（CDN 自带容灾层） |
| `must-revalidate` | 一旦过期必须 revalidate，禁止断网时复用过期响应 |
| `proxy-revalidate` | 共享缓存版的 `must-revalidate`（私有缓存可继续复用过期响应） |

**CloudFront 的约束**：`stale-while-revalidate` 与 `stale-if-error` 会与 CloudFront Max TTL 取较小值生效——Max TTL 限制住了能用多久。

> 这是 CDN 高可用的关键：源站故障时仍能服务旧值，相当于 CDN 自带一层容灾层。

## CloudFront TTL 矩阵

CloudFront 的 cache policy 里有 Min TTL / Default TTL / Max TTL，与源站 Cache-Control 共同决定最终 TTL：

```text
源站 Cache-Control: max-age=N
最终 TTL = clamp(N, MinTTL, MaxTTL)
         = min(max(N, MinTTL), MaxTTL)
```

| 源站指令 | Min/Default/Max TTL 行为 |
| --- | --- |
| 源站有 `max-age=N` | 夹在 [Min, Max] 区间内取 N |
| 源站无 Cache-Control | 用 Default TTL |
| 源站 `no-cache` / `no-store` / `private` | **正常情况下不缓存** |
| **Min TTL > 0 的坑** | 会覆盖 `no-cache` / `no-store` / `private`——源站不可达时仍可能返回旧对象，需配 `stale-if-error=0` 才能强制报错 |

> 在 CloudFront 设 Min TTL > 0 还指望 no-store 生效，是经典踩坑点。

### CloudFront cache key

cache key 由 **URL path + 选定 query + headers + cookies** 组成。不归一化 query（utm 等）会导致同一资源多份缓存。`Managed-CachingOptimized` 是最小化 cache key 的托管策略。

### CloudFront Origin Shield

边缘与源之间的**中间缓存层**：所有边缘 PoP 的 origin pull 先打到 Origin Shield，由它集中回源。优点：

- **集中回源**：源站只看到 Origin Shield 一个客户端，连接数大幅减少
- **提升 CHR**：边缘未命中时，Origin Shield 可能已缓存
- **抗抖动**：源站瞬时故障时 Origin Shield 的缓存兜底

> Cloudflare 对应能力叫 **Tiered Cache**：边缘 PoP 未命中时先查中心 PoP 而非直接回源。

## Cloudflare Cache 配置速查

| 配置 | 作用 |
| --- | --- |
| **Cache Rules** | Edge TTL 覆盖 `CDN-Cache-Control`；Browser Cache TTL 只改下游 `Cache-Control` |
| **Cache Reserve** | 持久化上层缓存，要求资源 TTL ≥ 10 小时 |
| **Tiered Cache** | 边缘 PoP 未命中时查中心 PoP 而非直接回源 |
| **Purge API** | 按 URL 或按 Surrogate-Key 即时失效；soft purge 标记过期但可继续服务 |

## Image CDN

Image CDN 通过 URL 参数**按需变换**图片：不预生成多尺寸，而是请求时由 CDN 边缘转码。

```text
https://cdn.example.com/image.jpg?width=480&quality=75&format=auto&fit=cover
```

| 参数 | 作用 |
| --- | --- |
| `width` / `height` | 输出尺寸 |
| `quality` | 压缩质量（0–100） |
| `format=auto` | 按 `Accept` 头自动协商 AVIF / WebP / JPEG |
| `fit=contain` / `cover` / `crop` | 缩放策略 |
| `crop` | 裁剪区域 |
| `metadata=keep` / `drop` | EXIF 保留或剥离 |

配合 HTML 的响应式图片：

```html
<img
  srcset="https://cdn.example.com/photo.jpg?width=480 480w,
          https://cdn.example.com/photo.jpg?width=1024 1024w"
  sizes="(max-width: 600px) 100vw, 50vw"
  alt="..."
/>
```

**主流实现**：Cloudflare Image Resizing、imgix、Cloudinary、CloudFront Image Resizing、Optimizely DXP，各有私有 URL 参数约定。

> 图片占页面传输字节约 50%，AVIF 比 WebP/JPEG 压缩率显著更高；按需生成省存储与回源。

## CDN 协议性能增益

CDN 边缘节点普遍支持这些协议升级，常被忽略但开箱即用：

| 特性 | 增益 |
| --- | --- |
| **Brotli 压缩** | 静态资源 Brotli-11、动态 Brotli-4，优于 gzip |
| **TLS 1.3** | 1-RTT 握手（vs TLS 1.2 的 2-RTT） |
| **HTTP/2** | 多路复用 + 流优先级（multiplexing / stream prioritization） |
| **HTTP/3** | 基于 QUIC/UDP，消除连接级队头阻塞、丢包只阻塞单流 |

> HTTP/3 不是"换个名字"，而是真正解决了 HTTP/2 在 TCP 层的队头阻塞问题。

## 反模式（避坑）

- **把 `max-age` 当 CDN 缓存时长**：浏览器和 CDN 共用一个 TTL 无法独立调优，应额外设 `s-maxage` 或 `CDN-Cache-Control`
- **误以为 `no-cache` = 不缓存**：实际是"可缓存但每次复用前必须 revalidate"；要完全不缓存用 `no-store`
- **给带 `Set-Cookie` 的响应期望被 CDN 缓存**：缓存层通常不缓存含 Set-Cookie 的响应，且漏加 `private` 会泄漏他人数据
- **滥用 `Vary`**：`Vary: *` 或不稳定 `User-Agent` 不做归一化，会击穿 CHR 甚至响应不进缓存
- **query 参数未归一化**：`utm_id`、`referral_id`、参数顺序不同 → 同一资源多份缓存，CHR 骤降
- **把 `immutable` 当跨浏览器万能**：Chromium 系不支持，只 Firefox/Safari 生效；Chrome 仍会对 reload 发条件请求
- **CloudFront Min TTL > 0 还指望 no-store 生效**：Min TTL 会覆盖 no-cache/no-store/private，源站不可达时仍可能返旧对象
- **试图用客户端 `Cache-Control: no-cache` 强制 CDN 回源**：CloudFront 会忽略 viewer 请求里的 Cache-Control/Pragma；必须靠 purge 或源站头
- **永远不变的资源放短 max-age**：每 N 秒一次条件请求风暴，应 cache-busting + 长 max-age + immutable
- **HTML 入口直接配长 max-age 不带版本/hash**：用户拿不到更新（HTML 没法 cache-bust）
- **purge-all 当默认失效手段**：整站命中率瞬时归零、源站被打，应改用 Surrogate-Key 分组失效
- **Image CDN 上线后仍手写一堆本地多尺寸/WebP 预生成资源**：重复劳动且无法享受 AVIF 自动协商

## 下一步

- [参考](./reference.md)：Cache-Control 指令表 + CDN 头表 + Cloudflare/CloudFront 配置 + 官方资源
