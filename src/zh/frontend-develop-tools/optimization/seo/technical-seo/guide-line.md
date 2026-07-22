---
layout: doc
outline: [2, 3]
---

# 核心配置详解

> 基于 Google Search Central（developers.google.com/search/docs）+ sitemaps.org + web.dev + llmstxt.org 官方文档编写，对照 2026-03 ~ 2026-04 最新页面。**边界**：CWV 的底层优化机制（如何减小 LCP / 降低 INP / 消除 CLS）归【性能优化】章，本页只讲 CWV 作为 Google page experience 排名信号对 SEO 的影响；SSR / SSG / prerender 的框架实现（Nuxt SSR / Vite SSG 插件 / hydration 调试）归【框架】章，本页只讲不同渲染模式对爬虫可访问性的意义。

## 速查

- 让爬虫拿到完整 HTML：**SSR / SSG / prerender > 动态渲染（workaround，非推荐）> 纯 CSR**
- 动态渲染 ≠ cloaking：内容**相似** = 非 cloaking，**完全不同** = cloaking（违反垃圾政策）
- robots.txt **只管 crawl**（Disallow / Allow）；robots.txt 的 `Noindex` 指令 **Google 自 2019 年起不再支持**
- 控制 indexing：`<meta name="robots" content="noindex">` 或 `X-Robots-Tag` HTTP 头（取最严格值）
- canonical：Google 综合约 **40 个信号**判定；**写在 HTML head**，不要 JS 注入；不要写多个
- 重定向可靠性梯度：**server-side 301/308（永久，传 canonical） > 302/303/307（临时，不传） > meta refresh（0s 永久 / >0s 临时） > JS location（渲染失败即失效） > crypto（不可靠）**
- hreflang：**必须双向链接 + 含自身 + x-default 兜底**；三种等价实现（HTML link / HTTP Link 头 / sitemap xhtml:link）；语言码 ISO 639-1 在前，`be` = **白俄罗斯语**（非比利时），比利时须 `nl-be / fr-be / de-be`
- URL：**连字符分词**（下划线不分词）、**大小写敏感**（`/Apple` ≠ `/apple` 会分裂权重）、**History API 替代 fragment** 路由
- 移动优先：移动版即索引来源，与桌面版**内容 / meta / 结构化数据 / 图片 alt 全对等**，移动版不能 noindex
- CWV SEO 阈值：**LCP ≤ 2.5s / INP ≤ 200ms（2024-03 替代 FID）/ CLS ≤ 0.1**；是 page experience 排名**信号之一**（非决定性）
- sitemap：单文件 ≤ **50000 URLs / 50MB**（未压缩），超限用 sitemap index（最多 50000 子 sitemap）
- SPA 防 soft 404：API 判定不存在时**跳服务端真实 404** 或**动态注入 `<meta name=robots content=noindex>`**
- llms.txt：`/llms.txt`（概览） + `/llms-full.txt`（全量）；**新兴提案**，补充而非替代 robots / sitemap

## 爬虫可访问性：渲染模式选择

让爬虫能拿到完整 HTML 是技术 SEO 的第一关。按对爬虫友好度排序：

### SSR / SSG / Prerender（首选）

- **SSR（Server-Side Rendering）**：每次请求时服务器渲染完整 HTML
- **SSG（Static Site Generation）**：构建时预渲染所有页面
- **Prerender**：构建时或运行时把 CSR 页面预渲染为静态 HTML

三者都让爬虫在 **crawl 阶段直接拿到完整内容**，无需进入渲染队列，是技术 SEO 的最优选。

> Google 虽能跑 JS，但渲染队列有延迟（数秒到更久），且非 200 状态码可能跳过渲染。server-side / pre-rendering 让用户和爬虫都更快、内容即时可见。

### 动态渲染（Dynamic Rendering，workaround）

**官方定位**：Google 文档已用**过去式**（was a workaround）描述动态渲染，明确是**过渡方案而非推荐方案**，推荐迁向 SSR / SSG / hydration。

- **机制**：中间层（如 Rendertron、prerender.io）按 User-Agent 区分——爬虫拿到预渲染 HTML，用户拿到正常 CSR 页面
- **何时仍用**：大型复杂 SPA 短期内无法重构 SSR 时的过渡
- **与 cloaking 的边界**：返回**内容相似**的页面 = 非 cloaking；返回**完全不同**内容（猫页给用户、狗页给爬虫）= cloaking，违反 Google 垃圾政策

> 不要把动态渲染当作长期方案。增加运维复杂度与资源开销，应迁向 SSR / SSG / hydration。

### 纯 CSR（不推荐）

完全依赖客户端 JS 渲染内容——爬虫需进渲染队列、可能延迟、可能渲染失败、非 200 状态码可能跳过。新站应避免。

## robots.txt vs robots meta：抓取 vs 索引

这是最易混的一对，务必分清：

| 维度 | robots.txt | robots meta / X-Robots-Tag |
| --- | --- | --- |
| **作用** | 控制 **crawl**（抓不抓） | 控制 **index**（收不收） |
| **指令** | `User-agent` / `Disallow` / `Allow` / `Sitemap:` | `noindex` / `nofollow` / `nosnippet` / `noarchive` 等 |
| **位置** | 站点根 `/robots.txt` | HTML `<head>` 或 HTTP 响应头 |
| **`Noindex` 支持** | **Google 自 2019 年起不再支持**（会发 Search Console 警告） | 完全支持 |
| **误用陷阱** | 用 robots.txt Disallow 封锁想 noindex 的页面 → 爬虫不抓 → meta noindex 没被发现 → 页面仍可能因外链被索引 | — |

**正确分工**：

- 想让 Google 别**抓**（节省抓取配额、保护私密路径）：robots.txt `Disallow`
- 想让 Google 别**收录**（已抓但不要进索引）：`<meta name="robots" content="noindex">` 或 `X-Robots-Tag: noindex`
- **不要用 robots.txt 阻止 indexing**——它做不到，且会阻止 meta noindex 被发现

> 反模式：在 robots.txt 写 `Noindex: /private` 指望阻止收录——Google 不支持该指令；正确做法是 robots meta noindex 或 X-Robots-Tag，且 robots.txt 别封锁该路径。

### X-Robots-Tag：非 HTML 资源与精细控制

- **HTTP 响应头**形式，适用于 PDF / 图片 / 视频等**非 HTML 资源**（robots meta 只作用 HTML）
- 可针对**特定 UA**精细控制：`X-Robots-Tag: googlebot: noindex`
- 与 robots meta 同时存在时，取**最严格值**

### data-nosnippet：元素级片段控制

HTML 布尔属性，**仅限 `<div> / <span> / <section>`**，标记该元素内的内容**不得用于搜索片段**：

```html
<div data-nosnippet>这段文字不会出现在搜索结果摘要里</div>
```

> 值被忽略——是布尔属性，不要写 `data-nosnippet="true"`。

## canonical：合并重复 URL

Google 用**约 40 个信号**综合判定 canonical URL，包括：

- `<link rel="canonical" href="...">`（head 内声明，**最强信号**）
- sitemap 中列出的 URL
- 301 永久重定向
- 内链的一致性（站内主要链接指向哪个版本）
- 外链、HTTPS 偏好、URL 简洁度等

### 最佳实践

- **写在 HTML head**，不要用 JS 注入（有渲染时机风险）
- 全页**只有一个 canonical**
- 指向的 URL 是**绝对 URL**且可访问
- 与 sitemap / 内链 / 重定向保持一致

### 反模式

- **JS 注入 canonical 与原 HTML 不同** → 冲突 → Google 选出意外 canonical 甚至忽略
- **多个 `<link rel=canonical>`** → 冲突 → 意外结果
- **canonical 指向 404 / 软重定向链** → 信号失效

> 如必须 JS 注入 canonical，确保全页只有一个且值与原 HTML 一致。

## 重定向：可靠性梯度

Google 官方给出明确的可靠性梯度：

| 类型 | 状态码 / 形式 | 可靠性 | canonical 信号 |
| --- | --- | --- | --- |
| **Server-side 永久** | 301 / 308 | 最高 | 传递 |
| **Server-side 临时** | 302 / 303 / 307 | 高 | 不传递 |
| **meta refresh** | `<meta http-equiv="refresh" content="0; url=...">` | 中 | 0s=永久 / >0s=临时 |
| **JS location** | `window.location` | 低 | 渲染失败即完全失效 |
| **crypto 重定向** | JS 加密跳转 | 极低 | 不可靠，不推荐 |

### 何时用哪个

- **永久迁移 / 换域名 / HTTPS 升级 / 合并重复 URL**：301 / 308（传 canonical 信号，新旧 URL 都进索引 → 旧 URL 退出，新 URL 接收权重）
- **临时维护 / A/B 测试 / 季节性页面**：302 / 307（不传 canonical，旧 URL 仍在索引）
- **无法改服务器配置**：meta refresh（0s 视为永久）—— 不推荐，仅作 fallback
- **JS location**：**最不推荐**——一旦渲染失败（爬虫跳过、JS 报错）就完全失效

> 反模式：永久迁移却用 302 临时重定向 → 不传 canonical → 新旧 URL 都可能进索引 → 重复内容与权重分裂。

## hreflang：多语言变体声明

hreflang 告诉 Google 同一页面的不同语言 / 地区变体，让搜索结果按用户语言匹配展示。

### 三种等价实现

1. **HTML link**（最常用）：head 内 `<link rel="alternate" hreflang="..." href="...">`
2. **HTTP Link 头**：`Link: <https://example.com/en>; rel="alternate"; hreflang="en"`
3. **XML sitemap**：`<xhtml:link rel="alternate" hreflang="..." href="...">`（需 `xmlns:xhtml` 命名空间）

### 强制要求

- **必须双向链接**：X 指向 Y，Y 必须指回 X，否则整个注解被忽略
- **每页列出自身 + 全部变体**：不能漏掉自己
- **配 x-default 兜底**：兜住未匹配语言 / 区域的用户

### 语言码与区域码

- **语言码**：ISO 639-1（在前），如 `en / zh / ja / fr`
- **区域码**：ISO 3166-1 Alpha 2（在后），如 `US / CN / JP`
- **可用脚本码**：ISO 15924，如 `zh-Hant / zh-Hans`

```html
<link rel="alternate" hreflang="en" href="https://example.com/en/" />
<link rel="alternate" hreflang="zh-Hans" href="https://example.com/zh/" />
<link rel="alternate" hreflang="x-default" href="https://example.com/en/" />
```

### 反模式

- **只用国家码**（如 `be` 当比利时）—— `be` 是**白俄罗斯语**而非比利时；比利时须用 `nl-be / fr-be / de-be`
- **缺反向链接**（X 指向 Y 但 Y 不指回）—— 整个注解被忽略
- **漏列自身**—— 每页都要列出自身 + 全部变体

## URL 结构规范

| 规则 | 说明 |
| --- | --- |
| **用连字符分词** | `/black-pink-shoes` ✓；`/black_pink_shoes` ✗（下划线被视为应连在一起的标识符，不分词） |
| **大小写敏感** | `/Apple` 与 `/apple` 是**不同 URL**（Google 视大小写为不同 URL，会分裂权重 / 重复内容）→ 统一小写 |
| **用 History API 而非 fragment** | `/products/123` ✓；`/#/products/123` ✗（Googlebot 不能可靠解析 fragment 区分内容） |
| **描述性词优于长 ID** | `/blog/technical-seo-guide` ✓；`/blog/post/1234567890` ✗ |
| **绝对 URL 在 canonical / hreflang** | `href="https://example.com/en/"` ✓；相对路径在 hreflang 中可能误解析 |

### SPA 路由：History API vs Hash 路由

- **History API**（`pushState / replaceState`）：URL 形如 `/products/123`，可被 Googlebot 解析、可分别索引 ✓
- **Hash 路由**（`#/products/123`）：fragment 后部分被 Googlebot **当作同一页**，内容无法分别索引 ✗

> 反模式：SPA 用 `#/products`、`#/services` 加载不同页面内容 → Googlebot 不能可靠解析 fragment → URL 被当作同一页 → 内容无法分别索引。

## 移动优先索引（Mobile-first Indexing）

Google **自 2021-03 起对所有新站默认启用移动优先索引**——用**移动版**做索引与排名。已对绝大多数网站生效。

### 核心要求

- 移动版与桌面版**内容 / meta / 结构化数据 / 图片 alt 完全对等**
- 移动版**不能加 noindex / nofollow**
- 主要内容**不能依赖用户交互才懒加载**（Google 不模拟滑动 / 点击）
- 推荐**响应式设计**最易维护

### 反模式

- 移动版加 `noindex` → 直接导致不收录
- 移动版内容比桌面版少 → 缺失内容直接掉排名
- 移动版结构化数据缺失 → 失去富结果资格
- 把主要文字 / 图片放在需滑动 / 点击才加载的懒加载里 → 对爬虫不可见

> 动态服务（dynamic serving）须配合 `Vary: User-Agent` 响应头，否则可能返回错误版本缓存。

## Core Web Vitals 作为 SEO 信号

Core Web Vitals 是 Google **page experience（页面体验）** 体系的**排名信号之一**（非决定性因素）。

### 三指标阈值

| 指标 | 含义 | Good | NI | Poor | 测量 |
| --- | --- | --- | --- | --- | --- |
| **LCP** | 最大内容绘制（加载） | ≤ 2.5s | 2.5–4s | > 4s | field + lab |
| **INP** | 交互到下次绘制（2024-03 替代 FID） | ≤ 200ms | 200–500ms | > 500ms | field |
| **CLS** | 累计布局偏移（视觉稳定） | ≤ 0.1 | 0.1–0.25 | > 0.25 | field + lab |

### 关键事实

- **INP 于 2024-03 正式替代 FID**——任何仍引用 FID 的资料已过时
- CWV 是**信号之一**，不是决定性因素——精调 CWV 到极致而不做内容 / 外链，排名不会突飞猛进
- field 数据用 [`web-vitals` 库](https://github.com/GoogleChrome/web-vitals) 采集（`onLCP / onINP / onCLS`），或看 CrUX / PageSpeed Insights
- **底层优化机制**（如何减小 LCP / 降低 INP / 消除 CLS）归【性能优化】章，本页只讲 SEO 信号属性

> page experience 体系还包括 HTTPS、移动友好、无插页式弹窗、安全浏览等多个信号，CWV 只是其中之一。

## sitemap.xml：站点地图

按 [sitemaps.org 协议](https://www.sitemaps.org/protocol.html) 编写：

### 单文件限制

- **最多 50000 URLs**
- **最大 50MB（未压缩）**——可 gzip 压缩传输
- 超限须**拆分多个 sitemap**，用 **sitemap index** 引用

### sitemap index

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://example.com/sitemap1.xml</loc></sitemap>
  <sitemap><loc>https://example.com/sitemap2.xml</loc></sitemap>
</sitemapindex>
```

- sitemap index **最多 50000 个子 sitemap**

### 在 robots.txt 宣告

```
Sitemap: https://example.com/sitemap.xml
Sitemap: https://example.com/sitemap-index.xml
```

可多条。

> sitemap 是**提示**而非命令——Google 仍会沿链接抓取，sitemap 帮助发现孤岛页面。

## SPA 客户端路由防 soft 404

SPA 客户端路由无法返回真实 HTTP 状态码——用户访问 `/products/不存在的ID` 时，服务器仍返回 200 + app shell，SPA 在客户端判定不存在后通常显示「未找到」文案。Google 把这种「200 状态码 + 看起来像 404 的页面」称为 **soft 404**，会误判影响整站质量评估。

### 两种解法

**方案 1（推荐）**：API 判定不存在时，**JS 跳转到服务端返回真实 404 的页面**

```js
// 伪代码
const data = await fetch(`/api/products/${id}`);
if (data.status === 404) {
  window.location.href = `/404?from=${id}`;
}
```

**方案 2**：API 判定不存在时，**动态注入 `<meta name=robots content=noindex>`**

```js
if (data.status === 404) {
  const meta = document.createElement('meta');
  meta.name = 'robots';
  meta.content = 'noindex';
  document.head.appendChild(meta);
}
```

### 注意

- **不要把 `<meta name=robots content=noindex>` 放在初始 HTML**——除非你想让该页永久不被索引
- 方案 2 的动态注入必须**早于**渲染队列执行，否则可能错过

## llms.txt：为 AI 爬虫提供概览

[llmstxt.org](https://llmstxt.org/) 提案为 AI 时代（AI Overviews / ChatGPT / Claude 等）提供结构化站点概览：

### 两文件

- **`/llms.txt`**：站点结构化概览（Markdown）—— 标题、简介、关键链接
- **`/llms-full.txt`**：全量内容（Markdown）—— 完整文档拼接

### 定位

- **新兴提案**，约 v1.7.0，采用率仍在发展
- **补充而非替代** robots.txt / sitemap.xml
- 主流 AI 厂商支持仍在演进

### 适用场景

- 文档站、知识库、内容站希望被 AI 搜索正确引用 / 概述
- 与 robots.txt / sitemap 配合使用（不能替代）

## 反模式（避坑）

- **把动态渲染当作长期方案** —— 官方已用过去式定位为 workaround，应迁向 SSR / SSG / hydration
- **JS 把 canonical 改成与原 HTML 不同的值，或注入多个 rel=canonical** —— 冲突导致 Google 选出意外 canonical 甚至忽略
- **SPA 用 fragment 路由加载不同内容** —— Googlebot 不能可靠解析 fragment，URL 被当作同一页
- **在 robots.txt 写 `Noindex:` 指令** —— Google 不支持；正确做法是 robots meta noindex 或 X-Robots-Tag
- **永久迁移 / 换域名却用 302** —— 不传 canonical 信号，新旧 URL 都进索引，重复内容与权重分裂
- **hreflang 缺反向链接，或只用国家码（`be` 当比利时）** —— 缺反向链接整个注解被忽略；`be` 是白俄罗斯语，比利时须 `nl-be / fr-be / de-be`
- **移动版加 noindex / nofollow 或移动内容比桌面少** —— 移动优先索引下移动版是索引来源，noindex 直接不收录，内容缺失掉排名
- **URL 混用大小写或用下划线连词** —— 大小写视为不同 URL（重复内容 / 分裂权重），下划线连接的词不被当作独立词
- **主要文字 / 图片放在需用户交互才加载的懒加载里** —— Google 不模拟用户交互，对爬虫不可见
- **noindex 页面又指望 JS 运行时移除 noindex** —— Google 遇 noindex 可能直接跳过渲染与 JS 执行，移除操作永不发生；想被索引就别在初始 HTML 放 noindex
- **给爬虫和用户返回完全不同内容的伪动态渲染** —— 这是 cloaking，违反 Google 垃圾政策

## 下一步

- [参考](./reference.md)：robots 指令完整表、重定向完整表、hreflang 三种实现、CWV 阈值表、版本变化、官方资源
