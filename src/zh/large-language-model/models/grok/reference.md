---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 xAI 官方 API（截至 2026-07）+ OpenAI SDK 兼容模式编写。完整 API Reference 见 [docs.x.ai](https://docs.x.ai/)。

## 速查

- Base URL：`https://api.x.ai/v1`
- 认证：`Authorization: Bearer $XAI_API_KEY`
- Chat：`POST /v1/chat/completions`
- Responses：`POST /v1/responses` / `GET/DELETE /v1/responses/{id}` / `POST /v1/responses/compact`
- 异步：`deferred=true` + `GET /v1/chat/deferred-completion/{request_id}`
- 图像：`POST /v1/images/generations`
- Batch API：`POST /v1/batch`
- Voice API：Realtime / TTS / STT
- 模型 ID 别名：`<name>` / `<name>-latest` / `<name>-<date>`
- 上限：`max_completion_tokens` 默认 128,000
- 参数黑名单：`logprobs`（grok-4.20+）/ `top_logprobs`（grok-4.20+）/ `logit_bias`（全系）
- 推理模型不支持：`frequency_penalty` / `presence_penalty` / `stop`
- 计费透明：`usage.cost_in_usd_ticks` + `num_sources_used`

## API Endpoints

| Endpoint | 用途 |
| --- | --- |
| `POST /v1/chat/completions` | OpenAI 兼容 Chat |
| `POST /v1/chat/deferred-completion/{request_id}` | 异步轮询 |
| `POST /v1/responses` | Responses API（原生工具集成） |
| `POST /v1/responses/compact` | 上下文压缩 |
| `GET /v1/responses/{id}` | 获取 response |
| `DELETE /v1/responses/{id}` | 删除 response |
| `POST /v1/images/generations` | Imagine 图像生成 |
| `POST /v1/video/generations` | Imagine 视频生成 |
| `POST /v1/batch` | 批处理 |
| `WS /v1/realtime` | Realtime Voice API |

## Chat Completions Schema

```ts
interface ChatCompletionRequest {
  model: string;                            // 必填
  messages: Message[];
  max_completion_tokens?: number;           // 默认 128,000；max_tokens 已弃用
  temperature?: number;                     // 0-2
  top_p?: number;
  n?: number;
  stream?: boolean;
  seed?: number;
  user?: string;
  stop?: string | string[];                 // 推理模型不支持
  presence_penalty?: number;                // 推理模型不支持
  frequency_penalty?: number;               // 推理模型不支持
  logit_bias?: Record<string, number>;      // 全系 Unsupported
  logprobs?: boolean;                       // grok-4.20+ Unsupported
  top_logprobs?: number;                    // grok-4.20+ Unsupported

  // xAI 独占
  search_parameters?: SearchParameters;
  reasoning_effort?: "none" | "low" | "medium" | "high";
  deferred?: boolean;
  prompt_cache_key?: string;
  service_tier?: "default" | "priority";

  // OpenAI 兼容
  tools?: Tool[];
  tool_choice?: ToolChoice;
  parallel_tool_calls?: boolean;
  response_format?: ResponseFormat;
}

interface SearchParameters {
  mode: "off" | "on" | "auto";
  sources: ("web" | "x")[];
  max_search_results?: number;
  from_date?: string;                       // ISO-8601
  to_date?: string;                         // ISO-8601
  return_citations?: boolean;
}

interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string | ContentPart[];
  name?: string;
  tool_call_id?: string;                    // role="tool" 必填
}

interface Tool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: JSONSchema;                 // 最多 128 个函数
  };
}

interface ResponseFormat {
  type: "text" | "json_object" | "json_schema";
  json_schema?: { name: string; schema: JSONSchema; strict?: boolean };
}
```

## 响应 Schema

```ts
interface ChatCompletionResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: "assistant";
      content: string | null;
      tool_calls?: ToolCall[];
    };
    finish_reason: "stop" | "length" | "tool_calls" | "content_filter";
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost_in_usd_ticks: number;              // xAI 独占：10^10 ticks/美元
    num_sources_used?: number;              // xAI 独占：搜索引用数
    prompt_tokens_details?: { cached_tokens: number };
    completion_tokens_details?: { reasoning_tokens: number };
  };
  citations?: Array<{                       // xAI 独占：搜索引用
    url: string;
    title: string;
    source: "web" | "x";
    snippet?: string;
  }>;
  system_fingerprint?: string;
}
```

## 模型 ID 速查

### Grok 文本模型（2026-07）

| Model | 上下文 | 输出上限 | 推理 | 知识截止 | 价格输入 | 价格输出 |
| --- | --- | --- | --- | --- | --- | --- |
| `grok-4.5` | **500K** | 128K | ✓（默认 high） | 2026-02-01 | $2 / $4（≥200K） | $6 / $12（≥200K） |
| `grok-4.3` | **1M** | 128K | ✓（可调） | - | $1.25 / $2.5 | $2.5 / $5 |
| `grok-4.20-0309-reasoning` | 1M | 128K | ✓ | - | - | - |
| `grok-4.20-0309-non-reasoning` | 1M | 128K | - | - | - | - |
| `grok-build-0.1` | 256K | 128K | - | - | $1 | $2 |
| `grok-4.20-multi-agent-0309` | 1M | 128K | ✓ | - | - | - |

### Cached Input（prompt cache 命中价）

| Model | 标准输入 | Cached 输入 | 节省 |
| --- | --- | --- | --- |
| `grok-4.5` | $2 / $4 | **$0.30** | 85% |
| `grok-4.3` | $1.25 / $2.5 | - | - |

### Imagine 图像 / 视频

| Model | 单价 |
| --- | --- |
| `grok-imagine-image` | $0.02 / 张 |
| `grok-imagine-image-quality` | $0.05 / 张 |
| `grok-imagine-video` | $0.05 / sec |
| `grok-imagine-video-1.5` | $0.08 / sec |

### Voice API

| 服务 | 价格 |
| --- | --- |
| Realtime | $0.05 / min |
| Text-to-Speech | $15 / 1M 字符 |
| Speech-to-Text（REST） | $0.10 / hr |
| Speech-to-Text（流式） | $0.20 / hr |

### 服务端工具（每千次）

| 工具 | 价格 |
| --- | --- |
| `x_search` / `web_search` / `code_execution` | $5 |
| `attachment_search` | $10 |
| `collections_search` / `file_search` | $2.5 |
| `view_image` / `view_x_video` | 按 token |

## 服务等级（service_tier）

| Tier | 倍率 | 备注 |
| --- | --- | --- |
| `default` | 1x | 标准价 |
| `priority` | **2x** | 所有 token 类型（含 cached）翻倍 |

```python
response = client.chat.completions.create(
    model="grok-4.5",
    messages=[...],
    service_tier="priority",   # 关键时刻抢资源
)
```

## 模型别名规则

| 别名 | 行为 | 适用 |
| --- | --- | --- |
| `<name>`（如 `grok-4.5`） | 最新稳定版 | 日常开发 |
| `<name>-latest`（如 `grok-4.5-latest`） | 含最新功能（行为可能变） | 研发调试 |
| `<name>-<date>`（如 `grok-4.5-20260201`） | 锁定快照不更新 | **生产环境** |

::: warning 生产环境必锁日期

`<name>-latest` 会随官方发布行为变化（哪怕同一天）。生产应用锁 `<name>-<date>` 防回归。

:::

## 参数黑名单（不支持）

| 参数 | 适用模型 | 错误信息 |
| --- | --- | --- |
| `logprobs` | grok-4.20+ | `unsupported_parameter` |
| `top_logprobs` | grok-4.20+ | `unsupported_parameter` |
| `logit_bias` | 全系 | `unsupported_parameter` |
| `frequency_penalty` / `presence_penalty` / `stop` | 推理模型 | `unsupported_parameter` |
| `max_tokens` | 全系 | `deprecated_parameter` → 改用 `max_completion_tokens` |

## X Search 工具参数

```ts
interface XSearchTool {
  type: "x_search";
  query_type?: "keyword" | "semantic" | "user" | "thread";
  allowed_x_handles?: string[];             // 与 excluded_x_handles 互斥，最多 20 个
  excluded_x_handles?: string[];            // 与 allowed_x_handles 互斥，最多 20 个
  enable_image_understanding?: boolean;
  enable_video_understanding?: boolean;
  from_date?: string;                       // ISO-8601
  to_date?: string;                         // ISO-8601
  max_search_results?: number;
}
```

## Web Search 工具参数

```ts
interface WebSearchTool {
  type: "web_search";
  allowed_domains?: string[];               // 与 excluded_domains 互斥，最多 5 个
  excluded_domains?: string[];              // 与 allowed_domains 互斥，最多 5 个
  enable_image_understanding?: boolean;     // 自动延伸到同请求 x_search
  enable_image_search?: boolean;            // 返回 Markdown 图片嵌入
  from_date?: string;
  to_date?: string;
  max_search_results?: number;
}
```

## SDK 支持

| SDK | 包名 | 备注 |
| --- | --- | --- |
| **OpenAI SDK Python** | `openai` | 改 `base_url` 即可，零迁移 |
| **OpenAI SDK Node** | `openai` | 改 `baseURL` 即可 |
| **Vercel AI SDK** | `@ai-sdk/xai` | `import { xai } from "@ai-sdk/xai"` |
| **xAI 原生 SDK** | `xai_sdk` | 官方原生（最新特性首发） |
| **LangChain** | `langchain-openai` | 配 `base_url` 使用 |
| **Cloudflare AI Gateway** | - | 加 cache / rate limit / 监控 |

## 错误码

| HTTP | 错误 | 含义 |
| --- | --- | --- |
| 400 | `invalid_request_error` | 参数错（model ID / unsupported_parameter） |
| 401 | `authentication_error` | API key 错 / 过期 |
| 402 | `payment_required` | console 余额不足 |
| 404 | `not_found_error` | model ID 错 / endpoint 不存在 |
| 422 | `validation_error` | 请求体 schema 错 |
| 429 | `rate_limit_error` | RPM / TPM 配额超 |
| 500 | `server_error` | xAI 内部错（重试） |
| 503 | `service_unavailable` | 模型过载（重试或切 model） |

## 速率限制（默认）

- 因 tier / 历史充值变化，console.x.ai dashboard 实时显示
- 触发 429 时建议：用 `prompt_cache_key` 降 token 用量 / Batch API 离线 / 切 `grok-4.3` 提量

## 版本里程碑

| 模型 | 时间 | 主要变化 |
| --- | --- | --- |
| Grok-1 | 2023-11 | 首发，314B MoE，2024-03 开源 |
| Grok-1.5 | 2024-05 | 128K 上下文 |
| Grok-2 | 2024-08 | 130K + Flux 图像生成 |
| Grok-3 | 2025-02 | **1M 上下文** + Think 推理模式 |
| Grok-3 API | 2025-04 | 上 API |
| Grok-4 / 4 Heavy | 2025-07 | **多智能体并行推理** / native tool use / real-time search |
| Grok-4.3 / 4.5 | 2026 | 旗舰升级，coding / agentic 主打 |

## 性能基准（Grok 4 Heavy 公开数据）

| Benchmark | Grok 4 Heavy | 对比 |
| --- | --- | --- |
| GPQA Diamond | **88%** | 优于 Gemini 2.5 Pro（84%） |
| AIME 2025 | 94% | - |
| Humanity's Last Exam | 38% | - |

::: warning 主观质量排名不在范围

社区实测编码单项略弱于 Claude 4.7 / GPT-5，本表仅引用公开数值不做综合排序。

:::

## 下一步

- [入门](./getting-started) —— SDK 安装 / 第一次调用
- [指南](./guide-line) —— 完整接口（搜索 / 工具 / Function Calling / Imagine / 多智能体）
- 对比：[Gemini](../gemini/) / [GPT](../gpt/) / [Claude](../claude/)
