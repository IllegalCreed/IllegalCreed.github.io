---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Gemini 2.5 系列 + `@google/genai` 新 SDK 编写。**重点接口与能力差异**。

## 接入方式

### 1. Google AI Studio（最快上手）

[aistudio.google.com](https://aistudio.google.com/) → Get API key → 即用。

- 免费配额：每日 50 RPD（请求数）/ 32K RPM（输入 tokens）/ 1M RPD（tokens）
- 网页 Playground 实时调

### 2. Gemini API（开发者）

```bash
export GOOGLE_API_KEY=AIzaSy_xxxxx

# Python
pip install google-genai

# Node.js
npm install @google/genai
```

::: warning SDK 迁移

旧 SDK `google-generativeai` / `@google/generative-ai` 已 deprecated。新项目用 `google-genai` / `@google/genai`，两者 API 不完全兼容。

:::

### 3. Vertex AI

```bash
gcloud auth application-default login

# Python（Vertex 模式）
pip install google-genai

from google import genai

client = genai.Client(
    vertexai=True,
    project="my-gcp-project",
    location="us-central1",
)
```

适合：企业 + 合规 + 已有 GCP 体系。

### 4. Gemini App

[gemini.google.com](https://gemini.google.com/) 聊天客户端。

| 套餐 | 价格 | 能力 |
| --- | --- | --- |
| Free | $0 | Gemini 2.5 Flash |
| Pro | $20/月 | Gemini 2.5 Pro + Deep Research + Veo 2 视频 |
| Ultra | $250/月 | 全部 + 优先 + 长 context |

## 第一次调用

```python
from google import genai

client = genai.Client()  # 自动读 GOOGLE_API_KEY

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="用 Python 写个 quicksort",
)

print(response.text)
print(f"用量: {response.usage_metadata}")
```

输出：

```
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    ...

用量: GenerateContentResponseUsageMetadata(
  prompt_token_count=12,
  candidates_token_count=120,
  total_token_count=132,
)
```

## Node.js 调用

```typescript
import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const response = await client.models.generateContent({
  model: "gemini-2.5-flash",
  contents: "用 TS 写个 debounce",
});

console.log(response.text);
```

## 关键接口差异（与 Claude / GPT 对比）

### contents 结构

```python
# 简单字符串
contents="hello"

# 多 turn 对话
contents=[
    {"role": "user", "parts": [{"text": "你好"}]},
    {"role": "model", "parts": [{"text": "你好！"}]},
    {"role": "user", "parts": [{"text": "现在几点？"}]},
]

# 多模态
contents=[{
    "role": "user",
    "parts": [
        {"text": "这图是什么"},
        {"inline_data": {"mime_type": "image/png", "data": base64_str}},
    ],
}]
```

::: tip 与 Claude / GPT 命名

- Claude: `messages: [{role, content: [{type: "text", text: "..."}, {type: "image", source: {...}}]}]`
- GPT: `messages: [{role, content: [{type: "text", text: "..."}, {type: "image_url", image_url: {url}}]}]`
- Gemini: `contents: [{role, parts: [{text: "..."}, {inline_data: {mime_type, data}}]}]`

**三家命名完全不同**——封装层得分别适配。

:::

### System Instruction

```python
response = client.models.generate_content(
    model="gemini-2.5-pro",
    contents="评审：def divide(a, b): return a / b",
    config={
        "system_instruction": "你是简洁的代码评审助手，回答 < 200 字。",
    },
)
```

**对比**：

- Claude: 顶层 `system` 字段
- GPT: `messages: [{role: "system", content: "..."}]`（或 `instructions` in responses API）
- Gemini: `config.system_instruction` 字段

## 多模态：图

```python
import base64

with open("screenshot.png", "rb") as f:
    image_data = base64.standard_b64encode(f.read()).decode()

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[{
        "role": "user",
        "parts": [
            {"text": "这截图是什么错误？"},
            {"inline_data": {"mime_type": "image/png", "data": image_data}},
        ],
    }],
)
```

或用 PIL 直接传（Python SDK 便捷封装）：

```python
from PIL import Image

img = Image.open("screenshot.png")
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=["这截图是什么错误？", img],
)
```

## 多模态：原生视频（Gemini 独有）

直接传 mp4 文件（无需先抽帧）：

```python
# 1. 上传文件（避免重复发）
video_file = client.files.upload(file="meeting.mp4")

# 2. 等处理完
while video_file.state.name == "PROCESSING":
    time.sleep(5)
    video_file = client.files.get(name=video_file.name)

# 3. 调用
response = client.models.generate_content(
    model="gemini-2.5-pro",
    contents=[
        video_file,
        "请总结这段视频的核心内容，列出关键时间戳。",
    ],
)

print(response.text)
```

**能力**：

- 单视频最长 **1 小时**（Pro）/ **15 分钟**（Flash）
- 自动抽帧（1 fps）+ 音轨理解
- 输出含时间戳引用（`[00:34]` 之类）

**Claude / GPT 对比**：

- Claude：**完全无视频 API**
- GPT：需手动抽帧（OpenCV 等）后作多图发，间接支持
- Gemini：**原生**，最强

## 多模态：原生音频

```python
audio_file = client.files.upload(file="speech.mp3")

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[
        audio_file,
        "请转录这段录音并指出情绪变化。",
    ],
)
```

**能力**：

- 单音频 < 9.5 小时
- 转录 + 情感分析 + 关键词提取 一次完成
- 支持 PCM / MP3 / WAV / AAC / FLAC

**对比**：

- Claude：**无音频 API**
- GPT：先 Whisper STT，再 GPT 分析（两步）
- Gemini：**一次性**，比 GPT 简洁

## Live API（实时双向）

```python
import asyncio
from google import genai

async def live_chat():
    client = genai.Client()

    config = {"response_modalities": ["TEXT"]}

    async with client.aio.live.connect(
        model="gemini-live-2.5-flash-preview",
        config=config,
    ) as session:
        await session.send_client_content(
            turns={"role": "user", "parts": [{"text": "你好！"}]},
        )

        async for response in session.receive():
            if response.text:
                print(response.text, end="")

asyncio.run(live_chat())
```

**Live API 能力**：

- 文 / 音 / 视频帧 实时双向
- 首响应 < 600ms
- 视频帧持续传（边录视频边问题）
- 可调函数

**对比 GPT Realtime**：

- GPT Realtime：仅音 + 文（无视频帧）
- Gemini Live：音 + 文 + **视频帧**

## Structured Output（responseSchema）

```python
from pydantic import BaseModel

class CodeReview(BaseModel):
    issues: list[str]
    suggestions: list[str]
    score: int

response = client.models.generate_content(
    model="gemini-2.5-pro",
    contents="评审：def divide(a, b): return a / b",
    config={
        "response_mime_type": "application/json",
        "response_schema": CodeReview,
    },
)

review: CodeReview = response.parsed
```

或直接 JSON Schema：

```python
config={
    "response_mime_type": "application/json",
    "response_schema": {
        "type": "object",
        "properties": {
            "issues": {"type": "array", "items": {"type": "string"}},
            "score": {"type": "integer"},
        },
        "required": ["issues", "score"],
    },
}
```

**对比 GPT / Claude**：

- GPT: `response_format: { json_schema: { strict: true } }`
- Claude: 通过 Tool Use 模拟
- Gemini: `responseSchema`，行为类似 GPT strict

## Grounding（Google Search 增强）

```python
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="2026 年最新的 Python 版本是？",
    config={
        "tools": [{"google_search": {}}],
    },
)

# 含搜索引用
for chunk in response.candidates[0].grounding_metadata.grounding_chunks:
    print(chunk.web.uri, chunk.web.title)
```

**Gemini 独有**——直接接入 Google Search index。**Claude / GPT 都需自接 web 搜索 MCP / 内置 tool**。

## 大陆访问

Gemini 在大陆不可直接访问。方案：

| 方案 | 难度 |
| --- | --- |
| 自备代理（梯子） | 低 |
| Vertex AI（部分 region 大陆可达） | 中 |
| OpenRouter / 代理服务 | 低 |
| 国内 alternative（智谱 GLM / 通义千问） | 0 |

详见 [OpenRouter 笔记](../../tools/other/open-router/)。

## 下一步

- [指南](./guide-line) —— 完整接口（Function Calling / Caching / Files / Live API / Grounding）
- [参考](./reference) —— 模型 ID / 价格 / Schema 完整字段 / SDK 平台
- 对比：[Claude](../claude/) / [GPT](../gpt/)
