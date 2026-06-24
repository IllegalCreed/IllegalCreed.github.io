---
layout: doc
outline: [2, 3]
---

# View Transitions 与滚动驱动动画

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- **View Transitions**：在 DOM 改变前后自动「截图 → 交叉过渡」，做出整页 / 整块的平滑切换
- 同文档（SPA）：`document.startViewTransition(updateDOM)`，返回带 `ready` / `finished` / `updateCallbackDone` 三个 Promise 的对象
- 命名参与元素：CSS `view-transition-name: hero`（同一名字的新旧元素会做形变补间，类似「魔法移动」）
- 伪元素树：`::view-transition` → `::view-transition-group()` → `::view-transition-image-pair()` → `::view-transition-old()` / `::view-transition-new()`，可在其上写 `@keyframes` 定制
- 跨文档（MPA）：`@view-transition { navigation: auto; }`，**仅同源**生效；配 `pageswap` / `pagereveal` 事件
- **Baseline**：同文档 View Transitions **Baseline 2025·新近可用**（2025-10 起）；**跨文档**仍 **Limited / 非 Baseline**（Chromium-only），必须降级
- **滚动驱动动画**：把 `animation-timeline` 接到滚动进度而非时间——`scroll()`（滚动条进度）/ `view()`（元素进出视口进度）
- `scroll(axis scroller)`：`axis` = `block` / `inline` / `x` / `y`；`scroller` = `nearest` / `root` / `self`
- 命名时间线：`scroll-timeline-name` / `view-timeline-name` 定义，`animation-timeline: --名` 引用；`animation-range` 用 `cover` / `contain` / `entry` / `exit` 限定区段
- **Baseline**：滚动驱动动画 **Limited / 非 Baseline**（Chromium 全支持，Firefox 部分 / 需开关，Safari 缺）——**纯渐进增强**，用 `@supports` 兜底
- 两者都要响应 `prefers-reduced-motion`，降级到「无过渡 / 无滚动联动」的可用状态

## 一、View Transitions：页面级过渡

过去要做「列表点进详情、图片平滑放大铺满」这类整页过渡，得手动记录起止位置、克隆节点、算补间——极其繁琐。View Transitions API 把这套自动化了：**你只管改 DOM，浏览器负责对改动前后各截一张图、做交叉淡化 / 形变。**

### 同文档过渡（SPA）

核心是一个方法 `document.startViewTransition()`，把「改 DOM 的操作」作为回调传进去：

```js
// 浏览器：先截旧图 → 执行回调改 DOM → 截新图 → 自动过渡
const transition = document.startViewTransition(() => {
  updateTheDOMSomehow(); // 例如切换路由、替换列表内容
});

// 三个时机的 Promise
transition.ready.then(() => {
  /* 伪元素已就绪、即将开始动画（可在此用 Web Animations 接管） */
});
transition.finished.then(() => {
  /* 动画播放完毕 */
});
transition.updateCallbackDone.then(() => {
  /* 回调（DOM 更新）执行完毕 */
});
```

默认效果是整页**交叉淡化**。要让某个元素做「从旧位置形变到新位置」的连续过渡（即所谓「魔法移动」），给它在新旧两态都标同一个 `view-transition-name`：

```css
/* 列表里的缩略图与详情页的大图共用一个名字 → 浏览器把它当同一元素做形变补间 */
.thumbnail,
.hero-image {
  view-transition-name: hero-image;
}
```

::: warning view-transition-name 必须唯一
同一时刻，每个 `view-transition-name` 只能对应**一个**渲染元素，否则过渡会报错中断。动态列表里通常用唯一 id 拼出名字（如 `view-transition-name: card-42`）。
:::

### 定制动画：伪元素树

过渡进行时，浏览器会生成一棵**伪元素树**，截图就挂在上面，你用普通 CSS `animation` 定制它们：

```
::view-transition                       （根，覆盖整个视口）
└── ::view-transition-group(name)       （每个具名元素一组）
    └── ::view-transition-image-pair(name)
        ├── ::view-transition-old(name) （旧状态的截图）
        └── ::view-transition-new(name) （新状态的截图）
```

```css
/* 自定义「旧页面向左滑出、新页面从右滑入」 */
@keyframes slide-out {
  to {
    transform: translateX(-30px);
    opacity: 0;
  }
}
@keyframes slide-in {
  from {
    transform: translateX(30px);
    opacity: 0;
  }
}
::view-transition-old(root) {
  animation: slide-out 250ms ease both;
}
::view-transition-new(root) {
  animation: slide-in 250ms ease both;
}
```

`root` 是默认覆盖整页的那个名字；具名元素用各自的名字。

### 跨文档过渡（MPA）

传统多页应用（点链接真实导航到新 HTML）过去**无法**做这种过渡。现在只要一条 CSS、且**两页同源**，导航时就能自动过渡：

```css
/* 在两个页面都加上：开启同源导航的视图过渡 */
@view-transition {
  navigation: auto;
}
```

更细的控制靠 `pageswap`（旧页将卸载时）和 `pagereveal`（新页将显示时）两个事件，它们都能拿到 `ViewTransition` 对象，用来按导航类型定制动画。

### Baseline 与降级（关键）

| 能力 | Baseline 状态（2026-06 核） | 落地建议 |
| --- | --- | --- |
| 同文档 `document.startViewTransition()` | ✅ **Baseline 2025·新近可用**（2025-10 起跨主流浏览器） | 可用，但仍按渐进增强写，老环境直接落到「无动画的瞬时切换」 |
| 跨文档 `@view-transition { navigation: auto }` | 🟠 **Limited / 非 Baseline**（目前 Chromium 系；Safari / Firefox 未全支持） | **纯渐进增强**——不支持就退化为普通导航，体验不受损 |

降级天然优雅：`startViewTransition` 不存在时，直接执行 DOM 更新即可：

```js
function navigate(updateDOM) {
  // 特性检测：不支持就退回「无过渡」的普通更新
  if (!document.startViewTransition) {
    updateDOM();
    return;
  }
  document.startViewTransition(updateDOM);
}
```

跨文档过渡更简单——`@view-transition` 规则在不支持的浏览器里**被直接忽略**，页面照常导航。

## 二、滚动驱动动画：把动画绑到滚动

普通 `animation` 的进度跟着**时间**走。滚动驱动动画把进度改为跟着**滚动位置**走——滚到哪、动画就放到哪，反向滚动则倒放。它**不需要 JS 监听 `scroll`**，由浏览器在合成线程驱动，因而能很顺。

核心是 `animation-timeline` 属性，把动画接到一条「滚动时间线」上。有两种时间线。

### `scroll()`：滚动条进度时间线

进度 = 某个滚动容器**从顶滚到底**的百分比。常用于顶部「阅读进度条」：

```css
@keyframes grow-progress {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}
.progress-bar {
  transform-origin: left;
  animation: grow-progress linear; /* 注意：不写 duration，由时间线驱动 */
  animation-timeline: scroll(root block); /* 跟随根视口的纵向滚动 */
}
```

`scroll(axis scroller)` 两个参数：

- `axis`：`block`（块向，横排时即纵向，默认）/ `inline` / `x` / `y`；
- `scroller`：`nearest`（最近的滚动祖先，默认）/ `root`（根视口）/ `self`（元素自身作滚动容器）。

### `view()`：元素进出视口的进度时间线

进度 = 某元素**穿过视口**的过程（进入 → 离开）。非常适合「元素滑入视口时淡入上移」：

```css
@keyframes reveal {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.card {
  animation: reveal linear both;
  animation-timeline: view(); /* 以自身进出视口为时间线 */
  animation-range: entry 0% cover 40%; /* 从开始进入、到覆盖 40% 期间播完 */
}
```

`animation-range` 用**命名区段**限定动画在滚动的哪一段发生：`cover`（元素与视口有任意重叠的整段）、`contain`（完全容纳期间）、`entry`（进入阶段）、`exit`（离开阶段），以及 `entry-crossing` / `exit-crossing`。

### 命名时间线：跨元素联动

`scroll()` / `view()` 是「匿名」时间线，只能用最近的滚动容器。要让**某个滚动容器**驱动**另一处元素**，用命名时间线：

```css
/* 在滚动容器上定义一条具名时间线 */
.scroller {
  scroll-timeline-name: --gallery;
  scroll-timeline-axis: inline;
}
/* 别处的元素引用它 */
.indicator {
  animation: highlight linear;
  animation-timeline: --gallery;
}
```

`view-timeline-name` 同理（基于元素进出视口）。若引用方不是定义方的后代，还需 `timeline-scope` 把时间线名提升到共同祖先。

### Baseline 与降级（关键）

🟠 **滚动驱动动画整体仍是 Limited / 非 Baseline**（2026-06 核）：

- ✅ **Chromium 系**（Chrome / Edge）：完整支持；
- 🟡 **Firefox**：部分支持 / 可能需开启实验开关；
- 🔴 **Safari**：尚未支持。

因此它**只能当渐进增强**——务必保证「不支持时页面依然完整可用」。用 `@supports` 检测、并把它当成「锦上添花」：

```css
/* 默认：不依赖滚动动画，元素直接可见 */
.card {
  opacity: 1;
}
/* 仅在支持时，才接上滚动驱动的入场动画 */
@supports (animation-timeline: view()) {
  .card {
    animation: reveal linear both;
    animation-timeline: view();
    animation-range: entry 0% cover 40%;
  }
}
```

::: warning 别把关键内容藏在滚动动画后
若用滚动动画做「淡入」，**默认态必须是可见的**，仅在 `@supports` 命中时才改为初始透明——否则在不支持的浏览器里，内容会永远停在透明的起始帧而看不见。
:::

## 三、两者共同的无障碍底线

无论 View Transitions 还是滚动驱动动画，都要尊重 `prefers-reduced-motion`：

```css
@media (prefers-reduced-motion: reduce) {
  /* 关掉视图过渡的位移动画，退化为极简淡化或瞬时切换 */
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation: none;
  }
  /* 关掉滚动驱动的位移，避免随滚动晃动引发眩晕 */
  .card {
    animation: none;
  }
}
```

详见 [动画性能与无障碍](./animation-performance)。

## 小结

View Transitions 把「截图 + 交叉过渡」自动化：同文档 `startViewTransition()` 已 **Baseline 2025**、靠 `view-transition-name` + 伪元素树定制；跨文档 `@view-transition` 仍 **非 Baseline**，但天然降级为普通导航。滚动驱动动画用 `animation-timeline: scroll()` / `view()` 把动画绑到滚动位置，无需监听 `scroll`，但整体**尚非 Baseline**，必须 `@supports` 兜底、默认态保持可用。最后一页收束全叶的工程底线——下一页讲 [动画性能与无障碍](./animation-performance)。
