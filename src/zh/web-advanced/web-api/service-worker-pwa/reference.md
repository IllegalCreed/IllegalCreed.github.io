---
layout: doc
outline: [2, 3]
---

# 参考：状态机 / 事件 / 能力矩阵 / 易错点

> 基于 W3C Service Workers 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **接口全景**：`ServiceWorkerContainer`（`navigator.serviceWorker`）/ `ServiceWorkerRegistration`（`installing`/`waiting`/`active`/`update`/`pushManager`/`sync`/`periodicSync`/`navigationPreload`）/ `ServiceWorker`（`state`/`scriptURL`/`postMessage`）/ `ServiceWorkerGlobalScope`（`self`）/ `Clients`（`claim`/`matchAll`/`openWindow`）。
- **注册**：`navigator.serviceWorker.register(url, { scope })`；scope 默认=脚本目录、不能宽于路径（除非 `Service-Worker-Allowed` 头）；仅 HTTPS/localhost。
- **状态机**：`installing → installed(waiting) → activating → activated → redundant`；`install` 预缓存、`activate` 收尸、waiting 默认等所有旧标签关闭。
- **提前接管**：`self.skipWaiting()`（install 里跳过 waiting）+ `self.clients.claim()`（activate 里接管现页）；`controllerchange` 后常 `reload`。
- **更新**：逐字节比对 `sw.js`（含 `importScripts`）→ 有变即更新；导航时检查 + 至少每 24h 检查；`registration.update()` 手动催；`sw.js` 别设长 HTTP 缓存。
- **fetch 拦截**：`fetch` 事件 + `event.respondWith(Response|Promise)`；不调用即放行；`event.request` 读 `method`/`mode`/`destination` 过滤。
- **缓存策略/Cache API 在浏览器章**：cache-first/network-first/SWR、`caches`/`Cache`/`clone()`/opaque/版本化清理 → [浏览器章](/zh/base/browser/browser-cache/guide-line/sw-cache-api)（本叶只在拦截处链接）。
- **navigation preload**：`registration.navigationPreload.enable()` + `event.preloadResponse`，消除 SW 冷启动延迟（导航请求专属）。
- **Push**：`registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` → `PushSubscription`（`endpoint`+`keys`）→ SW `push` 事件 → `registration.showNotification()`；Baseline 含 Safari 16.4+，**iOS 需装 PWA**。
- **Background Sync**：`registration.sync.register(tag)` → SW `sync` 事件 → `event.waitUntil` 补发；`event.lastChance`；**仅 Chromium**。
- **Periodic Sync**：`registration.periodicSync.register(tag, { minInterval })` → SW `periodicsync` 事件；**仅 Chromium + 仅已装 PWA + 参与度门槛**。
- **Manifest**：`<link rel="manifest">`，`application/manifest+json`；关键字段 `name`/`short_name`/`icons`(192+512)/`start_url`/`display`/`theme_color`/`scope`。
- **display**：`standalone`/`fullscreen`/`minimal-ui`/`browser`；`display_override` 有序回退链。
- **安装条件（Chromium）**：HTTPS + 合规 manifest（name、192+512 图标、start_url、display 非 browser、prefer_related_applications 非 true）；SW 曾必需、现已放宽（但离线仍需 SW）。
- **beforeinstallprompt**：**Chromium 私有**；`preventDefault()`+存事件 → `prompt()` → `userChoice`（`accepted`/`dismissed`）；`appinstalled` 收尾；iOS 无此事件、走"添加到主屏幕"。
- **通用心法**：后台能力都要 `event.waitUntil`；周边能力都要特性探测降级；SW 会被终止再唤醒，状态放 Cache/IndexedDB。

## 一、接口全景

| 接口 | 职责 |
| --- | --- |
| `ServiceWorkerContainer` | 页面侧入口 `navigator.serviceWorker`；`register`/`getRegistration`/`ready`/`controller`；`controllerchange`/`message` 事件 |
| `ServiceWorkerRegistration` | 一次注册；`installing`/`waiting`/`active` 三槽位 + `scope`/`update()`/`unregister()`/`pushManager`/`sync`/`periodicSync`/`navigationPreload`；`updatefound` 事件 |
| `ServiceWorker` | 一个 SW 实例；`state`/`scriptURL`/`postMessage()`；`statechange` 事件 |
| `ServiceWorkerGlobalScope` | SW 全局作用域 `self`；`skipWaiting()`/`registration`/`clients`/`caches`；`install`/`activate`/`fetch`/`push`/`sync`/`periodicsync`/`message`/`notificationclick` 事件 |
| `Clients` / `Client` / `WindowClient` | 受控页面集合；`claim()`/`matchAll()`/`openWindow()`/`get()`；`WindowClient` 有 `focus()`/`navigate()` |
| `ExtendableEvent` | `install`/`activate` 等的基类；`waitUntil(promise)` 延长生命周期 |
| `FetchEvent` | `fetch` 事件；`request`/`respondWith()`/`preloadResponse` |
| `PushManager` / `PushSubscription` / `PushMessageData` | 推送订阅 / 订阅对象（`endpoint`+`keys`）/ 载荷读取 |
| `SyncManager` / `PeriodicSyncManager` | 一次性 / 周期性后台同步登记器 |
| `NavigationPreloadManager` | 导航预加载开关；`enable()`/`disable()`/`setHeaderValue()` |

## 二、生命周期状态机

| 状态（`ServiceWorker.state`） | 含义 | 对应槽位 |
| --- | --- | --- |
| `installing` | 正在安装（`install` 事件进行中/`waitUntil` 未决） | `registration.installing` |
| `installed` | 安装完成，等待激活（即 **waiting**） | `registration.waiting` |
| `activating` | 正在激活（`activate` 事件进行中） | — |
| `activated` | 已激活，处理 `fetch`/`push`/`sync` | `registration.active` |
| `redundant` | 被替换或安装/激活失败，作废 | — |

**接管控制的四个动作**：

| API | 时机 | 作用 |
| --- | --- | --- |
| `event.waitUntil(promise)` | `install`/`activate`/功能事件 | 延长事件寿命，promise 完成前不进入下一状态/不被终止 |
| `self.skipWaiting()` | 通常在 `install` | 跳过 waiting，装完立即激活 |
| `self.clients.claim()` | 通常在 `activate` | 立即接管当前已打开的受控页面 |
| `registration.update()` | 页面侧任意时刻 | 手动触发一次更新检查 |

## 三、SW 事件表

| 事件 | 触发于 | 典型用途 |
| --- | --- | --- |
| `install` | SW 首装/更新 | `waitUntil` 预缓存 App Shell |
| `activate` | 新 SW 接管时 | 收尸旧缓存、`clients.claim()`、开 navigation preload |
| `fetch` | 作用域内每个网络请求 | `respondWith` 决定回缓存/网络/合成响应 |
| `push` | 服务器推送到达 | `showNotification()` 弹通知 |
| `notificationclick` | 用户点击通知 | 聚焦/打开窗口 |
| `sync` | 恢复网络（一次性同步） | 补发离线期间的请求 |
| `periodicsync` | 浏览器裁量的周期点 | 定期预取内容 |
| `message` | 页面 `postMessage` | 页面↔SW 通信（如通知 `skipWaiting`） |
| `pushsubscriptionchange` | 推送订阅失效/过期 | 重新订阅并更新服务器 |
| `updatefound`（在 registration 上） | 发现新版本开始安装 | 自建"有新版本"提示 |
| `controllerchange`（在 container 上） | 控制本页的 SW 变更 | 切新版后 `reload` |

## 四、Push / Sync / Manifest 速查

### 4.1 Push API

| API | 说明 |
| --- | --- |
| `registration.pushManager.subscribe(opts)` | 订阅；`opts.userVisibleOnly`（Chrome 必 true）、`opts.applicationServerKey`（VAPID 公钥） |
| `pushManager.getSubscription()` | 取现有订阅（不新建） |
| `PushSubscription` | `endpoint`（保密）、`keys.p256dh`/`keys.auth`（加密）、`toJSON()`、`unsubscribe()` |
| `push` 事件 | `event.data`（`PushMessageData`：`.json()`/`.text()`/`.arrayBuffer()`）、`event.waitUntil()` |
| `registration.showNotification(title, opts)` | SW 里弹通知（**无 `new Notification()`**）；`opts` 含 `body`/`icon`/`badge`/`data`/`actions` |
| `Notification.requestPermission()` | 页面侧请求权限，需用户手势 |

### 4.2 Background Sync / Periodic Sync

| API | 说明 |
| --- | --- |
| `registration.sync.register(tag)` | 登记一次性同步；`getTags()` 查已登记 |
| `sync` 事件 | `event.tag`、`event.lastChance`、`event.waitUntil()` |
| `registration.periodicSync.register(tag, { minInterval })` | 登记周期同步（minInterval 为下限） |
| `periodicSync.getTags()` / `unregister(tag)` | 查 / 取消 |
| `periodicsync` 事件 | `event.tag`、`event.waitUntil()` |

### 4.3 Manifest 关键字段

| 字段 | 安装相关 | 说明 |
| --- | --- | --- |
| `name` / `short_name` | ✅（至少一个） | 应用名 / 主屏短名 |
| `icons` | ✅（需 192+512） | `{ src, sizes, type, purpose }`；`purpose: maskable` 自适应 |
| `start_url` | ✅ | 启动地址 |
| `display` | ✅（非 browser） | `standalone`/`fullscreen`/`minimal-ui`/`browser` |
| `display_override` | — | 有序回退链，优先于 display |
| `theme_color` / `background_color` | — | 主题色 / 启动屏背景 |
| `scope` | — | 导航范围 |
| `id` | — | 稳定唯一标识（防重复安装） |
| `shortcuts` / `screenshots` / `categories` / `description` | — | 快捷入口 / 富安装弹窗截图 / 分类 / 描述 |
| `prefer_related_applications` | ✅（须非 true） | true 表示更推荐原生应用，不弹 Web 安装 |

## 五、浏览器支持矩阵

| 能力 | Chrome/Edge | Firefox | Safari | 备注 |
| --- | --- | --- | --- | --- |
| Service Worker 核心（注册/生命周期/`fetch`/Cache API） | ✅ | ✅ | ✅ | **全浏览器 Baseline** |
| Navigation Preload | ✅ | ✅ | ✅ | 较新 Safari 已支持 |
| Push API | ✅ | ✅ | ✅（16.4+） | **Baseline 2023-03**；**iOS 需先装 PWA** |
| Notification（SW 内 `showNotification`） | ✅ | ✅ | ✅ | 需用户授权 |
| Background Sync（`sync`） | ✅ | ❌ | ❌ | **仅 Chromium** |
| Periodic Background Sync（`periodicsync`） | ✅ | ❌ | ❌ | **仅 Chromium + 仅已装 PWA + 参与度门槛** |
| `beforeinstallprompt` | ✅ | ❌ | ❌ | **Chromium 私有事件** |
| PWA 安装 | ✅（自动提示） | 部分 | ✅（"添加到主屏幕"） | iOS 16.4+ 各浏览器可从分享菜单装 |
| `InstallEvent.addRoutes()`（静态路由） | 部分（较新） | ❌ | ❌ | 需特性探测 |

> 支持面随版本演进，生产落地前以 [caniuse](https://caniuse.com/) / MDN 的 Baseline 标注为准，周边能力一律特性探测 + 降级。

## 六、安装条件清单（Chromium）

- [ ] 整站 **HTTPS**（或本地 `localhost`/`127.0.0.1`）
- [ ] 页面 `<head>` 有 `<link rel="manifest">` 且能正确加载（MIME `application/manifest+json`）
- [ ] manifest 有 `name` **或** `short_name`
- [ ] `icons` 至少含 **192×192** 与 **512×512** 各一
- [ ] 有 `start_url`
- [ ] `display` 为 `standalone` / `fullscreen` / `minimal-ui`（非 `browser`）
- [ ] `prefer_related_applications` 为 `false` 或不写
- [ ] （强烈建议但非硬性）注册了 SW——**离线体验的前提**，且 SW/`fetch` 处理器在旧 Chromium 曾是安装硬门槛
- [ ] iOS：另配 `apple-touch-icon` + `apple-mobile-web-app-*` meta，引导用户"添加到主屏幕"

## 七、易错点清单

- **改了 `sw.js` 刷新没生效**：新 SW 在 waiting，普通刷新不换版——关所有标签重开 / `skipWaiting` / DevTools「Update on reload」。
- **`skipWaiting` 但页面还是旧的**：`skipWaiting` 只激活新 SW，接管现页要 `clients.claim()`——两者常配对。
- **首访不走缓存**：默认 SW 不控制注册它的当前页——`clients.claim()` 让首访即生效。
- **`sw.js` 被长 HTTP 缓存**：更新延迟——给 SW 脚本设 `Cache-Control: max-age=0`。
- **只改资源没改 `sw.js`**：字节没变不更新——版本号/清单写进 `sw.js`。
- **在 SW 顶层存运行状态**：SW 被终止再唤醒会丢——状态放 Cache/IndexedDB。
- **`fetch` 里接管了 `POST`**：Cache API 只支持 GET——写请求先放行。
- **`respondWith` 分支 reject 没兜底**：页面拿到网络错误——每条路径都 `catch`，导航兜底离线页。
- **靠 `navigator.onLine` 判离线**：不可靠——离线兜底靠 `fetch` 的 `catch`。
- **推送用 `new Notification()`**：SW 里没有——用 `registration.showNotification()`。
- **没要 Notification 权限就订阅推送**：`userVisibleOnly` 推送发不出——先 `requestPermission()`（用户手势）。
- **iOS 上直接订阅推送**：普通 Safari 标签页不行——必须先"添加到主屏幕"装成 PWA。
- **在 Firefox/Safari 上等 `beforeinstallprompt`**：永远等不到——能力探测，iOS 走"添加到主屏幕"引导。
- **`prompt()` 调多次**：一个事件只一次——用完置空、隐藏按钮。
- **以为"能装"=「能离线」**：安装门槛放宽后没 SW 也能装，但断网白屏——离线另配 SW。
- **图标缺 192/512 或 `display: browser`**：不判定为可安装——补齐尺寸、改 `standalone`。
- **`sync`/`periodicsync` 当准时定时器**：触发时机由浏览器裁量——设计成"尽力而为"。
- **周边能力不做特性探测**：Background Sync/Periodic Sync/`beforeinstallprompt` 大面积缺失——先探测再用，全程降级。

## 八、权威链接

- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) —— 接口总览与能力入口
- [MDN: Using Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers) —— 官方完整教程（生命周期/更新/navigation preload 代码）
- [MDN: Web app manifest](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest) —— manifest 全字段参考
- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) —— 安装条件与 `beforeinstallprompt`
- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) ｜ [PushManager.subscribe](https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe) —— 推送订阅与 VAPID
- [MDN: Background Synchronization API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API) ｜ [Web Periodic Background Synchronization API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Periodic_Background_Synchronization_API) —— 两种后台同步
- [MDN: BeforeInstallPromptEvent](https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent) —— 自定义安装事件
- [web.dev: Learn PWA · Service workers](https://web.dev/learn/pwa/service-workers/) —— PWA 视角的 SW 教程
- [Service Workers 规范（W3C）](https://w3c.github.io/ServiceWorker/) ｜ [w3c/ServiceWorker](https://github.com/w3c/ServiceWorker) —— 规范原文与 issue
- [Workbox](https://developer.chrome.com/docs/workbox) —— 生产级 SW 缓存/路由/预缓存工具库
- 本站相邻内容：[浏览器章 · SW 缓存与 Cache API](/zh/base/browser/browser-cache/guide-line/sw-cache-api)（缓存策略/Cache API 用法）｜ [配额与驱逐](/zh/base/browser/browser-storage/guide-line/quota-eviction) ｜ [IndexedDB 叶](/zh/web-advanced/web-api/indexeddb/)（SW 数据层）
