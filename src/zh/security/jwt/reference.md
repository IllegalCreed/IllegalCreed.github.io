---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 RFC 7519（JWT）/ RFC 7515（JWS）/ RFC 7516（JWE）/ RFC 8725（JWT BCP）/ RFC 9700（OAuth 2.0 Security BCP）/ jwt.io / OWASP 官方文档编写

## 速查

- 三段式：`header.payload.signature`，均 **Base64URL**（`+/-` 替换、去 `=`、URL-safe、无空白）
- 七个注册 claim：iss / sub / aud / exp / nbf / iat / jti（**全部 OPTIONAL**）
- NumericDate：自 1970-01-01 UTC 的**秒数**（忽略闰秒），不是 ISO 字符串
- 算法三族：HS256（对称）/ RS256（RSA 非对称）/ ES256（ECDSA 非对称）/ PS256（PSS）/ `none`（生产禁用）
- 验签铁律：`verify()` 必传 `algorithms` 白名单
- 存储：禁止 localStorage；Access Token 内存 / Refresh Token `HttpOnly+Secure+SameSite=Strict` Cookie
- Refresh Token：每次刷新发新并吊销旧；复用检测到旧 token 再提交时吊销整条 token family（RFC 9700）
- jsonwebtoken：`sign(payload, key, options)` / `verify(token, key, options)` / `decode(token)`（不验签）
- Node 事实标准：`auth0/node-jsonwebtoken`；现代替代：`panva/jose`
- 完整说明见 [入门](./getting-started.md) / [深度](./guide-line.md)

## 三段式结构示例

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4iLCJpYXQiOjE1MTYyMzkwMjJ9
.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

| 段 | 解码后 |
| --- | --- |
| Header | `{"alg":"HS256","typ":"JWT"}` |
| Payload | `{"sub":"1234567890","name":"John","iat":1516239022}` |
| Signature | `HMACSHA256(base64Url(header)+'.'+base64Url(payload), secret)` |

## Base64URL vs 普通 Base64

| 维度 | 普通 Base64 | Base64URL |
| --- | --- | --- |
| 字符集 | A-Z a-z 0-9 + / | A-Z a-z 0-9 - _ |
| 填充 | `=` | 无 |
| 换行 | 通常每 76 字符 | 无 |
| URL-safe | 否（`+/=` 需编码） | 是 |

## JOSE Header 字段表

| 字段 | 含义 | 必填 | 取值 |
| --- | --- | --- | --- |
| `alg` | 签名 / MAC 算法 | **必填** | HS256 / RS256 / ES256 / PS256 / `none`… |
| `typ` | 媒体类型 | 可选 | `JWT`（推荐） |
| `cty` | 内容类型 | 可选 | 嵌套签名时必须为 `JWT` |
| `kid` | 密钥 ID | 可选 | JWKS 端点路由用 |
| `jku` | JWKS URL | 可选 | 需服务端白名单 |
| `x5u` | X.509 URL | 可选 | 需服务端白名单 |
| `x5c` | X.509 证书链 | 可选 | 需服务端白名单 |

## 算法完整对比表

| 算法 | 类型 | 密钥模型 | 签名长度 | RFC 7518 要求 | 适用场景 |
| --- | --- | --- | --- | --- | --- |
| **HS256** | HMAC-SHA256（对称） | 共享密钥 | 32 字节 | MUST | 单体应用、签发与验证同服务 |
| HS384 | HMAC-SHA384 | 共享密钥 | 48 字节 | MUST | 同 HS256 |
| HS512 | HMAC-SHA512 | 共享密钥 | 64 字节 | MUST | 同 HS256 |
| **RS256** | RSASSA-PKCS1-v1_5 SHA-256 | 私签公验 | 256 字节 | RECOMMENDED | 多服务、跨组织、OIDC |
| RS384 | RSASSA-PKCS1-v1_5 SHA-384 | 私签公验 | 384 字节 | RECOMMENDED | 同 RS256 |
| RS512 | RSASSA-PKCS1-v1_5 SHA-512 | 私签公验 | 512 字节 | RECOMMENDED | 同 RS256 |
| **ES256** | ECDSA P-256 | 私签公验 | 64 字节 | RECOMMENDED | 移动端、IoT、密钥短 |
| ES384 | ECDSA P-384 | 私签公验 | 96 字节 | RECOMMENDED | 同 ES256 |
| ES512 | ECDSA P-521 | 私签公验 | 132 字节 | RECOMMENDED | 同 ES256 |
| **PS256** | RSASSA-PSS SHA-256 | 私签公验 | 256 字节 | OPTIONAL | RS256 的现代概率变体 |
| PS384 | RSASSA-PSS SHA-384 | 私签公验 | 384 字节 | OPTIONAL | 同 PS256 |
| PS512 | RSASSA-PSS SHA-512 | 私签公验 | 512 字节 | OPTIONAL | 同 PS256 |
| **none** | 无签名（Unsecured JWT） | 无 | 0 | RFC 7519 §6 允许 | **生产禁用**（仅内网信任环境） |

> RFC 8725 强烈反对接受 `none`，生产实现普遍禁用。HS256 与 `none` 是 RFC 7519 MUST 实现，RS256/ES256 是 RECOMMENDED。

## 七个注册 claim 完整表

| claim | 全称 | 类型 | 校验规则 | RFC 章节 |
| --- | --- | --- | --- | --- |
| `iss` | Issuer | StringOrURI | 必须等于本服务预期的可信签发方 | §4.1.1 |
| `sub` | Subject | StringOrURI | 应用层定义，局部或全局唯一 | §4.1.2 |
| `aud` | Audience | StringOrURI / 数组 | **必须**包含本服务，不匹配 MUST 拒绝 | §4.1.3 |
| `exp` | Expiration Time | NumericDate | 过期 MUST NOT 接受 | §4.1.4 |
| `nbf` | Not Before | NumericDate | 生效前 MUST NOT 接受 | §4.1.5 |
| `iat` | Issued At | NumericDate | 签发时间，可判断 token 年龄 | §4.1.6 |
| `jti` | JWT ID | String（区分大小写） | 唯一 ID，防重放，需服务端维护已用列表 | §4.1.7 |

**类型说明**：

- **NumericDate**：自 1970-01-01T00:00:00Z UTC 起的**秒数**（忽略闰秒）。`exp`/`nbf`/`iat` 都用此类型。
- **StringOrURI**：含 `:` 必须是 URI，按大小写敏感比较。
- **JSON 类型**：claim 值可以是任意 JSON 类型（字符串 / 数字 / 布尔 / 对象 / 数组）。

## 存储位置完整对比表

| 存储 | XSS 风险 | CSRF 风险 | 持久化 | OWASP 立场 |
| --- | --- | --- | --- | --- |
| localStorage | **极高**（任何 JS 可读） | 低 | 是 | **明令禁止** |
| sessionStorage | **极高** | 低 | 否（标签关闭即丢） | **明令禁止** |
| 普通 Cookie | 高（非 HttpOnly 时 JS 可读） | 高（自动随请求带） | 是 | 不推荐 |
| HttpOnly Cookie | 低（JS 不可读） | 高（自动随请求带） | 是 | 推荐（配 SameSite） |
| HttpOnly + SameSite=Strict Cookie | 低 | **极低** | 是 | **推荐** |
| `__Host-` 前缀 Cookie | 低 | 极低 | 是 | **强烈推荐** |
| 内存（JS 变量） | **极低**（无持久态） | 低 | 否（刷新即丢） | **推荐**（Access Token） |

## jsonwebtoken API 完整清单

### sign(payload, secretOrPrivateKey, options)

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `payload` | object / string / Buffer | claim 集合 |
| `secretOrPrivateKey` | string / Buffer / { key, passphrase } | HS 系列传共享密钥；RS/ES 系列传 PEM 私钥 |
| `options.algorithm` | string | 默认 `HS256` |
| `options.expiresIn` | string / number | 写入 `exp`（如 `"15m"` / `60 * 15`） |
| `options.notBefore` | string / number | 写入 `nbf` |
| `options.audience` | string / string[] | 写入 `aud` |
| `options.issuer` | string | 写入 `iss` |
| `options.subject` | string | 写入 `sub` |
| `options.jwtid` | string | 写入 `jti` |
| `options.keyid` | string | 写入 Header `kid` |
| `options.noTimestamp` | boolean | 不写入 `iat` |

> 不能在 `payload` 和 `options` 中重复设置同一 claim。

### verify(token, secretOrPublicKey, options)

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `token` | string | 待验 JWT |
| `secretOrPublicKey` | string / Buffer / { key, passphrase } / function | HS 传共享密钥；RS/ES 传 PEM 公钥；function 形式按 header 取 key（如 JWKS） |
| `options.algorithms` | string[] | **★ 必传白名单**，如 `['RS256']` |
| `options.audience` | string / RegExp / string[] | 校验 `aud` |
| `options.issuer` | string / string[] | 校验 `iss` |
| `options.subject` | string | 校验 `sub` |
| `options.jwtid` | string | 校验 `jti` |
| `options.ignoreExpiration` | boolean | 默认 `false`（过期即拒） |
| `options.ignoreNotBefore` | boolean | 默认 `false` |
| `options.clockTolerance` | number | 秒，处理时钟偏移 |
| `options.maxAge` | string / number | 拒绝签发过老的 token（即使未过期） |

### decode(token, options)

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `token` | string | 待解码 JWT |
| `options.complete` | boolean | 返回 header + payload（默认仅 payload） |
| `options.json` | boolean | 强制解析为 object |

> **重要**：`decode()` **不验签**，不能用于不可信输入。任何来自不可信源的 token 必须用 `verify()`。

## 典型代码片段

### 签发（HS256 单体）

```ts
import jwt from "jsonwebtoken";

const token = jwt.sign(
  { userId: 123, role: "admin" },
  process.env.JWT_SECRET, // 至少 256 位
  {
    algorithm: "HS256",
    expiresIn: "15m",
    issuer: "auth.example.com",
    audience: "my-api",
    jwtid: crypto.randomUUID(),
  }
);
```

### 验证（RS256 + JWKS）

```ts
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const client = jwksClient({ jwksUri: "https://auth.example.com/.well-known/jwks.json" });

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

jwt.verify(
  token,
  getKey,
  {
    algorithms: ["RS256"], // ★ 必传白名单
    audience: "my-api",
    issuer: "auth.example.com",
    clockTolerance: 5,
  },
  (err, payload) => {
    if (err) return res.status(401).end();
    req.user = payload;
  }
);
```

### Refresh Token 轮换伪代码

```ts
async function refresh(oldRt: string) {
  // 1. 验签 + 查 Redis：旧 RT 是否在白名单（未被吊销）
  const payload = jwt.verify(oldRt, RT_SECRET, { algorithms: ["HS256"] });
  const familyId = payload.family;
  const stored = await redis.get(`rt:${oldRt}`);

  if (stored === "rotated") {
    // ★ 复用检测：旧 RT 又被提交 → 吊销整个 family
    await redis.del(`family:${familyId}`);
    throw new Error("REUSE_DETECTED");
  }
  if (!stored) throw new Error("INVALID_RT");

  // 2. 签发新 RT，把旧 RT 标记为 rotated
  const newRt = jwt.sign({ family: familyId, sub: payload.sub }, RT_SECRET, {
    algorithm: "HS256",
    expiresIn: "30d",
  });
  await redis.set(`rt:${oldRt}`, "rotated", "EX", 30 * 86400);
  await redis.set(`rt:${newRt}`, "valid", "EX", 30 * 86400);
  await redis.sadd(`family:${familyId}`, newRt);

  return { accessToken: signAT(payload.sub), refreshToken: newRt };
}
```

## RFC 与规范索引

| RFC | 标题 | 用途 |
| --- | --- | --- |
| **RFC 7519** | JSON Web Token (JWT) | JWT 核心规范（结构 / claim / 校验） |
| RFC 7515 | JSON Web Signature (JWS) | 签名容器（JWT 默认形态） |
| RFC 7516 | JSON Web Encryption (JWE) | 加密容器（payload 需保密时用） |
| RFC 7517 | JSON Web Key (JWK) | 密钥表示（JWKS 端点） |
| RFC 7518 | JSON Web Algorithms (JWA) | 算法注册表 |
| **RFC 8725** | JWT Best Current Practices | JWT 安全 BCP（alg 白名单 / 隐私 / 吊销） |
| **RFC 9700** | OAuth 2.0 Security BCP | Refresh Token 轮换 + 复用检测 |

## 版本与生态

| 项 | 取值 |
| --- | --- |
| 核心规范 | RFC 7519（2015-05 发布，至今未废弃） |
| 安全 BCP | RFC 8725（2020）+ RFC 9700（2024，OAuth2） |
| Node 事实标准 | `auth0/node-jsonwebtoken` |
| 现代替代 | `panva/jose`（支持 JWE / KeyObject / Web Crypto） |
| 在线工具 | [jwt.io](https://jwt.io)（Auth0 维护） |
| 必实现算法 | HS256 / `none`（RFC 7519 MUST） |
| 推荐算法 | RS256 / ES256（RFC 7518 RECOMMENDED） |

## 官方资源

- RFC 7519：[datatracker.ietf.org/doc/html/rfc7519](https://datatracker.ietf.org/doc/html/rfc7519)
- RFC 8725：[datatracker.ietf.org/doc/html/rfc8725](https://datatracker.ietf.org/doc/html/rfc8725)
- RFC 9700：[rfc-editor.org/info/rfc9700](https://www.rfc-editor.org/info/rfc9700/)
- OWASP Session Management：[cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- jwt.io Introduction：[jwt.io/introduction](https://jwt.io/introduction)
- auth0/node-jsonwebtoken：[github.com/auth0/node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
- panva/jose：[github.com/panva/jose](https://github.com/panva/jose)
