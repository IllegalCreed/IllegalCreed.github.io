---
layout: doc
outline: [2, 3]
---

# 参考

> crypto-js **常用 API、命名空间、模式 / 填充 / 编码器** 速查。版本基线 **crypto-js 4.2.0**。所有内容都挂在 `CryptoJS` 命名空间下。

## 速查

- 维护状态：**当前最新为 4.2.0，项目已停止维护**；新项目安全功能优先 Web Crypto / Node `crypto`
- 哈希：`SHA256` / `SHA512` 可用于摘要；`MD5` / `SHA1` 仅兼容；`CryptoJS.SHA3` 实际是 **Keccak[c=2d]**，不等同 NIST SHA-3
- HMAC：`CryptoJS.HmacSHA256(message, key)` 返回 `WordArray`；验签应使用平台常量时间 API
- AES：第二参数为字符串时走口令模式，为 `WordArray` 时走原始 key 模式；后者必须显式传 IV
- 模式：默认 **CBC + Pkcs7**；库没有 GCM / CCM 等 AEAD，密文认证需另做 Encrypt-then-MAC 或改用 AES-GCM
- KDF：4.2.0 的 `PBKDF2` 默认 SHA-256 / 250000 次；口令模式内部 `EvpKDF` 仍是 MD5 / 1 次
- 随机数：`WordArray.random(n)` 的单位是字节，4.x 调用原生 `getRandomValues` / `randomBytes`，不可用时直接抛错
- TypeScript：主包不带声明，需安装 `@types/crypto-js`；`keySize` 的单位是 32 位 word，不是字节

## 一、哈希（Hash）

| 函数 | 说明 | 输出 |
|---|---|---|
| `CryptoJS.MD5(msg)` | MD5（⚠️ 已不抗碰撞，仅兼容） | 128 位 WordArray |
| `CryptoJS.SHA1(msg)` | SHA-1（⚠️ 已不抗碰撞，仅兼容） | 160 位 |
| `CryptoJS.SHA224(msg)` | SHA-224 | 224 位 |
| `CryptoJS.SHA256(msg)` | SHA-256（常用） | 256 位 |
| `CryptoJS.SHA384(msg)` | SHA-384 | 384 位 |
| `CryptoJS.SHA512(msg)` | SHA-512 | 512 位 |
| `CryptoJS.SHA3(msg, { outputLength })` | **Keccak[c=2d]**（历史命名为 SHA3），位数 224/256/384/512 | 按 outputLength |
| `CryptoJS.RIPEMD160(msg)` | RIPEMD-160 | 160 位 |

```ts
CryptoJS.SHA256("Message").toString();                 // Hex
CryptoJS.SHA3("Message", { outputLength: 512 }).toString();
```

渐进式（流式）哈希：

```ts
const sha = CryptoJS.algo.SHA256.create();
sha.update("part1"); sha.update("part2");
const hash = sha.finalize();      // 复用同一实例算下一条前需 sha.reset()
```

## 二、HMAC

| 函数 | 说明 |
|---|---|
| `CryptoJS.HmacMD5(msg, key)` | HMAC-MD5（⚠️ 弱） |
| `CryptoJS.HmacSHA1(msg, key)` | HMAC-SHA1 |
| `CryptoJS.HmacSHA256(msg, key)` | HMAC-SHA256（常用） |
| `CryptoJS.HmacSHA224 / 384 / 512(msg, key)` | 其它 SHA 变体 |
| `CryptoJS.HmacSHA3(msg, key)` | HMAC-SHA3 |
| `CryptoJS.HmacRIPEMD160(msg, key)` | HMAC-RIPEMD160 |

签名统一为 `Hmac<ALG>(message, key)`，返回 WordArray。

## 三、对称加密（Cipher）

| 算法 | 类型 | 安全立场 |
|---|---|---|
| `CryptoJS.AES` | 分组密码（128 位块） | **推荐**（新项目优先原生 AES-GCM） |
| `CryptoJS.DES` | 分组密码 | ⚠️ 不安全，仅兼容 |
| `CryptoJS.TripleDES` | 分组密码 | ⚠️ 已被淘汰，仅兼容 |
| `CryptoJS.Rabbit` | 流密码 | 仅兼容 |
| `CryptoJS.RabbitLegacy` | 流密码（旧实现） | 仅兼容 |
| `CryptoJS.RC4` | 流密码 | ⚠️ 已弃用 |
| `CryptoJS.RC4Drop` | 流密码（丢弃初始密钥流） | ⚠️ 已弃用 |

统一接口（所有分组/流密码一致）：

```ts
// 口令模式（字符串）：自动派生 key+IV，带 salt，OpenSSL 兼容
const ct = CryptoJS.AES.encrypt("msg", "passphrase").toString();
const pt = CryptoJS.AES.decrypt(ct, "passphrase").toString(CryptoJS.enc.Utf8);

// key+iv 模式（WordArray）：直接用密钥，需显式 IV
CryptoJS.AES.encrypt("msg", keyWordArray, { iv, mode, padding });
CryptoJS.AES.decrypt(cipherParamsOrString, keyWordArray, { iv, mode, padding });
```

## 四、加密模式（CryptoJS.mode.*）

| 模式 | 说明 |
|---|---|
| `CryptoJS.mode.CBC` | **默认**，需 IV，需块填充 |
| `CryptoJS.mode.CFB` | 反馈模式，流式 |
| `CryptoJS.mode.CTR` | 计数器模式，流式（无需填充） |
| `CryptoJS.mode.CTRGladman` | CTR 的 Gladman 变体 |
| `CryptoJS.mode.OFB` | 输出反馈，流式（无需填充） |
| `CryptoJS.mode.ECB` | ⚠️ 不用 IV，相同明文块→相同密文块，泄露模式，勿用 |

> ⚠️ crypto-js **不支持 GCM/CCM 等 AEAD 认证加密**；需要完整性认证要额外加 HMAC，或改用原生 Web Crypto 的 AES-GCM。

## 五、填充（CryptoJS.pad.*）

| 填充 | 说明 |
|---|---|
| `CryptoJS.pad.Pkcs7` | **默认**，补值=补的字节数，解密自动去除 |
| `CryptoJS.pad.AnsiX923` | 末字节记长度，其余补 0 |
| `CryptoJS.pad.Iso10126` | 末字节记长度，其余随机 |
| `CryptoJS.pad.Iso97971` | ISO/IEC 9797-1 |
| `CryptoJS.pad.ZeroPadding` | 补 0（⚠️ 明文末尾本就有 0 时有歧义） |
| `CryptoJS.pad.NoPadding` | 不填充（明文必须是块大小整数倍） |

```ts
CryptoJS.AES.encrypt("Message", "Secret Passphrase", {
  mode: CryptoJS.mode.CFB,
  padding: CryptoJS.pad.AnsiX923,
});
```

## 六、编码器（CryptoJS.enc.*）

| 编码器 | parse（字符串→WordArray） | stringify（WordArray→字符串） |
|---|---|---|
| `CryptoJS.enc.Hex` | 十六进制串 → WordArray | WordArray → 十六进制（哈希默认） |
| `CryptoJS.enc.Latin1` | Latin1 文本 → WordArray | → Latin1 |
| `CryptoJS.enc.Utf8` | UTF-8 文本 → WordArray | → UTF-8（解密取原文用它） |
| `CryptoJS.enc.Utf16` / `Utf16LE` | UTF-16 文本 → WordArray | → UTF-16 |
| `CryptoJS.enc.Base64` | Base64 → WordArray | → Base64 |
| `CryptoJS.enc.Base64url` | Base64url → WordArray | → Base64url |

```ts
const wa = CryptoJS.enc.Hex.parse("48656c6c6f");        // "Hello" 的 hex
const hex = wa.toString(CryptoJS.enc.Hex);
const b64 = CryptoJS.enc.Base64.stringify(wa);
```

## 七、密钥派生（KDF）

| 函数 | 默认 hasher | 默认迭代 | 用途 |
|---|---|---|---|
| `CryptoJS.PBKDF2(pwd, salt, { keySize, iterations, hasher })` | **SHA256** | **250000**（4.2.0） | 显式口令派生；参数仍应按安全策略调优 |
| `CryptoJS.EvpKDF(pwd, salt, { keySize, iterations, hasher })` | **MD5** | **1** | OpenSSL 兼容（口令模式内部用，⚠️ 弱） |

```ts
const salt = CryptoJS.lib.WordArray.random(128 / 8);
const key  = CryptoJS.PBKDF2("Secret Passphrase", salt, {
  keySize: 256 / 32,   // 单位是 32 位字：256 位 = 8
  iterations: 250000,
});
```

> keySize **单位是字（word，32 位）**：128 位写 `128/32`（=4），256 位写 `256/32`（=8）。

## 八、底层类型（CryptoJS.lib.*）

| 成员 | 说明 |
|---|---|
| `CryptoJS.lib.WordArray` | 核心数据结构：32 位字数组，含 `words`、`sigBytes` |
| `CryptoJS.lib.WordArray.random(n)` | 生成 n **字节**的随机 WordArray（salt/IV 用） |
| `CryptoJS.lib.WordArray.create(words, sigBytes)` | 手动构造 WordArray |
| `CryptoJS.lib.CipherParams.create({ ciphertext, ... })` | 手动构造密文参数（解裸密文时用） |
| `CryptoJS.algo.<ALG>` | 算法类（渐进式 API：`create()`/`update()`/`finalize()`/`reset()`） |

### CipherParams 字段

`encrypt` 返回的 CipherParams 含：`ciphertext`、`key`、`iv`、`salt`、`algorithm`、`mode`、`padding`、`blockSize`、`formatter`。其 `toString(formatter)` 默认走 OpenSSL 格式（`Salted__`+salt+密文 的 Base64）。

---

命令查完，进 [指南 · 基础](./guide-line/base) 理解机制，或看 [指南 · 进阶](./guide-line/advanced) / [专家](./guide-line/expert) 的安全实战。
