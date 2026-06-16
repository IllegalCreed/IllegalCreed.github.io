---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Jujutsu (jj) 2026 编写

## 速查

- **安装校验**：`jj --version`（macOS `brew install jj`；Cargo `cargo install --locked jj-cli`；各平台见官方 install 页）
- **首次配置**：`jj config set --user user.name "名字"` / `jj config set --user user.email "邮箱"`（写入每次提交的作者身份）；`jj config edit --user` 直接编辑配置文件
- **创建 / 克隆**：
  - `jj git init`（在现有/空目录建库，**默认非 co-located**）/ `jj git init --colocate`（与 `.git` 共处一目录，可与 `git` 命令混用）
  - `jj git clone <url> [目录]`（克隆远程，加 `--colocate` 同上）
  - `jj git init --git-repo=<path>`（基于已有 Git 仓库/裸库建 jj 库）
- **核心心智**：**工作区即提交**——当前工作区对应提交 `@`，**没有暂存区**；改了文件不必 `add`，下条 `jj` 命令会**自动快照**进 `@`
- **看状态/历史**：
  - `jj st`（= status，看 `@` 的改动与父提交）
  - `jj log`（默认只显示你关心的部分历史）/ `jj log -r 'all()'`（全部）/ `jj log -r ::@`（`@` 的祖先，≈ `git log`）
  - `jj show <rev>` / `jj diff`（`@` 的改动）/ `jj diff -r <rev>`（某提交引入的改动）
- **写提交**：
  - `jj describe`（给 `@`（或 `-r <rev>`）写/改提交信息，**随时可改，不改写身份**）
  - `jj new`（在 `@` 之上开一个**新的空提交**作为新 `@`，相当于「封存当前、开始下一个」）/ `jj new A B`（以 A、B 为父，创建**合并**）
  - `jj commit`（= `jj describe` + `jj new`，描述当前并开新提交，≈ `git commit`）
- **编辑历史（jj 的拿手好戏）**：
  - `jj edit <rev>`（直接「站到」某历史提交上编辑它）
  - `jj squash`（把 `@` 的改动并入父提交，≈ `git commit --amend`）/ `jj squash --from A --into B`（把改动在提交间搬运）/ `jj squash -i`（交互挑选 hunk）
  - `jj split` / `jj split -i`（把一个提交拆成多个，≈ `git add -p` 的精挑提交）
  - `jj rebase -s <源> -d <目标>`（搬移提交及其后代；`-b` 整支、`-r` 仅指定提交）
  - `jj abandon <rev>`（丢弃提交，后代自动 rebase 到其父）
- **撤销（operation log）**：`jj op log`（看每一次仓库操作）/ `jj undo`（撤销上一次操作，**任意操作皆可**）/ `jj op restore <op-id>`（整库回到某次操作后的状态）
- **bookmark（≈分支，但不自动跟随）**：`jj bookmark create <名> -r <rev>` / `jj bookmark set <名> -r <rev>`（手动移动）/ `jj bookmark list` / `jj bookmark delete <名>`
- **远程协作**：`jj git fetch` / `jj git push --bookmark <名>` / `jj git push -c <rev>`（自动建 bookmark 并推）/ `jj git push --all`（推**所有 bookmark**，非所有提交）
- **冲突**：冲突会被**写进提交**、操作照常成功（**无需 `--continue`**）；用 `jj resolve`（调外部合并工具）或直接编辑工作区里的冲突标记后让其自动消解

## 安装与首次配置

jj 在 macOS 上可 `brew install jj`，跨平台可用 Rust 工具链 `cargo install --locked jj-cli`，各发行版包管理器与预编译二进制见官方 install 页。装完用 `jj --version` 校验。

第一次用必须配置**身份**——它会写进每一次提交：

```bash
jj config set --user user.name "Your Name"
jj config set --user user.email "you@example.com"
# 直接编辑用户级配置文件（TOML）
jj config edit --user
```

jj 的配置同样分层（用户级 / 仓库级 / 命令行 `--config`），就近覆盖；`jj config list` 可查看当前生效配置。

## 工作区即提交：没有暂存区

这是与 Git 最根本的差异。Git 是「工作区 → 暂存区(index) → 仓库」三段式，你得用 `git add` 把改动放进暂存区才能提交。**jj 没有暂存区**——当前工作区直接对应一个真实提交，用 `@` 表示。你修改文件，就等于在修改 `@` 这个提交的内容。

```bash
jj st            # 看 @ 当前包含哪些改动（无需先 add）
# ……随便改文件……
jj st            # 改动已自动算进 @，依然不需要 add
```

几乎**每条 `jj` 命令运行前都会自动把工作区快照进 `@`**（自动快照）。所以你 `jj log` / `jj diff` / `jj rebase` 时看到的，永远是把当前文件状态算进去后的结果。新增的文件默认被隐式跟踪（受 `.gitignore` 与 `snapshot.auto-track` 约束，jj 复用 Git 的 ignore 格式，暂无 `.jjignore`）。

> 对应 Git 习惯的翻译：`git add` → 不存在（直接改文件即可）；`git commit -a` → `jj commit`；`git commit --amend` → `jj squash`（站在 `@` 上时）。想要 `git add -p` 那种精挑改动，用 `jj split -i` 或 `jj squash -i`。

## change-id 与 commit-id

jj 给每个提交两个标识符：

| 标识符 | 含义 | 是否稳定 |
| --- | --- | --- |
| **change-id** | 一个改动的**逻辑身份**（类似 Gerrit Change-Id），贯穿其全部演化 | **稳定**：内容改了、被 rebase 了也不变 |
| **commit-id** | 该提交当前内容的 Git 哈希（SHA） | **会变**：内容一变就是新哈希 |

这意味着：你对同一个 change 反复 `describe` / `squash` / `rebase`，它的 **commit-id 不断变化，但 change-id 始终如一**。引用提交时既可用 change-id 也可用 commit-id 的唯一前缀。这套设计天然适配「一个改动反复打磨、在评审中不断更新」的工作流——你始终能用稳定的 change-id 指代「同一件事」。

```bash
jj log            # 每行同时显示 change-id 与 commit-id（前者通常着色更醒目）
jj describe -r <change-id>   # 用稳定的 change-id 指代提交，哪怕它被改写过
```

## 新建提交、编辑历史

jj 把「开始一个新提交」和「编辑某个历史提交」做成了对称的两条命令：

```bash
jj new                 # 在 @ 之上开一个新的空提交，成为新的 @（封存当前、开始下一个）
jj new A B             # 以 A、B 为父，创建一个合并提交
jj edit <rev>          # 直接「站到」某历史提交上，就地编辑它（@ 移过去）
jj describe            # 给 @ 写/改提交信息（随时可改）
jj commit              # = describe 当前 + new 一个新提交（最接近 git commit 的体验）
```

改写历史的核心命令：

```bash
jj squash                       # 把 @ 的改动并入父提交（≈ git commit --amend）
jj squash --from A --into B     # 把 A 的改动搬进 B
jj squash -i                    # 交互式挑选要并入的 hunk
jj split -i                     # 把当前提交拆成多个（精挑哪些改动归哪个提交）
jj abandon <rev>                # 丢弃某提交，其后代自动 rebase 到该提交的父
```

> 关键体验差异：在 Git 里改写一串历史中间的提交要 `rebase -i` 加一堆 `--continue`；在 jj 里你**直接 `jj edit` 站上去改**，所有后代会**自动 rebase**跟上，无需手动续。

## rebase 与自动 rebase

`jj rebase` 用三组「选哪些 / 放哪里」的标志组合，**不指定时默认 `-b @`**：

```bash
# 选哪些：-s 源(含后代) / -b 整支 / -r 仅这些提交
# 放哪里：-d(--destination，亦 -o/--onto) / -A(--insert-after) / -B(--insert-before)
jj rebase -s <源> -d <目标>      # 搬移某提交及其全部后代
jj rebase -b <支> -d <目标>      # 搬移整支（相对目标的祖先）
jj rebase -r <提交> -d <目标>    # 只搬这些提交，留下的「洞」由后代自动补到其父上
jj rebase -r X -A L              # 把 X 插到 L 之后（可用于重排提交）
```

jj 的杀手锏是**自动 rebase**：当你改写某个提交（`describe`/`squash`/`edit`/`rebase`…），它的**所有后代会自动重新落到新版本上**，你几乎不用手动维护下游分支。`-r` 甚至允许把提交 rebase 到它自己的后代上（留下的空洞自动回填），这是 Git 做不到的。

## operation log 与撤销

jj **把每一次改变仓库状态的操作都记进 operation log**（不只是提交，还包括 rebase、abandon、bookmark 移动、`jj git import` 等）。于是「后悔药」变得空前强大：

```bash
jj op log                  # 列出每一次操作（含操作 ID、时间、命令、用户/主机）
jj undo                    # 撤销上一次操作（任意操作皆可，不限于提交）
jj op restore <op-id>      # 把整个仓库回到某次操作结束时的状态
jj op show <op-id>         # 查看某次操作具体改了什么
```

它比 Git 的 reflog 更进一步：reflog 主要记录引用移动、且按引用分散，而 operation log 是**整库级别**的统一时间线，能一键 `jj undo` 掉「一次搞砸的 rebase」「一次误删 abandon」。其底层设计还支持**无锁并发**——多个进程甚至多机经分布式文件系统并发操作也不会损坏仓库。

> 实操建议：放手去 `rebase` / `squash` / `abandon`，搞砸了 `jj undo` 即可；这正是 jj 鼓励的「大胆改写历史」的底气。

## 一等冲突（first-class conflicts）

Git 里冲突会**阻塞**操作，逼你当场解完再 `--continue`。jj 把**冲突当作一等公民**：

- rebase / merge 产生的冲突会被**记录进提交**，**操作照常成功**，你可以**稍后任意时刻**再解
- 冲突提交还能被**继续 rebase / merge / 回退**，冲突会**传播给后代**直到被解决——但全程不打断你
- 解决方式：`jj resolve`（调外部合并工具逐个解）或直接编辑工作区里物化出的冲突标记，下次 jj 扫描时自动消解；提交里存的是冲突的**逻辑表示**而非裸标记，所以 rebase 冲突不会套娃出嵌套标记

```bash
jj rebase -s X -d Y        # 即使冲突也立即成功，冲突记进结果提交
jj st                      # 会提示哪些提交处于冲突态
jj resolve                 # 启动外部合并工具解决当前冲突
```

> 这从根本上消除了 `git rebase/merge/cherry-pick --continue` 的「中途卡死」体验：操作永远一步到位，解冲突变成一件**可延后、可拆分**的独立事情。

## bookmark 与 Git 协作

jj 的 **bookmark** ≈ Git 分支（命名的提交指针），但有个关键区别：**bookmark 不会像 Git 分支那样自动跟随 HEAD 前进**——jj 没有「当前分支」概念，你提交时 bookmark **不会自动移动**，需手动 `jj bookmark set` / `jj bookmark move`。日常的「匿名工作线」无需起名即可推进（`@` 一路 `jj new` 下去就行）。

```bash
jj bookmark create feat -r @     # 在 @ 处建 bookmark
jj bookmark set feat -r @        # 手动把 feat 移到 @（提交后需自己移）
jj bookmark list                 # 列出（main* 的星号表示与远程有差异、需推送）
```

与 Git 远程协作：

```bash
jj git fetch                     # 拉远程更新
jj git push --bookmark feat      # 推送指定 bookmark（带 force-with-lease 式安全检查）
jj git push -c @                 # 为 @ 自动创建 bookmark 并推送（-c = --change）
jj git push --all                # 推送所有 bookmark（注意：是所有 bookmark 不是所有提交）
```

**co-located 仓库**（`jj git init --colocate`）让 `.jj` 与 `.git` 共处一目录，`jj` 每条命令自动 import/export Git 引用，你能与 `git` 命令交替使用、团队其他人完全无感。注意 co-located 下混用 `git` 命令有边角坑：jj 命令常让 Git 处于 detached HEAD，跑变更类 `git` 命令前最好先 `git switch` 设好分支；后台 IDE 自动 `git fetch`、海量分支拖慢自动 import、冲突提交对 Git 工具不可读等都需留意——用 `jj op log` 能看到这些 git 操作并随时 `jj undo`。
