---
layout: doc
outline: [2, 3]
---

# AI 与 Agent

> 基于 VS Code 官方文档（2026）。2026 版文档已从「Copilot 插件」重构为 **agent-first** 范式，主路径迁移到 `/docs/agents/*`。

## 两条 AI 线

VS Code 的 AI 能力分两条线：

1. **边写边补全** —— 内联建议（ghost text）与 NES（下一处编辑建议）
2. **对话式协作** —— Chat，含 **Ask / Plan / Agent** 三种内置智能体（persona）

::: warning 术语已变（高频易错）
旧版「Ask / Edit / Agent 三模式」中的 **Edit 模式已被 Agent 吸收**，不再独立；旧的「custom chat modes」改名 **custom agents**，文件从 `.chatmode.md` 改为 `.agent.md`。
:::

## 内联建议与 NES

| 能力 | 说明 | 接受方式 |
| --- | --- | --- |
| 内联建议 inline suggestion | 光标处续写的灰色幽灵文本 | 全部接受 `Tab`；按词接受 `Ctrl+→` · `⌘→` |
| NES（Next Edit Suggestions） | 预测**下一处要改的位置和内容**（跨行/联动） | gutter 出现箭头，`Tab` 跳转、再 `Tab` 接受 |

NES 由 `github.copilot.nextEditSuggestions.enabled` 控制，与普通补全是两个开关。

## Chat 的三种入口

```text
Ctrl+Alt+I       · ⌃⌘I     Chat 视图（侧边栏，贴着工作区做聚焦任务）
Ctrl+I           · ⌘I      Inline Chat（编辑器/终端内就地改，diff 展示）
Ctrl+Shift+Alt+L · ⇧⌥⌘L   Quick Chat（轻量浮层）
```

## 三种 persona

| persona | 定位 | 是否改文件 |
| --- | --- | --- |
| **Ask** | 问答、解释代码 | 否 |
| **Plan** | 先研究、提澄清问题，产出实现计划（自动存 `/memories/session/plan.md`） | 否（只出计划） |
| **Agent** | 自主端到端：规划 → 多文件编辑 → 跑命令 → 自我纠错直到完成 | 是 |

## Agent 模式

- **启用**：设置 `chat.agent.enabled`；登录 GitHub 账号后在 Chat 的下拉里选 **Agent**
- **能力**：多文件编辑、执行终端命令、自我迭代纠错、调用工具（含 MCP）
- **Agent 类型**：
  - **Local**：在 VS Code 内本地跑，**关窗即停**
  - **Copilot CLI**：本机后台独立进程，**关闭 VS Code 仍继续跑**；`/remote on` 把会话镜像到 GitHub.com / GitHub Mobile 远程审批
  - **Cloud**：跑在 GitHub 远程基础设施，异步执行并**自动开 PR**

## 自定义

统一入口命令 **Chat: Open Customizations**。常用机制：

| 机制 | 文件 | 要点 |
| --- | --- | --- |
| 全局指令 | `.github/copilot-instructions.md` | 工作区始终生效；`/init` 可让 AI 分析代码库生成 |
| 作用域指令 | `.github/instructions/*.instructions.md` | frontmatter `applyTo` glob 按文件类型生效 |
| 通用约定 | `AGENTS.md` / `CLAUDE.md` | 根目录自动检测，原生支持 |
| 提示文件 | `.github/prompts/*.prompt.md` | 聊天里输 `/<提示名>` 调用，可带参 |
| 自定义智能体 | `.github/agents/*.agent.md` | 限定 tools/model/handoffs 等 |
| 技能 | `.github/skills/<name>/SKILL.md` | 跨 agent 开放标准，三级渐进加载 |
| 外部工具 | `.vscode/mcp.json` | MCP 服务器 |

::: warning MCP 配置写法（易错）
VS Code 的 MCP 配置文件是 `.vscode/mcp.json`，顶层键是 **`servers`**（不是 Claude Desktop 那种 `mcpServers`）；transport 支持 `stdio` / `http` / `sse`。
:::

## Agents Window 与权限

- **Agents Window**（Preview）：agent-first 的专用窗口，跨所有工作区并行编排多个 agent；`code --agents` 启动，与 Chat 视图**共享同一套会话与设置**
- **三级权限**：
  - **Default Approvals**：按配置弹确认
  - **Bypass Approvals**：自动批准工具调用，仍会问澄清问题
  - **Autopilot**：自动批准 **且**自动回答澄清问题，持续自主迭代

::: warning 破坏性操作
Bypass / Autopilot 会跳过对删文件、跑命令、调用外部工具的确认；终端自动批准仍可能被提示注入（prompt injection）绕过，谨慎使用。
:::

## 模型选择

- 聊天输入框的模型选择器，**Auto** 按任务复杂度与实时可用性自动路由
- **agent 模式要求模型支持工具调用（tool calling）**，否则不会出现在选择器中
- 支持 **BYOK**（自带 Key/端点）与 **Ollama 本地模型**（可无网络/无订阅使用）

> 可选模型清单随时间变化，以选择器实际显示为准。
