---
layout: doc
outline: [2, 3]
---

# 结构与复用：defs / symbol / use / 裁剪遮罩 / 滤镜

> 基于 SVG 1.1 / SVG 2 CR（2026 浏览器现状）· 核于 2026-07

## 速查

- **`<g>`**：分组 + presentation 属性继承（fill/stroke/transform 下传，子元素可覆盖）。
- **`<defs>`**：只定义不渲染的资源库（渐变、图案、滤镜、clipPath、marker）。
- **`<symbol>`**：专为复用设计的模板——自带 viewBox/preserveAspectRatio、永不直接渲染、内置 title 随引用带出，比裸 `<g>` 更适合图标。
- **`<use href="#id">`**（必考）：把目标**深克隆进封闭影子树（shadow tree）**渲染——
  - 克隆内容 **JS 摸不到**（querySelector 选不中），DevTools 显示为 `#shadow-root`。
  - **CSS 继承可穿透**（currentColor、font、**CSS 自定义属性**）；被引元素**显式写死的属性无法从外部覆盖**。
  - 特殊属性仅 `x/y/width/height/href`：x/y 等价附加 translate；**width/height 仅在引用 `svg`/`symbol` 时生效**。
  - 外部 sprite（`href="sprite.svg#icon"`）**严格同源**，无 CORS 开关。
- **sprite 图标系统**：隐藏 svg 装一组 `<symbol>` → 各处 `<use>` 引用；`currentColor` 穿透随文字色；多色图标用 **CSS 变量穿透**（唯一外部控制通道）。
- **`<marker>`**：给顶点挂箭头/圆点，`marker-start/-mid/-end="url(#id)"` 引用；`markerUnits` 默认 `strokeWidth`（随线宽缩放）；`refX/refY` 对准顶点；`orient="auto|auto-start-reverse"` 随路径转向；`context-stroke/context-fill` 继承宿主线色。
- **clipPath vs mask**（必考）：
  - clipPath = **纯几何二值**判定（点在内/外），fill 色与透明度全被忽略，**做不出半透明/软边**；性能更好；典型：头像裁圆。
  - mask = **像素级**：遮罩内容的**亮度 × alpha** 决定目标透明度，白显黑隐灰半透；可渐变淡出/羽化；更贵。
  - 默认坐标系：`clipPathUnits` 默认 `userSpaceOnUse`；`maskUnits` 默认 `objectBoundingBox`、`maskContentUnits` 默认 `userSpaceOnUse`。
  - CSS 的 `clip-path`/`mask` 属性可引用 SVG 定义并作用于 **HTML 元素**。
- **滤镜管道**：`<filter>` 内 fe 原语串接，`in`/`in2` 进 `result` 出，不写 in 默认吃上一个输出；输入关键字 `SourceGraphic`/`SourceAlpha`。
- **滤镜区域默认只比元素大 10%**（-10%/-10%/120%/120%）——大模糊/长阴影被切边，手动扩 region。
- **feDropShadow**：一条顶「blur+offset+merge」三条的快捷投影原语。
- CSS `filter: url(#id)` 可把 SVG 滤镜套在 HTML 元素上。

## 一、g / defs / symbol：三种「容器」的分工

- **`<g>`**：最普通的分组。核心价值是 **presentation 属性继承**——写在 `<g>` 上的 fill/stroke/transform 等下传给所有子元素（子元素可覆盖），配合 transform 做「整组移动」。
- **`<defs>`**：资源库——里面的内容**只定义、不渲染**，专放渐变、图案、滤镜、clipPath、marker 等待引用资源。
- **`<symbol>`**：专为复用设计的模板，比裸 `<g>` 多三件武器：
  1. **自带 viewBox / preserveAspectRatio**——图标自成坐标系，引用时给多大就适配多大；
  2. **永不直接渲染**——不用像 `<g>` 那样藏进 `<defs>` 或设 display:none；
  3. **可内置 `<title>`/`<desc>`**，随每次引用一起带出（无障碍便利）。

## 二、use 与影子树（必考）

`<use href="#id">` 是 SVG 的复用引擎：把目标节点**深克隆成一棵封闭的影子树（shadow tree）**渲染到引用处。理解它的边界是高频考点：

- **JS 摸不到克隆内容**：querySelector 选不中影子树内部，DevTools 里显示为 `#shadow-root`。想改只能改「源」元素。
- **CSS 继承可以穿透**：继承型值（`currentColor`、font 系列）与 **CSS 自定义属性**能进影子树——这是外部控制引用内容样式的仅有通道。
- **显式属性赢不了**：被引元素上写死的 `fill="red"` 无法从外部覆盖——**图标源文件内部不要硬编码颜色**（用 currentColor 或 CSS 变量）。
- `<use>` 自己的属性只有 `x/y/width/height/href` 有特殊语义：x/y 等价于附加一个 translate；**width/height 仅在引用 `svg` 或 `symbol` 时生效**（因为只有它们有 viewBox 可适配）。

### sprite 图标系统

`<symbol>` + `<use>` 组合成主流图标方案——一次请求装载 N 个图标，且外部文件可缓存：

```html
<!-- sprite：一组 symbol 藏在隐藏 svg 里（或独立 sprite.svg 文件） -->
<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
  <symbol id="icon-ok" viewBox="0 0 24 24">
    <path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2"/>
  </symbol>
</svg>

<!-- 使用处：currentColor 穿透影子树 → 图标随文字色 -->
<svg class="icon" width="24" height="24" aria-hidden="true"><use href="#icon-ok"/></svg>
<style>.icon { color: teal; }</style>
```

- **外部 sprite 严格同源**：`href="sprite.svg#icon"` 没有 CORS 开关，放跨域 CDN 直接不显示；data: URI 作 href 也已因安全原因弃用。老 IE 不支持外部引用（历史上用 svg4everybody 补丁）。
- **多色（two-tone）图标唯一正解**：symbol 内部写 `fill="var(--icon-bg, #eee)"`，外部按实例改 `--icon-bg`——CSS 变量是唯一能穿透影子树的逐实例控制通道。
- **id 冲突**：多个 inline SVG 共用 `#gradient` 这类通用 id 时会互相串（id 是页面级全局命名空间）——组件化时给 id 加前缀或 hash。

## 三、marker：顶点标记

`<marker>` 给 path/line/polyline/polygon 的顶点挂标记（箭头、圆点），经 `marker-start`/`marker-mid`/`marker-end="url(#id)"` 引用：

```xml
<marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5"
        markerWidth="6" markerHeight="6" orient="auto-start-reverse">
  <path d="M 0 0 L 10 5 L 0 10 z"/>
</marker>
<line x1="10" y1="10" x2="90" y2="90" stroke="black" marker-end="url(#arrow)"/>
```

关键属性：

- `markerWidth`/`markerHeight`：标记视口大小（默认 3）。
- `markerUnits`：默认 **`strokeWidth`**——标记随宿主线宽缩放（粗线配大箭头）；`userSpaceOnUse` 则固定大小。
- `refX`/`refY`：标记内哪个点对准路径顶点。
- `orient`：`auto` 随路径切线方向旋转；`auto-start-reverse` 让起点标记反向（一个 marker 做双向箭头）；也可写固定角度。
- `context-stroke`/`context-fill`：marker 内部用它们**继承宿主线条的颜色**，一个箭头适配所有颜色的线。

## 四、clipPath vs mask（必考）

两者都能「让图形只显示一部分」，判定模型完全不同：

| | clipPath | mask |
| --- | --- | --- |
| 判定 | **纯几何**：点在路径内/外，二值 | **像素级**：遮罩内容的**亮度 × alpha** → 目标透明度 |
| 半透明/软边 | 不可能（fill 色、透明度全被忽略） | 白显黑隐灰半透，可用渐变做淡出 |
| 性能 | 更好 | 更贵 |
| 典型 | 头像裁圆、异形窗口 | 渐隐、羽化、镂空效果 |

```xml
<defs>
  <clipPath id="cut"><rect width="200" height="100"/></clipPath>
  <linearGradient id="fade">
    <stop offset="0" stop-color="white"/><stop offset="1" stop-color="black"/>
  </linearGradient>
  <mask id="m"><rect width="200" height="200" fill="url(#fade)"/></mask>
</defs>
<circle cx="100" cy="100" r="100" clip-path="url(#cut)"/>  <!-- 上半圆：几何裁剪 -->
<rect width="200" height="200" fill="red" mask="url(#m)"/> <!-- 左实右透渐隐 -->
```

- **选型一句话**：硬边几何裁剪 → clipPath（便宜）；要半透明、羽化、渐隐 → 只能 mask。
- 默认坐标系各不相同，容易踩：`clipPathUnits` 默认 `userSpaceOnUse`；`maskUnits` 默认 `objectBoundingBox`（管 mask 自身区域）、`maskContentUnits` 默认 `userSpaceOnUse`（管 mask 内部内容）。
- CSS 的 `clip-path: url(#cut)` / `mask` 属性可以引用这些 SVG 定义，并且**能作用于 HTML 元素**——SVG 定义、全页复用。

## 五、滤镜：原语管道模型

`<filter id>` 定义一条**图像处理管道**，图形上 `filter="url(#id)"` 引用。管道由 fe 前缀的**原语（primitive）**串接：每个原语一进（`in`，部分有 `in2`）一出（`result` 给中间结果命名），**不写 in 时默认吃上一个原语的输出**。内置输入关键字：`SourceGraphic`（原图）、`SourceAlpha`（原图的 alpha 通道，做阴影的原料）。

经典手写投影管道 vs 一步到位：

```xml
<!-- 手写投影：SourceAlpha → 模糊 → 位移 → 与原图叠放 -->
<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
  <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
  <feOffset in="blur" dx="4" dy="4" result="off"/>
  <feMerge>
    <feMergeNode in="off"/>            <!-- 先列的在下层 -->
    <feMergeNode in="SourceGraphic"/>  <!-- 原图盖在阴影上 -->
  </feMerge>
</filter>

<!-- SVG 2 / Filter Effects 快捷原语，一条顶三条 -->
<filter id="ds"><feDropShadow dx="4" dy="4" stdDeviation="3" flood-color="#0006"/></filter>
```

常用原语一览：`feGaussianBlur`（stdDeviation 模糊）、`feOffset`（位移）、`feMerge`/`feMergeNode`（多层堆叠）、`feFlood`（纯色板）、`feComposite`（operator: over/in/out/atop/xor/arithmetic）、`feColorMatrix`（type: matrix/saturate/hueRotate/luminanceToAlpha——灰度、变色都靠它）、`feComponentTransfer`（逐通道曲线）、`feTurbulence`（Perlin 噪声，配 `feDisplacementMap` 做水波/毛玻璃质感）、`feMorphology`、`feImage`，以及光照系（`feDiffuseLighting`/`feSpecularLighting` + `fePointLight`）。

两个工程要点：

- **滤镜区域默认只比元素大 10%**（x/y/width/height 默认 -10%/-10%/120%/120%）——大 stdDeviation 的模糊、长距离阴影会被切边，像上例那样手动扩大 region。
- **CSS `filter: url(#id)` 可以把 SVG 滤镜套在 HTML 元素上**；CSS 的 `blur()`/`drop-shadow()` 等滤镜函数本质就是这些原语的速记。

结构与视觉效果都齐了，最后一块拼图是让它动起来并跑得快——[动画与优化](./animation-and-optimization)。
