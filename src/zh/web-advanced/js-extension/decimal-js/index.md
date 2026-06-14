---
layout: doc
---

# decimal.js

::: tip 本篇范围
本篇聚焦 **decimal.js —— 为 JavaScript 提供任意精度的十进制（Decimal）数类型**，用于规避 IEEE 754 浮点误差（`0.1 + 0.2 !== 0.3`）、做金额与高精度计算。它与同作者的 **big.js**（最精简）、**bignumber.js**（居中、支持多进制）属同一选型方向，本篇在取舍与对比时重点展开三者差异。版本基线 **decimal.js 10.x**（本地实测 10.6.0）。
:::

decimal.js 由 Michael Mclaughlin 编写，官方定位是「**An arbitrary-precision Decimal type for JavaScript**」——把整数、浮点、各种进制都用任意精度的十进制表示，并复刻了大量 `Number.prototype` 与 `Math` 的方法。核心用法是 `new Decimal(value)` 构造、再用 `plus / minus / times / dividedBy / mod / pow / sqrt` 等方法运算：所有实例**不可变（immutable）**，每个运算都返回**新的** Decimal，因此天然支持链式调用，原值分毫不动。

它最被误解的一点是**精度语义**：配置项 `precision`（默认 **20**）指的是**有效数字（significant digits）位数**，**不是小数位数**——官方 README 明确「decimal.js 以有效数字而非小数位指定精度，并把所有计算都舍入到该精度」。默认舍入模式 `rounding` 为 **4（ROUND_HALF_UP，四舍五入、平局远离零）**；可用 `Decimal.set({ precision, rounding })` 全局配置，或用 `Decimal.clone(config)` 派生互不干扰的独立构造函数。输出端用 `toFixed`（定点字符串、补尾随零）、`toString`（去尾随零）、`toNumber`（回原生 number）、`toDP / toSF`（按小数位 / 有效数字舍入）等。它**支持 NaN 与 Infinity**（`1/0` 得 `Infinity` 而非抛错），并提供三角、对数、exp、非整数幂等高级数学函数——这也是它比 big.js、bignumber.js **更全、体积也最大**的原因。

## 评价

**优点**

- **彻底规避浮点误差**：任意精度十进制运算，`new Decimal(0.1).plus(0.2).equals(0.3)` 为 `true`
- **功能最全**：四则之外还有 `sqrt / cbrt`、三角 / 反三角 / 双曲、`ln / log / log2 / log10`、`exp`、非整数 `pow`
- **不可变 + 链式**：每步返回新实例，纯函数式变换，链式调用安全
- **完善的舍入控制**：9 种 `ROUND_*` 模式（含银行家舍入 `ROUND_HALF_EVEN`），可全局或按调用指定
- **支持 NaN / Infinity 与多进制**：`1/0` 得 Infinity 不抛错；字符串支持 `0x / 0o / 0b` 前缀
- **配置可隔离**：`Decimal.clone()` 派生独立精度策略，避免全局状态污染
- **TypeScript 友好**：包内自带 `.d.ts`，`Decimal` 既是构造函数也是类型，无需装 `@types`

**缺点**

- **体积最大**：含三角 / 对数 / exp，比 big.js、bignumber.js 都大——只做基础金额时是浪费
- **`precision` 易被误解为小数位**：实为有效数字，`precision=5` 时 `1000/3` 得 `333.33`（仅 2 位小数）
- **不能用运算符**：`+ - * /`、`===` 对 Decimal 对象会退回浮点 / 比较引用，必须用方法
- **提前 `toNumber` 即前功尽弃**：中途转回 number 会重新引入浮点误差
- **链式运算受 `precision` 累积舍入**：高精度场景需主动调高 `precision`（如 40/50）
- **基础场景过剩**：仅需四则 + 两位小数金额时，更轻的 **big.js** 往往更合适

## 文档地址

[decimal.js 官方文档](https://mikemcl.github.io/decimal.js/)

## GitHub 地址

[MikeMcl/decimal.js](https://github.com/MikeMcl/decimal.js)

## 幻灯片地址

<a href="/SlideStack/decimal-js-slide/" target="_blank">decimal.js</a>
