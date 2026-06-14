---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **decimal.js 10.x**。本篇进入实战：金额计算的完整链路、`toFixed / toDecimalPlaces / toSignificantDigits` 的精确取舍、`Decimal.clone` 多精度策略、序列化（`toJSON`）与输出格式（指数记法阈值）。

## 一、金额计算的完整链路

金额场景的黄金法则：**字符串构造 → 全程 Decimal 运算 → 末端 toFixed 展示**。中途绝不 `toNumber`。

```js
import Decimal from 'decimal.js'

// 单价 19.99，数量 3，折扣 0.85，税率 0.06
const price = new Decimal('19.99')
const qty = new Decimal(3)
const discount = new Decimal('0.85')
const taxRate = new Decimal('0.06')

const subtotal = price.times(qty)              // 59.97
const discounted = subtotal.times(discount)    // 50.9745
const tax = discounted.times(taxRate)          // 3.05847
const total = discounted.plus(tax)             // 54.03297

total.toFixed(2)   // '54.03'（最后一步才格式化为两位小数）
```

::: warning 反模式：提前 toNumber
```js
// ❌ 任何中途 toNumber 都会退回浮点，前功尽弃
const bad = price.toNumber() * qty.toNumber()   // 退回 IEEE 754
// ❌ 用算术运算符同样退回浮点
const worse = price + qty                        // 字符串拼接 / 浮点
```
:::

## 二、toFixed vs toDecimalPlaces vs toSignificantDigits

三个最常用的「收敛」方法，按**返回类型**与**位数语义**区分：

| 方法 | 别名 | 语义 | 返回 | 尾随零 |
|---|---|---|---|---|
| `toFixed(dp, rm)` | — | 小数位 | **字符串** | 补齐 |
| `toDecimalPlaces(dp, rm)` | `toDP` | 小数位 | **Decimal** | 去除 |
| `toSignificantDigits(sd, rm)` | `toSD` | 有效数字 | **Decimal** | 去除 |
| `toPrecision(sd, rm)` | — | 有效数字 | **字符串** | 视情况 |

```js
const x = new Decimal('12345.6789')
x.toFixed(2)                  // '12345.68'（字符串，展示用）
x.toDecimalPlaces(2)         // Decimal 12345.68（可继续运算）
x.toSignificantDigits(3)     // Decimal 12300（3 位有效数字，保数量级）
x.toPrecision(3)             // '1.23e+4'（3 位有效数字字符串，可能转指数记法）

new Decimal('1.20').toFixed(2)  // '1.20'（展示固定两位）
new Decimal('1.20').toDP(2)     // Decimal 1.2（继续算）
```

::: tip 何时用哪个
- 展示给用户、固定小数位 → `toFixed`
- 中途要把结果收敛到某小数位再继续算 → `toDP`
- 按「有效数字」收敛（科学量级展示） → `toSD` / `toPrecision`
:::

## 三、Decimal.clone：多精度策略隔离

直接改全局 `Decimal.set` 会影响所有计算；当一个项目里有**多套精度策略**时，用 `Decimal.clone(config)` 派生**配置独立**的构造函数：

```js
import Decimal from 'decimal.js'

// 金额：20 位有效数字 + 银行家舍入
const Money = Decimal.clone({ precision: 20, rounding: Decimal.ROUND_HALF_EVEN })
// 科学计算：50 位有效数字
const Sci = Decimal.clone({ precision: 50, rounding: Decimal.ROUND_HALF_UP })

new Money('10').dividedBy(3).toFixed(2)   // 金额规则
new Sci('1').dividedBy(7).toString()      // 50 位精度，互不影响

Decimal.precision   // 全局仍是 20，未被污染
```

> 比「`set` 改完算完再 `set` 回去」安全得多——后者在异常、嵌套调用、并发下容易**泄漏状态**。

## 四、序列化：toJSON 与传输

Decimal 定义了 `toJSON()`（等同 `valueOf()`），`JSON.stringify` 会把它序列化为**字符串**（去尾随零）：

```js
JSON.stringify({ amount: new Decimal('1.50') })   // '{"amount":"1.5"}'
JSON.stringify({ amount: new Decimal('1.50').toFixed(2) })  // '{"amount":"1.50"}'
```

反序列化时再用字符串构造回来，全程不经过 number，精度无损：

```js
const obj = JSON.parse('{"amount":"123.456789012345678"}')
const amount = new Decimal(obj.amount)   // 精确还原
```

::: tip 后端交互
与后端（尤其是用 `DECIMAL` / `NUMERIC` 列的数据库）交互时，**金额字段全程走字符串**：JSON 里是字符串、JS 里是 Decimal、SQL 里是 DECIMAL，任何一环都不要落到 JS number，否则大数值或高精度会被双精度截断。
:::

## 五、输出格式：指数记法阈值

`toString()` / `valueOf()` 何时用指数记法，由两个阈值控制：

| 配置 | 默认 | 含义 |
|---|---|---|
| `toExpNeg` | -7 | 指数 ≤ 此值时用指数记法（小数方向） |
| `toExpPos` | 21 | 指数 ≥ 此值时用指数记法（大数方向） |

```js
new Decimal('0.0000001').toString()   // '1e-7'（指数 -7 达到 toExpNeg）
new Decimal('1e21').toString()        // '1e+21'（指数 21 达到 toExpPos）

Decimal.set({ toExpPos: 30 })
new Decimal('1e21').toString()        // '1000000000000000000000'（普通记法）
Decimal.set({ toExpPos: 21 })         // 恢复
```

> 这两个阈值**只影响字符串输出形式**，不改变数值本身或运算精度。要无视阈值强制普通记法，直接用 `toFixed()`。

## 六、聚合与常用数学方法

```js
Decimal.sum('0.1', '0.2', '0.3').toString()   // '0.6'
Decimal.max('1', '2', '3').toString()         // '3'
Decimal.min('1', '2', '3').toString()         // '1'

new Decimal(2).sqrt().toString()              // '1.4142135623730950488'
new Decimal(8).cbrt().toString()              // '2'
new Decimal(2).pow('0.5').toString()          // 平方根（非整数指数，big.js 做不到）
new Decimal('0.5').toFraction().join('/')     // '1/2'（最接近的分数）
```

---

进入 [指南 · 专家](./expert)：内部表示（`s/e/d`）、`modulo` 与欧氏取余、`crypto` 随机、链式精度累积排错、与原生 `toFixed` 的深层差异。
