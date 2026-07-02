---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Web 现代标准 · 核于 2026-07

## 速查

- CSP 指令四类：**fetch**（`default-src` 兜底）/ **document**（`base-uri`/`sandbox`/`require-trusted-types-for`）/ **navigation**（`form-action`/`frame-ancestors`）/ **reporting**（`report-uri` 遗留 → `report-to`）
- **strict CSP 配方**：`script-src 'nonce-…'`（或 hash）+ `'strict-dynamic'` + `object-src 'none'` + `base-uri 'none'`——不写域名白名单
- meta 下发 CSP 四不灵：`frame-ancestors`、`sandbox`、`report-uri`、`report-to`；Report-Only 头也无 meta 形式
- **Trusted Types**：`require-trusted-types-for 'script'` 后 sink 只收 `TrustedHTML/Script/ScriptURL`；**Baseline 2026-02 Newly available**；tinyfill 一行兜老浏览器
- **SRI**：`integrity="sha256/384/512-…"`，跨域必须 CORS + `crossorigin`；不匹配 = 网络错误；`Integrity-Policy` 头可强制全站脚本带 integrity
- 纵深四层：renderer 内检查 → 站点隔离 → OS 沙箱 → browser 进程终审；**CORB/ORB** 拦跨站 HTML/XML/JSON 进错进程
- iframe `sandbox`：**空值最严格**（不透明源 + 全禁）；**同源 + `allow-scripts` + `allow-same-origin` = 可自拆沙箱**；弹窗默认继承限制
- 点击劫持：`X-Frame-Options`（`DENY`/`SAMEORIGIN`，`ALLOW-FROM` 已废且致整头被忽略）→ **`frame-ancestors 'none'/'self'/来源列表`**；并存时 CSP 优先；两者 meta 均无效
- **安全上下文** = `https://`/`wss://` + 本机投递（`127.0.0.1`/`localhost`/`*.localhost`/`file://`）；iframe 看整条祖先链，弹窗只看自己顶层；检测用 `isSecureContext`
- 混合内容二分：**可升级**（img/audio/video src、CSS 图像 → 自动升 https）vs **可阻断**（script/样式/iframe/fetch/字体/srcset → 直接拦）；**IP 主机拦而不升**；`block-all-mixed-content` 已废弃
- **Permissions Policy** allowlist：`*` / `()` / `self` / `src`（iframe 默认）/ `"源"` / `"https://*.example.com"`（不匹配裸域）；响应头 × iframe `allow` 取交集
- **LNA**：`local-network` + `loopback-network` 权限（Chrome 142 起），仅安全上下文，授权后本地目标豁免混合内容；PNA 预检方案已搁置
- **Fetch Metadata**：`Sec-Fetch-Site`（`same-origin/same-site/cross-site/none`）+ `Mode`/`Dest`/`User`，Baseline 2023-03，服务端资源隔离策略的依据

## 一、CSP 指令表

| 类别 | 指令 | 管什么 / 备注 |
| --- | --- | --- |
| fetch | `default-src` | 所有 fetch 指令的回退 |
| fetch | `script-src`（`-elem`/`-attr`） | 脚本来源 / 元素与内联属性细分 |
| fetch | `style-src`（`-elem`/`-attr`） | 样式来源 |
| fetch | `img-src` / `font-src` / `media-src` | 图片 / 字体 / 音视频 |
| fetch | `connect-src` | fetch、XHR、WebSocket 连接目标 |
| fetch | `object-src` | `<object>`/`<embed>`——建议恒为 `'none'` |
| fetch | `frame-src` / `worker-src` | iframe 源 / Worker 脚本源（`child-src` 已废弃） |
| fetch | `manifest-src` / `fenced-frame-src` | PWA manifest / 围栏帧 |
| document | `base-uri` | 限制 `<base>`——建议 `'none'` |
| document | `sandbox` | 以沙箱方式渲染本文档 |
| document | `require-trusted-types-for` / `trusted-types` | sink 强制收 Trusted 类型 / 限定策略名 |
| navigation | `form-action` | 表单可提交到哪 |
| navigation | `frame-ancestors` | 谁能嵌我（防点击劫持） |
| reporting | `report-uri`（废弃）→ `report-to` | 违规上报（配 `Reporting-Endpoints` 头） |
| 杂项 | `upgrade-insecure-requests` | 全部子请求升 https |
| 杂项 | `block-all-mixed-content`（废弃） | 勿再使用 |

源表达式：`'none'` / `'self'` / host（`example.com`、`*.example.org`）/ scheme（`https:`、`data:`）/ `'nonce-…'` / `'sha256|384|512-…'` / `'strict-dynamic'` / `'unsafe-inline'` / `'unsafe-eval'`（后两者慎用）。

## 二、iframe sandbox 属性表

| Token | 放行 | 风险备注 |
| --- | --- | --- |
| （空值） | 什么都不放行 | 最严格；不透明源、全能力禁用 |
| `allow-scripts` | 执行脚本 | 与 `allow-same-origin` 同给且内容同源 → **可自拆沙箱** |
| `allow-same-origin` | 保留真实源（存储/Cookie/同源 API） | 缺省时为不透明源，永远同源失败 |
| `allow-forms` | 表单提交 | 缺省时提交静默失败 |
| `allow-popups` | `window.open`/`target="_blank"` | 弹窗默认继承沙箱限制 |
| `allow-popups-to-escape-sandbox` | 弹窗**不继承**沙箱 | 广告落地页场景标配 |
| `allow-modals` | alert/confirm/prompt/print、`<dialog>` | —— |
| `allow-downloads` | 触发下载 | —— |
| `allow-top-navigation` | 导航顶层 | 可把用户整页带走，慎给 |
| `allow-top-navigation-by-user-activation` | 同上但需用户手势 | 更安全的替代 |
| `allow-top-navigation-to-custom-protocols` | 顶层导航到自定义协议 | `allow-popups`/`allow-top-navigation` 连带激活 |
| `allow-orientation-lock` / `allow-pointer-lock` / `allow-presentation` | 锁方向 / 锁指针 / 演示会话 | —— |
| `allow-storage-access-by-user-activation` | Storage Access API 申请 Cookie | —— |

配套：`allow` 属性（Permissions Policy 委托）、`credentialless`（无凭证临时上下文，配合 COEP）、CSP `sandbox` 指令（响应头版，防「直接访问无沙箱」盲区）。

## 三、强能力 API 门控表（安全上下文）

| 用途 | 门控 API（节选） |
| --- | --- |
| 离线与消息 | Service Workers、Push、Notifications、Background Sync/Fetch |
| 媒体采集 | `getUserMedia()`、Screen Capture、Audio Output Devices |
| 定位与传感 | Geolocation、Generic Sensor（加速度/陀螺仪/磁力）、设备方向与运动 |
| 剪贴板与文件 | 异步 Clipboard、File System API |
| 密码学与凭证 | Web Crypto（`crypto.subtle`）、WebAuthn、Credential Management、WebOTP |
| 硬件直连 | WebUSB、Web Bluetooth、WebHID、Web Serial、Web NFC、Web MIDI |
| 支付与系统 | Payment Request、Web Share、Storage API、Screen Wake Lock、Idle Detection、`registerProtocolHandler()` |
| 图形与传输 | WebGPU、WebCodecs、WebTransport、WebXR |

判定回顾：`https://`/`wss://`、`http://127.0.0.1`、`http://localhost`、`http://*.localhost`、`file://` 为安全；iframe 需整条祖先链安全；弹窗按自身顶层判定；`window.isSecureContext` 检测。

## 四、混合内容分类表

| 类别 | 资源 | 浏览器行为 |
| --- | --- | --- |
| 可升级 upgradable | `<img src>`（不含 srcset）、CSS 图像、`<audio src>`、`<video src>`、`<source>` | 自动改写为 https 重试 |
| 可阻断 blockable | `<script>`、`<link>` 样式、`<iframe>`、`fetch`/XHR、全部 CSS `url()`（`@font-face`/`cursor`）、`<object data>`、`sendBeacon`、`srcset`/`<picture>`、Web 字体、一切新类型 | 直接阻断 |
| 例外 | `http://` + **IP 主机** | 拦而不升（正规出口走 LNA 权限） |

工具位：CSP `upgrade-insecure-requests`（连可阻断类一起升）；旧「主动/被动 + 仅警告」模型已退场；`block-all-mixed-content` 已废弃。

## 五、Permissions Policy 常用指令表

| 指令 | 管什么 | 被禁症状 |
| --- | --- | --- |
| `camera` / `microphone` | `getUserMedia` 视频/音频 | 拒绝 `NotAllowedError` |
| `geolocation` | 定位 | 回调收 `PERMISSION_DENIED` |
| `fullscreen` | `requestFullscreen()` | 拒绝 `TypeError` |
| `autoplay` | 媒体自动播放 | `play()` Promise 拒绝 |
| `display-capture` | `getDisplayMedia()` 录屏 | `NotAllowedError` |
| `payment` | Payment Request | `SecurityError` |
| `usb` / `bluetooth` / `hid` / `serial` / `midi` | 硬件直连各 API | 拒绝/`SecurityError` |
| `web-share` | `navigator.share()` | 拒绝 |
| `picture-in-picture` / `screen-wake-lock` / `idle-detection` / `gamepad` | 画中画 / 常亮 / 空闲检测 / 手柄 | 各自拒绝 |
| `publickey-credentials-get` / `-create` | WebAuthn 登录/注册（跨 iframe 委托常用） | 拒绝 |
| `storage-access` | Storage Access API | 拒绝 |
| `local-network` / `loopback-network`（别名 `local-network-access`） | LNA 内网/本机请求 | 请求失败 |
| `encrypted-media` / `xr-spatial-tracking` / `accelerometer` 等 | EME / XR / 传感器 | 各自拒绝 |

allowlist：`*` / `()` / `self` / `src`（iframe `allow` 默认值）/ `"源"`（头里带引号，`allow` 属性里不带）/ `"https://*.example.com"`（不匹配裸域）；头与 `allow` 属性取交集。头自身 not Baseline，指令支持度以 BCD 为准。

## 六、安全响应头总表

| 头 | 作用 | 状态 / 去处 |
| --- | --- | --- |
| `Content-Security-Policy`（`-Report-Only`） | 代码与资源加载白名单、Trusted Types 开关 | 现行 · [CSP 基础](./guide-line/csp-basics) |
| `Reporting-Endpoints` | 具名上报端点（配 `report-to`） | 现行 · 取代 `Report-To` 头 |
| `X-Frame-Options` | 防嵌入（DENY/SAMEORIGIN） | 遗留兜底 · `frame-ancestors` 优先 |
| `Permissions-Policy`（`-Report-Only`） | 强能力授权目录 | 现行（not Baseline）· [能力与元数据防护](./guide-line/permissions-policy-fetch-metadata) |
| `X-Content-Type-Options: nosniff` | 禁 MIME 嗅探，助 CORB/ORB | 现行 · 数据接口必配 |
| `Integrity-Policy`（`-Report-Only`） | 强制子资源带 integrity | 新锐 · [防注入三件套](./guide-line/strict-csp-trusted-types) |
| `Referrer-Policy` | `Referer` 泄露控制 | 细节见[网络章 · HTTP 头部](/zh/base/network/net-http-basics/guide-line/http-headers) |
| `Strict-Transport-Security` | 强制 HTTPS | 见[网络章 · HTTPS 与 TLS](/zh/base/network/net-https-tls/guide-line/mitm-hsts) |
| `Cross-Origin-Opener-Policy` / `-Embedder-Policy` / `-Resource-Policy` | opt-in 跨源隔离三件套 | 见[网络章 · SameSite 与跨源隔离](/zh/base/network/net-cors/guide-line/samesite-coop-coep) |
| `Sec-Fetch-Site/Mode/Dest/User` | （请求头）来源元数据，服务端隔离依据 | Baseline 2023-03 |

## 权威链接

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP) —— CSP 全指南（指令、nonce/hash、strict CSP、上报）
- [MDN: Trusted Types API](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API) —— sink 清单、策略工厂、Baseline 状态、tinyfill
- [MDN: Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity) —— integrity 语法、CORS 要求、Integrity-Policy
- [MDN: Mixed content](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content) —— 可升级/可阻断分类与 IP 例外
- [MDN: Secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts) · [门控特性清单](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts/features_restricted_to_secure_contexts) —— 判定规则与完整列表
- [MDN: Permissions-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy) —— allowlist 语法与指令目录
- [MDN: Local network access](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Local_network_access) · [Chrome Blog: LNA](https://developer.chrome.com/blog/local-network-access) —— 权限模型与 Chrome 142 落地
- [MDN: Sec-Fetch-Site](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Site) —— Fetch Metadata 四头
- [Chromium: Site Isolation](https://www.chromium.org/Home/chromium-security/site-isolation/) —— 沙箱、CORB、Spectre 防御视角
- [MDN: `<iframe>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe) · [MDN: X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options) —— sandbox token 全谱与遗留头

## 相关页

- [概览](./index) —— 本叶定位与地图
- [入门](./getting-started) —— 六道防线全景与分工地图
- [CSP 基础](./guide-line/csp-basics) —— 指令、源表达式、nonce/hash、上报换代
- [防注入三件套](./guide-line/strict-csp-trusted-types) —— strict CSP、Trusted Types、SRI
- [沙箱与隔离防御](./guide-line/sandbox-isolation-defense) —— 四层纵深、Spectre、CORB/ORB
- [iframe sandbox 与点击劫持](./guide-line/iframe-sandbox-clickjacking) —— sandbox token、frame-ancestors 换代
- [安全上下文与混合内容](./guide-line/secure-contexts-mixed-content) —— isSecureContext、可升级 vs 可阻断
- [能力与元数据防护](./guide-line/permissions-policy-fetch-metadata) —— Permissions Policy、LNA、Fetch Metadata
- 跨章：[跨源与 CORS](/zh/base/network/net-cors/) · [HTTPS 与 TLS](/zh/base/network/net-https-tls/) · [浏览器架构 · 站点隔离](../browser-architecture/guide-line/site-isolation)
