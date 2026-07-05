---
layout: doc
outline: [2, 3]
---

# loadAnimation 配置与渲染器选型

> 基于 lottie-web 5.13 / dotLottie · 核于 2026-07

## 速查

- **`loadAnimation` 核心参数**：`container`（必需，DOM 容器）、`renderer`（`svg`/`canvas`/`html`，默认 svg）、`loop`（`true`/`false`/数字）、`autoplay`、`path` 与 `animationData`（二选一）、`name`（命名实例）、`rendererSettings`。
- **`container` 前提**：必须提前用 CSS 设好宽高，否则容器塌陷、动画不可见——最高频的"为什么不显示"问题。
- **`path` vs `animationData`**：路径异步加载 vs 直接传 JSON 对象，二者**互斥**，只挑一个传，同时传只有一个生效。
- **深克隆坑**：动画含 **repeater** 且用同一份 `animationData` 对象多次 `loadAnimation`，官方明确要求**深克隆**后再传，否则实例间状态互相污染。
- **返回值**：`loadAnimation` 返回 `AnimationItem` 实例，后续所有播放控制方法都在这个实例上调用。
- **渲染器选型口径**：默认 **svg**（图标级、需 CSS 联动/无障碍场景）；图层多、纯展示、不需要 CSS 交互时切 **canvas** 换性能；**html** 渲染器用得最少，仅在需要真实字体排版文字层等特殊场景考虑。
- **能力矩阵关键结论**：`track matte`/`expanded masks` **仅 svg** 支持；`canvas` **不支持** text as font（文字只能走字形轮廓）；3D 图层三渲染器均不支持或仅部分（html）支持；blend modes 三者都支持，但 svg **排除 IE/Edge**。
- **`rendererSettings.preserveAspectRatio`**：控制 SVG 视口对齐/缩放方式，语义与原生 `<svg>` 同名属性一致。
- **`progressiveLoad`/`hideOnTransparent`**：**仅 svg 渲染器**生效，前者按需创建 DOM 节点加快首次渲染，后者元素透明度为 0 时直接隐藏（默认 `true`）。
- **canvas 专属配置**：`context`（外部传入 2D context）、`clearCanvas`（每帧是否清空）。
- **体积优化两套构建**：lottie-web 提供 **light 构建**（`lottie_light.min.js`，去掉 Expressions 插件与部分特效解释器，体积更小）与 **full 构建**（含表达式支持），rollup 产物覆盖 UMD/ESM/CJS。
- **全局 `lottie` API**：`setQuality()`（渲染质量/性能折中）、`freeze()`/`unfreeze()`（挂起/恢复全部实例渲染）、`resize()`（配合 `window.onresize` 手动重算全部实例尺寸）、`inBrowser()`（环境检测）、`setLocationHref()`（修复页面存在 `<base>` 标签时 Safari 下 SVG mask/clipPath 引用失效）。
- **易错点**：以为换 canvas 渲染器纯粹是性能提升，结果文字层丢失排版；track matte/expanded masks 换 canvas/html 后蒙版效果消失；AE 里做的 3D 图层动画导出后 web 端基本不可用。

## 一、loadAnimation 完整参数

```js
import lottie from "lottie-web";
// 或 <script src="js/lottie.js"></script> 全局 lottie

const animation = lottie.loadAnimation({
  container: document.getElementById("animation-container"), // 必需，DOM 容器
  renderer: "svg", // 'svg' | 'canvas' | 'html'，默认 svg
  loop: true, // true / false / 数字
  autoplay: true, // 加载完立即播放
  path: "data.json", // 相对路径；与 animationData 二选一
  // animationData: animationJsonObject, // 直接传对象，二者互斥
  name: "myAnimation", // 可选命名，便于后续按名引用
  rendererSettings: {
    /* 见第三节 */
  },
});
```

关键约束（新手最容易在这三点上翻车）：

- `container` 必须**提前用 CSS 设好尺寸**（宽高），否则容器塌陷、动画不可见——这是最高频的"为什么不显示"问题。
- `path` 与 `animationData` 互斥，只能二选一：小动画/需要内联时用 `animationData` 直接传 JSON 对象，大动画走 `path` 异步加载减少首屏体积。
- `animationData` 若动画**含 repeater**、且会用同一份 JSON 对象多次调用 `loadAnimation`，官方明确要求**深克隆**后再传（如 `structuredClone(data)`），否则多个实例会共享同一份数据引用、状态互相污染。

`loadAnimation` 返回的 `AnimationItem` 实例是后续一切操作的入口——播放控制方法见 [播放控制与事件](./playback-and-events)，这里先专注渲染器与体积配置。

## 二、渲染器 svg / canvas / html 能力矩阵

`renderer` 参数决定 Lottie 用什么底层技术把 JSON 图层树画出来，三者能力差异很大，选错会导致某些 AE 特性直接失效：

| 维度 | svg（默认） | canvas | html |
| --- | --- | --- | --- |
| 渲染方式 | 生成 SVG DOM 节点树 | 位图绘制 | DOM 元素拼接 |
| 可 CSS 控制 | 是（可直接选中子节点改样式） | 否 | 部分 |
| 缩放清晰度 | 矢量，无限清晰 | 位图，受 canvas 尺寸限制 | 矢量（DOM） |
| 复杂动画性能 | 图层/形状多时 DOM 节点暴涨，性能下降 | 更好（不生成节点树） | 最差 |
| `preserveAspectRatio` | 支持 | 用 `rendererSettings.viewBoxSize` 等间接控制 | — |
| track matte / expanded masks | **仅 svg 支持** | 不支持 | 不支持 |
| text as font（真实字体渲染文字层） | 支持 | **不支持**（只能 text as glyph） | 支持 |
| 3D 图层 | 不支持 | 不支持 | 部分支持 |
| blend modes | 支持（IE/Edge 除外） | 支持 | 支持 |

**选型口径**：默认用 **svg**（图标级、需要 CSS 联动/无障碍场景，且能拿到 track matte、真实字体等完整特性）；图层多、纯展示、不需要 CSS 交互时切 **canvas** 换性能（但要接受丢失文字排版与部分蒙版效果）；**html** 渲染器用得最少，仅在需要真实字体排版文字层等特殊场景考虑，性能通常是三者中最差的。

## 三、rendererSettings 与体积优化

```js
lottie.loadAnimation({
  container,
  renderer: "svg",
  rendererSettings: {
    preserveAspectRatio: "xMidYMid meet", // SVG 视口对齐方式
    progressiveLoad: true, // 仅 svg：按需创建 DOM 节点，加快首次渲染
    hideOnTransparent: true, // 仅 svg：元素透明度为 0 时直接隐藏（默认 true）
    className: "my-anim", // 附加到根节点的 class
    id: "my-anim-id",
    context: canvasCtx, // 仅 canvas：外部传入 2D context
    clearCanvas: true, // 仅 canvas：每帧是否清空
  },
});
```

体积优化路线：lottie-web 提供 **light 构建**（`lottie_light.min.js`，去掉 Expressions 插件与部分特效解释器，体积更小）与 **full 构建**（含表达式支持）两套，rollup 产物覆盖 UMD/ESM/CJS；按需选 full/light/svg-only/canvas-only 各变体控制打包体积——不需要 AE 表达式动画时优先选 light 构建。dotLottie 一侧的体积优化则是格式层面的（zip 压缩 + 多动画共享资源），见 [dotLottie 与播放器](./dotlottie-and-players)。

## 四、全局 lottie API 与常见坑

除了 `AnimationItem` 实例方法，全局 `lottie` 对象上还有几个作用于**全部实例**的 API：

| API | 作用 |
| --- | --- |
| `lottie.setQuality('high'\|'medium'\|'low'\|number)` | 渲染质量/性能折中 |
| `lottie.freeze()` / `lottie.unfreeze()` | 挂起/恢复页面上全部动画渲染（如切后台标签页） |
| `lottie.resize()` | 手动触发全部实例重新计算尺寸，配合 `window.onresize` |
| `lottie.inBrowser()` | 环境检测（是否运行在浏览器） |
| `lottie.setLocationHref(url)` | 修复页面存在 `<base>` 标签时 Safari 下 SVG mask/clipPath 引用失效的坑 |

**渲染器相关的三个易错点**：

1. **canvas 渲染器丢文字排版**：以为换 canvas 渲染器纯粹是性能提升，结果文字层（text as font）不显示或走样。✅ canvas 渲染器文字只能走字形轮廓（text as glyph），有真实字体排版需求用 svg 或 html。
2. **track matte / expanded masks 在 canvas 下失效**：AE 里用了这两种蒙版技巧，换到 canvas/html 渲染器后蒙版效果消失。✅ 涉及这两种蒙版的动画锁定用 svg 渲染器。
3. **3D 图层白导出**：AE 里做了 3D 图层动画，导出后 web 端渲染器基本不支持（html 渲染器部分支持）。✅ 导出前跟设计师确认目标运行时的特性边界，AE 阶段避免依赖 3D 图层做视觉效果。

渲染器选型定了之后，下一步是把动画真正"用起来"——[播放控制与事件](./playback-and-events)讲完整的播放方法表与事件系统。
