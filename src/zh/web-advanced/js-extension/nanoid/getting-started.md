---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇带你装上 nanoid 并生成第一个 ID。版本基线 **nanoid 5.1.16**（ESM-only 产物）。核心认知：**默认 21 字符 + 64 个 URL 安全字符 + 加密随机源**——这条贯穿全篇。涉及 3.x 旧行为处会标注 ⚠️。

## 速查

- 安装（Node 18+）：`npm install nanoid`（pnpm `pnpm add nanoid`、yarn、bun 同理）
- 基础用法：`import { nanoid } from 'nanoid'`，`nanoid()` → 21 字符（如 `V1StGXR8_Z5jdHi6B-myT`）
- 自定义长度：`nanoid(10)` → 10 字符
- 自定义字母表：`const id = customAlphabet('0123456789abcdef', 10)`，再 `id()`
- 非加密快版：`import { nanoid } from 'nanoid/non-secure'`（用 `Math.random()`，仅非敏感场景）
- 命令行：`npx nanoid`（`--size 10` / `--alphabet abc --size 15`）
- 核心认知：**默认用 `crypto` / Web Crypto 加密随机源**，不是 `Math.random()`
- ⚠️ 5.x 只发布 ESM：Node 22.12+ 的 CJS 可直接 `require()`，Node 20 需实验标志，Node 18 用动态 `import()` 或 nanoid 3
- ⚠️ 5.x 已移除 `nanoid/async` 与 `nanoid/url-alphabet` 子入口（`urlAlphabet` 从主入口导出）

## 一、nanoid 是什么

官方定位：「**A tiny, secure, URL-friendly, unique string ID generator for JavaScript**」。三个关键点：

1. **小**：核心代码 118 字节（min+brotli）、零依赖，约为 uuid v4（423 字节）的四分之一。
2. **安全**：默认用 Node 的 `crypto` / 浏览器 Web Crypto 的硬件随机源，避免 `Math.random()` 可预测。
3. **URL 友好**：默认字母表 `A-Za-z0-9_-`（64 符），可直接放进 URL、文件名、DOM id。

> 边界提醒：nanoid 是一个**随机 ID 生成函数库**，不是分布式唯一性服务。能否加载以及随机源来自哪里都与 Node 版本、模块系统和目标运行时有关；业务仍要用唯一约束处理极低概率碰撞。

## 二、安装

```bash
# Node.js（18 及以上）
npm install nanoid
pnpm add nanoid
yarn add nanoid
bun add nanoid
```

nanoid **自带 TypeScript 类型**、零运行时依赖。

> ⚠️ **模块系统**：nanoid 5 只发布 ESM 产物。Node 22.12+ 已可从 CommonJS 直接 `require()`；Node 20 按官方说明需 `--experimental-require-module`；Node 18 可动态 `import()`，或改装仍受支持且提供 CJS 产物的 **3.x**。详见[专家篇](./guide-line/expert)。

## 三、第一个 ID

```ts
import { nanoid } from "nanoid";

const id = nanoid();
//=> "V1StGXR8_Z5jdHi6B-myT"（默认 21 字符）
```

注意三件事：①`nanoid` 是**具名导出**（用花括号），不是默认导出；②直接调用函数本身 `nanoid()`，没有 `.generate()` 之类的方法；③默认长度 **21**、默认字母表 **`A-Za-z0-9_-`**（64 符）。

## 四、自定义长度

把想要的长度作为参数传进去，字母表仍是默认的 64 个 URL 安全字符：

```ts
import { nanoid } from "nanoid";

nanoid(10); //=> "IRFa-VaY2b"
nanoid(5); //=> "_a-b3"
```

> 不要用 `nanoid().slice(0, 10)` 这种「生成长的再截断」的写法——既浪费随机字节，也不是 API 设计的用法。直接传 `nanoid(10)`。

## 五、自定义字母表 customAlphabet

只想要特定字符（如纯十六进制、纯数字、去掉易混字符）时，用 `customAlphabet(alphabet, defaultSize)`，它返回一个新的生成函数：

```ts
import { customAlphabet } from "nanoid";

// 字母表为十六进制小写、默认长度 10
const hexId = customAlphabet("1234567890abcdef", 10);
hexId(); //=> "4f90d13a42"

// 单次调用也能临时改长度（覆盖默认 10）
hexId(5); //=> "f01a2"
```

约束：**字母表最多 256 个符号**（因随机字节取值是 0-255），且应保证**字符唯一**（重复字符会让某符号概率偏高、破坏均匀）。

> 把生成函数提到**模块级常量**复用（而非在循环里反复调用 `customAlphabet`），可省去重复构造闭包的开销。

## 六、加密 vs 非加密：non-secure

默认版安全但要走加密随机源。若你**不在意安全性**、或处于**没有硬件随机源的环境**、且追求更快，可用 `nanoid/non-secure`（底层用 `Math.random()`）：

```ts
import { nanoid, customAlphabet } from "nanoid/non-secure";

nanoid(); //=> "Uakgb_J5m9g-0JDMbcJqLJ"（更快，但不安全）
const code = customAlphabet("0123456789", 6); // non-secure 也有 customAlphabet
```

> ⚠️ **安全红线**：会话 token、密码重置链接、API 密钥等敏感值 **必须用默认（加密）版**，绝不能用 non-secure。non-secure 只适合不承担身份、授权或不可预测性要求的临时标识；React 列表 key 仍应使用跨渲染稳定的数据 ID，而不是在 render 中随机生成。

## 七、命令行临时生成

nanoid 自带 bin，无需写代码即可在命令行生成：

```bash
npx nanoid                          # => LZfXLFzPPR4NNrgjlWDxn
npx nanoid --size 10                # => L3til0JS4z
npx nanoid --alphabet abc --size 15 # => bccbcabaabaccab
```

---

掌握基本用法后，进入 [指南 · 基础](./guide-line/base)：默认设计拆解、自定义 API 全景、与 UUID 的对比、碰撞概率直觉。
