---
layout: doc
outline: [2, 3]
---

# 逻辑属性与书写模式

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 物理 vs 逻辑：物理属性认死方向（top/right/bottom/left）；逻辑属性跟随**内容流向**，方向变它就变
- 两条轴：**block 轴**（块流动方向，中英文里是上下）、**inline 轴**（文字书写方向，中英文里是左右）
- 四个边：`block-start` / `block-end`（≈上 / 下）、`inline-start` / `inline-end`（≈左 / 右，RTL 时反过来）
- 外边距：`margin-inline` / `margin-block`，及 `margin-inline-start` / `margin-inline-end` 等单边
- 内边距 / 边框：`padding-inline` / `padding-block`、`border-inline` / `border-block`，同理有单边
- 尺寸：`inline-size`（≈宽）/ `block-size`（≈高），及 `min-` / `max-` 前缀版
- 定位：`inset-block` / `inset-inline`、`inset-inline-start` 等替代 `top/right/bottom/left`
- 对齐：`text-align: start` / `end`（跟随阅读方向）替代 `left` / `right`
- 书写控制：`writing-mode`（horizontal-tb / vertical-rl …）、`direction`（ltr / rtl）
- 视口单位：`vi`（inline，≈vw）/ `vb`（block，≈vh）；圆角 `border-start-start-radius` 等
- 价值：一套样式**自动适配** LTR（中英）与 RTL（阿拉伯 / 希伯来），i18n 免写镜像样式

## 物理属性的麻烦

`margin-left`、`text-align: right`、`top` 这些属性把方向**写死**在了物理空间里。问题是：不同语言的书写方向不同——中英文从左到右（LTR），阿拉伯语、希伯来语从右到左（RTL），传统中日文还可能竖排。一旦页面要支持 RTL，所有 `left/right` 都得镜像翻转，过去往往要维护两套样式表。

逻辑属性的思路是：**不再说「左右上下」，改说「开始 / 结束」**——让属性跟随**内容的流向**，方向改变时自动跟着变。一套 CSS 同时正确适配 LTR 与 RTL，这是国际化（i18n）的关键基础。

## 两条轴：block 与 inline

理解逻辑属性，先建立两条轴的概念（与 Flexbox / Grid 的轴是同一套思想）：

- **inline 轴**：文字**书写**的方向。中英文里是水平（左→右），阿拉伯语里也是水平但方向相反（右→左）。
- **block 轴**：内容**块**堆叠的方向。中英文里是垂直（上→下）。

于是四个逻辑边是：

| 逻辑边 | LTR（中英文）下约等于 | RTL（阿拉伯语）下约等于 |
| --- | --- | --- |
| `block-start` | 上 | 上 |
| `block-end` | 下 | 下 |
| `inline-start` | 左 | **右** |
| `inline-end` | 右 | **左** |

关键就在 `inline-start` / `inline-end`：它们在 LTR 与 RTL 下指向相反的物理方向，这正是「自动适配」的来源。

## 外边距、内边距、边框

把物理属性换成 `*-inline` / `*-block` 系列：

```css
/* 物理写法（RTL 下会错位） */
.note {
  margin-left: 1rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  border-left: 4px solid;
}

/* 逻辑写法（LTR / RTL 都正确） */
.note {
  margin-inline-start: 1rem; /* LTR 左、RTL 右 */
  padding-block: 0.5rem; /* 上下一起设 */
  border-inline-start: 4px solid; /* 引用块的「起始边」竖条 */
}
```

`*-inline` / `*-block` 的简写还支持「两值」分别设起止边：

```css
.box {
  margin-inline: 2rem 0; /* start=2rem, end=0 */
  padding-block: 1rem 0.5rem; /* start=1rem, end=0.5rem */
}
```

## 尺寸：`inline-size` 与 `block-size`

`width` / `height` 的逻辑版是 `inline-size` / `block-size`——横排时分别约等于宽和高，但竖排或 RTL 下含义随轴而变：

```css
/* 物理 */
.card {
  max-width: 60ch;
  min-height: 8rem;
}

/* 逻辑 */
.card {
  max-inline-size: 60ch; /* 限制「行长」，竖排时自动变成限高 */
  min-block-size: 8rem;
}
```

用 `max-inline-size: 60ch` 限制行长尤其优雅——无论文字横排还是竖排，它约束的始终是「一行能排多长」这件语义上的事。

## 定位：`inset-*`

绝对 / 相对定位的偏移也有逻辑版：

```css
/* 物理 */
.badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
}

/* 逻辑：RTL 下徽标自动跑到左上 */
.badge {
  position: absolute;
  inset-block-start: 0.5rem;
  inset-inline-end: 0.5rem;
}
```

`inset` 还有合并简写：`inset-block`（上下）、`inset-inline`（起止），以及四值的 `inset`（等价 `top/right/bottom/left`，但仍是物理的，注意区分）。

## 对齐：`start` / `end`

`text-align` 用 `start` / `end` 代替 `left` / `right`，文本就会**靠阅读方向的起始 / 结束端**对齐：

```css
/* 物理：RTL 下「靠右」其实违和 */
.cell { text-align: right; }

/* 逻辑：始终靠「结束端」，LTR 在右、RTL 在左 */
.cell { text-align: end; }
```

`float` 同样有 `inline-start` / `inline-end` 取值，行为类比。

## 圆角与视口单位

四个角的圆角也有逻辑版，命名是「两个轴向起止」组合，如 `border-start-start-radius`（block 起 + inline 起）：

```css
.tag {
  /* 物理：左上 + 左下 */
  /* border-top-left-radius / border-bottom-left-radius */

  /* 逻辑：inline 起始侧的两个角 */
  border-start-start-radius: 0.5rem;
  border-end-start-radius: 0.5rem;
}
```

视口单位也有逻辑版：`vi`（视口 inline-size 的 1%，≈ `vw`）、`vb`（视口 block-size 的 1%，≈ `vh`）。

## 书写模式：`writing-mode` 与 `direction`

逻辑属性之所以能「自动适配」，是因为它们绑定到了文档的**书写模式**与**方向**——这两个属性才是真正的「总开关」：

```css
/* 整页或局部切到 RTL */
.rtl-block {
  direction: rtl;
}

/* 竖排（传统中日文 / 装饰性标题） */
.vertical {
  writing-mode: vertical-rl; /* 从右向左的竖排列 */
}
```

- `direction`：`ltr`（默认）/ `rtl`。也可在 HTML 上用 `dir` 属性设置（推荐 HTML 层面设，语义更完整）。
- `writing-mode`：`horizontal-tb`（默认，水平自上而下）/ `vertical-rl`（竖排从右到左）/ `vertical-lr`（竖排从左到右）等。

一旦书写模式 / 方向改变，前面所有 `*-inline` / `*-block` / `start` / `end` 属性都会自动跟随——这就是「写一套、适配多语言」的底层机制。

::: tip 图标 + 文字的经典坑
图标在文字左边、用 `margin-right: 0.5em` 拉开间距——切到 RTL 后图标跑到文字右边，间距却还在右边，于是图标贴住了文字。改用 `margin-inline-end: 0.5em`，间距就永远在「文字那一侧」，LTR / RTL 都对：

```css
.icon {
  margin-inline-end: 0.5em; /* 永远在朝向文字的那侧 */
}
```
:::

## 小结

逻辑属性把方向相关的 CSS 从「物理左右上下」升级为「跟随内容流向的 inline / block 起止」——`margin-inline`、`inset-block`、`text-align: start`、`inline-size` 配合 `writing-mode` / `direction`，让一套样式自动适配 LTR 与 RTL，是国际化的基础设施。下一页收束本叶：一个常被忽略却很实用的响应式排版工具，并把全叶各类查询串成实战配方：[多列布局与响应式综合](./multicol-patterns)。
