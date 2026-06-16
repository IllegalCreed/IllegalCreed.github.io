---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Windsurf / Devin Desktop 官方文档（2026）。快捷键 `Cmd` 为 macOS，Windows/Linux 用 `Ctrl`。

## 速查

- 下载：<https://windsurf.com>
- 打开 Cascade（agent 面板）：`Cmd+L`
- 切换 Cascade 模式：`Cmd+.`（Code / Plan / Ask）
- 内联编辑 Command：`Cmd+I`
- 接受 Tab 建议：`Tab`

## 安装与迁移

Windsurf 是 VS Code 的 fork，首次启动可从 VS Code / Cursor **导入设置与扩展**（扩展来自 Open VSX）。

::: warning 已更名 Devin Desktop
2026-06 更名后，Windsurf 设置会自动迁移到 Devin Desktop；扩展安装策略在收紧（FAQ 现称不能通过市场安装扩展），以官方最新说明为准。
:::

## Cascade：旗舰 agent

Cascade 是 Windsurf 的核心 agent，`Cmd+L` 打开，`Cmd+.` 切三种模式：

| 模式 | 行为 |
| --- | --- |
| **Code**（默认） | 全 agentic：增删改文件、跑终端命令、自动装缺失依赖、自主多步 |
| **Plan** | 先规划：探索代码库、追问，产出**写入 Markdown 的计划**（存 `~/.windsurf/plans`），有「Implement」按钮转 Code |
| **Ask** | **只读**：搜索/分析代码库，不做任何改动 |

::: tip 术语演进（易错）
早期 Windsurf 叫 **Write / Chat** 模式，现已更名为 **Code / Ask**，并新增 **Plan**。
:::

- 每个 prompt 最多 **20 次工具调用**，配 **Auto-Continue** 续长任务
- **实时感知**：感知你在编辑器/终端的实时操作；选中文本自动入上下文
- **Checkpoints**：可回滚到对话中的检查点

## Tab：补全与导航引擎

Tab 是「上下文感知的 diff 建议 + 导航引擎」，由自研模型驱动：

- **Supercomplete**（推荐）：在光标周围**同时建议删除与新增**，不止补全、可改写
- **Autocomplete**：传统灰字行内/多行补全
- **Tab to Jump**：预测下一光标位置，按 `Tab` 跳过去
- **Tab to Import**：定义新依赖后按 `Tab` 自动在文件顶部加 import

## Command：内联编辑

`Cmd+I` 在编辑器或**终端**内用自然语言生成/改写代码与命令；它**不消耗 premium credits**。

## @ 上下文引用

在 Cascade / Chat 里用 `@` 引用：函数与类、目录与文件、远程仓库、终端内容（仅 VS Code）、`@diff`（当前 git diff，beta）。

## 模型

- 自研 **SWE-1.5 / SWE-1.6 / SWE-1.6 Fast** + 第三方（Claude / GPT / Gemini 等）
- **Adaptive Model Router** 自动选模型「让额度更耐用」；**Arena Mode** 可做模型对战

## 下一步

- 规则、记忆、MCP 与工作流：见 [规则与工作流](./guideline-rules.md)
