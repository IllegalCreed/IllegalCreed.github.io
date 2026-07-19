---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 web.dev 渲染性能系列（rendering-performance / avoid-large-complex-layouts-and-layout-thrashing / stick-to-compositor-only-properties）与 MDN（CSS contain / will-change）官方文档编写，对照 CSS Containment Module Level 2、CSS Will Change Module Level 1

## 速查

- **像素流水线五阶段**：`JavaScript → Style → Layout → Paint → Composite`（web.dev 总纲）
- **帧预算**：60fps ≈ **16.6ms/帧**；扣浏览器自身开销后开发者实际可用约 **10ms**
- **三个等级的属性代价**：
  - 仅 Composite（最廉价）：**`transform` / `opacity`**（含独立属性 `translate`/`rotate`/`scale`）
  - Paint→Composite（中等）：`color` / `background` / `box-shadow` / `border-radius`
  - Layout→Paint→Composite（最贵）：`width` / `height` / `top` / `left` / `margin` / `padding` / `display` / `position` / `flex`
- **reflow 必引发 repaint，repaint 不一定 reflow**：改 `color` 只 repaint，改 `width` 既 reflow 又 repaint
- **强制同步布局**：JS 改样式后立即读几何属性（`offsetWidth`/`getBoundingClientRect`/`scrollTop` 等）→ 浏览器被迫立即算 Layout
- **布局抖动**：单帧内多次读写交替，每次读都触发一次强制布局；正解是 **批量读、再批量写**（read-then-write）
- **合成器友好属性**：`transform`/`opacity` 在合成器线程跑，主线程繁忙时仍流畅
- **`will-change` 用法**：最后手段、脚本动态开关（hover 设、animationEnd 置 `auto`），绝不全局常驻
- **`contain` 速记**：`strict = size layout paint style`、`content = layout paint style`
- **`requestAnimationFrame`**：单参 `DOMHighResTimeStamp`、与刷新率对齐、页面不可见自动暂停

## 渲染性能是什么

渲染性能研究的是**已加载的页面在运行时单帧内的开销**——从 JS 改了 DOM 或样式，到像素真正出现在屏幕上，浏览器要做多少工作。它的核心问题是：

> 怎么把每一帧的工作量压进刷新率允许的预算内？

- **60Hz 屏幕**：约 **16.6ms/帧**，扣掉浏览器自身开销（合成、输入处理、GC），开发者实际可用约 **10ms**
- **120Hz 高刷屏**：约 8.3ms/帧；**240Hz**：约 4.16ms/帧——高刷放大了任何低效方案
- **超出预算的后果**：丢帧（jank）、视觉卡顿、滚动掉帧、交互延迟（INP 受影响）

> 渲染性能 ≠ 加载性能。资源压缩、代码分割、缓存、TTFB 属加载性能；本章只讲运行时已加载后的单帧机制。

## 像素流水线五阶段

web.dev 总纲的**心智模型**——每帧浏览器要走的五个步骤：

```
JavaScript  →  Style  →  Layout  →  Paint  →  Composite
   ↓            ↓          ↓          ↓          ↓
改 DOM/样式   匹配选择器  计算几何   栅格化像素  合成图层上屏
```

| 阶段 | 工作 | 跳过的代价 |
| --- | --- | --- |
| **JavaScript** | 跑 JS 改 DOM、属性、样式 | 一般无法跳过（除非用声明式 CSS 动画，让浏览器在合成器线程跑） |
| **Style** | 重新计算每个元素的匹配规则 | 一般无法跳过 |
| **Layout**（reflow） | 计算每个元素的几何（位置、大小） | 改 `transform`/`opacity` 可跳过 |
| **Paint**（repaint） | 栅格化填充每个像素 | 改 `transform`/`opacity` 可跳过 |
| **Composite** | 把各图层合成上屏 | 必走 |

**关键性质**：

1. **整条流水线是连锁的**——Layout 必引发 Paint，Paint 必引发 Composite；但反过来不成立
2. **某些阶段可整段跳过**——动画只改 `transform`/`opacity` 时，跳过 Layout 和 Paint，只走 Style→Composite，是最廉价路径
3. **Layout 通常是全文档的**——改一个元素的 `width` 可能触发整页重排，DOM 越大越贵

## 三级属性代价

按触发的流水线阶段，CSS 属性分三级：

| 等级 | 触发阶段 | 典型属性 |
| --- | --- | --- |
| **Composite only**（最廉价） | Style → Composite | `transform` / `opacity` / `filter`（部分） / 独立属性 `translate`·`rotate`·`scale` |
| **Paint trigger**（中等） | Style → Paint → Composite | `color` / `background` / `box-shadow` / `border-radius` / `outline` |
| **Layout trigger**（最贵） | Style → Layout → Paint → Composite | `width` / `height` / `top` / `left` / `margin` / `padding` / `display` / `position` / `float` / `flex` / `font-size` |

**实战推论**：

- 动画驱动 `left` → 改用 `transform: translateX()`
- 动画驱动 `width` → 改用 `transform: scaleX()`（或 `clip-path`）
- 动画驱动 `box-shadow` → 改用 `filter: drop-shadow()`（部分场景）或预合成层

## reflow vs repaint（Layout vs Paint）

| 概念 | 别名 | 触发条件 | 关系 |
| --- | --- | --- | --- |
| **Layout** | reflow / layout | 几何属性改变（`width`/`top`/`display` 等） | **必然引发 Paint** |
| **Paint** | repaint / draw | 视觉属性改变（`color`/`background` 等） | **不一定引发 Layout** |

**口诀**：reflow 必引发 repaint，但 repaint 不一定 reflow。

举例：

- 改 `color` → 只 Paint（跳过 Layout）
- 改 `width` → Layout + Paint（无法跳过）
- 改 `transform` → 都跳过，只 Composite

## 16.6ms 预算去哪了

一帧 16.6ms 的大致分配（60Hz）：

| 段 | 工作 | 估算 |
| --- | --- | --- |
| Input handling | 处理用户输入回调 | ~1ms |
| JS | 跑你的脚本 | ~5ms（建议上限） |
| Style | 重算匹配规则 | ~1ms |
| Layout | 重排 | ~3ms |
| Paint | 栅格化 | ~3ms |
| Composite | 合成上屏 | ~1ms |
| 浏览器自身开销 | GPU 同步、调度等 | ~2ms |

> 实际工程中目标是 **JS ≤ 5ms，Layout + Paint ≤ 5ms**，留出余量给浏览器自身。

## 与相邻主题的边界

| 相邻主题 | 区别 |
| --- | --- |
| **浏览器渲染原理 / Critical Rendering Path** | 那是首屏加载（DOM/CSSOM 构建、解析、首次绘制），本章是运行时单帧 |
| **Core Web Vitals（LCP/INP/CLS）** | 那是度量层（INP 反映交互延迟），本章是机制层（怎么不触发昂贵的流水线） |
| **CSS 动画/过渡** | 那讲 `@keyframes`/`transition` 语法与缓动，本章只把 `transform`/`opacity` 当「合成器友好属性」讲为何它们快 |
| **Web 性能加载优化** | 那是资源压缩、缓存、代码分割、TTFB，与渲染流水线无关 |
| **虚拟列表/大量 DOM 优化** | 那是 DOM 规模治理（虽与 layout 成本相关，但更偏框架实现） |

## 下一步

- [核心机制与实践](./guide-line.md)：reflow/repaint 详解、强制同步布局与布局抖动规避、合成层与 `transform`/`opacity`、`will-change` 正确用法、CSS containment、`requestAnimationFrame`、反模式集合
- [参考](./reference.md)：触发属性分类完整表、`contain` 速记、API 列表、版本与官方资源
