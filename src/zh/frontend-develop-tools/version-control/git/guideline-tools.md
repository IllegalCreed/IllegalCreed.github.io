---
layout: doc
outline: [2, 3]
---

# 指南 - Git 工具

> 基于 Git 2.47.x 编写 —— 修订选择 / 交互式暂存 / 储藏 / reset 三树 / cherry-pick / 高级合并 / bisect / submodule / worktree

## 速查

- **修订选择**：`HEAD~3`（第 3 代祖先）/ `HEAD^`（第一父）/ `HEAD^2`（合并的第二父）/ `<sha>` / `<tag>` / `名@{2}`（reflog 第 2 条）/ `名@{upstream}` 或 `@{u}` / `:/关键字`（提交信息搜索）
- **提交范围**：`A..B`（B 有而 A 没有）/ `A...B`（对称差）/ `^A B`（排除 A）；常配 `git log A..B` / `git diff A..B`
- **交互式暂存**：`git add -p`（逐块选择暂存）/ `git add -i`（交互菜单）/ `git restore -p`（逐块丢弃）
- **储藏**：`git stash`（含 `-u` 连未跟踪、`-m "信息"`）/ `git stash list` / `git stash pop`（弹出并删）/ `git stash apply`（弹出不删）/ `git stash drop` / `git stash branch <名>`
- **清理**：`git clean -fd`（删未跟踪文件 + 目录，`-n` 先预演）/ `git clean -fdx`（连忽略文件一起删）
- **reset 三树**：`git reset --soft <c>`（只移 HEAD）/ `--mixed <c>`（默认：HEAD + 暂存区）/ `--hard <c>`（HEAD + 暂存区 + 工作区，**危险**）/ `git reset <c> -- <file>`（只改暂存区某文件）
- **挑拣 / 反做**：`git cherry-pick <c>`（把某提交搬到当前分支）/ `git revert <c>`（生成反向提交）
- **高级合并**：`-X ours` / `-X theirs`（冲突偏向一方）/ `git merge -s ort`（默认策略）/ `git rerere`（记忆冲突解法自动复用）
- **定位 Bug**：`git bisect start` → `git bisect bad` / `git bisect good <c>` → 二分 → `git bisect run <脚本>`（自动）→ `git bisect reset`
- **追溯**：`git blame -L 10,20 <file>` / `git log -S"字符串"`（pickaxe：找增删某字符串的提交）/ `git log -G<正则>`
- **子模块**：`git submodule add <url>` / `git clone --recurse-submodules` / `git submodule update --init --recursive`
- **多工作树**：`git worktree add ../dir <分支>` / `git worktree list` / `git worktree remove <dir>`

## 修订选择

很多命令接受"指向某次提交"的写法：

```bash
git show HEAD~2     # 当前提交往上数 2 代（沿第一父）
git show HEAD^2     # 合并提交的第二个父
git show 名@{u}     # 当前分支的上游（origin/名）
git log :/修复登录  # 第一个提交信息含"修复登录"的提交
```

**范围**最易混：`A..B` 是"在 B 不在 A"（看 feature 比 main 多了啥用 `main..feature`）；`A...B` 是对称差（两边各自独有），`git log --left-right A...B` 标出各属哪边。

## 交互式暂存与储藏

`git add -p` 逐个 hunk 询问是否暂存，把一团混合改动拆成多个干净提交的利器（`y`/`n`/`s` 拆分/`e` 手动编辑）。

`git stash` 把未提交改动**临时收起**、还原干净工作区，用于"活干一半要切分支救火"：

```bash
git stash -u -m "wip: 表单校验"   # 连未跟踪文件一起存
git switch hotfix                 # 去救火
# ...
git switch -                      # 回来
git stash pop                     # 取回改动
```

## reset 揭秘（三棵树）

`reset` 操作三棵树：**HEAD**（当前提交）、**Index**（暂存区）、**Working Tree**（工作区）。三个模式决定动到哪几棵：

| 模式 | HEAD | 暂存区 | 工作区 | 用途 |
| --- | :---: | :---: | :---: | --- |
| `--soft` | ✓ | ✗ | ✗ | 回退提交但把改动留在暂存区（重组提交） |
| `--mixed`（默认） | ✓ | ✓ | ✗ | 回退提交 + 取消暂存，改动留工作区 |
| `--hard` | ✓ | ✓ | ✓ | **全部丢弃**，回到目标提交的干净状态 |

`git reset <commit> -- <file>` 不移动 HEAD，只把某文件在暂存区还原成该提交的样子（= 取消暂存的精确版）。误用 `--hard` 后，提交通常还能用 `git reflog` 找回。

## cherry-pick 与 revert

```bash
git cherry-pick a1b2c3d        # 把某提交"复制"到当前分支顶端
git cherry-pick A^..B          # 挑一段范围
git revert a1b2c3d             # 生成一个抵消该提交的新提交（安全，不改历史）
```

`revert` 是撤销**已推送**提交的正确方式；`reset` 只适合本地未分享的提交。

## 高级合并与 rerere

冲突时可让某一方自动胜出：`git merge -X ours feature`（冲突处保留当前分支）/ `-X theirs`（保留对方）。注意它与合并策略 `-s ours`（完全忽略对方改动）不同。

`git rerere`（reuse recorded resolution）开启后会**记住你解过的冲突**，下次同样冲突自动套用——长期分支反复合并时省力：`git config --global rerere.enabled true`。

## 用 bisect 二分定位 Bug

```bash
git bisect start
git bisect bad            # 当前是坏的
git bisect good v1.2.0    # 这个版本是好的
# Git 自动 checkout 中点，你测试后标 good/bad，二分收敛
git bisect run npm test   # 或全自动：脚本退出码非 0 视为 bad
git bisect reset          # 结束，回到原处
```

## 子模块与多工作树

**submodule** 在仓库里嵌入另一个 Git 仓库（锁定到某提交）：

```bash
git submodule add https://github.com/user/lib vendor/lib
git clone --recurse-submodules <url>          # 克隆时一并拉子模块
git submodule update --init --recursive        # 已克隆后补拉
```

**worktree** 让同一个仓库**同时检出多个分支到不同目录**，免去反复 stash/切换：

```bash
git worktree add ../proj-hotfix hotfix   # 在另一目录检出 hotfix 分支
git worktree list
git worktree remove ../proj-hotfix
```
