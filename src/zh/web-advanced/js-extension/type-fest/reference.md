---
layout: doc
outline: [2, 3]
---

# 参考

> type-fest **常用类型速查**，按类型族分组。版本基线 type-fest 4.x。全部为纯类型，用 `import type` 引入。完整清单见官方 README。

## 一、对象 · 深浅层变换

| 类型 | 作用 | 对位内置 |
|---|---|---|
| `PartialDeep<T>` | 递归把所有层级键变可选 | 内置 `Partial`（仅第一层） |
| `RequiredDeep<T>` | 递归把所有层级键变必填 | 内置 `Required`（仅第一层） |
| `ReadonlyDeep<T>` | 递归把对象/数组/Map/Set 变只读 | 内置 `Readonly`（仅第一层） |
| `Writable<T>` | 去掉 `readonly`（可写化） | 内置 `Readonly` 的逆 |
| `WritableDeep<T>` | 递归去掉 `readonly` | — |
| `Simplify<T>` | 摊平交叉/映射结果，改善悬浮提示 | — |

## 二、对象 · 键的增删改

| 类型 | 作用 |
|---|---|
| `SetOptional<T, K>` | 把指定键变可选，其余不变 |
| `SetRequired<T, K>` | 把指定键变必填，其余不变 |
| `SetReadonly<T, K>` | 把指定键变只读 |
| `SetNonNullable<T, K>` | 去掉指定键类型里的 `null`/`undefined` |
| `Except<T, K>` | 删除键（比内置 `Omit` 更严：键须真实存在） |
| `Merge<Dest, Src>` | 合并两类型，**Src 覆盖 Dest** 同名键 |
| `MergeDeep<Dest, Src>` | 递归合并（同名键都是对象/数组时深入） |
| `OverrideProperties<T, O>` | 覆盖已有属性（强制 O 的键在 T 上存在） |
| `Merge`/`Spread`/`SetFieldType` | 其它合并/改字段类型工具 |

## 三、对象 · 键约束（互斥/至少一个）

| 类型 | 语义 |
|---|---|
| `RequireAtLeastOne<T, K>` | 给定键里**至少**给一个（可多个） |
| `RequireExactlyOne<T, K>` | 给定键里**恰好**给一个（互斥） |
| `RequireAllOrNone<T, K>` | 要么全给，要么全不给 |
| `RequireOneOrNone<T, K>` | 恰好一个，或一个都不给 |

## 四、对象 · 取值/路径/条件筛选

| 类型 | 作用 |
|---|---|
| `ValueOf<T>` | 所有值的联合（`keyof` 的值版） |
| `Entries<T>` | `[key, value][]`，对应 `.entries()` 返回类型 |
| `Get<T, 'a.b.c'>` | 按点路径取深层属性类型（类型版 `_.get`） |
| `Paths<T>` | 所有可达属性路径的联合（配合 `Get`） |
| `ConditionalKeys<T, C>` | 值满足条件 C 的键的联合 |
| `ConditionalPick<T, C>` | 值满足条件 C 的属性子对象 |
| `ConditionalExcept<T, C>` | 排除值满足条件 C 的属性 |
| `Schema<T, V>` | 同构深层类型，把叶子值替换为 V |
| `EmptyObject` | 严格空对象（弥补 `{}` 的陷阱） |

## 五、标称类型（nominal / branding）

| 类型 | 作用 |
|---|---|
| `Tagged<Type, Name, Meta?>` | 贴标签造标称类型（支持多标签 + 元数据） |
| `GetTagMetadata<…>` | 取出某标签的元数据 |
| `UnwrapTagged<T>` | 还原回底层类型（移除标签） |
| `Opaque` / `UnwrapOpaque` | **已废弃**，分别改用 `Tagged` / `UnwrapTagged` |

## 六、字符串（类型层面变换）

| 类型 | 示例 → 结果 |
|---|---|
| `CamelCase<S>` | `'foo-bar'` → `'fooBar'` |
| `SnakeCase<S>` | `'fooBar'` → `'foo_bar'` |
| `KebabCase<S>` | `'fooBar'` → `'foo-bar'` |
| `PascalCase<S>` | `'foo-bar'` → `'FooBar'` |
| `ScreamingSnakeCase<S>` | `'fooBar'` → `'FOO_BAR'` |
| `DelimiterCase<S, D>` | 自定义分隔符大小写 |
| `Split<S, D>` | `Split<'a,b', ','>` → `['a', 'b']` |
| `Join<T, D>` | `Join<['a','b'], '.'>` → `'a.b'` |
| `Replace<S, From, To, {all?}>` | `Replace<'a:b', ':', '-'>` → `'a-b'` |
| `Trim<S>` | 去首尾空格 |
| `*CasedProperties<T>` / `*CasedPropertiesDeep<T>` | 对**对象键**做大小写（浅/深） |

## 七、JSON

| 类型 | 作用 |
|---|---|
| `JsonValue` | `JsonPrimitive \| JsonObject \| JsonArray` |
| `JsonPrimitive` | `string \| number \| boolean \| null` |
| `JsonObject` / `JsonArray` | JSON 对象 / 数组 |
| `Jsonify<T>` | 转成「JSON 序列化后」可赋给 `JsonValue` 的形态 |
| `Jsonifiable` | 可无损 JSON 化的值 |

## 八、异步

| 类型 | 作用 |
|---|---|
| `Promisable<T>` | `T \| PromiseLike<T>`（值或其 Promise） |
| `AsyncReturnType<F>` | 异步函数解析后的返回类型 |
| `Asyncify<F>` | 把返回值包进 `Promise` |

## 九、联合/元组 与 类型守卫

| 类型 | 作用 |
|---|---|
| `LiteralUnion<L, B>` | 字面量联合 + 保留补全（不被坍缩成 `string`） |
| `UnionToIntersection<U>` | 联合 → 交叉 |
| `TupleToUnion<T>` / `UnionToTuple<U>` | 元组 ↔ 联合 |
| `IsEqual<A,B>` / `IsAny<T>` / `IsNever<T>` / `IsUnknown<T>` | 返回 `true`/`false` 类型 |
| `IsLiteral<T>` / `IsStringLiteral<T>` | 字面量判定 |

## 十、现成结构 / 杂项

| 类型 | 作用 |
|---|---|
| `PackageJson` | npm `package.json` 的结构类型 |
| `TsConfigJson` | `tsconfig.json` 的结构类型 |
| `GlobalThis` | 局部作用域的 `globalThis` 属性声明 |
| `Stringified<T>` | 把所有属性值类型改为 `string` |
| `LiteralToPrimitive<T>` | 字面量 → 其原始类型 |

---

命令查完，进 [指南 · 基础](./guide-line/base) 系统理解对象类型族，或 [指南 · 进阶](./guide-line/advanced) 看字符串/JSON/异步实战。
