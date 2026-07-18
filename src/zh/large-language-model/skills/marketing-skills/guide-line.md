---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 coreyhaines31/marketingskills（Corey Haines 个人社区项目，非官方，MIT）主分支 README 与 skills/ 编写。

## 速查

- **架构**：`product-marketing` 是地基——每个 skill 启动前先读 `.agents/product-marketing.md`，再分支到 CRO / 文案 / SEO / ads / email / 留存 / growth
- **CRO**：按价值主张清晰度 → 标题 → CTA → 视觉层级 → 信任 → 摩擦 顺序分析，5 秒说不清就重写
- **copywriting**：受众语言（不是行业 jargon）、价值主张前置、一个页面一个主 CTA
- **SEO 三路**：`seo-audit`（技术/页面 SEO）+ `ai-seo`（被 AI 引用，引用≠推荐）+ `programmatic-seo`（模板批量出页）
- **AI-SEO 关键**：传统 SEO 排名，AI-SEO 被引用——结构化（FAQ/对比表/定义块 40-60 词）、权威信号（统计 +40%）、第三方露出（Wikipedia/Reddit/评测站）
- **ads（2026 Meta Andromeda）**：广撒 + 创意做定向（不是 interest stack），静态图常胜视频，identity-trigger 关键词
- **lifecycle email**：`emails` 自动化流（welcome / nurture / 行为触发），`cold-email` 是 B2B 冷外呼
- **churn-prevention**：自愿 churn（cancel flow + save offer + exit survey）vs 非自愿 churn（dunning 重试 + 卡更新）
- **growth**：free-tools / referrals / co-marketing / marketing-loops（agent 可循环跑）
- **反模式**：jargon 文案、interest stacking、刷 Reddit/Wikipedia 假引、block AI bot 又想被引用

## 营销 skills 的协作架构

47 个 skill 不是平铺——它们围绕一个**地基**协作：

```
                ┌──────────────────────────┐
                │   product-marketing       │
                │ （所有 skill 启动前先读） │
                └────────────┬─────────────┘
        ┌──────────┬─────────┼─────────┬──────────┬──────────┐
        ▼          ▼         ▼         ▼          ▼          ▼
     SEO&内容    CRO     文案&邮件  付费&衡量   留存&增长   销售&战略
```

每个 skill 的 `## Before Starting` 段都先读 `.agents/product-marketing.md`，没有再问。`customer-research` 是 `copywriting` / `cro` / `competitors` 的上游；`ab-testing` 同时服务 `cro`、`ads`、`emails`、`popups`——它们之间互相交叉引用（见每 skill 末尾 `## Related Skills`）。

## CRO 转化优化：按影响顺序排

`cro` skill 把页面分析按**影响力从高到低**排序：

1. **价值主张清晰度**（最高影响）——5 秒内能否看懂这是什么、为何要在乎
2. **标题有效性**——是否传达核心价值、是否具体、是否匹配流量来源 messaging
3. **CTA 位置 / 文案 / 层级**——单一主 CTA、首屏可见、按钮文案传价值（`Start Free Trial` 胜过 `Submit`）
4. **视觉层级 / 设计**——引导眼动到主 CTA
5. **信任 / 信用**——客户 logo、证言、数据
6. **摩擦**——表单字段、步骤、认知负荷

强标题模式：`Get [desired outcome] without [pain point]`、`Join 10,000+ teams who…`、带数字/时间窗的具体化。配套 skill：`signup`（注册流）、`onboarding`（激活）、`popups`（弹窗）、`paywalls`（应用内付费墙）。

## copywriting：受众语言不是行业 jargon

`copywriting` skill 的几个不变量：

- **受众语言**：用客户描述问题的原话，不是公司内部 jargon
- **价值主张前置**：5 秒能看懂，benefit 优先于 feature
- **一个页面一个主 CTA**：多 CTA 抢注意力
- **scansion**：标题、副标题、bullet 让人 10 秒扫完
- **社会证明具体化**：「3x improvement in [metric]」胜过「we're the best」

`copy-editing` 是审稿版——对照规则改现有文案；`cold-email` 是 B2B 外呼版（短、像同事、一句话一个低摩擦 CTA、`Re:`/`Fwd:` 不要造假）。

## SEO：三路分工 + AI-SEO 新打法

Marketing Skills 把 SEO 拆成三个 skill：

| skill | 干什么 |
| --- | --- |
| `seo-audit` | 传统技术 + 页面 SEO（爬取、内部链、meta、Core Web Vitals、索引） |
| `ai-seo` | 让内容被 ChatGPT / Perplexity / Google AI Overviews / Claude / Gemini **引用** |
| `programmatic-seo` | 用模板 + 数据规模出页（城市页、对比页、目录页） |
| `site-architecture` | 页面层级、导航、URL 结构、内链 |
| `schema` | 结构化数据（FAQ / HowTo / Product / Review） |
| `competitors` | 对比页、替代品页（SEO + 销售支持） |

### AI-SEO 关键认知

传统 SEO 让你**排名**，AI-SEO 让你**被引用**——是两件事。`ai-seo` 的关键判断：

- **引用 ≠ 推荐**：被 AI 引用只是说「你的内容值得参考」；进入买家**候选短名单**靠全网共识（评测站、论坛、媒体），与自有内容基本无关
- **Google 官方立场**：AI Overviews 用核心 Search 排名系统，**不需要特殊 markup 或文件**——别为 AI 单独写一份内容（会被当 scaled content abuse）
- **其他 AI 引擎（ChatGPT / Claude / Perplexity）**：会奖励可抽取结构（FAQ / 对比表 / 定义块 40-60 词）、`llms.txt`、机器可读定价页（`/pricing.md`）
- **Princeton GEO 研究（KDD 2024）9 种方法排名**：引用源 +40%、加统计 +37%、加引语 +30%、权威语气 +25%、清晰度 +20%、技术术语 +18%、词汇多样 +15%、流畅 +15-30%；**关键词堆砌 -10%**（主动伤害）
- **第三方露出比自有站更重要**：Wikipedia 占 ChatGPT 引用 7.8%，Reddit 1.8%；评测站（G2 / Capterra / TrustRadius）也是重源
- **robots.txt 别误封**：封 `GPTBot` / `PerplexityBot` / `ClaudeBot` / `Google-Extended` = 那个平台无法引用你；封训练爬虫 `CCBot` 可以

**机器可读文件清单**（站点根放）：

- `/pricing.md`：结构化定价，AI agent 比价时能读
- `/llms.txt`：站点简介 + 关键页链接（见 [llmstxt.org](https://llmstxt.org)）
- `/okf/`：Google 2026-06 推的 Open Knowledge Format bundle（YAML frontmatter + markdown 目录，早期，无确认 AI 排名信号）

## ads：2026 Meta Andromeda 新打法

`ads` skill 最值得看的新东西是 **Meta Andromeda 算法（2025+）**——把「interest stacking + 精修视频 + 单一 winner scaling」旧打法基本推翻：

- **创意数量是瓶颈，静态 > 精修视频**：Andromeda 是「饿熊猫」，需持续喂新创意；静态图比视频便宜 10 倍且 2026 实测常胜
- **创意就是定向**：广撒（只选国家）+ 让创意做定向；每周 1 小时产新创意，量 > 精
- **identity-trigger 关键词**：在标题嵌入 `dental` / `lawyer` / `property investment` 等身份关键词——同时是观众身份触发 + Andromeda 定向信号
- **AI 变体农场（100 人测试）**：让 Claude/ChatGPT 用「100 人看不出换作者」的 prompt 改写最佳广告，针对不同人群
- **僵尸广告**：CBO 给 80% 变体 0 预算，挑高信念的死稿放独立 ad set 复活，约 20% 复活成 winner
- **广告不像广告**：数百万人装广告拦截器——精修美学杀效果；burner 账号刷 niche influencer 内容，让广告融入原生美学

**Meta 广告阶段坑**：

- 测试期（前 2-4 周）：70% 安全 + 30% 测试
- 扩量期：每次加预算 ~20%（**绝不要一次 +30%**，会重置学习期）；间隔 3-5 天
- **headline mirroring**：把广告里胜出的标题逐字搬到落地页 H1，落地页转化率可 +15-20%

**平台知识 → 创意 vs 定向** 的占比（2026）：

| 平台 | 创意 | 定向 filter |
| --- | --- | --- |
| Meta（Andromeda 后） | 80%+ | 20% |
| Google Search | 40% | 60%（关键词主导） |
| Performance Max / Demand Gen | 70% | 30% |
| LinkedIn | 40% | 60%（头衔 / 公司精确） |
| TikTok | 70% | 30% |

## lifecycle email：emails vs cold-email

两个 email skill 分工明确：

- **`emails`（生命周期 / 自动化流）**：welcome 序列、nurture drip、行为触发（注册 / 弃购 / 升级）、win-back。已有关系或订阅用户。
- **`cold-email`（B2B 冷外呼）**：写给完全陌生 prospect 的开发信 + 跟进序列。短、像同事、observation→problem→proof→ask 框架、subject line 2-4 词小写像同事内部邮件（`reply rates` / `hiring ops` / `Q2 forecast`）、每封加新角度（**不要「just checking in」**）、breakup email 是最后一触。

`sms` 是 SMS/MMS 版（welcome / 弃购 / 行为触发，注意合规）。

## churn-prevention：自愿 vs 非自愿

`churn-prevention` skill 的核心区分：

| 类型 | 原因 | 解法 |
| --- | --- | --- |
| **Voluntary（自愿）** | 客户主动取消 | cancel flow + save offer + exit survey |
| **Involuntary（非自愿）** | 支付失败 | dunning 邮件 + 智能重试 + 卡更新器（Stripe Braintree 等） |

通常自愿占 50-70%、非自愿 30-50%；非自愿往往更容易补救。配合工具：Churnkey / ProsperStack / Raaft；配合 skill：`emails`（win-back 序列）、`paywalls`（应用内升级挽回）。

## growth engineering：可循环的营销

Marketing Skills 把增长拆成几个可执行 skill：

- **`free-tools`**：免费工具 / 计算器换 lead / SEO
- **`referrals`**：推荐 / 联盟 / 口碑
- **`co-marketing`**：找联合营销伙伴、联合 campaign
- **`lead-magnets`**：lead magnet 设计与优化
- **`marketing-loops`**：**可让 agent 定期循环跑的自动化营销工作流**（这是给 agent 时代准备的——设定循环，AI 周期性执行）
- **`marketing-council`**：模拟多专家顾问团，给同一营销问题多个视角

## 营销工作流示例

典型 marketing skills 工作流（按营销漏斗）：

1. **地基**：`customer-research` → `product-marketing`（产出 `.agents/product-marketing.md`）
2. **拉新**：`seo-audit` + `ai-seo` + `programmatic-seo` + `content-strategy` + `ads` + `ad-creative`
3. **转化**：`cro` + `copywriting` + `signup` + `popups` + `ab-testing`
4. **激活 / 留存**：`onboarding` + `emails` + `churn-prevention` + `paywalls`
5. **衡量 / 迭代**：`analytics` + `ab-testing` + 持续优化
6. **增长**：`referrals` + `free-tools` + `co-marketing` + `marketing-loops`

## 反模式与陷阱

**copywriting / cro**

- 用行业 jargon 写文案，而不是客户的原话
- 落地页有多个主 CTA 互相抢
- 价值主张写得太聪明、太抽象（牺牲清晰换创意）

**ads**

- 用 hyper-precise targeting 弥补平庸创意（叠加 12 个兴趣 + 3 个人口 + custom audience = 一小群人看烂广告）
- Meta 时代还在 interest stacking（Andromeda 后已弱化）
- 一次 +30% 预算重置学习期
- 只看 ROAS 百分比，不看净现金流——ROAS 从 10 掉到 5 但花费 10x 时利润大幅增长

**AI-SEO**

- 为 AI 单独写一份内容（违反 Google scaled content abuse）
- 封 `GPTBot` / `ClaudeBot` / `PerplexityBot` 但又想被 AI 引用——封了 = 那个平台无法引用你
- 关键词堆砌（**主动降权 10%**）
- 把定价藏在 JS 渲染页或「联系销售」墙后——AI agent 比价时跳过你

**cold-email**

- 用 HTML / 图 / 多链接 / 假 `Re:` / `Fwd:`
- 「I hope this email finds you well」「My name is X and I work at Y」开头
- 第一封就要 30 分钟会议
- follow-up 写「just checking in」

**churn-prevention**

- 不区分自愿 / 非自愿 churn
- cancel flow 没设 save offer
- 忽视 dunning（支付失败重试 + 卡更新）

## 与相邻叶的边界

- **AI 编码 / 工程 skills**（如 [Vercel Agent Skills](../vercel-agent-skills/)、[Antfu Skills](../antfu-skills/)）偏代码工程；本叶偏营销工作流
- **本叶是非官方社区项目**：Corey Haines 个人 + 社区维护，规则与数字来自社区研究（Princeton GEO 等）+ 二手资料，使用时对关键数字自行核验

## 下一步

- [参考](./reference) —— 47 skill 全表 + 触发词 + 安装细节 + 许可 + 链接
- 上游：[coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills)
