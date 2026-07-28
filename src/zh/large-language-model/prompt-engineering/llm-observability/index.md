---
layout: doc
---

# LLM 可观测与评测

**LLM 应用进入生产后的「监控 + 评测」工具与方法论**。传统 APM（应用性能监控）关心延迟 / 错误率 / 吞吐，但 LLM 应用多了三个新维度：**质量（答案对不对）**、**成本（token 花了多少）**、**安全（有没有越界/泄密）**。LLMOps 可观测工具专门补这块。

核心能力：**Tracing（追踪每次 LLM 调用的完整链路）** + **Evaluation（评测答案质量）** + **Prompt Management（版本化提示词）** + **Cost / Latency 监控**。主流工具：

- **Langfuse**：MIT 开源、OTel 兼容、可自托管——社区最热
- **LangSmith**：LangChain 官方平台，深度绑定 LangChain 生态
- **Arize Phoenix**：开源、OTel 兼容、强于 LLM-as-a-judge 评测
- **Helicone**：开源 AI Gateway + 可观测，代理层一行接入、强于成本/缓存

核心概念：**Trace**（一次请求）→ **Span / Generation / Event**（链路里的步骤）→ **Score / Observation**（评分与观测）。评测维度：正确性 / 相关性 / 忠实度（faithfulness）/ 毒性 / 延迟 / cost。配合 **A/B 测试** 比较提示词版本与模型选型。

## 评价

**优点**

- 把 LLM 应用从「黑盒」变「白盒」：每次调用可追溯、可评分、可对比
- 开源生态成熟——Langfuse / Phoenix / Helicone 都可自托管，数据不出私网
- OTel 兼容——可与现有基础设施（Jaeger / Grafana）打通
- LLM-as-a-judge 自动评测，省人工标注成本
- Prompt 版本化——改提示词像改代码一样可回滚
- 成本可视化——token / 模型 / 用户维度拆账

**缺点**

- 接入 SDK 有侵入性（除非用 Helicone 代理层）
- LLM-as-a-judge 本身也花钱、有噪声
- 评测「正确性」没有银弹——业务相关性强，需自定义 metric
- 多工具标准不一（OTel GenAI semantic conventions 还在演进）
- 自托管需运维（数据库 / 队列 / 前端）

## 文档地址

- Langfuse：[langfuse.com/docs](https://langfuse.com/docs)
- LangSmith：[docs.langchain.com/langsmith](https://docs.langchain.com/langsmith)
- Arize Phoenix：[arize.com/docs](https://arize.com/docs)
- Helicone：[helicone.ai/docs](https://www.helicone.ai/docs)

## GitHub地址

- Langfuse：[github.com/langfuse/langfuse](https://github.com/langfuse/langfuse)（MIT）
- Phoenix：[github.com/Arize-ai/phoenix](https://github.com/Arize-ai/phoenix)（Apache-2.0）
- Helicone：[github.com/Helicone/helicone](https://github.com/Helicone/helicone)（Apache-2.0）
- LangSmith：闭源 SaaS（无公开仓库）

## 幻灯片地址

<a href="/SlideStack/llm-observability-slide/" target="_blank">LLM 可观测与评测</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=llm-observability" target="_blank" rel="noopener noreferrer">LLM 可观测与评测 测试题</a>
