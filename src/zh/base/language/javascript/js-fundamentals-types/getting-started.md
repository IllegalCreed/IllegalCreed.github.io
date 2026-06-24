---
layout: doc
outline: [2, 3]
---

# 入门

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 声明：默认 `const`，需重新赋值才用 `let`，**不再用 `var`**（函数作用域 + 提升坑）
- 块作用域：`let` / `const` 受 `{}` 约束并有**暂时性死区（TDZ）**，声明前访问抛 `ReferenceError`
- 8 种类型：7 原始（`string` / `number` / `bigint` / `boolean` / `undefined` / `symbol` / `null`）+ `object`
- 历史怪癖：`typeof null === "object"`（无法修复的远古 Bug）；`NaN !== NaN`
- 相等：默认用 `===`（不转换类型）；避免 `==`（隐式转换难预测）；`Object.is` 仅在区分 `±0` / `NaN` 时用
- 转换：显式 `Number(x)` / `String(x)` / `Boolean(x)`；`+x` 等价 `Number(x)`；`"" + x` 转字符串
- falsy 共 8 个：`false` / `0` / `-0` / `0n` / `""` / `null` / `undefined` / `NaN`，**其余全 truthy**（含 `"0"` / `[]` / `{}`）
- 加号特例：只要一侧是字符串就拼接，`"3" + 1` → `"31"`；其余算术会转数字，`"3" - 1` → `2`
- 现代运算符：`?.`（可选链）/ `??`（空值合并）/ `**`（指数，ES2016）/ `&&=` `||=` `??=`（逻辑赋值，ES2021）
- strict mode：ES module 与 `class` 体**默认严格**；脚本顶部 `"use strict";` 显式开启

## 一段「现代且类型安全」的代码

下面这段示例浓缩了本叶要讲的几乎所有要点，其余各页就是逐块拆解它：

```js
"use strict"; // 脚本顶部开启严格模式（module / class 体默认已严格）

// 1. 声明：默认 const，需重新赋值才 let，不用 var
const PI = 3.14159; // 常量：不可重新赋值
let count = 0; // 变量：后续会改

// 2. 原始类型一览（7 种）
const name = "Ada"; // string
const age = 36; // number（IEEE 754 双精度浮点）
const huge = 9007199254740993n; // bigint（超出安全整数范围用 n 后缀）
const ok = true; // boolean
const nothing = null; // null（手动「空」）
let notAssigned; // undefined（未赋值）
const id = Symbol("id"); // symbol（唯一标识）

// 3. 对象与数组（引用类型，const 锁住引用但内容可变）
const user = { name, age, roles: ["admin"] }; // 属性简写 name: name
user.roles.push("editor"); // ✅ 允许：改的是内容不是引用

// 4. 类型转换：显式优于隐式
const input = "42";
const num = Number(input); // 42（显式转数字）
const text = String(age); // "36"（显式转字符串）
const flag = Boolean(input); // true（非空字符串为 truthy）

// 5. 相等：用 === 不用 ==
console.log(num === 42); // true（同类型同值）
console.log(num == "42"); // true 但不推荐（== 会隐式转换）

// 6. 现代运算符
const city = user.address?.city ?? "未知"; // 可选链 + 空值合并
count ||= 1; // 逻辑赋值：count 为 falsy 时才赋值

// 7. 模板字面量（反引号 + ${} 插值，多行）
console.log(`${user.name} 有 ${user.roles.length} 个角色`);
```

::: tip 这段代码的取舍
全程 `const` 优先、`===` 优先、显式转换优先——这正是现代 JavaScript 的「默认安全」写法。`var`、`==`、隐式转换并非不能用，而是**在你没有明确理由时不该用**，因为它们的行为更难预测。
:::

## 逐块拆解

### ① 用 const / let，告别 var

`var` 是函数作用域 + 会提升到顶部（值为 `undefined`），极易写出难查的 Bug。现代代码默认 `const`（连引用都不让改，最安全），确需重新赋值时才用 `let`，两者都是**块作用域**且有 TDZ 保护。详见 [变量声明](./guide-line/variable-declarations)。

### ② 7 种原始类型 + 对象

JavaScript 的值要么是 **7 种原始类型**之一（不可变、按值比较），要么是**对象**（可变、按引用比较）。原始类型里 `null` 和 `undefined` 都表示「空」但语义不同，`bigint` 与 `symbol` 是较新的成员。详见 [原始类型与包装对象](./guide-line/primitive-types)。

### ③ 类型转换：先搞懂「谁转成谁」

弱类型意味着运算时值会被自动转换，规则零散。掌握三条主线即可：`+` 一侧是字符串就拼接，其余算术转数字，布尔上下文按 falsy 表判定。显式写 `Number()` / `String()` / `Boolean()` 永远比依赖隐式转换可靠。详见 [类型转换与相等比较](./guide-line/type-conversion-equality)。

### ④ 相等：`===` 是默认，`==` 是陷阱

`===` 不做类型转换，结果可预测、也更快；`==` 会按一套复杂规则隐式转换，`0 == ""`、`null == undefined`、`[] == ![]` 这类「反直觉为真」都出自它。除非你明确想要它的转换，否则一律 `===`。详见 [类型转换与相等比较](./guide-line/type-conversion-equality)。

### ⑤ 现代运算符让代码更短更安全

可选链 `?.` 让「层层取属性怕中途是 `null`」不再需要一堆 `&&`；空值合并 `??` 只在值为 `null` / `undefined` 时兜底（不会像 `||` 那样把 `0` / `""` 也当默认触发）。详见 [运算符全谱](./guide-line/operators)。

### ⑥ strict mode 是现代代码的默认

ES module 和 `class` 体里的代码**天然处于严格模式**——给未声明变量赋值会直接报错、`this` 在普通调用里是 `undefined` 而非全局对象，把一批「悄悄失败」变成「立即报错」。详见 [strict mode 与历史怪癖](./guide-line/strict-mode-quirks)。

## 8 种数据类型速览

| 类型 | 示例 | 说明 |
| --- | --- | --- |
| `string` | `"hi"` / `` `a${b}` `` | 文本，单 / 双引号或反引号 |
| `number` | `42` / `3.14` / `NaN` | IEEE 754 双精度浮点，整数与小数共用 |
| `bigint` | `9007199254740993n` | 任意精度整数，`n` 后缀（ES2020） |
| `boolean` | `true` / `false` | 逻辑真假 |
| `undefined` | `undefined` | 未赋值的默认值 |
| `symbol` | `Symbol("id")` | 唯一且不可变的标识（ES2015） |
| `null` | `null` | 手动表示「空」；`typeof` 却返回 `"object"` |
| `object` | `{}` / `[]` / `function` | 唯一的非原始类型（含数组、函数、日期等） |

::: warning 一个必须背下来的怪癖
`typeof null` 返回 `"object"` 而非 `"null"`——这是 JavaScript 第一版遗留至今的 Bug，因兼容性无法修复。判断 `null` 要用 `value === null`，不能靠 `typeof`。
:::

## 下一步

按本叶地图依次深入，或直接跳到你最关心的一页——[变量声明](./guide-line/variable-declarations)、[原始类型](./guide-line/primitive-types)、[转换与相等](./guide-line/type-conversion-equality)、[运算符](./guide-line/operators)、[控制流](./guide-line/control-flow-loops)、[strict mode](./guide-line/strict-mode-quirks)。下一页从最基础也最易踩坑的 [变量声明](./guide-line/variable-declarations) 开始。
