---
layout: doc
outline: [2, 3]
---

# 校验模式对比：装饰器 vs schema 与向后兼容

> 基于 class-validator · Zod · Valibot · 核于 2026-08

## 速查

- **装饰器流派**（class-validator/joi）：在类属性上挂装饰器（`@IsEmail()`/`@MinLength(8)`），配合 NestJS ValidationPipe / Express 中间件自动校验；依赖**类与反射（emitDecoratorMetadata）**，与 NestJS 原生契合。
- **schema 流派**（Zod/Valibot/Yup）：用纯 JS 对象/函数链描述 schema（`z.object({ email: z.string().email() })`），**框架无关**，TypeScript 类型可由 schema 自动推导（`z.infer`），函数式友好。
- **核心差异**：装饰器 = 类 + 反射（命令式、依赖装饰器语法与 tsconfig）；schema = 纯函数 + 类型推导（声明式、纯 JS 无需装饰器配置）。
- **SSOT（单一真相源）**：schema 流派天然 SSOT（schema 既是运行时校验器，类型由它推导）；装饰器流派类型与校验分离（类属性声明类型，装饰器声明校验），需额外保持一致。
- **Tree-shaking 与体积**：Valibot 设计为可 tree-shake（按需引入校验器，体积小），Zod 体积较大但功能全；class-validator 依赖 reflect-metadata 运行时开销。
- **错误信息定制**：两者都支持自定义错误信息（装饰器传 `{ message }`，Zod 用 `.refine`/`.message`）。
- **向后兼容铁律**：接口演进时，**新增字段设为可选**（不破坏老客户端），**删除/改类型字段要分版本**（v2 端点或字段别名过渡），绝不在同版本破坏性变更。
- **进阶顺序**：本文 → [参考](../reference)。

## 一、装饰器流派：class-validator

class-validator 是 NestJS 生态的默认校验库，基于类与装饰器：

```ts
import { IsEmail, MinLength, IsInt, Min, Max } from 'class-validator';

class CreateUserDTO {
  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;

  @IsInt()
  @Min(0)
  @Max(150)
  age?: number;
}
// 配合 NestJS ValidationPipe，controller 收到请求时自动校验，失败返 400
```

- **依赖类与反射**：需要 `emitDecoratorMetadata` + `experimentalDecorators`（tsconfig），运行时靠 `reflect-metadata` 读类型元数据。
- **与 NestJS 原生契合**：ValidationPipe + `@UsePipes` 一行接入，controller 里 `@Body() dto: CreateUserDTO` 自动校验。
- **类型与校验分离**：类属性声明类型（`email: string`），装饰器声明校验（`@IsEmail()`）——两者要手动保持一致，SSOT 性弱。
- **嵌套校验**：`@ValidateNested()` 校验嵌套对象，但要配 `@Type()` 做类型转换。

## 二、schema 流派：Zod 与 Valibot

schema 流派用纯 JS 描述 schema，框架无关：

```ts
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  age: z.number().int().min(0).max(150).optional(),
});
type CreateUserDTO = z.infer<typeof CreateUserSchema>; // 类型由 schema 推导 → SSOT

// 校验：失败抛 ZodError，含详细错误路径
const parsed = CreateUserSchema.parse(requestBody);
```

- **纯函数 + 类型推导**：无需装饰器/tsconfig 配置，`z.infer` 推导 TypeScript 类型，schema 是 SSOT（运行时校验 + 编译期类型同源）。
- **框架无关**：NestJS/Express/Fastify/纯 Node 都能用，校验在 service 层或中间件手动调 `schema.parse()`。
- **Valibot 的差异化**：设计为可 tree-shake（`import { object, string, email } from 'valibot'` 按需引入），体积比 Zod 小很多，适合浏览器/边缘场景；Zod 功能更全、生态更大。
- **错误信息丰富**：ZodError 含每个字段的错误路径与信息，便于构造结构化错误响应。

## 三、核心差异对比

| 维度 | 装饰器（class-validator） | schema（Zod/Valibot） |
| --- | --- | --- |
| 描述方式 | 类属性 + 装饰器 | 纯 JS 对象/函数链 |
| 依赖 | 类、反射、reflect-metadata、tsconfig | 纯函数，无装饰器配置 |
| 类型来源 | 类属性声明（手写） | schema 推导（z.infer，SSOT） |
| 框架耦合 | NestJS 原生友好 | 框架无关 |
| 体积 | 依赖 reflect-metadata | Valibot 可 tree-shake 小；Zod 较大 |
| 函数式友好 | 弱（基于类） | 强（纯函数） |
| 嵌套校验 | `@ValidateNested()` + `@Type()` | `z.object({...})` 递归天然 |

**何时选装饰器**：项目用 NestJS、团队习惯 OOP 与装饰器、要 ValidationPipe 开箱即用。

**何时选 schema**：想要 SSOT（类型与校验同源）、框架无关（多框架/纯 Node）、函数式风格、或浏览器端要小体积（Valibot）。

## 四、向后兼容：接口演进的铁律

接口演进时，DTO 改动可能破坏老客户端。向后兼容的核心铁律：

1. **新增字段设为可选**：`.optional()` / `@IsOptional()`，老客户端不传也能通过校验。
2. **绝不删除/改类型字段**：删除 `name` 或把 `age: number` 改成 `age: string` 是破坏性变更，老客户端会崩。
3. **破坏性变更走版本**：要么新端点（`/v2/users`），要么字段别名过渡（新字段 `displayName` 与老字段 `name` 并存一段时间）。
4. **废弃字段先标记**：用 `@deprecated` 注释或文档标记，给客户端迁移时间，再择期删除。

```ts
// v1 → v2 演进示例
class UserResponseDTO {
  id: string;
  name: string;          // 老字段，保留向后兼容
  displayName?: string;  // 新字段，可选，老客户端不依赖
  age?: number;          // 新字段可选
}
```

- **新增可选字段**：向后兼容（老客户端忽略新字段）。
- **删除/改类型**：破坏性（老客户端依赖的字段没了）。
- **改必填为可选**：向后兼容（约束放宽）。
- **改可选为必填**：破坏性（约束收紧，老客户端没传该字段会失败）。

## 五、SSOT 的价值：运行时与编译期统一

理想状态下，校验规则是 SSOT：改一处 schema，运行时校验与编译期类型同时变，不会「类型说有，校验漏了」。

- **schema 流派天然 SSOT**：`z.infer<typeof Schema>` 推导类型，schema 是唯一真相源。
- **装饰器流派 SSOT 性弱**：类属性声明类型，装饰器声明校验，两者分离——改类型忘改装饰器（或反之）会导致类型与校验不一致。
- **不一致的代价**：TypeScript 类型说 `email: string`，但运行时校验漏了 `@IsEmail()`，恶意输入（非邮箱字符串）通过校验落库，bug 流到生产。

> 趋势：越来越多项目倾向 schema 流派（Zod/Valibot）追求 SSOT，但 NestJS 生态的装饰器流派仍有大量存量。

## 下一步

掌握了校验模式对比后，回头查[参考](../reference) 的 DTO 速查、两种模式对照、序列化注解与易错点。
