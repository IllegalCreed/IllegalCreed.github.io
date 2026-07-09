---
layout: doc
---

# HTML 交互元素与全局属性

过去要做一个「点击展开」的折叠面板、一个「弹出在所有内容之上」的对话框或菜单，几乎都得手写 JavaScript：自己管开关状态、自己处理 `Esc` 关闭、自己把焦点困在弹层里、自己加一层背景遮罩。现在 HTML 把这些「交互行为」沉到了平台层——`details` / `summary` 折叠、`dialog` 模态对话框、`popover` 弹层、`command` / `commandfor` 声明式调用，配合 `inert`、`tabindex`、`autofocus` 这些**全局属性**与 `:focus-visible` 等伪类，让你少写大量脚本就能得到正确、可访问、键盘友好的交互。本叶讲透这套「现代交互元素 + 全局属性 + HTML 层可访问性」的基础设施。

## 概述

- **它管什么**：浏览器原生提供的交互控件（折叠、对话框、弹层）、跨所有元素通用的「全局属性」（`id` / `class` / `data-*` / `hidden` / `contenteditable` / `inert` / `popover`…）、焦点如何在键盘下流动，以及如何用最少的 ARIA 把这一切做得可访问。
- **为什么值得认真学**：这些原生能力**自带**了焦点管理、`Esc` 关闭、`backdrop` 遮罩、顶层渲染、可访问语义——自己用 `div` 重写一遍不仅代码多，还极易漏掉无障碍细节（焦点逃逸、读屏器读不出、键盘点不到）。用对原生元素，是「写得更少、做得更对」。
- **现代化关注点**：`dialog`（Baseline 2022）、`inert`（Baseline 2023）、`popover` API（Baseline 2025）、`details` 的 `name` 手风琴（2024 起）、以及很新的 `command` / `commandfor` 声明式调用（2025 起，多数浏览器刚跟上，**必须能降级**）。这些特性新旧不一，下笔处处标注 Baseline 现状与回退。

## 本叶地图

- [入门](./getting-started) —— 用一个「折叠 + 对话框 + 弹层 + 焦点」的小例子，串起本叶四类原生交互
- [`details` / `summary` 折叠](./guide-line/details-summary) —— `open`、`name` 手风琴（2024）、`toggle` 事件、自定义箭头
- [`dialog` 模态对话框与 `inert`](./guide-line/dialog-inert) —— `showModal` / `show` / `close`、`::backdrop`、`method="dialog"` 返回值、`inert` 背景失活
- [`popover` 与 `command` 调用](./guide-line/popover-command) —— `popover=auto/manual`、`popovertarget`、以及 `command` / `commandfor` 声明式调用者 API
- [焦点管理](./guide-line/focus-management) —— `tabindex` 三类取值、`autofocus`、`inert`、焦点顺序、`:focus-visible`
- [全局属性精要](./guide-line/global-attributes) —— `id` / `class` / `data-*` / `hidden` / `contenteditable` / `enterkeyhint` / `inputmode` / `popover` / `inert` 等
- [HTML 层可访问性](./guide-line/html-a11y) —— `role` / `aria-*` 基础、ARIA 第一条规则「能用原生就别用 ARIA」、ARIA in HTML 规则
- [参考](./reference) —— 速查表 + 交互元素表 + 全局属性表 + Baseline 状态表 + 权威链接

## 文档地址

- [web.dev: Learn HTML — Focus](https://web.dev/learn/html/focus)
- [MDN: `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) · [`<details>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details) · [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
- [MDN: HTML 全局属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes)
- [WHATWG HTML Standard — Interactive elements](https://html.spec.whatwg.org/multipage/interactive-elements.html)

## 幻灯片地址

<a href="/SlideStack/html-interactive-global-slide/" target="_blank">HTML 交互元素与全局属性</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=html-%E4%BA%A4%E4%BA%92%E5%85%83%E7%B4%A0%E4%B8%8E%E5%85%A8%E5%B1%80%E5%B1%9E%E6%80%A7" target="_blank" rel="noopener noreferrer">HTML 交互元素与全局属性 测试题</a>
