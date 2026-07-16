---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 EveryInc/compound-engineering-plugin 的 README 与 `CONCEPTS.md` 编写。

## 速查

- **compounding**：结构化工程工作使每单元让下一单元更易，边做边捕获可复用知识——工具越用越聪明
- **Pipeline**：strategy→ideate→brainstorm→plan→work→review→**capture learning** 的技能链，每阶段交耐用工件给下一阶段
- **Learning**（solution doc）：过去问题的文档化解法（bug 修复/约定/工作流模式），复利知识的单元，带元数据供检索
- **Pattern doc**：从多个 Learning 泛化的更广规则，杠杆更高、陈旧时风险更高
- **Explainer**：写给开发者本人的密集视觉教学工件（Learning 教库的未来工作，explainer 教人）
- **Check-in**：explainer 后的主动回忆——预测-揭示（diff）/带批改练习（概念）
- **`/lfg`**：全自动流水线；**headless mode**：无人值守产出报告、模糊处保守推迟
- **beta skill**：`-beta` 后缀平行试新版，手动调用不自动触发

## 复利哲学：反技术债

传统开发**累积**技术债——每个功能加复杂度，每个 bug 修复留下要别人重新发现的本地知识，代码库越来越难 hold，下次更慢。

Compound 把它**倒过来**：每一单元工程使下一单元更易。方式是配比反转——**80% 规划与审查，20% 执行**：

- 用 `/ce-brainstorm` + `/ce-plan` 在写码前彻底规划（一份基于就绪度的计划工件）
- 用 `/ce-code-review` + `/ce-doc-review` 抓问题、校准判断
- 用 `/ce-compound` 把知识编码成可复用
- 保持高质量让未来改动容易

> 重点不是仪式，是**杠杆**：好 brainstorm 让 plan 更锐、好 plan 让执行更小、好 review 抓的是模式不只是 bug、好 compound note 让下个 agent 不用从零重学。

## 知识的三种形态：Learning / Pattern / Explainer

Compound 的记忆系统区分三类知识工件：

| 工件 | 教谁 | 是什么 |
| --- | --- | --- |
| **Learning**（solution doc） | 库的**未来工作** | 过去某问题的解法（bug/约定/工作流），带 category/tags/problem type 元数据供检索；创建日期在条目里不在文件名 |
| **Pattern doc** | 库的未来工作（更广） | 从若干 Learning 泛化的规则，杠杆更高，陈旧时风险也更高（未来工作会当它普适） |
| **Explainer** | 开发者**本人** | 密集视觉教学工件，讲一个概念/一处 diff/一个想法/「我这周做了啥」，让 agent 写作时人也在学 |

`/ce-compound` 产 Learning；`/ce-compound-refresh` 刷新陈旧/漂移的 learning；`/ce-explain` 产 Explainer，可选带 **Check-in**（对 diff 预测-揭示、对概念做批改练习）让知识留住。

> **Concept-teaching section**：`/ce-commit-push-pr` 会在改动引入代码库新概念时，由 agent 判断往 PR 描述里加一段教学——讲清是什么、为何选它、给个 PR 里的例子，让读者不看 diff 也能理解并复述。

## Pipeline：工件流经的链

Pipeline 是把一件工作从战略/构思，经 brainstorm、plan、执行、审查，直到捕获学习的技能链。要点：

- 每阶段把**耐用工件**交给下一阶段（brainstorm 出需求文档 → plan 读它）
- **研究在需要它的阶段收集**，不下游重复收集
- **session-settled decision**：用户在对话里审视并选定的决策，带来源标注（`session-settled:`）沿 pipeline 流转，下游技能增补但不再问、除非有证据才反驳；仅被断言（未经审视）的是 directive，只受一次 in-pipeline 挑战

## `/lfg`：自主流水线

`/lfg`（let's go）是标准循环的自动驾驶版——无人值守跑：plan → work → simplify → 跑代码审查并**应用修复** → 跑浏览器测试 → commit → push → 开 PR → 盯 CI 并修复失败直到变绿。

用法：**先 `/ce-brainstorm` 再 `/lfg`**，让它对着真需求规划而非一句话 prompt。适合你想走开、回来看到一个开好的绿 PR。

**Headless mode** 是相关的显式 opt-in：无人值守跑某技能、无用户提问，产出书面报告作交付，对真正模糊的决策保守推迟而非瞎猜。

## 编排术语（选读）

Compound 的技能编排有一套精细词汇（`CONCEPTS.md`）：

- **Model tier**：分发子代理的语义成本类——extraction（最便宜，检索/引用）/ generation（中层，证据驱动 + 机械验证）/ ceiling（编排者自己的模型）；按 tier 名引用，模型名不硬编码进技能
- **Reviewer persona**：单一视角的审查角色（安全/正确性/范围/设计…），审查技能派一组 persona 作子代理再合并
- **Confidence anchor**：离散自评置信度（每级绑行为判据），用于 gate 和排序审查发现，而非邀请假精确的连续分；persona 间印证可升一级
- **Autofix class**：审查发现按修复安全度分类——静默应用 / 确认后应用 / 留给人 / 仅记录建议
- **Cross-model pass**：把审查/判断 brief 经另一模型路由跑一遍折回综合；只有服务模型族可**验证**（凭 model identity receipt，非请求参数）才算独立印证

## 反模式

| 反模式 | 问题 |
| --- | --- |
| 跳过 compound 直接进下一轮 | 丢掉复利——下个循环没从更聪明处起步 |
| `/lfg` 前不 brainstorm | 对着一句话 prompt 规划，质量差 |
| 把 CONCEPTS.md 当 spec 塞满 | 它是 glossary（术语表），不是 catch-all |
| Pattern doc 不刷新 | 陈旧的 pattern 风险高，未来工作当它普适 |
| 简单一行改动也走 80/20 全流程 | 前期投入不划算，直接改 |

## 下一步

- [参考](./reference) —— 30 个 `/ce-*` 技能全表、跨平台安装矩阵、compound 记忆机制
- 上游：[Every 的 compound engineering 文章](https://every.to/chain-of-thought/compound-engineering-how-every-codes-with-agents)
