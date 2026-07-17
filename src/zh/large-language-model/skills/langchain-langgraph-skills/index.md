---
layout: doc
---

# LangChain & LangGraph Skills

LangChain & LangGraph Skills 是 **LangChain 官方**（源在 `langchain-ai/langchain-skills`，同 org 另有 langsmith-skills / skills-benchmarks）出品的一组 agent 技能——面向用 **LangChain / LangGraph / Deep Agents** 建 agent 的编码任务，把这三层栈的最新正确用法（框架选型、`create_agent()`、`StateGraph`、`create_deep_agent()`、RAG、middleware、持久化等）以 SKILL.md 渐进披露给编码 agent。官方博客数据：接入这套 skills 把 Claude Code 在 LangChain 相关任务上的通过率**从 29% 提到 95%**。仓库含 **14 个 skill**，其中 `ecosystem-primer` 是「INVOKE FIRST」入口——任何建 agent 项目先读它做框架选型，再按需加载后续 skill。

## 评价

**优点**

- **LangChain 官方**：langchain-ai org 出品、随框架演进、权威
- **三层栈清晰**：Deep Agents（harness）→ LangGraph（runtime）→ LangChain（framework）+ LangSmith（可观测），ecosystem-primer 帮你选型
- **渐进披露**：14 skill 按需加载，`ecosystem-primer` 先行、再按任务加载 langchain/langgraph/deep-agents 对应 skill
- **强导向正确 API**：如 langchain-fundamentals 明确「建 agent 必须用 `create_agent()`，其它写法都过时」——避免训练数据里的旧 API
- **实测提升大**：Claude Code LangChain 任务 **29%→95%**
- **覆盖全**：fundamentals / middleware / RAG / 持久化 / human-in-the-loop / CLI / swarm / deep-agents core·memory·orchestration
- 安装 `npx skills add langchain-ai/langchain-skills`（遵开放 Agent Skills 标准，Claude Code/Cursor/Windsurf 等）

**缺点 / 边界**

- **早期开发**：README 自带 warning「APIs and skill content may change」
- **面向 LangChain 生态**：非通用 agent 技能
- **偏 Python**：LangChain/LangGraph 主线是 Python（也有 JS/TS）
- **需配合最新文档**：skill 是工作清单/护栏，深细节仍指向官方文档

## 适用场景

- 用 LangChain `create_agent()` 建生产 agent（tools + middleware）
- 用 LangGraph `StateGraph` 编排有状态/durable 工作流
- 用 Deep Agents `create_deep_agent()` 建 batteries-included agent（规划/文件/子代理/记忆）
- LangChain RAG、middleware、human-in-the-loop、持久化

## 边界

- **LangChain/LangGraph/Deep Agents 生态专用**
- **早期开发**：内容可能变
- **主线 Python**（有 JS/TS）
- **贡献到 langchain-ai/langchain-skills**

## 官方文档

[LangChain Skills 博客](https://www.langchain.com/blog/langchain-skills) ｜ [Deep Agents Skills 文档](https://docs.langchain.com/oss/python/deepagents/skills) ｜ [docs.langchain.com](https://docs.langchain.com)

## GitHub 地址

[langchain-ai/langchain-skills](https://github.com/langchain-ai/langchain-skills)（官方）

## 内容地图

- [入门](./getting-started) —— 定位、三层栈、安装、ecosystem-primer 入口、29%→95%
- [指南](./guide-line) —— 14 skill 分组、create_agent/StateGraph/create_deep_agent、RAG/middleware/持久化
- [参考](./reference) —— 14 skill 清单、安装命令、三层选型表、链接

## 幻灯片地址

<a href="/SlideStack/langchain-langgraph-skills-slide/" target="_blank">LangChain & LangGraph Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=626" target="_blank" rel="noopener noreferrer">LangChain & LangGraph Skills 测试题</a>
