---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 open-gsd/gsd-core v1.7.0 的 `docs/COMMANDS.md`、`commands/`、`agents/` 编写。

## 速查

- **装**：`npx @opengsd/gsd-core@latest`（**禁手拷 agents/commands**）
- **起步**：`/gsd-new-project`（绿地）、`/gsd-onboard`、`/gsd-map-codebase`
- **阶段**：`/gsd-discuss-phase` → plan → `/gsd-execute-phase` → verify → ship（逐 phase）
- **里程碑**：`/gsd-new-milestone`、`/gsd-complete-milestone`、`/gsd-milestone-summary`、`/gsd-next`
- **自主**：`/gsd-autonomous`、`/gsd-fast`
- **记忆**：`/gsd-mempalace-capture`/`recall`、`/gsd-extract-learnings`、`/gsd-capture`
- **工件**：STATE.md、CONTEXT.md；npm `@opengsd/gsd-core`，v1.7.0，MIT

## 命令（节选）

| 命令 | 用途 |
| --- | --- |
| `/gsd-new-project` | 绿地新项目 |
| `/gsd-onboard` | 给已有代码库上手 |
| `/gsd-map-codebase` | 映射代码库结构 |
| `/gsd-explore` | 探索 |
| `/gsd-ideate` | 构思 |
| `/gsd-discuss-phase` | Discuss 步：捕获实现决策 |
| `/gsd-execute-phase` | Execute 步：并行波次执行 |
| `/gsd-code-review` | 代码审查 |
| `/gsd-debug` | 调试 |
| `/gsd-add-tests` | 补测试 |
| `/gsd-audit-milestone` / `-uat` / `-fix` | 里程碑/UAT 审计与修复 |
| `/gsd-new-milestone` / `-complete-milestone` / `-milestone-summary` | 里程碑管理 |
| `/gsd-next` | 接续下一步（读 STATE 恢复） |
| `/gsd-autonomous` / `/gsd-fast` | 自主 / 快速模式 |
| `/gsd-extract-learnings` | 抽取学习 |
| `/gsd-mempalace-capture` / `-recall` | 记忆宫殿：沉淀 / 召回 |
| `/gsd-health` / `/gsd-config` / `/gsd-help` | 健康检查 / 配置 / 帮助 |
| `/gsd-map` `/gsd-graphify` `/gsd-forensics` | 映射 / 图化 / 取证 |

> 完整命令见官方 `docs/COMMANDS.md`。

## 34 个子代理（按职责）

| 职责 | 子代理 |
| --- | --- |
| 研究 | phase-researcher、project-researcher、domain-researcher、advisor-researcher、ai-researcher、research-synthesizer、intel-updater |
| 规划 | planner、plan-checker、roadmapper、framework-selector、assumptions-analyzer、pattern-mapper |
| 执行 | executor、code-fixer、integration-checker |
| 验证 | verifier、code-reviewer、security-auditor、nyquist-auditor、eval-auditor、eval-planner |
| UI | ui-researcher、ui-auditor、ui-checker、user-profiler |
| 文档 | doc-writer、doc-classifier、doc-synthesizer、doc-verifier |
| 调试/记忆 | debugger、debug-session-manager、codebase-mapper、mempalace-curator |

## 五步阶段循环（速记）

| 步 | 关键动作 |
| --- | --- |
| Discuss | 规划前捕获实现决策 |
| Plan | 研究、分解、**验证计划装得下一个 fresh context** |
| Execute | 并行波次，每 executor 起于干净 200k |
| Verify | 走查已建的东西、诊断、修，才宣布完成 |
| Ship | 建 PR、归档 phase、下一个 |

## 跨会话工件

| 工件 | 作用 |
| --- | --- |
| `STATE.md` | 当前状态，`/gsd-next` 读它恢复 |
| `CONTEXT.md` | 项目上下文，跨会话存活 |
| 记忆宫殿（mempalace） | `/gsd-mempalace-capture`/`recall` 跨 milestone 沉淀召回 |

## 跨运行时安装

`npx @opengsd/gsd-core@latest` 向导支持：Claude Code、OpenCode、Antigravity CLI、Kimi CLI、Kilo、Codex、Copilot、Cursor、Windsurf 等。**installer 必需**——为每个运行时生成正确的路径与格式适配，**禁止直接拷 `agents/`、`commands/`**。没 Node.js/别的运行时见官方「Install on your runtime」。

## 资源链接

- 仓库：[open-gsd/gsd-core](https://github.com/open-gsd/gsd-core)
- npm：[@opengsd/gsd-core](https://www.npmjs.com/package/@opengsd/gsd-core)
- 文档：[docs/README.md](https://github.com/open-gsd/gsd-core/blob/main/docs/README.md) · [phase loop](https://github.com/open-gsd/gsd-core/blob/main/docs/explanation/the-phase-loop.md)
- 中文 README：[README.zh-CN.md](https://github.com/open-gsd/gsd-core/blob/main/README.zh-CN.md)
- 相关叶：[gstack](../gstack/) · [Compound Engineering](../compound-engineering/)
