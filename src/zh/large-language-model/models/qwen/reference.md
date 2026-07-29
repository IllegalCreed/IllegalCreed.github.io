---
layout: doc
outline: [2, 3]
---

# 参考

> 基于阿里云百炼帮助中心 + Qwen3 官方博客 + Qwen-Agent GitHub 编写，对照 2026 年 Qwen3.7 系列

## 速查

- **首选端点**：百炼 OpenAI 兼容 `compatible-mode/v1/chat/completions`
- **国内 base_url**：`https://dashscope.aliyuncs.com/compatible-mode/v1`
- **国际 base_url**：`https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- **API Key 环境变量**：`DASHSCOPE_API_KEY`（绝不硬编码）
- **思考模式采样**：`temperature=0.6 / top_p=0.95 / top_k=20`（严禁 `temperature=0`）
- **非思考模式**：`temperature=0.7`（默认）
- **思考开关**：`enable_thinking`（放 `extra_body`）+ `thinking_budget`
- **长度限制**：`max_completion_tokens`（含思维链 + 回答），勿用 `max_tokens`
- **流式默认开**：`stream=true` + `stream_options.include_usage=true`
- **多轮保留思维链**：`preserve_thinking=true`
- **Function Calling 工具名规则**：仅字母 / 数字 / `_` / `-`，≤ 64 token
- **开源协议**：Qwen3 全系列 Apache 2.0；Qwen3-Max / Qwen3.7-Max 闭源仅 API
- **多语言**：119 种语言与方言，覆盖九大语系
- **完整说明见** [入门](./getting-started.md) / [核心 API 与思考模式](./guide-line.md)

## 端点对照表

| 端点 | URL（国内站） | 用途 | SDK 兼容 |
| --- | --- | --- | --- |
| OpenAI 兼容-Chat | `/compatible-mode/v1/chat/completions` | 默认首选，迁移成本接近 0 | OpenAI SDK |
| OpenAI 兼容-Responses | `/compatible-mode/v1/responses` | 内置联网搜索 + 代码解释器 | OpenAI SDK（responses 接口） |
| Anthropic 兼容-Messages | `/compatible-mode/v1/messages` | 复用 Anthropic SDK 现有代码 | Anthropic SDK |
| DashScope 原生 | `/api/v1/services/aigc/text-generation/generation` | 全参数集（`result_format` 等） | DashScope SDK |

## 模型 ID 速查

### 开源 Dense（Apache 2.0，可下载权重）

| 模型 ID | 总参 | 上下文 |
| --- | --- | --- |
| `Qwen3-0.6B` | 6 亿 | 32K |
| `Qwen3-1.7B` | 17 亿 | 32K |
| `Qwen3-4B` | 40 亿 | 32K |
| `Qwen3-8B` | 80 亿 | 128K |
| `Qwen3-14B` | 140 亿 | 128K |
| `Qwen3-32B` | 320 亿 | 128K |

### 开源 MoE（Apache 2.0）

| 模型 ID | 总参 / 激活 | 上下文 |
| --- | --- | --- |
| `Qwen3-30B-A3B` | 300 亿 / 30 亿（128 专家 8 激活） | 128K |
| `Qwen3-235B-A22B` | 2350 亿 / 220 亿（94 层 / 128 专家 8 激活） | 128K |
| `Qwen3-235B-A22B-Thinking-2507` | 同上（思考子模型） | 128K |
| `Qwen3-235B-A22B-Instruct-2507` | 同上（指令微调） | 128K |
| `Qwen3-Coder-480B-A35B-Instruct` | 4800 亿 / 350 亿（含 70% 代码预训练） | 256K（YaRN→1M） |
| `Qwen3-Next-80B-A3B` | 800 亿 / 30 亿（Hybrid Attention + 极致稀疏 MoE） | 128K |

### 闭源旗舰（仅百炼 API，无权重下载）

| 模型 ID | 定位 |
| --- | --- |
| `qwen3.7-max` | 2026 最新旗舰（订阅 / 按 token） |
| `qwen3.7-plus` | 中阶通用 |
| `qwen3.7-flash` | 高并发 / 低延迟 |
| `qwen3-max` / `qwen3-max-thinking` | 万亿级（上一代主力） |
| `qwen3.5-omni-plus` | 全模态（图 / 音 / 视频） |
| `qwen3-coder-480b-a35b-instruct` | 编程旗舰（百炼专属） |
| `qwen3.8-max-preview` | 订阅预览（实验） |

> **历史型号**：`qwen-max` / `qwen-plus` / `qwen-turbo`（无前缀）属上一代 Qwen2.5，仍可调用但官方建议迁移到 `qwen3.x-*`。

## 思考模式参数速查

| 参数 | 位置 | 类型 | 含义 |
| --- | --- | --- | --- |
| `enable_thinking` | `extra_body` | bool | 思考模式总开关 |
| `thinking_budget` | `extra_body` | int | 思维链 token 上限 |
| `reasoning_effort` | `extra_body` | `low` / `medium` / `high` / `xhigh` | 与 `thinking_budget` 自动互转 |
| `top_k` | `extra_body` | int | 思考模式推荐 `20` |
| `preserve_thinking` | `extra_body` | bool | 多轮对话保留历史 `reasoning_content` |
| `/think` / `/no_think` | prompt 内容 | 软指令 | 逐轮切换思考模式 |

> **curl 调用**：上述参数放请求体**顶层**；**OpenAI SDK 调用**：必须放 `extra_body`。

## 采样参数推荐

| 模式 | temperature | top_p | top_k |
| --- | --- | --- | --- |
| 思考模式 | **0.6** | **0.95** | **20** |
| 非思考模式（默认） | 0.7 | 0.8 | 不设 |

> 严禁思考模式用 `temperature=0`；不要同时设置 `temperature` 与 `top_p`。

## 返回字段对照

| 字段 | 含义 | 限制参数 |
| --- | --- | --- |
| `choices[].message.content` | 最终回答 | `max_completion_tokens` |
| `choices[].message.reasoning_content` | 思维链（thinking 子模型才有） | `thinking_budget` |
| `choices[].message.tool_calls` | 工具调用数组 | `parallel_tool_calls` |
| `usage.prompt_tokens` | 输入 token 数 | `stream_options.include_usage=true` 末包返回 |
| `usage.completion_tokens` | 输出 token 数（含思维链） | 同上 |
| `usage.total_tokens` | 总 token 数 | 同上 |

## 长度限制参数

| 参数 | 含义 | 状态 |
| --- | --- | --- |
| `max_completion_tokens` | 含「思维链 + 回答」总长度 | **推荐** |
| `max_tokens` | 仅限 `content`（回答） | **即将废弃** |
| `thinking_budget` | 仅限 `reasoning_content`（思维链） | 思考模式用 |

## 鉴权与 SDK 配置

### Python / Node.js / curl

```bash
# 环境变量
export DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
```

```python
# Python（OpenAI 兼容）
from openai import OpenAI
client = OpenAI(
    api_key=os.environ["DASHSCOPE_API_KEY"],
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)
```

```ts
// Node.js（OpenAI 兼容）
import OpenAI from "openai";
const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY!,
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});
```

```bash
# curl 直调
curl https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions \
  -H "Authorization: Bearer $DASHSCOPE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "qwen-plus", "messages": [...]}'
```

## Function Calling 限制速查

| 限制项 | 取值 |
| --- | --- |
| 工具名允许字符 | 字母 / 数字 / `_` / `-` |
| 工具名最大长度 | ≤ 64 token |
| 工具描述最大长度 | ≤ 128 token（百炼限制） |
| 单次调用工具数 | 无硬上限（建议 ≤ 10） |
| 并行调用 | `parallel_tool_calls=true` 时支持 |

## 版本与发布时间线

| 时间 | 事件 |
| --- | --- |
| 2024-09 | Qwen2.5 发布（已往代） |
| 2025-04 | **Qwen3 发布**：6 Dense + 2 MoE（235B-A22B 旗舰），Apache 2.0，36T tokens 预训练，119 语言 |
| 2025-07 | Qwen3-Coder-480B-A35B-Instruct 发布（256K 原生 / YaRN 1M / SWE-bench SOTA） |
| 2025-07 | Qwen3-Next-80B-A3B 发布（Hybrid Attention + 极致稀疏 MoE） |
| 2025-07 | 2507 后缀迭代（Thinking-2507 / Instruct-2507） |
| 2025-Q4 | Qwen3-Max-Thinking 万亿级思考旗舰 |
| 2026 | Qwen3.7-Max / Plus / Flash 系列迭代（对标 GPT-5.5 / Claude Opus 4.7） |
| 2026 | Qwen3.8-Max-Preview 订阅预览（实验） |

## 开源协议与商用

| 系列 | 协议 | 商用 | 权重下载 |
| --- | --- | --- | --- |
| Qwen3 Dense（0.6B ~ 32B） | **Apache 2.0** | 允许 | 是 |
| Qwen3 MoE（30B-A3B / 235B-A22B） | **Apache 2.0** | 允许 | 是 |
| Qwen3-Coder-480B | **Apache 2.0** | 允许 | 是 |
| Qwen3-Next-80B | **Apache 2.0** | 允许 | 是 |
| Qwen3-Max / Qwen3.7-Max | 闭源 | 仅 API 调用 | 否 |
| Qwen2.5（往代） | Apache 2.0 | 允许 | 是 |

## 多语言支持

Qwen3 原生支持 **119 种语言与方言**，覆盖九大语系：

- 印欧语系（英 / 西 / 葡 / 法 / 德 / 俄 / 印地 / 波斯…）
- 汉藏语系（中 / 缅 / 藏…）
- 闪含语系（阿 / 希伯来…）
- 南岛语系（印尼 / 马 / 他加禄…）
- 达罗毗荼语系（泰米尔 / 泰卢固 / 卡纳达…）
- 突厥语系（土 / 维 / 哈 / 乌兹…）
- 壮侗语系（泰 / 老 / 壮…）
- 乌拉尔语系（芬 / 匈 / 爱沙尼亚…）
- 南亚语系（越 / 高棉…）

## 官方资源

- Qwen3 官方博客：[https://qwenlm.github.io/blog/qwen3](https://qwenlm.github.io/blog/qwen3)
- QwenLM GitHub 组织：[https://github.com/QwenLM](https://github.com/QwenLM)
- Qwen-Agent 框架：[https://github.com/QwenLM/Qwen-Agent](https://github.com/QwenLM/Qwen-Agent)
- Qwen3 仓库：[https://github.com/QwenLM/Qwen3](https://github.com/QwenLM/Qwen3)
- HuggingFace 主页：[https://huggingface.co/Qwen](https://huggingface.co/Qwen)
- 阿里云百炼控制台：[https://bailian.console.aliyun.com](https://bailian.console.aliyun.com)
- 百炼帮助中心（首次调用千问 API）：[https://help.aliyun.com/zh/model-studio/first-api-call-to-qwen](https://help.aliyun.com/zh/model-studio/first-api-call-to-qwen)
- 百炼帮助中心（OpenAI 兼容）：[https://help.aliyun.com/zh/model-studio/qwen-api-via-openai-chat-completions](https://help.aliyun.com/zh/model-studio/qwen-api-via-openai-chat-completions)
- Qwen3-Coder 模型卡：[https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct](https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct)
