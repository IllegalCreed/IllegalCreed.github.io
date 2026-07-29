---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Kimi 开放平台官方文档（platform.kimi.ai/docs）+ Kimi K2 开源仓库编写，对照 2026-07-27 状态

## 速查

- **API Base URL**：`https://api.moonshot.ai/v1`
- **认证**：`Authorization: Bearer $MOONSHOT_API_KEY`
- **OpenAI SDK 完全兼容**：`base_url` + `api_key` 改两行
- **主力模型 ID**：`kimi-k3`（旗舰 1M）/ `kimi-k2.6`（256K）/ `kimi-k2.7-code[-highspeed]`（256K）/ `kimi-k2.5`（开源 256K）
- **思考模型**：kimi-k3 → `reasoning_effort=low/high/max`（思考常开）；k2.6/k2.5 → `thinking.type=enabled/disabled` + `thinking.keep='all'`
- **Chat 端点**：`POST /v1/chat/completions`（OpenAI 兼容）
- **新参数**：`max_completion_tokens`（旧 `max_tokens` 已废弃）
- **Files API**：`/v1/files`（POST 上传 / GET 列表）、`/v1/files/{id}`（GET/DELETE）、`/v1/files/{id}/content`
- **辅助端点**：`/v1/models`、`/v1/tokenizers/estimate-token-count`、`/v1/users/me/balance`
- **Context Caching**：`prompt_cache_key`、命中返回 `cached_tokens`
- **开源侧**：Kimi K2（1T MoE / 32B 激活 / 128K / Modified MIT），提供 `Kimi-K2-Base` 与 `Kimi-K2-Instruct` 两版

## 模型 ID 完整表（2026-07-27）

| 模型 ID | 上下文 | 多模态 | 思考 | 状态 |
| --- | --- | --- | --- | --- |
| `kimi-k3` | 1M | 原生视觉 | 始终开启，`reasoning_effort=low/high/max` | 旗舰主力 |
| `kimi-k2.7-code` | 256K | - | 始终开启（仅 `enabled`） | 编程主力 |
| `kimi-k2.7-code-highspeed` | 256K | - | 始终开启 | 编程高速 |
| `kimi-k2.6` | 256K | 视觉 + 视频 | `thinking.type` 可开关 | 通用主力 |
| `kimi-k2.5` | 256K | 视觉 | `thinking.type` 可开关 | 存量可用，新注册不可用 |
| `moonshot-v1-8k` | 8K | - | - | 逐步停用 |
| `moonshot-v1-32k` | 32K | - | - | 逐步停用 |
| `moonshot-v1-128k` | 128K | - | - | 逐步停用 |
| `moonshot-v1-auto` | 自动 | - | - | 逐步停用 |
| `moonshot-v1-vision-preview` | 8K | 视觉 | - | 逐步停用 |

**已停用并需迁 kimi-k3**：`kimi-k2-0905-preview`、`kimi-k2-0711-preview`、`kimi-k2-turbo-preview`、`kimi-k2-thinking`、`kimi-k2-thinking-turbo`（2026-05-25 停）、`kimi-latest`（2026-01-28 停）、`kimi-thinking-preview`（2025-11-11 停）。

## API 端点清单

| 方法 | 端点 | 作用 |
| --- | --- | --- |
| `POST` | `/v1/chat/completions` | Chat Completions（OpenAI 兼容，支持 stream / tools / response_format） |
| `GET` | `/v1/models` | 模型列表 |
| `POST` | `/v1/files` | 上传文件 |
| `GET` | `/v1/files` | 文件列表 |
| `GET` | `/v1/files/{id}` | 文件信息 |
| `DELETE` | `/v1/files/{id}` | 删除文件 |
| `GET` | `/v1/files/{id}/content` | 文件内容 |
| `POST` | `/v1/tokenizers/estimate-token-count` | Token 估算 |
| `GET` | `/v1/users/me/balance` | 余额查询 |

## Chat Completions 关键字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `model` | string | 模型 ID（见上表） |
| `messages` | array | 消息数组，支持 `system` / `user` / `assistant` / `tool` |
| `stream` | boolean | 是否流式（长输出建议 true，单请求超时 2 小时返回 504） |
| `tools` | array | 工具定义（JSON Schema），命名正则 `^[a-zA-Z_][a-zA-Z0-9-_]{2,63}$` |
| `tool_choice` | string/object | `auto`（默认）/ `none` / `required` / named |
| `response_format` | object | `text` / `json_object` / `json_schema`（`strict:true` 严格匹配 MFJS） |
| `max_completion_tokens` | integer | 新参数名（k3 默认上限 131072、最高 1048576），替代旧 `max_tokens` |
| `temperature` | float | 温度（kimi-k2.7-code 不可修改） |
| `prompt_cache_key` | string | 顶层缓存键，相同 key 命中前缀缓存 |
| `reasoning_effort` | string | **kimi-k3 专用**：`low` / `high` / `max`（默认 `max`，思考常开） |

**消息扩展字段**

| 字段 | 适用 role | 说明 |
| --- | --- | --- |
| `thinking.type` | 助手消息或顶层 extra_body | `enabled` / `disabled`（仅 k2.6 / k2.5） |
| `thinking.keep` | 顶层 extra_body | `'all'` 启用 Preserved Thinking（跨轮次保留 `reasoning_content`） |
| `partial` | 最后一条 assistant 消息 | `true` 启用 Prefill，提供输出前缀；与 `response_format:json_object` 互斥 |
| `tool_calls` | assistant | 工具调用列表（含 `id` / `function.name` / `function.arguments`） |
| `tool_call_id` | `tool` | 必须与 `assistant.tool_calls[].id` 匹配 |
| `reasoning_content` | assistant（响应） | 推理链，在 `content` 之前输出 |
| `cached_tokens` | usage（响应） | 缓存命中数，按缓存价计费 |

**`messages.content` 多模态数组**

| type | 字段 | 说明 |
| --- | --- | --- |
| `text` | `text` | 文本 |
| `image_url` | `image_url.url` | 图片：URL / `data:image/...;base64,...` / `ms://<file_id>` |
| `video_url` | `video_url.url` | 视频：URL / `data:video/...;base64,...` / `ms://<file_id>` |
| `file` | `file_url.url` | 文件引用：`ms://<file_id>` |

## 思考模型参数对照

| 模型 | 当前轮是否思考 | 思考深度 | 历史保留 |
| --- | --- | --- | --- |
| `kimi-k3` | 始终开启（**不支持关闭**） | `reasoning_effort=low/high/max`（默认 `max`） | 通过 `thinking.keep='all'`（k3 也支持） |
| `kimi-k2.6` | `thinking.type=enabled/disabled` | 开则思考，关则不思考 | 同上 |
| `kimi-k2.5` | 同 k2.6 | 同上 | 同上 |
| `kimi-k2.7-code` | 始终开启（仅接受 `enabled`） | 不可调 | - |

## Kimi K2 开源架构（参考）

| 项 | 取值 |
| --- | --- |
| 总参数 | 1T（1 万亿） |
| 激活参数 | 32B（每 token） |
| 专家数 | 384（每 token 选 8 + 1 共享专家） |
| 层数 | 61（含 1 Dense 层） |
| 注意力 | MLA（Multi-head Latent Attention） |
| FFN | SwiGLU |
| 词表 | 160K |
| 上下文 | 128K |
| 预训练数据 | 15.5T tokens |
| 优化器 | MuonClip |
| 协议 | Modified MIT |
| 版本 | `Kimi-K2-Base`（基座，供微调）/ `Kimi-K2-Instruct`（后训练，开箱即用） |
| 技术报告 | [arxiv:2507.20534](https://arxiv.org/abs/2507.20534) |

## 工具调用 finish_reason

| finish_reason | 含义 |
| --- | --- |
| `stop` | 正常结束，输出完整回复 |
| `tool_calls` | 模型请求调用工具，需执行后回传结果继续 |
| `length` | 达到 `max_completion_tokens` 截断（推理 + 答案共享预算） |
| `content_filter` | 内容审核拦截 |

## 与 OpenAI / Claude 接口差异

| 能力 | Kimi | OpenAI GPT | Claude |
| --- | --- | --- | --- |
| **OpenAI SDK 兼容** | 完全兼容（仅改 base_url） | 原生 | 不兼容（Anthropic SDK） |
| **思考模型** | `reasoning_effort` / `thinking.type` | o-series 内置 | `thinking` block |
| **Preserved Thinking** | `thinking.keep='all'` | - | 通过 cache |
| **Partial Mode（Prefill）** | `partial:true`（assistant 消息字段） | `prefix` | - |
| **Function Calling** | `tool_calls`（并行） | `tool_calls`（并行） | `tool_use` blocks |
| **Dynamic Tool Loading** | `KimiK3DynamicToolMessage` | - | - |
| **Context Caching** | `prompt_cache_key` | 自动（5-15min） | `cache_control` ephemeral |
| **Files API** | `ms://<file_id>` | ✓ | ✓ |
| **多模态** | image + video | image + audio + video | image + PDF |
| **结构化输出** | `response_format: json_schema`（MFJS） | `response_format: json_schema` | tool use |
| **超长上下文（API）** | kimi-k3 = 1M | 128K-256K | Opus 1M |
| **产品层超长上下文** | 智能助手 200 万字 | - | - |

::: tip Kimi 强在哪

- **超长上下文**（旗舰 kimi-k3 = 1M；产品层 = 200 万字）
- **中文写作自然度**（国产大模型中 AI 味最低）
- **OpenAI SDK 零摩擦迁移**（仅改 base_url + api_key）
- **Partial Mode + Dynamic Tool Loading + Preserved Thinking 三件套**（Agent 场景差异化能力）
- **K2 开源体量最大**（1T 总参 / Modified MIT 可商用微调）

:::

## 版本变更（近期）

- **2026-07-17**：旗舰 **kimi-k3** 发布（2.8 万亿参数、1M 上下文、原生视觉、思考常开 `reasoning_effort`）
- **2026-07-11~17**：`kimi-k2-0711-preview` 已停，迁 kimi-k3
- **2026-05-25**：`kimi-k2-thinking` / `kimi-k2-thinking-turbo` 停用，迁 kimi-k3
- **2026-01-28**：`kimi-latest` 停用
- **2025-11-11**：`kimi-thinking-preview` 停用
- **2025-07**：Kimi K2 开源（arxiv:2507.20534），Modified MIT

## 反模式快速索引

- ❌ 对 kimi-k3 传 `thinking` 参数 → 用 `reasoning_effort`
- ❌ Partial Mode 与 `response_format:json_object` 同用 → 二选一
- ❌ 对 kimi-k2.7-code 传 `thinking.type='disabled'` 或改 `temperature` → 报错
- ❌ 用 `max_tokens` → 改 `max_completion_tokens`
- ❌ tool 结果消息不 append 中间的 assistant(tool_calls) → `tool_call_id not found`
- ❌ 把 200 万字当 API 默认能力 → API 上限 1M tokens
- ❌ 把 Kimi-K2-Base 直接用于对话 → 用 Kimi-K2-Instruct

## 官方资源

- 开放平台文档：[platform.kimi.ai/docs/introduction](https://platform.kimi.ai/docs/introduction)
- API 总览：[platform.kimi.ai/docs/api/overview](https://platform.kimi.ai/docs/api/overview)
- Chat API：[platform.kimi.ai/docs/api/chat](https://platform.kimi.ai/docs/api/chat)
- 智能助手产品：[kimi.com](https://kimi.com) / [kimi.moonshot.cn](https://kimi.moonshot.cn)
- Moonshot AI 官网：[moonshot.cn](https://www.moonshot.cn)
- Kimi K2 开源仓库：[github.com/moonshotai/Kimi-K2](https://github.com/moonshotai/Kimi-K2)
- 技术报告：[arxiv.org/abs/2507.20534](https://arxiv.org/abs/2507.20534)
- HuggingFace：[huggingface.co/moonshotai](https://huggingface.co/moonshotai)
