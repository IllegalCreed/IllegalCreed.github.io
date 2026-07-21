---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 web.dev / MDN 官方文档（developer.mozilla.org / web.dev/learn/css）编写，对照 2025-10-14 Baseline Newly available 的同文档 View Transitions 行为

## 速查

- **两条技术栈**：View Transitions API（VT，原生快照补间，页面切换）+ CSS Transitions / Animations（属性级 / 关键帧，micro-interaction）
- **VT 两种触发**：同文档（SPA）`document.startViewTransition(cb)`；跨文档（MPA）`@view-transition { navigation: auto }`
- **默认动画**：root cross-fade（旧淡出 + 新淡入），可被 `::view-transition-old/new` 自定义覆盖
- **`view-transition-name`**：给元素命名以脱离 root 独立 morph，**前后各恰好一个**否则转场被跳过
- **方向感**：`startViewTransition({update, types:['forwards']})` + `:active-view-transition-type(forwards)` 套不同 keyframes
- **CSS transition**：声明在**基础态**（不是触发态），`transition: property duration timing-function delay`
- **CSS animation**：`@keyframes name { 0%{} 100%{} }` + `animation: name 2s ease`
- **micro-interaction 用 transform/opacity/filter**（走合成器不触发 layout），**别用 width/height/top/margin**
- **必尊重 `prefers-reduced-motion`**：在媒体查询内 `::view-transition-* { animation: none !important }` 或换成 opacity 淡入
- **版本**：同文档 VT **Baseline Newly available**（2025-10-14，Firefox 144 推动）；跨文档 VT **Limited availability**（仅 Chrome 126+）

## 过渡动画是什么

过渡动画解决「DOM 状态变化时的视觉连续性」问题。当列表里的一个卡片展开成详情页、当路由从列表切到详情、当切换深浅色主题时，DOM 一更新内容就瞬切——浏览器不知道前后两个状态「视觉上对应哪个元素」，只能让用户硬生生看到一次跳变。过渡动画的本质是让浏览器抓「旧状态的视觉快照」+「新状态的视觉快照」，然后用 CSS Animations 把两张快照 cross-fade / morph 平滑过渡。

实现路径分两条：

- **View Transitions API（VT）**：浏览器原生快照机制，用于「整页或大块区域切换」
- **CSS Transitions / Animations**：属性级 / 关键帧动画，用于「单元素的属性变化、循环动画、micro-interaction」

两者底层都走 Web Animations 时序模型，但表达力不同：VT 自动抓快照，transition/animation 你手动写每一帧。

## VT vs CSS Transitions / Animations

| 维度 | View Transitions | CSS Transitions | CSS Animations |
| --- | --- | --- | --- |
| 触发 | `startViewTransition(cb)` / 跨文档导航 | 属性值变化（hover/focus/class 切换） | `animation-name` 应用到元素 |
| 中间帧 | 浏览器抓快照自动补 | 浏览器在两个值间插值 | 你写 `@keyframes` 关键帧 |
| 适合 | 页面切换、列表↔详情、主题切换 | 单次状态变化（hover、toggle） | 多步骤、循环、反向播放 |
| 复杂度 | DOM 一行 + 少量 CSS | 一行 `transition:` | 多行 `@keyframes` + `animation:` |
| 可访问性 | 浏览器原子切换 DOM，避免手写快照层陷阱 | 同 | 同 |

> 经验：能用 transition 解决别用 animation，能用 animation 解决别上 VT。VT 的价值在「整块或整页」的视觉切换，micro-interaction 用 CSS 足够。

## 同文档 VT 速览（SPA）

最小可用代码：

```text
// 1. 检测特性，不支持就直接更新 DOM
if (!document.startViewTransition) {
  updateTheDOMSomehow();
  return;
}

// 2. 支持则把 DOM 更新包进回调
const transition = document.startViewTransition(() => {
  updateTheDOMSomehow();
});

// 3. 回调结束后 transition.finished Promise resolve
```

浏览器内部步骤：

1. 抓**旧视图快照**（旧 DOM 渲染的像素）
2. 调用回调，回调内更新 DOM；浏览器**抑制渲染**直到回调结束
3. 抓**新视图快照**（新 DOM 渲染的像素）
4. 顶层叠一层 `::view-transition` overlay，挂 `::view-transition-old(root)` + `::view-transition-new(root)` 两个伪元素
5. 默认 root 转场是 cross-fade（旧 opacity 1→0 + 新 opacity 0→1）
6. 动画结束后移除 overlay，留下真实新 DOM

## 跨文档 VT 速览（MPA）

无需 JS，在两个文档（源页 + 目标页）的 CSS 里声明：

```css
@view-transition {
  navigation: auto;
}
```

浏览器在**同源、无跨源重定向、用户交互触发**的 `push/replace/traverse` 导航时自动接管转场。`navigation: auto` 是当前唯一有意义的值，`none` 用于在某些页面禁用。

> 跨文档 VT 仅 Chrome 126+ 支持（Limited availability），Safari / Firefox 未完整支持。生产环境必须接受「不支持的浏览器以普通跳转呈现」的降级。

## CSS Transitions / Animations 速览

```css
/* transition：声明在基础态 */
.button {
  transition: transform 0.2s ease, background-color 0.2s ease;
}
.button:hover {
  transform: scale(1.05);  /* 触发态只改属性值 */
  background-color: #0066cc;
}

/* animation：多关键帧 / 循环 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.spinner {
  animation: spin 1s linear infinite;
}
```

> transition 写在基础态、触发态只改值——写在 `:hover` 上的 `transition:` 只在移入时生效，移出会瞬切。

## prefers-reduced-motion 必读

```css
@media (prefers-reduced-motion: reduce) {
  /* VT 全屏转场：关掉或换成 opacity 淡入 */
  ::view-transition-group(root),
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation: none !important;
  }

  /* 普通动画：缩短或关闭 */
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

`prefers-reduced-motion` 是 OS 级「减少动效」设置（Windows 设置 / macOS 系统偏好 / iOS / Android 都有），跨浏览器自 2020-01 起 **Baseline Widely available**。WCAG 2.3.3 (AAA) 要求交互触发的非必要动效可关闭——大屏视差 / 大幅 scale 是前庭运动障碍（vestibular disorder）的主要诱因。

## 下一步

- [核心 API 与模式](./guide-line.md)：VT 同文档 / 跨文档深入、伪元素与自定义属性、命名过渡、micro-interaction、prefers-reduced-motion 实现、反模式
- [参考](./reference.md)：VT API / 伪元素 / CSS 动画完整表、版本状态、官方资源
