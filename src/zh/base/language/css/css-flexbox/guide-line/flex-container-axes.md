---
layout: doc
outline: [2, 3]
---

# Flex 容器与轴向模型

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 开启容器：`display: flex`（块级，独占一行）或 `display: inline-flex`（行内，与文字同行）
- 直接子元素自动成为「弹性项目」；孙子元素不受影响，要嵌套就再开一层容器
- 主轴（main axis）由 `flex-direction` 决定；交叉轴（cross axis）**永远垂直于主轴**
- `flex-direction` 四值：`row`（默认横向）、`row-reverse`、`column`（纵向）、`column-reverse`
- `flex-direction: row` → 主轴横向、交叉轴纵向；`column` → 主轴纵向、交叉轴横向（轴会互换）
- 逻辑边界：主轴有 main-start / main-end，交叉轴有 cross-start / cross-end——用「起点 / 终点」而非「左 / 右」，天然适配 RTL
- 容器默认隐含：`flex-direction: row` + `flex-wrap: nowrap` + `align-items: stretch`
- 默认行为：项目挤在一行、从主轴起点排起、交叉轴方向被拉伸到等高、空间不够宁可溢出也不换行
- `*-reverse` 只改视觉顺序，**不改 DOM / Tab 顺序**——会割裂键盘与读屏体验，慎用

## 用 `display` 开启弹性容器

让一个元素成为弹性容器，只需一个声明：

```css
.container {
  display: flex; /* 块级弹性容器：自身像 block 一样独占一行 */
}

.inline-container {
  display: inline-flex; /* 行内弹性容器：自身像 inline-block 一样可与文字同排 */
}
```

两者的唯一区别是**容器自身**在外部如何参与排版（块级 vs 行内）；对**内部弹性项目**的影响完全一致。日常九成场景用 `display: flex` 即可。

一旦开启，容器的所有**直接子元素**立即变成弹性项目，并带上一组初始行为（下文「默认行为」一节展开）。

::: tip 弹性项目里的「匿名」内容
如果容器里直接夹了一段裸文本（没有元素包裹），浏览器会把这段文本当成一个匿名弹性项目处理。实务中建议总是用元素包好内容，避免对齐时出现意外。
:::

## 两根轴：主轴与交叉轴

这是整个 Flexbox 最核心的概念。Flexbox 是**一维**布局——它一次只沿着一根「主轴」排列项目；与主轴垂直的那根叫「交叉轴」。

- **主轴（main axis）**：弹性项目沿它依次排开。方向由 `flex-direction` 决定。
- **交叉轴（cross axis）**：始终与主轴**垂直**，用来对齐单行内部、或分布多行之间。

主轴方向一变，交叉轴跟着换向：

| `flex-direction` | 主轴方向 | 交叉轴方向 |
| --- | --- | --- |
| `row`（默认） | 横向（行的起点 → 终点） | 纵向（上 → 下） |
| `row-reverse` | 横向（终点 → 起点） | 纵向（上 → 下） |
| `column` | 纵向（上 → 下） | 横向（行的起点 → 终点） |
| `column-reverse` | 纵向（下 → 上） | 横向（行的起点 → 终点） |

这张表解释了一个高频困惑：**`justify-content` 与 `align-items` 谁管横、谁管纵，取决于 `flex-direction`**。在 `row` 下 `justify-content` 管横向；一旦切到 `column`，`justify-content` 就改管纵向了——因为它永远作用在「主轴」上，而主轴随方向翻转。

## 起点与终点：为什么不说「左右」

Flexbox 刻意不用 `left` / `right` / `top` / `bottom`，而用**逻辑方位**：

- 主轴：**main-start**（主轴起点）→ **main-end**（主轴终点）
- 交叉轴：**cross-start**（交叉轴起点）→ **cross-end**（交叉轴终点）

这样做是为了适配**书写模式与文字方向**：

- 在中英文（从左到右，LTR）里，`flex-direction: row` 的起点在**左**、终点在**右**；
- 在阿拉伯语 / 希伯来语（从右到左，RTL）里，同样是 `row`，起点却在**右**、终点在**左**。

正因如此，`justify-content: flex-start` 表达的是「贴主轴起点」，而非「贴左边」——它会自动跟随文字方向。这也是为什么 Flexbox 天生对国际化友好。

## `flex-direction`：决定主轴的四个方向

```css
.box {
  display: flex;
  flex-direction: row; /* 默认：横向，从起点到终点 */
}
```

四个取值：

```css
flex-direction: row; /* 横向排列（默认） */
flex-direction: row-reverse; /* 横向排列，但顺序反过来，从终点排起 */
flex-direction: column; /* 纵向排列，自上而下 */
flex-direction: column-reverse; /* 纵向排列，但自下而上 */
```

- `row` / `column` 决定是「横着排」还是「竖着排」；
- 加上 `-reverse` 后缀，则在该方向上**把视觉顺序整体颠倒**。

::: warning `*-reverse` 与 `order` 的无障碍代价
`row-reverse` / `column-reverse`（以及后面会讲的 `order` 属性）只改变**视觉呈现顺序**，**不改变 DOM 顺序**。这意味着：

- 屏幕阅读器仍按 DOM 顺序朗读；
- 键盘 Tab 焦点仍按 DOM 顺序移动。

结果是「看到的顺序」与「读到 / 跳到的顺序」对不上，对依赖键盘和读屏的用户极不友好。**不要用 `*-reverse` / `order` 去修正本应在 HTML 里调整的结构顺序**——视觉顺序和逻辑顺序应尽量一致。
:::

## 容器开启后的默认行为

只写 `display: flex`、其余什么都不加时，容器隐含了这样一组默认值：

```css
.container {
  display: flex;
  /* flex-direction: row;   主轴横向 */
  /* flex-wrap: nowrap;     不换行 */
  /* align-items: stretch;  交叉轴方向拉伸 */
}
```

由此产生的可观察行为是：

- 项目沿主轴排成**单独一行**；
- 从主轴**起点**开始挨个排（等价于 `justify-content: flex-start`）；
- 在主轴方向上**不会主动变大**，但空间不够时**可以收缩**（即项目默认 `flex: 0 1 auto`）；
- 在交叉轴方向上被**拉伸**到与最高项目等高（`align-items: stretch`）——这正是「Flexbox 自动等高列」的来源；
- 若所有项目总宽超过容器，它们会**溢出**而不是换行（因为 `nowrap`）。

把这组默认行为记牢，后面学每个属性其实都是在「改写其中一条默认」而已。

## 小结

`display: flex` 开启容器、`flex-direction` 钉死主轴方向、交叉轴自动垂直于主轴——这套「轴向模型」是 Flexbox 的骨架。下一页起进入真正的对齐属性：先看如何在**主轴**上分布项目，也就是 [主轴对齐与分布](./main-axis-alignment)。
