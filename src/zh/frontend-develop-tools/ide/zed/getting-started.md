---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Zed 官方文档（2026）。快捷键以 `macOS` · `Linux/Windows` 并列。

## 速查

- 下载：<https://zed.dev>（macOS / Linux / Windows）
- 命令面板：`cmd-shift-p` · `ctrl-shift-p`
- 文件查找（go to file）：`cmd-p` · `ctrl-p`
- 项目搜索：`cmd-shift-f` · `ctrl-shift-f`
- Agent 面板：`cmd-shift-a` · `ctrl-shift-a`
- 配置文件：`settings.json`（JSONC）

## 为何快

Zed **用 Rust 从零重写**，高效利用多核 CPU + GPU；UI 由自研的 **GPUI**（GPU 加速 UI 框架）渲染。它是**原生应用，不基于 Electron**——这是与 VS Code 的根本架构差异，主打低输入延迟与快启动。

## Multibuffer：招牌特性

Multibuffer 让你在**一个视图里同时编辑多个文件**的片段（excerpt），改动自动回写底层文件。

以下操作会打开 multibuffer：

- 项目搜索（每条匹配行 = 一个 excerpt）
- Find All References（查找所有引用）
- Diagnostics（全项目诊断）
- Go to Definition（多个定义时）

配合多光标做大规模重构最强。

## 编辑与导航

- 多光标：`cmd-d` · `ctrl-d` 选下一个匹配；`cmd-shift-l` 选所有匹配
- 基于 **LSP**（补全/诊断/重命名/跳转）与 **tree-sitter**（语法感知选择/导航）
- **Edit Prediction**：Zed 自研开源模型 **Zeta** 驱动的 AI 补全，`tab` 接受（详见 AI 页）
- 导航：Go to Symbol `cmd-shift-o`（当前文件）/ `cmd-t`（整个项目）、Outline `cmd-shift-b`

## 协作

`cmd-shift-c` 打开协作面板（需 GitHub 登录），含 Channels 与 Contacts：

- **Channels（频道）**：持久化团队协作房间，**默认 private**，可设 public（guest 只读）；支持嵌套子频道
- **Channel Notes**：每个频道关联一个 Markdown 笔记，**无需加入频道即可查看**
- **Share Project**：右上角 Share，协作者可像本地一样编辑你机器上的代码

::: warning 共享即暴露文件系统
共享项目会让协作者访问你该项目内的本地文件系统，**只与信任的人协作**。
:::

## Vim mode

命令面板 `workspace: toggle vim mode` 启用（设 `"vim_mode": true`）。它不是 1:1 复刻，而是「Vim 模态 + Zed 现代特性」：

- tree-sitter 语义文本对象：`af/if`（函数）、`ac/ic`（类）
- Zed 扩展：`gd`（跳定义）、`gA`（所有引用）、`g.`（code actions）

::: warning 正则差异（易错）
Zed 的 Vim 用自家正则引擎：捕获组用 `(` `)`（非 Vim 的 `\(` `\)`），替换用 `$1`（非 `\1`），默认全局；`:` 命令不支持参数（不能 `:w file.txt`）。
:::

## Git 集成

- **Git Panel** 显示工作树/暂存区/分支；gutter 彩色标记增删改行
- **Inline Blame**：当前行显示 git blame
- 逐 hunk 暂存 `git: stage and next`（`cmd-y`）；提交 `git: commit`（`cmd-enter`）

## 配置

- **settings.json**（JSONC，可写注释）：用户级在 `~/.config/zed/`（macOS 在 Application Support），项目级 **`.zed/settings.json`** 覆盖用户级
- **keymap.json**：可选 base keymap（VS Code 默认 / JetBrains / Sublime / Cursor 等）+ Vim/Helix
- 主题：`"theme": { "mode": "system", "light": "One Light", "dark": "One Dark" }`，选择器 `cmd-k cmd-t`

## 下一步

- AI（Agent / Edit Prediction / MCP）：见 [AI 与 Agent](./guideline-ai.md)
