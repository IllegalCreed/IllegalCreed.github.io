---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 OpenRouter 2026 编写

## 注册

[openrouter.ai](https://openrouter.ai/) → Sign Up → 通过 Google / GitHub / 邮箱注册。

注册送少量 free credit（够试 50-100 次 GPT-5-mini）。

## 获取 API Key

1. 登录后 → Settings → Keys
2. **Create Key** 命名（如 `prod` / `dev`）
3. 复制保存（仅一次显示）

```bash
export OPENROUTER_API_KEY=sk-or-v1-xxxxx
```

## 第一次调用：OpenAI SDK 兼容

直接用 OpenAI SDK，仅改 base URL：

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

response = client.chat.completions.create(
    model="anthropic/claude-sonnet-4.6",   # OpenRouter 模型 ID 格式
    messages=[{"role": "user", "content": "用 Python 写个 quicksort"}],
)

print(response.choices[0].message.content)
```

Node.js：

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const response = await client.chat.completions.create({
  model: "google/gemini-2.5-flash",
  messages: [{ role: "user", content: "..." }],
});
```

## 模型 ID 命名规则

```
<vendor>/<model-name>[:variant]
```

例：

| OpenRouter ID | 对应 |
| --- | --- |
| `anthropic/claude-opus-4.7` | Claude Opus 4.7 |
| `anthropic/claude-sonnet-4.6` | Claude Sonnet 4.6 |
| `anthropic/claude-haiku-4.5` | Claude Haiku 4.5 |
| `openai/gpt-5` | GPT-5 |
| `openai/gpt-5-mini` | GPT-5-mini |
| `openai/o3` | o3 |
| `openai/gpt-4o` | GPT-4o |
| `google/gemini-2.5-pro` | Gemini 2.5 Pro |
| `google/gemini-2.5-flash` | Gemini 2.5 Flash |
| `meta-llama/llama-3.3-70b-instruct` | Llama 3.3 70B |
| `deepseek/deepseek-r1` | DeepSeek R1 |
| `qwen/qwen-2.5-72b-instruct` | Qwen 2.5 72B |
| `zhipu/glm-4-plus` | 智谱 GLM-4-Plus |
| `xai/grok-2` | Grok 2 |

::: tip 找模型 ID

[openrouter.ai/models](https://openrouter.ai/models) 网页搜，点开任一模型有 API 调用示例（带 ID）。

:::

## Free / Auto Routing

OpenRouter 提供「**自动选最优**」路由：

```python
# 让 OpenRouter 自动选最快 / 最便宜
response = client.chat.completions.create(
    model="openrouter/auto",    # 自动选
    messages=[...],
)
```

或限定**仅免费模型**：

```python
model="meta-llama/llama-3.1-8b-instruct:free"
```

`:free` 后缀的模型完全免费（但有更严格的速率限制 + 数据用于训练）。

## 多 Provider 路由

同一模型常有多个 provider（OpenAI 直连 + Azure + 其它转售）。可控路由：

```python
response = client.chat.completions.create(
    model="openai/gpt-5",
    messages=[...],
    extra_body={
        "provider": {
            "order": ["openai", "azure"],     # 优先 openai，失败 fallback azure
            "allow_fallbacks": True,
            "sort": "throughput",             # throughput / latency / price
            "require_parameters": True,        # 必须支持指定参数
        },
    },
)
```

`sort` 选项：

- `throughput`：吞吐量最高
- `latency`：延迟最低
- `price`：价格最便宜

::: tip 默认行为

不写 `provider` 字段时，OpenRouter 用 **load balancer** 自动选——通常足够好。

:::

## 流式响应

```python
stream = client.chat.completions.create(
    model="anthropic/claude-sonnet-4.6",
    messages=[...],
    stream=True,
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

API 完全 OpenAI 兼容——所有用 OpenAI 流式代码可直接用。

## Function Calling

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "...",
            "parameters": {...},
        },
    }
]

response = client.chat.completions.create(
    model="anthropic/claude-sonnet-4.6",
    messages=[{"role": "user", "content": "上海多少度？"}],
    tools=tools,
    tool_choice="auto",
)
```

**注意**：

- OpenRouter 把 Anthropic / Google 等的 tool 格式自动转 OpenAI 兼容
- 部分模型 strict mode / 复杂 schema 表现不一致
- 测试时多家对比

## 多模态：图

```python
response = client.chat.completions.create(
    model="openai/gpt-4o",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "这图是什么"},
                {"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}},
            ],
        }
    ],
)
```

支持图的模型：所有 GPT-4o / Claude 3+ / Gemini 系列 / Llama Vision。

## Headers 控制

OpenRouter 支持额外 header 控制行为：

```python
response = client.chat.completions.create(
    model="openai/gpt-5",
    messages=[...],
    extra_headers={
        "HTTP-Referer": "https://my-app.com",   # 出现在 Activity 面板
        "X-Title": "My App",                      # 应用名
    },
)
```

这两个 header 让 OpenRouter Activity 面板显示来源——团队场景便于追踪。

## 大陆访问

### 方案 1：直连（部分时间可达）

`openrouter.ai` 在大陆访问视网络状况波动——多数运营商可达，移动有时被墙。

### 方案 2：Cloudflare Worker 代理

```js
// worker.js
export default {
  async fetch(req) {
    const url = new URL(req.url);
    url.host = "openrouter.ai";
    return fetch(url, req);
  },
};
```

部署到你的 Cloudflare 账号，得到 `https://your-worker.workers.dev` 当 base_url。

### 方案 3：自建 HTTP 反代

nginx / Caddy 在境外 VPS 反代 openrouter.ai。

::: tip 信用卡支付

OpenRouter 支持：

- Stripe（Visa / Mastercard / Discover / AmEx）
- Crypto（BTC / ETH / USDC 等）

国内卡支持有限，**推荐**：

- 虚拟卡（WildCard / Nobepay）
- 或用 crypto 充值

:::

## 与官方 API 价格对比

OpenRouter 加 **10-30%** 中间费。例：

| Model | 官方价 | OpenRouter | 加价 |
| --- | --- | --- | --- |
| Claude Sonnet 4.6 输入 | $3/M | $3.30/M | +10% |
| GPT-5 输入 | $5/M | $5.50/M | +10% |
| Gemini 2.5 Flash 输入 | $0.30/M | $0.36/M | +20% |
| DeepSeek R1 输入 | $0.27/M | $0.30/M | +11% |

部分模型加价更高（小厂模型）。具体看 [openrouter.ai/models](https://openrouter.ai/models) 实时显示。

## 数据隐私设置

[Settings > Privacy](https://openrouter.ai/settings/privacy) 控制：

| 选项 | 默认 | 建议 |
| --- | --- | --- |
| Allow logging | ✓ | 商业项目关 |
| Allow training（每家厂商单独） | ✗ | 保持关 |
| Allow free model usage | ✓ | 商业项目关（free model 通常允许训练） |

OpenRouter 本身**默认不留数据**，但部分上游 provider 可能留——通过 OR 设置统一管理。

## Activity / 监控

[openrouter.ai/activity](https://openrouter.ai/activity)：

- 每次请求记 token / latency / cost / provider
- 按 model / app 维度统计
- 导出 CSV / JSON

用于：

- 监控成本
- 调试延迟问题
- 对比 model 选型

## 下一步

- [指南](./guide-line) —— 高级路由 / fallback / 自定义参数 / 与 Claude Code 集成
- [参考](./reference) —— 模型 ID 全表 / API schema / 价格 / Provider 列表
