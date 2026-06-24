---
layout: doc
outline: [2, 3]
---

# 容器查询

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 两步走：① 父元素 `container-type: inline-size;` ② 子元素 `@container (width >= 30em) { … }`
- `container-type`：`inline-size`（只查 inline 轴，最常用）/ `size`（查双轴，需自带高度）/ `normal`（默认，不作尺寸容器）
- 命名容器：`container-name: card;` + `@container card (width >= 30em)`，精确指定查哪个容器
- 简写：`container: card / inline-size;`（`<名字> / <类型>`）
- 容器单位：`cqi`=inline-size 的 1%、`cqw`=宽 1%、`cqb`=block-size 1%、`cqh`=高 1%、`cqmin` / `cqmax`
- 查询条件：`width` / `height` / `inline-size` / `block-size` / `aspect-ratio` / `orientation`，运算符同 range 语法
- style 查询：`@container style(--theme: dark) { … }`——查容器的**计算样式 / 自定义属性**值
- 与媒体查询的根本区别：媒体按**视口**、容器按**祖先容器**——同一组件丢进任何宽度容器都自适应
- 坑：`inline-size` 容器**不能**查 `aspect-ratio`（要双轴得用 `size`）；容器自身样式不能被自己的 `@container` 影响
- Baseline：size 容器查询 2023-02 起广泛可用；**style 查询**较新、支持度仍在铺开，按渐进增强用

## 为什么需要容器查询

媒体查询有一个根本局限：它只知道**视口**多大，不知道**组件被放在哪**。同一张卡片，放进 320px 宽的侧栏该竖排，放进 900px 宽的正文该横排——可它们处在同一个视口里，媒体查询给不出不同答案。

容器查询解决的正是这件事：让组件根据「**自己所在容器的尺寸**」来排版。于是同一个组件复制到任何宽度的容器里，都能自适应——这才是真正的**组件级响应式**，也是把 UI 拆成可复用组件的关键拼图。

## 两步走：声明容器，再查询

### 第一步：用 `container-type` 声明查询容器

要让某个元素成为「可被查询的容器」，给它设 `container-type`：

```css
.card-wrap {
  container-type: inline-size;
}
```

`container-type` 有三个取值：

| 取值 | 含义 | 用途 |
| --- | --- | --- |
| `inline-size` | 只查 inline 轴（横排时即宽度）；对该轴施加 containment | **最常用**，组件横向响应 |
| `size` | 查 inline + block 双轴；对两个轴都施加 containment | 需要按高度 / 宽高比查询时 |
| `normal` | 默认值，不是尺寸查询容器 | 仅用作 style 查询 / 命名容器 |

### 第二步：用 `@container` 写查询

容器声明后，其**后代元素**就能用 `@container` 按容器尺寸应用样式：

```css
.card {
  display: block;
}

@container (width >= 30em) {
  .card {
    display: grid;
    grid-template-columns: 8rem 1fr;
    gap: 1rem;
  }
}
```

查询条件支持 `width`、`height`、`inline-size`、`block-size`、`aspect-ratio`、`orientation`，运算符与媒体查询 range 语法一致（`>`、`<`、`>=`、`<=`，以及 `30em <= width <= 60em` 区间）：

```css
@container (20em <= width <= 50em) { /* … */ }
@container (inline-size > 40em) and (orientation: landscape) { /* … */ }
```

::: warning `inline-size` 为什么不能查 `aspect-ratio`
`aspect-ratio` 需要同时知道宽和高，但 `container-type: inline-size` 只对 inline 轴施加 containment、不约束 block 轴，所以查不了宽高比。要按 `aspect-ratio` 或 `height` 查询，必须用 `container-type: size`——但 `size` 要求容器有确定的高度，否则会塌陷。日常组件横向响应用 `inline-size` 就够了。
:::

## 命名容器：精确指定查谁

当存在嵌套容器时，`@container` 默认查**最近的祖先容器**。用 `container-name` 给容器起名，就能跨层精确指定：

```css
.sidebar {
  container-type: inline-size;
  container-name: sidebar;
}

/* 明确查名为 sidebar 的容器，跳过更近的匿名容器 */
@container sidebar (width >= 20em) {
  .widget {
    display: flex;
  }
}
```

`container-name` 与 `container-type` 可用 `container` 简写合并，格式为 `<名字> / <类型>`：

```css
.sidebar {
  container: sidebar / inline-size;
}
```

## 容器查询长度单位

容器查询自带一组长度单位，让元素能**按容器尺寸**缩放（类似 `vw` / `vh` 之于视口）：

| 单位 | 含义 |
| --- | --- |
| `cqw` | 容器宽度的 1% |
| `cqh` | 容器高度的 1% |
| `cqi` | 容器 inline-size 的 1% |
| `cqb` | 容器 block-size 的 1% |
| `cqmin` | `cqi` 与 `cqb` 中较小者 |
| `cqmax` | `cqi` 与 `cqb` 中较大者 |

典型用法是让字号、内边距随容器流畅缩放，常配 `min()` / `max()` 兜底：

```css
@container (width >= 30em) {
  .card h2 {
    /* 至少 1.5em，超过则随容器 inline-size 增长 */
    font-size: max(1.5em, 1.23em + 2cqi);
  }
}
```

注意：当元素找不到合格的查询容器时，容器单位会回退到对应轴的小视口单位（`sv*`）。

## style 查询：按容器的样式值查询

除了查尺寸，`@container` 还能用 `style()` 查询容器的**计算样式**，最有用的是查自定义属性——这让你能基于「容器处于什么主题 / 状态」来切换后代样式：

```css
/* 精确匹配：容器的 --theme 计算值是否为 dark */
@container style(--theme: dark) {
  .card {
    background: #0d1117;
    color: #e6edf3;
  }
}

/* 布尔形式：自定义属性存在且不等于初始值 */
@container style(--featured) {
  .card { border: 2px solid gold; }
}

/* 数值范围形式 */
@container style(--columns >= 3) {
  .grid { gap: 2rem; }
}

/* 组合：and / or / not */
@container style(--theme: one) or style(--theme: two) {
  /* … */
}
@container not style(--theme: dark) {
  /* … */
}
```

几个要点：

- 默认值匹配时**颜色不会自动归一化**——若 `--accent` 是 `blue`，它不会匹配 `style(--accent: #0000ff)`，除非该属性用 `@property` 注册过。
- 简写属性当其所有长写属性都匹配时才匹配；`!important` 允许写但会被忽略；`revert` / `revert-layer` 作为查询值无效（恒为 false）。
- **任意元素都能做 style 查询容器**——`container-type` 不必是 `size` / `inline-size`，`normal`（默认）即可。

::: tip style 查询的 Baseline 状态
**size 容器查询**自 2023 年 2 月起 Baseline 广泛可用，可放心用。但 **style 查询**（`@container style(...)`）是更晚落地的能力，浏览器支持度仍在铺开——把它当**渐进增强**：用 style 查询锦上添花，但别让基础功能依赖它，并为不支持的浏览器准备合理回退。
:::

## 一个完整示例

```html
<aside class="sidebar">
  <article class="media">
    <img src="cover.jpg" alt="封面" />
    <div class="media__body">
      <h3>标题</h3>
      <p>摘要文本……</p>
    </div>
  </article>
</aside>
```

```css
/* 1. 把侧栏声明为 inline 查询容器 */
.sidebar {
  container: sidebar / inline-size;
}

/* 2. 默认竖排（窄容器） */
.media {
  display: grid;
  gap: 0.75rem;
}
.media img {
  inline-size: 100%;
}

/* 3. 容器够宽时切横排（图文左右排） */
@container sidebar (width >= 24em) {
  .media {
    grid-template-columns: 7rem 1fr;
  }
  .media h3 {
    font-size: max(1.25rem, 1rem + 1.5cqi);
  }
}
```

把这块 `.media` 原样复制到正文、页脚、弹窗里——它都会按各自容器的宽度自动横竖切换，无需任何改动。这就是容器查询的价值。

## 容器查询 vs 媒体查询

| 维度 | 媒体查询 `@media` | 容器查询 `@container` |
| --- | --- | --- |
| 决策依据 | 视口 / 设备 / 用户偏好 | 最近（或指名）祖先容器的尺寸 / 样式 |
| 适用层级 | 页面级（全局布局） | 组件级（可复用组件） |
| 同组件多处复用 | 需为每个位置写断点 | 一次定义，到处自适应 |
| 典型场景 | 整页栅格、导航折叠、打印样式 | 卡片、媒体对象、可嵌入小部件 |

两者**互补而非替代**：用媒体查询定页面骨架，用容器查询让骨架里的每个组件自适应。

## 小结

容器查询把「响应式」从页面级带到了组件级——`container-type` + `@container` 让组件按所在容器排版，cq* 单位让尺寸随容器流畅缩放，style 查询（渐进增强）还能按容器主题切换样式。下一页换个维度：在用新 CSS 之前先**探测浏览器支不支持**，从而安全地渐进增强：[`@supports` 特性查询](./supports-feature-queries)。
