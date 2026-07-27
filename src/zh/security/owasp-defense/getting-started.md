---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 OWASP Top 10 官方站（owasp.org/Top10）+ MDN Web Docs（CSP / CORS / HTTP Headers）+ Helmet.js 官方站（helmet.js.org）编写，对照 OWASP Top 10:2025 现行版本与 Helmet v8.x

## 速查

- **OWASP Top 10:2025 关键变更**：A01 Broken Access Control 居 #1；A03 Injection 含 XSS（2017 版 XSS 是独立 A7）；2021 起新增 A04 Insecure Design / A08 Software and Data Integrity Failures / A10 SSRF
- **前端防护四件套**：CSP（防 XSS）+ HTTP 安全头（防 clickjacking / MIME 嗅探 / 降级 / Referrer 泄露 / 浏览器能力滥用）+ Helmet.js（Node.js 默认 13 个头）+ CORS（跨域受控放宽）
- **CSP 关键源**：`'self'`（同源）、`'nonce-<随机>'`（每响应唯一）、`'strict-dynamic'`（被信任的脚本可加载子脚本）、`'sha256-<hash>'`（按内容哈希）、`'unsafe-inline'`（有 nonce/hash 时被忽略）
- **CSP 上线**：先 Report-Only 收集违规报告，再切 enforcing；Report-Only 不支持 `<meta>` 声明
- **HTTP 安全头五个核心**：X-Frame-Options（DENY / SAMEORIGIN）、X-Content-Type-Options: nosniff、Strict-Transport-Security（max-age + includeSubDomains + preload）、Referrer-Policy（默认 strict-origin-when-cross-origin）、Permissions-Policy（旧名 Feature-Policy 已废弃）
- **HSTS preload 注册前提**：max-age ≥ 31536000 且必须含 includeSubDomains；仅 HTTPS 响应生效
- **Helmet 默认开 13 个头**：含 CSP / HSTS / X-Content-Type-Options / X-Frame-Options / Referrer-Policy / Cross-Origin-Opener-Policy 等；默认把 X-XSS-Protection 设为 0（废弃机制，改由 CSP 接管）
- **CORS 凭证约束**：`Access-Control-Allow-Credentials: true` 时，Allow-Origin / Headers / Methods / Expose-Headers 任一用 `*` 浏览器直接拒绝响应
- **CORS preflight 触发**：方法不在 GET/HEAD/POST、或用了非安全列表头、或 Content-Type 不是三种基础类型（`application/x-www-form-urlencoded` / `multipart/form-data` / `text/plain`）任一不满足即触发 OPTIONS preflight
- **核心反模式**：CSP 用 `'unsafe-inline'` / `'unsafe-eval'`、HTTP 头写在 `<meta>` 里、HSTS 写在 HTTP 响应、`Allow-Origin: *` 配 `Allow-Credentials: true`、CSRF 防护依赖 CORS

## 这篇叶定位

「OWASP Top 10 与前端防护」是 Web 安全的**前端纵深防御层**：

- **风险地图**用 OWASP Top 10:2025——A01 Broken Access Control、A03 Injection（含 XSS）、A05 Security Misconfiguration、A07 Identification and Authentication Failures 等是前端代码与配置最常踩的面
- **可落地的四件套**：CSP / HTTP 安全头 / Helmet.js / CORS——纯前端可控，不依赖服务端业务逻辑改造
- **不展开**：服务端鉴权实现、SQL 注入的 PreparedStatement、SSRF 出网白名单、CSRF Token 实现细节（详见「攻击方式」叶）

> 前端防护 ≠ 全部安全。它是纵深防御的一层——CSP 防 XSS 但不防 CSRF，HSTS 防降级但不防应用层逻辑漏洞，CORS 是浏览器同源策略的「受控放宽」不是鉴权。

## OWASP Top 10 速览

OWASP Top 10 是 OWASP 基金会发布的「Web 应用十大安全风险」，每 3-4 年一版，2025 版是当前现行版本（2021 版归档）。它是业界风险地图的事实标准。

| 编号 | 名称（2025） | 前端相关性 |
| --- | --- | --- |
| **A01** | Broken Access Control（访问控制失效） | **高**：IDOR、垂直 / 水平越权、前端隐藏按钮 ≠ 鉴权 |
| **A02** | Cryptographic Failures（加密失效） | 中：TLS 配置、混合内容、密钥前端泄露 |
| **A03** | Injection（注入，含 **XSS**） | **高**：XSS 是前端最直接的注入面（存储型 / 反射型 / DOM 型） |
| **A04** | Insecure Design（不安全设计） | 中：威胁建模缺失、默认不安全 |
| **A05** | Security Misconfiguration（安全配置错误） | **高**：CSP 缺失 / 过松、默认凭证、目录列表、错误信息泄露 |
| **A06** | Vulnerable and Outdated Components（脆弱依赖） | 中：npm 依赖漏洞、SBOM |
| **A07** | Identification and Authentication Failures（认证失效） | 中：会话固定、暴力破解、JWT 前端存储 |
| **A08** | Software and Data Integrity Failures（软件数据完整性失效） | 中：CI/CD 注入、未签名依赖、CSP Integrity 缺失 |
| **A09** | Security Logging and Monitoring Failures | 低：日志主要在服务端 |
| **A10** | Server-Side Request Forgery（SSRF） | 低：纯服务端出网控制（前端不可控） |

> 关键变更（2017 → 2021 → 2025）：A01 Broken Access Control 从 #5 升到 #1（2021 起）；XSS 从独立 A7 合并进 A03 Injection；A04 Insecure Design / A08 Software and Data Integrity Failures / A10 SSRF 是 2021 起新增类别。

## 前端防护四件套速览

### CSP（Content-Security-Policy）

防 XSS 的主力——通过白名单 / nonce / hash 限制脚本、样式、图像等资源的合法来源，浏览器拒绝执行未授权内容。

- **关键头**：`Content-Security-Policy`（enforcing，违反则阻止）与 `Content-Security-Policy-Report-Only`（仅上报不阻止）
- **现代推荐**：`nonce + 'strict-dynamic'`，不要维护庞大的域名白名单
- **核心指令**：`default-src`（回退）、`script-src`、`style-src`、`img-src`、`connect-src`、`object-src`（建议 `'none'`）、`frame-ancestors`（防 clickjacking）、`base-uri`、`form-action`
- **上报**：`report-uri` 已废弃，迁移到 `report-to` + `Reporting-Endpoints` 响应头

### HTTP 安全响应头（五个核心）

| 头 | 作用 | 典型值 |
| --- | --- | --- |
| `X-Frame-Options` | 防 clickjacking | `DENY` / `SAMEORIGIN`（`ALLOW-FROM` 已废弃） |
| `X-Content-Type-Options` | 阻止 MIME 嗅探 | `nosniff` |
| `Strict-Transport-Security` | 强制 HTTPS（防 SSL Strip） | `max-age=31536000; includeSubDomains; preload` |
| `Referrer-Policy` | 控制 Referrer 泄露 | `strict-origin-when-cross-origin`（浏览器默认） |
| `Permissions-Policy` | 收回浏览器能力 | `camera=(), microphone=(), geolocation=(self)` |

### Helmet.js（Node.js）

Express / Connect / Hapi / Koa 都有适配的安全头中间件。`app.use(helmet())` 默认开 13 个头：

- 含上述五个 + Cross-Origin-Opener-Policy / Cross-Origin-Resource-Policy / Origin-Agent-Cluster / X-DNS-Prefetch-Control: off / X-Download-Options / X-Permitted-Cross-Domain-Policies: none / 移除 X-Powered-By
- **关键**：默认把 `X-XSS-Protection` 设为 `0`（废弃的 XSS Auditor 已有缺陷且能引入新漏洞，现代替代是 CSP）
- 默认 **不含 CORS**——CORS 需独立 `npm install cors` 并按白名单校验 Origin 回显

### CORS（Cross-Origin Resource Sharing）

浏览器同源策略的「受控放宽」机制。跨域请求由浏览器自动附加 `Origin` 头，服务端用 `Access-Control-Allow-*` 系列响应头授权。

- **简单请求 vs 预检**：方法在 GET/HEAD/POST、仅用安全列表头、Content-Type 为三种基础类型——三者同时满足才简单请求；任一不满足触发 OPTIONS preflight
- **凭证请求与通配符互斥**：`Access-Control-Allow-Credentials: true` 时，`Allow-Origin` / `Allow-Headers` / `Allow-Methods` / `Expose-Headers` 任一用 `*` 浏览器直接拒绝响应
- **Origin 必须精确回显**：且响应应配 `Vary: Origin` 防缓存污染

## 下一步

- [核心策略详解](./guide-line.md)：OWASP Top 10 前端映射 + CSP（nonce / self / strict-dynamic / report-to）+ HTTP 安全头 + Helmet.js + CORS + 反模式
- [参考](./reference.md)：OWASP Top 10 完整表、安全头速查表、CSP 指令表、CORS 表、官方资源链接
