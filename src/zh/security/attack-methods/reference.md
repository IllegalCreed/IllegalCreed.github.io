---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 OWASP Cheat Sheet Series + MDN Web Docs + OWASP Top 10:2025 + RFC 6797 编写

## 速查

- 六类攻击：**XSS / CSRF / SQL 注入 / SSRF / DDoS / MITM**
- XSS 三类型：存储型 / 反射型 / DOM 型；三类 sink：HTML / JS / JS URL
- XSS 四件套：输出编码 + CSP nonce + Trusted Types + Sanitizer
- CSRF 三层：SameSite=Lax（默认）+ Token / Signed Double-Submit + Sec-Fetch-Site
- SQL 注入：参数化查询 / ORM 默认接口；raw 接口必须占位符
- SSRF 铁律：白名单 + 禁重定向 + IMDSv2 + 查 A/AAAA
- DDoS 分层：L7 应用速率限制 / L3-4 云清洗
- MITM：HSTS（max-age=31536000; includeSubDomains; preload）+ TLS
- OWASP Top 10:2025 现行版本（A01 Broken Access Control 仍 #1，A05 升至 #2）
- CSP nonce-based Strict CSP：`script-src 'nonce-{RANDOM}' 'strict-dynamic'; object-src 'none'; base-uri 'none'`
- 现代浏览器原生防御：Trusted Types（Baseline 2026）/ Sanitizer（Limited Availability）/ Sec-Fetch-Site（> 98%）/ SameSite=Lax 默认（Chrome 84+）
- 完整说明见 [入门](./getting-started.md) / [攻击方式与防御](./guide-line.md)

## 攻击-防护对照表

| 攻击 | OWASP | 机制 | 主防御 | 反模式 |
| --- | --- | --- | --- | --- |
| **XSS 存储型** | A03 | 持久化 DB，影响大量用户 | 输出编码 + CSP + Sanitizer + Trusted Types | `innerHTML = userInput` 未消毒 |
| **XSS 反射型** | A03 | 响应反射，钓鱼触发 | 输出编码 + CSP nonce | 含 `'unsafe-inline'` |
| **XSS DOM 型** | A03 | 纯客户端 sink，**WAF 挡不住** | Trusted Types + Sanitizer | 服务端 WAF 当主防御 |
| **CSRF** | A01 | 滥用浏览器自动带 Cookie | SameSite=Lax + Synchronizer Token / Signed Double-Submit + Sec-Fetch-Site | Naive Double-Submit、仅靠 Referer、CAPTCHA |
| **SQL 注入** | A03 | 拼接 SQL 改结构 | 参数化查询 / ORM 默认接口 | 字符串拼接、ORM raw 拼接 |
| **SSRF** | A10→主流 | 服务器发攻击者指定 URL | 白名单 + 禁重定向 + IMDSv2 | 仅黑名单、不禁重定向 |
| **DDoS L7** | Availability | 耗 CPU/内存/连接 | 速率限制 + 优雅降级 + Bulkhead | 仅靠 CDN 速率规则 |
| **DDoS L3/4** | Availability | 耗带宽饱和 | 云清洗 + Anycast | 单机防御 |
| **MITM** | A02 | 中间人窃听/篡改 | HSTS + TLS 证书链校验 | HTTP 响应下发 HSTS |

## CSP 指令速查表

| 指令 | 作用 | 推荐值 |
| --- | --- | --- |
| `default-src` | 默认加载策略 | `'self'` |
| `script-src` | 脚本来源 | `'nonce-{RANDOM}' 'strict-dynamic'` |
| `object-src` | `<object>` / `<embed>` | `'none'` |
| `base-uri` | `<base>` 限制 | `'none'` |
| `frame-ancestors` | 嵌套祖先（防 Clickjacking） | `'self'` 或 `'none'` |
| `frame-src` | `<frame>` / `<iframe>` 来源 | `'self'` |
| `img-src` | 图像来源 | `'self' data:` |
| `style-src` | 样式来源 | `'nonce-{RANDOM}'` |
| `connect-src` | XHR / WS / fetch | `'self'` |
| `font-src` | 字体来源 | `'self'` |
| `media-src` | 音视频来源 | `'self'` |
| `manifest-src` | manifest 来源 | `'self'` |
| `upgrade-insecure-requests` | 自动 HTTP → HTTPS | 启用 |
| `require-trusted-types-for 'script'` | 强制 Trusted Types | 启用 |
| `trusted-types` | 允许的 policy 名 | `policyName` 或 `'none'` |
| `report-to` | Reporting-API 上报端点 | 推荐用 |
| `report-uri` | （已废弃）上报 URL | 过渡保留 |

### CSP 关键字

| 关键字 | 含义 |
| --- | --- |
| `'self'` | 同源（协议 + 域名 + 端口） |
| `'none'` | 完全阻止 |
| `'nonce-{RANDOM}'` | 每响应重新生成的不重复 nonce |
| `'sha256-{HASH}'` | 内联脚本 / 样式 hash |
| `'strict-dynamic'` | 受信任脚本可加载子脚本 |
| `'unsafe-inline'` | 允许内联（**含 nonce/hash 时被忽略**） |
| `'unsafe-eval'` | 允许 `eval`（**等于没防 XSS**） |

### nonce-based Strict CSP 示例

```text
Content-Security-Policy:
  default-src 'self';
  script-src 'nonce-{RANDOM}' 'strict-dynamic';
  object-src 'none';
  base-uri 'none';
  frame-ancestors 'self';
  upgrade-insecure-requests;
  report-to csp-endpoint;
```

## 安全响应头表

| 头 | 作用 | 推荐值 |
| --- | --- | --- |
| **Content-Security-Policy** | XSS 防御 / 资源加载策略 | nonce-based Strict CSP |
| **Strict-Transport-Security** | 强制 HTTPS（防 MITM 降级） | `max-age=31536000; includeSubDomains; preload` |
| **X-Frame-Options** | 防 Clickjacking（旧） | `DENY` 或 `SAMEORIGIN`（被 CSP `frame-ancestors` 替代） |
| **X-Content-Type-Options** | 防 MIME 嗅探 | `nosniff` |
| **Referrer-Policy** | 控制 Referer 暴露 | `strict-origin-when-cross-origin` |
| **Permissions-Policy** | 控制浏览器 API 访问 | 按需（如 `geolocation=(), camera=()`） |
| **Cross-Origin-Opener-Policy** | 进程隔离（防 Spectre） | `same-origin` |
| **Cross-Origin-Embedder-Policy** | 跨域加载限制 | `require-corp` |
| **Cross-Origin-Resource-Policy** | 资源跨域加载 | `same-site` |

## Cookie 属性表

| 属性 | 作用 | 推荐值 |
| --- | --- | --- |
| **Secure** | 仅 HTTPS 传输 | 启用 |
| **HttpOnly** | 防 JS 读 Cookie（缓解 XSS 窃取） | 启用 |
| **SameSite** | CSRF 防御 | `Lax`（默认）/ `Strict`（高敏感）/ `None; Secure`（第三方） |
| **Path** | 作用域路径 | 最小化（`/` 仅在根需要时） |
| **Domain** | 作用域域名 | 不设（仅当前域）；子域共享才设 |
| **Max-Age / Expires** | 过期时间 | 会话 token 短期，长期 token 显式设 |
| **\_\_Host- 前缀** | 防子域 Cookie 注入 | 高敏感 Cookie 加前缀（要求 Path=/ Secure 无 Domain） |

## Trusted Types 三类 sink 表

| sink 类型 | 危险 API | 可信类型 | policy 方法 |
| --- | --- | --- | --- |
| **HTML sink** | `innerHTML` / `outerHTML` / `document.write` / `insertAdjacentHTML` | TrustedHTML | `createHTML` |
| **JS sink** | `eval` / `Function` / `setTimeout(string)` / `setInterval(string)` | TrustedScript | `createScript` |
| **JS URL sink** | `script.src` / `location.href` / `location.replace()` / `location.assign()` | TrustedScriptURL | `createScriptURL` |

## CSRF Token 模式对比表

| 模式 | 状态 | 存储 | 适用 | 风险 |
| --- | --- | --- | --- | --- |
| **Synchronizer Token** | 有状态 | 服务端会话 | 有会话存储（传统 Web） | 服务端需查会话 |
| **Signed Double-Submit HMAC** | 无状态 | HMAC 签名 Cookie + 请求头 | JWT / 微服务 / 无会话 | 必须用 Signed，Naive 易被绕过 |
| **Encrypted Token** | 有/无状态 | 服务端加密 | 高安全要求 | 实现复杂 |

## Sec-Fetch-Site 取值表

| 取值 | 含义 | CSRF 决策 |
| --- | --- | --- |
| `same-origin` | 同源 | 放行 |
| `same-site` | 同站不同源 | 视场景 |
| `cross-site` | 跨站 | **block** |
| `none` | 用户直发（地址栏 / 书签） | 放行 |

## SSRF 黑名单必阻 IP 表

| IP / 网段 | 用途 |
| --- | --- |
| `169.254.169.254` | AWS / Azure IMDS（云元数据） |
| `metadata.google.internal` | Google Cloud 元数据 |
| `127.0.0.0/8` | 本机回环 |
| `::1/128` | IPv6 本机 |
| `10.0.0.0/8` | RFC1918 A 类私网 |
| `172.16.0.0/12` | RFC1918 B 类私网 |
| `192.168.0.0/16` | RFC1918 C 类私网 |
| `224.0.0.0/4` | 多播 |
| `0.0.0.0/8` | 本机网络 |

> 黑名单只是兜底，主防御是**白名单**。

## OWASP Top 10:2025 现状

| 编号 | 类别 | 现状 |
| --- | --- | --- |
| **A01** | Broken Access Control | **仍居 #1** |
| **A02** | Cryptographic Failures | 含 MITM（TLS / HSTS） |
| **A03** | Injection | 含 XSS、SQL 注入 |
| **A05** | Security Misconfiguration | **升至 #2** |
| **A06** | Vulnerable and Outdated Components | 依赖安全篇 |
| **A07** | Identification and Authentication Failures | 会话/认证篇 |
| **A10** | SSRF（2021 社区补充） | **2025 已并入主流注入/访问控制讨论** |

> OWASP Top 10:2025 已发布为现行版本，2021 版归档仍可访问。引用 OWASP 时应优先用 2025 版编号。

## 现代浏览器原生防御版本

| 防御 | Baseline 状态 | 起始版本 |
| --- | --- | --- |
| CSP3（strict-dynamic / nonce / trusted-types） | Baseline widely available | 主流浏览器支持 |
| Trusted Types API | **MDN Baseline 2026** | 2026-02 起跨最新版主流浏览器可用（含 Web Workers） |
| Sanitizer API | **Limited Availability（不在 Baseline）** | 需 polyfill 或 DOMPurify 兜底 |
| SameSite=Lax 默认 | 主流共识 | Chrome 84（2020-07） |
| Sec-Fetch-Site | 覆盖率 > 98% | 主流浏览器支持 |
| HSTS | Baseline widely available | 主流浏览器支持（2015-07 起） |

## 官方资源

- OWASP Cheat Sheet Series：[https://cheatsheetseries.owasp.org/](https://cheatsheetseries.owasp.org/)
- MDN Web Security：[https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- OWASP Top 10：[https://owasp.org/Top10/](https://owasp.org/Top10/)
- OWASP 攻击百科：[https://owasp.org/www-community/attacks/](https://owasp.org/www-community/attacks/)
- RFC 6797 HSTS：[https://datatracker.ietf.org/doc/html/rfc6797](https://datatracker.ietf.org/doc/html/rfc6797)
- Trusted Types MDN：[https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API)
- Sanitizer API MDN：[https://developer.mozilla.org/en-US/docs/Web/API/Sanitizer](https://developer.mozilla.org/en-US/docs/Web/API/Sanitizer)
- Set-Cookie SameSite MDN：[https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- Sec-Fetch-Site MDN：[https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-Fetch-Site](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-Fetch-Site)
- HSTS preload：[https://hstspreload.org/](https://hstspreload.org/)
- GitHub：[OWASP/CheatSheetSeries](https://github.com/OWASP/CheatSheetSeries) · [chromium/hstspreload.org](https://github.com/chromium/hstspreload.org)
