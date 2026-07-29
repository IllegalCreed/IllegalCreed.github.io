---
layout: doc
---

# Kimi

Kimi 是**月之暗面（Moonshot AI）**推出的国产大语言模型家族与智能助手产品，主打**超长上下文 + 中文写作 + Agent/工具调用**。它有**三个层次**需要区分：① **Kimi 智能助手产品**（kimi.com / kimi.moonshot.cn，面向 C 端，提供 200 万字长文档分析、深度搜索、Agent 等能力）；② **Kimi 开放平台 API**（platform.kimi.ai，面向开发者，**完全 OpenAI SDK 兼容**，Base URL 指向 `https://api.moonshot.ai/v1`）；③ **Kimi K2 开源模型**（HuggingFace `moonshotai/` + GitHub `moonshotai/Kimi-K2`，Modified MIT 协议，全球最大开源 MoE）。截至 2026-07-27，旗舰 **kimi-k3**（2026-07-17 发布）参数达 **2.8 万亿（全球最大开源）**，原生视觉、1M tokens 上下文、思考始终开启（`reasoning_effort: low/high/max`，默认 `max`）；现役 API 主力是 **kimi-k2.6**（通用多模态，256K）与 **kimi-k2.7-code / kimi-k2.7-code-highspeed**（编程专用，256K）；Kimi K2 开源版（1T 总参 / 32B 激活 / 128K）以 Modified MIT 协议供社区微调与部署。

## 评价

**优点**

- **超长上下文起家**：智能助手产品层支持 **200 万字**长文档分析，API 旗舰 kimi-k3 提供 **1M tokens** 上下文窗口
- **OpenAI SDK 完全兼容**：`base_url=https://api.moonshot.ai/v1`、`api_key=MOONSHOT_API_KEY` 即可复用，迁移成本一行配置
- **中文写作「AI 味最低」**：在国产大模型横向评测中，Kimi 长文档 / 论文 / 公文写作的自然度公认靠前
- **思考模型一等公民**：kimi-k3 始终开启推理（`reasoning_effort: low/high/max`），k2.6/k2.5 可开关 `thinking`，并支持 Preserved Thinking（`thinking.keep='all'`）跨轮次保留推理链
- **开源 K2 体量最大**：1T 总参 / 32B 激活 / 384 专家 MoE，Modified MIT 协议可商用微调
- **Function Calling 全栈**：并行 `tool_calls`、流式工具调用、Dynamic Tool Loading（`KimiK3DynamicToolMessage`）、Partial Mode（Prefill）
- **Context Caching**：`prompt_cache_key` 复用长 system prompt / 长文档前缀，命中后 `cached_tokens` 按缓存价计费
- **多模态输入齐全**：`text` / `image_url` / `video_url`，URL 可为 base64 data URI 或 `ms://<file_id>` 文件引用
- **国产合规与可访问**：境内可直接访问，无需代理；公司合规备案完备

**缺点**

- **闭源旗舰 kimi-k3**：参数虽公布但权重未开源，仅 API 调用（开源侧只有 K2 系列）
- **200 万字 ≠ API 默认能力**：那是智能助手产品层的能力，API 模型上限 kimi-k3=1M tokens、K2 系列=128K/256K，常被混淆
- **思考计费**：`reasoning_content` 与 `content` 共享 `max_completion_tokens` 预算，长推理任务成本易超预期
- **多模态弱于 GPT/Gemini**：暂无音频输入/输出、图像生成、代码解释器内置工具
- **生态弱于 Claude/GPT**：无 MCP 等价协议，Agent 工具链靠 OpenAI SDK + 自建
- **模型版本迭代快**：旧 `moonshot-v1-*`、`kimi-k2-*-preview`、`kimi-latest`、`kimi-thinking-preview` 等已陆续停用，需迁 `kimi-k3`
- **`max_tokens` 已废弃**：新参数 `max_completion_tokens`（k3 默认上限 131072，最高 1048576）

## 文档地址

- [Kimi 开放平台文档总入口](https://platform.kimi.ai/docs/introduction)
- [Chat Completions API](https://platform.kimi.ai/docs/api/chat)
- [API 总览（Base URL / 认证 / 端点）](https://platform.kimi.ai/docs/api/overview)
- [Moonshot AI 官网](https://www.moonshot.cn)

## GitHub 地址

- [moonshotai/Kimi-K2](https://github.com/moonshotai/Kimi-K2)（开源 K2 + 技术报告 arxiv:2507.20534）
- HuggingFace：[moonshotai](https://huggingface.co/moonshotai)（Kimi-K2-Base / Kimi-K2-Instruct）

## 模型列表（2026-07 当前）

| 模型 ID | 上下文 | 用途 | 状态 |
| --- | --- | --- | --- |
| `kimi-k3` | **1M** | 旗舰：深度推理 / 长上下文 / 原生视觉 | 主力 |
| `kimi-k2.7-code` | 256K | 编程专用（长指令遵循更稳） | 主力 |
| `kimi-k2.7-code-highspeed` | 256K | 编程高速版（180 tok/s，短上下文 260 tok/s） | 主力 |
| `kimi-k2.6` | 256K | 通用多模态（视觉 + 视频，thinking 可开关） | 主力 |
| `kimi-k2.5` | 256K | 开源 SoTA | 存量可用，新注册不可用 |
| `moonshot-v1-8k/32k/128k/auto` | 8K–128K | 旧通用 | 逐步停用 |
| `moonshot-v1-vision-preview` | 8K | 旧视觉 | 逐步停用 |

**已停用并需迁 kimi-k3**：`kimi-k2-0905-preview`、`kimi-k2-0711-preview`、`kimi-k2-turbo-preview`、`kimi-k2-thinking`、`kimi-k2-thinking-turbo`（2026-05-25 停）、`kimi-latest`（2026-01-28 停）、`kimi-thinking-preview`（2025-11-11 停）。

## 访问方式

| 方式 | 适合 | 入口 |
| --- | --- | --- |
| **Kimi 智能助手** | C 端长文档分析 / 深度搜索 / Agent | [kimi.com](https://kimi.com) / [kimi.moonshot.cn](https://kimi.moonshot.cn) |
| **Kimi 开放平台 API** | 开发者集成（OpenAI 兼容） | [platform.kimi.ai](https://platform.kimi.ai) |
| **Kimi K2 开源** | 自部署 / 微调 | [HuggingFace moonshotai](https://huggingface.co/moonshotai) |
| **OpenRouter / 各代理** | 海外 / 已有路由 | openrouter.ai 等 |

## 推荐资源

- [Kimi 开放平台文档](https://platform.kimi.ai/docs/introduction)
- [Moonshot AI 官网](https://www.moonshot.cn)
- [Kimi K2 开源仓库](https://github.com/moonshotai/Kimi-K2)
- [技术报告（arxiv:2507.20534）](https://arxiv.org/abs/2507.20534)
- [API 端点参考](https://platform.kimi.ai/docs/api/overview)

## 幻灯片地址

<a href="/SlideStack/kimi-slide/" target="_blank">Kimi</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">Kimi 测试题</a>
