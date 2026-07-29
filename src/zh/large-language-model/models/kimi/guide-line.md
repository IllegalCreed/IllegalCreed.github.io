---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Kimi 开放平台官方文档（platform.kimi.ai/docs）+ Kimi K2 开源仓库编写，对照 2026-07-27 状态

## 速查

- **Function Calling**：`tools`（JSON Schema）+ `tool_choice`（`auto` / `none` / `required` / named），原生支持并行 `tool_calls`、流式工具调用
- **工具结果回传**：先 `messages.append(choice.message)` 再 `role:'tool'` + 匹配 `tool_call_id`，否则报 `tool_call_id not found`
- **流式工具调用累积**：按 `delta.tool_calls[].index` 分桶，首个 chunk 带 `id` + `function.name`，后续仅追加 `function.arguments`
- **Partial Mode（Prefill）**：最后一条 assistant 消息加 `partial:true` 提供输出前缀；**与 `response_format:json_object` 互斥**
- **Preserved Thinking**：`thinking.keep='all'` 跨轮次保留 `reasoning_content`（多步 Agent 必备），`max_tokens≥16000` + stream
- **kimi-k3 推理深度**：顶层 `reasoning_effort=low/high/max`（默认 `max`，思考常开，**不支持 `thinking` 参数**）
- **Dynamic Tool Loading**：`KimiK3DynamicToolMessage`（`role=system`，无 `content`，带 `tools`）在对话中途按需注入工具
- **Context Caching**：`prompt_cache_key` 复用前缀，命中返回 `cached_tokens`，长 system prompt / 长文档重复场景降本降延迟
- **结构化输出**：`response_format: text | json_object | json_schema`（`json_schema` 严格模式按 MFJS 规范）
- **工具命名正则**：`^[a-zA-Z_][a-zA-Z0-9-_]{2,63}$`；参数 JSON Schema，`type` 固定 `object`
- **新参数**：`max_completion_tokens`（旧 `max_tokens` 已废弃）

## Function Calling：完整工具调用循环

工具调用走 `tool_calls` 循环而非已废弃的 `function_call`：

```python
tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "查询某城市当前天气",
        "parameters": {
            "type": "object",
            "properties": {"city": {"type": "string"}},
            "required": ["city"],
        },
    },
}]

messages = [{"role": "user", "content": "上海现在多少度？"}]

while True:
    resp = client.chat.completions.create(
        model="kimi-k3",
        messages=messages,
        tools=tools,
        tool_choice="auto",
    )
    msg = resp.choices[0].message

    # 关键：先 append assistant 消息（即使含 tool_calls）
    messages.append(msg.model_dump())

    if resp.choices[0].finish_reason != "tool_calls":
        break

    # 逐个 tool_call 执行并回传
    for tc in msg.tool_calls:
        result = call_get_weather(json.loads(tc.function.arguments))
        messages.append({
            "role": "tool",
            "tool_call_id": tc.id,    # 必须匹配
            "content": str(result),
        })

print(messages[-1]["content"])
```

**关键点**

- **必须 append 中间的 assistant（tool_calls）消息**：直接发 `role:'tool'` 会报 `tool_call_id not found`
- **原生支持并行**：一次返回多个独立 `tool_calls`，逐个执行后回传
- **降低 token 消耗**：相比已废弃的 `function_call`，`tool_calls` 更省

## tool_choice 取值

| 值 | 行为 |
| --- | --- |
| `auto`（默认） | 模型自行决定是否调用工具 |
| `none` | 强制不调用工具 |
| `required` | 强制至少调用一个工具 |
| `{"type":"function","function":{"name":"xxx"}}` | 强制调用指定工具（named） |

## 流式工具调用：按 index 分桶

并行 `tool_calls` 增量到达顺序不定，必须按 `index` 累积：

```python
buckets = {}  # index -> {id, name, arguments}

stream = client.chat.completions.create(
    model="kimi-k3",
    messages=messages,
    tools=tools,
    stream=True,
)

for chunk in stream:
    delta = chunk.choices[0].delta
    if not delta.tool_calls:
        continue
    for tc in delta.tool_calls:
        b = buckets.setdefault(tc.index, {"arguments": ""})
        if tc.id:
            b["id"] = tc.id
        if tc.function and tc.function.name:
            b["name"] = tc.function.name
        if tc.function and tc.function.arguments:
            b["arguments"] += tc.function.arguments

# 最终：每个 bucket 是一个完整的 tool_call
```

> 不按 index 累积会错乱拼接——并行 tool_calls 增量到达顺序不定。

## Preserved Thinking：跨轮次保留推理链

多步 Agent 任务的关键能力——历史轮的 `reasoning_content` 不丢，模型可在前一轮的思考基础上续推：

```python
client.chat.completions.create(
    model="kimi-k3",                    # 或 kimi-k2.6
    messages=messages,
    extra_body={"thinking": {"keep": "all"}},  # Preserved Thinking
    max_completion_tokens=16000,        # 多步工具任务建议 ≥ 16000
    stream=True,                        # 长输出务必流式
)
```

> `reasoning_content` 与 `content` 共享 `max_completion_tokens` 预算，token 不足会同时截断推理与答案——按任务复杂度给足。

## Partial Mode（Prefill）：续写前缀

在最后一条 assistant 消息上设 `partial:true` 提供输出前缀，模型从此续写。常用于强制 JSON 起始符 / 代码块起始：

```python
messages = [
    {"role": "user", "content": "列出 3 个 React Hooks，返回 JSON 数组"},
    {"role": "assistant", "content": "```json\n[", "partial": True},
]

client.chat.completions.create(
    model="kimi-k3",
    messages=messages,
)
```

**红线**：**Partial Mode 与 `response_format:{type:'json_object'}` 不可同用**——官方明确警告禁止组合，会导致输出异常。要么用 `partial:true` 起始 `{` 续写，要么用 `json_object` 强制 JSON，不可叠加。

## Dynamic Tool Loading：按需注入工具

工具数量多时，一次性塞入几十上百个工具定义会挤占上下文并降低选择准确度。Kimi 提供 `KimiK3DynamicToolMessage` 在对话中途按需注入：

```python
messages = [
    {"role": "user", "content": "我想订机票"},
    # 中途按上下文动态加载「订机票」相关工具
    {
        "role": "system",
        # 注意：无 content 字段，仅带 tools
        "tools": [flight_search_tool, flight_book_tool],
    },
]
```

`KimiK3DynamicToolMessage` 的结构：`role=system`、**无 `content`**、带 `tools` 数组。

## Context Caching：长前缀降本

重复传长 system prompt / 长文档前缀时，用 `prompt_cache_key` 命中缓存：

```python
import uuid

cache_key = f"user-{uid}-doc-{doc_id}"   # 相同 key 命中

client.chat.completions.create(
    model="kimi-k3",
    messages=messages,
    extra_body={"prompt_cache_key": cache_key},
)

# usage 返回：
# { "prompt_tokens": 10000, "cached_tokens": 9800, "completion_tokens": 200 }
# cached_tokens 按缓存价计费（显著低于普通 prompt_tokens）
```

**适合**

- 长 system prompt（项目说明、角色定义 > 1024 tokens）
- 重复引用同一份长文档（法律 / 论文 / 代码仓库）
- 多轮对话中前缀稳定不变

## 结构化输出：response_format

| 模式 | 用法 |
| --- | --- |
| `text`（默认） | 普通文本输出 |
| `json_object` | 强制输出合法 JSON（不可与 Partial Mode 同用） |
| `json_schema` | 按 MFJS 规范结构化输出，`strict:true` 严格匹配 schema |

```python
response = client.chat.completions.create(
    model="kimi-k3",
    messages=messages,
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "user_profile",
            "strict": True,
            "schema": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "age": {"type": "integer"},
                },
                "required": ["name", "age"],
            },
        },
    },
)
```

## 模型选型按场景

```
你的任务
   ↓
[旗舰深度推理/长上下文/原生视觉？]
   │
   ├─ 是 → 上下文 > 256K？
   │       ├─ 是 → kimi-k3（1M）
   │       └─ 否 → kimi-k3（reasoning_effort=low 降延迟）
   │
   ├─ [纯编程任务？]
   │       ├─ 长上下文/复杂 → kimi-k2.7-code
   │       └─ 短上下文/重吞吐 → kimi-k2.7-code-highspeed（180 tok/s）
   │
   └─ [通用多模态对话？] → kimi-k2.6（256K，视觉+视频，thinking 可开关）
```

> 简单任务用 kimi-k3 时设 `reasoning_effort="low"` 可大幅降延迟与 token 消耗；编程任务用专用模型比通用模型更稳。

## 反模式（避坑）

- **对 kimi-k3 传 `thinking` 参数**：kimi-k3 不支持，传了会报错；推理深度只能用 `reasoning_effort`（low/high/max）
- **Partial Mode 与 `response_format:json_object` 同用**：官方明确禁止组合，会导致输出异常；要么 partial 起始 `{` 续写，要么 json_object 强制 JSON
- **对 kimi-k2.7-code 传 `thinking.type='disabled'` 或改 `temperature`**：该模型思考始终开启（仅接受 `enabled`）、温度不可修改，传入会直接报错
- **用 `max_tokens` 而非 `max_completion_tokens`**：`max_tokens` 已废弃，k3 默认上限 131072、最高 1048576
- **把 `thinking.keep` 当成控制当前轮是否思考的开关**：`thinking.keep` 仅影响历史轮 `reasoning_content` 是否保留，当前轮是否思考由 `thinking.type`（或 k3 的 `reasoning_effort`）控制
- **tool 结果消息不 append 中间的 `assistant(tool_calls)` 消息**：直接发 `role:'tool'` 会报 `tool_call_id not found`
- **认为长上下文 = 模型可无限记住一切**：即便 kimi-k3 支持 1M tokens，超出上下文仍截断；输入越长延迟 / 成本越高
- **混淆 Kimi K2 的两个版本**：`Kimi-K2-Base` 是基座（供微调）、`Kimi-K2-Instruct` 是后训练版（开箱即用、非长思考 reflex 级）；直接用 Base 做对话效果差
- **把 200 万字长上下文当 API 默认能力**：200 万字（约 250 万 token）是 Kimi 智能助手产品层能力；API kimi-k3 上限 1M tokens、K2 系列 128K/256K
- **依赖 `max_tokens` 截断控制推理**：思考模型 `reasoning_content` 与 `content` 共享预算，token 不足会同时截断；按任务复杂度给足（多步工具 ≥ 16000）

## 国产大模型对比定位

| 模型 | 起家优势 | 典型场景 |
| --- | --- | --- |
| **Kimi** | 超长上下文 / 中文写作 | 长文档分析、中文写作（AI 味最低）、Agent |
| **DeepSeek** | 编程调试 / 性价比 | 代码生成、调试、低成本生产 |
| **通义千问** | Arena 代码榜国产前列 | 综合编码、企业服务 |
| **文心一言** | 1M+ 上下文 / 合规 | 政企合规、中文搜索 |
| **智谱 GLM** | 综合均衡 / 企业级 | 企业级 API、生态完整 |

> 国产对比结论来自第三方 2026 年评测，能力数值随版本快速变化仅供参考。

## 下一步

- [参考](./reference.md)：完整模型 ID 表、API 字段清单、版本变更、官方资源
