---
layout: doc
outline: [2, 3]
---

# 参考：Motion（Framer Motion）props / hooks / transition 速查

> 基于 **Motion（原 Framer Motion）** 12.x（npm 实测 12.42.2）· 核于 2026-07

## 速查

- **改名**：原名 Framer Motion，现名 Motion（motion.dev）；包名 `motion` / 旧包名 `framer-motion` 版本号自 12.x 起同步（均 12.42.2），12.0 对 React API 无 breaking changes
- **安装**：`npm install motion` + `import { motion } from "motion/react"`；React 18.2+
- **`<motion.div>`**：HTML/SVG 元素的直接替换品；`motion.create()` 包装自定义标签/组件
- **props 五大分组**：动画（initial/animate/exit/transition/variants/style）、手势（whileHover/whileTap/whileFocus/whileDrag/whileInView）、拖拽（drag/dragConstraints/dragElastic/dragMomentum/dragTransition）、布局（layout/layoutId/layoutDependency/layoutScroll/layoutRoot）、高级（custom/transformTemplate/inherit）
- **三态模型**：initial → animate（自动补间）→ exit（须配合 AnimatePresence）
- **transition.type**：tween（时长驱动）/ spring（物理驱动）/ inertia（初速度减速滑行）
- **spring 默认值**：stiffness=1、damping=10、mass=1（易错点：常被误记成 stiffness=100）
- **tween 默认**：duration 0.3s（多关键帧 0.8s）
- **variants**：命名动画态 + 父子传播（propagation）+ `when`/`delayChildren`/`stagger()` 编排 + 动态函数 variants（配 `custom`）
- **drag**：`dragConstraints` 像素对象或 ref；`dragElastic`/`dragMomentum`/`dragTransition`/`whileDrag`；`useDragControls` 手动起始
- **AnimatePresence**：直接子级 + 唯一稳定 key；条件写内部不写外层；mode 三值 sync/wait/popLayout
- **layout**：自动过渡尺寸/位置；`layoutId` 共享元素动画（Magic Motion）；`LayoutGroup` 隔离命名空间
- **MotionValue**：`useMotionValue`/`.set()`/`.get()` 不触发 React 重渲染；`useTransform` 区间映射；`useSpring` 弹簧跟随
- **滚动**：`whileInView` 触发式；`useScroll` 链接式（`scrollYProgress`）；`useInView` 命令式布尔 hook
- **`useAnimate`**：命令式动画，选择器只在 `scope` 子树内生效
- **SVG**：`pathLength`/`pathSpacing`/`pathOffset` 描边动画（0~1 进度值）
- **`MotionConfig`**：全局默认 transition；`reducedMotion` 三值 user/always/never（默认 never）
- **`LazyMotion`**：`m` 组件替代 `motion` 组件减包；`domAnimation`(+15kb)/`domMax`(+25kb)；`strict` 模式防误用
- **vanilla 版**：同包不同 import 路径（根导入非 `motion/react`）；`animate()`/`scroll()`/`stagger()`/`arc()`
- **vanilla 时间线**：`sequence` 数组 + `at` 相对时间语法（`<`/`+0.5`/`-0.2`/标签引用）
- **Vue 版**：独立包 `motion-v`；手势 prop 名 `whilePress`（非 `whileTap`）
- **体积**：`motion` 组件 34kb；`m` 组件基础 4.6kb；vanilla mini 2.3kb / hybrid 18kb（GSAP animate 23.5kb）
- **npm 月下载量**：超 3000 万次
- **包名沿革坑**：`motion` 包名 2013 年曾属于无关的 node 运动侦测库，`framer-motion` 包（2019 年起）才是动画库真实血统源头
- **keyframes**：`animate` 值写数组即顺序播放，`null` 占位当前值，配合 `times` 精确控制每帧时间点
- **gesture 复用技巧**：`whileHover`/`whileTap` 等可直接传 variant 名字符串，复用同一套 `variants` 驱动多种触发条件
- **AnimatePresence 的 `custom` prop**：把方向等动态数据传给 `exit`/`animate` 的动态 variants 函数
- **layout 挤压失真修正**：Motion 自动补偿，子元素同样加 `layout` 即可避免失真，`borderRadius`/`boxShadow` 会自动逆向补偿
- **`useReducedMotion`**：手动响应「减少动态」系统偏好的 hook，返回布尔值，配合条件渲染降级动画
- **选型**：声明式 React/Vue 项目首选 Motion；复杂可变时间线编排/非 React 项目 GSAP 仍有优势；零依赖极简场景用原生 WAAPI；只需数值插值 + 弹簧物理单一能力选 react-spring

## 一、组件与安装速查

| 项 | 内容 |
| --- | --- |
| 现行包名 | `motion` |
| 旧包名（仍可用，非推荐） | `framer-motion` |
| 当前版本 | 12.42.2（两包同步） |
| 安装 | `npm install motion` / `yarn add motion` / `pnpm add motion` |
| React 导入 | `import { motion } from "motion/react"` |
| Next.js 降体积导入 | `import * as motion from "motion/react-client"`（需配合 `"use client"` 或替代之） |
| vanilla 导入 | `import { animate, scroll, stagger, arc } from "motion"`（根导入） |
| Vue 包名 | `motion-v`（独立包，非 `motion/vue`） |
| React 版本要求 | 18.2 及以上 |
| CDN | `https://cdn.jsdelivr.net/npm/motion@latest/+esm`（生产建议锁定版本号） |
| 自定义标签/组件 | `motion.create('custom-element')` / `motion.create(Component)`（组件需转发 ref） |

## 二、props 分组总表

| 分组 | props |
| --- | --- |
| 动画 | `initial` `animate` `exit` `transition` `variants` `style` |
| 手势 | `whileHover` `whileTap` `whileFocus` `whileDrag` `whileInView` + `onHoverStart`/`onHoverEnd`/`onTap`/`onDragEnd` 等回调 |
| 拖拽 | `drag` `dragConstraints` `dragElastic` `dragMomentum` `dragTransition` `dragDirectionLock` |
| 布局 | `layout` `layoutId` `layoutDependency` `layoutScroll` `layoutRoot` |
| 高级 | `custom`（动态 variants 数据）`transformTemplate`（自定义 transform 顺序）`inherit`（variants 继承开关） |

## 三、transition 参数速查表

| type | 参数 | 默认值 | 说明 |
| --- | --- | --- | --- |
| tween | `duration` | 0.3s（多关键帧 0.8s） | 时长 |
| tween | `ease` | — | 预设字符串 / 三次贝塞尔数组 / 自定义函数 |
| tween | `times` | — | 关键帧时间位置（0~1 数组） |
| spring | `stiffness` | **1** | 越大越剧烈；易错点：常被误记成 100 |
| spring | `damping` | 10 | 阻力，0 则无限振荡 |
| spring | `mass` | 1 | 越大越迟滞 |
| spring | `velocity` | — | 初始速度 |
| spring | `restSpeed` / `restDelta` | 0.1 / 0.01 | 判定动画结束阈值 |
| spring（简化） | `duration` + `bounce` | — | bounce 0~1，0 无回弹 1 最大回弹，更直觉的入口 |
| inertia | `power` | 0.8 | 减速强度 |
| inertia | `timeConstant` | 700 | 减速时间常数 |
| inertia | `bounceStiffness` / `bounceDamping` | 500 / 10 | 边界回弹 |
| 编排通用 | `delay` `repeat`（含 Infinity）`repeatType`（loop/reverse/mirror）`repeatDelay` `delayChildren` `when`（beforeChildren/afterChildren） | — | 与 type 无关，任意 transition 均可用 |

## 四、AnimatePresence mode 速查表

| mode | 行为 | 场景 |
| --- | --- | --- |
| `sync`（默认） | 新旧元素同时进出，无先后顺序 | 一般场景 |
| `wait` | 新元素等旧元素完全退场后才进入 | 轮播图、逐项切换 |
| `popLayout` | 退场元素立即脱离文档流，周围元素同步重排 | 配合 `layout` 的列表删除动画（需父元素非 static 定位） |

## 五、hooks 总表

| hook | 作用 |
| --- | --- |
| `useMotionValue` | 创建不触发重渲染的动画值；`.set()`/`.get()` |
| `useTransform` | 数值区间映射到另一区间（含颜色/CSS 值） |
| `useSpring` | 让一个值以弹簧方式跟随另一个值；`.jump()` 立即跳变 |
| `useVelocity` | 追踪速度；套两层可得加速度 |
| `useMotionValueEvent` | 订阅 change/animationStart/animationComplete/animationCancel |
| `useScroll` | 滚动进度值（`scrollYProgress` 等），支持整页或 `target` + `offset` |
| `useInView` | 命令式布尔 state，区别于声明式 `whileInView` |
| `useAnimate` | 命令式动画，`scope` 限定选择器作用域 |
| `useDragControls` | 手动控制拖拽起始（如专门的拖拽把手） |
| `useReducedMotion` | 返回布尔值，手动响应减少动态偏好 |

## 六、易错点清单

- **spring 默认参数记错**：现行文档 `stiffness` 默认是 1，不是很多人凭旧教程记忆的 100。
- **AnimatePresence 条件位置写反**：条件必须写在 `AnimatePresence` 内部（作为 children），包在外层侦测不到「移除」。
- **key 用了数组 index**：列表重排序/删除时会错误匹配元素，应使用稳定 ID。
- **exit 必须是 AnimatePresence 直接子级**：中间多包一层元素会导致侦测不到；Vue 版这一限制更严格。
- **popLayout 缺少定位上下文**：父元素默认 `position: static` 时退场元素脱离文档流后不会正确重排。
- **嵌套 AnimatePresence 不传播**：默认不向上传播子级退场动画，需要显式设置 `propagate` 为真。
- **layoutId 全局作用域冲突**：5.0 之后同名 `layoutId` 默认全局生效，多实例需要 `LayoutGroup` 的 `id` 隔离。
- **误以为 MotionValue 更新触发重渲染**：走的是批处理到下一帧直接写 DOM 的旁路，响应变化需用 `useMotionValueEvent`。
- **useAnimate 选择器范围理解错误**：字符串选择器只在 `scope` 子树内查找，不是全局查询。
- **import 路径纠结**：`framer-motion` 目前仍然有效，只是非推荐写法，不算错误代码。
- **LazyMotion strict 模式踩雷**：混用完整版 `motion` 组件会直接抛错，需全部改用 `m` 组件。
- **Vue 版包名与手势 prop 名搞混**：Vue 版是独立包 `motion-v`，手势 prop 是 `whilePress` 而非 `whileTap`。
- **reducedMotion 理解片面**：只禁用 transform/layout 动画，透明度/背景色等属性动画依然播放。
- **CSS 变量动画性能预期过高**：绑定到 transform 相关用途也无法获得硬件加速。

## 七、选型对比（vs GSAP / WAAPI / react-spring）

| 维度 | **Motion** | GSAP | 原生 WAAPI | react-spring |
| --- | --- | --- | --- | --- |
| API 风格 | 声明式 props，React/Vue 心智零切换 | 命令式 ref + 方法调用，React 需 `useGSAP` | 命令式 `Element.animate()` | 纯 hook 化状态插值（`useSpring`/`useTrail` 等） |
| 许可证/归属 | MIT 完全开源，多方赞助 | 目前归 Webflow 所有 | 浏览器原生 | MIT 开源 |
| 手势/布局/滚动 | 内置一体化（drag/layout/scroll 全有） | 需自行编排或配插件 | 无 | 无，通常需搭配 `@use-gesture/react` |
| spring 物理 | `transition.type: "spring"` 与 tween/inertia 并列的可选项 | 需插件 | 不支持 | 核心能力，专精数值插值 |
| 时间线灵活度 | 数组声明式，支持跨 HTML/SVG/MotionValue/Three.js | 可变链式，运行时可动态插入/移除轨道（官方认可的 GSAP 优势） | 无时间线概念 | 无内置时间线 |
| 布局动画 | 内置 `layout`/`layoutId`（FLIP 高度封装），业界领先 | 依赖手动 FLIP 实现 | 无 | 无 |
| 体积 | hybrid 18kb（mini 2.3kb），`m` 组件 4.6kb 起 | 23.5kb，引入任意功能即打包全部 | 0kb | 视具体 hook 组合而定 |
| 性能特点 | GPU 合成层运行，与 CPU 上 JS 执行分离 | 官方称测量性能上 Motion 快 2.5~6 倍于 GSAP 的部分场景 | 原生最优 | 取决于实现 |
| 心智模型 | 组件优先（`<motion.div>` + props） | 命令式时间线优先 | 属性动画优先 | 纯数值插值优先，不内置组件包装 |
| 适用场景 | React/Vue 现代项目 + 一体化交互动画体系 | 复杂时间线编排、非 React 项目 | 简单内置动画、零依赖极致轻量 | 只需数值插值+弹簧物理、追求完全 hook 化 |

**选型一句话**：React/Vue 项目需要手势、退场、共享布局、滚动动画一体化覆盖 ⇒ Motion 默认首选；需要运行时可变的复杂时间线编排（尤其非 React 项目）⇒ GSAP 仍有独特价值；只要简单内置动画、追求零依赖极致轻量 ⇒ 原生 WAAPI；只需「数值插值 + 弹簧物理」单一能力且要完全 hook 化 ⇒ react-spring 更轻量聚焦。

> 说明：与 react-spring 的对比基于双方公开的产品定位审慎归纳，不是官方一手对比页引用（motion.dev 官方文档站未检索到与 react-spring 的专门对比页，不同于 GSAP 有 `/docs/gsap-vs-motion`），仅供选型参考。

## 八、资源链接

- [Motion 官方文档](https://motion.dev) —— React / JS / Vue 三端文档一体
- [React 核心文档](https://motion.dev/docs/react) —— installation / motion-component / animation / transitions / gestures / drag / animate-presence / layout-animations 等
- [GSAP vs Motion 官方对比页](https://motion.dev/docs/gsap-vs-motion)
- [相对原生 WAAPI 的 DX 改进](https://motion.dev/docs/improvements-to-the-web-animations-api-dx)
- [React 升级指南（更名迁移路径）](https://motion.dev/docs/react-upgrade-guide)
- [Framer 与 Motion 的关系](https://motion.dev/docs/framer)
- [独立 JS 版文档](https://motion.dev/docs/quick-start)
- [Vue 版文档](https://motion.dev/docs/vue)
- [GitHub 仓库](https://github.com/motiondivision/motion)
- npm 包：[`motion`](https://www.npmjs.com/package/motion) / [`framer-motion`](https://www.npmjs.com/package/framer-motion)（旧包名，仍可安装）

---

回到[本叶概览](./index)，或从[入门](./getting-started)重新过一遍主线。
