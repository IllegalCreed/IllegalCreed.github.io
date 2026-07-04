---
layout: doc
outline: [2, 3]
---

# 入门：release-please 是什么与如何跑通一次发布

> 基于 release-please · 核于 2026-07

## 速查

- **定位**：Google（googleapis）开源的**版本发布自动化**工具，解析 **Conventional Commits** 自动生成 CHANGELOG、打 tag、建 GitHub Release、写回版本号。
- **GitHub-native**：深度绑定 GitHub 的 PR / Release / Label 生态，只服务 GitHub 仓库；官方推荐用 `release-please-action` 接入 Actions。
- **核心是 Release PR**：不即时发版，而是维护一个**持续刷新的 Release PR**，把「下一个版本号 + changelog」攒在里面等你审阅。
- **发布闸门**：**合并 Release PR = 发布**；不合就不发。发什么版本由 PR 里累积的提交类型决定，你只需决定「合不合」。
- **版本推断规则**：`fix:`→patch，`feat:`→minor，`feat!:` / commit body 含 `BREAKING CHANGE:`→major；遵循 SemVer。
- **合并即发布闭环**：合并后工具自动更新版本文件（如 `package.json`）与 `CHANGELOG.md`、创建 Git tag、创建 GitHub Release。
- **状态用标签追踪**：Release PR 生命周期由 `autorelease: pending` → `autorelease: tagged` → `autorelease: published` 等标签标记。
- **不发版的提交**：`docs` / `chore` / `refactor` / `test` 等类型默认**不推进版本、也不进 changelog**；若自上次发布起只有这类提交，则不会推进 Release PR。
- **多语言**：内置 20+ release type（node、python、go、rust、java、php、ruby、dart、helm、terraform-module、simple 等）。
- **两种接入**：`googleapis/release-please-action@v4`（推荐）或 `release-please` CLI（`npm i release-please -g`，适合本地 `--dry-run` 调试）。
- **一句话**：**把「决定发版」压缩成「点一下 Merge」，其余（版本号、changelog、tag、Release）全自动。**

## 一、它解决什么问题

手工发布通常要做四件琐事且容易出错：决定下一个版本号、整理 CHANGELOG、打 tag、在 GitHub 建 Release。release-please 把这四件事全部自动化，且把「决策」和「执行」分离：

- **决策**：由 Conventional Commits 提交历史自动推断版本号，人类只保留「什么时候发」这一个决定。
- **执行**：一旦决定发布（合并 Release PR），版本号写回、changelog 生成、tag、GitHub Release 全部自动完成。

它刻意选择了**「Release PR」而非「每次提交即发版」**的模型——这既保留了完全自动化的版本推断，又给团队留了一道随时可见、可审阅、可暂缓的人工闸门。

## 二、核心机制：Release PR

release-please 的运行循环可以概括为一句话：**扫描主干提交 → 维护一个 Release PR → 合并即发布**。

1. **扫描**：每次主干（默认 `main`）有新提交，release-please 从上次发布之后的提交里解析 Conventional Commits。
2. **累积**：若存在会推进版本的提交（`feat` / `fix` / 破坏性变更），它就创建或更新一个「Release PR」，在其中写好**推断出的下一个版本号**和**据此生成的 CHANGELOG 片段**。
3. **刷新**：后续每有新提交合入主干，这个 Release PR 会**自动刷新**（版本号可能从 patch 升到 minor、changelog 追加新条目），始终反映「如果现在发布会是什么样」。
4. **发布**：当你**合并**这个 Release PR，release-please 才真正执行发布——打 tag、建 GitHub Release、写回版本文件。

关键心智模型：**Release PR 是「下一个版本的预览与暂存区」，合并它才是「按下发布键」。** 详见 [Release PR 机制](./guide-line/release-pr)。

## 三、Conventional Commits 如何驱动版本

release-please 完全依赖 [Conventional Commits](https://www.conventionalcommits.org/) 来推断语义化版本（SemVer）：

| 提交前缀 | 语义 | 版本影响 |
| --- | --- | --- |
| `fix: ...` | 修复 bug | **patch**（`1.2.3` → `1.2.4`） |
| `feat: ...` | 新功能 | **minor**（`1.2.3` → `1.3.0`） |
| `feat!: ...` / `fix!: ...` | 破坏性变更（`!` 标记） | **major**（`1.2.3` → `2.0.0`） |
| commit body 含 `BREAKING CHANGE: ...` | 破坏性变更 | **major** |
| `docs:` / `chore:` / `refactor:` / `test:` / `style:` / `ci:` / `build:` | 杂项 | **默认不升版本，也不进 changelog** |

因此，「提交信息写得规不规范」直接决定了 release-please 能否正确工作。团队通常配合 commitlint / commitizen 强制提交格式。若某次想手动指定版本，可在提交 body 里写 `Release-As: 2.0.0`（大小写不敏感）来覆盖推断结果。

## 四、最小接入：一个 GitHub Actions 工作流

单包 Node 项目跑通一次发布，只需一个工作流文件。下面示例中，`release-type: node` 让 release-please 知道去更新 `package.json` 并按 Node 生态惯例生成 changelog：

```yaml
# .github/workflows/release-please.yml
on:
  push:
    branches:
      - main

permissions:
  contents: write
  pull-requests: write

name: release-please

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        with:
          release-type: node
```

跑通后你会观察到：

1. 向 `main` 合入若干 `feat:` / `fix:` 提交后，仓库里出现一个标题类似 `chore(main): release 1.3.0` 的 **Release PR**，带 `autorelease: pending` 标签。
2. 这个 PR 的 diff 包含 `CHANGELOG.md` 新条目 + `package.json` 版本号变更。
3. **合并**该 PR 后，release-please 自动创建 `v1.3.0` 的 tag 和对应的 GitHub Release，PR 标签翻转为 `autorelease: tagged`。

> 注意：示例里工作流每次 push 到 `main` 都会运行；没有可发布提交时它「什么也不做」，不会产生噪音。发布后若还要接续 `npm publish` 等步骤，见 [CI 接入与选型](./guide-line/ci-selection)。

## 五、权限与常见第一坑

- **权限**：Action 需要 `contents: write`（打 tag / 建 Release / 写回文件）和 `pull-requests: write`（建/更新 Release PR）；用到 issue 标签时还需 `issues: write`。权限不足会导致 PR 建不出来。
- **默认 `GITHUB_TOKEN` 不触发下游工作流**：用内置 `GITHUB_TOKEN` 创建的 PR / tag / Release **不会触发其它工作流**（GitHub 防循环机制）。若你希望 Release PR 上跑 CI 检查、或 tag 事件触发另一条发布流水线，需要改用 Personal Access Token（PAT）或 GitHub App token。同一次运行内用 `release_created` 输出接续步骤则不受此限制。
- **合并方式**：release-please 依赖能从主干识别出「哪些提交属于本次发布」。团队通常用 squash merge，并保证 squash 后的提交信息本身符合 Conventional Commits。

理解了以上闭环后，进入 [Release PR 机制](./guide-line/release-pr) 深入版本累积、刷新与发布触发的细节。
