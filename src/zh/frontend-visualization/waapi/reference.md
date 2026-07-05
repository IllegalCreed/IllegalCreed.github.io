---
layout: doc
outline: [2, 3]
---

# 参考：WAAPI 速查表

> 基于 Web Animations API（2026 浏览器基线）· 核于 2026-07

## 速查

- **心智模型**：时序模型（`document.timeline` 主时间轴 + `startTime` 锚定）+ 动画模型（沿 duration 的样式快照序列，支持任意跳转）。
- **DVD 类比三层**：`Timeline`（时间轴）→ `Animation`（播放器）→ `AnimationEffect`/`KeyframeEffect`（光盘：关键帧 + timing）。
- **创建**：`element.animate(keyframes, options)` 返回 `Animation`；等价三步 `new KeyframeEffect()` → `new Animation()` → `.play()`。
- **关键帧两格式**：数组 `[{opacity:0},{opacity:1}]` / object `{opacity:[0,1]}`，能力无差异，纯书写习惯；CSS 属性名转驼峰，`float`/`offset` 用 `cssFloat`/`cssOffset`。
- **EffectTiming 9 项**：`duration`(auto)/`easing`(linear)/`iterations`(1)/`iterationStart`(0)/`direction`(normal)/`fill`(none)/`delay`(0)/`endDelay`(0)/`composite`(replace)。
- **`fill` 最高频坑**：默认 `none` 动画结束回弹；`forwards`/`backwards`/`both` 三个非默认值分别保终态/保首帧/两者都要。
- **单位与默认值两大迁移坑**：`duration` 毫秒（CSS 是秒）；`easing` 默认 `linear`（CSS 默认 `ease`）。
- **播放方法**：`play`/`pause`/`reverse`（非直觉：已结束时调用会完整倒放一遍）/`finish`/`cancel`。
- **变速跳转**：`playbackRate`（瞬时）/`updatePlaybackRate()`（平滑）/`currentTime`（毫秒，可 scrubbing）。
- **两个 Promise**：`ready`（合成器就绪）/`finished`（播完 resolve，`cancel()` 时 reject）。
- **善后三件套**：`commitStyles()`（写死内联样式，需元素在渲染树中）+ `persist()`（防自动回收）+ `cancel()`（释放合成层）。
- **KeyframeEffect 复用**：`target` 可为 `null`，配合多个 `Animation` 复用同一份关键帧；`getKeyframes`/`setKeyframes`/`getTiming`/`getComputedTiming`/`updateTiming`。
- **`fill:"auto"` 专家坑**：`getTiming().fill` 可能显示 `auto`，`getComputedTiming().fill` 显示计算后的 `none`。
- **composite 三模式**：`replace`(覆盖)/`add`(相加)/`accumulate`(列表合并)——"不同动画效果之间"如何合成。
- **iterationComposite**：`replace`/`accumulate`——"同一动画多次迭代之间"是否累积，与 composite 维度不同。
- **Timeline 家族**：`AnimationTimeline` 基类（`currentTime`/`duration` 只读）→ `DocumentTimeline`(默认,Baseline 2020-07)/`ScrollTimeline`/`ViewTimeline`（后两者非 Baseline）。
- **getAnimations()**：`document.getAnimations()`/`element.getAnimations()`(含子树)，能抓到 CSS animation/transition + WAAPI 动画。
- **Scroll/ViewTimeline 构造选项**：`source`/`axis`（Scroll）；`subject`/`axis`/`inset`（View，0%=进入/100%=离开）。
- **CSS 等价写法坑**：`animation-timeline` 是 `animation` 简写的 reset-only 值，须写在简写之后；`duration` 随手填 `1ms`；必配 `prefers-reduced-motion` 兜底。
- **2026 现状**：核心 WAAPI Baseline 广泛可用（2020 起）；Scroll-driven 非 Baseline（Chrome/Edge 2024-12 起可用，Firefox 历史滞后，Safari 需 polyfill）。
- **CSS 互操作边界**：CSS 动画底层也是 `Animation` 对象，可被 `getAnimations()` 操控但不能随意 `setKeyframes()`；JS 创建的动画不进 DevTools CSS 面板但进 `getAnimations()`。
- **选型结论**：不需要 JS 干预 → CSS 动画；播放控制/交互绑定 → WAAPI；逐帧自定义算法 → rAF；专业时间轴编排 → GSAP。
- **规范整体状态**：Web Animations Level 1 是 W3C Working Draft（CSSWG 维护），核心部分已是事实标准；Scroll-driven 部分兼容性最先落地于 Chrome/Edge。
- **历史 polyfill**：核心 WAAPI 曾有 `web-animations-js`（现代浏览器不需要）；Scroll-driven 部分 Safari 仍需 `flackr/scroll-timeline` 兜底。
- **层叠上下文**：动画播放期间元素类似隐式 `will-change`，可能改变 `z-index` 层叠顺序；`fill: forwards`/`both` 会让该层叠上下文保留。
- **典型交互绑定**：悬停暂停（`mouseenter`/`mouseleave` → `pause`/`play`）、拖拽进度条（`currentTime` scrubbing）、点击切反向（`reverse()`，注意非直觉行为）。
- **GSAP 与 WAAPI 关系**：GSAP 底层通常也走 WAAPI/CSS，效率接近原生，但提供了原生没有的时间轴编排能力（`timeline`/`stagger`/`labels`），二者非互斥。
- **`IntersectionObserver` 对比**：`ViewTimeline` 驱动的动画语义上类似 `IntersectionObserver` + rAF 手写方案，但运行在合成器线程、无需 JS 逐帧介入。
- **善后三选一**：只保终态不管资源 → `fill: forwards`；保终态且释放资源 → `commitStyles()` + `cancel()`；完成后仍需查询/操作 → `persist()`。

## 一、API 速查表

### 创建与顶层入口

| API | 说明 |
| --- | --- |
| `element.animate(keyframes, options)` | 一行创建动画，返回 `Animation`；`options` 可为数字（=duration 毫秒） |
| `new KeyframeEffect(target, keyframes, options)` | 单独构造效果，`target` 可为 `null` 以便复用 |
| `new Animation(effect, timeline?)` | 单独构造播放器，`timeline` 省略时默认 `document.timeline` |
| `document.timeline` | 默认 `DocumentTimeline` 实例 |
| `document.getAnimations()` / `element.getAnimations()` | 查询当前生效的所有动画（含 CSS 来源），`element` 版默认含子树 |

### Animation 对象：方法与属性

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `play()` / `pause()` | 方法 | 播放/继续、暂停 |
| `reverse()` | 方法 | 反向播放（等价 `playbackRate` 取负）；已结束/未播放时调用会完整倒放一遍 |
| `finish()` / `cancel()` | 方法 | 跳到终态触发 `finish` / 取消回到初态触发 `cancel` |
| `updatePlaybackRate(rate)` | 方法 | 平滑过渡到新速率，优于直接赋值 |
| `commitStyles()` | 方法 | 把当前计算样式写死进内联 style（元素须在渲染树中） |
| `persist()` | 方法 | 阻止 `finished` 后被自动回收 |
| `playbackRate` | 属性 | 直接赋值瞬时切换速率，负数倒放 |
| `currentTime` | 属性 | 毫秒，可读可写，赋值即跳转/scrubbing |
| `playState` | 属性（只读） | `idle`/`running`/`paused`/`finished`（另有过渡态 `pending`） |
| `startTime` | 属性（只读） | 相对 timeline 的绝对起点 |
| `id` | 属性 | 自定义标识，便于 `getAnimations()` 后筛选 |
| `effect` | 属性 | 关联的 `AnimationEffect`/`KeyframeEffect` |
| `ready` | Promise | 合成器准备好、真正开始播放前 resolve |
| `finished` | Promise | 播完/`finish()` 时 resolve，`cancel()` 时 reject |
| `onfinish` / `oncancel` | 事件回调 | 等价于 `addEventListener("finish"/"cancel", ...)` |

### KeyframeEffect / AnimationEffect：方法与属性

| 成员 | 说明 |
| --- | --- |
| `target` | 作用元素，可为 `null` |
| `pseudoElement` | 可作用于 `::before`/`::after` 等伪元素 |
| `composite` | 效果级合成方式：`replace`/`add`/`accumulate` |
| `iterationComposite` | 跨迭代合成方式：`replace`/`accumulate` |
| `getKeyframes()` | 拿到规范化后含计算 offset 的关键帧数组 |
| `setKeyframes(kf)` | 运行时替换关键帧 |
| `getTiming()` | 读取原始 timing 设置值 |
| `getComputedTiming()` | 读取计算后的 timing（如 `activeDuration`），`fill:"auto"` 在此显示为 `none` |
| `updateTiming(options)` | 运行时修改 timing |

### EffectTiming 选项

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `duration` | `"auto"` | 毫秒；不设置视为不播放 |
| `easing` | `"linear"` | 支持 `ease`/`ease-in-out`/`cubic-bezier()`/`steps()` |
| `iterations` | `1` | `Infinity` 无限循环（JS 关键字，非字符串） |
| `iterationStart` | `0` | 第一轮从动画进度的哪个百分比开始 |
| `direction` | `"normal"` | `normal`/`reverse`/`alternate`/`alternate-reverse` |
| `fill` | `"none"` | `none`/`forwards`/`backwards`/`both` |
| `delay` | `0` | 开始前延迟，毫秒 |
| `endDelay` | `0` | 结束后延迟，毫秒；`finished` 要等它结束才 resolve |
| `composite` | `"replace"` | `replace`/`add`/`accumulate` |

### Timeline 家族

| 类型 | 构造选项 | Baseline 状态 |
| --- | --- | --- |
| `AnimationTimeline`（基类） | — | 只读 `currentTime`/`duration` |
| `DocumentTimeline` | 无（`document.timeline` 即默认实例） | 自 2020-07 起 |
| `ScrollTimeline` | `source`（滚动容器）、`axis`（`block`/`inline`） | 2026 仍非 Baseline |
| `ViewTimeline` | `subject`（追踪元素）、`axis`、`inset`（起止偏移） | 2026 仍非 Baseline |

### CSS 等价属性/函数

| CSS | 对应 JS 概念 | 备注 |
| --- | --- | --- |
| `scroll-timeline-name` / `scroll-timeline-axis` | `ScrollTimeline` 具名声明 | 声明在滚动容器上 |
| `animation-timeline: --name` | 绑定具名时间轴 | 是 `animation` 简写的 reset-only 值，须写在简写之后 |
| `animation-timeline: scroll(...)` | 匿名 `ScrollTimeline` | 无需具名声明 |
| `animation-timeline: view()` | 匿名 `ViewTimeline` | 无需具名声明 |
| `prefers-reduced-motion` | 无 JS 直接对应 | 必配的无障碍降级开关 |

## 二、易错点清单

1. **`fill` 默认值是 `none`，动画结束后回弹**（全场最高频坑）：不设置 `fill: "forwards"`（或 `"both"`）时，动画一结束元素会瞬间跳回原始样式。
2. **`duration` 单位是毫秒，CSS 是秒**：常把 `2s` 直接写成 `duration: 2`，实际应为 `2000`。
3. **WAAPI 默认缓动是 `linear`，CSS 默认是 `ease`**：迁移时不显式设置 `easing`，视觉效果会不一样。
4. **`currentTime` 赋值单位也是毫秒**：容易和"百分比进度"混淆，需用 `getComputedTiming().activeDuration` 换算。
5. **`iterations` 无限循环要用 `Infinity`**（JS 关键字），不是字符串 `"infinite"`（CSS 才是字符串关键字）。
6. **`composite`/`iterationComposite` 概念容易混淆**：前者是"不同动画效果之间"如何合成，后者是"同一动画的多次迭代之间"如何合成，维度不同、互不替代。
7. **`commitStyles()` 有前提条件**：目标元素必须处于渲染树中且有可计算样式上下文，`display: none` 或未挂载到文档的元素调用会报错。
8. **`persist()` 忘记调用导致状态丢失**：默认动画 `finished` 后浏览器可能自动回收，之后再读它的 `effect`/`currentTime` 可能已不可靠。
9. **`animation-timeline`（CSS 滚动驱动）写在 `animation` 简写之前会被重置**：`animation` 简写包含 `animation-timeline` 的 reset-only 语义，必须调整声明顺序。
10. **Scroll-driven animations 不能假设全浏览器可用**（2026 现状 Safari 原生不支持）：用作核心交互必须做特性检测/polyfill。
11. **`Animation.reverse()` 不是"从当前进度往回倒"**：动画已 `finished` 或未播放时调用，会从终点重新完整倒放到起点。
12. **object 格式关键帧里 `offset` 数组长度可以比属性数组少 1**（隐式补 1），但乱填不递增的 offset 会直接抛错或被规范化，不是静默忽略。

## 三、选型对比：WAAPI vs CSS 动画 vs rAF vs GSAP

| 维度 | CSS 动画 | WAAPI | `requestAnimationFrame` | GSAP |
| --- | --- | --- | --- | --- |
| 定义方式 | 声明式，写在样式表 | 声明式关键帧 + JS 对象控制 | 命令式，每帧手算插值 | 声明式 API，JS 调用 |
| 播放控制 | 弱（改 class/CSS 变量间接控制） | 强：`play`/`pause`/`reverse`/`playbackRate`/`currentTime` | 强但要自己实现状态机 | 最强：timeline、label、stagger |
| 完成通知 | `animationend` 事件 | `finished` Promise（可 `await`/链式） | 自己维护回调 | 内置 Promise/callback |
| 整体缓动 | 仅 `animation-timing-function` | 整体 `easing` + 逐帧 `easing` | 完全自定义（含物理缓动） | 内置丰富缓动库（含弹簧） |
| 性能 | 合成线程动画 | 与 CSS 动画同源，同等性能 | 主线程 JS 每帧计算 | 底层通常也走 WAAPI/CSS |
| 依赖 | 无 | 无（浏览器原生） | 无 | 需引入第三方库 |
| 互操作 | 可被 `getAnimations()` 反向操控 | 原生一等公民 | 独立于 WAAPI 生态 | 部分场景可桥接到 WAAPI |
| 复杂编排 | 弱 | 一般（需自拼多个 Animation） | 弱（全靠手写调度） | 强项：`timeline()`/`stagger`/`labels` |
| 适用场景 | 简单、不需 JS 干预的循环动画 | 动态播放控制、交互强绑定 | 非关键帧可描述的自定义物理/手势 | 复杂时间轴编排、成熟插件生态 |

**选型结论**：纯展示不需要 JS 干预 → CSS 动画最省事；需要 JS 层面播放控制但不想引第三方库 → WAAPI；需要逐帧算法自定义（弹性物理、跟手拖拽、Canvas/WebGL 同步）→ rAF 手写；需要专业级时间轴编排（大量元素 stagger、ScrollTrigger 等成熟插件）→ GSAP。滚动驱动效果：轻量诉求优先原生 CSS `scroll()`/`view()`（2026 仍需兜底 Safari）；复杂滚动交互场景 GSAP ScrollTrigger 方案仍更成熟稳妥。

## 四、浏览器基线状态（2026-07）

| 特性 | 基线状态 |
| --- | --- |
| `Element.animate()` / `KeyframeEffect` / `AnimationEffect` | Baseline 广泛可用，自 2020-03 起 |
| `DocumentTimeline` / `AnimationTimeline` | Baseline 广泛可用，自 2020-07 起 |
| `Document.getAnimations()` / `Element.getAnimations()` | Baseline 广泛可用，自 2020-09 起 |
| `ScrollTimeline` / `ViewTimeline`（JS） | **非 Baseline**（2026-07 MDN 标注 Limited availability） |
| CSS `animation-timeline` / `scroll()` / `view()` | **非 Baseline**；Chrome/Edge 2024-12 起可用，Firefox 历史滞后，Safari 需 polyfill |

历史上曾有官方 polyfill [web-animations-js](https://github.com/web-animations/web-animations-js) 用于补齐核心 WAAPI，现代浏览器已不需要；Scroll-driven 部分 Safari 仍需 [flackr/scroll-timeline](https://github.com/flackr/scroll-timeline) polyfill 兜底。

## 五、权威链接

- [MDN Web Animations API 总览](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Animations_API) —— 总览与使用指南入口
- [MDN 使用 Web Animations API](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Animations_API/Using_the_Web_Animations_API) —— 使用教程
- [MDN Element.animate()](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/animate) —— 创建动画的核心方法
- [MDN Animation 接口](https://developer.mozilla.org/zh-CN/docs/Web/API/Animation) —— 播放控制完整 API
- [MDN KeyframeEffect（英文）](https://developer.mozilla.org/en-US/docs/Web/API/KeyframeEffect) —— 可复用动画效果
- [MDN 关键帧格式](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Animations_API/Keyframe_Formats) —— 数组/object 两种格式细节
- [MDN Web Animations API Concepts](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Web_Animations_API_Concepts) —— 时序模型/动画模型
- [MDN ScrollTimeline（英文）](https://developer.mozilla.org/en-US/docs/Web/API/ScrollTimeline) —— 滚动驱动时间轴
- [MDN ViewTimeline（英文）](https://developer.mozilla.org/en-US/docs/Web/API/ViewTimeline) —— 可见性驱动时间轴
- [MDN CSS 滚动驱动动画总览（英文）](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations) —— CSS 等价写法总览
- [MDN 使用技巧（Tips）](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Animations_API/Tips) —— 实践建议
- [Web Animations Level 1（W3C/CSSWG 草案）](https://drafts.csswg.org/web-animations-1/) —— 权威规范文本
- [CSS-Tricks · CSS Animations vs Web Animations API](https://css-tricks.com/css-animations-vs-web-animations-api/) —— 与 CSS 动画关系的精辟评价
- [CSS-Tricks · Let's talk about the Web Animations API](https://css-tricks.com/lets-talk-about-the-web-animations-api/) —— 入门视角
- [CSS-Tricks · Additive Animation with the Web Animations API](https://css-tricks.com/additive-animation-web-animations-api/) —— composite 合成实践
