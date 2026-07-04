---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Renovate · 核于 2026-07

## 速查

- **一行起步**：`{ "extends": ["config:recommended"] }`；更严用 `config:best-practices`
- **配置文件**：`renovate.json` / `.json5` / `.github/renovate.json` / `.renovaterc.json`（`package.json` 字段已废弃）
- **校验**：`npx --yes --package renovate -- renovate-config-validator --strict`
- **自托管跑一轮**：`RENOVATE_TOKEN=xxx npx --yes renovate owner/repo`
- **演练调试**：`LOG_LEVEL=debug renovate --dry-run=full owner/repo`
- **`rangeStrategy`** 默认 `auto`；应用用 `pin`、库用 `replace` / `widen`
- **匹配包名**：`matchPackageNames` 支持精确 / glob（`@types/**`）/ 正则（`/^eslint/`）/ 取反（`!x`）
- **限流默认**：`prConcurrentLimit=10`、`prHourlyLimit=2`、`branchConcurrentLimit=null`
- **稳定期**：`minimumReleaseAge` + `internalChecksFilter`（默认 `strict`）
- **面板**：`config:recommended` 自带 Dependency Dashboard
- **别和 Dependabot 对同一生态同时开**，会重复提 PR
- **文档**：<https://docs.renovatebot.com/>

## 配置文件位置（按查找顺序）

```text
renovate.json
renovate.json5
.github/renovate.json / .github/renovate.json5
.gitlab/renovate.json / .gitlab/renovate.json5
.renovaterc / .renovaterc.json / .renovaterc.json5
package.json 的 "renovate" 字段（已废弃）
```

自定义位置用全局选项 `configFileNames`。

## 运行 / CLI 命令

| 命令                                                            | 用途                          |
| --------------------------------------------------------------- | ----------------------------- |
| `npx --yes renovate owner/repo`                                 | 自托管，跑一个仓库            |
| `renovate --autodiscover`                                       | 跑遍所有有权限的仓库          |
| `renovate --dry-run=full owner/repo`                            | 演练，不真的建 PR             |
| `renovate-config-validator [--strict]`                          | 校验配置文件                  |
| `docker run --rm -e RENOVATE_TOKEN=... renovatebot/renovate`    | Docker 方式运行               |

常用环境变量：`RENOVATE_TOKEN`（平台 token）、`RENOVATE_GITHUB_COM_TOKEN`（拉 changelog）、`RENOVATE_CONFIG_FILE`、`RENOVATE_AUTODISCOVER`、`LOG_LEVEL`。

## 常用配置选项（含默认值）

| 选项                    | 默认      | 说明                                             |
| ----------------------- | --------- | ------------------------------------------------ |
| `extends`               | `[]`      | 继承的预设数组，**后者覆盖前者**                 |
| `packageRules`          | `[]`      | 规则数组，规则内 `match*` 为 AND                 |
| `rangeStrategy`         | `auto`    | 版本范围更新策略                                 |
| `schedule`              | `at any time` | 创建 PR / 分支的时间窗口                     |
| `timezone`              | `UTC`     | IANA 时区名                                      |
| `automerge`             | `false`   | 是否自动合并                                     |
| `automergeType`         | `pr`      | `pr` / `branch` / `pr-comment`                   |
| `platformAutomerge`     | `true`    | 用平台原生自动合并                               |
| `prConcurrentLimit`     | `10`      | 并发开着的 PR 上限（`0` 不限）                    |
| `prHourlyLimit`         | `2`       | 每小时新建 PR 上限（`0` 不限）                    |
| `branchConcurrentLimit` | `null`    | 并发分支上限，`null` 继承 `prConcurrentLimit`     |
| `minimumReleaseAge`     | `null`    | 新版本冷静期（如 `"3 days"`）                     |
| `internalChecksFilter`  | `strict`  | `strict` 不建早产 PR / `none` 建但挂 pending      |
| `lockFileMaintenance`   | 关        | 定期重建 lock 文件                               |
| `dependencyDashboard`   | `false`   | （`config:recommended` 已开）依赖面板             |
| `ignoreDeps`            | `[]`      | 按名忽略的依赖                                   |
| `labels` / `addLabels`  | `[]`      | 替换 / 追加 PR 标签                              |
| `reviewers` / `assignees` | `[]`    | 审阅人 / 指派人                                  |
| `semanticCommits`       | `auto`    | 语义化提交：`auto` 探测 / `enabled` / `disabled`  |
| `rebaseWhen`            | `auto`    | 何时 rebase：`auto` / `behind-base-branch` / `conflicted` / `never` |
| `separateMajorMinor`    | `true`    | 大版本与次要 / 补丁分开成不同 PR                  |
| `separateMinorPatch`    | `false`   | 次要与补丁再拆开                                 |

## 预设速查

| 预设                          | 作用                                             |
| ----------------------------- | ------------------------------------------------ |
| `config:recommended`          | 官方推荐基线（**旧名 `config:base`**）           |
| `config:best-practices`       | recommended + pin digest + 稳定期 + 配置迁移      |
| `config:js-app`               | recommended + 锁死应用依赖                       |
| `config:js-lib`               | recommended + 只锁 devDependencies               |
| `:dependencyDashboard`        | 开启依赖面板                                     |
| `:dependencyDashboardApproval`| PR 需先在面板勾选批准                            |
| `:enableVulnerabilityAlerts`  | 开启漏洞告警更新                                 |
| `:pinAllExceptPeerDependencies` | 除 peerDeps 外全部 pin                         |
| `:maintainLockFilesWeekly`    | 每周维护 lock 文件                               |
| `group:monorepos`             | 关联 monorepo 包分组（recommended 已含）         |
| `group:allNonMajor`           | 所有非大版本合一个 PR                            |
| `schedule:weekly` / `schedule:nonOfficeHours` | 排期预设                       |
| `helpers:pinGitHubActionDigests` | 把 Actions 锁到 commit SHA                     |
| `docker:pinDigests`           | 把镜像锁到 digest                                |
| `mergeConfidence:all-badges`  | 显示全部 Merge Confidence 徽章                   |

预设族：`config:*`、`group:*`、`schedule:*`、`docker:*`、`helpers:*`、`workarounds:*`、`replacements:*`、`security:*`、`monorepo:*`、`npm:*`，以及 `:` 开头的内置默认预设。

## rangeStrategy 速查（以 `^1.0.0` 为例）

| 策略              | 遇范围内 1.1.0    | 遇超范围 2.0.0        | 适用           |
| ----------------- | ----------------- | --------------------- | -------------- |
| `auto`（默认）    | 由 Renovate 决定  | 由 Renovate 决定      | 通用           |
| `pin`             | → `1.1.0`         | → `2.0.0`             | 应用           |
| `bump`            | `^1.0.0`→`^1.1.0` | `^1.0.0`→`^2.0.0`     | 想让清单永远追最新 |
| `replace`         | 只更新 lock       | → `^2.0.0`            | 库 / 保守      |
| `widen`           | 保持              | → `^1.0.0 \|\| ^2.0.0`| peerDependencies |
| `update-lockfile` | 只更新 lock       | → `^2.0.0`            | lock 优先      |
| `in-range-only`   | 只更新 lock       | 跳过                  | 只动 lock      |

`matchUpdateTypes` 常用值：`major`、`minor`、`patch`、`pin`、`digest`、`pinDigest`、`lockFileMaintenance`、`rollback`、`bump`、`replacement`。

## 踩坑清单

- **`config:base` 已改名**：v36 起用 `config:recommended`，校验器会提示迁移。
- **`matchPackagePatterns` / `matchPackagePrefixes` 已废弃**：v38 起统一并入 `matchPackageNames`（自身支持 glob / 正则 / 取反）。正则要用一对斜杠 `/.../` 包起来，且**默认区分大小写**。
- **`fileMatch` 改名 `managerFilePatterns`**：写 `customManagers` 用新名。
- **`timezone` 默认 UTC**：跨时区团队务必显式设，否则「凌晨」窗口错位。
- **`schedule` 只限创建、不限合并**：窗口外已有 PR 仍会被 rebase / 更新。
- **`prHourlyLimit` 默认是 2**（不是 0）：首次接入若嫌慢，是它在限速；`prConcurrentLimit` 默认 10，多数仓库调到 3~5 更顺。
- **自动合并需约 2 小时窗口**：不会「测试一过立刻合」；且每轮每基线只合一个分支。
- **`minimumReleaseAge` 要配合 `internalChecksFilter`**：默认 `strict` 才会「不建早产 PR」；设成 `none` 会先建 PR 挂 pending。
- **别和 Dependabot 对同一生态同时开**：会重复提 PR、互相打架，二选一。
- **fork 与无清单文件的仓库会被忽略**：托管 App 默认跳过它们。
- **`package.json` 的 `renovate` 字段已废弃**：新项目用独立 `renovate.json`。
- **自托管缺工具链会失败**：CLI 方式需自备 Ruby / Python / Composer 等；或用 Docker `-full` 镜像。

## 链接

- 官方文档：<https://docs.renovatebot.com/>
- 配置选项全集：<https://docs.renovatebot.com/configuration-options/>
- 预设（完整）：<https://docs.renovatebot.com/presets-config/>
- 升级最佳实践：<https://docs.renovatebot.com/upgrade-best-practices/>
- 与其它机器人对比：<https://docs.renovatebot.com/bot-comparison/>
- 字符串模式匹配（glob / 正则）：<https://docs.renovatebot.com/string-pattern-matching/>
- GitHub 仓库：<https://github.com/renovatebot/renovate>
- 配置校验 pre-commit：<https://github.com/renovatebot/pre-commit-hooks>
