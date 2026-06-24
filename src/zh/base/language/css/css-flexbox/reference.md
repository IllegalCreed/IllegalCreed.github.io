---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 开启：容器 `display: flex` / `inline-flex`；直接子元素自动成弹性项目
- 轴：主轴由 `flex-direction` 决定，交叉轴垂直于主轴；「主轴用 `justify-*`、交叉轴用 `align-*`」
- 项目默认 `flex: 0 1 auto`（不伸、可缩、按内容 / `width` 起算）；容器默认 `row` + `nowrap` + `align-items: stretch`
- 四个关键字：`flex: initial`=`0 1 auto`、`flex: auto`=`1 1 auto`、`flex: none`=`0 0 auto`、`flex: 1`=`1 1 0`
- 主轴分布：`justify-content` —— `flex-start`（默认）/ `center` / `space-between` / `space-around` / `space-evenly`
- 交叉轴对齐：`align-items`（默认 `stretch`）整组、`align-self` 单项、`align-content` 多行
- `align-content` 仅多行有效（`flex-wrap: wrap` 才生效）；间距统一用 `gap`
- 居中：`justify-content: center` + `align-items: center`
- 三大避坑：子项溢出 → `min-width: 0`；不能压扁 → `flex: none`；等高失效 → 别设固定 `height`
- 无障碍红线：`*-reverse` / `order` 只改视觉、不改 DOM，慎用且必测键盘

## 容器属性速查（写在父元素上）

| 属性 | 取值 | 默认 | 说明 |
| --- | --- | --- | --- |
| `display` | `flex` / `inline-flex` | — | 开启块级 / 行内弹性容器 |
| `flex-direction` | `row` / `row-reverse` / `column` / `column-reverse` | `row` | 主轴方向 |
| `flex-wrap` | `nowrap` / `wrap` / `wrap-reverse` | `nowrap` | 是否换行 |
| `flex-flow` | `<direction> <wrap>` | `row nowrap` | 上两者的简写 |
| `justify-content` | `flex-start` / `flex-end` / `center` / `space-between` / `space-around` / `space-evenly` / `start` / `end` | `normal`（≈`flex-start`） | 主轴上的分布 |
| `align-items` | `stretch` / `flex-start` / `flex-end` / `center` / `baseline` | `stretch` | 交叉轴整组对齐 |
| `align-content` | `stretch` / `flex-start` / `flex-end` / `center` / `space-between` / `space-around` / `space-evenly` | `normal`（≈`stretch`） | **多行**时行间分布（单行无效） |
| `gap` | `<length>` / `<行> <列>` | `0` | 项目间距（行 + 列简写） |
| `row-gap` / `column-gap` | `<length>` | `0` | 单独设行 / 列间距 |
| `place-content` | `<align-content> <justify-content>` | — | `align-content` + `justify-content` 简写 |

## 项目属性速查（写在子元素上）

| 属性 | 取值 | 默认 | 说明 |
| --- | --- | --- | --- |
| `flex-grow` | `<number>`（≥0） | `0` | 剩余空间的抢占比例 |
| `flex-shrink` | `<number>`（≥0） | `1` | 空间不足时的收缩比例 |
| `flex-basis` | `auto` / `content` / `<length>` / `<percentage>` / `0` | `auto` | 伸缩前的起始尺寸 |
| `flex` | `<grow> <shrink> <basis>` / 关键字 | `0 1 auto` | 上三者简写（推荐用它） |
| `align-self` | `auto` / `stretch` / `flex-start` / `flex-end` / `center` / `baseline` | `auto` | 覆盖容器 `align-items` |
| `order` | `<integer>`（可负） | `0` | 视觉排序（不改 DOM 顺序） |

## `flex` 简写展开速查

| 写法 | 展开为 | 含义 |
| --- | --- | --- |
| `flex: initial` | `0 1 auto` | 默认：不伸、可缩、按内容 / `width` 起算 |
| `flex: auto` | `1 1 auto` | 可伸可缩，从内容尺寸起算（内容多占得多） |
| `flex: none` | `0 0 auto` | 完全锁死，不伸不缩 |
| `flex: 1` | `1 1 0` | 从 0 起算并等比抢空间（**等分列**） |
| `flex: <number>` | `<number> 1 0` | 单数字 → grow，basis 归 0 |
| `flex: <length>` | `1 1 <length>` | 单长度 → basis，grow/shrink 取 1 |
| `flex: a b` | `a b 0` | 两数字 → grow / shrink |
| `flex: a 30px` | `a 1 30px` | 数字 + 长度 → grow / basis |

## `justify-content` 三个 space 值对比

| 值 | 两端 | 项目间 | 直观（`|`=容器边） |
| --- | --- | --- | --- |
| `space-between` | 0 | 满 | `|■···■···■|` |
| `space-around` | 半份 | 整份 | `|·■··■··■·|` |
| `space-evenly` | 整份 | 整份 | `|·■·■·■·|` |

## 实战配方速查

```css
/* N 等分列 */
.col { flex: 1; }

/* 固定侧栏 + 自适应主区 */
.aside { flex: 0 0 240px; }
.main  { flex: 1; min-width: 0; }

/* 完美居中 */
.center { display: flex; justify-content: center; align-items: center; }

/* 粘性页脚（整页骨架） */
body { min-height: 100vh; display: flex; flex-direction: column; }
main { flex: 1; }

/* 响应式卡片墙（自适应列数，无需媒体查询） */
.cards { display: flex; flex-wrap: wrap; gap: 16px; }
.cards > .card { flex: 1 1 240px; }

/* 导航栏：左群 + 右单 */
.nav { display: flex; align-items: center; gap: 20px; }
.nav .login { margin-left: auto; }

/* 媒体对象：左图右文 */
.media { display: flex; gap: 12px; align-items: flex-start; }
.media img  { flex: none; }
.media .body { flex: 1; min-width: 0; }

/* 绝不被压扁的元素 */
.icon { flex: none; } /* = 0 0 auto */
```

## 三大避坑速查

| 现象 | 根因 | 解法 |
| --- | --- | --- |
| 子项里的长文本 / URL 把容器顶破溢出 | 弹性项目默认不缩小于自身 `min-content` | 给该项 `min-width: 0`（纵向 `min-height: 0`） |
| 图标 / 头像被压扁变形 | 默认 `flex-shrink: 1` 允许收缩 | 给它 `flex: none`（`0 0 auto`） |
| 卡片明明没设高度却不等高 | 项目设了固定 `height`，覆盖了 `stretch` | 去掉固定高度，靠默认 `align-items: stretch` |
| `align-content` 写了没反应 | 容器是单行（`nowrap`） | 改 `flex-wrap: wrap`；单行对齐用 `align-items` |
| `justify-content` 居中无效 | 主轴无剩余空间（项目撑满或 `flex-grow` 抢光） | 确认有空隙；或检查主轴方向是否如预期 |
| `flex: 1` 和 `flex: auto` 表现不一样 | 前者 basis=0（严格等分），后者 basis=auto（按内容） | 等分用 `flex: 1`，按内容用 `flex: auto` |

## 权威链接

**标准 / 规范**

- [W3C: CSS Flexible Box Layout Module Level 1](https://www.w3.org/TR/css-flexbox-1/)
- [MDN: CSS Flexible Box Layout（模块首页）](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout)
- [MDN: `flex`](https://developer.mozilla.org/en-US/docs/Web/CSS/flex) · [`justify-content`](https://developer.mozilla.org/en-US/docs/Web/CSS/justify-content) · [`align-items`](https://developer.mozilla.org/en-US/docs/Web/CSS/align-items) · [`align-content`](https://developer.mozilla.org/en-US/docs/Web/CSS/align-content)

**课程 / 指南**

- [web.dev: Learn CSS — Flexbox](https://web.dev/learn/css/flexbox)
- [MDN: Basic concepts of flexbox](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Basic_concepts_of_flexbox)
- [MDN: Aligning items in a flex container](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Aligning_items_in_a_flex_container)
- [MDN: Controlling ratios of flex items along the main axis](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Controlling_ratios_of_flex_items_along_the_main_axis)

**兼容性 / 调试**

- [Baseline 浏览器兼容查询：webstatus.dev](https://webstatus.dev/) · [caniuse.com](https://caniuse.com/)
- 浏览器 DevTools 的 Flexbox 检查器（Chrome / Firefox 均内置「flex」徽标与覆盖层，可可视化主轴 / 交叉轴）

## 相关页

- [入门](./getting-started) · [Flex 容器与轴向模型](./guide-line/flex-container-axes) · [主轴对齐与分布](./guide-line/main-axis-alignment)
- [交叉轴对齐](./guide-line/cross-axis-alignment) · [flex 三值与计算](./guide-line/flex-grow-shrink-basis)
- [换行、排序与间距](./guide-line/wrap-order-gap) · [Flexbox 实战模式](./guide-line/flexbox-patterns)
