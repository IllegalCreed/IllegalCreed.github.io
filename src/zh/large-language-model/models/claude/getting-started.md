---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Claude 4 系列（Opus 4.7 / Sonnet 4.6 / Haiku 4.5）编写

## 三种接入方式

### 1. 网页聊天（claude.ai）

最快上手——浏览器开 [claude.ai](https://claude.ai/)，注册账号即用。

| 套餐 | 价格 | 能力 |
| --- | --- | --- |
| Free | $0 | Sonnet 4.6，每天有限消息数 |
| Pro | $20/月 | 全模型，5x Free 用量 |
| Max | $100-200/月 | 全模型，20x-200x Free 用量 |
| Team | $30/人/月 | Pro + 共享项目 / 管理后台 |
| Enterprise | 联系销售 | SSO / 审计 / SLA |

适合：

- 单纯对话场景
- 非开发者用
- 出差 / 临时用

### 2. API（开发者）

```bash
# 获取 API key：console.anthropic.com
export ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# Python SDK
pip install anthropic

# Node.js SDK
npm install @anthropic-ai/sdk
```

最简调用：

```python
from anthropic import Anthropic

client = Anthropic()  # 自动读 ANTHROPIC_API_KEY 环境变量

message = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "用 Python 写个 quicksort"}
    ],
)

print(message.content[0].text)
```

### 3. Claude Code（CLI 编码助手）

```bash
npm install -g @anthropic-ai/claude-code
claude
```

详见 [Claude Code 笔记](../../tools/agent/claude-code/)。这是与本笔记关系最密切的工具——「Claude 模型 + 文件/Bash/MCP/Skills 系统 + IDE 集成」。

## 选哪个模型？

简单决策表：

| 任务 | 选 |
| --- | --- |
| 复杂规划 / 大项目重构 / 难 debug | **Opus 4.7** |
| 整本仓库塞进上下文 / 长对话 | **Opus 4.7 (1M)** |
| 日常 90% 编码 / 通用问答 | **Sonnet 4.6** |
| 简单 grep / 一行答 / 高并发 | **Haiku 4.5** |
| 实时翻译 / 短回复 | Haiku |
| 涉及图像 / PDF / 截图 | Sonnet 或 Opus（Haiku 多模态弱） |

## 第一次 API 调用

完整 Python 示例：

```python
from anthropic import Anthropic

client = Anthropic()

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    system="你是一个简洁的代码评审助手，回答 < 200 字。",
    messages=[
        {
            "role": "user",
            "content": """
评审这段代码：

def divide(a, b):
    return a / b
            """,
        }
    ],
)

print(response.content[0].text)
print(f"用量: {response.usage}")
```

输出：

```
缺陷：未处理 b=0 / 类型未限制 / 无 docstring。

建议：
def divide(a: float, b: float) -> float:
    if b == 0:
        raise ValueError("Divisor cannot be zero")
    return a / b

用量: Usage(input_tokens=42, output_tokens=68)
```

## Node.js 调用

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const response = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  messages: [{ role: "user", content: "用 TS 写个 debounce" }],
});

console.log(response.content[0].text);
```

## 流式响应

长回复用 stream，逐块拿到结果：

```python
with client.messages.stream(
    model="claude-sonnet-4-6",
    max_tokens=2048,
    messages=[{"role": "user", "content": "解释 React 18 并发模式"}],
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
```

```typescript
const stream = client.messages.stream({
  model: "claude-sonnet-4-6",
  max_tokens: 2048,
  messages: [{ role: "user", content: "解释 React 18 并发模式" }],
});

for await (const event of stream) {
  if (event.type === "content_block_delta") {
    process.stdout.write(event.delta.text);
  }
}
```

## 多模态：发图

```python
import base64

with open("screenshot.png", "rb") as f:
    image_data = base64.standard_b64encode(f.read()).decode("utf-8")

message = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": image_data,
                    },
                },
                {"type": "text", "text": "这截图里是什么错误？"},
            ],
        }
    ],
)

print(message.content[0].text)
```

也支持 URL 引用图（公开 URL）：

```python
{
  "type": "image",
  "source": {"type": "url", "url": "https://example.com/x.png"}
}
```

## 多轮对话

把历史 messages 一起传：

```python
messages = [
    {"role": "user", "content": "用 Python 写个 fibonacci"},
    {"role": "assistant", "content": "..."},  # 上次回复
    {"role": "user", "content": "改成 iterative 的"},
]

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=messages,
)
```

::: tip 多轮成本

每轮把整段历史发回——长对话 token 累积。

解决：

- 用 Prompt Caching（系统提示重复部分缓存）
- 定期总结历史压缩（`/compact` in Claude Code）
- 用更大上下文版本（Opus 1M）

:::

## Tool Use（function calling）

```python
tools = [
    {
        "name": "get_weather",
        "description": "Get current weather for a city",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {"type": "string"},
            },
            "required": ["city"],
        },
    }
]

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    tools=tools,
    messages=[{"role": "user", "content": "上海现在多少度？"}],
)

# Claude 会返回 tool_use 调用
for block in response.content:
    if block.type == "tool_use":
        print(f"调用工具 {block.name}({block.input})")
        # 你实现 get_weather，把结果作为 tool_result 传回
```

详见指南章节「Tool Use」。

## 大陆访问

Claude API 在中国大陆不直接服务。三种方案：

| 方案 | 难度 | 成本 |
| --- | --- | --- |
| 自备代理（梯子） | 低 | 仅代理费 |
| 经由 OpenRouter / Poe / `claude.nekro.ai` | 低 | 加 10-30% 中间费 |
| 部署在 Vercel/Cloudflare Edge 函数转发 | 中 | 服务器费 |
| Amazon Bedrock 香港 / 新加坡 region | 中 | AWS 费用 |

详见 [OpenRouter 笔记](../../tools/other/open-router/)。

## 下一步

- [指南](./guide-line) —— prompt caching / extended thinking / tool use 高级用法
- [参考](./reference) —— API 全字段 / 模型 ID / 价格 / SDK 全平台
- 工具集成：[Claude Code 笔记](../../tools/agent/claude-code/)
