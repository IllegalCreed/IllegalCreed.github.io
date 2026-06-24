---
layout: doc
outline: [2, 3]
---

# 滤镜·混合·裁剪

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- `filter`：对元素自身做像素级处理，函数链：`blur(4px)` / `brightness(1.2)` / `contrast()` / `grayscale()` / `sepia()` / `saturate()` / `hue-rotate(90deg)` / `invert()` / `opacity()` / `drop-shadow()`
- `filter: drop-shadow()` 跟随**非透明轮廓**投影（PNG / SVG 异形），优于矩形的 `box-shadow`
- `backdrop-filter`：对元素**背后**的内容做滤镜——毛玻璃（`backdrop-filter: blur(10px)`）的标准做法；需元素半透明才看得见
- `mix-blend-mode`：元素与**下层内容**的混合模式（`multiply` / `screen` / `overlay` / `difference`…），像 PS 图层混合
- `background-blend-mode`：同一元素**多个背景层之间**的混合
- `clip-path`：把元素裁成任意形状——`circle()` / `ellipse()` / `inset()` / `polygon()` / `path()` / `<basic-shape>`；可动画（顶点数一致时）
- `mask`：用图像 / 渐变的**亮度或 alpha** 当遮罩，比 `clip-path` 更细腻（可羽化、渐隐）
- `filter` / `backdrop-filter` 函数多个空格连写、**从左到右**依次施加
- 多为 Baseline 广泛可用；`backdrop-filter` Baseline 2024（早期 Safari 需 `-webkit-` 前缀）；用 `@supports` 兜底
- 滤镜 / 混合 / 遮罩都会触发**重绘**且常需离屏合成——动画化要克制，大面积 `backdrop-filter` 尤其耗

## 四类视觉效果概览

这一页讲的是 transform 之外、**改变像素外观**的一组能力，可归为四类：

| 能力 | 作用对象 | 典型场景 |
| --- | --- | --- |
| `filter` | 元素**自身**的像素 | 模糊、变灰、调色、异形投影 |
| `backdrop-filter` | 元素**背后**的像素 | 毛玻璃面板、磨砂导航栏 |
| `mix-blend-mode` / `background-blend-mode` | 与**下层** / 背景层混合 | 双色叠加、文字穿透、做旧 |
| `clip-path` / `mask` | **裁剪 / 遮罩**形状 | 异形卡片、斜切、渐隐边缘 |

## `filter`：对自身做滤镜

`filter` 接一串滤镜函数，**从左到右**依次施加到元素（含其内容与背景）：

```css
.photo {
  filter: grayscale(0.5) brightness(1.1) contrast(1.05); /* 半灰 + 提亮 + 微增对比 */
}
.photo:hover {
  filter: none; /* 悬停恢复彩色 */
}
```

常用函数：

| 函数 | 作用 | 取值示例 |
| --- | --- | --- |
| `blur()` | 高斯模糊 | `blur(4px)`（长度，不能用百分比） |
| `brightness()` | 亮度 | `brightness(1.2)`（>1 更亮） |
| `contrast()` | 对比度 | `contrast(0.8)` |
| `grayscale()` | 灰度 | `grayscale(1)` 全灰 |
| `sepia()` | 棕褐做旧 | `sepia(0.6)` |
| `saturate()` | 饱和度 | `saturate(2)` 更艳 |
| `hue-rotate()` | 色相旋转 | `hue-rotate(90deg)` |
| `invert()` | 反色 | `invert(1)` 全反 |
| `opacity()` | 不透明度 | `opacity(0.5)`（可与合成层叠加） |
| `drop-shadow()` | 跟随轮廓的投影 | `drop-shadow(0 4px 6px rgb(0 0 0 / 0.3))` |

### `drop-shadow()` vs `box-shadow`

`box-shadow` 永远是**矩形边界**的影子；`filter: drop-shadow()` 沿元素的**实际非透明轮廓**投影——给透明 PNG、SVG 图标、`clip-path` 异形加阴影时，只有它能贴合形状：

```css
.icon {
  /* 沿图标镂空轮廓投影，而非外接矩形 */
  filter: drop-shadow(0 2px 4px rgb(0 0 0 / 0.4));
}
```

## `backdrop-filter`：背后的毛玻璃

`filter` 处理元素自身，`backdrop-filter` 处理元素**背后**透出来的内容——这是「毛玻璃 / 磨砂」效果的标准做法。关键前提：元素自身得**半透明**，才能透出被模糊的背景。

```css
.glass {
  background: rgb(255 255 255 / 0.2); /* 半透明，才看得到背后 */
  backdrop-filter: blur(12px) saturate(1.5); /* 把背后内容模糊并提饱和 */
}
```

::: warning backdrop-filter 的兼容与性能
- **兼容**：自 2024 年起 Baseline 可用，但早期 Safari 需 `-webkit-backdrop-filter` 前缀，稳妥起见两条都写，并用 `@supports (backdrop-filter: blur(1px))` 兜底；
- **性能**：它要求浏览器实时采样并模糊背后像素，**开销很大**，大面积或滚动中尤甚——克制使用，避免对它做动画。
:::

## 混合模式：与下层叠加

### `mix-blend-mode`：和下方内容混合

让元素像 Photoshop 图层那样与**其下方堆叠的内容**按某种公式混色：

```css
.title {
  mix-blend-mode: difference; /* 与背景做「差值」，文字在任意底色上都清晰 */
  color: white;
}
```

常用模式：`multiply`（正片叠底，变暗）、`screen`（滤色，变亮）、`overlay`（叠加，增对比）、`difference`（差值）、`darken` / `lighten`、`color-dodge` / `color-burn` 等。`difference` 常用于让文字自适应任意背景色。

### `background-blend-mode`：背景层之间混合

作用于**同一元素的多个背景层**（多张背景图 / 渐变 + 图）之间：

```css
.banner {
  background:
    linear-gradient(rgb(255 0 80 / 0.6), transparent),
    url("photo.jpg");
  background-blend-mode: multiply; /* 渐变与照片正片叠底，做出统一色调 */
}
```

## `clip-path`：裁成任意形状

`clip-path` 用一个形状把元素**裁剪**出来，形状外的部分（含背景、内容）被裁掉、不可见也不可点：

```css
/* 圆形头像 */
.avatar {
  clip-path: circle(50%);
}
/* 斜切横幅 */
.banner {
  clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%);
}
```

支持的形状函数：

- `circle(半径 at 圆心)` / `ellipse(rx ry at 中心)`；
- `inset(上 右 下 左 round 圆角)`——矩形内缩，可带圆角；
- `polygon(点1, 点2, …)`——任意多边形，每点 `x y`；
- `path("…")`——直接用 SVG 路径数据，画曲线异形。

**`clip-path` 可动画**：在两个**顶点数相同**的 `polygon()`（或同类形状）之间能平滑补间，常用于「展开 / 收起」「揭示」效果。顶点数不同则无法插值。

## `mask`：更细腻的遮罩

`clip-path` 是「硬边裁切」（要么在要么不在）；`mask` 则用一张**图像 / 渐变的亮度或 alpha 通道**当遮罩，能做**羽化、渐隐**这类软过渡：

```css
/* 底部渐隐：用线性渐变当遮罩，下边缘平滑淡出 */
.fade-bottom {
  mask-image: linear-gradient(to bottom, black 70%, transparent);
}
```

- 遮罩中**不透明 / 亮的地方**显示元素，**透明 / 暗的地方**隐藏；
- 可用 PNG、SVG、渐变作遮罩源，配 `mask-size` / `mask-repeat` / `mask-position`（语法类比 `background`）；
- 历史上 Safari / Chromium 长期需 `-webkit-mask-*` 前缀，落地时建议带前缀或用 `@supports` 检测。

口诀：**硬边异形用 `clip-path`，要羽化 / 渐变 / 用图当形状用 `mask`**。

## 性能与降级

滤镜、混合、遮罩都会触发**重绘**，且常需要**离屏合成**——它们比 `transform` / `opacity` 重得多：

- 尽量**别对 `filter` / `backdrop-filter` 做持续动画**，尤其大面积模糊；
- 用 `@supports` 为不支持的浏览器提供朴素降级（如毛玻璃退化为不透明底色）：

```css
.glass {
  background: rgb(30 30 40 / 0.9); /* 降级：直接给不透明底 */
}
@supports (backdrop-filter: blur(1px)) {
  .glass {
    background: rgb(30 30 40 / 0.4);
    backdrop-filter: blur(12px);
  }
}
```

性能与合成层的总体原理见 [动画性能与无障碍](./animation-performance)。

## 小结

`filter` 处理元素自身（`drop-shadow()` 贴轮廓投影是亮点）、`backdrop-filter` 做毛玻璃（重且需半透明 + 前缀兜底）、`mix-blend-mode` / `background-blend-mode` 做图层混合、`clip-path` 硬裁异形（顶点数一致可动画）、`mask` 用亮度 / alpha 做羽化遮罩。这些都比 `transform` 耗，动画化需克制并用 `@supports` 降级。接下来进入两项现代「页面级」能力——下一页讲 [View Transitions 与滚动驱动动画](./view-transitions-scroll)。
