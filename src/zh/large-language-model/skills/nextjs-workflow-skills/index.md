---
layout: doc
---

# Next.js Workflow Skills

Next.js Workflow Skills 是 Next.js **官方**的一组「工作流技能」，源码就住在框架主仓库 `vercel/next.js/skills` 里，**版本随框架同步**（不会像独立 repo 那样漂移）。这里有个关键的工程决策：Next.js 把 agent 内容**按类型拆分**——**横向的参考知识**（best-practices、升级指南）不再是技能，改由 Next.js 16.3+ 内置文档（`next/dist/docs/`）+ `next dev` 自动生成的 `AGENTS.md`/`CLAUDE.md` 交付；而**垂直的、用户显式触发的工作流**（采纳 cache components、优化 PPR、edit/verify 运行时验证）才留作技能。当前 4 个：`next-cache-components-adoption`、`next-cache-components-optimizer`、`next-dev-loop`、`next-partial-prefetching-adoption`。

## 评价

**优点**

- **版本随框架**：技能住在 vercel/next.js 主仓库，永远与你用的 Next.js 版本匹配，不漂移
- **垂直工作流**：不是泛泛的「Next.js 最佳实践」，而是可显式触发的动作——「采纳 cache components」「优化即时导航」「验证这个改动真的能跑」
- **runtime 验证（dev-loop）**：`next-dev-loop` 用 `/_next/mcp`（Next.js 自己的视角：路由/RSC/server actions/日志）+ agent-browser（浏览器视角：DOM/console/vitals）**双视角交叉核**，确认改动在运行的 app 里真的工作，而非只是编译/类型通过
- **cache-components 优化闭环**：`next-cache-components-optimizer` 给 PPR 页壳循环 + 即时导航循环两套诊断
- **清晰的 Skills vs AGENTS.md 决策**：官方给出「横向知识→AGENTS.md，垂直工作流→skills」的分工，且有 eval 支撑
- **硬门槛明确**：dev-loop 要求 Next.js 16.3+ Turbopack + agent-browser≥0.31.1，缺则明确告知升级而非退化

**缺点 / 边界**

- **需要新版 Next.js**：dev-loop/optimizer 依赖 16.3+ + Turbopack + cacheComponents，老项目用不上
- **参考知识不在这里**：想要 Next.js 通用最佳实践/升级，看内置文档 + 自动生成的 AGENTS.md，不是技能
- **依赖 agent-browser**：dev-loop 需要装 agent-browser CLI（驱动真 Chrome）
- **与 Vercel Agent Skills 分工**：Vercel 平台部署/优化在 [Vercel Agent Skills](../vercel-agent-skills/) 叶，本叶是 Next.js 框架专有 workflow

## 适用场景

- 用 Next.js 16.3+ 想采纳 cache components / partial prefetching（adoption 技能）
- cacheComponents 项目想优化首屏静态壳或即时导航（optimizer）
- 改完 app 代码想**确认运行时真的工作**，不只编译通过（dev-loop）
- 想理解「什么该进 AGENTS.md、什么该做成 skill」的官方决策

## 边界

- **不是通用 Next.js 知识库**：横向参考已迁到 AGENTS.md + 内置文档；本叶只是垂直 workflow
- **版本敏感**：多数技能要 Next.js 16.3+ + Turbopack
- **源在主仓库**：`vercel/next.js/skills`，`npx skills add vercel/next.js` 安装
- **Vercel 平台技能另属一叶**：deploy/optimize 平台层在 Vercel Agent Skills

## 官方文档

[Next.js AI Agents 指南](https://nextjs.org/docs/app/guides/ai-agents) ｜ [vercel/next.js skills 目录](https://github.com/vercel/next.js/tree/canary/skills) ｜ [AGENTS.md outperforms skills（Vercel eval）](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals)

## GitHub 地址

[vercel/next.js/tree/canary/skills](https://github.com/vercel/next.js/tree/canary/skills)（MIT；旧 `vercel-labs/next-skills` 已迁入主仓库）

## 内容地图

- [入门](./getting-started) —— `npx skills add vercel/next.js`、4 个 workflow 技能、Skills vs AGENTS.md 拆分
- [指南](./guide-line) —— dev-loop 双视角验证、cache-components 优化双循环、Skills/AGENTS.md 决策
- [参考](./reference) —— 4 技能全表 + 硬门槛、安装、旧技能去向、版本要求

## 幻灯片地址

<a href="/SlideStack/nextjs-workflow-skills-slide/" target="_blank">Next.js Workflow Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">Next.js Workflow Skills 测试题</a>

> 测试题链接待生产库分类导入、获得真实数字叶节点 ID 后回填。
