---
layout: doc
outline: [2, 3]
---

# 配置详解：dependabot.yml

> 基于 Dependabot（GitHub 原生）· 核于 2026-07

## 速查

- **顶层**：`version: 2`（必填、恒为 2）＋ `updates:`（必填数组）＋ `registries:`（可选，私有源）
- **每条 update 三件套**：`package-ecosystem`（必填）＋ `directory` / `directories`（必填）＋ `schedule.interval`（必填）
- **生态取值**：`npm`（含 yarn / pnpm）、`pip`、`uv`、`bundler`、`gomod`、`maven`、`gradle`、`nuget`、`cargo`、`docker`、`github-actions` 等 20+ 种
- **目录**：`directory` 单路径**不支持通配**；`directories` 支持 **glob**（如 `["/packages/*"]`）
- **节奏**：`interval` 取 `daily` / `weekly` / `monthly` / `quarterly` / `semiannually` / `yearly`；`weekly` 配 `day`；`time` 默认 `05:00`、`timezone` 默认 `UTC`
- **PR 上限**：`open-pull-requests-limit` 默认 **5**（设 `0` 可关掉 version updates、只留安全更新）
- **筛选**：`allow` 白名单（`dependency-name` / `dependency-type`）；`ignore` 黑名单（`dependency-name` / `versions` / `update-types`）；**先 allow 后 ignore，冲突以 ignore 为准**
- **升级策略**：`versioning-strategy` 取 `auto`（默认）/ `increase` / `increase-if-necessary` / `lockfile-only` / `widen`
- **落地分支**：`target-branch` 指定非默认分支
- **提交信息**：`commit-message.prefix`（≤50 字符）/ `prefix-development` / `include: scope`
- **降噪进阶**：`groups` 合并 PR、`cooldown` 冷却期延迟升级、`rebase-strategy: disabled` 关自动 rebase

## 文件骨架

```yaml
# .github/dependabot.yml
version: 2 # 必填，语法版本恒为 2

registries: # 可选：私有源（详见「安全·分组」页）
  # ...

updates: # 必填：每个数组条目 = 一个「生态 + 目录」的更新配置
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

一个仓库里，**同一生态的每个目录都要写一条** `updates` 条目——不能用一条覆盖多个不相关目录（`directories` 的 glob 是例外，见下）。

## package-ecosystem：维护哪种依赖

必填，声明这条配置管哪种包管理器。当前支持的取值（节选，实际持续增加）：

| 取值 | 对应 | 取值 | 对应 |
| --- | --- | --- | --- |
| `npm` | npm / yarn / pnpm | `docker` | Docker 镜像 |
| `bun` | Bun | `docker-compose` | Docker Compose |
| `pip` | pip / Poetry 等 | `github-actions` | workflow 的 `uses:` |
| `uv` | uv（Python） | `terraform` | Terraform |
| `bundler` | Bundler（Ruby） | `gitsubmodule` | Git 子模块 |
| `gomod` | Go Modules | `devcontainers` | Dev Containers |
| `maven` | Maven | `gradle` | Gradle |
| `cargo` | Cargo（Rust） | `nuget` | NuGet（.NET） |
| `composer` | Composer（PHP） | `dotnet-sdk` | .NET SDK |
| `mix` | Mix（Elixir） | `helm` | Helm |
| `pub` | pub（Dart） | `swift` | Swift |
| `elm` | Elm | | |

::: tip github-actions 强烈建议开
它能自动升级 workflow 里 `uses:` 引用的 Action 版本。配合「用 commit SHA 而非 tag 锁定 Action」的安全实践，Dependabot 会把 SHA 抬到新版并在 PR 里标注对应 tag。
:::

## directory / directories：清单在哪

路径相对仓库根，二选一：

- **`directory`**：单个路径，**不支持通配**。如 `"/"`、`"/frontend"`。
- **`directories`**：路径列表，**支持 glob**。monorepo 一条搞定多包：

```yaml
- package-ecosystem: "npm"
  directories:
    - "/apps/*"
    - "/packages/*"
  schedule:
    interval: "weekly"
```

## schedule：多久查一次

`schedule.interval` 必填，控制 **version updates** 的检查频率：

| interval | 含义 |
| --- | --- |
| `daily` | 工作日每天 |
| `weekly` | 每周（默认周一，可用 `day` 改） |
| `monthly` | 每月 1 号 |
| `quarterly` / `semiannually` / `yearly` | 每季 / 每半年 / 每年 |

配套可选项：

```yaml
schedule:
  interval: "weekly"
  day: "monday" # 仅 weekly 生效
  time: "09:00" # 默认 05:00
  timezone: "Asia/Shanghai" # 默认 UTC
```

新版另支持 `cron` 表达式做更细的调度，语法以官方 options reference 为准。

::: warning interval 不等于漏洞实时性
这个节奏只管 **version updates**。漏洞的发现与修复走**安全线**，由 GHSA 公告与依赖图变化实时驱动，不看 `interval`。所以把 `interval` 设成 `daily` 并不会让你「更快修漏洞」，只会让常规升级 PR 更频繁。
:::

## open-pull-requests-limit：并发 PR 上限

限制**同时挂着**的 version update PR 数量，默认 **5**。达到上限后 Dependabot 不再开新 PR，直到你合掉或关掉一些。

```yaml
- package-ecosystem: "npm"
  directory: "/"
  schedule:
    interval: "weekly"
  open-pull-requests-limit: 10 # 放宽到 10
```

- 设 **`0`** 可**关闭该生态的 version updates**（但 security updates 不受此限，仍会开）。
- security updates 有**独立的内部上限（10）**，不受本项影响。

## allow / ignore：只更哪些、跳过哪些

两者可单用或并用。**处理顺序：先按 `allow` 圈定范围，再用 `ignore` 剔除；若一个依赖同时命中 allow 与 ignore，则最终被忽略。**

`allow`（白名单）支持：

- `dependency-name`：包名，支持通配（如 `"aws-sdk-*"`）
- `dependency-type`：`direct`（直接） / `indirect`（间接） / `all` / `production` / `development`

`ignore`（黑名单）支持：

- `dependency-name`：包名，支持通配（如 `"org.springframework.*"`）
- `versions`：版本或区间（如 `">=5.0.0"`、`"4.x"`）
- `update-types`：`version-update:semver-major` / `version-update:semver-minor` / `version-update:semver-patch`

```yaml
- package-ecosystem: "npm"
  directory: "/"
  schedule:
    interval: "weekly"
  # 只维护生产直接依赖
  allow:
    - dependency-type: "production"
  # 跳过 React 的大版本升级（19 → 20 手动来）
  ignore:
    - dependency-name: "react"
      update-types: ["version-update:semver-major"]
    - dependency-name: "@types/*"
      versions: ["< 1.0.0"]
```

::: warning ignore 的 update-types 与 groups 不同名
`ignore.update-types` 用带前缀的 `version-update:semver-major/minor/patch`；而 `groups.update-types`（见「安全·分组」页）用**裸**的 `major` / `minor` / `patch`。写错不会报错，但不生效，是高频坑。
:::

## versioning-strategy：怎么改版本约束

控制 Dependabot 如何修改 manifest 里的版本约束：

| 取值 | 行为 |
| --- | --- |
| `auto`（默认） | 识别为**应用**的依赖抬高最低版本；识别为**库**的依赖放宽区间以同时容纳新旧版 |
| `increase` | 无论应用还是库，都把最低版本约束抬到新版 |
| `increase-if-necessary` | 仅当现有约束「装不下」新版时才抬 |
| `lockfile-only` | 只更**锁文件**、不动 manifest 约束（部分生态如 npm / bundler） |
| `widen` | **放宽**允许区间以同时包含新旧版（部分生态如 npm / composer） |

`lockfile-only` 适合「想跟进锁文件里的解析版本、但不想动 `package.json` 约束」的场景；`widen` 适合发库时保持宽松兼容区间。

## target-branch：落到哪条分支

默认针对仓库默认分支开 PR。指定 `target-branch` 可改为其它分支（同时也会以该分支的清单作为「当前版本」基准）：

```yaml
- package-ecosystem: "npm"
  directory: "/"
  schedule:
    interval: "weekly"
  target-branch: "develop"
```

## commit-message：提交信息前缀

让 Dependabot 的提交符合团队规范（如 Conventional Commits）：

```yaml
commit-message:
  prefix: "chore(deps)" # 生产依赖前缀，≤50 字符
  prefix-development: "chore(dev-deps)" # 开发依赖前缀
  include: "scope" # 在前缀后追加类型（deps / deps-dev）
```

- `prefix-development` 仅部分生态支持（bundler / composer / mix / maven / npm / pip / uv）。
- `include: "scope"` 会把依赖类型（`deps` 或 `deps-dev`）附在 `prefix` 之后，便于按 scope 过滤或触发 release 流水线。

## 其它常用项

| 选项 | 说明 |
| --- | --- |
| `labels` | 自定义 PR 标签（默认含 `dependencies` 等） |
| `reviewers` / `assignees` | 指定 reviewer（用户 / 团队）与 assignee |
| `milestone` | 关联里程碑（填数字 ID） |
| `rebase-strategy` | `auto`（默认）/ `disabled`（关掉自动 rebase） |
| `pull-request-branch-name` | 用 `separator` 自定义分支名分隔符 |
| `vendor` | 直接提交 vendored（内联缓存）依赖 |
| `insecure-external-code-execution` | `allow` / `deny`，是否允许更新时执行外部代码（bundler / mix / pip 相关） |

## cooldown：冷却期

较新的降噪能力——给刚发布的新版设「冷静期」，避免抢先踩到 `x.0.0` 的早期 bug：

```yaml
- package-ecosystem: "npm"
  directory: "/"
  schedule:
    interval: "daily"
  cooldown:
    default-days: 5 # 新版发布 5 天后才升
    semver-major-days: 30 # 大版本多等，30 天
    semver-minor-days: 7
    semver-patch-days: 3
```

## 一份实战配置

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directories:
      - "/apps/*"
      - "/packages/*"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "Asia/Shanghai"
    open-pull-requests-limit: 10
    versioning-strategy: "increase"
    commit-message:
      prefix: "chore(deps)"
      prefix-development: "chore(dev-deps)"
      include: "scope"
    ignore:
      - dependency-name: "react"
        update-types: ["version-update:semver-major"]
    labels: ["dependencies"]

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```
