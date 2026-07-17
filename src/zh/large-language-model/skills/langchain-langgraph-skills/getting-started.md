---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 langchain-ai/langchain-skills 官方各 SKILL.md（ecosystem-primer / langchain-fundamentals / langgraph-fundamentals / deep-agents-core 等）编写。

## 速查

- **是什么**：LangChain 官方 agent 技能集，教用 LangChain/LangGraph/Deep Agents 建 agent
- **三层栈**：**Deep Agents**（harness，batteries-included）→ **LangGraph**（runtime，durable 编排）→ **LangChain**（framework，模型/工具/agent 循环）+ **LangSmith**（可观测/评测，横切）
- **入口 skill**：`ecosystem-primer`（**INVOKE FIRST**）——先选型再写码
- **关键 API**：LangChain `create_agent()` · LangGraph `StateGraph` · Deep Agents `create_deep_agent()`
- **装**：`npx skills add langchain-ai/langchain-skills --skill '*' --yes`（`--global` 全局，`--agent claude-code` 指定）
- **实测**：Claude Code LangChain 任务 **29%→95%**；官方，早期开发（内容可能变）

## 三层栈（选型基础）

LangChain Inc. 维护三层开源 agent 工具 + LangSmith，自顶向下：

| 层 | 角色 | 说明 |
| --- | --- | --- |
| **Deep Agents** | 顶层 harness | batteries-included：规划、文件管理、子代理派生、记忆开箱即用 |
| **LangGraph** | 中层 runtime | 低层编排：durable 执行、自定义控制流、有状态工作流；LangChain agent 跑在其上 |
| **LangChain** | 底层 framework | 模型/工具/agent 循环抽象；provider 无关，最易上手 |
| **LangSmith** | 横切 | 可观测 + 评测；框架无关，始终推荐搭配 |

> 高层依赖低层，但你**不必直接用低层**：Deep Agents 让你不写 graph 代码就获得 LangGraph 的 durable 执行；LangChain 让你不管 graph 边就用上模型和工具。

## 安装

```bash
# 本项目
npx skills add langchain-ai/langchain-skills --skill '*' --yes

# 全局（所有项目）
npx skills add langchain-ai/langchain-skills --skill '*' --yes --global

# 指定 agent（如 Claude Code）
npx skills add langchain-ai/langchain-skills --agent claude-code --skill '*' --yes
```

遵开放 Agent Skills 标准（skills.sh），Claude Code / Cursor / Windsurf 等均可装。

## 渐进披露：先 ecosystem-primer

`ecosystem-primer` 的 description 明确「**任何 LangChain/LangGraph/Deep Agents 建 agent 项目，动手写码前先读它**」——它给最新的框架选型（LangChain vs LangGraph vs Deep Agents vs 混合）、agent 模式、安装、环境配置，并告诉你**下一个该加载哪个 skill**。这是渐进披露的入口。

## 下一步

- [指南](./guide-line) —— 14 skill 分组、create_agent/StateGraph/create_deep_agent、RAG/middleware/持久化
- [参考](./reference) —— 14 skill 清单、安装、三层选型表、链接
