---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 langchain-ai/langchain-skills 官方仓（config/skills/ 14 个）与 docs.langchain.com 编写。

## 速查

- **装**：`npx skills add langchain-ai/langchain-skills --skill '*' --yes`（`--global` / `--agent claude-code`）
- **入口**：`ecosystem-primer`（INVOKE FIRST）
- **三层 API**：`create_agent()` / `StateGraph`.compile() / `create_deep_agent()`
- **官方**：langchain-ai org，早期开发
- **实测**：Claude Code LangChain 任务 29%→95%

## 14 skill 清单

| skill | 层 | 用途 |
| --- | --- | --- |
| `ecosystem-primer` | 入口 | **INVOKE FIRST**：框架选型 + 下一步加载哪个 |
| `langchain-fundamentals` | LangChain | `create_agent()` + tools + middleware |
| `langchain-middleware` | LangChain | 自定义流程 / human-in-the-loop / 错误处理 |
| `langchain-rag` | LangChain | 检索增强生成 |
| `langchain-dependencies` | LangChain | 依赖管理 |
| `langgraph-fundamentals` | LangGraph | StateGraph / 节点边 / Command / Send |
| `langgraph-persistence` | LangGraph | checkpoint 持久化 |
| `langgraph-human-in-the-loop` | LangGraph | 中断审批 |
| `langgraph-cli` | LangGraph | CLI 本地开发/部署 |
| `deep-agents-core` | Deep Agents | `create_deep_agent()` + harness 架构 + SKILL.md 格式 |
| `deep-agents-memory` | Deep Agents | 长期记忆 |
| `deep-agents-orchestration` | Deep Agents | 编排 |
| `managed-deep-agents` | Deep Agents | 托管版 |
| `swarm` | 多 agent | swarm 协作模式 |

## 三层栈选型

| 层 | 角色 | 关键 API | 何时用 |
| --- | --- | --- | --- |
| Deep Agents | harness | `create_deep_agent()` | 要 batteries-included，复杂长任务 |
| LangGraph | runtime | `StateGraph` + `compile()` | 完全自定义控制流 / durable 状态机 |
| LangChain | framework | `create_agent()` | 轻量、易上手、工具调用 agent |
| LangSmith | 横切 | — | 可观测 + 评测，始终搭配 |

## create_agent 关键参数

| 参数 | 用途 |
| --- | --- |
| `model` | LLM（`"anthropic:claude-sonnet-4-5"` 或实例） |
| `tools` | 工具列表 |
| `system_prompt` | 指令 |
| `checkpointer` | 状态持久化（`MemorySaver()`） |

## LangGraph 概念

StateGraph（主类）· Nodes（更新 state）· Edges（静态/条件）· START/END · State + Reducers（合并规则）· Command（控制流）· Send（扇出）· **执行前 `compile()`**。

## 安装与许可

- **装**：`npx skills add langchain-ai/langchain-skills`（开放 Agent Skills 标准）
- **早期开发**：README warning「APIs and skill content may change」
- **贡献**：改 langchain-ai/langchain-skills
- **自我改进**：搭配 [langsmith-skills](https://github.com/langchain-ai/langsmith-skills)（观测/评测/迭代）

## 资源链接

- 仓库：[langchain-ai/langchain-skills](https://github.com/langchain-ai/langchain-skills)
- 博客：[LangChain Skills](https://www.langchain.com/blog/langchain-skills)
- Deep Agents Skills：[docs.langchain.com/oss/python/deepagents/skills](https://docs.langchain.com/oss/python/deepagents/skills)
- 相关叶：[Mastra Skills](../mastra-skills/) · [CopilotKit Skills](../copilotkit-skills/)（同「AI 应用开发」组）
