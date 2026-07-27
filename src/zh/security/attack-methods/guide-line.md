---
layout: doc
outline: [2, 3]
---

# 攻击方式与防御

> 基于 OWASP Cheat Sheet Series（XSS Prevention / DOM XSS Prevention / CSRF Prevention / SQL Injection Prevention / SSRF Prevention / Injection Prevention / Denial of Service Cheat Sheet）+ MDN Web Docs（CSP / Trusted Types / Sanitizer / Set-Cookie SameSite / Strict-Transport-Security）+ OWASP Top 10:2025 编写

## 速查

- **XSS 三类型**：存储型（持久化 DB）/ 反射型（响应反射，钓鱼触发）/ DOM 型（纯客户端，不经服务器，**WAF 挡不住**）
- **XSS 三类 sink**：HTML sink（innerHTML / document.write）/ JS sink（eval / Function）/ JS URL sink（script.src / location.href）
- **XSS 纵深防御**：输出编码 + CSP nonce + Trusted Types + Sanitizer（`setHTML` 默认消毒，`setHTMLUnsafe` 必须显式传 Sanitizer）
- **CSP 用 nonce-based Strict CSP**（`script-src 'nonce-{RANDOM}'; object-src 'none'; base-uri 'none'`），不要用 allowlist CSP（仅 GA 就要加 187 个域名）
- **CSRF 三层**：SameSite=Lax（默认）+ Synchronizer Token / Signed Double-Submit（主）+ Sec-Fetch-Site（兜底，> 98%）
- **SameSite=Lax 默认边界**：仅阻止不安全方法（POST/PUT/DELETE），**GET 顶层导航仍带 Cookie**；若有 GET 状态变更端点则失效
- **CSRF Token 选型**：Synchronizer（有状态，服务端存）vs Signed Double-Submit HMAC（无状态）；**Naive Double-Submit 易被子域 Cookie 注入绕过**
- **SQL 注入**：参数化查询（占位符 `?` / `:name`）+ ORM 默认接口；raw 接口（`$queryRawUnsafe`、`query()`）拼接字符串**仍可注入**
- **SSRF 铁律**：白名单校验 + 禁用 HTTP 重定向（`followRedirect=false`）+ IMDSv2；黑名单至少阻断 169.254.169.254、RFC1918、127.0.0.0/8
- **DDoS 分层**：L7 应用层（速率限制 + 优雅降级 + Bulkhead）/ L3-4 网络层（云清洗 Cloudflare / AWS Shield / 阿里云 DDoS 高防）
- **MITM 防御**：HSTS（`max-age=31536000; includeSubDomains; preload`）+ TLS 证书链校验；preload 提交到 hstspreload.org
- **跨攻击关联**：XSS 可读取 CSRF Token 使所有 CSRF 防护失效——**XSS 防御是 CSRF 防御的前提**

## XSS（跨站脚本攻击）

XSS 是攻击者注入恶意脚本到受害者浏览器执行的攻击，OWASP 归类为 A03 Injection。本质是「未消毒的用户输入流入了执行上下文」。

### 三类型区分依据

| 类型 | 持久化 | 触发链路 | 危害 | 服务端 WAF 可见 |
| --- | --- | --- | --- | --- |
| **存储型**（Stored） | 持久化在服务端 DB / 留言板 | 用户访问受感染页面即触发 | **最大**（影响所有访问者） | 可见载荷 |
| **反射型**（Reflected） | 不持久化 | 单次请求 → 响应反射回来，常通过钓鱼链接触发 | 中（单次，需诱导点击） | 可见载荷 |
| **DOM 型**（DOM-based） | 不持久化 | **纯客户端**，不经服务器响应，由 sink 触发 | 中 | **不可见**（WAF 挡不住） |

> DOM 型 XSS 的本质区别：**完全不经过服务器响应**，载荷在客户端 sink 执行，服务器日志中看不到载荷——因此服务端 WAF 挡不住 DOM 型 XSS。

### 三类注入 sink（Trusted Types API）

Trusted Types API 把 DOM 注入点分为三类 sink，每类对应一种可信类型对象：

| sink 类型 | 危险 API | 可信类型 | policy 方法 |
| --- | --- | --- | --- |
| **HTML sink** | `innerHTML` / `outerHTML` / `document.write` | TrustedHTML | `createHTML` |
| **JS sink** | `eval` / `Function` / `setTimeout(string)` | TrustedScript | `createScript` |
| **JS URL sink** | `script.src` / `location.href` / `location.replace()` | TrustedScriptURL | `createScriptURL` |

通过 `window.trustedTypes.createPolicy(name, {createHTML, createScript, createScriptURL})` 创建 policy，传字符串进 sink 抛 `TypeError`，强制走 policy 才能注入。CSP `'require-trusted-types-for "script"'` 强制启用。

### 纵深防御四件套

XSS 单层防御都不够，必须四件套组合：

```text
1. 输出编码（服务端 / 模板自动转义）   ← 第一道闸门
2. CSP（nonce-based Strict CSP）      ← 阻断内联与未授权脚本
3. Trusted Types（DOM sink 强制 policy）← DOM 型 XSS 最后闸门
4. Sanitizer API / DOMPurify（富文本消毒）← 富文本场景必备
```

**为什么单层都不够**：

- CSP **不替代**输入消毒（编码是输入侧）
- 输出编码**挡不住** DOM 型 XSS（DOM 型不经服务器）
- Trusted Types 是 DOM sink 的**最后闸门**（即使前两层漏掉，policy 不通过就抛 TypeError）

### CSP（Content Security Policy）

**关键指令**

| 指令 | 作用 |
| --- | --- |
| `default-src` | 默认加载策略（其他 src 未声明时回退） |
| `script-src` | 脚本来源（最关键） |
| `object-src` | `<object>` / `<embed>` / `<applet>`（建议 `'none'`） |
| `base-uri` | `<base>` 限制（建议 `'none'`） |
| `frame-ancestors` | 嵌套祖先（替代 `X-Frame-Options` 防 Clickjacking） |
| `upgrade-insecure-requests` | 自动 HTTP → HTTPS |
| `require-trusted-types-for 'script'` | 强制 Trusted Types |
| `trusted-types` | 允许的 policy 名白名单 |

**关键字**

| 关键字 | 含义 |
| --- | --- |
| `'self'` | 同源（协议 + 域名 + 端口） |
| `'nonce-{RANDOM}'` | 每响应重新生成的不重复 nonce |
| `'sha256-{HASH}'` | 内联脚本 hash |
| `'strict-dynamic'` | 受信任脚本可加载子脚本（降低安全性） |
| `'none'` | 完全阻止 |
| `'unsafe-inline'` | 允许内联（**含 nonce/hash 时被忽略**） |
| `'unsafe-eval'` | 允许 `eval`（**等于没防 XSS**） |

**最佳实践：nonce-based Strict CSP**

```text
Content-Security-Policy:
  script-src 'nonce-{RANDOM}' 'strict-dynamic';
  object-src 'none';
  base-uri 'none';
  report-to csp-endpoint;
```

**为什么不用 allowlist CSP**：allowlist 难维护且常无意中白名单不安全域名——仅集成 Google Analytics 就需加 187 个域名。nonce 方式根本不依赖域名白名单。

**上报**：用 `report-to`（Reporting-API，推荐）；`report-uri` 已废弃，过渡期可同时声明。

### Sanitizer API

```js
// 安全方法：setHTML 默认用默认消毒配置
element.setHTML(userInput);  // 自动消毒

// 危险方法：setHTMLUnsafe 默认不消毒，必须显式传 Sanitizer
const sanitizer = new Sanitizer({
  elements: ['b', 'i', 'em', 'strong', 'a'],
  allowAttributes: { 'href': ['a'] },
});
element.setHTMLUnsafe(userInput, { sanitizer });
```

**关键区别**：

| API | 默认行为 |
| --- | --- |
| `setHTML()` | **默认安全**，自动用默认消毒配置 |
| `setHTMLUnsafe()` | **默认不消毒**，必须显式传 Sanitizer |

> 常考陷阱：以为 `setHTMLUnsafe` 也自动消毒。它默认**不消毒**，必须显式传入 `new Sanitizer()`。

**Sanitizer vs DOMPurify**：

| 维度 | Sanitizer API | DOMPurify |
| --- | --- | --- |
| 形态 | 浏览器原生 API | 第三方 JS 库 |
| 集成 | 配合 `setHTML` 原生集成 | 返回字符串需手动插入 DOM |
| 复用 | 实例可复用 | 函数调用 |
| 浏览器支持 | Limited Availability（不在 Baseline） | 广泛（业界事实标准） |

> 生产环境 Sanitizer 浏览器支持有限时常仍需 DOMPurify 兜底。

## CSRF（跨站请求伪造）

CSRF 是攻击者诱导用户在已登录状态下发起跨站状态变更请求的攻击，OWASP 归类为 A01 Broken Access Control（越权状态变更）。本质是「浏览器自动携带 Cookie」这一特性被滥用。

### SameSite Cookie 属性

```text
Set-Cookie: sessionId=xxx; SameSite=Strict|Lax|None; Secure; HttpOnly; Path=/
```

| 值 | 行为 | 适用 |
| --- | --- | --- |
| **Strict** | 完全不带 Cookie（包括顶层导航） | 高敏感（支付确认） |
| **Lax**（默认） | **仅阻止不安全方法**（POST/PUT/DELETE），GET 顶层导航仍带 Cookie | 通用（Chrome 84+ 默认） |
| **None** | 完全带（**强制要求 Secure**） | 第三方场景（已逐渐被全行业限制） |

**Lax 默认的边界**：

- 仅阻止不安全方法（POST/PUT/DELETE 跨站不带 Cookie）
- **GET 顶层导航仍带 Cookie**——若有 GET 端点执行状态变更，SameSite=Lax 失效
- 对客户端 CSRF（同源 JS）无效
- 旧浏览器不执行

> SameSite=Lax 自 Chrome 84（2020）起为默认行为，已成为现代浏览器共识。把它当**纵深防御而非主防御**。

### Token 模式

**Synchronizer Token Pattern（有状态）**

服务端用 CSPRNG 生成 Token，存于会话，前端通过隐藏字段 / JSON 体 / 自定义头传输，**不经 Cookie 不入 URL**。每次请求服务端用 `constantTimeEquals` 比较。

**Signed Double-Submit Cookie（无状态）**

```text
Set-Cookie: csrfToken=HMAC-SHA256(sessionSecret, sessionId+random)
请求头：X-CSRF-Token: <同值>
```

服务端用 HMAC 重新计算并 `constantTimeEquals` 比较。**必须用 Signed 版本**——Naive Double-Submit（仅比较 Cookie 值与请求参数）易被子域 Cookie 注入 / DNS 劫持 / 明文 HTTP 注入 Cookie 绕过。

**选型依据**：

| 模式 | 状态 | 适用 |
| --- | --- | --- |
| Synchronizer Token | 有状态（服务端存） | 有服务端会话存储 |
| Signed Double-Submit HMAC | 无状态 | 无服务端会话（JWT / 微服务） |

> CSRF Token 生成必须用 CSPRNG 且每会话 / 每请求唯一，比较用 `constantTimeEquals`（防时序侧信道逐字节爆破）。

### Sec-Fetch-Site（Fetch Metadata）

```text
Sec-Fetch-Site: same-origin | same-site | cross-site | none
```

**优势**：

- 浏览器自动发送、**JS 无法伪造**
- 覆盖率 > 98%
- 无需 Token 改造

**现代化 CSRF 兜底策略**：优先验证 `Origin` 头，缺失则 block；`Sec-Fetch-Site` 为 `same-origin` 或 `none`（用户直发）放行，否则 block。

### CSRF 防御反模式

- **仅靠 Referer 头单一防护**：Referer 可被代理 / 负载均衡器剥离，隐私策略下可能为空（约 1-2% 流量缺失）；应优先 `Origin` 头，缺失则 block
- **认为 HTTPS 能防 CSRF**：OWASP 明确「HTTPS by itself does nothing to defend against CSRF」，HTTPS 只是所有 CSRF 防护可信的前提
- **用 CAPTCHA 防 CSRF**：CAPTCHA 设计用于防机器人，不防 CSRF；高敏感操作应叠加重新认证 / 一次性令牌
- **用 Naive Double-Submit**：必须用 Signed (HMAC) 版本

## SQL 注入

SQL 注入是拼接 SQL 字符串改变查询结构的攻击，OWASP 归类为 A03 Injection。本质是「代码与数据未分离」。

### 参数化查询的本质

```sql
-- 危险：字符串拼接
SELECT * FROM users WHERE name = '<userInput>';

-- 安全：参数化（占位符）
SELECT * FROM users WHERE name = ?;
```

**为什么参数化能防注入**：预编译阶段已**固定 SQL 结构**，数据库始终把占位符传入的值当**字面数据**，攻击者输入 `' OR '1'='1` 只作字符串字面值匹配，不会被解析为 SQL 逻辑。

### ORM 的安全边界

ORM 默认参数化是安全的，但 raw 接口若用字符串拼接**仍会注入**：

| ORM | 安全接口 | 危险接口 |
| --- | --- | --- |
| **Prisma** | `$queryRaw\`...${var}\``（模板字符串自动参数化） | `$queryRawUnsafe(...)`（拼接字符串） |
| **TypeORM** | QueryBuilder 参数绑定 | `query()` 字符串拼接 |
| **Sequelize** | `findAll({ where })` | `query()` 字符串拼接 |

> **Prisma `$queryRaw` 模板字符串形式让 ORM 自动参数化**；`$queryRawUnsafe` 是拼接入口，必须用占位符。

## SSRF（服务端请求伪造）

SSRF 是让服务器发起攻击者指定 URL 请求的攻击，OWASP 2021 为 A10（社区补充），2025 正式并入主流注入 / 访问控制讨论。本质是「服务端的网络访问权限被滥用」。

### 攻击目标

- **云元数据服务**：AWS / Azure IMDS `169.254.169.254`、Google `metadata.google.internal`——可窃取临时凭证、IAM 角色
- **内网服务**：RFC1918（10/172.16/192.168）、`127.0.0.0/8`、`::1/128`——Redis、MySQL、内部 API
- **多播 / 管理面**：`224.0.0.0/4`、路由器、负载均衡器管理接口

### 防御铁律

```text
1. 白名单校验（URL + 域名 + IP + 协议 + 端口）
2. 禁用 HTTP 重定向（followRedirect=false）
3. 同时查 A + AAAA 记录（防 DNS Pinning 攻击）
4. 云环境用 IMDSv2 替代 IMDSv1
```

**为什么必须禁重定向**：仅校验入口 URL 没用——攻击者把无害 URL 校验通过后用 302 重定向跳到 `169.254.169.254`（云元数据）或 RFC1918 内网，绕过校验。

**为什么必须查 A + AAAA**：DNS Pinning 攻击会先解析到公网（绕过校验），再 TTL 过期后解析到内网。

### SSRF 反模式

- **只做黑名单不做白名单**：十进制 IP（`2130706433` = `127.0.0.1`）、DNS Rebinding、IPv6 映射都能绕过黑名单
- **不禁用重定向**：入口校验通过后 302 跳到内网
- **不做 DNS Rebinding 防护**：不查 AAAA 记录

## DDoS（分布式拒绝服务）

DDoS 是耗尽带宽 / CPU / 内存 / 连接使服务不可用的攻击。**分层防御**是核心原则：应用层（L7）与应用自身能力相关，网络层（L3/4）超出应用能力必须交给云清洗。

### L7 应用层

应用层攻击**不耗带宽而耗 CPU / 内存 / 连接**，WAF / CDN 的速率规则只能识别已知模式，必须靠应用自身设计：

- **速率限制**：最大 / 最小入口速率（令牌桶 / 滑动窗口）
- **连接超时 + 并发上限**：防慢攻击（Slowloris）
- **文件 / 请求体大小限制**：防大包攻击
- **优雅降级**：高消耗功能在攻击期关闭
- **Bulkhead 隔离**：关键服务资源隔离，单点故障不扩散
- **高消耗验证后置**：登录/付费等高消耗操作放在基础验证之后

### L3/4 网络层

单机无法承受带宽饱和，必须交给云清洗（商业服务可清洗 ~500Gbps）：

- **云清洗**：Cloudflare / AWS Shield / 阿里云 DDoS 高防
- **ISP 边缘过滤**：RFC 2267 反 IP 欺骗
- **Anycast 分散**：流量分散到全球节点稀释
- **带宽冗余**：超量带宽储备

## MITM（中间人攻击）

MITM 是中间人窃听 / 篡改流量的攻击，OWASP 归类为 A02 Cryptographic Failures。**HSTS + TLS** 是核心防御。

### HSTS（HTTP Strict Transport Security）

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**两层机制**：

1. **浏览器自动把 HTTP 升级为 HTTPS**（防协议降级）
2. **不允许用户绕过证书错误**（防伪造证书的「点击继续」）

**preload 指令**：解决「首次访问前 HSTS 不生效」的漏洞——浏览器出厂内置 HSTS 域名列表。前提：`max-age ≥ 31536000` 且含 `includeSubDomains`。提交到 [hstspreload.org](https://hstspreload.org)。

### MITM 反模式

- **在 HTTP 重定向响应（301 HTTP→HTTPS）里带 HSTS 头**：HSTS 头**必须只通过 HTTPS 响应下发**，HTTP 响应下发会被浏览器忽略防 MITM 篡改
- **不做证书链校验**：客户端忽略证书错误等于关掉防御
- **缺 upgrade-insecure-requests**：CSP 指令，自动 HTTP → HTTPS，补 HSTS 首次访问漏洞

## 反模式（避坑）

- **XSS 与 CSRF 当独立问题**：XSS 可读取 CSRF Token 使所有 CSRF 防护失效——XSS 防御是 CSRF 防御的前提
- **CSP 含 `'unsafe-inline'` 或 `'unsafe-eval'`，或白名单过宽**：等于没防 XSS；正确做法是 nonce/hash + strict-dynamic
- **`element.innerHTML = userInput` 直接插入未消毒的用户输入**：DOM 型 XSS；即使数据来自服务端也要消毒（存储型 XSS）
- **字符串拼接 SQL**：`'SELECT * FROM users WHERE name=\'' + userInput + '\''`——经典 SQL 注入入口
- **ORM raw 接口字符串拼接**：Prisma `$queryRawUnsafe` / TypeORM `query()` 必须用占位符，不能拼接
- **CSRF 用 Naive Double-Submit**：必须用 Signed (HMAC) 版本，否则子域 Cookie 注入绕过
- **SSRF 只做黑名单 + 不禁用重定向**：十进制 IP / DNS Rebinding / 302 跳内网都能绕过
- **Sanitizer API 配 `setHTMLUnsafe()` 时忘传 sanitizer 参数**：默认不消毒，必须显式传 `new Sanitizer()`
- **用 `SameSite=None` 但忘加 `Secure`**：现代浏览器会拒绝该 Cookie（强制要求 HTTPS）
- **在 HTTP 响应里下发 HSTS 头**：HSTS 必须只通过 HTTPS 响应下发，否则会被忽略
- **`require-trusted-types-for 'script'` 但不配 policy**：所有 sink 立即抛 TypeError，应用直接挂
- **CAPTCHA 防 CSRF**：CAPTCHA 设计用于防机器人，不防 CSRF
- **认为 HTTPS 能防 CSRF**：HTTPS 只是 CSRF 防护可信的前提，不直接防 CSRF

## 下一步

- [参考](./reference.md)：完整攻击-防护对照表、CSP 指令表、安全头表、官方资源
