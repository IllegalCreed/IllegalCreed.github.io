---
layout: doc
---

# JavaScript DOM 与事件

浏览器把你写的 HTML 解析成一棵活的对象树——这就是 **DOM**（Document Object Model，文档对象模型）。页面上看得见的每个标签、每段文字、每条注释，都是树上的一个**节点**对象；JavaScript 通过 `document` 这个入口，就能查找、读写、增删这些节点，把静态页面变成可交互的应用。而用户的每一次点击、敲键、提交、滚动，浏览器都会派发一个**事件**沿着这棵树传播——你只要在合适的节点挂上监听器，就能在对的时刻跑对的逻辑。本叶把「操作 DOM 树」与「响应事件」这两件前端基本功讲透：从节点类型与遍历、创建与插入、属性与样式，到事件三阶段、`addEventListener`、事件委托，再到表单事件与脚本加载时机。

## 概述

- **它管什么**：用 `document` 找到并修改页面里的节点（查找 / 遍历 / 创建 / 插入 / 删除 / 读写属性与样式），以及监听并响应用户与浏览器派发的事件（点击 / 输入 / 提交 / 页面加载等）。这两件事合起来，就是「让页面动起来」的最底层能力。
- **为什么值得认真学**：所有前端框架（Vue / React）最终都落到这套 DOM API 与事件模型之上——`v-on` / `onClick` 是对 `addEventListener` 的封装，虚拟 DOM diff 之后调用的仍是 `append` / `remove` / `textContent`。看懂这一层，框架的「魔法」就变成了可推理的机制；遇到「事件没触发」「`innerHTML` 注入风险」「脚本拿不到元素」这类问题也能直接定位。
- **现代化关注点**：统一用 `querySelector` / `querySelectorAll`（CSS 选择器）查找而非老式 `getElementBy*`；用 `append` / `prepend` / `before` / `after` / `remove` 这套现代节点 API 取代 `appendChild` / `removeChild`；用 `classList` 与 `dataset` 取代手拼 `className` 字符串；区分 `textContent`（安全）与 `innerHTML`（有 XSS 风险）；事件统一用 `addEventListener` 并善用**事件委托**；脚本统一用 `defer` / `type="module"` 控制加载时机，从根上避免「DOM 还没就绪」。

## 本叶地图

- [入门](./getting-started) —— 从「DOM 是什么」切入，一段最小脚本串起查找节点、改内容、绑事件三条主线
- [DOM 树与遍历](./guide-line/dom-tree-traversal) —— 节点类型、`document` 入口、`querySelector*` / `getElementBy*` 查找、树的遍历属性
- [修改文档](./guide-line/modifying-document) —— 创建 / 插入 / 删除节点、`textContent` vs `innerHTML`、`DocumentFragment` 批量插入
- [属性、特性与样式](./guide-line/attributes-styles) —— 特性（attribute）vs 属性（property）、`dataset`、`classList`、`style` 与 `getComputedStyle`、尺寸坐标
- [事件机制](./guide-line/event-mechanism) —— 事件三阶段（捕获 / 目标 / 冒泡）、`addEventListener`、`event` 对象、`stopPropagation` / `preventDefault`
- [事件委托](./guide-line/event-delegation) —— 用冒泡把多元素的处理收拢到一个父节点、`closest` 定位、自定义事件 `CustomEvent` 与 `dispatchEvent`
- [表单事件与页面加载](./guide-line/forms-page-load) —— 表单与控件事件（`input` / `change` / `submit` / `focus`）、`DOMContentLoaded` vs `load`、`defer` / `async` 脚本时机
- [参考](./reference) —— 查找 / 修改 / 事件速查表 + 各特性 Baseline 状态 + 标准与调试链接

## 文档地址

- [MDN: Document Object Model (DOM)](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model)
- [MDN: DOM 介绍](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction)
- [javascript.info: Document（DOM 部分）](https://javascript.info/document)
- [javascript.info: Introduction to browser events](https://javascript.info/introduction-browser-events)

## 幻灯片地址

<a href="/SlideStack/js-dom-events-slide/" target="_blank">JavaScript DOM 与事件</a>
