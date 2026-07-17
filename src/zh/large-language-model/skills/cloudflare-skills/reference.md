---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 cloudflare/skills 官方仓库 README 与 skills/ 编写。

## 速查

- **仓库**：`cloudflare/skills`（Cloudflare 官方，Apache-2.0，约 ★2.2k）
- **装**：`/plugin marketplace add cloudflare/skills` + `/plugin install cloudflare@cloudflare`（Claude Code）；或 `npx skills add https://github.com/cloudflare/skills`
- **技能**：cloudflare · workers-best-practices · agents-sdk · durable-objects · sandbox-sdk · wrangler · web-perf · cloudflare-email-service · cloudflare-one(+migrations) · turnstile-spin
- **命令**：`/cloudflare:build-agent`、`/cloudflare:build-mcp`
- **MCP server**：cloudflare-api / docs / bindings / builds / observability
- **理念**：检索优先（reference 是起点，docs 是真理）
- **跨 agent**：Claude Code / OpenCode / OpenAI Codex / Pi / Cursor

## 技能全表

| 技能 | 覆盖 |
| --- | --- |
| `cloudflare` | 综合平台：Workers/Pages、KV/D1/R2、Workers AI/Vectorize/Agents SDK、Tunnel/Spectrum、WAF/DDoS、Terraform/Pulumi；决策树选产品 |
| `workers-best-practices` | Workers 代码编写/评审：流式、悬空 Promise、全局态、密钥、绑定、可观测性、反模式清单 |
| `agents-sdk` | `Agent`/`AIChatAgent`/`McpAgent`、state、`@callable` RPC、schedule、Workflows、queue、retry、React hooks |
| `durable-objects` | 有状态协调、RPC、SQLite、alarm、WebSocket、sharding、Vitest 测试 |
| `sandbox-sdk` | `getSandbox`、`exec`/`runCode`、文件操作、代码解释器、preview URL |
| `wrangler` | 部署与管理 Workers、KV、R2、D1、Vectorize、Queues、Workflows、Secrets |
| `web-perf` | Chrome DevTools MCP 测 Core Web Vitals（LCP/INP/CLS）、渲染阻塞、网络链、a11y |
| `cloudflare-email-service` | Email Sending（Workers 绑定 / REST API）+ Email Routing、SPF/DKIM/DMARC |
| `cloudflare-one` | Zero Trust/SASE：Access、Gateway、WARP、Tunnel、Magic WAN、DLP、CASB、posture、identity |
| `cloudflare-one-migrations` | 从 Zscaler/Palo Alto/传统 VPN·SWG/SASE 迁移到 Cloudflare One 的评估与计划 |
| `turnstile-spin` | 端到端接入 Turnstile：建 widget、嵌表单、服务端 siteverify、验证 |

## 命令（手动调用）

| 命令 | 作用 |
| --- | --- |
| `/cloudflare:build-agent` | 用 Agents SDK 搭 AI agent（脚手架 + wrangler 配置 + agent 类 + 路由 + 客户端 + 部署） |
| `/cloudflare:build-mcp` | 在 Cloudflare 上搭远程 MCP server（`McpAgent` + `McpServer` + Streamable HTTP transport + 部署） |

## MCP Server（随 Claude Code 插件）

| Server | 用途 |
| --- | --- |
| cloudflare-api | 管理账号资源、zone、设置 |
| cloudflare-docs | 最新 Cloudflare 文档与参考 |
| cloudflare-bindings | 用存储/AI/计算原语构建 Workers |
| cloudflare-builds | 管理与洞察 Workers 构建 |
| cloudflare-observability | 调试与分析应用日志和分析 |

## 平台覆盖

| 层 | 产品 |
| --- | --- |
| 计算/运行时 | Workers · Pages · Durable Objects · Workflows · Containers · Cron Triggers |
| 存储 | KV · D1（SQLite）· R2（S3 兼容）· Queues · Hyperdrive · Vectorize |
| AI | Workers AI · Vectorize · Agents SDK · AI Gateway · AI Search |
| 安全 | WAF · DDoS · Bot Management · API Shield · Turnstile |
| 网络 | Tunnel · Spectrum · Magic WAN · Argo Smart Routing |
| IaC | Terraform · Pulumi · REST API |

## 安装（四种方式）

```text
# Claude Code 插件市场（含命令 + MCP server）
/plugin marketplace add cloudflare/skills
/plugin install cloudflare@cloudflare

# npx skills（任意 Agent Skills 兼容 agent）
npx skills add https://github.com/cloudflare/skills

# Cursor：Marketplace，或 Settings → Rules → Add Rule → Remote Rule (Github) 填 cloudflare/skills

# Clone/Copy：把 skill 目录拷进 ~/.claude/skills、~/.codex/skills 等
```

## 加载机制

- **技能**：上下文自动加载——对话匹配触发词时 agent 自动加载并应用
- **命令**：手动调用的斜杠命令——你显式 `/cloudflare:build-agent` 触发脚手架流程
- **检索优先**：技能内的 reference 是起点，不是 source of truth；与 docs 冲突时信 docs（限额/定价/类型签名尤甚）

## 许可

Apache-2.0。可自由使用、修改、分发。作为 Cloudflare 官方开放技能集，遵循 Agent Skills 开放标准，跨 agent 通用。

## 资源链接

- 仓库：[cloudflare/skills](https://github.com/cloudflare/skills)（Apache-2.0）
- Agents 文档：[developers.cloudflare.com/agents](https://developers.cloudflare.com/agents/)
- MCP 指南：[developers.cloudflare.com/agents/model-context-protocol](https://developers.cloudflare.com/agents/model-context-protocol/)
- Agent 安装：[developers.cloudflare.com/agent-setup/claude-code](https://developers.cloudflare.com/agent-setup/claude-code/)
- Agents SDK 仓库：[cloudflare/agents](https://github.com/cloudflare/agents) · [agents-starter](https://github.com/cloudflare/agents-starter)
- 相关叶：[Vercel Agent Skills](../vercel-agent-skills/) · [AWS Agent Toolkit](../aws-agent-toolkit/)

## 下一步

- 回顾 [入门](./getting-started)（安装与技能总览）与 [指南](./guide-line)（各技能逐讲）
- 上游一手资料：[cloudflare/skills 仓库](https://github.com/cloudflare/skills) · [Cloudflare Agents 文档](https://developers.cloudflare.com/agents/)
