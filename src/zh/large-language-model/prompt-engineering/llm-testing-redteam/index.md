---
layout: doc
---

# LLM 测试与红队

**把「提示词工程」从手艺变成工程的关键一环**——用测试框架给你的 prompt / 模型 / Agent 写「单元测试」与「安全渗透测试」。传统软件有 pytest / JUnit 保证回归，LLM 应用同样需要：改一版 prompt 后能**自动验证答案没变差**，上线前能**自动扫描越狱 / 注入 / PII 泄露**等漏洞。

三大主流框架分工互补：

- **Promptfoo**：CLI + 配置驱动的评测与**红队（red teaming）**工具，44+ 确定性断言 + 15+ 模型评分断言，原生 CI/CD 集成，**23+ assertion 类型只是下限**（实际更多）
- **DeepEval**：Pytest 风格的 LLM 评测框架（Confident AI 出品），50+ 即插即用 metric，与 pytest 工作流无缝
- **Garak**：NVIDIA 出品的 **LLM 漏洞扫描器**（Generative AI Red-teaming & Assessment Kit），「Nessus for LLMs」，扫幻觉 / 数据泄露 / prompt injection / 越狱 / 毒性 / 编码绕过

红队（red teaming）关注的风险：**越狱（jailbreak）**、**prompt injection**（指令注入）、**PII 泄露**、**偏见 / 歧视**、**幻觉**、**毒性**、**SSRF / 工具滥用**。配合 **CI/CD 集成**做回归测试，让 prompt 改动有「门禁」。

## 评价

**优点**

- 把 LLM 应用从「靠直觉改 prompt」变成「有数据支撑的迭代」
- 红队自动化扫漏洞，上线前发现越狱 / 注入 / 泄密
- CI/CD 集成——prompt 改动有门禁，回归可被拦截
- 开源生态成熟：Promptfoo / DeepEval / Garak 都活跃
- 与评测 / 可观测工具（Langfuse / Phoenix）互补——前者写测试，后者盯生产

**缺点**

- LLM 输出非确定性——测试有噪声，需多次跑取平均
- 「正确性」断言难——常需 LLM-as-judge（又贵又有 bias）
- 红队生成的攻击 prompt 可能误报多，需人工筛选
- 工具各自为政（assertion / metric 命名不统一）
- 覆盖率难量化——LLM 行为空间太大，测不完

## 文档地址

- Promptfoo：[promptfoo.dev/docs](https://www.promptfoo.dev/docs/intro/)
- DeepEval：[deepeval.com/docs](https://deepeval.com/docs/evaluation-introduction)
- Garak：[garak.ai](https://garak.ai/) / [docs.nvidia.com/nemo/guardrails/evaluation/llm-vulnerability-scanning](https://docs.nvidia.com/nemo/guardrails/evaluation/llm-vulnerability-scanning)

## GitHub地址

- Promptfoo：[github.com/promptfoo/promptfoo](https://github.com/promptfoo/promptfoo)（MIT）
- DeepEval：[github.com/confident-ai/deepeval](https://github.com/confident-ai/deepeval)（Apache-2.0）
- Garak：[github.com/NVIDIA/garak](https://github.com/NVIDIA/garak)（Apache-2.0）

## 幻灯片地址

<a href="/SlideStack/llm-testing-redteam-slide/" target="_blank">LLM 测试与红队</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=llm-testing-redteam" target="_blank" rel="noopener noreferrer">LLM 测试与红队 测试题</a>
