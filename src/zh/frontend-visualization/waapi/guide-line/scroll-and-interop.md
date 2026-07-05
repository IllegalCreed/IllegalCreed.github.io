---
layout: doc
outline: [2, 3]
---

# 滚动驱动动画：ScrollTimeline / ViewTimeline / CSS 互操作

> 基于 Web Animations API（2026 浏览器基线）· 核于 2026-07

## 速查

- **`ScrollTimeline` 构造选项**：`source`（哪个滚动容器驱动进度）、`axis`（`"block"` 纵向 | `"inline"` 横向）；没有 `duration` 概念，进度完全由滚动位置的 0%~100% 决定。
- **`ViewTimeline` 构造选项**：`subject`（被追踪可见性的元素）、`axis`、`inset`（起止偏移，收紧/放宽"可见"判定区间）；进度语义是"**0% = 刚进入可视区域，100% = 完全离开**"。
- **两者共同点**：都继承自 `AnimationTimeline`，共享只读的 `currentTime`/`duration` 属性，用法是把 `timeline` 传给 `animate()` 的 `options`，替代时间驱动。
- **CSS 两种写法**：
  - 具名：`scroll-timeline-name` + `animation-timeline: --name`（滚动容器与目标元素分开声明）。
  - 匿名（滚动）：`animation-timeline: scroll(nearest inline)`，不用具名直接在目标元素上声明。
  - 匿名（可见性）：`animation-timeline: view()`，同样不用具名声明。
- **`axis` 取值**：`block`（纵向）/`inline`（横向），`ScrollTimeline`/`ViewTimeline` 两者共用同一套取值。
- **`inset` 用途**：收紧或放宽 `ViewTimeline` 的"可见"判定区间，用来微调入场/出场动画相对视口边缘的触发时机。
- **`animation-timeline` 是 reset-only 值**（CSS 端最隐蔽的坑）：`animation` 简写会把 `animation-timeline` **重置为 `auto`**，必须把 `animation-timeline` 声明在 `animation` 简写**之后**才生效。
- **`duration` 随手填 `1ms`**：历史上 Firefox 要求 `animation-duration` 非零才生效（并非 bug，而是用非零时长作为"滚动驱动动画已激活"的信号），同时给不支持的浏览器一个"看起来没动画"的优雅降级效果。
- **无障碍兜底必配**：`@media (prefers-reduced-motion: reduce) { animation-timeline: none; }`，滚动驱动动画不能忽视这条红线。
- **2026-07 浏览器现状**（MDN 活页实时标注，**非 Baseline**）：
  - Chrome / Edge：自 2024 年 12 月起可放心使用。
  - Firefox：历史上需 Nightly 开 flag，且要求 `animation-duration` 非零才生效。
  - Safari：原生尚未支持，需 [flackr/scroll-timeline](https://github.com/flackr/scroll-timeline) polyfill 兜底。
- **生产降级建议**：`@supports not (animation-timeline: scroll())` 做特性检测 + 静态兜底样式，不能假设全量可用。
- **降级不是可选项**：核心交互功能（不只是装饰性渐显）一旦用了滚动驱动动画又没做 `@supports` 检测，Safari 用户会看到功能缺失，而不只是少个动画效果。
- **`prefers-reduced-motion` 不是锦上添花**：滚动视差、大幅缩放这类效果对前庭功能障碍用户是可及性问题，兜底样式是滚动驱动动画的必选项，不是可选项。
- **性能优势**：滚动驱动动画运行在**合成器线程**，天然不产生主线程 `scroll` 事件监听 / `IntersectionObserver` 开销，是相对 JS 手写滚动动画的核心性能优势。
- **与 `IntersectionObserver` 的关系**：`ViewTimeline` 达到的"元素可见性驱动动画"效果，语义上类似 `IntersectionObserver` + rAF 手写方案，但运行在合成器线程、无需 JS 逐帧介入。
- **现状结论的信源**：核心依据是调研当天直接 WebFetch MDN 活页的实时兼容性标注，并与 Smashing Magazine（2024-12）、LogRocket 等文章交叉验证，时间线一致、无矛盾。
- **CSS 动画的本质**：`@keyframes` + `animation` 写的动画，浏览器底层同样生成一个 `Animation` 对象（`effect` 是 `KeyframeEffect`，`timeline` 是 `document.timeline`）——CSS 动画不是与 WAAPI 平行的另一套引擎，而是 WAAPI 的一种"声明式外壳"。
- **互操作边界**：CSS 动画对象可以被 `getAnimations()` 拿到并用 WAAPI 方法操控（改速率、暂停、监听完成），但**不能**脱离 `commitStyles()`/`persist()` 之外的方式改它的关键帧内容——关键帧定义权仍在 CSS `@keyframes` 里，`setKeyframes()` 对 CSS 来源的 effect 通常不生效。
- **反方向的事实**：纯 JS 用 `Element.animate()` 创建的动画不会出现在浏览器 DevTools 的"CSS animation"分类面板里，但同样会出现在 `getAnimations()` 结果中。
- **选型建议**：
  - 轻量诉求（进度条、渐显）→ 优先原生 CSS `scroll()`/`view()`（2026 仍需兜底 Safari）。
  - 复杂滚动交互（pin 固定、精细 scrub 控制、跨浏览器一致性要求高）→ GSAP ScrollTrigger 仍更成熟稳妥。

## 一、ScrollTimeline：滚动位置驱动动画

```js
const timeline = new ScrollTimeline({
  source: document.documentElement, // 哪个滚动容器驱动进度
  axis: "block", // "block"（纵向）| "inline"（横向）
});
box.animate({ rotate: ["0deg", "720deg"] }, { timeline }); // 用 timeline 替代 duration/时间驱动
```

`ScrollTimeline` 没有 `duration` 概念——动画进度完全由 `source` 元素的滚动位置在 0%~100% 之间的比例决定，而不是流逝的时间。`axis` 决定读取哪个方向的滚动量：`"block"` 对应通常意义上的纵向滚动，`"inline"` 对应横向。

## 二、ViewTimeline：元素可见性驱动动画

```js
const timeline = new ViewTimeline({
  subject: document.querySelector(".subject"), // 被追踪可见性的元素
  axis: "block",
  inset: [CSS.px(200), CSS.px(300)], // 起止偏移，收紧/放宽"可见"判定区间
});
subject.animate(
  { opacity: [0, 1], transform: ["scaleX(0)", "scaleX(1)"] },
  { fill: "both", timeline },
);
```

`subject` 元素从"刚进入可视区域（0%）"到"完全离开（100%）"映射为动画进度，`inset` 可以收紧或放宽"可见"的判定区间——典型用于"元素滚入视口时渐显 + 缩放"的入场效果。

## 三、CSS 等价写法：animation-timeline / scroll() / view()

不写 JS，纯 CSS 也能声明滚动/可见性驱动的时间轴：

```css
/* 具名滚动时间轴 */
.scroller {
  scroll-timeline-name: --rotate;
  scroll-timeline-axis: block;
}
.item {
  animation: spin 1ms linear;
  animation-timeline: --rotate;
}

/* 匿名写法 */
.item2 {
  animation: spin 1ms linear;
  animation-timeline: scroll(nearest inline);
}
.item3 {
  animation: reveal 1ms linear;
  animation-timeline: view();
}
```

两个隐蔽坑必须知道：

- **`animation-timeline` 是 `animation` 简写的 reset-only 值**——写了 `animation: xxx` 简写会把 `animation-timeline` 重置为 `auto`，必须把 `animation-timeline` **声明在 `animation` 简写之后**才生效，示例代码里两条声明的顺序不能颠倒。
- **`duration` 通常随手填 `1ms`**——历史上 Firefox 要求非零时长才生效，同时给不支持滚动驱动动画的浏览器一个"看起来没动画"的优雅降级，而不是报错或卡死在某一帧。

必须搭配无障碍兜底：

```css
@media (prefers-reduced-motion: reduce) {
  .item,
  .item2,
  .item3 {
    animation-timeline: none;
  }
}
```

## 四、2026 浏览器现状与降级策略

截至 2026-07，直接 WebFetch MDN 活页仍标注滚动驱动动画（`ScrollTimeline`/`ViewTimeline` + CSS `animation-timeline`/`scroll()`/`view()`）为"Limited availability，非 Baseline"：

| 引擎 | 现状 |
| --- | --- |
| Chrome / Edge | 自 2024 年 12 月起可放心使用 |
| Firefox | 历史上需 Nightly 开 flag，且要求 `animation-duration` 非零才生效（否则仅作降级兜底，不触发动画） |
| Safari | 原生尚未支持，需 [flackr/scroll-timeline](https://github.com/flackr/scroll-timeline) polyfill 兜底 |

这一现状经 WebSearch 与 Smashing Magazine（2024-12）、LogRocket 等文章交叉验证，时间线一致、无矛盾。生产环境用滚动驱动动画做核心交互，必须做特性检测：

```css
@supports not (animation-timeline: scroll()) {
  /* 不支持时的静态兜底样式，比如直接显示终态而不做渐显动画 */
  .item3 {
    opacity: 1;
  }
}
```

不能假设全量可用——这是与核心 WAAPI（`Element.animate()` 等，2020 年起就是 Baseline）最大的现状差异。

## 五、性能优势：合成器线程 vs 主线程

滚动驱动动画运行在**合成器线程**，天然不产生主线程 `scroll` 事件监听或 `IntersectionObserver` 开销——这是它相对"用 JS 手写监听 `scroll` 事件、每次回调里重算样式"这类传统方案的核心性能优势。传统 JS 方案即使做了节流，也难免在主线程产生额外计算；滚动驱动动画把进度计算完全交给渲染引擎，滚动本身也通常发生在合成器线程，两者天然契合、不掉帧。

## 六、与 CSS 动画的互操作边界

CSS `@keyframes` + `animation` 属性写的动画，浏览器底层同样生成一个 `Animation` 对象（`effect` 是 `KeyframeEffect`，`timeline` 是 `document.timeline`）——**CSS 动画不是与 WAAPI 平行的另一套引擎，而是 WAAPI 的一种"声明式外壳"**。这解释了 [Timeline 与合成](./timeline-and-composite) 里 `getAnimations()` 能抓到纯 CSS 动画的原理。

但互操作是有边界的：CSS 动画对象可以被 `getAnimations()` 拿到并用 WAAPI 的方法操控（改速率、暂停、监听完成），但**不能**脱离 `commitStyles()`/`persist()` 之外的方式改它的关键帧内容——关键帧定义权仍在 CSS `@keyframes` 里，`setKeyframes()` 对 CSS 来源的 effect 通常不生效。反过来，纯 JS 用 `Element.animate()` 创建的动画不会出现在浏览器 DevTools 的"CSS animation"分类面板里，但同样会出现在 `getAnimations()` 结果中——两个方向的"看得见"和"改得动"并不对称，实践中容易想当然地假设二者完全等价。

至此 WAAPI 的核心概念地图全部走完：`Element.animate()` 与关键帧 → `Animation` 播放控制 → `KeyframeEffect`/合成模式/Timeline 家族 → 滚动驱动与互操作。完整的 API 速查表、易错点清单与选型对比，见[参考页](../reference)。
