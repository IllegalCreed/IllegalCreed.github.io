---
layout: doc
outline: [2, 3]
---

# 进阶

> 基于 Renovate · 核于 2026-07

## 速查

- **`automerge`** 默认 `false`；只有**测试通过 + 分支与基线同步**才合，通常需约 **2 小时**窗口，每轮每个基线只合一个分支
- **`automergeType`**：`pr`（默认）/ `branch`（不建 PR，测试失败才建）/ `pr-comment`
- **`platformAutomerge`** 默认 `true`，用平台原生自动合并能力，更快
- **只自动合低风险**：devDependencies、linter / formatter、补丁 / 次要（非 `<1.0.0`）、`lockFileMaintenance`
- **阻塞自动合并**：缺少通过的状态检查、分支保护要求 PR / 评审、CODEOWNERS、提交者限制
- **`lockFileMaintenance`** 定期**重建整个 lock 文件**、拉平间接依赖（默认关，`:maintainLockFilesWeekly` 开启为每周）
- **`minimumReleaseAge`** 让新版本「冷静」若干天再升，躲刚发就撤的坏版本（替代旧的 `stabilityDays`）
- **`internalChecksFilter`** 默认 **`strict`**：稳定期 / Merge Confidence 未过时**不建 PR**；设 `none` 则先建 PR 挂 pending 状态
- **自定义 manager** `customManagers`：`customType` 为 `regex` 或 `jsonata`，用命名捕获组提取依赖
- **组织共享预设**：把配置放一个仓库，各项目 `extends: ["github>org/renovate-config"]` 继承
- **monorepo**：`group:monorepos` 把关联包一起升；按 `matchFileNames` 给不同目录分策略
- **Merge Confidence**：Age / Adoption / Passing / Confidence 徽章，`matchConfidence` 可做自动合并门禁

## 自动合并（automerge）

自动合并让「你本来也会点 merge」的更新无需人工介入。设 `"automerge": true`（建议只在 `packageRules` 里对特定范围开，而非全局）。

### 触发条件与时机

- 只有当**所有必需状态检查通过、且 PR 分支与基线保持同步**时才会合并。
- Renovate 需要找到合适窗口，通常需要**约两小时**；**每轮运行、每个目标分支只合并一个分支**（合并后自动 rebase 其余分支）。
- 自动合并的 PR 上 Renovate **默认不加 assignee / reviewer**（减少噪音），只有测试失败、需要人工介入时才加。

### automergeType

| 值            | 行为                                                            |
| ------------- | --------------------------------------------------------------- |
| `pr`（默认）  | 正常建 PR，测试过后自动合                                       |
| `branch`      | **不建 PR**，直接把更新推到分支；测试通过静默合入，测试失败才建 PR |
| `pr-comment`  | 通过评论触发外部合并机器人（如 bors）                           |

`platformAutomerge`（默认 `true`）会用 GitHub / GitLab 的**原生自动合并**能力，让平台在检查通过后立刻合，比 Renovate 下一轮再合更快。

### 安全策略

官方建议：**「凡是你本来也会直接 merge 的更新，就开自动合并；想读 changelog 的，就别开。」** 低风险子集：

```json
{
  "packageRules": [
    { "matchDepTypes": ["devDependencies"], "matchUpdateTypes": ["minor", "patch"], "automerge": true },
    { "matchManagers": ["github-actions"], "automerge": true },
    { "matchUpdateTypes": ["lockFileMaintenance"], "automerge": true }
  ]
}
```

::: warning 自动合并前提是 CI 靠得住
自动合并会被这些情况阻塞：**没有通过的状态检查**（除非 `ignoreTests: true`，不推荐）、**分支保护要求 PR / 评审**、**CODEOWNERS 要求代码所有者批准**、**提交者限制排除了 Renovate**。要开自动合并，务必先有覆盖到位的 CI，并把 SemVer `<1.0.0` 的包排除（`0.x` 破坏性变更常混在次要 / 补丁里）。
:::

## lock 文件维护（lockFileMaintenance）

普通更新只动被升级的那个依赖。**`lockFileMaintenance`**（默认关）会定期**从头重建整个 lock 文件**，把所有**间接（transitive）依赖**也拉到各自范围内的最新，解决「直接依赖没变、但间接依赖早就过时」的问题。

```json
{
  "lockFileMaintenance": {
    "enabled": true,
    "schedule": ["before 5am on monday"],
    "automerge": true
  }
}
```

`config:best-practices` 里的 `:maintainLockFilesWeekly` 就是把它设为每周一次。因为只动 lock、不动清单，配合自动合并很安全。

## 稳定期：minimumReleaseAge + internalChecksFilter

`minimumReleaseAge` 让新版本先「冷静」一段时间再升，躲开「刚发布几小时就被撤回 / 打补丁」的坏版本：

```json
{
  "minimumReleaseAge": "3 days",
  "internalChecksFilter": "strict"
}
```

- **`minimumReleaseAge`**：如 `"3 days"` / `"2 weeks"`。它替代了旧选项 `stabilityDays`。
- **`internalChecksFilter`** 默认就是 **`strict`**：稳定期（内部状态检查 `renovate/stability-days`）或 Merge Confidence 未通过时，**根本不创建分支 / PR**，直到条件满足。设为 `none` 则**立即建 PR 但挂一个 pending 状态检查**，等够天数后转 passing。

::: tip strict 更省心，但也踩过 bug
`strict`（默认）能避免「早产 PR」，是更安全的默认。历史上有个别版本在某些生态（如 GitHub Actions 大版本）出现过 strict 仍提前建分支的 bug，遇到时升级 Renovate 版本即可。官方最佳实践预设 `config:best-practices` 内置了 `security:minimumReleaseAgeNpm`（npm 新版等 3 天）。
:::

## 自定义 manager（customManagers）

内置 manager 覆盖不到的文件（Shell 脚本里的版本号、CI 变量、自研格式等），用 `customManagers` 靠**正则 / JSONata** 提取依赖。`customType` 取 `regex`（旧名 regexManagers）或 `jsonata`。

最常见的模式：在文件里写「renovate 注释」标注 datasource / depName，再用正则的**命名捕获组**抓取版本：

```json
{
  "customManagers": [
    {
      "customType": "regex",
      "managerFilePatterns": ["/(^|/)Dockerfile$/", "/(^|/).+\\.sh$/"],
      "matchStrings": [
        "# renovate: datasource=(?<datasource>[a-z-]+?) depName=(?<depName>[^\\s]+?)( versioning=(?<versioning>[^\\s]+?))?\\s+[A-Za-z0-9_]+?_VERSION=\"?(?<currentValue>[^\\s\"]+)\"?"
      ],
      "versioningTemplate": "{{#if versioning}}{{{versioning}}}{{else}}semver{{/if}}"
    }
  ]
}
```

对应被扫描的文件：

```bash
# renovate: datasource=github-releases depName=helm/helm
HELM_VERSION="3.16.2"
```

关键字段：

| 字段                    | 作用                                                       |
| ----------------------- | ---------------------------------------------------------- |
| `managerFilePatterns`   | 要扫描的文件（glob 或 `/.../` 正则）；**旧名 `fileMatch`** |
| `matchStrings`          | 带命名捕获组的正则，用来定位并提取依赖                     |
| `matchStringsStrategy`  | 多个 `matchStrings` 的处理方式：`any` / `combination` / `recursive` |
| `datasourceTemplate`    | 指定版本源（也可用捕获组 `datasource` 动态给）             |
| `depNameTemplate`       | 依赖名（可硬编码或来自捕获组）                             |
| `currentValueTemplate`  | 当前版本                                                   |
| `versioningTemplate`    | 版本方案                                                   |

命名捕获组约定：`(?<depName>...)`、`(?<currentValue>...)`、可选的 `(?<datasource>...)` 与 `(?<versioning>...)`。`matchStringsStrategy` 三种：`any`（任一命中）、`combination`（所有模式组合成一条依赖）、`recursive`（层层递归匹配）。`jsonata` 类型则用 JSONata 查询语言处理 JSON / JSONC 结构。

## 组织共享预设

多仓库场景，把配置抽到**一个中心仓库**，各项目继承——改一处、全组织生效：

1. 建一个仓库（如 `org/renovate-config`），根目录放 `default.json`（或 `renovate.json`）：

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:best-practices"],
  "timezone": "Asia/Shanghai",
  "packageRules": [
    { "matchDepTypes": ["devDependencies"], "matchUpdateTypes": ["minor", "patch"], "automerge": true }
  ]
}
```

2. 各业务仓库只写一行继承：

```json
{ "extends": ["github>org/renovate-config"] }
```

引用语法按平台：`github>org/repo`、`gitlab>org/repo`、`local>org/repo`（同平台内部，自托管常用）。预设还支持**带参数**和**指定子路径 / 分支**（如 `github>org/repo:path/file#branch`）。记住 `extends` 里**后者覆盖前者**，仓库本地配置覆盖继承来的预设。

## monorepo

Renovate 对 monorepo 支持成熟：

- **`group:monorepos`**（`config:recommended` 已含）会把**同一 monorepo 发布的关联包**（如某框架的一组 `@scope/*`）合到一个 PR 里一起升，避免版本错配。
- 感知 npm / pnpm / yarn workspaces、Lerna 等结构，正确处理内部包与共享 lock。
- 用 `matchFileNames` 按目录给不同子项目定制策略：

```json
{
  "packageRules": [
    { "matchFileNames": ["packages/legacy/**"], "enabled": false },
    { "matchFileNames": ["apps/web/**"], "rangeStrategy": "pin", "automerge": true }
  ]
}
```

## Merge Confidence

Merge Confidence 是 Mend **免费提供**的数据，评估某次升级引入破坏性变更的风险，在 PR 正文显示四个徽章：

| 徽章       | 含义                                             |
| ---------- | ------------------------------------------------ |
| Age        | 版本发布了多久                                   |
| Adoption   | Renovate 用户中已升到该版本的比例                |
| Passing    | 该包升级中测试通过的比例                          |
| Confidence | 综合评级：Low / Neutral / High / Very High        |

- 托管 App 自动启用；**自托管**在 `extends` 加 `mergeConfidence:all-badges`（或只显示 Age + Confidence 的 `mergeConfidence:age-confidence-badges`，后者已被 `config:recommended` 包含）。
- 支持 Go、JavaScript、Java、Python、.NET、PHP、Ruby。
- 可用 `matchConfidence` 做**自动合并门禁**——只自动合最稳的更新：

```json
{
  "packageRules": [
    { "matchUpdateTypes": ["minor", "patch"], "matchConfidence": ["high", "very high"], "automerge": true }
  ]
}
```

::: tip npm 的 High 需 3 天
因 npm 有 72 小时内可 unpublish 的政策，npm 包发布满 **3 天**才可能给到 High 评级。`matchConfidence` 需要数据源可用（自托管完整数据可能需配置 Merge Confidence API token）。
:::
