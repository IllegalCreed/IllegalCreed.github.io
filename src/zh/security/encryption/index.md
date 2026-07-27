---
layout: doc
---

# 加密

加密是把可读明文通过算法与密钥转换成不可读密文、只有持密钥者才能还原的技术，前端可触及的加密分四个层次：**传输加密**（TLS，由浏览器与网络层完成）、**客户端加密**（浏览器用 Web Crypto API 做 AES-GCM 文件加密、SHA-256 客户端摘要、HMAC、ECDH 密钥协商）、**静态加密**（数据库列加密 / KMS / HSM / Vault，后端层）、**密码哈希**（Argon2id / bcrypt / scrypt / PBKDF2 慢哈希，后端层）。浏览器原生接口是 **Web Crypto API**（`window.crypto.subtle` / `self.crypto.subtle`），它基于 [W3C Web Cryptography API Level 2](https://www.w3.org/TR/webcrypto-2/)，所有方法返回 `Promise`、操作 `ArrayBuffer`、仅安全上下文（HTTPS / localhost）可用，覆盖 AES-CBC / AES-GCM / AES-CTR / RSA-OAEP 加密、SHA-1/256/384/512 摘要、RSASSA-PKCS1-v1_5 / RSA-PSS / ECDSA / Ed25519 / HMAC 签名、PBKDF2 / HKDF / ECDH / X25519 密钥派生、`generateKey` / `importKey` / `exportKey` / `wrapKey` / `unwrapKey` 完整密钥生命周期。前端另一常见库是 **crypto-js**（v4.2.0），但官方仓库与 npm 已明确标注 **Discontinued / 不再维护**，新项目应迁移到 `node:crypto`（Node）或 `window.crypto.subtle`（浏览器）。需要明确边界：前端加密**无法替代 HTTPS**（浏览器内密钥可被 F12 提取），也**无法替代后端密码哈希**（浏览器端 hash 只是混淆、后端仍须 Argon2id）；argon2 / bcrypt / scrypt 浏览器原生不支持，需要 WASM 端口如 argon2-browser。

## 评价

**优点**

- **官方标准、生态默认**：Web Crypto API 是 W3C 规范、所有主流浏览器原生支持，无需引入第三方库
- **二进制优先**：所有方法操作 `ArrayBuffer` / `TypedArray`，避免字符串编码坑，性能优于纯 JS 实现
- **异步 Promise**：不阻塞主线程，天然适合大文件加密、批量摘要
- **安全上下文强制**：HTTPS / localhost 才可用，避免中间人攻击加密流量被解密
- **算法覆盖广**：对称、非对称、摘要、签名、密钥派生、密钥包装一站式
- **AEAD 模式内置**：AES-GCM 加密 + 认证一体，规避 CBC 单独配 MAC 的漏配风险
- **CSPRNG 内置**：`crypto.getRandomValues` 提供密码学强随机数

**缺点**

- **API 命名为 "subtle" 即承认易误用**：底层原语 footgun 多（IV 重用、ECB 模式、密钥硬编码），需要明白每一步含义
- **不支持的算法很多**：argon2 / bcrypt / scrypt / SM4 / 国密算法原生不支持，需 WASM
- **无内置密钥托管**：KMS / HSM / Vault 集成需自己做，前端不应持有真正的机密密钥
- **历史库 crypto-js 已停更**：仍含 MD5 / SHA1 等弱算法，新项目不该选
- **前端加密无法替代 HTTPS**：浏览器内代码与密钥均可被攻击者提取，只作额外层
- **RSA 直接加密有长度限制**：2048 位 + SHA-256 ≈ 190 字节，大数据必须用混合加密
- **迁移成本**：crypto-js 自带 EVP_BytesToKey 式 KDF 与 Web Crypto 工作流不同，迁库不是替换 API 那么简单

## 文档地址

- [MDN Web Docs - SubtleCrypto](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto)
- [W3C Web Cryptography API Level 2](https://www.w3.org/TR/webcrypto-2/)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [RFC 5280 - Internet X.509 PKI](https://datatracker.ietf.org/doc/html/rfc5280)
- [crypto-js npm 页面](https://www.npmjs.com/package/crypto-js)（已标注 Discontinued）

## GitHub地址

[nodejs/node](https://github.com/nodejs/node)（含 `node:crypto`） · [brix/crypto-js](https://github.com/brix/crypto-js)（已 Discontinued） · [browserify/jsbn](https://github.com/browserify/jsbn)（RSA 纯 JS 实现，历史项目）

## 幻灯片地址

<a href="/SlideStack/encryption-slide/" target="_blank">加密</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=710" target="_blank" rel="noopener noreferrer">加密测试题</a>

