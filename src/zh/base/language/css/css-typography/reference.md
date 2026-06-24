---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 字体栈永远带通用族兜底：`font-family: "Inter", system-ui, sans-serif;`（逐字符回退）
- `@font-face` 只发 WOFF2；可变字体用范围声明 `font-weight: 100 900`，优先用 `font-weight` 等标准属性而非 `font-variation-settings`
- 加载默认 `font-display: swap`（FOUT），零 CLS 用 `optional`，图标字体才用 `block`（FOIT）；关键字体 `preload` 带 `crossorigin`
- 压 CLS：`size-adjust` + `ascent-override` / `descent-override` / `line-gap-override` 对齐回退字体度量
- `line-height` **无单位数**；`text-align: start/end` 优于物理方向；中文首行缩进 `text-indent: 2em`
- 防溢出首选 `overflow-wrap: break-word`；单行省略号 = `nowrap + overflow:hidden + text-overflow:ellipsis`
- 现代折行：`text-wrap: balance`（标题，Baseline 2024）/ `text-wrap: pretty`（正文，Baseline 新近可用）
- `::marker` 只接受 `color`/`font-*`/`content` 等有限属性；要盒模型效果改 `::before`
- 计数器三步：`counter-reset` → `counter-increment` → `counter()`；多级编号用 `counters(名, ".")`

## 字体属性速查

| 属性 | 作用 | 关键值 |
| --- | --- | --- |
| `font-family` | 字体族优先级列表 | 字体名…，通用族兜底 |
| `font-size` | 字号 | `16px` / `1rem` / `1.25em` / `clamp()` |
| `font-weight` | 字重 | `400`/`700`；可变字体连续值 `100–900` |
| `font-style` | 斜体 | `normal` / `italic` / `oblique <角度>` |
| `font-stretch` / `font-width` | 字宽 | `condensed` / `expanded` / `75%–125%` |
| `font-optical-sizing` | 光学尺寸 | `auto` / `none` |
| `font-variation-settings` | 可变字体轴（底层兜底） | `"wght" 550, "GRAD" 88` |
| `font-feature-settings` | OpenType 特性 | `"liga" 1, "calt" 0` |
| `font-variant-*` | 小型大写/连字/数字样式 | `small-caps` / `tabular-nums` … |
| `font-synthesis` | 禁/允许合成粗斜体 | `none` / `weight style` |
| `font`（简写） | 一行设多项 | `italic 700 16px/1.5 "Inter", sans-serif` |

## 通用字体族与可变字体轴

**通用字体族**：`serif`、`sans-serif`、`monospace`、`cursive`、`fantasy`、`system-ui`、`ui-serif`、`ui-sans-serif`、`ui-monospace`、`ui-rounded`、`math`、`emoji`、`fangsong`。

**可变字体五个注册轴**（小写标签，优先用对应标准属性）：

| 轴 | 标签 | 标准属性 |
| --- | --- | --- |
| 字重 | `wght` | `font-weight` |
| 字宽 | `wdth` | `font-stretch` / `font-width` |
| 斜角 | `slnt` | `font-style: oblique <角度>` |
| 斜体 | `ital` | `font-style: italic` |
| 光学尺寸 | `opsz` | `font-optical-sizing` |

> 自定义轴用**大写**标签（如 `GRAD` / `SOFT`），只能经 `font-variation-settings` 设置。

## `@font-face` 描述符速查

| 描述符 | 作用 |
| --- | --- |
| `font-family` | 自定义字体名（必填） |
| `src` | 文件来源（必填）：`local(...)` / `url(...) format(...) tech(...)` |
| `font-display` | 加载期策略：`auto`/`block`/`swap`/`fallback`/`optional` |
| `font-weight` | 该文件字重；可变字体用范围 `100 900` |
| `font-style` | 该文件样式；可范围 `oblique 0deg 10deg` |
| `font-stretch` | 该文件字宽；可范围 `75% 125%` |
| `unicode-range` | 子集化：本文件只覆盖某段码位 |
| `size-adjust` | 整体缩放系数（对齐 x-height，压 CLS） |
| `ascent-override` / `descent-override` / `line-gap-override` | 覆盖度量（压 CLS） |
| `font-feature-settings` / `font-variation-settings` | 默认开启的 OpenType 特性 / 轴 |

**`font-display` 时间线**：

| 值 | 阻塞期（FOIT） | 交换期（FOUT） |
| --- | --- | --- |
| `block` | 约 3s | 无限 |
| `swap` | 0ms | 无限 |
| `fallback` | 约 100ms | 约 3s |
| `optional` | 约 100ms | 无（不到就这次不换） |

## 文字排版属性速查

| 属性 | 作用 | 关键值 |
| --- | --- | --- |
| `line-height` | 行高 | **无单位** `1.5`（强烈推荐） |
| `letter-spacing` | 字符间距 | `-0.02em` / `0.08em` |
| `word-spacing` | 词间距 | 主要用于西文 |
| `text-align` | 水平对齐 | `start` / `end` / `center` / `justify` |
| `text-indent` | 首行缩进 | `2em`（中文段首） |
| `text-decoration` | 下划线/删除线 | `underline wavy red` + `text-underline-offset` |
| `text-transform` | 大小写（仅显示） | `uppercase` / `capitalize` |

## 折行 / 截断属性速查

| 属性 | 作用 | 关键值 |
| --- | --- | --- |
| `white-space` | 空白 + 折行总开关 | `nowrap` / `pre` / `pre-wrap` / `pre-line` |
| `text-overflow` | 溢出末尾标记 | `ellipsis`（需配 `nowrap`+`overflow:hidden`） |
| `overflow-wrap` | 放不下才断词 | `break-word`（**首选防溢出**） |
| `word-break` | 断行激进度 | `break-all`（任意字符）/ `keep-all`（CJK 不断字） |
| `hyphens` | 自动连字符 | `auto`（需正确 `<html lang>`） |
| `text-wrap` | 折行策略简写 | `balance`（标题）/ `pretty`（正文）/ `nowrap` / `stable` |
| `-webkit-line-clamp` | 多行省略号 | 行数（配 `display:-webkit-box`） |

## 列表 / 计数器属性速查

| 属性 / 函数 | 作用 |
| --- | --- |
| `list-style-type` | 标记符号：`disc`/`decimal`/`cjk-decimal`/字符串/`none` |
| `list-style-position` | `outside`（默认）/ `inside` |
| `list-style-image` | 图片标记（多被 `::marker { content }` 取代） |
| `::marker` | 直接样式化标记（仅 `color`/`font-*`/`content` 等有限属性） |
| `counter-reset` | 建/归零/`reversed()` 计数器 |
| `counter-increment` | 自增/自减计数器 |
| `counter-set` | 更新已存在的计数器 |
| `counter(名, 样式)` | 显示单层计数器 |
| `counters(名, 分隔符)` | 显示整条嵌套链（多级编号） |
| `@counter-style` | 自定义编号系统（`system`/`symbols`/`suffix`） |

## 现代特性 Baseline 状态（2026-06 核）

| 特性 | 状态 | 用法建议 |
| --- | --- | --- |
| 可变字体（`font-variation-settings` / 注册轴） | ✅ Baseline 广泛可用 | 放心用，优先标准属性 |
| `font-display` | ✅ Baseline 广泛可用 | 放心用 |
| `size-adjust` / `ascent-override` 系列 | ✅ Baseline 广泛可用 | 压 CLS 放心用 |
| `::marker`（`color` / `font-*` / `content`） | ✅ Baseline 广泛可用 | 放心用（盒模型属性无效） |
| `@counter-style` | ✅ Baseline 广泛可用 | 放心用 |
| `text-wrap: balance` | ✅ Baseline 2024（新近可用） | 标题用，≤6 行生效，渐进增强 |
| `text-wrap: pretty` | 🟡 Baseline 2024 新近可用（各家实现深浅不一） | 正文用，纯渐进增强 |
| `line-clamp`（无前缀标准） | 🟡 逐步落地 | 暂仍用 `-webkit-line-clamp` 兜底 |
| `text-wrap: avoid-orphans` | 🟠 暂无浏览器实现 | 不要依赖 |

## 权威链接

**标准 / 规范**

- [CSS Fonts Module](https://drafts.csswg.org/css-fonts/) · [CSS Text Module](https://drafts.csswg.org/css-text/) · [CSS Lists and Counters](https://drafts.csswg.org/css-lists/)
- [MDN: `@font-face`](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face) · [`text-wrap`](https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap) · [`::marker`](https://developer.mozilla.org/en-US/docs/Web/CSS/::marker)

**课程 / 指南**

- [web.dev: Learn CSS — Typography](https://web.dev/learn/css/typography)
- [MDN: CSS fonts（模块参考）](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_fonts) · [Variable fonts guide](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_fonts/Variable_fonts_guide)
- [MDN: Using CSS counters](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_counter_styles/Using_CSS_counters)

**兼容性 / 调试**

- [Baseline 浏览器兼容查询：webstatus.dev](https://webstatus.dev/) · [caniuse.com](https://caniuse.com/)
- [Wakamai Fondue（查字体含哪些轴/特性）](https://wakamaifondue.com/) · [Google Fonts](https://fonts.google.com/)

## 相关页

- [入门](./getting-started) · [字体族与 `@font-face`](./guide-line/font-face-variable) · [字体加载与性能](./guide-line/font-loading)
- [行距·字距·对齐与装饰](./guide-line/line-spacing-align) · [截断·折行·断词](./guide-line/text-overflow-wrap)
- [列表样式与 `::marker`](./guide-line/list-marker) · [计数器与生成内容](./guide-line/counters)
