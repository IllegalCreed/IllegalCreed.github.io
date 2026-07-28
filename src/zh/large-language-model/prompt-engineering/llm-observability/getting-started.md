---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Langfuse / LangSmith / Arize Phoenix / Helicone 2026 官方文档编写

## 速查

- 目标：LLM 应用「**可追踪、可评测、可对比**」
- 四大能力：**Tracing**（链路追踪）+ **Evaluation**（评测）+ **Prompt Management**（提示词管理）+ **Cost/Latency 监控**
- 主流工具：**Langfuse**（MIT 开源 / OTel）、**LangSmith**（LangChain 官方）、**Phoenix**（Arize 开源）、**Helicone**（代理层 / 开源）
- 核心概念：**Trace**（一次请求）→ **Span/Generation/Event**（步骤）→ **Score**（评分）
- 接入方式：SDK 插桩 / 代理层 / OTel exporter
- 评测方法：人工标注、LLM-as-a-judge、代码规则、用户反馈
- 评测维度：正确性 / 相关性 / 忠实度 / 毒性 / 延迟 / cost
- 自托管：Langfuse / Phoenix / Helicone 都支持

## 为什么传统 APM 不够

传统 APM（Datadog / New Relic / Prometheus）盯的是：

- 延迟（p50/p99）
- 错误率（5xx）
- 吞吐（QPS）
- 资源（CPU / 内存）

LLM 应用多了三个**新维度**：

| 新维度 | 含义 | 例子 |
| --- | --- | --- |
| **质量** | 答案对不对 | RAG 召回的片段是否支持答案 |
| **成本** | token 花了多少 | 单次对话烧了 $0.05 还是 $0.5 |
| **安全** | 有没有越界/泄密 | prompt injection / PII 泄露 |

LLMOps 可观测工具就为补这块。

## 核心数据模型：Trace / Observation / Score

以 Langfuse 为例（Phoenix / LangSmith 概念相似）：

```
Session（会话，可选聚合）
  └─ Trace（一次请求/一次链路）
       ├─ Generation（LLM 调用：prompt + completion + token + cost）
       ├─ Span（一段逻辑步骤：如 RAG 的检索阶段）
       └─ Event（瞬时事件：如日志）
            ↑ 每个 Observation 可嵌套
```

- **Trace**：逻辑分组，所有共享同一 `trace_id` 的观测都属于它
- **Observation**：链路里的单步（Generation / Span / Event），可嵌套
- **Score**：对 trace 或 observation 的评分（人工 / LLM-as-judge / 用户反馈）
- **Session**：可选，把同一用户对话的多 trace 聚合

## 工具选型对比

| 维度 | Langfuse | LangSmith | Phoenix | Helicone |
| --- | --- | --- | --- | --- |
| 开源 | MIT | 闭源 | Apache-2.0 | Apache-2.0 |
| 自托管 | ✓ | ✗（仅云） | ✓ | ✓ |
| OTel 兼容 | ✓ | 自有 SDK | ✓ | 代理层 |
| LangChain 绑定 | 通用 | 深度集成 | 通用 | 通用 |
| LLM-as-judge | ✓ | ✓ | 强 | ✓ |
| Prompt 管理 | ✓ | ✓ | △ | △ |
| 成本/缓存 | ✓ | ✓ | ✓ | **强项** |
| 适合 | 通用 / 自托管 | LangChain 用户 | 评测 / Notebook | 代理 / 省钱 |

## Langfuse：30 秒接入

Python SDK：

```python
pip install langfuse
```

```python
from langfuse import Langfuse
from openai import OpenAI

langfuse = Langfuse()  # 读环境变量 LANGFUSE_SECRET/PUBLIC_KEY、LANGFUSE_HOST
client = OpenAI()

# 用 langfuse.observe 装饰器自动追踪
@langfuse.observe()  # 创建 trace
def chat(user_msg: str):
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": user_msg}],
    )
    return resp.choices[0].message.content

print(chat("RAG 是什么？"))
```

打开 Langfuse 面板即可看到 trace：prompt、completion、token、延迟、cost。

## LangSmith：30 秒接入

```bash
pip install langsmith
export LANGSMITH_TRACING=true
export LANGSMITH_API_KEY=lsv2_...
```

```python
from openai import OpenAI
client = OpenAI()

# 配环境变量后，OpenAI 调用自动被 LangSmith 抓（无需改代码）
resp = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "RAG 是什么？"}],
)
```

LangSmith 通过 SDK 钩子自动拦截 OpenAI / Anthropic / LangChain 调用。

## Phoenix：30 秒接入

```python
pip install arize-phoenix opentelemetry-sdk openinference-instrumentation-openai
```

```python
import phoenix as px
from openinference.instrumentation.openai import OpenAIInstrumentor

px.launch_app()  # 本地起 Phoenix UI（默认 http://localhost:6006）
OpenAIInstrumentor().instrument()  # 自动 instrument OpenAI

# 之后 OpenAI 调用全部进 Phoenix
```

Phoenix 走 **OpenTelemetry + OpenInference** 标准——和 Langfuse 一样可换后端。

## Helicone：代理层一行接入

不用改代码，只换 base_url：

```python
from openai import OpenAI
client = OpenAI(
    base_url="https://api.helicone.ai/openai/v1",  # 换这里
    api_key=os.environ["OPENAI_API_KEY"],
    default_headers={
        "Helicone-Auth": f"Bearer {os.environ['HELICONE_API_KEY']}",
    },
)
```

所有 OpenAI / Anthropic 调用经代理转发，自动记录 + 计费 + 缓存。最大优势：**零代码侵入 + 内置缓存省 token**。

## 加评分（Score）

光有 trace 不够，还要给 trace 打分。Langfuse 三种来源：

```python
from langfuse import Langfuse
langfuse = Langfuse()

# 1. 用户反馈（点赞/踩）
langfuse.score(trace_id=trace_id, name="user-feedback", value=1)

# 2. 代码规则（如包含关键词）
langfuse.score(trace_id=trace_id, name="contains-citation", value=1.0)

# 3. LLM-as-a-judge（用另一个模型评分）
judge = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": f"评估这个答案的相关性 0-1：{answer}"}],
)
langfuse.score(trace_id=trace_id, name="relevance", value=float(judge_output))
```

## 监控看什么

打开 dashboard 重点盯：

| 指标 | 含义 | 异常信号 |
| --- | --- | --- |
| **p99 延迟** | 慢请求 | 突增 = 模型/网络问题 |
| **每请求 cost** | 单次花费 | 突增 = 上下文爆炸 |
| **质量分布** | 评分直方图 | 低分占比上升 = 提示词漂移 |
| **错误率** | 5xx / 超时 | 上游限速 / key 失效 |
| **每日总 cost** | 烧钱速度 | 超预算告警 |
| **每用户 cost** | top 用户 | 异常滥用 |

## 大陆访问

- Langfuse / Phoenix 自托管在国内服务器即可
- LangSmith / Helicone 云版需自备网络
- 所有工具都支持私有部署，敏感数据不出私网

## 下一步

- [指南](./guide-line) —— LLM-as-a-judge 设计 / Prompt 管理 / A/B 测试 / 工具深度对比
- [参考](./reference) —— 数据模型全表 / 工具能力矩阵 / SDK 列表 / 常见问题
