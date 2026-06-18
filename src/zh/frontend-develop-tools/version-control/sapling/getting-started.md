---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Sapling 官方文档（2026-06 调研）编写

## 速查

- **定位**：Meta 出品、命令行为 **`sl`**、脱胎 Mercurial、**兼容 Git**、为超大 monorepo 而生
- **安装**：
  - macOS：`brew install sapling`（大仓建议 `echo "ulimit -n 1048576" >> ~/.zshrc`）
  - Windows：解压 release ZIP 加入 PATH；前提 Git for Windows + Node.js v16+（供 `sl web`）
  - Linux：下载 `.tar.xz` 解压加 PATH；校验均用 `sl --version`
- 🔴 **Windows 别名冲突**：`sl` 与 PowerShell 内置 `Set-Location` 别名冲突，须先 `Remove-Item Alias:sl -Force`
- **无暂存区**：Sapling **没有 index**
  - `sl add <file>` 仅「告知 Sapling 跟踪新文件」，**不是**把改动加入暂存区
  - `sl commit` 默认提交**全部**改动（≈ `git commit -a`）
  - `git add -p`（分块挑选）≈ `sl commit -i` / `sl amend -i`
- **smartlog（提交图）**：裸 `sl` 或 `sl smartlog` 查看；`@`=你在这、`o`=commit、`x`=已落地/废弃
  - `sl ssl`（super smartlog）额外显示 GitHub PR / 评审 / CI 状态
- **切换 commit**：`sl goto <commit|bookmark>`（**不是 `checkout`**）；`sl prev` / `sl next` 栈内导航
- **改信息**：`sl metaedit`；**撤销**：`sl undo`（`sl undo -i` 可视化）
- **常用对照**：`git log`→`sl log`（日常少用）/ `git status`→`sl status` / `git diff`→`sl diff` / `git checkout COMMIT`→`sl goto COMMIT` / `git rebase main`→`sl rebase -d main`
- **翻译辅助**：`sl githelp`（或 `sl git`）把部分 git 命令翻译成等价 `sl` 命令

## 定位：它是什么

Sapling 是 Meta 开源的源码控制系统，官方 Slogan 是「A Scalable, User-Friendly Source Control System」。约十年前诞生于 Meta，用于应对其数千万文件级 monorepo 的扩展难题——Meta 认为「当时乃至现在公开可用的源码控制系统都无法处理这种规模」，于是基于 Mercurial 改造自研（源码位于 `eden/scm`）。

三大宣传支柱：

1. **Intuitive UI at Scale**——简化常见工作流，同时扩展到超大仓库。
2. **Git Integration**——可 clone 和操作 Git 仓库（GitHub 等）。
3. **Stack Your Work**——方便地堆叠、迭代、提交评审，消除分支管理的复杂度。

::: warning 开源用户的能力边界
Sapling 的完整扩展能力（虚拟文件系统 **EdenFS** + 服务端 **Mononoke**）目前**仅 Meta 内部可用**——源码里有，但**未进公开发布版 / 尚未公开支持**。通过 `brew install` 安装的开源版本，主要享受 **CLI（`sl`）+ Interactive Smartlog（ISL）的易用性 + Git 兼容**那一部分，并不会得到大仓虚拟文件系统。详见[Git 与 GitHub 集成](./guideline-git-github.md)。
:::

## 安装

| 平台 | 命令 |
| --- | --- |
| macOS | `brew install sapling` |
| Windows | 解压 release ZIP（管理员 PowerShell）+ `setx PATH` 加入安装目录 |
| Linux | 下载 `.tar.xz` 解压到 `~/.local/share/sapling`，加进 `~/.bashrc` |

三平台均用 `sl --version` 校验。

::: tip macOS 提示
Apple Silicon 预编译 bottle 若被隔离，可 `xattr -d com.apple.quarantine ./sapling-*.tar.gz` 去掉隔离标记；操作超大仓库前建议提高文件描述符上限：`echo "ulimit -n 1048576" >> ~/.zshrc`。
:::

::: danger Windows：`sl` 别名冲突（必看）
PowerShell 内置把 `sl` 作为 `Set-Location` 的别名，直接敲 `sl` 会去切目录而非运行 Sapling。需先解除别名：

```powershell
Remove-Item Alias:sl -Force
```

Windows 端另有前提：安装 **Git for Windows**（Git 仓库支持）与 **Node.js v16+**（供 `sl web` 使用）。
:::

## 核心心智：没有暂存区

理解 Sapling 最关键的一点：**「In Sapling, there is no staging area」**——它没有 Git 那样的暂存区 / index。这带来两个常见误区，务必厘清：

| 命令 | 真实语义 | 易错理解（错误） |
| --- | --- | --- |
| `sl add <file>` | 仅「告知 Sapling **开始跟踪**这个新文件」 | ~~把改动加入暂存区~~ |
| `sl commit` | 默认提交**工作区全部改动**（≈ `git commit -a`） | ~~只提交已 `add` 的内容~~ |

那么 Git 里 `git add -p`（逐块挑选要提交的改动）在 Sapling 里怎么做？用**交互式提交 / 修补**：

```bash
sl commit -i    # 交互式选择 hunk 后提交（≈ git add -p 再 commit）
sl amend -i     # 交互式把选中的 hunk 并入当前 commit
```

> 一句话：`sl add` 只解决「这个新文件要不要被纳入版本控制」，挑选**哪些改动进这次提交**靠 `-i` 交互式完成。

## smartlog：看懂仓库状态

smartlog 是 Sapling 的核心特性，帮你建立对仓库状态的准确心智模型。直接运行裸命令 **`sl`** 或 **`sl smartlog`** 即可显示提交图：

```bash
sl              # 等同 sl smartlog，显示提交图
sl smartlog
```

它会展示：你尚未推送的 commits、`main` 及其他重要分支的位置、这些 commit 之间的图关系、你当前所在位置，以及已落地 / 已 rebase 的标记。符号约定：

| 符号 | 含义 |
| --- | --- |
| `@` | 你当前所在的 commit（You are here） |
| `o` | 一个普通 commit |
| `x` | 已 land 或已 rebase / 废弃的 commit（旁边显示 “Landed as …”） |
| 左侧虚线 | 代表 `main` 分支，省略掉数千个无关 commit，只展示与你相关的 |

需要看 GitHub PR 状态时，用 **super smartlog**：

```bash
sl ssl          # = sl smartlog -T {ssl}，额外抓取 PR / 评审 / CI 状态
```

::: tip 交互式版本
想要图形化、自动刷新、拖拽 rebase 的体验，用 `sl web` 启动内置 Web GUI（ISL）。详见[栈式开发与撤销](./guideline-stacks-and-undo.md)。
:::

## 切换位置：`sl goto`（不是 checkout）

Sapling 遵循「每个命令只做一件事」的设计——Git 里身兼数职的 `checkout` / `reset` / `rebase` 被拆成聚焦的命令。切换到某个 commit 用 **`sl goto`**：

```bash
sl goto <commit-hash>     # 切换到指定 commit
sl goto main              # 切换到某个 bookmark
sl prev                   # 栈内下移一个 commit
sl next                   # 栈内上移一个 commit
```

::: warning 别用 `checkout` 的肌肉记忆
Sapling 没有 `sl checkout` 这个日常切换命令——切 commit / bookmark 一律 `sl goto`。同理，移动分支指针、丢弃文件等也各有专门命令（见下方对照表）。
:::

## `sl` vs `git` 命令对照表

> 提示：`sl githelp <git 命令>`（或 `sl git …`）可自动把部分 git 命令翻译成等价的 Sapling 命令。

### 仓库 / 远程

| Git | Sapling |
| --- | --- |
| `git clone URL my_repo` | `sl clone URL my_repo` |
| `git fetch` | `sl pull` |
| `git pull --rebase` | `sl pull --rebase` |
| `git push HEAD:BRANCH` | `sl push --to BRANCH` |
| `git remote add REMOTE URL` | `sl path --add REMOTE URL` |

### 查看状态

| Git | Sapling |
| --- | --- |
| `git log` | `sl log`（日常**很少用**，改看 smartlog） |
| `git status` | `sl status` |
| `git diff` | `sl diff` |
| `git show` | `sl show` |
| `git blame FILE` | `sl blame FILE` |
| `git rev-parse HEAD` | `sl whereami` |

### 文件操作

| Git | Sapling |
| --- | --- |
| `git add FILE` | `sl add FILE`（**仅跟踪新文件**，非暂存） |
| `git rm --cached FILE` | `sl forget FILE` |
| `git mv OLD NEW` | `sl mv OLD NEW` |
| `git checkout -- FILE` | `sl revert FILE` |
| `git reset --hard` | `sl revert --all` |
| `git clean -f` | `sl clean` |

### 提交 / 切换 / 变基

| Git | Sapling |
| --- | --- |
| `git commit -a` | `sl commit`（默认提交全部，无暂存区） |
| `git commit -a --amend` | `sl amend` |
| `git commit --amend`（只改信息） | `sl metaedit` |
| `git checkout COMMIT` | `sl goto COMMIT` |
| `git rebase main` | `sl rebase -d main` |
| `git rebase -i` | `sl histedit` |
| `git add -p` | `sl commit -i` / `sl amend -i` |
| `git cherry-pick COMMIT` | `sl graft COMMIT` |
| `git stash` / `git stash pop` | `sl shelve` / `sl unshelve` |

> 撤销类（`sl undo` / `sl uncommit` / `sl unamend` 等）与栈操作（`sl fold` / `sl split` / `sl absorb`）的完整对照，见[栈式开发与撤销](./guideline-stacks-and-undo.md)。
