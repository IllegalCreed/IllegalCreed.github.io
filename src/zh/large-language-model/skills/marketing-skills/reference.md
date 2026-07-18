---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 coreyhaines31/marketingskills（Corey Haines 个人社区项目，MIT，非官方）README 与 skills/ 编写。

## 速查

- **装全部**：`npx skills add coreyhaines31/marketingskills`
- **Claude Code 显式装**：`npx skills add coreyhaines31/marketingskills -a claude-code`
- **47 skill**：CRO（cro/signup/onboarding/popups/paywalls）· 文案（copywriting/copy-editing/cold-email/emails/social/image/video）· SEO（seo-audit/ai-seo/programmatic-seo/site-architecture/competitors/schema/directory-submissions/aso）· 付费（ads/ad-creative）· 测量（analytics/ab-testing）· 留存（churn-prevention/community-marketing）· 增长（co-marketing/free-tools/referrals/lead-magnets/marketing-loops）· 战略（marketing-ideas/marketing-psychology/launch/pricing/offers/marketing-plan/marketing-council/content-strategy/customer-research/sms/public-relations/prospecting）· 销售（revops/sales-enablement/competitor-profiling）· 基础（product-marketing）
- **地基**：`.agents/product-marketing.md`（兼容 `.claude/product-marketing.md` 与旧名 `product-marketing-context.md`）
- **格式**：每 skill 一份 `SKILL.md`（agent 指令）+ 可选 `references/`（深度文档）+ 可选 `scripts/`
- **许可**：MIT（Copyright (c) 2025 Corey Haines），按需自由用

## 47 skill 全表

### CRO 转化优化

| skill | 触发词 / 何时用 |
| --- | --- |
| `cro` | optimize / 提升转化 / 落地页 / 注册页 / 表单 abandonment |
| `signup` | 注册 / 账号创建 / trial 激活流优化 |
| `onboarding` | 首次体验 / time-to-value / 激活漏斗 |
| `popups` | 弹窗 / modal / overlay / slide-in / banner |
| `paywalls` | 应用内付费墙 / upgrade modal / upsell / feature gate |

### Content & Copy

| skill | 触发词 |
| --- | --- |
| `copywriting` | 首页 / 落地页 / 营销页文案 |
| `copy-editing` | 改现有文案 / 刷新旧内容 |
| `cold-email` | B2B 冷邮件 / 开发信 / SDR 邮件 / follow-up 序列 |
| `emails` | 自动化邮件流 / welcome 序列 / drip / lifecycle email |
| `social` | LinkedIn / Twitter-X / Instagram / TikTok 社媒内容 |
| `image` | 营销图 / blog hero / social graphic / product shot |
| `video` | 视频内容 / AI 工具产视频 / 程序化框架 |
| `sms` | SMS / MMS 营销（welcome / 弃购 / 行为触发） |

### SEO & 发现

| skill | 触发词 |
| --- | --- |
| `seo-audit` | 技术 SEO / 爬取 / on-page SEO 审计 |
| `ai-seo` | AEO / GEO / LLMO / AI Overviews / 被 ChatGPT/Perplexity/Claude 引用 / llms.txt / OKF |
| `programmatic-seo` | 模板批量出页 / 城市页 / 目录页 |
| `site-architecture` | 站点结构 / 导航 / URL / 内链 |
| `competitors` | 对比页 / 替代品页 |
| `schema` | 结构化数据 / FAQ / HowTo / Product / Review |
| `directory-submissions` | 提交 startup / SaaS / AI / agent / MCP / no-code / 评测目录 |
| `aso` | App Store / Google Play 列表优化 |

### Paid & 分发

| skill | 触发词 |
| --- | --- |
| `ads` | Google / Meta / LinkedIn / Twitter / TikTok 广告；PPC / ROAS / CPA / retargeting / ABM；PMax |
| `ad-creative` | 批量产广告素材 / headline / description 迭代 |

### Measurement & 测试

| skill | 触发词 |
| --- | --- |
| `analytics` | GA4 / 事件追踪 / 转化追踪 / 测量审计 |
| `ab-testing` | A/B test / 实验 / variant / 假设 / 显著性 / 实验程序 |

### 留存

| skill | 触发词 |
| --- | --- |
| `churn-prevention` | 流失 / cancel flow / save offer / dunning / 失败支付挽回 / win-back / 退出调研 |
| `community-marketing` | 社区 / 品牌忠诚 / 用户社群 |

### Growth 工程

| skill | 触发词 |
| --- | --- |
| `co-marketing` | 联合营销伙伴 / 联合 campaign / 合作 |
| `free-tools` | 免费工具 / 计算器（lead gen / SEO） |
| `referrals` | 推荐 / 联盟 / 口碑 |
| `lead-magnets` | lead magnet / lead gen / 邮件捕获 |
| `marketing-loops` | 循环自动化营销工作流 / agent 周期跑 |

### Strategy & 商业化

| skill | 触发词 |
| --- | --- |
| `marketing-ideas` | 营销点子 / 140 个 SaaS 营销想法 |
| `marketing-psychology` | 心理学 / 心智模型 / 行为科学 |
| `launch` | 产品发布 / 功能公告 / release 策略 |
| `pricing` | 定价 / 打包 / 商业化 |
| `offers` | offer 设计 / 价值框定 / bonus / 保证 |
| `marketing-plan` | 营销计划 / 客户或自有产品 |
| `marketing-council` | 多专家视角 / 模拟顾问团 |
| `content-strategy` | 内容策略 / 主题决策 |
| `customer-research` | 客户调研 / 用户访谈 / voice-of-customer |
| `public-relations` | PR / earned media / 记者外联 / 媒体策略 |

### Sales & RevOps

| skill | 触发词 |
| --- | --- |
| `revops` | 收入运营 / lead 生命周期 / 营销转销售交接 |
| `sales-enablement` | 销售物料 / pitch deck / one-pager / objection 文档 / demo script |
| `prospecting` | prospect 名单 / B2B / 资格认定 |
| `competitor-profiling` | 对手画像 / 从 URL 调研对手 |

### 基础

| skill | 触发词 |
| --- | --- |
| `product-marketing` | 产品营销上下文 / `.agents/product-marketing.md` |

## 安装细节

```bash
# CLI（推荐）
npx skills add coreyhaines31/marketingskills
npx skills add coreyhaines31/marketingskills --skill cro copywriting
npx skills add coreyhaines31/marketingskills --list
npx skills add coreyhaines31/marketingskills -a claude-code   # 显式指定 agent

# Claude Code 插件
/plugin marketplace add coreyhaines31/marketingskills
/plugin install marketing-skills

# Clone & copy
git clone https://github.com/coreyhaines31/marketingskills.git
cp -r marketingskills/skills/* .agents/skills/

# Git submodule
git submodule add https://github.com/coreyhaines31/marketingskills.git .agents/marketingskills

# SkillKit（多 agent）
npx skillkit install coreyhaines31/marketingskills
```

**坑**：在 agent 会话内让 agent 装会走非交互模式，可能只装到 `.agents/skills/`（Claude Code 不读）——**必须 `-a claude-code` 显式指定**。

## v1.x → v2.0 升级

v2.0 重命名 17 个 skill 并把 `page-cro` + `form-cro` 合并为 `cro`。升级后旧名文件夹还在（新装在旁边）——清理：

```bash
# 在安装目录（.agents/skills/ 或 .claude/skills/）
rm -rf page-cro form-cro \
       ab-test-setup analytics-tracking aso-audit competitor-alternatives \
       email-sequence free-tool-strategy launch-strategy onboarding-cro \
       paid-ads paywall-upgrade-cro popup-cro pricing-strategy \
       product-marketing-context referral-program schema-markup \
       signup-flow-cro social-content
```

context 文件从 `.claude/product-marketing-context.md` 迁到 `.agents/product-marketing.md`（旧路径仍兼容）：

```bash
mkdir -p .agents
mv .claude/product-marketing.md .agents/product-marketing.md 2>/dev/null
mv .claude/product-marketing-context.md .agents/product-marketing.md 2>/dev/null
```

## v1 → v2 重命名对照

| 旧 | 新 |
| --- | --- |
| `ab-test-setup` | `ab-testing` |
| `analytics-tracking` | `analytics` |
| `aso-audit` | `aso` |
| `competitor-alternatives` | `competitors` |
| `email-sequence` | `emails` |
| `form-cro` + `page-cro` | `cro`（合并） |
| `free-tool-strategy` | `free-tools` |
| `launch-strategy` | `launch` |
| `onboarding-cro` | `onboarding` |
| `paid-ads` | `ads` |
| `paywall-upgrade-cro` | `paywalls` |
| `popup-cro` | `popups` |
| `pricing-strategy` | `pricing` |
| `product-marketing-context` | `product-marketing` |
| `referral-program` | `referrals` |
| `schema-markup` | `schema` |
| `signup-flow-cro` | `signup` |
| `social-content` | `social` |

## 目录结构

```
marketingskills/
├── skills/
│   ├── cro/SKILL.md
│   ├── copywriting/SKILL.md
│   ├── ads/SKILL.md
│   ├── ai-seo/SKILL.md
│   ├── cold-email/SKILL.md
│   ├── emails/SKILL.md
│   ├── ab-testing/SKILL.md
│   ├── analytics/SKILL.md
│   ├── churn-prevention/SKILL.md
│   └── …（共 47 个）
├── tools/                  # 平台集成（Google Ads / GA4 / Segment 等）
├── AGENTS.md / CLAUDE.md
├── CONTRIBUTING.md
├── VERSIONS.md
├── validate-skills.sh
└── LICENSE                 # MIT
```

每个 skill：`SKILL.md`（agent 指令）+ 可选 `references/`（深度文档，如 `ads/references/meta-decision-system.md`）+ 可选 `scripts/`。

## 许可

[MIT](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) — Copyright (c) 2025 Corey Haines。任意使用、修改、分发。

## 资源链接

- 仓库：[coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills)
- 站点：[marketing-skills.com](https://marketingskills.com)
- 作者：[Corey Haines](https://corey.co) · [Conversion Factory](https://conversionfactory.co) · [Swipe Files](https://swipefiles.com) · [AI Marketing Training](https://conversionfactory.co/offers/ai-marketing-training)
- Agent Skills 规范：[agentskills.io](https://agentskills.io)
- skills CLI：[vercel-labs/skills](https://github.com/vercel-labs/skills)
- 终端入门：[Coding for Marketers](https://codingformarketers.com)
- 相关叶：[Vercel Agent Skills](../vercel-agent-skills/) · [Skills CLI 与 find-skills](../skills-cli-find-skills/) · [Antfu Skills](../antfu-skills/)
