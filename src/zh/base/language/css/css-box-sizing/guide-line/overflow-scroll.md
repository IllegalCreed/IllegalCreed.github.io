---
layout: doc
outline: [2, 3]
---

# overflow 与滚动容器

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 溢出：内容比盒子大时发生；`overflow` 决定怎么处理多出来的部分
- 五取值：`visible`（**默认**，溢出照样显示）/ `hidden`（裁切、无滚动条）/ `scroll`（**恒**有滚动条）/ `auto`（**按需**出滚动条，最常用）/ `clip`（裁切且禁止**一切**滚动，含 JS）
- `overflow-x` / `overflow-y` 分轴控制；简写 `overflow: hidden scroll` 中第一值给 x、第二值给 y
- 一个坑：某一轴设成**非 `visible`** 时，另一轴的 `visible` 会被强制计算为 `auto`
- `scroll` vs `auto`：`scroll` 不管溢不溢出都显示滚动条；`auto` 只在溢出时才显示
- `clip` vs `hidden`：都裁切，但 `clip` **连程序化滚动（`scrollTo` 等）也禁掉**，`hidden` 仍可程序化滚动
- **滚动容器**：`overflow` 取非 `visible` 值就创建一个滚动容器（同时也开 BFC）；需要内部滚动须给它一个**确定的高度**
- `scrollbar-gutter: stable`：提前**预留滚动条空间**，防内容因滚动条出现而横向跳动（**Baseline 2024**）
- `overscroll-behavior: contain`：阻断**滚动链**（滚到边界不再带动父级 / 页面），模态框 / 侧栏必备（尚**非 Baseline**）

## 溢出是什么

**溢出（overflow）** 指内容**太大、装不下它所在的盒子**。一旦尺寸被你用 `width` / `height` 限死（外在尺寸），而内容又比这个尺寸大，多出来的部分就要有个去处——这正是 `overflow` 属性管的事。

web.dev 强调 CSS 的一条设计原则：**「安全的布局优先于精确的布局」**。所以默认值是 `visible`——宁可让内容溢出**显示出来**（你能看见、能修），也不默默裁掉它造成数据丢失。

## `overflow` 的五个取值

```css
.box {
  overflow: visible; /* 默认：溢出内容照常显示在盒子外 */
  overflow: hidden; /* 裁切溢出部分，不提供滚动条 */
  overflow: scroll; /* 恒显示滚动条（哪怕没溢出）*/
  overflow: auto; /* 按需：溢出才显示滚动条（最常用）*/
  overflow: clip; /* 裁切，且禁止一切滚动（含程序化）*/
}
```

逐个看：

- **`visible`（默认）**：溢出内容**不会被裁切**，会显示在盒子边界之外。遵循「内容永不被意外隐藏」。
- **`hidden`**：在指定方向**裁切**溢出内容，**不提供滚动条**——被裁的部分用户看不到、也滚不出来（但仍可用 JS `scrollTo` 程序化滚动到）。
- **`scroll`**：提供滚动条让用户滚动。**即使内容没溢出，滚动条也始终在那**（在某些桌面系统上会一直占着一条空白）。
- **`auto`**：**最常用**的值——**需要时才显示**滚动条，不需要就藏起来。日常想要「内容多了能滚」，用它。
- **`clip`**：和 `hidden` 一样裁切，但更彻底——**禁止所有滚动，包括 JS 的程序化滚动**。性能上比 `hidden` 略轻。

### scroll vs auto：滚动条何时出现

两者的差别只在**滚动条的显隐时机**：

| | 内容**没**溢出 | 内容溢出 |
| --- | --- | --- |
| `scroll` | **仍显示**滚动条（空滑道） | 显示滚动条 |
| `auto` | 不显示 | 显示滚动条 |

想避免「滚动条忽有忽无导致布局横向跳动」，要么用 `scroll` 恒占位，要么用更优雅的 `scrollbar-gutter`（见下文）。

### clip vs hidden：能否程序化滚动

两者都裁切看不见的部分，区别在**能不能用 JS 滚**：

- `hidden`：视觉上裁切，但元素**仍是可滚动的**——`element.scrollTo()` / `scrollLeft` 仍然有效；
- `clip`：**彻底禁止滚动**，连程序化滚动也不行。需要「就是要硬裁、绝不滚动」时用 `clip`。

## 分轴控制：overflow-x / overflow-y

```css
.table-wrap {
  overflow-x: auto; /* 横向按需滚动（宽表格常用）*/
  overflow-y: hidden; /* 纵向裁切 */
}
```

- `overflow-x` 管**水平**轴（左右滚）；
- `overflow-y` 管**垂直**轴（上下滚）；
- 简写 `overflow: hidden scroll`——**第一个值给 `overflow-x`，第二个给 `overflow-y`**；只写一个值则两轴相同。

::: warning 一个反直觉的坑：另一轴会被「连累」成 auto
当你把**某一轴**设成 `visible` 以外的值，而另一轴是 `visible` 时，那个 `visible` 会被**强制计算为 `auto`**。也就是说，`overflow-x: hidden; overflow-y: visible` 实际跑起来 `overflow-y` 变成了 `auto`——纯粹只裁一个方向、另一方向完全溢出可见，CSS 做不到。这是规范行为，排查「我只设了 x 怎么 y 也出滚动条了」时要想到它。
:::

## 滚动容器：内部滚动的前提

只要 `overflow` 取了**非 `visible`** 的值，元素就成为一个**滚动容器（scroll container）**——它会**建立一个 BFC**（见 [外边距合并与 BFC](./margin-collapse-bfc)），内部溢出的内容在它里面滚动，而不影响外部页面。

但有个常被忽略的前提：**滚动容器必须有一个确定的尺寸**，内部才滚得起来。一个只设了 `overflow-y: auto` 却没限高的 `<div>`，会一直被内容撑高、永远不溢出，也就**永远不出现滚动条**：

```css
/* 想让聊天记录区内部滚动，必须给它一个高度上限 */
.messages {
  height: 400px; /* 或 max-height / flex 约束 */
  overflow-y: auto;
}
```

## `scrollbar-gutter`：防滚动条挤动布局

桌面端的**经典滚动条（classic scrollbar）** 出现时会**占掉一条宽度**，把内容往里挤——内容从「无需滚动」变成「需要滚动」的瞬间，整页会**横向抖一下**。`scrollbar-gutter` 让你**提前预留**这条空间，消除抖动：

```css
html {
  scrollbar-gutter: stable; /* 始终预留滚动条的槽位，不抖动 */
}
```

取值：

- `auto`（默认）：经典滚动条按需占位；**覆盖式滚动条（overlay scrollbar）** 不占空间。
- `stable`：经典滚动条下，只要 `overflow` 是 `auto` / `scroll` / `hidden`，**即使没溢出也预留**槽位。
- `stable both-edges`：在**对侧也预留**一条，保持左右对称（适合居中布局）。

`scrollbar-gutter` 自 2024 年 12 月起为 **Baseline（新近可用）**。覆盖式滚动条（如 macOS 默认、移动端）本就浮在内容上、不占空间，此属性主要解决的是桌面经典滚动条的抖动问题。

## `overscroll-behavior`：阻断滚动链

当一个滚动容器**滚到边界**后继续滚，默认会**带动父级乃至整个页面**一起滚——这叫**滚动链（scroll chaining）**。在模态框、抽屉侧栏、聊天面板里，这通常不是你想要的（滚到底后背景页面跟着动）。`overscroll-behavior` 用来切断它：

```css
.modal-body {
  overflow-y: auto;
  overscroll-behavior-y: contain; /* 滚到边界不再带动背景页面 */
}
```

取值：

- `auto`（默认）：正常的滚动溢出行为，会发生滚动链。
- `contain`：容器**内部**保留默认行为（如移动端回弹），但**不向相邻滚动区传播**——背景不滚。它还会**禁用**该方向的浏览器手势（如下拉刷新、横滑返回）。
- `none`：既不传播滚动链，也**禁止**默认溢出行为（连本元素的回弹也去掉）。

阻止移动端「下拉刷新」的常见写法：

```css
html {
  overscroll-behavior: none;
}
```

::: warning `overscroll-behavior` 尚非 Baseline
按当前 MDN 数据，`overscroll-behavior` 还**未达到 Baseline**（在部分主流浏览器上支持不全）。它是纯粹的**渐进增强**——支持的浏览器体验更好，不支持的退回默认滚动链，不影响功能。用它时不要依赖它做关键交互的唯一保障。
:::

## 小结

`overflow` 用 `visible` / `hidden` / `scroll` / `auto` / `clip` 决定内容装不下时是溢出、裁切还是滚动（`auto` 最常用），取非 `visible` 值即创建滚动容器并开 BFC——但记得给它确定的高度。配套的现代特性里，`scrollbar-gutter`（Baseline 2024）防滚动条抖动、`overscroll-behavior`（尚非 Baseline）阻断滚动链。至此，CSS 盒模型与尺寸的主线——盒子怎么量、怎么排、怎么溢出——就讲完了。各属性的速查表、盒模型图与权威链接，汇总在 [参考](../reference) 一页。
