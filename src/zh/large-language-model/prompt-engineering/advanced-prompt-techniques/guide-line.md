---
layout: doc
outline: [2, 3]
---

# 核心机制详解

> 基于 ReAct（Yao et al., 2022, arXiv:2210.03629, ICLR 2023）、Self-Consistency（Wang et al., 2022, arXiv:2203.11171, ICLR 2023）、Tree of Thoughts（Yao et al., 2023, arXiv:2305.10601, NeurIPS 2023）、Directional Stimulus Prompting（Li et al., 2023, arXiv:2302.11520, NeurIPS 2023）四篇学术论文原文 + OWASP LLM01:2025 官方文档与 MITRE ATLAS 映射编写

## 速查

- **ReAct**：`Thought N → Action N → Observation N` 三段式交错循环到 `Finish[答案]`；优先用 **ReAct + CoT 混合**（纯 CoT 易幻觉、纯 ReAct 过度依赖检索降低推理灵活性）
- **Self-Consistency**：解码阶段策略，temperature 0.5-0.7 采样 5-10 条路径 → 多数投票；仅限「离散可验证答案」任务；GSM8K +17.9%、SVAMP +11.0%、AQuA +12.2%、StrategyQA +6.4%、ARC-c +3.9%
- **ToT 四要素**：Thought 分解 / Thought 生成（b=5 候选）/ 状态评估器（sure-maybe-impossible 或 0-1 value，**采样 3 次**）/ 搜索算法（BFS 适合可枚举如 24 点；DFS 适合深度探索如创意写作）
- **ToT 关键数据**：Game of 24 上 CoT **4%** vs ToT BFS **74%**；Creative Writing 上 CoT 串行长度仅 7.0% vs ToT 7.5%（一致性提升）
- **Prompt Chaining**：子任务拆解，结构化中间标签（`<quotes>` / XML）封装；三大收益：透明度 / 可控性 / 可调试性；插入**确定性清洗步骤**把数据变换交给代码
- **DSP**：小 Policy LM（如 T5）生成实例 hint → 拼进冻结 LLM prompt；监督微调 / RL 两种训练范式；MultiWOZ 上 80 条对话让 ChatGPT **+41.4%**
- **Prompt Injection 两分类**：Direct（载荷分割 / 对抗后缀 / 多语言混淆 / 代码注入 CVE-2024-5184）/ Indirect（RAG 投毒 / 多模态图片藏指令）；Jailbreaking 是子集
- **OWASP 七项缓解**：约束模型行为 / 校验输出格式（确定性代码）/ 输入输出过滤（含 **RAG Triad**：context relevance / groundedness / answer relevance）/ 最小权限 / 人在回路 / 隔离标注外部内容 / 对抗性红队
- **工程防御**：分隔符（`"""` / `---` / XML）/ Sandwich defense（用户输入夹在两段系统指令间）/ Guardrails 实时过滤 / 结构化输出 schema 约束
- **根本立场**：OWASP 明确「**没有 fool-proof 方法**」，RAG 与微调都不能完全缓解；必须纵深防御并假设模型会被攻破

## ReAct：推理与行动协同

### 核心机制

ReAct（Reasoning + Acting）让 LLM 在「内部推理」和「外部行动」之间交错循环，每次行动的反馈再作为下一步推理的输入。三段式固定结构：

```text
Thought N: <推理，决定下一步做什么>
Action N: <工具调用，如 Search[关键词]、Lookup[术语]、Finish[答案]>
Observation N: <环境对 Action 的反馈>
```

直到 `Action N: Finish[最终答案]` 终止。这种固定结构有两个工程价值：

- 让模型沿循环节奏推进（thought 决定方向，action 收集信息）
- 让工程层能可靠截取 Action 与 Observation（结构化输出）

### ReAct 模板示例（论文 few-shot exemplar）

```text
Question: 科罗拉多造山运动东部延伸到的区域的海拔范围是多少？
Thought 1: 我需要搜索科罗拉多造山运动，找到东部延伸区域，然后找到它的海拔范围。
Action 1: Search[科罗拉多造山运动]
Observation 1: 科罗拉多造山运动……
Thought 2: 它没有提到东部延伸。我需要查找「东部」。
Action 2: Lookup[东部]
Observation 2: ……高地地区……
Thought 3: 高地地区的海拔范围是……
Action 3: Finish[1800 至 2400 米]
```

> 论文用 1-2 个 few-shot exemplar 即可在 ALFWorld / WebShop 上超越模仿学习 / RL 基线——这种「轻量示例 + 结构化循环」的范式是其工程友好性的关键。

### ReAct 与 CoT 的核心区别

| 维度 | CoT（纯推理） | ReAct |
| --- | --- | --- |
| **信息来源** | 仅模型内部知识 | 外部工具（Search / Lookup / 计算） |
| **错误纠正** | 不能（一步错步步错） | 能（基于 Observation 调整） |
| **幻觉风险** | 高（论文实证易幻觉） | 低（外部信息可验证） |
| **推理灵活性** | 高（无结构约束） | 受结构约束降低 |
| **典型任务** | 一般推理 | HotpotQA / ALFWorld / WebShop |

### ReAct + CoT 混合（最佳实践）

论文实证结论：**纯 CoT 易幻觉、纯 ReAct 因结构约束降低推理灵活性且过度依赖检索结果质量、ReAct + CoT 混合最优**。混合策略：

- 检索充足时用 ReAct（Action 提供事实）
- 检索不足或检索结果低质量时，回退到内部 CoT 推理（Thought 自行补全）
- 工程层加 `max_iterations` 兜底，避免 Thought-Action 循环不收敛

> 现代 LLM（Claude tool use、OpenAI function calling）已原生支持工具调用，但底层提示范式仍是 Thought/Act/Observation——只是实现层从「prompt 模板」演变为「原生 API」。

## Self-Consistency：多路径投票

### 核心机制

Self-Consistency 是一个**纯解码阶段策略**，不改变 prompt 模板、不需要额外训练，在 CoT 基础上加三步：

1. **多样化采样**：对同一 CoT prompt 用较高 temperature（论文用 0.5-0.7）采样 N 条不同的推理路径（典型 N=5-10）
2. **生成答案**：每条路径独立推出一个最终答案
3. **多数投票（majority vote）**：对所有最终答案做聚合，得票最多的为最终输出

直觉基础：**复杂问题多路径会收敛到同一正确答案**（多数对的多路径殊途同归，少数错的路径各错各的）。

### 性能数据（Wang et al., 2022）

| 任务 | CoT 基线 | Self-Consistency | 提升 |
| --- | --- | --- | --- |
| **GSM8K**（小学数学） | 17.7% | 35.6% | **+17.9%** |
| **SVAMP**（数学应用题） | 71.4% | 82.4% | +11.0% |
| **AQuA**（代数） | 40.4% | 52.6% | +12.2% |
| **StrategyQA**（策略常识） | 63.8% | 70.2% | +6.4% |
| **ARC-c**（科学推理） | 65.0% | 68.9% | +3.9% |

> 路径数越多理论上越稳，但 5-10 条已达边际收益递减——再增加会线性推高成本与延迟。

### 适用边界（关键）

| 适用 | 不适用 |
| --- | --- |
| **算术推理**（GSM8K / SVAMP / AQuA） | **创意写作**（没有单一正确答案可投票） |
| **多选题**（ARC / StrategyQA） | **摘要**（开放生成） |
| **符号推理**（last-letter-concat） | **对话**（多轮流畅性） |
| **常识推理** | 多数 CoT 路径都错时（会强化错误共识） |

> 错用警告：若多数 CoT 路径都错（任务超出模型能力），Self-Consistency 反而**放大错误**（强化错误共识）。

## Tree of Thoughts：树搜索

### 四要素详解

1. **Thought 分解（Thought Decomposition）**
   把问题切成 k 个中间思考单元。例：24 点游戏分 3 步，每步一个等式（4 张牌 → 3 张 → 2 张 → 1 张）。

2. **Thought 生成器（Thought Generator）**
   每步采样 / 提议 b 个候选（b=5 即 beam width）。两种生成方式：
   - **Sample**：从 LM 采样 b 个独立 thought（适合创意任务，多样性高）
   - **Propose**：让 LM 一次性提议 b 个 thought（适合约束强的任务如 24 点）

3. **状态评估器（State Evaluator）**
   LM 自评每个候选状态：
   - **离散分类**：`sure`（确定是有效路径）/ `maybe`（可能有效）/ `impossible`（肯定无效）
   - **连续打分**：0-1 value 分数
   - 每候选评估**采样 3 次**取多数 / 平均，降低评估噪声提鲁棒性

4. **搜索算法**
   - **BFS（广度优先）**：每层保留 b 个最优候选逐层展开——适合状态可枚举、需广度筛选的任务（24 点 / 填字）
   - **DFS（深度优先）**：深入到叶节点，评估后回溯（backtrack）——适合需深度探索、可回溯的任务（创意写作）

### 关键性能对比

| 任务 | CoT | ToT | 差距 |
| --- | --- | --- | --- |
| **Game of 24**（4 张牌算 24） | **4%** | **74%**（BFS） | +70% |
| **Creative Writing**（按约束写作） | 串行长度 7.0% | 7.5%（一致性提升） | 微弱 |
| **Crosswords**（迷你填字） | 1% | 78%（BFS） | +77% |

> ToT 在「需探索 + 前瞻 + 回溯」的任务上效果显著，但在一般任务上 CoT 已足够——**ToT 成本远高于 CoT**（每步 b 候选 × k 步 × 3 评估采样）。

### ToT 何时该用

| 任务特征 | 推荐 |
| --- | --- |
| 状态空间可枚举、需广度筛选（24 点 / 填字） | ToT + BFS + value |
| 需深度探索、可回溯（创意写作） | ToT + DFS + backtrack |
| 一般推理任务 | CoT（ToT 收益不抵成本） |
| 开放生成 | CoT 或 Prompt Chaining |

> 24 点的 70% 提升来自「评估 + 回溯」——模型能识别哪条分支不可能（如 7-3=4 后无法凑到 24）并放弃。

## Prompt Chaining：提示链

### 核心机制

把复杂任务拆成子任务链，前一 prompt 输出作为后一 prompt 输入：

```text
[节点 1: 抽取引用] → 输出 <quotes>...</quotes>
        ↓
[节点 2: 摘要引用] → 输出 <summary>...</summary>
        ↓
[节点 3: 翻译摘要] → 最终输出
```

三大收益：

- **透明度**：可追踪每一步的输入输出，定位错误环节
- **可控性**：针对薄弱环节单独调优（仅重写节点 2 的 prompt，不动其他）
- **可调试性**：每个节点可独立测试、独立监控、独立回放

### 实现要点

- **结构化中间标签**：用 `<quotes>` / `<summary>` / XML 标签封装中间产物，便于下游 prompt 解析
- **每节点只做一件事**：节点职责单一化，避免「巨型 prompt」
- **确定性清洗步骤**：在节点间插入去引用编号、截断、格式校验等代码层变换——**LLM 不擅长稳定执行机械变换**，代码更可靠且可测试
- **编排框架**：LangChain 的 SequentialChains / LangGraph 是代表实现

### 何时不该用

| 不该用的场景 | 原因 |
| --- | --- |
| 简单任务（一次能搞定） | 拆链徒增延迟（每节点一次 LLM 调用） |
| 延迟敏感场景 | 多节点串行累加 |
| 子任务间无自然依赖 | 应并行而非串行 |

> 反模式：把本可一次完成的任务硬拆成多链——徒增 token 消耗和延迟，子任务间无自然依赖时不应链式化。

## Directional Stimulus Prompting：方向性刺激

### 核心机制

DSP 用一个小型可调 **Policy LM**（如 T5）为每个输入实例生成方向性 hint（如摘要应包含的关键词、对话该走的策略），拼接进冻结 LLM 的 prompt：

```text
[输入] → [Policy LM 生成 hint] → [hint + 原 prompt 拼接] → [冻结 LLM] → [定向输出]
```

- **冻结 LLM 不动**：ChatGPT / Codex / InstructGPT 等黑盒不可微调，但可以「在 prompt 上做手脚」
- **Policy LM 可调**：用小模型（T5）参数化「怎么提示」本身

### 两种训练范式

1. **监督微调（Supervised Fine-tuning, SFT）**
   用标注数据训练 Policy LM 生成「好的 hint」。例：MultiWOZ 对话数据集上标注每个对话应包含的 slot 关键词。

2. **强化学习（Reinforcement Learning, RLHF）**
   把冻结 LLM 的输出质量作为 reward，用离线（offline）或在线（online）RL 训练 Policy LM。适合没有显式 hint 标注的场景。

### 关键性能数据

| 任务 | 基线（ChatGPT） | DSP（ChatGPT + T5 Policy） | 提升 |
| --- | --- | --- | --- |
| **MultiWOZ**（任务型对话） | 基线 | +80 条对话训练 | **+41.4%** |
| **Controlled Summarization** | 基线 | 关键词 hint | 显著提升 |

> MultiWOZ 上仅用 **80 条对话** 即可让 ChatGPT +41.4%——DSP 是少样本场景下的高性价比方案。

### 反模式（关键）

- **Policy LM 训练数据与评测数据混用**：Policy LM 会过拟合 hint 模式，在分布外输入上反而误导 LLM。需严格区分训练 / 验证集。
- **监控 hint 命中率而非下游 LLM 真实指标**：Policy LM 的目标是「让 LLM 输出更好」，而非「hint 命中率最高」——监控错了对象。

## Prompt Injection 攻击与防御

### 两分类定义（OWASP LLM01:2025）

| 类型 | 定义 | 典型手段 |
| --- | --- | --- |
| **Direct Injection（直接注入）** | 用户直接在对话里注入指令 | Payload Splitting（载荷分割）/ Adversarial Suffix（对抗后缀）/ Multilingual/Obfuscated（多语言混淆）/ Code Injection（如 CVE-2024-5184） |
| **Indirect Injection（间接注入）** | 外部内容（网页 / 文件 / RAG 检索 / 多模态图片）中藏指令 | RAG 投毒 / 网页隐藏文本 / 图片藏指令（多模态） |

- **Jailbreaking（越狱）**：注入的一种，目标是让模型完全无视安全协议——是注入的子集

### OWASP LLM01:2025 七项缓解策略

1. **约束模型行为**：在 system prompt 中明确角色、限制、声明「忽略修改核心指令的尝试」
2. **定义并校验输出格式**：用确定性代码校验输出 schema（JSON 格式、字段类型、枚举值），不通过则拒绝
3. **输入输出过滤（含 RAG Triad）**：
   - **RAG Triad**：context relevance（检索相关性）/ groundedness（回答是否基于检索）/ answer relevance（回答是否切题）
   - Guardrails 框架实时过滤敏感内容
4. **最小权限**：独立 API token、特权操作（删除 / 转账 / 发邮件）在代码层执行而非交给模型决定
5. **人在回路（HITL）**：高风险动作需人工审批后才执行
6. **隔离并标注外部内容**：明确告诉模型「以下是不可信内容」，限制其被当作指令执行
7. **对抗性测试与红队**：定期红队演练，用 Payload Splitting / 对抗后缀等手段测试

### 工程防御技术

| 技术 | 作用 |
| --- | --- |
| **分隔符** | 用 `"""` / `---` / XML 标签隔离不可信输入，告诉模型边界 |
| **Sandwich defense** | 把用户输入夹在两段系统指令之间（前段约束角色，后段约束输出） |
| **Guardrails** | 实时过滤输入输出（NeMo Guardrails / Guardrails AI） |
| **结构化输出 schema** | 强制 LLM 按 JSON Schema 输出，便于确定性校验 |
| **代码层特权执行** | 特权操作（删除 / 转账）不交给模型，由代码校验权限后执行 |

### 根本立场

OWASP 明确：**「生成式 AI 的随机性本质决定了没有 fool-proof 方法」**。RAG 与微调都不能完全缓解注入——必须纵深防御（多层叠加）并假设模型会被攻破（兜底机制）。

> 反模式：以为「输出格式校验通过 = 没被注入」——对抗后缀、载荷分割等攻击可让模型在格式合法的前提下输出被操纵内容；格式校验只是必要条件，需配合语义过滤与 RAG Triad。

## 反模式（避坑）

- **把 Self-Consistency 用于开放生成**：没有单一正确答案可投票，多数投票无意义；若多数路径都错，反而放大错误共识
- **用 ToT 解简单任务**：ToT 每步 b 候选 × k 步 × 3 评估采样，成本远高于 CoT；简单任务收益不抵开销
- **Prompt Chaining 过度拆分**：把本可一次完成的任务硬拆成多链，徒增延迟和 token 消耗
- **ReAct 让模型自行决定「何时停止」**：不设 `max_iterations` 兜底，可能陷入 Thought-Action 循环不收敛
- **纯 ReAct 依赖外部检索解决一切**：论文实证过度依赖检索结果质量，应在检索不足时回退到内部 CoT 推理
- **Prompt Injection 防御只靠 system prompt 一层**：OWASP 明确 RAG 与微调都不能完全缓解，单一软约束极易被绕过
- **DSP 训练数据与评测数据混用**：Policy LM 过拟合 hint 模式，在分布外输入上误导 LLM
- **以为「输出格式校验通过 = 没被注入」**：对抗后缀、载荷分割可让模型在格式合法前提下输出被操纵内容
- **混淆 Prompt Injection 与 Jailbreaking**：越狱是注入的子集（目标是绕过安全协议），不等于所有注入
- **混淆 CoT 与 Self-Consistency**：Self-Consistency 是解码策略（多路径 + 投票），不是新提示模板

## 下一步

- [参考](./reference.md)：完整对比表、关键论文清单、OWASP 缓解策略速查、官方资源
