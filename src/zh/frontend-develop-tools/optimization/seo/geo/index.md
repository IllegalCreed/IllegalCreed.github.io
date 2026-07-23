---
layout: doc
---

# GEO

GEO（**Generative Engine Optimization**，生成式引擎优化）是 Princeton 团队在 2023 年论文《GEO: Generative Engine Optimization》（Aggarwal 等，arXiv 2311.09735，KDD 2024 发表）中提出的概念，目标是**让内容被 AI 搜索引擎（ChatGPT 搜索 / Perplexity / Gemini / Copilot / Google AI Overviews / Claude）引用**而非传统排名点击。它不是 SEO 的替代品——Google 官方明确「GEO/AEO 仍是 SEO」，而是在可抓取、可索引、内容质量等基础 SEO 之上，针对「被生成式回答引用」这一目标的增量优化。核心手段包括：添加可验证的统计与权威引用（Princeton 实证三类 top-performing 策略：**Cite Sources / Quotation Addition / Statistics Addition**）、用清晰问答结构（H1/H2 + FAQPage schema）方便 RAG 切片、放行 AI 搜索爬虫（OAI-SearchBot / PerplexityBot）、主动经营 Wikipedia / Reddit 等第三方高权重露出。Princeton 论文给出关键实证数字：整体可见度提升最高 **40%**、真实引擎 Perplexity.ai 上最高 **37%**，低排名站点获益最大（Rank-5 站点 Cite Sources 相对提升 +115.1%）。配套的社区提案 **llms.txt**（llmstxt.org，Jeremy Howard / Answer.AI 于 2024-09-03 提出）为 LLM 提供一个简洁、markdown 化的站点摄入入口，已成为 Perplexity / OpenAI / Anthropic 等开发者文档生态的常见实践，但 Google 官方明确**不使用** llms.txt。

## 评价

**优点**

- **目标直达新流量入口**：ChatGPT / Perplexity / AI Overviews 已成主流搜索路径，GEO 把内容「被引用」率当作一等指标，比单纯排名更贴近真实曝光
- **有可量化基准**：Princeton GEO-bench + Google Search Console Generative AI performance report 给出官方诊断出口，可对比优化前后效果
- **优化手段具体**：引用源 / 统计 / 引语 / 清晰问答 / 放行搜索爬虫 都是可立即落地的工程动作
- **低排名站点获益大**：Princeton 数据显示 Rank-5 站点 Cite Sources 相对提升 +115%，意味着新站也有弯道超车机会
- **与传统 SEO 互补**：不需要推翻既有 SEO 工作，只是在质量地基上加一层「便于被引用」的优化

**缺点**

- **标准未定、格局高频变动**：llms.txt 仅是社区提案（非 IETF/W3C 标准），Google 明确不采用；各 AI 引擎爬虫策略、引用风格、排名信号仍在变动
- **「被引用」≠「被推荐」**：AI 引用你的内容作为信息来源，可能随后给出负面或中立评价，引用只带来曝光不等于转化
- **自有站被引难度高**：AI 引擎常从 Wikipedia / Reddit / 评测站等高权威三方站取材，自有站往往需要先经营第三方露出
- **可控性弱于 SEO**：传统 SEO 能通过自身努力提升排名，GEO 还受 AI 模型生成风格、引用偏好影响，单站点努力难以直接转化为引用次数
- **易被噱头带偏**：llms.txt 万能论、为 AI 改写文风、刷虚假提及等反模式频出，Google 官方专门发文档点名纠正

## 文档地址

- [Google Search Central - AI 优化指南](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)（2026-07-10 最新）
- [llmstxt.org - llms.txt 标准官方提案](https://llmstxt.org/)
- [Princeton GEO 论文（arXiv 2311.09735）](https://arxiv.org/abs/2311.09735)
- [OpenAI Crawlers 官方文档](https://developers.openai.com/api/docs/bots)
- [Perplexity Crawlers 官方文档](https://docs.perplexity.ai/docs/resources/perplexity-crawlers)

## GitHub 地址

- [Princeton NLP GEO 论文仓库](https://github.com/princeton-nlp/GEO)
- [llms.txt 社区规范讨论](https://github.com/answerdotai/llms-txt)

## 幻灯片地址

<a href="/SlideStack/geo-slide/" target="_blank">GEO</a>

## 测试题


<a href="https://quiz.illegalscreed.cn/?category=696" target="_blank" rel="noopener noreferrer">GEO 测试题</a>
