---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 OWASP Cheat Sheet Series（XSS / DOM XSS / CSRF / SQL Injection / SSRF / Injection Prevention / DoS）+ MDN Web Docs（CSP / Trusted Types / Sanitizer / SameSite / HSTS）+ OWASP Top 10:2025 编写

## 速查

- 六类常见攻击：**XSS / CSRF / SQL 注入 / SSRF / DDoS / MITM**
- OWASP Top 10:2025 现行版本：A01 Broken Access Control（仍 #1）/ A02 Cryptographic Failures / A03 Injection（含 XSS、SQLi）/ A05 Security Misconfiguration（升至 #2）/ A07 Identification and Authentication Failures
- XSS 三类型：**存储型**（持久化 DB，危害最大）/ **反射型**（服务器响应反射，钓鱼触发）/ **DOM 型**（纯客户端，不经服务器）
- XSS 三类 sink：**HTML sink**（innerHTML / outerHTML / document.write）/ **JS sink**（eval / Function / setTimeout(string)）/ **JS URL sink**（script.src / location.href）
- XSS 纵深防御四件套：**输出编码 + CSP（nonce-based Strict CSP）+ Trusted Types + Sanitizer API / DOMPurify**
- CSRF 三层防御：**SameSite=Lax（默认）+ Synchronizer Token / Signed Double-Submit（主）+ Sec-Fetch-Site（兜底）**
- SameSite=Lax 默认边界：**仅阻止不安全方法（POST/PUT/DELETE），GET 顶层导航仍带 Cookie**；若有 GET 状态变更端点则失效
- SQL 注入防御：**参数化查询 / ORM 默认接口**；raw 接口（Prisma `$queryRawUnsafe`、TypeORM `query()`）若字符串拼接仍可注入
- SSRF 铁律：**白名单校验 + 禁用 HTTP 重定向（followRedirect=false）+ IMDSv2**；黑名单至少阻断 169.254.169.254、RFC1918、127.0.0.0/8
- DDoS 分层：**L7 应用层**（速率限制 + 优雅降级 + Bulkhead）/ **L3/4 网络层**（云清洗 Cloudflare / AWS Shield / 阿里云 DDoS 高防）
- MITM 防御：**HSTS**（max-age=31536000; includeSubDomains; preload）+ TLS 证书链校验
- 现代浏览器原生防御：Trusted Types API（MDN Baseline 2026）/ Sanitizer API（Limited Availability）/ Sec-Fetch-Site（覆盖率 > 98%）/ SameSite=Lax 默认（Chrome 84+）
- 反模式：**XSS 与 CSRF 不是独立问题**——XSS 可读取 CSRF Token 使所有 CSRF 防护失效

## 攻击方式是什么

「攻击方式」是 Web 安全的攻防对应面：从攻击者视角，识别应用层最常见的六类攻击如何发生；从防御者视角，对每类攻击配上**官方权威的防御手段**（OWASP Cheat Sheet Series + MDN Web Docs）。它的核心定位有三：

- **攻防对应**：不单讲攻击，也不单讲防御，而是把「攻击机制 + 对应防御」成对呈现
- **纵深防御**：单层防御都不够——CSP 不替代输入消毒，编码挡不住 DOM 型 XSS，Trusted Types 是 DOM sink 的最后闸门
- **官方信源优先**：以 OWASP Cheat Sheet Series、MDN Web Docs、OWASP Top 10:2025、RFC 6797 为唯一引用源

> OWASP Top 10:2025 已发布为现行版本。关键变化：Broken Access Control 仍居 #1、Security Misconfiguration 升至 #2、SSRF 正式并入主流讨论、Injection（含 XSS/SQLi）仍是 A03。

## 六类攻击速览

| 攻击 | 机制 | OWASP 映射 | 主防御 |
| --- | --- | --- | --- |
| **XSS** | 注入恶意脚本到受害者浏览器执行 | A03 Injection | 输出编码 + CSP nonce + Trusted Types + Sanitizer |
| **CSRF** | 利用受害者已登录身份发跨站状态变更请求 | A01 Broken Access Control | SameSite=Lax + Token 模式 + Sec-Fetch-Site |
| **SQL 注入** | 拼接 SQL 字符串改变查询结构 | A03 Injection | 参数化查询 / ORM 默认接口 |
| **SSRF** | 让服务器发起攻击者指定 URL 的请求 | A10 SSRF（2021）/ 主流注入（2025） | 白名单 + 禁重定向 + IMDSv2 |
| **DDoS** | 耗尽带宽 / CPU / 内存 / 连接使服务不可用 | Availability | L7 速率限制 / L3-4 云清洗 |
| **MITM** | 中间人窃听 / 篡改流量 | A02 Cryptographic Failures | HSTS + TLS 证书链校验 |

> XSS 与 CSRF 不是独立问题——XSS 可在受害者浏览器内读取 CSRF Token，使所有 CSRF 防护失效。OWASP 反复强调：**XSS 防御是 CSRF 防御的前提**。

## OWASP Top 10:2025 映射

| 编号 | 类别 | 本篇覆盖 |
| --- | --- | --- |
| **A01** | Broken Access Control | CSRF（状态变更越权）、SSRF（访问控制边界） |
| **A02** | Cryptographic Failures | MITM（TLS / HSTS） |
| **A03** | Injection | XSS、SQL 注入（含 ORM raw 边界） |
| **A05** | Security Misconfiguration | CSP 配置错误、HSTS 缺失 |
| **A06** | Vulnerable and Outdated Components | 不展开（属依赖安全篇） |
| **A07** | Identification and Authentication Failures | 不展开（属会话/认证篇） |
| **A10** | SSRF（2021 社区补充） | SSRF（2025 已并入主流讨论） |

## 现代浏览器原生防御

| 防御 | 状态 | 适用 |
| --- | --- | --- |
| **CSP3** | Baseline widely available | XSS（阻断未授权脚本） |
| **Trusted Types API** | MDN Baseline 2026（2026-02 起） | DOM sink 注入 |
| **Sanitizer API** | Limited Availability（不在 Baseline） | 富文本 HTML 消毒，生产常需 DOMPurify 兜底 |
| **SameSite=Lax 默认** | Chrome 84+（2020） | CSRF（被动缓解） |
| **Sec-Fetch-Site** | 覆盖率 > 98% | CSRF（现代化兜底） |
| **HSTS** | Baseline widely available（2015-07 起） | MITM（协议降级） |

## 三层防御原则

1. **输入侧**：参数化查询、白名单校验、CSPRNG Token——**预防**攻击进入
2. **处理侧**：输出编码、Trusted Types policy、Sanitizer 消毒——**阻断**攻击触发
3. **输出侧**：CSP、HSTS、Frame-Options、Cookie HttpOnly——**限制**攻击影响范围

> 单层都不够。CSP 不替代输入消毒，输入消毒挡不住 DOM 型 XSS，Trusted Types 是 DOM sink 的最后闸门。

## 下一步

- [攻击方式与防御](./guide-line.md)：XSS（三类型 + Trusted Types + Sanitizer + CSP）+ CSRF（SameSite + Token + Sec-Fetch-Site）+ SQL 注入（参数化）+ SSRF（白名单 + 禁重定向）+ DDoS（分层）+ MITM（HSTS）+ 反模式
- [参考](./reference.md)：攻击-防护对照表、CSP 指令表、安全头表、官方资源
