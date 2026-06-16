---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 lazygit 2026 编写

## 速查

> 图例：`<c-x>` 表示 `Ctrl+x`，大写字母表示 `Shift+该键`（如 `P` = `Shift+p`）。同一个键在不同面板含义不同——任意时刻按 `?` 打开当前上下文的键位菜单。

- **启动 / 退出**：在仓库目录运行 `lazygit`（或别名 `lg`）；`q` 退出，`<esc>` 取消/返回，`?` 键位菜单
- **五大面板 + 跳转**：`1`Status · `2`Files · `3`Branches · `4`Commits · `5`Stash（数字键直达）；`<tab>` 或 `←`/`→`（`h`/`l`）在面板间切换；`<enter>` 进入选中项，`<esc>` 返回；`0` 聚焦主视图（diff 区）；`[`/`]` 切标签页
- **列表导航**：`↑`/`↓`（`k`/`j`）上下移动；`/` 在当前视图内搜索/过滤；`<`/`>` 跳顶/底；`<pgup>`/`<pgdown>` 滚动主视图 diff
- **暂存（Files 面板）**：`空格` 切换暂存选中文件；`a` 暂存/取消暂存**全部**；`<enter>` 进入文件**逐行暂存**；`d` 丢弃改动菜单；`D` 重置/清空工作树（核弹）；`x` 确认丢弃
- **分行/分块暂存（进入文件后）**：`空格` 暂存当前行/块；`v` 切换范围选择（再按 `↑`/`↓` 扩选）；`a` 在「整块」与「逐行」模式间切换；`<space>` 暂存选区，`d` 丢弃选区；`E` 在外部编辑器里编辑块；`<tab>` 切换已暂存/未暂存视图
- **提交**：`c` 提交已暂存改动；`w` 跳过 pre-commit 钩子提交；`C` 用 git 编辑器写提交信息；`A`（Files 面板）amend 到上一次提交
- **推 / 拉 / 取**：`P` 推送（push）；`p` 拉取（pull）；`f` 抓取（fetch）；`R` 刷新状态（不 fetch）
- **分支（Branches 面板）**：`空格` 检出选中分支；`n` 新建分支；`c` 按名检出（输入 `-` 切回上一分支）；`d` 删除菜单；`r` 把当前分支 rebase 到选中分支；`M` 合并选中分支进当前分支；`f` 从上游快进；`R` 重命名；`u` 上游选项；`o` 创建 PR、`G` 浏览器打开 PR
- **提交历史（Commits 面板）**：`s` squash 到下一条；`f` fixup（并入下条且丢弃信息）；`r` reword 改信息；`d` drop 删除；`e` 从该提交开始/标记 edit；`i` 启动交互式 rebase；`p` pick；`<c-j>`/`<c-k>` 下移/上移提交；`A` amend 暂存改动；`t` revert（生成反向提交）；`T` 打标签；`g` reset 菜单（soft/mixed/hard）；`b` bisect 菜单；`<space>` 以分离 HEAD 检出该提交
- **fixup 工作流**：`F` 为选中提交创建 `fixup!` 提交；`S` 自动 squash 所有 `fixup!` 提交（autosquash）；Files 面板 `<c-f>` 自动定位要 fixup 的基提交
- **cherry-pick**：在 Commits 面板 `C` 标记复制（可配合 `v` 范围多选），切到目标分支后 `V` 粘贴；`<c-r>` 清除复制选择
- **rebase 中途控制**：`m` 打开 merge/rebase 选项（continue / abort / skip）
- **stash（Stash 面板）**：Files 面板 `s` 一键 stash 全部、`S` stash 选项菜单；Stash 面板 `空格` apply、`g` pop、`d` 丢弃、`n` 从 stash 建分支
- **撤销 / 重做**：`z` 撤销、`Z` 重做（基于 reflog，**仅覆盖提交/分支变化**，不含工作区/stash，rebase 中途不支持）
- **其它高频**：`:` 执行任意 shell 命令；`@` 命令日志选项；`<c-w>` 切换是否显示空白改动；`{`/`}` 减/增 diff 上下文行数；`+`/`_` 切换屏幕模式（normal/half/full）
- **配置文件**：Status 面板按 `e` 编辑 `config.yml`（macOS：`~/Library/Application Support/lazygit/config.yml`；Linux：`~/.config/lazygit/config.yml`），仓库级覆盖放 `<repo>/.git/lazygit.yml`

## 它是什么、装在哪

lazygit 是一个**终端里的 Git TUI**：你在终端运行 `lazygit`，它把仓库状态铺成五个面板，所有操作靠键盘按键触发。它不取代 Git，而是 Git 的**高效可视化前端**——把"敲长命令 + 记参数 + 手编 rebase 文件"换成"按几个键"。

安装方式很多：macOS `brew install lazygit`；Arch `pacman -S lazygit`；也可 `go install github.com/jesseduffield/lazygit@latest` 或从 [Releases](https://github.com/jesseduffield/lazygit/releases) 下载二进制。强烈建议配个 shell 别名，如 `alias lg='lazygit'`。在**任意 Git 仓库目录**下运行即可；若当前目录不是仓库，lazygit 默认会提示你是否 `git init`（可由 `notARepository` 配置改为 create/skip/quit）。

## 五大面板与导航

界面左侧是五个**侧边面板**，右侧主视图显示 diff / 日志等详情：

| 面板 | 跳转键 | 内容 |
| --- | --- | --- |
| Status | `1` | 仓库状态、当前分支、按 `e`/`o` 打开/编辑配置文件 |
| Files | `2` | 工作区改动（未暂存 + 已暂存），暂存/提交的主战场 |
| Branches | `3` | 本地/远程分支，检出、合并、rebase |
| Commits | `4` | 当前分支提交历史，交互式 rebase 的主战场 |
| Stash | `5` | 储藏的 work-in-progress |

导航核心：数字键 `1`~`5` 直达面板；`<tab>` 或 `←`/`→`（`h`/`l`）依次切面板；`↑`/`↓`（`k`/`j`）在列表内移动；`<enter>` 进入选中项的下一层（如进入分支看提交、进入提交看文件）；`<esc>` 逐层返回；`0` 把焦点切到主视图以便滚动 diff；`/` 在当前视图内过滤/搜索。**记不住键就按 `?`**，它弹出当前上下文的完整键位菜单。

## 暂存与提交

在 **Files 面板**，`空格` 切换选中文件的暂存状态，`a` 一次性暂存/取消全部。lazygit 最招牌的能力是**分行/分块暂存**：在文件上按 `<enter>` 进入该文件的 diff，逐块浏览，`空格` 暂存当前行（或当前块），`v` 开启范围选择后用 `↑`/`↓` 扩选一段连续行再 `空格` 暂存，`a` 在「逐行」与「整块」模式间切换。这等价于 `git add -p` 的逐块交互，但是**可视化、所见即所选**，能把一团混合改动干净地拆进不同提交。

暂存完成后：`c` 提交（弹出信息输入框，`<enter>` 确认）；`C` 调用 git 配置的编辑器写多行信息；`w` 跳过 pre-commit 钩子提交（信息以 `WIP` 前缀时默认也会跳过，由 `skipHookPrefix` 控制）；`A` 把当前暂存内容 amend 进上一次提交。

```text
空格   # 暂存/取消暂存选中文件（Files 面板）
<enter># 进入文件 → 逐行/逐块暂存
v      # 范围选择，↑/↓ 扩选连续行
a      # 切换 整块 / 逐行 模式
c      # 提交已暂存改动
```

## 推送、拉取与分支

推拉用**大小写区分**：`P` 推送（push，若无上游会提示设置），`p` 拉取（pull），`f` 抓取（fetch），`R` 仅刷新状态（不联网 fetch）。

在 **Branches 面板**：`空格` 检出选中分支；`n` 新建分支；`c` 按名检出（输入框里输 `-` 可切回上一分支）；`r` 把当前分支 rebase 到选中分支；`M` 把选中分支合并进当前分支（含 squash merge 选项）；`f` 从上游快进；`d` 删除菜单；`R` 重命名；`u` 查看/设置上游。`o` 创建 Pull Request、`G` 在浏览器打开 PR、`<c-y>` 复制 PR 链接。

## 交互式 rebase 与历史整理

**Commits 面板**是整理历史的主战场，无需手编 rebase TODO：

- `i` 启动交互式 rebase（从 HEAD 到第一个合并提交/主分支提交）；`e` 则从**选中提交**开始 rebase，或在 rebase 中途标记该提交为待编辑
- 标记动作：`s` squash 到下条、`f` fixup（并入下条并丢弃其信息）、`d` drop、`r` reword 改信息、`p` pick
- `<c-j>` / `<c-k>` 把提交**下移 / 上移**一位，直接调整顺序
- 进行中用 `m` 打开选项菜单：continue（继续）/ abort（中止）/ skip（跳过）
- 其它：`A` 用暂存改动 amend 选中提交；`t` revert（生成反向提交，安全撤销已推送提交）；`g` reset 菜单（soft/mixed/hard）；`B` 标记 rebase 基提交（`git rebase --onto`）；`b` bisect 菜单

### fixup 工作流

PR 评审后要把修改并回某个旧提交、又想让评审看到改了什么时，用 `fixup!` 提交：选中目标提交按 `F` 创建 `fixup!` 提交（注意是大写 `F`；小写 `f` 是直接 squash 到下条，含义不同）。准备合并时，选中分支首个提交按 `S` 一键 autosquash 掉所有 `fixup!` 提交。若不确定该 fixup 哪个提交，在 Files 面板按 `<c-f>`，lazygit 会自动在 Commits 面板里帮你定位基提交。

### cherry-pick（跨分支搬运提交）

在 Commits（或 Reflog / 子提交）面板按 `C` 标记复制选中提交（可先 `v` 范围多选连续提交），切到目标分支后按 `V` 粘贴（即 cherry-pick）。随时 `<esc>` 或 `<c-r>` 取消复制选择。

## stash 与撤销

**储藏**：Files 面板 `s` 一键 stash 全部改动，`S` 打开 stash 选项菜单（stash 全部 / 仅已暂存 / 仅未暂存）。在 **Stash 面板**：`空格` apply（应用但保留）、`g` pop（应用并删除）、`d` 丢弃、`n` 从该 stash 创建新分支、`r` 重命名。

**撤销 / 重做**：`z` 撤销上一步、`Z` 重做。其原理是**读 reflog 回放**，所以连你在 lazygit 之外（命令行）做的操作也能撤。但有边界：只覆盖 **reflog 记录的提交/分支变化**，**工作区改动、stash 改动、已推送到远程的操作都无法撤销**；rebase **中途**也不支持撤销（想退出 rebase 用 `m` → abort）。

## 自定义命令

lazygit 允许把任意命令绑到自己的键位，写在 `config.yml` 的 `customCommands` 下（Status 面板按 `e` 即可打开配置）。每条命令可指定 `key`（触发键）、`context`（生效面板，如 `files`/`commits`/`global`）、`command`（用 Go 模板语法插入占位符）、`output`（输出去向：`none`/`terminal`/`log`/`popup`），还能用 `prompts` 弹出 `menu`/`input`/`confirm` 交互式收集参数，或用 `commandMenu` 把一组不常用命令收进二级菜单。

```yaml
customCommands:
  - key: "<c-v>"
    context: "files"
    description: "用 commitizen 提交"
    command: "git cz"
    output: terminal
  - key: "n"
    context: "localBranches"
    description: "按类型新建分支"
    prompts:
      - type: "menu"
        key: "Type"
        title: "分支类型"
        options:
          - { name: "feature", value: "feature" }
          - { name: "hotfix", value: "hotfix" }
      - type: "input"
        key: "Name"
        title: "分支名"
    command: "git flow {{.Form.Type}} start {{.Form.Name}}"
    loadingText: "创建分支中"
```

占位符可访问 `SelectedFile`、`SelectedCommit`、`SelectedLocalBranch`、`CheckedOutBranch` 等对象；范围选区的提交可用 `SelectedCommitRange.From` / `.To`。自定义键位与内置键位冲突时，同上下文里自定义优先。

## 配置与按键自定义

全局配置文件路径：macOS `~/Library/Application Support/lazygit/config.yml`，Linux `~/.config/lazygit/config.yml`，Windows `%LOCALAPPDATA%\lazygit\config.yml`。仓库级覆盖放在 `<repo>/.git/lazygit.yml`。在 Status 面板按 `e` 直接编辑、`o` 用默认程序打开。

按键可在 `keybinding` 段下整体改写（`universal` 为全局，各面板单独覆盖），用 `<disabled>` 可禁用某键；nerd fonts 用户设 `gui.nerdFontsVersion: "3"` 可显示文件图标。常用开关：`<c-w>` 切换 diff 是否显示空白改动、`{`/`}` 调 diff 上下文行数、`+`/`_` 切换 normal/half/full 屏幕模式、`:` 随时执行 shell 命令。
