---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 assistant-ui/assistant-ui 官方 skill（`packages/cli/plugin/skills/assistant-ui/SKILL.md`）与仓库 README 编写。

## 速查

- **skill 4 步**：查 setup → 加组件 → 配 runtime → 工具（可选）
- **Step 1 setup**：查 `components.json`（shadcn）+ `@assistant-ui/react`；缺则 `npx assistant-ui init --yes`
- **Step 2 组件**：预设 `npx shadcn@latest add "https://r.assistant-ui.com/chat/b/ai-sdk-quick-start/json"`；单个 `npx shadcn@latest add assistant-ui/thread`
- **Step 3 runtime**：`useChatRuntime({api:"/api/chat"})` + API 路由 `streamText(...).toDataStreamResponse()`
- **Step 4 工具**：后端 `tool({ parameters: z.object, execute })`；前端 `defineToolkit({ name: { execute: externalTool(), render } })` + `Tools({ toolkit })` + `useAui`
- **反模式**：别用 `makeAssistantToolUI` / `useAssistantToolUI` / `makeAssistantTool` / `useAssistantTool`（已废弃），用 toolkit
- **primitives**：`Thread` / `Message` / `Composer` / `ThreadList` / `ActionBar`；生产 UX（流式/滚动/重试/附件/markdown/高亮/语音/a11y）内置
- **换后端**：`useChatRuntime` → `useLangGraphRuntime` / `useDataStreamRuntime` / 自定义

## Step 1：查项目 setup

skill 第一步永远是**先看现状**：项目里有没有 `components.json`（shadcn 的配置文件）和 `@assistant-ui/react`。如果 assistant-ui 尚未接入，就跑：

```bash
npx assistant-ui init --yes
```

它会初始化 shadcn 并装上默认的 assistant-ui 聊天组件。这一步保证后续的 shadcn registry 安装、组件 copy 有正确的基础设施（`components.json`、路径别名、Tailwind 配置等）。

## Step 2：加组件（shadcn registry）

组件通过 shadcn registry 分发——**源码 copy 进你的项目**，不是黑盒 npm 依赖。预设一键装齐一套聊天 UI：

| 预设 | Registry URL |
| --- | --- |
| AI SDK Quick Start | `https://r.assistant-ui.com/chat/b/ai-sdk-quick-start/json` |

```bash
npx shadcn@latest add "https://r.assistant-ui.com/chat/b/ai-sdk-quick-start/json"
```

也可按需装单个 assistant-ui shadcn 组件：

```bash
npx shadcn@latest add assistant-ui/thread
npx shadcn@latest add assistant-ui/markdown-text
```

> 因为是 copy 进项目的源码，`Thread`、`MarkdownText` 等每一行你都能改——这是 assistant-ui「逐像素可定制」的底气。

## Step 3：配 runtime（AI SDK 推荐）

assistant-ui **必须挂一个 runtime**——它管聊天状态并连后端。最常见是 Vercel AI SDK：

```bash
npm install @assistant-ui/react-ai-sdk
```

后端 API 路由（Next.js App Router）用 AI SDK 的 `streamText` 流式返回：

```ts
// app/api/chat/route.ts
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, config } = await req.json();
  const result = streamText({ model: openai("gpt-5.4-nano"), messages, ...config });
  return result.toDataStreamResponse();
}
```

前端用 `useChatRuntime` 连路由，`AssistantRuntimeProvider` 注入，`Thread` 渲染：

```tsx
"use client";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";

export const Assistant = () => {
  const runtime = useChatRuntime({ api: "/api/chat" });
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread />
    </AssistantRuntimeProvider>
  );
};
```

## Step 4：工具与 Generative UI（可选）

要支持工具调用（tool calling），**后端定义工具、前端渲染工具 UI**。

**后端工具（AI SDK）**——用 `tool()` 声明 schema 与执行逻辑：

```ts
import { streamText, tool } from "ai";
import { z } from "zod";

const result = streamText({
  model: openai("gpt-5.4-nano"),
  messages,
  tools: {
    get_weather: tool({
      description: "Get weather for a location",
      parameters: z.object({ location: z.string() }),
      execute: async ({ location }) => ({ temperature: 72, condition: "sunny", location }),
    }),
  },
});
```

**前端工具 UI**——建一个 toolkit，为工具挂渲染器。工具在**后端执行**，所以这里用 `externalTool()`、只负责画 UI：

```tsx
// app/toolkit.tsx
"use generative";
import { defineToolkit, externalTool } from "@assistant-ui/react";

export default defineToolkit({
  get_weather: {
    execute: externalTool(),
    render: ({ args, result }) => (
      <div>
        <p>Weather for {args?.location}</p>
        {result && <p>{result.temperature}F, {result.condition}</p>}
      </div>
    ),
  },
});
```

在 assistant 组件里注册 toolkit——用 `useAui` + `Tools`，把结果传给 provider：

```tsx
import { AssistantRuntimeProvider, Tools, useAui } from "@assistant-ui/react";
import toolkit from "@/app/toolkit";

const aui = useAui({ tools: Tools({ toolkit }) });

<AssistantRuntimeProvider aui={aui} runtime={runtime}>
  <Thread />
</AssistantRuntimeProvider>;
```

## primitives 与生产 UX

skill 落地的这套 UI 建立在 assistant-ui 的**可组合 primitives** 上——`Thread`、`Message`、`Composer`、`ThreadList`、`ActionBar` 等。你可以逐像素自定义，也可以直接用 CLI copy 进项目的 shadcn/ui 主题起步。这套 primitives 把生产级聊天该有的 UX **开箱内置**：

- 流式响应、自动滚动、重试
- 附件、markdown 渲染、代码高亮
- 语音输入（dictation）、键盘快捷键、无障碍

**Generative UI** 让你把工具调用与 JSON 渲染成 React 组件、收集内联的人类审批、向模型开放安全的前端动作——这正是 Step 4 toolkit 做的事。

## 换后端：runtime 抽象

runtime 是 assistant-ui 的解耦点。`useChatRuntime` 开箱连 Vercel AI SDK；要接别的后端，只换这一个 hook，`Thread` 等 UI 不动：

| 后端 | runtime / 集成包 |
| --- | --- |
| Vercel AI SDK | `useChatRuntime`（`@assistant-ui/react-ai-sdk`） |
| LangGraph / LangChain | `useLangGraphRuntime`（`@assistant-ui/react-langgraph`、`react-langchain`） |
| 自定义数据流 | `useDataStreamRuntime` |
| AG-UI / A2A 协议 | `@assistant-ui/react-ag-ui`、`@assistant-ui/react-a2a` |

## 反模式

- **别再用旧工具 API**：`makeAssistantToolUI`、`useAssistantToolUI`、`makeAssistantTool`、`useAssistantTool` 已**废弃**，一律改用 toolkit（`defineToolkit` + `externalTool()` + `Tools()` + `useAui`）
- **别把 LLM 调用放前端**：assistant-ui 只管 UI + 状态，密钥与模型调用要在后端 API 路由里（`OPENAI_API_KEY` 放 `.env.local`）
- **别跳过 Step 1**：没有 `components.json` / shadcn 基建就直接 `shadcn add` 会失败，先 `init`
- **别把仓库维护 skill 当产品 skill**：`.claude/skills/`（butflow / trusted-publishing / update-deps）是仓库自身用的，集成 assistant-ui 看 `packages/cli/plugin/skills/assistant-ui`

## 下一步

- [参考](./reference) —— skill 内容清单、核心包 / Backends / 组件速览、安装、许可
- 上游：[assistant-ui 文档](https://www.assistant-ui.com/docs) · [Pick a Runtime](https://www.assistant-ui.com/docs/runtimes/pick-a-runtime)
