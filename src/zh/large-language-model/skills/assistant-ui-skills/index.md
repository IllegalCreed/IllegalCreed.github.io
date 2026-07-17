---
layout: doc
---

# assistant-ui Skills

assistant-ui Skills 是 assistant-ui（`assistant-ui/assistant-ui`）**官方**随 CLI plugin 分发的 Agent Skill（`packages/cli/plugin/skills/assistant-ui/SKILL.md`）。assistant-ui 本身是一个 MIT 开源的 TypeScript/React 库，用可组合的 primitives（`Thread` / `Message` / `Composer` / `ThreadList` / `ActionBar` 等）+ runtime，把「ChatGPT 那样的 AI 聊天体验」接进你自己的 React 应用，后端可对接 Vercel AI SDK、LangGraph/LangChain、AG-UI/A2A 等。这个官方 skill 把「怎么把 assistant-ui 加进项目、加组件、配 runtime、接 AI SDK、配工具」的完整落地步骤教给 AI 编码 agent——开发者说「帮我加一个聊天 thread」「配个 runtime」，agent 就照 skill 的 4 步落地。★11.1k、YC 背书，作者 Yonom（Simon Farshid）。

## 评价

**优点**

- **官方随库分发**：skill 在 assistant-ui 的 CLI plugin 内（`packages/cli/plugin/skills`），跟着库版本走，是官方维护的一手集成流程，非第三方猜测
- **复用 shadcn 生态**：`init` 走 shadcn，组件是 `npx shadcn add assistant-ui/thread` **copy 进你项目**的源码——每一行你都拥有、可改，非黑盒依赖
- **runtime 抽象干净**：一个 `AssistantRuntimeProvider` + `useChatRuntime`（AI SDK）就跑起来；换 `useLangGraphRuntime` / `useDataStreamRuntime` / 自定义 runtime 即接不同后端，UI 层不动
- **生产 UX 开箱**：流式、自动滚动、重试、附件、markdown、代码高亮、语音输入、快捷键、无障碍全内置
- **Generative UI + 工具**：把工具调用/JSON 渲染成 React 组件、内联人类审批、向模型开放安全的前端动作
- **强类型**：runtime API、工具 schema、message parts 端到端 TypeScript

**缺点 / 边界**

- **React 专属**：primitives 是 React 组件，非 React 框架用不了
- **需自带后端 runtime**：assistant-ui 只管 UI + 聊天状态，真正的 LLM 调用要你自己的 API 路由（AI SDK / LangGraph 等）
- **默认偏 shadcn/Tailwind**：默认组件走 shadcn；非 Tailwind 用户需 `@assistant-ui/styles` 预置 CSS
- **工具 API 有代际**：`makeAssistantToolUI` / `useAssistantToolUI` / `makeAssistantTool` / `useAssistantTool` 已废弃，改用 toolkit（`defineToolkit`）
- **别混淆两种 skill**：仓库 `.claude/skills/`（butflow / trusted-publishing / update-deps）是**仓库自身维护 skill**，不是给用户的产品 skill——本叶只讲 CLI plugin 里的官方产品 skill

## 适用场景

- 想在 React / Next.js 应用里加一个 ChatGPT 式聊天界面，又不想从零画 UI
- 已用 Vercel AI SDK / LangGraph 做后端，要一个能对接的前端聊天壳
- 让 AI 编码 agent（Claude Code / Cursor 等）照官方步骤把 assistant-ui 加进项目
- 需要工具调用可视化（Generative UI）、人类审批、流式渲染

## 边界

- 只是 UI + runtime 层，**不含 LLM / 后端**——LLM 调用在你的 API 路由里
- **React 生态专属**，非 React 框架不适用
- 官方 skill 讲的是「集成 assistant-ui」，不是通用 AI 聊天教程
- **仓库维护 skill（`.claude/skills`）不在本叶范围**

## 官方文档

[assistant-ui 文档](https://www.assistant-ui.com/docs) ｜ [Pick a Runtime](https://www.assistant-ui.com/docs/runtimes/pick-a-runtime) ｜ [Examples](https://www.assistant-ui.com/examples)

## GitHub 地址

[assistant-ui/assistant-ui](https://github.com/assistant-ui/assistant-ui)（MIT）

## 内容地图

- [入门](./getting-started) —— 官方定位、CLI 接入、assistant-ui 是什么、skill 教什么
- [指南](./guide-line) —— SKILL.md 4 步详解（setup / 组件 / runtime / 工具）、primitives 与生产 UX、反模式
- [参考](./reference) —— skill 内容清单、核心包 / Backends / 组件速览、安装、许可

## 幻灯片地址

<a href="/SlideStack/assistant-ui-skills-slide/" target="_blank">assistant-ui Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=628" target="_blank" rel="noopener noreferrer">assistant-ui Skills 测试题</a>
