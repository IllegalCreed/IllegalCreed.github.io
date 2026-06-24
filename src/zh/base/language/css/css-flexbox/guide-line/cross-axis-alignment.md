---
layout: doc
outline: [2, 3]
---

# 交叉轴对齐

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- `align-items`（容器）：把**所有项目**沿交叉轴对齐；默认 `stretch`（拉伸到等高 / 等宽）
- `align-items` 常用值：`stretch` 默认、`flex-start`、`flex-end`、`center`、`baseline`（按文字基线对齐）
- `align-self`（项目）：**单独**覆盖某个项目的交叉轴对齐，取值同 `align-items`，外加 `auto`（默认，回退到容器值）
- `align-content`（容器）：**多行**时分布「行与行」之间的空间；默认 `normal`（表现为 `stretch`）
- 重要边界：`align-content` 对**单行容器无效**（即 `flex-wrap: nowrap` 时完全不起作用）
- 交叉轴方向随 `flex-direction` 变：`row` 时交叉轴是纵向，`column` 时交叉轴是横向
- `stretch` 想生效，项目在交叉轴方向上**不能有固定尺寸**（如 `row` 下别设 `height`）
- `baseline` 让不同字号的项目按**文字基线**对齐，做导航 / 标签行特别整齐
- 完美居中：`justify-content: center`（主轴）+ `align-items: center`（交叉轴）

## 三个属性，三种粒度

交叉轴上的对齐由三个属性分工，按「作用范围」从大到小理解最清楚：

| 属性 | 写在哪 | 管什么 | 适用场景 |
| --- | --- | --- | --- |
| `align-items` | 容器 | **所有项目**在交叉轴上的对齐 | 整组统一对齐 |
| `align-self` | 项目 | **单个项目**的交叉轴对齐（覆盖 `align-items`） | 个别项目要特殊对待 |
| `align-content` | 容器 | **多行之间**的分布 | 仅当换行成多行时 |

前两个管「项目在自己那行里如何对齐」，最后一个管「多行整体如何分布」——别把它们搞混。

## `align-items`：所有项目的交叉轴对齐

`align-items` 写在**容器**上，统一设定所有项目在交叉轴上的对齐方式：

```css
.container {
  display: flex;
  align-items: center; /* 所有项目在交叉轴（row 时为纵向）居中 */
}
```

取值：

```css
align-items: stretch; /* 默认：在交叉轴方向拉伸填满容器（等高 / 等宽） */
align-items: flex-start; /* 贴交叉轴起点（row 时为顶部） */
align-items: flex-end; /* 贴交叉轴终点（row 时为底部） */
align-items: center; /* 交叉轴居中 */
align-items: baseline; /* 按各项目内文字的【基线】对齐 */
```

几个要点：

- **`stretch`（默认）** 是 Flexbox「自动等高列」的来源：项目会在交叉轴方向被拉伸到与最高（`row`）或最宽（`column`）的项目一致。
- 拉伸只在项目**没有固定交叉轴尺寸**时发生。`row` 布局下若某项设了 `height`，它就不再被拉伸，而是保持该高度。
- **`baseline`** 按文字基线对齐，适合一行里字号不一的元素（如「大标题 + 小标注」），比 `center` 更显整齐。

::: tip 让 `stretch` 等高生效的前提
想靠默认 `stretch` 实现等高列，要确保项目在交叉轴方向**没有写死尺寸**。常见失误是给卡片设了固定 `height` 又奇怪「为什么不等高」——其实是固定高度覆盖了拉伸。
:::

## `align-self`：单独覆盖某个项目

当大多数项目用同一种对齐、只有一两个要特殊处理时，给**那个项目**写 `align-self`，它会覆盖容器的 `align-items`：

```css
.container {
  display: flex;
  align-items: flex-start; /* 整组顶部对齐 */
}

.container .avatar {
  align-self: center; /* 唯独头像在交叉轴居中 */
}
```

取值与 `align-items` 完全相同（`stretch` / `flex-start` / `flex-end` / `center` / `baseline`），并额外支持：

```css
align-self: auto; /* 默认：不覆盖，沿用容器的 align-items */
```

这就是 Flexbox「整体统一、个别例外」的标准做法：容器定基调，个别项目用 `align-self` 破例。

## `align-content`：多行之间怎么分布

前两个属性管的是「项目在它所在那一行内」的对齐。而 `align-content` 管的是另一回事：**当容器换行成多行时，这些「行」在交叉轴上整体怎么排布**。

```css
.gallery {
  display: flex;
  flex-wrap: wrap; /* 必须先允许换行，才会有多行 */
  height: 400px; /* 且交叉轴上要有富余空间 */
  align-content: space-between; /* 各行在纵向上两端对齐分布 */
}
```

取值与 `justify-content` 高度对应（只是作用在「行」上、沿交叉轴）：

```css
align-content: normal; /* 默认：表现为 stretch，各行拉伸均分交叉轴空间 */
align-content: flex-start; /* 各行挤向交叉轴起点 */
align-content: flex-end; /* 各行挤向交叉轴终点 */
align-content: center; /* 各行整体居中 */
align-content: space-between; /* 首行贴起点、末行贴终点，行间均分 */
align-content: space-around; /* 每行上下各分一份，两端为半份 */
align-content: space-evenly; /* 行间与两端完全相等 */
align-content: stretch; /* 各行拉伸填满交叉轴 */
```

::: warning `align-content` 对单行容器无效
这是最容易踩的坑：**`align-content` 只在多行容器上有意义**。如果容器是 `flex-wrap: nowrap`（默认，单行），无论 `align-content` 写什么都**完全没有效果**——因为只有一行，没有「行与行之间」可分布。要让它生效，前提是 `flex-wrap: wrap`（或 `wrap-reverse`）且确实换出了多行、交叉轴上还有富余空间。

单行场景想调对齐，请用 `align-items`，而不是 `align-content`。
:::

## 交叉轴方向也随 `flex-direction` 翻转

和主轴一样，交叉轴的「方向」取决于 `flex-direction`：

- `flex-direction: row` → 交叉轴是**纵向**，`align-items: center` 是垂直居中；
- `flex-direction: column` → 交叉轴是**横向**，`align-items: center` 变成水平居中。

所以「`align-items` 到底管横还是管纵」没有固定答案，要先看主轴方向。这一点和上一页 `justify-content` 的逻辑完全对称。

## 一锤定音：完美居中

把主轴与交叉轴的居中各写一句，就是经典的「水平 + 垂直」居中：

```css
.center-box {
  display: flex;
  justify-content: center; /* 主轴居中 */
  align-items: center; /* 交叉轴居中 */
  min-height: 100vh;
}
```

无论被居中的内容多大、是文字还是图片，这两行都稳。它几乎是 Flexbox 最常被记住的一招。

## 小结

`align-items` 定整组、`align-self` 破个例、`align-content` 管多行——三者沿交叉轴各司其职，且都随 `flex-direction` 翻转方向。对齐讲完，下一页回到「尺寸」本身：项目到底如何伸、如何缩、从多大起算，也就是 [flex 三值与计算](./flex-grow-shrink-basis)。
