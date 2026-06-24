---
layout: doc
outline: [2, 3]
---

# 换行、排序与间距

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- `flex-wrap`（容器）：`nowrap`（默认，不换行、宁可溢出）、`wrap`（换行）、`wrap-reverse`（换行且行序反向）
- 换行后每条「行」各自是一个弹性容器，行内重新按主轴排列；行与行的分布交给 `align-content`
- `flex-flow`（容器）：`flex-direction` + `flex-wrap` 的简写，如 `flex-flow: row wrap`
- `order`（项目）：整数，决定**视觉**排序，小的在前，默认 `0`；负值可排到默认项之前
- `order` 与 `*-reverse` 一样**只改视觉、不改 DOM / Tab / 朗读顺序**，有无障碍代价，慎用
- `gap` / `column-gap` / `row-gap`（容器）：项目间距，**只在项目之间**生效、首尾不留边、无外边距合并
- 换行 + `gap` 是「响应式卡片墙」的黄金组合：`flex-wrap: wrap` + `gap` + 子项 `flex` basis
- 让项目自动折行成等宽卡片：子项 `flex: 1 1 240px`（够宽则并排、不够则换行）

## `flex-wrap`：让项目换行

默认情况下，弹性项目**死守一行**——空间不够就一起收缩，再不够就溢出，但绝不换行。`flex-wrap` 改变这一点：

```css
.container {
  display: flex;
  flex-wrap: nowrap; /* 默认：全挤一行，可能溢出 */
}
```

三个取值：

```css
flex-wrap: nowrap; /* 默认：不换行 */
flex-wrap: wrap; /* 放不下就另起一行，行沿交叉轴方向堆叠 */
flex-wrap: wrap-reverse; /* 同样换行，但新行往交叉轴【起点】方向堆（行序反过来） */
```

关键认知：**一旦换行，每条「行」都被当作一个独立的弹性容器**。也就是说，每行内部各自按主轴重新排列、各自计算伸缩；而「这些行整体在交叉轴上怎么分布」，则由上一章的 `align-content` 接管（回顾：`align-content` 只有在多行时才有效）。

::: tip `nowrap` 下项目会缩，不会溢出（除非缩到底）
不换行不等于一定溢出。`nowrap` 时项目会先按 `flex-shrink` 一起收缩；只有当所有项目都缩到各自 `min-content`、仍放不下，才真正溢出。要避免溢出，要么 `flex-wrap: wrap` 换行，要么用 `min-width: 0` 让项目能缩得更小（见上一页）。
:::

## `flex-flow`：方向与换行的简写

`flex-flow` 把 `flex-direction` 和 `flex-wrap` 合成一行：

```css
.box {
  display: flex;
  flex-flow: row wrap; /* = flex-direction: row; flex-wrap: wrap; */
}

/* 其他组合 */
flex-flow: column nowrap;
flex-flow: row-reverse wrap-reverse;
```

写法是「方向在前、换行在后」。日常写多行布局时，用 `flex-flow: row wrap` 比分两行写更紧凑。

## `order`：调整视觉排序

`order` 写在**项目**上，用一个整数控制它在视觉上的先后——**数值小的排在前面**，默认都是 `0`：

```css
.item {
  order: 0; /* 默认 */
}

.item--featured {
  order: -1; /* 负值：排到所有默认项之前 */
}

.item--last {
  order: 99; /* 大值：排到最后 */
}
```

- 相同 `order` 的项目，按它们在 DOM 中的先后排列；
- 因此 `order` 常用来在不改 HTML 的前提下，于不同断点重排卡片（如移动端把某块提前）。

::: warning `order` 的无障碍代价（与 `*-reverse` 同源）
和 `flex-direction: *-reverse` 一样，`order` **只改变视觉顺序，不改变 DOM 顺序**：

- 屏幕阅读器仍按 DOM 顺序朗读；
- 键盘 Tab 焦点仍按 DOM 顺序跳转。

于是「看到的顺序」和「读到 / 跳到的顺序」会脱节，对键盘与读屏用户造成困惑。**不要用 `order` 去修补本该在 HTML 结构里解决的顺序问题**；只在「视觉重排不影响阅读逻辑」时才用它，并务必用键盘实测一遍 Tab 路径。
:::

## `gap`：现代间距方案

`gap` 系列设定弹性项目之间的间距，是目前留空隙的首选：

```css
.container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px; /* 行间距与列间距都设为 16px */
  gap: 12px 20px; /* 也可分开写：行间距 12px、列间距 20px */
}
```

三个属性：

```css
gap: 16px; /* 简写：row-gap 与 column-gap 一起设 */
column-gap: 20px; /* 仅主轴方向（row 时）项目之间的间距 */
row-gap: 12px; /* 仅交叉轴方向（多行时行与行之间）的间距 */
```

相比用 `margin` 凑间距，`gap` 有三个实在的好处：

- **只在项目之间生效**，容器首尾不会平白多出外边距；
- 不存在相邻 `margin` **合并**的问题；
- 换行后**行与行之间**也自动留出 `row-gap`，做卡片墙时不用再手动补。

## 实战：响应式卡片墙

把「换行 + `gap` + 项目 `flex`」三者一组合，就是一个无需媒体查询的自适应卡片墙：

```css
.cards {
  display: flex;
  flex-wrap: wrap; /* 允许换行 */
  gap: 16px; /* 卡片间留 16px（横纵都有） */
}

.cards > .card {
  flex: 1 1 240px; /* 基础宽 240px：够宽就并排、空间不足就自动折到下一行 */
}
```

它的精妙之处在 `flex: 1 1 240px`：

- `flex-basis: 240px` 给每张卡片一个「理想宽度」；
- `flex-grow: 1` 让同一行里的卡片把剩余空间均分填满（行尾不留豁口）；
- `flex-shrink: 1` + `flex-wrap: wrap` 保证窗口变窄时卡片优雅换行而非溢出。

容器变宽则一行多放几张、变窄则自动减少每行数量——纯 Flexbox 就能做出「自适应列数」的效果。

## 小结

`flex-wrap` 决定换不换行、`flex-flow` 把方向与换行合一、`order` 调视觉排序（带无障碍代价）、`gap` 提供干净的间距——这几件配齐，多行响应式布局就齐活了。最后一页把前面所有知识串成可直接套用的 [Flexbox 实战模式](./flexbox-patterns)。
