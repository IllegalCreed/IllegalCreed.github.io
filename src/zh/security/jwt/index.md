---
layout: doc
---

# JWT（JSON Web Token）

JWT（JSON Web Token，RFC 7519）是一个**用 JSON 编码、密码学签名的「claim 集合」**串，由三段 Base64URL 编码的文本用点号 `.` 拼接而成：`header.payload.signature`。它不是加密协议（标准 JWS 只签名不加密），而是把「谁签的、给谁用、什么时候过期、主体是谁」这些 claim 以**可验证防篡改**的方式打包在一条字符串里，让接收方不查服务端会话即可确认内容未被篡改。它是 OAuth 2.0 / OpenID Connect 中 Access Token / ID Token 的事实载体，也是分布式系统服务间调用、移动端 API 授权的主流凭证形态。核心三件套是：**JOSE Header（含 alg 算法）、Payload（claim 集）、Signature（按 header.alg 对前两段做的密码学校验和）**。生产使用必须过两道安全门：①`verify()` 显式传 `algorithms` 白名单防御 `alg:none` 与 RS256→HS256 算法混淆攻击；②Refresh Token 放 `HttpOnly + Secure + SameSite=Strict` Cookie、Access Token 放内存，**严禁 localStorage**（OWASP 明令：任何 XSS 都会拖走凭证）。配套的最佳实践由 RFC 8725（JWT BCP）与 RFC 9700（OAuth 2.0 Security BCP）共同规定：短 exp（Access Token 几分钟～15 分钟）+ Refresh Token 轮换 + 复用检测，是当代凭证安全的标配。

## 评价

**优点**

- **无状态、易扩展**：服务端不存 session，多实例 / 跨域 / 跨服务只需共享密钥或公钥即可验签
- **可自包含**：claim 集直接承载用户 ID / 角色 / 过期，验证方少一次数据库查询
- **标准化、跨语言**：RFC 7519 + JOSE 套件（JWS/JWE/JWK/JWA）规范统一，Java/Go/Node/Python 都有成熟实现
- **天然适合 SSO / OIDC / 移动端**：Authorization: Bearer 头传输不触发 CORS 复杂请求，移动端无 Cookie 也能用
- **非对称算法可分离签发与验证**：RS256/ES256 私钥只在签发方，验证方只持公钥，密钥泄露面最小
- **生态成熟**：jwt.io 在线解码、auth0/node-jsonwebtoken 是 Node 事实标准

**缺点**

- **exp 前无法单方面吊销**：JWS 默认无状态，要即时吊销需引入 blocklist/黑名单，抵消了无状态优势
- **payload 默认不加密**：仅 Base64URL 编码，任何人 `decode()` 即可读明文，敏感数据必须用 JWE 或外层加密
- **alg 头是 token 自报的不可信元数据**：若 `verify()` 不传白名单，会落入 `alg:none` 与算法混淆两类经典攻击
- **体积比 opaque token 大**：claim 多时几百字节起步，比 16 字节随机串明显重
- **存储位置两难**：localStorage 易遭 XSS（OWASP 明令禁用），HttpOnly Cookie 防 XSS 但需配 SameSite 防 CSRF
- **续期机制复杂**：长 exp 是大攻击窗口，短 exp 必须配 Refresh Token 轮换 + 复用检测才能用得稳

## 文档地址

- [RFC 7519 - JSON Web Token (JWT)](https://datatracker.ietf.org/doc/html/rfc7519)
- [RFC 8725 - JSON Web Token Best Current Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [RFC 9700 - Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/info/rfc9700/)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [jwt.io Introduction（Auth0）](https://jwt.io/introduction)

## GitHub地址

[auth0/node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) · [panva/jose（现代替代，支持 JWE/KeyObject）](https://github.com/panva/jose)

## 幻灯片地址

<a href="/SlideStack/jwt-slide/" target="_blank">JWT</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=219" target="_blank" rel="noopener noreferrer">JWT 测试题</a>
