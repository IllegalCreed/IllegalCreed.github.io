---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 vercel/ai 官方 AI SDK 技能（`skills/use-ai-sdk`、`skills/migrate-ai-sdk-v6-to-v7`）主分支（2026-07）与 ai-sdk.dev 文档编写。

## 速查

- **装**：`npx skills add vercel/ai`（Claude Code / Codex / OpenCode / Cursor 等，遵 Agent Skills 格式）
- **本叶 ≠ 批 3**：这是 **`vercel/ai` 本体仓的 AI SDK 技能**（用 AI SDK 建应用/迁移），不是 `vercel-labs/agent-skills`（deploy/优化那套）
- **两个用户向技能**：`use-ai-sdk`（建 AI 功能）+ `migrate-ai-sdk-v6-to-v7`（v6→v7 迁移）
- **核心哲学**：**别信记忆**——AI SDK 变太快，agent 必须读 `node_modules/ai/docs/` 与 `node_modules/ai/src/`（**随包发行、版本匹配**）
- **AI SDK 是什么**：npm 上的 `ai` 包，TS/JS 工具包，**统一接口**跨多家 provider 做文本生成/结构化输出/工具调用/agent/嵌入 + 框架 UI 集成
- **AI Gateway 起步**：一个 API 接多家模型，`provider/model` 字符串引用，`AI_GATEWAY_API_KEY` 或 OIDC 鉴权
- **渐进披露**：启动只加载技能 name+description，任务需要时才拉全文
- **版本**：当前主版本 **v7**（Node ≥ 22、ESM-only）；**Apache-2.0**

## 定位：这是「用 AI SDK 的技能」

Vercel AI SDK Skills 是随 `vercel/ai`（AI SDK 主仓库）一起维护的官方 agent 技能，放在仓库的 `skills/` 目录。它解决一个很具体的痛点：**LLM 写 AI SDK 代码时特别容易用过时 API**——因为 AI SDK 迭代极快，`useChat` 这类 UI hook 是改动最频繁的 API 之一，模型的训练数据几乎必然落后。技能通过把 agent 锚定到「与安装版本一致的一手文档 / 源码」来治这个病。

::: warning 与批 3 的 Vercel Agent Skills 别混
- **本叶**（Vercel AI SDK Skills）= `vercel/ai` 仓库的 **AI SDK 技能**，Apache-2.0，教 agent 用 **AI SDK** 建应用 / 迁移。
- **批 3**（[Vercel Agent Skills](../vercel-agent-skills/)）= `vercel-labs/agent-skills`，MIT，是 deploy-claimable / optimize / react-best-practices 等**通用工程规范**技能集。

不同仓、不同叶、不同许可，覆盖内容完全不同。
:::

## 安装

```bash
npx skills add vercel/ai
```

- 装进 agent 专属目录（`.claude/skills`、`.codex/skills` 等），多 agent 共享时用 symlink
- `-a` 指定 agent 并装到通用的 `.agents/skills` 目录
- `-y` 非交互安装
- 支持 Claude Code、Codex、OpenCode、Cursor，以及任何遵循 Agent Skills 格式的环境

## AI SDK 是什么

AI SDK 是 Vercel 出品、npm 上的 `ai` 包——一个用于建 AI 应用的 TypeScript/JavaScript 工具包。它提供**跨模型 provider 的统一 API**，覆盖：

- **文本生成**：`generateText`（一次性）/ `streamText`（流式）
- **结构化输出**：`generateObject` / `streamObject`（按 schema 校验的 JSON）
- **工具调用**：`tool()` 声明工具，模型自动调用
- **agent**：内置 `ToolLoopAgent` 抽象，免手搓工具循环
- **嵌入**：`embed` / `embedMany`（配 RAG）
- **框架 UI 集成**：`@ai-sdk/react` / vue / svelte / angular 的 `useChat`、`useCompletion`

换 provider 通常只需改一行——把 `@ai-sdk/openai` 换成 `@ai-sdk/anthropic` 或 `@ai-sdk/google`，其余代码不动。

## 两个用户向技能

| 技能 | 何时用 | 一句话 |
| --- | --- | --- |
| `use-ai-sdk`（`name: ai-sdk`） | 加 AI 功能、问 AI SDK 用法 | 触发词含 `generateText`/`streamText`/`useChat`/「build an agent」；教你读版本匹配文档、用 AI Gateway、用 `ToolLoopAgent` |
| `migrate-ai-sdk-v6-to-v7` | 升级 AI SDK | 一份 v6→v7 迁移工作清单（改名、语义变化、ESM 化） |

> 仓库 `skills/` 里还有 `add-provider-package`、`adr-skill`、`update-provider-models` 等**贡献者向**技能，面向给 SDK 提代码的人；普通应用开发者主要用上面两个。

## 渐进披露

安装后，agent 启动时**只加载技能的 name 和 description**（一句话），只有当任务真正相关时才把 `SKILL.md` 全文拉进上下文——这样 agent 保持快而专注，不被一堆没用到的说明撑爆上下文。这是 Agent Skills 开放格式的通用机制。

## 第一次用：让 agent 帮你加个流式聊天

装好技能后，直接自然语言描述需求即可，例如：

```text
用 AI SDK 给我加一个流式聊天接口和前端 useChat 页面
```

`use-ai-sdk` 会引导 agent：先确认装了 `ai` 包 → 读 `node_modules/ai/docs/` 里**当前版本**的 `streamText` / `useChat` 用法 → 若未指定 provider，用 AI Gateway + `provider/model` 起步 → 写完跑类型检查。全程不凭记忆，避免写出已废弃的 API。

## 下一步

- [指南](./guide-line) —— 核心 API 详解、统一 provider、AI Gateway、agent、框架集成、v6→v7 迁移、反模式
- [参考](./reference) —— 技能全表、关键 API、安装选项、版本 v7、许可 Apache-2.0、链接
