---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Langfuse / LangSmith / Arize Phoenix / Helicone 2026 官方文档编写。本页**重点列数据模型、能力矩阵、SDK 与对比**。

## 核心概念速查

| 概念 | 含义 | 别名（不同工具） |
| --- | --- | --- |
| **Trace** | 一次请求的完整链路 | LangSmith 也叫 Trace |
| **Observation** | trace 内的单步 | LangSmith 叫 Run |
| **Generation** | LLM 调用（含 model/prompt/completion/usage） | Run type=llm |
| **Span** | 一段逻辑步骤（如检索） | Run type=chain/tool |
| **Event** | 瞬时事件（日志） | Run type=event |
| **Score** | 对 trace/observation 的评分 | Feedback |
| **Session** | 多 trace 的会话聚合 | Thread |
| **Dataset** | 测试用例集 | Dataset |
| **Experiment** | 在 dataset 上跑 prompt 版本对比 | Experiment |

## 工具能力矩阵

| 能力 | Langfuse | LangSmith | Phoenix | Helicone |
| --- | --- | --- | --- | --- |
| 开源许可 | **MIT** | 闭源 | Apache-2.0 | Apache-2.0 |
| 自托管 | ✓ | ✗ | ✓ | ✓ |
| 云版 SaaS | ✓ | ✓ | ✓（LlamaTrace） | ✓ |
| OTel 兼容 | ✓ | 自有 SDK | ✓ | 代理层 |
| OpenInference | ✓ | - | **原生** | - |
| Tracing | ✓ | ✓ | ✓ | ✓ |
| LLM-as-judge 评测 | ✓ | ✓ | **强项** | ✓ |
| 人工标注队列 | ✓ | ✓ | △ | △ |
| 用户反馈 Score | ✓ | ✓ | ✓ | ✓ |
| Prompt 管理（版本化） | **强** | **强** | △ | △ |
| Dataset/Experiment | ✓ | **强** | ✓ | △ |
| A/B 测试 | ✓ | ✓ | ✓ | △ |
| 成本追踪 | ✓ | ✓ | ✓ | **强项** |
| 内置缓存 | - | - | - | **强项** |
| 多模型路由 | - | - | - | **强项**（100+） |
| Agent graph 可视化 | ✓ | **强**（LangGraph） | ✓ | ✓ |
| Engine（自动诊断） | - | **✓（Olympus）** | - | - |
| LangChain 深度集成 | 通用 | **原生** | 通用 | 通用 |
| 接入方式 | SDK / OTel | SDK | OTel / SDK | 代理层 |

## 数据模型（Langfuse，OTel 风格）

```
Session（optional）
  ├─ id, user_id, metadata
  └─ Trace[]
       ├─ id, name, timestamp
       ├─ user_id, session_id, tags, metadata
       ├─ input, output
       ├─ total_cost, latency_ms
       ├─ Score[]
       │    ├─ name (e.g. "relevance")
       │    ├─ value (0-1)
       │    └─ source: API | UI | LLM | user
       └─ Observation[]
            ├─ id, type (GENERATION|SPAN|EVENT)
            ├─ start_time, end_time
            ├─ model (GENERATION)
            ├─ input, output
            ├─ usage { input_tokens, output_tokens, cost }
            └─ children Observation[] (nested)
```

Langfuse 扁平存储：observation 行冗余 trace 级属性（user_id / session_id / tags），免 JOIN。

## Langfuse 关键 API

```python
from langfuse import Langfuse
lf = Langfuse()

# 创建 trace（或用 @lf.observe() 装饰器自动建）
trace = lf.trace(name="chat", user_id="u1")

# 加 generation
gen = trace.generation(
    name="openai-call",
    model="gpt-4o-mini",
    input=messages,
    output=resp.choices[0].message,
    usage={"input": 50, "output": 120, "unit": "TOKENS"},
)

# 加 score
lf.score(trace_id=trace.id, name="relevance", value=0.9)

# Prompt 管理
prompt = lf.get_prompt("rag-system", label="production")
compiled = prompt.compile(user_question="...")
```

## Phoenix 关键 API（OTel）

```python
import phoenix as px
from openinference.instrumentation.openai import OpenAIInstrumentor
from opentelemetry import trace as trace_api

session = px.launch_app()  # 本地 UI（默认 :6006）
OpenAIInstrumentor().instrument()

# 自动 trace；手动 span：
tracer = trace_api.get_tracer(__name__)
with tracer.start_as_current_span("retrieve") as span:
    span.set_attribute("_documents.count", len(docs))
```

## Helicone 关键 API（代理层）

```python
from openai import OpenAI
client = OpenAI(
    base_url="https://api.helicone.ai/openai/v1",
    default_headers={
        "Helicone-Auth": f"Bearer {os.environ['HELICONE_API_KEY']}",
        "Helicone-Cache-Enabled": "true",  # 开缓存
    },
)
# 后续 OpenAI 调用自动经代理 + 缓存 + 计费
```

## 评测维度对照

| 维度 | 含义 | 实现 |
| --- | --- | --- |
| **正确性（correctness）** | 事实对错 | 与 ground truth 对比 |
| **相关性（relevance）** | 答案是否切题 | LLM-as-judge |
| **忠实度（faithfulness）** | 是否基于上下文 | RAG 专用，NLI 模型 |
| **上下文召回（context-recall）** | 检索片段是否覆盖答案 | RAG 专用 |
| **毒性（toxicity）** | 有害内容 | 分类器 / LLM-judge |
| **延迟（latency）** | p50 / p99 | 自动采集 |
| **成本（cost）** | 每请求 token 费 | 自动采集 |

## 评测方法来源

| 来源 | 优 | 劣 |
| --- | --- | --- |
| **人工标注** | 最准 | 慢 / 贵 |
| **LLM-as-judge** | 快 / 便宜 | 有 bias / 噪声 |
| **代码规则** | 确定性 | 覆盖窄 |
| **用户反馈** | 真实 | 稀疏 / 偏极端 |

最佳实践：**四者结合**——代码规则做初筛 + LLM-judge 抽样 + 用户反馈兜底 + 人工复评争议项。

## SDK 与接入

| 工具 | Python | JS/TS | 接入方式 |
| --- | --- | --- | --- |
| Langfuse | `langfuse` | `langfuse` | SDK / OTel |
| LangSmith | `langsmith` / `langchain` 自带 | `langchain` 自带 | SDK（自动） |
| Phoenix | `arize-phoenix` | `@arize-com/phoenix` | OTel / OpenInference |
| Helicone | 代理（无需 SDK） | 代理 | base_url 替换 |

## 自托管

| 工具 | 部署 | 依赖 |
| --- | --- | --- |
| Langfuse | docker-compose / k8s | Postgres + ClickHouse（可选） |
| Phoenix | `pip install` + `px.launch_app()` / docker | SQLite（默认）/ Postgres |
| Helicone | docker-compose | Postgres + ClickHouse + Worker |

## 资源链接

- Langfuse 文档：[langfuse.com/docs](https://langfuse.com/docs)
- Langfuse GitHub：[github.com/langfuse/langfuse](https://github.com/langfuse/langfuse)
- LangSmith 文档：[docs.langchain.com/langsmith](https://docs.langchain.com/langsmith)
- Phoenix 文档：[arize.com/docs](https://arize.com/docs)
- Phoenix GitHub：[github.com/Arize-ai/phoenix](https://github.com/Arize-ai/phoenix)
- Helicone 文档：[helicone.ai/docs](https://www.helicone.ai/docs)
- Helicone GitHub：[github.com/Helicone/helicone](https://github.com/Helicone/helicone)
- OTel GenAI conventions：[opentelemetry.io/docs/specs/semconv/gen-ai/](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
