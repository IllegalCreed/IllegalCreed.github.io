---
layout: doc
---

# GPT

OpenAI 推出的大语言模型家族，自 2022 年 ChatGPT 后引爆 LLM 浪潮。当前主力是 GPT-5 系列（含 o-series 推理增强）和 GPT-4o 多模态系列。在**多模态全栈（文本 / 图像 / 音频 / 视频）+ 内置工具（web search / code interpreter / image generation）+ 结构化输出**方面接口能力最全面。

::: tip 与 Claude / Gemini 对比的核心差异

- **GPT 强在多模态全栈**（图、音、视频、TTS、Realtime API 实时语音对话）
- **GPT 强在内置工具**（web_search / code_interpreter / image_generation 内置在 API 里，无需自己接 MCP）
- **GPT 强在结构化输出**（`response_format: { type: "json_schema" }` 一类公民）
- **Claude 强在编码 / Agent / MCP**
- **Gemini 强在超长上下文（1-2M）和大规模 implicit cache**

:::

## 评价

**优点**

- **多模态最全**：文本 + 视觉（图）+ 音频（输入 / 输出）+ 视频帧 + Realtime API（实时双向语音）
- **内置工具一类公民**：`web_search` / `code_interpreter` / `image_generation` 直接在 API 调用——无需自己接外部 MCP
- **结构化输出 (Structured Outputs)**：传入 JSON Schema，强保证输出严格匹配——业界最早一类支持
- **o-series 推理模型**：内置 chain-of-thought thinking，复杂数学 / 物理 / 推理基准业界顶尖
- **生态最广**：第三方集成 / 教程 / 工具最多
- **Realtime API**：低延迟双向语音对话（< 500ms 首响应），构建语音 Agent 首选
- **大陆访问相对友好**：OpenAI 官方未提供大陆服务，但 Azure OpenAI 香港 region 等替代多

**缺点**

- 编码任务弱于 Claude 4.7（SWE-bench 等基准 Claude 略胜）
- API 设计**两套**：旧 `chat.completions` + 新 `responses`（Agent SDK 用）—— 接口分裂
- 价格策略复杂：模型多 + flex tier + cache + batches 矩阵难记
- Constitutional 不足，**拒绝率偏高**（边界场景过度谨慎）
- 默认 model 选择困难（GPT-5 vs o1 vs o3 vs GPT-4o vs GPT-4o-mini ...）

## 文档地址

[platform.openai.com/docs](https://platform.openai.com/docs) / [API Reference](https://platform.openai.com/docs/api-reference)

## 主力模型列表（2026）

| 模型 | 上下文 | 输出 | 用途 |
| --- | --- | --- | --- |
| `gpt-5` | 256K | 32K | 旗舰复杂任务 |
| `gpt-5-mini` | 256K | 32K | 日常生产 |
| `gpt-5-nano` | 128K | 16K | 简单 / 高并发 |
| `o3` | 200K | 100K | 深度推理（数学 / 物理 / 复杂逻辑） |
| `o4-mini` | 200K | 64K | 推理 + 低成本 |
| `gpt-4o` | 128K | 16K | 多模态（图 + 音 + 视频） |
| `gpt-4o-mini` | 128K | 16K | 多模态低成本 |
| `gpt-4o-realtime-preview` | 128K | - | Realtime API（语音） |

旧版仍提供：`gpt-4-turbo` / `gpt-3.5-turbo`，多数场景已建议迁移到 GPT-5 系列。

## 访问方式

| 方式 | 适合 |
| --- | --- |
| **OpenAI API** | 开发者 / 应用集成 |
| **ChatGPT 网页** | 聊天 / 写作 / 图像 / Code Interpreter |
| **ChatGPT Plus / Pro / Team / Enterprise** | 订阅高级模型 / DeepResearch |
| **Azure OpenAI** | 企业 / 香港 / 新加坡 region 部署 |
| **OpenRouter / 代理服务** | 大陆用户 |

## 推荐资源

- [OpenAI Cookbook](https://github.com/openai/openai-cookbook)
- [Platform 文档](https://platform.openai.com/docs)
- [模型对比](https://platform.openai.com/docs/models)
- [价格](https://platform.openai.com/docs/pricing)
- [Status](https://status.openai.com/)


## 幻灯片地址

<a href="/SlideStack/gpt-slide/" target="_blank">GPT</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=gpt" target="_blank" rel="noopener noreferrer">GPT 测试题</a>
