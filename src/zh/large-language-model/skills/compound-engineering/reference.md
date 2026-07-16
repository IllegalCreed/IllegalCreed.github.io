---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 EveryInc/compound-engineering-plugin README 与 `docs/skills/` 编写。当前 30 个技能、0 个独立 agent（专家行为内嵌技能本地 prompt 资产）。

## 速查

- **核心循环**：`/ce-brainstorm` `/ce-plan` `/ce-work` `/ce-simplify-code` `/ce-code-review` `/ce-compound`
- **全自动**：`/lfg`；**初始化**：`/ce-setup`（每项目一次）
- **装（Claude Code）**：`/plugin marketplace add EveryInc/compound-engineering-plugin` + `/plugin install compound-engineering`
- **升级**：先 `/plugin marketplace update compound-engineering-plugin` 再 `/plugin update`
- **learnings** 落 `docs/solutions/`；STRATEGY.md（战略）；pulse 报告落 `docs/pulse-reports/`
- **不需要 Bun** 安装（Bun 仅仓库开发/converter 维护）

## 核心循环技能

| 技能 | 用途 |
| --- | --- |
| `/ce-brainstorm` | 交互问答想清需求，写「只含需求」的统一计划 |
| `/ce-plan` | 把需求/想法充实成可实施计划 |
| `/ce-work` | 用 worktree + 任务追踪执行 |
| `/ce-simplify-code` | 审查前精简刚写的代码 |
| `/ce-code-review` | 合并前多 agent 对照计划审查 |
| `/ce-compound` | 把解决的问题写进 `docs/solutions/` 复利团队知识 |

## 循环外围技能

| 技能 | 何时用 |
| --- | --- |
| `/ce-ideate` | 循环前——还没想法时，生成并批判性排名有依据的候选 |
| `/ce-strategy` | 上游锚——建/维护 `STRATEGY.md`，被 ideate/brainstorm/plan 读作 grounding |
| `/ce-product-pulse` | 外循环——时间窗内用户实际体验报告（用量/性能/错误），follow-up 回流 ideation |
| `/ce-debug` | 输入是 bug 而非功能时——复现、追根因、修、再 polish/review |
| `/ce-pov` | 提交前——对采纳/文档/方法集给出决断性、项目扎根的立场，可选 peer/oracle 交叉核 |
| `/ce-explain` | 保持学习——把概念/diff/想法/「这周做了啥」变成写给你的密集 explainer + check-in |
| `/ce-compound-refresh` | 刷新陈旧/漂移的 learnings |

## 其余技能（全 30 个）

| 技能 | 用途 |
| --- | --- |
| `/ce-optimize` | 迭代优化循环 |
| `/ce-riffrec-feedback-analysis` | Riffrec 录音/笔记转结构化反馈 |
| `/ce-sweep` | 扫反馈源、追条目生命周期、产 `/lfg`-ready 计划 |
| `/ce-resolve-pr-feedback` | 解决 PR 审查反馈 |
| `/ce-commit` | 建带清晰信息的 git commit |
| `/ce-commit-push-pr` | commit + push + 开 PR（并教改动引入的新概念） |
| `/ce-babysit-pr` | 盯开着的 PR，随审查评论/CI 推进到合并 |
| `/ce-worktree` | 确保工作在隔离 git worktree |
| `/ce-promote` | 起草面向用户的公告文案 |
| `/ce-test-browser` | 对 PR 受影响页跑浏览器测试 |
| `/ce-test-xcode` | 在模拟器构建测试 iOS 应用 |
| `/ce-polish` | 起 dev server 迭代 UX polish |
| `/ce-proof` | 建/编辑/分享 Proof 文档 |
| `/ce-dogfood` | 无人值守、diff-scoped 浏览器 QA + 自主修复 |
| `/ce-doc-review` | 审查需求与计划文档 |
| `/ce-setup` | 诊断可选工具能力与项目配置 |
| `/lfg` | 全自主工程流水线 |

## compound 记忆机制

`/ce-compound` 产出的 **Learning**（solution doc）：

- 落 `docs/solutions/`，是过去某问题的文档化解法（bug 修复/约定/工作流模式）
- 带结构化元数据（category、tags、problem type）供检索；创建日期在条目内，不在文件名
- 下轮 `/ce-brainstorm`/`/ce-plan` 读它作 grounding —— 复利的返回箭头

**Pattern doc**：从若干 Learning 泛化的更广规则（`/ce-compound-refresh` 维护）。
**Explainer**：`/ce-explain` 产，写给开发者本人，可带 check-in。

## 跨平台安装

| 平台 | 命令 |
| --- | --- |
| Claude Code | `/plugin marketplace add EveryInc/compound-engineering-plugin` + `/plugin install compound-engineering` |
| Cursor | `/add-plugin compound-engineering`（或市场搜） |
| Codex CLI | `codex plugin marketplace add …` + `codex plugin add compound-engineering@compound-engineering-plugin` |
| Kimi Code | `/plugins install https://github.com/EveryInc/compound-engineering-plugin` |
| Grok / Devin / Qwen | `grok plugin install …` / `devin plugins install …` / `qwen extensions install …` |
| OpenCode | 加进 `opencode.json` 的 `plugin` 数组 |
| Pi | `pi install git:github.com/EveryInc/compound-engineering-plugin`（+ `pi-subagents`） |
| Antigravity（`agy`）| `agy plugin install https://github.com/EveryInc/compound-engineering-plugin` |

> Copilot、Factory Droid、Cline 亦支持——多数直接读 Claude 兼容 manifest，无需 Bun 安装步骤。

## 资源链接

- 仓库：[EveryInc/compound-engineering-plugin](https://github.com/EveryInc/compound-engineering-plugin)
- 技能目录：[docs/skills](https://github.com/EveryInc/compound-engineering-plugin/tree/main/docs/skills)
- Every 文章：[compound engineering](https://every.to/chain-of-thought/compound-engineering-how-every-codes-with-agents) · [背后的故事](https://every.to/source-code/my-ai-had-already-fixed-the-code-before-i-saw-it)
- 相关叶：[gstack](../gstack/)（同为角色/流程化系统）
