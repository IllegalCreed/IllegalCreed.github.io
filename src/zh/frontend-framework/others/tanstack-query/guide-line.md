---
layout: doc
outline: [2, 3]
---

# 指南

> 本篇深入 TanStack Query v5 的 Queries / Mutations / 缓存失效 / 进阶，并汇总常见坑。以 React 适配为主，标注 Vue 差异。

## Queries（useQuery）

```tsx
const result = useQuery({
  queryKey: ['todos', filters],   // 必填：数组，缓存键 + 依赖（变化自动重取）
  queryFn: ({ queryKey, signal }) => fetchTodos(queryKey[1], signal), // 必填：返回 Promise
  // ...options
})
```

### 常用选项（v5）

| 选项 | 默认 | 说明 |
|---|---|---|
| `enabled` | `true` | `false` 禁用自动执行（条件查询：等依赖就绪） |
| `staleTime` | `0` | 新鲜期——期内不重新请求 |
| `gcTime` | `5min` | 不活跃缓存回收时间（v5 由 `cacheTime` 改名） |
| `refetchOnWindowFocus` / `refetchOnMount` / `refetchOnReconnect` | `true` | 聚焦/挂载/重连是否重取 |
| `retry` | `3`（客户端） | 失败重试次数 |
| `select` | — | 派生/转换 `data`（只在源数据变时重算） |
| `placeholderData` | — | 占位数据，**不写入缓存**（`keepPreviousData` 用它实现） |
| `initialData` | — | 初始数据，**写入缓存** |
| `structuralSharing` | `true` | 结构共享，数据没变则引用不变 |

### 返回值与状态模型

```
status（数据）: pending | error | success    →  isPending / isError / isSuccess
fetchStatus（请求）: fetching | paused | idle  →  isFetching
isLoading = isPending && isFetching（首次硬加载）
```

返回还有 `data` / `error` / `dataUpdatedAt` / `isStale` / `isPlaceholderData` / `refetch`。

> **依赖式查询**：`enabled: !!userId` 等用户 ID 就绪再查；`queryKey` 含变量即「依赖数组」，变化自动重取。

## Mutations（useMutation）

```tsx
const { mutate, mutateAsync, isPending, data, reset } = useMutation({
  mutationFn: (newTodo) => fetch('/api/todos', { method: 'POST', body: JSON.stringify(newTodo) }),
  onMutate: async (vars) => { /* 乐观更新前，可返回 context 用于回滚 */ },
  onSuccess: (data, vars, context) => {},
  onError: (err, vars, context) => {},   // 用 context 回滚
  onSettled: () => {},                    // 总会执行
})

mutate(newTodo)                  // 即发即弃，返回 void
await mutateAsync(newTodo)       // 返回 Promise，需 try/catch
```

> ⚠️ `mutate` **不返回 Promise**（`await mutate()` 立即得 `undefined`）；要等结果/拿异常用 `mutateAsync`（必须 try/catch，否则未处理 rejection）。**Mutation 不缓存**、**默认不重试**（`retry: 0`）。

### 乐观更新四步（v5 经典范式）

```tsx
useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] })   // 1. 取消在途请求防覆盖
    const prev = queryClient.getQueryData(['todos'])            // 2. 存快照
    queryClient.setQueryData(['todos'], (old) => [...old, newTodo]) // 3. 乐观写入
    return { prev }                                             // 返回 context
  },
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(['todos'], context.prev)           // 4a. 出错回滚
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })      // 4b. 最终重新校准
  },
})
```

## 缓存失效与 QueryClient 操作

| 方法 | 匹配 | 说明 |
|---|---|---|
| `invalidateQueries({ queryKey })` | **前缀模糊**（默认） | 标记 stale + 重新请求活跃查询；`['todos']` 匹配 `['todos', 1]` |
| `setQueryData(queryKey, updater)` | **精确键** | 直接写缓存（乐观更新） |
| `getQueryData(queryKey)` | **精确键** | 同步读缓存 |
| `refetchQueries(filters)` | 过滤器 | 无视新鲜度强制重取 |
| `removeQueries(filters)` | 过滤器 | 删除缓存条目 |
| `cancelQueries({ queryKey })` | 过滤器 | 中止在途请求（配 `signal`） |
| `prefetchQuery({ queryKey, queryFn })` | — | 预取暖缓存（返回 `Promise<void>`，不返回数据） |

```tsx
// 一行让相关查询全失效重取（前缀匹配）
queryClient.invalidateQueries({ queryKey: ['todos'] })
// 精确匹配
queryClient.invalidateQueries({ queryKey: ['todos'], exact: true })
// 自定义匹配
queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'todos' })
```

> ⚠️ **两套匹配规则别混**：`invalidateQueries` / `refetchQueries` 默认**前缀模糊**匹配；而 `setQueryData` / `getQueryData` 用**精确键**（传部分键不匹配子查询）。`queryKey` 是**确定性哈希**——对象 key 顺序无所谓，但数组顺序有所谓。

### staleTime vs gcTime

- **`staleTime`**（默认 0）：控制数据**何时变 stale**——stale 才会在挂载/聚焦/重连时重取
- **`gcTime`**（默认 5min，原 `cacheTime`）：控制**不活跃（无组件使用）的缓存何时被回收**

> 二者独立：`staleTime` 管「是否重新请求」，`gcTime` 管「何时丢弃缓存」。

## 进阶

### useInfiniteQuery（无限滚动）

```tsx
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['projects'],
  queryFn: ({ pageParam }) => fetchPage(pageParam),
  initialPageParam: 0,                                  // ⚠️ v5 必填
  getNextPageParam: (lastPage, allPages) => lastPage.nextCursor, // 返回 undefined 表示没有下一页
})
// data.pages（每页数组）/ data.pageParams
```

### 其它进阶

- **`queryOptions()` 工厂**（v5）：集中复用查询配置，类型安全，可传给 `useQuery` / `prefetchQuery` / `setQueryData`
- **`useSuspenseQuery`**：配 React `<Suspense>`，`data` **保证有值**（不会 undefined），无 `isPending`
- **预取**：`queryClient.prefetchQuery({ queryKey, queryFn })`（返回 `Promise<void>`，错误不抛）
- **SSR / 水合**：`dehydrate(queryClient)` 序列化缓存 + `<HydrationBoundary state={dehydratedState}>`（Next.js）
- **Devtools**：`@tanstack/react-query-devtools` 的 `<ReactQueryDevtools />`
- **持久化**：`persistQueryClient({ queryClient, persister, maxAge })`
- **Vue 差异**：`useQuery` 返回 ref；用 `VueQueryPlugin` 初始化

## 常见坑

- **v5 改名**：`cacheTime→gcTime`、`isLoading→isPending`（status `'loading'→'pending'`）、`keepPreviousData→placeholderData`、单对象签名、`useQuery` 移除 `onSuccess`/`onError`/`onSettled`
- **默认太激进**：`staleTime: 0` + 聚焦自动刷新 → 频繁请求；按需设全局/单查询 `staleTime`
- **两套 key 匹配**：`invalidateQueries` 前缀模糊 vs `setQueryData`/`getQueryData` 精确键
- **`mutate` 非 Promise**：`await mutate()` 立即得 undefined；要结果用 `mutateAsync` + try/catch
- **mutation 不缓存、默认不重试**：与 query 不同（query 默认重试 3）
- **`useInfiniteQuery` 必填 `initialPageParam`**（v5）；`getNextPageParam` 返回 `undefined` 表示无下一页
- **`status` vs `fetchStatus`**：前者关于数据、后者关于请求，正交——`success` 也能在后台 `fetching`
- **只管服务端状态**：客户端 UI 状态用 Zustand/Pinia，别硬塞进 Query
- **`prefetchQuery` 不返回数据**：返回 `Promise<void>`，数据进缓存供后续 `useQuery` 读
