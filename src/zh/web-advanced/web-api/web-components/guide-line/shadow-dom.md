---
layout: doc
outline: [2, 3]
---

# Shadow DOM 封装与样式

> 基于 WHATWG HTML/DOM 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **四个术语**：**shadow host**（挂影子树的宿主节点）、**shadow tree**（影子树）、**shadow boundary**（影子边界）、**shadow root**（影子树根节点，`ShadowRoot` 实例）。
- **创建**：命令式 `el.attachShadow({ mode: "open" })`；声明式 `<template shadowrootmode="open">`（解析时自动转为影子根，详见[下一页](./templates-slots)）。
- **谁能挂**：自治自定义元素 + 一组白名单内置元素（`article`/`aside`/`blockquote`/`body`/`div`/`footer`/`h1`-`h6`/`header`/`main`/`nav`/`p`/`section`/`span`）；**每元素至多一棵影子树**，重复 `attachShadow()` 抛错（声明式影子根是唯一例外：被清空后返回）。
- **`mode: "open" | "closed"`**：open 时外部可经 `el.shadowRoot` 进入；closed 时 `el.shadowRoot` 返回 `null`。**closed 不是安全机制**（可被 `attachShadow` 补丁等手段绕过），内置元素级的"真隔离"做不到，常规组件用 open 即可。
- **`delegatesFocus: true`**：点击/聚焦宿主的不可聚焦区域时，焦点**自动委托**给影子树内第一个可聚焦元素，且宿主获得 `:focus`/`:focus-visible` 匹配——包装输入类组件的焦点体验标配。
- **其余选项**：`slotAssignment: "named" | "manual"`（插槽分发模式，见下一页）、`clonable`（`cloneNode()` 时是否连影子树一起克隆）、`serializable`（允许 `getHTML()` 序列化）、`customElementRegistry`（绑定局部注册表，见[上一页](./custom-elements)）。
- **JS 边界**：页面的 `document.querySelector()` **穿不进**影子树；进入唯一入口是 `el.shadowRoot`（open 时）；影子树内部用 `this.shadowRoot.querySelector()` 自查。
- **`getRootNode()`**：影子树内节点的 `node.getRootNode()` 返回所在 shadow root（而非 document）——判断"我在哪棵树里"的标准方法。
- **CSS 双向封装**：页面样式**选择器不进**影子树，影子树内 `<style>` 不外泄；但**可继承属性**（`color`/`font-family` 等）与 **CSS 自定义属性（变量）** 会沿 DOM **穿透边界继承**——这是留给主题定制的正门。
- **样式注入两手段**：影子树内放 `<style>`（声明式、简单直接）；**Constructable Stylesheets**——`new CSSStyleSheet()` + `sheet.replaceSync(css)` + `shadow.adoptedStyleSheets = [sheet]`（同一 sheet 多实例共享、只解析一次、改一处全生效）。
- **`:host` 三件套**：`:host` 选宿主自身；`:host(.foo)` 宿主匹配选择器时才命中；`:host-context(.dark)` 宿主的**祖先**匹配时命中（暗色主题适配惯用，注意 Firefox 长期未实现）。
- **`::slotted(selector)`**：影子树内样式化**被分发的 light DOM 节点**，只能选中**插槽的直接顶层节点**，选不到其后代；且只能作用于元素（文本节点不行）。
- **`::part()` + `exportparts`**：影子树内元素标 `part="label"`，外部用 `my-el::part(label)` 样式化——**官方外部样式接口**；嵌套组件用 `exportparts` 把内层 part 转发出来。
- **事件 retargeting**：影子树内冒泡出来的事件，在外部看 `event.target` 被**重定向为宿主元素**（封装不泄内部结构）；影子树内部监听时 target 不变。
- **`composed`**：事件能否**穿越影子边界**由 `composed` 标志决定——大多数 UI 原生事件（click 等）为 `true`；**`new CustomEvent()` 默认 `composed: false`**，组件对外发事件必须显式 `{ bubbles: true, composed: true }`，忘了就是"外面永远听不到"的经典坑。
- **`composedPath()`**：返回事件穿越的完整路径（含影子树内节点，closed 树的内部节点除外）；`path[0]` 可拿到真实起点。
- **`dir`/`lang` 继承**：影子树继承宿主的这两个属性语境，无需手动同步。

## 一、概念：一棵"挂在元素上的私有 DOM 树"

Shadow DOM 允许把一棵隐藏的 DOM 树挂到常规节点上**独立渲染**。浏览器自己早就在用这套机制——`<video>` 的控制条、`<input type="range">` 的滑轨，都是内置元素的影子树（在 DevTools 打开 "Show user agent shadow DOM" 可见）。Web Components 把同样的能力开放给了开发者。

```text
常规 DOM                          影子树
─────────                        ─────────
<body>
  └─ <user-card>  ←─ shadow host
        ╲ (shadow boundary)
         └─ #shadow-root  ←─ shadow root
              ├─ <style>…</style>
              ├─ <div class="name">…</div>
              └─ <slot>…</slot>
```

四个术语必须先立住：**shadow host**（宿主）、**shadow tree**（影子树）、**shadow boundary**（边界）、**shadow root**（影子根，`ShadowRoot` 实例）。封装的全部故事都发生在"边界"两侧。

## 二、attachShadow()：选项全解

```js
const shadow = el.attachShadow({
  mode: "open",              // 必填："open" | "closed"
  delegatesFocus: false,     // 焦点委托
  slotAssignment: "named",   // 插槽分发："named"（默认）| "manual"
  clonable: false,           // cloneNode() 时是否连影子树一起克隆
  serializable: false,       // 是否允许 getHTML() 序列化这棵影子树
  customElementRegistry: undefined, // 绑定局部注册表（Scoped Registries）
});
```

- **`mode: "open"`**：外部可以 `el.shadowRoot` 拿到影子根，DevTools、测试工具、集成方都友好——**常规组件的默认选择**。
- **`mode: "closed"`**：`el.shadowRoot` 返回 `null`。注意这**不是安全机制**——创建者自己持有的引用、对 `attachShadow` 打补丁等手段都能绕过，它表达的只是"请勿依赖内部结构"的强约定。内置元素那种真正无法触碰的隔离，作者代码做不到。
- **`delegatesFocus: true`**：宿主的不可聚焦区域被点击/调用 `focus()` 时，焦点自动落到影子树内**第一个可聚焦元素**上，同时宿主整体获得 `:focus` 样式匹配——自定义输入框、搜索框这类"包壳组件"的焦点体验必开项。
- **`slotAssignment`**：`"named"` 按 `slot`/`name` 属性自动分发（默认）；`"manual"` 改为用 `HTMLSlotElement.assign()` 手动指派，详见[下一页](./templates-slots)。
- **`clonable: true`**：`cloneNode(true)` 时影子树随之克隆（声明式影子根默认可克隆）。
- **`serializable: true`**：允许 `el.getHTML({ serializableShadowRoots: true })` 把影子树序列化输出——SSR/快照场景配套。
- **`customElementRegistry`**：把这棵影子树的自定义元素解析绑定到局部注册表，见[自定义元素页](./custom-elements)。

**限制**：并非任何元素都能挂影子树——**自治自定义元素**和一组白名单内置元素（`article`、`aside`、`blockquote`、`body`、`div`、`footer`、`h1`-`h6`、`header`、`main`、`nav`、`p`、`section`、`span`）可以；`<a>`、`<img>`、`<button>` 等不行（它们自己有内部结构或语义）。每个元素**至多一棵**影子树，对已有命令式影子根的元素再调 `attachShadow()` 抛 `NotSupportedError`（唯一例外：元素带**声明式**影子根时，`attachShadow()` 不抛错，而是**清空该影子根并返回**——这是 SSR 水合的关键行为，见下一页）。

## 三、对 JavaScript 的封装边界

页面脚本的常规 DOM 查询**止步于影子边界**：

```js
// 页面里有 <user-card>，其影子树内含 <span>
document.querySelectorAll("span"); // 找不到影子树里的 span

// open 模式的唯一入口
const card = document.querySelector("user-card");
card.shadowRoot.querySelectorAll("span"); // 能找到

// closed 模式
card.shadowRoot; // null，外部无门
```

反过来，影子树**内部**的代码用 `this.shadowRoot.querySelector()` 查自己的树，互不干扰。判断"某节点位于哪棵树"用 `getRootNode()`：

```js
innerSpan.getRootNode(); // 返回所在的 ShadowRoot（而非 document）
innerSpan.getRootNode({ composed: true }); // 穿透影子边界，返回最外层 document
```

`Node.isConnected` 对影子树内节点同样生效（宿主连着文档即为 `true`）。

## 四、对 CSS 的封装：边界内外与两条穿透通道

**双向隔离是默认行为**：

```css
/* 页面全局样式：选择器进不了影子树 */
span { color: blue; } /* 影子树内的 span 不受影响 */
```

影子树内的 `<style>` 同样只作用于本树。但有**两条设计好的穿透通道**，这是主题化的正门：

1. **可继承属性照常继承**：`color`、`font-family`、`line-height` 等可继承属性会从宿主继承进影子树——所以"组件字体跟随页面"不需要做任何事；
2. **CSS 自定义属性（变量）穿透边界**：外部定义的 `--brand-color` 在影子树内 `var(--brand-color)` 可读——**组件对外暴露"样式 API"的标准方式**。

```css
/* 页面侧：定调 */
user-card { --card-accent: #d33; }
```

```css
/* 影子树内：消费变量，并给默认值兜底 */
.name { color: var(--card-accent, #333); }
```

### 给影子树注入样式的两种手段

**手段一：影子树内直接放 `<style>`**（通常随 `<template>` 一起克隆）——声明式、直观，适合样式少、无需跨实例共享的组件。

**手段二：Constructable Stylesheets（可构造样式表）**——程序化创建样式表对象，多棵影子树**共享同一实例**：

```js
// 创建 + 填充（replaceSync 同步版 / replace 返回 Promise）
const sheet = new CSSStyleSheet();
sheet.replaceSync("span { color: red; border: 2px dotted black; }");

// 采纳：adoptedStyleSheets 是数组，可与其他 sheet 并存
shadow.adoptedStyleSheets = [sheet];
```

优势：浏览器**只解析一次**，成百上千个组件实例共享；运行时改 `sheet` 一处，所有采纳者同步生效。组件库的通用做法是"基础样式走共享 constructed sheet，实例级差异走 CSS 变量"。注意声明式 Shadow DOM 的 HTML 里**写不了** constructed sheet（它是纯 JS 对象），SSR 场景需在水合时补挂。

## 五、样式钩子：:host 系、::slotted()、::part()

影子树**内部**的样式表可用三组专属选择器：

```css
/* :host —— 选中宿主元素自身（从影子树内部"向外"给宿主设样式） */
:host {
  display: inline-block; /* 自定义元素默认 display:inline，几乎总要改 */
}

/* :host(selector) —— 宿主匹配 selector 时才命中：按宿主的类/属性变体 */
:host([disabled]) {
  opacity: 0.5;
  pointer-events: none;
}

/* :host-context(selector) —— 宿主的祖先匹配时命中：典型是主题适配 */
:host-context(.theme-dark) {
  background: #222;
}

/* ::slotted(selector) —— 样式化被分发进来的 light DOM 节点 */
::slotted(span) {
  color: #666;
}
```

三个高频注意点：

- `:host` 的优先级低于页面里直接写在宿主标签上的规则（外部可覆盖内部的宿主默认样式，符合"使用者说了算"的直觉）；
- **`::slotted()` 只能选中分发内容的顶层节点**——`::slotted(li)` 无效如果 `<li>` 是被分发 `<ul>` 的后代；也**只能选元素**，纯文本节点样式化不了（可继承属性除外）；
- `:host-context()` 在 **Firefox 长期未实现**，跨浏览器主题适配更稳的路线是 CSS 变量或宿主上的属性/类。

影子树**外部**想样式化内部结构，官方接口是 **`part` / `::part()`**：

```html
<!-- 影子树内：把允许外部定制的节点标上 part 名 -->
<template shadowrootmode="open">
  <label part="label">用户名</label>
  <input part="field" />
</template>
```

```css
/* 页面侧：显式样式化被导出的 part */
my-field::part(label) { font-weight: bold; }
my-field::part(field) { border-radius: 6px; }
```

**嵌套组件**的内层 part 默认不透传，外层需用 `exportparts` 显式转发（可改名）：

```html
<!-- 外层组件影子树内：把内层组件的 part 导出到更外层 -->
<inner-field exportparts="label, field:inner-field"></inner-field>
```

设计约定：**CSS 变量管"值"（颜色/尺寸），`::part()` 管"块"（某个内部元素的整体样式）**，二者构成组件的完整对外样式 API；`::part()` 之后还可接 `:hover`、`:state()` 等伪类。

## 六、事件：retargeting 与 composed

**Retargeting（重定向）**：影子树内元素触发的事件冒泡出边界后，外部监听器看到的 `event.target` **被替换为宿主元素**——外界不该知道（也不必知道）组件内部按钮长什么样。影子树**内部**的监听器看到的 `target` 仍是真实内部节点。

**composed 标志**决定事件是否有资格穿越边界：

- 大多数原生 UI 事件（`click`、`input`、`keydown` 等）`composed: true`，正常穿出；
- 少数如 `slotchange`、多数非 UI 事件不穿出；
- **`new CustomEvent()` 默认 `composed: false` 且 `bubbles: false`**——自定义组件对外派发事件的完整样板必须两者都开：

```js
// 组件内部：对外发事件的标准姿势
this.dispatchEvent(
  new CustomEvent("change", {
    bubbles: true,   // 允许冒泡
    composed: true,  // 允许穿越影子边界 —— 忘了它，外面永远听不到
    detail: { value: this._value },
  }),
);
```

需要"看穿"重定向时用 `event.composedPath()`：返回事件的完整传播路径数组，`composedPath()[0]` 是真实起点（closed 影子树的内部节点会被隐去）。`event.composed` 属性可查询事件本身的穿越资格。

## 七、易错点

- **自定义元素默认 `display: inline`**：影子树里写好的宽高布局"不生效"，九成是忘了 `:host { display: block }`。
- **closed 当安全机制**：closed 只挡 `el.shadowRoot` 这一条路，防不了有心人——它是 API 约定，不是沙箱。
- **CustomEvent 忘开 `composed`**：组件事件"外面监听不到"的第一嫌疑。
- **`::slotted()` 选后代**：只能选顶层被分发节点，`::slotted(.item span)` 这类写法无效。
- **全局样式失效的"惊讶"**：normalize.css、工具类框架（Tailwind 等）都进不了影子树——组件样式必须自带，或通过 constructed sheet 显式共享。
- **可继承属性"漏进来"的反向惊讶**：`color`/`font` 从页面继承进影子树是规范行为，要完全重置可在 `:host` 上 `all: initial`。
- **重复 `attachShadow()` 抛错**：`NotSupportedError`；只有声明式影子根允许被 `attachShadow()` "接管"（清空并返回）。

封装边界立好了，下一页解决"结构从哪来、外部内容怎么进来、以及不靠 JS 怎么直出这棵树"：[template、slot 与声明式 Shadow DOM](./templates-slots)。
