---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 stripe/ai 官方 skills 的各 SKILL.md 与 references 编写。

## 速查

- **connect-recommend**：从 URL/描述荐 Connect 形态；**AskUserQuestion 为主交互**、低成本动作自动执行、绝不被动收尾；references（account-types/charge-patterns/compatibility-matrix/decision-matrix）
- **stripe-best-practices**：Checkout Sessions vs PaymentIntents、Connect Accounts v2、billing/订阅、Stripe Tax/automatic_tax、Treasury、Checkout/Payment Element、弃用 API 迁移、安全（restricted keys/webhooks/OAuth）
- **stripe-directory**：找/程序化购买服务商（`stripe directory *`）
- **stripe-projects**：Stripe Projects 供给基础设施（DB/auth/缓存/LLM/邮件…，`stripe *`，projects.dev）
- **upgrade-stripe**：API 版本 + SDK 升级

## connect-recommend：交互式决策

从**公司 URL 或业务描述**推荐正确的 Stripe Connect 集成形态——用户只需给 URL/描述，skill 搞定其余。设计上很有代表性：

- **AskUserQuestion 为主交互工具**：每个决策点都用 AskUserQuestion 给清晰编号选项 + 简短说明，**一次一个问题**、不淹没用户
- **低成本动作自动执行**：生成 markdown 推荐方案、扫代码库、读 reference 文件——**从不问许可，直接做**
- **绝不以被动文本收尾**：每个停顿点都以 AskUserQuestion 给出具体的下一步动作
- **references**：account-types、charge-patterns、compatibility-matrix、decision-matrix（决策矩阵）

触发场景：建 marketplace/平台/多商户/gig/订阅平台、给卖家打款、分账/收益分成/多方支付、商户 KYC onboarding、connected account dashboard、白标/嵌入式支付。

## stripe-best-practices：集成决策

覆盖 Stripe 集成的关键决策，写/改/审查任何 Stripe 集成时用：

- **API 选型**：Checkout Sessions vs PaymentIntents
- **Connect**：平台搭建（Accounts v2、controller properties）
- **billing/订阅**、**税**（Stripe Tax、`automatic_tax`、product tax codes）、**Treasury** 金融账户
- **集成选项**：Checkout、Payment Element
- **迁移**：从弃用的 Stripe API 迁移
- **安全**：API key 管理、**restricted keys**、webhooks、OAuth

## stripe-directory & stripe-projects

| skill | 做什么 | 触发/CLI |
| --- | --- | --- |
| **stripe-directory** | 找某行业/工作流/能力的商家/软件/服务商，建简短 shortlist；也可**程序化购买/消费**服务 | `stripe directory *` |
| **stripe-projects** | 用 **Stripe Projects** 供给基础设施/第三方服务——数据库、auth、缓存、Postgres、Redis、hosting、vector DB、LLM provider、邮件、搜索、消息队列、对象存储、feature flags | `stripe *`，projects.dev |

> 用户问「怎么拿某第三方服务的 API key/凭据」时，`stripe-projects` 要求**先查 Projects catalog**，别叫用户手动去注册。

## upgrade-stripe

升级 Stripe API 版本与 SDK 的指南——处理版本跨越、破坏性变更、SDK 升级路径。与 best-practices 的「从弃用 API 迁移」呼应，保证集成跟上 Stripe 最新版本。

## 反模式

| 反模式 | 问题 |
| --- | --- |
| connect-recommend 以被动文本收尾 | 违背「每个停顿点用 AskUserQuestion 给下一步」 |
| 生成方案/扫代码前反复问许可 | 低成本动作应自动执行 |
| 硬编码明文 API key | best-practices：用 restricted keys + 安全管理 |
| 叫用户手动注册第三方服务 | stripe-projects：先查 Projects catalog |
| 支付集成不选对 API | best-practices：Checkout Sessions vs PaymentIntents 要按场景 |
| 手动装 SKILL.md 不用官方插件 | 失去自动更新 + 额外 agent 工具 |

## 下一步

- [参考](./reference) —— 5 skills 清单、多 provider、安装、MCP/SDK、许可
- 上游：[stripe/ai](https://github.com/stripe/ai) · [docs.stripe.com/skills](https://docs.stripe.com/skills)
