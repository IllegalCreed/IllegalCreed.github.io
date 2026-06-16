---
layout: doc
---

# Jujutsu

由前 Mercurial / Git 贡献者 **Martin von Zweigbergk 在 Google 发起**的**新一代版本控制系统**（命令行工具叫 `jj`，常被直接称为「jj」），**默认以 Git 仓库为后端存储**、可直接操作现有 Git 仓库并与 Git 用户无缝协作，却用一套全新的心智模型重构了工作流：**工作区本身就是一个提交、没有暂存区、自动快照、冲突是一等公民、所有操作都进 operation log 可随时 `jj undo`**。它不是「换皮的 Git」，而是把 Git 的痛点（暂存区认知负担、冲突阻塞流程、reflog 难用、`rebase --continue` 地狱）系统性地重新设计。

## 评价

### 优点

- **工作区即提交（working-copy-as-a-commit）**：当前工作区对应一个真实提交 `@`，**没有独立暂存区**——你不再需要 `git add`，改了文件就等于改了 `@` 这个提交，心智负担骤降
- **自动快照**：几乎每条 `jj` 命令运行前都会自动把工作区变更快照进 `@`，无需手动 `add`／`commit` 即可安全地切换、`log`、`rebase`
- **稳定的 change-id**：每个改动有一个**贯穿其演化全程不变的 change-id**（类似 Gerrit Change-Id），即使内容被改写、commit-id（哈希）变了，change-id 仍稳定——天然适配「同一改动反复打磨/重排」的工作流
- **operation log + `jj undo`**：**每一次仓库状态变更**（提交、rebase、abandon、git import…）都记进 operation log，`jj undo` 可逐步撤销**任意操作**（不只是提交），比 Git 的 reflog 更完整、更易用，且**无锁并发**安全
- **一等冲突（first-class conflicts）**：冲突可以**被记录进提交**、操作照常成功、稍后再解；rebase 一串提交即使中途冲突也不会中断，**告别 `rebase/merge/cherry-pick --continue`**
- **Git 兼容 + co-located 仓库**：可与 `.git` 共处一目录（`jj git init --colocate`），`jj` 与 `git` 命令交替使用，团队其他人甚至感知不到你没在用 Git
- **revsets 查询语言**：借鉴 Mercurial 的函数式 revset（如 `@`、`@-`、`x::y`、`heads()`、`mine()`），精确选取提交集合，远比 Git 的 `A..B` 语法表达力强

### 缺点

- **生态尚年轻**：2024 年才进入大众视野，GitHub/GitLab 一侧仍以 Git 为准，IDE/GUI 集成、教程、招聘认知度远不及 Git
- **术语迁移成本**：bookmark（≈分支但不自动跟随 HEAD）、change-id vs commit-id、operation log 等概念需要重新建立心智，老 Git 用户需「忘掉」部分习惯
- **部分 Git 特性未支持**：submodule、Git LFS、hooks、`.gitattributes`、partial/shallow 的深化等尚不支持或仅部分支持（详见官方 git-compatibility 页）
- **co-located 下交叉用 git 命令有坑**：后台 IDE 自动 `git fetch`、大量分支拖慢自动 import、冲突提交对 Git 工具不可读等，混用 `jj`/`git` 仍可能踩边角

## 文档地址

[Jujutsu Documentation](https://jj-vcs.github.io/jj/latest/)

## GitHub地址

[jj-vcs/jj](https://github.com/jj-vcs/jj)

## 幻灯片地址

<a href="/SlideStack/jujutsu-slide/" target="_blank">Jujutsu</a>
