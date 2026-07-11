---
layout: doc
---

# Web Components

Web Components 是**浏览器原生的组件模型**：由 **Custom Elements**（自定义元素与生命周期）、**Shadow DOM**（DOM/样式封装）、**HTML templates**（`<template>` + `<slot>` 惰性模板与插槽）三项标准协同构成，让开发者不依赖任何框架就能创建"自带封装、可复用、语义化"的自定义 HTML 标签。核心三件已在全部主流浏览器**全绿多年**（Baseline Widely available）；近年短板也在快速补齐——**声明式 Shadow DOM**（`<template shadowrootmode>`）2024-08-05 达成 Baseline Newly available，补上了服务端渲染这块最大缺口；**ElementInternals / 表单关联自定义元素**自 Safari 16.4（2023-03）补齐后全绿；**Scoped Custom Element Registries** 由 Safari 26.0（2025-09）首发标准化实现、Chromium 跟进中，正在解决全局注册表名字冲突这一微前端痛点。

## 评价

**优点**

- **零依赖、跨框架、长寿命**：组件产物是标准 HTML 标签，Vue/Angular/React（19+）页面都能直接用，不随框架大版本迁移而报废——设计系统、跨团队组件库的天然载体
- **真封装**：Shadow DOM 提供浏览器级别的 DOM 与样式隔离（外部选择器进不来、内部样式出不去），不是约定式的 scoped class，而是硬边界
- **渐进增强友好**：`:defined` 伪类处理未升级状态、声明式 Shadow DOM 支持免 JS 首渲，服务端渲染 + 流式解析路线已经打通
- **表单与可访问性有正规接口**：`ElementInternals` 让自定义元素以一等公民身份参与表单提交/约束校验，并能设置默认 ARIA 语义而不污染 HTML 属性
- **标准演进仍在活跃推进**：`connectedMoveCallback()`（配合 `moveBefore()` 的状态保持移动）、Scoped Registries、`:state()` 自定义状态等新能力持续落地

**局限**

- **customized built-in elements 是死路**：`is=""` 属性 + `extends` 选项这条"扩展内置元素"路线被 WebKit/Safari 明确拒绝实现（standards-positions #97），跨浏览器实践中只能走自治自定义元素（autonomous）
- **原生 API 偏底层、样板代码多**：属性反射、attribute/property 同步、模板渲染都要手写，工程上通常配一层轻封装（如 [Lit](/zh/frontend-framework/ui/lit/)）而非裸写
- **样式封装是双刃剑**：全局主题/工具类 CSS 进不了 Shadow DOM，需要靠 CSS 自定义属性、`::part()` 等显式"开口"，设计系统的样式贯通需要额外设计
- **框架互操作曾长期有坑**：React 18 及之前对自定义元素的 property/事件绑定支持不完整（React 19 才补齐），存量项目仍需留意版本
- **心智占有率被框架挤压**：日常业务开发中组件问题已被 Vue/React 解决，Web Components 的主战场是跨框架共享、微前端、嵌入第三方页面等"框架管不到"的场景

一句话选型：**要在多框架/多团队/长生命周期场景交付同一套组件，或做嵌入式挂件（widget）时，Web Components 是标准答案**；单一框架的业务应用内部，直接用框架组件即可，不必为用而用。

## 本叶地图

- [入门](./getting-started) —— 定位（原生组件模型 vs 框架组件）、三大技术协作心智模型、第一个组件、何时用/何时不用、Baseline 支持现状
- [自定义元素与生命周期](./guide-line/custom-elements) —— 两类自定义元素与 WebKit 边界、命名与注册、构造函数约束、五个生命周期回调、升级机制、Scoped Registries、自定义状态
- [Shadow DOM 封装与样式](./guide-line/shadow-dom) —— attachShadow 全选项、JS/CSS 双向封装边界、样式注入手段、`:host` / `::slotted()` / `::part()` 样式钩子、事件 retargeting 与 composed
- [template、slot 与声明式 Shadow DOM](./guide-line/templates-slots) —— `<template>` 惰性内容与克隆、命名插槽/默认插槽/fallback、slotchange、手动插槽分配、声明式 Shadow DOM 与 SSR/流式/水合
- [表单参与、可访问性与框架互操作](./guide-line/forms-frameworks) —— ElementInternals、表单值提交与约束校验、表单生命周期回调、默认 ARIA 语义、Vue/React/Angular 互操作要点
- [参考](./reference) —— API 速查表 + 浏览器支持时间线 + 选型对比 + 易错点清单 + 资源链接

## 文档地址

[MDN Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)

## GitHub 地址

[WICG/webcomponents](https://github.com/WICG/webcomponents)（提案与孵化仓库）

## 幻灯片地址

<a href="/SlideStack/web-components-slide/" target="_blank">Web Components</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=web-components" target="_blank" rel="noopener noreferrer">Web Components 测试题</a>
