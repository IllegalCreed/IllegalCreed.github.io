---
layout: doc
outline: [2, 3]
---

# 颜色表示法与色彩空间

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 关键字：148 个英文名（`tomato` / `rebeccapurple` / `goldenrod`），外加 `transparent`、`currentColor`、系统色（`Canvas` / `ButtonText`）
- 十六进制：`#rgb`（3 位）/ `#rrggbb`（6 位）/ `#rgba`（4 位）/ `#rrggbbaa`（8 位）；`#a4e` ≡ `#aa44ee`，末两位是 alpha
- `rgb()`：现代空格语法 `rgb(255 0 153 / 80%)`，通道 `0–255` 或 `0%–100%`；`rgba()` 与逗号语法仍兼容
- `hsl()`：`hsl(150 30% 60% / 0.8)`，色相 `0–360`（可带 `deg`/`turn`）、饱和度 + 亮度用 `%`
- `hwb()`：`hwb(194 0% 0% / .5)`——色相 + 白度 + 黑度，调「掺白掺黑」很直观
- **现代色彩空间**（Baseline 2023 广泛可用）：`oklch()` / `oklab()` / `lab()` / `lch()`，感知均匀、色域更大
- `oklch(L C H / A)`：L 亮度 `0–1`/`0%–100%`、C 彩度 `0–0.4`、H 色相角；**做设计系统首选**
- `color()`：跨色彩空间，`color(display-p3 0.9 0.2 0.4)` / `color(srgb …)` / `color(rec2020 …)`，广色域屏更鲜艳
- 缺失通道 `none`：`hsl(none 100% 50%)`，多用于渐变 / 插值；alpha 统一 `/` 分隔

## 颜色从哪来：关键字与特殊值

最省事的是英文关键字，CSS 共有 148 个具名颜色：

```css
color: tomato;
color: rebeccapurple;
background: goldenrod;
```

三个特殊值必须记住：

- `transparent` —— 完全透明色，等价于 `rgb(0 0 0 / 0)`，是 `background-color` 的初始值；
- `currentColor` —— 取当前元素 `color` 的计算值，常用来让边框 / 图标「跟着文字颜色走」；
- 系统色 —— 如 `Canvas`（系统背景）、`ButtonText`、`Highlight`，跟随操作系统主题，做无障碍 / 强制配色时有用。

```css
/* 边框跟随文字色，文字变色边框自动跟着变 */
.tag {
  color: tomato;
  border: 1px solid currentColor;
}
```

## 十六进制：最常见的写法

```css
color: #b71540; /* 6 位 RGB */
color: #00000080; /* 8 位 RGBA，末两位 80 ≈ 50% 透明 */
color: #a4e; /* 3 位简写，等价 #aa44ee */
color: #a4e8; /* 4 位简写，等价 #aa44ee88 */
```

要点：每位是 `0–9` 或 `A–F`；3/4 位是 6/8 位的简写（每位翻倍）；末两位（8 位）或末一位（4 位）是 alpha——`80` ≈ 50%、`BF` ≈ 75%、`FF` = 不透明。

## `rgb()` 与 `hsl()`：现代空格语法

CSS Color 4 起，`rgb()` 与 `hsl()` 统一推荐**空格分隔通道、斜杠接 alpha**，不再需要 `rgba()` / `hsla()`（两个旧名仍是合法别名）：

```css
/* 现代：空格 + 斜杠 */
color: rgb(255 0 153);
color: rgb(255 0 153 / 80%);
color: hsl(150 30% 60%);
color: hsl(150 30% 60% / 0.8);

/* 旧式逗号：依然有效 */
color: rgb(255, 0, 153);
color: rgba(255, 0, 153, 0.8);
```

- `rgb()` 通道：`0–255` 或 `0%–100%`；
- `hsl()`：色相 `0–360`（也接受 `deg` / `turn` / `rad` / `grad`），饱和度与亮度用 `%`。`hsl()` 的优势是「人能读懂」——一眼知道是什么色、多鲜艳、多亮。

### `hwb()`：掺白掺黑的直觉模型

```css
color: hwb(12 50% 0%); /* 色相 12，掺 50% 白 */
color: hwb(194 0% 0% / 0.5); /* 纯色，半透明 */
```

`hwb()`（Hue-Whiteness-Blackness）和 `hsl()` 同属 sRGB 的极坐标表示，但用「往里掺多少白、掺多少黑」描述，调浅色 / 灰调更顺手。

## 现代色彩空间：oklch / oklab / lab / lch

::: tip Baseline
`oklch()`、`oklab()`、`lab()`、`lch()`、`color()` 自 **2023 年 5 月起 Baseline 广泛可用**，主流浏览器都已稳定支持，可放心用于生产。
:::

`hsl()` 有个绕不过的毛病：**它的「亮度」不是人眼的亮度**。同样 `lightness: 50%`，黄色看起来远比蓝色亮。这让「按固定步长生成色阶」变得不可靠。现代色彩空间就是来解决这件事的。

### `oklch()`：做设计系统的首选

```css
color: oklch(70% 0.15 30); /* 红 */
color: oklch(70% 0.15 250); /* 蓝，看起来和上面一样亮 */
color: oklch(59.69% 0.156 49.77 / 0.5); /* 带 alpha */
```

三个分量：

| 分量 | 含义 | 取值 |
| --- | --- | --- |
| L | 感知亮度 | `0`–`1` 或 `0%`–`100%`（`0` 黑，`1` 白） |
| C | 彩度（鲜艳度） | `0`–`0.4`（`100%` ≡ `0.4`），越大越艳 |
| H | 色相角 | `0`–`360`（注意 `0deg` 在 oklch 里偏品红，红约 `41deg`） |

`oklch()` 是 `oklab()` 的极坐标（柱面）形式，二者共用同一套感知均匀的亮度轴。它的杀手锏是**亮度所见即所得**：固定 L、只改 H，能得到「一样亮但不同色相」的一组色；固定 L、C，按步长改 H 能扫出协调的色轮。生成主题色阶、暗色映射都比 `hsl()` 可靠得多。

### `oklab()` / `lab()` / `lch()`

```css
color: oklab(59% 0.1 0.1); /* L 亮度 + a/b 两轴（直角坐标） */
color: lab(50% 40 59.5); /* CIE Lab，a 绿↔红，b 蓝↔黄 */
color: lch(52.2% 72.2 50); /* CIE Lab 的极坐标形式 */
```

- `oklab()` / `lab()` 是直角坐标（L + a + b 两个轴），适合做「感知均匀的过渡」；
- `lch()` / `oklch()` 是它们的极坐标（L + 彩度 + 色相），适合「按色相调色」；
- `ok` 前缀版（Oklab/Oklch）是更新、感知更均匀的版本，**优先选 `oklch()`**；无 `ok` 的 `lab()`/`lch()` 是 CIE Lab，色相角定义不同（`lch` 的 `0deg` 偏品红）。

## `color()`：跨色彩空间与广色域

```css
color: color(srgb 0.9 0.2 0.4); /* sRGB，通道 0–1 */
color: color(display-p3 0.9 0.2 0.4); /* 广色域，比 sRGB 多约 50% 颜色 */
color: color(display-p3 1 0.5 0 / 0.8); /* 带 alpha */
color: color(rec2020 0.5 0.5 0.5);
```

`color()` 函数显式指定色彩空间再给通道值（一律 `0–1`）。它最大的价值是**访问广色域**：`display-p3` 覆盖比 sRGB 更广的范围，在支持广色域的屏幕（近年多数手机 / Mac）上能显示 sRGB 表达不出的鲜艳色。可配合特性查询做渐进增强：

```css
.vivid {
  color: #f0306b; /* 回退：sRGB */
}
@supports (color: color(display-p3 1 1 1)) {
  .vivid {
    color: color(display-p3 0.95 0.1 0.42); /* 广色域屏更艳 */
  }
}
```

## 缺失通道 `none`

除旧式逗号语法外，任何通道都能写成 `none`：

```css
color: hsl(none 100% 50%); /* 色相缺失（计算时按 0 处理） */
color: oklab(50% none -0.25); /* a 轴缺失 */
```

`none` 在**插值 / 渐变**时尤其有用——它表示「这一维不参与」，能让某通道在过渡中保持另一端的值，而非强行从 0 开始。普通取色场景里 `none` 等价于 0（`0` / `0%` / `0deg`）。

## 选哪种写法

- **静态、团队熟悉**：十六进制 / `rgb()`，可读性靠注释；
- **要人肉调色**：`hsl()` / `hwb()`，读起来直观；
- **设计系统、要批量生成色阶 / 暗色**：`oklch()`，亮度可预测——这是现代项目的推荐默认；
- **追求屏幕极限鲜艳**：`color(display-p3 …)` + `@supports` 渐进增强。

## 小结

颜色的写法从「机器友好」（hex / rgb）一路演进到「人眼友好」（hsl）再到「感知均匀」（oklch / lab）。现代项目里，`oklch()` 因亮度可预测成了设计系统的新默认，`color()` 则打开了广色域的大门——两者都已 Baseline 广泛可用。下一页讲怎么把这些颜色**混起来、派生出来**：[`color-mix()` 与颜色函数](./color-mix-functions)。
