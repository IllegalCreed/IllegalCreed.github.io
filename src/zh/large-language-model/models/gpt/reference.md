---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 OpenAI API 2026 + GPT-5 系列编写。完整 API Reference 见 [platform.openai.com/docs/api-reference](https://platform.openai.com/docs/api-reference)。

## API Endpoints

| Endpoint | 用途 |
| --- | --- |
| `POST /v1/chat/completions` | 旧式对话（仍主力） |
| `POST /v1/responses` | 新式 Agent / 内置工具 |
| `POST /v1/embeddings` | 向量嵌入 |
| `POST /v1/images/generations` | 图像生成 |
| `POST /v1/audio/speech` | TTS |
| `POST /v1/audio/transcriptions` | Whisper STT |
| `POST /v1/audio/translations` | 音频翻译 |
| `POST /v1/files` | 文件上传 |
| `POST /v1/batches` | Batch processing |
| `WS /v1/realtime` | Realtime API（语音） |
| `POST /v1/vector_stores` | RAG vector store |
| `POST /v1/threads` | Assistants API（已 deprecated） |
| `GET /v1/models` | 模型列表 |

## Chat Completions Schema

```ts
interface ChatCompletionParams {
  model: string;
  messages: ChatMessage[];
  max_completion_tokens?: number;
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  logprobs?: boolean;
  top_logprobs?: number;
  logit_bias?: Record<string, number>;
  seed?: number;
  service_tier?: "auto" | "default" | "flex" | "priority";
  user?: string;
  tools?: Tool[];
  tool_choice?: "auto" | "none" | "required" | { type: "function"; function: { name: string } };
  parallel_tool_calls?: boolean;
  response_format?: { type: "text" } | { type: "json_object" } | { type: "json_schema"; json_schema: JsonSchemaSpec };
  reasoning_effort?: "low" | "medium" | "high";   // o-series only
  metadata?: Record<string, string>;
  store?: boolean;
}

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool" | "function" | "developer";
  content: string | ContentBlock[];
  name?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail?: "auto" | "low" | "high" } }
  | { type: "input_audio"; input_audio: { data: string; format: "wav" | "mp3" } };
```

## Responses Schema

```ts
interface ResponsesCreateParams {
  model: string;
  input?: string | InputItem[];
  instructions?: string;          // 替代 system
  previous_response_id?: string;  // 接续上次（替代 messages 历史）
  tools?: Tool[];
  tool_choice?: ToolChoice;
  text?: { format: TextFormat };  // 输出格式
  reasoning?: { effort: "low" | "medium" | "high" };  // o-series
  max_output_tokens?: number;
  stream?: boolean;
  store?: boolean;
  metadata?: Record<string, string>;
  truncation?: "auto" | "disabled";
  parallel_tool_calls?: boolean;
}

type Tool =
  | { type: "web_search"; search_context_size?: "low" | "medium" | "high" }
  | { type: "code_interpreter"; container: { type: "auto" } }
  | { type: "image_generation"; size?: string; quality?: string }
  | { type: "file_search"; vector_store_ids: string[] }
  | { type: "function"; name: string; parameters: object; strict?: boolean };
```

## 模型 ID 速查

### GPT-5 系列（旗舰，2025-2026）

| Model | 上下文 | 输出上限 | 价格输入 | 价格输出 |
| --- | --- | --- | --- | --- |
| `gpt-5` | 256K | 32K | $5/M | $25/M |
| `gpt-5-mini` | 256K | 32K | $0.50/M | $2.50/M |
| `gpt-5-nano` | 128K | 16K | $0.10/M | $0.40/M |

### o-series（推理增强）

| Model | 上下文 | 价格输入 | 价格输出 |
| --- | --- | --- | --- |
| `o3` | 200K | $15/M | $60/M |
| `o4-mini` | 200K | $1.50/M | $6/M |

### GPT-4o 系列（多模态）

| Model | 上下文 | 价格输入 | 价格输出 |
| --- | --- | --- | --- |
| `gpt-4o` | 128K | $2.50/M | $10/M |
| `gpt-4o-mini` | 128K | $0.15/M | $0.60/M |
| `gpt-4o-realtime-preview` | 128K | $5/M（文）+ $100/M（音输入）+ $200/M（音输出） | - |
| `gpt-4o-audio-preview` | 128K | 同上 | - |

### 旧版（仍可用，建议迁）

| Model | 上下文 | 状态 |
| --- | --- | --- |
| `gpt-4-turbo` | 128K | 可用 |
| `gpt-4` | 8K | 可用 |
| `gpt-3.5-turbo` | 16K | 可用，建议迁 mini |
| `o1` | 200K | 可用，建议迁 o3 |
| `o1-mini` | 128K | 可用，建议迁 o4-mini |

### 图像 / 音频模型

| Model | 用途 |
| --- | --- |
| `gpt-image-1` | 图像生成（DALL-E 继任者） |
| `dall-e-3` | 图像生成（仍可用） |
| `dall-e-2` | 图像生成 + 编辑 |
| `whisper-1` | Speech-to-Text |
| `tts-1` / `tts-1-hd` | Text-to-Speech |

### Embedding 模型

| Model | 维度 | 价格 |
| --- | --- | --- |
| `text-embedding-3-large` | 3072 | $0.13/M |
| `text-embedding-3-small` | 1536 | $0.02/M |
| `text-embedding-ada-002` | 1536 | $0.10/M（已 legacy） |

## 内置工具完整字段

### `web_search`

```json
{
  "type": "web_search",
  "user_location": {"country": "US"},
  "search_context_size": "medium"
}
```

| 字段 | 说明 |
| --- | --- |
| `user_location.country` | ISO 3166 国家代码 |
| `user_location.region` | 地区 |
| `user_location.city` | 城市 |
| `search_context_size` | low（1 page） / medium（默认 5）/ high（10+） |

### `code_interpreter`

```json
{
  "type": "code_interpreter",
  "container": {
    "type": "auto"   // 或具体 container_id
  }
}
```

容器内置 Python 3.12 + pandas / numpy / matplotlib / scipy 等常用库。每次会话独立沙箱，结束销毁。

### `image_generation`

```json
{
  "type": "image_generation",
  "model": "gpt-image-1",   // 默认
  "size": "1024x1024",       // 256x256 / 512x512 / 1024x1024 / 1024x1536 / 1536x1024
  "quality": "high",         // low / medium / high
  "n": 1,                     // 1-4
  "background": "transparent" // opaque / transparent
}
```

### `file_search`

```json
{
  "type": "file_search",
  "vector_store_ids": ["vs_xxx", "vs_yyy"],
  "max_num_results": 20,
  "filters": {
    "type": "and",
    "filters": [
      {"type": "eq", "key": "category", "value": "docs"}
    ]
  }
}
```

## Realtime API Schema

```ts
// WebSocket URL
wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview

// 客户端事件
type ClientEvent =
  | { type: "session.update"; session: SessionConfig }
  | { type: "input_audio_buffer.append"; audio: string /* base64 */ }
  | { type: "input_audio_buffer.commit" }
  | { type: "conversation.item.create"; item: Item }
  | { type: "response.create"; response: ResponseConfig }
  | { type: "response.cancel" };

// 服务端事件
type ServerEvent =
  | { type: "session.created"; session: Session }
  | { type: "input_audio_buffer.speech_started" }
  | { type: "response.audio.delta"; delta: string /* base64 */ }
  | { type: "response.audio_transcript.delta"; delta: string }
  | { type: "response.function_call_arguments.done"; name: string; arguments: string; call_id: string }
  | { type: "response.done" }
  | { type: "error"; error: Error };
```

## Structured Outputs JSON Schema 支持

| 支持 | 不支持 |
| --- | --- |
| `string` / `number` / `integer` / `boolean` | `not` |
| `enum` | `anyOf` 部分场景 |
| `array` + `items` | recursive >5 层 |
| `object` + `properties` + `required` | `additionalProperties: true`（必须 false） |
| `additionalProperties: false`（必须） | `properties` > 100 |
| nested object | `pattern`（部分） |
| Pydantic models (SDK) | string `format` 部分 |

## Rate Limits（Tier 系统）

| Tier | 月消费 | RPM | TPM |
| --- | --- | --- | --- |
| Free | $0 | 3 | 200K |
| 1 | $5+ | 500 | 30K |
| 2 | $50+ | 5000 | 450K |
| 3 | $100+ | 5000 | 1M |
| 4 | $250+ | 10K | 2M |
| 5 | $1000+ | 30K | 8M |

按 model + endpoint 独立限速。

## 价格速查（2026）

| Model | Input $/M | Output $/M | Cached $/M |
| --- | --- | --- | --- |
| GPT-5 | $5 | $25 | $2.50 |
| GPT-5-mini | $0.50 | $2.50 | $0.25 |
| GPT-5-nano | $0.10 | $0.40 | $0.05 |
| o3 | $15 | $60 | $7.50 |
| o4-mini | $1.50 | $6 | $0.75 |
| GPT-4o | $2.50 | $10 | $1.25 |
| GPT-4o-mini | $0.15 | $0.60 | $0.075 |

Batches: **50%** off。Flex: **50%** off（但延迟可能慢）。

## SDK 列表

| 语言 | 包 | 维护 |
| --- | --- | --- |
| Python | `openai` | 官方 |
| TypeScript / JS | `openai` | 官方 |
| .NET | `OpenAI` (NuGet) | 官方 |
| Java | `com.openai.api-client` | 官方 |
| Go | `github.com/openai/openai-go` | 官方 |
| Ruby | `ruby-openai` | 社区 |
| Swift | `MacPaw/OpenAI` | 社区 |

## Azure OpenAI 差异

| 维度 | OpenAI 直连 | Azure OpenAI |
| --- | --- | --- |
| 模型 ID | `gpt-5` | 部署名（自定义） |
| 鉴权 | API key | Azure AD / Key Vault |
| Endpoint | `api.openai.com` | `<resource>.openai.azure.com` |
| Region | 全球 | 按 Azure region（含香港 / 新加坡） |
| SLA | 无承诺 | Enterprise SLA |
| 内容审核 | 默认开 | 可关 |
| 模型更新 | 即时 | 滞后 1-2 月 |

```python
# Azure SDK
from openai import AzureOpenAI

client = AzureOpenAI(
    azure_endpoint="https://my.openai.azure.com/",
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    api_version="2025-12-01-preview",
)
```

## 错误码

| HTTP | 类型 | 含义 |
| --- | --- | --- |
| 400 | `invalid_request_error` | 参数错 |
| 401 | `authentication_error` | API key 错 |
| 403 | `permission_error` | model 无权限 |
| 404 | `not_found_error` | 资源不存在 |
| 429 | `rate_limit_exceeded` | 超 RPM/TPM |
| 500 | `server_error` | OpenAI 内部错 |
| 503 | `service_unavailable` | 过载 |

response header：

```
x-ratelimit-limit-requests: 5000
x-ratelimit-remaining-requests: 4999
x-ratelimit-reset-requests: 0s
```

## 与 Claude / Gemini 接口能力对比

详见 [Claude reference](../claude/reference#与-gpt-gemini-接口差异核心) 已列。简要：

| 能力 | GPT | Claude | Gemini |
| --- | --- | --- | --- |
| 内置 web_search | ✓ | -（需 MCP） | ✓（grounding） |
| 内置 code_interpreter | ✓ | -（需 MCP） | ✓ |
| 内置 image_generation | ✓ | ✗ | ✓（Imagen） |
| 内置 file_search RAG | ✓ | -（需自建） | ✓（Semantic Retrieval） |
| Realtime 双向语音 | ✓ | ✗ | ✓（Live API） |
| 音频输入 | ✓ Whisper | ✗ | ✓ |
| TTS | ✓ | ✗ | ✓ |
| Video 帧 | ✓ | -（仅图） | ✓ 原生 |
| Structured Outputs | ✓ 一类 strict | -（Tool Use 模拟） | ✓ 一类 |
| Prompt Cache | 自动 5-15min / 50% | 手动 5min / 90% | implicit + explicit |
| Tool Use 严格 schema | ✓（`strict: true`） | ✓ | ✓ |
| MCP | -（社区） | ✓ 一类 | -（社区） |
| 上下文 | 128-256K | 200K / 1M | 1M / 2M |
| 推理模型 | o-series | Extended Thinking | thinkingConfig |

## 资源链接

- 主文档：[platform.openai.com/docs](https://platform.openai.com/docs)
- API Reference：[platform.openai.com/docs/api-reference](https://platform.openai.com/docs/api-reference)
- Cookbook：[github.com/openai/openai-cookbook](https://github.com/openai/openai-cookbook)
- 价格：[platform.openai.com/docs/pricing](https://platform.openai.com/docs/pricing)
- Status：[status.openai.com](https://status.openai.com/)
- 模型对比：[platform.openai.com/docs/models](https://platform.openai.com/docs/models)
- Realtime 文档：[platform.openai.com/docs/guides/realtime](https://platform.openai.com/docs/guides/realtime)
- Structured Outputs 指南：[platform.openai.com/docs/guides/structured-outputs](https://platform.openai.com/docs/guides/structured-outputs)
- Azure OpenAI：[learn.microsoft.com/azure/ai-services/openai](https://learn.microsoft.com/azure/ai-services/openai/)
