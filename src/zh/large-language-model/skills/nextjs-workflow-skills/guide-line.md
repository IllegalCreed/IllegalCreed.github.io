---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 vercel/next.js（canary/skills）的 SKILL.md 与迁移公告编写。

## 速查

- **Skills vs AGENTS.md**：横向参考→AGENTS.md（全量前置，总遵守）；垂直工作流→skills（按需触发）
- **dev-loop 双视角**：`/_next/mcp`（Next.js 视角：路由/RSC/server actions/日志）+ agent-browser（浏览器视角：DOM/console/vitals）交叉核
- **验证运行时**：确认改动真跑，不只编译/类型通过
- **optimizer 双循环**：页壳 PPR 循环（长静态壳）+ 即时导航循环（点链接立即显 B 的静态布局）
- **硬门槛**：16.3+ Turbopack + agent-browser≥0.31.1，缺则告知升级并停
- 装 `npx skills add vercel/next.js`；MIT；版本随框架

## 核心工程决策：Skills vs AGENTS.md

Next.js 团队做了一个清晰的内容分层：

- **AGENTS.md / 内置文档**（横向知识）：`next dev`（16.3+）自动写 `AGENTS.md`/`CLAUDE.md`，加上 bundled docs。全量前置加载，agent 总会遵守，**零假阴性**。best-practices、通用指南走这条。
- **Skills**（垂直工作流）：用户显式触发的动作（采纳特性、优化、验证）。按需拉取，可能有假阴性（该拉时没拉），但胜在**动作明确、可复用**。

> Vercel 的 eval 结论「AGENTS.md outperforms skills」正是针对**横向知识**——所以他们把这类内容从技能挪进 AGENTS.md，只保留垂直工作流作技能。这不是「skills 不行」，而是「用对地方」：知识用 AGENTS.md，工作流用 skills。这个决策对任何做 agent 内容的人都有参考价值。

## next-dev-loop：双视角验证运行时

`next-dev-loop` 治的是「编译过了但运行时不对」——它在 `next dev` 期间做 edit/verify：改一处，确认它在**运行的 app** 里真的工作。用两个视角交叉核：

| 视角 | 是什么 | 知道什么 |
| --- | --- | --- |
| **`/_next/mcp`** | Next.js 暴露的 HTTP 端点 | 框架专有：路由、段、RSC、server actions、server 日志、错误（Next.js 眼中的） |
| **agent-browser** | 驱动真 Chrome 的 CLI | 框架无关：DOM、console、network、React fiber、vitals（浏览器眼中的） |

两个视角**互相印证**——一个说路由 OK，另一个确认页面真的渲染了。这比只看编译输出可靠得多。

**硬门槛（hard floors，不是软偏好）**：

- Next.js **16.3+ 带 Turbopack**——`/_next/mcp` + `get_compilation_issues` 主动编译检查
- agent-browser **≥0.31.1**——React introspection、worktree-scoped session id、幂等 `--restore`

> 缺任何一个，dev-loop 会**告诉你怎么升级并停下**——不会退化成 grep 源码或更弱的探测。它假定两个视角都活着。用 agent-browser 前先 `agent-browser skills get core` 拿版本匹配的用法，别凭记忆猜子命令。

## next-cache-components-optimizer：两个诊断循环

针对 `cacheComponents: true` 的项目优化，共享 levers 与 primitives，但两套诊断：

### 页壳循环（Page-render loop / PPR）

长单页的**静态壳**——在 shell-only 渲染上给 Suspense fallback 区域排名，让首屏静态部分尽量大。

### 即时导航循环（Nav loop / instant-nav）

用户点 A→B 的链接时，**立即显示 B 的静态布局**（chrome、结构、内容形状的 fallback），而非把 A 的 UI 挂着直到 B 的数据 resolve。捕获 B 在 `pushstate` 后的 suspended 边界、按 `suspended_by[].name` 分类、丢掉 SSR-only 的 client hooks。

> 前置：这个 optimizer 要求 `next-dev-loop` 已为该 session 启动——它开 headed 浏览器、暴露 agent-browser CLI、接好提供 `mcp get_logs` 的 dev MCP server。**workflow 技能之间会链式依赖**。

## adoption 技能

`next-cache-components-adoption` 和 `next-partial-prefetching-adoption` 是**采纳型**工作流——引导你把新特性（cache components、partial prefetching）引入现有项目。它们是「迁移流程」类工作流，正是垂直、用户显式触发的动作。

## 为什么版本随框架

技能住在 `vercel/next.js` 主仓库、随框架版本发布——好处：技能永远与你用的 Next.js 版本匹配，不会像独立 repo 那样滞后或漂移。旧的 `vercel-labs/next-skills` 已迁入主仓库正是为此（"stay version-matched with the framework instead of drifting in a separate repo"）。

## 反模式

| 反模式 | 问题 |
| --- | --- |
| 想要 Next.js 通用知识去装这些技能 | 通用知识在 AGENTS.md + 内置文档，不是技能 |
| 老版本 Next.js 硬用 dev-loop | 硬门槛 16.3+ Turbopack，缺则应先升级 |
| dev-loop 缺 agent-browser 时退化成 grep | 它会停下告知升级，不该退化 |
| 只看编译通过就宣布改动 OK | dev-loop 存在正是因为「编译过≠运行时对」 |
| 手动升级 Next.js 而非用 codemod | 升级用 `npx @next/codemod@latest upgrade` |

## 下一步

- [参考](./reference) —— 4 技能全表 + 硬门槛、安装、旧技能去向、版本要求
- 上游：[Next.js AI Agents 指南](https://nextjs.org/docs/app/guides/ai-agents)
