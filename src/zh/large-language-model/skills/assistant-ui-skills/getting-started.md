---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 assistant-ui/assistant-ui 官方 skill（`packages/cli/plugin/skills/assistant-ui/SKILL.md`）与仓库 README 编写。

## 速查

- **定位**：assistant-ui = React 的 AI 聊天 UI 库（可组合 primitives + runtime），把 ChatGPT 式体验接进你的应用；这个官方 skill 教 AI agent 怎么把它集成进项目
- **skill 位置**：`packages/cli/plugin/skills/assistant-ui/SKILL.md`（随 assistant-ui CLI plugin 分发的官方产品 skill）
- **skill 4 步**：① 查 setup（`components.json` + `@assistant-ui/react`）② 加组件（shadcn registry）③ 配 runtime（AI SDK）④ 工具（可选，toolkit）
- **新项目**：`npx assistant-ui@latest create`；**加进已有项目**：`npx assistant-ui init --yes`
- **核心用法**：`useChatRuntime()`（AI SDK）→ `<AssistantRuntimeProvider runtime={...}>` 包 `<Thread />`
- **换后端**：`useChatRuntime` → `useLangGraphRuntime` / `useDataStreamRuntime` / 自定义 runtime，UI 不动
- **核心包**：`@assistant-ui/react`（核心 primitives）+ `@assistant-ui/react-ai-sdk`（AI SDK 集成）
- **前提**：一个 React 项目 + 你自己的后端 runtime（API 路由）+（用 OpenAI 时）`OPENAI_API_KEY`
- MIT ｜ ★11.1k ｜ 作者 Yonom

## assistant-ui 是什么

一句话：**「ChatGPT 的 UX，搬进你的 React 应用」**。它是一个开源 TypeScript/React 库，提供两样东西：

- **可组合 primitives**：`Thread`、`Message`、`Composer`、`ThreadList`、`ActionBar` 等构建块，你可以逐像素自定义，也可以直接用 CLI copy 进项目的、带样式的 shadcn/ui 主题
- **runtime**：管理聊天状态（消息、流式、分支、附件等），并把 UI 与你的后端 LLM 连起来

它把生产级聊天该有的东西都内置了：**流式响应、自动滚动、重试、附件、markdown、代码高亮、语音输入、快捷键、无障碍**；还支持 **Generative UI**（把工具调用/JSON 渲染成 React 组件、内联人类审批、向模型开放安全的前端动作）。全程强类型。

> 关键分工：assistant-ui 负责**前端 UI + 聊天状态**，真正的 LLM 调用在**你自己的后端**（一个 API 路由，通常用 Vercel AI SDK 或 LangGraph）。

## 官方 skill 在哪、教什么

官方产品 skill 位于仓库 `packages/cli/plugin/skills/assistant-ui/SKILL.md`——它随 assistant-ui 的 **CLI plugin** 分发，是给 AI 编码 agent 看的「怎么把 assistant-ui 集成进 React 项目」的操作手册。它的 frontmatter `description` 写明触发条件：

> Add, configure, and integrate assistant-ui components in React apps. Use when developers ask to add a chat thread, set up a runtime, integrate with AI SDK, configure tools, or build AI chat interfaces with assistant-ui.

即：当你让 agent「加一个聊天 thread」「配一个 runtime」「接 AI SDK」「配工具」时，它就按 skill 的 **4 步**落地。

> 注意区分：仓库里还有 `.claude/skills/`（butflow / trusted-publishing / update-deps），那是 **assistant-ui 仓库自己的维护 skill**，不是给用户集成用的产品 skill——本叶不涉及。

## 接入：CLI 一步到位

**全新项目**（脚手架一个 Next.js 应用）：

```bash
npx assistant-ui@latest create
```

**加进已有项目**（skill 的 Step 1：先查有没有 `components.json`（shadcn 配置）和 `@assistant-ui/react`，没有就跑）：

```bash
npx assistant-ui init --yes
```

`init` 会初始化 shadcn 并装上默认的 assistant-ui 聊天组件。也可直接装包：

```bash
npm install @assistant-ui/react @assistant-ui/react-ai-sdk
```

## 加组件（shadcn registry）

skill 的 Step 2：组件通过 shadcn registry 安装——**copy 源码进你的项目**，你拥有并可改。用预设一键装齐：

```bash
npx shadcn@latest add "https://r.assistant-ui.com/chat/b/ai-sdk-quick-start/json"
```

也可按需装单个组件：

```bash
npx shadcn@latest add assistant-ui/thread
npx shadcn@latest add assistant-ui/markdown-text
```

## 配 runtime（AI SDK 推荐）

skill 的 Step 3：assistant-ui **必须有一个 runtime**。最常见的是用 Vercel AI SDK。先装集成包：

```bash
npm install @assistant-ui/react-ai-sdk
```

后端建一个聊天 API 路由（Next.js App Router）：

```ts
// app/api/chat/route.ts
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, config } = await req.json();

  const result = streamText({
    model: openai("gpt-5.4-nano"),
    messages,
    ...config,
  });

  return result.toDataStreamResponse();
}
```

前端建 assistant 组件——`useChatRuntime` 连到这个路由，`AssistantRuntimeProvider` 把 runtime 注入，`Thread` 渲染聊天界面：

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

> 用 OpenAI 时，记得在 `.env.local` 里配 `OPENAI_API_KEY`。想换后端？把 `useChatRuntime` 换成 `useLangGraphRuntime` / `useDataStreamRuntime` 或自定义 runtime 即可，`Thread` 等 UI 不用动。

## 下一步

- [指南](./guide-line) —— SKILL.md 4 步详解、工具与 Generative UI、primitives、反模式
- [参考](./reference) —— skill 内容清单、核心包 / Backends / 组件速览、安装、许可
