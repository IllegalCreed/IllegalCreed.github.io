---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Gemini 2.5 + `@google/genai` 新 SDK 编写。**重点接口与能力**。

## 速查

- 新 SDK：`google-genai`（Python）/ `@google/genai`（Node）——旧 `google-generativeai` 已废弃
- 模型 ID：`gemini-2.5-pro` / `gemini-2.5-flash` / `gemini-2.5-flash-lite` / `gemini-2.5-flash-image`
- 上下文：Pro 2M / Flash 1M（业界最大）
- 多模态：image / video / audio / pdf **原生**（无需预处理）
- Function Calling：`tools: [{function_declarations: [...]}]`
- Grounding：`tools: [{google_search: {}}]` / `{url_context: {}}` / `{google_maps: {}}`
- Code Execution：`tools: [{code_execution: {}}]` 一类内置
- Implicit Cache：自动（5min）/ Explicit Cache：`caches.create(...)`（1h+ TTL）
- Live API：`client.aio.live.connect(...)`（双向实时）
- Thinking：`thinking_config: {thinking_budget: 8192}` （2.5 Pro 起）

## 接口对比一览

| API | Gemini | Claude | GPT |
| --- | --- | --- | --- |
| 端点 | `generateContent` / `streamGenerateContent` | `messages` | `chat.completions` / `responses` |
| 历史结构 | `contents` 数组（role + parts） | `messages` 数组（role + content） | `messages` 数组（role + content） |
| 系统提示 | `system_instruction` 字段 | 顶层 `system` 字段 | `messages: [{role: "system"}]` 或 `instructions` |
| 文本块 | `parts: [{text: "..."}]` | `content: [{type: "text", text: "..."}]` | `content: [{type: "text", text: "..."}]` |
| 图像块 | `parts: [{inline_data: {mime_type, data}}]` | `content: [{type: "image", source: {...}}]` | `content: [{type: "image_url", image_url: {url}}]` |
| 文件复用 | `parts: [{file_data: {file_uri, mime_type}}]` | `content: [{type: "document", source: {type: "file", file_id}}]` | `messages: [{type: "image_url", image_url: {url}}]`（仅图） |

## generateContent 完整字段

```ts
interface GenerateContentParams {
  model: string;
  contents: Content | Content[];
  config?: {
    system_instruction?: string | Content;
    temperature?: number;
    top_p?: number;
    top_k?: number;
    candidate_count?: number;
    max_output_tokens?: number;
    stop_sequences?: string[];
    response_mime_type?: "text/plain" | "application/json";
    response_schema?: JSONSchema | PydanticModel;
    seed?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    response_logprobs?: boolean;
    logprobs?: number;
    safety_settings?: SafetySetting[];
    tools?: Tool[];
    tool_config?: ToolConfig;
    thinking_config?: { thinking_budget: number };  // 2.5 Pro 起
    cached_content?: string;                          // Explicit cache 引用
  };
}
```

## Implicit Cache（自动）

默认开启——**无需 cache_control**。模型自动检测请求前缀是否与最近请求相同，命中则缓存。

```python
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[
        {"role": "user", "parts": [{"text": LONG_CONTEXT}]},   # > 32K
        {"role": "user", "parts": [{"text": "今天的问题"}]},
    ],
)

print(response.usage_metadata.cached_content_token_count)   # 命中数
```

**条件**：

- 请求前缀（system + 早期 messages）总 ≥ 32K（Flash）或 4K（Pro）
- 5 分钟内重复

**价格**：cached_content_token_count 按 25% 价（**75% 折扣**，业界最高）。

## Explicit Cache（手动 1h+）

需要更长 TTL（如 RAG 应用每天用同样上下文）：

```python
# 1. 创建 cache
cache = client.caches.create(
    model="gemini-2.5-flash",
    config={
        "contents": [
            {"role": "user", "parts": [{"text": LONG_DOC}]},
        ],
        "system_instruction": "你是文档助手...",
        "ttl": "3600s",   # 1 小时（可更长）
    },
)

# 2. 调用时引用
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="文档里关于退款的部分？",
    config={"cached_content": cache.name},
)
```

**TTL**：默认 1h，可设最长 days。

**价格**：
- 创建：standard 价
- 调用时引用的 token：**75% 折扣**
- TTL 期间存储费：每小时 $1/M tokens（Pro）/ $0.1875/M（Flash）

## Function Calling

```python
# 定义函数
weather_function = {
    "name": "get_weather",
    "description": "Get current weather for a city",
    "parameters": {
        "type": "object",
        "properties": {
            "city": {"type": "string"},
            "unit": {"type": "string", "enum": ["c", "f"]},
        },
        "required": ["city"],
    },
}

response = client.models.generate_content(
    model="gemini-2.5-pro",
    contents="上海现在多少度？",
    config={
        "tools": [{"function_declarations": [weather_function]}],
        "tool_config": {
            "function_calling_config": {
                "mode": "AUTO",   # AUTO / ANY / NONE
                "allowed_function_names": ["get_weather"],   # 可选
            },
        },
    },
)

# 处理 function calls
for part in response.candidates[0].content.parts:
    if part.function_call:
        result = my_get_weather(**part.function_call.args)
        # 把结果继续发回
```

**对比**：

- GPT: `tools: [{type: "function", function: {...}}]`
- Claude: `tools: [{name, input_schema}]`（无包装层）
- Gemini: `tools: [{function_declarations: [{name, parameters: {...}}]}]`（多层嵌套）

## 内置工具

### `google_search`（Grounding）

```python
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="2026 NBA 总冠军是？",
    config={"tools": [{"google_search": {}}]},
)

# 引用源
metadata = response.candidates[0].grounding_metadata
for chunk in metadata.grounding_chunks:
    print(chunk.web.uri, chunk.web.title)
for support in metadata.grounding_supports:
    print(f"段落 {support.segment.text} 引用 {support.grounding_chunk_indices}")
```

### `url_context`

```python
config={
    "tools": [{"url_context": {}}],
}

contents = "总结这篇文章：https://example.com/article"
# Gemini 自动 fetch URL 内容
```

### `google_maps`

```python
config={
    "tools": [{"google_maps": {}}],
}

contents = "上海陆家嘴附近的咖啡馆推荐"
# Gemini 调 Google Maps API
```

### `code_execution`

```python
response = client.models.generate_content(
    model="gemini-2.5-pro",
    contents="计算 ln(2) 的连分数前 10 项",
    config={"tools": [{"code_execution": {}}]},
)

# 输出含 code + 执行结果
for part in response.candidates[0].content.parts:
    if part.executable_code:
        print(f"[Code]\n{part.executable_code.code}")
    elif part.code_execution_result:
        print(f"[Output]\n{part.code_execution_result.output}")
```

**Claude 对比**：完全无内置工具，需要 MCP。

**GPT 对比**：`web_search` / `code_interpreter` / `image_generation` / `file_search` 4 个内置；Gemini 4 个不一样的（google_search / url_context / google_maps / code_execution）。

## Thinking（推理模式）

```python
response = client.models.generate_content(
    model="gemini-2.5-pro",   # Flash 也支持
    contents="证明：对任意正整数 n，n^2 - n 是偶数",
    config={
        "thinking_config": {
            "thinking_budget": 8192,   # 思考 tokens 预算
        },
    },
)

# 思考内容（通常不可见）
for part in response.candidates[0].content.parts:
    if part.thought:
        print(f"[Thinking]\n{part.thought}")
    elif part.text:
        print(f"[Answer]\n{part.text}")

print(f"思考 tokens: {response.usage_metadata.thoughts_token_count}")
```

**对比**：

- Claude: `thinking: {type: "enabled", budget_tokens: N}`，response 含 `type: "thinking"` block
- GPT o-series: `reasoning_effort: "high"`（间接控制 budget），response 不暴露 thinking
- Gemini: `thinking_config: {thinking_budget: N}`，response 含 `part.thought`

## Files API

```python
# 上传
my_file = client.files.upload(
    file="paper.pdf",
    config={"mime_type": "application/pdf"},
)

# 等处理完（视频 / 大 PDF 需要时间）
while my_file.state.name == "PROCESSING":
    time.sleep(5)
    my_file = client.files.get(name=my_file.name)

# 用
response = client.models.generate_content(
    model="gemini-2.5-pro",
    contents=[my_file, "总结这份文档"],
)
```

**支持格式**：

| 类型 | mime types | 大小上限 |
| --- | --- | --- |
| 图 | png / jpeg / gif / webp / heic / heif | 7 MB（inline）/ 50 MB（File） |
| 视频 | mp4 / mpeg / mov / avi / wmv / flv / webm / 3gpp / 3gpp2 | 2 GB / 1 小时 |
| 音频 | mp3 / wav / aiff / aac / ogg / flac | 9.5 小时 |
| PDF | application/pdf | 50 MB / 1000 页 |
| 文本 | plain / html / json / md / css / xml / rtf / csv | 100 MB |

**保留**：48 小时（免费）/ Vertex 可配置更长。

## Live API 完整

```python
import asyncio
from google import genai
from google.genai import types

async def live_session():
    client = genai.Client()

    config = types.LiveConnectConfig(
        response_modalities=["AUDIO"],
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                    voice_name="Aoede"   # Puck / Charon / Kore / Fenrir / Aoede
                )
            )
        ),
        system_instruction="你是友好的客服助手",
        tools=[{"function_declarations": [...]}],
    )

    async with client.aio.live.connect(
        model="gemini-live-2.5-flash-preview",
        config=config,
    ) as session:
        # 文 / 音 / 视频帧 都可发
        await session.send_client_content(
            turns={"role": "user", "parts": [{"text": "你好"}]},
        )

        # 实时接
        async for chunk in session.receive():
            if chunk.data:   # 音频块
                play_audio(chunk.data)
            elif chunk.text:
                print(chunk.text, end="")

asyncio.run(live_session())
```

**支持模态**：

- `TEXT` / `AUDIO` 单选
- 输入：文本 / 音频流 / 视频帧
- 输出：文本 / 音频流（不能同时两者）

**对比 GPT Realtime**：

- Gemini Live：含视频帧输入 / 5 种 voice 选择 / TEXT 或 AUDIO 单选
- GPT Realtime：含 TEXT + AUDIO 同时输出 / 多种 voice / 不支持视频帧

## Safety Settings

```python
config={
    "safety_settings": [
        {
            "category": "HARM_CATEGORY_HARASSMENT",
            "threshold": "BLOCK_NONE",   # BLOCK_NONE / BLOCK_LOW_AND_ABOVE / BLOCK_MEDIUM_AND_ABOVE / BLOCK_ONLY_HIGH
        },
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    ],
}
```

**默认 `BLOCK_MEDIUM_AND_ABOVE`**——Gemini 内容审核比 GPT / Claude **更严**。某些技术内容（如说明黑客技巧的中性教学）会被 SAFETY block。需要时调低阈值。

::: warning Block 处理

```python
if response.candidates[0].finish_reason == types.FinishReason.SAFETY:
    print("被 SAFETY block")
    for rating in response.candidates[0].safety_ratings:
        print(rating)
```

:::

## Streaming

```python
for chunk in client.models.generate_content_stream(
    model="gemini-2.5-flash",
    contents="...",
):
    print(chunk.text, end="", flush=True)
```

或 async：

```python
async for chunk in client.aio.models.generate_content_stream(
    model="gemini-2.5-flash",
    contents="...",
):
    print(chunk.text, end="")
```

## Batches（Vertex AI）

```python
# 仅 Vertex 支持
from google.cloud import aiplatform

batch_job = aiplatform.BatchPredictionJob.create(
    model_name="gemini-2.5-flash",
    job_display_name="my-batch",
    gcs_source="gs://my-bucket/inputs.jsonl",
    gcs_destination_prefix="gs://my-bucket/outputs/",
)
```

价格：50% 标准价。

## Vertex AI 与 AI Studio 差异

| 维度 | AI Studio API | Vertex AI |
| --- | --- | --- |
| 鉴权 | API key | Google Cloud ADC（OAuth / service account） |
| Endpoint | `generativelanguage.googleapis.com` | `<region>-aiplatform.googleapis.com` |
| SLA | 无承诺 | Enterprise SLA |
| Region | 全球（自动路由） | 按 region |
| 价格 | 标准 | 同标准 |
| Batches | -    | ✓ |
| 私有 endpoint | -    | ✓ |
| IAM 集成 | -    | ✓ |
| 日志审计 | -    | ✓ |

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

API 调用代码**完全相同**——仅 client 初始化不同。

## 错误处理

```python
from google.genai import errors

try:
    response = client.models.generate_content(...)
except errors.APIError as e:
    if e.status_code == 429:
        time.sleep(60)
        response = client.models.generate_content(...)
    elif e.status_code == 400:
        # 参数错（model ID / safety / size）
        ...
```

## 大陆访问

不可直连。方案：

| 方案 | 难度 |
| --- | --- |
| 自备代理 | 低 |
| Vertex AI + 某些 region | 中 |
| OpenRouter | 低 |

## 故障排查

| 现象 | 排查 |
| --- | --- |
| `401 unauthorized` | API key 错 / 过期 |
| `429 quota_exceeded` | 超免费配额 / RPM |
| `400 invalid_argument` | 参数错（model ID / safety / mime type） |
| `503 unavailable` | Google 内部错（重试） |
| 输出 SAFETY block | 调低 safety_settings 阈值 |
| 视频/PDF 超时 | 用 Files API 上传等处理完 |
| Function 不调 | `tool_config.mode: "ANY"` 强制 |
| 大陆延迟高 | 用 Vertex / 代理 |
| 中文回复不自然 | system_instruction 显式「用流畅中文回答」 |

## 版本里程碑

| 模型 | 时间 | 主要变化 |
| --- | --- | --- |
| Gemini 1.0 | 2023 末 | 首发（Bard 改名） |
| Gemini 1.5 | 2024 中 | 1M 上下文（业界首） |
| Gemini 2.0 | 2024 末 | 全多模态 / Live API |
| Gemini 2.5 | 2025 | Thinking / Pro 2M / Implicit Cache |
| Gemini 2.5 Flash-Image | 2025 末 | Nano Banana（图像生成） |
| Gemini Live 2.5 | 2026 | 视频帧 + 多 voice |
