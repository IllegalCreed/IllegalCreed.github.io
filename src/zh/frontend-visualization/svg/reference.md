---
layout: doc
outline: [2, 3]
---

# 参考：SVG 元素 / 属性 / d 命令速查

> 基于 SVG 1.1 / SVG 2 CR（2026 浏览器现状）· 核于 2026-07

## 速查

- **坐标**：viewBox="min-x min-y w h" 定义用户坐标系；缩放比 = viewport/viewBox；preserveAspectRatio 默认 `xMidYMid meet`（meet≈contain、slice≈cover、none=拉伸；无 viewBox 时被忽略）。
- **形状**：`rect`/`circle`/`ellipse`/`line`/`polyline`/`polygon`；polygon 自动闭合；全部可用 `path` 表达。
- **d 命令**：M 移动、L/H/V 直线、C/S 三次贝塞尔、Q/T 二次贝塞尔、A 椭圆弧（7 参数）、Z 闭合；**大写绝对、小写相对**。
- **paint**：fill/stroke = 颜色 | none | currentColor | url(#id)；fill-rule：nonzero（默认）/evenodd；dasharray 奇数值整组复制。
- **描边动画**：dasharray = dashoffset = 路径长（`getTotalLength()` 或 `pathLength` 归一化）→ 动画 offset 归零。
- **复用**：`defs` 只定义不渲染；`symbol` 自带 viewBox；`use` 深克隆进影子树（JS 不可及、CSS 继承/变量可穿透、显式属性不可覆盖、外部 sprite 严格同源）。
- **裁剪遮罩**：clipPath 几何二值（无软边、便宜）vs mask 亮度×alpha（可渐变羽化、贵）。
- **滤镜**：fe 原语管道（in/result 串接）；输入 SourceGraphic/SourceAlpha；默认 region 只扩 10%，大阴影记得扩；feDropShadow 一条顶三条。
- **变换**：rotate 默认绕 (0,0)；从左到右应用、每步新坐标系；CSS 侧要 deg + `transform-box: fill-box` 才绕自身中心。
- **动画三路**：CSS（UI 微动效）/ SMIL（路径 morph、animateMotion、img 内自动播；未废弃）/ JS（GSAP/WAAPI 复杂时间线）。
- **脚本**：createElementNS 必须；href 取代 xlink:href；getBBox/getScreenCTM 做几何与坐标换算。
- **优化**：3k~5k 节点阈值换 Canvas；SVGO v4 才默认保 viewBox/title，v3 前手动关 removeViewBox。
- **无障碍**：role="img" + `title` 首子元素 + aria-labelledby；装饰图 aria-hidden + focusable="false"。

## 一、常用元素速查

| 元素 | 作用 | 关键属性 |
| --- | --- | --- |
| `<svg>` | 根元素/嵌套视口 | width/height/viewBox/preserveAspectRatio/xmlns |
| `<rect>` | 矩形 | x/y/width/height/rx/ry（圆角） |
| `<circle>` | 圆 | cx/cy/r |
| `<ellipse>` | 椭圆 | cx/cy/rx/ry |
| `<line>` | 线段（须 stroke 才可见） | x1/y1/x2/y2 |
| `<polyline>` | 折线（不闭合） | points |
| `<polygon>` | 多边形（自动闭合） | points |
| `<path>` | 任意路径 | d/pathLength/fill-rule |
| `<text>` | 文本（x/y 是**基线**起点，不自动换行） | x/y/dx/dy/rotate/text-anchor/dominant-baseline/textLength |
| `<tspan>` | 文本内局部换样式/重定位（手动换行） | x/y/dx/dy |
| `<textPath>` | 文字沿路径排布 | href/startOffset |
| `<g>` | 分组 + 属性继承 | transform 及所有 presentation 属性 |
| `<defs>` | 只定义不渲染的资源库 | — |
| `<symbol>` | 复用模板（自带视口、不直接渲染） | viewBox/preserveAspectRatio |
| `<use>` | 引用克隆（影子树） | href/x/y/width/height（后两者仅对 svg/symbol 生效） |
| `<marker>` | 顶点标记（箭头等） | markerWidth/markerHeight/markerUnits/refX/refY/orient |
| `<linearGradient>` | 线性渐变 | x1/y1/x2/y2/gradientUnits/spreadMethod/href |
| `<radialGradient>` | 径向渐变 | cx/cy/r/fx/fy（焦点） |
| `<stop>` | 渐变色标 | offset/stop-color/stop-opacity |
| `<pattern>` | 平铺图案 | patternUnits/patternContentUnits/width/height |
| `<clipPath>` | 几何裁剪 | clipPathUnits（默认 userSpaceOnUse） |
| `<mask>` | 亮度×alpha 遮罩 | maskUnits（默认 objectBoundingBox）/maskContentUnits |
| `<filter>` | 滤镜管道容器 | x/y/width/height（默认 -10%~120%） |
| `<image>` | 嵌入位图/SVG | href/x/y/width/height/preserveAspectRatio |
| `<foreignObject>` | 内嵌 HTML（自动换行文本/表单） | x/y/width/height |
| `<a>` | 超链接包裹图形 | href/target |
| `<title>`/`<desc>` | 无障碍名称/描述（title 须为首子元素） | id（供 aria-labelledby） |
| `<animate>` 等 | SMIL 动画四件套 | attributeName/from/to/dur/begin/repeatCount/fill |

## 二、d 命令速查

| 命令 | 参数 | 语义 |
| --- | --- | --- |
| M/m | x y | 移动画笔（不画线）；后续坐标对按 L/l 处理 |
| L/l | x y | 画直线 |
| H/h | x | 水平线 |
| V/v | y | 垂直线 |
| C/c | x1 y1 x2 y2 x y | 三次贝塞尔：两控制点 + 终点 |
| S/s | x2 y2 x y | 平滑三次：第一控制点 = 反射前一条 C/S 的第二控制点 |
| Q/q | x1 y1 x y | 二次贝塞尔：单控制点 + 终点 |
| T/t | x y | 平滑二次：控制点反射推断；单独用退化为直线 |
| A/a | rx ry rot laf sf x y | 椭圆弧：两半径、x 轴旋转角、large-arc-flag、sweep-flag、终点 |
| Z/z | — | 直线连回本子路径起点闭合 |

A 命令帮记：两点 + 两半径给出 4 条候选弧，`large-arc-flag`（1 大弧）与 `sweep-flag`（1 正角度方向/屏幕顺时针）四选一；半径不足会被自动放大。

## 三、关键属性与默认值速查

| 属性 | 取值（默认加粗） | 备注 |
| --- | --- | --- |
| preserveAspectRatio | **xMidYMid meet** \| align + meet/slice \| none | 无 viewBox 时被忽略 |
| fill-rule | **nonzero** \| evenodd | clipPath 内对应 clip-rule |
| stroke-linecap | **butt** \| square \| round | 端点样式 |
| stroke-linejoin | **miter** \| round \| bevel | miter 受 stroke-miterlimit 限制 |
| stroke-dasharray | 长度序列 | 奇数个值整组复制补偶 |
| text-anchor | **start** \| middle \| end | 相对 x 的锚定；垂直用 dominant-baseline |
| gradientUnits | **objectBoundingBox** \| userSpaceOnUse | 后者用于跨图形共享渐变 |
| patternUnits | **objectBoundingBox** | tile 占位参照系 |
| patternContentUnits | **userSpaceOnUse** | tile 内容参照系——与上行默认**不一致**，招牌坑 |
| clipPathUnits | **userSpaceOnUse** \| objectBoundingBox | 注意与 mask 默认相反 |
| maskUnits / maskContentUnits | **objectBoundingBox** / **userSpaceOnUse** | mask 区域 / mask 内容 |
| markerUnits | **strokeWidth** \| userSpaceOnUse | 默认随线宽缩放 |
| spreadMethod | **pad** \| reflect \| repeat | 渐变范围外的铺法 |
| pointer-events | **visiblePainted** \| all \| none \| bounding-box 等 | 默认下 fill="none" 区域不可点 |
| vector-effect | non-scaling-stroke | 缩放时保持线宽 |
| transform-box（CSS） | **view-box** \| fill-box \| stroke-box | 绕自身中心转的钥匙 |
| xmlns | http://www.w3.org/2000/svg | 独立 .svg 必须；HTML 内联可省 |

## 四、引入方式速查

| 方式 | JS 控内部 | CSS 控内部 | 内部脚本 | 缓存 |
| --- | --- | --- | --- | --- |
| inline `<svg>` | 完全 | 完全 | 执行 | 随 HTML |
| `<img>` / CSS 背景 | 否 | 否 | 禁用 | 独立缓存 |
| `<object>` 等 | 同源 contentDocument | 不级联 | 执行 | 独立缓存 |
| `<use>` sprite | 克隆树不可 | 继承/CSS 变量穿透 | 禁用 | sprite 可缓存（严格同源） |

## 五、易错点清单

- viewBox 只当「裁剪框」理解——它是坐标系映射；min-x 增大内容**左移**（新手常猜反）。
- 无 viewBox 时 preserveAspectRatio 失效；无固有尺寸的 SVG 被 img/object 回退成 **300×150**。
- A 命令 flag 与坐标连写（`0 0140 20`）人读错；半径太小被自动放大不报错。
- `scale()` 连描边一起放大 → `vector-effect="non-scaling-stroke"`。
- 旋转乱飞：属性 rotate 默认绕 (0,0)；CSS 侧默认参考框不是自身 → `transform-box: fill-box; transform-origin: center`。
- `use` 覆盖失效：被引元素写死 fill/stroke 外部改不动——图标源文件用 currentColor/CSS 变量。
- `use` 外部 sprite 跨域（CDN）直接不显示——严格同源、无 CORS 开关。
- 「SMIL 已弃用」是误传：Chrome 弃用令已撤回，别说死。
- `createElement` 造的 SVG 元素不渲染——必须 `createElementNS`。
- SVGO v3 及以前默认删 viewBox/title——手动禁用 removeViewBox。
- `<img>` 引用的 SVG：脚本不执行、外部资源不加载——「本地正常、引用就坏」主因。
- pattern 双 units 默认值不一致，tile 与内容坐标脱节。
- clipPath 做不出半透明/羽化——要软边只能 mask。
- 滤镜默认 region 只扩 10%，大模糊/长阴影被切边。
- `fill="none"` 区域点击无效（visiblePainted）——热区用 pointer-events="all"。
- presentation attribute 优先级最低，任何 CSS 都能覆盖 `fill="red"`。
- SVG 文本不自动换行——`tspan` 手动分行或 `foreignObject` 嵌 HTML。
- 1px 描边骑在像素边界发虚；贴边图形描边被裁一半。
- 多个 inline SVG 的 id 全局冲突（渐变互相串）——组件化加前缀/hash。
- 服务器 MIME 不是 `image/svg+xml` → 加载失败。

## 六、权威链接

- [MDN SVG 总览（中文）](https://developer.mozilla.org/zh-CN/docs/Web/SVG) —— 教程/指南/参考三层齐全
- [MDN SVG 教程](https://developer.mozilla.org/zh-CN/docs/Web/SVG/Tutorials/SVG_from_scratch) —— 从坐标到滤镜逐章
- [MDN 元素参考](https://developer.mozilla.org/zh-CN/docs/Web/SVG/Reference/Element) / [preserveAspectRatio](https://developer.mozilla.org/zh-CN/docs/Web/SVG/Reference/Attribute/preserveAspectRatio) / [pointer-events](https://developer.mozilla.org/zh-CN/docs/Web/SVG/Reference/Attribute/pointer-events)
- [MDN SMIL 动画指南](https://developer.mozilla.org/zh-CN/docs/Web/SVG/Guides/SVG_animation_with_SMIL) / [命名空间速成](https://developer.mozilla.org/zh-CN/docs/Web/SVG/Guides/Namespaces_crash_course) / [SVG 作为图像](https://developer.mozilla.org/zh-CN/docs/Web/SVG/Guides/SVG_as_an_image)
- [W3C SVG 2（CR）](https://www.w3.org/TR/SVG2/) / [编辑草案](https://svgwg.org/svg2-draft/)
- [SVGO](https://github.com/svg/svgo) / [preset-default 说明](https://svgo.dev/docs/preset-default/)
- [CSS-Tricks: How SVG Line Animation Works](https://css-tricks.com/svg-line-animation-works/) / [SVG symbol for Icons](https://css-tricks.com/svg-symbol-good-choice-icons/) / [Accessible SVGs](https://css-tricks.com/accessible-svgs/)
