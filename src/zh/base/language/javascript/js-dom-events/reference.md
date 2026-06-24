---
layout: doc
outline: [2, 3]
---

# 参考

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **查找**首选 `querySelector` / `querySelectorAll`（CSS 选择器、静态集合）；辅助 `matches` / `closest` / `contains`
- **遍历**只看元素：`children` / `firstElementChild` / `nextElementSibling` / `parentElement`
- **改内容**：纯文本 `textContent`（安全）、HTML `innerHTML`（含用户输入有 **XSS**）
- **增删**：`createElement` 造、`append` / `before` / `after` 插、`remove` 删、`DocumentFragment` 批量
- **属性**：`el.value`（当前值）/ `dataset`（`data-*`）/ `getAttribute`；**类**用 `classList`、**样式**用 `style` + `getComputedStyle`
- **事件**：统一 `addEventListener`；`event.target`（源）vs `currentTarget`（绑监听者）；`preventDefault` 阻默认 / `stopPropagation` 阻传播（慎用）
- **委托**：祖先一个监听 + `target.closest(选择器)`；自定义事件 `CustomEvent` + `dispatchEvent`
- **加载**：`DOMContentLoaded`（DOM 就绪）/ `load`（全资源）；脚本用 `defer` / `type="module"`

## 查找方法速查

| 方法 | 按什么查 | 能在元素上调用 | 集合类型 |
| --- | --- | --- | --- |
| `querySelector(css)` | CSS 选择器 | ✔ | 单个元素 / `null` |
| `querySelectorAll(css)` | CSS 选择器 | ✔ | **静态** `NodeList` |
| `getElementById(id)` | id | ✘（仅 `document`） | 单个元素 / `null` |
| `getElementsByTagName(tag)` | 标签名 / `"*"` | ✔ | **实时** `HTMLCollection` |
| `getElementsByClassName(cls)` | 类名 | ✔ | **实时** `HTMLCollection` |
| `getElementsByName(name)` | name 特性 | ✘（仅 `document`） | **实时** `HTMLCollection` |
| `elem.matches(css)` | 自身是否匹配 | ✔ | 布尔 |
| `elem.closest(css)` | 向上找最近匹配（含自身） | ✔ | 元素 / `null` |
| `parent.contains(node)` | 是否包含 | ✔ | 布尔 |

## 遍历属性速查

| 维度 | 全部节点（含文本 / 注释） | 只看元素 |
| --- | --- | --- |
| 父 | `parentNode` | `parentElement` |
| 子集合 | `childNodes`（实时） | `children` |
| 首 / 末子 | `firstChild` / `lastChild` | `firstElementChild` / `lastElementChild` |
| 前 / 后兄弟 | `previousSibling` / `nextSibling` | `previousElementSibling` / `nextElementSibling` |
| 有无子 | `hasChildNodes()` | `children.length` |

根入口：`document.documentElement`（`<html>`）、`document.head`、`document.body`。
节点类型 `nodeType`：`1`=元素、`3`=文本、`8`=注释、`9`=文档。

## 修改文档速查

| 操作 | 现代写法 | 老式写法 |
| --- | --- | --- |
| 造元素 / 文本 | `createElement(tag)` / `createTextNode(t)` | — |
| 插到内部末尾 | `parent.append(...)` | `parent.appendChild(node)` |
| 插到内部开头 | `parent.prepend(...)` | — |
| 插到前 / 后 | `node.before(...)` / `node.after(...)` | `parent.insertBefore(node, ref)` |
| 替换 | `node.replaceWith(...)` | `parent.replaceChild(new, old)` |
| 删除 | `node.remove()` | `parent.removeChild(node)` |
| 插 HTML 串 | `elem.insertAdjacentHTML(where, html)` | （`innerHTML +=`，不推荐） |
| 克隆 | `elem.cloneNode(true/false)` | — |

`insertAdjacentHTML` 位置：`"beforebegin"`（元素前）/ `"afterbegin"`（内容头）/ `"beforeend"`（内容尾）/ `"afterend"`（元素后）。
内容设置：`textContent`（纯文本，安全）vs `innerHTML`（解析 HTML，含用户输入有 XSS）。批量插入用 `DocumentFragment`。

## 属性 / 特性 / 样式速查

| 需求 | API |
| --- | --- |
| 读控件当前值 | `el.value`（文本）/ `el.checked`（布尔）/ `select.value` |
| 读写非标准特性 | `getAttribute` / `setAttribute` / `hasAttribute` / `removeAttribute` |
| 自定义数据 | `el.dataset.xxx` ↔ `data-xxx`（连字符转驼峰） |
| 增删类 | `classList.add` / `remove` / `toggle` / `contains`；整串 `className` |
| 改内联样式 | `el.style.属性`（驼峰，如 `backgroundColor`）；整串 `style.cssText` |
| 读最终样式 | `getComputedStyle(el).属性`（只读、解析值、用完整属性名） |
| 量尺寸 | `offsetWidth/Height`、`clientWidth/Height` |
| 量坐标 | `getBoundingClientRect()`（视口坐标）、`scrollTop` / `scrollHeight` |

要点：**特性=HTML 里写的字符串、属性=DOM 对象上的任意类型**；`value` 特性=初始值、属性=当前值；`href` 特性=原样、属性=完整 URL。

## 事件速查

**绑定 / 解绑**

```js
elem.addEventListener(type, handler, { capture, once, passive });
elem.removeEventListener(type, handler, options); // handler 须同一引用
```

**`event` 对象常用字段**

| 字段 / 方法 | 含义 |
| --- | --- |
| `event.type` | 事件类型字符串（如 `"click"`） |
| `event.target` | 真正触发事件的元素（事件源） |
| `event.currentTarget` | 当前处理事件的元素（= 绑监听者 = `this`） |
| `event.clientX` / `clientY` | 鼠标相对视口坐标 |
| `event.preventDefault()` | 阻止浏览器默认动作（跳转 / 提交 / 右键菜单等） |
| `event.stopPropagation()` | 阻止继续传播（慎用，破坏委托） |
| `event.stopImmediatePropagation()` | 连同元素上其它监听器一并停止 |
| `event.isTrusted` | 真实用户事件 `true`，脚本派发 `false` |

**三阶段**：捕获（`document`→目标）→ 目标 → 冒泡（目标→`document`）；`addEventListener` 默认在**冒泡**阶段，传 `{ capture: true }` 改捕获阶段。

**自定义事件**

```js
const ev = new CustomEvent("my:event", { detail: { x: 1 }, bubbles: true });
elem.dispatchEvent(ev); // 同步派发
// 监听：addEventListener("my:event", e => e.detail.x)
```

## 常用事件名速查

| 类别 | 事件 |
| --- | --- |
| 鼠标 | `click`、`dblclick`、`contextmenu`、`mousedown`、`mouseup`、`mousemove`、`mouseover`、`mouseout` |
| 键盘 | `keydown`、`keyup` |
| 表单控件 | `input`（实时）、`change`（失焦确认）、`focus` / `blur`（不冒泡）、`focusin` / `focusout`（冒泡）、`submit` |
| 页面加载 | `DOMContentLoaded`（`document`）、`load` / `beforeunload` / `unload`（`window`）、`readystatechange` |
| 滚动 / 尺寸 | `scroll`、`resize`、`wheel` |
| 过渡 / 动画 | `transitionend`、`animationend` |

## 页面加载与脚本时机速查

`document.readyState`：`"loading"` → `"interactive"`（≈`DOMContentLoaded`）→ `"complete"`（≈`load`）。

| 脚本方式 | 阻塞解析 | 执行时机 | 顺序 | `DOMContentLoaded` 等它 |
| --- | --- | --- | --- | --- |
| `<script>` | 是 | 立即 | 文档顺序 | 等 |
| `<script defer>` | 否 | 解析完、`DOMContentLoaded` 前 | 文档顺序 | 等 |
| `<script async>` | 否 | 下完即跑 | 无序 | 不等 |
| `<script type="module">` | 否 | 同 `defer` | 文档顺序 | 等 |

## 现代特性 Baseline 状态（2026-06 核）

| 特性 | 状态 | 用法建议 |
| --- | --- | --- |
| `querySelector` / `querySelectorAll` | ✅ Baseline 广泛可用 | 放心用，查找首选 |
| `classList` / `dataset` | ✅ Baseline 广泛可用 | 放心用 |
| `append` / `prepend` / `before` / `after` / `remove` | ✅ Baseline 广泛可用 | 取代老式 `appendChild` 等 |
| `addEventListener`（含 `once` / `passive`） | ✅ Baseline 广泛可用 | 事件绑定唯一推荐 |
| `CustomEvent` / `dispatchEvent` | ✅ Baseline 广泛可用 | 放心用 |
| `getComputedStyle` / `getBoundingClientRect` | ✅ Baseline 广泛可用 | 放心用 |
| `<script type="module">` | ✅ Baseline 广泛可用 | 现代脚本默认选择 |
| `innerHTML` 插用户输入 | ⛔ 安全红线 | 永远改用 `textContent` |
| `document.write` | ⛔ 已淘汰 | 不要再用 |

## 权威链接

**标准 / 规范**

- [WHATWG DOM Standard](https://dom.spec.whatwg.org/)
- [WHATWG HTML Standard — Events](https://html.spec.whatwg.org/multipage/webappapis.html#events)
- [MDN: Document Object Model (DOM)](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model) · [Event reference](https://developer.mozilla.org/en-US/docs/Web/Events)

**课程 / 指南**

- [javascript.info: Document（DOM）](https://javascript.info/document) · [Introduction to browser events](https://javascript.info/introduction-browser-events) · [Event delegation](https://javascript.info/event-delegation)
- [MDN: DOM 介绍](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction)

**兼容性 / 调试**

- [Baseline 浏览器兼容查询：webstatus.dev](https://webstatus.dev/) · [caniuse.com](https://caniuse.com/)
- 浏览器 DevTools 的 Elements 面板（实时查看 DOM 树 / 监听器）与 Event Listeners 子面板

## 相关页

- [入门](./getting-started) · [DOM 树与遍历](./guide-line/dom-tree-traversal) · [修改文档](./guide-line/modifying-document)
- [属性、特性与样式](./guide-line/attributes-styles) · [事件机制](./guide-line/event-mechanism)
- [事件委托](./guide-line/event-delegation) · [表单事件与页面加载](./guide-line/forms-page-load)
