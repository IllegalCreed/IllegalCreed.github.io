---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 LangChain 官方文档（docs.langchain.com）编写，对照 LangChain 1.0 + LangGraph 1.0 LTS（2025-10）

## 速查

- 生态：`langchain`（agent 抽象 + 集成）/ `langchain-core`（Runnable 接口）/ `langgraph`（状态图运行时）/ `langsmith`（观测）
- 1.0 标准构造：`create_agent(model, tools, system_prompt, middleware, checkpointer)`
- 跨提供商工厂：`init_chat_model()` / `init_embeddings()`
- 结构化输出首选：`model.with_structured_output(PydanticSchema)`
- 工具：`@tool` + `ToolRuntime`
- 短期记忆：`state.messages` + `Checkpointer(thread_id)`
- LangGraph 三要素：State（+ Reducer）/ Node / Edge
- Command：`Command(update=, goto=, resume=, graph=Command.PARENT)`
- Checkpointer：`InMemorySaver` / `SqliteSaver` / `PostgresSaver`
- 默认 `recursion_limit=1000` super-steps
- 安装：`pip install -U langchain langchain-core langgraph`
- 完整说明见 [入门](./getting-started.md) / [核心 API 与最佳实践](./guide-line.md)

## 核心 API 速查

### 模型初始化

| API | 作用 |
| --- | --- |
| `init_chat_model(model, model_provider, **kwargs)` | 跨提供商统一初始化 Chat Model（1.0 推荐） |
| `init_embeddings(model, model_provider)` | 跨提供商统一初始化 Embeddings |
| `ChatOpenAI` / `ChatAnthropic` / `ChatGoogleGenerativeAI` | 各提供商直连类 |
| `model.with_structured_output(schema)` | 走 tool/function calling 拿结构化输出 |

### LCEL Runnable

| 方法 | 作用 |
| --- | --- |
| `invoke(x)` / `ainvoke(x)` | 单条同步 / 异步 |
| `batch([...])` / `abatch([...])` | 批量同步 / 异步 |
| `stream(x)` / `astream(x)` | 同步 / 异步流式 |
| `stream_events(x)` | 流式 + 中间事件 |
| `with_retry(stop=..., wait=...)` | 重试 |
| `with_fallbacks([...])` | 兜底链 |
| `|` 管道符 | 串联 Runnable |

### LCEL 基础组件

| 组件 | 作用 |
| --- | --- |
| `RunnablePassthrough` | 透传输入（常用于把 question 同时送下去） |
| `RunnableParallel({...})` | 并行执行多个 Runnable 组字典 |
| `RunnableLambda(fn)` | 把普通函数包成 Runnable |
| `RunnableAssign({...})` | 给字典加键 |
| `itemgetter("key")` | 从字典取键 |

### Prompt / Parser

| API | 作用 |
| --- | --- |
| `PromptTemplate.from_template(tpl)` | 字符串模板 |
| `ChatPromptTemplate.from_messages([...])` | 聊天消息模板 |
| `MessagesPlaceholder("history")` | 占位历史消息列表 |
| `prompt.partial(**kwargs)` | 提前填部分变量 |
| `StrOutputParser()` | 取 AIMessage.content 字符串 |
| `PydanticOutputParser(pydantic_schema)` | 老牌结构化解析（已被 `with_structured_output` 取代） |
| `JsonOutputParser()` / `CommaSeparatedListOutputParser()` | JSON / 列表解析 |

### 工具

| API | 作用 |
| --- | --- |
| `@tool` | 函数装饰器，自动生成 schema |
| `@tool("name", description=..., args_schema=...)` | 自定义 name/description/args_schema |
| `ToolRuntime` 参数 | 注入 state/context/store/stream_writer，对模型隐藏 |
| `InjectedToolArg` / `InjectedState` | 旧注入方式（**已弃用**） |

### Agent / Middleware（1.0）

| API | 作用 |
| --- | --- |
| `create_agent(model, tools, system_prompt, middleware, checkpointer, state_schema)` | 1.0 标准 agent 构造 |
| `create_deep_agent(...)` | 内置 write_todos / read_file / 子代理 |
| `@before_model` | 调模型前钩子 |
| `@after_model` | 调模型后钩子 |
| `@dynamic_prompt` | 动态组装 prompt |
| `wrap_model_call` | 包裹整个 model call（重试 / 缓存） |
| `wrap_tool_call` | 包裹工具调用（权限 / 限流） |
| `SummarizationMiddleware(model, trigger=, keep=)` | 长对话压缩 |

### LangGraph

| API | 作用 |
| --- | --- |
| `StateGraph(state_schema)` | 状态图构建器 |
| `MessagesState` | 预置的 messages 累积 state |
| `add_node(name, fn)` | 加节点 |
| `add_edge(a, b)` | 加固定边 |
| `add_conditional_edges(src, routing_fn, mapping)` | 加条件边 |
| `compile(checkpointer=, ...)` | 编译成可执行图 |
| `START` / `END` | 虚拟节点 |
| `add_messages` | 消息 reducer（按 id 合并） |
| `Command(update=, goto=, resume=, graph=Command.PARENT)` | 状态更新 + 路由合一 |
| `Send(node, state)` | map-reduce 动态 fan-out |
| `interrupt(value)` | 暂停等人工输入 |
| `InMemorySaver` / `SqliteSaver` / `PostgresSaver` | Checkpointer 实现 |
| `recursion_limit` | 默认 1000 super-steps |

### RAG

| 组件 | 作用 |
| --- | --- |
| `WebBaseLoader` / `PyPDFLoader` / `DirectoryLoader` | 文档加载 |
| `RecursiveCharacterTextSplitter` | 递归字符切分（默认推荐） |
| `OpenAIEmbeddings` / 各提供商 Embeddings | 向量化 |
| `Chroma` / `FAISS` / `Pinecone` / `PGVector` | 向量库 |
| `vectorstore.as_retriever(search_kwargs={"k": 4})` | 转 Retriever（Runnable） |

## 弃用迁移表

| 旧（已弃用 / 仅维护） | 新（1.0） | 弃用时间 |
| --- | --- | --- |
| `AgentExecutor` / `create_openai_tools_agent` / `create_react_agent` | `create_agent` | v1.0 |
| `LLMChain` / `ConversationChain` | LCEL（`prompt \| model \| parser`）或 `create_agent` | v0.1+ |
| `ConversationBufferMemory` / `ConversationSummaryMemory` | `state.messages` + `Checkpointer` | v0.3 起，v1.0 警告 |
| `ChatMessageHistory` / `RedisChatMessageHistory` 等 | `Checkpointer(thread_id)` | v0.3 起 |
| `InjectedState` / `InjectedToolArg` | `ToolRuntime` 参数 | v1.0 |
| `LangServe` / `RemoteRunnable` | LangGraph Platform | 2024-11-18 |
| `LLMs`（非 Chat）类（如 `OpenAI`） | `ChatOpenAI` 等 Chat Model | 已边缘化 |
| 手写 `PydanticOutputParser` + 重试 | `model.with_structured_output(schema)` | 1.0 推荐 |

> 迁移工具：`pip install langchain-classic` 临时保留旧抽象，降低 1.0 升级成本。

## 版本与状态

| 项 | 取值 |
| --- | --- |
| 当前稳定版 | **LangChain 1.0** + **LangGraph 1.0**（2025-10） |
| 状态 | ACTIVE，LTS |
| LangChain 1.0 支持到 | **2026-12**（2.0 发布前无破坏性变更，仅安全 / 关键修复） |
| langchain-core | 同步 1.0，无破坏性 + 核心新增 |
| LangGraph 1.0 支持到 | 2.0 发布前 |
| 1.0 关键变化 | `create_agent` 成为标准 / `langchain-classic` 过渡包 / Middleware 主范式 |
| 安装 | `pip install -U langchain langchain-core langgraph` |

## 反模式速查

- 新项目用 LangServe / RemoteRunnable 部署 → 已弃用，改 LangGraph Platform
- 用 AgentExecutor 或旧 `create_xxx_agent` → 改 `create_agent`
- 用 ConversationBufferMemory / ChatMessageHistory → 改 state + Checkpointer
- 用 LCEL 拼复杂状态机 → 改 LangGraph StateGraph
- 用 InjectedState / InjectedToolArg → 改 ToolRuntime
- LangGraph 节点写非幂等副作用不做去重 → 加 idempotency key
- `with_structured_output` 不传 Pydantic schema → 必传清晰 schema
- 私有数据进 graph state 不收紧 output_keys → 显式收紧防 stream 泄露
- 照搬 v0.x 教程代码 → 按迁移指南重写

## 官方资源

- LangChain 总入口：[https://docs.langchain.com/oss/python/langchain/overview](https://docs.langchain.com/oss/python/langchain/overview)
- LangGraph Graph API：[https://docs.langchain.com/oss/python/langgraph/graph-api](https://docs.langchain.com/oss/python/langgraph/graph-api)
- @tool / ToolRuntime：[https://docs.langchain.com/oss/python/langchain/tools](https://docs.langchain.com/oss/python/langchain/tools)
- 短期记忆 / Checkpointer：[https://docs.langchain.com/oss/python/langchain/short-term-memory](https://docs.langchain.com/oss/python/langchain/short-term-memory)
- LangChain 1.0 + LangGraph 1.0 LTS 公告：[https://www.langchain.com/blog/langchain-langgraph-1dot0](https://www.langchain.com/blog/langchain-langgraph-1dot0)
- LangServe 弃用公告：[https://github.com/langchain-ai/langserve](https://github.com/langchain-ai/langserve)
- GitHub：[langchain-ai/langchain](https://github.com/langchain-ai/langchain) · [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph)
- LangSmith：[https://smith.langchain.com](https://smith.langchain.com)
