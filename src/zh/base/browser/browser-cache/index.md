---
layout: doc
---

# 浏览器缓存机制

`Cache-Control`、`ETag`、304 这些**首部语义**属于 HTTP 标准，[网络章](/zh/base/network/net-http-basics/guide-line/connection-range-caching)已经讲透；但拿到这些头之后**怎么决策**，是浏览器自己的事：一次请求会依次面对 Service Worker、内存缓存（memory cache）、磁盘缓存（disk cache）好几层，前进/后退还有一层与 HTTP 缓存完全不同维度的整页快照 bfcache。这一叶讲的就是**浏览器侧的多层缓存实现与命中决策**：每层归谁管、活多久、DevTools 里怎么判读 `(memory cache)` / `(disk cache)` / `(ServiceWorker)`、四种刷新方式各自穿透到哪一层、`Cache-Control: no-store` 会波及哪些层，以及部署新版后用户拿着旧缓存时该怎么排查、怎么清。

## 概述

- **多层命中**：一次请求依次经过 **Service Worker（Cache API）→ memory cache → disk cache → 网络**；经典「四级缓存」里的 **push cache 已死**（Chrome 106 / Firefox 132 先后默认禁用 HTTP/2 Push）。
- **「200 但没发请求」**：强缓存命中时 Network 面板显示灰色 200，Size 栏标注 `(memory cache)` / `(disk cache)`——根本没出网络；**304 才是真发了请求**（协商缓存，只回头不回体）。
- **bfcache 是另一个维度**：不缓存响应，而是把**整页（DOM + JS 堆）冻结成内存快照**，前进/后退瞬时恢复；`unload` 监听、打开的 IndexedDB 连接等会把页面挡在门外。
- **Cache API 不遵守 HTTP 缓存头**：Service Worker 的 CacheStorage 由开发者全权做主——不自动过期、不自动更新，忘了版本化清理就是「用户永远拿旧版」事故。
- **观测与清除**：DevTools Network Size 栏 + Application 面板是观测主入口；服务端可用 `Clear-Site-Data` 响应头远程清客户端数据（各指令兼容差异大，`"cache"` 指令尤其坑）。

## 本叶地图

- [入门](./getting-started) —— 一次请求经过哪些缓存层、「200 但没发请求」现象解剖、与网络章的分工
- [多层缓存总览](./guide-line/cache-layers) —— 命中优先级、每层归属与生命周期、push cache 已死史
- [内存缓存与磁盘缓存](./guide-line/memory-disk-cache) —— memory vs disk 的行为差异、浏览器如何决策、DevTools 判读
- [HTTP 缓存的浏览器侧落地](./guide-line/http-cache-landing) —— fresh/stale 之后怎么走、四种刷新行为差异、no-store 的波及面
- [往返缓存 bfcache](./guide-line/bfcache) —— 整页快照、pageshow/persisted、不可进入条件清单、NotRestoredReasons 诊断
- [Service Worker 缓存与 Cache API](./guide-line/sw-cache-api) —— CacheStorage 模型、与 HTTP 缓存的根本区别、三种策略代码
- [观测与清除](./guide-line/cache-observe-clear) —— Size 栏全标签判读、Clear-Site-Data、清除数据影响矩阵、排查手册
- [参考](./reference) —— 多层对照 / 刷新矩阵 / bfcache 阻断 / SW 策略选型 / Size 栏判读速查表

## 文档地址

- [web.dev: Back/forward cache](https://web.dev/articles/bfcache) · [web.dev: Prevent unnecessary network requests with the HTTP Cache](https://web.dev/articles/http-cache)
- [MDN: Cache](https://developer.mozilla.org/en-US/docs/Web/API/Cache) · [MDN: CacheStorage](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage)
- [MDN: Clear-Site-Data](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Clear-Site-Data)
- [Chrome: Removing HTTP/2 Server Push](https://developer.chrome.com/blog/removing-push)

## 幻灯片地址

<a href="/SlideStack/browser-cache-slide/" target="_blank">浏览器缓存机制</a>
