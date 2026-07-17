---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 remix-run/react-router 官方 Agent Skill（`.agents/skills/react-router`）与已归档的 remix-run/agent-skills（2026-07 读取）编写。

## 速查

- **装（新）**：`npx skills add https://github.com/remix-run/react-router --skill react-router`
- **技能名**：`react-router`（单一技能，识别模式后加载匹配 reference）
- **references（4）**：`framework-mode.md` / `data-mode.md` / `declarative-mode.md` / `rsc.md`
- **文档源**：`node_modules/react-router/docs/`（`index.md` / `start/` / `how-to/` / `explanation/` / `upgrading/`）
- **模式标记**：文档顶部 `[MODES: framework, data, declarative]`，匹配才套用
- **版本门槛**：核心 v7.0.0+；中间件 v7.9.0+（`v8_middleware` flag）
- **许可**：MIT ｜ **官网**：[reactrouter.com](https://reactrouter.com)

## 三模式（+RSC）速查表

| 模式 | 入口 API | 数据能力 | 典型信号 | reference |
| --- | --- | --- | --- | --- |
| Framework | `@react-router/dev` + Vite 插件 | `loader`/`action`/SSR/中间件 | `react-router.config.ts`、`app/routes.ts` | `framework-mode.md` |
| Data | `createBrowserRouter` + `<RouterProvider>` | `loader`/`action`/pending UI（无 Vite 插件） | `createBrowserRouter`、路由对象 | `data-mode.md` |
| Declarative | `<BrowserRouter>` + `<Routes>`/`<Route>` | 无（仅路由 + 读 URL） | `<BrowserRouter>`、`element={...}` | `declarative-mode.md` |
| unstable RSC | `unstable_reactRouterRSC` + `@vitejs/plugin-rsc` | RSC Framework / RSC Data 两变体 | `entry.rsc`、`ServerComponent` | `framework-mode.md`/`data-mode.md` + `rsc.md` |

## 安装命令

```bash
# 新版（主仓库，推荐）
npx skills add https://github.com/remix-run/react-router --skill react-router

# 旧版（独立仓库，已归档 —— 仅作了解）
npx skills add remix-run/agent-skills
npx skills add remix-run/agent-skills --skill react-router-framework-mode
npx skills add remix-run/agent-skills --skill react-router-data-mode
npx skills add remix-run/agent-skills --skill react-router-declarative-mode
```

`create-react-router` 新建项目时可默认带上 `react-router` 技能（官方在迁移说明里预告的 CLI 集成）。

## `references/` 组织（新版单一技能）

```txt
.agents/skills/react-router/
├── SKILL.md                       # 入口：识别模式 + 引导读 node_modules 文档
└── references/
    ├── framework-mode.md          # 框架模式（含 RSC Framework 基础行为）
    ├── data-mode.md               # 数据模式（含 RSC Data 基础行为）
    ├── declarative-mode.md        # 声明式模式
    └── rsc.md                     # 任意 unstable RSC 应用
```

旧版（已归档 `remix-run/agent-skills`）是三个独立技能目录，各自带更细的 `references/`（framework 模式有 `routing.md`/`route-modules.md`/`data-loading.md`/`actions.md`/`navigation.md`/`pending-ui.md`/`error-handling.md`/`rendering-strategies.md`/`middleware.md`/`sessions.md`/`special-files.md`/`type-safety.md` 等）。新版把这些细节让位给 `node_modules` 文档。

## `node_modules` 文档路径

```txt
node_modules/react-router/docs/
├── index.md
├── start/            # 各模式起步（routing / data-loading / actions / route-module / rendering …）
├── how-to/           # spa.md / pre-rendering.md / react-server-components.md / route-module-type-safety.md …
├── explanation/
└── upgrading/        # future.md 及各版本升级
```

- skill 引用 `react-router/docs/...` → 读 `node_modules/react-router/docs/` 下同名文件
- 无本地 docs 时：仓库内工作回退仓库 `docs/`；消费方应用回退**版本匹配**的官网文档

## 版本兼容

| 特性 | 最低版本 | 备注 |
| --- | --- | --- |
| 核心框架特性（`loader`/`action`/`Form` 等） | 7.0.0+ | 框架 / 数据模式基础 |
| 中间件（middleware） | 7.9.0+ | 需 `v8_middleware` flag |
| RSC（React Server Components） | unstable | `unstable_` 前缀，API 可能变 |

**实现前先核对已装版本**：`npm list react-router`。

## 常用 API 速查

| 类别 | API |
| --- | --- |
| 路由配置（框架） | `route` / `index` / `layout` / `prefix`（`@react-router/dev/routes`） |
| 路由构造（数据） | `createBrowserRouter` / `createHashRouter` / `createMemoryRouter` / `createStaticRouter` |
| 声明式 | `BrowserRouter` / `Routes` / `Route` / `Outlet` |
| 导航 | `Link` / `NavLink` / `Form` / `redirect` / `useNavigate` |
| 数据 | `loader` / `clientLoader` / `action` / `clientAction` / `useLoaderData` |
| 变更 / 状态 | `useFetcher` / `useSubmit` / `useNavigation` |
| URL | `useParams` / `useSearchParams` / `useLocation` |
| 路由模块导出 | `loader` / `action` / `ErrorBoundary` / `meta`（用 `loaderData`）/ `links` / `headers` |
| 配置 | `react-router.config.ts`（`ssr` / `prerender` / `basename` / `buildDirectory`） |

## 许可与链接

- **许可**：MIT
- **仓库（新）**：[remix-run/react-router · .agents/skills/react-router](https://github.com/remix-run/react-router/tree/main/.agents/skills/react-router)
- **仓库（旧，已归档）**：[remix-run/agent-skills](https://github.com/remix-run/agent-skills)
- **官网 / 文档**：[reactrouter.com](https://reactrouter.com) · [reactrouter.com/docs](https://reactrouter.com/docs)
- **迁移说明**：[discussion #15099](https://github.com/remix-run/react-router/discussions/15099)
- **相关叶**：TanStack Router & Start Skills · Redux Toolkit Skills
