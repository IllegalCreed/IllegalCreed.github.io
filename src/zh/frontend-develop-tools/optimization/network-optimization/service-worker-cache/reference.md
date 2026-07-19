---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 MDN（Cache / CacheStorage / Using_Service_Workers）+ web.dev + Chrome Workbox 官方文档编写，对照 Cache API Baseline（2018-04）/ SW API / Workbox v7

## 速查

- **核心 API**：`caches.open/match/has/delete/keys`（CacheStorage）+ `cache.match/matchAll/add/addAll/put/delete/keys`（Cache）
- **5 策略**：cache-only / network-only / cache-first（哈希静态）/ network-first（HTML·API）/ stale-while-revalidate（头像·字体）
- **生命周期**：install → waiting → activate → controlled；`skipWaiting` + `clients.claim` 仅用于紧急热修复
- **导航预加载**：`navigationPreload.enable()` + `await event.preloadResponse`，破解冷启动 50–500ms 延迟
- **Workbox v7**：5 策略类 + `ExpirationPlugin` / `CacheableResponsePlugin` / `BroadcastUpdatePlugin`
- **强制 HTTPS**：仅 localhost 例外；scope 默认 SW 脚本目录，`Service-Worker-Allowed` 扩大
- **跨域 opaque**：status=0，缓存需 `statuses: [0, 200]`
- **查找顺序**：SW 缓存 → HTTP 缓存 → 网络
- 完整说明见 [入门](./getting-started.md) / [深度指南](./guide-line.md)

## CacheStorage（caches 全局）方法

| 方法 | 返回值 | 语义 |
| --- | --- | --- |
| `caches.open(name)` | `Promise<Cache>` | 打开/创建命名缓存容器 |
| `caches.keys()` | `Promise<string[]>` | 列全部命名缓存名 |
| `caches.has(name)` | `Promise<boolean>` | 是否存在该命名缓存 |
| `caches.delete(name)` | `Promise<boolean>` | 删整张命名缓存（与 `cache.delete` 删单条不同） |
| `caches.match(req, opts)` | `Promise<Response \| undefined>` | 跨所有命名缓存查第一个命中 |

## Cache 接口方法

| 方法 | 返回值 | 语义 | 关键点 |
| --- | --- | --- | --- |
| `cache.match(req, opts)` | `Promise<Response \| undefined>` | 查第一个命中 | 未命中 resolve `undefined`，非 reject |
| `cache.matchAll(req, opts)` | `Promise<Response[]>` | 查全部命中 | 返回数组 |
| `cache.put(req, res)` | `Promise<void>` | 写入 Request-Response 对 | Response 用前**必须 clone()** |
| `cache.add(url)` | `Promise<void>` | fetch + put 等价 | 失败时 cache 不变 |
| `cache.addAll(urls)` | `Promise<void>` | 批量预缓存 | **原子性**，任一失败整批 reject |
| `cache.delete(req, opts)` | `Promise<boolean>` | 删单条 | 返回是否删除 |
| `cache.keys()` | `Promise<Request[]>` | 列全部 Request | 用于迭代清理 |

## cache.match 选项

| 选项 | 默认 | 作用 |
| --- | --- | --- |
| `ignoreSearch` | `false` | `true` 时忽略 URL 查询串（`?v=1` 与 `?v=2` 命中同一条） |
| `ignoreMethod` | `false` | 默认 POST/PUT/DELETE 不匹配；`true` 时不区分 |
| `ignoreVary` | `false` | `true` 时跳过 Response 的 `Vary` 头校验 |

## 五大缓存策略对比

| 策略 | 流程 | 回写缓存 | 失败兜底 | 典型场景 |
| --- | --- | --- | --- | --- |
| **cache-only** | 仅查缓存 | 否 | 失败 504 | 离线 app shell |
| **network-only** | 仅网络 | 否 | 失败即失败 | 强一致写操作 / 实时数据 |
| **cache-first** | 缓存优先，未命中才网络 | 是（首次） | 走网络 | 哈希命名静态资源（JS/CSS/字体） |
| **network-first** | 网络优先，失败回退缓存 | 是 | 缓存兜底 | HTML / 关键 API |
| **stale-while-revalidate** | 立即返旧 + 后台更新 | 是 | 等网络 | 头像 / 字体 / 非关键图 |

## Workbox v7 策略类

| 类 | 等价策略 | 常用插件 |
| --- | --- | --- |
| `CacheFirst` | cache-first | `ExpirationPlugin` + `CacheableResponsePlugin` |
| `NetworkFirst` | network-first | `NetworkFirst({ networkTimeoutSeconds: 3 })` |
| `StaleWhileRevalidate` | SWR | `ExpirationPlugin` |
| `CacheOnly` | cache-only | 用于已预缓存资源 |
| `NetworkOnly` | network-only | 配 `BroadcastUpdatePlugin` 提示更新 |

## Workbox 关键插件

| 插件 | 作用 | 关键参数 |
| --- | --- | --- |
| `ExpirationPlugin` | 自动淘汰过期/超量条目 | `maxEntries` / `maxAgeSeconds` / `purgeOnQuotaError` |
| `CacheableResponsePlugin` | 按状态码白名单过滤响应 | `statuses: [0, 200]`（含 opaque 跨域） |
| `BroadcastUpdatePlugin` | 缓存更新时通知所有页面 | `channelName` / `headersToCheck` |
| `BackgroundSyncPlugin` | 失败请求入队、网络恢复后重试 | `maxRetentionTime` / `onSync` |

## SW 生命周期阶段

| 阶段 | 触发 | 常用操作 |
| --- | --- | --- |
| `install` | 首次注册或脚本字节变化 | `event.waitUntil(caches.addAll(...))` 预缓存 |
| `waiting` | 有旧 SW 活跃时 | 默认等待旧页面关闭；`self.skipWaiting()` 立即跳过 |
| `activate` | 旧 SW 退场后 | `event.waitUntil(caches.delete 旧版本)` + `clients.claim()` |
| `controlled` | activate 完成 | 开始拦截 `fetch` 事件 |

**事件 API 速查**

| API | 用途 |
| --- | --- |
| `ExtendableEvent.waitUntil(promise)` | install / activate 时延长 SW 存活直到 Promise resolve |
| `FetchEvent.respondWith(promise)` | fetch 劫持响应，必须 resolve 一个 Response 对象 |
| `FetchEvent.preloadResponse` | 导航预加载结果的 Promise（未启用时 resolve `undefined`） |

## request 分流属性

| 属性 | 取值 | 用途 |
| --- | --- | --- |
| `request.mode` | `navigate` / `same-origin` / `cors` / `no-cors` | `navigate` 区分 HTML 文档 |
| `request.destination` | `image` / `style` / `script` / `font` / `document` / ... | 比文件后缀**更可靠** |
| `request.method` | `GET` / `POST` / ... | 仅缓存 GET |
| `request.url` | URL 字符串 | 路由匹配 |

## 导航预加载 API

| API | 作用 |
| --- | --- |
| `registration.navigationPreload.enable()` | 启用（activate 里调） |
| `registration.navigationPreload.disable()` | 禁用 |
| `registration.navigationPreload.setHeaderValue(value)` | 自定义请求头值（默认 `'true'`） |
| `registration.navigationPreload.getState()` | 查启用状态与头值 |
| `event.preloadResponse` | 预加载响应的 Promise（未启用时 resolve `undefined`） |

请求头：`Service-Worker-Navigation-Preload: true`；服务器据此返回不同内容时需配 `Vary: Service-Worker-Navigation-Preload`。

## 注册与 scope

```js
// 注册
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

// 状态
const reg = await navigator.serviceWorker.ready;
// reg.installing / reg.waiting / reg.active
```

| 项 | 取值 |
| --- | --- |
| scope 默认值 | SW 脚本所在目录 |
| 扩大 scope | 服务器响应 `Service-Worker-Allowed: /` 头 |
| HTTPS 强制 | 仅 `localhost` / `127.0.0.1` 例外 |
| 跨域脚本 | 需 `crossorigin` + CORS 允许 |
| 注销 | `registration.unregister()` |

## 配额与清理

```js
// 查配额
if (navigator.storage && navigator.storage.estimate) {
  const { usage, quota } = await navigator.storage.estimate();
  console.log(`${usage} / ${quota} bytes (${((usage / quota) * 100).toFixed(1)}%)`);
}
```

| 行为 | 触发 |
| --- | --- |
| 配额超限 | 浏览器**整体清除**该 origin 所有缓存（含当前版本） |
| `purgeOnQuotaError: true` | ExpirationPlugin 在配额超限时才清理（保守策略） |
| LRU 淘汰 | ExpirationPlugin 按时间 + 条数自动淘汰 |

## 跨域 opaque 响应特征

| 特征 | 值 |
| --- | --- |
| `status` | `0`（不是真实状态码） |
| `headers` | 不可读（`get(...)` 永远返回 `null`） |
| `body` | 不可读（但可整体缓存） |
| 缓存白名单 | 必须 `statuses: [0, 200]` |

## 版本与运行环境

| 项 | 取值 |
| --- | --- |
| Cache API | Baseline widely available（2018-04 起） |
| Service Worker API | 全主流浏览器默认启用（Chrome/Firefox/Edge/Safari） |
| NavigationPreloadManager | 三大浏览器引擎均已支持 |
| Workbox 稳定版 | v7 |
| HTTPS 要求 | 强制（仅 localhost 例外） |
| 题库基准时间 | 2026 |

## 官方资源

- MDN Cache 接口：[developer.mozilla.org/en-US/docs/Web/API/Cache](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
- MDN CacheStorage 接口：[developer.mozilla.org/en-US/docs/Web/API/CacheStorage](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage)
- MDN Using Service Workers：[developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)
- web.dev SW 缓存 vs HTTP 缓存：[web.dev/articles/service-worker-caching-and-http-caching](https://web.dev/articles/service-worker-caching-and-http-caching)
- Chrome Workbox 缓存策略总览：[developer.chrome.com/docs/workbox/caching-strategies-overview](https://developer.chrome.com/docs/workbox/caching-strategies-overview)
- web.dev 导航预加载：[web.dev/blog/navigation-preload](https://web.dev/blog/navigation-preload)
- Workbox GitHub：[github.com/GoogleChrome/workbox](https://github.com/GoogleChrome/workbox)
- Workbox 模块文档：[developer.chrome.com/docs/workbox](https://developer.chrome.com/docs/workbox)
- MDN PWA 总入口：[developer.mozilla.org/en-US/docs/Web/Progressive_web_apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
