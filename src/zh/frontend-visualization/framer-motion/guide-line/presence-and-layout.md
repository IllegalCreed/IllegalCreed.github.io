---
layout: doc
outline: [2, 3]
---

# 退场与共享布局：AnimatePresence 与 layout 动画

> 基于 **Motion（原 Framer Motion）** 12.x（npm 实测 12.42.2）· 核于 2026-07

## 速查

- **`AnimatePresence` 作用**：包裹 `motion` 组件后，组件从 React 树移除时能先播放 `exit` 动画再真正卸载——本质是「检测直接子元素何时被移除」并延迟真实 DOM 移除的时机
- **强制要求一**：所有直接子元素必须有**唯一且稳定**的 `key`（不要用数组 index，尤其列表可能重排序时）
- **强制要求二**：条件判断要写在 `AnimatePresence` **内部**（作为 children），而不是把 `AnimatePresence` 整体包在条件外层
- `key` 变化的本质：React 视为不同元素才会触发「旧元素 exit + 新元素 enter」，key 不变则只是同一元素做属性过渡
- **`mode="sync"`**（默认）：新旧元素同时进出，无先后顺序，适用一般场景
- **`mode="wait"`**：新元素等旧元素完全退场后才进入，同一时刻只渲染一个子元素，典型场景是轮播图、逐项切换
- **`mode="popLayout"`**：退场元素立即脱离文档流，周围元素同步重排，典型场景是配合 `layout` 的列表删除动画
- **`popLayout` 坑**：要求父元素 `position` 非 `static`，否则退场元素脱离文档流后周围元素不会正确重排
- **嵌套 `AnimatePresence`**：内层默认会阻止子元素退场动画向上传播，需显式设置 `propagate` 为真
- **`custom` prop**：把动态数据（如滑动方向）传给 `exit`/`animate` 的动态 variants 函数，典型用例是轮播图按滑动方向决定进出场方向
- **`layout` prop**：自动为尺寸/位置变化设置过渡，哪怕是通常不可动画的 CSS 属性（如 `justify-content` 切换）也能过渡
- 布局相关 props 还有 `layoutDependency`/`layoutScroll`/`layoutRoot`，用于更细粒度的布局测量时机与滚动容器场景控制
- **`layoutId`（Magic Motion）**：共享元素动画——新组件挂载时匹配相同 `layoutId` 会自动从旧组件「飞」过去
- **`AnimatePresence` + `layoutId` 组合**：能让共享元素保留到退场动画播完，常用于「点开详情又飞回列表」这类交互
- **`LayoutGroup`**：让多个独立组件的布局变化互相感知、同步触发；传 `id` 可给 `layoutId` 建命名空间避免多实例冲突
- `LayoutGroup` 典型场景：多个独立 `Accordion` 互相感知展开态、一行 Tab 共享同一条移动下划线
- **`layout="position"`**：只动画位置，尺寸瞬间切换，用于纵横比会变化的元素（如图片）
- **挤压失真问题**：`layout` 动画全部通过 `transform` 实现以保证性能，会带来子元素/圆角/阴影的「挤压失真」
- **挤压失真修正**：Motion 会自动修正——子元素同样加 `layout` 即可避免失真，`borderRadius`/`boxShadow` 写在 `style` 里会自动做逆向补偿
- **历史注记（5.0 之前）**：Framer Motion 5.0 之前需要 `AnimateSharedLayout` 包裹才能做共享元素动画
- **历史注记（5.0 起）**：改为全局单一测量树，`layoutId` 直接生效，不再需要包裹组件
- **5.0 之后的副作用**：所有 `layoutId` 默认全局共享作用域，多实例组件需要 `LayoutGroup` 的 `id` 找回旧版的「局部作用域」效果
- **exit 与直接子级限制**：`exit` 必须是 `AnimatePresence` 的直接子级，中间多包一层普通元素会导致侦测不到
- **Vue 版更严格**：同样要求直接子级 + 稳定 key，但受 Vue Transition 机制限制约束更严，详见[下一页](./motionvalue-and-vanilla)
- **`popLayout` 搭配列表项 `layout`**：被删除项脱离文档流的同时，其余列表项因为也带 `layout` 会平滑滑动补位，而不是瞬间跳位
- **`layout` 与 `layoutId` 一句话区别**：`layout` 管自身尺寸/位置变化的过渡，`layoutId` 管跨组件、跨渲染时机的共享位置飞跃
- **`AnimatePresence` 常见应用场景**：不止配合列表删除，路由切换、Tab 切换、Modal/Toast 等一切「先播完退场再真正卸载」的场景都适用
- **`propagate` 的作用范围**：设为真值后子级 `AnimatePresence` 的退场状态会一路上报给最外层，多层嵌套弹窗/抽屉常用到
- **`layoutId` 飞跃的实现原理**：本质是首尾两帧做位置和尺寸的 FLIP 插值，中间过程由 Motion 自动计算，不需要开发者手写起止坐标
- **进阶顺序**：本页 → [MotionValue 与独立 JS 版](./motionvalue-and-vanilla) → [参考](../reference)

## 一、AnimatePresence 作用与直接子级规则

作用：包裹 `motion` 组件后，组件从 React 树移除时能先播放 `exit` 动画再真正卸载——本质是「检测直接子元素何时被移除」并延迟真实 DOM 移除的时机。

强制要求：条件判断要写在 `AnimatePresence` **内部**（作为 children），而不是把 `AnimatePresence` 整体包在条件外层：

```jsx
// 错误：条件在外层，AnimatePresence 侦测不到"移除"事件
function WrongUsage({ isVisible }) {
  return (
    isVisible && (
      <AnimatePresence>
        <Component />
      </AnimatePresence>
    )
  )
}

// 正确：条件写在 AnimatePresence 内部
function CorrectUsage({ isVisible }) {
  return (
    <AnimatePresence>
      {isVisible && <motion.div key="modal" exit={{ opacity: 0 }} />}
    </AnimatePresence>
  )
}
```

## 二、key 唯一稳定规则

所有直接子元素必须有**唯一且稳定**的 `key`，不要用数组 index——列表可能重排序/删除时，用 index 当 key 会导致 `AnimatePresence` 错误匹配元素，退场动画播在错误的项上；应使用元素自身稳定的 ID。

## 三、mode：sync / wait / popLayout

| mode | 行为 | 场景 |
| --- | --- | --- |
| `sync`（默认） | 新旧元素同时进出，无先后顺序 | 一般场景 |
| `wait` | 新元素等旧元素完全退场后才进入（同一时刻只渲染一个子元素） | 轮播图、逐项切换 |
| `popLayout` | 退场元素立即脱离文档流，周围元素同步重排 | 配合 `layout` 的列表删除动画 |

```jsx
function ImageCarousel({ image }) {
  return (
    <AnimatePresence mode="wait">
      <motion.img key={image.src} initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} />
    </AnimatePresence>
  )
}

function DeletableList({ items }) {
  return (
    <AnimatePresence mode="popLayout">
      {items.map(item => <motion.li layout key={item.id} exit={{ opacity: 0 }} />)}
    </AnimatePresence>
  )
}

// custom 把动态数据（如滑动方向）传给 exit/animate 的动态 variants 函数
function Slideshow({ activeSlideId, swipeDirection }) {
  return (
    <AnimatePresence custom={swipeDirection}>
      <Slide key={activeSlideId} />
    </AnimatePresence>
  )
}
```

坑点：`popLayout` 要求父元素 `position` 非 `static`；嵌套 `AnimatePresence` 时内层默认会阻止子元素退场动画向上传播，需要显式设置 `propagate` 为真值才能让退场动画继续向上级传播。

## 四、layout 动画：自动过渡尺寸/位置

```jsx
// 自动为尺寸/位置变化设置过渡（哪怕是通常不可动画的 CSS 属性，如 justify-content 切换）
function ToggleAlign({ isOn }) {
  return <motion.div layout style={{ justifyContent: isOn ? "flex-start" : "flex-end" }} />
}
```

## 五、layoutId 共享元素动画（Magic Motion）

```jsx
// layoutId：共享元素动画（Magic Motion）——新组件挂载匹配 layoutId 会自动从旧组件"飞"过去
function TabUnderline({ isSelected }) {
  return isSelected && <motion.div layoutId="underline" />
}

// 配合 AnimatePresence 让共享元素保留到退场动画播完
function Modal({ isOpen }) {
  return <AnimatePresence>{isOpen && <motion.div layoutId="modal" />}</AnimatePresence>
}
```

## 六、LayoutGroup 多实例隔离命名空间

`LayoutGroup` 让多个独立组件的布局变化互相感知、同步触发；传 `id` 可给 `layoutId` 建命名空间避免多实例冲突：

```jsx
import { LayoutGroup } from "motion/react"

function List() {
  return (
    <LayoutGroup>
      <Accordion />
      <Accordion />
    </LayoutGroup>
  )
}

function TabRow({ id, items }) {
  return (
    <LayoutGroup id={id}>
      {items.map(i => <Tab {...i} />)}
    </LayoutGroup>
  )
}
```

## 七、layout="position"：只动画位置

```jsx
// layout="position"：只动画位置，尺寸瞬间切换（用于纵横比会变化的元素，如图片）
function ResponsiveImage() {
  return <motion.img layout="position" />
}
```

## 八、性能与视觉修正：挤压失真

Motion 的 layout 动画全部通过 `transform` 实现以保证性能，但会带来子元素/圆角/阴影的「挤压失真」——Motion 会自动修正：子元素同样加 `layout` 即可避免失真；`borderRadius`/`boxShadow` 写在 `style` 里 Motion 会自动做逆向补偿。

## 九、历史注记：AnimateSharedLayout 到全局测量树

Framer Motion 5.0 之前需要 `AnimateSharedLayout` 包裹才能做共享元素动画，5.0 起改为全局单一测量树，`layoutId` 直接生效（不再需要包裹组件），但也因此所有 `layoutId` 默认全局共享作用域，需要 `LayoutGroup` 的 `id` 找回旧版的「局部作用域」效果。

## 易错点

- **条件位置写反**：条件判断必须写在 `AnimatePresence` **内部**（作为 children），不能把整个 `AnimatePresence` 包在条件外层——包在外层时组件根本不会经历「移除」，退场动画不会触发。
- **key 用了数组 index**：列表可能重新排序/删除时，用 index 当 key 会导致 `AnimatePresence` 错误匹配元素，退场动画播在错误的项上；应使用元素自身稳定的 ID。
- **exit 必须是 AnimatePresence 的直接子级**：中间多包一层普通 `<div>` 会导致 exit 侦测不到；这一限制在 Vue 版因 Vue Transition 机制而更严格（详见[下一页](./motionvalue-and-vanilla)的 Vue 简述）。
- **popLayout 模式缺少定位上下文**：父元素若是默认 `position: static`，`popLayout` 模式下退场元素脱离文档流后，周围元素不会正确按预期重排。
- **layoutId 全局作用域意外冲突**：5.0 版本之后同名 `layoutId` 默认在全局单一测量树里生效，多个列表/多个组件实例如果用了相同 `layoutId` 会互相「抢跑」产生错误的共享动画，需要 `LayoutGroup` 的 `id` 隔离。

---

下一页：[MotionValue 与独立 JS 版](./motionvalue-and-vanilla)——不触发重渲染的动画值、滚动动画、命令式动画与 vanilla JS API。
