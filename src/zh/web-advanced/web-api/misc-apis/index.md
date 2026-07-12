---
layout: doc
---

# 常用杂项 API

「常用杂项 API」是 Web API 章的收尾叶，把一批**小而常用、各自不够单独成叶**的平台能力收在一处讲透：**剪贴板**（Clipboard）、**系统分享**（Web Share）、**系统通知**（Notifications）、**页面可见性**（Page Visibility）、**屏幕唤醒锁**（Screen Wake Lock）、**地理定位**（Geolocation）、**URL 模式匹配**（URLPattern）、**权限查询**（Permissions），外加 Battery / Network Information / Vibration 三个「知道就好」的边角 API。它们体量不一、场景各异，却共享同一套底层契约：**安全上下文（HTTPS）+ 用户激活（user gesture）+ 权限模型（Permissions API / Permissions Policy）+ 特性检测渐进增强**。本叶不追求把每个 API 的每个角落写全，而是把**共性的权限与安全模型**讲透一次，再逐个 API 抓住「怎么用、什么时候拿不到、怎么优雅降级」。

## 评价

**优点**

- **贴设备、贴系统**：这批 API 直接对接操作系统的剪贴板、分享面板、通知中心、GPS、屏幕电源，是 Web 从「文档」走向「应用」的关键拼图，PWA / 移动 Web 的体验很大程度靠它们撑起
- **共性强、学一次通一批**：绝大多数都遵循「安全上下文 + 用户激活 + Permissions 查询 + 特性检测」四件套，摸透一个，剩下的都是同一套心智的变奏
- **异步现代化**：清一色 Promise API（`writeText`/`share`/`requestPermission`/`getCurrentPosition` 的 Promise 化用法），告别 `execCommand` 时代的同步阻塞与返回布尔值判断成败
- **多数已 Baseline**：Page Visibility、Geolocation、Permissions、Clipboard、Notifications 早已跨浏览器可用；URLPattern 也在 2025-09-15 补齐 Safari 后转正为 Baseline Newly available
- **降级路径清晰**：能力探测（`canShare`、`ClipboardItem.supports`、`in` 运算符）到位，「拿不到就退回」的工程模式成熟

**局限**

- **权限与激活门槛高**：几乎全要 HTTPS，很多还要「必须在点击回调里同步调用」，异步 `await` 之后再调常常因用户激活过期而失败——不理解激活模型就会踩坑
- **跨浏览器差异是常态**：Clipboard 的 `read` 在 Firefox 落地晚、Permissions 的可查询名单各家不一、Web Share / Notification 在桌面与 iOS 上限制重重、Wake Lock 与 URLPattern 各有支持起点——「能力矩阵」比「API 签名」更需要记
- **隐私红线在收紧**：Battery Status 被 Firefox 移除、Safari 从未实现；Network Information 仍是 Chromium 独占的非标准；指纹风险让这类「读设备状态」的 API 整体处于收缩态势
- **移动/桌面割裂**：Web Share、Vibration、页面级 Notification 基本是移动主场，桌面要么不支持要么体验残缺；iOS 的 Web 通知还要求先把 PWA 装到主屏
- **失败静默**：不少 API 拿不到权限时不抛错而是「什么都不发生」（如桌面 `vibrate`），必须主动做能力探测与结果校验，不能假设调用即生效

一句话选型：**需要贴合系统的「小能力」时就在这批里找**——复制粘贴用 [Clipboard](./guide-line/clipboard-share)，唤起系统分享用 [Web Share](./guide-line/clipboard-share)，弹系统通知用 [Notifications](./guide-line/notification-visibility-wake)（服务端推送走 [Service Worker & PWA 叶](/zh/web-advanced/web-api/service-worker-pwa/)），省电/暂停后台活动用 [Page Visibility](./guide-line/notification-visibility-wake)，防熄屏用 [Wake Lock](./guide-line/notification-visibility-wake)，取位置用 [Geolocation](./guide-line/geolocation-url-others)，前端路由匹配用 [URLPattern](./guide-line/geolocation-url-others)；**动手前先过一遍[权限模型与工程模式](./guide-line/permissions-patterns)**，把安全上下文、用户激活、特性检测、优雅降级这套通用地基打牢，再逐个 API 用才不会满地踩坑。

## 本叶地图

- [入门](./getting-started) —— 合集定位与相邻叶分工、四条共性地基（安全上下文 / 用户激活 / 权限模型 / 特性检测）、Permissions API 作为「权限总线」的心智、一张「谁要 HTTPS、谁要手势、谁走 Permissions」的速览表
- [剪贴板与分享](./guide-line/clipboard-share) —— `writeText`/`readText`/`write`/`read` 与 `ClipboardItem` 富内容、焦点与权限差异、Firefox `read` 落地晚、`execCommand('copy')` 废弃降级；Web Share 的 `share`/`canShare`、用户激活、`canShare({files})` 探测、移动主力
- [通知、页面状态与唤醒锁](./guide-line/notification-visibility-wake) —— `Notification.requestPermission` 与页面级 vs SW 持久通知、iOS 需装 PWA、`actions` 仅 SW；Page Visibility 的 `visibilityState`/`visibilitychange` 省电模式；Screen Wake Lock 的 `request('screen')`、sentinel、隐藏自动释放需重获
- [定位、URL 与其他](./guide-line/geolocation-url-others) —— Geolocation 的 `getCurrentPosition`/`watchPosition`/`clearWatch` 与选项/错误码；URLPattern 的 `test`/`exec`/命名分组与 Baseline 状态；Battery / Network Information / Vibration 三个边角 API 的现状与隐私收缩
- [权限模型与工程模式](./guide-line/permissions-patterns) —— `permissions.query({name})` 的三态与 `onchange`、哪些 API 走 Permissions、特性检测与渐进增强、用户激活（transient activation）、最小权限与优雅失败的工程范式
- [参考](./reference) —— 各 API 速查、权限矩阵、支持面矩阵、安全上下文与用户激活要求表、易错点清单、资源链接

## 文档地址

[MDN Web API 索引](https://developer.mozilla.org/en-US/docs/Web/API) —— 本叶各 API 的一手文档入口：

- [Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) ｜ [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API) ｜ [Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) ｜ [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) ｜ [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [URL Pattern API](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API) ｜ [Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API)

## GitHub 地址

各 API 分属 W3C / WHATWG 的独立规范仓库：

- [w3c/clipboard-apis](https://github.com/w3c/clipboard-apis) ｜ [w3c/web-share](https://github.com/w3c/web-share) ｜ [whatwg/notifications](https://github.com/whatwg/notifications)
- [w3c/page-visibility](https://github.com/w3c/page-visibility) ｜ [w3c/screen-wake-lock](https://github.com/w3c/screen-wake-lock) ｜ [w3c/geolocation](https://github.com/w3c/geolocation)
- [whatwg/urlpattern](https://github.com/whatwg/urlpattern) ｜ [w3c/permissions](https://github.com/w3c/permissions)

## 幻灯片地址

<a href="/SlideStack/misc-apis-slide/" target="_blank">常用杂项 API</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=常用杂项-api" target="_blank" rel="noopener noreferrer">常用杂项 API 测试题</a>
