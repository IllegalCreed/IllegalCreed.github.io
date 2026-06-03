---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **TanStack Query v5**（原 React Query；`@tanstack/react-query` / `@tanstack/vue-query` 等；官网 [tanstack.com/query](https://tanstack.com/query/latest)）。

## 速查

- 定位：**服务端状态管理**（获取/缓存/同步/更新），区别于 Redux/Pinia 的客户端状态
- 安装：`npm i @tanstack/react-query`（Vue：`@tanstack/vue-query`）
- 初始化：`new QueryClient()` + `<QueryClientProvider client>`（Vue：`app.use(VueQueryPlugin)`）
- 读：`useQuery({ queryKey, queryFn })`；写：`useMutation({ mutationFn })`；无限：`useInfiniteQuery`
- 状态：`status`（pending/error/success，关于数据）+ `fetchStatus`（fetching/paused/idle，关于请求）
- 默认：`staleTime: 0`（立即 stale）、聚焦/重连/挂载自动刷新、重试 3 次、`gcTime` 5 分钟
- **v5 改名**：`cacheTime`→`gcTime`、`isLoading`→`isPending`、`keepPreviousData`→`placeholderData`、单对象签名
- vs SWR：功能更全（mutation/infinite/devtools/SSR）但更重

## TanStack Query 是什么

TanStack Query（原 React Query）是 **Tanner Linsley** 维护的**服务端状态管理库**，一句话定位：「**Web 应用缺失的数据请求库**」。

```tsx
import { useQuery } from '@tanstack/react-query'

const { data, isPending, error } = useQuery({
  queryKey: ['todos'],
  queryFn: () => fetch('/api/todos').then((r) => r.json()),
})
```

理解 TanStack Query 的**核心定位**：

- **管服务端状态**：远端的、异步的、可能被他人改动、会过期的数据——**不是** Redux/Pinia 管的客户端 UI 状态（两者配合用）
- **缓存 + 同步 + 失效**：自动缓存、后台刷新（SWR）、按 `queryKey` 失效
- **框架无关**：React/Vue/Solid/Svelte/Angular 同一套心智
- **激进默认**：开箱即「stale-while-revalidate」

### 与 SWR / ahooks / Redux 的区别

| 维度 | TanStack Query | SWR | ahooks useRequest | Redux/Pinia |
|---|---|---|---|---|
| 管什么 | **服务端状态** | 服务端状态 | 服务端状态（轻） | **客户端状态** |
| 框架 | 多框架 | React（+ 移植） | React/Vue(VueHooks Plus) | 多框架 |
| 能力 | **最全（失效/乐观/infinite/SSR/devtools）** | 轻量 | 轻量企业级 | 通用状态容器 |
| 适合 | 数据密集中大型应用 | 简单数据请求 | 中后台快速请求 | 复杂前端状态 |

**含义**：服务端数据用 TanStack Query / SWR / ahooks（按复杂度选），客户端 UI 状态用 Redux/Pinia/Zustand——**它们正交、常配合**。

## 安装与初始化

### React

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Todos />
    </QueryClientProvider>
  )
}
// 组件内取回 client：const queryClient = useQueryClient()
```

### Vue

```ts
import { VueQueryPlugin } from '@tanstack/vue-query'
app.use(VueQueryPlugin) // 等价于 React 的 QueryClientProvider
// SFC 里：const { isPending, data } = useQuery({ queryKey: ['todos'], queryFn })
```

> Vue 适配里 `useQuery` 返回的是 **ref**（`data` 等需 `.value` 或模板自动解包）。

## 第一个 useQuery

`useQuery` 两个必填：**`queryKey`**（数组，缓存键 + 依赖）+ **`queryFn`**（返回 Promise）：

```tsx
const { data, status, fetchStatus, isPending, isError, error, refetch } = useQuery({
  queryKey: ['todo', id],                  // id 变化自动重新请求
  queryFn: ({ queryKey, signal }) =>       // queryFn 收 QueryFunctionContext
    fetch(`/api/todos/${queryKey[1]}`, { signal }).then((r) => r.json()),
})
```

### status vs fetchStatus（两套正交状态）

```
status（关于数据）:  pending（还没数据） | error | success
fetchStatus（关于请求）: fetching（queryFn 运行中） | paused（想取但暂停，如离线） | idle
```

> 二者正交：`success` 的查询也可能在后台 `fetching`（刷新）；`pending` 的查询离线时是 `paused`。`isLoading` = `isPending && isFetching`（首次硬加载）。

## 激进默认与 staleTime

TanStack Query **默认非常追求新鲜**：

- `staleTime: 0` —— 数据**立即 stale**
- stale 数据在**挂载 / 窗口聚焦 / 网络重连**时自动重新请求
- 失败**默认重试 3 次**（指数退避）
- 不活跃缓存 **5 分钟后回收**（`gcTime`）

```tsx
// 很多团队第一件事：调大 staleTime 减少刷新
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000 } }, // 1 分钟内不重新请求
})
```

> ⚠️ 不调 `staleTime` 默认会很「勤快」地刷新——按数据变化频率设 `staleTime` 是常规优化。

## v5 改名速查（升级必读）

| v4 | v5 |
|---|---|
| `cacheTime` | **`gcTime`**（垃圾回收时间） |
| `status: 'loading'` / `isLoading` | **`status: 'pending'` / `isPending`**（`isLoading` 仍在 = `isPending && isFetching`） |
| `keepPreviousData: true` | **`placeholderData: keepPreviousData`**（导入 identity 函数） |
| 多种位置参数签名 | **统一单对象签名** `useQuery({ queryKey, queryFn })` |
| `useErrorBoundary` | **`throwOnError`** |
| `useQuery` 的 `onSuccess`/`onError`/`onSettled` | **移除**（仅 `useMutation` 保留） |
| `useInfiniteQuery` | 新增**必填 `initialPageParam`** |

## 下一步

- [指南](./guide-line.md)：**Queries**（全选项 / 状态模型 / 依赖式 queryKey / `select` / `enabled` 条件查询） / **Mutations**（`mutate` vs `mutateAsync` / 回调 / **乐观更新四步**） / **缓存失效**（`invalidateQueries` 前缀匹配 vs `setQueryData`/`getQueryData` 精确键 / `staleTime` vs `gcTime`） / **进阶**（`useInfiniteQuery` / `queryOptions` / `useSuspenseQuery` / SSR `dehydrate`+`HydrationBoundary` / Devtools） / **常见坑**
