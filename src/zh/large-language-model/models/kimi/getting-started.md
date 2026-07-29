---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Kimi 开放平台官方文档（platform.kimi.ai/docs）+ Kimi K2 开源仓库（github.com/moonshotai/Kimi-K2）编写，对照 2026-07-27 状态（旗舰 kimi-k3 已于 2026-07-17 发布）

## 速查

- **三个层次**：Kimi 智能助手产品（C 端，200 万字）/ Kimi 开放平台 API（开发者，OpenAI 兼容）/ Kimi K2 开源（Modified MIT）
- **API Base URL**：`https://api.moonshot.ai/v1`；认证：`Authorization: Bearer $MOONSHOT_API_KEY`
- **OpenAI SDK 直接复用**：`base_url` + `api_key` 改两行即可，扩展参数（`thinking`）走 `extra_body`
- **主力模型 ID**：`kimi-k3`（旗舰 1M）/ `kimi-k2.6`（通用 256K）/ `kimi-k2.7-code[-highspeed]`（编程 256K）
- **思考模型**：kimi-k3 用顶层 `reasoning_effort=low/high/max`（默认 `max`，思考常开）；k2.6/k2.5 用 `thinking.type=enabled/disabled`
- **Preserved Thinking**：`thinking.keep='all'` 让历史轮的 `reasoning_content` 跨轮次保留（多步 Agent 场景）
- **Chat 端点**：`POST /v1/chat/completions`（OpenAI 兼容，支持 stream / tools / response_format）
- **Files API**：`/v1/files` 上传、消息里用 `ms://<file_id>` 引用（长文档必备）
- **Context Caching**：`prompt_cache_key` 复用前缀，命中返回 `cached_tokens`（按缓存价计费）
- **多模态**：`messages.content` 数组支持 `text` / `image_url` / `video_url`，URL 可为 base64 或 `ms://`
- **结构化输出**：`response_format: text | json_object | json_schema`（`json_schema` 严格模式按 MFJS 规范）
- **新参数名**：`max_completion_tokens`（旧 `max_tokens` 已废弃，k3 默认上限 131072、最高 1048576）

## 三个层次：先分清「是哪个 Kimi」

| 层次 | 面向 | 入口 | 上下文 |
| --- | --- | --- | --- |
| **Kimi 智能助手产品** | C 端用户 | kimi.com / kimi.moonshot.cn | **200 万字**长文档分析 |
| **Kimi 开放平台 API** | 开发者 | platform.kimi.ai | 旗舰 kimi-k3 = **1M tokens** |
| **Kimi K2 开源模型** | 自部署 / 微调 | HuggingFace moonshotai | K2 = 128K（开源版） |

> 200 万字 ≠ API 默认能力。200 万字（约 250 万 token）是产品层接入检索/无损压缩后的能力，API 模型 kimi-k3 上限 1M tokens、K2 系列 128K/256K。

## 选哪个模型

简单决策表：

| 任务 | 选 |
| --- | --- |
| 旗舰深度推理 / 长上下文 / 原生视觉 | **kimi-k3**（1M，思考常开） |
| 纯编程任务（长指令遵循更稳） | **kimi-k2.7-code** |
| 编程高速版（180 tok/s，短上下文 260 tok/s） | **kimi-k2.7-code-highspeed** |
| 通用多模态对话（图/视频，思考可开关） | **kimi-k2.6** |
| 自部署 / 商用微调 | **Kimi-K2-Instruct**（开源） |
| 旧 `moonshot-v1-*` 项目维护 | 建议迁 kimi-k3 |

> 选错直接拖垮成本与体验：kimi-k3 单价高于 k2.6，简单任务用 low `reasoning_effort` 可降延迟；编程任务用专用模型比通用模型更稳。

## 第一次 API 调用

**Python（OpenAI SDK）**：

```python
# pip install openai
from openai import OpenAI

client = OpenAI(
    api_key="your-moonshot-api-key",          # 或环境变量 MOONSHOT_API_KEY
    base_url="https://api.moonshot.ai/v1",    # 关键：换成 Moonshot 端点
)

response = client.chat.completions.create(
    model="kimi-k3",
    messages=[
        {"role": "system", "content": "你是简洁的中文写作助手。"},
        {"role": "user", "content": "用 100 字介绍 Kimi 的超长上下文。"},
    ],
)

print(response.choices[0].message.content)
print(response.usage)
```

**TypeScript（OpenAI SDK）**：

```ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.MOONSHOT_API_KEY,
  baseURL: "https://api.moonshot.ai/v1",
});

const response = await client.chat.completions.create({
  model: "kimi-k3",
  messages: [{ role: "user", content: "用 100 字介绍 Kimi 的超长上下文。" }],
});

console.log(response.choices[0].message.content);
```

**curl**：

```bash
curl https://api.moonshot.ai/v1/chat/completions \
  -H "Authorization: Bearer $MOONSHOT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "kimi-k3",
    "messages": [{"role":"user","content":"Hello Kimi!"}]
  }'
```

## 流式响应

```python
stream = client.chat.completions.create(
    model="kimi-k3",
    messages=[{"role": "user", "content": "解释 MoE 架构的稀疏激活"}],
    stream=True,
)
for chunk in stream:
    delta = chunk.choices[0].delta.content or ""
    print(delta, end="", flush=True)
```

> 复杂 Agent 任务（多步工具调用 + 长输出）务必开 stream：单请求超时 2 小时会返回 504，流式避免大响应超时。

## 思考模型（reasoning）

**kimi-k3**：思考始终开启，用顶层 `reasoning_effort` 调节深度：

```python
response = client.chat.completions.create(
    model="kimi-k3",
    reasoning_effort="low",   # low / high / max（默认 max）
    messages=[{"role": "user", "content": "证明根号 2 是无理数"}],
)

# reasoning_content 在 content 之前输出
print(response.choices[0].message.reasoning_content)  # 思考链
print(response.choices[0].message.content)            # 最终答案
```

**k2.6 / k2.5**：用 `thinking.type` 开关：

```python
response = client.chat.completions.create(
    model="kimi-k2.6",
    extra_body={"thinking": {"type": "enabled"}},   # 经 extra_body 传递
    messages=[{"role": "user", "content": "分析这段代码的复杂度"}],
)
```

> **kimi-k3 不支持 `thinking` 参数**，传了会报错；推理深度只能用 `reasoning_effort`。

## 多轮对话

把历史 `messages` 一起传（与 OpenAI 完全一致）：

```python
messages = [
    {"role": "user", "content": "用 Python 写个 fibonacci"},
    {"role": "assistant", "content": "..."},
    {"role": "user", "content": "改成 iterative 的"},
]

response = client.chat.completions.create(
    model="kimi-k3",
    messages=messages,
)
```

::: tip 多轮成本

每轮把整段历史发回——长对话 token 累积。Kimi 以超长上下文见长，但重复传 200 万字前缀成本极高。解决：

- 用 `prompt_cache_key` 命中前缀缓存（`cached_tokens` 按缓存价计费）
- 启用 Preserved Thinking（`thinking.keep='all'`）让推理链跨轮延续，避免重新思考
- 用 Files API（`ms://<file_id>`）引用长文档，避免每次重传

:::

## 多模态：发图 / 视频

```python
response = client.chat.completions.create(
    model="kimi-k2.6",   # 多模态主力
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "描述这张图"},
            {"type": "image_url", "image_url": {"url": "https://example.com/x.png"}},
        ],
    }],
)
```

URL 也支持 base64 data URI：

```python
{"type": "image_url", "image_url": {"url": "data:image/png;base64,<BASE64>"}}
```

## 长文档：Files API

```python
# 1. 上传文件
file = client.files.create(
    file=open("long_doc.pdf", "rb"),
    purpose="file-extract",
)
# file.id 即可被消息引用

# 2. 在消息里引用
response = client.chat.completions.create(
    model="kimi-k3",
    messages=[{
        "role": "user",
        "content": [
            {"type": "file", "file_url": {"url": f"ms://{file.id}"}},
            {"type": "text", "text": "总结这份文档的核心结论"},
        ],
    }],
)
```

端点：`POST /v1/files`（上传）/ `GET /v1/files`（列表）/ `GET /v1/files/{id}`（信息）/ `DELETE /v1/files/{id}`（删除）/ `GET /v1/files/{id}/content`（内容）。

## 下一步

- [指南](./guide-line.md)：Function Calling / Partial Mode / Preserved Thinking / Dynamic Tool Loading / Context Caching 深度用法
- [参考](./reference.md)：完整模型 ID 表、API 字段清单、版本变更、官方资源
