---
layout: doc
outline: [2, 3]
---

# 入门：SVG 是什么与如何引入

> 基于 SVG 1.1 / SVG 2 CR（2026 浏览器现状）· 核于 2026-07

## 速查

- **SVG 是什么**：基于 XML 的二维矢量图形语言，W3C 开放标准（1999 起）；图形即 DOM 节点，可 CSS 样式化、JS 操作、无限缩放不失真——「SVG 之于图形，如同 HTML 之于文本」。
- **保留模式 vs 立即模式**：SVG 浏览器保留整棵图形对象树（DOM），**改属性即改画面**；Canvas 画完即像素、无对象记忆，改动要自己重画。
- **保留模式的红利**：每个图形可独立 click/hover、CSS 选择器与动画全套可用、进无障碍树、文本可选中可被搜索引擎索引。
- **渲染顺序**：源码中越靠后画在越上层（「后来居上」），**没有 z-index**，调层级只能移动节点顺序。
- **选型口诀**：要交互到「每个图形」、要无障碍、要响应式 → SVG；要画的「东西数量」大（万级点）→ Canvas/WebGL。SVG 舒适区约几百~3k 节点。
- **五种引入方式**（可控性 inline > object > use > img ≈ background，缓存性正好反过来）：
  - inline `<svg>`：JS/CSS 完全可控，SMIL/CSS/JS 动画全可；不能独立缓存、有 id 冲突风险。
  - `<img src>`：可缓存；**脚本禁用、外部资源不加载**、页面 CSS 摸不到内部；SMIL/内嵌 CSS 动画可自动播放；必须给 alt。
  - CSS background/content：同 img 的安全沙箱，纯装饰用。
  - `<object>`/`<iframe>`/`<embed>`：完整文档上下文，内部脚本可执行；同源下经 contentDocument 可操作；页面 CSS 不级联进去。
  - `<use>` 外部 sprite：继承值/CSS 变量可穿透；**严格同源**（无 CORS 开关）。
- **xmlns 何时必须**：独立 `.svg` 文件必须写 `xmlns="http://www.w3.org/2000/svg"`；HTML 内联可省（解析器自动切换命名空间）。
- **MIME**：服务器必须回 `image/svg+xml`，配置错误是 SVG 加载失败常见原因。
- **版本现状**：SVG 1.1 SE（2011）是最后一个正式 Recommendation；SVG 2 停在 CR（2018-10-04），编辑草案仍更新、无升 Rec 时间表；浏览器零散落地 SVG 2 增量（`href` 取代 `xlink:href`、几何属性 CSS 化、`version`/`baseProfile` 废弃）。
- **进阶顺序**：本页 → [坐标与形状](./guide-line/coordinates-and-shapes) → [路径](./guide-line/paths) → [填充描边与渐变](./guide-line/fills-strokes-gradients) → [结构与复用](./guide-line/structure-and-reuse) → [动画与优化](./guide-line/animation-and-optimization)。

## 一、定位：保留模式的矢量图形 DOM

SVG 与 Canvas 代表浏览器绘图的两种根本范式：

- **SVG 是保留模式（retained mode）**：你声明「有一个圆在 (150,100)」，浏览器把它保留为 DOM 对象树中的一个节点并负责绘制；之后改一个属性（如 `cx`），浏览器自动重绘。图形是「活的对象」。
- **Canvas 是立即模式（immediate mode）**：你调用命令把像素画上画布，画完即忘——没有对象记忆，想让圆动起来必须自己擦掉重画整帧。

保留模式带来一串「免费」能力：每个图形都是真 DOM 节点，可以独立绑定 click/hover 事件、被 CSS 选择器命中并做动画、进入无障碍树被读屏器朗读、文本可选中且可被搜索引擎索引。代价是**节点数就是成本**：几百~3k 节点是舒适区，3k~5k 开始卡，上万节点（如 10 万点散点图）必须换 Canvas/WebGL。

| 维度 | SVG | Canvas 2D |
| --- | --- | --- |
| 渲染模型 | 保留模式（DOM 对象树） | 立即模式（像素缓冲） |
| 语法 | 声明式 XML | 命令式 JS API |
| 缩放 | 矢量无损，随容器响应式 | 位图，放大糊/需按 DPR 重绘 |
| 事件 | 每个图形原生 DOM 事件 | 只有整块画布，命中检测自实现 |
| 无障碍/SEO | 真实节点，title/aria/文本可索引 | 黑盒（需 fallback DOM） |
| 性能特征 | 随 DOM 节点数恶化（3k~5k 阈值） | 与对象数解耦，随像素面积恶化 |
| 典型场景 | 图标、LOGO、插画、中小图表（D3 默认） | 大数据散点/K 线、游戏、粒子 |

决策口诀：**先 SVG 快速迭代，量测到瓶颈再迁 Canvas**；混合方案很常见——Canvas 画数据层 + SVG 画坐标轴/标注层。

## 二、第一个 SVG 文档

一个最小可运行的独立 `.svg` 文件：

```xml
<!-- 独立 .svg 文件必须带 xmlns；version/baseProfile 在 SVG 2 已废弃，可省 -->
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
  <rect width="100%" height="100%" fill="red"/>                <!-- 背景矩形铺满 -->
  <circle cx="150" cy="100" r="80" fill="green"/>              <!-- 圆：圆心 + 半径 -->
  <text x="150" y="125" font-size="60" text-anchor="middle"
        fill="white">SVG</text>                                 <!-- 文本水平居中锚定 -->
</svg>
```

三个要点：

- **渲染顺序「后来居上」**：rect 先画在底层，circle 盖住它，text 在最上。SVG **没有 z-index**，想调层级只能移动节点在源码里的顺序。
- **xmlns**：独立文件/XML 文档必须显式声明命名空间；写在 HTML 里的内联 `<svg>` 可以省——HTML 解析器会自动切换到 SVG 命名空间。
- **MIME 类型**：服务器必须以 `image/svg+xml` 返回（`.svgz` 需另加 `Content-Encoding: gzip`），配置错误是「SVG 直接打开正常、放到服务器就裂」的常见原因。

## 三、五种引入方式对比（高频考点）

同一份 SVG，引入方式不同，能力边界完全不同：

| 方式 | 页面 JS 可操作内部 | 页面 CSS 作用内部 | 内部脚本执行 | 动画 | 独立缓存 |
| --- | --- | --- | --- | --- | --- |
| inline `<svg>` | 完全可以 | 完全可以（级联+伪类） | 可以（就是页面脚本） | SMIL/CSS/JS 全可 | 否（随 HTML） |
| `<img src>` | 不可以 | 不可以（只能整体 filter/尺寸） | 禁用 | SMIL/内嵌 CSS 动画自动播放 | 可以 |
| CSS background/content | 不可以 | 不可以 | 禁用 | 同 img | 可以 |
| `<object>`/`<iframe>`/`<embed>` | 同源下经 contentDocument 可以 | 不级联（文档边界，内部需自带样式） | 可以 | 全可 | 可以 |
| `<use>` 外部 sprite | 宿主 svg 可操作，克隆树不可 | 继承值/CSS 变量可穿透，显式属性不可 | 禁用 | CSS（宿主）/SMIL | sprite 文件可缓存 |

- **记忆轴**：可控性 inline > object > use > img ≈ background；**缓存性正好反过来**。
- **「图像上下文」= 静态安全沙箱**：`<img>` 与 CSS 背景图方式下，脚本不执行、外部资源（图片/外链 CSS/字体）不加载、无交互——但 SMIL 和内嵌 CSS 声明式动画保留、可自动播放。「本地打开正常、当图片引用就坏」多半是踩了外部资源限制。
- **`<img>` 必须给 alt**；纯装饰图 `alt=""`。
- **`<use>` 引外部 sprite 严格同源**，没有 CORS 开关，放 CDN 跨域会直接不显示（详见[结构与复用](./guide-line/structure-and-reuse)）。
- 另有 canvas `drawImage()` 可把 SVG 光栅化进画布：可行，但跨域图会污染画布（taint），之后 `toDataURL`/`getImageData` 抛错。

选型：需要交互/换肤 → inline；纯装饰小图标 → CSS 背景或 img；图标系统 → symbol + use sprite；需要独立文档能力（内部脚本、外部资源）→ object。

## 四、规范版本现状（写作与面试口径）

- **SVG 1.1 Second Edition（2011）是最后一个正式 W3C Recommendation**，仍是各浏览器实现的公共基线。
- **SVG 2 长期停在 Candidate Recommendation**：2016-09-15 首进 CR，现行 CR 版本为 2018-10-04；编辑草案仍在更新（最近 2025-09-14），SVG 工作组 2024 年重新特许，但**没有升 Rec 的时间表**。
- 浏览器按特性零散落地 SVG 2 增量，已可放心使用的包括：`href` 取代 `xlink:href`、几何属性（cx/r/x/width 等）升级为可用 CSS 控制的 presentation property、`version`/`baseProfile` 属性废弃、「未知元素按 `<g>` 渲染」等。
- **口径**：按「SVG 1.1 + 浏览器已实现的 SVG 2 增量」描述，不要笼统说「SVG 2 已发布/已全面支持」。

理解了定位与引入方式，下一步进入 SVG 最核心也最容易迷糊的部分——[坐标系统与基本形状](./guide-line/coordinates-and-shapes)。
