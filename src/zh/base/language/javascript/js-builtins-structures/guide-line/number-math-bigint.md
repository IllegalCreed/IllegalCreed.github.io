---
layout: doc
outline: [2, 3]
---

# 数值、Math 与 BigInt

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 只有一种 `number`：IEEE 754 双精度浮点，整数小数共用；范围约 ±1.8×10³⁰⁸
- 浮点坑：`0.1 + 0.2 === 0.30000000000000004`，比较小数用 `Math.abs(a - b) < Number.EPSILON`
- 安全整数：`Number.MAX_SAFE_INTEGER` = 2⁵³−1 = `9007199254740991`，超出运算会丢精度
- 字面量：十进制 / `0x` 十六进制 / `0o` 八进制 / `0b` 二进制 / 指数 `1e3` / 数字分隔符 `1_000_000`
- 特殊值：`Infinity` / `-Infinity` / `NaN`；`NaN !== NaN`，判定用 `Number.isNaN`
- 判定优先静态法：`Number.isInteger` / `Number.isNaN` / `Number.isFinite` / `Number.isSafeInteger`（不做隐式转换）
- 解析：`Number(x)` 严格、`parseInt(x, 10)` 容忍后缀（**第二参基数必传**）、`parseFloat`
- 格式化：`toFixed(n)`（定点，返回字符串）/ `toPrecision(n)` / `toString(radix)`（2–36 进制）
- `Math`：`round`/`floor`/`ceil`/`trunc`/`abs`/`sign`/`pow`/`sqrt`/`cbrt`/`hypot`/`min`/`max`/`random`，常量 `PI`/`E`
- `BigInt`：字面量 `10n` 或 `BigInt(x)`；任意精度整数，不能与 `number` 混算、无 `Math`、除法截断

## 只有一种数字：IEEE 754 双精度

和很多语言不同，JavaScript 没有 `int` / `float` / `double` 之分——所有数字都是同一种 `number`，底层是 **IEEE 754 双精度 64 位浮点**。可表示约 ±1.8×10³⁰⁸ 范围内的值，精度为 53 位有效二进制位。

这条设计带来两个必须刻进肌肉记忆的事实：**小数运算有误差**、**大整数会丢精度**。

```js
typeof 42 === "number"; // true
typeof 3.14 === "number"; // true（整数小数同一种类型）
```

### 关键常量

```js
Number.MAX_SAFE_INTEGER; // 9007199254740991（2^53 - 1）
Number.MIN_SAFE_INTEGER; // -9007199254740991
Number.MAX_VALUE; // 1.7976931348623157e+308（最大正数）
Number.MIN_VALUE; // 5e-324（最小正数，注意不是最小负数）
Number.EPSILON; // 2.220446049250313e-16（1 与下一个可表示数之差）
Number.POSITIVE_INFINITY; // Infinity
Number.NEGATIVE_INFINITY; // -Infinity
Number.NaN; // NaN
```

## 浮点精度：`0.1 + 0.2` 的真相

这是 JavaScript 最著名的「坑」，但它不是 Bug，而是二进制浮点的固有限制——`0.1` 和 `0.2` 在二进制里都是无限循环小数，存进 64 位时被截断，相加后误差暴露：

```js
0.1 + 0.2; // 0.30000000000000004
0.1 + 0.2 === 0.3; // false（千万别这样比小数）
```

正确的小数相等判断是「差值小于一个极小阈值」：

```js
function nearlyEqual(a, b, epsilon = Number.EPSILON) {
  return Math.abs(a - b) < epsilon;
}
nearlyEqual(0.1 + 0.2, 0.3); // true
```

::: warning 金额运算永远不要用浮点
涉及钱的计算（价格、税、利率）绝不能直接用浮点数累加。常见做法是**以「分」为单位用整数运算**（`19.99` 元存成 `1999` 分），或使用 `BigInt` / 专用的十进制库（如 decimal.js）。
:::

## 数字字面量的五种写法

```js
// 进制前缀
const dec = 255; // 十进制
const hex = 0xff; // 十六进制 → 255
const oct = 0o755; // 八进制 → 493
const bin = 0b1010; // 二进制 → 10

// 指数计数法
const million = 1e6; // 1000000
const tiny = 1e-3; // 0.001

// 数字分隔符（ES2021）：下划线只为可读，不影响值
const big = 1_000_000_000; // 1000000000
const card = 0xff_ff_ff; // 也能用在进制字面量里
```

## 特殊值：`NaN` 与 `Infinity`

`NaN`（Not-a-Number）表示「无效的数值运算结果」，例如 `0/0`、`Number("abc")`、`Math.sqrt(-1)`。它最反直觉的特性是**不等于自身**：

```js
NaN === NaN; // false（唯一不等于自己的值）
Number.isNaN(NaN); // true（判定 NaN 的正确方式）
```

`Infinity` 来自除以 0 或超出 `MAX_VALUE` 的运算：

```js
1 / 0; // Infinity
-1 / 0; // -Infinity
Number.MAX_VALUE * 2; // Infinity
```

## 判定与解析：静态方法优先

ES2015 给 `Number` 加了一套**不做隐式转换**的静态判定法，比老的全局 `isNaN` / `isFinite` 更可靠：

```js
Number.isInteger(42); // true
Number.isInteger(42.5); // false
Number.isNaN(NaN); // true
Number.isFinite(Infinity); // false
Number.isSafeInteger(2 ** 53); // false（恰好越界）

// 老的全局版会先把参数转数字，容易误判：
isNaN("abc"); // true（"abc" 先转成 NaN）
Number.isNaN("abc"); // false（不转换，"abc" 本身不是 NaN）
```

解析字符串成数字有三条路，行为差别很大：

```js
Number("42px"); // NaN（严格，整串必须是合法数字）
parseInt("42px", 10); // 42（容忍后缀，从头解析到非数字停下）
parseFloat("3.14m"); // 3.14
```

::: warning `parseInt` 一定要传第二个参数
`parseInt("08")` 在历史上曾被当八进制解析。现代引擎已规范，但**始终显式传基数** `parseInt(str, 10)` 是最稳妥的习惯，避免任何歧义。
:::

## 数字格式化

```js
(1234.5678).toFixed(2); // "1234.57"（定点，四舍五入，返回字符串！）
(1234.5678).toPrecision(5); // "1234.6"（5 位有效数字）
(255).toString(16); // "ff"（转十六进制）
(255).toString(2); // "11111111"（转二进制）
(3.14).toExponential(2); // "3.14e+0"
```

注意 `toFixed` 返回的是**字符串**，参与后续运算前需转回数字。需要按地区习惯加千分位、货币符号时，用 `Intl.NumberFormat`（见 [Date 与 Temporal](./date-temporal) 的 `Intl` 概览）。

## `Math` 工具箱

`Math` 是一个**静态对象**（不能 `new Math()`），承载所有数学运算：

```js
// 取整四件套（区别在负数与方向）
Math.round(2.5); // 3（四舍五入，.5 向上）
Math.floor(-2.1); // -3（向下取整，往负无穷）
Math.ceil(-2.9); // -2（向上取整，往正无穷）
Math.trunc(-2.9); // -2（直接砍掉小数部分）

// 常用运算
Math.abs(-5); // 5
Math.sign(-3); // -1（返回 -1 / 0 / 1）
Math.pow(2, 10); // 1024（等价 2 ** 10）
Math.sqrt(144); // 12
Math.cbrt(27); // 3（立方根）
Math.hypot(3, 4); // 5（√(3²+4²)，求斜边/向量长度）
Math.min(3, 1, 2); // 1
Math.max(3, 1, 2); // 3
Math.random(); // [0, 1) 的随机小数

// 常量
Math.PI; // 3.141592653589793
Math.E; // 2.718281828459045
```

生成「`min` 到 `max` 之间的随机整数」是高频需求，记住这个公式：

```js
function randInt(min, max) {
  // 含 min 含 max
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
```

::: tip `Math.round` 与负数
`Math.round(-2.5)` 结果是 `-2` 而非 `-3`——因为它的规则是「向最接近的整数取整，恰好 .5 时向正无穷方向」。需要「远离 0」的取整要自己处理符号。
:::

## `BigInt`：突破安全整数

当整数超过 `Number.MAX_SAFE_INTEGER`（2⁵³−1）时，`number` 会丢精度。`BigInt`（ES2020）提供**任意精度整数**：

```js
// 两种创建方式
const a = 9007199254740993n; // 字面量：末尾加 n
const b = BigInt("9007199254740993"); // 构造器（传字符串防中间精度丢失）

// 对比：普通 number 已经算错
9007199254740993 === 9007199254740992; // true（精度不够，两者无法区分！）
9007199254740993n === 9007199254740992n; // false（BigInt 精确）
```

### `BigInt` 的四条铁律

```js
// 1. 不能与 number 混合运算（会抛 TypeError）
1n + 1; // TypeError: Cannot mix BigInt and other types
1n + 1n; // 2n（同类型才行）
Number(1n) + 1; // 2（需显式转换其中一方）

// 2. 没有 Math 支持
Math.sqrt(16n); // TypeError

// 3. 除法直接截断（无小数）
5n / 2n; // 2n（不是 2.5n）

// 4. 比较时 == 可跨类型，=== 不行
1n == 1; // true（宽松相等会转换）
1n === 1; // false（严格相等看类型，bigint ≠ number）
```

`BigInt` 适合大整数 ID（如雪花算法、数据库 64 位主键）、密码学、超大阶乘等场景；**不适合**需要小数的金额（那是 `Number` 取整或十进制库的领域）。`typeof 1n === "bigint"`。

## 小结

JavaScript 的数字世界由三件事构成：唯一的 `number` 类型（IEEE 754，带浮点与安全整数两个坑）、静态工具对象 `Math`、以及任意精度的 `BigInt`。记牢「小数别用 `===` 比、大整数用 `BigInt`、判定用 `Number.isXxx`」三条，就避开了九成数值 Bug。下一页进入文本世界：[字符串与模板字面量](./string-template)。
