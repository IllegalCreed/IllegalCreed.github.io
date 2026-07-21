---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 MDN（Intersection Observer / Speculation Rules）、web.dev（Browser-level image lazy loading）、Vue Router 官方文档、Chrome for Developers（Prerender pages）编写，对照 2026-07 浏览器实现状态

## 速查

- **懒加载 vs 预加载**：懒加载 = 延迟视口外资源的加载；预加载 = 在用户需要前提前备好资源
- **声明式懒加载**：`<img loading="lazy">` / `<iframe loading="lazy">`——Baseline Widely Available（Chrome 77+/Edge 79+/Firefox 75+/Safari 15.4+），不支持时优雅降级
- **关键陷阱**：① `loading="lazy"` **仅在 JS 启用时**才延迟；② **LCP/首屏图像不要懒加载**；③ 懒加载图像**必须写 width/height**，否则 CLS 或被判定全在视口内全量加载；④ 只作用于 `<img>`/`<iframe>`，**CSS 背景图不支持**
- **JS 编程懒加载**：Intersection Observer（`rootMargin` 正值提前预取 + `threshold:0` + `unobserve()` 释放）、`content-visibility:auto`（纯 CSS 跳过屏外布局/绘制，**不阻止下载**）
- **路由懒加载**：Vue Router `component: () => import('./View.vue')`，**不要套 `defineAsyncComponent`**（官方明确反对）
- **组件懒加载**：Vue `defineAsyncComponent({ loader, loadingComponent, delay, timeout, errorComponent })`、React `lazy(() => import('./C')) + <Suspense>`
- **webpack 魔法注释**：`/* webpackPrefetch: true */` → `<link rel="prefetch">`（空闲时低优先级、未来导航）；`/* webpackPreload: true */` → `<link rel="preload">`（与当前 chunk 并行、当前页需要）
- **Speculation Rules API**：`prefetch`（仅下载文档）vs `prerender`（完整渲染+JS+子资源，隐形 tab）；eagerness 四档：`immediate`（立即）/ `eager`（hover）/ `moderate`（pointerdown）/ `conservative`（pointerdown with hesitation）
- **默认 eagerness**：`urls` 列表规则 → `immediate`；`where` 文档规则 → `conservative`
- **并发上限**：Chrome immediate 档限 **50 prefetch / 10 prerender**
- **Chromium-only**：Speculation Rules 仅 Chromium 实现（MDN 标注 Experimental、非 Baseline），用 `HTMLScriptElement.supports('speculationrules')` 特性检测 + `<link rel="prefetch">` 回退
- **CSP**：内联规则需在 `script-src` 加 `'inline-speculation-rules'`；跨站 prefetch 需 `requires: ['anonymous-client-ip-when-cross-origin']` + `referrer_policy` ≥ `strict-origin-when-cross-origin`

## 什么是「加载时机」策略

前端性能优化里有两个互补的问题：**「加载什么」**和**「何时加载」**。本章只讲后者——同一份资源，何时拉、何时延后、何时提前备好。

- **懒加载（Lazy Loading）**：把视口外或非首屏的内容推迟到「需要时」（滚到附近、路由切换、组件挂载）再拉，省下首屏带宽与渲染开销
- **预加载（Preloading）**：在用户**真正点之前**就把资源（下一页文档、下一张图、下一块 chunk）提前备好，让跳转/滚入近乎瞬时

> 与代码分割、网络优化的边界：代码分割讲「**如何切 chunk**」（webpack SplitChunksPlugin / Vite manualChunks）→ 归代码优化章；`<link rel="preload/prefetch">` 的 `as` 属性、CSP、HTTP 缓存命中率细节 → 归网络优化章。本叶只讲它们作为「时机策略」的用途区别。

## 两大类实现路径

| 路径 | 代表 API | 何时触发 | 适用 |
| --- | --- | --- | --- |
| **声明式** | `<img loading="lazy">`、`content-visibility: auto`、Speculation Rules HTML | 浏览器自行判定 | 图片/iframe/下一页/长列表屏外块 |
| **编程式** | Intersection Observer、动态 `import()`、`defineAsyncComponent`/`React.lazy` | 业务代码控制 | 自定义触发条件、组件挂载时 |

> 能用声明式就用声明式——更省心、不依赖 JS、对 SEO 友好。声明式不够灵活时再上编程式。

## 加载时机四象限

把「资源类型」和「触发时机」画成四象限：

|  | 当前页（立即可见） | 未来页/视口外（延后） |
| --- | --- | --- |
| **延迟（懒）** | ❌ 不应懒加载（首屏 LCP） | ✅ `<img loading="lazy">`、IO、`content-visibility` |
| **提前（预）** | ✅ `<link rel="preload">`、`webpackPreload` | ✅ `<link rel="prefetch">`、`webpackPrefetch`、Speculation Rules |

> 关键判断：**首屏 / LCP 元素永远不要懒加载**——浏览器不知道图片在屏幕何处前调度懒加载反而拖慢 LCP（web.dev 明确警告）。

## 浏览器支持现状（2026-07）

| 特性 | 状态 | 备注 |
| --- | --- | --- |
| `<img loading="lazy">` | Baseline Widely Available | Chrome 77+/Edge 79+/Firefox 75+/Safari 15.4+；不支持时属性被忽略 |
| `<iframe loading="lazy">` | Baseline | Firefox 121 / Safari 16.4 才齐，比 img 晚 |
| Intersection Observer API | Baseline Widely Available | 多年稳定 |
| `content-visibility: auto` | Baseline（2023 起） | 纯 CSS 渲染懒加载 |
| Vue Router 动态 `import()` / `defineAsyncComponent` / `React.lazy` | 稳定多年 | 框架级 |
| **Speculation Rules API** | **Experimental · 非 Baseline** | **仅 Chromium**；prefetch 较早，完整 prerender 需 Chrome 121+；Firefox/Safari 未默认支持 |

> Speculation Rules 生产使用**必须特性检测 + 回退**，不要假设全浏览器都支持。

## 速览：常用做法

```html
<!-- 1. 声明式懒加载图片（注意 width/height） -->
<img
  src="hero.webp"
  alt="..."
  width="800"
  height="600"
  loading="lazy"
  decoding="async"
/>

<!-- 2. 首屏/LCP 图像保持 eager（默认），并 preload -->
<link rel="preload" as="image" href="hero.webp" fetchpriority="high" />
<img src="hero.webp" width="800" height="600" alt="..." /><!-- 不加 loading=lazy -->

<!-- 3. Speculation Rules 预取下一页（仅 Chromium，需回退） -->
<script type="speculationrules">
  {
    "prefetch": [
      { "urls": ["/next-page"], "eagerness": "eager" }
    ]
  }
</script>
```

```ts
// 4. Vue Router 路由懒加载（不要套 defineAsyncComponent！）
const routes = [
  { path: "/about", component: () => import("./views/About.vue") },
];

// 5. 组件懒加载（非路由组件用 defineAsyncComponent）
import { defineAsyncComponent } from "vue";
const HeavyChart = defineAsyncComponent({
  loader: () => import("./HeavyChart.vue"),
  loadingComponent: Spin,
  delay: 200,
  timeout: 5000,
  errorComponent: Err,
});
```

> 写法不熟先看 [深入指南](./guide-line.md)；要查 API 表、版本与官方链接见 [参考](./reference.md)。

## 下一步

- [深入指南](./guide-line.md)：`loading=lazy` 语义、Intersection Observer 参数、Vue Router 路由懒加载、webpackPrefetch/Preload、Speculation Rules eagerness、`content-visibility`、反模式
- [参考](./reference.md)：完整 API 表、eagerness 四档触发时机表、浏览器版本支持、官方资源链接
