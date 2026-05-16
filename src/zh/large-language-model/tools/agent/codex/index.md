---
layout: doc
---

# Codex CLI

OpenAI 官方的 AI 编码 Agent CLI ——「**Lightweight coding agent that runs in your terminal**」。把 GPT 系列模型放进真实终端环境，读写文件 / 执行命令 / 调外部工具，是 Anthropic Claude Code 在 OpenAI 阵营的对位产品。

::: warning 不是 2021 年的旧 Codex
此 Codex 指的是 OpenAI 2025 年起重新发布的 **Codex CLI**（开源 Rust 实现，仓库 [openai/codex](https://github.com/openai/codex)），与 2021 年发布、2023 年废弃的旧 `code-davinci-002` Codex API **没有关系**——同名不同物。
:::

## 评价

**优点**

- **开源**：Rust 实现，Apache-2.0 协议（与闭源的 Claude Code / Gemini CLI 形成对比）
- **模型矩阵广**：GPT-5.5 / GPT-5.4 / GPT-5.3-Codex / o3 / o4-mini 一键切换，可自带 API key
- **多 Provider 支持**：内置 OpenAI / Azure / OpenRouter / Anthropic 等 provider，配置即用
- **三层 sandbox**：`read-only` / `workspace-write` / `danger-full-access` 默认即安全
- **细粒度审批**：`--ask-for-approval` 支持 `untrusted` / `on-request` / `never` 三档
- **AGENTS.md 标准**：与 Claude Code 的 CLAUDE.md 错位，已成多个 Agent CLI 的事实约定
- **MCP 一类支持**：可接任何 MCP server（GitHub / Filesystem / Context7 等）
- **profiles**：`[profiles.xxx]` 定义不同工作流（开发 / 生产 / 企业）一键切换
- **多端**：CLI + VS Code / Cursor / Windsurf 扩展 + 桌面 App + Web（chatgpt.com/codex）

**缺点**

- ChatGPT 订阅或 OpenAI API key 才能用，**中国大陆访问需自备网络**
- 闭源时代积累的 prompt 体系较新（2025 后），生态成熟度略逊 Claude Code
- 与 Anthropic 自家的 Skills 机制相比，**没有等价的可发现/触发的指令包系统**
- 内置 Hooks 功能受限（`[hooks]` 配置存在但相比 Claude Code 弱）
- Web 版（chatgpt.com/codex）功能少于本地 CLI

## 文档地址

[Codex Documentation](https://developers.openai.com/codex)

## GitHub 地址

[openai/codex](https://github.com/openai/codex)（CLI 主仓，Rust 实现）

## 推荐资源

- [Codex Prompting Guide](https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide)（OpenAI Cookbook 官方提示词指南）
- [Best practices](https://developers.openai.com/codex/learn/best-practices)（官方最佳实践）
- [Custom instructions with AGENTS.md](https://developers.openai.com/codex/guides/agents-md)（AGENTS.md 完整规范）
- [Use Codex with the Agents SDK](https://developers.openai.com/codex/guides/agents-sdk)（嵌入自家应用）
- [Unrolling the Codex agent loop](https://openai.com/index/unrolling-the-codex-agent-loop/)（官方架构博客）

## 幻灯片地址

<a href="/SlideStack/codex-slide/" target="_blank">Codex</a>
