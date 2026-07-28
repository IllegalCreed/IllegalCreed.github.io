---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Langfuse / LangSmith / Arize Phoenix / Helicone 2026 官方文档编写

## 速查

- 评测「正确性」没银弹——业务相关性强，需自定义 metric
- LLM-as-a-judge 用强模型评弱模型，需防 bias / 噪声
- Prompt 管理把提示词当代码：版本化、回滚、A/B
- A/B 测试：同 prompt 两版本分流对比质量/cost
- OTel GenAI semantic conventions 是跨工具统一标准（演进中）
- Helicone 代理层 = 零侵入 + 内置缓存（适合纯省钱）
- Langfuse SDK = 灵活但要改代码
- Phoenix = OTel 标准 + 评测强（适合实验）
- LangSmith = LangChain 用户首选
- 自托管首选 Langfuse（MIT）或 Phoenix（Apache）

## LLM-as-a-judge 设计

用强模型（如 GPT-4o / Claude Sonnet）自动评弱模型答案。设计要点：

### 评分维度

| 维度 | 评什么 | 例子 prompt |
| --- | --- | --- |
| **相关性** | 答案是否切题 | 「回答是否针对问题？」 |
| **忠实度** | 是否基于上下文（RAG 关键） | 「答案是否仅由提供的片段支持？」 |
| **正确性** | 事实对错 | 「以下陈述是否事实正确？」 |
| **毒性** | 有害内容 | 「是否含仇恨/暴力/歧视？」 |
| **简洁性** | 是否啰嗦 | 「答案是否在 N 字以内？」 |

### 防 bias / 噪声

- **位置 bias**：对比两答案时模型倾向选第一个 → 随机打乱顺序
- **冗长 bias**：模型偏好长答案 → 加长度约束
- **自夸 bias**：GPT 评 GPT 答案偏高 → 用不同家族模型评
- **一致性**：同一答案多次评分，方差大说明 prompt 不够明确
- **抽样**：不必全量评，每天抽 5-10% 即可

::: tip 评测也是花 token 的

LLM-as-judge 每次评都烧 token。建议：

- 生产只抽 5-10% trace 评
- 用便宜模型做初筛，贵模型复评争议项
- 关键 metric（如毒性）全量评，业务 metric 抽样

:::

## Prompt 管理

把提示词当代码：版本化、回滚、环境隔离。

Langfuse / LangSmith 都支持：

```python
# Langfuse 取 prompt（按 label）
prompt = langfuse.get_prompt("rag-system-prompt", label="production")
# prompt.prompt = 系统提示文本
# prompt.config = 变量默认值

# 编译成最终字符串
compiled = prompt.compile(user_question="RAG 是什么？")
```

工作流：

1. **开发**：在 UI 改 prompt，打 `label=staging`
2. **测试**：在测试环境拉 `staging` 版本跑评测
3. **上线**：评测通过，改 `label=production`
4. **回滚**：出问题把 `production` label 指回上一版

代码不重新部署即可切 prompt——这是 prompt 管理的核心价值。

## A/B 测试

同 prompt / 模型两版本分流对比。

```
流量 50% → prompt v1 + gpt-4o-mini
流量 50% → prompt v2 + gpt-4o
        ↓
比较：质量评分 / cost / 延迟
```

要点：

- **分流键稳定**：同一 user 始终落同一组（不然用户体验跳）
- **跑够样本**：日均 1k 请求跑 3-7 天才有统计意义
- **看多指标**：质量涨但 cost 也涨，未必划算
- **冷启动**：新版本先放 5% 灰度，确认无大问题再放量

## 数据模型深度（Langfuse / Phoenix）

```
Session
  ├─ trace_id: uuid
  ├─ user_id: optional
  ├─ metadata: dict
  └─ Traces[]
       ├─ id: uuid
       ├─ name: "chat"
       ├─ timestamp
       ├─ input / output
       ├─ metadata / tags
       └─ Observations[]
            ├─ type: GENERATION | SPAN | EVENT
            ├─ start_time / end_time
            ├─ model (Generation)
            ├─ input (prompt) / output (completion)
            ├─ usage: { prompt_tokens, completion_tokens, total_cost }
            └─ 可嵌套子 Observation
```

Langfuse 用**扁平存储**：observation 行里冗余 trace 级属性（user_id / session_id / tags），免 JOIN，查询快。

## 跨工具标准：OpenTelemetry GenAI

OTel 的 **GenAI semantic conventions**（仍在演进）让 trace 跨工具通用：

- Langfuse / Phoenix 都原生支持 OTel
- 写一次插桩，后端可换（Langfuse → Phoenix → Datadog）
- 字段标准化：`gen_ai.system`、`gen_ai.request.model`、`gen_ai.usage.input_tokens` 等

LangSmith 用自有 SDK 不走 OTel——这是它「深度集成但不通用」的代价。

## 工具深度对比

### Langfuse（MIT 开源）

- **强**：MIT 商用友好 / OTel 兼容 / 自托管 / Prompt 管理 / 评测全（人工队列 + LLM judge + 用户反馈）
- **弱**：UI 比 LangSmith 简朴 / LangChain 集成需手动
- **适合**：通用 LLM 应用 / 想自托管 / 关心数据主权

### LangSmith（LangChain 官方）

- **强**：与 LangChain / LangGraph 深度集成（trace 自动捕获）/ **Engine（Olympus）**自动发现 trace 中的 recurring 问题 / UI 成熟
- **弱**：闭源 / 仅云版 / 非 LangChain 项目接入略繁
- **适合**：已用 LangChain / LangGraph 的团队

### Phoenix（Arize 开源）

- **强**：OTel + OpenInference 标准 / **LLM-as-judge 评测强**（自带 relevance/toxicity 等模板）/ Notebook 友好（可 `px.launch_app()` 在 Jupyter 里分析）
- **弱**：Prompt 管理弱 / 协作功能不如前两者
- **适合**：评测为主 / 实验分析 / 想换后端

### Helicone（开源 AI Gateway）

- **强**：**代理层一行接入零代码侵入** / 内置缓存省 token / 成本追踪强 / 100+ 模型路由
- **弱**：深度评测不如前三者 / 主要价值在 gateway 而非 trace 分析
- **适合**：纯省钱 / 多模型路由 / 不想改代码

## 生产部署建议

### 选型决策

```
你的场景
   ↓
[已有 LangChain？]
   ├─ 是 → LangSmith
   └─ 否 → [想自托管 / 数据敏感？]
            ├─ 是 → [评测为主？]
            │        ├─ 是 → Phoenix
            │        └─ 否 → Langfuse
            └─ 否 → [纯省钱 / 不改代码？]
                     ├─ 是 → Helicone
                     └─ 否 → Langfuse Cloud
```

### 接入策略

| 场景 | 推荐 |
| --- | --- |
| 新项目 | 一开始就接 Langfuse（OTel 标准，后期能换） |
| 老项目想加监控 | Helicone 代理层（零侵入） |
| 评测实验 | Phoenix Notebook |
| 全 LangChain 栈 | LangSmith |

### 成本监控

- **每天**：总 cost / 每用户 top 10 / 异常突增告警
- **每周**：质量评分趋势 / 模型成本占比
- **每月**：ROI 分析（成本 vs 业务收益）

## 常见误区

| 误区 | 真相 |
| --- | --- |
| 「接了监控就万事大吉」 | 没评分的 trace 只是日志，关键是有 Score |
| 「LLM-as-judge 一定准」 | 有 bias / 噪声，需防位置 bias + 自夸 bias |
| 「Prompt 管理只是存字符串」 | 真正价值在版本化 + 回滚 + 环境隔离 |
| 「A/B 一天就够」 | 至少跑 3-7 天看趋势，单日波动大 |
| 「Phoenix 和 Langfuse 二选一」 | 可都用——OTel 标准，trace 通用 |

## 版本与生态

| 节点 | 变化 |
| --- | --- |
| 2023 | LangSmith 随 LangChain 火爆登场 |
| 2024 | Langfuse 开源崛起 / Phoenix 开源 / OTel GenAI 草案 |
| 2025 | OTel GenAI semantic conventions 趋稳 / Helicone 加 Agent tracing |
| 2026 | 评测自动化成熟 / MCP 与可观测融合（trace 里看到 MCP 工具调用） |
