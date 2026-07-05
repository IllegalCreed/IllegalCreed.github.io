---
layout: doc
outline: [2, 3]
---

# ScrollTrigger 与插件生态：滚动驱动与常用插件

> 基于 GSAP v3.15（npm `gsap@3.15.0`，2026-04-13 发布）· 2025-04 起全插件 100% 免费（含商业项目）· 核于 2026-07

## 速查

- **注册**：`gsap.registerPlugin(ScrollTrigger)`；配置写在 `scrollTrigger: {...}` 里，或简写为选择器字符串。
- **start/end 语法**：关键词组合（`"top bottom"`）、百分比（`"80%"`）、像素（`"100px"`）、相对（`"+=300"`）。
- **scrub 三态**：`true`（严格跟手）/ 数字（追及延迟秒数，制造平滑感）/ 不设置（走 `toggleActions` 的播放/暂停语义，不跟手）。
- **toggleActions 四段式**：`"onEnter onLeave onEnterBack onLeaveBack"`，每段取值 `play|pause|resume|reverse|restart|reset|complete|none`。
- **pin 固定**：`pin:true` 固定触发元素本身直到 end；祖先有 `transform`/`will-change` 会破坏 `position:fixed`，用 `pinReparent:true` 临时挂到 `<body>`。
- **snap 吸附**：数字（增量）/ 数组（离散点）/ 对象 `{ snapTo:"labels", duration:{min,max}, delay, ease }`（常配合 pin+scrub 做全屏分页 story）。
- **batch()**：长列表逐个进入动画且合并同批触发，减少大量独立 ScrollTrigger 的性能开销。
- **refresh**：DOM/内容尺寸变化后必须手动 `ScrollTrigger.refresh()`，否则 start/end 计算过期。
- **清理**：`ScrollTrigger.getAll()`/`getById()`/`trigger.kill()`/`ScrollTrigger.killAll()`。
- **getVelocity()**：返回像素/秒的滚动速度。
- **SplitText**（3.13 起免费）：`SplitText.create(el, { type, autoSplit, onSplit })`，`autoSplit:true` 让尺寸/字体变化后自动重拆分并重跑回调。
- **Draggable**：`type: "x,y"/"rotation"/"scroll"`，`inertia:true` 需配合 `InertiaPlugin`。
- **Flip**（First-Last-Invert-Play）：`Flip.getState()` 记录 → 改 DOM → `Flip.from(state, {...})` 补间差值；框架中需等真实渲染完成后调用，且显式传 `targets`。
- **MotionPathPlugin**：沿 SVG 路径或坐标数组动画，`align`/`autoRotate`/`start`/`end`。
- **MorphSVGPlugin**：`gsap.to("#a", { morphSVG: "#b" })`；`shapeIndex` 手动指定起止点映射；`smooth`（3.14 新增）平滑锚点。
- **Observer**：统一封装 wheel/touch/pointer 为方向性回调，**已内置于 ScrollTrigger**（`ScrollTrigger.observe()`）。
- **ScrollSmoother**：固定骨架 `#smooth-wrapper > #smooth-content`；`effects:true` 自动识别 `data-speed`/`data-lag` 视差属性。
- **InertiaPlugin**（原付费 ThrowPropsPlugin 继任者，现免费）：带初始速度平滑减速停止；`VelocityTracker` 可独立追踪任意属性速度。

## 一、ScrollTrigger 基础配置

ScrollTrigger 是 GSAP 生态里最常用的插件，把任意 Tween/Timeline 与页面滚动行为绑定，是滚动驱动叙事（scrollytelling）的事实标准：

```js
gsap.registerPlugin(ScrollTrigger);

gsap.to(".box", {
  scrollTrigger: {
    trigger: ".box",
    start: "top bottom",   // 触发元素 top 碰到 视口 bottom 时开始
    end: "bottom top",     // 触发元素 bottom 碰到 视口 top 时结束
    scrub: 1,               // 数字=平滑追随（秒级延迟）；true=完全同步；不设=按 toggleActions 播放
    pin: true,               // 固定触发元素直至 end
    pinSpacing: true,        // 固定期间自动补位（flex 布局下默认变 false）
    markers: true,           // 开发期可视化调试标记
    toggleActions: "play pause resume reverse", // onEnter onLeave onEnterBack onLeaveBack
    onEnter: self => {},
    onLeave: self => {},
    onEnterBack: self => {},
    onLeaveBack: self => {},
    onUpdate: self => console.log(self.progress, self.getVelocity()),
  },
  x: 500,
});
```

几个必考细节：

- **start/end 语法**：关键词组合（`"top bottom"`）、百分比（`"80%"`）、像素（`"100px"`）、相对（`"+=300"`）。
- **scrub 三态**：`true`（严格跟手，滚动条动画就动）/ 数字（追及延迟秒数，制造平滑跟随感）/ 不设置（走 `toggleActions` 的播放/暂停语义，不跟手，是"进入视口就播完整段"的传统触发式动画）。
- **toggleActions 四段式**：`"onEnter onLeave onEnterBack onLeaveBack"`，每段取值 `play|pause|resume|reverse|restart|reset|complete|none`，对应"向下滚入/向下滚出/向上滚回入/向上滚回出"四个时机。

## 二、pin 固定与 snap 吸附

**pin 固定**：`pin:true` 固定触发元素本身直到 end；应当避免直接给被 pin 的元素做位移动画（应动画其内部子元素），否则会与 pin 本身的固定定位机制冲突。祖先若有 `transform`/`will-change` 会破坏 `position:fixed` 的固定语义（被劫持为相对该祖先定位），用 `pinReparent:true` 让元素在 pin 期间临时挂到 `<body>` 规避。

::: warning pin 固定元素被祖先 transform/will-change 破坏定位
`position:fixed` 的固定语义会被拥有 `transform` 的祖先元素"劫持"为相对该祖先定位，导致 pin 效果错位；用 `pinReparent:true` 让元素固定期间临时挂载到 `<body>` 规避。
:::

::: warning 不要直接给 pin 住的元素做位移类动画
应该动画其内部子元素，否则会与 pin 本身的固定定位机制冲突。
:::

**snap 吸附**：数字（增量）/ 数组（离散点）/ 对象 `{ snapTo:"labels", duration:{min,max}, delay, ease }`（吸附到 timeline 标签，常配合 pin+scrub 做全屏分页 story）。

## 三、batch 批量、refresh 刷新与清理

**batch() 批量**：长列表场景中，逐个创建独立 ScrollTrigger 开销很大，`batch()` 把同批次进入的元素合并触发：

```js
ScrollTrigger.batch(".item", {
  onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, stagger: 0.15 }),
  interval: 0.1,
});
```

**refresh 与内容变化**：DOM/内容尺寸变化后必须手动 `ScrollTrigger.refresh()` 重新计算位置，否则 start/end 计算过期；`ScrollTrigger.refresh(true)` 会等滚动动量结束后再刷新；timeline 自带的 ScrollTrigger 会等一个 tick 再首次 refresh（因为动画可能还没加完就会影响 end 位置），批量创建时建议全部创建完后统一调 `ScrollTrigger.refresh()`。

::: warning DOM/内容变化后不调用 ScrollTrigger.refresh()
图片异步加载、无限滚动追加内容、字体加载导致的行高变化等都会让已创建的 ScrollTrigger 的 start/end 位置计算过期，必须在内容稳定后手动 refresh（图片场景常见做法：`window.addEventListener("load", () => ScrollTrigger.refresh())`）。
:::

**清理**：`ScrollTrigger.getAll()`/`getById()`/`trigger.kill()`/`ScrollTrigger.killAll()`；`tl.scrollTrigger.kill()` 可拿到挂在 timeline 上的实例单独清理；框架里交给 `useGSAP()`/`gsap.context()` 自动 revert（详见[下一篇](./framework-and-performance)）。

::: warning ScrollTrigger 与框架生命周期不清理 = 内存泄漏/动画重复叠加
SPA 路由切换或组件卸载时若不 `kill()` 掉 ScrollTrigger 实例，旧实例仍在监听滚动事件，新页面/新实例叠加后会出现动画错乱或性能衰退；React 中应始终通过 `useGSAP()`（自动清理）而非裸 `useEffect` + 手动管理。
:::

**getVelocity()**：返回像素/秒的滚动速度，可用于判断"快速滚动"触发不同效果。

## 四、常用插件速览

### SplitText（3.13 起免费，同期重写：体积减半 + 屏幕阅读器无障碍支持 + 响应式重拆分）

```js
let split = SplitText.create(".text", {
  type: "chars, words, lines",
  autoSplit: true,
  onSplit(self) {
    return gsap.from(self.chars, { y: 100, autoAlpha: 0, stagger: 0.03 });
  },
});
split.revert(); // 还原为原始 HTML
```

`autoSplit:true` 让窗口尺寸变化/字体加载完成后自动重新拆分并重跑 `onSplit` 回调，规避响应式断行错位。

### Draggable

```js
Draggable.create("#el", {
  type: "x,y",                 // 或 "x"/"y"/"rotation"/"scroll"
  bounds: "#container",
  inertia: true,                // 需同时注册 InertiaPlugin
  snap: v => Math.round(v / 100) * 100,
  onDragEnd: function () {},
});
```

### Flip（First-Last-Invert-Play，Paul Lewis 提出的布局动画技术）

```js
const state = Flip.getState(".item");      // First：记录当前位置/尺寸
container.classList.toggle("list-view");    // Last：改变 DOM/class 触发新布局
Flip.from(state, {                          // Invert+Play：GSAP 自动补间差值
  duration: 0.6, ease: "power2.inOut",
  absolute: true,                           // 防止 flex/grid 重排过程布局塌陷
  onEnter: els => gsap.fromTo(els, { opacity: 0 }, { opacity: 1 }),
  onLeave: els => gsap.to(els, { opacity: 0 }),
});
```

React 等框架中因渲染是异步的，需等新 DOM 真正渲染后再 `Flip.from`（常见 `requestAnimationFrame` 包裹），且必须显式传 `targets`（框架可能创建全新元素实例，需靠 `data-flip-id` 类似标记对应）。

::: warning Flip 在框架中过早调用
React/Vue 等框架的渲染是异步批处理的，DOM 还没实际更新前调用 `Flip.from()` 会拿到错误的"最终态"，需等一帧渲染完成后再执行，并显式传 `targets`（因为框架可能销毁重建了全新的元素实例，需要靠稳定的 `key`/`data-flip-id` 对应新旧元素）。
:::

### MotionPathPlugin

沿 SVG 路径或坐标数组动画元素，`path` 支持选择器/路径字符串/坐标点数组；`align`（贴合路径校正嵌套变换）、`autoRotate`（沿切线自动转向）、`start`/`end`（路径区间 0~1）。配套 `MotionPathHelper` 提供浏览器内可视化拖拽编辑路径。

### MorphSVGPlugin

变形 SVG 路径：`gsap.to("#a", { morphSVG: "#b" })`；`type:"rotational"` 优化旋转类形变的插值观感；`shapeIndex` 手动指定起止点映射避免自相交；`smooth:{ points, redraw }`（3.14 新增）增加平滑锚点提升变形质量。

### Observer

统一封装 wheel/touch/pointer 事件为方向性回调（`onUp`/`onDown`/`onLeft`/`onRight`/`onChange`），`tolerance`/`dragMinimum`/`wheelSpeed` 控制灵敏度；**已内置于 ScrollTrigger**，若已加载 ScrollTrigger 可直接 `ScrollTrigger.observe()` 无需单独引入；典型场景是全屏分页滚动（一次滚轮 = 翻一屏）。

### ScrollSmoother

基于原生滚动位置做 CSS 变换追赶实现平滑滚动，需要固定 HTML 骨架 `#smooth-wrapper > #smooth-content`；`smooth`（追赶耗时）、`effects:true`（自动识别 `data-speed`/`data-lag` 视差属性）、`normalizeScroll`（移动端地址栏收起等场景强制 JS 线程同步滚动）；构建于 ScrollTrigger 之上，二者配合使用。

### InertiaPlugin

原付费 ThrowPropsPlugin 的继任者，现免费。让任意属性带初始速度平滑减速停止，`VelocityTracker` 可独立追踪任意属性速度（`track()`/`getVelocity()`/`untrack()`），常配合 Draggable 的 `inertia:true` 做惯性抛掷，但不强制依赖 Draggable。

::: tip 关于插件付费的旧认知已过时
2025 年 4 月（v3.13）之前，ScrollTrigger、SplitText 等插件需要付费加入 Club GreenSock 会员。现在通过 npm 正常安装即可免费使用全部插件，包括商业项目，不应再要求"注册会员"或"购买授权"。
:::

---

下一步进入 [框架集成与性能](./framework-and-performance)：把这些插件在 React/Vue 里安全地接入并清理，再学几招性能优化技巧。
