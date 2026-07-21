---
layout: doc
outline: [2, 3]
---

# 深入指南

> 基于 MDN（Intersection Observer / Speculation Rules）、web.dev（Browser-level image lazy loading）、Vue Router 官方文档、Chrome for Developers（Prerender pages）+ webpack 魔法注释官方说明编写

## 速查

- **`<img loading>`** 两值：`lazy`（视口外延迟）/ `eager`（默认，等价不写），**不支持 CSS 背景图**；`lazy` **仅在 JS 启用时才延迟**，禁用 JS 时正常加载
- **首屏/LCP 不懒加载**：浏览器不知图片位置前调度懒加载反而拖慢 LCP
- **必须写 width/height**：不写会 CLS，或被判定 0×0 全在视口内 → 全量加载
- **IntersectionObserver 懒加载惯例**：`rootMargin: '200px 0px'`（正值提前预取）+ `threshold: 0` + 加载完 `unobserve()`
- **Vue Router 路由懒加载**：`component: () => import('./View.vue')`；**禁止套 `defineAsyncComponent`**（官方明确）
- **webpack 魔法注释**：`/* webpackPrefetch: true */`（→ `<link rel="prefetch">`，空闲时低优先级、未来导航）/ `/* webpackPreload: true */`（→ `<link rel="preload">`，并行高优先级、当前页）
- **Speculation Rules**：`prefetch`（仅下载文档响应，不含子资源）/ `prerender`（完整渲染+JS+子资源，隐形 tab，激活近乎瞬时）
- **eagerness 四档**：`immediate`（命中即拉）/ `eager`（hover）/ `moderate`（pointerdown）/ `conservative`（pointerdown 含犹豫）；默认：`urls` 列表 → `immediate`，`where` 文档 → `conservative`
- **Chrome 并发上限**：immediate 档 **50 prefetch / 10 prerender**
- **Chromium-only + 特性检测**：`HTMLScriptElement.supports('speculationrules')` + `<link rel="prefetch">` 回退；CSP 需 `'inline-speculation-rules'`
- **`content-visibility: auto`**：纯 CSS 跳过屏外布局/绘制，**不阻止图像下载**——是 IO 的补充而非替代

## loading 属性：声明式图像/iframe 懒加载

### 语义

`<img>` 与 `<iframe>` 共用一个 `loading` 属性，两个有效值：

| 值 | 行为 |
| --- | --- |
| `lazy` | 视口外延迟加载；浏览器根据距离视口的远近、网络状况、设备等级自行决定何时拉取 |
| `eager`（默认） | 立即加载，等价于不写 `loading` 属性 |

```html
<!-- 视口外懒加载 -->
<img src="photo.webp" width="800" height="600" alt="..." loading="lazy" />

<!-- 默认（等价不写）-->
<img src="hero.webp" width="800" height="600" alt="..." loading="eager" />

<!-- iframe 同语义 -->
<iframe src="widget.html" loading="lazy" title="..."></iframe>
```

### 五个关键事实（容易踩错）

1. **仅在 JavaScript 启用时才延迟**：web.dev 原文——"loading is only deferred when JavaScript is enabled"。禁用 JS 时浏览器无法做懒加载决策，会正常加载。
2. **不支持 CSS 背景图**：`background-image: url(...)` 不受 `loading="lazy"` 影响——背景图懒加载要用 Intersection Observer 给元素加 class 的方式。
3. **不支持时不报错**：旧浏览器直接忽略该属性，正常加载（优雅降级）。
4. **必须写 `width/height`**：① 不写尺寸时图像默认 `0×0`，浏览器可能判定整个画廊都在视口内 → **全部加载**（与懒加载预期相反）；② 不写尺寸会引起 CLS（Lighthouse 会扣分）。也可用 `aspect-ratio` CSS 属性等价替代。
5. **iframe 支持较晚**：Chrome/Edge 77+ 早支持，但 Firefox 121 / Safari 16.4 才齐——做兼容时记得 iframe 与 img 的支持版本不同。

### 首屏/LCP 不要懒加载

> 关键原则：**永远不要给首屏、特别是 LCP 元素加 `loading="lazy"`。**

web.dev 明确警告：浏览器在不知道图片位置前，无法有效调度懒加载——强行懒加载 LCP 图像反而拖慢最大内容绘制，会被 Lighthouse 直接扣 Performance 分。

正确做法：

```html
<!-- LCP/首屏图：preload + 不加 loading=lazy -->
<link rel="preload" as="image" href="hero.webp" fetchpriority="high" />
<img src="hero.webp" width="800" height="600" alt="..." />

<!-- 视口外图：才用 lazy -->
<img src="below-fold.webp" width="800" height="600" alt="..." loading="lazy" />
```

## Intersection Observer：编程式懒加载

### 为什么不是 scroll 事件

监听 `scroll` 事件计算 `getBoundingClientRect()` 是老办法，问题：① `scroll` 触发频率高、要在主线程跑 `getBoundingClientRect`；② 没法跨 iframe、跨 origin 文档统一处理。**Intersection Observer API** 把「元素与视口（或父容器）的相交状态」交给浏览器异步计算，主线程几乎零负担。

### 构造器与回调

```ts
// 构造器签名
const io = new IntersectionObserver(callback, options);

// options 三个字段
const options = {
  root: null, // 监听相对的祖先元素，null = 浏览器视口
  rootMargin: "200px 0px", // 在 root 周围扩张/收缩的边距，正值=提前触发
  threshold: 0, // 目标可见比例阈值，0=任何像素进入即触发，1=完全可见
};

// 回调收一组 IntersectionObserverEntry
const callback = (entries, observer) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src; // 把真地址塞进去触发加载
      observer.unobserve(img); // 加载完释放监听
    }
  }
};
```

### 懒加载场景的惯例

| 字段 | 推荐值 | 原因 |
| --- | --- | --- |
| `root` | `null` | 监听相对浏览器视口 |
| `rootMargin` | `"200px 0px"` 或 `"25%"` | 正值让用户**滚到附近就提前预取**，避免滚到位才看到空白 |
| `threshold` | `0` | 任意像素进入即触发，尽快开始下载 |
| 回调里 | `observer.unobserve(target)` | 加载完释放监听，避免冗余回调与内存占用 |

> 想停止整个监听器：`observer.disconnect()` 释放所有 target 与监听。

### content-visibility：纯 CSS 渲染懒加载（IO 的补充）

```css
.card {
  content-visibility: auto; /* 屏外时跳过布局/绘制 */
  contain-intrinsic-size: 200px; /* 预留高度避免滚动条抖动 */
}
```

- **做什么**：浏览器对屏外的 `content-visibility: auto` 元素**跳过布局和绘制**，渲染开销近似为 0——长列表/画廊性能大幅提升
- **不做什么**：**不阻止子元素（含 `<img>`）的网络下载**——它是渲染层懒加载，不是下载层懒加载
- **与 IO 的关系**：互补而非替代——IO 控制「什么时候把图片地址塞进去」（下载层），`content-visibility` 控制「什么时候画出来」（渲染层）

> 常见误解：把 `content-visibility: auto` 当图片懒加载等价替代。错——它只省渲染开销，要做下载级懒加载仍需 `loading="lazy"` 或 IO。

## Vue Router 路由懒加载

### 写法

```ts
import { createRouter } from "vue-router";

const routes = [
  {
    path: "/about",
    // 动态 import()：首次进入该路由时才拉取并缓存对应 chunk
    component: () => import("./views/About.vue"),
  },
  {
    path: "/dashboard",
    // 配合 webpackChunkName 命名 chunk
    component: () =>
      import(/* webpackChunkName: "dashboard" */ "./views/Dashboard.vue"),
  },
];
```

### 不要在路由组件上套 defineAsyncComponent

> Vue Router 官方文档明确：路由的 `component` 应该直接是「返回 Promise（即 `() => import(...)`）的函数」，**不要再用 `defineAsyncComponent` 包一层**。

错：

```ts
// ❌ 反模式
import { defineAsyncComponent } from "vue";
const routes = [
  {
    path: "/about",
    component: defineAsyncComponent(() => import("./views/About.vue")),
  },
];
```

为什么禁止？Vue Router 自己管理路由组件的加载生命周期（懒加载、错误处理、加载态、缓存策略都内置），再套一层 `defineAsyncComponent` 会让两层加载控制互相打架，加载态、错误处理逻辑会混乱。

### defineAsyncComponent 真正的用武之地：非路由组件

`defineAsyncComponent` 适用于**非路由组件**——例如某个图表弹窗、富文本编辑器等按需挂载的重组件：

```ts
import { defineAsyncComponent } from "vue";

const HeavyChart = defineAsyncComponent({
  loader: () => import("./HeavyChart.vue"), // 返回 Promise 的加载函数
  loadingComponent: Spinner, // 加载时显示
  delay: 200, // 显示 loading 前的延迟（避免闪烁）
  timeout: 5000, // 超时时间
  errorComponent: ErrorFallback, // 加载失败显示
});
```

| 字段 | 作用 |
| --- | --- |
| `loader` | 返回 Promise 的加载函数，典型是 `() => import(...)` |
| `loadingComponent` | 加载中显示的占位组件 |
| `delay` | 显示 loadingComponent 前的延迟（ms），防快速加载时闪烁 |
| `timeout` | 超时时间（ms），超时进入错误态 |
| `errorComponent` | 加载失败/超时时显示的组件 |
| `onError` | 加载失败回调，支持重试逻辑 |

### React.lazy + Suspense（对比）

React 用 `lazy + Suspense` 达到类似效果：

```tsx
import { lazy, Suspense } from "react";

const HeavyChart = lazy(() => import("./HeavyChart"));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyChart />
    </Suspense>
  );
}
```

## webpack 魔法注释：prefetch 与 preload

动态 `import()` 配合 webpack 的魔法注释，能在生成的 chunk 上注入 `<link rel="prefetch">` 或 `<link rel="preload">`，让浏览器按指定优先级和时机加载。

### 两种魔法注释对照

| 注释 | 生成 | 优先级 | 时机 | 适用 |
| --- | --- | --- | --- | --- |
| `/* webpackPrefetch: true */` | `<link rel="prefetch">` | **低**（浏览器空闲时） | 未来导航可能用的 chunk | 下一页可能跳转的组件 |
| `/* webpackPreload: true */` | `<link rel="preload">` | **高**（与当前 chunk 并行） | 当前页**必用**且晚发现的 chunk | 当前页依赖的关键资源 |

```ts
// 预取下一页可能跳转的组件（空闲时低优先级拉）
const About = () =>
  import(/* webpackPrefetch: true */ /* webpackChunkName: "about" */ "./About");

// 预加载当前页必用的晚发现组件（并行高优先级）
const Chart = () =>
  import(/* webpackPreload: true */ /* webpackChunkName: "chart" */ "./Chart");
```

### 关键区别（高频考点）

- **prefetch**：浏览器**空闲时**才拉，**不阻塞**当前页，适合「未来可能跳转的页面」——即使用户不点也不影响当前体验
- **preload**：与**当前 chunk 并行**拉，**高优先级**，适合「当前页必用、但在依赖图里发现得晚」的资源（如通过动态 import 触发的关键组件）
- 二者都是「预」，但**目标时机完全不同**：preload 服务于当前页，prefetch 服务于未来页

> Vite 同样支持 `/* webpackChunkName */`，对 `webpackPrefetch` / `webpackPreload` 则通过生成等价 `<link>` 标签或插件实现类似语义，写法略有不同。

## Speculation Rules API：声明式预测加载

### prefetch vs prerender

Speculation Rules 是较新的声明式 API（仅 Chromium 实现，MDN 标注 Experimental、非 Baseline）。两类顶层动作：

| 动作 | 做什么 | 代价 | 适用 |
| --- | --- | --- | --- |
| `prefetch` | 仅**下载文档响应**（不含子资源） | 小 | 想加速下一页 TTFB |
| `prerender` | **完整渲染**（拉子资源 + 跑 JS + 数据 fetch）在隐形 tab | 大（CPU/内存/流量/电池） | 确定高概率跳转的链接，激活近乎瞬时 |

> prerender 的产物是「隐形 tab」——完整 DOM、JS 已执行、数据已 fetch。用户点击链接时直接「激活」该 tab，跳转近乎瞬时。

### eagerness 四档

`eagerness` 决定**何时**触发：

| 值 | 触发时机 | 推荐 |
| --- | --- | --- |
| `immediate` | 命中规则即拉 | 大批量 prefetch 列表（默认 list 规则） |
| `eager` | 鼠标 **hover** 链接时 | 高概率跳转链接 |
| `moderate` | **pointerdown**（按下）时 | 中等概率 |
| `conservative` | **pointerdown 且有犹豫**（按下到抬起的间隔）时 | 保守，默认 where 规则 |

> 默认：`urls` 列表规则 → `immediate`；`where(document)` 规则 → `conservative`。

### 写法

```html
<!-- 列表规则 -->
<script type="speculationrules">
  {
    "prefetch": [
      { "urls": ["/about", "/contact"], "eagerness": "eager" }
    ],
    "prerender": [
      {
        "where": { "href_matches": "/products/*" },
        "eagerness": "moderate"
      }
    ]
  }
</script>
```

也可用 **HTTP 响应头** `Speculation-Rules` 指向外部 JSON 文件（无法改 HTML 时用）：

```http
Speculation-Rules: "/speculation-rules.json"
```

### 并发上限与策略

Chrome 对 immediate 档设了**并发上限**防止滥用：

| 动作 | 并发上限 |
| --- | --- |
| prefetch（immediate） | **50** |
| prerender（immediate） | **10** |

> 实践策略：prefetch 代价小可用 `immediate` 或 `eager`；**prerender 默认用 `conservative`**（pointerdown 才触发），仅对确定高概率跳转的链接升到 `eager`/`moderate`——误触发会浪费资源、撞并发上限。

### Chromium-only 与特性检测

Speculation Rules 仅 Chromium 浏览器实现（Chrome/Edge），Firefox/Safari 截至 2026-07 未默认支持。生产使用必须特性检测并回退：

```ts
// 特性检测
if (
  "supports" in HTMLScriptElement &&
  HTMLScriptElement.supports("speculationrules")
) {
  // 浏览器支持 Speculation Rules
} else {
  // 回退到 <link rel="prefetch"> 或直接放弃预取
}
```

### CSP 与跨站约束

- **CSP**：内联规则需在 `script-src` 加 `'inline-speculation-rules'`
- **跨站 prefetch**：需 `requires: ['anonymous-client-ip-when-cross-origin']` 隐藏客户端 IP，且 `referrer_policy` ≥ `strict-origin-when-cross-origin`——不满足会被浏览器出于隐私反跟踪静默拒绝

```json
{
  "prefetch": [
    {
      "urls": ["https://other-origin.com/page"],
      "requires": ["anonymous-client-ip-when-cross-origin"],
      "referrer_policy": "strict-origin-when-cross-origin"
    }
  ]
}
```

## 反模式与陷阱

### 懒加载反模式

- **懒加载 LCP / 首屏可见图像**：拖慢最大内容绘制，Lighthouse 直接扣分
- **懒加载图像不写 `width/height`**：① CLS；② 被浏览器判定 0×0 全在视口内 → 全量加载
- **误以为 `loading="lazy"` 在禁用 JS 时仍延迟**：实际**仅在 JS 启用时才延迟**（web.dev 原文）
- **用 `opacity:0` / `visibility:hidden` 隐藏图片以为能阻止加载**：只有 `display:none`（含父级）才会让 Chrome/Safari/Firefox 跳过加载；`opacity:0` 仍会加载
- **把 `content-visibility: auto` 当图片懒加载等价替代**：它只跳过屏外内容的「布局与绘制」，**不阻止图像下载**

### Vue 路由反模式

- **把 `defineAsyncComponent(() => import('./View.vue'))` 当路由组件**：官方明确反对——路由组件本身应是返回 Promise 的函数，不要套 async 组件

### Speculation Rules 反模式

- **对 prerender 规则设 `eagerness: eager` 并匹配全站链接**：大规模误触发，浪费 CPU/内存/流量，撞 Chrome 并发上限
- **跨站 prefetch 不设 referrer policy / requires**：被浏览器以隐私理由静默拒绝
- **不做特性检测就用 Speculation Rules**：Firefox/Safari 不支持时无回退，用户体验受损

### webpack 魔法注释反模式

- **滥用 `webpackPreload: true`**：把所有动态 import 都标 preload → 所有都「并行高优先级」= 没有优先级，反而抢当前页关键资源
- **混淆 prefetch 与 preload**：preload 服务当前页、prefetch 服务未来页——弄反了要么当前页变慢，要么未来预取失效

## 下一步

- [参考](./reference.md)：完整 API 表、eagerness 触发时机对照、浏览器版本支持表、官方资源链接
