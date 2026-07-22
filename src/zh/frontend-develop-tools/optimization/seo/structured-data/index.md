---
layout: doc
---

# 结构化数据

结构化数据（Structured Data）是 SEO 中**让搜索引擎「读懂」页面语义**的标准化数据标注机制：在 HTML 中按 [Schema.org](https://schema.org) 词汇表描述「这是 Article / Product / Event / FAQPage / BreadcrumbList」，Google 等搜索引擎解析后即可在搜索结果里渲染 **Rich Snippets（富媒体结果）**——文章卡片显示作者头像与发布时间、商品卡片显示价格与库存、面包屑显示层级路径、活动卡片显示时间地点，从而显著提升点击率（CTR）与曝光。Google 在 [Search Central 文档](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)中支持三种标注格式——**JSON-LD**（`<script type="application/ld+json">` 内嵌 JSON，**官方唯一 Recommended**）、**Microdata**（HTML 属性 `itemscope` / `itemtype` / `itemprop`）、**RDFa**（HTML 属性 `vocab` / `typeof` / `property`）；新实现一律首选 JSON-LD，因它与可见 HTML 分离、易维护、可被 JS 动态注入、规模化时出错最少。Schema.org 是 Google / Microsoft / Yahoo / Yandex 共同维护的**词汇全集**，Google 仅支持其子集且各 rich result 类型有自己的「必需 / 推荐」属性规则——以 [Search Gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery) 为准而非 schema.org 通用定义。重大历史变更：2020 年 [data-vocabulary.org](https://data-vocabulary.org) 被 sunset（不再产生 rich result），2023-08 起 FAQ rich result 限缩为权威政府 / 健康站、HowTo rich result 已于 2023-09-13 **完全弃用**；上线前用 [Rich Results Test](https://search.google.com/test/rich-results) 校验，部署后用 Search Console 监控——但 Google **不保证** markup 正确就一定显示富结果（算法据设备 / 位置 / 历史决定）。

## 评价

**优点**

- **官方权威、生态默认**：Schema.org 由四大搜索引擎联合维护，Google 在 Search Central 提供完整文档与校验工具
- **CTR 提升实证**：Rotten Tomatoes +25%、Food Network +35%、Nestlé +82%、Rakuten 用户停留 1.5x——富媒体卡片比纯文本结果视觉权重高
- **三类一锅端**：JSON-LD / Microdata / RDFa 任选其一即可，覆盖从静态 HTML 到 SPA 动态渲染各种场景
- **JSON-LD 易维护**：与可见 HTML 解耦，可由 SSR 模板或前端 JS 单点注入，规模化出错少
- **JS 动态生成友好**：Googlebot 可读 DOM 渲染后的 JSON-LD，GTM / 自定义 JS 均可注入
- **多类型覆盖广**：Article / Product / Event / Recipe / VideoObject / LocalBusiness 等覆盖绝大多数业务场景

**缺点**

- **不保证显示**：markup 正确并通过 Rich Results Test 不等于一定出富结果，Google 据设备 / 位置 / 历史决定
- **FAQ / HowTo 已大幅限缩**：2023-08 起 FAQ 仅限权威站、HowTo 完全弃用，普通站写了也基本不显示
- **数据要求严格**：markup 必须如实描述页面对用户可见的内容，禁止隐藏 / 误导 / 虚假（如自造 aggregateRating），违反触发 manual action
- **类型规则零散**：每个 rich result 类型有自己的「必需 / 推荐」属性表，需逐类型查 Search Central 文档
- **动态数据可靠性差**：Product 这类快变价 / 库存若用纯客户端 JS 注入，Google Shopping 抓取更稀疏更不可靠
- **schema.org ≠ Google 要求**：schema.org 是全集，Google 只支持子集，照搬 schema.org 通用定义可能跑偏

## 文档地址

- [Google Search Central - 结构化数据简介](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Search Gallery（全部 rich result 功能目录）](https://developers.google.com/search/docs/appearance/structured-data/search-gallery)
- [General Structured Data Guidelines（质量 / 技术 / 位置规则）](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- [Rich Results Test（在线校验工具）](https://search.google.com/test/rich-results)
- [Schema.org 词汇全集](https://schema.org)

## GitHub地址

[Schema.org schema-org/schema](https://github.com/schema-org/schema) · [JSON-LD 规范 w3c/json-ld-api](https://github.com/w3c/json-ld-api)

## 幻灯片地址

<a href="/SlideStack/structured-data-slide/" target="_blank">结构化数据</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=695" target="_blank" rel="noopener noreferrer">结构化数据测试题</a>

> 待回填：题目入库后，将 `?category=695` 替换为实际 category ID；幻灯片链接在 SlideStack 部署后生效。
