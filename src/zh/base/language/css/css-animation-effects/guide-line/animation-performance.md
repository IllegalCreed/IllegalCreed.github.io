---
layout: doc
outline: [2, 3]
---

# 动画性能与无障碍

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 渲染三阶段：**布局（layout）→ 绘制（paint）→ 合成（composite）**；动画越靠后越便宜
- **只动 `transform` / `opacity`** → 走合成线程，不重排不重绘，能稳 60fps；这是高性能动画第一铁律
- 动 `width` / `height` / `top` / `left` / `margin` → 触发**重排**，每帧重算布局，极易掉帧；改用 `transform: translate()` / `scale()`
- 动 `background` / `color` / `box-shadow` → 触发**重绘**，比重排轻但仍走主线程
- **合成层**：`transform` / `opacity` 动画会把元素提升为独立 GPU 层，由合成线程独立平移 / 调透明度
- `will-change: transform`：**提前**提示浏览器某属性将变，让它预先提层——**别滥用**，长期挂着吃显存
- `will-change` 用法：交互前（如 `:hover` 父级）临时加、动画结束移除；不要写死在大量静态元素上
- `prefers-reduced-motion: reduce`：无障碍**红线**，装饰动画必须可关 / 减弱（前庭敏感用户会眩晕）
- 减弱策略：纯装饰直接 `animation/transition: none`；承载信息的动画保留但去掉位移 / 闪烁
- 别用动画承载唯一信息；保证不支持 / 关动画时内容仍完整可用（默认态可见）

## 动画卡不卡，看你动哪个属性

浏览器把一帧画面的生成分成三个阶段，**动画触发的阶段越靠后，代价越小**：

```
布局 layout  →  绘制 paint  →  合成 composite
（算位置大小）  （填像素）      （把层拼到屏幕）
    最贵           中等            最便宜
```

- 改 `width` / `height` / `top` / `left` / `margin` / `padding` → 几何变了，从 **layout** 重来，可能引发整片元素重排；
- 改 `color` / `background` / `box-shadow` / `border-radius` → 位置没变但外观变了，从 **paint** 重来，要重新填像素；
- 改 `transform` / `opacity` → 可只在 **composite** 阶段处理：元素作为独立层，由 GPU 直接平移 / 缩放 / 调透明度，**既不重排也不重绘**。

这就是那条贯穿全叶的铁律的来历：

> **能用 `transform` / `opacity` 实现的动画，就不要去动 `width` / `top` / `margin`。**

### 把「重排动画」改写成「合成动画」

| 想要的效果 | ❌ 触发重排 | ✅ 走合成层 |
| --- | --- | --- |
| 左右滑动 | `left` / `margin-left` | `transform: translateX()` |
| 放大缩小 | `width` / `height` | `transform: scale()` |
| 淡入淡出 | `visibility` / 改 `display` | `opacity` |
| 从下方升起 | `top` / `margin-top` | `transform: translateY()` |

::: warning `scale` 会拉伸内容，注意场景
`transform: scale()` 是对整个元素（含文字）做几何缩放，过程中文字会被拉伸 / 模糊。若要的是「盒子尺寸平滑变化且文字清晰」，那是另一类需求（可考虑 `clip-path` 或显式动画框架），不能简单用 `scale` 替代——但对图片 / 装饰块的放大，`scale` 是首选。
:::

## 合成层与 `will-change`

### 什么是合成层

当浏览器决定让某元素「能被 GPU 独立处理」时，会把它提升为一个**合成层（compositor layer）**——单独绘制一次、缓存为纹理，之后的平移 / 缩放 / 透明度变化由**合成线程**完成，不打扰运行 JS 的主线程。这正是 `transform` / `opacity` 动画即使主线程繁忙也能流畅的原因。

`transform`、`opacity` 动画、`position: fixed`、`<video>` / `<canvas>` 等通常会自动获得合成层。

### `will-change`：提前提层，但要克制

`will-change` 告诉浏览器「这个属性即将变化，请提前做好准备（包括提升为合成层）」，避免动画**首帧**因临时提层而卡顿：

```css
.card {
  transition: transform 200ms ease;
}
/* 悬停前一刻就准备好，让首帧更顺 */
.card-wrapper:hover .card {
  will-change: transform;
}
```

::: warning will-change 是「双刃剑」，别滥用
- **每个合成层都占显存**。给成百上千个元素无脑写 `will-change: transform`，会吃光内存、反而更卡，甚至拖垮整页；
- **不要写死在静态元素上**。正确姿势是「**用之前临时加、用完移除**」——例如在 `:hover` 父级上加、或用 JS 在动画开始时设、`finished` 后清除；
- 若某动画本就流畅，**根本不需要** `will-change`。它是「卡了再针对性优化」的工具，不是默认配置。
:::

### 老技巧 `translateZ(0)` / `translate3d(0,0,0)`

历史上常用 `transform: translateZ(0)`「强制提层」。在现代浏览器里 `will-change` 是更语义化、可被浏览器智能管理的方式，新代码优先用 `will-change`，但理解老代码里的 `translateZ(0)` 是同一意图即可。

## 无障碍：`prefers-reduced-motion` 是红线

部分用户对动态效果敏感——前庭功能障碍、晕动症、注意力障碍者，大幅运动可能引发**眩晕、恶心、不适**。操作系统提供「减少动态效果」开关，CSS 用 `prefers-reduced-motion` 媒体查询读取它。**响应它不是可选项，是无障碍底线。**

### 两种写法

**方案 A：默认开动画，命中偏好时关掉**（最常见）：

```css
.card {
  transition: transform 200ms ease;
}
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
}
```

**方案 B：默认无动画，仅在用户「不介意」时才加**（更保守、对敏感用户更友好）：

```css
@media (prefers-reduced-motion: no-preference) {
  .card {
    transition: transform 200ms ease;
  }
}
```

### 「减弱」而非一律「删除」

不是所有动画都该粗暴关掉，要分清动画**承不承载信息**：

- **纯装饰**（漂浮、脉冲、视差、华丽转场）→ 直接 `none`，去掉即可；
- **承载状态 / 反馈**（loading 指示、展开折叠、表单校验提示）→ **保留但减弱**：去掉大幅位移 / 旋转 / 闪烁，换成近乎瞬时的淡化或静态状态，既不眩晕又不丢信息。

一个「全站兜底」写法是把时长压到极短，保留状态切换、几乎无可感运动：

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

> 这是社区常见的保守兜底，但**不能替代**针对关键交互的精细处理——能逐个减弱就别只靠它一刀切。

### 别让动画成为唯一信息载体

- 不要只用「闪烁 / 抖动」表达错误——同时给文字 / 图标；
- 关掉动画后，所有内容仍须可见、可达、可操作（呼应上一页：滚动驱动动画的默认态必须可见）；
- 避免持续大面积闪烁（每秒闪 3 次以上可能诱发光敏性癫痫，是 WCAG 明确红线）。

## 一份「高性能 + 无障碍」自检清单

落地任何动画前，对照这几条：

1. 动的是 `transform` / `opacity` 吗？若在动 `width` / `top` / `margin`，能否改写？
2. 有没有滥用 `will-change`？是否「临时加、用完清」？
3. 循环动画用了 `linear` 吗（避免每段 `ease` 的顿挫）？一次性入场加了 `forwards` 防闪回吗？
4. 是否响应了 `prefers-reduced-motion`？装饰的关、信息的减弱？
5. 关掉动画后，内容是否仍完整可用、信息不丢？
6. 现代特性（View Transitions 跨文档、滚动驱动动画）是否做了 `@supports` / 特性检测降级？

## 小结

动画性能的核心只有一句：**把动画收敛到走合成层的 `transform` / `opacity`**，避开触发重排的 `width` / `top` / `margin`；`will-change` 用来给关键动画临时提层，但绝不能滥用。无障碍上，`prefers-reduced-motion` 是红线——装饰动画该关、信息动画该减弱，且任何时候内容都要保持完整可用。至此本叶的「怎么动、怎么补间、怎么不卡、怎么降级」全部讲完，速查与链接见 [参考](../reference)。
