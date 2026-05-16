---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Gemini 2.5 + `@google/genai` 新 SDK 编写。完整 API Reference 见 [ai.google.dev/api](https://ai.google.dev/api)。

## API Endpoints

| Endpoint | 用途 |
| --- | --- |
| `POST /v1/models/<model>:generateContent` | 非流式生成 |
| `POST /v1/models/<model>:streamGenerateContent` | 流式 |
| `POST /v1/models/<model>:countTokens` | 计 token |
| `POST /v1/cachedContents` | 创建 explicit cache |
| `POST /v1/files` | 上传文件 |
| `WS /ws/google.ai.generativelanguage.v1beta.GenerativeService/BidiGenerateContent` | Live API |
| `POST /v1/tunedModels` | 微调 |

Vertex AI 命名空间稍不同：`<region>-aiplatform.googleapis.com/v1/projects/<project>/locations/<region>/publishers/google/models/<model>:generateContent`。

## generateContent Schema

```ts
interface GenerateContentRequest {
  model: string;                        // path 中
  contents: Content[];                  // 必填
  systemInstruction?: Content;
  cachedContent?: string;               // Explicit cache name
  generationConfig?: GenerationConfig;
  safetySettings?: SafetySetting[];
  tools?: Tool[];
  toolConfig?: ToolConfig;
}

interface Content {
  role?: "user" | "model";
  parts: Part[];
}

type Part =
  | { text: string }
  | { inlineData: { mimeType: string; data: string /* base64 */ } }
  | { fileData: { mimeType: string; fileUri: string } }
  | { functionCall: { name: string; args: object } }
  | { functionResponse: { name: string; response: object } }
  | { executableCode: { language: "PYTHON"; code: string } }
  | { codeExecutionResult: { outcome: string; output: string } }
  | { thought: string }                  // 推理输出（不可见）
  | { videoMetadata: VideoMetadata };

interface GenerationConfig {
  stopSequences?: string[];
  responseMimeType?: "text/plain" | "application/json";
  responseSchema?: JSONSchema;
  candidateCount?: number;
  maxOutputTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  responseLogprobs?: boolean;
  logprobs?: number;
  thinkingConfig?: { thinkingBudget: number };
  seed?: number;
}
```

## 模型 ID 速查

### Gemini 2.5 系列（主力）

| Model | 上下文 | 输出 | 多模态 | 思考 | 价格输入 | 价格输出 |
| --- | --- | --- | --- | --- | --- | --- |
| `gemini-2.5-pro` | 2M | 8K | 全 | ✓ | $1.25/M / $2.50（>200K） | $5/M / $10（>200K） |
| `gemini-2.5-flash` | 1M | 8K | 全 | ✓ | $0.30/M | $1.20/M |
| `gemini-2.5-flash-lite` | 1M | 8K | 全 | - | $0.075/M | $0.30/M |
| `gemini-2.5-flash-image` | 1M | 8K | 全 + 图生 | - | $0.30/M | $1.20/M（图 $0.39/张） |
| `gemini-live-2.5-flash-preview` | 32K | - | 全实时 | - | 文 $0.30 + 音 $5 / $10 | - |

### 旧版（建议迁）

| Model | 状态 |
| --- | --- |
| `gemini-1.5-pro` / `gemini-1.5-flash` | 可用 |
| `gemini-1.5-pro-001` / `-002` | 可用 |
| `gemini-1.0-pro` | 已 retired（部分） |
| `gemini-pro-vision` | 已 retired |

### 嵌入模型

| Model | 维度 | 价格 |
| --- | --- | --- |
| `text-embedding-004` | 768 | 免费配额内 |
| `text-multilingual-embedding-002` | 768 | 同上 |

## 关键接口能力（Gemini 独有 / 特色）

### 1. 超长上下文（业界第一）

| Model | 上下文 |
| --- | --- |
| Gemini 2.5 Pro | **2M** |
| Gemini 2.5 Flash | **1M** |

**对比**：

- Claude Opus[1m]: 1M（与 Flash 相当）
- GPT-5: 256K
- 实际可塞：整本仓库（500K+）+ 完整文档（200K）+ 对话历史

### 2. 原生视频

```python
video_file = client.files.upload(file="meeting.mp4")
response = client.models.generate_content(
    model="gemini-2.5-pro",
    contents=[video_file, "总结视频内容"],
)
```

- 单视频最长 **1 小时**（Pro）/ **15 分钟**（Flash）
- 自动抽帧（1 fps）+ 音轨理解
- 输出含时间戳

**Claude / GPT 都不支持原生视频**——Claude 完全无视频 API，GPT 需手动抽帧。

### 3. 原生音频

```python
audio_file = client.files.upload(file="speech.mp3")
response = client.models.generate_content(
    contents=[audio_file, "转录并分析情绪"],
)
```

- 单音频 **< 9.5 小时**
- 转录 + 情感 + 关键词 一次完成

**对比**：

- Claude：无音频 API
- GPT：需先 Whisper 转录，再 GPT 分析（两步）
- Gemini：**一步**

### 4. Implicit Cache（自动 75% 折扣）

```python
# 第一次请求
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[LONG_CONTEXT, "问题 1"],
)
# 5 分钟内第二次（前缀相同）
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[LONG_CONTEXT, "问题 2"],
)

# 命中 cache_tokens
print(response.usage_metadata.cached_content_token_count)
```

**条件**：前缀总 ≥ 32K（Flash）/ 4K（Pro），5 分钟内重复。

**价格**：cached 部分 **75% 折扣**。

**对比**：

- Claude：手动 `cache_control`，90% 折扣 + 25% 写入
- GPT：自动，50% 折扣，无写入
- Gemini：自动，**75% 折扣**，无写入（最划算）

### 5. Explicit Cache（手动 1h+）

```python
cache = client.caches.create(
    model="gemini-2.5-flash",
    config={
        "contents": [{"role": "user", "parts": [{"text": LONG_DOC}]}],
        "system_instruction": "你是文档助手",
        "ttl": "3600s",
    },
)

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="问题",
    config={"cached_content": cache.name},
)
```

**TTL**：默认 1 小时，最长 days（用户配）。

**价格**：
- 创建：standard
- 读：75% 折扣
- 存储：每小时 $1/M（Pro）/ $0.1875/M（Flash）

### 6. Grounding

```python
# Google Search
config={"tools": [{"google_search": {}}]}

# URL Context
config={"tools": [{"url_context": {}}]}

# Google Maps
config={"tools": [{"google_maps": {}}]}
```

**对比**：

- Claude：无 grounding，需自接 MCP
- GPT：`web_search` 内置（不含 Maps / 自动 URL fetch）
- Gemini：3 个 Google 工具内置（独家 Maps）

### 7. Code Execution

```python
config={"tools": [{"code_execution": {}}]}
```

后台 Python sandbox。**Claude 无**，GPT 用 `code_interpreter`。

### 8. Live API（含视频帧）

```python
async with client.aio.live.connect(
    model="gemini-live-2.5-flash-preview",
    config={
        "response_modalities": ["AUDIO"],
        "speech_config": {"voice_config": {"prebuilt_voice_config": {"voice_name": "Aoede"}}},
    },
) as session:
    # 发视频帧
    await session.send_realtime_input(media=video_chunk)
    # 接音频
    async for chunk in session.receive():
        play(chunk.data)
```

**voices**：`Puck` / `Charon` / `Kore` / `Fenrir` / `Aoede`（5 种内置）

**对比 GPT Realtime**：

- Gemini Live：**含视频帧输入** / 5 种 voice / TEXT 或 AUDIO 单选
- GPT Realtime：仅文 + 音 / 多种 voice / TEXT + AUDIO 同时输出

### 9. Thinking（推理模式）

```python
config={"thinking_config": {"thinking_budget": 8192}}
```

`thinking_budget` 范围：

- `0`：禁用思考
- `-1`：无上限（让模型自己决定）
- 具体数字：上限

response 含 `part.thought` block（可设 `include_thoughts: True` 暴露）。

### 10. Structured Output（responseSchema）

```python
from pydantic import BaseModel

class Result(BaseModel):
    name: str
    age: int

config={
    "response_mime_type": "application/json",
    "response_schema": Result,
}

result: Result = response.parsed
```

或 JSON Schema：

```python
config={
    "response_mime_type": "application/json",
    "response_schema": {
        "type": "object",
        "properties": {...},
        "required": [...],
    },
}
```

**对比**：

- GPT: `response_format: { json_schema: { strict: true } }` —— `strict` 字段控制
- Claude: 通过 Tool Use 模拟
- Gemini: `responseSchema` —— 默认严格

## Rate Limits

按 Tier + Model 组合：

| Tier | 月消费 | gemini-2.5-flash RPM | TPM |
| --- | --- | --- | --- |
| Free | $0 | 50 | 200K |
| 1 | $250+ | 1000 | 1M |
| 2 | $1K+ | 5000 | 5M |
| 3 | $5K+ | 10K | 10M |

按 region + project 限速。

## 价格速查（2026）

| Model | Input $/M | Output $/M | Cache $/M | Storage $/M/h |
| --- | --- | --- | --- | --- |
| Gemini 2.5 Pro (≤200K) | $1.25 | $5 | $0.31 | $1 |
| Gemini 2.5 Pro (>200K) | $2.50 | $10 | $0.625 | $1 |
| Gemini 2.5 Flash | $0.30 | $1.20 | $0.075 | $0.1875 |
| Gemini 2.5 Flash-Lite | $0.075 | $0.30 | $0.019 | - |

Free tier 配额（每分钟 / 每天）：

| Model | RPM | RPD | TPM |
| --- | --- | --- | --- |
| 2.5 Pro | 5 | 25 | 250K |
| 2.5 Flash | 10 | 250 | 250K |
| 2.5 Flash-Lite | 30 | 1500 | 1M |

## SDK 列表

| 语言 | 包 | 维护 |
| --- | --- | --- |
| Python | `google-genai` | 官方 |
| TypeScript / JS | `@google/genai` | 官方 |
| Go | `google.golang.org/genai` | 官方 |
| Java | `com.google.genai` | 官方 |
| Kotlin | 通过 Java SDK | - |
| Dart / Flutter | `google_generative_ai` (旧 SDK) | 官方（迁中） |
| Swift | 社区 | - |

::: warning 旧 SDK 已弃用

`google-generativeai` / `@google/generative-ai` 已 deprecated（2025 末）。新项目用 `google-genai` / `@google/genai`。

:::

## Vertex AI 差异

| 维度 | Gemini API (AI Studio) | Vertex AI |
| --- | --- | --- |
| 鉴权 | API key | GCP ADC / SA |
| Endpoint | `generativelanguage.googleapis.com` | `<region>-aiplatform.googleapis.com` |
| SLA | 无 | Enterprise |
| Region | 自动 | 按 region |
| Batches | -    | ✓ |
| 私有 endpoint | -    | ✓ |
| 模型微调 | -    | ✓ |
| Implicit Cache | ✓ | ✓ |
| 价格 | 标准 | 同标准 |

```python
# AI Studio
client = genai.Client(api_key="AIzaSy...")

# Vertex
client = genai.Client(
    vertexai=True,
    project="my-gcp",
    location="us-central1",
)
```

## Safety Categories & Thresholds

| Category | 含义 |
| --- | --- |
| `HARM_CATEGORY_HARASSMENT` | 骚扰 |
| `HARM_CATEGORY_HATE_SPEECH` | 仇恨言论 |
| `HARM_CATEGORY_SEXUALLY_EXPLICIT` | 性内容 |
| `HARM_CATEGORY_DANGEROUS_CONTENT` | 危险（武器 / 自残 / 毒品） |
| `HARM_CATEGORY_CIVIC_INTEGRITY` | 政治诚信 |

Thresholds：

| 值 | 行为 |
| --- | --- |
| `BLOCK_NONE` | 不 block |
| `BLOCK_ONLY_HIGH` | 仅 high probability 时 block |
| `BLOCK_MEDIUM_AND_ABOVE` | 默认 |
| `BLOCK_LOW_AND_ABOVE` | 最严 |
| `OFF` | 完全关（部分 model 不允许） |

## 错误码

| HTTP | google.rpc.Code | 含义 |
| --- | --- | --- |
| 400 | INVALID_ARGUMENT | 参数错 |
| 401 | UNAUTHENTICATED | API key 错 |
| 403 | PERMISSION_DENIED | model 无权限 / quota 超 |
| 404 | NOT_FOUND | 资源不存在 |
| 429 | RESOURCE_EXHAUSTED | 超 RPM / TPM |
| 500 | INTERNAL | Google 内部错 |
| 503 | UNAVAILABLE | 过载（重试） |

## 内置 voices（Live API）

| Voice | 描述 |
| --- | --- |
| `Aoede` | 平和女声 |
| `Charon` | 沉稳男声 |
| `Fenrir` | 活力男声 |
| `Kore` | 活泼女声 |
| `Puck` | 顽皮中性 |

## 与 Claude / GPT 接口对比表

| 能力 | Gemini | Claude | GPT |
| --- | --- | --- | --- |
| 上下文窗口 | **2M (Pro) / 1M (Flash)** | 200K / 1M | 128K-256K |
| 原生视频 | **✓ mp4 直传** | ✗ | -（需抽帧） |
| 原生音频 | **✓ 一步分析** | ✗ | -（两步：Whisper + GPT） |
| 内置 Web Search | ✓ google_search | -（需 MCP） | ✓ web_search |
| 内置 Maps | ✓ google_maps | ✗ | ✗ |
| Code Execution | ✓ code_execution | -（需 MCP） | ✓ code_interpreter |
| Image Generation | ✓ Imagen / 2.5-image | ✗ | ✓ DALL-E / GPT-Image |
| Implicit Cache | **✓ 自动 75% 折扣** | -（需 cache_control） | ✓ 50% |
| Explicit Cache 1h+ | ✓ | -（仅 5min ephemeral） | -（仅 5-15min） |
| Live API（含视频帧） | ✓ | ✗ | ✓（仅文+音） |
| 推理模式 | ✓ thinking_config | ✓ thinking | ✓ o-series |
| Structured Output | ✓ responseSchema | -（Tool Use） | ✓ strict |
| Function Calling | ✓（嵌套 declarations） | ✓ | ✓ |
| MCP | -（社区） | **✓ 一类** | -（社区） |
| 价格（Flash 输入） | $0.30/M | $3/M (Sonnet) | $0.50/M (mini) |
| 价格（旗舰输入） | $1.25/M | $15/M (Opus) | $5/M (GPT-5) |

::: tip 选型口诀

- **超长文档 / 视频 / 音频** → Gemini
- **编码 / Agent / MCP 生态** → Claude
- **多模态全栈 / 实时 / 内置工具** → GPT

:::

## 资源链接

- 主文档：[ai.google.dev](https://ai.google.dev/)
- API Reference：[ai.google.dev/api](https://ai.google.dev/api)
- Cookbook：[github.com/google-gemini/cookbook](https://github.com/google-gemini/cookbook)
- 价格：[ai.google.dev/pricing](https://ai.google.dev/pricing)
- Vertex AI：[cloud.google.com/vertex-ai/docs](https://cloud.google.com/vertex-ai/docs)
- Status：[status.cloud.google.com](https://status.cloud.google.com/)
- AI Studio Playground：[aistudio.google.com](https://aistudio.google.com/)
- 新 SDK：[github.com/googleapis/python-genai](https://github.com/googleapis/python-genai)
