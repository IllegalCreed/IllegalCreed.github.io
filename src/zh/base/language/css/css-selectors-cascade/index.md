---
layout: doc
---

# CSS 选择器与层叠

写下一条 CSS 规则，浏览器要回答两个问题：**这条规则匹配哪些元素**（选择器），以及**当多条规则同时命中同一个元素、同一个属性时，谁说了算**（层叠）。前者决定「打中谁」，后者决定「听谁的」。这两件事是 CSS 的引擎室——布局、动画、主题切换都建立在它们之上。本叶把选择器全谱、特异性计算、层叠算法、`@layer` 级联层这套「CSS 之所以叫 Cascading Style Sheets」的核心机制讲透。

## 概述

- **它管什么**：用什么规则从 DOM 里**挑出元素**（从 `*`、类、属性，到 `:has()` 这种关系选择器），以及当多条声明冲突时**按什么顺序决出胜者**（来源 → 层叠层 → 特异性 → 书写顺序）。
- **为什么值得认真学**：CSS 不报错——选择器拼错、特异性算错、`!important` 滥用导致的样式「不生效」，浏览器一声不吭，只是默默用了另一条规则。看不懂层叠，调样式就只能靠猜和堆 `!important`。
- **现代化关注点**：`:has()`（父选择器，Baseline 2023）、`:is()` / `:where()`（分组与零特异性，Baseline 2021）、`@layer` 级联层（驯服第三方 CSS，Baseline 2022）、`revert-layer` 等全局关键字——现代 CSS 给了你比 `!important` 优雅得多的层叠控制手段。

## 本叶地图

- [入门](./getting-started) —— 用一段最小例子打通「选择器命中 → 多规则冲突 → 谁赢」的完整心智模型
- [选择器家族](./guide-line/selector-families) —— 基础 / 属性 / 组合器全谱，外加伪类伪元素总览
- [伪类与伪元素](./guide-line/pseudo-classes-elements) —— 状态与结构伪类、`::before` 系伪元素，重点讲 `:has()` / `:is()` / `:where()` / `:not()`（标 Baseline）
- [特异性计算](./guide-line/specificity) —— `ID-CLASS-TYPE` 三列权重，`:where()` 零特异性、`:is()` / `:has()` 取最高
- [层叠与继承](./guide-line/cascade-inheritance) —— 来源、重要性、`!important` 反转，以及 `inherit` / `initial` / `unset` / `revert` / `revert-layer`
- [`@layer` 级联层实战](./guide-line/cascade-layers) —— 用层叠层取代特异性内卷与 `!important`（Baseline 2022）
- [选择器性能与最佳实践](./guide-line/selector-performance) —— 匹配成本、`:has()` 的取舍、可维护的命名与组织
- [参考](./reference) —— 选择器速查表 + 特异性规则 + 级联顺序 + 权威链接

## 文档地址

- [web.dev: Learn CSS — Selectors](https://web.dev/learn/css/selectors)
- [web.dev: Learn CSS — Specificity](https://web.dev/learn/css/specificity)
- [web.dev: Learn CSS — The cascade](https://web.dev/learn/css/the-cascade)
- [MDN: CSS cascade（层叠）](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Cascade)
- [MDN: Cascade layers（`@layer`）](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)

## 幻灯片地址

<a href="/SlideStack/css-selectors-cascade-slide/" target="_blank">CSS 选择器与层叠</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=css-%E9%80%89%E6%8B%A9%E5%99%A8%E4%B8%8E%E5%B1%82%E5%8F%A0" target="_blank" rel="noopener noreferrer">CSS 选择器与层叠 测试题</a>
