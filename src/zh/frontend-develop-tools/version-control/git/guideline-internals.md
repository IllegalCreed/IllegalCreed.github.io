---
layout: doc
outline: [2, 3]
---

# 指南 - 内部原理

> 基于 Git 2.47.x 编写 —— 瓷器与管道 / `.git` 结构 / 四种对象 / 引用与 HEAD / packfile / refspec / reflog 与数据恢复

## 速查

- **瓷器 vs 管道**：porcelain（`add`/`commit`/`log`…面向人）/ plumbing（`hash-object`/`cat-file`/`update-index`…面向脚本）
- **`.git` 关键内容**：`HEAD`（当前分支符号引用）/ `config` / `objects/`（对象库）/ `refs/heads`·`refs/tags` / `index`（暂存区）/ `logs/`（reflog）
- **四种对象**：`blob`（文件内容）/ `tree`（目录：名字→对象）/ `commit`（快照指针 + 父 + 作者 + 信息）/ `tag`（附注标签对象）
- **内容寻址**：对象名 = 内容的 SHA（默认 SHA-1，可选 SHA-256）；同内容必同名、天然去重
- **查看对象**：`git cat-file -t <sha>`（类型）/ `git cat-file -p <sha>`（内容）/ `git rev-parse HEAD`（解析成 sha）/ `git hash-object -w <file>`（写入 blob）
- **引用**：分支 = `refs/heads/<名>` 里的一行 sha；标签 = `refs/tags/<名>`；`HEAD` 通常符号引用到当前分支；`git symbolic-ref HEAD`
- **遍历 / 写引用**：`git for-each-ref` / `git update-ref refs/heads/x <sha>` / `git rev-list --all`
- **打包**：松散对象 → `git gc` 压成 packfile（`.pack` + `.idx`，增量 + zlib 压缩）；`git verify-pack` / `git count-objects -v`
- **refspec**：`<src>:<dst>`，如 `+refs/heads/*:refs/remotes/origin/*`（`+` 允许非快进更新）
- **reflog / 恢复**：`git reflog` 看 HEAD 移动史；误删提交 `git reset --hard HEAD@{2}` 或重建分支找回；悬空对象 `git fsck --lost-found`
- **维护**：`git gc` / `git gc --prune=now` / `git maintenance start`（后台定时优化）

## 瓷器与管道

Git 命令分两类：**porcelain（瓷器）** 是给人用的高层命令（`add`/`commit`/`merge`/`log`）；**plumbing（管道）** 是底层、输出稳定、给脚本用的命令（`hash-object`/`cat-file`/`update-index`/`write-tree`/`commit-tree`）。理解管道命令就理解了 Git 的本质——瓷器命令不过是管道命令的组合。

## `.git` 目录

```text
.git/
├── HEAD            # 指向当前分支，如 "ref: refs/heads/main"
├── config          # 仓库级配置
├── index           # 暂存区（二进制）
├── objects/        # 所有对象（松散对象 + packfile）
├── refs/
│   ├── heads/      # 本地分支（每个文件存一个 sha）
│   └── tags/       # 标签
└── logs/           # reflog（引用移动历史）
```

## 对象模型

Git 本质是一个**内容寻址的键值库**：把内容做哈希，用哈希当 key 存取。共四种对象：

| 对象 | 存什么 |
| --- | --- |
| **blob** | 一个文件的内容（不含文件名） |
| **tree** | 一个目录：一组「权限 + 名字 + 指向 blob/tree 的 sha」 |
| **commit** | 一棵 tree 的快照 + 父提交 + 作者/提交者 + 提交信息 |
| **tag** | 附注标签：指向某对象 + 标签信息（轻量标签则只是 refs 里一行 sha） |

亲手验证内容寻址：

```bash
echo 'hello' | git hash-object -w --stdin   # 写入 blob，返回 sha
git cat-file -t <sha>     # blob
git cat-file -p <sha>     # hello
git cat-file -p HEAD      # 看一个 commit 对象：tree / parent / author / message
git cat-file -p HEAD^{tree}   # 看根目录 tree
```

因为名字就是内容的哈希，**相同内容只存一份**（天然去重），且**任何改动都会改变哈希**——历史因此可校验、难篡改。对象名默认用 SHA-1，新仓库可选 SHA-256（`git init --object-format=sha256`）。

## 引用与 HEAD

**引用（ref）** 是给 sha 起的人类可读名字。分支就是 `refs/heads/<名>` 文件里的**一行 sha**；创建分支 = 写一个 41 字节文件，这就是分支"廉价"的原因。`HEAD` 是**符号引用**，通常指向当前分支（detached HEAD 时直接指向某 sha）。

```bash
cat .git/refs/heads/main      # 一行 sha
git rev-parse HEAD            # 把 HEAD 解析成具体 sha
git symbolic-ref HEAD        # refs/heads/main
git update-ref refs/heads/tmp <sha>   # 直接造一个分支
git for-each-ref --sort=-committerdate refs/heads   # 遍历所有分支
```

## packfile 与 gc

新对象先以**松散对象**（每个一文件，zlib 压缩）落盘。`git gc` 会把它们**打包**成 packfile（`.pack` 数据 + `.idx` 索引），并对相似对象做**增量压缩（delta）**，大幅省空间；push/fetch 传输的也是 pack。

```bash
git count-objects -v     # 松散对象数 / packfile 统计
git gc                   # 打包 + 清理
git verify-pack -v .git/objects/pack/*.idx | head
```

## refspec

refspec 描述"远程引用 ↔ 本地引用"的映射，格式 `<src>:<dst>`，`+` 前缀表示允许非快进（强制）更新。`git clone` 默认写入的：

```text
+refs/heads/*:refs/remotes/origin/*
```

意为把远程所有分支映射到本地 `origin/*` 跟踪分支。`git push origin main:main` 就是一条临时 refspec。

## reflog 与数据恢复

**reflog** 记录 HEAD 和各分支指针的每一次移动（本地、默认留 90 天），是 Git 的"后悔药总闸"——即使 `reset --hard` 或删了分支，提交对象通常还在，可循 reflog 找回：

```bash
git reflog                       # HEAD 的移动史：HEAD@{0}、HEAD@{1}...
git reset --hard HEAD@{2}        # 跳回两步前的状态
git switch -c rescue <丢失的sha>  # 用悬空提交的 sha 重建分支
git fsck --lost-found            # 列出悬空（dangling）对象
```

> 真正会**永久删除**悬空对象的是垃圾回收：`git gc --prune=now`。在确认无需找回前，别急着 gc。`git maintenance start` 可注册后台定时维护，自动保持仓库优化。
