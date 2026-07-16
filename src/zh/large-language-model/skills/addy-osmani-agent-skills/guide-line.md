---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 addyosmani/agent-skills 的 README 与 `docs/` 编写。

## 速查

- **技能六段式**：Overview / When to Use / Process / **Rationalizations（借口+反驳）** / Red Flags / **Verification（证据）**
- **四设计**：process not prose / 反合理化 / 验证非可选 / 渐进披露
- **6 阶段 24 技能**：DEFINE(interview-me/idea-refine/spec) · PLAN(planning) · BUILD(incremental/tdd/context-eng/source-driven/**doubt-driven**/frontend/api) · VERIFY(browser-testing/debugging) · REVIEW(code-review/simplify/security/perf) · SHIP(git/ci-cd/deprecation/docs/observability/launch) · Meta(using-agent-skills)
- **Google 工程文化**：Hyrum's Law / Beyoncé Rule / 测试金字塔 80/15/5 / Chesterton's Fence / trunk-based / Shift Left
- **4 persona**：code-reviewer / test-engineer / security-auditor / web-performance-auditor
- 装：`npx skills add addyosmani/agent-skills`（70+ agent）；Addy Osmani MIT

## 为什么要 Agent Skills

> AI 编码 agent 默认走**最短路径**——常意味着跳过 spec、测试、安全审查，跳过让软件可靠的实践。

Agent Skills 给 agent 结构化工作流，强制它带着资深工程师给生产代码的同等纪律。每个技能编码「何时写 spec、测什么、如何审、何时 ship」的硬赚来的工程判断——不是通用 prompt，而是区分「生产质量」与「原型质量」的 opinionated、流程驱动工作流。

## 技能六段式解剖

每个技能遵循一致的结构，其中两段最有特色：

### Rationalizations（反合理化）

每个技能都列一张「借口 + 反驳」表——agent 常用来跳步的合理化（如「我以后再加测试」「这个边界不会发生」），配上文档化的反驳。它堵住 agent 偷懒的路径：当 agent 想跳步时，技能里已经预置了驳斥。

### Verification（证据要求）

每个技能以**证据要求**收尾——测试通过、构建输出、运行时数据。「seems right」永远不够。这把「声称完成」变成「拿证据证明完成」，是它区别于宽松 prompt 的核心。

> 另两段：**Red Flags**（出问题的迹象，供自查）、**Process**（分步工作流，有检查点和退出判据）。技能是**流程不是散文**——agent 跟着走，不是读参考。

## 内嵌 Google 工程文化

技能把 Google 工程实践（《Software Engineering at Google》+ Google eng-practices 指南）直接嵌进步骤：

| 实践 | 出现在 |
| --- | --- |
| **Hyrum's Law** | API 设计（所有可观察行为都会被依赖） |
| **Beyoncé Rule**（"if you liked it put a test on it") | 测试 |
| **测试金字塔** 80/15/5 | test-driven-development |
| **Chesterton's Fence** | code-simplification（不懂为何存在别拆） |
| **trunk-based development** | git-workflow |
| **Shift Left** + feature flags | ci-cd |
| **代码即负债** | deprecation-and-migration（专设一个技能把代码当负债对待） |

> 这些不是抽象原则，是嵌进 agent 遵循的分步工作流里的具体约束。

## Distinctive 技能

几个特别值得一提的：

- **`interview-me`**：一次一个问题的访谈，挖出用户**真正**想要的（而非他以为该要的），直到 ~95% 置信。触发词含「interview me」「grill me」
- **`source-driven-development`**：每个框架决策**扎根官方文档**——验证、引用来源、标注未验证的。要权威、有出处的代码就用它
- **`doubt-driven-development`**：对每个非平凡决策做**对抗性 fresh-context 审查**——CLAIM → EXTRACT → DOUBT → RECONCILE → STOP，可选用户授权的跨模型升级。高风险（生产/安全/不可逆）、陌生代码、或「现在验证比以后调试便宜」时用
- **`context-engineering`**：在对的时间喂 agent 对的信息——规则文件、上下文打包、MCP 集成
- **`using-agent-skills`**（meta）：把来的活映射到对的技能，定义共享操作规则

## `/build auto`：自主但不放弃验证

`/build auto` 在 spec 存在后生成计划并在一次批准的 pass 里实现每个任务。关键：它移除的是「任务**之间**的人工介入」，**不是验证**——每个任务仍 test-driven、逐个 commit，遇失败或风险步骤会暂停。这是「自主 ≠ 无纪律」的体现。

## 4 个专家 persona

预配的专家审查视角，可作定向审查：

| Persona | 角色 | 视角 |
| --- | --- | --- |
| code-reviewer | 资深 Staff 工程师 | 五轴审查，「staff 工程师会批准吗」标准 |
| test-engineer | QA 专家 | 测试策略、覆盖分析、Prove-It 模式 |
| security-auditor | 安全工程师 | 漏洞检测、威胁建模、OWASP |
| web-performance-auditor | Web 性能工程师 | Core Web Vitals 审计，`/webperf` 触发 |

> 编排规则：**persona 不调用 persona**（`orchestration-patterns.md`）。

## 反模式

| 反模式 | 问题 |
| --- | --- |
| 跳过技能的 Verification 段 | 「seems right」不是证据，违背核心设计 |
| 被 agent 的合理化说服跳步 | 技能的 Rationalizations 段就是来堵它的 |
| 把技能当参考文档读而不执行 | 技能是流程，要跟着步骤走 |
| 让 persona 互相调用 | 明确禁止，会乱套 |
| 简单一行改动也拉满 24 技能 | 按 When to Use 判断，不是每个技能都要上 |

## 下一步

- [参考](./reference) —— 24 技能全表（按阶段）、8 命令、4 persona、7 参考清单、跨工具安装
- 上游：[skill-anatomy](https://github.com/addyosmani/agent-skills/blob/main/docs/skill-anatomy.md) · [三者对比](https://github.com/addyosmani/agent-skills/blob/main/docs/comparison.md)
