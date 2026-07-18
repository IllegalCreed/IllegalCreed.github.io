---
layout: doc
---

# Web Quality Skills

Web Quality Skills（`addyosmani/web-quality-skills`）是 **Addy Osmani** 个人维护的一组 AI 编码 agent 技能集，MIT 开源。Addy Osmani 是 Google Chrome 团队的工程负责人、公认的 Web 性能权威（《Learning Patterns》《Image Optimization》作者），这套技能把他与 Chrome DevTools 团队的实战洞见沉淀为 6 个可按需调用的技能——「基于 Google Lighthouse 指南与 Core Web Vitals 最佳实践优化 web 质量」。它 **框架无关**（React / Vue / Angular / Svelte / Next.js / Nuxt / Astro / 纯 HTML 都能用），把 150+ 条 Lighthouse 审计、Core Web Vitals（LCP/INP/CLS）优化模式、WCAG 2.2 无障碍标准、现代 SEO 要求打包成 agent 一句话就能触发的规范。它告诉你「怎样把 UI 建得性能好、可访问、对搜索引擎友好」，而不只是「建什么」。

## 评价

**优点**

- **权威沉淀**：规则来自 Addy Osmani（Google Chrome / Web 性能权威）+ Chrome DevTools 团队实战，非泛泛而谈
- **基于 Lighthouse + CWV**：150+ Lighthouse 审计 + Core Web Vitals（LCP/INP/CLS）三大指标，有明确阈值可量化
- **框架无关**：先给 vanilla HTML/CSS/JS，再补 React/Vue/Svelte/Astro 框架专有注释，任何栈都能用
- **6 技能分层**：`web-quality-audit` 编排全站审计，performance/accessibility/core-web-vitals/seo/best-practices 各自深入
- **触发词清晰**：每个技能 frontmatter 的 description 写明「Use when…」，任务匹配自动激活（「speed up」「WCAG」「fix LCP」…）
- **按影响力分级**：审计结果分 Critical / High / Medium / Low，agent 先修影响大的
- **WCAG 2.2 最新**：accessibility 技能覆盖 2.2 新增准则（焦点不被遮挡、目标尺寸 24px、可访问认证等）
- **跨 agent**：`npx skills add` / plugin / Codex / Gemini CLI 多种安装方式

**缺点 / 边界**

- **非官方 Google 产品**：README 明确标注「unofficial」，是 Addy Osmani 个人集合而非 Google 官方发布
- **审计需人判断**：给出规则命中作为输入，最终取舍与修复仍靠你
- **依赖 Lighthouse 心智模型**：阈值与分类跟随 Lighthouse，Lighthouse v13（2025-10+）迁到 Insight Audits 后审计名有变
- **与「Addy Osmani Agent Skills」叶不同仓**：那个是 `addyosmani/agent-skills` 宽泛集合，本叶专注 web quality，见 [Addy Osmani Agent Skills](../addy-osmani-agent-skills/)

## 适用场景

- 想系统审计一个网站的性能 / 无障碍 / SEO / 安全（web-quality-audit 一把梭）
- 页面加载慢、想优化 Core Web Vitals（performance + core-web-vitals）
- 要做 WCAG 2.2 合规、屏幕阅读器 / 键盘可达（accessibility）
- 提升搜索可见性、加结构化数据（seo）
- 排查混合内容 / CSP / 废弃 API 等安全与代码质量问题（best-practices）

## 边界

- **不是单个技能，是技能集**：6 个技能各有触发条件，按需激活
- **unofficial**：Addy Osmani 个人维护，非 Google 官方产品
- **审计不代替判断**：规则命中是输入，修不修、怎么修由你定
- **与宽泛的 Addy Osmani Agent Skills 分工**：本叶只聚焦 web quality（性能/a11y/SEO），通用工程技能在另一叶

## 官方文档

[Google Lighthouse 文档](https://developer.chrome.com/docs/lighthouse/) ｜ [web.dev Learn Performance](https://web.dev/learn/performance/) ｜ [Core Web Vitals](https://web.dev/articles/vitals) ｜ [WCAG 2.2 快速参考](https://www.w3.org/WAI/WCAG22/quickref/)

## GitHub 地址

[addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills)（MIT，Addy Osmani）

## 内容地图

- [入门](./getting-started) —— 定位（Addy Osmani / Chrome、vs Addy Osmani Agent Skills 叶）、安装、6 技能总览、Lighthouse + CWV
- [指南](./guide-line) —— 6 技能逐讲（audit 编排 / performance / accessibility WCAG 2.2 / core-web-vitals / best-practices / seo）、触发词、反模式
- [参考](./reference) —— 6 技能全表 + 触发词 + CWV 指标阈值 + 性能预算 + 许可 + 链接

## 幻灯片地址

<a href="/SlideStack/web-quality-skills-slide/" target="_blank">Web Quality Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=644" target="_blank" rel="noopener noreferrer">Web Quality Skills 测试题</a>

