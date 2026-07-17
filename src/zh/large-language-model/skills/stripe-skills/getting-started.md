---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 stripe/ai 官方 skills（原 stripe/agent-toolkit）的 README、各 SKILL.md 与 docs.stripe.com/skills 编写。

## 速查

- **是什么**：Stripe 官方 agent 技能集，让 AI 用 Stripe 最新最佳实践做支付集成
- **源**：`stripe/ai`（原 `stripe/agent-toolkit` 改名重定向），属「Stripe 上建 AI 产品一站式仓库」
- **装（官方插件，自动更新）**：Claude Code `claude plugin install stripe@claude-plugins-official`
- **多 provider**：Codex `codex plugin add stripe@openai-curated` · Cursor `/add-plugin stripe` · Grok Build
- **5 skills**：connect-recommend · stripe-best-practices · stripe-directory · stripe-projects · upgrade-stripe
- **配套**：MCP `mcp.stripe.com`（OAuth）· `@stripe/ai-sdk`（Vercel AI SDK）· `@stripe/token-meter`
- **官方**：MIT，docs.stripe.com/skills

## 安装（推荐官方插件）

Agent skills 是给 agent 用的指令，让它用 Stripe 最新最佳实践更快更准地构建。**推荐装官方插件**（含额外 agent 工具 + 自动更新）：

```bash
# Claude Code
claude plugin install stripe@claude-plugins-official

# Codex
codex plugin add stripe@openai-curated

# Cursor
/add-plugin stripe   # 或 Cursor marketplace
```

> Grok Build 等也有对应安装方式。skills 在 `providers/{claude,codex,cursor,grok}/plugin/skills/` 分发，顶层 `skills/` 同名。

## 5 个 skills 总览

| skill | 用途 |
| --- | --- |
| **connect-recommend** | 从公司 URL/业务描述**推荐 Stripe Connect 集成形态**（marketplace/平台/分账/打款） |
| **stripe-best-practices** | Stripe 集成决策：API 选型、Connect、billing/订阅、税、Treasury、安全、API 迁移 |
| **stripe-directory** | 找（并可程序化购买）某行业/能力的商家/软件/服务商 |
| **stripe-projects** | 用 Stripe Projects 供给基础设施/第三方服务（数据库/auth/缓存/LLM provider…） |
| **upgrade-stripe** | 升级 Stripe API 版本与 SDK |

## 配套：MCP + SDK

`stripe/ai` 是「在 Stripe 上建 AI 产品的一站式仓库」，skills 之外还有：

- **远程 MCP**：`https://mcp.stripe.com`（OAuth 安全接入，docs.stripe.com/mcp），可建自主 agent
- **`@stripe/ai-sdk`**：把 Stripe 计费接入 Vercel 的 `ai` / `@ai-sdk`
- **`@stripe/token-meter`**：把 Stripe 计费接入 OpenAI/Anthropic/Google Gemini 原生 SDK（无框架依赖）

## 下一步

- [指南](./guide-line) —— 5 skills 逐个、connect-recommend 交互决策模型、best-practices、projects/directory、upgrade
- [参考](./reference) —— 5 skills 清单、多 provider、安装、MCP/SDK、许可
