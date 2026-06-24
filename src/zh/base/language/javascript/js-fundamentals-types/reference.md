---
layout: doc
outline: [2, 3]
---

# 参考

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 声明：默认 `const`，需重新赋值才 `let`，不用 `var`；`let` / `const` 块作用域 + TDZ
- 8 种类型：7 原始（`string` / `number` / `bigint` / `boolean` / `undefined` / `symbol` / `null`）+ `object`
- 相等：默认 `===`；`==` 只在 `x == null` 时偶用；`Object.is` 仅区分 `±0` / `NaN` 时用
- falsy 共 8 个：`false` / `0` / `-0` / `0n` / `""` / `null` / `undefined` / `NaN`
- 转换：`Number(x)` / `String(x)` / `Boolean(x)`（不带 `new`）；`+x` 转数字、`!!x` 转布尔
- 现代运算符：`?.` / `??` / `**`（ES2016）/ `&&=` `||=` `??=`（ES2021）
- 遍历：数组 `for...of`，对象 `for...in` 或 `Object.entries` + `for...of`
- 严格模式：module / class 默认开启；脚本顶部 `"use strict";`
- 三大怪癖：`typeof null === "object"`、`NaN !== NaN`、ASI（`return` 后勿换行）
- 检测：数组 `Array.isArray()`、`NaN` 用 `Number.isNaN()`、`null` 用 `=== null`

## 变量声明速查

| 特性 | `var` | `let` | `const` |
| --- | --- | --- | --- |
| 作用域 | 函数 / 全局 | 块 | 块 |
| 提升后 | `undefined` | TDZ | TDZ |
| 可重复声明 | ✅ | ❌ | ❌ |
| 可重新赋值 | ✅ | ✅ | ❌ |
| 必须初始化 | ❌ | ❌ | ✅ |
| 建议 | 不用 | 需改时 | 默认 |

## 8 种数据类型速查

| 类型 | `typeof` 结果 | 备注 |
| --- | --- | --- |
| `string` | `"string"` | 不可变 |
| `number` | `"number"` | IEEE 754 双精度；`Infinity` / `NaN` |
| `bigint` | `"bigint"` | `123n`，不能与 number 混算（ES2020） |
| `boolean` | `"boolean"` | `true` / `false` |
| `undefined` | `"undefined"` | 未赋值默认值 |
| `symbol` | `"symbol"` | 唯一标识（ES2015） |
| `null` | `"object"` ← 坑 | 判断用 `=== null` |
| `object` | `"object"` / `"function"` | 数组 / 函数 / 日期等 |

## 类型转换速查

| 输入 | `Number(x)` | `String(x)` | `Boolean(x)` |
| --- | --- | --- | --- |
| `""` | `0` | `""` | `false` |
| `" "` | `0` | `" "` | `true` |
| `"12px"` | `NaN` | `"12px"` | `true` |
| `"0"` | `0` | `"0"` | `true` |
| `0` | `0` | `"0"` | `false` |
| `null` | `0` | `"null"` | `false` |
| `undefined` | `NaN` | `"undefined"` | `false` |
| `[]` | `0` | `""` | `true` |
| `[5]` | `5` | `"5"` | `true` |
| `[1,2]` | `NaN` | `"1,2"` | `true` |
| `{}` | `NaN` | `"[object Object]"` | `true` |

## 四套相等算法速查

| x | y | `==` | `===` | `Object.is` | SameValueZero |
| --- | --- | --- | --- | --- | --- |
| `NaN` | `NaN` | ❌ | ❌ | ✅ | ✅ |
| `+0` | `-0` | ✅ | ✅ | ❌ | ✅ |
| `null` | `undefined` | ✅ | ❌ | ❌ | ❌ |
| `0` | `false` | ✅ | ❌ | ❌ | ❌ |
| `"0"` | `0` | ✅ | ❌ | ❌ | ❌ |
| `""` | `0` | ✅ | ❌ | ❌ | ❌ |

- `===`：日常默认 · `Object.is`：元编程 / 区分 `±0` · SameValueZero：`Array.includes` / `Set` / `Map`

## 运算符速查

| 类别 | 运算符 |
| --- | --- |
| 算术 | `+ - * / %` `**`（ES2016，右结合） |
| 一元 | `+x`（转数字）`-x` `++` `--` `!` `~` `typeof` |
| 比较 | `=== !==`（优先）`== !=`（避免）`< > <= >=` |
| 逻辑 | `&&` `\|\|` `!`（返回操作数本身、短路） |
| 空值 | `??`（仅 nullish 兜底）`?.`（可选链）（ES2020） |
| 位运算 | `& \| ^ ~ << >> >>>`（先转 32 位整数） |
| 赋值 | `= += ...` `&&= \|\|= ??=`（ES2021） |
| 其他 | `? :`（三元）`,`（逗号）`in` `instanceof` `delete` |

## 循环与遍历速查

| 写法 | 遍历对象 | 拿到 | 用途 |
| --- | --- | --- | --- |
| `for` | — | 索引 | 次数已知 |
| `while` / `do...while` | — | — | 条件循环（后者至少一次） |
| `for...of` | 可迭代对象 | **值** | 数组 / 字符串 / Set / Map（数组首选） |
| `for...in` | 对象 | **键名（含继承）** | 对象（**勿用于数组**） |
| `Object.entries` + `for...of` | 对象自身 | **[键, 值]** | 安全遍历对象自有属性 |
| `forEach` / `map` / `filter` | 数组 | 值（+索引） | 函数式遍历 |

## 严格模式收紧项速查

| 行为 | 非严格 | 严格 |
| --- | --- | --- |
| 给未声明变量赋值 | 创建全局变量 | `ReferenceError` |
| 给只读 / 冻结属性赋值 | 静默失败 | `TypeError` |
| 删除不可删除属性 | 静默失败 | `TypeError` |
| 重复形参名 | 允许 | `SyntaxError` |
| 旧式八进制 `0644` | 允许 | `SyntaxError`（用 `0o644`） |
| `with` 语句 | 允许 | `SyntaxError` |
| 普通调用的 `this` | 全局对象 | `undefined` |
| `eval` 变量 | 泄漏到外层 | 独立作用域 |

> 提醒：ES module 与 `class` 体**默认严格**，无需写 `"use strict"`。

## 必背怪癖速查

- `typeof null === "object"`（用 `=== null` 判断）
- `NaN !== NaN`（用 `Number.isNaN()` 检测）
- `0.1 + 0.2 === 0.30000000000000004`（浮点精度，比较用容差）
- `null == undefined` → `true`，但 `null === undefined` → `false`
- `[] == ![]` → `true`（别用 `==`）
- ASI：`return` 后换行返回 `undefined`；行首 `(` / `[` / `` ` `` 需防连句
- `"0"` / `[]` / `{}` 都是 truthy

## ES 版本特性对照（本叶涉及）

| 特性 | 版本 |
| --- | --- |
| `let` / `const`、`Symbol`、`for...of`、模板字面量、`Number.isNaN` | ES2015（ES6） |
| 指数运算符 `**` | ES2016 |
| 指数赋值 `**=` | ES2016 |
| 可选链 `?.`、空值合并 `??`、`BigInt` | ES2020 |
| 逻辑赋值 `&&=` / `\|\|=` / `??=`、数字分隔符 `_` | ES2021 |

## 权威链接

**标准 / 规范**

- [ECMAScript® Language Specification（ECMA-262）](https://tc39.es/ecma262/)
- [TC39 Proposals（提案进度）](https://github.com/tc39/proposals)

**指南 / 参考**

- [MDN: JavaScript Guide — Grammar and types](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types)
- [MDN: Expressions and operators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_operators) · [Operator precedence](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_precedence)
- [MDN: Equality comparisons and sameness](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness)
- [MDN: Strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode)
- [javascript.info: JavaScript Fundamentals](https://javascript.info/first-steps)

**兼容性 / 工具**

- [Baseline 浏览器兼容查询：webstatus.dev](https://webstatus.dev/) · [caniuse.com](https://caniuse.com/)
- [Node.js / 浏览器 ES 特性支持表：kangax compat-table](https://compat-table.github.io/compat-table/es2016plus/)

## 相关页

- [入门](./getting-started) · [变量声明](./guide-line/variable-declarations) · [原始类型与包装对象](./guide-line/primitive-types)
- [类型转换与相等比较](./guide-line/type-conversion-equality) · [运算符全谱](./guide-line/operators)
- [控制流与循环](./guide-line/control-flow-loops) · [strict mode 与历史怪癖](./guide-line/strict-mode-quirks)
