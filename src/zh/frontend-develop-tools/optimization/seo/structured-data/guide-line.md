---
layout: doc
outline: [2, 3]
---

# 核心指南

> 基于 Google Search Central 官方文档（developers.google.com/search/docs/appearance/structured-data）+ Schema.org 词汇表 + Search Gallery 编写，对照 2026-07 Search Central 最新规则

## 速查

- **三格式**：JSON-LD（Recommended）/ Microdata / RDFa，**新实现一律 JSON-LD**
- **JSON-LD 载体**：`<script type="application/ld+json">`，三件套 `@context`=`https://schema.org`、`@type`、`@id`
- **核心类型**：Organization / BreadcrumbList（≥2 ListItem）/ Article（推荐 headline+image+datePublished+author[]）/ Product（含 Offer）/ FAQPage（已限缩）/ HowTo（已弃用）/ Event / LocalBusiness / VideoObject
- **同页多 item**：Nesting（主 item 下嵌套）或 Individual items 用 `@id` 互相引用
- **JS 动态生成**：GTM（Custom HTML 标签 + `{{var}}`）或 自定义 JS（`createElement('script')`）
- **校验**：[Rich Results Test](https://search.google.com/test/rich-results) 输 **URL**（非 code，规避 JS/CORS）
- **Search Gallery**：Google 支持的全部 rich result 功能目录
- **质量红线**：markup 必须如实描述可见内容，禁止隐藏 / 误导 / 虚假，违反触发 manual action
- **不保证原则**：markup 正确 ≠ 一定显示富结果
- **反模式**：用 data-vocabulary.org / 给所有 FAQ 堆 markup / Rich Results Test 测代码 / 多作者合并字符串

## 三种格式深度对比

### JSON-LD（Recommended）

**载体**：`<script type="application/ld+json">...</script>`，可放 `<head>` 或 `<body>`。

**标识**：

- `@context`：固定为 `https://schema.org`
- `@type`：指定 Schema.org 类型（如 `Article`、`Product`、`Event`）
- `@id`：节点身份，用于跨多个 item 引用同一实体
- `@graph`：在单个 `<script>` 内描述多个互相引用的实体（见后文）

**优点**：与可见 HTML 分离、嵌套易表达、JS 动态注入友好、规模化维护出错少。

### Microdata（legacy）

**载体**：HTML 标签属性内联，多在 `<body>`。

**标识**：

- `itemscope`：声明一个 item 作用域
- `itemtype="https://schema.org/X"`：指定类型
- `itemprop="prop"`：指定属性
- `itemid`：item 的全局标识（对应 JSON-LD 的 `@id`）

**现状**：W3C Note，已基本停止演进，被视作 legacy；新实现不建议选。

### RDFa

**载体**：HTML 标签属性内联（HTML5 扩展），可 head / body。

**标识**：

- `vocab="https://schema.org/"`：词汇表
- `typeof="X"`：指定类型
- `property="prop"`：指定属性
- `resource` / `about` / `href`：实体标识与引用

**现状**：RDFa 1.1 是 W3C 推荐（仍维护），但生态采用度远低于 JSON-LD。

> 给定代码片段判别格式：看到 `@context`/`@type` 是 JSON-LD；看到 `itemscope`/`itemprop` 是 Microdata；看到 `vocab`/`typeof`/`property` 是 RDFa。

## Schema.org 核心类型

### Organization（组织 / 公司）

通常放站点首页或全站 `<head>`，描述网站背后的组织。常用属性：`name`、`url`、`logo`（推荐 `ImageObject`）、`sameAs`（指向官方社交账号数组）、`contactPoint`。

### BreadcrumbList（面包屑）

**必需**：`itemListElement` 数组，含 **≥2 个 ListItem**，每个 ListItem 必需：

- `item`（URL 或 `@id`）：该层级的链接
- `name`（Text）：显示名称
- `position`（Integer）：从 1 开始的位置

**最佳实践**：

- 用**用户典型到达路径**而非镜像 URL 结构
- 不必为顶层域名或当前页本身加 ListItem
- 末项（当前页）可不带 `item` 属性

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "首页",
      "item": "https://example.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "SEO",
      "item": "https://example.com/seo/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "结构化数据"
    }
  ]
}
```

### Article（文章）

可用 `Article` / `NewsArticle` / `BlogPosting` 三型，**无必需属性**，但推荐：

- `headline`：标题
- `image`：多比例（16x9 / 4x3 / 1x1），**≥50K 像素**
- `datePublished` / `dateModified`：ISO 8601 含时区
- `author[]`：数组，每项含 `@type=Person` 与 `url` / `sameAs`
- `publisher`：发布者（`Organization`）

**多作者处理**（高频考点）：分别列在各自 `author` 字段，**不要合并成字符串**。

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "结构化数据深度指南",
  "image": ["https://example.com/img/16x9.jpg", "https://example.com/img/4x3.jpg"],
  "datePublished": "2026-07-22T08:00:00+08:00",
  "dateModified": "2026-07-22T10:00:00+08:00",
  "author": [
    { "@type": "Person", "name": "张三", "url": "https://example.com/author/zhangsan" },
    { "@type": "Person", "name": "李四", "url": "https://example.com/author/lisi" }
  ],
  "publisher": {
    "@type": "Organization",
    "name": "IllegalCreed",
    "logo": { "@type": "ImageObject", "url": "https://example.com/logo.png" }
  }
}
```

> `author.name` 只写名字，不混入职位 / 敬语 / 发布者——职位用 `jobTitle`、发布者用 `publisher`。

### Product 与 Offer

**两类用途**：

- **Product snippet**（非可购买页）：强调评论 / 优缺点
- **Merchant listing**（可购买页）：含 `price` / `availability` / `shipping` / `returns`

**价格**：经 `offers` → `Offer`，包含 `price`、`priceCurrency`、`availability`。

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "结构化数据手册",
  "image": "https://example.com/book.jpg",
  "offers": {
    "@type": "Offer",
    "price": "59.90",
    "priceCurrency": "CNY",
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.6",
    "reviewCount": "128"
  }
}
```

> Product 这类快速变化（价格 / 库存）的数据，**优先 SSR 输出 JSON-LD**；若用纯客户端 JS 注入，Google Shopping 抓取会更稀疏更不可靠。

### FAQPage 与 HowTo（高频考点）

**重大历史变更**（[官方博客](https://developers.google.com/search/blog/2023/08/howto-faq-changes)）：

| 类型 | 2023-08 前 | 2023-08-09 起 | 2023-09-13 起 |
| --- | --- | --- | --- |
| **FAQPage** | 所有 FAQ 页均可出 rich result | **限缩为权威政府 / 健康站** | 维持限缩 |
| **HowTo** | 所有 HowTo 页均可出 rich result | 公告弃用 | **完全弃用** |

> 普通站给 FAQ / HowTo 页写 markup **不会报错**，但**基本不显示**富结果——属无效投入。

### Event（活动）

描述线下 / 线上活动。常用属性：`name`、`startDate` / `endDate`（ISO 8601）、`location`（`Place` 嵌套 `PostalAddress`）、`eventStatus`、`eventAttendanceMode`、`offers`（票价）。

### LocalBusiness（本地商家）

实体店 / 餐厅 / 服务网点。常用：`name`、`address`（`PostalAddress`）、`telephone`、`openingHoursSpecification`、`geo`（经纬度）、`aggregateRating`、`priceRange`。

### VideoObject（视频）

视频内容。推荐：`name`、`description`、`thumbnailUrl`、`uploadDate`、`contentUrl` 或 `embedUrl`、`duration`（ISO 8601 如 `PT1M30S`）。

## @graph 多实体

同页有多个独立实体时，用 `@graph` 在单个 `<script>` 内组织：

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://example.com/#org",
      "name": "IllegalCreed",
      "url": "https://example.com",
      "logo": { "@type": "ImageObject", "url": "https://example.com/logo.png" }
    },
    {
      "@type": "WebSite",
      "@id": "https://example.com/#website",
      "url": "https://example.com",
      "publisher": { "@id": "https://example.com/#org" }
    },
    {
      "@type": "Article",
      "@id": "https://example.com/article#article",
      "headline": "结构化数据",
      "author": { "@id": "https://example.com/#org" },
      "isPartOf": { "@id": "https://example.com/#website" }
    }
  ]
}
```

**同页多 item 关联**（如 Recipe + VideoObject）：两种方式——

- **Nesting**：主 item 下嵌套子 item（如 Recipe 嵌套 aggregateRating / video）
- **Individual items**：用 `@id` 在两 item 间建立引用

> 不用 `@id` 串联，Google 可能不知道 video 属于该 Recipe，漏掉 video rich result。

## JS 动态生成 JSON-LD

### 方式一：GTM（Custom HTML 标签）

用 GTM 变量（如 `{{recipe_name}}`=`document.title`）从页面抽取数据注入 JSON-LD，而非在 GTM 里硬编码副本——避免页面内容与 markup 不一致。

### 方式二：自定义 JS

```js
// 动态生成 JSON-LD 并注入 head
const script = document.createElement("script");
script.setAttribute("type", "application/ld+json");
script.textContent = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: document.title,
  datePublished: document.querySelector("meta[name='date']")?.content,
});
document.head.appendChild(script);
```

> Googlebot 可读 DOM 渲染后的 JSON-LD，所以 SPA 也能用此方式。但 Product 这类快变价 / 库存优先 SSR 输出。

## Google Rich Results Test 与 Search Gallery

### Rich Results Test

[search.google.com/test/rich-results](https://search.google.com/test/rich-results) 校验页面可生成哪些 rich result。

**正确用法**：

- **输 URL 而非粘贴代码**——因 JS/CORS 限制，代码输入无法反映动态生成的 JSON-LD
- 报告会列出检测到的所有 rich result 类型 + 缺失的必需 / 推荐属性 + 错误 / 警告

### Search Gallery

[Search Gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery) 是 Google 支持的**全部 rich result 功能目录**，每类点进去有独立的 feature guide 列出「必需 / 推荐属性」。

> 每类 rich result 先查 Search Central 该类型的 feature guide 补充规则（各类型规则不同），而非只看 schema.org 通用定义。

### Search Console 监控

- **Performance 报告**：对比有 / 无结构化数据页面的点击 / 曝光
- **Rich result status report**：每类 rich result 的覆盖率与错误
- **Manual Actions report**：是否因 spammy markup 被处罚

## 质量红线与 Google 不保证原则

### 质量红线

markup 必须如实代表页面对用户可见的**主内容**——禁止：

- 描述隐藏 / 不存在 / 误导性内容（如 JSON-LD 写了 performer 但 body 没有对应内容）
- 自造 `aggregateRating`（非真实用户评价）
- 虚假 review / 无关商品

违反触发 **manual action**，页面失去 rich result 资格（**但不影响常规网页排名**）。

### Google 不保证原则

- markup 正确并通过 Rich Results Test **不等于** 一定显示富结果
- 算法会据设备 / 位置 / 历史等决定是否展示，可能选纯文本结果更合适
- 「enable ≠ guarantee」——结构化数据是必要条件，非充分条件

> 宁可少量但完整准确的推荐属性，也不要塞满所有推荐属性但数据残缺 / 错误——错误数据反而扣分。

## 反模式（避坑）

- **用 data-vocabulary.org 词汇**：Google 已 sunset，不再产生任何 rich result，必须迁移到 schema.org
- **给所有 FAQ / HowTo 页堆 markup**：2023-08 起 FAQ 仅限权威政府 / 健康站、HowTo 已完全弃用；普通站写了基本不显示（不报错但无效投入）
- **JSON-LD 描述页面上不可见的内容**：属 spammy markup，可被 manual action
- **同页混用多种格式或重复定义同 item 不用 `@id` 串联**：Google 可能重复解析或无法关联
- **多作者合并成字符串** `"张三, 李四"` 塞进单个 `author.name`：应拆成 `author` 数组
- **职位 / 敬语 / 发布者塞进 `author.name`**（如 `"posted by Dr. Jane Doe, Editor"`）：应分别用 `jobTitle` / `honorificPrefix` / `publisher`
- **用 Rich Results Test 的代码输入测 JS 动态生成的 JSON-LD**：因 CORS / JS 限制误报，必须用 URL 输入
- **用 robots.txt / noindex / 登录墙阻止 Googlebot 抓结构化数据页或图片 URL**：直接丧失 rich result 资格（image URL 必须 crawlable）
- **假设 markup 通过 Rich Results Test = 一定显示富结果**：Google 明确不保证
- **为追求「属性全」填虚假评分 / 自造 aggregateRating**：可触发 manual action
- **Product 页用纯客户端 JS 注入价格 / 库存却不给服务器足够资源**：Google Shopping 抓取更稀疏更不可靠

## 下一步

- [参考](./reference.md)：Schema.org 类型表 + 格式对比表 + @graph 完整示例 + 官方资源
