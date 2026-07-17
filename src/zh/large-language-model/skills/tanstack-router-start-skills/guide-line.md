---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 TanStack Intent 文档与 `TanStack/router` 官方 skills（`react-router` / `react-start` / `router-query` / `server-components` / `migrate-*`，v1.166.2）编写。

## 速查

- **Intent 四动作**：`scaffold`（AI 辅助生成）· `validate`（校验 SKILL.md 格式）· 随 release **发布** · `stale`（源文档变更时报陈旧）
- **消费侧**：`list` 发现 · `install` 写引导块 · `hooks install` 阻断钩子 · `load <包>#<技能>` 加载当前版本
- **Router 技能**：`react-router`（类型全推断、client-first loader）、`compositions/router-query`（Router 协调 + Query 缓存，`defaultPreloadStaleTime: 0`）、`lifecycle/migrate-from-react-router`
- **Start 技能**：`react-start`（默认同构、`createServerFn`、`useServerFn`）、`react-start/server-components`（RSC：`renderServerComponent` / `createCompositeComponent`）、`lifecycle/migrate-from-nextjs`
- **两条铁律**：Router「类型全推断，别 cast」；Start「默认同构，server-only 才 `createServerFn`」
- **反模式**：把 `@tanstack/react-router` 当 `react-router-dom`、loader 里放 DB/密钥、Query+Router 忘设 `defaultPreloadStaleTime: 0`、SSR 用模块级单例 `QueryClient`

## Intent 机制：生成 / 校验 / 随包发布 / 更新同步

Intent 给维护者和消费者各一套工作流，串起来就是「技能的完整生命周期」。

### 维护者侧：把库做成「带技能的包」

```bash
npx @tanstack/intent@latest scaffold    # AI 辅助领域发现、生成技能树、写 SKILL.md
npx @tanstack/intent@latest validate    # 校验 SKILL.md 格式与打包要求（发布前）
npx @tanstack/intent@latest stale       # 源文档/库版本变化时，报告技能是否陈旧
```

- **`scaffold`**：通过交互式访谈引导 agent 做领域发现、生成技能树、撰写技能
- **`validate`**：强制 SKILL.md 的格式规则与打包要求；`--fix` 修可机械迁移的 frontmatter，`--check` 在 CI 里只检不写
- **发布**：技能跟着库代码走**同一条 release 流水线**进 npm 包
- **`stale`**：读仓库根的 `_artifacts/*domain_map.yaml` / `*skill_tree.yaml`，检测技能是否引用了过时的源文档或库版本；monorepo 下还会标出「没有技能覆盖的公开包」

### 消费者侧：发现与加载

- **`list`**：扫当前项目已安装依赖（含 `node_modules`、工作区依赖、Yarn PnP）里带 `skills/` 目录的包
- **`install`**：写/更新 `intent-skills` 引导块进 agent 配置
- **`hooks install`**：给 Claude Code / Codex 装阻断式生命周期钩子，把「改文件前先加载匹配技能」变成硬门禁
- **`load <包>#<技能>`**：打印**当前安装版本**的 SKILL.md 内容

### 信任模型：为什么要白名单

技能是 agent 会照做的指令，所以「谁能贡献技能」是信任决策：

- **发现 ≠ 授权**：Intent 会发现每个带 `skills/` 的已安装包（含传递依赖），但只有 `package.json#intent.skills` 白名单里精确匹配或 `*` 模式命中的包，才真正贡献技能
- **静态发现**：Intent 只把包当**文件**读，**从不 import / require / 执行**被发现包的代码——把一个包加进依赖树，不会因此通过 Intent 跑它的代码
- **信任不传递**：白名单里的包依赖了另一个带技能的包，那个包仍需被单独授权

## Router skills：类型安全的文件式路由

`packages/react-router/skills/` 下的技能，覆盖 `@tanstack/react-router` 的 React 绑定。

### react-router（框架技能）

开篇即钉三条 **CRITICAL**：

- **类型全推断**：Router 类型完全由推断得出，**永远别 cast、别手动注解**推断出来的值
- **client-first**：Router 默认 loader 跑在**客户端**，不是服务端
- **别混淆**：`@tanstack/react-router` 与 Remix 的 `react-router-dom` / `react-router` 是**完全不同的库**，API 不通用

技能覆盖的 API 面：`RouterProvider`、`createRouter`、`createRootRoute`、`createFileRoute`、hooks（`useRouter`、`useRouterState`、`useNavigate`、`useSearch`、`useParams`、`useLoaderData`、`useMatch(es)`、`useLocation`、`useBlocker`…）、组件（`Link`、`Navigate`、`Outlet`、`CatchBoundary`、`ErrorComponent`）。

一个反复强调的**类型注册**步骤——不写它，`Link` / `useNavigate` / `useSearch` 就没有类型安全：

```tsx
const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
```

file-based 路由靠 `@tanstack/router-plugin/vite` 生成 `routeTree.gen.ts`，插件**必须放在 `react()` 之前**。

### compositions/router-query（与 TanStack Query 组合）

这是把 Router 与 TanStack Query 搭起来的组合技能。核心心智模型：**Router 当协调者（导航时触发取数），Query 当缓存（缓存、后台刷新、生命周期）。**

两条 **CRITICAL**：

- **`defaultPreloadStaleTime: 0`**：用 Query 时必须设它。否则 Router 自带的 preload 缓存（默认 30s）会盖过 Query 对新鲜度的控制
- **SSR 下 `QueryClient` 建在 `createRouter` 工厂里**：模块级单例会在服务端**跨请求泄漏数据**

```tsx
export function createAppRouter() {
  const queryClient = new QueryClient() // 每请求一个，防跨请求泄漏
  return createRouter({
    routeTree,
    defaultPreloadStaleTime: 0, // 让 Query 掌控缓存
    context: { queryClient },
  })
}
```

root route 用 `createRootRouteWithContext` 声明 context 含 `queryClient`；loader 里用 `queryClient.ensureQueryData` 预取，组件里用 `useSuspenseQuery` 读；SSR 脱水/注水/流式用 `setupRouterSsrQueryIntegration`。

### lifecycle/migrate-from-react-router

从 React Router v7 迁到 TanStack Router 的**逐步清单**。关键点：

- **`to` + `params`，不是模板字符串路径**：导航永远用 `to: '/posts/$postId'` + `params`，**别**把参数插进 `to` 字符串
- **卸载残留**：UI 迁移后空白、控制台报「cannot use useNavigate outside of context」= React Router 的 import 还在，卸载 `react-router` / `react-router-dom` 让它变成 TS 错误暴露出来
- 路由定义 → `createFileRoute`、`useSearchParams` → `validateSearch` + `useSearch`、`useParams` 加 `from`、`Outlet` 替换、loader 转换

## Start skills：建在 Router 之上的全栈框架

`packages/react-start/skills/` 下的技能，覆盖 `@tanstack/react-start`。

### react-start（框架技能）

开篇 **CRITICAL**：

- **默认同构**：所有代码默认在**服务端和客户端都跑**，loader 两端都执行。server-only 逻辑用 `createServerFn`
- **别当 Next.js/Remix**：API 完全不同
- **类型全推断**：别 cast、别注解

API 面：`@tanstack/react-start` re-export 了 `@tanstack/start-client-core` 的一切（`createServerFn`、`createMiddleware`、`createStart`、`createIsomorphicFn`、`createServerOnlyFn`、`createClientOnlyFn`），外加 React 专属的 **`useServerFn`**——在组件里调用 server function 的 hook。服务端工具（`getRequest`、`setResponseHeader`…）从 `@tanstack/react-start/server` 导入。

server function 的典型形态（`.validator` 校验入参 + `.handler` 处理）：

```tsx
const updatePost = createServerFn({ method: 'POST' })
  .validator((data: { id: string; title: string }) => data)
  .handler(async ({ data }) => {
    await db.posts.update(data.id, { title: data.title })
    return { success: true }
  })
```

### react-start/server-components（RSC 子技能）

针对 React 19 的 RSC。核心心智模型：**把 TanStack Start 的 RSC 当作可 fetch 的 React Flight 载荷，而不是框架拥有的服务端树**；从「数据归属、缓存归属」出发，选最小够用的 RSC 原语。

- **传输/组合原语**：不需要客户端插槽 → `renderServerComponent`；要在服务端标记里插入客户端交互 → `createCompositeComponent` + `<CompositeComponent>`；要自定义 Flight 流 → `renderToReadableStream` / `createFromReadableStream` / `createFromFetch`
- **缓存归属**：路由形状数据 → Router 缓存；独立键空间/后台刷新 → TanStack Query；跨请求复用 → GET `createServerFn` + 缓存头
- **刷新归属**：Router 拥有 → `router.invalidate()`；Query 拥有 → `invalidateQueries` / `refetchQueries`；混合则**两边都显式失效**
- **硬约束**：loader 是同构的，**别在 loader 里直接放 DB 访问、密钥、Node-only API**（真要用浏览器 API 就把该路由设 `ssr: false`）；Query 缓存的 RSC 值要 `structuralSharing: false`；当前校验 API 是 `.validator(...)`

### lifecycle/migrate-from-nextjs

从 Next.js App Router 迁到 TanStack Start 的清单。**方向性差异**是重点：

- **同构 vs server-only**：Start 默认同构（所有代码两端都跑），**与 Next.js「服务端组件默认 server-only」正好相反**
- **`createServerFn`，不是 `"use server"`**：别把 `"use server"` / `"use client"` 指令带过来
- 概念映射：`app/page.tsx` → `src/routes/index.tsx`、`app/layout.tsx` → `src/routes/__root.tsx`、`app/posts/[id]/page.tsx` → `src/routes/posts/$postId.tsx`、Server Actions → `createServerFn()`、`next/link` → `<Link>`、`middleware.ts` → `createMiddleware()`

## 反模式

- **把 `@tanstack/react-router` 当 `react-router-dom` 用**：两库 API 完全不同；混装两套 import 会让 hooks「不在 context 内」报错
- **导航把参数插进 `to` 字符串**：应 `to: '/posts/$postId'` + `params: { postId }`
- **忘了类型注册**：不写 `declare module … interface Register`，`Link` / `useNavigate` 全无类型安全
- **loader 里放 DB/密钥/Node-only API**：loader 同构，会泄漏到客户端；server-only 用 `createServerFn`
- **Query + Router 忘设 `defaultPreloadStaleTime: 0`**：Router 30s preload 缓存会盖过 Query
- **SSR 用模块级单例 `QueryClient`**：跨请求泄漏数据，必须每请求一个
- **RSC 里在服务端 `Children.map` / `cloneElement` / 检查 `children`**：插槽载荷在服务端不透明，改用 render prop
- **采用社区 UNOFFICIAL 技能集**：以官方 Intent 随包发布为准

## 下一步

- [参考](./reference) —— skills 清单表 + `intent` CLI 命令全表 + 安装/版本/许可/链接
- 上游：[TanStack Intent 文档](https://tanstack.com/intent) · [TanStack Router 文档](https://tanstack.com/router) · [TanStack Start 文档](https://tanstack.com/start)
