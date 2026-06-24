---
layout: doc
outline: [2, 3]
---

# 渐变全谱

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 渐变是「按需生成的图」，用在 `background-image` / `border-image` / `mask` 等接受 `<image>` 处，**不能给 `background-color`**
- `linear-gradient(方向, 色1, 色2…)`：方向用角度 `45deg` 或关键字 `to right`；色标带位置 `red 30%`
- `radial-gradient(形状 尺寸 at 位置, 色…)`：形状 `circle`/`ellipse`，尺寸 `closest-side`…`farthest-corner`(默认)
- `conic-gradient([from 角][at 位], 色…)`：绕中心转圈，色标用角度；画饼图 / 色轮，Baseline **2020-11**
- 硬色标（条纹）：同位置写两次色 `red 30px, white 30px`；多用于条纹 / 饼图分块
- 重复渐变：`repeating-linear-gradient` / `repeating-radial-gradient` / `repeating-conic-gradient`
- 多层叠加：逗号分隔可叠多个渐变（与图片混叠），先写的在上层
- **插值色彩空间**：`linear-gradient(in oklch, …)` 等让中段不发灰；极坐标空间可加 `longer hue` 等

## 渐变是什么

渐变函数返回一张 `<image>`——一张「按颜色规则即时画出来、能被拉伸铺满」的图。所以它用在所有接受图片的地方（`background-image`、`border-image`、`mask-image`、`list-style-image`…），但**不能**用于 `background-color`（那只收纯色）。

```css
background-image: linear-gradient(black, white); /* ✅ */
background-color: linear-gradient(black, white); /* ❌ 非法 */
```

## `linear-gradient()`：直线渐变

```css
background: linear-gradient(black, white); /* 默认从上到下 */
background: linear-gradient(to right, black, white); /* 从左到右 */
background: linear-gradient(45deg, darkred 30%, crimson); /* 45 度 + 色标位置 */
```

第一个参数是**方向**——角度（`0deg` 向上、`90deg` 向右、顺时针）或关键字（`to right` / `to bottom right`）；其后是颜色列表，每个颜色可带**色标位置**（`%` 或长度）控制它在哪儿、何处与邻色混合。

### 硬色标做条纹

同一位置连写两个颜色（位置相同），过渡区长度为 0，就得到「硬边」——条纹的基础：

```css
.stripe {
  background: linear-gradient(45deg, red 0 30px, white 30px 60px);
}
```

## `radial-gradient()`：放射渐变

```css
background: radial-gradient(white, black); /* 由内向外 */
background: radial-gradient(circle, white, black); /* 强制正圆 */
background: radial-gradient(circle at top left, white, black); /* 指定圆心 */
background: radial-gradient(ellipse closest-side at 60% 40%, gold, transparent);
```

参数是「**形状 尺寸 `at` 位置**」：

- **形状**：`circle`（正圆）或 `ellipse`（椭圆，按盒子宽高自适应，默认）；
- **尺寸关键字**：决定渐变终点边界——`closest-side`（到最近边）、`closest-corner`（到最近角）、`farthest-side`（到最远边）、`farthest-corner`（到最远角，**默认**）；
- **位置**：`at` 后跟坐标（同 `background-position`），默认 `center`。

放射渐变常用于聚光灯、球体高光、径向遮罩。

## `conic-gradient()`：锥形（圆锥）渐变

::: tip Baseline
`conic-gradient()` 自 **2020 年 11 月起 Baseline 广泛可用**。
:::

```css
background: conic-gradient(white, black); /* 绕中心转一圈 */
background: conic-gradient(from 45deg, blue, red); /* 从 45 度起转 */
background: conic-gradient(from 90deg at 0 0, blue, red); /* 圆心移到左上角 */
```

锥形渐变颜色绕中心点**旋转**（像表针扫一圈），色标用**角度**（`deg` / `turn` / `%`，`100% = 360°`）而非距离。参数：

- `from <角度>`：起始角，默认 `0deg`（正上方 12 点），顺时针；
- `at <位置>`：圆心，默认 `center`。

### 画饼图与色轮

锥形渐变最经典的两个用途：

```css
/* 饼图：用「同角度连写两色」做硬分块 */
.pie {
  width: 200px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: conic-gradient(red 36deg, orange 36deg 170deg, yellow 170deg);
}

/* 色轮：色相绕一整圈（longer hue 走满色相） */
.wheel {
  width: 200px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: conic-gradient(in hsl longer hue, hsl(0 100% 50%), hsl(360 100% 50%));
}
```

::: warning 饼图无障碍
CSS 背景图对屏幕阅读器**不可见**。用锥形渐变画的图表只是装饰，承载数据时必须配语义化的 HTML（表格 / `<svg>` + `aria`）或文本说明。
:::

## 重复渐变

三种重复变体，参数与非重复版一致，把定义好的「一段」沿渐变线 / 半径 / 角度无限重复，铺满整个区域：

```css
/* 重复线性：45 度条纹 */
background: repeating-linear-gradient(45deg, red, red 30px, white 30px, white 60px);
/* 重复放射：同心圆环 */
background: repeating-radial-gradient(circle, #333 0 10px, #555 10px 20px);
/* 重复锥形：放射状扇形 */
background: repeating-conic-gradient(from 0deg, #eee 0deg 10deg, #ccc 10deg 20deg);
```

`repeating-*` 是做条纹、网格、棋盘、扇形等周期性纹理的利器。

### 棋盘格（锥形 + 平铺）

```css
.checkerboard {
  background: conic-gradient(
      white 0.25turn,
      black 0.25turn 0.5turn,
      white 0.5turn 0.75turn,
      black 0.75turn
    )
    top left / 25% 25% repeat;
}
```

## 多层渐变叠加

渐变也是背景图，逗号可叠多个（彼此之间或与 `url()` 图片混叠），**先写的在上**。配合**半透明色标**可叠出复杂纹理：

```css
.mesh {
  background:
    radial-gradient(at 20% 30%, rgb(255 0 128 / 50%), transparent 50%),
    radial-gradient(at 80% 70%, rgb(0 128 255 / 50%), transparent 50%),
    #101020;
}
```

## 插值色彩空间：让渐变不发灰

::: tip Baseline
渐变的插值色彩空间语法 `in <space>` 与 `conic-gradient()` 同属 Baseline 广泛可用（2020 起逐步落地），现代浏览器均支持。
:::

默认渐变在 sRGB 里插值，红→绿、蓝→黄等组合中段常**发灰发暗**。在方向 / 形状参数处加 `in <色彩空间>`，改在感知均匀的空间插值即可解决：

```css
/* 默认 srgb：中段偏灰 */
.a {
  background: linear-gradient(to right, deeppink, yellow);
}
/* oklch / oklab：中段保持鲜亮 */
.b {
  background: linear-gradient(in oklch to right, deeppink, yellow);
}
```

可选空间同 `color-mix()`：直角 `srgb` / `lab` / `oklab` / `xyz`，极坐标 `hsl` / `hwb` / `lch` / `oklch`。

### 色相绕行方向

极坐标空间还能控制色相走「短弧」还是「长弧」：

```css
background: linear-gradient(in oklch, deeppink, yellow); /* shorter（默认） */
background: linear-gradient(in oklch longer hue, deeppink, yellow); /* 绕远，扫过更多色相 */
background: linear-gradient(in oklch increasing hue, deeppink, yellow); /* 色相角递增 */
```

`longer hue` 让两色之间走完大半个色轮，常用来做彩虹 / 多彩条带；`shorter`（默认）走最短路。

## 小结

三类渐变分工明确：`linear` 走直线、`radial` 由内向外、`conic` 绕圈（画饼图 / 色轮）；硬色标做条纹，`repeating-*` 做周期纹理，逗号叠加 + 半透明色标做复杂背景。现代渐变最该记住的一招是**加 `in oklch`** 让中段不发灰、配 `longer hue` 控色相绕行。本叶到此把「上色」从颜色、混色、背景、边框、阴影到渐变讲完，速查与链接汇总见 [参考](../reference)。
