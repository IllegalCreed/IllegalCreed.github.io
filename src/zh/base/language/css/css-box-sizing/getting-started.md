---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 一切皆盒：每个元素 = 内容盒 → 内边距盒 → 边框盒 → 外边距盒，四层由内向外
- `box-sizing: content-box`（默认）：`width` 只算内容，`padding` / `border` 往外**加**——盒子实际更大
- `box-sizing: border-box`（推荐）：`width` 含内容 + `padding` + `border`，往内**挤**——你写 `300px` 就是 `300px`
- 全局配方：`*, *::before, *::after { box-sizing: border-box; }`——几乎所有现代项目的第一条规则
- `display` 双值：外显示类型（`block` / `inline`，决定怎么参与外部流）+ 内显示类型（`flow` / `flow-root` / `flex` / `grid`，决定子元素怎么排）
- 外边距合并：相邻**块级**（垂直）外边距会合并成「较大的那个」；水平外边距**永不**合并
- BFC（块格式化上下文）：一块「自成一体」的布局区域，能**包住浮动**、**挡开外部浮动**、**阻止外边距合并**——`display: flow-root` 是最干净的开法
- 内在尺寸：`min-content`（缩到最长单词宽）/ `max-content`（撑到一行不换）/ `fit-content`（两者之间，按容器自适应）
- `aspect-ratio: 16 / 9`：锁宽高比，只设一边另一边自动算；图片配它可防 CLS
- `overflow`：`visible`（默认溢出可见）/ `hidden`（裁切无条）/ `scroll`（恒有条）/ `auto`（按需出条）/ `clip`（裁切且禁一切滚动）

## 一条主线：从「盒子多大」到「装不下怎么办」

CSS 布局再花哨，底座永远是这五个问题。本叶各页就是顺着这条主线展开的：

1. **一个盒子占多大？** → 盒模型四层 + `box-sizing` 决定。这是原子，见 [盒模型与 box-sizing](./guide-line/box-model)。
2. **它在流里是块还是行？** → `display` 的外/内显示类型决定。见 [display 全谱](./guide-line/display-values)。
3. **相邻盒子的间距怎么算？** → 块级外边距会「合并」，BFC 能阻止它。见 [外边距合并与 BFC](./guide-line/margin-collapse-bfc)。
4. **大小由谁说了算——内容还是容器？** → `width` 给固定值，`min-content` / `fit-content` 让内容说话。见 [尺寸与内在尺寸关键字](./guide-line/sizing-keywords)。
5. **内容装不下怎么办？** → `aspect-ratio` 预留比例、`overflow` 裁切或滚动。见 [`aspect-ratio`](./guide-line/aspect-ratio) 与 [overflow](./guide-line/overflow-scroll)。

## 一张图：盒模型四层

每个元素盒由内向外是四个区域，各管一段距离：

```
┌─────────────── margin（外边距，透明，盒子之间的间隔）───────────────┐
│  ┌──────────── border（边框，可见的框）──────────────────────────┐  │
│  │  ┌───────── padding（内边距，背景延伸到这里）────────────────┐  │  │
│  │  │  ┌────── content（内容，文字 / 图片所在）──────────────┐  │  │  │
│  │  │  │                                                    │  │  │  │
│  │  │  └────────────────────────────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

- **内容盒（content box）**：文字、图片真正占的地方，`width` / `height` 默认量的就是这一层。
- **内边距盒（padding box）**：`padding` 撑开的空间，在边框**内侧**，背景色 / 背景图会铺到这里。
- **边框盒（border box）**：`border` 画出的可见框。
- **外边距盒（margin box）**：`margin` 留出的盒子**之间**的透明间隔；`outline` 与 `box-shadow` 也画在这一层之上（不占布局空间）。

## 第一条规则：全局 `border-box`

几乎每个现代项目的样式表，开头都有这么一段：

```css
/* 让所有元素（含伪元素）的 width/height 都「所见即所得」 */
*,
*::before,
*::after {
  box-sizing: border-box;
}
```

为什么？默认的 `content-box` 下，`width: 300px` 再加 `padding: 20px` + `border: 1px`，盒子实际宽 `300 + 20×2 + 1×2 = 342px`——加内边距就「胀」出去，排版反复算账。改成 `border-box` 后，`width: 300px` 就**铁定**是 `300px`，内边距和边框往里挤、不影响外部尺寸。细节见 [盒模型与 box-sizing](./guide-line/box-model)。

::: tip 为什么用 `*` 而不是 `html { box-sizing: border-box; }` + 继承
两种写法都流行。直接 `*` 通配最简单直接；而「`html` 设 `border-box` + `*` 设 `box-sizing: inherit`」的写法，好处是第三方组件若自己声明了 `content-box`，其子元素能跟随它而非被你强制覆盖。新项目用 `*` 通配即可，无需纠结。
:::

## 一眼看懂 display 双值

`display` 其实同时设两件事——**对外**怎么参与父级的流、**对内**子元素怎么排：

```css
/* 现代双值语法：外显示类型 + 内显示类型 */
.a { display: block flow; }       /* = block：块盒，子元素走普通流 */
.b { display: inline flow; }      /* = inline：行内盒 */
.c { display: inline flow-root; } /* = inline-block：行内盒 + 自己开 BFC */
.d { display: block flow-root; }  /* = flow-root：块盒 + 自己开 BFC */
.e { display: block flex; }       /* = flex：块级 flex 容器 */
```

平时写的 `block` / `inline` / `inline-block` / `flex` / `grid` 都是这套双值的**单值简写**。理解了「外管参与方式、内管子元素布局」，`display` 的全谱就不再是死记。详见 [display 全谱](./guide-line/display-values)。

## 三个高频「怎么又踩坑」

- **「我设了 `margin-top: 20px`，父子之间怎么没间距？」** → 父子外边距**合并**了。给父级加 `padding` / `border`，或 `display: flow-root` 开 BFC。见 [外边距合并与 BFC](./guide-line/margin-collapse-bfc)。
- **「我想让按钮宽度刚好贴着文字，不要占满一行。」** → `width: fit-content` 或 `width: max-content`，让内容决定宽度。见 [尺寸与内在尺寸关键字](./guide-line/sizing-keywords)。
- **「图片加载完整个页面往下跳了一下。」** → 给图片容器设 `aspect-ratio`，加载前就把高度占住，消除 CLS。见 [`aspect-ratio`](./guide-line/aspect-ratio)。

## 下一步

主线已经铺好，挑你最关心的一页深入即可——[盒模型四层](./guide-line/box-model)、[display 全谱](./guide-line/display-values)、[外边距合并与 BFC](./guide-line/margin-collapse-bfc)、[内在尺寸](./guide-line/sizing-keywords)、[`aspect-ratio`](./guide-line/aspect-ratio)、[overflow](./guide-line/overflow-scroll)；或直接看 [参考](./reference) 速查表。
