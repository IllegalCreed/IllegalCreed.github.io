---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Perplexity API 官方文档 docs.perplexity.ai（2026 年）编写

## 速查

- **Sonar Chat 端点**：`POST https://api.perplexity.ai/v1/sonar`（OpenAI 兼容）
- **Agent API 端点**：`POST https://api.perplexity.ai/v1/agent`（`/v1/responses` 别名）
- **Search API**：`POST /v1/search`（纯检索不生成）
- **Embeddings**：`POST /v1/embeddings`
- **模型**：`sonar` / `sonar-pro` / `sonar-reasoning-pro` / `sonar-deep-research`
- **关键参数**：`search_recency_filter`、`return_images`、`return_related_questions`、`search_domain_filter`、`web_search_options.search_context_size`、`reasoning_effort`
- **引用字段**：新代码用 `search_results`（旧 `citations` 已 deprecated）
- **流式**：`stream=true`，搜索结果在最后 chunk
- **价格**：sonar $1/$1，sonar-pro $3/$15，sonar-reasoning-pro $2/$8，sonar-deep-research $2/$8 + 引用费

## 获取 API Key

[perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) → Generate API key → 复制（仅一次显示）。

```bash
export PERPLEXITY_API_KEY=pplx-xxx
```

充值：[perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) → Add credits（信用卡，国内卡支持有限，推荐虚拟卡）。

## 第一次调用：Sonar Chat

```bash
curl https://api.perplexity.ai/v1/sonar \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sonar-pro",
    "messages": [
      {"role": "user", "content": "Vercel AI SDK v7 相比 5.x 有哪些主要变化？"}
    ]
  }'
```

Python（用 OpenAI SDK 兼容）：

```python
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["PERPLEXITY_API_KEY"],
    base_url="https://api.perplexity.ai/v1",
)

response = client.chat.completions.create(
    model="sonar-pro",
    messages=[
        {"role": "system", "content": "用中文简洁回答，列出关键点。"},
        {"role": "user", "content": "Vercel AI SDK v7 相比 5.x 有哪些主要变化？"},
    ],
)

print(response.choices[0].message.content)
print(response.search_results)   # 引用列表
```

### 响应结构（简化）

```json
{
  "id": "...",
  "model": "sonar-pro",
  "choices": [{
    "index": 0,
    "message": {"role": "assistant", "content": "Vercel AI SDK v7 主要变化..."},
    "finish_reason": "stop"
  }],
  "search_results": [
    {"title": "AI SDK v7 Migration", "url": "https://ai-sdk.dev/...", "date": "2026-01-15"},
    {"title": "...", "url": "...", "date": "..."}
  ],
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

::: tip 引用字段变迁

旧版返回 `citations` 数组（URL 列表），**已被 deprecated**——新代码应使用 `search_results`（含 title / url / date 更丰富信息）。文档明确建议用 `search_results` 替代 `citations`。

:::

## 模型选择

| 模型 | 用途 | Input $/M | Output $/M |
| --- | --- | --- | --- |
| `sonar` | 轻量搜索，快速事实 | $1 | $1 |
| `sonar-pro` | 复杂查询 + follow-up | $3 | $15 |
| `sonar-reasoning-pro` | 推理分析（CoT） | $2 | $8 |
| `sonar-deep-research` | 深度研究报告 | $2 | $8 + 引用 $2 + 搜索 $5/1k |

::: warning per-request 费

sonar / sonar-pro / sonar-reasoning-pro 还有 **per-request 费**（按 search_context_size：Low/Medium/High，$5-$14/1k 请求）。sonar-deep-research 按 search query 计（$5/1k searches）。所以「便宜」不只看 token 单价。

:::

## 关键参数

### search_recency_filter

按时间段过滤搜索结果：

```json
{
  "model": "sonar-pro",
  "messages": [{"role": "user", "content": "最近的 AI 模型新闻"}],
  "search_recency_filter": "week"
}
```

取值：`hour` / `day` / `week` / `month` / `year`。新闻场景必用。

### search_domain_filter

限定/排除域名：

```json
{
  "search_domain_filter": ["arxiv.org", "github.com"]
}
```

或排除模式（看官方具体语法）。适合学术 / 代码场景。

### web_search_options

```json
{
  "web_search_options": {
    "search_context_size": "medium"   // low / medium / high
  }
}
```

`search_context_size` 控制搜索深度（影响成本与质量）：low 最便宜快速，high 最贵但最全。

### reasoning_effort

```json
{
  "model": "sonar-deep-research",
  "reasoning_effort": "low"   // low / medium / high
}
```

仅 reasoning / deep-research 模型有效。

### return_images / return_related_questions

```json
{
  "return_images": true,
  "return_related_questions": true
}
```

返回图像列表 + 「相关问题」推荐（用于 follow-up）。

### search_mode

```json
{
  "search_mode": "academic"
}
```

学术模式，限定学术源。

## 流式响应

```python
stream = client.chat.completions.create(
    model="sonar-pro",
    messages=[{"role": "user", "content": "..."}],
    stream=True,
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

::: warning 引用在最后 chunk

**搜索结果与 metadata 在最后 chunk(s) 才返回，不在流式过程中渐进推送**。需要等流结束才能拿到完整 `search_results`。

:::

## Agent API（新方向）

```bash
curl https://api.perplexity.ai/v1/agent \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sonar-pro",
    "messages": [{"role": "user", "content": "..."}],
    "tools": [...],
    "file_url": "https://..." 
  }'
```

Agent API 相比 Sonar Chat 多：

- 原生 tool / function calling
- 多模态附件（`file_url` 文档/图像）
- 异步任务支持（`POST /v1/async/sonar`）
- `web_search_options` 更细粒度

`/v1/responses` 是 OpenAI 兼容别名。

::: tip Sonar Chat → Agent API 迁移

官方表述「Sonar Chat Completions is now Agent API」——提供迁移路径而非强制下线。生产代码可继续用 Sonar Chat，新项目建议直接上 Agent API 获得多模态 / 工具能力。

:::

## Search API（纯检索）

```bash
curl https://api.perplexity.ai/v1/search \
  -d '{"query": "...", "search_recency_filter": "month"}'
```

只返回搜索结果（无生成），适合 RAG 自己用 LLM 生成答案。

## Embeddings API

```python
response = client.embeddings.create(
    model="...",
    input="..."
)
```

用于向量化（具体模型名看官方模型列表）。

## 与 OpenAI SDK 完全兼容

由于 OpenAI 兼容，所有 OpenAI SDK（Python / Node / Go / 社区）都能直接用，只改 `base_url` 和 `api_key`。Vercel AI SDK 有 `@ai-sdk/perplexity` 官方包：

```typescript
import { perplexity } from '@ai-sdk/perplexity';
import { generateText } from 'ai';

const { text } = await generateText({
  model: perplexity('sonar-pro'),
  prompt: '...',
});
```

## 下一步

- [指南](./guide-line) —— 引用机制 / 多模态 / Agent API 深入 / 与 Perplexity Chat 区别 / 成本控制
- [参考](./reference) —— 全模型表 / 参数全表 / 价格 / 错误码
