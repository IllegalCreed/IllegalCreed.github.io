---
layout: doc
---

# 渲染性能

渲染性能（Rendering Performance）研究的是页面**已加载之后**，单帧从代码触发到像素上屏的全过程，目标是把每一帧都压进 **60fps ≈ 16.6ms** 的预算内（扣掉浏览器自身开销后，开发者实际可用约 **10ms**）。它的核心心智模型是 web.dev 的**像素流水线五阶段**——`JavaScript → Style → Layout → Paint → Composite`：JS 改了 DOM/样式，浏览器重新计算样式（Style），如有几何变化就重排（Layout/reflow），再栅格化填充像素（Paint/repaint），最后合成各图层上屏（Composite）。理解这条流水线就能精准判断每个 CSS 属性、每段 JS 的代价：改 `transform`/`opacity` 只走 Style→Composite（最廉价），改 `color`/`background` 多走一步 Paint，改 `width`/`top`/`margin` 则连 Layout 也要重算（最贵）。

围绕这条流水线，渲染性能工程主要解决四类问题：**避免昂贵的流水线步骤**（用合成器友好属性代替几何属性动画）、**避免强制同步布局与布局抖动**（不在改样式后立即读几何属性、循环里严格遵循 read-then-write）、**克制使用层提升**（`will-change` 与 `translateZ(0)` 当作最后手段并动态开关，防层爆炸）、**用 CSS containment 隔离子树**（`contain: content/paint` 把 reflow/repaint 限定在 widget 内部）。配套工具链是 `requestAnimationFrame`（与刷新率对齐、页面不可见时自动暂停）、CSS `contain`/`will-change`、CSS 独立 transform 属性（`translate`/`rotate`/`scale`），以及 Chrome DevTools 的 Performance 面板 Layers/Paint profiler、Rendering 面板 Paint Flashing 与 Forced Reflow insight。本章只讲运行时单帧机制；加载性能（代码分割、资源压缩、缓存）与度量层（Core Web Vitals 的 LCP/INP/CLS 数值定义）属他章。

## 评价

**优点**

- **思维模型统一**：像素流水线五阶段适用所有运行时性能问题，从动画卡顿到滚动掉帧都用同一套语言解释
- **优先级清晰**：合成器属性 > 仅 Paint > 触发 Layout，按属性表就能预判代价，无需猜测
- **工具链成熟**：DevTools Layers/Paint profiler、Paint Flashing、LoAF API 把每帧耗时拆解到具体阶段和属性
- **声明式优化路径**：CSS `contain`、`will-change`、`content-visibility` 让浏览器自动跳过屏外或独立子树的工作
- **跨设备一致**：合成器线程在主线程繁忙时仍能跑，移动端低 CPU 场景下尤其关键

**缺点**

- **概念易混淆**：reflow/repaint、layout/paint、forced sync layout/layout thrashing 多套术语并存，初学者难分
- **`will-change` 滥用副作用大**：全局常驻会层爆炸、长期占内存，新手常误用为「预防性优化」
- **`contain` 有视觉/语义陷阱**：`contain: size/strict` 不配 `contain-intrinsic-size` 会让容器塌陷
- **高刷屏放大问题**：120/240Hz 下 16.6ms 预算降到 4.16/8.33ms，原先可接受的方案会暴露
- **跨浏览器实现差异**：合成层创建时机、`contain` 支持进度（content-visibility 较新）各浏览器不齐

## 文档地址

- [web.dev · 渲染性能总纲](https://web.dev/articles/rendering-performance)
- [web.dev · 避免大型复杂布局与布局抖动](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing)
- [web.dev · 坚持合成器属性并管理层数](https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count)
- [MDN · CSS contain](https://developer.mozilla.org/en-US/docs/Web/CSS/contain)
- [MDN · CSS will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)

## GitHub地址

[GoogleChromeLabs/containment (参考实现)](https://github.com/GoogleChromeLabs/containment) · [W3C CSS Containment Module Level 2](https://www.w3.org/TR/css-contain-2/) · [W3C CSS Will Change Module Level 1](https://www.w3.org/TR/css-will-change-1/)

## 幻灯片地址

<a href="/SlideStack/rendering-performance-slide/" target="_blank">渲染性能</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=677" target="_blank" rel="noopener noreferrer">渲染性能 测试题</a>

> 待回填：测试题 `category` 参数（题库 `stem` 含「渲染性能：」前缀的题目在导入生产库后会获得 group 内的 `categoryId`，部署上线时需把此处 `PENDING` 替换为真实 ID）。
