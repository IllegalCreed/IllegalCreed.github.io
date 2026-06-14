---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇带你从「为什么需要 decimal.js」到「会用基础 API」。版本基线 **decimal.js 10.x**（本地实测 10.6.0）。对比对象：同作者的 **big.js**（最精简）、**bignumber.js**（居中、支持多进制）。

## 速查

- 安装：`npm i decimal.js`（或 `pnpm add decimal.js` / `yarn add decimal.js`）
- 导入：`import Decimal from 'decimal.js'`（ESM）或 `const Decimal = require('decimal.js')`（CJS）
- 构造：`new Decimal('0.1')`（**优先用字符串**，从源头避免浮点误差）
- 四则：`a.plus(b)` / `a.minus(b)` / `a.times(b)` / `a.dividedBy(b)`（别名 `add/sub/mul/div`）
- 比较：`a.equals(b)` / `a.comparedTo(b)`（返回 `-1/0/1/NaN`）/ `a.greaterThan(b)` …
- 输出：`toFixed(2)`（定点字符串，补尾随零）/ `toString()`（去尾随零）/ `toNumber()`（回 number）
- 全局配置：`Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_EVEN })`
- ⚠️ `precision` 是**有效数字**位数（默认 **20**），**不是小数位**
- ⚠️ 实例**不可变**：`a.plus(1)` 不改 `a`，要接收返回值
- ⚠️ 别用 `+`/`===`：对 Decimal 对象会退回浮点 / 比较引用

## 一、为什么需要 decimal.js

JavaScript 的 `number` 是 IEEE 754 双精度浮点数，无法精确表示大多数十进制小数：

```js
0.1 + 0.2 === 0.3          // false
0.1 + 0.2                  // 0.30000000000000004
(0.1).toFixed(20)          // '0.10000000000000000555'（原生 toFixed 也暴露误差）
```

在金额、计费、汇率等场景，这种误差会逐步累积成肉眼可见的错账。decimal.js 用**任意精度十进制**表示数值，从根上消除该问题：

```js
import Decimal from 'decimal.js'

new Decimal(0.1).plus(0.2).toString()   // '0.3'
new Decimal(0.1).plus(0.2).equals(0.3)  // true
```

## 二、构造一个 Decimal

构造函数接受 **number、string、另一个 Decimal**；字符串还支持指数记法与进制前缀（`0x` 十六进制、`0o` 八进制、`0b` 二进制）：

```js
new Decimal(123.45)        // 由 number 构造
new Decimal('123.45')      // 由字符串构造（推荐）
new Decimal('1.2e3')       // 指数记法 → 1200
new Decimal('0xff')        // 十六进制 → 255
new Decimal(otherDecimal)  // 克隆另一个 Decimal
```

::: tip 为什么优先用字符串
传 number 时，字面量本身已是有误差的浮点数。对常见短小数 decimal.js 会按其「显示值」解析（结果通常正确），但对超过 15~17 位有效数字的值可能出意外。**用字符串构造能 100% 杜绝源头误差**，是处理高精度数值的推荐姿势。
:::

## 三、四则运算

四则方法及其别名：

```js
const a = new Decimal('0.1')
const b = new Decimal('0.2')

a.plus(b).toString()       // '0.3'   （别名 add）
a.minus(b).toString()      // '-0.1'  （别名 sub）
a.times(b).toString()      // '0.02'  （别名 mul）
a.dividedBy(b).toString()  // '0.5'   （别名 div）
new Decimal(7).mod(3).toString()  // '1'  取余
new Decimal(2).pow(10).toString() // '1024' 幂
```

注意 `dividedBy` 是**真正的除法**：`new Decimal(7).dividedBy(2)` 得 `3.5`（不是整数除法）。

## 四、不可变性与链式调用

所有运算返回**新的 Decimal**，原实例不变：

```js
const a = new Decimal('1.5')
const b = a.plus(1)
a.toString()   // '1.5'（未变）
b.toString()   // '2.5'

// 因为每步返回新实例，可链式调用：
new Decimal(2).times('999.999999999999999').dividedBy(4).ceil().toString()
```

::: warning 不要用算术运算符
Decimal 是对象，`a + b`、`a === b` 不会做十进制运算 / 数值比较（会经 `valueOf` 退回浮点、或比较引用）。**加减乘除一律用方法，比较用 `equals` / `comparedTo`。**
:::

## 五、比较

```js
const x = new Decimal('0.1')
x.equals('0.1')          // true（别名 eq）
x.comparedTo('0.3')      // -1（小于；大于 1、相等 0、含 NaN 则 NaN）
x.greaterThan('0.05')    // true（别名 gt；另有 gte/lt/lte）
x.isZero()               // false（另有 isNaN/isFinite/isInteger/isNegative）
```

## 六、输出与格式化

```js
const m = new Decimal('12345.6789')
m.toFixed(2)             // '12345.68'（定点字符串，按 rounding 舍入，补尾随零）
m.toString()            // '12345.6789'（去尾随零）
m.toNumber()            // 12345.6789（回原生 number，仅最终需要时用）
m.toDecimalPlaces(2).toString()      // '12345.68'（toDP：按小数位，返回 Decimal）
m.toSignificantDigits(3).toString()  // '12300'（toSD：按有效数字，返回 Decimal）

new Decimal('1.20').toString()   // '1.2'   （内部去尾随零）
new Decimal('1.20').toFixed(2)   // '1.20'  （toFixed 补尾随零）
```

::: tip 金额展示用 toFixed
要「固定两位小数」必须用 `toFixed(2)`（或 `toExponential`/`toPrecision`），因为 `toString()` 会去掉尾随零（`1.2` 而非 `1.20`）。
:::

## 七、全局配置（精度与舍入）

```js
Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_EVEN })
Decimal.precision   // 30（有效数字位数）
Decimal.rounding    // 6（ROUND_HALF_EVEN）
```

::: warning precision 是有效数字，不是小数位
这是最容易踩的坑。`precision` 控制结果保留的**有效数字**位数：

```js
Decimal.set({ precision: 5 })
new Decimal(1).dividedBy(3).toString()     // '0.33333'
new Decimal(1000).dividedBy(3).toString()  // '333.33'（5 位有效数字，仅 2 位小数！）
```
:::

---

掌握基础后，进入 [指南 · 基础](./guide-line/base)：精度与舍入模式、十进制误差原理、与 big.js / bignumber.js 的差异。
