---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Renovate · 核于 2026-07

## 速查

- **定位**：Mend 维护的依赖更新机器人，自动提 PR 升级依赖并刷新 lock 文件
- **接入二选一**：Mend 托管 **App**（`github.com/apps/renovate`，零运维）/ **自托管**（CLI / Docker / GHA / GitLab Runner）
- **配置文件**：`renovate.json`（也支持 `.json5`、`.github/renovate.json`、`.renovaterc.json`；`package.json` 的 `renovate` 字段**已废弃**）
- **一行起步**：`{ "extends": ["config:recommended"] }`
- **旧名 config:base**：**v36** 起改名 `config:recommended`，配置校验器会提示自动迁移
- **onboarding PR**：安装后 Renovate 先开一个「Configure Renovate」PR，**合并前不动任何其它依赖**
- **多生态**：npm / Docker / GHA / Terraform / Go / Maven / pip 等 90+ manager 按文件名自动识别
- **多平台**：GitHub / GitLab / Bitbucket / Azure DevOps / Gitea / Forgejo 等 9 个平台
- **自带面板**：`config:recommended` 已开 **Dependency Dashboard**（一个 issue 总览全部更新）
- **想更严**：用 `config:best-practices`（pin digest + 稳定期 + 配置迁移 PR）
- **自托管必备**：机器人账号 PAT → `RENOVATE_TOKEN`、`gitAuthor`、cron（建议每小时跑）
- **校验配置**：`npx --yes --package renovate -- renovate-config-validator`

## Renovate 是什么

Renovate 是一个**跨生态、跨平台的依赖更新机器人**，由 [Mend](https://www.mend.io/)（原 WhiteSource）维护，源码使用 TypeScript、以 AGPL-3.0-only 开源。它的工作循环是：

1. **扫描**：按文件名匹配识别仓库里的清单文件（`package.json`、`Dockerfile`、`*.tf`、`go.mod`、`.github/workflows/*.yml` 等），每种生态对应一个 **manager**。
2. **查版本**：通过对应 **datasource**（npm registry、Docker registry、GitHub tags 等）查询每个依赖的可用新版本。
3. **按策略生成分支 / PR**：根据 `renovate.json` 里的分组、排期、限流、`rangeStrategy` 等规则，创建更新分支并提 PR（MR），PR 正文附 changelog、release notes、兼容性徽章。
4. **收尾**：CI 测试通过后，符合条件的 PR 可被自动合并；其余留给人工审阅。整体状态汇总在 **Dependency Dashboard** issue 里。

它不改你的业务代码，只改依赖版本号与 lock 文件，因此安全、可回滚。

## 两种接入方式

Renovate 有两种运行形态，先想清楚用哪种：

| 维度       | Mend 托管 App                              | 自托管（Self-hosted）                          |
| ---------- | ------------------------------------------ | ---------------------------------------------- |
| 谁跑       | Mend 的基础设施                            | 你自己的 CI / 服务器                           |
| 凭据       | 授权 App 即可                              | 需自建机器人账号 + PAT（`RENOVATE_TOKEN`）      |
| 排期       | Mend 负责按 cron 触发                      | 你自己配 cron / CI 定时任务（建议每小时）       |
| 升级 bot   | Mend 自动更新                              | 你自己升级 Renovate 版本                        |
| 平台       | GitHub、GHES、GitLab、Bitbucket DC 等      | 9 个平台全支持                                  |
| 适合       | 大多数团队、想零运维                      | 私有网络、合规要求、需完全掌控                  |

::: tip 先用 App，需要时再自托管
个人 / 团队仓库直接装 Mend Renovate App 最省事。只有在私有部署、需要接私有制品库、或有合规 / 网络隔离要求时，才值得自托管。自托管细节见 [自托管](./guide-line/self-hosting.md)。
:::

### 安装 Mend Renovate App（GitHub 为例）

1. 打开 [github.com/apps/renovate](https://github.com/apps/renovate)，点 **Install**。
2. 选择 **All repositories** 或 **Select repositories**。Renovate 会**忽略没有已知清单文件的仓库，以及所有 fork**。
3. 稍等片刻，Renovate 会在目标仓库开一个 **onboarding PR**。

## Onboarding PR

安装后不会立刻满屏 PR。Renovate 先提交一个标题为 **「Configure Renovate」** 的引导 PR（分支 `renovate/configure`）：

- 这个 PR 里放着 Renovate 探测到的配置与「接下来会做什么」的预览。
- **在你合并它之前，Renovate 不会对仓库做任何其它改动、也不会提任何依赖 PR。**
- 你可以直接在 `renovate/configure` 分支上改配置，Renovate 会同步更新 PR 描述。
- 合并它 = 正式启用；关闭它（不合并）= 暂不启用（可逆：重命名该已关闭 PR 或手动提交一份配置文件即可重新触发）。

## renovate.json 配置文件

Renovate 按以下顺序查找配置文件（找到第一个即用）：

```text
renovate.json
renovate.json5
.github/renovate.json
.github/renovate.json5
.gitlab/renovate.json
.gitlab/renovate.json5
.renovaterc
.renovaterc.json
.renovaterc.json5
package.json（renovate 字段，已废弃）
```

最小可用配置——只继承官方推荐预设：

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"]
}
```

::: tip 加 `$schema` 换来编辑器补全
顶部的 `$schema` 让 VS Code 等编辑器对 `renovate.json` 提供字段补全与校验，强烈建议加上。
:::

用 JSON5 可以写注释、尾逗号，适合规则变多后维护（文件名用 `renovate.json5`）：

```json5
{
  extends: ["config:recommended"],
  // devDependencies 的补丁 / 次要更新自动合并
  packageRules: [
    { matchDepTypes: ["devDependencies"], matchUpdateTypes: ["minor", "patch"], automerge: true },
  ],
}
```

## extends 与 config:recommended

`extends` 是一个**预设（preset）数组**：预设就是打包好的一组配置，用来复用「合理默认」、避免重复。数组里**后面的预设覆盖前面的**（last wins）。

- **`config:recommended`** —— 官方推荐基线，绝大多数项目从它起步。它已经打包了：Dependency Dashboard、语义化提交前缀、忽略 `node_modules` / 测试目录、`group:monorepos` + `group:recommended`（自动把关联包分组）、`replacements:all` + `workarounds:all`（社区维护的重命名 / 修复）、Merge Confidence 徽章等。
- **`config:best-practices`** —— 在 recommended 之上叠加更严的最佳实践：`docker:pinDigests`、`helpers:pinGitHubActionDigests`（锁 digest / SHA）、`:configMigration`（配置过时自动提迁移 PR）、`:pinDevDependencies`、`security:minimumReleaseAgeNpm`（npm 新版等 3 天再升）等。追求可复现构建时推荐。
- **`config:js-app` / `config:js-lib`** —— 应用锁死全部版本（`:pinAllExceptPeerDependencies`）；库只锁 devDependencies、`dependencies` 保留范围。

::: warning `config:base` 是旧名
`config:base` 在 **Renovate v36** 起被改名为 `config:recommended`。旧名仍可用但已废弃，配置校验器会提示你迁移。新项目一律写 `config:recommended`。
:::

## 覆盖多生态与多平台

Renovate 靠 **manager**（提取器）+ **datasource**（版本源）+ **versioning**（版本方案）三层解耦，来支持极广的生态。常见 manager 会自动按文件名启用：

| 生态             | 识别的文件                                   |
| ---------------- | -------------------------------------------- |
| npm / pnpm / yarn | `package.json` + lock 文件                  |
| Docker           | `Dockerfile`、`docker-compose.yml`           |
| GitHub Actions   | `.github/workflows/*.yml`                    |
| Terraform        | `*.tf`                                        |
| Go modules       | `go.mod`                                      |
| Maven / Gradle   | `pom.xml`、`build.gradle`                     |
| Python           | `requirements.txt`、`pyproject.toml` 等       |
| Helm             | `Chart.yaml`、`values.yaml`                   |

平台方面，同一份 `renovate.json` 在 GitHub、GitLab、Bitbucket、Azure DevOps、Gitea / Forgejo、Gerrit、AWS CodeCommit 上都能跑，差异主要在托管方式与个别平台特性（如自动合并实现）。

## 校验配置

改完配置别等 Renovate 跑一轮才发现写错，用官方校验器本地检查：

```bash
# 校验当前目录下的 renovate 配置文件
npx --yes --package renovate -- renovate-config-validator

# 严格模式：把警告也当错误（CI 里用）
npx --yes --package renovate -- renovate-config-validator --strict
```

也可以接入 [renovatebot/pre-commit-hooks](https://github.com/renovatebot/pre-commit-hooks)，在改 `renovate.json` 的提交上自动校验。

下一步：进入 [配置](./guide-line/config.md) 学习 `packageRules` 与降噪策略。
