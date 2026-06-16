---
layout: doc
---

# GitHub Desktop

由 GitHub 官方出品的**免费、开源**的 **Git 图形客户端（GUI）**，把 commit / branch / push / pull 等 Git 操作变成**可视化点击**，并与 GitHub 的 **PR / Issue / Fork** 协作流深度集成，让不熟悉命令行的人也能顺畅参与版本控制。仅支持 **Windows 与 macOS**。

## 评价

### 优点

- **新手友好、零命令行门槛**：把 `add` / `commit` / `push` / `pull` / `branch` 映射成按钮与下拉菜单，改了哪些文件、改了哪几行一目了然（红删 / 黄改 / 绿增）
- **可视化 diff + 行级/块级提交**：在差异视图里逐行勾选要提交的改动（相当于命令行的 `git add -p`），轻松把一团混合改动拆成干净的多个提交
- **与 GitHub 协作流无缝衔接**：一键发起 PR、创建 Issue、Fork、检出别人的 PR 在本地跑 CI 检查，省去频繁切浏览器
- **高级操作也有可视化入口**：amend / revert / cherry-pick / squash / reorder 都能在历史里**右键或拖拽**完成，并贴心地提醒"别改写已推送的历史"
- **官方出品、协同省心**：随 GitHub 账号一键登录，自动管理凭据；内置 co-author、Copilot 生成提交信息等便利功能

### 缺点

- **平台受限**：只有 Windows / macOS，**官方不支持 Linux**
- **能力有边界**：交互式 rebase、`git bisect`、子模块精细操作、reflog 找回等高级场景仍需命令行或更专业的客户端
- **暂存（stash）功能弱**：一次只能存**一组**改动，不能命名、不能多份并存
- **PR / Issue 表单仍跳浏览器**：客户端只负责发起，真正填标题、描述、选 reviewer 还是在 GitHub 网页完成
- **抽象屏蔽细节**：长期只点按钮容易对 Git 底层模型（暂存区、HEAD、对象）理解不深，遇到复杂冲突时容易卡住

## 文档地址

[GitHub Desktop Documentation](https://docs.github.com/en/desktop)

## GitHub地址

[desktop/desktop](https://github.com/desktop/desktop)

## 幻灯片地址

<a href="/SlideStack/github-desktop-slide/" target="_blank">GitHub Desktop</a>
