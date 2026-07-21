---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 web.dev / MDN 官方文档（developer.mozilla.org / web.dev/learn/css）+ W3C CSS View Transitions Module Level 1/2 + WCAG 2.2 编写

## 速查

- **同文档 VT**：`document.startViewTransition(updateCallback | {update, types})` → `ViewTransition { updateCallbackDone, ready, finished, skipTransition(), types }`
- **跨文档 VT**：CSS `@view-transition { navigation: auto; types: <ident># }`，硬约束 = 同源 + 无跨源重定向 + 用户交互触发 push/replace
- **5 伪元素**：`::view-transition` / `::view-transition-group(name)` / `::view-transition-image-pair(name)` / `::view-transition-old(name)` / `::view-transition-new(name)`
- **2 伪类**：`:active-view-transition` / `:active-view-transition-type(<ident>)`
- **3 VT 属性**：`view-transition-name` / `view-transition-class` / `view-transition-scope`（+ `match-element` 关键字）
- **CSS transition**：`transition: <property> <duration> <timing-function> <delay>`，`transition-behavior: allow-discrete`
- **CSS animation**：`@keyframes` + `animation: <name> <duration> <timing> <delay> <count> <direction> <fill> <play-state>`
- **合成器优先**：transform / opacity / filter；禁用 width / height / top / margin
- **WCAG**：2.3.3 (AAA) 交互动效 + 2.2.2 (A) 自动播放
- **版本**：同文档 VT **Baseline Newly available**（2025-10-14）；跨文档 VT **Limited availability**（Chrome 126+）；prefers-reduced-motion Baseline Widely available（2020-01）
- 完整说明见 [入门](./getting-started.md) / [核心 API 与模式](./guide-line.md)

## View Transitions API 完整表

### 同文档（SPA）

| API / 属性 | 作用 |
| --- | --- |
| `document.startViewTransition(updateCallback)` | 传回调，抓旧快照 → 回调内更新 DOM → 抓新快照 → 默认 cross-fade |
| `document.startViewTransition({update, types})` | 带 `types` 数组的调用，配合 `:active-view-transition-type()` 实现方向感 |
| `ViewTransition.updateCallbackDone` | Promise：updateCallback resolve 时 resolve |
| `ViewTransition.ready` | Promise：伪元素已挂、动画即将开始 |
| `ViewTransition.finished` | Promise：动画彻底结束、overlay 移除 |
| `ViewTransition.skipTransition()` | 跳到末态，不播完动画 |
| `ViewTransition.types` | `ViewTransitionTypeSet`，运行时增删 type |

### 跨文档（MPA）

| CSS / 事件 | 作用 |
| --- | --- |
| `@view-transition { navigation: auto }` | 同源、用户交互触发的 traverse/push/replace 自动接管 |
| `@view-transition { types: <ident># }` | 声明本页参与的默认 type |
| `Window: pageswap` / `PageSwapEvent` | 在被卸载文档上触发，携带即将开始的 ViewTransition |
| `Window: pagereveal` / `PageRevealEvent` | 在被显示文档上触发，可修改 type / names |
| `<link rel="expect">` | 声明关键内容让浏览器等稳定首绘再抓新快照 |

### 跨文档 VT 硬约束

| 约束 | 细节 |
| --- | --- |
| 同源 | source 与 target 同 scheme + host + port |
| 无跨源重定向 | 中间跳到不同源即失效 |
| navigationType | `traverse`（前进/后退）/ `push` / `replace`；reload / 表单 POST 不触发 |
| 用户交互触发 | push/replace 必须用户点击链接，程序化 `location.href =` 可能不触发 |
| 双边声明 | 当前文档与目标文档都必须 `navigation: auto` |

## VT 伪元素与伪类表

### 伪元素（5 个）

| 伪元素 | 表示 |
| --- | --- |
| `::view-transition` | overlay 根，固定铺满视口 |
| `::view-transition-group(name)` | 命名元素的容器，承担位置 / 尺寸 / 变换动画 |
| `::view-transition-image-pair(name)` | old + new 的堆叠容器 |
| `::view-transition-old(name)` | **旧视图的静态快照**（定格截图） |
| `::view-transition-new(name)` | **新视图的实时表示**（实时渲染，VT 期间通常截图） |

### 伪类（2 个）

| 伪类 | 匹配时机 |
| --- | --- |
| `:active-view-transition` | 当前文档正在 VT 转场期间 |
| `:active-view-transition-type(<ident>)` | 转场进行中且 `types` 含指定 ident |

## VT 自定义属性表

| 属性 | 取值 | 用途 |
| --- | --- | --- |
| `view-transition-name` | `<custom-ident>` / `none` / `match-element` | 给元素命名脱离 root 独立 morph；**前后各恰好一个** |
| `view-transition-class` | `<ident>+` | 给一组快照批量加 class 统一样式化 |
| `view-transition-scope` | `<custom-ident>` / `none` | 把命名发现隔离到子树，并发 / 嵌套转场用 |
| `view-transition-name: match-element` | keyword | 用元素自身标识自动生成快照名 |

## CSS Transitions 完整表

| 属性 | 取值 |
| --- | --- |
| `transition`（简写） | `<property> <duration> <timing-function> <delay>` |
| `transition-property` | `none` / `<single-transition-property>#` / `all` |
| `transition-duration` | `<time>#` |
| `transition-timing-function` | `linear` / `ease` / `ease-in` / `ease-out` / `ease-in-out` / `cubic-bezier(...)` / `step-*` |
| `transition-delay` | `<time>#`（负值 = 中途开始） |
| `transition-behavior` | `normal` / `allow-discrete`（让 display 等可插值） |

> 写在元素**基础规则**上，触发态（`:hover` / class 切换）只改属性值。`transition-behavior: allow-discrete` 配合 `@starting-style` 实现 `display: none ↔ block` 的过渡。

## CSS Animations 完整表

| 属性 | 取值 |
| --- | --- |
| `animation`（简写） | `<name> <duration> <timing> <delay> <count> <direction> <fill> <play-state>` |
| `animation-name` | `<single-animation-name>#` |
| `animation-duration` | `<time>#` |
| `animation-timing-function` | 同 transition |
| `animation-delay` | `<time>#` |
| `animation-iteration-count` | `<number>` / `infinite` |
| `animation-direction` | `normal` / `reverse` / `alternate` / `alternate-reverse` |
| `animation-fill-mode` | `none` / `forwards` / `backwards` / `both` |
| `animation-play-state` | `running` / `paused` |
| `animation-timeline` | `auto`（默认）/ `scroll()` / `view()` —— 后者属滚动驱动动画章 |

```css
@keyframes <name> {
  /* from / to 或 0% / 100% 任意百分比关键帧 */
  0% { opacity: 0; transform: translateY(10px); }
  50% { opacity: 0.5; }
  100% { opacity: 1; transform: translateY(0); }
}
```

## 合成器属性 vs layout 属性

| 类别 | 属性 | 性能 |
| --- | --- | --- |
| **合成器（推荐）** | `transform` / `opacity` / `filter` | 仅触发 compositor，60fps 稳定 |
| **paint 属性（次选）** | `color` / `background-color` / `box-shadow` | 触发 paint 不触发 layout，中等开销 |
| **layout 属性（禁用）** | `width` / `height` / `top` / `left` / `margin` / `padding` | 每帧 reflow，主线程阻塞掉帧 |

## prefers-reduced-motion 速查

| 项 | 取值 / 说明 |
| --- | --- |
| **规范** | Media Queries Level 5 |
| **Baseline** | Widely available（2020-01） |
| **值** | `reduce`（已开启减少动效）/ `no-preference`（默认） |
| **OS 入口** | Windows：辅助功能 → 视觉效果 → 动画；macOS：辅助功能 → 显示 → 减少动效；iOS / Android：辅助功能 → 移除动画 |
| **WCAG 2.3.3** | Level AAA，交互触发的非必要动效可关闭，例外 = `essential` |
| **WCAG 2.2.2** | Level A，自动播放动效需 Pause/Stop/Hide，5 秒以下自动结束豁免 |

## 版本状态

| 特性 | Baseline 状态 | 备注 |
| --- | --- | --- |
| **同文档 VT** | **Newly available**（2025-10-14） | Firefox 144 推动；Chrome 111 / Safari 18 起；Interop 2025 focus area |
| `view-transition-name` | Newly available | 随同文档 VT |
| `view-transition-class` | Newly available（2025-10-14） | 批量样式化 |
| `view-transition-name: match-element` | Newly available（2025-10-14） | 元素自身标识 |
| `:active-view-transition` / `-type()` | Newly available | 方向感伪类 |
| `view-transition-scope` | Newly available（2025-10-14） | 子树隔离 |
| **跨文档 VT** | **Limited availability** | 仅 Chrome 126+；Firefox / Safari 部分或未支持 |
| `prefers-reduced-motion` | Widely available（2020-01） | Media Queries Level 5 |
| CSS Transitions / Animations | Widely available | 成熟特性 |

### 规范全景

- **CSS View Transitions Module Level 1**（同文档，Candidate Recommendation）
- **CSS View Transitions Module Level 2**（跨文档，Working Draft，进行中）
- **WCAG 2.2**（2023-10 发布）—— 收录 2.3.3 Animation from Interactions (AAA)；2.2.2 Pause Stop Hide (A) 自 WCAG 2.0

## 官方资源

- MDN — View Transition API：[https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- MDN — @view-transition：[https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@view-transition](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@view-transition)
- MDN — prefers-reduced-motion：[https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- web.dev — View transitions for SPAs：[https://web.dev/learn/css/view-transitions-spas](https://web.dev/learn/css/view-transitions-spas)
- web.dev Blog — Same-document view transitions Baseline：[https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available](https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available)
- Chrome for Developers — Smooth transitions with the View Transition API：[https://developer.chrome.com/docs/web-platform/view-transitions](https://developer.chrome.com/docs/web-platform/view-transitions)
- W3C WAI — WCAG 2.3.3 Animation from Interactions：[https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
- W3C csswg-drafts — css-view-transitions：[https://github.com/w3c/csswg-drafts/tree/main/css-view-transitions](https://github.com/w3c/csswg-drafts/tree/main/css-view-transitions)
