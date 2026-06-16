---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Google 官方博客 / Codelab（2026）。Antigravity 是 2025-11 新品，术语与模型清单仍在快速演进。

## 速查

- 下载：<https://antigravity.google>（macOS / Windows / Linux 独立应用）
- 两个界面（surface）：**Editor View**（同步编码）与 **Agent Manager**（异步编排多 agent）
- 切换：`Cmd/Ctrl + E`
- 主力模型：**Gemini 3 Pro**

## 定位

Antigravity 是 Google 的 **agentic development platform**，核心理念是「agent 不该只是侧栏的聊天机器人，应有专属工作空间」。它把范式从 **autocomplete（补全）** 上移到 **orchestrate（编排任务、agent、artifacts）**。基于 VS Code fork，与 Gemini 3 同期发布。

## 两个界面（surface）

| 界面 | 作用 |
| --- | --- |
| **Editor View** | 传统同步编码：文件树、tab 补全、inline commands、agent 侧栏，用于审查/打磨代码 |
| **Agent Manager** | 高层控制台（"Mission Control"）：异步并行**派发、编排、观察多个 agent**，跨多 workspace |

`Cmd/Ctrl + E` 在两者间切换。Agent Manager 可「派 5 个 agent 同时修 5 个 bug」。

## agent：plan → execute → verify

agent 自主**规划 → 执行 → 验证**，可跨 **editor / terminal / browser** 三处操作。典型闭环：editor 脚手架应用 → terminal 起 dev server → browser 加载并跑 E2E → 改代码 → 验证修复 → 截图 → 附摘要交付。

两种模式：

- **Planning Mode**：先研究产出计划再执行，适合复杂/研究型任务
- **Fast Mode**：直接执行简单任务（改名、跑几条 bash）

## Artifacts：可审查的交付物

Artifacts 是 agent 工作的 **human-friendly 交付物**，取代原始日志：

| Artifact | 时机 / 内容 |
| --- | --- |
| **Implementation Plan** | 开工**前**的研究 + 拟改动，**需用户审批** |
| **Task List** | 结构化任务清单，agent 据此跟踪进度 |
| **Walkthrough** | 完工**后**的变更总结 + **验证步骤**（截图/命令/测试） |

::: tip 类 Google Doc 的反馈
你可以像在 Google Doc 里那样在 artifacts 上**高亮文本 + 留评论**，agent 实时纳入这些 pending comments 调整执行，**无需打断工作流**。
:::

## 浏览器集成

agent 可**直接操控浏览器做验证**（点击、滚动、交互、跑 E2E）：

- 需 **Google Chrome + Antigravity Chrome 扩展**，经 debugging session 由 browser subagent 接管
- 浏览器操作录制成 **browser recordings / screenshots**，写进 Walkthrough 作为可视化证据

## 终端执行策略与知识库

- **Terminal Execution Policy**：三档 **Off / Auto / Turbo**（手动审查 → 部分自动 → 全自动），按信任度调整风险姿态
- **Knowledge base**：agent 把有用的上下文/代码片段沉淀进知识库，改进后续任务（自我改进）

## 模型

- 主力 **Gemini 3 Pro**
- 官方支持 **Anthropic Claude Sonnet 4.5** 与 **OpenAI GPT-OSS**

::: warning GPT-OSS 易错点
这里是 **GPT-OSS**（OpenAI 的开源权重模型），**不是** GPT-4/5 闭源旗舰。
:::

内置 MCP（Model Context Protocol）支持，预置部分 Google Cloud 集成。
