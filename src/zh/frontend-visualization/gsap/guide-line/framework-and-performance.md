---
layout: doc
outline: [2, 3]
---

# 框架集成与性能：useGSAP、matchMedia 与高频优化

> 基于 GSAP v3.15（npm `gsap@3.15.0`，2026-04-13 发布）· 2025-04 起全插件 100% 免费（含商业项目）· 核于 2026-07

## 速查

- **`useGSAP()`**（React）：`@gsap/react` 提供，是 `useEffect`/`useLayoutEffect` 的替代品，自动用 `gsap.context()` 清理内部创建的所有 Tween/Timeline/ScrollTrigger/Draggable/SplitText 实例；`scope` 限定选择器作用域；App Router/RSC 场景需加 `"use client"`。
- **`contextSafe()`**：包裹事件处理器（如 `onClick`）内创建的动画，使其也能被 `useGSAP` 的自动清理机制追踪——Hook 主体内创建的动画默认已被追踪，事件回调里的不在此列。
- **`gsap.context()`**：`useGSAP` 的底层机制，也可直接用于非 React 场景的批量清理，`ctx.revert()` 一键清理上下文内创建的所有动画。
- **`gsap.matchMedia()`**：响应式/无障碍动画的标准写法，内部自建 `gsap.context()`，条件不再匹配时自动 revert 该分支创建的所有动画/ScrollTrigger；常用于 `prefers-reduced-motion` 与响应式断点。
- **`quickTo()`/`quickSetter()`**：为高频更新场景（鼠标跟随、拖拽实时反馈）提供的轻量补间/设置器，跳过单位换算、相对值解析、随机值解析等便利特性，性能远高于每帧调用 `gsap.to()`。
- **transform/opacity 优先**：官方强调它们"don't affect layout"，应优先动画 `x/y/scale/rotation/opacity` 而非 `top/left/margin` 等触发重排的属性。
- **`lazy` 默认 `true`**：延迟属性写入到下一帧合并，减少无谓的强制同步布局。
- **`gsap.utils`**：`clamp`/`mapRange`/`normalize`/`interpolate`/`snap`/`random`/`pipe`/`toArray`/`wrap`/`distribute`/`selector`/`splitColor`，常与 `quickTo` 组合做约束型高性能交互；完整表见[参考页](../reference)。

## 一、useGSAP()：React 中的 GSAP 标准实践

```bash
npm install @gsap/react
```

```jsx
import { useGSAP } from "@gsap/react";
gsap.registerPlugin(useGSAP);

function Comp() {
  const container = useRef();
  const { contextSafe } = useGSAP(() => {
    gsap.to(".box", { x: 360 }); // 选择器自动限定在 scope 内
  }, { scope: container, dependencies: [], revertOnUpdate: false });

  const onClick = contextSafe(() => {           // 事件处理器内创建的动画也需 contextSafe 包裹才会被自动清理追踪
    gsap.to(".box", { rotation: 180 });
  });

  return <div ref={container}><button onClick={onClick}>go</button></div>;
}
```

官方原话：「`useGSAP()` is a drop-in replacement for `useEffect()`/`useLayoutEffect()` that automatically handles cleanup using `gsap.context()`.」——组件卸载时自动 `revert()` 掉内部创建的所有 Tween/Timeline/ScrollTrigger/Draggable/SplitText 实例，尤其规避 React 18 严格模式下 Effect 双调用导致的动画冲突。App Router/RSC 场景需加 `"use client"`。

::: warning contextSafe() 遗漏是常见坑
Hook 主体执行期间创建的动画会被自动追踪，但事件回调（如 `onClick`）里临时创建的动画不在此列，必须用 `contextSafe()` 包裹后才会被纳入自动清理范围，否则组件卸载后事件动画仍可能残留引用导致报错。
:::

## 二、gsap.context()：批量清理的底层机制

`gsap.context()` 是 `useGSAP` 的底层实现，也可以直接用于非 React 场景（比如原生 JS 写的 SPA 路由切换）：

```js
let ctx = gsap.context(() => {
  gsap.to(".box", { x: 100 });
}, scopeEl); // 第二参数限定选择器作用域

ctx.revert(); // 一次性清理该上下文内创建的所有动画
```

只要动画是在 `context()` 回调内创建的，无论是 Tween、Timeline 还是带 ScrollTrigger 的动画，`ctx.revert()` 都能一次性清理干净，不需要逐个手动 `kill()`。

## 三、gsap.matchMedia()：响应式与无障碍动画

```js
let mm = gsap.matchMedia();
mm.add({
  isDesktop: "(min-width: 800px)",
  isMobile: "(max-width: 799px)",
  reduceMotion: "(prefers-reduced-motion: reduce)",
}, (context) => {
  let { isDesktop, reduceMotion } = context.conditions;
  gsap.to(".box", { rotation: isDesktop ? 360 : 180, duration: reduceMotion ? 0 : 2 });
});
```

内部即创建了一个 `gsap.context()`，条件不再匹配时自动 revert 该分支创建的所有动画/ScrollTrigger，是做无障碍 `prefers-reduced-motion` 和响应式断点动画的官方推荐写法——不用手写一堆 `matchMedia` 监听 + 手动清理逻辑。

## 四、性能专项：quickTo / quickSetter / transform 优先

**quickTo() / quickSetter()**：为高频更新场景（鼠标跟随、拖拽实时反馈）提供的轻量补间/设置器，跳过普通 Tween 的单位换算、相对值解析、随机值解析等便利特性，直接写值，性能远高于每帧都调用 `gsap.to()`：

```js
let xTo = gsap.quickTo("#el", "x", { duration: 0.4, ease: "power3" });
window.addEventListener("mousemove", e => xTo(e.pageX));
```

`quickTo` 常与 `gsap.utils.pipe` 组合：先用 `clamp`/`snap` 处理原始输入值，再喂给 `quickTo` 生成的补间函数，构建高性能约束型交互（如可视化面板的吸附式拖拽）：

```js
// pipe 把多个 gsap.utils 函数串成一条处理管道
const constrain = gsap.utils.pipe(
  gsap.utils.clamp(0, 800),   // 先限制范围
  gsap.utils.snap(20),         // 再吸附到 20 的倍数
);
xTo(constrain(e.pageX));
```

**transform/opacity 优先**：官方入门页强调「Transforms and opacity are also very performant because they don't affect layout」，应优先动画 `x/y/scale/rotation/opacity` 而非 `top/left/margin` 等触发重排的属性。

**lazy 默认 true**：延迟属性写入到下一帧合并，减少无谓的强制同步布局；一般场景无需干预，了解其存在即可解释"为什么连续多次同步读取属性值可能拿到旧值"这类边界问题。

## 五、易错点清单（框架集成与性能相关）

- **`gsap.registerPlugin()` 忘记调用**：v3 起插件必须显式 `registerPlugin` 才能使用，否则对应功能静默失效或报错找不到属性。
- **ScrollTrigger/动画不随框架生命周期清理**：SPA 路由切换或组件卸载时若不清理，旧实例仍在监听事件，新旧叠加导致动画错乱或性能衰退；应始终用 `useGSAP()`/`gsap.context()` 而非裸 `useEffect` + 手动管理。
- **`gsap.context()`/`useGSAP` 清理遗漏事件处理器内创建的动画**：Hook 主体执行期间创建的动画会被自动追踪，但事件回调里临时创建的动画必须用 `contextSafe()` 包裹才会被纳入自动清理范围。
- **误以为仍需付费/注册 Club GreenSock 才能用 ScrollTrigger/SplitText 等插件**：这是 2025 年 4 月（v3.13）之前的旧认知，现在通过 npm 正常安装即可免费使用全部插件，包括商业项目。

---

回到[本叶概览](../index)，或查[参考页](../reference)的完整速查表与选型对比。
