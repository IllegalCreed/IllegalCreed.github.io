---
layout: doc
---

# OAuth 2.0

OAuth 2.0 是 IETF 在 RFC 6749（2012）定义的**第三方授权框架**：让用户（Resource Owner）把对自己资源（Resource Server）的有限访问权，在不交出自己凭据的前提下，委托给一个第三方应用（Client）。它通过引入一个受信任的**授权服务器（Authorization Server，AS）**签发**访问令牌（Access Token）**作为令牌化凭据，由 Client 持令牌向 RS 请求受保护资源。RFC 9700（2025-01，BCP 284）把现行最佳安全实践固化进规范，**废弃了 Implicit 与 Resource Owner Password Credentials 两种 grant**，强制所有客户端在 Authorization Code 流程上加 PKCE（RFC 7636），并通过 Bearer Token（RFC 6750）传递凭据。当前生产建议是：**所有客户端一律使用 Authorization Code + PKCE（S256）**，机器到机器通信用 Client Credentials，访问令牌用 Authorization 头传递，禁用 Implicit / Password grant。OAuth 2.1（draft-ietf-oauth-v2-1-15）仍在草案阶段，意在把 RFC 9700+PKCE 固化进核心规范取代 RFC 6749，但正式引用仍以 RFC 6749 + RFC 9700 为准。

## 评价

**优点**

- **不交凭据的委托模型**：第三方应用拿不到用户名密码，只拿到限权令牌，泄露面与可撤销性都远好于「存密码」
- **令牌化 + 短时效**：Access Token 短 TTL + Refresh Token 长期续期，被盗可即时撤销，风险窗口可控
- **scope 最小权限**：可按需申请细粒度权限（读 / 写 / 特定资源），服务端只接受所需 scope
- **PKCE 解决公开客户端安全**：原生 App / SPA 无后端也能用 Authorization Code，PKCE 把授权码绑死到客户端持有的 verifier
- **生态广泛**：GitHub / Google / Microsoft / 阿里云 / 腾讯云等几乎全部主流 IdP 都支持，OIDC 在其上扩展登录
- **BCP 9700 持续演进**：在不动核心协议的前提下用 BCP 模式更新安全建议，落地明确

**缺点**

- **协议复杂、参数多**：response_type / grant_type / code / code_verifier / state / scope / redirect_uri / audience 等参数语义与场景密集，初学者易混
- **Implicit / Password 历史包袱重**：老教程、老 IdP 文档还在推荐，新实现若没跟 RFC 9700 会留隐患
- **Bearer Token 天然不绑定发送方**：谁持有谁可用，必须叠加 mTLS / DPoP 等 sender-constraining 才能防重放
- **redirect_uri 是高发攻击面**：必须精确字符串匹配 + HTTPS + 无 fragment，前缀 / 通配符匹配会导致授权码劫持
- **不是认证协议**：用 OAuth 做「登录」需叠加 OpenID Connect，否则会被 token substitution 攻击
- **state / PKCE / iss 等防御机制多**：每种防御目标不同（CSRF / 授权码注入 / mix-up），叠加才完整，少一个就有一个对应的攻击面

## 适用场景

- **第三方应用读取用户数据**：编辑器读 GitHub 仓库、邮件客户端读 Gmail、报表工具读日历——用户授权后客户端拿令牌访问
- **机器到机器通信（M2M）**：定时任务调内部 API、微服务间互调——用 Client Credentials 直接换 token，无 user 参与
- **SSO 与联合登录（需叠加 OIDC）**：把 OAuth 作为承载层，在 authorize 请求带 `scope=openid` 由 OIDC 提供 id_token
- **移动 / SPA 应用接入 IdP**：通过 PKCE 解决公开客户端无法保密 client_secret 的难题

## 文档地址

- [RFC 6749 - The OAuth 2.0 Authorization Framework](https://datatracker.ietf.org/doc/html/rfc6749)
- [RFC 9700 - Best Current Practice for OAuth 2.0 Security (BCP 284)](https://datatracker.ietf.org/doc/html/rfc9700)
- [RFC 7636 - PKCE](https://datatracker.ietf.org/doc/html/rfc7636)
- [RFC 6750 - Bearer Token Usage](https://datatracker.ietf.org/doc/html/rfc6750)
- [OWASP OAuth 2.0 Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2Authentication_Cheat_Sheet.html)
- [OAuth 2.1 draft](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-15)

## GitHub 地址

[oauth-wg/oauth-js](https://github.com/oauth-wg/oauth-2-1) · [OpenID Foundation](https://openid.net/foundation/working-groups/oauth-2.0-working-group/)

## 幻灯片地址

<a href="/SlideStack/oauth-2-slide/" target="_blank">OAuth 2.0</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=218" target="_blank" rel="noopener noreferrer">OAuth 2.0 测试题</a>
