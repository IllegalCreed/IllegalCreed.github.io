---
layout: doc
---

# TanStack Query

**Web 应用「缺失的数据请求库」（The missing data-fetching library for web applications）**——更准确地说，是一个专注于**服务端状态（server state）**的「**获取 / 缓存 / 同步 / 更新**」库，由 **Tanner Linsley 与 TanStack 团队**维护（原名 **React Query**，现为 TanStack 生态一员，与 TanStack Router/Table/Start 并列），**当前 v5**。**核心定位认知**：它管的是**服务端状态**——「**存在远端、你不拥有、需异步获取、可能被他人改动、会过期（stale）**」的数据，**与 Redux / Pinia / Zustand 管理的客户端状态正交**（两者常配合：服务端数据用 TanStack Query、纯前端 UI 状态用 Zustand/Pinia）。**框架无关**，一线适配：`@tanstack/react-query`、`@tanstack/vue-query`、`@tanstack/solid-query`、`@tanstack/svelte-query`、`@tanstack/angular-query-experimental`。**核心架构**：创建一个 `QueryClient` 并通过 `QueryClientProvider`（React）/ `app.use(VueQueryPlugin)`（Vue）提供，组件里用 `useQuery`（读）/ `useMutation`（写）/ `useInfiniteQuery`（无限滚动），`useQueryClient()` 取回 client。**`useQuery` 两个必填**：`queryKey`（数组，**既是缓存键又是依赖**，变化自动重新请求）+ `queryFn`（返回 Promise 的请求函数）；返回 `data` / `error` / **`status`（pending/error/success，描述「数据」）** 与 **`fetchStatus`（fetching/paused/idle，描述「请求函数」）** 两套正交状态。**激进的新鲜度默认**：缓存数据**默认立即 stale**（`staleTime: 0`）、**挂载/窗口聚焦/网络重连时自动重新请求**、失败**默认重试 3 次**（指数退避）、不活跃缓存 **5 分钟后回收**（`gcTime`）、结果**结构共享**保持引用稳定。**写操作 `useMutation`**：`mutationFn` + `mutate`（即发即弃、不返回 Promise）/ `mutateAsync`（返回 Promise）+ `onMutate`/`onSuccess`/`onError`/`onSettled` 回调，**mutation 不缓存**、**默认不重试**；乐观更新经典四步（`onMutate` 里 `cancelQueries` + `setQueryData` 存上下文 → `onError` 回滚 → `onSettled` `invalidateQueries`）。**缓存操作**（`QueryClient`）：`invalidateQueries`（标记 stale + 重新请求，**默认前缀模糊匹配**：`['todos']` 匹配 `['todos', 1]`）、`setQueryData`/`getQueryData`（**精确键**，乐观更新读写）、`refetchQueries`、`removeQueries`、`prefetchQuery`。**v5 重大改名（务必记牢）**：`cacheTime`→**`gcTime`**、`isLoading`→**`isPending`**（status `'loading'`→`'pending'`）、`keepPreviousData`→**`placeholderData`**、**全部改单对象签名**、`useErrorBoundary`→`throwOnError`、`onSuccess`/`onError`/`onSettled` **从 `useQuery` 移除**（仅 `useMutation` 保留）、`useInfiniteQuery` 新增必填 `initialPageParam`。**与 SWR 的区别**：TanStack Query 功能更全（mutation、infinite、devtools、SSR hydration、持久化），SWR 更轻。**典型用户群**：**任何以服务端数据为中心的中大型应用**——尤其需要精细缓存失效、乐观更新、无限滚动、SSR 水合的项目。

## 评价

**优点**

- **服务端状态的完整方案**：获取/缓存/同步/更新/失效/重试/去重一站式，**消灭手写 `useEffect + loading/error + 缓存`** 的样板
- **激进而合理的默认**：开箱即「stale-while-revalidate」——聚焦/重连/挂载自动刷新、失败重试、后台静默更新，数据天然保持新鲜
- **强大的缓存失效**：`queryKey` 前缀模糊匹配 + `invalidateQueries`，**一行让相关查询全部失效重取**；`setQueryData` 直接写缓存做乐观更新
- **多框架一线适配**：React/Vue/Solid/Svelte/Angular 同一套心智，团队跨栈复用
- **乐观更新范式成熟**：`onMutate` + `cancelQueries` + `setQueryData` + 回滚 + `invalidateQueries` 的标准四步
- **无限滚动/分页内建**：`useInfiniteQuery` 的 `getNextPageParam` / `fetchNextPage` / `hasNextPage`
- **一流的 Devtools**：`@tanstack/react-query-devtools` 可视化每个查询的状态/缓存/刷新
- **SSR / Suspense / 持久化**：`dehydrate` + `HydrationBoundary` 做 SSR 水合、`useSuspenseQuery`、`persistQueryClient`
- **类型安全**：v5 的 `queryOptions` 工厂复用查询配置 + 完整 TS 推导

**缺点**

- **概念门槛**：`staleTime` vs `gcTime`、`status` vs `fetchStatus`、`queryKey` 模糊匹配、乐观更新四步——**新人需要时间消化**
- **只管服务端状态**：纯客户端 UI 状态（弹窗开关、表单草稿）仍需 Zustand/Pinia/`useState`——**不是万能状态库**
- **v5 破坏性改名多**：`cacheTime→gcTime` / `isLoading→isPending` / 单对象签名 / `keepPreviousData→placeholderData` / `useQuery` 移除 `onSuccess` 等——**从 v4 升级要逐项改**
- **默认太激进可能意外刷新**：`staleTime: 0` + 聚焦自动刷新，**不调 `staleTime` 会频繁请求**——很多团队第一件事就是设全局 `staleTime`
- **`queryKey` 设计是关键也是坑**：模糊匹配（`invalidateQueries`）是前缀，而 `setQueryData`/`getQueryData` 是**精确键**——两套匹配规则易混
- **`mutate` 不返回 Promise**：`await mutate()` 立即 resolve `undefined`，要拿结果/等待用 `mutateAsync`（且需 try/catch）
- **体积比 SWR 大**：只要简单请求 + 轻缓存，SWR 更小巧
- **vs ahooks useRequest**：ahooks 更轻量、一库覆盖；TanStack Query 在「缓存失效策略 + Devtools + 生态」上更专业，大型数据密集应用更合适

## 文档地址

[TanStack Query 官网](https://tanstack.com/query/latest) | [概述](https://tanstack.com/query/latest/docs/framework/react/overview) | [Queries 指南](https://tanstack.com/query/latest/docs/framework/react/guides/queries) | [Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations) | [缓存失效](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation) | [v5 迁移](https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5)

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=tanstack-query" target="_blank" rel="noopener noreferrer">TanStack Query 测试题</a>


## GitHub 地址

[TanStack/query](https://github.com/TanStack/query)（主仓库，MIT 许可）| [Tanner Linsley](https://github.com/tannerlinsley)（作者）| [@tanstack/vue-query](https://tanstack.com/query/latest/docs/framework/vue/overview)（Vue 适配）

## 学习路径

- [入门](./getting-started.md)：TanStack Query 是什么（服务端状态 vs 客户端状态，对比 SWR / ahooks / Redux） / 多框架适配 / 安装 + `QueryClient` + `QueryClientProvider` / `VueQueryPlugin` / 第一个 `useQuery`（`queryKey` + `queryFn`、`status` vs `fetchStatus`） / 激进默认与 `staleTime` / **v5 改名速查**（`gcTime` / `isPending` / 单对象签名）
- [指南](./guide-line.md)：**Queries**（`useQuery` 全选项 `enabled`·`staleTime`·`gcTime`·`select`·`placeholderData`·`initialData` / 状态模型 / 依赖式 queryKey） / **Mutations**（`useMutation` / `mutate` vs `mutateAsync` / 回调 / **乐观更新四步**） / **缓存失效**（`invalidateQueries` 前缀模糊匹配 vs `setQueryData`/`getQueryData` 精确键 / `refetchQueries` / `removeQueries` / `prefetchQuery` / `queryKey` 确定性哈希 / `staleTime` vs `gcTime`） / **进阶**（`useInfiniteQuery` 的 `initialPageParam`+`getNextPageParam` / `queryOptions` 工厂 / `useSuspenseQuery` / SSR `dehydrate`+`HydrationBoundary` / Devtools / 持久化 / Vue Query 差异） / **常见坑**（v5 改名、默认太激进、两套 key 匹配、`mutate` 非 Promise）
