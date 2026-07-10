---
layout: doc
outline: [2, 3]
---

# 参考

> decimal.js 常用方法、舍入常量与配置项速查。版本基线 **decimal.js 10.6.0**。

## 速查

- 输入边界优先传字符串：`new Decimal('1.0000000000000001')`；number 在进入库前可能已经丢精度
- 实例不可变：`plus / minus / times / dividedBy` 等方法返回新 Decimal，必须接住返回值
- `precision` 默认 `20`，表示**有效数字**；`rounding` 默认 `ROUND_HALF_UP`（值 `4`）
- 展示定点值用 `toFixed(dp)`；继续计算用 `toDecimalPlaces(dp)` / `toSignificantDigits(sd)`
- 数值比较用 `equals / comparedTo / gt / gte / lt / lte`，不要对对象使用 `===` 或算术运算符
- 全局策略用 `Decimal.set()`；多业务精度用 `Decimal.clone()` 派生独立构造函数
- `Decimal.random(sd)` 的参数是**有效数字位数**；`crypto: true` 才改用平台安全随机源
- 支持 `NaN` / `Infinity`；除零不会抛错，业务边界要用 `isFinite()` / `isNaN()` 显式校验

## 一、构造与导入

```js
import Decimal from 'decimal.js'           // ESM
const Decimal = require('decimal.js')      // CJS

new Decimal(123.45)        // number
new Decimal('123.45')      // string（推荐）
new Decimal('1.2e3')       // 指数记法 → 1200
new Decimal('0xff')        // 十六进制 → 255（big.js 不支持）
new Decimal(otherDecimal)  // 克隆
```

## 二、四则与基础运算

| 方法 | 别名 | 作用 |
|---|---|---|
| `plus(x)` | `add` | 加 |
| `minus(x)` | `sub` | 减 |
| `times(x)` | `mul` | 乘 |
| `dividedBy(x)` | `div` | 除（真除法，`7/2=3.5`） |
| `dividedToIntegerBy(x)` | `divToInt` | 整数除法 |
| `modulo(x)` | `mod` | 取余（受 `modulo` 配置影响） |
| `pow(x)` | `toPower` | 幂（**支持非整数指数**） |
| `sqrt()` | — | 平方根 |
| `cbrt()` | — | 立方根 |
| `abs()` | `absoluteValue` | 绝对值 |
| `negated()` | `neg` | 取负 |

> 静态两参版：`Decimal.add(x,y)` / `Decimal.sub` / `Decimal.mul` / `Decimal.div` / `Decimal.mod` / `Decimal.pow`。

## 三、舍入与取整

| 方法 | 别名 | 作用 |
|---|---|---|
| `round()` | — | 舍入到整数（按 rounding） |
| `ceil()` | — | 向上取整 |
| `floor()` | — | 向下取整 |
| `trunc()` | `truncated` | 向零截断 |
| `toDecimalPlaces(dp, rm)` | `toDP` | 按**小数位**舍入 → Decimal |
| `toSignificantDigits(sd, rm)` | `toSD` | 按**有效数字**舍入 → Decimal |
| `toNearest(x, rm)` | — | 舍入到 x 的最近倍数 |

## 四、比较与判定

| 方法 | 别名 | 返回 |
|---|---|---|
| `comparedTo(x)` | `cmp` | `-1` / `0` / `1` / `NaN` |
| `equals(x)` | `eq` | 布尔 |
| `greaterThan(x)` | `gt` | 布尔 |
| `greaterThanOrEqualTo(x)` | `gte` | 布尔 |
| `lessThan(x)` | `lt` | 布尔 |
| `lessThanOrEqualTo(x)` | `lte` | 布尔 |
| `isNaN()` | — | 是否 NaN |
| `isFinite()` | — | 是否有限 |
| `isInteger()` | `isInt` | 是否整数 |
| `isZero()` | — | 是否零 |
| `isNegative()` | `isNeg` | 是否负 |
| `isPositive()` | `isPos` | 是否正 |

::: warning 不要用 `===` / `==`
Decimal 是对象；`===` 比较引用、`==` 走隐式转换。判等一律用 `equals` / `comparedTo`。
:::

## 五、输出与转换

| 方法 | 返回 | 说明 |
|---|---|---|
| `toString()` | string | 去尾随零；超阈值用指数记法 |
| `valueOf()` | string | 类似 toString，保留有符号零 |
| `toJSON()` | string | 等同 valueOf（`JSON.stringify` 调用） |
| `toNumber()` | number | 回原生 number（仅最终用） |
| `toFixed(dp, rm)` | string | 定点，补尾随零，总是普通记法 |
| `toExponential(dp, rm)` | string | 科学计数法 |
| `toPrecision(sd, rm)` | string | 按有效数字 |
| `toFraction(maxDen?)` | `Decimal[]` | 两元素数组 `[分子, 分母]`，两项都是 Decimal |
| `toBinary / toOctal / toHexadecimal(sd?, rm?)` | string | 进制输出（`toHex` 是别名） |
| `decimalPlaces()` | number | 小数位数（别名 `dp`） |
| `precision(incZeros?)` | number | 有效数字位数（别名 `sd`） |

## 六、高级数学函数（big.js / bignumber.js 没有）

```text
三角：    sin  cos  tan        （别名 sine / cosine / tangent）
反三角：  asin acos atan       （inverseSine 等）
双曲：    sinh cosh tanh       （hyperbolicSine 等）
反双曲：  asinh acosh atanh
对数：    ln  log(base)  log2  log10
指数：    exp                  （naturalExponential）
```

## 七、静态方法

| 方法 | 作用 |
|---|---|
| `Decimal.set(config)` / `Decimal.config(config)` | 全局配置（带校验，推荐） |
| `Decimal.clone(config?)` | 派生**配置独立**的新构造函数 |
| `Decimal.sum(...args)` | 求和 |
| `Decimal.max(...args)` / `Decimal.min(...args)` | 最大 / 最小 |
| `Decimal.hypot(...args)` | 欧氏范数（√(x²+y²+…)） |
| `Decimal.sign(x)` | 符号 |
| `Decimal.random(sd?)` | `[0, 1)` 随机 Decimal；参数为有效数字位数，`crypto:true` 时用安全随机源 |
| `Decimal.isDecimal(obj)` | 是否 Decimal 实例 |
| `Decimal.noConflict()` | 浏览器全局冲突恢复 |

## 八、舍入常量

```text
ROUND_UP         = 0   远离零
ROUND_DOWN       = 1   趋向零（截断）
ROUND_CEIL       = 2   趋向 +∞
ROUND_FLOOR      = 3   趋向 -∞
ROUND_HALF_UP    = 4   四舍五入，平局远离零（默认 rounding）
ROUND_HALF_DOWN  = 5   四舍五入，平局趋向零
ROUND_HALF_EVEN  = 6   四舍五入，平局取偶（银行家舍入）
ROUND_HALF_CEIL  = 7   四舍五入，平局趋向 +∞
ROUND_HALF_FLOOR = 8   四舍五入，平局趋向 -∞
EUCLID           = 9   仅 modulo：欧氏取余（余数非负）
```

## 九、配置项（Decimal.set）

| 属性 | 默认 | 范围 | 含义 |
|---|---|---|---|
| `precision` | 20 | 1 ~ 1e9 | 结果保留的**有效数字**位数 |
| `rounding` | 4 | 0 ~ 8 | 默认舍入模式 |
| `toExpNeg` | -7 | -9e15 ~ 0 | 小数方向转指数记法的指数阈值 |
| `toExpPos` | 21 | 0 ~ 9e15 | 大数方向转指数记法的指数阈值 |
| `minE` | -9e15 | -9e15 ~ 0 | 下溢指数下限 |
| `maxE` | 9e15 | 0 ~ 9e15 | 上溢指数上限 |
| `modulo` | 1 | 0 ~ 9 | `mod` 的取余模式（可用 EUCLID） |
| `crypto` | false | 布尔 | `random` 是否用加密随机源 |

```js
Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_EVEN, modulo: Decimal.EUCLID })
```

## 十、三库速查对比

| | big.js | bignumber.js | decimal.js |
|---|---|---|---|
| 体积 / API | 最小 | 居中 | 最全 |
| 精度语义 | 小数位 `DP` | 小数位 `DECIMAL_PLACES` | **有效数字** `precision` |
| 默认精度 / 舍入 | `DP=20` / `RM=1` | `20` / `4` | `20` / `4` |
| NaN / Infinity | 不支持（抛错） | 支持 | 支持 |
| 多进制 I/O | 不支持 | 支持（2~36） | 支持（`0x/0o/0b`） |
| 三角 / 对数 / 非整数幂 | 无 | 无 | **有** |

---

更多细节见 [官方文档](https://mikemcl.github.io/decimal.js/) 与 [GitHub](https://github.com/MikeMcl/decimal.js)。
