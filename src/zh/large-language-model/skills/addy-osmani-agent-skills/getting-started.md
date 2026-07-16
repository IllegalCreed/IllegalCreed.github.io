---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 addyosmani/agent-skills 主分支（提交 `c1974de`，2026-07-16）的 README 与 docs 编写。

## 速查

- **装（任意 agent）**：`npx skills add addyosmani/agent-skills`（70+ agent）；`--list` 先浏览、`--skill <name>` 单装
- **装（Claude Code 插件）**：`/plugin marketplace add addyosmani/agent-skills` + `/plugin install agent-skills@addy-agent-skills`
- **8 命令映射生命周期**：`/spec`（定义）`/plan`（规划）`/build`（构建）`/test`（验证）`/review`（审查）`/webperf` `/code-simplify` `/ship`
- **24 技能**（23 生命周期 + `using-agent-skills` meta），也可直接引用任一技能
- **技能会自动激活**：设计 API 触发 `api-and-interface-design`，建 UI 触发 `frontend-ui-engineering`
- **`/build auto`**：批准计划一次，自主实现每个任务（仍逐个 test-driven + commit，失败/风险处暂停）
- **每技能六段式**：Overview / When to Use / Process / Rationalizations / Red Flags / Verification

## 安装

最快路径——任意 agent 一条命令（开放 skills CLI 装进 70+ agent）：

```bash
npx skills add addyosmani/agent-skills            # 装全部 24 技能
npx skills add addyosmani/agent-skills --list     # 装前先浏览
npx skills add addyosmani/agent-skills --skill code-review-and-quality   # 单装某技能
```

Claude Code 原生插件（推荐）：

```text
/plugin marketplace add addyosmani/agent-skills
/plugin install agent-skills@addy-agent-skills
```

::: tip SSH 报错？
marketplace 默认用 SSH clone。没配 SSH key 时用完整 HTTPS URL 强制 HTTPS：`/plugin marketplace add https://github.com/addyosmani/agent-skills.git`；或一次性配 `git config --global url."https://github.com/".insteadOf git@github.com:`。
:::

也支持 Cursor / Antigravity / Gemini CLI / Windsurf / OpenCode / Copilot / Kiro / Codex——见各自 docs。

## 8 命令映射开发生命周期

```text
 DEFINE     PLAN      BUILD     VERIFY    REVIEW     SHIP
  /spec  →  /plan  →  /build  →  /test  →  /review →  /ship
```

| 你在做什么 | 命令 | 关键原则 |
| --- | --- | --- |
| 定义要建什么 | `/spec` | Spec 先于代码 |
| 规划怎么建 | `/plan` | 小而原子的任务 |
| 增量构建 | `/build` | 一次一片 |
| 证明它能跑 | `/test` | 测试即证据 |
| 合并前审查 | `/review` | 改善代码健康 |
| 审计 Web 性能 | `/webperf` | 先测量再优化 |
| 精简代码 | `/code-simplify` | 清晰胜过聪明 |
| 上线 | `/ship` | 更快即更安全 |

> 技能也会**自动激活**：设计 API 触发 `api-and-interface-design`，建 UI 触发 `frontend-ui-engineering`，无需手动。

## `/build auto`：少些手动步骤

spec 存在后，想少些手动步骤：

```text
/build auto
```

它生成计划并在**一次批准的 pass** 里实现每个任务——你批准计划一次，然后它自主跑。它移除的是「任务**之间**的人工介入」，不是验证：每个任务仍是 test-driven、逐个 commit，遇失败或风险步骤会暂停。

## 每个技能长什么样（六段式）

```text
SKILL.md
├─ Frontmatter: name / description（Use when…）
├─ Overview         → 这技能做什么
├─ When to Use      → 触发条件
├─ Process          → 分步工作流
├─ Rationalizations → 借口 + 反驳（反合理化）
├─ Red Flags        → 出问题的迹象
└─ Verification     → 证据要求
```

四个关键设计选择：

- **process not prose**——技能是工作流（步骤/检查点/退出判据），不是拿来读的文档
- **反合理化**——每技能列 agent 常用的跳步借口（「测试以后再补」）+ 反驳
- **验证非可选**——每技能以证据收尾（测试通过、构建输出、运行时数据），「seems right」永远不够
- **渐进披露**——SKILL.md 是入口，支撑参考按需加载

## 下一步

- [指南](./guide-line) —— 六段式解剖、反合理化、证据要求、Google 工程实践、distinctive 技能
- [参考](./reference) —— 24 技能全表、8 命令、4 persona、7 清单、跨工具安装
