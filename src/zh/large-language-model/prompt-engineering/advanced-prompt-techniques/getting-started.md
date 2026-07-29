---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 ReAct（Yao et al., 2022, arXiv:2210.03629）、Self-Consistency（Wang et al., 2022, arXiv:2203.11171）、Tree of Thoughts（Yao et al., 2023, arXiv:2305.10601）、Directional Stimulus Prompting（Li et al., 2023, arXiv:2302.11520）四篇学术论文，以及 OWASP LLM01:2025 官方文档与 Prompting Guide AI 工程综述编写

## 速查

- **6 项技术两方向**：推理增强（ReAct / Self-Consistency / ToT / Prompt Chaining / DSP）+ 提示安全（Prompt Injection）
- **ReAct 三段式**：`Thought N: 推理 → Action N: Search[...]/Lookup[...]/Finish[答案] → Observation N: 环境反馈`，交错循环到 `Finish`
- **Self-Consistency 三步**：多样化采样 N 条（典型 5-10）→ 各自生成答案 → 多数投票聚合；本质是**解码策略**而非新提示模板；GSM8K +17.9%、SVAMP +11.0%、AQuA +12.2%
- **ToT 四要素**：①Thought 分解 ②生成器（每步 b=5 候选）③状态评估器（sure / maybe / impossible 或 0-1 value，采样 3 次提鲁棒）④搜索算法（BFS 广度筛选 / DFS 回溯）
- **Game of 24 对比**：CoT 仅 **4%**，ToT BFS 达 **74%**
- **Prompt Chaining**：子任务拆解，前 prompt 输出作后 prompt 输入，用 `<quotes>` / XML 标签封装中间产物；三大收益：透明度 / 可控性 / 可调试性
- **DSP 核心**：小 Policy LM（如 T5）为每个输入生成 hint → 拼进冻结 LLM 的 prompt；MultiWOZ 上仅 80 条对话让 ChatGPT **+41.4%**
- **Prompt Injection 两分类**：Direct（用户直接注入）/ Indirect（外部网页 / 文件 / RAG 投毒 / 多模态图片藏指令）；越狱（Jailbreaking）是注入的子集
- **OWASP 七项缓解**：约束行为 / 校验输出格式 / 输入输出过滤（含 RAG Triad）/ 最小权限 / 人在回路 / 隔离标注外部内容 / 对抗性红队
- **根本立场**：OWASP 明确「**没有 fool-proof 方法**」，RAG 与微调都不能完全缓解，必须纵深防御并假设模型会被攻破
- **温度建议**：Self-Consistency 用 0.5-0.7 保证路径多样性；ToT 每候选评估采样 3 次
- **适用边界速记**：ReAct 解决推理+工具协同、Self-Consistency 仅限离散可验证答案、ToT 仅在需探索+回溯任务上划算、Chaining 适合流水线、DSP 用于黑盒引导

## 高级提示技巧是什么

高级提示技巧是相对基础提示（Zero-shot / Few-shot / CoT）而言的**推理增强型提示范式**与**提示安全**技术集合，来源于 2022-2023 年的 NeurIPS / ICLR 顶会论文与 OWASP 官方安全标准。它的核心定位有三：

- **学术奠基**：ReAct / ToT / Self-Consistency 是 LLM 推理范式的奠基工作，至今仍是工业实践与后续研究的事实标准基线
- **工程化升级**：Prompt Chaining 把单次 LLM 调用升级为可追踪、可调试的流水线，是 Agent 编排的前置概念
- **安全边界**：Prompt Injection 是 OWASP Gen AI Security Project 2025 版的 #1 风险，必须在前 5 项落地后正面应对

> 高级提示技巧 ≠ 让模型「更聪明」。它的本质是**用范式约束模型的推理路径与输出结构**，并在工程层做兜底，而不是寄希望于模型一次性输出正确答案。

## 六项技术全景

| 技术 | 提出者 / 年份 | 解决的核心问题 | 关键数据 |
| --- | --- | --- | --- |
| **ReAct** | Yao et al., 2022 / ICLR 2023 | 推理与外部工具（检索 / 计算）协同 | HotpotQA / ALFWorld 上 1-2 个 few-shot 即超模仿学习 / RL 基线 |
| **Self-Consistency** | Wang et al., 2022 / ICLR 2023 | 单次贪婪解码不可靠 | GSM8K +17.9%、SVAMP +11.0%、AQuA +12.2% |
| **Tree of Thoughts** | Yao et al., 2023 / NeurIPS 2023 | 需探索 + 前瞻 + 回溯的搜索型任务 | Game of 24：CoT 4% vs ToT 74% |
| **Prompt Chaining** | 社区工程范式（IBM / LangChain） | 单 prompt 难胜任的流水线任务 | 提升透明度 / 可控性 / 可调试性 |
| **Directional Stimulus (DSP)** | Li et al., 2023 / NeurIPS 2023 | 不动 LLM 参数也能定向引导黑盒模型 | MultiWOZ 上 80 条对话让 ChatGPT +41.4% |
| **Prompt Injection** | OWASP LLM01:2025 / MITRE ATLAS | LLM 应用安全边界 | OWASP Gen AI Security #1 风险 |

> 6 项技术互补而非替代——选用要看任务类型（推理 / 决策 / 流水线 / 黑盒引导）和阶段（推理优化 vs 安全防护）。

## 三大推理范式对比

| 维度 | CoT（基础） | ReAct | Self-Consistency | ToT |
| --- | --- | --- | --- | --- |
| **核心思路** | 一步步推理 | 推理 + 外部工具 | 多路径投票 | 树搜索 + 评估 + 回溯 |
| **外部信息** | 无 | 有（Search / Lookup） | 无 | 无（LM 自评） |
| **成本** | 1× | 1× + 工具调用 | 5-10× | b × k × 3 评估 |
| **典型任务** | 一般推理 | HotpotQA / ALFWorld | 算术 / 多选 / 常识 | 24 点 / 创意写作 / 填字 |
| **能否纠正错误** | 不能 | 能（基于 Observation） | 投票稀释 | 能（回溯） |
| **代表数据** | GSM8K 基线 | ALFWorld 超 RL 基线 | GSM8K +17.9% | 24 点：4% → 74% |

> CoT 是基础，ReAct / Self-Consistency / ToT 是在 CoT 之上分别加「外部工具」「多路径」「树搜索」三套机制。

## ReAct 速览

ReAct = Reasoning + Acting，让 LLM 在推理（Thought）和行动（Action）之间交错循环，并把环境反馈（Observation）作为下一步推理的输入。

```text
Thought 1: 我需要先查 X 的出生年份
Action 1: Search[X 出生年份]
Observation 1: X 出生于 1980 年
Thought 2: 我需要再查 Y 的出生年份，与 X 比较
Action 2: Search[Y 出生年份]
Observation 2: Y 出生于 1975 年
Thought 3: Y 比 X 大 5 岁
Action 3: Finish[Y 比 X 大 5 岁]
```

> 现代 LLM 已原生支持工具调用（Claude tool use、OpenAI function calling），但 Thought/Act/Observation 范式仍是底层提示范式。

## Self-Consistency 速览

三步流程：

1. **多样化采样**：对同一 prompt 用较高 temperature（0.5-0.7）采样 N 条（典型 5-10）不同的推理路径
2. **生成答案**：每条路径独立推出一个最终答案
3. **多数投票**：对所有最终答案做 majority vote，得票最多的为最终输出

> 仅适用于「答案可离散、可验证」的任务（算术 / 多选 / 常识 / 符号推理）。开放生成（创意写作 / 摘要）没有单一正确答案可投票。

## Tree of Thoughts 速览

四要素：

1. **Thought 分解**：把问题切成 k 个中间思考单元（如 24 点游戏分 3 步、每步一个等式）
2. **Thought 生成**：每步采样 / 提议 b 个候选（b=5 即 beam width）
3. **状态评估器**：LM 自评 `sure / maybe / impossible` 三类，或打 0-1 value 分；每候选采样 **3 次**提鲁棒性
4. **搜索算法**：BFS（保留 b 个最优逐层展开）适合状态可枚举；DFS（深入 + 回溯）适合需深度探索

> 论文 Game of 24 上 CoT 仅 4%，ToT BFS 达 74%——核心差距在「评估 + 回溯」让模型能识别并纠正错误分支。

## Prompt Chaining 速览

把复杂任务拆成子任务链，前一 prompt 输出作后一 prompt 输入：

```text
[Prompt 1: 抽取引用] → 输出 <quotes>...</quotes>
        ↓
[Prompt 2: 摘要引用] → 输出 <summary>...</summary>
        ↓
[Prompt 3: 翻译摘要] → 最终输出
```

- 用结构化标签（`<quotes>` / XML）封装中间产物，便于下游 prompt 解析
- 每个链节点只做一件事，提升透明度 / 可控性 / 可调试性
- 在链节点间插入**确定性清洗步骤**（去引用编号、截断、格式校验），把「数据变换」交给代码而非 LLM

> LangChain 的 SequentialChains / LangGraph 是 Prompt Chaining 的代表工程实现。

## Directional Stimulus 速览

DSP 用一个小型可调 **Policy LM**（如 T5）为每个输入实例生成方向性 hint（如摘要应包含的关键词），拼接进冻结 LLM 的 prompt：

```text
[Policy LM 输出 hint] + [原 prompt] → [冻结 LLM] → [定向输出]
```

- Policy LM 两种训练范式：**监督微调**（标注数据）/ **强化学习**（RLHF，离线或在线 reward）
- 适用场景：黑盒 LLM（ChatGPT / Codex）或不允许微调的第三方 LLM
- 论文 MultiWOZ 上仅 80 条对话即让 ChatGPT **+41.4%**

> DSP 的核心价值：把「怎么提示」本身参数化，绕开 LLM 微调的成本 / 权限 / 版本漂移。

## Prompt Injection 速览

OWASP LLM01:2025 定义的两分类：

- **Direct Prompt Injection（直接注入）**：用户直接在对话里注入指令，含载荷分割、对抗后缀、多语言混淆、代码注入（如 CVE-2024-5184）
- **Indirect Prompt Injection（间接注入）**：外部网页 / 文件 / RAG 检索内容 / 多模态图片中藏指令，被 LLM 误信为可信上下文
- **Jailbreaking（越狱）**：注入的一种，目标是让模型完全无视安全协议

> OWASP 明确「**没有 fool-proof 方法**」——生成式 AI 的随机性本质决定了 RAG、微调、system prompt 都不能完全缓解，必须纵深防御。

## 适用边界一图流

| 任务类型 | 推荐技术 | 不推荐 |
| --- | --- | --- |
| 一般推理（基础题） | CoT / Few-shot | ToT（成本不抵收益） |
| 多跳问答（需检索） | ReAct | 纯 CoT（易幻觉） |
| 算术 / 多选 / 常识 | Self-Consistency | 开放生成 |
| 创意写作 / 24 点 / 填字 | ToT | Self-Consistency（无单一正确答案） |
| 流水线任务（抽取 → 摘要 → 翻译） | Prompt Chaining | 单 prompt 巨型化 |
| 黑盒 LLM 定向引导 | DSP | 微调 LLM（成本 / 权限不允许） |
| 所有 LLM 应用 | Prompt Injection 防御 | 仅靠 system prompt 一层 |

## 下一步

- [核心机制详解](./guide-line.md)：ReAct 三段式 / Self-Consistency 解码策略 / ToT 四要素 / Prompt Chaining / DSP / Prompt Injection 攻防的深度展开、反模式与陷阱
- [参考](./reference.md)：完整对比表、关键论文清单、OWASP 缓解策略速查、官方资源
