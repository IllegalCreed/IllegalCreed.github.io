---
layout: doc
outline: [2, 3]
---

# 网格轨道与 fr/minmax/repeat

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 划列 / 行：`grid-template-columns` / `grid-template-rows`，值是一串**轨道尺寸**
- 固定尺寸：`px` / `em` / `rem` / `%`（百分比相对容器内容区，**不含 `gap`**）
- 弹性单位 `fr`：分配「剩余空间」的份额；`1fr 2fr` = 1:2；裸 `fr` 隐含 `minmax(auto, <flex>)`
- `minmax(min, max)`：轨道在 `min`～`max` 间伸缩；`fr` 只能当 `max`；`min` 可用 `auto`/`min-content`
- `repeat(N, 轨道)`：重复 N 次；可部分重复 `20px repeat(6, 1fr) 20px`
- 内容关键字：`min-content`（最小不溢出）、`max-content`（一行不换）、`auto`（可被 `align/justify-content` 拉伸）
- `fit-content(limit)`：像 `max-content`，但到 `limit` 就换行 ≈ `min(max-content, max(min-content, limit))`
- `auto` 轨道**能**被 `justify/align-content` 拉伸吃掉剩余空间；`fr` 轨道自己就吃剩余空间
- `gap` 先扣，剩下的才按 `fr` 分配；`fr` 计算的是「剩余」而非「总」空间

## 轨道：网格的骨架

「轨道」就是一行或一列。定义网格的核心动作，就是用 `grid-template-columns`（列）和 `grid-template-rows`（行）列出每条轨道的尺寸——值里写几个尺寸，就有几条轨道。

```css
.container {
  display: grid;
  grid-template-columns: 200px 100px 30%; /* 三列：定宽、定宽、百分比 */
  grid-template-rows: 100px auto; /* 两行：定高、内容撑高 */
}
```

轨道尺寸可以是固定长度（`px`/`em`/`rem`）、百分比、弹性单位 `fr`、内容关键字（`min-content`/`max-content`/`auto`），或 `minmax()` / `fit-content()` 函数。下面逐一拆解。

::: warning 百分比不含 gap
轨道写 `%` 时，基准是容器**内容区宽度**，但 `gap` 不在这个比例里——三列各 `33.33%` 再加 `gap` 会**溢出**容器。要等分请优先用 `fr`（它在扣除 `gap` 后才分配），而不是 `33.33%`。
:::

## `fr`：弹性的份额

`fr`（fraction，份额）是 Grid 独有的弹性单位，代表「网格容器中**剩余可用空间**的一份」。它把「先扣掉固定尺寸和间距，剩下的怎么分」这件事变得极简：

```css
/* 三等分 */
.container {
  grid-template-columns: 1fr 1fr 1fr;
}

/* 1:2:1，中间列是两侧的两倍 */
.container {
  grid-template-columns: 1fr 2fr 1fr;
}

/* 固定 + 弹性混合：第一列定宽 250px，剩余空间二一分 */
.container {
  grid-template-columns: 250px 1fr 2fr;
}
```

关键在于「剩余」二字：`fr` 分配的是**减去固定轨道、减去 `gap` 之后**的空间。所以 `250px 1fr 2fr` 里，先扣掉 250px 和两段 `gap`，余下的再按 1:2 分给后两列。

::: tip 裸 `fr` 隐含 `minmax(auto, 1fr)`
单独写 `1fr` 时，规范实际把它当作 `minmax(auto, 1fr)`——意味着这条轨道有一个「`auto` 最小值」：当列里塞进一张很宽的图或一长串不可断的英文单词时，轨道**不会被压到比内容还窄**，可能撑破 1:1 的比例。想要严格按比例、允许内容溢出，写 `minmax(0, 1fr)`：

```css
/* 严格 1:1:1，即使内容很宽也不破坏比例 */
.container {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
```

这是「为什么我的等分列没对齐」的头号原因，记住 `minmax(0, 1fr)` 这个修复配方。
:::

## `minmax()`：给轨道一个伸缩范围

`minmax(min, max)` 让一条轨道在最小值与最大值之间伸缩。它是 Grid 响应式能力的核心——既保证不至于太窄，又能在空间充裕时长大。

```css
/* 这一行最少 100px，内容多时可继续长高 */
.container {
  grid-auto-rows: minmax(100px, auto);
}

/* 列最少 200px，最多吃满 1 份剩余空间 */
.container {
  grid-template-columns: minmax(200px, 1fr);
}
```

取值规则（来自 MDN / 规范）：

- **`min`** 可以是 `<length>`、`<percentage>`、`min-content`、`max-content`、`auto`——但**不能是 `fr`**。
- **`max`** 可以是上述全部，**外加 `fr`**（`fr` 只能出现在 `max` 位置）。
- 若 `max` 小于 `min`，`max` 被忽略，整体当作 `min` 处理。

```css
/* 经典：每列至少 200px，否则换行；空间够就均分 */
.container {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
```

最后这行是整个 Grid 最有名的「RAM 模式」（repeat-auto-minmax），无需任何媒体查询就能让列数随容器宽度自适应，详见 [隐式网格与自动布局](./implicit-grid) 与 [Grid 实战](./grid-patterns)。

## `repeat()`：别再手写一堆 `1fr`

`repeat(次数, 轨道列表)` 用来重复轨道模式，省去复制粘贴：

```css
/* 12 列栅格 */
.container {
  grid-template-columns: repeat(12, 1fr);
}

/* 重复一个「1fr 2fr」的模式 5 次 = 10 条轨道 */
.container {
  grid-template-columns: repeat(5, 1fr 2fr);
}

/* 部分重复：首尾固定 20px，中间 6 列均分 */
.container {
  grid-template-columns: 20px repeat(6, 1fr) 20px;
}
```

把 `repeat()` 的次数换成关键字 `auto-fill` 或 `auto-fit`，就能让浏览器**自动算出能放几列**——这是响应式的关键，两者差异（空轨道是否塌缩）单独在 [隐式网格与自动布局](./implicit-grid) 详谈。

## 内容驱动尺寸：`min-content` / `max-content` / `auto`

除了固定值和 `fr`，轨道还能让**内容自己决定**尺寸：

| 关键字 | 含义 |
| --- | --- |
| `min-content` | 轨道收到「不让内容溢出的最小宽度」——文本会在每个可断点换行，取最长单词 / 最宽不可分元素的宽度 |
| `max-content` | 轨道宽到「内容一行排完、绝不换行」——可能很宽 |
| `auto` | 通常表现接近 `max-content`，但**可以被 `align-content` / `justify-content` 拉伸**；因此默认 `auto` 轨道会吃掉网格里多余的空间 |

```css
/* 第一列恰好容纳最长内容，中间弹性，第三列也按内容收紧 */
.container {
  grid-template-columns: max-content 1fr min-content;
}
```

::: tip `auto` 与 `fr` 谁吃剩余空间
这是个容易混的点：**`fr` 轨道**通过自身的弹性份额吃掉剩余空间；而 **`auto` 轨道**默认不主动伸展，但**可被** `justify-content` / `align-content` 拉伸（规范明确：只有 `auto`-sized 轨道能被这两个属性拉伸）。所以一个全是 `auto` 列、内容又不满的网格，列会挤在一起、右侧留白；而有 `fr` 列时剩余空间会被 `fr` 占满。
:::

## `fit-content()`：自动到某个上限就换行

`fit-content(limit)` 是 `max-content` 与一个上限的结合：内容少时像 `max-content`（按内容宽），内容多到超过 `limit` 时就在 `limit` 处封顶并换行。

```css
/* 列按内容宽，但最宽不超过 10em，超了就换行 */
.container {
  grid-template-columns: fit-content(10em) 1fr;
}
```

其等价公式（来自规范）：`fit-content(limit)` ≈ `min(max-content, max(min-content, limit))`——即「内容自然宽」与「上限」之间取较合适的那个。适合做「标题列：短标题贴合、长标题封顶换行」这类自适应侧栏。

## 一个把它们串起来的例子

```css
.layout {
  display: grid;
  /* 左侧栏按内容但最宽 16em，主区弹性，右侧定宽 240px */
  grid-template-columns: fit-content(16em) minmax(0, 1fr) 240px;
  /* 头部按内容高，主体至少占满视口剩余高度 */
  grid-template-rows: auto minmax(0, 1fr);
  gap: 24px;
}
```

这一行 `grid-template-columns` 同时用上了 `fit-content()`（自适应侧栏）、`minmax(0, 1fr)`（严格弹性主区）、固定 `240px`（定宽边栏）——三种轨道策略各司其职，正是真实页面里最常见的组合。

## 下一步

轨道决定了「网格长什么样」，但逐条写尺寸只是一种描述方式。当版面有清晰的「头/侧/主/脚」语义时，用一张 ASCII 图来画版面会更直观——下一页进入 [模板区域 `grid-template-areas`](./template-areas)。
