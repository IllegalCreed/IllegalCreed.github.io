---
layout: doc
---

# AI 测试用例生成

AI 测试用例生成指用强化学习、进化算法或大语言模型自动产出单元 / 集成测试，提升覆盖率并减少手写负担。代表工具分三大技术流派：**强化学习派**——**Diffblue Cover** 用 RL 智能体实际执行代码、学习其行为，自动产出 Java JUnit 测试（含正确断言），有免费 Community（IntelliJ 插件）与付费 Enterprise 版，与「瞎猜」式工具的关键区别是它会真正跑代码验证断言；**进化/搜索算法派**——**EvoSuite** 用遗传算法迭代优化测试用例最大化覆盖率（搜索式软件测试），是学术经典、Java 生态；**LLM 派**——用大模型凭提示词工程生成测试，代表是 **GitHub Copilot / Cursor / Claude** 在 IDE 里「为这个函数生成测试」，灵活、跨语言、但易产生「看似对实则无断言或断言错误」的幻觉测试。**Qodo Cover**（原 CodiumAI Cover）曾是流行的 agentic 测试生成工具（CLI / GitHub CI 跑、用项目已有测试 runner 与 coverage parser），但**仓库已标注「不再维护」，2025-06 起停维护，本叶仅作学习样本**。选型经验：Java 重资产项目追求可靠断言 → Diffblue Cover；学术研究 / 纯覆盖率 → EvoSuite；快速、跨语言、人能复核 → Copilot/Cursor/Claude 的 LLM 生成 + 提示词工程。核心共识：**AI 生成的测试必须人工复核断言，不能只看覆盖率**。

> 注意：**Qodo Cover 自 2025-06 起停维护**，下文涉及题目均标注「停维护，仅作学习样本」。本叶以 Diffblue Cover、EvoSuite、LLM-based 生成为主线。

## 评价

**优点**

- **显著提升覆盖率**：对历史代码（legacy code）快速补齐单测，把覆盖率从个位数拉到 60-80%+，降低回归风险
- **减少手写样板**：getter/setter、边界值、异常路径等机械测试由 AI 生成，开发者专注业务逻辑
- **强化学习派断言可靠**：Diffblue Cover 真正执行代码学行为，断言基于实际输出而非猜测，测试有意义
- **LLM 派跨语言灵活**：Copilot/Cursor/Claude 不限语言与框架，一段提示词即可生成 Jest/Pytest/JUnit 测试
- **与 CI 集成提效**：工具多支持 CLI / GitHub Actions 跑，PR 时自动为新代码补测试
- **降低读 legacy 门槛**：生成测试的过程也反向揭示了代码实际行为，辅助理解陌生代码

**缺点**

- **LLM 派幻觉断言**：常生成「断言恒真」「硬编码期望值」「测错行为」的测试，覆盖率虚高但不真正验证，必须人工复核
- **Diffblue 仅限 Java**：强化学习方案目前主要服务 Java/JUnit，其他语言生态无对等产品
- **EvoSuite 维护滞后**：学术出身，对新版本 Java / 框架兼容性跟进慢，偶发编译失败
- **覆盖率 ≠ 验证质量**：只衡量代码被触达，不衡量断言是否针对真实行为，盲信覆盖率数字是陷阱
- **复杂业务逻辑难自动测**：涉及多系统协作、时序、外部依赖的逻辑，AI 难生成有效测试，仍需人工设计
- **Qodo Cover 已停维护**：作为曾经的 agentic 代表已无人维护，新项目不应再采用，仅作学习样本

## 文档地址

- [Diffblue Cover Documentation](https://docs.diffblue.com/)
- [EvoSuite Documentation](https://www.evosuite.org/docs/)
- [Qodo Cover (archived, unmaintained)](https://github.com/Codium-ai/cover-ai)
- [GitHub Copilot 生成测试](https://docs.github.com/en/copilot)

## GitHub 地址

- [Diffblue 团队/产品页](https://www.diffblue.com/)（Cover 商业产品，Community 插件在 JetBrains 商店）
- [EvoSuite](https://github.com/EvoSuite/evosuite)
- [Codium-ai/cover-ai](https://github.com/Codium-ai/cover-ai)（Qodo Cover，已停维护）

## 幻灯片地址

<a href="/SlideStack/ai-test-generation-slide/" target="_blank">AI 测试用例生成</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=AI%20%E6%B5%8B%E8%AF%95%E7%94%A8%E4%BE%8B%E7%94%9F%E6%88%90" target="_blank" rel="noopener noreferrer">AI 测试用例生成 测试题</a>
