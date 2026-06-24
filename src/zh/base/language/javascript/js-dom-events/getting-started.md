---
layout: doc
outline: [2, 3]
---

# 入门

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **DOM 是什么**：浏览器把 HTML 解析成的一棵活的对象树，每个标签 / 文本 / 注释都是一个**节点**对象
- **入口对象**：`document`（整棵树的根入口）、`window`（浏览器窗口 / 全局对象）；`document.documentElement`=`<html>`、`document.body`=`<body>`、`document.head`=`<head>`
- **查找节点**：首选 `document.querySelector(css)`（返回第一个）/ `querySelectorAll(css)`（返回全部，**静态**集合）；按 id 用 `getElementById`
- **改内容**：`elem.textContent`（纯文本，**安全**）、`elem.innerHTML`（解析为 HTML，**有 XSS 风险**）
- **改样式/类**：`elem.classList.add/remove/toggle(类名)`、`elem.style.属性 = 值`（驼峰：`backgroundColor`）
- **增删节点**：`document.createElement(tag)` 造、`parent.append(node)` 插、`node.remove()` 删
- **绑事件**：`elem.addEventListener("click", handler)`；回调收到 `event` 对象（`event.target` / `event.preventDefault()`）
- **脚本时机**：`<script>` 放 `<body>` 末尾，或用 `<script defer>` / `<script type="module">`，确保运行时 DOM 已就绪
- **不要硬拼字符串建结构**：优先 `createElement` + `append`，仅在内容确定可信时用 `innerHTML`

## DOM 到底是什么

你写的是一段 HTML 文本，但浏览器加载它时，会把这段文本**解析成一棵对象树**保存在内存里——这棵树就是 DOM。树上的每一个标签、每一段文字、甚至每一条注释，都对应一个**节点对象**，带着自己的属性和方法。JavaScript 看不到原始的 HTML 字符串，它操作的始终是这棵树。

```html
<!DOCTYPE html>
<html>
  <head>
    <title>关于我</title>
  </head>
  <body>
    <p>你好，<b>世界</b></p>
  </body>
</html>
```

上面这段 HTML 在内存里是这样一棵树（缩进表示父子层级）：

```
html
├─ head
│  └─ title
│     └─ "关于我"          ← 文本节点
└─ body
   └─ p
      ├─ "你好，"           ← 文本节点
      └─ b
         └─ "世界"          ← 文本节点
```

关键认知：**文字也是节点**（文本节点），而且 HTML 里的换行和空格也会变成文本节点。所以遍历 DOM 时不能只想着标签——下一页会专门讲「全部节点」与「只看元素」两套遍历属性的区别。

::: tip DOM 不是 JavaScript 的一部分
DOM 是浏览器提供的一套 **Web API**（也叫宿主对象），不是 JavaScript 语言本身的内容。语言只规定了 `Object`、`Array`、`Promise` 这些；而 `document`、`querySelector`、`addEventListener` 都是浏览器在运行环境里「额外塞给」JavaScript 的能力。这也是为什么同一份 JS 在 Node.js 里没有 `document`——那里根本没有页面。
:::

## 三条主线：查、改、听

操作 DOM 的全部工作几乎都能归到三件事：**找到节点**、**修改节点**、**监听事件**。下面这段最小脚本把三件事一次串起来：

```html
<button id="like">点赞 (0)</button>

<script>
  // ① 查：用 CSS 选择器或 id 找到页面里的节点
  const btn = document.querySelector("#like");

  let count = 0;

  // ③ 听：给节点挂一个事件监听器，用户点击时触发回调
  btn.addEventListener("click", () => {
    count += 1;
    // ② 改：修改节点的文本内容
    btn.textContent = `点赞 (${count})`;
  });
</script>
```

三步对应三页深入：

- **查**（`querySelector` 等）→ [DOM 树与遍历](./guide-line/dom-tree-traversal)
- **改**（`textContent` / 创建插入 / 样式类）→ [修改文档](./guide-line/modifying-document) 与 [属性、特性与样式](./guide-line/attributes-styles)
- **听**（`addEventListener` / `event` 对象）→ [事件机制](./guide-line/event-mechanism)

## `document` 与 `window`：两个全局入口

- **`document`**：整棵 DOM 树的入口。常用快捷属性：`document.documentElement`（`<html>`）、`document.body`（`<body>`）、`document.head`（`<head>`），以及全部查找方法 `document.querySelector` / `getElementById`。
- **`window`**：代表浏览器窗口，也是浏览器环境里的**全局对象**——你写的全局变量、`setTimeout`、`addEventListener("resize", …)` 都挂在它上面。`window.document` 就是 `document`。

## 改内容：`textContent` 与 `innerHTML` 的分水岭

修改一个元素的内容有两条路，新手最容易踩错的就是这里：

```js
const box = document.querySelector("#box");

// textContent：把内容当作【纯文本】，任何标签都原样显示，安全
box.textContent = "<b>加粗？</b>"; // 页面显示字面量：<b>加粗？</b>

// innerHTML：把内容当作【HTML】解析，会真的生成 <b> 元素
box.innerHTML = "<b>加粗</b>"; // 页面显示加粗的：加粗
```

`innerHTML` 很方便，但只要内容里**掺了用户输入**，就可能被注入恶意标签（XSS）。所以铁律是：**纯文本一律用 `textContent`；只有内容完全可信时才用 `innerHTML`**。完整对比与 `DocumentFragment` 批量插入见 [修改文档](./guide-line/modifying-document)。

## 听事件：`addEventListener` 是唯一推荐写法

绑定事件历史上有三种写法，现代代码**只用第三种**：

```js
// 写法 1（HTML 属性，不推荐）：<button onclick="say()">
// 写法 2（DOM 属性，会互相覆盖）：btn.onclick = fn
// 写法 3（推荐）：可叠加多个、可移除、可配置选项
btn.addEventListener("click", (event) => {
  console.log("被点击的元素是", event.target);
});
```

回调会收到一个 `event` 对象，里面装着「这次事件的一切」——是什么类型、由哪个元素触发、鼠标坐标在哪等。三种写法的取舍、`event` 对象全貌、事件如何在树上传播，见 [事件机制](./guide-line/event-mechanism)。

## 让脚本在 DOM 就绪后才跑

一个经典翻车：脚本写在 `<head>` 里，运行时 `<body>` 还没解析，`querySelector` 查啥都是 `null`。三种稳妥做法：

```html
<!-- 做法 1：脚本放 body 末尾，前面的 DOM 已就绪 -->
<body>
  ...
  <script src="app.js"></script>
</body>

<!-- 做法 2：defer——并行下载，等整篇文档解析完再按序执行 -->
<head>
  <script defer src="app.js"></script>
</head>

<!-- 做法 3：模块脚本默认就是 defer 行为 -->
<head>
  <script type="module" src="app.js"></script>
</head>
```

`defer` / `async` / `type="module"` 各自的加载与执行时机，以及 `DOMContentLoaded` / `load` 两个页面事件，见 [表单事件与页面加载](./guide-line/forms-page-load)。

## 下一步

地基已经铺好。先进入 [DOM 树与遍历](./guide-line/dom-tree-traversal)，把「节点有哪几种、怎么精确找到它们、怎么在树上跳来跳去」彻底搞清楚——这是后面一切修改与事件的前提。
