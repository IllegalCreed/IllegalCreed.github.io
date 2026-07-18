---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 addyosmani/web-quality-skills（Addy Osmani）各 skills/ 的 SKILL.md 编写。

## 速查

- **6 技能**：`web-quality-audit`（编排）+ 5 个专项（performance / core-web-vitals / accessibility / seo / best-practices）
- **audit 编排**：跨性能(40%)/a11y(30%)/SEO(15%)/最佳实践(15%)150+ 检查，按 Critical/High/Medium/Low 分级
- **performance**：TTFB<800ms、Brotli、preconnect/preload、代码分割、AVIF/WebP、`font-display:swap`、缓存、View Transitions
- **core-web-vitals**：LCP(preload+fetchpriority)、INP(`scheduler.yield()`分片)、CLS(图片定尺寸+`font-display:optional`)
- **accessibility**：WCAG 2.2 POUR；2.2 新准则=焦点不被遮挡/目标≥24px/拖拽替代/一致帮助/避免重复输入/可访问认证
- **seo**：robots/canonical/sitemap、title 50-60 字符、单 `h1`、JSON-LD、AI 爬虫别一刀切封
- **best-practices**：HTTPS/HSTS/CSP/Trusted Types/SRI、废弃 API、无 console 报错、隐藏 source map
- **触发**：每技能 description 写「Use when…」，任务匹配自动激活

## web-quality-audit：编排全站审计

`web-quality-audit` 是**总入口技能**，编排其它 5 个技能做综合审计，覆盖 150+ 条 Lighthouse 检查。不确定该查哪块、或要做全站体检时用它。

**触发词**：`audit my site`、`quality review`、`lighthouse audit`、`check web quality`。

它按典型问题分布覆盖四大类，并按严重度分级：

| 类别 | 典型占比 | 覆盖 |
| --- | --- | --- |
| Performance | ~40% | Core Web Vitals + 50+ 性能模式 |
| Accessibility | ~30% | 40+ WCAG 规则 |
| SEO | ~15% | 30+ 搜索要求 |
| Best Practices | ~15% | 20+ 安全 / 代码质量 |

审计输出按 **Critical（安全漏洞/彻底失败）→ High（CWV 失败/重大 a11y 障碍）→ Medium（性能/SEO 机会）→ Low（代码风格/微优化）** 排列，每条给出影响与具体修复。

::: tip Lighthouse v13 说明（2025-10+）
Lighthouse 已把 Performance 类从「逐机会审计」迁移到 **Performance Insight Audits**。部分旧审计名（First Meaningful Paint、No Document Write 等）被移除或合并；CLS 相关合并为 `cls-culprits-insight`，图片相关合并为 `image-delivery-insight`。**底层建议不变，只是报告格式变了**——把旧 JSON 输出当超集看待，别当矛盾。
:::

## performance：加载与运行时性能

`performance` 深挖加载速度与运行时效率。**触发词**：`speed up`、`optimize performance`、`reduce load time`、`fix slow`。

先立**性能预算**（超了就是问题）：总页重 < 1.5 MB、JS < 300 KB、CSS < 100 KB、首屏图片 < 500 KB、字体 < 100 KB、第三方 < 200 KB（均为压缩后）。

### 关键渲染路径

- **TTFB < 800ms**：CDN、缓存、高效后端、边缘渲染
- **开启压缩**：文本资源用 Gzip / Brotli（Brotli 小 15-20%，优先）
- **HTTP/2 或 /3**：多路复用降连接开销
- **Early Hints（HTTP 103）**：源站组装慢时先回 `103` 带 `Link: rel=preload`，让浏览器提前抓取 LCP 图/关键 CSS/字体，Cloudflare 报告图片密集页 LCP 提升 20-30%

### 资源加载

```html
<!-- 预连接第三方源 -->
<link rel="preconnect" href="https://cdn.example.com" crossorigin>

<!-- 预加载 LCP 图与关键字体 -->
<link rel="preload" href="/hero.webp" as="image" fetchpriority="high">
<link rel="preload" href="/font.woff2" as="font" type="font/woff2" crossorigin>
```

用 **Speculation Rules API** 预渲染可能的下一跳（`moderate` 在悬停 ~200ms 后触发，多数意图相关、极少浪费）：

```html
<script type="speculationrules">
{ "prerender": [{ "where": { "href_matches": "/*" }, "eagerness": "moderate" }] }
</script>
```

### JS 与图片、字体

- **脚本**：`defer`（首选）/ `async`（独立脚本）/ `type="module"`（默认 defer）；代码分割 `lazy(() => import(...))`；tree shaking 只导入用到的
- **图片格式**：AVIF（92%+ 支持，压缩最好）> WebP（97%+）> PNG（透明）/ SVG（图标）；用 `<picture>` + `srcset` + `sizes` 做响应式；LCP 图 `fetchpriority="high"` `loading="eager"`，首屏下 `loading="lazy"`
- **字体**：`font-display: swap` 防隐形文本、preload 关键字体、可变字体一份顶多份、`unicode-range` 子集化

### 运行时与第三方

- **避免布局抖动**：批量读、再批量写，别读写交替触发多次重排
- **防抖 + `requestAnimationFrame`**：滚动 / resize 处理器防抖；动画用 rAF 而非 `setInterval`
- **虚拟化长列表**：`content-visibility: auto` + `contain-intrinsic-size`
- **View Transitions API**：SPA 用 `document.startViewTransition()`，MPA 用 CSS `@view-transition { navigation: auto; }`，GPU 合成、不计入 CLS
- **第三方脚本**：`async`、交互时才加载、或用 facade 占位（如 YouTube 缩略图点了再加载 iframe）

## core-web-vitals：LCP / INP / CLS

`core-web-vitals` 专攻影响 Google 搜索排名的三大指标。**触发词**：`Core Web Vitals`、`LCP`、`INP`、`CLS`、`page experience`。Google 在 **75 分位**衡量。

### LCP（最大内容渲染）< 2.5s

LCP 元素通常是 hero 图/视频、大文本块、背景图、`<svg>`。常见问题与解法：

- **服务器响应慢（TTFB>800ms）**：CDN、缓存、边缘渲染
- **渲染阻塞资源**：关键 CSS 内联，其余 `rel=preload` + `onload` 切 stylesheet
- **资源发现晚**：LCP 图 `rel=preload` + `fetchpriority="high"`
- **CSR 延迟**：LCP 内容放进初始 HTML（SSR/SSG/流式），别等 JS 才渲染

### INP（交互到下次绘制）< 200ms

INP = **输入延迟 + 处理时间 + 呈现延迟**。核心是别让长任务阻塞主线程：

```javascript
// 长任务分片 + 让出调度器（scheduler.yield() 是推荐的现代 API）
async function processLargeArray(items) {
  const CHUNK = 100;
  for (let i = 0; i < items.length; i += CHUNK) {
    items.slice(i, i + CHUNK).forEach(expensiveOperation);
    if ('scheduler' in window && 'yield' in scheduler) await scheduler.yield();
    else await new Promise(r => setTimeout(r, 0)); // 回退
  }
}
```

其它：事件处理器先给即时视觉反馈再让出、第三方脚本交互时才加载、React/Vue 用 `memo` 避免过度重渲染。

### CLS（累计布局偏移）< 0.1

CLS = 影响分数 × 距离分数。常见成因与修复：

- **图片没尺寸**：加 `width`/`height` 或 `aspect-ratio`
- **广告 / 嵌入 / iframe**：用 `min-height` 或 `aspect-ratio` 容器预留空间
- **动态注入内容**：插在视口下方，或用 `transform` 动画进入
- **Web 字体 FOUT**：`font-display: optional` 或匹配回退字体度量（`size-adjust`/`ascent-override`）
- **动画触发布局**：只动 `transform` / `opacity`，别动 `height` / `width`

## accessibility：WCAG 2.2 无障碍

`accessibility`（技能版本 1.1）基于 WCAG 2.2 与 Lighthouse a11y 审计。**触发词**：`accessibility`、`a11y`、`WCAG`、`screen reader`、`keyboard navigation`。目标：让所有人（含残障用户）可用。

四大原则 **POUR**：Perceivable（可感知）、Operable（可操作）、Understandable（可理解）、Robust（健壮）。合规级 A / AA / AAA，**AA 是多数司法辖区的法律要求**。

- **Perceivable**：每张 `<img>` 有有意义的 `alt`（装饰图 `alt=""`）；文本对比度 ≥ 4.5:1（大文本 3:1）；别只靠颜色传达（配图标/文字）；视频有字幕、音频有文字稿
- **Operable**：全键盘可达、无键盘陷阱；`:focus-visible` 保留可见焦点；skip link 跳过导航；尊重 `prefers-reduced-motion`
- **Understandable**：`<html lang>` 声明语言；导航跨页一致；每个 input 有关联 `<label>`；错误用 `role="alert"` 播报、`aria-invalid` 标注
- **Robust**：**优先原生元素**（`<button>` 而非 `<div role="button">`）；`aria-live` 播报动态内容

::: tip WCAG 2.2 新增准则（这套技能特别覆盖）
- **焦点不被遮挡（2.4.11）**：聚焦元素不能被 sticky 头/尾完全挡住，用 `scroll-margin-top`
- **目标尺寸（2.5.8）**：交互目标 ≥ **24×24 CSS 像素**（推荐 44×44）
- **拖拽动作（2.5.7）**：任何拖拽必须有单指针替代（按钮/输入）
- **一致帮助（3.2.6）**：重复出现的帮助入口保持相同相对顺序
- **避免重复输入（3.3.7）**：同一会话别让用户重填已提供的信息
- **可访问认证（3.3.8）**：登录别只靠记忆/解谜，提供 passkey / 邮件链接 / 允许粘贴
:::

## seo：搜索引擎优化

`seo` 基于 Lighthouse SEO 审计与 Google 搜索指南。**触发词**：`SEO`、`search optimization`、`meta tags`、`structured data`、`sitemap`。

- **技术 SEO**：`robots.txt` 别挡渲染资源、`<link rel="canonical">` 防重复内容、XML sitemap（单文件 ≤ 5 万 URL / 50MB）、URL 用连字符小写短
- **页面 SEO**：`<title>` 50-60 字符、`<meta description>` 150-160 字符、**单个 `<h1>`** 且层级不跳级、锚文本描述性（别用「click here」）
- **结构化数据（JSON-LD）**：`Organization` / `Article` / `Product` / `FAQPage` / `BreadcrumbList`，用 [Rich Results Test](https://search.google.com/test/rich-results) 校验
- **移动 SEO**：`<meta name="viewport" content="width=device-width, initial-scale=1">`、点击目标 ≥ 48px、正文 ≥ 16px
- **AI 搜索可见性（新兴）**：别一刀切封 AI 爬虫（`OAI-SearchBot`/`PerplexityBot`/`ClaudeBot` 各是独立 UA，按需决定）；靠 schema.org 结构化数据更易被 AI 摘要解析；首段答案自包含。`llms.txt` 目前无主流厂商确认读取，当 5 分钟投机性尝试即可，别围它重构内容

## best-practices：安全与代码质量

`best-practices` 基于 Lighthouse best practices 审计。**触发词**：`best practices`、`security audit`、`modern standards`、`code quality`。

- **安全**：全站 HTTPS 无混合内容 + HSTS；CSP（含 `frame-ancestors`/`base-uri`/`form-action`）；**Trusted Types** 防 DOM-XSS（`require-trusted-types-for 'script'`，2026 初起主流浏览器 Baseline）；第三方 `<script>`/`<link>` 用 **SRI** 钉哈希（polyfill.io 2024 供应链攻击教训）；`npm audit` 查依赖漏洞
- **别再用 `X-XSS-Protection`**：旧 XSS 审计器已废弃移除，用严格 CSP + Trusted Types 替代
- **浏览器兼容**：`<!DOCTYPE html>`、`<meta charset="UTF-8">` 放 `<head>` 第一个、viewport 标签、特性检测（`'IntersectionObserver' in window`）而非 UA 嗅探
- **废弃 API**：别用 `document.write` / 同步 XHR / AppCache；滚动/触摸监听加 `{ passive: true }`
- **控制台与错误**：生产无 console 报错、error boundary、全局 `error`/`unhandledrejection` 上报
- **Source map**：生产用 `hidden-source-map` 并从上传的 map 里剥离 `sourcesContent`（Vite 用 `sourcemap: 'hidden'`）
- **代码质量**：无重复 ID、语义化 HTML（`<header>`/`<nav>`/`<main>`/`<article>`）、图片保持真实宽高比

## 触发机制与反模式

技能装后**自动激活**——agent 靠每个 `SKILL.md` frontmatter 的 `description`（含「Use when…」+ 触发短语）判断是否匹配当前任务，也可自然语言显式触发。

常见反模式（这套技能会揪出的）：

- 图片无 `width`/`height` → CLS 飙升
- LCP 图未 preload / 被 JS 渲染 → LCP 慢
- 长任务不分片阻塞主线程 → INP 差
- `<div onclick>` 当按钮 → 键盘不可达、a11y 失败
- 只靠颜色传达状态 → 对比 / 色盲失败
- 从不受控 CDN 加载 polyfill 且无 SRI → 供应链风险

## 下一步

- [参考](./reference) —— 6 技能全表 + 触发词 + CWV 阈值 + 性能预算 + 许可 + 链接
- 上游：[addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills)
