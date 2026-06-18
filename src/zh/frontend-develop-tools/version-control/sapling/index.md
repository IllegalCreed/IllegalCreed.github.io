---
layout: doc
---

# Sapling

由 **Meta（Facebook）开源**、命令行工具为 **`sl`** 的**可扩展、用户友好型源码控制系统**。它**脱胎于 Mercurial**（源码在 `eden/scm`），融合 Git/Mercurial 概念并改进工作流，主打**无暂存区、分支可选、栈式开发与可视化 smartlog**；同时**兼容 Git**，可直接 clone 与操作 GitHub 上的 Git 仓库。诞生于 Meta 内部数千万文件级 monorepo 的实战需求，核心理念是把「版本控制的 UX 与扩展性」和「仓库格式」解耦。

## 评价

### 优点

- **无暂存区 + 分支可选**：心智负担低，靠 hash + smartlog 工作，免去 index 与分支名管理
- **一等的栈式开发**：first-class stacked commits，配合自动 restack 与 `absorb`/`split`/`fold`，迭代评审流畅
- **强大易懂的撤销**：`sl undo` / `sl undo -i` 可视化回退，远比 Git 的 `reset`/`reflog` 友好
- **内置可视化**：`sl smartlog` 命令行提交图 + `sl web`（ISL）拖拽式 Web GUI，附 GitHub PR 状态
- **Git 兼容 + 可渐进引入**：`.git` 模式下 `git` 与 `sl` 共存，团队可平滑试水
- **为超大 monorepo 而生**：Meta 在数千万文件/commit/branch 规模的生产实战系统

### 缺点

- **扩展性杀手锏开源用户暂享不到**：虚拟文件系统 **EdenFS** 与服务端 **Mononoke**「源码有但未进公开发布版 / 尚未公开支持」，`brew install` 后只有 CLI + ISL + Git 兼容部分
- **设计取向有偏**：官方自陈面向「企业级、始终在线、单 master、以 rebase 为中心、monorepo」，在非 monorepo、离线、多 master、merge 工作流场景非设计重点
- **生态与熟悉度不及 Git**：工具链、第三方集成、团队认知度远不如 Git
- **命令风格需重新适应**：`goto` / `metaedit` / `absorb` 等概念与 Git 心智差异大，「不鼓励用分支」尤其反直觉
- **版本号无语义化**：形如 `0.2.YYYYMMDD-HHMMSS+hash` 的日期版本，难以判断兼容性

## 文档地址

[Sapling](https://sapling-scm.com/)

## GitHub地址

[facebook/sapling](https://github.com/facebook/sapling)

## 幻灯片地址

<a href="/SlideStack/sapling-slide/" target="_blank">Sapling</a>
