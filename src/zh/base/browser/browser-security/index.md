---
layout: doc
---

# 浏览器安全

浏览器每天执行来路不明的代码，却要保证你的密码、Cookie 和内网设备不被顺走——靠的不是某一道墙，而是一组**常开的防护机制**：CSP 与 Trusted Types 把注入的脚本拦在执行之前，渲染器沙箱与 CORB 保证「就算攻破了 renderer 也拿不到别家数据」，iframe sandbox 与 `frame-ancestors` 管住嵌入关系，安全上下文与混合内容策略守住传输底线，Permissions Policy 与 Local Network Access 给强能力上锁，Fetch Metadata 再把请求来源如实报给服务端。这一叶专讲**浏览器执行环境自带的防御工事**——每个机制怎么配、配错了页面怎么坏、DevTools 里怎么看违规报告。同源策略、CORS 与 COOP/COEP 等跨源读取规则已在[网络章 · 跨源与 CORS](/zh/base/network/net-cors/) 讲透；XSS/CSRF 的攻击手法、加密与鉴权体系归顶层安全章（待产出）；站点隔离的进程模型细节见兄弟叶[浏览器架构](../browser-architecture/)——本叶只从防御视角接续。

## 概述

- **防注入三件套**：CSP 用指令 + 源表达式限定「什么代码能跑」，strict CSP（nonce/hash + `strict-dynamic`）取代易被绕过的域名白名单；**Trusted Types** 给 DOM XSS sink 上闸（**Baseline 2026-02 Newly available**，已非 Chrome 独占）；**SRI** 用 `integrity` 哈希防 CDN 篡改。
- **进程级防御纵深**：renderer 内同源检查 → 站点隔离分进程 → OS 沙箱断系统调用 → browser 进程终审，四层递进；**CORB/ORB** 拦下跨站 HTML/XML/JSON 响应，正面回应 Spectre「无漏洞也能读本进程内存」的侧信道威胁。
- **嵌入防线**：iframe `sandbox` 属性按 token 白名单授权（空值最严格；`allow-scripts` + `allow-same-origin` 同源组合可逃逸）；点击劫持防护从 `X-Frame-Options` 换代到 CSP `frame-ancestors`。
- **传输底线**：强能力 API（Service Worker、getUserMedia、Web Crypto……）只在**安全上下文**（HTTPS/localhost/file）开放；混合内容按**可升级**（img/audio/video 自动升 HTTPS）与**可阻断**（script/iframe/fetch 直接拦）两类处置。
- **能力与元数据**：**Permissions Policy**（原 Feature Policy）经响应头 + iframe `allow` 双通道收窄摄像头/定位等能力；**Local Network Access**（Chrome 142 起）用权限提示拦下「公网页面打内网」；**Fetch Metadata**（`Sec-Fetch-*`）让服务端一眼识别跨站请求。

## 本叶地图

- [入门](./getting-started) —— 浏览器安全模型全景：默认防线有哪几道、本叶与网络章/安全章的分工地图
- [CSP 基础](./guide-line/csp-basics) —— 指令四类、源表达式、nonce/hash、unsafe-* 的代价、Report-Only 与报告换代
- [防注入三件套](./guide-line/strict-csp-trusted-types) —— strict CSP、Trusted Types（Baseline 2026-02）、SRI 完整性校验
- [沙箱与隔离防御](./guide-line/sandbox-isolation-defense) —— 渲染器沙箱、四层防御纵深、Spectre 与 CORB/ORB
- [iframe sandbox 与点击劫持](./guide-line/iframe-sandbox-clickjacking) —— sandbox token 全谱、组合逃逸、X-Frame-Options → frame-ancestors
- [安全上下文与混合内容](./guide-line/secure-contexts-mixed-content) —— isSecureContext 判定、强能力门控清单、可升级 vs 可阻断
- [能力与元数据防护](./guide-line/permissions-policy-fetch-metadata) —— Permissions Policy、Local Network Access、Fetch Metadata、安全响应头速查
- [参考](./reference) —— CSP 指令/sandbox 属性/门控 API/混合内容/Permissions Policy/安全响应头六张速查表 + 权威链接

## 文档地址

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP) —— CSP 指令体系与 strict CSP 指南
- [MDN: Trusted Types API](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API) —— DOM XSS sink 与策略工厂（Baseline 状态）
- [MDN: Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity) —— integrity 哈希与 Integrity-Policy
- [MDN: Mixed content](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content) —— 可升级/可阻断分类
- [MDN: Secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts) —— 安全上下文判定与门控特性清单
- [MDN: Permissions-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy) —— 指令与 allowlist 语法
- [Chromium: Site Isolation](https://www.chromium.org/Home/chromium-security/site-isolation/) —— 沙箱/CORB/Spectre 防御视角
- [MDN: Local network access](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Local_network_access) · [Chrome Blog: LNA](https://developer.chrome.com/blog/local-network-access) —— 内网访问权限化

## 幻灯片地址

<a href="/SlideStack/browser-security-slide/" target="_blank">浏览器安全</a>
