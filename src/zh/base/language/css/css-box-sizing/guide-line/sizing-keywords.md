---
layout: doc
outline: [2, 3]
---

# 尺寸与内在尺寸关键字

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- **外在尺寸（extrinsic）**：你说了算——`width` / `height` 给固定值或百分比；装不下就溢出
- **内在尺寸（intrinsic）**：内容说了算——用 `min-content` / `max-content` / `fit-content` 让浏览器按内容定大小
- `width` 百分比相对**父级可用宽度**算；`margin` / `padding` 的百分比一律相对**父级宽度**（含上下方向）
- `min-width` / `max-width`（及 `min-height` / `max-height`）给尺寸设下/上限；`max-width` 的优先级高于 `width`
- `min-content`：缩到**不溢出的最小宽**——文字会在每个换行点断开，盒子只有**最长单词**那么宽
- `max-content`：撑到**一行不换**的宽——文字完全不折行，哪怕溢出容器
- `fit-content`：两者之间——用可用空间，但**不超过 `max-content`、不小于 `min-content`**，即 `min(max-content, max(min-content, 可用空间))`
- `fit-content()` 函数：`fit-content(20em)` 把上限钳到一个具体值，多用于 Grid 轨道
- 三个关键字均 Baseline 广泛可用（`min/max-content` 2020 起、`fit-content` 2021 起）
- 优先逻辑属性 `inline-size` / `block-size`（= 书写方向下的「宽 / 高」），国际化更稳

## 外在 vs 内在：谁决定盒子多大

盒子的大小，本质上是两种思路的较量：

- **外在尺寸（extrinsic sizing）**：**你**用 `width` / `height` 明确指定大小。好处是可控，坏处是——内容一旦比你给的尺寸大，就会**溢出**。
- **内在尺寸（intrinsic sizing）**：让**浏览器**根据**内容**的大小来决定。好处是天然防溢出（盒子会随内容伸缩），坏处是你放弃了精确控制。

web.dev 用一个比喻：固定尺寸像一个**硬玻璃杯**——水太多会溢出来；而内在尺寸像一个**能随水量变形的杯子**——永远刚好装下。两种思路各有场景，关键是知道何时用哪个。

## 外在尺寸：width / height 与上下限

### 固定值与百分比

```css
.box {
  width: 400px; /* 固定宽 */
  width: 50%; /* 父级可用宽度的一半 */
}
```

`width` 用百分比时，是相对**父元素的可用宽度**算的。一个**关键的坑**：`margin` 和 `padding` 的百分比，**无论方向**（上下左右），**一律相对父级的宽度**算——所以 `padding-top: 10%` 是父级**宽度**的 10%，不是高度。这常被用来做固定宽高比的占位（不过现在有了 `aspect-ratio`，见下页，更直观）。

### min / max 设上下限

```css
.box {
  width: 50%;
  min-width: 320px; /* 再窄不能窄于 320px */
  max-width: 1200px; /* 再宽不能宽于 1200px */
}
```

`min-width` / `max-width`（以及 `min-height` / `max-height`）给尺寸**钳定边界**，是响应式布局的主力。记住优先级：**`max-width` 会覆盖 `width`，`min-width` 又会覆盖 `max-width`**——所以最终宽度是「先按 `width`，再被 `max` 压顶、被 `min` 托底」。

::: warning `min-width: 100%` 可能超出父级
web.dev 提醒：`min-content` 等内在最小值，或 `min-width: 100%` 配合某些上下文，**可能让元素比父级还宽**而溢出。设最小尺寸时留意它和父级的关系，别把「最小」设成了「溢出源」。
:::

### 视口单位

```css
.hero {
  height: 100vh; /* 视口高度的 100% */
  width: 100vw; /* 视口宽度的 100%（注意含滚动条宽，可能横向溢出）*/
}
```

`vw` / `vh` 相对**视口**尺寸，`vmin` / `vmax` 取视口宽高中的**较小 / 较大**者。现代还有应对移动端地址栏伸缩的 `svh`（最小视口）/ `lvh`（最大视口）/ `dvh`（动态视口）——做全屏首屏时，`dvh` 通常比 `vh` 体验更稳。

## 内在尺寸：让内容说话

这是本页的重点。三个关键字让盒子按**内容**而非固定值定大小。设想一段文字 `Item with more text in it.`：

### `min-content`：缩到最长单词

```css
.box {
  width: min-content;
}
```

`min-content` 把盒子缩到**不造成「可避免的溢出」的最小尺寸**。对文字而言，它会在**每一个可换行处（如词间空格）都折行**，于是盒子的宽度就等于**最长的那个单词**的宽度。再窄就会切断单词造成溢出，所以这是「不溢出的下限」。

```
width: min-content
┌──────┐
│ Item │
│ with │   ← 每个词都折行，
│ more │     盒子 = 最长单词宽
│ text │
│ in   │
│ it.  │
└──────┘
```

### `max-content`：撑到一行不换

```css
.box {
  width: max-content;
}
```

`max-content` 把盒子撑到**容纳全部内容、完全不折行**所需的宽度。对文字而言，它**一个换行都不打**——哪怕因此**溢出**了容器也在所不惜。

```
width: max-content
┌────────────────────────────┐
│ Item with more text in it. │   ← 一行到底，可能冲出容器
└────────────────────────────┘
```

### `fit-content`：聪明的折中

```css
.box {
  width: fit-content;
}
```

`fit-content` 是前两者的**智能折中**，也是实务中最常用的：它**像 `max-content` 那样贴着内容**，但**绝不超过可用空间**——空间够就一行铺开，空间不够就折行，且**永不小于 `min-content`、永不大于 `max-content`**。MDN 给出的等价公式：

```
fit-content = min( max-content, max( min-content, 可用空间 ) )
```

典型用途：一个**宽度刚好贴着文字、不占满整行**的按钮 / 标签 / 标题背景：

```css
/* 标题的背景色块只包住文字，而不是铺满一整行 */
.tag {
  width: fit-content;
  padding: 0.25rem 0.75rem;
  background: #eef;
}
```

### `fit-content()` 函数：带上限的 fit-content

注意区分：`fit-content`**关键字**和 `fit-content()`**函数**是两回事。函数版接收一个参数作为**上限**：

```css
/* 内容自适应，但最宽不超过 20em */
.col {
  width: fit-content(20em);
}

/* 多用于 Grid 轨道：该列按内容伸缩，但封顶 300px */
.grid {
  grid-template-columns: fit-content(300px) 1fr;
}
```

## 一张对照表

| 关键字 | 文字怎么排 | 盒子宽度 | 典型用途 |
| --- | --- | --- | --- |
| `min-content` | 能折就折，挤到最窄 | = 最长单词宽 | 极窄列、避免任何溢出 |
| `max-content` | 完全不折行 | = 一整行宽（可溢出） | 不希望内容折行的标签 |
| `fit-content` | 空间够不折、不够才折 | 贴内容但 ≤ 可用空间 | **贴文字的按钮 / 标签**（最常用） |

## 别忘了逻辑属性

和盒模型一样，尺寸也有逻辑等价物——**优先用它们**，国际化场景更稳：

```css
.box {
  inline-size: 50%; /* = 书写方向下的「宽」（横排时即 width）*/
  block-size: 200px; /* = 书写方向下的「高」（横排时即 height）*/
  max-inline-size: 65ch; /* = max-width，65 个字符宽，最佳阅读行长 */
}
```

`inline-size` / `block-size`、`min-inline-size` / `max-inline-size` 等会随 `writing-mode` 自动对应到物理的宽或高，一套代码适配横排与竖排。

## 小结

尺寸的核心抉择是「外在（你给固定值，可能溢出）vs 内在（内容说了算，天然防溢出）」，而 `min-content` / `max-content` / `fit-content` 这三个关键字让「让内容决定大小」成为一行 CSS 的事——其中 `fit-content` 最常用。说到「让浏览器按比例算尺寸」，还有一个现代利器专门锁定**宽高比**、并能消除图片加载时的页面跳动——下一页讲 `aspect-ratio`：[`aspect-ratio` 与现代尺寸](./aspect-ratio)。
