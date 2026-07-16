---
layout: doc
---

# Vercel Agent Skills

Vercel Agent Skills（`vercel-labs/agent-skills`）是 Vercel 官方出品的一组 AI 编码 agent 技能集，遵循 agentskills.io 开放格式，MIT 开源。它把 Vercel 工程团队的部署、性能优化、审计与写作规范打包成可按需调用的技能——从「一句话把应用部署上线并给我链接」（`vercel-deploy-claimable`），到「审计我的 Vercel 项目省成本」（`vercel-optimize`），再到 React/Next.js 性能 40+ 规则、Web 设计 100+ 规则、写作手册 80+ 规则。不是通用 prompt，而是 Vercel Engineering 沉淀的、有明确触发条件与分类的工程规范。

## 评价

**优点**

- **官方沉淀**：规则来自 Vercel Engineering 实战（React 性能、Web 设计、写作手册），非泛泛而谈
- **对话即部署**：`vercel-deploy-claimable` 自动识别 40+ 框架，返回 preview URL + **claim URL**（可把部署所有权转到你的 Vercel 账号）
- **审计先量后查**：`vercel-optimize` 先收集 Vercel 指标，再只调查指标指向的路由/文件，产出排名的成本/性能报告
- **规则可执行且分级**：react-best-practices 40+ 规则按影响力分 8 类（消除瀑布=Critical、bundle=Critical…），照做即优化
- **审计式技能**：web-design-guidelines（a11y/焦点/表单/动画/排版/i18n 100+ 规则）、writing-guidelines（voice/结构/代码/排版 80+ 规则）当「代码/文案评审器」用
- **View Transitions**：react-view-transitions 覆盖 `<ViewTransition>`、共享元素过渡、Next.js `transitionTypes`
- **跨 agent**：`npx skills add` 装进 Claude Code / Cursor / Codex 等

**缺点 / 边界**

- **偏 Vercel/React 生态**：deploy/optimize 绑 Vercel 平台，react-best-practices 偏 React/Next.js
- **审计类需人判断**：给出 100+ 规则命中，最终取舍仍靠你
- **deploy-claimable 面向 claude.ai/Desktop**：从对话直接部署的场景，命令行 Claude Code 侧重其它技能
- **与 Next.js Workflow Skills 分工**：Next.js 专有 workflow（cache-components/dev-loop）在 [Next.js Workflow Skills](../nextjs-workflow-skills/) 叶，本叶偏 Vercel 平台 + React 通用规范

## 适用场景

- 部署到 Vercel、或想审计已部署项目省成本/提性能（optimize + deploy）
- 写 React/Next.js 组件想照 Vercel 性能规范（react-best-practices）
- 想要「UI 评审器」「文案评审器」对照 a11y/UX/写作手册审代码
- 做页面/路由过渡动画（react-view-transitions）

## 边界

- **不是单个技能，是官方技能集**：9 个技能各有触发条件，按需激活
- **审计不代替判断**：规则命中是输入，取舍是你的
- **平台绑定部分**：deploy/optimize 与 Vercel 平台强相关
- **React Native 另有专技能**：react-native-guidelines（16 规则 7 类）

## 官方文档

[Vercel Agent Skills 文档](https://vercel.com/docs/agent-resources/skills) ｜ [Introducing skills 生态](https://vercel.com/changelog/introducing-skills-the-open-agent-skills-ecosystem) ｜ [skills.sh · vercel-labs](https://skills.sh/vercel-labs/agent-skills)

## GitHub 地址

[vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)（MIT）

## 内容地图

- [入门](./getting-started) —— `npx skills add` 安装、9 个技能速览、部署与优化实战
- [指南](./guide-line) —— 各技能深入（optimize 先量后查、react 40+ 规则、审计式技能）、触发机制
- [参考](./reference) —— 9 技能全表 + 触发词 + 规则分类、安装、目录结构

## 幻灯片地址

<a href="/SlideStack/vercel-agent-skills-slide/" target="_blank">Vercel Agent Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">Vercel Agent Skills 测试题</a>

> 测试题链接待生产库分类导入、获得真实数字叶节点 ID 后回填。
