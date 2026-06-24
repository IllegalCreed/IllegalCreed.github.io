---
layout: doc
---

# JavaScript 对象与原型继承

对象是 JavaScript 里几乎一切复合数据的载体——数组、函数、类实例、`Map`、`Date`，底层都是对象。而把这些对象串成一张「谁能用谁的方法」的关系网的，是 JavaScript 独有的**原型链**：没有类，只有对象指向对象。本叶从对象字面量这一最朴素的形态出发，一路讲到属性描述符、引用与拷贝、`[[Prototype]]` 与原型链、基于原型的继承模式，最后落到 `Object` 静态方法这套日常工具箱——把「对象到底是什么、属性怎么查找、继承怎样发生」讲透。

## 概述

- **它管什么**：怎样创建对象、怎样读写与删除属性、属性除了值还携带哪些「开关」（可写 / 可枚举 / 可配置）、对象之间怎样通过 `[[Prototype]]` 共享行为、怎样把一个对象「继承」自另一个。
- **为什么值得认真学**：JavaScript 的对象模型与 Java / C++ 的「类即蓝图」完全不同——`class` 只是原型机制的语法糖。不懂原型链，就解释不了「为什么 `[].push` 能用」「为什么改了 `Array.prototype` 全世界数组都变」「为什么 `for...in` 会枚举出意料之外的键」。同时，引用语义、浅拷贝陷阱、`Object.freeze` 的「浅冻结」这些坑，几乎每个项目都会踩。
- **现代化关注点**：`structuredClone()`（原生深拷贝，2022 起广泛可用）、`Object.hasOwn()`（取代 `hasOwnProperty` 调用，2022 起广泛可用）、`Object.fromEntries()`（与 `Object.entries` 互逆）、`Object.create(null)`（无原型的纯字典对象）、以及「优先用 `class` / `Object.create`，避免运行时 `Object.setPrototypeOf` 触发引擎去优化」的性能共识。

## 本叶地图

- [入门](./getting-started) —— 用一张「对象全景」把字面量、属性、原型、静态方法串起来，逐块指向后续深页
- [对象基础](./guide-line/object-basics) —— 对象字面量、点 vs 方括号、`in`、`delete`、计算属性名、简写与方法
- [属性描述符](./guide-line/property-descriptors) —— `writable` / `enumerable` / `configurable` 三标志、getter/setter、`freeze` / `seal`
- [引用与拷贝](./guide-line/reference-copy) —— 引用 vs 值、浅拷贝 vs 深拷贝、`structuredClone`、循环引用
- [原型链](./guide-line/prototype-chain) —— `[[Prototype]]`、`Object.create`、`__proto__` vs `prototype`、属性遮蔽、查找规则
- [基于原型的继承](./guide-line/prototypal-inheritance) —— 构造函数 + `prototype`、寄生组合继承的来龙去脉、`class` 如何落到原型
- [Object 静态方法](./guide-line/object-static-methods) —— `keys` / `values` / `entries` / `assign` / `fromEntries` / `hasOwn` 与遍历选型
- [参考](./reference) —— 速查表 + 标准 / Baseline / MDN 链接

## 文档地址

- [MDN: Working with objects（指南）](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects)
- [MDN: Inheritance and the prototype chain（指南）](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain)
- [javascript.info: Prototypal inheritance](https://javascript.info/prototype-inheritance)
- [javascript.info: Property flags and descriptors](https://javascript.info/property-descriptors)

## 幻灯片地址

<a href="/SlideStack/js-objects-prototype-slide/" target="_blank">JavaScript 对象与原型继承</a>
