---
layout: doc
---

# CSS 自定义属性、函数与工程化

CSS 早已不只是「写死颜色和间距」的静态样式表。`--brand: #0066ff` 这样的**自定义属性**让值能在运行时被读、被改、被 JS 接管；`clamp()` / `calc()` 这类**数学函数**让排版随视口流动而不靠媒体查询；原生**嵌套**、**级联层**、`@scope` 则把一份样式表从「一堆扁平规则」升级成可组织、可维护、能在大型项目里活下去的工程化资产。本叶把「CSS 作为一门可编程、可工程化的语言」这一面——变量、类型化、嵌套、数学函数、组织方法论、调试工作流——一次讲透。

## 概述

- **它管什么**：怎么用 `--x` + `var()` 把值变量化并在运行时切换主题、怎么用 `@property` 给变量加类型（顺带解锁动画）、怎么用原生 `&` 嵌套替代 Sass、怎么用 `calc/clamp/min/max` 做流式排版、怎么用 BEM / `@layer` / `@scope` 组织样式、以及样式出问题时怎么用 DevTools 定位。
- **为什么值得认真学**：这些是「现代 CSS」与「上古 CSS」的分水岭。掌握了，你能少写一大半媒体查询、丢掉运行时换肤的那套 JS 黑魔法、告别 Sass 也能舒服地嵌套、并在多人协作时让样式不互相污染。
- **现代化关注点**：自定义属性（Baseline 广泛可用）、`@property` 类型化与动画（Baseline 2024）、原生 CSS 嵌套（Baseline 2023 广泛可用）、`calc/clamp/min/max`（广泛可用）、`@layer` 级联层（Baseline 2022）、`@scope` 作用域（Baseline 2025，较新，需渐进增强）。

## 本叶地图

- [入门](./getting-started) —— 用一份「会换肤、能流式排版、原生嵌套」的现代样式表，串起本叶全部概念
- [自定义属性与 var()](./guide-line/custom-properties) —— `--x` 声明、`var()` 与回退、作用域与继承、运行时主题切换、与 JS 双向交互
- [`@property` 类型化变量](./guide-line/property-typed) —— 给变量加 `syntax` 类型、`initial-value` 兜底、解锁渐变 / 角度的动画（Baseline 2024）
- [原生 CSS 嵌套](./guide-line/nesting) —— `&` 嵌套选择器、嵌套 at 规则、特异性陷阱，以及与 Sass 的异同（Baseline 2023）
- [数学函数与流式排版](./guide-line/math-functions) —— `calc()` / `min()` / `max()` / `clamp()`，用一行实现「无媒体查询」的流式字号与间距
- [组织方法论：BEM·层·@scope](./guide-line/css-methodology) —— 命名约定 BEM、`@layer` 排座次、`@scope` 圈作用域，三层武器组织大型样式
- [CSS 调试与 DevTools 工作流](./guide-line/css-debugging) —— Styles / Computed 面板、删除线读层叠、调变量、`:hov` 模拟状态、CSS Overview
- [参考](./reference) —— 速查表 + 各特性 Baseline 状态 + 标准 / 调试工具链接

## 文档地址

- [web.dev: Learn CSS — Custom properties](https://web.dev/learn/css/custom-properties)
- [web.dev: Learn CSS — Functions](https://web.dev/learn/css/functions)
- [web.dev: Learn CSS — Nesting](https://web.dev/learn/css/nesting)
- [MDN: Using CSS custom properties（变量）](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties)
- [MDN: `@property`](https://developer.mozilla.org/en-US/docs/Web/CSS/@property)
- [MDN: Using CSS nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting/Using_CSS_nesting)

## 幻灯片地址

<a href="/SlideStack/css-variables-engineering-slide/" target="_blank">CSS 自定义属性、函数与工程化</a>
