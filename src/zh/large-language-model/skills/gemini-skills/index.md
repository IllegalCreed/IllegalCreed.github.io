---
layout: doc
---

# Gemini Skills

Gemini Skills（`google-gemini/gemini-skills`）是 **Google Gemini 官方**维护的一组 Agent Skill，遵循 agentskills.io 开放格式，**Apache-2.0** 开源。它的目标是给 AI 编码 agent 补足「关于 Gemini API 自身的最新知识」——模型迭代、SDK 改名、最佳实践（如 thought signatures 思路签名）、新 API（Interactions / Live / Omni Flash）层出不穷，仅靠模型训练数据写出来的代码经常用过期模型 / 废弃 SDK。这组 skill 把 Gemini 团队的官方规范打包成可按需调用的技能，让 agent 生成的代码命中率从「裸跑」提升到 87%（Gemini 3 Flash）~96%（Gemini 3.1 Pro）。

## 评价

**优点**

- **官方出品**：`google-gemini` org 维护，规则直接来自 Gemini API 团队，覆盖最新的 3.x / Gemma 4 模型与 Interactions/Live/Omni Flash API
- **强制覆盖训练数据**：每个 skill 顶部 `Critical Rules` 明写「override your training data」，列出当前可用模型与 SDK，**禁用 `gemini-2.0-*`/`gemini-1.5-*` 与 `google-generativeai` 旧 SDK**
- **四 skill 分工清晰**：api-dev（基础）/ interactions-api（推荐主 API）/ live-api-dev（实时流式）/ omni-flash-api（视频生成）
- **配套脚本可执行**：omni-flash skill 自带 `generate_video.py`/`prep_video.py`/`inspect_video.py`/`upload_file.py`，端到端跑通文生视频/图生视频/视频编辑
- **配套 MCP 文档查询**：优先用 Google MCP 的 `search_docs` 工具实时拉官方文档，落空时回退 `llms.txt` 索引
- **跨 agent**：`npx skills add` / `npx ctx7 skills install` 装进 Claude Code / Cursor / Codex

**缺点 / 边界**

- **强绑定 Gemini 生态**：4 个 skill 全围绕 Google Gemini API，不涉及 OpenAI/Anthropic 等其它厂商
- **模型名频繁变更**：`gemini-3.5-flash`、`gemini-omni-flash-preview` 等带 preview 后缀，生产代码需自行核对最新可用版本
- **区域限制**：Omni Flash 的视频编辑上传在 EEA/瑞士/英国及部分美国州不可用
- **Live API 仅 WebSocket**：当前不支持 WebRTC，需通过 LiveKit/Pipecat 等第三方做 WebRTC 桥接

## 适用场景

- 写调用 Gemini API 的代码（文本/多模态/函数调用/结构化输出）——首选 `gemini-interactions-api`
- 做实时双向语音/视频流式对话（低延迟、打断处理、VAD、Live 翻译）——`gemini-live-api-dev`
- 做视频生成与编辑（文生视频、图生视频、首帧到视频、视频编辑）——`gemini-omni-flash-api`
- 只需基础模型信息与 SDK 速查（model 名、SDK 安装、4 语言 Quick Start）——`gemini-api-dev`
- 把 Claude Code/Cursor 等 agent 武装成「Gemini API 专家」，避免它写废弃代码

## 边界

- **不是单个技能，是 4 个技能的集合**：按任务类型分别激活，安装时可单选
- **不替代官方文档**：skill 是「让 agent 知道用什么模型/SDK」的索引层，复杂参数仍需拉 docs
- **不含 Vertex AI**：`vertex-ai-api-dev` 已迁出到 `google/skills` 主仓的 `skills/cloud/gemini-api`，本叶不覆盖
- **官方声明「非官方支持」**：仓库自述「This is not an officially supported Google product」，不参与 Google OSS 漏洞奖励

## 官方文档

[Gemini API 文档总览](https://ai.google.dev/gemini-api/docs) ｜ [Closing the knowledge gap with agent skills（团队博客）](https://developers.googleblog.com/closing-the-knowledge-gap-with-agent-skills/) ｜ [Coding agents + Gemini API MCP/Skills 指南](https://ai.google.dev/gemini-api/docs/coding-agents)

## GitHub 地址

[google-gemini/gemini-skills](https://github.com/google-gemini/gemini-skills)（Apache-2.0）

## 内容地图

- [入门](./getting-started) —— `npx skills add` 安装、4 个 skill 速览、模型/SDK 速查
- [指南](./guide-line) —— 4 个 skill 深入（api-dev 基础 / interactions 主 API / live 实时流式 / omni-flash 视频）+ 适用场景 + 反模式
- [参考](./reference) —— 4 skill 全表 + 模型清单 + 安装/许可/链接

## 幻灯片地址

<a href="/SlideStack/gemini-skills-slide/" target="_blank">Gemini Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=657" target="_blank" rel="noopener noreferrer">Gemini Skills 测试题</a>

