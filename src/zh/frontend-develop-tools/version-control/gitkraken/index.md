---
layout: doc
---

# GitKraken

由 **Axosoft 出品的商业旗舰级跨平台 Git GUI 客户端**，以**标志性的可视化提交图（commit graph）+ 拖拽即操作**为核心交互，内置合并冲突编辑器、集成终端、一键 Undo/Redo，并深度集成 GitHub / GitLab / Bitbucket / Azure DevOps / Jira；免费版可用于本地与公共仓库，**私有仓库、多 Profile、Cloud Workspace、AI 等需 Pro 及以上订阅**。

## 评价

### 优点

- **可视化提交图 + 拖拽操作**：把仓库画成清晰的有向无环图（DAG），合并 / rebase / 交互式变基全靠拖拽分支或提交完成（松手弹出 fast-forward / merge / rebase 菜单），大幅降低 Git 心智负担
- **真正的全平台原生（含 Linux）**：Windows / macOS / Linux 三平台，Linux 提供 `.deb` / `.rpm` / `.tar.gz` / Snap / Flatpak 全格式安装包——这点压过不支持 Linux 的 GitHub Desktop
- **招牌 Undo / Redo**：一键 `Ctrl/Cmd+Z` 撤销 commit、checkout、删分支、reset、discard、rebase 等**本地操作**，是命令行需 `reflog` 手动救场、多数免费 GUI 没有的安全网
- **内置合并冲突编辑器**：复选框逐行从两侧挑选，外加 AI「Auto-resolve」带置信度评分；省去外部 mergetool
- **集成终端 + 深度平台集成**：应用内终端跑 Git 命令、提交图实时刷新；PR / MR / issue（Jira、Trello）全在客户端内完成
- **团队协作能力**：Workspaces 多仓库分组、Launchpad 跨仓库统一看 PR/issue/WIP、Team View 看同事分支防冲突

### 缺点

- **商业付费墙明显**：免费版**不能连私有仓库**（仅本地 + 公共远程），私有仓库 / 多 Profile / Cloud Workspace / 自托管集成 / 完整 AI 都要 Pro 或更高，是与「完全免费」的 GitHub Desktop、Sourcetree 的最大差异
- **资源占用偏重**：基于 Electron，启动与内存占用高于轻量 CLI 或原生客户端，超大仓库可能卡顿
- **「GUI 完成的操作需在 GUI 收尾」**：如交互式变基在 GitKraken 里启动后不能切到命令行收尾，灵活度受限
- **抽象遮蔽底层**：拖拽虽便捷，但容易让使用者不理解背后真实发生的 Git 操作，排错时仍需回到命令行心智

## 文档地址

[GitKraken Desktop Help](https://help.gitkraken.com/gitkraken-desktop/gitkraken-desktop-home/)

## GitHub地址

[gitkraken/vscode-gitlens](https://github.com/gitkraken/vscode-gitlens)（GitKraken 旗下开源的 GitLens；桌面客户端本体闭源）

## 幻灯片地址

<a href="/SlideStack/gitkraken-slide/" target="_blank">GitKraken</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=gitkraken" target="_blank" rel="noopener noreferrer">GitKraken 测试题</a>
