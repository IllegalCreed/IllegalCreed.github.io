---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 coreyhaines31/marketingskills 主分支（2026-07）的 README 与 skills/ 编写。

## 速查

- **是什么**：Corey Haines 个人出品的社区项目（MIT，非官方），面向 technical marketers / founders 的营销 agent skills 集合，社区最流行/事实标准
- **47 skill**：覆盖 CRO、copywriting、SEO（含 AI-SEO）、ads、email、churn、growth、analytics、ab-testing、product-marketing 等全营销栈
- **装全部**：`npx skills add coreyhaines31/marketingskills`
- **装指定**：`npx skills add coreyhaines31/marketingskills --skill cro copywriting`
- **装进 Claude Code**：`npx skills add coreyhaines31/marketingskills -a claude-code`（显式指定 agent）
- **地基**：每个 skill 启动前先读 `.agents/product-marketing.md`——先建产品营销上下文文件
- **触发**：装后自然语言触发，如「Optimize this landing page」「Write a 5-email welcome sequence」「Set up GA4 tracking」
- **格式**：每 skill 一份 `SKILL.md`（agent 指令）+ 可选 `references/`（深度文档）+ 可选 `scripts/`

## 定位：Corey Haines 个人社区项目

Marketing Skills 不是某个公司的官方产品——它是 [Corey Haines](https://corey.co)（SaaS 营销圈知名从业者，[Conversion Factory](https://conversionfactory.co) 创始人）个人发起、社区贡献的营销 agent skills 集合。**社区最流行、事实上的标准**：

- 面向 **technical marketers 和 founders**——会用 agent（Claude Code / Codex / Cursor / Windsurf）的营销人
- 覆盖营销全栈：CRO、文案、SEO、AI-SEO、付费广告、邮件、留存、增长、销售支持
- 47 个 skill，每个遵循 [agentskills.io](https://agentskills.io) 开放格式
- 站点：[marketing-skills.com](https://marketingskills.com)；仓库 `coreyhaines31/marketingskills`，MIT

> **如实说明**：个人社区项目，非 Anthropic / OpenAI / Google 官方，无公司背书；规则与数据多来自社区沉淀与二手研究。但因覆盖广、维护勤、社区采用度高，是营销 agent skills 的事实标准。

## 安装

```bash
# 1) 装 all 47 个 skill（推荐）
npx skills add coreyhaines31/marketingskills

# 2) 只装指定 skill
npx skills add coreyhaines31/marketingskills --skill cro copywriting

# 3) 列出可选 skill
npx skills add coreyhaines31/marketingskills --list
```

CLI 会自动检测本地装了哪些 agent，问你要装到哪里。Claude Code 装进 `.claude/skills/`；通用 agent 共享 `.agents/skills/`。

> **重要坑**：如果你**在 agent 会话里**让 agent 帮你装（例如让 Claude Code 自己跑 `npx skills add`），CLI 走非交互模式，**可能只装到 `.agents/skills/`**——Claude Code 不读这个目录。**显式指定 agent 才行**：
>
> ```bash
> npx skills add coreyhaines31/marketingskills -a claude-code
> ```

### 其他安装方式

- **Claude Code 插件**：`/plugin marketplace add coreyhaines31/marketingskills` 然后 `/plugin install marketing-skills`
- **Clone & Copy**：`git clone … && cp -r marketingskills/skills/* .agents/skills/`
- **Git Submodule**：`git submodule add … .agents/marketingskills`，再从 `.agents/marketingskills/skills/` 引用
- **SkillKit（多 agent）**：`npx skillkit install coreyhaines31/marketingskills`

## 第一步：建 product-marketing 上下文

47 个 skill 大多在「Before Starting」段都要求**先读 `.agents/product-marketing.md`**（旧位置 `.claude/product-marketing.md` / 旧文件名 `product-marketing-context.md` 仍兼容）。这份文件由 `product-marketing` skill 帮你生成，记录：

- 产品是什么、给谁用、解决什么问题
- 定位、差异化、定价
- 品牌 voice、目标受众画像

**没建这个文件**，每个 skill 都会重新问你这套问卷——效率低。**建议第一件事**：

```text
Create my product marketing context
```

→ 调用 `product-marketing` skill，问答产出 `.agents/product-marketing.md`。

## 47 skill 分类总览

| 领域 | 代表 skill | 干什么 |
| --- | --- | --- |
| **CRO 转化优化** | `cro` · `signup` · `onboarding` · `popups` · `paywalls` | 优化页面/表单/注册/激活/弹窗/付费墙转化 |
| **Content & Copy** | `copywriting` · `copy-editing` · `cold-email` · `emails` · `social` · `image` · `video` | 营销页文案、冷邮件、邮件流、社媒、图/视频 |
| **SEO & 发现** | `seo-audit` · `ai-seo` · `programmatic-seo` · `site-architecture` · `competitors` · `schema` · `directory-submissions` · `aso` | 技术 SEO、AI-SEO、规模页、站点结构、竞品页、Schema、目录提交、应用商店 |
| **Paid & 分发** | `ads` · `ad-creative` · `social` | Google/Meta/LinkedIn/Twitter/TikTok 广告、批量素材 |
| **Measurement & 测试** | `analytics` · `ab-testing` | GA4/事件追踪、实验设计与显著性 |
| **留存** | `churn-prevention` · `community-marketing` | cancel flow、save offer、dunning、社区 |
| **Growth 工程** | `co-marketing` · `free-tools` · `referrals` · `lead-magnets` · `marketing-loops` | 联合营销、免费工具、推荐、lead magnet、循环自动化 |
| **Strategy & 商业化** | `marketing-ideas` · `marketing-psychology` · `launch` · `pricing` · `offers` · `marketing-plan` · `marketing-council` | 140 个点子、心理学、发布、定价、offer、计划、多顾问 |
| **Sales & RevOps** | `revops` · `sales-enablement` · `prospecting` · `competitor-profiling` · `public-relations` | 客户生命周期、销售物料、找 prospects、对手画像、PR |
| **基础** | `product-marketing` · `content-strategy` · `customer-research` · `schema` | 所有 skill 的上下文基础 |

> skill 之间会**互相交叉引用**——`copywriting ↔ cro ↔ ab-testing`、`revops ↔ sales-enablement ↔ cold-email`、`seo-audit ↔ schema ↔ ai-seo`、`customer-research` 是 `copywriting` / `cro` / `competitors` 的上游。

## 用法：自然语言触发

装好直接对话，agent 会按 description 匹配自动激活：

```text
"Help me optimize this landing page for conversions"   → cro
"Write homepage copy for my SaaS"                       → copywriting
"Set up GA4 tracking for signups"                       → analytics
"Create a 5-email welcome sequence"                     → emails
```

也可直接调用：

```text
/cro
/emails
/seo-audit
```

## 下一步

- [指南](./guide-line) —— 按营销领域深入：CRO / copywriting / SEO（含 AI-SEO）/ ads / lifecycle email / churn-prevention / growth engineering + 营销工作流 + 反模式
- [参考](./reference) —— 47 skill 全表 + 触发词 + 安装细节 + 许可
