---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Chromium 现代架构 · 核于 2026-07

## 速查

- 经典管线：**DOM → CSSOM → render tree → layout → paint → composite**
- 代价链：改几何全链重跑 > 改外观跳过 layout > 改 **transform/opacity** 仅合成
- DOM 增量构建；**CSSOM 非增量**（后规则可覆盖前规则）→ CSS render-blocking
- 裸 `<script>` 暂停解析；`defer` 按序等解析完；`async` 先到先跑；module 默认 defer
- render tree：`display:none` 整枝排除；`visibility:hidden` 保留占位；伪元素凭 `content` 进
- 首次算几何 = layout，重算 = **reflow**；reflow → repaint → re-composite 连坐
- 读 `offsetWidth` 等几何属性在有待处理样式改动时**强制同步布局**；循环读写交替 = layout thrashing
- 帧预算 = 1000 ÷ 刷新率：**60Hz≈16.7ms、120Hz≈8.3ms**；rAF 在渲染前、rIC 在空闲期
- 合成器线程**不等 JS**；非快速滚动区/`passive:true`/`touch-action` 决定滚动是否要等主线程
- RenderingNG：**property trees 四棵**、LayoutNG 不可变 fragment tree、**先 paint 后 layerize（CAP）**、Viz 聚合 + GPU 光栅化

## 管线步骤速查

| 步骤 | 输入 | 输出 | 线程 | 要点 |
| --- | --- | --- | --- | --- |
| 解析 HTML | 字节流 | **DOM** | 主线程 | token→节点→树；增量；容错不报错；preload scanner 并行预取 |
| 解析 CSS | CSS 文本 | **CSSOM** | 主线程 | 非增量、render-blocking；构建极快（< 一次 DNS 查询） |
| style | DOM + CSSOM | render tree（计算样式） | 主线程 | 只收可见节点；UA 样式表打底；选择器从右向左匹配 |
| layout | render tree | 几何（layout tree / fragment tree） | 主线程 | 视口为基、盒模型；首次 layout、重算 reflow |
| paint | 布局结果 | **paint records / display list** | 主线程 | 按 CSS painting order 自后向前；指令非像素 |
| composite | 图层 + 绘制指令 | compositor frame | **合成器线程** | 分层→瓦片栅格化→draw quads→送 GPU/Viz |

帧内主线程编排：`输入回调 → rAF → style → layout → paint → commit`，之后合成器接手；空闲期跑 rIC。

## 重排 vs 重绘触发对照

| 操作 | reflow（重排） | repaint（重绘） | composite |
| --- | --- | --- | --- |
| 增删/移动 DOM、`innerHTML` | ✅ | ✅ | ✅ |
| 改 `width` / `padding` / `font-size` / `top` 等盒模型与几何 | ✅ | ✅ | ✅ |
| 窗口 resize / 设备旋转 | ✅（每次） | ✅ | ✅ |
| 未声明尺寸的图片加载完成 | ✅ | ✅ | ✅ |
| 改 `color` / `background` / `box-shadow` / `visibility` | ❌ | ✅ | ✅ |
| 改 `transform` / `opacity`（已成层） | ❌ | ❌ | ✅（合成器线程） |
| 读 `offsetWidth` / `getBoundingClientRect()`（有待处理改动时） | ✅ **强制同步** | — | — |
| `display: none` ↔ 显示切换 | ✅（整枝进出 render tree） | ✅ | ✅ |

> 强制同步布局高危读取：`offsetTop/Left/Width/Height`、`clientWidth/Height`、`scrollTop/scrollHeight`、`getBoundingClientRect()`、`getComputedStyle()` 几何值、`focus()`、`scrollIntoView()`。药方：**先集中读、再集中写**，写入进 rAF。

## 脚本加载对比

| 方式 | 阻塞解析 | 执行时机 | 顺序 | `document.write` | 适用 |
| --- | --- | --- | --- | --- | --- |
| `<script>` 裸 | **是**（下载+执行） | 遇到即执行 | 文档序 | 可用（毒） | 极少数必须同步的内联 |
| `<script defer>` | 否 | 解析完、`DOMContentLoaded` 前 | **文档序** | 禁用 | 依赖 DOM/彼此顺序的主逻辑 |
| `<script async>` | 否（执行时暂停） | **下载完立即** | 无序 | 禁用 | 独立脚本（埋点/广告） |
| `<script type="module">` | 否 | 同 defer（可加 async） | 依赖图序 | 禁用 | 现代模块化入口 |

配套：CSS 不阻塞解析但**阻塞渲染与 JS 执行**；`<link rel="preload">` 声明关键资源；`media="print"` 等标注使样式表不阻塞屏幕渲染。

## 图层提升属性

| 触发成层 | 说明 |
| --- | --- |
| `<video>` / `<canvas>` | 内容独立更新 |
| 3D `transform`（`translateZ` 等） | 变换合成时应用 |
| `opacity` 动画 | 效果合成时应用 |
| `will-change: transform / opacity` | 显式预建层提示 |
| `position: fixed` / `sticky`、滚动容器 | 独立滚动/固定（实现相关） |

> 纪律：层耗 **GPU 内存**；「跨过多图层合成可能比每帧重画小块更慢」（Chrome）——预建节制、动画结束移除 `will-change`、以实测为准。现代引擎 layerize **默认合并** paint chunks，只独立「合成器要动的」。

## 渲染相关线程/进程分工

| 执行体 | 职责 | 关键性质 |
| --- | --- | --- |
| 渲染进程 · **主线程** | 解析 HTML/CSS、JS、style/layout/paint、hit test、事件分发 | 管线大头；被 JS 阻塞 |
| 渲染进程 · **合成器线程** | 分层（layerize）、滚动、合成器动画、组装 compositor frame | **不等样式计算与 JS** |
| 渲染进程 · raster/worker 线程 | 栅格化协调（经典模型）、Web/Service Worker | 辅助并行 |
| **Viz 进程** · display compositor | **聚合**各渲染进程 + 浏览器 UI 的帧 | 全系统一个；须时刻响应 |
| **Viz 进程** · GPU main thread | GPU 光栅化、最终 draw | 光栅默认上 GPU |

## 输入与帧速查

| 机制 | 规则 |
| --- | --- |
| 事件路由 | 浏览器进程（坐标）→ 合成器线程 → 必要时主线程 hit test（基于 paint records）分发 |
| 非快速滚动区 | 绑相关监听的区域滚动须等主线程；**委托到 `document`/`body` 标掉整页** |
| `passive: true` | 承诺不 `preventDefault` → 合成器不等主线程直接滚；配 `event.cancelable` 判断 |
| `touch-action` | CSS 声明式关掉默认手势，免监听 |
| 事件合并 | 连续事件（`mousemove`/`pointermove`/`touchmove`/`wheel`）合并至 **rAF 前**分发；离散事件（`keydown`/`mousedown`…）立即；`getCoalescedEvents()` 取中间点 |
| 输入频率 | 触摸屏 60–120 次/s、鼠标 ~100 次/s，高于典型刷新率 → 必须合并 |

## 经典 → RenderingNG 术语映射

| 经典（2018 / MDN） | RenderingNG | 备注 |
| --- | --- | --- |
| render tree / layout tree | **不可变 fragment tree** | LayoutNG；禁向上引用、增量复用 |
| paint records | **display list**（items → paint chunks） | 按 property tree state 分组 |
| layer tree（主线程、layout 后） | **composited layer list**（layerize、paint 后） | **CompositeAfterPaint** |
| layer tree 承载变换/裁剪/滚动 | **property trees**：transform/clip/effect/scroll | 四棵树、四元组状态 |
| 帧交浏览器进程转 GPU | 提交 **Viz**：display compositor 聚合 + GPU draw | surface ID 嵌套多进程内容 |
| renderer 内 raster threads | **Viz GPU 光栅化**（默认） | sync token 异步衔接 |
| style→layout→paint→composite | **12 阶段**：animate/style/layout/pre-paint/scroll/paint/commit/layerize/raster/activate/aggregate/draw | 纯视效动画与滚动可跳过 layout/pre-paint/paint |

## 帧预算

| 刷新率 | 每帧预算 | 场景 |
| --- | --- | --- |
| 60Hz | ≈16.7ms | 多数外接屏/中端机 |
| 90Hz | ≈11.1ms | 部分安卓机 |
| 120Hz | ≈8.3ms | ProMotion / 高刷旗舰 |

> 预算内要装下：输入回调 + rAF + style + layout + paint + commit（主线程部分）。目标是**匹配显示器刷新率**，不是固定 60fps。

## 权威链接

- [Inside look at modern web browser (part 3)](https://developer.chrome.com/blog/inside-browser-part3) · [(part 4)](https://developer.chrome.com/blog/inside-browser-part4)
- [MDN: Critical rendering path](https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path) · [MDN: How browsers work](https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work)
- [RenderingNG architecture](https://developer.chrome.com/docs/chromium/renderingng-architecture) · [RenderingNG data structures](https://developer.chrome.com/docs/chromium/renderingng-data-structures)

## 相关页

- [入门](./getting-started) · [HTML 解析与 DOM 构建](./guide-line/dom-construction) · [CSSOM 与 render tree](./guide-line/cssom-render-tree)
- [布局与重排](./guide-line/layout-reflow) · [绘制与合成](./guide-line/paint-compositing)
- [帧生命周期与输入](./guide-line/frame-input) · [现代架构 RenderingNG](./guide-line/renderingng)
