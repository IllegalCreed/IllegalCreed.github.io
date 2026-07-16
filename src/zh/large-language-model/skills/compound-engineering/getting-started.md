---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 EveryInc/compound-engineering-plugin 主分支（提交 `e745e96`，2026-07-16）编写。

## 速查

- **装（Claude Code）**：`/plugin marketplace add EveryInc/compound-engineering-plugin` + `/plugin install compound-engineering`
- **核心 6 步循环**：`/ce-brainstorm` → `/ce-plan` → `/ce-work` → `/ce-simplify-code` → `/ce-code-review` → `/ce-compound`（再回头，带更好的上下文）
- **哲学**：每单元工程使下一单元更易；**80% 规划审查 / 20% 执行**
- **复利关键**：`/ce-compound` 把解决的问题写进 `docs/solutions/`，下轮 brainstorm/plan 读它做 grounding
- **全自动**：`/ce-brainstorm` 后跑 `/lfg` —— plan→work→simplify→审查+修→浏览器测→commit→push→PR→盯 CI 修绿
- **没想法时**：先 `/ce-ideate` 生成并排名候选，再进循环
- **初次**：装后在项目里跑 `/ce-setup` 检查配置
- **不需要 Bun** 来安装（Bun 仅用于仓库开发）

## 安装

Claude Code 一键装（也支持 Cursor / Codex / Kimi / Cline / Grok / Devin / Copilot / Factory / Qwen / OpenCode / Pi / Antigravity）：

```text
/plugin marketplace add EveryInc/compound-engineering-plugin
/plugin install compound-engineering
```

装完在任意项目里跑一次 `/ce-setup`——它检查 repo 本地配置、报告可选工具能力、帮你把机器本地的 CE 设置安全地 gitignore 掉。

::: warning 已装过旧版？
Compound Engineering 改成了 root-native 布局。更新前**必须先刷新 marketplace**：`/plugin marketplace update compound-engineering-plugin` 然后 `/plugin update compound-engineering`——只跑 update 会停在旧版本。
:::

## 核心循环：6 步复利

Compound 的核心是六步，跑完一圈再带着更好的上下文跑下一圈：

| 步 | 技能 | 做什么 |
| --- | --- | --- |
| 1 | `/ce-brainstorm` | 交互问答想清需求，产出「只含需求」的统一计划文档 |
| 2 | `/ce-plan` | 把需求/想法充实成「可实施」的计划 |
| 3 | `/ce-work` | 用 worktree + 任务追踪执行可实施计划 |
| 4 | `/ce-simplify-code` | 审查前先精简刚写的代码（清晰 + 复用） |
| 5 | `/ce-code-review` | 合并前多 agent 对照计划审查 |
| 6 | `/ce-compound` | 把学到的写进 `docs/solutions/`，下轮从更聪明处起步 |

> **那根返回箭头才是全部意义**：`/ce-compound` 写的 learnings 被下一次 `/ce-brainstorm` 和 `/ce-plan` 当 grounding 读——brainstorm 让 plan 更锐，plan 反哺未来 plan，review 抓到更多，pattern 被记录。

## 标准功能循环

把一个粗想法变成上线、审查过的代码：

```text
/ce-brainstorm make background job retries safer
/ce-plan
/ce-work
/ce-simplify-code
/ce-code-review
/ce-compound
```

## 全自动：`/lfg`

想放手，回来看到开好的绿 PR？`/ce-brainstorm` 之后跑 `/lfg`：

```text
/ce-brainstorm describe the feature
/lfg
```

`/lfg` 无人值守跑完整循环——plan、work、simplify、跑代码审查并应用修复、跑浏览器测试、commit、push、开 PR，然后盯着 CI 修复失败直到变绿。它是标准循环的自动驾驶版。**先 `/ce-brainstorm` 再 `/lfg`**，让它对着真需求规划而非一句话 prompt。

## 还没想法？先 ideate

```text
/ce-ideate new drawing tools
/ce-ideate github issues   # 用你的 open issues 而非 prompt 来 ground
```

`/ce-ideate` 先做功课（代码库、过去 learnings、网上先例、可选你的 issue tracker），再给你一组排好名的、有依据的候选，带进 `/ce-brainstorm`。

## 为什么这样能复利

> 传统开发累积技术债：每个功能加复杂度，每个 bug 修复留下一点本地知识要别人以后重新发现。代码库越来越大，上下文越来越难 hold，下次改动越来越慢。
>
> Compound 把它倒过来——好的 brainstorm 让 plan 更锐、好的 plan 让执行更小、好的 review 抓到的是模式不只是 bug、好的 compound note 让下个 agent 不用从零重学同一课。

## 下一步

- [指南](./guide-line) —— 复利哲学、Learning/Pattern/Explainer、编排术语、`/lfg` 内幕
- [参考](./reference) —— 30 个技能全表、跨平台安装、compound 记忆机制
