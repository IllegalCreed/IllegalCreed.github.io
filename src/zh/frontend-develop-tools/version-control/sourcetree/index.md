---
layout: doc
---

# Sourcetree

由 **Atlassian 出品的免费 Git / Mercurial 图形客户端（GUI）**，主打"漂亮、易上手"地把暂存、提交、分支、合并、交互式变基等操作搬进可视化界面，与 **Bitbucket / Atlassian 生态**深度集成，支持 **macOS 与 Windows**。

## 评价

### 优点

- **完全免费且功能完整**：个人 / 商用均免费，开箱即带 Git-flow、Git LFS、子模块、交互式变基等高级能力，无付费墙
- **同时支持 Git 与 Mercurial**：同一界面管两套 DVCS，是少数仍原生支持 Mercurial 的主流 GUI（迁移 / 历史仓库友好）
- **可视化交互式变基**：在"重排与修订"窗口里**拖拽**即可 squash / reword / reorder / edit / delete 提交，把 `rebase -i` 的心智门槛降到最低
- **精细暂存**：可按**文件 / 代码块（hunk）/ 单行**暂存或丢弃改动，对应 `git add -p` 的精确构造提交能力
- **Atlassian 生态集成**：内置账户托管，一键克隆 Bitbucket 仓库，与 Jira / Bitbucket Pipelines 协作顺畅
- **自定义操作（Custom Actions）**：把任意脚本 / Git 命令包装成右键菜单项，用 `$SHA`、`$REPO` 等占位符接收上下文，弥补 GUI 未覆盖的命令

### 缺点

- **不支持 Linux**：仅 macOS / Windows，Linux 用户需转向 GitKraken / Fork 等
- **非开源、闭源专有**：代码不公开，遇 Bug 只能等官方修，社区无法贡献
- **大仓库 / 大量分支时偏卡**：历史图谱与状态刷新在巨型仓库下性能不如 GitKraken / Fork 流畅
- **更新节奏缓慢**：Windows 与 macOS 版本号长期不一致，新特性推进慢，部分历史 Bug 长期存在
- **提交图谱观感一般**：传统三栏布局，分支拓扑图的美观与交互不及 GitKraken 的"招牌"图谱

## 文档地址

[Get started with Sourcetree](https://confluence.atlassian.com/get-started-with-sourcetree) · [官网](https://www.sourcetreeapp.com/)

## GitHub地址

Sourcetree **非开源**，无公开源码仓库。官方入口：[sourcetreeapp.com](https://www.sourcetreeapp.com/) · [Atlassian 支持](https://support.atlassian.com/sourcetree/)

## 幻灯片地址

<a href="/SlideStack/sourcetree-slide/" target="_blank">Sourcetree</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=sourcetree" target="_blank" rel="noopener noreferrer">Sourcetree 测试题</a>
