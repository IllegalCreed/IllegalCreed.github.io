---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- **三选一**：状态变化补间用 `transition`；自主多帧播放用 `@keyframes` + `animation`；移动 / 缩放 / 旋转用 `transform`
- `transition: <属性> <时长> <缓动> <延迟>`，例 `transition: transform 300ms ease 0s`——只补**可动画**属性，别用 `all`
- `@keyframes 名 { from{…} to{…} }` 或用百分比 `0%` / `50%` / `100%` 定多帧；`animation: 名 时长 缓动 延迟 次数 方向 填充 播放态`
- **只动两个属性最顺**：`transform` 与 `opacity` 能跑在**合成线程**，不触发重排 / 重绘；动 `width` / `top` / `margin` 会掉帧
- 缓动：`ease`（默认 ease，先快后慢）/ `linear`（匀速）/ `ease-in` / `ease-out` / `cubic-bezier(x1,y1,x2,y2)`（自定义曲线）/ `linear()`（弹簧回弹）/ `steps(n)`（逐帧）
- `transform` 默认绕**中心**，用 `transform-origin` 改基点；多个函数从**右往左**应用
- 独立变换属性 `translate` / `rotate` / `scale` 可分别声明、分别过渡（Baseline 2022）
- 进场动画：`@starting-style` 定「起始值」+ `transition-behavior: allow-discrete` 让 `display` 也能过渡（Baseline 2024）
- 现代视觉：`filter`（模糊 / 灰度…）/ `backdrop-filter`（背景毛玻璃）/ `mix-blend-mode`（混合）/ `clip-path`（裁形）/ `mask`（遮罩）
- **无障碍红线**：所有非必要动画都要在 `@media (prefers-reduced-motion: reduce)` 里关掉或大幅减弱

## 一条主线：从「补一个值」到「整页过渡」

CSS 的动效能力是分层的，越往上越强、也越需要降级。本叶各页就顺着这条主线展开：

1. **一个值变了，平滑过去就行？** → `transition`，最轻量，靠 `:hover` / 加类触发。见 [过渡与缓动](./guide-line/transitions)。
2. **要脱离触发、自己循环播放多帧？** → `@keyframes` + `animation`。见 [关键帧与 animation](./guide-line/keyframes-animation)。
3. **怎么移动 / 缩放 / 旋转又不挤动别人、还能上合成层？** → `transform`。见 [transform 与合成层](./guide-line/transforms)。
4. **要毛玻璃 / 混合 / 裁成异形？** → `filter` / `backdrop-filter` / `mix-blend-mode` / `clip-path` / `mask`。见 [滤镜·混合·裁剪](./guide-line/filters-blend-clip)。
5. **要整页 / 整块的切换过渡，或把动画绑到滚动？** → View Transitions（页面级）+ 滚动驱动动画。见 [View Transitions 与滚动驱动动画](./guide-line/view-transitions-scroll)。
6. **怎么让它顺滑又不晕人？** → 合成层、`will-change`、`prefers-reduced-motion`。见 [动画性能与无障碍](./guide-line/animation-performance)。

## 一眼区分：transition / animation / transform

这三个名字最容易混。一句话各自定位：

| | 是什么 | 怎么启动 | 典型场景 |
| --- | --- | --- | --- |
| `transition` | 属性**从 A 到 B** 的自动补间 | 状态改变触发（`:hover` / 加类 / JS 改值） | 按钮悬停变色、抽屉展开 |
| `animation` | 按 `@keyframes` 自主播放 | 元素一出现就播，可循环 / 暂停 | 加载转圈、脉冲、入场 |
| `transform` | 几何**变换**（位移 / 缩放 / 旋转 / 倾斜） | 它只是「目标样式」，靠上面二者驱动 | 放大、滑入、3D 翻牌 |

关键认知：`transform` 不是「动画」，而是一种**不触发重排**的样式；`transition` / `animation` 才是让它动起来的引擎。三者常组合使用。

## 一段最小可用：悬停放大

最常见的「悬停轻微放大」，就是 `transition` + `transform` 的组合：

```css
.card {
  /* 声明：当 transform 变化时，用 200ms ease 平滑补间 */
  transition: transform 200ms ease;
}

.card:hover {
  /* 状态改变 → 触发上面的过渡 */
  transform: scale(1.05);
}
```

`:hover` 让 `transform` 从 `none` 变成 `scale(1.05)`，浏览器据 `transition` 声明在 200ms 内补完中间帧；移开时自动反向补回。**只声明在基态上的 `transition` 会同时管进场和离场**。

## 一段最小可用：自主循环

不需要触发、一出现就转圈的加载指示器，用 `@keyframes` + `animation`：

```css
@keyframes spin {
  to {
    rotate: 360deg; /* 从默认 0 转到 360 度 */
  }
}

.spinner {
  /* 名 spin · 1 秒 · 匀速 · 无限循环 */
  animation: spin 1s linear infinite;
}
```

`animation` 一旦应用就立即播放，`infinite` 让它永远循环，`linear` 保证匀速（转圈忌用 `ease`，否则一顿一顿）。

::: tip 为什么用 `rotate: 360deg` 而不是 `transform: rotate(360deg)`
`rotate` / `translate` / `scale` 是 2022 年起 Baseline 的**独立变换属性**，可单独声明、单独过渡，写起来更清爽，且不会和别处的 `transform` 互相覆盖。需要组合多种变换或兼容老环境时，仍用 `transform` 简写。详见 [transform 与合成层](./guide-line/transforms)。
:::

## 一条必须记住的红线：尊重「减少动态」

部分用户（前庭功能敏感、易晕动）在系统里开了「减少动态效果」。**所有装饰性动画都必须响应它**：

```css
/* 默认可以动 */
.card {
  transition: transform 200ms ease;
}

/* 用户要求减少动态 → 关掉 / 大幅减弱 */
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
}
```

这不是锦上添花，而是无障碍底线——忽略它可能让用户头晕、恶心。详见 [动画性能与无障碍](./guide-line/animation-performance)。

## 一句话性能心法

动画卡不卡，几乎只取决于你动的是哪个属性：

- **动 `transform` / `opacity`** → 走**合成（compositing）**，不重排不重绘，能跑满 60fps；
- **动 `width` / `height` / `top` / `left` / `margin`** → 触发**重排（layout）**，每帧都重算布局，极易掉帧；
- 想滑动用 `transform: translate()` 而非 `left` / `top`，想淡入用 `opacity` 而非改 `visibility` / `display`。

这条心法贯穿全叶，原理见 [动画性能与无障碍](./guide-line/animation-performance)。

## 下一步

主线已经铺好，挑你最关心的一页深入即可——[过渡与缓动](./guide-line/transitions)、[关键帧与 animation](./guide-line/keyframes-animation)、[transform 与合成层](./guide-line/transforms)、[滤镜·混合·裁剪](./guide-line/filters-blend-clip)、[View Transitions 与滚动驱动动画](./guide-line/view-transitions-scroll)、[动画性能与无障碍](./guide-line/animation-performance)；或直接看 [参考](./reference) 速查表。
