---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Google Search Central（developers.google.com/search/docs）与 Open Graph 协议（ogp.me）官方文档编写，对照 2026 年活跃版本

## 速查

- **页面 SEO 三支柱**：内容语义（title / meta description / heading / 关键词）、HTML 结构（URL slug / image alt / 内部链接）、社交分享（Open Graph / Twitter Card）
- **title 标签**：每页唯一、主关键词前置、行业经验 **50–60 字符**（≈600px），Google **无硬性字符上限**（按设备宽度截断）
- **meta description**：每页唯一、自然句子、行业经验 **150–160 字符**，Google 主要用页面内容生成 snippet，优质 description 更可能被原样采用
- **heading 层级**：主标题放第一个可见 `<h1>`（每页**唯一 H1**），再用 `<h2>`–`<h6>` 组织层级；非严格排名因素但利于 a11y 与内容理解
- **URL slug**：用**连字符 `-`** 分词（非下划线 `_`），描述性、简短、含关键词、统一大小写
- **image alt**：描述性 + 结合上下文，**纯装饰图用 `alt=""`**；Google 不索引 CSS `background-image`
- **Open Graph 必需属性**：`og:title` / `og:type` / `og:image` / `og:url`（四件套）
- **Twitter Card**：`twitter:card`（`summary` 或 `summary_large_image`）+ title / description / image
- **搜索意图四类**：informational（求知）/ navigational（导航）/ commercial（比较）/ transactional（交易）
- **反模式**：关键词堆砌、模板化 title、meta description 写成关键词列表、URL 用下划线、锚文本写「点击这里」

## 页面 SEO 是什么

页面 SEO（On-page SEO）是**在站点自身可控范围内**对单个网页进行的搜索引擎优化，所有调整都落在自己代码与 CMS 模板里——从 `<title>`、`<meta description>`、`<h1>`–`<h6>` 层级，到 URL slug、图片 alt、内部链接锚文本、社交分享预览元数据。它的核心定位有三：

- **站内完全可控**：不依赖外链、社媒投放或第三方平台授权
- **开发者友好**：所有元素都在 HTML / 模板层，可被 lint / CI 自动校验
- **多目标协同**：同一套元数据同时服务 SERP 排名、点击率（CTR）、社交分享预览与无障碍（a11y）

> 页面 SEO ≠ 整体 SEO。它是开发者最直接的抓手，但 Google 排名还包含技术 SEO（爬取 / 索引）、内容质量、外链（Off-page）、用户体验（Core Web Vitals）等多重信号。

## 页面 SEO 三支柱

页面 SEO 的优化对象可分为三大类，每类对应一组 HTML 元素：

| 支柱 | 关注点 | 核心 HTML 元素 |
| --- | --- | --- |
| **内容语义** | 让搜索引擎理解页面主题与搜索意图的匹配度 | `<title>`、`<meta name="description">`、`<h1>`–`<h6>`、关键词与语义相关词 |
| **HTML 结构** | 让搜索引擎高效抓取与解析页面 | URL slug、`<img alt>`、内部链接 `<a>` 锚文本、`rel="canonical"` |
| **社交分享** | 让分享到社交平台的链接有可控预览 | Open Graph（`og:title` / `og:image` …）、Twitter Card（`twitter:card` …） |

> 三支柱不是排名因素的分层，而是**优化对象的组织方式**——同一个 `<title>` 既属于内容语义支柱，也作为 `og:title` 影响社交预览。

## 三支柱速览

### 内容语义支柱

- **`<title>` 是首要信息**：用户在 SERP 判断是否点击，主要看 title；Google 会综合 `<title>`、主视觉标题、`<h1>`、`og:title`、锚文本、WebSite 结构化数据生成 title link
- **`<meta description>` 是 SERP 广告文案**：优质描述更可能被原样采用为 snippet，直接提升 CTR
- **heading 揭示层级**：第一个可见 `<h1>` 是主标题，`<h2>`–`<h6>` 组织内容结构
- **关键词策略服务搜索意图**：自然覆盖语义相关词（同义词、共现实体），而非机械堆砌「LSI 关键词」（Google John Mueller 已否认使用 LSI）

### HTML 结构支柱

- **URL slug**：连字符分词、描述性、简短、统一大小写；Google 把 URL 视为大小写敏感（`/APPLE` 与 `/apple` 是不同 URL）
- **image alt**：Google 称 alt 是图片最重要的元数据，同时服务图片搜索 SEO 与 a11y；装饰图用空 `alt=""`
- **内部链接锚文本**：用描述性文本（约 2–5 词），避免「点击这里 / read more」——锚文本是 Google 理解目标页主题与生成 title link 的来源之一
- **`rel="canonical"`**：合并重复 URL（带 / 不带 www、参数变体），避免内容重复稀释

### 社交分享支柱

- **Open Graph 协议（ogp.me）**：控制 Facebook / LinkedIn / WhatsApp 预览，四个必需属性 `og:title` / `og:type` / `og:image` / `og:url`
- **Twitter Card**：控制 X 预览，`twitter:card` 取 `summary` 或 `summary_large_image`
- **og:image 推荐尺寸**：1200×630（1.91:1），≤5MB；提供 `og:image:width` / `height` / `alt` 提高命中率
- **指定首选预览图**：用 `og:image` 或 schema.org `primaryImageOfPage` / `mainEntityOfPage`

## 关键事实速览

- **title 截断**：Google 对 `<title>` **无字符硬上限**，按设备宽度截断；行业经验 50–60 字符（≈600px）保证不被截断
- **Google 改写 title**：半空标题、过时标题、不准确、micro-boilerplate、无明确主标题、书写系统 / 语言不匹配等会触发自动改写
- **snippet 来源优先级**：Google 主要用页面内容生成 snippet，仅在 meta description 更准确时采用
- **snippet 控制三机制**：`nosnippet` meta、`max-snippet:[number]` meta、`data-nosnippet` 属性
- **CSS background-image 不被索引**：内容图必须用 `<img src>` 或 `<picture>` + `srcset`
- **OG 协议稳定**：核心四属性长期稳定，结构化属性（`og:image:width` / `height` / `alt`）已广泛采用为事实标准
- **X Card 遗留**：Card Validator 已失效，但 `twitter:*` 标签与 `summary` / `summary_large_image` 卡类型仍是事实标准

## 优化检查清单

落地一个新页时，依次过一遍：

- `<title>` 唯一、主关键词前置、≤ 60 字符（经验值）
- `<meta name="description">` 唯一、自然句子、含关键信息、≤ 160 字符（经验值）
- 第一个可见 `<h1>` 是页面主标题，全页唯一 H1
- URL slug 用连字符、简短、含目标词、统一大小写
- 所有内容图有描述性 alt，装饰图用 `alt=""`
- 内容图用 `<img src>`，不用 CSS `background-image`
- 内部链接锚文本是描述性短语，不是「点击这里」
- `<meta property="og:title">` / `og:type` / `og:image` / `og:url` 四件套齐全
- `<meta name="twitter:card" content="summary_large_image">` + title / description / image
- `og:image` 尺寸 1200×630，提供 `og:image:width` / `height` / `alt`
- 关键页面加 `rel="canonical"` 合并重复 URL

## 下一步

- [核心指南](./guide-line.md)：title 标签 + meta description + heading 层级 + 关键词策略 + URL slug + internal linking + image alt + Open Graph / Twitter Card + 反模式
- [参考](./reference.md)：标签规范表、OG 属性表、官方资源
