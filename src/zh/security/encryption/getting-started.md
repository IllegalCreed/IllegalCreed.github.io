---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 MDN Web Crypto 官方文档（developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto）+ W3C Web Cryptography API Level 2 + OWASP Cryptographic/Password Storage Cheat Sheet 编写

## 速查

- 加密四大类：**对称**（AES，1 个密钥）/ **非对称**（RSA / ECC，公钥 + 私钥）/ **哈希**（单向不可逆，SHA-2）/ **密码哈希**（慢哈希，argon2 / bcrypt / scrypt / PBKDF2）
- 对称加密首选 **AES-GCM**（AEAD，加密 + 认证一体），**禁用 ECB**（泄露明文模式），**CBC 需另配 MAC**
- AES-GCM 关键参数：**IV 推荐 96 位（12 字节），CSPRNG 随机且每次不重用**；`tagLength` 通常 128；AAD 可选
- 非对称加密：**RSA ≥ 3072 位**（2048 仅遗留）；加密用 **RSA-OAEP（SHA-256）** 而非 PKCS1-v1.5；ECC 优先 **Curve25519 / P-256**，签名优先 **Ed25519**
- 摘要（哈希）：**SHA-256 / SHA-384 / SHA-512**（SHA-2 系），SHA-1 / MD5 已弱不可做安全用途；**绝不用 SHA 直接存密码**
- 密码哈希优先级：**Argon2id（m=19456,t=2,p=1）> scrypt（N=2^17,r=8,p=1）> bcrypt（work ≥ 10）> PBKDF2-HMAC-SHA256（600000 次）**
- Web Crypto API 入口：`window.crypto.subtle` / `self.crypto.subtle`，**仅 HTTPS / localhost 可用**
- SubtleCrypto 方法：`encrypt / decrypt / digest / sign / verify / generateKey / deriveKey / deriveBits / importKey / exportKey / wrapKey / unwrapKey`
- CSPRNG：浏览器 `crypto.getRandomValues(new Uint8Array(12))`，Node `crypto.randomBytes(12)`
- crypto-js v4.2.0 已 **Discontinued**，新项目用 `node:crypto` 或 Web Crypto API
- 混合加密：AES-256-GCM 加密数据 + RSA-OAEP 或 ECDH+HKDF 包裹密钥

## 加密是什么

加密是把可读明文通过算法与密钥转换成不可读密文，只有持密钥者才能还原。它有四个核心问题需要回答：

- **机密性**（Confidentiality）：明文只能被授权方读懂——靠加密
- **完整性**（Integrity）：数据没被篡改——靠 MAC 或 AEAD（AES-GCM）
- **真实性**（Authenticity）：数据确实来自声称的发送方——靠签名或 MAC
- **不可否认性**（Non-repudiation）：发送方事后不能抵赖——靠数字签名（私钥唯一持有）

前端可触及的加密分**四个层次**（务必分清边界）：

| 层次 | 场景 | 谁负责 | 典型算法 |
| --- | --- | --- | --- |
| **传输加密** | 网络传输防中间人 | 浏览器与服务器（TLS） | TLS 1.3、X.509 证书链 |
| **客户端加密** | 浏览器内文件加密、客户端哈希 | 前端 JS 代码 | Web Crypto API（AES-GCM / SHA-256） |
| **静态加密** | 数据库列加密、备份加密 | 后端 / DBA / 系统 | KMS / HSM / Vault、TDE |
| **密码哈希** | 用户密码存储 | 后端 | Argon2id / bcrypt / scrypt / PBKDF2 |

> 前端加密**无法替代 HTTPS**（浏览器内密钥可被 F12 提取），**无法替代后端密码哈希**（浏览器端 hash 只是混淆）。

## 对称 vs 非对称 vs 哈希

| 类型 | 密钥 | 可逆 | 典型用途 | 代表算法 |
| --- | --- | --- | --- | --- |
| **对称加密** | 1 个（共享） | 是 | 大数据加密、文件加密 | AES-GCM、AES-CBC、ChaCha20 |
| **非对称加密** | 2 个（公钥 + 私钥） | 是（私钥解密） | 密钥协商、数字签名 | RSA-OAEP、ECDH、ECDSA、Ed25519 |
| **哈希（摘要）** | 无密钥 | 否（单向） | 完整性校验、签名摘要 | SHA-256 / SHA-384 / SHA-512 |
| **密码哈希** | 通常无（带盐） | 否（单向 + 慢） | 用户密码存储 | Argon2id、bcrypt、scrypt、PBKDF2 |
| **MAC（消息认证码）** | 1 个（共享） | 否（认证标签） | 完整性 + 真实性 | HMAC-SHA256、AES-CMAC |
| **签名** | 2 个（公钥验签 / 私钥签名） | 否（签名值） | 不可否认性 | ECDSA、Ed25519、RSA-PSS |

### 对称加密

**核心特点**：加密与解密用**同一把密钥**，通信双方必须事先约定并保密。性能高（AES 硬件指令 AES-NI 加速），适合大数据。

**主流算法**：

- **AES（Advanced Encryption Standard）**：128 / 192 / 256 位密钥；分组密码，分组大小 128 位
- **AES-GCM**（Galois/Counter Mode）：**AEAD**（Authenticated Encryption with Associated Data），加密 + 认证一体，**首选**
- **AES-CBC**：仅加密，不认证，需另配 HMAC（Encrypt-then-MAC），漏掉即被填充攻击
- **AES-CTR**：流密码模式，仅加密
- **AES-ECB**：**禁用**——相同明文块 → 相同密文块，泄露明文模式（ECB 企鹅图）
- **ChaCha20-Poly1305**：Web Crypto 不原生支持，TLS 1.3 支持，移动端无 AES-NI 时优于 AES

### 非对称加密

**核心特点**：**公钥**与**私钥**一对，公钥可公开、私钥保密。性能远低于对称，**只能加密小块数据**（RSA 2048 位 + SHA-256 ≈ 190 字节）。

**主流算法**：

- **RSA**：基于大数分解难题；加密用 **RSA-OAEP**（带 OAEP 填充），**禁用 RSAES-PKCS1-v1.5**（易受 Bleichenbacher 攻击）；签名用 RSA-PSS 或 RSASSA-PKCS1-v1_5；密钥 ≥ 3072 位（2048 仅遗留）
- **ECC（Elliptic Curve Cryptography）**：基于椭圆曲线离散对数难题，密钥短（256 位 ≈ RSA 3072 位），优先 **Curve25519 / P-256**
- **ECDH（Elliptic Curve Diffie-Hellman）**：密钥协商，X25519 是现代首选
- **ECDSA**：椭圆曲线签名，P-256 / P-384；现代优先 **Ed25519**（确定性签名，性能优）

### 哈希（摘要）

**核心特点**：**单向不可逆**、固定长度输出、雪崩效应（输入 1 位变化 → 输出大变）、抗碰撞（找不到两个不同输入产生相同输出）。

**主流算法**：

- **SHA-256 / SHA-384 / SHA-512**（SHA-2 系）：通用哈希首选；Web Crypto `digest` 直接支持
- **SHA-3**：Keccak，SHA-2 之外的备选方案；Web Crypto 原生不支持
- **SHA-1 / MD5**：**已弱、禁用于安全用途**（碰撞攻击已实战）
- **BLAKE2 / BLAKE3**：现代高性能哈希，Web Crypto 不原生支持

> **绝不用 SHA-256 / MD5 直接存密码**——它们设计目标是「快」，GPU 每秒可算数十亿次，暴力破解成本极低。密码存储必须用慢哈希（Argon2id / bcrypt / scrypt / PBKDF2）。

## Web Crypto API 速览

**入口**：`window.crypto.subtle`（浏览器）/ `self.crypto.subtle`（Worker / 浏览器）/ `crypto.webcrypto.subtle`（Node 18+）。

**特征**：

- **仅安全上下文**（HTTPS / localhost）可用
- 所有方法**返回 Promise**（异步不阻塞）
- 操作 **ArrayBuffer / TypedArray**（二进制优先）
- 命名为 "subtle" = **底层原语易误用**（footgun）

**核心方法清单**：

| 方法 | 作用 | 典型算法 |
| --- | --- | --- |
| `encrypt(algorithm, key, data)` | 加密 | AES-CBC / GCM / CTR、RSA-OAEP |
| `decrypt(algorithm, key, data)` | 解密 | 同上 |
| `digest(algorithm, data)` | 哈希摘要 | SHA-1 / 256 / 384 / 512 |
| `sign(algorithm, key, data)` | 签名 | RSASSA-PKCS1-v1_5、RSA-PSS、ECDSA、Ed25519、HMAC |
| `verify(...)` | 验签 | 同上 |
| `generateKey(algorithm, extractable, keyUsages)` | 生成密钥 | AES-GCM、RSA-OAEP、ECDSA |
| `deriveKey(algorithm, baseKey, derivedKeyAlgo, ...)` | 派生密钥 | PBKDF2、HKDF、ECDH、X25519 |
| `deriveBits(...)` | 派生比特串 | 同上 |
| `importKey(format, keyData, algorithm, ...)` | 导入密钥 | raw / pkcs8 / spki / jwk |
| `exportKey(format, key)` | 导出密钥 | 同上 |
| `wrapKey(format, key, wrappingKey, ...)` | 包装密钥 | AES-KW、RSA-OAEP |
| `unwrapKey(...)` | 解包密钥 | 同上 |

> 没有 `getKeyLength` 方法。AES 默认 256 位需在算法对象里显式写 `length: 256`。

### CSPRNG（密码学强随机数）

```ts
// 浏览器：生成 12 字节 IV（AES-GCM 推荐）
const iv = crypto.getRandomValues(new Uint8Array(12));

// Node：等价
import { randomBytes } from "node:crypto";
const iv = randomBytes(12);
```

> **永远不用 `Math.random()` 做密钥、IV、盐**——它不是密码学强随机数，可被预测。

### AES-GCM 最小示例

```ts
// 1. 生成 256 位 AES-GCM 密钥
const key = await crypto.subtle.generateKey(
  { name: "AES-GCM", length: 256 },
  true, // extractable
  ["encrypt", "decrypt"]
);

// 2. 生成 12 字节 IV（每次不重用！）
const iv = crypto.getRandomValues(new Uint8Array(12));

// 3. 加密（返回密文 + GCM tag 拼接的 ArrayBuffer）
const ciphertext = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv, tagLength: 128 },
  key,
  new TextEncoder().encode("hello world")
);

// 4. 解密（同一 key + iv + tagLength）
const plaintext = await crypto.subtle.decrypt(
  { name: "AES-GCM", iv, tagLength: 128 },
  key,
  ciphertext
);
console.log(new TextDecoder().decode(plaintext)); // "hello world"
```

### SHA-256 摘要

```ts
const digest = await crypto.subtle.digest(
  "SHA-256",
  new TextEncoder().encode("hello")
);
// ArrayBuffer → hex
const hex = [...new Uint8Array(digest)]
  .map((b) => b.toString(16).padStart(2, "0"))
  .join("");
console.log(hex); // 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e730...
```

## crypto-js 现状（重要）

**crypto-js v4.2.0（2023）**：官方仓库与 npm 页面均明确标注：

> Active development of CryptoJS has been discontinued. This library is no longer maintained.

**迁移建议**：

| 场景 | crypto-js（旧） | 现代替代 |
| --- | --- | --- |
| 浏览器 AES | `CryptoJS.AES.encrypt(...)` | `crypto.subtle.encrypt("AES-GCM", ...)` |
| 浏览器 SHA-256 | `CryptoJS.SHA256(str).toString()` | `crypto.subtle.digest("SHA-256", ...)` |
| 浏览器 HMAC | `CryptoJS.HmacSHA256(msg, key)` | `crypto.subtle.sign("HMAC", ...)` |
| Node AES | `CryptoJS.AES` | `crypto.createCipheriv("aes-256-gcm", ...)` |
| Node 摘要 | `CryptoJS.SHA256` | `crypto.createHash("sha256")` |

**迁移坑**：

- crypto-js 自带 EVP_BytesToKey 式 KDF（密钥从 passphrase 派生），Web Crypto 工作流是显式 `deriveKey` + PBKDF2，**两套工作流不兼容**——旧密文用 Web Crypto 解不开
- crypto-js 默认输出 OpenSSL 格式（`Salted__` 前缀），Web Crypto 没有
- crypto-js 仍含 MD5 / SHA1，新项目绝不该用其做安全用途

## 安全边界（必须分清）

| 场景 | 谁负责 | 前端能做什么 |
| --- | --- | --- |
| 传输加密 | 浏览器与服务器（TLS） | 不能关闭 / 绕过，只能感知（如 HSTS） |
| 客户端加密 | 前端 JS | AES-GCM 文件加密、客户端摘要、HMAC |
| 静态加密 | 后端 / DBA | KMS / HSM / Vault；前端不参与 |
| 密码哈希 | 后端 | Argon2id / bcrypt；前端**只能**做客户端 hash 混淆（不增安全） |
| TLS 证书校验 | 浏览器 | 证书 pinning / HSTS 是浏览器与网络层 |
| 密钥托管 | 后端 / 系统 | 前端**不应**持有真正机密密钥 |

> **反模式**：把密码在浏览器端 hash 后再发后端，认为这就安全了——浏览器 hash 本身不增加安全性，后端仍须做 Argon2id。前端加密只作额外层（client-side encryption），传输安全仍由 TLS 保证。

## 下一步

- [核心算法与实践](./guide-line.md)：对称（AES-GCM IV / Key）+ 非对称（RSA / ECC）+ 哈希（SHA-2 / argon2 / bcrypt）+ PKI（X.509 / CA 链）+ Crypto.js + Web Crypto API（SubtleCrypto）+ 反模式
- [参考](./reference.md)：算法对比表 + Web Crypto API 表 + 官方资源
