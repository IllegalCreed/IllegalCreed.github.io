---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **Zod 4**。深入：v3 → v4 完整迁移、Zod Mini 与 tree-shaking、`z.toJSONSchema` 与元数据注册表、品牌类型、全局错误与 i18n、不可变性、库作者最佳实践。

## 一、v3 → v4 完整迁移清单

| 主题 | Zod 3 | Zod 4 |
|---|---|---|
| 错误定制 | `message` / `invalid_type_error` / `required_error` / `errorMap` | 统一为单个 `error`（字符串或 `(issue)=>...`） |
| 字符串格式 | `z.string().email()` `.url()` `.uuid()` | 顶层 `z.email()` `z.url()` `z.uuid()` |
| IP / CIDR | `z.string().ip()` `.cidr()` | `z.ipv4()` `z.ipv6()` `z.cidrv4()` `z.cidrv6()`（旧的已移除） |
| 枚举 | `z.nativeEnum(E)` | `z.enum(E)`（重载支持 TS enum） |
| 错误格式化 | `error.format()` / `error.flatten()` | `z.treeifyError()` / `z.flattenError()` / `z.prettifyError()` |
| 错误明细字段 | `error.errors` | `error.issues`（`errors` 已移除） |
| 全局错误 | `z.setErrorMap(map)` | `z.config({ customError })` |
| 默认值 | `.default()` 解析默认值 | `.default()` 短路（值匹配输出类型）；旧行为用 `.prefault()` |
| 记录 | `z.record(value)`（单参） | `z.record(key, value)`（必须两参） |
| 函数 | `z.function()` 返回 schema | `z.function({input,output})` 返回工厂，用 `.implement()` |
| 对象合并 | `A.merge(B)` | `A.extend(B.shape)`（merge 已弃用） |
| 严格/透传 | `.strict()` / `.passthrough()` | `z.strictObject()` / `z.looseObject()` |
| 非空数组 | `.nonempty()` → `[T,...T[]]` | `.nonempty()` ≈ `.min(1)`，类型仍 `T[]` |
| JSON Schema | 第三方 `zod-to-json-schema` | 内置 `z.toJSONSchema()` |
| 内部定义 | `schema._def` | `schema._zod.def`（库作者） |

> 多数旧 API 在 v4 仍**兼容但弃用**（编辑器有删除线提示），可渐进迁移；少数（`invalid_type_error`、`.ip()`、`z.record` 单参、`error.errors`）已直接移除，需立即改。

## 二、Zod Mini：函数式与 tree-shaking

`zod/mini` 是与 Classic **共享同一内核**（`zod/v4/core`）的极小变体，主打**更优的 tree-shaking 与更小 bundle**。代价是放弃链式人体工学，改用**函数式 API**：

```ts
import * as z from "zod/mini";

// Classic: z.string().min(5).optional()
// Mini:
z.optional(z.string().check(z.minLength(5)));

z.union([z.string(), z.number()]);   // 函数式组合
```

- Classic 把方法挂在类上，未用到的功能当前打包器**难以摇掉**；Mini 每个能力是独立函数，只打进实际 import 的部分。
- Mini 同样支持 `z.infer` 类型推导，校验语义一致。
- 取舍：对 bundle 体积极敏感（边缘函数、嵌入式前端）选 Mini；追求开发体验选 Classic。

## 三、z.toJSONSchema 与元数据

v4 内置 JSON Schema 转换，无需第三方库：

```ts
const User = z.object({
  name: z.string(),
  age: z.number(),
});

z.toJSONSchema(User);
// => { type: "object", properties: {...}, required: ["name","age"], additionalProperties: false }
```

常用选项：`target`（`"draft-2020-12"` 默认 / `"draft-07"` / `"openapi-3.0"`）、`io`（`"input"`/`"output"`）、`unrepresentable`（遇 bigint/Date 等无法表达时 `"throw"` 或 `"any"`）、`override`（自定义转换）。

**元数据**用 `.meta()` 登记进 `z.globalRegistry`，会被 `toJSONSchema` 等消费：

```ts
const Email = z.email().meta({
  id: "email_address",
  title: "Email address",
  description: "请输入有效邮箱",
});

// 自定义注册表
const myReg = z.registry<{ examples: string[] }>();
myReg.add(z.string(), { examples: ["hello", "world"] });
```

> ⚠️ `.meta()` 返回**新 schema 实例**（Zod 不可变），链式时要保留其返回值，否则元数据丢失。`.describe("...")` 是只设 description 的简写。

## 四、品牌类型（nominal typing）

`.brand<"X">()` 在**编译期**给值打标记，模拟名义类型——结构相同但语义不同的值（如 `UserId` 与普通 `string`）不可混用：

```ts
const UserId = z.string().uuid().brand<"UserId">();
type UserId = z.infer<typeof UserId>; // string & z.$brand<"UserId">

function load(id: UserId) { /* ... */ }
load("any-string");          // ❌ 类型错误
load(UserId.parse(input));   // ✅ 必须经校验产出
```

运行时不改变值，纯类型层面增强区分度，防止「把任意 string 误当 ID」。

## 五、全局错误与国际化

```ts
// 全局错误映射（应用级默认消息）
z.config({
  customError: (issue) => {
    if (issue.code === "invalid_type") return `期望 ${issue.expected}`;
  },
});

// 加载内置语言包
import { zhCN } from "zod/locales";
z.config(zhCN());
```

错误优先级（高 → 低）：**schema 级 error → 每次 parse 传入的 error → 全局 customError → locale**。

## 六、不可变性与函数式 issue 报告

Zod schema **不可变**：每个方法返回新实例，原 schema 不变。

```ts
const a = z.string();
const b = a.min(5);   // a 仍无约束，b 才带约束
```

在 `transform`/`superRefine` 里报告失败用结构化 issue，而非 throw：

```ts
.transform((val, ctx) => {
  ctx.issues.push({ code: "custom", message: "...", input: val });
  return z.NEVER;   // 表示此处不产出有效值
})
```

## 七、库作者最佳实践

- **导入内核用 `"zod/v4/core"`**：它是「指向 Zod 4 的永久链接」，跨未来主版本稳定，且同时支撑 Classic 与 Mini；避免直接依赖 `"zod"`（随版本变）、`"zod/v4"`（仅 Classic）、`"zod/v4/mini"`（仅 Mini）。
- **运行时区分版本**：检查 schema 上的 `_zod` 属性——只有 Zod 4 schema 有。
- **黑盒校验考虑 Standard Schema**：若库只需「接受用户传入的 schema 做校验」，面向 **Standard Schema** 接口编程即可同时兼容 Zod / Valibot / ArkType，无需绑定 Zod。

---

回到 [入门](../getting-started) 复习用法，或查 [参考](../reference) 速览 API 与 v3/v4 差异。
