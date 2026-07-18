---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 google-gemini/gemini-skills 主分支（2026-07）的 README 与各 skills/ 编写。Apache-2.0。

## 速查

- **4 skill**：`gemini-api-dev`（基础·模型/SDK 速查）·`gemini-interactions-api`（推荐主 API：文本/多轮/流式/Agent/Deep Research）·`gemini-live-api-dev`（实时双向音频/视频/文本流，WebSocket）·`gemini-omni-flash-api`（视频生成/编辑）
- **装**：`npx skills add google-gemini/gemini-skills`（Vercel CLI）或 `npx ctx7 skills install /google-gemini/gemini-skills`（Context7 CLI）；可 `--skill <name>` 单装
- **当前模型**（核心）：`gemini-3.5-flash`（1M tokens，通用）·`gemini-3.1-pro-preview`（复杂推理）·`gemini-3.1-flash-lite-preview`（低成本）·`gemini-3-pro-image-preview`（Nano Banana Pro 图生）·`gemini-omni-flash-preview`（视频）·`gemini-3.1-flash-live-preview`（实时）·`gemma-4-31b-it`（开源）
- **当前 SDK**：Python `google-genai`、JS/TS `@google/genai`、Go `google.golang.org/genai`、Java `com.google.genai:google-genai`；**禁用** `google-generativeai`/`@google/generative-ai` 旧 SDK
- **禁用模型**：`gemini-2.0-*`、`gemini-1.5-*`、`gemini-2.5-*`（interactions 视角）均已废弃
- **门面效果**：官方评估「加 skill 后生成正确 API 代码命中率」从裸跑到 87%（Gemini 3 Flash）/ 96%（Gemini 3.1 Pro）
- **MCP 优先**：若 agent 装了 Google MCP `search_docs` 工具，skill 要求**只**用它拉文档，不手动 fetch URL

## 定位：补模型的「关于自己」的知识盲区

LLM 训练数据是静态的，而 Gemini API 迭代极快——新模型（3.x / Gemma 4）、新 SDK（`google-genai` 取代 `google-generativeai`）、新 API（Interactions / Live / Omni Flash）、新最佳实践（thought signatures 思路签名）层出不穷。模型不知道自己被怎么调用、不知道 SDK 已改名，写出来的代码经常用废弃模型。**这组 skill 就是补这个缺口**——在每个 SKILL.md 顶部用 `> [!IMPORTANT] These rules override your training data` 强制覆盖训练知识，列出当前可用模型/SDK，并禁用旧版本。

## 安装

二选一，都支持交互式浏览或 `--skill` 单装：

```bash
# Vercel skills CLI（skills.sh）
npx skills add google-gemini/gemini-skills --list              # 浏览
npx skills add google-gemini/gemini-skills --skill gemini-interactions-api

# Context7 skills CLI
npx ctx7 skills install /google-gemini/gemini-skills
npx ctx7 skills install /google-gemini/gemini-skills gemini-interactions-api
```

装后 agent 在检测到 Gemini 相关任务时自动激活；也可在 prompt 里直接说「use the gemini-interactions-api skill」显式触发。

## 4 个 skill 速览

| Skill | 何时用 | 一句话 |
| --- | --- | --- |
| `gemini-api-dev` | 基础：模型名、SDK 安装、4 语言 Quick Start | 通用入口，覆盖 Gemini/Gemma 4 模型、多模态、函数调用、结构化输出 |
| `gemini-interactions-api` | 写文本生成/多轮/流式/Agent/Deep Research/图像/视频生成 | **推荐的现代主 API**，Python+TS；支持 Antigravity / Deep Research 等 managed agent |
| `gemini-live-api-dev` | 实时低延迟双向音/视频/文本流 | WebSocket、VAD、原生音频思考、Live Translate、function calling |
| `gemini-omni-flash-api` | 视频生成与编辑（文生/图生/首帧/编辑） | 用 `gemini-omni-flash-preview` + 自带脚本端到端跑通 |

## 最小可跑代码（interactions-api）

```python
from google import genai

client = genai.Client()

interaction = client.interactions.create(
    model="gemini-3.5-flash",
    input="Tell me a short joke about programming."
)
print(interaction.output_text)
```

多轮上下文：用 `previous_interaction_id=interaction1.id` 链接——服务端默认 `store=True` 记住上下文（付费层 55 天，免费层 1 天）。

## 文档查询：MCP 优先

每个 skill 都规定了文档查询顺序：

1. **若 agent 装了 Google MCP `search_docs` 工具**：**只**用它，信任结果为唯一权威——比 URL fetch 更准、更省 token
2. **没装 MCP 时（fallback）**：fetch `https://ai.google.dev/gemini-api/docs/llms.txt` 拿索引，再拉具体页（如 `function-calling.md.txt`、`interactions.md.txt`、`live.md.txt`）

> 这个设计让 skill 既能在 MCP 环境下走最短路径，也能在裸 agent 环境下保证可查证。

## 下一步

- [指南](./guide-line) —— 4 个 skill 深入、适用场景、反模式（禁用模型/SDK 清单）
- [参考](./reference) —— 4 skill 全表 + 模型清单 + 安装/许可/链接
