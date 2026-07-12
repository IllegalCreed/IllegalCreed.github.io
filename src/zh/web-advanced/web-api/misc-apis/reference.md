---
layout: doc
outline: [2, 3]
---

# 参考：API 速查 / 矩阵 / 易错点

> 基于各 Web API 现行标准（W3C/WHATWG）与浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **Clipboard**：`navigator.clipboard` 的 `writeText(s)`/`readText()`/`write(items)`/`read()`（全 `Promise`）；富内容用 `ClipboardItem`；安全上下文 + 读需焦点 + 常需激活；Firefox 网页 `read` 落地晚；降级 `execCommand("copy")`（废弃）。
- **Web Share**：`navigator.share({title,text,url,files})` → `Promise`；`canShare(data)`/`canShare({files})` 探测；安全上下文 + **必须用户激活**；取消 = `AbortError`；移动主力。
- **Notifications**：`Notification.requestPermission()`→三态；页面级 `new Notification()`（移动多不支持）vs SW `registration.showNotification()`（持久、可 `actions`、移动唯一可行）；iOS 需装 PWA；服务端推送见 [SW & PWA 叶](/zh/web-advanced/web-api/service-worker-pwa/)。
- **Page Visibility**：`document.visibilityState`（`visible`/`hidden`）+ `visibilitychange`；转后台暂停轮询/动画/视频；保存态用它替 `unload`。
- **Screen Wake Lock**：`navigator.wakeLock.request("screen")`→`WakeLockSentinel`（唯一类型 `screen`）；`sentinel.release()`/`released`/`release` 事件；**隐藏自动释放、回前台须重获**；Chromium + Safari 16.4+。
- **Geolocation**：`getCurrentPosition`/`watchPosition`(→id)/`clearWatch(id)`；`coords.{latitude,longitude,accuracy}`；错误码 1/2/3；选项 `enableHighAccuracy`/`timeout`/`maximumAge`。
- **URLPattern**：`new URLPattern(input, baseURL?)`；`test()`/`exec()`；`:name`/`*`/`(正则)`/`?+*`/`{}`；**Baseline 2025-09-15**（Chrome 95 / Firefox 142 / **Safari 26**，非 16.4）。
- **Permissions**：`navigator.permissions.query({name})`→`state` 三态（`granted`/`denied`/`prompt`）+ `onchange`；**只读不请求**；`clipboard-*` 基本仅 Chromium，查不支持名抛 `TypeError`。
- **边角三**：Battery（`getBattery()`，Firefox 移除/Safari 无/仅 Chromium，收缩）、Network Information（`navigator.connection`，Chromium 独占非标准，`saveData` 可用）、Vibration（`navigator.vibrate()`，仅移动、无 iOS Safari）。
- **三道门**：用户授权（Permissions）× 用户激活（手势）× 权限策略（Permissions Policy）——**与**关系，缺一不可。
- **通用范式**：特性检测 → 手势内调用 → 查权限/处理拒绝 → 优雅降级；最小权限、恰时申请、先给理由。
- **检测原语**：`in` 运算符（`"wakeLock" in navigator`）+ 能力探针（`canShare({files})`、`ClipboardItem.supports(mime)`）——先探再用。
- **Worker 可达性**：Permissions / Notifications / URLPattern 在 Web Worker 可用；Clipboard / Web Share / Geolocation / Wake Lock 仅主线程。
- **安全上下文**：全部要 HTTPS/localhost；`window.isSecureContext` 自查。
- **无法撤销**：Permissions 无 `revoke()`，用户只能去设置改。
- **剪贴板安全**：paste-jacking / 敏感内容窃取，威胁模型见[浏览器安全章](/zh/base/browser/browser-security/)。

## 一、API 方法速查

### 1.1 Clipboard

| 成员 | 签名 | 说明 |
| --- | --- | --- |
| `navigator.clipboard.writeText(s)` | `Promise<void>` | 写纯文本 |
| `navigator.clipboard.readText()` | `Promise<string>` | 读纯文本（需焦点） |
| `navigator.clipboard.write(items)` | `Promise<void>` | 写 `ClipboardItem[]` 富内容 |
| `navigator.clipboard.read()` | `Promise<ClipboardItem[]>` | 读富内容 |
| `new ClipboardItem(record)` | — | `{ mime: Blob｜string｜Promise }` 多表示 |
| `item.types` / `item.getType(mime)` | `string[]` / `Promise<Blob>` | 表示列表 / 取指定表示 |
| `ClipboardItem.supports(mime)` | `boolean`（静态） | 探测能否写某 MIME |

### 1.2 Web Share

| 成员 | 签名 | 说明 |
| --- | --- | --- |
| `navigator.share(data)` | `Promise<void>` | 唤起系统分享面板；需激活 |
| `navigator.canShare(data)` | `boolean` | 探测这份 data 可否分享 |
| `ShareData` | `{ title?, text?, url?, files? }` | 至少一个有效字段 |

### 1.3 Notifications

| 成员 | 签名 / 类型 | 说明 |
| --- | --- | --- |
| `Notification.requestPermission()` | `Promise<"granted"｜"denied"｜"default">` | 申请权限（亦有回调形） |
| `Notification.permission` | `"granted"｜"denied"｜"default"` | 静态：当前权限 |
| `new Notification(title, options)` | `Notification` | 页面级（移动多抛 `TypeError`） |
| `registration.showNotification(title, options)` | `Promise<void>` | SW 持久通知（支持 `actions`） |
| `registration.getNotifications(filter?)` | `Promise<Notification[]>` | 取回该注册的通知 |
| 选项 | `body`/`icon`/`badge`/`tag`/`data`/`requireInteraction`/`silent`/`actions` | `actions` 仅 SW |
| 事件 | 页面：`click`/`close`/`error`/`show`；SW：`notificationclick`/`notificationclose` | — |

### 1.4 Page Visibility / Screen Wake Lock

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `document.visibilityState` | `"visible"｜"hidden"` | 当前可见性 |
| `document.hidden` | `boolean` | 已不推荐，用 `visibilityState` |
| `visibilitychange` 事件 | — | 可见性变化时在 `document` 触发 |
| `navigator.wakeLock.request("screen")` | `Promise<WakeLockSentinel>` | 申请（`screen` 是唯一类型） |
| `sentinel.release()` | `Promise<void>` | 主动释放 |
| `sentinel.released` / `sentinel.type` | `boolean` / `"screen"` | 是否已释放 / 类型 |
| `sentinel` 的 `release` 事件 | — | 任何原因释放都触发 |

### 1.5 Geolocation

| 成员 | 签名 | 说明 |
| --- | --- | --- |
| `getCurrentPosition(ok, err?, opts?)` | `void` | 单次定位 |
| `watchPosition(ok, err?, opts?)` | `number`（watchId） | 持续追踪 |
| `clearWatch(id)` | `void` | 停止追踪 |
| `GeolocationCoordinates` | — | `latitude`/`longitude`/`accuracy`（必有）+ `altitude`/`altitudeAccuracy`/`heading`/`speed`（可 null） |
| `PositionOptions` | — | `enableHighAccuracy`(false)/`timeout`(∞)/`maximumAge`(0) |
| 错误码 | — | `1` PERMISSION_DENIED / `2` POSITION_UNAVAILABLE / `3` TIMEOUT |

### 1.6 URLPattern / Permissions

| 成员 | 签名 | 说明 |
| --- | --- | --- |
| `new URLPattern(input, baseURL?)` | — | `input` = 模式串或分量对象 |
| `pattern.test(url, baseURL?)` | `boolean` | 匹配与否 |
| `pattern.exec(url, baseURL?)` | 结果对象 ｜ `null` | 分量 + `groups` 命名捕获 |
| `navigator.permissions.query({name})` | `Promise<PermissionStatus>` | 查权限（只读，不请求） |
| `PermissionStatus.state` | `"granted"｜"denied"｜"prompt"` | 三态 |
| `PermissionStatus` 的 `change` 事件 / `onchange` | — | 用户改权限时触发 |

## 二、权限矩阵：谁走 Permissions、可查名是什么

| API | Permissions 可查名 | 说明 |
| --- | --- | --- |
| Geolocation | `geolocation` | 通用支持 |
| Notifications | `notifications` | 通用支持 |
| Push | `push` | 需 `userVisibleOnly` 等 |
| 摄像头 / 麦克风 | `camera` / `microphone` | 通用支持 |
| Screen Wake Lock | `screen-wake-lock` | 支持面同 Wake Lock 本体 |
| 持久存储 | `persistent-storage` | — |
| Clipboard 读 / 写 | `clipboard-read` / `clipboard-write` | **基本仅 Chromium**；Firefox/Safari 查抛 `TypeError` |
| **Web Share** | **无**（不走可查权限） | 靠**用户激活** + `web-share` 策略 |
| **Vibration** | **无** | 靠用户激活；移动限定 |
| **URLPattern / Page Visibility** | **无**（不涉敏感资源） | 无需授权 |

## 三、支持面矩阵（现行 Baseline 概览）

| API | Chromium | Firefox | Safari | 备注 |
| --- | --- | --- | --- | --- |
| Clipboard `writeText` | ✅ | ✅ | ✅ | 广泛可用 |
| Clipboard `read`/`readText` | ✅ | ⚠️ 落地晚（网页读 FF125+ 起） | ✅（粘贴提示） | 读比写严 |
| Web Share | ✅（桌面部分） | ⚠️ 有限 | ✅（移动强） | 移动主力，非 Baseline |
| Notifications（页面级） | ✅（桌面） | ✅（桌面） | ⚠️ | 移动多抛错 |
| Notifications（SW 持久） | ✅ | ✅ | ✅（iOS 需装 PWA） | 移动唯一可行 |
| Page Visibility | ✅ | ✅ | ✅ | Baseline 广泛可用 |
| Screen Wake Lock | ✅ | ❌ 暂无 | ✅ 16.4+ | 需 `"wakeLock" in navigator` |
| Geolocation | ✅ | ✅ | ✅ | Baseline 广泛可用 |
| URLPattern | ✅ 95+ | ✅ 142+ | ✅ **26+** | **Baseline 2025-09-15** |
| Permissions | ✅（名单最全） | ⚠️ 部分名 | ⚠️ 部分名 | `clipboard-*` 仅 Chromium |
| Battery Status | ✅ | ❌ 已移除 | ❌ 从未实现 | 隐私收缩，勿依赖 |
| Network Information | ✅ | ❌ | ❌ | Chromium 独占非标准 |
| Vibration | ✅（移动） | ✅（移动） | ❌（含 iOS） | 桌面无效 |

> URLPattern 的 Baseline Newly available 日期即最后补齐的浏览器 **Safari 26（2025-09-15）**；Chrome 95（2021-10-19）、Firefox 142（2025-08-19）。**易混提醒**：URLPattern 是 Safari **26**，不是 16.4；Safari 16.4 对应的是 Screen Wake Lock 等。

## 四、安全上下文与用户激活要求表

| API | 需安全上下文(HTTPS) | 需用户激活(手势) | 需授权 |
| --- | --- | --- | --- |
| Clipboard 写 | ✅ | ✅（Chromium 授权后可免） | Chromium 走 `clipboard-write` |
| Clipboard 读 | ✅ | ✅（且需焦点） | Chromium 走 `clipboard-read` |
| Web Share | ✅ | ✅（强制） | 无 |
| Notification 申请权限 | ✅ | ✅（多数浏览器要求） | 结果即授权 |
| Geolocation | ✅ | ❌（但会弹授权窗） | ✅ `geolocation` |
| Screen Wake Lock | ✅ | 建议在手势内（且文档需可见） | `screen-wake-lock` |
| Vibration | ❌（无强制 HTTPS） | ✅（sticky activation） | 无 |
| URLPattern | ❌ | ❌ | 无（纯计算） |
| Page Visibility | ❌ | ❌ | 无 |
| Permissions `query` | ✅（部分） | ❌ | 无（只读） |

## 五、易错点清单

- **异步后再调用受激活约束的 API**：`await fetch()` 后 `navigator.share()`/`clipboard.write()` 因激活过期 `NotAllowedError`——手势回调第一时间调，异步准备提前。
- **在 Console 里 `readText()` 失败**：焦点在 DevTools 上、文档没焦点——由页面按钮点击触发。
- **把 Web Share 的 `AbortError` 当错误报**：那是用户取消，正常流程，`if (err.name !== "AbortError")` 才算错。
- **只 `"share" in navigator` 就直接分享文件**：文件支持另说——用 `canShare({ files })` 单独探测。
- **移动端用 `new Notification()`**：多数移动浏览器抛 `TypeError`——移动用 SW `showNotification()`。
- **指望页面级通知带按钮**：`actions` 仅 SW 持久通知支持。
- **iOS 普通标签页要通知**：iOS 只对已装到主屏的 PWA 生效（16.4+）。
- **把「本地通知」当「服务端推送」**：关掉页面还能收的推送要 Push API + SW 订阅——见 [SW & PWA 叶](/zh/web-advanced/web-api/service-worker-pwa/)。
- **用 `unload`/`beforeunload` 存状态**：不可靠且破坏 bfcache——改 `visibilitychange` 转 `hidden` + `sendBeacon`。
- **申请了唤醒锁就以为一直有效**：页面转 hidden 自动释放——`visibilitychange` 回 visible 时重新 `request`。
- **假设所有浏览器都支持 Wake Lock**：Firefox 暂无——`"wakeLock" in navigator` 探测 + 降级。
- **`watchPosition` 忘了 `clearWatch`**：持续耗电耗流量——离开即清。
- **`enableHighAccuracy: true` 到处开**：更慢更耗电——只在真需要 GPS 精度时开。
- **误判 URLPattern 的 Safari 版本**：是 Safari 26、非 16.4；旧环境用 polyfill 或退回正则。
- **以为 `permissions.query()` 会申请权限**：只读不请求——真正授权靠调用对应 API。
- **`query({name:"clipboard-read"})` 在 Firefox/Safari 崩掉**：不认该名字抛 `TypeError`——必须 `try/catch`。
- **`denied` 后仍反复弹窗**：弹也没用还烦人——停止弹窗，引导去设置。
- **一进页面连弹一串授权**：转化率极低——最小权限、恰时申请、先给理由。
- **依赖 Battery / Network Information**：前者收缩、后者 Chromium 独占非标准——当增强、必探测。
- **桌面调 `vibrate()` 以为会震**：桌面与 iOS Safari 不支持，静默无效——只作移动端锦上添花。
- **忘了大多数 API 要 HTTPS**：`http://` 线上页面这些能力多不可用——`window.isSecureContext` 自查。

## 六、权威链接

- [MDN: Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) ｜ [ClipboardItem](https://developer.mozilla.org/en-US/docs/Web/API/ClipboardItem) ｜ [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API)
- [MDN: Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API) ｜ [ServiceWorkerRegistration.showNotification()](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification)
- [MDN: Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) ｜ [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) ｜ [WakeLockSentinel](https://developer.mozilla.org/en-US/docs/Web/API/WakeLockSentinel)
- [MDN: Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API) ｜ [URL Pattern API](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API) ｜ [URLPattern](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern)
- [MDN: Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API) ｜ [PermissionStatus](https://developer.mozilla.org/en-US/docs/Web/API/PermissionStatus)
- [MDN: Battery Status API](https://developer.mozilla.org/en-US/docs/Web/API/Battery_Status_API) ｜ [Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API) ｜ [Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API)
- [MDN: Secure Contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts) ｜ [User activation](https://developer.mozilla.org/en-US/docs/Web/Security/User_activation) ｜ [Permissions-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy)
- [web.dev: URLPattern is now Baseline Newly available](https://web.dev/blog/baseline-urlpattern) ｜ [Web platform features explorer: URLPattern](https://web-platform-dx.github.io/web-features-explorer/features/urlpattern/)
- 本站相邻内容：[Service Worker & PWA 叶](/zh/web-advanced/web-api/service-worker-pwa/) ｜ [浏览器安全章](/zh/base/browser/browser-security/)
