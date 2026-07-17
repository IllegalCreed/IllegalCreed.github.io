---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 assistant-ui/assistant-ui 官方 skill（`packages/cli/plugin/skills/assistant-ui/SKILL.md`）与仓库 README 编写。

## 速查

- **skill 位置**：`packages/cli/plugin/skills/assistant-ui/SKILL.md`（CLI plugin 内的官方产品 skill）
- **接入**：新项目 `npx assistant-ui@latest create`；已有项目 `npx assistant-ui init --yes`
- **组件**：`npx shadcn@latest add "https://r.assistant-ui.com/chat/b/ai-sdk-quick-start/json"`（预设）或 `assistant-ui/thread`（单个）
- **runtime**：`useChatRuntime({ api })` + `<AssistantRuntimeProvider>` + `<Thread />`
- **核心包**：`@assistant-ui/react` + `@assistant-ui/react-ai-sdk`
- **工具**：`defineToolkit` + `externalTool()` + `Tools()` + `useAui`（旧 `makeAssistant*` 已弃）
- MIT ｜ 作者 Yonom ｜ homepage `assistant-ui.com`

## skill 内容清单（4 步）

| 步骤 | 做什么 | 关键命令 / API |
| --- | --- | --- |
| Step 1 查 setup | 看有无 `components.json` + `@assistant-ui/react` | `npx assistant-ui init --yes` |
| Step 2 加组件 | shadcn registry copy 源码进项目 | `npx shadcn@latest add assistant-ui/thread` |
| Step 3 配 runtime | 挂 runtime + 后端 API 路由 | `useChatRuntime` · `AssistantRuntimeProvider` · `streamText().toDataStreamResponse()` |
| Step 4 工具（可选） | 后端定义、前端渲染工具 UI | `tool()` · `defineToolkit` · `externalTool()` · `Tools()` · `useAui` |

## 核心包全表

| 包 | 用途 |
| --- | --- |
| `@assistant-ui/react` | 核心 React 组件与 primitives |
| `@assistant-ui/react-ai-sdk` | Vercel AI SDK 集成 |
| `@assistant-ui/react-markdown` | Markdown 渲染 |
| `@assistant-ui/react-syntax-highlighter` | 代码高亮 |
| `@assistant-ui/ui` | 预置 shadcn/ui 组件集 |
| `@assistant-ui/styles` | 预置 CSS（给非 Tailwind 用户） |

## Backends（runtime）全表

| 集成 | 包 / runtime hook |
| --- | --- |
| Vercel AI SDK | `@assistant-ui/react-ai-sdk`（`useChatRuntime`） |
| LangGraph / LangChain | `@assistant-ui/react-langgraph` · `@assistant-ui/react-langchain`（`useLangGraphRuntime`） |
| 自定义数据流 | `useDataStreamRuntime` |
| AG-UI / A2A 协议 | `@assistant-ui/react-ag-ui` · `@assistant-ui/react-a2a` |

## primitives / 组件速览

- **可组合 primitives**：`Thread`（对话主体）、`Message`（单条消息）、`Composer`（输入框）、`ThreadList`（会话列表）、`ActionBar`（操作栏）等
- **两种粒度**：底层无样式 primitives（逐像素自定义）+ CLI copy 进项目的带样式 shadcn/ui 主题（开箱好看）
- **生产 UX 内置**：流式、自动滚动、重试、附件、markdown、代码高亮、语音输入、快捷键、无障碍
- **Generative UI**：工具调用/JSON 渲染为 React 组件、内联人类审批、安全的前端动作

## 工具（toolkit）API

```tsx
// 前端 toolkit：工具后端执行，前端只画 UI
"use generative";
import { defineToolkit, externalTool } from "@assistant-ui/react";

export default defineToolkit({
  get_weather: { execute: externalTool(), render: ({ args, result }) => /* JSX */ null },
});

// 注册
const aui = useAui({ tools: Tools({ toolkit }) });
// <AssistantRuntimeProvider aui={aui} runtime={runtime}> ... </AssistantRuntimeProvider>
```

> **已废弃**（勿用）：`makeAssistantToolUI`、`useAssistantToolUI`、`makeAssistantTool`、`useAssistantTool`——一律改用 toolkit。

## 环境变量

| 变量 | 用途 |
| --- | --- |
| `OPENAI_API_KEY` | OpenAI 后端时必需，放 `.env.local` |

## 安装命令

```bash
# 新项目脚手架
npx assistant-ui@latest create

# 加进已有项目
npx assistant-ui init --yes

# 直接装包
npm install @assistant-ui/react @assistant-ui/react-ai-sdk

# 加组件（预设 / 单个）
npx shadcn@latest add "https://r.assistant-ui.com/chat/b/ai-sdk-quick-start/json"
npx shadcn@latest add assistant-ui/thread
```

## 资源链接

- 仓库：[assistant-ui/assistant-ui](https://github.com/assistant-ui/assistant-ui)（MIT）
- 官方 skill：`packages/cli/plugin/skills/assistant-ui/SKILL.md`
- 文档：[assistant-ui.com/docs](https://www.assistant-ui.com/docs)
- Runtimes：[Pick a Runtime](https://www.assistant-ui.com/docs/runtimes/pick-a-runtime)
- 示例：[assistant-ui.com/examples](https://www.assistant-ui.com/examples)
- 相关叶：[Vercel AI SDK Skills](../vercel-ai-sdk-skills/) · [shadcn Skill](../shadcn-skill/) · [LangChain & LangGraph Skills](../langchain-langgraph-skills/)
