---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 langchain-ai/langchain-skills 官方各 SKILL.md 编写（config/skills/ 下 14 个）。

## 速查

- **LangChain**：`create_agent()` 建 agent（必须用它，旧写法都过时）+ `@tool`/`tool()` + middleware
- **LangGraph**：`StateGraph`（节点/边/START·END/带 reducer 的 state/Command/Send），执行前必 `compile()`
- **Deep Agents**：`create_deep_agent()`——内建 TodoList 规划/文件系统/SubAgent 派生/长期记忆 Store/human-in-the-loop/Skills，「配置而非实现」
- **入口**：`ecosystem-primer`（INVOKE FIRST 选型）
- 14 skill 覆盖：fundamentals / middleware / rag / 持久化 / human-in-the-loop / cli / swarm / managed-deep-agents

## LangChain 层：create_agent()

`langchain-fundamentals` 的硬规矩：**建 LangChain agent 必须用 `create_agent()`**（处理 agent 循环、工具执行、状态管理），其它写法都过时。核心配置：

| 参数 | 用途 | 例 |
| --- | --- | --- |
| `model` | 用哪个 LLM | `"anthropic:claude-sonnet-4-5"` 或模型实例 |
| `tools` | 工具列表 | `[search, calculator]` |
| `system_prompt` | agent 指令 | `"You are a helpful assistant"` |
| `checkpointer` | 状态持久化 | `MemorySaver()` |

工具用 `@tool` 装饰器或 `tool()` 函数定义；自定义流程（human-in-the-loop、错误处理）用 **middleware**（`langchain-middleware`）。

## LangGraph 层：StateGraph

`langgraph-fundamentals`（写任何 LangGraph 代码时 INVOKE）：把 agent 工作流建模为**有向图**：

- **StateGraph**：建有状态图的主类
- **Nodes**：做工作 + 更新 state 的函数
- **Edges**：定义执行顺序（静态或条件）
- **START / END**：入口/出口特殊节点
- **State + Reducers**：控制 state 更新如何合并
- **Command / Send**：动态控制流 / 扇出
- 图**执行前必须 `compile()`**

配套 `langgraph-persistence`（checkpoint 持久化）、`langgraph-human-in-the-loop`（中断审批）、`langgraph-cli`。

## Deep Agents 层：create_deep_agent()

`deep-agents-core`（建任何 Deep Agents 应用时 INVOKE）：建在 LangChain/LangGraph 上的 opinionated 框架，内建 middleware **开箱即用**：

- **任务规划**：`TodoListMiddleware` 拆解复杂任务
- **上下文管理**：文件系统工具（可插拔 backend）
- **任务委派**：`SubAgent` middleware 派生专门子代理
- **长期记忆**：跨 thread 的 Store 持久化
- **human-in-the-loop**：敏感操作审批流
- **Skills**：按需加载专门能力（就是 SKILL.md 那套）

> 理念：**「你配置，而不是实现」**——harness 自动提供这些能力。配套 `deep-agents-memory`、`deep-agents-orchestration`、`managed-deep-agents`（托管版）、`swarm`（多 agent 协作）。

## 何时用哪层

| 用 Deep Agents | 用 LangChain create_agent |
| --- | --- |
| 要 batteries-included（规划/文件/子代理/记忆开箱即用） | 要轻量、自己掌控 agent 循环 |
| 复杂长任务、多步编排 | 简单工具调用 agent |

要完全自定义控制流/durable 状态机 → 直接 LangGraph `StateGraph`。

## 其它 skill

`ecosystem-primer`（选型入口）、`langchain-dependencies`（依赖）、`langchain-rag`（检索增强）、`langgraph-cli`（本地开发/部署）。全程搭配 **LangSmith**（可观测 + 评测）。

## 反模式

| 反模式 | 正确 |
| --- | --- |
| 不读 ecosystem-primer 直接写码 | 先 INVOKE ecosystem-primer 选型 |
| 用旧写法建 LangChain agent | 用 `create_agent()` |
| LangGraph 图不 compile 就跑 | 执行前 `compile()` |
| Deep Agents 手动实现规划/记忆 | 用内建 middleware，配置而非实现 |
| 凭记忆写 API | 早期开发内容常变，对照最新文档/skill |

## 下一步

- [参考](./reference) —— 14 skill 清单、安装、三层选型表、链接
- 上游：[langchain-ai/langchain-skills](https://github.com/langchain-ai/langchain-skills) · [docs.langchain.com](https://docs.langchain.com)
