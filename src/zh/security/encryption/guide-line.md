---
layout: doc
outline: [2, 3]
---

# 核心算法与实践

> 基于 MDN Web Crypto 官方文档 + W3C Web Cryptography API Level 2 + OWASP Cryptographic/Password Storage Cheat Sheet + RFC 5280（X.509）编写

## 速查

- **对称加密（AES）**：首选 **AES-GCM**（AEAD），IV 96 位 / 12 字节 CSPRNG 随机且每次不重用，`tagLength` 128；**禁用 ECB**；CBC 需另配 Encrypt-then-MAC
- **非对称加密**：**RSA ≥ 3072 位**（2048 仅遗留），加密用 **RSA-OAEP（SHA-256）** 禁用 PKCS1-v1.5；**ECC 优先 Curve25519 / P-256**，签名优先 Ed25519
- **哈希**：**SHA-256 / 384 / 512**（SHA-2 系），SHA-1 / MD5 禁用于安全用途；**绝不用 SHA 直接存密码**
- **密码哈希**：**Argon2id（m=19456,t=2,p=1）> scrypt（N=2^17,r=8,p=1）> bcrypt（work ≥ 10）> PBKDF2-HMAC-SHA256（600000 次）**
- **PKI**：X.509 v3 证书链 = 信任锚（自签名根 CA）→ 中间 CA → 叶子（end-entity）；浏览器逐层验签 + `notBefore/notAfter` + **SAN** 匹配域名 + 吊销（CRL / OCSP）
- **混合加密**：AES-256-GCM 加密数据 + RSA-OAEP 或 ECDH+HKDF 包裹 AES 密钥（规避 RSA 大数据限制）
- **Web Crypto API**：仅 HTTPS / localhost；`crypto.subtle` 方法返回 Promise、操作 ArrayBuffer；含 `encrypt / decrypt / digest / sign / verify / generateKey / deriveKey / deriveBits / importKey / exportKey / wrapKey / unwrapKey`
- **密钥管理**：不硬编码 / 不入源码 / 不入版本库；用 **HSM / KMS / Vault**；**DEK（数据密钥）+ KEK（密钥加密密钥）** 分离；前端不应持有真正机密密钥
- **反模式**：AES-ECB、SHA 存密码、IV 重用、RSA-PKCS1-v1.5、`Math.random()` 做密钥、前端加密替代 HTTPS、新项目用 crypto-js

## 对称加密：AES-GCM 实战

### AES-GCM 参数详解

```ts
const params /* AesGcmParams */ = {
  name: "AES-GCM",
  iv: crypto.getRandomValues(new Uint8Array(12)), // 96 位，CSPRNG 随机
  additionalData: new TextEncoder().encode("metadata"), // AAD，可选
  tagLength: 128, // GCM tag 位数：128 / 96 / 64 / 32，推荐 128
};
```

| 参数 | 推荐值 | 说明 |
| --- | --- | --- |
| `iv` | **96 位（12 字节）** | NIST SP 800-38D 推荐；CSPRNG 随机生成；**同一 key 下不可重用** |
| `tagLength` | **128** | GCM 认证 tag 位数，默认 / 推荐 128，安全性最高 |
| `additionalData` | 可选（AAD） | 不加密但纳入认证（如请求头、版本号）；解密时须传相同 AAD |
| `length`（keyGen） | 128 / 192 / **256** | AES 密钥位数，推荐 **256** |

### IV 一次性铁律

**同一 AES-GCM key 下 IV 重用 = 灾难**：

- 机密性破坏：相同 IV + 相同 key → 可恢复明文
- 认证性破坏：可伪造 GCM tag（GHASH 多项式被破解）

**正确做法**：

```ts
// 每次加密前重新生成 IV
const iv = crypto.getRandomValues(new Uint8Array(12));
// IV 与密文一起传输（IV 不需保密）
```

> **错误**：把 IV 硬编码进源码或固定为 `0x00...00`——首条密文就被打穿。

### 密钥生成与存储

```ts
// 浏览器：生成 AES-GCM 256 位密钥
const key = await crypto.subtle.generateKey(
  { name: "AES-GCM", length: 256 },
  false, // extractable=false：不可导出，限制可被滥用范围
  ["encrypt", "decrypt"]
);
```

**密钥存储最佳实践**：

- **后端**：HSM（Hardware Security Module）/ KMS（AWS KMS / GCP KMS / 阿里云 KMS）/ HashiCorp Vault
- **DEK + KEK 分离**：数据密钥（DEK）加密数据，密钥加密密钥（KEK）加密 DEK；KEK 与 DEK 分开存储
- **前端**：尽量不持有密钥；若必须（如端到端加密），用 Web Crypto 的 `extractable: false` 限制导出
- **绝不硬编码进源码 / 提交版本库 / 塞 `.env` 普通文件**

### AES-GCM 完整工作流

```ts
// 1. 生成密钥（一次性，长期保存）
const key = await crypto.subtle.generateKey(
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt", "decrypt"]
);

// 2. 加密：每次生成新 IV，IV + ciphertext 一起返回
async function encrypt(plaintext: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    new TextEncoder().encode(plaintext)
  );
  // IV（12B）+ ciphertext+tag 拼接，便于一起传输
  const ivAndCipher = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  ivAndCipher.set(iv, 0);
  ivAndCipher.set(new Uint8Array(ciphertext), iv.byteLength);
  return ivAndCipher.buffer;
}

// 3. 解密：拆出 IV 与 ciphertext
async function decrypt(ivAndCipher: ArrayBuffer) {
  const data = new Uint8Array(ivAndCipher);
  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    ciphertext
  );
  return new TextDecoder().decode(plaintext);
}
```

> AES-GCM 的 `decrypt` 会**自动验 GCM tag**：tag 不匹配抛 `OperationError`，调用方不用另写校验。

## 非对称加密：RSA 与 ECC

### RSA-OAEP（加密）

**RSA 加密用 RSA-OAEP，禁用 PKCS1-v1.5**（易受 Bleichenbacher / 自适应选择密文攻击）。

```ts
// 1. 生成 RSA-OAEP 密钥对（3072 位 + SHA-256）
const { publicKey, privateKey } = await crypto.subtle.generateKey(
  {
    name: "RSA-OAEP",
    modulusLength: 3072,
    publicExponent: new Uint8Array([1, 0, 1]), // 65537
    hash: "SHA-256",
  },
  true,
  ["encrypt", "decrypt"]
);

// 2. 公钥加密（任何人都能加密）
const ciphertext = await crypto.subtle.encrypt(
  { name: "RSA-OAEP" },
  publicKey,
  new TextEncoder().encode("short secret")
);

// 3. 私钥解密（只有私钥持有者能解密）
const plaintext = await crypto.subtle.decrypt(
  { name: "RSA-OAEP" },
  privateKey,
  ciphertext
);
```

**RSA 加密的固有限制**：

| RSA 密钥 | SHA-256 OAEP 最大明文 | 用途 |
| --- | --- | --- |
| 2048 位 | ≈ 190 字节 | 仅遗留 |
| 3072 位 | ≈ 318 字节 | 现代 |
| 4096 位 | ≈ 446 字节 | 长寿命 |

> 大数据**不能**直接用 RSA——用混合加密（AES + RSA 包裹 AES 密钥）。

### ECC 与签名

**ECDSA（椭圆曲线签名）**：256 位 ECC ≈ 3072 位 RSA 强度，密钥短得多。

```ts
// 1. 生成 ECDSA P-256 密钥对
const { publicKey, privateKey } = await crypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" },
  true,
  ["sign", "verify"]
);

// 2. 私钥签名（hash: SHA-256）
const signature = await crypto.subtle.sign(
  { name: "ECDSA", hash: "SHA-256" },
  privateKey,
  new TextEncoder().encode("doc to sign")
);

// 3. 公钥验签
const valid = await crypto.subtle.verify(
  { name: "ECDSA", hash: "SHA-256" },
  publicKey,
  signature,
  new TextEncoder().encode("doc to sign")
);
```

**ECC 算法选型**：

| 用途 | 现代首选 | 备选 |
| --- | --- | --- |
| 密钥协商 | **X25519** | ECDH P-256 |
| 签名 | **Ed25519**（确定性） | ECDSA P-256 |
| 加密 | ECIES（罕见） | 用 RSA-OAEP 或混合加密 |

> 现代浏览器与 Node 18+ 已支持 Ed25519 / X25519（`{ name: "Ed25519" }` / `{ name: "X25519" }`）。

### 混合加密（信封加密）

大数据加密的标准模式——规避 RSA 长度限制与性能问题：

```ts
// 1. 生成 AES-256-GCM 数据密钥（DEK）
const dek = await crypto.subtle.generateKey(
  { name: "AES-GCM", length: 256 },
  true,
  ["encrypt", "decrypt"]
);

// 2. 用 DEK 加密大数据（AES-GCM 性能优）
const iv = crypto.getRandomValues(new Uint8Array(12));
const ciphertext = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv, tagLength: 128 },
  dek,
  bigData
);

// 3. 导出 DEK，用对方公钥（RSA-OAEP）包裹
const rawDek = await crypto.subtle.exportKey("raw", dek);
const wrappedDek = await crypto.subtle.encrypt(
  { name: "RSA-OAEP" },
  recipientPublicKey,
  rawDek
);

// 4. 传输：wrappedDek + iv + ciphertext
// 接收方用私钥解开 wrappedDek → DEK，再用 DEK + iv 解 ciphertext
```

## 哈希：SHA-2 与密码哈希

### SHA-2 通用哈希

**用途**：完整性校验、签名前的消息摘要、HMAC、内容寻址（git）、文件指纹。

```ts
// SHA-256 摘要
const digest = await crypto.subtle.digest(
  "SHA-256",
  new TextEncoder().encode("hello")
);
// 转 hex
const hex = [...new Uint8Array(digest)]
  .map((b) => b.toString(16).padStart(2, "0"))
  .join("");

// SHA-512 摘要
const digest512 = await crypto.subtle.digest(
  "SHA-512",
  new TextEncoder().encode("hello")
);
```

**算法选型**：

| 算法 | 输出长度 | Web Crypto | 状态 |
| --- | --- | --- | --- |
| **SHA-256** | 256 位 | 支持 | 通用首选 |
| **SHA-384 / SHA-512** | 384 / 512 位 | 支持 | 长寿命 |
| SHA-1 | 160 位 | 支持 | **已弱、禁用于安全用途** |
| MD5 | 128 位 | 不支持 | **已破、禁用** |
| SHA-3 | 224/256/384/512 | 不支持 | 备选方案 |
| BLAKE2/3 | 可变 | 不支持 | 现代高性能 |

> **绝不用 SHA-256 / MD5 直接存密码**——它们设计目标是「快」，无可调工作因子与内存硬度，GPU / ASIC 可每秒数十亿次暴力破解。

### HMAC（消息认证码）

**用途**：完整性 + 真实性（共享密钥双方）。常见于 API 签名、CSRF token、JWT（HMAC-SHA256 = HS256）、cookie 签名。

```ts
// 1. 生成 HMAC-SHA-256 密钥
const hmacKey = await crypto.subtle.generateKey(
  { name: "HMAC", hash: "SHA-256", length: 256 },
  false,
  ["sign", "verify"]
);

// 2. 签名（生成 MAC 标签）
const mac = await crypto.subtle.sign(
  "HMAC",
  hmacKey,
  new TextEncoder().encode("payload")
);

// 3. 验签
const valid = await crypto.subtle.verify(
  "HMAC",
  hmacKey,
  expectedMac,
  new TextEncoder().encode("payload")
);
```

### 密码哈希（慢哈希）

**OWASP Password Storage Cheat Sheet 推荐优先级**：

| 算法 | 推荐参数 | 特点 | 浏览器原生 |
| --- | --- | --- | --- |
| **Argon2id** | `m=19456,t=2,p=1` | 内存硬（19 MB），抗 GPU/ASIC | 否（需 WASM） |
| scrypt | `N=2^17,r=8,p=1` | 内存硬 | 否 |
| bcrypt | `work ≥ 10` | 自适应 work factor | 否 |
| PBKDF2-HMAC-SHA256 | `iterations=600000` | 兜底方案 | **是**（Web Crypto） |

**PBKDF2（Web Crypto 原生支持）**：

```ts
// 1. 用 CSPRNG 生成 16 字节盐
const salt = crypto.getRandomValues(new Uint8Array(16));

// 2. 从密码 + 盐派生 AES-GCM 密钥（PBKDF2）
const baseKey = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode("user password"),
  "PBKDF2",
  false,
  ["deriveKey"]
);
const derivedKey = await crypto.subtle.deriveKey(
  {
    name: "PBKDF2",
    salt,
    iterations: 600000, // OWASP 推荐
    hash: "SHA-256",
  },
  baseKey,
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt", "decrypt"]
);
```

**为什么不能用 MD5/SHA-1/SHA-256 存密码**：

| 维度 | 通用哈希（SHA-256） | 密码哈希（Argon2id） |
| --- | --- | --- |
| 设计目标 | 快 | 慢（可调） |
| 内存硬度 | 无 | 高（19 MB） |
| 工作因子 | 不可调 | 可调（t / m / p） |
| GPU/ASIC 暴力破解速度 | 每秒数十亿次 | 每秒数十次 |
| 适合 | 完整性、摘要 | 密码存储 |

> **pepper（纵深防御）**：给密码加 HMAC 后再做慢哈希，HMAC key 与 hash 分库存；遗留 MD5/SHA 系统应在用户下次登录时用现代算法重哈希并强制改密。

## PKI：X.509 与证书链

**PKI（Public Key Infrastructure）**：基于 X.509 证书的公钥分发体系，由 RFC 5280 规定。

### X.509 v3 证书结构

| 字段 | 含义 |
| --- | --- |
| **Subject** | 持有者（CN 已弱化，主体名常为空） |
| **Issuer** | 签发者（上级 CA） |
| **Subject Public Key Info** | 持有者公钥（如 ECDSA P-256 公钥） |
| **Validity** | `notBefore` / `notAfter` |
| **Extensions** | 关键：**SAN**（Subject Alternative Name） |
| **Signature** | Issuer 用其私钥对本证书的签名 |

### SAN：现代证书的核心

**SAN（Subject Alternative Name）** 在现代证书中**替代/补充 CN**：

- `dNSName`：域名（如 `example.com`、`*.example.com`）
- `iPAddress`：IP 地址
- `rfc822Name`：邮箱

> 现代证书主体名常为空，SAN 标记为 `critical`。浏览器只看 SAN 不看 CN——申请证书时务必把所有域名塞进 SAN。

### 证书链验证流程

浏览器收到服务器证书后逐层验证：

```
Root CA（自签名信任锚，预置在浏览器/OS 信任库）
   │ 签发 ↓
Intermediate CA（中间 CA，由 Root 交叉签名）
   │ 签发 ↓
Leaf / End-Entity（叶子证书，服务器实际使用）
```

**每层验证**：

1. **签名验证**：用上级 CA 的公钥验本级证书签名
2. **有效期**：当前时间在 `notBefore` 与 `notAfter` 之间
3. **域名匹配**：SAN 含请求的域名（含通配符规则）
4. **吊销状态**：查 CRL（证书吊销列表）或 OCSP（在线证书状态协议）/ OCSP Stapling
5. **策略约束**：路径长度、用途、基本约束等

**任一项失败** → 浏览器显示「您的连接不是私密连接」警告。

### 信任锚与 CA 生态

- **Root CA**：自签名，预置在浏览器 / 操作系统信任库（如 DigiCert、Let's Encrypt ISRG Root X1）
- **Intermediate CA**：中间层，隔离风险（吊销中间 CA 不影响 Root）
- **公网 CA**：由 CA/Browser Forum 管理，遵守 Baseline Requirements
- **私有 PKI**：企业内部自建 CA，根证书须手动安装到客户端信任库

> 前端代码**不能关闭或绕过**证书校验——TLS 握手、证书 pinning、HSTS、CSP 都由浏览器与网络层完成，不属于 JS 代码范畴。

## Crypto.js（npm crypto-js）

### 现状：Discontinued

**crypto-js v4.2.0（2023 年）**：官方仓库 [brix/crypto-js](https://github.com/brix/crypto-js) 与 npm 页面均明确标注：

> Active development of CryptoJS has been discontinued. This library is no longer maintained.

**含义**：

- 不再发安全补丁
- 不修 bug
- 不支持新算法（如 Ed25519 / Curve25519）
- 仍含 **MD5 / SHA1** 等弱算法，新项目误用风险高

### 主要 API（历史项目维护场景）

| API | 用途 | Web Crypto 替代 |
| --- | --- | --- |
| `CryptoJS.AES.encrypt(msg, key)` | AES 加密 | `crypto.subtle.encrypt("AES-GCM", ...)` |
| `CryptoJS.AES.decrypt(cipher, key)` | AES 解密 | `crypto.subtle.decrypt(...)` |
| `CryptoJS.SHA256(msg).toString()` | SHA-256 摘要 | `crypto.subtle.digest("SHA-256", ...)` |
| `CryptoJS.SHA1(msg).toString()` | SHA-1 摘要 | `crypto.subtle.digest("SHA-1", ...)`（禁用） |
| `CryptoJS.MD5(msg).toString()` | MD5 摘要 | 无（禁用） |
| `CryptoJS.HmacSHA256(msg, key)` | HMAC-SHA-256 | `crypto.subtle.sign("HMAC", ...)` |
| `CryptoJS.PBKDF2(pwd, salt)` | PBKDF2 | `crypto.subtle.deriveKey("PBKDF2", ...)` |

### 迁移坑

- **KDF 不兼容**：crypto-js 自带 EVP_BytesToKey 式 KDF（passphrase 派生 key），Web Crypto 是显式 PBKDF2，**两套工作流不互通**——旧密文用 Web Crypto 解不开
- **格式不兼容**：crypto-js 默认输出 OpenSSL 格式（`Salted__` 前缀 + Salt + 密文），Web Crypto 没有
- **base64 默认输出**：crypto-js `toString()` 默认 base64，Web Crypto 输出 ArrayBuffer
- **HMAC 默认长度**：注意密钥长度与算法匹配

## Web Crypto API（SubtleCrypto）

### 接口特征

- **仅安全上下文**（HTTPS / localhost）：`window.isSecureContext === true`
- **入口**：`window.crypto.subtle` / `self.crypto.subtle`
- **Promise + ArrayBuffer**：所有方法返回 Promise、操作 ArrayBuffer / TypedArray
- **命名为 "subtle"**：承认底层原语易误用（IV 重用、ECB 模式、密钥硬编码）
- **CryptoKey 不可序列化**：密钥以对象形式存在内存，不可 JSON.stringify

### 算法与操作对应矩阵

| 操作 | 支持算法 |
| --- | --- |
| **encrypt / decrypt** | AES-CBC、AES-GCM、AES-CTR、RSA-OAEP |
| **digest** | SHA-1、SHA-256、SHA-384、SHA-512 |
| **sign / verify** | RSASSA-PKCS1-v1_5、RSA-PSS、ECDSA、Ed25519、HMAC |
| **generateKey** | AES-\*、RSA-\*、ECDSA、Ed25519、X25519、HMAC |
| **deriveKey / deriveBits** | PBKDF2、HKDF、ECDH、X25519 |
| **importKey / exportKey** | 格式：raw、pkcs8、spki、jwk |
| **wrapKey / unwrapKey** | AES-KW、AES-GCM、RSA-OAEP |

> **没有 getKeyLength 方法**——AES 默认 256 位需在算法对象里显式 `length: 256`。

### 安全上下文检测

```ts
// 浏览器
if (window.isSecureContext) {
  // 安全上下文（HTTPS / localhost），可用 crypto.subtle
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}
```

### Node.js 兼容

Node 18+ 提供 `crypto.webcrypto.subtle`，与浏览器接口一致：

```ts
// Node
import { webcrypto } from "node:crypto";
const subtle = webcrypto.subtle;
// 用法与浏览器完全一致
```

## 反模式（避坑）

- **用 AES-ECB**：相同明文块 → 相同密文块，泄露明文模式（ECB 企鹅图），OWASP 明确「不应在极特殊情况外使用」
- **同一 AES-GCM key 下重用 IV / nonce**：直接破坏 GCM 机密性与认证性，可恢复明文甚至伪造 tag
- **用 SHA-256 / MD5 / SHA-1 存密码**：设计目标是快、无内存硬度、无可调工作因子，GPU / ASIC 可大规模并行暴力破解
- **新项目继续选 crypto-js**：已 Discontinued，无安全补丁；尤其用其 MD5 / SHA1 做「安全」用途
- **RSA-PKCS1-v1.5 填充用于加密**：易受 Bleichenbacher / 自适应选择密文攻击，应改用 RSA-OAEP（SHA-256）
- **用 SHA-1 做 RSA-OAEP 哈希**：SHA-1 已弱，改用 SHA-256
- **自造加密算法 / 自造随机数**：`Math.random()` 做密钥 / IV / 盐——必须用 CSPRNG（`crypto.getRandomValues` / `randomBytes`）
- **硬编码 API key / 加密密钥到前端 bundle**：任何人下载 JS 即可提取；前端不应持有真正的机密密钥
- **前端加密替代 HTTPS**：前端代码公开、浏览器内密钥可被 F12 / 调试器提取，前端加密只做额外层（client-side encryption），传输安全必须由 TLS 保证
- **把密码在浏览器端 hash 后再发后端**：浏览器端 hash 只是「混淆」，后端仍须 Argon2id / bcrypt；浏览器 hash 本身不增加安全性
- **Node 用已废弃的 `crypto.createCipher` / `createDecipher`**：无 IV、密钥派生不安全（EVP_BytesToKey），必须用 `createCipheriv` / `createDecipheriv`
- **混淆传输加密 / 静态加密 / 客户端加密 / 密码哈希**：是四个不同场景，选错算法（如用 SHA 存密码、用 RSA 加密大文件）会出大事故
- **以为浏览器原生支持 argon2 / bcrypt**：SubtleCrypto 不支持，需 WASM 端口（argon2-browser 等）；密码哈希通常在后端做

## 下一步

- [参考](./reference.md)：算法对比表 + Web Crypto API 表 + 链接
