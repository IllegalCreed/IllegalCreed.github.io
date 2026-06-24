---
layout: doc
outline: [2, 3]
---

# 资源提示

> 基于 HTML Living Standard + web.dev · 核于 2026-06

## 速查

- 资源提示告诉浏览器「提前为某资源做点准备」，是首屏性能的常用手段
- `preload`：当前页**关键**资源，高优先级早下载；**必须带 `as`**，字体还要 `crossorigin`
- `preconnect`：提前完成 DNS + TCP + TLS 握手（连第三方源用）
- `dns-prefetch`：只做 DNS 解析，`preconnect` 的轻量回退
- `prefetch`：**下一页**可能用的资源，空闲时低优先级取
- `modulepreload`：预加载 ES 模块及依赖（Baseline，2023 起广泛可用）
- `fetchpriority="high|low"`：微调资源优先级（Baseline 新近可用，2024）
- 现代整页预测：**Speculation Rules API**（`prefetch` / `prerender` 整页）—— **非 Baseline，仅 Chromium**，按渐进增强用
- 反模式：`preload` 了却没用 = 浪费带宽 + 控制台告警

## 五种提示一览

| 方式 | 触发 | 优先级 | 典型用途 |
| --- | --- | --- | --- |
| `preload` | 立即 | 高 | 当前页关键字体 / 首屏图 / 关键脚本 |
| `preconnect` | 立即 | 高 | 提前连第三方源（字体 / CDN / API） |
| `dns-prefetch` | 立即 | 低 | 仅解析域名（`preconnect` 回退） |
| `prefetch` | 空闲 | 低 | 预取下一页 HTML / 资源 |
| `modulepreload` | 立即 | 中高 | 预加载 ES 模块图 |

## `preload`：抢跑关键资源

`preload` 让浏览器**提前**下载当前页一定会用、但默认发现得晚的资源（如 CSS 里才引用的字体）：

```html
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/img/hero.jpg" as="image" />
<link rel="preload" href="/js/critical.js" as="script" />
```

两条硬规则：

1. **必须带 `as`**：告诉浏览器资源类型，以便设正确优先级、应用正确的 CSP、并能复用。漏了 `as`，资源会被下载两次甚至被丢弃。
2. **字体必须 `crossorigin`**：字体即使同源也按匿名 CORS 模式获取，漏了 `crossorigin` 会导致预加载的字体不被复用、白下一次。

`as` 常见取值：`script`、`style`、`font`、`image`、`fetch`（XHR/fetch 数据，需 `crossorigin`）、`track`、`worker`、`video`、`audio`。

响应式图片可配 `imagesrcset` / `imagesizes`：

```html
<link
  rel="preload"
  as="image"
  imagesrcset="/img/hero-480.jpg 480w, /img/hero-1024.jpg 1024w"
  imagesizes="(max-width: 600px) 480px, 1024px"
/>
```

::: warning 别 preload 用不到的东西
`preload` 是「我保证马上用」的承诺。预加载了却几秒内没用到，浏览器会在控制台警告，且白白挤占了带宽与优先级。只 preload 真正关键、且默认发现较晚的资源。
:::

## `preconnect` 与 `dns-prefetch`

连接一个第三方源要经过 DNS 解析 → TCP 握手 → TLS 协商，几个往返很费时。`preconnect` 让这套握手**提前**做好：

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="dns-prefetch" href="https://fonts.gstatic.com" />
```

- 连**会下载资源**的源（字体服务、图片 CDN、API）才值得 `preconnect`；连太多反而浪费；
- 跨源拿字体 / fetch 时记得加 `crossorigin`；
- `dns-prefetch` 只做 DNS、开销极小，常作为 `preconnect` 的回退一起写（老浏览器不支持 `preconnect` 时至少省下 DNS 时间）。

## `prefetch`：为下一跳铺路

```html
<link rel="prefetch" href="/next-article.html" />
```

`prefetch` 取的是**未来导航**可能用到的资源，浏览器在空闲时以最低优先级下载并放进缓存，用户真的点过去时就秒开。注意它是「赌下一步」，别滥用以免浪费用户流量。

## `modulepreload`：预加载 ES 模块

```html
<link rel="modulepreload" href="/js/app.js" />
```

普通 `preload ... as="script"` 不会处理模块的依赖图。`modulepreload` 专为 ES 模块设计——预取并**预解析**模块及其 `import` 的依赖，缩短模块化应用的关键路径。现代浏览器已广泛支持（Baseline，2023 起）。

## `fetchpriority`：优先级微调

```html
<link rel="preload" href="/img/hero.jpg" as="image" fetchpriority="high" />
<img src="/img/below-fold.jpg" fetchpriority="low" alt="" />
```

`fetchpriority` 取 `high` / `low` / `auto`，可加在 `<link>`、`<img>`、`<script>` 上，给浏览器的内部优先级一个明确信号——比如把首屏 LCP 图提到 `high`、把折叠下方的图降到 `low`。属于 **Baseline 新近可用**（2024，Firefox 132 起三大引擎齐全），用作锦上添花的优化、老浏览器忽略即可。

## 现代演进：Speculation Rules API

旧的 `<link rel="prerender">` 已废弃。现在用 **Speculation Rules** 声明要**预取或预渲染整页**，用一段 JSON 描述规则：

```html
<script type="speculationrules">
  {
    "prerender": [
      {
        "where": { "href_matches": "/articles/*" },
        "eagerness": "moderate"
      }
    ]
  }
</script>
```

- `prefetch`：提前取目标页文档；`prerender`：在后台**整页预渲染**，点击近乎瞬开；
- `eagerness`：`conservative` / `moderate` / `eager` 控制激进程度（越激进越早触发、越费资源）；
- 可基于 `href_matches` 规则或用户悬停 / 按下等行为触发。

::: warning 非 Baseline：仅 Chromium，必须能降级
Speculation Rules 目前**只有 Chromium 系**（Chrome / Edge）支持，Safari 与 Firefox 尚不支持，因此**不是 Baseline**。好在它是纯粹的渐进增强——不支持的浏览器会忽略这段 `<script>`，走正常导航，无副作用。可放心加，但别把功能正确性建立在「预渲染一定发生」之上。
:::

## 小结

`preload` 抢关键资源、`preconnect` 抢连接、`prefetch` 赌下一页、`modulepreload` 喂模块图、`fetchpriority` 调优先级，再到 Speculation Rules 预渲染整页——这套提示能把首屏与下一跳都显著提速，但每一个都要「用在刀刃上」，滥用即浪费。至此 H1 六页深度内容收尾，速查与链接汇总见 [参考](../reference)。
