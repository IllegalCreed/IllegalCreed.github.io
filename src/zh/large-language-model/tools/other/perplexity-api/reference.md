---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Perplexity API 官方文档 docs.perplexity.ai（2026 年）编写。完整 API 见 [docs.perplexity.ai](https://docs.perplexity.ai/)。

## 端点

| 端点 | 用途 |
| --- | --- |
| `POST /v1/sonar` | Sonar Chat Completions（OpenAI 兼容，最常用） |
| `POST /v1/agent` | Agent API（`/v1/responses` 别名，多模态+工具） |
| `POST /v1/search` | Search API（纯检索，不生成） |
| `POST /v1/embeddings` | Embeddings API |
| `POST /v1/async/sonar` | 异步任务（deep-research 等长任务） |
| `GET /v1/models` | 模型列表 |

Base URL：`https://api.perplexity.ai`

## Sonar 模型

| 模型 | 类别 | 用途 |
| --- | --- | --- |
| `sonar` | Search | 轻量，快速事实查询 / 摘要 / 对比 |
| `sonar-pro` | Search | 复杂查询 + 多步 follow-up，引用更丰富 |
| `sonar-reasoning-pro` | Reasoning | Chain-of-Thought 推理，复杂分析 |
| `sonar-deep-research` | Research | 专家级深度研究，多轮搜索+综合报告 |

::: tip 模型命名历史

早期 Perplexity API 用 `pplx-*` 前缀（如 `pplx-7b-online`、`pplx-70b-online`），后改为 `sonar-*` 系列。`llama-*` 系列也曾提供。当前主线是 sonar 系列。

:::

## 价格

### Token 价格（每 1M tokens）

| 模型 | Input | Output | Citation | Reasoning |
| --- | --- | --- | --- | --- |
| `sonar` | $1.00 | $1.00 | - | - |
| `sonar-pro` | $3.00 | $15.00 | - | - |
| `sonar-reasoning-pro` | $2.00 | $8.00 | - | - |
| `sonar-deep-research` | $2.00 | $8.00 | $2.00 | $3.00 |

### 额外费用

- **per-request 费**（sonar / sonar-pro / sonar-reasoning-pro）：按 `search_context_size` 分档，Low/Medium/High 对应 $5-$14 / 1k 请求
- **search query 费**（sonar-deep-research）：$5 / 1k searches

### usage 响应

```json
{
  "usage": {
    "prompt_tokens": 24,
    "completion_tokens": 412,
    "total_tokens": 436,
    "search_context_size": "medium",
    "cost": {
      "input_tokens_cost": 0.000072,
      "output_tokens_cost": 0.00618,
      "request_cost": 0.005,
      "total_cost": 0.011
    }
  }
}
```

## Sonar Chat Completions 请求

```bash
POST https://api.perplexity.ai/v1/sonar
Authorization: Bearer $PERPLEXITY_API_KEY
Content-Type: application/json

{
  "model": "sonar-pro",
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "..."}
  ],
  "max_tokens": 1024,
  "temperature": 0.2,
  "top_p": 0.9,
  "stream": false,

  "search_recency_filter": "month",
  "search_domain_filter": ["arxiv.org"],
  "search_mode": "academic",
  "web_search_options": {"search_context_size": "medium"},
  "return_images": false,
  "return_related_questions": false,

  "reasoning_effort": "medium"
}
```

### 参数全表

| 参数 | 类型 | 默认 | 含义 |
| --- | --- | --- | --- |
| `model` | string | - | 必填 |
| `messages` | array | - | 必填，OpenAI 兼容 |
| `max_tokens` | int | - | 输出上限 |
| `temperature` | float | 0.2 | 采样温度 |
| `top_p` | float | 0.9 | nucleus sampling |
| `top_k` | int | 0 | top-k 采样 |
| `stream` | bool | false | 流式 |
| `search_recency_filter` | `hour`/`day`/`week`/`month`/`year` | - | 时间过滤 |
| `search_domain_filter` | string[] | - | 域名过滤 |
| `search_mode` | `academic` 等 | - | 搜索模式 |
| `web_search_options` | object | - | `{search_context_size: low/medium/high}` |
| `return_images` | bool | false | 返回图像 |
| `return_related_questions` | bool | false | 返回相关问题 |
| `reasoning_effort` | `low`/`medium`/`high` | - | 推理强度（reasoning 模型） |
| `published_after` / `published_before` | MM/DD/YYYY | - | 精确日期范围 |
| `language_preference` | string | - | 语言偏好 |
| `latest_updated` | bool | - | 仅最新更新 |

### 响应

```json
{
  "id": "uuid",
  "model": "sonar-pro",
  "created": 1234567890,
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "答案文本..."
    },
    "finish_reason": "stop"
  }],
  "search_results": [
    {"title": "...", "url": "https://...", "date": "2026-01-15"}
  ],
  "related_questions": ["...", "..."],
  "images": [{"url": "...", "caption": "..."}],
  "usage": {...}
}
```

## Agent API 请求

```bash
POST https://api.perplexity.ai/v1/agent
Authorization: Bearer $PERPLEXITY_API_KEY

{
  "model": "sonar-pro",
  "messages": [{"role": "user", "content": "..."}],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "calculator",
        "description": "...",
        "parameters": {...}
      }
    }
  ],
  "file_url": "https://example.com/doc.pdf",
  "web_search_options": {"search_context_size": "medium"},
  "search_domain": "sec",
  "reasoning_effort": "low"
}
```

支持参数：messages / model / tools / file_url / web_search_options / search_domain / search_domain_filter / search_mode / latest_updated / published_after / published_before / language_preference / reasoning_effort / stream。

## Search API

```bash
POST /v1/search
{
  "query": "...",
  "search_recency_filter": "month",
  "max_results": 10
}
```

返回搜索结果（无生成内容），用于 RAG。

## 异步任务

```bash
# 提交
POST /v1/async/sonar
{"model": "sonar-deep-research", "messages": [...]}

# 响应含 task_id
# 轮询
GET /v1/async/sonar/{task_id}
```

## 引用字段

| 字段 | 状态 | 内容 |
| --- | --- | --- |
| `search_results` | ✅ 推荐 | `[{title, url, date}, ...]` |
| `citations` | ⚠️ deprecated | `[url, url, ...]` |

文档明确：所有应用应使用 `search_results` 字段替代 `citations`。

## 兼容性

### OpenAI SDK

```python
from openai import OpenAI
client = OpenAI(api_key=..., base_url="https://api.perplexity.ai/v1")
# 之后调用与 OpenAI 完全一致（chat.completions / embeddings）
```

### Vercel AI SDK

```typescript
import { perplexity } from '@ai-sdk/perplexity';
const model = perplexity('sonar-pro');
```

### LangChain

```python
from langchain_perplexity import ChatPerplexity
llm = ChatPerplexity(model="sonar-pro", pplx_api_key="...")
```

## 上下文窗口

- sonar / sonar-pro：约 127K-200K（按官方模型列表）
- sonar-deep-research：约 128K context，**输出上限约 33K tokens**

## 流式协议

每个 chunk 是 OpenAI 兼容 SSE：

```
data: {"choices":[{"delta":{"content":"..."}}]}
data: {"choices":[{"delta":{"content":"..."}}]}
...
data: [DONE]
```

**搜索结果与 usage 在最后 chunk**。

## 错误码

| HTTP | 含义 |
| --- | --- |
| 400 | 参数错 |
| 401 | API key 错 |
| 402 | 余额不足 |
| 404 | 模型不存在 |
| 413 | 请求体过大 |
| 429 | 限速 |
| 500 | 服务器错 |
| 503 | 服务不可用 |

## 限速

- 默认 RPM 与账号 tier 相关
- deep-research 并发更低（异步推荐）

## 资源链接

- 主文档：[docs.perplexity.ai](https://docs.perplexity.ai/)
- 文档索引：[docs.perplexity.ai/llms.txt](https://docs.perplexity.ai/llms.txt)
- 模型：[docs.perplexity.ai/docs/sonar/models](https://docs.perplexity.ai/docs/sonar/models)
- 快速开始：[docs.perplexity.ai/docs/sonar/quickstart](https://docs.perplexity.ai/docs/sonar/quickstart)
- 价格：[docs.perplexity.ai/docs/getting-started/pricing](https://docs.perplexity.ai/docs/getting-started/pricing)
- API 平台：[perplexity.ai/api-platform](https://www.perplexity.ai/api-platform)
- API Key 管理：[perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
- GitHub：[github.com/perplexity-ai](https://github.com/perplexity-ai)
