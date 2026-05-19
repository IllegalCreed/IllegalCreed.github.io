---
layout: doc
outline: [2, 3]
---

# 参考

> Redux Toolkit 2.x + React-Redux 9.x + Redux 5.x API 速查。所有签名 / 类型 / 选项与官方文档对齐。

## 全部导出

### 从 `@reduxjs/toolkit`

```ts
import {
  // 核心 API
  configureStore,
  createSlice,
  createAction,
  createReducer,
  combineReducers,
  combineSlices,
  createAsyncThunk,
  createSelector,
  createDraftSafeSelector,

  // Entity / Listener / Listener
  createEntityAdapter,
  createListenerMiddleware,
  addListener,
  removeListener,
  clearAllListeners,

  // Action utilities
  isAllOf,
  isAnyOf,
  isAsyncThunkAction,
  isPending,
  isFulfilled,
  isRejected,
  isRejectedWithValue,

  // Action / Reducer utilities
  unwrapResult,
  nanoid,
  current,                  // Immer current() 重新导出
  original,                 // Immer original() 重新导出
  isDraft,                  // Immer isDraft() 重新导出
  isImmutableDefault,
  freeze,

  // Types
  type PayloadAction,
  type Action,
  type UnknownAction,
  type Reducer,
  type Store,
  type Middleware,
  type Dispatch,
  type ThunkAction,
  type ThunkDispatch,
  type EnhancedStore,
  type ConfigureStoreOptions,
  type EntityState,
  type EntityAdapter,
  type CaseReducer,
  type CreateSliceOptions,
  type SliceCaseReducers,
  type ActionReducerMapBuilder,
  type AsyncThunk,
  type AsyncThunkOptions,
  type AsyncThunkConfig,
  type AsyncThunkPayloadCreator,
  type ListenerMiddleware,
  type ListenerMiddlewareInstance,
  type ListenerEffect,
  type ListenerEffectAPI,
  type SerializedError,
} from '@reduxjs/toolkit'
```

### 从 `@reduxjs/toolkit/query` / `@reduxjs/toolkit/query/react`

```ts
// 非 React 用
import {
  createApi,
  fetchBaseQuery,
  retry,
  setupListeners,
  type BaseQueryFn,
  type EndpointBuilder,
  type FetchArgs,
  type FetchBaseQueryError,
  type FetchBaseQueryMeta,
  type Api,
} from '@reduxjs/toolkit/query'

// React 集成版（含 hooks 自动生成）
import {
  createApi,
  fetchBaseQuery,
  ApiProvider,
} from '@reduxjs/toolkit/query/react'
```

### 从 `react-redux`

```ts
import {
  // hooks
  useSelector,
  useDispatch,
  useStore,

  // Provider
  Provider,

  // utilities
  shallowEqual,
  batch,
  connect,                   // 老 connect HOC（仍可用、不推荐）

  // Types
  type TypedUseSelectorHook,
} from 'react-redux'
```

### 从 `redux`

```ts
// 通常不直接 import —— @reduxjs/toolkit 重新导出了大部分内容
import {
  createStore,               // 已 deprecated（用 configureStore 代替）
  combineReducers,
  applyMiddleware,
  compose,
  bindActionCreators,
  type Reducer,
  type Action,
  type UnknownAction,
  type Store,
  type Middleware,
  type Dispatch,
} from 'redux'
```

## 核心 API

### `configureStore()`

创建 Redux store，自动配置 thunk + DevTools + 不变性检查 + combineReducers。

#### 签名

```ts
function configureStore<S, A extends Action, M extends Tuple, E extends Tuple, P extends S>(
  options: ConfigureStoreOptions<S, A, M, E, P>,
): EnhancedStore<S, A, M, E>

interface ConfigureStoreOptions<S, A, M, E, P> {
  reducer: Reducer<S, A> | ReducersMapObject<S, A>
  middleware?: (getDefaultMiddleware: GetDefaultMiddleware<S>) => Tuple<M>
  devTools?: boolean | DevToolsEnhancerOptions
  preloadedState?: P
  enhancers?: (getDefaultEnhancers: GetDefaultEnhancers<M>) => Tuple<E>
}
```

#### 用法

```ts
import { configureStore } from '@reduxjs/toolkit'

const store = configureStore({
  reducer: { counter: counterReducer },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: { warnAfter: 32 },
      serializableCheck: { ignoredActions: ['some/action'] },
      thunk: { extraArgument: { api } },
    }).concat(loggerMiddleware),
  devTools: import.meta.env.DEV,
  preloadedState: { counter: { value: 42 } },
  enhancers: (getDefaultEnhancers) =>
    getDefaultEnhancers({ autoBatch: false }).concat(customEnhancer),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store
```

#### 返回值（`EnhancedStore`）

| 方法 | 类型 | 说明 |
|---|---|---|
| `dispatch(action)` | `(action) => action` | 派发 action |
| `getState()` | `() => RootState` | 读 state |
| `subscribe(listener)` | `(listener) => unsubscribe` | 订阅 state 变化 |
| `replaceReducer(nextReducer)` | `(reducer) => void` | HMR 热替换 reducer |

### `createSlice()`

自动生成 actions + reducer，是现代 Redux 的核心 API。

#### 签名

```ts
function createSlice<S, CR extends SliceCaseReducers<S>, Name extends string, Selectors>(
  options: CreateSliceOptions<S, CR, Name, Selectors>,
): Slice<S, CR, Name, Selectors>

interface CreateSliceOptions<S, CR, Name, Selectors> {
  name: Name
  initialState: S | (() => S)
  reducers: CR | ((create: ReducerCreators<S>) => CR)
  extraReducers?: (builder: ActionReducerMapBuilder<S>) => void
  selectors?: Selectors
  reducerPath?: string
}
```

#### 用法

```ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    incremented: (state) => { state.value += 1 },
    decremented: (state) => { state.value -= 1 },
    incrementedBy: (state, action: PayloadAction<number>) => {
      state.value += action.payload
    },
    incrementedWithMeta: {
      reducer: (state, action: PayloadAction<number, string, { user: string }>) => {
        state.value += action.payload
      },
      prepare: (amount: number, user: string) => ({
        payload: amount,
        meta: { user },
      }),
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => { /* ... */ })
      .addCase(fetchUsers.fulfilled, (state, action) => { /* ... */ })
      .addMatcher(isAnyOf(action1, action2), (state) => { /* ... */ })
      .addDefaultCase((state, action) => { /* ... */ })
  },
  selectors: {
    selectValue: (state) => state.value,
  },
})

// 导出
export const { incremented, decremented, incrementedBy } = counterSlice.actions
export const { selectValue } = counterSlice.selectors
export default counterSlice.reducer
```

#### 返回值（`Slice`）

| 属性 | 类型 | 说明 |
|---|---|---|
| `name` | `string` | slice 名 |
| `reducer` | `Reducer<S>` | slice reducer |
| `actions` | `CaseReducerActions<CR>` | 自动生成的 action creators |
| `caseReducers` | `CR` | reducer 函数对象 |
| `getInitialState()` | `() => S` | 获取初始 state |
| `selectors` | `Selectors` | 自动包装到 RootState 路径 |
| `getSelectors(selectState)` | `(state => S) => Selectors` | 自定义路径包装 |
| `selectSlice` | `(state) => S` | 默认选择该 slice |
| `injectInto(combiner, config?)` | `(combiner, config?) => Slice` | 用于 `combineSlices` 懒注入 |

### `createAction()`

手动创建 action creator（通常不需要 —— `createSlice` 自动生成）。

#### 签名

```ts
function createAction<P, T = string>(type: T): PayloadActionCreator<P, T>

function createAction<P, T = string, PA extends PrepareAction<P>>(
  type: T,
  prepareAction: PA,
): PayloadActionCreator<P, T, PA>
```

#### 用法

```ts
import { createAction } from '@reduxjs/toolkit'

// 简单 action
const todoAdded = createAction<string>('todos/added')
// todoAdded('Buy milk') → { type: 'todos/added', payload: 'Buy milk' }

// 带 prepare
const todoAddedWithId = createAction(
  'todos/added',
  (text: string) => ({
    payload: { id: nanoid(), text, completed: false },
  }),
)

// 用 .match() 做类型守卫
if (todoAdded.match(action)) {
  // action.payload 自动有 string 类型
  console.log(action.payload)
}

// 用 .type 做字符串匹配
console.log(todoAdded.type)  // 'todos/added'
```

### `createReducer()`

手动创建 reducer（通常用 `createSlice` 代替）。

#### 签名

```ts
function createReducer<S>(
  initialState: S | (() => S),
  builderCallback: (builder: ActionReducerMapBuilder<S>) => void,
): Reducer<S>
```

#### 用法

```ts
import { createReducer } from '@reduxjs/toolkit'

const counterReducer = createReducer({ value: 0 }, (builder) => {
  builder
    .addCase(incremented, (state) => { state.value += 1 })
    .addCase(decremented, (state) => { state.value -= 1 })
    .addCase(incrementedBy, (state, action) => { state.value += action.payload })
    .addMatcher(isAnyOf(reset, clear), () => ({ value: 0 }))
    .addDefaultCase((state, action) => state)
})
```

### `combineReducers()`

将多个 reducer 合并为一个 root reducer（`configureStore.reducer` 传对象时自动调用）。

```ts
import { combineReducers } from '@reduxjs/toolkit'

const rootReducer = combineReducers({
  counter: counterReducer,
  user: userReducer,
  cart: cartReducer,
})

// 等价于：
configureStore({
  reducer: {
    counter: counterReducer,
    user: userReducer,
    cart: cartReducer,
  },
})
```

### `combineSlices()`（v2 新增，支持懒加载）

```ts
import { combineSlices } from '@reduxjs/toolkit'
import counterSlice from './counterSlice'

// 立即注册 + 准备懒注入接口
const rootReducer = combineSlices(counterSlice).withLazyLoadedSlices<LazyLoadedSlices>()

// 运行时懒加载
import('./userSlice').then(({ userSlice }) => {
  userSlice.injectInto(rootReducer)
})
```

### `createAsyncThunk()`

创建处理异步逻辑的 thunk action creator，自动管理 pending / fulfilled / rejected 三阶段。

#### 签名

```ts
function createAsyncThunk<Returned, ThunkArg, ThunkApiConfig extends AsyncThunkConfig = {}>(
  typePrefix: string,
  payloadCreator: AsyncThunkPayloadCreator<Returned, ThunkArg, ThunkApiConfig>,
  options?: AsyncThunkOptions<ThunkArg, ThunkApiConfig>,
): AsyncThunk<Returned, ThunkArg, ThunkApiConfig>

interface AsyncThunkConfig {
  state?: unknown
  dispatch?: ThunkDispatch<unknown, unknown, Action>
  extra?: unknown
  rejectValue?: unknown
  serializedErrorType?: unknown
  pendingMeta?: unknown
  fulfilledMeta?: unknown
  rejectedMeta?: unknown
}

interface AsyncThunkOptions<ThunkArg, ThunkApiConfig> {
  condition?: (arg: ThunkArg, api: { getState; extra }) => boolean | Promise<boolean>
  dispatchConditionRejection?: boolean
  serializeError?: (error: unknown) => SerializedError
  idGenerator?: (arg: ThunkArg) => string
  getPendingMeta?: (base: { arg; requestId }, api: { getState; extra }) => any
}
```

#### thunkAPI 完整对象

| 字段 | 类型 | 说明 |
|---|---|---|
| `dispatch` | `Dispatch` | dispatch 函数 |
| `getState` | `() => RootState` | 获取当前 state |
| `extra` | `unknown` | `thunk.extraArgument` 注入的值 |
| `requestId` | `string` | 本次调用唯一 ID |
| `signal` | `AbortSignal` | 取消信号 |
| `abort` | `(reason?) => void` | 触发取消 |
| `rejectWithValue` | `(value) => ...` | 返回自定义 rejected payload |
| `fulfillWithValue` | `(value, meta) => ...` | 返回自定义 fulfilled payload + meta |

#### 用法

```ts
import { createAsyncThunk } from '@reduxjs/toolkit'

export const fetchUser = createAsyncThunk<
  User,                          // Returned
  number,                        // ThunkArg
  {
    state: RootState
    rejectValue: string
  }
>(
  'users/fetchById',
  async (id, thunkAPI) => {
    try {
      const res = await fetch(`/api/users/${id}`, { signal: thunkAPI.signal })
      if (!res.ok) return thunkAPI.rejectWithValue('Not found')
      return res.json() as Promise<User>
    } catch (err) {
      return thunkAPI.rejectWithValue((err as Error).message)
    }
  },
  {
    condition: (id, { getState }) => {
      const state = getState()
      return !state.users.list.find((u) => u.id === id)
    },
    idGenerator: () => crypto.randomUUID(),
    serializeError: (err) => ({ message: (err as Error).message }),
  },
)

// 在 extraReducers 中处理：
extraReducers: (builder) => {
  builder
    .addCase(fetchUser.pending, (state) => { /* ... */ })
    .addCase(fetchUser.fulfilled, (state, action) => { /* ... */ })
    .addCase(fetchUser.rejected, (state, action) => { /* ... */ })
}
```

#### 静态属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `fetchUser.pending` | `ActionCreator` | pending action（type = `users/fetchById/pending`） |
| `fetchUser.fulfilled` | `ActionCreator` | fulfilled action（type = `users/fetchById/fulfilled`） |
| `fetchUser.rejected` | `ActionCreator` | rejected action（type = `users/fetchById/rejected`） |
| `fetchUser.typePrefix` | `string` | `'users/fetchById'` |

#### Pre-typed 版本（v2 推荐）

```ts
const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState
  dispatch: AppDispatch
  rejectValue: string
}>()

// 然后只需指定 Returned / ThunkArg
const fetchUser = createAppAsyncThunk<User, number>('users/fetchById', async (id, api) => {
  // api.getState() / api.dispatch 自动有类型
  return (await fetch(`/api/users/${id}`)).json()
})
```

### `createSelector()`

Reselect 的 memoized selector，集成到 RTK。

#### 签名

```ts
function createSelector(
  inputSelectors: Selector[],
  resultFn: (...inputs) => Output,
  options?: { memoize?: MemoizeFunction; argsMemoize?: MemoizeFunction },
): Selector
```

#### 用法

```ts
import { createSelector } from '@reduxjs/toolkit'

const selectTodos = (state: RootState) => state.todos.list
const selectFilter = (state: RootState) => state.todos.filter

export const selectFilteredTodos = createSelector(
  [selectTodos, selectFilter],
  (todos, filter) => todos.filter((t) =>
    filter === 'completed' ? t.completed : !t.completed,
  ),
)

// v2.1+：pre-typed
const createAppSelector = createSelector.withTypes<RootState>()
const selectXYZ = createAppSelector(
  [(state) => state.todos.list],
  (todos) => todos.length,
)
```

### `createDraftSafeSelector()`

允许在 Immer reducer 内安全运行的 selector（自动检测 draft）。

```ts
import { createDraftSafeSelector } from '@reduxjs/toolkit'

const selectActiveCount = createDraftSafeSelector(
  [(state) => state.todos.list],
  (todos) => todos.filter((t) => !t.completed).length,
)

// 在 reducer 中安全用
reducers: {
  someAction: (state) => {
    const count = selectActiveCount(state)  // 在 Immer draft 中也工作正常
    state.activeCount = count
  },
}
```

### `createEntityAdapter()`

为 normalized state 生成 CRUD reducer + memoized selectors。

#### 签名

```ts
function createEntityAdapter<T, Id = number>(options?: {
  selectId?: (entity: T) => Id
  sortComparer?: false | ((a: T, b: T) => number)
}): EntityAdapter<T, Id>
```

#### 完整 API

```ts
const adapter = createEntityAdapter<Book>({
  selectId: (book) => book.isbn,
  sortComparer: (a, b) => b.year - a.year,
})

// 1. 初始 state
const initialState = adapter.getInitialState({
  status: 'idle',     // 额外字段
  error: null,
})
// → { ids: [], entities: {}, status: 'idle', error: null }

// 2. CRUD 方法（既是 reducer 又是 mutable helper）
adapter.addOne(state, entity)        // 添加 1 个（已存在则跳过）
adapter.addMany(state, entities)     // 批量添加
adapter.setOne(state, entity)        // upsert 1 个
adapter.setMany(state, entities)     // 批量 setOne
adapter.setAll(state, entities)      // 完全替换
adapter.removeOne(state, id)         // 删除 1 个
adapter.removeMany(state, ids)       // 批量删除
adapter.removeAll(state)             // 清空
adapter.updateOne(state, { id, changes })            // 部分更新
adapter.updateMany(state, [{ id, changes }, ...])    // 批量部分更新
adapter.upsertOne(state, entity)     // 添加 / 完整覆盖
adapter.upsertMany(state, entities)  // 批量 upsert

// 3. 生成 selector（globalized：传 state selector）
const selectors = adapter.getSelectors<RootState>((state) => state.books)
selectors.selectAll          // (state) => Book[]
selectors.selectById         // (state, id) => Book | undefined
selectors.selectIds          // (state) => Id[]
selectors.selectEntities     // (state) => Record<Id, Book>
selectors.selectTotal        // (state) => number

// 4. 非 globalized（用于 createSelector 组合）
const localSelectors = adapter.getSelectors()
// localSelectors.selectAll(state) —— state 是 EntityState 本身
```

### `createListenerMiddleware()`

替代 redux-saga / redux-observable 的现代副作用方案。

#### 签名

```ts
function createListenerMiddleware<S, D extends Dispatch, E>(
  options?: {
    onError?: ListenerErrorHandler
    extra?: E
  },
): ListenerMiddlewareInstance<S, D, E>
```

#### 完整 API

```ts
const listenerMiddleware = createListenerMiddleware()

// 1. startListening: 添加监听
listenerMiddleware.startListening({
  // 触发方式（四选一）
  type: 'todos/added',                                       // 字符串
  actionCreator: todoAdded,                                  // action creator
  matcher: isAnyOf(todoAdded, todoRemoved),                  // matcher / predicate
  predicate: (action, currentState, previousState) => true,  // 自定义

  // effect callback
  effect: async (action, listenerApi) => {
    // 见下方 listenerApi 完整方法
  },
})

// 2. stopListening: 移除监听
listenerMiddleware.stopListening({ actionCreator: todoAdded, effect })

// 3. clearListeners: 清空所有 listener
listenerMiddleware.clearListeners()

// 4. typed 版本（v1.7+）
const startAppListening = listenerMiddleware.startListening.withTypes<RootState, AppDispatch>()

// 5. 通过 dispatch 动态添加（运行时注册 / 卸载）
import { addListener, removeListener, clearAllListeners } from '@reduxjs/toolkit'
dispatch(addListener({ actionCreator: todoAdded, effect: ... }))
dispatch(removeListener({ actionCreator: todoAdded, effect }))
dispatch(clearAllListeners())
```

#### `listenerApi` 完整方法

| 方法 | 说明 |
|---|---|
| `dispatch(action)` | 派发 action |
| `getState()` | 获取当前 state |
| `getOriginalState()` | 获取 listener 触发前的 state（只能调一次） |
| `cancel()` | 取消当前 effect 实例 |
| `unsubscribe()` | 永久移除该 listener |
| `subscribe()` | 重新订阅（unsubscribe 后） |
| `cancelActiveListeners()` | 取消所有正在运行的同 effect 实例 |
| `condition(predicate, timeout?)` | 等待 predicate 满足 |
| `take(predicate, timeout?)` | 等待下一个匹配的 action |
| `delay(ms)` | setTimeout 的 Promise 版 |
| `pause(promise)` | 暂停直到 Promise resolve / reject |
| `fork(executor)` | 启动子任务 |
| `signal` | AbortSignal |
| `throwIfCancelled()` | 已取消则 throw |
| `extra` | configureStore 中的 extraArgument |

## RTK Query API

### `createApi()`

定义所有 API endpoints + 自动生成 React hooks。

#### 签名

```ts
function createApi<BaseQuery, Definitions, ReducerPath, TagTypes>(
  options: CreateApiOptions<BaseQuery, Definitions, ReducerPath, TagTypes>,
): Api<BaseQuery, Definitions, ReducerPath, TagTypes>
```

#### 完整选项

```ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const api = createApi({
  reducerPath: 'api',                                 // store 命名空间
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),     // 请求基础（必填）
  tagTypes: ['Post', 'User', 'Comment'],              // 失效标签集合

  // 全局配置
  keepUnusedDataFor: 60,                              // 无用缓存保留秒数（默认 60）
  refetchOnMountOrArgChange: false,                   // 默认 false
  refetchOnFocus: false,
  refetchOnReconnect: false,

  // 全局错误转换
  extractRehydrationInfo: (action, { reducerPath }) => action.payload?.[reducerPath],

  // endpoints 定义
  endpoints: (builder) => ({
    getPosts: builder.query<Post[], void>({
      query: () => '/posts',
      providesTags: ['Post'],
      transformResponse: (response: Post[]) => response,
      transformErrorResponse: (response: { status; data }) => response.data,
      keepUnusedDataFor: 30,             // override
      onQueryStarted: async (arg, { dispatch, queryFulfilled, getState }) => {
        // 乐观更新
      },
      onCacheEntryAdded: async (arg, { cacheDataLoaded, cacheEntryRemoved, dispatch }) => {
        // WebSocket / 流式数据
      },
    }),
    createPost: builder.mutation<Post, Partial<Post>>({
      query: (body) => ({ url: '/posts', method: 'POST', body }),
      invalidatesTags: ['Post'],
      transformResponse: (response: Post) => response,
    }),
  }),
})

// 自动生成的 hooks（命名规则）
export const {
  useGetPostsQuery,                  // query hook
  useLazyGetPostsQuery,              // lazy query hook（手动触发）
  useCreatePostMutation,             // mutation hook
  usePrefetch,                       // 预加载 hook
  endpoints,                         // 直接访问 endpoint 对象
  reducer,                           // reducer（注册到 store）
  middleware,                        // middleware（注册到 store）
  reducerPath,                       // 'api'
  util,                              // 工具方法（updateQueryData / invalidateTags 等）
} = api
```

#### Endpoint Builder 方法

| 方法 | 用途 |
|---|---|
| `builder.query<Returned, Arg>({ query, providesTags, ... })` | 查询（GET） |
| `builder.mutation<Returned, Arg>({ query, invalidatesTags, ... })` | 变更（POST / PATCH / DELETE） |

#### Query Hook 返回值

```tsx
const {
  data,                // 服务器响应（Returned 类型）
  currentData,         // 当前 arg 对应的数据
  isLoading,           // 首次加载（无缓存）
  isFetching,          // 任何加载（含 refetch）
  isSuccess,           // 加载成功
  isError,             // 加载失败
  error,               // 错误对象
  isUninitialized,     // 未触发请求
  refetch,             // 手动 refetch 函数
  fulfilledTimeStamp,  // 最后成功时间
  originalArgs,        // 调用时传入的参数
  status,              // 'uninitialized' | 'pending' | 'fulfilled' | 'rejected'
} = useGetPostsQuery(arg, {
  // 选项
  skip: false,
  pollingInterval: 0,
  skipPollingIfUnfocused: false,
  selectFromResult: ({ data }) => ({ data }),  // 子集选择 + memoize
  refetchOnMountOrArgChange: false,
  refetchOnFocus: false,
  refetchOnReconnect: false,
})
```

#### Mutation Hook 返回值

```tsx
const [
  triggerMutation,     // 调用 mutation 的函数：(arg) => Promise<Result>
  {
    data,              // 最后一次成功的数据
    isLoading,         // 是否正在请求
    isSuccess,
    isError,
    error,
    reset,             // 重置 hook 状态
    originalArgs,
    fulfilledTimeStamp,
  },
] = useCreatePostMutation(options)

// 调用
const handleSubmit = async (data: Partial<Post>) => {
  try {
    const result = await triggerMutation(data).unwrap()
    console.log(result)
  } catch (err) {
    console.error(err)
  }
}
```

### `fetchBaseQuery()`

`createApi.baseQuery` 的默认实现（基于 fetch）。

#### 完整选项

```ts
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  },
  credentials: 'same-origin',                     // 'include' / 'omit'
  mode: 'cors',
  fetchFn: customFetch,                            // 自定义 fetch（如带超时）
  paramsSerializer: (params) => new URLSearchParams(params).toString(),
  isJsonContentType: (headers) => headers.get('content-type')?.includes('application/json'),
  jsonContentType: 'application/json',
  jsonReplacer: undefined,
  timeout: 30000,                                  // ms
  responseHandler: 'json',                         // 'json' | 'text' | function
  validateStatus: (response, body) => response.status < 400,
})
```

### `setupListeners()`

启用 `refetchOnFocus` / `refetchOnReconnect` 全局监听器。

```ts
import { setupListeners } from '@reduxjs/toolkit/query'

setupListeners(store.dispatch)
// 返回 unsubscribe 函数
```

### `<ApiProvider>`（不带 Redux store 时用）

```tsx
import { ApiProvider } from '@reduxjs/toolkit/query/react'
import { api } from './api'

function App() {
  return (
    <ApiProvider api={api}>
      <MyApp />
    </ApiProvider>
  )
}
// 不需要 <Provider store={...}> —— 仅适合只用 RTK Query、不需要其他 slice 的小项目
```

## React-Redux Hooks

### `useSelector()`

订阅 store + 提取数据。

#### 签名

```ts
function useSelector<TState, Selected>(
  selector: (state: TState) => Selected,
  equalityFn?: (a: Selected, b: Selected) => boolean,
): Selected
```

#### 用法

```tsx
import { useSelector, shallowEqual } from 'react-redux'

// 1. 基础
const value = useSelector((state: RootState) => state.counter.value)

// 2. 自定义 equality
const data = useSelector(
  (state: RootState) => ({ a: state.x.a, b: state.x.b }),
  shallowEqual,
)

// 3. v9 推荐：typed
const useAppSelector = useSelector.withTypes<RootState>()
// 然后：
const value = useAppSelector((s) => s.counter.value)
```

### `useDispatch()`

返回 store 的 dispatch 函数。

#### 签名

```ts
function useDispatch<TDispatch = Dispatch<UnknownAction>>(): TDispatch
```

#### 用法

```tsx
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/app/store'

// 1. 基础
const dispatch = useDispatch()
dispatch({ type: 'INCREMENT' })

// 2. 类型化（推荐）
const dispatch = useDispatch<AppDispatch>()

// 3. v9 推荐：typed
const useAppDispatch = useDispatch.withTypes<AppDispatch>()
const dispatch = useAppDispatch()  // AppDispatch 类型
```

### `useStore()`

直接访问 store 实例（不推荐——优先用 useSelector）。

#### 签名

```ts
function useStore<TStore extends Store = Store>(): TStore
```

#### 用法

```tsx
import { useStore } from 'react-redux'
import type { AppStore } from '@/app/store'

const store = useStore<AppStore>()
const state = store.getState()       // 不订阅 / 不重渲
store.dispatch({ type: 'X' })
```

### `<Provider>`

#### Props

| Prop | 类型 | 说明 |
|---|---|---|
| `store` | `Store` | Redux store 实例（必填） |
| `children` | `ReactNode` | 子组件 |
| `context` | `Context<ReactReduxContextValue>` | 自定义 React Context（罕用） |
| `serverState` | `RootState` | SSR hydration 用 |
| `stabilityCheck` | `'once' \| 'always' \| 'never'` | useSelector 稳定性检查 |
| `identityFunctionCheck` | `'once' \| 'always' \| 'never'` | useSelector identity 检查 |

#### 用法

```tsx
import { Provider } from 'react-redux'
import { store } from '@/app/store'

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
  </Provider>,
)

// SSR：
<Provider store={store} serverState={preloadedStateFromServer}>
  <App />
</Provider>
```

### `shallowEqual()`

React-Redux 的浅比较函数（用于 useSelector 第二参数）。

```ts
import { shallowEqual } from 'react-redux'

shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })  // true
shallowEqual({ a: 1, b: { c: 1 } }, { a: 1, b: { c: 1 } })  // false（b 引用不同）
```

### `batch()`（v8 后已废弃）

React 18 + react-redux 8+ 已**默认自动 batching**——不再需要手动调 `batch()`。

```ts
// ⚠️ v8 后不需要
batch(() => {
  dispatch(action1())
  dispatch(action2())
})

// ✅ 直接 dispatch —— 自动 batch
dispatch(action1())
dispatch(action2())
```

## Action 匹配工具

### `isAnyOf()` / `isAllOf()`

```ts
import { isAnyOf, isAllOf, createSlice } from '@reduxjs/toolkit'

const slice = createSlice({
  name: 'x',
  initialState: { },
  reducers: {},
  extraReducers: (builder) => {
    // 匹配 fetchA.fulfilled 或 fetchB.fulfilled
    builder.addMatcher(
      isAnyOf(fetchA.fulfilled, fetchB.fulfilled),
      (state, action) => { /* ... */ },
    )

    // 同时匹配多个条件
    builder.addMatcher(
      isAllOf(loggedIn, isProUser),
      (state) => { /* ... */ },
    )
  },
})
```

### `isAsyncThunkAction()` / `isPending()` / `isFulfilled()` / `isRejected()` / `isRejectedWithValue()`

```ts
import {
  isAsyncThunkAction,
  isPending,
  isFulfilled,
  isRejected,
  isRejectedWithValue,
} from '@reduxjs/toolkit'

// 匹配所有 async thunk 的任何阶段
builder.addMatcher(isAsyncThunkAction(fetchA, fetchB), (state) => { /* ... */ })

// 匹配 pending 阶段
builder.addMatcher(isPending(fetchA, fetchB), (state) => { state.loading = true })

// 匹配 fulfilled
builder.addMatcher(isFulfilled(fetchA, fetchB), (state, action) => {
  // action.payload 类型自动推导
})

// 匹配 rejected
builder.addMatcher(isRejected(fetchA, fetchB), (state, action) => {
  state.error = action.error.message
})

// 仅匹配 rejectWithValue
builder.addMatcher(isRejectedWithValue(fetchA), (state, action) => {
  state.error = action.payload   // payload 是 rejectWithValue 的值
})
```

## 类型 Helper

### `RootState` / `AppDispatch` / `AppStore`

```ts
// src/app/store.ts
import { configureStore } from '@reduxjs/toolkit'

export const store = configureStore({ reducer: { ... } })

// 永远从 store 推导
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store
```

### `PayloadAction<P, T, M, E>`

```ts
import { type PayloadAction } from '@reduxjs/toolkit'

type AddTodoAction = PayloadAction<
  { text: string },          // payload
  'todos/added',             // type 字面量
  { userId: number },        // meta
  false                      // error
>
```

### `ThunkAction` / `ThunkDispatch`

```ts
import { type ThunkAction, type ThunkDispatch } from '@reduxjs/toolkit'

// 手写 thunk 的类型
type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  UnknownAction
>

// 使用
export const myThunk = (): AppThunk => async (dispatch, getState) => {
  // dispatch / getState 自动类型化
}
```

### `EntityState<T, Id>`

```ts
import { type EntityState } from '@reduxjs/toolkit'

interface BooksState extends EntityState<Book, number> {
  status: 'idle' | 'loading'
}

// 等价于：
interface BooksState {
  ids: number[]
  entities: Record<number, Book>
  status: 'idle' | 'loading'
}
```

### `Middleware`

```ts
import { type Middleware } from '@reduxjs/toolkit'

const loggerMiddleware: Middleware<{}, RootState> =
  (storeAPI) => (next) => (action) => {
    console.log('dispatching', action)
    const result = next(action)
    console.log('next state', storeAPI.getState())
    return result
  }
```

### `SerializedError`

```ts
interface SerializedError {
  name?: string
  message?: string
  stack?: string
  code?: string
}
```

### `AsyncThunkConfig`

```ts
interface AsyncThunkConfig {
  state?: unknown            // getState() 类型
  dispatch?: Dispatch        // dispatch 类型
  extra?: unknown            // extra 类型
  rejectValue?: unknown      // rejectWithValue payload 类型
  serializedErrorType?: unknown
  pendingMeta?: unknown
  fulfilledMeta?: unknown
  rejectedMeta?: unknown
}
```

## 工具函数

### `nanoid()`

生成唯一 ID（用于 prepare callback 等）。

```ts
import { nanoid } from '@reduxjs/toolkit'

const id = nanoid()           // 21 字符默认
const shortId = nanoid(10)    // 自定义长度
```

### `current()`

获取 Immer draft 的当前状态（用于调试 / 日志）。

```ts
import { current } from '@reduxjs/toolkit'

reducers: {
  someAction: (state) => {
    state.value += 1
    console.log(current(state))  // 当前 draft 的快照
  },
}
```

### `original()`

获取 Immer draft 的原始状态（修改前）。

```ts
import { original } from '@reduxjs/toolkit'

reducers: {
  someAction: (state) => {
    const orig = original(state)
    state.value += 1
    console.log(orig.value, state.value)  // 旧值 vs 新值
  },
}
```

### `unwrapResult()`（已 deprecated）

```ts
// ⚠️ 已 deprecated —— 用 .unwrap() 代替
import { unwrapResult } from '@reduxjs/toolkit'
const action = await dispatch(fetchUser(1))
const user = unwrapResult(action)

// ✅ 用 .unwrap()
const user = await dispatch(fetchUser(1)).unwrap()
```

## Redux 5.x 破坏性变化

| 变化 | 老 (v4) | 新 (v5) |
|---|---|---|
| Action 类型 | `AnyAction` | `UnknownAction` |
| Preloaded state | `PreloadedState<S>` 类型 | `Reducer<S, A, P>` 第三泛型参数 |
| Middleware action | `next: Dispatch<AnyAction>` | `next: (action: unknown) => unknown` |
| `action.type` 类型 | `string \| number \| symbol` | 必须 `string` |
| UMD build | 提供 | **移除** |
| 主入口 | CommonJS | ESM (`dist/redux.mjs`) |

```ts
// v4 → v5 关键变更
// ❌ v4
import { AnyAction, PreloadedState } from 'redux'
const reducer: Reducer<State, AnyAction> = ...
function reducer<S>(state: S | PreloadedState<S>, action: AnyAction) { ... }

// ✅ v5
import { UnknownAction } from 'redux'
const reducer: Reducer<State, UnknownAction> = ...
// 或：用 RTK 的 createSlice / createReducer（推荐）
```

> RTK 2.x 已经全面适配 Redux 5.x —— 用 RTK 就不会遇到这些变更。

## v1 / 老 Redux → v2 / Modern Redux 迁移要点

完整版见 [入门 > 迁移要点](./getting-started.md#v1--老-redux--v2--modern-redux-迁移要点)。

简记：

1. `createStore` → `configureStore`
2. 手写 reducer → `createSlice`
3. `connect` HOC → `useSelector` / `useDispatch`
4. `redux-thunk` 手写 → `createAsyncThunk` / `RTK Query`
5. `redux-saga` / `redux-observable` → `createListenerMiddleware`
6. 手写 immutable 更新 → Immer（`createSlice` 内置）
7. fetch + useEffect → `RTK Query`
8. `mapStateToProps` 多字段返回对象 → `useSelector` 多次或 `createSelector`

## Import 来源速查

| 内容 | Import 来源 |
|---|---|
| `configureStore` / `createSlice` / `createAction` / `createReducer` / `combineReducers` / `combineSlices` / `createAsyncThunk` / `createSelector` / `createDraftSafeSelector` / `createEntityAdapter` / `createListenerMiddleware` / `addListener` / `removeListener` / `isAnyOf` / `isAllOf` / `isPending` / `isFulfilled` / `isRejected` / `nanoid` / `current` / `original` / `unwrapResult` / 所有类型 | `@reduxjs/toolkit` |
| `createApi` / `fetchBaseQuery` / `retry` / `setupListeners` | `@reduxjs/toolkit/query` |
| `createApi` (React 版) / `ApiProvider` | `@reduxjs/toolkit/query/react` |
| `useSelector` / `useDispatch` / `useStore` / `Provider` / `shallowEqual` / `connect` (老 HOC) / `TypedUseSelectorHook` | `react-redux` |
| `createStore` / `combineReducers` / `applyMiddleware` / `compose` / `bindActionCreators` / `Reducer` / `Action` / `UnknownAction` / `Store` / `Middleware` / `Dispatch` | `redux`（通常不直接 import） |
| `persistStore` / `persistReducer` / `PERSIST` / `REHYDRATE` / `FLUSH` / `PAUSE` / `PURGE` / `REGISTER` | `redux-persist` |
| `<PersistGate>` | `redux-persist/integration/react` |

## 完整版本表

| 包 | 最新版本 | 发布日期 | 关键变化 |
|---|---|---|---|
| `redux` | v5.0.1 | 2024-12 | TS 重写、`UnknownAction`、ESM 优先、UMD 移除 |
| `@reduxjs/toolkit` | v2.x | 2024-2026 | TS 5.4+、`combineSlices`、`.withTypes()` API |
| `react-redux` | v9.x | 2024-2026 | React 18+ 必须、`useSelector.withTypes` / `useDispatch.withTypes` |
| `reselect` | v5.x | 2024 | `withTypes`、`lruMemoize` 默认 |
| `redux-thunk` | v3.x | 2024 | Redux 5 适配、内置在 RTK |
| `redux-persist` | v6.x | - | 仍在维护、社区版 |

完整迁移指南：[Migrating to RTK 2.0 and Redux 5.0](https://redux-toolkit.js.org/usage/migrating-rtk-2)。
