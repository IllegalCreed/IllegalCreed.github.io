---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Kiro 官方文档（2026）。Kiro 由 AWS 出品，核心理念是「vibe coding 的流畅 + specs 的清晰」。

## 速查

- 下载：<https://kiro.dev>（IDE / CLI / Web 三形态）
- 三大支柱：**Specs / Hooks / Steering**（+ Agentic Chat、MCP）
- 规格目录：`.kiro/specs/<feature>/`
- 引导目录：`.kiro/steering/`
- MCP 配置：`.kiro/settings/mcp.json`

## Vibe 与 Spec 两种方式

| 方式 | 适用 |
| --- | --- |
| **Vibe**（探索式） | 对话式开发：问代码库、要解释、直接改代码，适合探索/试验 |
| **Spec**（规格驱动） | 绑定结构化需求/设计/任务，适合要进生产、需可维护性的特性 |

Kiro 会智能识别意图（疑问句→解释；"Create/Fix"→实施改动），无需手动切模式。

## Specs：规格驱动开发（核心）

从需求出发生成三份**可版本化**文档，存于 `.kiro/specs/<feature>/`：

| 文件 | 内容 |
| --- | --- |
| `requirements.md` | 需求（EARS 记法） |
| `design.md` | 技术设计：架构、数据流、接口、DB schema |
| `tasks.md` | 离散、可勾选的实现任务清单 |

三阶段流程 **Requirements → Design → Tasks**，阶段间默认有**人工审批关卡**。

::: tip EARS 记法
EARS = Easy Approach to Requirements Syntax，关键词 **WHEN**（触发）/ **THEN**（响应）/ **SHALL**（强制）/ **SHALL CONTINUE TO**（必须保留的既有行为，防回归）。
:::

- **Requirements-First vs Design-First**：创建时二选一，**中途不可改**
- **Quick Plan**：一次性生成三份产物，**跳过阶段间审批关卡**（产物文件相同）
- **任务并发**：独立任务编成 **waves**——**波次串行、波内并发**

## Agent Hooks：事件触发的 agent

当 IDE 内特定事件发生时，自动执行 agent prompt 或 shell 命令。触发事件包括：

- 文件**保存 / 创建 / 删除**
- prompt 提交后、agent turn 完成后
- 工具调用前/后、spec 任务执行前/后
- 手动按需触发

典型用途：保存时自动生成测试、更新文档、安全扫描。命令面板 `Kiro: Open Kiro Hook UI`。

## Steering：引导 agent 行为

用 markdown 给 Kiro 持久的 workspace 知识，目录 `.kiro/steering/`（全局 `~/.kiro/steering/`，**workspace 优先**）。三个基础文件：

- `product.md`（产品目的/用户/功能）、`tech.md`（框架/库/约束）、`structure.md`（文件组织/命名/架构）

四种 inclusion mode（front-matter 键 `inclusion`）：`always`（默认）/ `fileMatch`（+`fileMatchPattern`）/ `manual`（`#name` 引入）/ `auto`。

::: warning AGENTS.md 特例
Kiro 也支持 `AGENTS.md`，但它**不支持 inclusion mode，永远全量包含**。
:::

## MCP 与模型

- MCP 配置 `.kiro/settings/mcp.json`（全局 `~/.kiro/settings/mcp.json`，workspace 优先），顶层键 `mcpServers`，`autoApprove` 可免确认
- 模型：付费档 **Auto**（混用多前沿模型）/ Claude 系 / 开放权重（Qwen·DeepSeek）；免费档 Claude Sonnet 4.5
- 自主度：**Autopilot**（自主改文件）/ **Supervised**（逐项批准）

## 下一步

- 规格、Steering、Hooks 进阶：见 [规格与引导](./guideline-spec.md)
