---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **crypto-js 4.2.0**。把 crypto-js 用进真实项目：按需引入与体积、各算法实战、与 OpenSSL 互通、解裸密文、渐进式哈希、TypeScript、常见坑排查。

## 一、按需引入：减小打包体积

整包 `import CryptoJS from "crypto-js"` 会把**所有算法**（全部哈希/密码/模式/编码器）打进产物。crypto-js 每个算法是**独立子模块**，按子路径只引用到的，可显著瘦身：

```ts
import sha256 from "crypto-js/sha256";
import hmacSHA256 from "crypto-js/hmac-sha256";
import AES from "crypto-js/aes";
import encBase64 from "crypto-js/enc-base64";
import encUtf8 from "crypto-js/enc-utf8";
import modeCTR from "crypto-js/mode-ctr";
import padNoPadding from "crypto-js/pad-nopadding";
import PBKDF2 from "crypto-js/pbkdf2";
```

子模块名对应 README 的子路径（`crypto-js/<算法>`）。

> 若需求只是少数算法且追求体积/现代化，也可考虑**零打包体积**的原生 Web Crypto——它内置于浏览器，不进 bundle。

## 二、AES 实战：用外部给的 key/IV

外部（如密钥管理服务、其它语言后端）通常以 **hex 或 Base64** 给 key/IV，要先 `parse` 成 WordArray 再走 key 模式：

```ts
// 32 字节（256 位）hex key → AES-256；16 字节 hex IV
const key = CryptoJS.enc.Hex.parse("000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f");
const iv  = CryptoJS.enc.Hex.parse("101112131415161718191a1b1c1d1e1f");

const ct = CryptoJS.AES.encrypt("Message", key, { iv }).ciphertext.toString(CryptoJS.enc.Base64);
```

要点：

- **key 的字节长度决定 AES 位数**：16→AES-128、24→AES-192、32→AES-256。
- 此为直接密钥模式，**不产生 salt**；解密端需用同一 key+IV。
- 若 key/IV 是 Base64，就用 `CryptoJS.enc.Base64.parse(...)`。

## 三、与 OpenSSL 命令行互通

口令模式默认即 **OpenSSL 兼容格式**（`Salted__` + salt + 密文，Base64），用 EVP_BytesToKey（EvpKDF/MD5）派生 key+IV：

```bash
# 命令行加密
echo -n "Message" | openssl enc -aes-256-cbc -e -base64 -pass pass:"Secret Passphrase" -md md5
```

```ts
// crypto-js 解密上面的输出（口令模式可直接传 OpenSSL 字符串，自动解析 salt）
const pt = CryptoJS.AES.decrypt(opensslBase64, "Secret Passphrase").toString(CryptoJS.enc.Utf8);
```

互通条件：① 两端**口令一致**；② **算法/密钥长度/模式匹配**（如都 AES-256-CBC）；③ 用 Base64 互传。注意现代 openssl 默认 KDF 可能是 PBKDF2，需用 `-md md5`（或对应参数）才能与 crypto-js 的 EvpKDF 对齐。

## 四、解密「裸密文」：构造 CipherParams

`AES.decrypt` 在口令模式下能直接吃 OpenSSL 字符串（自动取 salt）。但如果你手上是**不含 salt 头的裸 Base64 密文**（key 模式产生、或外部系统给的），就要手动构造 CipherParams：

```ts
const cipherParams = CryptoJS.lib.CipherParams.create({
  ciphertext: CryptoJS.enc.Base64.parse(rawBase64),
});
const pt = CryptoJS.AES
  .decrypt(cipherParams, key, { iv })   // 提供对应 key + IV
  .toString(CryptoJS.enc.Utf8);
```

> ⚠️ 别把裸密文直接当口令模式字符串丢进去——那会被当成 OpenSSL 格式去找 salt，必然失败。

## 五、渐进式哈希：处理大数据/分块

一次性 `CryptoJS.SHA256(x)` 适合小数据。分块（如流式读取）用 `algo`：

```ts
const sha = CryptoJS.algo.SHA256.create();
for (const chunk of chunks) sha.update(chunk);
const hash = sha.finalize().toString();
```

复用同一 hasher 算**多条独立消息**时，每条 `finalize()` 后必须 `sha.reset()` 清空累积状态，否则下一条会接到旧状态后面：

```ts
const h = CryptoJS.algo.SHA256.create();
const a = h.finalize("msgA").toString(); h.reset();
const b = h.finalize("msgB").toString();
```

## 六、PBKDF2 安全派生（推荐替代口令模式）

不要依赖口令模式默认的弱 EvpKDF。基于用户口令加密的正确做法：

```ts
function encryptWithPassphrase(plaintext: string, passphrase: string) {
  const salt = CryptoJS.lib.WordArray.random(128 / 8);
  const iv = CryptoJS.lib.WordArray.random(128 / 8);
  const key = CryptoJS.PBKDF2(passphrase, salt, { keySize: 256 / 32, iterations: 250000 });
  const ct = CryptoJS.AES.encrypt(plaintext, key, { iv });
  // salt 与 IV 不需保密，与密文一起存
  return {
    salt: salt.toString(CryptoJS.enc.Hex),
    iv: iv.toString(CryptoJS.enc.Hex),
    ciphertext: ct.ciphertext.toString(CryptoJS.enc.Base64),
  };
}
```

解密时用同样的 salt 重派生 key、同样的 IV 解密。

## 七、TypeScript 用法

crypto-js 主包是 UMD/CJS，类型不在主包内，需另装社区维护的 `@types/crypto-js`：

```bash
npm install -D @types/crypto-js
```

```ts
import CryptoJS from "crypto-js";

const hash: string = CryptoJS.SHA256("msg").toString();
const wa: CryptoJS.lib.WordArray = CryptoJS.enc.Utf8.parse("Hello");
```

> 因库已停更，类型也可能滞后于边缘 API；遇到类型缺失可用 `as` 或补充声明。

## 八、常见坑排查清单

| 现象 | 原因 | 处理 |
|---|---|---|
| 解密结果是一串 Hex/乱码 | 漏了 `toString(CryptoJS.enc.Utf8)` | 解密后显式按 Utf8 解码 |
| 「Malformed UTF-8 data」 | 解密失败（key/IV/mode/padding 不匹配或密文损坏） | 核对加解密参数一一对应 |
| 口令加密的密文 key 模式解不开 | 两种模式混用 | 统一用口令或统一用 key+IV |
| 末尾多出奇怪字节 | 解密端 padding 与加密端不一致（如设了 NoPadding） | 两端 padding 必须一致 |
| 跨端哈希对不上 | 两边「文本→字节」编码不同 | 统一用 UTF-8 |
| NoPadding 下密文异常 | 明文不是块大小整数倍 | 改用 Pkcs7 或自行对齐到 16 字节 |

---

进入 [指南 · 专家](./expert)：KDF 默认值与安全加固、密码存储为何不能用哈希、时序攻击与常量时间比较、Web Crypto 取舍、选型决策。
