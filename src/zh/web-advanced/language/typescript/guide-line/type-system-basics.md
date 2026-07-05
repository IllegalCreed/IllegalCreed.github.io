---
layout: doc
outline: [2, 3]
---

# 类型系统基础：结构化类型、联合交叉、interface vs type

> 基于 TypeScript 6.0 · 核于 2026-07

## 速查

- **结构化类型（structural typing）**：兼容性按**形状/成员**判定，不看名称——具备目标要求的全部成员即兼容（鸭子类型）。对比 Java/C# 的**名义类型**（靠类名/`implements`）。
- **多余属性检查（freshness）**：把**新鲜的对象字面量**赋给带类型目标时，多出未声明属性会报错（专抓拼写）；先赋给变量再传则绕过。
- **字面量拓宽**：`let s = "a"` 推断为 `string`（拓宽）；`const s = "a"` 推断为 `"a"`（字面量）。用 `as const` 阻止拓宽。
- **联合 `A | B`**：值是其一，用前需**收窄**；**交叉 `A & B`**：同时满足，常用于**合并对象类型**；原始类型交叉多得 `never`。
- **字面量类型**：`'left' | 'right'`、`200 | 404`、`true`——把取值精确到具体值，比 `string`/`number` 精确、比 `enum` 轻量。
- **元组**：`[string, number]`、可选 `[number, number?]`、具名 `[x: number, y: number]`、剩余 `[string, ...number[]]`。
- **`readonly`**：`readonly x: number` / `readonly string[]` / `ReadonlyArray<T>`；仅编译期浅只读，非 `Object.freeze`。
- **`any`/`unknown`/`never`/`void`**：`any` 放行；`unknown` 顶层安全类型（先收窄）；`never` 底类型/空集（不可能的值）；`void` 无返回值。
- **`interface` vs `type`**：`interface` 可**声明合并**、`extends`，语义偏「对象形状」；`type` 能命名**联合/交叉/元组/原始/条件/映射**类型。选择见正文表。
- **`as const`**：值收窄为最窄只读字面量类型（属性 `readonly`、字面量不拓宽、数组变只读元组）。
- **`satisfies`（4.9）**：校验值满足某类型的**同时保留精确推断**，胜过 `as`（会拓宽/覆盖）和直接注解（会拓宽值）。

## 一、结构化类型：TS 类型系统的地基

TypeScript 采用**结构化类型系统**（俗称 duck typing）：判断类型 A 能否赋给类型 B，只看 **A 是否具备 B 要求的全部成员**，与「叫什么名字」「有没有显式声明实现关系」无关。

```ts
interface Point { x: number; y: number }

// 没有任何 implements Point 的声明
class Vec2 { x = 0; y = 0; z = 0 }

const p: Point = new Vec2(); // ✅ Vec2 有 x、y（多的 z 无妨），结构上兼容
```

这与 Java/C# 的**名义类型**（必须显式 `implements`/继承同名类型才兼容）相反。TS 选择结构化，是因为 JS 大量使用匿名对象、对象字面量、鸭子类型——按形状判定更自然。

### 多余属性检查（freshness）

结构化类型允许「成员更多」的值赋给「成员更少」的类型。但有个例外：把**全新的对象字面量**直接赋给带类型的目标时，TS 会额外做**多余属性检查**，多出未声明的属性会报错——这是为了抓住拼写错误：

```ts
interface Options { width: number }

const a: Options = { width: 10, widht: 20 }; // ❌ 多余属性 widht（拼错）被拦下

const raw = { width: 10, widht: 20 };
const b: Options = raw;                       // ✅ 先赋给变量，freshness 消失，不报错
```

## 二、字面量类型与「拓宽」

TS 会对 `let` 声明的字面量做**拓宽**（widening），对 `const` 保留字面量类型：

```ts
let s1 = "hello";    // 类型 string（拓宽）
const s2 = "hello";  // 类型 "hello"（字面量）
```

**字面量类型**把取值精确到具体值，配合联合极为常用：

```ts
type Align = "left" | "right" | "center"; // 只能是这三者之一
type Http = 200 | 404 | 500;
function setAlign(a: Align) {}
setAlign("middle"); // ❌ 不在联合里
```

对象字面量的属性默认会拓宽（`{ method: "GET" }` 里 `method` 是 `string`）。要保留字面量，用 `as const`（见第六节）。

## 三、联合类型与交叉类型

**联合类型 `A | B`**：值是「A 或 B」，使用前通常要**收窄**到具体分支（见[窄化页](./narrowing-and-inference)）：

```ts
function len(x: string | string[]) {
  return x.length; // string 和 string[] 都有 length，可直接用
}
```

**交叉类型 `A & B`**：值「同时是」A 和 B，最常见用途是**合并多个对象类型**：

```ts
type WithId = { id: number };
type WithName = { name: string };
type Entity = WithId & WithName; // { id: number; name: string }
```

::: tip 原始类型的交叉是 never
`string & number` 没有任何值能同时满足，结果是 `never`。交叉主要对**对象类型**有意义（合并成员），别拿它交叉原始类型。
:::

## 四、元组与只读

**元组**是定长、逐位置定类型的数组：

```ts
let pair: [string, number] = ["age", 18];
type RGBA = [number, number, number, number?]; // 可选元素
type Named = [x: number, y: number];           // 具名元组（仅提示，不影响类型）
type Rest = [string, ...number[]];             // 剩余元素
```

**`readonly`** 提供编译期浅只读——只锁属性/元素的**重新赋值**，不冻结运行时对象：

```ts
interface Config { readonly url: string }
const c: Config = { url: "/api" };
c.url = "/x"; // ❌ 只读属性不可重新赋值

const arr: readonly number[] = [1, 2, 3];
arr.push(4);  // ❌ 只读数组没有 push
```

## 五、any / unknown / never / void 的定位

| 类型 | 含义 | 用途 |
| --- | --- | --- |
| `any` | 关闭检查的逃生舱 | 尽量避免；开 `noImplicitAny` 拦隐式 any |
| `unknown` | 类型安全的**顶层类型**（一切的父） | 接收未知外部数据，使用前必须收窄 |
| `never` | **底类型**（空集，不可能的值） | 永远抛错/死循环的返回、穷尽检查 |
| `void` | 函数**无返回值**（返回 `undefined`） | 回调、无返回的函数 |

```ts
function fail(msg: string): never { throw new Error(msg); } // 返回不了
function log(msg: string): void { console.log(msg); }        // 无返回值
```

`unknown` 与 `any` 的核心区别：`unknown` **不能直接使用**，必须先收窄或断言；`any` 完全放行。安全起见，「不确定的类型」优先 `unknown`。

## 六、interface vs type：怎么选

两者都能描述对象形状，且很多时候可互换，但各有专长：

| 维度 | `interface` | `type` 别名 |
| --- | --- | --- |
| 对象形状 | ✅ 本职 | ✅ 可以 |
| 声明合并（同名自动合并/再打开） | ✅ 支持 | ❌ 同名报错 |
| 继承/扩展 | `extends`（可多继承） | 交叉 `&` |
| 联合类型 | ❌ 不能 | ✅ `A` \| `B` |
| 元组 / 原始别名 | ❌ | ✅ `type ID = string` |
| 条件 / 映射 / 模板字面量类型 | ❌ | ✅ |
| 性能（大量 extends 时） | 略优（有缓存） | 复杂交叉可能更慢 |

```ts
// interface：声明合并——给全局 Window 追加字段
interface Window { myApp: { version: string } }

// type：命名联合、交叉、条件类型
type Result<T> = { ok: true; data: T } | { ok: false; error: string };
```

**经验法则**：描述**对象/类的公开形状、需要被 `extends` 或声明合并**时用 `interface`；需要**联合、交叉、元组、条件/映射类型、给原始类型起名**时用 `type`。团队保持一致即可，不必教条。

## 七、as const 与 satisfies

**`as const`（const 断言）** 把值收窄为最窄的**只读字面量类型**：

```ts
const config = {
  method: "GET",
  retries: 3,
} as const;
// method: "GET"（不拓宽为 string）、retries: 3、且两者都 readonly

const routes = ["home", "about"] as const; // readonly ["home", "about"]
type Route = typeof routes[number];        // "home" | "about"
```

**`satisfies`（TS 4.9）** 解决「既想校验类型、又想保留精确推断」的两难。对比三种写法：

```ts
type Palette = Record<string, [number, number, number] | string>;

// ① 直接注解：类型被拓宽，取 red 时丢失「是元组」的信息
const p1: Palette = { red: [255, 0, 0], black: "#000" };
// p1.red 是 [number,number,number] | string，用 p1.red[0] 会报错

// ② as 断言：不安全，拼错也不报
// const p2 = { red: [255,0,0], bluu: "#00f" } as Palette; // bluu 拼错不拦

// ③ satisfies：既校验满足 Palette，又保留每个属性的精确类型 ✅
const p3 = { red: [255, 0, 0], black: "#000" } satisfies Palette;
p3.red[0];              // ✅ TS 知道 red 是元组
p3.black.toUpperCase(); // ✅ TS 知道 black 是 string
```

::: tip satisfies vs as
`as` 是「强行改类型视图」（可能拓宽、可能不安全）；`satisfies` 是「校验但不改变推断类型」。想约束结构又不牺牲精度，用 `satisfies`。
:::

---

结构打牢后，进入 [推断与窄化](./narrowing-and-inference)：TS 如何从上下文推断类型、以及用 `typeof`/`in`/类型谓词/可辨识联合把联合类型收窄到安全可用。
