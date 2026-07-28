---
layout: doc
---

# Perplexity API

**Perplexity 的在线检索+生成（Answer Engine）API**——通过 `sonar` 系列模型，一次调用完成「联网搜索 + 阅读源材料 + 引用生成答案」，自带 `search_results` 引用列表。区别于纯 LLM（如 GPT-5），sonar 每次回答都基于实时网页，几乎没有「知识截止」问题。

产品矩阵分四档：

- **sonar**：轻量搜索模型，快速事实查询 / 主题摘要 / 产品对比
- **sonar-pro**：高级搜索，支持复杂查询与多步 follow-up，引用更丰富
- **sonar-reasoning-pro**：精确推理（Chain-of-Thought），复杂分析
- **sonar-deep-research**：专家级深度研究，多轮搜索 + 综合报告

API 形态：

- **Sonar API**（OpenAI 兼容 Chat Completions）：`POST /v1/sonar`，最常用
- **Agent API**：`POST /v1/agent`（OpenAI `/v1/responses` 别名），支持多模态附件、原生工具调用、异步任务，是 Sonar Chat 的演进方向
- **Search API**：纯检索（不生成），用于 RAG 语料
- **Embeddings API**：嵌入模型

**关键澄清**：Perplexity **没有把 Sonar Chat 正式 deprecated**——官方表述是「Sonar Chat Completions is now Agent API」，提供迁移路径而非「已下线」。生产代码可继续用 Sonar Chat，新项目建议直接上 Agent API。

## 评价

**优点**

- **真联网**：每次回答基于实时网页，无知识截止
- **自带引用**：`search_results` 数组列出每个来源 URL + 标题 + 日期
- **OpenAI 兼容**：Sonar Chat 端点改 base URL 即可接入现有 OpenAI SDK 代码
- **多档模型**：从轻量 sonar 到深度 research，按复杂度选
- **流式**：支持 streaming，内容 chunk + 引用 + usage 渐进返回
- **多模态（Agent API）**：支持 `file_url` 文档/图像附件
- **学术模式**：`search_mode=academic` 限定学术源

**缺点**

- **延迟高**：要先搜索再生成，比纯 LLM 慢数秒-数十秒（deep-research 可达分钟级）
- **成本累加**：token 费 + per-request 费 + search query 费（deep-research）
- **引用不稳定**：JSON 模式下 citations 字段可能不可靠，建议用 `search_results`
- **无原生 Function Calling（Sonar Chat）**：Agent API 才有
- **生成风格偏「百科式」**：不如 GPT-5 灵活，创意写作弱
- **搜索覆盖**：付费墙 / 登录墙内容抓不到
- **大陆访问**：需代理，与 OpenAI 类似

## 文档地址

[docs.perplexity.ai](https://docs.perplexity.ai/)（含 `llms.txt` 索引）

## GitHub地址

[github.com/perplexity-ai](https://github.com/perplexity-ai)（SDK 与示例）

## 主要资源

- [Sonar Models](https://docs.perplexity.ai/docs/sonar/models)
- [Sonar Quickstart](https://docs.perplexity.ai/docs/sonar/quickstart)
- [Sonar Features](https://docs.perplexity.ai/docs/sonar/features)（streaming / citations）
- [Search Filters](https://docs.perplexity.ai/docs/search/filters/date-time-filters)
- [Agent API](https://docs.perplexity.ai/docs/agent-api)
- [Pricing](https://docs.perplexity.ai/docs/getting-started/pricing)
- [API Platform](https://www.perplexity.ai/api-platform)

## 推荐场景

| 场景 | 推荐 |
| --- | --- |
| 快速事实查询 / 摘要 | sonar |
| 复杂多步查询 + follow-up | sonar-pro |
| 需要逐步推理的分析 | sonar-reasoning-pro |
| 综合研究报告 | sonar-deep-research |
| OpenAI SDK 兼容接入 | Sonar Chat (`/v1/sonar`) |
| 多模态 / 原生工具调用 | Agent API (`/v1/agent`) |
| RAG 语料收集 | Search API |
| 创意写作 / 代码生成 | ❌ 用 GPT-5 / Claude |

## 幻灯片地址

<a href="/SlideStack/perplexity-api-slide/" target="_blank">Perplexity API</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=perplexity-api" target="_blank" rel="noopener noreferrer">Perplexity API 测试题</a>
