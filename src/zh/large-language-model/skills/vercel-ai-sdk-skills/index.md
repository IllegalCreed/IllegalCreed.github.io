---
layout: doc
---

# Vercel AI SDK Skills

Vercel AI SDK Skills 是 `vercel/ai` 仓库随源码一起维护的官方 agent 技能——用 `npx skills add vercel/ai` 安装。它把「怎样正确地用 AI SDK 建应用」和「怎样把应用从 v6 升级到 v7」这类知识，打包成可按需调用的技能，让 Claude Code / Codex / Cursor 等 agent 在写 AI SDK 代码时不再凭记忆瞎猜，而是对照**与安装版本匹配的一手文档和源码**下笔。核心是两个用户向技能：`use-ai-sdk`（frontmatter `name: ai-sdk`，回答 AI SDK 问题、帮你建 `generateText` / `streamText` / 工具调用 / agent / RAG 等功能）与 `migrate-ai-sdk-v6-to-v7`（把应用从 AI SDK 6.x 迁移到 7.0）。

> **⚠️ 与批 3 的 Vercel Agent Skills 严格区分**：本叶是 **`vercel/ai` 本体仓的 AI SDK 技能**（教 agent 用 **AI SDK** 建应用 / 做迁移），源在 AI SDK 主仓库、**Apache-2.0**。它**不是**批 3 的 [Vercel Agent Skills](../vercel-agent-skills/)（`vercel-labs/agent-skills`，那是 deploy / optimize / react 通用规范的技能集、MIT）。两者**不同仓、不同叶、不同许可**，别混。

## 评价

**优点**

- **版本匹配、拒绝幻觉**：`use-ai-sdk` 的核心哲学是「**别信你自己的记忆**」——AI SDK 迭代极快，API 频繁改名/删除/新增，训练数据里的旧 API 几乎必然过时。技能强制 agent 读**随包发行、与安装版本一致**的 `node_modules/ai/docs/` 与 `node_modules/ai/src/`，从源头治 LLM 写 AI SDK 代码的幻觉
- **官方随源码维护**：技能就活在 `vercel/ai` 主仓的 `skills/` 目录，跟着 SDK 一起演进，不会像外部教程那样脱节
- **AI Gateway 快速起步**：技能引导用 AI Gateway——一个 API 接 OpenAI / Anthropic / Google 等多家模型，免装 provider 包、免管多把密钥，用 `provider/model` 字符串引用模型
- **agent 抽象优先**：教你用内置 `ToolLoopAgent` 而非手搓工具调用循环，并从 agent 定义推断 UI 消息类型做端到端类型安全
- **迁移有清单**：`migrate-ai-sdk-v6-to-v7` 是一份可执行的 v6→v7 迁移工作清单（`system`→`instructions`、`fullStream`→`stream`、`onFinish`→`onEnd`、多步结果形状变化等）
- **跨 agent**：`npx skills add vercel/ai` 装进 Claude Code / Codex / OpenCode / Cursor 等，遵循 Agent Skills 开放格式 + 渐进披露

**缺点 / 边界**

- **强绑 AI SDK 生态**：只服务于用 `ai` 这个 TS/JS 库建 AI 应用，非 AI SDK 项目用不上
- **技能不替你写业务**：它保证你用**对**的 API，但产品逻辑、prompt 设计、模型选型仍靠你
- **仓库内含贡献者向技能**：`add-provider-package`、`adr-skill` 等是给 SDK 贡献者用的，普通应用开发者主要用 `use-ai-sdk` + 迁移技能
- **不是 UI 组件库、不是部署工具**：与批 3 的 deploy/optimize 技能职责完全不同

## 适用场景

- 让 agent 帮你在应用里加 AI 功能（聊天、文本生成、结构化输出、工具调用、agent、RAG、嵌入）而不写出过时 API
- 想用统一接口接多家模型 / 用 AI Gateway 起步
- 把现有 AI SDK 应用从 6.x 升级到 7.0
- 建 `useChat` / `useCompletion` 前端聊天界面（react/vue/svelte/angular）

## 边界

- **是「用 AI SDK 的技能」，不是 AI SDK 本身**：SDK 是 `ai` 包，技能是帮 agent 正确用它的说明书
- **版本敏感**：技能刻意不固化 API 细节，而是把 agent 指向随包文档——因为 SDK 变得太快
- **模型 ID 也别凭记忆**：技能要求用 `curl` 拉取 AI Gateway 当前模型列表再写代码
- **贡献者技能非日常**：`update-provider-models`、`major-version-mode` 等面向 SDK 维护者

## 官方文档

[AI SDK 文档](https://ai-sdk.dev/docs) ｜ [编码 agent 技能安装](https://ai-sdk.dev/docs/getting-started/coding-agents) ｜ [迁移指南](https://ai-sdk.dev/docs/migration-guides)

## GitHub 地址

[vercel/ai](https://github.com/vercel/ai)（Apache-2.0）· 技能在仓库 `skills/` 目录

## 内容地图

- [入门](./getting-started) —— `npx skills add vercel/ai` 安装、AI SDK 是什么、两个用户向技能、渐进披露
- [指南](./guide-line) —— AI SDK 核心 API、统一 provider、AI Gateway、agent、框架集成、v6→v7 迁移、反模式
- [参考](./reference) —— 技能全表、关键 API、安装选项、版本 v7、许可 Apache-2.0、链接

## 幻灯片地址

<a href="/SlideStack/vercel-ai-sdk-skills-slide/" target="_blank">Vercel AI SDK Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=624" target="_blank" rel="noopener noreferrer">Vercel AI SDK Skills 测试题</a>
