---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 开启网格：在容器上 `display: grid`（或 `inline-grid`），其**直接子元素**自动成为网格项
- 划列：`grid-template-columns: 200px 1fr 2fr` —— 三列；`fr` 是「剩余空间的份额」
- 划行：`grid-template-rows: 100px auto` —— 两行；不写则由内容撑高（隐式行）
- 间距：`gap: 16px`（行列相同）或 `gap: 行 列`；间距像「透明的粗线」，先于 `fr` 分配
- 五个概念：容器（container）、轨道（track=行/列）、线（line，从 1 编号）、单元格（cell）、区域（area）
- 默认自动布局：项按**先行后列**（`grid-auto-flow: row`）依次填入单元格
- 等分 N 列的惯用法：`grid-template-columns: repeat(N, 1fr)`
- 响应式画廊一行搞定：`grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))`
- 放置：基于线坐标 `grid-column: 1 / 3`，或命名区域 `grid-template-areas` + `grid-area`
- Grid 是**二维**（行列同时），Flexbox 是**一维**（单轴）——选谁看版面需不需要横竖都对齐

## 网格是什么：从一维到二维

在 Grid 之前，CSS 没有真正的二维布局：`float`、`inline-block`、表格全是「借用」别的机制凑版面，对齐行与列要靠精确的尺寸计算和层层 hack。Flexbox 解决了「一根轴上排一串内容」，但它本质是一维的——你能让一行项目均分、对齐、换行，却很难让**多行之间的列也对齐**。

CSS Grid 是为「二维」而生的：你先在容器上画出一张网格（多少行、多少列、每条多宽多高），再把子元素放进格子。横竖两个方向同时由你掌控。

```css
.container {
  display: grid; /* 开启网格，直接子元素成为网格项 */
  grid-template-columns: 1fr 1fr 1fr; /* 三等分列 */
  grid-template-rows: 100px 100px; /* 两行，各 100px */
  gap: 16px; /* 行列间距统一 16px */
}
```

::: tip Grid 还是 Flexbox？
一句话判断：**内容决定布局用 Flexbox，布局决定内容用 Grid**。导航条里一串按钮、卡片内部的图标加文字——这种「沿一根轴排、数量不定」的场景用 Flexbox；整页的「头/侧/主/脚」骨架、需要横竖都对齐的卡片画廊——这种「先有版面格子、再往里填」的场景用 Grid。二者可以嵌套：Grid 划大版面，每个格子内部再用 Flexbox 排内容。
:::

## 五个核心概念

理解 Grid 只需记住五个词，后续每一页都围绕它们展开：

| 概念 | 英文 | 说明 |
| --- | --- | --- |
| **网格容器** | grid container | 设了 `display: grid` 的元素，它为直接子元素建立网格上下文 |
| **网格项** | grid item | 容器的**直接子元素**（孙元素不算） |
| **网格线** | grid line | 划分网格的横线与竖线，从 `1` 开始编号；N 列有 N+1 条竖线 |
| **网格轨道** | grid track | 两条相邻线之间的空间，即一行或一列 |
| **网格单元格** | grid cell | 一行轨道与一列轨道交叉出的最小格子 |
| **网格区域** | grid area | 一个项跨越多个单元格围成的**矩形**区域 |

::: warning 网格线从 1 开始，不是 0
一个三列的网格有 **4 条竖线**（编号 1、2、3、4）。放置元素时 `grid-column: 1 / 4` 表示「从第 1 条线占到第 4 条线」，正好覆盖三列。线编号既能从左数正数（`1`），也能从右数负数（`-1` 是最后一条线）——这一点在 [基于线与区域放置](./guide-line/line-area-placement) 会反复用到。
:::

## 一个「能跑」的最小网格

把下面这段贴进任意 HTML，就能看到一个三列两行、带间距、自动填充的网格：

```html
<div class="grid">
  <div class="card">1</div>
  <div class="card">2</div>
  <div class="card">3</div>
  <div class="card">4</div>
  <div class="card">5</div>
  <div class="card">6</div>
</div>
```

```css
.grid {
  display: grid;
  /* 三等分列：repeat(3, 1fr) 等价于 1fr 1fr 1fr */
  grid-template-columns: repeat(3, 1fr);
  gap: 16px; /* 单元格之间留 16px 缝隙 */
}

.card {
  padding: 24px;
  background: #e7f5ff;
  border-radius: 8px;
  text-align: center;
}
```

这里只定义了**三列**，没定义行。六个项会先填满第一行的三列，剩下三个**自动换到第二行**——这一行行新增的轨道叫「隐式网格」，尺寸默认由内容决定（详见 [隐式网格与自动布局](./guide-line/implicit-grid)）。

## 放置元素的两条路

填好基本网格后，常常要让某些项「占多列」「跨多行」。Grid 提供两套放置语法：

### ① 基于线（坐标）

用线编号直接指定项「从哪条线占到哪条线」：

```css
.featured {
  grid-column: 1 / 3; /* 从第 1 条竖线占到第 3 条 = 横跨 2 列 */
  grid-row: 1 / 3; /* 从第 1 条横线占到第 3 条 = 纵跨 2 行 */
}
```

也可以用 `span` 表达「跨几格」：`grid-column: span 2` 表示「占 2 列、起点交给自动布局」。详见 [基于线与区域放置](./guide-line/line-area-placement)。

### ② 基于命名区域（ASCII 图）

给每块区域起名，再用一张「字符画」描述版面，可读性极高：

```css
.layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-areas:
    "sidebar header"
    "sidebar main";
}

.layout > header {
  grid-area: header;
}
.layout > aside {
  grid-area: sidebar;
}
.layout > main {
  grid-area: main;
}
```

那张 `grid-template-areas` 直接把版面「画」了出来——侧栏在左纵跨两行，头部与主内容在右。详见 [模板区域](./guide-line/template-areas)。

## 间距用 `gap`，别用 margin

网格项之间的缝隙统一用 `gap`，不要再给项加 `margin`（margin 会在边缘也留出多余间距，且难以均匀）：

```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px; /* 行列都 16px */
  /* 也可分别设：行 24px、列 16px */
  /* gap: 24px 16px; */
  /* 或单独设：row-gap / column-gap */
}
```

`gap` 在网格里像「透明的粗线」占位，且**先于 `fr` 轨道分配空间**——也就是说先扣掉间距，剩下的才按 `fr` 比例分给各列。

## 下一步

你已经有了全局直觉：容器开网格、轨道划行列、`gap` 留缝、两套放置语法。接下来从**轨道尺寸**深入——`fr`、`minmax()`、`repeat()` 这三件套是 Grid 灵活性的来源：[网格轨道与 fr/minmax/repeat](./guide-line/grid-tracks)。
