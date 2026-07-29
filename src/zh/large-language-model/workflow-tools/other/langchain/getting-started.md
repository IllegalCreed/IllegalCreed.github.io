---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 LangChain 官方文档（docs.langchain.com）编写，对照 LangChain 1.0 + LangGraph 1.0 LTS（2025-10 发布）

## 速查

- **生态四件套**：`langchain`（agent 抽象 + 集成层）/ `langchain-core`（Runnable 接口）/ `langgraph`（状态图编排运行时，可独立使用）/ `langsmith`（观测 + 评估）
- **1.0 标准 API**：`create_agent(model, tools, system_prompt, middleware, checkpointer)` 取代旧 `AgentExecutor`，底层基于 LangGraph
- **跨提供商工厂**：`init_chat_model()` / `init_embeddings()` 统一初始化，切换模型零成本
- **LCEL 管道符**：`prompt | model | parser`，自动获得 batch / async / streaming / 重试 / fallbacks
- **结构化输出首选**：`model.with_structured_output(PydanticSchema)`，走 tool/function calling，优于手写 `PydanticOutputParser`
- **工具定义**：`@tool` 装饰器 + 类型注解 + docstring，自动生成 name/description/args_schema
- **短期记忆**：graph `state.messages` + `Checkpointer(thread_id)`；旧 `ConversationBufferMemory` / `ChatMessageHistory` 已弃用
- **长对话压缩**：`SummarizationMiddleware(model, trigger=('tokens', N), keep=('messages', N))`
- **持久化**：开发用 `InMemorySaver`，生产用 `SqliteSaver` / `PostgresSaver`，按 `thread_id` 隔离
- **观测**：设 `LANGSMITH_TRACING=true` + `LANGSMITH_API_KEY` 即自动追踪
- **安装**：`pip install -U langchain langchain-core langgraph`

## LangChain 是什么

LangChain 是 LLM 应用编排框架，把「调模型 + 接工具 + 维护上下文 + 编排多步流程」抽象成可组合的组件。它的核心定位有三：

- **抽象层**：统一 Runnable 接口，所有组件（prompt / model / parser / retriever）都可 `invoke` / `batch` / `stream`
- **集成层**：跨模型提供商（OpenAI / Anthropic / Gemini / Ollama）、跨向量库（Chroma / FAISS / Pinecone）、跨文档加载器（PyPDFLoader / WebBaseLoader）
- **生态层**：LangChain（agent 抽象）+ LangGraph（编排运行时）+ LangSmith（观测）+ langchain-core（基础接口）

> LangChain ≠ LangGraph。前者是 agent 抽象 + 集成层，后者是底层状态图运行时，**两者可独立使用**——你可以只用 LangGraph 不用 LangChain，但用了 LangChain 1.0 的 `create_agent` 就已经隐式用了 LangGraph。

## 生态四件套

| 包 | 角色 | 何时用 |
| --- | --- | --- |
| **langchain** | agent 抽象 + 集成层（model/tool/memory/RAG） | 需要 Chat Model、工具、RAG 组件时 |
| **langchain-core** | Runnable 接口、PromptTemplate、OutputParser | 定义自己的 Runnable 组件时 |
| **langgraph** | StateGraph 编排运行时 | 需要循环 / 条件分支 / HITL / 持久化时 |
| **langsmith** | 观测、评估、Datasets/Experiments | 任何时候（设环境变量即接入） |

> LCEL（LangChain Expression Language）是 Runnable 的组合语法，跨 langchain + langchain-core；它适合线性流水线，复杂流程上 LangGraph。

## 最小安装与首次调用

```bash
# 1.0 推荐：装 langchain 主包 + langgraph（create_agent 依赖）
pip install -U langchain langchain-core langgraph langchain-openai
```

```python
from langchain_openai import ChatOpenAI

# 跨提供商工厂（推荐）：仅靠字符串切换提供商
from langchain.chat_models import init_chat_model

model = init_chat_model(
    model="gpt-4o-mini",
    model_provider="openai",
    temperature=0,
)

# 最简 invoke
response = model.invoke("用一句话介绍 LangChain")
print(response.content)

# 流式输出
for chunk in model.stream("讲个冷笑话"):
    print(chunk.content, end="", flush=True)
```

> `init_chat_model` 是 1.0 推荐写法：传 `model_provider` 字符串即可在 OpenAI / Anthropic / Gemini / Ollama 间切换，不必为每个提供商 import 不同的类。

## LCEL 管道符

所有组件实现统一 Runnable 接口，用 `|` 串联：

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_template("用一句话解释 {topic}")
chain = prompt | model | StrOutputParser()

# 串联后自动获得 batch / async / streaming
print(chain.invoke({"topic": "LangGraph"}))

# 批量
print(chain.batch([{"topic": "RAG"}, {"topic": "Agent"}]))

# 异步
# await chain.ainvoke({"topic": "async"})
```

**基础 Runnable**

| 组件 | 作用 | 典型用法 |
| --- | --- | --- |
| `RunnablePassthrough` | 透传输入 | 把 question 同时传给 retriever 与 prompt |
| `RunnableParallel` | 并行字典 | `{"context": retriever, "q": RunnablePassthrough()}` |
| `RunnableLambda` | 包普通函数 | 把任意 `def fn(x)` 变成 Runnable |
| `RunnableAssign` | 写入字典键 | 给字典加 `extra` 键 |

> 串联后自动支持 batch / async / streaming / 重试 / fallbacks，无需自己写并发逻辑。

## 结构化输出

让模型按 schema 返回结构化数据，**首选 `with_structured_output`**：

```python
from pydantic import BaseModel, Field

class City(BaseModel):
    name: str = Field(description="城市名")
    population: int = Field(description="人口，单位百万")
    timezone: str = Field(description="时区")

structured_model = model.with_structured_output(City)
city = structured_model.invoke("北京")
print(city.name, city.population)
```

| 方式 | 准确率 | 适用 |
| --- | --- | --- |
| `with_structured_output(Pydantic)` | **高**（走 tool/function calling） | 1.0 首选，支持 tool calling 的模型 |
| `PydanticOutputParser` + 重试 | 中（靠 prompt 引导 + 字符串解析） | 不支持 tool calling 的模型兜底 |

> 老的 `PydanticOutputParser` 仍可用，但准确率远不如 `with_structured_output`，且容易抛 `OutputParserExceptions`。

## 工具（@tool 装饰器）

```python
from langchain_core.tools import tool

@tool
def search_weather(city: str) -> str:
    """查询指定城市的实时天气。

    Args:
        city: 城市名（中文或英文）
    """
    # 实际接入天气 API
    return f"{city} 今天晴，25°C"

# 自动从 docstring + 类型注解 生成 name/description/args_schema
print(search_weather.name)         # search_weather
print(search_weather.description)  # 查询指定城市的实时天气。
print(search_weather.args)         # {'city': {'type': 'string', ...}}
```

**关键约束**

- 必须有**完整类型注解**（缺失则 args_schema 生成失败）
- docstring 是**给模型看的 description**——决定模型是否正确调用，写清「做什么 + 参数含义」
- 复杂参数用 `args_schema=PydanticModel` + `Field(description=...)`

## 1.0 标准 Agent

`create_agent` 是 1.0 构造 agent 的标准 API，底层基于 LangGraph：

```python
from langchain.chat_models import init_chat_model
from langchain_core.tools import tool
from langgraph.checkpoint.memory import InMemorySaver
from langchain.agents import create_agent

@tool
def add(a: int, b: int) -> int:
    """两数相加。"""
    return a + b

model = init_chat_model("gpt-4o-mini", model_provider="openai")
checkpointer = InMemorySaver()  # 开发用内存，生产换 PostgresSaver

agent = create_agent(
    model,
    tools=[add],
    system_prompt="你是一个计算助手，遇到数学运算必须调用工具。",
    checkpointer=checkpointer,
)

# 按 thread_id 维护对话
config = {"configurable": {"thread_id": "user-001"}}
print(agent.invoke({"messages": [{"role": "user", "content": "3+5 等于几"}]}, config)["messages"][-1].content)
```

> 不要再用 `AgentExecutor` 或旧 `create_openai_tools_agent` / `create_react_agent` 风格——1.0 已弃用，拿不到 durable execution / streaming / HITL。

## 记忆与持久化

**短期记忆 = graph state.messages + Checkpointer**

- `state.messages` 自动累积对话历史
- `Checkpointer(thread_id)` 按线程持久化，支持多轮对话 / 断点续跑 / 按 thread 隔离

```python
from langgraph.checkpoint.postgres import PostgresSaver  # 生产

# 长对话用 SummarizationMiddleware 自动压缩
from langchain.agents.middleware.summarization import SummarizationMiddleware

agent = create_agent(
    model,
    tools=[],
    middleware=[
        SummarizationMiddleware(
            model=model,
            trigger=('tokens', 4000),   # 超 4000 token 触发摘要
            keep=('messages', 10),      # 保留最近 10 条
        ),
    ],
    checkpointer=PostgresSaver(...),
)
```

| 旧（已弃用） | 新（1.0） |
| --- | --- |
| `ConversationBufferMemory` | `state.messages` + Checkpointer |
| `ConversationSummaryMemory` | `SummarizationMiddleware` |
| `ChatMessageHistory` | `Checkpointer(thread_id)` |
| `InjectedState` / `InjectedToolArg` | `ToolRuntime` 参数 |

## 观测：LangSmith

```bash
export LANGSMITH_TRACING=true
export LANGSMITH_API_KEY=lsv2_sk_...
```

设完环境变量后，**所有 invoke / stream 自动上报 trace**，无需改代码。在 UI 上可看到：

- 每次 model call 的 prompt / response / token / 耗时
- 工具调用的 args / 返回
- 整条 chain / agent 的执行拓扑
- Datasets / Evaluators 做回归评测

## 下一步

- [核心 API 与最佳实践](./guide-line.md)：create_agent / Middleware / LangGraph StateGraph / Command / Interrupt / RAG 链 / 反模式
- [参考](./reference.md)：完整 API 清单、弃用迁移表、版本变化、官方资源
