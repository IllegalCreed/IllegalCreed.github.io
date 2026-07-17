---
layout: doc
---

# Stripe Skills

Stripe Skills 是 **Stripe 官方**（源在 `stripe/ai`，即原 `stripe/agent-toolkit` 改名重定向而来，MIT）出品的一组 agent 技能——让 AI agent 用 Stripe 最新最佳实践更快、更准地做支付集成。它属于 `stripe/ai`「在 Stripe 上构建 AI 产品的一站式仓库」的一部分（同仓还有 `@stripe/ai-sdk`、`@stripe/token-meter`、远程 MCP `mcp.stripe.com`）。**5 个 skills**：`connect-recommend`（用 AskUserQuestion 交互式推荐 Connect 集成形态）、`stripe-best-practices`（API 选型/Connect/billing/税/安全）、`stripe-directory`（找/程序化购买供应商）、`stripe-projects`（用 Stripe Projects 供给基础设施/第三方服务）、`upgrade-stripe`（API 版本 + SDK 升级）。多 provider 分发（Claude/Codex/Cursor/Grok），官方插件自动更新。

## 评价

**优点**

- **Stripe 官方**：源在 stripe/ai、随 Stripe API/产品演进、权威不漂移
- **官方插件自动更新**：`claude plugin install stripe@claude-plugins-official`，含额外 agent 工具、自动更新
- **多 provider**：Claude Code / Codex / Cursor / Grok 各有官方插件
- **决策型 skill**：`connect-recommend` 从公司 URL/业务描述推荐 Connect 形态，全程 AskUserQuestion 交互、低成本动作自动执行、绝不以被动文本收尾
- **覆盖广**：checkout/billing、Connect marketplaces、订阅、Stripe Tax、Treasury、安全（restricted keys/webhooks/OAuth）、API 迁移
- **配套 MCP + SDK**：远程 MCP（mcp.stripe.com，OAuth）+ @stripe/ai-sdk（接 Vercel AI SDK）+ @stripe/token-meter（OpenAI/Anthropic/Gemini 计费）
- **基础设施供给**：`stripe-projects` 经 projects.dev 供给数据库/auth/缓存/LLM provider 等

**缺点 / 边界**

- **面向 Stripe**：服务 Stripe 支付/AI 商业化，非通用
- **建议用官方插件**：手动装 SKILL.md 可行，但官方插件才有自动更新 + 额外工具
- **skill 触发条件明确**：各 skill 有精确的 description 触发场景（如 Connect 才触 connect-recommend）
- **部分依赖 Stripe CLI**：stripe-directory / stripe-projects 用 `stripe *` CLI

## 适用场景

- 用 AI 做 Stripe 集成，想照官方最新最佳实践（API 选型、订阅、税、安全）
- 建 marketplace/平台，需推荐 Connect 集成形态（connect-recommend）
- 升级 Stripe API 版本 / SDK（upgrade-stripe）
- 用 Stripe Projects 供给数据库/auth/LLM provider 等基础设施

## 边界

- **只服务 Stripe**：支付 + AI 商业化，非通用技能
- **官方插件优先**：自动更新 + 额外工具
- **CLI 依赖**：directory/projects 用 `stripe` CLI
- **贡献到 stripe/ai**：官方仓库（原 agent-toolkit）

## 官方文档

[Agent skills（docs.stripe.com/skills）](https://docs.stripe.com/skills) ｜ [Stripe MCP（docs.stripe.com/mcp）](https://docs.stripe.com/mcp) ｜ [agentskills.io](https://agentskills.io/home)

## GitHub 地址

[stripe/ai](https://github.com/stripe/ai)（官方，MIT，原 `stripe/agent-toolkit` 改名）

## 内容地图

- [入门](./getting-started) —— 定位、安装（多 provider 官方插件）、5 skills 总览、MCP/SDK
- [指南](./guide-line) —— 5 skills 逐个、connect-recommend 决策模型、best-practices、projects/directory、upgrade
- [参考](./reference) —— 5 skills 清单、多 provider、安装命令、MCP/SDK、许可

## 幻灯片地址

<a href="/SlideStack/stripe-skills-slide/" target="_blank">Stripe Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">Stripe Skills 测试题</a>

> 测试题链接待生产库分类导入、获得真实数字叶节点 ID 后回填。
