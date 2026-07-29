---
layout: doc
outline: [2, 3]
---

# 核心 API 与最佳实践

> 基于 DeepSeek 官方 API 文档（api-docs.deepseek.com/guides）+ GitHub deepseek-ai/DeepSeek-R1 README 编写，对照 V3.1 / V3.2 / V4 系列

## 速查

- **思考模式硬约束**：thinking 启用时，`temperature` / `top_p` / `presence_penalty` / `frequency_penalty` **全部不生效**（官方仅为兼容旧软件保留入参）
- **R1 推理采样**：`temperature` 0.5–0.7（推荐 0.6）、`top_p` 0.95、**不放 system prompt**（所有指令塞 user prompt）、答案放 `\boxed{}`
- **Context Caching**：默认开启；稳定长上下文放前面、变量放后面；`prompt_cache_hit_tokens` 看命中；约低 98% 成本
- **JSON Output**：`response_format={type: json_object}`；prompt **必须含 'json' 字样**并给结构示例；合理 `max_tokens` 防截断；已知偶发空内容
- **Function Calling**：`tools` 数组（`type=function` + JSON Schema 参数）
- **Strict Function Calling（Beta）**：`/beta` base_url + 每 function `strict: true`；`object` 必须 `additionalProperties:false` 且全部 `required`；不支持 `string` 的 `minLength/maxLength`、`array` 的 `minItems/maxItems`
- **FIM 填空补全**：`POST /completions`（`client.completions.create`）+ `prompt` 前缀 + `suffix` 后缀；**必须 `/beta`**；`max_tokens` **上限 4K**
- **多轮 tool-call**：触发 `tool_calls` 的轮次，其 `reasoning_content` 必须原样回传，否则 400
- **本地部署**：671B 全量走 DeepSeek-V3 仓库的 vLLM/SGLang 方案；蒸馏版（1.5B~70B）用标准 vLLM/SGLang 直接 serve

## 思考模式深入

### thinking 参数（V4+ 推荐）

```python
# OpenAI SDK 走 extra_body 透传
client.chat.completions.create(
    model="deepseek-v4-pro",
    messages=[...],
    extra_body={
        "thinking": {"type": "enabled"},     # enabled（默认）| disabled
        "reasoning_effort": "high",          # high | max（low/medium→high，xhigh→max）
    },
)
```

| 参数 | 取值 | 默认 |
| --- | --- | --- |
| `thinking.type` | `enabled` / `disabled` | `enabled` |
| `reasoning_effort` | `high` / `max`（low/medium→high，xhigh→max） | `high`（agent 场景自动 `max`） |

### 思考模式采样参数失效（关键坑）

thinking 启用时，下列参数**官方明说不生效**（仅为兼容存量软件保留入参）：

- `temperature`
- `top_p`
- `presence_penalty`
- `frequency_penalty`

> 设了也是空操作，反而误导调试。思考模式的采样由模型自主控制。

### R1 推理最佳采样（官方 README）

```python
client.chat.completions.create(
    model="deepseek-reasoner",
    messages=[{
        "role": "user",
        "content": "证明根号 2 是无理数，请一步步推理，并把最终答案放进 \\boxed{}"
    }],
    temperature=0.6,     # 官方推荐 0.5–0.7
    top_p=0.95,
    # ⚠️ 不放 system prompt！所有指令塞 user prompt
)
```

> 官方明确：R1 调用**不要加 system prompt**，所有指令应放在 user prompt 内，否则影响推理链质量与基准复现。

## Context Caching 实战

**核心机制**：KV Cache on Disk，默认开启、无需改码；按 cache prefix unit 切片缓存，命中部分享约 98% 折扣。

**最佳实践**：

```python
# ✅ 前缀稳定：system + 文档 + few-shot 放前面
messages = [
    {"role": "system", "content": LONG_SYSTEM_PROMPT},  # 稳定
    {"role": "user", "content": LONG_DOCUMENT},          # 稳定
    {"role": "user", "content": few_shot_examples},      # 稳定
    {"role": "user", "content": user_question},          # 变量放最后
]

# usage 看命中
{
    "prompt_cache_hit_tokens": 8000,   # 命中（约 98% 折扣）
    "prompt_cache_miss_tokens": 50,    # 未命中（按原价）
}
```

**反模式**：把变量放前面（如先放 user_question 再放文档）→ 前缀每次都变，命中率趋零。

> best-effort 非保证：TTL 几小时到几天，前缀稳定性影响命中率。

## JSON Output

```python
resp = client.chat.completions.create(
    model="deepseek-chat",
    messages=[{
        "role": "user",
        # ⚠️ prompt 必须包含 'json' 字样并给结构示例
        "content": "请输出用户信息 JSON，结构如 {\"name\": \"\", \"age\": 0}。只返回 JSON。"
    }],
    response_format={"type": "json_object"},  # 触发 JSON 模式
    max_tokens=1024,  # ⚠️ 合理预估，防截断
)
```

**约束**：

- prompt 必须含 `json` 字样 + 结构示例（模型依赖该信号触发 JSON 模式）
- 合理 `max_tokens` 防截断（中途截断产生不可解析 JSON）
- **已知问题**：偶发返回空内容，结构越复杂截断概率越高，需调 prompt + `max_tokens` 兜底

## Function Calling 与 Strict 模式

### 基础 Function Calling

```python
tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "查询某城市天气",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {"type": "string"}
            },
            "required": ["city"]
        }
    }
}]

resp = client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": "北京天气怎么样？"}],
    tools=tools,
)
```

### Strict Function Calling（Beta）

服务端校验 schema，保证输出严格符合契约：

```python
# ⚠️ 必须切到 /beta base_url
strict_client = OpenAI(api_key=KEY, base_url="https://api.deepseek.com/beta")

tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "strict": True,  # ⚠️ 开启 strict
        "parameters": {
            "type": "object",
            "properties": {
                "city": {"type": "string"}
            },
            "required": ["city"],               # ⚠️ 全部 required
            "additionalProperties": False        # ⚠️ 必须 false
        }
    }
}]
```

**Strict 模式硬约束**：

- base_url 必须用 `https://api.deepseek.com/beta`
- 每个 function 内 `strict: true`
- `object` 必须 `additionalProperties: false` 且**全部属性** `required`
- **不支持** `string` 的 `minLength/maxLength`、`array` 的 `minItems/maxItems` 等

> Strict 适合需要严格契约的 Agent 场景，能显著降低下游解析失败率。

## FIM 填空补全（代码补全专用）

FIM（Fill In the Middle）专为「前缀 + 后缀填中间」设计，主用于 IDE 代码补全（如 Continue 插件）。

```python
# ⚠️ 必须切 /beta
fim_client = OpenAI(api_key=KEY, base_url="https://api.deepseek.com/beta")

resp = fim_client.completions.create(
    model="deepseek-chat",
    prompt="def fibonacci(n):\n    ",       # 前缀
    suffix="\n    return result",            # 后缀
    max_tokens=4000,  # ⚠️ 硬上限 4K
)
```

**关键约束**：

- 必须 `/beta` base_url
- `max_tokens` 上限 **4K**（超出会失败或截断）
- 走 `client.completions.create`（不是 `chat.completions`）
- `chat completions` 不接受 `suffix`

> FIM 与 chat 互补：chat 适合对话式生成，FIM 适合 IDE 补全这种「已知前后文」场景。

## 多轮 tool-call 上下文管理

**关键规则**：

| 轮次类型 | reasoning_content 处理 |
| --- | --- |
| 不含 `tool_calls` 的轮次 | 可省略（API 忽略） |
| 含 `tool_calls` 的轮次 | **必须原样回传**，否则 400 |

```python
# 第一轮：assistant 返回了 tool_calls + reasoning_content
first_resp = client.chat.completions.create(
    model="deepseek-reasoner",
    messages=[{"role": "user", "content": "查北京天气"}],
    tools=tools,
)

# 第二轮：必须把 reasoning_content 原样塞回 messages
messages = [
    {"role": "user", "content": "查北京天气"},
    {
        "role": "assistant",
        "content": first_resp.choices[0].message.content,
        "reasoning_content": first_resp.choices[0].message.reasoning_content,  # ⚠️ 必传
        "tool_calls": first_resp.choices[0].message.tool_calls,
    },
    {"role": "tool", "content": "..."},
]
```

## 本地部署

### 671B 全量模型

```bash
# 走 DeepSeek-V3 仓库的 vLLM/SGLang 方案
# HuggingFace transformers 不直接支持（MoE + MLA 需专用推理内核）
git clone https://github.com/deepseek-ai/DeepSeek-V3
# 按 README 启动 vLLM 或 SGLang serve
```

### 蒸馏版（1.5B~70B）

```bash
# 标准 vLLM 直接 serve
vllm serve deepseek-ai/DeepSeek-R1-Distill-Qwen-32B \
    --port 8000 \
    --max-model-len 32768
```

| Distill | Base | 适用算力 |
| --- | --- | --- |
| 1.5B / 7B / 14B / 32B | Qwen2.5 | 单卡~多卡 |
| 8B | Llama-3.1 | 单卡 |
| 70B | Llama-3.3 | 多卡 |

> 蒸馏版须叠加 base 的上游 License（Qwen2.5 / Llama-3.1 / Llama-3.3），非纯 MIT。

## 反模式（避坑）

- **混淆产品线**：把 V3（通用）当 R1（推理）用，或反之——V3 强在通用对话/写文案，R1 强在数学/代码/逻辑
- **误用模型 ID**：思考场景调 `deepseek-chat`（非思考），或在 V4 接口仍写死 `deepseek-reasoner` 而不用 `thinking` 开关
- **多轮 tool-call 丢 reasoning_content**：触发 `tool_calls` 的轮次漏传 `reasoning_content` 会直接 400
- **给 R1 加 system prompt**：官方明确所有指令应放在 user prompt 内，否则影响推理链质量
- **思考模式下设置采样参数**：`temperature` / `top_p` / `penalties` 在 thinking 模式被忽略，设了也无作用
- **期待 Context Caching 100% 命中**：best-effort，TTL 几小时到几天，前缀稳定性影响命中率
- **FIM 不切 `/beta` 或 `max_tokens` > 4K**：必须 `/beta`，硬上限 4K
- **Strict Function Calling 漏写 `additionalProperties:false`**：服务端校验失败报错；strict 不支持 `string` 的 `minLength/maxLength` 等
- **JSON Output 不预估 `max_tokens`**：偶发空内容，需调 prompt + 合理 `max_tokens` 兜底
- **把 R1 当全场景最强**：MMLU(90.8) < o1-1217(91.8)、GPQA(71.5) < o1(75.7)、SWE-Verified(49.2) < Claude-3.5-Sonnet(50.8)，R1 强在数学/代码/推理
- **License 一刀切当纯 MIT**：R1 代码+权重 MIT，V3 模型走自有 Model License，蒸馏版须叠加 Qwen/Llama 上游 License

## 下一步

- [参考](./reference.md)：完整 API 参数表、版本演进时间线、官方资源
