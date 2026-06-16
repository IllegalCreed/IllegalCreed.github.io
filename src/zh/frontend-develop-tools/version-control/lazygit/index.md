---
layout: doc
---

# lazygit

由 **Jesse Duffield** 开发的**终端 Git TUI（文本用户界面）**：在终端里以**五大面板 + 纯键盘驱动**的方式完成几乎所有 Git 操作（暂存、提交、推拉、分支、交互式 rebase、可视化分块/分行暂存等），既保留了命令行 Git 的全部能力，又免去了记忆晦涩参数和手编 rebase TODO 文件之苦。

## 评价

### 优点

- **键位驱动、极快**：核心操作一两个键直达（`空格`暂存、`c`提交、`P`推送、`p`拉取），手不离键盘，远比反复敲长命令高效
- **可视化分块/分行暂存**：进入文件后用 `空格`逐行、`v`框选范围、`a`切换块/行模式，把混合改动拆成干净提交——无需手编 `git add -p` 的补丁
- **交互式 rebase 零门槛**：`i` 启动交互式 rebase，用 `s`/`f`/`d`/`e` 当场 squash/fixup/drop/edit，`<c-j>`/`<c-k>` 上下移动提交，不必编辑 rebase TODO 文件
- **基于 reflog 的撤销/重做**：`z` 撤销、`Z` 重做（连在命令行外做的操作也能撤），降低误操作恐惧
- **强大的自定义命令**：`customCommands` 可把任意 shell/git 命令绑到自定义键位，支持 menu/input/confirm 交互式提示与占位符
- **轻量、跨平台、单文件**：Go 编写，启动快、依赖少，配合 nerd fonts 还能显示图标

### 缺点

- **学习曲线在于"记键位"**：面板间键位随上下文变化（同一个键在不同面板含义不同），`?` 菜单虽可随时查，但上手期仍需适应
- **不替代理解 Git 概念**：它是 Git 的高效前端，rebase/reset/cherry-pick 等底层概念仍需懂，否则容易误操作
- **撤销有边界**：`z`/`Z` 只覆盖 reflog 记录的提交/分支变化，**工作区改动、stash 改动、已推送操作无法撤销**，rebase 中途也不支持撤销
- **纯终端、无鼠标优先**：虽支持有限鼠标事件，但定位是键盘流；偏好图形拖拽的用户可能不习惯

## 文档地址

[lazygit Docs / Config](https://github.com/jesseduffield/lazygit/tree/master/docs)

## GitHub地址

[jesseduffield/lazygit](https://github.com/jesseduffield/lazygit)

## 幻灯片地址

<a href="/SlideStack/lazygit-slide/" target="_blank">lazygit</a>
