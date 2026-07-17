---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 TanStack Intent 文档与 `TanStack/router` 官方 skills（v1.166.2）编写。

## 速查

- **消费三步**：`intent install` → 配 `package.json#intent.skills`（`["@tanstack/*"]`）→ `intent load <包>#<技能>`
- **运行器**：npm `npx` · pnpm `pnpm dlx` · Yarn `yarn dlx` · Bun `bunx`，接 `@tanstack/intent@latest <命令>`
- **Router 技能**：`react-router` · `compositions/router-query` · `lifecycle/migrate-from-react-router`
- **Start 技能**：`react-start` · `react-start/server-components` · `lifecycle/migrate-from-nextjs`
- **技能位置**：`TanStack/router` 仓库 `packages/react-router/skills/` 与 `packages/react-start/skills/`
- 全部 MIT，遵 agentskills.io；`library_version` 1.166.2

## skills 清单表

| 分组 | 技能名（`name`） | 类型 | 覆盖 |
| --- | --- | --- | --- |
| Router | `react-router` | framework | React 绑定：`RouterProvider`/`createRouter`/`createFileRoute`、hooks、`Link`/`Outlet`；类型全推断、client-first、类型注册 |
| Router | `compositions/router-query` | composition | 与 TanStack Query 组合：context 里的 `queryClient`、loader `ensureQueryData`、`useSuspenseQuery`、`defaultPreloadStaleTime: 0`、SSR 集成 |
| Router | `lifecycle/migrate-from-react-router` | lifecycle | 从 React Router v7 迁移：路由定义、`to`+`params`、`validateSearch`+`useSearch`、卸载残留 |
| Start | `react-start` | framework | `createServerFn`/`createMiddleware`/`createStart`、`useServerFn`；默认同构、`/server` 导入 |
| Start | `react-start/server-components` | sub-skill | React 19 RSC：`renderServerComponent`、`createCompositeComponent`、Flight 低层 API、缓存/刷新归属 |
| Start | `lifecycle/migrate-from-nextjs` | lifecycle | 从 Next.js App Router 迁移：概念映射、Server Actions→`createServerFn`、去掉 `"use server"` |

> 每个 SKILL.md 的 frontmatter 带 `library` / `library_version` / `sources`（来源文件与 docs 路径）/ `requires`（依赖的基础技能，如 `router-core` / `start-core`），可追溯。

## intent CLI 命令

| 命令 | 用途 |
| --- | --- |
| `intent list` | 扫已安装依赖里带 `skills/` 的包（`--global` / `--global-only` 控制全局包） |
| `intent install` | 写/更新 `intent-skills` 引导块进 `AGENTS.md`/`CLAUDE.md`/`.cursorrules`（`--map` 显式任务映射） |
| `intent hooks install` | 给 Claude Code / Codex 装阻断式生命周期钩子（`--scope` / `--agents`） |
| `intent load <包>#<技能>` | 打印当前安装版本的 SKILL.md（`--path` 输出解析出的文件路径） |
| `intent scaffold` | AI 辅助领域发现、生成技能树、写 SKILL.md（维护者） |
| `intent validate [dir]` | 校验 SKILL.md 格式与打包（`--fix` 修 frontmatter、`--check` CI 只检不写） |
| `intent stale` | 报告技能是否引用了过时源文档/库版本（`--json`） |

## 安装

```bash
# 消费者：写引导块 + 选包 + 加载
npx @tanstack/intent@latest install
# package.json 里配白名单： { "intent": { "skills": ["@tanstack/*"] } }
npx @tanstack/intent@latest list
npx @tanstack/intent@latest load @tanstack/react-start#react-start

# 可选：装阻断钩子（Claude Code / Codex）
npx @tanstack/intent@latest hooks install
```

> pnpm / Yarn / Bun 把 `npx` 换成 `pnpm dlx` / `yarn dlx` / `bunx`。Intent 会检测包管理器并在引导块里写对应运行器。

`intent-skills` 引导块（`install` 生成，节选）：

```markdown
<!-- intent-skills:start -->
## Skill Loading

Before editing files for a substantial task:
- Run `... intent@latest list` to see available local skills.
- If a listed skill matches the task, run `... intent@latest load <package>#<skill>` before changing files.
- Use the loaded SKILL.md guidance while making the change.
<!-- intent-skills:end -->
```

## 版本与许可

- **Intent**：`@tanstack/intent`，仓库 `TanStack/intent`，MIT
- **Router / Start 技能**：随 `@tanstack/react-router` / `@tanstack/react-start` 发布，源在 `TanStack/router` 仓库；本页依据 `library_version` **1.166.2**
- **标准**：遵循开放的 [Agent Skills](https://agentskills.io) 格式
- **官方 vs 社区**：官方走 Intent 随包发布；社区 `tanstack-skills/tanstack-skills`、`DeckardGer/tanstack-agent-skills` 为 UNOFFICIAL，不采用

## 资源链接

- CLI 仓库：[TanStack/intent](https://github.com/TanStack/intent)
- Router + Start + 官方 skills：[TanStack/router](https://github.com/TanStack/router)
- 文档：[TanStack Intent](https://tanstack.com/intent) · [TanStack Router](https://tanstack.com/router) · [TanStack Start](https://tanstack.com/start)
- 标准：[agentskills.io](https://agentskills.io)
- 相关叶：[React Router Skill](../react-router-skill/) · [Vercel Agent Skills](../vercel-agent-skills/) · [Skills CLI 与 find-skills](../skills-cli-find-skills/)
