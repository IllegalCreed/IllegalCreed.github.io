---
layout: doc
outline: [2, 3]
---

# 核心策略详解

> 基于 OWASP Top 10 官方站（owasp.org/Top10）+ MDN Web Docs（CSP / CORS / HTTP Headers）+ Helmet.js 官方站（helmet.js.org）编写，对照 OWASP Top 10:2025 与 Helmet v8.x

## 速查

- **OWASP Top 10:2025 前端高相关**：A01 Broken Access Control #1、A03 Injection（含 XSS）、A05 Security Misconfiguration（CSP 缺失 / 过松）
- **CSP 现代姿势**：`nonce + 'strict-dynamic'`，弃用域名白名单（仅集成 GA 就要加约 187 个域）
- **CSP 关键源语义**：`'self'`（同源）、`'nonce-<随机>'`（每响应唯一）、`'strict-dynamic'`（信任链传递）、`'sha256-<hash>'`（按内容哈希）、`'unsafe-inline'`（有 nonce/hash 时被忽略）、`'unsafe-eval'`（基本等于没设 CSP）
- **CSP 两种模式**：enforcing（违反则阻止）/ Report-Only（仅上报）；两者可共存；Report-Only 不支持 `<meta>`
- **CSP frame-ancestors vs X-Frame-Options**：MDN 明确 frame-ancestors 更全面，二者并存时 frame-ancestors 优先；X-Frame-Options 在 `<meta>` 中无效
- **HSTS 三件套**：`max-age=31536000` + `includeSubDomains` + `preload`；preload 注册前提是 max-age ≥ 31536000 且必须含 includeSubDomains；仅 HTTPS 响应生效
- **Referrer-Policy 八值**：默认 `strict-origin-when-cross-origin`（同源发完整 URL、跨源发 origin、降级不发）
- **Permissions-Policy allowlist**：`()`（全禁用含同源）、`(self)`（仅同源）、`*`（全允许）、`(self "https://a.com")`（同源 + 指定域）
- **Helmet 默认 13 头**：含 X-XSS-Protection=0（主动禁用废弃机制）、不含 CORS（需独立 `npm install cors`）
- **CORS 凭证互斥**：`Access-Control-Allow-Credentials: true` 时禁用所有 `*` 通配符
- **CORS preflight 触发**：方法 / 头 / Content-Type 三条件任一不满足即触发 OPTIONS 预检
- **核心反模式**：CSP 出现 `'unsafe-inline'` / `'unsafe-eval'`、HTTP 头写 `<meta>`、HSTS 写 HTTP 响应、`Allow-Origin: *` 配 `Allow-Credentials: true`、CSRF 依赖 CORS

## OWASP Top 10:2025 前端映射

OWASP Top 10 是「风险地图」，前端防护要按地图找落点。下表列出每个类别的**前端可落地动作**：

| 类别 | 前端可落地动作 |
| --- | --- |
| **A01 Broken Access Control** | 前端隐藏按钮 ≠ 鉴权（必须服务端校验）；IDOR 用 UUID 替代自增 ID；JWT 不存 localStorage（用 HttpOnly Cookie） |
| **A02 Cryptographic Failures** | 全站 HTTPS（无混合内容）；`Strict-Transport-Security`；不在前端硬编码密钥 |
| **A03 Injection（含 XSS）** | **CSP**（nonce + strict-dynamic）；输出转义；Trusted Types；避免 `innerHTML` / `eval` / `Function()` |
| **A04 Insecure Design** | 威胁建模前置；默认安全（Default Deny）；最小权限 |
| **A05 Security Misconfiguration** | **Helmet 默认全套**；CSP 不为空；错误页不泄露栈；目录列表关闭 |
| **A06 Vulnerable Components** | `npm audit` / Renovate / Snyk；锁定版本（`package-lock.json`）；CSP `integrity`（SRI） |
| **A07 Auth Failures** | 会话超时；SameSite Cookie；登录限速；JWT 短期 + Refresh Token |
| **A08 Integrity Failures** | 子资源完整性（`<script integrity>`）；签名依赖；CI 凭证隔离 |
| **A09 Logging Failures** | 前端日志上报（CSP 违规、XSS 攻击）；不依赖用户截图 |
| **A10 SSRF** | 前端不直接相关（服务端出网白名单 + 禁重定向 + IMDSv2） |

> 前端最高频踩的是 **A03（XSS / 注入）** 与 **A05（CSP 缺失 / 过松、HTTP 头未设）**——这两块就是 CSP + HTTP 安全头 + Helmet 三个工具的主战场。

## CSP（Content-Security-Policy）

### 工作机制

CSP 是浏览器执行的内容白名单——服务器通过 HTTP 响应头（或 `<meta http-equiv>`，但 Report-Only 不支持 meta）声明「这个页面只能从这些来源加载这些类型资源」，浏览器拒绝执行未授权内容。它是 XSS 的纵深防御（不替代输出转义）。

### 两种模式

| 模式 | 头 | 行为 |
| --- | --- | --- |
| **Enforcing** | `Content-Security-Policy` | 违反则阻止 + 上报 |
| **Report-Only** | `Content-Security-Policy-Report-Only` | **仅上报不阻止**；不支持 `<meta>` |

> 上线策略：先 Report-Only 收集违规报告，验证策略修订无误后再切 enforcing。两者可同时存在于一个响应。

### 核心指令

| 指令 | 作用 | 备注 |
| --- | --- | --- |
| `default-src` | 回退策略（其他指令未设时用） | 通常设 `'self'` 兜底 |
| `script-src` | JS 来源 | 现代姿势 `nonce + 'strict-dynamic'` |
| `style-src` | CSS 来源 | Helmet 默认含 `'unsafe-inline'`（兼容性），生产应收紧 |
| `img-src` | 图像来源 | 常见 `'self' data: https:` |
| `connect-src` | fetch / XHR / WebSocket 目标 | 限制 API 调用域 |
| `font-src` | 字体来源 | 常见 `'self' https: data:` |
| `object-src` | `<object>` / `<embed>` | 建议 `'none'`（Flash 类已废弃） |
| `frame-ancestors` | 谁可以嵌入本页（防 clickjacking） | **仅 scheme/host/'self'，不能用 nonce/hash** |
| `frame-src` | 本页可嵌入的 iframe 来源 | - |
| `base-uri` | `<base>` 限制 | 防 base 注入劫持 |
| `form-action` | 表单提交目标 | 防表单外发 |
| `report-to` | 违规上报端点（配合 `Reporting-Endpoints` 头） | `report-uri` 已废弃 |

### script-src 源语义（重点）

| 源 | 含义 | 注意 |
| --- | --- | --- |
| `'self'` | 同源（同 scheme/host/port） | 基础兜底 |
| `'nonce-<随机值>'` | 每响应唯一随机值，需同时写入 CSP 头与 `<script nonce>` | **每响应重新生成**，不可复用 |
| `'strict-dynamic'` | 被信任（带 nonce/hash）的脚本可继续加载子脚本 | 避免给每个子资源加 nonce |
| `'sha256-<hash>'` | 按脚本内容计算 hash | 内容一变就失效，适合静态脚本 |
| `'unsafe-inline'` | 放行内联脚本 / 样式 | **当指令中存在 nonce 或 hash 时，'unsafe-inline' 会被忽略** |
| `'unsafe-eval'` | 放行 `eval()` / `Function()` | 基本等于没设 CSP，遗留系统过渡期使用 |
| `https:` | 任意 HTTPS 来源 | 范围过大，慎用 |

### nonce 工作机制（重点）

`nonce`（Number used once）的目的是「让浏览器认出本响应里合法的 `<script>`」：

1. 服务器**每响应**随机生成不可预测的 nonce（如 base64 32 字节）
2. 同时把 nonce 写入 CSP 头（`script-src 'nonce-abc123' 'strict-dynamic'`）与所有合法 `<script nonce="abc123">`
3. 浏览器比对一致才执行；攻击者注入的 `<script>` 因拿不到 nonce 而被拒绝

**铁律**：

- **每响应重新生成**——固定写死或静态 HTML 预置都违背「Number used once」原则
- **不可预测**——`Math.random()` 不行，必须 `crypto.randomBytes`
- **不能给所有 `<script>` 一律加 nonce**——会把攻击者注入的脚本也放行

### CSP 上线流程

```text
1. 起一份保守的 Report-Only 策略（default-src 'self'）
2. 上线后浏览器把违规 POST 到 report-to 端点
3. 收集 1-2 周违规数据，逐条判断：
   - 合法资源 → 加入白名单 / 给脚本加 nonce
   - 非法资源 → 修代码（这是 CSP 暴露的隐藏 XSS）
4. 违规归零后切 enforcing，保留 Report-Only 监控新违规
```

> enforcing CSP 一旦过严会直接阻断合法脚本 / 样式，破坏线上功能。先 Report-Only 是行业共识。

## HTTP 安全响应头

### X-Frame-Options（防 clickjacking）

| 值 | 含义 |
| --- | --- |
| `DENY` | 任何页面都不允许嵌入本页 |
| `SAMEORIGIN` | 仅同源可嵌入 |
| `ALLOW-FROM origin` | **已废弃**，现代浏览器忽略整个头 |

**与 CSP frame-ancestors 关系**：MDN 明确 frame-ancestors 提供比 X-Frame-Options 更全面的选项（可控制多源、与 CSP 报告机制联动）；二者并存时 **frame-ancestors 优先**。

> 实践：两个都设（兼容老浏览器），新浏览器看 frame-ancestors，老浏览器看 X-Frame-Options。

### X-Content-Type-Options（防 MIME 嗅探）

```text
X-Content-Type-Options: nosniff
```

阻止浏览器对 `script` / `style` 资源做 MIME 嗅探——攻击者上传一个声明为 `text/plain` 但内容是 JS 的文件，浏览器若嗅探成 JS 就会执行；`nosniff` 强制按声明的 Content-Type 处理。

### Strict-Transport-Security（HSTS，防 SSL Strip）

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

| 指令 | 作用 |
| --- | --- |
| `max-age=<秒>` | 浏览器记住「只用 HTTPS 访问本站」的时长 |
| `includeSubDomains` | 包含所有子域 |
| `preload` | 申请加入浏览器源码内的 preload 列表（[hstspreload.org](https://hstspreload.org)） |

**铁律**：

- **仅 HTTPS 响应生效**——HTTP 响应里的 HSTS 浏览器忽略（否则中间人可篡改）
- **preload 注册前提**：max-age ≥ 31536000（1 年）且**必须**含 includeSubDomains
- 解决「首次访问窗口期」——常规 HSTS 只在浏览器首次收到 HTTPS 响应后才生效，首次访问仍可被中间人降级（SSL Strip）；preload 把域名硬编码进浏览器源码，覆盖首次访问

### Referrer-Policy（控制 Referrer 泄露）

```text
Referrer-Policy: strict-origin-when-cross-origin
```

| 值 | 行为 |
| --- | --- |
| `no-referrer` | 不发 Referrer |
| `no-referrer-when-downgrade` | HTTPS→HTTP 不发，其他发完整 URL |
| `same-origin` | 仅同源发完整 URL，跨源不发 |
| `origin` | 只发 origin（不含 path / query） |
| `strict-origin` | 只发 origin，且 HTTPS→HTTP 不发 |
| `origin-when-cross-origin` | 同源发完整 URL，跨源只发 origin |
| **`strict-origin-when-cross-origin`** | **现代浏览器默认值**：同源完整 URL、跨源 origin、降级不发 |
| `unsafe-url` | 永远发完整 URL（**会泄露敏感路径 / 查询参数**） |

> 默认用 `strict-origin-when-cross-origin`：同源兼容现有统计、跨源不泄露路径 / 查询、降级不发——平衡隐私与可用性。

### Permissions-Policy（收回浏览器能力）

旧名 Feature-Policy（已废弃）。语法 `<directive>=<allowlist>`：

| allowlist | 含义 |
| --- | --- |
| `()` | **全禁用，含同源** |
| `(self)` | 仅同源 |
| `*` | 全允许 |
| `(self "https://a.com")` | 同源 + 指定域 |
| `(src)` | 仅对 `<source>` 元素（如 `<iframe>` 的 camera） |

常用指令：`camera` / `microphone` / `geolocation` / `fullscreen` / `payment` / `usb` / `display-capture` / `accelerometer`。

```text
Permissions-Policy: camera=(), microphone=(), geolocation=(self), fullscreen=(self)
```

> 最小化原则：默认 `()`（全禁用），需要才放。`camera=*`（允许任意来源调摄像头）等于无防护。

## Helmet.js（Node.js 安全头中间件）

### 默认行为

`app.use(helmet())` 开启默认 13 个头：

| 头 | 默认值 |
| --- | --- |
| Content-Security-Policy | 默认 directives（见下） |
| Strict-Transport-Security | `max-age=15552000; includeSubDomains`（180 天） |
| X-Content-Type-Options | `nosniff` |
| X-Frame-Options | `SAMEORIGIN` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Cross-Origin-Opener-Policy | `same-origin` |
| Cross-Origin-Resource-Policy | `same-origin` |
| Origin-Agent-Cluster | `?1` |
| X-DNS-Prefetch-Control | `off` |
| X-Download-Options | `noopen` |
| X-Permitted-Cross-Domain-Policies | `none` |
| **X-XSS-Protection** | **`0`（主动禁用废弃的 XSS Auditor）** |
| （移除） | `X-Powered-By` 头被移除 |

**默认 CSP directives**：

```text
default-src 'self';
base-uri 'self';
font-src 'self' https: data:;
form-action 'self';
frame-ancestors 'self';
img-src 'self' data:;
object-src 'none';
script-src 'self';
script-src-attr 'none';
style-src 'self' https: 'unsafe-inline';
upgrade-insecure-requests
```

> Helmet 默认 `style-src` 含 `'unsafe-inline'`（兼容性）；生产应改 nonce / hash 收紧。

### 关键点：为何 X-XSS-Protection 设为 0

浏览器内置的 XSS Auditor 已废弃且有缺陷（可被攻击者利用引入新漏洞）；现代替代方案是 CSP。Helmet 主动设 `X-XSS-Protection: 0` 关闭旧机制，避免被利用。

### 关键点：Helmet 不含 CORS

Helmet 只设置响应头（不含 CORS）；跨域资源共享需独立 `npm install cors` 并按白名单校验 Origin 回显。二者职责互补不可互相替代。

### 自定义 / 关闭单个中间件

```ts
import helmet from "helmet";
import express from "express";

const app = express();

// 关闭单个（如 COEP 默认不开，需要时显式开）
app.use(
  helmet({
    contentSecurityPolicy: false, // 自己手写 CSP
    crossOriginEmbedderPolicy: true, // 显式开 COEP
  }),
);

// 单独使用 CSP 中间件
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

## CORS（Cross-Origin Resource Sharing）

### 同源策略与 CORS

浏览器同源策略：JS 不能跨域读响应（同源 = 同 scheme + host + port）。CORS 是「受控放宽」——服务器用 `Access-Control-Allow-*` 响应头授权跨域访问，浏览器强制执行。

### 简单请求 vs 预检请求

**简单请求**（不触发 preflight）需**同时**满足：

- 方法在 `GET` / `HEAD` / `POST`
- 仅用安全列表头（`Accept` / `Accept-Language` / `Content-Language` / `Content-Type` 等）
- `Content-Type` 为三种基础类型：`application/x-www-form-urlencoded` / `multipart/form-data` / `text/plain`

任一不满足即触发 **OPTIONS preflight**（预检请求）。

### 预检请求（preflight）流程

```text
1. 浏览器先发 OPTIONS，带：
   - Origin: https://example.com
   - Access-Control-Request-Method: DELETE
   - Access-Control-Request-Headers: X-Custom

2. 服务器响应：
   - Access-Control-Allow-Origin: https://example.com
   - Access-Control-Allow-Methods: GET, POST, DELETE
   - Access-Control-Allow-Headers: X-Custom
   - Access-Control-Max-Age: 86400  （preflight 缓存秒数）

3. 浏览器通过预检，再发真正的 DELETE 请求
```

### CORS 头速查

| 头 | 类型 | 作用 |
| --- | --- | --- |
| `Origin` | 请求 | 每个 CORS 请求都带，标识发起方 |
| `Access-Control-Request-Method` | 请求（preflight） | 询问实际方法是否允许 |
| `Access-Control-Request-Headers` | 请求（preflight） | 询问自定义头是否允许 |
| `Access-Control-Allow-Origin` | 响应 | 允许的 origin（单一值或 `*`） |
| `Access-Control-Allow-Methods` | 响应（preflight） | 允许的方法 |
| `Access-Control-Allow-Headers` | 响应（preflight） | 允许的自定义头 |
| `Access-Control-Expose-Headers` | 响应 | 白名单自定义头给 JS 读 |
| `Access-Control-Allow-Credentials` | 响应 | 是否允许带 Cookie / Authorization |
| `Access-Control-Max-Age` | 响应（preflight） | preflight 缓存秒数（默认 5） |

### 凭证请求与通配符互斥（重点）

带 Cookie / Authorization 的跨域请求需前端 `fetch(url, { credentials: "include" })` 且服务端 `Access-Control-Allow-Credentials: true`。

**铁律**：当 `Access-Control-Allow-Credentials: true` 时：

- `Access-Control-Allow-Origin` **禁用 `*`**（必须精确回显请求的 Origin）
- `Access-Control-Allow-Headers` / `Methods` / `Expose-Headers` **也禁用 `*`**
- 否则浏览器**直接拒绝响应**，前端拿不到数据，且 `Set-Cookie` 不会写入

> 同时响应应配 `Vary: Origin` 防 CDN 缓存污染（同一 URL 对不同 Origin 回不同 Allow-Origin 时，缓存键必须含 Origin）。

### CSRF 不能依赖 CORS（重点）

简单请求（GET / HEAD / POST + 安全列表头 + 三种基础 Content-Type）**不触发 preflight**——攻击者可通过隐藏表单提交发起 CSRF，浏览器不会先发 OPTIONS。CSRF 必须独立防护：

- **Anti-CSRF Token**（Synchronizer Token / Signed Double-Submit）
- **SameSite Cookie**（Lax / Strict）
- **Sec-Fetch-Site**（Fetch Metadata Request Headers，浏览器自动发，JS 无法伪造）

> CORS 是「读响应」的机制，CSRF 是「写操作」的攻击——二者不能互相替代。

## 反模式（避坑）

- **CSP 出现 `'unsafe-inline'` 或 `'unsafe-eval'`**：基本等于没设 CSP，遗留系统过渡期使用；正确做法是 nonce / hash
- **HTTP 头写在 `<meta http-equiv>`**：`X-Frame-Options` / `Strict-Transport-Security` / `Content-Security-Policy-Report-Only` 在 meta 中完全无效，必须 HTTP 响应头
- **HSTS 写在 HTTP（非 HTTPS）响应**：浏览器会忽略（否则中间人可篡改）；HSTS 必须且仅在 HTTPS 响应中携带
- **`Access-Control-Allow-Origin: *` 配 `Access-Control-Allow-Credentials: true`**：浏览器直接拒绝响应，前端拿不到数据，`Set-Cookie` 不写入
- **CSRF 防护依赖 CORS**：简单请求不触发 preflight，CORS 拦不住表单提交的 CSRF；必须 Anti-CSRF Token 或 SameSite Cookie
- **固定写死 nonce 或静态 HTML 预置 nonce**：违背「Number used once」原则，攻击者可复用；每响应随机生成
- **继续用 `X-Frame-Options: ALLOW-FROM origin`**：已废弃，现代浏览器忽略整个头；迁移到 CSP `frame-ancestors`
- **用 `report-uri` 配置 CSP 违规上报**：已废弃（浏览器仍兼容），迁移到 `report-to` + `Reporting-Endpoints` 头
- **`Permissions-Policy: camera=*`**：等于无防护；最小化应 `camera=()` 或 `camera=(self)`
- **Helmet 默认 CSP 直接用 `'unsafe-inline'`（style-src）**：Helmet 出于兼容性默认允许 inline style，生产应收紧为 nonce / hash
- **混淆 CORS 与 CSP**：CORS 是浏览器同源策略的「受控放宽」（读响应），CSP 是「内容白名单」（防 XSS 执行）——两个机制目标不同，不能互替
- **混淆 X-Frame-Options 与 CSP frame-ancestors 的优先级**：二者并存时 frame-ancestors 优先；新浏览器看 frame-ancestors，老浏览器看 X-Frame-Options
- **以为 Helmet 包含 CORS**：Helmet 只设响应头，CORS 需独立 `npm install cors`
- **以为 preflight 是请求的一部分**：preflight 是浏览器**先发**的 OPTIONS，与实际请求是两个独立请求；preflight 通过后才发真正的 DELETE / PUT 等

## 下一步

- [参考](./reference.md)：OWASP Top 10 完整表、安全头速查表、CSP 指令表、CORS 表、官方资源链接
