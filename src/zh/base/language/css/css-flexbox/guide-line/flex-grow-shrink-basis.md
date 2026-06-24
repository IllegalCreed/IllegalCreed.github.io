---
layout: doc
outline: [2, 3]
---

# flex 三值与计算

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- `flex` 是 `flex-grow` / `flex-shrink` / `flex-basis` 三者的简写，**写在项目上**
- `flex-grow`（默认 `0`）：剩余空间的**抢占比例**，0 不抢，越大占越多
- `flex-shrink`（默认 `1`）：空间不足时的**收缩比例**，0 不缩，越大缩越狠
- `flex-basis`（默认 `auto`）：伸缩**之前**的起始尺寸；`auto` 取 `width` / `height`，没设则取内容尺寸
- 四个必背关键字：`flex: initial` = `0 1 auto`；`flex: auto` = `1 1 auto`；`flex: none` = `0 0 auto`；`flex: 1` = `1 1 0`
- 单数字 `flex: <n>` 展开为 `<n> 1 0`（注意 basis 归零）；单长度 `flex: 200px` 展开为 `1 1 200px`
- 等分列配方：每个项目 `flex: 1`（从 0 起算、等比抢空间，列宽相等）
- 「内容多的占多、但都能伸缩」用 `flex: auto`（从内容尺寸起算再伸缩）
- 子项不肯缩 / 溢出父级：给它 `min-width: 0`（项目默认不缩小于 `min-content`）
- 省略 basis 时浏览器按 `0%` 而非 `0` 计算，个别布局差异由此而来

## 三个独立属性

`flex` 简写背后是三个各管一段的属性。先把它们拆开理解，简写就水到渠成。

### `flex-grow`：怎么分「多出来」的空间

当主轴上**有剩余空间**时，`flex-grow` 决定每个项目能抢到多少。它是个**比例系数**，不是具体尺寸：

```css
flex-grow: 0; /* 默认：不抢，保持基础尺寸 */
flex-grow: 1; /* 参与瓜分剩余空间 */
flex-grow: 2; /* 抢占速度是 flex-grow:1 项目的两倍 */
```

- 只有存在剩余空间时才生效；
- 所有项目都 `flex-grow: 1` → 剩余空间**均分**；
- 一个 `flex-grow: 2`、其余 `flex-grow: 1` → 那个项目分到的剩余空间是别人的两倍（注意是「剩余空间」按比例，不是「总宽」按比例）。

### `flex-shrink`：空间不够时谁先缩

当项目总尺寸**超过容器**时，`flex-shrink` 决定每个项目收缩的比例：

```css
flex-shrink: 1; /* 默认：可以收缩 */
flex-shrink: 0; /* 不收缩，宁可让容器溢出也保持尺寸 */
flex-shrink: 2; /* 收缩速度是 flex-shrink:1 项目的两倍 */
```

- 只有在项目溢出时才生效；
- `flex-shrink: 0` 常用来锁死「不能被压扁」的元素（如图标、头像）。

### `flex-basis`：从多大开始算

`flex-basis` 是项目在**伸缩发生之前**的起始尺寸——`flex-grow` / `flex-shrink` 都是在这个基准上做加减：

```css
flex-basis: auto; /* 默认：取自身 width/height；若都没设，则取内容尺寸 */
flex-basis: 200px; /* 起始就是 200px，再按 grow/shrink 调整 */
flex-basis: 0; /* 起始尺寸为 0，完全交给 flex-grow 分配 */
flex-basis: content; /* 显式按内容尺寸起算 */
```

`auto` 与 `0` 的差别非常关键，直接决定「等分」还是「按内容比例分」：

- **`flex-basis: auto`**：先按各自内容 / `width` 占好位，再分剩余空间——内容多的项目最终更宽；
- **`flex-basis: 0`**：所有项目从 0 起算，整条主轴都算「剩余空间」，于是完全按 `flex-grow` 比例分——这才是**真正等分**。

::: tip 子项「不肯缩、把父级撑破」怎么办
弹性项目默认**不会收缩到比自身 `min-content` 更小**。当项目里有长单词、长 URL 或 `white-space: nowrap` 的文本时，它的 `min-content` 可能很大，导致项目顶破容器。解法是给该项目（或其内层）加 `min-width: 0`（纵向用 `min-height: 0`），解除这条最小尺寸下限，让 `flex-shrink` 真正生效。这是 Flexbox 最常见的「玄学溢出」根因。
:::

## `flex` 简写：一行写齐三值

把上面三者合一就是 `flex`。它支持一值、二值、三值写法，**强烈推荐用简写**——因为简写会帮你把省略的项设成更合理的默认（尤其 basis）。

### 三值写法（最直白）

```css
.item {
  flex: 1 1 auto; /* grow=1, shrink=1, basis=auto */
  flex: 2 1 200px; /* grow=2, shrink=1, basis=200px */
}
```

### 一值 / 二值写法的展开规则

记住「单数字当 grow、单长度当 basis」：

```css
/* 一个无单位数字 → 当作 flex-grow，basis 归 0 */
flex: 2; /* 展开为 2 1 0 */

/* 一个长度 / 百分比 / 关键字 → 当作 flex-basis，grow/shrink 取 1 */
flex: auto; /* 展开为 1 1 auto */
flex: 10em; /* 展开为 1 1 10em */
flex: 30%; /* 展开为 1 1 30% */

/* 两个数字 → grow | shrink，basis 归 0 */
flex: 2 2; /* 展开为 2 2 0 */

/* 数字 + 长度 → grow | basis */
flex: 1 30px; /* 展开为 1 1 30px */
```

### 四个必背关键字

这四个覆盖了绝大多数真实需求，建议直接背下展开式：

| 写法 | 等价于 | 含义 |
| --- | --- | --- |
| `flex: initial` | `0 1 auto` | 默认值。不伸、可缩、按内容 / `width` 起算 |
| `flex: auto` | `1 1 auto` | 可伸可缩，从内容尺寸起算——内容多的占得多 |
| `flex: none` | `0 0 auto` | 完全锁死，不伸不缩，保持固有尺寸 |
| `flex: 1` | `1 1 0` | 从 0 起算并等比抢空间——**等分列**的标准写法 |

::: warning `flex: 1` 与 `flex: auto` 不是一回事
两者都「可伸可缩」，差别在 `flex-basis`：

- `flex: 1`（basis = 0）：忽略内容固有宽度，**严格等分**——三列各占 1/3，哪怕某列内容更长。
- `flex: auto`（basis = auto）：**先占住各自内容宽度，再分剩余**——内容长的列最终更宽。

做「均匀栅格」用 `flex: 1`；做「按内容比例、但都能伸缩」用 `flex: auto`。
:::

::: tip 省略 basis 时按 `0%` 计算
当 `flex` 里省略了 `flex-basis`（如写 `flex: 2`），浏览器实际采用的是 `0%` 而非纯粹的 `0`。两者在多数场景表现一致，但在涉及百分比尺寸的复杂布局里偶有差异——遇到诡异行为时值得留意这条规则。
:::

## 常见配方

把上面的知识落到几段可直接抄的代码：

```css
/* 配方 1：N 等分列（无论几个子项都均分） */
.grid > * {
  flex: 1;
}

/* 配方 2：一个固定侧栏 + 一个自适应主区 */
.sidebar {
  flex: 0 0 240px;
} /* 锁死 240px，不伸不缩 */
.main {
  flex: 1;
} /* 吃掉剩余全部宽度 */

/* 配方 3：按权重分配（中间列占两份） */
.col {
  flex: 1;
}
.col--wide {
  flex: 2;
} /* 这列宽度是普通列的两倍 */

/* 配方 4：内容决定基础宽度、但都能伸缩 */
.tag {
  flex: auto;
} /* 文字长的标签更宽，整体填满一行 */

/* 配方 5：绝不被压扁的图标 */
.icon {
  flex: none;
} /* = 0 0 auto，保持固有尺寸 */
```

## 小结

`flex-grow` 抢空间、`flex-shrink` 让空间、`flex-basis` 定起点，而 `flex` 简写用四个关键字（`initial` / `auto` / `none` / `1`）就能覆盖日常九成场景；等分列记 `flex: 1`、锁死尺寸记 `flex: none`、子项溢出记 `min-width: 0`。单行的伸缩讲透后，下一页让容器**换行**，并顺带把排序与间距收尾——[换行、排序与间距](./wrap-order-gap)。
