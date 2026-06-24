---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 媒体查询：`@media (width >= 600px)`（range 语法）；操作符 `and` / `,`(or) / `not` / `only`
- 用户偏好：`prefers-color-scheme` / `prefers-reduced-motion` / `prefers-contrast` / `prefers-reduced-data`
- 容器查询：父 `container-type: inline-size` → 子 `@container (width >= 30em)`；简写 `container: 名 / 类型`
- 容器单位：`cqi` / `cqw` / `cqb` / `cqh` / `cqmin` / `cqmax`；style 查询 `@container style(--k: v)`
- 特性查询：`@supports (prop: val)` / `not (…)` / `selector(:has(a))`；JS 用 `CSS.supports()`
- 逻辑属性：`margin-inline` / `padding-block` / `inset-inline-start` / `inline-size` / `text-align: start`
- 多列：`columns: 18rem`、`column-gap`、`column-rule`、`column-span: all`、`break-inside: avoid`
- 选单位：断点优先 `em` / `rem`；行长用 `max-inline-size: 60ch`
- Baseline：媒体 range 语法 / 容器 size 查询均 2023 广泛可用；style 查询较新按渐进增强

## 媒体查询速查

### range 语法 vs 传统写法

| range 语法 | 传统等价 |
| --- | --- |
| `(width >= 900px)` | `(min-width: 900px)` |
| `(width <= 500px)` | `(max-width: 500px)` |
| `(400px <= width <= 700px)` | `(min-width: 400px) and (max-width: 700px)` |

### 逻辑操作符

| 操作符 | 含义 |
| --- | --- |
| `and` | 多条件同时满足 |
| `,` / `or` | 满足任一 |
| `not` | 对整条查询取反 |
| `only` | 屏蔽不识别新语法的老浏览器（须带媒体类型） |

### 常用媒体特征

| 特征 | 取值 / 说明 |
| --- | --- |
| `width` / `height` | 视口尺寸（含滚动条），配 range 语法 |
| `aspect-ratio` | 视口宽高比，如 `16/9` |
| `orientation` | `portrait` / `landscape` |
| `resolution` | 像素密度，如 `2dppx`（高密度屏） |
| `hover` | `hover` / `none`——主输入能否悬停 |
| `pointer` | `fine`（鼠标）/ `coarse`（手指）/ `none` |
| `any-hover` / `any-pointer` | 同上，但判断「任一」输入 |
| `prefers-color-scheme` | `light` / `dark` |
| `prefers-reduced-motion` | `reduce` / `no-preference` |
| `prefers-contrast` | `more` / `less` / `custom` / `no-preference` |
| `prefers-reduced-data` | `reduce`（省流量偏好） |

## 容器查询速查

| 项 | 写法 / 说明 |
| --- | --- |
| 声明容器 | `container-type: inline-size`（常用）/ `size`（双轴）/ `normal` |
| 命名 | `container-name: card` |
| 简写 | `container: card / inline-size` |
| 查询 | `@container card (width >= 30em) { … }` |
| 查询条件 | `width` / `height` / `inline-size` / `block-size` / `aspect-ratio` / `orientation` |
| style 查询 | `@container style(--theme: dark)`、`style(--n >= 3)`、`not style(…)` |

### 容器查询长度单位

| 单位 | 含义 |
| --- | --- |
| `cqw` / `cqh` | 容器宽 / 高的 1% |
| `cqi` / `cqb` | 容器 inline-size / block-size 的 1% |
| `cqmin` / `cqmax` | `cqi`、`cqb` 中较小 / 较大者 |

::: warning 容器查询两个坑
- `container-type: inline-size` **不能**查 `aspect-ratio`（需 `size`，但 `size` 要求容器有确定高度）。
- 容器**自身**的样式不会被它自己的 `@container` 规则影响——查询只作用于**后代**。
:::

## `@supports` 速查

| 形式 | 写法 |
| --- | --- |
| 属性测试 | `@supports (display: grid) { … }` |
| 取反（降级） | `@supports not (aspect-ratio: 1) { … }` |
| 与 / 或 | `@supports (a) and (b)` / `(a) or (b)`（混用须加括号） |
| 选择器测试 | `@supports selector(:has(a)) { … }` |
| 字体技术 / 格式 | `@supports font-tech(color-COLRv1)` / `font-format(woff2)` |
| at-rule 测试 | `@supports at-rule(@scope) { … }` |
| JS 等价 | `CSS.supports("display", "grid")` |

## 逻辑属性映射表

| 物理属性 | 逻辑属性 |
| --- | --- |
| `margin-left` / `margin-right` | `margin-inline-start` / `margin-inline-end` |
| `margin-top` / `margin-bottom` | `margin-block-start` / `margin-block-end` |
| `padding-left` … | `padding-inline` / `padding-block`（及单边版） |
| `border-left` … | `border-inline-start` / `border-block-end`（等） |
| `width` / `height` | `inline-size` / `block-size` |
| `max-width` / `min-height` | `max-inline-size` / `min-block-size` |
| `top` / `right` / `bottom` / `left` | `inset-block-start` / `inset-inline-end` …（或 `inset-block` / `inset-inline`） |
| `text-align: left` / `right` | `text-align: start` / `end` |
| `border-top-left-radius` | `border-start-start-radius`（block 起 + inline 起） |
| `vw` / `vh` | `vi` / `vb` |

书写控制：`writing-mode`（`horizontal-tb` / `vertical-rl` / `vertical-lr`）、`direction`（`ltr` / `rtl`，推荐用 HTML `dir` 属性设置）。

## 多列布局速查

| 属性 | 说明 |
| --- | --- |
| `columns` | 简写：`18rem`（列宽）/ `3`（列数）/ `3 18rem`（列数上限 + 列宽） |
| `column-width` | 列的理想 / 最小宽度，浏览器据此自动定列数 |
| `column-count` | 固定列数；与 `column-width` 同设时作上限 |
| `column-gap` | 列间距 |
| `column-rule` | 列间分隔线（宽 样式 色，不占布局空间） |
| `column-span` | `all`（横跨所有列）/ `none`（默认） |
| `column-fill` | `balance`（默认等高）/ `auto`（顺序填满，末列可短） |
| `break-inside` | `avoid` 防元素被切到相邻两列 |

## 现代特性 Baseline 状态（2026-06 核）

| 特性 | 状态 | 用法建议 |
| --- | --- | --- |
| `@media` 核心 | ✅ Baseline 广泛可用（2015） | 放心用 |
| 媒体查询 range 语法（`width >= …`） | ✅ Baseline 广泛可用（2023） | 放心用，必要时回退 `min-/max-` |
| `prefers-color-scheme` | ✅ Baseline 广泛可用 | 放心用 |
| `prefers-reduced-motion` | ✅ Baseline 广泛可用 | **必须尊重**（无障碍） |
| `prefers-contrast` | 🟡 较新 | 渐进增强，回退默认样式 |
| `prefers-reduced-data` | 🟠 支持仍在铺开 | 纯渐进增强，不影响功能 |
| 容器 size 查询（`container-type` / `@container`） | ✅ Baseline 广泛可用（2023-02） | 放心用 |
| 容器查询长度单位（cq*） | ✅ 随 size 查询广泛可用 | 放心用 |
| 容器 **style 查询**（`@container style()`） | 🟡 较新，支持铺开中 | 渐进增强，备好回退 |
| `@supports` | ✅ Baseline 广泛可用（2015-09） | 放心用 |
| `@supports selector()` | ✅ 已广泛可用 | 放心用 |
| 逻辑属性（`*-inline` / `*-block` / `inset-*`） | ✅ Baseline 广泛可用 | 放心用 |
| 多列布局（`columns` 等） | ✅ 广泛支持 | 放心用 |

## 权威链接

**标准 / 规范**

- [W3C: Media Queries Level 4](https://www.w3.org/TR/mediaqueries-4/)（range 语法）· [Level 5](https://www.w3.org/TR/mediaqueries-5/)（用户偏好）
- [W3C: CSS Containment Module Level 3](https://www.w3.org/TR/css-contain-3/)（容器查询）
- [W3C: CSS Logical Properties and Values Level 1](https://www.w3.org/TR/css-logical-1/)
- [W3C: CSS Multi-column Layout Module](https://www.w3.org/TR/css-multicol-1/)

**课程 / 指南**

- [web.dev: Learn CSS — Container Queries](https://web.dev/learn/css/container-queries) · [Logical Properties](https://web.dev/learn/css/logical-properties)
- [MDN: `@media`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media) · [`@container`](https://developer.mozilla.org/en-US/docs/Web/CSS/@container) · [`@supports`](https://developer.mozilla.org/en-US/docs/Web/CSS/@supports)
- [MDN: Using container size and style queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)
- [MDN: CSS logical properties and values](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values)

**兼容性 / 调试**

- [Baseline 浏览器兼容查询：webstatus.dev](https://webstatus.dev/) · [caniuse.com](https://caniuse.com/)

## 相关页

- [入门](./getting-started) · [媒体查询与 range 语法](./guide-line/media-queries) · [用户偏好查询](./guide-line/user-preferences)
- [容器查询](./guide-line/container-queries) · [`@supports` 特性查询](./guide-line/supports-feature-queries)
- [逻辑属性与书写模式](./guide-line/logical-properties) · [多列布局与响应式综合](./guide-line/multicol-patterns)
