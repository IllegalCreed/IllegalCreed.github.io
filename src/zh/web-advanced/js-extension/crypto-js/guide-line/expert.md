---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **crypto-js 4.2.0**。深入安全内核：KDF 默认值与加固、密码存储为何不能用通用哈希、时序攻击与常量时间比较、加密模式的安全取舍、与 Web Crypto 的对比、选型决策、维护现状再辨析。

## 一、两个 KDF 的默认值（必须分清）

crypto-js 有两个密钥派生函数，**默认值天差地别**：

| KDF | 默认 hasher | 默认 iterations | 谁在用 |
|---|---|---|---|
| `PBKDF2` | **SHA256** | **250000** | 你显式调用时（推荐） |
| `EvpKDF` | **MD5** | **1** | **口令模式 `AES.encrypt(msg, 'passphrase')` 内部** |

关键结论：

- **口令模式底层是 EvpKDF（MD5 + 单次迭代）**，对暴力破解几乎没有抵抗力——它存在的意义是 **OpenSSL 兼容**，不是真正的口令防护。
- `PBKDF2` 在 4.x 已被安全加固：早期版本曾默认 **SHA1 + 极低迭代**（被 CVE 诟病），4.x 改为 **SHA256 + 250000 次**。
- 要安全地保护口令，**显式用 PBKDF2 大迭代派生 key**，再以 WordArray key+IV 加密（见进阶篇）。

```ts
// 弱：口令模式默认走 EvpKDF（MD5/1 次）
CryptoJS.AES.encrypt("msg", "passphrase");

// 强：PBKDF2 显式派生
const key = CryptoJS.PBKDF2("passphrase", salt, { keySize: 256 / 32, iterations: 250000 });
CryptoJS.AES.encrypt("msg", key, { iv });
```

## 二、为什么哈希不能直接存密码

把 `SHA256(password)` 当密码存储是经典错误：

- 通用哈希（MD5/SHA*）**为速度而设计**，攻击者每秒可尝试上亿次，配合彩虹表/字典能快速反推弱口令。
- 不加盐时，相同口令哈希相同，一张彩虹表打穿一片用户。
- 输出再长（SHA-512）也**不解决「快」**的问题。

正确做法：用**专为慢而设计的密码哈希**——`bcrypt` / `scrypt` / `Argon2`，或至少 **PBKDF2 + 大迭代 + 每用户随机 salt**。crypto-js 提供 PBKDF2，但密码这类高安全场景更应放在**服务端**并用经审计的实现。

> 一句话：哈希的「不可逆」≠「抗猜测」。快哈希可被穷举，慢哈希才能拖垮暴力破解。

## 三、时序攻击与常量时间比较

校验 HMAC/签名时，用普通 `===` 或字符串比较可能**短路**（发现第一个不同字符就返回），比对耗时随匹配前缀长度变化，理论上可被**时序攻击**逐位试探出正确值。

应使用**常量时间比较**（逐字节全程比对，用时与内容无关）。crypto-js **不内置**该工具，需自行实现或借助其它库：

```ts
// 简化示意：长度不同直接失败，长度相同则逐字节异或累加
function timingSafeEqual(aHex: string, bHex: string): boolean {
  if (aHex.length !== bHex.length) return false;
  let diff = 0;
  for (let i = 0; i < aHex.length; i++) diff |= aHex.charCodeAt(i) ^ bHex.charCodeAt(i);
  return diff === 0;
}
```

> Node 环境直接用内置 `crypto.timingSafeEqual` 更稳妥。

## 四、加密模式的安全取舍

| 模式 | 需 IV | 需填充 | 安全提示 |
|---|---|---|---|
| **CBC**（默认） | 是 | 是（Pkcs7） | IV 必须随机唯一；注意 padding oracle 风险 |
| **CTR / OFB / CFB** | 是（nonce） | 否（流式） | 明文任意长、密文等长；**nonce 绝不可复用** |
| **ECB** | 否 | 是 | ⚠️ 相同明文块→相同密文块，泄露结构，**勿用** |

共同短板：crypto-js 的这些模式**都不提供完整性认证**（不是 AEAD）。这意味着密文可被篡改而无法察觉。需要认证时：

- 自己**加 HMAC**（Encrypt-then-MAC：先加密、再对密文算 HMAC、一起存，校验通过才解密）；
- 或直接改用原生 **AES-GCM**（自带认证标签），这正是新项目优先 Web Crypto 的重要理由。

## 五、crypto-js vs 原生 Web Crypto / Node crypto

| 维度 | crypto-js | Web Crypto / Node crypto |
|---|---|---|
| 实现 | 纯 JS | 原生（C/OpenSSL），常硬件加速 |
| API | 同步、极简 | 异步（Promise）/ Node 同步可选 |
| 性能 | 较慢 | 快 |
| AEAD（GCM） | ❌ 不支持 | ✅ 支持 AES-GCM |
| 安全随机 | 自实现，较弱 | `getRandomValues`/`randomBytes` |
| 兼容性 | 旧浏览器/小程序也能跑 | 需较新环境（Web Crypto 需 HTTPS/安全上下文） |
| 维护 | ❌ 已停更 | ✅ 平台持续维护 |

结论：**新项目的安全场景优先原生**（Node 用内置 `crypto`，浏览器用 Web Crypto）；crypto-js 留给「无原生能力的受限环境、需同步 API、与既有 crypto-js/OpenSSL 数据互通」的场景。

## 六、前端加密的安全边界

「前端用 crypto-js 加密一下，服务器就拿不到明文」是常见误区，错在：

1. **密钥若在前端**（写死或前端派生后发往服务器），任何拿到前端代码/流量的人都能得到密钥，加密形同虚设；
2. **传输安全应交给 HTTPS/TLS**，前端加密替代不了它；
3. crypto-js 已停更、缺 AEAD、随机源弱。

前端对称加密**只在端到端、密钥始终不离开用户/不经服务器**的特定模型下才有意义，且这类高安全需求更应用经过审计的方案与原生加密。

## 七、选型决策清单

**适合继续用 crypto-js：**

- 运行在不支持 Web Crypto 的旧浏览器 / 小程序 / 旧 webview
- 对接历史上用 crypto-js 或 `openssl enc` 口令模式加密的**存量数据**
- 只需非安全用途的可逆混淆 / 校验和 / 内容指纹
- 必须同步 API、不便引入异步流程

**应改用原生 / 专用方案：**

- 存储用户密码 → 服务端 bcrypt/argon2/大迭代 PBKDF2
- 需要 AES-GCM 等认证加密 → 原生 Web Crypto / Node crypto
- 追求极致性能的大批量加密 → 原生
- 任何对安全有硬性要求的新系统 → 优先原生 + 经审计方案

## 八、维护现状再辨析

官方 README 原文：「**Active development of CryptoJS has been discontinued. This library is no longer maintained.**」——**停止主动开发、不再维护**，但要准确理解：

- **不是「删库下架」**：包仍在 npm 上可正常安装（最新 4.2.0），存量项目能继续跑。
- **理由**：如今 Node 与现代浏览器都内置原生 Crypto，继续开发 crypto-js 只会让它沦为原生 Crypto 的包装层；且原生模块自带安全随机数（`Math.random` 不安全）。
- **影响**：不再有安全更新、不会新增 AEAD 等现代特性——这正是**新项目安全场景应转向原生**的根本原因。

---

回到 [入门](../getting-started) 复习用法，或查 [参考](../reference) 速览 API、模式、填充与编码器。
