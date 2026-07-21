---
layout: doc
---

# 过渡动画

过渡动画（View Transitions）是浏览器原生的「DOM 状态变化视觉补间」能力：你只把 DOM 从旧状态改成新状态，剩下的「从旧样子平滑变到新样子」交给浏览器自动抓快照与补间。它的核心 API 是 `document.startViewTransition(callback)`（同文档 SPA）与 `@view-transition { navigation: auto }`（跨文档 MPA），配合 `::view-transition-old/new` 两个伪元素、`view-transition-name` 唯一约束、`:active-view-transition-type()` 方向感伪类，可以做出原生前必须依赖 GSAP / Framer Motion 才能实现的「页面切换 morph」「列表→详情展开」等效果。同文档 View Transitions 自 2025-10-14 进入 **Baseline Newly available**（Firefox 144 推动，Chrome 111 / Safari 18 已支持，属 Interop 2025 focus area），跨文档形态仍属 **Limited availability**（仅 Chrome 126+，Safari / Firefox 仍未完整支持）。

与过渡动画并列的两条「更轻量」的语料是 **CSS Transitions**（属性级单次插值，`transition-*` 系列）与 **CSS Animations**（多关键帧 / 循环 / 反向，`@keyframes + animation-*` 系列），它们是 micro-interaction（按钮 hover、菜单展开、骨架淡入）的主力。无论用哪种，都要尊重 `prefers-reduced-motion` 媒体查询——WCAG 2.3.3 Animation from Interactions (Level AAA) 与 2.2.2 Pause, Stop, Hide (Level A) 都要求用户可关闭非必要动效，全屏视差 / 大幅 scale 是前庭运动障碍（vestibular disorder）的主要诱因。

## 评价

**优点**

- **原生无依赖**：浏览器自带，不打包 GSAP / Motion One 等动画库
- **快照机制免手写中间帧**：开发者只声明「DOM 最终状态」，浏览器抓新旧快照并 cross-fade / morph
- **可访问性优于手写快照层**：浏览器在过渡结束时原子地切换真实 DOM，避免「旧内容叠在新内容上」导致屏幕阅读器混乱
- **CSS Transitions / Animations 成熟稳定**：Baseline Widely available，跨浏览器一致
- **跨文档 VT 把 SPA 级动画带入 MPA**：多页应用首次能用 CSS 一行声明拿到页面切换动画

**缺点**

- **跨文档 VT 兼容性不足**：仅 Chrome 126+ 支持，Safari / Firefox 未完整，必须做特性检测 + 降级
- **`view-transition-name` 唯一性约束严**：每个 name 在调用前后必须各恰好出现一次，列表页是常见踩坑点
- **截屏机制有开销**：每次转场都对全文档截图，超大 DOM 上可能掉帧
- **不能用于持续动画**：VT 是「一次性状态切换」机制，循环 / 持续动画仍要 `@keyframes`
- **规范分模块推进**：Level 1（同文档）已达 CR，Level 2（跨文档）仍 WD，新属性（`view-transition-class` / `scope` / `match-element`）刚进入 Baseline Newly available

## 文档地址

- [MDN — View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- [MDN — @view-transition at-rule](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@view-transition)
- [web.dev — View transitions for the SPA](https://web.dev/learn/css/view-transitions-spas)
- [Chrome for Developers — Smooth transitions with the View Transition API](https://developer.chrome.com/docs/web-platform/view-transitions)
- [W3C WAI — WCAG 2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)

## GitHub地址

- [W3C csswg-drafts — css-view-transitions](https://github.com/w3c/csswg-drafts/tree/main/css-view-transitions)
- [Chrome Status — View Transitions](https://chromestatus.com/feature/view-transitions)

## 幻灯片地址

<a href="/SlideStack/view-transitions-slide/" target="_blank">过渡动画</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=690" target="_blank" rel="noopener noreferrer">过渡动画测试题</a>

> 待回填：测试题 `category` 与笔记 / 幻灯片同步 import 到生产库后，将 `PENDING` 替换为题目所属分类的真实 categoryId。
