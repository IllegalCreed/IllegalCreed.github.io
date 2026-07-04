---
layout: doc
outline: [2, 3]
---

# 安全更新与 Dependabot 对比

> 基于 Renovate · 核于 2026-07

## 速查

- **安全更新绕过限制**：漏洞 / 安全修复 PR **绕过 `schedule`、限流、Dependency Dashboard 审批**，尽快创建
- **`vulnerabilityAlerts`**：定制安全 PR 的行为（标签、`vulnerabilityFixStrategy` 等）
- **`osvVulnerabilityAlerts`**：接入 **OSV** 漏洞数据库，含**恶意包检测**
- **GitHub 平台**：Renovate 用 **GitHub Security Advisories**；`:enableVulnerabilityAlerts` 预设开启
- **面板摘要**：`dependencyDashboardOSVVulnerabilitySummary` 在面板汇总漏洞
- **Dependabot** 是 **GitHub 原生**、内置免费、MIT、Ruby 实现，也是 GitHub 安全告警的底座
- **Renovate** 覆盖 **9 个平台**、AGPL、TypeScript，分组 / 排期 / monorepo / 自定义 manager 更强
- **分组差异**：Renovate 可把上百更新并一个 PR + 自定义排期；Dependabot 分组能力弱、默认每依赖每天一个 PR
- **排期差异**：Renovate 支持每包 / 每 manager / 全局 + cron；Dependabot 只有生态级 interval/day/time
- **面板**：Renovate 有 Dependency Dashboard；Dependabot 无
- **选型**：只在 GitHub、想零配置 → Dependabot；要分组 / 精细排期 / monorepo / 冷门生态 → Renovate
- **二选一**：**别对同一生态同时开两者**，否则重复 PR + 相互打架

## 安全 / 漏洞更新

Renovate 除了「跟进新版本」，也能专门**修漏洞**。它从漏洞数据库比对当前依赖，为受影响的包**优先**提修复 PR。

### 数据源

- **GitHub 平台**：使用 **GitHub Security Advisories**（GHSA）。用 `:enableVulnerabilityAlerts` 预设或 `vulnerabilityAlerts` 配置启用。
- **`osvVulnerabilityAlerts`**：接入 Google 的 **OSV（Open Source Vulnerability）数据库**，跨平台可用，并包含**恶意包检测与防护**。

### 关键行为：安全更新会「插队」

漏洞 / 安全修复 PR 享有特殊待遇——**绕过 `schedule` 排期、绕过 `prConcurrentLimit` / `prHourlyLimit` 限流、绕过 Dependency Dashboard 审批**，尽快创建，确保安全问题不被你设置的降噪规则拖住。

### 配置示例

```json
{
  "extends": ["config:recommended"],
  "osvVulnerabilityAlerts": true,
  "vulnerabilityAlerts": {
    "labels": ["security"],
    "addLabels": ["priority-high"]
  },
  "dependencyDashboardOSVVulnerabilitySummary": "unresolved"
}
```

`vulnerabilityAlerts` 是一个配置对象，用来专门定制安全 PR：打标签、指定 `vulnerabilityFixStrategy`（最低修复 vs 直接升到最新）等。`dependencyDashboardOSVVulnerabilitySummary` 会把 OSV 漏洞汇总到 Dependency Dashboard，一眼看清未处理漏洞。

::: tip 安全更新要不要自动合并？
安全修复既紧急又通常是补丁级，很多团队会对 `vulnerabilityAlerts` 单独开自动合并。但仍要有 CI 兜底——安全补丁偶尔也会带破坏性变更。
:::

## 与 Dependabot 对比

两者都是「自动提 PR 升级依赖」的机器人，定位重叠但取舍不同。以下按官方 [Bot comparison](https://docs.renovatebot.com/bot-comparison/) 与实际差异整理：

| 维度            | Renovate                                              | Dependabot                                     |
| --------------- | ----------------------------------------------------- | ---------------------------------------------- |
| 平台            | GitHub、GitLab、Bitbucket、Azure DevOps、Gitea / Forgejo、Gerrit 等 **9 个** | 官方主要支持 **GitHub**、Azure DevOps           |
| 内置性          | 需装 App 或自托管                                     | **GitHub 原生内置**，公私仓免费，零安装         |
| 许可 / 语言     | AGPL-3.0 / TypeScript                                 | MIT / Ruby                                     |
| 配置            | `renovate.json`（JSON5、预设、`packageRules` 分层）    | `.github/dependabot.yml`（每生态一个 entry，简单直接） |
| 分组            | 极强：任意条件分组、上百更新并一个 PR、monorepo 预设   | 有 grouped updates，但更粗；**不合并常见 monorepo 包** |
| 排期            | 每包 / 每 manager / 全局 + cron                       | 仅生态级 interval / day / time / timezone       |
| 依赖面板        | **Dependency Dashboard** 总览 + 可交互                | 无                                             |
| 兼容性信息      | 四徽章：Age / Adoption / Passing / Confidence          | 一个 compatibility score                        |
| 自定义 manager  | 支持 `customManagers`（正则 / JSONata）扫任意文件      | 不支持，仅限内置生态                            |
| 自托管          | npm / Docker / GitHub Action / GitLab Runner / CE·EE   | GitHub Actions / `dependabot-core` / 社区脚本   |
| 安全告警        | GHSA + OSV，可自定义修复策略                           | GitHub 安全告警的底座，开箱即用                 |

## 如何取舍

**选 Dependabot：** 你只在 GitHub、想要零配置、能接受「每个依赖一个 PR」的默认节奏。它内置在 GitHub 里、公私仓免费、也是 GitHub Security Alerts 的底层引擎——对小项目和「只要能自动升级就行」的场景最省事。

**选 Renovate：** 你需要以下任一能力——把一批更新**分组**成一个 PR（如所有 `@types/*`）、**精细排期**（只在周末 / 非工作时间 / 每月）、**monorepo** 按路径分策略、**只刷新 lock**、或覆盖 **Bazel / Helm / Terraform / pre-commit** 等冷门生态；或者你根本不在 GitHub 上。

## 二选一：不要同时开

::: warning 别对同一生态同时跑两个机器人
Renovate 和 Dependabot 若对同一生态同时启用，会**各提各的 PR**，导致重复、版本互相打架、审阅噪音翻倍。**同一仓库（同一生态）只保留一个**。

- 迁 **Dependabot → Renovate**：删掉 `.github/dependabot.yml`（或只保留 Dependabot 的 security updates、把日常版本更新交给 Renovate），再装 Renovate。
- 想保留 GitHub 的安全告警展示：可以让 Dependabot 只做 security alerts 展示、Renovate 做全部更新 PR——但要确认不会对同一漏洞重复提 PR。
:::

回到日常配置见 [配置](./config.md)，自托管部署见 [自托管](./self-hosting.md)。
