---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Tavily / Exa / SearXNG / Serper / SerpAPI / Brave Search 官方文档（2026 年）编写

## 速查

- 选型核心问题：要 LLM 答案？要原始 SERP？要语义？要自部署？
- Tavily 适合 RAG：`include_answer` + `chunks_per_source`
- Exa 适合语义：`type=neural` 找到关键词不匹配的相关内容
- Serper 适合 Google SERP：便宜（$0.3/1k）、快（1-2s）
- Brave 适合独立索引：不依赖 Google
- SearXNG 适合自部署/隐私/大陆：开源免费
- Agent 多步：每步用 tool 调用 search，结果回填 LLM
- 性能：缓存 + 批量 + 选对 search_depth

## 选型决策树

```
需求？
│
├─ 要 LLM 生成的答案摘要？
│     └ ✅ Tavily（include_answer=true）
│
├─ 要语义搜索（关键词不命中也能找到）？
│     └ ✅ Exa（type=neural）
│
├─ 要原始 Google SERP（organic + knowledge graph）？
│     ├ 极致便宜 → Serper（$0.3/1k）
│     └ 多引擎 + dashboard → SerpAPI
│
├─ 不依赖 Google / 要独立索引？
│     └ ✅ Brave Search API
│
├─ 大陆可达 / 隐私 / 自部署 / 免费？
│     └ ✅ SearXNG
│
└─ 学术研究 / 长文综合？
      └ Exa（type=deep）或 Tavily（advanced + max_results=20）
```

## RAG 索引实战

### Tavily 收集语料

```python
from tavily import TavilyClient
tavily = TavilyClient(api_key="tvly-xxx")

def collect_corpus(topic: str, n: int = 20) -> list[dict]:
    response = tavily.search(
        query=topic,
        search_depth="advanced",      # 多片段
        max_results=n,
        chunks_per_source=3,           # 每个 URL 3 个片段
        include_answer=False,          # RAG 自己生成，不要 Tavily 答案
        include_raw_content=True,      # 含全文
    )
    return response["results"]

docs = collect_corpus("RAG architecture best practices")
# 每个 doc: { title, url, content, raw_content, score }
```

### Exa 神经检索

```python
from exa_py import Exa
exa = Exa(api_key="exa-xxx")

def semantic_search(query: str) -> list:
    response = exa.search_and_contents(
        query,
        type="neural",
        num_results=10,
        use_autoprompt=True,           # 自动加 prompt 优化
        text=True,
        highlights={"numSentences": 5},
    )
    return response.results
```

`use_autoprompt=true` 让 Exa 自动给 query 加引导词（如「This page is about...」），提升神经检索质量。

### 索引到向量库

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
import chromadb

splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
embeddings = OpenAIEmbeddings()
client = chromadb.PersistentClient()
collection = client.get_or_create_collection("knowledge")

for doc in docs:
    chunks = splitter.split_text(doc["content"])
    vectors = embeddings.embed_documents(chunks)
    collection.add(
        documents=chunks,
        embeddings=vectors,
        metadatas=[{"url": doc["url"], "title": doc["title"]}] * len(chunks),
        ids=[f"{doc['url']}-{i}" for i in range(len(chunks))],
    )
```

## Agent 多步搜索

```python
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool

llm = ChatOpenAI(model="gpt-5")

@tool
def tavily_search(query: str) -> str:
    """搜索网页获取最新信息"""
    r = tavily.search(query=query, include_answer=True, max_results=5)
    return r["answer"] + "\n\nSources:\n" + "\n".join(
        f"- {x['title']}: {x['url']}" for x in r["results"]
    )

@tool
def fetch_url(url: str) -> str:
    """抓取 URL 全文"""
    import httpx
    return httpx.get(url, timeout=30).text[:5000]

llm_with_tools = llm.bind_tools([tavily_search, fetch_url])

response = llm_with_tools.invoke(
    "统计 GitHub 上 TypeScript 仓库 star 数最多的前 3 个组织，附上链接"
)
# 模型会自动多步：搜索 → 抓取 → 比较 → 汇总
```

## 性能调优

### 缓存

```python
import hashlib, redis
r = redis.Redis()

async def cached_search(query: str):
    key = f"search:{hashlib.sha256(query.encode()).hexdigest()}"
    cached = r.get(key)
    if cached:
        return json.loads(cached)

    result = tavily.search(query=query, ...)
    r.setex(key, 3600, json.dumps(result))  # 缓存 1 小时
    return result
```

### search_depth 选择

| 场景 | 推荐 depth |
| --- | --- |
| Chat 实时回答（用户在等） | `basic` 或 `fast` |
| RAG 索引（异步、要质量） | `advanced` |
| 学术研究 | `advanced` + max_results=20 |
| 简单事实查询 | `basic` |

### 并发

```python
import asyncio

async def batch_search(queries: list[str]):
    sem = asyncio.Semaphore(5)  # 限制并发 5
    async def one(q):
        async with sem:
            return await tavily_async_search(q)
    return await asyncio.gather(*[one(q) for q in queries])
```

## SearXNG 进阶

### 配置 engines

```yaml
# settings.yml
search:
  safe_search: 0
  autocomplete: ""
  default_lang: "zh-CN"
  formats:
    - html
    - json

engines:
  - name: google
    engine: google
    shortcut: g
    disabled: false
  - name: bing
    engine: bing
    shortcut: b
  - name: duckduckgo
    engine: duckduckgo
  - name: wikipedia
    engine: wikipedia
  - name: github
    engine: github
```

### 防爬

- 用 limiter_plugins 限速
- 配置 outgoing proxy
- 定期更新（引擎 CSS 选择器变化）

### 生产部署

```yaml
services:
  searxng:
    image: searxng/searxng:latest
    restart: always
    ports: ["8080:8080"]
    environment:
      - SEARXNG_BASE_URL=https://search.my.com/
      - UWSGI_WORKERS=4
    volumes:
      - ./searxng:/etc/searxng:rw
  # 加 Redis 缓存
  redis:
    image: redis:alpine
    command: redis-server --save 30 1 --loglevel warning
```

## 多 API 组合策略

```python
class HybridSearch:
    def __init__(self):
        self.tavily = TavilyClient(...)
        self.exa = Exa(...)
        self.serper_key = "..."

    async def search(self, query: str):
        # 1. 语义搜索（Exa）—— 找概念相关
        semantic = self.exa.search(query, type="neural", num_results=5)

        # 2. 关键词（Serper）—— 找精确命中
        keyword = self.serper_search(query, num=5)

        # 3. 去重 + 重排
        seen = set()
        merged = []
        for r in semantic.results + keyword["organic"]:
            if r.url not in seen:
                seen.add(r.url)
                merged.append(r)

        return merged[:10]
```

## 常见陷阱

| 陷阱 | 解决 |
| --- | --- |
| Tavily answer 不准 | 改 include_answer=advanced 或不用 answer 自己 LLM 生成 |
| Exa neural 慢 | 改 type=auto 或 fast |
| Serper 返回空 | gl/hl 配错，或 Google 该地区无结果 |
| SearXNG 某引擎失败 | 上游反爬，禁用该引擎或加代理 |
| RAG 语料质量差 | 用 Tavily advanced + 高 score 阈值过滤 |
| 成本爆炸 | 加缓存 + 仅对热门 query 调用 |
| 数据延迟 | 实时新闻用 topic=news，不依赖通用索引 |
| 中文搜索质量差 | Serper 配 hl=zh-CN / Tavily 配 region |

## 价格速查（2026）

| 服务 | 价格 | 免费 tier |
| --- | --- | --- |
| Tavily | basic 1 credit / advanced 2 credit | 1000 credits/月 |
| Exa | 按 token + 请求数 | 1000 searches/月 |
| Serper | $0.30/1k queries | 2500 次 |
| SerpAPI | $50/月起 5000 次 | 100 次/月 |
| Brave Search | $0.003/查询 起 | 2000 次/月 |
| SearXNG | 免费（自部署） | 无限 |

## 版本里程碑

| 时间 | 主要变化 |
| --- | --- |
| 2023 | Serper/SerpAPI 成熟；Tavily 发布（专为 LLM） |
| 2024 | Exa 神经搜索；Brave Search API GA；SearXNG 稳定 |
| 2025 | Tavily finance topic；Exa deep/deep-reasoning；多模态搜索兴起 |
| 2026 | AI 搜索 API 成为 RAG/Agent 标配；Tavily/Exa 与 LangChain 深度集成 |
