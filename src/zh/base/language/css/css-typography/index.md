---
layout: doc
---

# CSS 文字排版与字体

网页上 90% 的信息是文字，而「文字长什么样、用什么字体、行距多宽、装不下时怎么折」全部由 CSS 排版属性决定。本叶从「怎么把一款自定义字体装进页面」（`@font-face`、可变字体）讲到「怎么让它快速、不抖动地显示」（`font-display`、`preload`、FOUT/FOIT），再到「怎么把每一行字调到既好看又好读」（`line-height`、`letter-spacing`、`text-wrap: balance/pretty`），最后讲透列表标记与计数器这套「自动编号」的生成内容机制。一句话：把网页文字从「能看」调到「专业」。

## 概述

- **它管什么**：用哪款字体渲染文字（字体族 + `@font-face` + 可变字体）、字体加载时屏幕上先显示什么（`font-display` 的 FOUT/FOIT 取舍）、每一行字的疏密与对齐（行距、字距、对齐、缩进、装饰、大小写转换）、一行装不下时怎么折行或截断（`text-overflow` / `white-space` / `overflow-wrap` / `word-break` / `hyphens` / `text-wrap`）、列表前面的圆点和编号长什么样（`::marker` + 计数器）。
- **为什么值得认真学**：排版是「细节决定专业度」的重灾区——字体加载策略选错，首屏要么白屏一片（FOIT）要么文字跳一下（CLS）；`line-height` 用了带单位的值，子元素继承后行距全乱；长 URL 不设 `overflow-wrap` 直接撑破容器；标题折行折得参差不齐却不知道有 `text-wrap: balance` 一行能治。这些坑大多**不报错**，只是页面看起来「差一口气」。
- **现代化关注点**：可变字体（一个文件覆盖全部字重/字宽，Baseline 广泛可用）、`font-display: swap/optional`（控制加载期闪烁）、`size-adjust` 与 `ascent-override` 系列（对齐回退字体度量、压 CLS）、`text-wrap: balance`（标题均衡折行，Baseline 2024）、`text-wrap: pretty`（正文消除孤行，Baseline 新近可用）、`::marker`（直接给列表标记上色/换内容）、`@counter-style`（自定义编号样式）。

## 本叶地图

- [入门](./getting-started) —— 一套「装字体 → 调排版 → 防截断」的最小可用配方，把本叶各页串成一条主线
- [字体族与 `@font-face`](./guide-line/font-face-variable) —— 通用字体族、系统字体栈、`@font-face` 加载自定义字体、可变字体与 `font-variation-settings`
- [字体加载与性能](./guide-line/font-loading) —— `font-display` 五取值、`preload` 预加载、FOUT vs FOIT、用度量覆盖压 CLS
- [行距·字距·对齐与装饰](./guide-line/line-spacing-align) —— `line-height`、`letter-spacing` / `word-spacing`、`text-align`、`text-indent`、`text-decoration`、`text-transform`
- [截断·折行·断词](./guide-line/text-overflow-wrap) —— `text-overflow`、`white-space`、`overflow-wrap`、`word-break`、`hyphens`、`text-wrap: balance/pretty`
- [列表样式与 `::marker`](./guide-line/list-marker) —— `list-style-*` 三件套、`::marker` 直接样式化标记、列表标记内外定位
- [计数器与生成内容](./guide-line/counters) —— `counter-reset` / `counter-increment`、`counter()` / `counters()`、嵌套编号、`@counter-style`
- [参考](./reference) —— 速查表 + 字体族表 + `@font-face` 描述符表 + 折行属性表 + 标准 / Baseline / 权威链接

## 文档地址

- [web.dev: Learn CSS — Typography](https://web.dev/learn/css/typography)
- [MDN: CSS fonts（模块参考）](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_fonts)
- [MDN: `@font-face`](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face) · [`text-wrap`](https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap)
- [MDN: Using CSS counters](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_counter_styles/Using_CSS_counters)

## 幻灯片地址

<a href="/SlideStack/css-typography-slide/" target="_blank">CSS 文字排版与字体</a>
