---
layout: doc
outline: [2, 3]
---

# 规格与引导

> 基于 Kiro 官方文档（2026）。Specs、Hooks、Steering 是 Kiro 的三大支柱。

## Specs 工作流深入

三阶段 **Requirements → Design → Tasks**，阶段间默认有**人工审批关卡**：

| 阶段 | 产物 |
| --- | --- |
| Requirements（或 Bug Analysis） | `requirements.md`（EARS）/ bugfix 用 `bugfix.md` |
| Design | `design.md`（架构/数据流/接口/schema） |
| Tasks | `tasks.md`（可勾选任务） |

- **两种工作流**（创建时二选一，**中途不可改**）：
  - **Requirements-First**：已知系统行为、架构可灵活设计
  - **Design-First**：已有技术设计或有严格非功能约束（延迟/吞吐/合规）
- **Quick Plan**：一次性生成三份产物，**跳过审批关卡**（产物文件相同），适合可信任的特性/原型
- **任务并发（waves）**：独立任务编成波次——**波次串行、波内并发**
- 最佳实践：一个仓库用**多个细粒度 spec**，与代码一起纳入版本控制

## EARS 记法

EARS = **Easy Approach to Requirements Syntax**，把需求写成可测试的结构化句式。官方关键词：

- `WHEN`（触发条件）→ `THEN`（系统响应）→ `SHALL`（强制要求）
- `SHALL CONTINUE TO`（必须保留的既有行为，防回归——bugfix 常用）

## Agent Hooks

事件触发的 agent，自动执行 prompt 或 shell 命令。触发事件：

- 文件**保存 / 创建 / 删除**
- **prompt 提交后**、**agent turn 完成后**
- 工具调用**前/后**、spec 任务执行**前/后**
- 手动按需触发

创建方式：① 自然语言（"Ask Kiro to create a hook"）；② 手动表单（Event type / File pattern / Action）。入口命令 `Kiro: Open Kiro Hook UI`。

## Steering：inclusion modes

`.kiro/steering/`（全局 `~/.kiro/steering/`，**workspace 优先**）的三个基础文件 `product.md` / `tech.md` / `structure.md`，通过 front-matter 的 `inclusion` 控制注入时机：

| mode | 行为 |
| --- | --- |
| `always`（默认） | 每次交互都加载 |
| `fileMatch` + `fileMatchPattern` | 仅匹配文件时激活（如 `components/**/*.tsx`） |
| `manual` | 聊天中用 `#<name>` 按需引入 |
| `auto` + `name` + `description` | 按请求相关性自动判断引入 |

::: warning AGENTS.md 特例（易错）
Kiro 支持 `AGENTS.md`，但它**不支持 inclusion mode、永远全量包含**——与 steering 文件的可控注入不同。
:::

## MCP

- 配置文件 `.kiro/settings/mcp.json`（全局 `~/.kiro/settings/mcp.json`，workspace 优先）
- 顶层键 `mcpServers`；本地用 `command`+`args`，远程用 `url`
- `autoApprove`（自动批准的工具名数组，`"*"` 全部）、`disabled`（临时停用）

```json
// .kiro/settings/mcp.json
{ "mcpServers": {
  "aws-docs": { "command": "uvx", "args": ["awslabs.aws-documentation-mcp-server"], "autoApprove": [] }
}}
```
