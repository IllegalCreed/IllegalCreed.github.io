---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 open-gsd/gsd-core v1.7.0 的 README、docs 与 `commands/`、`agents/` 编写。

## 速查

- **context rot**：上下文窗口填满后累积的质量退化——GSD Core 的头号敌人
- **五步循环**：Discuss（定决策）→ Plan（研究分解 + 验证装得下 fresh context）→ Execute（并行波次，各起干净 200k）→ Verify（走查 + 修）→ Ship（PR + 归档）
- **fresh-context 子代理**：重活隔离进全新上下文，主会话保持精简
- **跨会话工件**：STATE.md（状态）/ CONTEXT.md（上下文）挺过会话边界
- **34 个 gsd-* 子代理**：分工研究/规划/执行/验证/审查/文档/记忆
- **禁手拷** agents/commands，必须 installer；`npx @opengsd/gsd-core@latest`

## context rot：为什么会话一长就变差

多数 AI 编码在规模上失败于三点：

1. **上下文膨胀悄悄拉低质量**——窗口越满，模型越容易漏、越容易错（context rot）
2. **会话之间没有共享记忆**——换个会话就从零开始
3. **没有东西验证代码真能跑**——「看起来对」就宣布完成

GSD Core 对症三招：重活跑 fresh 子代理、结构化工件跨会话存活、Verify 步实走查。

## 五步阶段循环深入

### Discuss — 先定决策

在任何东西被规划前，捕获实现决策。避免规划时才发现关键取舍没定，导致返工。

### Plan — 研究、分解、验证「装得下」

研究、把工作分解，并**验证计划装得下一个全新的上下文窗口**。这是 GSD Core 最独特的一步：如果计划太大装不进 fresh context，就得再拆——保证下游 Execute 的子代理都在充裕上下文里干活，不半途 context rot。

### Execute — 并行波次，各起干净上下文

计划分成并行波次跑，**每个 executor 从干净的 200k token 上下文起步**。主会话不被执行细节塞满，多个 executor 可并行推进。

### Verify — 走查已建的东西

不是「应该没问题」——Verify 实际走查已建的东西、诊断问题、生成修复计划，然后才宣布 phase 完成。这是「验证内建」而非事后想起。

### Ship — PR、归档、下一个

建 PR、归档该 phase，进入下一个 milestone 的循环。

## 跨会话记忆：STATE.md / CONTEXT.md + mempalace

GSD Core 的记忆分两层：

- **结构化工件**：`STATE.md`（当前状态）、`CONTEXT.md`（项目上下文）挺过会话边界，中断后 `/gsd-next` 能接续
- **记忆宫殿（mempalace）**：`/gsd-mempalace-capture` / `/gsd-mempalace-recall` + `gsd-mempalace-curator` 子代理，跨 milestone 沉淀与召回；`/gsd-extract-learnings` 抽取学习

这让「换个会话就从零」的问题被结构化记忆解决。

## 为什么禁止手拷 agents/commands

installer 是**跨运行时兼容所必需**的：不同运行时（Claude Code / OpenCode / Codex / Cursor…）对 agents、commands 的路径与格式约定不同，installer 会据目标运行时生成正确的适配。直接从 `agents/` 或 `commands/` 拷文件会绕过这层适配、导致技能坏掉。这是 README 明确的红线——`npx @opengsd/gsd-core@latest` 是唯一正确安装路径。

## 34 个子代理的分工

GSD Core 用 34 个 gsd-* 子代理把重活隔离进 fresh context，按职责分：

| 类别 | 子代理（示例） |
| --- | --- |
| 研究 | phase/project/domain/advisor/ai-researcher、research-synthesizer |
| 规划 | planner、plan-checker、roadmapper、framework-selector、assumptions-analyzer |
| 执行 | executor、code-fixer、integration-checker |
| 验证 | verifier、code-reviewer、security-auditor、nyquist-auditor、eval-auditor/planner |
| UI | ui-researcher/auditor/checker、user-profiler |
| 文档/记忆 | doc-writer/classifier/synthesizer/verifier、mempalace-curator、pattern-mapper |

> 每个子代理在自己的干净上下文里干一件事、返回结果——这正是「重活跑 fresh 子代理」的落地。

## 治理沿革（中立呈现）

「GSD」（Get Shit Done）原版由 TÂCHES（Lex Christopherson）创建。因项目所有权与信任方面的争议，GSD 转由 **open-gsd** 社区治理继续开发，原作者不再参与。本页的 **GSD Core** = open-gsd 这一支（npm `@opengsd/gsd-core`）。呈现这段沿革不带立场，只为选型时**不与原版或其它分叉混淆**——这是「唯一正确官方源」核验的一环。

## 反模式

| 反模式 | 问题 |
| --- | --- |
| 直接拷 agents/commands 文件 | 绕过跨运行时适配，技能坏掉 |
| 跳过 Verify 直接 Ship | 「看起来对」不是验证，context rot 的产物易漏 bug |
| Plan 不验证「装得下 fresh context」 | Execute 子代理半途 context rot，质量下滑 |
| 一次塞太多 phase | 违背「逐 phase」，主会话被塞爆 |
| 与原版 GSD/其它分叉混用 | 版本/命令不一致，先认准 open-gsd |

## 下一步

- [参考](./reference) —— 命令全表、34 子代理、跨运行时安装、配置与工件
- 上游：[Context engineering 文档](https://github.com/open-gsd/gsd-core/blob/main/docs/explanation/context-engineering.md)
