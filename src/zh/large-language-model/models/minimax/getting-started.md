---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 MiniMax 官方开放平台文档（2026 当前主力 MiniMax-M3 + 开源 MiniMax-Text-01）编写

## 速查

- 国内端点：`https://api.minimaxi.com`（国际版 `https://api.minimax.io`）
- M3 推荐路径：`/anthropic/v1/messages`（Anthropic 兼容，支持 thinking 块）
- M3 OpenAI 兼容路径：`/v1/chat/completions`
- M3 上下文：**1M token**
- 临时音色有效期：**7 天**（未调用即删除）
- 同步 T2A 上限：10000 字符（HTTP/WebSocket）；异步 `t2a_async_v2` 上限 100 万字符
- voice_id 规则：长度 8~256、首字符必须英文字母、末位不可为 `-` 或 `_`
- 语气词标签仅 `speech-2.8` 系列：`(laughs)` / `(sighs)` / `(crying)` / `(gasps)` 等 22 种
- 开源旗舰：`MiniMax-Text-01`（456B 总参 / 45.9B 激活 MoE / Lightning Attention）

## 三种接入方式

### 1. 海螺 AI（C 端网页 / App）

最快上手——浏览器开 [hailuoai.com](https://hailuoai.com/) 或下载「海螺 AI」App，注册账号即用。适合单纯对话 / 视频生成 / 音乐生成等场景，无需开发。

### 2. MiniMax 开放平台 API（开发者）

```bash
# 获取 API key：注册 platform.minimaxi.com → 控制台 → API Keys
export MINIMAX_API_KEY=eyJhbGciOiJSUzI1...xxx
export MINIMAX_GROUP_ID=1234567890

# 国内版端点
curl https://api.minimaxi.com/v1/chat/completions \
  -H "Authorization: Bearer $MINIMAX_API_KEY" \
  -H "Content-Type: application/json"
```

三种 SDK 接入方式：

| 方式 | 端点 | 适合 |
| --- | --- | --- |
| **Anthropic SDK（推荐）** | `/anthropic/v1/messages` | M3 Agent 推理 / Tool Use / Interleaved Thinking |
| **OpenAI SDK** | `/v1/chat/completions` | 从 OpenAI 平迁，结构兼容 |
| **原始 HTTP** | 任意 | 跨语言 / 自定义封装 |

最简调用（Python + Anthropic SDK）：

```python
import anthropic

# 用 Anthropic SDK 走 MiniMax M3（官方推荐路径）
client = anthropic.Anthropic(
    api_key="eyJhbGciOiJSUzI1...xxx",
    base_url="https://api.minimaxi.com/anthropic",
)

message = client.messages.create(
    model="MiniMax-M3",
    max_tokens=1024,
    messages=[{"role": "user", "content": "用 Python 写个 quicksort"}],
)

print(message.content[0].text)
```

最简调用（Node.js + OpenAI SDK）：

```typescript
import OpenAI from "openai";

// 用 OpenAI SDK 走 MiniMax M3（平迁兼容）
const client = new OpenAI({
  apiKey: process.env.MINIMAX_API_KEY,
  baseURL: "https://api.minimaxi.com/v1",
});

const response = await client.chat.completions.create({
  model: "MiniMax-M3",
  max_tokens: 1024,
  messages: [{ role: "user", content: "用 TS 写个 debounce" }],
});

console.log(response.choices[0].message.content);
```

### 3. MCP 服务器（Claude Code / IDE 集成）

MiniMax 官方提供 Python / JavaScript 两版 MCP 服务器，封装语音合成 / 音色克隆 / 视频 / 音乐生成等能力，可直接挂在 Claude Code / Cline / Continue 等 MCP 客户端上。

## 选哪个模型？

简单决策表：

| 任务 | 选 |
| --- | --- |
| Agent 推理 / Tool Use / 复杂规划 | **MiniMax-M3**（走 `/anthropic/v1/messages`） |
| 整本仓库 / 长会话（≥200K） | **MiniMax-M3**（1M 上下文） |
| 日常 90% 通用问答 / 翻译 | **MiniMax-M3** 标准版（或 M2 高速版） |
| 高并发 / 极速响应（编码工作流） | **MiniMax-M2.7 highspeed**（~100 tps） |
| 跨语言 TTS / 自然语气 | **Speech-2.8 hd**（22 种语气词标签） |
| 实时语音对话（< 250ms） | **Realtime API**（WebSocket 全双工） |
| 长文本 TTS（> 1 万字符） | **t2a_async_v2**（最大 100 万字符） |
| 音色复刻 | **voice_clone**（10s~5min 音频） |
| 视频生成 | **Hailuo-2.3**（文生 / 图生视频） |
| 音乐生成 | **Music-3.0**（灵感 + 歌词） |
| 自部署 / 离线 | **MiniMax-Text-01**（HuggingFace 开源） |

## 第一次 API 调用（M3 文本生成）

完整 Python 示例（OpenAI 兼容路径）：

```python
from openai import OpenAI

client = OpenAI(
    api_key="eyJhbGciOiJSUzI1...xxx",
    base_url="https://api.minimaxi.com/v1",
)

response = client.chat.completions.create(
    model="MiniMax-M3",
    max_tokens=1024,
    messages=[
        {
            "role": "system",
            "content": "你是一个简洁的代码评审助手，回答 < 200 字。",
        },
        {
            "role": "user",
            "content": "评审：def divide(a, b): return a / b",
        },
    ],
)

print(response.choices[0].message.content)
print(f"用量: {response.usage}")
```

输出：

```text
缺陷：未处理 b=0 / 无类型注解 / 无 docstring。

建议：
def divide(a: float, b: float) -> float:
    if b == 0:
        raise ValueError("Divisor cannot be zero")
    return a / b
```

## 第一次 TTS 调用（同步语音合成）

```bash
curl -X POST https://api.minimaxi.com/v1/t2a_v2 \
  -H "Authorization: Bearer $MINIMAX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "speech-2.8-hd",
    "text": "你好，这是 MiniMax 语音合成测试。(laughs)",
    "stream": false,
    "voice_setting": {
      "voice_id": "female-tianmei",
      "language_boost": "auto"
    },
    "audio_setting": {
      "format": "mp3"
    }
  }'
```

要点：

- 文本上限 **10000 字符**（同步 HTTP/WebSocket 共享此限）
- `(laughs)` 是 `speech-2.8` 系列独有的语气词标签（22 种）
- `language_boost=auto` 让模型自主判断语种（覆盖 30+ 语言）
- 超长文本切到 `t2a_async_v2` 异步接口（最大 100 万字符）

## 流式响应

长回复用 stream，逐块拿到结果（OpenAI 兼容路径）：

```python
stream = client.chat.completions.create(
    model="MiniMax-M3",
    max_tokens=2048,
    stream=True,
    messages=[{"role": "user", "content": "解释 Lightning Attention 的核心原理"}],
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

Anthropic 兼容路径（M3 推荐）：

```python
with client.messages.stream(
    model="MiniMax-M3",
    max_tokens=2048,
    messages=[{"role": "user", "content": "解释 Interleaved Thinking"}],
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
```

## 多轮对话

把历史 messages 一起传：

```python
messages = [
    {"role": "user", "content": "用 Python 写个 fibonacci"},
    {"role": "assistant", "content": "..."},  # 上次回复
    {"role": "user", "content": "改成 iterative 的"},
]

response = client.chat.completions.create(
    model="MiniMax-M3",
    max_tokens=1024,
    messages=messages,
)
```

::: tip 多轮成本

每轮把整段历史发回——长对话 token 累积。M3 1M 上下文虽大但成本随长度上升。

解决：

- 旧消息定期总结压缩
- 工具调用结果走「Interleaved Thinking」原生路径，避免冗余 reasoning
- 高频 Agent 场景考虑 M2 高速版降低单次延迟

:::

## Tool Use（function calling）

M3 是原生 Agentic 模型，工具调用走 `tools` 数组：

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get current weather for a city",
            "parameters": {
                "type": "object",
                "properties": {"city": {"type": "string"}},
                "required": ["city"],
            },
        },
    }
]

response = client.chat.completions.create(
    model="MiniMax-M3",
    max_tokens=1024,
    tools=tools,
    messages=[{"role": "user", "content": "上海现在多少度？"}],
)

# M3 会返回 tool_calls，你执行后把结果传回完成多轮
tool_call = response.choices[0].message.tool_calls[0]
print(f"调用工具 {tool_call.function.name}({tool_call.function.arguments})")
```

详见指南章节「Tool Use 与 Interleaved Thinking」。

## 大陆 vs 国际版差异

MiniMax 是国产厂商，**国内版无墙直连**：

| 维度 | 国内版 | 国际版 |
| --- | --- | --- |
| 域名 | `platform.minimaxi.com` | `platform.minimax.io` |
| API 端点 | `api.minimaxi.com` | `api.minimax.io` |
| 计费 | 人民币（¥） | 美元（$） |
| 合规 | 国内云 / 备案合规 | 海外节点 |
| 适用 | 国内业务 / 中文场景 | 跨境业务 / 海外用户 |

国内开发者首选国内版；海外业务需走国际版避免合规风险。

## 下一步

- [指南](./guide-line) —— M3 / Lightning Attention / Tool Use / 语音与 Realtime 高级用法
- [参考](./reference) —— API 全字段 / 模型矩阵 / 价格 / SDK 全平台
- C 端产品：[海螺 AI 官网](https://www.minimaxi.com/)
