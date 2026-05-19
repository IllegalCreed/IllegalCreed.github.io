---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 **Redux Toolkit 2.x + React-Redux 9.x + Redux 5.x**。本文档**只覆盖现代 Redux**——纯 `redux` + `connect` + 手写 reducer + `redux-thunk` 老写法不在讨论范围。包含 State 设计原则、`configureStore` 完整选项、`createSlice` 详解、`createAsyncThunk` 完整模式、RTK Query 数据层、`createListenerMiddleware` 副作用、`createEntityAdapter` normalized CRUD、TypeScript 完整类型、SSR + Next.js、测试与常见踩坑。

## 速查

- **State 设计**：单 store + 多 slice、按 feature 切片、normalized state（用 `createEntityAdapter`）、派生 state 用 `createSelector` 而非存到 state
- **`configureStore`**：`reducer`（slice 或 combineReducers） / `middleware`（`getDefaultMiddleware().concat(custom)`） / `devTools` / `preloadedState` / `enhancers`
- **`createSlice`**：`name` / `initialState` / `reducers`（Immer mutable OK） / `extraReducers`（处理外部 action / thunk 三阶段） / `selectors` / `prepare` callback
- **`createAsyncThunk`**：三阶段（pending / fulfilled / rejected）+ `thunkAPI`（dispatch / getState / rejectWithValue / signal / condition）
- **RTK Query**：`createApi` + `fetchBaseQuery` + `endpoints` builder + 自动生成 hooks + tags 失效 + `setupListeners`（refetch on focus / reconnect）
- **`createListenerMiddleware`**：替代 redux-saga / redux-observable、`startListening` 四种触发方式（type / actionCreator / matcher / predicate）
- **`createEntityAdapter`**：normalized state（`ids` + `entities`）+ 预生成 CRUD（addOne / setMany / updateOne）+ `getSelectors` memoized selector
- **TypeScript**：`useSelector.withTypes<RootState>()` / `useDispatch.withTypes<AppDispatch>()` 创建 typed hooks、`PayloadAction<T>` 严格类型、`createAsyncThunk<Returned, ThunkArg, Config>` 三泛型
- **Provider**：根部 `<Provider store={store}>`、SSR 用 `serverState` prop
- **Next.js**：store-per-request 模式（每次请求新建 store）、`StoreProvider` 客户端组件包裹

## State 设计原则

### 单 store + 多 slice（官方推荐）

Redux 是 **single source of truth** 架构——一个应用**只有一个 store**、用 slice 拆分逻辑：

```ts
// src/app/store.ts
import { configureStore } from '@reduxjs/toolkit'
import counterReducer from '@/features/counter/counterSlice'
import userReducer from '@/features/user/userSlice'
import cartReducer from '@/features/cart/cartSlice'
import { postsApi } from '@/services/postsApi'

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    user: userReducer,
    cart: cartReducer,
    [postsApi.reducerPath]: postsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(postsApi.middleware),
})
```

`state.counter` / `state.user` / `state.cart` / `state.postsApi` 是各 slice 的命名空间——**这是 Redux 与 Zustand 的根本差异**（Zustand 多 store 是多个 hook、Redux 单 store 是命名空间）。

### 按 Feature 切片（Feature-Based 目录）

官方推荐 **feature 维度**组织代码（不是 type 维度）：

```
src/
├── app/
│   ├── store.ts            # configureStore + RootState / AppDispatch
│   └── hooks.ts            # useAppSelector / useAppDispatch
├── features/
│   ├── counter/
│   │   ├── counterSlice.ts # slice 定义
│   │   ├── Counter.tsx     # 组件
│   │   └── counterAPI.ts   # 该 feature 的 API
│   ├── user/
│   │   ├── userSlice.ts
│   │   └── UserProfile.tsx
│   └── cart/
│       ├── cartSlice.ts
│       └── CartView.tsx
├── services/
│   └── postsApi.ts         # 跨 feature 的 RTK Query API
└── main.tsx                # <Provider> 包裹
```

> **不推荐 type 维度**目录：`src/reducers/ src/actions/ src/components/` —— 这是老 Redux 时代的反模式、不利于代码 colocation。

### Normalized State（避免嵌套数据）

**不要** 在 Redux state 里存深度嵌套的数据：

```ts
// ❌ 反模式：深嵌套，难更新
const state = {
  posts: [
    {
      id: 1,
      title: 'Post 1',
      author: { id: 1, name: 'Alice', email: '...' },  // 嵌套
      comments: [{ id: 1, text: '...', user: { ... } }],  // 二层嵌套
    },
  ],
}
```

```ts
// ✅ 推荐：normalized（拍平、用 ID 引用）
const state = {
  posts: {
    ids: [1, 2, 3],
    entities: {
      1: { id: 1, title: 'Post 1', authorId: 1, commentIds: [1, 2] },
      2: { ... },
    },
  },
  users: {
    ids: [1, 2],
    entities: {
      1: { id: 1, name: 'Alice', email: '...' },
      2: { ... },
    },
  },
  comments: {
    ids: [1, 2],
    entities: {
      1: { id: 1, postId: 1, userId: 1, text: '...' },
    },
  },
}
```

用 **`createEntityAdapter`** 一行实现 normalized state—— 详见 [createEntityAdapter](#createentityadapter-normalized-crud)。

### 派生 state 用 Selector 不用 store 字段

派生值（如 `total = items.reduce(...)`、`activeCount = todos.filter(...).length`）**不要**存到 state——用 selector 实时算：

```ts
// ❌ 反模式：派生值存到 state（数据冗余 + 同步麻烦）
const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [], total: 0 },
  reducers: {
    addItem: (state, action) => {
      state.items.push(action.payload)
      state.total = state.items.reduce((s, i) => s + i.price, 0)  // 容易忘 / 漏
    },
  },
})

// ✅ 推荐：派生值用 createSelector 实时算（memoize）
import { createSelector } from '@reduxjs/toolkit'

export const selectCartTotal = createSelector(
  [(state) => state.cart.items],
  (items) => items.reduce((s, i) => s + i.price, 0),
)
```

详见 [Memoized Selectors](#memoized-selectors)。

## `configureStore` 完整选项

`configureStore` 是 RTK 的核心入口——所有选项：

```ts
import { configureStore } from '@reduxjs/toolkit'
import { combineReducers } from '@reduxjs/toolkit'

const rootReducer = combineReducers({
  counter: counterReducer,
  user: userReducer,
})

const store = configureStore({
  // 1. reducer: slice 对象 OR 合并好的 root reducer
  reducer: rootReducer,
  // 等价：reducer: { counter: counterReducer, user: userReducer }

  // 2. middleware: getDefaultMiddleware().concat(custom)
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // immutableCheck: 开发模式检测 state mutation（默认 true）
      immutableCheck: { warnAfter: 32 },  // 检测耗时阈值（ms）

      // serializableCheck: 检测非可序列化数据（默认 true）
      serializableCheck: {
        ignoredActions: ['some/action'],          // 忽略某些 action
        ignoredActionPaths: ['payload.someField'], // 忽略 action 中某些路径
        ignoredPaths: ['some.state.path'],         // 忽略 state 中某些路径
      },

      // thunk: 启用 redux-thunk 中间件（默认 true）
      thunk: {
        extraArgument: { api: myApiClient },     // thunk 中可通过 thunkAPI.extra 访问
      },
    }).concat(loggerMiddleware, customMiddleware),

  // 3. devTools: 启用 Redux DevTools Extension（默认在 process.env.NODE_ENV !== 'production' 时开启）
  devTools: import.meta.env.DEV,
  // 也可以传配置对象：devTools: { name: 'My App', actionsDenylist: ['big/payload'] }

  // 4. preloadedState: 初始 state（用于 SSR hydration / 测试）
  preloadedState: {
    counter: { value: 42 },
  },

  // 5. enhancers: 额外的 store enhancer
  enhancers: (getDefaultEnhancers) =>
    getDefaultEnhancers({ autoBatch: false }).concat(myCustomEnhancer),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

### 默认 Middleware

`getDefaultMiddleware()` 返回的中间件列表（**开发模式**）：

| 中间件 | 作用 | 生产模式 |
|---|---|---|
| `redux-thunk` | 允许 dispatch 函数（thunk） | ✓ 保留 |
| `immutableCheck` | 检测 reducer 内 state mutation | ✗ 关闭 |
| `serializableCheck` | 检测 action / state 非可序列化数据（如 Date / Map） | ✗ 关闭 |
| `actionCreatorCheck` | 检测错误的 action creator 使用方式 | ✗ 关闭 |

### Middleware 添加方式

**正确做法**：用 `.concat()` / `.prepend()`（保留 RTK 的 middleware 类型推导）：

```ts
import { configureStore } from '@reduxjs/toolkit'
import logger from 'redux-logger'
import { rtkQueryApi } from '@/services/rtkQueryApi'

const store = configureStore({
  reducer: { ... },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(rtkQueryApi.middleware)     // 加在尾部
      .prepend(logger),                    // 加在头部
})
```

**错误做法**：用 spread（会丢类型）：

```ts
// ❌ 不推荐：spread 会把 tuple 退化为数组、丢类型
middleware: (getDefaultMiddleware) => [
  ...getDefaultMiddleware(),
  rtkQueryApi.middleware,
]
```

### `preloadedState` 用法

```ts
// SSR 场景：服务端 dispatch 后传给客户端 hydrate
const initialServerState = await fetchInitialState()

const store = configureStore({
  reducer: rootReducer,
  preloadedState: initialServerState,
})
```

> 注意：`preloadedState` 类型必须**完整匹配** `RootState`、否则 TS 报错。

## `createSlice` 详解

`createSlice` 自动生成 action types + action creators + reducer，是现代 Redux 的核心。

### 完整选项

```ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface CounterState {
  value: number
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
}

const initialState: CounterState = {
  value: 0,
  status: 'idle',
}

const counterSlice = createSlice({
  // 1. name: action type 前缀
  name: 'counter',

  // 2. initialState: 初始 state
  initialState,

  // 3. reducers: 同步 action handler（自动生成 action creator）
  reducers: {
    // 无 payload
    incremented: (state) => {
      state.value += 1
    },
    // 带 payload
    incrementedBy: (state, action: PayloadAction<number>) => {
      state.value += action.payload
    },
    // prepare callback：自定义 payload 构造
    incrementedWithMeta: {
      reducer: (state, action: PayloadAction<number, string, { user: string }>) => {
        state.value += action.payload
        console.log('Action by:', action.meta.user)
      },
      prepare: (amount: number, user: string) => ({
        payload: amount,
        meta: { user },
      }),
    },
    // 完全替换 state
    reset: () => initialState,
  },

  // 4. extraReducers: 处理外部 action（thunk / 其他 slice 的 action）
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => { state.status = 'loading' })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded'
      })
      .addMatcher(
        (action) => action.type.endsWith('/rejected'),
        (state) => { state.status = 'failed' },
      )
      .addDefaultCase((state) => { /* 无匹配时 */ })
  },

  // 5. selectors: 内置 selector（slice 内 state 类型自动推导）
  selectors: {
    selectValue: (state) => state.value,
    selectStatus: (state) => state.status,
    selectIsLoading: (state) => state.status === 'loading',
  },
})

// 导出 generated action creators
export const { incremented, incrementedBy, incrementedWithMeta, reset } =
  counterSlice.actions

// 导出 selectors（已自动包装到 RootState 路径）
export const { selectValue, selectStatus, selectIsLoading } =
  counterSlice.selectors

// 导出 reducer
export default counterSlice.reducer
```

### Immer 集成：mutable 写法

`createSlice` 内部用 **Immer**——可以**直接写 mutable 代码**，Immer 自动生成新对象：

```ts
const todosSlice = createSlice({
  name: 'todos',
  initialState: [] as Todo[],
  reducers: {
    // ✅ Immer：直接 push / mutate
    todoAdded: (state, action: PayloadAction<Todo>) => {
      state.push(action.payload)  // 看起来 mutable、实际生成新数组
    },
    // ✅ 嵌套对象 mutable 更新
    todoToggled: (state, action: PayloadAction<string>) => {
      const todo = state.find((t) => t.id === action.payload)
      if (todo) todo.completed = !todo.completed
    },
    // ✅ 删除
    todoRemoved: (state, action: PayloadAction<string>) => {
      const idx = state.findIndex((t) => t.id === action.payload)
      if (idx !== -1) state.splice(idx, 1)
    },
    // ✅ 返回新 state（替代 mutate）
    todosReset: () => [],
  },
})
```

**两种写法都支持**：

```ts
// 方式 1：mutate state（Immer 转换）
todoAdded: (state, action) => {
  state.push(action.payload)
}

// 方式 2：返回新 state（也支持）
todoAdded: (state, action) => {
  return [...state, action.payload]
}
```

> **不要同时 mutate 和 return**——`reducer: (state, action) => { state.x = 1; return newState }` 会报错。

### `PayloadAction` 类型

`PayloadAction&lt;P, T, M, E&gt;` 四个泛型：

- `P`: payload 类型（最常用）
- `T`: action.type 字符串字面量（罕用）
- `M`: meta 类型
- `E`: error 类型

```ts
import { type PayloadAction } from '@reduxjs/toolkit'

// 最常见：只指定 payload 类型
todoAdded: (state, action: PayloadAction<Todo>) => {
  state.push(action.payload)
}

// 带 meta：用 prepare callback
todoAddedWithUser: {
  reducer: (state, action: PayloadAction<Todo, string, { userId: number }>) => {
    state.push({ ...action.payload, userId: action.meta.userId })
  },
  prepare: (todo: Todo, userId: number) => ({
    payload: todo,
    meta: { userId },
  }),
}
```

### `extraReducers` 与 `builder` API

`extraReducers` 处理**外部 action**（来自 thunk / 其他 slice / 第三方）——用 `builder` callback：

```ts
const usersSlice = createSlice({
  name: 'users',
  initialState: { list: [] as User[], status: 'idle' },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // 1. addCase: 匹配具体 action type
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.list = action.payload
      })

      // 2. addMatcher: 匹配 predicate / action creator matcher
      .addMatcher(
        (action) => action.type.endsWith('/rejected'),
        (state) => { state.status = 'failed' },
      )
      .addMatcher(
        isAnyOf(fetchUsers.fulfilled, refreshUsers.fulfilled),
        (state) => { state.lastFetch = Date.now() },
      )

      // 3. addDefaultCase: 没有匹配时的兜底
      .addDefaultCase((state, action) => {
        console.log('Unmatched action:', action.type)
      })
  },
})
```

> **顺序很重要**：`addCase` 必须在 `addMatcher` 之前、`addMatcher` 必须在 `addDefaultCase` 之前。

### `selectors` 选项（v2 新增）

可以直接在 slice 中定义 selector，自动支持 typed state 推导：

```ts
const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: { ... },
  selectors: {
    // state 自动推导为 CounterState（不是 RootState）
    selectValue: (state) => state.value,
    selectDoubled: (state) => state.value * 2,
  },
})

// 自动包装到 RootState.counter 路径下
export const { selectValue, selectDoubled } = counterSlice.selectors
```

```tsx
function Display() {
  const value = useAppSelector(selectValue)        // ✓ 自动从 state.counter 取
  const doubled = useAppSelector(selectDoubled)
  return <p>{value} ({doubled})</p>
}
```

> 如果 slice 注册在不同路径（如 `state.feature.counter`），用 `counterSlice.getSelectors((state) => state.feature.counter)` 自定义。

## `createAsyncThunk` 完整模式

`createAsyncThunk` 自动管理 async 函数的三阶段 action（pending / fulfilled / rejected）。

### 三泛型签名

```ts
createAsyncThunk<Returned, ThunkArg, ThunkAPIConfig>(
  typePrefix: string,
  payloadCreator: (arg, thunkAPI) => Promise<Returned> | Returned,
  options?,
)
```

- `Returned`: payloadCreator 返回值类型
- `ThunkArg`: 调用 thunk 时传入的参数类型
- `ThunkAPIConfig`: thunkAPI 配置（state / dispatch / extra / rejectValue / serializedErrorType / pendingMeta / fulfilledMeta / rejectedMeta）

### 基础用法

```ts
import { createAsyncThunk } from '@reduxjs/toolkit'
import type { RootState, AppDispatch } from '@/app/store'

interface User { id: number; name: string }

// 简单：无参数 / 无自定义 thunkAPI
export const fetchUsers = createAsyncThunk<User[]>(
  'users/fetchAll',
  async () => {
    const res = await fetch('/api/users')
    return res.json() as Promise<User[]>
  },
)

// 带参数
export const fetchUserById = createAsyncThunk<User, number>(
  'users/fetchById',
  async (id) => {
    const res = await fetch(`/api/users/${id}`)
    return res.json() as Promise<User>
  },
)
```

### 完整 thunkAPI

```ts
export const submitForm = createAsyncThunk<
  User,                     // Returned
  { name: string; email: string },  // ThunkArg
  {
    state: RootState        // getState() 类型
    dispatch: AppDispatch   // dispatch 类型
    extra: { api: ApiClient }  // 自定义 extra 参数（在 configureStore 中配）
    rejectValue: { code: string; message: string }  // rejectWithValue payload
  }
>(
  'forms/submit',
  async (formData, thunkAPI) => {
    const {
      dispatch,            // dispatch 函数
      getState,            // 获取当前 state
      extra,               // configureStore 中 thunk.extraArgument 注入
      requestId,           // 本次调用的唯一 ID
      signal,              // AbortSignal（用于取消）
      rejectWithValue,     // 返回自定义 rejected payload
      fulfillWithValue,    // 返回自定义 fulfilled payload + meta
    } = thunkAPI

    // 1. 访问 state
    const token = getState().auth.token

    // 2. 通过 extra 访问 API client
    try {
      const user = await extra.api.users.create(formData, {
        signal,           // 传给 fetch / axios 支持取消
        headers: { Authorization: `Bearer ${token}` },
      })
      return user        // → fulfilled action with payload = user
    } catch (err: any) {
      // 3. 自定义 rejected payload
      return rejectWithValue({
        code: err.code || 'UNKNOWN',
        message: err.message,
      })
    }
  },
  {
    // 4. 选项配置
    condition: (formData, { getState }) => {
      // 返回 false 时取消调用（pending 也不会 dispatch）
      const state = getState() as RootState
      if (state.forms.submitting) return false
    },
    idGenerator: () => crypto.randomUUID(),   // 自定义 requestId
    dispatchConditionRejection: false,         // condition 返回 false 时不 dispatch rejected
  },
)
```

### 在 extraReducers 中处理

```ts
const usersSlice = createSlice({
  name: 'users',
  initialState: {
    list: [] as User[],
    status: 'idle' as 'idle' | 'loading' | 'succeeded' | 'failed',
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.list = action.payload
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed'
        // action.payload 是 rejectWithValue 的值
        // action.error 是 throw 出来的 Error（如果没用 rejectWithValue）
        state.error = action.payload?.message ?? action.error.message ?? 'Unknown'
      })
  },
})
```

### `.unwrap()` 在组件中处理结果

`dispatch(thunk())` 默认**不会 reject**（始终 resolve 为 fulfilled / rejected action 对象）——但 `.unwrap()` 让它**真正抛错**：

```tsx
function CreateUserForm() {
  const dispatch = useAppDispatch()

  const handleSubmit = async (data: FormData) => {
    try {
      // ✅ unwrap：如果 thunk reject，这里会真的 throw
      const user = await dispatch(submitForm(data)).unwrap()
      console.log('Created user:', user)
      navigate(`/users/${user.id}`)
    } catch (err) {
      // err 是 rejectWithValue 的 payload（或原始 Error）
      alert(`Failed: ${err.message}`)
    }
  }

  return <form onSubmit={...}>...</form>
}
```

### `condition` 防重复请求

```ts
export const fetchUserById = createAsyncThunk<User, number, { state: RootState }>(
  'users/fetchById',
  async (id) => (await fetch(`/api/users/${id}`)).json(),
  {
    condition: (id, { getState }) => {
      const state = getState()
      const existing = state.users.list.find((u) => u.id === id)
      if (existing) {
        // 已存在 → 取消请求
        return false
      }
    },
  },
)
```

### 取消请求（AbortSignal）

```ts
const fetchPosts = createAsyncThunk(
  'posts/fetch',
  async (_, thunkAPI) => {
    const res = await fetch('/api/posts', { signal: thunkAPI.signal })
    return res.json()
  },
)

// 组件中取消
function PostList() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const promise = dispatch(fetchPosts())
    return () => {
      promise.abort()    // unmount 时取消
    }
  }, [dispatch])
}
```

## RTK Query 推荐数据获取方案

**RTK Query 是现代 Redux 的数据层**——它替代 `useEffect + fetch + setState` / `createAsyncThunk + extraReducers` 模式，自动管理：

- 数据获取 / 缓存 / 失效 / 重新获取
- Loading / Error / Success 状态
- 并发请求去重
- 后台 refetch（focus / reconnect）
- Optimistic update

### `createApi` 完整选项

```ts
// src/services/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '@/app/store'

interface Post {
  id: number
  title: string
  body: string
  userId: number
}

interface PostQueryArgs {
  page?: number
  limit?: number
}

export const api = createApi({
  // 1. reducerPath: 在 store 中的命名空间（默认 'api'）
  reducerPath: 'api',

  // 2. baseQuery: 请求基础配置
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    // 自动加 Authorization header
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),

  // 3. tagTypes: 缓存失效标签（详见下文）
  tagTypes: ['Post', 'User', 'Comment'],

  // 4. keepUnusedDataFor: 没组件使用时保留缓存的时间（秒，默认 60）
  keepUnusedDataFor: 60,

  // 5. refetchOnMountOrArgChange: 组件挂载时 / 参数变化时是否 refetch
  refetchOnMountOrArgChange: false,

  // 6. refetchOnFocus: 窗口聚焦时是否 refetch（需配合 setupListeners）
  refetchOnFocus: false,

  // 7. refetchOnReconnect: 网络恢复时是否 refetch（需配合 setupListeners）
  refetchOnReconnect: false,

  // 8. endpoints: 所有端点定义
  endpoints: (builder) => ({
    // GET /api/posts?page=1
    getPosts: builder.query<Post[], PostQueryArgs>({
      query: ({ page = 1, limit = 10 } = {}) => `/posts?page=${page}&limit=${limit}`,
      // providesTags: 这个 query 提供哪些 tag
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Post' as const, id })),
              { type: 'Post', id: 'LIST' },
            ]
          : [{ type: 'Post', id: 'LIST' }],
    }),

    // GET /api/posts/:id
    getPostById: builder.query<Post, number>({
      query: (id) => `/posts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Post', id }],
    }),

    // POST /api/posts
    createPost: builder.mutation<Post, Partial<Post>>({
      query: (newPost) => ({
        url: '/posts',
        method: 'POST',
        body: newPost,
      }),
      // invalidatesTags: 这个 mutation 完成后失效哪些 tag
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),

    // PATCH /api/posts/:id
    updatePost: builder.mutation<Post, Pick<Post, 'id'> & Partial<Post>>({
      query: ({ id, ...patch }) => ({
        url: `/posts/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Post', id }],
    }),

    // DELETE /api/posts/:id
    deletePost: builder.mutation<void, number>({
      query: (id) => ({ url: `/posts/${id}`, method: 'DELETE' }),
      invalidatesTags: (result, error, id) => [
        { type: 'Post', id },
        { type: 'Post', id: 'LIST' },
      ],
    }),
  }),
})

// 自动生成的 hooks
export const {
  useGetPostsQuery,
  useGetPostByIdQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  // 还有非 React 版本：
  useLazyGetPostsQuery,           // 手动触发的 query
  usePrefetch,                    // 预加载
  endpoints,                      // 直接访问 endpoint
} = api
```

### 注册到 Store

```ts
// src/app/store.ts
import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { api } from '@/services/api'

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
})

// 启用 refetchOnFocus / refetchOnReconnect（可选）
setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

### 在组件中使用

```tsx
// src/features/posts/PostList.tsx
import { useGetPostsQuery, useDeletePostMutation } from '@/services/api'

export function PostList() {
  // ✅ Query hook：返回完整状态
  const {
    data,           // 服务器响应数据
    isLoading,      // 首次加载（无缓存）
    isFetching,     // 任何加载（含 refetch）
    isSuccess,      // 加载成功
    isError,        // 加载失败
    error,          // 错误对象
    refetch,        // 手动 refetch 函数
  } = useGetPostsQuery({ page: 1, limit: 10 })

  // ✅ Mutation hook：返回 [触发函数, 状态]
  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation()

  const handleDelete = async (id: number) => {
    try {
      await deletePost(id).unwrap()   // unwrap：mutation 失败时 throw
      alert('Deleted!')
    } catch (err) {
      alert('Delete failed')
    }
  }

  if (isLoading) return <p>Loading...</p>
  if (isError) return <p>Error</p>
  return (
    <ul>
      {data?.map((post) => (
        <li key={post.id}>
          {post.title}
          <button onClick={() => handleDelete(post.id)} disabled={isDeleting}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  )
}
```

### Tag-based Cache Invalidation

RTK Query 用 **tags** 自动失效缓存——比手动 `dispatch(refetch())` 优雅：

```ts
endpoints: (builder) => ({
  getPosts: builder.query<Post[], void>({
    query: () => '/posts',
    // 该 query 提供 `Post-LIST` tag
    providesTags: [{ type: 'Post', id: 'LIST' }],
  }),

  createPost: builder.mutation<Post, Partial<Post>>({
    query: (post) => ({ url: '/posts', method: 'POST', body: post }),
    // 该 mutation 失效 `Post-LIST` tag → getPosts 自动重新拉取
    invalidatesTags: [{ type: 'Post', id: 'LIST' }],
  }),
})
```

完整示例：列表 + 详情 + CRUD：

```ts
endpoints: (builder) => ({
  getPosts: builder.query<Post[], void>({
    query: () => '/posts',
    providesTags: (result) =>
      result
        ? [
            ...result.map(({ id }) => ({ type: 'Post' as const, id })),
            { type: 'Post', id: 'LIST' },
          ]
        : [{ type: 'Post', id: 'LIST' }],
  }),
  getPostById: builder.query<Post, number>({
    query: (id) => `/posts/${id}`,
    providesTags: (result, error, id) => [{ type: 'Post', id }],
  }),
  createPost: builder.mutation<Post, Partial<Post>>({
    query: (post) => ({ url: '/posts', method: 'POST', body: post }),
    invalidatesTags: [{ type: 'Post', id: 'LIST' }],  // 只失效列表、不动具体 post
  }),
  updatePost: builder.mutation<Post, Post>({
    query: (post) => ({ url: `/posts/${post.id}`, method: 'PATCH', body: post }),
    invalidatesTags: (result, error, { id }) => [
      { type: 'Post', id },           // 失效具体 post → 重新拉取详情
      { type: 'Post', id: 'LIST' },   // 失效列表 → 重新拉取列表
    ],
  }),
})
```

### Polling（轮询）

```tsx
const { data } = useGetPostsQuery(undefined, {
  pollingInterval: 5000,        // 每 5 秒 refetch 一次
  skipPollingIfUnfocused: true, // 窗口失焦时暂停（v2.5+）
})
```

### Lazy Query（按需触发）

```tsx
import { useLazyGetPostsQuery } from '@/services/api'

function SearchPage() {
  const [trigger, { data, isLoading }] = useLazyGetPostsQuery()

  return (
    <>
      <button onClick={() => trigger({ page: 1 })}>Load</button>
      {isLoading && <p>Loading...</p>}
      {data?.map((p) => <p key={p.id}>{p.title}</p>)}
    </>
  )
}
```

### Optimistic Update

```ts
updatePost: builder.mutation<Post, Post>({
  query: (post) => ({ url: `/posts/${post.id}`, method: 'PATCH', body: post }),
  // 乐观更新：先改 UI、后端失败回滚
  async onQueryStarted(post, { dispatch, queryFulfilled }) {
    const patchResult = dispatch(
      api.util.updateQueryData('getPostById', post.id, (draft) => {
        Object.assign(draft, post)
      }),
    )
    try {
      await queryFulfilled    // 等待真实请求完成
    } catch {
      patchResult.undo()      // 失败 → 回滚
    }
  },
})
```

## `createListenerMiddleware` 完整模式

`createListenerMiddleware` **替代 redux-saga / redux-observable** 处理副作用——更轻、更直观、官方推荐。

### 基础设置

```ts
// src/app/listenerMiddleware.ts
import { createListenerMiddleware, addListener } from '@reduxjs/toolkit'
import type { RootState, AppDispatch } from './store'

export const listenerMiddleware = createListenerMiddleware()

// typed startListening / addListener（v1.7+）
export const startAppListening = listenerMiddleware.startListening.withTypes<
  RootState,
  AppDispatch
>()

export const addAppListener = addListener.withTypes<RootState, AppDispatch>()
```

注册到 store：

```ts
// src/app/store.ts
import { configureStore } from '@reduxjs/toolkit'
import { listenerMiddleware } from './listenerMiddleware'

export const store = configureStore({
  reducer: { ... },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(listenerMiddleware.middleware),
})
```

> `prepend`（不是 `concat`）—— listener 应该在 RTK Query 等 middleware **之前**。

### 四种监听触发方式

```ts
import { isAnyOf } from '@reduxjs/toolkit'
import { startAppListening } from '@/app/listenerMiddleware'
import { todoAdded, todoRemoved } from '@/features/todos/todosSlice'

// 1. type: 字符串 action type
startAppListening({
  type: 'todos/added',
  effect: async (action, listenerApi) => {
    console.log('Todo added:', action.payload)
  },
})

// 2. actionCreator: action creator 引用（推荐 / 类型安全）
startAppListening({
  actionCreator: todoAdded,
  effect: async (action, listenerApi) => {
    // action.payload 自动有正确类型
    console.log('Todo added:', action.payload.text)
  },
})

// 3. matcher: 多个 action creator 组合
startAppListening({
  matcher: isAnyOf(todoAdded, todoRemoved),
  effect: async (action, listenerApi) => {
    // action 类型自动是 todoAdded | todoRemoved
    await saveTodosToServer(listenerApi.getState().todos)
  },
})

// 4. predicate: 完全自定义条件（action + state）
startAppListening({
  predicate: (action, currentState, previousState) => {
    return (
      currentState.cart.total !== previousState.cart.total &&
      currentState.cart.total > 100
    )
  },
  effect: async (action, listenerApi) => {
    console.log('Big purchase!')
  },
})
```

### listenerApi 完整方法

```ts
startAppListening({
  actionCreator: someAction,
  effect: async (action, listenerApi) => {
    const {
      // Store 访问
      dispatch,                // dispatch 函数
      getState,                // 当前 state
      getOriginalState,        // listener 触发前的 state（只能调一次）

      // 控制
      cancel,                  // 取消当前 effect
      unsubscribe,             // 永久取消该 listener
      subscribe,               // 重新订阅（unsubscribe 后）
      cancelActiveListeners,   // 取消所有正在运行的同类 effect

      // 异步等待
      condition,               // 等待 predicate 满足（Promise）
      take,                    // 等待下一个匹配的 action（Promise）
      delay,                   // setTimeout 的 Promise 版
      pause,                   // 暂停直到 Promise resolve / reject

      // 子任务
      fork,                    // 启动子任务（不阻塞 effect 主体）

      // 取消支持
      signal,                  // AbortSignal
      throwIfCancelled,        // 如果已取消则 throw（用于 await 后检查）

      // Extra
      extra,                   // configureStore 中的 extraArgument
    } = listenerApi

    // 1. 等待 1 秒
    await delay(1000)

    // 2. 等待下一个 logout action
    const [logoutAction, currentState] = await take(logout.match)

    // 3. 等待条件满足
    await condition((action, state) => state.cart.items.length > 0)

    // 4. 取消支持
    const data = await fetchSomeData({ signal })
    throwIfCancelled()        // 如果中途被 cancel，则抛错

    // 5. 子任务（不阻塞主 effect）
    const task = fork(async (forkApi) => {
      await forkApi.delay(5000)
      return 'done'
    })
    const result = await task.result   // 等待子任务结果
  },
})
```

### 实际用例：登录流程

```ts
import { loginSuccess, logout } from '@/features/auth/authSlice'

// 登录成功后：缓存 token / fetch user profile / 上报埋点
startAppListening({
  actionCreator: loginSuccess,
  effect: async (action, listenerApi) => {
    const { token, userId } = action.payload

    // 1. 持久化 token
    localStorage.setItem('token', token)

    // 2. fetch user profile
    listenerApi.dispatch(fetchUserProfile(userId))

    // 3. 上报埋点
    analytics.track('login', { userId })

    // 4. 等待 logout action → 清理
    await listenerApi.condition((action) => logout.match(action))
    localStorage.removeItem('token')
  },
})
```

### 实际用例：防抖

```ts
import { searchQueryChanged } from '@/features/search/searchSlice'

startAppListening({
  actionCreator: searchQueryChanged,
  effect: async (action, listenerApi) => {
    // 取消之前的同类 effect（防抖核心）
    listenerApi.cancelActiveListeners()

    // 等待 300ms（如果期间被 cancel 则不执行）
    await listenerApi.delay(300)

    // 发起搜索
    listenerApi.dispatch(performSearch(action.payload))
  },
})
```

## `createEntityAdapter` Normalized CRUD

`createEntityAdapter` 为 normalized state（`{ ids: [...], entities: { ... } }`）生成标准 CRUD reducer + memoized selector。

### 完整用法

```ts
import { createEntityAdapter, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'

interface Book {
  id: number
  title: string
  author: string
  publishedYear: number
}

// 1. 创建 adapter
const booksAdapter = createEntityAdapter<Book>({
  // selectId: 默认 entity.id；可改为其他字段
  selectId: (book) => book.id,
  // sortComparer: 自动排序（影响 ids 数组顺序）
  sortComparer: (a, b) => b.publishedYear - a.publishedYear,
})

// 2. 用 adapter.getInitialState() 创建 initialState（含 ids / entities + 可加自定义字段）
const initialState = booksAdapter.getInitialState({
  status: 'idle' as 'idle' | 'loading' | 'succeeded' | 'failed',
})

// 3. createSlice 中用 adapter 方法
const booksSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    // adapter 方法直接作为 reducer 用（参数 = adapter 方法的第二参数）
    bookAdded: booksAdapter.addOne,
    booksReceived: booksAdapter.setAll,
    bookRemoved: booksAdapter.removeOne,
    bookUpdated: booksAdapter.updateOne,

    // 或者在 reducer 内手动调
    customAdd: (state, action: PayloadAction<Book>) => {
      booksAdapter.addOne(state, action.payload)
      state.status = 'succeeded'
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchBooks.fulfilled, (state, action) => {
      booksAdapter.setAll(state, action.payload)
      state.status = 'succeeded'
    })
  },
})

export const { bookAdded, booksReceived, bookRemoved, bookUpdated } = booksSlice.actions
export default booksSlice.reducer

// 4. adapter.getSelectors 生成 memoized selector
export const booksSelectors = booksAdapter.getSelectors<RootState>(
  (state) => state.books,
)

// 自动生成的 selector：
// - selectAll: () => Book[]
// - selectById: (id: number) => Book | undefined
// - selectIds: () => number[]
// - selectEntities: () => Record<number, Book>
// - selectTotal: () => number
```

### 全部 CRUD 方法

| 方法 | 参数 | 说明 |
|---|---|---|
| `addOne` | `entity` | 添加 1 个（已存在则跳过） |
| `addMany` | `entities[] / { ids, entities }` | 批量添加 |
| `setOne` | `entity` | 添加 / 更新（upsert） |
| `setMany` | `entities[]` | 批量 setOne |
| `setAll` | `entities[]` | **完全替换**所有 entities |
| `removeOne` | `id` | 删除 1 个 |
| `removeMany` | `ids[] / predicate` | 批量删除 |
| `removeAll` | - | 清空 |
| `updateOne` | `{ id, changes }` | 部分更新 1 个 |
| `updateMany` | `{ id, changes }[]` | 批量部分更新 |
| `upsertOne` | `entity` | 添加 / 完整覆盖 1 个 |
| `upsertMany` | `entities[]` | 批量 upsertOne |

### 组件中使用

```tsx
import { booksSelectors } from '@/features/books/booksSlice'

function BookList() {
  // ✅ 用 adapter 生成的 memoized selector
  const books = useAppSelector(booksSelectors.selectAll)
  const total = useAppSelector(booksSelectors.selectTotal)

  return (
    <div>
      <p>{total} books</p>
      <ul>
        {books.map((book) => (
          <li key={book.id}>{book.title} - {book.author}</li>
        ))}
      </ul>
    </div>
  )
}

function BookDetail({ id }: { id: number }) {
  const book = useAppSelector((s) => booksSelectors.selectById(s, id))
  if (!book) return <p>Not found</p>
  return <h2>{book.title}</h2>
}
```

## Memoized Selectors

### `createSelector` 基础

`createSelector` 是 Reselect 的 RTK 集成版——避免组件重渲时重复计算派生值：

```ts
import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'

// 1. 输入 selector
const selectTodos = (state: RootState) => state.todos.list
const selectFilter = (state: RootState) => state.todos.filter

// 2. createSelector: 自动 memoize
export const selectFilteredTodos = createSelector(
  [selectTodos, selectFilter],
  (todos, filter) => {
    console.log('Recomputing filtered todos')   // 只在 todos 或 filter 变化时打印
    switch (filter) {
      case 'active': return todos.filter((t) => !t.completed)
      case 'completed': return todos.filter((t) => t.completed)
      default: return todos
    }
  },
)

// 3. 链式：可以基于其他 createSelector
export const selectFilteredTodoCount = createSelector(
  [selectFilteredTodos],
  (todos) => todos.length,
)
```

### `createSelector.withTypes`（v2.1+）

可以创建预设了 `RootState` 类型的版本：

```ts
const createAppSelector = createSelector.withTypes<RootState>()

const selectFilteredTodos = createAppSelector(
  // state 已自动有 RootState 类型
  [(state) => state.todos.list, (state) => state.todos.filter],
  (todos, filter) => { /* ... */ },
)
```

### Selector 传参（动态参数）

```ts
// ❌ 错误：每次传不同 id 会破坏 memoize
export const selectTodoById = createSelector(
  [(state, id: number) => state.todos.list, (state, id: number) => id],
  (todos, id) => todos.find((t) => t.id === id),
)
// 问题：组件 A 用 selectTodoById(state, 1)、组件 B 用 selectTodoById(state, 2)
// → 互相覆盖 memoize cache

// ✅ 正确：用 cache size（lru 1）或 createSelectorCreator
// 或：直接在组件中用 useAppSelector + 闭包
function Todo({ id }: { id: number }) {
  const todo = useAppSelector((state) => state.todos.list.find((t) => t.id === id))
  return <li>{todo?.text}</li>
}
```

更完整的传参 selector 用 `re-reselect` 或 RTK v2 的 `lruMemoize`，详见 [Reselect Selector Patterns](https://reselect.js.org/usage/selector-patterns)。

## `redux-persist` 持久化

RTK 不自带持久化——用社区库 `redux-persist`：

```bash
pnpm add redux-persist
```

### 完整配置

```ts
// src/app/store.ts
import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import storage from 'redux-persist/lib/storage'  // 默认 localStorage

import counterReducer from '@/features/counter/counterSlice'
import userReducer from '@/features/user/userSlice'

const rootReducer = combineReducers({
  counter: counterReducer,
  user: userReducer,
})

const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['user'],    // 只持久化 user slice（也可用 blacklist 反向）
  // migrate: (state) => ...   // 版本升级时迁移
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略 redux-persist 的内部 action
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export const persistor = persistStore(store)
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

### 在 App 中用 `<PersistGate>`

```tsx
// src/main.tsx
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from '@/app/store'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <PersistGate loading={<p>Loading...</p>} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>,
)
```

`<PersistGate>` 等待 localStorage hydration 完成后才渲染 children。

## TypeScript 完整类型

### `RootState` / `AppDispatch` 推导

```ts
// src/app/store.ts
export const store = configureStore({ reducer: { ... } })

// ✅ 永远从 store 推导，不要手写
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

### Typed Hooks

```ts
// src/app/hooks.ts
import { useDispatch, useSelector, useStore } from 'react-redux'
import type { RootState, AppDispatch, AppStore } from './store'

// v9 推荐方式：.withTypes()
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
export const useAppStore = useStore.withTypes<AppStore>()

// 或：手写 typed hooks（旧写法，仍可用）
// export const useAppDispatch = () => useDispatch<AppDispatch>()
// export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
```

### `createAsyncThunk` 完整类型

```ts
// 三泛型 + 配置对象
export const updateUser = createAsyncThunk<
  User,                              // Returned
  Partial<User>,                     // ThunkArg
  {
    state: RootState                 // getState() 类型
    dispatch: AppDispatch            // dispatch 类型
    extra: { apiClient: ApiClient }  // extra 类型
    rejectValue: { code: string }    // rejectWithValue 类型
    serializedErrorType: SerializedError  // 自定义 error 类型
    pendingMeta: { startedAt: number }    // pending action.meta 类型
    fulfilledMeta: { duration: number }   // fulfilled action.meta 类型
    rejectedMeta: never                   // rejected action.meta 类型
  }
>('users/update', async (changes, thunkAPI) => { ... })
```

### Pre-typed createAsyncThunk（避免重复）

```ts
// src/app/createAppAsyncThunk.ts
import { createAsyncThunk } from '@reduxjs/toolkit'
import type { RootState, AppDispatch } from './store'

// 预设了常用类型的版本（v2 推荐）
export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState
  dispatch: AppDispatch
  rejectValue: string
}>()

// 使用时只需指定 Returned 和 ThunkArg
export const fetchPost = createAppAsyncThunk<Post, number>(
  'posts/fetchById',
  async (id, thunkAPI) => {
    // thunkAPI.getState() 自动有 RootState 类型
    // thunkAPI.dispatch 自动有 AppDispatch 类型
    return (await fetch(`/api/posts/${id}`)).json()
  },
)
```

### `PayloadAction` 完整泛型

```ts
import { type PayloadAction } from '@reduxjs/toolkit'

// PayloadAction<Payload, Type, Meta, Error>
type AddTodoAction = PayloadAction<
  { text: string },                                  // payload
  'todos/added',                                     // type（字面量）
  { author: string; timestamp: number },             // meta
  false                                              // error（false = 不是 error action）
>
```

### Selector 类型

```ts
// 1. 简单 selector
const selectValue = (state: RootState) => state.counter.value
//    ^? (state: RootState) => number

// 2. createSelector
const selectDoubled = createSelector(
  [selectValue],
  (value): number => value * 2,
)
//    ^? OutputSelector<...>

// 3. 用于 useSelector
const doubled = useAppSelector(selectDoubled)
//    ^? number
```

### `createApi` 类型推导

```ts
const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    getPosts: builder.query<Post[], void>({          // <ResponseType, ArgType>
      query: () => '/posts',
    }),
    getPostById: builder.query<Post, number>({       // arg 类型 = number
      query: (id) => `/posts/${id}`,
    }),
    createPost: builder.mutation<Post, Partial<Post>>({
      query: (body) => ({ url: '/posts', method: 'POST', body }),
    }),
  }),
})

// 自动生成的 hook 类型完整推导：
const { data } = api.useGetPostsQuery()
//      ^? Post[] | undefined

const { data: post } = api.useGetPostByIdQuery(123)
//      ^? Post | undefined

const [createPost, { isLoading }] = api.useCreatePostMutation()
// createPost: (arg: Partial<Post>) => MutationActionCreatorResult<...>
```

## SSR + Next.js

### Next.js App Router 模式：store-per-request

Next.js 多请求共享 module-level store 会导致**请求间状态污染**——必须每次请求创建新 store：

```ts
// src/lib/store.ts
import { configureStore, combineReducers } from '@reduxjs/toolkit'
import counterReducer from '@/features/counter/counterSlice'

const rootReducer = combineReducers({
  counter: counterReducer,
})

// 工厂函数：每次调用返回新 store
export const makeStore = () => {
  return configureStore({
    reducer: rootReducer,
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
```

### StoreProvider（客户端组件）

```tsx
// src/app/StoreProvider.tsx
'use client'

import { useRef, type ReactNode } from 'react'
import { Provider } from 'react-redux'
import { makeStore, type AppStore } from '@/lib/store'

export function StoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<AppStore | null>(null)
  if (!storeRef.current) {
    // ✅ 每个客户端会话创建一次（不会在多 request 间共享）
    storeRef.current = makeStore()
  }
  return <Provider store={storeRef.current}>{children}</Provider>
}
```

### 在 root layout 中包裹

```tsx
// src/app/layout.tsx
import { StoreProvider } from './StoreProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  )
}
```

### Typed hooks（per-store）

```ts
// src/lib/hooks.ts
import { useDispatch, useSelector, useStore } from 'react-redux'
import type { RootState, AppDispatch, AppStore } from './store'

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
export const useAppStore = useStore.withTypes<AppStore>()
```

### 初始化 state（server → client）

```tsx
// src/app/page.tsx (Server Component)
import { makeStore } from '@/lib/store'
import { ClientCounter } from './ClientCounter'

export default async function Page() {
  // 服务端 dispatch / 初始化
  const data = await fetch('https://api.example.com/initial').then((r) => r.json())

  return <ClientCounter initialData={data} />
}
```

```tsx
// src/app/ClientCounter.tsx
'use client'

import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import { initialized } from '@/features/counter/counterSlice'

export function ClientCounter({ initialData }: { initialData: any }) {
  const dispatch = useAppDispatch()
  const value = useAppSelector((s) => s.counter.value)

  useEffect(() => {
    dispatch(initialized(initialData))
  }, [initialData, dispatch])

  return <p>Counter: {value}</p>
}
```

完整示例：[Next.js + Redux Toolkit Template](https://github.com/reduxjs/redux-templates/tree/master/packages/with-next-redux)。

## 测试

### Jest / Vitest 配置

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### 测试 Slice（不依赖 React）

```ts
// src/features/counter/counterSlice.test.ts
import { describe, it, expect } from 'vitest'
import counterReducer, { incremented, decremented, incrementedBy } from './counterSlice'

describe('counter slice', () => {
  const initialState = { value: 0 }

  it('handles incremented', () => {
    const next = counterReducer(initialState, incremented())
    expect(next.value).toBe(1)
  })

  it('handles incrementedBy', () => {
    const next = counterReducer(initialState, incrementedBy(5))
    expect(next.value).toBe(5)
  })

  it('handles decremented', () => {
    const next = counterReducer({ value: 5 }, decremented())
    expect(next.value).toBe(4)
  })
})
```

### 测试组件（用真实 store + Provider）

```tsx
// src/test/test-utils.tsx
import { type ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore, type PreloadedState } from '@reduxjs/toolkit'
import counterReducer from '@/features/counter/counterSlice'
import type { RootState } from '@/app/store'

const rootReducer = { counter: counterReducer }

// 测试专用 setupStore（接受 preloadedState）
export function setupStore(preloadedState?: PreloadedState<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
  })
}

// 自定义 render：包 Provider + 自动 store
interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: PreloadedState<RootState>
  store?: ReturnType<typeof setupStore>
}

export function renderWithProviders(
  ui: ReactElement,
  extendedOptions: ExtendedRenderOptions = {},
) {
  const {
    preloadedState = {},
    store = setupStore(preloadedState),
    ...renderOptions
  } = extendedOptions

  return {
    store,
    ...render(<Provider store={store}>{ui}</Provider>, renderOptions),
  }
}
```

```tsx
// src/features/counter/Counter.test.tsx
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/test-utils'
import { Counter } from './Counter'

describe('Counter', () => {
  it('renders initial value', () => {
    renderWithProviders(<Counter />, {
      preloadedState: { counter: { value: 42 } },
    })
    expect(screen.getByText(/value: 42/i)).toBeInTheDocument()
  })

  it('increments on click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Counter />)
    await user.click(screen.getByRole('button', { name: /\+1/ }))
    expect(screen.getByText(/value: 1/i)).toBeInTheDocument()
  })
})
```

### 测试 async thunk

```ts
import { describe, it, expect } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import { fetchUsers } from './usersSlice'
import usersReducer from './usersSlice'

it('fetches users successfully', async () => {
  // mock fetch
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [{ id: 1, name: 'Alice' }],
  }) as any

  const store = configureStore({ reducer: { users: usersReducer } })

  await store.dispatch(fetchUsers())

  expect(store.getState().users.status).toBe('succeeded')
  expect(store.getState().users.list).toEqual([{ id: 1, name: 'Alice' }])
})
```

### 测试 RTK Query

```ts
import { setupApiStore } from '@/test/api-test-utils'
import { api } from '@/services/api'

it('fetches posts', async () => {
  const storeRef = setupApiStore(api)

  const result = await storeRef.store.dispatch(
    api.endpoints.getPosts.initiate(),
  )

  expect(result.data).toBeDefined()
  expect(result.status).toBe('fulfilled')
})
```

## 常见踩坑

### 1. 不要在 reducer 内做副作用

```ts
// ❌ 错误：reducer 必须是纯函数
const userSlice = createSlice({
  name: 'user',
  initialState: { current: null },
  reducers: {
    loggedIn: (state, action) => {
      state.current = action.payload
      localStorage.setItem('user', JSON.stringify(action.payload))  // ❌ 副作用
      fetch('/api/track', { method: 'POST' })                       // ❌ 副作用
    },
  },
})

// ✅ 正确：副作用放到 listener / async thunk / 组件中
// 用 createListenerMiddleware 监听 loggedIn → localStorage / track
startAppListening({
  actionCreator: loggedIn,
  effect: async (action) => {
    localStorage.setItem('user', JSON.stringify(action.payload))
    await fetch('/api/track', { method: 'POST' })
  },
})
```

### 2. Immer mutate + return 不能同时用

```ts
// ❌ 错误：同时 mutate 和 return
todoAdded: (state, action) => {
  state.push(action.payload)
  return [...state]   // 不行！
}

// ✅ 选一个：mutate
todoAdded: (state, action) => {
  state.push(action.payload)
}

// ✅ 或：return（不 mutate）
todoAdded: (state, action) => {
  return [...state, action.payload]
}
```

### 3. 非可序列化数据进 store

Redux DevTools 序列化每个 action / state——`Date` / `Map` / `Set` / `class instance` 等**非可序列化**数据会触发 `serializableCheck` 警告：

```ts
// ❌ 不可序列化
dispatch(addTodo({ id: 1, createdAt: new Date() }))      // Date 不行
dispatch(setMap(new Map([['key', 'value']])))             // Map 不行

// ✅ 用可序列化形式
dispatch(addTodo({ id: 1, createdAt: Date.now() }))      // timestamp number
dispatch(setMap({ key: 'value' }))                        // 普通对象
```

如果**必须**用，可以在 `serializableCheck` 中忽略：

```ts
configureStore({
  reducer: { ... },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActionPaths: ['payload.createdAt'],
        ignoredPaths: ['todos.list.createdAt'],
      },
    }),
})
```

### 4. `useSelector` 返回新对象导致重渲

```tsx
// ❌ 每次返回新对象 → 永远重渲
const { value, status } = useAppSelector((s) => ({
  value: s.counter.value,
  status: s.counter.status,
}))

// ✅ 方式 1：多次 useSelector
const value = useAppSelector((s) => s.counter.value)
const status = useAppSelector((s) => s.counter.status)

// ✅ 方式 2：shallowEqual
import { shallowEqual } from 'react-redux'
const { value, status } = useAppSelector(
  (s) => ({ value: s.counter.value, status: s.counter.status }),
  shallowEqual,
)

// ✅ 方式 3：createSelector memoize
const selectCounterData = createSelector(
  [(s) => s.counter.value, (s) => s.counter.status],
  (value, status) => ({ value, status }),
)
const { value, status } = useAppSelector(selectCounterData)
```

### 5. Provider 嵌套位置

`<Provider>` 必须**最外层**：

```tsx
// ❌ 错误：Provider 在 Router 内部、Router 组件读不到 store
<BrowserRouter>
  <Provider store={store}>
    <App />
  </Provider>
</BrowserRouter>

// ✅ 正确：Provider 在最外层
<Provider store={store}>
  <BrowserRouter>
    <App />
  </BrowserRouter>
</Provider>
```

### 6. `dispatch` 在 useEffect 依赖中

`dispatch` 引用稳定、可以放心放到依赖中：

```tsx
function UserList() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(fetchUsers())
  }, [dispatch])   // ✓ dispatch 引用稳定、不会触发额外 effect
}
```

> ESLint `react-hooks/exhaustive-deps` 会要求加 `dispatch`——加就对了。

### 7. RTK Query mutation 返回值与缓存

```tsx
const [createPost, { data, isLoading }] = useCreatePostMutation()

const handleCreate = async () => {
  // ❌ 直接 .then() 拿不到完整类型 / 错误
  createPost({ title: 'New' }).then((res) => console.log(res))

  // ✅ unwrap：返回 Promise<Post>，rejection 真的会 throw
  try {
    const newPost = await createPost({ title: 'New' }).unwrap()
    console.log('Created:', newPost)
  } catch (err) {
    console.error('Failed:', err)
  }
}
```

### 8. 同步多次 dispatch 触发多次 reducer 调用

Redux 是 **同步串行** dispatch——多次 dispatch 触发多次 reducer + 多次 subscriber：

```ts
// ⚠️ 触发 3 次 reducer + 3 次 subscriber + 可能 3 次组件重渲
dispatch(increment())
dispatch(increment())
dispatch(increment())

// 性能更好：合并到一个 action
dispatch(incrementBy(3))

// 或：用 createSlice 的 batching（v2.4+ 自动 batch）
// React 18 + react-redux 8+ 在事件 handler 内自动 batch
```

> React-Redux 8+ 默认开启 React 18 的自动 batching——浏览器事件 handler 内的多次 dispatch 自动合并为一次渲染。

### 9. HMR（Hot Module Replacement）

```ts
// src/app/store.ts
import { configureStore } from '@reduxjs/toolkit'
import rootReducer from './rootReducer'

export const store = configureStore({ reducer: rootReducer })

// HMR：reducer 改动时不丢 state
if (import.meta.hot) {
  import.meta.hot.accept('./rootReducer', (newModule) => {
    if (newModule) store.replaceReducer(newModule.default)
  })
}
```

### 10. `connect` HOC 与 hooks 混用

```tsx
// ⚠️ 不要混用 —— 选一种
// 老组件用 connect，新组件用 hooks
// 不要在同一组件中既 connect 又 useSelector

// ✅ 全部迁移到 hooks（推荐）
function MyComponent() {
  const value = useAppSelector((s) => s.counter.value)
  const dispatch = useAppDispatch()
  return <p>{value}</p>
}
```

## 下一步

至此你已掌握现代 Redux 的核心——**State 设计**（slice + normalized + Selector 派生） / **`configureStore`** 完整选项 / **`createSlice`** 详解（Immer + extraReducers + selectors + prepare） / **`createAsyncThunk`** 完整模式（thunkAPI + rejectWithValue + .unwrap + condition） / **RTK Query**（createApi + tags + setupListeners + 自动生成 hooks） / **`createListenerMiddleware`**（替代 saga） / **`createEntityAdapter`**（normalized CRUD） / **`createSelector`** memoize / **redux-persist** / **TypeScript** 完整类型 / **SSR + Next.js** / **测试** / 常见踩坑。

继续学习：

- [参考](./reference.md)：**API 速查**——所有 `configureStore` / `createSlice` / `createAction` / `createReducer` / `combineReducers` / `combineSlices` / `createAsyncThunk` / `createSelector` / `createDraftSafeSelector` / `createApi` / `fetchBaseQuery` / `createListenerMiddleware` / `createEntityAdapter` / React-Redux hooks / `<Provider>` 完整 props / Middleware 完整列表 / Type Helpers / Import 来源速查 / v1 / v4 → v2 迁移要点 / Redux 5.x 破坏性变化
