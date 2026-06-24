---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 媒体查询：`@media (width >= 600px) { … }` —— 按**视口**决策，现代 range 语法（替代 `min-width: 600px`）
- 用户偏好：`@media (prefers-color-scheme: dark)` / `(prefers-reduced-motion: reduce)` —— 尊重系统设置，关乎无障碍
- 容器查询：父加 `container-type: inline-size`，子写 `@container (width >= 30em) { … }` —— 按**容器**决策，组件级（Baseline 2023-02）
- 容器单位：`cqi` / `cqw` / `cqb` / `cqh` / `cqmin` / `cqmax` —— `1cqi` = 容器 inline-size 的 1%
- 特性查询：`@supports (display: grid) { … }` —— 探测能力后渐进增强；`@supports not (…)` 写降级
- 逻辑属性：`margin-inline` / `padding-block` / `inset-inline-start` —— 跟随书写方向，一套样式适配 LTR + RTL
- 多列：`columns: 18rem` —— 按列宽自动决定列数，杂志式排版的最省心写法
- 心智：媒体=页面级、容器=组件级、`@supports`=能力级、逻辑属性=方向级——四个维度互补
- 单位建议：断点优先用 `em` / `rem`（跟随用户字号），少用裸 `px`

## 「现代查询家族」五件套

「响应式」早已不只是媒体查询。下面这份概览把现代 CSS 里所有「让样式随环境变化」的工具摆在一起——本叶其余各页就是逐件拆解它们：

```css
/* ① 媒体查询：按视口尺寸决策（页面级） */
@media (width >= 600px) {
  .layout {
    grid-template-columns: 1fr 2fr;
  }
}

/* ② 用户偏好：按系统设置决策（无障碍） */
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0d1117;
  }
}
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
  }
}

/* ③ 容器查询：按祖先容器尺寸决策（组件级） */
.card-wrap {
  container-type: inline-size;
}
@container (width >= 30em) {
  .card {
    display: grid;
    grid-template-columns: 8rem 1fr;
  }
}

/* ④ 特性查询：按浏览器能力决策（渐进增强） */
@supports (display: grid) {
  .gallery {
    display: grid;
  }
}

/* ⑤ 逻辑属性：按书写方向决策（i18n） */
.note {
  margin-inline-start: 1rem; /* LTR 时是左、RTL 时是右 */
  padding-block: 0.5rem;
}
```

::: tip 一句话区分四种「查询」
**媒体**查询问「视口 / 设备 / 用户怎么样」；**容器**查询问「我所在的容器多大」；**特性**查询（`@supports`）问「浏览器支不支持这个 CSS」；**逻辑属性**不是查询，而是「让方向相关的属性自动跟随书写模式」。
:::

## 逐件速览

### ① 媒体查询与 range 语法

媒体查询按**视口**做决策，是最经典的响应式工具。现代 CSS 用比较运算符写区间，比 `min-/max-` 更直观：

```css
/* 旧写法 */
@media (min-width: 600px) and (max-width: 900px) { /* … */ }

/* 现代 range 语法（Media Queries Level 4） */
@media (600px <= width <= 900px) { /* … */ }
```

详见 [媒体查询与 range 语法](./guide-line/media-queries)。

### ② 用户偏好

媒体查询的重心已从「屏幕多大」转向「用户想要什么」。这组特征读取的是系统级偏好，**不响应它们是无障碍缺陷**：

```css
@media (prefers-reduced-motion: reduce) {
  .carousel {
    scroll-behavior: auto;
  }
}
```

详见 [用户偏好查询](./guide-line/user-preferences)。

### ③ 容器查询

容器查询让组件按「自己所在容器的尺寸」排版，而非视口——这才是真正的**组件级响应式**。两步走：父元素声明 `container-type`，子元素用 `@container` 查询：

```css
.sidebar {
  container-type: inline-size; /* 声明为查询容器 */
}
@container (width >= 20em) {
  .widget { display: flex; }
}
```

详见 [容器查询](./guide-line/container-queries)。

### ④ `@supports` 特性查询

先探测浏览器是否支持某个 CSS，再决定用新写法还是降级——这是渐进增强的基石：

```css
@supports not (aspect-ratio: 1) {
  .box { padding-top: 100%; } /* 老浏览器的回退 */
}
```

详见 [`@supports` 特性查询](./guide-line/supports-feature-queries)。

### ⑤ 逻辑属性

把 `left/right/top/bottom` 换成 `inline-start/inline-end/block-start/block-end`，样式就会**自动跟随书写方向**——同一套 CSS，中英文（从左到右）与阿拉伯语（从右到左）都正确：

```css
.callout {
  border-inline-start: 4px solid; /* LTR 在左、RTL 在右 */
  padding-inline: 1rem;
}
```

详见 [逻辑属性与书写模式](./guide-line/logical-properties)。

## 一个最小可运行示例

下面这段组合了媒体查询、容器查询与逻辑属性，是「现代响应式」的缩影：

```html
<main class="page">
  <aside class="sidebar">
    <div class="card">
      <img src="cover.jpg" alt="封面" />
      <div class="card__body">
        <h3>标题</h3>
        <p>摘要……</p>
      </div>
    </div>
  </aside>
</main>
```

```css
/* 页面级：窄屏单列、宽屏两栏 */
.page {
  display: grid;
  gap: 1rem;
}
@media (width >= 60em) {
  .page {
    grid-template-columns: 20rem 1fr;
  }
}

/* 组件级：卡片按所在容器宽度切换横/竖排 */
.sidebar {
  container-type: inline-size;
}
.card {
  display: grid;
}
@container (width >= 24em) {
  .card {
    grid-template-columns: 6rem 1fr;
  }
}

/* 方向级：内边距跟随书写方向 */
.card__body {
  padding-inline: 1rem;
  padding-block: 0.75rem;
}
```

注意：把卡片从侧栏换到任何别的容器，它都会按**新容器**的宽度重新决定横竖排——这正是容器查询相对媒体查询的根本优势。

## 下一步

按本叶地图依次深入，或直接跳到你最关心的一页——[媒体查询](./guide-line/media-queries)、[用户偏好](./guide-line/user-preferences)、[容器查询](./guide-line/container-queries)、[`@supports`](./guide-line/supports-feature-queries)、[逻辑属性](./guide-line/logical-properties)、[多列布局](./guide-line/multicol-patterns)。
