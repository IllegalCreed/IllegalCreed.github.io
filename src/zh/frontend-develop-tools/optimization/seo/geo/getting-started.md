---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Princeton GEO 论文（arXiv 2311.09735，KDD 2024）+ Google AI 优化指南（2026-07-10）+ llmstxt.org v1.7.0 社区提案编写

## 速查

- **GEO = Generative Engine Optimization**（生成式引擎优化），目标是让内容被 AI 搜索引擎**引用**（而非排名点击）
- **AI 搜索引擎生态**：ChatGPT 搜索 / Perplexity / Google AI Overviews / Gemini / Copilot / Claude
- **GEO ≠ SEO 替代品**：Google 官方明确「GEO/AEO 仍是 SEO」，GEO 是在质量地基上的增量
- **核心三策略**（Princeton 实证 top-performing）：Cite Sources（引用源）/ Quotation Addition（引语）/ Statistics Addition（统计）
- **关键数字**：整体可见度 up to **40%**、真实引擎 Perplexity.ai 上 up to **37%**、低排名站点获益最大
- **llms.txt**：部署在 `/llms.txt` 的社区提案（llmstxt.org），H1 + blockquote 摘要 + H2 文件列表
- **AI 爬虫区分**：OAI-SearchBot=搜索露出 ≠ GPTBot=训练；PerplexityBot=索引 ≠ Perplexity-User=实时浏览
- **引用 ≠ 推荐**：被引用为信息来源 ≠ 被背书，可能随后给负面评价
- **第三方露出**：Wikipedia / Reddit / 评测站比自有站更重要
- **反模式**：关键词堆砌（-10%）、为 AI 改写文风、刷虚假提及、llms.txt 万能论

## GEO 是什么

GEO 是 Princeton 团队 2023 年提出的概念，全称 **Generative Engine Optimization**（生成式引擎优化）——目标是**提升内容在生成式引擎（ChatGPT 搜索 / Perplexity / Gemini / Google AI Overviews 等）回答中的可见度**。与传统 SEO 优化「排名点击」不同，GEO 优化的是「被引用」的概率、位置、长度与引用风格。

> 「被引用」≠ 「被推荐」。AI 引擎可能引用你的内容作为信息来源，但随后给出负面或中立评价——引用是曝光，不是背书。

### GEO 的三个关键定位

- **目标层**：从「排名列表」转向「富文本内联引用」，平均排名不再是唯一可见度指标
- **方法层**：在基础 SEO（可抓取 / 可索引 / 语义 HTML / 移动体验）之上加「便于被 RAG 检索切片与生成引擎抽取」的优化
- **生态层**：包含 AI 搜索引擎生态（爬虫 / 引用机制 / 第三方露出）+ 社区提案（llms.txt）+ 学术基准（GEO-bench）

## GEO vs 传统 SEO

| 维度 | 传统 SEO | GEO |
| --- | --- | --- |
| 优化对象 | Google / Bing 等关键词搜索排名 | AI 生成式回答中的**引用** |
| 可见度模型 | 线性排名列表（平均排名=可见度） | 富文本内联引用（位置 / 长度 / 风格多维） |
| 用户行为 | 看标题点链接进站 | 直接读 AI 回答，引用是曝光入口 |
| 核心手段 | 关键词 / 反链 / 技术健康 | 引用源 / 统计 / 引语 / 清晰问答 / 第三方露出 |
| 转化路径 | 排名→点击→站内 | 引用曝光→可能不点击→需多渠道触达 |
| 度量工具 | Search Console / GA | GSC Generative AI report / GEO-bench |

> Google 官方定调：**GEO/AEO 仍是 SEO**。可抓取、可索引、内容质量、核心排名是 GEO 的地基，跳过 SEO 直接做 GEO 是本末倒置。

## AI 搜索引擎生态

主流生成式搜索引擎及其爬虫策略（仍在高频变动，需以各引擎最新官方文档为准）：

| 引擎 | 厂商 | 搜索露出爬虫 | 训练爬虫 | 实时浏览爬虫 |
| --- | --- | --- | --- | --- |
| **ChatGPT 搜索** | OpenAI | OAI-SearchBot | GPTBot | ChatGPT-User |
| **Perplexity** | Perplexity | PerplexityBot | （搜索索引兼任） | Perplexity-User |
| **Google AI Overviews / AI Mode** | Google | Googlebot（核心排名系统） | Google-Extended | - |
| **Gemini** | Google | Googlebot | Google-Extended | - |
| **Copilot** | Microsoft | Bingbot | - | - |
| **Claude** | Anthropic | ClaudeBot（主要面向开发者文档） | ClaudeBot | - |

**关键区分**

- **搜索露出 vs 训练**：OAI-SearchBot 仅用于 ChatGPT 搜索结果露出（非训练），GPTBot 用于模型训练——禁 OAI-SearchBot 等于放弃 ChatGPT 搜索曝光
- **robots.txt 独立控制**：每个 bot 标签相互独立，可只允许搜索露出爬虫、拒训练爬虫
- **可验证 IP 段**：OpenAI / Perplexity 均发布可验证的 IP 段 JSON 端点，便于 server 端精确识别

> Perplexity-User（用户实时浏览）一般忽略 robots.txt，因为它是用户主动触发的浏览行为，应通过 IP 鉴权等其他手段管理。

## llms.txt 速览

**llms.txt**（[llmstxt.org](https://llmstxt.org/)）是 Jeremy Howard / Answer.AI 于 2024-09-03 提出的社区提案——为大语言模型（LLM）提供一个简洁、markdown 化的站点摄入入口。它**不是 IETF / W3C 官方 Web 标准**。

**最小示例**

```text
# 项目名

> 项目摘要（blockquote）：一句话说明这是什么、面向谁、解决什么问题。

详细说明（任意段落）。

## 核心文档

- [快速开始](https://example.com/start.md): 五分钟跑起来
- [API 参考](https://example.com/api.md): 完整接口说明

## Optional

- [更新日志](https://example.com/changelog.md): 次要信息
```

**关键规范**

- **部署位置**：站点根路径 `/llms.txt`（可选子路径）
- **唯一必需段**：H1 标题（项目名）
- **可选段**：blockquote 摘要、详细说明段落、零或多个 H2 分段的文件列表
- **文件项格式**：markdown 超链接 `[name](url)` 后可选冒号加备注
- **## Optional 特殊语义**：当需要更短上下文时该段 URL 可被跳过，用于放置次要信息
- **.md 扩展名约定**：建议为每个对 LLM 有用的页面在同 URL 后追加 `.md` 提供 markdown 纯文本版

**配套文件 llms-full.txt**

可选伴随文件，把重要文档拼接为单个全量文件，给 AI 爬虫一个高信令的单一摄入资源。非 llmstxt.org 强制项，是社区常见实践。

> **Google 官方明确不使用 llms.txt**。它对面向 Claude / Perplexity / OpenAI 的开发者文档生态有 inference 价值，但不是 Google 通用搜索的敲门砖。

## 度量与诊断

- **Google Search Console → Generative AI performance report**：衡量内容在 AI Overviews 等生成式功能中的可见度，是被引用后的官方诊断出口
- **Princeton GEO-bench**：跨多领域大规模查询集 + 相关网页源 + 9 种优化方法的学术基准
- **第三方工具**（仍在演进）：Profound / Otterly / AthenaHQ 等 AI 搜索可见度监测平台

## 下一步

- [核心策略与原理](./guide-line.md)：GEO 概念深入 + llms.txt 完整规范 + Princeton 9 种方法 + 引用≠推荐 + 第三方露出 + 反模式
- [参考](./reference.md)：llms.txt 格式表 + Princeton 数据表 + AI 搜索引擎对比 + 爬虫清单 + 链接
