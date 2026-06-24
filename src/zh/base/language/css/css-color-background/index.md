---
layout: doc
---

# CSS 颜色与背景

页面好不好看，第一眼往往就落在「颜色对不对、背景稳不稳、阴影有没有质感」上。这一叶把 CSS 里所有「上色」的能力讲透——从最基础的 `#rrggbb` / `rgb()` / `hsl()`，到 2023 年起广泛可用的现代色彩空间 `oklch()` / `oklab()` / `lab()` 与颜色函数 `color-mix()`、相对颜色语法，再到 `background-*` 全套属性、`border` 与 `border-radius`、`box-shadow` 阴影、以及 `linear` / `radial` / `conic` 三类渐变。这些属性单看都不难，但「现代该怎么写、暗色怎么自洽、阴影怎么有层次、渐变怎么不发灰」才是这一叶真正想交付的东西。

## 概述

- **它管什么**：用什么语法表达一个颜色（数值 / 关键字 / 现代色彩空间）、两个颜色怎么混（`color-mix()` / 相对颜色）、元素背后铺什么（`background-color` / 图片 / 渐变 / 多层背景）、四条边怎么描边与圆角（`border` / `border-radius` / `border-image`）、盒子怎么投影（`box-shadow`）、以及怎么用 `linear` / `radial` / `conic` 渐变画出过渡、条纹、饼图与色轮。
- **为什么值得认真学**：颜色是设计系统的地基。用 `hsl()` 调亮度，同一个亮度值在不同色相下看起来深浅不一；换成 `oklch()`，亮度就「所见即所得」，主题色阶才好生成。背景与阴影写错不报错，只是页面悄悄变「廉价」——阴影一刀切死黑、渐变中间发灰、暗色模式背景对不上。把这一套现代写法吃透，UI 的质感会肉眼可见地上一个台阶。
- **现代化关注点**：现代色彩空间 `oklch()` / `oklab()` / `lab()` / `lch()` 与 `color()`（Baseline 2023 广泛可用）、颜色混合 `color-mix()`（Baseline 2023）、相对颜色语法 `rgb(from …)` / `oklch(from …)`（Baseline 2024 新近可用，按渐进增强用）、`light-dark()` 函数（按明暗一行给两色）、渐变的插值色彩空间 `in oklch` / `longer hue`（解决「渐变发灰」）、`conic-gradient()`（Baseline 2020）、`background-clip: text`（文字裁切渐变）。

## 本叶地图

- [入门](./getting-started) —— 一段「现代且自洽」的配色 + 背景 + 阴影样板，把本叶各页串成主线
- [颜色表示法与色彩空间](./guide-line/color-spaces) —— `hex` / `rgb()` / `hsl()` / `hwb()` 与现代 `oklch()` / `oklab()` / `lab()` / `color()`，核 Baseline
- [`color-mix()` 与颜色函数](./guide-line/color-mix-functions) —— `color-mix()` 混色、相对颜色语法、`light-dark()` / `currentColor`，核 Baseline
- [背景全谱](./guide-line/backgrounds) —— `background-*` 八大属性、多层背景、`background-clip` 与简写
- [边框与圆角](./guide-line/borders-radius) —— `border` 三件套、`border-radius` 圆角与药丸、`border-image` 九宫格
- [box-shadow 与阴影设计](./guide-line/box-shadow) —— 五个值、内阴影、多层叠加，以及「分层阴影」质感配方
- [渐变全谱](./guide-line/gradients) —— `linear` / `radial` / `conic` 三类 + 重复渐变 + 现代插值色彩空间
- [参考](./reference) —— 速查表 + 颜色语法表 + 渐变表 + 标准 / Baseline / 调试工具链接

## 文档地址

- [web.dev: Learn CSS — Color](https://web.dev/learn/css/color)
- [web.dev: Learn CSS — Gradients](https://web.dev/learn/css/gradients) · [Backgrounds](https://web.dev/learn/css/backgrounds)
- [MDN: `<color>` 数据类型](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value) · [`color-mix()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix)
- [MDN: `box-shadow`](https://developer.mozilla.org/en-US/docs/Web/CSS/box-shadow) · [`background`](https://developer.mozilla.org/en-US/docs/Web/CSS/background) · [`border-radius`](https://developer.mozilla.org/en-US/docs/Web/CSS/border-radius)

## 幻灯片地址

<a href="/SlideStack/css-color-background-slide/" target="_blank">CSS 颜色与背景</a>
