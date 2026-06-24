---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 开网格：`display: grid` / `inline-grid`，直接子元素成为网格项
- 划轨道：`grid-template-columns` / `grid-template-rows`；尺寸用 `px` / `%` / `fr` / `minmax()` / `repeat()` / 内容关键字
- 等分：`repeat(N, 1fr)`；严格等分（防内容撑破）`repeat(N, minmax(0, 1fr))`
- 响应式 RAM：`repeat(auto-fit, minmax(min(100%, 250px), 1fr))`
- 间距：`gap` / `row-gap` / `column-gap`（先于 `fr` 分配，别用 margin）
- 放置：基于线 `grid-column: 1 / 3`、`span N`、`1 / -1` 通栏；命名区域 `grid-template-areas` + `grid-area`
- 隐式网格：`grid-auto-rows` / `grid-auto-columns` / `grid-auto-flow`（`row` / `column` / `dense`）
- `auto-fill` 留空轨道；`auto-fit` 塌缩空轨道、项填满
- 居中：`place-items: center`；对齐三件套 `place-items` / `place-content` / `place-self`
- 子网格：`grid-template-columns: subgrid` —— ✅ Baseline 广泛可用（2023-09 起）
- `masonry` 瀑布流仍实验、未 Baseline，需降级

## 容器属性（设在网格容器上）

| 属性 | 取值 / 说明 |
| --- | --- |
| `display` | `grid` / `inline-grid` —— 建立网格容器 |
| `grid-template-columns` | 列轨道列表：`200px 1fr` / `repeat(3, 1fr)` / `minmax()` / `subgrid` |
| `grid-template-rows` | 行轨道列表，语法同上 |
| `grid-template-areas` | 带引号的字符串行，画出版面；`.` 留空；区域须为矩形 |
| `grid-template` | `rows` / `columns` / `areas` 三合一简写 |
| `grid` | 更全简写，并重置 `grid-auto-*` 系列 |
| `gap` | 间距简写：`gap: 行 列` 或单值；旧名 `grid-gap` |
| `row-gap` / `column-gap` | 分别设行 / 列间距 |
| `grid-auto-rows` | 隐式行尺寸（可多值循环、可 `minmax()`） |
| `grid-auto-columns` | 隐式列尺寸 |
| `grid-auto-flow` | 自动布局方向：`row`（默认）/ `column` / `dense`（可组合 `row dense`） |
| `justify-items` | 所有项在**列方向（横向）**的对齐：`start` / `end` / `center` / `stretch`（默认） |
| `align-items` | 所有项在**行方向（纵向）**的对齐 |
| `place-items` | `align-items` + `justify-items` 简写 |
| `justify-content` | 整个网格在容器内**横向**对齐（轨道有富余时）：`start` / `center` / `space-between` … |
| `align-content` | 整个网格在容器内**纵向**对齐 |
| `place-content` | `align-content` + `justify-content` 简写 |

## 项目属性（设在网格项上）

| 属性 | 取值 / 说明 |
| --- | --- |
| `grid-column-start` / `-end` | 列起 / 止线：线号 / 命名线 / `span N` |
| `grid-row-start` / `-end` | 行起 / 止线，同上 |
| `grid-column` | `起 / 止` 简写：`1 / 3` / `2 / span 3` / `1 / -1` |
| `grid-row` | `起 / 止` 简写，同上 |
| `grid-area` | ①命名区域名（配 `grid-template-areas`）；②四线简写 `行起 / 列起 / 行止 / 列止` |
| `justify-self` | 单项**横向**对齐，覆盖容器 `justify-items` |
| `align-self` | 单项**纵向**对齐，覆盖容器 `align-items` |
| `place-self` | `align-self` + `justify-self` 简写 |

## 轨道尺寸取值速查

| 取值 | 含义 |
| --- | --- |
| `<length>` / `%` | 固定长度 / 百分比（% 基准为内容区，**不含 gap**） |
| `fr` | 剩余空间的份额；裸 `fr` = `minmax(auto, <flex>)`；`fr` 只能作 `minmax` 的 `max` |
| `min-content` | 不溢出的最小尺寸（按最长不可断内容） |
| `max-content` | 内容一行排完所需尺寸（不换行） |
| `auto` | 近似 `max-content`，但**可被** `justify/align-content` 拉伸 |
| `minmax(min, max)` | 在 `min`～`max` 间伸缩；`min` 不可为 `fr` |
| `fit-content(limit)` | 像 `max-content`，到 `limit` 封顶换行 ≈ `min(max-content, max(min-content, limit))` |
| `repeat(N, …)` | 重复轨道 N 次 |
| `repeat(auto-fill, …)` | 尽量多塞轨道，**空轨道保留** |
| `repeat(auto-fit, …)` | 尽量多塞轨道，**空轨道塌缩为 0**、项填满 |
| `subgrid` | 继承父网格在该方向的轨道（见下方 Baseline） |

## 常用配方（直接抄）

```css
/* RAM 响应式画廊：零媒体查询，宽屏多列、窄屏单列不溢出 */
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
  gap: 16px;
}

/* 严格等分 N 列（内容再宽也不破坏比例） */
.equal {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

/* 整页骨架：头脚通栏、主区吃满高度 */
.app {
  display: grid;
  min-height: 100vh;
  grid-template-columns: 240px 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header  header"
    "sidebar main"
    "footer  footer";
}

/* 通栏元素：无视列数横跨整行 */
.full-bleed {
  grid-column: 1 / -1;
}

/* 一行垂直水平居中 */
.center {
  display: grid;
  place-items: center;
}

/* 卡片内部跨行对齐（subgrid） */
.card {
  display: grid;
  grid-row: span 3;
  grid-template-rows: subgrid;
}
```

## RAM 模式拆解

`repeat(auto-fit, minmax(min(100%, 250px), 1fr))` 逐段：

| 片段 | 作用 |
| --- | --- |
| `repeat(auto-fit, …)` | 列数随容器宽度自动变化；空轨道塌缩，项填满整行 |
| `minmax(下限, 1fr)` | 每列在「下限」与「均分 1 份」之间伸缩 |
| `min(100%, 250px)` | 下限取「250px」与「容器 100%」较小者 —— 容器窄于 250px 时单列也不溢出 |

想让卡片**保持固定宽、不被拉伸、靠左排**：把 `auto-fit` 换 `auto-fill`。

## 现代特性 Baseline 状态（2026-06 核）

| 特性 | 状态 | 用法建议 |
| --- | --- | --- |
| CSS Grid 核心（`display:grid`、模板、放置、`gap`） | ✅ Baseline 广泛可用（2017 起） | 放心用 |
| `grid` 上的 `gap` / `row-gap` / `column-gap` | ✅ 广泛可用 | 放心用 |
| `min-content` / `max-content` / `fit-content()` | ✅ 广泛可用 | 放心用 |
| `repeat(auto-fill / auto-fit, minmax())` | ✅ 广泛可用 | RAM 模式放心用 |
| **`subgrid`** | ✅ **Baseline 广泛可用**（**2023-09** 起：Chrome/Edge 117、Firefox 71、Safari 16.0；约 88% 全球） | 现代项目放心用；需兼容更老浏览器则渐进降级为普通嵌套 |
| `masonry`（瀑布流，`grid-template-rows: masonry`） | 🟠 **实验性、非 Baseline** | 语法仍在标准化，浏览器支持有限，必须能降级 |

## 对齐方向记忆

Grid 的对齐分两组，方向是新手最易混的点：

| 前缀 | 管哪个方向 | 默认 |
| --- | --- | --- |
| `justify-*` | **行内向 / 列方向（横向，inline 轴）** | `stretch`（items）|
| `align-*` | **块向 / 行方向（纵向，block 轴）** | `stretch`（items）|

- `*-items` / `*-self`：项**在自己单元格内**怎么对齐（容器统一设 vs 单项覆盖）。
- `*-content`：**整个网格**在容器里怎么对齐（仅当所有轨道之和小于容器、有富余空间时可见）。

## 权威链接

**标准 / 规范**

- [W3C: CSS Grid Layout Module Level 1](https://www.w3.org/TR/css-grid-1/) · [Level 2（subgrid）](https://www.w3.org/TR/css-grid-2/)
- [MDN: `grid-template-columns`](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-columns) · [`grid-template-areas`](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-areas) · [`grid-auto-flow`](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-auto-flow)
- [MDN: `minmax()`](https://developer.mozilla.org/en-US/docs/Web/CSS/minmax) · [`repeat()`](https://developer.mozilla.org/en-US/docs/Web/CSS/repeat) · [`fit-content()`](https://developer.mozilla.org/en-US/docs/Web/CSS/fit-content_function)

**课程 / 指南**

- [web.dev: Learn CSS — Grid](https://web.dev/learn/css/grid)
- [MDN: CSS grid layout（指南合集）](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout)
- [MDN: Basic concepts of grid layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Basic_concepts_of_grid_layout) · [Subgrid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Subgrid)

**兼容性 / 调试**

- [Baseline 浏览器兼容查询：webstatus.dev](https://webstatus.dev/) · [caniuse: CSS Grid](https://caniuse.com/css-grid) · [caniuse: subgrid](https://caniuse.com/css-subgrid)

## 相关页

- [入门](./getting-started) · [网格轨道与 fr/minmax/repeat](./guide-line/grid-tracks) · [模板区域](./guide-line/template-areas)
- [基于线与区域放置](./guide-line/line-area-placement) · [隐式网格与自动布局](./guide-line/implicit-grid)
- [`subgrid` 子网格](./guide-line/subgrid) · [Grid 实战](./guide-line/grid-patterns)
