---
layout: doc
outline: [2, 3]
---

# 类型体操入门：从类型里造类型

> 基于 TypeScript 6.0 · 核于 2026-07

## 速查

- **`keyof T`**：取 T 所有键的**字面量联合**（`keyof {a;b}` = `"a" | "b"`）；取所有值类型用 `T[keyof T]`。
- **`typeof value`（类型位置）**：取一个**值/变量的静态类型**，用于反推类型（`type C = typeof config`）。
- **索引访问 `T[K]`**：按键取属性类型；`T["a" | "b"]` 取联合；`T[number]` 取数组元素类型。
- **条件类型 `T extends U ? X : Y`**：类型级三元；按可赋值性选分支。
- **`infer`**：在 `extends` 子句里**捕获**一个待推断类型变量（`T extends Array<infer E> ? E : T`）。
- **分布式条件类型**：裸类型参数对**联合逐个分布**；用 `[T] extends [U]` 元组包裹**关闭分布**。
- **映射类型 `{ [K in keyof T]: ... }`**：遍历键造新类型；修饰符 `+/-readonly`、`+/-?` 增删只读/可选。
- **键重映射 `as`（4.1）**：`[K in keyof T as NewKey]` 改写键名；映射到 `never` 可**过滤键**。
- **模板字面量类型**：`` `${A}-${B}` `` 在类型层拼字符串 + 模式匹配；配合 `Uppercase`/`Capitalize` 等内置类型。
- **组合**：工具类型（`Partial`/`Pick`/`ReturnType`…）全由这些机制拼出——读懂它们即入门类型编程。

## 一、keyof 与索引访问

`keyof T` 取键的联合，`T[K]` 按键取属性类型，二者常配合：

```ts
interface User { id: number; name: string; active: boolean }

type Keys = keyof User;        // "id" | "name" | "active"
type NameType = User["name"];  // string
type Vals = User[keyof User];  // number | string | boolean（所有值类型）

// 数组/元组：用 number 索引取元素类型
type Arr = string[];
type Elem = Arr[number];       // string
```

## 二、typeof：从值反推类型

在**类型位置**用 `typeof`，把一个已存在的值的类型「拿出来」复用——避免重复声明：

```ts
const config = { host: "localhost", port: 5432, ssl: false };
type Config = typeof config; // { host: string; port: number; ssl: boolean }

// 经典组合：从 as const 对象造字面量联合
const Colors = { Red: "red", Green: "green" } as const;
type Color = typeof Colors[keyof typeof Colors]; // "red" | "green"
```

## 三、条件类型与 infer

**条件类型** `T extends U ? X : Y` 是类型级的三元判断：

```ts
type IsString<T> = T extends string ? true : false;
type A = IsString<"hi">;  // true
type B = IsString<number>; // false
```

**`infer`** 在条件成立时**捕获**内部类型——这是从复合类型里「解构」的关键：

```ts
// 取数组元素类型
type ElementOf<T> = T extends Array<infer E> ? E : T;
type E1 = ElementOf<number[]>; // number

// 取 Promise 解包类型
type Unwrap<T> = T extends Promise<infer V> ? V : T;
type V1 = Unwrap<Promise<string>>; // string

// 取函数返回类型（ReturnType 的原理）
type MyReturn<T> = T extends (...args: any) => infer R ? R : never;
```

## 四、分布式条件类型

当条件类型作用于**裸类型参数**且该参数是联合时，会对每个成员**分别计算再合并**（分布）：

```ts
type ToArray<T> = T extends any ? T[] : never;
type R = ToArray<string | number>; // string[] | number[]（已分布）
```

不想分布时，把两侧都用**元组包裹**，联合就被当整体处理：

```ts
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;
type R2 = ToArrayNonDist<string | number>; // (string | number)[]
```

::: tip 分布是特性也是坑
`Exclude<U, M>` 正是靠分布实现的（`U extends M ? never : U`）。但写某些工具类型时（如判断「是否恰好是联合」），意外的分布会给出错误结果——记住用 `[T] extends [U]` 关掉它。
:::

## 五、映射类型

**映射类型** `{ [K in keyof T]: ... }` 遍历 T 的键、造出新类型，是 `Partial`/`Readonly` 等的实现基础：

```ts
// 把所有属性变布尔开关
type Flags<T> = { [K in keyof T]: boolean };

// 修饰符增删：- 移除、+（默认）添加
type Mutable<T> = { -readonly [K in keyof T]: T[K] }; // 去只读
type Concrete<T> = { [K in keyof T]-?: T[K] };         // 去可选（Required 的原理）
type Optional<T> = { [K in keyof T]?: T[K] };          // 加可选（Partial 的原理）
```

### 键重映射与过滤

`as` 子句（TS 4.1）能**改写键名**，映射到 `never` 能**过滤键**：

```ts
// 生成 getter 类型：name -> getName
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K]
};
interface Person { name: string; age: number }
type PG = Getters<Person>; // { getName: () => string; getAge: () => number }

// 过滤：只保留值为 string 的键
type StringKeysOnly<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K]
};
```

## 六、模板字面量类型

**模板字面量类型**把字符串拼接/模式匹配带到类型层，语法与 JS 模板字符串一致，但作用在类型上：

```ts
type Lang = "en" | "zh";
type Kind = "home" | "about";
type Route = `/${Lang}/${Kind}`;
// "/en/home" | "/en/about" | "/zh/home" | "/zh/about"（联合会自动组合）

// 配合 infer 做模式匹配：解析出事件名
type EventName<T extends string> = `on${Capitalize<T>}`;
type Click = EventName<"click">; // "onClick"
```

内置的 `Uppercase` / `Lowercase` / `Capitalize` / `Uncapitalize` 常与模板字面量搭配，做键名变换。

## 七、组合示例：一个迷你 DeepReadonly

把上述机制组合起来，就能写出实用的递归类型（这也是 `type-challenges` 的入门题）：

```ts
type DeepReadonly<T> = T extends (infer E)[]
  ? ReadonlyArray<DeepReadonly<E>>              // 数组：递归元素
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> } // 对象：递归属性 + readonly
    : T;                                        // 原始类型：原样返回

interface Nested { a: { b: { c: number } } }
type RO = DeepReadonly<Nested>; // 每一层都变 readonly
```

::: warning 类型体操要克制
条件 + 映射 + 递归能写出极强的类型，但也可能写出**无人能维护、拖慢编译**的「类型天书」。生产代码里优先用内置工具类型与清晰命名，把复杂类型逻辑封进有注释的类型别名，别炫技。
:::

---

会造类型后，进入 [配置·模块·互操作](./config-modules-interop)：`tsconfig.json` 关键项、模块与声明文件、装饰器与枚举取舍、以及 TS 6.0/7.0 的版本变化。
