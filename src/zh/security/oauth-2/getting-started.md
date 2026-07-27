---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 RFC 6749 / RFC 9700（BCP 284）/ RFC 7636 / RFC 6750 官方文档编写，对照 RFC 9700 现行 BCP 安全建议

## 速查

- 四种主要 grant：**Authorization Code（含 PKCE）/ Client Credentials / Refresh Token / Implicit（已废弃）**；Password grant 同样已废弃
- RFC 9700 安全基线：**所有客户端一律用 Authorization Code + PKCE（S256）**，public client MUST、confidential client RECOMMENDED
- 4 个角色：**Resource Owner（用户）/ Client（应用）/ Authorization Server（签 token）/ Resource Server（受保护资源）**
- Authorization Code：`response_type=code`，code 经 redirect_uri 的 **query** 回传；Implicit（废弃）：`response_type=token`，token 经 **fragment** 回传
- Client Credentials：`grant_type=client_credentials`，**无 user 参与、无 refresh token**，用于 M2M
- PKCE 三件套：`code_verifier`（43–128 字符、≥256 位熵）→ `code_challenge = BASE64URL(SHA256(verifier))` → `code_challenge_method=S256`
- Bearer Token 传递优先级：**Authorization 头（MUST 支持、推荐）> POST body（SHOULD NOT）> URI query（SHOULD NOT）**
- state 参数双重职责：维持请求状态 + 防 CSRF；PKCE 提供比 state 更强的 CSRF 防护（即便攻击者能读取授权响应）
- redirect_uri：**精确字符串匹配**，MUST 是绝对 URI、MUST NOT 含 fragment；唯一例外是 native app 的 localhost loopback 允许动态端口
- 完整流程见 [核心流程与最佳实践](./guide-line.md) · [参考](./reference.md)

## OAuth 2.0 是什么

OAuth 2.0 是 IETF 在 RFC 6749 定义的**第三方授权框架**。它解决的核心问题是：

> 用户 A 想让应用 B 读自己在服务 C 上的数据，但 A **不想**把在 C 上的用户名 / 密码交给 B。

OAuth 2.0 的做法是引入一个**授权服务器（AS）**做中转——A 在 C 的 AS 上点「允许 B 读我的资料」，AS 给 B 一张**短期有效的令牌（Access Token）**，B 拿这张令牌去 C 的 Resource Server 取数据。整个过程 B 拿不到 A 的密码，A 也可以随时撤销 B 的访问权。

> OAuth 2.0 是**授权**（authorization），不是**认证**（authentication）。用 OAuth 做「登录」需叠加 OpenID Connect（OIDC）——OIDC 在 OAuth 之上加 id_token 与 userinfo 端点。

## 四种主要授权流程

| Grant | response_type / grant_type | 角色 | 有 user? | 有 refresh token? | 现状 |
| --- | --- | --- | --- | --- | 推荐 |
| **Authorization Code** | `response_type=code` → `grant_type=authorization_code` | RO + Client + AS + RS | 是 | 是（可选） | **首选**，所有客户端 |
| **+ PKCE** | 同上 + `code_challenge` / `code_verifier` | 同上 | 是 | 是 | **RFC 9700 强制** |
| **Client Credentials** | `grant_type=client_credentials` | Client = RO | **否** | **否** | M2M 推荐 |
| **Refresh Token** | `grant_type=refresh_token` | Client + AS | 否（续期） | 旋转出新 RT | 推荐 |
| ~~Implicit~~ | `response_type=token` | RO + Client + AS | 是 | **否（MUST NOT）** | **RFC 9700 §2.1.2 废弃** |
| ~~Password~~ | `grant_type=password` | RO + Client + AS | 是 | 是 | **RFC 9700 §2.4 禁用** |

## 角色映射速查

| 角色 | OAuth 术语 | 例子 |
| --- | --- | --- |
| 用户 | Resource Owner | 「我」用 GitHub 账号登录第三方应用 |
| 第三方应用 | Client | 编辑器 Cursor / VS Code |
| 授权服务器 | Authorization Server (AS) | accounts.google.com / login.microsoftonline.com |
| 受保护资源 | Resource Server (RS) | api.github.com / www.googleapis.com |
| 令牌 | Access Token | Bearer JWT / opaque token |
| 权限范围 | scope | `repo read:user` |

## 端到端流程（Authorization Code + PKCE）

```text
┌──────┐      1. /authorize?response_type=code&...      ┌──────────┐
│ User │ ─────────────────────────────────────────────▶ │   AS     │
│ (RO) │                                                 │ /authorize│
└──────┘                                                 └──────────┘
     ▲ 4. callback?code=xxx&state=yyy                        │
     │                                                       │ 2. 用户登录 + 同意
┌──────┴───┐                                                  ▼
│  Client  │ 3. code 通过 redirect_uri 的 query 回传  ┌──────────┐
│ (PKCE:   │ ◀─────────────────────────────────────── │ callback │
│ verifier)│                                          └──────────┘
└──────────┘
     │
     │ 5. POST /token  grant_type=authorization_code
     │    code=xxx  code_verifier=zzz  (TLS + 客户端认证)
     ▼
┌──────────┐  6. { access_token, refresh_token?, expires_in, scope }
│   AS     │ ────────────────────────────────────────────────────────▶ Client
│ /token   │
└──────────┘
     │
     │ 7. Authorization: Bearer <access_token>
     ▼
┌──────────┐
│   RS     │ 8. 200 OK { ...资源数据... }
└──────────┘
```

> AS 在第 6 步用第 1 步存的 `code_challenge` 与第 5 步 `code_verifier` 算 SHA-256 比对，一致才发 token——这就是 PKCE 防授权码注入的核心。

## 关键参数速览

| 参数 | 端点 | 作用 |
| --- | --- | --- |
| `response_type` | /authorize | `code`（推荐）/ `token`（已废弃） |
| `client_id` | /authorize | 客户端标识 |
| `redirect_uri` | /authorize | 回调地址，**精确字符串匹配** |
| `scope` | /authorize | 空格分隔的权限 token |
| `state` | /authorize | opaque，CSRF 防护 + 维持状态 |
| `code_challenge` | /authorize | PKCE 的 challenge（S256 哈希） |
| `code_challenge_method` | /authorize | `S256`（推荐）/ `plain`（已不应使用） |
| `code_verifier` | /token | PKCE 的原始随机串 |
| `grant_type` | /token | `authorization_code` / `client_credentials` / `refresh_token` |
| `code` | /token | 一次性、短时效的授权码 |
| `refresh_token` | /token | 长期续期凭据 |
| `Authorization: Bearer xxx` | /resource | 推荐的 token 传递方式 |

## 版本现状

| RFC | 状态 | 说明 |
| --- | --- | --- |
| **RFC 6749** | 现行 Standards Track | 核心框架，2012-10 发布，安全条款已被 RFC 9700 更新 |
| **RFC 9700** | 现行 **BCP 284**（2025-01） | 废弃 Implicit / Password，强制 PKCE，**当前权威安全基线** |
| **RFC 7636** | 现行 | PKCE，是 RFC 9700 的强制依赖 |
| **RFC 6750** | 现行（被 9700 更新） | Bearer Token Usage，禁止 URI query 传递 |
| **OAuth 2.1** | **草案**（draft-15，2026-03） | 意在取代 RFC 6749/6750，**尚未成为 RFC** |

> 实操结论：**RFC 9700 是当前权威安全基线，可在现有 OAuth 2.0 系统上立即实施，无需等 OAuth 2.1 落地**。

## 下一步

- [核心流程与最佳实践](./guide-line.md)：4 种流程详解、PKCE 完整流程、Bearer Token 传递、redirect_uri 校验、state 防 CSRF、反模式
- [参考](./reference.md)：4 流程对比表、错误码大全、RFC 索引、官方资源
