---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **decimal.js 10.x**。本篇把「会用 API」深化到「懂精度与舍入」：浮点误差的本质、`precision`（有效数字）与 `rounding`（舍入模式）、NaN / Infinity 处理，并理清与 **big.js / bignumber.js** 的核心差异。

## 一、浮点误差的本质

`number` 是 IEEE 754 双精度二进制浮点。`0.1`、`0.2`、`0.3` 这些十进制小数在二进制下是**无限循环**的，只能近似存储，于是：

```js
0.1 + 0.2        // 0.30000000000000004
0.3 - 0.2        // 0.09999999999999998
0.1 * 3          // 0.30000000000000004
```

decimal.js 用**十进制**表示（内部是「符号 `s` + 指数 `e` + 数字数组 `d`」三元组），各十进制小数都能精确表示，运算严格按十进制规则进行，因此没有这类「二进制尾巴」。

## 二、precision：有效数字，不是小数位

这是 decimal.js 与多数人直觉**最不同**的设定。`precision`（默认 **20**）是结果保留的**有效数字（significant digits）位数**，且 decimal.js 会把**所有计算**都舍入到该精度。

```js
Decimal.set({ precision: 5 })
new Decimal(1).dividedBy(3).toString()     // '0.33333'  （5 位有效数字）
new Decimal(1000).dividedBy(3).toString()  // '333.33'   （整数占 3 位，小数仅剩 2 位）
new Decimal(1).dividedBy(7).toString()     // '0.14286'
Decimal.set({ precision: 20 })             // 恢复默认
```

对比「小数位」语义（`toFixed` / `toDP` 的参数）：

| 概念 | 含义 | 谁用它 |
|---|---|---|
| `precision` | 有效数字总位数 | decimal.js 全局精度 / `toSD` / `toPrecision` |
| 小数位（dp） | 小数点后位数 | `toFixed(dp)` / `toDecimalPlaces(dp)` |

::: tip 加减乘是否受 precision 限制
加、减、乘在 decimal.js 中也会按 `precision` 舍入，但只要结果有效数字未超过 `precision` 就不会损失。除法、`sqrt`、非整数 `pow` 等可能产生无限位的运算，才是 `precision` 真正「截断」的高发区。
:::

## 三、rounding：9 种舍入模式

`rounding`（默认 **4 = ROUND_HALF_UP**）决定舍入方向。全部模式是构造函数上的常量：

| 常量 | 值 | 行为 |
|---|---|---|
| `ROUND_UP` | 0 | 远离零（任何非零余数都进位） |
| `ROUND_DOWN` | 1 | 趋向零（截断） |
| `ROUND_CEIL` | 2 | 趋向 +∞ |
| `ROUND_FLOOR` | 3 | 趋向 -∞ |
| `ROUND_HALF_UP` | 4 | 四舍五入，平局远离零（**默认**） |
| `ROUND_HALF_DOWN` | 5 | 四舍五入，平局趋向零 |
| `ROUND_HALF_EVEN` | 6 | 四舍五入，平局取偶（**银行家舍入**） |
| `ROUND_HALF_CEIL` | 7 | 四舍五入，平局趋向 +∞ |
| `ROUND_HALF_FLOOR` | 8 | 四舍五入，平局趋向 -∞ |

```js
new Decimal('2.5').toDP(0, Decimal.ROUND_HALF_UP).toString()    // '3'
new Decimal('2.5').toDP(0, Decimal.ROUND_HALF_EVEN).toString()  // '2'（取偶）
new Decimal('3.5').toDP(0, Decimal.ROUND_HALF_EVEN).toString()  // '4'（取偶）
```

::: tip 金融为何偏好银行家舍入
普通四舍五入「逢五就进」会系统性偏高；`ROUND_HALF_EVEN`（银行家舍入）在恰好 `.5` 时取最近的偶数，长期统计上抵消偏差。许多会计 / 计费系统默认用它。
:::

舍入模式可在三处生效：① 全局 `Decimal.set({ rounding })`；② 大多数输出 / 舍入方法的最后一个参数（如 `toFixed(2, Decimal.ROUND_DOWN)`、`toDP(2, rm)`）；后者优先于全局。

## 四、NaN 与 Infinity

decimal.js **支持** NaN / Infinity，与 JS 数值语义一致，不抛异常：

```js
new Decimal(1).dividedBy(0).toString()  // 'Infinity'
new Decimal(-1).dividedBy(0).toString() // '-Infinity'
new Decimal(0).dividedBy(0).isNaN()     // true
new Decimal(NaN).isNaN()                // true
new Decimal(Infinity).isFinite()        // false
```

用专门的判定方法检查，**不要**用全局 `isNaN()` 或 `===`：

```js
d.isNaN()        // 是否 NaN
d.isFinite()     // 是否有限
d.isInteger()    // 是否整数（别名 isInt）
d.isZero()       // 是否零
d.isNegative()   // 是否负（别名 isNeg；另有 isPositive/isPos）
```

## 五、与 big.js / bignumber.js 的核心差异

三库同出 Michael Mclaughlin、实例都不可变、API 风格高度相似，但定位不同：

| 维度 | **big.js** | **bignumber.js** | **decimal.js** |
|---|---|---|---|
| 体积 / API | 最小最精简 | 居中 | 最全、最大 |
| 精度语义 | 小数位 `Big.DP`（仅约束除法等） | 小数位 `DECIMAL_PLACES` | **有效数字** `precision`（约束所有运算） |
| 默认精度 | `DP=20` | `DECIMAL_PLACES=20` | `precision=20` |
| 默认舍入 | `RM=1`（roundHalfUp） | `ROUNDING_MODE=4` | `rounding=4` |
| NaN / Infinity | **不支持**（除零抛错） | 支持 | 支持 |
| 多进制 I/O | **不支持** | 支持（任意 2~36 进制） | 支持（`0x/0o/0b` + `toHex` 等） |
| 三角 / 对数 / exp | 无 | 无 | **有** |
| 非整数幂 | 不支持 | 不支持 | 支持 |

> 官方 README 原文：decimal.js 与 bignumber.js 的区别在于「以**有效数字**而非小数位指定精度，并把所有计算舍入到该精度」，且「包含三角函数、支持非整数幂，因此比 bignumber.js 和 big.js 都大」。

::: tip 选型一句话
只做四则 + 定点金额、在意体积 → **big.js**；需要多进制 I/O → **bignumber.js**；需要三角 / 对数 / 非整数幂 / NaN-Infinity → **decimal.js**。
:::

---

进入 [指南 · 进阶](./advanced)：金额场景实战、`toFixed / toDP / toSF` 取舍、`Decimal.clone` 多精度策略、序列化与 `toJSON`。
