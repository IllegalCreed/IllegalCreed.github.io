---
layout: doc
outline: [2, 3]
---

# subgrid 子网格

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- **Baseline 状态**：✅ **广泛可用（Widely available）**，自 **2023 年 9 月**起跨浏览器（Chrome/Edge 117、Firefox 71、Safari 16.0）——可放心用
- 它解决什么：让**嵌套网格继承父网格的轨道**，从而「卡片内部的元素对齐到外层网格线」
- 语法：在子网格容器上 `grid-template-columns: subgrid` 和/或 `grid-template-rows: subgrid`，可只用一个方向
- 前提：子网格必须先在父网格里**跨轨道**（`grid-column` / `grid-row`），才能 `subgrid`
- 轨道数 = 它在父网格里**跨越的轨道数**；子网格内线编号**从 1 重新开始**
- 父级**命名线**自动传入子网格，可直接用名字放置；也能给子网格**追加**命名线 `subgrid [a] [b]`
- 父级 `gap` 默认被子网格**继承**，可在子网格上覆盖（如 `row-gap: 0`）
- 对比 `display: grid` 嵌套：普通嵌套**不继承**父级轨道 / 间距 / 命名线，对不齐就是它造成的
- `masonry`（瀑布流）是**另一个**特性、仍实验中、**未** Baseline，别和 subgrid 混为一谈

## 痛点：普通嵌套网格对不齐

把一个网格项再设成 `display: grid`，它就成了**独立**的新网格——拥有自己的一套轨道，**与父网格毫无关系**，不继承父级的轨道尺寸、间距、命名线。

这带来一个经典难题：一排卡片，每张内部都有「标题 / 正文 / 按钮」三段。各卡片内容长短不一，于是各自的标题底边、按钮顶边**参差不齐**——因为每张卡片是独立网格，它们的内部行高互不相干。

```css
/* ❌ 普通嵌套：每张卡片内部行高独立，跨卡片对不齐 */
.card {
  display: grid;
  grid-template-rows: auto 1fr auto; /* 各卡片自己算行高，互不对齐 */
}
```

过去要对齐只能靠固定高度、JS 测量等 hack。`subgrid` 让这件事变得原生而优雅。

## `subgrid` 做什么

当你在 `grid-template-columns`、`grid-template-rows`（或两者）上写值 `subgrid`，这个嵌套网格**不再创建自己的轨道**，而是**直接采用父网格在该方向上的轨道**。于是子网格里的元素，对齐的是**父网格的线**。

> MDN 原文：「If you set the value `subgrid` on `grid-template-columns`, `grid-template-rows` or both, instead of creating a new track listing, the nested grid uses the tracks defined by the parent.」（在 `grid-template-columns` / `grid-template-rows` 上设 `subgrid`，嵌套网格不再新建轨道列表，而是使用父级定义的轨道。）

::: tip Baseline 状态：放心用
`subgrid` 是 **Baseline 广泛可用（Widely available）**特性——MDN 标注「自 **2023 年 9 月**起跨浏览器可用」。具体版本：**Chrome 117 / Edge 117**（2023-09）、**Firefox 71**（最早支持）、**Safari 16.0**。全球支持率约 **88%**（caniuse，2026 核）。在面向现代浏览器的项目中可直接使用；若需兼容 2023 年 9 月前的老浏览器，做渐进降级（退化为普通嵌套网格，仅失去对齐、不破版）即可。

注意区分：常和 `subgrid` 一起被提起的 **`masonry`（瀑布流布局）是另一个、且仍是实验性的特性，尚未进入 Baseline**，不要混淆。
:::

## 语法与前提

两步：① 子网格容器先在父网格里**占据若干轨道**（用 `grid-column` / `grid-row`）；② 再用 `subgrid` 声明在该方向继承父级轨道。

```css
.parent {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 20px;
}

.item {
  display: grid;
  /* ① 先在父网格里跨轨道：列 2→7（5 列）、行 2→4（2 行） */
  grid-column: 2 / 7;
  grid-row: 2 / 4;
  /* ② 两个方向都继承父级轨道 */
  grid-template-columns: subgrid;
  grid-template-rows: subgrid;
}
```

要点：

- 子网格在某方向的**轨道数量 = 它在父网格里跨越的轨道数**。上例跨列 2→7 即 5 列，子网格就有 5 列、尺寸与父级对应列**完全一致**。
- 可以**只在一个方向**用 `subgrid`，另一方向照常自定义。常见做法是 `grid-template-columns: subgrid`（列对齐父级）配合自定义的行。
- 子网格内部的线编号**从 1 重新开始**——子网格的第一条线是 1，与父网格的线号无关。这让组件可复用：无论被放在父网格哪个位置，内部放置代码不变。

## 卡片对齐：subgrid 的杀手级场景

回到开头的痛点。让每张卡片**继承父网格的行轨道**，所有卡片的「标题行 / 正文行 / 按钮行」就钉在同一组父级线上，自动对齐：

```css
.cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  /* 父网格定义三行：标题、正文、按钮 */
  grid-template-rows: auto 1fr auto;
  gap: 16px;
}

.card {
  display: grid;
  grid-row: span 3; /* 每张卡占满三行 */
  grid-template-rows: subgrid; /* 行轨道继承父级 → 跨卡片对齐 */
}
```

现在所有卡片的标题底边、按钮顶边都**严丝合缝**对齐，无需任何固定高度或 JS 测量——这是 `subgrid` 最有说服力的用例。

## 命名线会传进子网格

父网格的**命名线**会自动传入子网格，可在子网格内直接用名字放置元素：

```css
.parent {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr [col-start] 1fr 1fr 1fr [col-end] 1fr 1fr 1fr;
}

.item {
  grid-column: 2 / 7;
  grid-template-columns: subgrid;
}

.subitem {
  /* 直接用父级传入的命名线 */
  grid-column: col-start / col-end;
}
```

还能给子网格**追加**自己的命名线，写在 `subgrid` 之后（方括号逐条对应子网格的每条线）：

```css
.item {
  grid-template-columns: subgrid [sub-a] [sub-b] [sub-c] [sub-d] [sub-e] [sub-f];
}

.subitem {
  grid-column: sub-b / sub-d; /* 用子网格自己的命名线 */
}
```

父级线名与子网格追加的线名**都可用于放置**，互不冲突。

## 间距：默认继承，可覆盖

父网格的 `gap`（`row-gap` / `column-gap`）默认被子网格**继承**。如需不同间距，在子网格上单独设 `gap` 系列属性即可覆盖：

```css
.parent {
  gap: 20px; /* 子网格默认也用 20px */
}

.item {
  grid-template-columns: subgrid;
  grid-template-rows: subgrid;
  row-gap: 0; /* 覆盖：本子网格行间距改为 0 */
}
```

::: tip `row-gap: 0` 的妙用
把子网格的 `row-gap` 设为 `0`（小于父级的 `gap`）会让子网格的内容「回吐」出那段间距空间，效果类似负 margin——子项可以延伸到原本被父级 `gap` 占用的区域里。需要让某个子元素「填满包括间距在内的整片区域」时，这是一个干净的技巧。
:::

## 一个完整例子

```css
.grid {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  grid-template-rows: repeat(4, minmax(100px, auto));
  gap: 20px;
}

.item {
  display: grid;
  grid-column: 2 / 7; /* 跨 5 列 */
  grid-row: 2 / 4; /* 跨 2 行 */
  grid-template-columns: subgrid; /* 列继承父级 5 条轨道 */
  grid-template-rows: subgrid; /* 行继承父级 2 条轨道 */
  row-gap: 0; /* 覆盖父级行间距 */
}

.subitem {
  grid-column: 3 / 6; /* 用子网格内重新编号的线 */
  grid-row: 1 / 3;
}
```

`.item` 在父网格里占据 5 列 2 行，并把这片区域的轨道原样继承下来；`.subitem` 在子网格内用「从 1 重新编号」的线定位，最终却**精确对齐到父网格的列**——这正是 `subgrid` 的核心价值：嵌套结构与外层网格保持像素级一致。

## 下一步

核心特性到此讲全。最后一页把所有知识点收口到可直接抄走的实战配方——响应式画廊、整页仪表盘、圣杯布局、RAM 模式：[Grid 实战](./grid-patterns)。
