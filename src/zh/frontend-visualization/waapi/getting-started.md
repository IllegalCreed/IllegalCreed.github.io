---
layout: doc
outline: [2, 3]
---

# 入门：定位与 Element.animate 第一个动画

> 基于 Web Animations API（2026 浏览器基线）· 核于 2026-07

## 速查

- **定位**：WAAPI 是浏览器原生的 **JavaScript 动画编程接口**——`element.animate(keyframes, options)` 一行代码创建动画，返回一个可编程控制的 `Animation` 对象。
- **关键认知**：CSS `@keyframes` + `animation` 动画在浏览器底层同样由这套引擎驱动——WAAPI 不是与 CSS 动画平行的另一套系统，而是其原生实现层/超集。
- **规范状态**：Web Animations Level 1 是 W3C Working Draft（CSSWG 维护），长期未转正式 Recommendation，但浏览器已按草案把核心部分落地为事实标准，不影响生产使用。
- **历史包袱**：曾有官方 polyfill `web-animations-js`，现代浏览器已不需要。
- **三层对象关系**（MDN 官方 DVD 播放器类比）：
  - `Timeline`：时间轴，提供只读的 `currentTime`/`duration`。
  - `Animation`：播放器，负责 `play`/`pause`/`reverse`/`currentTime`/`playbackRate`。
  - `AnimationEffect`/`KeyframeEffect`：光盘，只是数据（关键帧 + timing），可被多个 `Animation` 复用。
- **心智定位**：介于「声明式 CSS 动画」与「手写 `requestAnimationFrame`」之间——比 CSS 动画更可编程，比 rAF 更省心（浏览器负责插值计算，通常能跑在合成器线程）。
- **等价三步写法**：`Element.animate()` 只是语法糖，本质等价于 `new KeyframeEffect()` + `new Animation()` + `.play()` 三步，完整代码见[下一页](./guide-line/animate-and-keyframes)。
- **两个参数**：`animate(keyframes, options)`——`keyframes` 是数组或 object；`options` 可以是数字（=`duration` 毫秒）或配置对象。
- **返回值**：一个 `Animation` 对象，创建后立刻可 `.pause()`/`.play()` 等操控。
- **最简关键帧**：`[{ opacity: 0 }, { opacity: 1 }]`；只写一帧时浏览器自动补当前计算样式作为隐式起始帧。
- **EffectTiming 选项预览**（详见[下一页](./guide-line/animate-and-keyframes)）：`duration`/`easing`/`iterations`/`iterationStart`/`direction`/`fill`/`delay`/`endDelay`/`composite`，共 9 项。
- **单位是毫秒**：`duration: 2000` 表示 2 秒；CSS `animation-duration` 单位是秒，两者不通用，是最常见的笔误来源。
- **默认缓动是 `"linear"`**：CSS 动画默认 `"ease"`，直接迁移代码若不显式设置 `easing`，视觉效果会不一样。
- **`iterations: Infinity`** 实现无限循环——用 JS 关键字，不是字符串，对应 CSS 的 `animation-iteration-count: infinite`。
- **`fill` 默认值是 `"none"`**：动画结束后元素会瞬间弹回初始样式，很多初学者误以为动画会停在最后一帧——全场最高频坑，详见[下一页](./guide-line/animate-and-keyframes)。
- **一个隐藏能力预告**：`document.getAnimations()` 能"反向"拿到并操控页面上所有动画（含纯 CSS 写的），是 WAAPI 与 CSS 动画同源的直接证据，详见 [Timeline 与合成](./guide-line/timeline-and-composite)。
- **Baseline 现状**：核心 API（`Element.animate()`/`Animation`/`KeyframeEffect`/`DocumentTimeline`/`getAnimations()`）自 2020 年起已是 Baseline 广泛可用，生产可直接用，无需 polyfill。
- **一个元素可挂多个动画效果**：各自独立的 `Animation` 实例，互不覆盖，除非作用同一属性触发 `composite` 合成。
- **与 rAF 的性能关系**：rAF 手写动画在主线程逐帧计算，只改 `transform`/`opacity` 也能合成但更容易失手写成布局属性；WAAPI 与 CSS 动画同源，性能通常一致。
- **与 GSAP 的关系**：GSAP 底层通常也走 WAAPI/CSS，效率接近原生，但提供了 WAAPI 没有的时间轴编排能力（`timeline()`/`stagger`/`labels`）。
- **选型口径**：
  - 简单循环、不需要 JS 干预 → **CSS 动画**最省事。
  - 需要播放控制/和交互强绑定（暂停、变速、拖拽进度）→ **WAAPI**。
  - 需要逐帧自定义算法（弹性物理、跟手拖拽）→ **rAF 手写**。
  - 需要专业级时间轴编排（stagger、复杂依赖）→ **GSAP**。
- **进阶顺序**：本页 → [Element.animate 与关键帧](./guide-line/animate-and-keyframes) → [Animation 播放控制](./guide-line/animation-control) → [Timeline 与合成](./guide-line/timeline-and-composite) → [滚动驱动与互操作](./guide-line/scroll-and-interop)。

## 一、定位：WAAPI 是什么，与 CSS / rAF / GSAP 的关系

**一句话**：Web Animations API（WAAPI）是浏览器原生的 JavaScript 动画编程接口——`element.animate(keyframes, options)` 一行代码创建动画并拿到一个可编程控制的 `Animation` 对象。**关键认知**：CSS `@keyframes`/`animation` 动画在浏览器底层同样是这套引擎驱动的，WAAPI 不是与 CSS 动画平行的另一套系统，而是其原生实现层/超集——CSS-Tricks 的评价很精准："它们不应被视为竞争对手"。

规范用两个模型解释 WAAPI 的一切行为：

- **时序模型（Timing Model）**：每个文档有一条主时间轴 `document.timeline`，从页面加载开始持续到窗口关闭，`currentTime` 就是"页面已经打开多久"（毫秒）。每个动画通过自己的 `startTime` 锚定在这条时间轴上的某一点。
- **动画模型（Animation Model）**：把动画看成沿 duration 排列的一串"快照"——任意时刻 t 都能算出一个确定的样式快照，这也是为什么 WAAPI 能"跳到任意进度"而不需要真的从头播一遍（区别于逐帧累积状态的命令式动画）。

四种技术的选型口径（完整 7 维度对比表见[参考页](./reference)）：

| 方案 | 何时选 |
| --- | --- |
| CSS 动画（`@keyframes` + `animation`） | 纯展示、不需要 JS 干预的简单循环/重复动画 |
| WAAPI（`Element.animate()`） | 需要 JS 层面播放控制（暂停/倒放/变速/进度条 scrubbing）但不想引第三方库 |
| `requestAnimationFrame` 手写 | 需要逐帧算法自定义（弹性物理、跟手拖拽、Canvas/WebGL 同步） |
| GSAP（第三方库） | 需要专业级时间轴编排（大量元素 stagger、复杂依赖时序、ScrollTrigger 等成熟插件） |

## 二、Element.animate()：一行创建动画

```js
// 语法：element.animate(keyframes, options)
const anim = document.querySelector(".box").animate(
  [
    { transform: "translateX(0)", opacity: 1 }, // 起始帧
    { transform: "translateX(300px)", opacity: 0 }, // 结束帧
  ],
  {
    duration: 2000, // 毫秒，不是秒！
    easing: "ease-in-out",
    iterations: Infinity, // 无限循环
    direction: "alternate", // 奇数次正向、偶数次反向
    fill: "forwards", // 结束后保持终态（默认 none 会回弹，见下一页）
  },
);
// 返回值：一个 Animation 对象，立刻可控
anim.pause();
```

几个第一次接触就该知道的细节：

- `options` 也可以直接传数字，表示 `duration`（毫秒）：`el.animate(keyframes, 2000)`。
- 关键帧数组只写一帧时，浏览器自动补上"当前计算样式"作为隐式起始帧：`el.animate([{ transform: "rotate(360deg)" }], 2000)`。
- 一个元素上可同时挂多个动画效果（各自独立的 `Animation` 实例，互不覆盖，除非作用同一属性触发 `composite` 合成，见 [Timeline 与合成](./guide-line/timeline-and-composite)）。
- 等价的手工三步写法（`Element.animate()` 只是这三步的语法糖）：

```js
const effect = new KeyframeEffect(el, keyframes, options);
const animation = new Animation(effect, document.timeline);
animation.play();
```

## 三、关键帧与选项：先睹为快

`animate()` 的关键帧参数其实有**数组**和 **object** 两种等价写法，选项对象也不止示例里的 5 个字段——完整的 `EffectTiming` 共 9 项配置（`duration`/`easing`/`iterations`/`iterationStart`/`direction`/`fill`/`delay`/`endDelay`/`composite`），其中 `fill` 是全场最高频的坑：默认值 `"none"` 会让动画结束后瞬间弹回原始样式，很多人误以为动画会"停在最后一帧"。这些细节展开篇幅较大，放到下一页 [Element.animate 与关键帧](./guide-line/animate-and-keyframes) 逐一讲清楚，讲完关键帧与选项后，再依次进入 [Animation 播放控制](./guide-line/animation-control)、[Timeline 与合成](./guide-line/timeline-and-composite)、[滚动驱动与互操作](./guide-line/scroll-and-interop)。
