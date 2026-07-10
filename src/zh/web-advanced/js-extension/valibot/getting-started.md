---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇带你装上 Valibot 并写出第一段校验代码。版本基线 **Valibot 1.4.2**。对比对象：Zod 3/4。核心认知：**Valibot 用「schema + action + pipe」的函数式管道，替代 Zod 的方法链**——这条贯穿全篇。

## 速查

- 安装：`npm install valibot`（pnpm `pnpm add valibot`、yarn `yarn add valibot`、bun `bun add valibot`）
- JSR（Node/Deno/Bun）：`npx jsr add @valibot/valibot`，导入用 `@valibot/valibot`
- 推荐导入：`import * as v from 'valibot'`，再用 `v.string()` / `v.pipe()` 调用
- 链式 → 管道：Zod `z.string().email()` ⇒ Valibot `v.pipe(v.string(), v.email())`
- 解析：`v.parse(Schema, data)`（失败抛 `ValiError`）/ `v.safeParse(Schema, data)`（返回结果对象）
- 取值：`safeParse` 成功用 `result.output`，失败用 `result.issues`，判断用 `result.success`
- 类型：`v.InferOutput<typeof Schema>`（≈ Zod 的 `z.infer`）/ `v.InferInput<...>`
- 核心数字：体积起步 **< 700 字节**，官方对比比标准 Zod 小约 **90%**、零依赖
- ⚠️ schema 上**没有**链式方法，校验/转换都要写进 `v.pipe(...)`

## 一、Valibot 是什么

官方定位：「**The modular and type-safe schema library for validating structural data**」——模块化、类型安全的结构化数据校验库。三个关键点：

1. **更小**：模块化函数式 + `sideEffects:false`，bundle 起步 < 700 字节，官方对比比标准 Zod 小约 90%。
2. **类型安全**：schema 即类型来源，`InferInput`/`InferOutput` 双向推导，运行时校验与静态类型天然同步。
3. **函数式**：能力拆成独立小函数，用 `pipe()` 组合，而非在对象上方法链。

> 边界提醒：Valibot 是**被调用的校验库**，不是运行时（不像 Bun/Deno），也不是打包器。它在任何标准 JS 环境里 import 即用，与你的运行时无关。

## 二、安装

```bash
# Node.js / 前端工程
npm install valibot
pnpm add valibot
yarn add valibot
bun add valibot
```

```bash
# JSR：Node / Deno / Bun，包名带 scope
npx jsr add @valibot/valibot
```

Valibot **自带 TypeScript 类型**，零运行时依赖，同时提供 ESM 与 CommonJS 双产物。分发代码以 **ES2020** 为目标，要求 **TypeScript ≥ 5.0.2**，并建议在 `tsconfig.json` 开启 `strict` 模式以获得正确的类型推导。

## 三、导入方式

本文统一使用**通配符导入**与 `v` 前缀：

```ts
import * as v from "valibot";

const NameSchema = v.string();
```

也可以具名导入：

```ts
import { string, pipe, email } from "valibot";
```

> 关键认知：官方明确说明——**通配符导入与具名导入对 tree-shaking 没有区别**，两种都能正确摇树。通配符写法可读性好、不易命名冲突，也方便从 Zod 迁移（把 `z.` 换成 `v.`）。本系列统一用 `v.` 前缀。

## 四、第一段代码

```ts
import * as v from "valibot";

// 1. 定义 schema（每个类型都是函数）
const LoginSchema = v.object({
  email: v.pipe(
    v.string("邮箱必须是字符串"),
    v.nonEmpty("请输入邮箱"),
    v.email("邮箱格式不正确"),
  ),
  password: v.pipe(
    v.string("密码必须是字符串"),
    v.minLength(8, "密码至少 8 位"),
  ),
});

// 2. 由 schema 推导类型
type LoginData = v.InferOutput<typeof LoginSchema>;
// { email: string; password: string }

// 3. 校验数据
const data = v.parse(LoginSchema, {
  email: "jane@example.com",
  password: "secret123",
});
```

注意三件事：①每个基础类型是**小写函数**（`v.string()`，不是 `new String()`）；②校验/转换写进 `v.pipe(...)`，schema 上没有 `.email()` 这类方法；③错误消息作为 schema/action 的**最后一个参数**传入。

## 五、parse vs safeParse

```ts
// 方式 A：parse —— 失败抛 ValiError，需 try/catch
try {
  const user = v.parse(LoginSchema, data);
} catch (error) {
  if (v.isValiError(error)) {
    console.log(error.issues); // 所有问题
  }
}

// 方式 B：safeParse —— 返回结果对象，不抛异常
const result = v.safeParse(LoginSchema, data);
if (result.success) {
  console.log(result.output); // 校验后的值
} else {
  console.log(result.issues); // 问题数组
}
```

> 字段记牢：成功值在 **`output`**（不是 `data`/`value`），问题在 **`issues`**，判断用 **`success`**。

## 六、从 Zod 迁移（核心对照）

| Zod                                       | Valibot                                         |
| ----------------------------------------- | ----------------------------------------------- |
| `z.string().email().min(5)`               | `v.pipe(v.string(), v.email(), v.minLength(5))` |
| `Schema.parse(x)` / `Schema.safeParse(x)` | `v.parse(Schema, x)` / `v.safeParse(Schema, x)` |
| `z.infer<typeof S>`                       | `v.InferOutput<typeof S>`                       |
| `.optional()`                             | `v.optional(...)` 包裹                          |
| `z.enum([...])`                           | `v.picklist([...])`                             |
| `z.object({...}).strict()`                | `v.strictObject({...})`                         |

第一步只需把 `import { z } from 'zod'` 改成 `import * as v from 'valibot'`，再把 `z.` 换成 `v.`，并把方法链改写成 `v.pipe(...)`。官方还提供 codemod：`npx @valibot/zod-to-valibot` 自动转写大部分写法。完整迁移见[专家篇](./guide-line/expert)。

---

掌握基本用法后，进入 [指南 · 基础](./guide-line/base)：schema 全景、pipe 与 action、校验 vs 转换、可选/可空、类型推导。
