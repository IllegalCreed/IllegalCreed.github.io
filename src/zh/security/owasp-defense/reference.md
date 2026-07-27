---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 OWASP Top 10 官方站（owasp.org/Top10）+ MDN Web Docs + Helmet.js 官方站编写，对照 OWASP Top 10:2025 与 Helmet v8.x

## 速查

- **前端防护四件套**：CSP / HTTP 安全头 / Helmet.js / CORS
- **OWASP Top 10:2025 关键变更**：A01 Broken Access Control 居 #1；A03 Injection 含 XSS（2017 是独立 A7）；2021 起新增 A04 / A08 / A10
- **CSP 现代姿势**：`nonce + 'strict-dynamic'`，弃用域名白名单
- **CSP 两种模式**：enforcing（违反则阻止）/ Report-Only（仅上报）；后者不支持 `<meta>`
- **CSP frame-ancestors vs X-Frame-Options**：并存时 frame-ancestors 优先
- **HSTS preload 前提**：max-age ≥ 31536000 + 必须含 includeSubDomains；仅 HTTPS 响应生效
- **Referrer-Policy 默认值**：`strict-origin-when-cross-origin`
- **Permissions-Policy allowlist**：`()`（全禁用）/ `(self)`（仅同源）/ `*`（全允许）/ `(self "https://a.com")`
- **Helmet 默认 13 头**：含 X-XSS-Protection=0；不含 CORS
- **CORS 凭证互斥**：`Allow-Credentials: true` 时禁用所有 `*`
- **CORS preflight 触发**：方法 / 头 / Content-Type 三条件任一不满足
- **核心反模式**：CSP `'unsafe-inline'` / `'unsafe-eval'`、HTTP 头写 `<meta>`、HSTS 写 HTTP、CSRF 依赖 CORS
- 完整说明见 [入门](./getting-started.md) / [核心策略详解](./guide-line.md)

## OWASP Top 10:2025 完整表

| 编号 | 名称 | 前端相关性 | 典型前端落点 |
| --- | --- | --- | --- |
| **A01** | Broken Access Control | 高 | 前端隐藏 ≠ 鉴权；IDOR；JWT 不存 localStorage |
| **A02** | Cryptographic Failures | 中 | 全站 HTTPS；HSTS；密钥前端不硬编码 |
| **A03** | Injection（含 XSS） | 高 | **CSP**；输出转义；Trusted Types；避免 `innerHTML` / `eval` |
| **A04** | Insecure Design | 中 | 威胁建模；Default Deny；最小权限 |
| **A05** | Security Misconfiguration | 高 | **Helmet 默认全套**；CSP 不为空；错误页不泄露栈 |
| **A06** | Vulnerable and Outdated Components | 中 | `npm audit` / Renovate / Snyk；SRI |
| **A07** | Identification and Authentication Failures | 中 | 会话超时；SameSite Cookie；JWT 短期 |
| **A08** | Software and Data Integrity Failures | 中 | 子资源完整性；签名依赖；CI 凭证隔离 |
| **A09** | Security Logging and Monitoring Failures | 低 | CSP 违规上报 |
| **A10** | Server-Side Request Forgery（SSRF） | 低 | 服务端出网白名单 + 禁重定向 + IMDSv2 |

> 关键变更（2017 → 2021 → 2025）：A01 从 #5 升到 #1（2021 起）；XSS 从独立 A7 合并进 A03；A04 / A08 / A10 是 2021 起新增类别。

## HTTP 安全响应头速查表

| 头 | 作用 | 典型值 | 备注 |
| --- | --- | --- | --- |
| `Content-Security-Policy` | 内容白名单（防 XSS） | 见下文 CSP 指令表 | 与 Report-Only 可共存 |
| `Content-Security-Policy-Report-Only` | 仅上报不阻止 | 同 CSP | 不支持 `<meta>` |
| `X-Frame-Options` | 防 clickjacking | `DENY` / `SAMEORIGIN` | `ALLOW-FROM` 已废弃；与 frame-ancestors 并存时后者优先 |
| `X-Content-Type-Options` | 阻止 MIME 嗅探 | `nosniff` | 仅作用于 script / style |
| `Strict-Transport-Security` | 强制 HTTPS（防 SSL Strip） | `max-age=31536000; includeSubDomains; preload` | 仅 HTTPS 响应生效 |
| `Referrer-Policy` | 控制 Referrer 泄露 | `strict-origin-when-cross-origin`（浏览器默认） | 8 个值见下 |
| `Permissions-Policy` | 收回浏览器能力 | `camera=(), microphone=()` | 旧名 Feature-Policy 已废弃 |
| `Cross-Origin-Opener-Policy` | 隔离顶级浏览上下文 | `same-origin` | Helmet 默认开 |
| `Cross-Origin-Resource-Policy` | 限制资源可被谁加载 | `same-origin` | Helmet 默认开 |
| `Cross-Origin-Embedder-Policy` | 限制可加载的跨域资源 | `require-corp` | Helmet 默认不开 |
| `X-XSS-Protection` | **已废弃**，应设为 `0` 关闭 | `0` | Helmet 默认 `0`；现代替代是 CSP |

### Referrer-Policy 八值

| 值 | 同源 | 跨源 | HTTPS→HTTP 降级 |
| --- | --- | --- | --- |
| `no-referrer` | 不发 | 不发 | 不发 |
| `no-referrer-when-downgrade` | 完整 URL | 完整 URL | 不发 |
| `same-origin` | 完整 URL | 不发 | 不发 |
| `origin` | origin | origin | origin |
| `strict-origin` | origin | origin | 不发 |
| `origin-when-cross-origin` | 完整 URL | origin | origin |
| **`strict-origin-when-cross-origin`**（默认） | 完整 URL | origin | 不发 |
| `unsafe-url` | 完整 URL | 完整 URL | 完整 URL（**危险**） |

### HSTS preload 注册前提

| 条件 | 要求 |
| --- | --- |
| `max-age` | ≥ 31536000（1 年） |
| `includeSubDomains` | **必须**含 |
| HTTPS 全站 | 所有子域都通过 HTTPS 提供服务 |
| 提交 | 到 [hstspreload.org](https://hstspreload.org) 注册，加入浏览器源码列表 |

## CSP 指令表

| 指令 | 作用 | 典型值 | 备注 |
| --- | --- | --- | --- |
| `default-src` | 回退策略 | `'self'` | 其他指令未设时用 |
| `script-src` | JS 来源 | `'self' 'nonce-<r> 'strict-dynamic'` | 现代姿势 |
| `style-src` | CSS 来源 | `'self' 'nonce-<r>'` | Helmet 默认含 `'unsafe-inline'` |
| `img-src` | 图像来源 | `'self' data: https:` | - |
| `connect-src` | fetch / XHR / WS | `'self' https://api.example.com` | 限制 API 域 |
| `font-src` | 字体来源 | `'self' https: data:` | - |
| `media-src` | 音视频来源 | `'self'` | - |
| `object-src` | `<object>` / `<embed>` | `'none'` | Flash 类已废弃 |
| `frame-src` | 本页可嵌入的 iframe | `'self'` | - |
| `child-src` | Workers / iframe | `'self'` | - |
| `frame-ancestors` | 谁可嵌入本页 | `'self'` | **不能用 nonce/hash** |
| `base-uri` | `<base>` 限制 | `'self'` | 防 base 注入 |
| `form-action` | 表单提交目标 | `'self'` | 防表单外发 |
| `plugin-types` | 已废弃 | - | CSP3 移除 |
| `report-uri` | **已废弃** | - | 迁移到 `report-to` |
| `report-to` | 违规上报端点 | `default-endpoint` | 配合 `Reporting-Endpoints` 响应头 |
| `require-trusted-types-for` | 强制 Trusted Types | `'script'` | 防 DOM sink XSS |
| `trusted-types` | 允许的 TT 策略 | `default` / `none` | 配合 require-trusted-types-for |
| `upgrade-insecure-requests` | 自动升级 HTTP→HTTPS | （无值） | Helmet 默认开 |

### script-src 源语义

| 源 | 含义 | 注意 |
| --- | --- | --- |
| `'self'` | 同源 | 基础兜底 |
| `'nonce-<随机值>'` | 每响应唯一 | **每响应重新生成**，不可复用 |
| `'strict-dynamic'` | 信任链传递 | 配合 nonce / hash 用 |
| `'sha256-<hash>'` | 按内容 hash | 内容一变就失效 |
| `'unsafe-inline'` | 放行内联 | **有 nonce/hash 时被忽略** |
| `'unsafe-eval'` | 放行 eval | 基本等于没设 CSP |
| `'unsafe-hashes'` | 允许按 hash 匹配内联事件 | 配合 hash 用 |
| `https:` | 任意 HTTPS | 范围过大 |
| `data:` | data URI | 慎用 |
| `*` | 任意来源 | 慎用 |

## CORS 头表

### 请求头

| 头 | 出现位置 | 作用 |
| --- | --- | --- |
| `Origin` | 所有 CORS 请求 | 标识发起方 origin（scheme + host + port） |
| `Access-Control-Request-Method` | 仅 preflight | 询问实际方法是否允许 |
| `Access-Control-Request-Headers` | 仅 preflight | 询问自定义头是否允许 |

### 响应头

| 头 | 出现位置 | 作用 | 通配符规则 |
| --- | --- | --- | --- |
| `Access-Control-Allow-Origin` | 所有 CORS 响应 | 允许的 origin | 单一值或 `*`；**带凭证时禁用 `*`** |
| `Access-Control-Allow-Methods` | preflight 响应 | 允许的方法 | 带凭证时禁用 `*` |
| `Access-Control-Allow-Headers` | preflight 响应 | 允许的自定义头 | 带凭证时禁用 `*` |
| `Access-Control-Expose-Headers` | 实际响应 | 白名单自定义头给 JS 读 | 带凭证时禁用 `*` |
| `Access-Control-Allow-Credentials` | 实际响应 | 允许带 Cookie / Authorization | 唯一值 `true` |
| `Access-Control-Max-Age` | preflight 响应 | preflight 缓存秒数 | 默认 5（浏览器上限不同：Chrome 7200 / Firefox 86400） |

### 简单请求 vs 预检请求

| 维度 | 简单请求 | 预检请求 |
| --- | --- | --- |
| 触发条件 | 方法在 GET/HEAD/POST + 仅安全列表头 + Content-Type 三种基础类型 | 任一不满足 |
| 流程 | 直接发请求 | 先发 OPTIONS，通过后再发实际请求 |
| 缓存 | 不缓存 | `Access-Control-Max-Age` 缓存 preflight 结果 |

### CORS 凭证请求铁律

当 `Access-Control-Allow-Credentials: true` 时：

| 头 | 是否禁用 `*` |
| --- | --- |
| `Access-Control-Allow-Origin` | **禁用**（必须精确回显 Origin） |
| `Access-Control-Allow-Headers` | **禁用** |
| `Access-Control-Allow-Methods` | **禁用** |
| `Access-Control-Expose-Headers` | **禁用** |

否则浏览器直接拒绝响应，前端拿不到数据，`Set-Cookie` 不写入。

> 同时响应应配 `Vary: Origin` 防 CDN 缓存污染。

## Helmet.js 默认 13 个头

| 头 | Helmet 默认值 |
| --- | --- |
| Content-Security-Policy | 默认 directives（见入门） |
| Cross-Origin-Embedder-Policy | **不开**（需要时显式开） |
| Cross-Origin-Opener-Policy | `same-origin` |
| Cross-Origin-Resource-Policy | `same-origin` |
| Origin-Agent-Cluster | `?1` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Strict-Transport-Security | `max-age=15552000; includeSubDomains`（180 天） |
| X-Content-Type-Options | `nosniff` |
| X-DNS-Prefetch-Control | `off` |
| X-Download-Options | `noopen` |
| X-Frame-Options | `SAMEORIGIN` |
| X-Permitted-Cross-Domain-Policies | `none` |
| **X-XSS-Protection** | **`0`（主动禁用废弃机制）** |
| （移除） | `X-Powered-By` |

### Helmet 自定义示例

```ts
import helmet from "helmet";
import express from "express";

const app = express();

// 默认全套
app.use(helmet());

// 关闭单个
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

// 自定义 CSP
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "script-src": ["'self'", "script.example.com"],
      "style-src": ["'self'"],
    },
  }),
);
```

## 废弃 / 已下线机制速查

| 机制 | 状态 | 现代替代 |
| --- | --- | --- |
| `X-Frame-Options: ALLOW-FROM origin` | 已废弃，现代浏览器忽略整个头 | CSP `frame-ancestors` |
| `X-XSS-Protection` | 废弃（XSS Auditor 有缺陷） | CSP（Helmet 主动设为 `0`） |
| `Feature-Policy` | 已废弃，更名 Permissions-Policy | `Permissions-Policy` |
| CSP `report-uri` | 已废弃（仍兼容） | `report-to` + `Reporting-Endpoints` |
| CSP `plugin-types` | CSP3 移除 | 用 `object-src 'none'` |
| CORS `Access-Control-Allow-Origin: *` + `Allow-Credentials: true` | 浏览器拒绝响应 | 凭证请求精确回显 Origin |

## 官方资源

- OWASP Top 10：[https://owasp.org/Top10/](https://owasp.org/Top10/)（现行 2025 版 + 2021 归档）
- OWASP Cheat Sheet Series：[https://cheatsheetseries.owasp.org/](https://cheatsheetseries.owasp.org/)（XSS / CSRF / Injection Prevention / Content Security Policy 速查）
- MDN CSP：[https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- MDN CORS：[https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- MDN HTTP Headers：[https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/)
- Helmet.js：[https://helmet.js.org/](https://helmet.js.org/)
- Helmet.js GitHub：[https://github.com/helmetjs/helmet](https://github.com/helmetjs/helmet)
- HSTS preload：[https://hstspreload.org/](https://hstspreload.org/)
- RFC 6797（HSTS）：[https://datatracker.ietf.org/doc/html/rfc6797](https://datatracker.ietf.org/doc/html/rfc6797)
- W3C CSP Level 3：[https://www.w3.org/TR/CSP3/](https://www.w3.org/TR/CSP3/)
- Fetch Metadata Request Headers（Sec-Fetch-Site）：[https://www.w3.org/TR/fetch-metadata/](https://www.w3.org/TR/fetch-metadata/)
- Reporting API（report-to）：[https://www.w3.org/TR/reporting-1/](https://www.w3.org/TR/reporting-1/)
