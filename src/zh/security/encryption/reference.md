---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 MDN Web Crypto 官方文档 + W3C Web Cryptography API Level 2 + OWASP Cryptographic/Password Storage Cheat Sheet + RFC 5280 编写

## 速查

- 加密四类：**对称（AES-GCM）** / **非对称（RSA-OAEP / ECC）** / **哈希（SHA-2）** / **密码哈希（Argon2id / bcrypt / scrypt / PBKDF2）**
- AES-GCM IV：**96 位（12 字节）CSPRNG 随机、每次不重用**；`tagLength` 128
- RSA：**≥ 3072 位**（2048 仅遗留），加密用 **RSA-OAEP（SHA-256）** 禁用 PKCS1-v1.5
- ECC：**Curve25519 / P-256**，签名优先 **Ed25519**
- 密码哈希：**Argon2id（m=19456,t=2,p=1）> scrypt > bcrypt > PBKDF2-HMAC-SHA256（600000 次）**
- Web Crypto API：`window.crypto.subtle`，**仅 HTTPS / localhost**
- SubtleCrypto 方法：`encrypt / decrypt / digest / sign / verify / generateKey / deriveKey / deriveBits / importKey / exportKey / wrapKey / unwrapKey`
- 密钥管理：HSM / KMS / Vault + DEK/KEK 分离 + 前端不持机密
- crypto-js v4.2.0 **Discontinued**，迁 `node:crypto` 或 Web Crypto
- PKI：X.509 v3 = Root CA → Intermediate CA → Leaf；逐层验签 + 有效期 + SAN + 吊销
- 完整说明见 [入门](./getting-started.md) / [核心算法与实践](./guide-line.md)

## 加密算法对比表

### 对称加密

| 算法 / 模式 | 密钥长度 | 用途 | Web Crypto | 备注 |
| --- | --- | --- | --- | --- |
| **AES-GCM** | 128 / 192 / 256 | **大数据加密首选** | 支持 | AEAD（加密+认证），IV 96 位 |
| AES-CBC | 同上 | 仅加密 | 支持 | 不认证，需 Encrypt-then-MAC |
| AES-CTR | 同上 | 仅加密 | 支持 | 流模式，需配 MAC |
| **AES-ECB** | 同上 | **禁用** | 不支持 | 泄露明文模式（ECB 企鹅图） |
| ChaCha20-Poly1305 | 256 | TLS 1.3 备选 | 不支持 | 移动端无 AES-NI 时优 |

### 非对称加密与签名

| 算法 | 密钥 / 参数 | 用途 | Web Crypto | 备注 |
| --- | --- | --- | --- | --- |
| **RSA-OAEP** | ≥ 3072 位 | 加密 / 解密 | 支持 | 禁用 PKCS1-v1.5 |
| RSASSA-PKCS1-v1_5 | ≥ 3072 位 | 签名 | 支持 | JWT RS256 |
| RSA-PSS | ≥ 3072 位 | 签名（更安全） | 支持 | 概率性签名 |
| **ECDSA** | P-256 / P-384 | 签名 | 支持 | 现代 RSA 替代 |
| **Ed25519** | 256 位 | 签名（确定性） | 支持（Node 18+ / 现代浏览器） | 优先 |
| **ECDH / X25519** | P-256 / Curve25519 | 密钥协商 | 支持 | TLS 1.3 主力 |
| RSAES-PKCS1-v1.5 | — | **禁用** | 不支持 | Bleichenbacher 攻击 |

### 哈希与密码哈希

| 算法 | 输出长度 | 用途 | Web Crypto | 备注 |
| --- | --- | --- | --- | --- |
| **SHA-256** | 256 位 | 通用哈希 | 支持 | SHA-2 系首选 |
| **SHA-384 / SHA-512** | 384 / 512 | 长寿命哈希 | 支持 | SHA-2 系 |
| SHA-1 | 160 位 | **禁用** | 支持 | 碰撞攻击已实战 |
| MD5 | 128 位 | **禁用** | 不支持 | 已破 |
| SHA-3 | 224/256/384/512 | 备选 | 不支持 | Keccak |
| BLAKE2 / BLAKE3 | 可变 | 现代高性能 | 不支持 | — |
| **Argon2id** | — | **密码哈希首选** | 不支持（需 WASM） | m=19456,t=2,p=1 |
| scrypt | — | 密码哈希 | 不支持（需 WASM） | N=2^17,r=8,p=1 |
| bcrypt | — | 密码哈希 | 不支持（需 WASM） | work ≥ 10 |
| **PBKDF2-HMAC-SHA256** | — | 兜底密码哈希 | **支持** | 600000 次迭代 |
| HMAC-SHA256 | — | MAC（完整性+真实性） | 支持 | API 签名、CSRF、JWT HS256 |

## Web Crypto API 完整方法表

| 方法 | 参数 | 返回 | 说明 |
| --- | --- | --- | --- |
| `encrypt(algo, key, data)` | algo、CryptoKey、ArrayBuffer | `Promise<ArrayBuffer>` | AES-CBC / GCM / CTR、RSA-OAEP |
| `decrypt(algo, key, data)` | 同上 | `Promise<ArrayBuffer>` | 解密；GCM 自动验 tag |
| `digest(algo, data)` | algo、ArrayBuffer | `Promise<ArrayBuffer>` | SHA-1 / 256 / 384 / 512 |
| `sign(algo, key, data)` | algo、CryptoKey、ArrayBuffer | `Promise<ArrayBuffer>` | ECDSA、Ed25519、HMAC、RSA-PSS |
| `verify(algo, key, sig, data)` | algo、key、签名、数据 | `Promise<boolean>` | 验签 |
| `generateKey(algo, extractable, keyUsages)` | 算法对象、布尔、用途数组 | `Promise<CryptoKey \| CryptoKeyPair>` | AES、RSA、ECDSA |
| `deriveKey(algo, baseKey, derivedKeyAlgo, extractable, usages)` | — | `Promise<CryptoKey>` | PBKDF2、HKDF、ECDH、X25519 |
| `deriveBits(algo, baseKey, length)` | — | `Promise<ArrayBuffer>` | 派生比特串 |
| `importKey(format, keyData, algo, extractable, usages)` | 格式、密钥数据、算法 | `Promise<CryptoKey>` | raw / pkcs8 / spki / jwk |
| `exportKey(format, key)` | 格式、CryptoKey | `Promise<ArrayBuffer>` | 导出（extractable=true） |
| `wrapKey(format, key, wrappingKey, algo)` | — | `Promise<ArrayBuffer>` | 包装密钥（AES-KW / RSA-OAEP） |
| `unwrapKey(format, wrapped, unwrappingKey, ...)` | — | `Promise<CryptoKey>` | 解包 |
| `getRandomValues(array)` | TypedArray | TypedArray（同步） | CSPRNG；非 subtle 接口 |

> **没有 `getKeyLength` 方法**——AES 默认 256 位需在算法对象里显式 `length: 256`。

## 算法参数对象

### AES-GCM

```ts
{
  name: "AES-GCM",
  iv: ArrayBuffer | TypedArray,  // 96 位 / 12 字节，CSPRNG 随机
  additionalData?: ArrayBuffer | TypedArray,  // AAD
  tagLength?: 32 | 64 | 96 | 104 | 112 | 120 | 128,  // 默认 128
}
```

### RSA-OAEP

```ts
{
  name: "RSA-OAEP",
  label?: ArrayBuffer | TypedArray,  // 可选 AAD
}
// hash 在 generateKey / importKey 时指定："SHA-256"
```

### PBKDF2

```ts
{
  name: "PBKDF2",
  salt: ArrayBuffer | TypedArray,
  iterations: 600000,  // OWASP 推荐
  hash: "SHA-256",
}
```

### ECDSA

```ts
{
  name: "ECDSA",
  hash: "SHA-256",
}
// 密钥生成时 namedCurve: "P-256" | "P-384" | "P-521"
```

### HMAC

```ts
{
  name: "HMAC",
  hash: "SHA-256" | "SHA-384" | "SHA-512",
  length?: number,  // 密钥位数
}
```

## SubtleCrypto 算法矩阵

| 操作 | 支持算法 | 不支持（重要） |
| --- | --- | --- |
| **encrypt / decrypt** | AES-CBC、AES-GCM、AES-CTR、RSA-OAEP | AES-ECB、ChaCha20、RSAES-PKCS1-v1.5 |
| **digest** | SHA-1、SHA-256、SHA-384、SHA-512 | MD5、SHA-3、BLAKE2/3 |
| **sign / verify** | RSASSA-PKCS1-v1_5、RSA-PSS、ECDSA、Ed25519、HMAC | Ed448、RSA-PSS-MAVF1 |
| **deriveKey / deriveBits** | PBKDF2、HKDF、ECDH、X25519 | scrypt、argon2、bcrypt |
| **generateKey** | AES-\*、RSA-OAEP、RSASSA-PKCS1-v1_5、RSA-PSS、ECDSA、Ed25519、X25519、HMAC | DES、3DES、RSAES-PKCS1-v1.5 |
| **importKey / exportKey** | raw、pkcs8、spki、jwk | — |
| **wrapKey / unwrapKey** | AES-KW、AES-GCM、RSA-OAEP | AES-CBC（理论支持但少用） |

## 密钥长度安全等级对比

| 对称 | RSA | ECC | 等价强度 |
| --- | --- | --- | --- |
| 80 | 1024 | 160 | 已弱 |
| 112 | 2048 | 224 | 遗留 |
| **128** | 3072 | **256** | 现代 |
| 192 | 7680 | 384 | 长寿命 |
| 256 | 15360 | 512 | 军用 |

> ECC 256 位 ≈ RSA 3072 位 ≈ 对称 128 位——这就是为何 ECC 现代首选。

## RSA-OAEP 最大明文长度

公式：`max_len = (modulusLength / 8) - 2 * (hashLength / 8) - 2`

| RSA 密钥 | SHA-256 | SHA-384 | SHA-512 |
| --- | --- | --- | --- |
| 2048 位 | 190 B | 158 B | 126 B |
| **3072 位** | **318 B** | 286 B | 254 B |
| 4096 位 | 446 B | 414 B | 382 B |

> 大数据**必须**用混合加密（AES + RSA 包裹 AES 密钥）。

## 密码哈希参数推荐（OWASP）

| 算法 | 参数 | 备注 |
| --- | --- | --- |
| **Argon2id** | `m=19456` (19 MB), `t=2`, `p=1` | OWASP Cheat Sheet 最低配置 |
| scrypt | `N=2^17`, `r=8`, `p=1` | 内存 16 MB |
| bcrypt | `work=10+` (2^10) | 适应硬件演进应逐年提升 |
| **PBKDF2-HMAC-SHA256** | `iterations=600000` | Web Crypto 兜底方案 |
| PBKDF2-HMAC-SHA1 | `iterations=1300000` | 仅遗留兼容 |

> pepper（HMAC 后哈希）做纵深防御，pepper 与 hash 分库存。

## X.509 v3 证书结构

| 字段 | 含义 |
| --- | --- |
| Version | v3（现代标准） |
| Serial Number | CA 颁发的唯一序列号 |
| Signature Algorithm | 签名算法（如 ecdsa-with-SHA256） |
| Issuer | 签发者 DN（上级 CA） |
| Validity | `notBefore` / `notAfter` |
| Subject | 持有者 DN（现代常为空，看 SAN） |
| **Subject Public Key Info** | 公钥 + 算法标识 |
| **Extensions** | 关键：**SAN**（critical） |
| **Signature** | Issuer 用其私钥对本证书的签名 |

### SAN 类型

| 类型 | 含义 |
| --- | --- |
| `dNSName` | 域名（如 `example.com`、`*.example.com`） |
| `iPAddress` | IP 地址（v4 / v6） |
| `rfc822Name` | 邮箱 |
| `uniformResourceIdentifier` | URI |
| `directoryName` | DN |

> 现代证书**主体名常为空**，SAN 标记为 `critical`——浏览器只看 SAN 不看 CN。

## 浏览器 / 运行时支持

| 运行时 | Web Crypto | Ed25519 / X25519 |
| --- | --- | --- |
| Chrome / Edge | 稳定 | 支持 |
| Firefox | 稳定 | 支持 |
| Safari | 稳定 | 支持（macOS 14+） |
| Node 18+ | `crypto.webcrypto.subtle` | 支持 |
| Deno / Bun | 全局 `crypto.subtle` | 支持 |

> 全部主流浏览器与运行时稳定支持 Web Crypto API 多年，是当前前端加密的官方推荐方案。

## 官方资源

- MDN SubtleCrypto：[https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto)
- W3C Web Cryptography API Level 2：[https://www.w3.org/TR/webcrypto-2/](https://www.w3.org/TR/webcrypto-2/)
- OWASP Cryptographic Storage Cheat Sheet：[https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- OWASP Password Storage Cheat Sheet：[https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- RFC 5280 - X.509 PKI：[https://datatracker.ietf.org/doc/html/rfc5280](https://datatracker.ietf.org/doc/html/rfc5280)
- NIST SP 800-38D (GCM)：[https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)
- Node.js Crypto：[https://nodejs.org/api/crypto.html](https://nodejs.org/api/crypto.html)
- crypto-js npm（已 Discontinued）：[https://www.npmjs.com/package/crypto-js](https://www.npmjs.com/package/crypto-js)
- argon2-browser（WASM 端口）：[https://github.com/antelle/argon2-browser](https://github.com/antelle/argon2-browser)
- Let's Encrypt（X.509 实践）：[https://letsencrypt.org/docs/](https://letsencrypt.org/docs/)
- CA/Browser Forum Baseline Requirements：[https://cabforum.org/baseline-requirements-documents/](https://cabforum.org/baseline-requirements-documents/)
