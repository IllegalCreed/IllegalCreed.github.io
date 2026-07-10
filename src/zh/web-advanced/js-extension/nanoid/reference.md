---
layout: doc
outline: [2, 3]
---

# 参考

> nanoid **5.1.16** 的导出入口、API、CLI、字母表与碰撞概率速查。标注 ⚠️ 处为 3.x → 5.x 变化点。导入统一假定 `import { ... } from "nanoid"`。

## 速查

- 运行基线：5.1.16 的 `engines.node` 为 `^18 || >=20`，主包是 ESM 且自带 TypeScript 类型
- 默认 ID：`nanoid()` 生成 21 个 URL 安全字符，64 字符字母表约提供 126 位随机性，但**不保证绝对唯一**
- 核心 API：`nanoid(size?)`、`customAlphabet()`、`customRandom()`、`random()` 与 `urlAlphabet`
- 随机源：Node 用 `node:crypto` Web Crypto，浏览器用 `crypto.getRandomValues`；`nanoid/non-secure` 才使用 `Math.random()`
- 自定义字母表最多 256 个符号且应无重复；缩短长度或缩小字母表都会降低熵，需重新评估碰撞概率
- CommonJS：Node 22.12+ 可直接 `require()`；Node 20 需官方所述实验标志；Node 18 用动态 `import()` 或 nanoid 3
- React：不要在 render 中用 `nanoid()` 生成列表 key；优先数据稳定 ID，关联 label / input 使用 `useId`
- 存储：保持大小写敏感、建立唯一约束并在冲突时重试；需要时间有序主键时改选 UUID v7 / ULID

## 一、导出入口（exports）

| 入口 | 导出 | 说明 |
|---|---|---|
| `nanoid` | `nanoid`、`customAlphabet`、`customRandom`、`urlAlphabet`、`random` | 主入口，加密随机源 |
| `nanoid/non-secure` | `nanoid`、`customAlphabet` | 非加密版（`Math.random()`），更快 |
| `nanoid/package.json` | — | 包元数据 |

> ⚠️ 3.x 曾有 `nanoid/async`、`nanoid/url-alphabet` 子入口，**5.x 已移除**。`urlAlphabet` 现从主入口具名导出（`import { urlAlphabet } from 'nanoid'`）。

## 二、核心 API

| API | 签名 | 作用 |
|---|---|---|
| `nanoid(size?)` | `(size = 21) => string` | 生成 ID，默认 21 字符、64 字母表 |
| `customAlphabet(alphabet, size?)` | `(alphabet, defaultSize = 21) => (size?) => string` | 返回「自定义字母表」生成函数 |
| `customRandom(alphabet, size, getRandom)` | `(alphabet, defaultSize, getRandom) => (size?) => string` | 返回「自定义随机源」生成函数 |
| `urlAlphabet` | `string` | 默认 URL 安全字母表（64 符）字符串 |
| `random(bytes)` | `(bytes) => Uint8Array` | 从内部缓冲池取随机字节（底层用） |

```ts
import { nanoid, customAlphabet, customRandom, urlAlphabet } from "nanoid";

nanoid();                                   // 21 字符
nanoid(12);                                 // 12 字符
const a = customAlphabet("ABCDEF123456", 8); // 自定义字母表 + 长度
const b = customRandom(urlAlphabet, 10, (size) =>
  new Uint8Array(size).map(() => 256 * Math.random())
); // 自定义随机源（此处仅示意）
```

## 三、默认字母表与限制

| 项 | 值 |
|---|---|
| 默认长度 | **21** 字符 |
| 默认字母表 | `A-Za-z0-9_-`，共 **64** 个 URL 安全字符 |
| `customAlphabet` 字母表上限 | **256** 个符号（随机字节 0-255） |
| 大小写 | **敏感**（`A` 与 `a` 不同），存库/比较需大小写敏感 collation |
| 时间有序 | **否**（纯随机，不含时间戳） |

## 四、随机源

| 环境 | 随机源 |
|---|---|
| Node.js | `node:crypto` 的 `webcrypto.getRandomValues`（带缓冲池，POOL ×128） |
| 浏览器 | Web Crypto API `crypto.getRandomValues`（conditional exports 的 `browser` 条件） |
| React Native | 同浏览器版，需先装并 import `react-native-get-random-values` polyfill |
| `nanoid/non-secure` | `Math.random()`（不安全，更快） |

## 五、CLI（npx nanoid）

| 命令 | 作用 |
|---|---|
| `npx nanoid` | 生成一个默认 ID |
| `npx nanoid --size 10` | 指定长度 |
| `npx nanoid --alphabet abc --size 15` | 指定字母表与长度 |

## 六、与 UUID 对比

| 维度 | nanoid（默认） | UUID v4 | UUID v7 / ULID |
|---|---|---|---|
| 代码体积 | **118 字节**（min+brotli） | 423 字节 | 视实现 |
| 字符长度 | **21** | 36（含连字符） | 36 / 26 |
| 随机位 | ~126 位 | ~122 位 | 含时间戳 |
| 字母表 | 64（URL 安全） | 16（hex）+ `-` | 视实现 |
| 时间有序 | 否 | 否 | **是** |
| 适用 | 短链、资源 ID、不可枚举标识 | 通用唯一 ID | 时间有序主键 |

> 「十亿分之一的重复概率，需生成约 **103 万亿**个 UUID v4」——nanoid 默认值碰撞概率与之相当。

## 七、版本与模块系统

| 项 | nanoid 5.x | nanoid 3.x |
|---|---|---|
| 最新版本 | **5.1.16** | 3.3.x（官方仍支持） |
| 模块系统 | **ESM-only 产物**；新 Node 可同步加载 ESM | ESM + CJS 双产物（可 `require`） |
| `engines.node` | `^18 \|\| >=20` | 更宽（含 ^10/^12…） |
| 子入口 | `.`、`./non-secure` | 还有 `./async`、`./url-alphabet` |
| 适用 | ESM 项目；或支持加载 ESM 的新 Node CJS | 旧 Node / 传统 CommonJS 工具链 |

## 八、生态工具

| 工具 | 作用 |
|---|---|
| [nano-id-cc](https://zelark.github.io/nano-id-cc/) | 在线碰撞概率计算器（输入字母表/长度/速率） |
| [nanoid-dictionary](https://github.com/CyberAP/nanoid-dictionary) | 常用字母表预设（numbers / lowercase / nolookalikes 等） |
| [nanoid-good](https://github.com/y-gagar1n/nanoid-good) | 确保 ID 不含不雅词汇 |
| `react-native-get-random-values` | RN 环境的 Web Crypto polyfill |

---

命令查完，进 [指南 · 基础](./guide-line/base) 理解设计，或 [指南 · 进阶](./guide-line/advanced) 看 customAlphabet / customRandom / 选型实战。
