---
layout: doc
---

# JavaScript 语言基础与类型系统

JavaScript 是一门**动态类型、弱类型**的语言：变量不绑定类型、值在运算时会被悄悄转换。这套「灵活」既是它上手快的原因，也是无数 Bug 的温床——`"37" - 7` 得 `30`、`"37" + 7` 得 `"377"`、`0.1 + 0.2 !== 0.3`、`typeof null` 是 `"object"`、`[] == ![]` 居然为 `true`。本叶把「变量怎么声明、有哪些类型、值怎样转换与比较、运算符全谱、控制流、以及 strict mode 与那些历史怪癖」一次讲透，让你看懂引擎在背后到底做了什么。

## 概述

- **它管什么**：用 `var` / `let` / `const` 声明变量（作用域、提升、TDZ）；7 种原始类型 + 对象；类型之间的隐式 / 显式转换；`==` / `===` / `Object.is` 三套相等语义；算术 / 逻辑 / 位 / 三元 / 可选链 / 空值合并等运算符；`if` / `switch` / 循环等控制流；strict mode 收紧的那些松散行为。
- **为什么值得认真学**：这些是**所有** JavaScript 代码的地基——框架、库、Node、浏览器脚本无一例外都建立在这套规则上。不懂类型转换与相等语义，调试就只能靠猜；理解了，那些「玄学 Bug」会瞬间变得有迹可循。
- **现代化关注点**：`let` / `const` 取代 `var`（ES2015）、指数运算符 `**`（ES2016）、可选链 `?.` 与空值合并 `??`（ES2020）、逻辑赋值 `&&=` / `||=` / `??=`（ES2021）、`BigInt`（ES2020）、数字分隔符 `_`（ES2021）；以及 ES module / class 默认 strict mode 带来的「现代代码天然更安全」。

## 本叶地图

- [入门](./getting-started) —— 一段「现代且类型安全」的代码骨架，逐块讲清声明、类型、转换、相等的核心取舍
- [变量声明：var / let / const](./guide-line/variable-declarations) —— 三种声明、作用域、提升机制与暂时性死区（TDZ）
- [原始类型与包装对象](./guide-line/primitive-types) —— 7 种原始类型逐一拆解，以及 `String` / `Number` / `Boolean` 包装对象的自动装箱
- [类型转换与相等比较](./guide-line/type-conversion-equality) —— 显隐式转换、`==` vs `===`、`Object.is`、`NaN` 坑、truthy / falsy 全表
- [运算符全谱](./guide-line/operators) —— 算术 / 逻辑 / 位 / 三元 / `?.` / `??` / `**`，以及短路求值与运算符优先级
- [控制流与循环](./guide-line/control-flow-loops) —— `if` / `switch`、三种循环、`for...of` vs `for...in`、`break` / `continue` 与标签
- [strict mode 与历史怪癖](./guide-line/strict-mode-quirks) —— 严格模式收紧了什么、`typeof null`、自动分号插入（ASI）等历史包袱
- [参考](./reference) —— 速查表 + 标准 / Baseline / 调试工具链接

## 文档地址

- [MDN: JavaScript Guide — Grammar and types](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types)
- [MDN: Expressions and operators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_operators)
- [MDN: Equality comparisons and sameness](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness)
- [javascript.info: JavaScript Fundamentals](https://javascript.info/first-steps)

## 幻灯片地址

<a href="/SlideStack/js-fundamentals-types-slide/" target="_blank">JavaScript 语言基础与类型系统</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=javascript-%E8%AF%AD%E8%A8%80%E5%9F%BA%E7%A1%80%E4%B8%8E%E7%B1%BB%E5%9E%8B%E7%B3%BB%E7%BB%9F" target="_blank" rel="noopener noreferrer">JavaScript 语言基础与类型系统 测试题</a>
