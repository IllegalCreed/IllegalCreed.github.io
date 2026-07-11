---
layout: doc
outline: [2, 3]
---

# fetch 拦截与离线

> 基于 W3C Service Workers 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **核心机制**：SW 注册 `fetch` 事件监听器后，本作用域内**每一个网络请求**（导航、子资源、跨源引用）都会先经过它——SW 由此成为可编程网络代理。
- **`event.respondWith(responseOrPromise)`**：在 `fetch` 事件里调用它，就"劫持"了这个请求——你返回什么（缓存/网络/合成 `Response`），页面就拿到什么。
- **不调 `respondWith` = 放行**：没调用它的请求走浏览器默认网络流程，和没有 SW 一样；**必须同步决定**是否接管（不能等异步结果再决定要不要 `respondWith`）。
- **`event.request`**：被拦截的 `Request` 对象，含 `url`、`method`、`mode`（`navigate`/`cors`/`no-cors`）、`destination`（`document`/`script`/`image`…）——请求过滤就靠读它。
- **请求过滤**：通常只接管 GET；`POST`/`PUT` 等直接放行网络（Cache API 只认 GET）；按 `request.mode === "navigate"` 单独处理页面导航。
- **缓存策略与 Cache API 不在本页**：cache-first / network-first / stale-while-revalidate 的写法、`caches.match`/`put`/`clone()`/opaque 响应/版本化清理**全部在[浏览器章](/zh/base/browser/browser-cache/guide-line/sw-cache-api)**；本页只讲"在哪拦、怎么兜底"。
- **离线兜底页**：`fetch` 失败（`catch`）时，对**导航请求**返回预缓存的 `/offline.html`，是最小可用离线体验的标配。
- **navigation preload**：`registration.navigationPreload.enable()` 让浏览器在**唤醒 SW 的同时**并行发起导航请求，用 `event.preloadResponse` 取结果——消除"SW 冷启动"给导航带来的延迟。
- **SW 冷启动问题**：SW 空闲会被终止，导航时需先启动 SW 再处理——navigation preload 正是为这段启动延迟设计的加速器。
- **`InstallEvent.addRoutes()`（静态路由，较新）**：在 install 时声明"这些 URL 直接走网络/缓存、别叫醒 SW"，进一步省掉 SW 参与开销（浏览器支持有限，需探测）。
- **响应流只能读一次**：一份 `Response` 的 body 是流，"给页面"和"存缓存"要 `clone()` 分身——`clone()` 细节与 opaque 响应坑见[浏览器章](/zh/base/browser/browser-cache/guide-line/sw-cache-api)。
- **`respondWith` 内部报错的后果**：promise reject 且没兜底 → 页面拿到网络错误（相当于请求失败）——务必 `catch` 兜底。
- **别拦你不该拦的**：跨源第三方脚本、分析打点、Range 请求（视频）等盲目接管易出错——过滤白名单/黑名单要清晰。
- **SW 里没有 `window`**：`fetch` 事件用全局 `fetch()`、`caches`、`clients`，拿不到 DOM——离线页是**预缓存的静态 HTML**，不是运行时渲染。
- **DevTools 判读**：被 SW 兑现的请求在 Network 面板 Size 栏显示 `(ServiceWorker)`；要旁路 SW 调网络用 Application → Service workers 勾 **Bypass for network**。
- **离线检测**：`navigator.onLine` 只是弱信号（连着 WiFi 但没网也是 `true`）——真正的离线兜底靠 `fetch` 的 `catch`，不靠 `onLine`。

## 一、fetch 事件：SW 成为网络代理的地方

前面几页反复说"SW 是可编程网络代理"，**这个能力就落在 `fetch` 事件上**。一旦 SW 激活并控制了页面，页面发出的**每一个**网络请求——导航（打开页面本身）、子资源（`<script>`/`<img>`/CSS）、甚至页面里引用的**跨源资源**——都会在 SW 里触发一次 `fetch` 事件：

```js
// sw.js —— 最小的"透明代理"：什么都不改，原样转发
self.addEventListener("fetch", (event) => {
  // event.request 是被拦截的 Request；这里直接放行到网络
  // 不调用 respondWith 也等价于放行——写出来是为了后面加逻辑
  event.respondWith(fetch(event.request));
});
```

关键理解 `event.respondWith()`：

- **调用它 = 接管这个请求**。你传入一个 `Response` 或"最终 resolve 成 Response 的 promise"，页面就拿这个结果，**完全不管原始网络行为**。
- **不调用它 = 放行**。该请求走浏览器默认流程，和没有 SW 一样。
- **必须在事件回调里同步决定要不要调 `respondWith`**：不能先 `await` 一个异步结果、再根据结果决定调不调——要接管就同步调用 `respondWith(一个 promise)`，把异步放进那个 promise 里。

这就是 SW 的全部魔力来源：**你在 `respondWith` 里想返回什么，页面就拿到什么**——可以是缓存副本、可以是网络响应、可以是一个当场 `new Response("...")` 合成的页面。

## 二、请求过滤：不是所有请求都该拦

盲目接管所有请求是新手最常见的翻车点。`event.request` 上有足够信息做精细过滤：

| 属性 | 用途 |
| --- | --- |
| `request.url` | 按路径/域名过滤（如只缓存自己源的静态资源） |
| `request.method` | **通常只接管 `GET`**——Cache API 只支持 GET，`POST`/`PUT` 该直接放行网络 |
| `request.mode` | `navigate`（页面导航）/ `cors` / `no-cors` / `same-origin`——导航请求常单独处理 |
| `request.destination` | `document` / `script` / `style` / `image` / `font` / `video`……按资源类型分流 |

```js
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // 1. 非 GET 一律放行（登录、下单等写请求不该被缓存拦截）
  if (request.method !== "GET") return;

  // 2. 跨源第三方（分析打点、第三方 CDN 脚本）放行，别乱接管
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 3. 页面导航请求：走"网络优先 + 离线兜底"（见第三节）
  if (request.mode === "navigate") {
    event.respondWith(handleNavigate(request));
    return;
  }

  // 4. 同源静态资源：挑一个缓存策略（策略写法见浏览器章）
  event.respondWith(handleAsset(request));
});
```

**缓存策略本身（cache-first / network-first / stale-while-revalidate 怎么写、`caches.match`/`put`/`clone()` 怎么用、opaque 响应与版本化清理怎么处理）不在本页——全部在[浏览器章：SW 缓存与 Cache API](/zh/base/browser/browser-cache/guide-line/sw-cache-api)**。本页 `handleAsset`/`handleNavigate` 的内部实现，就是去那一章挑对应策略填进来。

## 三、离线兜底页：最小可用的离线体验

即便不做完整离线缓存，**给导航请求配一个离线兜底页**也是性价比最高的一步：网络可用时正常走网络，一旦断网，`fetch` 抛错，就返回一个预缓存的静态 `/offline.html`，避免浏览器默认的"无网络恐龙页"。

```js
// sw.js
const OFFLINE_URL = "/offline.html";

// install 时把离线页预缓存进来（App Shell 的一部分）
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("offline-v1").then((cache) => cache.add(OFFLINE_URL)),
  );
});

// 导航请求：网络优先，失败则回退离线页
async function handleNavigate(request) {
  try {
    // 有网就用网络的真实页面（可顺手更新缓存，写法见浏览器章）
    return await fetch(request);
  } catch {
    // 断网/超时 → fetch 抛错 → 返回预缓存的离线兜底页
    const cache = await caches.open("offline-v1");
    return (await cache.match(OFFLINE_URL)) ?? new Response("离线", { status: 503 });
  }
}
```

两个要点：

- **离线页是预缓存的静态 HTML**——SW 里没有 `window`/DOM，兜底页不能靠运行时渲染，必须是 install 时就存好的完整 HTML。
- **判定离线靠 `fetch` 抛错，不靠 `navigator.onLine`**：`onLine` 只反映"有没有连上网络接口"，连着 WiFi 但上不了外网时它仍是 `true`——真正可靠的信号是 `fetch()` 的 `catch`。

## 四、navigation preload：消除 SW 冷启动延迟

SW 是事件驱动、空闲即被终止的。这带来一个性能问题：**用户点链接导航时，如果 SW 当前是停止的，浏览器得先启动 SW、再让它在 `fetch` 事件里发起网络请求**——这段"SW 冷启动"串在了导航关键路径上，拖慢首字节。

**Navigation Preload** 就是为此设计的：让浏览器在**启动 SW 的同时，并行发起导航请求**，两件事同时进行，SW 起来后直接用已经在飞的那个响应。

```js
// sw.js —— 三步用起来

// 1) activate 时开启 navigation preload
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if (self.registration.navigationPreload) {
        // 特性探测：并非所有浏览器都支持
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })(),
  );
});

// 2) fetch 里用 event.preloadResponse 取那个"并行发起"的响应
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    (async () => {
      // 优先用预加载响应（浏览器已并行发起，无需等 SW 现发）
      const preloaded = await event.preloadResponse;
      if (preloaded) return preloaded;
      // 没有预加载（不支持/未命中）→ 正常走网络
      try {
        return await fetch(event.request);
      } catch {
        const cache = await caches.open("offline-v1");
        return (await cache.match("/offline.html")) ?? Response.error();
      }
    })(),
  );
});
```

要点：

- **`event.preloadResponse`** 是一个 promise：支持且开启时 resolve 成预加载的 `Response`，否则 resolve 成 `undefined`——所以要判空后回退普通 `fetch`。
- 开启后浏览器会给预加载请求带一个 `Service-Worker-Navigation-Preload` 头，服务端可据此返回精简内容。
- 这是**导航请求专属**的优化，对子资源请求无效。

### 4.1 更进一步：静态路由 addRoutes（较新、需探测）

比 navigation preload 更彻底的是 `InstallEvent.addRoutes()`：在 install 阶段就声明"某些 URL 模式**根本不用叫醒 SW**，直接走网络或直接走缓存"，把这类请求从 SW 的处理路径上彻底摘掉，省掉 SW 参与的全部开销。它较新、浏览器支持有限，用前务必特性探测：

```js
self.addEventListener("install", (event) => {
  if (event.addRoutes) {
    // 例：所有 /assets/ 下的带哈希静态资源，命中缓存就别惊动 SW
    event.addRoutes({
      condition: { urlPattern: "/assets/*" },
      source: "cache",
    });
  }
});
```

## 五、坑位清单

- **接管了 `POST` 请求**：Cache API 只支持 GET，误缓存写请求会出错——过滤 `method !== "GET"` 先放行。
- **`respondWith` 里 promise reject 没兜底**：页面直接拿到网络错误——所有分支都要 `catch`，导航请求兜底离线页。
- **异步决定要不要 `respondWith`**：`respondWith` 必须在事件回调里同步调用（参数可以是 promise）——不能先 await 再决定调不调。
- **盲目接管跨源/第三方请求**：打点、第三方脚本被拦易出问题——用 `url.origin` 白名单过滤。
- **拦了视频 Range 请求**：媒体的 `Range` 请求缓存处理复杂，简单缓存会坏播放——识别 `Range` 头单独放行。
- **靠 `navigator.onLine` 判离线**：不可靠——离线兜底靠 `fetch` 的 `catch`。
- **忘了 navigation preload 的特性探测**：`self.registration.navigationPreload` 可能是 `undefined`——判空再 `enable()`。
- **缓存策略写在本页找不到**：策略与 Cache API 全在[浏览器章](/zh/base/browser/browser-cache/guide-line/sw-cache-api)——本页只负责"在哪拦、怎么兜底"。

下一页离开"离线"，进入 SW 脱离页面的后台能力——**推送通知与后台同步**：[推送与后台同步](./push-notification-sync)。
