---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Fork 2026（2.6x 版本线）编写

## 速查

- **获取**：[git-fork.com](https://git-fork.com/) 下载 → macOS（10.11+）/ Windows（7+）；**免费无限期试用**，长期使用购买 **$59.99** 永久许可（1 用户 / 3 台机器、Mac+Win 通用、含商业用途）。Fork 直接调用系统/内置 Git，无需先装 Git
- **首次配置**：`Preferences / 设置` → Git 里填 **user.name / user.email**、默认分支名、外置编辑器、merge/diff 工具、GPG 签名；账号页连接 GitHub / GitLab / Bitbucket / Azure DevOps
- **打开仓库**：`File → Open`（已有本地库）/ `Clone`（克隆远程）/ `Init`（现有目录建库）；**Repository 管理器**收藏常用仓库，可分组
- **暂存与提交**：左侧 `Changes` 视图勾选文件，或在 diff 里**逐行 / 逐块（hunk）暂存**；底部写提交信息 → Commit / Commit & Push；`Amend` 复选框改最后一次提交
- **diff 阅读**：语法高亮、并排 / 行内切换、in-diff 搜索（Ctrl/⌘+F）；**图片差异**有 side-by-side / swipe / onion skin 三模式
- **分支与提交图**：`Branches` 侧栏切换/新建分支；中间提交图（commit graph）可视化历史，**stash 内联其中**；右键提交→ Checkout / Reset / Revert / Cherry-pick / Create Branch / Tag
- **交互式 rebase**：选区间右键 `Interactive Rebase` → 在面板里**拖拽重排**、对每条提交选 pick / reword / edit / squash / fixup / drop → 应用
- **合并冲突**：merge/rebase 冲突时打开**内置冲突解决器**，三栏（ours/base/theirs）逐行取舍，冲突标记显示在滚动条；解完标记 resolved → 继续
- **远程协作**：工具栏 `Fetch` / `Pull`（可选 rebase）/ `Push`；可直接 **Create Pull Request**（GitHub/GitLab/Bitbucket/Azure DevOps）
- **救场工具**：`Reflog` 找回丢失提交；`Stash`（支持单文件部分储藏，列于提交图）；`Bisect` 可视化二分定位 Bug；`Blame` / `History` 溯源
- **效率键**：**Quick Launch**（⌘P / Ctrl+P）模糊搜索分支、文件历史、命令、创建 worktree；内置终端（也可启动外置终端）
- **高级**：Git LFS（含文件锁与图片预览）、submodule、**worktree**（创建对话框 + 标签页）、Git-flow、GPG 签名；近期支持 **AI 生成提交信息 / 代码评审**（OpenAI / Claude 后端）

## 安装与授权

到 [git-fork.com](https://git-fork.com/) 下载对应平台安装包：macOS 需 OS X 10.11+，Windows 需 7+，**不提供 Linux 版**。Fork 直接使用系统已有或自带的 Git，不要求你单独安装 Git。

授权模式是「**免费评估 + 一次性买断**」：可无限期免费试用，但长期使用需购买 **$59.99** 的永久许可（非订阅）。一个许可证支持 **1 个用户、同时至多 3 台机器**，且 Mac 与 Windows 通用、**包含商业用途**——这正是它相对订阅制（如 GitKraken）的成本优势。

首次启动后进入 `Preferences`（Mac）/ `Settings`（Windows）配置 Git 身份与工具：

```text
Preferences → Git
  user.name / user.email   # 写入每次提交的作者身份
  默认分支名 / 外置编辑器 / merge & diff 工具 / GPG 签名

Preferences → Accounts
  连接 GitHub / GitLab / Bitbucket / Azure DevOps（用于克隆私库、创建 PR、通知）
```

## 打开 / 克隆仓库与仓库管理器

Fork 用「Repository 管理器」集中管理你常用的仓库，可收藏、分组：

- `File → Open`：把一个已有的本地 Git 仓库加入 Fork
- `Clone`：从远程 URL 克隆（连接账号后可直接列出你的远程仓库）
- `Init`：在现有目录初始化新仓库
- 还能直接「**创建 / 删除远程仓库**」（GitHub 等），省去切到网页

每个仓库以标签页打开，顶部工具栏是 Fetch / Pull / Push / Branch / Stash 等高频动作，左侧是 Branches / Tags / Remotes / Stashes / Submodules / Worktrees 等导航。

## 暂存、提交与 diff

在 `Changes`（本地改动）视图里，左侧列出已改文件，右侧是 diff。Fork 支持**逐行 / 逐块（hunk）暂存与撤销**——和 `git add -p` 等价但更直观：

- 勾选文件整体暂存，或在 diff 里点选具体行 / hunk 暂存
- diff 支持**语法高亮、并排（split）/ 行内（inline）切换、in-diff 搜索（Ctrl/⌘+F）**
- 底部填写提交信息后 Commit；勾选 **Amend** 可并入并改写最后一次提交
- **图片差异**是 Fork 的招牌：对常见图片格式提供 **side-by-side（并排）/ swipe（滑动揭示）/ onion skin（半透明叠加）** 三种比对，设计资源的改动一眼可辨

## 分支、提交图与日常操作

中间的**提交图（commit graph）**可视化分支拓扑与历史，且把 **stash 直接内联**在提交列表中，一处即可看到「正式提交 + 临时储藏」。对提交 / 分支右键即可执行绝大多数日常操作：

- 提交右键：Checkout、Reset（soft/mixed/hard）、Revert、**Cherry-pick**、Create Branch / Tag、Copy SHA
- 分支右键：Checkout、Merge、Rebase、Rename、Delete、**Create Pull Request**
- 支持**拖拽**完成 merge / rebase / 重排等操作

## 交互式 rebase（图形化）

Fork 把 `git rebase -i` 做成了可视面板，是它最被称道的功能之一：

1. 在提交图选中要整理的提交区间，右键 `Interactive Rebase`（变基到某基点）
2. 面板里**拖拽重排**提交顺序，并为每条提交选择动作：
   - **pick**（保留）/ **reword**（改信息）/ **edit**（暂停以修改）
   - **squash**（并入上一条并合并信息）/ **fixup**（并入上一条但丢弃本条信息）/ **drop**（删除）
3. 确认后 Fork 执行变基；若中途冲突，自动转入冲突解决器

> 黄金法则同命令行：**已推送、他人可能基于其工作的公共提交不要 rebase**——重写会改 SHA，导致协作者历史分叉。

## 合并冲突解决器

merge 或 rebase 遇到冲突时，Fork 打开**内置三栏冲突解决器**：

- 三栏分别是 **ours（当前分支）/ base（共同祖先）/ theirs（对方分支）**，结果在下方/中间合成
- **逐行**选择采用哪一侧，或手动编辑；冲突位置还会**标在滚动条**上方便跳转
- 全部解决后标记为 resolved，继续 merge / rebase——无需配置外置 mergetool

## 远程协作与 PR

工具栏三件套覆盖远程同步：

- **Fetch**：只下载远程更新，不动工作区（安全）
- **Pull**：拉取并合并（可在设置里选 rebase 方式以保持线性）
- **Push**：推送当前分支（首推自动建立上游跟踪）

连接账号后，可直接在 Fork 内对 GitHub / GitLab / Bitbucket / Azure DevOps **创建 Pull Request**，并接收 GitHub 通知，减少在网页与客户端之间来回切换。

## 效率与救场工具

- **Quick Launch（⌘P / Ctrl+P）**：命令面板式入口，模糊搜索并跳转分支、文件历史、执行自定义命令、创建 worktree
- **内置终端**：在仓库目录直接敲命令；也可一键启动外置终端
- **Reflog**：图形化浏览 HEAD 移动史，找回被 reset / 误删的提交
- **Stash**：支持对**单个文件做部分储藏**，且储藏内联显示在提交图
- **Bisect**：可视化二分定位引入 Bug 的提交（可 skip、点击 bisect 引用）
- **Blame / History**：逐行溯源、查看单文件历史

## 高级特性

- **Git LFS**：开箱支持，含**文件加锁 / 解锁**、图片预览、传输进度
- **Submodule / Worktree**：均有专门 UI——worktree 提供创建对话框、标签页与状态指示，便于「同仓库多分支并行」
- **Git-flow**：侧栏 (+) 菜单提供 feature / release / hotfix 流程入口
- **GPG 签名**：对提交 / 标签签名
- **AI 辅助（近期）**：可调用 OpenAI / Claude 后端**生成提交信息**或做**代码评审**，请求内容可编辑

> 复杂底层操作（如 `git filter-repo` 重写历史、自定义 refspec）GUI 不一定覆盖，必要时仍回到内置终端用命令行处理。
