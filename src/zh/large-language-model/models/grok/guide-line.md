---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 xAI 官方 API（截至 2026-07，主力 Grok 4.5 / 4.3 / 4.20 系列）+ OpenAI SDK 兼容模式编写。**重点接口与能力**。

## 速查

- Base URL：`https://api.x.ai/v1`；认证 `Authorization: Bearer $XAI_API_KEY`
- Chat：`POST /v1/chat/completions`（OpenAI 兼容）/ Responses：`POST /v1/responses`
- 搜索参数：`search_parameters: {mode, sources, max_search_results, from_date, to_date, return_citations}`
- 服务端工具：`x_search` / `web_search` / `code_execution` / `attachment_search` / `collections_search` / `file_search`
- X Search 4 种搜索：`keyword` / `semantic` / `user` / `thread`
- 推理控制：`reasoning_effort: none/low/medium/high`（仅推理模型；grok-4.5 默认 high）
- 异步：`deferred: true` + `GET /v1/chat/deferred-completion/{request_id}`
- 缓存：`prompt_cache_key` 粘性路由，cached input 省 85%
- 服务等级：`service_tier: default | priority`（priority 全部 2x）
- Function Calling：`tools` 数组（最多 128 个函数）+ `tool_choice` + `parallel_tool_calls`
- Structured Outputs：`response_format: {type: "json_schema", json_schema: {...}}`
- 模型别名：`<name>` / `<name>-latest` / `<name>-<date>`（生产锁日期）

## 接口对比一览

| API | Grok | Claude | GPT | Gemini |
| --- | --- | --- | --- | --- |
| Chat 端点 | `/v1/chat/completions`（OpenAI 兼容） | `/v1/messages` | `/v1/chat/completions` | `:generateContent` |
| 系统提示 | `messages[0].role="system"` | 顶层 `system` | `messages[0].role="system"` | `system_instruction` |
| 原生搜索 | **`search_parameters` + `web` / `x` 双源** | 无（用 MCP） | 无内置（需 bing） | Google Search grounding |
| 推理控制 | `reasoning_effort` | `thinking.budget_tokens` | `reasoning.effort` | `thinking_config.thinking_budget` |
| 异步模式 | `deferred: true` | Message Batches API | Batch API | BatchPredictionJob |
| 多智能体 | **`grok-4.20-multi-agent-0309` 原生** | subagent 框架 | 无原生 | 无原生 |

## Chat Completions 完整参数

```ts
interface ChatCompletionCreateParams {
  model: string;                       // grok-4.5 / grok-4.3 / grok-build-0.1 / ...
  messages: Message[];
  max_completion_tokens?: number;      // 默认 128,000；max_tokens 已弃用
  temperature?: number;                // 0-2
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];            // 推理模型不支持
  presence_penalty?: number;           // 推理模型不支持
  frequency_penalty?: number;          // 推理模型不支持
  seed?: number;
  user?: string;

  // xAI 独占
  search_parameters?: {
    mode: "off" | "on" | "auto";       // auto 让模型自主判断
    sources: ("web" | "x")[];          // 同时搜 Web + X
    max_search_results?: number;
    from_date?: string;                // ISO-8601
    to_date?: string;                  // ISO-8601
    return_citations?: boolean;
  };
  reasoning_effort?: "none" | "low" | "medium" | "high";   // 仅推理模型
  deferred?: boolean;                  // 异步模式
  prompt_cache_key?: string;           // 粘性路由
  service_tier?: "default" | "priority";

  // OpenAI 兼容
  tools?: Tool[];
  tool_choice?: "none" | "auto" | "required" | {type: "function", function: {...}};
  parallel_tool_calls?: boolean;
  response_format?:
    | {type: "text"}
    | {type: "json_object"}
    | {type: "json_schema", json_schema: {name, schema, strict}};

  // 不支持（grok-4.20+ / 全系）
  // logprobs?: boolean;              // Unsupported (grok-4.20+)
  // top_logprobs?: number;           // Unsupported (grok-4.20+)
  // logit_bias?: Record<string, number>;  // 全系 Unsupported
}
```

## 实时搜索（Grok 独占卖点）

### search_parameters（参数级入口，Chat Completions）

```python
response = client.chat.completions.create(
    model="grok-4.5",
    messages=[{"role": "user", "content": "对比 GPT-5 和 Grok 4.5 的最新基准"}],
    search_parameters={
        "mode": "on",                  # 强制搜索
        "sources": ["web", "x"],       # 同时搜 Web + X
        "max_search_results": 8,
        "from_date": "2026-06-01",     # ISO-8601 时间窗
        "to_date": "2026-07-27T00:00:00Z",
        "return_citations": True,
    },
)

# 引用列表（与 message 平级返回）
for cite in response.citations:
    print(cite.url, cite.title, cite.source)   # source: web | x
```

::: warning 不要与 tools 混用

`search_parameters`（参数级）与 `tools: [{type: "x_search"}]`（Responses 工具级）是两套入口，**同请求混用会重复计费或行为不确定**，按端点择一。

:::

### mode 选取建议

| 场景 | mode | 理由 |
| --- | --- | --- |
| 强时效（行情 / 新闻 / X 舆情） | `on` | 强制搜索保新鲜 |
| 通用对话（可能不需要搜） | `auto` | 模型自主判断，省成本 |
| 离线 / 纯知识问答 | `off` | 不调用工具，最快最便宜 |

## 服务端工具（Responses API + tools 数组）

`POST /v1/responses` 端点原生集成服务端工具：

```python
response = client.responses.create(
    model="grok-4.5",
    input="查 xai 官方最新公告",
    tools=[
        {
            "type": "web_search",
            "allowed_domains": ["x.ai", "docs.x.ai"],   # 与 excluded_domains 互斥，最多 5 个
            "enable_image_understanding": True,         # 自动延伸到同请求 x_search
            "enable_image_search": True,                # 返回 Markdown 图片嵌入
        },
        {
            "type": "x_search",
            "query_type": "semantic",                   # keyword / semantic / user / thread
            "allowed_x_handles": ["elonmusk", "xai"],   # 与 excluded_x_handles 互斥，最多 20 个
            "enable_image_understanding": True,
            "enable_video_understanding": True,
            "from_date": "2026-06-01",
        },
        {
            "type": "code_execution",                   # $5/1k 次
        },
        {
            "type": "attachment_search",                # $10/1k 次
        },
        {
            "type": "collections_search",               # $2.5/1k 次
            "collection_id": "col_xxx",
        },
    ],
)
```

### 工具计费（每千次）

| 工具 | 价格 |
| --- | --- |
| `x_search` | $5 / 1k |
| `web_search` | $5 / 1k |
| `code_execution` | $5 / 1k |
| `attachment_search` | $10 / 1k |
| `collections_search` / `file_search` | $2.5 / 1k |
| `view_image` / `view_x_video` | 按 token |

## Function Calling（OpenAI 兼容）

```python
tools = [{
    "type": "function",
    "function": {
        "name": "get_order",
        "description": "查询订单状态",
        "parameters": {
            "type": "object",
            "properties": {
                "order_id": {"type": "string", "description": "订单 ID"},
            },
            "required": ["order_id"],
        },
    },
}]

response = client.chat.completions.create(
    model="grok-4.5",
    messages=[{"role": "user", "content": "订单 12345 啥时候到？"}],
    tools=tools,
    tool_choice="auto",
    parallel_tool_calls=True,    # 最多 128 个函数
)

# 处理 tool_calls
for call in response.choices[0].message.tool_calls:
    args = json.loads(call.function.arguments)
    result = get_order(args["order_id"])
    # 回填 tool message 继续对话
```

## Structured Outputs（强制 JSON Schema）

```python
response = client.chat.completions.create(
    model="grok-4.5",
    messages=[{"role": "user", "content": "提取：xAI 推出 Grok 4.5，500k 上下文"}],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "product_info",
            "strict": True,       # 严格模式
            "schema": {
                "type": "object",
                "properties": {
                    "product": {"type": "string"},
                    "context_window": {"type": "integer"},
                },
                "required": ["product", "context_window"],
                "additionalProperties": False,
            },
        },
    },
)
```

## Imagine 图像 / 视频生成

### 图像

```bash
curl https://api.x.ai/v1/images/generations \
  -H "Authorization: Bearer $XAI_API_KEY" \
  -d '{
    "model": "grok-imagine-image-quality",   // 或 grok-imagine-image
    "prompt": "赛博朋克风格的杭州西湖夜景",
    "n": 1,
    "size": "1024x1024"
  }'
```

### 视频

```python
import requests
r = requests.post(
    "https://api.x.ai/v1/video/generations",
    headers={"Authorization": f"Bearer {XAI_API_KEY}"},
    json={
        "model": "grok-imagine-video-1.5",   # 或 grok-imagine-video
        "prompt": "5 秒延时：日落下的雪山云海",
        "duration_seconds": 5,
    },
)
print(r.json()["video_url"])
```

| 模型 | 价格 |
| --- | --- |
| `grok-imagine-image` | $0.02 / 张 |
| `grok-imagine-image-quality` | $0.05 / 张 |
| `grok-imagine-video` | $0.05 / sec |
| `grok-imagine-video-1.5` | $0.08 / sec |

## 多智能体（Heavy 架构）

`grok-4.20-multi-agent-0309` 原生多 agent 并行推理：

```python
response = client.chat.completions.create(
    model="grok-4.20-multi-agent-0309",
    messages=[{"role": "user", "content": "深度分析：2026 年大模型格局"}],
    reasoning_effort="high",
)
# 内部 4 个 agent 并行思考-辩论-共识，输出最终答案
```

适合：深度研究 / 多视角辩论 / 复杂推理。**优于自行 orchestrate**。

## 推理强度调优（reasoning_effort）

| 强度 | 适合 | tokens 用量 |
| --- | --- | --- |
| `none` | 简单问答 / 翻译 | 0 推理 token |
| `low` | 日常对话 | 少量 |
| `medium` | 中等复杂度任务 | 中等 |
| `high`（grok-4.5 默认） | 编码 / 数学 / 多步推理 | 大量 |

```python
# 调试时调低省钱
response = client.chat.completions.create(
    model="grok-4.3",
    messages=[...],
    reasoning_effort="low",
)
```

::: warning 计费注意

推理 token 与可见输出 token 都按模型价计费。`reasoning_tokens` 在 `usage.completion_tokens_details` 中可见。

:::

## 异步与 Batch（降本组合拳）

### deferred 异步模式

```python
r = requests.post(
    "https://api.x.ai/v1/chat/completions",
    headers={"Authorization": f"Bearer {XAI_API_KEY}"},
    json={
        "model": "grok-4.5",
        "messages": [...],
        "deferred": True,    # 返回 request_id 立即返回
    },
).json()
request_id = r["request_id"]

# 轮询
result = requests.get(
    f"https://api.x.ai/v1/chat/deferred-completion/{request_id}",
    headers={"Authorization": f"Bearer {XAI_API_KEY}"},
).json()
```

### Batch API（再享 20% 折扣）

- 支持：grok-4.3 / 4.20-* 系列
- **不支持**：grok-4.5（不享 Batch 折扣）
- 适合：离线大批量处理（标注 / 数据增强）

## 性能调优清单

- **生产锁 `<name>-<date>`**：避免别名随官方升级回归
- **长 prompt 设 `prompt_cache_key`**：cached input 省 85%
- **超长上下文选 grok-4.3**：1M 窗口 + 单价更低（$1.25/$2.5）
- **强时效场景显式 `mode="on"` + 时间窗**：避免被旧网页带偏
- **X Search 收窄 `allowed_x_handles`**：≤20 个权威账号，降低谣言风险
- **Web Search 开 `enable_image_understanding`**：自动延伸到 X Search
- **异步长任务用 `deferred=true`**：避免长连接超时
- **离线批用 Batch API**：grok-4.3 / 4.20-* 系列再省 20%
- **多智能体用原生 `grok-4.20-multi-agent-0309`**：优于手工 orchestrate

## 监控 / 调试 / 合规

**调试**：`usage.cost_in_usd_ticks` 精确到 10^10 ticks/美元 / `num_sources_used` 看搜索命中 / 用 SuperGrok Playground 调 prompt / dry-run 用 non-reasoning 模型

**监控**：console.x.ai dashboard / `usage.prompt_tokens_details.cached_tokens` 看 cache 命中率 / `usage.completion_tokens_details.reasoning_tokens` 看推理消耗

**合规**：

- **数据驻留**：xAI 数据中心在美国
- **不参与训练**：付费 API 数据**不用于训练**（免费 Tier 可能用，详 ToS）
- **审计日志**：console 提供调用历史
- **X 数据合规**：X 平台数据有 ToS 限制，引用需注明来源

## 故障排查

| 现象 | 排查 |
| --- | --- |
| `401 unauthorized` | API key 错 / 过期 / console 余额不足 |
| `429 rate_limit_exceeded` | 超 RPM / TPM 配额 |
| `400 unsupported_parameter` | 检查 logprobs / logit_bias / 推理模型传了 stop / penalty |
| `400 max_tokens_deprecated` | 改用 `max_completion_tokens` |
| 输出引用假新闻 | `return_citations=True` + 缩小 `allowed_x_handles` 到权威账号 |
| 知识陈旧 | 模型 cutoff 是 2026-02-01，启用 `search_parameters` |
| 风格不羁失控 | system prompt 显式「严肃专业，简明回答」 |
| 中文回复不自然 | system prompt 显式「用流畅中文回答」 |
| 长任务超时 | `deferred=true` + 轮询 |
| cache 命中率低 | 检查 `prompt_cache_key` 是否稳定不变 |
| 大陆延迟高 | 用 OpenRouter / Cloudflare AI Gateway |

## 大陆访问

不可直连。方案：

| 方案 | 难度 |
| --- | --- |
| 自备代理 | 低 |
| OpenRouter | 低 |
| Cloudflare AI Gateway | 中 |
| Vercel AI SDK（部署海外） | 中 |

## 下一步

- [入门](./getting-started) —— SDK 安装 / 第一次调用
- [参考](./reference) —— 完整模型 ID / 价格 / Schema / 参数黑名单
- 对比：[Gemini](../gemini/) / [GPT](../gpt/) / [Claude](../claude/)
