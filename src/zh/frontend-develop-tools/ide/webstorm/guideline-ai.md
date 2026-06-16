---
layout: doc
outline: [2, 3]
---

# AI 与 Junie

> 基于 JetBrains 官方文档（2026）。WebStorm 的 AI 分两个产品：**AI Assistant**（内联/补全/Chat）与 **Junie**（agentic 编码助手），共用一个 JetBrains AI 订阅。

## 两个 AI 产品

| 产品 | 定位 |
| --- | --- |
| **AI Assistant** | IDE 内 AI 助手：代码补全、Next edit suggestions、Chat（含 agent 模式）、commit message 生成、解释/文档/重命名建议 |
| **Junie** | 独立的 **agentic 编码 agent**（Marketplace 安装，设置在 `Settings | Tools | Junie`） |

## Junie 的两种模式

| 模式 | 行为 |
| --- | --- |
| **Code mode** | 把任务拆成多步计划并自主执行：跑终端命令、建文件、改代码、跑测试、验证改动 |
| **Ask mode** | **只读**：探索文件、分析代码、理解结构，但**不改代码**（提问/定计划/头脑风暴） |

- **审批控制**：终端命令、执行代码、MCP 工具等敏感动作需**显式批准**；**Brave Mode** 绕过审批（官方标注 not recommended）；**Action Allowlist** 用正则预授权
- **Guidelines**（项目级持久上下文）：`.junie/AGENTS.md`（也支持 `.junie/guidelines.md` 或根 `AGENTS.md`），可纳入版本控制
- 支持 **MCP**（Model Context Protocol）接入外部工具

## 2025.1 起的 AI 免费政策

::: tip 关键边界（易错）
2025.1 新增 **AI Free** 层，对所有用户免费、随 IDE 捆绑，含 **无限代码补全 + 本地 AI 模型**；但**云端 AI 与 Junie 是按额度（credit）使用**。上方有 **AI Pro / AI Ultimate** 提升配额。
:::

注意区分两条独立政策：

- **AI Free**：AI 功能的免费层（无限补全 + 本地模型免费，云端按额度）
- **WebStorm 非商业免费**：IDE 本身对非商业用途免费（2024 起）

> 二者无关——IDE 免费不代表云端 AI 无限。

## 支持的模型

- **云端**：Anthropic Claude、OpenAI GPT / o-series、Google Gemini、xAI Grok
- **本地**：通过 **Ollama** 与 **LM Studio** 托管本地模型
- **BYOK**：自带第三方 API Key

> 本地模型 ≠ JetBrains AI Service 云端；隐私敏感场景可走本地模型。
