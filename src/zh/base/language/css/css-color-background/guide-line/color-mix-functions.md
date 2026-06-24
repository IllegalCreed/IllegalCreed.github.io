---
layout: doc
outline: [2, 3]
---

# `color-mix()` 与颜色函数

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- `color-mix()` 语法：`color-mix(in <空间>, <颜色1> <比例1>?, <颜色2> <比例2>?)`，Baseline **2023-05** 广泛可用
- 插值空间：直角 `srgb` / `srgb-linear` / `lab` / `oklab` / `xyz`，极坐标 `hsl` / `hwb` / `lch` / `oklch`；**调色阶优先 `oklch`/`oklab`**（不发灰）
- 比例规则：都省略各 `50%`；只给一个，另一个补 `100% - p`；两个和 ≠ 100% 时归一化；和 `< 100%` 还会乘 alpha
- 掺白掺黑：`color-mix(in oklch, var(--c) 25%, white)`（tint）/ `… black 25%`（shade）
- 加透明：`color-mix(in srgb, var(--c) 50%, transparent)` ≡ 50% 不透明度
- 色相绕行：极坐标空间可加 `shorter`(默认) / `longer` / `increasing` / `decreasing` `hue`
- 相对颜色：`oklch(from <源色> l c h / 50%)`，用 `from` 拆通道再重组；Baseline **2024 新近可用**，渐进增强
- 通道关键字：`rgb→r g b`、`hsl→h s l`、`oklch→l c h`、`lab→l a b`，alpha 一律 `alpha`；可套 `calc()`
- `light-dark(亮, 暗)`：按 `color-scheme` 一行给两套色；`currentColor` 取当前 `color`

## `color-mix()`：把两个颜色混起来

::: tip Baseline
`color-mix()` 自 **2023 年 5 月起 Baseline 广泛可用**，可放心用于生产。
:::

```css
/* 在 oklch 空间，把品牌色与白色按 25% : 75% 混合 → 浅色调 */
background: color-mix(in oklch, var(--brand) 25%, white);
```

完整语法是「插值空间 + 两个颜色 + 各自可选比例」：

```text
color-mix( in <color-space> [<hue-method>]? , <color> <percentage>? , <color> <percentage>? )
```

### 比例怎么算

两个百分比 `p1` / `p2` 的归一化规则：

| 情况 | 结果 |
| --- | --- |
| 都省略 | 各 `50%` |
| 只给 `p1` | `p2 = 100% - p1` |
| 只给 `p2` | `p1 = 100% - p2` |
| 都为 `0` | 非法 |
| 和 ≠ 100% | 按 `p1 / (p1+p2)` 归一化 |
| 和 `< 100%` | 归一化后，再给结果乘上 `p1+p2` 的 alpha |

```css
color-mix(in oklab, #a71e14 25%, white); /* 25% 红 + 75% 白 */
color-mix(in oklab, #a71e14, white); /* 省略 → 各 50% */
```

### 选哪个插值空间

这是 `color-mix()` 用好用坏的关键：

- **`oklch` / `oklab`**：感知均匀，混色过程**不会发灰**，彩度保持得好——做色阶 / 渐变首选；
- **`lab` / `xyz` / `srgb-linear`**：物理 / 感知均匀，适合科学性混光；
- **`srgb`**：只在「要复刻某个设计软件的混色结果」时用，**通常效果最差**（中段易发灰发暗）。

```css
/* 同样红→蓝，srgb 中段发灰，oklch 中段仍鲜亮 */
.a {
  background: color-mix(in srgb, red, blue);
}
.b {
  background: color-mix(in oklch, red, blue);
}
```

### 三个高频配方

```css
/* 1. tint / shade：生成浅色与深色变体 */
--c-tint: color-mix(in oklch, var(--c) 80%, white);
--c-shade: color-mix(in oklch, var(--c) 80%, black);

/* 2. 半透明：和 transparent 混 = 改不透明度（且不改 --c 本身） */
--c-50: color-mix(in srgb, var(--c) 50%, transparent);

/* 3. 悬停加深：和 black 混一点点 */
.btn:hover {
  background: color-mix(in oklch, var(--c), black 12%);
}
```

### 色相绕行方向

在极坐标空间（`hsl`/`hwb`/`lch`/`oklch`）里，两色相之间可走「短弧」或「长弧」：

```css
/* 默认 shorter：红→蓝走最短路 */
color-mix(in oklch shorter hue, red, blue);
/* longer：绕远路，经过更多中间色相 */
color-mix(in oklch longer hue, red, blue);
/* increasing / decreasing：强制色相角递增 / 递减 */
color-mix(in lch increasing hue, yellow 60%, blue);
```

## 相对颜色语法：从一个色派生一族

::: warning Baseline
相对颜色语法是 **Baseline 2024 新近可用**（较 `color-mix()` 更新）。生产中建议作为**渐进增强**，关键场景配 `@supports` 回退。
:::

相对颜色用 `from` 把一个「源色」拆成通道关键字，再重新组装成新色——这是「一个品牌色派生整套设计令牌」的最佳工具：

```css
/* 通用形态：函数(from 源色 通道1 通道2 通道3 / alpha) */
oklch(from red l c h); /* 原样重建 red */
oklch(from var(--brand) calc(l + 0.1) c h); /* 亮度 +0.1 → 更亮 */
oklch(from var(--brand) l c h / 25%); /* 只改 alpha → 半透明描边 */
rgb(from var(--brand) r g b / 50%); /* rgb 通道 + 半透明 */
```

各空间的通道关键字：

| 函数 | 通道关键字 |
| --- | --- |
| `rgb()` | `r` `g` `b` `alpha` |
| `hsl()` | `h` `s` `l` `alpha` |
| `hwb()` | `h` `w` `b` `alpha` |
| `lab()` / `oklab()` | `l` `a` `b` `alpha` |
| `lch()` / `oklch()` | `l` `c` `h` `alpha` |
| `color()` | 随色彩空间而定（如 sRGB 的 `r` `g` `b`） |

通道值都解析成 `<number>`（百分比 / 角度都转成纯数），所以能直接喂给 `calc()`：

```css
:root {
  --brand: oklch(62% 0.19 264);
}
.theme {
  /* 互补色：色相 +180 */
  --accent: oklch(from var(--brand) l c calc(h + 180));
  /* 三色组 */
  --triad-a: oklch(from var(--brand) l c calc(h + 120));
  --triad-b: oklch(from var(--brand) l c calc(h - 120));
  /* 派生浅背景与边框 */
  --surface: oklch(from var(--brand) 97% 0.02 h);
  --border: oklch(from var(--brand) l c h / 20%);
}
```

特性查询做回退：

```css
@supports (color: oklch(from white l c h)) {
  /* 安全使用相对颜色 */
}
```

::: tip 相对颜色 vs `color-mix()`
两者都能派生色，但分工不同：**`color-mix()`** 按比例「调和两个色」（掺白掺黑、混两色）；**相对颜色**「拆开一个色单独动某个通道」（只抬亮度、只转色相、只改透明）。需要精确控制某一维时用相对颜色，需要「往某色靠多少」时用 `color-mix()`。
:::

## `light-dark()`：一行给明暗两套

```css
:root {
  color-scheme: light dark; /* 前提：声明支持两套 */
}
.surface {
  color: light-dark(#1a1a1a, #e8e8e8); /* 亮模式取前者，暗模式取后者 */
  background: light-dark(white, #0d1117);
}
```

`light-dark()` 按当前 `color-scheme` 在两个颜色间选一个，省去为暗色写整套 `prefers-color-scheme` 媒体查询。**前提**是在 `:root` 上声明了 `color-scheme: light dark`，否则它只取第一个值。它是 Baseline 2024 新近可用特性。

## `currentColor`：跟随文字色

```css
.icon {
  fill: currentColor; /* SVG 图标跟随文字色 */
}
.divider {
  border-top: 1px solid currentColor;
  opacity: 0.2;
}
```

`currentColor` 取元素当前 `color` 计算值，是「让边框 / 图标 / 阴影自动和文字同色」最省事的写法，换主题时一处改、处处跟。

## 小结

`color-mix()` 负责「按比例调和」、相对颜色负责「拆通道精修」、`light-dark()` 负责「明暗二选一」、`currentColor` 负责「跟随文字」——四件工具配合 `oklch()`，一个品牌色就能长出整套自洽的设计令牌。其中 `color-mix()` 已广泛可用，相对颜色与 `light-dark()` 属 2024 新近可用，按渐进增强落地。下一页从「颜色」转向「背景」：[背景全谱](./backgrounds)。
