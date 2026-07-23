---
layout: doc
---

# Service Worker 缓存

Service Worker 缓存是浏览器在**页面主线程之外**运行的**可编程缓存拦截层**：一段常驻后台的 JavaScript（Service Worker，下称 SW）通过拦截自身 scope 范围内的 `fetch` 事件，决定每一个请求「该去 Cache API、还是去网络、还是同时去」，由 `caches.open(name)` 拿到命名缓存对象、用 `cache.put/match/delete` 增查删 Request-Response 对。它和 HTTP 缓存的关键区别是：**Cache API 不读 `Cache-Control` / `Expires` / `ETag` 等响应头**——MDN 与 Chrome 官方文档都明确，Cache 接口是一个独立于 HTTP 缓存的高层 API，缓存条目除非主动 `delete` 否则永不过期，过期策略必须由开发者用 JS 或 Workbox 的 `ExpirationPlugin` 自己实现。请求查找顺序是 **SW 缓存 → HTTP 缓存 → 网络（CDN → 源站）**：SW 先看到请求才有机会拦截，命中失败再回退到浏览器自动管理的 HTTP 缓存，最后才真正出门去网络。围绕这个核心，业界沉淀出五大缓存策略——`cache-only`（仅缓存，离线优先）、`network-only`（仅网络，强一致）、`cache-first`（缓存优先，命中即返，未命中才去网络，适合哈希命名的静态资源）、`network-first`（网络优先，失败回退缓存，适合 HTML / API）、`stale-while-revalidate`（立即返回旧副本同时后台更新，适合头像 / 字体 / 非关键图），由 Google 维护的 **Workbox v7** 提供了对应的策略类（`CacheFirst` / `NetworkFirst` / `StaleWhileRevalidate` / `CacheOnly` / `NetworkOnly`）与开箱即用的 `ExpirationPlugin`（按 `maxEntries` / `maxAgeSeconds` 淘汰）、`CacheableResponsePlugin`（按状态码白名单过滤）。SW 自身的生命周期分 `install` → `waiting` → `activate` → `controlled` 四阶段：`install` 事件里常做 `cache.addAll` 预缓存 app shell；`activate` 里清理旧版本缓存（`caches.keys()` 过滤白名单后 `caches.delete`）；`fetch` 里按 `request.mode === 'navigate'`（HTML）和 `request.destination`（`image` / `style` / `script` / `font`）分流策略；`self.skipWaiting()` 让新 SW 立即激活、`clients.claim()` 立即控制未受控页面，但**仅用于紧急热修复**，正常更新让新 SW 自然进 waiting 更安全。导航预加载（Navigation Preload）是 SW 冷启动（移动端 ~250ms，极端 >500ms）的加速器——在 `activate` 里 `navigationPreload.enable()`，浏览器会在 SW 启动的同时并行发出导航请求，请求自动带 `Service-Worker-Navigation-Preload: true` 头，服务器可据此返回不同内容（需配 `Vary: Service-Worker-Navigation-Preload`），SW 用 `await event.preloadResponse` 拿到并行结果。Cache API 自 2018-04 起 Baseline widely available，全主流浏览器（Chrome / Firefox / Edge / Safari）支持；SW 仅在 HTTPS（含 localhost）下注册；Workbox 当前稳定大版本为 v7。整体无废弃 API，是 PWA 离线能力的基石。

## 评价

**优点**

- **可编程拦截**：SW 把「缓存什么、什么时候过期、回退到哪」从浏览器手里交给开发者，能用 JS 表达任意策略，远比 `Cache-Control` 头灵活
- **离线可用**：拦截 + Cache 副本能让 Web 应用在网络断开时仍可访问，是 PWA 的核心能力
- **冷启动可控**：导航预加载让 SW 启动与网络请求并行，破解了「SW 启动串行挡在请求前」的延迟瓶颈
- **版本化可控**：缓存名带版本号 + `activate` 清理旧版本，部署新版后能精确淘汰旧资源，不会被浏览器启发式缓存干扰
- **生态成熟**：Workbox v7 覆盖 precache / runtime / expiration / broadcast-update / googleFontsCache 等场景，是 Google 官方维护的工业级方案
- **协议稳定**：Cache API 与 SW API 自 2018 起全主流浏览器稳定可用，无废弃 API

**缺点**

- **HTTPS 强制**：SW 是中间人代理，HTTP 下可被注入篡改，浏览器拒绝注册（仅 localhost 例外）
- **不读 HTTP 头**：`Cache-Control` / `ETag` 等响应头对 Cache API 完全无效，必须自实现过期策略，常用 `ExpirationPlugin`
- **配额有限且会整体清除**：浏览器按 origin 给配额（可用 `StorageManager.estimate()` 查），超限会**整体清除该 origin 的所有缓存**（含当前版本），不版本化与不清理都很危险
- **坑多易踩**：Response 流只能读一次（必须 `clone()`）、`addAll` 原子性（一条失败整批 reject）、`respondWith` 必须 resolve 一个 Response 对象、跨域 opaque 响应 status=0 等，手写 SW 易踩坑
- **更新有窗口期**：新 SW 默认进 `waiting`，要等所有旧页面关闭才激活，紧急修复需 `skipWaiting` + `clients.claim` 但有版本不一致风险
- **调试门槛**：SW 在独立线程跑，DevTools 的 Application / Network 面板要专门查看；缓存清理、scope 控制、unregister 操作易被新手忽略

## 文档地址

- [MDN Cache 接口](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
- [MDN CacheStorage 接口](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage)
- [MDN Using Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)
- [web.dev：SW 缓存与 HTTP 缓存](https://web.dev/articles/service-worker-caching-and-http-caching)
- [Chrome Workbox 缓存策略总览](https://developer.chrome.com/docs/workbox/caching-strategies-overview)
- [web.dev 导航预加载](https://web.dev/blog/navigation-preload)

## GitHub 地址

[GoogleChrome/workbox](https://github.com/GoogleChrome/workbox) · [mdn/content（文档源）](https://github.com/mdn/content)

## 幻灯片地址

<a href="/SlideStack/service-worker-cache-slide/" target="_blank">Service Worker 缓存</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=686" target="_blank" rel="noopener noreferrer">Service Worker 缓存测试题</a>

> 注：题库分类 ID 在 import 入库后回填本页与 sidebar 占位（`PENDING` 是占位符）。

## 同章其他叶子

- [CDN](../cdn/index.md) · [HTTP 缓存](../http-cache/index.md) · [压缩](../compression/index.md) · [HTTP/2·HTTP/3](../http2-http3/index.md)

