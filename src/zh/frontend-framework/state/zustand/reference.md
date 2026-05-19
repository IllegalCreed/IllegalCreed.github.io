---
layout: doc
outline: [2, 3]
---

# 参考

> Zustand 5.x API 速查。所有签名 / 类型 / 选项与官方文档对齐。

## 全部导出

```ts
// from 'zustand'
import {
  // 核心 API
  create,
  createStore,
  useStore,

  // 类型
  type StateCreator,
  type UseBoundStore,
  type StoreApi,
  type Mutate,
  type ExtractState,
  type StoreMutators,
  type StoreMutatorIdentifier,
} from 'zustand'
```

```ts
// from 'zustand/vanilla'
import { createStore } from 'zustand/vanilla'
// 与 'zustand' 中的 createStore 相同（兼容 vanilla 子包）
```

```ts
// from 'zustand/react/shallow'
import { useShallow } from 'zustand/react/shallow'
```

```ts
// from 'zustand/shallow'
import { shallow } from 'zustand/shallow'
```

```ts
// from 'zustand/traditional'（用于自定义 equality 函数）
import {
  createWithEqualityFn,
  useStoreWithEqualityFn,
} from 'zustand/traditional'
```

```ts
// from 'zustand/middleware'
import {
  persist,
  createJSONStorage,
  type StateStorage,
  type PersistOptions,
  type PersistStorage,

  devtools,
  type DevtoolsOptions,

  subscribeWithSelector,
  combine,
  redux,
} from 'zustand/middleware'
```

```ts
// from 'zustand/middleware/immer'
import { immer } from 'zustand/middleware/immer'
```

## 核心 API

### `create()`

创建一个 React Hook + API 工具（最常用入口）。

#### 签名

```ts
// curried 写法（TypeScript 必须）
function create<T>(): <Mos extends [StoreMutatorIdentifier, unknown][] = []>(
  initializer: StateCreator<T, [], Mos>,
) => UseBoundStore<Mutate<StoreApi<T>, Mos>>

// 直接写法（无类型 / combine 推导）
function create<T, Mos>(initializer: StateCreator<T, [], Mos>): UseBoundStore<Mutate<StoreApi<T>, Mos>>
```

#### 用法

```ts
// JavaScript / 无类型
const useStore = create((set) => ({
  bears: 0,
  increase: () => set((s) => ({ bears: s.bears + 1 })),
}))

// TypeScript（必须 curried）
interface BearState {
  bears: number
  increase: () => void
}

const useStore = create<BearState>()((set) => ({
  bears: 0,
  increase: () => set((s) => ({ bears: s.bears + 1 })),
}))

// 带 middleware
const useStore = create<BearState>()(
  devtools(
    persist(
      (set) => ({ bears: 0, increase: () => set(...) }),
      { name: 'bear-storage' },
    ),
  ),
)
```

#### 返回值

`UseBoundStore<StoreApi<T>>` —— 既是 React Hook，又挂载了非 React API：

| 属性 / 方法 | 类型 | 说明 |
|---|---|---|
| `useStore((s) => s.x)` | `(selector: (state: T) => U) => U` | React Hook 调用 |
| `useStore.getState()` | `() => T` | 非响应式读 state |
| `useStore.setState(partial, replace?)` | `(partial, replace?) => void` | 写 state |
| `useStore.getInitialState()` | `() => T` | 读初始 state |
| `useStore.subscribe(listener)` | `(listener) => () => void` | 订阅、返回 unsubscribe |

### `createStore()`

创建一个 vanilla store（不依赖 React），仅返回 API 工具。

#### 签名

```ts
function createStore<T>(): <Mos>(initializer: StateCreator<T, [], Mos>) => Mutate<StoreApi<T>, Mos>
function createStore<T, Mos>(initializer: StateCreator<T, [], Mos>): Mutate<StoreApi<T>, Mos>
```

#### 用法

```ts
import { createStore } from 'zustand/vanilla'
// 或：import { createStore } from 'zustand'

interface BearState {
  bears: number
  increase: () => void
}

const bearStore = createStore<BearState>()((set) => ({
  bears: 0,
  increase: () => set((s) => ({ bears: s.bears + 1 })),
}))

// 用法（无 React 时）：
console.log(bearStore.getState().bears)       // 0
bearStore.getState().increase()
bearStore.setState({ bears: 100 })
const unsub = bearStore.subscribe((state, prev) => { ... })
unsub()
```

#### 返回值（`StoreApi<T>`）

```ts
interface StoreApi<T> {
  getState: () => T
  getInitialState: () => T
  setState: {
    (partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: false): void
    (state: T | ((state: T) => T), replace: true): void
  }
  subscribe: (listener: (state: T, prevState: T) => void) => () => void
}
```

### `useStore()`

在 React 组件中订阅一个 vanilla store。

#### 签名

```ts
function useStore<T, U = T>(store: StoreApi<T>, selectorFn?: (state: T) => U): U
```

#### 用法

```ts
import { useStore } from 'zustand'
import { bearStore } from '@/stores/vanillaBear'

function BearCounter() {
  const bears = useStore(bearStore, (state) => state.bears)
  return <h1>{bears}</h1>
}
```

**应用场景**：

- 用 vanilla store + React 组件（Next.js per-request 模式必用）
- 同一个 vanilla store 被多个 React 组件订阅

### `createWithEqualityFn()`

`create` 的增强版——允许定义默认 equality 函数。

> ⚠️ 来自 `zustand/traditional`，需要安装 `use-sync-external-store`。

#### 签名

```ts
function createWithEqualityFn<T>(): <Mos>(
  initializer: StateCreator<T, [], Mos>,
  defaultEqualityFn?: <U>(a: U, b: U) => boolean,
) => UseBoundStore<Mutate<StoreApi<T>, Mos>>
```

#### 用法

```ts
import { createWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/shallow'

const useStore = createWithEqualityFn<BearState>()(
  (set) => ({ ... }),
  shallow, // 默认 equality
)

// 组件中可覆盖：
const data = useStore((s) => s.complex, Object.is)
const data2 = useStore((s) => s.list, customDeepEqual)
```

### `useStoreWithEqualityFn()`

`useStore` 的增强版——支持自定义 equality 函数。

```ts
function useStoreWithEqualityFn<T, U = T>(
  store: StoreApi<T>,
  selector: (state: T) => U,
  equalityFn?: (a: U, b: U) => boolean,
): U
```

```ts
import { useStoreWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/shallow'

const data = useStoreWithEqualityFn(
  someVanillaStore,
  (s) => ({ a: s.a, b: s.b }),
  shallow,
)
```

## 响应式工具

### `useShallow()`

React Hook，把 selector 包装为「**shallow 比较** + memoize」。**v5 推荐方式**。

#### 签名

```ts
function useShallow<T, U = T>(selectorFn: (state: T) => U): (state: T) => U
```

#### 用法

```ts
import { useShallow } from 'zustand/react/shallow'

// 对象解构
const { a, b } = useStore(useShallow((s) => ({ a: s.a, b: s.b })))

// 数组解构
const [a, b] = useStore(useShallow((s) => [s.a, s.b]))

// 派生数组（Object.keys / filter / map）
const names = useStore(useShallow((s) => Object.keys(s.map)))
```

### `shallow()`

函数式 shallow 比较——可独立使用（不限于 React）。

#### 签名

```ts
function shallow<T>(a: T, b: T): boolean
```

#### 行为

| 类型 | 行为 |
|---|---|
| 基本类型（number/string/boolean/bigint） | `Object.is` 比较 |
| 对象 | top-level 属性 `Object.is` 全部相等 + 原型相同 |
| 数组 | 长度相等 + 每个元素 `Object.is` 相等 |
| `Set` | 大小相等 + 每个元素 `Object.is` 相等 |
| `Map` | 大小相等 + 每个键值对 `Object.is` 相等 |

#### 用法

```ts
import { shallow } from 'zustand/shallow'

shallow(1, 1)                       // true
shallow({ a: 1 }, { a: 1 })         // true
shallow({ a: 1, b: 2 }, { a: 1 })   // false (键数不同)
shallow([1, 2], [1, 2])             // true
shallow(new Set([1, 2]), new Set([1, 2])) // true

// 嵌套对象 → false（只比较 top-level）
shallow({ a: { b: 1 } }, { a: { b: 1 } }) // false
```

## Store API（每个 store 实例上的方法）

每个 `create()` / `createStore()` 返回的对象都挂载了以下方法：

### `getState()`

非响应式读取当前 state。

```ts
function getState(): T

const bears = useBearStore.getState().bears
```

### `getInitialState()`

读取初始 state（store 创建时的初始值）。

```ts
function getInitialState(): T

const initial = useBearStore.getInitialState()
// 常用于 reset：useBearStore.setState(initial, true)
```

### `setState()`

写 state。

#### 签名

```ts
setState(partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: false): void
setState(state: T | ((state: T) => T), replace: true): void
```

#### 用法

```ts
// 对象形式（shallow merge）
useBearStore.setState({ bears: 100 })

// 函数形式（基于上一次 state）
useBearStore.setState((state) => ({ bears: state.bears + 1 }))

// 完全替换（删除其他字段，包括 actions！）
useBearStore.setState({ bears: 0 }, true)
```

> **`replace: true` 慎用** —— 会把所有 actions / 其他字段一起删除。

### `subscribe()`

订阅 state 变化、返回 unsubscribe 函数。

#### 签名

```ts
function subscribe(
  listener: (state: T, prevState: T) => void,
): () => void
```

#### 用法

```ts
const unsub = useBearStore.subscribe((state, prev) => {
  console.log('changed:', prev, '→', state)
})

unsub() // 取消订阅
```

### 带 `subscribeWithSelector` middleware 后的扩展签名

```ts
// 带 selector
function subscribe<U>(
  selector: (state: T) => U,
  listener: (selectedState: U, previousSelectedState: U) => void,
  options?: {
    equalityFn?: (a: U, b: U) => boolean
    fireImmediately?: boolean
  },
): () => void
```

```ts
const unsub = useStore.subscribe(
  (s) => s.bears,
  (bears, prev) => console.log('bears:', prev, '→', bears),
  { fireImmediately: true, equalityFn: Object.is },
)
```

## Middlewares

### `persist`

持久化 state 到 storage。

#### 签名

```ts
persist<T, U = T>(
  stateCreatorFn: StateCreator<T, [], []>,
  persistOptions: PersistOptions<T, U>,
): StateCreator<T, [['zustand/persist', U]], []>
```

#### 选项 `PersistOptions<T, U>`

| 选项 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `name` | `string` | 必填 | storage 中的 key（唯一） |
| `storage` | `PersistStorage<U>` | `createJSONStorage(() => localStorage)` | 存储介质 |
| `partialize` | `(state: T) => U` | 全 state | 只持久化部分字段 |
| `version` | `number` | `0` | 版本号 |
| `migrate` | `(persisted: any, version: number) => U \| Promise<U>` | — | 版本不匹配时迁移 |
| `merge` | `(persisted: unknown, current: T) => T` | shallow merge | 合并策略 |
| `onRehydrateStorage` | `(state?: T) => (state?: T, error?: Error) => void` | — | rehydrate 钩子 |
| `skipHydration` | `boolean` | `false` | 跳过自动 rehydrate（SSR 用） |

#### `createJSONStorage()`

把任意 `StateStorage`（`getItem` / `setItem` / `removeItem`）包装为 JSON 序列化的 `PersistStorage`。

```ts
function createJSONStorage<U>(
  getStorage: () => StateStorage,
  options?: {
    reviver?: (key: string, value: unknown) => unknown
    replacer?: (key: string, value: unknown) => unknown
  },
): PersistStorage<U>
```

```ts
import { persist, createJSONStorage } from 'zustand/middleware'

storage: createJSONStorage(() => localStorage)
storage: createJSONStorage(() => sessionStorage)
storage: createJSONStorage(() => customStorage)
```

#### Persist 控制 API

`persist` 包装后的 store 多了一个 `persist` 命名空间：

| 方法 | 说明 |
|---|---|
| `store.persist.rehydrate()` | 手动 rehydrate |
| `store.persist.clearStorage()` | 清空 storage（不影响内存 state） |
| `store.persist.hasHydrated()` | 是否完成 rehydrate（boolean） |
| `store.persist.onHydrate(callback)` | rehydrate 开始回调 |
| `store.persist.onFinishHydration(callback)` | rehydrate 完成回调 |
| `store.persist.getOptions()` | 读 persist 配置 |
| `store.persist.setOptions(newOptions)` | 修改 persist 配置 |

### `devtools`

集成 Redux DevTools。

#### 签名

```ts
devtools<T>(
  stateCreatorFn: StateCreator<T, [], []>,
  devtoolsOptions?: DevtoolsOptions,
): StateCreator<T, [['zustand/devtools', never]], []>
```

#### 选项 `DevtoolsOptions`

| 选项 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `name` | `string` | 自动 | DevTools 中的 store 名 |
| `enabled` | `boolean` | dev: `true`, prod: `false` | 启用 |
| `anonymousActionType` | `string` | `'anonymous'` | 未命名 action 的默认 type |
| `store` | `string` | — | 多 store 同一 connection 时分组 |
| `actionsDenylist` | `string \| string[]` | — | 过滤掉的 action（regex 模式） |
| `serialize` | `boolean \| object` | — | Redux DevTools 序列化选项 |

#### `set(..., undefined, actionType)`

每次 `set` 都建议传第三参数标识 action：

```ts
// 字符串
set({ bears: 1 }, undefined, 'bear/setOne')

// 对象（带 payload）
set(
  (s) => ({ bears: s.bears + 1 }),
  undefined,
  { type: 'bear/increment', by: 1 },
)
```

#### `cleanup`

动态创建 / 销毁 store 时清理 DevTools 连接：

```ts
store.devtools.cleanup()
```

### `immer`

用 Immer 库支持 mutable 写法。

> 需要安装 `immer`：`pnpm add immer`

#### 签名

```ts
immer<T>(
  stateCreatorFn: StateCreator<T, [], []>,
): StateCreator<T, [['zustand/immer', never]], []>
```

#### 用法

```ts
import { immer } from 'zustand/middleware/immer'

const useStore = create<T>()(
  immer((set) => ({
    user: { name: 'Alice', age: 30 },
    birthday: () => set((state) => {
      state.user.age += 1 // 直接 mutate
    }),
  })),
)
```

### `subscribeWithSelector`

扩展 `store.subscribe`，支持 selector。

#### 签名

```ts
subscribeWithSelector<T>(
  stateCreatorFn: StateCreator<T, [], []>,
): StateCreator<T, [['zustand/subscribeWithSelector', never]], []>
```

#### `store.subscribe` 扩展签名

```ts
subscribe<U>(
  selector: (state: T) => U,
  listener: (selectedState: U, previousSelectedState: U) => void,
  options?: {
    equalityFn?: (a: U, b: U) => boolean
    fireImmediately?: boolean
  },
): () => void
```

#### 用法

```ts
import { subscribeWithSelector } from 'zustand/middleware'

const useDogStore = create<DogState>()(
  subscribeWithSelector((set) => ({
    paw: true,
    setPaw: (v: boolean) => set({ paw: v }),
  })),
)

const unsub = useDogStore.subscribe(
  (state) => state.paw,
  (paw, prevPaw) => console.log('paw:', prevPaw, '→', paw),
  { fireImmediately: true },
)
```

### `combine`

state + actions 分离 + 自动类型推导。

#### 签名

```ts
combine<T, U>(
  initialState: T,
  additionalStateCreatorFn: StateCreator<T, [], [], U>,
): StateCreator<Omit<T, keyof U> & U, [], []>
```

#### 用法

```ts
import { combine } from 'zustand/middleware'

// v5 中 combine 不需要 curried！
const useStore = create(
  combine(
    { bears: 0, honey: 0 },
    (set) => ({
      increase: () => set((s) => ({ bears: s.bears + 1 })),
      eatHoney: (n: number) => set((s) => ({ honey: s.honey - n })),
    }),
  ),
)
```

### `redux`

Redux 风格 reducer + dispatch。

#### 签名

```ts
redux<T, A>(
  reducerFn: (state: T, action: A) => T,
  initialState: T,
): StateCreator<T & { dispatch: (action: A) => A }, [['zustand/redux', A]], []>
```

#### 用法

```ts
import { redux } from 'zustand/middleware'

type State = { count: number }
type Action = { type: 'INC' | 'DEC'; by: number }

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'INC': return { count: state.count + action.by }
    case 'DEC': return { count: state.count - action.by }
    default: return state
  }
}

const useStore = create(redux(reducer, { count: 0 }))

// 自动有 dispatch
useStore.getState().dispatch({ type: 'INC', by: 1 })
```

## TypeScript 类型

### `StateCreator<T, Mis, Mos, U>`

`create` / `createStore` 接收的初始化函数类型。

```ts
type StateCreator<
  T,                                                 // 完整 state 类型
  Mis extends [StoreMutatorIdentifier, unknown][] = [], // 输入 mutators（用于 slice）
  Mos extends [StoreMutatorIdentifier, unknown][] = [], // 输出 mutators
  U = T,                                             // 本 slice 类型（slice 模式用）
> = ((
  setState: Get<Mutate<StoreApi<T>, Mis>, 'setState', never>,
  getState: Get<Mutate<StoreApi<T>, Mis>, 'getState', never>,
  store: Mutate<StoreApi<T>, Mis>,
) => U) & { $$storeMutators?: Mos }
```

**典型用法**：

```ts
// 1. 简单 slice
const createBearSlice: StateCreator<AppStore, [], [], BearSlice> = (set) => ({
  bears: 0,
  increase: () => set((s) => ({ bears: s.bears + 1 })),
})

// 2. 带 middleware 的 slice（必须写出 Mis）
const createBearSlice: StateCreator<
  AppStore,
  [['zustand/devtools', never], ['zustand/persist', AppStore]], // middleware 链
  [],
  BearSlice
> = (set) => ({
  bears: 0,
  increase: () => set(
    (s) => ({ bears: s.bears + 1 }),
    undefined,
    'bear/increase', // devtools middleware 提供第三参数
  ),
})
```

### `UseBoundStore<S>`

`create()` 的返回类型。

```ts
type UseBoundStore<S> = {
  <U>(selector: (state: ExtractState<S>) => U): U
} & S

// 即：UseBoundStore<StoreApi<T>> 既是 selector hook 又有 StoreApi 方法
```

### `StoreApi<T>`

vanilla store 实例类型。

```ts
interface StoreApi<T> {
  setState: SetStateInternal<T>
  getState: () => T
  getInitialState: () => T
  subscribe: (listener: (state: T, prevState: T) => void) => () => void
}
```

### `ExtractState<S>`

从 `UseBoundStore` 或 `StoreApi` 提取 state 类型。

```ts
type ExtractState<S> = S extends { getState: () => infer X } ? X : never
```

```ts
import { create, type ExtractState } from 'zustand'

export const useBearStore = create<BearState>()((set) => ({ ... }))

// 提取完整 state + actions 类型
export type BearStoreState = ExtractState<typeof useBearStore>
// = BearState
```

### `Mutate<S, Mos>`

应用 mutators 链后的 store 类型。

```ts
type Mutate<S, Ms> = number extends Ms['length' & keyof Ms]
  ? S
  : Ms extends []
    ? S
    : Ms extends [[infer Mi, infer Ma], ...infer Mrs]
      ? Mutate<StoreMutators<S, Ma>[Mi & StoreMutatorIdentifier], Mrs>
      : never
```

> 这是底层类型，一般无需直接使用。

### `StoreMutatorIdentifier` / `StoreMutators`

middleware 注册自己的 mutator 标识符 + 行为修改：

```ts
// pinia 风格的标识符列表（v5 内置）
declare module 'zustand' {
  interface StoreMutators<S, A> {
    'zustand/devtools': WithDevtools<S>
    'zustand/persist': WithPersist<S, A>
    'zustand/immer': WithImmer<S>
    'zustand/subscribeWithSelector': WithSelectorSubscribe<S>
    'zustand/redux': WithRedux<S, A>
  }
}
```

### `PersistOptions<T, U>`

```ts
interface PersistOptions<T, U = T> {
  name: string
  storage?: PersistStorage<U>
  partialize?: (state: T) => U
  version?: number
  migrate?: (persisted: any, version: number) => U | Promise<U>
  merge?: (persisted: unknown, current: T) => T
  onRehydrateStorage?: (state?: T) => ((state?: T, error?: Error) => void) | void
  skipHydration?: boolean
}
```

### `PersistStorage<U>`

```ts
interface PersistStorage<U> {
  getItem: (name: string) => StorageValue<U> | null | Promise<StorageValue<U> | null>
  setItem: (name: string, value: StorageValue<U>) => unknown | Promise<unknown>
  removeItem: (name: string) => unknown | Promise<unknown>
}
```

### `StateStorage`

`createJSONStorage` 接受的底层 storage 接口。

```ts
interface StateStorage {
  getItem: (name: string) => string | null | Promise<string | null>
  setItem: (name: string, value: string) => unknown | Promise<unknown>
  removeItem: (name: string) => unknown | Promise<unknown>
}
```

### `DevtoolsOptions`

```ts
interface DevtoolsOptions {
  name?: string
  enabled?: boolean
  anonymousActionType?: string
  store?: string
  actionsDenylist?: string | string[]
  serialize?: boolean | {
    options?: boolean | {
      date?: boolean
      regex?: boolean
      undefined?: boolean
      error?: boolean
      symbol?: boolean
      map?: boolean
      set?: boolean
      function?: boolean
    }
    replacer?: (key: string, value: unknown) => unknown
    reviver?: (key: string, value: unknown) => unknown
  }
}
```

## `set` 函数完整签名

```ts
// 内部签名（简化版）
type SetState<T> = {
  // 默认：shallow merge
  (
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: false,
  ): void

  // 完全替换
  (
    state: T | ((state: T) => T),
    replace: true,
  ): void

  // 带 devtools middleware：第三参数 action name
  (
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace: false | undefined,
    actionType?: string | { type: string; [k: string]: unknown },
  ): void

  (
    state: T | ((state: T) => T),
    replace: true,
    actionType?: string | { type: string; [k: string]: unknown },
  ): void
}
```

## 常用 import 来源速查

| 符号 | 来源 |
|---|---|
| `create` | `zustand` |
| `createStore` | `zustand` 或 `zustand/vanilla` |
| `useStore` | `zustand` |
| `useShallow` | `zustand/react/shallow` |
| `shallow` | `zustand/shallow` |
| `createWithEqualityFn` | `zustand/traditional` |
| `useStoreWithEqualityFn` | `zustand/traditional` |
| `persist` / `createJSONStorage` | `zustand/middleware` |
| `devtools` | `zustand/middleware` |
| `subscribeWithSelector` | `zustand/middleware` |
| `combine` | `zustand/middleware` |
| `redux` | `zustand/middleware` |
| `immer` | `zustand/middleware/immer` |
| `StateCreator` (type) | `zustand` |
| `UseBoundStore` (type) | `zustand` |
| `StoreApi` (type) | `zustand` |
| `ExtractState` (type) | `zustand` |
| `PersistOptions` (type) | `zustand/middleware` |
| `DevtoolsOptions` (type) | `zustand/middleware` |
| `StateStorage` / `PersistStorage` (type) | `zustand/middleware` |

## 版本兼容矩阵

| Zustand | React | TypeScript | Node | 备注 |
|---|---|---|---|---|
| **v5.x** | **React 18+** / 19 | TS 5+ | Node 18+ | ESM 优先、curried 强制、`shallow` 第二参数移除 |
| v4.x | React 16.8+ / 17 / 18 | TS 4+ | Node 14+ | 仅 bug 修复 |
| v3.x | React 16.8+ / 17 | TS 3.8+ | — | 已停止维护 |

## v4 → v5 迁移要点

### 1. TypeScript 必须 curried

```diff
- create<BearState>((set) => ({ ... }))
+ create<BearState>()((set) => ({ ... }))
```

### 2. `shallow` 第二参数移除

```diff
  import { useShallow } from 'zustand/react/shallow'

- const data = useStore((s) => ({ a: s.a, b: s.b }), shallow)
+ const data = useStore(useShallow((s) => ({ a: s.a, b: s.b })))
```

### 3. `createWithEqualityFn` 移到 `zustand/traditional`

```diff
- import { create } from 'zustand'
- const useStore = create(creator, equalityFn)
+ import { createWithEqualityFn } from 'zustand/traditional'
+ const useStore = createWithEqualityFn(creator, equalityFn)
```

### 4. React 17 不再支持

升级到 React 18+。

### 5. `set` mutating state 必须返回新对象（非 immer）

```diff
- set((state) => { state.bears += 1 })   // v5 不再 work
+ set((state) => ({ bears: state.bears + 1 }))
```

> 如需 mutable 写法，用 `immer` middleware。

### 6. `getStorage` → `storage` + `createJSONStorage`

```diff
  persist(
    (set) => ({ ... }),
    {
      name: 'app',
-     getStorage: () => sessionStorage,
+     storage: createJSONStorage(() => sessionStorage),
    },
  )
```

### 7. 完整迁移文档

[Migrating to v5](https://zustand.docs.pmnd.rs/migrations/migrating-to-v5)

## 相关链接

- [Zustand 官网](https://zustand.docs.pmnd.rs/)
- [API Reference](https://zustand.docs.pmnd.rs/apis/create)
- [Middlewares](https://zustand.docs.pmnd.rs/middlewares/persist)
- [Migrating to v5](https://zustand.docs.pmnd.rs/migrations/migrating-to-v5)
- [GitHub: pmndrs/zustand](https://github.com/pmndrs/zustand)
- [Live Demo](https://zustand-demo.pmnd.rs/)
- [Poimandres Discord](https://discord.gg/poimandres)
- [Jotai](https://jotai.org/) | [Valtio](https://valtio.dev/) | [R3F](https://r3f.docs.pmnd.rs/)（同 Poimandres 团队作品）
