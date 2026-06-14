---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇带你装上 Zod 并写出第一段校验代码。版本基线 **Zod 4**（当前最新 4.4.x）。核心认知：**声明一次 schema，同时拿到运行时校验与静态类型**——这条贯穿全篇。涉及 v3 旧写法处会标注 ⚠️。

## 速查

- 安装（Node 18+）：`npm install zod`（pnpm `pnpm add zod`、yarn、bun 同理）
- 推荐导入：`import * as z from "zod"`，再用 `z.string()` / `z.object()` 调用
- 定义：`const S = z.object({ name: z.string() })`；推类型：`type S = z.infer<typeof S>`
- 校验：`S.parse(data)`（失败抛 `ZodError`）/ `S.safeParse(data)`（返回结果对象，不抛）
- 取值：`safeParse` 成功用 `result.data`，失败用 `result.error`，判断用 `result.success`
- 异步校验：含 async refine/transform 时必须用 `S.parseAsync` / `S.safeParseAsync`
- ⚠️ v4 字符串格式用顶层函数：`z.email()`（不是 `z.string().email()`）
- ⚠️ v4 错误定制统一用 `error` 键（不是 v3 的 `message`/`invalid_type_error`）

## 一、Zod 是什么

官方定位：「**TypeScript-first schema validation with static type inference**」。三个关键点：

1. **校验**：在运行时检查数据是否符合 schema，不符合就报告结构化错误。
2. **类型推导**：用 `z.infer<typeof Schema>` 从 schema 反推 TS 类型，schema 是类型的唯一来源。
3. **链式 API**：在 schema 上逐级点方法（`.min()`/`.optional()`…），每步返回新的不可变 schema。

> 边界提醒：Zod 是**被调用的校验库**，不是运行时也不是打包器。它在任何标准 JS 环境 import 即用，与你的运行时无关。

## 二、安装

```bash
# Node.js（18 及以上）
npm install zod
pnpm add zod
yarn add zod
bun add zod
```

Zod **自带 TypeScript 类型**、零运行时依赖，同时提供 ESM 与 CommonJS 产物。建议在 `tsconfig.json` 开启 `strict` 模式，以获得正确的类型推导。

## 三、导入方式

官方推荐通配符导入，用 `z` 前缀：

```ts
import * as z from "zod";

const NameSchema = z.string();
```

也可以具名导入：

```ts
import { string, object, infer } from "zod"; // 较少用，通配符更常见
```

> Zod 4 还提供两个特殊入口：`zod/mini`（函数式、可摇树的极小变体）与 `zod/v4/core`（供库作者使用的稳定内核）。日常应用用 `"zod"` 即可，细节见[专家篇](./guide-line/expert)。

## 四、第一段代码

```ts
import * as z from "zod";

// 1. 定义 schema
const LoginSchema = z.object({
  email: z.email("邮箱格式不正确"),          // v4：顶层 z.email()
  password: z.string().min(8, "密码至少 8 位"),
});

// 2. 由 schema 推导类型
type LoginData = z.infer<typeof LoginSchema>;
// { email: string; password: string }

// 3. 校验数据
const data = LoginSchema.parse({
  email: "jane@example.com",
  password: "secret123",
});
```

注意三件事：①每个基础类型是**小写工厂函数**（`z.string()`，不是 `new String()`）；②校验直接链在 schema 上（`.min(8)`）；③v4 中邮箱等格式用**顶层函数** `z.email()`，而非 `z.string().email()`（后者已弃用）。

## 五、parse vs safeParse

```ts
// 方式 A：parse —— 失败抛 ZodError，需 try/catch
try {
  const user = LoginSchema.parse(data);
} catch (err) {
  if (err instanceof z.ZodError) {
    console.log(err.issues); // 所有问题（code / path / message）
  }
}

// 方式 B：safeParse —— 返回判别联合，不抛异常
const result = LoginSchema.safeParse(data);
if (result.success) {
  console.log(result.data);  // 校验后的值（带推导类型）
} else {
  console.log(result.error); // ZodError
}
```

> 字段记牢：成功值在 **`data`**，错误在 **`error`**，判断用 **`success`**。`safeParse` 用「返回值分支」代替异常控制流，更适合不想 try/catch 的场景。

## 六、含异步校验时

如果 schema 里用到 **async** 的 `refine` 或 `transform`（如查库验证唯一性），同步 `parse` 会抛错要求改用异步方法：

```ts
const UsernameSchema = z.string().refine(
  async (name) => await isAvailable(name),
  { error: "用户名已被占用" }
);

const r = await UsernameSchema.safeParseAsync("alice"); // 必须 async
```

## 七、v3 → v4 关键差异一览

| 主题 | Zod 3 | Zod 4 |
|---|---|---|
| 邮箱格式 | `z.string().email()` | `z.email()`（顶层函数） |
| 错误消息 | `{ message: "..." }` | `{ error: "..." }`（统一） |
| 必填/类型错 | `invalid_type_error` / `required_error` | 统一进 `error`（函数形式按 `issue.input` 区分） |
| 错误格式化 | `error.format()` / `error.flatten()` | `z.treeifyError()` / `z.flattenError()` / `z.prettifyError()` |
| 记录类型 | `z.record(valueSchema)`（单参） | `z.record(keySchema, valueSchema)`（必须两参） |
| JSON Schema | 需第三方 `zod-to-json-schema` | 内置 `z.toJSONSchema()` |

第一步迁移：把链式 `.email()`/`.url()`/`.uuid()` 改成顶层 `z.email()` 等，把 `{ message }` 改成 `{ error }`，把 `error.format()` 改成 `z.treeifyError(error)`。完整迁移见[专家篇](./guide-line/expert)。

---

掌握基本用法后，进入 [指南 · 基础](./guide-line/base)：schema 全景、对象额外键策略、可选/可空/默认值、校验 vs 转换、类型推导。
