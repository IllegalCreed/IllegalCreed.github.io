---
layout: doc
---

# Fork

一款面向 macOS 与 Windows 的**原生 Git GUI 客户端**（产品名就叫「Fork」，与 git 里「fork（分叉）」这个概念无关），主打**原生高性能**、可视化交互式 rebase、内置三栏合并冲突解决器与图片差异对比，采用**一次性买断**授权（免费无限期试用，长期使用需购买许可）。

## 评价

### 优点

- **原生而非 Electron**：Mac/Windows 各用平台原生技术栈实现，**启动快、大仓库（上万提交）依旧流畅**——这是它对标 Electron 客户端（GitKraken）的核心卖点
- **可视化交互式 rebase**：图形界面里**拖拽重排提交**、squash / fixup / edit / reword / drop，把 `git rebase -i` 的心智负担降到最低
- **内置合并冲突解决器**：三栏（ours / base / theirs）并排、**逐行**取舍，冲突标记还会显示在滚动条上，无需外置 mergetool
- **图片差异对比**：对常见图片格式提供 **side-by-side / swipe（滑动）/ onion skin（洋葱皮叠加）** 三种比对模式，设计资源改动一目了然
- **交互细节打磨**：**stash 直接内联在提交列表**里、Quick Launch 命令面板（⌘P / Ctrl+P 模糊搜索分支/文件/命令）、内置终端、逐行/分块暂存、Blame 与文件历史、reflog 找回丢失提交
- **一次性买断**：$59.99 永久许可（1 用户 / 至多 3 台机器、Mac+Win 通用），含商业用途，长期成本低于订阅制
- **生态集成**：可直接为 GitHub / GitLab / Bitbucket / Azure DevOps 创建 PR，支持 Git LFS（含文件锁）、submodule、worktree、Git-flow、GPG 签名；近期还加入了 AI 生成提交信息 / 代码评审

### 缺点

- **不支持 Linux**：仅 macOS（10.11+）与 Windows（7+），Linux 用户只能选 GitKraken / lazygit 等替代
- **付费**：免费仅限「评估」，长期使用需购买（相对 Sourcetree 完全免费、GitHub Desktop 开源免费而言是门槛）
- **无实时团队协作**：不像 GitKraken 提供云端看板 / 实时协作，定位是单机高效客户端
- **仍是 Git 之上的壳**：复杂底层操作（filter-repo、自定义 refspec 等）仍需回到命令行，GUI 不是万能

## 文档地址

[Fork 官网与文档](https://git-fork.com/)

## GitHub地址

Fork 为闭源商业软件，无公开源码仓库；问题反馈见 [fork-dev/Tracker](https://github.com/fork-dev/Tracker)

## 幻灯片地址

<a href="/SlideStack/fork-slide/" target="_blank">Fork</a>
