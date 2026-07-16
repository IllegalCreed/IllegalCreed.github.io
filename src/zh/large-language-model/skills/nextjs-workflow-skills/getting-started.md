---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 vercel/next.js（canary/skills）与旧 vercel-labs/next-skills 迁移公告编写。

## 速查

- **装**：`npx skills add vercel/next.js`（或指定 `--skill next-cache-components-optimizer`）
- **4 个 workflow 技能**：`next-cache-components-adoption` · `next-cache-components-optimizer` · `next-dev-loop` · `next-partial-prefetching-adoption`
- **源在框架主仓库** `vercel/next.js/skills`，**版本随框架同步**
- **核心分工**：横向参考知识 → AGENTS.md + 内置文档（16.3+ 自动生成）；垂直工作流 → skills
- **dev-loop**：改后验证运行时——`/_next/mcp`（Next.js 视角）+ agent-browser（浏览器视角）双视角交叉核
- **硬门槛**：dev-loop/optimizer 要 Next.js 16.3+ Turbopack + agent-browser≥0.31.1
- **升级用 codemod**：`npx @next/codemod@latest upgrade`（不再是技能）

## 安装

```bash
# 当前 Next.js workflow 技能
npx skills add vercel/next.js

# 或指定某个技能
npx skills add vercel/next.js --skill next-cache-components-optimizer
```

技能住在框架主仓库、版本随框架——这样它们始终与你用的 Next.js 版本匹配，不会像独立 repo 那样漂移。

## 关键分工：Skills vs AGENTS.md

Next.js 把 agent 内容按类型拆分——这是一个值得学的工程决策：

| 类型 | 交付方式 |
| --- | --- |
| **横向参考知识**（best-practices、通用指南） | Next.js 16.3+ 内置文档（`next/dist/docs/`）+ `next dev` 自动生成的 `AGENTS.md`/`CLAUDE.md`——**不再是技能，无需安装** |
| **垂直工作流**（用户显式触发的动作） | **技能**——`npx skills add vercel/next.js` |

> 为什么？AGENTS.md 全量前置加载，agent 总会遵守；skills 按需拉取、可能有「假阴性」（该拉时没拉）。所以横向知识放 AGENTS.md（Vercel eval：「AGENTS.md outperforms skills」），垂直工作流留作用户明确触发的技能。

**旧技能去向**：
- `next-best-practices` → 不再是技能，走内置文档 + AGENTS.md
- `next-upgrade` → 不再是技能，用 `npx @next/codemod@latest upgrade`
- `next-cache-components` → 拆成 `next-cache-components-optimizer` + `next-cache-components-adoption` 两个 workflow 技能

## 4 个 workflow 技能

| 技能 | 干什么 |
| --- | --- |
| `next-dev-loop` | 改后验证运行时行为——确认改动真的能跑，不只编译/类型通过 |
| `next-cache-components-adoption` | 采纳 `cacheComponents` |
| `next-cache-components-optimizer` | 优化 cacheComponents 项目——首屏静态壳 + 即时导航 |
| `next-partial-prefetching-adoption` | 采纳部分预取（partial prefetching） |

## dev-loop：双视角验证运行时

`next-dev-loop` 是 `next dev` 期间的 edit/verify 节奏——改一处、确认它在运行的 app 里真的工作（不只是类型或构建通过）。它用**同一个运行 app 的两个视角**交叉核对：

- **`/_next/mcp`**——Next.js 暴露的 HTTP 端点，知道框架专有的东西：路由、段、RSC、server actions、server 日志、错误（Next.js 视角）
- **agent-browser**——驱动真 Chrome 的 CLI，知道框架无关的浏览器事：DOM、console、network、React fiber、vitals

> 两个视角互相印证。**硬门槛**（不是软偏好）：Next.js 16.3+ + Turbopack、agent-browser ≥0.31.1。缺任何一个，它会告诉你怎么升级并**停下**——不退化成 grep 源码或更弱的探测。

## 下一步

- [指南](./guide-line) —— dev-loop 双视角深入、cache-components 优化双循环、Skills/AGENTS.md 决策原理
- [参考](./reference) —— 4 技能全表 + 硬门槛、安装、旧技能去向
