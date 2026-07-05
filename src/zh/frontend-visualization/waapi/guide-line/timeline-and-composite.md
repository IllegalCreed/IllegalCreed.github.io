---
layout: doc
outline: [2, 3]
---

# KeyframeEffect / 合成模式 / Timeline 家族

> 基于 Web Animations API（2026 浏览器基线）· 核于 2026-07

## 速查

- **`KeyframeEffect` 可脱离 target**：构造时 `target` 传 `null`，之后配合多个 `Animation` 实例复用同一份关键帧定义，是动画库里避免重复定义的常见模式。
- **实例属性**：
  - `target`：作用元素，可为 `null`（配合复用）。
  - `pseudoElement`：可作用于 `::before`/`::after` 等伪元素。
  - `composite`：效果级合成方式（`replace`/`add`/`accumulate`）。
  - `iterationComposite`：跨"次迭代"的合成方式（`replace`/`accumulate`）。
- **实例方法**：
  - `getKeyframes()`：拿到规范化后含计算 offset 的关键帧数组。
  - `setKeyframes(kf)`：运行时替换关键帧。
- **继承自 `AnimationEffect` 的方法**：
  - `getTiming()`：读取原始 timing 设置值。
  - `getComputedTiming()`：读取计算后的 timing（如 `activeDuration`）。
  - `updateTiming(options)`：运行时改 timing。
- **`getComputedTiming().activeDuration` vs `getTiming().duration`**：前者是 `duration`/`iterations`/`delay`/`endDelay` 等全部计算叠加后的"总活跃时长"，后者只是原始设置的单次 `duration` 值，两者语义不同，不能混用。
- **`AnimationEffect` 与 `KeyframeEffect` 的关系**：`AnimationEffect` 是效果层的（抽象）基类，`KeyframeEffect` 是目前唯一具体子类。
- **`pseudoElement` 典型用途**：对 `::before`/`::after` 等生成内容做动画时使用，无需在 DOM 里插入额外的真实元素。
- **专家级细节**：`fill: "auto"` 是 `EffectTiming` 规范层面的默认值，但对 `KeyframeEffect` 计算结果等价于 `"none"`——`getTiming().fill` 可能显示 `auto`，`getComputedTiming().fill` 显示计算后的 `none`。
- **典型运行时改写场景**：游戏加成动画临时多播几轮——`updateTiming({ iterations: 4 })`；错误态到成功态的关键帧热替换——`setKeyframes([...])`。
- **`composite` 三模式**：`replace`（覆盖，默认）/`add`（数值相加）/`accumulate`（列表函数合并）——描述**不同动画效果之间**如何合成。
- **`iterationComposite`**：`replace`/`accumulate`——描述**同一个动画的多次迭代之间**是否累积效果，和 `composite` 维度不同、互不替代。
- **多动画同属性合成**：多个动画同时作用同一属性时会按合成顺序与规则叠加计算（如三个 `transform` 动画相加）。
- **`AnimationTimeline` 是基类**：只有两个只读属性——`currentTime`（毫秒，或 `null` 表示未激活）、`duration`；三个具体子类是 `DocumentTimeline`、`ScrollTimeline`、`ViewTimeline`。
- **`DocumentTimeline`**：默认时间轴，`document.timeline` 即其默认实例，`currentTime` = 页面已打开的毫秒数；Baseline 自 2020-07 起。
- **省略 timeline 参数**：`new Animation(effect)` 省略第二参数时，默认值就是 `document.timeline`。
- **timeline 无固定终点场景**：`ScrollTimeline`/`ViewTimeline` 由滚动位置/可见性驱动，没有传统意义上的时长概念，因此 `animate()` 里可以省略 `duration`，改由 `timeline` 完全接管进度（下一页展开）。
- **`getAnimations()`**：`document.getAnimations()` / `element.getAnimations()`（默认含子树后代）拿到当前生效的所有 `Animation`（含 CSS animation、CSS transition、WAAPI 动画）。
- **反向操控关键入口**：哪怕动画是用 `@keyframes` + `animation` 属性写的纯 CSS，也能被 `getAnimations()` 抓出来当 `Animation` 对象操控（暂停、调速、监听 `finished`）。
- **典型用法一**：全局调试面板"暂停页面所有动画"——`document.getAnimations().forEach(a => a.pause())`。
- **典型用法二**：`Promise.all(document.getAnimations().map(a => a.finished))`，等所有出场动画播完再卸载 DOM。
- **局部隔离**：`Element.getAnimations()` 比 `Document.getAnimations()` 更适合做局部性能隔离/调试，因为可以只关注某个子树。
- **Timeline 家族展望**：`ScrollTimeline`/`ViewTimeline` 的滚动/可见性驱动用法、CSS 等价写法与 2026 浏览器现状，在下一页 [滚动驱动与互操作](./scroll-and-interop) 深入。

## 一、KeyframeEffect：可复用的动画效果

`KeyframeEffect` 相当于 DVD 类比里的"光盘"——只是数据（关键帧集合 + duration + easing 等），可以脱离具体 `target` 单独构造，配合多个 `Animation` 实例复用：

```js
// 单独构造，可先不指定 target（传 null），之后复用给多个元素
const effect = new KeyframeEffect(null, [{ opacity: 0 }, { opacity: 1 }], {
  duration: 1000,
  easing: "ease-in-out",
});

const anim1 = new Animation(effect, document.timeline);
anim1.effect.target = document.querySelector("#a");
const anim2 = new Animation(effect, document.timeline);
anim2.effect.target = document.querySelector("#b");
anim1.play();
anim2.play();
```

实例属性除了 `target`，还有 `pseudoElement`（可让动画作用于 `::before`/`::after` 等伪元素）、`composite`（效果级合成方式，见下节）、`iterationComposite`（跨"多次迭代"的合成方式）。实例方法 `getKeyframes()` 拿到规范化后的关键帧数组（含浏览器计算出的 offset），`setKeyframes(kf)` 可在运行时替换关键帧内容——典型场景是"错误态到成功态"的关键帧热替换，不需要重新创建整个动画对象。

继承自 `AnimationEffect` 的三个方法构成了 timing 的读写闭环：`getTiming()` 读取原始设置值，`getComputedTiming()` 读取计算后的值（如 `activeDuration`），`updateTiming(options)` 运行时修改 timing——比如游戏里"加成道具让动画临时多播几轮"，可以直接 `animation.effect.updateTiming({ iterations: 4 })` 而不必重建动画。这里有个容易忽略的专家级细节：`fill` 的规范默认值是 `"auto"`，但对 `KeyframeEffect` 的计算结果实际等价于 `"none"`——所以 `getTiming().fill` 可能显示 `"auto"`，而 `getComputedTiming().fill` 显示计算后的 `"none"`，两者不矛盾，只是原始值与计算值的差异。

## 二、composite 与 iterationComposite：合成模式详解

`composite` 描述**不同动画效果之间**如何合成，共三种模式：

| 模式 | 行为 |
| --- | --- |
| `replace`（默认） | 新动画的值直接覆盖旧值 |
| `add` | 数值相加（如两个 `transform: translateX` 动画的位移量相加） |
| `accumulate` | 按属性对应的列表函数合并（比语法上简单的相加更复杂，常用于 `transform` 多变换叠加） |

`composite` 也可以逐帧指定，覆盖效果级的默认值。当多个动画同时作用在同一属性上时，会按这套合成规则叠加计算最终样式——比如三个独立的 `transform` 动画同时作用在同一元素上，最终效果是它们按合成顺序叠加的结果，而不是后一个简单覆盖前一个。

`iterationComposite` 是另一个容易和 `composite` 混淆的维度：`composite` 管的是"多个不同动画效果之间"如何合成，`iterationComposite` 管的是"同一个动画的多次迭代之间"是否累积效果（`replace` 或 `accumulate`）——两者维度不同、互不替代，这也是高频面试坑之一。

## 三、Timeline 家族：AnimationTimeline 基类与 DocumentTimeline

`AnimationTimeline` 是所有时间轴的基类，只暴露两个只读属性：`currentTime`（毫秒，或 `null` 表示未激活）、`duration`。目前落地的三个具体子类是：

```
AnimationTimeline（基类：currentTime / duration 只读）
 ├── DocumentTimeline（默认，Baseline 自 2020-07）
 ├── ScrollTimeline（滚动驱动，2026 仍非 Baseline）
 └── ViewTimeline（可见性驱动，2026 仍非 Baseline）
```

`DocumentTimeline` 是默认时间轴：

```js
document.timeline; // 默认 DocumentTimeline 实例，currentTime = 页面已打开的毫秒数
new Animation(effect, document.timeline); // 显式指定（省略第二参数时的默认值就是它）
```

`ScrollTimeline` 和 `ViewTimeline` 分别让动画进度由滚动位置、元素可见性驱动，而非由时间驱动——它们的构造选项、CSS 等价写法与 2026 年的浏览器兼容现状，在下一页 [滚动驱动与互操作](./scroll-and-interop) 详细展开。

## 四、getAnimations()：组合查询与全局操控

```js
// 拿到文档 / 元素上当前生效的所有 Animation（含 CSS animation、CSS transition、WAAPI 动画）
document.getAnimations().forEach((a) => (a.playbackRate *= 0.5)); // 全局减速一半
element.getAnimations(); // 只看这个元素（默认含子树后代）
```

这是"WAAPI 能反向操控纯 CSS 动画"的关键入口——哪怕动画是用 `@keyframes` + `animation` 属性写的 CSS，也能被 `getAnimations()` 抓出来当 `Animation` 对象操控（暂停、调速、监听 `finished`）。典型用法：全局调试面板"暂停页面所有动画"；批量等待 `Promise.all(document.getAnimations().map(a => a.finished))` 之后再做后续操作（比如页面切换时等所有出场动画播完再卸载 DOM）。`Element.getAnimations()` 默认包含子树内所有后代元素的动画，比 `Document.getAnimations()` 更适合做局部性能隔离与调试。

至此 `KeyframeEffect` 复用、合成模式、Timeline 家族总览和 `getAnimations()` 全部打通；下一页 [滚动驱动与互操作](./scroll-and-interop) 深入 `ScrollTimeline`/`ViewTimeline` 的具体用法、CSS 等价写法与浏览器现状。
