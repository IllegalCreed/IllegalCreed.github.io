---
layout: doc
outline: [2, 3]
---

# 入门：定位、三大技术与第一个组件

> 基于 WHATWG HTML/DOM 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **一句话定位**：Web Components 是**浏览器原生的组件模型**，用标准 API 创建"自带封装、可复用"的自定义 HTML 标签，不依赖任何框架运行时。
- **三大技术**：**Custom Elements**（JS API：定义元素类 + 生命周期回调）、**Shadow DOM**（挂一棵隔离渲染的"影子"DOM 树，脚本与样式私有化）、**HTML templates**（`<template>` 惰性标记 + `<slot>` 内容投影）。
- **三者关系**：可各自独立使用，组合才是完整组件——Custom Elements 给"名字与行为"，Shadow DOM 给"封装边界"，`<template>`/`<slot>` 给"结构与内容分发"。
- **最小四步**：写 `class extends HTMLElement` → `customElements.define("my-el", 类)` → 类内 `this.attachShadow({ mode: "open" })` 挂影子树 → HTML 里当普通标签用 `<my-el>`。
- **命名铁律**：自定义元素名必须**小写字母开头且含连字符**（如 `user-card`），这是与内置标签的命名空间隔离，违反则 `define()` 抛错。
- **只走 autonomous 路线**：自治自定义元素（继承 `HTMLElement`）全绿可移植；customized built-in（`is=""` + `extends`）被 **WebKit/Safari 明确拒绝实现**，跨浏览器实践视为死路，详见[自定义元素页](./guide-line/custom-elements)。
- **构造函数三禁**：必须先 `super()`；不得读取属性/子节点；不得添加属性/子节点——初始化逻辑放 `connectedCallback()`。
- **生命周期五回调**：`connectedCallback` / `disconnectedCallback` / `attributeChangedCallback`（配 `static observedAttributes`）/ `adoptedCallback` / `connectedMoveCallback`（新，配 `moveBefore()`）。
- **vs 框架组件**：框架组件活在框架运行时里，跨框架不可复用；Web Components 产物是标准 DOM 标签，**Vue/Angular 满分支持，React 19 起完整支持**（custom-elements-everywhere 结论）。
- **vs Lit**：Lit 是"写 Web Components 的轻量库"（响应式属性 + 声明式模板，约 5KB），产物仍是标准自定义元素——裸写样板多时的工程化首选，本站有[独立 Lit 叶](/zh/frontend-framework/ui/lit/)，本叶只讲原生标准。
- **适用场景**：跨框架/跨团队组件库与设计系统、微前端共享组件、嵌入第三方页面的挂件（widget）、长生命周期项目的"防框架报废"层。
- **不适用场景**：单一框架的业务应用内部组件（框架组件更顺手）、重度依赖全局样式贯通且不想设计样式开口的场景。
- **Baseline 现状**：核心三件（Custom Elements/Shadow DOM/template）**全浏览器多年全绿**；声明式 Shadow DOM **2024-08-05 Baseline Newly available**；`ElementInternals` 表单关联 Safari 16.4（2023-03）补齐后全绿；Scoped Registries Safari 26.0（2025-09）首发、Chromium 跟进中。
- **样式封装要点**：外部 CSS 进不了 Shadow DOM、内部样式不外泄；对外样式开口靠 **CSS 自定义属性穿透**与 **`::part()`**，详见 [Shadow DOM 页](./guide-line/shadow-dom)。
- **SSR 路线**：`<template shadowrootmode="open">` 声明式 Shadow DOM 让服务端直出组件内部结构，**免 JS 首渲**，详见 [templates 页](./guide-line/templates-slots)。
- **FOUC 防御**：元素定义（JS）加载前标签是"未升级"状态，用 CSS `my-el:not(:defined) { visibility: hidden }` 或骨架样式兜底。
- **进阶顺序**：本页 → [自定义元素与生命周期](./guide-line/custom-elements) → [Shadow DOM](./guide-line/shadow-dom) → [template 与 slot](./guide-line/templates-slots) → [表单与框架互操作](./guide-line/forms-frameworks) → [参考](./reference)。

## 一、定位：浏览器原生的组件模型

"组件化"这件事，Vue/React 等框架早已解决得很好——但它们的组件只活在**各自的运行时**里：Vue 组件不能直接扔进 React 项目，框架大版本升级还可能让整套组件库跟着重写。Web Components 解决的是另一个层面的问题：**把"组件"下沉为浏览器标准能力**，产物是一个标准 HTML 标签，任何页面、任何框架（或没有框架）都能直接使用：

```html
<!-- 用起来和 <video>、<details> 这些内置标签没有区别 -->
<user-card name="张三" avatar="/avatar.png"></user-card>
```

它由三项独立又互补的标准构成（MDN 官方口径）：

| 技术 | 标准归属 | 解决什么 |
| --- | --- | --- |
| **Custom Elements** | WHATWG HTML | 定义新标签的**行为**：元素类、注册表、生命周期回调、升级机制 |
| **Shadow DOM** | WHATWG DOM | 给元素挂一棵**隔离渲染**的影子 DOM 树：外部 JS/CSS 进不来、内部不外泄 |
| **HTML templates** | WHATWG HTML | `<template>` 定义**不渲染的惰性标记**供克隆复用；`<slot>` 把使用者提供的内容**投影**进影子树 |

三者可以各自单独使用（比如只用 `<template>` 做惰性模板、只用 Shadow DOM 做样式隔离），但组合起来才构成完整的组件模型。

## 二、心智模型：三大技术如何协作

一个典型 Web Component 的生产分工：

1. **Custom Elements 给"身份"**：`class UserCard extends HTMLElement` 定义行为，`customElements.define("user-card", UserCard)` 在注册表登记名字。从此浏览器解析到 `<user-card>` 就实例化这个类，并在恰当时机调用生命周期回调。
2. **Shadow DOM 给"边界"**：类内部 `this.attachShadow({ mode: "open" })` 创建影子根（shadow root），组件的内部结构和样式都放在这棵影子树里——页面全局 CSS 选择器进不来，组件内部的 `<style>` 也不会污染页面。
3. **template/slot 给"结构与开口"**：内部结构可以从 `<template>` 克隆而来（解析一次、多实例复用）；`<slot>` 则在影子树里留出插槽，把使用者写在标签之间的内容（light DOM，光明 DOM）投影到指定位置。

关键术语先建立：**shadow host**（挂影子树的宿主元素，通常就是自定义元素本身）、**shadow root**（影子树的根节点）、**shadow tree**（影子树）、**light DOM**（使用者写在宿主标签内的常规子节点，经 `<slot>` 分发进影子树渲染）。

## 三、第一个组件

一个完整可运行的例子——带样式封装和插槽的 `user-card`（保存为单个 HTML 文件即可在浏览器打开验证）：

```html
<!-- 使用侧：属性传简单数据，标签体内容走插槽 -->
<user-card name="张三">
  <span slot="title">高级前端工程师</span>
</user-card>

<script>
  // 1. 定义元素类：自治自定义元素只能继承 HTMLElement
  class UserCard extends HTMLElement {
    // 声明要观察的属性，attributeChangedCallback 只对这里列出的属性触发
    static observedAttributes = ["name"];

    constructor() {
      super(); // 必须首先调用 super()
      // 2. 挂载影子树：内部结构与样式从此与页面隔离
      const shadow = this.attachShadow({ mode: "open" });
      shadow.innerHTML = `
        <style>
          /* :host 选中宿主元素自身；这些样式绝不会泄漏到页面 */
          :host { display: inline-block; border: 1px solid #ccc;
                  border-radius: 8px; padding: 12px; font-family: sans-serif; }
          .name { font-weight: bold; font-size: 1.1em; }
          ::slotted(span) { color: #666; font-size: 0.9em; } /* 样式化被分发的插槽内容 */
        </style>
        <div class="name"></div>
        <slot name="title">未填写头衔</slot> <!-- 插槽 fallback 内容 -->
      `;
    }

    // 3. 观察到的属性变化（含初始解析）都会走这里，用它同步渲染
    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "name") {
        this.shadowRoot.querySelector(".name").textContent = newValue ?? "";
      }
    }

    connectedCallback() {
      // 挂入文档后才适合做"读属性/子节点"之类的初始化
      console.log("user-card 已连接到文档");
    }
  }

  // 4. 注册：名字必须小写开头且含连字符
  customElements.define("user-card", UserCard);
</script>
```

几个第一次接触就该记住的事实：

- **`define()` 可以晚于标签出现**：HTML 里先写 `<user-card>`、JS 后加载也没问题——浏览器先把它当"未知元素"占位，`define()` 之后自动**升级**（upgrade）为完整组件。升级前可用 CSS `user-card:not(:defined)` 做骨架/隐藏，避免闪烁。
- **属性传字符串，property 传对象**：HTML attribute 只能是字符串；要传对象/数组/函数，应该在 JS 里给元素实例设 property（`el.data = {...}`）——这正是后面框架互操作差异的根源。
- **构造函数里不要碰属性和子节点**：规范明确要求（此时它们还不可用/不该存在），读取属性、操作 light DOM 的初始化一律放 `connectedCallback()`。

## 四、何时用 / 何时不用

**适合**：

- **跨框架组件库/设计系统**：一套组件同时服务 Vue、React、Angular 项目（custom-elements-everywhere 实测 Vue/Angular 满分，React 19 起完整支持）
- **微前端**：不同子应用技术栈各异，共享组件用标准标签交付最稳（Scoped Registries 进一步解决多版本共存的命名冲突）
- **嵌入第三方页面的挂件**：评论框、客服气泡、支付按钮——Shadow DOM 保证宿主页面的 CSS 再乱也砸不进来
- **长生命周期项目**：标准标签不随框架世代更替报废

**不适合**：

- **单一框架应用的内部组件**：框架组件在响应式、状态管理、模板表达力上更顺手，没必要为用而用
- **需要全局样式随意贯通的场景**：Shadow DOM 的硬边界意味着主题/工具类 CSS 必须通过 CSS 自定义属性、`::part()` 等**显式开口**进入，未做此设计时会觉得处处受阻
- **裸写大型组件库**：原生 API 的属性反射、模板更新都是手工活，工程上建议上 [Lit](/zh/frontend-framework/ui/lit/) 这类轻封装（产物仍是标准自定义元素）

## 五、浏览器支持与 Baseline 现状

| 能力 | 状态（核于 2026-07） |
| --- | --- |
| Custom Elements（autonomous）/ Shadow DOM / `<template>`/`<slot>` | **全浏览器多年全绿**（Baseline Widely available） |
| 声明式 Shadow DOM（`<template shadowrootmode>`） | **Baseline Newly available 2024-08-05**（Chrome/Edge 111、Firefox 123、Safari 16.4） |
| `ElementInternals` / 表单关联自定义元素 | Safari 16.4（2023-03）补齐后**全绿** |
| customized built-in elements（`is=""` + `extends`） | **WebKit/Safari 明确拒绝实现**，跨浏览器不可用，视为死路 |
| `connectedMoveCallback()`（配 `moveBefore()`） | 新近落地，各浏览器支持中 |
| Scoped Custom Element Registries | **Safari 26.0（2025-09）首发标准化版本**，26.4 扩展 `initialize()` 等；Chromium 原型跟进中 |

结论：**"能不能用 Web Components"在 2026 年已不是问题**——核心能力全绿，SSR（声明式 Shadow DOM）与表单参与（ElementInternals）两块历史短板都已补齐；真正要想清楚的是"该不该用"（见上一节）与"哪些子特性还不能跨浏览器"（`is=""` 死路、Scoped Registries 尚新）。

下一页从组件模型的地基讲起——两类自定义元素、注册与命名、构造函数约束和五个生命周期回调：[自定义元素与生命周期](./guide-line/custom-elements)。
