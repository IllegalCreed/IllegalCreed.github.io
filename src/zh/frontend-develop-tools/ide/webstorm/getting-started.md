---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 WebStorm 官方文档（2026）编写。快捷键以 Windows/Linux 为主，macOS 通常把 `Ctrl→⌘`、`Alt→⌥`（部分例外以 IDE 内 Keymap 为准）。

## 速查

- 下载：<https://www.jetbrains.com/webstorm/>
- 万能搜索 Search Everywhere：**双击 Shift**
- 查找动作 Find Action：`Ctrl+Shift+A`
- 意图动作 / 快速修复：`Alt+Enter`
- 重构此处 Refactor This：`Ctrl+Alt+Shift+T`
- 重命名 Rename：`Shift+F6`
- 集成终端：`Alt+F12`

## 安装与授权

下载安装后有 30 天试用；**非商业用途免费**，学生与开源项目可申请免费授权，商业用途需订阅。

::: tip WebStorm vs IntelliJ IDEA Ultimate
WebStorm 是前端/JS 专精、更轻更便宜；IDEA Ultimate 是全栈多语言旗舰，通过捆绑插件已包含 WebStorm 的全部前端能力。纯前端选 WebStorm。
:::

## 导航：Search Everywhere 与跳转

JetBrains 的导航体系是其效率核心：

- **Search Everywhere**（双击 `Shift`）：统一入口，搜文件/类/符号/动作/文本/Git，还能算数学表达式
- **Find Action**（`Ctrl+Shift+A`）：执行任何动作，**即使它没绑定快捷键**
- 定向跳转：Go to File `Ctrl+Shift+N`、Go to Class `Ctrl+N`、Go to Symbol `Ctrl+Alt+Shift+N`
- **Recent Files** `Ctrl+E`（macOS `⌘E`）、Go to Declaration `Ctrl+B`、Find Usages `Alt+F7`

## 智能编码与意图动作

- 基础补全 `Ctrl+Space`；类型匹配（智能）补全 `Ctrl+Shift+Space`；语句补全 `Ctrl+Shift+Enter`
- Quick Documentation `Ctrl+Q`、Parameter Info `Ctrl+P`

**意图动作（Intention）vs 快速修复（Quick-fix）** 是 JetBrains 核心概念，都用 `Alt+Enter` 触发：

| 灯泡 | 含义 |
| --- | --- |
| 🟡 黄灯泡 | 意图动作：优化/转换建议（不一定是错误） |
| 🔴 红灯泡 | 快速修复：针对检测到的错误/警告（可用 `Alt+Shift+Enter` 直接套用） |

## 重构

**Refactor This**（`Ctrl+Alt+Shift+T`）弹出当前上下文所有可用重构：

| 重构 | 快捷键 |
| --- | --- |
| Rename（跨文件更新引用） | `Shift+F6` |
| Extract Variable / Method | `Ctrl+Alt+V` / `Ctrl+Alt+M` |
| Inline（与 Extract 互逆） | `Ctrl+Alt+N` |
| Move / Safe Delete | `F6` / `Alt+Delete` |
| Change Signature | `Ctrl+F6` |

重构带 **Preview Changes**（预览影响、可排除部分）与 **Conflict Detection**（冲突检测）；**Safe Delete** 删除前检查引用，防误删被引用文件。

## 运行与调试

- **Run/Debug Configurations**：命名的启动属性集，分**临时**（右键 Run 自动生成，半透明图标，**默认上限 5 个**）与**永久**（持久化，可勾「Store as project file」随 VCS 共享）
- 断点：行断点 `Ctrl+F8`、**条件断点**（填 JS 布尔表达式）、**异常断点**；Logpoint 通过断点的 **Log 属性**实现（不挂起即可打印）
- 单步：Step Over `F8`、Step Into `F7`、Step Out `Shift+F8`、**Smart Step Into** `Shift+F7`、Resume `F9`、Evaluate `Alt+F8`

::: warning JS 客户端调试仅支持 Chrome/Chromium 系
浏览器端 JS 调试不支持 Firefox/Safari；Node.js、React、Vue、Electron 等均开箱即用、自动处理 source map。
:::

## 版本控制与 Local History

- Commit `Ctrl+K`、Push `Ctrl+Shift+K`；支持 Changelists、chunk/行级部分提交、Staging Area
- **Local History（本地历史）** 是 JetBrains 独有：**独立于 Git**，自动持续记录项目改动，可恢复未入库的删除文件

::: warning Local History 的边界
它**不能替代正式版本控制**做长期管理；**升级 WebStorm 时会被清空**；默认仅保留约 5 个工作日。
:::

## 内置工具

- **集成终端** `Alt+F12`（可启 Junie / Claude Code / Codex 等 AI Agent）
- **HTTP Client**：`.http` / `.rest` 文件，编辑器内编写并 Run，支持环境变量、WebSocket/gRPC/GraphQL
- **数据库工具**：内嵌 DataGrip 全功能（连 MySQL/PostgreSQL/SQLite 等）
- **Prettier**：非内置，装为依赖后出现「Reformat with Prettier」（`Ctrl+Alt+Shift+P`）
- **ESLint**：默认自动检测 `node_modules` 内 ESLint，可「Run eslint --fix on save」

## keymap：可切 VSCode / Vim

`Settings | Keymap` 可切换为 **VS Code keymap**（降低迁移成本）等预定义方案；**Vim 通过 IdeaVim 插件**实现（配置文件 `.ideavimrc`），并非内置 keymap。

## 下一步

- AI Assistant 与 Junie：见 [AI 与 Junie](./guideline-ai.md)
