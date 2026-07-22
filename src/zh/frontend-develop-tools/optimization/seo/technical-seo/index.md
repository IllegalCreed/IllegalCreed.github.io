---
layout: doc
---

# 技术 SEO

技术 SEO（Technical SEO）是指**针对搜索引擎与 AI 爬虫如何发现、抓取、渲染、索引、理解站点结构**而做的工程性配置——它不写关键词、不优化内容，而是修路架桥：让 Googlebot 能进得来、看得见、读得懂、收得下。它的核心知识围绕 Google 处理页面的「**crawl（抓取）→ render（渲染）→ index（索引）**」三阶段展开：先用 HTTP 抓取初始 HTML，再交给 WRS（Web Rendering Service，基于 evergreen Chromium）执行 JS 渲染（可能延迟数秒到更久，非 200 状态码可能跳过），最后把渲染后的内容纳入索引。技术 SEO 的主要抓手包括：通过 SSR / SSG / prerender 让爬虫即时拿到完整 HTML（动态渲染只是 Google 已用过去式定位的 workaround）、用 robots.txt 控制 crawl、用 robots meta / X-Robots-Tag 控制 indexing（注意 robots.txt 的 `Noindex` 指令 Google 自 2019 年起不再支持）、用 `rel=canonical` 在约 40 个信号中明确规范页（重定向可靠性梯度：server-side 301/308 > meta refresh > JS location > crypto）、用 `hreflang` 双向链接 + `x-default` 兜底声明多语言变体（语言码 ISO 639-1 在前、区域码 ISO 3166-1 Alpha 2 在后，`be` 是白俄罗斯语而非比利时）、URL 用连字符分词且大小写敏感（`/Apple` ≠ `/apple`）、SPA 用 History API 而非 fragment 路由并防范 soft 404。**移动优先索引（Mobile-first indexing）** 自 2021-03 起对所有新站默认生效，移动版即索引来源；**Core Web Vitals** 三指标（LCP ≤ 2.5s / INP ≤ 200ms / CLS ≤ 0.1，INP 于 2024-03 替代 FID）作为 **page experience 排名信号**（信号之一，非决定性因素）。AI 搜索兴起后，**llms.txt**（约 v1.7.0，新兴提案标准）作为补充为 LLM 爬虫提供结构化站点概览。技术 SEO 与【性能优化】章（CWV 底层优化机制）、【框架】章（SSR/SSG 实现）的边界见各页开头。

## 评价

**优点**

- **工程化可量化**：robots / sitemap / canonical / hreflang / 重定向 / CWV 都有明确协议与阈值，可在 CI 中自动校验
- **官方文档活跃**：Google Search Central 持续更新（JS SEO basics 2026-03、Redirects 2026-04），sitemaps.org / web.dev / llmstxt.org 协议稳定
- **影响是否被收录**：技术 SEO 决定「能不能进索引」，是所有内容 / 外链优化的前置条件
- **与性能 / a11y 协同**：CWV 既是排名信号又是用户体验，SSR / SSG 既利爬虫又快
- **多入口控制**：HTML meta / HTTP 头 / sitemap 三种实现可按场景（HTML / 非 HTML / 大型站点）选择

**缺点**

- **Google 黑盒**：约 40 个 canonical 信号、渲染队列延迟、索引决策细节不透明，只能按官方最佳实践做而不能保证
- **动态内容天生吃亏**：JS 渲染队列延迟、SPA soft 404、fragment 路由不可索引——SPA 站需大量额外工程
- **协议多且易混**：robots.txt vs robots meta、noindex vs nofollow vs nosnippet、301 vs 302 vs meta refresh、hreflang 三种实现，新手极易踩坑
- **历史包袱深**：FID 已被 INP 替代、robots.txt `Noindex` 已被弃用、动态渲染已被定位为 workaround——网络上的旧资料常误导
- **CWV 只是信号**：精调 CWV 到极致而不做内容 / 外链，排名不会突飞猛进

## 文档地址

- [Google Search Central — JavaScript SEO 基础（三阶段 crawl→render→index）](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google Search Central — 动态渲染作为 workaround](https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering)
- [Google Search Central — 重定向与 Google 搜索](https://developers.google.com/search/docs/crawling-indexing/301-redirects)
- [Google Search Central — 合并重复 URL / canonicalization](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google Search Central — 移动优先索引最佳实践](https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-first-indexing)
- [Google Search Central — URL 结构最佳实践](https://developers.google.com/search/docs/crawling-indexing/url-structure)
- [Google Search Central — robots meta tag 与 X-Robots-Tag](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)
- [Google Search Central — 用 noindex 阻止索引（robots.txt Noindex 不被支持）](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- [Google Search Central — Core Web Vitals 与搜索结果](https://developers.google.com/search/docs/appearance/page-experience)
- [sitemaps.org — Sitemap 协议官方规范](https://www.sitemaps.org/protocol.html)
- [web.dev — Core Web Vitals](https://web.dev/articles/vitals)
- [llmstxt.org — llms.txt 规范](https://llmstxt.org/)

## GitHub 地址

- [Google Search Central 文档仓库](https://github.com/google/search-central)
- [llms.txt 规范维护仓库](https://github.com/answerdotai/llms-txt)

## 幻灯片地址

<a href="/SlideStack/technical-seo-slide/" target="_blank">技术 SEO</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=693" target="_blank" rel="noopener noreferrer">技术 SEO 测试题</a>

> 题目分类 ID 待回填：题库入库（`import:content:prod`）后取得 `技术方向 / 技术 SEO` 的 groupId，把 `PENDING` 替换为该 ID。
