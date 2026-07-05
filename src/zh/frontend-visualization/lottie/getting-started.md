---
layout: doc
outline: [2, 3]
---

# 入门：Lottie 是什么、工作流与第一个动画

> 基于 lottie-web 5.13 / dotLottie · 核于 2026-07

## 速查

- **定位**：Lottie = **AE 动画经 Bodymovin 插件导出为 JSON**，前端/移动端用运行时（`lottie-web` 等）**原生解析渲染**——不是录屏、不是手写代码复刻，是"设计师在 AE 里做，导出即交付"。
- **vs GIF**：矢量任意缩放不失真、真彩色、原生 alpha 透明通道；GIF 位图放大糊、256 色调色板渐变易色带、透明只有 1-bit。
- **vs 视频**：Lottie 运行时可编程（改速度/方向/分段/换色/监听事件）；视频只有 `HTMLMediaElement` 播放/seek/速度这类中等可控性，写实内容视频不可替代。
- **vs 手写 CSS/SVG**：简单过渡（hover 变色、渐显）几行 CSS 更轻量；复杂多图层矢量动效（引导页、Loading、图标交互）且要求跨端一致时，Lottie 省去工程师手工复刻的成本。
- **工作流**：设计师 AE 制作动画 → 装 **Bodymovin**（或新版 Lottie）插件导出 `.json` → 前端 `lottie-web` 加载播放；或经 LottieFiles 工具链打包为压缩容器 **`.lottie`**（dotLottie）。
- **历史小知识**：lottie-web 早期就叫 **bodymovin**，`bodymovin.loadAnimation()` 是遗留别名，现行统一用 `lottie.loadAnimation()`。
- **安装**：`npm install lottie-web`，或 `<script src="lottie.js">` 全局挂 `lottie` 对象。
- **最小可用代码**：`lottie.loadAnimation({container, renderer, loop, autoplay, path})`，返回 `AnimationItem` 实例，后续播放控制都在这个实例上调用。
- **容器尺寸是头号坑**：`container` 必须**提前用 CSS 设好宽高**，否则容器塌陷、动画不可见——最高频的"为什么不显示"问题。
- **`path` 与 `animationData` 二选一**：两者互斥，指向文件路径 vs 直接传 JSON 对象，同时传只有一个生效。
- **`renderer` 三选项**：`svg`（默认）/`canvas`/`html`，选型详见 [loadAnimation 与渲染器](./guide-line/loadanimation-and-renderer)。
- **`loop`/`autoplay`**：`loop` 接受 `true`/`false`/数字（循环次数），`autoplay` 决定加载完是否立即播放。
- **基础播放控制**：`play()`/`pause()`/`stop()`，更完整的方法表见 [播放控制与事件](./guide-line/playback-and-events)。
- **`destroy()`**：释放动画实例资源，SPA 路由切换/组件卸载必须调用，否则内存泄漏。
- **新旧代际**：`.json` 是传统 Lottie 格式，**`.lottie`** 是 LottieFiles 主推的下一代压缩容器格式（zip，含 manifest + 动画 + 可选资源/主题/状态机），二者不是竞品是新旧关系，dotLottie 运行时两种格式都能加载。
- **2026 现状**：`lottie-web`（Airbnb 官方）仍是装机量最大的经典库但发版低频；LottieFiles 研发重心已转向 **dotLottie**（Rust + WASM + ThorVG 内核）；新项目官方推荐 dotLottie 路径，存量项目仍大量用 lottie-web，两套 API 都要掌握。
- **生态**：LottieFiles 平台提供 Creator（在线编辑）、动画市场（海量现成动画）、Integrations（Figma/Webflow/Framer 插件）；`lottie.host` 是官方 `.lottie`/`.json` 托管 CDN。
- **体积优化预告**：`lottie-web` 提供 light/full 两套构建（light 阉割 Expressions 插件更小）；dotLottie 侧靠格式层面压缩，详见后续章节。
- **框架集成预告**：React 有 `lottie-react`（Gamote）等三个命名相似但互相独立的封装包，Vue 有社区 `vue3-lottie` 与官方 `dotlottie-vue`，详见 [框架集成与性能优化](./guide-line/framework-and-optimization)。
- **进阶顺序**：本页 → [loadAnimation 与渲染器](./guide-line/loadanimation-and-renderer) → [播放控制与事件](./guide-line/playback-and-events) → [dotLottie 与播放器](./guide-line/dotlottie-and-players) → [框架集成与性能优化](./guide-line/framework-and-optimization) → [参考](./reference)。

## 一、Lottie 是什么：AE 导出 JSON vs GIF / 视频 / 手写 CSS 动画

Lottie 的工作方式是：设计师在 **Adobe After Effects** 里完成动画，通过 **Bodymovin**（或新版官方 Lottie）导出插件生成 `.json` 文件——这份 JSON 里记录的是完整的图层树、形状路径与逐帧关键帧数据；前端/移动端再用 `lottie-web`（或对应平台的原生运行时）把这份 JSON **原生解析并重新绘制**成动画。这与"录屏转 GIF"或"工程师照着设计稿用代码/CSS 一帧帧还原"是完全不同的路径——Lottie 传递的是矢量描述而非像素，也不需要工程师重新实现一遍动效，保真度直接由 AE 工程文件决定。

和其它动画方案相比，Lottie 的定位很清楚：

| 维度 | Lottie | GIF | 视频（mp4/webm） | 手写 CSS/SVG |
| --- | --- | --- | --- | --- |
| 图形模型 | 矢量（JSON 描述图层 + 关键帧） | 位图逐帧 | 位图逐帧（编码压缩） | 矢量/DOM |
| 缩放清晰度 | 任意缩放不失真 | 放大糊、马赛克 | 放大糊（受分辨率限制） | 任意缩放不失真 |
| 透明通道 | 原生支持 | 仅 1-bit（无半透明） | 需特殊编码，兼容性有限 | 原生支持 |
| 运行时可控性 | 高（速度/方向/分段/换色/事件回调） | 无（黑盒播放） | 中（`HTMLMediaElement` API：播放/seek/速度） | 高（CSS 变量/JS 直接改样式） |
| 设计到工程 | AE 直接导出，无需工程师重新实现 | 任意工具导出即可 | 视频/摄制团队产出 | 工程师手写，还原度依赖工程师 |

**面试口径**：能用几行 CSS 搞定的简单过渡（hover 变色、渐显）不需要 Lottie，JSON 解析 + 渲染的开销不划算；复杂多图层矢量动效（引导页、Loading、图标交互）且要求跨端一致（Web/iOS/Android/RN 视觉完全一致）时选 Lottie；真实影像/写实内容用视频，Lottie 无法替代；追求极致小体积、一次性简单展示可以退回 GIF，但透明通道和色彩表现是硬伤。更完整的选型对比（含 Rive）见 [参考页](./reference)。

## 二、工作流：AE + Bodymovin → JSON → lottie-web

完整的生产链路是：

1. 设计师在 **After Effects** 中完成动画设计；
2. 安装 **Bodymovin** 插件（或新版官方 Lottie 插件）导出 `.json`；
3. 前端用 `lottie-web` 加载 JSON 并渲染播放；
4. 需要更小体积、多动画打包、主题或交互时，用 LottieFiles 工具链把 JSON 进一步打包为压缩容器 **`.lottie`**（详见 [dotLottie 与播放器](./guide-line/dotlottie-and-players)）。

LottieFiles 平台（lottiefiles.com）在这条链路上提供三块能力：**Creator**（在线编辑器，可视化调整图层/关键帧）、**动画市场**（海量免费/付费现成动画搜索下载，很多场景不需要自己做动画，直接找现成的）、**Integrations**（Figma/Webflow/Framer 等设计工具插件，缩短设计到导出的距离）。`lottie.host` 是 LottieFiles 提供的文件托管 CDN，官方示例大量直接引用形如 `https://lottie.host/xxx.lottie` 的地址。

**历史小知识**：lottie-web 早期就叫 **bodymovin**，`bodymovin.loadAnimation()` 是遗留下来的别名 API，现在统一使用 `lottie.loadAnimation()`；遇到老代码里的 `bodymovin.*` 调用不用惊讶，它和 `lottie.*` 是同一套东西。

## 三、安装与第一个动画

```bash
npm install lottie-web
```

```html
<!-- 容器必须提前用 CSS 设好尺寸，否则塌陷不可见（见下一节） -->
<div id="animation-container" style="width: 300px; height: 300px;"></div>
```

```js
import lottie from "lottie-web";

// container 是必需参数，指向上面这个已设好尺寸的 DOM 容器
const animation = lottie.loadAnimation({
  container: document.getElementById("animation-container"),
  renderer: "svg", // 'svg' | 'canvas' | 'html'，默认 svg，选型见下一叶
  loop: true, // true / false / 数字（循环次数）
  autoplay: true, // 加载完立即播放
  path: "data.json", // 与 animationData 二选一，指向 JSON 文件的相对/绝对路径
});

// loadAnimation 返回 AnimationItem 实例，后续所有播放控制都调它的方法
animation.addEventListener("complete", () => {
  console.log("播放完成");
});

// 组件卸载 / 路由切换时必须调用，否则内存泄漏
// animation.destroy();
```

不引入模块也可以：直接用 `<script src="js/lottie.js"></script>` 挂载全局 `lottie` 对象，API 与上面完全一致，适合无构建工具的静态页面。

## 四、常见入门坑

入门阶段最容易踩的四个坑：

1. **容器没设尺寸**：`container` 元素没有显式 CSS 宽高 → 动画区域塌陷、页面上什么都看不到。✅ 提前用 CSS（或行内 `style`）设好宽高，再传给 `loadAnimation`。
2. **`path` 和 `animationData` 混传**：二者互斥，同时传只有一个生效。✅ 静态小动画内联 `animationData`（直接传 JSON 对象），大动画走 `path` 异步加载。
3. **含 repeater 的动画复用同一份 JSON 对象**：多次 `loadAnimation` 传同一个 `animationData` 引用，若动画含 repeater，实例间状态会互相污染。✅ 深克隆后再传（`JSON.parse(JSON.stringify(data))` 或 `structuredClone`），细节见 [播放控制与事件](./guide-line/playback-and-events)。
4. **忘记 `destroy()`**：组件卸载/路由切换不清理动画实例，canvas/rAF/事件监听持续占用 → 内存泄漏。✅ SPA 里在卸载钩子中显式调用 `animation.destroy()`。

这四个坑背后有一条共同的经验：Lottie 虽然"导出即用"，但 `container`/`path`/`animationData`/`destroy()` 这几个入口参数需要按官方约定精确使用，随意套用会立刻踩坑。下一步进入 [loadAnimation 与渲染器](./guide-line/loadanimation-and-renderer)，看完整参数表与三种渲染器的选型逻辑。
