---
layout: doc
---

# 高级提示技巧

高级提示技巧是 LLM 提示工程领域 2022-2023 年间由学术论文确立的**推理增强型提示范式**与**提示安全**两大方向的总称，覆盖六项互补而非替代的技术：**ReAct**（Reasoning + Acting，推理与行动协同）、**Self-Consistency**（自洽性解码）、**Tree of Thoughts / ToT**（思维树搜索）、**Prompt Chaining**（提示链）、**Directional Stimulus Prompting / DSP**（方向性刺激提示）、**Prompt Injection 攻击与防御**（OWASP LLM01:2025 #1 风险）。前三项（ReAct / Self-Consistency / ToT）解决「单次贪婪解码 + 纯文本推理」在复杂任务上的不足——通过外部工具协同、多路径投票、树搜索三种思路提升推理可靠性；Prompt Chaining 是工程范式而非推理范式，解决单 prompt 难以胜任的流水线任务；DSP 解决不动 LLM 参数也能定向引导黑盒模型；Prompt Injection 则是前 5 项落地后必须面对的安全边界。ReAct 论文（Yao et al., ICLR 2023）引用量级约 13000、ToT（NeurIPS 2023）约 8000、Self-Consistency（ICLR 2023）约 5000，至今仍是工业实践与后续研究的事实标准基线；OWASP LLM01:2025 Prompt Injection 是 OWASP Gen AI Security Project 2025 版的 #1 风险条目，已与 MITRE ATLAS（AML.T0051.000/.001 直接/间接注入、AML.T0054 越狱）对齐。

## 评价

**优点**

- **学术奠基性强**：6 项技术均来自 NeurIPS / ICLR 顶会论文或 OWASP 权威标准，引用量级数千至万级，至今仍是后续研究与工业实践的事实标准基线
- **互补而非替代**：ReAct（推理+工具协同）、Self-Consistency（多路径投票）、ToT（搜索回溯）覆盖了不同复杂度的推理任务，按需选用
- **工程化路径清晰**：Prompt Chaining 用结构化中间标签串联子任务，把单点 LLM 调用升级为可追踪、可调试的流水线
- **黑盒友好**：DSP 用小 Policy LM 生成 hint，绕开 LLM 微调的成本 / 权限 / 版本漂移，MultiWOZ 上 80 条对话让 ChatGPT +41.4%
- **安全标准对齐**：OWASP LLM01:2025 + MITRE ATLAS 映射，给出官方认可的七项缓解策略，是合规审查的事实依据
- **范式已被现代模型原生支持**：ReAct 的 Thought/Act/Observation 范式被 Claude tool use、OpenAI function calling 等原生吸收，实现层在演进但提示范式未变

**缺点**

- **认知门槛高**：6 项技术各有适用边界（Self-Consistency 仅限离散可验证答案、ToT 仅在需探索+回溯任务上划算），错用反而放大错误或浪费成本
- **成本陡增**：ToT 每步多候选 × 多评估采样（×3），Self-Consistency 需采样 5-10 条路径，Prompt Chaining 每节点都是一次 LLM 调用，延迟与 token 消耗随复杂度线性甚至指数增长
- **依赖外部工具与工程基建**：ReAct 需可靠的检索 / 工具调用层、Prompt Chaining 需编排框架（LangChain / LangGraph）、DSP 需训练 Policy LM，落地的工程门槛高于「写一个好 prompt」
- **Prompt Injection 无 fool-proof 防御**：OWASP 明确「生成式 AI 的随机性本质决定了没有 fool-proof 方法」，RAG 与微调都不能完全缓解，必须纵深防御并假设模型会被攻破
- **论文与生产环境的差距**：ReAct 原始实验基于 text-davinci-003 等旧模型，新模型（Claude / GPT-4）已原生支持工具调用，直接照搬论文模板未必最优
- **DSP 训练数据易过拟合**：Policy LM 训练数据若与评测数据混用，会在分布外输入上误导 LLM，需严格区分训练 / 验证集并监控下游真实指标

## 文档地址

- [ReAct: Synergizing Reasoning and Acting in Language Models (Yao et al., 2022)](https://arxiv.org/abs/2210.03629)
- [ReAct 官方项目页](https://react-lm.github.io/)
- [Self-Consistency Improves Chain of Thought Reasoning (Wang et al., 2022)](https://arxiv.org/abs/2203.11171)
- [Tree of Thoughts (Yao et al., 2023)](https://arxiv.org/abs/2305.10601)
- [Directional Stimulus Prompting (Li et al., 2023)](https://arxiv.org/abs/2302.11520)
- [OWASP LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
- [Prompting Guide AI 工程综述](https://www.promptingguide.ai/techniques/prompt_chaining)

## GitHub地址

[ysymyth/ReAct](https://github.com/ysymyth/ReAct) · [princeton-nlp/tree-of-thought-llm](https://github.com/princeton-nlp/tree-of-thought-llm) · [Leezekun/Directional-Stimulus-Prompting](https://github.com/Leezekun/Directional-Stimulus-Prompting)

## 幻灯片地址

<a href="/SlideStack/advanced-prompt-techniques-slide/" target="_blank">高级提示技巧</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">高级提示技巧测试题</a>
