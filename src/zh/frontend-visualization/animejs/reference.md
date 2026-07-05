---
layout: doc
outline: [2, 3]
---

# 参考：Anime.js API 速查

> 基于 Anime.js v4.5（npm `animejs@4.5.0`，2026-06-22 发布）· 核于 2026-07

## 速查

- **安装**：`npm install animejs`；核心导入 `import { animate, createTimeline, stagger, eases, utils } from 'animejs'`（v4 无默认导出）。
- **animate 四基础参数**：`duration`（默认 1000ms）/`delay`/`loop`（默认 0）/`autoplay`（默认 true）；`ease` 取代 `easing`。
- **targets 四类型**：选择器字符串/DOM/JS 对象/数组，位置在函数第一参数（v3 是配置字段）。
- **Tween Value 六写法**：数值/带单位/相对值 `'+=n'`/颜色/CSS 变量 `'var()'`/函数式（第三参数 v4.4.0 起是 `targets` 数组）。
- **`composition`**：`replace`(默认)/`blend`/`none`。
- **Timeline**：`createTimeline().add(target, params, position)`；position 支持绝对时间/标签/`'<'`(上一个结束)/`'<<'`(上一个开始)/相对运算。
- **`stagger()`** 必须显式导入；`stagger(100)` 时间交错，`stagger([0,1])` 值域交错；`grid`/`axis`/`jitter`/`seed`/`use`。
- **keyframes**：属性级（数组值 / 对象数组）vs 顶层级（`keyframes` 数组 / 百分比对象），互不冲突。
- **eases**：内置族 `in`/`out`/`inOut`/`outIn` 四态；`spring()` 感知参数`bounce`+`duration` 或物理参数 `mass/stiffness/damping/velocity`；`steps()`/`cubicBezier()`/`linear()`/`irregular()`。
- **SVG**：`svg.morphTo()` 形变、`svg.createDrawable()` 描边（`draw:"start end"`）、`svg.createMotionPath()` 路径运动。
- **Draggable**：`createDraggable()`；`containerFriction`（拖拽中）≠ `releaseContainerFriction`（松手后）。
- **ScrollObserver**：`onScroll()` 塞进 `autoplay` 字段；方向细分回调 `onEnter/onEnterForward/onEnterBackward` 等。
- **utils**：`$/set/get/remove/clamp/round/snap/mapRange/lerp/damp/random` 等，部分可直接当 `modifier`。
- **Scope**：`createScope()` 给 React 等框架提供 `mediaQueries` + 批量 `revert()` 的标准接入范式。
- **v3→v4 核心变化**：无默认导出、`easing→ease`、`stagger` 必须导入、`direction` 拆 `reversed`/`alternate`、`.play()/.reverse()` 恒定方向。
- **v4 内部也有 breaking change**：v4.4.0 transform 渲染顺序固定 + 函数式回调第三参数 `total→targets`。
- **选型口径**：轻量免费非框架绑定 + SVG 特效 → Anime.js；插件生态成熟度/边缘案例稳定性优先 → GSAP；零依赖极简单一次性 → 原生 WAAPI；React/Vue 声明式布局动画 → Motion（原 Framer Motion）。

## 一、安装与导入速查

```bash
npm install animejs
```

| 方式 | 写法 | 场景 |
| --- | --- | --- |
| 主入口具名导入 | `import { animate, createTimeline, stagger } from 'animejs'` | 走 tree-shaking，日常推荐 |
| 子路径导入 | `import { animate } from 'animejs/animation'` | 无 bundler / 极限体积场景 |
| CDN ESM | `import { animate } from 'https://esm.sh/animejs'` | 浏览器 `type="module"` |
| CDN UMD | `<script src=".../anime.umd.min.js">` 挂全局变量 `anime` | 兼容旧写法过渡场景 |

## 二、animate() 核心参数速查

| 分类 | 字段 | 说明 |
| --- | --- | --- |
| 基础播放 | `duration`（默认 1000）/`delay`（默认 0）/`loop`（默认 0）/`autoplay`（默认 true） | 毫秒为单位 |
| Tween 五件套 | `to`/`from`/`delay`/`duration`/`ease` | 可在属性级覆盖全局 |
| 合成 | `composition` | `replace`(默认覆盖)/`blend`(叠加)/`none`(独立不干扰) |
| 加工 | `modifier` | 渲染前对计算值再加工的函数 |
| 回调 | `onComplete`/`onUpdate`/`onBegin` | 写在配置对象里 |
| targets | 选择器字符串/DOM/`{value}`对象/数组 | 函数第一参数，四类型延续 v3 |

**Tween Value 六种写法**：数值 `100`、带单位 `'2rem'`、相对值 `'+=50'`/`'-=10'`、颜色 `'#ff0000'`、CSS 变量 `'var(--x)'`、函数式 `(target, index, targets) => ...`（第三参数 v4.4.0 起是 `targets` 数组而非 `total` 数字）。

**可动画属性**：CSS 属性、CSS transform、CSS 变量、JS 对象属性、HTML 属性、SVG 属性；**v4.4.0 起 transform 渲染顺序固定**为 `perspective > translate > rotate > scale > skew`，不再跟随书写顺序。

## 三、Timeline 与 stagger 速查

**位置参数**

| 写法 | 含义 |
| --- | --- |
| `500`（数字） | 绝对时间 |
| `'label'` | 标签处 |
| `'<'` | 上一个动画**结束**位置 |
| `'<<'` | 上一个动画**开始**位置 |
| `'+=100'`/`'-=50'`/`'*=1.5'` | 相对运算 |
| `'<<+=250'` | 组合写法 |
| 不写 | 接在时间轴末尾 |

**Timeline 方法**：`add()`/`set()`/`sync()`/`label()`/`call()`/`remove()`；播放控制 `play`/`pause`/`resume`/`restart`/`reverse`/`alternate`/`complete`/`cancel`/`revert`/`seek`/`stretch`/`refresh`（与 Timer/Animation 通用，三者共享同一基类）。

**stagger() 参数**：`start`（起点偏移）/`from`（`'first'`/`'last'`/`'center'`/索引/`'random'`）/`reversed`/`ease`/`grid`+`axis`（二维，v4.5 起支持 3D `[cols,rows,depth]`/`{x,y,z}`）/`modifier`/`total`/`use`（v4.1.0）/`jitter`/`seed`（v4.4.0/v4.5.0）。

**keyframes 四写法**：①属性级 Tween value 数组 ②属性级 Tween parameters 对象数组 ③顶层 `keyframes` 数组（Duration-based，某帧不写 duration = 总时长/帧数） ④顶层 `keyframes` 百分比对象（Percentage-based）。`playbackEase` 对整链再套一层缓动，与逐帧 `ease` 是两层概念。

## 四、eases 速查表

| 族/函数 | 说明 |
| --- | --- |
| `linear`/`Quad`/`Cubic`/`Quart`/`Quint`/`Sine`/`Expo`/`Circ`/`Bounce` | 每种都有 `in`/`out`/`inOut`/`outIn` 四态 |
| `Back` | 可带 overshoot 参数 |
| `Elastic` | 可带 amplitude/period 参数 |
| `in(power)`/`out(power)`/`inOut(power)` | 参数化通用幂函数 |
| `spring({bounce, duration})` | 感知参数；`duration` 会覆盖 animate 自身 duration |
| `spring({mass, stiffness, damping, velocity})` | 物理参数，默认 1/100/10/0 |
| `steps(n, fromStart=false)` | fromStart 决定阶梯跳变在每步开头还是末尾 |
| `cubicBezier(x1,y1,x2,y2)` | x∈[0,1]，y 任意 |
| `linear(...stops)` | 至少两停靠点，首尾不能带百分比 |
| `irregular(steps, randomness=1)` | 随机插值制造抖动 |

导入：`import { eases, cubicBezier, spring } from 'animejs'`（具名）或 `import { easings } from 'animejs'`（命名空间，`easings.eases.inOut(3)`）。

## 五、SVG 速查表

| 函数 | 目标类型 | 说明 |
| --- | --- | --- |
| `svg.morphTo(shapeTarget, precision=0.33)` | `SVGPathElement`/`SVGPolylineElement`/`SVGPolygonElement` | 形状变形，返回值赋给 `points`/`d` |
| `svg.createDrawable(target)` | `SVGLineElement`/`SVGPathElement`/`SVGPolylineElement`/`SVGRectElement` | 描边，暴露 `draw:"start end"` 虚拟属性 |
| `svg.createMotionPath(path, offset=0)` | 路径元素或选择器 | 返回 `{translateX,translateY,rotate}`，配 `...` 展开 |

`draw` 语法：`'0 0'` 完全不显示、`'0 1'` 完整显示、`'1 1'` 完全隐藏。`vector-effect: non-scaling-stroke` 会拖慢 `createDrawable` 性能。

## 六、Draggable 速查

| 分类 | 参数 |
| --- | --- |
| Axes（x/y 独立） | `snap`/`modifier`/`mapTo` |
| 容器 | `container`/`containerPadding`/`containerFriction`（拖拽中）/`releaseContainerFriction`（松手后，二者时机不同） |
| 释放物理 | `releaseMass`/`releaseStiffness`/`releaseDamping`/`releaseEase` |
| 速度 | `velocityMultiplier`/`minVelocity`/`maxVelocity` |
| 其他 | `trigger`/`dragSpeed`/`dragThreshold`/`scrollThreshold`/`scrollSpeed`/`cursor` |
| 回调 | `onGrab`/`onDrag`/`onUpdate`/`onRelease`/`onSnap`/`onSettle`/`onResize`/`onAfterResize` |
| 方法 | `disable`/`enable`/`setX`/`setY`/`animateInView`/`scrollInView`/`stop`/`reset`/`revert`/`refresh` |

## 七、ScrollObserver 速查

| 分类 | 内容 |
| --- | --- |
| 用法 | 塞进动画 `autoplay: onScroll({...})` 字段，而非独立监听器 |
| Settings | `container`/`target`/`debug`/`axis`/`repeat` |
| Thresholds | 数值像素 / 位置简写（`'bottom top'`）/ 相对偏移（`'top+100'`）/`{min,max}` |
| 同步模式 | 方法名模式 / 播放进度模式 / 平滑滚动模式 / 缓动滚动模式 |
| 回调 | `onEnter`/`onEnterForward`/`onEnterBackward`/`onLeave`/`onLeaveForward`/`onLeaveBackward`/`onUpdate`/`onSyncComplete`/`onResize` |
| 方法 | `link()`/`refresh()`/`revert()` |

## 八、utils 工具函数速查表

| 分类 | 函数 |
| --- | --- |
| 选择与设置 | `$(selector)`/`set()`/`get()`/`remove()`/`cleanInlineStyles()` |
| 随机 | `random(min,max)`/`createSeededRandom(seed)`/`randomPick(arr)`/`shuffle(arr)` |
| 数值 | `clamp(v,min,max)`/`round(v,decimals)`/`snap(v,increment)`/`mapRange(v,inMin,inMax,outMin,outMax)`/`lerp(a,b,t)`/`damp(x,y,factor,dt)` |
| 角度 | `degToRad(deg)`/`radToDeg(rad)` |
| 时序 | `keepTime()`（v4.1.0，重建时保留播放进度，常配 `createScope` 的 `mediaQueries`） |

部分函数（如 `utils.round(2)`）可直接当 `modifier` 回调使用，是 v3 `round` 参数在 v4 里的替代写法。

## 九、Scope：框架集成速查

```javascript
// React 范式（useEffect + createScope）
const root = useRef(null);
const scope = useRef(null);

useEffect(() => {
  scope.current = createScope({ root }).add(self => {
    animate('.box', { x: 100 });
    self.add('customMethod', (params) => { /* 注册可从外部调用的方法 */ });
  });
  return () => scope.current.revert();   // 卸载时统一清理
}, []);
```

`createScope({ root, mediaQueries, defaults })` 让一批 Anime.js 实例感知媒体查询（回调里 `self.matches.xxx`）、绑定自定义根节点、共享默认参数，并支持批量 `revert()` 一次性清理。方法：`add()`（媒体查询变化时重跑）/`addOnce()`（只跑一次，v4.1.0）/`keepTime()`/`revert()`/`refresh()`。

## 十、v3 → v4 对照表

| v3 写法 | v4 写法 | 备注 |
| --- | --- | --- |
| `import anime from 'animejs'` | `import { animate } from 'animejs'` | 无默认导出，改具名 |
| `anime({targets:'div', ...})` | `animate('div', {...})` | targets 从字段变第一参数 |
| `anime.timeline()` | `createTimeline()` | |
| `anime.stagger()` | `stagger()` | 必须显式 import |
| `anime.remove/get/set/random()` | `utils.remove/get/set/random()` | 收拢进 utils 命名空间 |
| `anime.path()` | `svg.createMotionPath()` | |
| `anime.setDashoffset()` | `svg.createDrawable()` | 不用再手算 stroke-dashoffset |
| `easing: 'easeInOutQuad'` | `ease: 'inOutQuad'` | 字段名+值写法都变 |
| `direction: 'reverse'`/`'alternate'` | `reversed: true`/`alternate: true` | 一个字段拆两个布尔 |
| `endDelay` | `loopDelay` | 概念对应迁移 |
| `easing: 'spring(mass,stiffness,damping,velocity)'`（字符串） | `ease: spring({mass,stiffness,damping,velocity})`（对象） | 早期迁移向导写 `createSpring()`，当前统一 `spring()` |
| `.play()`/`.reverse()`（切换语义） | `.play()`（恒定正向）/`.reverse()`（恒定反向）/`.resume()`（恢复暂停） | 语义从切换变为恒定方向 |
| Timeline `seek()` 只认整体一轮 | 子项 loop/方向计入总时长，可 seek 穿越循环轮次 | v4 架构改进 |

## 十一、易错点清单

- **整包心智要重启**：v4 是 ESM-first 具名导出，彻底没有 v3 那个万能默认导出 `anime` 对象；2025 年之前发布的教程只要出现裸 `anime({...})` 调用，判定是 v3 写法。
- **easing 改名**：`easing:'easeInOutQuad'` → `ease:'inOutQuad'`，字段名和值的写法都变了，双重坑。
- **targets 位置变了、类型没变**：CSS 选择器/DOM/对象/数组四种目标类型延续 v3，只是从配置字段挪到了函数第一参数。
- **stagger 必须显式导入**：忘记 `import { stagger }` 是新手期最高频的报错来源。
- **v4 内部也有 breaking change**：v4.4.0 就动了 transform 渲染顺序和函数式取值回调第三参数（`total`→`targets`），升级前务必看 changelog。
- **spring 命名新旧不一致**：官方 wiki 迁移指南写 `createSpring()`，当前 v4.5.0 文档站与实际用法统一为 `spring()`。
- **SVG 描边动画不用再手算 stroke-dashoffset**：`svg.createDrawable()` 的 `draw:"start end"` 直接表达"画到哪儿"。
- **Timeline `<` 与 `<<` 反着记**：`<` 是上一个动画的结束点，`<<` 是开始点，直觉容易记反。
- **WAAPI 版本不是"加个参数"就能切换**：`waapi.animate()` 是完全独立的命名空间/入口，功能子集也不同（无 `composition`/`modifier`/`frameRate`/`playbackEase`/`stretch()`/`refresh()`）。
- **无 bundler 环境下的 ESM 加载**：裸 `<script>` 写 `import {animate} from 'animejs'` 若不搭配 `type="module"` + CDN ESM 地址或 importmap，会因找不到裸模块说明符报错。
- **`containerFriction` vs `releaseContainerFriction`**：前者拖拽中越界摩擦，后者释放后越界回弹摩擦，命名相似但生效时机完全不同。

## 十二、选型对比

| 维度 | Anime.js v4 | GSAP | 原生 WAAPI | Motion（原 Framer Motion） |
| --- | --- | --- | --- | --- |
| 许可/费用 | MIT 完全免费开源 | 2024 年被 Webflow 收购后现已 100% 免费，含原付费插件，许可条款为 GSAP 自有协议而非标准 MIT | 浏览器标准，免费 | 核心免费 + 付费 Motion+（约 £299 终身制）解锁高级组件 |
| 框架绑定 | 无绑定，vanilla JS 为核心，文档另给 React 接入范式（`createScope`+`useEffect`） | 无绑定，配合任意框架 | 无绑定，浏览器原生 API | 已从 React 独占扩展到 React/JavaScript/Vue 三端 |
| 体积 | 模块化按需引入，`waapi.animate()` 约 3KB，完整 JS 版约 10KB | 相对更大（核心+插件累加），支持部分插件按需引入 | 零额外体积（浏览器内置） | 官网强调极小包体积，具体量级视引入的功能子集而定 |
| 功能广度 | Timer/Timeline/Draggable/ScrollObserver/SVG(morph+draw+motionPath)/Text(split+scramble)/Layout/Three.js adapter，v4 时代基本追平 GSAP 覆盖面 | 插件生态历史最悠久，ScrollTrigger/Flip/MorphSVG/Physics2D 等边缘案例打磨多年 | 仅基础补间，无内置 timeline/stagger/draggable/scroll 编排能力 | 侧重 React/Vue 声明式动画（variants/手势/layout animation） |
| 性能定位 | JS 版走 rAF 引擎 + 可选 WAAPI 轻量入口两条腿走路 | 长期口碑"性能优先"，内部同样可利用 WAAPI/CSS | 原生实现，硬件加速上限最高，但易用性/编排能力最低 | 对声明式状态驱动动画做了大量优化（如 layout animation 用 FLIP） |
| 心智模型 | 命令式：`animate(targets, params)`，接近原生 DOM 操作习惯 | 命令式，API 设计哲学与 Anime.js 接近 | 命令式，但更底层（`el.animate(keyframes, options)`） | 声明式：组件 props/variants 驱动 |
| 选型建议 | 轻量、免费、非框架绑定 + SVG 特色效果优先 | 极致边缘案例稳定性、大型商业项目、插件生态成熟度优先 | 只需极简单一次性过渡、零依赖零体积 | 已是 React/Vue 技术栈且动画状态与组件状态强绑定 |

## 十三、延伸模块速览

以下模块 v4 已具备但非本篇深入重点，写代码/选型时需知道它们存在：

| 模块 | 定位 |
| --- | --- |
| `createAnimatable` | 为"高频取值场景"（跟随鼠标/滚轮）优化的对象，是 `animate()`/`utils.set()` 的更高效替代 |
| Text（`splitText()`/`scrambleText()`） | 拆字/词/行（含无空格语言分词、无障碍处理）、字符打乱重组特效（v4.4.0 新增） |
| Layout | 类 FLIP 的自动布局动画，监听 DOM 顺序变化/进出场/父节点切换等场景自动补间 |
| Adapters（`registerAdapter()`） | v4.5.0 新增，让 `animate()`/`utils.set()` 扩展到非 DOM 目标；官方内置 Three.js adapter 可动画 `Object3D`、材质 uniform、灯光相机、实例化网格 |

## 十四、资源链接

- [Anime.js 官网](https://animejs.com) ｜ [文档首页](https://animejs.com/documentation/)
- [Getting Started](https://animejs.com/documentation/getting-started/installation) ｜ [Module Imports](https://animejs.com/documentation/getting-started/module-imports) ｜ [Using with React](https://animejs.com/documentation/getting-started/using-with-react)
- [Animation（animate()）](https://animejs.com/documentation/animation) ｜ [Keyframes](https://animejs.com/documentation/animation/keyframes)
- [Timeline](https://animejs.com/documentation/timeline) ｜ [Time Position](https://animejs.com/documentation/timeline/time-position)
- [Timer](https://animejs.com/documentation/timer)
- [Easings](https://animejs.com/documentation/easings) ｜ [Spring](https://animejs.com/documentation/easings/spring) ｜ [Steps](https://animejs.com/documentation/easings/steps-easing)
- [Utilities](https://animejs.com/documentation/utilities) ｜ [Stagger](https://animejs.com/documentation/utilities/stagger)
- [SVG](https://animejs.com/documentation/svg) ｜ [morphTo](https://animejs.com/documentation/svg/morphto) ｜ [createDrawable](https://animejs.com/documentation/svg/createdrawable) ｜ [createMotionPath](https://animejs.com/documentation/svg/createmotionpath)
- [Draggable](https://animejs.com/documentation/draggable)
- [Events / ScrollObserver](https://animejs.com/documentation/events)
- [Scope](https://animejs.com/documentation/scope)
- [Web Animation API 集成](https://animejs.com/documentation/web-animation-api)
- [Engine](https://animejs.com/documentation/engine)
- [GitHub 仓库](https://github.com/juliangarnier/anime) ｜ [Releases](https://github.com/juliangarnier/anime/releases)
- [v3→v4 官方迁移指南（GitHub Wiki）](https://github.com/juliangarnier/anime/wiki/Migrating-from-v3-to-v4)
- 对比信源：[GSAP 定价页](https://gsap.com/pricing/) ｜ [Motion 官网](https://motion.dev/)
- 站内对比：[GSAP 笔记](../gsap/) ｜ [Web Animations API 笔记](../waapi/) ｜ [Framer Motion 笔记](../framer-motion/)

---

回到[本叶概览](./index)，或从[入门](./getting-started)重新过一遍主线。
