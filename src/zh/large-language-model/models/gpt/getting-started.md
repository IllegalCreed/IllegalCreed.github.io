---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 OpenAI API 2026 + GPT-5 系列编写。**本笔记重点接口与能力差异**。

## 接入方式

### 1. OpenAI API（开发者）

```bash
# 注册并获取 key：platform.openai.com
export OPENAI_API_KEY=sk-proj-xxxxx

# Python SDK
pip install openai

# Node.js SDK
npm install openai
```

### 2. ChatGPT 网页

[chat.openai.com](https://chat.openai.com/)——注册即用。

| 套餐 | 价格 | 能力 |
| --- | --- | --- |
| Free | $0 | GPT-5-mini，每天有限消息 |
| Plus | $20/月 | GPT-5 / o3 / 图像生成 / Code Interpreter |
| Pro | $200/月 | o3 高级版 / Deep Research / 优先 GPU |
| Team | $25/人/月 | Plus + 共享 / 管理 |
| Enterprise | 联系销售 | SSO / 审计 / 自定义 |

### 3. Azure OpenAI

OpenAI 模型在 Azure 部署（含**香港 / 新加坡 region**，大陆用户友好）：

```python
from openai import AzureOpenAI

client = AzureOpenAI(
    azure_endpoint="https://my-resource.openai.azure.com/",
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    api_version="2025-12-01-preview",
)
```

模型 ID 不一样：`gpt-5` → 部署名（自己配，如 `my-gpt5-deploy`）。

## 两套 API：chat.completions vs responses

OpenAI 2025 起推**新 API `responses`**——为 Agent 场景设计，将取代旧 `chat.completions`。两套共存：

| API | 端点 | 适合 |
| --- | --- | --- |
| `chat.completions` | `/v1/chat/completions` | 旧式对话（兼容） |
| `responses` | `/v1/responses` | Agent / 内置工具 / 长任务 |

### `chat.completions`（旧）

```python
from openai import OpenAI

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-5",
    messages=[
        {"role": "system", "content": "你是简洁的代码评审助手"},
        {"role": "user", "content": "评审：def divide(a, b): return a / b"},
    ],
    max_completion_tokens=1024,
)

print(response.choices[0].message.content)
```

### `responses`（新）

```python
response = client.responses.create(
    model="gpt-5",
    instructions="你是简洁的代码评审助手",
    input="评审：def divide(a, b): return a / b",
    tools=[{"type": "web_search"}],   # 内置 web 搜索
)

print(response.output_text)
```

::: tip 新项目用哪个？

- 简单对话 → `chat.completions` 仍最简单
- 用内置工具（web_search / code_interpreter / image_generation） → 必须 `responses`
- 构建 Agent → `responses` + Agent SDK

:::

## 第一次调用

```python
from openai import OpenAI

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-5",
    messages=[{"role": "user", "content": "用 Python 写个 quicksort"}],
)

print(response.choices[0].message.content)
print(f"用量: {response.usage}")
```

输出：

```python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    ...

用量: CompletionUsage(prompt_tokens=15, completion_tokens=120, total_tokens=135)
```

## Node.js 调用

```typescript
import OpenAI from "openai";

const client = new OpenAI();

const response = await client.chat.completions.create({
  model: "gpt-5",
  messages: [{ role: "user", content: "用 TS 写个 debounce" }],
});

console.log(response.choices[0].message.content);
```

## 内置工具（responses API 独有）

GPT 一类支持的内置工具：

### web_search

```python
response = client.responses.create(
    model="gpt-5",
    input="2026 年 NBA 总冠军是谁？",
    tools=[{"type": "web_search"}],
)
```

OpenAI 后台调用搜索引擎，把结果注入 context 后回答。**Claude 没有这个**（需自己接 MCP）。

### code_interpreter

```python
response = client.responses.create(
    model="gpt-5",
    input="计算 fibonacci(100) 的值",
    tools=[{"type": "code_interpreter", "container": {"type": "auto"}}],
)
```

OpenAI 后台启动 sandbox Python 环境，模型可写代码 + 执行 + 看结果迭代。**Claude 没有这个**。

### image_generation

```python
response = client.responses.create(
    model="gpt-5",
    input="画一张未来感的赛博朋克街景",
    tools=[{"type": "image_generation"}],
)
# response.output 含图 URL
```

调用 GPT-Image-1（DALL-E 继任者）。**Claude 完全不生图**。

### file_search

```python
response = client.responses.create(
    model="gpt-5",
    input="项目里关于支付流程的部分",
    tools=[{
        "type": "file_search",
        "vector_store_ids": ["vs_xxx"],
    }],
)
```

OpenAI 内置 RAG——把文件上传到 vector store，自动检索 + 注入 context。

## 多模态：图

```python
import base64

with open("screenshot.png", "rb") as f:
    image_data = base64.standard_b64encode(f.read()).decode("utf-8")

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "这截图里是什么错误？"},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/png;base64,{image_data}"},
                },
            ],
        }
    ],
)
```

::: tip 图像格式

注意 `image_url` 字段名（Claude 是 `image`，Gemini 是 `inlineData`）——三家 API 不通用。

:::

## 多模态：音频（Whisper + TTS）

```python
# 语音转文字（Whisper）
audio_file = open("speech.mp3", "rb")
transcript = client.audio.transcriptions.create(
    model="whisper-1",
    file=audio_file,
)
print(transcript.text)

# 文字转语音
response = client.audio.speech.create(
    model="tts-1",
    voice="alloy",
    input="你好，欢迎使用 OpenAI",
)
response.stream_to_file("output.mp3")
```

**Claude / Gemini 对比**：

- Claude：**完全没有音频 API**
- Gemini：原生集成（同一个 generate API 接受音频输入）
- GPT：Whisper 独立 endpoint + Realtime API 双向语音

## Realtime API（双向实时语音）

GPT 独有——构建语音对话 Agent 的低延迟双向接口：

```python
import asyncio
from openai import AsyncOpenAI

async def main():
    client = AsyncOpenAI()

    async with client.beta.realtime.connect(
        model="gpt-4o-realtime-preview"
    ) as connection:
        await connection.session.update(session={"modalities": ["text", "audio"]})

        # 发音频块
        await connection.input_audio_buffer.append(audio_data=audio_chunk)
        await connection.input_audio_buffer.commit()

        # 接 audio + text 响应
        async for event in connection:
            if event.type == "response.audio.delta":
                play(event.delta)
            elif event.type == "response.text.delta":
                print(event.delta, end="")

asyncio.run(main())
```

**Claude / Gemini 对比**：

- Claude：**无 Realtime API**
- Gemini：Live API（类似能力，差异见 Gemini 笔记）
- GPT：Realtime 较成熟，首响应 < 500ms

## 结构化输出（Structured Outputs）

GPT 业界最早一类支持「**强保证 JSON Schema 匹配**」：

```python
from pydantic import BaseModel

class CodeReview(BaseModel):
    issues: list[str]
    suggestions: list[str]
    score: int

response = client.chat.completions.parse(
    model="gpt-5",
    messages=[{"role": "user", "content": "评审：def divide(a, b): return a / b"}],
    response_format=CodeReview,
)

review = response.choices[0].message.parsed
print(review.issues)
print(review.suggestions)
print(review.score)
```

或直接传 JSON Schema：

```python
response = client.chat.completions.create(
    model="gpt-5",
    messages=[...],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "code_review",
            "strict": True,
            "schema": {
                "type": "object",
                "properties": {
                    "issues": {"type": "array", "items": {"type": "string"}},
                    "score": {"type": "integer", "minimum": 0, "maximum": 10},
                },
                "required": ["issues", "score"],
                "additionalProperties": False,
            },
        },
    },
)
```

**`strict: True` 保证**：

- 字段名严格匹配 schema
- 类型严格匹配（不会 string 当 int）
- enum 严格匹配
- required 字段一定有

**Claude 对比**：Claude 通过 Tool Use 模拟（伪 function call 返回 JSON）。

**Gemini 对比**：`responseSchema` 也一类支持。

## o-series 推理模型

`o3` / `o4-mini` 内置 chain-of-thought 推理：

```python
response = client.chat.completions.create(
    model="o3",
    messages=[
        {"role": "user", "content": "证明：对任意正整数 n，n^2 - n 是偶数"}
    ],
    reasoning_effort="high",   # low / medium / high
    max_completion_tokens=4096,
)

print(response.choices[0].message.content)
print(f"推理 tokens: {response.usage.reasoning_tokens}")
```

**reasoning_effort**：

- `low`：思考少（快 + 便宜）
- `medium`：默认
- `high`：思考多（慢 + 贵 + 更准）

推理 tokens 不可见但按 output 价计费。

## 大陆访问

OpenAI 官方不直接服务大陆。方案：

| 方案 | 难度 |
| --- | --- |
| 自备代理（梯子） | 低 |
| **Azure OpenAI 香港 / 新加坡 region** | 中（推荐企业） |
| OpenRouter / 代理服务 | 低 |
| 自部署转发（Vercel Edge） | 中 |

## 下一步

- [指南](./guide-line) —— 各类高级 API（Realtime / Structured Output / Code Interpreter / Function Calling）
- [参考](./reference) —— 完整模型 ID / 价格 / 错误码 / Rate Limits
- 对比：[Claude 笔记](../claude/) / [Gemini 笔记](../gemini/)
