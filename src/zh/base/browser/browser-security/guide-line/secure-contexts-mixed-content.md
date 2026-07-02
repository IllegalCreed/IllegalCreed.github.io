---
layout: doc
outline: [2, 3]
---

# 安全上下文与混合内容

> 基于 Web 现代标准 · 核于 2026-07

## 速查

- **安全上下文（secure context）**：满足最低认证与保密标准的 `Window`/`Worker`——目标是**不让中间人（MITM）碰到强能力 API**；判定结果挂在 **`window.isSecureContext`**
- 算安全的：**`https://`/`wss://`**，以及「本机投递」的 **`http://127.0.0.1`、`http://localhost`、`http://*.localhost`**（Firefox 84+ 才认 localhost）和 **`file://`**——这就是「本地开发能用 SW，一上 http 测试机就不行」的原因
- 这类不走 HTTPS 也可信的源叫 **potentially trustworthy origin**（潜在可信源）
- **iframe 规则**：整条**祖先链**必须全部安全——HTTPS iframe 嵌在 HTTP 页面里**不算**安全上下文；反之，**弹窗不看 opener**：不安全页面开的新窗口按新窗口自己的顶层判定
- **强能力 API 全面门控**：Service Worker、`getUserMedia`、Geolocation、异步 Clipboard、Web Crypto、WebUSB/HID/Serial/Bluetooth、Push/Notifications、WebAuthn、Payment Request、WebGPU、WebTransport、Screen Capture……不在安全上下文里**直接不存在或直接拒绝**
- **混合内容（mixed content）**：HTTPS 页面加载 `http:` 子资源——密文页面上的明文窟窿，中间人可窥可改
- 现行规范分两类处置：**可升级（upgradable）**——`<img src>`、`<audio src>`、`<video src>`、CSS 背景图等**自动改写为 https 重试**；**可阻断（blockable）**——`<script>`、样式表、`<iframe>`、`fetch`/XHR、字体、`srcset`/`<picture>` 等**直接拦截**
- 这是 2020 年前后的**换代**：旧模型「主动内容拦、被动内容仅警告」已退场——**别再背「图片只是警告」**，现在是自动升级，升不上去就是坏
- **IP 直连例外**：`http://93.184.215.14/img.png` 这类 IP 主机**不升级、直接阻断**（域名才升级）——内网设备场景的豁免走 [Local Network Access](./permissions-policy-fetch-metadata)
- **`upgrade-insecure-requests`** CSP 指令：把页面**所有** http 子请求（含可阻断类）改写为 https——存量 http 链接多的老站迁移利器；**`block-all-mixed-content` 已废弃**，别再配
- TLS 本身（握手/证书/HSTS）见[网络章 · HTTPS 与 TLS](/zh/base/network/net-https-tls/)，本页只管「浏览器据此开/关什么」
- 排查：DevTools **Console** 对升级与阻断各有一条警告；升级后的请求在 **Network** 面板 URL 已是 https

## 一、安全上下文：强能力的准入门槛

浏览器把 API 分了两档。DOM 操作、`fetch`、CSS 动画这类「常规能力」哪都能用；而**强能力（powerful features）**——读你的摄像头、拿你的地理位置、注册常驻的 Service Worker、直连 USB 设备——被圈进**安全上下文**才开放。

动机直指中间人：HTTP 页面的每一个字节都可能被网络路径上的任何一跳篡改。如果强能力在 HTTP 下可用，「攻破咖啡馆 Wi-Fi」就等于「往任意页面注入一段调 `getUserMedia` 的脚本」。MDN 的表述——安全上下文的主要目标是**防止 MITM 攻击者接触到能进一步加害用户的强能力 API**。

### 1.1 判定规则

一个上下文是否安全，看它的**投递通道**与**顶层环境**：

| 上下文 | 安全？ | 说明 |
| --- | --- | --- |
| `https://` / `wss://` | ✅ | 正道 |
| `http://127.0.0.1` / `http://localhost` / `http://*.localhost` | ✅ | 本机投递，不经网络——**potentially trustworthy origin**（Firefox 84+ 才认 localhost 域名写法） |
| `file://` | ✅ | 本地文件 |
| `http://` 其他一切 | ❌ | 包括内网 IP：`http://192.168.1.10` **不是**安全上下文 |
| HTTPS iframe ⊂ HTTP 页面 | ❌ | **祖先链一票否决**：所有祖先都必须安全 |
| HTTP 页面 `window.open` 出的 HTTPS 窗口 | ✅ | 弹窗按**自己的顶层**判定，不看 opener 是否安全 |

```js
// 特性检测：别猜，问浏览器
if (window.isSecureContext) {
  // 安全上下文：SW 可注册
  navigator.serviceWorker.register("/sw.js");
} else {
  console.warn("非安全上下文：强能力 API 不可用");
}
// Worker 里同样有 self.isSecureContext
```

两个高频踩坑：**局域网联调**——手机访问 `http://192.168.1.10:5173` 时 SW/摄像头全灭（本机 localhost 好好的），解法是 devServer 开 HTTPS（自签/mkcert）或用支持 HTTPS 的隧道；**iframe 集成**——你的 HTTPS 应用被客户嵌进 HTTP 老门户，强能力集体失效，这是祖先链规则，不是你的 bug。

### 1.2 强能力门控清单

MDN 维护完整列表（几十项），前端高频的按用途归组：

| 用途 | 被门控的 API |
| --- | --- |
| 离线与消息 | **Service Workers**、Push API、Notifications API、Background Sync/Fetch |
| 媒体采集 | **`MediaDevices.getUserMedia()`**（摄像头/麦克风）、Screen Capture、Audio Output Devices |
| 定位与传感 | **Geolocation API**、Generic Sensor（加速度计/陀螺仪）、设备方向/运动 |
| 剪贴板与文件 | **异步 Clipboard API**、File System API |
| 密码学与凭证 | **Web Crypto API**（`crypto.subtle`）、**Web Authentication（WebAuthn）**、Credential Management、WebOTP |
| 硬件直连 | **WebUSB**、Web Bluetooth、WebHID、Web Serial、Web NFC、Web MIDI |
| 支付与系统 | Payment Request、Web Share、Storage API（持久化）、Screen Wake Lock、Idle Detection |
| 新锐图形/传输 | **WebGPU**、WebCodecs、WebTransport、WebXR |

记忆模型：**「这个能力落到中间人手里可怕吗？」可怕就在清单上**。失败形态不统一——有的 API 在非安全上下文里干脆 `undefined`（如 `navigator.serviceWorker`），有的返回拒绝的 Promise，特性检测时两种都要兜。

## 二、混合内容：密文页面上的明文窟窿

页面本身走了 HTTPS，里面却挂着 `http://` 的子资源——这就是**混合内容**。它把 HTTPS 的承诺撕开一道口子：明文资源在路上**可被窥探**（泄露用户在看什么），更糟的是**可被替换**——尤其当那是脚本或样式时，等于把页面控制权交给中间人。

### 2.1 现行分类：可升级 vs 可阻断

现行 Mixed Content 规范按「拦掉会不会大面积坏站」把 http 子资源分成两类处置：

| 类别 | 覆盖的资源 | 浏览器行为 |
| --- | --- | --- |
| **可升级（upgradable）** | `<img src>`（含 SVG，但**不含 `srcset`**）、CSS 图像（`background-image`/`border-image` 等）、`<audio src>`、`<video src>`、`<source>` | **自动把 URL 改写为 https 再请求**；服务器若不支持 https，加载失败 |
| **可阻断（blockable）** | `<script>`、`<link>` 样式表、`<iframe>`、`fetch()`/XHR、所有 CSS `url()`（含 `@font-face`、`cursor`）、`<object data>`、`sendBeacon()`、**`<img srcset>`/`<picture>`**、Web 字体……以及**一切新类型** | **直接阻断，不发请求** |

这是一次**换代**，别沿用旧笔记：早期规范分「主动（active）/被动（passive）」——脚本这类能改页面的必拦，图片这类「只展示」的允许加载、仅在控制台警告加小图标。新规范把旧「被动/可选阻断」清单**平移成了「可升级」**：不再放行明文，而是替你升到 https；**所有新增资源类型一律归入可阻断**。所以 2020 年后的正确心智是：**HTTPS 页面里不存在「还能明文加载」的子资源——要么被升级、要么被拦**。

两个边界：

- **IP 主机不升级、直接拦**：`<img src="http://example.com/a.png">` 会升级，`<img src="http://93.184.215.14/a.png">` 直接阻断——IP 直连大概率是内网设备，盲升 https 只会换一种失败。这条路的正解是 [Local Network Access](./permissions-policy-fetch-metadata) 的权限化豁免（权限授予后对本地目标放宽混合内容检查）。
- **混合下载（mixed downloads）**：HTTPS 页面里指向 http 的下载同样被现代浏览器视为风险处置。

### 2.2 upgrade-insecure-requests 与已废弃的 block-all-mixed-content

存量老站数据库里躺着上万条 `http://` 图片外链时，逐条改写不现实。CSP 提供一键升级：

```http
# 页面所有 http 子请求（包括可阻断类：脚本、iframe、fetch……）在发出前统一改写为 https
Content-Security-Policy: upgrade-insecure-requests
```

它比浏览器默认行为更进一步——默认只升「可升级类」，这个指令连可阻断类一起升。注意它改写的是**本页面的子请求**，不负责别人链到你的 http 入口（那是 HSTS 的活，见[网络章 · HTTPS 与 TLS](/zh/base/network/net-https-tls/)）。

反方向的 **`block-all-mixed-content`**（连可升级类也一律拦）**已废弃**：升级语义成为默认后它失去意义，MDN 明确建议不再使用——存量配置见到可以删。

### 2.3 DevTools 里怎么看

- **Console**：升级类打印「Mixed Content: … was loaded over HTTPS, but requested an insecure … This request has been upgraded」；阻断类打印「…This request has been blocked; the content must be served over HTTPS」。
- **Network**：升级成功的资源 URL 列已是 `https://`；被拦的请求标 `(blocked:mixed-content)`。
- 地址栏锁形图标变化/「不安全」提示也是线索；上线前可用爬虫类工具全站扫 `http://` 引用。

## 小结

安全上下文回答「强能力凭什么开放」：`https://`、本机投递（`127.0.0.1`/`localhost`/`file://`，即 potentially trustworthy origin）才算数，iframe 要整条祖先链安全、弹窗只看自己顶层，代码里以 `isSecureContext` 为准；SW、getUserMedia、Clipboard、Web Crypto、WebUSB、WebGPU 等几十项强能力全在门控清单上。混合内容回答「密文页面里的明文资源怎么办」：现行规范二分处置——img/audio/video 等**自动升级**，script/iframe/fetch 等**直接阻断**，IP 主机例外（拦而不升）；旧的「被动内容仅警告」心智作废。迁移利器是 CSP `upgrade-insecure-requests`（连可阻断类一起升），而 `block-all-mixed-content` 已废弃。安全上下文同时也是下一页两大机制的准入前提——能力策略与内网访问权限：[能力与元数据防护](./permissions-policy-fetch-metadata)。
