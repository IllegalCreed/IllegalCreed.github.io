---
layout: doc
---

# JavaScript 数组与可迭代协议

数组是 JavaScript 里用得最多的数据结构，但「会用 `push`/`map`」和「用对」之间隔着一整套现代特性：哪些方法会**就地改原数组**、哪些返回**新副本**；ES2023 新增的 `toSorted` / `toReversed` / `with` / `findLast` 如何让「不可变更新」终于优雅；解构与扩展运算符 `...` 怎样把取值、复制、合并写成一行；以及数组背后真正的抽象——**可迭代协议**（`Symbol.iterator`），它把数组、字符串、`Map`、`Set`、`NodeList` 统一到了 `for...of`、扩展、解构之下。本叶把这条从「容器」到「协议」的链路讲透。

## 概述

- **它管什么**：有序集合的增删改查与遍历；用 `map` / `filter` / `reduce` 做声明式数据变换；用解构与 `...` 做取值、复制、合并；用可迭代协议把「任何能逐个产出值的东西」接入语言级语法。
- **为什么值得认真学**：数组方法里藏着一条关键分水岭——**变更（mutating）vs 不变更（copying）**。改错了原数组，是 React/Vue 里「状态变了视图不更新」最常见的根因。ES2023 起，每个变更方法都有了不变更的孪生版本，这条坑终于能系统性绕开。
- **现代化关注点**：ES2023 的 `toSorted` / `toReversed` / `toSpliced` / `with` / `findLast` / `findLastIndex`（已 Baseline 广泛可用）、ES2024 的 `Array.fromAsync`、ES2025 的 **Iterator Helpers**（`map`/`filter`/`take`/`drop` 等可迭代器惰性方法，Baseline 新近可用）。

## 本叶地图

- [入门](./getting-started) —— 一页看懂数组的「创建·读写·遍历·变换」全貌与那条变更/不变更分水岭
- [数组基础：增删改查与遍历](./guide-line/array-basics) —— 字面量、`length`、稀疏数组、`push`/`pop`/`slice`/`splice`、三种遍历
- [变更 vs 不变更方法](./guide-line/mutating-vs-immutable) —— 八个会改原数组的方法，以及 **ES2023** 的不可变孪生版 `toSorted`/`toReversed`/`with`/`findLast`
- [高阶遍历方法](./guide-line/higher-order-iteration) —— `map`/`filter`/`reduce`/`flatMap`/`find`，回调三参数与链式管道
- [解构赋值](./guide-line/destructuring) —— 数组/对象解构、默认值、重命名、嵌套、函数参数解构
- [扩展与剩余 `...`](./guide-line/spread-rest) —— 同一个 `...`：扩展展开 vs 剩余收集，浅拷贝与合并的真相
- [可迭代协议与 Iterator Helpers](./guide-line/iterables-iterator-helpers) —— `Symbol.iterator`、类数组转换、`Array.from`/`fromAsync`、**ES2025** 惰性迭代器方法
- [参考](./reference) —— 方法速查表 + 变更/不变更对照 + 标准 / Baseline 链接

## 文档地址

- [MDN: Indexed collections（索引集合指南）](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Indexed_collections)
- [MDN: Array（方法全表）](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)
- [MDN: Iteration protocols（迭代协议）](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)
- [javascript.info: 数组方法](https://javascript.info/array-methods)

## 幻灯片地址

<a href="/SlideStack/js-arrays-iterables-slide/" target="_blank">JavaScript 数组与可迭代协议</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=javascript-%E6%95%B0%E7%BB%84%E4%B8%8E%E5%8F%AF%E8%BF%AD%E4%BB%A3%E5%8D%8F%E8%AE%AE" target="_blank" rel="noopener noreferrer">JavaScript 数组与可迭代协议 测试题</a>
