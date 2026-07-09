---
layout: doc
---

# Framer Motion

**Motion**（[motion.dev](https://motion.dev)，包名 `motion`）——很多人仍按老名字「**Framer Motion**」称呼它，这是它 2019～2025 年的名字，旧包名 `framer-motion` 目前仍可正常安装、未被标记废弃，但官方已明确推荐改用新包名与新 import 路径。改名不改血统：两个包版本号自 12.x 起完全同步（当前均为 **12.42.2**），是「同一套源码、双包名并行发布」的过渡期策略，且 12.0 对 React 版 API **无 breaking changes**——即改名本身不影响既有代码写法，只是包名和 import 路径变了。

一句话定位：Motion 是面向 **React / 独立 JavaScript / Vue** 的生产级动画库，采用**混合引擎（hybrid engine）**架构——优先调度浏览器原生 Web Animations API + ScrollTimeline 实现硬件加速的高帧率动画，遇到原生 API 覆盖不了的场景（弹簧物理、可中断关键帧、手势追踪、跨 DOM/SVG/Canvas/Three.js 的统一动画）时无缝回退到 JS 驱动的 `requestAnimationFrame`。npm 月下载量超 **3000 万次**，是 React 生态事实标准的动画库，由 Framer、Figma 等公司赞助，MIT 完全开源。

## 评价

**优点**

- **声明式 API 贴合 React 心智**：`initial` / `animate` / `exit` / `variants` / `transition` 等 props 直接描述动画，避免 GSAP 式「ref + 命令式调用」在 React 里的违和感与额外样板代码
- **布局动画是杀手级差异化能力**：`layout` / `layoutId` 把只能靠手写 JS 计算的布局变化（对齐切换、列表增删导致的位置重排）自动转成流畅过渡，背后是高度封装的 FLIP 技术，业界少有方案做到这么开箱即用
- **一体化覆盖面广**：手势（drag/hover/tap/focus/inView）、退场动画（`AnimatePresence`）、滚动动画（`useScroll`/`whileInView`）都内置在同一套 API 体系下，比单纯的数值插值库（如 react-spring）覆盖面更广，几乎不需要拼接第三方手势库
- **同一套语义横跨三端**：React / 独立 JS / Vue（Vue 是独立包 `motion-v`）共享同一套动画心智
- **相对原生 WAAPI 有明确增强**：自定义缓动（含 spring）、单位自动推导、`finished` Promise 兼容性 polyfill、秒为单位更直观、结束态保持、独立变换轴分别动画等

**缺点**

- 完整 `motion` 组件包体积（34kb）比纯 WAAPI 手写方案更大，虽有 `LazyMotion` 优化到 4.6kb 起步，但需要额外配置
- 复杂可视化编排的运行时灵活度不如 GSAP 可变链式 timeline 成熟——GSAP 时间线可在运行时动态插入/移除轨道，这是官方也承认的 GSAP 优势点
- 很多 AI 代码生成工具因训练数据陈旧仍生成旧包名 `framer-motion` 的 import，虽然目前仍能正常工作，但认知成本会持续到旧资料被淘汰

## 本叶地图

- [入门](./getting-started) —— React 声明式动画 vs GSAP/原生 WAAPI 的定位、更名史（Framer Motion → Motion）与安装、`motion` 组件的第一个动画、transition 概览
- [motion 组件与 transition](./guide-line/motion-and-transition) —— `motion.create` 自定义组件、props 五大分组、`initial`/`animate`/`exit` 三态模型、tween/spring/inertia 参数详解、keyframes 数组
- [variants 编排与 gesture](./guide-line/variants-and-gesture) —— 命名动画态、父子传播、`when` + `stagger()` 编排、动态 variants、`whileHover`/`whileTap`/drag 完整配置、`whileInView`
- [退场与共享布局](./guide-line/presence-and-layout) —— `AnimatePresence` 的 `sync`/`wait`/`popLayout` 三种 mode、`layout`/`layoutId` 共享元素动画、`LayoutGroup` 命名空间隔离
- [MotionValue 与独立 JS 版](./guide-line/motionvalue-and-vanilla) —— `useMotionValue`/`useTransform`/`useSpring`、`useScroll` 滚动动画与 `useAnimate` 命令式动画、SVG 动画、`MotionConfig`/`LazyMotion`、vanilla `animate()`/`scroll()`
- [参考](./reference) —— props/hooks/transition 参数速查表 + vs GSAP/WAAPI/react-spring 选型对比 + 资源链接

## 文档地址

[Motion 官方文档](https://motion.dev) —— React / JS / Vue 三端文档一体，`/docs/react-*` 系列为核心必考区

## GitHub 地址

[motiondivision/motion](https://github.com/motiondivision/motion)

## 幻灯片地址

<a href="/SlideStack/framer-motion-slide/" target="_blank">Framer Motion</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=framer-motion" target="_blank" rel="noopener noreferrer">Framer Motion 测试题</a>
