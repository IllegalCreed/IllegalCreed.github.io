---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Anthropic API v2026 + Claude 4 系列编写。完整文档见 [docs.claude.com/en/api](https://docs.claude.com/en/api/overview)。本页**重点列接口与能力**，与 GPT / Gemini 横向对比见下。

## API Endpoint

```
POST https://api.anthropic.com/v1/messages
Authorization: Bearer ${ANTHROPIC_API_KEY}
anthropic-version: 2025-12-01
content-type: application/json
```

## Request Schema

```ts
interface MessagesCreateParams {
  model: string;                       // 必填
  max_tokens: number;                  // 必填，<= 模型上限
  messages: Message[];                 // 必填
  system?: string | SystemBlock[];     // 系统提示，可分块（用于 cache）
  metadata?: { user_id?: string };
  stop_sequences?: string[];           // 自定义停止符
  stream?: boolean;
  temperature?: number;                // 0-1，默认 1.0
  top_p?: number;                       // 与 temperature 二选一
  top_k?: number;                       // 仅作 sampling 调试用
  tools?: Tool[];                       // function calling
  tool_choice?: ToolChoice;
  thinking?: { type: "enabled"; budget_tokens: number };  // Extended Thinking
  mcp_servers?: MCPServer[];           // MCP 集成
  service_tier?: "auto" | "standard_only" | "priority";   // Priority 50% 加速付费
}

interface Message {
  role: "user" | "assistant";
  content: string | ContentBlock[];
}

type ContentBlock =
  | { type: "text"; text: string; cache_control?: CacheControl }
  | { type: "image"; source: ImageSource }
  | { type: "document"; source: DocumentSource; cache_control?: CacheControl }
  | { type: "thinking"; thinking: string; signature: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: "tool_result"; tool_use_id: string; content: string | ContentBlock[]; is_error?: boolean };
```

## Response Schema

```ts
interface Message {
  id: string;
  type: "message";
  role: "assistant";
  model: string;
  content: ContentBlock[];
  stop_reason: "end_turn" | "max_tokens" | "stop_sequence" | "tool_use" | "pause_turn";
  stop_sequence: string | null;
  usage: Usage;
}

interface Usage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;    // Prompt Cache 首次写入
  cache_read_input_tokens?: number;        // Prompt Cache 命中
}
```

## 模型 ID 速查

| 模型 ID | 别名 | 上下文 | 输出上限 | 多模态 | Extended Thinking |
| --- | --- | --- | --- | --- | --- |
| `claude-opus-4-7` | Opus 4.7 | 200K | 8K | ✓ | ✓ |
| `claude-opus-4-7[1m]` | Opus 4.7 1M | 1M | 8K | ✓ | ✓ |
| `claude-sonnet-4-6` | Sonnet 4.6 | 200K | 8K | ✓ | ✓ |
| `claude-haiku-4-5-20251001` | Haiku 4.5 | 200K | 4K | ✓ | - |

旧版（仍可调）：

| ID | 状态 |
| --- | --- |
| `claude-opus-4` | 仍提供 |
| `claude-3-5-sonnet-20241022` | 仍提供（推荐 4.6 替代） |
| `claude-3-5-haiku-20241022` | 仍提供（推荐 4.5 替代） |
| `claude-3-opus-20240229` | 仍提供 |
| `claude-3-sonnet-20240229` | 已 retired |

## 关键接口能力（Claude 独有 / 特色）

### 1. Prompt Caching（核心降本能力）

```python
client.messages.create(
    model="claude-sonnet-4-6",
    system=[
        {
            "type": "text",
            "text": LONG_SYSTEM_PROMPT,   # > 1024 tokens
            "cache_control": {"type": "ephemeral"},
        }
    ],
    messages=[{"role": "user", "content": "..."}],
)
```

- **TTL**：5 分钟（ephemeral）
- **首次写入**：成本 25% 额外（比常规高）
- **命中读**：90% 折扣（仅 10% 常规价）
- **最大 4 个 cache breakpoint**：粒度控制（system + messages 不同段独立缓存）

::: tip 经济上算法

5 分钟内 ≥2 次请求复用就划算。Claude Code 类长会话场景命中率 80%+。

:::

### 2. Extended Thinking

```python
client.messages.create(
    model="claude-opus-4-7",
    thinking={"type": "enabled", "budget_tokens": 16000},
    messages=[...],
)
```

模型先生成「思考」token（不可见，用户看不到但计费），再生成最终回答。

- **budget_tokens**：思考阶段上限，1024-65536
- **可见性**：response 中 `type: "thinking"` block 含完整思考过程
- **流式**：thinking + text 都流式输出
- **价格**：思考 token 按 output 价计费

### 3. PDF 原生支持

```python
{
  "type": "document",
  "source": {
    "type": "base64",
    "media_type": "application/pdf",
    "data": "..."
  },
  "cache_control": {"type": "ephemeral"}   # PDF 也可缓存！
}
```

- 单 PDF ≤ 32MB
- 单 PDF ≤ 100 页
- 文字 + 图表 + 表格 都识别（扫描 PDF 不支持，需先 OCR）

### 4. MCP（Model Context Protocol）

```python
client.messages.create(
    mcp_servers=[
        {
            "type": "url",
            "url": "https://mcp.example.com",
            "name": "example",
            "authorization_token": "Bearer xxx",
        }
    ],
    ...
)
```

server 暴露的 tool 自动作为 Claude 可调工具——无需手写 `tools` 数组。这是 Anthropic 推动的协议，Claude API 一类支持。

### 5. Tool Use（function calling）

```python
tools=[
    {
        "name": "get_weather",
        "description": "...",
        "input_schema": {
            "type": "object",
            "properties": {...},
            "required": [...],
        },
        "cache_control": {"type": "ephemeral"},   # tools 也可缓存
    }
]
```

特色：

- **JSON Schema 不限子集**（GPT 早期有限制）
- **多 tool 并行调用**：单次回复可调多个
- **`tool_choice`**：`auto` / `any` / `tool` / `none`
- **`disable_parallel_tool_use`**：可关并行（兼容性）

### 6. Vision

```python
{
  "type": "image",
  "source": {
    "type": "base64",
    "media_type": "image/png",     # png / jpeg / gif / webp
    "data": "..."
  }
}

# 或 URL 引用
{
  "type": "image",
  "source": {"type": "url", "url": "https://..."}
}
```

- 单消息最多 100 图（视模型）
- 图分辨率自动 resize（最长边 ≤ 1568 px）
- 每图 token 估算：≈ `(W × H) / 750`

### 7. Batches API（50% 折扣）

```python
batch = client.messages.batches.create(
    requests=[
        {"custom_id": "task-1", "params": {...}},
        {"custom_id": "task-2", "params": {...}},
    ]
)
# 1 小时内完成
# 价格 50%
```

- 单 batch 最多 10,000 请求
- 24 小时内完成承诺（实际多在 1 小时内）
- 不占 RPM 配额

### 8. Files API

上传文件复用（避免每次重传 base64）：

```python
file = client.files.upload(
    file=open("paper.pdf", "rb"),
    purpose="user_data",
)

client.messages.create(
    messages=[{
        "role": "user",
        "content": [
            {"type": "document", "source": {"type": "file", "file_id": file.id}},
            {"type": "text", "text": "总结这份文档"},
        ]
    }],
    ...
)
```

- 文件最大 32MB（PDF）/ 5MB（图）
- 保留 30 天
- 复用次数无限

### 9. Streaming Events

```python
with client.messages.stream(...) as stream:
    for event in stream:
        if event.type == "message_start":
            print("started")
        elif event.type == "content_block_start":
            pass
        elif event.type == "content_block_delta":
            print(event.delta.text, end="")
        elif event.type == "content_block_stop":
            pass
        elif event.type == "message_delta":
            pass  # usage 更新
        elif event.type == "message_stop":
            break
```

事件类型：

| 事件 | 含义 |
| --- | --- |
| `message_start` | 消息开始 |
| `content_block_start` | 新 content block 开始 |
| `content_block_delta` | block 内容增量（text / thinking / input_json） |
| `content_block_stop` | 当前 block 结束 |
| `message_delta` | 消息级 delta（usage） |
| `message_stop` | 完结 |

### 10. Service Tier

`service_tier: "priority"` 付费加速（≈50% 价格上涨，延迟降 30%+）：

```python
client.messages.create(
    service_tier="priority",
    ...
)
```

适合：高峰期 / 实时 UI / 不能等待场景。

## SDK 列表

| 语言 | 包 | 维护 |
| --- | --- | --- |
| Python | `anthropic` | 官方 |
| TypeScript / JS | `@anthropic-ai/sdk` | 官方 |
| Go | `github.com/anthropics/anthropic-sdk-go` | 官方 |
| Ruby | `anthropic` (gem) | 官方 |
| Java | `com.anthropic:anthropic` | 官方 |
| Rust | 社区 | - |
| Swift | 社区 | - |

所有官方 SDK 行为一致——SDK 之间切换只换 import。

## Bedrock / Vertex AI 差异

| 维度 | Anthropic API | Bedrock | Vertex AI |
| --- | --- | --- | --- |
| 模型 ID 命名 | `claude-sonnet-4-6` | `anthropic.claude-sonnet-4-6-v1:0` | `claude-sonnet-4-6@20250620` |
| 鉴权 | API key | AWS SigV4 | GCP IAM |
| Region | 全球 | 按 AWS region | 按 GCP region |
| 价格 | 标准 | 同标准（AWS 加 0%） | 同标准 |
| 上下文 1M | ✓ | 部分 region | 部分 region |
| Batches | ✓ | ✓ | ✓ |
| MCP | ✓ | -    | -    |
| Prompt Cache | ✓ | ✓ | ✓ |
| Extended Thinking | ✓ | ✓ | ✓ |
| Streaming | ✓ | ✓ | ✓ |
| Tool Use | ✓ | ✓ | ✓ |

SDK 切换：

```python
# Anthropic 直连
from anthropic import Anthropic
client = Anthropic()

# Bedrock
from anthropic import AnthropicBedrock
client = AnthropicBedrock(aws_region="us-west-2")

# Vertex
from anthropic import AnthropicVertex
client = AnthropicVertex(region="us-east5", project_id="my-gcp-project")
```

## 错误码

| HTTP | 类型 | 含义 |
| --- | --- | --- |
| 400 | `invalid_request_error` | 参数错 |
| 401 | `authentication_error` | API key 错 / 过期 |
| 403 | `permission_error` | 该 model 无访问权限 |
| 404 | `not_found_error` | 资源不存在 |
| 413 | `request_too_large` | 请求体太大（image > 5MB / PDF > 32MB） |
| 429 | `rate_limit_error` | 超 RPM / ITPM / OTPM |
| 500 | `api_error` | Anthropic 内部错 |
| 529 | `overloaded_error` | 服务过载（重试） |

response header：

```
retry-after: 60
anthropic-ratelimit-requests-remaining: 49
anthropic-ratelimit-tokens-remaining: 49500
```

## Rate Limits（Tier 系统）

| Tier | 月消费 | RPM | ITPM | OTPM |
| --- | --- | --- | --- | --- |
| 1 | $0+ | 50 | 50K | 10K |
| 2 | $40+ | 1000 | 100K | 20K |
| 3 | $200+ | 2000 | 200K | 40K |
| 4 | $400+ | 4000 | 400K | 80K |
| 自定义 | $5000+ | 联系销售 | - | - |

按 model 独立计：不同模型用独立配额（Opus 限速不影响 Sonnet）。

## 价格速查（2026）

| 模型 | 输入 $/M | 输出 $/M | Cache 写入 $/M | Cache 读 $/M |
| --- | --- | --- | --- | --- |
| Opus 4.7 | $15 | $75 | $18.75 | $1.50 |
| Opus 4.7 (1M) | $30 | $150 | $37.50 | $3 |
| Sonnet 4.6 | $3 | $15 | $3.75 | $0.30 |
| Haiku 4.5 | $0.80 | $4 | $1.00 | $0.08 |

Batches: 50%。Priority: +50%。

## 与 GPT / Gemini 接口差异（核心）

| 能力 | Claude | GPT (OpenAI) | Gemini |
| --- | --- | --- | --- |
| **Prompt Caching** | 一类（4 breakpoints / 5min TTL） | 自动（5-15min） | Implicit + Explicit |
| **Extended Thinking** | ✓ (`thinking` block) | ✓ (o-series 内置) | ✓ (`thinkingConfig`) |
| **Tool Use** | JSON Schema 全集 | 受限子集 | Function Calling |
| **多 Tool 并行** | ✓ | ✓ | ✓ |
| **MCP 集成** | ✓ 一类 | -（社区） | -（社区） |
| **PDF 原生** | ✓（30MB / 100 页） | -（需先 vision OCR） | ✓ |
| **Files API** | ✓ | ✓ | ✓ |
| **Batches** | ✓（50%） | ✓（50%） | ✓ |
| **Streaming** | SSE | SSE | SSE |
| **System Prompt** | 顶层 `system` 字段 | `role: system` message | `systemInstruction` |
| **多模态输入** | image + PDF | image + PDF + audio + video | image + PDF + audio + video |
| **图像生成** | ✗（Claude 不生图） | ✓（DALL-E 集成 GPT-Image） | ✓（Imagen） |
| **音频输入** | ✗ | ✓（Realtime API + Whisper） | ✓ |
| **音频输出** | ✗ | ✓（TTS） | ✓ |
| **视频** | ✗（仅图） | ✓ | ✓ |
| **Web 搜索** | ✗（需 MCP） | ✓（内置 web_search tool） | ✓（grounding） |
| **代码解释器** | ✗（需 MCP） | ✓（code_interpreter tool） | ✓ |
| **结构化输出（JSON Schema）** | 通过 tool use | ✓ 一类（`response_format: json_schema`） | ✓ 一类（`responseSchema`） |
| **上下文窗口** | 200K / 1M | 128K-256K（看 model） | 1M / 2M |
| **Context Caching** | 5 min ephemeral | 5-15 min 自动 | 5-60 min implicit + 1h explicit |

::: tip 谁强在哪

- **Claude 强在**：编码 / Agent 长任务 / Tool Use 灵活 / MCP 一类 / Constitutional 安全
- **GPT 强在**：多模态全栈（图/音/视频） / 内置工具（web/code/image） / 结构化输出
- **Gemini 强在**：超长上下文（2M）/ 大规模 implicit cache / Google 工具生态

:::

## 资源链接

- 文档首页：[docs.claude.com](https://docs.claude.com/)
- API Reference：[docs.claude.com/en/api](https://docs.claude.com/en/api/overview)
- Cookbook：[github.com/anthropics/anthropic-cookbook](https://github.com/anthropics/anthropic-cookbook)
- Status：[status.anthropic.com](https://status.anthropic.com/)
- Console（dashboard）：[console.anthropic.com](https://console.anthropic.com/)
- SDK 仓库：
  - Python: [github.com/anthropics/anthropic-sdk-python](https://github.com/anthropics/anthropic-sdk-python)
  - TS: [github.com/anthropics/anthropic-sdk-typescript](https://github.com/anthropics/anthropic-sdk-typescript)
- MCP 协议：[modelcontextprotocol.io](https://modelcontextprotocol.io/)
- 价格：[anthropic.com/pricing](https://www.anthropic.com/pricing)
- 模型卡：[anthropic.com/news](https://www.anthropic.com/news)
