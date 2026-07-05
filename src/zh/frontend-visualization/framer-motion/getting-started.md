---
layout: doc
outline: [2, 3]
---

# 入门：定位、更名史与第一个动画

> 基于 **Motion（原 Framer Motion）** 12.x（npm 实测 12.42.2）· 核于 2026-07

## 速查

- **Motion 是什么**：原名 **Framer Motion**，现名 **Motion**（[motion.dev](https://motion.dev)），同时支持 React / 独立 JavaScript / Vue
- **混合引擎（hybrid engine）**：优先用浏览器原生 WAAPI + ScrollTimeline 硬件加速，原生覆盖不了的场景（弹簧物理、手势追踪、跨渲染目标）回退到 JS 驱动的 `requestAnimationFrame`
- **npm 双包同步**：`motion` 与 `framer-motion` 版本号自 12.x 起完全一致（均为 12.42.2），是同一套源码的过渡期双发布策略
- **包名沿革坑**：`framer-motion` 才是动画库真正的血统包（2019 年起）；`motion` 这个包名 2013 年就已存在，最初是一个无关的 node 运动侦测库，2024 年底才被 Motion 团队接手用于发布动画库
- **12.0 对 React 版 API 无 breaking changes**：改名本身不影响既有代码写法，只是包名和 import 路径变了
- **安装**：`npm install motion`（也支持 `yarn add motion` / `pnpm add motion`）
- **导入**：`import { motion } from "motion/react"`
- 旧写法 `import { motion } from "framer-motion"` **目前仍然有效**，官方原文承认很多 AI 工具因训练数据陈旧仍生成这个，只是非当前推荐写法
- **React 版本要求**：18.2 及以上
- **开源与赞助**：MIT 完全开源，由 Framer、Figma 等公司赞助，无商业使用限制
- **CDN**：`https://cdn.jsdelivr.net/npm/motion@latest/+esm`，生产环境建议锁定具体版本号而非 `@latest`
- **Vue 支持是独立包 `motion-v`**（不是 `motion` 自带），配套 Nuxt 模块 `motion-v/nuxt`
- **Framer 与 Motion 的关系**：Framer 是无代码建站工具，其网站动画引擎本身就是 Motion；两者同源共生，但不是同一个产品
- **Framer 平台场景特例**：在 Framer 平台的 Code Component / Override 场景下，官方仍建议继续用 `framer-motion` 这个 import，这是官方给出的场景特例，非通用推荐
- **规模**：npm 月下载量超 3000 万次；vanilla mini 版 `animate()` 仅 2.3kb，hybrid 完整版 18kb（同类 GSAP 的 `animate` 体积 23.5kb）
- **声明式 API 心智**：加动画就是加 props（`animate`/`variants` 等），不需要 ref + 命令式调用，对 React/Vue 开发者零心智切换
- **一体化覆盖面**：手势、退场动画、滚动动画、共享布局动画都内置在同一套 API 体系下，覆盖面比单纯的数值插值库（如 react-spring）更广
- **布局动画是差异化亮点**：`layout`/`layoutId` 把只能手写 JS 计算的位置变化自动转成流畅过渡，业界少有方案做到这么开箱即用（详见[退场与共享布局](./guide-line/presence-and-layout)）
- **体积权衡**：完整 `motion` 组件包体积 34kb 比纯 WAAPI 手写方案更大，`LazyMotion` 可优化到 4.6kb 起步（详见[MotionValue 与独立 JS 版](./guide-line/motionvalue-and-vanilla)）
- **GSAP 时间线优势**：GSAP 的可变链式时间线可运行时动态插入/移除轨道，比 Motion 的数组声明式时间线更成熟灵活，这是官方也认可的 GSAP 优势点
- **`<motion.div>` 定位**：HTML/SVG 元素的直接替换品（drop-in replacement），覆盖每个标准标签
- **`initial` 与 `animate`**：定义进入动画的起止状态，`animate` 目标值变化会自动补间到新值
- **`transition` 的 `duration`**：单位是秒，基础用法先记时长
- **`whileHover` / `whileTap`**：基础悬停与点击手势
- **`AnimatePresence`**：让被卸载的组件先播放退场动画再真正移除（详见[退场与共享布局](./guide-line/presence-and-layout)）
- **`whileInView`**：元素滚动进入视口时触发动画
- **transition 三种 `type`**：`tween`（时长驱动）/ `spring`（物理驱动）/ `inertia`（初速度减速滑行）
- **tween `duration` 默认 0.3 秒**（多关键帧默认 0.8 秒）
- **spring 默认值（现行官方文档）**：`stiffness` 默认 **1**、`damping` 默认 10、`mass` 默认 1——很多人凭旧印象记成 stiffness 默认 100，现行文档已不是这个值
- **进阶顺序**：先吃透本页 → [motion 组件与 transition](./guide-line/motion-and-transition) → [variants 编排与 gesture](./guide-line/variants-and-gesture) → [退场与共享布局](./guide-line/presence-and-layout) → [MotionValue 与独立 JS 版](./guide-line/motionvalue-and-vanilla)

## 一、Motion 是什么：混合引擎 + 声明式定位

Motion（原 Framer Motion）是面向 React / 独立 JavaScript / Vue 的生产级动画库，核心卖点是**混合引擎（hybrid engine）**架构：优先调度浏览器原生 **Web Animations API（WAAPI）+ ScrollTimeline** 实现硬件加速的高帧率动画；遇到原生 API 覆盖不了的场景——弹簧物理、可中断关键帧、手势追踪、跨 DOM/SVG/Canvas/Three.js 的统一动画——时无缝回退到 JS 驱动的 `requestAnimationFrame`。这意味着大部分简单动画能拿到接近原生的性能，复杂交互又不必牺牲开发体验。

对 React 开发者，Motion 最本质的选型问题是「声明式还是命令式」：

| 维度 | **Motion** | GSAP | 原生 WAAPI |
| --- | --- | --- | --- |
| API 风格 | 声明式 props（`animate`/`variants` 等），React 心智零切换 | 命令式 ref + 方法调用，React 里需配合 `useGSAP` hook | 命令式 `Element.animate()`，零依赖 |
| 许可证 | MIT 完全开源，无商业限制 | 目前归 Webflow 所有 | 浏览器内置，零依赖 |
| spring 物理 | 内置 `transition.type: "spring"` | 需插件 | 不支持 |
| 时间线灵活度 | 数组声明式，支持跨 HTML/SVG/MotionValue/Three.js 混合序列 | 可变链式，运行时可动态插入/移除轨道，更成熟灵活（官方也认可的 GSAP 优势） | 无时间线概念，需手动编排 |
| 布局动画 | 内置 `layout`/`layoutId`，FLIP 高度封装 | 依赖手动 FLIP 实现 | 无 |
| 体积 | `animate()` hybrid 18kb（mini 2.3kb） | `animate` 部分 23.5kb，且引入任意功能即打包全部代码 | 0kb（浏览器内置） |
| 适用场景 | React/Vue 现代项目 + 一体化交互动画体系 | 复杂时间线编排、非 React 项目 | 简单内置动画、零依赖极致轻量 |

选型口径（官方 `/docs/gsap-vs-motion` 与 `/docs/improvements-to-the-web-animations-api-dx` 两页观点）：优先考虑整体性能、更小包体积、现代 React/Vue 开发体验时选 Motion；需要复杂时间线编排（尤其非 React 项目）时 GSAP 仍有独特价值；只需要简单内置动画、追求零依赖极致轻量时用原生 WAAPI 即可，不必引入 Motion。

## 二、更名史：从 Framer Motion 到 Motion（重要坑点）

**npm 实测（registry.npmjs.org 直查）**：`motion`（新包名）与 `framer-motion`（旧包名）最新版本均为 **12.42.2**，两包版本号自 12.x 起完全同步，说明当前是「同一套源码、双包名并行发布」的过渡期策略，功能上不是新旧分叉。旧包名 `framer-motion` **未被标记 deprecated**，仍可正常安装。

**包名沿革考古（易踩坑点——npm 元数据本身具有误导性）**：

- 真正的血统包是 `framer-motion`：npm 上 **2019-01-14** 发布 `0.0.1`，一路线性演进到 `11.18.2`，随后继续发布 12.x 系列。
- `motion` 这个 npm 包名**不是新注册的**——早在 **2013-12-26** 就已存在，最初是一个与动画库完全无关的包（一个 node.js 运动侦测库），断续更新到 `0.9.0`（2016 年）后长期无人维护。Motion 团队后续接手了这个闲置包名，从 `12.0.0-alpha.2`（2024-11-22）开始在其上发布现在这套动画库代码。**若只看 npm 页面「首次发布时间」会误以为 `motion` 包创建于 2013 年，实际动画库的血统应以 `framer-motion` 包 2019 年的历史为准。**
- React 侧迁移路径（官方 react-upgrade-guide 原文）：`npm uninstall framer-motion && npm install motion`；import 路径从 `import { motion } from "framer-motion"` 改为 `import { motion } from "motion/react"`。官方特别说明旧 import 路径「目前仍然有效，但推荐更新」。
- **12.0 版本对 React 版 API 无 breaking changes**（官方原文：该版本变化仅涉及 vanilla JS API），即改名本身不影响 React 使用者的既有代码写法，只是包名和 import 路径变了。
- Vue 支持是**独立的 npm 包 `motion-v`**（不是 `motion` 也不是 `motion/vue`），配套 Nuxt 模块 `motion-v/nuxt`、`unplugin-vue-components` 的 `MotionResolver()`。这是常被忽略的命名坑：不能类比 React 版直接假设装 `motion` 就自带 Vue 绑定。
- Motion 与 **Framer**（无代码网站构建器）的关系（官方原文）：「Framer 是世界上最好的无代码网站构建器，如果你有一个 Framer 网站，它的所有动画已经由 Motion 驱动」。即 Framer 网站的动画引擎本身就是 Motion；在 Framer 平台的 Code Component / Override 场景下，官方建议继续用 `framer-motion` 这个 import（这是官方给出的场景特例，非通用推荐）。两者是同源共生关系（Motion 最早由 Framer 内部孵化，现已独立为单独品牌与公司），不是同一个产品，也非全无关系。

## 三、安装

```bash
# 三种包管理器均可，二选一即可
npm install motion
yarn add motion
pnpm add motion
```

- **版本要求**：React 18.2 及以上。
- **CDN 方式**：`https://cdn.jsdelivr.net/npm/motion@latest/+esm`（ESM），官方建议生产环境锁定具体版本号而非 `@latest`。
- **体量参考**：npm 月下载量超 3000 万次；vanilla mini 版 `animate()` 仅 2.3kb，hybrid 完整版 18kb（对比同类 GSAP 的 `animate` 体积 23.5kb）；完整 React `motion` 组件预加载全部功能 34kb（[MotionValue 与独立 JS 版](./guide-line/motionvalue-and-vanilla)会介绍 `LazyMotion` 按需减包到 4.6kb 起步）。

## 四、第一个动画：motion 组件

```jsx
import { motion } from "motion/react"

// 最基础的动画组件：initial 是起始状态，animate 是目标状态
function FadeIn() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}  // 挂载时的初始态
      animate={{ opacity: 1, scale: 1 }}    // 自动补间到这个目标态
    >
      Hello Motion
    </motion.div>
  )
}
```

`<motion.div>` 是 HTML `<div>` 的直接替换品（drop-in replacement），`motion` 命名空间覆盖每个标准标签（`motion.div`、`motion.circle`、`motion.svg` ……）。`animate` 的目标值发生变化时会**自动补间**到新值，不需要手动重新触发或手写关键帧；`initial={false}` 是常见的首屏优化手法——跳过组件挂载时的进入动画，避免首屏「闪一下」：

```jsx
// 跳过进入动画：常用于已经在页面中、不需要"飞入"效果的元素
<motion.div initial={false} animate={{ y: 100 }} />
```

**退场动画**（`exit` prop）必须配合 `AnimatePresence` 才会生效——组件从 React 树移除时先播放 `exit` 动画再真正卸载，这部分留到[退场与共享布局](./guide-line/presence-and-layout)详细展开。

## 五、transition 概览

每个动画都可以配一个 `transition` 描述「怎么动」，核心是 `type` 字段，三选一：

```jsx
// tween：时长 + 缓动曲线驱动，默认 type，适合"简单渐变/位移"
<motion.div animate={{ opacity: 1 }} transition={{ type: "tween", duration: 0.5 }} />

// spring：物理参数驱动，适合"有质感的弹跳/跟手"效果
<motion.div animate={{ x: 100 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} />

// inertia：根据初始速度做减速滑行，常用于甩动/惯性滚动收尾
<motion.div transition={{ type: "inertia", velocity: 50 }} />
```

`tween` 的 `duration` 默认 **0.3 秒**（多关键帧时默认 0.8 秒）；`spring` 的物理参数里最容易踩的坑是 `stiffness`——现行官方文档明确默认值是 **1**（数值很小，几乎不怎么动），而不是很多人凭旧教程记忆的 100，实践中几乎总要显式传入。这三种 type 的完整参数表、编排参数（`delay`/`repeat`/`when` 等）与 keyframes 数组写法，在下一页[motion 组件与 transition](./guide-line/motion-and-transition)逐一展开。

跑通第一个动画后，按顺序进阶：[motion 组件与 transition](./guide-line/motion-and-transition)先补全三态模型与 transition 全部参数，再到[variants 编排与 gesture](./guide-line/variants-and-gesture)学命名动画态与手势交互。
