---
layout: doc
---

# Service Worker 与 PWA

Service Worker 是浏览器为每个源注册的一段**可编程网络代理**——一个跑在独立线程、无 DOM、事件驱动、可在页面关闭后被唤醒的 worker，它以 `fetch` 事件拦截本作用域内的所有网络请求，用 `respondWith` 决定"走网络还是走缓存"，从而把离线、后台推送、后台同步这些"页面之外的能力"带进 Web。它同时是 **PWA（渐进式 Web 应用）** 的技术底座：一个可安装、能离线、能收推送的 PWA = Service Worker（离线与后台）+ Web App Manifest（安装身份与外观）+ HTTPS（安全上下文前提）。规范上 Service Worker **现已是全浏览器 Baseline**（Chrome/Edge/Firefox/Safari 均落地），但其周边能力（Push、Background Sync、beforeinstallprompt）跨浏览器差异极大。本叶专注 **SW 的生命周期与更新模型、fetch 拦截机制、离线、Push、Background Sync、PWA 安装与 manifest**；**缓存策略（cache-first/network-first/SWR）与 Cache API 的用法已在[浏览器章](/zh/base/browser/browser-cache/guide-line/sw-cache-api)讲透，本叶只在 fetch 拦截处点到并链接，不重复展开**。

## 评价

**优点**

- **Web 平台唯一的"网络代理"标准**：以 `fetch` 事件充当页面与网络之间的可编程中间层，离线优先、请求改写、API mock、预取都从这里长出来，是 PWA 与现代 Web 应用离线能力的事实底座
- **在页面之外存活**：SW 独立于任何标签页运行，能在页面关闭后被 `push`/`sync`/`periodicsync` 事件唤醒，让"后台收推送、断网重连后补发请求"成为可能
- **生命周期把"发新版"约束成状态机**：install 预缓存、waiting 等待、activate 收尸、字节比对触发更新——更新流程有明确的独占入口，配合版本化缓存名可控地滚动发布
- **全浏览器 Baseline**：SW 核心（注册、生命周期、fetch、Cache API）在 Chrome/Edge/Firefox/Safari 全部可用，离线能力已是可依赖的地基
- **PWA 让 Web 触达"类原生"**：Manifest + SW 让站点可安装到主屏/程序坞、独立窗口运行、离线可用，无需应用商店与打包

**局限**

- **周边能力碎成一地**：Push 各家支持面/权限模型不一（iOS 还要求先安装为 PWA），**Background Sync 仅 Chromium、Periodic Background Sync 仅 Chromium 且仅已安装 PWA**，`beforeinstallprompt` 是 Chromium 私有事件——离线之外的能力几乎都要做能力探测与降级
- **更新模型反直觉**：新 SW 默认进入 waiting、**要等所有受控标签页关闭才接管**（普通刷新不够），不懂 `skipWaiting`/`clients.claim` 就会撞上"改了代码用户却还是旧版"
- **调试心智负担重**：SW 有自己的缓存与生命周期，"改了没生效"多半是旧 SW 还在控制页面；必须靠 DevTools 的 Update on reload / Bypass for network 才能顺畅开发
- **强安全上下文**：只能跑在 HTTPS（`localhost` 例外），且严格同源、作用域受脚本路径约束——部署与路由稍有不慎就注册失败
- **能力越界即风险**：SW 能改写所有响应，一旦缓存了错误内容或写错策略，就是"给所有用户持久投毒"，回滚成本远高于普通前端 bug

一句话选型：**需要离线、可安装、后台推送/同步的 Web 应用就上 Service Worker + PWA**，但除"离线缓存"这一核心外，Push/Sync/安装体验都要按浏览器能力探测降级；生产里别裸写 SW 的缓存与路由，用 [Workbox](https://developer.chrome.com/docs/workbox) 这类库消灭样板（策略细节见[浏览器章](/zh/base/browser/browser-cache/guide-line/sw-cache-api)）。

## 本叶地图

- [入门](./getting-started) —— SW 是什么（可编程网络代理）、`register` 与作用域 `scope`、HTTPS/安全上下文要求、与浏览器章缓存的分工、PWA 三件套全景
- [生命周期](./guide-line/lifecycle) —— register→install→waiting→activate→redundant 状态机、`event.waitUntil` 预缓存、**"关闭所有标签才更新"的坑**、`skipWaiting` 立即接管、`clients.claim` 接管现页、字节比对与 24h 更新检查、`controller`
- [fetch 拦截与离线](./guide-line/fetch-offline) —— `fetch` 事件与 `respondWith` 充当网络代理、navigation preload 加速 SW 启动、离线兜底页、请求过滤；**缓存策略与 Cache API 链接[浏览器章](/zh/base/browser/browser-cache/guide-line/sw-cache-api)不展开**
- [推送与后台同步](./guide-line/push-notification-sync) —— Push API（`PushManager.subscribe` + VAPID）、`push` 事件与 `showNotification`、Notification 权限、Background Sync 一次性 `sync`、Periodic Background Sync（`periodicsync`）——各自支持面与限制
- [Manifest 与安装](./guide-line/manifest-install) —— Web App Manifest 字段、安装条件、`beforeinstallprompt` 拦截与自定义安装 UI、`display` 模式、iOS Safari 差异、`appinstalled` 事件
- [参考](./reference) —— 生命周期状态机表、SW 事件表、Push/Sync/Manifest 速查、浏览器支持矩阵、安装条件清单、易错点清单、资源链接

## 文档地址

[MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## GitHub 地址

[w3c/ServiceWorker](https://github.com/w3c/ServiceWorker)（规范仓库，Service Workers 现行标准 + Nightly 草案）

## 幻灯片地址

<a href="/SlideStack/service-worker-pwa-slide/" target="_blank">Service Worker 与 PWA</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=service-worker-与-pwa" target="_blank" rel="noopener noreferrer">Service Worker 与 PWA 测试题</a>
