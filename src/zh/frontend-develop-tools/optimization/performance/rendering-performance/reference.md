---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 web.dev 渲染性能系列与 MDN（CSS contain / will-change / requestAnimationFrame）官方文档编写，对照 CSS Containment Module Level 2、CSS Will Change Module Level 1

## 速查

- 像素流水线：**JavaScript → Style → Layout → Paint → Composite**
- 帧预算：**60fps ≈ 16.6ms**，开发者实际可用约 **10ms**
- 三级属性：Composite-only（`transform`/`opacity`）→ Paint（`color`/`background`）→ Layout（`width`/`top`/`margin`）
- **reflow 必引发 repaint，repaint 不一定 reflow**
- 合成器属性仅 **`transform`** 与 **`opacity`**（含独立属性 `translate`/`rotate`/`scale`）
- `contain` 速记：**`strict = size layout paint style`**、**`content = layout paint style`**
- `will-change`：最后手段、动态开关、绝不全局常驻
- `requestAnimationFrame`：单参 `DOMHighResTimeStamp`、与刷新率对齐、页面不可见自动暂停
- 强制布局 API：`offsetWidth` / `clientWidth` / `scrollTop` / `getBoundingClientRect` / `getComputedStyle` / `scrollIntoView` / `scrollTo` / `getClientRects`
- 检测工具：DevTools Performance Layers/Paint profiler、Rendering Paint Flashing、Forced Reflow insight、LoAF `forcedStyleAndLayoutDuration`
- 完整说明见 [入门](./getting-started.md) / [核心机制与实践](./guide-line.md)

## 触发属性分类表

按改该属性会触发哪几个流水线阶段分类。

### Layout 触发（最贵，全跑 Layout → Paint → Composite）

| 属性 | 说明 |
| --- | --- |
| `width` / `min-width` / `max-width` | 改宽度 |
| `height` / `min-height` / `max-height` | 改高度 |
| `padding` / `padding-*` | 改内边距 |
| `margin` / `margin-*` | 改外边距 |
| `top` / `right` / `bottom` / `left` | 改定位偏移（`position: absolute/fixed`） |
| `border-width` / `border-*`-width | 改边框宽度 |
| `display` | 改显示类型（如 `block` ↔ `flex`） |
| `position` | 改定位方式 |
| `float` / `clear` | 改浮动 |
| `overflow` / `overflow-x` / `overflow-y` | 改溢出处理（影响滚动条几何） |
| `font-size` / `font-family` / `font-weight` | 改字体（影响文本尺寸） |
| `line-height` | 改行高 |
| `text-align` / `vertical-align` | 影响内联布局 |
| `white-space` / `word-break` / `word-wrap` | 影响文本换行 |
| `list-style` / `list-style-type` | 影响列表项标记几何 |
| `table-layout` | 表格布局算法 |
| `flex` / `flex-*` / `grid` / `grid-*` | 弹性/网格布局参数 |
| `contain: size` | 子元素不再撑开容器 |

### Paint 触发（中等，跑 Paint → Composite，跳过 Layout）

| 属性 | 说明 |
| --- | --- |
| `color` | 文本颜色 |
| `background-color` | 背景色 |
| `background-image` / `background-position` / `background-size` | 背景 |
| `background-repeat` / `background-attachment` | 背景 |
| `border-color` / `border-style` | 边框颜色/样式（不改宽度） |
| `border-radius` | 圆角 |
| `outline` / `outline-color` | 轮廓 |
| `box-shadow` | 阴影 |
| `text-shadow` | 文本阴影 |
| `text-decoration` | 文本装饰 |
| `visibility` | 可见性（保留几何，不引发 reflow） |
| `cursor` | 光标（部分场景） |

### Composite 触发（最廉价，仅 Style → Composite）

| 属性 | 说明 |
| --- | --- |
| **`transform`** | 在合成器线程处理，跳过 Layout+Paint |
| **`opacity`** | 在合成器线程处理，跳过 Layout+Paint |
| `translate` / `rotate` / `scale`（CSS 独立 transform 属性） | 2023 起 Baseline widely available |
| `filter`（部分） | 滤镜，部分浏览器视其为合成器属性 |
| `backdrop-filter` | 部分场景 |
| `perspective` / `perspective-origin` | 3D 变换上下文 |
| `clip-path`（部分场景） | 部分浏览器优化 |

> 注意：`transform` 触发 Composite 是「动画友好路径」的核心，但 `transform: none` ↔ 具体值切换可能涉及层提升/降级。

## CSS `contain` 速记

```css
contain: none | strict | content | [ size | inline-size || layout || style || paint ];
```

| 取值 | 等价展开 | 用途 |
| --- | --- | --- |
| `none` | 无 containment | 默认 |
| `strict` | `size layout paint style` | 全部隔离（**慎用**，含 size 易塌陷） |
| `content` | `layout paint style` | **最常用安全值**，第三方 widget、卡片、列表项 |
| `size` | 仅 size | 容器尺寸与子元素无关；**必须配 `contain-intrinsic-size`** |
| `inline-size` | 仅 inline 方向 size | Containment Level 2 新增；行内尺寸隔离 |
| `layout` | 仅 layout | 子树布局变化不影响外部 |
| `paint` | 仅 paint | 后代不绘制到容器边界框外（离屏可跳过子树绘制） |
| `style` | 仅 style | 隔离计数器与引号作用域 |

**关键性质**：

- `contain: paint` 会创建**新的堆叠上下文**与**新的包含块**（可能改变 `position: fixed` 锚点）
- `contain: layout` 会创建**新的块格式化上下文**
- `contain: strict` 含 `size` → 必须配 `contain-intrinsic-size`

### 配套属性

| 属性 | 说明 |
| --- | --- |
| `content-visibility: auto` | 屏外内容跳过渲染，与 `contain-intrinsic-size` 配合 |
| `content-visibility: visible` | 默认 |
| `content-visibility: hidden` | 类似 `display: none` 但保留渲染状态 |
| `contain-intrinsic-size: <w> <h>` | 给 `contain: size` 的容器预估尺寸，防塌陷 |
| `contain-intrinsic-size: auto <w> <h>` | 自动记住上一次的实际尺寸（更精确） |

## `will-change` 速记

```css
will-change: auto | scroll-position | contents | <custom-ident>;
```

| 取值 | 含义 |
| --- | --- |
| `auto` | 默认，无提示 |
| `scroll-position` | 即将改变滚动位置 |
| `contents` | 即将改变内容 |
| `<custom-ident>` | 如 `transform` / `opacity` / `left,top` |

**禁忌**：

- 不能填 `unset` / `initial` / `inherit` / `will-change` / `auto` / `scroll-position` / `contents` 作为 `<custom-ident>`
- 绝不全局常驻（`* { will-change: transform; }` → 层爆炸）
- 绝不做「预防性」优化（仅在出现真实性能问题后用）

**正确流程**：

1. 监听 `mouseenter` / `focus` → 设 `will-change`
2. 动画结束（`transitionend` / `animationend`）→ 置回 `auto`
3. 给浏览器优化时间（提前一帧以上设置）

## 核心 API

### `requestAnimationFrame`

```ts
declare function requestAnimationFrame(
  callback: (timestamp: DOMHighResTimeStamp) => void
): number;

declare function cancelAnimationFrame(id: number): void;
```

- **`timestamp`**：`DOMHighResTimeStamp`（毫秒，相对 `performance.timeOrigin`），与 `performance.now()` 同基
- **同一帧内多个回调共享同一时间戳**
- **频率对齐显示刷新率**：60Hz → 约 16.6ms / 120Hz → 约 8.3ms / 240Hz → 约 4.16ms
- **页面不可见时自动暂停**

### `getComputedStyle`

```ts
window.getComputedStyle(element: Element, pseudoElt?: string | null): CSSStyleDeclaration;
```

- 查询几何相关属性（如 `height` / `width` / `top` / `margin-top`）会触发强制同步布局
- 查询非几何属性（如 `color` / `background-color`）**不触发**

### 强制布局 API 全清单

| 类型 | API |
| --- | --- |
| `offset*` | `offsetWidth` / `offsetHeight` / `offsetTop` / `offsetLeft` |
| `client*` | `clientWidth` / `clientHeight` / `clientTop` / `clientLeft` |
| `scroll*` | `scrollTop` / `scrollLeft` / `scrollWidth` / `scrollHeight` |
| 几何查询 | `getBoundingClientRect()` / `getClientRects()` |
| 滚动 | `scrollIntoView()` / `scrollTo()` / `scrollBy()` |
| 窗口 | `window.scrollX` / `window.scrollY` / `window.innerHeight` |
| 媒体查询 | `window.matchMedia('(min-width: 100px)').matches`（首次） |
| 焦点 | `element.focus()`（部分场景） |
| 文本 | `getComputedStyle()` 查询几何属性时 |

## 测量与调试工具

### Chrome DevTools

| 面板 | 用途 |
| --- | --- |
| **Performance** → Layers | 查看合成层数量、创建原因 |
| **Performance** → Paint profiler | 单次 Paint 的栅格化耗时 |
| **Performance** → Forced Reflow insight | 定位强制同步布局 |
| **Rendering** → Paint Flashing | 高亮被重绘的区域（针对性优化） |
| **Rendering** → Layer Borders | 看每层边界 |
| **Rendering** → Layout Shift Regions | 看布局偏移区域 |
| **Rendering** → Frame Rendering Stats | 每帧 FPS 与 GPU 内存 |

### Long Animation Frames API (LoAF)

```js
// 字段：forcedStyleAndLayoutDuration（强制样式与布局耗时）
observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    entry.scripts.forEach((script) => {
      console.log(script.forcedStyleAndLayoutDuration);
    });
  }
});
observer.observe({ type: 'long-animation-frame', buffered: true });
```

## 版本与状态

| 特性 | 状态 |
| --- | --- |
| **CSS `will-change`** | CSS Will Change Module Level 1；MDN Baseline widely available since 2020-01；Firefox 31+ / Chrome 36+ / Safari 9.1+ |
| **CSS `contain`** | CSS Containment Module Level 2；Chrome 52+（2016）起支持 size/layout/style/paint/strict/content |
| **CSS `content-visibility`** | Containment Level 2；Chrome 85+（2020）；Firefox 较晚；属进阶用法 |
| **`contain: inline-size`** | Containment Level 2 新增；Chrome 105+ |
| **`requestAnimationFrame`** | HTML Living Standard；所有浏览器长期稳定支持 |
| **CSS 独立 transform 属性** | `translate`/`rotate`/`scale`；Baseline widely available since 2023 |
| **`transform`/`opacity` 作为合成器属性** | 事实行为稳定（web.dev compositor-only 文章原文 2015 版，2023-12 仍重申为当前 Chromium 行为） |
| **`translateZ(0)` hack** | 用于不支持 `will-change` 的旧浏览器；现代浏览器优先用 `will-change` |

> 注意：web.dev 部分 compositor-only 文章原文为 2015 版，但 `transform`/`opacity` 的核心结论至今仍是当前 Chromium 行为（web.dev rendering-performance 总纲于 2023-12 重申）。

## 官方资源

- web.dev 渲染性能总纲：[https://web.dev/articles/rendering-performance](https://web.dev/articles/rendering-performance)
- web.dev 避免大型复杂布局与布局抖动：[https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing)
- web.dev 坚持合成器属性并管理层数：[https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count](https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count)
- MDN CSS `contain`：[https://developer.mozilla.org/en-US/docs/Web/CSS/contain](https://developer.mozilla.org/en-US/docs/Web/CSS/contain)
- MDN CSS `will-change`：[https://developer.mozilla.org/en-US/docs/Web/CSS/will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)
- MDN `requestAnimationFrame`：[https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
- MDN `content-visibility`：[https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility)
- W3C CSS Containment Level 2：[https://www.w3.org/TR/css-contain-2/](https://www.w3.org/TR/css-contain-2/)
- W3C CSS Will Change Level 1：[https://www.w3.org/TR/css-will-change-1/](https://www.w3.org/TR/css-will-change-1/)
- Paul Irish 强制布局清单：[https://gist.github.com/paulirish/5d52fb081b3570c81e3a](https://gist.github.com/paulirish/5d52fb081b3570c81e3a)
- Chrome DevTools Rendering：[https://developer.chrome.com/docs/devtools/reference#rendering](https://developer.chrome.com/docs/devtools/reference#rendering)
