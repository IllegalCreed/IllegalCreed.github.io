---
layout: doc
outline: [2, 3]
---

# 参考：Tween / Timeline / ScrollTrigger / Ease 速查

> 基于 GSAP v3.15（npm `gsap@3.15.0`，2026-04-13 发布）· 2025-04 起全插件 100% 免费（含商业项目）· 核于 2026-07

## 速查

- **安装**：`npm install gsap`；`gsap.registerPlugin(...)` 显式注册插件，重复调用安全。
- **四大方法**：`to`（当前→目标，`immediateRender` 默认 `false`）/ `from`（起始→当前，默认 `true`）/ `fromTo`（显式起止，默认 `true`）/ `set`（零时长赋值）。
- **transform 简写**：`x`/`y`/`scale`/`rotation`/`skewX/Y` 等，别用 CSS `transform` 字符串；固定应用顺序 平移→缩放→rotationX→rotationY→倾斜→旋转。
- **`autoAlpha`** = `opacity` + `visibility`；**特殊值语法** `"+=n"`/`"-=n"`/`"random(a,b)"`/函数式。
- **Ease**：`power1~4`/`back`/`elastic`/`bounce`/`circ`/`expo`/`sine`/`steps` + `.in`/`.out`/`.inOut`；`easeReverse`（v3.15）替代已弃用的 `yoyoEase`。
- **Timeline 位置参数**：数字绝对时间 / `"+=1"` 末尾之后 / `"-=1"` 末尾重叠 / `"label"` 标签 / `"<"` 上一动画起点 / `">"` 上一动画终点。
- **stagger**：数字固定间隔 / 对象 `{each,amount,from,grid,axis,ease,repeat}` / 函数完全自定义。
- **ScrollTrigger**：`start`/`end` 语法（关键词/百分比/像素/相对）；`scrub` 三态；`toggleActions` 四段式；`pin`+`pinReparent`；`snap`；`batch()`；内容变化后必须 `refresh()`。
- **插件全免费**（2025-04 起）：ScrollTrigger、SplitText、Draggable、Flip、MotionPathPlugin、MorphSVGPlugin、Observer、ScrollSmoother、InertiaPlugin 等，含商业用途。
- **框架集成**：React 用 `useGSAP()`（`@gsap/react`）替代 `useEffect`；`contextSafe()` 包裹事件回调内动画；`gsap.context()` 是底层清理机制；`gsap.matchMedia()` 做响应式/无障碍分支动画。
- **性能**：`quickTo()`/`quickSetter()` 跳过便利特性直接写值；优先动画 `transform`/`opacity`；`lazy` 默认 `true`。
- **选型口径**：CSS/WAAPI 声明式、编排能力弱；Motion（原 Framer Motion）React 声明式生态、布局动画强；Anime.js 更轻量的框架无关替代候选；GSAP 命令式脚本风格，长于复杂时间线编排 + 插件生态深度。

## 一、Tween 速查

| 方法 | 语义 | `immediateRender` 默认值 |
| --- | --- | --- |
| `gsap.to(targets, vars)` | 从当前状态动画到目标值（最常用） | `false` |
| `gsap.from(targets, vars)` | 从指定值动画到当前状态（入场动画） | `true` |
| `gsap.fromTo(targets, fromVars, toVars)` | 显式指定起止两端 | `true` |
| `gsap.set(targets, vars)` | 零时长立即设置（`duration:0` 特例） | — |

**vars 核心分类**

| 分类 | 字段 |
| --- | --- |
| 基础时序 | `duration`（默认 0.5）、`delay`、`ease`（默认 `power1.out`）、`easeReverse` |
| 重复/往返 | `repeat`（-1 无限）、`repeatDelay`、`repeatRefresh`、`yoyo` |
| 播放状态 | `paused`、`reversed`、`runBackwards` |
| 回调族 | `onStart`/`onUpdate`/`onComplete`/`onRepeat`/`onReverseComplete` + `xxxParams`、`callbackScope` |
| 高级 | `overwrite`（true/"auto"/false）、`immediateRender`、`lazy`（默认 true）、`stagger`、`inherit`、`startAt`、`id`、`keyframes` |

**特殊值语法**

```js
gsap.to(".box", { x: "+=100" });              // 相对增加
gsap.to(".box", { x: "-=50" });               // 相对减少
gsap.to(".box", { x: "random(-100, 100)" });  // 随机值
gsap.to(".box", { x: (index, target, list) => index * 50 }); // 函数式
```

**transform 简写属性**：`x`/`y`/`xPercent`/`yPercent`/`scale`/`scaleX`/`scaleY`/`rotation`/`rotationX`/`rotationY`/`skewX`/`skewY`；`autoAlpha`（opacity+visibility）；`transformPerspective`/CSS `perspective`（3D）；任意 JS 对象属性、SVG `attr:{}`。

## 二、Ease 速查

| 族 | 特点 |
| --- | --- |
| `none` | 线性 |
| `power1`~`power4` | 幂函数，力度递增 |
| `back` | 回弹超调，参数 `back.out(1.7)`（默认 1.70158） |
| `elastic` | 弹簧，参数 `elastic.out(振幅, 周期)` |
| `bounce` | 弹跳 |
| `circ`/`expo`/`sine` | 三角/指数曲线 |
| `steps` | 阶跃，参数 `steps(n)` |

修饰符 `.in`（慢起）/`.out`（慢收，默认族多用）/`.inOut`（两端都缓）。EasePack 扩展 `rough`/`slow`/`expoScale`；自定义插件 `CustomEase`/`CustomBounce`/`CustomWiggle`；官网 **Ease Visualizer** 交互式曲线编辑器可视化生成 `CustomEase` 代码。全局默认 `gsap.defaults({ ease, duration })`，局部默认 `gsap.timeline({ defaults: {...} })`。v3.15 新增 `easeReverse` 替代已弃用的 `yoyoEase`。

## 三、Timeline 速查

**位置参数**

| 写法 | 含义 |
| --- | --- |
| `3` | 绝对时间：第 3 秒处插入 |
| `"+=1"` | 接在当前末尾之后 1 秒 |
| `"-=1"` | 与末尾重叠 1 秒 |
| `"myLabel"` | 定位到标签处 |
| `"myLabel+=2"` | 标签之后 2 秒 |
| `"<"` | 上一动画起点（并行开始） |
| `">"` | 上一动画终点（默认顺序衔接） |
| `"<1"` / `">-0.5"` | 起点/终点再偏移 |

**构造项**：`repeat`/`repeatDelay`/`yoyo`/`paused`/`defaults`/`onComplete` 等回调。

**控制方法**（Tween/Timeline 通用）：`play(from, suppressEvents)`/`pause(atTime)`/`resume()`/`reverse(from)`/`restart(includeDelay)`/`seek(time|label)`/`progress(value)`/`totalProgress(value)`/`time(value)`/`totalTime(value)`/`timeScale(value)`/`kill(target, propertiesList)`/`then(callback)`（返回 Promise）。

**查询/标签**：`addLabel`/`removeLabel`/`currentLabel()`/`nextLabel()`/`getChildren()`/`getTweensOf()`/`duration()`/`totalDuration()`；动态绑回调用 `tl.eventCallback("onUpdate", fn)`。

## 四、stagger 速查

| 写法 | 说明 |
| --- | --- |
| 数字 | 相邻元素固定间隔（负数倒序开始） |
| 对象 | `each`（固定间隔）/ `amount`（总时长自动均分）/ `from`/`grid`/`axis`/`ease`/`repeat` |
| 函数 | `(index, target, list) => delay` 完全自定义 |

`from` 可选值：`start`（默认）/ `end` / `center`（中心向两侧辐射）/ `edges`（两端向中心收缩）/ `random` / 索引数字 / `[x%, y%]`。`grid: "auto"` 按 `getBoundingClientRect()` 自动推断行列，`axis` 限定单轴计算距离。

## 五、ScrollTrigger 速查

| 配置项 | 说明 |
| --- | --- |
| `trigger` | 触发元素 |
| `start` / `end` | 关键词组合（"top bottom"）/ 百分比 / 像素 / 相对（"+=300"） |
| `scrub` | `true` 严格跟手 / 数字 追及延迟秒数 / 不设 走 toggleActions |
| `pin` / `pinSpacing` / `pinReparent` | 固定触发元素 / 自动补位 / 祖先有 transform 时临时挂 `<body>` |
| `toggleActions` | `"onEnter onLeave onEnterBack onLeaveBack"`，各段 play\|pause\|resume\|reverse\|restart\|reset\|complete\|none |
| `markers` | 开发期可视化调试标记 |
| `snap` | 数字增量 / 数组离散点 / `{snapTo:"labels", duration:{min,max}, delay, ease}` |
| `onEnter`/`onLeave`/`onEnterBack`/`onLeaveBack`/`onUpdate` | 生命周期回调，`self.progress`/`self.getVelocity()` |

**批量与清理**：`ScrollTrigger.batch(selector, { onEnter, interval })` 合并长列表触发；内容变化后必须 `ScrollTrigger.refresh()`（`refresh(true)` 等滚动动量结束后再刷新）；清理用 `getAll()`/`getById()`/`trigger.kill()`/`killAll()`；`ScrollTrigger.observe()` 内置 Observer 能力，无需单独引入。

## 六、插件速查表

| 插件 | 用途 | 关键 API | 免费状态 |
| --- | --- | --- | --- |
| ScrollTrigger | 滚动驱动动画的事实标准 | `scrollTrigger:{...}`、`batch()`、`observe()` | 2025-04 起免费 |
| SplitText | 文字拆分逐字/词/行动画 | `SplitText.create(el, {type, autoSplit, onSplit})` | 2025-04 起免费（同期重写） |
| Draggable | 拖拽交互 | `Draggable.create(el, {type, bounds, inertia})` | 2025-04 起免费 |
| Flip | 布局变化动画（First-Last-Invert-Play） | `Flip.getState()` → `Flip.from(state, {...})` | 2025-04 起免费 |
| MotionPathPlugin | 沿 SVG 路径/坐标数组运动 | `motionPath:{path, align, autoRotate}` | 2025-04 起免费 |
| MorphSVGPlugin | SVG 路径变形 | `morphSVG:"#target"`、`shapeIndex`、`smooth`（3.14+） | 2025-04 起免费 |
| Observer | wheel/touch/pointer 统一方向回调 | `Observer.create({onUp,onDown,...})`；已内置 ScrollTrigger | 2025-04 起免费 |
| ScrollSmoother | 平滑滚动 | 固定骨架 `#smooth-wrapper > #smooth-content`，`effects:true` | 2025-04 起免费 |
| InertiaPlugin | 惯性减速停止 | `inertia:{...}`、`VelocityTracker` | 2025-04 起免费（原付费 ThrowPropsPlugin 继任） |

## 七、gsap.utils 速查表

| 方法 | 作用 | 示例 |
| --- | --- | --- |
| `clamp(min,max,value)` | 限制数值范围 | `clamp(0,100,-12)` → `0` |
| `mapRange(inMin,inMax,outMin,outMax,value)` | 区间映射 | `mapRange(-10,10,0,100,5)` → `75` |
| `normalize(min,max,value)` | 映射为 0~1 进度 | `normalize(100,200,150)` → `0.5` |
| `interpolate(start,end,progress)` | 数字/颜色/字符串插值 | `interpolate("red","blue",0.5)` |
| `snap(increment\|array, value)` | 吸附到增量或最近值 | `snap(5,13)` → `15` |
| `random(min,max,snap?)` | 随机数/随机数组取值 | `random(0,100,5)` |
| `pipe(...fns)` | 函数管道式组合 | `pipe(clamp(0,100), snap(5))` |
| `toArray(selector)` | 类数组转真数组 | `toArray(".class")` |
| `wrap(min,max,value)` | 数值循环回绕 | 用于循环索引 |
| `distribute({...})` | 按线性/网格分配值 | 常配合自定义 stagger |
| `selector(scopeEl)` | 生成限定作用域的选择器函数 | `let q = gsap.utils.selector(el)` |
| `splitColor(color)` | 颜色拆分为 RGB 分量 | `splitColor("red")` → `[255,0,0]` |

## 八、框架集成速查

| API | 场景 | 要点 |
| --- | --- | --- |
| `useGSAP()`（`@gsap/react`） | React 组件 | `useEffect`/`useLayoutEffect` 替代品，自动 `gsap.context()` 清理；`scope`/`dependencies`/`revertOnUpdate` |
| `contextSafe()` | React 事件回调 | 包裹 `onClick` 等回调内创建的动画，纳入自动清理 |
| `gsap.context()` | 任意场景批量清理 | `ctx.revert()` 一键清理上下文内所有动画 |
| `gsap.matchMedia()` | 响应式/无障碍 | 内建 `context()`；条件失配自动 revert 该分支动画/ScrollTrigger |
| `quickTo()`/`quickSetter()` | 高频更新（鼠标跟随） | 跳过单位换算/相对值解析，直接写值 |

## 九、选型对比

### vs 原生 CSS 动画 / Web Animations API（WAAPI）

| 维度 | CSS transition/@keyframes | WAAPI（`element.animate()`） | GSAP |
| --- | --- | --- | --- |
| 依赖 | 零 JS | 浏览器原生 API | JS 运行时 + 自研引擎 |
| 性能下限 | 有保障（合成器线程） | 可硬件加速 | 高（自研渲染循环，非直接依赖 CSSOM/WAAPI） |
| 编排能力 | 弱，无真正时间线嵌套/标签 | 偏底层，关键帧数组+options | 最成熟：Timeline/Label/位置参数体系 |
| 跨浏览器一致性 | 需要 polyfill 心智负担 | 逐步统一 | 历史上大量精力填平差异，高度一致 |
| 插件生态 | 无 | 无（是 Motion 等库的底层依赖） | ScrollTrigger/SVG 变形/路径动画/拖拽物理等 |

### vs Framer Motion / Motion（2024 更名后现状）

Framer Motion 已于近年**更名为 "Motion"**（motion.dev），并从 **React 专属**扩展为**同时支持 React、纯 JavaScript、Vue** 三种文档入口的框架无关库，核心亮点包括硬件加速的 `ScrollTimeline` 滚动动画、原生手势（hover/press/drag）、布局动画（`layout` prop）、弹簧物理引擎、`AnimatePresence` 退场动画。

- **定位差异**：Motion 更偏"React/声明式生态原生"（`layout` prop 自动布局动画、组件化 API、与 React 状态/生命周期天然融合），底层优先走 WAAPI 硬件加速通道；GSAP 是**命令式脚本风格**，不绑定任何框架的渲染模型，长于**手工精细编排的复杂时间线**（多阶段、多目标交叉时序）和**插件生态深度**（ScrollTrigger 的滚动控制粒度、MotionPath/MorphSVG 等 SVG 专项能力目前仍比 Motion 更专精）。
- **选型建议**：纯 React 项目、需要"布局变化自动补间"（如列表增删重排）优先 Motion 更省心；需要复杂 scrollytelling、SVG 路径/形变动画、或项目本身多框架/无框架，GSAP 更合适。两者不是互斥关系，都可能在同一技术栈评估中被比较。

### vs Anime.js

Anime.js v4（当前版本）同样框架无关，定位 `all-in-one animation engine`，已具备 Timeline、三种维度的 stagger（时间/数值/位置）、SVG 工具集（形变/绘线/路径）、Draggable、Scroll Observer、Spring 物理、Scope（响应式动画）以及可选的 WAAPI 引擎；采用模块化按需导入，完整包约 24.5KB（最小仅 Timer 5.6KB），体积上比 GSAP 更有优势。

- **GSAP 的差异化**：生态成熟度、文档深度（含官方 Ease Visualizer、MotionPathHelper 等交互工具）、插件专精度（ScrollTrigger 的 pin/snap/batch 组合能力、SplitText 的无障碍重写）、以及长期跨浏览器兼容性的历史积累仍是 GSAP 的护城河；Anime.js 4.0 在 API 现代化和体积上更轻量，属于"轻量全能替代候选"而非全面反超。
- **选型建议**：极致轻量、追求现代 ESM 模块化按需加载的项目可评估 Anime.js；企业级/长期维护/需要深插件生态（尤其滚动驱动叙事 + SVG 复杂形变）仍首选 GSAP。

## 十、版本时间线与全免费现状

| 时间 | 事件 | 信源 |
| --- | --- | --- |
| 2014-08-25 | npm 包创建 | npm registry |
| 2024-10-15 | GSAP 被 **Webflow 收购**；承诺持续对外开放 | `gsap.com/blog/webflow-GSAP` |
| 2025-04-29 | **v3.13：100% FREE**，全部原付费插件免费 | `gsap.com/blog/3-13` |
| 2025-12-08 | v3.14：MorphSVGPlugin 新增 `smooth` 选项 | `gsap.com/blog/3-14` |
| 2026-04-13 | v3.15：新增 `easeReverse`（npm 实测最新版） | `gsap.com/blog/3-15` |

不存在"部分插件仍付费"的情况——ScrollTrigger、SplitText、Draggable、Flip、MotionPathPlugin、MorphSVGPlugin、Observer、ScrollSmoother、InertiaPlugin、GSDevTools、Physics2DPlugin 等全部插件、含商业项目使用，均免费，通过 npm 直接安装即可，无需注册 Club GreenSock 账号或购买授权。

## 十一、易错点清单

- **from/fromTo 的 FOUC**：默认 `immediateRender:true` 立即设为起始值，脚本加载晚/SSR 水合延迟时可能闪一下最终态；首屏关键动画建议服务端/CSS 预设初始态。
- **transform 用了 CSS 字符串而非 GSAP 简写**：绕开优化路径且多属性顺序易出错，应始终用 `x`/`y`/`rotation`/`scale` 独立属性。
- **ScrollTrigger 不随框架生命周期清理**：SPA 路由切换/组件卸载不 `kill()`，旧实例继续监听导致动画错乱或性能衰退；React 用 `useGSAP()`。
- **内容变化后不调用 `ScrollTrigger.refresh()`**：图片异步加载、无限滚动、字体加载都会让 start/end 计算过期。
- **`gsap.registerPlugin()` 忘记调用**：v3 起插件必须显式注册，否则静默失效或报错。
- **pin 固定元素被祖先 transform/will-change 破坏定位**：用 `pinReparent:true` 规避。
- **直接给 pin 住的元素做位移动画**：应改为动画其内部子元素。
- **Flip 在框架中过早调用**：需等一帧真实渲染完成后再调用，并显式传 `targets`。
- **`gsap.context()`/`useGSAP` 清理遗漏事件处理器内动画**：需用 `contextSafe()` 包裹才纳入自动清理。
- **混淆 stagger 的 `each` 与 `amount`**：前者固定间隔，后者总时长自动均分，元素数量变化时表现不同。
- **`stagger`/`repeat` 嵌套位置搞反**：外层 `repeat` 是整组重复，`stagger:{...repeat}` 内部是每个子补间独立重复。
- **误以为 ScrollTrigger/SplitText 等插件仍需付费/注册会员**：2025-04（v3.13）起全部插件免费，含商业项目。

## 十二、资源链接

- [GSAP 官网](https://gsap.com)
- [官方文档首页](https://gsap.com/docs/v3/)
- [定价/免费声明](https://gsap.com/pricing/)
- [安装文档](https://gsap.com/docs/v3/Installation)
- [核心 GSAP 对象（to/from/fromTo/set）](https://gsap.com/docs/v3/GSAP/)
- [Tween 详解](https://gsap.com/docs/v3/GSAP/Tween)
- [Timeline 详解](https://gsap.com/docs/v3/GSAP/Timeline)
- [Eases](https://gsap.com/docs/v3/Eases)
- [Staggers](https://gsap.com/resources/getting-started/Staggers)
- [Getting Started](https://gsap.com/resources/get-started)
- [gsap.utils](https://gsap.com/docs/v3/GSAP/UtilityMethods)
- [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [ScrollSmoother](https://gsap.com/docs/v3/Plugins/ScrollSmoother/)
- [SplitText](https://gsap.com/docs/v3/Plugins/SplitText/)
- [Draggable](https://gsap.com/docs/v3/Plugins/Draggable/)
- [Flip](https://gsap.com/docs/v3/Plugins/Flip/)
- [MotionPathPlugin](https://gsap.com/docs/v3/Plugins/MotionPathPlugin/)
- [MorphSVGPlugin](https://gsap.com/docs/v3/Plugins/MorphSVGPlugin/)
- [Observer](https://gsap.com/docs/v3/Plugins/Observer/)
- [InertiaPlugin](https://gsap.com/docs/v3/Plugins/InertiaPlugin/)
- [插件总览（免费状态）](https://gsap.com/docs/v3/Plugins/)
- [React 集成 useGSAP](https://gsap.com/resources/React)
- [博客：Webflow 收购公告](https://gsap.com/blog/webflow-GSAP)
- [博客：3.13 全免费发布](https://gsap.com/blog/3-13)
- [GitHub 仓库](https://github.com/greensock/GSAP)
- [对比信源：Motion（原 Framer Motion）](https://motion.dev/)
- [对比信源：Anime.js](https://animejs.com/)

---

回到[本叶概览](./index)，或从[入门](./getting-started)重新过一遍主线。
