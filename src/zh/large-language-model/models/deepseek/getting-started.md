---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 DeepSeek 官方 API 文档（api-docs.deepseek.com）+ GitHub deepseek-ai 仓库编写，对照 V3.1 / V3.2 / V4 系列（截至 2026-07）

## 速查

- **两条产品线**：DeepSeek-V3（通用大模型，671B 总参 / 37B 激活 MoE，128K 上下文）+ DeepSeek-R1（推理模型，对标 OpenAI o1）
- **当前 API 模型 ID**：`deepseek-chat`（非思考，V3.x）/ `deepseek-reasoner`（思考，R1）；V4 起合并为 `deepseek-v4-flash` / `deepseek-v4-pro` + `thinking` 开关
- **三种 Base URL**：`https://api.deepseek.com`（OpenAI 兼容）/ `/anthropic`（Anthropic 格式）/ `/beta`（FIM + Strict Function Calling）
- **OpenAI SDK 直接用**：换 `base_url` + `api_key` 即可，DeepSeek 专属参数（`thinking` 等）通过 `extra_body` 透传
- **`thinking` 参数**：`{type: enabled}` 默认 / `{type: disabled}`；`reasoning_effort`：`high` | `max`（low/medium→high，xhigh→max）
- **`reasoning_content`**：与 `content` 同级返回 CoT；流式 `delta.reasoning_content`；多轮 tool-call 必须回传否则 400
- **Context Caching**：默认开启无需改码，`prompt_cache_hit_tokens` / `prompt_cache_miss_tokens` 看 usage；命中价约低 98%
- **思考模式硬约束**：`temperature` / `top_p` / `presence_penalty` / `frequency_penalty` 在 thinking 模式下不生效
- **R1 推理最佳采样**：`temperature` 0.5–0.7（推荐 0.6）、`top_p` 0.95、不放 system prompt、答案放 `\boxed{}`
- **开源权重**：R1 代码+权重 MIT；V3 代码 MIT + 自有 Model License；6 个 Distill（1.5B~70B），800K 样本 SFT

## DeepSeek 是什么

DeepSeek（深度求索）是国内开源大模型团队，定位「极致性价比 + 推理强 + 完全开源」：

- **架构创新**：MLA（Multi-head Latent Attention）+ DeepSeekMoE + 无辅助损失负载均衡 + MTP（多 Token 预测）
- **训练成本**：V3 仅 2.788M H800 GPU 小时，远低于同档闭源模型
- **开源承诺**：训练代码、模型权重、推理方案、蒸馏版全部 Hugging Face 开源
- **API 兼容**：100% OpenAI SDK 兼容 + Anthropic 格式 + Beta 功能端点

> DeepSeek ≠ 只能用官方 API。R1/V3 权重在 Hugging Face 开源，支持本地/私有化部署（671B 走 vLLM/SGLang + DeepSeek-V3 仓库方案，蒸馏版直接 vLLM/SGLang serve）。

## 模型家族

| 模型 | 类型 | 关键数字 | License |
| --- | --- | --- | --- |
| **DeepSeek-V3** | 通用 MoE | 671B 总参 / 37B 激活 / 128K 上下文 / 14.8T tokens | MIT 代码 + 自有 Model License |
| **DeepSeek-R1** | 推理（CoT） | 基于 V3-Base + 纯 RL + 冷启动 | MIT（代码 + 权重） |
| **DeepSeek-R1-Zero** | 纯 RL 实验 | 无 SFT 直接 RL，验证推理涌现 | MIT（参考用） |
| **DeepSeek-V3.1** | Hybrid Inference | 同一权重两模式：`deepseek-chat` / `deepseek-reasoner` | HuggingFace `deepseek-ai/DeepSeek-V3.1` |
| **DeepSeek-V3.2** | Thinking + tool-use | Thinking 集成进工具调用；V3.2-Speciale IMO/CMO/ICPC/IOI 2025 夺金 | 同上 |
| **deepseek-v4-flash / v4-pro** | 当前最新 API | 思考/非思考合并为单模型 + `thinking` 开关 | — |
| **6 个 Distill** | 蒸馏版 | 1.5B/7B/14B/32B 基于 Qwen2.5；8B 基于 Llama-3.1；70B 基于 Llama-3.3 | MIT + 上游 License |

> 32B Distill 在 AIME 2024 上 72.6 反超 o1-mini（63.6），是 dense 模型新 SOTA。

## Base URL 与 SDK 兼容

三种端点：

```text
OpenAI 兼容     →  https://api.deepseek.com
Anthropic 兼容  →  https://api.deepseek.com/anthropic
Beta 功能       →  https://api.deepseek.com/beta
```

**OpenAI SDK 直接接入**：

```python
from openai import OpenAI

# 仅需换 base_url + api_key，其余 100% OpenAI 协议
client = OpenAI(
    api_key="你的 DeepSeek Key",
    base_url="https://api.deepseek.com",
)

resp = client.chat.completions.create(
    model="deepseek-chat",  # 非思考模式
    messages=[{"role": "user", "content": "你好"}],
)

# DeepSeek 专属参数走 extra_body 透传
resp = client.chat.completions.create(
    model="deepseek-reasoner",  # 思考模式
    messages=[{"role": "user", "content": "证明根号 2 是无理数"}],
    extra_body={"thinking": {"type": "enabled"}},  # 思考开关
)
```

**API Key 申请**：[platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)，请求头 `Authorization: Bearer ${DEEPSEEK_API_KEY}`。

## 模型 ID 与思考模式

**V3.1 双 ID 约定**：

| 模型 ID | 模式 | 用途 |
| --- | --- | --- |
| `deepseek-chat` | 非思考（V3.x） | 通用对话、写文案、轻度代码 |
| `deepseek-reasoner` | 思考（R1） | 数学、逻辑、复杂代码、Agent |

**V4+ 单模型 + thinking 开关**：

```python
# V4 起合并为单一模型 ID，靠 thinking 参数切换
client.chat.completions.create(
    model="deepseek-v4-pro",
    messages=[...],
    extra_body={
        "thinking": {"type": "enabled"},  # 启用思考
        "reasoning_effort": "high",       # high | max（agent 场景自动 max）
    },
)
```

> `reasoning_effort` 映射：`low` / `medium` → `high`；`xhigh` → `max`；agent 场景自动 `max`。

## reasoning_content 字段

思考模式下，响应与 `content` 同级返回 `reasoning_content`（CoT 推理链）：

```python
{
    "choices": [{
        "message": {
            "role": "assistant",
            "content": "答案是 2。",
            "reasoning_content": "首先假设... 由此推出矛盾..."  # CoT
        }
    }],
    "usage": {
        "prompt_tokens": 50,
        "completion_tokens": 200,
        "reasoning_tokens": 150  # 思考消耗
    }
}
```

**流式**：通过 `delta.reasoning_content` 单独推送（先推完整 CoT，再推 `content`）。

**多轮 tool-call 关键约束**：

- 非 tool-call 轮次的 `reasoning_content` 可省略（API 忽略）
- **凡该轮触发了 `tool_calls`，其 `reasoning_content` 必须原样回传**给后续请求
- 漏传会直接 400 报错

## Context Caching（KV Cache on Disk）

**默认开启、无需改码**，把请求前缀做缓存命中：

```python
{
    "usage": {
        "prompt_tokens": 1000,
        "prompt_cache_hit_tokens": 800,    # 命中部分
        "prompt_cache_miss_tokens": 200,   # 未命中部分
    }
}
```

**最佳实践**：

- 把稳定的长上下文（system 说明、文档、few-shot）放前面
- 变量部分（用户输入、当前问题）放后面
- 命中部分享大幅折扣（约 98% off）

> Cache 是 best-effort，基于 Sliding Window Attention，需前缀完全匹配的 cache prefix unit；TTL 几小时到几天。

## 下一步

- [核心 API 与最佳实践](./guide-line.md)：思考模式深入、JSON / FIM / Function Calling、反模式与避坑
- [参考](./reference.md)：完整 API 参数表、版本演进、官方资源
