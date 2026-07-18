---
layout: doc
---

# Marketing Skills

Marketing Skills（`coreyhaines31/marketingskills`）是 **Corey Haines 个人**出品的社区项目（非官方、MIT 开源），面向 technical marketers 和 founders——把营销工作打包成 AI 编码 agent 的 skills：让 Claude Code、OpenAI Codex、Cursor、Windsurf 等任何支持 agentskills.io 规范的 agent，帮你做转化优化（CRO）、文案（copywriting）、SEO（含 AI-SEO）、付费广告（paid ads）、生命周期邮件（lifecycle email）、留存（churn-prevention）、增长工程（growth engineering）等营销任务。仓库目前收录 **47 个 skill**，每个 skill 一份 `SKILL.md`——是社区最流行、事实上标准的营销 agent skills 集合（marketing-skills.com）。

## 评价

**优点**

- **社区事实标准**：Corey Haines 个人沉淀、47 个 skill 覆盖营销全栈，是目前最流行的营销 agent skills 集合
- **面向 technical marketers**：定位清晰——给会写代码 / 用 agent 的营销人和 founders，不是给纯文案
- **product-marketing 是地基**：每个 skill 启动前先读 `.agents/product-marketing.md`，避免脱离产品定位乱写
- **可路由的 references**：如 `ads` 把 Google/Meta/LinkedIn/ABM 决策树放进 references，按意图加载，主文件保持精简
- **跟上 2026 新打法**：`ads` 覆盖 Meta Andromeda 算法、`ai-seo` 覆盖 Google AI Overviews / ChatGPT / Perplexity / llms.txt / OKF
- **多种安装方式**：`npx skills add` / Claude Code plugin / git submodule / SkillKit 多 agent

**缺点 / 边界**

- **个人社区项目，非官方**：Corey Haines 个人 + 社区维护，无公司背书；多数 skill 引用数字来自二手研究（Princeton GEO 等）
- **强 SaaS / B2B 偏向**：`pricing` / `paywalls` / `churn-prevention` / `revops` 偏 SaaS 场景，纯品牌广告、电商促销场景覆盖薄
- **需要 product-marketing 上下文文件**：技能假设你有 `.agents/product-marketing.md`，没有则每次都要重新填问卷
- **规则命中需人判断**：copywriting / CRO / ads 给框架和最佳实践，最终取舍仍靠你
- **需配平台账号才能落地**：ads / analytics / ab-testing 给方案，但跑广告、装 GA4 仍要你自己接平台

## 适用场景

- 让 agent 帮你优化落地页/首页/定价页转化（cro）
- 写首页 / 邮件序列 / 冷邮件文案（copywriting / emails / cold-email）
- 为 AI 搜索做内容（ai-seo：被 ChatGPT/Perplexity/AI Overviews 引用）
- 搭 Google / Meta / LinkedIn 广告结构与决策（ads）
- 设计订阅留存与挽回（churn-prevention：cancel flow、save offer、dunning）
- 做付费转化漏斗分析、A/B 测试（analytics / ab-testing）

## 边界

- **不是营销自动化平台**：是 agent 技能集——给 agent 营销知识与工作流，本身不发邮件、不投广告
- **SaaS 偏向**：subscription / SaaS / B2B 场景最完整，传统行业营销需自行裁剪
- **依赖 product-marketing 上下文**：建议先建 `.agents/product-marketing.md`，否则技能反复问你
- **非官方、非 Anthropic / OpenAI 出品**：个人社区项目，按 MIT 自由使用

## 官方文档

[Marketing Skills（marketing-skills.com）](https://marketingskills.com) ｜ [GitHub：coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) ｜ [Agent Skills 规范（agentskills.io）](https://agentskills.io)

## GitHub 地址

[coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills)（MIT，Corey Haines 个人）

## 内容地图

- [入门](./getting-started) —— 安装、47 skill 总览、product-marketing 上下文、按营销领域分类
- [指南](./guide-line) —— CRO 转化 / copywriting 文案 / SEO 含 AI-SEO / ads 付费广告 / lifecycle email / churn-prevention 留存 / growth engineering 深入
- [参考](./reference) —— 47 skill 全表 + 触发词 + 安装 + 许可

## 幻灯片地址

<a href="/SlideStack/marketing-skills-slide/" target="_blank">Marketing Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=664" target="_blank" rel="noopener noreferrer">Marketing Skills 测试题</a>

