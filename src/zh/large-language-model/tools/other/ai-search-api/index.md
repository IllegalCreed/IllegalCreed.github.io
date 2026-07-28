---
layout: doc
---

# AI 搜索 API

**为 LLM / RAG / Agent 设计的搜索接口**——把传统搜索的「关键词匹配 + 排名」升级为「语义理解 + 答案生成 + 干净内容」。给 AI 应用提供联网能力，避免知识截止、降低幻觉。

主流方案分四类：

- **AI 原生搜索**：Tavily（专为 LLM 设计，返回 LLM 生成的答案）、Exa（神经+关键词语义搜索）
- **SERP 抓取**：Serper / SerpAPI（直接返回 Google 搜索结果 JSON，含 organic / knowledge graph / people-also-ask）
- **独立索引**：Brave Search API（自有独立 Web 索引，非 Google 代理）
- **元搜索 / 自托管**：SearXNG（聚合 Google/Bing/DuckDuckGo 等，开源自部署，无 API key 限制）

与传统搜索（Google/Bing 网页搜索）相比，AI 搜索 API 关键差异：**返回结构化干净 JSON**（去掉广告/追踪）、**自带 LLM 答案摘要**（Tavily 的 `answer` 字段）、**按 token 友好计费**、**支持语义查询**（Exa neural search）、**专为 RAG 设计**（chunks_per_source / contents.text 等）。

## 评价

**优点**

- **结构化输出**：JSON 而非 HTML，省去爬虫解析
- **LLM 答案摘要**：Tavily 直接返回 `answer` 字段
- **语义搜索**：Exa neural search 用向量匹配，关键词不匹配也能找到
- **干净无广告**：去掉 SERP 中的广告 / 追踪参数
- **大陆友好**：SearXNG 可自部署，无地区限制
- **独立索引**：Brave 不依赖 Google，避免单点

**缺点**

- **延迟比原生搜索高**：多一层 LLM 摘要
- **成本按 API 调用**：大规模 RAG 索引场景成本累加
- **数据新鲜度**：缓存层导致比 Google 实时结果慢几小时-几天
- **Tavily/Exa 等小厂**：服务可用性不如 Google/Bing
- **Serper/SerpAPI 依赖 Google**：Google 改版会立刻影响
- **SearXNG**：自部署运维成本，聚合源稳定性参差

## 文档地址

- Tavily：[docs.tavily.com](https://docs.tavily.com/)
- Exa：[docs.exa.ai](https://docs.exa.ai/)
- SearXNG：[docs.searxng.org](https://docs.searxng.org/)
- Serper：[serper.dev](https://serper.dev/)
- SerpAPI：[serpapi.com](https://serpapi.com/)
- Brave Search API：[brave.com/search/api](https://brave.com/search/api/)

## GitHub地址

- SearXNG：[github.com/searxng/searxng](https://github.com/searxng/searxng)
- Tavily Python SDK：[github.com/tavily-ai/tavily-python](https://github.com/tavily-ai/tavily-python)
- Exa SDK：[github.com/exa-labs/exa-js](https://github.com/exa-labs/exa-js)

## 推荐场景

| 场景 | 推荐方案 |
| --- | --- |
| RAG / AI Agent 联网 | Tavily（带 LLM 答案）/ Exa（语义） |
| 需要原始 Google SERP | Serper / SerpAPI |
| 不依赖 Google、独立索引 | Brave Search API |
| 大陆 / 隐私 / 自部署 | SearXNG |
| 学术 / 研究类语义检索 | Exa neural |
| 新闻 / 实时事件 | Tavily topic=news / Brave News |

## 幻灯片地址

<a href="/SlideStack/ai-search-api-slide/" target="_blank">AI 搜索 API</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=ai-search-api" target="_blank" rel="noopener noreferrer">AI 搜索 API 测试题</a>
