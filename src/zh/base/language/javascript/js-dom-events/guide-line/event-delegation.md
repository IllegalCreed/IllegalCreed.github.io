---
layout: doc
outline: [2, 3]
---

# 事件委托

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **核心思想**：不给每个子元素各绑监听，而在**共同祖先**上绑**一个**，靠**冒泡**捕获后代事件
- **算法四步**：祖先上监听 → 读 `event.target` 看是谁触发 → 用 `target.closest(选择器)` 定位关心的元素 → 处理
- **`event.target` vs `event.currentTarget`**：前者=真正触发的后代、后者=绑监听的祖先（委托里二者通常不同）
- **三大收益**：省内存（一个监听代替成百上千个）、动态增删子元素**无需**重新绑、初始化与清理更简单
- **`data-*` + `dataset`「行为模式」**：用 `data-action` 等声明式标注，祖先监听里据此分派动作
- **自定义事件**：`new CustomEvent(type, { detail, bubbles })` 造、`elem.dispatchEvent(event)` 派发、监听里读 `event.detail`
- **`event.isTrusted`**：真实用户事件为 `true`，脚本 `dispatchEvent` 派发的为 `false`
- **三条限制**：事件必须能**冒泡**才委托得到；途中有人 `stopPropagation()` 会断链；祖先要处理子树全部事件，逻辑别太重

## 一个问题：给一千个 `<li>` 绑监听？

设想一个有很多列表项的菜单，点任意一项都要响应。最朴素的做法是循环给每个 `<li>` 各绑一个 `click`——一千个项就是一千个监听器。这有几个真实痛点：占内存、初始化慢，而且**列表后续动态新增的项不会自带监听**，得手动补绑；删项时还可能留下悬挂引用。

**事件委托**用冒泡一举解决：既然点 `<li>` 的事件**会冒泡到父级 `<ul>`**，那只在 `<ul>` 上绑**一个**监听器，就能接住所有 `<li>` 的点击——再用 `event.target` 看具体点了谁。

## 委托的标准四步

```js
// HTML: <ul id="menu"><li>首页</li><li>文档</li><li>关于</li></ul>
const menu = document.querySelector("#menu");

// ① 在【共同祖先】上绑一个监听器
menu.addEventListener("click", (event) => {
  // ② 看是谁触发的（可能是 li，也可能是 li 里更深的元素）
  // ③ 用 closest 向上定位到我们真正关心的那一层
  const li = event.target.closest("li");

  // 没点在任何 li 上（点了 ul 的空白），或 li 不属于这个菜单 → 忽略
  if (!li || !menu.contains(li)) return;

  // ④ 处理：此刻 li 就是被点的那一项
  console.log("点了：", li.textContent);
});
```

四步对应速查里的算法：**祖先监听 → `event.target` → `closest` 定位 → 处理**。`closest("li")` 的妙处在于：哪怕用户点的是 `<li>` 里嵌的 `<span>` 或图标，它也能稳稳向上找到那个 `<li>`。

::: tip 为什么要 `menu.contains(li)` 这道校验
`closest("li")` 是沿 DOM 树一路向上找，理论上可能找到「菜单之外」的 `<li>`（若菜单本身又嵌在别的列表里）。加一句 `menu.contains(li)` 确保命中的元素**确实在本容器内**，避免误触。简单结构里可省，复杂嵌套里建议保留。
:::

## `target` 与 `currentTarget` 在委托里的分工

委托能成立，全靠这两个属性各司其职（详见 [事件机制](./event-mechanism)）：

```js
menu.addEventListener("click", (event) => {
  event.currentTarget; // 永远是 #menu —— 绑监听器的祖先
  event.target; // 你真正点中的后代 —— 据它判断「点了哪一项」
});
```

一句话：**`currentTarget` 是「谁在处理」，`target` 是「谁触发」**。委托里你几乎总是用 `target`（配 `closest`）来识别意图。

## 三大收益

| 收益 | 说明 |
| --- | --- |
| **省内存 / 提速** | 一个监听器替代成百上千个，初始化更快、占用更低 |
| **动态元素零成本** | 后续用 `append` / `innerHTML` 新增的子元素**自动**被委托接管，无需补绑；删除也不留悬挂监听 |
| **初始化 / 清理简单** | 绑定与解绑都只针对那**一个**祖先，代码量小、易维护 |

「动态元素零成本」是委托最被低估的好处：列表数据异步加载、无限滚动、增删行——这些场景下，逐个绑监听几乎无法维护，而委托天然适配。

## 「行为模式」：用 `data-*` 声明式驱动

委托配合 `data-*` 特性，能写出非常解耦的**行为模式（behavior pattern）**：HTML 里用 `data-*` **声明**元素该有什么行为，JS 在文档级别用一个监听器统一分派。这样新增带标注的元素时，**完全不用碰 JS**。

```html
<button data-action="save">保存</button>
<button data-action="cancel">取消</button>
<button data-action="delete">删除</button>
```

```js
// 全局一个监听器，按 data-action 分派
const actions = {
  save: () => console.log("保存"),
  cancel: () => console.log("取消"),
  delete: () => console.log("删除"),
};

document.addEventListener("click", (event) => {
  const el = event.target.closest("[data-action]");
  if (!el) return;
  const name = el.dataset.action; // data-action → dataset.action
  actions[name]?.(); // 找到对应动作就执行
});
```

再加一个「计数器」行为也只需改 HTML、复用同一套思路：

```html
<button data-counter>当前计数：0</button>
```

```js
document.addEventListener("click", (event) => {
  const el = event.target.closest("[data-counter]");
  if (!el) return;
  // 读出末尾数字 +1 再写回（演示用，真实项目宜把状态存 data-* 或外部）
  el.textContent = el.textContent.replace(/\d+$/, (n) => Number(n) + 1);
});
```

这套「HTML 声明行为、JS 委托分派」的模式，正是许多框架指令（如 `v-on` 的事件绑定）背后的朴素原理。

## 自定义事件：`CustomEvent` 与 `dispatchEvent`

事件不只能由用户触发，**代码也能主动造事件并派发**——这是组件之间解耦通信的常用手段。用 `CustomEvent` 造（可通过 `detail` 携带任意数据），用 `dispatchEvent` 派发：

```js
// 造一个会冒泡、且带数据的自定义事件
const event = new CustomEvent("cart:add", {
  detail: { id: 42, name: "键盘" }, // 自定义数据放 detail
  bubbles: true, // 让它能冒泡（从而可被祖先委托接住）
});

// 在某个元素上派发它
productEl.dispatchEvent(event);

// 任意祖先都能像监听原生事件一样监听它
document.addEventListener("cart:add", (event) => {
  console.log("加入购物车：", event.detail.name); // 读 detail 拿数据
});
```

几个要点：

- **`new Event(type, options)`** 造基础事件（`options` 可含 `bubbles` / `cancelable`）；**`new CustomEvent(type, options)`** 在此之上多了 `detail` 字段专门带数据；
- 自定义事件**只能用 `addEventListener` 监听**——没有 `oncart:add` 这种属性写法；
- **`event.isTrusted`**：真实用户操作派发的事件该值为 `true`，脚本 `dispatchEvent` 派发的为 `false`，可用于区分来源；
- `dispatchEvent` 是**同步**的——派发后处理器立即执行完，才继续往下走（需要异步可包一层 `setTimeout`）。
- 浏览器还提供了 `MouseEvent` / `KeyboardEvent` 等内置事件类，用来造带专属字段（如 `clientX`）的原生类型事件。

## 委托的三条限制

委托很强，但有边界，得心里有数：

1. **事件必须会冒泡**：极少数原生事件（如 `focus` / `blur`）默认**不冒泡**，无法直接委托——这类要么用其会冒泡的版本（`focusin` / `focusout`），要么在捕获阶段处理（见 [表单事件与页面加载](./forms-page-load)）；
2. **`stopPropagation()` 会断链**：途中任何后代调用了它，事件就到不了祖先，委托失效——这也是该方法要慎用的原因之一；
3. **祖先要处理子树全部事件**：容器上的监听器会接住其内部的**每一次**该类事件，逻辑过重可能带来 CPU 负担——保持处理器轻量、尽早 `return` 掉不相关的。

## 小结

事件委托 = 把「给每个后代绑监听」收拢成「在共同祖先绑一个」，靠冒泡接住、用 `event.target` + `closest` 定位、再处理。它省内存、天然支持动态增删元素，配 `data-*` 还能写出声明式「行为模式」。代码侧可用 `CustomEvent` + `dispatchEvent` 主动造事件解耦通信。注意事件须可冒泡、别乱 `stopPropagation`、祖先逻辑别太重三条限制。下一页收尾交互专题——表单与控件事件，以及脚本何时能安全访问 DOM：[表单事件与页面加载](./forms-page-load)。
