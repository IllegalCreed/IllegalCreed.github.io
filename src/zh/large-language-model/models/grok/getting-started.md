---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 xAI 官方 API（截至 2026-07，主力 Grok 4.5 / 4.3）+ OpenAI SDK 兼容模式编写。**重点接口与能力差异**。

## 速查

- Base URL：`https://api.x.ai/v1`；认证 `Authorization: Bearer $XAI_API_KEY`
- 完全兼容 OpenAI SDK：Python / Node 仅改 base_url + api_key
- 模型 ID：`grok-4.5`（旗舰 500K）/ `grok-4.3`（1M）/ `grok-build-0.1`（编码）/ `grok-4.20-multi-agent-0309`（多智能体）
- 别名规则：`<name>`（最新稳定）/ `<name>-latest`（含最新功能）/ `<name>-<date>`（锁定版本）
- Chat 端点：`POST /v1/chat/completions`（OpenAI 兼容）
- Responses 端点：`POST /v1/responses`（原生工具集成）
- 搜索：`search_parameters: {mode, sources, max_search_results, from_date, to_date, return_citations}`
- 服务端工具：`x_search` / `web_search` / `code_execution` / `attachment_search` / `collections_search`
- 推理控制：`reasoning_effort: none/low/medium/high`（仅推理模型）
- 异步：`deferred: true` + `GET /v1/chat/deferred-completion/{request_id}`
- 缓存：`prompt_cache_key` 触发粘性路由，cached input 大幅折扣
- 计费透明：响应 `usage.cost_in_usd_ticks`（10^10 ticks/美元）+ `num_sources_used`
- 上限：`max_completion_tokens` 默认 128,000（`max_tokens` 已弃用）

## 接入方式

### 1. xAI Console（最快上手）

[console.x.ai](https://console.x.ai/) → 创建 Project → 生成 API Key → 即用。

- 充值：预付 credits，按用量扣减
- Dashboard：实时看 tokens / cost / 调用数

### 2. xAI API（开发者，OpenAI SDK 兼容）

```bash
export XAI_API_KEY=xai-xxxxx

# 复用现有 openai 库（无需新装）
pip install openai          # Python
npm install openai          # Node
```

::: tip 兼容性

xAI API 与 OpenAI Chat Completions 端点 100% 兼容——直接复用 `openai` 库代码，只改 `base_url` 和 `api_key`。也兼容 Vercel AI SDK（`@ai-sdk/xai`）和 xAI 原生 `xai_sdk`。

:::

### 3. Grok App（聊天客户端）

[grok.com](https://grok.com) 或 X App 内嵌 Grok。

| 套餐 | 价格 | 能力 |
| --- | --- | --- |
| Free | $0 | 基础 Grok |
| SuperGrok | $30/月 | Grok 4.5 + DeepSearch + Imagine |
| X Premium+ | $16/月 | X 内 Grok 优先 + 长上下文 |

### 4. 第三方网关（大陆友好）

| 方式 | 备注 |
| --- | --- |
| **OpenRouter** | 多厂商对比，加价 ~10% |
| **Vercel AI SDK** | `@ai-sdk/xai` provider |
| **Cloudflare AI Gateway** | 缓存 / 限流 / 监控 |

## 第一次调用（Python）

```python
from openai import OpenAI

# 复用 OpenAI SDK，只改 base_url 与 api_key
client = OpenAI(
    base_url="https://api.x.ai/v1",
    api_key="xai-xxxxx",
)

response = client.chat.completions.create(
    model="grok-4.5",
    messages=[
        {"role": "system", "content": "你是一名资深前端工程师，用流畅中文回答。"},
        {"role": "user", "content": "用 Python 写个 quicksort"},
    ],
)

print(response.choices[0].message.content)
print(f"用量: {response.usage}")
```

输出（节选）：

```text
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    ...

用量: CompletionUsage(
  prompt_tokens=24,
  completion_tokens=120,
  total_tokens=144,
  prompt_tokens_details=CachedTokens(cached_tokens=0),
  completion_tokens_details=CompletionTokensDetails(reasoning_tokens=0),
)
```

## 第一次调用（Node.js / TypeScript）

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.x.ai/v1",
  apiKey: process.env.XAI_API_KEY,
});

const response = await client.chat.completions.create({
  model: "grok-4.5",
  messages: [
    { role: "system", content: "你是一名资深前端工程师，用流畅中文回答。" },
    { role: "user", content: "用 TS 写个 debounce" },
  ],
});

console.log(response.choices[0].message.content);
console.log("成本（ticks）:", response.usage?.cost_in_usd_ticks);
```

## 用 curl 直调（最小化依赖）

```bash
curl https://api.x.ai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $XAI_API_KEY" \
  -d '{
    "model": "grok-4.5",
    "messages": [{"role": "user", "content": "一句话解释什么是 MCP"}]
  }'
```

## 关键接口差异（与 Claude / GPT / Gemini 对比）

### messages 结构（与 OpenAI 一致）

```typescript
const messages = [
  { role: "system", content: "..." },
  { role: "user", content: "..." },
  { role: "assistant", content: "..." },
  { role: "tool", content: "...", tool_call_id: "..." },
];
```

### 实时搜索（独占）

```python
response = client.chat.completions.create(
    model="grok-4.5",
    messages=[{"role": "user", "content": "xAI 最新发布了什么模型？"}],
    search_parameters={
        "mode": "auto",                       # off / on / auto
        "sources": ["web", "x"],              # 同时搜 Web + X
        "max_search_results": 10,
        "return_citations": True,
    },
)

# 引用列表
for cite in response.citations:
    print(cite.url, cite.title)
```

### reasoning_effort（推理强度）

```python
# 推理模型支持；grok-4.5 默认 high
response = client.chat.completions.create(
    model="grok-4.3",
    messages=[...],
    reasoning_effort="low",   # none / low / medium / high
)
```

### 异步 deferred（长任务）

```python
import time, requests

# 提交异步任务
r = requests.post(
    "https://api.x.ai/v1/chat/completions",
    headers={"Authorization": f"Bearer {XAI_API_KEY}"},
    json={
        "model": "grok-4.5",
        "messages": [...],
        "deferred": True,
    },
).json()

request_id = r["request_id"]

# 轮询
while True:
    result = requests.get(
        f"https://api.x.ai/v1/chat/deferred-completion/{request_id}",
        headers={"Authorization": f"Bearer {XAI_API_KEY}"},
    ).json()
    if result.get("status") == "complete":
        print(result["choices"][0]["message"])
        break
    time.sleep(5)
```

## Prompt 缓存省钱

为重复 system prompt / 长上下文设置稳定的 `prompt_cache_key`，xAI 会粘性路由到同一服务器以稳定命中缓存。

```python
response = client.chat.completions.create(
    model="grok-4.5",
    messages=[
        {"role": "system", "content": VERY_LONG_SYSTEM_PROMPT},   # 固定不变
        {"role": "user", "content": "今天的问题"},
    ],
    prompt_cache_key="my-app-prod-001",   # 触发粘性路由
)

# cached_tokens 命中数
print(response.usage.prompt_tokens_details.cached_tokens)
```

**省钱效果**（grok-4.5）：cached input $0.30 vs 标准 $2.00，省 85%。

## 大陆访问

xAI API 在大陆不可直接访问。方案：

| 方案 | 难度 |
| --- | --- |
| 自备代理（梯子） | 低 |
| OpenRouter 网关 | 低 |
| Cloudflare AI Gateway | 中 |
| 国内 alternative（智谱 GLM / 通义千问 / DeepSeek） | 0 |

详见 [OpenRouter 笔记](../../tools/other/open-router/)。

## 下一步

- [指南](./guide-line) —— 完整接口（搜索参数 / 服务端工具 / Function Calling / Imagine / 多智能体）
- [参考](./reference) —— 模型 ID / 价格 / Schema 完整字段 / 参数黑名单
- 对比：[Gemini](../gemini/) / [GPT](../gpt/) / [Claude](../claude/)
