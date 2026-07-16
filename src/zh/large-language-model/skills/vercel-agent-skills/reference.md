---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 vercel-labs/agent-skills README 与 skills/ 编写。

## 速查

- **装**：`npx skills add vercel-labs/agent-skills`
- **9 技能**：deploy-claimable / optimize / react-best-practices / web-design-guidelines / writing-guidelines / react-native-guidelines / react-view-transitions / composition-patterns
- **每技能**：`SKILL.md`（必）+ `scripts/`（可选）+ `references/`（可选）
- 遵 agentskills.io 格式；MIT；Vercel Engineering 出品

## 9 技能全表

| 技能 | 触发词 | 覆盖 |
| --- | --- | --- |
| `vercel-deploy-claimable` | Deploy my app / Push this live | 40+ 框架自动识别、preview + claim URL、排除 node_modules/.git、静态 HTML |
| `vercel-optimize` | 优化/降成本/慢路由 | 先收指标再查、成本/性能/缓存/函数/账单、排名报告 |
| `react-best-practices` | 写 React/Next.js、审性能、优化 bundle | 40+ 规则 8 类，按影响力分级 |
| `web-design-guidelines` | Review my UI / Check a11y / Audit design | 100+ 规则 11 类（a11y/焦点/表单/动画/排版/图片/性能/导航/暗色/触摸/i18n） |
| `writing-guidelines` | Review my docs / Check writing style | 80+ 规则（voice/结构/内容类型/代码/排版/AI 工作流），禁 easy/simple/quick |
| `react-native-guidelines` | 建 RN/Expo、优化移动性能 | 16 规则 7 类（性能/布局/动画/图片/状态/架构/平台） |
| `react-view-transitions` | 页面/路由过渡、共享元素动画 | `<ViewTransition>`、addTransitionType、Next.js `transitionTypes` |
| `composition-patterns` | 布尔 prop 泛滥、建组件库 | 复合组件、状态提升、内部组合、避免 prop drilling |

## react-best-practices 规则分类（按影响力）

| 优先级 | 类别 |
| --- | --- |
| Critical | 消除瀑布（waterfalls）· Bundle 体积优化 |
| High | 服务端性能 |
| Medium-High | 客户端数据获取 |
| Medium | 重渲染优化 · 渲染性能 |
| Low-Medium | JavaScript 微优化 |

## web-design-guidelines 11 类

Accessibility · Focus States · Forms · Animation · Typography · Images · Performance · Navigation & State · Dark Mode & Theming · Touch & Interaction · Locale & i18n

## deploy-claimable 输出

```text
Deployment successful!
Preview URL: https://skill-deploy-abc123.vercel.app
Claim URL:   https://vercel.com/claim-deployment?code=...
```

- Preview URL = 在线站；Claim URL = 转所有权到你的 Vercel 账号
- 打包排除 `node_modules`、`.git`；自动处理静态 HTML 项目

## 目录结构

```
agent-skills/
├── skills/
│   ├── deploy-to-vercel/SKILL.md
│   ├── vercel-optimize/SKILL.md
│   ├── react-best-practices/SKILL.md
│   ├── web-design-guidelines/SKILL.md
│   ├── writing-guidelines/SKILL.md
│   ├── react-native-skills/SKILL.md
│   ├── react-view-transitions/SKILL.md
│   └── composition-patterns/SKILL.md
├── AGENTS.md / CLAUDE.md
└── skills.sh.json
```

每技能：`SKILL.md`（agent 指令）+ `scripts/`（自动化辅助）+ `references/`（支撑文档）。

## 资源链接

- 仓库：[vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)
- 文档：[vercel.com/docs/agent-resources/skills](https://vercel.com/docs/agent-resources/skills)
- 生态介绍：[Introducing skills](https://vercel.com/changelog/introducing-skills-the-open-agent-skills-ecosystem)
- 相关叶：[Next.js Workflow Skills](../nextjs-workflow-skills/) · [Antfu Skills](../antfu-skills/) · [Skills CLI 与 find-skills](../skills-cli-find-skills/)
