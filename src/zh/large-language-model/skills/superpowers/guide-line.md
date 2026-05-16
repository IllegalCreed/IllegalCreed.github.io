---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 obra/superpowers 主分支编写

## 速查

- 装：`/plugin install superpowers@claude-plugins-official`
- 看 skill 列表：`/skills`
- 手动触发：`/superpowers:<skill-name>` 或对话中点名
- 跳过自动流程：明确说「**不需要 brainstorming，直接做**」
- 跨平台一致：同一 skill 在 Claude Code / Codex / Gemini CLI 行为相同
- 自定义 skill：`~/.claude/skills/<name>/SKILL.md`（无 `superpowers:` 前缀）
- 项目级 skill：`<project>/.claude/skills/<name>/SKILL.md`

## 整体哲学

Superpowers 把软件工程最佳实践抽象成「**Mandatory Workflows**」：

| 痛点 | 对应 skill |
| --- | --- |
| 凭直觉直接动手 | `brainstorming` 先反问 |
| 跳过计划 | `writing-plans` 写实施计划 |
| 写代码前不思考测试 | `test-driven-development` |
| 调试瞎猜 | `systematic-debugging` 4 阶段 |
| 「应该没问题」就 PR | `verification-before-completion` |
| 大任务挤主线程 | `subagent-driven-development` |
| 多任务串行做完 | `dispatching-parallel-agents` |
| 改动污染主分支 | `using-git-worktrees` |

整体效果：Agent 行为更**可预测、可审查**，但也**更慢**——简单任务也走完整流程。

## brainstorming：苏格拉底式反问

**触发**：任何「加新功能 / 设计 X / 选型」类需求。

**做的事**：

1. 问需求范围（你想覆盖哪些场景）
2. 问约束（必须支持 IE11？必须本地不依赖网络？）
3. 问优先级（先快出原型还是直接做对）
4. 问验收标准（怎么算完成）

**不做的事**：

- 不直接动手写代码
- 不揣测「你应该想要 X」

**典型对话**：

```
你：帮我加导出 CSV
brainstorming：
  1. 哪些字段？所有列还是部分？
  2. 编码 UTF-8 还是 GBK（Excel 国内常需 GBK）？
  3. 大数据量时是否要流式（避免内存爆）？
  4. 触发方式：用户点按钮还是定时任务？
  5. 权限：所有用户可导出还是仅管理员？
```

::: tip 跳过

如果需求已经在过去对话中明确，可显式：「**这次跳过 brainstorming，需求已经清楚**」。

:::

## writing-plans + executing-plans

**writing-plans**：多步任务先输出**实施计划文档**——存在 `docs/plans/<date>-<title>.md`。

格式（典型）：

```md
# 计划：导出答题历史 CSV

## 目标
让用户在「我的答题历史」页面点按钮导出 CSV。

## 设计
- API: GET /api/answers/export?from=...&to=...
- Service: AnswerService.exportToCsv(userId, range): Buffer
- 字段：日期 / 题目 / 选项 / 是否正确

## 实施步骤
1. [ ] AnswerService 加 exportToCsv 方法 + 单测
2. [ ] AnswerController 加 GET /export 端点 + e2e 测试
3. [ ] App 端 history 页加按钮 + 触发下载
4. [ ] CHANGELOG 记录

## 验证
- 单测覆盖 exportToCsv（含空数据 / 大数据量）
- e2e: 触发 export，下载文件，断言字段
```

**executing-plans**：按计划逐步执行，每步完成后 **wait for human checkpoint**——用户 approve 才进下一步。

::: tip 计划长度

短任务（一两步）skill 会跳过 plan 直接做。长任务（5+ 步）必走计划流程。

:::

## test-driven-development

**RED-GREEN-REFACTOR**：

1. **RED**：先写测试，运行 → 失败（预期）
2. **GREEN**：写最小实现让测试过
3. **REFACTOR**：清理代码 / 抽函数 / 改名，测试持续过

**反模式（skill 内列举）**：

- 「先实现再写测试」→ 退化为 regression test，测的是已经写的代码而非需求
- 「测试和实现一起写」→ 边界模糊，常忘掉边界条件
- 「mock 所有依赖」→ 测试通过但 prod 集成失败
- 「测覆盖率」当目标 → 写无意义断言冲数字

**例外**：

- 探索性原型：可以先写实现
- 紧急 hotfix：先 bug 复现 + 修，再补测试
- UI 调样式：很难写有意义的测试

```
你：写一个 calculatePrice 函数支持折扣
TDD skill：
  1. RED：先写 4 个测试（无折扣 / 满减 / 折扣码 / 组合）
  2. 用 Bash 跑测试 → 4 个都失败 ✓
  3. GREEN：实现 calculatePrice 让测试过
  4. 跑测试 → 4 个都过 ✓
  5. REFACTOR：抽出 applyDiscountStrategy 辅助函数
  6. 跑测试 → 仍 4 个过 ✓
```

## systematic-debugging：4 阶段根因分析

1. **复现**：稳定复现 bug（确认不是 flaky test）
2. **缩小范围**：bisect git history / 注释代码段，找最小复现
3. **形成假设**：「我认为 X 导致 Y，因为 Z」
4. **验证**：跑命令 / 加日志 / 看堆栈，证明假设对/错

**反模式**：

- 「随便改改试试」→ 修了某段但不知道为啥
- 「重启就好了」→ 没找根因，会复现
- 「这条 log 提到 X，那一定是 X」→ 没验证就下结论

::: tip 调试 vs 重构

调 bug 时不要顺便重构——否则修复 vs 重构混在一起 PR，回归测试难定位。

:::

## verification-before-completion

**核心规则**：声称「完成」「通过」「应该可以了」之前，**必须跑命令拿证据**。

```
（Agent 写完代码后）

❌ "Done! The function should work now."
✅ Bash: pnpm test:unit src/services/calculator.spec.ts
   ✓ 4 tests passed
   
   Done. All tests pass.
```

类似检查清单：

- 改 API → 启动 dev server + curl 验证
- 改 UI → 截图（chrome-devtools-mcp）+ 视觉确认
- 改类型 → 跑 tsc --noEmit
- 改测试 → 跑测试套件
- 改 build 配置 → 跑 pnpm build

::: warning 不要省

省了这一步常出现「**Agent 说改好了但实际编译失败**」。verification 慢但避免来回浪费。

:::

## subagent-driven-development

**触发**：单个任务复杂到「**塞主上下文不划算**」。

**做法**：

1. 主 Agent 把子任务（如「查找所有调用 X 的地方」）派给 subagent
2. subagent 用独立上下文跑（不污染主上下文）
3. subagent 返回总结
4. 主 Agent 拿结果决策

**两段式审查**：

1. subagent 先 propose（不动手）
2. 主 Agent / 人 review 后 approve
3. subagent 再 execute

避免「subagent 直接干完一个不可逆操作」。

```
（主 Agent）
> 用 Explore subagent 搜「所有 React 类组件」（不是函数组件）

（主 Agent spawn Explore subagent）
（Explore 用 Grep 找 "class.*extends.*React.Component" + 报告 12 个文件）

（主 Agent 拿结果）
> 这 12 个文件，subagent 把 ComponentA 重写成函数组件并测试
```

## dispatching-parallel-agents

**触发**：2+ 独立子任务，串行无收益。

**做法**：单条 message 里 spawn 多个 subagent，并行跑。

```
> 同时做三件事：
>  1. Explore 找所有未用的 dep
>  2. code-reviewer 评审 PR #123
>  3. Explore 总结测试覆盖率
```

（主 Agent 一次性 spawn 3 个 subagent → 3 个并行 → 最快返回）

::: tip 何时不并行

- 任务有依赖（A 的结果决定 B 怎么做） → 串行
- subagent 都写同一文件 → race condition

:::

## using-git-worktrees

**触发**：风险大的改动（重构 / 升级依赖 / 试验性方案）。

**做法**：用 git worktree 在独立目录跑，不污染主分支：

```bash
git worktree add ../my-app-experiment exp-branch
cd ../my-app-experiment
# 在这做改动 / 跑测试
# 满意后 cherry-pick 回主仓库
```

skill 会自动建 worktree、跑改动、报告结果，最终用户决定要不要 merge。

## requesting-code-review

**触发**：完成一段大改动后。

**做法**：

1. 写 PR 描述（What / Why / 测试覆盖 / 风险）
2. 自检 checklist（lint / test / 类型 / 文档）
3. 提交 review 时附上**具体担心的点**（比如「这个并发场景我不确定」），引导 reviewer 关注。

## receiving-code-review

**触发**：收到 review 评论后。

**核心理念**：**技术审慎**——不要默认「reviewer 一定对」也不要「我一定对」。

每条意见分类：

- **明显对的**：立即改
- **合理但有 trade-off**：解释你的取舍，问 reviewer 是否仍坚持
- **不对**：礼貌反驳并给证据（链接文档 / 测试结果）
- **风格偏好**：通常顺从 reviewer（团队风格大于个人偏好）

## writing-skills：自己写 skill

`writing-skills` skill 教你怎么写新 skill。要点：

```md
---
name: my-custom-skill
description: |
  Use when [明确的触发场景]
  Example: "用户问 X 类问题" / "需要做 Y 操作前"
---

# Skill 主体

## 何时触发

- 场景 1
- 场景 2

## 步骤

1. ...
2. ...

## 反模式

- 不要 ...

## 例外

- 当 ... 时可跳过
```

**好 skill 的特征**：

- description 写明确触发场景（Claude 据此自动调用）
- 步骤具体可执行（不只是「考虑性能」这种空话）
- 列反模式 + 例外，避免机械执行
- 长度 < 500 行（太长 token 浪费）

::: tip 命名空间

- `superpowers:xxx` 是上游 plugin 的 skill
- 用户自写的本地 skill **不加前缀**，直接 `<name>`

:::

## 与 Claude Code Hooks 配合

Skills 是「**Agent 看到的指令**」，Hooks 是「**Agent 跑工具的时候触发的 shell 命令**」。两者互补：

| 场景 | Skill / Hook |
| --- | --- |
| 强制走 TDD 流程 | Skill（`test-driven-development`） |
| 每次 Edit 自动 prettier | Hook（pre Edit / post Edit） |
| 重要 commit 提醒 | Skill |
| 阻止 git push --force | Hook（pre Bash） |
| 完工前跑 lint | Skill（`verification-before-completion`） |

::: tip 互补不互斥

Skill 影响 Agent **思考方式**，Hook 影响 Agent **工具调用**。同一目标可用两者其一：

- 「写代码后自动 lint」用 Hook（post Edit 跑 lint-staged）
- 「写代码后想着跑 lint」用 Skill（提醒 Agent 主动跑）

Hook 强（不可绕过），Skill 灵活（Agent 看场景决定）。

:::

## 性能与成本

Superpowers 装 15-25 个 skill，每个 SKILL.md 1-2KB。系统提示注入清单约 5-10KB。

**影响**：

- 启动开销：每次会话首 prompt 多 ~3-5KB tokens（按 Sonnet 输入 $3/M ≈ 每次 $0.015）
- 行为变慢：simple 任务走完整流程 → 多几轮对话
- 上下文占用：~3-5% of 200K 窗口

**适合**：

- 重度 Claude Code 用户（每天 2h+ 用）
- 团队规范化 AI 协作流程
- 培养良好工程习惯

**不适合**：

- 单纯问答 / 简单脚本（用纯对话更快）
- 上下文紧张（已经 1M 还嫌不够）

## 自定义 / 覆盖上游 skill

想关掉某个 skill：

```json
// ~/.claude/settings.json
{
  "plugins": {
    "superpowers": {
      "disabledSkills": ["brainstorming", "writing-plans"]
    }
  }
}
```

想覆盖某个 skill 的内容：把同名 skill 放 `~/.claude/skills/<name>/SKILL.md`——用户级 skill 优先 plugin 级。

## 故障排查

| 现象 | 排查 |
| --- | --- |
| skill 不自动触发 | description 写得不够明确 / Agent 评估时不匹配 |
| 简单任务也走 brainstorming | 显式说「跳过 brainstorming」/ 临时禁用 |
| `/plugin install` 失败 | 网络问题（marketplace 在境外） |
| skill 列表里没有 superpowers:* | 装完没重启 Claude Code / `/skills` 刷新 |
| 自定义 skill 不被调用 | description 太宽泛 / Agent 选了其它更精确的 skill |

## 版本里程碑

| 版本 | 时间 | 主要变化 |
| --- | --- | --- |
| 0.x | 2024-2025 | 早期，专注 Claude Code |
| 1.0 | 2025 | 跨平台（Codex / Gemini / Cursor） |
| 1.x | 2025-2026 | 持续增加 skill + 优化 mandatory workflow |
