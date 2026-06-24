---
layout: doc
outline: [2, 3]
---

# 类型转换与相等比较

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 三种显式转换：`String(x)` / `Number(x)` / `Boolean(x)`（不带 `new`，返回原始值）
- 加号特例：任一侧是字符串就**拼接**，`1 + "2"` → `"12"`；其余算术转数字，`"3" * 2` → `6`
- `+x` 等价 `Number(x)`；`!!x` 等价 `Boolean(x)`；`"" + x` 等价 `String(x)`
- `Number("")` → `0`、`Number(" ")` → `0`、`Number("12px")` → `NaN`、`Number(null)` → `0`、`Number(undefined)` → `NaN`
- falsy 共 8 个：`false` / `0` / `-0` / `0n` / `""` / `null` / `undefined` / `NaN`，**其余全 truthy**
- 四套相等：`==`（转换）/ `===`（不转换）/ `Object.is`（SameValue）/ SameValueZero（`includes`、`Set`、`Map`）
- 默认用 `===`；`NaN === NaN` → `false`，`+0 === -0` → `true`
- `Object.is`：`Object.is(NaN, NaN)` → `true`、`Object.is(+0, -0)` → `false`（仅这两点与 `===` 不同）
- 检测 `NaN`：用 `Number.isNaN(x)`（不转换），别用全局 `isNaN()`（会先转换，`isNaN("x")` 为 `true`）
- 必记反直觉：`null == undefined` → `true`、`"" == 0` → `true`、`[] == ![]` → `true`、`NaN != NaN`

## 显式类型转换

弱类型语言里，**显式转换永远优于依赖隐式转换**。三个全局函数（不带 `new`）是首选工具。

### 转字符串：String(x)

```js
String(42); // "42"
String(true); // "true"
String(null); // "null"
String(undefined); // "undefined"
String([1, 2]); // "1,2"（数组 join）
String({}); // "[object Object]"
```

`String(x)` 与 `x.toString()` 基本等价，但 `String` 能安全处理 `null` / `undefined`（后者会抛错）。

### 转数字：Number(x)

转换规则有不少边界，务必记牢空串与空白的结果：

```js
Number("42"); // 42
Number("3.14"); // 3.14
Number(""); // 0 ← 空串是 0，不是 NaN！
Number("  "); // 0 ← 纯空白也是 0
Number("12px"); // NaN ← 含非数字字符即失败
Number("0x1f"); // 31（识别十六进制前缀）
Number(true); // 1
Number(false); // 0
Number(null); // 0 ← 注意
Number(undefined); // NaN ← 注意，与 null 不同
Number([]); // 0（空数组）
Number([5]); // 5（单元素数组）
Number([1, 2]); // NaN（多元素）
```

`parseInt` / `parseFloat` 与 `Number` 不同——它们**容忍前缀**，从头解析到第一个非法字符为止：

```js
parseInt("12px", 10); // 12（Number 会得 NaN）
parseInt("0xFF", 16); // 255
parseInt("101", 2); // 5（按二进制解析）
parseFloat("3.14em"); // 3.14
parseInt("px12", 10); // NaN（开头就非法）
```

::: tip parseInt 一定带第二参数（radix）
省略基数时行为依赖输入，易出 Bug。**永远显式传 `radix`**：`parseInt(str, 10)` 才是稳妥的十进制解析。
:::

### 转布尔：Boolean(x)

按下面的 falsy 表判定，`!!x` 是常见简写：

```js
Boolean(1); // true
Boolean(0); // false
Boolean(""); // false
Boolean("0"); // true ← 非空字符串！容易栽
Boolean([]); // true ← 空数组是 truthy！
Boolean({}); // true ← 空对象也是 truthy！
!!"hello"; // true（!! 简写）
```

## truthy / falsy 全表

布尔上下文（`if`、`&&`、`||`、`!`、三元）里，只有这 **8 个 falsy 值**，**其余一切皆 truthy**：

| falsy 值 | 说明 |
| --- | --- |
| `false` | 布尔假 |
| `0` | 数字零 |
| `-0` | 负零 |
| `0n` | BigInt 零 |
| `""` | 空字符串（单 / 双引号 / 空模板都算） |
| `null` | 空 |
| `undefined` | 未定义 |
| `NaN` | 非数字 |

::: warning 最常踩的三个 truthy 陷阱
`"0"`（非空字符串）、`[]`（空数组）、`{}`（空对象）**都是 truthy**：

```js
if ("0") console.log("会执行"); // 非空字符串为真
if ([]) console.log("会执行"); // 空数组为真
if ({}) console.log("会执行"); // 空对象为真
```

判断数组「空不空」要用 `arr.length === 0`，不能直接 `if (!arr)`。

:::

## 隐式转换：运算时的自动转换

不显式转换时，运算符会按规则自动转换操作数。三条主线覆盖绝大多数场景。

### 加号 + 的双重身份

`+` 是唯一会「转字符串」的算术运算符：**只要任一侧是字符串，就执行拼接**；否则两侧转数字相加：

```js
1 + 2; // 3（都是数字 → 相加）
"1" + 2; // "12"（有字符串 → 拼接，2 被转成 "2"）
1 + "2"; // "12"（同上）
1 + 2 + "3"; // "33"（从左到右：1+2=3，再 3+"3"="33"）
"1" + 2 + 3; // "123"（左侧先拼成 "12"，再 "12"+3="123"）
1 + null; // 1（null → 0）
1 + undefined; // NaN（undefined → NaN）
"a" + true; // "atrue"
```

### 其余算术运算符：一律转数字

`-`、`*`、`/`、`%`、`**` 不碰字符串拼接，全部把操作数转成数字：

```js
"37" - 7; // 30
"37" * 2; // 74
"6" / "2"; // 3
"abc" - 1; // NaN（"abc" → NaN）
true * 3; // 3（true → 1）
```

### 一元 + 是最短的「转数字」

```js
+"42"; // 42
+""; // 0
+true; // 1
+null; // 0
+"3.14"; // 3.14
+"abc"; // NaN
```

## 四套相等算法

JavaScript 有**四种**判断「相等」的方式，行为各异：

| x | y | `==` | `===` | `Object.is` | SameValueZero |
| --- | --- | --- | --- | --- | --- |
| `NaN` | `NaN` | ❌ | ❌ | ✅ | ✅ |
| `+0` | `-0` | ✅ | ✅ | ❌ | ✅ |
| `null` | `undefined` | ✅ | ❌ | ❌ | ❌ |
| `0` | `false` | ✅ | ❌ | ❌ | ❌ |
| `"0"` | `0` | ✅ | ❌ | ❌ | ❌ |
| `new String("a")` | `"a"` | ✅ | ❌ | ❌ | ❌ |

### === 严格相等（默认用它）

不做任何类型转换，类型不同直接 `false`。结果可预测、也更快：

```js
1 === 1; // true
1 === "1"; // false（类型不同）
null === undefined; // false
NaN === NaN; // false ← 唯一让 x !== x 成立的情况
+0 === -0; // true ← === 不区分正负零
```

### == 宽松相等（尽量别用）

比较前先按一套复杂规则隐式转换，是无数「反直觉为真」的源头。核心规则：`null` 与 `undefined` 只与彼此（及自身）相等；布尔先转数字；字符串与数字比较时字符串转数字；对象转原始值：

```js
null == undefined; // true（特例：互相相等）
null == 0; // false（null 不会转成 0 去比）
"" == 0; // true（"" → 0）
"0" == 0; // true（"0" → 0）
false == 0; // true（false → 0）
false == ""; // true（都 → 0）
" \t\n" == 0; // true（空白串 → 0）
1 == true; // true（true → 1）
[] == 0; // true（[] → "" → 0）
[] == ![]; // true（见下方剖析）
```

::: warning `[] == ![]` 为什么是 true
这是 `==` 最著名的「鬼畜」案例，逐步拆解：

1. `![]` 先算——`[]` 是 truthy，取反得 `false`；
2. 于是变成 `[] == false`；
3. `==` 把布尔 `false` 转成数字 `0` → `[] == 0`；
4. `[]` 转原始值：先 `[].toString()` 得 `""`，再 `Number("")` 得 `0` → `0 == 0`；
5. 结果 `true`。

记不住没关系——**结论就是「别用 `==`」**，用 `===` 这类问题根本不存在。

:::

`==` 唯一值得用的场景：`x == null` 可同时判断 `null` 和 `undefined`（等价于 `x === null || x === undefined`），其余一律 `===`。

### Object.is —— SameValue（极少用）

与 `===` 几乎一样，**只在两处不同**：正确处理 `NaN`、区分 `±0`：

```js
Object.is(NaN, NaN); // true ←（=== 是 false）
Object.is(+0, -0); // false ←（=== 是 true）
Object.is(1, 1); // true
Object.is(1, "1"); // false
```

仅在元编程（如手写 `Array.includes` 语义、区分负零）时才需要它。

### SameValueZero —— 内置于 includes / Set / Map

像 `Object.is` 但**把 `+0` 和 `-0` 视为相等**，同时 `NaN` 等于 `NaN`。这正是为什么 `includes` 能找到 `NaN` 而 `indexOf`（用 `===`）找不到：

```js
[NaN].includes(NaN); // true（SameValueZero）
[NaN].indexOf(NaN); // -1（=== 下 NaN !== NaN）
new Set([NaN, NaN]).size; // 1（SameValueZero 去重）
```

## NaN 的检测

`NaN` 是唯一「不等于自身」的值，所以**不能**用 `=== NaN` 检测。两个工具要分清：

```js
Number.isNaN(NaN); // true ← 推荐：只对真正的 NaN 返回 true，不做转换
Number.isNaN("abc"); // false（"abc" 不是 NaN 这个值）

isNaN(NaN); // true
isNaN("abc"); // true ← 全局 isNaN 会先 Number("abc")=NaN，误判！
isNaN(""); // false（Number("")=0）
```

::: tip 一律用 Number.isNaN
全局 `isNaN()` 因为会先做类型转换，把一切「转不成数字」的值都判为 `NaN`，极易误报。**永远用 `Number.isNaN()`**（ES2015）。

:::

## 小结

显式转换用 `String` / `Number` / `Boolean`，牢记 `Number("")===0`、`Number(null)===0`、`Number(undefined)` 是 `NaN`；falsy 只有 8 个，`"0"` / `[]` / `{}` 都是真；相等默认 `===`，`==` 只在 `x == null` 时偶用；检测 `NaN` 用 `Number.isNaN`。把这页吃透，「玄学相等」就再也唬不住你了。下一页系统过一遍 [运算符全谱](./operators)。
