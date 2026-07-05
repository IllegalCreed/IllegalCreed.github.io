---
layout: doc
outline: [2, 3]
---

# 入门：定位、安装与第一个动画

> 基于 GSAP v3.15（npm `gsap@3.15.0`，2026-04-13 发布）· 2025-04 起全插件 100% 免费（含商业项目）· 核于 2026-07

## 速查

- **GSAP 是什么**：框架无关的专业级 JS 动画引擎，能动画 DOM/CSS/SVG/Canvas/任意 JS 对象数值属性；核心心智模型是 **Tween（补间）+ Timeline（时间线）**。
- **安装**：`npm install gsap`；核心库开源免费，**2025-04（v3.13）起所有插件 100% 免费**（含 ScrollTrigger/SplitText 等曾经的 Club GreenSock 会员插件），无需注册账号。
- **四大方法**：`gsap.to`（当前→目标，最常用）/ `gsap.from`（起始→当前，入场动画）/ `gsap.fromTo`（显式起止，最可控）/ `gsap.set`（零时长立即赋值）。
- **最基础 vars**：`duration`（默认 `0.5`s）、`delay`、`ease`（默认 `"power1.out"`）。
- **`x`/`y`** 是 GSAP 的 transform 简写，等价于 `translateX`/`translateY`，比原生 CSS `transform` 字符串性能更好。
- **`repeat: -1`** 表示无限循环；**`yoyo: true`** 表示往返播放。
- **插件必须显式注册**：`gsap.registerPlugin(ScrollTrigger, ...)`，v3 起没有自动挂载；重复调用是安全的。
- **CDN**：官网 Install Helper 工具按需生成 `<script>` 链接，免费后无需会员即可拉取全部插件。
- **目标可以是**：CSS 选择器字符串、DOM 元素、元素数组，也可以是普通 JS 对象——这正是"框架无关"的体现。
- **定位口径**：CSS/WAAPI 声明式、时序编排能力弱；Motion（原 Framer Motion）偏 React 声明式生态、布局动画强；GSAP 命令式脚本风格，长于复杂时间线编排与插件生态深度。完整对比表见[参考页](./reference)。
- **下一步**：[Tween 与 Ease](./guide-line/tween-and-ease) → [Timeline 与 stagger](./guide-line/timeline-and-stagger) → [ScrollTrigger 与插件生态](./guide-line/scrolltrigger-and-plugins) → [框架集成与性能](./guide-line/framework-and-performance)。

## 一、GSAP 是什么：定位与选型一瞥

GSAP 官方给自己的一句话定位是：「a framework-agnostic JavaScript animation library that turns developers into animation superheroes」——**框架无关**是关键词。它不假设你在用什么前端框架（甚至不假设你在用框架），也不局限于某一种渲染介质：DOM 元素的 CSS 属性、SVG 属性、Canvas 绘制参数、WebGL uniform、任意 JS 对象的数值属性，只要是数字，GSAP 都能补间。整个库只建立在两个核心概念上：

- **Tween（补间）**：定义"一个或一组属性从状态 A 到状态 B，用多久、什么节奏（ease）"，是动画的最小单元。
- **Timeline（时间线）**：把多个 Tween（甚至嵌套的子 Timeline）按顺序、重叠、标签编排成一个可整体播放/暂停/倒放/跳转进度的复合动画。

理解这两个词，就理解了 GSAP 的大半——后面的插件（ScrollTrigger、SplitText…）都只是"用什么触发/生成 Tween"的不同方式，动画本身仍是 Tween/Timeline 在跑。

**定位对比（选型口径，完整表格见[参考页](./reference)）**：

- **vs 原生 CSS `transition`/`@keyframes`**：声明式、零 JS 依赖，浏览器合成器线程直接跑（transform/opacity 类），性能下限有保障；但没有真正的时间线嵌套、标签定位、运行时动态改变目标值的能力，条件分支只能靠 class 切换硬凑。
- **vs Web Animations API（WAAPI，`element.animate()`）**：浏览器原生 API，可被硬件加速，是 Motion 等库的底层依赖之一；但 API 偏底层（关键帧数组 + options 对象），没有 GSAP 式的 Timeline 编排语法糖、Ease 生态、插件体系，复杂交叉时间线场景手写代码量会陡增。
- **vs Framer Motion（已更名 Motion，motion.dev）**：Motion 已从 React 专属扩展为同时支持 React/纯 JS/Vue 的框架无关库，更偏"声明式生态原生"——`layout` prop 自动布局动画、原生手势（hover/press/drag）、`AnimatePresence` 退场动画，底层优先走 WAAPI 硬件加速通道。GSAP 是**命令式脚本风格**，不绑定任何框架的渲染模型，长于手工精细编排的复杂时间线（多阶段、多目标交叉时序）和插件生态深度（ScrollTrigger 的滚动控制粒度、MotionPath/MorphSVG 等 SVG 专项能力目前仍比 Motion 更专精）。两者不是互斥关系：纯 React 项目、需要"布局变化自动补间"（列表增删重排）优先 Motion 更省心；需要复杂 scrollytelling、SVG 路径/形变动画、或项目本身多框架/无框架，GSAP 更合适。

## 二、安装与全插件免费现状

```bash
npm install gsap
```

**2025 年之前的旧认知已过时**：曾经 GSAP 核心免费，但 ScrollTrigger、SplitText、MorphSVGPlugin 等"高级插件"需要付费加入 Club GreenSock 会员才能使用。这一情况已被下表的时间线彻底改变：

| 时间 | 事件 |
| --- | --- |
| 2024-10-15 | GSAP 被 **Webflow 收购**；官方承诺「will continue to be publicly available for everyone to use on the wider web」 |
| 2025-04-29 | **v3.13：GSAP 100% FREE**——所有原 Club GreenSock 付费插件全部免费，含商业用途 |
| 2025-12-08 | v3.14：MorphSVGPlugin 新增 `smooth` 平滑锚点选项 |
| 2026-04-13 | v3.15：新增 `easeReverse`（npm 实测最新版即此版本） |

官方原文（pricing 页）：「GSAP is now 100% free for all users, thanks to Webflow's support.」官方原文（3.13 发布博客）：「GSAP is now 100% FREE including ALL of the bonus plugins like SplitText, MorphSVG, and all the others that were exclusively available to Club GSAP members.」

**结论**：ScrollTrigger、SplitText、Draggable、Flip、MotionPathPlugin、MorphSVGPlugin、Observer、ScrollSmoother、InertiaPlugin、GSDevTools、Physics2DPlugin 等**全部插件、含商业项目使用，均免费**，`npm install gsap` 后直接导入即可，无需注册 Club GreenSock 账号或购买授权。

::: tip 官方插件总览页佐证
`https://gsap.com/docs/v3/Plugins/` 页面没有任何插件标注价格或"仅限会员"字样，与免费声明交叉验证一致。
:::

## 三、gsap.to：第一个动画

四大核心方法语义速览（详解见[下一篇](./guide-line/tween-and-ease)）：

| 方法 | 语义 | `immediateRender` 默认值 |
| --- | --- | --- |
| `gsap.to(targets, vars)` | 从**当前状态**动画到 vars 指定的目标值（最常用） | `false` |
| `gsap.from(targets, vars)` | 从 vars 指定值动画到**当前状态**（常用于入场动画） | `true` |
| `gsap.fromTo(targets, fromVars, toVars)` | **显式指定起止两端**，最精确可控 | `true` |
| `gsap.set(targets, vars)` | 零时长立即设置属性（本质是 `duration:0` 的特例） | — |

```js
import { gsap } from "gsap";

// 从当前状态动画到 x:100，1 秒，缓动 power2.out
gsap.to(".box", { x: 100, duration: 1, ease: "power2.out" });

// 从 opacity:0/y:50 动画到当前状态——常见入场动画写法
gsap.from(".box", { opacity: 0, y: 50, duration: 1 });

// 起止都显式声明，避免依赖当前 DOM 状态的不确定性（防止入场闪烁）
gsap.fromTo(".box", { scale: 0 }, { scale: 1, duration: 0.6 });

// 零时长立即设置，常用于动画前先固定初始状态（如 transformOrigin）
gsap.set(".box", { transformOrigin: "50% 50%" });
```

`targets` 参数既可以是 CSS 选择器字符串、DOM 元素、元素数组，也可以是普通 JS 对象（游戏坐标、Canvas 绘制参数等）——这也是"框架无关"的直接体现。

## 四、registerPlugin：插件注册机制

ScrollTrigger、SplitText 等插件不在核心包内，需要单独导入并显式注册后才能使用：

```js
// ES Module 按需导入 + 注册插件（v3 起插件需显式注册，无自动挂载）
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);
```

- **重复调用 `gsap.registerPlugin()` 是安全的**（官方原话："No, it's perfectly fine"）——常见做法是建一个统一的 `gsap.js` 文件集中 `export * from` 各插件并在其中完成注册，业务代码只需从这个文件导入 `gsap`。
- **CDN 方式**：官网提供 Install Helper 工具，按需生成 `<script>` 标签组合，免费后已取消此前的会员打包地址限制。
- **UMD 场景**：`import { gsap } from "gsap/dist/gsap"`。

::: warning 忘记 registerPlugin 是最常见的入门坑
v3 起插件必须显式 `registerPlugin` 才能使用（区别于 v2 部分插件自动挂载的旧习惯），漏掉会导致对应功能静默失效或报"找不到属性"的错误。
:::

---

下一步进入 [Tween 与 Ease](./guide-line/tween-and-ease)：把 `to`/`from`/`fromTo`/`set` 用透，摸清 vars 配置对象与缓动体系。
