---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 字体族永远带回退：`font-family: "Inter", system-ui, sans-serif;`——浏览器**逐字符**从左往右挑，缺字才往后退
- 装自定义字体：`@font-face { font-family; src: url("x.woff2") format("woff2"); }`，**只用 WOFF2** 即可
- 加载策略：`font-display: swap`——先用回退字体显示（FOUT），字体到了再换，避免白屏（FOIT）
- 关键字体预加载：`<link rel="preload" href="x.woff2" as="font" type="font/woff2" crossorigin>`
- 可变字体：一个文件覆盖全字重，优先用标准属性 `font-weight: 550` 而非 `font-variation-settings`
- 行距用**无单位数**：`line-height: 1.5`（按当前字号倍数算，子元素不会继承到错误的固定值）
- 标题均衡折行：`text-wrap: balance`（Baseline 2024，≤6 行才生效）；正文消孤行：`text-wrap: pretty`
- 防长串撑破容器：`overflow-wrap: break-word`（必要时连断 `word-break` / 自动连字符 `hyphens: auto`）
- 单行截断三件套：`white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`
- 列表标记：`list-style-type` 换符号，`::marker { color }` 直接给圆点/编号上色
- 自动编号：`counter-reset` 起头 + `counter-increment` 自增 + `content: counter(x)` 显示

## 一套「装字体 → 调排版 → 防截断」的最小配方

下面这段覆盖了排版最常用的三件事，本叶其余各页就是逐块把它讲透：

```css
/* ① 装一款自定义可变字体——只给 WOFF2，声明字重范围 */
@font-face {
  font-family: "Inter";
  src: url("/fonts/Inter.var.woff2") format("woff2");
  font-weight: 100 900; /* 可变字体：一个文件覆盖 100～900 */
  font-display: swap; /* 加载期先用回退字体，别白屏 */
}

/* ② 设全局字体栈与基础排版 */
:root {
  /* 自定义字体打头，后接系统字体栈兜底 */
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 16px;
  line-height: 1.6; /* 无单位：按各自字号算行距，正文舒适区 1.4～1.7 */
}

/* ③ 标题：均衡折行 + 收紧字距 */
h1,
h2 {
  text-wrap: balance; /* 多行标题每行字数尽量均衡（Baseline 2024） */
  letter-spacing: -0.02em; /* 大字号略收紧更精神 */
}

/* ④ 正文段落：消除末行孤字 */
p {
  text-wrap: pretty; /* 尽量不让最后一行只剩一个词（孤行） */
}

/* ⑤ 防止长 URL / 长单词撑破容器 */
.content {
  overflow-wrap: break-word; /* 实在放不下就从单词中间断开 */
}

/* ⑥ 单行省略号截断（卡片标题常用） */
.card__title {
  white-space: nowrap; /* 不折行 */
  overflow: hidden; /* 溢出隐藏 */
  text-overflow: ellipsis; /* 末尾显示 … */
}
```

```html
<!-- 关键字体预加载：让浏览器尽早开始下载，缩短 FOUT/FOIT 时长 -->
<link
  rel="preload"
  href="/fonts/Inter.var.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
```

::: tip 这套配方的取舍
2026 年只需提供 **WOFF2** 一种格式（压缩率比 WOFF 高约 30%，现代浏览器全支持），不必再写 `truetype` / `woff` 回退链。`font-display: swap` 是「内容优先」的稳妥默认；若追求零布局抖动可换 `optional`（详见[字体加载与性能](./guide-line/font-loading)）。
:::

## 逐块拆解

### ① 字体族：逐字符回退

```css
font-family: "Inter", system-ui, sans-serif;
```

`font-family` 是一个**优先级列表**：浏览器对每个字符，从左往右找第一款「装了且含该字形」的字体。所以列表末尾必须有一个**通用字体族**（`serif` / `sans-serif` / `monospace` 等）兜底——它由操作系统映射到某款实际字体，保证永远有字可显示。中间放 `system-ui`（当前系统默认 UI 字体）能零成本拿到原生观感。详见[字体族与 `@font-face`](./guide-line/font-face-variable)。

### ② `@font-face`：把字体装进页面

```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/Inter.var.woff2") format("woff2");
}
```

`@font-face` 是一条**声明规则**（不能写在选择器内部），它给一个字体文件起个名字，之后在 `font-family` 里就能像系统字体一样用这个名字。`format("woff2")` 让浏览器跳过不支持的格式、不做无谓下载。详见[字体族与 `@font-face`](./guide-line/font-face-variable)。

### ③ `font-display`：加载期显示什么

字体文件要下载，下载完成前这段时间屏幕上显示什么，由 `font-display` 决定：`swap` 先用回退字体（用户立刻能读，代价是字体到位时会「换一下」=FOUT）；`block` 先留白等字体（代价是短暂白字=FOIT）。详见[字体加载与性能](./guide-line/font-loading)。

### ④ 行距与字距

```css
line-height: 1.6;
letter-spacing: -0.02em;
```

`line-height` 强烈建议用**无单位数字**——它表示「当前字号的倍数」，子元素继承的是这个比例而非一个固定像素，能避免大字号子元素行距被压扁的经典坑。`letter-spacing` 调字符间距，大字号标题略收紧、全大写文字略放宽是常见手法。详见[行距·字距·对齐与装饰](./guide-line/line-spacing-align)。

### ⑤ 折行与截断

长 URL、长英文单词、长 token 默认不会在单词中间断，会直接**撑破容器**——`overflow-wrap: break-word` 是最常用的解药。要做单行省略号则是 `white-space: nowrap` + `overflow: hidden` + `text-overflow: ellipsis` 三件套。现代还有 `text-wrap: balance/pretty` 专门优化折行的「好看程度」。详见[截断·折行·断词](./guide-line/text-overflow-wrap)。

### ⑥ 列表标记与计数器

列表前的圆点/编号是「标记盒」，`list-style-type` 换它的符号、`::marker` 直接给它上色或换内容。需要「1.1 / 1.2.3」这种多级编号或给标题自动编号时，用 CSS 计数器（`counter-reset` + `counter-increment` + `counter()`）。详见[列表样式与 `::marker`](./guide-line/list-marker) 与[计数器与生成内容](./guide-line/counters)。

## 字体相关属性家族一览

| 属性 | 管什么 | 常用值 |
| --- | --- | --- |
| `font-family` | 字体族优先级列表 | 字体名 + 通用族兜底 |
| `font-size` | 字号 | `16px` / `1rem` / `1.5em` |
| `font-weight` | 字重 | `400`（normal）/ `700`（bold）/ 可变 `100–900` |
| `font-style` | 斜体 | `normal` / `italic` / `oblique` |
| `line-height` | 行高 | **无单位** `1.5`（推荐） |
| `letter-spacing` | 字符间距 | `-0.02em` / `0.1em` |
| `text-align` | 水平对齐 | `start` / `center` / `justify` |
| `text-transform` | 大小写转换 | `uppercase` / `capitalize` |
| `text-decoration` | 下划线/删除线 | `underline` / `line-through` |

`font` 简写可一行写多项，但顺序固定且必含 `font-size` 与 `font-family`：`font: italic 700 16px/1.5 "Inter", sans-serif;`（`line-height` 跟在字号后用 `/` 分隔）。

## 下一步

按本叶地图依次深入，或直接跳到你最关心的一页——[字体族与 `@font-face`](./guide-line/font-face-variable)、[字体加载与性能](./guide-line/font-loading)、[行距字距](./guide-line/line-spacing-align)、[折行截断](./guide-line/text-overflow-wrap)、[列表标记](./guide-line/list-marker)、[计数器](./guide-line/counters)。
