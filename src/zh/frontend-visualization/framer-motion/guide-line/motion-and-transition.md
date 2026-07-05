---
layout: doc
outline: [2, 3]
---

# motion 组件与 transition：三态模型与 spring/tween 详解

> 基于 **Motion（原 Framer Motion）** 12.x（npm 实测 12.42.2）· 核于 2026-07

## 速查

- **`<motion.div>` 等**：HTML/SVG 元素的直接替换品，覆盖每个标准标签（`motion.div`/`motion.circle`/`motion.svg` ……）
- **自定义字符串标签**：`motion.create('custom-element')`
- **自定义 React 组件包装**：`motion.create(Component)`——组件需转发 ref（React 18 需 `forwardRef`，React 19 可直接从 props 拿 `ref`）
- **props 五大分组**：动画 / 手势 / 拖拽 / 布局 / 高级，覆盖「动什么」「什么时候动」两大问题
- 动画分组：`initial`/`animate`/`exit`/`transition`/`variants`/`style`
- 手势分组：`whileHover`/`whileTap`/`whileFocus`/`whileDrag`/`whileInView`
- 拖拽分组：`drag`/`dragConstraints`/`dragElastic`/`dragMomentum`/`dragTransition`
- 布局分组：`layout`/`layoutId`/`layoutDependency`/`layoutScroll`/`layoutRoot`
- 高级分组：`custom`（传给动态 variants 函数的数据）/`transformTemplate`（自定义 transform 属性顺序）/`inherit`（控制是否继承父级 variants 传播）
- **性能关键点**：动画更新走浏览器原生渲染管线，**不会触发 React 重渲染**
- **三态模型**：`initial`（起始）→ `animate`（目标，自动补间）→ `exit`（退场，须配合 `AnimatePresence`）
- **`initial={false}`**：跳过进入动画，常见首屏优化手法
- **`animate` 自动补间**：目标值变化时自动过渡到新值，无需手动重新触发，这是声明式动画区别于手写关键帧的核心体验
- **exit 单独写不生效**：`exit` prop 必须配合 `AnimatePresence` 才会真正触发退场动画，单独写在组件上没有效果
- **自定义组件同等能力**：`motion.create(Component)` 包装后依然能使用完整的三态模型与所有手势/拖拽/布局 props，和原生标签用法完全一致
- **transition 三种 `type`**：`tween`（时长驱动）/ `spring`（物理驱动）/ `inertia`（初速度减速滑行）
- **tween `duration`**：默认 **0.3 秒**，多关键帧时默认 **0.8 秒**
- **tween `ease` 预设**：linear / easeIn / easeOut / easeInOut / circIn / circOut / circInOut / backIn / backOut / backInOut / anticipate，或三次贝塞尔数组，或自定义函数
- **`times`**：自定义关键帧时间位置（0~1 数组）
- **spring 参数（现行官方文档默认值）**：`stiffness` 默认 **1**（越大越剧烈）、`damping` 默认 **10**（阻力，为 0 则无限振荡）、`mass` 默认 **1**（越大越迟滞）、`velocity`（初始速度）
- **spring 阈值参数**：`restSpeed` 默认 0.1、`restDelta` 默认 0.01——判定动画结束的阈值
- **spring 简化写法**：`duration` + `bounce`（0~1，0 无回弹 1 最大回弹），比直接调 stiffness/damping/mass 更符合直觉，是文档更推荐的配置入口
- **易错点**：很多人凭记忆认为 stiffness 默认是 100，但当前官方文档明确默认值是 1，面试/笔试考「默认值」要以现行文档为准
- **inertia 参数**：`power` 默认 0.8、`timeConstant` 默认 700、`modifyTarget`、`min`/`max` 边界、`bounceStiffness` 默认 500、`bounceDamping` 默认 10
- **编排类公共参数**：`delay`、`repeat`（含 `Infinity`）、`repeatType`（`"loop"`/`"reverse"`/`"mirror"`）、`repeatDelay`、`delayChildren`、`when`（`"beforeChildren"`/`"afterChildren"`）
- **keyframes 数组写法**：`animate` 的值直接写数组即顺序播放；`null` 通配符表示「当前值」占位
- `null` 占位常用于「从当前位置出发，动一圈再回到目标值」这种模式
- keyframes 配合 `times` 精确控制每一帧的时间点，`times` 数组长度须与关键帧数组一致
- **spring 与 tween 本质区别**：tween 靠时间计算轨迹，spring 靠物理仿真收敛，因此 spring 的实际时长不是显式指定的，而是由参数收敛速度决定
- **进阶顺序**：本页 → [variants 编排与 gesture](./variants-and-gesture) → [退场与共享布局](./presence-and-layout) → [MotionValue 与独立 JS 版](./motionvalue-and-vanilla)

## 一、motion 组件：HTML/SVG 元素的替换品

`<motion.div>`、`<motion.circle>`、`<motion.svg>` 等是「HTML/SVG 元素的直接替换品」（drop-in replacement），覆盖每个标准标签。需要动画化的不是标准标签时：

```jsx
import { motion } from "motion/react"

// 自定义字符串标签（如 web component）
const MotionCustomTag = motion.create('custom-element')

// 自定义 React 组件包装：组件需要转发 ref
// React 18 用 forwardRef，React 19 可直接从 props 里拿 ref
const MyComponent = forwardRef(function MyComponent(props, ref) {
  return <div ref={ref}>{props.children}</div>
})
const MotionCustom = motion.create(MyComponent)
```

Props 分组一览：

| 分组 | props |
| --- | --- |
| 动画 | `initial` / `animate` / `exit` / `transition` / `variants` / `style` |
| 手势 | `whileHover` / `whileTap` / `whileFocus` / `whileDrag` / `whileInView` + 对应回调 `onHoverStart`/`onTap`/`onDragEnd` 等 |
| 拖拽 | `drag` / `dragConstraints` / `dragElastic` / `dragMomentum` / `dragTransition` |
| 布局 | `layout` / `layoutId` / `layoutDependency` / `layoutScroll` / `layoutRoot` |
| 高级 | `custom`（传给动态 variants 函数的数据）、`transformTemplate`（自定义 transform 属性顺序）、`inherit`（控制是否继承父级 variants 传播） |

**性能关键点**：这些属性的动画更新都走浏览器原生渲染管线，**不会触发 React 重渲染**——这是 Motion 能兼顾声明式 API 与高性能的核心原因，后面 [MotionValue](./motionvalue-and-vanilla) 会更深入解释这个机制。

## 二、initial / animate / exit 三态模型

```jsx
// 进入动画：从 initial 到 animate
function EnterButton() {
  return <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} />
}

// 跳过进入动画（首屏常用优化手法）
function SkipEntrance() {
  return <motion.div initial={false} animate={{ y: 100 }} />
}

// 退场动画必须配合 AnimatePresence（详见下一页）
function ToggleVisible({ isVisible }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </AnimatePresence>
  )
}
```

`animate` 目标值变化时自动补间到新值，无需手动重新触发；`initial={false}` 是常见的首屏优化手法，跳过组件挂载时的进入动画（避免首屏「闪一下」）。`exit` 与 `AnimatePresence` 的完整搭配规则（子元素 key、mode 三值）留到[退场与共享布局](./presence-and-layout)详细展开。

## 三、transition 详解（必考）

### 3.1 tween：时长驱动

```jsx
// duration + 缓动曲线；tween 是未显式指定 type 时的默认行为
<motion.div
  animate={{ opacity: 1 }}
  transition={{ type: "tween", duration: 0.5, ease: "easeInOut" }}
/>
```

tween 参数：

- `duration`（默认 **0.3 秒**，多关键帧时默认 **0.8 秒**）
- `ease`：`"linear"` / `"easeIn"` / `"easeOut"` / `"easeInOut"` / `"circIn"` / `"circOut"` / `"circInOut"` / `"backIn"` / `"backOut"` / `"backInOut"` / `"anticipate"`，或三次贝塞尔数组（如 `[.17,.67,.83,.67]`），或自定义函数 `(t) => t*t`
- `times`：自定义关键帧时间位置（0~1 数组）

### 3.2 spring：物理参数驱动

```jsx
// stiffness/damping/mass 三件套物理参数
<motion.div
  animate={{ x: 100 }}
  transition={{ type: "spring", stiffness: 300, damping: 20, mass: 1 }}
/>

// 简化写法：duration + bounce，更符合直觉，文档更推荐
<motion.div animate={{ x: 100 }} transition={{ type: "spring", duration: 0.8, bounce: 0.3 }} />
```

spring 物理参数（**官方文档明确给出的默认值**，来自 `/docs/react-transitions` 与 `/docs/spring` 两页交叉确认一致）：

- `stiffness`（默认 **1**）——数值越大动作越剧烈
- `damping`（默认 **10**）——阻力强度，为 0 则无限振荡
- `mass`（默认 **1**）——数值越大越迟滞
- `velocity` —— 初始速度
- `restSpeed`（默认 0.1）/ `restDelta`（默认 0.01）—— 判定动画结束的阈值
- 简化写法：`duration` + `bounce`（0~1，0 无回弹 1 最大回弹），比直接调 stiffness/damping/mass 更符合直觉，是文档更推荐的配置入口

> **易错点**：很多人凭记忆认为 stiffness 默认是 100，但当前官方文档（`/docs/react-transitions` 与 `/docs/spring` 两页一致）明确写的默认值是 `stiffness: 1`（数值很小，几乎不怎么动），因此实践中几乎总是显式传入 stiffness，不依赖默认值；面试/笔试若考「默认值」要以现行文档为准，不要直接照搬旧教程的 100。

### 3.3 inertia：初速度减速滑行

```jsx
// 根据初始速度做减速滑行，常用于甩动/惯性滚动收尾
<motion.div transition={{ type: "inertia", velocity: 50 }} />
```

inertia 参数：`power`（默认 0.8）、`timeConstant`（默认 700）、`modifyTarget`、`min`/`max` 边界、`bounceStiffness`（默认 500）、`bounceDamping`（默认 10）。

### 3.4 编排类公共参数

无论哪种 `type`，以下参数都可用：`delay`、`repeat`（含 `Infinity`）、`repeatType`（`"loop"`/`"reverse"`/`"mirror"`）、`repeatDelay`、`delayChildren`、`when`（`"beforeChildren"`/`"afterChildren"`）。`delayChildren`/`when` 主要用于父子编排，详见[variants 编排与 gesture](./variants-and-gesture)。

### 3.5 keyframes：关键帧数组

`animate` 的值直接写数组即顺序播放，`null` 通配符表示「当前值」占位，常用于「从当前位置出发再回到目标」，配合 `times` 精确控制每帧时间点：

```jsx
<motion.div animate={{ x: [0, 100, 0] }} />           // 顺序播放三个值
<motion.div animate={{ x: [null, 100, 0] }} />        // null = 当前值

<motion.circle
  animate={{ cx: [null, 100, 200] }}
  transition={{ duration: 3, times: [0, 0.2, 1] }}
/>
```

## 四、易错点

- **import 路径纠结**：`import ... from "framer-motion"` 目前仍然可以正常工作，当前版本下两个包功能完全一致，只是包名不同，不算错误代码，只是非推荐写法（推荐 `"motion/react"`）。
- **凭旧印象记错 spring 默认参数**：见上文 3.2 节的易错点提示，`stiffness` 现行默认值是 1，不是 100。
- **误以为 `exit` 单独生效**：`exit` prop 必须配合 `AnimatePresence` 才会触发，单独写在组件上、父级没有卸载检测机制时不会播放。

---

下一页：[variants 编排与 gesture](./variants-and-gesture)——命名动画态、父子传播、`stagger()` 编排与手势交互。
