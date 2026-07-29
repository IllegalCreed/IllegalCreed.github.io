---
layout: doc
outline: [2, 3]
---

# 核心 API 与最佳实践

> 基于 LangChain 官方文档（docs.langchain.com）编写，对照 LangChain 1.0 + LangGraph 1.0 LTS

## 速查

- **create_agent(model, tools, system_prompt, middleware, checkpointer)** 是 1.0 标准 agent API，底层 LangGraph，取代 AgentExecutor
- **LCEL Runnable** 统一接口：`invoke` / `batch` / `stream` + 异步 `ainvoke` / `abatch` / `astream` / `stream_events`，管道符 `|` 串联
- **LCEL 四基础**：`RunnablePassthrough`（透传）/ `RunnableParallel`（并行字典）/ `RunnableLambda`（包普通函数）/ `RunnableAssign`（写键）
- **结构化输出首选**：`model.with_structured_output(PydanticSchema)` 走 tool/function calling
- **@tool**：docstring + 类型注解自动生成 schema；访问运行时用 `ToolRuntime`（替代 InjectedState）
- **Middleware**：`@before_model` / `@after_model` / `@dynamic_prompt` / `wrap_model_call` / `wrap_tool_call`
- **LangGraph 三要素**：State（共享数据 + Reducer）/ Node（干活）/ Edge（决定下一步）
- **Reducer**：默认覆盖；`Annotated[list, operator.add]` / `Annotated[list, add_messages]` 自定义合并；`MessagesState` 是预置
- **Command(update=, goto=, resume=, graph=Command.PARENT)** 把状态更新 + 路由合一；`Send(node, state)` 做 map-reduce fan-out
- **interrupt()** 暂停后用 `Command(resume=...)` 恢复实现 HITL
- **Checkpointer**：`InMemorySaver`（开发）/ `SqliteSaver` / `PostgresSaver`（生产），按 `thread_id` 持久化
- **RAG 链**：Loaders → Splitters → Embeddings → VectorStore → `as_retriever()` 得到 Runnable Retriever
- **反模式**：用 LangServe / AgentExecutor / ConversationBufferMemory / LCEL 拼状态机 / InjectedState

## 组件抽象层

LangChain 把所有 LLM 应用组件抽象成 **Runnable**——一个统一接口，定义在 `langchain-core`。

### Runnable 接口

每个 Runnable 都同时支持同步与异步、单条与批量、流式与一次性：

| 方法 | 作用 |
| --- | --- |
| `invoke(x)` | 单条同步调用 |
| `batch([x1, x2])` | 批量同步 |
| `stream(x)` | 同步流式（按 chunk 迭代） |
| `ainvoke(x)` / `abatch` / `astream` | 异步族 |
| `stream_events(x)` | 流式 + 中间事件（model call / tool call） |
| `with_retry()` / `with_fallbacks([...])` | 重试 / 兜底 |

> 用 `|` 串联的 chain 自动继承所有这些能力，**无需自己写并发或重试**。

### LCEL 基础 Runnable

| 组件 | 作用 | 例子 |
| --- | --- | --- |
| `RunnablePassthrough` | 透传输入 | `{"q": itemgetter("question"), "ctx": retriever}` 里同时把原 query 也带出去 |
| `RunnableParallel` | 并行字典 | `RunnableParallel({"context": retriever, "question": RunnablePassthrough()})` |
| `RunnableLambda` | 把普通函数包成 Runnable | `RunnableLambda(lambda x: x["messages"][-1].content)` |
| `RunnableAssign` | 给字典加键 | 把 retriever 结果写入 `context` 键 |

## Prompt 与输出

### PromptTemplate / ChatPromptTemplate

```python
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是 {role}，回答简洁。"),
    MessagesPlaceholder("history"),  # 占位历史消息
    ("human", "{question}"),
])

# partial 提前填部分变量
prompt = prompt.partial(role="技术专家")
```

### 结构化输出（重要）

```python
from pydantic import BaseModel, Field

class Step(BaseModel):
    explanation: str = Field(description="解释这一步")
    output: str = Field(description="结果")

class Solution(BaseModel):
    steps: list[Step]
    final_answer: str

# 首选：with_structured_output
structured = model.with_structured_output(Solution)
result = structured.invoke("解方程 2x+3=7")
print(result.final_answer)
```

> 1.0 推荐 **`with_structured_output`**——走 tool/function calling，准确率远高于 prompt 引导 + 字符串解析；老 `PydanticOutputParser` 仍可用于不支持 tool calling 的模型，但要处理 `OutputParserExceptions`。

## 工具与运行时注入

### @tool 装饰器

```python
from langchain_core.tools import tool

@tool
def search_docs(query: str, k: int = 5) -> list[str]:
    """在知识库中检索文档。

    Args:
        query: 检索关键词
        k: 返回数量，默认 5
    """
    return [...]

# 自定义 name / description / args_schema
@tool("search_docs", description="在知识库中检索", args_schema=SearchArgs)
def my_search(...): ...
```

### ToolRuntime（1.0 替代 InjectedState）

工具要访问 state / context / store / stream_writer 时，用 **ToolRuntime 参数**：

```python
from langchain_core.tools import ToolRuntime

@tool
def lookup_user(user_id: str, runtime: ToolRuntime) -> dict:
    """查用户信息。"""
    state = runtime.state          # 当前 graph state
    ctx = runtime.context          # context_schema 注入的非状态依赖
    store = runtime.store          # 长期记忆 Store
    writer = runtime.stream_writer # 流式回写进度
    ...
```

> `ToolRuntime` 参数**对模型隐藏**，不会出现在工具 schema 里污染模型上下文。旧的 `InjectedState` / `InjectedToolArg` 已弃用。

## Middleware：Agent 行为扩展主范式

1.0 的 `create_agent` 用 Middleware 钩子扩展行为，**逐步加 guardrails / 重试 / 路由 / 动态工具过滤**：

| 钩子 | 触发时机 | 典型用途 |
| --- | --- | --- |
| `@before_model` | 调模型前 | 注入动态 system prompt、敏感词过滤、token 预算检查 |
| `@after_model` | 调模型后 | 校验输出、改写回复、记录指标 |
| `@dynamic_prompt` | 每轮动态组装 prompt | 根据当前 state 拼个性化提示 |
| `wrap_model_call` | 包裹整个 model call | 加重试 / fallbacks / 缓存 |
| `wrap_tool_call` | 包裹工具调用 | 加权限校验 / 限流 / 审计 |

```python
from langchain.agents.middleware import AgentMiddleware

class GuardrailMiddleware(AgentMiddleware):
    def before_model(self, state, runtime):
        # 调模型前过滤敏感词
        last = state["messages"][-1].content
        if "敏感词" in last:
            return {"messages": [{"role": "assistant", "content": "拒绝"}]}
        # 不返回 = 继续走模型

agent = create_agent(
    model,
    tools=[],
    middleware=[GuardrailMiddleware(), SummarizationMiddleware(...)],
    checkpointer=checkpointer,
)
```

> SummarizationMiddleware 本身就是 `wrap_model_call` 的范例——长对话超阈值时压缩历史。

## LangGraph 状态图

LangGraph 是**底层编排运行时**，可独立于 LangChain 使用。三要素：State / Node / Edge。

### State & Reducer

```python
from typing import Annotated, TypedDict
from langgraph.graph import MessagesState, add_messages, START, END, StateGraph
import operator

# 自定义 state：messages 用 add_messages 累积，files 用 operator.add 拼接
class MyState(TypedDict):
    messages: Annotated[list, add_messages]
    files: Annotated[list[str], operator.add]
    count: int  # 默认 reducer = 覆盖

# 预置：仅 messages 累积
# class MessagesState(TypedDict):
#     messages: Annotated[list, add_messages]
```

**Reducer 机制**

- 默认：**覆盖**（新值替换旧值）
- `Annotated[list, operator.add]`：列表拼接
- `Annotated[list, add_messages]`：消息按 id 合并（同 id 更新，新 id 追加）
- `MessagesState`：内置的「只累积 messages」state

### Node / Edge

```python
def search_node(state: MyState):
    # 节点返回 dict，会按 reducer 合并进 state
    return {"messages": [{"role": "assistant", "content": "..."}], "count": state["count"] + 1}

def route(state: MyState) -> str:
    if state["count"] >= 3:
        return END
    return "search"

graph_builder = StateGraph(MyState)
graph_builder.add_node("search", search_node)
graph_builder.add_edge(START, "search")
graph_builder.add_conditional_edges("search", route, {"search": "search", END: END})
graph = graph_builder.compile(checkpointer=checkpointer)
```

**关键约定**

- `START` / `END` 是虚拟节点
- 节点函数应**幂等**——interrupt 恢复或重试时受影响节点会从头重跑，非幂等副作用（发邮件 / 扣款）会重复执行
- **多出边默认并行**（在下一个 super-step 同时执行）
- 默认 `recursion_limit=1000` super-steps

### Command & Send

```python
from langgraph.types import Command, Send

# Command：把「状态更新 + 路由」合一
def node_a(state):
    return Command(
        update={"messages": [...]},
        goto="node_b",
        # graph=Command.PARENT  # 跨子图跳父图
    )

# interrupt + resume：HITL
def ask_human(state):
    user_input = interrupt({"question": "确认执行扣款吗？"})  # 暂停
    return {"messages": [{"role": "user", "content": user_input}]}

# 恢复：Command(resume="同意")

# Send：map-reduce 动态 fan-out
def fan_out(state):
    return [Send("worker", {"task": t}) for t in state["tasks"]]
```

### 持久化

| Checkpointer | 适用 | 持久介质 |
| --- | --- | --- |
| `InMemorySaver` | 开发 / 测试 | 进程内存（重启丢） |
| `SqliteSaver` | 单机生产 | SQLite 文件 |
| `PostgresSaver` | 生产 | PostgreSQL |

按 `thread_id` 隔离状态，天然支持多用户对话、断点续跑、HITL。

> `context_schema` + `Runtime[...]` 用来注入 DB 连接等**非状态依赖**——它们不进 graph state，不出现在 output_keys。

## RAG 链

经典 RAG 五步：

```python
from langchain_community.document_loaders import WebBaseLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableParallel

# 1. 加载
docs = WebBaseLoader("https://docs.langchain.com").load()

# 2. 切分
splits = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200).split_documents(docs)

# 3. Embeddings + 4. 入库
vectorstore = Chroma.from_documents(splits, embedding=OpenAIEmbeddings())

# 5. 转 Retriever（本身是 Runnable）
retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

prompt = ChatPromptTemplate.from_template("""
根据以下上下文回答问题：

{context}

问题：{question}
""")

# LCEL 组装：retriever 与原 question 并行
chain = (
    RunnableParallel({"context": retriever, "question": RunnablePassthrough()})
    | prompt
    | model
    | StrOutputParser()
)

print(chain.invoke("LangChain 1.0 有什么新特性？"))
```

> 简单线性 RAG 用 LCEL；一旦需要「查询改写 / 多轮追问 / 工具决策」就上 LangGraph。

## LangSmith 观测与评估

设环境变量即自动追踪，无需改代码：

```bash
export LANGSMITH_TRACING=true
export LANGSMITH_API_KEY=lsv2_sk_...
```

UI 上能看到：

- 每次 model call 的 prompt / response / token / 耗时
- 工具调用的 args / 返回 / 失败重试
- 整条 chain / agent 的执行拓扑

**评估工作流**：

1. 用 Datasets 收集典型输入 / 期望输出
2. 用 Evaluators（如 `LLMJudgeEvaluator` / 自定义）打分
3. 用 Experiments 对比不同 prompt / model 版本

> LangSmith Engine 能监控 trace 自动诊断问题并提修复建议。

## 反模式（避坑）

- **用 LangServe / RemoteRunnable 部署新项目**：自 2024-11-18 弃用、仅维护；改用 LangGraph Platform
- **用 AgentExecutor 或旧 create_xxx_agent**：1.0 已弃用；改用 `create_agent`（基于 LangGraph）
- **用 ConversationBufferMemory / ChatMessageHistory 维护对话**：v0.3 起弃用、v1.0 警告；改用 `state.messages` + Checkpointer
- **用 LCEL 拼复杂状态机（循环 / 条件分支 / 中断）**：硬塞状态机会丧失 LangGraph 的持久化 / HITL / 可视化；改用 `StateGraph` + `add_conditional_edges`
- **用旧 InjectedState / InjectedToolArg 注入**：已弃用；改用 ToolRuntime 参数
- **LangGraph 节点写非幂等副作用不做去重**：interrupt 恢复或重试会从头重跑导致重复执行（发邮件 / 扣款事故）
- **with_structured_output 不传 Pydantic schema 或类型模糊**：准确率掉回字符串解析水平
- **私有数据进 graph state 却以为 stream 不泄露**：private channels 默认不在 output_keys 但流式可能暴露，需显式收紧 output_keys
- **照搬 v0.x 教程代码（Memory / AgentExecutor / LLMChain）**：1.0 多数已弃用；按迁移指南重写
- **混淆 LangChain 与 LangGraph**：它们是不同包、可独立使用；选型先想清楚「要 agent 抽象还是要编排运行时」
- **忽视 langchain-classic 过渡包**：1.0 基础 import 改动大，旧代码可临时靠 `langchain-classic` 兼容

## 下一步

- [参考](./reference.md)：完整 API 清单、弃用迁移表、版本变化、官方资源
