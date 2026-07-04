---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Dependabot（GitHub 原生）· 核于 2026-07

## 速查

- **配置文件**：`.github/dependabot.yml`，顶层 `version: 2`
- **最小条目**：`package-ecosystem` + `directory` + `schedule.interval`
- **PR 上限**：`open-pull-requests-limit`（默认 5，设 `0` 关掉 version updates）
- **只更 / 跳过**：`allow`（`dependency-name`/`dependency-type`）/ `ignore`（另有 `versions`/`update-types`）
- **升级策略**：`versioning-strategy` = `auto` / `increase` / `increase-if-necessary` / `lockfile-only` / `widen`
- **生态**：`package-ecosystem` 支持 npm / pip / uv / gomod / maven / gradle / cargo / docker / github-actions 等 20+
- **分组写法**：`groups.update-types` 用裸 `minor`/`patch`；`ignore.update-types` 用 `version-update:semver-*`
- **合并**：PR 下评论 `@dependabot merge`
- **安全线**：在仓库 Settings 里开 依赖图 + alerts + security updates（**不依赖 yml**）
- **automerge**：GitHub 自动合并开关 + Actions workflow（`dependabot/fetch-metadata` + `gh pr merge --auto`）
- **别与 Renovate 同开** version / security updates（重复 PR）

## dependabot.yml 配置项速查

| 键 | 层级 | 说明 |
| --- | --- | --- |
| `version` | 顶层 | 必填，恒为 `2` |
| `updates` | 顶层 | 必填，更新配置数组 |
| `registries` | 顶层 | 可选，私有源定义 |
| `package-ecosystem` | update | 必填，包管理器（见下表） |
| `directory` / `directories` | update | 必填，清单路径；`directories` 支持 glob |
| `schedule.interval` | update | 必填，`daily`/`weekly`/`monthly`/`quarterly`/`semiannually`/`yearly` |
| `schedule.day` / `time` / `timezone` | update | 可选，`time` 默认 `05:00`、`timezone` 默认 `UTC` |
| `open-pull-requests-limit` | update | 并发 PR 上限，默认 `5`，`0` = 关 version updates |
| `allow` | update | 白名单：`dependency-name` / `dependency-type` |
| `ignore` | update | 黑名单：`dependency-name` / `versions` / `update-types` |
| `versioning-strategy` | update | 见下表 |
| `target-branch` | update | 落到非默认分支 |
| `commit-message` | update | `prefix`（≤50）/ `prefix-development` / `include: scope` |
| `groups` | update | `patterns` / `exclude-patterns` / `dependency-type` / `update-types` / `applies-to` |
| `cooldown` | update | 冷却期：`default-days` / `semver-*-days` |
| `labels` / `reviewers` / `assignees` / `milestone` | update | PR 元信息 |
| `rebase-strategy` | update | `auto`（默认）/ `disabled` |
| `registries` | update | `"*"` 或名称列表，引用顶层定义 |

## package-ecosystem 取值

`npm`（npm/yarn/pnpm）、`bun`、`pip`、`uv`、`bundler`、`gomod`、`maven`、`gradle`、`cargo`、`composer`、`mix`、`pub`、`swift`、`elm`、`nuget`、`dotnet-sdk`、`docker`、`docker-compose`、`helm`、`terraform`、`github-actions`、`gitsubmodule`、`devcontainers` 等（列表持续扩充）。

## versioning-strategy 取值

| 取值 | 行为 |
| --- | --- |
| `auto`（默认） | 应用：抬高最低版本；库：放宽区间容纳新旧版 |
| `increase` | 一律抬高最低版本约束到新版 |
| `increase-if-necessary` | 仅当现约束装不下新版时才抬 |
| `lockfile-only` | 只更锁文件、不动 manifest（部分生态：npm / bundler） |
| `widen` | 放宽区间同时包含新旧版（部分生态：npm / composer） |

## `@dependabot` 评论命令

| 命令 | 作用 |
| --- | --- |
| `@dependabot rebase` | rebase 该 PR |
| `@dependabot recreate` | 重建 PR，覆盖你的修改 |
| `@dependabot merge` | CI 过后合并 |
| `@dependabot squash and merge` | CI 过后 squash 合并 |
| `@dependabot cancel merge` | 取消先前的合并请求 |
| `@dependabot reopen` | 重开已关闭 PR |
| `@dependabot close` | 关闭并阻止重建 |
| `@dependabot show <dependency name> ignore conditions` | 列出该依赖的 ignore 条件 |
| `@dependabot ignore this dependency` | 关闭并不再为该依赖开 PR |
| `@dependabot ignore this major version` | 忽略此大版本 |
| `@dependabot ignore this minor version` | 忽略此小版本 |
| `@dependabot ignore <dependency name> <update type>` | 仅分组 PR：忽略指定版本类型 |
| `@dependabot unignore <dependency name>` | 仅分组 PR：清除全部 ignore 并重开 |
| `@dependabot unignore <dependency name> <ignore condition>` | 仅分组 PR：清除指定 ignore 并重开 |

## 常见坑

- **只开 alerts 不会自动修**——还要单独开 **security updates**。
- **version updates 需要 yml；安全线不需要**——alerts / security updates 是仓库开关。
- **allow / ignore 冲突以 ignore 为准**——先 allow 圈定、再 ignore 剔除。
- **`directory` 不支持通配**——多路径 / glob 要用 `directories`。
- **`groups.update-types` 用裸 `minor`/`patch`；`ignore.update-types` 用 `version-update:semver-*`**——写混不报错但不生效。
- **automerge 要额外 workflow**——Dependabot 自身不合并 PR。
- **别和 Renovate 同时开** version / security updates——会重复开 PR。
- **Dependabot 触发的 workflow `GITHUB_TOKEN` 权限受限**——要显式声明 `permissions`。
- **30 天没合并停止 rebase；长期不理会自动暂停更新**。
- **GitHub Actions 的告警只认 semver tag，不认锁定的 SHA**。

## 权威链接

- [Dependabot 文档首页](https://docs.github.com/en/code-security/dependabot)
- [关于 Dependabot version updates](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/about-dependabot-version-updates)
- [关于 Dependabot security updates](https://docs.github.com/en/code-security/dependabot/dependabot-security-updates/about-dependabot-security-updates)
- [关于 Dependabot alerts](https://docs.github.com/en/code-security/dependabot/dependabot-alerts/about-dependabot-alerts)
- [dependabot.yml options reference](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference)
- [Dependabot 评论命令](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-pull-request-comment-commands)
- [用 GitHub Actions 自动化 Dependabot](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/automating-dependabot-with-github-actions)
- [配置私有 registry 访问](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/configuring-access-to-private-registries-for-dependabot)
- [dependabot-core（引擎源码）](https://github.com/dependabot/dependabot-core)
