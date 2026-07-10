---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **crypto-js 4.2.0**。本篇把「会调用」用到「懂机制」：WordArray 与编码器、哈希 vs 加密的本质、AES 两种模式的内部分流、加密模式与填充、口令派生入门。

## 速查

- `WordArray` 用 32 位 `words` 存数据，以 `sigBytes` 标记真实字节数；手工构造时两者必须一致
- 编码器：`enc.*.parse()` 把字符串变成 `WordArray`，`stringify()` / `toString(encoder)` 反向输出；默认输出 Hex
- 摘要不是加密：哈希不可逆且不带密钥；需要来源认证时使用 HMAC，不要拼接 `hash(key + message)`
- `AES.encrypt(msg, "pass")` 走口令 KDF；`AES.encrypt(msg, keyWordArray, { iv })` 直接用原始密钥，两条路径不能混用
- `CipherParams#toString()` 默认输出 OpenSSL `Salted__` 格式；裸 `ciphertext` 不包含 salt、key 或 IV
- 默认分组配置是 **CBC + Pkcs7**；IV 不保密但必须随机且不可复用，ECB 不应使用
- crypto-js 不提供 AEAD；需要同时保证机密性与完整性时优先 AES-GCM，或严格采用 Encrypt-then-MAC
- 4.2.0 `PBKDF2` 默认 SHA-256 / 250000 次；`WordArray.random()` 使用原生安全随机源，缺失时会抛错

## 一、WordArray：贯穿全库的数据结构

crypto-js 内部不直接用字符串或 `Uint8Array`，而是用 **WordArray**（`CryptoJS.lib.WordArray`）——一个 **32 位字（word）的数组**。哈希结果、密钥、IV、salt、密文，全是 WordArray。

两个关键属性：

- `words`：`number[]`，每个元素是一个 32 位整数（int32）。
- `sigBytes`：**有效字节数**。因为按 32 位字存，最后一个字可能只有部分字节有效，所以真实长度由 `sigBytes` 决定（如 5 字节数据，`words` 占 2 个 int32，但 `sigBytes = 5`）。

```ts
const wa = CryptoJS.enc.Utf8.parse("Hello"); // 5 字节
console.log(wa.sigBytes);  // 5
console.log(wa.words.length); // 2（8 字节空间，但有效 5 字节）
```

> 手动构造 WordArray（`CryptoJS.lib.WordArray.create(words, sigBytes)`）时，**必须正确设置 sigBytes**，否则编码、拼接都会出错。

随机数据（salt/IV）：

```ts
const salt = CryptoJS.lib.WordArray.random(16); // 参数单位是字节，16 字节 = 128 位
```

> crypto-js 4.x 的 `WordArray.random()` 会调用原生 `crypto.getRandomValues` / `crypto.randomBytes`，不会回退到 `Math.random()`；环境没有可用原生 Crypto 时会直接抛错。新项目仍应优先直接使用平台 API，减少停更依赖与格式误用。

## 二、编码器：字符串 ↔ WordArray

编码器（`CryptoJS.enc.*`）成对提供 `parse`（字符串→WordArray）与 `stringify`（WordArray→字符串）：

```ts
// 文本 → WordArray
const wa = CryptoJS.enc.Utf8.parse("Hello");
// WordArray → Base64 / Hex
const b64 = CryptoJS.enc.Base64.stringify(wa);
const hex = wa.toString(CryptoJS.enc.Hex);   // 等价 enc.Hex.stringify(wa)
```

可用编码器：`Hex`、`Latin1`、`Utf8`、`Utf16`/`Utf16LE`、`Base64`、`Base64url`。

::: tip 两个关键约定
① **WordArray.toString() 默认用 Hex**——所以哈希结果不传参就是十六进制。
② **解密结果必须 `toString(CryptoJS.enc.Utf8)`** 才得到原文（默认 Hex 会像乱码）。
:::

理解一句话：**编码器只搬运字节，不保证内容是文本**。`enc.Base64.parse(b64).toString(enc.Utf8)` 能成功，前提是这段字节本就是合法 UTF-8；若是密文/图片等二进制，按 UTF-8 解码会乱码或报错。

## 三、哈希 vs 加密：本质区别

| | 哈希（MD5/SHA…） | 加密（AES/DES…） |
|---|---|---|
| 方向 | **单向、不可逆** | **可逆**（持密钥可解回） |
| 是否要密钥 | 否（HMAC 才要） | 是 |
| 输出长度 | 固定（与输入长度无关） | 随明文增长 |
| 用途 | 完整性校验 / 指纹 | 机密性保护 |

- 哈希对**任意长度输入（含空串）**产生**定长、确定性**输出（同输入恒同输出）——这是做指纹/校验和的基础。`CryptoJS.MD5("")` 也有确定结果。
- **不存在「解哈希」**。想「解密 MD5」是常见误解；哈希只能比对，不能还原。
- 哈希作用于**字节**：字符串默认按 **UTF-8** 编码成字节再哈希，跨端比对必须两边「文本→字节」用同一编码（通常 UTF-8），否则字节不同、摘要不同。

## 四、HMAC：给哈希加上密钥

裸哈希谁都能算，只验证「数据没变」。**HMAC** 引入密钥，只有持钥方能算出/校验，可同时验证**完整性 + 来源真实性**：

```ts
const mac = CryptoJS.HmacSHA256("Message", "Secret Key").toString();
```

HMAC 采用 ipad/opad 双层结构，比朴素的 `SHA256(key + message)` 安全（抗长度扩展攻击）。

## 五、AES 的两种模式：内部分流

这是 crypto-js 最该吃透的机制。`AES.encrypt(message, secondArg, cfg)` 按 `secondArg` 的**类型**分流到两条路径：

```text
secondArg 是 string  → PasswordBasedCipher
                        用 OpenSSL KDF(EvpKDF) + 随机 salt 派生 key 和 IV
                        输出 CipherParams（含 salt），toString() 为 OpenSSL 格式

secondArg 是 WordArray → SerializableCipher
                        直接把 WordArray 当原始密钥，不派生
                        必须在 cfg.iv 显式提供 IV，输出不含 salt
```

```ts
// 路径 A：口令
CryptoJS.AES.encrypt("msg", "passphrase");

// 路径 B：原始密钥（32 字节 key → AES-256）
const key = CryptoJS.enc.Hex.parse("000102030405060708090a0b0c0d0e0f...");
const iv  = CryptoJS.lib.WordArray.random(16);
CryptoJS.AES.encrypt("msg", key, { iv });
```

::: warning 不可混用
口令加密 → 必须口令解密；key 加密 → 必须同 key+IV 解密。混用通常**不报错**，只是悄悄得到错误结果（解密成空/乱码），极难排查。
:::

## 六、CipherParams 与 OpenSSL 格式

`encrypt` 返回的不是字符串，而是 **CipherParams** 对象，聚合了 `ciphertext`、`key`、`iv`、`salt`、`algorithm`、`mode`、`padding` 等。

```ts
const enc = CryptoJS.AES.encrypt("msg", "passphrase");
enc.salt;        // 随机盐（口令模式）
enc.ciphertext;  // 裸密文 WordArray
enc.toString();  // OpenSSL 格式：Base64("Salted__" + salt + 密文)
```

口令模式 `toString()` 走 **OpenSSL 格式化器**，输出 `U2FsdGVk...`（即 `Salted__` 的 Base64），salt 内嵌其中，解密时据此重派生 key+IV——这让它能与命令行 `openssl enc` 互通。

> 区别：`enc.toString()` 含 salt（可自解密）；`enc.ciphertext.toString(CryptoJS.enc.Base64)` 只是**裸密文**、不含 salt（解密需另存 key/IV）。

## 七、模式与填充

**默认：CBC + Pkcs7。** 通过 cfg 覆盖：

```ts
CryptoJS.AES.encrypt("Message", "Secret Passphrase", {
  mode: CryptoJS.mode.CTR,
  padding: CryptoJS.pad.NoPadding,
});
```

- **模式**：`CBC`（默认，需 IV+填充）、`CFB`、`CTR`、`OFB`（流式，无需填充）、`ECB`（⚠️ 勿用）。
- **填充**：`Pkcs7`（默认）、`AnsiX923`、`Iso10126`、`Iso97971`、`ZeroPadding`、`NoPadding`。
- CBC 的 **IV 不需保密，但必须每次随机且唯一**，并随密文一起存；复用固定 IV 会泄露明文相似性。
- ⚠️ ECB 对每块独立加密，相同明文块→相同密文块，泄露结构（经典的「加密图片仍见轮廓」），**不要用**。

## 八、口令派生入门：PBKDF2

口令模式默认的 EvpKDF（MD5+单次）很弱。要安全地从口令派生密钥，用 **PBKDF2**：

```ts
const salt = CryptoJS.lib.WordArray.random(128 / 8);
const key  = CryptoJS.PBKDF2("Secret Passphrase", salt, {
  keySize: 256 / 32,   // keySize 单位是 32 位字：256 位 = 8
  iterations: 250000,
});
// 再以 WordArray key + 随机 IV 加密
const iv = CryptoJS.lib.WordArray.random(128 / 8);
const ct = CryptoJS.AES.encrypt("msg", key, { iv });
```

salt 与 IV 都**不需保密**，与密文一起存即可；它们的作用是让相同口令/明文每次得到不同结果。

---

进入 [指南 · 进阶](./advanced)：按需引入与体积、各算法实战、与 OpenSSL 互通、解密裸密文、TypeScript 用法。
