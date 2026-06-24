---
layout: doc
outline: [2, 3]
---

# Grid 实战

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- **RAM 响应式画廊**：`grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr))` —— 零媒体查询自适应列数
- `auto-fit` 填满整行、`auto-fill` 留空位；窄屏防溢出加 `min(100%, …)` 兜底下限
- **整页骨架**：`grid-template-areas` 画「头/侧/主/脚」+ `min-height: 100vh`，响应式只改这张图
- **居中**：`display: grid; place-items: center` 一行垂直水平居中（`place-items` = `align-items` + `justify-items`）
- **圣杯布局**：三列 `auto 1fr auto` + 三行 `auto 1fr auto`，主区 `1fr` 吃满
- **通栏元素**：`grid-column: 1 / -1` 横跨所有列（如分隔条、整宽 banner）
- **不规则拼图**：`grid-auto-flow: dense` 回填空洞（装饰性内容才用，伤 Tab 序）
- **卡片内部对齐**：`grid-template-rows: subgrid`（见 [subgrid](./subgrid)）
- `place-content` / `place-items` / `place-self` 是 `*-content` / `*-items` / `*-self` 的行列简写

## 配方一：响应式画廊（RAM 模式）

最高频的需求——一组卡片，宽屏多列、窄屏自动减列，**不写一个媒体查询**。核心就是 [隐式网格页](./implicit-grid) 讲的 RAM（Repeat-Auto-Minmax）：

```css
.gallery {
  display: grid;
  /* 每列最小 250px、最大均分 1 份；列数随容器宽度自适应 */
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
  gap: 16px;
}
```

```html
<div class="gallery">
  <article class="card">…</article>
  <article class="card">…</article>
  <!-- 任意数量，自动换行排列 -->
</div>
```

- `auto-fit`：项填满整行（不留空轨道）。若想让卡片保持固定宽、不被拉伸、靠左排，把 `auto-fit` 换成 `auto-fill`。
- `min(100%, 250px)`：下限的兜底——容器窄于 250px（小屏手机）时，下限降到 `100%`，单列也不会溢出。这一层 `min()` 是 RAM 模式在窄屏稳健的关键。

## 配方二：整页骨架（头 / 侧 / 主 / 脚）

用 [模板区域](./template-areas) 画一张全屏「字符画」，配合 `min-height: 100vh` 让页面铺满视口高度，并用媒体查询切换移动端 / 桌面端版面：

```css
.app {
  display: grid;
  min-height: 100vh;
  gap: 16px;
  /* 移动端：单列纵向堆叠 */
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header"
    "main"
    "footer";
}

.app > header {
  grid-area: header;
}
.app > main {
  grid-area: main;
}
.app > nav {
  grid-area: sidebar;
}
.app > footer {
  grid-area: footer;
}

@media (min-width: 1024px) {
  .app {
    /* 桌面端：左侧导航 + 右主区，头脚通栏 */
    grid-template-columns: 240px 1fr;
    grid-template-areas:
      "header  header"
      "sidebar main"
      "footer  footer";
  }
}
```

`header` / `main` / `nav` / `footer` 的 `grid-area` 声明在两种布局下**完全不变**——重排只发生在容器的 `grid-template-areas` 里。`main` 行设为 `1fr`，会吃掉头脚之外的全部高度，把页脚顶到视口底部。

## 配方三：圣杯布局（坐标版）

经典「头 + 三栏（左侧 / 主 / 右侧）+ 脚」，用线坐标实现，主区在两个方向都吃满剩余空间：

```css
.holy-grail {
  display: grid;
  min-height: 100vh;
  /* 三列：左右定宽，中间弹性 */
  grid-template-columns: 200px 1fr 200px;
  /* 三行：头脚按内容，主体吃满 */
  grid-template-rows: auto 1fr auto;
}

/* 头部通栏：横跨全部三列 */
.holy-grail > header {
  grid-column: 1 / -1;
}
/* 页脚通栏 */
.holy-grail > footer {
  grid-column: 1 / -1;
}
```

`grid-column: 1 / -1` 让头脚无视列数、直接横跨整行（`-1` 即最后一条线，见 [基于线与区域放置](./line-area-placement)）。中间三个元素（左、主、右）按源顺序自动落入第二行的三列。

## 配方四：仪表盘（不等大卡片拼图）

仪表盘常有「大图表 + 若干小卡片」的不规则拼版。用 `span` 让特定卡片跨多格，必要时用 `dense` 回填空洞：

```css
.dashboard {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 160px; /* 隐式行统一高度 */
  grid-auto-flow: row dense; /* 紧凑回填，无空洞 */
  gap: 16px;
}

/* 主图表占 2×2 */
.dashboard > .chart-main {
  grid-column: span 2;
  grid-row: span 2;
}
/* 宽幅卡片占 2×1 */
.dashboard > .wide {
  grid-column: span 2;
}
```

::: warning `dense` 与无障碍
`grid-auto-flow: ... dense` 会把后面的小卡片塞进前面的空洞，**视觉顺序可能与 DOM 顺序不一致**。键盘 Tab 仍按 DOM 走，于是「看到的顺序」≠「读到的顺序」。仪表盘卡片若彼此独立、顺序无关紧要，用 `dense` 没问题；若卡片有阅读逻辑（如步骤、排名），慎用，或调整 DOM 顺序使其与视觉一致。
:::

## 配方五：一行居中

Grid 提供了 CSS 里最短的「垂直 + 水平居中」写法——`place-items: center`（它是 `align-items` 与 `justify-items` 的简写）：

```css
.center {
  display: grid;
  place-items: center; /* 子元素在两个方向都居中 */
  min-height: 100vh;
}
```

::: tip 三组对齐简写
Grid 的对齐属性都有「行 + 列」二合一简写，记住这张表即可：

| 简写 | 等于 | 作用对象 |
| --- | --- | --- |
| `place-items` | `align-items` + `justify-items` | 容器统一设置所有项的对齐 |
| `place-content` | `align-content` + `justify-content` | 整个网格在容器内的对齐（轨道有富余空间时） |
| `place-self` | `align-self` + `justify-self` | 单个项覆盖自身对齐 |

`align-*` 管块向（行方向 / 纵向），`justify-*` 管行内向（列方向 / 横向）。
:::

## 配方六：媒体对象与「内容撑列」

左侧头像定宽、右侧文字弹性、按内容自适应高度——经典「媒体对象」用 Grid 一行列定义搞定：

```css
.media {
  display: grid;
  /* 头像列按内容（max-content），文字列吃剩余 */
  grid-template-columns: max-content 1fr;
  gap: 12px;
  align-items: center; /* 头像与文字垂直居中对齐 */
}
```

`max-content` 让头像列恰好容纳其内容宽度，`1fr` 让文字吃掉剩余空间（内容尺寸关键字见 [网格轨道页](./grid-tracks)）。

## 配方七：等高卡片内部对齐（subgrid）

一排卡片，每张「标题 / 正文 / 按钮」三段对齐——`subgrid` 的招牌场景（详见 [subgrid 子网格](./subgrid)）：

```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  grid-template-rows: auto 1fr auto; /* 标题 / 正文 / 按钮 */
  gap: 16px;
}

.card {
  display: grid;
  grid-row: span 3;
  grid-template-rows: subgrid; /* 行继承父网格 → 跨卡片对齐 */
  gap: 8px;
}
```

所有卡片的标题底边、按钮顶边自动对齐，且列数仍随容器宽度 RAM 自适应——把本叶多个特性叠在了一起。

## 小结：选型速记

| 需求 | 配方 |
| --- | --- |
| 自适应列数的画廊 | `repeat(auto-fit, minmax(min(100%, N), 1fr))` |
| 整页骨架、要响应式重排 | `grid-template-areas` + 媒体查询改图 |
| 通栏元素（分隔条 / banner） | `grid-column: 1 / -1` |
| 不规则拼图、要无空洞 | `grid-auto-flow: dense`（注意 Tab 序） |
| 一行垂直水平居中 | `place-items: center` |
| 卡片内部跨行对齐 | `grid-template-rows: subgrid` |

至此「CSS Grid 网格布局」一叶的概念与实战全部讲完。所有属性、函数、RAM 配方与 Baseline 状态汇总在 [参考](../reference) 一页，便于日常速查。
