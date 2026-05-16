---
layout: doc
---

# Gemini

Google 推出的多模态大语言模型家族，主打**超长上下文 + 原生视频 / 音频 + 大规模 implicit cache + 与 Google 生态集成**。当前主力 Gemini 2.5 Pro / Flash / Flash-Lite 系列，上下文窗口业界最大（1M-2M）。

::: tip 与 Claude / GPT 对比的核心差异

- **Gemini 强在超长上下文**：1M（Flash）/ 2M（Pro），实际可塞整本仓库 + 配置 + 文档
- **Gemini 强在原生视频处理**：直接传 mp4 文件（无需抽帧），可分析 1 小时长视频
- **Gemini 强在 implicit cache**：自动检测重复前缀缓存（无需 cache_control），最高 75% 折扣
- **Gemini 强在 Google 工具集成**：grounding with Google Search / Maps / YouTube 直接接入
- **Claude 强在编码 / Agent / MCP**
- **GPT 强在多模态全栈（含 Realtime API）/ 内置工具丰富 / 结构化输出**

:::

## 评价

**优点**

- **超长上下文**：Pro 2M / Flash 1M，整本仓库 + 全部文档同时塞进去
- **原生视频处理**：传 mp4 文件直接分析（无需抽帧），最长 1 小时
- **原生音频处理**：传 mp3 / wav 直接分析（无需先 Whisper STT）
- **Implicit Caching**：自动检测重复前缀缓存（5min 自动 / 1h 手动），最高 75% 折扣
- **Grounding**：内置 Google Search / Maps / YouTube grounding（搜索增强 / 地址校验 / 视频引用）
- **Live API**：实时双向语音 + 视频对话（类 GPT Realtime）
- **Vertex AI 集成**：企业级 SLA + 合规 / 私有部署
- **价格亲民**：Flash 系列 $0.075/M 输入是业界最低旗舰价之一

**缺点**

- API 设计**两套**：`@google/generative-ai`（旧 SDK 已 deprecated） + `@google/genai`（新 SDK）
- 编码能力略弱于 Claude 4.7（SWE-bench 略低）
- Function Calling 比 GPT / Claude 略晚成熟（部分边界场景仍有问题）
- 中文回复偶尔不自然（训练数据中文占比低）
- Google 内容审核**比 GPT 更严**（更多场景被 SAFETY block）
- 文档分散：Google AI Studio / Vertex AI / 旧 Generative AI 三套文档并存

## 文档地址

[ai.google.dev](https://ai.google.dev/) （AI Studio） / [cloud.google.com/vertex-ai/docs](https://cloud.google.com/vertex-ai/docs)（Vertex AI）

## 主力模型列表（2026）

| 模型 | 上下文 | 输出 | 用途 |
| --- | --- | --- | --- |
| `gemini-2.5-pro` | 2M | 8K | 旗舰，超长上下文 |
| `gemini-2.5-flash` | 1M | 8K | 日常生产 |
| `gemini-2.5-flash-lite` | 1M | 8K | 高并发 / 低成本 |
| `gemini-2.5-flash-image` | 1M | 8K | 图像生成（Nano Banana） |
| `gemini-live-2.5-flash-preview` | 32K | - | Live API（双向语音/视频） |

旧版（仍可用，建议迁）：

- `gemini-1.5-pro` / `gemini-1.5-flash` / `gemini-1.0-pro`

## 访问方式

| 方式 | 适合 |
| --- | --- |
| **Google AI Studio** | 开发者快速体验 + 免费配额 |
| **Google AI API（Gemini API）** | 个人开发者 / 中小应用 |
| **Vertex AI** | 企业级 / GCP 集成 |
| **Gemini App（gemini.google.com）** | 聊天 / Workspace 集成 |
| **OpenRouter / 代理** | 大陆用户 |

## 推荐资源

- [Gemini API 文档](https://ai.google.dev/gemini-api/docs)
- [Vertex AI 文档](https://cloud.google.com/vertex-ai/docs)
- [AI Studio Playground](https://aistudio.google.com/)
- [Cookbook](https://github.com/google-gemini/cookbook)
- [Status](https://status.cloud.google.com/)
