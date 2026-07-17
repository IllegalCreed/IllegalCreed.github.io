---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 vercel/ai 官方 AI SDK 技能（`use-ai-sdk`、`migrate-ai-sdk-v6-to-v7`）与 ai-sdk.dev 文档、仓库 `AGENTS.md` 编写。

## 速查

- **use-ai-sdk 心法**：别信记忆 → 读 `node_modules/ai/docs/`、`node_modules/ai/src/`（版本匹配）；provider/框架包各自带 `node_modules/@ai-sdk/<name>/docs/`
- **核心 API**：`generateText` / `streamText`（文本）、`generateObject` / `streamObject`（结构化）、`tool()`（工具）、`ToolLoopAgent`（agent）、`embed` / `embedMany`（嵌入）
- **统一 provider**：换 `@ai-sdk/openai`↔`@ai-sdk/anthropic`↔`@ai-sdk/google` 通常只改一行
- **AI Gateway**：一个 API 接多家，`provider/model` 字符串，`AI_GATEWAY_API_KEY` / OIDC；模型 ID 用 `curl .../v1/models` 拉取别凭记忆
- **框架集成**：`@ai-sdk/react|vue|svelte|angular` 的 `useChat` / `useCompletion`；从 agent 定义推断 UI 消息类型
- **v6→v7 迁移**：`system`→`instructions`、`fullStream`→`stream`、`onFinish`→`onEnd`、`stepCountIs`→`isStepCount`、`experimental_*` 去前缀、多步结果默认含全部步骤（旧行为用 `finalStep`）、Node ≥ 22 + ESM-only
- **DevTools**：抓 AI SDK 调用（请求/响应/工具/token/多步），独立包、仅本地开发
- **反模式**：凭记忆写 API、硬编码模型 ID、手搓工具循环、一次装全部 provider 包

## use-ai-sdk：把 agent 锚到「版本匹配的一手资料」

这是本叶最核心的一招。`use-ai-sdk` 的 `SKILL.md` 开宗明义：

> **别信你自己的记忆。** 你记得的 AI SDK 用法很可能已过时——API 频繁改名、删除、新增，训练数据里几乎必然含废弃 API 和已下线的模型 ID。**永远不要凭记忆写 AI SDK 代码。**

它给出的正解是读**随包发行、与安装版本一致**的文档和源码：

1. 确认装了 `ai` 包（`node_modules/ai/` 存在），只装 `ai`——provider 包（`@ai-sdk/openai`）和框架包（`@ai-sdk/react`）等任务需要时再装
2. 读 / grep 随包文档 `node_modules/ai/docs/` 和源码 `node_modules/ai/src/`
3. provider 与框架包各自带文档：`node_modules/@ai-sdk/<name>/docs/`
4. 包里找不到再查 [ai-sdk.dev/docs](https://ai-sdk.dev/docs)——任意文档页 URL 追加 `.md` 得 markdown，或用 `https://ai-sdk.dev/api/search-docs?q=你的查询` 搜索
5. 文档/源码都找不到支撑就**明说找不到**，不许猜

> 为什么强调「版本匹配」？因为 `node_modules` 里的文档**永远和你实际装的版本一致**——比任何外部教程或模型记忆都可靠。

## AI SDK 核心 API

技能引导 agent 用这些统一 API（下面是形态示意，实际以随包文档为准）：

```ts
import { generateText, streamText, generateObject } from "ai";

// 一次性文本
const { text } = await generateText({ model, prompt: "你好" });

// 流式文本
const result = streamText({ model, prompt: "讲个故事" });
for await (const chunk of result.textStream) process.stdout.write(chunk);

// 结构化输出（按 schema 校验）
const { object } = await generateObject({ model, schema, prompt: "抽取要点" });
```

- **`generateText` / `streamText`**：文本生成，流式配前端聊天
- **`generateObject` / `streamObject`**：结构化输出，返回按 schema 校验的对象
- **`tool()` + 工具调用**：声明工具，模型自动决定何时调用
- **`embed` / `embedMany`**：向量嵌入，做检索 / RAG
- **`ToolLoopAgent`**：内置 agent 抽象，封装「调模型→执行工具→再调模型」的循环

## 统一 provider 接口

AI SDK 的招牌能力：**用同一套代码接不同模型厂商**。`vercel/ai` 是 monorepo，`packages/<provider>` 下有 openai / anthropic / google / azure / amazon-bedrock 等实现，都实现同一份 `@ai-sdk/provider` 接口规范。

```ts
// 从 OpenAI 换到 Anthropic，通常只改这一行
import { openai } from "@ai-sdk/openai";      // 之前
import { anthropic } from "@ai-sdk/anthropic"; // 之后
```

业务代码（`generateText` 等调用）几乎不用动——这正是「统一接口」的价值。

## AI Gateway：最快的起步方式

技能明确推荐用 **AI Gateway** 起步：它用**一个 API** 接 OpenAI / Anthropic / Google 等多家模型，**免装 provider 包、免管多把密钥**。

1. 用 OIDC（Vercel 部署场景）或 AI Gateway API key 鉴权
2. 通过 `AI_GATEWAY_API_KEY` 环境变量提供给应用
3. 用 `provider/model` 字符串引用模型

**模型 ID 也别凭记忆**——模型频繁上线/下线。写代码前先拉当前列表：

```bash
# 全部可用模型
curl -s https://ai-gateway.vercel.sh/v1/models | jq -r '.data[].id'
```

多版本并存时优先版本号最高的。

## agent：用内置抽象，别手搓循环

技能建议用 SDK 内置的 agent 抽象（如 `ToolLoopAgent`）而不是自己写工具调用循环。消费 agent 时，为端到端类型安全，**从 agent 定义推断 UI 消息类型**（在客户端 `useChat` 上用）。具体 API 以随包 `node_modules/ai/docs/` 的 agents 章节为准。

## 框架集成：useChat / useCompletion

`packages/<framework>` 提供 react / vue / svelte / angular / rsc 的 UI 集成。前端用 `useChat`（聊天）、`useCompletion`（补全）对接后端的流式接口。

> ⚠️ `useChat` 是 AI SDK 里**改动最频繁**的 API 之一——技能特别提醒写客户端代码时格外小心版本，务必对照当前 `@ai-sdk/react` 的随包文档。

## migrate-ai-sdk-v6-to-v7：迁移工作清单

`migrate-ai-sdk-v6-to-v7` 把应用从 AI SDK 6.x 升到 7.0，以仓库 `content/docs/08-migration-guides/23-migration-guide-7-0.mdx` 为准，技能本身是可执行的工作清单。

**工作流**：先有干净备份 → 查 `package.json`/lockfile 认清装了哪些 `ai`/`@ai-sdk/*` 包 → 升级到最新（用 OTel 才加 `@ai-sdk/otel`）→ 满足运行时假设（**Node ≥ 22**、**ESM-only**，`require()` 改 `import`、加 `"type": "module"`）→ 搜 v6 老写法、只改存在的代码、跑类型检查 + 定向测试。**优先保持行为不变**。

**高频改名（择要）**：

| v6 | v7 |
| --- | --- |
| 顶层 `system` | `instructions`（`generateText`/`streamText`/`generateObject`/`streamObject`/`streamUI`） |
| `StreamTextResult.fullStream` | `stream` |
| `onFinish` / `onStepFinish` | `onEnd` / `onStepEnd` |
| `stepCountIs` | `isStepCount` |
| `experimental_*`（customProvider/generateImage/transcribe/output…） | 去掉 `experimental_` 前缀 |
| `experimental_telemetry` / `experimental_include` | `telemetry` / `include` |

**语义变化（要判断）**：多步结果的顶层 `content` / `toolCalls` / `usage` 等**现在包含全部步骤**；想要旧的「只取最后一步」行为，改用 `result.finalStep.*`。OpenTelemetry 移出 `ai`，改装 `@ai-sdk/otel`。MCP 的 `redirect` 默认变 `'error'`。Google 的 `createGoogleGenerativeAI` 改名 `createGoogle`。

## DevTools

AI SDK DevTools 抓取你的 AI SDK 调用——请求、响应、工具调用、token 用量、多步运行，让你精确看清 agent 到底做了什么。它是**独立包**，**仅用于本地开发调试**。

## 反模式

- **凭记忆写 API**：技能的头号禁忌——先读版本匹配文档
- **硬编码模型 ID**：模型会下线，先 `curl` 拉当前列表
- **手搓工具调用循环**：用 `ToolLoopAgent` 等内置抽象
- **一上来装全部 provider 包**：先只装 `ai`，provider/框架包按需再装
- **过度指定选项**：只设与默认值不同的选项，默认值查文档/源码
- **把本叶当批 3 用**：这里没有 deploy/optimize，那是 [Vercel Agent Skills](../vercel-agent-skills/)

## 下一步

- [参考](./reference) —— 技能全表、关键 API、安装选项、版本 v7、许可、链接
- 上游：[AI SDK 文档](https://ai-sdk.dev/docs) · [编码 agent 技能](https://ai-sdk.dev/docs/getting-started/coding-agents)
