---
layout: doc
outline: [2, 3]
---

# 参考：DTO 速查、校验对照与易错点

> 基于 class-validator · Zod · Valibot · 核于 2026-08

## 速查

- **DTO 定义**：数据传输对象，接口形状的显式契约，隔离 ORM 实体与 API，控暴露 + 承载校验。
- **两层契约**：形状契约（字段/类型/必填）+ 校验契约（值约束：格式/长度/范围）。
- **请求/响应分离**：请求 DTO 重校验，响应 DTO 重暴露控制，职责不同不可混用。
- **暴露策略**：白名单优先（DTO 只列要暴露的），黑名单易漏不推荐，分组适合多视图。
- **校验流派**：装饰器（class-validator，类+反射，NestJS 原生）/ schema（Zod/Valibot，纯函数+类型推导，框架无关）。
- **SSOT**：schema 流派天然单一真相源（z.infer 推导类型）；装饰器流派类型与校验分离，需手动保持一致。
- **向后兼容**：新增字段设可选（兼容），删除/改类型走版本（破坏性），改必填为可选兼容、改可选为必填破坏。

## 一、DTO 命名与结构速查

| DTO 类型 | 用途 | 示例字段 |
| --- | --- | --- |
| `CreateXxxRequestDTO` | 创建请求，重校验 | email/password/name（不含 id） |
| `UpdateXxxRequestDTO` | 更新请求，字段多可选 | name?/email?（部分更新） |
| `XxxResponseDTO` | 响应，重暴露 | id/name/email/createdAt（不含敏感） |
| `XxxListItemDTO` | 列表项，精简 | id/name（列表只需摘要） |
| `PaginatedResponseDTO<T>` | 分页 | items/total/page/pageSize |

## 二、两种校验模式代码对照

```ts
// ===== 装饰器流派（class-validator）=====
import { IsEmail, MinLength, IsOptional, IsInt, Min, Max } from 'class-validator';

class CreateUserDTO {
  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(150)
  age?: number;
}
// 类型来源：类属性声明（手写）→ SSOT 性弱

// ===== schema 流派（Zod）=====
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  age: z.number().int().min(0).max(150).optional(),
});
type CreateUserDTO = z.infer<typeof CreateUserSchema>;
// 类型来源：schema 推导 → SSOT

// ===== schema 流派（Valibot，可 tree-shake）=====
import { object, string, email, minLength, optional, number, integer, min, max } from 'valibot';

const CreateUserSchema = object({
  email: string([email()]),
  password: string([minLength(8)]),
  age: optional(number([integer(), min(0), max(150)])),
});
```

## 三、序列化注解清单（class-transformer）

| 注解 | 作用 |
| --- | --- |
| `@Exclude()` | 序列化时排除该字段（黑名单） |
| `@Expose()` | 显式暴露该字段（白名单/分组） |
| `@Expose({ groups: ['public'] })` | 按分组暴露 |
| `@Type(() => SubDTO)` | 嵌套对象类型转换 |
| `@Transform(({ value }) => ...)` | 自定义转换逻辑 |
| `classToPlain(dto, { groups: ['public'] })` | 按组序列化 |

> 优先白名单（响应 DTO 只列要暴露的字段），少用 `@Exclude` 黑名单。

## 四、向后兼容变更矩阵

| 变更类型 | 兼容性 | 处理 |
| --- | --- | --- |
| 新增可选字段 | ✅ 向后兼容 | `.optional()` / `@IsOptional()` |
| 删除字段 | ❌ 破坏性 | 走版本（v2 端点）或字段别名过渡 |
| 改字段类型 | ❌ 破坏性 | 走版本 |
| 必填改可选 | ✅ 兼容（约束放宽） | 直接改 |
| 可选改必填 | ❌ 破坏性（约束收紧） | 走版本或先确保所有客户端已传 |
| 重命名字段 | ❌ 破坏性 | 新老字段并存过渡期，再删老字段 |

## 五、易错点清单

- **「直接返回 ORM 实体没问题」**：错。实体含 passwordHash/internalFlag 等敏感字段，直接序列化会泄露；必须经响应 DTO 白名单。
- **「请求和响应用同一个 DTO」**：错。请求重校验、响应重暴露，职责不同；混用会导致要么暴露过多、要么校验缺失。
- **「黑名单（@Exclude）和白名单一样安全」**：错。黑名单易漏（新字段忘 @Exclude 就泄露），白名单默认不暴露更安全。
- **「class-validator 的类型就是 TypeScript 类型」**：部分错。类属性声明类型，装饰器声明校验，两者分离；改类型忘改装饰器会不一致。
- **「Zod 和 Valibot 完全等价」**：部分对。都是 schema 流派，但 Valibot 设计为可 tree-shake（体积小），Zod 功能更全生态更大。
- **「新增字段设为必填是兼容的」**：错。新增必填字段是破坏性变更（老客户端没传该字段会校验失败），应设可选。
- **「改字段类型在同版本做就行」**：错。改类型（如 number→string）是破坏性变更，老客户端会崩，要走 v2 端点。
- **「校验只在 controller 做」**：部分错。controller 入口校验是第一道防线，但关键业务校验应在 service 层再确认（防御性编程），不能只靠 controller。

## 六、进阶方向（链接其他叶）

- [API 客户端](../../api-testing/api-clients/) —— DTO 即接口契约，API 客户端据此构造请求
- [REST API](../../api-design-protocols/rest-api/) —— DTO 是 REST 接口形状的载体（若有此叶）

## 权威链接

- [class-validator 文档](https://github.com/typestack/class-validator)
- [Zod 文档](https://zod.dev)
- [Valibot 文档](https://valibot.dev)
- [NestJS DTO 与校验](https://docs.nestjs.com/techniques/validation)
- [class-transformer 文档](https://github.com/typestack/class-transformer)
- [Martin Fowler - DTO 模式](https://martinfowler.com/eaaCatalog/dto.html)
- 本站幻灯片：<a href="/SlideStack/dto-and-contracts-slide/" target="_blank">DTO 与数据契约</a>
