---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 颜色写法：关键字 / `#rrggbbaa` / `rgb(r g b / a)` / `hsl(h s% l% / a)` / `hwb()` / 现代 `oklch()` / `oklab()` / `lab()` / `color()`
- 现代色彩空间 Baseline **2023**：`oklch()`（做设计系统首选，亮度感知均匀）、`color(display-p3 …)`（广色域）
- 混色 / 派生：`color-mix(in oklch, a, b)`（Baseline 2023）、相对颜色 `oklch(from c l c h / a)`（Baseline 2024）、`light-dark()`（2024）
- 背景：`background-color` / `image` / `repeat` / `position` / `size` / `attachment` / `origin` / `clip`；简写 `/` 分隔位与尺寸，多层逗号叠（先写在上）
- 边框：`border: 宽 样式 色`（**漏样式则不显示**）、`border-radius`（`50%` 圆 / `9999px` 药丸）、`border-image`（九宫格，需 style 非 none）
- 阴影：`box-shadow: x y 模糊 扩展 色`，`inset` 内阴影，多层逗号叠（先写在上），不占布局
- 渐变：`linear` / `radial` / `conic` + `repeating-*`；加 `in oklch` 防发灰，`longer hue` 控绕行
- 红线：渐变不能给 `background-color`；`border-image` 不吃 `border-radius`；`background` 简写会重置未列子属性

## 颜色语法速查

| 写法 | 示例 | 说明 |
| --- | --- | --- |
| 关键字 | `tomato` / `rebeccapurple` | 共 148 个 + `transparent` / `currentColor` |
| 十六进制 | `#b71540` / `#00000080` | 3/4/6/8 位，末位是 alpha |
| `rgb()` | `rgb(183 21 64 / 80%)` | 通道 `0–255` 或 `%`；逗号语法仍兼容 |
| `hsl()` | `hsl(344 79% 40% / .8)` | 色相 `0–360`、饱和 + 亮度 `%` |
| `hwb()` | `hwb(12 50% 0%)` | 色相 + 白度 + 黑度 |
| `oklch()` | `oklch(70% 0.15 30)` | L`0–1`、C`0–0.4`、H 角；**首选** |
| `oklab()` | `oklab(59% 0.1 0.1)` | L + a/b 直角坐标 |
| `lab()` / `lch()` | `lab(50% 40 59.5)` | CIE Lab（色相角定义不同） |
| `color()` | `color(display-p3 .9 .2 .4)` | 跨色彩空间，通道 `0–1`，广色域 |
| `color-mix()` | `color-mix(in oklch, a 30%, b)` | 按比例混两色 |
| 相对颜色 | `oklch(from c l c h / 50%)` | `from` 拆通道再重组 |
| `light-dark()` | `light-dark(white, #0d1117)` | 按 `color-scheme` 二选一 |

## `background-*` 速查

| 属性 | 取值要点 |
| --- | --- |
| `background-color` | 纯色；初始 `transparent` |
| `background-image` | `url()` / 渐变 / `image-set()`；逗号叠多层 |
| `background-repeat` | `repeat`(默认) / `no-repeat` / `repeat-x` / `repeat-y` / `space` / `round` |
| `background-position` | 关键字 / 长度 / `%`；可带边偏移 `bottom 20% right 30%` |
| `background-size` | `auto` / `cover` / `contain` / 具体值 |
| `background-attachment` | `scroll`(默认) / `fixed` / `local` |
| `background-origin` | `padding-box`(默认) / `border-box` / `content-box` |
| `background-clip` | `border-box`(默认) / `padding-box` / `content-box` / `text` |
| `background`（简写） | 位与尺寸间用 `/`；多层逗号；颜色只能在末层 |
| `background-blend-mode` | 多层背景之间的混合模式 |

## 边框 / 圆角速查

| 属性 | 要点 |
| --- | --- |
| `border` | `宽 样式 色`；样式默认 `none`，**漏写则边框消失** |
| `border-style` | `solid` / `dashed` / `dotted` / `double` / `groove` / `ridge` / `inset` / `outset` / `none` |
| `border-radius` | 1–4 值（顺时针左上起）；`/` 分隔水平 / 垂直半径做椭圆角 |
| 圆 / 药丸 | `50%`（正方形→圆）/ `9999px`（药丸） |
| `border-image` | `source / slice / width / outset repeat`；需 `border-style` 非 none |
| `border-image-repeat` | `stretch`(默认) / `repeat` / `round` / `space`；`fill` 保留中心 |

## `box-shadow` 速查

```text
box-shadow: <offset-x> <offset-y> <blur>? <spread>? <color>? <inset>?
```

- 两值 `x y`；三值加模糊（不可负）；四值加扩展（可负）
- `inset` 内阴影（裁到 padding-box）；颜色省略取 `color`
- 多层逗号叠，**先写在上**；零偏移零模糊 = 实心描边环
- 分层（近实 + 远柔）质感最佳；不占布局；自动跟 `border-radius`
- 不规则 / 透明图形投影改用 `filter: drop-shadow()`

## 渐变速查

| 函数 | 关键参数 | 用途 |
| --- | --- | --- |
| `linear-gradient()` | 方向（`角度` / `to right`）+ 色标 | 直线过渡、条纹 |
| `radial-gradient()` | 形状 + 尺寸（`farthest-corner` 默认）+ `at 位置` | 聚光、球体高光、径向遮罩 |
| `conic-gradient()` | `from 角` + `at 位` + 角度色标 | 饼图、色轮 |
| `repeating-*-gradient()` | 同上 | 条纹、棋盘、扇形等周期纹理 |
| 插值空间 | `in oklch` / `in lab` …，极坐标加 `longer/shorter/increasing/decreasing hue` | 防中段发灰、控色相绕行 |

## 现代特性 Baseline 状态（2026-06 核）

| 特性 | 状态 | 用法建议 |
| --- | --- | --- |
| `rgb()`/`hsl()` 空格语法、`#rrggbbaa` | ✅ Baseline 广泛可用 | 放心用 |
| `oklch()` / `oklab()` / `lab()` / `lch()` / `color()` | ✅ Baseline 2023 广泛可用 | 放心用，设计系统首选 `oklch()` |
| `color-mix()` | ✅ Baseline 2023 广泛可用 | 放心用 |
| `conic-gradient()` / 渐变 `in <space>` | ✅ Baseline 广泛可用（2020 起） | 放心用 |
| `background-clip: text` | ✅ 广泛支持 | 保留 `-webkit-` 前缀更稳 |
| `box-shadow` / `border-radius` / `border-image` | ✅ Baseline 广泛可用（2015 起） | 放心用 |
| `light-dark()` | 🟡 Baseline 2024 新近可用 | 渐进增强；配 `color-scheme` |
| 相对颜色语法 `rgb(from …)` | 🟡 Baseline 2024 新近可用 | 渐进增强；关键场景配 `@supports` 回退 |

> Baseline「广泛可用」= 跨核心浏览器互通满 30 个月；「新近可用」= 已跨核心浏览器互通但未满 30 个月，生产中建议作渐进增强。

## 权威链接

**标准 / 规范**

- [CSS Color Module Level 4](https://www.w3.org/TR/css-color-4/) · [Level 5（相对颜色 / `color-mix()`）](https://www.w3.org/TR/css-color-5/)
- [CSS Backgrounds and Borders Module Level 3](https://www.w3.org/TR/css-backgrounds-3/) · [CSS Images Module Level 3/4（渐变）](https://www.w3.org/TR/css-images-3/)
- [MDN: `<color>`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value) · [`color-mix()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix) · [`oklch()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch)
- [MDN: `background`](https://developer.mozilla.org/en-US/docs/Web/CSS/background) · [`box-shadow`](https://developer.mozilla.org/en-US/docs/Web/CSS/box-shadow) · [`border-radius`](https://developer.mozilla.org/en-US/docs/Web/CSS/border-radius) · [`border-image`](https://developer.mozilla.org/en-US/docs/Web/CSS/border-image)

**课程 / 指南**

- [web.dev: Learn CSS — Color](https://web.dev/learn/css/color) · [Gradients](https://web.dev/learn/css/gradients) · [Backgrounds](https://web.dev/learn/css/backgrounds)
- [MDN: 使用相对颜色](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_colors/Relative_colors) · [应用颜色的多种方式](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_colors/Applying_color)

**工具 / 兼容性**

- [Baseline 浏览器兼容查询：webstatus.dev](https://webstatus.dev/) · [caniuse.com](https://caniuse.com/)
- [oklch.com 颜色拾取器](https://oklch.com/) · [Open Props（oklch 设计令牌参考）](https://open-props.style/)

## 相关页

- [入门](./getting-started) · [颜色表示法与色彩空间](./guide-line/color-spaces) · [`color-mix()` 与颜色函数](./guide-line/color-mix-functions)
- [背景全谱](./guide-line/backgrounds) · [边框与圆角](./guide-line/borders-radius) · [box-shadow 与阴影设计](./guide-line/box-shadow) · [渐变全谱](./guide-line/gradients)
