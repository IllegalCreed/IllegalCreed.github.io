---
layout: doc
---

# OpenCode

sst 团队（SST framework 出品者）开源的 AI 编码 Agent ——「**The open source coding agent**」。最大亮点是 **模型无关**：Anthropic / OpenAI / Google / Ollama / OpenRouter / LM Studio 等 75+ provider 一键切换，MIT 开源，可私有部署。是 Claude Code / Codex CLI / Gemini CLI 在「不绑定单家厂商」赛道的代表答卷。

::: tip 不是 GitHub Codex 那个
此 OpenCode 指的是 sst.dev 团队的 [sst/opencode](https://github.com/sst/opencode)（TypeScript + Go 实现），不是 GitHub Copilot 旗下的 OpenCodeX 或别的同名产品。MIT 协议，160K+ stars，900+ contributors。
:::

## 评价

**优点**

- **MIT 开源**：源码全开放，可自托管 / 私有部署 / 嵌入自家产品
- **模型无关**：通过 [Models.dev](https://models.dev/) 接入 75+ LLM provider——Claude / GPT / Gemini / Llama / DeepSeek / 本地 Ollama 都行
- **多 provider 同时配置**：一份 `auth.json` 存所有家的凭据，`/models` 一键切换
- **Plan / Build 两档主代理**：Plan 只读分析，Build 全权限实施，Tab 键切换
- **Subagents 标准**：内置 `general` / `explore` / `scout` 子代理，可自定义
- **AGENTS.md 标准**：与 Codex CLI、Claude Code 错位的项目说明书；兼容 `CLAUDE.md`
- **MCP 一类支持**：本地 stdio + 远程 HTTP MCP server 都行
- **TUI + CLI + Web + Desktop**：终端 UI 漂亮，CLI 可脚本化，桌面 App 也有 beta
- **多 session 并行**：同项目跑多个 Agent，互不打扰
- **Session 分享**：`/share` 生成可读链接，方便调试与协作
- **大陆访问极友好**：用 DeepSeek / Ollama / OpenRouter 任一国内可用 provider 即可

**缺点**

- 生态相对年轻（2025 起爆发），文档比 Claude Code 浅
- 没有 Claude Code 那种 Skills / Hooks 体系（虽有 plugin / command 但简化）
- 多 provider 配置门槛略高（每家凭据 + base URL 都要管）
- TUI 优先，IDE 扩展生态不如 Claude Code / Codex 成熟
- 「OpenCode Zen」托管模型是付费的（自带 key 走 provider 直连是免费的）

## 文档地址

[opencode.ai/docs](https://opencode.ai/docs)

## GitHub 地址

[sst/opencode](https://github.com/sst/opencode)（主仓，TypeScript + Go）/ [Models.dev](https://models.dev/)（provider 注册表）

## 推荐资源

- [Models.dev](https://models.dev/)（OpenCode 用的 LLM provider 注册表，可独立用）
- [OpenCode Zen](https://opencode.ai/zen)（官方推荐的 Curated 模型聚合）
- [SST](https://sst.dev/)（同一团队的 IaC 框架，了解作者背景）

## 幻灯片地址

<a href="/SlideStack/opencode-slide/" target="_blank">OpenCode</a>
