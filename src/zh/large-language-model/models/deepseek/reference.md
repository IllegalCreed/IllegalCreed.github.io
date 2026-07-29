---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 DeepSeek 官方 API 文档（api-docs.deepseek.com）+ GitHub deepseek-ai 仓库编写，对照 V3.1 / V3.2 / V4 系列

## 速查

- **三条 Base URL**：`https://api.deepseek.com`（OpenAI 兼容）/ `/anthropic`（Anthropic 格式）/ `/beta`（FIM + Strict Function Calling）
- **核心端点**：`POST /chat/completions`（会话）/ `POST /completions`（FIM 填空）
- **模型 ID（V3.1 双约定）**：`deepseek-chat`（非思考）/ `deepseek-reasoner`（思考）；V4 合并为 `deepseek-v4-flash` / `deepseek-v4-pro` + `thinking` 开关
- **`thinking`**：`{type: enabled|disabled}` 默认 enabled；`reasoning_effort`：`high` | `max`（agent 自动 max）
- **思考模式失效参数**：`temperature` / `top_p` / `presence_penalty` / `frequency_penalty`
- **Context Caching**：默认开启；`prompt_cache_hit_tokens` / `prompt_cache_miss_tokens`；命中价约低 98%
- **JSON Output**：`response_format={type: json_object}`；prompt 必含 'json' + 结构示例
- **FIM**：`/beta` + `POST /completions` + `prompt` + `suffix`；`max_tokens` 上限 4K
- **Strict Function Calling**：`/beta` + 每 function `strict:true`；`object` 必须 `additionalProperties:false` 且全 `required`
- **完整说明见** [入门](./getting-started.md) / [核心 API 与最佳实践](./guide-line.md)

## 完整 Base URL 速查

| Base URL | 用途 | 备注 |
| --- | --- | --- |
| `https://api.deepseek.com` | OpenAI 兼容（主端点） | 推荐，复用 OpenAI SDK 生态 |
| `https://api.deepseek.com/anthropic` | Anthropic 格式兼容 | V3.1 新增，复用 Anthropic SDK |
| `https://api.deepseek.com/beta` | Beta 功能（FIM + Strict Function Calling） | 仍在演进，注意稳定性 |

## 模型 ID 与模式映射

| 模型 ID | 模式 | 系列 | 用途 |
| --- | --- | --- | --- |
| `deepseek-chat` | 非思考 | V3.x（V3.1 起约定） | 通用对话、写文案、轻度代码 |
| `deepseek-reasoner` | 思考（CoT） | R1 | 数学、逻辑、复杂代码、Agent |
| `deepseek-v4-flash` | 单模型 + thinking 开关 | V4 | 轻量场景，可动态切思考 |
| `deepseek-v4-pro` | 单模型 + thinking 开关 | V4 | 复杂场景，思考/非思考合并 |

> V3.1：双 ID 约定（`deepseek-chat` / `deepseek-reasoner`，同一权重 `deepseek-ai/DeepSeek-V3.1`）。V4：合并为单模型 + `thinking` 参数。

## thinking 与 reasoning_effort

| 参数 | 取值 | 默认 | 说明 |
| --- | --- | --- | --- |
| `thinking.type` | `enabled` / `disabled` | `enabled` | 思考开关 |
| `reasoning_effort` | `high` / `max` | `high` | 推理强度；`low`/`medium`→`high`，`xhigh`→`max`；agent 场景自动 `max` |

```python
# OpenAI SDK 走 extra_body
client.chat.completions.create(
    model="deepseek-v4-pro",
    messages=[...],
    extra_body={"thinking": {"type": "enabled"}, "reasoning_effort": "max"},
)
```

## 思考模式失效参数（关键约束）

thinking 启用时，下列参数**官方明说不生效**（仅为兼容旧软件保留入参）：

| 参数 | 思考模式行为 |
| --- | --- |
| `temperature` | 不生效（思考模式由模型自主采样） |
| `top_p` | 不生效 |
| `presence_penalty` | 不生效 |
| `frequency_penalty` | 不生效 |

> R1 在**非思考模式**下仍可用 `temperature` 0.5–0.7（推荐 0.6）、`top_p` 0.95 的官方推荐采样。

## 响应字段

```python
{
    "choices": [{
        "message": {
            "role": "assistant",
            "content": "可见回答",
            "reasoning_content": "推理链（思考模式）",  # 与 content 同级
            "tool_calls": [...]                        # 触发工具调用时
        }
    }],
    "usage": {
        "prompt_tokens": 100,
        "completion_tokens": 200,
        "reasoning_tokens": 150,             # 思考消耗
        "prompt_cache_hit_tokens": 800,      # Context Cache 命中
        "prompt_cache_miss_tokens": 100      # Context Cache 未命中
    }
}
```

## 功能矩阵

| 功能 | 端点 / 参数 | 关键约束 |
| --- | --- | --- |
| **会话补全** | `POST /chat/completions` | OpenAI SDK 直接用 |
| **思考模式** | `thinking: {type: enabled}` | 失效 temp/top_p/penalties |
| **Context Caching** | 默认开启 | best-effort，TTL 几小时~几天 |
| **JSON Output** | `response_format={type: json_object}` | prompt 必含 'json'；偶发空内容 |
| **Function Calling** | `tools` 数组 | 标准 OpenAI 协议 |
| **Strict Function Calling（Beta）** | `/beta` + `strict:true` | `object` `additionalProperties:false` + 全 `required` |
| **FIM 填空补全（Beta）** | `/beta` + `POST /completions` + `prompt` + `suffix` | `max_tokens` 上限 4K |
| **流式响应** | `stream: true` | `delta.reasoning_content` 单独推送 |

## R1 推理最佳采样（官方 README）

| 参数 | 推荐值 | 说明 |
| --- | --- | --- |
| `temperature` | **0.6**（范围 0.5–0.7） | 官方复现基准的最佳值 |
| `top_p` | **0.95** | 与 temperature 配合 |
| `system prompt` | **不要放** | 所有指令塞 user prompt |
| 答案格式 | 放进 `\boxed{}` | 数学题推荐 |

## 蒸馏版矩阵

| Distill | Base 模型 | AIME 2024 | License |
| --- | --- | --- | --- |
| DeepSeek-R1-Distill-Qwen-1.5B | Qwen2.5 | 28.9 | MIT + Qwen License |
| DeepSeek-R1-Distill-Qwen-7B | Qwen2.5 | 55.5 | MIT + Qwen License |
| DeepSeek-R1-Distill-Llama-8B | Llama-3.1 | 50.4 | MIT + Llama 3.1 License |
| DeepSeek-R1-Distill-Qwen-14B | Qwen2.5 | 69.7 | MIT + Qwen License |
| DeepSeek-R1-Distill-Qwen-32B | Qwen2.5 | **72.6**（反超 o1-mini 63.6） | MIT + Qwen License |
| DeepSeek-R1-Distill-Llama-70B | Llama-3.3 | 70.0 | MIT + Llama 3.3 License |

> 蒸馏版用 800K 样本 SFT，不走 RL；选型需叠加 base 模型上游 License。

## 版本演进时间线

| 时间 | 版本 | 关键事件 |
| --- | --- | --- |
| 2024 末 | **DeepSeek-V3** | 671B 总参 / 37B 激活 MoE，128K 上下文，14.8T tokens，2.788M H800 GPU 小时 |
| 2025-01-20 | **DeepSeek-R1** | 首个开源长 CoT 推理模型，基于 V3-Base + 纯 RL + 冷启动，MIT，对标 OpenAI o1 |
| 2025-01-20 | **DeepSeek-R1-Zero** | 纯 RL（无 SFT）参考版，验证推理涌现 |
| 2025-08-21 | **DeepSeek-V3.1** | Hybrid Inference「一模型两模式」：`deepseek-chat` / `deepseek-reasoner`；新增 Anthropic API 格式 + Strict Function Calling Beta |
| 2025-09~12 | **DeepSeek-V3.2** | Thinking 集成进 tool-use；V3.2-Speciale 在 IMO/CMO/ICPC/IOI 2025 夺金 |
| 2026 | **deepseek-v4-flash / v4-pro** | 思考/非思考合并为单一模型 + `thinking` 开关；`reasoning_effort=high|max` |

## R1 关键 Benchmark

| Benchmark | DeepSeek-R1 | 对标 |
| --- | --- | --- |
| AIME 2024 | **79.8** | Pass@1（o1-1217: 79.2） |
| MATH-500 | **97.3** | — |
| Codeforces Rating | **2029**（96.3 百分位） | — |
| LiveCodeBench | **65.9** | — |
| MMLU | 90.8 | o1-1217: 91.8（略低） |
| GPQA-Diamond | 71.5 | o1: 75.7（略低） |
| SWE-Verified | 49.2 | Claude-3.5-Sonnet: 50.8（略低） |

> R1 强在数学/代码/推理，通用知识与软件工程并非最强。

## V3 架构关键数字

| 项 | 数字 |
| --- | --- |
| 总参数 | 671B |
| 激活参数（每 token） | 37B（MoE） |
| 上下文 | 128K |
| 预训练 tokens | 14.8T |
| 训练成本 | 2.788M H800 GPU 小时 |
| 关键架构 | MLA + DeepSeekMoE + 无辅助损失负载均衡 + MTP |

## 反模式速查

| 反模式 | 后果 |
| --- | --- |
| 思考场景调 `deepseek-chat` | 拿不到推理链 |
| V4 接口仍写死 `deepseek-reasoner` | 调用失败或行为不一致 |
| 多轮 tool-call 丢 `reasoning_content` | 直接 400 |
| 给 R1 加 system prompt | 影响推理链质量 |
| 思考模式设 `temperature` | 空操作，误导调试 |
| FIM 不切 `/beta` | 失败 |
| FIM `max_tokens` > 4K | 截断或失败 |
| Strict 漏 `additionalProperties:false` | 服务端报错 |
| JSON 模式不预估 `max_tokens` | 偶发空内容 |
| 把 R1 当全场景最强 | 通用/软件工程任务劣于 o1/Claude |

## 官方资源

- API 文档总入口：[https://api-docs.deepseek.com/](https://api-docs.deepseek.com/)
- 定价：[https://api-docs.deepseek.com/quick_start/pricing](https://api-docs.deepseek.com/quick_start/pricing)
- 思考模式指南：[https://api-docs.deepseek.com/guides/thinking_mode](https://api-docs.deepseek.com/guides/thinking_mode)
- Context Caching：[https://api-docs.deepseek.com/guides/kv_cache](https://api-docs.deepseek.com/guides/kv_cache)
- JSON Output：[https://api-docs.deepseek.com/guides/json_mode](https://api-docs.deepseek.com/guides/json_mode)
- FIM 填空补全：[https://api-docs.deepseek.com/guides/fim_completion](https://api-docs.deepseek.com/guides/fim_completion)
- Function Calling：[https://api-docs.deepseek.com/guides/tool_calls](https://api-docs.deepseek.com/guides/tool_calls)
- API Keys 申请：[https://platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
- R1 仓库：[https://github.com/deepseek-ai/DeepSeek-R1](https://github.com/deepseek-ai/DeepSeek-R1)
- V3 仓库：[https://github.com/deepseek-ai/DeepSeek-V3](https://github.com/deepseek-ai/DeepSeek-V3)
- HuggingFace 组织：[https://huggingface.co/deepseek-ai](https://huggingface.co/deepseek-ai)
- DeepSeek 官网：[https://www.deepseek.com/](https://www.deepseek.com/)
