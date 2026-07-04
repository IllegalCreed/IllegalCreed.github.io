---
layout: doc
outline: [2, 3]
---

# 坐标与形状：viewport / viewBox / 基本形状

> 基于 SVG 1.1 / SVG 2 CR（2026 浏览器现状）· 核于 2026-07

## 速查

- **坐标系**：原点在**左上角**，x 向右、y 向下（与数学坐标系 y 方向相反，与 Canvas 一致）。
- **viewport（视口）**：`<svg>` 的 `width`/`height` 决定的实际显示窗口。
- **viewBox="min-x min-y width height"**：定义**用户坐标系**，把这块逻辑区域映射进 viewport；**缩放比 = viewport 尺寸 / viewBox 尺寸**。
  - `viewBox="0 0 100 100"` + `width="200" height="200"` → 内容放大 2 倍，用户坐标 (50,50) 落在设备 (100,100)。
  - min-x/min-y 是「把用户坐标系的哪个点对到视口左上角」：min-x 增大，内容视觉上**左移**（平移的是裁切窗口，不是内容）。
- **用户单位**：无单位数值走用户坐标系，默认 1 用户单位 = 1px；绝对单位（cm/pt）按物理尺寸呈现。
- **preserveAspectRatio="align meet|slice"**（默认 `xMidYMid meet`），仅当 viewBox 与 viewport 宽高比不一致时起作用：
  - `meet`：等比缩放，viewBox 完整可见，可能留白（约等于 `object-fit: contain`）。
  - `slice`：等比缩放，填满 viewport，超出被裁（约等于 `object-fit: cover`）。
  - `none`：非等比拉伸填满（此时 meet/slice 被忽略）。
  - align 九宫格：`xMin|xMid|xMax` × `YMin|YMid|YMax`——**x 小写、Y 大写**。
  - **没写 viewBox 时该属性被忽略**（`<image>` 例外）。
- **六个基本形状**：`rect`（x/y/width/height/rx/ry）、`circle`（cx/cy/r）、`ellipse`（cx/cy/rx/ry）、`line`（x1/y1/x2/y2，必须 stroke 才可见）、`polyline`（points，不闭合）、`polygon`（points，自动闭合）。
- **polyline vs polygon**：唯一区别是**是否自动闭合**。
- **嵌套 `<svg>`**：在内部建立全新 viewport + 坐标系，比 `g` 加 transform 多了独立裁切与比例控制。
- **响应式金律**：保留 viewBox、去掉硬编码 width/height，由 CSS 控制尺寸——viewBox 提供固有宽高比。

## 一、viewport 与用户坐标系

SVG 的坐标世界由两层构成：

- **viewport（视口）**：`<svg width="300" height="200">` 在页面上占据的实际窗口，即「往哪块屏幕区域画」。
- **用户坐标系（user coordinate system）**：SVG 内部所有图形的 x/y/cx/cy 所参照的逻辑坐标系，即「按什么尺子画」。

没有 viewBox 时，两者重合：1 用户单位 = 1 CSS 像素。原点在**左上角**，x 向右、y 向下——注意 y 方向与数学坐标系相反（与 Canvas 一致），新手画「向上的柱子」时经常方向搞反。

坐标值不带单位时走用户坐标系；也可写绝对单位（cm/pt 等按物理尺寸 1:1 呈现，SVG 1.1 按 90dpi 折算 1cm 约 35.43px），实际开发几乎只用无单位数值。

## 二、viewBox：映射，而不只是裁剪（必考）

`viewBox="min-x min-y width height"` 做的事是：**定义一块用户坐标系区域，并把它映射（缩放 + 平移）到 viewport**。把它只理解成「裁剪框」是不完整的——它同时改变了内部所有坐标的「比例尺」。

```xml
<!-- viewBox 宽 100 映射进 200px 宽的视口 → 一切放大 2 倍 -->
<svg width="200" height="200" viewBox="0 0 100 100">
  <!-- 这个圆的用户坐标 (50,50) r=40，实际显示在设备 (100,100) r=80 -->
  <circle cx="50" cy="50" r="40"/>
</svg>
```

两条规则：

- **缩放比 = viewport 尺寸 / viewBox 尺寸**。上例 200/100 = 2，内容放大两倍。
- **min-x/min-y 是「把用户坐标系的哪个点对到视口左上角」**。`viewBox="50 0 100 100"` 表示从用户坐标 (50,0) 开始取景——视觉效果是内容**向左移动** 50 用户单位。新手常猜反方向：记住平移的是「取景窗口」，不是内容本身。

## 三、preserveAspectRatio：宽高比不一致时怎么办

当 viewBox 的宽高比与 viewport 不一致时，`preserveAspectRatio="<align> [meet|slice]"` 决定适配策略（默认 `xMidYMid meet`）：

| 值 | 行为 | CSS 类比 |
| --- | --- | --- |
| `meet` | 等比缩放，viewBox **完整可见**，可能留白 | `object-fit: contain` |
| `slice` | 等比缩放，**填满 viewport**，超出被裁 | `object-fit: cover` |
| `none` | 非等比拉伸填满，宽高比不保留 | `object-fit: fill` |

- **align 九宫格**：`xMin|xMid|xMax` 与 `YMin|YMid|YMax` 组合，控制留白/裁切时内容贴哪边。如 `xMinYMax slice` = 左下对齐裁切。**注意大小写：x 小写、Y 大写**，写错整个属性失效。
- 写 `none` 时 meet/slice 被忽略。
- **没写 viewBox 时 preserveAspectRatio 直接被忽略**——「为什么设置了不生效」的高频来源（`<image>` 元素例外：它用该属性控制外部图像与自身矩形的适配）。
- 适用元素：`svg`、`symbol`、`image`、`feImage`、`marker`、`pattern`、`view`。

## 四、六个基本形状

```xml
<rect x="10" y="10" width="30" height="30" rx="6"/>   <!-- rx/ry 圆角；只给 rx 则 ry=rx -->
<circle cx="25" cy="75" r="20"/>                       <!-- 圆心 + 半径 -->
<ellipse cx="75" cy="75" rx="20" ry="5"/>              <!-- 两个方向的半径 -->
<line x1="10" y1="110" x2="50" y2="150"/>              <!-- line 无 fill 概念，必须 stroke 才可见 -->
<polyline points="60,110 65,120 70,115"/>              <!-- 折线：不闭合；points 用空格或逗号分隔 -->
<polygon points="50,160 55,180 70,180"/>               <!-- 多边形：最后一点自动连回第一点 -->
```

- **rect**：`rx`/`ry` 做圆角，只给一个时另一个自动相等。
- **line**：没有内部区域可填充，不设 `stroke` 就什么都看不见。
- **polyline vs polygon**：唯一区别是**后者自动闭合**。闭合与否影响 stroke 端点外观和 fill 结果——未闭合形状做 fill 时按「首尾相连」的区域填充。
- 所有基本形状本质上都能用 `<path>` 表达；基本形状是语义化快捷方式。

## 五、嵌套 svg 与响应式

- **嵌套 `<svg>`**：可以在图形内部再开一个 `<svg x y width height viewBox>`，建立全新的 viewport + 用户坐标系。相比 `<g transform="...">`，它多了**独立的裁切边界与比例控制**（自己的 preserveAspectRatio），适合「图中图」布局。
- **响应式金律**：保留 viewBox、去掉根元素硬编码的 width/height，由 CSS 控制尺寸（`svg { width: 100%; height: auto; }`）——viewBox 提供固有宽高比，图形随容器等比缩放。
- **300×150 之谜**：`<img>`/`<object>` 引用一个既无 width/height 也无 viewBox 的 SVG 时，替换元素回退到默认尺寸 **300×150**。「SVG 怎么变成 300×150 了」就是这个原因——务必让文件带 viewBox。

坐标系统吃透后，就可以进入 SVG 表达力的核心——[path 与 d 命令](./paths)。
