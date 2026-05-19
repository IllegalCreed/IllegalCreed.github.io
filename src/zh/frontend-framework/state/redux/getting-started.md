---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **Redux 5.x + Redux Toolkit (RTK) 2.x + React-Redux 9.x**（最新 v5.0.1 / v2.x / v9.x，2024-12 起协调发布；要求 **React 18+** + **TypeScript 5.4+** + **Node 18+**）编写。本文档**只介绍现代 Redux（RTK + hooks）**——纯 `redux` + `connect` HOC + 手写 reducer + `redux-thunk` 的老写法**官方已不再推荐**、不在本文档讨论范围。

## 速查

- **系统要求**：React 18+ / TypeScript 5.4+ / Node 18+
- **安装**：`pnpm add @reduxjs/toolkit react-redux`（`redux` 已包含在 `@reduxjs/toolkit` 中、无需单独装）
- **绝对不要**：`pnpm add redux redux-thunk react-redux`（纯 Redux 5.x 路线官方已不推荐）
- **必须**：用 `configureStore` 不用 `createStore`、用 `createSlice` 不用手写 reducer、用 hooks 不用 `connect` HOC
- **TypeScript hooks**：`useSelector.withTypes&lt;RootState&gt;()` + `useDispatch.withTypes&lt;AppDispatch&gt;()` 创建 typed hooks
- **Provider 必须**：根部 `<Provider store={store}><App /></Provider>` 包裹
- **DevTools**：浏览器装 Redux DevTools 扩展、`configureStore` 默认开启
- **action 命名**：`domain/action` 形式（如 `counter/incremented`、`user/profileLoaded`），自动由 `createSlice` 生成

## Redux 是什么

Redux 是 **React 生态最经典的「单一 store + immutable state + pure reducer」状态管理库**——准确地说，它是 **2015 年由 Dan Abramov + Andrew Clark** 在 React Europe 现场演讲发布、灵感来自 **Flux + Elm + 函数式 reducer 模式** 的 JavaScript 状态容器。Redux 这个词来源于「**reducer**」（核心数据更新机制都是 `(state, action) => state` 的纯函数）+「**Flux**」（Facebook 提出的单向数据流架构）的复合。

- **React 官方文档** 在 [Choosing a State Management Library](https://react.dev/learn/managing-state) 章节列出 Redux 作为大型 / 企业级首选
- **npm 下载量**：`@reduxjs/toolkit` ~7M / week、`react-redux` ~10M / week（2026 年）——略低于 Zustand 但仍是企业级首选
- **Redux 5.x（2024-2026）** 已完全 TypeScript 重写、ESM 优先、要求 React 18+、TypeScript 5.4+
- **协调发布**：Redux core 5.0 + Redux Toolkit 2.0 + React-Redux 9.0 + Reselect 5.0 + Redux Thunk 3.0 在 2023-2024 作为 "Redux 2.0 wave" 协调发布

> Redux 名字来源：**reducer**（纯函数 `(state, action) => state`）+ **Flux**（Facebook 提出的单向数据流架构）= **Redux**。这个名字 10 年来已经成为前端状态管理的代名词。

## 现代 Redux = Redux Toolkit + React-Redux hooks

理解现代 Redux 必须先明白一件事：**纯 redux + connect + 手写 reducer + redux-thunk** 的老写法**官方已不再推荐**——所有 2019 年起的官方教程 / 文档都以 **Redux Toolkit (RTK)** 为默认。本文档**只介绍现代 Redux**。

| 维度 | 老写法（不推荐） | 现代 Redux（必须用这套） |
|---|---|---|
| Store | 手写 `createStore + applyMiddleware + composeWithDevTools` | `configureStore({ reducer })` 一行 |
| Reducer | 手写 `switch (action.type)` 大 case | `createSlice` 自动 generated |
| Action | 手写 const + action creator function | `createSlice` 自动 generated |
| 异步 | `redux-thunk` 手写 | `createAsyncThunk` / `RTK Query` |
| 不变性 | 手写 `{ ...state, x: ... }` | Immer 自动（`state.x = ...` 直接写） |
| 副作用 | `redux-saga` / `redux-observable` | `createListenerMiddleware` |
| 组件集成 | `connect(mapStateToProps, mapDispatchToProps)(C)` | `useSelector` / `useDispatch` hooks |
| 数据获取 | 手写 fetch / axios + dispatch | **RTK Query**（推荐）|
| TypeScript | 手写 action union 类型 | 自动从 store 推导 `RootState` / `AppDispatch` |

**关键认知**：

- **绝对不要**`pnpm add redux redux-thunk redux-devtools-extension react-redux`——这些都包含在 `@reduxjs/toolkit` 中
- **永远用** `configureStore` 不用 `createStore`、用 `createSlice` 不用手写 reducer、用 hooks 不用 `connect` HOC
- 完整的"老 Redux → 现代 Redux"迁移路径见 [Migrating to Modern Redux](https://redux.js.org/usage/migrating-to-modern-redux)

## Redux vs Zustand / Jotai / Pinia

| 维度 | Redux Toolkit | Zustand | Jotai | Pinia (Vue) |
|---|---|---|---|---|
| 阵营 | Redux 官方 | Poimandres | Poimandres | Vue 官方 |
| 心智模型 | **slice + dispatch + reducer + selector** | hook 即 store | atom 依赖图 | 多 store |
| Provider | 必须（`<Provider>`） | 不需要 | 需要（`<JotaiProvider>`） | 需要（`createPinia`） |
| 不变性 | Immer（mutable 写法 OK） | 手动 spread | atom setter | 直接 mutate |
| 模块化 | slice + combineReducer / combineSlices | 单 store + slice 拼接 | 每 atom 独立 | 每 store 独立 |
| 异步 | createAsyncThunk / RTK Query | async function | async atom | async action |
| TypeScript | **优秀**（自动推导 RootState） | 优秀（curried） | 优秀 | 优秀 |
| Bundle 大小 | ~13KB + ~8KB（RTK + React-Redux）| ~1KB | ~3KB | ~1.5KB |
| 数据层 | **内置 RTK Query** | 无（需配合 TanStack Query） | 无 | 无 |
| Time-Travel | **完整支持** | 基本支持（devtools middleware）| 部分支持 | 部分支持 |
| 学习曲线 | **陡（1-2 周）** | 极平（10 分钟） | 中（30 分钟） | 平 |
| 适用规模 | **大型 / 企业 / 严格审计** | 中小型 | 中型 | 所有 Vue 项目 |

**含义**：

- Redux 的独特价值是「**严格单向数据流 + Time-Travel + RTK Query 一体化数据层 + 企业审计**」
- 中小型 React 项目 → 用 Zustand
- 大型 React 项目 + 复杂数据获取 + 严格审计 → 用 RTK
- Vue 项目 → 用 Pinia
- 派生 state 极多 → 用 Jotai

## 安装

### 基础安装

```bash
pnpm add @reduxjs/toolkit react-redux
# 或：npm install @reduxjs/toolkit react-redux
# 或：yarn add @reduxjs/toolkit react-redux
```

> `@reduxjs/toolkit` 已经包含 `redux` 核心库——**不需要单独安装 `redux`**。同样 `redux-thunk` 也已内置、不需要单独安装。

### 版本要求

| 包 | 最新版本 | React | TypeScript |
|---|---|---|---|
| **@reduxjs/toolkit** | 2.x | React 18+ | TS 5.4+ |
| **react-redux** | 9.x | React 18+ | TS 5.4+ |
| **redux** (内置) | 5.x | - | TS 5.4+ |

> **Redux 5.x 破坏性**：移除 UMD build、`AnyAction` 改为 `UnknownAction`、`PreloadedState` 类型移除、`action.type` 必须为 string。详见底部「v1 → v2 迁移」章节。

### 用官方模板创建新项目（推荐）

```bash
# Vite + React + TypeScript + RTK（推荐）
pnpm dlx tiged reduxjs/redux-templates/packages/vite-template-redux my-app

# Next.js + Redux + TypeScript
pnpm dlx create-next-app --example with-redux my-app
```

这两个模板已经预配好 `configureStore` + `<Provider>` + typed hooks + 一个 Counter 示例 slice + RTK Query 示例——开箱即用。

## 第一个 Store

### 1. 创建 Store

`configureStore` 是 RTK 的核心 API——一行替代传统 `createStore + applyMiddleware + composeWithDevTools` 的所有样板：

```ts
// src/app/store.ts
import { configureStore } from '@reduxjs/toolkit'

export const store = configureStore({
  reducer: {
    // slice reducers 在这里组合（详见下文 createSlice）
  },
})

// 推导类型 —— TypeScript 必备
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

`configureStore` **自动配置**：

- **redux-thunk 中间件**：可以 dispatch 函数（用于异步 action）
- **immutableCheck 中间件**：开发模式检测 state mutation
- **serializableCheck 中间件**：开发模式检测非可序列化 state / action
- **Redux DevTools Extension**：浏览器扩展自动连接
- **combineReducers**：传入 `reducer` 对象时自动调用

### 2. 创建 Slice（state + reducer + action 三合一）

`createSlice` 自动生成 action types + action creators + reducer——**这是现代 Redux 的核心**：

```ts
// src/features/counter/counterSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

// 1. 定义 state 类型
interface CounterState {
  value: number
}

// 2. 定义 initial state
const initialState: CounterState = {
  value: 0,
}

// 3. createSlice 自动生成 actions + reducer
export const counterSlice = createSlice({
  name: 'counter',     // action type 前缀（如 'counter/incremented'）
  initialState,
  reducers: {
    // ✅ Immer 集成 —— 可以直接 mutable 写
    incremented: (state) => {
      state.value += 1
    },
    decremented: (state) => {
      state.value -= 1
    },
    // payload 用 PayloadAction 类型
    incrementedBy: (state, action: PayloadAction<number>) => {
      state.value += action.payload
    },
  },
})

// 4. 导出 generated action creators
export const { incremented, decremented, incrementedBy } = counterSlice.actions

// 5. 导出 reducer（给 store 用）
export default counterSlice.reducer
```

**关键点**：

- `name: 'counter'` 决定 action type 前缀：`counter/incremented` / `counter/decremented` / `counter/incrementedBy`
- `reducers` 中的函数会**自动生成同名 action creator**（`incremented()` / `decremented()` / `incrementedBy(5)`）
- **Immer 集成**：写 `state.value += 1` 看起来在 mutate、实际 Immer 在背后用 Proxy 拦截 + 生成新对象——**安全**
- `PayloadAction<T>` 是 RTK 提供的类型——`action.payload` 自动有正确类型

### 3. 把 Slice 注册到 Store

```ts
// src/app/store.ts
import { configureStore } from '@reduxjs/toolkit'
import counterReducer from '@/features/counter/counterSlice'

export const store = configureStore({
  reducer: {
    counter: counterReducer,  // state.counter = counterSlice.reducer
    // 可以加更多 slice：
    // user: userReducer,
    // cart: cartReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

注册后 `state.counter.value` 就是 counter slice 的 state。

### 4. 在 App 根部包 Provider

React-Redux 的 `<Provider>` 必须包在所有需要访问 store 的组件外层：

```tsx
// src/main.tsx
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from '@/app/store'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
  </Provider>,
)
```

> **与 Zustand 不同**：Zustand `create()` 返回的 hook 不需要 Provider；Redux 必须用 `<Provider>` 把 store 注入 React Context、子组件才能通过 hooks 访问。

## 在组件中使用 Store

### 1. `useSelector` 读 state

```tsx
// src/features/counter/Counter.tsx
import { useSelector } from 'react-redux'
import type { RootState } from '@/app/store'

function Counter() {
  // selector: (state: RootState) => number
  const value = useSelector((state: RootState) => state.counter.value)

  return <div>Count: {value}</div>
}
```

**与 Zustand 类似**：必须传 selector 才能精准订阅——`useSelector` 默认用 **`===` 严格相等比较**、selector 返回的值变了才重渲。

### 2. `useDispatch` 派发 action

```tsx
import { useDispatch } from 'react-redux'
import { incremented, decremented, incrementedBy } from '@/features/counter/counterSlice'

function CounterControls() {
  const dispatch = useDispatch()

  return (
    <div>
      <button onClick={() => dispatch(incremented())}>+1</button>
      <button onClick={() => dispatch(decremented())}>-1</button>
      <button onClick={() => dispatch(incrementedBy(5))}>+5</button>
    </div>
  )
}
```

**关键点**：

- `useDispatch()` 返回 `dispatch` 函数——引用稳定（不会每次重渲变化）
- `dispatch(actionCreator(payload))` 派发 action
- `incremented()` 返回 `{ type: 'counter/incremented' }`、`incrementedBy(5)` 返回 `{ type: 'counter/incrementedBy', payload: 5 }`

### 3. 完整 Counter 示例

```tsx
// src/features/counter/Counter.tsx
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/app/store'
import { incremented, decremented, incrementedBy } from './counterSlice'

export function Counter() {
  const value = useSelector((state: RootState) => state.counter.value)
  const dispatch = useDispatch()

  return (
    <div>
      <h2>Counter</h2>
      <p>Value: {value}</p>
      <button onClick={() => dispatch(incremented())}>+1</button>
      <button onClick={() => dispatch(decremented())}>-1</button>
      <button onClick={() => dispatch(incrementedBy(5))}>+5</button>
    </div>
  )
}
```

```tsx
// src/App.tsx
import { Counter } from '@/features/counter/Counter'

export default function App() {
  return (
    <div>
      <h1>My Redux App</h1>
      <Counter />
    </div>
  )
}
```

至此一个最小可用的 Redux 应用就完成了——所有点击会通过 dispatch action 进入 reducer、reducer 更新 state、useSelector 订阅的组件自动重渲。

## TypeScript Typed Hooks（强烈推荐）

直接用 `useSelector` + `RootState` 类型断言每次都写很啰嗦——RTK 推荐创建 **typed hooks** 一次性配好类型：

```ts
// src/app/hooks.ts
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './store'

// ✅ v9 推荐方式：用 .withTypes() 创建 typed hooks
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
```

> **`.withTypes()` 是 React-Redux 9.x 新增**——比之前的 `TypedUseSelectorHook<RootState>` 写法更简洁。

然后在组件中**永远用 typed hooks**：

```tsx
// src/features/counter/Counter.tsx
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { incremented, decremented } from './counterSlice'

export function Counter() {
  // ✅ state 自动有 RootState 类型 —— 不用再 (state: RootState) 注解
  const value = useAppSelector((state) => state.counter.value)
  // ✅ dispatch 自动有 AppDispatch 类型 —— 支持 thunk 返回值类型推导
  const dispatch = useAppDispatch()

  return (
    <div>
      <p>Value: {value}</p>
      <button onClick={() => dispatch(incremented())}>+1</button>
    </div>
  )
}
```

> **`useAppDispatch` 比 `useDispatch` 重要**：当用 `createAsyncThunk` 时，`useDispatch` 不知道 thunk 的返回类型、调用 `.unwrap()` 会丢类型；`useAppDispatch` 保留完整类型。

## `useSelector` 性能优化

### 默认行为：`===` 严格相等

`useSelector` 默认用 **`===` 引用相等**比较 selector 返回值——返回的引用变了就重渲：

```tsx
// ✅ 单字段：基本类型 === 比较，安全
const value = useAppSelector((s) => s.counter.value)

// ❌ 对象 selector：每次返回新对象 → 永远重渲
const counterData = useAppSelector((s) => ({
  value: s.counter.value,
  doubled: s.counter.value * 2,
}))
```

### 解决方案 1：多次 `useSelector`（最简单）

```tsx
function Dashboard() {
  // ✅ 每个字段独立 useSelector，互不影响
  const counter = useAppSelector((s) => s.counter.value)
  const userName = useAppSelector((s) => s.user.name)
  const cartCount = useAppSelector((s) => s.cart.items.length)
  return <div>{counter} / {userName} / {cartCount}</div>
}
```

### 解决方案 2：`shallowEqual` 浅比较

需要返回对象时，传第二个参数 `shallowEqual`：

```tsx
import { useSelector, shallowEqual } from 'react-redux'

function Dashboard() {
  const { value, status } = useAppSelector(
    (s) => ({ value: s.counter.value, status: s.counter.status }),
    shallowEqual,  // ✅ 用浅比较代替 ===
  )
  return <div>{value} ({status})</div>
}
```

### 解决方案 3：`createSelector` memoize（推荐）

复杂派生计算 + 多组件复用时，用 RTK 的 `createSelector`（Reselect 集成）做 memoize：

```ts
// src/features/cart/cartSelectors.ts
import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'

// 派生：cart 总价
export const selectCartTotal = createSelector(
  [(state: RootState) => state.cart.items],
  (items) => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
)
```

```tsx
function CartTotal() {
  // ✅ memoize: items 不变时不重新计算 total
  const total = useAppSelector(selectCartTotal)
  return <p>Total: ${total}</p>
}
```

`createSelector` 详细用法见 [指南 > Memoized Selectors](./guide-line.md#memoized-selectors)。

## Redux DevTools 浏览器扩展

`configureStore` 默认开启 Redux DevTools——只需安装浏览器扩展：

### 安装扩展

- **Chrome**: [Redux DevTools](https://chromewebstore.google.com/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)
- **Firefox**: [Redux DevTools](https://addons.mozilla.org/firefox/addon/reduxdevtools/)
- **Edge**: [Redux DevTools](https://microsoftedge.microsoft.com/addons/detail/redux-devtools/nnkgneoiohoecpdiaponcejilbhhikei)

打开浏览器开发者工具 → Redux 标签页（如果没有，刷新页面）。

### DevTools 能做什么

- **Action 列表**：所有 dispatched action 完整记录（type / payload / timestamp）
- **State 检视**：当前 state 树 + 每个 action 后的 state diff
- **Time-Travel**：滚动 action 列表回到任意历史状态
- **Action replay**：录制 → 导出 → 在另一个浏览器导入回放
- **Dispatcher**：手动 dispatch 任意 action 调试
- **Test generator**：根据 action 序列生成 Jest 测试

> **生产模式禁用**：`configureStore` 默认 `devTools: import.meta.env.DEV`——生产构建自动关闭。

### 简单调试流程

1. 点击应用上的「+1」按钮
2. 切到 Redux DevTools → 看到 `counter/incremented` action
3. 点击该 action → 右侧看到 `state.counter.value` 从 `0` 变为 `1`
4. 切到 「State」标签 → 看完整 state 树
5. 点击「Jump」回到之前的 action → 应用 UI 自动同步到那时的 state

## 异步 Action：`createAsyncThunk`

Redux reducer 必须是**纯函数**——不能在 reducer 内做 fetch / setTimeout / 写 DOM。异步逻辑必须在**外面**做、做完再 dispatch action。RTK 的 `createAsyncThunk` 自动管理 `pending` / `fulfilled` / `rejected` 三阶段：

```ts
// src/features/users/usersSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: number
  name: string
}

interface UsersState {
  list: User[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

const initialState: UsersState = {
  list: [],
  status: 'idle',
  error: null,
}

// 1. 创建 async thunk
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',       // action type 前缀
  async (_, thunkAPI) => {
    const response = await fetch('/api/users')
    if (!response.ok) {
      // ✅ 用 rejectWithValue 自定义 error payload
      return thunkAPI.rejectWithValue('Failed to fetch')
    }
    const data: User[] = await response.json()
    return data           // 这个值会成为 fulfilled action 的 payload
  },
)

// 2. createSlice + extraReducers 处理 thunk 三阶段
const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    // 同步 reducer（如果有）
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.status = 'succeeded'
        state.list = action.payload
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
  },
})

export default usersSlice.reducer
```

组件中使用：

```tsx
// src/features/users/UserList.tsx
import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { fetchUsers } from './usersSlice'

export function UserList() {
  const dispatch = useAppDispatch()
  const users = useAppSelector((s) => s.users.list)
  const status = useAppSelector((s) => s.users.status)
  const error = useAppSelector((s) => s.users.error)

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchUsers())
    }
  }, [status, dispatch])

  if (status === 'loading') return <p>Loading...</p>
  if (status === 'failed') return <p>Error: {error}</p>
  return (
    <ul>
      {users.map((user) => <li key={user.id}>{user.name}</li>)}
    </ul>
  )
}
```

> **现代推荐**：对于数据获取（fetch + cache + refetch + invalidation），**强烈推荐用 RTK Query 代替 createAsyncThunk**——它自动管理缓存、自动生成 hooks、支持失效 / 轮询。`createAsyncThunk` 适合「非 HTTP」的异步副作用（如本地存储读写、WebSocket 消息处理）。详见 [指南 > RTK Query](./guide-line.md#rtk-query-推荐数据获取方案)。

## Slice 完整示例：Todo 应用

来一个综合示例——一个完整的 Todo slice（含 CRUD + filter）：

```ts
// src/features/todos/todosSlice.ts
import { createSlice, type PayloadAction, nanoid } from '@reduxjs/toolkit'

interface Todo {
  id: string
  text: string
  completed: boolean
}

type FilterType = 'all' | 'active' | 'completed'

interface TodosState {
  list: Todo[]
  filter: FilterType
}

const initialState: TodosState = {
  list: [],
  filter: 'all',
}

const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    // ✅ prepare callback：自定义 payload 生成（这里加 id）
    todoAdded: {
      reducer: (state, action: PayloadAction<Todo>) => {
        state.list.push(action.payload)  // Immer 自动处理
      },
      prepare: (text: string) => ({
        payload: { id: nanoid(), text, completed: false },
      }),
    },
    todoToggled: (state, action: PayloadAction<string>) => {
      const todo = state.list.find((t) => t.id === action.payload)
      if (todo) todo.completed = !todo.completed
    },
    todoRemoved: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter((t) => t.id !== action.payload)
    },
    filterChanged: (state, action: PayloadAction<FilterType>) => {
      state.filter = action.payload
    },
    allCleared: (state) => {
      state.list = []
    },
  },
})

export const { todoAdded, todoToggled, todoRemoved, filterChanged, allCleared } =
  todosSlice.actions

export default todosSlice.reducer
```

派生 selector：

```ts
// src/features/todos/todosSelectors.ts
import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'

const selectTodos = (state: RootState) => state.todos.list
const selectFilter = (state: RootState) => state.todos.filter

// memoized 派生：按 filter 过滤
export const selectFilteredTodos = createSelector(
  [selectTodos, selectFilter],
  (todos, filter) => {
    switch (filter) {
      case 'active': return todos.filter((t) => !t.completed)
      case 'completed': return todos.filter((t) => t.completed)
      default: return todos
    }
  },
)

export const selectActiveTodoCount = createSelector(
  [selectTodos],
  (todos) => todos.filter((t) => !t.completed).length,
)
```

组件：

```tsx
// src/features/todos/TodoApp.tsx
import { useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { todoAdded, todoToggled, todoRemoved, filterChanged } from './todosSlice'
import { selectFilteredTodos, selectActiveTodoCount } from './todosSelectors'

export function TodoApp() {
  const [text, setText] = useState('')
  const dispatch = useAppDispatch()
  const todos = useAppSelector(selectFilteredTodos)
  const activeCount = useAppSelector(selectActiveTodoCount)
  const filter = useAppSelector((s) => s.todos.filter)

  const handleAdd = () => {
    if (text.trim()) {
      dispatch(todoAdded(text.trim()))
      setText('')
    }
  }

  return (
    <div>
      <h2>Todos ({activeCount} active)</h2>

      <div>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="What needs to be done?"
        />
        <button onClick={handleAdd}>Add</button>
      </div>

      <div>
        {(['all', 'active', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => dispatch(filterChanged(f))}
            style={{ fontWeight: filter === f ? 'bold' : 'normal' }}
          >
            {f}
          </button>
        ))}
      </div>

      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => dispatch(todoToggled(todo.id))}
            />
            <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
              {todo.text}
            </span>
            <button onClick={() => dispatch(todoRemoved(todo.id))}>x</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

注册到 store：

```ts
// src/app/store.ts
import { configureStore } from '@reduxjs/toolkit'
import counterReducer from '@/features/counter/counterSlice'
import todosReducer from '@/features/todos/todosSlice'

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    todos: todosReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

## 第一个 RTK Query API

RTK Query 是 RTK 内置的**数据获取 + 缓存**层——比 `createAsyncThunk` 更适合 HTTP API：

```ts
// src/services/postsApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface Post {
  id: number
  title: string
  body: string
}

export const postsApi = createApi({
  reducerPath: 'postsApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://jsonplaceholder.typicode.com' }),
  endpoints: (builder) => ({
    // GET /posts
    getPosts: builder.query<Post[], void>({
      query: () => '/posts',
    }),
    // GET /posts/:id
    getPostById: builder.query<Post, number>({
      query: (id) => `/posts/${id}`,
    }),
  }),
})

// 自动生成的 hooks（命名：useGetXxxQuery / useXxxMutation）
export const { useGetPostsQuery, useGetPostByIdQuery } = postsApi
```

注册到 store：

```ts
// src/app/store.ts
import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { postsApi } from '@/services/postsApi'

export const store = configureStore({
  reducer: {
    [postsApi.reducerPath]: postsApi.reducer,    // 注册 RTK Query reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(postsApi.middleware),  // 注册 RTK Query middleware
})

// 可选：refetch-on-focus / refetch-on-reconnect
setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

组件中使用 —— **不需要 dispatch、不需要 useEffect**：

```tsx
// src/features/posts/PostList.tsx
import { useGetPostsQuery } from '@/services/postsApi'

export function PostList() {
  // ✅ 一行：自动 fetch + 缓存 + loading 状态
  const { data: posts, isLoading, error } = useGetPostsQuery()

  if (isLoading) return <p>Loading...</p>
  if (error) return <p>Error fetching posts</p>
  return (
    <ul>
      {posts?.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

**RTK Query 自动做了什么**：

- **自动缓存**：同一个 `useGetPostsQuery()` 在多个组件中调用 → 只请求一次、共享数据
- **自动 loading / error**：`isLoading` / `isFetching` / `error` 自动维护
- **后台 refetch**：网络恢复 / 窗口聚焦时自动重新请求（需 `setupListeners`）
- **tag invalidation**：mutation 完成后自动失效相关 query 重新拉取（见 [指南](./guide-line.md#rtk-query-推荐数据获取方案)）

详细 RTK Query 用法见 [指南 > RTK Query](./guide-line.md#rtk-query-推荐数据获取方案)。

## v1 / 老 Redux → v2 / Modern Redux 迁移要点

如果你的项目还在用老 Redux，迁移到现代 Redux 需要注意以下变化：

### 1. `createStore` → `configureStore`

```diff
- import { createStore, applyMiddleware, combineReducers, compose } from 'redux'
- import { thunk } from 'redux-thunk'
- const rootReducer = combineReducers({ posts, users })
- const composeWithDevTools = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
- const store = createStore(rootReducer, composeWithDevTools(applyMiddleware(thunk)))

+ import { configureStore } from '@reduxjs/toolkit'
+ const store = configureStore({
+   reducer: { posts: postsReducer, users: usersReducer },
+   // thunk / DevTools / immutableCheck / serializableCheck 全自动
+ })
```

### 2. 手写 reducer → `createSlice`

```diff
- // ❌ 手写
- export const ADD_TODO = 'ADD_TODO'
- export const addTodo = (text) => ({ type: ADD_TODO, payload: text })
- function todosReducer(state = [], action) {
-   switch (action.type) {
-     case ADD_TODO: return [...state, { id: nanoid(), text: action.payload }]
-     default: return state
-   }
- }

+ // ✅ createSlice 自动生成
+ const todosSlice = createSlice({
+   name: 'todos',
+   initialState: [],
+   reducers: {
+     todoAdded: (state, action) => { state.push({ id: nanoid(), text: action.payload }) },
+   },
+ })
+ export const { todoAdded } = todosSlice.actions
+ export default todosSlice.reducer
```

### 3. `connect` HOC → hooks

```diff
- // ❌ connect HOC
- const mapStateToProps = (state) => ({ count: state.counter.value })
- const mapDispatchToProps = { increment }
- export default connect(mapStateToProps, mapDispatchToProps)(Counter)

+ // ✅ hooks
+ function Counter() {
+   const count = useAppSelector((s) => s.counter.value)
+   const dispatch = useAppDispatch()
+   return <button onClick={() => dispatch(increment())}>{count}</button>
+ }
```

### 4. `redux-thunk` 手写 → `createAsyncThunk`

```diff
- // ❌ 手写 thunk
- const fetchUsers = () => async (dispatch) => {
-   dispatch({ type: 'FETCH_USERS_PENDING' })
-   try {
-     const res = await fetch('/api/users')
-     dispatch({ type: 'FETCH_USERS_FULFILLED', payload: await res.json() })
-   } catch (err) {
-     dispatch({ type: 'FETCH_USERS_REJECTED', error: err })
-   }
- }

+ // ✅ createAsyncThunk
+ const fetchUsers = createAsyncThunk('users/fetch', async () => {
+   return (await fetch('/api/users')).json()
+ })
```

### 5. `redux-saga` / `redux-observable` → `createListenerMiddleware`

```diff
- // ❌ redux-saga
- function* watchAddTodo() {
-   yield takeEvery('todos/added', function* () {
-     yield call(api.saveTodo, ...)
-   })
- }

+ // ✅ createListenerMiddleware
+ const listenerMiddleware = createListenerMiddleware()
+ listenerMiddleware.startListening({
+   actionCreator: todoAdded,
+   effect: async (action, api) => { await saveTodo(action.payload) },
+ })
```

### 6. Redux 5.x 破坏性变化（如果在 Redux 5 用纯 redux）

如果**不**用 RTK 而是直接用 `redux` 5.x（不推荐），有几个 TS 破坏性变化：

```diff
  import { Reducer, Action } from 'redux'

- import { AnyAction } from 'redux'
+ import { UnknownAction } from 'redux'    // AnyAction → UnknownAction

- const reducer: Reducer<State, AnyAction> = ...
+ const reducer: Reducer<State, UnknownAction> = ...

- import type { PreloadedState } from 'redux'    // ❌ 5.x 移除
+ // PreloadedState 移到 Reducer 的第三个泛型参数
```

> **推荐路径**：如果你不必非用纯 `redux`，**直接迁移到 `@reduxjs/toolkit`**——所有上述问题都自动解决，且代码量大幅减少。

完整迁移指南：[Migrating to RTK 2.0 and Redux 5.0](https://redux-toolkit.js.org/usage/migrating-rtk-2)。

## 下一步

至此你已掌握现代 Redux 的基础——**安装** / **第一个 store**（`configureStore`） / **第一个 slice**（`createSlice` + Immer） / **`<Provider>`** / **`useSelector` + `useDispatch`** / **TypeScript typed hooks**（`useAppSelector` / `useAppDispatch`） / **Redux DevTools** / **异步 action**（`createAsyncThunk`） / **第一个 RTK Query API** / **完整 Todo 示例** / **老 Redux → 现代 Redux 迁移**。

继续学习：

- [指南](./guide-line.md)：**核心**——State 设计原则（slice 拆分 / normalized state） / `configureStore` 完整选项（getDefaultMiddleware / devTools / preloadedState / enhancers） / `createSlice` 详解（reducers / extraReducers / prepare / selectors） / `createAsyncThunk` 完整模式（thunkAPI / rejectWithValue / condition / dispatch chain / .unwrap()） / **RTK Query**（createApi / fetchBaseQuery / endpoints / 自动生成 hooks / tags 失效 / polling） / `createListenerMiddleware` 完整模式 / `createEntityAdapter` normalized CRUD / `createSelector` memoized / **redux-persist** 持久化 / TypeScript 完整类型 / SSR + Next.js / 测试 / 常见踩坑
- [参考](./reference.md)：**API 速查**——`configureStore` / `createSlice` / `createAction` / `createReducer` / `combineReducers` / `combineSlices` / `createAsyncThunk` / `createSelector` / `createApi` / `fetchBaseQuery` / `createListenerMiddleware` / `createEntityAdapter` / React-Redux hooks / `<Provider>` 完整 props / Middleware 完整列表 / Import 来源速查 / Redux 5.x 破坏性变化
