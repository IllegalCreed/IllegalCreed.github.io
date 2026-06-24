---
layout: doc
outline: [2, 3]
---

# 基于线与区域放置

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 网格线从 `1` 编号：N 列有 N+1 条竖线；`grid-column` / `grid-row` 用「起始线 / 结束线」放置
- 列放置：`grid-column: 1 / 3`（从第 1 条占到第 3 条 = 跨 2 列）；`grid-row: 2 / 4` 同理
- 跨越关键字 `span`：`grid-column: span 2`（跨 2 列、起点交给自动布局）；`grid-column: 2 / span 3`（从线 2 起跨 3 列）
- 单格可省结束值：`grid-column: 2` 等价 `grid-column: 2 / 3`
- 负数线从末尾数：`-1` 是最后一条线；`grid-column: 1 / -1` = **横跨整个显式网格**
- 分量属性：`grid-column-start` / `grid-column-end` / `grid-row-start` / `grid-row-end`
- 命名线：`grid-template-columns: [sidebar-start] 200px [sidebar-end] 1fr` → `grid-column: sidebar-start / sidebar-end`
- `grid-area: r1 / c1 / r2 / c2` 一次写四条线（行起 / 列起 / 行止 / 列止）
- `grid-area` 双重身份：写**名字**=认领命名区域；写**数字**=四线简写
- 重叠靠 `z-index`：多个项落到同一格会重叠，用 `z-index` 控制层级

## 网格线坐标系

放置元素的最底层机制，是**基于线**：每条网格线有编号，从 1 开始（左到右、上到下）。把项「钉」在哪两条线之间，它就占据其间的轨道。

```
列线:  1     2     3     4
       │     │     │     │
       ├─────┼─────┼─────┤
       │  A  │  B  │  C  │   ← 三列 = 四条竖线
       └─────┴─────┴─────┘
```

三列的网格有 **4 条竖线**。`grid-column` 和 `grid-row` 用「起始线 / 结束线」两个编号描述项占据的范围：

```css
.item {
  grid-column-start: 1; /* 列：从第 1 条竖线 */
  grid-column-end: 4; /* 到第 4 条竖线 = 横跨全部 3 列 */
  grid-row-start: 1; /* 行：从第 1 条横线 */
  grid-row-end: 3; /* 到第 3 条横线 = 纵跨 2 行 */
}
```

## 简写：`grid-column` / `grid-row` 加斜杠

四个分量属性太啰嗦，日常用斜杠简写：`起始线 / 结束线`。

```css
.item {
  grid-column: 1 / 4; /* = grid-column-start:1; grid-column-end:4 */
  grid-row: 1 / 3;
}

/* 只占一格时可省略结束值 */
.item {
  grid-column: 2; /* 等价 grid-column: 2 / 3 */
}
```

## `span`：我不关心起点，只要跨几格

很多时候你只想说「这个项占 2 列」，至于从哪列开始交给自动布局——这就是 `span`：

```css
/* 跨 2 列，起点由自动布局决定 */
.wide {
  grid-column: span 2;
}

/* 从第 2 条线开始，向后跨 3 列（到第 5 条线） */
.item {
  grid-column: 2 / span 3;
}

/* 从某条线「往回」跨：到第 4 条线、向前跨 2 列（即从第 2 条线开始） */
.item {
  grid-column: span 2 / 4;
}
```

`span N` 既能放在起始侧也能放在结束侧，配合另一端的具体线号，能灵活表达「锚定一端、延伸 N 格」。

## 负数线：从末尾倒数，`-1` 即最后一条

线编号也能用负数，从网格**末尾**往回数：`-1` 是最后一条线、`-2` 是倒数第二条。最实用的写法是「占满整行」：

```css
/* 无论网格有多少列，都从第一条线占到最后一条线 = 横跨整个显式网格 */
.full-width {
  grid-column: 1 / -1;
}
```

`grid-column: 1 / -1` 是 Grid 里出现频率极高的惯用法——做「整页通栏的标题 / 分隔条」时，不必知道有几列，一行搞定。

::: warning 负数线只认「显式网格」
`-1` 指向的是**显式网格**（你用 `grid-template-columns/rows` 显式定义的部分）的最后一条线。如果元素被放进了**隐式网格**（自动新增的轨道，见 [隐式网格与自动布局](./implicit-grid)），负数线**数不到**那些隐式轨道——这是 `1 / -1` 在自动布局场景下偶尔「不如预期」的根源。
:::

## 命名线：给坐标起名字

记数字线号容易出错，可以在 `grid-template-columns` / `grid-template-rows` 里给线起名（方括号包裹，一条线可起多个名）：

```css
.container {
  display: grid;
  grid-template-columns:
    [full-start] 1fr
    [main-start] minmax(0, 60ch)
    [main-end] 1fr
    [full-end];
}

/* 用名字放置，远比记「2 / 3」直观 */
.article {
  grid-column: main-start / main-end;
}
.bleed {
  grid-column: full-start / full-end;
}
```

一条线可挂多个名字，空格分隔：

```css
grid-template-columns: [sidebar-end main-start] 1fr [main-end];
```

::: tip 命名线与命名区域互通
上一页 [模板区域](./template-areas) 提到：定义区域 `xxx` 会自动生成 `xxx-start` / `xxx-end` 命名线。反过来也成立——如果你手动定义了一对 `xxx-start` / `xxx-end` 线，就隐式形成了可被 `grid-area: xxx` 引用的区域。两套体系完全打通，可混用。
:::

## `grid-area`：一个属性的两副面孔

`grid-area` 容易让人困惑，因为它有**两种完全不同的用法**：

### 用法一：认领命名区域（写名字）

配合容器的 `grid-template-areas`，值是**区域名**：

```css
.sidebar {
  grid-area: sidebar; /* 认领模板里叫 sidebar 的区域 */
}
```

### 用法二：四条线的简写（写数字 / 线名）

值是四个线坐标，顺序是 **`行起始 / 列起始 / 行结束 / 列结束`**：

```css
.item {
  /* 行 1→3，列 2→4，即纵跨 2 行、横跨 2 列 */
  grid-area: 1 / 2 / 3 / 4;
}
```

记忆顺序：从 `row-start` 开始，**逆时针**绕一圈（上 → 左 → 下 → 右）。等价于：

```css
.item {
  grid-row: 1 / 3;
  grid-column: 2 / 4;
}
```

::: warning 别把两种用法混在一起
看到 `grid-area: header` 是「认领区域」，看到 `grid-area: 1 / 1 / 3 / 2` 是「四线简写」。值里有没有斜杠、是名字还是数字，决定了它走哪条路。两者不能混写。
:::

## 重叠与层级：`z-index`

基于线放置允许多个项落到**同一个单元格**，于是它们会重叠——这正是做「图片上压标题」「徽标盖在卡片角」的原生手段：

```css
.stack {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
}

/* 两个子元素都放进唯一的格子，叠在一起 */
.stack > .photo,
.stack > .caption {
  grid-column: 1;
  grid-row: 1;
}

.stack > .caption {
  z-index: 1; /* 标题压在图片之上 */
  align-self: end; /* 贴到格子底部 */
}
```

网格项默认按源顺序决定堆叠，用 `z-index` 可显式调整。配合 `align-self` / `justify-self` 还能把重叠的项对齐到格子的任意角落。

## 下一步

到这里，你已掌握「在已定义的网格里精确放置」的全部语法。但当项的数量超过显式网格、或你压根没定义行时，Grid 会**自动新增轨道**——这套「隐式网格 + 自动布局」的规则，以及响应式关键的 `auto-fill` / `auto-fit`，是下一页的主题：[隐式网格与自动布局](./implicit-grid)。
