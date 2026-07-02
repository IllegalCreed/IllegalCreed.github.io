---
layout: doc
outline: [2, 3]
---

# 布局与重排

> 基于 Chromium 现代架构 · 核于 2026-07

## 速查

- **layout（布局）**：从 render tree 根开始遍历，为每个节点算出**几何**——盒尺寸（宽高）+ 坐标（x, y）
- **首次**确定尺寸位置叫 layout，**之后每次重算**叫 **reflow（重排）**（MDN 定义）
- 布局以**视口尺寸**为基：块级元素默认宽 = 父级 100%；旋转/缩放窗口**每次都触发 layout**
- 重排触发：**DOM 增删、内容改变、盒模型样式更新**（width/margin/font-size…）、resize、未定尺寸的图片到达
- 布局是**全局敏感**的：一段文字换行变化会推挤后续所有段落——「牵一发动全身」
- **重排必然引发重绘与重合成**：reflow → repaint → re-composite，代价链最长
- **强制同步布局（forced synchronous layout）**：改样式后立刻读 `offsetWidth` 等几何属性，迫使浏览器**当场**跑布局
- **layout thrashing**：循环里交替「写样式 → 读几何」，每圈强制一次布局——性能杀手
- 解法：**读写分离**——先集中读、再集中写；或把写入挪进 `requestAnimationFrame`
- 页面加载时 20ms 的布局无所谓；**动画/滚动中的布局**必然 jank（MDN）——动画别碰盒模型属性

## 一、layout 在算什么

render tree 告诉浏览器「哪些节点可见、样式是什么」，但**不知道它们多大、在哪**。layout 补上这块：

> 「浏览器从 render tree 的根开始遍历」，「确定所有节点的尺寸与位置，以及页面上每个对象的大小和位置」（MDN）。Chromium 视角（part3）：主线程遍历 DOM 与计算样式，生成带有 **x/y 坐标、边界框尺寸（bounding box sizes）** 的 layout tree。

几个关键输入与规则：

- **视口是地基**：布局「取视口尺寸为基准」自根向下推。块级元素默认宽度 = 父级的 100%，一路继承到 `<body>`；移动端没有 `<meta name="viewport" content="width=device-width">` 时按默认视口（一般 960px）排，这是老页面在手机上缩成一团的原理。
- **盒模型是词汇表**：网页上几乎一切都是盒子，layout 逐盒应用盒模型属性算出占位。
- **替换元素占位**：没声明尺寸的 `<img>`，浏览器先给**占位空间**继续排——图片下载完、真实尺寸已知时，**触发一次 reflow** 重新挤开周围内容（这就是要写 `width`/`height` 或 `aspect-ratio` 防 CLS 的渲染层原因）。

### 1.1 为什么布局天生贵

Chrome part3 的提醒：**哪怕最简单的自上而下块级排版，也要考虑字体大小和换行位置**——它们决定段落的尺寸形状，进而影响下一段的位置。再叠加浮动、`overflow`、书写方向……布局是个**级联依赖**的全局计算：改一处，波及一片。这决定了它在管线里的地位：

```
改几何属性 ──▶ layout ──▶ paint ──▶ composite   （全链重跑，最贵）
改颜色阴影 ──────────────▶ paint ──▶ composite   （跳过 layout）
改 transform/opacity ────────────▶ composite    （最便宜，见下一页）
```

MDN 原文点透代价链：**「reflow 会引发 repaint 和 re-composite」**——重排永远不是单独付费。

## 二、首次 layout 与后续 reflow

MDN 的术语切分很干净：

> 「第一次确定每个节点的尺寸和位置称为 **layout**。对 layout 的后续重新计算称为 **reflow**。」

也就是说 reflow 不是另一种计算，而是**同一套几何计算的再执行**。什么时候再执行？「**任何时候 render tree 被修改**」（MDN CRP）：

| 触发类别 | 典型操作 |
| --- | --- |
| DOM 结构变化 | 增删节点、移动节点、`innerHTML` 重写 |
| 内容变化 | 改文本、图片加载完成（尺寸未声明时） |
| 盒模型样式更新 | `width` / `height` / `padding` / `margin` / `border` / `top` / `left` / `font-size` / `line-height`… |
| 视口变化 | 窗口 resize、设备旋转（**每次都重新 layout**） |
| 伪类/类切换引起几何变化 | `:hover` 加边框、切换影响尺寸的 class |
| **读取几何属性** | 见下节——不改任何东西也能逼出一次布局 |

范围上，引擎会尽量把重排限制在受影响的子树（局部 reflow），但受上文「全局敏感」性质约束，改动越靠上游、影响越大（改 `<html>` 的 `font-size` ≈ 全页重排）。

MDN 对代价的量化感受：**「加载或旋转屏幕时 20ms 的布局延迟没问题，但动画或滚动中的布局会导致 jank」**——布局本身不是罪，**高频布局**才是。结论也直白：「**批量更新，避免对盒模型属性做动画**」。

## 三、强制同步布局：读 `offsetWidth` 为什么贵

正常节奏下，你在 JS 里改样式，浏览器**不会立刻**重排——它把失效标记攒着，等到本帧渲染时机（rAF 之后、绘制之前）统一算一次。这是引擎的批处理优化。

但有一类操作会打断攒批：**读取依赖最新布局的几何属性**。浏览器为了不给你旧值，只能**当场同步执行布局**——这就是**强制同步布局（forced synchronous layout / forced reflow）**：

```js
el.style.width = "300px"; // 写：布局失效，本想攒到帧末再算
console.log(el.offsetHeight); // 读：为了给你准确值，浏览器被迫现在就跑一次 layout
```

常见的「读了就逼布局」的 API（在有待处理的样式改动时）：

- `offsetTop` / `offsetLeft` / `offsetWidth` / `offsetHeight`
- `clientWidth` / `clientHeight` / `scrollTop` / `scrollHeight` 等滚动几何
- `getBoundingClientRect()`、`getComputedStyle()` 读几何相关值
- `focus()`、`scrollIntoView()` 等隐式需要布局的操作

单次强制布局只是「把账提前结」；真正的灾难是在循环里反复结账。

### 3.1 layout thrashing 与读写分离

**layout thrashing（布局抖动）**：循环中交替写样式、读几何，每一圈都触发一次强制同步布局，帧预算瞬间爆掉。

```js
// ❌ 坏：每次循环 读(offsetWidth 逼布局) → 写(置宽度又失效布局) → 下一圈再逼一次
// n 个元素 = n 次强制同步布局
boxes.forEach((box) => {
  box.style.width = container.offsetWidth / 2 + "px";
});

// ✅ 好：读写分离——先集中读一次，再集中写
// 布局只失效一批，帧末统一重算一次
const half = container.offsetWidth / 2; // 读：只逼（至多）一次布局
boxes.forEach((box) => {
  box.style.width = half + "px"; // 写：不再穿插读取
});
```

批处理的一般法则：

1. **帧内先读后写**：所有测量放前面，所有修改放后面。
2. **缓存几何值**：布局没变的前提下，第一次读完存变量，别反复问浏览器。
3. **写入对齐帧**：连续视觉更新放进 `requestAnimationFrame` 回调（本帧渲染前执行，见[帧生命周期](./frame-input)），天然与渲染批次对齐。
4. **动画绕开布局**：位移缩放用 `transform`、显隐用 `opacity`，把工作推给合成器（[下一页](./paint-compositing)展开）。

> DevTools 佐证：Performance 面板里紫色的 Layout 块带红三角警告「Forced reflow is a likely performance bottleneck」，就是在指认强制同步布局。工具用法归前端优化章，这里只给原理。

## 小结

- layout 从 render tree 根向下算**几何**（尺寸 + 坐标），视口为基、盒模型为词汇；首次叫 layout、重算叫 reflow。
- 布局全局敏感（换行牵动全篇）且处在代价链顶端：**reflow → repaint → re-composite**。
- 触发面很宽：DOM 增删、内容/盒模型样式变化、resize/旋转、未定尺寸图片到达。
- 浏览器默认**攒批**重排；读几何属性会**强制同步布局**，循环读写交替 = layout thrashing。
- 药方：读写分离、缓存测量值、写入进 rAF、动画只碰 `transform`/`opacity`。
- 几何定了，下一步把盒子变成像素并搬上屏幕：[绘制与合成](./paint-compositing)。
