---
layout: doc
outline: [2, 3]
---

# 指南 - 栈式开发与撤销

> 基于 Sapling 官方文档（2026-06 调研）编写

## 速查

- **栈式开发（stacked commits）**：Sapling 对「编辑/操作 commit 栈」提供**一等支持**，靠 **hash + smartlog** 工作
  - 🔴 官方**不鼓励**日常用 local bookmark/分支（“for day-to-day development, bookmarks are discouraged”）
  - 建栈：`echo foo > foo.txt; sl add foo.txt; sl ci -m 'adding foo'`（无需 git 那套暂存）
- **栈内导航**：`sl prev [n]`（下移）/ `sl next [n]`（上移）/ `sl go top` / `sl go bottom`
- **改栈中某 commit**：`sl goto <commit> && sl amend` → Sapling **自动 restack** 上方 commit
- **合并/拆分/吸收**：
  - `sl fold --from .^`（合并多 commit 为一）
  - `sl split`（一拆多，交互式选 hunk，Sapling 独有）
  - `sl absorb`（自动把工作区改动吸收进栈中对应 commit，Sapling 独有；判定不了用 `sl amend --to <id>`）
  - `sl histedit`（交互式编辑历史，≈ `git rebase -i`）
- **撤销/重做（一等公民）**：`sl undo`（`sl undo -i` 可视化预览）/ `sl redo` / `sl uncommit` / `sl unamend` / `sl unhide` / `sl journal`（≈ reflog）
- **mutation 追踪**：amend/rebase 后记录旧→新版映射，支持自动 restack 与跨机器栈一致
- **Interactive Smartlog (ISL)**：`sl web` 启动内置 Web GUI，可视化操作栈（拖拽 rebase 要求无未提交改动）

## 栈式开发（Stacks）

Sapling 的核心卖点之一：对「编辑和操作 commit 栈」提供**一等支持（first-class support）**，把一组相关 commit 当成整体处理。和 Git 最大的反差在于——**它靠 hash + smartlog 工作，而不靠分支名**。

::: danger 官方不鼓励日常用分支
本地命名分支（local bookmarks）在 Sapling 里是**可选的**，官方甚至明确**不鼓励**日常开发使用：「for day-to-day development, bookmarks are discouraged」。你不需要分支名也能创建和管理 commit 栈，通过 **hash** 或 **smartlog** 访问即可。（远程 bookmark 如 `remote/main` 仍然必需且不可变。）这是与 Git 心智的最大差异，初学最易踩。
:::

建一个栈非常直接——注意没有「先 `git add` 进暂存区」那套：

```bash
echo foo > foo.txt ; sl add foo.txt ; sl ci -m 'adding foo'
echo bar > bar.txt ; sl add bar.txt ; sl ci -m 'adding bar'
```

栈内导航：

```bash
sl go top        # 跳到栈顶
sl go bottom     # 跳到栈底
sl next 2        # 上移 2 个 commit
sl prev          # 下移 1 个 commit
```

## 修改栈：amend / 重排 / absorb

改栈中某个 commit 的标准动作是「goto 到目标 → 改 → `sl amend`」，Sapling 会**自动 restack（重新堆叠）**上方所有 commit，无需手动 rebase：

```bash
sl goto <目标 commit>
# ……编辑文件……
sl amend          # 改动并入该 commit，上方 commit 自动重新堆叠
```

常用栈编辑命令：

| 操作 | 命令 | 说明 |
| --- | --- | --- |
| 合并 commit | `sl fold --from .^` | 把多个 commit 合并为一（也可 `--from <id>` / `--exact <ids>`） |
| 拆分 commit | `sl split` | 一个拆成多个，交互式选 hunk（Sapling 独有） |
| 自动吸收改动 | `sl absorb` | 自动把工作区改动吸收进栈中**引入对应行**的 commit（Sapling 独有） |
| 指定吸收目标 | `sl amend --to <id>` | `absorb` 判定不了归属时，手动指定并入哪个 commit |
| 交互式编辑历史 | `sl histedit` | ≈ `git rebase -i` |

::: tip 用 `absorb` 代替繁琐的 fixup
当你在栈顶改了一堆零散修补，`sl absorb` 能按「这行最早是哪个 commit 引入的」自动把每处改动分发回对应 commit——省去手动 `fixup` + rebase。判定不了归属的改动会留在工作区，再用 `sl amend --to <id>` 手动指派。
:::

::: warning Sapling 的「栈编辑」替代 `rebase -i`
Sapling 不靠 `rebase -i` 改历史，而是 **goto 到目标 commit 后直接 `amend` / `split` / `fold`**。它还维护每个 commit 的「mutation 记录」（amend/rebase 后旧版到新版的映射），从而支持自动 restack，并在跨机器协作时保持栈一致。
:::

## 撤销与重做：Sapling 强项

撤销在 Sapling 里是**一等公民**——有一组专用命令，无需像 Git 那样去理解 `checkout` / `reset` / `reflog` 的交互。最常用的是 `sl undo`：

```bash
sl undo          # 撤销上一次操作（commit / amend / rebase / goto 等）
sl undo -i       # 交互式：用左右方向键预览各历史状态后再确认
sl redo          # 重做被 undo 的操作
```

与 Git 的对照：

| Git | Sapling | 含义 |
| --- | --- | --- |
| `git reset --hard HEAD@{1}` | `sl undo` | 撤销上一次操作 |
| `git reset --soft HEAD^` | `sl uncommit` | 撤掉最近一次 commit，保留改动 |
| `git reset --soft HEAD^ FILE` | `sl uncommit FILE` | 仅把某文件移出最近的 commit |
| `git reset HEAD@{1}` | `sl unamend` | 撤销上一次 amend |
| `git revert COMMIT` | `sl backout COMMIT` | 生成反向 commit 撤销已落地改动 |
| `git reset COMMIT` | `sl unhide COMMIT` | 恢复被 hide 的 commit |
| `git reflog` | `sl journal` | 查看引用历史 |

::: tip 为什么 `sl undo -i` 比 reflog 友好
`sl undo -i` 直接给出一个**可视化的历史状态预览**，左右方向键就能浏览「撤销到哪一步会变成什么样」，确认后再执行——不用先 `git reflog` 读 hash、再 `git reset` 赌对位置。
:::

## Interactive Smartlog (ISL)：内置 Web GUI

ISL 是 Sapling 内置的、基于 Web 的图形界面，把 commit 渲染成可交互的树，用**点击和拖拽**替代手敲 commit hash。启动命令是 **`sl web`**：

```bash
sl web           # 启动 Sapling Web 服务器，默认在本地浏览器打开 ISL
```

::: warning 启动命令是 `sl web`
不是 `sl isl`。Windows 上 `sl web` 依赖 Node.js v16+。ISL 也可通过端口 / SSH 端口转发用于远程机器。
:::

ISL 的核心能力：

- **树状查看** commit，含「You are here」指示；
- **拖拽 rebase**（要求无未提交改动）；`Goto` 按钮在 commit 间切换；
- 创建新 commit 形成栈；文件改动自动检测 + 视觉标记；
- `Commit` / `Amend` 按钮，`Commit as…` / `Amend as…` 填详细信息；
- **代码评审集成**：「Commit and Submit」/「Amend and Submit」直接提交到 GitHub，可选 `sl ghstack` 或 `sl pr`；PR badge 显示状态、CI 结果、评论数，可点击跳转 GitHub；
- 对比视图（快捷键 `Cmd+'`），可看 Head / Stack / 指定 commit 的改动；
- 合并冲突解决（文件打勾标记已解决）；后台命令自动排队执行，可选 Watchman 加速变更检测。

> ISL 的「Submit」会用到 GitHub PR 的几条不同路径（`sl pr` / `sl ghstack`），它们**语义不同、别混用**——详见[Git 与 GitHub 集成](./guideline-git-github.md)。
