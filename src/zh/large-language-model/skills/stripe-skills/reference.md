---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 stripe/ai 官方 skills 的 README、各 SKILL.md 与 docs.stripe.com 编写。

## 速查

- **装**：`claude plugin install stripe@claude-plugins-official`（Codex/Cursor/Grok 各有官方插件）
- **5 skills**：connect-recommend · stripe-best-practices · stripe-directory · stripe-projects · upgrade-stripe
- **MCP**：`https://mcp.stripe.com`（OAuth）
- **SDK**：`@stripe/ai-sdk`（Vercel AI SDK）· `@stripe/token-meter`（OpenAI/Anthropic/Gemini）
- **官方**：`stripe/ai`（原 agent-toolkit），MIT

## 5 skills 清单

| skill | 触发/职责 | 工具 |
| --- | --- | --- |
| `connect-recommend` | 荐 Connect 集成形态（marketplace/分账/打款/KYC） | AskUserQuestion + Read/Write/Bash/Task |
| `stripe-best-practices` | API 选型/Connect/billing/税/Treasury/安全/迁移 | 指导型 |
| `stripe-directory` | 找/程序化购买服务商 | `Bash(stripe directory *)` |
| `stripe-projects` | Stripe Projects 供给基础设施/第三方服务 | `Bash(stripe *)` |
| `upgrade-stripe` | 升级 Stripe API 版本 + SDK | 指导型 |

## 多 provider 分发

| provider | 安装 |
| --- | --- |
| Claude Code | `claude plugin install stripe@claude-plugins-official` |
| Codex | `codex plugin add stripe@openai-curated` |
| Cursor | `/add-plugin stripe`（或 marketplace） |
| Grok Build | 官方插件 |

> skills 在 `providers/{claude,codex,cursor,grok}/plugin/skills/`，顶层 `skills/` 同名。官方插件含额外 agent 工具 + 自动更新。

## 配套 MCP 与 SDK

| 组件 | 说明 |
| --- | --- |
| 远程 MCP | `https://mcp.stripe.com`（OAuth，docs.stripe.com/mcp），可建自主 agent |
| `@stripe/ai-sdk` | 把 Stripe 计费接入 Vercel `ai` / `@ai-sdk` |
| `@stripe/token-meter` | 把 Stripe 计费接入 OpenAI/Anthropic/Google Gemini 原生 SDK（无框架依赖） |

## connect-recommend 交互原则

1. **AskUserQuestion 为主**：每个决策点清晰编号选项，一次一个问题
2. **低成本动作自动执行**：生成方案、扫代码、读 reference 不问许可
3. **绝不被动收尾**：每个停顿点用 AskUserQuestion 给具体下一步
4. references：account-types / charge-patterns / compatibility-matrix / decision-matrix

## 安装与许可

- **官方插件**（推荐）：自动更新 + 额外工具
- **手动**：把 SKILL.md 装入 agent skills 目录（失去自动更新）
- **许可**：MIT，源 `stripe/ai`（原 `stripe/agent-toolkit` 改名重定向）
- **贡献**：改 stripe/ai 提 PR

## 资源链接

- 仓库：[stripe/ai](https://github.com/stripe/ai)
- Agent skills 文档：[docs.stripe.com/skills](https://docs.stripe.com/skills)
- Stripe MCP：[docs.stripe.com/mcp](https://docs.stripe.com/mcp)
- 相关叶：[Better Auth Skills](../better-auth-skills/)（同「应用服务集成」组）
