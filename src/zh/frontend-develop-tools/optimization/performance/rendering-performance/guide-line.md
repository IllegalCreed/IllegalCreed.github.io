---
layout: doc
outline: [2, 3]
---

# 核心机制与实践

> 基于 web.dev 渲染性能系列（rendering-performance / avoid-large-complex-layouts-and-layout-thrashing / stick-to-compositor-only-properties-and-manage-layer-count）与 MDN（CSS contain / will-change）官方文档编写

## 速查

- **reflow（Layout）**：几何属性改变触发，**必然引发 repaint**
- **repaint（Paint）**：视觉属性改变触发，**不一定引发 reflow**
- **强制同步布局**成因：JS 改样式后立即读几何属性（`offsetWidth` / `getBoundingClientRect` / `scrollTop` / `clientWidth` / `scrollIntoView` / `scrollTo` / `getClientRects` / `window.getComputedStyle` / `force layout` 全清单）
- **布局抖动（layout thrashing）**：单帧/单任务内多次 read-write-read-write 交替，每次 read 触发一次强制布局——典型即循环里读写交替
- **规避模式**：**read-then-write**——批量读、再批量写
- **合成器属性**：`transform` / `opacity` 在合成器线程处理，跳过 Layout+Paint，动画首选
- **`will-change`**：最后手段、脚本动态开关（hover 设、animationEnd/transitionEnd 置 `auto`）、绝不全局常驻、需提前给浏览器优化时间
- **`translateZ(0)` hack**：不支持 `will-change` 的旧浏览器强制创建合成层
- **`contain` 速记**：`strict = size layout paint style`、`content = layout paint style`、`paint` 限制子树绘制范围、`size` 必须配 `contain-intrinsic-size`
- **`requestAnimationFrame`**：与刷新率对齐、单参 `DOMHighResTimeStamp`、同帧多个回调共享时间戳、页面不可见时浏览器自动暂停
- **层爆炸**：每个合成层都要把纹理上传 GPU，消耗内存与带宽，低端机反而更慢

## reflow 与 repaint 深度

### 触发 reflow 的常见操作

| 类型 | 操作 |
| --- | --- |
| **DOM 增删** | `appendChild` / `removeChild` / `insertBefore` / `replaceChild` |
| **几何属性改变** | `width` / `height` / `padding` / `margin` / `top` / `left` / `right` / `bottom` / `border-width` |
| **布局属性改变** | `display` / `position` / `float` / `clear` / `flex` / `grid` / `table-layout` |
| **文本相关** | `font-size` / `font-family` / `font-weight` / `line-height` / `text-align` / `white-space` / `word-break` |
| **读取几何 API** | `offsetWidth` / `offsetHeight` / `clientWidth` / `clientHeight` / `scrollTop` / `scrollLeft` / `scrollHeight` / `getBoundingClientRect()` / `getClientRects()` / `scrollIntoView()` / `scrollTo()` / `window.getComputedStyle()` |
| **窗口/容器尺寸** | `window.resize` / 改容器 `width` |
| **类切换** | `classList.add/remove` 改了影响几何的样式 |

### 触发 repaint 的常见操作（不引发 reflow）

- 改 `color` / `background-color` / `background-image`
- 改 `box-shadow` / `text-shadow`
- 改 `border-radius` / `outline` / `outline-color`
- 改 `visibility`（layout 不变，但需重画）
- 改 `text-decoration`

> 注意：`visibility: hidden` 不引发 reflow（保留几何），但 `display: none` 引发 reflow（移出渲染树）。

## 强制同步布局（forced synchronous layout）

### 成因

正常情况下，浏览器把一帧的 DOM 修改攒到 Style 阶段一起处理，避免反复算布局。但**改完样式后立即读取几何属性**会让浏览器被迫**立即同步算布局**才能返回值：

```js
// 反模式
element.classList.add('big');            // 改样式
console.log(element.offsetHeight);       // 立即读几何 → 强制同步布局
```

浏览器逻辑：要返回最新的 `offsetHeight`，必须先把刚才的 `big` 样式应用并算出新的几何，于是这一帧的 Layout 阶段被提前到 JS 执行中。

### 强制布局的几何 API 全清单（高频踩坑）

下面这些读取会**强制浏览器立即算布局**（web.dev / Paul Irish 经典清单）：

- `elem.offset*`（`offsetWidth` / `offsetHeight` / `offsetTop` / `offsetLeft`）
- `elem.client*`（`clientWidth` / `clientHeight` / `clientTop` / `clientLeft`）
- `elem.scroll*`（`scrollTop` / `scrollLeft` / `scrollWidth` / `scrollHeight`）
- `elem.getBoundingClientRect()`
- `elem.getClientRects()`
- `window.getComputedStyle()`（**只在你查询几何相关属性时**才触发；查 `color` 不触发）
- `window.scrollX` / `window.scrollY`
- `elem.scrollIntoView()` / `elem.scrollTo()` / `elem.scrollBy()`
- `elem.focus()`（部分场景）
- `window.matchMedia('(min-width: ...)').matches` 的初次查询

> 检测：Chrome DevTools Performance 面板的 **Forced Reflow insight**、Rendering 面板的 **Layout Shift Regions**，以及 Long Animation Frames API (LoAF) 的 `forcedStyleAndLayoutDuration` 字段。

## 布局抖动（layout thrashing）

**布局抖动 = 单帧/单任务内多次 read-write-read-write 交替**，每次 read 都触发一次强制同步布局。

### 经典反模式

```js
// 反模式：循环里读写交替
const items = document.querySelectorAll('.item');
for (let i = 0; i < items.length; i++) {
  items[i].style.width = container.offsetWidth + 'px'; // 读 → 写 → 读 → 写 …
}
```

每次循环：

1. 读 `container.offsetWidth` → 触发强制布局（因前一次写入了 `items[i-1].style.width`）
2. 写 `items[i].style.width`
3. 下一次循环又读 `offsetWidth` → 又触发

N 个元素 → N 次强制同步布局，性能从 O(N) 退化到 O(N²)。

### 正解：read-then-write（批量读、再批量写）

```js
// 正解：先把所有读取挪到写入之前
const items = document.querySelectorAll('.item');
const width = container.offsetWidth;                  // 一次性读
for (let i = 0; i < items.length; i++) {
  items[i].style.width = width + 'px';                // 只写不读
}
```

或者用 `FastDOM` 模式：把读放进 `measure` 队列、写放进 `mutate` 队列，浏览器交替执行。

## 合成层与合成器属性

### 为什么 `transform`/`opacity` 这么快

**只有 `transform` 和 `opacity` 两个 CSS 属性**能在合成器线程（compositor thread）独立处理——改它们只走 Style → Composite，**完全跳过 Layout 和 Paint**：

```
改 transform/opacity:    Style → Composite           （合成器线程，~1ms）
改 color/background:     Style → Paint → Composite   （主线程，含栅格化）
改 width/top/margin:     Style → Layout → Paint → Composite（最贵）
```

**关键性质**：

- **合成器线程独立**：主线程在跑 JS 时，合成器线程仍能继续动画，**不会卡顿**
- **不占主线程预算**：动画走 `transform` 时主线程可以处理其他交互
- **CSS 独立 transform 属性**（`translate` / `rotate` / `scale`，2023 起 Baseline widely available）：是 `transform` 简写的细分替代，可分别动画化，同样属合成器友好

### 合成层提升

把元素提升到自己的合成层（composited layer）后，它的 transform/opacity 动画就完全在合成器线程跑。提升方式：

| 方式 | 说明 |
| --- | --- |
| `will-change: transform` | **现代推荐**：明确告诉浏览器即将变化，让它提前优化（创建合成层/堆叠上下文） |
| `transform: translateZ(0)` / `translate3d(0,0,0)` | **旧浏览器 hack**：强制创建合成层（在 `will-change` 不支持时用） |
| 3D 变换、`position: fixed` + will-change、`<video>` 等自带层 | 浏览器自动提升 |

### 层爆炸（layer explosion）

**每个合成层都要把纹理上传 GPU**，消耗内存与 CPU↔GPU 带宽。如果提升过多元素：

```css
/* 反模式 */
* {
  will-change: transform;
  transform: translateZ(0);
}
```

- 每个 `<div>` 都建合成层 → 纹理占满 GPU 内存
- 上传带宽打满 → 低端设备严重掉帧
- 修复：**只对确实要动画的元素提升**

## `will-change` 正确用法

MDN 官方建议：

### 1. 作为最后手段

> "If you create too many layers, you will be wasting GPU memory and bandwidth managing them."

只用 `transform`/`opacity` 动画也卡时才上 `will-change`；不要做「预防性」优化。

### 2. 用脚本动态开关

```js
// hover 时设
element.addEventListener('mouseenter', () => {
  element.style.willChange = 'transform';
});
// 动画结束后置回 auto
element.addEventListener('transitionend', () => {
  element.style.willChange = 'auto';
});
```

### 3. 给浏览器优化时间

`will-change` 应在**变化发生之前**设置，让浏览器有时间分配资源。如果同步设置同步触发，等于没设。

### 4. 绝不全局常驻

```css
/* 反模式 */
* { will-change: transform; }
.sidebar { will-change: transform; } /* 一直挂着不回收 */
```

后果：浏览器长期持有优化资源/层，浪费内存，甚至提前创建堆叠上下文影响视觉。

### 5. 取值清单

`will-change: auto | scroll-position | contents | <custom-ident>`

- `auto`：默认，无提示
- `scroll-position`：即将改变滚动位置
- `contents`：即将改变内容
- `<custom-ident>`：如 `transform` / `opacity` / `left,top` —— **不能填** `unset` / `initial` / `inherit` / `will-change` / `auto` / `scroll-position` / `contents` 这些保留字

## CSS containment（`contain`）

CSS Containment Module Level 2 引入，**把 DOM 子树与外部隔离**，让浏览器可以跳过被隔离子树的工作。

### 取值

```css
contain: none | strict | content | [ size | inline-size || layout || style || paint ];
```

### 速记展开

| 简写 | 等价展开 |
| --- | --- |
| `strict` | `size layout paint style` |
| `content` | `layout paint style` |
| `paint` | 仅 paint |
| `layout` | 仅 layout |
| `size` | 仅 size |
| `style` | 仅 style（计数器、引号等作用域） |

### 各值的含义

| 维度 | 含义 | 性能来源 |
| --- | --- | --- |
| **`size`** | 容器的尺寸**与子元素无关**，浏览器无需为子元素算尺寸 | 离屏 / 异步加载时容器尺寸稳定——**但子元素不再撑开容器**，必须配 `contain-intrinsic-size` 否则塌陷 |
| **`layout`** | 子树的布局变化**不影响外部**，外部布局变化也不影响内部 | 外部 reflow 不递归子树 |
| **`paint`** | 后代**不会绘制到容器边界框外** | 离屏时浏览器**可直接跳过整个子树的 Paint** |
| **`style`** | 隔离计数器与引号作用域 | 防止计数器跨子树泄漏 |

### 典型用法

```css
/* 第三方 widget、卡片、列表项 */
.card {
  contain: content; /* = layout paint style，最常用的安全值 */
}

/* 屏外列表/section 跳过渲染（离屏时浏览器跳过子树绘制） */
.offscreen-section {
  contain: paint;
}

/* 长列表虚拟化 */
.scroll-item {
  content-visibility: auto;            /* 跳过屏外内容渲染 */
  contain-intrinsic-size: 0 200px;      /* 配合给出尺寸防塌陷 */
}
```

### 坑

- **`contain: size` 不配 `contain-intrinsic-size`** → 容器尺寸塌陷（子元素不再撑开容器）
- **`contain: strict` 含 size** → 同样的塌陷风险，慎用
- **`contain: paint` 会创建新的堆叠上下文与包含块** → 可能改变 `position: fixed` 的定位锚点

## `requestAnimationFrame`（rAF）

### 为什么不用 `setTimeout`/`setInterval`

| 方式 | 问题 |
| --- | --- |
| `setTimeout(fn, 16)` | **不与刷新率同步**，回调可能落在两帧之间丢帧 |
| `setInterval(fn, 16)` | 同上，且会堆积（页面被切到后台仍跑、浪费电） |
| `requestAnimationFrame` | **对齐显示刷新率**（60/120/240Hz），**页面不可见时浏览器自动暂停** |

### API 签名

```ts
// 调度：在下一次重绘前调用 callback，返回 id 供取消
const id = requestAnimationFrame((timestamp: DOMHighResTimeStamp) => {
  // timestamp：该帧回调开始时刻（毫秒，相对 timeOrigin）
  // 同一帧内多个 rAF 回调共享同一个 timestamp
});
cancelAnimationFrame(id); // 取消
```

**关键性质**：

- **单参 `DOMHighResTimeStamp`**：与 `performance.now()` 同时间基
- **同帧多回调共享 timestamp**：避免每个回调读到不同的时间
- **频率对齐显示刷新率**：60Hz → 约 16.6ms/次；120Hz → 约 8.3ms/次
- **页面不可见（document.hidden）自动暂停**：节电、不浪费主线程

### 典型用法

```js
// 动画驱动：基于 timestamp 做时间插值
function animate(timestamp) {
  const progress = Math.min((timestamp - startTime) / duration, 1);
  element.style.transform = `translateX(${progress * 100}px)`;
  if (progress < 1) requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// 滚动/resize 等高频事件：回调里只读必要值 + rAF 调度真正的写
let ticking = false;
window.addEventListener('scroll', (e) => {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateParallax(window.scrollY);  // 真正的 DOM 写推迟到帧边界
      ticking = false;
    });
    ticking = true;
  }
});
```

## 反模式集合

- **读写交替循环**（layout thrashing 经典）：`for (...) { el.style.width = box.offsetWidth + 'px'; }`——N 个元素 N 次强制布局
- **改样式后立即读几何**：`box.classList.add('big'); console.log(box.offsetHeight);`——强制同步布局
- **动画驱动几何属性**（`width`/`height`/`top`/`left`/`margin`）：触发完整 Layout→Paint→Composite，最贵路径
- **动画驱动视觉属性**（`color`/`background`/`box-shadow`）：仍需 Paint，应改用合成器属性或预合成层
- **全局提升层** `* { will-change: transform; transform: translateZ(0); }`：层爆炸
- **`will-change` 长期常驻样式表**：浏览器无法释放优化资源
- **「预防性」`will-change`**：MDN 警告这是误用，只在出现真实性能问题后作为最后手段
- **`setTimeout`/`setInterval` 驱动动画**：不与刷新率同步、后台仍跑、丢帧抖动
- **高频事件回调里直接重 DOM 读写**：应在回调里只读必要值 + rAF 调度真正的写
- **`contain: size` 不配 `contain-intrinsic-size`**：尺寸塌陷

## 下一步

- [参考](./reference.md)：触发属性完整分类表、`contain` 速记、API、版本与官方资源
