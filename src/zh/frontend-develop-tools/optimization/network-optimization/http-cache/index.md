---
layout: doc
---

# HTTP 缓存

HTTP 缓存是浏览器与中间代理在**客户端与源站之间**保存响应副本、并在下次请求同一资源时直接复用副本的机制，由 HTTP/1.1 引入并由 RFC 9111（HTTP Caching, 2022）标准化。它分两层语义：**强缓存**——副本在新鲜期内（`max-age` / `s-maxage`）时浏览器不发请求、不发条件请求、直接复用本地副本；**协商缓存**（也称再校验）——副本过期或被 `no-cache` 标记后，浏览器把本地缓存的 `ETag` / `Last-Modified` 装进 `If-None-Match` / `If-Modified-Since` 发条件请求，源站比对未变则回 `304 Not Modified`（几乎无 body），变了才回 `200 OK` + 新副本。Cache-Control 头是策略总入口，指令矩阵包括 `max-age`（新鲜期秒数）、`no-cache`（允许存储但每次必校验）、`no-store`（完全不存储）、`public` / `private`（是否允许共享缓存）、`must-revalidate`（过期必校验）、`immutable`（新鲜期内连条件请求都跳过）、`stale-while-revalidate`（过期窗口内可后台异步再校验）；协商缓存的验证器是响应头的 `ETag`（内容指纹，精度高、支持弱验证 `W/"…"`）和 `Last-Modified`（1 秒粒度时间戳），优先用前者。生产最佳组合是**版本化静态资源（文件名带 hash 指纹）配 `public, max-age=31536000, immutable`，HTML 入口配 `no-cache`**：内容变 hash 就变 URL 也变，旧副本永久有效可一直复用；HTML 是资源清单必须每次协商才能拿到新 hash 引用。除响应头策略外，HTML `<link>` 还提供四类**资源提示**——`preload`（当前页关键资源高优先级预拉取）、`prefetch`（未来导航资源低优先级预取）、`preconnect`（提前完成 DNS + TCP + TLS 握手）、`dns-prefetch`（仅提前解析 DNS），配合 Fetch Priority API 的 `fetchpriority="high"` 可显著改善 LCP。本章不展开浏览器缓存存储位置 / bfcache / Service Worker 拦截（属浏览器基础/PWA 章）、构建器 preload 魔法注释（属代码分割章）、CDN 共享缓存配置层（属 CDN 章）与 Core Web Vitals 度量（属性能度量章），只讲前端可配置的 HTTP 缓存策略头、协商缓存验证器、HTML link 资源提示及其语义边界。

## 评价

**优点**

- **零往返**：强缓存命中时浏览器不发请求、不发字节，单次往返都省——是性能优化性价比最高的一档
- **协商缓存兜底**：副本过期后用 `ETag` / `Last-Modified` 条件请求拿 304，几乎无 body，省带宽同时保证内容新鲜
- **策略表达力强**：`Cache-Control` 单一头字段覆盖新鲜期、共享/私有、必校验、不可变、stale 容忍等十余维度，组合灵活
- **immutable 加成**：版本化资源配 `immutable` 后，用户刷新时浏览器跳过对未过期资源的条件请求，Facebook 报告省 60% 请求量
- **资源提示补足优先级**：`preload` + `fetchpriority` 显式提升 LCP 资源优先级，绕过浏览器默认的低优先级 + 布局后才提升的两阶段延迟
- **协议稳定**：`Cache-Control` 由 RFC 9111 标准化、Baseline widely available（2015-07 起全主流浏览器支持），语义稳定可放心依赖

**缺点**

- **指令语义易混**：`no-cache` ≠ 不缓存（允许存储但每次必校验）、`no-store` 才是真不存储、`private` 默认值（无需显式）等高频陷阱，配错就出问题
- **不设不等于不缓存**：未写 `Cache-Control` 时浏览器走启发式缓存，按 `Last-Modified` 时间比例自行推断新鲜期，结果常出乎意料
- **共享缓存泄隐私**：动态 / 个性化 / 认证后响应漏加 `private`，CDN / 代理会把一个用户的数据返回给另一个用户
- **版本化要求强**：策略要落地必须有文件名 hash 指纹（`app.[hash].js`），改用 query string `?v=2` 部分老代理 / CDN 不缓存
- **资源提示易滥用**：无脑 `preconnect` 所有第三方域名会预开大量 TCP / TLS 连接挤占 socket 上限，反而拖慢
- **跨浏览器差异**：`immutable` 与 `stale-while-revalidate` 历史上 Chromium / Firefox / Safari 实现不一致，不支持的会安全忽略

## 文档地址

- [MDN：HTTP caching 指南](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)
- [MDN：Cache-Control 头字段参考](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control)
- [MDN：HTTP conditional requests 指南（ETag / If-None-Match / 304）](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Conditional_requests)
- [MDN：rel="preload" 属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preload)
- [web.dev：Prevent unnecessary network requests with the HTTP Cache](https://web.dev/articles/http-cache)
- [web.dev：Assist the browser with resource hints](https://web.dev/learn/performance/resource-hints)
- [RFC 9111：HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111)

## GitHub地址

[whatwg/fetch](https://github.com/whatwg/fetch) · [httpwg/http-core](https://github.com/httpwg/http-core)

## 幻灯片地址

<a href="/SlideStack/http-cache-slide/" target="_blank">HTTP 缓存</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=683" target="_blank" rel="noopener noreferrer">HTTP 缓存测试题</a>

> 待回填：题库 `http-cache.json` 经 `import:content:prod` 入库后，把 `PENDING` 换成实际 categoryId。

## 相关章节

- **浏览器缓存机制原理**（私有 vs 共享缓存定义、缓存存储位置、bfcache 前进后退快照、Service Worker 拦截、Cache Storage API、离线 PWA）属「浏览器基础 / PWA」章，本章只引用层序、不展开机制
- **CDN 共享缓存层**（`s-maxage` 在 Cloudflare / CloudFront 的配置、`Surrogate-Key` / `Cache-Tag` 分组 purge、Image CDN）属 CDN 章，本章只在头字段语义层触及 `s-maxage` / `proxy-revalidate`
- **构建器 preload 魔法注释**（webpack `/* webpackPreload: true */`、Vite / Rollup 动态 `import()` 的预加载提示）属代码分割章，本章讲运行时 HTML 手写 `<link rel="preload">`
- **Core Web Vitals 度量**（LCP / INP / CLS 阈值、Lighthouse 评分、web-vitals 库）属性能度量章，本章只涉及 `fetchpriority` / `preload` 与 LCP 的因果关系
