---
layout: doc
outline: [2, 3]
---

# 核心流程与最佳实践

> 基于 RFC 6749 / RFC 9700（BCP 284）/ RFC 7636 / RFC 6750 官方文档编写，对照 RFC 9700 现行 BCP 安全建议

## 速查

- **Authorization Code + PKCE（S256）是所有客户端的首选**（RFC 9700 §2.1）
- Implicit / Password grant 已废弃（RFC 9700 §2.1.2 / §2.4），**MUST NOT / SHOULD NOT 在新实现使用**
- PKCE：`code_verifier`（43–128 unreserved、≥256 位熵）→ `code_challenge = BASE64URL(SHA256(ASCII(verifier)))`；**严禁从 S256 降级到 plain**
- Bearer Token：**Authorization 头（MUST 支持、推荐）> POST body（SHOULD NOT）> URI query（SHOULD NOT）**
- redirect_uri：**精确字符串匹配**，MUST 绝对 URI、MUST NOT 含 fragment；唯一例外是 native app loopback 动态端口
- state：**一次性 + 绑定 session + 签名防篡改**；PKCE 提供比 state 更强的 CSRF 防护（即便攻击者能读取授权响应）
- scope：空格分隔、大小写敏感；实际签发与请求不同时 **MUST 在响应中回传 scope**
- Refresh Token：public client 必须 sender-constrained（DPoP/mTLS）或启用 rotation；confidential client 推荐 private_key_jwt/mTLS
- 反模式：localStorage 长期存 access token / 前缀匹配 redirect_uri / 开放重定向器 / authorization endpoint 开 CORS

## Authorization Code Flow（含 PKCE）

### 适用场景

- 有 user 参与的第三方授权（GitHub OAuth App、Google 登录、微软账号）
- SPA / Mobile / Native App（必须加 PKCE，无 client_secret 可保管）
- 任何「需要 user agent（浏览器）」走完登录同意的流程

### 端到端时序

```text
1. 客户端生成 code_verifier（43~128 字符，RFC3986 unreserved 集，≥256 位熵）
2. 算 code_challenge = BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))
3. 浏览器跳转 GET /authorize?response_type=code
                          &client_id=...
                          &redirect_uri=https://app.example.com/cb
                          &scope=read write
                          &state=<随机一次性>
                          &code_challenge=...
                          &code_challenge_method=S256
4. AS 验 client_id 与 redirect_uri 匹配，存 code_challenge，让 user 登录 + 同意 scope
5. AS 回 302 → https://app.example.com/cb?code=xxx&state=<原值>
6. 客户端校验 state == 步骤 3 的值
7. POST /token  grant_type=authorization_code
                code=xxx
                redirect_uri=https://app.example.com/cb
                code_verifier=<步骤 1 的原值>
                （+ client 认证：HTTP Basic / body 参数 / mTLS / private_key_jwt）
8. AS 算 BASE64URL(SHA256(ASCII(verifier))) == 步骤 2 存的 code_challenge？
   一致 → 发 token；不一致 → invalid_grant
9. 响应 JSON：{ access_token, token_type:"Bearer", expires_in, refresh_token?, scope }
```

### PKCE 的核心防御

PKCE（Proof Key for Code Exchange，RFC 7636）把授权码 `code` **绑死**到客户端持有的 `code_verifier`：

- 攻击者即使通过日志 / Referer / 恶意 redirect 拿到 `code`，没有 `code_verifier` 也无法在 /token 兑换
- 同时提供强于 state 的 CSRF 防护——即便攻击者能读取授权响应（state 也能拿到），仍然过不了 verifier 校验

```bash
# 用 Node 算 PKCE（参考 RFC 7636 Appendix B）
node -e '
const crypto = require("crypto");
const verifier = crypto.randomBytes(32).toString("base64url");  // 43 字符
const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
console.log({ verifier, challenge });'
```

### state 参数的双重职责

| 职责 | 实现 |
| --- | --- |
| 维持请求与回调间的状态 | 把「用户原始请求路径」「流程上下文」编码进 state，回调后还原 |
| 防 CSRF | 攻击者无法构造合法 state → 用户请求的 callback 与攻击者诱导的 callback 区分开 |

**state 必须满足**：一次性使用、随机、绑定 user-agent session、必要时签名防篡改。

## Client Credentials Flow（服务间通信）

### 适用场景

- **机器到机器（M2M）**：定时任务调内部 API、微服务互调、CI 调部署 API
- 客户端**访问自己的资源**，不是用户的资源——无 Resource Owner 参与
- **不签发 refresh token**（RFC 6749 §4.4.3），过期就重新换一张

### 请求格式

```bash
POST /token HTTP/1.1
Host: as.example.com
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0MUwzWHN3RUd5dA==  # client_id:client_secret
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&scope=read write
```

### 响应

```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "read write"
}
```

> 注意：**没有 `refresh_token` 字段**。客户端缓存 token 直到 `expires_in - buffer`，过期前重新换。

### 客户端认证优先级

| 方式 | 适用 | RFC |
| --- | --- | --- |
| `private_key_jwt`（非对称） | confidential client，**推荐** | RFC 7521 |
| `mTLS`（TLS 客户端证书） | confidential client，**推荐** | RFC 8705 |
| `client_secret_basic`（HTTP Basic） | confidential client，传统 | RFC 6749 |
| `client_secret_post`（body 参数） | 不推荐（易进日志） | RFC 6749 |
| `none`（public client） | SPA / Mobile，**必须配 PKCE** | RFC 6749 |

> **绝不要把 client_secret 放进前端 / 移动端**——会泄露。confidential client 改用非对称认证（private_key_jwt/mTLS）。

## Refresh Token Flow

### 设计目的

- 避免长期保存用户凭据（用户名 / 密码）
- Access token 过期后无需用户再次授权即可续期
- 让 access token 保持短 TTL（降低泄露风险）

### 请求格式

```bash
POST /token HTTP/1.1
grant_type=refresh_token
&refresh_token=<之前拿到的 RT>
&scope=read           # 不得扩大原 scope，可缩小或省略
```

### Rotation 与 sender-constraining

| 机制 | 适用 | 说明 |
| --- | --- | --- |
| **Rotation**（推荐 public client） | SPA / Mobile | 每次刷新签发新 RT 并失效旧 RT；重放旧 RT 时触发告警 |
| **DPoP**（RFC 9449） | 任何客户端 | 用客户端私钥对请求签名，绑定 token 到具体 client |
| **mTLS**（RFC 8705） | confidential client | token 绑定到 TLS 客户端证书，被盗无法在其它 TLS 上下文使用 |

> RFC 9700 §2.2.2：**public client 的 refresh token 必须 sender-constrained 或启用 rotation**。

## Implicit Flow（已废弃）

### 为什么废弃（RFC 9700 §2.1.2）

- access token 通过 redirect_uri 的 **URI fragment** 回传（`#access_token=...`），会泄露到：
  - 浏览器历史
  - Referer header（外链跳转时）
  - 反向代理 / CDN 访问日志
- 无法 sender-constrain（fragment 暴露给所有能读 JS 的脚本）
- 无法防 token injection（任意站可往回灌 token）
- **MUST NOT 签发 refresh token**（RFC 6749 §4.2.2）

### 与 Authorization Code 的回传位置差异

| 流程 | response_type | 回传位置 | 字段 |
| --- | --- | --- | --- |
| Authorization Code | `code` | redirect_uri 的 **query** (`?code=xxx`) | code（一次性，需到 /token 兑换） |
| ~~Implicit~~ | `token` | redirect_uri 的 **fragment** (`#access_token=xxx`) | access_token（直接拿到） |

> 主流 IdP（Google / Microsoft / GitHub / Auth0）已禁用 Implicit grant。新实现**一律用 Authorization Code + PKCE**。

## Bearer Token（RFC 6750）

### 三种传递方式与安全级别

| 方式 | 头部 / 位置 | RFC | 推荐度 |
| --- | --- | --- | --- |
| **Authorization 头** | `Authorization: Bearer <token>` | §2.1 | **MUST 支持、推荐** |
| 表单 body 参数 | `access_token=xxx`（POST 表单） | §2.2 | SHOULD NOT（不得用于 GET） |
| URI query 参数 | `?access_token=xxx` | §2.3 | SHOULD NOT（易泄露） |

### 为何禁止 URI query 传递

URI query 会进入：

- 浏览器**历史**
- Web 服务器**访问日志**
- CDN / 反向代理**日志**
- 第三方跳转时的 **Referer** header

泄露面远大于 Authorization 头部。若不得不用 body 也只能 POST 表单，**绝不 GET**，且必须配 `Cache-Control: no-store`。

### WWW-Authenticate 响应头

资源请求失败时 RS 应返回 401 + WWW-Authenticate：

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="api.example.com",
                          error="invalid_token",
                          error_description="The access token expired"
```

### 错误码与 HTTP 状态映射

| 错误码 | HTTP 状态 | 含义 |
| --- | --- | --- |
| `invalid_request` | 400 | 缺参数 / 重复参数 / 格式错 |
| `invalid_token` | **401** | token 过期 / 被吊销 / 格式错 |
| `insufficient_scope` | **403** | token 有效但 scope 不足 |

## scope 参数

### ABNF（RFC 6749 §3.3）

```text
scope       = scope-token *( SP scope-token )
scope-token = 1*NQCHAR
NQCHAR      = %x21 / %x23-5B / %x5D-7E   ; 排除 " 与反斜杠
```

特点：

- 空格分隔（`read write`，不是逗号）
- **大小写敏感**
- 不可含 `"`, `\`, 控制字符

### 服务端行为

- AS 可**部分忽略**请求的 scope（仅签发支持的）
- 实际签发与请求**不同时 MUST 在响应中回传 scope**
- 客户端**省略 scope 时**：AS 用默认值或返回 `invalid_scope`
- 完整审批的 scope 由 AS 配置决定

> scope 是字符串权限标识，与 OIDC 的 `scope=openid`、RBAC/ABAC 模型不同。细粒度权限建议用 RFC 9396 `authorization_details`。

## redirect_uri 校验

### RFC 9700 §2.1 精确字符串匹配规则

- **MUST 用精确字符串比对**（RFC 3986 §6.2.1）——不做 normalize、不做前缀、不做正则、不做通配
- **MUST 是绝对 URI**
- **MUST NOT 含 fragment**
- 唯一例外：**native app loopback**（`http://127.0.0.1` / `http://[::1]`）允许动态端口（RFC 8252 §7.3）
- 推荐 HTTPS（localhost 除外）

### 为什么禁止前缀 / 通配符匹配

**攻击场景**：若 AS 允许前缀匹配 `https://app.example.com/`，攻击者可：

1. 注册 `https://app.example.com.evil.com/`（前缀命中）
2. 或利用受害者域上的开放重定向器：`https://app.example.com/redirect?next=https://evil.com/cb`
3. 让用户的 `code` 被重定向到攻击者控制的域 → 攻击者用 PKCE 验证

> **明确禁止 AS 暴露开放重定向器**（RFC 9700 §2.1）——否则即便精确匹配也能被绕过。

## state 防 CSRF（含 PKCE 对比）

| 防御机制 | 主要目标 | 为何需要 |
| --- | --- | --- |
| `state` | CSRF（攻击者诱导用户走完他人 flow） | 一次性 + 绑定 user-agent，攻击者无法构造合法值 |
| `PKCE`（S256） | 授权码注入 + 更强 CSRF | 即便攻击者能读取授权响应（拿到 state 与 code），没 verifier 仍无法兑换 |
| `iss`（OIDC） | mix-up attack（多 AS 回调混淆） | 让客户端确认 callback 来自哪个 AS |
| `nonce`（OIDC） | token injection 到 ID Token | 通过 `at_hash` 绑定 id_token 与 access_token |

> **PKCE 与 state 应同时使用而非二选一**——各机制防御目标不同，纵深防御叠加才完整。

## 反模式（避坑）

### 禁止的实践

- **使用 Implicit Grant**（`response_type=token`）：fragment 泄露 / 无法 sender-constrain / 无法防 token injection，已被 RFC 9700 §2.1.2 移除
- **使用 Resource Owner Password Credentials**：把用户名密码直接交给 client，无法支持 MFA / WebAuthn，**RFC 9700 §2.4 MUST NOT use**
- **PKCE 用 plain 或从 S256 降级到 plain**：plain 不防请求观测者；S256 被拒只可能是 AS 故障或 MITM，**MUST NOT 降级**
- **把 access_token 放 URL query**：进入日志 / 历史 / Referer
- **redirect_uri 用前缀 / 通配符匹配**：开放重定向攻击
- **state 用静态 / 可预测 / 多次复用值**：失去 CSRF 防护
- **authorization endpoint 开启 CORS**：RFC 9700 §2.1 明确禁止
- **confidential client 把 client_secret 放前端 / 移动端**：会泄露

### Token 存储反模式

| 反模式 | 风险 | 推荐替代 |
| --- | --- | --- |
| 前端 JS 把 access_token 存 localStorage 长期持有 | XSS 可直接窃取 | 短 TTL token + Refresh Rotation |
| 把 access_token 放 URL | 进日志 / Referer | Authorization 头 |
| 把 client_secret 放 SPA / App | 反编译即可窃取 | PKCE / Backend-for-Frontend（BFF）/ HttpOnly Cookie |

> 推荐 Backend-for-Frontend（BFF）模式：前端只持有 HttpOnly Cookie，由 BFF 后端保管 token；参考 OWASP Session Management Cheat Sheet。

## 部署检查清单

新接入 OAuth 2.0 时按下列清单逐项确认：

- [ ] 所有客户端使用 Authorization Code + PKCE（S256）
- [ ] state 一次性、绑定 session、签名防篡改
- [ ] redirect_uri 精确字符串匹配，HTTPS（localhost 除外）
- [ ] Bearer Token 通过 Authorization 头传递
- [ ] Access Token 短 TTL（≤1h）
- [ ] Refresh Token 启用 Rotation 或 sender-constraining
- [ ] confidential client 用 private_key_jwt/mTLS，不放对称密钥到客户端
- [ ] Authorization endpoint 关 CORS（仅 token/metadata endpoint MAY 开）
- [ ] AS 防止 PKCE 降级（无 challenge 时 token 请求带 verifier 必须拒绝）
- [ ] 不暴露开放重定向器
- [ ] IdP 已禁用 Implicit / Password grant

## 下一步

- [参考](./reference.md)：4 流程对比表、错误码大全、RFC 索引、官方资源
