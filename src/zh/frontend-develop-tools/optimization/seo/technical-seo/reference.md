---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Google Search Central（developers.google.com/search/docs）+ sitemaps.org + web.dev + llmstxt.org 官方文档编写，对照 2026-03 ~ 2026-04 最新页面

## 速查

- Google 三阶段：**crawl → render（WRS / evergreen Chromium，可能延迟数秒到更久）→ index**
- robots.txt **只管 crawl**；robots.txt 的 `Noindex` 指令 **Google 自 2019 年起不再支持**
- 重定向可靠性梯度：**server-side 301/308 > 302/303/307 > meta refresh > JS location > crypto**
- hreflang 三种等价实现：**HTML link / HTTP Link 头 / XML sitemap xhtml:link**；必须**双向链接 + 含自身 + x-default**
- CWV SEO 阈值：**LCP ≤ 2.5s / INP ≤ 200ms（2024-03 替代 FID）/ CLS ≤ 0.1**
- sitemap 单文件：**≤ 50000 URLs / 50MB**；超限用 **sitemap index**（≤ 50000 子 sitemap）
- 动态渲染：**was a workaround**（过去式），非推荐方案
- llms.txt：`/llms.txt` + `/llms-full.txt`，**新兴提案 v1.7.0**，补充而非替代
- 完整说明见 [入门](./getting-started.md) / [核心配置详解](./guide-line.md)

## robots 指令完整表

### robots.txt 指令（控制 crawl）

| 指令 | 含义 | 示例 |
| --- | --- | --- |
| `User-agent: *` | 适用所有爬虫 | — |
| `Disallow: /private` | 禁止抓取该路径 | — |
| `Allow: /public` | 允许抓取（覆盖 Disallow） | — |
| `Sitemap: <url>` | 宣告 sitemap 位置（可多条） | — |
| `Crawl-delay: 10` | 抓取间隔（**Google 不支持**，Bing 支持） | — |

> robots.txt 的 **`Noindex:` 指令 Google 自 2019 年起不再支持**并会发 Search Console 警告。

### robots meta tag / X-Robots-Tag 指令值（控制 index）

| 指令 | 含义 |
| --- | --- |
| `all` | 默认；等同 `index, follow` |
| `noindex` | 不进索引 |
| `nofollow` | 不跟踪该页的链接 |
| `nosnippet` | 不在搜索结果摘要里显示文本片段 / 视频预览（保留图片缩略图） |
| `noarchive` | 不显示「网页快照」链接 |
| `notranslate` | 不提供搜索结果翻译 |
| `noimageindex` | 不索引该页的图片 |
| `unavailable_after: <RFC850>` | 指定时间后不再索引 |
| `max-snippet: <数字>` | 片段最大字符数 |
| `max-image-preview: large\|standard\|none` | 图片预览级别 |
| `max-video-preview: <数字>` | 视频预览秒数 |

### data-nosnippet（HTML 布尔属性）

| 元素 | 用法 |
| --- | --- |
| `<div data-nosnippet>` | 该 div 内文字不用于搜索片段 |
| `<span data-nosnippet>` | 该 span 内文字不用于搜索片段 |
| `<section data-nosnippet>` | 该 section 内文字不用于搜索片段 |

> 值被忽略——是布尔属性。仅限 div / span / section。

## 重定向完整表

| 类型 | 状态码 / 形式 | 类别 | canonical 信号 | 可靠性 |
| --- | --- | --- | --- | --- |
| **301** | 永久重定向 | server-side | **传** | 最高 |
| **308** | 永久重定向（保留方法与 body） | server-side | **传** | 最高 |
| **302** | 临时重定向 | server-side | 不传 | 高 |
| **303** | See Other（GET 重定向） | server-side | 不传 | 高 |
| **307** | 临时重定向（保留方法与 body） | server-side | 不传 | 高 |
| **meta refresh 0s** | `<meta http-equiv="refresh" content="0; url=...">` | HTML | 视为永久 | 中 |
| **meta refresh >0s** | content="3; url=..." | HTML | 视为临时 | 中 |
| **JS location** | `window.location.href = ...` | 客户端 | 不传 | 低（渲染失败即失效） |
| **crypto 重定向** | JS 加密跳转 | 客户端 | 不传 | 极低（不推荐） |

### 选择规则

- **永久迁移 / 换域名 / HTTPS 升级**：301 / 308
- **临时维护 / A/B 测试**：302 / 307
- **无法改服务器**：meta refresh 0s（fallback）
- **绝不推荐**：JS location / crypto

## hreflang 三种等价实现

### 1. HTML link（最常用）

```html
<link rel="alternate" hreflang="en" href="https://example.com/en/" />
<link rel="alternate" hreflang="zh-Hans" href="https://example.com/zh/" />
<link rel="alternate" hreflang="ja" href="https://example.com/ja/" />
<link rel="alternate" hreflang="x-default" href="https://example.com/en/" />
```

### 2. HTTP Link 头

```text
Link: <https://example.com/en/>; rel="alternate"; hreflang="en",
      <https://example.com/zh/>; rel="alternate"; hreflang="zh-Hans",
      <https://example.com/ja/>; rel="alternate"; hreflang="ja",
      <https://example.com/en/>; rel="alternate"; hreflang="x-default"
```

### 3. XML sitemap（需 xmlns:xhtml 命名空间）

```xml
<url>
  <loc>https://example.com/</loc>
  <xhtml:link rel="alternate" hreflang="en" href="https://example.com/en/" />
  <xhtml:link rel="alternate" hreflang="zh-Hans" href="https://example.com/zh/" />
  <xhtml:link rel="alternate" hreflang="x-default" href="https://example.com/en/" />
</url>
```

### hreflang 编码规则

| 类型 | 标准 | 示例 |
| --- | --- | --- |
| 语言码 | **ISO 639-1**（在前） | `en / zh / ja / fr / de / nl` |
| 区域码 | **ISO 3166-1 Alpha 2**（在后） | `US / CN / JP / BE` |
| 脚本码 | **ISO 15924**（可选） | `zh-Hant / zh-Hans` |
| 兜底 | `x-default` | 兜住未匹配语言 |

**易混淆编码**：

- `be` = **白俄罗斯语**（不是比利时）—— 比利时须用 `nl-be / fr-be / de-be`
- `zh-Hans` / `zh-Hant`：脚本码须用 ISO 15924，不是 `cn / tw`

### hreflang 强制要求

- **必须双向链接**：X 指向 Y，Y 必须指回 X，否则整个注解被忽略
- **每页列出自身 + 全部变体**：不能漏掉自己
- **配 x-default 兜底**

## Core Web Vitals 阈值表

| 指标 | 含义 | Good | Needs Improvement | Poor | 替代关系 |
| --- | --- | --- | --- | --- | --- |
| **LCP** | 最大内容绘制（加载） | ≤ 2.5s | 2.5–4s | > 4s | — |
| **INP** | 交互到下次绘制 | ≤ 200ms | 200–500ms | > 500ms | **2024-03 替代 FID** |
| **CLS** | 累计布局偏移（分数） | ≤ 0.1 | 0.1–0.25 | > 0.25 | — |

### field 数据采集

使用 [`web-vitals` 库](https://github.com/GoogleChrome/web-vitals)：

```js
import { onLCP, onINP, onCLS } from 'web-vitals';

onLCP(console.log);
onINP(console.log);
onCLS(console.log);
```

或看 [PageSpeed Insights](https://pagespeed.web.dev) / CrUX 报告（p75 分位数）。

> CWV 是 page experience 排名**信号之一**，非决定性因素。底层优化机制（预加载 / 长任务拆分 / 尺寸预留）归【性能优化】章。

## URL 结构速查

| 规则 | 推荐 | 反例 | 原因 |
| --- | --- | --- | --- |
| 分词 | `/black-pink-shoes` | `/black_pink_shoes` | 下划线不分词（编程语言命名习惯） |
| 大小写 | 统一小写 `/apple` | `/Apple` | 大小写敏感，会分裂权重 |
| 路由 | History API `/products/123` | hash `/#/products/123` | Googlebot 不能可靠解析 fragment |
| 长度 | 简洁描述 `/blog/seo` | 长 ID `/post/1234567890` | 描述性词利于可读 / 抓取 |
| canonical / hreflang | 绝对 URL | 相对路径 | 相对路径在 hreflang 中可能误解析 |

## sitemap 限制速查

| 项 | 上限 |
| --- | --- |
| 单 sitemap URLs | **50000** |
| 单 sitemap 大小（未压缩） | **50MB** |
| 单 sitemap index 子 sitemap | **50000** |
| 编码 | UTF-8 |
| 压缩 | 可 gzip |

## 版本与时效变化

| 变化 | 时间 | 说明 |
| --- | --- | --- |
| **INP 替代 FID** | 2024-03 | FID 从 Core Web Vitals 移除；当前三指标为 LCP / INP / CLS |
| **robots.txt `Noindex` 停止支持** | 2019 | Google 不再支持，会发 Search Console 警告 |
| **动态渲染定位 workaround** | 文档 last updated 2025-12-10 | 官方改用过去式 was a workaround |
| **移动优先索引默认开启** | 2021-03 | 对所有新站默认启用；目前已对绝大多数站生效 |
| **Google 三阶段文档** | JS SEO basics 2026-03-04；Redirects 2026-04-14 | 当前最新 |
| **llms.txt 规范** | 约 v1.7.0 | 新兴提案，采用率仍在发展 |

## 官方资源

- Google Search Central 文档：[https://developers.google.com/search/docs](https://developers.google.com/search/docs)
- JavaScript SEO 基础：[https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- 动态渲染 workaround：[https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering](https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering)
- 重定向与 Google 搜索：[https://developers.google.com/search/docs/crawling-indexing/301-redirects](https://developers.google.com/search/docs/crawling-indexing/301-redirects)
- 合并重复 URLs（canonicalization）：[https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- 移动优先索引：[https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-first-indexing](https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-first-indexing)
- URL 结构：[https://developers.google.com/search/docs/crawling-indexing/url-structure](https://developers.google.com/search/docs/crawling-indexing/url-structure)
- robots meta tag / X-Robots-Tag：[https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)
- 用 noindex 阻止索引：[https://developers.google.com/search/docs/crawling-indexing/block-indexing](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- Core Web Vitals / Page experience：[https://developers.google.com/search/docs/appearance/page-experience](https://developers.google.com/search/docs/appearance/page-experience)
- sitemaps.org 协议：[https://www.sitemaps.org/protocol.html](https://www.sitemaps.org/protocol.html)
- web.dev Core Web Vitals：[https://web.dev/articles/vitals](https://web.dev/articles/vitals)
- llmstxt.org：[https://llmstxt.org/](https://llmstxt.org/)
- MDN X-Robots-Tag：[https://developer.mozilla.org/docs/Web/HTTP/Headers/X-Robots-Tag](https://developer.mozilla.org/docs/Web/HTTP/Headers/X-Robots-Tag)
- web-vitals 库：[https://github.com/GoogleChrome/web-vitals](https://github.com/GoogleChrome/web-vitals)
