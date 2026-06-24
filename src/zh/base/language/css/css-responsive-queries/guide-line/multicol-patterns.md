---
layout: doc
outline: [2, 3]
---

# 多列布局与响应式综合

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 简写：`columns: 18rem`（按列宽自动定列数）/ `columns: 3`（固定 3 列）/ `columns: 3 18rem`（列数封顶 + 列宽）
- `column-width`：列的**理想 / 最小**宽度——浏览器据视口算出能放几列，天然响应式（无需断点）
- `column-count`：固定列数；与 `column-width` 同设时，`column-count` 当作**上限**
- 列间距 / 分隔线：`column-gap: 2rem`、`column-rule: 1px solid #ccc`（宽 / 样式 / 色，类比 border）
- 跨列：`column-span: all` 让标题等横跨所有列（`none` 为默认不跨）
- 填充：`column-fill: balance`（默认，各列等高）/ `auto`（顺序填满，末列可短）
- 防断裂：`break-inside: avoid` 防元素被拦腰切到两列（卡片 / 图文组必加）；另有 `break-before/after`
- multicol 容器自成 BFC——子元素外边距不与容器折叠
- 综合范式：媒体定页面骨架 + 容器让组件自适应 + `@supports` 兜能力 + 逻辑属性适配方向
- Baseline：multicol 各属性现代浏览器广泛支持，可放心用

## 多列布局：报纸 / 杂志式排版

多列布局（multicol）把一段连续内容像报纸一样**自动切成多栏**。它最妙的地方在于：用 `column-width` 指定「每列理想宽度」，浏览器会**根据可用宽度自动算出放几列**——这本身就是一种「无需写断点的响应式」。

### `columns` 简写

最常用的是 `columns` 简写，它接受长度（列宽）、整数（列数）或两者：

```css
/* 按列宽自适应：每列约 18rem，窄屏放 1 列、宽屏自动放更多 */
.prose {
  columns: 18rem;
}

/* 固定 3 列 */
.prose {
  columns: 3;
}

/* 两者都给：列宽 18rem，但最多 3 列（column-count 作上限） */
.prose {
  columns: 3 18rem;
}
```

「按列宽自适应」（`columns: 18rem`）是杂志式排版最省心的写法：随着容器变宽，列数从 1 → 2 → 3 平滑增加，每列宽度始终维持在理想值附近，完全不用写媒体查询。

### 间距、分隔线与跨列

```css
.prose {
  columns: 18rem;
  column-gap: 2rem; /* 列间距 */
  column-rule: 1px solid #ccc; /* 列间分隔线：宽 样式 色，语法类比 border */
}

/* 让大标题横跨所有列 */
.prose h2 {
  column-span: all;
}
```

`column-rule` 的写法和 `border` 一样（`column-rule-width` / `-style` / `-color` 三件套或简写），但它**不占布局空间**，只画在列间隙里。

### 防止内容被拦腰切断

多列布局会把内容沿列「流动」分割，默认可能把一张卡片、一组图文从中间切到两列。用 `break-inside: avoid` 保持元素完整：

```css
.prose figure,
.prose .card {
  break-inside: avoid; /* 整块不被拆到相邻两列 */
}
```

另有 `break-before` / `break-after`（取 `avoid` / `column` 等）控制元素**前 / 后**是否换列。`column-fill` 则控制各列高度：`balance`（默认，尽量等高）或 `auto`（按顺序填满、末列可短）。

::: tip multicol vs Grid / Flex
multicol 适合「**连续文本流**」的多栏排版（文章、词条列表）——内容在列间像水一样流动。若你要的是「一批**独立卡片**排成网格、各自定位」，那是 Grid 的活。判断标准：内容是「一条长流被切成几栏」就用 multicol，是「一组各自独立的项」就用 Grid。
:::

## 综合实战：四种工具协同

本叶讲了媒体查询、用户偏好、容器查询、`@supports`、逻辑属性、多列——真实页面里它们是**配合使用**的。下面这套范式展示典型分工。

### 范式一：媒体定骨架 + 容器定组件

```css
/* 页面级（媒体查询）：定整体栏数 */
.page {
  display: grid;
  gap: 1.5rem;
}
@media (width >= 64em) {
  .page {
    grid-template-columns: 18rem 1fr;
  }
}

/* 组件级（容器查询）：让卡片按所在容器自适应 */
.feed {
  container-type: inline-size;
}
.card {
  display: grid;
  gap: 0.75rem;
}
@container (width >= 28em) {
  .card {
    grid-template-columns: 8rem 1fr;
  }
}
```

媒体查询决定「侧栏 + 正文」的页面骨架，容器查询决定「卡片在它落脚的那个容器里」横排还是竖排——两者互不干扰，组件搬到哪都自适应。

### 范式二：`@supports` 兜底 + 逻辑属性适配方向

```css
/* 逻辑属性：内边距 / 竖条跟随书写方向，LTR/RTL 通吃 */
.callout {
  padding-inline: 1rem;
  padding-block: 0.75rem;
  border-inline-start: 4px solid royalblue;
}

/* @supports：新特性渐进增强，老浏览器有回退 */
.ratio-box {
  aspect-ratio: 16 / 9;
}
@supports not (aspect-ratio: 1) {
  .ratio-box {
    position: relative;
    padding-top: 56.25%;
  }
}
```

### 范式三：尊重用户偏好

```css
/* 暗色：跟随系统 */
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0d1117;
    --fg: #e6edf3;
  }
}

/* 动效：默认无、仅在用户未要求减弱时加上 */
@media (prefers-reduced-motion: no-preference) {
  .card {
    transition: transform 0.25s ease;
  }
}
```

### 四种工具的分工总表

| 工具 | 决策维度 | 典型职责 |
| --- | --- | --- |
| 媒体查询 `@media` | 视口 / 设备 | 页面骨架、导航折叠、打印样式 |
| 用户偏好 `@media (prefers-*)` | 系统设置 | 暗色、减弱动效、对比度（无障碍） |
| 容器查询 `@container` | 祖先容器尺寸 / 样式 | 组件级自适应、可复用小部件 |
| 特性查询 `@supports` | 浏览器能力 | 渐进增强、新旧实现二选一 |
| 逻辑属性 | 书写方向 | i18n、LTR / RTL 自动适配 |
| 多列 `columns` | 可用宽度 | 报纸 / 杂志式文本流排版 |

记住一句话：**媒体管页面、容器管组件、`@supports` 管能力、逻辑属性管方向、multicol 管文本流**——它们正交互补，组合起来才是「现代响应式」的完整形态。

## 小结

多列布局用 `columns: 18rem` 就能实现「无断点」的响应式分栏，配 `break-inside: avoid` 保持内容完整。把本叶六种工具按「媒体定骨架、容器定组件、`@supports` 兜能力、偏好尊重用户、逻辑属性适配方向、multicol 排文本流」的分工组合，就是一套现代、可复用、可访问、可国际化的响应式方案。各特性的速查与 Baseline 状态见 [参考](../reference)。
