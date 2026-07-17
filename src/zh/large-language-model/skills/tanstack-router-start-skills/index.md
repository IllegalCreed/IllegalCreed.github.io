---
layout: doc
---

# TanStack Router & Start Skills

TanStack Router & Start 的官方 Agent Skills 走的是 **TanStack Intent**（`@tanstack/intent`）这条路——不是把 SKILL.md 放进某个独立技能仓库，而是由库维护者用 Intent CLI **生成、校验并随 npm 包一起发布** SKILL.md。你装 `@tanstack/react-router` / `@tanstack/react-start`，再跑一次 `@tanstack/intent install`，agent 就能发现并按需加载这些技能；库升级时技能随包同步更新，**不会漂移**。技能内容存在主仓库 `TanStack/router` 的 `packages/*/skills/` 里（Router 与 Start 各一组），涵盖类型安全的文件式路由、route loaders、与 TanStack Query 的组合、server functions、SSR/streaming、React Server Components，以及从 React Router / Next.js 迁移的清单。Intent 与 skills 均 MIT 开源，遵循开放的 [Agent Skills](https://agentskills.io) 标准。

## 评价

**优点**

- **随包发布、版本同步**：SKILL.md 跟着库版本一起进 npm 包，`intent load` 打印的永远是**当前安装版本**对应的技能——文档与代码不脱节，杜绝「教的是旧 API」
- **官方一手**：技能内容由 TanStack 维护者从 `packages/react-router/src`、官方 docs 直接沉淀，`sources` 字段标注来源，可追溯
- **两层强约束**：Router 技能开篇即钉「类型全推断、别 cast」「Router 是 client-first，loader 默认跑在客户端」；Start 技能钉「默认同构、server-only 用 `createServerFn`」——把最容易踩的坑写死在最前面
- **静态发现、可信任**：`intent list` 只读包的文件、**从不执行**被发现包的代码；`package.json#intent.skills` 白名单（如 `["@tanstack/*"]`）显式授权哪些包能贡献技能
- **组合与迁移成体系**：`router-query` 讲清「Router 当协调者、Query 当缓存」，`migrate-from-react-router` / `migrate-from-nextjs` 是可勾选的迁移清单
- **跨 agent**：`intent install` 写 `intent-skills` 引导块进 `AGENTS.md` / `CLAUDE.md` / `.cursorrules`，`hooks install` 给 Claude Code / Codex 装阻断式钩子

**缺点 / 边界**

- **需要 Intent 这一层**：不像「一条 `npx skills add`」那么直接——要 `intent install` + 配 `intent.skills` 白名单，agent 才会自动加载
- **React 优先**：Router/Start 技能是 `@tanstack/react-router` / `@tanstack/react-start` 的 React 绑定；Solid/Vue 等其它适配的技能覆盖不同
- **易与 `react-router-dom` 混淆**：技能反复强调 `@tanstack/react-router` **不是** Remix 的 `react-router` / `react-router-dom`，两者 API 完全不同
- **社区版本不采用**：另有 UNOFFICIAL 的 `tanstack-skills/tanstack-skills`、`DeckardGer/tanstack-agent-skills`——本叶只讲**官方 Intent** 路线

## 适用场景

- 用 TanStack Router 建类型安全的文件式路由 React SPA，想让 agent 照官方 loaders/搜索参数/类型推断规范写代码
- 用 TanStack Start 做全栈（server functions、SSR/streaming、RSC），想让 agent 不把它当 Next.js 写
- 把 Router 与 TanStack Query 组合，想避开 `defaultPreloadStaleTime` / per-request `QueryClient` 这类坑
- 从 React Router v7 或 Next.js App Router 迁移，想要可勾选的迁移清单
- 作为库维护者，想把自己的库也做成「随包发布技能」

## 边界

- **不是一个技能，是「Intent 机制 + Router/Start 两组官方技能」**：Intent 是分发工具，技能内容在 `TanStack/router` 仓库里
- **Intent 只发现与加载，不替你判断**：技能是给 agent 的指令，最终代码仍需你把关
- **React 绑定为主**：`react-router` / `react-start` 技能针对 React；其它框架适配各有技能
- **迁移技能是清单不是自动脚本**：`migrate-from-*` 按步骤勾选，非一键改写

## 官方文档

[TanStack Intent 文档](https://tanstack.com/intent) ｜ [TanStack Router 文档](https://tanstack.com/router) ｜ [TanStack Start 文档](https://tanstack.com/start) ｜ [Agent Skills 标准](https://agentskills.io)

## GitHub 地址

[TanStack/intent](https://github.com/TanStack/intent)（CLI，MIT）｜ [TanStack/router](https://github.com/TanStack/router)（Router + Start + 官方 skills，MIT）

## 内容地图

- [入门](./getting-started) —— TanStack Intent 是什么、skills 随包发布、`intent install` 安装、Router vs Start 定位、官方 vs 社区
- [指南](./guide-line) —— Intent 机制（生成/校验/随包发布/更新同步）、Router skills（类型安全路由 · router-query 组合 · 迁移）、Start skills（server functions · RSC · migrate-from-nextjs）、反模式
- [参考](./reference) —— skills 清单表、`intent` CLI 命令全表、安装、版本、许可、链接

## 幻灯片地址

<a href="/SlideStack/tanstack-router-start-skills-slide/" target="_blank">TanStack Router & Start Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=606" target="_blank" rel="noopener noreferrer">TanStack Router & Start Skills 测试题</a>
