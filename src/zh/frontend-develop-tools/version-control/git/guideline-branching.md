---
layout: doc
outline: [2, 3]
---

# 指南 - 分支与合并

> 基于 Git 2.47.x 编写 —— 分支管理 / 快进与三方合并 / 冲突解决 / rebase / 远程跟踪 / 分支工作流

## 速查

- **管理**：`git branch`（列本地）/ `git branch -a`（含远程）/ `git branch -v`（带最新提交）/ `git branch -d <名>`（删，未合并用 `-D` 强删）/ `git branch -m <新名>`（重命名）
- **创建 / 切换**：`git switch <名>` / `git switch -c <名>`（建并切）/ `git switch -`（回上一个）/ `git switch -c <名> <起点提交>`
- **合并**：`git merge <名>` / `git merge --no-ff <名>`（强制建合并提交）/ `git merge --abort`（放弃）/ `git merge --squash <名>`（压平为一次提交不建合并节点）
- **冲突**：`git status` 看冲突文件 → 编辑去掉 `<<<<<<< ======= >>>>>>>` → `git add` → `git commit`；`git merge --abort` 撤回
- **变基**：`git rebase <基>` / `git rebase --onto <新基> <旧基> <分支>` / `git rebase -i <基>`（交互）/ `git rebase --continue|--skip|--abort`
- **交互式 rebase 动作**：`pick`（保留）/ `reword`（改信息）/ `edit`（停下修改）/ `squash`（并入上一条、合并信息）/ `fixup`（并入上一条、丢信息）/ `drop`（删）/ `reorder`（调整行序）
- **远程分支**：`git fetch` / `git switch --track origin/<名>`（建跟踪分支，新版裸 `git switch <名>` 同名即可自动跟踪）/ `git push -u origin <名>` / `git branch -vv`（看跟踪关系）/ `git fetch -p`（清理已删远程分支）
- **黄金法则**：**已推送共享的提交不要 rebase / amend / reset**（会改写他人依赖的历史）
- **pull 策略**：`git pull`（= fetch + merge）/ `git pull --rebase` / `git config --global pull.rebase true`

## 分支管理

分支是一个**指向某次提交的可变指针**（41 字节的文件，存于 `.git/refs/heads/<名>`），新建几乎零成本。`HEAD` 是"我现在在哪个分支"的符号引用。

```bash
git branch -v            # 列分支 + 各自最新提交
git branch --merged      # 已并入当前分支的分支（可安全删）
git branch --no-merged   # 尚未合并的分支（-d 会拒绝删，需 -D）
git branch -d hotfix     # 删除已合并分支
git switch -c feat main   # 从 main 建并切到 feat
```

## 快进合并 vs 三方合并

`git merge` 有两种情况：

- **Fast-forward（快进）**：目标分支是当前分支的直接后继，Git 只是把指针**向前移动**，不产生新提交。
- **Three-way merge（三方合并）**：两个分支各自有了新提交，Git 以它们的**共同祖先**为基准做三方合并，生成一个**有两个父提交**的**合并提交**。

```bash
git merge feature           # 能快进就快进，否则三方合并
git merge --no-ff feature   # 即使能快进也强制建合并提交（保留分支痕迹，Git Flow 常用）
```

### 解决合并冲突

当两边改了同一处，Git 会在文件里插入冲突标记：

```text
<<<<<<< HEAD
当前分支的内容
=======
被合并分支的内容
>>>>>>> feature
```

手动编辑保留正确内容、删掉标记，然后 `git add <file>` 标记已解决，`git commit` 完成合并。中途想放弃用 `git merge --abort` 回到合并前。`git config merge.conflictStyle zdiff3` 可显示三方中的共同祖先，更易判断。

## 变基（rebase）

`rebase` 把当前分支的提交**逐个"摘下来"，重新播放**到目标分支顶端，得到**线性历史**（没有合并提交）：

```bash
git switch feature
git rebase main          # 把 feature 的提交重放到 main 顶端
```

merge 保留真实的分叉历史、可追溯；rebase 让历史更干净线性、易读。代价是 rebase **重写了提交**（新提交有新的 SHA）。

> **黄金法则**：**绝不要 rebase 已经推送、别人可能基于它工作的公共提交**。重写公共历史会让协作者的仓库分叉、被迫强推救火。rebase 只用于**整理本地、尚未分享**的提交。

### 交互式变基

`git rebase -i <基>` 打开一个待办列表，可对最近若干提交批量整理：

```bash
git rebase -i HEAD~4
```

把 `pick` 改成 `squash` / `fixup` 可压缩提交，`reword` 改信息，`drop` 删除，调整行的顺序即重排提交。常用于把"修修补补"的零碎提交合并成干净的几个再推送。

`git rebase --onto <新基> <旧基> <分支>` 可做"移植"：把一段提交从一个基底嫁接到另一个基底，常用于把基于错误分支的提交转移走。

## 远程分支与跟踪

`git fetch` 只更新**远程跟踪分支**（如 `origin/main`），不动你的工作区。本地分支可与远程分支建立**跟踪关系**（upstream），之后裸 `git push` / `git pull` 就知道推拉哪里：

```bash
git push -u origin feature   # 首推并建立跟踪（-u = --set-upstream）
git branch -vv               # 查看每个本地分支的上游 + 领先/落后
git fetch -p                 # fetch 并清理远程已删除的跟踪分支（prune）
```

## 分支工作流

| 工作流 | 特点 | 适用 |
| --- | --- | --- |
| **Git Flow** | `main` / `develop` + `feature/*` / `release/*` / `hotfix/*` 多长期分支 | 有明确发布周期的版本化产品 |
| **GitHub Flow** | 只有 `main` + 短命 `feature` 分支，靠 PR 合并、合并即部署 | 持续部署的 Web 应用 |
| **Trunk-Based** | 所有人频繁合并进单一主干，feature flag 控制未完成功能 | 高频集成的大团队 / CI 成熟 |

现代前端项目多用 **GitHub Flow** 或 **Trunk-Based**：主干常绿、分支短命、靠 CI + PR 保证质量，避免长期分支带来的合并地狱。
