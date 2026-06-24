---
layout: doc
outline: [2, 3]
---

# 主轴对齐与分布

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- `justify-content` 作用在**主轴**上，分配「项目之间 / 项目与边缘之间」的**剩余空间**；默认 `normal`（在 flex 中表现为 `flex-start`）
- 五个最常用值：`flex-start`（贴起点）、`flex-end`（贴终点）、`center`（居中）、`space-between`、`space-around`、`space-evenly`
- 三个 space 值的区别只在「两端留不留空、留多少」：
  - `space-between`：两端**不留**，空隙全塞进项目之间
  - `space-around`：每个项目左右各分一份，**两端 = 半份**
  - `space-evenly`：所有空隙（含两端）**完全相等**
- 前提：**主轴上要有剩余空间**才看得出效果；若有项目 `flex-grow > 0` 吃光了空间，`justify-content` 就「无空可分」
- 主轴方向随 `flex-direction` 变：`row` 时管横向，`column` 时管纵向
- `gap` / `column-gap` 设项目间「固定最小间距」，可与 `justify-content` 叠加使用
- 单项推开：给某个项目 `margin-left: auto`（或 `margin: auto`）能吃掉一侧剩余空间，做「左群 + 右单」布局
- `stretch` 在 flex 中对主轴无效（等同 `flex-start`）；主轴的「拉伸」交给 `flex-grow`

## `justify-content`：在主轴上分配剩余空间

`justify-content` 回答的问题是：**当项目排完后主轴上还剩空间，这些空间怎么分？** 它写在**容器**上，作用于**主轴**。

```css
.container {
  display: flex;
  justify-content: center; /* 把整组项目在主轴上居中 */
}
```

一个关键前提：它分配的是**剩余的正空间**。如果容器里项目本就挤满（甚至溢出），或某个项目用 `flex-grow` 把空间抢光了，就没有剩余空间可分，`justify-content` 自然看不出效果。

### 定位类取值

```css
justify-content: flex-start; /* 默认效果：整组贴主轴【起点】 */
justify-content: flex-end; /* 整组贴主轴【终点】 */
justify-content: center; /* 整组在主轴上【居中】 */
```

- `flex-start` / `flex-end`：贴向弹性容器主轴的起点 / 终点（跟随文字方向）。
- `center`：整组项目居中，剩余空间均分到两端。
- 还有 `start` / `end`（贴对齐容器的逻辑起止）、`left` / `right`（贴物理左右；当主轴非横向时退化为 `start`）等取值，日常用 `flex-start` / `flex-end` / `center` 已足够。

::: tip 默认值是 `normal`，但你可以当成 `flex-start`
`justify-content` 的初始值规范上是 `normal`，在弹性容器里它的表现等同于 `flex-start`——所以不写 `justify-content` 时，项目默认就贴主轴起点。
:::

## 三个 space 值：精确区别

`space-between` / `space-around` / `space-evenly` 都把剩余空间**摊到项目之间**，区别只在**两端的处理方式**。下面用「3 个项目、主轴上剩 6 份空间」来精确对比：

| 值 | 两端留空 | 项目间留空 | 直观分布（`|`=容器边） |
| --- | --- | --- | --- |
| `space-between` | 不留（0） | 各 3 份 | `|■···■···■|` |
| `space-around` | 各 1 份（半份） | 各 2 份 | `|·■··■··■·|` |
| `space-evenly` | 各 1.5 份 | 各 1.5 份 | `|·■·■·■·|` |

逐条说清：

```css
/* space-between：首项贴起点、尾项贴终点，空隙全在项目之间 */
justify-content: space-between;

/* space-around：每个项目左右各分到「相等的一份」，
   于是两端各留【半份】（因为端上只有一个项目的一侧） */
justify-content: space-around;

/* space-evenly：项目之间、首项前、尾项后，所有空隙【完全相等】 */
justify-content: space-evenly;
```

- **`space-between`**：第一个贴 main-start、最后一个贴 main-end，中间均分。只有一个项目时它会停在起点。
- **`space-around`**：把空间想成「每个项目独享左右各半份」，相邻两项的「半份 + 半份」拼成整份，而两端只有半份——所以**两端窄、中间宽**。
- **`space-evenly`**：连两端也按整份算，所有缝隙一模一样——视觉上最均匀。

::: warning space 值需要「有空间可分」
这三个值都依赖主轴上存在剩余空间。如果项目总宽已撑满或溢出容器，它们看起来会和 `flex-start` 没区别——因为压根没有空隙可摊。
:::

## `gap`：项目之间的固定间距

`justify-content` 分的是「弹性的剩余空间」，而 `gap` 设的是「项目之间的**固定最小间距**」。两者职责不同，常常**叠加使用**：

```css
.toolbar {
  display: flex;
  gap: 12px; /* 任意相邻项目之间至少 12px（不会被压没） */
  justify-content: space-between; /* 再把多出来的空间按两端对齐分配 */
}
```

- `gap`：行间距 + 列间距的简写；
- `column-gap`：仅主轴方向（`row` 时）项目之间的间距；
- `row-gap`：仅交叉轴方向（多行时行与行）的间距。

相比过去用 `margin` 凑间距，`gap` 的好处是**只在项目之间生效、首尾不会多出外边距**，也不会有相邻外边距合并的麻烦。`gap` 的完整用法（尤其在换行场景下）见 [换行、排序与间距](./wrap-order-gap)。

## `margin: auto`：把单个项目推开

弹性项目上的 `auto` 外边距有个特殊能力：**吃掉该方向上所有剩余空间**。这让「一群靠左 + 一个靠右」的导航栏布局变得极简：

```css
.navbar {
  display: flex;
  gap: 16px;
}

.navbar .login {
  margin-left: auto; /* 左侧外边距吃光剩余空间，把登录按钮挤到最右 */
}
```

效果上，`login` 之前的所有项目挤在左侧，`login` 被推到最右——无需把容器拆成两个，也无需 `justify-content: space-between` 再调结构。若给某项 `margin: auto`（四周都 auto），它会在主轴上被居中。这是 `justify-content` 之外另一种「按项目」的对齐手段。

## 主轴方向会变：别忘了 `flex-direction`

再强调一次：`justify-content` 永远作用在**主轴**上，而主轴方向由 `flex-direction` 决定。

```css
.vertical-list {
  display: flex;
  flex-direction: column; /* 主轴变成纵向 */
  justify-content: center; /* 此时是【垂直】居中整组项目 */
}
```

同一句 `justify-content: center`，在 `row` 下是水平居中、在 `column` 下变成垂直居中。所以遇到「居中不生效」，先确认当前主轴是哪个方向、以及主轴上到底有没有剩余空间。

## 小结

`justify-content` 管主轴上的整体分布，`space-between/around/evenly` 的差别全在「两端怎么留空」，`gap` 与 `margin: auto` 则补足「固定间距」和「单项推开」两种需求。主轴说完，下一页转到与之垂直的另一根轴——[交叉轴对齐](./cross-axis-alignment)。
