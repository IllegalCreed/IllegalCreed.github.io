---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Princeton GEO 论文（arXiv 2311.09735，KDD 2024）+ Google AI 优化指南（2026-07-10）+ llmstxt.org v1.7.0 社区提案编写

## 速查

- **GEO 全称**：Generative Engine Optimization（生成式引擎优化），Princeton 2023 提出
- **核心三策略**：Cite Sources / Quotation Addition / Statistics Addition
- **整体提升**：up to **40%**（GEO-bench）/ up to **37%**（真实引擎 Perplexity.ai）
- **低排名红利**：Rank-5 站点 Cite Sources **+115.1%** / Quotation **+99.7%** / Statistics **+97.9%**
- **反效果**：Keyword Stuffing 约 **-10%**
- **llms.txt 唯一必需段**：H1 标题
- **llms.txt ## Optional**：需要短上下文时可跳过
- **Google 立场**：明确不使用 llms.txt；明确「GEO/AEO 仍是 SEO」
- **AI 爬虫区分**：OAI-SearchBot=搜索露出 / GPTBot=训练；PerplexityBot=索引 / Perplexity-User=实时浏览
- **引用 ≠ 推荐**：被引用 ≠ 被背书
- **第三方露出**：Wikipedia / Reddit / 评测站比自有站更重要
- 完整说明见 [入门](./getting-started.md) / [核心策略与原理](./guide-line.md)

## llms.txt 文件格式表

| 段 | 必需 | 语法 | 作用 |
| --- | --- | --- | --- |
| H1 标题 | **是** | `# 项目名` | 唯一必需段，标识项目 |
| blockquote 摘要 | 否 | `> 摘要` | 项目一句话说明 |
| 详细说明段落 | 否 | 任意非标题段落 | 补充说明 |
| H2 文件列表 | 否 | `## 段名` + 列表 | 零或多个，每项为 markdown 超链接 |
| **## Optional** | 否 | `## Optional` + 列表 | **特殊语义**：需要短上下文时可跳过 |
| 文件项 | - | `- [name](url): 备注` | markdown 超链接 + 可选冒号备注 |

**完整最小示例**

```text
# Example Project

> A tool that does X for developers, by Answer.AI.

Detailed description goes here.

## Docs

- [Quickstart](https://example.com/start.md): 5 minutes to first run
- [API](https://example.com/api.md): Full reference

## Optional

- [Changelog](https://example.com/changelog.md): minor info
```

**.md 扩展名约定**

| 原 URL | 追加 .md 后 |
| --- | --- |
| `https://example.com/docs/api` | `https://example.com/docs/api.md` |
| `https://example.com/` | `https://example.com/index.html.md` |
| `https://example.com/guide/` | `https://example.com/guide/index.html.md` |

## Princeton GEO 9 种方法效果表

| 方法 | 中文 | 效果档位 | 备注 |
| --- | --- | --- | --- |
| **Cite Sources** | 引用源 | **Top-performing** | 低排名站点获益最大 |
| **Quotation Addition** | 引语 | **Top-performing** | 加专家 / 一手当事人引语 |
| **Statistics Addition** | 统计 | **Top-performing** | 加可验证统计数字 |
| **Authoritative** | 权威语气 | 中等 | 用肯定语气陈述 |
| **Fluency Optimization** | 流畅度 | 中等 | 提升语言流畅性 |
| **Easy-to-Understand** | 易理解 | 中等 | 简化表达 |
| **Unique Words** | 独特词 | 弱 | 提升词汇独特性 |
| **Technical Terms** | 技术术语 | 弱 | 加入专业术语 |
| **Keyword Stuffing** | 关键词堆砌 | **负效果（约 -10%）** | 传统 SEO 手段在 GEO 中失效 |

## Princeton 关键数字表

| 维度 | 数字 | 来源 |
| --- | --- | --- |
| 整体可见度提升 | **up to 40%** | GEO-bench 综合 |
| 真实引擎 Perplexity.ai 上 | **up to 37%** | 论文实证 |
| Rank-5 站点 Cite Sources | **+115.1%** | 低排名相对提升 |
| Rank-5 站点 Quotation Addition | **+99.7%** | 低排名相对提升 |
| Rank-5 站点 Statistics Addition | **+97.9%** | 低排名相对提升 |
| Keyword Stuffing | **约 -10%** | 唯一负效果方法 |
| 论文发表 | **KDD 2024** | 227+ 引用 |

## AI 搜索引擎对比

| 引擎 | 厂商 | 搜索露出爬虫 | 训练爬虫 | 实时浏览爬虫 | 备注 |
| --- | --- | --- | --- | --- | --- |
| **ChatGPT 搜索** | OpenAI | OAI-SearchBot | GPTBot | ChatGPT-User | 禁 OAI-SearchBot = 不出现在 ChatGPT 搜索 |
| **Perplexity** | Perplexity | PerplexityBot | （搜索索引兼任） | Perplexity-User | Perplexity-User 一般忽略 robots.txt |
| **Google AI Overviews / AI Mode** | Google | Googlebot | Google-Extended | - | 复用核心排名系统（RAG / grounding） |
| **Gemini** | Google | Googlebot | Google-Extended | - | 共用 Google 搜索底层 |
| **Copilot** | Microsoft | Bingbot | - | - | 基于 Bing 索引 |
| **Claude** | Anthropic | ClaudeBot | ClaudeBot | - | 主要面向开发者文档 |

> 各引擎爬虫策略与 User-Agent 仍在高频变动，任何具体做法需以各引擎最新官方文档为准。

## AI 爬虫的 robots.txt 控制

每个 bot 标签相互独立，可独立放行或拒绝：

```text
# 允许 ChatGPT 搜索露出，但拒绝训练
User-agent: OAI-SearchBot
Allow: /

User-agent: GPTBot
Disallow: /

# 允许 Perplexity 索引
User-agent: PerplexityBot
Allow: /

# 一刀切拒绝所有（不推荐，会丢全部 AI 搜索曝光）
# User-agent: *
# Disallow: /
```

**关键要点**

- **改动约 24 小时生效**：robots.txt 改动后需要等爬虫重新抓取
- **OpenAI / Perplexity 均发布可验证的 IP 段 JSON 端点**：便于 server 端精确识别
- **Perplexity-User 一般忽略 robots.txt**：因为它是用户实时触发的浏览，需通过 IP 鉴权等手段管理
- **禁 OAI-SearchBot 等于放弃 ChatGPT 搜索曝光**：站点不会出现在 ChatGPT 搜索回答中（仅可能作为导航链接）

## schema.org 关键类型

| 类型 | 作用 | 部署格式 |
| --- | --- | --- |
| **FAQPage** | 声明问答内容，利于 AI 抽取引用 | JSON-LD（`<script type="application/ld+json">`） |
| **HowTo** | 声明步骤式教学 | JSON-LD |
| **Article** | 声明文章主体 | JSON-LD |
| **Organization** | 声明组织信息 | JSON-LD |

> Google 官方强调：生成式 AI 搜索**不要求特殊 schema**。结构化数据应服务于整体 SEO（rich results），不要当作 GEO 独门秘籍。

## Google 生成式搜索关键术语

| 术语 | 含义 |
| --- | --- |
| **RAG / grounding** | 基于核心排名系统检索网页再生成回答 |
| **Query fan-out** | 模型并发派生相关子查询扩展召回（如「修草坪杂草」→「最佳除草剂」「无化学除草」「预防杂草」） |
| **AI Overviews** | Google 搜索结果顶部的 AI 摘要 |
| **AI Mode** | Google 全 AI 对话式搜索模式 |
| **Scaled content abuse** | 大规模内容滥用垃圾政策（禁止为查询变体批量造页） |

## 度量与诊断工具

| 工具 | 用途 |
| --- | --- |
| **Google Search Console → Generative AI performance report** | 衡量内容在 AI Overviews 等生成式功能中的可见度 |
| **Princeton GEO-bench** | 跨多领域大规模查询集 + 相关网页源 + 9 种优化方法的学术基准 |
| **第三方 AI 搜索可见度监测**（Profound / Otterly / AthenaHQ 等） | 商用 AI 搜索可见度监测平台，仍在演进 |

## 版本与状态

| 项 | 取值 |
| --- | --- |
| **llms.txt 规范** | 社区提案，v1.7.0（第三方标注），非 IETF/W3C 标准 |
| **llms.txt 提出时间** | 2024-09-03（Jeremy Howard / Answer.AI） |
| **Google AI 优化指南** | 2026-07-10 最新更新（对应 AI Overviews 与 AI Mode） |
| **Princeton GEO 论文** | 2023-11 v1 → 2024-06 v3，**KDD 2024 正式发表** |
| **Princeton 论文引用数** | 227+ |
| **Google 对 llms.txt 立场** | 明确不使用 |
| **Google 对 GEO/AEO 定调** | 明确「仍是 SEO」 |
| **整体演进阶段** | 标准未定、格局高频变动 |

## 官方资源

- llms.txt 标准提案：[https://llmstxt.org/](https://llmstxt.org/)
- Google AI 优化指南：[https://developers.google.com/search/docs/fundamentals/ai-optimization-guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- Princeton GEO 论文：[https://arxiv.org/abs/2311.09735](https://arxiv.org/abs/2311.09735)
- Princeton GEO GitHub：[https://github.com/princeton-nlp/GEO](https://github.com/princeton-nlp/GEO)
- OpenAI Crawlers 文档：[https://developers.openai.com/api/docs/bots](https://developers.openai.com/api/docs/bots)
- Perplexity Crawlers 文档：[https://docs.perplexity.ai/docs/resources/perplexity-crawlers](https://docs.perplexity.ai/docs/resources/perplexity-crawlers)
- Google Search Central：[https://developers.google.com/search/docs](https://developers.google.com/search/docs)
- schema.org：[https://schema.org/](https://schema.org/)
