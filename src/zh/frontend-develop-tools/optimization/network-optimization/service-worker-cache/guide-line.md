---
layout: doc
outline: [2, 3]
---

# 深度指南

> 基于 MDN（Cache / CacheStorage / Using_Service_Workers）+ web.dev/articles/service-worker-caching-and-http-caching + Chrome Workbox（caching-strategies-overview / modules）+ web.dev/blog/navigation-preload 编写，对照 Cache API Baseline（2018-04）/ SW API / Workbox v7

## 速查

- **核心边界**：SW 缓存**不读** `Cache-Control` / `ETag`，必须自实现过期；查找顺序 **SW → HTTP → 网络**
- **CacheStorage**：`caches.open(name)` / `keys()` / `delete(name)`（删整张）/ `has` / `match`（跨缓存查）
- **Cache 接口**：`match/matchAll/add/addAll/put/delete/keys`；`addAll` 原子性；`put` 前**必须 clone**；`match` 未命中 resolve `undefined`
- **`match` 三选项**：`ignoreSearch`（忽略 ?query）/ `ignoreMethod`（默认 POST 不匹配）/ `ignoreVary`（跳过 Vary 头）
- **5 策略**：cache-only / network-only / cache-first（哈希静态）/ network-first（HTML·API）/ stale-while-revalidate（头像·字体）
- **生命周期**：install（预缓存）→ waiting → activate（清旧缓存）→ controlled；`skipWaiting` + `clients.claim` 仅用于紧急热修复
- **事件 API**：`ExtendableEvent.waitUntil(p)`（install/activate 延长存活）vs `FetchEvent.respondWith(p)`（fetch 劫持响应，必须 resolve 一个 Response）
- **分流**：`request.mode === 'navigate'`（HTML）与 `request.destination`（image/style/script/font），比文件后缀可靠
- **导航预加载**：`activate` 里 `navigationPreload.enable()` → `fetch` 里 `await event.preloadResponse`；不用也要 `event.waitUntil` 兜住防 cancel 警告
- **跨域 opaque**：`status=0`、headers 不可读，缓存需 `statuses: [0, 200]`
- **Workbox v7**：5 策略类 + `ExpirationPlugin` / `CacheableResponsePlugin` / `BroadcastUpdatePlugin`；`generateSW`（注入清单）/ `injectManifest`（自定义 SW）
- **配额**：`StorageManager.estimate()` 查；超限浏览器**整体清除**该 origin 所有缓存（含当前版本）

## SW vs HTTP 缓存（边界与分工）

| 维度 | HTTP 缓存（RFC 9111） | SW 缓存（Cache API + SW） |
| --- | --- | --- |
| **驱动方式** | 响应头（`Cache-Control` / `ETag`） | JS 策略（fetch 事件 + Cache 接口） |
| **是否自动过期** | 是（按 `max-age` / `s-maxage`） | **否**，永不过期，需自实现 |
| **可编程性** | 不可，只能配头 | 完全可编程，可写任意策略 |
| **作用域** | 浏览器自动管理（内存/磁盘） | SW scope（默认 SW 脚本目录） |
| **是否需 JS** | 否 | 是（注册 + 事件处理） |

**查找顺序**：SW 缓存 → HTTP 缓存 → 网络（CDN → 源站）。SW 是浏览器看到请求后**第一个**有机会处理的层，未命中或未拦截才回退到 HTTP 缓存。

> Cache API 是独立于 HTTP 缓存的高层 API，不读响应头字段。要让 SW 用更长 TTL，必须自实现过期，不能指望 `max-age`。

## CacheStorage（caches 全局）

```js
// 容器级 API
const cache = await caches.open("app-v1"); // 打开/创建命名缓存
const names = await caches.keys(); // 全部命名缓存名（数组）
const ok = await caches.delete("app-v1"); // 删整张命名缓存，返回 boolean
const has = await caches.has("app-v1"); // 是否存在
const hit = await caches.match(request, options); // 跨所有命名缓存查第一个命中
```

> **版本化命名是关键**：`app-v1` / `static-v2` 让 activate 阶段能区分新旧版本，旧版可安全 `caches.delete`。直接叫 `'app'` 无法在 activate 区分新旧，旧条目永远残留。

## Cache 接口（容器内条目）

| 方法 | 语义 | 关键点 |
| --- | --- | --- |
| `match(req, opts)` | 查第一个命中 | 未命中 resolve `undefined`，**非 reject** |
| `matchAll(req, opts)` | 查全部命中 | 返回 Response 数组 |
| `put(req, res)` | 写入 Request-Response 对 | Response 用前**必须 clone()** |
| `add(url)` | fetch + put 等价 | 失败时 cache 不变 |
| `addAll(urls)` | 批量预缓存 | **原子性**，任一失败整批 reject |
| `delete(req, opts)` | 删单条 | 返回 boolean |
| `keys()` | 列全部 Request | 用于迭代清理 |

### match 的三选项

| 选项 | 默认 | 作用 |
| --- | --- | --- |
| `ignoreSearch` | `false` | `true` 时忽略 URL 查询串，让 `?v=1` 与 `?v=2` 命中同一条 |
| `ignoreMethod` | `false` | 默认 POST / PUT / DELETE **不匹配**；`true` 时不区分 |
| `ignoreVary` | `false` | `true` 时跳过 Response 的 `Vary` 头校验 |

> `ignoreSearch: true` 对带查询参数的 API 是灾难（`/api?a=1` 与 `/api?a=2` 共用一条缓存）；仅用于静态资源版本号变更等刻意场景。

## Response 流只能读一次（必懂）

底层是 `ReadableStream`，被消费一次后就锁定，无法重复读。

```js
// 错误：put 后 response 已被消费，浏览器拿到空体
const res = await fetch(request);
await cache.put(request, res);
return res; // 空！

// 正确：clone 后副本入缓存，原响应返回浏览器
const res = await fetch(request);
await cache.put(request, res.clone());
return res;
```

> `addAll` 内部已处理 clone，无需手动写。`fetch(event.request)` 后想再 `put` 时，request 也可能被消费，必要时 `event.request.clone()`。

## fetch 事件拦截

```js
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // 1. 仅拦截 GET（POST/PUT/DELETE 永远走网络）
  if (request.method !== "GET") return;

  // 2. 按 mode / destination 分流策略
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request)); // HTML 用 network-first
  } else if (request.destination === "image") {
    event.respondWith(staleWhileRevalidate(request)); // 图片用 SWR
  } else if (["style", "script", "font"].includes(request.destination)) {
    event.respondWith(cacheFirst(request)); // 静态资源用 cache-first
  }
});
```

**关键属性**

| 属性 | 取值 | 用途 |
| --- | --- | --- |
| `request.mode` | `navigate` / `same-origin` / `cors` / `no-cors` | `navigate` 区分 HTML 文档 |
| `request.destination` | `image` / `style` / `script` / `font` / `document` 等 | 比文件后缀**更可靠** |
| `request.method` | `GET` / `POST` / ... | 仅 GET 缓存 |
| `request.url` | URL 字符串 | 路由匹配 |

> `event.respondWith(promise)` 必须 resolve 一个 Response 对象，否则浏览器抛 `TypeError`。离线兜底用 `new Response('offline', { status: 504, headers: { 'Content-Type': 'text/plain' } })`。

## 五大缓存策略详解

### cache-only（仅缓存）

```js
async function cacheOnly(request) {
  const hit = await caches.match(request);
  return hit || new Response("Not in cache", { status: 504 });
}
```

- **流程**：仅查缓存，未命中即失败
- **回写缓存**：否
- **典型场景**：app shell 已预缓存、断网时强制本地

### network-only（仅网络）

```js
async function networkOnly(request) {
  return fetch(request);
}
```

- **流程**：仅走网络，失败即失败
- **回写缓存**：否
- **典型场景**：强一致写操作、实时数据（股价 / 库存）

### cache-first（缓存优先）

```js
async function cacheFirst(request) {
  const hit = await caches.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  const cache = await caches.open("runtime-v1");
  cache.put(request, res.clone());
  return res;
}
```

- **流程**：缓存优先，命中即返；未命中才网络 + 回写
- **回写缓存**：是（首次）
- **典型场景**：**哈希命名的静态资源**（`app.[hash].js`、`/static/fonts/xxx.woff2`）—— 内容变 hash 就变，URL 永远稳定 → 内容永远新鲜

### network-first（网络优先）

```js
async function networkFirst(request) {
  try {
    const res = await fetch(request);
    const cache = await caches.open("runtime-v1");
    cache.put(request, res.clone());
    return res;
  } catch (err) {
    const hit = await caches.match(request);
    return hit || new Response("Offline", { status: 504 });
  }
}
```

- **流程**：网络优先，成功即返 + 回写；失败回退缓存
- **回写缓存**：是
- **典型场景**：**HTML 文档 / 关键 API**（要新鲜，但断网时仍可用）

### stale-while-revalidate（SWR）

```js
async function staleWhileRevalidate(request) {
  const cache = await caches.open("runtime-v1");
  const hit = await cache.match(request);
  const fetchPromise = fetch(request).then((res) => {
    cache.put(request, res.clone());
    return res;
  });
  return hit || fetchPromise; // 有旧就返旧，后台更新；无旧就等网络
}
```

- **流程**：立即返回旧副本，同时后台 fetch 更新缓存
- **回写缓存**：是
- **典型场景**：**头像 / 字体 / 非关键图**（要快，也要最终一致）

## Workbox v7

Google 官方维护的 SW 工具集，覆盖 precache / runtime / expiration / broadcast-update 等场景，生产环境优先用它而非手写 SW。

### 五大策略类

```js
import { CacheFirst, NetworkFirst, StaleWhileRevalidate, CacheOnly, NetworkOnly }
  from "workbox-strategies";
import { registerRoute } from "workbox-routing";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

// 静态资源：cache-first + 30 天过期 + 上限 60 条
registerRoute(
  ({ request }) => ["style", "script", "font"].includes(request.destination),
  new CacheFirst({
    cacheName: "static-v1",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 3600 }),
    ],
  })
);

// HTML：network-first + 7 天过期
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({ cacheName: "pages-v1", plugins: [/*...*/] })
);

// 图片：SWR + 30 天 + 60 条
registerRoute(
  ({ request }) => request.destination === "image",
  new StaleWhileRevalidate({
    cacheName: "images-v1",
    plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 3600 })],
  })
);
```

### 关键插件

| 插件 | 作用 |
| --- | --- |
| `ExpirationPlugin({ maxEntries, maxAgeSeconds, purgeOnQuotaError })` | 按条数 / 时间自动淘汰过期条目并清理 |
| `CacheableResponsePlugin({ statuses: [0, 200] })` | 只缓存符合状态的响应（0=opaque 跨域、200=正常） |
| `BroadcastUpdatePlugin` | 缓存更新时通知所有页面（提示「新版本可用」） |
| `BackgroundSyncPlugin` | 失败请求入队、网络恢复后重试 |

### 路由匹配方式

- **RegExp**：`registerRoute(/\/api\/.*\.(?:png|jpg)/, strategy)`
- **matchCallback**：`({ url, request, event }) => boolean`
- **destination**：`({ request }) => request.destination === 'image'`

### SW 生成方式

- **`generateSW`**：传入清单，自动生成 SW（开箱即用，配置驱动）
- **`injectManifest`**：在已有 SW 模板里注入 precache 清单（自定义逻辑，灵活）

## 生命周期详解

### install（预缓存）

```js
const PRECACHE = "precache-v1";
const PRECACHE_URLS = ["/", "/index.html", "/app.js", "/style.css"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});
```

- **作用**：在 SW 安装时把 app shell 核心资源预缓存
- **`waitUntil`**：保证缓存写入完成前 SW 不进入 `activated`
- **`addAll` 原子性**：任一 URL 失败则整批 reject，整个 SW 安装失败，下次注册重试 → 保证要么全部可用要么回退上一版
- **陷阱**：清单里有 404 资源会让整批失败，必须保证全部可访问

### activate（清理旧缓存）

```js
const ALLOW_LIST = ["precache-v1", "runtime-v1"];

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => !ALLOW_LIST.includes(n)).map((n) => caches.delete(n))
      )
    )
  );
});
```

- **作用**：清理旧版本缓存（白名单外的全部 `caches.delete`）
- **不清理的后果**：配额被撑爆 → 浏览器**整体清除**该 origin 所有缓存（含当前版本）

### waiting → controlled

- **waiting**：有旧 SW 时，新 SW 安装成功后进入 waiting，等所有旧页面关闭才激活
- **`self.skipWaiting()`**：跳过 waiting，让新 SW 立即激活（**仅紧急热修复**）
- **`clients.claim()`**：让新 SW 立即控制未受控的旧页面（配合 skipWaiting 才能立刻切到新 SW）

```js
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // 清旧缓存
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => !ALLOW_LIST.includes(n)).map((n) => caches.delete(n))
      );
      // 立即控制未受控页面
      await self.clients.claim();
    })()
  );
});
```

> 正常流程是下次导航时自然切换，更安全——`skipWaiting` 后旧页面可能用旧 fetch、新 SW 已激活，存在版本不一致风险。

## 导航预加载（Navigation Preload）

SW 冷启动约 50ms（移动端 ~250ms、极端 >500ms）。若用 network-first，请求要等 SW 启动完才发出，引入串行延迟。导航预加载让网络请求与 SW 启动**并行**。

```js
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
        // 可选：自定义请求头值
        // await self.registration.navigationPreload.setHeaderValue("json");
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.mode !== "navigate") return;

  event.respondWith(async () => {
    // 1. 拿到与 SW 启动并行的预加载响应
    const preload = await event.preloadResponse;
    if (preload) return preload;

    // 2. 预加载未启用/失败，退回 network-first
    try {
      const res = await fetch(request);
      const cache = await caches.open("pages-v1");
      cache.put(request, res.clone());
      return res;
    } catch (err) {
      const hit = await caches.match(request);
      return hit || new Response("Offline", { status: 504 });
    }
  });
});
```

**请求头与服务器协作**：预加载请求自动带 `Service-Worker-Navigation-Preload: true` 头（值可 `setHeaderValue()` 改），服务器据此返回不同内容（如只返骨架页或部分 include），需配 `Vary: Service-Worker-Navigation-Preload` 让 CDN / HTTP 缓存区分两种响应。

> **不用预加载也要兜住**：若启用后 `fetch` 里不 `await event.preloadResponse` 也不 `event.waitUntil` 兜住它，控制台会报 `navigation preload request was cancelled before preloadResponse settled`，且浪费已发出的预加载请求。

## 跨域 opaque 响应

跨域请求若 `mode: 'no-cors'`（如第三方图床、CDN 字体），响应是 opaque 的：

- `response.status === 0`（不是真实状态码）
- `response.headers` 不可读（无法检查 `content-type`）
- `response.body` 不可读（但可整体缓存）

要缓存它必须用 `statuses: [0, 200]` 白名单（默认 `[200]` 会拒掉）：

```js
new CacheableResponsePlugin({ statuses: [0, 200] });
```

> 不要试图读 `response.headers.get('content-type')` 做分流——永远是 `null`，要用 `request.destination` 替代。

## PWA 离线应用

把上述能力组合起来就是一个完整离线应用：

```js
// sw.js
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst, StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

// 1. 预缓存 app shell（build 时注入清单）
precacheAndRoute(self.__WB_MANIFEST || []);

// 2. HTML 用 network-first，离线回退到缓存的 app shell
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({ cacheName: "pages", networkTimeoutSeconds: 3 })
);

// 3. 图片用 SWR
registerRoute(
  ({ request }) => request.destination === "image",
  new StaleWhileRevalidate({
    cacheName: "images",
    plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 3600 })],
  })
);

// 4. 离线兜底页
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(async () => {
      try {
        return await fetch(event.request);
      } catch {
        return caches.match("/offline.html");
      }
    });
  }
});
```

**配套 manifest**：`<link rel="manifest" href="/manifest.webmanifest">` + `display: standalone` 让应用可被「安装到主屏」，是 PWA 的另一半（不在本章展开，属 PWA 总览）。

## 反模式（避坑）

- **把 HTTP 缓存头当 SW 过期依据**：Cache API 不读 `Cache-Control` / `max-age`，缓存永不过期，必须自实现 `ExpirationPlugin` 或手动 `delete`
- **`cache.put` 前 Response 不 `clone()`**：流只能读一次，put 消费后浏览器拿到空体
- **缓存名不版本化（直接叫 `'app'`）**：activate 无法区分新旧，旧条目永远残留；不清理会撑爆配额导致浏览器整体清除
- **`install.addAll` 清单含 404**：原子性让整批 reject、SW 安装失败、页面回退无缓存可用；必须保证预缓存清单全部可访问
- **对所有请求都缓存（含 POST/写操作）**：SW 缓存只对幂等 GET 有意义，POST/PUT/DELETE 缓存会返回脏数据；正确做法是策略仅限 GET 且无 body 的读请求
- **`respondWith` resolve 成 `undefined` 或抛错**：必须始终 resolve 一个 Response（包括离线兜底 `new Response(...)`），否则浏览器拿不到响应、控制台报 `TypeError`
- **缓存前不校验 `response.status`**：会把 4xx / 5xx 错误页缓存下来，离线时给用户返回错误页；用 `CacheableResponsePlugin` 或 `if (response.ok)` 过滤
- **缓存 opaque 后读 `headers.get('content-type')` 做分流**：opaque status=0、headers 不可读，检查永远 false；改用 `request.destination` 分流
- **不清理 `caches.keys()` 里的旧版本**：配额有限，超限浏览器整体清除该 origin 所有缓存（含当前版本）
- **导航请求走 cache-first 永不更新**：用户永远看到旧 HTML（即使部署了新版）；导航常用 network-first 或 SWR 让首页能更新
- **`ignoreSearch: true` 但不理解后果**：让 `/api?a=1` 与 `/api?a=2` 命中同一条缓存，对带 query 的 API 是灾难；仅用于静态资源版本号变更场景
- **启用 `navigationPreload` 但不 `await event.preloadResponse` 也不 `waitUntil` 兜住**：控制台报 `navigation preload request was cancelled`，且浪费已发出的预加载请求
- **SW 内 `fetch(event.request)` 形成无限递归**：SW 自身的 fetch 默认会再次触发 fetch 事件，必要时用 `new Request` 或区分 URL 跳过自身
- **`skipWaiting` + `clients.claim` 当常规**：仅用于紧急热修复，正常更新让新 SW 进 waiting；立即激活可能与未刷新页面版本不一致
- **HTTPS 之外尝试注册 SW**：浏览器拒绝（仅 localhost 例外）；要扩大 scope 让服务器返回 `Service-Worker-Allowed` 响应头

## 下一步

- [参考](./reference.md)：Cache API 完整表 + 5 策略对比表 + Workbox 表 + 生命周期 + 官方资源
