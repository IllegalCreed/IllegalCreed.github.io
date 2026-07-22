---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Google Search Central 官方文档（developers.google.com/search/docs/appearance/structured-data）+ Schema.org 词汇表 + Search Gallery 编写，对照 2026-07 Search Central 最新规则

## 速查

- **三格式**：JSON-LD（**Recommended**）/ Microdata（legacy）/ RDFa（仍维护）
- **JSON-LD 载体**：`<script type="application/ld+json">`，三件套 `@context`=`https://schema.org` / `@type` / `@id`
- **核心类型**：Organization / BreadcrumbList / Article / Product / Offer / FAQPage / HowTo / Event / LocalBusiness / VideoObject
- **校验**：[Rich Results Test](https://search.google.com/test/rich-results)（输 URL 非 code）
- **功能目录**：[Search Gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery)
- **重大变更**：2020 data-vocabulary.org sunset；2023-08 FAQ 限缩；2023-09-13 HowTo 完全弃用
- **质量红线**：markup 必须如实描述可见内容，违反 manual action（不影响常规排名）
- **不保证原则**：markup 正确 ≠ 一定显示富结果
- 完整说明见 [入门](./getting-started.md) / [核心指南](./guide-line.md)

## 三种格式对比表

| 维度 | JSON-LD | Microdata | RDFa |
| --- | --- | --- | --- |
| **载体** | `<script type="application/ld+json">` | HTML 标签属性内联 | HTML 标签属性内联 |
| **位置** | `<head>` 或 `<body>` | 多在 `<body>` | `<head>` 或 `<body>` |
| **类型标识** | `@type` | `itemtype` | `typeof` |
| **属性标识** | `@context` 内的字段名 | `itemprop` | `property` |
| **作用域** | JSON 自然嵌套 | `itemscope` | `vocab` |
| **实体标识** | `@id` | `itemid` | `resource` / `about` |
| **词汇表** | `@context="https://schema.org"` | `itemtype="https://schema.org/X"` | `vocab="https://schema.org/"` |
| **Google 推荐度** | **Recommended**（唯一） | 支持（legacy） | 支持 |
| **W3C 状态** | JSON-LD 1.1 推荐 | Note（停止演进） | RDFa 1.1 推荐 |
| **JS 动态注入** | 友好 | 麻烦 | 麻烦 |
| **嵌套表达** | JSON 树形，清晰 | HTML 嵌套，深层复杂 | HTML 嵌套，深层复杂 |
| **规模化维护** | 出错少 | 易漏字段 | 易漏字段 |

> 新实现一律选 JSON-LD。判别格式：`@context`/`@type` 是 JSON-LD；`itemscope`/`itemprop` 是 Microdata；`vocab`/`typeof`/`property` 是 RDFa。

## Schema.org 类型速查

| 类型 | 用途 | 必需属性（Google） | 推荐属性 |
| --- | --- | --- | --- |
| **Organization** | 站点背后的组织 | `name`、`url` | `logo`、`sameAs`、`contactPoint` |
| **BreadcrumbList** | 面包屑层级 | `itemListElement`（≥2 ListItem，每项 `item`/`name`/`position`） | — |
| **Article** | 文章（含 NewsArticle / BlogPosting） | 无 | `headline`、`image`、`datePublished`、`dateModified`、`author[]`、`publisher` |
| **Product** | 商品 | `name` | `image`、`offers`、`aggregateRating`、`review`、`brand` |
| **Offer** | 商品价格（嵌套于 Product.offers） | `price`、`priceCurrency`、`availability` | `shippingDetails`、`hasMerchantReturnPolicy` |
| **FAQPage** | FAQ 页（2023-08 起限缩） | `mainEntity`（Question 数组） | — |
| **HowTo** | 教程（2023-09-13 完全弃用） | `step`（HowToStep 数组） | `totalTime`、`supply`、`tool` |
| **Event** | 线下 / 线上活动 | `name`、`startDate`、`location` | `endDate`、`eventStatus`、`offers`、`organizer` |
| **LocalBusiness** | 实体店 / 餐厅 | `name`、`address`（PostalAddress） | `telephone`、`openingHoursSpecification`、`geo`、`aggregateRating` |
| **VideoObject** | 视频 | `name`、`uploadDate` | `description`、`thumbnailUrl`、`contentUrl`、`duration` |
| **Recipe** | 食谱 | `name`、`recipeIngredient`、`recipeInstructions` | `cookTime`、`nutrition`、`aggregateRating` |
| **Review** | 单条评论 | `itemReviewed`、`author`、`reviewRating` | `datePublished`、`reviewBody` |
| **AggregateRating** | 聚合评分 | `ratingValue`、`reviewCount` 或 `ratingCount` | `bestRating`、`worstRating` |
| **JobPosting** | 招聘信息 | `title`、`datePosted`、`description`、`hiringOrganization`、`jobLocation` | `employmentType`、`salaryCurrency` |
| **SoftwareApp** | 软件应用 | `name`、`operatingSystem` | `applicationCategory`、`aggregateRating`、`offers` |

> 每类先查 [Search Gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery) 该类型的 feature guide 确认最新规则——schema.org 是词汇全集，Google 只支持其子集且各 feature 有自己的「必需 / 推荐」要求。

## Article 推荐图像规格

| 比例 | 用途 |
| --- | --- |
| **16x9** | 横屏主图（最常用） |
| **4x3** | 中屏 |
| **1x1** | 方形缩略 |

- **最小像素**：≥ 50K 像素（单张）
- **格式**：JPG / PNG / WebP / GIF
- **URL 必须 crawlable**：不被 robots.txt / noindex / 登录墙阻挡

## @graph 多实体完整示例

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://example.com/#org",
      "name": "IllegalCreed",
      "url": "https://example.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://example.com/logo.png"
      },
      "sameAs": [
        "https://github.com/IllegalCreed",
        "https://twitter.com/IllegalCreed"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://example.com/#website",
      "url": "https://example.com",
      "name": "IllegalCreed",
      "publisher": { "@id": "https://example.com/#org" }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://example.com/seo/structured-data/#breadcrumb",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "SEO", "item": "https://example.com/seo/" },
        { "@type": "ListItem", "position": 2, "name": "结构化数据" }
      ]
    },
    {
      "@type": "Article",
      "@id": "https://example.com/seo/structured-data/#article",
      "headline": "结构化数据深度指南",
      "image": "https://example.com/img/structured-data.jpg",
      "datePublished": "2026-07-22T08:00:00+08:00",
      "dateModified": "2026-07-22T10:00:00+08:00",
      "author": [
        { "@type": "Person", "name": "张三", "url": "https://example.com/author/zhangsan" }
      ],
      "publisher": { "@id": "https://example.com/#org" },
      "isPartOf": { "@id": "https://example.com/#website" },
      "breadcrumb": { "@id": "https://example.com/seo/structured-data/#breadcrumb" }
    }
  ]
}
```

> `@graph` 让多个实体在单个 `<script>` 内通过 `@id` 互相引用，Google 能正确建立 Organization → WebSite → Article → BreadcrumbList 的关联。

## 同页多 item 处理

| 方式 | 适用 | 示例 |
| --- | --- | --- |
| **Nesting** | 主 item 与子 item 强归属 | Recipe 嵌套 `aggregateRating` / `video` |
| **Individual items + `@id`** | 多个独立 item 互相引用 | Recipe 与其 VideoObject 用 `@id` 串联 |

> 不用 `@id` 串联，Google 不知道 video 属于该 Recipe，可能漏掉 video rich result。

## 校验与监控工具

| 工具 | 用途 |
| --- | --- |
| [Rich Results Test](https://search.google.com/test/rich-results) | 输 **URL** 校验页面可生成哪些 rich result（输 code 会因 JS/CORS 误报） |
| [URL Inspection](https://support.google.com/webmasters/answer/9012289) | 看渲染后 HTML 是否含 JSON-LD |
| Search Console Performance | 对比有 / 无结构化数据页面的点击 / 曝光 |
| Rich result status report | 每类 rich result 的覆盖率与错误 |
| Manual Actions report | 是否因 spammy markup 被处罚 |

## 重大历史变更

| 时间 | 事件 |
| --- | --- |
| **2020** | [data-vocabulary.org](https://data-vocabulary.org) 被 Google sunset，不再产生任何 rich result（须迁移到 schema.org） |
| **2023-08-09** | [FAQPage rich result 限缩](https://developers.google.com/search/blog/2023/08/howto-faq-changes)为权威政府 / 健康站 |
| **2023-09-13** | [HowTo rich result 完全弃用](https://developers.google.com/search/blog/2023/08/howto-faq-changes)，Search Console API 支持 180 天后下线 |
| 持续 | Search Gallery 随 Google 更新：近年新增 Practice problems / Profile page / Discussion forum，移除 HowTo / FAQ |

> FAQPage / HowTo 的 markup 本身不会报错，普通站写了也基本不显示富结果——属无效投入。

## SEO 价值实证数据

| 站点 | 提升 | 来源 |
| --- | --- | --- |
| **Rotten Tomatoes** | CTR +25% | Google 官方案例 |
| **Food Network** | 访问 +35% | Google 官方案例 |
| **Nestlé** | CTR +82% | Google 官方案例 |
| **Rakuten** | 用户停留 1.5x | Google 官方案例 |

> 结构化数据对 CTR / 富媒体展示的量化影响，是 Google 在官方文档与案例集中反复引用的卖点。

## 边界（与邻叶划分）

| 主题 | 归属 | 说明 |
| --- | --- | --- |
| **结构化数据（本叶）** | SEO 组 sort 3 | Schema.org 词汇 + JSON-LD/Microdata/RDFa 三种格式 + 各类 rich result 类型 + Google Rich Results Test |
| 技术 SEO | SEO 组 sort 1 | 抓取 / 索引 / robots.txt / sitemap / canonical 机制 |
| 页面 SEO | SEO 组 sort 2 | title / meta description / H 标签 / 内容本身 |
| GEO | SEO 组 sort 4 | 面向生成式 AI / LLM 的检索优化 |
| Core Web Vitals | 性能优化章 | 性能机制归性能优化，本叶只讲 SEO 影响 |
| SSR / SSG | 框架章 | 实现归框架，本叶只讲对爬虫 / 渲染的意义 |
| Open Graph / Twitter Card | 页面 SEO / 社交 meta | 不属 schema.org rich result 范畴 |

## 版本状态

- **JSON-LD**：W3C JSON-LD 1.1 推荐（当前主流），Google 官方在三格式中**唯一标记 Recommended**
- **Microdata**：W3C Note（已基本停止演进、被视作 legacy）
- **RDFa 1.1**：W3C 推荐（仍维护）
- **Schema.org**：由 Google / Microsoft / Yahoo / Yandex 社区持续维护演进

> 结论：新实现一律 JSON-LD + schema.org，遵循当前 Search Central 文档而非 schema.org 通用定义。

## 官方资源

- 结构化数据简介：[https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- Search Gallery（全部 rich result 目录）：[https://developers.google.com/search/docs/appearance/structured-data/search-gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery)
- General Structured Data Guidelines：[https://developers.google.com/search/docs/appearance/structured-data/sd-policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- FAQ / HowTo 变更博客：[https://developers.google.com/search/blog/2023/08/howto-faq-changes](https://developers.google.com/search/blog/2023/08/howto-faq-changes)
- Rich Results Test：[https://search.google.com/test/rich-results](https://search.google.com/test/rich-results)
- Schema.org 词汇全集：[https://schema.org](https://schema.org)
- JSON-LD 规范：[https://json-ld.org](https://json-ld.org)
