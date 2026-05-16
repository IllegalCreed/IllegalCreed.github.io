---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 OpenRouter 2026 编写。完整 API 见 [openrouter.ai/docs](https://openrouter.ai/docs)。

## API Endpoints

| Endpoint | 用途 |
| --- | --- |
| `POST /api/v1/chat/completions` | 聊天（OpenAI 兼容） |
| `POST /api/v1/completions` | 旧式 completions |
| `GET /api/v1/models` | 模型列表 |
| `GET /api/v1/auth/key` | API key 信息 |
| `GET /api/v1/credits` | 余额查询 |
| `GET /api/v1/activity` | 活动记录 |
| `POST /api/v1/credits/charge` | 充值 |

## chat/completions 兼容性

OpenRouter 遵循 OpenAI Chat Completions API schema，**完全兼容** OpenAI SDK 的所有方法（包括 streaming / tool_use / multi-modal / response_format 等）。

```python
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)
# 之后所有调用与官方 OpenAI 完全相同
```

## OpenRouter 特定参数（`extra_body`）

```python
extra_body={
    "provider": {
        "order": ["openai", "anthropic", "azure"],
        "allow_fallbacks": True,
        "sort": "throughput",      # throughput / latency / price
        "require_parameters": True,
        "data_collection": "deny", # allow / deny（覆盖账号设置）
        "ignore": ["xai"],          # 排除某些 provider
    },
    "transforms": ["middle-out"],   # context 压缩策略
    "models": [                      # 多 model fallback（OR 自动选）
        "openai/gpt-5",
        "anthropic/claude-sonnet-4.6",
    ],
    "route": "fallback",            # fallback / auto
}
```

## 模型 ID 格式

```
<vendor>/<model-name>[:variant]
```

### 主流 vendor 与模型

#### Anthropic

```
anthropic/claude-opus-4.7
anthropic/claude-opus-4.7:1m         # 1M 上下文
anthropic/claude-sonnet-4.6
anthropic/claude-haiku-4.5
anthropic/claude-3.5-sonnet           # 旧版
```

#### OpenAI

```
openai/gpt-5
openai/gpt-5-mini
openai/gpt-5-nano
openai/o3
openai/o4-mini
openai/gpt-4o
openai/gpt-4o-mini
```

#### Google

```
google/gemini-2.5-pro
google/gemini-2.5-flash
google/gemini-2.5-flash-lite
google/gemini-2.5-flash-image
```

#### xAI

```
xai/grok-2
xai/grok-2-vision
xai/grok-4
```

#### Meta Llama

```
meta-llama/llama-3.3-70b-instruct
meta-llama/llama-3.3-70b-instruct:free
meta-llama/llama-3.1-405b-instruct
meta-llama/llama-3.1-8b-instruct:free
```

#### Mistral

```
mistralai/mistral-large
mistralai/mistral-medium
mistralai/mixtral-8x22b-instruct
```

#### DeepSeek

```
deepseek/deepseek-r1
deepseek/deepseek-v3
deepseek/deepseek-chat
deepseek/deepseek-r1:free
```

#### 阿里 Qwen

```
qwen/qwen-2.5-72b-instruct
qwen/qwen-2.5-coder-32b-instruct
qwen/qwen-vl-max
qwen/qwen-2.5-7b-instruct:free
```

#### 智谱 GLM

```
zhipu/glm-4-plus
zhipu/glm-4-air
zhipu/glm-4v
```

#### Cohere

```
cohere/command-r-plus
cohere/command-r-08-2024
```

#### Auto Routing

```
openrouter/auto                       # 让 OR 自动选最优
```

### `:variant` 后缀

| 后缀 | 含义 |
| --- | --- |
| `:free` | 免费 tier（rate limit 严格 + 允许训练） |
| `:1m` | 1M 上下文版本（Claude / GPT-5 等） |
| `:nitro` | 极速 provider 优先（部分模型） |
| `:beta` | beta 版本 |
| `:online` | 自动接 web search（部分模型） |

## Provider 完整列表

主要 provider：

| Provider | 提供模型 | 区域 |
| --- | --- | --- |
| `openai` | OpenAI 直连 | 美国 |
| `anthropic` | Anthropic 直连 | 美国 |
| `google-vertex` | Google Vertex AI | 多 region |
| `google-ai-studio` | Google AI Studio | 全球 |
| `azure` | Azure OpenAI | 多 region |
| `fireworks` | Fireworks AI（开源模型托管） | 美国 |
| `together` | Together AI | 美国 |
| `groq` | Groq（极速推理） | 美国 |
| `cerebras` | Cerebras（极速） | 美国 |
| `deepinfra` | DeepInfra | 美国 |
| `nebius` | Nebius AI | 欧洲 |
| `mistral` | Mistral 直连 | 欧洲 |

完整列表 + 实时状态：[openrouter.ai/providers](https://openrouter.ai/providers)

## 价格速查（2026，含中间费）

| Model | Input $/M | Output $/M |
| --- | --- | --- |
| anthropic/claude-opus-4.7 | $16.50 | $82.50 |
| anthropic/claude-sonnet-4.6 | $3.30 | $16.50 |
| anthropic/claude-haiku-4.5 | $0.88 | $4.40 |
| openai/gpt-5 | $5.50 | $27.50 |
| openai/gpt-5-mini | $0.55 | $2.75 |
| openai/gpt-5-nano | $0.11 | $0.44 |
| openai/o3 | $16.50 | $66 |
| google/gemini-2.5-pro | $1.38 | $5.50 |
| google/gemini-2.5-flash | $0.36 | $1.44 |
| google/gemini-2.5-flash-lite | $0.09 | $0.36 |
| deepseek/deepseek-r1 | $0.30 | $1.20 |
| qwen/qwen-2.5-72b-instruct | $0.40 | $0.60 |
| meta-llama/llama-3.3-70b | $0.27 | $0.40 |
| xai/grok-4 | $5 | $15 |

实时价格：[openrouter.ai/models](https://openrouter.ai/models)

## Rate Limits

按 API key + model 限速。免费 tier 严格：

| 模型类型 | 默认 RPM | 默认 RPD |
| --- | --- | --- |
| `:free` 模型 | 20 | 200 |
| 付费模型 | 由 provider 决定 | - |

充值 $10+ 后 free model RPD 上升到 1000。

## Models endpoint 字段

```json
{
  "data": [
    {
      "id": "anthropic/claude-sonnet-4.6",
      "canonical_slug": "anthropic/claude-sonnet-4.6",
      "name": "Claude Sonnet 4.6",
      "created": 1234567890,
      "description": "...",
      "context_length": 200000,
      "architecture": {
        "modality": "text+image->text",
        "tokenizer": "Claude",
        "instruct_type": null
      },
      "pricing": {
        "prompt": "0.0000033",
        "completion": "0.0000165",
        "image": "0.0048",
        "request": "0"
      },
      "top_provider": {
        "context_length": 200000,
        "max_completion_tokens": 8192,
        "is_moderated": false
      },
      "per_request_limits": null
    }
  ]
}
```

## Headers

### Request Headers

| Header | 用途 |
| --- | --- |
| `Authorization: Bearer <key>` | API key |
| `HTTP-Referer` | 来源 URL（Activity 显示） |
| `X-Title` | 应用名（Activity 显示） |
| `OpenRouter-Client` | SDK 标识（自动加） |

### Response Headers

| Header | 用途 |
| --- | --- |
| `OpenRouter-Provider` | 实际用的 provider |
| `OpenRouter-Model` | 实际用的 model |
| `OpenRouter-Cost` | 本次费用（USD） |
| `OpenRouter-Provider-Cost` | provider 原始费用 |
| `X-OpenRouter-Latency-Ms` | 实际延迟 |

```python
response = client.chat.completions.with_raw_response.create(...)
print(response.http_response.headers.get("OpenRouter-Provider"))
print(response.http_response.headers.get("OpenRouter-Cost"))
```

## 错误码

| HTTP | 类型 | 含义 |
| --- | --- | --- |
| 400 | bad_request | 参数错 |
| 401 | unauthorized | API key 错 |
| 402 | payment_required | credit 不足 |
| 403 | forbidden | model 无权限（某 provider 拒） |
| 404 | not_found | model ID 不存在 |
| 408 | timeout | provider 超时 |
| 429 | rate_limit | 超 RPM / RPD |
| 500 | internal_error | OR 内部错 |
| 502 | bad_gateway | provider 返错 |
| 503 | service_unavailable | 所有 provider 不可用 |

```json
{
  "error": {
    "code": 429,
    "message": "Rate limit exceeded",
    "metadata": {
      "provider": "openai",
      "raw": "..."
    }
  }
}
```

## CLI 工具

OpenRouter 没官方 CLI，社区有：

```bash
# openrouter-cli（社区）
npm i -g openrouter-cli
openrouter chat anthropic/claude-sonnet-4.6 "你好"
```

或用 [aichat](https://github.com/sigoden/aichat)：

```yaml
# ~/.config/aichat/config.yaml
clients:
  - type: openai-compatible
    name: openrouter
    api_base: https://openrouter.ai/api/v1
    api_key: sk-or-v1-xxx
    models:
      - name: claude
        model: anthropic/claude-sonnet-4.6
      - name: gpt5
        model: openai/gpt-5
```

```bash
aichat -m openrouter:claude "你好"
```

## 数据政策详解

| 设置 | 默认 | 影响 |
| --- | --- | --- |
| Account-wide logging | ✓ 开 | OR 保留 30 天用于 Activity（关闭后 0 保留） |
| Provider training opt-in | 各家独立 | 部分上游可能用你数据训练 |
| `:free` model | 允许训练 | 不可关 |
| Anthropic / OpenAI 付费 | 不训练 | 直接遵循各家政策 |
| Vertex / Bedrock | 不训练 | 合规级别 |

```python
# 单次请求覆盖
extra_body={
    "provider": {
        "data_collection": "deny",   # 强制禁止收集
    }
}
```

## 资源链接

- 主文档：[openrouter.ai/docs](https://openrouter.ai/docs)
- 模型列表：[openrouter.ai/models](https://openrouter.ai/models)
- Provider 列表：[openrouter.ai/providers](https://openrouter.ai/providers)
- 价格：[openrouter.ai/models](https://openrouter.ai/models)（每模型详情页）
- Activity：[openrouter.ai/activity](https://openrouter.ai/activity)
- Settings：[openrouter.ai/settings](https://openrouter.ai/settings)
- Status：[status.openrouter.ai](https://status.openrouter.ai/)
- Discord：[discord.gg/openrouter](https://discord.gg/openrouter)
- GitHub（CLI / 示例）：[github.com/OpenRouterTeam](https://github.com/OpenRouterTeam)
