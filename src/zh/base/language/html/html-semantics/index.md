---
layout: doc
---

# HTML 语义化与文档大纲

同样一段内容，可以用一堆 `<div>` 套出来，也可以用 `<header>`、`<nav>`、`<main>`、`<article>`、`<aside>`、`<footer>` 把它的「意义」写进标签里。前者浏览器照样渲染，但屏幕阅读器、搜索引擎、未来的你都读不懂它的结构；后者让标签本身就讲清了「这是页眉、这是导航、这是正文、这是侧栏」。本叶讲透「按意义而非外观选元素」这件事——分区元素怎么搭骨架、`article` 与 `section` 怎么选、`h1`–`h6` 与文档大纲到底该怎么用。

## 概述

- **它管什么**：用合适的元素表达内容的**含义与结构**，而不是用 `<div>` + class 拼外观。外观是 CSS 的事，结构是 HTML 的事。
- **为什么值得认真学**：语义化的收益几乎都是隐性的——更好的可访问性（屏幕阅读器按地标和标题跳转）、更友好的 SEO、更可维护的代码（不读内容也能看懂骨架），而「div 汤」一切照常渲染，错了你也不报错。
- **现代化关注点**：`<search>` 元素（2023-10 起 Baseline 广泛可用）取代 `role="search"`；`<hgroup>` 语义已变（现在是「一个标题 + 若干 `<p>` 副标题」）；曾经的「文档大纲算法」**从未被任何浏览器实现**，现实里必须老老实实用 `h1`–`h6` 表达层级。

## 本叶地图

- [入门](./getting-started) —— 一份语义化页面骨架模板，逐块讲清每个分区元素为什么在那
- [为什么语义化](./guide-line/why-semantic) —— 可访问性 / SEO / 可维护性三笔账，以及「div 汤」的代价
- [分区元素与页面骨架](./guide-line/sectioning-elements) —— `header`·`nav`·`main`·`article`·`section`·`aside`·`footer` 的地标与嵌套规则
- [`article` vs `section` 判定](./guide-line/article-vs-section) —— 自包含可复用 vs 主题分组，以及什么时候根本该用 `<div>`
- [标题层级与文档大纲](./guide-line/headings-outline) —— `h1`–`h6` 的层级规则、已废弃的大纲算法史料与现实建议
- [易错语义](./guide-line/niche-semantics) —— `<search>`、`<address>`、`<hgroup>` 这三个最常被误用的元素
- [分组内容](./guide-line/grouping-content) —— `p`·`blockquote`·`figure`·`figcaption`·`hr`·`pre`，以及 `div` 作为最后手段
- [参考](./reference) —— 元素速查表 + 大纲规则 + 标准 / Baseline / 权威链接

## 文档地址

- [web.dev: Learn HTML — Semantic HTML](https://web.dev/learn/html/semantic-html)
- [web.dev: Learn HTML — Headings and sections](https://web.dev/learn/html/headings-and-sections)
- [MDN: HTML 元素参考（Sectioning）](https://developer.mozilla.org/en-US/docs/Web/HTML/Element)
- [WHATWG HTML Standard — Sections](https://html.spec.whatwg.org/multipage/sections.html)

## 幻灯片地址

<a href="/SlideStack/html-semantics-slide/" target="_blank">HTML 语义化与文档大纲</a>
