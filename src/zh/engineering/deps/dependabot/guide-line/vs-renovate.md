---
layout: doc
outline: [2, 3]
---

# 与 Renovate 取舍

> 基于 Dependabot（GitHub 原生）· 核于 2026-07

## 速查

- **一句话**：Dependabot ＝ GitHub 原生、简单、够用；Renovate ＝ 跨平台、超能配、开箱 automerge
- **平台**：Dependabot **仅 GitHub**；Renovate 覆盖 GitHub / GitLab / Bitbucket / Gitea / Forgejo / Azure DevOps 等
- **配置**：Dependabot `.github/dependabot.yml`（克制）；Renovate `renovate.json` + **presets 可复用配置**
- **自动合并**：Dependabot 需「**GitHub 自动合并开关 + Actions workflow**」两件套；Renovate **内置 `automerge`**
- **仪表盘**：Renovate 有 **Dependency Dashboard**（Issue 汇总 / 手动触发）；Dependabot 无
- **接入**：Dependabot 开箱即用；Renovate 走 **Mend 托管 App** 或自托管（npm / Docker）
- **规则粒度**：Renovate `packageRules` 极细；Dependabot `allow` / `ignore` / `groups` 够日常
- **安全**：Dependabot 的 alerts / security updates 与 GitHub Security 面板深度一体
- **依赖替换**：Renovate 有 replacement PR（迁移废弃包）；Dependabot 无
- **迁移**：从 Dependabot 迁 Renovate 先关 version updates；**alerts 是平台能力可保留**，不冲突
- **别同时开**：两者一起跑会对同一依赖开重复 PR，version / security updates **二选一**

## 两者定位

Dependabot 和 Renovate 解决同一件事——**自动追踪依赖、开升级 PR**——但取向不同：

- **Dependabot**：GitHub 的「自带电池」。哲学是**克制**：配置项少、开箱即用、和 GitHub 安全生态一体。你几乎不用做决策，也做不了太细的决策。
- **Renovate**：由 Mend 维护的独立工具（开源 npm 包 / Docker 镜像 / Mend 托管 GitHub App）。哲学是**万能**：跨平台、配置极其丰富、预设可复用、内置自动合并与仪表盘。强大的代价是学习曲线更陡。

## 能力对比

| 维度 | Dependabot | Renovate |
| --- | --- | --- |
| 平台 | 仅 GitHub | GitHub / GitLab / Bitbucket / Gitea / Forgejo / Azure DevOps 等 |
| 接入 | 平台内置，开箱即用 | Mend 托管 App 或自托管（npm / Docker） |
| 配置文件 | `.github/dependabot.yml` | `renovate.json`（及多种位置 / 格式） |
| 可复用配置 | 无（靠复制粘贴） | **presets**（类似 ESLint 的 `extends`） |
| 规则粒度 | `allow` / `ignore` / `groups` | `packageRules`（正则、条件、极细） |
| 分组 | `groups`（够用） | 分组能力更强、预设更多 |
| 自动合并 | **需额外配** GitHub 自动合并 + workflow | **内置** `"automerge": true` |
| 仪表盘 | 无 | **Dependency Dashboard**（Issue） |
| 依赖替换 | 无 | **replacement PR**（迁移废弃包到社区替代） |
| 安全告警 / 修复 | 与 GitHub Security 面板一体（alerts + security updates） | 依赖 GitHub 平台的 alerts；自身也可做漏洞感知 |

## automerge：Dependabot 要额外搭两件套

Dependabot **本身不合并 PR**（只负责开）。要实现自动合并，得搭两件套：

1. 打开仓库 / 组织的 **GitHub 自动合并（auto-merge）** 能力，并配好分支保护 / 必需检查（合并前置条件）。
2. 写一个 Actions workflow：用 `dependabot/fetch-metadata` 读出 PR 的 `update-type` 等元数据，判断（如仅 patch）后调 `gh pr merge --auto` 打开该 PR 的自动合并。

```yaml
name: Dependabot auto-merge
on: pull_request

permissions:
  contents: write
  pull-requests: write

jobs:
  automerge:
    runs-on: ubuntu-latest
    # 只处理 Dependabot 开的 PR
    if: github.event.pull_request.user.login == 'dependabot[bot]'
    steps:
      - name: Fetch metadata
        id: meta
        uses: dependabot/fetch-metadata@v2
      - name: Enable auto-merge for patch
        if: steps.meta.outputs.update-type == 'version-update:semver-patch'
        run: gh pr merge --auto --squash "$PR_URL"
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

几个坑：

- **权限受限**：Dependabot 触发的 workflow 里 `GITHUB_TOKEN` 默认权限被收紧，需在 workflow 里显式声明 `permissions`。
- **始终会跑**：Dependabot 的 workflow 会执行，**即便组织 / 仓库层面关闭了 Actions**。
- **合并队列**：目标分支启用 merge queue 时，`GITHUB_TOKEN` **无法把 PR 加入队列**，需改用 PAT 或 GitHub App token。
- **对比**：同样的事 Renovate 只需一行 `"automerge": true`（外加相应的合并前置条件）。

## 什么时候选谁

- **选 Dependabot**：项目就在 GitHub、团队不大、想零运维、主要诉求是**安全告警与漏洞修复** + 基础版本更新。开箱即用，和 Security 面板一体。
- **选 Renovate**：需要**多平台 / 多仓库统一策略**、想要**开箱 automerge + 仪表盘**、需要 monorepo 精细分组或基于正则的 `packageRules`、或想用 preset 复用一套依赖策略。

## 不要同时开

在同一仓库同时跑两个机器人，会对**同一依赖开出重复 PR**、互相制造冲突。**version / security updates 二选一**。

一个务实的迁移姿势：从 Dependabot 迁到 Renovate 时，**先关掉 Dependabot 的 version updates**（把 `dependabot.yml` 删掉或清空 `updates`）。而 **Dependabot alerts 是 GitHub 平台能力**，与 Renovate 开 PR 不冲突，可以保留继续报警。
