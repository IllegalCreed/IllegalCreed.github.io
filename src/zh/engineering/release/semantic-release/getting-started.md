---
layout: doc
outline: [2, 3]
---

# 入门：全自动发布与版本推断

> 基于 semantic-release v25 · 核于 2026-07

## 速查

- **一句话**：semantic-release 把「下一个版本号」变成**对 Git 提交历史的确定性计算**——开发者只写规范提交，版本号、CHANGELOG、tag、发布全由 CI 自动产出。
- **核心契约是 Conventional Commits**：提交信息的 `type` 决定版本跳变。**提交写得规范 = 发布正确**；提交乱写 = 版本乱跳或不发布。
- **版本映射（默认 angular 预设）**：`fix:`/`perf:`→**patch**；`feat:`→**minor**；脚注含 `BREAKING CHANGE:`（或类型后加 `!`，如 `feat!:`）→**major**。
- **不触发发布的类型**：`docs`/`style`/`chore`/`refactor`/`test`/`ci`/`build` 等默认**不产生版本**；一批提交里取**最高等级**那条决定跳变。
- **无可发布提交 = 不发布**：semantic-release 会打印「There are no relevant changes, so no new version is released」并正常退出，不是报错。
- **必须在 CI 跑**：本地运行默认进入 **dry-run**（只算不发）；真正发布要在 CI、测试全过、目标分支上——保证环境干净、可复现、有审计。
- **最小三步**：① CI 里 `npx semantic-release@25`；② 仓库根放 `.releaserc.json`（或用默认配置）；③ 在 CI 注入 `GITHUB_TOKEN`/`NPM_TOKEN`。
- **默认插件四件套**：`commit-analyzer`（算版本）→ `release-notes-generator`（生成说明）→ `npm`（发 npm）→ `github`（建 Release）。
- **默认标签格式**：`v${version}`（如 `v1.4.0`）；默认发布分支含 `main`/`master`/`next` 等。
- **它不做什么**：不替你写提交、不校验提交规范（那是 commitlint 的活）、不天然管 monorepo 多包版本。
- **版本与环境**：当前 **v25**，要求 **Node ≥ 22.14.0**；推荐 `npx semantic-release@25` 锁主版本。

## 一、semantic-release 解决什么问题

传统「手工发布」的链路大致是：改代码 → 人脑决定「这次算 patch 还是 minor」→ 手动改 `package.json` 版本号 → 手写 CHANGELOG → `git tag` → `npm publish` → 建 Release。这套流程有四个顽疾：

- **版本号靠主观拍板**：同一批改动，不同人可能定出不同版本；「我觉得这次改得多，升个 minor 吧」这类情绪化判断违背 SemVer 的客观语义。
- **步骤多、易漏**：忘打 tag、忘更 CHANGELOG、`npm publish` 前忘 build，都是高频事故。
- **不可复现**：在谁的机器上、用哪个 npm 账号、带没带脏文件发的，事后难追溯。
- **发布是「大事」**：因为麻烦又易错，团队倾向攒一大批改动才发一次，反而放大了每次发布的风险。

semantic-release 的答案是**把版本决策客观化、把发布流程自动化**：版本号由提交历史唯一决定，发布由 CI 幂等执行。人只需要做一件事——**把提交写规范**。

## 二、核心心智模型：版本号是提交历史的「函数」

记住这个等式：

```text
下一个版本号 = f(上次发布的 tag, 自那以来的所有提交)
```

- semantic-release 先从 Git tag 找到「上次发布到哪个版本」；
- 再取自那个 tag 以来的全部提交，逐条按 Conventional Commits 解析 `type`；
- 取其中**最高等级**的跳变作为本次发布类型（有一条 `feat` 就至少 minor，有一条 `BREAKING CHANGE` 就 major）；
- 若这些提交**没有任何一条**触发发布，则本次「不发布」。

这就是「全自动」的本质：没有隐藏状态、没有人工输入，同样的提交历史永远算出同样的版本号。也正因如此，**提交信息成了唯一的「输入」**——它的质量直接决定发布的正确性。

## 三、Conventional Commits → 版本推断

Conventional Commits 约定提交信息首行格式为 `type(scope): subject`。semantic-release 默认用 `@semantic-release/commit-analyzer` 的 **angular 预设**做如下映射：

| 提交类型 | 示例 | 版本跳变 | 说明 |
| --- | --- | --- | --- |
| `fix` | `fix: 修复登录空指针` | **patch** `1.2.3→1.2.4` | Bug 修复 |
| `perf` | `perf: 缓存查询结果` | **patch** | 性能优化（angular 预设归为 patch） |
| `feat` | `feat: 新增导出 CSV` | **minor** `1.2.3→1.3.0` | 新功能，向后兼容 |
| 破坏性变更 | `feat!: 重构 API` 或脚注 `BREAKING CHANGE: ...` | **major** `1.2.3→2.0.0` | 不向后兼容 |
| `docs` `style` `chore` `refactor` `test` `ci` `build` | `chore: 升级依赖` | **无发布** | 默认不触发版本 |

几个关键点：

- **取最高等级**：一次发布区间里同时有 `fix` 和 `feat`，结果是 minor；只要有一条破坏性变更就是 major。
- **破坏性变更两种写法**：① 在类型后加 `!`（`feat!:` / `fix!:`）；② 在提交正文的脚注写 `BREAKING CHANGE: <说明>`。两者都触发 major。
- **可定制**：默认映射来自预设，可通过 `commit-analyzer` 的 `preset`（如换成 `conventionalcommits`）或 `releaseRules` 调整，例如让 `docs` 也发 patch。
- **无相关提交则不发布**：这不是错误，而是设计——避免发出「只改了注释」的空版本。

## 四、为什么必须在 CI 里跑（而不是本地）

semantic-release 强约定「在 CI 环境运行」，本地默认自动进入 dry-run。原因：

- **环境干净、可复现**：CI 是全新检出的干净工作区，不会把你本地的脏文件、未提交改动、错的 npm 账号带进发布。
- **在正确的时机、正确的分支**：发布只应发生在**所有测试通过之后**、且在配置的发布分支上。CI 天然是「测试全过才继续」的门控。
- **凭据集中管理**：`NPM_TOKEN`、`GITHUB_TOKEN` 作为 CI Secret 注入，不散落在个人电脑。
- **可审计**：每次发布都对应一条 CI 记录（谁触发、基于哪个 commit、日志如何）。
- **防误发**：它用 [env-ci](https://github.com/semantic-release/env-ci) 检测运行环境，非 CI 环境默认 `dryRun`，避免本地手滑真发一个版本。可用 `--no-ci` 强制绕过（不推荐用于真实发布）。

一句话：**「只在 CI 跑」不是限制，而是保证发布确定性的前提**。

## 五、最小上手三步

**第一步：在 CI 里运行 semantic-release。** 官方现在推荐把它当「发布期依赖」，直接用 `npx` 运行并锁住主版本，而非日常 devDependency：

```bash
# CI 的发布步骤（测试全过后执行）
npx semantic-release@25

# 需要额外插件时，用 --package 一起拉起
npx --package semantic-release \
    --package @semantic-release/changelog \
    --package @semantic-release/git \
    semantic-release
```

> 也可仍把 `semantic-release` 装为 devDependency，用 lockfile 锁定精确版本——两种做法都常见，取决于你更看重「随时用最新补丁」还是「完全可复现」。

**第二步：加一份配置（可选，用默认也能跑）。** 仓库根新建 `.releaserc.json`：

```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/npm",
    "@semantic-release/github"
  ]
}
```

**第三步：在 CI 注入凭据并调好检出。** 以 GitHub Actions 为例（关键点：拉全量历史、给写权限）：

```yaml
name: release
on:
  push:
    branches: [main]
permissions:
  contents: write        # 打 tag / 建 Release 需要写权限
  issues: write
  pull-requests: write
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0   # 必须拉全量历史与 tag，否则算不出上次发布
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm test
      - run: npx semantic-release@25
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

> `fetch-depth: 0` 是最高频的踩坑点：`actions/checkout` 默认浅克隆（只拉 1 个 commit），semantic-release 会因为找不到历史 tag 而误判为「首次发布」或算错版本。配置细节见 [配置与 CI 集成](./guide-line/configuration)。

## 六、一次发布，幕后发生了什么

运行 `npx semantic-release` 后，它按固定顺序走完一条生命周期（此处先建立全景，逐插件拆解见 [插件与发布生命周期](./guide-line/plugins-lifecycle)）：

1. **verifyConditions**：校验环境与凭据（Git 能推送吗？`NPM_TOKEN` 有效吗？）。
2. **get last release**：从 Git tag 找出上次发布的版本。
3. **analyzeCommits**：解析自上次以来的提交，算出发布类型（无 → 到此结束）。
4. **verifyRelease** → **generateNotes**：校验本次发布、生成发布说明。
5. **prepare**：更新 `package.json` 版本、（可选）写 CHANGELOG、（可选）回提交。
6. **publish**：`npm publish` + 建 GitHub Release。
7. **success / fail**：通知（评论关联的 issue/PR，或失败告警）。

理解这条主线后，semantic-release 的「配置」本质上就是**在合适的 step 上装合适的插件**。下一步建议先读 [配置与 CI 集成](./guide-line/configuration) 打通「怎么跑起来」，再读 [插件与发布生命周期](./guide-line/plugins-lifecycle) 理解「每步在做什么」。
