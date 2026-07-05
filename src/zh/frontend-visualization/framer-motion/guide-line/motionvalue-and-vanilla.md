---
layout: doc
outline: [2, 3]
---

# MotionValue、滚动动画与独立 JS 版

> 基于 **Motion（原 Framer Motion）** 12.x（npm 实测 12.42.2）· 核于 2026-07

## 速查

- **MotionValue 核心卖点**：可组合的、类信号的动画值，更新时**不经过 React 状态、不触发组件重渲染**，变更会批处理到下一帧直接写入 DOM
- **`useMotionValue`**：创建一个 MotionValue；`.set()` 命令式设置、`.get()` 同步读取当前值（不是 React state）
- **`useTransform`**：把一个 MotionValue 的数值区间映射到另一个区间（甚至可以映射到颜色、模糊值等任意 CSS 值）
- **`useSpring`**：让一个值以弹簧方式跟随另一个值；也可传数字/带单位字符串（如百分比高度）作初始值
- **`.jump()` vs `.set()`**：`.jump()` 立即跳变（不经过动画），区别于仍会走 transition 的 `.set()`
- **`skipInitialAnimation`**：`useSpring` 的选项，跳过挂载时的初始动画，常用于依赖 DOM 测量后才有意义的值
- **`useVelocity`**：追踪速度；对速度结果再套一层 `useVelocity` 可算出加速度
- **`useMotionValueEvent`**：订阅 MotionValue 的变化，支持事件 `change` / `animationStart` / `animationComplete` / `animationCancel`
- **滚动两种模式**：**滚动触发**（`whileInView`，元素进/出视口时触发一次性动画，已在[上一页](./variants-and-gesture)讲过）vs **滚动链接**（动画值直接绑定滚动位置，连续跟手）
- **`useScroll`**：返回 `scrollYProgress` 等滚动进度值；可跟踪整页或指定 `target` 元素 + `offset` 区间
- **`useInView`**：独立 hook，返回布尔 state，区别于声明式的 `whileInView` prop——命令式/副作用场景用状态判断时选它
- **`useAnimate`**：命令式动画，`[scope, animate]`；`scope` 绑定的字符串选择器只在**子树内**生效，不是全局 `document.querySelectorAll`
- `useAnimate` 返回的 controls 可 `.speed` 调速、`.stop()` 清理；组件卸载时应清理正在跑的动画
- 可与 `usePresence` 组合手写异步退场时间线（`await` 串联多段 `animate()` 调用，播完再调用 `safeToRemove()`）
- **SVG 描边动画**：`pathLength`/`pathSpacing`/`pathOffset` 均为 0~1 进度值，适用于 path/circle/ellipse/line/polygon/polyline/rect
- SVG `viewBox` 可直接动画做平移缩放效果；路径插值变形（`d` 属性变化）要求路径结构相似才能平滑插值
- SVG transform 默认围绕元素中心（与标准 DOM 行为一致）
- **`MotionConfig`**：全局默认配置容器，可设默认 `transition`
- **`reducedMotion` 三值**：`"user"`（尊重操作系统设置）/ `"always"`（强制启用，调试用）/ `"never"`（不遵从系统设置，**默认值**）
- 启用 reducedMotion 后 transform/layout 动画被禁用，但透明度、背景色等属性动画仍会播放——不是「全部动画消失」
- **`useReducedMotion`**：手动控制用的 hook，返回布尔值
- **`LazyMotion` + `m` 组件**：按需减包，用 `m` 组件替代完整 `motion` 组件
- `domAnimation`（+15kb，动画/变体/退场/点击悬停焦点手势）/ `domMax`（+25kb，在 domAnimation 基础上再加拖拽和布局动画）
- **`strict` 模式**：意外用了完整版 `motion` 组件会直接抛错，防止误用导致体积膨胀
- 体积对比：`motion` 组件预加载全部功能 34kb（无法进一步树摇）；`m` 组件基础 4.6kb + 按需特性包
- **vanilla 版**：安装同一个包 `motion`，但从根导入而非 `motion/react`
- **`animate()` 多态目标**：CSS 选择器 / 单个元素 / 元素数组 / MotionValue / 纯对象 / 纯数字
- vanilla 体积：mini 版 `animate()` 仅 2.3kb；hybrid 完整版 18kb（对比 GSAP 的 23.5kb）
- **时间线 `sequence`**：数组直接传给 `animate()`；`at` 相对时间语法：`<`（同时）/ `+0.5`（延后）/ `-0.2`（提前）/ `<0.5`（相对开始点偏移）/ 标签字符串引用
- **播放控制**：`.pause()`/`.play()`/`.complete()`（立即跳到终态）/`.cancel()`（取消并回到初始值）/`.stop()`（提交当前值后停止，不可重启，区别于 `.cancel()`）；可读写 `.time`/`.speed`（负数倒放）；支持 `await`/`.then()` 的 Promise 风格
- **`scroll()` 函数**：滚动链接，基于浏览器原生 ScrollTimeline 硬件加速；`offset` 默认 `["start start", "end end"]`
- **Vue 版**：独立包 **`motion-v`**，配套 Nuxt 模块 `motion-v/nuxt`；手势 prop 名是 `whilePress`，不是 React 版的 `whileTap`
- **进阶顺序**：本页走完即完成本叶主线，可回[参考](../reference)查速查表，或对照 GSAP/WAAPI/react-spring 做选型判断

## 一、MotionValue 与常用 hooks

MotionValue 是「可组合的、类信号的动画值」，核心卖点是**更新时不经过 React 状态、不触发组件重渲染**，变更会批处理到下一帧直接写入 DOM：

```jsx
import { useMotionValue, useTransform, useSpring, useVelocity, useMotionValueEvent } from "motion/react"

function TrackDrag() {
  const x = useMotionValue(0)
  x.set(100)   // 命令式设置
  x.get()      // 同步读取当前值（不是 React state）

  const opacity = useTransform(x, [-200, 0, 200], [0, 1, 0])  // 数值区间映射

  const springX = useSpring(x, { stiffness: 300 })   // 让一个值以弹簧方式跟随另一个值
  springX.jump(50)   // .jump() 立即跳变（不经过动画），区别于仍会走 transition 的 .set()

  const xVelocity = useVelocity(x)  // 追踪速度
  const xAcceleration = useVelocity(xVelocity)  // 对速度再套一层 useVelocity 可算加速度
  const scale = useTransform(xVelocity, [-3000, 0, 3000], [2, 1, 2], { clamp: false })

  useMotionValueEvent(x, "change", (latest) => console.log(latest))  // change/animationStart/animationComplete/animationCancel

  return <motion.div style={{ x, opacity, scale }} />
}

// useSpring 跳过挂载时初始动画：常用于依赖 DOM 测量后才有意义的值
function SmoothScrollProgress({ scrollYProgress }) {
  return useSpring(scrollYProgress, { skipInitialAnimation: true })
}
```

## 二、滚动动画：触发式 vs 链接式

两种模式：**滚动触发**（`whileInView`，元素进/出视口时触发一次性动画，[上一页](./variants-and-gesture)已介绍）vs **滚动链接**（动画值直接绑定滚动位置，连续跟手）。

```jsx
import { useScroll, useTransform, useSpring } from "motion/react"

// 滚动链接：顶部进度条，跟踪整页滚动
function ScrollProgressBar() {
  const { scrollYProgress } = useScroll()
  return <motion.div style={{ scaleX: scrollYProgress, originX: 0 }} />
}

// 跟踪特定元素（而非整页）+ 映射到任意 CSS 值 + 加一层 spring 让滚动值更平滑
function BlurOnScroll() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const filter = useTransform(scrollYProgress, [0, 1], ["blur(0px)", "blur(10px)"])
  const smooth = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })
  return <motion.div ref={ref} style={{ filter }} />
}
```

`useInView`（独立 hook，返回布尔 state，区别于声明式的 `whileInView` prop——需要在**命令式/副作用**场景用状态判断时选它）：

```jsx
function useIsCardVisible() {
  const ref = useRef(null)
  const isInView = useInView(ref, { margin: "0px 100px -50px 0px", amount: "some", once: false })
  return [ref, isInView]
}
```

## 三、useAnimate 命令式动画

```jsx
import { useAnimate, useInView } from "motion/react"

function Component() {
  const [scope, animate] = useAnimate()

  useEffect(() => {
    const controls = animate([
      [scope.current, { x: "100%" }],
      ["li", { opacity: 1 }],   // 字符串选择器只在 scope 子树内生效，不是全局 document.querySelectorAll
    ])
    controls.speed = 0.8
    return () => controls.stop()  // 组件卸载自动清理正在跑的动画
  }, [])

  return (
    <ul ref={scope}>
      <li /><li /><li />
    </ul>
  )
}
```

可与 `useInView` 组合做滚动触发的命令式动画，或与 `usePresence` 组合手写异步退场时间线（`await` 串联多段 `animate()` 调用，动画播完再调用 `safeToRemove()`）。

## 四、SVG 动画

```jsx
// 描边动画：pathLength/pathSpacing/pathOffset 均为 0~1 进度值，适用于 path/circle/ellipse/line/polygon/polyline/rect
function DrawPath({ d }) {
  return <motion.path d={d} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} />
}

// viewBox 动画（平移缩放效果）
function ZoomViewBox() {
  return <motion.svg animate={{ viewBox: "0 0 200 200" }} />
}

// 路径插值变形（d 属性变化，要求路径结构相似才能平滑插值）
function MorphPath({ newPath }) {
  return <motion.path animate={{ d: newPath }} />
}
```

SVG transform 默认围绕元素中心（与标准 DOM 行为一致）；可拖拽 SVG 时用 `transformViewBoxPoint` 处理 viewBox 坐标系转换。

## 五、MotionConfig 全局配置与无障碍

```jsx
import { motion, MotionConfig } from "motion/react"

function App({ children }) {
  return (
    <MotionConfig transition={{ duration: 1 }} reducedMotion="user">
      {children}
    </MotionConfig>
  )
}
```

`reducedMotion` 三值：`"user"`（尊重操作系统的减少动态设置）、`"always"`（强制启用减少动态，通常用于调试）、`"never"`（不遵从系统设置，**默认值**）。启用后 transform/layout 动画被禁用，但透明度、背景色等属性动画仍会播放——**不要误以为设置了就「全部动画消失」**。`nonce` 属性可配合 CSP 让 Motion 生成的样式块合规。

手动控制用 `useReducedMotion`（返回布尔值）：

```jsx
function Sidebar({ isOpen }) {
  const shouldReduceMotion = useReducedMotion()
  const animate = isOpen
    ? (shouldReduceMotion ? { opacity: 1 } : { x: 0 })
    : (shouldReduceMotion ? { opacity: 0 } : { x: "-100%" })
  return <motion.div animate={animate} />
}
// 其他典型应用：video 元素配 autoPlay={!shouldReduceMotion} 禁用自动播放；
// useTransform 视差效果加 shouldReduceMotion ? 0 : y 短路
```

## 六、LazyMotion / m 组件按需减包

```jsx
import { LazyMotion, domAnimation } from "motion/react"
import * as m from "motion/react-m"

function App({ children }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>
}
// 用 m.div 替代 motion.div

// 动态 import 特性包，进一步延迟加载
const loadFeatures = () => import("./features.js").then(res => res.default)
function LazyApp({ children }) {
  return (
    <LazyMotion features={loadFeatures}>
      <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{children}</m.div>
    </LazyMotion>
  )
}

// strict 模式：意外用了完整版 motion 组件会直接抛错，防止误用导致体积膨胀
function StrictApp() {
  return (
    <LazyMotion strict>
      {/* 这里如果写 motion.div 会直接抛错，必须全部改用 m.div */}
      <m.div />
    </LazyMotion>
  )
}
```

体积对比：`motion` 组件预加载全部功能 **34kb**（无法进一步树摇）；`m` 组件基础 **4.6kb** + 按需特性包：`domAnimation`（动画/变体/退场/点击悬停焦点手势，+15kb）、`domMax`（在 domAnimation 基础上再加拖拽和布局动画，+25kb）。

## 七、独立 JS 版（Motion vanilla）

安装与导入与 React 版共用同一个包：`npm install motion`，但从根导入而非 `motion/react`：

```js
import { animate, scroll, stagger, arc } from "motion"
```

体积：mini 版 `animate()` 仅 **2.3kb**；hybrid 完整版 **18kb**（对比 GSAP 的 23.5kb）。CDN 方式：`https://cdn.jsdelivr.net/npm/motion@latest/+esm`（ESM）或传统 `<script>` 标签引入后挂全局变量 `Motion`。

`animate()` 核心用法：

```js
// 目标可以是 CSS 选择器 / 单个元素 / 元素数组 / MotionValue / 纯对象 / 纯数字
animate(".box", { rotate: 360 })
animate(document.querySelectorAll(".box"), { rotate: 360 })
animate(element, { scale: [0.4, 1] }, { ease: "circInOut", duration: 1.2 })
animate(element, { rotate: 90 }, { type: "spring", stiffness: 300 })
animate(0, 100, { onUpdate: latest => console.log(latest) })  // 纯数值补间，onUpdate 里自己处理副作用

// stagger 错列
import { stagger } from "motion"
animate("li", { y: 0, opacity: 1 }, { delay: stagger(0.1) })

// 弧形路径运动
animate(".product", { x: 200, y: -120 }, { duration: 0.6, path: arc() })
```

时间线序列（`sequence` 数组，直接传给 `animate()`）：

```js
const sequence = [
  ["ul", { opacity: 1 }, { duration: 0.5 }],
  ["li", 100, { ease: "easeInOut" }],
]
animate(sequence)

// at 时间控制：绝对秒数 / 标签引用 / 相对语法（< 同时；+0.5 延后；-0.2 提前；<0.5 相对开始点偏移）
const timeline = [
  ["nav", { x: 100 }, { duration: 1 }],
  ["li", { opacity: 1 }, { at: "<" }],
  "my-label",
  ["a", { scale: 1.2 }, { at: "my-label" }],
]
```

播放控制对象：`animation.pause()` / `.play()` / `.complete()`（立即跳到终态）/ `.cancel()`（取消并回到初始值）/ `.stop()`（把 WAAPI 当前值提交到 style 后停止，不可重启，区别于 `.cancel()`）；可读写 `.time`（当前时间秒）、`.speed`（播放速度，负数可倒放）；支持 `await animation` / `.then()` 的 Promise 风格等待完成。

`scroll()` 函数（滚动链接，基于浏览器原生 ScrollTimeline 硬件加速）：

```js
import { scroll, animate } from "motion"
scroll(progress => console.log(progress))  // 回调模式
scroll(animate("div", { transform: ["none", "rotate(90deg)"] }, { ease: "linear" }))  // 绑定到动画
scroll(myAnimation, { target: document.getElementById("item") })
// offset 默认 ["start start", "end end"]，支持数字/命名(start/center/end)/像素/百分比/vh-vw
```

## 八、Vue 版简述

包名 **`motion-v`**（独立于 `motion`），支持 Nuxt 模块 `motion-v/nuxt` 自动导入；`unplugin-vue-components` 方案需配置 `MotionResolver()`。API 是 Vue 化的声明式写法，官方定性为「生产级库」（production-ready，非实验性）：

```html
<motion.div :animate="{ rotate: 360 }" />
<motion.button :initial="{ scale: 0 }" :animate="{ scale: 1 }" />
<motion.button :whileHover="{ scale: 1.1 }" :whilePress="{ scale: 0.95 }" />
<!-- 注意手势属性名是 whilePress，不是 React 版的 whileTap -->
```

`AnimatePresence` 在 Vue 里同样要求直接子级 + 稳定 key，但受 Vue Transition 组件机制限制，约束比 React 版更严格（退场元素必须是 `AnimatePresence` 的**直接**子级，官方原文特别强调这一点）。

## 易错点

- **误以为 MotionValue 更新会触发重渲染**：`useMotionValue`/`.set()` 走的是「批处理到下一帧直接写 DOM」的旁路，不经过 React state；若业务逻辑需要响应变化必须用 `useMotionValueEvent` 订阅或配合 `useEffect`，不能指望组件重渲染时读到最新值。
- **useAnimate 选择器范围理解错误**：`animate("li", {...})` 里的字符串选择器只在 `scope` 绑定的子树内查找，不是 `document.querySelectorAll` 式的全局查询。
- **CSS 变量动画性能预期过高**：即便把 CSS 自定义属性绑定到 transform 相关的用途上，目前也无法获得硬件加速，这与常规 transform 属性的表现不同，压测/选型时容易被忽略。
- **LazyMotion 的 strict 模式踩雷**：开启 `strict` 后如果代码里混用了完整版 `motion` 组件（应全部改用 `m` 组件），会直接抛错，这是刻意设计用来防止无意中引入完整包体积。
- **Vue 版包名搞混**：Vue 支持是独立包 `motion-v`，不是给 `motion` 包传个 Vue 适配器；且 Vue 版手势 prop 名是 `whilePress` 而非 React 版的 `whileTap`，不能直接照搬 React 写法。
- **reducedMotion 理解片面**：设置 `reducedMotion` 为 `"user"` 只会禁用 transform/layout 动画，透明度/背景色等属性动画依然会播放，不是「用户开了减少动态，所有动画全部消失」。

---

下一页：[参考](../reference)——props/hooks/transition 参数速查表、易错点清单与 vs GSAP/WAAPI/react-spring 选型对比。
