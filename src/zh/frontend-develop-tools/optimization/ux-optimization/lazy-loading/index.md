---
layout: doc
---

# 懒加载和预加载

懒加载和预加载是前端「加载时机」策略的一对孪生抓手：**懒加载**把视口外的资源推迟到需要时再拉，**预加载**反过来——在用户真正点之前就把资源提前备好。两者瞄准同一件事：把带宽、CPU、内存花在用户当下最关心的内容上。浏览器侧的实现从「HTML 声明式属性」（`<img loading="lazy">`）到「JS 编程式 API」（Intersection Observer、动态 `import()`、`defineAsyncComponent`），再到「按预测时机触发」（webpack 魔法注释 `webpackPrefetch` / `webpackPreload`、Speculation Rules API 的 `prefetch` / `prerender` 与四档 `eagerness`），覆盖了「无感预取 → 即时跳转」的整个时机谱系。本章聚焦「**何时加载**」这一核心问题——`loading=lazy` 仅在 JS 启用时延迟、LCP 图像不可懒加载、IO 用 `rootMargin` 提前预取并 `unobserve` 释放、Vue Router 用动态 `import()` 而非 `defineAsyncComponent`、Speculation Rules 的 Chromium-only 现状与回退策略——把每个 API 的语义、边界与陷阱讲清楚。

## 评价

**优点**

- **声明式优先**：`<img loading="lazy">`、`content-visibility: auto`、Speculation Rules 用 HTML/CSS 一行搞定，无需 JS 即可显著改善体验
- **可编程精确控制**：Intersection Observer、动态 `import()`、`defineAsyncComponent` 在需要按业务条件触发时仍有完整编程能力
- **体验跨度大**：从「延迟到滚入视口」到「整页 prerender 几乎瞬时跳转」，能覆盖从慢网到高端机的全谱
- **生态成熟**：浏览器原生支持（Chrome 77+ / Firefox 75+ / Safari 15.4+ 起 `loading="lazy"` Baseline Widely Available），不支持的优雅降级
- **框架原生集成**：Vue Router、React.lazy、Vue `defineAsyncComponent` 都把懒加载做成了内置语法

**缺点**

- **场景错配会扣分**：首屏 LCP 图像懒加载会被 Lighthouse 直接扣 Performance 分；不给懒加载图像写 `width/height` 会引起 CLS
- **细节坑多**：`loading="lazy"` 仅在 JS 启用时延迟（禁用 JS 时正常加载）、`opacity:0` 不能阻止加载、`content-visibility` 不阻止图像下载——容易踩错
- **Speculation Rules 仅 Chromium**：MDN 标注 Experimental、非 Baseline，Firefox / Safari 截至 2026-07 未默认支持，生产必须特性检测 + 回退
- **prerender 代价高**：误触发会完整渲染 + 跑 JS + 拉子资源，撞 Chrome 50 prefetch / 10 prerender 并发上限会浪费 CPU/内存/流量/电池
- **与相邻概念易混**：代码分割（如何切 chunk）归代码优化章、`<link rel="preload/prefetch">` 语法归网络优化章——本叶只讲「时机策略」

## 文档地址

- [web.dev - Browser-level image lazy loading](https://web.dev/articles/browser-level-image-lazy-loading)
- [MDN - Speculation Rules API](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API)
- [MDN - Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [Vue Router - Lazy Loading Routes](https://router.vuejs.org/guide/advanced/lazy-loading.html)
- [Chrome for Developers - Prerender pages in Chrome](https://developer.chrome.com/docs/web-platform/prerender-pages)

## GitHub地址

- [w3c/svg-aam（loading 属性规范相关）](https://github.com/whatwg/html)
- [GoogleChrome/speculation-rules](https://github.com/WICG/nav-speculation)

## 幻灯片地址

<a href="/SlideStack/lazy-loading-slide/" target="_blank">懒加载和预加载</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=688" target="_blank" rel="noopener noreferrer">懒加载和预加载 测试题</a>

> 待回填：题目入库后，将上面链接的 `category=688` 替换为实际分类 ID（见 `apps/quiz-backend/prisma/content/lazy-loading.json` 导入后回填的 categoryId）。
