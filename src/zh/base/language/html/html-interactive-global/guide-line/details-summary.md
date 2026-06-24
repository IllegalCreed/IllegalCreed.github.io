---
layout: doc
outline: [2, 3]
---

# `details` / `summary` 折叠

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- `<details>` = 原生折叠控件；第一个子元素必须是 `<summary>`（标题 + 点击区），其余是折叠内容
- `open`：布尔属性，加上即**默认展开**；注意是布尔属性，`open="false"` 仍是展开，要隐藏须**整个删掉**该属性
- `name`：给多个 `details` 设同一 `name` → 组成**手风琴**（同一时刻只开一个，2024 起）；不必相邻；若多个同名都带 `open`，只有源码中第一个生效
- `toggle` 事件：开/收状态变化后触发，读 `details.open` 判断当前状态
- 默认标记：`<summary>` 默认 `display: list-item`，带一个三角（disclosure triangle）
- 去掉/改三角：`summary { list-style: none }` 去掉，或用 `::marker` / `list-style-type: disclosure-closed` 定制；旧 WebKit 用 `::-webkit-details-marker`
- 内容动画：`details::details-content` 伪元素可为展开内容做过渡（较新特性，渐进增强）
- 可访问：`details` 隐式 `role="group"`；键盘 `Tab` 聚焦 `summary`、`Space` / `Enter` 切换；天然可访问，别加多余 `role`
- Baseline：`<details>` / `<summary>` 自 2020 年起广泛可用；`name` 手风琴 2024 起（新近可用）

## 最小结构

```html
<details>
  <summary>系统要求</summary>
  <p>需要一台运行现代操作系统的电脑，以及一个支持 ES2020 的浏览器。</p>
</details>
```

`<summary>` 是「永远可见的标题 + 点击区」，其后的所有内容是「展开才显示」的部分。点击 `<summary>`（或聚焦后按 `Space` / `Enter`）即可在展开/收起间切换——**一行 JavaScript 都不用写**。

`<summary>` 必须是 `<details>` 的第一个子元素；若省略，浏览器会提供一个默认的「Details」标题，但实际项目里应总是显式写出。

## `open` 属性：默认展开

```html
<details open>
  <summary>默认就展开</summary>
  <p>页面加载时这块内容已经可见。</p>
</details>
```

`open` 是**布尔属性**——它的「有/无」决定状态，而它的「值」被忽略。这意味着 `open="false"` 依然是展开状态（因为属性存在）；要让它收起，必须把 `open` 属性**整个删掉**。用 JS 切换时也是操作属性的存在性：

```js
const d = document.querySelector("details");
d.open = true; // 展开
d.open = false; // 收起（等价于移除 open 属性）
```

## `name` 属性：手风琴（2024）

给一组 `<details>` 设置**相同的 `name`**，它们就组成一个互斥分组——**同一时刻最多只有一个展开**，打开其中一个会自动收起同组其它项。这正是经典的「手风琴」（accordion）交互，过去要写 JS，现在纯 HTML 即可：

```html
<details name="faq">
  <summary>支持哪些浏览器？</summary>
  <p>所有支持 Baseline 的现代浏览器。</p>
</details>

<details name="faq">
  <summary>如何降级？</summary>
  <p>不支持的浏览器会退化为「全部可独立展开」，功能不丢。</p>
</details>

<details name="faq">
  <summary>需要写脚本吗？</summary>
  <p>不需要，手风琴行为由浏览器原生提供。</p>
</details>
```

要点：

- 同组成员**不必在 DOM 里相邻**，只看 `name` 是否相同；
- 若多个同名项都写了 `open`，**只有源码顺序中第一个**会渲染为展开；
- **降级很优雅**：不支持 `name` 的旧浏览器会把它们当成各自独立的折叠（可同时展开多个），核心信息不丢失。

::: tip Baseline 现状
`name` 手风琴自 2024 年起在主流浏览器（Chrome / Edge 120、Safari 17.2、Firefox 130 一线）落地，属于 **Baseline 新近可用**。因为「不支持即退化为独立折叠」的降级几乎无害，可放心在生产中使用。
:::

## `toggle` 事件

每次展开/收起状态改变，`<details>` 会派发 `toggle` 事件（状态**变化之后**触发）：

```js
const d = document.querySelector("details");
d.addEventListener("toggle", () => {
  if (d.open) {
    console.log("展开了——这里适合懒加载内容");
  } else {
    console.log("收起了");
  }
});
```

常见用途：展开时才去懒加载图片或请求数据、做埋点统计。注意 `toggle` 也用于 `popover` / `dialog`，但那里携带的是 `ToggleEvent`（带 `newState` / `oldState`）；`details` 的 `toggle` 同样可用 `event.newState`（`"open"` / `"closed"`）判断。

## 自定义那个三角

`<summary>` 默认是 `display: list-item`，左侧那个会旋转的三角其实是**列表标记**（marker）。因此定制方式与列表项一致：

```css
/* 1. 去掉默认三角 */
summary {
  list-style: none; /* 现代浏览器 */
}
summary::-webkit-details-marker {
  display: none; /* 旧版 WebKit/Safari 兜底 */
}

/* 2. 用 ::marker 改三角的颜色/大小 */
details > summary::marker {
  color: var(--brand);
  font-size: 1.1em;
}

/* 3. 或用 CSS 关键字标记（随开合自动切换图形） */
summary {
  list-style-type: disclosure-closed; /* 收起时 ▶ */
}
details[open] > summary {
  list-style-type: disclosure-open; /* 展开时 ▼ */
}

/* 4. 完全自绘：去掉原标记后用伪元素画自己的图标 */
summary {
  cursor: pointer;
}
summary::before {
  content: "＋";
}
details[open] summary::before {
  content: "－";
}
```

::: tip 给展开内容做动画
较新的 `details::details-content` 伪元素代表「展开后那部分内容」，可配合 `interpolate-size` / `transition` 做高度过渡（从 0 展开到 `auto`）。这是渐进增强特性，不支持的浏览器只是「瞬间展开」、功能不受影响。

```css
details::details-content {
  transition: height 0.3s, content-visibility 0.3s allow-discrete;
}
```
:::

## 可访问性

`<details>` / `<summary>` 天然可访问：

- `<details>` 隐式 `role="group"`，`<summary>` 充当其可访问标签；
- 键盘：`Tab` 聚焦到 `<summary>`，`Space` 或 `Enter` 切换开合；
- 读屏器会朗读当前是「展开」还是「折叠」状态。

因此**不要**再给它们手动加 `role` 或 `aria-expanded`——原生语义已经齐全，加了反而可能冲突。这正是「能用原生就别用 ARIA」的典型例子。

## 小结

`details` / `summary` 用零 JavaScript 换来折叠、键盘可用与可访问语义，`name` 再把它升级成手风琴。下一页进入更重的交互——需要遮挡背景、收拢焦点的 [`dialog` 模态对话框与 `inert`](./dialog-inert)。
