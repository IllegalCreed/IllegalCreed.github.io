---
layout: doc
outline: [2, 3]
---

# 配置

> 基于 Renovate · 核于 2026-07

## 速查

- **`packageRules`** 是核心：一个规则内多个 `match*` 条件是 **AND**（全部命中才生效）
- **`matchPackageNames`** 现在同时支持 **精确 / glob / 正则 / 取反**：`react`、`@types/**`、`/^eslint/`、`!renovate`
- **v38 起废弃** `matchPackagePatterns` / `matchPackagePrefixes`，统一并入 `matchPackageNames`
- **`matchUpdateTypes`**：`major` / `minor` / `patch` / `pin` / `digest` / `lockFileMaintenance` 等
- **分组**：给 `packageRules` 加 `groupName` 把多个依赖并成一个 PR；`config:recommended` 已含 `group:monorepos`
- **`schedule`** 只限制「**创建**分支 / PR 的时机」，不限制合并；已开 PR 仍会被更新
- **`timezone`** 默认 **UTC**，用 IANA 名（如 `Asia/Shanghai`）；cron 用 5 段、分钟位必须是 `*`，最小粒度 1 小时
- **`rangeStrategy`** 默认 `auto`；可选 `pin` / `bump` / `replace` / `widen` / `update-lockfile` / `in-range-only`
- **忽略依赖**：`ignoreDeps`（按名）或 `packageRules` 里 `enabled: false`；忽略路径用 `ignorePaths`
- **`dependencyDashboard`**：一个 issue 总览待办 / 限流中 / 已开 / 出错 / 被忽略的更新，支持勾选触发操作
- **限流**：`prConcurrentLimit` 默认 **10**、`prHourlyLimit` 默认 **2**、`branchConcurrentLimit` 默认 `null`（继承前者）
- **预设冲突**：`extends` 数组里**后者覆盖前者**（last wins）

## packageRules：匹配 + 策略

`packageRules` 是一个规则对象数组。Renovate 对每个依赖逐条检查规则：**一条规则里的所有 `match*` 条件都命中（AND 逻辑），该规则的其余配置才应用到这个依赖**。多条规则按顺序叠加，后面的覆盖前面的。

### 常用匹配器（match\*）

| 匹配器              | 匹配对象                                                     |
| ------------------- | ------------------------------------------------------------ |
| `matchPackageNames` | 包名（支持精确 / glob / 正则 / 取反，见下）                  |
| `matchDepNames`     | 依赖名（与 packageName 的区别在个别生态才明显）              |
| `matchDepTypes`     | 依赖类型：`dependencies` / `devDependencies` / `peerDependencies` 等 |
| `matchManagers`     | 提取器：`npm` / `dockerfile` / `github-actions` / `terraform` 等 |
| `matchDatasources`  | 版本源：`npm` / `docker` / `go` / `github-releases` 等        |
| `matchUpdateTypes`  | 更新类型：`major` / `minor` / `patch` / `pin` / `digest` / `lockFileMaintenance` |
| `matchCurrentVersion` | 当前版本（可写具体版本或范围）                             |
| `matchFileNames`    | 命中的文件路径（monorepo 里按目录分策略常用）                |
| `matchConfidence`   | Merge Confidence 等级（需数据源，见 [进阶](./advanced.md#merge-confidence)） |

### matchPackageNames 的四种写法（v38 后）

::: warning matchPackagePatterns 已废弃
早期用 `matchPackagePatterns`（正则）、`matchPackagePrefixes`（前缀）等一堆选项。**Renovate v38 起把它们全部废弃并合并进 `matchPackageNames`**，后者现在自身就支持四种语义。配置校验器会自动迁移旧写法。
:::

```json
{
  "packageRules": [
    { "matchPackageNames": ["react", "react-dom"] },
    { "matchPackageNames": ["@types/**"] },
    { "matchPackageNames": ["/^@aws-sdk//"] },
    { "matchPackageNames": ["*", "!renovate"] }
  ]
}
```

- **精确**：`"react"` —— 完整包名。
- **glob**：`"@types/**"` —— 非正则字符串按 glob 解析（minimatch），匹配所有 `@types/` 包。
- **正则**：`"/^@aws-sdk//"` —— 用一对斜杠 `/.../` 包起来的是正则（re2 引擎，**默认区分大小写**，加 `i` 标志忽略）。
- **取反**：`"!renovate"` —— `!` 前缀表示排除，与其它模式组合使用。

### 策略示例

给 devDependencies 打标签 + 分配审阅人：

```json
{
  "packageRules": [
    {
      "matchDepTypes": ["devDependencies"],
      "addLabels": ["dev-deps"],
      "reviewers": ["team:frontend"]
    }
  ]
}
```

对某类 manager 单独排期（只在周一凌晨升 GitHub Actions）：

```json
{
  "packageRules": [
    { "matchManagers": ["github-actions"], "schedule": ["* 0-3 * * 1"] }
  ]
}
```

::: tip `addLabels` vs `labels`
`labels` 会**替换**默认标签，`addLabels` 是**追加**。分组 / 分类打标签时优先用 `addLabels`，避免覆盖预设加好的标签。
:::

## 分组（grouping）

默认 Renovate「一个依赖一个 PR」。给 `packageRules` 加 **`groupName`** 就能把多个依赖并成**一个 PR**，是最有效的降噪手段。

把所有 `@types/*` 并成一个 PR：

```json
{
  "packageRules": [
    { "matchPackageNames": ["@types/**"], "groupName": "type definitions" }
  ]
}
```

把所有非大版本更新并成一个 PR：

```json
{
  "packageRules": [
    { "matchUpdateTypes": ["minor", "patch"], "groupName": "non-major" }
  ]
}
```

也可以直接用官方分组预设（写进 `extends`）：

| 预设                    | 作用                                       |
| ----------------------- | ------------------------------------------ |
| `group:monorepos`       | 把已知 monorepo 的关联包一起升（recommended 已含） |
| `group:recommended`     | 一批社区维护的常见关联分组（recommended 已含）   |
| `group:allNonMajor`     | 所有次要 + 补丁更新合成一个 PR             |
| `group:definitelyTyped` | 把 `@types/*` 归组                          |

::: tip `groupName` 相同即同组
不同 `packageRules` 里写**相同的 `groupName`** 会被合进同一个 PR / 分支，可跨规则聚合。`groupSlug` 用来自定义分支名里的短标识。
:::

## 排期（schedule）

`schedule` 限制 Renovate **创建新分支 / PR 的时间窗口**（默认 `["at any time"]` 无限制）。注意两点：

- 它限制的是**创建**，**不限制合并**；窗口外**已存在的 PR 仍会被更新**（如 rebase）。
- 需要 Renovate 本轮真的在跑（托管 App 由 Mend 触发；自托管由你的 cron 触发），schedule 才有意义。

推荐用 **cron 语法**（5 段，**分钟位必须是 `*`**，最小粒度 1 小时）：

```json
{
  "schedule": ["* 0-4 * * *"],
  "timezone": "Asia/Shanghai"
}
```

常见 cron 片段：

| 需求            | cron              |
| --------------- | ----------------- |
| 每天凌晨 0-4 点 | `* 0-4 * * *`     |
| 仅周末          | `* * * * 0,6`     |
| 工作日晚 10 到早 5 | `* 22-23,0-4 * * 1-5` |
| 仅周一          | `* * * * 1`       |

也可以直接用排期预设：`schedule:earlyMondays`、`schedule:weekly`、`schedule:monthly`、`schedule:nonOfficeHours`（非工作时间 + 周末）、`schedule:weekends` 等。

::: warning 时区默认 UTC
`timezone` 不设就是 **UTC**，容易让「凌晨」窗口错开。跨时区团队务必显式设 IANA 名（如 `Asia/Shanghai`）。另外，Renovate 早期支持的 `@breejs/later` 自然语言排期已不推荐，新配置一律用 cron。
:::

## rangeStrategy：版本范围怎么改

`rangeStrategy` 决定 Renovate 如何修改**清单文件里的版本范围**（如 `^1.0.0`），**默认 `auto`**。这是「应用 vs 库」策略的核心开关。

以现有范围 `^1.0.0`、新版本 `1.1.0`（在范围内）/ `2.0.0`（超范围）为例：

| 策略               | 行为                                                          | `^1.0.0` 遇 1.1.0 / 2.0.0            |
| ------------------ | ------------------------------------------------------------- | ----------------------------------- |
| `auto`（默认）     | Renovate 自行选择（多数 manager ≈ `replace`）                 | —                                   |
| `pin`              | 锁成精确版本                                                  | → `1.1.0`（应用推荐）                |
| `bump`             | 抬高范围下界、保留范围符号（**范围内也提 PR**）               | `^1.0.0` → `^1.1.0`                  |
| `replace`          | 仅当新版本**超出**范围时替换范围，范围内只更新 lock           | 范围内不改清单；`2.0.0` → `^2.0.0`   |
| `widen`            | 扩宽范围以包含新版本（常用于 peerDependencies）               | → `^1.0.0 \|\| ^2.0.0`               |
| `update-lockfile`  | 范围内更新只改 lock；超范围才退回 `replace` 改清单            | 1.1.0 只改 lock；2.0.0 → `^2.0.0`    |
| `in-range-only`    | **只更新 lock**，永不改清单；超范围的更新直接跳过             | 1.1.0 只改 lock；2.0.0 忽略          |

选型经验：

- **应用（app）**：`pin` 锁死精确版本 + lock 文件，坏版本会以「失败的 PR」暴露，而不是静默升级。
- **库（library）**：保留范围（`replace` / `widen`），避免下游 `node_modules` 里出现重复副本。
- **只想让 lock 跟进、不想动清单**：`update-lockfile` 或 `in-range-only`。

::: tip 锁版本的坑在「可见性」而非 lock 文件
即使有 lock 文件，`package.json` 里的 `^1.1.0` 仍**允许**安装刚发布的坏版本 `1.2.0`——只是延迟到有人 `install` 时才踩雷。`pin` 到精确版本后，坏版本会变成一个**失败的升级 PR**，你自然不会合。pin 与 lock 各司其职，应用建议两者都用。详见 [官方 Dependency Pinning](https://docs.renovatebot.com/dependency-pinning/)。
:::

## 忽略依赖

不想让某些依赖被更新，有几种方式：

```json
{
  "ignoreDeps": ["left-pad", "some-legacy-lib"],
  "packageRules": [
    { "matchPackageNames": ["/^@internal//"], "enabled": false },
    { "matchDepNames": ["node"], "matchCurrentVersion": ">=18", "enabled": false }
  ],
  "ignorePaths": ["**/fixtures/**", "**/__tests__/**"]
}
```

- **`ignoreDeps`**：按名忽略，最直接。
- **`packageRules` + `enabled: false`**：按任意匹配条件精细关闭（支持 glob / 正则 / 版本条件）。
- **`ignorePaths`**：整块路径不扫描（如测试夹具、示例目录）。

## Dependency Dashboard（依赖面板）

面板是 Renovate 在仓库里开的**一个 issue**，总览所有依赖更新状态，`config:recommended` 默认已开（也可 `"dependencyDashboard": true` 或 `extends: [":dependencyDashboard"]`）。

它展示：待处理更新、因排期 / 限流而等待中的更新、已开 PR、出错项、被忽略 / 废弃并有替代建议的包。你可以**勾选面板里的复选框**来触发操作，例如强制现在就创建某个被限流的 PR、重试出错项等（平台需支持带动态 Markdown 复选框的 issue）。

常用相关选项：

| 选项                            | 作用                                                     |
| ------------------------------- | -------------------------------------------------------- |
| `dependencyDashboardTitle`      | 面板 issue 标题（默认 `Dependency Dashboard`）           |
| `dependencyDashboardApproval`   | 要求**先在面板勾选批准**才创建 PR（下方详述）            |
| `dependencyDashboardLabels`     | 给面板 issue 打标签                                      |
| `dependencyDashboardAutoclose`  | 无待办时自动关闭面板 issue                               |

::: tip 用「面板审批」把主动权收回来
设 `dependencyDashboardApproval: true`（或用 `:dependencyDashboardApproval` 预设）后，Renovate **不主动提 PR**，而是把待更新列在面板上，你勾选哪个才提哪个——适合大版本更新或想严格控制节奏的场景。可只对 `major` 或特定包开启。**注意：安全 / 漏洞修复 PR 会绕过审批，直接创建。**
:::

## 限流（rate limiting）

首次接入或依赖很多时，Renovate 可能一次性提出大量 PR。用这三个选项收敛：

| 选项                    | 默认   | 作用                                            |
| ----------------------- | ------ | ----------------------------------------------- |
| `prConcurrentLimit`     | `10`   | 同时开着的 Renovate PR 上限（`0` = 不限）        |
| `prHourlyLimit`         | `2`    | 每小时新建 PR 上限（`0` = 不限）                 |
| `branchConcurrentLimit` | `null` | 同时存在的分支上限；`null` 时继承 `prConcurrentLimit` |

```json
{
  "prConcurrentLimit": 5,
  "prHourlyLimit": 2
}
```

::: tip 多数仓库把并发调低更顺
官方经验：把 `prConcurrentLimit` 调到 `3`~`5` 往往比默认 `10` 更好推进——PR 堆到上限后，Renovate 会等你合并 / 关闭已有 PR 才继续开新的，形成稳定节奏。达到上限的更新会在 Dependency Dashboard 上标为「限流中」。
:::

更激进的降噪（分组 + 排期 + 自动合并）见 [进阶](./advanced.md)。
