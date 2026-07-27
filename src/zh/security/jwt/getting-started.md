---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 RFC 7519（JWT）/ RFC 8725（JWT BCP）/ jwt.io 官方文档编写，对照 auth0/node-jsonwebtoken 长期支持版行为

## 速查

- **三段式**：`header.payload.signature`，三段均 **Base64URL**（URL-safe，`+/-` 替换、去 `=` 填充、无空白）
- **Header 关键字段**：`alg`（必填，签名算法）、`typ`（推荐 `JWT`）、`kid`（JWKS 密钥 ID）
- **alg 取值**：HS256/HS384/HS512（HMAC 对称）、RS256/RS384/RS512（RSA 非对称）、ES256/ES384/ES512（ECDSA）、PS256/PS384/PS512（PSS）、`none`（无签名 Unsecured JWT）
- **七个注册声明**：`iss`（签发者）/`sub`（主体）/`aud`（受众，不匹配 MUST 拒绝）/`exp`（过期）/`nbf`（生效前）/`iat`（签发时间）/`jti`（唯一 ID，防重放）— 全部 OPTIONAL
- **NumericDate**：自 1970-01-01T00:00:00Z UTC 起的**秒数**（忽略闰秒），`exp`/`nbf`/`iat` 都用此类型，不是 ISO 字符串
- **传输**：`Authorization: Bearer <token>`（不触发 CORS 复杂请求）或 `HttpOnly` Cookie
- **存储**：**禁止 localStorage**（OWASP 明令：任何 XSS 都会拖走）→ Access Token 放内存 / Refresh Token 放 `HttpOnly + Secure + SameSite=Strict` Cookie
- **验签铁律**：`verify()` 必须显式传 `algorithms` 白名单，防御 `alg:none` 与 RS256→HS256 算法混淆
- **payload 不加密**：仅 Base64URL 编码，任何人 `decode()` 即可读明文，敏感数据必须用 JWE
- **Node 事实标准**：`jsonwebtoken`（`sign`/`verify`/`decode`），现代替代 `panva/jose`

## JWT 是什么

JWT（JSON Web Token）是 RFC 7519 定义的**用 JSON 编码、密码学签名的 claim 集合**。它把「签发方、受众、主体、过期、自定义字段」打包成一条字符串，接收方验签通过即可在不查服务端会话的前提下确认内容未被篡改。

它的核心定位有三：

- **凭证而非状态**：是「授权凭证 / 信息载体」，**不是** session 存储——服务端不维护 JWT 状态，exp 前也无法单方面吊销
- **签名 ≠ 加密**：标准 JWS 只签名防篡改，**不加密**；payload 仅 Base64URL 编码，要保密必须用 JWE（RFC 7516）
- **可自包含**：claim 集可直接承载用户 ID / 角色 / 过期，验证方少一次数据库查询

> JWT ≠ 加密凭证。它防的是「篡改」而不是「泄露」——拿到 token 的人都能 decode 看到内容。

## 三段式结构速览

一条 JWT 长这样：

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4iLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

用 `.` 切三段：

| 段 | 内容 | 示例（解码后） |
| --- | --- | --- |
| **Header** | `alg`、`typ` 等 JOSE 元数据 | `{"alg":"HS256","typ":"JWT"}` |
| **Payload** | claim 集合（iss/sub/aud/exp + 自定义） | `{"sub":"1234567890","name":"John","iat":1516239022}` |
| **Signature** | 按 `header.alg` 对前两段做的密码学校验和 | `HMACSHA256(base64Url(header)+'.'+base64Url(payload), secret)` |

**Base64URL ≠ 普通 Base64**：

- `+` → `-`，`/` → `_`（URL-safe，不再需要 URL 编码）
- 去掉 `=` 填充
- 无换行 / 无空白

> 三段都只是编码（不是加密），任何人都能 Base64URL 解码读 Header 和 Payload。Signature 才是密码学保护。

## JOSE Header 关键字段

| 字段 | 含义 | 是否必填 |
| --- | --- | --- |
| `alg` | 签名 / MAC 算法（HS256/RS256/ES256/none…） | **必填** |
| `typ` | 媒体类型，推荐 `JWT` | 可选 |
| `cty` | 内容类型，嵌套签名时必须为 `JWT` | 可选 |
| `kid` | 密钥 ID，JWKS 路由用 | 可选 |

> **`alg` 是 token 自报的、未受信任的元数据**。任何信任决策都必须建立在密码学校验通过的基础上（RFC 7519 §11.1）。

## 七个注册声明

RFC 7519 §4.1 预定义了 7 个 claim，**全部 OPTIONAL**，但若使用必须遵守语义：

| claim | 含义 | 校验规则 |
| --- | --- | --- |
| `iss` | 签发者（StringOrURI） | 必须等于本服务预期的可信签发方 |
| `sub` | 主体（StringOrURI，局部或全局唯一） | 应用层定义 |
| `aud` | 受众（StringOrURI 数组） | **必须**包含本服务，否则 MUST 拒绝 |
| `exp` | 过期时间（NumericDate） | 过期 MUST NOT 接受（§4.1.4） |
| `nbf` | 生效时间（NumericDate） | 之前 MUST NOT 接受 |
| `iat` | 签发时间（NumericDate） | 可判断 token 年龄 |
| `jti` | 唯一 ID | 防重放，需服务端维护已用列表 |

**NumericDate**：自 1970-01-01T00:00:00Z UTC 起的**秒数**（忽略闰秒），不是 ISO 字符串。

## 算法三族速览

| 算法族 | 算法示例 | 密钥模型 | 适用场景 |
| --- | --- | --- | --- |
| **HMAC（对称）** | HS256/HS384/HS512 | 签发 = 验证 = 同一共享密钥 | 单签发方 + 单验证方（同构单体） |
| **RSASSA-PKCS1-v1_5（非对称）** | RS256/RS384/RS512 | 私钥签 / 公钥验 | 多服务、跨组织，签发方集中 |
| **ECDSA（椭圆曲线）** | ES256/ES384/ES512 | 私钥签 / 公钥验 | 同 RS256，但密钥更短、性能更高 |
| **RSASSA-PSS（非对称概率）** | PS256/PS384/PS512 | 私钥签 / 公钥验 | RS256 的现代概率变体，安全性更强 |
| **none** | `none` | 无签名（Unsecured JWT） | RFC 7519 §6 允许但**生产禁用** |

> 分布式系统优先用 RS256/ES256：私钥只在签发方，所有验证服务只持公钥，密钥泄露面最小。HS256 共享密钥一旦泄露给每个验证方则全盘失守。

## 存储位置 trade-off

| 存储位置 | 优点 | 缺点 | OWASP 立场 |
| --- | --- | --- | --- |
| **localStorage / sessionStorage** | 简单、易读 | 任意 XSS（哪怕第三方依赖被投毒）都能读走全部凭证 | **明令禁止** |
| **HttpOnly + Secure + SameSite Cookie** | JS 不可读（`document.cookie` 拿不到），防 XSS | 自动随请求带，需配 SameSite + CSRF token 防 CSRF | **推荐**用于 Refresh Token |
| **内存（JS 变量 / app state）** | XSS 也拿不到持久态（页面刷新即丢） | 刷新页即失效，需 Refresh Token 静默续期 | **推荐**用于 Access Token |
| **`__Host-` 前缀 Cookie** | 强制 Secure + 无 Domain + Path=/，进一步收窄暴露面 | 需现代浏览器 | OWASP 推荐用于会话凭证 |

**生产推荐组合**：

- **Access Token** → 内存（JS 变量 / Pinia / Redux state），短 exp（几分钟～15 分钟）
- **Refresh Token** → `HttpOnly + Secure + SameSite=Strict` Cookie，长 exp（小时～天），配合**轮换 + 复用检测**

> 任何「把 Access Token 存 localStorage」的方案都是 OWASP 明令禁止的反模式。

## 传输头

两种主流方式：

```text
# 方式一：Authorization Bearer（jwt.io 推荐）
Authorization: Bearer eyJhbGciOi...

# 方式二：HttpOnly Cookie
Set-Cookie: access_token=eyJ...; HttpOnly; Secure; SameSite=Strict
```

| 方式 | 优点 | 缺点 |
| --- | --- | --- |
| **Bearer** | 不触发 CORS 复杂请求；前后端分离友好 | 前端需手动管理（存哪、怎么带） |
| **Cookie** | 浏览器自动随请求带 | 需防 CSRF（SameSite + CSRF token） |

## 下一步

- [深度](./guide-line.md)：Header/Payload/Signature 详解、alg 三族对比、`alg:none` 与 RS256→HS256 攻击、HttpOnly vs localStorage 深度、Refresh Token 轮换 + 复用检测、JWT vs Session、反模式
- [参考](./reference.md)：算法对比表、注册声明表、存储对比表、jsonwebtoken API 速查、官方资源
