---
layout: doc
---

# CDN

CDN（Content Delivery Network，内容分发网络）是把内容缓存到**离用户更近的边缘节点（PoP, Point of Presence）**的共享缓存层。用户请求先打到边缘 PoP，命中则直接返回（无需回源）；未命中则由边缘代为发起 origin pull 回源拉取，再缓存一份供后续请求复用。CDN 的核心性能收益来自**三要素**：① 更短的 RTT（边缘节点离用户物理距离更近，TCP/TLS 握手与首字节往返大幅缩短）；② 连接预热与复用（边缘与源之间维持长连接、TLS 1.3 1-RTT、HTTP/2 多路复用、HTTP/3 QUIC 消除连接级队头阻塞）；③ 缓存卸载回源（命中率高时几乎所有请求在边缘终结，源站压力骤降，目标 CHR ≥ 90%）。CDN 与浏览器私有缓存的本质区别在于它是**共享缓存**：会被同一资源的多个用户复用，因此 Cache-Control 在这里的语义需要按"共享"维度去配——典型做法是用 `s-maxage` 把 CDN 新鲜期与浏览器新鲜期解耦、用 `Surrogate-Key`/`Cache-Tag` 做分组 purge、用 `stale-while-revalidate` + `stale-if-error` 提升可用性。静态资源（带内容 hash 的文件名）配 `public, max-age=31536000, immutable`，HTML 入口配 `no-cache` 强制每次 revalidate 拿到新 hash 引用，二者合称 cache-busting 模式。本章不展开浏览器私有缓存协议细节（属 HTTP 缓存章）、Service Worker 可编程缓存、源站架构（S3 / OAC / Varnish）与图片格式编码（AVIF/WebP/JPEG），只聚焦 CDN 这一共享缓存层：边缘缓存、origin pull、purge、CDN 专属头（`CDN-Cache-Control`/`Surrogate-Control`/`Surrogate-Key`）、Cloudflare 与 CloudFront 实践、Image CDN 自适应变换。

## 评价

**优点**

- **物理距离更近**：边缘 PoP 把 RTT 从跨洲几百毫秒压到几十毫秒，直接改善 TTFB 与 LCP
- **缓存卸载回源**：CHR 90%+ 时源站压力骤降，扛得住突发流量与攻击
- **连接预热与协议升级**：边缘与源之间长连接 + TLS 1.3 + HTTP/2 / HTTP/3，握手开销几乎可忽略
- **CDN 专属头**：`CDN-Cache-Control` / `Surrogate-Control` 让 origin / 本 CDN / 下游其他 CDN / 浏览器 五层 TTL 独立调优
- **分组失效**：`Surrogate-Key`/`Cache-Tag` 按 key 批量 purge，远胜 `purge-all`
- **可用性兜底**：`stale-if-error` 在源站故障时仍能服务旧响应，CDN 自带"容灾层"属性
- **Image CDN**：URL 参数按需 resize + 自动 AVIF/WebP 协商，省存储与回源

**缺点**

- **共享缓存语义复杂**：`no-cache` ≠ `no-store` ≠ `private` 三者极易混淆，配错会泄漏他人数据
- **配置矩阵陡峭**：CloudFront 的 Min/Default/Max TTL 与源站 Cache-Control 交互、Cloudflare Cache Rules 的 Edge TTL / Browser TTL 覆盖关系，新成员容易踩坑
- **命中率脆弱**：query 参数未归一化（utm_id 等）、滥用 Vary、带 Set-Cookie 的响应都会击穿 CHR
- **purge 有传播延迟与成本**：大规模 purge-all 反而会让整站命中率瞬时归零、源站被打
- **厂商私有特性**：Image CDN URL 参数、`CDN-Cache-Control` 等是私有约定而非全行业标准，跨厂商迁移成本不低
- **缓存层 ≠ 真相**：命中错的旧版本会让所有用户看到错误内容，调试时容易把锅甩给源站

## 文档地址

- [web.dev：Content Delivery Networks](https://web.dev/articles/content-delivery-networks)
- [MDN：Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [Cloudflare：CDN-Cache-Control](https://developers.cloudflare.com/cache/about/cdn-cache-control/)
- [AWS：CloudFront Expiration](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html)
- [RFC 9111：HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111)

## 幻灯片地址

<a href="/SlideStack/cdn-slide/" target="_blank">CDN</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=682" target="_blank" rel="noopener noreferrer">CDN 测试题</a>


## 相关章节

- HTTP 缓存基础（max-age / ETag / 启发式缓存）属协议层，本章只引用
- Service Worker 与 Cache API 是浏览器端可编程缓存，与 CDN 是两层不同位置
- 图片格式（AVIF / WebP / JPEG 编码）属编码章，本章只讲 CDN 按需转码与格式协商
- HTTP/2 / HTTP/3 / TLS 1.3 协议细节属协议章，本章只讲其在 CDN 上的性能增益
- 源站架构（S3 / OAC / 负载均衡 / Varnish 源站缓存）属后端章，本章只讲 CDN → origin 的回源策略
