---
layout: doc
outline: [2, 3]
---

# 过渡与缓动

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- `transition` 简写：`transition: <property> <duration> <timing-function> <delay>`，例 `transition: transform 300ms ease 0s`
- 四个长写：`transition-property`（动哪个）/ `transition-duration`（多久）/ `transition-timing-function`（缓动曲线）/ `transition-delay`（延迟）
- `transition-property` 列具体属性、逗号分隔；**别用 `all`**（误触多余补间、伤性能）；时长默认 `0s`（不写就没动画）
- 缓动关键字：`ease`（默认，先快后慢）/ `linear`（匀速）/ `ease-in`（缓起）/ `ease-out`（缓停）/ `ease-in-out`（两端缓）
- `cubic-bezier(x1,y1,x2,y2)`：自定义三次贝塞尔；`y` 可超出 `[0,1]` 造「过冲 / 回弹」
- `linear()`：多点折线缓动，能逼近**弹簧 / 反弹**（Baseline 2023）；`steps(n, end|start)`：逐帧跳变
- 触发器：`:hover` / `:focus` / `:focus-within` / `:target` / `:active` / JS 加类——基态上的 `transition` 同时管进场与离场
- 进 / 出场用不同曲线：把 `transition` 分别写在基态和 `:hover` 态上
- `@starting-style { … }` 定「元素首次出现时的起始值」，配合可做**进场动画**（Baseline 2024）
- `transition-behavior: allow-discrete` 让 `display` / `content-visibility` 等离散属性也能参与过渡（Baseline 2024）
- 只补**可动画属性**（`transform` / `opacity` / 颜色 / 长度 / `filter`…）；`font-family` 等离散属性默认无中间态

## 过渡是什么

`transition` 让一个属性在**值改变**时不再瞬间跳变，而是在指定时长内平滑补间。它本身不主动播放，必须由某个状态改变来触发——最常见的是 `:hover`：

```css
.button {
  background-color: #3b82f6;
  /* 声明：background-color 一旦变化，用 200ms 平滑过渡 */
  transition: background-color 200ms ease;
}

.button:hover {
  background-color: #1d4ed8; /* 触发过渡 */
}
```

关键点：`transition` 写在**基态**（`.button`）上，这样进场（hover 进入）和离场（hover 离开）**都会**走这段过渡。若只写在 `:hover` 上，则只有进入时有动画、离开时瞬间复位。

## 四个子属性

`transition` 是下面四个长写属性的简写：

```css
.box {
  transition-property: transform; /* 动哪个属性 */
  transition-duration: 300ms; /* 持续多久（默认 0s，不写就无动画） */
  transition-timing-function: ease; /* 缓动曲线 */
  transition-delay: 0s; /* 延迟多久才开始 */
}

/* 等价简写：property | duration | timing-function | delay */
.box {
  transition: transform 300ms ease 0s;
}
```

简写里**时长是第一个时间值、延迟是第二个**（顺序固定）：`transition: transform 300ms 100ms` 表示「时长 300ms、延迟 100ms」。

### `transition-property`：动哪个，别用 `all`

可以列多个、逗号分隔，每个都能有自己的时长 / 缓动：

```css
.card {
  transition:
    transform 200ms ease,
    box-shadow 300ms ease-out;
}
```

::: warning 慎用 `transition: all`
`all` 会监听**所有**可动画属性的变化——这意味着任何不经意的属性改变（甚至浏览器默认值）都可能触发补间，既难预期又拖性能。**明确列出你真正想动的属性**是更稳的工程实践。
:::

### 哪些属性能过渡

过渡要求属性有「中间值」可插值：

- **能动**：`transform`、`opacity`、各种颜色（`color` / `background-color` / `border-color`）、长度（`width` / `padding` / `inset`…）、`box-shadow`、`filter`、`font-size` 等；
- **不能动**：`font-family`、`display` 这类**离散（discrete）属性**——它们没有「一半」的概念，默认在过渡中点直接跳变（除非用下文的 `allow-discrete`）。

性能上优先动 `transform` / `opacity`（走合成层），避免动 `width` / `height` / `top`（触发重排），详见 [动画性能与无障碍](./animation-performance)。

## 缓动：让运动「有生命」

缓动函数（timing function）决定运动在时间上的**快慢分布**。匀速（`linear`）往往显得机械，恰当的缓动能让动画更自然。

### 五个关键字

| 关键字 | 手感 | 适合 |
| --- | --- | --- |
| `ease`（默认） | 先快后慢，整体偏「冲一下再稳住」 | 通用，绝大多数场景 |
| `linear` | 全程匀速 | 旋转 loading、进度条 |
| `ease-in` | 缓慢起步、越来越快 | 元素**离场**（加速飞走） |
| `ease-out` | 快速起步、缓缓停下 | 元素**进场**（冲入后稳住） |
| `ease-in-out` | 两端慢、中间快 | 来回 / 往返的对称运动 |

### `cubic-bezier()`：自定义曲线

五个关键字本质都是三次贝塞尔曲线的别名。要精确控制，直接给四个控制点坐标：

```css
.box {
  /* 两个控制点 (x1,y1) (x2,y2)，x 必须在 [0,1] */
  transition-timing-function: cubic-bezier(0.42, 0, 0.58, 1); /* = ease-in-out */
}
```

`x` 代表时间进度（限定 `0~1`），`y` 代表运动进度。**`y` 允许超出 `[0,1]`**——这正是制造「过冲 / 回弹」的秘诀：

```css
/* y 一度超过 1，元素会先冲过头再弹回，产生弹性感 */
.pop {
  transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

> 调曲线别靠脑补，用可视化工具（如 cubic-bezier.com 或 DevTools 的缓动编辑器）拖着看。

### `linear()`：逼近弹簧与反弹（Baseline 2023）

三次贝塞尔只有两个控制点，画不出「弹簧反复振荡」这类复杂曲线。`linear()` 用**一串点**连成折线来逼近任意缓动：

```css
/* 多个进度点，浏览器在点之间线性插值，整体逼近弹跳 */
.bounce {
  transition-timing-function: linear(
    0,
    0.25 25%,
    0.5,
    0.75,
    1 60%,
    0.9,
    1
  );
}
```

`linear()` 让纯 CSS 也能做出过去要靠 JS 物理引擎才能实现的弹簧 / 回弹手感，自 2023 年起 Baseline 广泛可用。点的数值通常由弹簧生成器算好后粘贴。

### `steps()`：逐帧跳变

`steps(n, end|start)` 把过渡切成 `n` 段**离散**跳变，不做连续插值——非常适合精灵图逐帧动画或「打字机」效果：

```css
/* 分 10 步跳完，常配 @keyframes 做雪碧图动画 */
.sprite {
  transition-timing-function: steps(10, end);
}
```

第二参数 `end`（默认）在每段**末尾**跳变，`start` 在**开头**跳变。

## 进场 / 离场用不同曲线、不同时长

很多优秀的交互，进入和离开的手感是**不对称**的——进入快、退出慢（或反之）。把 `transition` 分别写在两个状态上即可：

```css
.panel {
  opacity: 0;
  /* 离场：慢一点、缓起 */
  transition: opacity 400ms ease-in;
}

.panel.is-open {
  opacity: 1;
  /* 进场：快一点、缓停 */
  transition: opacity 150ms ease-out;
}
```

口诀：**进场用 `ease-out`（冲入即停）、离场用 `ease-in`（缓起加速离开）**，最符合直觉。

## 进场动画：`@starting-style`（Baseline 2024）

过渡只在「值发生改变」时触发。但元素**刚插入 DOM** 时没有「旧值」，默认不会有进场动画。`@starting-style` 专门补上这个「起始值」：

```css
.toast {
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 300ms ease,
    transform 300ms ease;
}

/* 定义：元素首次渲染时从这里开始，于是插入即播放进场过渡 */
@starting-style {
  .toast {
    opacity: 0;
    transform: translateY(20px);
  }
}
```

有了它，元素一插入就会从 `@starting-style` 的值过渡到正常值，无需 JS 加类。自 2024 年起 Baseline 可用。

## 过渡 `display`：`allow-discrete`（Baseline 2024）

想让一个元素「淡出后再 `display: none`」一直很麻烦——`display` 是离散属性，一改就立即生效，把淡出动画掐断。`transition-behavior: allow-discrete` 解决了这点：

```css
.dialog {
  opacity: 1;
  /* 让 display 也参与过渡，离场动画播完才真正 none */
  transition:
    opacity 300ms ease,
    display 300ms allow-discrete;
}

.dialog[hidden] {
  opacity: 0;
  display: none;
}
```

加上 `allow-discrete` 后，离散属性会在过渡**结束时刻**跳变（离场）或**开始时刻**跳变（进场），从而把 `display: none` 推迟到淡出动画播完。配合 `@starting-style` 可实现完整的「进场 + 离场」纯 CSS 弹窗。自 2024 年起 Baseline。

## 无障碍：别忘了减弱

任何过渡都应尊重 `prefers-reduced-motion`：

```css
@media (prefers-reduced-motion: reduce) {
  .panel,
  .toast,
  .dialog {
    transition-duration: 0.01ms; /* 近乎瞬时，等于关闭动画但保留状态切换 */
  }
}
```

详见 [动画性能与无障碍](./animation-performance)。

## 小结

`transition` 是最轻量的动效：声明在基态上、靠状态改变触发、只补可动画属性。缓动决定手感——`ease` 系关键字够用，`cubic-bezier()` 精调，`linear()` 做弹簧，`steps()` 做逐帧；`@starting-style` + `allow-discrete` 补齐了进场与 `display` 过渡。但 `transition` 只能「A 到 B」一次，要自主循环、多帧编排，就该上下一页的 [关键帧与 animation](./keyframes-animation)。
