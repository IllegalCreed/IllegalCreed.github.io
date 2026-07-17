---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 CopilotKit/skills 官方 skills 仓（根 `SKILL.md` + `skills/*/SKILL.md`）与 docs.copilotkit.ai 编写。技能锚定 CopilotKit **v2**（`@copilotkit/*`）API 面。

## 速查

- **装**：`npx skills add CopilotKit/CopilotKit/skills -y`（权威源在主 monorepo；每次 fresh clone 拿最新）；跨 Claude Code / Codex / Cursor / OpenCode
- **结构**：1 个**路由 skill** `copilotkit` + 8 个专用 sub-skill（setup / develop / integrations / debug / upgrade / agui / contribute / self-update）
- **CopilotKit 是什么**：给 React 应用加 AI copilot / 生成式 UI 的框架——聊天、前端工具、共享状态、人在环路
- **路由机制**：入口 `copilotkit` skill 按 Routing Table 分派；任务不清先问一句再路由；默认路径 = `copilotkit-setup`
- **v2 核心**：hook（`useAgent`/`useFrontendTool`/`useAgentContext`/`useInterrupt`…）+ 组件（`CopilotChat`/`CopilotSidebar`/`CopilotPopup`）+ runtime（`CopilotRuntime`/`createCopilotEndpoint`/`BuiltInAgent`）
- **传输**：前后端走 **AG-UI 协议**（SSE 事件流）
- **配套 MCP**：`copilotkit-docs`（`mcp.copilotkit.ai/mcp`）查实时官方文档；MIT

## 安装

技能的权威源现在住在 CopilotKit 主 monorepo，装它一条命令：

```bash
npx skills add CopilotKit/CopilotKit/skills -y
```

它每次都从 GitHub **fresh clone**，所以再跑一次同样的命令就是「更新到最新」。装完技能自动可用——agent 检测到 CopilotKit 相关任务时调用，也可显式说「用 CopilotKit 帮我建个聊天」触发。

> 独立仓 `CopilotKit/skills` 顶部有醒目提示：技能已并入主 monorepo `CopilotKit/CopilotKit` 的 `skills/` 目录，独立仓不再是 source of truth。理由是——技能与它描述的代码同住一棵树：参考资料从同一份源码生成、版本随发布同步、issue/PR 只有一个入口。

## 8 个 sub-skill 总览

这套技能是「1 路由 + 8 专用」的矩阵，覆盖 CopilotKit 全生命周期：

| Sub-skill | 何时用 | 一句话 |
| --- | --- | --- |
| `copilotkit-setup` | 初装、把 CopilotKit 加进项目 | 框架检测、装包、配 runtime、接 provider、跑通首个聊天 |
| `copilotkit-develop` | 建功能 | 前端工具、共享状态、生成式 UI、处理中断——v2 hook 全家桶 |
| `copilotkit-integrations` | 接 agent 框架 | LangGraph / CrewAI / Mastra… 经 AG-UI 协议接入 |
| `copilotkit-debug` | 排障 | runtime 连不通、agent 不响应、流式/CORS/版本错 |
| `copilotkit-upgrade` | 版本迁移 | v1（GraphQL）→ v2（AG-UI）逐条替换弃用 API |
| `copilotkit-agui` | 自建后端 | AG-UI 协议事件族、SSE、`AbstractAgent.run()` |
| `copilotkit-contribute` | 给 CopilotKit 贡献 | fork、装 monorepo、Nx、跑测试、提 PR |
| `copilotkit-self-update` | 技能过时 | 刷新这套 SKILL.md 知识到最新（非升级项目依赖） |

## 路由 skill 机制

入口 `copilotkit` 是个 **路由 skill**（`user_invocable`）——它自己不干活，而是按任务把你分派到对应 sub-skill。核心是一张 Routing Table：

| 任务 | 分派到 |
| --- | --- |
| 初装 / 安装 / 加进项目 | `copilotkit-setup` |
| 建功能——前端工具、共享状态、生成式 UI | `copilotkit-develop` |
| 接 agent 框架（LangGraph / CrewAI / Mastra…） | `copilotkit-integrations` |
| 调错、修 runtime、排障 | `copilotkit-debug` |
| 升级版本、迁移 API | `copilotkit-upgrade` |
| AG-UI 协议、自建后端、事件流 | `copilotkit-agui` |
| 给 CopilotKit 仓贡献 | `copilotkit-contribute` |
| 技能自身过时/不对 | `copilotkit-self-update` |

两条约定值得记：

- **任务模糊先问一句**再路由，不瞎猜
- **默认路径 = `copilotkit-setup`**：如果只是想「把 CopilotKit 加进项目」或需求笼统，直接走 setup

## CopilotKit 是什么

CopilotKit 是一套给 **React 应用加 AI copilot / 生成式 UI** 的框架。它让你在应用里嵌入：

- **聊天 UI**：`CopilotChat`（内联填满容器）、`CopilotSidebar`（可折叠侧栏）、`CopilotPopup`（浮动弹窗）
- **前端工具（frontend tools）**：让 agent 调用浏览器里的函数（如高亮某个单元格、改主题色）
- **共享状态（shared context）**：把应用运行时数据（购物车、选中项…）喂给 agent
- **生成式 UI**：agent 调工具时渲染自定义 React 卡片（天气卡、搜索结果…）
- **人在环路（human-in-the-loop）**：agent 暂停等用户确认再继续

v2 的整个栈建在 **AG-UI 协议**（`@ag-ui/client` / `@ag-ui/core`）之上，分三层：

1. **Runtime**（`@copilotkit/runtime`）——服务端，托管 agent、处理 SSE 传输、中间件、转录
2. **Core**（`@copilotkit/core`）——共享状态管理、工具注册表、建议引擎（应用不直接引它）
3. **React**（`@copilotkit/react`）——provider、聊天组件、hook，并 re-export `@ag-ui/client`，应用只需一处 import

## 最小上手：五步跑通

`copilotkit-setup` 教的最小闭环（以 Next.js App Router 为例）：

```bash
# 1. 装包（前端 + runtime）
npm install @copilotkit/react @copilotkit/core @copilotkit/runtime @copilotkit/agent hono
```

```typescript
// 2. 配 runtime：src/app/api/copilotkit/[[...slug]]/route.ts
import { CopilotRuntime, createCopilotEndpoint, InMemoryAgentRunner } from "@copilotkit/runtime";
import { BuiltInAgent } from "@copilotkit/agent";
import { handle } from "hono/vercel";

const runtime = new CopilotRuntime({
  agents: { default: new BuiltInAgent({ model: "openai/gpt-4o" }) },
  runner: new InMemoryAgentRunner(),
});
const app = createCopilotEndpoint({ runtime, basePath: "/api/copilotkit" });
export const GET = handle(app);
export const POST = handle(app);
```

```tsx
// 3. 接 provider + 聊天 UI（客户端组件）
"use client";
import { CopilotKitProvider, CopilotChat } from "@copilotkit/react";
import "@copilotkit/react/styles.css";

export default function Home() {
  return (
    <CopilotKitProvider runtimeUrl="/api/copilotkit">
      <CopilotChat />
    </CopilotKitProvider>
  );
}
```

第 4 步配 `.env.local` 的 `OPENAI_API_KEY`（`BuiltInAgent` 按 model 前缀自动取 key）；第 5 步起 dev server、发条消息验证。

## 下一步

- [指南](./guide-line) —— 8 skills 逐个深入、AG-UI 协议、集成框架、全生命周期、反模式
- [参考](./reference) —— 8 skills 全表 + v2 API 速查 + AG-UI 事件族 + 集成矩阵
