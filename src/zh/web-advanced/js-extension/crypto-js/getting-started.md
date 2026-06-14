---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇带你装上 crypto-js 并写出第一段哈希 / HMAC / AES 代码。版本基线 **crypto-js 4.2.0**。核心认知：**所有二进制数据都是 WordArray，要看结果就 `.toString(编码器)`**；对称加密分「**字符串口令**」与「**WordArray key+iv**」两种模式——这两条贯穿全篇。涉及安全注意处会标注 ⚠️。

## 速查

- 安装：`npm install crypto-js`（pnpm `pnpm add crypto-js`、yarn 同理）；TS 类型 `npm i -D @types/crypto-js`
- 引入：`import CryptoJS from "crypto-js"`，全部功能挂在 `CryptoJS` 命名空间
- 哈希：`CryptoJS.SHA256("msg").toString()`（默认 Hex）；空串也有确定摘要
- HMAC：`CryptoJS.HmacSHA256("msg", "key").toString()`（带密钥的消息认证）
- AES（口令模式）：`CryptoJS.AES.encrypt("msg", "passphrase").toString()` → 解密 `decrypt(ct, "passphrase").toString(CryptoJS.enc.Utf8)`
- 默认模式/填充：**CBC + Pkcs7**；encrypt 返回的是 **CipherParams 对象**，不是字符串
- ⚠️ 第二参数是**字符串**→当口令（KDF 派生 key+IV，带 salt）；是 **WordArray**→当原始密钥（需显式 IV）
- ⚠️ MD5/SHA1/DES/RC4 已不安全，仅用于兼容；密码存储、签名、新项目安全场景**优先原生 Web Crypto / Node crypto**

## 一、crypto-js 是什么

官方定位：「**JavaScript implementations of standard and secure cryptographic algorithms**」。三个关键点：

1. **纯 JS、同步**：自带算法实现，不依赖原生加密 API，调用是同步的，没有 Promise。
2. **算法齐全**：哈希、HMAC、对称加密、编码器、密钥派生一站式。
3. **跨环境**：能跑在没有 Web Crypto 的旧浏览器、小程序、旧 webview。

> ⚠️ **维护现状**：crypto-js 官方已声明「停止主动开发、不再维护」，并建议新项目改用原生 `crypto`（Node）/ Web Crypto（浏览器）。本篇会教你正确使用它，同时在安全关键处给出原生替代建议。

## 二、安装与引入

```bash
npm install crypto-js
npm install -D @types/crypto-js   # TypeScript 项目补类型（社区维护）
```

```ts
import CryptoJS from "crypto-js";

// 也可按子路径只引用到的算法（减小打包体积，见进阶篇）
import sha256 from "crypto-js/sha256";
```

引入后，哈希在 `CryptoJS.MD5/SHA256/...`、HMAC 在 `CryptoJS.HmacSHA256`、对称加密在 `CryptoJS.AES/DES/...`、编码器在 `CryptoJS.enc.*`、模式在 `CryptoJS.mode.*`、填充在 `CryptoJS.pad.*`。

## 三、第一段哈希

```ts
const hash = CryptoJS.SHA256("Message");
console.log(hash.toString());                  // 默认 Hex：十六进制字符串
console.log(hash.toString(CryptoJS.enc.Base64)); // 也可输出 Base64
```

要点：

- `CryptoJS.SHA256(...)` 返回的是 **WordArray**（不是字符串），必须 `.toString()` 才得到可读输出。
- WordArray 的 `toString()` **默认用 Hex**，等价于 `toString(CryptoJS.enc.Hex)`。
- 方法名**全大写**：`SHA256`、`MD5`、`RIPEMD160`；SHA3 要指定位数：`CryptoJS.SHA3("Message", { outputLength: 512 })`。

支持的哈希：`MD5`、`SHA1`、`SHA224`、`SHA256`、`SHA384`、`SHA512`、`SHA3`、`RIPEMD160`。

> ⚠️ MD5/SHA1 已不抗碰撞，只能用于非安全的校验和 / 对接老接口，**不可用于签名、防篡改、密码存储**。

## 四、HMAC：带密钥的消息认证

```ts
const mac = CryptoJS.HmacSHA256("Message", "Secret Key");
console.log(mac.toString());   // 十六进制
```

- 签名为 `Hmac<ALG>(message, key)`：第一参数消息、第二参数密钥。
- HMAC 比「`SHA256(key + message)` 朴素拼接」安全得多（抗长度扩展等）。
- 用途：API 签名、Webhook 校验、令牌完整性。校验时建议**常量时间比较**（见专家篇）。

## 五、第一段 AES（口令模式）

最简单的写法是传**字符串口令**：

```ts
// 加密：返回 CipherParams，.toString() 得到 OpenSSL 格式 Base64（含 salt）
const ciphertext = CryptoJS.AES.encrypt("my message", "secret key 123").toString();

// 解密：decrypt 返回 WordArray，必须用 enc.Utf8 转回原文
const bytes = CryptoJS.AES.decrypt(ciphertext, "secret key 123");
const plaintext = bytes.toString(CryptoJS.enc.Utf8);
console.log(plaintext);  // "my message"
```

三个易错点：

1. **encrypt 的返回值是 CipherParams 对象**，不是字符串——要 `.toString()` 才能传输/存储。
2. **解密结果是 WordArray**，漏掉 `CryptoJS.enc.Utf8` 会得到一串 Hex（默认），看着像乱码。
3. **口令模式默认 CBC + Pkcs7**，密文以 `U2FsdGVk...`（即 `Salted__` 的 Base64）开头，可与 `openssl enc` 互通。

> ⚠️ 口令模式底层用 OpenSSL 的 EvpKDF（默认 **MD5 + 单次迭代**）从口令派生 key+IV，**派生强度很弱**，只适合 OpenSSL 兼容/低敏感场景。真正要保护口令，请用 PBKDF2（见基础/专家篇）。

## 六、口令模式 vs 直接传 key+iv（最重要的认知）

crypto-js 按第二个参数的**类型**分流：

```ts
// 模式 A：字符串 → 当「口令」，自动用 KDF + 随机 salt 派生 key 和 IV
CryptoJS.AES.encrypt("msg", "passphrase");

// 模式 B：WordArray → 当「原始密钥」，直接使用，必须显式给 IV
const key = CryptoJS.enc.Hex.parse("000102...0f"); // 32 字节 → AES-256
const iv  = CryptoJS.enc.Hex.parse("101112...1f"); // 16 字节
CryptoJS.AES.encrypt("msg", key, { iv });
```

| | 字符串口令（模式 A） | WordArray key（模式 B） |
|---|---|---|
| 第二参数 | 字符串 | WordArray |
| 处理 | 走 KDF 派生 key+IV，带随机 salt | 直接当密钥，**需自己给 IV** |
| 输出 | OpenSSL 格式（含 salt） | 裸密文（无 salt） |
| 互通 | 与 `openssl enc` 口令互通 | 与外部约定 key/IV 的系统互通 |

> ⚠️ 两种模式**不可混用**：口令加密的密文必须用同样口令解密；key 加密的必须用同样 key+IV 解密。混用通常不报错，只是悄悄得到错误结果。

## 七、看一眼 WordArray 与编码器

```ts
// 文本 → WordArray → Base64
const wa = CryptoJS.enc.Utf8.parse("Hello");
const b64 = CryptoJS.enc.Base64.stringify(wa); // "SGVsbG8="

// Base64 → WordArray → 文本（前提是字节本身是合法 UTF-8）
const back = CryptoJS.enc.Base64.parse(b64).toString(CryptoJS.enc.Utf8); // "Hello"

// 生成随机 salt / IV（参数单位是字节）
const salt = CryptoJS.lib.WordArray.random(16); // 128 位
```

编码器成对提供 `parse`（字符串→WordArray）与 `stringify`（WordArray→字符串）：`enc.Hex`、`enc.Latin1`、`enc.Utf8`、`enc.Utf16`、`enc.Base64`、`enc.Base64url`。

---

会用基本命令后，进入 [指南 · 基础](./guide-line/base)：WordArray 与编码器、哈希 vs 加密的本质、AES 双模式的内部机制、模式与填充、PBKDF2 安全派生。
