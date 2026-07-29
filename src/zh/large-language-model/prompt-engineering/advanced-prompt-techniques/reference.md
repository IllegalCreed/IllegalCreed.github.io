---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 ReAct / Self-Consistency / Tree of Thoughts / Directional Stimulus Prompting 四篇学术论文原文（2022-2023）+ OWASP LLM01:2025 官方文档与 MITRE ATLAS 映射编写

## 速查

- **6 项技术两方向**：推理增强（ReAct / Self-Consistency / ToT / Prompt Chaining / DSP）+ 提示安全（Prompt Injection）
- **ReAct 三段式**：`Thought N → Action N → Observation N → ... → Finish[答案]`；优先 ReAct + CoT 混合
- **Self-Consistency**：temperature 0.5-0.7 采样 5-10 条 → 多数投票；仅限离散可验证答案；GSM8K +17.9%
- **ToT 四要素**：Thought 分解 / 生成（b=5）/ 评估器（sure-maybe-impossible 或 0-1 value，采样 3 次）/ 搜索（BFS / DFS）；Game of 24：CoT 4% vs ToT 74%
- **Prompt Chaining**：子任务拆解 + 结构化中间标签（`<quotes>` / XML）+ 确定性清洗步骤
- **DSP**：小 Policy LM（T5）生成 hint 拼进冻结 LLM；监督微调 / RL 两种训练；MultiWOZ +41.4%
- **Prompt Injection 两分类**：Direct（载荷分割 / 对抗后缀 / 多语言混淆 / 代码注入 CVE-2024-5184）/ Indirect（RAG 投毒 / 多模态图片藏指令）
- **OWASP 七项缓解**：约束行为 / 校验输出格式 / 输入输出过滤（含 RAG Triad）/ 最小权限 / 人在回路 / 隔离标注外部内容 / 对抗性红队
- **根本立场**：OWASP 明确「**没有 fool-proof 方法**」，必须纵深防御并假设模型会被攻破
- **MITRE ATLAS 映射**：AML.T0051.000（直接注入）/ AML.T0051.001（间接注入）/ AML.T0054（越狱）
- 完整说明见 [入门](./getting-started.md) / [核心机制详解](./guide-line.md)

## 六项技术完整对比表

| 技术 | 提出者 | 年份 / 会议 | 核心机制 | 适用任务 | 代表数据 |
| --- | --- | --- | --- | --- | --- |
| **ReAct** | Yao et al. | 2022 / ICLR 2023 | Thought/Action/Observation 三段式交错循环 | HotpotQA / ALFWorld / WebShop | 1-2 个 few-shot 超 RL 基线 |
| **Self-Consistency** | Wang et al. | 2022 / ICLR 2023 | 多路径采样 + 多数投票 | 算术 / 多选 / 常识 / 符号推理 | GSM8K +17.9%、AQuA +12.2% |
| **Tree of Thoughts** | Yao et al. | 2023 / NeurIPS 2023 | Thought 树 + 评估器 + BFS/DFS 搜索 | 24 点 / 创意写作 / 填字 | Game of 24：4% → 74% |
| **Prompt Chaining** | 社区工程范式 | 2022+ | 子任务拆解 + 结构化中间标签 | 流水线任务（抽取 / 摘要 / 翻译） | 三大收益：透明 / 可控 / 可调试 |
| **Directional Stimulus (DSP)** | Li et al. | 2023 / NeurIPS 2023 | Policy LM 生成 hint 拼进冻结 LLM | 黑盒 LLM 定向引导 | MultiWOZ +41.4%（80 条对话） |
| **Prompt Injection** | OWASP / MITRE | LLM01:2025 | LLM 应用安全边界 | 所有 LLM 应用 | OWASP #1 风险 |

## ReAct 速查

- **三段式结构**：`Thought N: 推理` → `Action N: Search[...]/Lookup[...]/Finish[答案]` → `Observation N: 反馈`
- **典型 Action**：`Search[关键词]`（检索）/ `Lookup[术语]`（在已检索内容中查找）/ `Finish[答案]`（终止）
- **混合策略**：ReAct + CoT 混合最优（论文实证纯 CoT 易幻觉、纯 ReAct 结构约束降低推理灵活性）
- **工程要点**：用 few-shot exemplar 固定结构 + `max_iterations` 兜底
- **现代实现**：Claude tool use / OpenAI function calling 原生支持，但底层范式不变

## Self-Consistency 速查

| 任务 | CoT 基线 | Self-Consistency | 提升 |
| --- | --- | --- | --- |
| **GSM8K** | 17.7% | 35.6% | +17.9% |
| **SVAMP** | 71.4% | 82.4% | +11.0% |
| **AQuA** | 40.4% | 52.6% | +12.2% |
| **StrategyQA** | 63.8% | 70.2% | +6.4% |
| **ARC-c** | 65.0% | 68.9% | +3.9% |

- **采样参数**：temperature 0.5-0.7，路径数 5-10（边际收益递减）
- **聚合方式**：多数投票（majority vote）/ 边际化采样路径
- **本质**：解码策略（不改变 prompt 模板，不需要额外训练）
- **适用边界**：仅限离散可验证答案；开放生成不适用；多数路径都错时反而放大错误

## ToT 速查

**四要素**

| 要素 | 取值 / 方式 |
| --- | --- |
| **Thought 分解** | 把问题切成 k 个中间思考单元（如 24 点分 3 步） |
| **Thought 生成** | 每步 b=5 候选；Sample（多样性高）/ Propose（约束强） |
| **状态评估器** | `sure / maybe / impossible` 三类，或 0-1 value 分数；**采样 3 次** |
| **搜索算法** | BFS（广度筛选，保留 b 个最优）/ DFS（深入 + 回溯） |

**性能对比**

| 任务 | CoT | ToT |
| --- | --- | --- |
| Game of 24 | **4%** | **74%**（BFS） |
| Creative Writing（一致性） | 7.0% | 7.5% |
| Crosswords（迷你填字） | 1% | 78% |

**适用场景**

| 任务类型 | 推荐 |
| --- | --- |
| 状态可枚举、需广度筛选（24 点 / 填字） | ToT + BFS + value |
| 需深度探索、可回溯（创意写作） | ToT + DFS + backtrack |
| 一般推理任务 | CoT（成本不抵收益） |

## Prompt Chaining 速查

- **结构**：节点 1 输出（如 `<quotes>`）→ 节点 2 输入 → 节点 2 输出（如 `<summary>`）→ ... → 最终输出
- **结构化标签**：`<quotes>` / `<summary>` / XML 标签封装中间产物
- **三大收益**：透明度（每步可追踪）/ 可控性（针对薄弱环节调优）/ 可调试性（逐节点定位）
- **关键实践**：节点间插入确定性清洗步骤（去引用编号 / 截断 / 格式校验），把数据变换交给代码
- **代表框架**：LangChain SequentialChains / LangGraph
- **不该用**：简单任务 / 延迟敏感 / 子任务间无依赖

## DSP 速查

| 项 | 取值 |
| --- | --- |
| **Policy LM** | 小型可调模型（如 T5） |
| **目标 LLM** | 冻结的黑盒 LLM（ChatGPT / Codex / InstructGPT） |
| **训练范式** | 监督微调（SFT，需标注 hint）/ 强化学习（RL，离线或在线 reward） |
| **代表数据** | MultiWOZ 上 80 条对话让 ChatGPT **+41.4%** |
| **核心价值** | 把「怎么提示」参数化，绕开 LLM 微调的成本 / 权限 / 版本漂移 |

**反模式**：训练数据与评测数据混用 → Policy LM 过拟合 hint 模式 → 分布外输入误导 LLM；监控 hint 命中率而非下游 LLM 真实指标。

## Prompt Injection 攻击速查

### 攻击分类（OWASP LLM01:2025）

| 类型 | 子类 | 说明 |
| --- | --- | --- |
| **Direct Injection** | Payload Splitting（载荷分割） | 把恶意指令拆成多段，绕过单一关键词过滤 |
| | Adversarial Suffix（对抗后缀） | 优化出的字符后缀，让模型在格式合法前提下输出被操纵内容 |
| | Multilingual / Obfuscated（多语言混淆） | 用低资源语言 / 谐音 / Unicode 混淆绕过过滤 |
| | Code Injection（代码注入） | 如 CVE-2024-5184，通过代码片段注入 |
| **Indirect Injection** | RAG 投毒 | 在 RAG 检索源中植入恶意指令 |
| | 网页隐藏文本 | 爬取的网页含隐藏指令 |
| | 多模态图片藏指令 | 图片中藏 prompt（多模态） |
| **Jailbreaking（越狱）** | 子集 | 让模型完全无视安全协议 |

### OWASP LLM01:2025 七项缓解

| # | 策略 | 关键实践 |
| --- | --- | --- |
| 1 | **约束模型行为** | System prompt 明确角色、限制、声明「忽略修改核心指令的尝试」 |
| 2 | **定义并校验输出格式** | 确定性代码校验 JSON schema、字段类型、枚举值 |
| 3 | **输入输出过滤** | Guardrails 实时过滤 + **RAG Triad**（context relevance / groundedness / answer relevance） |
| 4 | **最小权限** | 独立 API token，特权操作在代码层执行 |
| 5 | **人在回路（HITL）** | 高风险动作需人工审批 |
| 6 | **隔离并标注外部内容** | 明确告诉模型「以下是不可信内容」 |
| 7 | **对抗性测试与红队** | 定期用 Payload Splitting / 对抗后缀等手段演练 |

### 工程防御技术

| 技术 | 作用 |
| --- | --- |
| **分隔符** | `"""` / `---` / XML 标签隔离不可信输入 |
| **Sandwich defense** | 用户输入夹在两段系统指令之间 |
| **Guardrails** | 实时过滤（NeMo Guardrails / Guardrails AI） |
| **结构化输出 schema** | 强制 JSON Schema 输出，确定性校验 |
| **代码层特权执行** | 特权操作不交给模型，由代码校验权限后执行 |

### MITRE ATLAS 映射

| ATLAS ID | 名称 |
| --- | --- |
| **AML.T0051.000** | 直接 Prompt Injection |
| **AML.T0051.001** | 间接 Prompt Injection |
| **AML.T0054** | Jailbreaking（越狱） |

## 反模式速查

| 反模式 | 风险 |
| --- | --- |
| Self-Consistency 用于开放生成 | 无单一正确答案可投票；多数路径错时放大错误 |
| ToT 解简单任务 | 成本不抵收益（b × k × 3 评估采样） |
| Prompt Chaining 过度拆分 | 徒增延迟和 token 消耗 |
| ReAct 不设 `max_iterations` | Thought-Action 循环不收敛 |
| 纯 ReAct 依赖检索解决一切 | 检索质量低时表现差，应回退 CoT |
| Prompt Injection 仅靠 system prompt | OWASP 明确单一软约束极易被绕过 |
| DSP 训练 / 评测数据混用 | Policy LM 过拟合 hint 模式 |
| 以为「格式校验通过 = 没被注入」 | 对抗后缀可让格式合法但内容被操纵 |
| 混淆 Prompt Injection 与 Jailbreaking | 越狱是注入的子集 |
| 混淆 CoT 与 Self-Consistency | 后者是解码策略，不是新提示模板 |

## 官方资源

- ReAct 论文：[https://arxiv.org/abs/2210.03629](https://arxiv.org/abs/2210.03629)
- ReAct 项目页：[https://react-lm.github.io/](https://react-lm.github.io/)
- ReAct 代码：[https://github.com/ysymyth/ReAct](https://github.com/ysymyth/ReAct)
- Self-Consistency 论文：[https://arxiv.org/abs/2203.11171](https://arxiv.org/abs/2203.11171)
- Tree of Thoughts 论文：[https://arxiv.org/abs/2305.10601](https://arxiv.org/abs/2305.10601)
- ToT 代码：[https://github.com/princeton-nlp/tree-of-thought-llm](https://github.com/princeton-nlp/tree-of-thought-llm)
- Directional Stimulus 论文：[https://arxiv.org/abs/2302.11520](https://arxiv.org/abs/2302.11520)
- DSP 代码：[https://github.com/Leezekun/Directional-Stimulus-Prompting](https://github.com/Leezekun/Directional-Stimulus-Prompting)
- OWASP LLM01:2025：[https://genai.owasp.org/llmrisk/llm01-prompt-injection/](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
- MITRE ATLAS：[https://atlas.mitre.org/](https://atlas.mitre.org/)
- Prompting Guide AI 工程综述：[https://www.promptingguide.ai/techniques/prompt_chaining](https://www.promptingguide.ai/techniques/prompt_chaining)
