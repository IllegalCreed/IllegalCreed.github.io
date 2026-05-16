---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 OpenRouter 2026 编写

## 速查

- Base URL：`https://openrouter.ai/api/v1`
- 模型 ID：`<vendor>/<model>`（如 `anthropic/claude-sonnet-4.6`）
- OpenAI SDK 兼容：改 base URL 即可用
- 路由：`extra_body.provider.{sort, order, allow_fallbacks}`
- 自动选优：`model="openrouter/auto"`
- 免费模型：`<model>:free` 后缀
- Headers：`HTTP-Referer` + `X-Title` 标识来源
- 数据隐私：默认开 logging，商业项目应关
- 大陆访问：直连 / Cloudflare Worker 代理 / 信用卡 / Crypto

## 路由策略详解

### `provider.order` 优先级

```python
extra_body={
    "provider": {
        "order": ["openai", "anthropic", "azure"],
        "allow_fallbacks": True,
    }
}
```

- 第一选项：openai 直连
- 失败 fallback：anthropic（不存在该模型时跳过）/ azure

### `provider.sort` 优化目标

```python
extra_body={"provider": {"sort": "throughput"}}     # 选最快吞吐
extra_body={"provider": {"sort": "latency"}}        # 选最低延迟（适合 UI）
extra_body={"provider": {"sort": "price"}}          # 选最便宜
```

### `provider.require_parameters`

```python
extra_body={
    "provider": {
        "require_parameters": True,    # 仅选支持本次所有 extra 参数的 provider
    }
}
```

避免 fallback 到不支持 `response_format` / `tools` 等参数的 provider。

### `provider.allow_fallbacks`

```python
extra_body={
    "provider": {
        "order": ["openai"],
        "allow_fallbacks": False,    # 严格仅用 openai，失败直接报错
    }
}
```

## Fallback 与 Retry

OpenRouter 内置 retry，但**模型级 fallback** 需自己处理：

```python
def chat_with_fallback(messages, models=["anthropic/claude-sonnet-4.6", "openai/gpt-5"]):
    for model in models:
        try:
            return client.chat.completions.create(
                model=model,
                messages=messages,
                timeout=30,
            )
        except Exception as e:
            print(f"{model} failed: {e}")
    raise Exception("All models failed")
```

::: tip 价格梯度 fallback

```python
# 先用便宜的，超 context / 失败再升级
models = [
    "openai/gpt-5-nano",
    "openai/gpt-5-mini",
    "openai/gpt-5",
    "anthropic/claude-opus-4.7",
]
```

:::

## Models endpoint：动态发现

```python
import httpx

response = httpx.get("https://openrouter.ai/api/v1/models")
models = response.json()["data"]

for m in models:
    print(m["id"], m["pricing"]["prompt"], m["pricing"]["completion"])
```

返回字段：

```json
{
  "id": "anthropic/claude-sonnet-4.6",
  "name": "Claude Sonnet 4.6",
  "created": 1234567890,
  "description": "...",
  "pricing": {"prompt": "0.0000033", "completion": "0.0000165"},
  "context_length": 200000,
  "architecture": {"modality": "text+image->text", "tokenizer": "Claude"},
  "top_provider": {"context_length": 200000, "max_completion_tokens": 8192},
  "per_request_limits": null
}
```

适合：

- 价格监控（定期拉取入库）
- 模型选型脚本（按 context_length / pricing 过滤）

## 与 Claude Code 集成

Claude Code 支持自定义 base URL：

```bash
# 启动 Claude Code 时设
export ANTHROPIC_BASE_URL=https://openrouter.ai/api/v1
export ANTHROPIC_API_KEY=sk-or-v1-xxxxx
claude
```

或在 `~/.claude/settings.json`：

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://openrouter.ai/api/v1",
    "ANTHROPIC_API_KEY": "sk-or-v1-xxxxx"
  }
}
```

::: warning 通过 OpenRouter 用 Claude Code 限制

- 部分 Claude 独有特性可能不全（如 MCP / Files API / Extended Thinking 细节）
- Tool Use 边界 case 偶发问题
- 建议**仅大陆访问场景** + **测试模型**用，生产仍直连 Anthropic / Bedrock

:::

## 与 Continue / Cursor / Aider 集成

### Continue (VS Code)

```json
// ~/.continue/config.json
{
  "models": [
    {
      "title": "Claude 4.6",
      "provider": "openai",
      "model": "anthropic/claude-sonnet-4.6",
      "apiBase": "https://openrouter.ai/api/v1",
      "apiKey": "sk-or-v1-xxxxx"
    }
  ]
}
```

### Cursor

Cursor → Settings → Models → Custom OpenAI →

```
Base URL: https://openrouter.ai/api/v1
API Key: sk-or-v1-xxxxx
Model: anthropic/claude-sonnet-4.6
```

### Aider

```bash
aider \
  --openai-api-base https://openrouter.ai/api/v1 \
  --openai-api-key sk-or-v1-xxxxx \
  --model openrouter/anthropic/claude-sonnet-4.6
```

### LiteLLM Proxy

```yaml
# config.yaml
model_list:
  - model_name: claude-router
    litellm_params:
      model: openrouter/anthropic/claude-sonnet-4.6
      api_key: sk-or-v1-xxxxx
```

## 流式 + Tool Use 完整

```python
stream = client.chat.completions.create(
    model="anthropic/claude-sonnet-4.6",
    messages=[{"role": "user", "content": "上海多少度？"}],
    tools=[weather_tool],
    stream=True,
)

current_tool_call = None

for chunk in stream:
    delta = chunk.choices[0].delta

    if delta.content:
        print(delta.content, end="")
    if delta.tool_calls:
        for tc in delta.tool_calls:
            # 累积 tool call（流式 chunk 拼接）
            ...
```

OpenRouter 把各家流式格式归一到 OpenAI 兼容流式——已用 OpenAI SDK 代码可直接用。

## 多模态：图 / PDF

```python
# 图（OpenAI 兼容格式）
content = [
    {"type": "text", "text": "看图"},
    {"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}},
]

# OpenRouter 自动把 image_url 转成 Claude 的 image / Gemini 的 inlineData 格式
```

PDF 支持视模型：

| Model | PDF 支持 |
| --- | --- |
| Anthropic Claude 4+ | ✓（OR 自动转 document block） |
| Google Gemini 2+ | ✓ |
| OpenAI GPT 系 | ✗（需先 vision 抽页） |

```python
# PDF
content = [
    {"type": "text", "text": "总结"},
    {"type": "file", "file": {"file_data": "data:application/pdf;base64,...", "filename": "doc.pdf"}},
]
```

## 自定义 Headers

```python
extra_headers={
    "HTTP-Referer": "https://my-app.com",
    "X-Title": "My AI App",
}
```

- `HTTP-Referer`：出现在 Activity 面板（看哪个 app 用了多少）
- `X-Title`：应用名（同上）

**用途**：

- 团队协作时分清谁用了多少 token
- 公开 app 时让 OpenRouter 知道你的存在（更高 rate limit）

## Caching

OpenRouter 部分 model（Claude / GPT / Gemini）支持 prompt caching——透明转发：

```python
# Claude 风格（OpenRouter 转发）
messages = [
    {
        "role": "system",
        "content": [
            {"type": "text", "text": LONG_CONTEXT, "cache_control": {"type": "ephemeral"}},
        ],
    },
    {"role": "user", "content": "..."},
]
```

```python
# GPT 自动 cache（无需配置）
# 第二次相同前缀自动命中
```

::: tip Caching 表现

- Claude on OR：cache 命中节省 ~85%（OR 加 10% 中间费后）
- GPT on OR：自动 cache，~45% 节省
- Gemini on OR：implicit cache 65%+ 节省

:::

## 错误处理

```python
from openai import APIError, RateLimitError

try:
    response = client.chat.completions.create(
        model="anthropic/claude-sonnet-4.6",
        messages=[...],
        extra_body={
            "provider": {"allow_fallbacks": True},
        },
    )
except RateLimitError:
    # 当前 provider 限速，OR 已自动 fallback
    # 仍报错说明所有 provider 都限了
    time.sleep(60)
except APIError as e:
    if e.status_code == 402:
        # credit 不足
        raise NeedRechargeError()
    elif e.status_code == 503:
        # 所有 provider 不可用
        ...
```

## Activity 监控自动化

```python
import httpx
import csv

def export_activity(start_date, end_date):
    response = httpx.get(
        "https://openrouter.ai/api/v1/activity",
        headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}"},
        params={"start_date": start_date, "end_date": end_date},
    )
    activities = response.json()["data"]

    with open("activity.csv", "w") as f:
        writer = csv.DictWriter(f, fieldnames=["timestamp", "model", "tokens", "cost"])
        writer.writeheader()
        for a in activities:
            writer.writerow({
                "timestamp": a["timestamp"],
                "model": a["model"],
                "tokens": a["total_tokens"],
                "cost": a["total_cost"],
            })
```

跑成 cron job 每天导出，进 Grafana 做成本看板。

## 性能调优

### 延迟优化

```python
extra_body={
    "provider": {
        "sort": "latency",
        "order": ["openai", "anthropic"],   # 选最近 region
    }
}
```

经验：

- Anthropic on OR：本身就慢（多一跳），UI 场景慎用 Claude
- GPT-5-mini 通常最快（OpenAI 节点多）
- Gemini Flash 也快

### 成本优化

1. **缓存**：Claude cache_control / GPT 自动 cache
2. **模型梯度**：mini → standard fallback
3. **`require_parameters: False`**：让 OR 选最便宜 provider（即使不支持 strict 等）

```python
def smart_chat(messages, complexity="simple"):
    if complexity == "simple":
        model = "openai/gpt-5-mini"
    elif complexity == "medium":
        model = "anthropic/claude-sonnet-4.6"
    else:
        model = "anthropic/claude-opus-4.7"

    return client.chat.completions.create(model=model, messages=messages)
```

### Streaming 流量

```python
# 流式 + 提前 close
stream = client.chat.completions.create(model=..., stream=True)
for chunk in stream:
    print(chunk.choices[0].delta.content, end="")
    if reached_my_limit():
        stream.close()   # 停止生成，节省 token
        break
```

## 常见陷阱

| 陷阱 | 解决 |
| --- | --- |
| Claude MCP 不工作 | OR 不转发 MCP，直连 Anthropic |
| Gemini Files API 不工作 | OR 不支持，用 Vertex 直连 |
| GPT Realtime 不工作 | OR 不支持 WebSocket，直连 OpenAI |
| Tool 调用结果格式错 | 测试每家模型实际输出，可能需要 normalize |
| `response_format: json_schema` 部分模型不支持 | 设 `require_parameters: True` 过滤 |
| 模型 ID 不存在 | 模型可能已 retire，看 `/api/v1/models` |
| Stream 一直不返回 | 网络问题（境内境外网络抖动） |
| credit 用完了 | Settings → Add Credit / 自动 top-up |

## 安全考量

<v-clicks>

- API key 可设 **per-app**（多个 key 区分用途，泄露后单独撤销）
- Settings → Privacy 关 logging（商业项目）
- `:free` model 通常允许训练数据 → 商业敏感数据慎用
- OpenRouter 自家审计：data 在他们服务器停留 < 24 小时（除非你开 logging）
- 启用 IP 白名单（Pro 功能）

</v-clicks>

## 版本里程碑

| 时间 | 主要变化 |
| --- | --- |
| 2023 | OpenRouter 诞生，聚合 100+ 模型 |
| 2024 | Auto routing / `:free` tier / multi-provider fallback |
| 2025 | 400+ 模型 / 大陆友好（crypto / 反代友好）/ Activity Dashboard |
| 2026 | 智能路由优化 / 更多 enterprise 功能 |
