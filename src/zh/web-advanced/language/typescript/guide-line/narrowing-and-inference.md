---
layout: doc
outline: [2, 3]
---

# 类型推断与窄化：让联合类型安全可用

> 基于 TypeScript 6.0 · 核于 2026-07

## 速查

- **类型推断**：变量从初始值推断、函数返回从 `return` 推断、回调参数从**上下文类型**（contextual typing）推断（`arr.map(s => ...)` 里 `s` 自动是元素类型）。
- **窄化（narrowing）**：TS 的**控制流分析**跟踪判断语句，在分支内把联合类型缩小到更精确的类型。
- **`typeof` 守卫**：返回 `'string'`/`'number'`/`'bigint'`/`'boolean'`/`'symbol'`/`'undefined'`/`'object'`/`'function'`。⚠️ **`typeof null === 'object'`**（历史坑）。
- **真值窄化**：`if (x)` 排除 `0`/`''`/`0n`/`NaN`/`null`/`undefined`；判空常用 `if (x != null)`（同时排 null 与 undefined）。
- **相等窄化**：`===`/`!==` 让两侧类型收敛；`x != null` 一次排除 null + undefined。
- **`in` 守卫**：`'swim' in animal` 按属性是否存在收窄。
- **`instanceof` 守卫**：按原型链收窄（对 `class`/内置构造函数有效）。
- **类型谓词**：`function isFish(p): p is Fish` —— 返回 `true` 时把实参收窄为 `Fish`，可复用的自定义守卫。
- **断言函数**：`function assert(c): asserts c` / `assertIsString(x): asserts x is string`，通过后**后续代码**里类型被收窄。
- **可辨识联合**：每个成员带同名**字面量判别属性**（`kind: 'a' | 'b'`），按它 `switch` 收窄——建模「多形态之一」的最佳实践。
- **穷尽检查**：`switch` 的 `default` 里 `const _c: never = shape`，新增成员漏处理时**编译报错**。

## 一、类型推断：少写注解的底气

TS 在多数场景能自动推断类型，无需手写：

```ts
let n = 42;                 // number
const s = "hi";             // "hi"（const 保留字面量）
const nums = [1, 2, 3];     // number[]
const mixed = [1, "a"];     // (number | string)[]（最佳通用类型）
```

### 上下文类型（contextual typing）

当函数出现在「已知类型的位置」（如作为回调传入），其参数类型能**从上下文反向推断**：

```ts
const names = ["Ada", "Alan"];
names.forEach((name) => {
  console.log(name.toUpperCase()); // name 自动推断为 string，无需注解
});

window.addEventListener("click", (e) => {
  // e 自动推断为 MouseEvent
});
```

这是「能推断就别注解」的底气——过度注解回调参数反而多余。

## 二、窄化：控制流分析

**窄化（narrowing）** 指 TS 根据判断语句，在特定分支内把变量的类型「缩小」到更精确的类型。驱动它的是**控制流分析**：TS 会跟踪代码执行路径，推断每个位置变量的当前类型。

```ts
function padLeft(padding: number | string, input: string): string {
  if (typeof padding === "number") {
    return " ".repeat(padding) + input; // 这里 padding: number
  }
  return padding + input;               // 这里 padding: string（已排除 number）
}
```

## 三、各种类型守卫

### typeof 守卫（注意 null 坑）

```ts
function f(x: string | number | null) {
  if (typeof x === "number") return x.toFixed(2);
  if (typeof x === "string") return x.trim();
  // x 是 null
}
```

::: warning typeof null === "object"
JS 历史遗留：`typeof null` 返回 `"object"` 而非 `"null"`。所以 `if (typeof x === "object")` 分支里 `x` 可能是 `null`，判空要用 `x != null` 或单独 `x === null` 分支。
:::

### 真值与相等窄化

```ts
function g(x?: string | null) {
  if (x) x.trim();          // 真值窄化：排除 undefined/null/""（注意空串也被排除）
  if (x != null) x.trim();  // 相等窄化：一次排除 null 与 undefined（保留空串）
}
```

### in 与 instanceof 守卫

```ts
type Fish = { swim: () => void };
type Bird = { fly: () => void };
function move(animal: Fish | Bird) {
  if ("swim" in animal) return animal.swim(); // in：按属性存在收窄为 Fish
  return animal.fly();                          // 否则 Bird
}

function h(x: Date | string) {
  if (x instanceof Date) return x.toISOString(); // instanceof：按原型链收窄
  return x.toUpperCase();
}
```

## 四、类型谓词：可复用的自定义守卫

当判断逻辑复杂或需复用时，把它封进返回**类型谓词**（`参数 is 类型`）的函数：

```ts
type Fish = { swim: () => void };
type Bird = { fly: () => void };

function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined;
}

function feed(pet: Fish | Bird) {
  if (isFish(pet)) pet.swim(); // pet 收窄为 Fish
  else pet.fly();              // pet 收窄为 Bird
}
```

::: warning 谓词的正确性由你负责
`pet is Fish` 是「承诺」——TS 会信任你的返回值。若函数体逻辑写错（明明是 Bird 却返回 true），TS 不会拦，收窄结果就是错的。谓词内的判断务必与谓词一致。
:::

**断言函数**是另一种形态：通过则「此后」都收窄，不通过则抛错：

```ts
function assertIsString(val: unknown): asserts val is string {
  if (typeof val !== "string") throw new Error("Not a string");
}
function use(x: unknown) {
  assertIsString(x);
  x.toUpperCase(); // 此后 x 被收窄为 string
}
```

## 五、可辨识联合：建模「多形态之一」

给联合的每个成员加一个**同名、字面量类型的判别属性**（约定俗成叫 `kind`/`type`/`tag`），就能用 `switch`/`if` 精确收窄。这是 TS 建模「一个值有多种形态」的**最佳实践**：

```ts
interface Circle { kind: "circle"; radius: number }
interface Square { kind: "square"; side: number }
interface Rect   { kind: "rect"; width: number; height: number }
type Shape = Circle | Square | Rect;

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle": return Math.PI * shape.radius ** 2; // shape: Circle
    case "square": return shape.side ** 2;             // shape: Square
    case "rect":   return shape.width * shape.height;  // shape: Rect
  }
}
```

## 六、never 与穷尽性检查

配合可辨识联合，用 `never` 做**穷尽检查**：在 `default` 分支把已被穷尽的值赋给 `never`。若日后往 `Shape` 新增了成员却忘了加 `case`，剩余类型不再是 `never`，**编译报错**，逼你补全：

```ts
function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle": return Math.PI * shape.radius ** 2;
    case "square": return shape.side ** 2;
    case "rect":   return shape.width * shape.height;
    default:
      const _exhaustive: never = shape; // 若有未处理成员，此处报错
      return _exhaustive;
  }
}
```

这把「漏处理某种情况」从运行时崩溃提前到编译期红线，是 TS 最有价值的工程范式之一。

---

推断与窄化让联合类型安全可用后，进入 [泛型与工具类型](./generics-and-utility-types)：用泛型写复用的类型安全代码，用内置工具类型快速裁剪、变形已有类型。
