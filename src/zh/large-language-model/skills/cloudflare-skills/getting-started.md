---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 cloudflare/skills 官方仓库（Apache-2.0）的 README 与 skills/ 编写。

## 速查

- **定位**：Cloudflare 官方 Agent Skills 集，教 agent 在 Cloudflare 上构建；**检索优先**（记忆可能过时，先查 docs）
- **装（Claude Code 插件）**：`/plugin marketplace add cloudflare/skills` 然后 `/plugin install cloudflare@cloudflare`
- **装（npx skills）**：`npx skills add https://github.com/cloudflare/skills`
- **装（Cursor）**：Cursor Marketplace，或 Settings → Rules → Add Rule → Remote Rule (Github) 填 `cloudflare/skills`
- **装（clone/copy）**：把 skill 目录拷进 agent 的技能目录（Claude Code `~/.claude/skills/`、Codex `~/.codex/skills/` 等）
- **技能（自动加载）**：`cloudflare`（总平台）·`workers-best-practices`·`agents-sdk`·`durable-objects`·`sandbox-sdk`·`wrangler`·`web-perf`·`cloudflare-email-service`·`cloudflare-one`(+`-migrations`)·`turnstile-spin`
- **命令（手动调用）**：`/cloudflare:build-agent`、`/cloudflare:build-mcp`
- **MCP server（随插件）**：cloudflare-api / docs / bindings / builds / observability
- **跨 agent**：Claude Code / OpenCode / OpenAI Codex / Pi / Cursor

## 定位：Cloudflare 官方技能集

`cloudflare/skills` 是一组遵循 Agent Skills 开放标准的技能，用于在 Cloudflare、Workers、Agents SDK 和更广的开发者平台上构建。它和通用 prompt 的关键区别是**检索优先**：

> Your knowledge of Cloudflare APIs, types, limits, and pricing may be outdated. **Prefer retrieval over pre-training** — the references in this skill are starting points, not source of truth.

每个技能都在开头这样声明——因为 Cloudflare 平台迭代快，模型对限额、定价、API 签名、兼容性日期的记忆常常滞后。技能因此把「去哪查最新信息」写进指令（`cloudflare-docs` MCP、`developers.cloudflare.com`、`npm pack @cloudflare/workers-types`、`node_modules/wrangler/config-schema.json` 等），并规定 **reference 与 docs 冲突时信 docs**。

## 安装

### Claude Code（插件市场，推荐）

```text
/plugin marketplace add cloudflare/skills
/plugin install cloudflare@cloudflare
```

装进来的不只是技能，还有 `/cloudflare:build-agent`、`/cloudflare:build-mcp` 两个命令和 5 个官方 MCP server。

### npx skills（任意支持 Agent Skills 的 agent）

```bash
npx skills add https://github.com/cloudflare/skills
```

### Cursor

从 Cursor Marketplace 安装，或手动：**Settings → Rules → Add Rule → Remote Rule (Github)**，填 `cloudflare/skills`。

### Clone / Copy

克隆仓库，把需要的 skill 文件夹拷进 agent 对应的技能目录：

| Agent | 技能目录 |
| --- | --- |
| Claude Code | `~/.claude/skills/` |
| Cursor | `~/.cursor/skills/` |
| OpenCode | `~/.config/opencode/skills/` |
| OpenAI Codex | `~/.codex/skills/` |
| Pi | `~/.pi/agent/skills/` |

## 技能总览

| 技能 | 何时用 |
| --- | --- |
| `cloudflare` | 综合平台技能：Workers/Pages、存储（KV/D1/R2）、AI（Workers AI/Vectorize/Agents SDK）、网络（Tunnel/Spectrum）、安全（WAF/DDoS）、IaC（Terraform/Pulumi）——用决策树选产品 |
| `agents-sdk` | 建有状态 AI agent：state、调度、RPC、MCP server、email、流式聊天 |
| `durable-objects` | 有状态协调（聊天室 / 游戏 / 预订）、RPC、SQLite、alarm、WebSocket |
| `sandbox-sdk` | 安全代码执行：AI 代码执行、代码解释器、CI/CD、交互式开发环境 |
| `wrangler` | 部署与管理 Workers、KV、R2、D1、Vectorize、Queues、Workflows |
| `web-perf` | 审计 Core Web Vitals（LCP/INP/CLS 等）、渲染阻塞、网络依赖链 |
| `workers-best-practices` | 按生产最佳实践编写 / 评审 Workers 代码 |
| `cloudflare-email-service` | 收发事务邮件（Email Sending + Email Routing） |
| `cloudflare-one` | Zero Trust / SASE：Access、Gateway、WARP、Tunnel、Magic WAN、DLP、CASB、posture、identity |
| `turnstile-spin` | 端到端接入 Turnstile（CAPTCHA 替代品）：建 widget、嵌表单、接 siteverify |

## 上下文自动加载

技能是**上下文相关、自动加载**的：当请求匹配某技能的触发条件时，agent 自动加载并应用它，提供准确、最新的指引。你不用记技能名——说「帮我在 Cloudflare 上建一个聊天室」会拉起 `durable-objects`，说「审一下这段 Worker」会拉起 `workers-best-practices`。

而**命令**（`/cloudflare:build-agent`、`/cloudflare:build-mcp`）是**手动调用**的斜杠命令，你显式触发它们来走「搭建 AI agent / MCP server」的完整脚手架流程。

## 下一步

- [指南](./guide-line) —— 各技能逐讲、平台覆盖面（Workers/存储/AI/安全/IaC）、反模式清单
- [参考](./reference) —— 技能清单 + 命令 + MCP server + 安装 + 许可 + 链接
