---
layout: doc
---

# 攻击方式

「攻击方式」是 Web 安全的攻防对应面：从 OWASP Top 10:2025 视角，系统梳理**应用层最常见的六类攻击机制**——XSS（跨站脚本）、CSRF（跨站请求伪造）、SQL 注入、SSRF（服务端请求伪造）、DDoS（分布式拒绝服务）、MITM（中间人），并给每类攻击配上**官方权威的防御手段**。本篇不展开认证授权、加密算法、依赖供应链等独立类别，只聚焦「攻击如何发生 + 对应如何防」这一对应关系。XSS 部分会同时讲清三类（存储型 / 反射型 / DOM 型）的区分依据与三类 DOM 注入 sink（HTML / JS / JS URL），并覆盖现代浏览器原生防御——Trusted Types API（CSP `require-trusted-types-for`）、Sanitizer API（`setHTML` vs `setHTMLUnsafe`）、CSP nonce-based Strict CSP。CSRF 部分会讲清 SameSite=Lax 默认行为的边界、Synchronizer Token vs Signed Double-Submit 的选择依据，以及 Sec-Fetch-Site（Fetch Metadata）这一现代化兜底。SQL 注入部分会讲清参数化查询的本质与 ORM raw 接口的安全边界。SSRF 部分会讲清「白名单 + 禁重定向」这条铁律与 IMDSv2。DDoS 部分会分层——L7 应用层交给应用自身速率限制 + 优雅降级，L3/4 网络层交给云清洗。MITM 部分会讲 HSTS 的两层机制与 preload 列表。OWASP Top 10:2025 已发布为现行版本，关键变化：Broken Access Control 仍居 #1、Security Misconfiguration 升至 #2、SSRF 正式并入主流注入/访问控制讨论、Injection（含 XSS / SQLi）仍是 A03。

## 评价

**优点（现代浏览器原生防御的进步）**

- **CSP3 + Trusted Types**：浏览器原生阻断未授权脚本与 DOM sink 注入，从源头消灭 DOM 型 XSS
- **Sanitizer API**：浏览器原生 HTML 消毒，配合 `setHTML` 自动安全处理富文本，告别第三方库依赖
- **SameSite=Lax 默认**：Chrome 84 起，未显式设置即默认 Lax，被动缓解了一大批 CSRF
- **Sec-Fetch-Site（Fetch Metadata）**：浏览器自动发送、JS 无法伪造，覆盖率 > 98%，是现代化 CSRF 兜底
- **HSTS + preload**：堵上「首次访问前 HSTS 不生效」的漏洞，让 HTTPS 强制成出厂内置

**缺点（攻击面的演进）**

- **XSS 与 CSRF 不是独立问题**：XSS 可读取 CSRF Token 使所有 CSRF 防护失效——OWASP 反复强调 XSS 防御是 CSRF 防御的前提
- **DOM 型 XSS 服务端挡不住**：载荷不经过服务器响应，WAF 看不到，必须靠前端 sink 防护与 Trusted Types
- **CSP allowlist 难维护**：仅集成 Google Analytics 就要加 187 个域名，应改用 nonce-based Strict CSP
- **SSRF 黑名单易绕过**：十进制 IP、DNS Rebinding、HTTP 重定向都能绕过入口校验，必须白名单 + 禁重定向
- **DDoS 应用层攻击不耗带宽**：WAF / CDN 速率规则只能识别已知模式，必须靠应用自身设计（高消耗验证后置、Bulkhead 隔离）

## 文档地址

- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) — XSS / CSRF / SQL Injection / SSRF / Injection Prevention / Denial of Service 权威速查
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) — Content Security Policy / Trusted Types / Sanitizer API / Set-Cookie SameSite / Strict-Transport-Security
- [OWASP Top 10](https://owasp.org/Top10/) — 现行 2025 版 + 2021 归档
- [RFC 6797 — HSTS](https://datatracker.ietf.org/doc/html/rfc6797)
- [OWASP 攻击百科](https://owasp.org/www-community/attacks/) — XSS / CSRF 攻击定义页

## GitHub 地址

- [OWASP/CheatSheetSeries](https://github.com/OWASP/CheatSheetSeries)
- [hstspreload.org](https://github.com/chromium/hstspreload.org) — HSTS preload 列表

## 幻灯片地址

<a href="/SlideStack/attack-methods-slide/" target="_blank">攻击方式</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=709" target="_blank" rel="noopener noreferrer">攻击方式 测试题</a>

## 相关章节

- **认证与会话管理**：JWT 安全、Session 固定、密码哈希（对应 OWASP A07）
- **加密与数据保护**：TLS 配置、密钥管理、哈希算法选型（对应 OWASP A02）
- **依赖与供应链**：SBOM、依赖扫描、Renovate（对应 OWASP A06）
- **访问控制**：IDOR、垂直/水平越权（对应 OWASP A01）

## 参考

- OWASP Top 10:2025 现行版本
- Trusted Types API：MDN Baseline 2026（2026-02 起跨最新版主流浏览器可用）
- Sanitizer API：MDN 标注「Limited Availability，不在 Baseline」，生产环境常用 DOMPurify 兜底
- SameSite=Lax 默认：自 Chrome 84（2020）起为现代浏览器共识
- HSTS：Baseline widely available，自 2015-07 起主流浏览器支持；RFC 6797（2012）
- CSP Level 3：strict-dynamic、nonce、report-to（Reporting API）、trusted-types、require-trusted-types-for
