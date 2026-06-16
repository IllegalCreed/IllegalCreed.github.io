---
layout: doc
outline: [2, 3]
---

# AI 与 Agent

> 基于 Zed 官方文档（2026）。AI 是 Zed 的一等公民：Agent Panel、Edit Prediction、Inline Assistant、MCP 均原生内置。

## Agent Panel

`cmd-shift-a` 打开（或 `agent: new thread`）。三条 agent 路径（文档称 **harness**）：

| harness | 说明 |
| --- | --- |
| **Zed Agent** | 原生，用配置的 LLM provider + 内置工具 + skills + MCP |
| **External Agents** | 经 **ACP（Agent Client Protocol）** 接入 Claude / Codex / Copilot 等 |
| **Terminal Threads** | 在终端里跑 CLI/TUI agent |

- 审查变更：`shift-ctrl-r` 打开 Review Changes 多缓冲区，逐 hunk accept/reject；**Checkpoints** 可回滚
- **Agent Profiles**：`Write` / `Ask` / `Minimal` 三个内置 profile，控制可用工具集
- 并行智能体（Parallel Agents）：多线程/多项目同时跑

## Edit Prediction

Zed 的 AI 补全，默认模型 **Zeta**（Zed 自研开源）：

- 免费版 2000 次/月，Pro 无限制；`edit_predictions.provider = "zed"`
- 两种显示模式：**Eager**（默认，内联显示）/ **Subtle**（仅按住 Alt 时显示）
- 接受键：macOS/Win `Alt+Tab`；**Linux 是 `Alt+L`**（避开窗口管理器冲突）
- 也支持 `copilot` / `mercury` / `codestral` / `ollama` 等 provider

## Inline Assistant

`ctrl-enter` 调用（编辑器/终端/频道笔记通用）：把当前选区（或当前行）发给 LLM 并用响应**替换之**。

::: tip Inline Assistant vs Edit Prediction
Inline Assistant 需**显式 prompt**（你描述要怎么改）；Edit Prediction 是**自动**建议。两者定位不同。
:::

## LLM Providers

控制 Zed Agent 与自有 AI 功能的模型，五条接入路径：Zed 托管模型 / 自带 API key / 复用已有订阅（ChatGPT·Claude·Copilot）/ Gateway（OpenRouter·Bedrock·Vercel）/ 本地模型（Ollama）。

## MCP：在 Zed 叫 context servers

::: warning 术语差异（易错）
Zed 把 MCP server 称为 **context servers**，在 `settings.json` 的 **`context_servers`** 键配置（不是 `mcpServers` / `servers`）。
:::

```json
{ "context_servers": {
  "server-name": { "command": "cmd", "args": [], "env": {} }
}}
```

工具权限规则格式 `mcp:<server>:<tool>`；`agent.tool_permissions.default` 取 `confirm` / `allow` / `deny`。

## Instructions / .rules

Zed Agent 的常驻上下文，**识别多种指令文件**（优先级顺序）：`.rules` → `.cursorrules` → `.windsurfrules` → `.github/copilot-instructions.md` → `AGENTS.md` → `CLAUDE.md` → `GEMINI.md`。个人指令在 `~/.config/zed/AGENTS.md`。

> `.rules` 已被 **Skills + Instructions** 框架取代，但向后兼容仍支持。

## 扩展：Rust → WASM

::: warning 与 VS Code 的根本差异
Zed 扩展用 **Rust 编译成 WebAssembly（WASM）**，**不能跑任意 JS/Node**；类型限于 languages / themes / snippets / debuggers / MCP server / agent server。
:::

- manifest 是 `extension.toml`
- **能力系统**（显式授权，沙箱）：`process:exec`（执行命令）/ `download_file`（下载）/ `npm:install`（装 npm 包）
- 安装：`cmd-shift-x` 扩展库
