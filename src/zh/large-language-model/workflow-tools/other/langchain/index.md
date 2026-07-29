---
layout: doc
---

# LangChain

LangChain 是面向**大语言模型（LLM）应用**的编排框架，2025 年 10 月与 LangGraph 同步发布 **1.0 LTS** 稳定版（支持到 2026-12，2.0 前无破坏性变更）。它把 LLM 应用拆成可组合的抽象层：底层 `langchain-core` 定义统一的 **Runnable 接口**（`invoke` / `batch` / `stream` + 异步族 + 管道符 `|` 串联），上层 `langchain` 提供**模型/提示/工具/记忆/RAG/Agent** 等具体集成与高级 API；生态还包括 `langgraph`（**状态图编排运行时**，可独立使用）、`langsmith`（**观测与评估**，横跨两者）。1.0 的关键变化是：**`create_agent`** 取代旧 `AgentExecutor` 成为构造 agent 的标准 API（底层基于 LangGraph），**Middleware**（`@before_model` / `@after_model` / `wrap_model_call` / `wrap_tool_call` 等）成为自定义 agent 行为的主扩展范式，记忆机制改用 **graph state.messages + Checkpointer(thread_id)** 而非已弃用的 `ConversationBufferMemory`。LCEL（LangChain Expression Language）仍是 Runnable 的组合语法，适合线性流水线（`prompt | model | parser`），但复杂流程（循环 / 条件分支 / 中断 / HITL）推荐直接用 LangGraph `StateGraph`。

## 评价

**优点**

- **统一抽象 + 生态完整**：跨提供商（OpenAI / Anthropic / Gemini / Ollama 等）的 Chat Model、Embeddings、Vector Store、Document Loader 一套接口切换；`init_chat_model()` 工厂让模型替换零成本
- **LCEL 声明式组合**：`prompt | model | parser` 用管道符串联，组件级自动获得 batch / async / streaming / 重试 / fallbacks
- **LangGraph 编排能力强**：StateGraph + Command + Send 原生支持循环、条件分支、map-reduce、human-in-the-loop、断点续跑
- **LangSmith 可观测性**：设环境变量即自动追踪，配合 Datasets / Evaluators / Experiments 做在线评测与回归
- **LTS 稳定承诺**：1.0 支持到 2026-12，2.0 前无破坏性变更，生产可用
- **官方文档迁移到 docs.langchain.com**：1.0 后文档结构清晰，弃用边界明确

**缺点**

- **抽象层多、学习曲线陡**：LangChain / langchain-core / LCEL / LangGraph / LangSmith 五个概念容易混淆，新手上手成本高
- **1.0 迁移代价大**：旧代码用 `AgentExecutor` / `ConversationBufferMemory` / `LLMChain` 大量已弃用，迁移到 `create_agent` + state 需要重写
- **LangServe 已弃用**：2024-11-18 进入维护态，新项目必须改用 LangGraph Platform（商业部署）
- **历史包袱重**：网上 v0.x 教程代码（Memory、AgentExecutor）仍大量流传，照搬会触发 `LangGraphDeprecatedSinceV10` 警告
- **私有数据流式可能泄露**：graph state 中的私有数据默认不出现在 output_keys，但流式时仍可能暴露，需显式收紧
- **节点重跑风险**：interrupt 恢复或重试时受影响节点会从头重跑，非幂等副作用（发邮件 / 扣款）需自己加去重

## 文档地址

- [LangChain 官方总入口（docs.langchain.com）](https://docs.langchain.com/oss/python/langchain/overview)
- [LangGraph Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)
- [@tool / ToolRuntime 工具官方说明](https://docs.langchain.com/oss/python/langchain/tools)
- [短期记忆 / Checkpointer / SummarizationMiddleware](https://docs.langchain.com/oss/python/langchain/short-term-memory)
- [LangChain 1.0 + LangGraph 1.0 LTS 公告](https://www.langchain.com/blog/langchain-langgraph-1dot0)

## GitHub地址

[langchain-ai/langchain](https://github.com/langchain-ai/langchain) · [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) · [langchain-ai/langserve（已弃用）](https://github.com/langchain-ai/langserve)

## 幻灯片地址

<a href="/SlideStack/langchain-slide/" target="_blank">LangChain</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">LangChain 测试题</a>
