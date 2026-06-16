---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Trae 官方文档（2026）。国际版 docs.trae.ai，国内版 trae.cn，界面功能一致、模型与合规不同。

## 速查

- 下载：国际版 <https://trae.ai> / 国内版 <https://trae.cn>
- 顶部开关切换 **IDE mode ↔ SOLO mode**
- 引用上下文：聊天里输 `#`（`#Rule` / `#Doc` / `#Web`）
- 创建自定义 agent：聊天里输 `@` → Create Agent
- 智能补全：**CUE**（支持 Python / TypeScript / Go 的智能导入与重命名）

## 安装与迁移

Trae 是 VS Code 的 fork（闭源），保留编辑/调试/Git/Remote SSH 等完整能力。

首次启动可「**从 VS Code 或 Cursor 导入**」设置、扩展、快捷键。

::: warning 扩展来源
扩展可从自带 Extension Store 或 VS Code Marketplace 手动取（拖入 `.vsix`）；C/C++ 等平台特定扩展须手动下对应平台 VSIX。
:::

## IDE 与 SOLO 双模式

Trae 最大特色是顶部一键切换的两种工作方式：

| 模式 | 主导方 | 行为 |
| --- | --- | --- |
| **IDE mode** | 开发者 | 完全掌控，AI 作辅助（补全/Chat/Agent） |
| **SOLO mode** | AI | 自动 plan → 代码生成 → 测试 → preview → 部署 |

## SOLO Agent

SOLO mode 的核心，可**自主编排多个自定义 agent**组成「AI 团队」，主 agent 按上下文调度子 agent（内置 `Search` agent）。两个进阶子模式：

- **Plan mode**（`/plan`）：生成规划文档
- **Spec mode**（`/spec`）：产出 `spec.md` + `tasks.md` + `checklist.md`，存 `.trae/specs/<任务名>/`，作为长期知识资产

::: tip 命名更新（易错）
2026-05 起：原 `Builder` / `Builder with MCP` 合并为统一的 **Agent**；`SOLO Coder` 更名为 **SOLO Agent**。
:::

## CUE：智能补全

CUE（Context Understanding Engine）类似 Cursor Tab：多行编辑、下一编辑点预测、智能导入、智能重命名（智能导入/重命名限 **Python / TypeScript / Go**）。

## Chat 与上下文引用

Trae 用 **`#`** 引用上下文（区别于 Cursor/VS Code 的 `@`）：

- `#Rule`：引用规则（优先级最高）
- `#Doc`：引用文档（最多 1000 文件 / 总 50MB）
- `#Web`：联网搜索

## 命令执行安全

三种命令执行模式（默认 **Sandbox with Allowlist**）：

- `Sandbox with Allowlist`（默认，白名单沙箱）
- `Manual Run`（每条手动确认）
- `Auto Run`（自动执行）

配合 Privacy mode（代码不用于训练、留本地）。

## 模型与国内外版本

- 国际版：GPT、Gemini、Claude、Kimi、DeepSeek、MiniMax 等
- 国内版：偏国产模型（豆包 / DeepSeek / Kimi / 通义等），符合中国合规
- **美国用户不可用 GPT、MiniMax 系列**

## 下一步

- 规则、MCP 与自定义 Agent：见 [规则与 Agent](./guideline-rules.md)
