---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Perplexity API 官方文档 docs.perplexity.ai（2026 年）编写

## 速查

- 四档模型：sonar（轻量）/ sonar-pro（复杂）/ sonar-reasoning-pro（推理）/ sonar-deep-research（深度）
- 引用：用 `search_results`（旧 `citations` 已 deprecated）
- 流式：内容渐进，**搜索结果在最后 chunk**
- 时间过滤：`search_recency_filter`（hour/day/week/month/year）
- 域名过滤：`search_domain_filter`
- 搜索深度：`web_search_options.search_context_size`（low/medium/high）
- 学术：`search_mode=academic`
- 多模态 / 工具：用 Agent API（`/v1/agent`），不是 Sonar Chat
- 成本：token + per-request + search query（deep-research）
- OpenAI SDK 兼容：改 base_url 即可

## 引用机制详解

### search_results vs citations

```json
// 旧（deprecated）
"citations": ["https://a.com", "https://b.com"]

// 新（推荐）
"search_results": [
  {"title": "...", "url": "https://a.com", "date": "2026-01-15"},
  {"title": "...", "url": "https://b.com", "date": "2026-02-20"}
]
```

`search_results` 提供更丰富信息（title / date），且文档明确建议用它替代 `citations`。`citations` 仍返回但不保证长期。

### 引用渲染

```python
def render_answer_with_citations(response):
    answer = response.choices[0].message.content
    citations = response.search_results

    # 在答案末尾附引用
    output = answer + "\n\n**Sources:**\n"
    for i, c in enumerate(citations, 1):
        output += f"{i}. [{c['title']}]({c['url']}) ({c.get('date', '')})\n"
    return output
```

### 内联引用

Perplexity 生成内容**不一定带 `[1] [2]` 内联标记**。如需精确内联引用，可：

1. system prompt 要求模型用 `[n]` 标记
2. 后处理：把 `[1]` 替换成超链接到 `search_results[0].url`

::: warning JSON 模式不可靠

文档警告：「Requesting links as part of a JSON response may not always work reliably.」——所以**别依赖 JSON 模式返回 URL**，从 `search_results` 字段直接取。

:::

## 多步 follow-up

sonar-pro 支持复杂多步查询。通过多轮 messages 实现：

```python
messages = [
    {"role": "user", "content": "对比 Vercel AI SDK 和 LangChain"},
]

# 第一轮
r1 = client.chat.completions.create(model="sonar-pro", messages=messages)
messages.append({"role": "assistant", "content": r1.choices[0].message.content})

# follow-up
messages.append({"role": "user", "content": "那对中文项目哪个更合适？"})
r2 = client.chat.completions.create(model="sonar-pro", messages=messages)
```

每轮都重新搜索，保持上下文。

## Agent API 深入

### 工具调用

```bash
curl https://api.perplexity.ai/v1/agent \
  -d '{
    "model": "sonar-pro",
    "messages": [{"role": "user", "content": "查上海今天天气"}],
    "tools": [{
      "type": "function",
      "function": {
        "name": "get_weather",
        "parameters": {"type": "object", "properties": {"city": {"type": "string"}}}
      }
    }]
  }'
```

Agent API 原生支持 OpenAI 风格 tool calling，Sonar Chat 不支持。

### 多模态附件

```json
{
  "model": "sonar-pro",
  "messages": [{
    "role": "user",
    "content": "总结这份 PDF"
  }],
  "file_url": "https://example.com/doc.pdf"
}
```

支持文档 / 图像 URL 附件。

### 异步任务

```bash
# 提交（sonar-deep-research 耗时长）
POST /v1/async/sonar
{
  "model": "sonar-deep-research",
  "messages": [...]
}

# 返回 task_id，轮询
GET /v1/async/sonar/{task_id}
```

适合深度研究（可能跑几分钟）。

## search_context_size 调优

| size | 成本 | 质量 | 延迟 | 用途 |
| --- | --- | --- | --- | --- |
| `low` | 最便宜 | 中 | 快 | 简单事实 |
| `medium`（默认） | 中 | 高 | 中 | 一般查询 |
| `high` | 最贵 | 最高 | 慢 | 复杂研究 |

per-request 费按 size 分档（$5-$14/1k 请求）。

## search_domain_filter 实战

### 仅学术源

```json
{
  "model": "sonar-pro",
  "messages": [{"role": "user", "content": "Transformer 架构最新进展"}],
  "search_domain_filter": ["arxiv.org", "scholar.google.com", "semanticscholar.org"]
}
```

### 仅官方文档

```json
{
  "search_domain_filter": ["ai-sdk.dev", "sdk.vercel.ai", "vercel.com"]
}
```

### 排除（如某些付费墙）

具体语法见官方 filters 文档。

## 与 Perplexity Chat（产品）区别

| 维度 | Perplexity API | Perplexity Chat（网页/App） |
| --- | --- | --- |
| 形态 | REST API，开发者集成 | 终端用户产品 |
| 模型 | sonar 系列 | sonar 系列 + Pro 订阅解锁更多 |
| 控制 | 全参数（recency / domain / context_size） | UI 简化 |
| 计费 | 按 token + request + search | 月订阅（$20 Pro / $200 Max） |
| 引用 | `search_results` 字段 | UI 内嵌可点击 |
| 多模态 | Agent API 支持 | UI 完整支持 |
| 适合 | 应用集成 / 自动化 | 个人日常搜索 |

**API 不是 Chat 的简单包装**——是面向开发者的独立产品线，参数更细、模型选择更多。

## 与其他 AI 搜索对比

| 维度 | Perplexity API | Tavily | OpenAI + Browser |
| --- | --- | --- | --- |
| 形态 | 端到端（搜索+生成+引用） | 纯搜索（含可选 answer） | 自己组合 |
| 引用 | `search_results` | `results[].url` | 自己抓 |
| 多步 | sonar-pro 内置 | 自己写 Agent | 自己写 |
| OpenAI 兼容 | ✅（Sonar Chat） | ❌（独立 SDK） | ✅ |
| 延迟 | 中-高 | 低-中 | 高 |
| 适合 | 想要端到端答案 | 想要原始搜索结果做 RAG | 想完全控制 |

## 成本控制

### 选对模型

| 场景 | 模型 | 单次预估成本 |
| --- | --- | --- |
| 简单事实 | sonar (low context) | ~$0.001 |
| 一般查询 | sonar-pro (medium) | ~$0.01 |
| 复杂研究 | sonar-deep-research | ~$0.05-$0.5 |

### 缓存

```python
import hashlib, redis
r = redis.Redis()

async def cached_perplexity(query: str):
    key = f"pplx:{hashlib.sha256(query.encode()).hexdigest()}"
    cached = r.get(key)
    if cached:
        return json.loads(cached)

    response = call_perplexity(query)
    r.setex(key, 3600, json.dumps(response))  # 1 小时
    return response
```

### 降级策略

```python
def smart_query(query: str):
    if is_simple_factual(query):
        return perplexity("sonar", query, search_context_size="low")
    elif needs_reasoning(query):
        return perplexity("sonar-reasoning-pro", query)
    else:
        return perplexity("sonar-pro", query)
```

## 流式 + 引用完整代码

```python
def stream_with_citations(query: str):
    stream = client.chat.completions.create(
        model="sonar-pro",
        messages=[{"role": "user", "content": query}],
        stream=True,
    )

    full_text = ""
    search_results = []

    for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            full_text += delta.content
            yield {"type": "text", "content": delta.content}

        # 最后 chunk 才有 search_results
        if hasattr(chunk, "search_results") and chunk.search_results:
            search_results = chunk.search_results

    yield {"type": "citations", "results": search_results}
```

## 常见陷阱

| 陷阱 | 解决 |
| --- | --- |
| `citations` 字段为空 | 改用 `search_results` |
| JSON 模式 URL 不可靠 | 别依赖 JSON 返 URL，用 search_results |
| 流式拿不到引用 | 引用在最后 chunk，等流结束 |
| deep-research 超时 | 用异步 `/v1/async/sonar` |
| Sonar Chat 无 tool calling | 用 Agent API `/v1/agent` |
| 成本爆炸 | 降 search_context_size + 缓存 + 选 sonar 而非 pro |
| 引用过时 | 加 `search_recency_filter=month` |
| 学术质量差 | 加 `search_mode=academic` + domain_filter |
| 大陆访问 | 代理 + 虚拟卡 |

## 版本里程碑

| 时间 | 主要变化 |
| --- | --- |
| 2023 | Perplexity Chat 火爆，在线搜索+生成 |
| 2024 | Perplexity API 发布（pplx-* 模型），OpenAI 兼容 |
| 2025 | sonar 系列模型命名；sonar-pro / sonar-reasoning 引入 |
| 2025 末 | sonar-reasoning-pro / sonar-deep-research；Agent API |
| 2026 | `citations` → `search_results` 迁移；Agent API 成主推方向；多模态完善 |
