---
layout: doc
outline: [2, 3]
---

# 原始类型与包装对象

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 7 种原始类型：`string` / `number` / `bigint` / `boolean` / `undefined` / `symbol` / `null`，其余一切皆 `object`
- 原始值**不可变**、按**值**比较；对象**可变**、按**引用**比较
- `number` 是 IEEE 754 双精度浮点，整数小数共用；特殊值 `Infinity` / `-Infinity` / `NaN`
- 安全整数上限 `Number.MAX_SAFE_INTEGER`（2^53 − 1）；超出用 `bigint`（`123n`，ES2020）
- `bigint` 与 `number` **不能混算**，会抛 `TypeError`；需显式 `Number()` / `BigInt()` 转换
- `0.1 + 0.2 === 0.30000000000000004`：浮点精度问题，比较小数用容差或整数化
- `undefined`（未赋值）≠ `null`（手动空）；但 `null == undefined` 为 `true`
- `symbol` 唯一不可变，作对象属性键避免冲突；`Symbol.for()` 走全局注册表
- 包装对象：在原始值上访问 `.length` / `.toUpperCase()` 时引擎临时装箱为 `String` / `Number` / `Boolean`
- `typeof` 速记：`null` → `"object"`（历史 Bug），函数 → `"function"`，其余原始类型如实返回

## 原始类型 vs 对象

JavaScript 的所有值二分为两类：

- **原始类型（primitive）**：`string`、`number`、`bigint`、`boolean`、`undefined`、`symbol`、`null` 共 7 种。它们**不可变**（immutable）、按**值**比较。
- **对象（object）**：除上述 7 种之外的一切——普通对象 `{}`、数组 `[]`、函数、`Date`、`Map` 等。它们**可变**、按**引用**比较。

```js
// 原始值按值比较：值相同即相等
let a = "hi";
let b = "hi";
console.log(a === b); // true

// 对象按引用比较：内容相同但引用不同则不相等
let o1 = { x: 1 };
let o2 = { x: 1 };
console.log(o1 === o2); // false（两个不同对象）
console.log(o1 === o1); // true（同一引用）
```

「原始值不可变」指的是值本身改不了——字符串方法都返回**新字符串**，从不改原值：

```js
let s = "abc";
s.toUpperCase(); // 返回新串 "ABC"
console.log(s); // "abc"（原值没变）
s[0] = "X"; // 静默失败（严格模式下报错），字符串不可变
```

## 逐一拆解 7 种原始类型

### ① string —— 文本

单引号、双引号或反引号（模板字面量）包裹，三者存储上没区别，按需选用：

```js
const a = "双引号";
const b = "单引号";
const c = `反引号：支持 ${a} 插值，还能
跨多行`;
```

字符串不可变；常用属性 `.length`，常用方法 `slice` / `includes` / `replace` 等都返回新串。

### ② number —— 数字（整数小数共用）

JavaScript **只有一种**数字类型：IEEE 754 双精度 64 位浮点。整数和小数都是它：

```js
const int = 42;
const float = 3.14;
const sci = 1.5e3; // 1500（科学计数法）

// 进制字面量
const hex = 0xff; // 255（十六进制 0x）
const oct = 0o17; // 15（八进制 0o）
const bin = 0b1010; // 10（二进制 0b）

// 数字分隔符 _（ES2021，仅可读性，不影响值）
const million = 1_000_000; // 1000000
```

三个特殊值要记牢：

```js
console.log(1 / 0); // Infinity
console.log(-1 / 0); // -Infinity
console.log(0 / 0); // NaN（Not a Number）
console.log(Number("abc")); // NaN（转换失败）
```

::: warning 浮点精度与安全整数
浮点数无法精确表示所有小数，最经典的就是：

```js
console.log(0.1 + 0.2); // 0.30000000000000004
console.log(0.1 + 0.2 === 0.3); // false
```

比较小数应使用容差（`Math.abs(a - b) < Number.EPSILON`）或先放大成整数再算（如金额用「分」）。

整数也有安全范围——超过 `Number.MAX_SAFE_INTEGER`（即 2^53 − 1 = `9007199254740991`）后无法保证精确，这正是 `bigint` 的用武之地：

```js
console.log(9007199254740991 + 1); // 9007199254740992 ✅
console.log(9007199254740991 + 2); // 9007199254740992 ❌（应为 ...993）
```

:::

### ③ bigint —— 任意精度整数（ES2020）

整数字面量加 `n` 后缀即为 `bigint`，可表示超过安全整数范围的大整数：

```js
const big = 9007199254740993n;
console.log(big + 1n); // 9007199254740994n（精确）
const fromNum = BigInt(42); // 42n
```

关键限制：`bigint` 与 `number` **不能混合运算**，否则抛错；但**可以比较**：

```js
console.log(1n + 2n); // 3n ✅
console.log(1n + 1); // ❌ TypeError: Cannot mix BigInt and other types
console.log(2n > 1); // true ✅（比较允许）
console.log(2n === 2); // false（=== 看类型，类型不同）
console.log(2n == 2); // true（== 做数学比较）
```

### ④ boolean —— 真假

只有 `true` / `false` 两个值（小写），常由比较运算或 `Boolean()` 产生。

### ⑤ undefined —— 未赋值

变量声明了但没赋值、函数无返回值、访问对象不存在的属性，都得到 `undefined`：

```js
let x;
console.log(x); // undefined
console.log({}.foo); // undefined
console.log([].length === 0); // true，但 [].at(99) 是 undefined
```

### ⑥ symbol —— 唯一标识（ES2015）

每次 `Symbol()` 调用都产生一个**全局唯一**且不可变的值，常用作对象属性键以避免命名冲突：

```js
const id1 = Symbol("id");
const id2 = Symbol("id");
console.log(id1 === id2); // false（即便描述相同也不相等）

const user = { [id1]: 123 }; // 用作属性键
console.log(user[id1]); // 123

// Symbol.for 走全局注册表，相同 key 返回同一个 symbol
console.log(Symbol.for("app") === Symbol.for("app")); // true
```

### ⑦ null —— 手动表示「空」

`null` 是开发者主动赋的「这里没有值」，语义上区别于「忘了赋值」的 `undefined`：

```js
let selected = null; // 明确表示「当前没有选中项」
```

## null 与 undefined 的区别

| | `undefined` | `null` |
| --- | --- | --- |
| 含义 | 系统默认「未赋值」 | 开发者主动「置空」 |
| 来源 | 未初始化变量 / 缺失属性 / 无返回值 | 显式赋 `null` |
| `typeof` | `"undefined"` | `"object"`（历史 Bug） |
| `==` 互比 | `null == undefined` → `true` | 同左 |
| `===` 互比 | `null === undefined` → `false` | 同左 |

::: warning typeof null 的历史 Bug
`typeof null` 返回 `"object"` 而不是 `"null"`，源于 JavaScript 第一版的实现细节，因兼容性永远无法修复。**判断 `null` 必须用 `value === null`**，绝不能依赖 `typeof`：

```js
const v = null;
console.log(typeof v); // "object" —— 别被骗
console.log(v === null); // true —— 正确做法
```

:::

## typeof 速查

```js
typeof "hi"; // "string"
typeof 42; // "number"
typeof 42n; // "bigint"
typeof true; // "boolean"
typeof undefined; // "undefined"
typeof Symbol(); // "symbol"
typeof null; // "object" ← 历史 Bug
typeof {}; // "object"
typeof []; // "object" ← 数组也是 object，判断数组用 Array.isArray()
typeof function () {}; // "function" ← 函数是特殊的 object
```

## 包装对象与自动装箱

原始值没有属性和方法，但我们却能写 `"abc".toUpperCase()`、`(123).toFixed(2)`——这是因为引擎在访问时**临时把原始值装箱**成对应的包装对象（`String` / `Number` / `Boolean` / `Symbol` / `BigInt`），取完属性立即丢弃：

```js
const s = "hello";
console.log(s.length); // 5
// 引擎内部约等于：new String(s).length，用完即弃

console.log((255).toString(16)); // "ff"
console.log(true.toString()); // "true"
```

::: tip 不要手动 new 包装对象
显式 `new String("x")` / `new Number(1)` 会得到**对象**而非原始值，破坏 `typeof` 与 `===`，几乎只会带来 Bug：

```js
const a = "x";
const b = new String("x");
console.log(typeof a); // "string"
console.log(typeof b); // "object"
console.log(a === b); // false（一个原始值一个对象）
console.log(a == b); // true（== 把 b 拆箱回原始值再比）
```

需要转换时用**不带 `new`** 的 `String(x)` / `Number(x)` / `Boolean(x)`，它们返回原始值。

:::

## 小结

7 种原始类型按值比较、不可变；对象按引用比较、可变。记牢 `number` 的浮点精度与安全整数边界、`bigint` 不能与 `number` 混算、`undefined` 与 `null` 的语义分工，以及 `typeof null === "object"` 这个永恒的坑。这些值在运算时会被悄悄转换——下一页正式进入最容易出 Bug 的环节：[类型转换与相等比较](./type-conversion-equality)。
