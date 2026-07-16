---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 garrytan/gstack v1.60.1.0（提交 `a325940`，2026-07-14）的 README 与 docs 编写。

## 速查

- **装**：`git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup`
- **依赖**：Claude Code、Git、Bun v1.0+、（Windows 还需 Node.js）
- **冲刺流程**：Think → Plan → Build → Review → Test → Ship → Reflect，技能链式衔接
- **快速上手四步**：`/office-hours`（追问产品）→ `/plan-ceo-review`（重构问题）→ `/review`（抓 bug）→ `/qa <url>`（真浏览器测）
- **团队模式**：`./setup --team` + `gstack-team-init required`——整仓库自动获得 gstack、限流静默自更新
- **命令前缀**：默认 `/qa`（`--no-prefix`）；想命名空间用 `--prefix` 变 `/gstack-qa`
- **多 agent**：`./setup --host codex|opencode|cursor|factory|…`（支持 10 家）
- **升级**：`/gstack-upgrade`；卸载：`~/.claude/skills/gstack/bin/gstack-uninstall`

## 30 秒安装

在 Claude Code 里粘贴安装命令，Claude 会替你跑：

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git \
  ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup
```

**依赖**：[Claude Code](https://docs.anthropic.com/en/docs/claude-code)、[Git](https://git-scm.com/)、[Bun](https://bun.sh/) v1.0+、[Node.js](https://nodejs.org/)（仅 Windows）。

装完在项目的 `CLAUDE.md` 里加一个 gstack 段（列出可用技能、约定用 `/browse` 做网页浏览），Claude 才能稳定看到这些命令。

::: tip 命令前缀
默认技能名是短的（`/qa`、`/review`）。若你同时用别的技能包怕撞名，`./setup --prefix` 切成 `/gstack-qa`；反悔用 `./setup --no-prefix`。选择会被记住。
:::

## 快速上手：一条冲刺跑到底

```
You:  /office-hours 我想做一个日历日报应用
Claude: [追问痛点——要具体例子而非假设]
        [把「日报应用」重新定义为「个人 AI 幕僚长」]
        [写设计文档 → 自动喂给下游技能]

You:  /plan-ceo-review        # 重构问题，找藏在需求里的「10 星产品」
You:  /plan-eng-review        # 锁架构、数据流、测试矩阵、失败模式
You:  Approve plan. Exit plan mode.
        [写 2400 行 / 11 文件 / ~8 分钟]

You:  /review                 # 抓过 CI 但会炸生产的 bug，自动修明显的
You:  /qa https://staging...  # 真浏览器点击流程，发现并修 bug
You:  /ship                   # 同步 main、跑测试、审覆盖率、发 PR
```

> 你说「日报应用」，agent 说「你在建幕僚长 AI」——因为它听的是你的**痛点**，不是你的功能需求。八条命令端到端，这不是 copilot，是一支团队。

## 冲刺流程：技能链式衔接

gstack 是**一套流程**，不是一堆工具。技能按冲刺的顺序跑，每个喂给下一个：

**Think → Plan → Build → Review → Test → Ship → Reflect**

- `/office-hours` 写的设计文档 → `/plan-ceo-review` 读
- `/plan-eng-review` 写的测试计划 → `/qa` 接手
- `/review` 抓的 bug → `/ship` 核实已修

> 没有东西掉链子，因为每一步都知道前一步做了什么。

## 团队模式（共享仓库推荐）

从仓库内粘贴，切团队模式、让 teammate 自动获得 gstack：

```bash
(cd ~/.claude/skills/gstack && ./setup --team) && \
  ~/.claude/skills/gstack/bin/gstack-team-init required && \
  git add .claude/ CLAUDE.md && git commit -m "require gstack for AI-assisted work"
```

不 vendored 文件进仓库、不版本漂移、不手动升级。每个 Claude Code 会话启动时做一次快速自更新检查（限流每小时一次、断网安全、完全静默）。想「提醒而非强制」把 `required` 换成 `optional`。

## 多 agent 安装

gstack 支持 10 家 agent，`./setup` 自动探测；也可 `--host` 指定：

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/gstack
cd ~/gstack && ./setup --host codex   # 或 opencode / cursor / factory / slate / kiro / hermes / gbrain
```

## 下一步

- [指南](./guide-line) —— 七阶段冲刺、23 角色按阶段拆解、安全护栏、ETHOS 哲学、LOC 争议辨析
- [参考](./reference) —— 全命令表、power tools、团队模式、GBrain、并行冲刺、卸载
