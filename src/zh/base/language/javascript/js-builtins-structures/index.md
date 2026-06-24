---
layout: doc
---

# JavaScript 内建对象与数据结构

写 JavaScript 的每一天都在和一批「语言自带、随处可用」的内建对象打交道——`Number` 与 `Math` 管数值运算、字符串方法与模板字面量管文本、`RegExp` 管模式匹配、`Map` / `Set` 管集合、`JSON` 管序列化、`Symbol` 管唯一标识、`Date` 管时间。它们不是某个框架或库，而是 ECMAScript 规范保证「任何宿主里都在」的标准库。本叶把这套标准库讲透：从浮点数为什么算不准 `0.1 + 0.2`，到正则的每一个标志位，到弱引用与垃圾回收的关系，再到 `Date` 的历史坑与正在落地的 `Temporal` 新 API。

## 概述

- **它管什么**：数值的表示与运算（含超出安全整数范围的 `BigInt`）、文本的构造与处理（含 Unicode 码点与模板）、模式匹配（正则）、键值/去重集合（`Map` / `Set` 及其弱引用版本）、数据序列化（`JSON`）、唯一标识与元编程协议（`Symbol`）、日期时间（`Date` 与 `Temporal`）。
- **为什么值得认真学**：这些是「不学也能跑、但不懂就会踩坑」的基础设施。`0.1 + 0.2 !== 0.3`、`typeof NaN === "number"`、正则 `g` 标志的 `lastIndex` 副作用、`Map` 与对象的取舍、`JSON.stringify` 悄悄丢掉 `undefined` 与函数、`Date` 月份从 0 开始——每一条都是真实项目里反复出现的 Bug 源。
- **现代化关注点**：`Set` 的集合运算方法（`union` / `intersection` 等，2024 起广泛可用）、`Object.groupBy` / `Map.groupBy`（ES2024）、`WeakRef` 与 `FinalizationRegistry`（ES2021）、`Array.fromAsync`（ES2024）、正则 `v` 标志（`unicodeSets`，ES2024）、以及重头戏 **`Temporal`**——TC39 Stage 4、列入 ES2026，已在 Chrome/Edge 144+、Firefox 139+ 落地（Safari 暂未），用来根治 `Date` 的所有历史顽疾。

## 本叶地图

- [入门](./getting-started) —— 用一段「内建对象全景」串起数值、字符串、正则、集合、序列化、时间，逐块指向后续深页
- [数值、Math 与 BigInt](./guide-line/number-math-bigint) —— `Number` 与 IEEE 754 浮点、`0.1 + 0.2` 的真相、`Math` 工具箱、`BigInt` 任意精度整数
- [字符串与模板字面量](./guide-line/string-template) —— 字符串方法全谱、模板字面量与多行、Unicode 码点与 `\u{}`、标签模板
- [正则表达式](./guide-line/regexp) —— 字面量 vs 构造器、`g`/`i`/`m`/`s`/`u`/`y`/`d`/`v` 八个标志、捕获组/命名组/断言、`matchAll`
- [Map / Set 与弱引用](./guide-line/map-set-weak) —— `Map` vs 对象、`Set` 去重与集合运算、`WeakMap` / `WeakSet` / `WeakRef` 与垃圾回收
- [JSON 与 Symbol](./guide-line/json-symbol) —— `JSON.stringify` / `parse` 的 replacer/reviver 与陷阱、`Symbol` 唯一键与 well-known symbols 协议
- [Date 与 Temporal](./guide-line/date-temporal) —— `Date` 的七大坑、`Temporal` 已落地现状与降级、`Intl` 国际化概览
- [参考](./reference) —— 速查表 + 标准 / Baseline / MDN 链接

## 文档地址

- [MDN: Numbers and strings（指南）](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Numbers_and_strings)
- [MDN: Regular expressions（指南）](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions)
- [MDN: Keyed collections（指南）](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Keyed_collections)
- [MDN: Temporal（参考）](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal)

## 幻灯片地址

<a href="/SlideStack/js-builtins-structures-slide/" target="_blank">JavaScript 内建对象与数据结构</a>
