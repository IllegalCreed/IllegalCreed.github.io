---
layout: doc
outline: [2, 3]
---

# `aspect-ratio` 与现代尺寸

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- `aspect-ratio` 给盒子设一个**首选宽高比**，参与「自动尺寸」计算；**Baseline 2021 广泛可用**
- 取值：`auto` / `<ratio>`（如 `16 / 9`、`1`、`0.5`）/ `auto && <ratio>`（如 `3 / 2 auto`）
- 省略斜杠后的高度默认为 `1`——`aspect-ratio: 1` 等同 `1 / 1`（正方形）
- **生效前提**：宽高里**至少一边是 auto**；若 `width`、`height` 都被显式指定，比例被忽略
- 只设一边（如 `width: 200px; aspect-ratio: 16/9`），另一边自动算出（高 ≈ 112px）
- 对替换元素（`<img>` 等）：`aspect-ratio: 3 / 2 auto` 表示「加载前用 3/2 占位，加载后用图片**固有比例**」
- 防 CLS（累积布局偏移）：给 `<img>` 同时写 HTML 的 `width`/`height` 属性，浏览器自动算出 `aspect-ratio` 占好位
- 应用于内容盒还是边框盒，取决于 `box-sizing`（`<ratio>` 形式）；`auto`（固有比例）始终基于内容盒
- 适用所有元素，**除了**行内盒和内部 ruby / table 盒

## 一行锁定宽高比

过去要让一个盒子保持固定宽高比（比如视频 16:9、头像 1:1），得用「`padding-top` 百分比 + 绝对定位子元素」的 hack。`aspect-ratio` 把它变成一行：

```css
.video {
  width: 100%;
  aspect-ratio: 16 / 9; /* 宽随容器变，高自动 = 宽 × 9/16 */
}
```

无论容器或视口怎么变，浏览器都会**自动调整另一边**来维持这个宽高比。MDN 的定义：`aspect-ratio` 设定盒子的**首选宽高比**，「用于自动尺寸及部分布局函数的计算」。

### 取值速览

```css
aspect-ratio: auto; /* 默认：无首选比例（替换元素则用固有比例）*/
aspect-ratio: 1 / 1; /* 正方形 */
aspect-ratio: 16 / 9; /* 宽屏 */
aspect-ratio: 0.5; /* = 1 / 2，高是宽的两倍（竖条）*/
aspect-ratio: 3 / 2 auto; /* 替换元素回退：见下文 */
```

- `<ratio>` 写成 `宽 / 高`；**省略斜杠和高度时，高度默认为 `1`**，所以 `aspect-ratio: 1` 就是 `1 / 1`。

## 生效的前提：至少一边是 auto

这是最容易踩的一点。MDN 说得很直接：

> **至少有一边的尺寸必须是 auto，`aspect-ratio` 才会起作用。** 如果宽和高都不是自动尺寸，那这个比例对盒子的首选尺寸**没有任何影响**。

换句话说：

```css
/* ✅ 生效：宽固定，高 auto，高被算成 200 × 9/16 ≈ 112px */
.a {
  width: 200px;
  height: auto;
  aspect-ratio: 16 / 9;
}

/* ❌ 不生效：宽高都写死了，aspect-ratio 被忽略 */
.b {
  width: 200px;
  height: 200px;
  aspect-ratio: 16 / 9; /* 形同虚设 */
}
```

规则总结：

- **宽固定、高 auto** → 高被算出来维持比例；
- **高固定、宽 auto** → 宽被算出来维持比例；
- **宽高都显式指定** → 比例被忽略。

::: warning 内容比盒子大时，比例会「让步」
`aspect-ratio` 设的是**首选**比例。如果盒子里的内容撑得比按比例算出的尺寸还大，盒子会**被内容撑开**而打破比例（这是为了不裁切内容）。需要严格锁定时，配合 `overflow: hidden` 或 `min-height: 0` 使用。
:::

## 替换元素与 `auto && <ratio>`

`<img>`、`<video>` 这类**替换元素**自带**固有宽高比**（图片本身的宽高比）。`auto && <ratio>` 双值语法专为它们提供「**占位比例 + 固有比例**」的回退：

```css
img {
  width: 200px;
  aspect-ratio: 3 / 2 auto;
}
```

- **图片加载前**：用 `3 / 2` 作为占位比例，盒子先按这个比例占好空间；
- **图片加载后**：`auto` 接管，改用图片的**真实固有比例**。

## 用 `aspect-ratio` 消除图片 CLS

这是 `aspect-ratio` 最有价值的现代用途之一。**累积布局偏移（CLS，Cumulative Layout Shift）** 是 Core Web Vitals 之一——图片加载完成的瞬间，如果它之前**没占住高度**，下方内容会被突然「推下去」，页面一跳，体验很差、还扣分。

### 现代答案：HTML 写 width/height，浏览器自动算比例

最省事的做法——给 `<img>` 标签同时写上 HTML 的 `width` 和 `height` **属性**（注意是属性，不是 CSS）：

```html
<!-- 浏览器据此自动推导 aspect-ratio = 800/600，加载前就占好位 -->
<img src="photo.jpg" width="800" height="600" alt="一张照片" />
```

```css
/* 配合这段 CSS：宽度自适应，高度按固有比例走，比例不被打破 */
img {
  height: auto;
  max-width: 100%;
}
```

现代浏览器会**根据 `width` / `height` 属性自动计算出 `aspect-ratio`**，于是图片**加载前就预留了正确高度**，加载完成时不再发生跳动。这是今天处理图片 CLS 的标准做法。

### 显式 CSS 写法

也可以直接在容器上写 `aspect-ratio`，适合背景图、`object-fit` 裁切等场景：

```css
.thumb {
  aspect-ratio: 1 / 1; /* 正方形缩略图，加载前就占好位 */
  width: 100%;
  object-fit: cover; /* 图片填满并裁切，不变形 */
}
```

## `box-sizing` 对 `aspect-ratio` 的影响

一个易忽略的细节：

- 用 **`<ratio>`** 形式时，比例作用于哪一层盒子，**取决于 `box-sizing`**——`border-box` 下比例算的是边框盒，`content-box` 下算的是内容盒；
- 用 **`auto`**（替换元素固有比例）时，**始终基于内容盒**计算。

全局 `border-box`（见 [盒模型](./box-model)）下，`aspect-ratio` 自然算到边框盒，与你对尺寸的直觉一致。

## 小结

`aspect-ratio` 用一行 CSS 锁定宽高比，关键前提是「至少一边 auto」，替换元素可用 `auto && <ratio>` 做占位回退；它最实用的价值是配合 HTML 的 `width`/`height` 属性**消除图片 CLS**。比例和尺寸都定好后，还有最后一个绕不开的问题——内容**装不下**盒子时该裁切还是滚动？下一页讲 `overflow` 与滚动容器：[overflow 与滚动容器](./overflow-scroll)。
