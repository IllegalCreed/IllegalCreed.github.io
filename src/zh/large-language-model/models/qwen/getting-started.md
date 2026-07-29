---
layout: doc
outline: [2, 3]
---

# 入门

> 基于阿里云百炼帮助中心（help.aliyun.com/zh/model-studio）+ Qwen3 官方博客（qwenlm.github.io/blog/qwen3）编写，对照 2026 年 Qwen3.7 系列 API 行为

## 速查

- **首选端点**：百炼 OpenAI 兼容 `compatible-mode/v1/chat/completions`，迁移成本接近 0
- **API Key**：环境变量 `DASHSCOPE_API_KEY` 注入，**绝不硬编码**
- **鉴权**：HTTP `Authorization: Bearer $DASHSCOPE_API_KEY`
- **base_url**：`https://dashscope.aliyuncs.com/compatible-mode/v1`（OpenAI SDK 直接传）
- **思考模式参数（放 extra_body）**：`enable_thinking`（bool 总开关）/ `thinking_budget`（int token 上限）
- **思考模式推荐采样**：`temperature=0.6 / top_p=0.95 / top_k=20`；**严禁 `temperature=0`**（会卡死）
- **非思考模式**：`temperature=0.7`（默认）
- **关键返回字段**：`reasoning_content`（思维链）/ `content`（最终回答）
- **长度限制**：用 `max_completion_tokens`（含思维链 + 回答），**勿用 `max_tokens`**（仅回答，即将废弃）
- **流式默认开**：`stream=true` + `stream_options.include_usage=true`
- **多轮保留思维链**：`preserve_thinking=true`
- **/think /no_think**：在 prompt 里逐轮软切换思考模式
- **Python SDK 调用**：`pip install openai`，`enable_thinking` 等非标准参数**必须放 `extra_body`**
- **DashScope 原生端点**：仅当需要全参数集（`result_format` 等）才用 `/api/v1/services/aigc/text-generation/generation`

## 模型矩阵与上下文梯度

| 梯度 | 模型 | 上下文 |
| --- | --- | --- |
| 边缘 | Qwen3-0.6B / 1.7B / 4B | 32K |
| 中阶 Dense | Qwen3-8B / 14B / 32B | 128K |
| MoE 性价比 | Qwen3-30B-A3B | 128K |
| MoE 旗舰 | Qwen3-235B-A22B | 128K |
| 编程旗舰 | Qwen3-Coder-480B-A35B | 256K（YaRN→1M） |
| 闭源旗舰 | qwen3.7-max / plus / flash | 256K（按订阅） |

> 命名规则：`Qwen3-{总参}B-A{激活}B` 中 `A` 后的数字是 MoE 实际激活参数（如 235B-A22B = 总参 2350 亿 / 激活 220 亿）。

## 准备：百炼 API Key 与 SDK

```bash
# 1. 登录阿里云百炼控制台 → 模型广场 → 开通 → 申请 API Key
#    https://bailian.console.aliyun.com/

# 2. 设置环境变量（绝不硬编码到代码）
export DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx

# 3. 安装 SDK：直接用 OpenAI SDK 即可（百炼 OpenAI 兼容）
pip install openai
npm install openai
```

> 国际站与国内站 API Key **不通用**；国际站用 `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`，国内用 `https://dashscope.aliyuncs.com/compatible-mode/v1`。

## 第一次调用：Python（OpenAI 兼容）

```python
import os
from openai import OpenAI

# base_url 指向百炼兼容端点，api_key 走环境变量
client = OpenAI(
    api_key=os.environ["DASHSCOPE_API_KEY"],
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

# 最简单的非思考调用
resp = client.chat.completions.create(
    model="qwen-plus",  # 或 qwen3.7-plus / qwen-max / qwen3-235b-a22b
    messages=[{"role": "user", "content": "用一句话介绍 Qwen3"}],
)
print(resp.choices[0].message.content)
```

## Node.js 调用

```ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY!,
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

const resp = await client.chat.completions.create({
  model: "qwen-plus",
  messages: [{ role: "user", content: "用一句话介绍 Qwen3" }],
});
console.log(resp.choices[0].message.content);
```

## curl 直调

```bash
curl -s https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions \
  -H "Authorization: Bearer $DASHSCOPE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen-plus",
    "messages": [{"role": "user", "content": "用一句话介绍 Qwen3"}]
  }'
```

> curl 调用时，`enable_thinking` 等参数直接放请求体**顶层**；OpenAI SDK 调用时必须放 `extra_body`（详见 [核心指南](./guide-line.md)）。

## 思考模式：第一次开 thinking

```python
resp = client.chat.completions.create(
    model="qwen3-235b-a22b-thinking-2507",  # thinking 子模型
    messages=[{"role": "user", "content": "证明 √2 是无理数"}],
    # 思考模式必走 extra_body（非 OpenAI 标准参数）
    extra_body={
        "enable_thinking": True,        # 总开关
        "thinking_budget": 4096,        # 思维链 token 上限
        "top_k": 20,                    # 配合思考模式采样
    },
    temperature=0.6,                    # 官方推荐（思考模式）
    top_p=0.95,
    max_completion_tokens=8192,         # 含思维链+回答总长（勿用 max_tokens）
)

# 思维链与最终回答分两个字段
print("思维链：", resp.choices[0].message.reasoning_content)
print("回答：", resp.choices[0].message.content)
```

> 严禁思考模式用 `temperature=0` 贪婪解码——会导致思维链重复、卡死，官方明确不推荐。

## /think 与 /no_think：逐轮软切换

同一个 thinking 子模型里，可在 prompt 里加指令实现**逐轮**思考开关：

```python
messages = [
    {"role": "user", "content": "/think 详细分析这道数学题"},     # 本轮开思考
    {"role": "assistant", "content": "..."},
    {"role": "user", "content": "/no_think 简单翻译：hello"},    # 本轮关思考
]
```

> 软切换适合「同一会话混合简单 / 复杂任务」场景，避免无脑开 thinking 浪费 token。

## 流式输出（默认开）

```python
stream = client.chat.completions.create(
    model="qwen-plus",
    messages=[{"role": "user", "content": "讲个 200 字的故事"}],
    stream=True,
    stream_options={"include_usage": True},  # 末包拿到 token 用量
)
for chunk in stream:
    delta = chunk.choices[0].delta
    if delta and delta.content:
        print(delta.content, end="", flush=True)
# 末包含 usage：prompt_tokens / completion_tokens / total_tokens
```

> 思考模式长输出场景**必须用流式**——避免网关超时，且能边推理边显示思维链。

## 多轮对话：preserve_thinking

```python
# 多轮对话默认会丢掉历史 reasoning_content，导致每轮从零思考
# preserve_thinking=true 保留历史思维链作为上下文
messages = [...]
resp = client.chat.completions.create(
    model="qwen3-235b-a22b-thinking-2507",
    messages=messages,
    extra_body={"enable_thinking": True, "preserve_thinking": True},
)
```

## Function Calling：基础

```python
tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",  # 仅允许字母/数字/下划线/短划线，≤64 token
        "description": "获取城市天气",
        "parameters": {
            "type": "object",
            "properties": {"city": {"type": "string"}},
            "required": ["city"],
        },
    },
}]

resp = client.chat.completions.create(
    model="qwen-plus",
    messages=[{"role": "user", "content": "北京天气如何"}],
    tools=tools,
)
# tool_calls 在 resp.choices[0].message.tool_calls
```

> 工具名包含中文 / 空格 / 点号会被百炼拒绝。Agent 场景建议直接用 [Qwen-Agent 框架](./guide-line.md#qwen-agent-框架)。

## 下一步

- [核心 API 与思考模式](./guide-line.md)：模型选型 + thinking 参数 + Qwen-Agent + MCP + 反模式
- [参考](./reference.md)：完整端点对照表 + 参数速查 + 模型 ID 速查 + 官方资源
