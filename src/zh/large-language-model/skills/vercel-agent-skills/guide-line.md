---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 vercel-labs/agent-skills 的 README 与各 skills/ 编写。

## 速查

- **两类**：动作型（deploy / optimize）+ 审计型（web-design / writing / react-best-practices）
- **optimize 先量后查**：先收 Vercel 指标，只查指标指向处，产排名报告
- **react-best-practices**：40+ 规则 8 类，按影响力分级（瀑布/bundle=Critical → 微优化=Low）
- **审计型当评审器**：web-design（100+ a11y/UX）、writing（80+ Vercel 手册，禁 easy/simple/quick）
- **deploy-claimable**：40+ 框架自动识别，preview + claim URL（转所有权）
- **view-transitions**：`<ViewTransition>` + Next.js `transitionTypes`
- 装 `npx skills add vercel-labs/agent-skills`；MIT

## vercel-optimize：先量后查的审计

`vercel-optimize` 的设计哲学是「不盲扫」：

1. **先收集指标**——成本、性能、可靠性、缓存、函数用量、账单
2. **只调查指标指向的路由/文件**——不全库扫描
3. **产出排名报告**——按成本与性能影响排序

它覆盖：降 Vercel 成本/函数用量、慢或贵的路由、缓存/ISR/中间件/图片/构建分钟问题。这种「数据驱动、聚焦热点」的审计方式，比无差别扫全库高效得多。

## react-best-practices：40+ 规则，按影响力分级

来自 Vercel Engineering 的 React/Next.js 性能优化规则，40+ 条分 8 类，**按影响力优先级排序**：

| 优先级 | 类别 |
| --- | --- |
| **Critical** | 消除瀑布（waterfalls）、Bundle 体积优化 |
| **High** | 服务端性能 |
| **Medium-High** | 客户端数据获取 |
| **Medium** | 重渲染优化、渲染性能 |
| **Low-Medium** | JavaScript 微优化 |

> 优先级排序是关键——它告诉 agent「先做影响大的」，而非平均用力。写新组件/页面、实现数据获取、审性能、优化 bundle 时用。

## 审计式技能：把规则集变成评审器

三个「审计器」技能对照 Vercel 的规则集扫你的产物：

### web-design-guidelines（100+ 规则）

审 UI 代码合规性——覆盖 11 类：Accessibility（aria-label、语义 HTML、键盘）、Focus States（可见焦点、focus-visible）、Forms（autocomplete、验证、错误处理）、Animation（prefers-reduced-motion、合成器友好变换）、Typography（弯引号、省略号、tabular-nums）、Images、Performance（虚拟化、布局抖动、preconnect）、Navigation & State（URL 反映状态、深链）、Dark Mode & Theming、Touch & Interaction、Locale & i18n（Intl.DateTimeFormat/NumberFormat）。

触发：「Review my UI」「Check accessibility」「Audit design」。

### writing-guidelines（80+ 规则）

审文档/文案是否合 Vercel 写作手册——voice/结构/内容类型/代码样例/排版/AI 工作流。例如：主动语态、**禁用 `easy`/`simple`/`quick` 等词**、句首大写标题、TypeScript 优先、代码 80 列/25 行限、**不用 em dash 当标点**、弯引号、省略号字符。

触发：「Review my docs」「Check writing style」。

### react-best-practices

见上——也可作性能审查器：「Review this React component for performance」。

## deploy-claimable：对话即部署

`vercel-deploy-claimable` 让你在 claude.ai / Claude Desktop 的对话里直接部署：打包（排除 node_modules/.git）→ 检测框架（40+）→ 上传 → 返回 preview URL（在线站）+ **claim URL**（把所有权转到你的 Vercel 账号）。「可认领部署」是它的特色——AI 帮你部署，但成果归你。

## react-view-transitions & composition-patterns

- **react-view-transitions**：用 React View Transition API 做原生感过渡——`<ViewTransition>`（enter/exit/update/share）、`addTransitionType`（方向性动画）、共享元素过渡（`name` prop）、Next.js App Router 的 `next/link` `transitionTypes` prop、现成 CSS 配方、a11y（prefers-reduced-motion）
- **composition-patterns**：React 可扩展组合——避免布尔 prop 泛滥，用复合组件、状态提升、内部组合；重构多布尔 prop 组件、建组件库时用

## 触发机制

技能装后**自动激活**（agent 检测到相关任务），也可自然语言显式触发（「Deploy my app」「Review my UI」）。每个技能的 `SKILL.md` frontmatter 的 description 里写明「Use when…」，agent 据此判断。

## 与相邻叶的边界

- **Next.js 专有 workflow**（cache-components/dev-loop/partial-prefetching）在 [Next.js Workflow Skills](../nextjs-workflow-skills/) 叶，本叶偏 Vercel 平台 + React 通用
- **web-design-guidelines** 也被 [Antfu Skills](../antfu-skills/) vendored 引用——这个生态互相借用

## 下一步

- [参考](./reference) —— 9 技能全表 + 触发词 + 规则分类、安装、目录结构
- 上游：[Vercel Agent Skills 文档](https://vercel.com/docs/agent-resources/skills)
