---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **Valibot 1.x**。本篇把「会装会用」推进到「懂构件与语义」：schema 全景、`pipe()` 与 action（校验 vs 转换）、可选/可空与默认值、对象额外键策略、类型推导。

## 一、三类构件全景

Valibot 把一切拆成三类函数，记住它们的角色就抓住了全部 API：

| 构件 | 角色 | 代表 | 用法 |
|---|---|---|---|
| **schema** | 定义数据类型，是 pipeline 起点 | `string` `number` `object` `array` `union` | 直接调用或嵌套 |
| **action** | 校验 / 转换 / 元数据 | `email` `minLength` `trim` `transform` `brand` | **只能放进 `pipe()`** |
| **method** | 以 schema 为首参，使用或改造它 | `parse` `safeParse` `pick` `partial` `fallback` | `v.method(Schema, ...)` |

```ts
import * as v from 'valibot';

const Schema = v.pipe(   // pipe 是 method
  v.string(),            // schema：起点
  v.trim(),              // action：转换
  v.email()              // action：校验
);
v.parse(Schema, ' a@b.com '); // method：使用
```

## 二、常用 schema 族

```ts
// 基础类型
v.string(); v.number(); v.boolean(); v.bigint(); v.date(); v.symbol();
v.null(); v.undefined(); v.any(); v.unknown();

// 复合类型
v.object({ name: v.string(), age: v.number() }); // 对象
v.array(v.string());                              // 数组
v.tuple([v.string(), v.number()]);                // 定长元组
v.record(v.string(), v.number());                 // 键值记录
v.map(v.string(), v.number());                    // Map
v.set(v.number());                                // Set

// 特殊
v.literal('admin');                  // 字面量
v.picklist(['light', 'dark']);       // 字面量列表（≈ Zod z.enum）
v.union([v.string(), v.number()]);   // 联合
v.intersect([A, B]);                 // 交叉
v.optional(v.string());              // 可选
v.nullable(v.string());              // 可空
```

> ⚠️ `v.picklist([...])` 校验**字面量列表**（对应 Zod 的 `z.enum`）；`v.enum(...)` 校验 **TS 原生 enum 对象**（源码导出名 `enum_`，因 `enum` 是保留字）。两者别混。

## 三、pipe：校验 vs 转换

`pipe()` 数据从左到右流过每个 action。action 分两种：

- **校验 action**：只检查不改值，不通过就产生 issue。如 `email` `url` `regex` `minLength` `maxLength` `integer` `minValue` `maxValue` `startsWith` `endsWith`。
- **转换 action**：改变值（可改类型），把新值传给下一步。如 `trim` `toNumber` `toDate` `toUpperCase` `toLowerCase`。

```ts
// 校验：字符串、去空白、是邮箱、以 @qq.com 结尾
const Email = v.pipe(v.string(), v.trim(), v.email(), v.endsWith('@qq.com'));

// 转换：字符串 → 数字
const Num = v.pipe(v.string(), v.toNumber()); // 输入 string，输出 number

// 数值范围（注意用 minValue/maxValue，不是 minLength）
const Age = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(150));
```

> 顺序很重要：转换通常放在校验前（如先 `trim` 再 `email`），否则可能因残留空白误判。

### 自定义校验与转换

```ts
// check：自定义布尔校验（≈ Zod 的 refine）
const Username = v.pipe(
  v.string(),
  v.check((s) => /^[a-z0-9_]+$/.test(s), '只能用小写字母、数字、下划线')
);

// transform：自定义转换
const Slug = v.pipe(
  v.string(),
  v.transform((s) => s.toLowerCase().replace(/\s+/g, '-'))
);
```

## 四、可选、可空与默认值

```ts
v.optional(v.string());   // 额外接受 undefined
v.nullable(v.string());   // 额外接受 null
v.nullish(v.string());    // 额外接受 null 和 undefined

// 第二参 = 默认值（缺省/undefined/null 时补齐）
v.optional(v.string(), '默认值');
v.optional(v.date(), () => new Date()); // 也可传工厂函数
```

三者分工要分清：`optional` 只管 `undefined`、`nullable` 只管 `null`、`nullish` 两者都管。

> ⚠️ **缺省陷阱**：对象里 optional 键**缺失且没给默认值**时，该字段的 `pipe`（包括 `transform`）**不会执行**，输出类型是可选键；给了默认值后才会执行，且该键变必有。这是高频踩坑点。

## 五、对象的额外键策略

Valibot 用**不同函数**表达对额外键的处理（而非 Zod 的 `.strict()`/`.passthrough()` 方法链）：

| 函数 | 多余键处理 |
|---|---|
| `v.object({...})` | 默认：**剔除/忽略**多余键 |
| `v.strictObject({...})` | 有多余键就**报错** |
| `v.looseObject({...})` | **保留**多余键 |
| `v.objectWithRest(entries, rest)` | 给多余键指定 schema |

```ts
v.strictObject({ id: v.number() }); // {id:1, extra:2} → 报错
v.looseObject({ id: v.number() });  // {id:1, extra:2} → 保留 extra
```

## 六、类型推导：InferInput vs InferOutput

```ts
const Schema = v.optional(v.string(), 'hi');

type In = v.InferInput<typeof Schema>;   // string | undefined（校验前）
type Out = v.InferOutput<typeof Schema>; // string（校验后，默认值已补）
```

- **`InferOutput`**：校验后的输出类型，日常最常用（≈ Zod 的 `z.infer`）。
- **`InferInput`**：校验前的输入类型，少数场景用（如表单原始值类型）。
- 二者**何时不同**：有 `transform`、有默认值的 `optional`/`nullable`、`brand`、`readonly` 时。纯校验（如 `pipe(string, email)`）则输入输出一致。

---

进入 [指南 · 进阶](./advanced)：递归与判别联合、跨字段校验、对象工具方法、错误处理与 i18n、异步校验。
