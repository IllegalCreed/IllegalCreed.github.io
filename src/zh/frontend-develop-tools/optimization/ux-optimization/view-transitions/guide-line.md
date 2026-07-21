---
layout: doc
outline: [2, 3]
---

# 核心 API 与模式

> 基于 web.dev / MDN 官方文档（developer.mozilla.org / web.dev/learn/css）+ W3C CSS View Transitions Module Level 1/2 + WCAG 2.2 编写，对照 2025-10-14 Baseline Newly available 行为

## 速查

- **同文档 VT**：`document.startViewTransition(updateCallback)`，返回 `ViewTransition` 对象（`updateCallbackDone` / `ready` / `finished` / `skipTransition()`）
- **跨文档 VT**：CSS 声明 `@view-transition { navigation: auto }`，硬约束 = 同源 + 无跨源重定向 + `navigationType ∈ {traverse,push,replace}` + push/replace 必须用户交互触发
- **5 个伪元素**：`::view-transition`（overlay 根）/ `::view-transition-group(name)` / `::view-transition-image-pair(name)` / `::view-transition-old(name)` / `::view-transition-new(name)`
- **2 个伪类**：`:active-view-transition` / `:active-view-transition-type(<ident>)`
- **3 个关键属性**：`view-transition-name`（命名元素，**前后各一个**）/ `view-transition-class`（批量加 class）/ `view-transition-scope`（隔离子树命名发现）
- **方向感**：`startViewTransition({update, types:['forwards'|'backwards']})` 配合伪类切不同 keyframes
- **CSS transition**：`transition: <property> <duration> <timing-function> <delay>`；`transition-behavior: allow-discrete` 让 `display` 等离散属性也可插值
- **CSS animation**：`animation-name/duration/timing-function/delay/iteration-count/direction/fill-mode/play-state` + `@keyframes`
- **micro-interaction 优先 transform/opacity/filter**，别用 width/height/top/margin
- **prefers-reduced-motion**：reduce / no-preference 两个值，WCAG 2.3.3 (AAA) 交互动效 + 2.2.2 (A) 自动播放动效
- **渐进增强必填**：`if (!document.startViewTransition) { updateDOM(); return; }`

## View Transitions API：同文档（SPA）

### document.startViewTransition(updateCallback)

最常用的调用形式，传入一个回调（同步或返回 Promise）：

```text
const transition = document.startViewTransition(async () => {
  // 在此更新 DOM —— 浏览器会抑制渲染直到此回调结束
  await updateTheDOMSomehow();
});

// 三个阶段 Promise
transition.updateCallbackDone.then(() => { /* 回调结束、新快照已抓 */ });
transition.ready.then(() => { /* 伪元素已挂上、动画即将开始 */ });
transition.finished.then(() => { /* 动画彻底结束、overlay 已移除 */ });

// 也可主动取消
transition.skipTransition();
```

三个 Promise 对应三个阶段：

| Promise | resolve 时机 | reject 时机 |
| --- | --- | --- |
| `updateCallbackDone` | updateCallback resolve | updateCallback reject |
| `ready` | 伪元素创建完毕、动画已可播放 | updateCallback reject 或动画无法启动 |
| `finished` | 转场动画完全结束 | skipTransition 调用或被新转场打断 |

> `skipTransition()` 会**跳到末态**：旧 overlay 移除，新 DOM 显示，不会半截卡在中间。

### 带 types 的方向感

```text
document.startViewTransition({
  update: () => updateTheDOMSomehow(),
  types: ['forwards'],  // 或 'backwards'
});
```

`types` 数组配合 `:active-view-transition-type()` 伪类按方向切不同 keyframes：

```css
:active-view-transition-type(forwards) {
  ::view-transition-old(root) {
    animation: 200ms ease-out both slide-out-to-left;
  }
  ::view-transition-new(root) {
    animation: 200ms ease-out both slide-in-from-right;
  }
}

:active-view-transition-type(backwards) {
  ::view-transition-old(root) {
    animation: 200ms ease-out both slide-out-to-right;
  }
  ::view-transition-new(root) {
    animation: 200ms ease-out both slide-in-from-left;
  }
}
```

> 方向感是用户认知模型的核心——前进从右滑入、后退从左滑入，单一动画无法表达。

## View Transitions API：跨文档（MPA）

跨文档 VT 不需要 JS 抓快照，由浏览器在导航时接管：

```css
/* 源页与目标页都要声明 */
@view-transition {
  navigation: auto;
  types: forwards;  /* 可选：声明本页参与的默认 type */
}
```

### 生效硬约束（全部满足才会触发）

| 约束 | 说明 |
| --- | --- |
| **同源** | source 与 target 必须同 scheme + host + port |
| **无跨源重定向** | 中间不能跳到不同源 |
| **navigationType ∈ {traverse, push, replace}** | reload / 表单 POST 不触发 |
| **push/replace 必须用户交互触发** | 点击链接可以，`location.href = ...` 程序化跳转可能不触发 |
| **当前文档与目标文档都声明 `navigation: auto`** | 单边声明无效 |

### pagereveal / pageswap 事件

跨文档 VT 暴露两个事件让 JS 介入：

- `Window: pageswap` —— 即将被卸载的文档上触发，`PageSwapEvent` 携带即将开始的 `ViewTransition`
- `Window: pagereveal` —— 即将被显示的文档上触发，`PageRevealEvent` 携带 `ViewTransition`，可在此修改 type 或 names

```text
window.addEventListener('pagereveal', async (e) => {
  if (!e.viewTransition) return;
  const fromURL = new URL(navigation.activation.from.url);
  // 根据来源决定方向 type
  e.viewTransition.types.push('backwards');
});
```

> `<link rel="expect">` 声明关键内容让浏览器在抓新快照前等待稳定首绘，避免 VT 抓到没渲染完的新视图。

## ::view-transition-* 伪元素

VT 期间挂在顶层 overlay 上的 5 个伪元素：

```
::view-transition                  overlay 根，固定铺满视口
  ::view-transition-group(<name>)  单个被命名元素的容器，承担位置/尺寸变化
    ::view-transition-image-pair(<name>)  old + new 的堆叠容器
      ::view-transition-old(<name>)  旧视图静态快照（截图）
      ::view-transition-new(<name>)  新视图实时表示（实时渲染，可被截图）
```

### old vs new 的本质区别

- **`::view-transition-old(name)`** = **旧视图的静态快照**（一张图，定格不动）
- **`::view-transition-new(name)`** = **新视图的实时表示**（实时渲染，但通常被截图）

> 不要把 new 当成「未来的」、old 当成「过去的」就以为是动态的——两者都是截图快照，只是 old 来自旧 DOM、new 来自新 DOM。

### 默认动画 = root cross-fade

不写任何自定义时，`::view-transition-old(root)` opacity 1→0、`::view-transition-new(root)` opacity 0→1，根 cross-fade。命名元素（设了 `view-transition-name`）会做位置 / 尺寸的 group 动画 + 透明度 cross-fade。

## view-transition-name 与命名过渡

### 唯一性约束（前后各恰好一个）

`view-transition-name` 让元素脱离 root 独立 morph。**核心约束**：每个 name 在 `startViewTransition` **调用前**与**回调后**各**恰好出现一次**，多对一会令该 name 的转场被跳过并控制台报错。

```css
/* 列表 → 详情 morph 的典型写法 */
.list-item { /* 默认不命名 */ }
.list-item.is-active {
  view-transition-name: item-detail;  /* 点击后才赋名 */
}
.detail-panel {
  view-transition-name: item-detail;  /* 详情页同名 → 浏览器配对 morph */
}
```

> 列表页常见踩坑：给每个列表项都写 `view-transition-name: item-<id>` 会让所有项都进入「待配对」状态，配合详情页只能找到一项 → 其余跳过。模式：列表项**点击后才赋名**，或用 `view-transition-name: match-element` 让元素自动生成。

### view-transition-class（批量样式化）

给一组快照统一加 class，用一条规则批量样式化（Baseline Newly available 2025-10-14）：

```css
.card {
  view-transition-name: var(--card-id);
  view-transition-class: card-morph;
}

/* 一条规则管所有 card-morph 的 old/new */
::view-transition-group.card-morph {
  animation-duration: 300ms;
}
```

### view-transition-scope（子树隔离）

把命名发现隔离到子树，用于**并发 / 嵌套转场**避免命名冲突（Baseline Newly available 2025-10-14）：

```css
.dialog {
  view-transition-scope: dialog-scope;
  /* 此子树内的 view-transition-name 只在本子树生效，不和外层路由转场冲突 */
}
```

### view-transition-name: match-element

让元素用自身标识自动生成快照名（Baseline Newly available 2025-10-14），解决「列表项每项都命名」的痛点。

## micro-interaction：CSS transition 与 animation

### 优先 transform/opacity/filter（合成器属性）

| 类型 | 例子 | 性能 |
| --- | --- | --- |
| **合成器属性**（推荐） | `transform` / `opacity` / `filter` | 只触发 compositor，60fps 稳定 |
| **layout 属性**（禁用） | `width` / `height` / `top` / `margin` / `padding` | 每帧 reflow，主线程阻塞掉帧 |

### transition 声明位置

```css
/* 正确：声明在基础态 */
.button {
  transition: transform 0.2s ease;
}
.button:hover { transform: scale(1.05); }  /* 触发态只改值 */

/* 错误：写在 :hover 上 → 移入有动画、移出瞬切 */
.button:hover {
  transition: transform 0.2s ease;
  transform: scale(1.05);
}
```

### transition-behavior: allow-discrete

让 `display: none` ↔ `display: block` 这类**离散属性**也能插值（用 `[transition-behavior: allow-discrete]` + 配合 `@starting-style`）：

```css
.dialog {
  transition: opacity 0.3s, display 0.3s allow-discrete;
}
.dialog[open] { opacity: 1; }
.dialog:not([open]) { opacity: 0; }

@starting-style {
  .dialog[open] { opacity: 0; }
}
```

### animation 关键帧 + 循环

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.live-dot {
  animation: pulse 1.5s ease-in-out infinite;
  animation-play-state: running;  /* paused 可暂停 */
}
```

> transition 与 animation 选用准则：单次状态变化用 `transition-*`；多步骤 / 循环 / 反向播放 / 关键帧控制用 `@keyframes + animation-*`。

## prefers-reduced-motion：尊重减少动效

### 语义与触发

`prefers-reduced-motion` 检测 OS 级「减少动效」设置，跨浏览器自 2020-01 起 Baseline Widely available：

- **Windows 10/11**：设置 → 辅助功能 → 视觉效果 → 动画效果（关闭）
- **macOS**：系统设置 → 辅助功能 → 显示 → 减少动效
- **iOS / iPadOS**：设置 → 辅助功能 → 动态效果 → 减少动态效果
- **Android**：设置 → 辅助功能 → 移除动画

两个值：`reduce`（已开启）与 `no-preference`（默认）。

### 实现策略

```css
@media (prefers-reduced-motion: reduce) {
  /* VT：关闭转场或换成 opacity 溶解 */
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }

  /* 普通：用 opacity 淡入替代大幅 scale/平移 */
  .modal {
    animation: 200ms ease-out both fade-in;
  }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

> **不等于零动画**：MDN 官方示例即用 dissolve 替换 pulse，保留视觉连续性同时避免 vestibular trigger。

### WCAG 两条相关规则

| 规则 | 等级 | 管辖范围 |
| --- | --- | --- |
| **2.3.3 Animation from Interactions** | Level AAA | 用户交互触发的非必要动效（点击展开、悬停放大、转场） |
| **2.2.2 Pause, Stop, Hide** | Level A | 页面自动播放的动效（轮播、自动滚动、装饰循环） |

> 2.3.3 例外 = `essential`（动效本身是功能，比如教学动画）。2.2.2 要求「暂停 / 停止 / 隐藏」三选一，5 秒以下自动结束可豁免。

## 反模式（避坑）

- **不加特性检测直接 `document.startViewTransition(cb)`**：旧浏览器 / 未支持环境直接 TypeError，**基础 DOM 更新也失败**。正确：`if (!document.startViewTransition) { updateDOM(); return; }`
- **同一 `view-transition-name` 同时绑到多个元素**：浏览器无法配对，该转场被跳过并报错。必须保证「每个 name 前后各一个」
- **跨文档 VT 期望在跨源 / 重定向 / 非用户交互触发的导航上生效**：硬约束 `同源 + 无跨源重定向 + push/replace 必须用户交互触发`，程序化 `location.href` 跳转可能不触发
- **忽略 `prefers-reduced-motion` 硬塞全屏滑动 / 缩放 / 视差**：触发前庭障碍（眩晕、恶心、偏头痛），违 WCAG 2.3.3 (AAA)
- **用 JS 手写「旧内容叠在新内容上」的快照层替代 VT API**：旧新内容同时存在 DOM 导致屏幕阅读器混乱、焦点丢失、live region 异常公告——这正是 VT 要解决的可访问性难题
- **把 transition 声明在 `:hover` / 触发态**：导致「移入有动画、移出瞬切」。应写在基础规则，触发态只改属性值
- **用 width / height / top / margin 做高频 micro-interaction**：每帧触发 layout（reflow），主线程阻塞掉帧；应换 transform / opacity
- **对 `::view-transition-old/new` 同时设 opacity 冲突动画，且不留 reduce-motion 出口**：自定义动画时必须同时写 reduce-motion 分支
- **把 Navigation API 路由 / History 管理和 VT 混为一谈**：VT 只是表现层快照机制，**不替代路由**；同文档 VT 仍需自己 `updateTheDOMSomehow`（更新 history + 渲染新视图）

## 边界

- **与「CSS Transforms / 滚动驱动动画」边界**：transform / filter / opacity 是过渡动画的常用语料，但 transform 本身属 CSS Transforms 模块；scroll-driven animations（`animation-timeline: scroll()/view()`）属滚动驱动动画章，不属本章
- **与「Web Animations API (WAAPI)」边界**：VT 底层用 CSS Animations 的时序模型，但 `element.animate()` 这类 JS 编程接口属 WAAPI 章；本章只讨论 transition / animation 声明式用法与 VT 触发
- **与「路由与导航 / Navigation API」边界**：VT 是表现层快照机制，不替代路由；跨文档 VT 依赖导航的 navigationType（traverse / push / replace）但不接管 history；路由策略属路由章
- **与「加载策略 / Skeleton / 性能」边界**：VT 可改善「感知加载延迟」但骨架屏、流式渲染、prefetch 属加载策略章；`<link rel="expect">` 虽与 VT 协作保证一致首绘，本体属渲染 blocking 策略
- **与「可访问性」章交叉**：prefers-reduced-motion 是媒体查询接口，WCAG 2.3.3 / 2.2.2 是规则来源——这些规则本体属 a11y 章，本章只承担「如何在过渡动画中实现它们」
- **与「交互动效 / 手势」边界**：micro-interaction 中的指针 / 触控手势反馈属交互章；本章只覆盖其动画表现层（hover / active 的 transition）

## 下一步

- [参考](./reference.md)：VT API / 伪元素 / CSS 动画完整表、版本状态、官方资源
