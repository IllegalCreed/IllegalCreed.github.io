---
layout: doc
outline: [2, 3]
---

# 深度

> 基于 RFC 7519（JWT）/ RFC 7515（JWS）/ RFC 8725（JWT BCP）/ RFC 9700（OAuth 2.0 Security BCP）/ OWASP Session Management / jwt.io 官方文档编写

## 速查

- **Header**：`alg`（必填）/ `typ` / `cty` / `kid`，`alg` 是 token 自报的不可信元数据
- **Payload**：7 个注册 claim（iss/sub/aud/exp/nbf/iat/jti，全部 OPTIONAL）+ 自定义 claim
- **Signature**：`HMACSHA256(base64UrlEncode(header)+'.'+base64UrlEncode(payload), secret)`（HS256）；非对称用私钥签、公钥验
- **alg 三族**：HS256（HMAC 对称，单一密钥）/ RS256（RSA 非对称，私签公验）/ ES256（ECDSA，密钥更短）/ `none`（无签名，生产禁用）
- **alg:none 攻击**：服务端若信任 token 自报的 alg=none，会跳过验签，攻击者可伪造任意 token
- **RS256→HS256 算法混淆**：篡改 alg 让服务端把 RSA 公钥当 HMAC 密钥验签 → 防御 = `verify()` 显式传 `algorithms` 白名单
- **exp**：NumericDate（UTC 秒），过期后 RFC 7519 §4.1.4 MUST NOT 接受
- **payload 不加密**：仅 Base64URL 编码，敏感数据必须用 JWE
- **存储**：禁止 localStorage（OWASP 明令）→ Access Token 放内存 / Refresh Token 放 `HttpOnly + Secure + SameSite=Strict` Cookie
- **Refresh Token 轮换**：每次刷新发新并吊销旧；检测到旧 token 再提交时立即吊销整条 token family（RFC 9700 / Auth0）
- **JWT vs Session**：JWT 无状态易扩展但 exp 前无法单方面吊销；Session 可即时吊销但需共享存储（Redis）
- **反模式**：decode() 当校验、长 exp Access Token 无吊销、固定 Refresh Token 不轮换、HS256 共享密钥分发到每个微服务

## Header 详解（JOSE Header）

JOSE Header 是 token 的元数据头，决定「这条 token 用什么算法、什么类型、用哪个密钥验」。

| 字段 | 含义 | 取值示例 | 必填 |
| --- | --- | --- | --- |
| `alg` | 签名 / MAC 算法 | `HS256` / `RS256` / `ES256` / `PS256` / `none` | **必填** |
| `typ` | 媒体类型 | `JWT`（推荐） | 可选 |
| `cty` | 内容类型 | 嵌套签名时必须为 `JWT` | 可选 |
| `kid` | 密钥 ID | JWKS 端点路由用 | 可选 |
| `jku`/`x5u`/`x5c` | JWKS / X.509 URL | 需服务端白名单，否则注入风险 | 可选 |

**`alg` 取值全览**：

| 算法族 | 算法 | 密钥模型 | RFC 7518 实现要求 |
| --- | --- | --- | --- |
| HMAC（对称） | HS256 / HS384 / HS512 | 共享密钥 | **MUST** |
| RSASSA-PKCS1-v1_5 | RS256 / RS384 / RS512 | 私签公验 | RECOMMENDED |
| ECDSA | ES256 / ES384 / ES512 | 私签公验 | RECOMMENDED |
| RSASSA-PSS | PS256 / PS384 / PS512 | 私签公验 | OPTIONAL |
| Unsecured | `none` | 无签名 | RFC 7519 §6 允许，**生产禁用** |

> **关键安全属性**：`alg` 头字段本身是 token 自报的、未受信任的元数据。所有信任决策都必须建立在密码学校验通过的基础上（RFC 7519 §11.1）。生产实践：`verify()` **必须**显式传 `algorithms` 白名单（如 `['RS256']`），不传或允许 `none` 都是致命漏洞。

## Payload 详解（claim 集合）

Payload 是 claim（key-value）集合，承载实际业务信息。

### 七个注册 claim（RFC 7519 §4.1，全部 OPTIONAL）

| claim | 全称 | 类型 | 校验规则 |
| --- | --- | --- | --- |
| `iss` | Issuer | StringOrURI | 必须等于本服务预期的可信签发方 |
| `sub` | Subject | StringOrURI | 应用层定义，局部或全局唯一 |
| `aud` | Audience | StringOrURI / 数组 | **必须**包含本服务，不匹配 MUST 拒绝 |
| `exp` | Expiration Time | NumericDate | 过期 MUST NOT 接受（§4.1.4） |
| `nbf` | Not Before | NumericDate | 生效前 MUST NOT 接受 |
| `iat` | Issued At | NumericDate | 签发时间，可判断 token 年龄 |
| `jti` | JWT ID | String | 唯一 ID，防重放，需服务端维护已用列表 |

**类型说明**：

- **NumericDate**：自 1970-01-01T00:00:00Z UTC 起的**秒数**（忽略闰秒）。`exp`/`nbf`/`iat` 都用此类型，**不是 ISO 字符串**。
- **StringOrURI**：含 `:` 必须是 URI，按大小写敏感比较。
- **JSON 类型**：claim 值可以是任意 JSON 类型（字符串 / 数字 / 布尔 / 对象 / 数组）。

### 私有 claim 与公私 claim 区分

- **注册 claim**：RFC 7519 §4.1 定义的 7 个（iss/sub/aud/exp/nbf/iat/jti）
- **公 claim**：IANA JWT Token Registry 注册或冲突避免命名空间（URI 形式，如 `https://example.com/jwt/claims/role`）
- **私 claim**：自定义短名（如 `name`、`role`、`admin`），消费者需协调一致

> **重要**：**敏感数据不要放 payload**。JWT 默认只签名不加密（JWS），payload 仅 Base64URL 编码，任何拿到 token 的人都能 decode 看到内容；要保密必须用 JWE（RFC 7516）加密或 TLS 之外的额外保护。

## Signature 详解

Signature 是按 `header.alg` 算法对前两段做的密码学校验和，是 JWT 防篡改的核心。

### 签名构造公式

```text
# HS256（HMAC 对称）
Signature = HMACSHA256(
  base64UrlEncode(header) + '.' + base64UrlEncode(payload),
  secret
)

# RS256（RSA 非对称）
# 签发：用私钥签
Signature = RS256_sign(
  base64UrlEncode(header) + '.' + base64UrlEncode(payload),
  privateKey
)
# 验证：用公钥验
ok = RS256_verify(header.payload, signature, publicKey)
```

### 三大算法族深度对比

| 维度 | HS256（HMAC） | RS256（RSA） | ES256（ECDSA） |
| --- | --- | --- | --- |
| 对称性 | 对称（共享密钥） | 非对称（私签公验） | 非对称（私签公验） |
| 密钥分发 | 签发方 = 验证方 = 同一密钥 | 私钥只在签发方，公钥可公开 | 同 RS256 |
| 密钥长度 | 256 bit | 2048 bit | 256 bit（曲线 P-256） |
| 签名长度 | 32 字节 | 256 字节 | 64 字节 |
| 性能 | 验证快（HMAC 是对称） | 签名慢、验证中等 | 签名快、验证中等 |
| 多服务场景 | **危险**：密钥扩散到每个验证方，任一泄露全盘失守 | **推荐**：验证方只持公钥 | **推荐**：同 RS256，密钥更短 |
| 典型场景 | 单体应用、签发与验证同一服务 | 多服务、跨组织、OIDC | 移动端、IoT（密钥短） |

> **分布式系统优先用非对称（RS256/ES256）**：私钥只在签发方，所有验证服务只持公钥，密钥泄露面最小。HS256 的共享密钥一旦泄露给每个验证微服务，任一服务被攻破即全盘沦陷。

### `alg:none` 攻击（Unsecured JWT）

RFC 7519 §6 定义了 `alg: none` 的 Unsecured JWT——只有 header 和 payload，没有 signature。它用于完全信任传输环境的场景（如内网已加密通道）。

**攻击原理**：

1. 攻击者拿到一条合法 JWT
2. 把 header 改成 `{"alg":"none","typ":"JWT"}`，payload 改成任意内容（如 `{"sub":"admin","role":"superuser"}`）
3. 拼成 `header.payload.`（最后一段空）
4. 若服务端 `verify()` 不传 `algorithms` 白名单，或显式接受 `none`，**会跳过验签直接信任** payload
5. 攻击者以 admin 身份操作

**防御**：

- `verify()` **必须**显式传 `algorithms` 白名单（如 `['RS256']`）
- 生产实现普遍在 `algorithms` 默认列表里**禁用** `none`
- 永不信任 token 自报的 `alg`，所有信任决策必须建立在密码学校验通过的基础上（RFC 8725 §3.1）

### RS256→HS256 算法混淆攻击

**攻击原理**（典型场景：服务端原本用 RS256，公钥公开可拿）：

1. 攻击者下载服务端的 RSA 公钥（JWKS 端点公开）
2. 把 header 改成 `{"alg":"HS256","typ":"JWT"}`
3. 把 payload 改成任意内容
4. 用 RSA 公钥的字符串形式当作 HMAC 的 secret，算 HS256 签名
5. 拼成新 token 发回服务端
6. 若服务端 `verify()` 不传 `algorithms`，库会按 key 类型推断 → 服务端拿到 RSA 公钥 + 看到 `alg=HS256` → 把公钥当 HMAC secret 验签 → **验签通过**
7. 攻击者以任意身份操作

**防御**：

- `verify(token, publicKey, { algorithms: ['RS256'] })`——**显式传白名单**
- 这是防御算法混淆攻击的**唯一可靠手段**（RFC 8725 §3.1）
- 即便库「会按 key 类型推断」，也不能依赖——显式白名单才是密码学契约

## 存储位置深度：HttpOnly Cookie vs localStorage

这是 JWT 安全的最争议话题，OWASP 与 jwt.io 都有明确立场。

### localStorage / sessionStorage（**OWASP 明令禁用**）

- **优点**：简单、前端 JS 可读可写
- **致命缺点**：对页面内**任何** JS（含被注入的恶意脚本、第三方依赖被投毒）**完全可读**
- **后果**：任何 XSS（哪怕一个 npm 依赖被投毒）即可 `localStorage.getItem('token')` 拖走全部凭证
- **OWASP 立场**：[Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) **明令禁止**

### HttpOnly + Secure + SameSite Cookie（**推荐**用于 Refresh Token）

- **HttpOnly**：JS 不可读 `document.cookie`，**只受 CSRF 威胁**
- **Secure**：仅 HTTPS 传输
- **SameSite=Strict**：跨站不带 Cookie，**几乎免疫 CSRF**
- **`__Host-` 前缀**：强制 Secure + 无 Domain + Path=/，进一步收窄暴露面（OWASP 推荐用于会话凭证）
- **缺点**：自动随请求带，跨子域需调 Domain

### 内存（JS 变量 / app state）（**推荐**用于 Access Token）

- **优点**：XSS 也拿不到持久态（页面刷新即丢）
- **缺点**：刷新页即失效，需 Refresh Token 静默续期

### 生产推荐组合

| Token 类型 | 存储位置 | exp | 备注 |
| --- | --- | --- | --- |
| **Access Token** | 内存（JS 变量 / Pinia / Redux） | 几分钟 ~ 15 分钟 | 短 exp，被盗窗口小 |
| **Refresh Token** | `HttpOnly + Secure + SameSite=Strict` Cookie | 小时 ~ 天 | JS 不可读，配轮换 + 复用检测 |

> 为什么不放 localStorage？因为 XSS 攻击面太大——一个 npm 依赖被投毒、一个第三方 script 被劫持，都能瞬间拖走所有用户凭证。HttpOnly Cookie 把这部分风险压到 CSRF，而 CSRF 可由 SameSite + CSRF token 缓解。

## Refresh Token 轮换与复用检测

短 Access Token 是基础，但用户不能每 15 分钟重新登录——所以需要 Refresh Token 续期。但**固定不变的 Refresh Token 一旦被盗，攻击者可在用户不知情下无限续期**，因此必须**轮换 + 复用检测**。

### 轮换（Rotation）

每次使用 Refresh Token 都签发**新的 Refresh Token** 并**吊销旧的**。攻击者即使盗了某次 Refresh Token，也只能用一次——下次合法用户使用新 token 时，攻击者手中的旧 token 已被吊销。

### 复用检测（Reuse Detection）

当检测到**已轮换的旧 Refresh Token 被再次提交**时，**立即吊销整条 token 链（token family）**——包括当前所有有效 token。这是 RFC 9700 / Auth0 推荐的复用检测机制。

**逻辑**：

- 「合法用户用新 token」+「攻击者用旧 token」同时出现 = token 链已被分叉 = 必有攻击者
- 立即吊销整个 family，强制用户重新认证

### 流程图

```text
用户登录 → 签发 AT1 + RT1
        ↓
        AT1 过期 → 用 RT1 换 AT2 + RT2，吊销 RT1
        ↓
        AT2 过期 → 用 RT2 换 AT3 + RT3，吊销 RT2
        ↓
        攻击者用 RT1 提交 → 服务端发现 RT1 已被吊销
        ↓
        立即吊销整个 family（RT1/RT2/RT3 + 所有 AT）→ 强制重新登录
```

> 这是当代 Refresh Token 安全的标配。固定不变的 Refresh Token + 长 exp 是高危反模式。

## JWT vs Session

| 维度 | JWT | Session（服务端会话） |
| --- | --- | --- |
| 状态 | 无状态（claim 自包含） | 有状态（服务端存 session store） |
| 即时吊销 | 困难（exp 前无法单方面失效，除非维护 blocklist） | 简单（删 session 即可） |
| 横向扩展 | 无需共享存储，天然分布式 | 需共享存储（Redis / sticky session） |
| 跨域 / 跨端 | 天然适合（Bearer 头，SSO/移动端友好） | 受 Cookie 同源策略约束 |
| Token 体积 | 大（几百字节起） | 小（16 字节随机串） |
| 续期 | Refresh Token 轮换 | 滑动过期 |
| 细粒度控制 | 难（claim 在签发时定死） | 易（每次请求实时查权限） |
| 典型场景 | API 授权、SSO、OIDC、服务间调用 | 传统 Web 应用、需即时吊销 |

**生产常见混合方案**：

- **opaque token + Redis 后端**：token 是 16 字节随机串（非 JWT），服务端在 Redis 查权限——既可即时吊销又支持分布式
- **短 exp JWT + blocklist**：JWT 短 exp（几分钟），需要吊销时把 jti 写入 Redis 黑名单，验证方多一次查询
- **JWT 用作 Access Token + Session 思路管 Refresh Token**：AT 走 JWT 无状态，RT 走服务端 session 思路有状态可即时吊销

> JWT 不是「session 替代品」，而是「跨信任方传输已签名 claim」的凭证。需要即时吊销、细粒度权限控制的场景，应优先考虑服务端会话或上述混合方案。

## jsonwebtoken API 速查

### sign(payload, secretOrPrivateKey, options)

```ts
import jwt from "jsonwebtoken";

const token = jwt.sign(
  { userId: 123, role: "admin" },
  process.env.JWT_SECRET,
  {
    algorithm: "HS256", // 默认 HS256
    expiresIn: "15m", // 写入 exp（NumericDate）
    notBefore: "0s", // 写入 nbf
    audience: "my-api", // 写入 aud
    issuer: "auth.example.com", // 写入 iss
    subject: "123", // 写入 sub
    jwtid: crypto.randomUUID(), // 写入 jti
  }
);
```

**坑**：不能在 `payload` 和 `options` 中重复设置同一 claim（如 `exp`、`aud`），否则报错。

### verify(token, secretOrPublicKey, options)

```ts
const payload = jwt.verify(token, publicKey, {
  algorithms: ["RS256"], // ★ 必传白名单，防御 alg:none 与算法混淆
  audience: "my-api", // 校验 aud
  issuer: "auth.example.com", // 校验 iss
  subject: "123", // 校验 sub
  jwtid: "...", // 校验 jti
  ignoreExpiration: false, // 默认 false，过期即拒绝
  ignoreNotBefore: false, // 默认 false
  clockTolerance: 5, // ★ 秒，处理时钟偏移
  maxAge: "7d", // 拒绝签发超过 7 天的 token（即使未过期）
});
```

**关键参数**：

- `algorithms`：白名单数组，**必传**——这是防御 alg:none 与 RS256→HS256 攻击的唯一可靠手段
- `clockTolerance`：秒数，处理多机时钟漂移误判
- `ignoreExpiration`：默认 `false`，过期即拒绝
- `audience`/`issuer`/`subject`/`jwtid`：claim 校验

### decode(token, options)

```ts
const payload = jwt.decode(token); // 仅 Base64URL 解码，不验签
```

**重要**：`decode()` **不验签**，不能用于不可信输入。任何来自不可信源的 token 必须用 `verify()`。

## 反模式（避坑）

- **把 JWT 存 localStorage / sessionStorage**：任意 XSS（哪怕一个第三方依赖被投毒）即可拖走全部凭证；OWASP 明令禁止
- **`verify()` 不传 `algorithms` 白名单或允许 `alg:none`**：直接落入 alg:none 伪造和 RS256→HS256 算法混淆攻击，token 完全失控
- **把 JWT 当 session 用却希望「立刻吊销某用户」**：JWT 在 exp 前服务端无法单方面失效（除非维护 blocklist/黑名单，那就抵消了无状态优势），需要即时吊销应改用服务端会话或短 exp+吊销列表
- **误以为 JWT payload 是加密的**：它只是 Base64URL 编码，任何人 `decode()` 即可读明文；放密码 / 身份证号 / 手机号等于裸奔
- **用 HS256 并把共享密钥分发给每个验证微服务**：密钥扩散面大，任一服务泄露即全盘沦陷；多服务场景应改用 RS256/ES256
- **Refresh Token 不轮换、长期有效**：一旦被窃可无限续期，且合法用户与攻击者各自持有一份时无法察觉
- **长 exp（数天 / 数月）的 Access Token 且无吊销机制**：被窃后整个有效期都是攻击窗口
- **用 `decode()` 当作校验**：decode 不验签，攻击者可任意改 payload；任何来自不可信源的 token 必须用 `verify()`
- **在同一 JWT 中既签名又加密时颠倒顺序（先加密后签名）**：RFC 7519 §11.2 明确应先签名再加密（先签后加密可防签名被剥离，并为签名者提供隐私）
- **信任 token 自报的 alg / iss 而不做服务端白名单比对**：所有「信任决策」都必须建立在密码学校验通过的基础上（RFC 7519 §11.1）
- **在 `payload` 和 `options` 同时设置同一 claim**（如 `exp`）：jsonwebtoken 会报错
- **权限变更时不重新签发 token**：登录 / 改密 / 提权后必须重新签发 token / 重新生成会话标识，防 session fixation（OWASP Session Management 强制项）

## 下一步

- [参考](./reference.md)：算法对比完整表、注册声明完整表、存储对比完整表、jsonwebtoken API 完整清单、官方资源
