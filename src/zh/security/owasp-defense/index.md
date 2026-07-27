---
layout: doc
---

# OWASP Top 10 与前端防护（CSP / HTTP 安全头 / Helmet / CORS）

「OWASP Top 10 与前端防护」是 Web 安全体系里**前端可控、可消费**的那一层：以 OWASP Top 10:2025（现行版本，2021 版归档）为风险地图，落到前端能直接落地的四类防护——**CSP**（Content-Security-Policy，内容安全策略）、**HTTP 安全响应头**（X-Frame-Options / X-Content-Type-Options / Strict-Transport-Security / Referrer-Policy / Permissions-Policy）、**Helmet.js**（Node.js 设置安全头的中间件，默认开 13 个头）、**CORS**（跨域资源共享）。本叶不展开服务端鉴权与会话实现细节（JWT / Session 的服务端代码）、SQL 注入与 SSRF 的服务端防御（参数化查询、出网白名单）、Web3 / 移动端 / 桌面专属安全、CSP Trusted Types 的深度策略实现、HSTS preload 撤销的运维流程。OWASP Top 10 范围内：A03 Injection 把 XSS 合并进来（2017 版 XSS 是独立 A7），A01 Broken Access Control 升至 #1，A04 Insecure Design / A08 Software and Data Integrity Failures / A10 SSRF 是 2021 起新增类别——这些是前端做防护时的「风险来源图」。前端防护的核心理念是「**纵深防御 + 默认安全**」：CSP 用 nonce + `strict-dynamic` 而非域名白名单（白名单仅集成 Google Analytics 就要加约 187 个域名，难以维护且易包含不安全域），HTTP 安全头各自管一个面（X-Frame-Options 防 clickjacking、HSTS 防 SSL Strip 降级、Referrer-Policy 防 Referrer 泄露、Permissions-Policy 收回浏览器能力），Helmet 把这套默认值打包成 Node.js 中间件（默认主动禁用废弃的 X-XSS-Protection，改由 CSP 接管），CORS 是浏览器同源策略的「受控放宽」——带凭证（Cookie）时禁用所有 `*` 通配符，否则浏览器直接拒绝响应。

## 评价

**优点（现代化前端防护的成熟度）**

- **CSP3 + nonce + strict-dynamic**：从源头阻断未授权脚本执行，是现代 XSS 防御的主力；Report-Only 模式可灰度上线
- **HTTP 安全头分工清晰**：每个头一个面，配 Helmet 一行 `app.use(helmet())` 即开默认 13 个
- **HSTS + preload**：堵上「首次访问前 HSTS 不生效」的窗口期，让 HTTPS 强制成出厂内置
- **CORS 凭证约束**：浏览器原生强制 `Access-Control-Allow-Credentials: true` 时禁用 `*`，从协议层挡住松散配置
- **Permissions-Policy**：收回摄像头 / 麦克风 / 地理位置 / 全屏等浏览器能力，最小化攻击面

**缺点（前端防护的边界与陷阱）**

- **CSP 白名单难维护**：仅集成 Google Analytics 就要加 187 个域名，应改用 nonce + strict-dynamic
- **CSP 一旦过严直接断功能**：enforcing 模式会阻断合法脚本 / 样式，上线前必须先用 Report-Only 收集违规
- **X-Frame-Options 与 CSP frame-ancestors 并存**：现代浏览器 frame-ancestors 优先，老浏览器看 X-Frame-Options，二者要并存而非互斥
- **CSRF 不能依赖 CORS**：简单请求（GET / HEAD / POST + 安全列表头 + 三种基础 Content-Type）不触发 preflight，CORS 拦不住表单提交的 CSRF
- **HTTP 头不是万能**：CSP 防 XSS 但不防 CSRF，HSTS 防降级但不防应用层逻辑漏洞——前端防护是纵深防御的一层，不是全部

## 文档地址

- [OWASP Top 10](https://owasp.org/Top10/) — 现行 2025 版 + 2021 归档（A03 Injection 含 XSS、A01 Broken Access Control #1）
- [MDN - Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) — CSP Level 3 完整指令参考
- [MDN - CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) — 跨域资源共享完整语义
- [MDN - HTTP Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/) — X-Frame-Options / Strict-Transport-Security / Referrer-Policy / Permissions-Policy 单页
- [Helmet.js 官方站](https://helmet.js.org/) — 默认 13 个头与默认 CSP directives

## GitHub 地址

- [OWASP/Top10](https://github.com/OWASP/Top10) — OWASP Top 10 官方仓库
- [helmet](https://github.com/helmetjs/helmet) — Helmet.js 源码
- [hstspreload.org](https://github.com/chromium/hstspreload.org) — HSTS preload 列表

## 幻灯片地址

<a href="/SlideStack/owasp-defense-slide/" target="_blank">OWASP Top 10 与前端防护</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=711" target="_blank" rel="noopener noreferrer">OWASP Top 10 与前端防护 测试题</a>

## 相关章节

- **攻击方式**：XSS / CSRF / SQL 注入 / SSRF / DDoS / MITM 的攻击机制与对应防御
- **认证与会话管理**：JWT 安全、Session 固定、密码哈希（对应 OWASP A07）
- **加密与数据保护**：TLS 配置、密钥管理、哈希算法选型（对应 OWASP A02）
- **访问控制**：IDOR、垂直 / 水平越权（对应 OWASP A01）

## 参考

- OWASP Top 10：2025 现行版本（A01 Broken Access Control #1、A03 Injection 含 XSS）；2021 归档版本
- CSP：当前为 CSP Level 3（W3C Working Draft），主流浏览器已支持 nonce、`strict-dynamic`、Reporting API；`report-uri` 已废弃、迁移到 `report-to`
- Permissions-Policy：取代旧 Feature-Policy（已废弃），仍在演进
- X-Frame-Options ALLOW-FROM 与 X-XSS-Protection 均已废弃
- Helmet：当前 v8.x（默认 13 个头，Cross-Origin-Opener/Resource-Policy、Origin-Agent-Cluster；Cross-Origin-Embedder-Policy 默认不开）
- HSTS：RFC 6797（2012），Baseline widely available，仅 HTTPS 响应生效
