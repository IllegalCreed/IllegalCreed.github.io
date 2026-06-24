---
layout: doc
outline: [2, 3]
---

# 属性、特性与样式

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **特性（attribute）= HTML 里写的**；**属性（property）= DOM 对象上的**——二者多数会同步，但不总是
- **特性操作**（值永远是字符串、名不区分大小写）：`elem.getAttribute`、`setAttribute`、`hasAttribute`、`removeAttribute`、`elem.attributes`
- **属性可为任意类型**：`input.checked` 是布尔、`elem.style` 是对象、`a.href` 是**完整 URL**（特性里可能是相对路径）
- **不同步典型**：`<input value>` —— 特性改会同步到属性，但用户输入改了属性后**不再回写**特性（`value` 特性=初始值）
- **自定义数据**：`data-*` 特性 ↔ `elem.dataset`，连字符转驼峰（`data-order-state` → `dataset.orderState`）
- **改类**：`elem.classList` 的 `add` / `remove` / `toggle` / `contains`；整串替换用 `elem.className`
- **改内联样式**：`elem.style.属性`（驼峰：`backgroundColor`），清除某条赋空串 `""`；整串用 `style.cssText`
- **读最终样式**：`getComputedStyle(elem)` 返回**解析后**的只读值（如颜色 `rgb(…)`、长度 `px`），须用完整属性名
- **量尺寸坐标**：`offsetWidth/Height`、`clientWidth/Height`、`getBoundingClientRect()`（视口坐标）、`scrollTop`

## 特性与属性：一字之差，两个世界

这是 DOM 里最容易混的一对概念，中文都叫「属性」，但其实是两样东西，建议用**特性 / 属性**区分：

- **特性（attribute）**：你在 **HTML 源码里写的**那串文本，如 `<input id="name" value="张三">` 里的 `id`、`value`。特性的值**永远是字符串**。
- **属性（property）**：浏览器把 HTML 解析成 DOM 对象后，对象上挂的**字段**，如 `input.id`、`input.value`、`input.checked`。属性的值可以是**任意类型**（字符串、布尔、对象……）。

```js
// HTML: <input id="login" type="checkbox" checked>
const el = document.querySelector("#login");

el.id; // "login"   —— 属性（字符串）
el.checked; // true       —— 属性是【布尔】，不是字符串 "checked"
el.getAttribute("checked"); // ""  —— 特性只是 HTML 里的那段文本
```

对**标准特性**，二者大多会自动同步：改 `el.id` 会反映到 HTML 特性上，反之亦然。但它们的**类型**可能不同（特性字符串 vs 属性布尔），且并非所有特性都双向同步。

### 经典的「不同步」：`input.value`

最常被这点坑到的是表单的 `value`：

```js
// HTML: <input id="t" value="初始">
const t = document.querySelector("#t");

t.getAttribute("value"); // "初始"  —— 特性 = HTML 里写的【初始值】
t.value; // "初始"  —— 一开始二者相同

// 用户在输入框里敲字，把内容改成了「新值」之后：
t.value; // "新值"  —— 属性跟随当前实际内容
t.getAttribute("value"); // "初始"  —— 特性【纹丝不动】，仍是初始值
```

记忆要点：**`value` 特性 = 初始值；`value` 属性 = 当前值**。读用户「现在输入了什么」永远读 `el.value`（属性），不要读特性。

### `href` 也不一样

```js
// HTML: <a id="lnk" href="/page">
const a = document.querySelector("#lnk");

a.getAttribute("href"); // "/page"                    —— 特性 = 原样写的相对路径
a.href; // "https://站点/page"          —— 属性 = 解析后的【完整绝对 URL】
```

## 操作特性的四个方法

读写**非标准特性**（标准属性不会自动映射的那些）就靠这组方法。它们的值**一律按字符串处理**，且特性名**不区分大小写**：

```js
elem.getAttribute("data-id"); // 读，返回字符串（不存在则 null）
elem.setAttribute("title", "提示"); // 写
elem.hasAttribute("disabled"); // 是否存在，返回布尔
elem.removeAttribute("hidden"); // 删除
elem.attributes; // 全部特性的类数组集合（每项含 name / value）
```

## 自定义数据：`data-*` 与 `dataset`

要往元素上挂自定义数据，**不要乱造非标准特性**（可能与未来标准冲突），而应统一用 `data-` 前缀。读写时通过 `elem.dataset` 对象，特性名的**连字符自动转驼峰**：

```html
<div id="order" data-order-id="42" data-order-state="paid"></div>
```

```js
const order = document.querySelector("#order");

order.dataset.orderId; // "42"        （data-order-id → orderId）
order.dataset.orderState; // "paid"      （data-order-state → orderState）

order.dataset.orderState = "shipped"; // 写回 → HTML 变成 data-order-state="shipped"
```

`data-*` 是「行为模式」与组件状态的常用载体，在 [事件委托](./event-delegation) 一页会反复用到。

## 改类名：用 `classList`，别手拼字符串

切换 CSS 类是最高频的样式操作。`elem.className` 是**整串**类名字符串，但增删单个类用它要自己做字符串拼接、很易错。首选 `elem.classList`：

```js
elem.classList.add("active"); // 加一个类
elem.classList.remove("hidden"); // 删一个类
elem.classList.toggle("open"); // 有则删、无则加（开关）
elem.classList.toggle("on", isOn); // 第二参强制：true 则加、false 则删
elem.classList.contains("active"); // 是否含某类，返回布尔

elem.className = "a b c"; // 整串替换（覆盖原有全部类，慎用）
```

`classList` 还可 `for...of` 遍历。日常**优先 `classList` 的四个方法**，只有「一次性整体替换类」才用 `className`。

## 改内联样式：`elem.style`

`elem.style` 是个对象，对应元素的**内联样式**（即 `style="…"` 特性）。属性名用**驼峰**（CSS 里的连字符去掉、首字母大写）：

```js
elem.style.color = "red";
elem.style.backgroundColor = "#0d1117"; // CSS 的 background-color
elem.style.marginTop = "8px"; // 带单位的值要写全，"8" 无效

elem.style.display = ""; // 清除某条内联样式：赋【空字符串】
```

要一次性设置一整段，用 `style.cssText`（会**覆盖**原有全部内联样式）：

```js
elem.style.cssText = "color: red; margin-top: 8px;";
```

::: tip `style` 只看内联，改不动样式表里的规则
`elem.style` 读写的**只是元素自己的内联样式**——它看不到 `.css` 文件或 `<style>` 里通过选择器命中的规则。想读「这个元素最终长什么样」，要用下面的 `getComputedStyle`。
:::

## 读最终样式：`getComputedStyle`

要读取「层叠计算后、浏览器实际应用」的样式值（无论它来自内联还是样式表），用全局函数 `getComputedStyle(elem)`：

```js
const styles = getComputedStyle(elem);

styles.color; // "rgb(255, 0, 0)"   —— 颜色解析成 rgb(...) 形式
styles.marginTop; // "8px"            —— 长度解析成绝对的 px
styles.paddingLeft; // 必须用完整属性名，不能用简写 padding
```

几个关键点：

- 返回的是**只读**对象，不能用它改样式（改样式仍用 `elem.style`）；
- 返回**解析后的值（resolved value）**——颜色统一成 `rgb(…)`、长度统一成 `px`，方便直接做计算；
- 必须用**完整属性名**（`paddingLeft` 而非 `padding`）；
- 元素需在文档中、可见，结果才可靠；出于隐私，`:visited` 链接的部分样式会被隐藏。

## 量尺寸与坐标

布局相关的几何信息不在 `style` 里（那只是声明的样式，未必等于实际渲染），而要读这些**几何属性**（返回数字，单位 px）：

```js
elem.offsetWidth; // 含 padding + border 的渲染宽度
elem.offsetHeight; // 同上，高度
elem.clientWidth; // 含 padding、不含 border 与滚动条的内容区宽
elem.clientHeight; // 同上，高度

elem.scrollTop; // 已纵向滚动的距离（可读可写）
elem.scrollHeight; // 含溢出的完整内容高度

// 相对【视口】的位置与尺寸，一次拿全
const rect = elem.getBoundingClientRect();
rect.top; // 元素顶边距视口顶部的距离
rect.left; // 元素左边距视口左侧的距离
rect.width; // 渲染宽度
```

`getBoundingClientRect()` 返回的坐标是**相对视口**的；要换算成相对整页文档的坐标，加上页面滚动量 `window.scrollX` / `window.scrollY` 即可。

## 小结

分清「特性（HTML 里写的字符串）」与「属性（DOM 对象上的任意类型字段）」是本页地基——读用户当前输入用 `el.value`（属性）、自定义数据用 `data-*` + `dataset`、非标准特性用 `getAttribute` 系列。样式上：改类用 `classList`、改内联样式用 `elem.style`（驼峰）、读最终效果用 `getComputedStyle`、量几何用 `offset*` / `client*` / `getBoundingClientRect`。下一页进入交互的核心——事件是怎样在树上传播、又怎样监听：[事件机制](./event-mechanism)。
