---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **decimal.js 10.x**。本篇深入内部与边界：`s/e/d` 内部表示、`modulo` 取余语义与 `EUCLID`、`crypto` 安全随机、链式精度累积的排错、与原生 `Number.prototype.toFixed` 的深层差异，以及三库选型的工程决策。

## 一、内部表示：s / e / d

每个 Decimal 用三个**只读属性**表示数值（理解它们有助调试，但一般无需直接操作）：

| 属性 | 含义 | 取值 |
|---|---|---|
| `s` | sign（符号） | `-1` / `1`；NaN 时为 `NaN` |
| `e` | exponent（指数） | 整数；NaN / Infinity 时为 `NaN` |
| `d` | digits（数字数组） | 每元素是 0~1e7 的整数；NaN / Infinity 时为 `null` |

特殊值：

| 值 | `d` | `e` | `s` |
|---|---|---|---|
| ±0 | `[0]` | 0 | ±1 |
| NaN | `null` | NaN | NaN |
| ±∞ | `null` | NaN | ±1 |

```js
const x = new Decimal('12.34')
x.s   // 1
x.e   // 1（数量级）
x.d   // 数字数组（内部以 1e7 为基的块存储）
```

查询位数用方法而非读属性：`decimalPlaces()`（别名 `dp`）返回小数位数，`precision(includeZeros?)`（别名 `sd`）返回有效数字位数。

## 二、modulo：取余语义与 EUCLID

`mod(x)` 的余数符号由全局配置 `modulo`（默认 **1 = ROUND_DOWN**）决定：

| `modulo` | 行为 |
|---|---|
| `ROUND_DOWN`(1，默认) | 余数符号与**被除数**一致（类似 JS 的 `%`） |
| `ROUND_FLOOR`(3) | 余数符号与**除数**一致 |
| `EUCLID`(9) | 欧几里得取余，余数**始终非负** |

```js
new Decimal(7).mod(3).toString()    // '1'
new Decimal(-7).mod(3).toString()   // '-1'（默认，跟被除数符号）

Decimal.set({ modulo: Decimal.EUCLID })
new Decimal(-7).mod(3).toString()   // '2'（欧氏取余，非负）
Decimal.set({ modulo: 1 })          // 恢复
```

> `EUCLID`（值 9）是 `modulo` 专用的额外取值，普通 `rounding` 不接受它。

## 三、crypto：加密安全随机

`Decimal.random(dp)` 返回 `[0, 1)` 区间、指定小数位的随机 Decimal。默认用 `Math.random`；开启 `crypto` 后改用平台加密随机源：

```js
Decimal.random(10).toString()        // 默认 Math.random

Decimal.set({ crypto: true })        // 改用 crypto.getRandomValues / randomBytes
Decimal.random(20).toString()        // 加密安全
```

> 若设 `crypto: true` 但运行环境没有可用的加密源，会抛错。需要可重复 / 可审计的随机（如抽奖、令牌）时才开启。

## 四、链式精度累积排错

**现象**：一长串利息 / 汇率计算后，结果在第 20 位附近与「无限精度」略有出入。

**根因**：默认 `precision = 20`，decimal.js 把**每一步**运算（尤其除法、`pow`）都舍入到 20 位有效数字，链式中这种舍入会逐步累积。

**对策**：在足够高的精度下计算，最后再收敛到展示精度：

```js
// 用 clone 提高中间计算精度，避免污染全局
const Calc = Decimal.clone({ precision: 50 })

const rate = new Calc('1.000123')
let principal = new Calc('100000')
for (let i = 0; i < 365; i++) principal = principal.times(rate)

principal.toDecimalPlaces(2).toString()   // 末端才收敛到 2 位小数
```

::: warning 不要靠 toNumber 或换原生
把中间结果 `toNumber` 或改用原生 `number` 只会让精度更差。精度问题的正解永远是**提高 `precision`**，而非退回浮点。
:::

## 五、与原生 toFixed 的深层差异

decimal.js 的 `toFixed` 不是 `Number.prototype.toFixed` 的简单替身：

```js
(0.1).toFixed(20)                      // '0.10000000000000000555'（原生暴露浮点误差）
new Decimal('0.1').toFixed(20)         // '0.10000000000000000000'（任意精度，准确）

(1.005).toFixed(2)                     // '1.00'（原生：1.005 实为 1.00499…，被舍下去）
new Decimal('1.005').toFixed(2)        // '1.01'（十进制精确，正确进位）
```

关键差异：① **精度无损**（不受双精度限制）；② **总是普通记数法**（原生对极大数行为特殊）；③ 可传**第二参数指定舍入模式**（`toFixed(2, Decimal.ROUND_DOWN)`）。

## 六、三库选型的工程决策

| 需求 | 推荐 | 理由 |
|---|---|---|
| 仅四则 + 两位小数金额、在意体积 | **big.js** | 最精简，`toFixed` 足够，无冗余 |
| 需要任意进制（2~36）I/O | **bignumber.js** | 唯一对任意基数 I/O 支持完整 |
| 需要 NaN / Infinity 静默处理 | decimal.js / bignumber.js | big.js 会抛错 |
| 需要三角 / 对数 / exp / 非整数幂 | **decimal.js** | 唯一提供这些高级数学函数 |
| 想让非法运算尽早暴露成异常 | **big.js** | 严格性反而是优点（除零即抛错） |

::: tip 减体积的轻量替代
若用 decimal.js 只是为了精度、用不到三角函数，可考虑官方的 **decimal.js-light**（去掉三角函数的精简版），体积更小、API 基本一致。
:::

## 七、易踩的坑速查

- ⚠️ `precision` 是**有效数字**不是小数位 → `precision=5` 时 `1000/3 = '333.33'`
- ⚠️ 实例**不可变** → `a.plus(1)` 不改 `a`，必须接收返回值
- ⚠️ 别用 `+` / `===` → 退回浮点 / 比较引用，用 `plus` / `equals`
- ⚠️ `toString` **去尾随零**（`1.2`），金额展示用 `toFixed(2)`（`1.20`）
- ⚠️ 中途 `toNumber` 即前功尽弃 → 全程 Decimal，末端才转换
- ⚠️ `dividedBy` 是真除法（`7/2=3.5`）→ 整除用 `dividedToIntegerBy` 或 `div().floor()`
- ⚠️ 链式精度不够 → 调高 `precision`（用 `clone` 隔离），别退回原生

---

回到 [参考](../reference) 速查全部方法、常量与配置项。
