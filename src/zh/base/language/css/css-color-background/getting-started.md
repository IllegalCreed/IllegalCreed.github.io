---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 颜色四种主流写法：关键字 `tomato`、十六进制 `#b71540` / 带透明度 `#00000080`、`rgb(183 21 64 / 80%)`（现代空格语法）、`hsl(344 79% 40%)`
- 现代色彩空间：`oklch(70% 0.15 50)`（感知均匀，**推荐做主题色**）、`oklab()` / `lab()` / `lch()`、`color(display-p3 …)`（广色域）——均 Baseline 2023 广泛可用
- 混色：`color-mix(in oklch, blue 30%, white)` 生成色阶；相对颜色 `oklch(from var(--brand) l c h / 50%)` 派生变体（Baseline 2024，渐进增强）
- 透明：`transparent`（全透明）、`currentColor`（取当前 `color`）、alpha 用 `/ 50%` 或 `/ 0.5`
- 背景：`background-color`、`background-image: url() / 渐变`、多层用逗号叠（**先写的在上层**）、`background-size: cover` / `contain`
- 边框：`border: 2px solid #ccc`、圆角 `border-radius: 12px`、圆形 `50%`、药丸 `9999px`
- 阴影：`box-shadow: 0 4px 12px rgb(0 0 0 / 15%)`；多层逗号叠、`inset` 内阴影；不占布局
- 渐变：`linear-gradient(to right, a, b)` / `radial-gradient(circle, a, b)` / `conic-gradient(from 0deg, a, b)`；加 `in oklch` 防发灰
- 暗色：`color-scheme: light dark` + `light-dark(亮色, 暗色)`，让默认 UI 与取色一行适配两套主题

## 一段「现代且自洽」的配色样板

下面这段覆盖了真实项目里上色最常用的部分，本叶其余各页就是逐块拆解它：

```css
:root {
  /* 1. 声明支持明暗两套，让 light-dark() 与默认 UI 生效 */
  color-scheme: light dark;

  /* 2. 用 oklch 定义品牌色——亮度/彩度/色相三个维度独立可调 */
  --brand: oklch(62% 0.19 264);

  /* 3. 用相对颜色从品牌色派生：更浅的背景、半透明的描边 */
  --brand-soft: oklch(from var(--brand) 96% 0.03 h);
  --brand-border: oklch(from var(--brand) l c h / 25%);

  /* 4. 用 color-mix 生成「悬停加深 12%」的变体 */
  --brand-hover: color-mix(in oklch, var(--brand), black 12%);

  /* 5. 文字/背景按明暗一行给两色 */
  --fg: light-dark(#1a1a1a, #e8e8e8);
  --bg: light-dark(#ffffff, #0d1117);
}

.card {
  color: var(--fg);
  background: var(--bg);

  /* 6. 边框 + 圆角 */
  border: 1px solid var(--brand-border);
  border-radius: 12px;

  /* 7. 分层阴影：一道近实影 + 一道远柔影，比单道更有质感 */
  box-shadow:
    0 1px 2px rgb(0 0 0 / 8%),
    0 8px 24px rgb(0 0 0 / 12%);
}

.card__cta {
  color: white;
  /* 8. 渐变背景在 oklch 空间插值，中段不发灰 */
  background: linear-gradient(in oklch to right, var(--brand), var(--brand-hover));
}

.card__cta:hover {
  background: var(--brand-hover);
}
```

::: tip 这段样板的取舍
旧项目里常见的 `rgba(0,0,0,.5)` 逗号语法仍然有效，但现代写法统一用**空格 + 斜杠**：`rgb(0 0 0 / 50%)`。`hsl()` 当年是「可读地调色」的首选，如今做设计系统更推荐 `oklch()`——它的「亮度」是真·感知亮度，调色阶不会忽深忽浅。
:::

## 逐块拆解

### ① 颜色怎么写

最常用的四种：英文关键字（`tomato`、`rebeccapurple`，共 148 个）、十六进制（`#b71540`，加两位是透明度 `#b7154080`）、`rgb()`、`hsl()`。现代语法一律用空格分隔、`/` 接 alpha：

```css
color: rgb(183 21 64 / 80%);
color: hsl(344 79% 40% / 0.8);
```

详见 [颜色表示法与色彩空间](./guide-line/color-spaces)。

### ② 为什么用 oklch

`hsl()` 的「亮度」并不等于人眼感知的亮度——`hsl(60 100% 50%)`（黄）看着比 `hsl(240 100% 50%)`（蓝）亮得多，尽管亮度值都是 `50%`。`oklch()` 修正了这一点：

```css
--c-1: oklch(70% 0.15 30); /* 红 */
--c-2: oklch(70% 0.15 250); /* 蓝，看起来一样亮 */
```

这让「批量生成色阶 / 主题换色」变得可预测。`oklch()` 自 2023 年起 Baseline 广泛可用。详见 [颜色表示法与色彩空间](./guide-line/color-spaces)。

### ③ 混色与派生

`color-mix()` 把两个颜色按比例混合，生成 tint（掺白）/ shade（掺黑）或半透明：

```css
background: color-mix(in oklch, var(--brand) 25%, white); /* 浅色调 */
background: color-mix(in srgb, var(--brand) 50%, transparent); /* 50% 透明 */
```

相对颜色语法用 `from` 拆出原色的通道再重组，最适合「从一个品牌色派生整套变量」。详见 [`color-mix()` 与颜色函数](./guide-line/color-mix-functions)。

### ④ 背景

`background` 是个能塞很多东西的简写：颜色、图片、渐变、重复、定位、尺寸。多层背景用逗号叠加，**先写的在上层**：

```css
background:
  linear-gradient(rgb(0 0 0 / 40%), rgb(0 0 0 / 40%)), /* 上层：压暗蒙版 */
  url("/hero.jpg") center / cover no-repeat; /* 下层：图片 */
```

详见 [背景全谱](./guide-line/backgrounds)。

### ⑤ 边框与圆角

`border` 是 `border-width` / `border-style` / `border-color` 的简写；圆角 `border-radius` 单值四角统一，`50%` 出圆形，`9999px` 出药丸：

```css
border: 2px solid currentColor;
border-radius: 12px;
```

详见 [边框与圆角](./guide-line/borders-radius)。

### ⑥ 阴影

`box-shadow` 的五个值是 `x偏移 y偏移 模糊 扩展 颜色`，`inset` 变内阴影。单道阴影常显「假」，叠两三道（近实 + 远柔）才有真实的层次：

```css
box-shadow:
  0 1px 2px rgb(0 0 0 / 8%),
  0 8px 24px rgb(0 0 0 / 12%);
```

详见 [box-shadow 与阴影设计](./guide-line/box-shadow)。

### ⑦ 渐变

三类渐变各司其职——`linear`（直线）、`radial`（由内向外）、`conic`（绕圈，画饼图 / 色轮）。加 `in oklch` 指定插值空间，能避免两色中段「发灰」：

```css
background: linear-gradient(in oklch 45deg, deeppink, gold);
```

详见 [渐变全谱](./guide-line/gradients)。

## 现代特性 Baseline 一览

| 特性 | 状态（2026-06 核） |
| --- | --- |
| `rgb()` / `hsl()` 空格语法、`#rrggbbaa` | ✅ Baseline 广泛可用 |
| `oklch()` / `oklab()` / `lab()` / `lch()` / `color()` | ✅ Baseline 2023 广泛可用 |
| `color-mix()` | ✅ Baseline 2023 广泛可用 |
| `conic-gradient()` / 渐变插值 `in <space>` | ✅ Baseline 广泛可用（2020 起） |
| `light-dark()` | 🟡 Baseline 2024 新近可用 |
| 相对颜色语法 `rgb(from …)` | 🟡 Baseline 2024 新近可用，按渐进增强用 |

## 下一步

按本叶地图依次深入，或直接跳到你最关心的一页——[色彩空间](./guide-line/color-spaces)、[颜色函数](./guide-line/color-mix-functions)、[背景](./guide-line/backgrounds)、[边框圆角](./guide-line/borders-radius)、[阴影](./guide-line/box-shadow)、[渐变](./guide-line/gradients)。
