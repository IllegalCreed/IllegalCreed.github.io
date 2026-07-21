---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 MDN（Intersection Observer / Speculation Rules）、web.dev（Browser-level image lazy loading）、Vue Router 官方文档、Chrome for Developers（Prerender pages）+ webpack 魔法注释官方说明编写

## 速查

- **`<img loading>`**：`lazy`（视口外延迟）/ `eager`（默认）；仅 JS 启用时延迟；不支持 CSS 背景图
- **IntersectionObserver**：`root: null`、`rootMargin: '200px 0px'`、`threshold: 0` + `unobserve()`
- **Vue Router 路由懒加载**：`component: () => import('./View.vue')`（不要套 `defineAsyncComponent`）
- **webpack 魔法注释**：`/* webpackPrefetch: true */`（未来导航、低优先级）/ `/* webpackPreload: true */`（当前页、高优先级）
- **Speculation Rules**：`prefetch`（仅文档响应）/ `prerender`（完整渲染）；eagerness 四档；默认 list→immediate、where→conservative
- **Chrome 并发上限**：immediate 档 50 prefetch / 10 prerender
- **Chromium-only**：`HTMLScriptElement.supports('speculationrules')` 检测 + `<link rel="prefetch">` 回退；CSP `'inline-speculation-rules'`
- 完整说明见 [入门](./getting-started.md) / [深入指南](./guide-line.md)

## loading 属性表

| 元素 | 取值 | 行为 |
| --- | --- | --- |
| `<img>` | `lazy` | 视口外延迟加载 |
| `<img>` | `eager`（默认） | 立即加载，等价不写 |
| `<iframe>` | `lazy` | 视口外延迟加载 |
| `<iframe>` | `eager`（默认） | 立即加载 |
| CSS `background-image` | — | **不支持** loading 属性，需用 IO |

**五个关键事实**

| 事实 | 说明 |
| --- | --- |
| 仅 JS 启用时才延迟 | 禁用 JS 时正常加载（web.dev 明确） |
| 不支持时不报错 | 旧浏览器忽略属性，正常加载（优雅降级） |
| 必须写 width/height | 不写会 CLS，或被判定 0×0 全在视口内全量加载 |
| 仅 `<img>` / `<iframe>` | 背景图、`<video>`、`<source>` 都不支持 |
| iframe 支持较晚 | Firefox 121 / Safari 16.4 才齐，晚于 img |

## IntersectionObserver API 速查

### 构造器与字段

```ts
new IntersectionObserver(callback, options);

const options = {
  root: null, // 祖先元素，null = 视口
  rootMargin: "200px 0px", // 围绕 root 的边距，正值=提前触发
  threshold: 0, // 0~1，目标可见比例阈值
};
```

### 实例方法

| 方法 | 作用 |
| --- | --- |
| `observe(target)` | 开始监听目标元素 |
| `unobserve(target)` | 停止监听单个目标（懒加载常用） |
| `disconnect()` | 停止监听所有目标并释放 |
| `takeRecords()` | 立即取出待处理回调（罕见用） |

### 回调 entry 常用字段

| 字段 | 含义 |
| --- | --- |
| `entry.target` | 被监听的元素 |
| `entry.isIntersecting` | 是否相交（懒加载判断条件） |
| `entry.intersectionRatio` | 相交比例（0~1） |
| `entry.boundingClientRect` | 目标边界矩形 |
| `entry.rootBounds` | root 边界矩形 |

### 懒加载场景惯例

| 字段 | 推荐值 | 原因 |
| --- | --- | --- |
| `root` | `null` | 相对视口 |
| `rootMargin` | `"200px 0px"` 或 `"25%"` | 提前预取，避免滚到时看到空白 |
| `threshold` | `0` | 任何像素进入即触发 |
| 回调内 | `observer.unobserve(target)` | 加载完释放 |

## Vue defineAsyncComponent 选项表

| 字段 | 类型 | 作用 |
| --- | --- | --- |
| `loader` | `() => Promise<Component>` | 加载函数，典型 `() => import(...)` |
| `loadingComponent` | `Component` | 加载中显示 |
| `delay` | `number`（ms） | 显示 loading 前的延迟，防闪烁 |
| `timeout` | `number`（ms） | 超时时间 |
| `errorComponent` | `Component` | 加载失败显示 |
| `onError` | `(err) => boolean \| Promise<boolean>` | 失败回调，返回 true 重试 |

> Vue Router 路由用 `component: () => import(...)`，**不要**把 `defineAsyncComponent` 用在路由组件上（官方明确反对）。

## webpack 魔法注释表

| 注释 | 生成 | 优先级 | 时机 | 用途 |
| --- | --- | --- | --- | --- |
| `/* webpackPrefetch: true */` | `<link rel="prefetch">` | 低 | 浏览器空闲时 | 未来可能跳转的 chunk |
| `/* webpackPreload: true */` | `<link rel="preload">` | 高 | 与当前 chunk 并行 | 当前页必用的晚发现 chunk |
| `/* webpackChunkName: "x" */` | — | — | — | 命名/分组 chunk |

## Speculation Rules API 速查

### prefetch vs prerender

| 动作 | 做什么 | 子资源 | 代价 | 适用 |
| --- | --- | --- | --- | --- |
| `prefetch` | 仅下载文档响应 | 不含 | 小 | 加速下一页 TTFB |
| `prerender` | 完整渲染（含 JS 与数据 fetch） | 含 | 大（CPU/内存/流量） | 高概率跳转，激活近乎瞬时 |

### eagerness 四档触发时机表

| 值 | 触发时机 | 默认用于 |
| --- | --- | --- |
| `immediate` | 命中规则即拉 | `urls` 列表规则（默认） |
| `eager` | 鼠标 hover 链接 | 高概率跳转 |
| `moderate` | pointerdown 按下 | 中等概率 |
| `conservative` | pointerdown 且有犹豫（按下到抬起间隔） | `where(document)` 规则（默认） |

### Chrome 并发上限

| 动作 | immediate 档并发上限 |
| --- | --- |
| prefetch | **50** |
| prerender | **10** |

### 关键约束

| 约束 | 说明 |
| --- | --- |
| 仅 Chromium | MDN 标注 Experimental、非 Baseline；Firefox/Safari 未默认支持 |
| 特性检测 | `HTMLScriptElement.supports('speculationrules')` |
| 回退方案 | `<link rel="prefetch">`（更老的语法） |
| CSP | 内联规则需 `script-src 'inline-speculation-rules'` |
| 跨站 prefetch | `requires: ['anonymous-client-ip-when-cross-origin']` + `referrer_policy` ≥ `strict-origin-when-cross-origin` |
| HTTP 响应头 | `Speculation-Rules: "/path/to/rules.json"`（无法改 HTML 时用） |

### 完整示例

```html
<!-- 内联规则 -->
<script type="speculationrules">
  {
    "prefetch": [
      {
        "where": { "href_matches": "/*" },
        "eagerness": "eager"
      }
    ],
    "prerender": [
      {
        "where": { "href_matches": "/products/*" },
        "eagerness": "moderate"
      },
      {
        "urls": ["/checkout"],
        "eagerness": "conservative"
      }
    ]
  }
</script>
```

```json
// 外部 JSON（用 Speculation-Rules 头指向）
{
  "prefetch": [
    {
      "urls": ["https://cdn.example.com/next-page"],
      "requires": ["anonymous-client-ip-when-cross-origin"],
      "referrer_policy": "strict-origin-when-cross-origin"
    }
  ]
}
```

```ts
// 特性检测
if (
  "supports" in HTMLScriptElement &&
  HTMLScriptElement.supports("speculationrules")
) {
  // 支持 Speculation Rules
} else {
  // 回退
}
```

## content-visibility 速查

| 属性 | 作用 |
| --- | --- |
| `content-visibility: auto` | 屏外元素跳过布局与绘制（纯 CSS 渲染懒加载） |
| `content-visibility: visible`（默认） | 正常渲染 |
| `content-visibility: hidden` | 类似 `display: none` 但保留状态 |
| `contain-intrinsic-size: <size>` | 屏外时占位的固有尺寸，防滚动条抖动 |

> 关键：**`content-visibility: auto` 不阻止子元素（含 `<img>`）的网络下载**——它是渲染层懒加载，与 IO（下载层）互补而非替代。

## 浏览器支持版本（2026-07）

| 特性 | Chrome | Edge | Firefox | Safari | 状态 |
| --- | --- | --- | --- | --- | --- |
| `<img loading="lazy">` | 77+ | 79+ | 75+ | 15.4+ | Baseline Widely Available |
| `<iframe loading="lazy">` | 77+ | 79+ | 121+ | 16.4+ | Baseline |
| Intersection Observer API | 51+ | 79+ | 55+ | 12.1+ | Baseline Widely Available |
| `content-visibility: auto` | 85+ | 85+ | 125+ | 17.0+ | Baseline |
| Speculation Rules（prefetch） | 121+ | 121+ | ❌ | ❌ | Experimental · 非 Baseline |
| Speculation Rules（完整 prerender） | 121+ | 121+ | ❌ | ❌ | Experimental · 非 Baseline |
| `HTMLScriptElement.supports` | 121+ | 121+ | ❌ | ❌ | Experimental |

> Speculation Rules：MDN 标注 Experimental、非 Baseline；Firefox/Safari 截至 2026-07 未默认支持。生产用必须特性检测 + 回退。

## 版本与运行环境

| 项 | 取值 |
| --- | --- |
| `<img loading="lazy">` Baseline | 2022 年起 Widely Available |
| Speculation Rules 完整 prerender | Chrome 121+（2024-01） |
| Vue Router 路由懒加载 | 稳定多年，无版本门槛 |
| React.lazy + Suspense | React 16.6+ |
| webpack 魔法注释 prefetch/preload | webpack 2.4+ / 4.x 起广泛使用 |
| Vite 等价 | 通过插件或 `import.meta.prefetch`（实验）实现 |

## 官方资源

- web.dev 图像懒加载：[https://web.dev/articles/browser-level-image-lazy-loading](https://web.dev/articles/browser-level-image-lazy-loading)
- MDN Intersection Observer API：[https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- MDN loading 属性（img）：[https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img#attr-loading](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img#attr-loading)
- MDN Speculation Rules API：[https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API)
- MDN `<script type="speculationrules">`：[https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/speculationrules](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/speculationrules)
- Vue Router 路由懒加载：[https://router.vuejs.org/guide/advanced/lazy-loading.html](https://router.vuejs.org/guide/advanced/lazy-loading.html)
- Vue defineAsyncComponent：[https://vuejs.org/guide/components/async.html](https://vuejs.org/guide/components/async.html)
- React.lazy：[https://react.dev/reference/react/lazy](https://react.dev/reference/react/lazy)
- Chrome for Developers Prerender pages：[https://developer.chrome.com/docs/web-platform/prerender-pages](https://developer.chrome.com/docs/web-platform/prerender-pages)
- web.dev Speculation Rules：[https://web.dev/articles/speculative-rules](https://web.dev/articles/speculative-rules)
- webpack Magic Comments：[https://webpack.js.org/api/module-methods/#magic-comments](https://webpack.js.org/api/module-methods/#magic-comments)
- WICG nav-speculation（GitHub）：[https://github.com/WICG/nav-speculation](https://github.com/WICG/nav-speculation)
