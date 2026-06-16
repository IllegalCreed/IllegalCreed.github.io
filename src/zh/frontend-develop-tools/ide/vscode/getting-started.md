---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 VS Code 官方文档（2026）编写。快捷键以 `Windows/Linux` · `macOS` 并列给出。

## 速查

- 下载：<https://code.visualstudio.com>
- 命令面板（所有功能入口）：`Ctrl+Shift+P` · `⇧⌘P`
- 快速打开文件：`Ctrl+P` · `⌘P`
- 扩展视图：`Ctrl+Shift+X` · `⇧⌘X`
- 设置：`Ctrl+,` · `⌘,`（底层是 `settings.json`）
- 集成终端：`` Ctrl+` ``
- 命令行：安装后在终端用 `code .` 打开当前目录、`code 文件` 打开文件

## 安装

到官网下载对应平台安装包；macOS 拖入「应用程序」，Windows 建议勾选「Add to PATH」。

安装后注册 `code` 命令行（macOS 若未自动注册，可在命令面板执行 **Shell Command: Install 'code' command in PATH**）：

```bash
code .              # 在当前目录打开 VS Code
code a.ts b.ts      # 打开多个文件
code --diff a b     # 以 diff 模式比较两个文件
code --add ./pkg    # 把文件夹加入当前工作区
```

::: tip 稳定版与每月更新
VS Code 采用月度发布（版本号形如 `1.x`），并提供抢先体验的 **Insiders** 版本（与稳定版可共存）。生产环境用 Stable 即可。
:::

## 界面布局

VS Code 界面由六大区域组成：

| 区域 | 说明 |
| --- | --- |
| 活动栏 Activity Bar | 最左侧，切换资源管理器 / 搜索 / 源代码管理 / 调试 / 扩展等视图 |
| 主侧栏 Primary Side Bar | 活动栏对应的面板内容（如文件树） |
| 次侧栏 Secondary Side Bar | 默认放置 AI 聊天视图，可拖动其它视图过来 |
| 编辑器 Editor | 核心工作区，支持多分组网格布局 |
| 面板 Panel | 编辑器下方，含集成终端、问题、输出、调试控制台 |
| 状态栏 Status Bar | 底部，显示分支、错误数、编码、语言模式等 |

常用界面快捷键：

```text
Ctrl+B  · ⌘B       切换侧栏显隐
Ctrl+\  · ⌘\       拆分编辑器
Ctrl+1/2/3         聚焦第 1/2/3 个编辑器组
Ctrl+K Z           Zen 专注模式
```

## 命令面板与快速导航

命令面板 `Ctrl+Shift+P` 是访问 VS Code **一切功能**的入口；输入不同前缀切换模式：

| 输入 | 作用 | 快捷键 |
| --- | --- | --- |
| 直接输命令名 | 运行命令 | `Ctrl+Shift+P` · `⇧⌘P` |
| `文件名` | 快速打开文件 | `Ctrl+P` · `⌘P` |
| `:行号` | 跳到指定行 | `Ctrl+G` · `⌃G` |
| `@符号` | 跳到当前文件符号 | `Ctrl+Shift+O` · `⇧⌘O` |
| `#符号` | 跨工作区搜符号 | `Ctrl+T` · `⌘T` |
| `>命令` | 命令模式（同命令面板） | — |

## 扩展

扩展视图 `Ctrl+Shift+X` 连接 **Marketplace**。

- 安装：搜索后点 **Install**；指定版本用右键 **Install Another Version**；离线安装 `code --install-extension xxx.vsix`
- 工作区推荐：命令 **Extensions: Configure Recommended Extensions** 生成 `.vscode/extensions.json`，团队成员打开项目时会被提示安装：

```json
// .vscode/extensions.json
{
  "recommendations": ["dbaeumer.vscode-eslint", "esbenp.prettier-vscode"]
}
```

- 管理：齿轮菜单可 **Disable (Workspace)** 仅在当前项目禁用；`extensions.autoUpdate` 控制自动更新

::: warning 发布者信任
自 1.97 起，首次安装某个第三方发布者的扩展会弹框要求确认信任该发布者；蓝色对勾表示已验证域名所有权。
:::

## 设置体系

设置分多级，优先级由低到高大致为 **默认 < 用户(User) < 远程 < 工作区(Workspace) < 工作区文件夹 < 企业策略(Policy)**；语言特定设置始终覆盖同级的非语言设置。

| 范围 | 文件 | 适用 |
| --- | --- | --- |
| 用户 User | `…/Code/User/settings.json` | 全局，跨所有窗口 |
| 工作区 Workspace | `.vscode/settings.json` | 随项目提交、团队共享 |

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.tabSize": 2,
  // 语言特定设置用方括号包裹语言 ID
  "[markdown]": { "editor.wordWrap": "on" }
}
```

::: tip 安全敏感项只能写在用户级
`git.path`、`terminal.external.*Exec` 等设置出于安全只在 **User** 级生效，写进工作区无效。
:::

## 快捷键自定义

命令 **Preferences: Open Keyboard Shortcuts** (`Ctrl+K Ctrl+S` · `⌘K ⌘S`) 打开编辑器；底层是 `keybindings.json`：

```jsonc
[
  { "key": "ctrl+alt+f", "command": "editor.action.formatDocument" },
  // 移除某个默认绑定：命令名前加 "-"
  { "key": "ctrl+b", "command": "-workbench.action.toggleSidebarVisibility" }
]
```

- `when` 子句限定生效上下文，如 `"editorTextFocus && !editorReadonly"`
- **和弦**用空格分隔（`ctrl+k ctrl+w`），`+` 表示同时按

## 集成终端

`` Ctrl+` `` 开关终端，`` Ctrl+Shift+` `` 新建；`Ctrl+Shift+5` 拆分。

- **Terminal Profiles**：`terminal.integrated.defaultProfile.<平台>` 设默认 shell
- **Shell Integration**（命令装饰、命令间导航 `Ctrl+Up/Down`、运行最近命令 `Ctrl+Alt+R`、快速修复）默认自动注入，支持 bash/zsh/fish/pwsh

## 源代码管理（Git）

需先安装 Git 并配置 `user.name`/`user.email`。活动栏的**源代码管理**视图集中管理：

- 暂存：在文件 hover 点 `+`；VS Code 还能**按选区暂存**（diff 编辑器选中行后点装订线 **Stage**）
- 提交：输入消息后点 **Commit**；下拉可 **Commit (Amend)**
- 合并冲突：内联 CodeLens 提供 **Accept Current / Incoming / Both**，复杂冲突用 **3-way 合并编辑器**（左 Incoming、右 Current、底 Result）

## 调试

按 `F5` 启动调试；调试控制：

```text
F5         启动 / 继续
F9         切换断点
F10        单步跳过 Step Over
F11        单步进入 Step Into
Shift+F11  单步跳出 Step Out
Shift+F5   停止
```

调试配置写在 `.vscode/launch.json`（`"version": "0.2.0"`），三个必填字段是 **`type` / `request` / `name`**，`request` 取 `launch`（自己启动应用）或 `attach`（连接已运行进程）：

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "运行当前文件",
      "program": "${workspaceFolder}/${relativeFile}"
    }
  ]
}
```

::: tip 任务自动化
重复命令（构建/测试）可写进 `.vscode/tasks.json`（`"version": "2.0.0"`），`Ctrl+Shift+B` 运行默认构建任务。
:::

## 下一步

- AI / Agent（2026 重点）：见 [AI 与 Agent](./guideline-ai.md)
