---
layout: doc
outline: [2, 3]
---

# 入门：定位、安装与第一个动画

> 基于 Anime.js v4.5（npm `animejs@4.5.0`，2026-06-22 发布）· v4 于 2025-04-03 起 ESM-first 完全重写 · 核于 2026-07

## 速查

- **Anime.js 是什么**：官网定位"A fast and flexible JavaScript library to animate the web."（快速灵活的网页动画 JS 库），npm description 简写 `"JavaScript animation engine"`；关键词轻量、模块化、ESM-first、tree-shakeable、框架无关。
- **v4 是完全重写**：2025-04-03 的 v4.0.0 官方原话"A complete rewrite of Anime.js, with a modular, ESM-first API"——不是渐进升级，是彻底换血。
- **安装**：`npm install animejs`；包是 `"type": "module"`，没有 CJS 默认导出。
- **核心导入变了**：v4 是具名导出 `import { animate } from 'animejs'`，**不再有** v3 那个万能默认导出 `import anime from 'animejs'`。
- **三种导入姿势**：主入口具名导入（走 tree-shaking，推荐）/ 子路径导入（`animejs/animation`、`animejs/draggable` 等，无 bundler 或极限体积场景）/ CDN（`type="module"` 的 ESM 地址，或不用模块时的 UMD 构建产物）。
- **`animate(targets, params)` 两个参数**：第一个是 targets（选择器/DOM/对象/数组），第二个是配置对象。
- **四个最基础的播放参数**：`duration`（毫秒，默认 1000）、`delay`（默认 0）、`loop`（默认 0=不循环）、`autoplay`（默认 true）。
- **`ease` 取代了 `easing`**：字段名和写法都变了，`'easeOutQuad'` 简化为 `'outQuad'`（去掉 ease 前缀 + 首字母小写）。
- **三个最常用回调**：`onComplete`/`onUpdate`/`onBegin`，写在配置对象里。
- **返回值是动画实例**：可调用 `.pause()`/`.play()`/`.reverse()` 等方法控制。
- **数值类型自动识别**：颜色（`'#ff0000'`）、带单位的值（`'2rem'`）、相对值（`'+=50'`）都可以直接写在属性值位置。
- **targets 类型延续 v3**：CSS 选择器字符串 / DOM 元素 / JS 对象（`{value:0}`）/ 上述任意组合的数组，四种类型没变，只是位置从"配置对象字段"挪到了"函数第一个参数"。
- **CDN 无 `type="module"` 时**：需要用 UMD 构建产物，通过全局变量 `anime.animate` 访问（不再是裸 `anime()` 函数）。
- **定位口径**：vs 原生 WAAPI，Anime.js 多了 timeline/stagger/draggable/scroll 编排能力；vs GSAP，插件生态成熟度暂时不及但更轻量现代；vs Motion（原 Framer Motion），Anime.js 是命令式 `animate(targets, params)`、不绑定框架，Motion 是声明式、贴合 React/Vue 组件状态。完整对比表见[参考页](../reference)。
- **v3→v4 五条最容易踩的坑**：①无默认导出，裸 `anime({...})` 直接报错；②`easing`→`ease` 字段和值写法都变；③`stagger` 必须显式 `import`；④`direction` 拆成 `reversed`/`alternate` 两个布尔；⑤`.play()`/`.reverse()` 在 v4 是恒定方向，恢复暂停要用 `.resume()`。完整迁移映射见[参考页](../reference)。
- **下一步**：[animate() 与参数](../guide-line/animate-and-parameters) → [Timeline 与 stagger](../guide-line/timeline-and-stagger) → [SVG 与 Draggable](../guide-line/svg-and-draggable) → [ScrollObserver / utils / eases](../guide-line/scroll-utils-eases)。

## 一、Anime.js 是什么：定位与选型一瞥

Anime.js 是一个**框架无关**的 JavaScript 动画引擎，核心心智模型很简单：`animate(targets, params)`——给一批目标，描述它们该从哪到哪、多久、什么节奏。v4 时代它已经不只是"补间动画库"，而是扩展成一整套引擎家族：Timer（计时器）/ Animation（补间）/ Timeline（编排）/ Draggable（拖拽物理）/ ScrollObserver（滚动联动）/ SVG（形变+描边+路径运动）/ Scope（框架作用域）等模块共享同一个全局 `engine` 驱动。

**定位对比（选型口径，完整表格见[参考页](../reference)）**：

- **vs 原生 Web Animations API（`Element.animate()`）**：WAAPI 零依赖、体积为 0，浏览器原生硬件加速，但没有内置的 timeline 编排、stagger、draggable、scroll 联动能力，复杂场景需要自己在上层搭一套编排逻辑。Anime.js 自带的 `waapi.animate()` 正是"用 Anime.js 的语法糖包一层原生 WAAPI"的折中方案，细节见 [ScrollObserver / utils / eases](../guide-line/scroll-utils-eases)。
- **vs GSAP**：GSAP 插件生态历史最悠久（`ScrollTrigger` 打磨多年），2025-04 起也已 100% 免费；Anime.js v4 时代功能广度已追近（Timeline/Draggable/SVG/ScrollObserver 一应俱全），但边缘案例的打磨深度、官方交互式调参工具（Ease Visualizer 之类）暂不及 GSAP，胜在包体积更轻、ESM 架构更现代。
- **vs Framer Motion（已更名 Motion）**：Motion 侧重 React/Vue **声明式**动画（`variants`/手势/`layout` 布局动画），天然贴合组件化框架的状态驱动心智；Anime.js 是**命令式** `animate(targets, params)`，更接近原生 DOM 操作习惯，不绑定任何框架，但官方文档单独给出了 React 接入范式（`createScope()` + `useEffect`）。

## 二、v4 完全重写：安装与导入

Anime.js 的版本号看似只是"从 3 到 4"，实际是一次不兼容的彻底重写，理解这条时间线有助于判断网上找到的资料是否已经过时：

| 版本 | 时间 | 说明 |
| --- | --- | --- |
| v3.2.2 | 2023-11-28 | v3 系列最后一个版本 |
| **v4.0.0** | **2025-04-03** | **完全重写**：模块化、ESM-first API（官方原话："A complete rewrite of Anime.js, with a modular, ESM-first API, improved performance, and TONS of new features."） |
| v4.0.1 / v4.0.2 | 2025-04 | 补丁修复（Draggable revert、SVG stroke-linecap、WAAPI Promise 等） |
| v4.1.0 | 2025-07-23 | 新增 `text.split()`（后改名 `splitText`）、`scope.addOnce()`/`scope.keepTime()`，stagger 新增 `use`/`total`/`from:'random'` |
| v4.3.x | 2026-01～02 | `onScroll` 新增 `onResize` 回调，WAAPI 同步进 Timeline 的动画自动 `persist` |
| **v4.4.0** | **2026-04-29** | **含 Breaking Changes**：transform 渲染顺序固定为 `perspective>translate>rotate>scale>skew`；函数式取值回调第三参数从 `total` 改为 `targets`；新增 `scrambleText()`、stagger `grid:true` |
| v4.4.1 | 2026-04-30 | hotfix（timeline `.call()` 回归修复） |
| **v4.5.0** | **2026-06-22** | **最新**：新增 `registerAdapter()` + 内置 Three.js adapter，stagger 支持 3D 网格坐标、`jitter`、`seed` |

安装很直接：

```bash
npm install animejs
```

导入方式有三种,按场景选择：

```javascript
// ① 主入口（走 tree-shaking，推荐）
import { animate, createTimeline, createTimer, stagger, eases, utils } from 'animejs';

// ② 子路径导入（无 bundler / 极限体积场景，每个函数只加载自身代码）
import { animate } from 'animejs/animation';
import { createDraggable } from 'animejs/draggable';
```

```html
<!-- ③ CDN ESM -->
<script type="module">
  import { animate } from 'https://esm.sh/animejs';
</script>
<!-- CDN UMD（全局变量 anime，兼容旧写法过渡场景）
     生产环境应锁定具体版本号并加 Subresource Integrity：
     integrity="sha384-..." crossorigin="anonymous"，防止 CDN 被劫持后静默篡改脚本 -->
<script src="https://cdn.jsdelivr.net/npm/animejs/dist/bundles/anime.umd.min.js"></script>
```

::: tip 零构建也能按需加载
v4 是 `"type": "module"` 包，即便没有 bundler，也可以用浏览器原生 `<script type="importmap">` 把子路径映射到 `node_modules` 里的文件，实现零构建的按需加载体验。
:::

## 三、animate()：第一个动画

```javascript
import { animate } from 'animejs';

// 目标：CSS 选择器 '.square'；第二参数是描述目标值与时序的配置对象
const animation = animate('.square', {
  translateX: '17rem',          // transform 分量：X 轴平移，自动识别单位
  rotate: 360,                   // 旋转一整圈
  scale: [1, 1.5, 1],            // 数组 = 补间值关键帧：1 → 1.5 → 1
  backgroundColor: '#FF4B4B',    // 背景色补间，颜色值自动识别
  duration: 1000,                 // 毫秒，默认 1000
  delay: 100,
  ease: 'outElastic(1, .6)',     // 弹性缓动，带参数字符串写法
  loop: true,                     // 无限循环
  alternate: true,                 // 往返播放
  onComplete: () => console.log('done'),
});

animation.pause();  // 返回的动画实例可随时暂停/播放/反向
```

`targets` 参数延续了 v3 的四种类型：CSS 选择器字符串、DOM 元素、JS 对象（如 `{value: 0}`）、以及上述任意组合的数组——**这一点 v3→v4 没有变**，容易被误以为"连目标类型体系都重写了"，实际只是从"配置对象里的一个字段"变成了"函数第一个位置参数"。

## 四、v3 → v4 迁移速览：别被网上的旧教程坑

网上大量 2025 年之前发布的 Anime.js 教程、StackOverflow 答案都是 v3 写法，在 v4 环境下会直接报错或行为不符预期。最容易踩的五个坑：

- **无默认导出**：v3 `import anime from 'animejs'` 之后裸调用 `anime({targets:'div', ...})`，在 v4 下 `anime` 要么是 `undefined` 要么根本找不到，必须改成具名导入 `import { animate } from 'animejs'` 再调用 `animate('div', {...})`。
- **`easing` → `ease`**：字段名变了，写法也变了——`easing: 'easeInOutQuad'` 要改成 `ease: 'inOutQuad'`，双重坑。
- **`stagger` 必须显式导入**：v3 `anime.stagger()` 挂在全局对象上随手调用；v4 `stagger` 是要单独 `import { stagger } from 'animejs'` 的具名函数，忘记导入是新手期最高频的报错来源。
- **`direction` 拆成两个布尔**：v3 一个 `direction` 字段管 `'reverse'`/`'alternate'`/`'normal'` 三态，v4 拆成独立的 `reversed: true`/`alternate: true`，两者理论上可以同时为真，语义要重新想一遍。
- **`.play()`/`.reverse()` 语义变了**：v3 是"切换"语义，v4 里 `.play()` 恒定正向播放、`.reverse()` 恒定反向播放，要恢复暂停状态应改用 `.resume()`。

更完整的 v3→v4 API 映射表（`anime.timeline()`→`createTimeline()`、`anime.remove/get/set/random()`→`utils.remove/get/set/random()`、`anime.path()`→`svg.createMotionPath()` 等）见[参考页](../reference)的对照表。

---

下一步进入 [animate() 与参数](../guide-line/animate-and-parameters)：把 targets、可动画属性与核心配置参数用透。
