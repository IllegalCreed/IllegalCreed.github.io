---
layout: doc
outline: [2, 3]
---

# 入门：DTO 定义、数据契约与校验流派速览

> 基于 NestJS · class-validator · Zod · Valibot · 核于 2026-08

## 速查

- **DTO 定义**：数据传输对象，是一份**显式的数据契约**，声明接口接受/返回的字段、类型、约束，在 ORM 实体与 API 调用者之间架起隔离边界。
- **为什么不能直接吐实体**：①字段过度暴露（密码哈希/内部状态泄露）②强耦合（DB 加字段所有客户端受影响）③无校验（请求体任意塞不校验就落库）。DTO 把「接口形状」从隐式约定提升为显式 + 可校验 + 可序列化控制的契约。
- **两层契约**：①**形状契约**（哪些字段、什么类型、必填/可选）②**校验契约**（字段值约束，如 email 格式、年龄范围、字符串长度）。
- **装饰器流派**：class-validator/joi，在类属性上挂装饰器（`@IsEmail()`/`@MinLength(8)`），配合 NestJS 管线/Express 中间件自动校验，依赖类与反射（metadata）。
- **schema 流派**：Zod/Valibot/Yup，用纯 JS 对象/函数链描述 schema（`z.object({ email: z.string().email() })`），框架无关、TypeScript 类型可由 schema 自动推导。
- **两者本质相同**：描述期望形状 → 校验输入 → 拒绝不合法。工程取舍不同：装饰器依赖类与反射，schema 依赖纯函数与类型推导。
- **TypeScript 一致性**：理想状态下，DTO/schema 既是运行时校验器也是编译期类型，运行时与编译期一致（Single Source of Truth）。
- **进阶顺序**：[DTO 模式](./guide-line/patterns) → [校验模式对比](./guide-line/validation-comparison) → [参考](./reference)。

## 一、DTO 是什么

DTO（Data Transfer Object）是服务层定义请求/响应形状的对象模式。它解决一个朴素问题：**接口应该接受什么、返回什么，要显式写下来**。最反面的做法是接口直接吐 ORM 实体：

```ts
// ❌ 反面：直接返回 ORM 实体
async function getUser(id: string) {
  return await userRepo.findById(id); // 实体含 passwordHash、internalFlag、deletedAt...
}
// 客户端拿到 { id, name, email, passwordHash, internalFlag, deletedAt } —— 密码哈希泄露！
```

直接吐实体的三大灾难：①**字段过度暴露**（passwordHash、内部状态、软删除标记全泄露）②**强耦合**（DB 加个字段，序列化结果多了它，客户端可能因未知字段崩）③**无校验**（POST 接口不校验请求体，恶意字段直接落库）。DTO 在实体与接口之间加一层隔离：

```ts
// ✅ 正面：用 DTO 显式声明响应形状
class UserResponseDTO {
  id: string;
  name: string;
  email: string;
  // 不含 passwordHash / internalFlag / deletedAt —— 暴露受控
}
```

一句话：**DTO = 接口形状的显式契约 + 字段暴露控制 + 输入校验载体。**

## 二、两层契约：形状与校验

数据契约分两层，DTO 要同时承载：

1. **形状契约（Shape）**：哪些字段、什么类型、必填还是可选。如「创建用户」请求必须有 `name: string`、`email: string`，可选 `age?: number`。
2. **校验契约（Validation）**：字段值的约束。如 `email` 必须是合法邮箱格式、`age` 必须在 0-150、`password` 至少 8 位含字母数字。

两层缺一不可：只有形状不校验，恶意输入（如 `age: -999`、`email: "不是邮箱"`）会落库；只有校验没形状，类型不安全（TypeScript 拦不住运行时任意字段）。

## 三、校验两大流派速览

实现校验有两套主流工程方案，哲学不同：

| 流派 | 代表 | 描述方式 | 依赖 |
| --- | --- | --- | --- |
| **装饰器流派** | class-validator、joi、class-sanitizer | 类属性上挂装饰器 | 类 + 反射（metadata） |
| **schema 流派** | Zod、Valibot、Yup | 纯 JS 对象/函数链 | 纯函数 + 类型推导 |

```ts
// 装饰器流派（class-validator）
class CreateUserDTO {
  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;
}

// schema 流派（Zod）
const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
type CreateUserDTO = z.infer<typeof CreateUserSchema>; // 类型由 schema 推导
```

- **本质相同**：两者都是「描述期望 → 校验输入 → 拒绝不合法」。
- **取舍不同**：装饰器依赖类与反射（NestJS 原生友好），schema 依赖纯函数与类型推导（框架无关、函数式友好）。详见[校验模式对比](./guide-line/validation-comparison)。

## 四、TypeScript 一致性：运行时与编译期统一

理想状态下，DTO/schema 既是运行时校验器也是编译期类型——Single Source of Truth（SSOT）：

- 改 schema，类型自动跟着变，编译期与运行时不冲突。
- schema 流派的 Zod/Valibot 天然支持（`z.infer` 推导类型）。
- 装饰器流派的 class-validator 要配 `@nestjs/mapped-types` 或手写 interface，SSOT 性稍弱。

不一致的代价：类型说有 `email`，运行时校验却漏了，bug 流到生产。

## 下一步

理解了 DTO 与契约两层后，下一步深入设计模式——[DTO 模式](./guide-line/patterns)（请求/响应形状、序列化策略、实体 ↔ DTO 转换）。
