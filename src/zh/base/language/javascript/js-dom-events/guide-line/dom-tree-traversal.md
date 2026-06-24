---
layout: doc
outline: [2, 3]
---

# DOM 树与遍历

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **四种常见节点类型**：元素节点（标签）、文本节点（文字 / 空白）、注释节点、文档节点（`document` 自身）
- **`nodeType`**：`1`=元素、`3`=文本、`8`=注释、`9`=文档；`nodeName` / `tagName` 取标签名（HTML 里大写）
- **三个根入口**：`document.documentElement`（`<html>`）、`document.body`（`<body>`）、`document.head`（`<head>`）
- **全部节点遍历**（含文本/注释）：`childNodes`、`firstChild`、`lastChild`、`parentNode`、`nextSibling`、`previousSibling`、`hasChildNodes()`
- **只看元素遍历**：`children`、`firstElementChild`、`lastElementChild`、`parentElement`、`nextElementSibling`、`previousElementSibling`
- **查找首选**：`querySelector(css)`（第一个）/ `querySelectorAll(css)`（全部，**静态** `NodeList`）—— 任意 CSS 选择器
- **按特征查**：`getElementById(id)`、`getElementsByTagName`、`getElementsByClassName`、`getElementsByName`（后三者返回**实时** `HTMLCollection`）
- **辅助判断**：`elem.matches(css)`（是否匹配）、`elem.closest(css)`（向上找最近匹配，含自身）
- **实时 vs 静态**：`getElementsBy*` 实时（DOM 变它跟着变）；`querySelectorAll` 静态（查询那一刻的快照）

## 节点不只是标签

DOM 树上的节点分好几类，新手最容易忽略「文字也是节点」这件事。最常打交道的有四种：

| 节点类型 | `nodeType` | 说明 |
| --- | --- | --- |
| 元素节点（element） | `1` | HTML 标签，如 `<p>`、`<div>`，是树的骨架 |
| 文本节点（text） | `3` | 标签之间的文字——**包括换行和空格** |
| 注释节点（comment） | `8` | `<!-- … -->`，不渲染但确实在树里 |
| 文档节点（document） | `9` | `document` 自身，整棵树的根 |

```js
document.body.nodeType; // 1（元素）
document.body.firstChild.nodeType; // 往往是 3（body 标签后的换行成了文本节点）
document.nodeType; // 9（文档）
```

读取标签名用 `nodeName` 或 `tagName`：

```js
const p = document.querySelector("p");
p.tagName; // "P"  —— 注意 HTML 文档里返回【大写】
p.nodeName; // "P"  —— 元素上二者一致；注释/文本节点只有 nodeName（如 "#text"）
```

::: warning 空白文本节点是常见困惑源
源码里标签之间的换行与缩进，会变成一个个文本节点。所以 `body.childNodes` 往往比你想象的多——`<body>` 和它第一个子元素之间那个换行，就占了一个文本节点。**需要精确操作元素时，请用下面的「只看元素」那套属性**，它们会自动跳过文本与注释节点。
:::

## 从哪里进树：三个根入口

```js
document.documentElement; // <html> 元素（整棵元素树的最顶端）
document.head; // <head> 元素
document.body; // <body> 元素
```

注意 `document.body` 有可能是 `null`——如果脚本写在 `<head>` 里、`<body>` 还没解析到，此刻读它就是空。这也是「脚本要等 DOM 就绪」的又一个理由（见 [表单事件与页面加载](./forms-page-load)）。

## 在树上遍历：两套平行的属性

DOM 提供**两套**遍历属性。一套面向「全部节点」（连文本、注释都算），一套只面向「元素节点」。日常写业务，**优先用只看元素的那套**。

### 全部节点（含文本 / 注释）

| 属性 | 含义 |
| --- | --- |
| `parentNode` | 父节点（任意类型） |
| `childNodes` | 全部子节点（实时的类数组集合） |
| `firstChild` / `lastChild` | 第一个 / 最后一个子节点 |
| `nextSibling` / `previousSibling` | 后一个 / 前一个兄弟节点 |
| `hasChildNodes()` | 是否有子节点（布尔） |

### 只看元素

| 属性 | 含义 |
| --- | --- |
| `parentElement` | 父**元素** |
| `children` | 全部子**元素**（跳过文本 / 注释） |
| `firstElementChild` / `lastElementChild` | 第一个 / 最后一个子元素 |
| `nextElementSibling` / `previousElementSibling` | 后一个 / 前一个兄弟元素 |

```js
const list = document.querySelector("ul");

list.children; // 只含 <li> 元素，干净
list.firstElementChild; // 第一个 <li>
list.children[0].nextElementSibling; // 第二个 <li>

list.childNodes; // 含 <li> 之间换行产生的文本节点，往往不是你想要的
```

::: tip `parentNode` 与 `parentElement` 的唯一区别
几乎所有情况二者相同，区别只在树的最顶端：`<html>` 的 `parentNode` 是 `document`（文档节点），但 `parentElement` 是 `null`——因为 `document` 不是元素。换句话说，`document.documentElement.parentElement === null`，而 `document.documentElement.parentNode === document`。
:::

### 表格的专属遍历

`<table>` 这类结构化元素还提供更顺手的专属导航属性，不必逐层 `children`：

```js
table.rows; // 所有 <tr>（含 thead/tbody/tfoot 里的）
table.tBodies; // 所有 <tbody>
tr.cells; // 该行所有 <td> / <th>
tr.sectionRowIndex; // 该 <tr> 在所属 section 内的序号
td.cellIndex; // 该单元格在所属行内的序号
```

## 查找节点：`querySelector` 系列是首选

遍历适合「已知一个节点，去够它周围的节点」；而「凭空在整篇文档里捞节点」，用查找方法更直接。现代代码首选接受 **CSS 选择器**的 `querySelector` 系列——你 CSS 怎么选，这里就怎么写。

```js
// 第一个匹配的元素（没有则返回 null）
const first = document.querySelector(".card .title");

// 全部匹配，返回静态 NodeList，可直接 forEach / 用 for...of
const all = document.querySelectorAll("ul.menu > li");
all.forEach((li) => console.log(li.textContent));

// 也能在某个元素上调用，把搜索范围限定在它内部
const card = document.querySelector(".card");
card.querySelectorAll("button"); // 只找这张卡片里的按钮
```

`querySelectorAll` 甚至支持伪类，例如 `document.querySelectorAll("a:hover")` 能取到当前悬停的链接。

### 三个好用的辅助方法

```js
// matches：检查元素自身是否匹配某选择器，返回布尔（不搜索，只判断）
if (elem.matches("a.external")) {
  /* … */
}

// closest：从自身开始【向上】找最近的匹配祖先（含自身），没有则 null
const item = event.target.closest("li.item"); // 事件委托里的主力，见后续页

// contains：判断某节点是否在另一节点内部
container.contains(node); // true / false
```

`closest` 在 [事件委托](./event-delegation) 里几乎是必用工具——点中的可能是 `<li>` 里的 `<span>`，用 `closest("li")` 一步定位到真正关心的那个 `<li>`。

### 老式查找方法（了解即可）

```js
document.getElementById("main"); // 按 id（只此一个，整文档唯一）
elem.getElementsByTagName("li"); // 按标签名，可用 "*" 取全部
elem.getElementsByClassName("active"); // 按类名
document.getElementsByName("gender"); // 按 name 属性（少用，多见于表单）
```

::: warning `id` 会污染全局，别依赖
浏览器会为每个 `id` 自动创建一个同名全局变量（如 `id="main"` 就能直接用 `main` 引用该元素）。这是历史遗留行为，**不要依赖**——它会与你的变量冲突、可读性差。永远显式 `document.getElementById("main")` 或 `querySelector("#main")`。
:::

## 实时集合 vs 静态集合：一个必须分清的坑

`getElementsBy*` 返回的是**实时（live）** `HTMLCollection`——DOM 一变，它**自动跟着变**；而 `querySelectorAll` 返回的是**静态（static）** `NodeList`——它是查询那一刻的快照，之后 DOM 怎么变都不影响它。

```js
// 实时集合：循环里改 DOM 会出事
const divs = document.getElementsByTagName("div"); // live
// for (let i = 0; i < divs.length; i++) document.body.append(document.createElement("div"));
// ↑ 每次 append 都让 divs.length 增长 → 死循环！

// 静态集合：查询后就定格，安全
const snap = document.querySelectorAll("div"); // static
snap.length; // 固定，后续新增的 div 不会进来
```

下面这张表把六个查找方法的关键差异一次列清：

| 方法 | 按什么查 | 能在元素上调用 | 实时集合 |
| --- | --- | --- | --- |
| `querySelector` | CSS 选择器 | ✔ | —（单个） |
| `querySelectorAll` | CSS 选择器 | ✔ | ✘ 静态 |
| `getElementById` | id | ✘（仅 `document`） | —（单个） |
| `getElementsByName` | name 属性 | ✘（仅 `document`） | ✔ 实时 |
| `getElementsByTagName` | 标签名或 `"*"` | ✔ | ✔ 实时 |
| `getElementsByClassName` | 类名 | ✔ | ✔ 实时 |

实战建议：**绝大多数场景用 `querySelector` / `querySelectorAll` 就够**——一套 CSS 选择器语法、行为可预测（静态）、还能限定在子树内查。只有在你**确实需要集合随 DOM 自动更新**的少数场景，才用 `getElementsBy*`。

## 小结

DOM 是一棵节点树，节点分元素 / 文本 / 注释 / 文档四类；遍历有「全部节点」和「只看元素」两套属性，业务优先用后者；查找统一用 `querySelector` 系列，配合 `matches` / `closest` / `contains` 精确定位；并牢记 `getElementsBy*` 是实时集合、`querySelectorAll` 是静态快照。下一页进入**修改**——把找到的节点创建、插入、删除，并讲清 `textContent` 与 `innerHTML` 的安全边界：[修改文档](./modifying-document)。
