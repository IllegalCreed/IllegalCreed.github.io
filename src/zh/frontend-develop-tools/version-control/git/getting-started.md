---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Git 2.47.x 编写

## 速查

- **安装校验**：`git --version`（macOS 自带 / `brew install git`；Windows 用 Git for Windows；Linux `apt install git`）
- **首次配置（全局）**：
  - `git config --global user.name "名字"` / `git config --global user.email "邮箱"`（每次提交的作者身份）
  - `git config --global init.defaultBranch main`（新仓库默认分支名）
  - `git config --global core.editor "code --wait"`（提交信息编辑器）
  - 查看：`git config --list --show-origin`（带来源文件）；级别：`--system` < `--global` < `--local`（就近覆盖）
- **三区模型**：工作区（Working Directory）→ `git add` → 暂存区（Staging / Index）→ `git commit` → 仓库（Repository）；`HEAD` 指向当前分支最新提交
- **创建 / 克隆**：`git init`（现有目录建库）/ `git clone <url> [目录]`（拉取远程）
- **基本快照**：
  - `git status` / `git status -s`（简短）
  - `git add <file>` / `git add .` / `git add -p`（**分块交互暂存**）
  - `git commit -m "信息"` / `git commit -am "信息"`（跳过 add，仅对已跟踪文件）/ `git commit --amend`（改最后一次提交）
  - `git diff`（工作区 vs 暂存区）/ `git diff --staged`（暂存区 vs 仓库）
- **查看历史**：`git log --oneline --graph --all` / `git show <commit>` / `git log -p <file>`（逐提交看改动）
- **撤销**：
  - `git restore <file>`（丢弃工作区改动）/ `git restore --staged <file>`（取消暂存，保留改动）
  - `git reset --soft|--mixed|--hard <commit>`（移动分支指针：保留暂存 / 保留工作区 / **全丢弃**）
  - `git revert <commit>`（生成一个反向提交，**安全撤销已推送的提交**）
- **分支**：`git switch -c <名>`（建并切）/ `git switch <名>`（切）/ `git branch -d <名>`（删）/ `git merge <名>` / `git rebase <名>`
- **远程**：`git remote -v` / `git remote add origin <url>` / `git fetch` / `git pull` / `git push -u origin main`（`-u` 建立跟踪，之后可裸 `git push`）
- **暂存进度**：`git stash` / `git stash pop` / `git stash list`
- **标签**：`git tag -a v1.0 -m "信息"`（附注标签）/ `git push origin --tags`
- **忽略文件**：仓库根 `.gitignore`（每行一个 glob 模式，如 `node_modules/`、`*.log`、`!keep.log`）
- **别名**：`git config --global alias.co checkout` / `alias.st status` / `alias.lg "log --oneline --graph"`

## 安装与首次配置

Git 在 macOS 上随 Xcode Command Line Tools 自带（`xcode-select --install`），也可 `brew install git`；Windows 推荐 [Git for Windows](https://git-scm.com/download/win)（自带 Git Bash）；Linux 用发行版包管理器（`apt install git` / `dnf install git`）。装完用 `git --version` 校验。

第一次用 Git 必须配置**身份**——它会写进每一次提交，无法事后凭空更改：

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main   # 新库默认分支用 main
```

配置分三级，**就近覆盖**：`--system`（整机 `/etc/gitconfig`）< `--global`（当前用户 `~/.gitconfig`）< `--local`（单仓库 `.git/config`）。用 `git config --list --show-origin` 可看到每个值来自哪个文件。

## 三区模型与基本快照

理解 Git 的关键是**三个区域**：

| 区域 | 含义 | 进入方式 |
| --- | --- | --- |
| 工作区 Working Directory | 你正在编辑的真实文件 | 直接改文件 |
| 暂存区 Staging / Index | 下一次提交的"草稿快照" | `git add` |
| 仓库 Repository | 已落盘的提交历史 | `git commit` |

`git add` 把工作区改动放进暂存区，`git commit` 把暂存区固化成一次提交。暂存区的存在让你能**精确挑选**这次提交包含哪些改动——`git add -p` 可逐块（hunk）决定暂存与否，把一团混合改动拆成多个干净提交。

```bash
git status -s          # 简短状态：左列暂存区、右列工作区
git add -p             # 分块交互暂存
git commit -m "feat: 增加登录校验"
git diff               # 工作区 vs 暂存区（还没 add 的改动）
git diff --staged      # 暂存区 vs 上次提交（已 add、待 commit 的改动）
```

`git commit -am` 可对**已跟踪**文件跳过 `add` 直接提交（新文件不行）；`git commit --amend` 把当前暂存内容并入最后一次提交，常用于补漏文件或改提交信息（**会改写历史，已推送的慎用**）。

## 查看历史

```bash
git log --oneline --graph --all   # 一行一提交 + 分支拓扑图（最常用）
git log -p <file>                 # 逐提交查看某文件的改动
git log --author="名" --since="2 weeks ago"
git show <commit>                 # 看某次提交的完整改动
git blame <file>                  # 逐行标注最后修改的提交/作者
```

## 撤销操作

Git 的"后悔药"按**影响范围**分几档，越往后越危险：

- **丢弃工作区改动**：`git restore <file>`（旧写法 `git checkout -- <file>`）
- **取消暂存**（保留改动）：`git restore --staged <file>`（旧写法 `git reset HEAD <file>`）
- **改最后一次提交**：`git commit --amend`
- **回退分支指针**：`git reset --soft`（保留暂存与工作区）/ `--mixed`（默认，保留工作区、清暂存）/ `--hard`（**连工作区一起丢，不可逆**）
- **安全撤销已推送的提交**：`git revert <commit>`——它**新增一个反向提交**而非改写历史，团队协作首选

> `reset` 改写分支历史，只适合**本地未推送**的提交；一旦推送，用 `revert`。误删的提交通常还能用 `git reflog` 找回（见[内部原理](./guideline-internals.md)）。

## 分支与合并基础

分支是指向某次提交的**可变指针**，新建/切换几乎零成本。Git 2.23 起推荐用语义更清晰的 `switch` / `restore` 取代多义的 `checkout`：

```bash
git switch -c feature/login   # 新建并切换（= git checkout -b）
git switch main               # 切回
git merge feature/login       # 把 feature 合并进当前分支
git branch -d feature/login   # 合并后删除
```

合并有两种结果：能直接快进时是 **fast-forward**（仅移动指针），否则生成一个**合并提交**（两个父提交）。`rebase` 则把你的提交"摘下来重新播放"到目标分支顶端，得到**线性历史**——详见[分支与合并](./guideline-branching.md)。

## 远程协作

```bash
git remote add origin git@github.com:user/repo.git
git push -u origin main     # 首推 + 建立上游跟踪（-u），之后可裸 git push / git pull
git fetch                   # 只下载远程更新，不动你的工作区
git pull                    # = fetch + merge（或配 --rebase 改为 fetch + rebase）
```

`fetch` 安全（只更新远程跟踪分支 `origin/main`），`pull` 会顺带合并到本地。多人协作时常把 `pull` 配成 rebase 以保持线性：`git config --global pull.rebase true`。

## 标签

标签用于标记发布点，分**轻量标签**（只是一个指针）和**附注标签**（含作者/日期/信息，发布推荐用它）：

```bash
git tag -a v1.0.0 -m "首个正式版"   # 附注标签
git tag                            # 列出
git push origin v1.0.0             # 标签默认不随 push 上传，需显式推
git push origin --tags             # 一次推全部
```

## 别名与 .gitignore

把常用长命令配成别名：

```bash
git config --global alias.st status
git config --global alias.lg "log --oneline --graph --all"
git config --global alias.last "log -1 HEAD"
```

仓库根的 `.gitignore` 用 glob 模式排除不该被跟踪的文件（每行一个，`#` 注释，`!` 取反，`/` 锚定根目录）：

```gitignore
node_modules/
dist/
*.log
.env
!.env.example      # 取反：保留这个
```

> `.gitignore` 只对**未跟踪**文件生效；已被跟踪的文件需先 `git rm --cached <file>` 移出索引才会被忽略。
