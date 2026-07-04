---
layout: doc
outline: [2, 3]
---

# Release PR 机制：累积、刷新、合并即发布

> 基于 release-please · 核于 2026-07

## 速查

- **Release PR 是「下一个版本的暂存区」**：release-please 维护一个长期存在的 PR，持续把待发布的版本号与 CHANGELOG 攒在里面。
- **持续刷新**：主干每来新提交，Release PR 自动更新——版本号可能从 patch 抬到 minor、changelog 追加新条目，始终反映「现在发布会是什么样」。
- **合并才发布**：**只有合并 Release PR** 才触发打 tag、建 GitHub Release、写回版本文件；不合并就永远停在预览态。
- **无相关提交则不推进**：自上次发布起若只有 `docs`/`chore`/`refactor` 等**非发版类型**提交，不会创建/推进 Release PR。
- **版本推断**：`fix`→patch、`feat`→minor、`feat!:` / `BREAKING CHANGE`→major；取本次累积提交里的**最高等级**。
- **标签生命周期**：`autorelease: pending`（待发布）→ `autorelease: tagged`（已打 tag）→ `autorelease: published`（已发布）；异常时会出现 `autorelease: closed`。
- **强制重跑**：PR 被误关/卡住时，移除 `autorelease: closed`、加回 `autorelease: pending` 并打 `release-please: force-run` 标签可强制重新处理。
- **版本覆盖**：提交 body 写 `Release-As: 2.0.0` 可一次性指定版本；配置 `release-as` 可持久覆盖（合并后应删除）。
- **版本策略**：`versioning-strategy` 可选 `default` / `always-bump-patch` / `always-bump-minor` / `always-bump-major` / `service-pack` / `prerelease`。
- **1.0 之前**：`bump-minor-pre-major` 让破坏性变更只升 minor，`bump-patch-for-minor-pre-major` 让 feat 只升 patch，避免过早到 1.0。
- **changelog 分区**：默认只展示 `feat`(Features)、`fix`(Bug Fixes)、`perf`、`deps`、`revert`；`docs`/`chore`/`style`/`refactor`/`test`/`build`/`ci` 默认 `hidden`。

## 一、Release PR 的生命周期

release-please 不是「提交即发版」，而是围绕一个 **Release PR** 循环。它的完整生命周期分四步：

1. **创建**：主干出现会推进版本的提交后，release-please 打开一个 Release PR（标题形如 `chore(main): release 1.4.0`），带 `autorelease: pending` 标签。PR 内容 = 计算出的新版本号 + 生成的 CHANGELOG 片段 + 版本文件改动。
2. **累积/刷新**：此后每次主干有新提交，同一个 Release PR 被**原地更新**。它是「活的」——你今天看到 `1.3.1`（只有 fix），明天合入一个 `feat` 后它自动变成 `1.4.0`，changelog 也随之重排。
3. **合并 = 发布**：当你合并 Release PR，release-please 在下一次运行时识别到这个「已合并的 pending Release PR」，于是执行发布动作（见第三节）。
4. **收尾**：发布完成后，PR 标签从 `autorelease: pending` 翻转为 `autorelease: tagged`，进而 `autorelease: published`。

**要点**：Release PR 始终代表「假如现在发布」的完整快照。它把「持续自动计算版本」和「人工决定发布时机」优雅地解耦。

## 二、什么会推进版本，什么不会

Release PR 是否出现、版本号抬多高，完全由**自上次发布以来**主干上的 Conventional Commits 决定：

- **会推进**：`fix`（patch）、`feat`（minor）、带 `!` 或 `BREAKING CHANGE` 的提交（major）。多个提交并存时取**最高等级**——有一个 `feat!:` 就是 major。
- **不会推进**：`docs` / `chore` / `refactor` / `style` / `test` / `ci` / `build` 等类型。它们默认既不升版本、也不写入 changelog。
- **只有非发版提交时**：release-please **不会创建或推进 Release PR**。这解释了一个常见困惑——「我明明合了好几个 PR，为什么没有 Release PR？」通常是因为那些提交都是 `chore` / `docs`，不构成发布理由。

因此，changelog 的「可见性」与「是否发版」是同一套规则：默认可见的类型才会推进版本。若希望某类提交（如 `deps`）出现在 changelog，需要在 `changelog-sections` 里显式配置其 `hidden: false`。

## 三、合并 Release PR 时到底发生了什么

合并 Release PR 只是「提交了一堆版本文件改动」；真正的发布动作发生在**下一次 release-please 运行时**（即合并产生的 push 事件触发工作流）。它会：

1. **识别**：找到那个刚被合并、且带 `autorelease: pending` 的 Release PR。
2. **打 tag**：在合并提交上创建 Git tag（单包默认 `v1.4.0`，monorepo 默认 `<component>-v1.4.0`）。
3. **建 Release**：基于该 tag 创建 GitHub Release，正文取自 CHANGELOG 中本版本的条目。
4. **翻标签**：把 PR 的 `autorelease: pending` 换成 `autorelease: tagged`（发布完成后为 `autorelease: published`）。

注意版本文件（`package.json` 等）的写回是在 PR 的 diff 里就已完成的——合并即把它们并入主干。tag 与 Release 则是合并后的运行才补上。

## 四、随新提交刷新与「卡住」的排查

- **正常刷新**：Release PR 未合并时，主干每来新提交它就重算。若长时间不刷新，检查工作流是否正常触发、`GITHUB_TOKEN` 是否让 Release PR 上的 CI 无法运行（默认 token 不触发下游工作流）。
- **强制重跑**：若 Release PR 被手动关闭又想恢复，光 reopen 不会重新触发。正确做法：移除 `autorelease: closed` 标签，加上 `autorelease: pending` 和 `release-please: force-run` 两个标签，release-please 下次运行会强制重新处理。
- **本地调试**：用 CLI `release-please release-pr --token=$GH_TOKEN --repo-url=owner/repo --release-type=node --dry-run` 可干跑，观察它「打算」创建/更新什么，不落地。加 `--debug` 看详细日志。
- **`always-update`**：默认情况下 release notes 没变时 PR 不会被更新；配置 `always-update: true` 可强制每次都刷新 PR。

## 五、版本策略与覆盖

大多数项目用默认策略即可，但 release-please 提供了细粒度控制：

- **`versioning-strategy`**：
  - `default`：破坏性→major、feat→minor、fix→patch（标准 SemVer）。
  - `always-bump-patch`：永远只升 patch，适合只出补丁的维护分支 / backport。
  - `always-bump-minor` / `always-bump-major`：强制升 minor / major。
  - `service-pack`：Java backport 场景，用 Maven 的 service pack 版本（如 `1.2.3-sp.1`）。
  - `prerelease`：推进预发布号，配合 `prerelease-type`（如 `beta`）。
- **1.0 之前的特殊处理**：
  - `bump-minor-pre-major: true`：版本 < 1.0.0 时，破坏性变更只升 **minor**（而非直接到 1.0），符合 0.x 阶段「破坏性变更频繁」的现实。
  - `bump-patch-for-minor-pre-major: true`：版本 < 1.0.0 时，`feat` 只升 **patch**。
- **手动覆盖版本**：
  - 一次性：在某个提交的 body 写 `Release-As: 2.0.0`（大小写不敏感），本次发布强制用该版本。
  - 持久：在配置里写 `release-as: "2.0.0"`；**合并后应删除**，否则会一直锁定这个版本。将某包的 `release-as` 设为空字符串 `""` 则显式恢复用 Conventional Commits 推断。

## 六、changelog 分区定制

release-please 用 `changelog-sections` 决定「哪些提交类型进 changelog、归到哪个标题」。默认配置只展示少数类型，其余标 `hidden: true`：

```json
{
  "changelog-sections": [
    { "type": "feat", "section": "Features" },
    { "type": "fix", "section": "Bug Fixes" },
    { "type": "perf", "section": "Performance Improvements" },
    { "type": "deps", "section": "Dependencies" },
    { "type": "revert", "section": "Reverts" },
    { "type": "docs", "section": "Documentation", "hidden": true },
    { "type": "style", "section": "Styles", "hidden": true },
    { "type": "chore", "section": "Miscellaneous Chores", "hidden": true },
    { "type": "refactor", "section": "Code Refactoring", "hidden": true },
    { "type": "test", "section": "Tests", "hidden": true },
    { "type": "build", "section": "Build System", "hidden": true },
    { "type": "ci", "section": "Continuous Integration", "hidden": true }
  ]
}
```

把某类型的 `hidden` 去掉（或设 `false`）即可让它出现在 changelog。此外 `include-commit-authors: true` 会在每条 changelog 后附上提交作者。理解了单包的 Release PR 机制后，进入 [monorepo 与 manifest 模式](./monorepo-manifest) 看多包如何组织。
