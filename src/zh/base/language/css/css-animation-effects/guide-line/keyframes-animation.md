---
layout: doc
outline: [2, 3]
---

# 关键帧与 animation

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- `@keyframes 名 { from {…} to {…} }` 或用百分比 `0% / 50% / 100% {…}` 定义多帧；名区分大小写
- 应用：`animation: <name> <duration> <timing-function> <delay> <iteration-count> <direction> <fill-mode> <play-state>`
- 八个长写：`animation-name` / `-duration` / `-timing-function` / `-delay` / `-iteration-count` / `-direction` / `-fill-mode` / `-play-state`
- `animation-iteration-count`：数字或 `infinite`（无限循环）；默认 `1`；不能为负
- `animation-direction`：`normal`（正放）/ `reverse`（倒放）/ `alternate`（往返）/ `alternate-reverse`（倒着往返）
- `animation-fill-mode`：`none`（默认，动画外不留样式）/ `forwards`（停在末帧）/ `backwards`（延迟期用首帧）/ `both`（两头都留）
- `animation-play-state`：`running`（默认）/ `paused`（暂停，常配 `:hover` 或 JS 用）
- 缓动同 `transition`：`ease` / `linear` / `cubic-bezier()` / `linear()` / `steps(n)`，作用于**每段关键帧之间**
- `animation-composition`：`replace`（默认）/ `add` / `accumulate`——多动画作用同一属性时的合成方式
- 简写里**两个时间值**第一个是 `duration`、第二个是 `delay`；缺省时长 = `0s` = 不播放
- 无障碍：`@media (prefers-reduced-motion: reduce)` 里把 `animation` 关掉或设极短

## animation 与 transition 的分工

上一页的 `transition` 只能在状态改变时「A → B」补一次。`animation` 则**脱离触发、自主播放**，可定义任意多帧、循环、往返、暂停——代价是要先用 `@keyframes` 写一段「剧本」。

```css
/* 1. 写剧本：定义动画各时刻的样子 */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 2. 应用：元素一出现就播放 */
.card {
  animation: fade-in-up 400ms ease-out;
}
```

元素挂上 `animation` 后**立即开播**，无需任何触发。

## `@keyframes`：定义动画剧本

`@keyframes` 后跟一个自定义名字，花括号里用关键帧描述各时间点的样式。

### `from` / `to` 与百分比

只有起止两帧时用 `from`（= `0%`）和 `to`（= `100%`）：

```css
@keyframes grow {
  from {
    scale: 1;
  }
  to {
    scale: 1.5;
  }
}
```

需要中间帧时用百分比，可任意多个：

```css
@keyframes pulse {
  0% {
    opacity: 1;
    scale: 1;
  }
  50% {
    opacity: 0.4;
    scale: 1.4; /* 中途放大并变淡 */
  }
  100% {
    opacity: 1;
    scale: 1; /* 回到起点，循环时无缝衔接 */
  }
}
```

要点：

- 名字**区分大小写**，且不能用 CSS 关键字（如 `none`）；
- 同一百分比可写多次、合并多个属性；
- 未在某帧出现的属性，浏览器在相邻帧之间自动插值；
- 想让循环无缝，让 `100%` 与 `0%` 状态一致（如上例）。

## 八个子属性逐一拆解

`animation` 简写背后是八个长写属性：

```css
.box {
  animation-name: pulse; /* 用哪个 @keyframes */
  animation-duration: 2s; /* 一轮多久（默认 0s = 不播放） */
  animation-timing-function: ease-in-out; /* 每段之间的缓动 */
  animation-delay: 0.5s; /* 延迟多久才开始 */
  animation-iteration-count: infinite; /* 循环几次，infinite 无限 */
  animation-direction: alternate; /* 播放方向 */
  animation-fill-mode: both; /* 动画外如何留样式 */
  animation-play-state: running; /* 播放 / 暂停 */
}
```

### `animation-duration` 与 `animation-delay`

时长不能为负、默认 `0s`——**不写时长动画就不播放**，这是最常见的「我加了 animation 怎么没动」原因。延迟可为负，负值表示「从动画中途开始」（跳过前一段）。

### `animation-timing-function`：缓动作用在「每段之间」

与 `transition` 同款（`ease` / `linear` / `cubic-bezier()` / `linear()` / `steps()`），但要注意：它作用于**相邻关键帧之间的每一段**，而非整条动画。需要整体匀速（如 loading）必须用 `linear`，否则每两帧之间都会 `ease` 一下、显得一顿一顿。

`steps()` 在关键帧动画里尤其常用于雪碧图逐帧：

```css
@keyframes walk {
  to {
    background-position: -800px 0; /* 横移过一整条精灵图 */
  }
}
.character {
  animation: walk 1s steps(8) infinite; /* 分 8 帧逐格跳 */
}
```

### `animation-iteration-count`：循环次数

数字（可带小数，如 `2.5` 表示播两轮半）或 `infinite`：

```css
.spinner {
  animation: spin 1s linear infinite; /* 永远转 */
}
```

### `animation-direction`：播放方向

| 值 | 行为 |
| --- | --- |
| `normal`（默认） | 每轮都 `0% → 100%` 正放 |
| `reverse` | 每轮都 `100% → 0%` 倒放 |
| `alternate` | 奇数轮正放、偶数轮倒放（来回往返） |
| `alternate-reverse` | 奇数轮倒放、偶数轮正放 |

`alternate` 配 `infinite` 是「呼吸 / 心跳」类往返动画的标配——无需在 `@keyframes` 里手写返程帧。

### `animation-fill-mode`：动画外留不留样式

动画只在「播放期间」改变样式，播放前 / 后默认回到元素原本的 CSS。`fill-mode` 决定两端如何「冻结」关键帧的值：

| 值 | 延迟期间（开播前） | 结束之后 |
| --- | --- | --- |
| `none`（默认） | 用元素自身样式 | 用元素自身样式 |
| `forwards` | 用元素自身样式 | **停在末帧**（`100%`） |
| `backwards` | **提前用首帧**（`0%`） | 用元素自身样式 |
| `both` | 提前用首帧 | 停在末帧 |

最常见的需求是「播完别跳回去」——用 `forwards`：

```css
.toast {
  animation: fade-in-up 400ms ease-out forwards; /* 淡入后停在终态 */
}
```

::: warning 没有 `forwards` 会「闪回」
一次性入场动画若不设 `animation-fill-mode: forwards`，播放结束瞬间元素会**跳回原始样式**（比如又变透明），看起来像闪了一下。一次性入 / 出场动画几乎都要带 `forwards` 或 `both`。
:::

### `animation-play-state`：暂停与继续

`running`（默认）/ `paused`。可用于「悬停暂停轮播」：

```css
.marquee {
  animation: scroll 10s linear infinite;
}
.marquee:hover {
  animation-play-state: paused; /* 悬停时停住 */
}
```

暂停只是**冻结**当前帧，恢复 `running` 会从冻结处继续，不重头来。

## 简写顺序与多动画

简写里属性顺序较宽松，但**两个时间值**必须按「先时长、后延迟」出现：

```css
/* name duration timing-function delay iteration-count direction fill-mode play-state */
.box {
  animation: pulse 2s ease-in-out 0.5s infinite alternate both;
}
```

一个元素可同时挂多个动画，逗号分隔、各自独立：

```css
.hero {
  animation:
    fade-in 600ms ease-out forwards,
    float 3s ease-in-out infinite; /* 入场 + 持续漂浮，互不干扰 */
}
```

## `animation-composition`：多动画叠加同一属性

当多个动画（或动画与基础值）作用于**同一个属性**时，`animation-composition` 决定如何合并：

- `replace`（默认）：后者覆盖前者；
- `add`：把效果**叠加**（如两个 `translate` 相加）；
- `accumulate`：累积合并（语义介于二者之间）。

它在需要把「基础位移」和「动画位移」叠起来时有用，属进阶能力，日常多用默认 `replace` 即可。

## 无障碍：可关、可减弱

```css
@media (prefers-reduced-motion: reduce) {
  .spinner,
  .pulse,
  .toast {
    animation: none; /* 关掉装饰性动画 */
  }
}
```

注意：纯装饰（脉冲 / 漂浮）应直接 `none`；而像 loading 这种**承载状态信息**的动画，可保留但减弱（例如换成不闪烁的静态指示）。详见 [动画性能与无障碍](./animation-performance)。

## 小结

`@keyframes` 写剧本、`animation` 八属性导演：`duration` 必给否则不播，`iteration-count: infinite` 循环，`alternate` 往返，`forwards` 防闪回，`play-state` 可暂停，缓动作用在每段之间（循环动画记得用 `linear`）。动画里改的几何属性，最好都通过 `transform`——下一页讲它为什么不触发重排、还能上合成层：[transform 与合成层](./transforms)。
