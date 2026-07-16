---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 vercel-labs/agent-skills 主分支（2026-07-07）的 README 与 skills/ 编写。

## 速查

- **装**：`npx skills add vercel-labs/agent-skills`（Claude Code / Cursor / Codex 等）
- **9 技能**：`vercel-deploy-claimable`（部署）·`vercel-optimize`（审计省成本）·`react-best-practices`（40+ 规则）·`web-design-guidelines`（100+ UI 规则）·`writing-guidelines`（80+ 写作规则）·`react-native-guidelines`·`react-view-transitions`·`composition-patterns`
- **触发**：装后自动激活（任务匹配），也可直接说「Deploy my app」「Review this React component for performance」
- **部署**：对话里说「Deploy my app」→ 自动识别 40+ 框架 → 返回 preview URL + **claim URL**（转所有权）
- **审计**：`vercel-optimize` 先收 Vercel 指标再查、`web-design-guidelines`/`writing-guidelines` 当评审器
- **格式**：每技能 `SKILL.md` + 可选 `scripts/` + `references/`；遵 agentskills.io；MIT

## 安装

```bash
npx skills add vercel-labs/agent-skills
```

装后技能自动可用——agent 检测到相关任务时调用。也可直接用自然语言触发。

## 9 个技能速览

| 技能 | 何时用 | 一句话 |
| --- | --- | --- |
| `vercel-deploy-claimable` | 「Deploy my app」 | 对话里部署，40+ 框架自动识别，返回 preview + claim URL |
| `vercel-optimize` | 优化已部署项目、降成本 | 先收指标再查指向的路由/文件，产排名的成本/性能报告 |
| `react-best-practices` | 写 React/Next.js、审性能 | Vercel Engineering 40+ 规则 8 类，按影响力排 |
| `web-design-guidelines` | 「Review my UI」「Check a11y」 | 100+ 规则审 a11y/焦点/表单/动画/排版/i18n |
| `writing-guidelines` | 「Review my docs」 | 80+ 规则对照 Vercel 写作手册审文案 |
| `react-native-guidelines` | 建 RN/Expo 应用 | 16 规则 7 类，性能/布局/动画/平台 |
| `react-view-transitions` | 页面/路由过渡动画 | `<ViewTransition>`、共享元素、Next.js `transitionTypes` |
| `composition-patterns` | 组件布尔 prop 泛滥 | 复合组件、状态提升，可扩展的组合模式 |

## 部署实战：对话里上线

```text
Deploy my app
```

`vercel-deploy-claimable` 会：

1. 把项目打包成 tarball（排除 `node_modules`、`.git`）
2. 检测框架（Next.js / Vite / Astro… 40+）
3. 上传部署
4. 返回：

```text
Deployment successful!
Preview URL: https://skill-deploy-abc123.vercel.app
Claim URL:   https://vercel.com/claim-deployment?code=...
```

> **claim URL** 是亮点：部署是「可认领的」——你可以把这个部署的所有权转到自己的 Vercel 账号。适合 claude.ai / Claude Desktop 从对话直接把东西部署上线。

## 优化实战：先量后查

```text
Optimize my Vercel project
```

`vercel-optimize` 不盲目扫全库——它**先收集 Vercel 指标**（成本、性能、可靠性、缓存、函数用量、账单），**再只调查这些指标指向的路由和文件**，最后产出**排名的成本与性能报告**。这样把精力花在真正花钱/变慢的地方，而非全量扫描。

适用：降 Vercel 成本/函数用量、查慢或贵的路由、找缓存/ISR/中间件/图片/构建分钟问题。

## 审计式技能：当评审器用

```text
Review my UI            # → web-design-guidelines（100+ a11y/UX 规则）
Review this React component for performance   # → react-best-practices
Review my docs          # → writing-guidelines（Vercel 写作手册）
```

这三个是「审计器」——对照 Vercel 的规则集扫你的代码/文案，报出命中项。例如 writing-guidelines 会揪出 `easy`/`simple`/`quick` 这类被禁的词、em dash 当标点等。

## 下一步

- [指南](./guide-line) —— 各技能深入、react 40+ 规则分类、审计式技能原理、触发机制
- [参考](./reference) —— 9 技能全表 + 触发词 + 规则分类、安装、目录结构
