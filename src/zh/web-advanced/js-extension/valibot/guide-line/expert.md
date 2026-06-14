---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **Valibot 1.x**（当前最新 1.4.1）。本篇讲原理与边界：体积/tree-shaking 真相、safeParse 的三态 `typed`、parser 预编译、brand 名义类型、命名约定、性能定位、从 Zod 迁移的取舍。

## 一、体积优势的真相：tree-shaking

Valibot 比 Zod 小，根因是**架构对打包器友好**，而非压缩魔法：

- **独立函数**：每个能力是单独 export 的函数，你没 `import` 的就被 tree-shake 删掉。
- **`sideEffects: false`**：v1.4.1 的 `package.json` 显式声明，告诉打包器可安全摇树。
- **对比 Zod**：Zod 把功能做成对象/类上的方法。官方原话——这些带额外功能的方法，当前打包器在它们**未被调用时很难删除**，于是即便你没用 `.email()`，它也可能被打进产物。

官方对比页给出的数字（仅一个 string+email 例子量级）：Valibot ≈ **1.37 kB**，标准 Zod ≈ 17.7 kB（约小 **90%**），Zod Mini ≈ 6.88 kB（约小 **73%**）。

> 注意：通配符导入 `import * as v` 与具名导入**摇树效果相同**，不必为体积刻意改写成具名导入。

## 二、safeParse 的三态：typed 与 success

`SafeParseResult` 是一个**三态联合**，除了 `success` 还有 `typed`：

```ts
// ① 完全通过
{ typed: true,  success: true,  output: T,       issues: undefined }
// ② 类型对，但 pipe 内某 action 没过（注意 output 仍有值！）
{ typed: true,  success: false, output: T,       issues: [...] }
// ③ 连类型都不对
{ typed: false, success: false, output: unknown, issues: [...] }
```

- **`typed`**：数据的 TS 类型是否匹配 schema。
- **`success`**：是否**全部通过**（含 pipe 里的校验 action）。

所以「输入是 string（类型对），但没通过 `minLength(8)`」时，`typed:true` 而 `success:false`，且 `output` 仍是那个字符串。日常判断用 `success` 即可；需要「类型已对、仅业务规则没过」这种细分时，`typed` 才派上用场。

## 三、parser：预编译可复用解析器

```ts
// 把 schema + config 固化成一个解析函数
const parseUser = v.parser(UserSchema);
parseUser(data); // 等价 v.parse(UserSchema, data)

// 不抛错版本
const safeParseUser = v.safeParser(UserSchema);
safeParseUser(data); // 返回结果对象
```

适合在模块边界导出「现成的解析器」，调用方只传 input，无需每次重复传 schema 与配置。

## 四、brand 与 readonly：名义类型

结构相同但语义不同的值（`UserId` vs `PostId`）默认可互换，用 `brand` 在类型层面隔离：

```ts
const UserId = v.pipe(v.string(), v.uuid(), v.brand('UserId'));
type UserId = v.InferOutput<typeof UserId>; // string & Brand<'UserId'>

function getUser(id: UserId) { /* ... */ }
getUser('随便一个 uuid 字符串'); // ❌ 类型错误：缺少品牌
getUser(v.parse(UserId, uuid)); // ✅
```

`brand`/`readonly`/`transform` 都会让 `InferInput` 与 `InferOutput` 不同——`brand` 给输出加品牌，`readonly` 把输出标记为只读。

## 五、命名约定：保留字与下划线

`enum`、`null`、`undefined`、`void`、`function` 是 JS 保留字，**不能直接作为具名导入标识符**。Valibot 源码把它们导出为下划线版并做别名：

```text
源码导出：enum_ as enum, null_ as null, undefined_ as undefined,
          void_ as void, function_ as function
```

于是：

```ts
import * as v from 'valibot';
v.enum(MyEnum);   // ✅ 通配符下属性访问不受保留字限制
v.null();         // ✅

import { enum_, null_ } from 'valibot'; // ✅ 具名导入要用下划线版
import { enum } from 'valibot';         // ❌ 语法错误：enum 是保留字
```

## 六、性能定位：有意的取舍

官方对比页坦诚 Valibot 运行时速度处于「**中游**」：约为 Zod v3 的 **2 倍**，但**明显慢于** Typia、TypeBox——后者用编译器生成优化代码或用 `Function` 构造器，Valibot 都不用。它换来的是：

- **极小 bundle**（更小传输、更快下载）；
- **极快启动**（初始化开销低）。

判断依据：前端/边缘场景里，校验的数据量通常很小（用户提交的一个表单），每次校验的微秒级差异，远不如「让每个用户少下载十几 KB」实在。所以 Valibot 是**面向客户端/包体敏感场景**的取舍；若是服务端高吞吐、追求极致校验速度，Typia/TypeBox 可能更合适。

## 七、从 Zod 迁移的取舍

核心 API 映射：

| Zod | Valibot |
|---|---|
| `z.string().email().min(5)` | `v.pipe(v.string(), v.email(), v.minLength(5))` |
| `z.infer` / `z.input` | `v.InferOutput` / `v.InferInput` |
| `Schema.parse/safeParse` | `v.parse/safeParse(Schema, ...)` |
| `.optional()` / `.nullable()` | `v.optional(...)` / `v.nullable(...)` |
| `z.enum([...])` | `v.picklist([...])` |
| `z.nativeEnum(E)` | `v.enum(E)`（即 `enum_`） |
| `z.or` / `z.and` | `v.union` / `v.intersect` |
| `.refine()` | `v.check()` / `v.forward(v.partialCheck(...))` |
| `.catch()` | `v.fallback()` |
| `.strict()` / `.passthrough()` | `v.strictObject()` / `v.looseObject()` |
| `z.discriminatedUnion` | `v.variant()` |

自动化：`npx @valibot/zod-to-valibot` 官方 codemod 能转写大部分写法（方法链转 pipe、`z.`→`v.`、重命名），边缘/复杂用法仍需人工核对。

**何时该迁**：包体敏感（前端 SDK、组件库、边缘函数）、想要 `InferInput`/`InferOutput` 的细粒度类型、偏好函数式组合时，Valibot 很合适。**何时可不迁**：已深度使用 Zod 生态插件、团队更习惯方法链、服务端追求极致运行时速度时，迁移收益有限。

## 八、生态集成

Valibot 实现了社区 **Standard Schema** 规范，因此能被主流框架直接吃下：

- 表单：React Hook Form（`@hookform/resolvers` 的 valibot resolver）、TanStack Form 等；
- 服务端/路由：tRPC、Hono、各类支持 Standard Schema 的框架。

把 schema 传给 resolver / 框架即可自动校验，无需手写适配，也**不必**先转成 Zod。

---

回到 [参考](../reference) 查 schema / action / method 速查表。
