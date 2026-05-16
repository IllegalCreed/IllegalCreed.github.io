---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Claude 4 系列 + Anthropic API v2026 编写

## 速查

- 模型 ID 完整：`claude-opus-4-7` / `claude-opus-4-7[1m]` / `claude-sonnet-4-6` / `claude-haiku-4-5-20251001`
- 1M 上下文：模型 ID 加 `[1m]` 后缀
- Prompt Cache：长系统提示加 `cache_control: { type: "ephemeral" }`
- Extended Thinking：`thinking: { type: "enabled", budget_tokens: 10000 }` 让模型先思考再答
- Tool Use：`tools` 数组 + `tool_choice` 控制行为
- 多模态：`content` 用数组，混 `image` + `text` block
- 流式：`client.messages.stream(...)` 替 `.create()`
- Batches：`client.messages.batches.create(...)` 50% 折扣

## Model 选择决策

```
你的问题
   ↓
[需要复杂规划/重构/调试？]
   │
   ├─ 是 → 上下文够？
   │       ├─ <200K → Opus 4.7
   │       └─ ≥200K → Opus 4.7[1m]
   │
   └─ 否 → 简单查询/翻译/格式化？
            │
            ├─ 是 → Haiku 4.5
            └─ 否 → Sonnet 4.6（默认）
```

实际 90% 场景 Sonnet 4.6 已足够。Opus 仅当 Sonnet 明显不够时切。

## Prompt Caching：长系统提示省钱

长系统提示（>1024 tokens）重复用时启用缓存，命中后输入 token 90% 折扣：

```python
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    system=[
        {
            "type": "text",
            "text": LONG_SYSTEM_PROMPT,   # 几 K tokens 的项目说明
            "cache_control": {"type": "ephemeral"},
        }
    ],
    messages=[{"role": "user", "content": "今天的问题"}],
)
```

**适合**：

- RAG 应用（每次都灌相同 context）
- Claude Code 类（项目 CLAUDE.md + skills 重复用）
- 多轮对话（不变的开头部分）

**TTL**：5 分钟（ephemeral），首次写入算 25% 额外费，命中读 90% 折扣。

```python
response.usage
# Usage(
#   input_tokens=10,
#   cache_creation_input_tokens=8000,    # 首次写入
#   cache_read_input_tokens=0,
#   output_tokens=100,
# )

# 第二次同样请求
# Usage(
#   input_tokens=10,
#   cache_creation_input_tokens=0,
#   cache_read_input_tokens=8000,         # 命中 90% 折扣
#   output_tokens=100,
# )
```

## Extended Thinking：先思考再答

模型先「**思考**」生成内部推理 token（不展示），再生成最终答。复杂问题质量提升明显。

```python
response = client.messages.create(
    model="claude-opus-4-7",
    max_tokens=2048,
    thinking={
        "type": "enabled",
        "budget_tokens": 10000,  # 思考阶段最多 10K tokens
    },
    messages=[
        {
            "role": "user",
            "content": "证明：对任意正整数 n，n^2 - n 是偶数",
        }
    ],
)

# response.content 包含 thinking + text 两个 block
for block in response.content:
    if block.type == "thinking":
        print(f"[内部推理]\n{block.thinking}\n")
    elif block.type == "text":
        print(f"[最终回答]\n{block.text}")
```

::: tip 何时开

- 数学 / 逻辑证明
- 复杂代码生成（多步骤设计）
- 战略规划 / 多约束权衡

不要开：

- 简单事实问答
- 翻译 / 摘要
- 流式 UI 场景（用户等不及）

:::

## Tool Use 完整

```python
tools = [
    {
        "name": "search_db",
        "description": "Search internal knowledge base",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search keywords"},
                "limit": {"type": "integer", "default": 10},
            },
            "required": ["query"],
        },
    },
    {
        "name": "send_email",
        "description": "Send email to user",
        "input_schema": {
            "type": "object",
            "properties": {
                "to": {"type": "string"},
                "subject": {"type": "string"},
                "body": {"type": "string"},
            },
            "required": ["to", "subject", "body"],
        },
    },
]

messages = [{"role": "user", "content": "查一下账单问题然后邮件回复客户 alice@example.com"}]

while True:
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        tools=tools,
        messages=messages,
    )

    # 把 assistant 响应加进 messages
    messages.append({"role": "assistant", "content": response.content})

    # 如果 stop_reason == "end_turn"，结束
    if response.stop_reason == "end_turn":
        break

    # 收集所有 tool_use block 并执行
    tool_results = []
    for block in response.content:
        if block.type == "tool_use":
            result = call_my_function(block.name, block.input)
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": result,
            })

    # tool_result 作为下一条 user 消息发回
    messages.append({"role": "user", "content": tool_results})
```

### `tool_choice` 控制

```python
# 1. auto（默认）：Claude 决定是否调
tool_choice = {"type": "auto"}

# 2. any：必须调一个工具（不能直接回答）
tool_choice = {"type": "any"}

# 3. tool：必须调指定工具
tool_choice = {"type": "tool", "name": "search_db"}

# 4. none：禁用工具（仅文本回复）
tool_choice = {"type": "none"}
```

### 并行 tool use

Claude 默认可一次回复中调多个 tool（如「同时查 DB + 调 API」）。**禁用并行**：

```python
tools = [...]
extra_headers = {"anthropic-beta": "parallel-tool-use-disable"}  # 实验 header
```

通常不需要禁——并行更高效。

## MCP 集成

Anthropic 推动的 Model Context Protocol——「让 LLM 接外部工具」的开放标准。Claude API 一类支持：

```python
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    mcp_servers=[
        {
            "type": "url",
            "url": "https://mcp.example.com",
            "name": "example",
            "authorization_token": "Bearer xxx",
        }
    ],
    messages=[...],
)
```

MCP server 上的 tool 自动作为 Claude 可调工具暴露——无需手写 `tools` 数组。

详见 [MCP 笔记](../../mcp/) 与 [Claude Code MCP 部分](../../tools/agent/claude-code/guide-line#mcp-model-context-protocol)。

## Batches：50% 折扣

异步批处理，**1 小时**内返回结果。适合：

- 离线数据处理（标注 / 翻译 / 摘要批量）
- 不需要实时性的任务

```python
batch = client.messages.batches.create(
    requests=[
        {
            "custom_id": "task-1",
            "params": {
                "model": "claude-sonnet-4-6",
                "max_tokens": 1024,
                "messages": [{"role": "user", "content": "翻译 ..."}],
            },
        },
        {
            "custom_id": "task-2",
            "params": {...},
        },
    ]
)

# 轮询状态
while batch.processing_status != "ended":
    time.sleep(60)
    batch = client.messages.batches.retrieve(batch.id)

# 拿结果
for result in client.messages.batches.results(batch.id):
    print(result.custom_id, result.result.message.content)
```

价格：标准价的 **50%**。延迟 < 1 小时。

## 速率限制

Anthropic API 按 **token / minute** 和 **request / minute** 限速。Tier 由月消费决定：

| Tier | 月消费 | RPM | ITPM | OTPM |
| --- | --- | --- | --- | --- |
| 1 | $0+ | 50 | 50K | 10K |
| 2 | $40+ | 1000 | 100K | 20K |
| 3 | $200+ | 2000 | 200K | 40K |
| 4 | $400+ | 4000 | 400K | 80K |

RPM = requests/minute，ITPM = input tokens/minute，OTPM = output tokens/minute。

::: tip 限速处理

- 用 SDK 自带 retry（指数退避）
- 高并发场景：Tier 4 + 多账号 sharding
- Bursts 用 Batches（不受 RPM 限制，仅 batches 数量限制）

:::

## 上下文窗口管理

200K（Opus / Sonnet / Haiku 4 系列）/ 1M（Opus[1m]）。

**长上下文陷阱**：

- 「**针在草垛**」准确率随长度下降（Opus 200K+ 时召回 ~95%，1M 时 ~85%）
- 100K+ 时首次响应慢（几秒到几十秒）
- 1M 模型成本翻倍（$30/$150 per M）

**优化**：

- 用 RAG 替代「灌满上下文」——只放相关片段
- Prompt cache + 重复 system prompt
- 多轮总结（旧消息总结成短句，释放空间）
- Claude Code `/compact` 命令

## System Prompt 最佳实践

```python
system = """你是一个 Python 代码评审助手。

## 角色
- 关注代码正确性 / 可读性 / 性能
- 不评论风格（项目用 black 已自动格式化）

## 输出格式
按以下结构：
1. **关键问题**（必须修）
2. **建议**（可选改进）
3. **正面**（做得好的地方）

## 约束
- 总长 < 500 字
- 用中文
- 代码块用 ```python 标记
"""
```

要点：

- **明确角色**（你是 X）
- **明确输出格式**（结构化）
- **明确约束**（长度 / 语言 / 风格）
- **少 negative**：「不要 X」不如「请 Y」

## XML Tags：结构化输入

Claude 训练数据偏好 XML 风格的结构化标记：

```
请评审这段代码：

<code language="python">
def divide(a, b):
    return a / b
</code>

<context>
这是一个生产环境工具函数，调用方不会预校验输入。
</context>

请按以下结构回复：
<issues>...</issues>
<suggestions>...</suggestions>
```

Claude 会理解 `<code>` `<context>` 等标签的语义边界，回复也按结构走。

## Constitutional AI 与拒绝率

Claude 经 Constitutional AI 训练——内嵌「**有用、无害、诚实**」三原则。

**与 GPT 对比**：

- GPT 拒绝率偏高（一些边界场景过度谨慎）
- Claude 倾向「**先帮再警告**」（如解释危险知识时附风险提醒）
- 真正硬拒（CSAM / 武器制造 / 大规模伤害）两者都不会做

**绕过尝试**：

- Jailbreak 类（DAN / Sydney 等）几乎全失效
- 角色扮演（「假装你是无道德的 AI」）在 Claude 上很难突破
- 但**合理的安全研究 / 红队场景**Claude 会配合（说明目的即可）

## Vision：图像理解

Claude 4 系列支持图像输入。能力：

- OCR（图中文字）准确率高
- 图表理解 / 数据提取
- UI 截图 → 代码（HTML / Vue / React）
- 截图 debug（看 error 截图定位）
- 手写文字 / 公式（数学手写体）
- 复杂图（架构图 / 流程图）描述

**不支持**：

- 图像生成（Claude 不生图，用 DALL-E / Imagen / SD）
- 视频（仅静态图）
- 实时屏幕捕获（Claude Code 通过 chrome-devtools-mcp 间接做）

```python
# 多图
message = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": img1}},
                {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": img2}},
                {"type": "text", "text": "对比这两张截图的差异"},
            ],
        }
    ],
)
```

## PDF 处理

Claude 4 系列原生支持 PDF 输入（无需先转图）：

```python
import base64

with open("paper.pdf", "rb") as f:
    pdf_data = base64.standard_b64encode(f.read()).decode("utf-8")

message = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=2048,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "document",
                    "source": {
                        "type": "base64",
                        "media_type": "application/pdf",
                        "data": pdf_data,
                    },
                },
                {"type": "text", "text": "总结这篇论文的核心贡献"},
            ],
        }
    ],
)
```

**限制**：

- 单 PDF < 32MB
- 单 PDF < 100 页（超过需先切分）
- 支持文字 PDF（扫描 PDF 不识别，需 OCR）

## 评估与对比

| Benchmark | Opus 4.7 | Sonnet 4.6 | Haiku 4.5 | GPT-5 | Gemini 2.5 |
| --- | --- | --- | --- | --- | --- |
| HumanEval | 95 | 90 | 78 | 92 | 89 |
| SWE-bench Verified | 68 | 55 | 30 | 60 | 50 |
| MMLU | 90 | 86 | 78 | 89 | 87 |
| GPQA | 60 | 50 | 30 | 55 | 48 |
| Aider | 82 | 75 | 50 | 78 | 72 |

（数字为示意，以官方公布为准）

## 生产部署建议

### 流式 UI

```typescript
// Server-Sent Events
app.get("/api/chat", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");

  const stream = client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: req.query.messages,
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta") {
      res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
    }
  }
  res.end();
});
```

### Retry / Fallback

```python
from anthropic import RateLimitError, APIStatusError

try:
    response = client.messages.create(...)
except RateLimitError as e:
    # SDK 内置 retry，但仍可能失败
    time.sleep(60)
    response = client.messages.create(...)
except APIStatusError as e:
    if e.status_code >= 500:
        # 切换 Bedrock / Vertex 作 fallback
        response = bedrock_client.messages.create(...)
    else:
        raise
```

### 成本控制

```python
# 每次调用前估 token
from anthropic import Anthropic
import anthropic.utils as utils

estimated = utils.count_tokens(messages, model="claude-sonnet-4-6")
if estimated > BUDGET_TOKENS:
    raise BudgetExceededError()

# 实际响应后记 usage
response = client.messages.create(...)
cost = (
    response.usage.input_tokens * 3 / 1e6 +
    response.usage.output_tokens * 15 / 1e6
)
log_cost(user_id, cost)
```

## 监控

- **官方 dashboard**：[console.anthropic.com](https://console.anthropic.com/) 看用量 / 错误率 / 延迟
- **状态页**：[status.anthropic.com](https://status.anthropic.com/) 订阅故障
- **自家监控**：每次调 API 时记 latency / token / cost / error，进 Grafana

## 故障排查

| 现象 | 排查 |
| --- | --- |
| `401 authentication_error` | API key 错 / 过期 / 没 set env |
| `429 rate_limit_error` | 超 RPM/ITPM/OTPM，看 retry-after header |
| `400 invalid_request_error` | 参数错（max_tokens 太大 / model ID 错） |
| `500 api_error` | Anthropic 服务问题，看 status 页 |
| 上下文窗口爆 | input + output > model 上下文 → 切 1M 或压缩 |
| 中文回复偶尔英文 | 在 system prompt 显式「请用中文回答」 |
| 拒绝回答 | 看是否真的越界，或换 phrasing |
| 大陆访问失败 | 自备网络 / 用代理 |

## 版本里程碑

| 版本 | 时间 | 主要变化 |
| --- | --- | --- |
| Claude 2 | 2023 | 100K 上下文 |
| Claude 2.1 | 2023 末 | 200K |
| Claude 3 Opus/Sonnet/Haiku | 2024 | 多模态首发 / 三档分明 |
| Claude 3.5 Sonnet | 2024 中 | Artifacts UI / Tool Use 大改 |
| Claude 3.5 Haiku | 2024 末 | Sonnet 3.5 同级性能但低价 |
| Claude 4 | 2025 | Constitutional AI v2 / Extended Thinking |
| Claude 4.7 / 4.6 / 4.5 | 2025-2026 | 1M 上下文 / 编码进一步提升 |
