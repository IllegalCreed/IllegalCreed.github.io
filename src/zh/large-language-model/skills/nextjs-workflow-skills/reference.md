---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 vercel/next.js（canary/skills）SKILL.md 与迁移公告编写。

## 速查

- **装**：`npx skills add vercel/next.js`（`--skill <name>` 指定）
- **4 技能**：next-dev-loop / next-cache-components-adoption / next-cache-components-optimizer / next-partial-prefetching-adoption
- **源**：`vercel/next.js/skills`（框架主仓库，版本随框架）
- **硬门槛**：Next.js 16.3+ Turbopack + agent-browser≥0.31.1（dev-loop/optimizer）
- **升级**：`npx @next/codemod@latest upgrade`（非技能）
- **老版本取文档**：`npx @next/codemod@canary agents-md`（拉 bundled docs 到 `.next-docs/`）

## 4 个 workflow 技能

| 技能 | 用途 | 前置 |
| --- | --- | --- |
| `next-dev-loop` | 改后验证运行时（`/_next/mcp` + agent-browser 双视角） | Next.js 16.3+ Turbopack、agent-browser≥0.31.1、running `next dev` |
| `next-cache-components-adoption` | 采纳 cacheComponents | — |
| `next-cache-components-optimizer` | 优化 cacheComponents（PPR 页壳 + 即时导航双循环） | `next-dev-loop` 已为 session 启动 |
| `next-partial-prefetching-adoption` | 采纳部分预取 | — |

## Skills vs AGENTS.md 分工

| 类型 | 交付 |
| --- | --- |
| 横向参考知识（best-practices/通用指南） | AGENTS.md + 内置文档（16.3+ `next dev` 自动生成，无需安装） |
| 垂直工作流（显式触发的动作） | Skills（`npx skills add vercel/next.js`） |

> Vercel eval：横向知识 AGENTS.md 优于 skills（全量前置、零假阴性）；垂直工作流留作技能。

## 旧技能去向

| 旧 | 现 |
| --- | --- |
| `next-best-practices` | 不再是技能 → 内置文档 + 自动生成 AGENTS.md/CLAUDE.md |
| `next-upgrade` | 不再是技能 → `npx @next/codemod@latest upgrade` |
| `next-cache-components` | 拆成 `next-cache-components-optimizer` + `next-cache-components-adoption` |
| 旧仓库 `vercel-labs/next-skills` | 迁入主仓库 `vercel/next.js/skills`（版本随框架） |

## dev-loop 双视角

| 视角 | 端点/工具 | 知道 |
| --- | --- | --- |
| Next.js 视角 | `/_next/mcp`（HTTP，`tools/list` 看当前面） | 路由、段、RSC、server actions、server 日志、错误 |
| 浏览器视角 | agent-browser（真 Chrome，`agent-browser skills get core` 取用法） | DOM、console、network、React fiber、vitals |

## optimizer 双循环

| 循环 | 目标 |
| --- | --- |
| Page-render（PPR，`ppr-loop.md`） | 长单页静态壳；shell-only 渲染排名 Suspense fallback |
| Nav（`instant-nav-loop.md`） | 点链接立即显 B 静态布局；捕 pushstate 后 suspended 边界、按 `suspended_by[].name` 分类 |

## Next.js 16.1 或更早

自动生成的 AGENTS.md/CLAUDE.md 要 16.3+。老版本仍可拉版本匹配文档：

```bash
npx @next/codemod@canary agents-md   # 下载 bundled docs 到 .next-docs/，指 AGENTS.md 至其
```

见 [Next.js AI Agents 指南](https://nextjs.org/docs/app/guides/ai-agents)。

## 资源链接

- 源目录：[vercel/next.js/tree/canary/skills](https://github.com/vercel/next.js/tree/canary/skills)
- AI Agents 指南：[nextjs.org/docs/app/guides/ai-agents](https://nextjs.org/docs/app/guides/ai-agents)
- Vercel eval：[AGENTS.md outperforms skills](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals)
- 相关叶：[Vercel Agent Skills](../vercel-agent-skills/)（平台层部署/优化）
