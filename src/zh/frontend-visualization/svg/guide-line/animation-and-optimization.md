---
layout: doc
outline: [2, 3]
---

# 动画与优化：SMIL / CSS / JS、性能、无障碍

> 基于 SVG 1.1 / SVG 2 CR（2026 浏览器现状）· 核于 2026-07

## 速查

- **三路动画选型口诀**：UI 微动效 → **CSS**；路径变形 / 沿路径运动 / `<img>` 内自动播 → **SMIL**；复杂时间线、交互驱动 → **JS**（GSAP/WAAPI）。
- **SMIL**：`<animate>`（动属性）、`<animateTransform>`（动变换）、`<animateMotion>`（沿路径，`rotate="auto"` 随切线转向）、`<set>`；关键属性 `attributeName/from/to/values/dur/begin/repeatCount/fill="freeze"`；`begin` 支持事件（`click`）与同步（`otherId.end+0.5s`）。
- **「SMIL 已弃用」是误传**：Chrome 45（2015）宣布弃用后**官方撤回**；三大浏览器持续支持，现状是「维护模式」。独有能力：跨浏览器路径 morph（d 值插值）、animateMotion、`<img>` 内可播。
- **CSS 动画范围**：presentation properties（fill/stroke/opacity/dasharray/transform/filter）；SVG 2 后**几何属性也开放**（cx/r/x/width 等，三大浏览器已支持）。
- **`d: path()` 例外**：CSS 动画 path 形状仅 Chromium 52+ / Firefox 97+，**Safari 不支持**，且要求两条路径**命令数量与类型完全一致**——跨浏览器路径变形用 SMIL 或 JS 库。
- **JS**：WAAPI `svgEl.animate()`（只能动 CSS 可控属性）；rAF + setAttribute 可动任意属性；库：**GSAP**（事实标准，MorphSVG/DrawSVG）、Snap.svg、anime.js。
- **transform 属性坑**：
  - `rotate(a)` 默认绕**用户坐标系原点 (0,0)**，绕指定点写 `rotate(a, cx, cy)`。
  - 多个变换**从左到右**应用、每步建立新坐标系：`translate(30) scale(2)` ≠ `scale(2) translate(30)`。
  - `matrix(a b c d e f)`：newX = a·x + c·y + e，newY = b·x + d·y + f。
- **CSS transform 用在 SVG 的两大差异**：单位必须带 `deg`；**transform-origin 默认不在自身中心**（参考框是 view-box）——绕自身中心要 `transform-box: fill-box; transform-origin: center`。
- **createElementNS（必考）**：JS 动态创建 SVG 必须 `document.createElementNS("http://www.w3.org/2000/svg", "rect")`——`createElement` 造出的是 HTML 命名空间元素、**不渲染**。无前缀属性直接 `setAttribute`；`href` 已取代 `xlink:href`。
- **性能**：瓶颈=DOM 节点数（几百~3k 舒适，3k~5k 卡，上万换 Canvas）；filter/mask/大面积半透明最贵；动画优先 transform/opacity。
- **SVGO**：删元数据/默认值/压缩路径；**v4（2025）把 removeViewBox、removeTitle 移出 preset-default**；v3 及以前必须手动关 removeViewBox（删 viewBox = 图标不能缩放，历史第一大坑）。
- **无障碍**：inline SVG 用 `role="img"` + `<title>`（首子元素）+ `aria-labelledby`；纯装饰 `aria-hidden="true"`（老 IE 加 `focusable="false"`）。
- **pointer-events**：默认 `visiblePainted`——`fill="none"` 的镂空区域**点不中**；要透明热区用 `pointer-events="all"` 或 `fill="transparent"`。

## 一、动画三路线

### ① SMIL：声明式，写在 SVG 内部

SMIL 动画元素作为目标图形的子元素声明，零脚本：

```xml
<circle cx="0" cy="50" r="15" fill="blue">
  <animate attributeName="cx" from="0" to="300" dur="5s" repeatCount="indefinite"/>
</circle>
<rect width="20" height="20">
  <!-- 沿路径运动，rotate="auto" 让元素随切线转向；也可用子元素 mpath 引用既有路径 -->
  <animateMotion dur="3s" repeatCount="indefinite" rotate="auto" path="M 0 0 H 300 Z"/>
  <animateTransform attributeName="transform" type="rotate"
                    from="0 60 60" to="360 60 60" dur="10s"/>
</rect>
```

- 四元素分工：`<animate>` 动普通属性、`<animateTransform>` 动 transform、`<animateMotion>` 沿路径运动、`<set>` 定时设值。
- 关键属性：`attributeName`/`from`/`to`/`values`、`dur`、`repeatCount="indefinite"`、`fill="freeze"`（终态保持）；`keyTimes` + `keySplines`（配 `calcMode="spline"`）做缓动；**`begin` 支持事件与同步**——`begin="click"`、`begin="otherId.end+0.5s"` 可做无脚本交互链。
- **维护现状（2026）**：未被标准废弃——Chrome 45 曾宣布弃用、后官方**撤回**，三大浏览器持续支持；定位「维护模式」，不再扩展新能力。面试与写作都别说死「已废弃」。
- **不可替代的三件事**：跨浏览器的 `d` 值插值（路径 morph）、animateMotion 沿路径运动、在 `<img>`/背景图上下文里自动播放。

### ② CSS 动画/过渡

inline SVG 语境下，CSS 的 transition/animation、hover 伪类、媒体查询、CSS 变量全套可用：

- 可动画范围 = presentation properties：`fill`、`stroke`、`opacity`、`stroke-dasharray`/`dashoffset`、`transform`、`filter` 等。
- **SVG 2 红利**：几何属性（`cx`/`cy`/`r`/`x`/`y`/`width`/`height`）升级为 presentation property，Chromium/Firefox/Safari 均已支持用 CSS 设置与动画——hover 让圆变大不再需要 JS。
- **`d: path()` 是例外**：用 CSS 改/动画路径形状，仅 Chromium 52+ 与 Firefox 97+ 支持，**Safari 至今不支持**（MDN 标注非 Baseline），且插值要求两条路径**命令数量与类型完全一致**。跨浏览器路径变形老实用 SMIL 或 JS 库。

### ③ JS / WAAPI / 库

- **WAAPI**：`svgEl.animate(keyframes, options)` 对 SVG 元素可用，但只能动 CSS 能控的属性。
- **rAF 手撸**：requestAnimationFrame + `setAttribute` 可以动**任意属性**，是兜底方案。
- **库**：GSAP 是事实标准（MorphSVG 变形、DrawSVG 描边插件），另有 Snap.svg、anime.js、Framer Motion——本质都是 JS 驱动属性。

## 二、transform 的坑（属性与 CSS 双轨）

### transform 属性

函数：`translate(x[,y])`、`rotate(a[,cx,cy])`、`scale(x[,y])`、`skewX(a)`/`skewY(a)`、`matrix(a b c d e f)`。

- **rotate 默认绕用户坐标系原点 (0,0)**——不带 cx/cy 时图形常「转飞出去」；绕自身某点写 `rotate(45, 60, 60)`。
- **scale 连 stroke-width 一起缩放**：图放大线变粗，想保持细线用 `vector-effect="non-scaling-stroke"`。
- **顺序敏感**：多个变换**从左到右**依次应用，且每一步都建立**新坐标系**——`translate(30) scale(2)` 与 `scale(2) translate(30)` 结果不同（后者位移在放大后的坐标系里执行，实际移了 60）。
- `matrix(a b c d e f)` 的坐标公式：newX = a·x + c·y + e，newY = b·x + d·y + f（a/d 缩放、b/c 斜切、e/f 平移）。

### CSS transform 作用于 SVG

SVG 2 起 `transform` 是 presentation attribute，CSS 也能写——但有两个著名差异：

1. **单位**：属性写 `rotate(45)`（裸数字，度）；CSS 必须 `rotate(45deg)`。
2. **transform-origin**：SVG 内部元素默认绕**用户坐标系原点/视口参考框**转，不是自身中心（HTML 默认 50% 50%）。想绕自身中心旋转：

```css
.gear {
  transform-box: fill-box;      /* 参考框改为自身几何包围盒 */
  transform-origin: center;     /* 此时 center 才是「自身中心」 */
  animation: spin 4s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg) } }
```

`transform-box` 取值：`view-box`（默认，参照最近的 SVG 视口）、`fill-box`（自身几何包围盒）、`stroke-box` 等。「SVG 元素旋转乱飞」十有八九是这个坑。

## 三、脚本操作与命名空间（必考）

JS 动态创建 SVG 元素**必须用 `createElementNS`**——`document.createElement("rect")` 创建的是 HTML 命名空间下的无意义元素，**不渲染**。这是「JS 动态画 SVG 失败」的第一原因：

```js
const NS = "http://www.w3.org/2000/svg";
const rect = document.createElementNS(NS, "rect"); // 必须带 SVG 命名空间
rect.setAttribute("width", "100");   // 无前缀属性：setAttribute 即可
rect.setAttribute("fill", "tomato"); // （等价 setAttributeNS(null, …)）
svg.appendChild(rect);

use.setAttribute("href", "#id");     // SVG 2 推荐：href 已取代 xlink:href
// 兼容旧 Safari 才需要 NS 版本：
use.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#id");
```

- HTML 解析器对内联 `<svg>` 自动切换命名空间，因此 `innerHTML` 插入 svg 片段没问题；独立 XML 文档必须显式 xmlns。
- SVG DOM 专有 API：`getTotalLength()`/`getPointAtLength()`（路径测长取点）、`getBBox()`（几何包围盒，不含 stroke）、`getScreenCTM()`（坐标系矩阵，配 `DOMPoint.matrixTransform` 做「屏幕坐标 → SVG 用户坐标」换算，图表交互刚需）。

### 交互命中：pointer-events

inline SVG 元素是真 DOM，click/pointer/keyboard、`tabindex`、`<a>` 包裹都可用。命中范围由 `pointer-events` 决定，默认值 `visiblePainted` 的语义：元素可见**且**指针落在「实际着色」的部分（fill 不为 none 的内部、或 stroke 不为 none 的描边）才命中——**`fill="none"` 的镂空区域点不中**。要透明热区：`pointer-events="all"` 或 `fill="transparent"`；反过来 `pointer-events: none` 让装饰层「穿透」给下层交互。SVG 2 新增 `bounding-box` 值（整个包围盒可命中）。

## 四、性能与 SVGO

- **瓶颈本质是 DOM 节点数**：每个图形都参与样式计算/布局/绘制。经验阈值：**几百~3k 节点舒适，3k~5k 开始卡，上万节点（如 10 万散点）必须换 Canvas/WebGL**。混合方案常见：Canvas 画数据层 + SVG 画轴/标注层。
- **高成本特性**：filter（尤其大 stdDeviation）、mask、大面积半透明叠加、textPath；动画尽量用 transform/opacity（合成器友好），别逐帧改几何属性。
- **静态大图退化为 `<img>`**：浏览器当普通图片光栅化 + 缓存，比挂一棵大 DOM 树便宜。
- **SVGO**（Node 库 + CLI）：删除编辑器元数据/注释/隐藏元素/默认值、路径精度压缩与合并。`svgo icon.svg`，配置写 `svgo.config.mjs`；SVGOMG 是在线 GUI。
  - **v4（2025）重大默认变化**：`removeViewBox` 与 `removeTitle` **移出 preset-default**（保缩放性与无障碍）。
  - **用 v3 及更早版本必须手动禁用 removeViewBox**——viewBox 被删的图标失去固有宽高比、无法响应式缩放，是 SVG 构建链历史第一大坑；removeTitle 同理伤无障碍。
- **工程链路**：设计稿导出 → SVGO 压缩 → sprite 合并（symbol）或组件化（SVGR 转 React 组件 / vite-svg-loader 转 Vue 组件）。

## 五、无障碍

- **`<img>` 方式**：必须给 `alt`；老 Safari/VoiceOver 需补 `role="img"`；装饰图 `alt=""`。
- **inline SVG 标准模式**：

```html
<svg role="img" aria-labelledby="t d" viewBox="0 0 100 100">
  <title id="t">月度销量趋势</title>   <!-- 必须是第一个子元素 -->
  <desc id="d">3 月起持续上升，6 月达到峰值 1200 件。</desc>
  <!-- 图形内容 -->
</svg>
```

- `role="img"` 防止被读屏器读成一堆 group；`aria-labelledby` 指向 title（+desc）比 aria-describedby 兼容更好；没有 `<title>` 时可直接 `aria-label`。
- **纯装饰 SVG**：`aria-hidden="true"`，老 IE/Edge 另加 `focusable="false"` 防 Tab 焦点落入。
- `<title>` 同时提供鼠标 tooltip；`<symbol>` 内置的 title 会随 `<use>` 引用一起带出——sprite 图标的无障碍便利。
- 复杂图表：图层顺序 = 阅读顺序；可用 `role="list"`/`"listitem"` 组织数据项、`role="presentation"` 隐藏纯装饰轴线。

至此六页正文完结。元素、属性、d 命令的全量速查表见[参考](../reference)。
