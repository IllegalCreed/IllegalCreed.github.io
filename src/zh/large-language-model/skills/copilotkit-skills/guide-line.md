---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 CopilotKit/skills 各 `skills/*/SKILL.md` 与 docs.copilotkit.ai 编写。v2（AG-UI）为准。

## 速查

- **路由 skill `copilotkit`**：Routing Table 分派；模糊先问；默认走 setup
- **setup**：框架检测（Next.js/Vite/Angular）→ 装 `@copilotkit/{react,core,runtime,agent}` → `CopilotRuntime` + `createCopilotEndpoint` → `CopilotKitProvider` → 聊天 UI
- **develop**：`useFrontendTool`（前端工具）、`useAgentContext`（共享状态）、`useRenderToolCall`（生成式 UI）、`useInterrupt`/`useHumanInTheLoop`（人在环路）
- **integrations**：LangGraph / CrewAI / PydanticAI / Mastra / ADK / LlamaIndex / Agno / Strands / MS Agent Fw / A2A / MCP Apps，统一走 **AG-UI 协议**
- **agui**：事件族（Lifecycle/Text/Tool/State/Reasoning/Activity/Custom）、SSE 线格式、`AbstractAgent.run()` 返回 `Observable<BaseEvent>`
- **debug**：先集信息（版本/模式/传输/agent 类型/错误码）→ 查错误码目录 → 追 AG-UI 事件流
- **upgrade**：v1（GraphQL）→ v2（AG-UI）；`CopilotKit`→`CopilotKitProvider`、`useCopilotAction`→`useFrontendTool`
- **反模式**：用 v1 弃用 hook、`TEXT_MESSAGE_CONTENT.delta` 空、run 不以 `RUN_STARTED`/`RUN_FINISHED` 收尾

## copilotkit-setup：从零到首个聊天

`setup` 负责「把 CopilotKit 加进项目」，工作流固定：

1. **框架检测**：看根目录信号文件——`next.config.*` + `app/` = Next.js App Router；`+ pages/` = Pages Router；`angular.json` = Angular；`vite.config.*` + React 依赖 = Vite + React
2. **装包**：前端 `@copilotkit/react @copilotkit/core`，runtime `@copilotkit/runtime @copilotkit/agent`；同一 Next.js app 里四个一起装
3. **配 runtime**：两种端点风格——**多路由**（Hono，`createCopilotEndpoint`，需 catch-all `[[...slug]]`）或**单路由**（`createCopilotEndpointSingleRoute` / `...Express`，全走一个 POST）
4. **接 provider**：`CopilotKitProvider runtimeUrl="/api/copilotkit"` 包住应用，别忘 `import "@copilotkit/react/styles.css"`
5. **加聊天 UI**：`CopilotChat` / `CopilotSidebar` / `CopilotPopup` 三选一
6. **配 Key**：`BuiltInAgent` 按 model 前缀取 key（`openai/*`→`OPENAI_API_KEY`、`anthropic/*`→`ANTHROPIC_API_KEY`、`google/*`→`GOOGLE_API_KEY`）
7. **验证**：起 dev server、发消息、看 `/info`（GET）报告可用 agent

关键取舍：单路由要在 provider 上设 `useSingleEndpoint`；runtime 跑在独立服务器（如 Express :4000）时 `runtimeUrl` 填绝对地址。

## copilotkit-develop：v2 hook 全家桶

`develop` 教用 v2 hook 建功能。四个最常用的：

### 前端工具 `useFrontendTool`

让 agent 调浏览器里的函数：

```tsx
import { useFrontendTool } from "@copilotkit/react";
import { z } from "zod";

useFrontendTool({
  name: "highlightCell",
  description: "Highlight a spreadsheet cell",
  parameters: z.object({ row: z.number(), col: z.number() }),
  handler: async ({ row, col }) => { highlightCell(row, col); return "done"; },
});
```

### 共享状态 `useAgentContext`

把运行时数据喂给 agent（任意可 JSON 序列化的值）：

```tsx
useAgentContext({ description: "The user's current shopping cart", value: cart });
```

### 生成式 UI `useRenderToolCall`

工具执行时渲染自定义 UI（按状态切换 loading / 结果）：

```tsx
useRenderTool({
  name: "searchDocs",
  parameters: z.object({ query: z.string() }),
  render: ({ status, parameters, result }) => {
    if (status === "executing") return <Spinner>Searching {parameters.query}...</Spinner>;
    if (status === "complete") return <Results data={result} />;
    return <div>Preparing...</div>;
  },
}, []);
```

### 人在环路 `useInterrupt` / `useHumanInTheLoop`

agent 暂停等用户输入时渲染确认 UI，`resolve`/`respond` 回传结果继续执行。其它常用 hook：`useAgent`（拿 agent 实例、订阅消息/状态/run 状态）、`useComponent`（把组件注册成 chat 内工具）、`useSuggestions`/`useConfigureSuggestions`（建议 pill）、`useThreads`（Intelligence 平台线程增删改查）。

## copilotkit-integrations：接 agent 框架

CopilotKit 经 **AG-UI 协议**接外部 agent 框架，架构恒定：**agent 服务器**（多为 FastAPI/uvicorn）→ **AG-UI 适配器**（框架专用，翻译 native↔wire）→ **CopilotKit runtime**（Next.js API 路由建 `CopilotRuntime` 连 agent）→ **前端**（`useAgent`/`useFrontendTool`/`useRenderToolCall`/`useHumanInTheLoop` 交互）。

支持矩阵（选对 AG-UI client 是关键）：

| 框架 | 语言 | route.ts 里的 AG-UI client |
| --- | --- | --- |
| LangGraph（自托管 Python） | Python | `LangGraphHttpAgent`（`@copilotkit/runtime/langgraph`） |
| LangGraph（Platform / JS） | Python/TS | `LangGraphAgent`（`@copilotkit/runtime/langgraph`） |
| CrewAI Flows / Crews | Python | `HttpAgent`（`@ag-ui/client`）/ `CrewAIAgent`（`@ag-ui/crewai`） |
| PydanticAI / ADK / Agno / Strands | Python | `HttpAgent`（`@ag-ui/client`，通用） |
| Mastra | TypeScript | `MastraAgent`（`@ag-ui/mastra`） |
| LlamaIndex | Python | `LlamaIndexAgent`（`@ag-ui/llamaindex`） |
| A2A（多 agent） | Python+TS | `A2AMiddlewareAgent`（`@ag-ui/a2a-middleware`） |
| MCP Apps | TypeScript | `BuiltInAgent` + `MCPAppsMiddleware` |

前端侧所有集成共享同一套模式：`CopilotKitProvider` 的 `agent` prop 必须匹配 `CopilotRuntime({ agents: { my_agent: ... } })` 的 key；agent 侧发 `STATE_SNAPSHOT` 事件同步状态到前端。

## copilotkit-agui：AG-UI 协议与自建后端

`agui` 是最底层的 skill——AG-UI（Agent-User Interaction）是 CopilotKit 开放的、基于事件的 agent↔UI 通信协议。所有交互走**类型化事件**，经 SSE（或 protobuf）流式传输。agent 实现 `AbstractAgent.run()` 返回 RxJS `Observable<BaseEvent>`，客户端 SDK 负责应用事件、管理状态与消息历史。

**事件族**（记住 7 族）：Lifecycle（`RUN_STARTED`/`RUN_FINISHED`/`RUN_ERROR`/`STEP_*`）、Text（`TEXT_MESSAGE_START/CONTENT/END`）、Tool Calls（`TOOL_CALL_START/ARGS/END/RESULT`）、State（`STATE_SNAPSHOT`/`STATE_DELTA`/`MESSAGES_SNAPSHOT`）、Reasoning、Activity、Custom（`RAW`/`CUSTOM`）。便捷 chunk 事件 `TEXT_MESSAGE_CHUNK`/`TOOL_CALL_CHUNK` 会自动展开成 Start/Content/End 三元组。

**协议铁律**：每个 run 必须 `RUN_STARTED` 开头、`RUN_FINISHED` 或 `RUN_ERROR` 收尾；`TEXT_MESSAGE_CONTENT.delta` 不能为空；工具调用事件用 `toolCallId` 关联；`STATE_DELTA` 用 RFC 6902 JSON Patch；多个 run 顺序执行、消息跨 run 累积。SSE 线格式就是每个事件一行 `data: {JSON}\n\n`。

## copilotkit-debug：系统化排障

`debug` 的诊断工作流严格「先取证、后开方」：

1. **集信息**：包版本（`npm ls @copilotkit/runtime @copilotkit/react @copilotkit/core @ag-ui/client`，版本不一致是常见根因）、runtime 模式（SSE vs Intelligence）、传输配置（`runtimeUrl` 是否匹配 `basePath`）、agent 类型、精确错误、Network 里的 `/info` 与 SSE 流
2. **查错误码**：三套码——v1（`NETWORK_ERROR`/`AGENT_NOT_FOUND`）、v2 `CopilotKitCoreErrorCode`（`runtime_info_fetch_failed`/`agent_connect_failed`）、`TranscriptionErrorCode`
3. **追 AG-UI 事件流**：从 `RunStarted` → Text/Tool → `RunFinished`/`RunError`，用 `@copilotkit/web-inspector` 或直接看 Network 里的 `text/event-stream`
4. **定位 + 修复验证**：修完确认 `/info` 报告预期 agent、SSE 流完整、控制台无残留结构化错误

排障时还能调 `copilotkit-docs` MCP 的 `search-docs`/`search-code` 查实时文档。

## copilotkit-upgrade：v1 → v2 迁移

CopilotKit v2 是建在 AG-UI 上的重写；用户仍装 `@copilotkit/*`，但 API 全变。迁移工作流：审计 v1 import → 找弃用 API → 映射 v2 → 更新依赖 → 改 runtime 配置 → 改 provider → 验证。核心替换表：

| v1 | v2 |
| --- | --- |
| `useCopilotAction` | `useFrontendTool` |
| `useCopilotReadable` | `useAgentContext` |
| `useCoAgent` | `useAgent` |
| `useLangGraphInterrupt` | `useInterrupt` |
| `useCopilotChatSuggestions` | `useConfigureSuggestions` + `useSuggestions` |
| `CopilotKit`（provider） | `CopilotKitProvider` |
| `CopilotTextarea` | 移除（用标准 textarea + `useFrontendTool`） |
| runtime：service adapter（OpenAI/Anthropic） | runtime：`AbstractAgent`/`BuiltInAgent` 实例 |
| 协议：GraphQL | 协议：AG-UI（SSE） |

## copilotkit-contribute & copilotkit-self-update

- **contribute**：给 `CopilotKit/CopilotKit` 贡献——fork/clone、`pnpm install`（pnpm 9.x + Node 20+）、`pnpm build` 引导、`feat/<ISSUE>-<name>` 分支、Vitest 测试、conventional commit（commitlint 强制）、对 `main` 提 PR。monorepo 用 Nx 编排 + pnpm workspaces，新功能进 `packages/v2/`
- **self-update**：技能过时/API 名不对时刷新这套 SKILL.md 到最新（`npx skills add …` fresh clone），完事**开新会话**生效——注意它更新的是「agent 的技能知识」，不是你项目里的 CopilotKit 依赖版本（那是 `upgrade` 干的）

## 反模式（别踩）

- **用 v1 弃用 hook**：`useCopilotAction` / `CoAgents` / `CopilotTextarea` / `useCopilotReadable` 在 v2 已换名或移除，混用报错——迁移用 `upgrade`
- **run 不闭合**：AG-UI 里每个 run 不以 `RUN_STARTED` 开头、`RUN_FINISHED`/`RUN_ERROR` 收尾会让前端卡住；`TEXT_MESSAGE_CONTENT.delta` 空也违规
- **`runtimeUrl` 与 `basePath` 不匹配**：前端连不上 runtime 的头号原因；单路由后端忘设 `useSingleEndpoint` 同理
- **拿 `copilotkit-self-update` 当依赖升级**：它只刷技能知识，升级项目 API 要走 `copilotkit-upgrade`
- **跳过路由 skill 瞎猜 sub-skill**：任务模糊时先让 `copilotkit` 路由（或问一句），别硬套

## 下一步

- [参考](./reference) —— 8 skills 全表 + v2 API 速查 + AG-UI 事件族 + 集成矩阵 + 链接
- 上游：[docs.copilotkit.ai](https://docs.copilotkit.ai) · [AG-UI 协议](https://docs.ag-ui.com)
