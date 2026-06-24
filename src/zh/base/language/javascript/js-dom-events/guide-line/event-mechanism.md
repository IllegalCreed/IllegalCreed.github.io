---
layout: doc
outline: [2, 3]
---

# 事件机制

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **事件**：「某事发生了」的信号——点击 / 敲键 / 提交 / 滚动等，DOM 节点都会派发
- **绑定首选 `addEventListener(type, handler, options?)`**：可叠加多个、可移除、可配置（不像 `onclick` 会互相覆盖）
- **解绑 `removeEventListener(type, handler, options)`**：handler 必须是**同一个函数引用**，匿名函数无法解绑
- **三阶段**：捕获（document→目标，自上而下）→ 目标 → 冒泡（目标→document，自下而上）；默认在**冒泡**阶段处理
- **`event` 对象**：`event.type`（类型）、`event.target`（**真正触发**的元素）、`event.currentTarget`（**绑监听器**的元素）、`event.clientX/Y`（鼠标视口坐标）
- **`event.target` ≠ `event.currentTarget`**：前者是事件源、后者是当前处理它的节点（委托的核心区分）
- **`event.stopPropagation()`**：阻止继续传播（慎用，会破坏委托）；`stopImmediatePropagation()` 连同元素上其它监听器一起停
- **`event.preventDefault()`**：阻止浏览器默认动作（链接跳转、表单提交、右键菜单等）
- **`options`**：`{ capture: true }` 捕获阶段触发、`{ once: true }` 触发一次自动解绑、`{ passive: true }` 承诺不调用 `preventDefault`（利于滚动性能）

## 事件是什么

**事件**是「某件事发生了」的信号。用户点了按钮、敲了键盘、提交了表单、滚动了页面——每一次，浏览器都会在相关 DOM 节点上**派发一个事件对象**。我们的工作就是：在合适的节点上挂一个**事件处理器（handler）**，等事件来时执行对应逻辑。

::: tip 这里讲的是「DOM 事件」，不是「事件循环」
注意区分两个同样带「事件」二字、却完全不同的概念：本页讲的是 **DOM 事件**（用户交互信号在节点树上的传播与监听）；而 **事件循环（event loop）**——宏任务 / 微任务的调度机制——属于异步执行模型，是另一个主题（见 JavaScript 异步章），**不在本叶范围**。
:::

## 三种绑定方式，只推荐一种

历史上给元素绑事件有三种写法：

```html
<!-- 方式 1：HTML 内联属性。逻辑混进结构里，不推荐 -->
<button onclick="alert('hi')">点我</button>
```

```js
// 方式 2：DOM 属性。同一事件只能挂一个，再赋值会【覆盖】前一个
btn.onclick = () => alert("hi");
btn.onclick = () => alert("bye"); // 前一个被冲掉，只剩这个

// 方式 3（推荐）：addEventListener，可叠加、可移除、可配置
btn.addEventListener("click", () => alert("hi"));
btn.addEventListener("click", () => alert("bye")); // 两个都会执行
```

**现代代码统一用 `addEventListener`**。它的三大优势：同一事件可挂**多个**互不覆盖的处理器、能用 `removeEventListener` **精确移除**、能通过 `options` 配置捕获 / 一次性 / 被动等行为。

### 移除监听器要用同一个函数引用

```js
function onClick() {
  /* … */
}
btn.addEventListener("click", onClick);
btn.removeEventListener("click", onClick); // ✔ 传入同一个具名函数，成功移除

// ✘ 下面无法移除：两个匿名箭头函数是不同的引用
btn.addEventListener("click", () => {});
btn.removeEventListener("click", () => {}); // 移不掉
```

所以「之后需要移除」的处理器，**必须用具名函数或保存引用**，不能用临时匿名函数。

### 对象也能当处理器

`addEventListener` 的第二个参数除了函数，还能是带 `handleEvent` 方法的**对象**——事件来时浏览器会调用 `obj.handleEvent(event)`。这在用类封装一组相关处理逻辑时很顺手：

```js
class Menu {
  handleEvent(event) {
    // 可按 event.type 分派到不同方法
    console.log("收到", event.type);
  }
}
elem.addEventListener("click", new Menu());
```

## `event` 对象：这次事件的一切

处理器被调用时，会收到一个 `event` 对象，承载本次事件的全部信息。最常用的几个：

```js
btn.addEventListener("click", (event) => {
  event.type; // "click"   —— 事件类型
  event.target; // 真正被点击的那个元素（事件源）
  event.currentTarget; // 当前正在处理事件的元素（= 绑监听器的 btn），等同 this
  event.clientX; // 鼠标相对【视口】的横坐标
  event.clientY; // 鼠标相对【视口】的纵坐标
});
```

`event.target` 与 `event.currentTarget` 的区别是**理解事件委托的钥匙**，下面专门讲。

## 事件传播：捕获 → 目标 → 冒泡三阶段

当你点击页面深处的一个元素时，事件**并不是只在那个元素上发生**，而是沿着 DOM 树**走一趟完整旅程**，分三个阶段：

```
                    │  ① 捕获阶段（capturing）
   document         │     从 document 自上而下
     └─ html        ▼     往目标【下沉】
        └─ body
           └─ div          ② 目标阶段（target）
              └─ button ◀──── 事件到达真正被点的元素
           ┌─ div
        ┌─ body     ▲
     ┌─ html        │  ③ 冒泡阶段（bubbling）
   document         │     从目标自下而上
                    │     往 document【上浮】
```

1. **捕获阶段**：事件从 `document` 出发，**自上而下**穿过各层祖先，直到目标元素；
2. **目标阶段**：到达真正触发事件的那个元素（`event.target`）；
3. **冒泡阶段**：再从目标**自下而上**逐层回到 `document`。

`addEventListener` **默认在冒泡阶段**触发处理器。要改在捕获阶段触发，传 `{ capture: true }`：

```js
parent.addEventListener("click", () => console.log("捕获：parent 先"), {
  capture: true,
});
child.addEventListener("click", () => console.log("目标：child"));
parent.addEventListener("click", () => console.log("冒泡：parent 后"));
// 点击 child 的输出顺序：捕获 parent → 目标 child → 冒泡 parent
```

正因为有冒泡，「点子元素、却能在父元素上统一处理」才成立——这就是下一页 [事件委托](./event-delegation) 的全部基础。

### `target` vs `currentTarget`

冒泡途中，事件流经多个祖先，每个绑了监听的祖先都会被触发。此时：

- **`event.target`** 始终指向**最初触发事件的那个元素**（旅程不变的「源头」）；
- **`event.currentTarget`** 指向**当前正在执行处理器的那个元素**（随冒泡逐层变化），它等于处理器里的 `this`。

```js
// HTML: <ul id="menu"><li>A</li><li>B</li></ul>
menu.addEventListener("click", (event) => {
  event.currentTarget; // 永远是 #menu（监听器绑在它上）
  event.target; // 你点的那个 <li>（A 或 B）—— 据此知道点了谁
});
```

## 控制事件：`stopPropagation` 与 `preventDefault`

两个方法，作用完全不同，别混：

### `preventDefault()`：阻止浏览器的默认动作

很多元素有「与生俱来」的默认行为：点链接会跳转、提交按钮会刷新页面、右键会弹菜单。`event.preventDefault()` 取消这个默认动作（但**不影响**事件继续传播）：

```js
link.addEventListener("click", (event) => {
  event.preventDefault(); // 阻止跳转，改由 JS 接管
  // …自定义逻辑，比如 SPA 路由
});

form.addEventListener("submit", (event) => {
  event.preventDefault(); // 阻止默认提交（整页刷新），改用 fetch 异步提交
});
```

### `stopPropagation()`：阻止事件继续传播

`event.stopPropagation()` 让事件**不再向后续阶段 / 祖先传播**（比如冒泡到一半就停住），但**不影响**当前元素上的其它处理器、也不影响默认动作：

```js
inner.addEventListener("click", (event) => {
  event.stopPropagation(); // 事件到此为止，外层 outer 的 click 监听不会再触发
});
```

::: warning 别滥用 `stopPropagation`
随手「停止冒泡」会埋坑：父层（乃至 `document`）上依赖冒泡的逻辑——统计、关闭弹层的「点外部收起」、以及整套**事件委托**——都会被它悄悄打断，且极难排查。**没有明确理由不要调用它**。需要「只阻止默认动作」时，用的是 `preventDefault`，而不是 `stopPropagation`。
:::

还有个更狠的 `event.stopImmediatePropagation()`：不仅停止向祖先传播，连**同一元素上后续注册的其它监听器**也一并跳过。

## `addEventListener` 的 `options`

第三个参数 `options` 可细调监听行为：

```js
elem.addEventListener("click", handler, {
  capture: true, // 在【捕获】阶段触发（默认 false = 冒泡阶段）
  once: true, // 只触发【一次】，之后自动移除（省去手动 remove）
  passive: true, // 承诺处理器内【不调用】preventDefault；浏览器可放心优化滚动等
});
```

- `once: true` 特别适合「只需响应第一次」的场景，免去自己写解绑；
- `passive: true` 常用于 `touchstart` / `wheel` / `scroll`——告诉浏览器「我不会拦默认滚动」，它就能不等你的处理器、直接流畅滚动，显著改善移动端性能。

## 小结

事件是节点派发的「发生了什么」信号；绑定统一用 `addEventListener`（可叠加 / 可移除 / 可配置），解绑须同一函数引用。事件沿树走「捕获 → 目标 → 冒泡」三阶段，默认在冒泡阶段处理；`event.target`（事件源）与 `event.currentTarget`（当前处理节点）的区分是委托的钥匙。`preventDefault` 阻止默认动作、`stopPropagation` 阻止传播（慎用）。理解了冒泡，下一页就能把「给每个子元素绑监听」收拢成「在父节点统一处理」：[事件委托](./event-delegation)。
