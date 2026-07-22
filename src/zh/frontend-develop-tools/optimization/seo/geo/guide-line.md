---
layout: doc
outline: [2, 3]
---

# 核心策略与原理

> 基于 Princeton GEO 论文（arXiv 2311.09735，KDD 2024）+ Google AI 优化指南（2026-07-10）+ llmstxt.org v1.7.0 社区提案编写

## 速查

- **Princeton 三大 top 策略**：Cite Sources（引用源）/ Quotation Addition（引语）/ Statistics Addition（统计）——对低排名站点尤其有效
- **整体效果**：可见度提升 up to **40%**，真实引擎 Perplexity.ai 上 up to **37%**
- **低排名红利**：Rank-5 站点 Cite Sources **+115.1%** / Quotation **+99.7%** / Statistics **+97.9%**
- **反效果**：Keyword Stuffing（关键词堆砌）**约 -10%**——传统 SEO 手段在 GEO 中失效
- **Authoritative（权威语气）/ Fluency Optimization**：中等效果
- **引用 ≠ 推荐**：被引用为信息来源 ≠ 被背书
- **第三方露出**：Wikipedia / Reddit / 评测站比自有站更重要
- **清晰问答结构**：H1/H2 + 段落 + FAQPage schema，利于 RAG 切片与抽取
- **GEO ≠ SEO 替代**：Google 官方明确「GEO/AEO 仍是 SEO」
- **llms.txt 规范**：H1（必需）+ blockquote 摘要 + H2 文件列表（`[name](url): 备注`）
- **Google 不用 llms.txt**：社区提案，对 Claude/Perplexity 文档生态有价值
- **AI 爬虫区分**：搜索露出 ≠ 训练；可独立放行 / 拒绝

## GEO 概念深入

### 为何需要 GEO

生成式引擎（ChatGPT / Perplexity / Gemini / AI Overviews）的回答机制与传统搜索根本不同——它们用 **RAG（Retrieval-Augmented Generation）/ grounding** 检索相关网页，再生成一段富文本回答，把信息来源作为内联引用展示。这带来两个变化：

1. **用户行为变化**：直接读 AI 回答，不再像传统搜索那样看 10 条蓝色链接点链接进站
2. **可见度模型变化**：从「平均排名」转向「富文本内联引用」——位置、引用长度、引用风格都成为可见度维度

> 传统搜索平均排名 = 可见度；生成式引擎中「平均排名」不再是唯一指标，需看引用位置与篇幅。

### Google 生成式搜索的两个底层机制

- **RAG / grounding**：基于核心排名系统检索网页，再用检索到的内容生成回答——这意味着「被核心排名系统收录 + 有 snippet 资格」是进入生成式回答的前提
- **Query fan-out**：模型并发派生相关子查询扩展召回。例如「修草坪杂草」会派生「最佳除草剂」「无化学除草方法」「预防杂草再生」等子查询

> 理解 RAG + fan-out 才能理解「为何基础 SEO 仍是地基」——AI 引擎复用核心排名系统的检索结果，做不好基础 SEO 就进不了候选池。

## llmstxt.org 完整规范

**llms.txt**（[llmstxt.org](https://llmstxt.org/)，v1.7.0）是 Jeremy Howard / Answer.AI 于 2024-09-03 提出的社区提案，为大语言模型提供一个简洁、markdown 化的站点摄入入口。**非 IETF / W3C 官方 Web 标准**。

### 文件结构

部署在站点根路径 `/llms.txt`（可选子路径），完整结构如下：

```text
# {项目名}                          ← H1：唯一必需段

> {项目摘要}                         ← blockquote：一句话说明

{详细说明，任意非标题段落}            ← 可选段落

## {段落标题}                         ← H2：分段的文件列表（零或多个）
- [{文件名}]({url}): {备注}          ← 每项 markdown 超链接 + 可选备注

## Optional                           ← H2 Optional 段：特殊语义
- [{次要文件}]({url}): {备注}
```

### 各段说明

| 段 | 必需 | 作用 |
| --- | --- | --- |
| H1 标题 | **是** | 项目名，唯一必需段 |
| blockquote 摘要 | 否 | 项目一句话摘要 |
| 详细说明段落 | 否 | 任意非标题段落，补充说明 |
| H2 文件列表 | 否 | 零或多个 H2 分段，每项为 markdown 超链接 |
| **## Optional 段** | 否 | **特殊语义**：需要短上下文时可跳过该段 URL |

### .md 扩展名约定

建议为每个对 LLM 有用的页面在同 URL 后追加 `.md` 提供 markdown 纯文本版：

- `https://example.com/docs/api` → `https://example.com/docs/api.md`
- 无文件名 URL（如 `https://example.com/`）→ 追加 `index.html.md`

### llms-full.txt（可选伴随文件）

把重要文档拼接为单个全量文件，给 AI 爬虫一个高信令的单一摄入资源。**非 llmstxt.org 强制项**，是社区常见实践。

### 与相邻文件的区别

| 文件 | 目的 | 谁遵守 |
| --- | --- | --- |
| `robots.txt` | 控制爬虫访问（allow / disallow） | 所有 HTTP 爬虫 |
| `sitemap.xml` | 全量页面索引，告诉爬虫有哪些 URL | 传统搜索引擎 |
| `llms.txt` | 简洁 markdown 化内容摄入入口，面向 LLM inference（用户按需查询时） | 部分 LLM 生态（Perplexity / OpenAI / Anthropic 文档站） |

> **llms.txt 主要面向 inference（用户按需查询时）而非 training（模型训练）**。Google 官方明确不使用它——做了对 Google 排名无增益。

## Princeton GEO 研究

### 9 种优化方法及效果排序

Princeton 论文系统对比了 9 种优化方法在 GEO-bench（跨多领域大规模查询集 + 相关网页源）上的效果：

| 方法 | 中文 | 效果档位 | 说明 |
| --- | --- | --- | --- |
| **Cite Sources** | 引用源 | **Top-performing** | 添加权威来源链接 / 出处 |
| **Quotation Addition** | 引语 | **Top-performing** | 加入专家 / 一手当事人的直接引语 |
| **Statistics Addition** | 统计 | **Top-performing** | 加可验证的统计数字 |
| **Authoritative** | 权威语气 | 中等 | 用肯定、权威的语气陈述 |
| **Fluency Optimization** | 流畅度优化 | 中等 | 提升语言流畅性 |
| **Easy-to-Understand** | 易理解 | 中等 | 简化表达 |
| **Unique Words** | 独特词 | 弱 | 提升词汇独特性 |
| **Technical Terms** | 技术术语 | 弱 | 加入专业术语 |
| **Keyword Stuffing** | 关键词堆砌 | **负效果（约 -10%）** | 传统 SEO 手段，GEO 中表现差 |

### 关键实证数字

- **整体可见度提升**：up to **40%**（在 GEO-bench 上的综合表现）
- **真实引擎 Perplexity.ai 上**：up to **37%**（验证实验室效果可迁移到真实引擎）
- **低排名站点获益最大**：
  - Rank-5 站点 **Cite Sources +115.1%**
  - Rank-5 站点 **Quotation Addition +99.7%**
  - Rank-5 站点 **Statistics Addition +97.9%**

> 为何引用 / 统计 / 引语效果最好？生成式引擎**偏好可核验、可归因的事实依据**。低排名站点原本缺乏权威信号，加入可验证引用后相对提升反而最大。

### 论文版本

- 2023-11 v1 首发
- 2024-06 v3 修订
- **KDD 2024 正式发表**，是 GEO 学科奠基论文（227+ 引用）

## 引用 ≠ 推荐

这是 GEO 中最容易混淆的概念：

- **Citation（引用）**：AI 引擎把你的内容作为信息来源列出，可能伴随「据 X 称」「来源：X」等措辞
- **Recommendation（推荐）**：AI 引擎主动推荐你的产品 / 观点 / 服务

两者并不等价。引擎可能：

- **引用后给负面评价**：「据 X 站点声称 A 方法有效，但 Y 研究表明该方法有副作用」
- **引用后给中立陈述**：「关于此问题，X 与 Y 给出了不同观点」
- **引用作为背景**：仅作为讨论素材，并非主张其正确性

> **引用只带来曝光不等于转化**。GEO 优化者必须区分「citation」与「recommendation」，不要把「被引用次数」直接等同于「被背书次数」。

## 第三方露出比自有站更重要

AI 引擎常从高权威第三方站取材，自有站被引难度更高。Princeton 与 Google 都间接印证：核心排名系统 + 高权威来源偏好，使得 Wikipedia / Reddit / 评测站 / 行业媒体在 AI 回答中占比远超普通自有站。

### 经营第三方高权重露出

- **Wikipedia**：高权威 + 结构化内容，AI 引擎核心取材源之一
- **Reddit**：用户讨论 + 真实使用经验，Perplexity / ChatGPT 经常引用 Reddit 帖子
- **评测站（G2 / Trustpilot / Capterra）**：产品类查询的重要取材源
- **行业媒体（TechCrunch / The Verge 等）**：新闻类查询的核心来源
- **GitHub / Stack Overflow**：开发者技术类查询的高权威来源

> 对很多企业，**经营 Wikipedia / Reddit / GitHub 等第三方高权重露出比堆自有站内容更有效**。这条策略与「让 AI 引擎引用自有站」并不冲突——多渠道露出。

## 清晰问答结构

Google 官方强调：按段落 / 章节 + 标题提供清晰结构，既利于人类阅读，也利于 RAG 检索切片与生成引擎抽取。

### 工程动作

- **H1 / H2 / H3 标题层级清晰**：每段聚焦一个问题或主题
- **段落短小聚焦**：方便 RAG 切片器把内容切成独立语义单元
- **FAQPage / HowTo schema（JSON-LD）**：声明问答对与步骤式教学，便于 AI 抽取
- **直接回答体**：在标题后第一段直接给出答案，再展开细节
- **列表 / 表格**：结构化信息比连续段落更易被抽取

```text
<!-- FAQPage schema 示例 -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "GEO 是什么？",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "GEO 是生成式引擎优化，目标是让内容被 AI 搜索引擎引用。"
    }
  }]
}
</script>
```

> Google 官方明确：生成式 AI 搜索**不要求特殊 schema**。FAQPage / HowTo 主要服务于传统 rich results，是整体 SEO 的一部分，不要当作 GEO 独门秘籍。

## AI 搜索 vs 传统 SEO 区别

### 可见度模型差异

| 维度 | 传统搜索 | 生成式引擎 |
| --- | --- | --- |
| 排序形态 | 线性排名列表（10 条蓝色链接） | 富文本内联引用 |
| 可见度指标 | 平均排名 | 引用位置 / 引用长度 / 引用风格 |
| 用户行为 | 看标题点链接 | 直接读 AI 回答 |
| 转化路径 | 排名→点击→站内转化 | 引用曝光→可能不点击→需多渠道触达 |
| 优化重点 | 关键词 / 反链 / 技术健康 | 引用源 / 统计 / 引语 / 问答结构 / 第三方露出 |
| 度量工具 | Search Console（普通） | Search Console Generative AI report |

### Google 的官方立场（要点摘录）

- **「GEO/AEO 仍是 SEO」**：生成式 AI 功能根植于核心排名与质量系统
- **被索引且有 snippet 资格**是进入生成式回答的前提
- **AI 系统已能理解同义词与语义**：无需为每个搜索措辞变体精确匹配
- **页面长度服务于受众而非 AI**：系统能理解单页多主题并展示相关片段，无需为 AI 切碎内容

## 反模式（避坑）

### Keyword Stuffing（关键词堆砌）

Princeton 实证关键词堆砌在 GEO 中**表现不佳（约 -10%）**——生成式引擎不靠关键词密度排序，堆砌反而损害可读性与权威性。

### llms.txt 万能论

Google 官方明确不使用 llms.txt。它对面向 Claude / Perplexity / OpenAI 的开发者文档生态有 inference 价值，但不是通用搜索的敲门砖，**做了对 Google 排名无增益**。

### 为每个查询变体造页

Google 明确这违反 **scaled content abuse** 垃圾政策——为 query fan-out 的每个子查询单独造页，高页面数量不等于高质量，是无效长期策略。

### 把内容人为切碎（chunking）讨好 AI

Google 明确无此要求，系统能理解单页多主题。页面长度应服务于受众而非 AI。

### 为 AI 改写文风 / 穷举长尾关键词

AI 系统理解同义词与语义，无需为每个搜索措辞变体精确匹配，担心「长尾词不够」是多余的。

### 追求虚假「提及」（inauthentic mentions）

在博客 / 视频 / 论坛刷提及，Google 核心排名系统聚焦高质量内容、垃圾系统拦截，生成式功能依赖两者。

### 把结构化数据当万能药

Google 明确生成式 AI 搜索**不要求特殊 schema**，结构化数据应服务于整体 SEO（rich results）而非当作 GEO 独门秘籍。

### 一刀切封禁所有 AI 爬虫

`Disallow: *` 一刀切会同时放弃 ChatGPT / Perplexity / Gemini 搜索的引用曝光与潜在流量。应区分「搜索露出爬虫」（建议允许）与「训练爬虫」（可按需禁）。

### 把 GEO 当 SEO 替代

跳过基础 SEO（可抓取 / 可索引 / 内容质量 / 核心排名）直接做 GEO 增量是本末倒置——Google 官方定调「GEO/AEO 仍是 SEO」。

## 下一步

- [参考](./reference.md)：llms.txt 格式表 + Princeton 数据表 + AI 搜索引擎对比 + 爬虫清单 + 链接
