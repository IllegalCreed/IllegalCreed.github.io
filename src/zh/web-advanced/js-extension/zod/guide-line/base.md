---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **Zod 4.4.3**。本篇把「会装会用」推进到「懂构件与语义」：schema 全景、对象额外键策略、可选/可空/默认值、校验 vs 转换、类型推导。标注 ⚠️ 处为 v3 → v4 差异。

## 速查

- 基线：Zod `4.4.3`；推荐 `import * as z from "zod"`，TypeScript 需 `5.5+` 且开启 `strict`
- 对象额外键：`z.object` 剥离、`z.strictObject` 报错、`z.looseObject` 保留、`.catchall(s)` 逐值校验
- 空值语义：`.optional()` 接受 `undefined`，`.nullable()` 接受 `null`，`.nullish()` 同时接受两者
- 默认与兜底：`.default()` 遇 `undefined` 直接返回输出值；`.prefault()` 让默认输入继续解析；`.catch()` 处理任意解析失败
- 执行顺序就是声明顺序；要先去空白再验邮箱，写 `z.string().trim().pipe(z.email())`
- 强制转换：`z.coerce.*` 默认输入为 `unknown`；`z.coerce.boolean()` 使用 JS truthiness，文本布尔优先 `z.stringbool()`
- 类型：`z.infer<S>` 等于 `z.output<S>`；有 transform、coerce 或默认值时再单独看 `z.input<S>`
- [Schema API](https://zod.dev/api) 是工厂、格式、对象策略和默认值语义的一手基线

## 一、schema 全景

Zod 的一切都从「schema 工厂函数」开始，链式方法在其上叠加约束，每步返回新的不可变 schema：

```ts
import * as z from "zod";

// 原语
z.string();
z.number();
z.boolean();
z.bigint();
z.date();
z.symbol();
z.null();
z.undefined();
z.any();
z.unknown();
z.never();

// 复合
z.object({ name: z.string(), age: z.number() }); // 对象
z.array(z.string()); // 数组
z.tuple([z.string(), z.number()]); // 定长元组
z.union([z.string(), z.number()]); // 联合
z.record(z.string(), z.number()); // ⚠️ v4 必须两参
z.map(z.string(), z.number()); // Map
z.set(z.number()); // Set

// 字面量 / 枚举
z.literal("admin"); // 字面量
z.enum(["light", "dark"]); // 枚举（联合字面量）
z.optional(z.string()); // 可选（= .optional()）
z.nullable(z.string()); // 可空（= .nullable()）
```

> ⚠️ v4 中 `z.enum([...])` 被重载：既能表示字符串字面量集合，也能直接吃 TS 原生 `enum`，因此 `z.nativeEnum()` 被弃用，统一用 `z.enum()`。

## 二、对象与额外键策略

`z.object` 对「schema 未声明的多余键」有三种处理，v4 用**不同工厂**表达（而非 v3 的 `.strict()`/`.passthrough()` 方法链）：

| 工厂                          | 多余键处理                                        |
| ----------------------------- | ------------------------------------------------- |
| `z.object({...})`             | 默认：**剥离（strip）**，校验通过但输出不含多余键 |
| `z.strictObject({...})`       | 有多余键就**报错**（⚠️ 取代 `.strict()`）         |
| `z.looseObject({...})`        | **保留**多余键（⚠️ 取代 `.passthrough()`）        |
| `z.object({...}).catchall(s)` | 给所有未声明键的值指定 schema                     |

```ts
z.object({ name: z.string() }).parse({ name: "a", extra: 1 });
// => { name: "a" }（extra 被剥离）

z.strictObject({ name: z.string() }).parse({ name: "a", extra: 1 });
// => 抛 ZodError（unrecognized_keys）

z.object({ id: z.number() }).catchall(z.string());
// id 必须是 number，其余任意键的值必须是 string
```

## 三、可选、可空与默认值

```ts
z.string().optional(); // 额外接受 undefined（推导可选属性）
z.string().nullable(); // 额外接受 null
z.string().nullish(); // 额外接受 null 和 undefined

z.string().default("tuna"); // 缺省（undefined）时填充
z.number().default(Math.random); // 也可传函数，每次解析重新求值
z.number().catch(42); // 校验失败时回退
```

三者分工要分清：`optional` 只管 `undefined`、`nullable` 只管 `null`、`nullish` 两者都管。

> ⚠️ **v4 默认值短路**：`.default(v)` 在输入为 `undefined` 时**直接返回 v、不再走解析**，所以 `v` 必须可赋给「**输出类型**」。若想让默认值先经过解析（v3 旧行为），用 `.prefault()`：
>
> ```ts
> z.string()
>   .transform((s) => s.length)
>   .default(0); // 输入 undefined → 0
> z.string()
>   .transform((s) => s.length)
>   .prefault("tuna"); // 输入 undefined → 4
> ```
>
> 另外 `.default()` 只对 `undefined` 生效；`.catch()` 才是「值非法时兜底」。

## 四、校验 vs 转换

Zod 的链式方法分两类，理解这点是写好 schema 的关键：

- **校验**：只判断是否合法、不改值。如 `.min()` `.max()` `.regex()`、顶层 `z.email()` `z.url()`，以及自定义的 `.refine()`。
- **转换**：改变值（可改类型），改变 schema 的输出类型。如 `.trim()` `.toLowerCase()`、`z.coerce.*`，以及自定义的 `.transform()`。

```ts
// 先去空白，再校验邮箱；pipe 明确保证执行顺序
const Email = z.string().trim().pipe(z.email());

// 转换：字符串 → 数字（输入 string，输出 number）
const Num = z.string().transform((s) => Number(s));

// 自定义校验（≈ 布尔判定）
const Username = z.string().refine((s) => /^[a-z0-9_]+$/.test(s), {
  error: "只能用小写字母、数字、下划线",
});

// 自定义转换
const Slug = z.string().transform((s) => s.toLowerCase().replace(/\s+/g, "-"));
```

> `refine` 返回布尔（true 通过），`transform` 返回新值。一个判定「行不行」，一个负责「变成什么」。

## 五、强制转换 coerce

来自 URL query、表单、环境变量的输入天生是字符串。`z.coerce.*` 先强制转换再校验：

```ts
z.coerce.number().parse("42"); // => 42（先 Number("42")）
z.coerce.boolean().parse(""); // => false（Boolean("")）
z.coerce.date().parse("2026-01-01"); // => Date 对象

// 对比：普通 z.number() 收到 "42" 会报 invalid_type
```

> ⚠️ v4 中所有 `z.coerce.*` 的**输入类型是 `unknown`**（v3 是具体类型）。另注意 `z.coerce.boolean()` 用 `Boolean(input)`——任何非空字符串都为 `true`；要按 "true"/"false" 语义解析用 `z.stringbool()`。

## 六、类型推导：infer / input / output

```ts
const Schema = z.string().transform((s) => s.length);

type In = z.input<typeof Schema>; // string（校验前）
type Out = z.output<typeof Schema>; // number（校验后）
type T = z.infer<typeof Schema>; // number（= output）
```

- **`z.infer`**：日常最常用，等于 `z.output`，是「校验后的业务类型」。
- **`z.input`**：校验前的输入类型，少数场景用（如表单原始值类型）。
- 二者**何时不同**：有 `transform`、`coerce`、带默认值的 `default` 时。纯校验（如 `z.email().min(5)`）则输入输出一致。

---

进入 [指南 · 进阶](./advanced)：refine / superRefine / transform / pipe 深入、判别联合、递归 schema、错误处理与生态接入。
