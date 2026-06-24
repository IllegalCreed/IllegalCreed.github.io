---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 开启：父元素 `display: flex`（块级容器）或 `display: inline-flex`（行内容器），直接子元素自动变成「弹性项目」
- 两根轴：**主轴**由 `flex-direction` 决定（默认 `row` 横向），**交叉轴**垂直于主轴——记住「主轴用 `justify-*`，交叉轴用 `align-*`」
- 主轴分布：`justify-content`（`flex-start` 默认 / `center` / `space-between` / `space-around` / `space-evenly`）
- 交叉轴对齐：`align-items`（`stretch` 默认 / `flex-start` / `center` / `baseline`）；单个项目用 `align-self` 覆盖
- 间距：`gap` / `row-gap` / `column-gap`——优先用它，别再用项目外边距凑空隙
- 项目伸缩：`flex` 简写（`flex-grow` / `flex-shrink` / `flex-basis`），等分列直接 `flex: 1`
- 默认值铁律：弹性项目初始为 `flex: 0 1 auto`（不伸、可缩、按内容 / `width` 起算）
- 居中一行搞定：容器 `display: flex; justify-content: center; align-items: center;`
- 换行：默认 `flex-wrap: nowrap`（不换行、宁可溢出）；要多行写 `flex-wrap: wrap`
- 两套属性别混：一半属性写在**容器**上，一半写在**项目**上（见文末两张表）

## 五分钟跑通一个 Flex 容器

只要在父元素上写一行 `display: flex`，它的直接子元素就立刻变成「弹性项目」，按主轴（默认从左到右）一字排开：

```html
<nav class="toolbar">
  <span class="brand">Logo</span>
  <a href="/docs">文档</a>
  <a href="/blog">博客</a>
  <button class="login">登录</button>
</nav>
```

```css
.toolbar {
  display: flex; /* 1. 开启弹性布局，子元素横向排开 */
  align-items: center; /* 2. 交叉轴（纵向）居中，让文字与按钮齐平 */
  gap: 16px; /* 3. 项目之间留 16px 间距，不用外边距 */
  padding: 8px 16px;
}

.login {
  margin-left: auto; /* 4. 把登录按钮推到最右：auto 外边距吃掉剩余空间 */
}
```

这短短几行就示范了 Flexbox 最常用的四件事：**开启容器**、**交叉轴对齐**、**用 `gap` 留空隙**、**用 `margin-left: auto` 把单个项目推开**。本叶其余各页就是把这些点逐一讲透。

::: tip 「弹性项目」只算直接子元素
`display: flex` 只把**直接子元素**变成弹性项目；孙子元素不受影响。如果想让更深层也参与，得在那一层再开一个 Flex 容器（Flexbox 可以任意嵌套）。
:::

## 主轴与交叉轴：一切的起点

Flexbox 的所有属性，本质上都在回答一个问题：**这是在主轴上做，还是在交叉轴上做？**

- **主轴（main axis）**：由 `flex-direction` 决定。默认 `row`，主轴是横向（从行的起点到终点）。
- **交叉轴（cross axis）**：永远垂直于主轴。`flex-direction: row` 时，交叉轴是纵向。

记住这条对应关系，半数属性就不用背了：

| 想做的事 | 属性 | 作用轴 |
| --- | --- | --- |
| 让项目整体靠左 / 居中 / 两端对齐 | `justify-content` | 主轴 |
| 让项目顶对齐 / 居中 / 拉伸等高 | `align-items` | 交叉轴 |
| 单独调某一个项目的交叉轴对齐 | `align-self` | 交叉轴 |
| 多行时，行与行之间怎么分布 | `align-content` | 交叉轴 |

详见 [Flex 容器与轴向模型](./guide-line/flex-container-axes)。

## 经典需求：垂直居中

过去要垂直居中一个元素，得靠 `position` + `transform` 或 `table-cell` 等 hack。Flexbox 把它压成两行：

```css
.hero {
  display: flex;
  justify-content: center; /* 主轴（横向）居中 */
  align-items: center; /* 交叉轴（纵向）居中 */
  min-height: 100vh;
}
```

`justify-content` 管主轴、`align-items` 管交叉轴，两者一组合，无论内容多大都稳稳居中。

## 项目能不能伸缩：`flex` 一值速记

每个弹性项目默认是 `flex: 0 1 auto`——**不主动变大、空间不够时可以缩、起始尺寸按自身内容或 `width` 算**。最常用的改法只有三个关键字加一个数字：

```css
.item {
  flex: 1; /* = 1 1 0：从 0 起算并等比抢占剩余空间（等分列就靠它） */
  flex: auto; /* = 1 1 auto：按内容起算，再伸缩 */
  flex: none; /* = 0 0 auto：完全不伸不缩，锁死尺寸 */
}
```

想做「N 等分」的栅格，给每个项目都写 `flex: 1` 即可。完整推导见 [flex 三值与计算](./guide-line/flex-grow-shrink-basis)。

## 两套属性：写在容器上 vs 写在项目上

Flexbox 的属性分两组，**写错对象就不生效**——这是新手最常见的坑。

写在**容器**（父元素）上：

| 属性 | 作用 |
| --- | --- |
| `display: flex` / `inline-flex` | 开启弹性布局 |
| `flex-direction` | 主轴方向（`row` / `column` / `*-reverse`） |
| `flex-wrap` | 是否换行（`nowrap` / `wrap` / `wrap-reverse`） |
| `flex-flow` | `flex-direction` + `flex-wrap` 简写 |
| `justify-content` | 主轴上的分布 |
| `align-items` | 交叉轴上的整体对齐 |
| `align-content` | 多行时行与行的分布 |
| `gap` / `row-gap` / `column-gap` | 项目间距 |

写在**项目**（子元素）上：

| 属性 | 作用 |
| --- | --- |
| `flex-grow` | 剩余空间的抢占比例（默认 `0`） |
| `flex-shrink` | 空间不足时的收缩比例（默认 `1`） |
| `flex-basis` | 伸缩前的起始尺寸（默认 `auto`） |
| `flex` | 上面三者的简写 |
| `align-self` | 覆盖容器的 `align-items`，单独对齐自己 |
| `order` | 改变视觉排序（默认 `0`，不改 DOM 顺序） |

## 下一步

把心智模型立起来后，按本叶地图依次深入——先从 [Flex 容器与轴向模型](./guide-line/flex-container-axes) 把「主轴 / 交叉轴 / 方向」彻底坐实，后面的对齐与伸缩就都顺理成章了。
