---
layout: doc
outline: [2, 3]
---

# 修改文档

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **造节点**：`document.createElement(tag)` 造元素、`document.createTextNode(text)` 造文本节点
- **现代插入**（接受多个节点或字符串，字符串按**纯文本**插入）：`node.append`（末尾）、`prepend`（开头）、`before`（前面）、`after`（后面）、`replaceWith`（替换自身）
- **老式插入**（仍可用，啰嗦）：`parent.appendChild`、`parent.insertBefore`、`parent.replaceChild`、`parent.removeChild`
- **插 HTML 字符串**：`elem.insertAdjacentHTML(where, html)`，位置为 `"beforebegin"` / `"afterbegin"` / `"beforeend"` / `"afterend"`
- **删节点**：`node.remove()`（现代）取代 `parent.removeChild(node)`
- **克隆**：`elem.cloneNode(true)` 深克隆（连子孙）、`cloneNode(false)` 只克隆自身
- **批量插入**：`DocumentFragment` 当临时容器，一次性塞入，减少回流
- **文本 vs HTML**：`textContent` 安全（纯文本）；`innerHTML` 解析标签、**含用户输入会有 XSS**
- **避免 `document.write`**：只在页面解析期间有效，解析后调用会清空整页

## 造一个节点

修改 DOM 的第一步往往是「凭空造一个新节点」。最常用的是造元素：

```js
// 造一个 <div class="alert"> 元素（此刻它还在内存里，没进页面）
const div = document.createElement("div");
div.className = "alert";
div.textContent = "操作成功！";
```

也能单独造文本节点，但更多时候直接用 `textContent` / `append` 一步到位，少用 `createTextNode`：

```js
const text = document.createTextNode("纯文字");
```

造出来的节点**还不在页面上**——它只是个游离对象，必须用下面的插入方法挂到树上才可见。

## 插入节点：现代五法

现代 DOM 提供一组成对的插入方法，名字直白、且**都能一次接受多个参数**（节点或字符串混着传）：

| 方法 | 插到哪里 |
| --- | --- |
| `node.append(...)` | `node` 内部的**末尾** |
| `node.prepend(...)` | `node` 内部的**开头** |
| `node.before(...)` | `node` **前面**（成为前一个兄弟） |
| `node.after(...)` | `node` **后面**（成为后一个兄弟） |
| `node.replaceWith(...)` | **替换** `node` 自身 |

```js
const ul = document.querySelector("ul");
const li = document.createElement("li");
li.textContent = "新条目";

ul.append(li); // 加到列表末尾
ul.prepend("置顶项"); // 字符串自动变成文本节点，加到开头
li.before(document.createElement("hr")); // 在这个 li 前面插一条分隔线
li.after("说明文字"); // 在它后面插一段文字
```

::: tip 字符串参数永远是「安全文本」
`append` / `prepend` / `before` / `after` 收到字符串时，会把它当**纯文本**插入——哪怕字符串里写着 `<b>`，也只会显示字面量 `<b>`，**不会**被解析成标签。这与 `innerHTML` 截然不同，所以这组方法天然没有注入风险。要插入真正的 HTML 结构，要么传节点对象，要么用下面的 `insertAdjacentHTML`。
:::

### 老式插入方法（还会遇到）

老代码与不少教程里仍是这套，行为相同但更繁琐——只能一次插一个节点，且必须由**父节点**发起：

```js
parent.appendChild(node); // ≈ parent.append(node)
parent.insertBefore(node, refNode); // 插到 refNode 前面
parent.replaceChild(newNode, oldNode); // 用 newNode 换掉 oldNode
parent.removeChild(node); // 删除 node
```

新代码优先用现代五法，可读性和灵活性都更好。

## 插入 HTML 字符串：`insertAdjacentHTML`

当你手里是一段 **HTML 字符串**、又想精确控制插到目标元素的哪个相对位置时，用 `insertAdjacentHTML`：

```js
const box = document.querySelector("#box");
box.insertAdjacentHTML("beforeend", "<p>追加的段落</p>");
```

四个位置关键字以目标元素为参照：

```
<!-- beforebegin --> 元素前面（外部）
<div id="box">
  <!-- afterbegin --> 内容最前
  ...已有内容...
  <!-- beforeend --> 内容最后
</div>
<!-- afterend --> 元素后面（外部）
```

配套还有按相同位置插入纯文本 / 节点的 `insertAdjacentText` 与 `insertAdjacentElement`。

::: warning `insertAdjacentHTML` 同样有 XSS 风险
它会**解析** HTML 字符串，所以一旦字符串里掺了用户输入，就和 `innerHTML` 一样可能被注入。规则不变：内容含用户数据时，用 `textContent` 或 `append(字符串)` 走纯文本路线。
:::

## 删除与克隆

```js
node.remove(); // 现代写法：把自己从树上摘掉

const copy = elem.cloneNode(true); // 深克隆：连同所有子孙一起复制
const shallow = elem.cloneNode(false); // 浅克隆：只复制自身、不含子节点
```

克隆常用于「以一个模板元素为蓝本，复制出多份再修改填充」。

## `textContent` vs `innerHTML`：安全的分水岭

这是本页最关键的一节。两者都能设置元素内容，但本质不同：

```js
const el = document.querySelector("#out");

// textContent：把值当【纯文本】，标签原样显示，绝不解析 —— 安全
el.textContent = userInput; // 哪怕 userInput 是 "<img onerror=…>" 也无害

// innerHTML：把值当【HTML】解析，会真的生成元素、执行内联事件属性等 —— 危险
el.innerHTML = userInput; // 用户输入恶意标签 → XSS 攻击
```

| 维度 | `textContent` | `innerHTML` |
| --- | --- | --- |
| 内容如何对待 | 纯文本 | 解析为 HTML |
| 能否生成子元素 | 否 | 能 |
| 安全性 | 安全 | 含用户输入则有 **XSS** 风险 |
| 读取时 | 全部文字（含隐藏元素的） | 内部 HTML 源码 |

::: tip 一个常被误解的点
即便是 `innerHTML`，**新插入的 `<script>` 也不会执行**——这是浏览器的规定。但这绝不代表 `innerHTML` 安全：`<img src=x onerror=alert(1)>` 这类**带内联事件处理器**的标签照样能触发，仍是完整的 XSS 攻击面。所以「`script` 不跑」≠「可以塞用户输入」。
:::

铁律重申：**展示纯文本一律 `textContent`；只有内容完全由你掌控、确信可信时，才用 `innerHTML` / `insertAdjacentHTML`**。

## `DocumentFragment`：批量插入的省力容器

往页面里逐个 `append` 大量节点，每次都可能触发浏览器重新计算布局（回流），数量大时影响性能。`DocumentFragment` 是一个**游离的轻量容器**：先把节点都装进它，最后一次性 `append` 到页面——只触发一次插入。

```js
const frag = document.createDocumentFragment();

for (const name of ["苹果", "香蕉", "橙子"]) {
  const li = document.createElement("li");
  li.textContent = name;
  frag.append(li); // 先攒在 fragment 里，不碰真实 DOM
}

document.querySelector("ul").append(frag); // 一次性插入；fragment 自身不会进树，只「倒出」它的子节点
```

`append(frag)` 之后，`frag` 会被清空——它的子节点被「移动」进了目标，而 fragment 这层容器本身不会出现在 DOM 里。

::: tip 现代替代：直接 `append(...数组)`
其实现代 `append` 本身就支持一次传入多个节点：`ul.append(...items)`（`items` 是节点数组）也能一次性插入、效果近似。`DocumentFragment` 在需要把「一组节点」作为整体反复传递、或用旧式 `appendChild` 时仍很有用，理解它对读懂大量现有代码也必要。
:::

## 别用 `document.write`

`document.write(html)` 是远古 API，**只在页面初次解析期间**往当前位置写入有效；一旦页面加载完成后再调用，它会**清空整个文档**重新开始。现代代码完全用上面的节点 API 取代，遇到它基本可判定为老代码或广告脚本。

## 小结

造节点用 `createElement`；插入优先现代五法 `append` / `prepend` / `before` / `after` / `replaceWith`（字符串走安全文本）；插 HTML 串用 `insertAdjacentHTML` 配四个位置关键字；删用 `remove`、批量用 `DocumentFragment`。安全主线始终是：**纯文本 `textContent`、可信 HTML 才 `innerHTML`**。下一页讲如何读写节点的属性、特性与样式：[属性、特性与样式](./attributes-styles)。
