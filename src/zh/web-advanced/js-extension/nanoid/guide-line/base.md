---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **nanoid 5**。本篇把「会装会用」推进到「懂设计与权衡」：默认值拆解、自定义 API 全景、与 UUID 的对比、碰撞概率直觉。标注 ⚠️ 处为 3.x → 5.x 差异。

## 一、默认值拆解：为什么是 21 + 64

`nanoid()` 默认生成 **21 字符**、字母表为 **`A-Za-z0-9_-`（64 符）**。这两个数字不是随手定的：

- ID 的随机性（熵）≈ `log2(字母表大小) × 长度`。
- `log2(64) = 6`，所以每个字符携带 **6 位**随机性。
- `6 × 21 = 126 位` —— 与 UUID v4 的 122 位相当。

也就是说，nanoid 用**更大的字母表**，把和 UUID 相近的随机位「打包」进**更少的字符**（21 < 36），换来更短、更紧凑、可直接放进 URL 的 ID。

```ts
import { nanoid } from "nanoid";
nanoid(); //=> "V1StGXR8_Z5jdHi6B-myT"（21 字符，URL 安全）
```

## 二、随机源：crypto 而非 Math.random

nanoid 默认用**加密级随机源**：

- **Node.js**：`node:crypto` 的 `webcrypto.getRandomValues`。
- **浏览器**：Web Crypto API 的 `crypto.getRandomValues`。

它们由**不可预测的硬件随机源**驱动。相比之下，`Math.random()` 是伪随机、可被预测，用它生成 token/ID 存在被猜解的安全风险——这正是默认版刻意避开它的原因。

```ts
// 默认版：加密随机，安全
import { nanoid } from "nanoid";

// 非加密版：Math.random()，更快但不安全
import { nanoid as fastId } from "nanoid/non-secure";
```

## 三、自定义长度

把长度作为参数传入即可，字母表仍是默认 64 符：

```ts
import { nanoid } from "nanoid";
nanoid(10); //=> "IRFa-VaY2b"
nanoid(32); // 更长 → 更强抗碰撞
```

长度直接影响熵：长度翻倍，熵翻倍，碰撞概率指数级下降。

## 四、自定义字母表 customAlphabet

`customAlphabet(alphabet, defaultSize)` 返回一个生成函数，用自己的字符集：

```ts
import { customAlphabet } from "nanoid";

// 纯数字
const numId = customAlphabet("0123456789", 6);
numId(); //=> "451203"

// 去掉易混字符（无 0/O/1/I/l）
const readable = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);
readable(); //=> "K7MNP2QX"

// 单次覆盖默认长度
numId(4); //=> "9021"
```

两条铁律：

1. **字母表 ≤ 256 个符号**（随机字节取值 0-255，超过无法单字节均匀映射）。
2. **字符唯一**：重复字符（如 `'aabc'`）会让该符号概率翻倍、破坏均匀性、降低有效熵。nanoid **不会自动去重**。

> 字母表越小，每字符熵越低：64 符每字符 6 位，16 符每字符仅 4 位。缩小字母表必须**增加长度**来维持同等抗碰撞。

## 五、与 UUID 的对比

| 维度 | nanoid（默认） | UUID v4 |
|---|---|---|
| 代码体积 | **118 字节** | 423 字节 |
| ID 长度 | **21** 字符 | 36 字符（含连字符） |
| 随机位 | ~126 位 | ~122 位 |
| 字母表 | 64（URL 安全） | hex + `-` |
| 双击全选 | 易（可去 `-`） | 连字符分段，难 |
| 时间有序 | 否 | 否 |

nanoid 的优势在**更小的代码体积**和**更短的 ID**，抗碰撞与 UUID v4 相当。若需要**时间有序主键**（数据库索引写入局部性、天然按创建时间排序），纯随机的 nanoid 不合适，应选 **UUID v7 / ULID**。

## 六、碰撞概率直觉

随机 ID 的碰撞遵循「生日问题」：碰撞概率随生成总量上升，而非随时间。官方给出对照：

> 「要让重复概率达到十亿分之一，需生成约 **103 万亿**个 UUID v4。」

nanoid 默认值与之相当。几个直觉：

- **碰撞只和「字母表大小 × 长度（决定熵）」与「生成总量」有关**，与生成时刻、是否同一毫秒**无关**——nanoid 根本不用时间戳。
- 缩短长度 / 缩小字母表 → 熵骤降 → 碰撞概率上升。短 ID（如 6-8 位）务必用 [nano-id-cc](https://zelark.github.io/nano-id-cc/) 评估，并配数据库唯一约束 + 冲突重试兜底。

```ts
// 给业务前缀（人眼区分类型），不影响随机部分唯一性
const userId = "user_" + nanoid(); //=> "user_V1StGXR8_Z5jdHi6B-myT"
```

---

进入 [指南 · 进阶](./advanced)：customRandom 自定义随机源、多端适配（浏览器/RN）、选型决策、短码与前缀实战。
