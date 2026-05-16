---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 OpenAI API 2026 + GPT-5 系列编写。**重点接口与能力**。

## 速查

- 两套 API：`chat.completions`（旧） / `responses`（新，Agent）
- 模型 ID：`gpt-5` / `gpt-5-mini` / `gpt-5-nano` / `o3` / `o4-mini` / `gpt-4o`
- 多模态：图（image_url）/ 音（Whisper + TTS endpoint）/ 视频帧
- Realtime API：双向语音对话 (`/v1/realtime` WebSocket)
- 内置工具：`web_search` / `code_interpreter` / `image_generation` / `file_search`
- 结构化输出：`response_format: { type: "json_schema", json_schema: { strict: true } }`
- Prompt Cache：自动（5-15 分钟 TTL，无需手动 cache_control）
- Batches：50% 折扣（24 小时内）
- o-series 推理：`reasoning_effort: "low/medium/high"`

## chat.completions vs responses 详解

### chat.completions（旧 API）

```python
client.chat.completions.create(
    model="gpt-5",
    messages=[
        {"role": "system", "content": "..."},
        {"role": "user", "content": "..."},
        {"role": "assistant", "content": "..."},
        {"role": "tool", "tool_call_id": "x", "content": "..."},
    ],
    max_completion_tokens=1024,
    temperature=0.7,
    top_p=1.0,
    n=1,
    stream=False,
    stop=None,
    presence_penalty=0,
    frequency_penalty=0,
    logprobs=False,
    logit_bias={},
    tools=[],
    tool_choice="auto",
    response_format={"type": "text"},   # or json_object / json_schema
    seed=None,                          # 确定性输出
)
```

适合：

- 简单对话
- 已有 OpenAI 集成的项目
- 不需要内置工具的场景

### responses（新 API）

```python
client.responses.create(
    model="gpt-5",
    instructions="...",        # 替代 system message
    input="...",               # 替代 messages 数组（简单场景）
    # 或 input=[{"role": "user", "content": "..."}]
    previous_response_id=None,  # 接续上次 response（替代 messages 历史）
    tools=[
        {"type": "web_search"},
        {"type": "code_interpreter", "container": {"type": "auto"}},
        {"type": "image_generation"},
        {"type": "file_search", "vector_store_ids": ["vs_xxx"]},
        # 或自定义 function
        {"type": "function", "name": "...", "parameters": {...}},
    ],
    reasoning={"effort": "high"},
    store=True,               # 是否保存在 OpenAI 服务器
)
```

适合：

- Agent 场景
- 内置工具
- 多步任务（用 `previous_response_id` 接续）

::: tip 接续场景

`responses` 的 `previous_response_id` 让多轮无需传整段历史——OpenAI 服务器保留 30 天，省 token 费用。

:::

## 内置工具深入

### web_search

```python
response = client.responses.create(
    model="gpt-5",
    input="2026 年 NBA 总冠军是谁？",
    tools=[{
        "type": "web_search",
        "user_location": {"country": "US"},   # 可选地区偏好
        "search_context_size": "medium",       # low / medium / high
    }],
)

# 引用源
for citation in response.output_text_citations:
    print(citation.url, citation.title)
```

**对比**：

- Claude：无内置 web search，需 MCP（Brave Search MCP / Tavily MCP）
- Gemini：`grounding: { google_search: {} }` 一类

### code_interpreter

```python
response = client.responses.create(
    model="gpt-5",
    input="计算 ln(2) 的连分数展开前 10 项",
    tools=[{"type": "code_interpreter", "container": {"type": "auto"}}],
)

# 模型自动写 Python + 执行 + 看结果迭代
# 输出含 code blocks + 执行结果
```

**对比**：

- Claude：无内置 code interpreter，需自己接 sandbox MCP
- Gemini：`code_execution` 一类支持

### image_generation

```python
response = client.responses.create(
    model="gpt-5",
    input="画一张未来感的赛博朋克街景",
    tools=[{
        "type": "image_generation",
        "size": "1024x1024",
        "quality": "high",
        "n": 1,
    }],
)

for output in response.output:
    if output.type == "image_generation_call":
        print(output.image_url)
```

底层调 GPT-Image-1 / DALL-E 3。**Claude 完全不生图**；**Gemini** 用 Imagen 模型独立 API。

### file_search（内置 RAG）

```python
# 1. 创建 vector store
vs = client.vector_stores.create(name="my-docs")

# 2. 上传文件
client.vector_stores.files.upload(
    vector_store_id=vs.id,
    file=open("manual.pdf", "rb"),
)

# 3. 调用
response = client.responses.create(
    model="gpt-5",
    input="产品的退款政策是什么？",
    tools=[{
        "type": "file_search",
        "vector_store_ids": [vs.id],
    }],
)
```

**对比**：

- Claude：无内置 RAG，需自己接 vector DB（Pinecone / Weaviate / 自家 MCP）
- Gemini：内置 Semantic Retrieval API

### Custom Function

```python
response = client.responses.create(
    model="gpt-5",
    input="上海现在多少度？",
    tools=[
        {
            "type": "function",
            "name": "get_weather",
            "parameters": {
                "type": "object",
                "properties": {"city": {"type": "string"}},
                "required": ["city"],
            },
        }
    ],
)

for tool_call in response.output:
    if tool_call.type == "function_call":
        result = my_get_weather(tool_call.arguments["city"])
        # 提交 tool 结果继续
        followup = client.responses.create(
            previous_response_id=response.id,
            input=[{"type": "function_call_output", "call_id": tool_call.call_id, "output": result}],
        )
```

## Structured Outputs（结构化输出）

```python
from pydantic import BaseModel
from typing import Literal

class Sentiment(BaseModel):
    polarity: Literal["positive", "negative", "neutral"]
    confidence: float
    reasons: list[str]

response = client.chat.completions.parse(
    model="gpt-5",
    messages=[{"role": "user", "content": "评论：这家餐厅烧的特别好吃。"}],
    response_format=Sentiment,
)

sentiment: Sentiment = response.choices[0].message.parsed
```

**保证**：

- 字段类型严格
- enum 严格匹配
- required 一定有
- nested object 全递归校验

**限制**：

- 不支持 `not`、`anyOf`（部分）
- 递归深度 5 层
- 总 properties ≤ 100

## o-series 推理深入

```python
response = client.chat.completions.create(
    model="o3",
    messages=[{"role": "user", "content": "证明 4 色定理"}],
    reasoning_effort="high",
    max_completion_tokens=8192,
)

# 推理 tokens（不可见）
print(f"reasoning_tokens: {response.usage.completion_tokens_details.reasoning_tokens}")
print(f"output_tokens: {response.usage.completion_tokens}")
```

**何时用 o-series**：

| 场景 | 选 |
| --- | --- |
| 数学证明 | o3 high |
| 物理 / 化学 / 生物推理 | o3 medium-high |
| 复杂业务规则推理 | o3 medium |
| 代码生成 | GPT-5（o-series 慢 + 贵） |
| 简单 QA | GPT-5-mini / nano |

**与 Claude Extended Thinking 对比**：

- Claude：`thinking: {enabled, budget_tokens}` 配置预算
- GPT o-series：`reasoning_effort` 间接控制（low/medium/high）
- Gemini 2.5：`thinkingConfig: {thinkingBudget}` 类 Claude

## Prompt Caching

**自动启用**（不需 cache_control）：

```python
# 第二次相同 system + 前缀消息时自动命中
response = client.chat.completions.create(
    model="gpt-5",
    messages=[
        {"role": "system", "content": LONG_SYSTEM_PROMPT},   # > 1024 tokens
        {"role": "user", "content": "..."},
    ],
)

print(response.usage.prompt_tokens)
print(response.usage.prompt_tokens_details.cached_tokens)   # 命中数
```

**TTL**：5-15 分钟动态（不像 Claude 严格 5 分钟）。

**价格**：cached_tokens 按 50% 折扣（不像 Claude 90% 折扣 + 写入成本）。

::: tip Claude vs GPT cache

- Claude：手动 `cache_control`，5min TTL，90% 折扣 + 25% 写入成本
- GPT：自动，5-15min TTL，50% 折扣，无写入成本
- 长会话场景 Claude 更划算，短重复 GPT 更省事

:::

## Batches API

```python
# 1. 创建 batch file（JSONL 格式）
import json
with open("batch.jsonl", "w") as f:
    for i in range(10000):
        f.write(json.dumps({
            "custom_id": f"task-{i}",
            "method": "POST",
            "url": "/v1/chat/completions",
            "body": {
                "model": "gpt-5-mini",
                "messages": [{"role": "user", "content": f"翻译 {i}"}],
                "max_completion_tokens": 256,
            },
        }) + "\n")

# 2. 上传
batch_file = client.files.create(
    file=open("batch.jsonl", "rb"),
    purpose="batch",
)

# 3. 创建 batch
batch = client.batches.create(
    input_file_id=batch_file.id,
    endpoint="/v1/chat/completions",
    completion_window="24h",
)

# 4. 轮询
import time
while batch.status not in ("completed", "failed"):
    time.sleep(60)
    batch = client.batches.retrieve(batch.id)

# 5. 下载结果
content = client.files.content(batch.output_file_id)
```

价格：**50%** 标准价。24 小时内完成（实际通常 1-2 小时）。

## Function Calling（Tool Use）

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get current weather",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string"},
                    "unit": {"type": "string", "enum": ["c", "f"]},
                },
                "required": ["city"],
            },
            "strict": True,    # GPT-5+ 强 schema 模式
        },
    }
]

response = client.chat.completions.create(
    model="gpt-5",
    messages=[{"role": "user", "content": "上海今天什么温度？"}],
    tools=tools,
    tool_choice="auto",   # auto / none / required / {"type": "function", "function": {"name": "xxx"}}
    parallel_tool_calls=True,   # 默认 True
)

for tool_call in response.choices[0].message.tool_calls:
    result = my_func(tool_call.function.arguments)
    # 把结果作为 tool message 发回
```

**`strict: True`**（GPT-5 起）：

- schema 严格校验
- 不会乱传 / 漏传字段
- 与 `response_format.json_schema.strict` 相同效果

**对比 Claude tools**：

- Claude：`input_schema` 直接放 object（无 `parameters` 包裹）
- Claude：`tool_choice` 用 `{type: "any"}` 替代 `required`
- Claude：默认并行 tool use

## Realtime API（语音 Agent）

```python
import asyncio
from openai import AsyncOpenAI

async def voice_agent():
    client = AsyncOpenAI()

    async with client.beta.realtime.connect(
        model="gpt-4o-realtime-preview"
    ) as conn:
        await conn.session.update(session={
            "modalities": ["text", "audio"],
            "voice": "alloy",
            "instructions": "你是一个友好的客服助手",
            "input_audio_format": "pcm16",
            "output_audio_format": "pcm16",
            "input_audio_transcription": {"model": "whisper-1"},
            "turn_detection": {
                "type": "server_vad",
                "threshold": 0.5,
                "silence_duration_ms": 200,
            },
            "tools": [...],     # 可调函数
        })

        # 麦克风音频流写入
        await conn.input_audio_buffer.append(audio_data=chunk)

        # 接事件
        async for event in conn:
            if event.type == "response.audio.delta":
                play_audio(event.delta)
            elif event.type == "response.audio_transcript.delta":
                print(event.delta, end="")
            elif event.type == "response.function_call_arguments.done":
                # 调函数
                result = call_func(event.name, event.arguments)
                await conn.conversation.item.create(item={
                    "type": "function_call_output",
                    "call_id": event.call_id,
                    "output": result,
                })

asyncio.run(voice_agent())
```

**核心优势**：

- 首响应 < 500ms
- 边说边听（不需先停说话）
- VAD（语音活动检测）自动断句
- 模型可在语音中调函数（如「帮我查订单」→ 调 lookup API → 继续说）

**Claude 完全没有这个能力**。Gemini 有 Live API 类似（差异详见 Gemini 笔记）。

## 多模态：视频帧

GPT-4o 支持把视频拆成关键帧分析：

```python
import cv2
import base64

# 1. 视频抽帧
cap = cv2.VideoCapture("video.mp4")
frames = []
while cap.isOpened():
    ret, frame = cap.read()
    if not ret: break
    _, buffer = cv2.imencode(".jpg", frame)
    frames.append(base64.b64encode(buffer).decode())
    # 每 30 帧抽 1
    cap.set(cv2.CAP_PROP_POS_FRAMES, cap.get(cv2.CAP_PROP_POS_FRAMES) + 29)

# 2. 把帧作为多张图发
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "总结这段视频内容"},
            *[
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{f}"}}
                for f in frames[:10]
            ],
        ],
    }],
)
```

**Gemini 对比**：原生 video API（不用抽帧），直接传视频文件。

## Assistants API（旧，建议迁 responses）

OpenAI 2023 推的 Assistants API（含 thread / run / file_search）将在 2026 后弃用——迁到 `responses` + `previous_response_id`。本笔记不展开。

## Error Handling

```python
from openai import OpenAI, RateLimitError, APIStatusError

try:
    response = client.chat.completions.create(...)
except RateLimitError as e:
    time.sleep(60)
    response = client.chat.completions.create(...)
except APIStatusError as e:
    if e.status_code == 503:
        # 服务暂时不可用
        response = fallback_to_azure(...)
    elif e.status_code == 400 and "context_length" in e.body.get("error", {}).get("message", ""):
        # 上下文超
        response = client.chat.completions.create(...先 truncate...)
    else:
        raise
```

## 大陆访问最佳实践

| 方案 | 优势 | 劣势 |
| --- | --- | --- |
| **Azure OpenAI（香港 / 新加坡）** | 企业级 SLA / 合规 | 模型滞后 1-2 月 / Azure 部署门槛 |
| OpenRouter / 代理服务 | 一键 | 加 10-30% 中间费 |
| 自部署 Edge 函数转发 | 灵活 / 隐私 | 维护成本 |
| 国内同款（DeepSeek / Qwen） | 直连快 | 能力差异 |

详见 [OpenRouter 笔记](../../tools/other/open-router/)。

## 故障排查

| 现象 | 排查 |
| --- | --- |
| `401 unauthorized` | API key 错 / 过期 |
| `429 rate_limit` | 超 RPM / TPM，看 `x-ratelimit-*` header |
| `400 context_length_exceeded` | 上下文超 → 切大窗口 model |
| `400 invalid_request_error` | 参数错（model 不存在 / parameter format） |
| 流式断开 | SSE 超时（一般 10min），缩短任务 |
| 大陆延迟高 | 用 Azure / 代理 |
| Function 不调 | `tool_choice` 设 `required` 强制 |
| JSON Schema 不严格 | `strict: True` 必须开 |

## 版本里程碑

| 模型 | 时间 | 主要变化 |
| --- | --- | --- |
| GPT-3.5 | 2022 | ChatGPT 引爆 LLM 浪潮 |
| GPT-4 | 2023 | 多模态首发 + Plugin |
| GPT-4-Turbo | 2023 末 | 128K 上下文 / Assistants API |
| GPT-4o | 2024 中 | 全模态（图 / 音 / 视频）/ Realtime API |
| o1 / o3 | 2024-2025 | 推理模型（CoT 训练） |
| GPT-5 | 2025 | 旗舰 + responses API + 内置工具 |
| GPT-5-mini / nano | 2025 末 | 低成本档 |
| o4-mini | 2026 | 推理 + 低成本 |
