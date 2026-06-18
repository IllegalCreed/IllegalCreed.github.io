---
layout: doc
outline: [2, 3]
---

# 指南 - Git 与 GitHub 集成

> 基于 Sapling 官方文档（2026-06 调研）编写

## 速查

- **Git 兼容**：`sl clone https://github.com/facebook/sapling` 可直接 clone 并操作 GitHub 上的 Git 仓库
- **认证前提**：装 GitHub CLI 并 `gh auth login --git-protocol https`；改 `.github/workflows/` 需 `gh auth refresh -s workflow`（否则 `sl pr submit` 报 `UNAUTHORIZED-WRITE`）
- 🔴 **三种 PR 路径别混**：
  - `sl pr submit`（栈式 `--stack`）= **overlapping（重叠）PR**，GitHub 原生 UI 显示差，**推荐配 ReviewStack 评审**
  - `sl ghstack` = **non-overlapping（非重叠）PR**（ISL 中可选）
  - `sl push --to remote/<feature>` = **单分支单 PR**（再去网页建 PR，更新用 `sl push -f`）
- **ReviewStack**：堆叠 PR 评审工具，只显示每个 PR 真正要看的那个 commit；域名 **reviewstack.dev**；配置 `sl config --user github.pull_request_domain reviewstack.dev`
- **PR revset**：`sl goto pr123` 直接 checkout 某 PR；关联修复 `sl pr link` / `sl pr unlink`
- **两种 Git 模式**：`.git` 模式（`git`+`sl` 共存，渐进引入，有诸多限制）vs `.sl` 模式（纯 `sl`，解锁扩展特性但无原生 `git` 命令）
- 🔴 **EdenFS / Mononoke 未公开**：虚拟文件系统 EdenFS 与服务端 Mononoke「源码有但未进公开发布版 / 尚未公开支持」——开源用户 `brew install` 后**只有 CLI + ISL + Git 兼容部分**，没有大仓虚拟文件系统

## Git 兼容：直接操作 GitHub 仓库

Sapling 的三大支柱之一就是 **Git Integration**——可以直接 clone 与操作 GitHub 上的标准 Git 仓库：

```bash
sl clone https://github.com/facebook/sapling
```

要操作 GitHub PR，需先装并认证 **GitHub CLI（`gh`）**：

```bash
gh auth login --git-protocol https
```

::: warning workflow 权限坑
Sapling 需要 PAT 才能操作 PR。`gh` 默认 scope（`repo` / `read:org` / `gist`）**不含 `workflow`**。若你的 PR 改动了 `.github/workflows/` 下的文件，必须先补权限，否则 `sl pr submit` 会报 `UNAUTHORIZED-WRITE`：

```bash
gh auth refresh -s workflow
```

凭据缓存后，`sl ssl` 才能在 smartlog 里显示 PR 状态。
:::

## 三种 PR 提交路径（别混用）

这是 Sapling + GitHub 最容易出错的地方——**三条路径语义不同，配套评审方式也不同**：

| 路径 | 命令 | 产物 | 评审方式 |
| --- | --- | --- | --- |
| **Sapling Stack** | `sl pr submit`（栈式 `sl pr submit --stack` / `sl pr s -s`） | **重叠（overlapping）PR**：每个 PR 含目标 commit + 其下方所有 commit | GitHub 原生 UI 显示不佳，**推荐 ReviewStack** |
| **ghstack** | `sl ghstack` | **非重叠（non-overlapping）PR**（ISL 中可选） | 各 PR 边界清晰 |
| **单 PR push** | `sl push --to remote/my-feature` | 创建一个 Git 分支，每分支一个 PR | 去 GitHub 网页建/编辑 PR，更新用 `sl push -f` |

::: danger 关键区分
- `sl pr submit` 产生的是 **overlapping** PR（PR 之间内容重叠），适用于任何 GitHub 仓库，但在 GitHub 网页直接看会很乱，所以**官方推荐用 ReviewStack 评审**。
- `sl ghstack` 产生的是 **non-overlapping** PR，与前者**不是一回事**，别把两个命令混着记。
- `sl push --to` 是最「传统」的一条：单分支、单 PR、控制精确、可网页编辑，代价是多点几下网页。
:::

其他实用项：

```bash
sl goto pr123        # 用 pr revset 直接 checkout 某个 GitHub PR
sl pr link           # 修复本地 commit 与 PR 关联不一致
sl pr unlink
# 无写权限时（Fork 工作流）：
sl paths --add my-fork ssh://git@github.com/<user>/sapling.git
sl push --to my-fork/my-feature
```

## ReviewStack：堆叠 PR 的评审

`sl pr submit` 产生的重叠 PR 在 GitHub 原生 UI 上很难评审（每个 PR 都把下方堆叠的 commit 也带进来）。**ReviewStack** 专为此设计——它**只显示每个 PR 真正要评审的那个 commit**，过滤掉下方堆叠部分，大幅改善体验。

```bash
sl config --user github.pull_request_domain reviewstack.dev
```

::: tip ReviewStack 要点
- 域名是 **reviewstack.dev**，配置项是 `github.pull_request_domain`。
- 它是「堆叠 PR 评审」工具，配合 `sl pr submit` 的 overlapping PR 使用，不是另一种提交方式。
:::

## 两种 Git 支持模式

Sapling 仓库有两种元数据形态，决定了能否跑原生 `git` 命令、能否解锁扩展特性：

| | **`.git` 模式** | **`.sl` 模式** |
| --- | --- | --- |
| 创建 | `git clone` / `git init` | `sl clone` / `sl init` |
| 元数据目录 | `.git`（Sapling 额外特性写入 `.git/sl`） | `.sl` |
| 原生 `git` 命令 | ✅ 完全可用（`git` 和 `sl` 都能跑） | ❌ 不支持（但 Git 与 Mononoke 网络协议都能用） |
| 适用 | 已用 Git 的团队，想**渐进式引入** Sapling | 大规模开发，需特殊存储 / 文件系统优化 |
| 扩展特性 | 受限 | ✅ Watchman、EdenFS、Mononoke 协议 |

::: warning `.git` 模式的已知限制（坑）
- `sl add` 可能不反映到 `git status` / `git commit`；
- Git LFS 仅部分支持；
- `sl` 可能留下 **detached HEAD**，之后用 `git checkout` 有**丢 commit 风险**；
- 不支持本地 tag（远程 tag 用 `origin/tags/v1.0` 形式）；submodule 支持不完整；
- `sl rebase` 中断只能 `sl rebase --continue`，**不能**切到 `git rebase --continue`。

官方文档**未提供两种模式之间的转换方法**。
:::

## Working at Scale：EdenFS 与 Mononoke 的边界

Sapling「能扩展到数千万文件」的承诺，靠的是两个组件——但它们对开源用户而言**暂不可用**：

| 组件 | 作用 | 公开状态 |
| --- | --- | --- |
| **EdenFS** | 虚拟文件系统，**按需填充文件**，让大仓 `goto` 等操作更快 | ⚠️ **源码有，但未进公开发布版**（目前 Meta 内部用） |
| **Mononoke** | 分布式服务端（Rust），专用协议让 clone/pull ≈ O(merges) | ⚠️ **Meta 生产就绪，但尚未公开支持** |
| **Watchman** | 文件变更监听，把状态跟踪降到 O(改动文件) | ✅ 可用（`.sl` 模式启用） |

::: danger 务必厘清：开源用户得到的是哪一部分
把 Sapling 扩展能力**完整发挥**，需要 **Sapling 服务端（Mononoke）+ 虚拟文件系统（EdenFS）**，而这两者**目前仅 Meta 内部可用**。

通过 `brew install sapling` 安装的开源版本，你得到的是 **CLI（`sl`）+ Interactive Smartlog（ISL）+ Git 兼容**那一部分的易用性——**不会**得到大仓虚拟文件系统，也不会得到那套服务端。给团队推荐 Sapling 时，别让人误以为「装完就能像 Meta 那样跑数千万文件 monorepo」。
:::

> 官方还自陈：Sapling 的设计取向偏向「企业级、始终在线、单 master、以 rebase 为中心、monorepo」环境，在这些场景下最成熟；非 monorepo、离线、多 master、merge 工作流并非其设计重点。是否引入需结合团队实际权衡。
