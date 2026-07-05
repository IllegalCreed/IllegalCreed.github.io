---
layout: doc
outline: [2, 3]
---

# Tween 与 Ease：核心方法、属性简写与缓动

> 基于 GSAP v3.15（npm `gsap@3.15.0`，2026-04-13 发布）· 2025-04 起全插件 100% 免费（含商业项目）· 核于 2026-07

## 速查

- **四大方法**：`to`（当前→目标）/ `from`（起始→当前，`immediateRender` 默认 `true`）/ `fromTo`（显式起止，最可控）/ `set`（零时长赋值）。
- **特殊值语法**：`"+=100"` 相对增加 / `"-=50"` 相对减少 / `"random(-100,100)"` 随机值 / 函数式 `(index, target, list) => ...` 逐元素动态值。
- **基础时序 vars**：`duration`（默认 `0.5`）、`delay`、`ease`（默认 `"power1.out"`）、`easeReverse`（v3.15 新增，反向播放独立缓动，替代已弃用的 `yoyoEase`）。
- **重复/往返**：`repeat`（`-1` 无限）、`repeatDelay`、`repeatRefresh`（每轮重新取值，配合 `random()` 用）、`yoyo`（往返播放）。
- **播放状态**：`paused`、`reversed`、`runBackwards`。
- **回调族**：`onStart`/`onUpdate`/`onComplete`/`onRepeat`/`onReverseComplete`，均有对应 `xxxParams` 传参数组，及 `callbackScope`。
- **高级 vars**：`overwrite`（`true`/`"auto"`/`false`）、`immediateRender`、`lazy`（默认 `true`）、`stagger`、`inherit`（继承父 timeline 的 defaults）、`startAt`（隐式初始 `from`）、`id`（配合 `gsap.getById()`）、`keyframes`（单个 `.to()` 内多阶段关键帧数组）。
- **transform 简写**：`x`/`y`/`xPercent`/`yPercent`/`scale`/`scaleX`/`scaleY`/`rotation`/`rotationX`/`rotationY`/`skewX`/`skewY`，代替原生 CSS `transform` 字符串。
- **固定变换顺序**：GSAP 内部固定按 平移 → 缩放 → rotationX → rotationY → 倾斜 → 旋转 的顺序应用，规避原生 CSS transform 因书写顺序不同导致结果不同的坑。
- **`autoAlpha`**：`opacity` + `visibility` 合体，值为 0 时自动加 `visibility:hidden`，非 0 时恢复 `visibility:inherit`。
- **3D 变换**：`transformPerspective`（单元素透视）或父容器 CSS `perspective`（子元素共享视点）+ `rotationY`/`rotationX`。
- **不局限于 DOM**：可直接动画普通 JS 对象的任意数值属性，也可动画 SVG 专属属性（`attr:{ x, cx, r }`、`fill`、`stroke-dashoffset` 等）。
- **Ease 内置族**：`none`（线性）、`power1~power4`、`back`（回弹超调）、`elastic`（弹簧）、`bounce`（弹跳）、`circ`/`expo`/`sine`（三角/指数曲线）、`steps`（阶跃）；EasePack 扩展 `rough`/`slow`/`expoScale`；自定义插件 `CustomEase`/`CustomBounce`/`CustomWiggle`。
- **修饰符**：`.in`（起步慢后加速）/`.out`（起步快后减速，默认族多用）/`.inOut`（两端都缓）。
- **可配置参数**：`back.out(1.7)`（超调强度，默认 1.70158）、`elastic.out(1, 0.3)`（振幅、周期）、`steps(12)`（阶跃数）。
- **全局/局部默认**：`gsap.defaults({ ease, duration })` 全局；`gsap.timeline({ defaults: {...} })` 局部覆盖。
- **Ease Visualizer**：官网交互式曲线编辑器（Alt+点击切换锚点平滑/尖角，Shift+点击多选，Delete 删除锚点，Ctrl+Z 撤销），可视化调参并生成 `CustomEase` 代码。
- ⚠️ `from`/`fromTo` 默认 `immediateRender:true`，脚本加载晚或有 SSR 水合延迟时可能先闪一下最终态再跳回起始态（FOUC）。
- ⚠️ 永远用 GSAP 的独立简写属性（`x`/`rotation`/`scale`），别直接写 CSS `transform` 字符串。

## 一、四大核心方法：to / from / fromTo / set

| 方法 | 语义 | `immediateRender` 默认值 |
| --- | --- | --- |
| `gsap.to(targets, vars)` | 从**当前状态**动画到 vars 指定的目标值（最常用） | `false` |
| `gsap.from(targets, vars)` | 从 vars 指定值动画到**当前状态**（常用于入场动画） | `true` |
| `gsap.fromTo(targets, fromVars, toVars)` | **显式指定起止两端**，最精确可控 | `true` |
| `gsap.set(targets, vars)` | 零时长立即设置属性（本质是 `duration:0` 的特例） | — |

```js
gsap.to(".box", { x: 100, duration: 1, ease: "power2.out" });
gsap.from(".box", { opacity: 0, y: 50, duration: 1 });          // 常见入场动画写法
gsap.fromTo(".box", { scale: 0 }, { scale: 1, duration: 0.6 }); // 起止都显式声明，避免 FOUC
gsap.set(".box", { transformOrigin: "50% 50%" });               // 无动画，立即设置
```

::: warning from 动画的 FOUC（初始态闪现）
`gsap.from()`/`fromTo()` 默认 `immediateRender:true` 会立即把元素设为起始值，但如果脚本加载较晚或有 SSR 水合延迟，用户可能先看到最终态"闪"一下再跳回起始态。首屏关键动画建议配合服务端/CSS 预先设置好初始不可见态，或用 `fromTo` 显式声明避免依赖当前 DOM 状态的不确定性。
:::

## 二、vars 配置对象全解

vars 是传给 `to`/`from`/`fromTo`/`set` 的第二个（或 `fromTo` 的第三个）参数，除了要动画的目标属性外，还接受大量控制类配置：

**基础时序**：`duration`（默认 `0.5`s）、`delay`、`ease`（默认 `"power1.out"`）、`easeReverse`（v3.15 新增，反向播放时的独立缓动，替代已弃用的 `yoyoEase`）。

**重复/往返**：`repeat`（`-1` 无限循环）、`repeatDelay`、`repeatRefresh`（每次重复重新取值，配合 `random()` 产生每轮不同的随机值）、`yoyo`（往返播放）。

**播放状态**：`paused`、`reversed`、`runBackwards`。

**回调族**：`onStart`/`onUpdate`/`onComplete`/`onRepeat`/`onReverseComplete`（均有对应 `xxxParams` 传参数组）、`callbackScope`。

**高级配置**：`overwrite`（`true`/`"auto"`/`false`，控制同目标动画冲突时的覆盖策略）、`immediateRender`、`lazy`（默认 `true`，延迟值写入以优化性能）、`stagger`（详见[下一篇](./timeline-and-stagger)）、`inherit`（继承父 timeline 的 defaults）、`startAt`（定义初始属性值，等价于内部隐式 `from`）、`id`（配合 `gsap.getById()` 查询）、`keyframes`（同一目标的多阶段关键帧数组，写单个 `.to()` 即可完成多段动画）。

特殊值语法是 vars 里最常被忽略的能力——属性值不一定是普通数字，也可以是字符串表达式或函数：

```js
gsap.to(".box", { x: "+=100" });              // 相对当前值增加 100
gsap.to(".box", { x: "-=50" });               // 相对当前值减少 50
gsap.to(".box", { x: "random(-100, 100)" });  // 随机值，配合 repeatRefresh 每轮重新随机

gsap.to(".box", {
  x: (index, target, list) => index * 50,     // 函数式：逐元素动态求值
});
```

## 三、transform 属性：为什么不用 CSS transform 字符串

**transform 简写优势（必考）**：GSAP 用 `x`/`y`/`xPercent`/`yPercent`/`scale`/`scaleX`/`scaleY`/`rotation`/`rotationX`/`rotationY`/`skewX`/`skewY` 等独立属性代替原生 CSS `transform` 字符串，原因两点：

1. 避免"写入字符串 → 浏览器解析生成 matrix() → 再读取"的额外解析开销。
2. **GSAP 内部固定按 平移 → 缩放 → rotationX → rotationY → 倾斜 → 旋转 的顺序应用变换**，规避了原生 CSS transform 因书写顺序不同导致结果不同的坑。

```js
gsap.to(element, { x: 50 });                     // 而非 { transform: "translateX(50px)" }
gsap.to(element, { autoAlpha: 0, duration: 1 });  // 淡出且脱离交互
gsap.to(myObj, { value: 100, onUpdate: () => draw(myObj.value) }); // 动画任意对象属性
```

::: warning transform 一定要用 GSAP 简写，别用 CSS transform 字符串
直接 `{ transform: "translateX(50px)" }` 会绕开 GSAP 的优化路径（需要解析生成的 matrix），且多属性同时变换时容易因书写顺序产生和预期不同的结果；应始终用 `x`/`y`/`rotation`/`scale` 等独立简写属性。
:::

除了 transform 简写，还有几个常考的属性能力：

- **`autoAlpha`**：`opacity` + `visibility` 的合体属性，值为 0 时自动加 `visibility:hidden`（避免不可见元素仍可交互/被读屏，且合成层可被浏览器优化掉），非 0 时恢复 `visibility:inherit`。
- **3D 变换**：`transformPerspective`（单元素透视）或父容器 CSS `perspective`（子元素共享同一视点）+ `rotationY`/`rotationX`。
- **任意数值对象属性**：GSAP 不局限于 DOM，可直接动画普通 JS 对象的任意数值属性（游戏坐标、Canvas 绘制参数、WebGL uniform 等）。
- **SVG 属性**：可直接动画 SVG 专属属性如 `attr:{ x, cx, r }`、`fill`、`stroke-dashoffset` 等。

## 四、Ease 缓动体系

Ease 决定动画的"手感"，是同一段位移在不同曲线下观感截然不同的核心变量。内置族：`none`（线性）、`power1~power4`（幂函数，力度递增）、`back`（回弹超调）、`elastic`（弹簧）、`bounce`（弹跳）、`circ`/`expo`/`sine`（三角/指数曲线）、`steps`（阶跃，动画像逐帧定格）。EasePack 扩展：`rough`、`slow`、`expoScale`。自定义插件：`CustomEase`（任意贝塞尔曲线）、`CustomBounce`、`CustomWiggle`。

**修饰符**：每种 ease 都可加 `.in`（起步慢后加速）/`.out`（起步快后减速，**默认族多用 out**）/`.inOut`（两端都缓）。

**可配置参数**：`back.out(1.7)`（超调强度，默认 1.70158）、`elastic.out(1, 0.3)`（振幅、周期）、`steps(12)`（阶跃数）。

```js
gsap.to(".box", { x: 300, ease: "power2.out" });
gsap.to(".box", { x: 300, ease: "back.out(1.7)" });
gsap.to(".box", { x: 300, ease: "elastic.out(1, 0.3)" });
gsap.to(".box", { x: 300, ease: "steps(6)" });
gsap.to(".box", { x: 300, ease: "power1.inOut" });

// 全局/局部默认缓动
gsap.defaults({ ease: "power2.out", duration: 1 });
gsap.timeline({ defaults: { ease: "power2.inOut" } });
```

::: tip Ease Visualizer
官网提供交互式曲线编辑器（Alt+点击切换锚点平滑/尖角，Shift+点击多选，Delete 删除锚点，Ctrl+Z 撤销），用于可视化调参并生成 `CustomEase` 代码，调参时比死记参数表更直观。
:::

v3.15 新增的 `easeReverse` 值得单独一提：它为反向播放（`reverse()`/`yoyo`）单独指定缓动曲线，正式取代了已弃用的 `yoyoEase`——之前想让往返动画"去程用 power2.out、回程用 power2.in"需要手动监听回调切换 ease，现在一个 vars 字段即可声明。

---

下一步进入 [Timeline 与 stagger](./timeline-and-stagger)：把单个 Tween 编排成有顺序、有重叠、有标签的复杂动画序列，并学会批量交错多个目标。
