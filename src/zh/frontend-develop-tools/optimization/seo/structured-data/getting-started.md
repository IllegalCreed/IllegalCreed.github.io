---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Google Search Central 官方文档（developers.google.com/search/docs/appearance/structured-data）+ Schema.org 词汇表编写，对照 JSON-LD 1.1 / 当前 Search Gallery 行为

## 速查

- **目的**：在 HTML 中按 Schema.org 词汇描述页面内容（这是 Article / Product / Event…），让搜索引擎生成 **Rich Snippets（富媒体结果）**
- **三格式**：JSON-LD（**官方唯一 Recommended**）/ Microdata（属性 `itemscope`/`itemtype`/`itemprop`）/ RDFa（属性 `vocab`/`typeof`/`property`）
- **JSON-LD 载体**：`<script type="application/ld+json">`，可放 `<head>` 或 `<body>`
- **JSON-LD 三件套**：`@context` 固定 `https://schema.org`、`@type` 指定类型、`@id` 用于跨 item 引用
- **核心类型**：Organization / BreadcrumbList / Article / Product / Offer / FAQPage / Event / LocalBusiness / HowTo（已弃用）/ VideoObject
- **校验工具**：[Rich Results Test](https://search.google.com/test/rich-results)（输 **URL** 非 code，规避 JS/CORS）
- **功能目录**：[Search Gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery)（Google 支持的全部 rich result 列表）
- **重大变更**：2020 data-vocabulary.org sunset；2023-08 FAQ 限缩、2023-09-13 HowTo 完全弃用
- **质量红线**：markup 必须如实描述页面对用户可见的内容，违反触发 manual action

## 结构化数据是什么

结构化数据是**让搜索引擎「读懂」页面语义**的标准化标注机制：你在 HTML 里按 Schema.org 词汇表告诉 Google「这个页面是一篇 Article，作者是张三，发布时间是 2026-07-22」，Google 解析后可在搜索结果里渲染富媒体卡片（显示作者头像、发布时间、面包屑层级、商品价格等），从而提升 CTR 与曝光。

它的核心定位有三：

- **语义层补充**：可见 HTML 描述「页面长什么样」，结构化数据描述「页面是什么意思」
- **官方标准**：Schema.org 由 Google / Microsoft / Yahoo / Yandex 联合维护，Google 在 Search Central 提供完整文档
- **rich result 入口**：Markup 是获得 Google Rich Snippets 的**必要条件**（但非充分——见「Google 不保证原则」）

> 结构化数据 ≠ Open Graph / Twitter Card。OG / Twitter Card 是社交分享 meta，归「页面 SEO」或社交 meta；结构化数据是 Schema.org 词汇 + rich result 范畴。

## 三种格式速览

| 格式 | 载体 | 标识属性 | Google 推荐度 |
| --- | --- | --- | --- |
| **JSON-LD** | `<script type="application/ld+json">` | `@context` / `@type` / `@id` | **Recommended**（唯一） |
| **Microdata** | HTML 标签属性内联 | `itemscope` / `itemtype` / `itemprop` / `itemid` | 支持（legacy） |
| **RDFa** | HTML 标签属性内联 | `vocab` / `typeof` / `property` / `resource` | 支持 |

> Google 在三格式中**唯一标记 JSON-LD 为 Recommended**——因其与可见 HTML 分离、嵌套数据（如 Event→MusicVenue→PostalAddress→Country）更易表达、可被 JS 动态注入、规模化维护时出错最少。

## Rich Snippets（富媒体结果）

Rich Snippets 是 Google 搜索结果中**比纯文本结果更丰富的展示形态**——文章卡片显示作者头像与发布时间、商品卡片显示价格库存评分、活动卡片显示时间地点、面包屑显示层级路径。它由结构化数据 markup 触发，但 Google **不保证**显示（算法据设备 / 位置 / 历史决定）。

**Search Gallery 全目录**（[官方链接](https://developers.google.com/search/docs/appearance/structured-data/search-gallery)）：Article / Breadcrumb / Carousel / Course / Dataset / Event / JobPosting / LocalBusiness / Movie / Organization / Product / ProfilePage / Q&A / Recipe / ReviewSnippet / SoftwareApp / Speakable / Subscription / Video 等。

**实证数据**（Google 官方案例）：

| 站点 | 提升 |
| --- | --- |
| Rotten Tomatoes | CTR +25% |
| Food Network | 访问 +35% |
| Nestlé | CTR +82% |
| Rakuten | 用户停留 1.5x |

## JSON-LD 为什么推荐

JSON-LD 是 Google 官方在三格式中**唯一标记 Recommended** 的格式，原因：

- **与可见 HTML 分离**：单独 `<script type="application/ld+json">` 块，不污染页面结构
- **嵌套数据易表达**：Event → MusicVenue → PostalAddress → Country 这种深层嵌套，JSON 树形结构远比 HTML 属性内联清晰
- **JS 动态注入**：SPA / SSR 可在运行时 `createElement('script')` 注入，GTM 也能用 Custom HTML 标签注入
- **规模化出错少**：模板化输出 JSON 比手写 HTML 属性内联更不易漏字段

**最小 JSON-LD 示例**（Article）：

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "结构化数据入门",
  "datePublished": "2026-07-22",
  "author": {
    "@type": "Person",
    "name": "张三",
    "url": "https://example.com/author/zhangsan"
  }
}
```

> `@context` 固定为 `https://schema.org`，`@type` 指定 Schema.org 类型，`@id`（可选）用于跨多个 item 引用同一实体。

## Microdata 示例（对照）

```html
<div itemscope itemtype="https://schema.org/Article">
  <h1 itemprop="headline">结构化数据入门</h1>
  <time itemprop="datePublished" datetime="2026-07-22">2026 年 7 月 22 日</time>
  <span itemprop="author" itemscope itemtype="https://schema.org/Person">
    <a itemprop="url" href="https://example.com/author/zhangsan">
      <span itemprop="name">张三</span>
    </a>
  </span>
</div>
```

> Microdata 把数据「贴」在可见 HTML 上，与用户看到的元素一一对应；缺点是深层嵌套难写、JS 动态注入麻烦。

## 上线流程

1. **选类型**：从 [Search Gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery) 找你页面适合的 rich result 类型（Article / Product / Event…）
2. **查规则**：点进该类型的 feature guide，确认「必需属性 / 推荐属性」
3. **写 JSON-LD**：在 SSR 模板或前端 JS 里输出 `<script type="application/ld+json">`
4. **校验**：用 [Rich Results Test](https://search.google.com/test/rich-results) 输入 **URL**（非代码）校验
5. **部署**：上线后用 URL Inspection 看渲染后 HTML 是否含 JSON-LD
6. **监控**：Search Console 的 Performance 报告 + 各 Rich result status report

> Rich Results Test 必须输 URL 而非粘贴代码——因 JS/CORS 限制，代码输入无法反映动态生成的 JSON-LD。

## 下一步

- [核心指南](./guide-line.md)：JSON-LD vs Microdata vs RDFa 深度对比 + Schema.org 类型详解（Organization / BreadcrumbList / Article / Product / FAQPage / HowTo / Event / LocalBusiness）+ @graph 多实体 + Google Rich Results Test + 反模式
- [参考](./reference.md)：Schema.org 类型表 + 格式对比表 + @graph 完整示例 + 官方资源
