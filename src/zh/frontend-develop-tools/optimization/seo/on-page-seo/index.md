---
layout: doc
---

# 页面 SEO

页面 SEO（On-page SEO）是指**在站点自身可控范围内**对单个网页进行的搜索引擎优化，覆盖 HTML 元数据、内容语义、URL 结构、内部链接、图片 alt 与社交分享预览等站内因素。它与技术 SEO（爬取 / 索引 / sitemap / redirect）和 Off-page SEO（外链建设 / 社媒引流）相对，是开发者写页面时**最直接的抓手**——所有改动都在自己的代码与 CMS 模板里完成，无需依赖第三方。Google Search Central 把「title 链接、snippet、URL 结构、Google 图片」分别列成独立的最佳实践文档，Open Graph 协议（ogp.me）则是 Facebook / LinkedIn / WhatsApp 等社交平台预览的事实标准，X（Twitter）Card 标签由 docs.x.com 维护为预览渲染的事实标准。这一章聚焦页面级元数据与内容语义，不展开结构化数据 / Schema.org 富结果（独立章）、robots.txt / sitemap / noindex 等技术 SEO、Core Web Vitals 性能优化、a11y 可访问性的深度内容。

## 评价

**优点**

- **站内完全可控**：所有元素都在自己的 HTML / 模板里，不依赖外链 / 第三方平台
- **可量化**：每个元素都有可校验的规范（title 字符数、meta 长度、OG 必需属性），便于 CI / lint 自动化
- **影响 CTR 与社交分享**：title / meta description / og:image 直接决定 SERP 与社交预览的点击率
- **与 a11y 协同**：alt / heading 语义同时服务 SEO 与无障碍，一次投入双份收益
- **官方文档活跃**：Google Search Central 的 title-link / snippet / url-structure / google-images 持续更新（2026 年仍在维护）

**缺点**

- **不是排名银弹**：Google 排名是数百信号的综合，On-page 只是其中可掌握的部分；高质量内容 + 外链 + 技术 SEO 同样关键
- **Google 会改写**：不佳的 `<title>` 会被 Google 基于页面内容 / 锚文本 / og:title 自动改写，无法保证 100% 原样展示
- **行业经验与官方规则易混**：title 50–60 字符是 CTR 经验而非 Google 硬性规则，盲目套用会误导优化方向
- **「LSI 关键词」被官方否认**：Google John Mueller 公开表示不使用 LSI 技术，机械堆砌不如自然覆盖语义相关词
- **社交平台行为差异**：OG 与 Twitter Card 标签需同时部署，单一协议覆盖不全；X Card Validator 已失效

## 文档地址

- [Google Search Central — 控制搜索结果中的摘要（meta description）](https://developers.google.com/search/docs/appearance/snippet)
- [Google Search Central — 影响搜索结果中的标题链接（title link）](https://developers.google.com/search/docs/appearance/title-link)
- [Google Search Central — URL 结构最佳实践](https://developers.google.com/search/docs/crawling-indexing/url-structure)
- [Google Search Central — Google 图片 SEO](https://developers.google.com/search/docs/appearance/google-images)
- [Google Search Central — 让链接可抓取（内部链接 / 锚文本）](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
- [Open Graph 协议官方规范（ogp.me）](https://ogp.me/)
- [X (Twitter) Cards 官方文档](https://docs.x.com/)

## GitHub 地址

- [Open Graph 协议维护仓库（OpenGraph-protocol/og-website）](https://github.com/OpenGraph-protocol/og-website)
- [Google Search Central 文档仓库](https://github.com/google/search-central)

## 幻灯片地址

<a href="/SlideStack/on-page-seo-slide/" target="_blank">页面 SEO</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=694" target="_blank" rel="noopener noreferrer">页面 SEO 测试题</a>

## 相关章节

- [Lighthouse（SEO 审计）](../../performance/lighthouse/)：Lighthouse 的 SEO 类审计检查 title / meta description / robots / viewport / hreflang
- [结构化数据 / Schema.org 富结果](../structured-data/)：JSON-LD、Article / Product / Breadcrumb schema
- [技术 SEO / 爬取与索引](../technical-seo/)：robots.txt、sitemap、noindex、redirect、canonical 深入
- [Core Web Vitals / 性能优化](../../performance/lighthouse/)：LCP / INP / CLS
- [可访问性（a11y）](../../ux-optimization/accessibility/)：alt / heading 语义的 a11y 视角

