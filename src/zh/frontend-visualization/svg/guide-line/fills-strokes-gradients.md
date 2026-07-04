---
layout: doc
outline: [2, 3]
---

# 填充描边与渐变：paint 体系 / 描边动画 / pattern

> 基于 SVG 1.1 / SVG 2 CR（2026 浏览器现状）· 核于 2026-07

## 速查

- **fill/stroke 取值**：颜色、`none`、`currentColor`（跟随文字色，主题图标神器）、`url(#渐变或图案)`；配套 `fill-opacity`/`stroke-opacity`。
- **opacity vs fill-opacity**：元素级 `opacity` 是「先合成再整体变透明」，与分别设 fill/stroke 透明度**视觉不同**。
- **stroke 以路径为中心线**：一半在内一半在外；1px 描边落在半像素处会发虚；边缘图形描边有一半溢出 viewBox 被裁。
- **stroke-linecap**：`butt`（默认，齐平截断）| `square`（外扩半线宽方头）| `round`（半圆头）。
- **stroke-linejoin**：`miter`（默认尖角，受 `stroke-miterlimit` 限制）| `round` | `bevel`（斜切）。
- **stroke-dasharray**：「实-虚」长度序列；**奇数个值整组复制补成偶数**（`5,10,5` 实为 `5,10,5,5,10,5`）；`stroke-dashoffset` 平移虚线起点。
- **描边动画原理**（必考）：dasharray = dashoffset = 路径总长 L → 实段完全移出可见区 → 动画 offset 从 L 到 0，路径像被画出来。真实长度 `getTotalLength()`；纯 CSS 用 `pathLength="100"` 归一化免测长。
- **缩放描边**：`scale()` 连 stroke-width 一起缩放；`vector-effect="non-scaling-stroke"` 保持线宽不变（地图/图表缩放刚需）。
- **渐变**：定义在 `defs`，`fill="url(#id)"` 引用；`stop` 定色标（offset/stop-color/stop-opacity）。
  - `linearGradient x1 y1 x2 y2`：默认水平；`radialGradient cx cy r fx fy`：fx/fy 是焦点。
  - `spreadMethod`：`pad`（默认）| `reflect`（镜像）| `repeat`（循环）。
  - **gradientUnits**：默认 `objectBoundingBox`（0~1 相对包围盒）；`userSpaceOnUse` 绝对坐标（跨多图形共享渐变时用）。
  - 渐变可 `href="#另一渐变"` 继承色标只改几何。
- **pattern 双坐标系坑**（必考）：`patternUnits` 默认 **objectBoundingBox**，`patternContentUnits` 默认 **userSpaceOnUse**——两个默认值**不一致**，tile 位置与 tile 内容坐标脱节，必须显式统一或心里有数。
- **presentation attribute 优先级最低**：任何 CSS 规则都能覆盖 `fill="red"` 这类属性；行内 style 最高。

## 一、fill 与 stroke 基础

`fill`（填充）与 `stroke`（描边）是 SVG 的两大着色通道，取值一致：颜色值、`none`、`currentColor`、`url(#id)`（引用渐变/图案）。

- **currentColor**：取当前 CSS `color` 值——图标写 `fill="currentColor"`，颜色自动跟随文字，主题切换零成本。
- **透明度三兄弟**：`fill-opacity`/`stroke-opacity` 分别控制两个通道；元素级 `opacity` 是**先把 fill+stroke 合成完再整体变透明**——描边与填充交叠处的视觉结果和分别设透明度不同，别混用。
- **优先级坑**：`fill="red"` 这类 presentation attribute 在级联里**优先级最低**，任何 CSS 规则（含外部样式表）都能覆盖它；行内 `style` 最高。别指望属性赢过 CSS。

## 二、描边的几何细节

**stroke 以路径为中心线**：线宽的一半画在路径内侧、一半在外侧。三个直接后果：

1. `stroke-width` 越大，图形内容被「吃掉」越多（想全在外侧只能用双倍宽 + clipPath 之类的技巧）。
2. 整数坐标上的 1px 描边骑在像素边界上，两侧各染半像素——**发虚**；平移 0.5 对齐像素栅格可解。
3. 贴着 viewBox 边缘的图形，描边有一半溢出边界**被裁掉**。

端点与拐角样式：

- `stroke-linecap`：`butt`（默认，在端点齐平截断）、`square`（向外延伸半个线宽的方头）、`round`（半圆头）。
- `stroke-linejoin`：`miter`（默认尖角，锐角处尖刺过长时受 `stroke-miterlimit` 限制被削平）、`round`（圆角）、`bevel`（斜切）。

缩放场景的专属坑：`transform="scale(2)"` 会**连描边一起放大**——图大线粗。地图、可缩放图表想保持 1px 细线，用 `vector-effect="non-scaling-stroke"`。

## 三、虚线与描边动画（必考）

`stroke-dasharray` 接受逗号/空格分隔的「实段-空段」长度序列，`stroke-dashoffset` 平移虚线起点：

- `stroke-dasharray="5,10"`：画 5 空 10 循环。
- **奇数个值会整组复制一遍补成偶数**：`5,10,5` 实际是 `5,10,5,5,10,5`——冷知识但真考。

**描边（line drawing）动画**的原理是虚线的极限用法：把 dasharray 设为整条路径长 L（一个实段 + 一个空段各 L），再把 dashoffset 也设为 L——实段恰好完全移出可见区，路径「消失」；然后动画 offset 从 L 到 0，实段逐渐滑入，路径像被一笔画出来：

```html
<path class="line" d="M10 80 Q 95 10 180 80" pathLength="100"
      fill="none" stroke="#333" stroke-width="4"/>
<style>
.line {
  stroke-dasharray: 100;            /* pathLength="100" 把任意路径长度归一化成 100 */
  stroke-dashoffset: 100;           /* 起始：实段完全移出，路径不可见 */
  animation: draw 2s ease forwards; /* forwards 保住终态 */
}
@keyframes draw { to { stroke-dashoffset: 0; } }
</style>
```

- 不用 `pathLength` 时，真实长度靠 JS `path.getTotalLength()` 获取再写进样式。
- `getPointAtLength(len)` 可沿路径取点，配 rAF 做「小球沿路径滚动」一类效果。

## 四、渐变：linearGradient 与 radialGradient

渐变定义在 `<defs>` 里，图形用 `fill="url(#id)"` 或 `stroke="url(#id)"` 引用；`<stop>` 定义色标：

```xml
<defs>
  <!-- 默认从 (0,0) 到 (1,0)：水平渐变；改 x2=0 y2=1 即垂直 -->
  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0"   stop-color="gold"/>
    <stop offset="1"   stop-color="crimson" stop-opacity="0.8"/>
  </linearGradient>
  <!-- fx/fy 是焦点：渐变 0% 的发射点，默认与圆心重合；出圈会被拉回圈内 -->
  <radialGradient id="rgrad" cx="0.5" cy="0.5" r="0.5" fx="0.3" fy="0.3">
    <stop offset="0" stop-color="white"/>
    <stop offset="1" stop-color="navy"/>
  </radialGradient>
</defs>
<rect width="100" height="60" fill="url(#grad)"/>
<circle cx="160" cy="30" r="30" fill="url(#rgrad)"/>
```

- **spreadMethod**：色标范围外怎么铺——`pad`（默认，端色延伸）、`reflect`（镜像往返）、`repeat`（循环）。
- **gradientUnits**（重要）：默认 `objectBoundingBox`——坐标取 0~1，相对**被填充对象的包围盒**，渐变随对象大小自适应；`userSpaceOnUse` 则用用户坐标系的绝对值，适合**多个图形共享同一条渐变**（如整幅图表统一光照方向）。
- 渐变可以 `href="#另一渐变"` **继承其色标**、只改几何参数（SVG 2 用 href，旧写法 xlink:href）——一组色板多个方向复用。

## 五、pattern：平铺图案与双坐标系坑

`<pattern>` 定义一块可平铺的 tile，同样经 `url(#id)` 作为 fill/stroke 使用。它的**双坐标系**是招牌坑（必考）：

- **patternUnits**——管 tile 自身的 `x/y/width/height` 参照系，默认 **objectBoundingBox**：`width="0.25"` 表示「对象宽度的 1/4」，即横向铺 4 次。
- **patternContentUnits**——管 tile **内部图形**的坐标参照系，默认 **userSpaceOnUse**（绝对用户坐标）。

两者的默认值**不一致**：tile 的占位用相对坐标、tile 里的内容用绝对坐标，不显式统一必然对不上——要么把 `patternContentUnits` 也设为 `objectBoundingBox`（内容坐标写 0~1），要么把 `patternUnits` 设为 `userSpaceOnUse`（全部绝对坐标）。

```xml
<defs>
  <!-- 全部走绝对坐标：20×20 的 tile，内容坐标与之直接对应 -->
  <pattern id="dots" patternUnits="userSpaceOnUse" width="20" height="20">
    <circle cx="10" cy="10" r="4" fill="steelblue"/>
  </pattern>
</defs>
<rect width="200" height="100" fill="url(#dots)"/>
```

缩放行为差异也值得记：objectBoundingBox 下对象变大 tile 跟着变大（**个数不变**）；userSpaceOnUse 下 tile 尺寸固定，对象变大**铺更多次**。

填充与描边体系到此完整。渐变、pattern 都住在 `defs` 里——下一页[结构与复用](./structure-and-reuse)系统讲这套「定义-引用」架构，以及 `use` 影子树、clipPath vs mask 与滤镜管道。
