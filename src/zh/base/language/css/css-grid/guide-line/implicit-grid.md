---
layout: doc
outline: [2, 3]
---

# 隐式网格与自动布局

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 显式网格：你用 `grid-template-columns/rows` 明确定义的轨道；**隐式网格**：项放不下时浏览器自动新增的轨道
- 隐式轨道默认尺寸 `auto`（由内容撑），用 `grid-auto-rows` / `grid-auto-columns` 指定，可配 `minmax()`
- 自动布局方向：`grid-auto-flow: row`（默认，先填满一行再换行）/ `column`（先填满一列再换列）
- `grid-auto-flow: dense`：回填前面被跳过的空格（可能打乱视觉顺序 → 影响无障碍 Tab 序）
- `auto-fill`：尽量多塞轨道，**空轨道保留**（占位、撑开）
- `auto-fit`：同样多塞，但**空轨道塌缩为 0**，已有项被拉伸吃满 → 内容总占满整行
- RAM 模式：`grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))` —— 零媒体查询响应式
- 想要「项不被拉伸、靠左排」用 `auto-fill`；想要「项填满整行」用 `auto-fit`
- 负数线 `-1` 数不到隐式轨道（只认显式网格末尾）

## 显式网格 vs 隐式网格

你用 `grid-template-columns` / `grid-template-rows` **明确写出**的轨道，构成「显式网格」。但网格项的数量常常超过显式格子，或者你压根没定义行——这时浏览器会**自动新增轨道**来容纳它们，这些自动生成的轨道就是「隐式网格」。

```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 只显式定义了 3 列 */
  gap: 12px;
  /* 没定义行！ */
}
```

往这个网格里放 7 个项：前 3 个填满第一行，Grid 自动开第二行放接下来 3 个，再开第三行放第 7 个。这些行都是隐式的——你没写 `grid-template-rows`，它们凭空生出来。

## 控制隐式轨道尺寸：`grid-auto-rows` / `grid-auto-columns`

隐式轨道默认尺寸是 `auto`（由内容撑高 / 撑宽）。要给它们统一尺寸，用 `grid-auto-rows`（隐式行）或 `grid-auto-columns`（隐式列）：

```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  /* 每个自动新增的行至少 120px，内容多则继续长高 */
  grid-auto-rows: minmax(120px, auto);
  gap: 12px;
}
```

`grid-auto-rows` 也可以接收多个值，自动新增的轨道会**循环套用**这组尺寸：

```css
/* 隐式行高在 100px、200px 之间交替 */
.grid {
  grid-auto-rows: 100px 200px;
}
```

## 自动布局方向：`grid-auto-flow`

默认情况下，项按「先行后列」填入——填满一行的所有列，再换到下一行。这由 `grid-auto-flow` 控制：

| 值 | 行为 |
| --- | --- |
| `row`（默认） | 先沿行方向填，填满一行的列再换行 |
| `column` | 先沿列方向填，填满一列的行再换列 |
| `dense` | 启用「密集回填」：把后面较小的项塞进前面留下的空格 |

```css
/* 改成按列填充：先填满第一列再填第二列 */
.grid {
  display: grid;
  grid-template-rows: repeat(3, 100px);
  grid-auto-flow: column; /* 此时自动新增的是「列」 */
  grid-auto-columns: 200px; /* 隐式列宽 */
}
```

::: warning `dense` 会打乱视觉顺序、伤无障碍
当某些项用 `span` 跨多格时，自动布局可能**跳过**放不下的小格、留下空洞。`grid-auto-flow: row dense`（或 `column dense`）会回头把后面的小项填进这些空洞，让网格更紧凑、无空隙。

代价是：**视觉顺序与 DOM 源顺序脱节**——屏幕上靠前的项，在 DOM 里可能靠后。键盘 Tab 和屏幕阅读器仍按 DOM 顺序走，于是「看到的顺序」和「读到的顺序」不一致。只在纯装饰性、顺序无意义的画廊里用 `dense`，表单 / 列表这类有逻辑顺序的内容慎用。
:::

## `auto-fill` vs `auto-fit`：响应式的分水岭

[网格轨道页](./grid-tracks) 提到，`repeat()` 的次数可换成 `auto-fill` 或 `auto-fit`，让浏览器自动算出能放几列。两者**塞轨道的算法一样**，差别只在「空轨道怎么处理」——这个差别决定了最终视觉效果，是 Grid 最常被问的点。

```css
/* 容器有多宽，就塞多少列，每列至少 200px */
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
```

假设容器宽 1000px、每列最小 200px，能塞 5 列。现在只有 **3 个**项：

- **`auto-fill`**：仍然布置出 5 条轨道——3 个项占前 3 条，后 2 条是**空轨道、保留占位**。视觉上 3 个项靠左排，右侧留出两格空白。
- **`auto-fit`**：同样先算出 5 条，但把**空轨道塌缩为 0 宽**，已有的 3 个项被 `1fr` 拉伸**吃满整行**。视觉上 3 个项均分撑满容器。

```css
/* 同样的网格，只换一个关键字，效果完全不同 */
.gallery {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  /*                            ^^^^^^^^ 项填满整行 */
}
```

::: tip 怎么选
- 想让「项保持自己的最大宽度、不被拉伸、从左往右排，不够一行就留白」——用 **`auto-fill`**（比如固定卡片宽度的画廊，不希望最后一行的几张被拉得很宽）。
- 想让「内容总是填满整行、列数随宽度自适应、没有空格」——用 **`auto-fit`**（最常见的响应式画廊默认选它）。
- 当项的数量足以填满所有轨道时，两者**表现完全一致**——差异只在「项数少于可容纳轨道数」时才显现。
:::

## RAM 模式：一行实现零媒体查询响应式

把 `repeat`、`auto-fit`/`auto-fill`、`minmax()` 三者组合，得到 Grid 最著名的响应式配方，社区称为 **RAM**（Repeat, Auto, Minmax）：

```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
  gap: 16px;
}
```

逐段拆解：

- `auto-fit`：列数随容器宽度自动变化；
- `minmax(…, 1fr)`：每列在「下限」与「均分 1 份」之间伸缩；
- `min(100%, 250px)`：下限取「250px」与「容器 100%」中较小者——这层 `min()` 是为了在容器**窄于 250px**（如小屏手机）时不溢出，让单列也能缩到容器宽度。

效果：宽屏多列、窄屏自动减列直到单列，**全程零媒体查询**。这一行几乎可以替代过去一整套断点写法，是现代卡片画廊的事实标准（实战见 [Grid 实战](./grid-patterns)）。

## 下一步

到这里，你已经掌握 Grid 的完整核心：轨道、区域、放置、隐式布局。最后一块现代拼图是 `subgrid`——它解决了「嵌套网格内部对不齐父网格」这个长期痛点，且已进入 Baseline 广泛可用：下一页 [`subgrid` 子网格](./subgrid)。
