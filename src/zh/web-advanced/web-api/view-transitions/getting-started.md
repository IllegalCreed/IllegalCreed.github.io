---
layout: doc
outline: [2, 3]
---

# 入门：前后态快照与浏览器补间

> 基于 W3C CSS View Transitions（Level 1/2）现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **一句话定位**：View Transitions 让浏览器**自动为「DOM 更新前后的视觉状态」抓快照并补间过渡**，无需手写动画中间态——你只管改 DOM，浏览器负责「从旧样子平滑变到新样子」。
- **两种场景一套心智**：**同文档（SPA）**用 `document.startViewTransition(updateCallback)` 触发；**跨文档（MPA）**用 CSS `@view-transition { navigation: auto }` 在同源导航时自动触发；二者共享同一棵伪元素树与命名规则。
- **最小用法**：`document.startViewTransition(() => { 更新DOM() })`——回调里做 DOM 变更，其余交给浏览器。
- **核心机制三步**：抓旧状态快照 → 跑 `updateCallback` 更新 DOM（其间渲染被抑制）→ 抓新状态快照 → 在 `::view-transition` 伪元素树上跑动画。
- **默认动画**：整页（`:root` 默认叫 `root`）**交叉淡入淡出**；命名的元素会各自成组，位置与尺寸自动**形变补间**。
- **`view-transition-name` 是「配对钥匙」**：给「旧态某元素」和「新态对应元素」同一个名，浏览器就把它们当同一个东西补间；名字**同一时刻必须唯一**。
- **`ViewTransition` 对象**：`startViewTransition` 返回它，带 `ready`/`finished`/`updateCallbackDone` 三个 Promise 和 `skipTransition()`（详见[基础页](./guide-line/basics-pseudo)）。
- **与 CSS 动画分工**：元素**自身属性**的入场 / 悬停 / 展开用 CSS `transition`/`@keyframes`（[三大语言 · CSS 叶](/zh/base/language/css/css-animation-effects/)）；**状态切换 / 导航**的跨态转场才用 View Transitions。
- **与 JS 动画库分工**：**持续、可编排、交互驱动**的动画（时间线、手势跟随、物理弹簧、循环）仍归 [WAAPI / GSAP / Framer Motion / Anime.js](/zh/frontend-visualization/)；View Transitions 只补「前后两态之间」。
- **可组合**：`transition.ready` 后可用 Web Animations API 接管伪元素做精细动画——两者不冲突。
- **同文档核心已 Baseline**（2025-10 Newly available）：`startViewTransition`、`view-transition-name`、`view-transition-class`、`view-transition-name: match-element`、`:active-view-transition` —— Chrome 111 / Safari 18 / Firefox 144。
- **view transition types 尚缺 Firefox**：`types` 参数、`@view-transition { types }`、`:active-view-transition-type()` 在 Chrome 125+ / Safari 18+ 可用，**Firefox 144 初版不含** → 未进 Baseline。
- **跨文档 MPA 尚缺 Firefox**：`@view-transition`、`pageswap`/`pagereveal` 在 Chrome 126+ / Safari 18.2+ 可用，**Firefox 不支持** → 未进 Baseline（不是「仅 Chromium」，Safari 已跟上）。
- **特性检测**：同文档用 `if (!document.startViewTransition) { 直接改DOM(); return; }` 渐进增强；跨文档不支持时浏览器**直接忽略** `@view-transition`，天然降级为无动画硬切。
- **无障碍红线**：转场是纯视觉动效，必须尊重 `prefers-reduced-motion`（见[工程模式页](./guide-line/patterns-fallback)）。
- **进阶顺序**：本页 → [基础与伪元素树](./guide-line/basics-pseudo) → [命名与定制](./guide-line/naming-customization) → [SPA / MPA 与类型](./guide-line/spa-mpa-types) → [工程模式与降级](./guide-line/patterns-fallback) → [参考](./reference)。

## 一、它解决什么问题

在没有 View Transitions 之前，做一个「点列表项 → 缩略图放大飞到详情页大图」的转场，你要：读旧元素的位置尺寸、读新元素的位置尺寸、算出两者差值、用 `transform` 把新元素反向偏移到旧位置、再触发动画归位、动画结束清理临时样式……几十行胶水且极易在响应式布局下算错。

View Transitions 把这件事**反过来**：你只管把 DOM 从旧状态改成新状态，浏览器**在你改之前抓一张旧状态的快照、改之后抓一张新状态的快照**，然后自动在两张快照之间补间。你不再关心「中间第 30% 帧长什么样」——那是浏览器的活。

```js
// 全部代码就这么多：点击后把画廊主图换成被点的那张
function showImage(fullSrc, caption) {
  const update = () => {
    document.querySelector("#hero").src = fullSrc; // 只是改 DOM
    document.querySelector("#caption").textContent = caption;
  };

  // 不支持时直接改，支持时包一层——浏览器负责补间旧图→新图
  if (!document.startViewTransition) return update();
  document.startViewTransition(update);
}
```

无需任何额外 CSS，这段代码就会得到一次默认的交叉淡入淡出；给 `#hero` 加一个 `view-transition-name` 就升级成「尺寸位置平滑形变」——命名的威力在[命名与定制](./guide-line/naming-customization)展开。

## 二、机制：快照 → 更新 → 快照 → 补间

理解这条时间线，后面所有 API 都是它的展开：

1. **抓旧快照**：调用 `startViewTransition(cb)`（或触发同源导航）时，浏览器为**当前**页面上带 `view-transition-name` 的元素（默认含整个 `:root`）各拍一张静态快照。
2. **更新 DOM**：运行你的 `updateCallback`（SPA）或换入新文档（MPA）。**这期间页面渲染被抑制**，用户看不到「改到一半」的中间态。
3. **抓新快照**：DOM 更新后，浏览器为**新**状态里带 `view-transition-name` 的元素再各拍一张。
4. **建伪元素树 + 补间**：浏览器构造一棵 `::view-transition` 伪元素树，把每对「旧快照 / 新快照」放进去，默认让旧的淡出、新的淡入，并对成组元素的位置尺寸做形变补间。
5. **收尾**：动画结束，伪元素树销毁，页面回归正常渲染。

关键推论：**「你改 DOM」和「动画」是解耦的**——你写的永远是「最终状态」，从不写中间帧。这也解释了为什么它叫「transition」（前后两态之间）而不是「animation」（自定义时间线）。

## 三、`startViewTransition` 一分钟

同文档场景，入口只有一个方法，返回一个 `ViewTransition` 对象：

```js
// 返回 ViewTransition：可挂生命周期钩子（详见基础页）
const transition = document.startViewTransition(() => {
  // 在这里把 DOM 从旧状态改到新状态（可返回 Promise 做异步渲染）
  renderNextRoute();
});

// 三个 Promise 钩子按需用：
transition.updateCallbackDone.then(() => {}); // 回调完成（DOM 已更新）
transition.ready.then(() => {}); // 伪元素树就绪、动画即将开始（接管自定义动画的时机）
transition.finished.then(() => {}); // 动画结束、新视图可交互（清理 / 埋点）
```

跨文档场景一行 CSS，无需 JavaScript（两侧页面都要写）：

```css
/* 同源导航时自动转场；不支持的浏览器忽略此规则 → 降级为普通硬切 */
@view-transition {
  navigation: auto;
}
```

## 四、三条边界：和谁分工

View Transitions 常被误当成「动画库」或「CSS 过渡的替代」，实际是三足鼎立、各管一段：

| 你要做的事 | 用什么 | 为什么 |
| --- | --- | --- |
| **状态切换 / 页面导航**的跨态转场（列表↔详情、Tab 切换、路由跳转） | **View Transitions** | 它的专长就是「前后两态之间」的快照补间，尤其擅长形变（位置/尺寸变化） |
| 元素**自身属性**的入场 / 悬停 / 展开 / 颜色渐变 | CSS `transition` / `@keyframes`（[CSS 叶](/zh/base/language/css/css-animation-effects/)） | 单个元素属性变化，无需「前后两态配对」，CSS 原生更轻 |
| **持续、可编排、交互驱动**的动画（时间线、手势、物理弹簧、循环、SVG 路径） | JS 动画库（[可视化章动画组](/zh/frontend-visualization/)：WAAPI / GSAP / Framer Motion / Anime.js） | View Transitions 没有时间线编排 / 手势跟随 / 物理，也不做循环动画 |

三者**可叠加**：用 View Transitions 做路由转场的骨架，在 `transition.ready` 后用 Web Animations API（WAAPI）给某个伪元素加一段 `clip-path` 圆形揭示，是常见组合。本叶只在「衔接点」提及这些库，不展开任何一个——它们各有独立叶子。

## 五、支持现状（核于 2026-07）

不是「一个特性」而是「一组特性分批落地」，务必分层看：

| 能力 | Chrome | Safari | Firefox | Baseline |
| --- | --- | --- | --- | --- |
| **同文档核心**（`startViewTransition`、`view-transition-name`/`-class`、`match-element`、`:active-view-transition`） | 111+ | 18+ | **144+** | **Newly available（2025-10）** |
| **view transition types**（`types` 参数、`@view-transition { types }`、`:active-view-transition-type()`） | 125+ | 18+ | **✗（144 初版不含）** | 否 |
| **跨文档 MPA**（`@view-transition`、`pageswap`/`pagereveal`） | 126+ | 18.2+ | **✗** | 否 |

三句话记牢：

- **同文档核心是安全区**：2025-10-14 Firefox 144 补齐后进 Baseline，三大引擎都有，可放心用（旧版本仍需特性检测降级）。
- **types 与跨文档的唯一短板是 Firefox**：Safari 早已跟上（types 18+ / 跨文档 18.2+），所以别再说「仅 Chromium」；但只要 Firefox 没补齐，这两块就**不是 Baseline**，生产用必须渐进增强。
- **降级天然友好**：同文档用 `document.startViewTransition` 的存在性检测；跨文档不支持时浏览器直接忽略 `@view-transition`，退化为无动画硬切，不会报错、不会白屏。

下一页进入编程细节：`ViewTransition` 对象的三个 Promise、`::view-transition` 伪元素树的五层结构、以及快照与 DOM 更新的精确时序——[基础与伪元素树](./guide-line/basics-pseudo)。
