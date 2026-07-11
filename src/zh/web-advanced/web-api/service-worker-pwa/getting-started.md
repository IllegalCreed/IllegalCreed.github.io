---
layout: doc
outline: [2, 3]
---

# 入门：可编程网络代理与 PWA 全景

> 基于 W3C Service Workers 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **一句话定位**：Service Worker 是浏览器为一个源注册的**可编程网络代理**——独立线程、无 DOM、事件驱动、可在页面关闭后被唤醒；以 `fetch` 事件拦截作用域内所有请求，用 `respondWith` 决定回什么。
- **入口对象**：页面侧 `navigator.serviceWorker`（`ServiceWorkerContainer`），worker 侧 `self`（`ServiceWorkerGlobalScope`）；注册返回 `ServiceWorkerRegistration`。
- **注册**：`navigator.serviceWorker.register("/sw.js", { scope: "/" })`，返回 Promise；文档要**重新加载后**才被新注册的 SW 控制（`register` 不会立刻接管已打开的页面）。
- **作用域 `scope`**：默认 = SW 脚本所在目录；**不能宽于脚本路径**，除非响应带 `Service-Worker-Allowed` 头放宽。把 `sw.js` 放根目录才能控制整站。
- **一个 scope 只允许一个 SW**：同一作用域重复 `register` 是幂等更新，不会并存两个。
- **强制安全上下文**：SW 只在 **HTTPS** 下可用，`http://localhost`（及 `127.0.0.1`）例外用于本地开发；Firefox 可在 DevTools 打开时勾选"允许 HTTP 上的 Service Worker"临时测试。
- **无 DOM、全异步**：SW 跑在独立线程，**不能碰 `window`/`document`/同步 `localStorage`**；不能用同步 XHR，`import()` 动态导入被禁（静态 `import` 可）。
- **生命周期骨架**：`download → install → （waiting）→ activate → redundant`；`install` 里 `event.waitUntil()` 预缓存，`activate` 里收尸旧缓存，细节见[生命周期](./guide-line/lifecycle)。
- **默认不接管现有页**：新 SW 激活后要到**下次导航**才控制页面；`clients.claim()` 可立即接管，`skipWaiting()` 可跳过等待。
- **`fetch` 拦截是核心能力**：注册了 `fetch` 监听 + `event.respondWith()` 后，SW 就成了页面与网络间的中间层——离线、改写、mock 都从这长出，见 [fetch 与离线](./guide-line/fetch-offline)。
- **与浏览器章的分工（重要）**：**缓存策略（cache-first/network-first/SWR）与 Cache API（`caches`/`Cache`）的用法在[浏览器章](/zh/base/browser/browser-cache/guide-line/sw-cache-api)**；本叶只讲 SW 的**机制**（生命周期/fetch 拦截/离线/推送/同步/安装），在拦截处链接过去、不重复缓存用法。
- **PWA 三件套**：可安装 + 离线 + 可推送的 PWA = **Service Worker**（离线与后台）+ **Web App Manifest**（安装身份与外观）+ **HTTPS**（前提）。
- **Push/Sync/安装能力碎片化**：Push 需 Notification 权限且 iOS 要先安装为 PWA；Background Sync 仅 Chromium；`beforeinstallprompt` 仅 Chromium——都要能力探测降级，见[推送与同步](./guide-line/push-notification-sync)、[Manifest 与安装](./guide-line/manifest-install)。
- **SW 核心已全浏览器 Baseline**：注册、生命周期、`fetch`、Cache API 在 Chrome/Edge/Firefox/Safari 全部可用，离线是可依赖的地基。
- **别在 SW 里存关键状态**：SW 随时可能被浏览器终止再唤醒（事件驱动、无常驻内存），要持久化用 Cache API 或 IndexedDB（见 [IndexedDB 叶](/zh/web-advanced/web-api/indexeddb/)）。
- **调试三开关**：DevTools → Application → Service workers 的 **Update on reload**（每次刷新装新 SW）、**Bypass for network**（旁路 SW 直连网络）、**Unregister**——"改了没生效"多半是旧 SW 还在控制页面。
- **生产别裸写**：SW 的缓存与路由样板极多，实践配 [Workbox](https://developer.chrome.com/docs/workbox)（预缓存清单 + 策略 + 版本化收尸开箱即用）。
- **进阶顺序**：本页 → [生命周期](./guide-line/lifecycle) → [fetch 与离线](./guide-line/fetch-offline) → [推送与后台同步](./guide-line/push-notification-sync) → [Manifest 与安装](./guide-line/manifest-install) → [参考](./reference)。

## 一、Service Worker 是什么：可编程的网络代理

MDN 的定义一句话到位：**"Service Worker 本质上是坐在 Web 应用、浏览器与网络（如果有网）之间的代理服务器。"** 它是一段注册在某个源上的 JavaScript，一旦激活，就能拦截并改写本作用域内的导航请求与资源请求——决定这个请求是走网络、走缓存，还是就地合成一个响应返回。

它与普通页面脚本、与 [Web Worker](/zh/web-advanced/web-api/web-workers/) 的关键区别：

| 特征 | 说明 |
| --- | --- |
| **独立线程、无 DOM** | 跑在与页面分离的 worker 线程，**碰不到 `window`/`document`**，不阻塞 UI |
| **事件驱动、可被唤醒** | 空闲时会被浏览器终止；`fetch`/`push`/`sync` 等事件到来时**重新启动**——不是常驻进程 |
| **脱离页面存活** | 一个 SW 可同时控制多个标签页；页面全关后仍可被 `push`/`sync` 唤醒执行后台任务 |
| **强异步** | 全 Promise 化，禁用同步 XHR 与同步存储；`import()` 动态导入被禁，静态 `import` 允许 |
| **拦截网络** | 独有 `fetch` 事件 + `respondWith`，这是它区别于 Web Worker 的核心超能力 |

正因为"能被唤醒 + 能拦网络 + 脱离页面存活"，SW 才能承载离线、推送、后台同步这些页面脚本做不到的能力。

## 二、注册与作用域 scope

注册是把 SW 脚本"挂到"某个源上的动作，入口是页面侧的 `navigator.serviceWorker.register()`：

```js
// 在页面脚本里注册（不是在 sw.js 里）
if ("serviceWorker" in navigator) {
  // 特性探测：老浏览器优雅降级
  window.addEventListener("load", () => {
    // 常放在 load 后，避免和首屏关键资源抢带宽
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" }) // scope 决定它能控制哪些页面
      .then((reg) => {
        console.log("SW 注册成功，作用域：", reg.scope);
      })
      .catch((err) => {
        // 非 HTTPS、路径错误、跨源、scope 越权都会走这里
        console.error("SW 注册失败：", err);
      });
  });
}
```

关于 `scope` 必须建立的三条事实：

- **默认作用域 = SW 脚本所在目录**。`/sw.js` 默认 scope 为 `/`（控制整站）；`/js/sw.js` 默认只能控制 `/js/` 下的页面。**想控制整站，就把 SW 脚本放在根目录**。
- **scope 不能宽于脚本路径**。想让 `/js/sw.js` 控制 `/`，服务端返回该脚本时必须带响应头 `Service-Worker-Allowed: /`，否则注册抛错。
- **一个 scope 只能有一个 SW**。对同一作用域重复 `register()` 是**幂等更新**（触发更新检查），不会并存两个 SW。

注册成功不代表立刻生效：**`register()` 不会控制当前已打开的页面**，文档要在 SW 激活后**重新加载**才被接管（或用 `clients.claim()` 立即接管，见[生命周期](./guide-line/lifecycle)）。

### 2.1 常见注册失败原因

- **非安全上下文**：页面不是 HTTPS 且不是 `localhost`。
- **脚本路径/源不对**：SW 脚本必须与页面**同源**，路径要能被正确请求到。
- **scope 越权**：请求的 scope 宽于脚本路径且没有 `Service-Worker-Allowed` 头。
- **浏览器设置**：用户禁用了 Cookie/存储、隐私窗口等。

## 三、HTTPS 与安全上下文要求

SW 能拦截并改写页面的所有网络请求——这是把双刃剑：落到中间人手里就是"给整个源持久投毒"。因此规范强制 **SW 只能在安全上下文中注册和运行**：

- **必须 HTTPS**。生产环境无 HTTPS 则 `navigator.serviceWorker` 存在但 `register()` 会失败。
- **`localhost` / `127.0.0.1` 例外**：被视为安全上下文，本地开发不用配证书。
- **Firefox 测试豁免**：DevTools 打开时可勾选 `about:config` 的相关选项在 HTTP 上测试（仅调试用）。

这条约束是 PWA 的硬门槛之一：**一个可安装的 PWA 必须整站 HTTPS**（安装条件详见 [Manifest 与安装](./guide-line/manifest-install)）。

## 四、与浏览器章缓存的分工（读前必看）

本站关于"Service Worker 缓存"的内容**分两处**，各管一段，别找错地方：

| 你想知道 | 去哪读 |
| --- | --- |
| **缓存策略**（cache-first / network-first / stale-while-revalidate）怎么选、怎么写 | [浏览器章：SW 缓存与 Cache API](/zh/base/browser/browser-cache/guide-line/sw-cache-api) |
| **Cache API**（`caches.open`/`match`/`put`/`addAll`、opaque 响应、`clone()`、版本化清理）用法 | [浏览器章：SW 缓存与 Cache API](/zh/base/browser/browser-cache/guide-line/sw-cache-api) |
| 缓存**算多大配额、何时被浏览器清** | [浏览器章：配额与驱逐](/zh/base/browser/browser-storage/guide-line/quota-eviction) |
| **SW 生命周期**（install/waiting/activate/更新模型） | **本叶：[生命周期](./guide-line/lifecycle)** |
| **fetch 拦截机制**（`respondWith`/navigation preload/离线兜底） | **本叶：[fetch 与离线](./guide-line/fetch-offline)** |
| **推送、后台同步、PWA 安装与 manifest** | **本叶：后续各页** |

一句话记住：**"用什么缓存策略"在浏览器章，"SW 这套机器怎么转"在本叶**。本叶后面讲到 fetch 拦截时只会点一句"这里挑个策略"，然后链接过去，不重复写 cache-first 那三段代码。

## 五、PWA 全景：三件套怎么拼

PWA（Progressive Web App，渐进式 Web 应用）不是某一个 API，而是**一组能力的组合**，让 Web 站点获得"可安装、能离线、能收推送"的类原生体验。拆开就是三件套：

| 组件 | 提供什么 | 本叶去处 |
| --- | --- | --- |
| **Service Worker** | 离线缓存、请求拦截、后台推送/同步 | [生命周期](./guide-line/lifecycle)、[fetch 与离线](./guide-line/fetch-offline)、[推送与同步](./guide-line/push-notification-sync) |
| **Web App Manifest** | 应用身份（名称/图标）、安装、独立窗口外观 | [Manifest 与安装](./guide-line/manifest-install) |
| **HTTPS** | 安全上下文前提（SW 与安装都要求） | 本页第三节 |

三者互相独立又缺一不可：

- **只有 SW、没有 manifest**：能离线，但不能"安装到主屏"，只是个更快的网站。
- **只有 manifest、没有 SW**：Chromium 现在也能弹安装（见[安装条件](./guide-line/manifest-install)），但装完断网就白屏——没有离线能力的 PWA 体验残缺。
- **SW 安装 ≠ PWA 安装**：SW 的"install 事件"是脚本装到浏览器（无需用户许可、静默发生），PWA 的"安装"是用户把应用装到设备主屏——**两件完全不同的事，别混**（web.dev 原文：SW 安装与 PWA 安装"相关但独立"）。

下一页从最容易踩坑的地方开始——**SW 的生命周期与更新模型**：为什么你改了 `sw.js`、刷新了页面，用户拿到的还是旧版。
