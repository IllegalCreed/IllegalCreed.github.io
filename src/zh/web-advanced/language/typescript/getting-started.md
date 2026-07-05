---
layout: doc
outline: [2, 3]
---

# 入门：定位、类型注解与三个心智

> 基于 TypeScript 6.0 · 核于 2026-07

## 速查

- **定位**：TypeScript = **JavaScript 超集 + 静态类型系统 + 编译期检查**。任何合法 JS 都是合法 TS；类型只在编译期存在。
- **心智一·超集**：`.js` 可直接当 `.ts` 用，TS 只在语法上做「加法」（类型注解），不改 JS 语义。
- **心智二·类型擦除**：类型注解 / `interface` / `type` 编译后**全部删除**，产物是普通 JS，运行时**拿不到**类型信息 → 运行时校验要另用 Zod 等库。
- **心智三·类型推断**：大多数变量**无需注解**，TS 从初始值自动推断；注解主要用在函数参数、公共 API、想固定类型处。
- **变量注解**：`let count: number = 1`（标识符后 `: 类型`）。
- **原始类型用小写**：`string` / `number` / `boolean` / `bigint` / `symbol` / `null` / `undefined`；大写 `String` 是包装对象，别用。
- **数组两写法**：`number[]` 与 `Array<number>` 等价；`[string, number]` 是**元组**（定长、逐位置定类型）。
- **函数注解**：`function greet(name: string): string {}`；异步返回 `Promise<T>`；返回类型常可省略（推断）。
- **对象类型**：`{ x: number; y: number }`；可选属性用 `last?: string`（类型含 `undefined`）；只读用 `readonly`。
- **联合类型**：`number | string`（「或」）；**交叉类型** `A & B`（「与」，合并对象）。
- **`any` vs `unknown`**：`any` 关闭检查（逃生舱，慎用）；`unknown` 安全，使用前必须先收窄/断言。
- **断言**：`value as string` 只改编译期类型视图、**无运行时效果**；非空断言 `x!` 断言非空、同样无运行时检查。
- **编译**：`tsc` 把 TS 转成 JS + 做类型检查；**编译器 CLI 细节见**「前端基础工具链 · 编译器」单独一叶，本页只讲语言本身。
- **进阶顺序**：本页 → [类型系统基础](./guide-line/type-system-basics) → [推断与窄化](./guide-line/narrowing-and-inference) → [泛型与工具类型](./guide-line/generics-and-utility-types) → [类型体操](./guide-line/type-manipulation) → [配置·模块·互操作](./guide-line/config-modules-interop) → [参考](./reference)。

## 一、TypeScript 是什么：超集 + 静态类型

TypeScript 由微软推出，核心是给 JavaScript 加一层**可选的、编译期的静态类型系统**。它不是新语言，而是 JS 的**超集**——这意味着：

> **任何合法的 JavaScript 代码，都是合法的 TypeScript 代码。**

把一个 `.js` 文件改名为 `.ts`，在不开严格检查时通常直接就能编译。TS 只是在 JS 语法之上「叠加」了类型注解与类型检查能力，语义完全遵循 JS。

它解决的痛点是：JS 是动态类型语言，很多错误（拼错属性名、传错参数类型、忘记判空）只有到运行时才暴露。TS 让**类型检查器**在代码运行前就把这些问题指出来，规模越大的工程收益越明显。

当前稳定版是 **TypeScript 6.0**（`npm i -D typescript` 装到的 `latest` 为 6.0.3）。6.0 是迈向 7.0（原生 Go 重写、并行类型检查）的**过渡版本**，升级了一批默认配置——详见[配置·模块·互操作](./guide-line/config-modules-interop)一页。

## 二、三个必须建立的心智

### 心智一：TS 是 JS 的超集（加法，不是替换）

TS 在 JS 上只做「加法」。下面这段既是合法 JS 也是合法 TS，加上注解后类型更明确：

```ts
// 合法 JS，也是合法 TS
function add(a, b) {
  return a + b;
}

// 加上类型注解（TS）——语义不变，只是多了编译期约束
function addTyped(a: number, b: number): number {
  return a + b;
}
```

### 心智二：类型会被「擦除」（type erasure）

这是最重要、最容易忽略的一点。TS 的类型是**编译期概念**——`tsc` 编译后，所有类型注解、`interface`、`type` 别名都会被**删除**，输出的是干净的 JS：

```ts
interface User { id: number; name: string }
const u: User = { id: 1, name: "Ada" };
```

编译后大致等价于：

```js
const u = { id: 1, name: "Ada" }; // interface User 与 : User 全部消失
```

::: warning 类型 ≠ 运行时保证
因为类型被擦除，**运行时拿不到任何类型信息**。你无法在运行时「问」一个值是不是 `User`。校验接口响应、表单输入等外部数据，必须用 `typeof`/`instanceof` 或 **Zod / Valibot** 这类运行时校验库——TS 类型只保编译期，不保运行时。
:::

### 心智三：能推断的就别注解

TS 有强大的**类型推断**，绝大多数局部变量无需手写类型：

```ts
let count = 1;          // 推断为 number
const name = "Ada";     // 推断为字面量 "Ada"
const nums = [1, 2, 3]; // 推断为 number[]
```

显式注解主要用在三处：**函数参数**（推断不出）、**公共 API 边界**（文档化 + 防漂移）、**想把类型固定/收窄**时。过度注解反而啰嗦。

## 三、基础类型注解速览

```ts
// 原始类型（一律小写）
let s: string = "hi";
let n: number = 42;
let b: boolean = true;

// 数组：两种等价写法
let a1: number[] = [1, 2, 3];
let a2: Array<number> = [1, 2, 3];

// 元组：定长、逐位置定类型（如 useState 的返回值）
let pair: [string, number] = ["age", 18];

// 对象类型：可选属性 ?、只读 readonly
function printName(o: { first: string; last?: string; readonly id: number }) {
  console.log(o.first, o.last?.toUpperCase()); // 可选链避免访问 undefined
}

// 联合类型：值可为其一，用前需收窄
function printId(id: number | string) {
  if (typeof id === "string") console.log(id.toUpperCase());
  else console.log(id);
}
```

## 四、`any` / `unknown` 与两种断言

`any` 会**关闭**对该值的类型检查，是「逃生舱」，能不用就不用；需要「类型未知但安全」时用 `unknown`——它逼你在使用前先收窄：

```ts
let x: any = "anything";
x.foo.bar();          // any：不报错（危险）

let y: unknown = getData();
// y.trim();          // ❌ 报错：unknown 使用前必须收窄
if (typeof y === "string") y.trim(); // ✅ 收窄后安全
```

两种断言都**没有运行时效果**，只改变编译期的类型视图：

```ts
const el = document.getElementById("app") as HTMLInputElement; // 类型断言
function f(x?: string) {
  x!.trim(); // 非空断言：断言 x 不为 null/undefined（断错了运行时照样崩）
}
```

::: tip 断言是「我比编译器更清楚」的承诺
`as` 与 `!` 都只是让编译器闭嘴，不做任何转换或校验。断错了不会在断言处报错，而是在真正使用时才崩。跨度过大的断言（如 `string as number`）TS 会要求先 `as unknown` 中转。想「校验 + 保留精确类型」应优先用 `satisfies`（见下一页）。
:::

## 五、编译：从 TS 到 JS

TypeScript 靠编译器 `tsc`（或 Vite/esbuild/SWC/tsx 等更快的转译器）把 `.ts` 转成 `.js`，同时做类型检查。最小起步：

```bash
npm i -D typescript
npx tsc --init   # 生成 tsconfig.json（6.0 起是精简、现代默认的版本）
npx tsc          # 按 tsconfig 编译并类型检查
```

::: info 编译器 CLI 是另一叶
`tsc` 的命令行参数、`--watch`、增量编译、`--build` 项目引用等**编译器工具链细节**属于「前端基础工具链 · 编译器」单独一叶，本叶聚焦**语言本身**（类型系统、语法、语义），编译器命令不在此重复展开。
:::

---

打好地基后，进入 [类型系统基础](./guide-line/type-system-basics)：结构化类型、联合/交叉/字面量、`interface` vs `type`、`as const` 与 `satisfies` 等语言核心。
