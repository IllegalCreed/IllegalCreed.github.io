---
layout: doc
---

# CopilotKit Skills

CopilotKit Skills（`CopilotKit/skills`）是 CopilotKit 官方出品的一组 AI 编码 agent 技能集，教 AI 助手用 CopilotKit **v2** API（`@copilotkit/*`）从零到上线地构建产品级 AI copilot。CopilotKit 本身是给 React 应用加「AI 副驾 / 生成式 UI」的框架——聊天、前端工具调用、共享状态、人在环路（human-in-the-loop）、生成式 UI 卡片。这套技能把「初装 → 建功能 → 集成 agent 框架 → 调试 → 升级 → 贡献」的完整生命周期，拆成一个**路由 skill**（`copilotkit`）+ 8 个专用 sub-skill，遵循 [agentskills.io](https://agentskills.io) 开放格式，一份 `SKILL.md` 跨 Claude Code / Codex / Cursor / OpenCode 通用，MIT 开源。

> **仓库已迁移**：这套技能的权威源现在住在 CopilotKit 主 monorepo [`CopilotKit/CopilotKit`](https://github.com/CopilotKit/CopilotKit) 的 [`skills/`](https://github.com/CopilotKit/CopilotKit/tree/main/skills) 目录下，安装命令为 `npx skills add CopilotKit/CopilotKit/skills -y`。独立仓 `CopilotKit/skills` 已不再是 source of truth。

## 评价

**优点**

- **官方 + 全生命周期**：不是零散 prompt，而是覆盖 setup / develop / integrations / debug / upgrade / agui / contribute / self-update 的完整技能矩阵，与 CopilotKit 源码同仓、随版本同步更新
- **路由 skill 设计**：入口 `copilotkit` skill 内含一张 Routing Table，按「你想做什么」把任务分派到对应 sub-skill；任务不清时先问一句再路由
- **锚定 v2 API**：明确教 v2 hook（`useAgent`、`useFrontendTool`、`useAgentContext`、`useInterrupt`、`useHumanInTheLoop`…）与组件（`CopilotChat`/`CopilotSidebar`/`CopilotPopup`），并把 v1 弃用词（`useCopilotAction`、`CoAgents`、`CopilotTextarea`）标红拦截
- **集成生态广**：`copilotkit-integrations` 覆盖 LangGraph / CrewAI / PydanticAI / Mastra / Google ADK / LlamaIndex / Agno / Strands / MS Agent Framework / A2A / MCP Apps，统一走 **AG-UI 协议**
- **协议级深度**：`copilotkit-agui` 直讲 AG-UI 事件族、SSE 线格式、`AbstractAgent.run()`，能自建后端而非只当调库人
- **配套 MCP 文档服务器**：内置 `copilotkit-docs`（`mcp.copilotkit.ai/mcp`）提供 `search-docs`/`search-code`/`search-ag-ui-docs`/`search-ag-ui-code`，让 agent 查实时官方文档而非硬背
- **跨 agent**：`npx skills add` 一条命令装进各家 CLI，同一份技能通吃

**缺点 / 边界**

- **强绑 CopilotKit + React**：技能只服务 CopilotKit 生态，React/Next.js 前端为主，不是通用 AI 框架教程
- **v2 为准、v1 混用有坑**：v1（GraphQL runtime）与 v2（AG-UI）API 差异大，升级需 `copilotkit-upgrade` 逐条替换，混用易踩弃用 API
- **需自备 LLM Key 与后端**：`BuiltInAgent` 要 `OPENAI_API_KEY` 等，runtime 要能跑（Next.js API 路由或独立 Express/Hono）
- **skill 是「指令」不是「魔法」**：它教 agent 怎么做，具体架构取舍、密钥与部署仍靠你

## 适用场景

- 给 React / Next.js 应用**加 AI copilot**（聊天、生成式 UI、前端工具调用）想有官方最佳实践护航
- 把 **LangGraph / CrewAI / Mastra** 等 agent 框架接进前端（走 AG-UI 协议）
- **自建 AG-UI 后端**、需要理解事件流与 SSE 传输
- CopilotKit runtime **连不通 / 不响应 / 流式报错**时的系统化排障
- 把老项目从 **v1 迁移到 v2**（`CopilotKit`→`CopilotKitProvider`、`useCopilotAction`→`useFrontendTool`…）

## 边界

- **不是单个技能，是官方技能矩阵**：1 路由 + 8 专用，各有触发条件，按任务激活
- **v2 优先**：默认教 v2（AG-UI），v1 术语被显式标为「勿用」
- **框架绑定**：面向 CopilotKit + React 生态，非平台无关的通用 agent 教程
- **`copilotkit-self-update` 只更新技能本身**：刷新 SKILL.md 知识，不是升级你项目里的 CopilotKit 依赖（那是 `copilotkit-upgrade`）

## 官方文档

[CopilotKit 官方文档 docs.copilotkit.ai](https://docs.copilotkit.ai) ｜ [Agent Skills 开放标准 agentskills.io](https://agentskills.io) ｜ [AG-UI 协议](https://docs.ag-ui.com)

## GitHub 地址

[CopilotKit/CopilotKit · skills/](https://github.com/CopilotKit/CopilotKit/tree/main/skills)（权威源，MIT）｜ [CopilotKit/skills](https://github.com/CopilotKit/skills)（已迁移的独立仓）

## 内容地图

- [入门](./getting-started) —— 官方定位、安装、8 sub-skills 总览、路由 skill 机制、CopilotKit 是什么
- [指南](./guide-line) —— 8 skills 逐个讲、AG-UI 协议、集成框架、全生命周期、反模式
- [参考](./reference) —— 8 skills 全表 + v2 API 速查 + AG-UI 事件族 + 集成矩阵 + 安装 + 链接

## 幻灯片地址

<a href="/SlideStack/copilotkit-skills-slide/" target="_blank">CopilotKit Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=627" target="_blank" rel="noopener noreferrer">CopilotKit Skills 测试题</a>
