---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- **三选一**：状态变化补间 → `transition`；自主多帧 → `@keyframes` + `animation`；移动 / 缩放 / 旋转 → `transform`
- 高性能铁律：**只动 `transform` / `opacity`**（走合成层）；避开 `width` / `top` / `margin`（触发重排）
- `transition: <property> <duration> <timing-function> <delay>`；别用 `all`；缺时长 = 无动画
- `animation: <name> <duration> <timing> <delay> <count> <direction> <fill-mode> <play-state>`；缺时长 = 不播；`forwards` 防闪回
- 缓动：`ease`（默认）/ `linear` / `ease-in` / `ease-out` / `ease-in-out` / `cubic-bezier()` / `linear()`（弹簧，2023）/ `steps()`（逐帧）
- 变换：函数从**右往左**叠；独立属性 `translate`/`rotate`/`scale`（Baseline 2022）可分别过渡；`transform-origin` 改基点
- 3D 三件套：父 `perspective` + `transform-style: preserve-3d` + `backface-visibility: hidden`
- 视觉：`filter`（自身）/ `backdrop-filter`（背后毛玻璃）/ `mix-blend-mode`（混合）/ `clip-path`（硬裁）/ `mask`（羽化遮罩）
- 进场：`@starting-style` + `transition-behavior: allow-discrete`（过渡 `display`，Baseline 2024）
- 现代：同文档 View Transitions（Baseline 2025）；跨文档 + 滚动驱动动画（**非 Baseline**，`@supports` 降级）
- 无障碍红线：`@media (prefers-reduced-motion: reduce)` 关 / 减弱所有装饰动画

## `transition` 速查

| 属性 | 取值 | 说明 |
| --- | --- | --- |
| `transition-property` | 属性名（逗号分隔）/ `all` / `none` | 列具体属性，**别用 `all`** |
| `transition-duration` | `<time>`（`300ms` / `0.3s`） | 默认 `0s`，不写则无动画 |
| `transition-timing-function` | 见缓动表 | 默认 `ease` |
| `transition-delay` | `<time>`（可负） | 负值从中途开始 |
| `transition-behavior` | `normal` / `allow-discrete` | 让 `display` 等离散属性可过渡（2024） |

> 简写两个时间值：**先 duration 后 delay**。基态上的 `transition` 同时管进场与离场。

## `animation` 速查

| 属性 | 取值 | 说明 |
| --- | --- | --- |
| `animation-name` | `@keyframes` 名 | 区分大小写 |
| `animation-duration` | `<time>` | 默认 `0s` = 不播放 |
| `animation-timing-function` | 见缓动表 | 作用于**每段关键帧之间** |
| `animation-delay` | `<time>`（可负） | — |
| `animation-iteration-count` | `<number>` / `infinite` | 默认 `1`，不能为负 |
| `animation-direction` | `normal` / `reverse` / `alternate` / `alternate-reverse` | `alternate` = 往返 |
| `animation-fill-mode` | `none` / `forwards` / `backwards` / `both` | 一次性动画常用 `forwards` 防闪回 |
| `animation-play-state` | `running` / `paused` | 暂停冻结当前帧 |
| `animation-composition` | `replace`（默认）/ `add` / `accumulate` | 多动画叠加同一属性时的合成 |

## 缓动函数速查

| 写法 | 手感 / 用途 |
| --- | --- |
| `ease`（默认） | 先快后慢，通用 |
| `linear` | 匀速；旋转 loading / 进度条 / 滚动驱动 |
| `ease-in` | 缓起加速；元素**离场** |
| `ease-out` | 快起缓停；元素**进场** |
| `ease-in-out` | 两端缓；对称往返 |
| `cubic-bezier(x1,y1,x2,y2)` | 自定义；`y` 超 `[0,1]` 造过冲回弹 |
| `linear(0, 0.5 50%, 1, …)` | 多点折线，逼近弹簧 / 反弹（Baseline 2023） |
| `steps(n, end\|start)` | 切成 n 段离散跳变；雪碧图 / 打字机 |

## `transform` 函数速查

| 类别 | 函数 | 单位 |
| --- | --- | --- |
| 平移 | `translate(x,y)` / `translateX` / `translateY` / `translateZ` / `translate3d` | `<length>` / `%`（Z 仅长度） |
| 缩放 | `scale(x,y)` / `scaleX` / `scaleY` / `scaleZ` / `scale3d` | 无单位数（`1`=100%） |
| 旋转 | `rotate` / `rotateX` / `rotateY` / `rotateZ` / `rotate3d(x,y,z,a)` | `deg` / `rad` / `grad` / `turn` |
| 倾斜 | `skew(x,y)` / `skewX` / `skewY` | `<angle>`（无 3D、无独立属性） |
| 矩阵 | `matrix(6 参)` / `matrix3d(16 参)` | 底层，少手写 |
| 透视 | `perspective(<length>)` | 也可作属性写在父级 |

> 多函数**从右往左**应用。独立属性顺序固定 `translate → rotate → scale`。

## 3D 相关属性速查

| 属性 | 取值 | 作用 |
| --- | --- | --- |
| `perspective` | `<length>` / `none` | 景深；越小越夸张；写在**父级** |
| `perspective-origin` | `<x> <y>` | 灭点位置，默认中心 |
| `transform-style` | `flat`（默认）/ `preserve-3d` | 子元素是否保留 3D |
| `backface-visibility` | `visible`（默认）/ `hidden` | 背朝时是否可见（翻牌用 `hidden`） |
| `transform-origin` | `<x> <y> <z>?` | 变换基点，默认 `50% 50%` |

## 视觉效果速查

| 属性 | 作用 | 关键值 / 函数 |
| --- | --- | --- |
| `filter` | 处理元素自身像素 | `blur` / `brightness` / `contrast` / `grayscale` / `sepia` / `saturate` / `hue-rotate` / `invert` / `opacity` / `drop-shadow` |
| `backdrop-filter` | 处理元素**背后**像素（毛玻璃） | 同上；需元素半透明 + `-webkit-` 兜底 |
| `mix-blend-mode` | 与下层内容混合 | `multiply` / `screen` / `overlay` / `difference` / `darken` / `lighten`… |
| `background-blend-mode` | 同元素多背景层之间混合 | 同上 |
| `clip-path` | 硬边裁形（可动画，顶点数须一致） | `circle()` / `ellipse()` / `inset()` / `polygon()` / `path()` |
| `mask` | 用亮度 / alpha 羽化遮罩 | `mask-image`（图 / 渐变）+ `mask-size` / `-repeat` / `-position` |

## View Transitions 速查

| 项 | 内容 |
| --- | --- |
| 同文档触发 | `document.startViewTransition(updateDOM)` → `ready` / `finished` / `updateCallbackDone` |
| 参与命名 | CSS `view-transition-name: 唯一名`（同名新旧元素形变补间） |
| 伪元素树 | `::view-transition` → `-group()` → `-image-pair()` → `-old()` / `-new()` |
| 跨文档 | `@view-transition { navigation: auto; }`（**仅同源**）+ `pageswap` / `pagereveal` 事件 |
| 降级 | 检测 `document.startViewTransition`；`@view-transition` 不支持即被忽略 |

## 滚动驱动动画速查

| 项 | 内容 |
| --- | --- |
| 接线 | `animation-timeline: scroll()` / `view()` / `--命名时间线`（动画不写 `duration`） |
| `scroll(axis scroller)` | `axis`: `block`/`inline`/`x`/`y`；`scroller`: `nearest`/`root`/`self` |
| `view(axis inset)` | 元素进出视口的进度 |
| 命名时间线 | `scroll-timeline-name` / `view-timeline-name` 定义，`animation-timeline: --名` 引用；跨级用 `timeline-scope` |
| `animation-range` | 命名区段 `cover` / `contain` / `entry` / `exit` / `entry-crossing` / `exit-crossing` |
| 降级 | `@supports (animation-timeline: view())`；默认态保持可见 |

## 现代特性 Baseline 状态（2026-06 核）

| 特性 | 状态 | 用法建议 |
| --- | --- | --- |
| `transition` / `@keyframes` / `animation` | ✅ Baseline 广泛可用 | 放心用 |
| `transform`（2D/3D 函数） | ✅ Baseline 广泛可用 | 放心用 |
| 独立属性 `translate`/`rotate`/`scale` | ✅ Baseline 广泛可用（2022-08） | 放心用，可分别过渡 |
| `linear()` 缓动 | ✅ Baseline 可用（2023） | 弹簧 / 回弹首选 |
| `filter` / `mix-blend-mode` / `clip-path` / `mask` | ✅ 广泛可用（`mask` 旧版需 `-webkit-`） | 可用，带前缀兜底 |
| `backdrop-filter` | 🟡 Baseline 新近可用（2024，Safari 早期需前缀） | `@supports` + `-webkit-` 兜底，性能克制 |
| `@starting-style` / `transition-behavior: allow-discrete` | 🟡 Baseline 新近可用（2024） | 进场 / `display` 过渡；老环境降级为瞬时 |
| 同文档 View Transitions（`startViewTransition`） | 🟡 **Baseline 新近可用（2025-10）** | 渐进增强，老环境落到无动画切换 |
| 跨文档 View Transitions（`@view-transition`） | 🟠 **Limited / 非 Baseline**（Chromium 系） | 纯渐进增强，规则不支持即被忽略 |
| 滚动驱动动画（`animation-timeline`） | 🟠 **Limited / 非 Baseline**（Chromium 全支持；Firefox 部分；Safari 缺） | 纯渐进增强，`@supports` 兜底、默认态可见 |
| `prefers-reduced-motion` | ✅ Baseline 广泛可用 | 必须响应（无障碍红线） |

## 权威链接

**标准 / 规范**

- [CSS Transitions Level 1](https://drafts.csswg.org/css-transitions/) · [CSS Animations Level 1](https://drafts.csswg.org/css-animations/)
- [CSS Transforms Module Level 1 / 2](https://drafts.csswg.org/css-transforms-2/) · [Filter Effects Level 1](https://drafts.fxtf.org/filter-effects/)
- [CSS View Transitions Module Level 1 / 2](https://drafts.csswg.org/css-view-transitions-2/) · [Scroll-driven Animations](https://drafts.csswg.org/scroll-animations-1/)

**参考 / 文档**

- [MDN: Using CSS transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_transitions/Using_CSS_transitions) · [Using CSS animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations/Using_CSS_animations)
- [MDN: Using CSS transforms](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_transforms/Using_CSS_transforms) · [`filter`](https://developer.mozilla.org/en-US/docs/Web/CSS/filter) · [`clip-path`](https://developer.mozilla.org/en-US/docs/Web/CSS/clip-path)
- [MDN: View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) · [CSS scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations)
- [MDN: `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) · [`will-change`](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)

**课程 / 指南**

- [web.dev: Learn CSS — Transitions](https://web.dev/learn/css/transitions) · [Animations](https://web.dev/learn/css/animations)

**兼容性 / 工具**

- [Baseline 浏览器兼容查询：webstatus.dev](https://webstatus.dev/) · [caniuse.com](https://caniuse.com/)
- [cubic-bezier.com（缓动曲线可视化）](https://cubic-bezier.com/) · [Chrome DevTools 缓动编辑器 / Animations 面板]

## 相关页

- [入门](./getting-started) · [过渡与缓动](./guide-line/transitions) · [关键帧与 animation](./guide-line/keyframes-animation)
- [transform 与合成层](./guide-line/transforms) · [滤镜·混合·裁剪](./guide-line/filters-blend-clip)
- [View Transitions 与滚动驱动动画](./guide-line/view-transitions-scroll) · [动画性能与无障碍](./guide-line/animation-performance)
