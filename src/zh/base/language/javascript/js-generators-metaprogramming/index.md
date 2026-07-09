---
layout: doc
---

# JavaScript 生成器与元编程

大多数代码「描述要算什么」，而本叶的两类能力让你「控制语言本身怎么算」。**生成器**（`function*`）把一个函数变成可暂停、可恢复、能逐个吐值的状态机——惰性求值、无限序列、双向通信、用三五行写出自定义迭代器，都由它而来。**元编程**则更进一步：`Proxy` 用 13 个陷阱拦截对象的每一次读、写、删、调用；`Reflect` 把这些被拦截的底层操作重新暴露成函数；well-known symbols 是语言留给你的一排「钩子插孔」（`Symbol.iterator`、`Symbol.toPrimitive`、`Symbol.dispose`…）；再加上 ES2026 的资源管理 `using` / `await using` 与「尽力而为」的 `WeakRef` / `FinalizationRegistry`。本叶把「让对象按你的规则运转」这件事讲透。

## 概述

- **它管什么**：怎样写一个能暂停的函数（生成器）、怎样用它产出惰性或无限的数据流（同步与异步）、怎样用最少代码实现自定义迭代器；以及怎样拦截并改写对象的底层行为（`Proxy` + `Reflect`）、怎样挂接语言内置协议（well-known symbols）、怎样在作用域结束时自动释放资源（`using`）。
- **为什么值得认真学**：生成器是 `for...of`、惰性流、协程式控制流背后的同一套机制；理解它，异步生成器与 `for await...of` 处理流式 / 分页数据就顺理成章。而 `Proxy` / `Reflect` 是 Vue 3 响应式、ORM、Mock、校验层这些「看起来很魔法」的库的共同地基——不懂陷阱与不变量，就读不懂也写不出这类基础设施。
- **现代化关注点**：ES2025 的 **Iterator Helpers**（与生成器配合做惰性管道）、ES2018 的**异步生成器** / `for await...of`（已广泛可用）、**ES2026 显式资源管理** `using` / `await using` / `DisposableStack`（Stage 4、V8 / Node / TypeScript 已落地，但**尚未 Baseline**，Safari / Firefox 仍在跟进）、以及 ES2021 的 `WeakRef` / `FinalizationRegistry`（**非确定性、尽力而为**，不可用于关键逻辑）。

## 本叶地图

- [入门](./getting-started) —— 一页串起「生成器 → 自定义迭代器 → Proxy/Reflect → 语言钩子」的全景与心智模型
- [生成器基础](./guide-line/generators) —— `function*`、`yield`、`yield*` 委托、惰性求值、`next(v)` / `return` / `throw` 双向通信
- [异步生成器](./guide-line/async-generators) —— `async function*`、`for await...of`、`Symbol.asyncIterator`、流式与分页数据
- [用生成器实现自定义迭代器](./guide-line/custom-iterators) —— `[Symbol.iterator]` 生成器方法、无限序列、与数组迭代协议呼应
- [Proxy 与 Reflect](./guide-line/proxy-reflect) —— 13 个陷阱、不变量、`Reflect` 转发与 `receiver`，应用：响应式 / 校验 / 默认值
- [元编程进阶与资源管理](./guide-line/metaprogramming-resources) —— well-known symbols 钩子、ES2026 `using` / `await using` / `DisposableStack`、`WeakRef` / `FinalizationRegistry`
- [参考](./reference) —— 速查表 + 陷阱/symbols 对照 + 标准 / Baseline / MDN 链接

## 文档地址

- [MDN: Iterators and generators（指南）](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_generators)
- [MDN: Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) · [Reflect](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect)
- [MDN: `await using` / 显式资源管理](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/await_using)
- [javascript.info: Generators](https://javascript.info/generators)

## 幻灯片地址

<a href="/SlideStack/js-generators-metaprogramming-slide/" target="_blank">JavaScript 生成器与元编程</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=javascript-%E7%94%9F%E6%88%90%E5%99%A8%E4%B8%8E%E5%85%83%E7%BC%96%E7%A8%8B" target="_blank" rel="noopener noreferrer">JavaScript 生成器与元编程 测试题</a>
