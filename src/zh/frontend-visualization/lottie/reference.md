---
layout: doc
outline: [2, 3]
---

# 参考：loadAnimation / 播放 API / 事件 / dotLottie 速查

> 基于 lottie-web 5.13 / dotLottie · 核于 2026-07

## 速查

- **定位**：AE 动画经 Bodymovin 插件导出 JSON，跨平台运行时原生渲染；`lottie-web`（经典，Airbnb 官方）与 **dotLottie**（新一代，LottieFiles 官方主推）两条路线并行。
- **`loadAnimation`**：`container`（必需 DOM 容器）/`renderer`（`svg`\|`canvas`\|`html`）/`loop`/`autoplay`/`path` 与 `animationData` 二选一/`name`/`rendererSettings`；返回 `AnimationItem` 实例。
- **播放 API**：`play`/`pause`/`stop`/`setSpeed`/`setDirection`/`goToAndStop`/`goToAndPlay`/`playSegments`/`setSubframe`/`getDuration`/`destroy`。
- **事件**：`complete`/`loopComplete`/`drawnFrame`/`enterFrame`/`segmentStart`/`config_ready`/`data_ready`/`data_failed`/`loaded_images`/`DOMLoaded`/`destroy`；也可用 `onXxx` 回调属性形式。
- **渲染器**：svg（默认，功能最全，含 track matte/真实字体）/canvas（性能更好，丢文字排版 + 部分蒙版效果）/html（用得最少）；3D 图层三者均不支持或仅部分（html）支持。
- **`.lottie` 格式**：zip 压缩容器，`manifest.json` + `a/`（动画）+ 可选 `i/`（资源）/`t/`（主题）/`s/`（状态机）；四大优势体积/多动画打包/主题/原生状态机。
- **`DotLottie` 播放器**：构造用 `canvas` 元素（**非** lottie-web 的 `container`）；`mode`（`forward`/`reverse`/`bounce`/`reverse-bounce`）/`layout.fit`/`useFrameInterpolation`；`DotLottieWorker` 做离屏 Worker 渲染。
- **状态机**：Inputs/States/Transitions/Interactions 四要素；`stateMachineLoadData` 后必须显式 `stateMachineStart()`；对标交互竞品 Rive。
- **Web Component 三代**：`<lottie-player>`（已废弃）→ `<dotlottie-player>`（已废弃）→ `<dotlottie-wc>`（**当前推荐**）。
- **框架集成**：React 侧 `lottie-react`/`react-lottie-player`/`@lottiefiles/react-lottie-player` 三个相似命名包需分清；Vue 侧 `vue3-lottie`（社区，包装 lottie-web）/`dotlottie-vue`（官方，对接 dotLottie）。
- **性能优化**：渲染器选型是最大杠杆；`useFrameInterpolation`（dotLottie）/`setSubframe`（lottie-web）控制子帧插值；`freezeOnOffscreen` 懒渲染；`DotLottieWorker` 脱离主线程；体积优化走 `.lottie` 格式。
- **选型口径**：复杂矢量动效、要求跨端一致首选 Lottie；简单过渡用 CSS 更轻量；写实影像用视频；需要重交互 + 状态机驱动可评估 Rive。

## 一、loadAnimation 参数速查表

| 参数 | 说明 |
| --- | --- |
| `container` | 必需，DOM 容器，需提前用 CSS 设好宽高 |
| `renderer` | `'svg'` \| `'canvas'` \| `'html'`，默认 `svg` |
| `loop` | `true` / `false` / 数字（循环次数） |
| `autoplay` | 加载完是否立即播放 |
| `path` | JSON 文件路径，与 `animationData` 二选一 |
| `animationData` | 直接传 JSON 对象，与 `path` 二选一；含 repeater 复用同一对象需深克隆 |
| `name` | 可选命名，便于多实例场景按名引用 |
| `rendererSettings` | 渲染器专属配置，见第四节 |

## 二、播放控制 API 速查表

| 方法 | 参数 | 作用 |
| --- | --- | --- |
| `play()` | — | 从当前帧播放 |
| `pause()` | — | 暂停在当前帧 |
| `stop()` | — | 停止并回到第一帧 |
| `setSpeed(speed)` | 数值，`1` = 正常速度 | 调整播放速度 |
| `setDirection(direction)` | `1` 正向，`-1` 反向 | 播放方向 |
| `goToAndStop(value, isFrame)` | `value` 时间或帧号；`isFrame` 默认 `false` | 跳转并停止 |
| `goToAndPlay(value, isFrame)` | 同上 | 跳转并播放 |
| `playSegments(segments, forceFlag)` | `[start,end]` 或多段数组；`forceFlag` 立即生效 vs 等当前段播完 | 只播放指定片段 |
| `setSubframe(useSubFrames)` | 布尔，默认 `true` | 是否逐 rAF 平滑插值 |
| `getDuration(inFrames)` | 布尔 | `true` 返回帧数，`false` 返回秒数 |
| `destroy()` | — | 释放实例资源，**必须调用** |

全局 `lottie` 对象：`setQuality()`/`freeze()`/`unfreeze()`/`resize()`/`inBrowser()`/`setLocationHref()`，作用于**全部实例**。

## 三、事件速查表

| 事件 | 触发时机 |
| --- | --- |
| `complete` | 播放完成 |
| `loopComplete` | 一轮循环完成 |
| `drawnFrame` | 每帧绘制后 |
| `enterFrame` | 每帧进入时 |
| `segmentStart` | 片段开始播放 |
| `config_ready` | 初始配置就绪 |
| `data_ready` | 全部动画数据加载完成 |
| `data_failed` | 部分数据加载失败 |
| `loaded_images` | 图片资源加载完成 |
| `DOMLoaded` | 已插入 DOM |
| `destroy` | 实例销毁 |

绑定用 `animation.addEventListener(name, handler)` / `removeEventListener(name, handler)`；也可用回调属性形式：`onComplete`/`onLoopComplete`/`onEnterFrame`/`onSegmentStart`。

## 四、渲染器能力矩阵速查表

| 维度 | svg（默认） | canvas | html |
| --- | --- | --- | --- |
| 渲染方式 | 生成 SVG DOM 节点树 | 位图绘制 | DOM 元素拼接 |
| 可 CSS 控制 | 是 | 否 | 部分 |
| 复杂动画性能 | 图层多时下降 | 更好 | 最差 |
| track matte / expanded masks | **仅 svg 支持** | 不支持 | 不支持 |
| text as font | 支持 | **不支持**（仅 glyph） | 支持 |
| 3D 图层 | 不支持 | 不支持 | 部分支持 |
| blend modes | 支持（IE/Edge 除外） | 支持 | 支持 |

`rendererSettings` 关键项：`preserveAspectRatio`（SVG 视口对齐）、`progressiveLoad`/`hideOnTransparent`（仅 svg）、`context`/`clearCanvas`（仅 canvas）。体积优化：lottie-web 提供 light（无 Expressions 插件）/full 两套构建。

## 五、dotLottie 速查表

### `.lottie` 容器结构

| 路径 | 说明 |
| --- | --- |
| `manifest.json` | 必需，元数据 + 索引（`version`/`generator`/`initial`/`animations[]`/`themes[]`/`stateMachines[]`） |
| `a/{id}.json` | 动画本体（Lottie JSON） |
| `i/` | 可选，图片等共享资源 |
| `t/{id}.json` | 可选，主题 |
| `s/{id}.json` | 可选，状态机 |

### `DotLottie` 构造参数

| 参数 | 说明 |
| --- | --- |
| `canvas` | 必需，`<canvas>` 元素（非 lottie-web 的 `container` div） |
| `src` / `data` | `.lottie`/`.json` 地址或直接传数据 |
| `mode` | `forward`/`reverse`/`bounce`/`reverse-bounce` |
| `useFrameInterpolation` | 子帧插值开关，对标 lottie-web 的 `setSubframe` |
| `segment` | 帧区间 `[start, end]` |
| `layout` | `{ fit, align }`，`fit` 取值 `contain`/`cover`/`fill`/`fit-width`/`fit-height`/`none` |
| `marker` / `themeId` | 从命名 marker 开始 / 指定主题 |

方法：`play`/`pause`/`stop`/`setFrame`/`setSpeed`/`load`/`loadAnimation(id)`/`destroy`/`setLayout`/`setMarker`/`setSegment`/`setTheme`/`setThemeData`/`markers()`。事件新增：`load`/`loadError`/`ready`/`render`/`freeze`。`DotLottieWorker` 同参数 + `workerId` 做离屏渲染；渲染后端通过子路径切换：默认（Software/Canvas2D）/`/webgl`/`/webgpu`。

### 状态机 API

| API | 作用 |
| --- | --- |
| `stateMachineLoadData(json)` / `stateMachineLoad(id)` | 加载状态机定义（文件内置或外部 JSON） |
| `stateMachineStart()` | **必须显式调用**才真正激活 |
| `stateMachineFireEvent(name)` | 触发事件信号 |
| `stateMachineSetNumericInput` / `SetBooleanInput` / `SetStringInput` | 向状态机写入变量 |

四要素：Inputs（变量 + 事件）、States（播放配置，如 `PlaybackState`/`GlobalState`）、Transitions（guard + 可选 `Tweened` 过渡）、Interactions（`PointerDown`/`OnComplete` 等绑定 action）。构建工具：`@dotlottie/dotlottie-js`（`addAnimation`/`addStateMachine`/`build`/`toArrayBuffer`）。

## 六、Web Component 播放器三代对照表

| 标签 | 包 | 状态 |
| --- | --- | --- |
| `<lottie-player>` | `@lottiefiles/lottie-player` | 已废弃，包装经典 lottie-web |
| `<dotlottie-player>` | `@dotlottie/player-component` | 已废弃，superceded by dotlottie-wc |
| `<dotlottie-wc>` | `@lottiefiles/dotlottie-wc` | **当前推荐**，包装 dotlottie-web/ThorVG |

`<dotlottie-wc>` 已确认属性：`src`（`.lottie`/`.json` 均可）/`autoplay`/`loop`；更完整配置以 API Reference 页为准，不要凭旧组件属性表直接套。

## 七、框架集成速查对照表

### React

| 包 | 作者/归属 | 用法特点 |
| --- | --- | --- |
| `lottie-react` | Gamote | 组件 `<Lottie>` + hook `useLottie`，`lottieRef` 拿实例 |
| `react-lottie-player` | mifi（无 scope） | 声明式 `play` 布尔 props，自动深克隆 `animationData` |
| `@lottiefiles/react-lottie-player` | LottieFiles（指向 `lottie-react` 仓库） | 与 Gamote 的 `lottie-react` 同名异库，命名极易混淆 |

### Vue

| 包 | 归属 | 用法特点 |
| --- | --- | --- |
| `vue3-lottie` | 社区（megasanjay） | 包装 lottie-web，仅 Vue 3 |
| `@lottiefiles/dotlottie-vue` | LottieFiles 官方 | 对接 dotLottie，`getDotLottieInstance()` 拿底层实例 |

## 八、易错点清单

1. **容器没设尺寸**：`container`（lottie-web）或 `canvas`（dotLottie）没有显式 CSS/属性宽高 → 动画区域塌陷不可见。✅ 提前用 CSS 或元素属性设好尺寸。
2. **`path` 和 `animationData` 混传**：两者互斥，同时传只有一个生效。✅ 按场景二选一，静态小动画内联 `animationData`，大动画走 `path` 异步加载。
3. **repeater + 复用同一份 JSON 不深克隆**：多次 `loadAnimation` 用同一 `animationData` 对象引用，含 repeater 时实例间状态互相污染。✅ 深克隆后再传（`react-lottie-player` 已内置自动处理，原生 lottie-web 要自己做）。
4. **忘记 `destroy()`**：SPA 路由切换/组件卸载不清理动画实例 → canvas/rAF/事件监听持续占用，内存泄漏。✅ React 用 `useEffect` 清理函数、Vue 用 `onUnmounted` 手动调用；框架官方包装组件通常已处理，但手动持有 ref 时仍需自查。
5. **canvas 渲染器丢文字排版**：以为换 canvas 渲染器纯粹是性能提升，结果文字层不显示或走样。✅ canvas 渲染器文字只能走字形轮廓，有真实字体排版需求用 svg 或 html。
6. **track matte / expanded masks 在 canvas 下失效**：AE 里用了这两种蒙版技巧，换到 canvas/html 渲染器后蒙版效果消失。✅ 涉及这两种蒙版的动画锁定用 svg 渲染器。
7. **3D 图层白导出**：AE 里做了 3D 图层动画，导出后 web 端渲染器基本不支持。✅ 导出前跟设计师确认目标运行时的特性边界。
8. **跨域 JSON 加载失败但报错模糊**：`path` 指向跨域地址，服务器没给 `Access-Control-Allow-Origin`，请求被拦截。✅ 配置 CORS 响应头，或改用同源代理/内联 `animationData`；用浏览器 Network 面板 + `loadError`/`data_failed` 事件定位。
9. **`<lottie-player>`/`<dotlottie-player>` 还在用**：跟着旧教程/旧项目继续引入这两个已废弃组件。✅ 新项目直接上 `<dotlottie-wc>`（`@lottiefiles/dotlottie-wc`）。
10. **三个相似命名的 React 包搞混**：`lottie-react`、`react-lottie-player`、`@lottiefiles/react-lottie-player` API 形状不同，照着错误的包文档抄代码。✅ 先确认 `package.json` 里到底装的是哪一个。
11. **`preserveAspectRatio`/`layout.fit` 配错导致裁切错位**：lottie-web 与 dotLottie 两套 API 用不同参数名表达"如何适配容器"。✅ 按运行时对应 API 查参数名，不要跨库照抄。
12. **状态机没 `start()` 就指望它工作**：`stateMachineLoadData`/`stateMachineLoad` 只是加载定义，还要显式 `stateMachineStart()` 才会真正激活。✅ 加载后立即 start，或在 `load` 事件回调里串联执行。
13. **过度信任 ThorVG 性能宣传数字**：直接把官方案例的百分比当作自己项目的性能保证去做容量规划。✅ 自己用目标动画和目标设备实测，宣传数字仅供方向参考。
14. **`.lottie` 当纯粹"体积压缩版 json"理解**：只看到体积变小，忽略它同时是多动画容器格式，误用来打包单个简单动画反而不如内联 JSON 直接。✅ 单动画且体积很小的场景，内联 `animationData` 有时比引入 `.lottie` 解析链路更简单。

## 九、选型对比：Lottie vs GIF / 视频 / CSS 动画 / Rive

| 维度 | Lottie | GIF | 视频（mp4/webm） | 手写 CSS/SVG 动画 | Rive |
| --- | --- | --- | --- | --- | --- |
| 图形模型 | 矢量（JSON 描述图层+关键帧） | 位图逐帧 | 位图逐帧（编码压缩） | 矢量/DOM | 矢量 + 自有运行时 |
| 缩放清晰度 | 任意缩放不失真 | 放大糊、马赛克 | 放大糊（受分辨率限制） | 任意缩放不失真 | 任意缩放不失真 |
| 透明通道 | 原生支持 | 仅 1-bit（无半透明） | 需 webm+vp9 alpha 等特殊编码，兼容性有限 | 原生支持 | 原生支持 |
| 文件体积（复杂动画） | 小（矢量描述） | 大（逐帧位图） | 中（编码效率高，但不透明） | 最小（代码即描述） | 小（专有紧凑格式） |
| 色彩表现 | 真彩色 | 256 色调色板，渐变易色带 | 真彩色 | 真彩色 | 真彩色 |
| 运行时可控性 | 高（速度/方向/分段/换色/事件回调） | 无（黑盒播放） | 中（`HTMLMediaElement` API） | 高（CSS 变量/JS 直改样式） | 高（含原生状态机） |
| 设计到工程链路 | AE 直接导出，无需工程师重新实现 | 任意工具导出即可 | 视频团队产出 | 工程师手写，还原度依赖工程师 | 需在 Rive 自有编辑器重新设计 |
| 交互性 | dotLottie 状态机原生支持 | 无 | 无 | 原生（CSS `:hover` + JS） | **原生一等公民**（状态机是核心设计理念） |
| 生态资源 | LottieFiles 海量现成动画市场 | 通用 | 通用 | 无现成资源，需从零写 | 资源库不如 Lottie 丰富，但增长快 |
| 典型选型结论 | 复杂矢量动效（引导页、Loading、图标交互）首选 | 只用于对保真度要求极低的场合 | 真实拍摄内容，Lottie 无法替代 | 简单过渡/微交互用 CSS 更轻量 | 需要重交互/状态驱动动画的新选项 |

**面试口径**：能用几行 CSS 搞定的简单过渡不需要 Lottie；复杂多图层矢量动效且要求跨端一致时选 Lottie；涉及真实影像用视频；追求极致小体积、一次性简单展示可以退回 GIF，但透明通道和色彩表现是硬伤；项目从头设计且交互状态机是核心诉求时，值得评估 Rive 这个更年轻但交互原生的方案。

## 十、权威链接

- [Airbnb Lottie 官网](https://airbnb.io/lottie/) —— 定位介绍
- [airbnb/lottie-web README](https://github.com/airbnb/lottie-web/blob/master/README.md) —— `loadAnimation` 全参数、播放方法、light/full 构建
- [lottie-web Wiki: Usage](https://github.com/airbnb/lottie-web/wiki/Usage) —— `rendererSettings`、容器尺寸、repeater 深克隆坑
- [lottie-web Wiki: Features](https://github.com/airbnb/lottie-web/wiki/Features) —— 三渲染器 AE 特性支持矩阵
- [LottieFiles 开发者文档](https://developers.lottiefiles.com) —— 多框架文档入口
- [dotLottie：What is dotLottie](https://docs.lottiefiles.com/en/runtimes/overview/what-is-dotlottie)
- [dotLottie：ThorVG 引擎](https://docs.lottiefiles.com/en/runtimes/overview/thorvg)
- [dotLottie：格式结构](https://docs.lottiefiles.com/en/format/dotlottie/structure) —— `.lottie` zip 结构、`manifest.json` 字段表
- [dotLottie：状态机](https://docs.lottiefiles.com/en/format/dotlottie/interactivity/state-machines) —— 四要素定义
- [dotLottie：故障排查](https://docs.lottiefiles.com/en/runtimes/best-practices/troubleshooting) —— 加载失败/不播放/内存泄漏/性能四类问题
- [LottieFiles/dotlottie-web README](https://github.com/LottieFiles/dotlottie-web) —— `DotLottie`/`DotLottieWorker` 构造参数、方法、事件
- [dotlottie-web Wiki: State Machines](https://github.com/lottiefiles/dotlottie-web/wiki/State-Machines) —— 状态机完整 JSON 示例
- [dotlottie.io](https://dotlottie.io/) —— dotLottie 规范站
- [LottieFiles/lottie-player](https://github.com/LottieFiles/lottie-player) —— `<lottie-player>` 废弃声明 + 属性/方法/事件
- [LottieFiles/lottie-interactivity](https://github.com/LottieFiles/lottie-interactivity) —— `create()` 参数、`mode`/`actions`
- [lottie-react（Gamote）](https://github.com/gamote/lottie-react) ｜ [lottiereact.com](https://www.lottiereact.com)
- [vue3-lottie（megasanjay）](https://github.com/megasanjay/vue3-lottie)
- [npm: lottie-web](https://www.npmjs.com/package/lottie-web) ｜ [npm: @lottiefiles/dotlottie-web](https://www.npmjs.com/package/@lottiefiles/dotlottie-web) ｜ [npm: @lottiefiles/dotlottie-wc](https://www.npmjs.com/package/@lottiefiles/dotlottie-wc)
