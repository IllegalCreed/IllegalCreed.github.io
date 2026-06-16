---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Sublime Text 4 官方文档（2026）。快捷键以 `Win/Linux` · `macOS` 并列。

## 速查

- 下载：<https://www.sublimetext.com>
- 选下一个相同词：`Ctrl+D` · `⌘+D`
- Goto Anything（导航）：`Ctrl+P` · `⌘+P`
- Command Palette：`Ctrl+Shift+P` · `⌘+Shift+P`
- 命令行：`subl .` 打开当前目录

## 安装与授权

可**免费下载并无限期评估**，但持续使用需购买：

- **个人许可**：$99 一次性（跨所有设备/系统，含 3 年更新）——非订阅
- **商业许可**：按席位**年订阅**

## 多光标 / 多选（核心卖点）

| 功能 | Win/Linux | macOS | 术语 |
| --- | --- | --- | --- |
| 选下一个相同词 | `Ctrl+D` | `⌘+D` | **Quick Add Next** |
| 跳过当前匹配 | `Ctrl+K, Ctrl+D` | `⌘+K, ⌘+D` | Quick Skip Next |
| 选全部相同 | `Alt+F3` | `⌃+⌘+G` | **Find All** |
| 拆分选区为多行光标 | `Ctrl+Shift+L` | `⇧+⌘+L` | Split into lines |
| 撤销多选步骤 | `Ctrl+U` | `⌘+U` | Soft Undo |

::: tip 列选择不是独立模式
列/块选择是用「多重选区选中矩形」实现：Win/Linux 右键+`Shift`（或中键拖），macOS 左键+`Option`（或中键拖）。
:::

## Goto Anything 与 Command Palette

**Goto Anything**（`Ctrl+P`）用前缀切换模式：

- `@` → 跳转**符号**（本文件）
- `:` → 跳转**行号**
- `#` → 文件内**模糊搜索**
- 可组合：`文件名@符号`、`文件名:行号`

**Command Palette**（`Ctrl+Shift+P`）模糊匹配执行命令。

## 代码导航

- Goto Definition：`F12`；Goto References：`Shift+F12`
- Goto Symbol（本文件）：`Ctrl+R` · `⌘+R`（等价 Goto Anything 的 `@`）
- Goto Symbol in Project：`Ctrl+Shift+R` · `⌘+Shift+R`
- 由索引引擎驱动（`index_files` 默认开）

## Package Control 与包

**Package** 是资源集合（插件/语法/菜单/片段等），形态为 `.sublime-package`（zip）或松散目录。

::: warning Package Control 是第三方
**Package Control 不是官方内置**——它是社区事实标准的包管理器。装好后用 Command Palette → `Package Control: Install Package` 安装包。
:::

## 配置

配置是**纯 JSON**（非 GUI）。核心文件 `Preferences.sublime-settings`：

- **Default 勿改**（`Packages/Default/`，含全部设置说明）；自定义写 `Packages/User/Preferences.sublime-settings`
- 键位文件 `.sublime-keymap`，跨平台修饰键用 **`primary`**（Win/Linux=Ctrl，Mac=⌘）

## 下一步

- 配置优先级、项目、构建系统：见 [配置与构建](./guideline-config.md)
