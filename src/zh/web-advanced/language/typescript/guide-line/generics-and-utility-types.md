---
layout: doc
outline: [2, 3]
---

# 泛型与工具类型：复用的类型安全代码

> 基于 TypeScript 6.0 · 核于 2026-07

## 速查

- **泛型函数**：`function id<T>(x: T): T`；调用时**类型参数可推断**（`id("hi")` 中 `T = string`），无需显式 `id<string>`。
- **泛型约束**：`<T extends { length: number }>` —— 限定 `T` 必须具备某些成员，体内才能安全访问。
- **参数约束参数**：`<T, K extends keyof T>(o: T, k: K): T[K]` —— 类型安全的按键取值。
- **默认类型参数**：`<T = string>`；必选参数须在带默认的之前。
- **`const` 类型参数（5.0）**：`function f<const T>(x: T)` 让实参像 `as const` 一样保留字面量。
- **设计建议**：能推断就别显式；**别过度约束**；**把类型参数「下推」**到真正用到的地方；泛型优于 `any`（保留类型信息）。
- **变形三件套**：`Partial`（全可选）/`Required`（全必填）/`Readonly`（全只读）。
- **裁剪对象**：`Pick<T, K>`（白名单保留）/`Omit<T, K>`（黑名单排除）/`Record<K, V>`（构造键值映射）。
- **裁剪联合**：`Exclude<U, M>`（剔除）/`Extract<U, M>`（提取）/`NonNullable<T>`（去 `null`/`undefined`）。
- **函数/构造相关**：`Parameters<T>`（参数元组）/`ReturnType<T>`（返回类型）/`ConstructorParameters<T>`/`InstanceType<T>`。
- **异步**：`Awaited<T>` 递归解包 `Promise`，模拟 `await`。
- **字符串字面量**：`Uppercase`/`Lowercase`/`Capitalize`/`Uncapitalize`（内置字符串操作类型）。

## 一、泛型：参数化的类型

泛型让函数/类/类型在**保持类型关系**的前提下适配多种类型。经典的 `identity`：

```ts
function identity<T>(arg: T): T {
  return arg;
}
identity<string>("hi"); // 显式指定
identity("hi");         // 推断 T = string（更常用）
```

对比 `any`：`any` 会**丢掉**类型信息，泛型则把「入参类型 = 出参类型」这层关系**保留**下来。

## 二、泛型约束

裸类型参数 `T` 不能假设有任何成员。要访问成员，得用 `extends` **约束**它：

```ts
// ❌ T 不保证有 length
// function longest<T>(a: T, b: T) { return a.length >= b.length ? a : b; }

interface Lengthwise { length: number }
function longest<T extends Lengthwise>(a: T, b: T): T {
  return a.length >= b.length ? a : b; // ✅ 约束后可安全访问 length
}
longest([1, 2], [1, 2, 3]); // ✅ 数组有 length
longest(1, 2);              // ❌ number 无 length
```

### 用一个类型参数约束另一个

`keyof` 约束是最常见的进阶用法，实现**类型安全的按键取值**：

```ts
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
const user = { id: 1, name: "Ada" };
getProp(user, "name"); // ✅ 返回类型精确到 string
getProp(user, "age");  // ❌ "age" 不是 user 的键
```

## 三、泛型类、接口与默认参数

```ts
interface Box<T> { value: T }
class Stack<T> {
  private items: T[] = [];
  push(x: T) { this.items.push(x); }
  pop(): T | undefined { return this.items.pop(); }
}

// 默认类型参数：不传时用默认
type Container<T = string> = { value: T };
const c: Container = { value: "hi" }; // T 默认 string
```

**`const` 类型参数（TS 5.0）** 让实参像加了 `as const` 一样保留字面量类型，省去调用处手写 `as const`：

```ts
function asTuple<const T extends readonly unknown[]>(t: T): T { return t; }
const t = asTuple(["a", "b"]); // 类型 readonly ["a", "b"]，而非 string[]
```

## 四、泛型设计的经验法则

- **能推断就别显式写类型参数**——让调用处简洁。
- **别过度约束**：只约束「函数体真正需要」的成员，约束越少复用面越广。
- **把类型参数「下推」**：如果一个类型参数只在一处用到，考虑把它放到更内层，而不是让整个函数泛型化。
- **泛型优于 `any`**：`any` 丢类型、泛型保留类型关系。
- **一个类型参数至少用两次**：只出现一次的类型参数往往可以去掉（说明没建立起「关系」）。

## 五、常用工具类型全家桶

TS 内置了一批基于映射/条件类型实现的**工具类型**，覆盖日常绝大多数「类型变形」需求。

### 属性修饰变形

```ts
interface User { id: number; name: string; email?: string }

type A = Partial<User>;   // 全部可选：{ id?; name?; email? }
type B = Required<User>;  // 全部必填：email 也变必填
type C = Readonly<User>;  // 全部只读
```

- `Partial<T>` — 所有属性变可选（部分更新入参常用）
- `Required<T>` — 所有属性变必填
- `Readonly<T>` — 所有属性变只读

### 对象裁剪与构造

```ts
type PubUser = Pick<User, "id" | "name">;  // 只保留 id、name
type NoEmail = Omit<User, "email">;        // 排除 email
type Flags = Record<"a" | "b", boolean>;   // { a: boolean; b: boolean }
type Dict = Record<string, number>;        // 任意字符串键 → number
```

- `Pick<T, K>` — 从 T 中挑选键 K（白名单）
- `Omit<T, K>` — 从 T 中排除键 K（黑名单）
- `Record<K, V>` — 构造键为 K、值为 V 的对象类型

### 联合裁剪

```ts
type T1 = Exclude<"a" | "b" | "c", "a">; // "b" | "c"
type T2 = Extract<"a" | "b" | 1 | 2, string>; // "a" | "b"
type T3 = NonNullable<string | null | undefined>; // string
```

- `Exclude<U, M>` — 从联合 U 中剔除可赋给 M 的成员
- `Extract<U, M>` — 从联合 U 中提取可赋给 M 的成员
- `NonNullable<T>` — 去掉 `null` 与 `undefined`

### 函数与构造相关（基于 `infer`）

```ts
function make(id: number, name: string) { return { id, name }; }

type P = Parameters<typeof make>;  // [number, string]
type R = ReturnType<typeof make>;  // { id: number; name: string }

class Foo { constructor(public x: number) {} }
type CP = ConstructorParameters<typeof Foo>; // [number]
type IT = InstanceType<typeof Foo>;          // Foo
```

- `Parameters<T>` / `ConstructorParameters<T>` — 抽取（构造）参数元组
- `ReturnType<T>` — 抽取函数返回类型
- `InstanceType<T>` — 抽取构造函数的实例类型

### 异步与字符串

```ts
type W = Awaited<Promise<Promise<number>>>; // number（递归解包）

type U = Uppercase<"hello">;    // "HELLO"
type Cap = Capitalize<"hello">; // "Hello"
```

- `Awaited<T>` — 递归解包 `Promise`，模拟 `await` 的结果类型
- `Uppercase` / `Lowercase` / `Capitalize` / `Uncapitalize` — 字符串字面量的大小写变形

::: tip 工具类型是「读源码的好教材」
这些工具类型全部用 `keyof`/映射类型/条件类型/`infer` 实现（源码在 `lib.es5.d.ts`）。读懂 `Partial`（映射 + `?`）、`Exclude`（分布式条件类型）、`ReturnType`（`infer`），就掌握了下一页「类型体操」的核心机制。
:::

---

会用工具类型后，进入 [类型体操](./type-manipulation)：拆开这些工具类型背后的 `keyof`/`typeof`/索引访问/条件类型/映射类型/模板字面量类型，学会自己造类型。
