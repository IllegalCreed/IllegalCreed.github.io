---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 CopilotKit/skills 各 `SKILL.md`、`skills-lock.json`、`.mcp.json` 与 docs.copilotkit.ai 编写。

## 速查

- **装**：`npx skills add CopilotKit/CopilotKit/skills -y`（权威源 = 主 monorepo `skills/`）
- **8 sub-skill**：setup / develop / integrations / debug / upgrade / agui / contribute / self-update（+ 路由 skill `copilotkit`）
- **v2 包**：`@copilotkit/react` · `@copilotkit/core` · `@copilotkit/runtime` · `@copilotkit/agent` · `@copilotkit/shared`
- **AG-UI 包**：`@ag-ui/core`（协议）· `@ag-ui/client`（SDK）· `@ag-ui/encoder`（SSE/protobuf 编码）
- **MCP**：`copilotkit-docs` @ `mcp.copilotkit.ai/mcp`（`search-docs`/`search-code`/`search-ag-ui-docs`/`search-ag-ui-code`）
- MIT · 遵 agentskills.io · Copyright 2026 CopilotKit

## 8 sub-skill 全表

| Sub-skill | 触发 | 覆盖 |
| --- | --- | --- |
| `copilotkit`（路由） | 用 CopilotKit / 任务模糊 | Routing Table 分派到下列 sub-skill；默认 setup |
| `copilotkit-setup` | 初装 / 加进项目 | 框架检测、装包、runtime、provider、聊天 UI、Key、验证 |
| `copilotkit-develop` | 建功能 | `useFrontendTool`/`useAgentContext`/`useRenderToolCall`/`useInterrupt`/`useHumanInTheLoop` |
| `copilotkit-integrations` | 接 agent 框架 | LangGraph/CrewAI/PydanticAI/Mastra/ADK/LlamaIndex/Agno/Strands/MS/A2A/MCP Apps |
| `copilotkit-debug` | 排障 | 版本/模式/传输/错误码/AG-UI 事件追踪/CORS/转录 |
| `copilotkit-upgrade` | 版本迁移 | v1（GraphQL）→ v2（AG-UI）弃用 API 替换 |
| `copilotkit-agui` | 自建后端 / 协议 | 事件族、SSE、`AbstractAgent.run()`、状态同步、人在环路 |
| `copilotkit-contribute` | 贡献 | fork、Nx monorepo、Vitest、conventional commit、PR |
| `copilotkit-self-update` | 技能过时 | fresh clone 刷新 SKILL.md 知识（非项目依赖升级） |

## v2 API 速查

### Hook（`@copilotkit/react`）

| Hook | 用途 |
| --- | --- |
| `useFrontendTool` | 注册 agent 可在浏览器调的工具 |
| `useComponent` | 把 React 组件注册成 chat 内工具（`useFrontendTool` 便捷封装） |
| `useAgentContext` | 把可 JSON 序列化的应用状态共享给 agent |
| `useAgent` | 拿 agent 实例、订阅消息/状态/run 状态 |
| `useInterrupt` | 处理 agent 的 `on_interrupt` 事件（render + 可选 handler/filter） |
| `useHumanInTheLoop` | 注册暂停执行、等用户经 UI 响应的工具 |
| `useRenderToolCall` | 按名字（或通配 `"*"`）注册工具调用的渲染器 |
| `useSuggestions` / `useConfigureSuggestions` | 读/注册建议列表（静态或 LLM 生成） |
| `useThreads` | Intelligence 平台线程列/改名/归档/删 |

### 组件（`@copilotkit/react`）

`CopilotKitProvider`（根 provider）· `CopilotChat`（内联）· `CopilotPopup`（浮动弹窗）· `CopilotSidebar`（侧栏）· `CopilotChatView`（无头，带 slot）· `CopilotChatInput` · `CopilotChatMessageView` · `CopilotChatSuggestionView`。

### Runtime（`@copilotkit/runtime`）

| 导出 | 用途 |
| --- | --- |
| `CopilotRuntime` | 自动选 SSE / Intelligence 模式的兼容 shim |
| `CopilotSseRuntime` | 显式 SSE 模式（默认，内存线程） |
| `CopilotIntelligenceRuntime` | Intelligence 模式（持久线程、实时事件） |
| `createCopilotEndpoint` | 建含所有 CopilotKit 路由的 Hono app（多路由） |
| `createCopilotEndpointSingleRoute` | 单路由 Hono 端点 |
| `createCopilotEndpointExpress` / `...SingleRouteExpress` | Express 版（从 `@copilotkit/runtime/express`） |
| `InMemoryAgentRunner` | 默认 runner，线程状态存进程内存 |

### Agent（`@copilotkit/agent`）

`BuiltInAgent`（`model: "provider/model-name"`，如 `openai/gpt-4o`、`anthropic/claude-sonnet-4.5`、`google/gemini-2.5-pro`；按前缀自动取 env key）· `defineTool`。

### CopilotKitProvider 关键 props

`runtimeUrl`（runtime 端点）· `useSingleEndpoint`（用单路由后端时设 true）· `headers` · `credentials` · `publicApiKey`（Copilot Cloud）· `showDevConsole`（`"auto"` = 仅开发）· `renderToolCalls` · `frontendTools` · `onError`。

## AG-UI 事件族

| 族 | 事件 | 用途 |
| --- | --- | --- |
| Lifecycle | `RUN_STARTED` / `RUN_FINISHED` / `RUN_ERROR` / `STEP_STARTED` / `STEP_FINISHED` | run 边界与进度 |
| Text | `TEXT_MESSAGE_START` / `_CONTENT` / `_END` | 流式文本 |
| Tool Calls | `TOOL_CALL_START` / `_ARGS` / `_END` / `_RESULT` | agent 工具调用 |
| State | `STATE_SNAPSHOT` / `STATE_DELTA` / `MESSAGES_SNAPSHOT` | 状态同步（delta = RFC 6902 JSON Patch） |
| Reasoning | `REASONING_START` / `_MESSAGE_*` / `_END` / `_ENCRYPTED_VALUE` | 思维链可见性 |
| Activity | `ACTIVITY_SNAPSHOT` / `ACTIVITY_DELTA` | 结构化进度 |
| Custom | `RAW` / `CUSTOM` | 扩展点 |

便捷 chunk：`TEXT_MESSAGE_CHUNK` / `TOOL_CALL_CHUNK` 自动展开成 Start/Content/End。SSE 线格式：`data: {"type":"RUN_STARTED",...}\n\n`。协议包：`@ag-ui/core`（事件/类型/schema）· `@ag-ui/client`（`AbstractAgent`/`HttpAgent`/中间件）· `@ag-ui/encoder`（`EventEncoder`）。

## 集成矩阵（AG-UI client 选型）

| 框架 | AG-UI client | 服务端适配器 |
| --- | --- | --- |
| LangGraph（Python 自托管） | `LangGraphHttpAgent` | `ag-ui-langgraph`（`add_langgraph_fastapi_endpoint`） |
| LangGraph（Platform / JS） | `LangGraphAgent` | LangGraph Platform / `@copilotkit/sdk-js/langgraph` |
| CrewAI Flows / Crews | `HttpAgent` / `CrewAIAgent` | `ag-ui-crewai` |
| PydanticAI | `HttpAgent` | `pydantic-ai-slim[ag-ui]`（`agent.to_ag_ui()`） |
| Mastra | `MastraAgent` | 内建于 `@ag-ui/mastra` |
| Google ADK | `HttpAgent` | `ag-ui-adk` |
| LlamaIndex | `LlamaIndexAgent` | `llama-index-protocols-ag-ui` |
| Agno / Strands | `HttpAgent` | `agno`（AgentOS）/ `ag_ui_strands` |
| MS Agent Framework | `HttpAgent` | `agent-framework-ag-ui` / `MapAGUI`（.NET） |
| A2A（多 agent） | `A2AMiddlewareAgent` | 每 agent 混合 |
| MCP Apps | `BuiltInAgent` + `MCPAppsMiddleware` | 中间件 |

## 安装与格式

```bash
# 装/更新（fresh clone，永远拿最新）
npx skills add CopilotKit/CopilotKit/skills -y
```

- 每个 skill = 一个含 `SKILL.md` 的目录（遵 agentskills.io），可带 `references/` 支撑文档
- 一份技能跨 Claude Code / Codex / Cursor / OpenCode 通用
- 配套 `.mcp.json` 声明 `copilotkit-docs` MCP（Claude Code 自动配置；Codex 需手动写 `.codex/config.toml`）
- `skills-lock.json` 锁 8 个 sub-skill 的源与 hash

## 资源链接

- 权威源：[CopilotKit/CopilotKit · skills/](https://github.com/CopilotKit/CopilotKit/tree/main/skills)
- 独立仓（已迁移）：[CopilotKit/skills](https://github.com/CopilotKit/skills)
- 文档：[docs.copilotkit.ai](https://docs.copilotkit.ai)
- AG-UI 协议：[docs.ag-ui.com](https://docs.ag-ui.com)
- Agent Skills 标准：[agentskills.io](https://agentskills.io)
- 相关叶：[LangChain & LangGraph Skills](../langchain-langgraph-skills/) · [Mastra Skills](../mastra-skills/) · [Vercel AI SDK Skills](../vercel-ai-sdk-skills/)
