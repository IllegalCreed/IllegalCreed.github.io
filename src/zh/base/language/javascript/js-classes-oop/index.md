---
layout: doc
---

# JavaScript 类与面向对象

`class` 是 JavaScript 在 ES2015 引入的「面向对象语法层」——它**不是新的对象模型**，而是建立在既有原型（prototype）机制之上的一套更顺手、更安全的写法。一句话概括：`class` 把「构造函数 + 原型方法 + 实例属性」三件事，收拢成一段读起来像传统 OOP 的声明，再补上构造函数时代做不到的能力——真正的私有字段 `#`、静态初始化块、`super` 调父类方法。本叶从语法糖的底层真相讲起，把类体里每一类成员（实例/原型方法、字段、静态、私有、访问器）、继承与 `super`、`instanceof` 判定，到尚未原生落地的装饰器现状，逐块讲透。

## 概述

- **它管什么**：用一段声明定义「对象的模板」——构造时初始化哪些实例数据、共享哪些方法、哪些成员挂在类自身（静态）、哪些对外彻底不可见（私有 `#`），以及子类如何 `extends` 复用与 `super` 改写父类行为。
- **为什么值得认真学**：`class` 的表象很像 Java/C# 的类，但底层仍是原型——`方法在原型上共享、字段在每个实例上各存一份、this 取决于调用点而非定义处`。不理解这层映射，就会写出「方法当回调丢了 `this`」「以为下划线 `_private` 真的私有」「子类构造函数忘了 `super()` 直接报错」这类典型坑。
- **现代化关注点**：私有字段 `#`、私有方法、`#x in obj` 品牌检查、静态初始化块（均为 **ES2022**，2023 起浏览器广泛可用）；以及**装饰器**——它**至今未原生落地**（TC39 提案处于 Stage 2.7、正向 Stage 3 收敛），现在只能靠 TypeScript / Babel 转写使用，且与 TS 早年的「实验性装饰器」是两套不兼容的规范。

## 本叶地图

- [入门](./getting-started) —— 从「`class` 到底做了什么」切入，一段最小类拆解出原型、字段、`this` 三条主线
- [类语法：构造与成员](./guide-line/class-syntax) —— `class` 声明/表达式、`constructor`、实例方法（挂原型）vs 类字段（挂实例）
- [继承与 super](./guide-line/inheritance-super) —— `extends`、`super()` 构造、`super.method()` 改写、继承内置类（如 `Array`）
- [静态成员](./guide-line/static-members) —— `static` 方法/字段、私有静态、**静态初始化块**与执行时机
- [私有字段 #](./guide-line/private-fields) —— `#field` 硬私有、`#method()` 私有方法、`#x in obj` 品牌检查与常见误区
- [访问器与 instanceof](./guide-line/getters-instanceof) —— `get`/`set`、`instanceof`、`Symbol.hasInstance` 定制、`new.target` 阻止直接实例化
- [装饰器现状](./guide-line/decorators) —— 提案 Stage、为何非原生、Stage 3 装饰器与 TS 旧装饰器的区别
- [参考](./reference) —— 类体成员速查表 + 各特性 ES 版本 / Baseline 状态 + 标准与调试链接

## 文档地址

- [MDN: Using classes（指南）](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_classes)
- [MDN: Classes（参考）](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)
- [javascript.info: Class basic syntax](https://javascript.info/class)
- [TC39: proposal-decorators](https://github.com/tc39/proposal-decorators)

## 幻灯片地址

<a href="/SlideStack/js-classes-oop-slide/" target="_blank">JavaScript 类与面向对象</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=javascript-%E7%B1%BB%E4%B8%8E%E9%9D%A2%E5%90%91%E5%AF%B9%E8%B1%A1" target="_blank" rel="noopener noreferrer">JavaScript 类与面向对象 测试题</a>
