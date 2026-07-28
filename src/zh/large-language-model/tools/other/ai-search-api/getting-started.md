---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Tavily / Exa / SearXNG / Serper / SerpAPI / Brave Search 官方文档（2026 年）编写

## 速查

- **Tavily**：`POST https://api.tavily.com/search`，参数 `query` / `search_depth`（basic/advanced）/ `max_results` / `include_answer` / `topic`（general/news/finance），返回带 `answer` 字段
- **Exa**：`POST https://api.exa.ai/search`，参数 `query` / `numResults` / `type`（auto/neural/keyword）/ `contents`（text/highlights/summary），语义搜索
- **Serper**：`POST https://google.serper.dev/search`，参数 `q` / `num` / `gl` / `hl` / `page`，返回 `organic` 数组
- **SerpAPI**：与 Serper 类似，参数更全（engine 等），有 dashboard
- **Brave Search**：`POST /res/v1/web/search`，参数 `q` / `count` / `country` / `search_lang` / `summary`
- **SearXNG**：自部署，`/search?format=json&q=...`，聚合 Google/Bing/DuckDuckGo
- Tavily basic = 1 credit，advanced = 2 credit

## Tavily 第一次调用

```bash
curl -X POST https://api.tavily.com/search \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "tvly-xxx",
    "query": "Vercel AI SDK v7 主要变化",
    "search_depth": "advanced",
    "include_answer": true,
    "max_results": 5
  }'
```

Python SDK：

```python
from tavily import TavilyClient
tavily = TavilyClient(api_key="tvly-xxx")

response = tavily.search(
    query="Vercel AI SDK v7 主要变化",
    search_depth="advanced",
    include_answer=True,
    max_results=5,
)

print(response["answer"])    # LLM 生成的答案摘要
for r in response["results"]:
    print(r["title"], r["url"], r["content"])
```

### 关键参数

| 参数 | 取值 | 含义 |
| --- | --- | --- |
| `query` | string | 必填 |
| `search_depth` | `basic` / `advanced` / `fast` / `ultra-fast` | basic = 1 credit（单 NLP 摘要/URL），advanced = 2 credit（多片段） |
| `max_results` | 0-20 | 默认 5 |
| `include_answer` | bool / `basic` / `advanced` | 是否返回 LLM 答案 |
| `include_images` | bool | 含图 |
| `topic` | `general` / `news` / `finance` | 搜索类别 |
| `chunks_per_source` | int | advanced 时每个 URL 返回的片段数 |

### basic vs advanced

- **basic**（1 credit）：每个 URL 返回 1 个 NLP 摘要，延迟低，适合快速查询
- **advanced**（2 credit）：每个 URL 返回多个相关文本片段（`chunks_per_source`），相关性最高但延迟增加

## Exa 第一次调用

```bash
curl -X POST https://api.exa.ai/search \
  -H "x-api-key: exa-xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "how to build RAG with TypeScript",
    "numResults": 5,
    "type": "auto",
    "contents": {
      "text": { "maxCharacters": 1000 },
      "highlights": { "numSentences": 3 },
      "summary": { "query": "TypeScript RAG implementation" }
    }
  }'
```

Python SDK：

```python
from exa_py import Exa
exa = Exa(api_key="exa-xxx")

response = exa.search_and_contents(
    "how to build RAG with TypeScript",
    num_results=5,
    type="neural",
    text=True,
    highlights=True,
    summary={"query": "implementation details"},
)

for r in response.results:
    print(r.title, r.url)
    print(r.text[:200])
```

### search type

| type | 含义 |
| --- | --- |
| `auto` | 默认，平衡质量与速度 |
| `neural` | 神经搜索——基于嵌入向量匹配，关键词不重合也能找到 |
| `keyword` | 传统关键词匹配 |
| `instant` | 极速（chat 实时场景） |
| `fast` | 高质量+低延迟（用户面向） |
| `deep-lite` | 轻量研究（含 synthesis） |
| `deep` | 多步综合研究 |
| `deep-reasoning` | 复杂分析推理 |

### 神经 vs 关键词

- **neural**：把 query 编码成向量，与网页内容向量比对。适合「我想找关于 X 的资料但不知道确切词」
- **keyword**：传统 BM25 类似，要求字面命中
- **auto**：Exa 自动选择

## Serper 第一次调用

```bash
curl -X POST https://google.serper.dev/search \
  -H "X-API-KEY: serper-xxx" \
  -H "Content-Type: application/json" \
  -d '{"q": "Vercel AI SDK", "num": 10, "gl": "us", "hl": "en"}'
```

返回：

```json
{
  "organic": [
    {"title": "...", "link": "https://...", "snippet": "...", "position": 1},
    ...
  ],
  "knowledgeGraph": {...},
  "peopleAlsoAsk": [...],
  "relatedSearches": [...]
}
```

参数：

| 参数 | 含义 |
| --- | --- |
| `q` | 查询（必填） |
| `num` | 结果数 |
| `gl` | 国家（如 `us` / `cn`） |
| `hl` | 语言（如 `en` / `zh`） |
| `page` | 分页 |
| `tbs` | 时间范围（如 `qdr:d` 24 小时内） |

### 不同端点

| 端点 | 用途 |
| --- | --- |
| `/search` | 通用搜索（organic） |
| `/news` | 新闻 |
| `/images` | 图片 |
| `/videos` | 视频 |
| `/places` | 地图地点 |
| `/scholar` | 学术 |

## SerpAPI

API 与 Serper 类似，差异：

| 维度 | Serper | SerpAPI |
| --- | --- | --- |
| 端点 | `google.serper.dev` | `serpapi.com/search.json` |
| 风格 | POST + JSON body | GET + query string |
| 引擎 | 仅 Google | 多引擎（Google/Bing/Baidu/Yandex/...） |
| Dashboard | 简单 | 功能全（保存查询 / 导出） |
| 价格 | $0.30/1k（最便宜） | $50/月 起 5000 次 |
| 适合 | 极致便宜 | 多引擎 + 可视化 |

## Brave Search API

```bash
curl -X POST 'https://api.search.brave.com/res/v1/web/search' \
  -H 'X-Subscription-Token: brave-xxx' \
  -H 'Accept: application/json' \
  -d '{"q": "Vercel AI SDK", "count": 10, "country": "US", "search_lang": "en"}'
```

特点：

- **独立 Web 索引**（不依赖 Google）—— 单点故障风险低
- 参数：`q` / `count` / `country`（2 字母）/ `search_lang` / `summary`
- 端点：`/res/v1/web/search`、`/res/v1/news/search`、`/res/v1/images/search`
- offset 最大 9（分页）

## SearXNG 自部署

### Docker 一键部署

```yaml
# docker-compose.yml
services:
  searxng:
    image: searxng/searxng:latest
    ports:
      - "8080:8080"
    volumes:
      - ./searxng:/etc/searxng
    environment:
      - SEARXNG_BASE_URL=http://localhost:8080/
```

开启 JSON API：编辑 `settings.yml`：

```yaml
search:
  formats:
    - html
    - json
```

### 调用

```bash
curl 'http://localhost:8080/search?q=Vercel+AI+SDK&format=json&engines=google,bing,duckduckgo'
```

返回聚合结果。可指定 engines / categories / language / time_range。

### 优势

- 完全开源，自部署，**无 API key、无配额**
- 聚合 70+ 搜索引擎（Google / Bing / DuckDuckGo / Wikipedia / GitHub / ...）
- 大陆可达（自部署在境内 VPS）
- 隐私友好（不记录 IP）

### 劣势

- 自部署运维（更新 / 防爬）
- 上游引擎反爬时该源失败
- 性能取决于上游

## 与传统搜索对比

| 维度 | 传统 Google/Bing | AI 搜索 API |
| --- | --- | --- |
| 输出 | HTML 页面 | 结构化 JSON |
| 答案 | SERP 摘要 | LLM 生成答案（Tavily） |
| 广告 | 多 | 无 |
| 语义理解 | 关键词 | 神经匹配（Exa） |
| 计费 | 免费（网页） | 按 API 调用 |
| 集成 | 需爬虫解析 | SDK 直接用 |
| 数据新鲜度 | 实时 | 缓存层（几小时延迟） |

## LangChain / LlamaIndex 集成

```python
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_community.utilities import GoogleSerperAPIWrapper

tool = TavilySearchResults(max_results=5)
results = tool.invoke("Vercel AI SDK v7")

serper = GoogleSerperAPIWrapper()
results = serper.results("Vercel AI SDK")
```

LangChain 内置 Tavily / Serper / Brave / Searx / SerpAPI 等多个 Search Tool wrapper。

## 下一步

- [指南](./guide-line) —— RAG 索引实战 / Agent 多步搜索 / 选型决策树 / 性能调优
- [参考](./reference) —— 全部端点 / 参数表 / 价格 / SDK 列表
