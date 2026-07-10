---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **type-fest 5.8.0**。本篇把「会装会引」用到「会用对象类型族」：深浅层变换、键的增删改（`SetOptional`/`SetRequired`/`Merge`/`Except`）、键约束（至少/恰好一个）、取值（`ValueOf`/`Entries`）。纯类型，推荐 `import type` 引入。

## 速查

- 内置 `Partial` / `Required` / `Readonly` 只处理第一层；对应 Deep 类型递归处理嵌套结构
- `PartialDeep` 默认 `recurseIntoArrays: false`，需要递归数组元素时显式开启
- `SetOptional` / `SetRequired` 只改指定键；`Except` 比内置 `Omit` 更严格地校验键名
- `Merge<A, B>` 是浅层「B 覆盖 A」；递归合并使用 `MergeDeep`
- 只允许覆盖已有字段时用 `OverrideProperties`，拼错字段会在编译期报错
- 至少一个用 `RequireAtLeastOne`，恰好一个用 `RequireExactlyOne`
- `Entries<T>` 配合 `Object.entries()` 时通常需要断言；断言不校验真实键值

## 一、深浅层：内置浅层 vs type-fest 深层

这是理解 type-fest 对象类型最重要的一条主线。TS 内置的 `Partial`/`Required`/`Readonly` 都是**浅层**——只作用第一层；type-fest 提供对应的**深层**版本：

| 内置（浅层） | type-fest（深层） | 作用 |
|---|---|---|
| `Partial<T>` | `PartialDeep<T>` | 递归把所有层级键变可选 |
| `Required<T>` | `RequiredDeep<T>` | 递归把所有层级键变必填 |
| `Readonly<T>` | `ReadonlyDeep<T>` | 递归把对象/数组/Map/Set 变只读 |

```ts
import type { ReadonlyDeep } from 'type-fest';

interface Data { foo: string[] }
const data: ReadonlyDeep<Data> = { foo: ['bar'] };

// data.foo.push('baz');
//=> 报错：Property 'push' does not exist on type 'readonly string[]'
```

::: tip 数组的默认行为
`PartialDeep` 默认**不**递归进数组/元组的元素（`recurseIntoArrays: false`），避免对数组做出反直觉变换。需要时显式开启：`PartialDeep<T, { recurseIntoArrays: true }>`。
:::

## 二、键的增删改（一）：SetOptional / SetRequired

「基于同一个模型，只改某几个键的可选性」——不必另写接口：

```ts
import type { SetOptional, SetRequired } from 'type-fest';

type Foo = { a: number; b?: string; c: boolean };

type T1 = SetOptional<Foo, 'b' | 'c'>;
//=> { a: number; b?: string; c?: boolean }  c 变可选

type T2 = SetRequired<Foo, 'b'>;
//=> { a: number; b: string; c: boolean }     b 变必填
```

它们是一对镜像：`SetOptional` 变可选、`SetRequired` 变必填，其余键原样保留。对比 `Partial`（把**所有**键变可选）粒度更精确。

## 三、键的增删改（二）：Except 比 Omit 更严

内置 `Omit<T, K>` **不检查** K 是否真实存在于 T——拼错键名、字段被重命名后会**静默失效**。`Except` 把键约束为「必须是 T 上的键」：

```ts
import type { Except } from 'type-fest';

type User = { id: string; name: string; password: string };

type PublicUser = Except<User, 'password'>;        // ✅
// type Bad = Except<User, 'passwrod'>;             // ❌ 拼错立即报错（Omit 不会）
```

> 还可传 `{ requireExactProps: true }` 禁止多余属性。官方曾向 TS 提议更严格的 `Omit`，被婉拒（建议库自行实现），`Except` 即此实现。

## 四、键的增删改（三）：Merge 与 OverrideProperties

裸交叉 `A & B` 遇到同名不兼容键会得到 `never`。`Merge` 干净地「**后者覆盖前者**」：

```ts
import type { Merge } from 'type-fest';

type A = { foo: string; bar: number };
type B = { bar: string; baz: boolean };

type AB = Merge<A, B>;
//=> { foo: string; bar: string; baz: boolean }  bar 被 B 覆盖
```

如果你**只想改已有字段的类型**、并希望「改错字段时报错」，用 `OverrideProperties`（强制被覆盖的键必须在原类型上存在）：

```ts
import type { OverrideProperties } from 'type-fest';

type Foo = { a: string; b: string };
type Ok = OverrideProperties<Foo, { b: number }>;   // ✅ { a: string; b: number }
// type Bad = OverrideProperties<Foo, { c: number }>; // ❌ c 不在 Foo 上
```

> 深层合并（同名键都是对象时递归深入）用 `MergeDeep`；`Merge` 是浅层覆盖。

## 五、键约束：至少一个 / 恰好一个

业务约束「这几个键里至少要给一个」或「只能给一个」：

```ts
import type { RequireAtLeastOne, RequireExactlyOne } from 'type-fest';

type Responder = { text?: () => string; json?: () => string; secure?: boolean };

// 至少一个：可以两者都给
type R1 = RequireAtLeastOne<Responder, 'text' | 'json'>;

// 恰好一个：给了 json 就不能再给 text（互斥）
type R2 = RequireExactlyOne<Responder, 'text' | 'json'>;
```

| 类型 | 0 个 | 1 个 | 多个 |
|---|---|---|---|
| `RequireAtLeastOne` | ❌ | ✅ | ✅ |
| `RequireExactlyOne` | ❌ | ✅ | ❌ |
| `RequireOneOrNone` | ✅ | ✅ | ❌ |
| `RequireAllOrNone` | ✅ | — | 全给 ✅ |

::: warning RequireExactlyOne 的局限
TS 无法在编译期穷举运行时会出现的所有键，因此 `RequireExactlyOne` 对「它不知道的额外键」无能为力——只能约束你显式列出的那组键。
:::

## 六、取值：ValueOf 与 Entries

`keyof` 取「键的联合」，type-fest 补上「值」与「键值对」：

```ts
import type { ValueOf, Entries } from 'type-fest';

const config = { foo: 1, bar: 2, biz: 3 } as const;

type Values = ValueOf<typeof config>;
//=> 1 | 2 | 3

// 让 Object.entries 带上精确类型（内置返回宽泛的 [string, any][]）
const entries = Object.entries(config) as Entries<typeof config>;
entries.forEach(([k, v]) => { /* k、v 都有精确类型 */ });
```

这里的 `as Entries<...>` 只是类型断言，不会在运行时转换或检查 `Object.entries()` 的结果。对象若可能含类型声明之外的键，断言就可能不再可靠。

---

进入 [指南 · 进阶](./advanced)：字符串类型族（`CamelCase`/`SnakeCase`/`Split`/`Replace` 与对象键批量转换）、JSON（`Jsonify`/`JsonValue`）、异步（`Promisable`）。
