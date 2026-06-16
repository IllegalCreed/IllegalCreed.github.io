---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Cursor 官方文档（2026）编写。快捷键以 macOS 为主，Windows/Linux 把 `Cmd→Ctrl`、`Opt→Alt`。

## 速查

- 下载：<https://cursor.com>
- 自动补全：**Tab**（接受）；逐词接受 `Cmd+→`
- 内联编辑：`Cmd+K`
- 打开 Chat/Agent 侧栏：`Cmd+I` 或 `Cmd+L`
- 切换 Agent 模式：`Shift+Tab` 循环（Agent / Ask / Plan / Debug）
- 引用上下文：聊天里输 `@`
- Cursor 设置 / 从 VS Code 导入：`Cmd+Shift+J`

## 安装与从 VS Code 迁移

Cursor 是 VS Code 的 fork，迁移几乎零成本：`Cmd+Shift+J` → General → Account → 「VS Code Import」一键导入 **扩展 / 主题 / 设置 / 快捷键**。

::: warning 扩展来自 Open VSX
Cursor 用 **Open VSX** 注册表而非微软官方 Marketplace，多数热门扩展可用，但**部分扩展缺失或行为略有不同**。
:::

## Tab：预测式自动补全

Cursor 的招牌能力，基于你近期编辑、周围代码与 linter 错误预测补全：

- `Tab` 接受整条；`Cmd+→` 逐词接受；`Esc` 或继续打字即拒绝
- **jump-in-file**：接受后再按 `Tab` 跳到下一处预测编辑点，还能预测**跨文件**改动

## Cmd+K：内联编辑

在编辑器内对选中代码或光标处做**定向小改**，无需打开聊天面板：

- `Cmd+K` 打开 → 描述需求 → `Return` 应用
- `Opt+Return` 切到「快速提问」；`Cmd+L` 把选中代码带入 Agent 升级为多文件任务
- 终端里 `Cmd+K` 用自然语言生成 shell 命令，`Cmd+Return` 执行

## Chat 面板与四种模式

`Cmd+I` / `Cmd+L` 打开侧栏；同一面板内用 `Shift+Tab` 循环四模式：

| 模式 | 作用 | 改代码 |
| --- | --- | --- |
| **Agent** | 自主搜索代码库、多文件编辑、跑命令、修错迭代 | 是 |
| **Ask** | 只读理解代码、回答问题 | 否 |
| **Plan** | 先调研提问、产出可编辑实施计划，再执行 | 否（先出计划） |
| **Debug** | 针对需要运行时证据的疑难 bug | 是 |

::: tip Checkpoints（检查点）
Agent 改动前会自动快照，可「Restore Checkpoint」回滚——它**独立于 Git**，不是 commit。
:::

## @ 上下文符号

需要精确指定上下文时在聊天输入 `@`：

- `@Files` / `@Folders`：引用文件/文件夹
- `@Docs`：搜索已索引的文档（可自行添加）
- `@Terminals`：终端输出
- `@Past Chats`：此前对话
- `@Commit` / `@Branch`：未提交改动 diff / 相对 main 的 diff
- `@Browser`：内置浏览器上下文

> 建议：明确知道相关文件才用 `@`；不确定就别加，Agent 会靠**代码库语义索引**自己找。

## 代码库索引与忽略

打开项目即自动**语义索引**（切分成语义块 → 向量化 → 入库），约 80% 完成时语义搜索即可用，每 5 分钟增量同步。

- `.cursorignore`：尽力屏蔽索引 **+ 所有 AI 访问**（Tab/Agent/@ 等）
- `.cursorindexingignore`：**只**排除索引，AI 功能仍可见该文件
- 语法同 `.gitignore`

## 模型选择

- **Auto**：自动选模型，走折扣的 Auto+Composer 池，适合日常
- **Max Mode**：把上下文窗口拉到模型上限，适合大型代码库复杂任务，按 token 计费更贵
- 可选模型涵盖自研 Composer 与 Claude / GPT / Gemini / Grok 等

## 下一步

- 规则、MCP 与隐私：见 [规则与上下文](./guideline-rules.md)
