---
layout: doc
---

# crypto-js

::: tip 本篇范围
本篇聚焦 **crypto-js**——一个用纯 JavaScript 实现的加密算法库。重点在：**哈希（MD5/SHA 系列/SHA3/RIPEMD160）、HMAC、对称加密（AES/DES/3DES/Rabbit/RC4）、编码器（Base64/Hex/Utf8…）、WordArray 数据结构、密钥派生（PBKDF2/EvpKDF）、加密模式（CBC 默认/CFB/CTR/OFB/ECB）与填充（Pkcs7 默认）、CipherParams 结构、口令模式 vs 直接传 key+iv**。版本基线 **crypto-js 4.2.0**，并贯穿两条安全主线：**MD5/SHA1/DES/RC4 仅用于兼容**，以及 **与原生 Web Crypto API 的取舍**。
:::

crypto-js 是由 **Jeff Mott** 等发起、长期由 **brix** 维护的纯 JS 加密库，官方一句话可概括为「**JavaScript implementations of standard and secure cryptographic algorithms**」——用 JavaScript 实现一批标准加密算法。它最大的特点是 **同步 API、调用极简、不依赖运行环境的原生加密能力**：`CryptoJS.SHA256("msg")`、`CryptoJS.AES.encrypt("msg", "pass")` 一行就能用，因此能跑在没有 Web Crypto 的老浏览器、部分小程序/旧 webview 等受限环境里。

理解 crypto-js 的关键是它的核心数据结构 **WordArray**（32 位字的数组）——哈希结果、密钥、IV、salt、密文统统是 WordArray，再通过 **编码器**（`CryptoJS.enc.*` 的 `parse`/`stringify`）在字符串与 WordArray 间转换。另一关键是对称加密的「**双模式**」：第二个参数传**字符串**当口令（走 OpenSSL 的 KDF 派生 key+IV，带 salt），传 **WordArray** 当原始密钥（需显式给 IV）——这是最高频的坑。**2026 年的现状**：crypto-js 官方已明确「**Active development has been discontinued. This library is no longer maintained.**」（停止主动开发、不再维护），理由是如今 Node 与现代浏览器都内置原生 Crypto，继续开发只会让它沦为原生 Crypto 的包装层，且原生模块自带安全随机数。**官方建议新项目转向原生 `crypto`（Node）/ Web Crypto（浏览器）**，crypto-js 仅在「受限环境 + 非高安全 + 需同步 API 或与既有数据互通」时仍有价值。

## 评价

**优点**

- **API 极简、同步**：`CryptoJS.SHA256(x)` / `CryptoJS.AES.encrypt(...)` 一行可用，无 Promise，心智负担低
- **算法齐全**：哈希（MD5/SHA1/SHA224/SHA256/SHA384/SHA512/SHA3/RIPEMD160）、HMAC、AES/DES/3DES/Rabbit/RC4、PBKDF2/EvpKDF、多种编码器一站式
- **跨环境、零原生依赖**：纯 JS 实现，能跑在无 Web Crypto 的旧浏览器、小程序、旧 webview
- **OpenSSL 兼容**：口令模式默认输出 `Salted__` Base64，可与 `openssl enc` 命令行互通
- **按需引入**：每个算法是独立子模块（`crypto-js/sha256`、`crypto-js/aes`…），可减小打包体积
- **生态成熟、用例多**：历史悠久，存量项目与教程丰富，对接遗留系统方便

**缺点**

- **已停止维护**：官方声明 discontinued / no longer maintained，不再有安全更新与新特性
- **缺 AEAD（GCM）**：不支持 AES-GCM 等带完整性认证的模式，需要认证只能自行加 HMAC
- **口令模式默认 KDF 很弱**：字符串口令走 EvpKDF（默认 **MD5 + 单次迭代**），抗暴力破解能力差，仅适合 OpenSSL 兼容
- **性能不及原生**：纯 JS 实现，大批量/热路径加密慢于 Node crypto / Web Crypto（C/OpenSSL 实现）
- **随机源与安全性偏弱**：随机数质量不及原生 `crypto.getRandomValues`/`randomBytes`，安全敏感场景不宜
- **易踩「口令 vs key」坑**：把字符串口令误当原始密钥、加解密两端模式不一致，是高频错误来源
- **类型需另装**：TypeScript 类型在 `@types/crypto-js`（社区维护），且可能滞后

## 文档地址

[CryptoJS Documentation](https://cryptojs.gitbook.io/docs/)

## GitHub 地址

[brix/crypto-js](https://github.com/brix/crypto-js)

## 幻灯片地址

<a href="/SlideStack/crypto-js-slide/" target="_blank">crypto-js</a>
