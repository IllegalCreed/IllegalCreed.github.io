---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 RFC 6749 / RFC 9700（BCP 284）/ RFC 7636 / RFC 6750 官方文档编写，对照 RFC 9700 现行 BCP 安全建议

## 速查

- 4 种主要 grant：**Authorization Code（含 PKCE）/ Client Credentials / Refresh Token / Implicit（已废弃）**
- Authorization Code：`response_type=code`，code 经 query 回传，**推荐 + 强制 PKCE（RFC 9700）**
- Client Credentials：`grant_type=client_credentials`，**无 user、无 refresh token**
- Refresh Token：`grant_type=refresh_token`，public client 必须 rotation 或 sender-constrain
- PKCE：`code_verifier` 43–128 unreserved（≥256 位熵）；`code_challenge_method=S256`
- Bearer Token：**Authorization 头 MUST 支持、推荐** > POST body SHOULD NOT > URI query SHOULD NOT
- 错误码：`invalid_request`=400、`invalid_token`=401、`insufficient_scope`=403
- redirect_uri：精确字符串匹配 + 绝对 URI + 无 fragment；唯一例外 native app loopback
- 现行规范：**RFC 6749 + RFC 9700（BCP 284）**；OAuth 2.1 仍为草案
- 完整说明见 [入门](./getting-started.md) / [核心流程与最佳实践](./guide-line.md)

## 4 流程对比表

| 维度 | Authorization Code | + PKCE | Client Credentials | Refresh Token | ~~Implicit~~ | ~~Password~~ |
| --- | --- | --- | --- | --- | --- | --- |
| response_type | `code` | `code` | — | — | `token` | — |
| grant_type | `authorization_code` | `authorization_code` | `client_credentials` | `refresh_token` | — | `password` |
| user 参与 | 是 | 是 | **否** | 否（续期） | 是 | 是 |
| 签发 refresh token | 可选 | 可选 | **否** | 旋转出新 | **MUST NOT** | 可选 |
| 推荐场景 | 有 user 的 web app | SPA / Mobile / Native | M2M / 服务间 | 续期 | 已废弃 | 已废弃 |
| 现状（RFC 9700） | 推荐 | **强制** | 推荐 | 推荐 | **§2.1.2 废弃** | **§2.4 MUST NOT** |
| code 回传位置 | query | query | — | — | fragment | — |

## Authorization Endpoint 参数

| 参数 | 必填 | 作用 |
| --- | --- | --- |
| `response_type` | REQUIRED | `code`（推荐）/ `token`（已废弃） |
| `client_id` | REQUIRED | 客户端标识 |
| `redirect_uri` | REQUIRED（若注册多个） | 精确字符串匹配 |
| `scope` | OPTIONAL | 空格分隔权限 |
| `state` | RECOMMENDED | CSRF 防护 + 维持状态 |
| `code_challenge` | PKCE 流程必填 | BASE64URL(SHA256(verifier)) 或 plain |
| `code_challenge_method` | PKCE 流程必填 | `S256`（推荐）/ `plain`（不推荐） |

## Token Endpoint 参数

| 参数 | 必填 | grant |
| --- | --- | --- |
| `grant_type` | REQUIRED | 所有 |
| `code` | authorization_code 必填 | authorization_code |
| `redirect_uri` | authorization_code 必填（且与 /authorize 一致） | authorization_code |
| `code_verifier` | PKCE 必填 | authorization_code + PKCE |
| `refresh_token` | refresh_token 必填 | refresh_token |
| `scope` | OPTIONAL（不得扩大原 scope） | refresh_token |
| `client_id` + 客户端认证 | REQUIRED | 所有 |

## Token 响应字段

| 字段 | 必填 | 作用 |
| --- | --- | --- |
| `access_token` | REQUIRED | 访问令牌 |
| `token_type` | REQUIRED | 通常 `Bearer` |
| `expires_in` | RECOMMENDED | 秒数 |
| `refresh_token` | OPTIONAL | Client Credentials **不签发** |
| `scope` | 实际与请求不一致时 REQUIRED | 服务端实际签发的 scope |

## Authorization Endpoint 错误码

| 错误码 | HTTP | 含义 |
| --- | --- | --- |
| `invalid_request` | 400 | 缺参数 / 重复参数 / 格式错 / redirect_uri 缺 |
| `unauthorized_client` | 400 | 客户端无权用此 response_type |
| `access_denied` | 400 | 用户或 AS 拒绝 |
| `unsupported_response_type` | 400 | AS 不支持此 response_type |
| `invalid_scope` | 400 | scope 无效 / 越界 |
| `server_error` | 500 | AS 内部错误（应返回 HTML） |
| `temporarily_unavailable` | 503 | AS 暂时不可用 |

## Token Endpoint 错误码

| 错误码 | HTTP | 含义 |
| --- | --- | --- |
| `invalid_request` | 400 | 缺参数 / 重复 / 格式错 |
| `invalid_client` | 401 | 客户端认证失败（含 `WWW-Authenticate`） |
| `invalid_grant` | 400 | code 过期 / 已用 / verifier 不匹配 / refresh_token 失效 |
| `unauthorized_client` | 400 | 客户端无权用此 grant_type |
| `unsupported_grant_type` | 400 | AS 不支持此 grant_type |
| `invalid_scope` | 400 | scope 无效 |

## Bearer Token 错误码（RFC 6750 §3.1）

| 错误码 | HTTP | 触发场景 |
| --- | --- | --- |
| `invalid_request` | **400** | 缺 token / 多个 token 来源 / 格式错 |
| `invalid_token` | **401** | token 过期 / 被吊销 / 格式错 / 签名错 |
| `insufficient_scope` | **403** | token 有效但 scope 不足 |

> RS 必须在 401 / 403 响应中带 `WWW-Authenticate: Bearer realm="...", error="...", error_description="...", scope="..."`。

## Bearer Token 三种传递方式

| 方式 | 形式 | RFC 6750 | 推荐度 |
| --- | --- | --- | --- |
| Authorization 头 | `Authorization: Bearer mF_9.B5f-4.1JqM` | §2.1 | **MUST 支持、推荐** |
| 表单 body 参数 | POST `access_token=mF_9.B5f-4.1JqM` | §2.2 | SHOULD NOT（不得 GET） |
| URI query 参数 | `?access_token=mF_9.B5f-4.1JqM` | §2.3 | SHOULD NOT（易泄露） |

## PKCE 参数速查

| 参数 | 出现位置 | 作用 |
| --- | --- | --- |
| `code_verifier` | /token 请求 | 客户端生成的随机串：43–128 字符，RFC 3986 unreserved 集，≥256 位熵 |
| `code_challenge` | /authorize 请求 | `BASE64URL(SHA256(ASCII(code_verifier)))`（S256）或与 verifier 相同（plain） |
| `code_challenge_method` | /authorize 请求 | `S256`（推荐）/ `plain`（不推荐） |

```text
code_verifier 长度: 43 ≤ len ≤ 128
字符集: ALPHA / DIGIT / "-" / "." / "_" / "~"（RFC 3986 unreserved）
熵: ≥ 256 位（推荐 32 字节随机 → base64url 编码得 43 字符）
S256 算法: code_challenge = BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))
```

> **降级检测**：客户端 MUST NOT 从 S256 降级到 plain；AS MUST 拒绝无 `code_challenge` 的请求里带 `code_verifier`。

## scope ABNF（RFC 6749 §3.3）

```text
scope       = scope-token *( SP scope-token )
scope-token = 1*NQCHAR
NQCHAR      = %x21 / %x23-5B / %x5D-7E
```

- 空格分隔（不是逗号）
- 大小写敏感
- 不可含 `"`、`\`、控制字符
- 实际签发与请求不同 MUST 回传 `scope`
- 省略时 AS 用默认值或返回 `invalid_scope`

## 客户端认证方式

| 方式 | RFC | 推荐度 | 适用 |
| --- | --- | --- | --- |
| `none` | RFC 6749 | SPA/Mobile（**必须 PKCE**） | public client |
| `client_secret_basic` | RFC 6749 §2.3.1 | 传统 | confidential client |
| `client_secret_post` | RFC 6749 §2.3.1 | 不推荐 | confidential client |
| `client_secret_jwt` | RFC 7523 | 中等 | confidential client |
| `private_key_jwt` | RFC 7523 | **推荐** | confidential client（非对称） |
| `mTLS`（TLS 客户端证书） | RFC 8705 | **推荐** | confidential client |

## 角色与端点术语

| 术语 | 全称 | 作用 |
| --- | --- | --- |
| RO | Resource Owner | 能授权访问的实体（用户） |
| Client | — | 代表 RO 访问受保护资源的应用 |
| AS | Authorization Server | 签发 token |
| RS | Resource Server | 受保护资源所在服务器 |
| UA | User Agent | 浏览器 / App 内嵌 webview |
| Authorization Endpoint | — | GET /authorize，UA 与 RO 直接交互 |
| Token Endpoint | — | POST /token，Client 与 AS 直接交互 |
| Redirect Endpoint | — | Client 接收 callback |
| Resource Endpoint | — | RS 的 API 端点 |

## RFC 索引

| RFC | 标题 | 状态 |
| --- | --- | --- |
| **RFC 6749** | The OAuth 2.0 Authorization Framework | 现行（核心） |
| **RFC 9700** | Best Current Practice for OAuth 2.0 Security（BCP 284） | 现行（**安全基线**） |
| **RFC 7636** | PKCE | 现行 |
| **RFC 6750** | Bearer Token Usage | 现行（被 9700 更新） |
| RFC 7662 | Token Introspection | 现行 |
| RFC 8252 | OAuth 2.0 for Native Apps | 现行 BCP |
| RFC 8705 | mTLS Client Authentication | 现行 |
| RFC 8707 | Resource Indicators (audience) | 现行 |
| RFC 9068 | JWT Access Tokens | 现行 |
| RFC 9126 | PAR (Pushed Authorization Requests) | 现行 |
| RFC 9101 | JAR (JWT-Secured Authorization Requests) | 现行 |
| RFC 9396 | Rich Authorization Requests | 现行 |
| RFC 9449 | DPoP | 现行 |
| RFC 8628 | Device Flow | 现行 |
| draft-ietf-oauth-v2-1-15 | OAuth 2.1 | **草案**（2026-03） |

## 关键 RFC 速记

- **RFC 9700（BCP 284，2025-01）**：当前权威安全基线；废弃 Implicit（§2.1.2）、Password（§2.4）；强制 PKCE；推荐 sender-constraining
- **RFC 6749（2012-10）**：核心框架；4 种 grant、refresh、scope、state、redirect_uri；安全条款已被 9700 更新
- **RFC 7636（2015）**：PKCE；S256 vs plain；code_verifier 43–128 unreserved
- **RFC 6750（2012-10）**：Bearer Token；三种传递方式；error 码

## 版本演进时间线

| 时间 | 事件 |
| --- | --- |
| 2012-10 | RFC 6749 / RFC 6750 发布，OAuth 2.0 正式标准化 |
| 2015 | RFC 7636 PKCE 发布 |
| 2018 | RFC 8252 Native Apps BCP |
| 2019 | RFC 8705 mTLS、RFC 8628 Device Flow |
| 2022 | RFC 9068 JWT Access Token、RFC 9126 PAR |
| 2023 | RFC 9396 Rich Authorization Requests、RFC 9449 DPoP |
| **2025-01** | **RFC 9700（BCP 284）发布，废弃 Implicit / Password，强制 PKCE** |
| 2026-03 | OAuth 2.1 draft-15（仍是草案） |

## 与相邻主题的边界

- **OIDC（OpenID Connect）**：在 OAuth 之上加 `id_token` 与 `/userinfo`，是**认证**协议；nonce / `at_hash` / `iss` 属 OIDC 范畴
- **Token Introspection（RFC 7662）**：RS 反向查询 AS 验证 token，属 RS-AS 协议
- **JWT Access Token（RFC 9068）**：token 的格式，不限定 token 用法
- **PAR / JAR / RAR（RFC 9126/9101/9396）**：授权请求的安全增强扩展
- **Device Flow（RFC 8628）**：受限设备（智能电视 / CLI）的认证流程
- **客户端库**（openid-client / passport-oauth2 / @react-oauth/oidc）：协议的具体实现

> 本主题聚焦 RFC 6749 / 9700 / 7636 / 6750 的核心授权框架与安全基线；OIDC / introspection / JAR / device flow 属相邻主题，仅作为防御机制引用。

## 官方资源

- RFC 6749：[datatracker.ietf.org/doc/html/rfc6749](https://datatracker.ietf.org/doc/html/rfc6749)
- RFC 9700：[datatracker.ietf.org/doc/html/rfc9700](https://datatracker.ietf.org/doc/html/rfc9700)
- RFC 7636：[datatracker.ietf.org/doc/html/rfc7636](https://datatracker.ietf.org/doc/html/rfc7636)
- RFC 6750：[datatracker.ietf.org/doc/html/rfc6750](https://datatracker.ietf.org/doc/html/rfc6750)
- OAuth 2.1 草案：[datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-15](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-15)
- OWASP OAuth 2.0 Cheat Sheet：[cheatsheetseries.owasp.org/cheatsheets/OAuth2Authentication_Cheat_Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2Authentication_Cheat_Sheet.html)
- IETF OAuth WG：[datatracker.ietf.org/wg/oauth/documents](https://datatracker.ietf.org/wg/oauth/documents/)
- OAuth.com（Auth0 维护）：[oauth.com/2](https://www.oauth.com/oauth2/)
