---
layout: doc
---

# Claude

Anthropic 推出的大语言模型家族，主打**安全可控 + 长上下文 + 工具使用**。当前主力是 Claude 4 系列（Opus 4.7 / Sonnet 4.6 / Haiku 4.5），覆盖「旗舰复杂任务」「日常生产」「轻量快速」三档。在 AI 编码与 Agent 场景被认为是综合能力最强的闭源模型之一。

## 评价

**优点**

- **编码能力顶尖**：HumanEval / SWE-bench / Aider 等编码基准长期榜首
- **长上下文**：Opus 4.7 标配 200K，可选 1M 上下文版（`claude-opus-4-7[1m]`）
- **工具使用一类公民**：Tool Use API 接 function calling 极顺滑，MCP 协议自家推
- **Constitutional AI 训练**：拒绝率低（不像 GPT 过度谨慎），同时安全护栏可靠
- **价格分档清晰**：Opus 复杂 / Sonnet 日常 / Haiku 简单，按需选不浪费
- **Prompt Caching**：长系统提示重复用时缓存命中 token 90% 折扣
- 多模态：图像 + PDF + 截图 都识别
- Agent SDK 官方支持，构建 AI 应用零摩擦

**缺点**

- 闭源，仅 Anthropic API / Amazon Bedrock / Google Vertex AI 提供
- 中国大陆不直接服务，需自备网络 / 代理
- 价格相对 OpenAI 略贵（Opus > GPT 旗舰）
- 部分领域弱于专项模型（代码生图 / 实时搜索）
- 中文能力略弱于英文（仍可用，但比 GPT-4o / Gemini 略逊）

## 文档地址

[docs.claude.com](https://docs.claude.com/) / [Anthropic API](https://docs.claude.com/en/api/overview)

## 模型列表（2026 当前）

| 模型 | 上下文 | 用途 | $/M 输入 | $/M 输出 |
| --- | --- | --- | --- | --- |
| `claude-opus-4-7` | 200K | 旗舰复杂任务 | $15 | $75 |
| `claude-opus-4-7[1m]` | 1M | 整本仓库 / 长会话 | $30 | $150 |
| `claude-sonnet-4-6` | 200K | 日常生产 | $3 | $15 |
| `claude-haiku-4-5-20251001` | 200K | 简单 / 快速 | $0.80 | $4 |

旧版（仍可调，逐步 retire）：

- `claude-opus-4`、`claude-sonnet-3-5`、`claude-haiku-3-5`

## 访问方式

| 方式 | 适合 | 定价 |
| --- | --- | --- |
| **Anthropic API** | 开发者 / 应用集成 | 按 token |
| **claude.ai** | 网页聊天 | Free / Pro $20 / Max $100-200 |
| **Claude Code** | CLI / IDE 编码 | 包含在 Pro / Max 订阅 |
| **Amazon Bedrock** | 已有 AWS 体系 | Bedrock 定价 |
| **Google Vertex AI** | 已有 GCP 体系 | Vertex 定价 |
| **OpenRouter / Poe / 各代理** | 大陆用户 | 代理服务自行定价 |

## 推荐资源

- [Anthropic 官方文档](https://docs.claude.com/)
- [API Reference](https://docs.claude.com/en/api/overview)
- [Anthropic 博客](https://www.anthropic.com/news)
- [Cookbook 仓库](https://github.com/anthropics/anthropic-cookbook)
- [模型卡](https://www.anthropic.com/news/claude-3-5-sonnet) （各版本发布文档）


## 幻灯片地址

<a href="/SlideStack/claude-model-slide/" target="_blank">Claude</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=claude" target="_blank" rel="noopener noreferrer">Claude 测试题</a>
