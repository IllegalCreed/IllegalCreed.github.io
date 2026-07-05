---
layout: doc
outline: [2, 3]
---

# variants 编排与 gesture 手势

> 基于 **Motion（原 Framer Motion）** 12.x（npm 实测 12.42.2）· 核于 2026-07

## 速查

- **variants**：命名动画态（对象里放多个具名 state），`initial`/`animate`/`whileHover` 等 prop 直接传名字字符串而非对象
- variants 对象结构：每个 key 是一个具名 state，值就是普通的动画目标对象（如 `{ opacity: 1 }`）
- 一个元素可同时应用多个 variant 名：`animate` 传数组
- **父子传播（propagation）**：子组件不必重复写 `initial`/`animate`，只需声明匹配的 variant 名，会自动从父级继承
- 父子传播的价值：省去逐层重复写 `initial`/`animate`，只要子级 `variants` 里有同名 key 就能自动响应父级触发
- **编排控制**：`when`（`"beforeChildren"`/`"afterChildren"`）+ `delayChildren` + `stagger()` 辅助函数实现错列动画
- `when: "beforeChildren"` 让父级先播完自身动画再触发子级；`"afterChildren"` 则反过来先播子级
- `stagger()` 传入的秒数是相邻子元素之间的**错开间隔**，不是动画总时长
- **动态 variants**：variant 值写成函数形式，配合 `custom` prop 给每个元素传入不同参数（如索引实现延迟错列）
- 动态 variants 函数不仅能返回目标值，也能返回完整的 `transition` 配置（如按 index 计算 delay）
- **`whileHover`/`whileTap`/`whileFocus`**：基础手势，对应回调 `onHoverStart`/`onHoverEnd` 等
- 手势回调收到原生事件对象，可用来做非动画的副作用（如埋点、音效）
- 手势 prop 可以传 variant 名字符串，复用同一套 variants 驱动多种触发条件
- **`onPan`**：平移追踪手势，区别于 `drag`（`drag` 会真正移动元素，`onPan` 只是追踪坐标）
- `onPan` 更适合需要精细控制坐标、而非直接移动元素的自定义手势层（如滑动关闭面板的判定逻辑）
- **drag 基础**：`<motion.div drag />` 双轴自由拖拽；`drag="x"` 单轴 + `dragDirectionLock` 方向锁定
- `dragDirectionLock` 常配合 `onDirectionLock` 回调使用，锁定方向后可做进一步的 UI 反馈
- **`dragConstraints` 两种形式**：像素对象（`{ top, left, right, bottom }`）或容器 `ref`（二选一）
- **`dragElastic`**：越界弹性系数；**`dragMomentum`**：是否保留松手后的惯性滑行（默认开启）
- **`dragTransition`**：配置回弹弹簧参数（`bounceStiffness`/`bounceDamping`）
- **`whileDrag`**：拖拽中视觉反馈（如放大、加阴影）
- **`onDrag` 回调**：收到的 `info` 带 `point`/`delta`/`offset`/`velocity`
- `info.velocity` 除了读值，也常用于甩动结束后手动判断自定义惯性效果
- **`useDragControls`**：手动控制拖拽起始，用于从专门的「拖拽把手」元素发起拖拽
- 常见搭配写法：容器本身 `dragListener` 设为 false，把真正的拖拽入口交给专门的把手元素
- `dragControls.start` 支持 `snapToCursor` 选项，点击把手瞬间让被拖拽元素对齐到光标位置
- **`whileInView`**：元素滚动进入视口时触发一次性动画（滚动**触发**式，区别于滚动**链接**式的 `useScroll`，后者留到[下一页](./motionvalue-and-vanilla)）
- **`viewport` 常用配置**：`once`（只触发一次，默认 false）、`amount`（`"some"`/`"all"`/0~1，默认 `"some"`）、`margin`（默认 `"0px"`，可四值调整检测区域）、`root`（自定义滚动容器）
- `margin` 支持类似 CSS margin 的四值写法，可用负值让触发时机提前或推迟
- **进阶顺序**：本页 → [退场与共享布局](./presence-and-layout) → [MotionValue 与独立 JS 版](./motionvalue-and-vanilla) → [参考](../reference)

## 一、variants：命名动画态（必考）

命名动画态 + 父子编排是 Motion 最具「框架感」的能力：

```jsx
const variants = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
}

// initial/whileInView/exit 都直接传 variant 名字符串，而不是对象
function FadeCard() {
  return <motion.div variants={variants} initial="hidden" whileInView="visible" exit="hidden" />
}

// 同时应用多个 variant 名
function DangerCard() {
  return <motion.div animate={["visible", "danger"]} />
}
```

## 二、父子传播（propagation）

子组件不必重复写 `initial`/`animate`，只需声明匹配的 variant 名，会自动从父级继承：

```jsx
const list = { visible: { opacity: 1 }, hidden: { opacity: 0 } }
const item = { visible: { opacity: 1, x: 0 }, hidden: { opacity: 0, x: -100 } }

function List() {
  return (
    <motion.ul initial="hidden" whileInView="visible" variants={list}>
      <motion.li variants={item} />
      <motion.li variants={item} />
    </motion.ul>
  )
}
```

## 三、编排控制：when + delayChildren + stagger()

```jsx
import { stagger } from "motion/react"

// 父级 visible 时先播完自己再播子级（beforeChildren）
// delayChildren 用 stagger(0.3) 让每个子级错开 0.3 秒依次入场
const list = {
  visible: { opacity: 1, transition: { when: "beforeChildren", delayChildren: stagger(0.3) } },
  hidden: { opacity: 0, transition: { when: "afterChildren" } },
}
```

## 四、动态 variants：函数形式 + custom prop

```jsx
const variants = {
  hidden: { opacity: 0 },
  // variant 值可以是函数，收到组件的 custom prop 作为参数
  visible: (index) => ({ opacity: 1, transition: { delay: index * 0.3 } }),
}

function StaggeredList({ items }) {
  return items.map((item, index) => (
    <motion.div key={item.id} custom={index} variants={variants} initial="hidden" animate="visible" />
  ))
}
```

## 五、gesture 手势（必考）

```jsx
function HoverButton() {
  return (
    <motion.button
      whileHover={{ scale: 1.2, transition: { duration: 1 } }}
      whileTap={{ scale: 0.9, rotate: 3 }}
      whileFocus={{ scale: 1.2 }}
      onHoverStart={(e) => {}}
      onHoverEnd={(e) => {}}
    />
  )
}

// 用 variants 名字驱动手势（可复用同一套 variants 给多种触发条件）
function IconButton() {
  return (
    <motion.button whileTap="tap" whileHover="hover" variants={buttonVariants}>
      <svg><motion.path variants={iconVariants} /></svg>
    </motion.button>
  )
}

// pan 手势（平移追踪，区别于 drag：drag 会真正移动元素，onPan 只追踪坐标）
function PanTracker() {
  return <motion.div onPan={(e, info) => {}} />
}
```

## 六、drag 完整配置

```jsx
<motion.div drag />                                                       // 双轴自由拖拽
<motion.div drag="x" dragDirectionLock onDirectionLock={(axis) => {}} />  // 轴锁定 + 方向锁定

// 约束范围：像素对象 或 容器 ref（二选一）
<motion.div drag dragConstraints={{ top: -50, left: -50, right: 50, bottom: 50 }} />

function ConstrainedDrag() {
  const constraintsRef = useRef(null)
  return (
    <motion.div ref={constraintsRef}>
      <motion.div drag dragConstraints={constraintsRef} />
    </motion.div>
  )
}

// 越界弹性 + 惯性开关 + 回弹弹簧 + 拖拽中视觉反馈 + 拖拽回调，可组合使用
function FullDragConfig() {
  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 300 }}
      dragElastic={0.1}                                              // 越界弹性系数
      dragMomentum={false}                                           // 关闭松手后的惯性滑行
      dragTransition={{ bounceStiffness: 600, bounceDamping: 10 }}   // 回弹弹簧参数
      whileDrag={{ scale: 1.1, boxShadow: "0px 10px 20px rgba(0,0,0,0.2)" }}
      onDrag={(e, info) => console.log(info.point.x, info.delta, info.offset, info.velocity)}
    />
  )
}

// 手动控制拖拽起始（如从专门的"拖拽把手"元素发起）
function HandleDrag() {
  const dragControls = useDragControls()
  return <motion.div drag dragListener={false} dragControls={dragControls} />
  // 把手元素上调用：dragControls.start(event, { snapToCursor: true })
}
```

## 七、whileInView：滚动进入视口触发

```jsx
// viewport 常用配置：once（只触发一次，默认 false）、amount（"some"/"all"/0~1，默认 "some"）、
// margin（默认 "0px"，可四值调整检测区域）、root（自定义滚动容器）
function RevealOnScroll() {
  return <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} />
}
```

`whileInView` 是**滚动触发**式动画——元素进/出视口时触发一次性动画。如果需要动画值**连续跟手**地绑定滚动位置（滚动**链接**式），或者需要在命令式/副作用场景用状态判断是否在视口内，要用 `useScroll`/`useInView`，留到[下一页](./motionvalue-and-vanilla)详细展开。

## 易错点

- **variant 名字拼错或不匹配**：父子传播依赖子组件声明的 variant 名与父级 `variants` 对象里的 key 完全一致，拼错则子级不会跟随触发。
- **动态 variants 忘记传 `custom`**：variant 写成函数形式但组件没传 `custom` prop，函数收到的参数是 `undefined`。
- **`dragConstraints` 传 ref 却忘记外层也是 `motion` 组件**：`dragConstraints={constraintsRef}` 要求 ref 挂载在真实存在的父级 DOM 节点上，普通 `<div ref={constraintsRef}>` 也可以，不强制外层必须是 `motion` 组件。
- **`onPan` 和 `drag` 混淆**：`onPan` 只做坐标追踪回调，不会移动元素本身；要元素跟手移动必须用 `drag`。
- **`whileInView` 触发条件想当然**：默认 `amount: "some"`、`once: false`，意味着元素反复进出视口会反复触发，需要「只播一次」必须显式设置 <code v-pre>viewport={{ once: true }}</code>。

---

下一页：[退场与共享布局](./presence-and-layout)——`AnimatePresence` 的三种 mode 与 `layout`/`layoutId` 共享元素动画。
