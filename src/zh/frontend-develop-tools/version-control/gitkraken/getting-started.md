---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 GitKraken Desktop 2026 编写

## 速查

- **安装**：[gitkraken.com/download](https://www.gitkraken.com/download)。Windows 10/11；macOS 10.15+；**Linux** 提供 `.deb` / `.rpm` / `.tar.gz` / Snap / Flatpak 全格式；亦支持 **WSL 2**
- **界面三大区**：
  - **左侧面板**：Local / Remote / Pull Requests / Issues / Tags / Stashes / Submodules / Worktrees（可折叠）
  - **中央提交图**：把仓库画成 DAG，提交为行、分支为列，连线表示合并与父子关系
  - **右侧提交面板**：Unstaged Files → Staged Files → 提交信息（summary + description）
- **顶部工具栏按钮**：Undo、Redo、Pull（下拉含 Fetch All / Pull ff / Pull ff-only / Pull rebase）、Push、Branch、Stash、Pop
- **建分支**：右键提交 →「Create branch here」；**检出**：双击分支标签
- **合并 / rebase（拖拽）**：把源分支**拖到**目标分支上，松手菜单选 fast-forward / merge / rebase
- **交互式变基**：拖分支到目标选「Interactive Rebase」→ 拖拽重排提交，动作 **Pick(P) / Reword(R) / Squash(S) / Drop(D)**
- **暂存**：悬停文件点「Stage File」；diff 里右键可**行级 / 块级（hunk）暂存**；提交图 `//WIP` 节点访问未提交改动
- **冲突解决**：点冲突文件打开**内置 Merge Tool**，复选框逐行挑选两侧
- **Undo/Redo**：`Ctrl/Cmd+Z` 撤销 commit / checkout / 删分支 / reset / discard / rebase（**push/pull/fetch 不可撤销**）
- **命令面板**：`Ctrl/Cmd+P` 搜命令 / 文件 / 分支 / 提交
- **集成终端**：工具栏终端图标，自动在当前仓库目录执行、带 Git 命令补全
- **Profiles**：右上角头像下拉切换（隔离 name/email、集成、主题、标签页；**需付费**）
- **付费边界**：免费版**仅本地 + 公共远程仓库**；私有仓库 / 多 Profile / Cloud Workspace / 完整 AI 需 Pro+

## 安装与界面

从 [gitkraken.com/download](https://www.gitkraken.com/download) 下载，全平台原生：Windows、macOS、以及 **Linux**（`.deb` / `.rpm` / `.tar.gz` / Snap / Flatpak 任选，也支持 WSL 2）。首次启动会引导你连接一个 Git 托管集成（GitHub / GitLab 等），用于克隆、PR、issue。

界面由三大区构成，理解它就理解了 GitKraken 的工作方式：

| 区域 | 作用 |
| --- | --- |
| 左侧面板（Left Panel） | 列出 Local / Remote / Pull Requests / Issues / Tags / Stashes / Submodules / Worktrees |
| 中央提交图（Commit Graph） | 仓库的 DAG 可视化：提交为行、分支为列、连线表示合并与父子关系 |
| 右侧提交面板（Commit Panel） | 三段式：Unstaged Files → Staged Files → 提交信息（summary + description） |

顶部工具栏放高频按钮：**Undo / Redo / Pull / Push / Branch / Stash / Pop**。其中 **Pull 按钮的下拉**提供四种策略：Fetch All、Pull（能 ff 就 ff）、Pull（仅 ff）、Pull（rebase）。

## 提交图与分支操作（拖拽即操作）

GitKraken 的灵魂是**用拖拽代替命令**。提交图本身就是交互面：

- **建分支**：右键任意提交 →「Create branch here」→ 输入名回车
- **检出分支**：双击提交图或左侧面板里的分支标签
- **合并**：把源分支**拖到**目标分支上松手，弹出菜单按两分支关系给出 fast-forward / merge 选项
- **rebase**：同样拖拽，松手菜单选「Rebase」；右键游离提交可「Rebase onto this commit」；Shift 多选提交后可「Rebase X commits onto [branch]」

> 拖拽很直观，但**不要因此忽略底层真实发生的 Git 操作**——合并产生合并提交、rebase 改写历史，黄金法则（公共提交别 rebase）依旧适用。

## 交互式变基（图形化 git rebase -i）

命令行 `git rebase -i` 要在文本编辑器里改 `pick/squash/...`，GitKraken 把它换成**可拖拽的图形界面**：

- **启动**：把分支拖到目标分支选「Interactive Rebase」，或右键父提交选该项
- **重排**：直接拖动提交行调整顺序
- **四种动作**（带快捷键）：**Pick (P)** 保持、**Reword (R)** 改信息、**Squash (S)** 并入父提交、**Drop (D)** 删除
- **Reset 按钮**：放弃 setup 期间的全部改动重来

注意两个限制：源分支上的**合并提交不支持**交互式变基；在 GitKraken 里启动的 rebase **必须在 GitKraken 里完成**，不能切命令行收尾。

## 暂存、提交与 diff

提交面板分 **Unstaged / Staged** 两段；提交图里的 **`//WIP` 节点**代表当前未提交改动。

- **暂存**：悬停文件点「Stage File」，或「Stage all changes」全暂存
- **行级 / 块级暂存**：在 diff 里高亮行后右键「Stage selected lines」，或对单个 hunk 右键 stage/unstage
- **提交信息**：summary + description 两栏，支持 `Co-authored-by: Name <email>` 多行协作者署名
- **amend**：勾选「Amend the previous commit」把改动并入上一次提交；只改信息用「Update Message」按钮
- **绕过 hooks**：勾「Skip Git hooks」本次提交跳过所有 hook

diff 视图工具栏三种模式：**Hunk**（只看变更块，带单块 Revert）、**Inline**（完整文件内显示改动）、**Split**（左右并排）；还有 **History**（文件版本史）与 **Blame**（按作者着色）按钮。

## 冲突解决与撤销

**内置合并冲突编辑器**：合并出冲突时，点提交面板里的冲突文件打开 **Merge Tool**，用复选框逐行从「我方 / 对方」挑选，付费 + AI 还能「Auto-resolve with AI」给出带置信度的方案。也可在 Preferences 配外部工具（Beyond Compare、P4Merge、KDiff 等）。

**招牌 Undo / Redo**（`Ctrl/Cmd+Z` / `Ctrl/Cmd+Y`）可回退**最近一个受支持的本地操作**：

- 可撤销：Checkout、Commit（含 amend）、Discard、Delete branch（恢复已删分支）、Reset branch、各类 Rebase
- **不可撤销**：Push、Pull、Fetch（网络操作，按钮回退不了，仍需 `reflog` / 远程层面处理）

## stash、worktree 与命令面板

- **Stash**：工具栏 Stash 图标暂收改动，**Pop**（应用并删）/ **Apply**（应用保留）；左侧 STASHES 段管理；可对部分文件 stash
- **Worktree**（需 10.5.0+）：右键分支「Create worktree」建链接工作副本，「Open this worktree」切换，「Remove this worktree」移除——**并行处理多分支无需反复切换或 stash**
- **命令面板**：`Ctrl/Cmd+P` 打开，实时搜命令 / 文件 / 分支 / 提交 / stash，还能切主题 / Profile、配 Gitflow / LFS / GPG；检测到 IDE 会出「Open in VS Code」

## 集成、Workspaces 与 Profiles

- **Git 托管集成**：GitHub（含 Enterprise）、GitLab（含 Self-Managed，MR 称 merge request）、Bitbucket、Azure DevOps；**issue 追踪**：Jira、Trello、各平台 Issues
- **Pull Request**：拖分支 / 右键目标分支 / 左侧 PULL REQUESTS 段「+」创建；可改标题/描述/reviewers/labels，合并支持 merge / squash / rebase
- **Workspaces**：把多仓库分组管理；**Cloud Workspace**（跨设备同步、可团队共享）vs **Local Workspace**（仅本机）
- **Launchpad**：跨某 Workspace 统一看 Pull Requests / Issues / WIPs，一处审查 PR、checkout、建 worktree
- **Profiles**：一个 Profile 隔离 Git 身份（name/email）、集成账号、UI 偏好、标签页——一键切换「工作 / 个人」身份（**多 Profile 需付费**）

## 提交签名与 Gitflow

- **GPG 签名**：装好 GPG 后在 Preferences > Commit Signing 选 key 并启用，内置「Generate new GPG Key」无需命令行；可勾「Sign Commits by Default」
- **SSH 签名**：需在 Experimental 启用「Git Executable」并把 GPG Format 设为 SSH，配 `allowed_signers` 文件；GitHub/GitLab 支持验证，**Bitbucket 不支持 SSH 签名验证**
- **Gitflow**：Preferences > Gitflow 初始化，自动建 `main`/`develop`；左侧出现 Gitflow 面板，`feature/` 并入 develop、`release/` 与 `hotfix/` 并入 main+develop 并打 tag；右键分支「Finish」自动完成合并

## GitKraken AI（付费）

订阅用户无需自带 key（默认 Google Gemini，也可自带 OpenAI/Azure/Anthropic provider）：

- **生成提交信息**：提交信息字段旁 sparkle 图标，从暂存改动生成
- **AI Commit Composer**（预览）：把暂存改动重组成更清晰的提交叙事
- **生成 PR 标题/描述**、**Explain Commits/Branch**（自然语言解释改动）
- **Auto-resolve with AI**：为合并冲突生成带置信度的解决方案
