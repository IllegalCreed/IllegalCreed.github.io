---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 MDN（developer.mozilla.org/en-US/docs/Web/API/Cache · CacheStorage · Using_Service_Workers）+ web.dev/articles/service-worker-caching-and-http-caching + Chrome Workbox 官方文档编写，对照 Cache API（Baseline 2018-04）/ SW API / Workbox v7 行为

## 速查

- **两层缓存**：HTTP 缓存（浏览器自动、由响应头驱动、自动过期）↔ SW 缓存（可编程、由 JS 策略驱动、**永不过期需自实现**）
- **查找顺序**：SW 缓存 → HTTP 缓存 → 网络（CDN → 源站）
- **核心 API**：`caches.open(name)` / `caches.keys()` / `caches.delete(name)` / `cache.put(req,res)` / `cache.match(req)` / `cache.add(url)` / `cache.addAll(urls)`
- **生命周期**：`install`（预缓存 app shell，`waitUntil` 包 `addAll`）→ `waiting`（旧 SW 仍在）→ `activate`（清理旧缓存）→ `controlled`（拦截 fetch）
- **五大策略**：`cache-only` / `network-only` / `cache-first`（哈希静态资源）/ `network-first`（HTML / API）/ `stale-while-revalidate`（头像 / 字体）
- **强制 HTTPS**：仅 localhost 例外；scope 默认为 SW 脚本目录
- **Response 流单次消费**：`cache.put` 前必须 `response.clone()`，否则浏览器拿到空体
- **导航预加载**：`activate` 里 `navigationPreload.enable()`，`fetch` 里 `await event.preloadResponse`，破解 SW 冷启动 50–500ms 延迟
- **Workbox v7**：`CacheFirst` / `NetworkFirst` / `StaleWhileRevalidate` / `CacheOnly` / `NetworkOnly` + `ExpirationPlugin`（maxEntries / maxAgeSeconds）
- **配额**：`StorageManager.estimate()` 查，超限浏览器**整体清除**该 origin 所有缓存

## SW 缓存是什么

Service Worker 是浏览器在页面主线程之外运行的、常驻后台的**可编程缓存拦截层**。它通过拦截自己 scope 范围内的 `fetch` 事件，决定每个请求该去 Cache API、还是网络、还是同时去。

它的核心定位有三：

- **可编程**：缓存什么、什么时候过期、回退到哪，全由 JS 表达，远比 HTTP 缓存头灵活
- **离线**：拦截 + Cache 副本能让 Web 应用在断网时仍可访问，是 PWA 的核心能力
- **可拦截**：查找顺序 **SW 缓存 → HTTP 缓存 → 网络**——SW 先看到请求才有机会拦截

> SW 缓存 ≠ HTTP 缓存。前者由 JS 策略驱动、不读 `Cache-Control` 头、永不过期；后者由浏览器自动管理、响应头驱动、自动过期。

## Cache API 速览

Cache API 暴露两个对象：**`caches`（CacheStorage）**管命名缓存容器，**`Cache`**管容器内的 Request-Response 对。

```js
// CacheStorage（caches 全局）：管容器
const cache = await caches.open("app-v1"); // 打开/创建命名缓存
const names = await caches.keys(); // ["app-v1", "static-v1"]
const has = await caches.has("app-v1"); // true
await caches.delete("app-v1"); // 删整张命名缓存

// Cache：管条目
const hit = await cache.match("/style.css"); // Response | undefined
await cache.put("/style.css", response); // 写入（response 用前必须 clone）
await cache.add("/icon.png"); // fetch + put 等价快捷方式
await cache.addAll(["/", "/app.js", "/style.css"]); // 预缓存（原子性）
await cache.delete("/old.css"); // 删单条
```

> `cache.match` 未命中时 **resolve `undefined`**，不是 reject——这是高频踩坑点，写策略时记得判空。

## 五大缓存策略速览

| 策略 | 流程 | 回写缓存 | 典型场景 |
| --- | --- | --- | --- |
| **cache-only** | 仅查缓存，未命中即失败 | 否 | 离线优先 app shell |
| **network-only** | 仅走网络，失败即失败 | 否 | 强一致写操作 / 实时数据 |
| **cache-first** | 缓存优先，未命中才网络 | 是（首次） | 哈希命名的静态资源（JS / CSS / 字体） |
| **network-first** | 网络优先，失败回退缓存 | 是 | HTML / 关键 API |
| **stale-while-revalidate** | 立即返回旧副本 + 后台更新 | 是 | 头像 / 字体 / 非关键图 |

> 五大策略的选择本质是「**新鲜度** vs **可用性**」的权衡：要新就 `network-*`，要快/可用就 `cache-*`，要平衡就 `stale-while-revalidate`。

## 生命周期速览

```
注册 register()  →  install（预缓存 app shell，waitUntil(all)）
                →  waiting（有旧 SW 时等其退场）
                →  activate（清理旧缓存，waitUntil(all)）
                →  controlled（拦截 fetch）
```

- **`self.skipWaiting()`**：让 waiting 中的新 SW 立即激活，**仅用于紧急热修复**
- **`clients.claim()`**：让新 SW 立即控制未受控的旧页面，配合 skipWaiting 才能让所有页面立刻切到新 SW
- **正常更新**：让新 SW 自然进 waiting，等下次导航时切换，更安全

## 导航预加载速览

SW 冷启动约 50ms（移动端 ~250ms、极端 >500ms）。若用 network-first，请求要等 SW 启动完才发出。**导航预加载**让网络请求与 SW 启动**并行**：

```js
// activate 里启用（feature-detect）
if (self.registration.navigationPreload) {
  await self.registration.navigationPreload.enable();
}

// fetch 里 await 预加载结果
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(async () => {
    const preload = await event.preloadResponse; // 并行预加载的响应
    if (preload) return preload;
    return fetch(event.request); // 兜底
  });
});
```

请求会自动带 `Service-Worker-Navigation-Preload: true` 头（值可 `setHeaderValue()` 改），服务器据此返回不同内容时需配 `Vary: Service-Worker-Navigation-Preload`。

## 下一步

- [深度指南](./guide-line.md)：Cache API + 拦截 + 5 策略 + Workbox + 生命周期 + 导航预加载 + PWA 离线 + 反模式
- [参考](./reference.md)：Cache API 表 + 5 策略对比表 + Workbox 表 + 生命周期 + 官方资源
