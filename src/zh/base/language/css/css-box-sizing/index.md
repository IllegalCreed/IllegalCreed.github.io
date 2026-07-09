---
layout: doc
---

# CSS 盒模型与尺寸

页面上每一个元素，浏览器都把它当成一个**矩形盒子**来摆放——盒子由内到外是内容、内边距、边框、外边距四层；而「这个盒子有多大、怎么算大小、装不下时怎么办」，则由 `box-sizing`、`width` / `min-*` / `max-*`、`aspect-ratio`、`overflow` 这一组属性共同决定。本叶把 CSS 布局最底层的这套「盒子怎么量、怎么排、怎么溢出」讲透——它是 Flex 与 Grid 之前，每个开发者都绕不开的地基。

## 概述

- **它管什么**：一个元素占多大空间（盒模型四层 + `box-sizing`）、它在文档流里是块还是行（`display` 的内外显示类型）、相邻盒子的外边距怎么合并（margin collapse / BFC）、尺寸由内容还是由容器决定（内在尺寸关键字）、装不下时是裁切还是滚动（`overflow`）。
- **为什么值得认真学**：盒模型是 CSS 一切布局的原子。`box-sizing` 选错，宽度算多算少、布局溢出；不懂外边距合并，会反复纠结「我明明设了 margin 怎么没生效」；不懂 BFC，清浮动只会瞎试 `overflow: hidden`；`overflow` 用错，要么裁掉内容要么平白多出滚动条。这些坑都**不报错**，只是页面悄悄歪掉。
- **现代化关注点**：全局 `box-sizing: border-box` 配方（事实标准）、`display: flow-root`（2019 起 Baseline，专为开 BFC 而生，取代 `overflow` 黑魔法）、内在尺寸关键字 `min-content` / `max-content` / `fit-content`（Baseline 广泛可用）、`aspect-ratio`（Baseline 2021，防图片 CLS 的现代答案）、`scrollbar-gutter`（Baseline 2024，防滚动条挤动布局）、`overscroll-behavior`（控制滚动链，尚非 Baseline）。

## 本叶地图

- [入门](./getting-started) —— 用一张盒模型图 + 一段全局 `border-box` 配方，把本叶各页串成一条主线
- [盒模型与 box-sizing](./guide-line/box-model) —— 内容 / 内边距 / 边框 / 外边距四层，`content-box` vs `border-box`，全局重置配方
- [display 全谱](./guide-line/display-values) —— 外显示类型 vs 内显示类型，`block` / `inline` / `inline-block` / `flow-root` / `none` / `contents`
- [外边距合并与 BFC](./guide-line/margin-collapse-bfc) —— 三种合并场景、负 margin 规则，以及 BFC 如何清浮动、止合并
- [尺寸与内在尺寸关键字](./guide-line/sizing-keywords) —— `width` / `min-*` / `max-*` 与百分比，`min-content` / `max-content` / `fit-content`
- [`aspect-ratio` 与现代尺寸](./guide-line/aspect-ratio) —— 宽高比一行搞定，配合占位防累积布局偏移（CLS）
- [overflow 与滚动容器](./guide-line/overflow-scroll) —— `overflow` 五取值、滚动容器、`scrollbar-gutter`、`overscroll-behavior`
- [参考](./reference) —— 速查表 + 盒模型图 + display 表 + 尺寸关键字表 + 标准 / Baseline / 权威链接

## 文档地址

- [web.dev: Learn CSS — Box Model](https://web.dev/learn/css/box-model)
- [web.dev: Learn CSS — Sizing](https://web.dev/learn/css/sizing) · [Overflow](https://web.dev/learn/css/overflow)
- [MDN: CSS box model（模块参考）](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_box_model)
- [MDN: `box-sizing`](https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing) · [`display`](https://developer.mozilla.org/en-US/docs/Web/CSS/display) · [`aspect-ratio`](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio)

## 幻灯片地址

<a href="/SlideStack/css-box-sizing-slide/" target="_blank">CSS 盒模型与尺寸</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=css-%E7%9B%92%E6%A8%A1%E5%9E%8B%E4%B8%8E%E5%B0%BA%E5%AF%B8" target="_blank" rel="noopener noreferrer">CSS 盒模型与尺寸 测试题</a>
