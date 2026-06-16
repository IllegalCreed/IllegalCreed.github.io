---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Sourcetree 2026（macOS 4.2.x / Windows 3.4.x）编写

## 速查

- **安装**：[官网](https://www.sourcetreeapp.com/)下载 → 跳过 / 登录 Bitbucket / Atlassian 账户 → 选择内置（Embedded）或系统（System）Git
- **账户托管**：`Preferences/Tools → Accounts → Add`，可挂 Bitbucket / GitHub / GitLab（OAuth 或令牌），之后可直接浏览 / 克隆远程仓库
- **三栏界面**：左 **侧边栏**（文件状态 / 分支 / 标签 / 远程 / 储藏 / 子模块）+ 上 **工具栏**（按钮代替命令行）+ 主区 **历史图谱 / 代码差异**；顶部 **书签标签** 切换多仓库
- **克隆 / 新建**：工具栏 `Clone`（填 URL，对应 `git clone`）/ `Create`（`git init`）/ `Add`（导入本地已有仓库）
- **暂存（核心）**：在 **File Status** 视图勾选文件入暂存区，或选中 **代码块 / 单行** 点 `Stage Hunk` / `Stage Line`（= `git add -p`）；反向是 `Discard`（丢弃，不可逆）
- **提交**：底部 **提交信息框** 输入 → `Commit`；可勾 `Push immediately`（提交即推）、`Amend last commit`（= `git commit --amend`）
- **同步**：工具栏 `Fetch`（= `git fetch`，只拉不并）/ `Pull`（= `fetch + merge`）/ `Push`（= `git push`，弹窗勾选分支）
- **分支**：`Branch` 按钮新建（= `git switch -c`）；侧边栏 **双击** 分支名切换（= `git switch`）；右键分支可删 / 改名
- **合并**：`checkout` 到目标分支 → 右键源分支 `Merge ... into current`（= `git merge`）；冲突在差异区按 `Resolve Conflicts` 处理
- **交互式变基**：右键某提交 `Rebase children interactively`（仅本地未推送）→ 在窗口 **拖拽** 行 squash、**双击** 描述 reword、上下拖 reorder
- **储藏**：工具栏 `Stash`（= `git stash`）暂收改动；侧边栏 **Stashes** 节点 `Apply` / `Pop` 取回
- **常用功能**：`Cherry Pick`（右键提交，搬运）/ `Reset current branch to this commit`（= `git reset`）/ `Reverse commit`（= `git revert`）/ `Tag`（打标签）/ 顶部搜索框（本地提交 / 文件 / 分支检索）
- **自定义操作**：`Preferences → Custom Actions → Add`，把脚本包装成 `Actions → Custom Actions` 菜单项，参数支持 `$SHA`（选中提交）/ `$REPO`（仓库路径）等

## 安装与账户设置

从[官网](https://www.sourcetreeapp.com/)下载安装包（macOS 约 4.2.x，Windows 约 3.4.x，**两平台版本号不一致是常态**）。首次启动会问是否登录 **Bitbucket / Atlassian 账户**——可跳过纯本地使用，也可登录以便一键克隆云端仓库。

Sourcetree 自带一份 **内置 Git（Embedded Git）**，开箱即用、无需系统装 Git；若机器已装并想统一版本，可在 `Preferences/Tools → Git` 切换到 **系统 Git（System Git）**。Mercurial 同理可启用内置或系统版。

要拉取远程私有仓库，在 `Accounts` 里添加托管账户：支持 **Bitbucket / GitHub / GitLab**，多用 OAuth 授权或个人访问令牌；SSH 方式则在 `Preferences → General/SSH` 里加载或生成密钥（Windows 默认走 PuTTY/Pageant，可切 OpenSSH）。

## 理解界面

进入某个仓库后是经典 **三栏 + 顶部书签** 布局：

| 区域 | 作用 |
| --- | --- |
| 书签 / 标签栏（顶部） | 在已连接的多个仓库间切换，每个仓库一个标签 |
| 工具栏（上方） | 不碰命令行就能执行 Commit / Pull / Push / Fetch / Branch / Merge / Stash 等动作 |
| 侧边栏（左侧） | 当前仓库的关键信息：文件状态、分支、标签、远程、储藏、子模块 |
| 历史 / 代码差异（主区） | 看提交图谱（分支拓扑）、逐提交的文件改动与逐行 diff |

侧边栏顶部的 **File Status** 是日常入口：未暂存改动在下、已暂存在上，中间一键 Stage / Unstage。点任一文件可在右侧看 diff，并按 **块 / 行** 精确暂存。

## 克隆、提交与推送

工具栏三件套对应仓库来源：

- **Clone**：填远程 URL，等价 `git clone`，可选目标目录与分支
- **Create**：在空目录建新仓库，等价 `git init`
- **Add**：把本地已存在的 Git 仓库导入 Sourcetree 管理

日常提交流程：在 **File Status** 勾选要提交的文件（或用 `Stage Hunk` / `Stage Line` 精挑），在底部信息框写提交说明，点 **Commit**。提交对话框里有两个高频开关：

- **Push immediately to ...**：提交完直接推送到远程，省去单独 Push
- **Amend last commit**：把本次改动并入上一条提交（= `git commit --amend`，**已推送的慎用**，会改写历史）

推送用工具栏 **Push**，弹窗里勾选要推的本地分支与目标远程分支；首次推送新分支会让你建立上游跟踪关系。

## 拉取、获取与合并

- **Fetch**：只把远程更新下载到本地的远程跟踪分支，**不动工作区**（= `git fetch`，安全）
- **Pull**：= `Fetch + Merge`，把远程更新合并进当前分支；可在选项里改成 rebase 方式
- **Merge**：先 `checkout` 到目标分支，再右键源分支选 **Merge ... into current**（= `git merge`），可勾 `Create a commit even if merge resolved via fast-forward` 强制留合并提交（≈ `--no-ff`）

合并 / 变基若有冲突，Sourcetree 会把冲突文件标红，右键选 **Resolve Conflicts**：可用"解决为我方 / 对方"或打开外部合并工具，处理完 Stage 再继续。

## 交互式变基（招牌能力）

这是 Sourcetree 相对命令行最直观的地方。右键某条提交选 **Rebase children of ... interactively**（注意：**仅对本地、未推送的提交**操作，遵守 rebase 黄金法则），在弹出的"重排与修订"窗口里：

- **Squash（合并）**：把一行 **拖拽** 到上一行之上，或选中点底部 `Squash with previous`
- **Reword（改信息）**：**双击** 某提交的描述直接编辑
- **Reorder（重排）**：上下 **拖拽** 调整提交顺序
- **Edit / Delete**：暂停以修补某提交，或直接删除某提交

点 OK 后 Sourcetree 会按你的编排重放提交（重写历史、生成新 SHA）。

## 储藏、拣选与撤销

- **Stash（储藏）**：工具栏 `Stash` 临时收起未提交改动以便切分支救火；侧边栏 **Stashes** 节点右键 `Apply`（取回保留）/ `Pop`（取回并删）
- **Cherry Pick（拣选）**：右键某提交 → `Cherry Pick`，把它的改动复制到当前分支（= `git cherry-pick`）
- **Reset（回退）**：右键某提交 → `Reset current branch to this commit`，可选 Soft / Mixed / Hard（**Hard 丢工作区改动，不可逆**）
- **Reverse / Revert（反做）**：右键已推送的提交 → `Reverse commit`，生成反向提交安全撤销（= `git revert`）

## 自定义操作（Custom Actions）

GUI 没覆盖的命令可自己加。在 `Preferences → Custom Actions`（Windows：`Tools → Options → Custom Actions`）点 **Add**：

- 填 **Menu Caption**（菜单名）、要运行的 **Script to run**（可选内置 Git 或系统 Git 路径）与参数
- 建议勾上 **Open in a separate window** 和 **Show full output** 便于看错误
- 参数支持占位符：`$SHA`（当前选中的提交哈希）、`$REPO`（仓库根路径）等，把上下文传给脚本

之后在仓库里走 **Actions → Custom Actions → 你的动作** 即可执行。配置存放于 macOS 的 `~/Library/Application Support/SourceTree/actions.plist`（Windows 在 `%AppData%` 下对应目录）。
