---
layout: doc
---

# JavaScript 函数与作用域

函数是 JavaScript 的一等公民——可以赋值给变量、当参数传递、被另一个函数返回。而真正让函数行为充满「玄机」的，是两套互相纠缠的机制：**作用域**（变量在哪里可见、闭包如何「记住」外层变量）与 **`this` 绑定**（同一个函数，在不同的调用方式下 `this` 指向截然不同）。本叶把「函数有几种写法」「箭头函数为什么特殊」「闭包到底闭住了什么」「`this` 凭什么这样指」「`call`/`apply`/`bind` 怎么改写 `this`」「高阶函数与函数式组合」这六件事讲透。

## 概述

- **它管什么**：函数的多种形态（声明 / 表达式 / 箭头 / IIFE）与参数机制（默认 / 剩余 / `arguments`）、变量的作用域链与闭包、`this` 在四种调用方式下的指向、用 `call`/`apply`/`bind` 显式改写 `this`、以及把函数当数据来组装的高阶函数范式。
- **为什么值得认真学**：JavaScript 面试与线上事故里，「函数 + 作用域 + `this`」三连击命中率极高——回调里 `this` 丢了、循环里闭包全部捕获最后一个值、箭头函数被误当方法或构造器用、`forEach` 传方法引用就崩……这些坑全部源于对这套机制的一知半解，而且大多**不报错、只出错**。
- **现代化关注点**：ES6+ 的箭头函数（无自己的 `this`/`arguments`、不可 `new`）、块级作用域（`let`/`const` 让循环闭包「自动正确」）、默认参数与剩余参数取代 `arguments`、以及用闭包实现的模块模式与私有状态。

## 本叶地图

- [入门](./getting-started) —— 用一段「同一个函数、四种调用、四种 `this`」的代码，把函数、作用域、`this` 三条主线一次串起来
- [函数的多种形态](./guide-line/function-forms) —— 声明 / 表达式 / 箭头 / IIFE，加上默认参数、剩余参数、`arguments` 对象
- [箭头函数 vs 普通函数](./guide-line/arrow-vs-regular) —— `this`、`arguments`、不可 `new`、无 `prototype`，到底该用哪一个
- [作用域链与闭包](./guide-line/scope-closures) —— 词法环境、`[[Environment]]`、闭包捕获、循环陷阱、模块模式
- [`this` 的四条规则](./guide-line/this-rules) —— 默认 / 隐式 / 显式 / `new`，以及最常见的「`this` 丢失」场景
- [`call` / `apply` / `bind`](./guide-line/call-apply-bind) —— 显式绑定 `this`、函数借用、永久绑定与偏函数
- [高阶函数](./guide-line/higher-order-functions) —— 函数作参数 / 返回值、柯里化、偏函数、函数组合

## 文档地址

- [MDN: Functions（指南）](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions)
- [MDN: Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures)
- [javascript.info: 变量作用域与闭包](https://javascript.info/closure)
- [javascript.info: 对象方法与 `this`](https://javascript.info/object-methods)

## 幻灯片地址

<a href="/SlideStack/js-functions-scope-slide/" target="_blank">JavaScript 函数与作用域</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=javascript-%E5%87%BD%E6%95%B0%E4%B8%8E%E4%BD%9C%E7%94%A8%E5%9F%9F" target="_blank" rel="noopener noreferrer">JavaScript 函数与作用域 测试题</a>
