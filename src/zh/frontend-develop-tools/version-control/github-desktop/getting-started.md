---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 GitHub Desktop 2026 编写

## 速查

- **安装**：[desktop.github.com](https://desktop.github.com/) 下载（macOS 12.0+ / Windows 10 64 位+，**无 Linux**）→ 登录 GitHub 账号 → 配置 Git 的 name / email → 选默认编辑器与主题
- **拿到仓库**：`File > Clone repository`（**GitHub.com / GitHub Enterprise / URL** 三个标签页）→ 选本地路径 → Clone；本地已有仓库用 `File > Add local repository`
- **界面四象限**：左上「**Current Branch** 下拉」管分支；左侧「**Changes** 标签」看待提交改动、「**History** 标签」看提交历史；底部填提交信息；顶部栏 **Push origin / Pull origin** 同步
- **提交（对应 `git add` + `git commit`）**：Changes 里勾选文件（红删/黄改/绿增），**可在 diff 里逐行点选做部分提交**（≈ `git add -p`）→ 填 **Summary**（必填）/ **Description**（选填）→ 点 **Commit to 分支名**
- **同步（对应 `git push` / `git pull`）**：提交后点 **Push origin** 推送；拉取远程用 **Pull origin**（`fetch` + 合并）；新分支首推显示 **Publish branch**
- **分支（对应 `git switch` / `git branch`）**：Current Branch 下拉 → **New Branch** 建并切；切分支若有未提交改动，弹窗选 **Leave / Bring**（留在原分支 / 带到新分支）
- **改提交历史**：History 里**右键或拖拽**——`amend`(改最近一次) / `revert`(反向提交，安全撤销已推送) / `cherry-pick`(拖到目标分支) / `reorder`(拖动排序) / `squash`(拖一个压到另一个)；**已推送的历史尽量别改写**
- **协作（GitHub 专属）**：推送后点 **Preview Pull Request → Create Pull Request**（跳浏览器填表）；`Repository > Create Issue on GitHub` 建 Issue；无写权限时推送会提示 **Fork this repository**
- **暂存（弱版 `git stash`）**：右键改动头部 **Stash All Changes**；**一次只能存一组**，不能命名
- **常用快捷键**（mac / win）：提交 `Cmd/Ctrl+Enter`、推送 `Cmd/Ctrl+P`、拉取 `Shift+Cmd/Ctrl+P`、新分支 `Shift+Cmd/Ctrl+N`、看改动 `Cmd/Ctrl+1`、看历史 `Cmd/Ctrl+2`、克隆 `Shift+Cmd/Ctrl+O`

## 安装与首次配置

到 [desktop.github.com](https://desktop.github.com/) 下载对应系统的安装包。系统要求：**macOS 12.0 或更高**、**Windows 10 64 位或更高**——GitHub Desktop **官方不支持 Linux**。

安装后有四步初始化（[官方 Setup 指引](https://docs.github.com/en/desktop/installing-and-authenticating-to-github-desktop/setting-up-github-desktop)）：

1. **登录账号**：用 GitHub.com 或 GitHub Enterprise 账号认证，之后才能在本地与远程之间交换数据、自动管理凭据。
2. **配置 Git 身份**：设置随每次提交写入的 **name 与 email**（等价于命令行的 `git config --global user.name/user.email`）。注意 GitHub Desktop **内置了 Git**，不依赖你单独安装的命令行 Git。
3. **选默认编辑器**：从 VS Code 等列表里挑一个，方便从客户端一键"在编辑器中打开"。
4. **选主题**：浅色 / 深色 / 跟随系统。

> GitHub Desktop 自带 Git，但若你想在终端用命令行 Git，仍需另装 [git-scm.com](https://git-scm.com/downloads)。两者各自独立。

## 拿到一个仓库：克隆与 Fork

**克隆**：菜单 `File > Clone repository`，弹窗有三个标签页：

- **GitHub.com**：列出你账号下/有权限的仓库，直接选
- **GitHub Enterprise**：企业版仓库
- **URL**：手动粘贴任意 Git 仓库地址

选好后点 Local Path 旁的 **Choose...** 指定本地存放目录，再点 **Clone**。如果本地磁盘上已经有一个 Git 仓库，用 `File > Add local repository` 把它纳入管理即可。

**Fork**：当你向一个**没有写权限**的仓库推送时，GitHub Desktop 会弹窗提示 **Fork this repository**。随后它会问 **"How are you planning to use this fork?"**：

- **To contribute to the parent project**：PR 默认指向上游原仓库（给开源项目提 PR 选这个）
- **For my own purposes**：当作自己的独立项目用

这个选择决定了之后推送和发 PR 的默认目标，事后可在 `Repository > Repository settings... > Fork Behavior` 里改。

## 界面布局

GitHub Desktop 的核心就四块，记住它们就会用：

| 区域 | 位置 | 作用 |
| --- | --- | --- |
| **Current Branch 下拉** | 顶部仓库栏 | 分支总入口：新建 / 切换 / 发布 / 删除 / 合并 / 对比 |
| **Changes 标签** | 左侧栏 | 当前工作区里**待提交**的改动（颜色标识增删改） |
| **History 标签** | 左侧栏 | 已落盘的**提交历史**，右键可做 amend/revert/cherry-pick 等 |
| **提交信息区** | 左下角 | Summary / Description / co-author，最下方是 Commit 按钮 |
| **Push/Pull 栏** | 顶部 | 与远程同步（Push origin / Pull origin / Fetch） |

## 提交与审查改动

这是日常用得最多的一步，对应命令行的 `git add` + `git commit`。

在 **Changes** 标签里，每个改动文件带颜色图标：**红=删除、黄=修改、绿=新增**。顶部复选框默认全选；想把某些文件排除在这次提交外，取消勾选即可。

**部分提交（partial commit）**是 GUI 的一大便利——等价于命令行难记的 `git add -p`：在 diff 视图里，被高亮（蓝色）的行会进入提交，**点击某一行可取消高亮把它排除**，从而把一团混合改动拆成多个干净提交。不想要的改动可右键 **Discard Added Line**，或在文件上选 **Discard Changes** 丢弃。

写提交信息：左下角 **Summary**（必填，简短标题）+ **Description**（选填，详细说明）。点 Description 角上的 **co-author 图标**可添加共同作者（`Co-authored-by`）；若环境支持，还能点 Copilot 图标自动生成提交信息。

填好后点 **Commit to 分支名** 完成提交（此时只在本地）。要同步到远程，再到顶部栏点 **Push origin**。

```text
改文件  →  Changes 勾选 / diff 里逐行选  →  填 Summary  →  Commit to main  →  Push origin
（工作区）        （≈ git add / git add -p）         （≈ git commit）        （≈ git push）
```

## 分支管理

分支操作都集中在 **Current Branch 下拉**：

- **新建**：点开下拉 → 选基准分支 → **New Branch** → 填名字 → **Create Branch**（建好即自动切过去）
- **从某次提交建分支**：History 里右键某提交 → **Create Branch from Commit**
- **切换**：下拉里选目标分支点一下即可
- **发布**：本地新建的分支点 **Publish branch** 才会推到 GitHub（需写权限）
- **删除**：选中分支后走 `Branch` 菜单 → **Delete...**（有开放 PR 的分支删不掉，且删除不可撤销）

**切分支时若有未提交改动**，会弹窗让你选：**Leave my changes on 当前分支**（留在原地）或 **Bring my changes to 目标分支**（带过去）。可在 **Prompts** 设置里固定默认行为。

## 改写提交历史

GitHub Desktop 把不少高级操作做成了**右键 / 拖拽**，主要在 **History** 标签里（详见[官方 Managing commits](https://docs.github.com/en/desktop/managing-commits/options-for-managing-commits-in-github-desktop)）：

| 操作 | 作用 | GUI 方式 | 对应命令 |
| --- | --- | --- | --- |
| **Undo** | 撤销最近一次（未推送）提交，改动退回工作区 | History 顶部 Undo | `git reset HEAD~` |
| **Amend** | 改最近一次提交的信息或并入新改动 | 提交区勾选 Amend / 右键 | `git commit --amend` |
| **Revert** | 生成一个**反向提交**，安全撤销已推送的提交 | History 右键 → Revert | `git revert` |
| **Cherry-pick** | 把某提交复制到另一分支 | 右键选目标分支，**或拖到 Current Branch 下拉** | `git cherry-pick` |
| **Reorder** | 调整提交顺序 | History 里**拖动**排序 | `git rebase -i`（重排） |
| **Squash** | 多个提交合并成一个 | **拖一个压到另一个**，或多选后 Squash | `git rebase -i`（squash） |

> 官方明确提醒：**尽量不要改写已经推送到远程的提交历史**——这会让协作者被迫强推救火。需要撤销已推送的内容时，优先用 **Revert**（新增反向提交，不改写历史）。

## 与远程同步

- **Push origin**：把本地提交推到远程（`git push`）
- **Pull origin**：拉取远程更新（`git fetch` + 合并到本地）
- **Fetch origin**：没有新提交可推/拉时，按钮显示为 Fetch，仅检查远程是否有更新

合并冲突时，GitHub Desktop 会列出冲突文件并提供"在编辑器中打开"逐处解决，解决后回来继续合并；但**复杂冲突的精细处理**往往仍需在编辑器或命令行里完成。

## 与 GitHub 协作（PR / Issue）

这是 GitHub Desktop **区别于普通 Git 客户端**的核心价值，但要注意**真正的表单在浏览器里填**：

- **发起 PR**：把分支推到 GitHub 后，点 **Preview Pull Request** 看改动 diff → 确认 base 分支 → **Create Pull Request**，此时**跳转默认浏览器**到 GitHub 填标题/描述，可选 **Create Pull Request** 或 **Create Draft Pull Request**。
- **建 Issue**：菜单 `Repository > Create Issue on GitHub`，同样**跳浏览器**，有模板选模板、没模板则开空白 Issue。
- **检出 PR 跑检查**：可直接在本地检出别人的 PR 分支，运行 CI 检查、查看状态，无需开浏览器。

## 暂存改动（Stash）

干活干一半要切分支时，可右键 Changes 头部选 **Stash All Changes** 临时收起改动；恢复时到该分支的 Changes 里点 **Stashed Changes → Restore**（或 **Discard** 丢弃）。

> **局限**：GitHub Desktop **一次只能暂存一组改动**，不能像命令行 `git stash` 那样存多份、命名或挑选。需要更灵活的暂存请回到命令行。

## 常用快捷键

下表为高频快捷键（macOS / Windows，完整见[官方 keyboard shortcuts](https://docs.github.com/en/desktop/overview/github-desktop-keyboard-shortcuts)）：

| 操作 | macOS | Windows |
| --- | --- | --- |
| 新建仓库 | `Cmd+N` | `Ctrl+N` |
| 添加本地仓库 | `Cmd+O` | `Ctrl+O` |
| 克隆仓库 | `Shift+Cmd+O` | `Ctrl+Shift+O` |
| 仓库列表 | `Cmd+T` | `Ctrl+T` |
| 在 GitHub 上查看 | `Shift+Cmd+G` | `Ctrl+Shift+G` |
| 在终端打开 | `Ctrl+\`` | `Ctrl+\`` |
| 看改动 / 看历史 | `Cmd+1` / `Cmd+2` | `Ctrl+1` / `Ctrl+2` |
| 分支列表 | `Cmd+B` | `Ctrl+B` |
| 提交 | `Cmd+Enter` | `Ctrl+Enter` |
| 新建分支 | `Shift+Cmd+N` | `Ctrl+Shift+N` |
| 重命名分支 | `Shift+Cmd+R` | `Ctrl+Shift+R` |
| 删除分支 | `Shift+Cmd+D` | `Ctrl+Shift+D` |
| 从默认分支更新 | `Shift+Cmd+U` | `Ctrl+Shift+U` |
| 合并到当前分支 | `Shift+Cmd+M` | `Ctrl+Shift+M` |
| 暂存改动 | `Shift+Cmd+S` | `Ctrl+Shift+S` |
| 推送 | `Cmd+P` | `Ctrl+P` |
| 拉取 | `Shift+Cmd+P` | `Ctrl+Shift+P` |
