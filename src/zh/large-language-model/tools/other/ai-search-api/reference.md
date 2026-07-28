---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Tavily / Exa / SearXNG / Serper / SerpAPI / Brave Search 官方文档（2026 年）编写

## Tavily

### 端点

```
POST https://api.tavily.com/search
POST https://api.tavily.com/extract      # URL 内容抽取
POST https://api.tavily.com/crawl        # 站点爬取
```

### Search 参数

| 参数 | 类型 | 默认 | 含义 |
| --- | --- | --- | --- |
| `query` | string | - | 必填，搜索词 |
| `search_depth` | `basic`/`advanced`/`fast`/`ultra-fast` | `basic` | 深度 |
| `topic` | `general`/`news`/`finance` | `general` | 类别 |
| `day` | string | - | 仅 news：日期范围 |
| `time_range` | string | - | 如 `month` / `day` / `year` |
| `max_results` | int | 5 | 0-20 |
| `include_answer` | bool/`basic`/`advanced` | false | LLM 答案 |
| `include_raw_content` | bool | false | 全文 |
| `include_images` | bool | false | 含图 |
| `include_image_descriptions` | bool | false | 图描述 |
| `include_domains` | string[] | - | 仅这些域名 |
| `exclude_domains` | string[] | - | 排除域名 |
| `chunks_per_source` | int | - | advanced 时每 URL 片段数 |
| `country` | string | - | 如 `us` / `cn` |

### Search 响应

```json
{
  "query": "...",
  "answer": "LLM 生成的答案（如 include_answer=true）",
  "images": [{"url": "...", "description": "..."}],
  "results": [
    {
      "title": "...",
      "url": "...",
      "content": "片段文本",
      "raw_content": "全文（如开启）",
      "score": 0.95
    }
  ],
  "response_time": 2.3
}
```

### 价格

- basic：1 credit
- advanced：2 credit
- 免费 tier：1000 credits/月

## Exa

### 端点

```
POST https://api.exa.ai/search
POST https://api.exa.ai/contents          # 拿已知 URL 的内容
POST https://api.exa.ai/findSimilar       # 找相似网页
POST https://api.exa.ai/answer            # 直接答案
```

### Search 参数

| 参数 | 类型 | 默认 | 含义 |
| --- | --- | --- | --- |
| `query` | string | - | 必填 |
| `numResults` | int | 10 | 1-100 |
| `type` | `auto`/`neural`/`keyword`/`instant`/`fast`/`deep-lite`/`deep`/`deep-reasoning` | `auto` | 搜索模式 |
| `category` | string | - | `research`/`company`/`news`/`tweet`/`person`/`pdf`/`github` |
| `useAutoprompt` | bool | false | 自动加引导词 |
| `includeDomains` | string[] | - | 仅域名 |
| `excludeDomains` | string[] | - | 排除域名 |
| `startPublishedDate`/`endPublishedDate` | string | - | YYYY-MM-DD |
| `startCrawlDate`/`endCrawlDate` | string | - | 爬取时间 |
| `contents` | object | - | 见下 |
| `subpages` | int | - | 抓子页面 |
| `subpageTarget` | string[] | - | 子页路径 |

### contents 对象

```json
{
  "text": {"maxCharacters": 1000, "includeHtmlTags": false},
  "highlights": {"numSentences": 3, "highlightsPerUrl": 2, "query": "..."},
  "summary": {"query": "..."},
  "livecrawl": "always" / "fallback" / "never"
}
```

- `text`：全文
- `highlights`：LLM 识别最相关片段
- `summary`：LLM 总结
- `livecrawl`：实时抓取（保证新鲜）

### type 详解

| type | 延迟 | 质量 | 用途 |
| --- | --- | --- | --- |
| `instant` | 最低 | 中 | chat 实时 |
| `fast` | 低 | 高 | 用户面向 |
| `auto` | 中 | 高 | 默认 |
| `neural` | 中 | 高（语义） | 找概念相关 |
| `keyword` | 中 | 高（精确） | 找字面命中 |
| `deep-lite` | ~4s | 高（含 synthesis） | 轻研究 |
| `deep` | 慢 | 最高（多步综合） | 深度研究 |
| `deep-reasoning` | 最慢 | 最高（含推理） | 复杂分析 |

### 价格

- 按 search credits + 内容字符计费
- 免费 tier：1000 searches/月

## Serper

### 端点

```
POST https://google.serper.dev/search        # 通用
POST https://google.serper.dev/news          # 新闻
POST https://google.serper.dev/images        # 图片
POST https://google.serper.dev/videos        # 视频
POST https://google.serper.dev/places        # 地图
POST https://google.serper.dev/maps          # 地图详情
POST https://google.serper.dev/scholar       # 学术
POST https://google.serper.dev/shopping      # 购物
POST https://google.serper.dev/autocomplete  # 自动补全
```

### Search 参数

| 参数 | 含义 |
| --- | --- |
| `q` | 必填 |
| `num` | 结果数 |
| `gl` | 国家（如 `us` / `cn`） |
| `hl` | 语言（如 `en` / `zh-CN`） |
| `page` | 分页 |
| `tbs` | 时间过滤（`qdr:d`=24h, `qdr:w`=周, `qdr:m`=月） |
| `engine` | 默认 google |

### 响应

```json
{
  "organic": [
    {"title": "...", "link": "...", "snippet": "...", "position": 1, "date": "..."},
    ...
  ],
  "knowledgeGraph": {"title": "...", "description": "...", ...},
  "peopleAlsoAsk": [{"question": "...", "snippet": "...", "link": "..."}],
  "relatedSearches": ["...", "..."],
  "pagination": {...}
}
```

### 价格

- $0.30 / 1000 queries
- 免费 tier：2500 次
- 行业最便宜之一

## SerpAPI

### 端点

```
GET https://serpapi.com/search?engine=google&q=...&api_key=...
```

支持多 engine：`google` / `bing` / `baidu` / `yandex` / `duckduckgo` / `google_scholar` / `google_maps` / 等 30+。

### 参数

- `engine`：搜索引擎
- `q`：查询
- `location`：地理位置
- `google_domain` / `gl` / `hl`
- `num` / `start`（分页）
- `tbs`：时间过滤
- `api_key`：必填

### 响应

与 Serper 类似，但字段更全（含 `local_results` / `shopping_results` / `jobs` 等多种 SERP feature）。

### 价格

| Plan | 价格 | 次数/月 |
| --- | --- | --- |
| Free | $0 | 100 |
| Product Hunt | $50 | 5000 |
| Startup | $125 | 15000 |
| Business | $250 | 30000 |

## Brave Search API

### 端点

```
POST https://api.search.brave.com/res/v1/web/search
POST https://api.search.brave.com/res/v1/news/search
POST https://api.search.brave.com/res/v1/images/search
POST https://api.search.brave.com/res/v1/videos/search
```

也支持 GET（query string）。

### Web Search 参数

| 参数 | 类型 | 含义 |
| --- | --- | --- |
| `q` | string | 必填，≤400 字符/50 词 |
| `country` | string | 2 字母国家，或 `ALL` |
| `search_lang` | string | 语言（如 `en` / `zh-hans`） |
| `count` | int | 每页结果数 |
| `offset` | int | 分页（最大 9） |
| `safe_search` | `strict`/`moderate`/`off` | 安全搜索 |
| `units` | `metric`/`imperial` | 单位 |
| `result_filter` | string | 结果类型过滤 |
| `summary` | bool | 是否含 LLM 摘要 |
| `freshness` | string | 时间过滤（`pd`=24h, `pw`=周, `pm`=月） |

### 响应

```json
{
  "type": "search",
  "web": {
    "results": [
      {"title": "...", "url": "...", "description": "...", "age": "...", "position": 1}
    ]
  },
  "news": {...},
  "videos": {...},
  "query": {"original": "...", "show_strict_warning": false}
}
```

### 价格

- Free：2000 queries/月
- Pro：$0.003/查询 起

## SearXNG

### 端点（自部署）

```
GET http://your-host/search?q=QUERY&format=json&engines=...&categories=...
```

### 参数

| 参数 | 含义 |
| --- | --- |
| `q` | 查询 |
| `format` | `html`/`json`/`csv`/`rss` |
| `engines` | 引擎列表（逗号分隔，如 `google,bing`） |
| `categories` | `general`/`images`/`news`/`videos`/`it`/`science`/`files`/`social media` |
| `language` | `all`/`en`/`zh`/`zh-CN` |
| `pageno` | 页码 |
| `time_range` | `day`/`week`/`month`/`year` |
| `safesearch` | 0/1/2 |

### 支持 engines（70+）

Google / Bing / DuckDuckGo / Yahoo / Startpage / Brave / Wikipedia / GitHub / GitLab / Stack Overflow / Reddit / Hackernews / PubMed / arXiv / SoundCloud / Peertube / YouTube / 淘宝 / 京东 / 等。

### 配置 settings.yml

```yaml
use_default_settings: true

server:
  bind_address: "0.0.0.0"
  port: 8080
  secret_key: "..."   # 必填

search:
  safe_search: 0
  default_lang: "zh-CN"
  formats:
    - html
    - json

outgoing:
  request_timeout: 3.0
  max_request_timeout: 10.0
  useragent_suffix: ""
  # proxies:
  #   all://: 'socks5h://...'

engines:
  - name: google
    engine: google
    shortcut: g
    disabled: false
```

## SDK / 库

| 服务 | Python | JavaScript |
| --- | --- | --- |
| Tavily | `tavily-python` | `@tavily/core` |
| Exa | `exa_py` | `exa-js` |
| Serper | httpx 直接调 | `serper-sdk`（社区） |
| SerpAPI | `google-search-results` | `google-search-results` |
| Brave | httpx 直接调 | `brave-search` |
| SearXNG | httpx 直接调 | 直接调 |

## LangChain 集成

```python
from langchain_community.tools import (
    TavilySearchResults,
    BraveSearchWrapper,
)
from langchain_community.utilities import (
    GoogleSerperAPIWrapper,
    GoogleSearchAPIWrapper,
    SearxSearchWrapper,
)

# Tavily
tavily = TavilySearchResults(max_results=5)

# Serper
serper = GoogleSerperAPIWrapper()

# Brave
brave = BraveSearchWrapper(api_key="...")

# SearXNG（自部署）
searx = SearxSearchWrapper(searx_host="http://localhost:8080")
```

## 资源链接

- Tavily：[docs.tavily.com](https://docs.tavily.com/) / [github.com/tavily-ai](https://github.com/tavily-ai)
- Exa：[docs.exa.ai](https://docs.exa.ai/) / [github.com/exa-labs](https://github.com/exa-labs)
- SearXNG：[docs.searxng.org](https://docs.searxng.org/) / [github.com/searxng/searxng](https://github.com/searxng/searxng)
- Serper：[serper.dev](https://serper.dev/)
- SerpAPI：[serpapi.com](https://serpapi.com/)
- Brave Search API：[brave.com/search/api](https://brave.com/search/api/) / [api-dashboard.search.brave.com](https://api-dashboard.search.brave.com/)
