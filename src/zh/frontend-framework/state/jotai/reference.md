---
layout: doc
outline: [2, 3]
---

# 参考

> Jotai 2.x API 速查。所有签名 / 类型 / 选项与官方文档对齐。

## 全部导出

```ts
// from 'jotai'
import {
  // 核心 API
  atom,
  useAtom,
  useAtomValue,
  useSetAtom,
  useStore,

  // 组件
  Provider,

  // Store API（v2 新增，等同于 jotai/vanilla 中的同名导出）
  createStore,
  getDefaultStore,

  // 类型
  type Atom,
  type PrimitiveAtom,
  type WritableAtom,
  type Getter,
  type Setter,
  type SetStateAction,
  type ExtractAtomValue,
  type ExtractAtomArgs,
  type ExtractAtomResult,
} from 'jotai'
```

```ts
// from 'jotai/vanilla'
import {
  atom,
  createStore,
  getDefaultStore,
  // 类型同上
} from 'jotai/vanilla'
```

```ts
// from 'jotai/utils'
import {
  // 持久化
  atomWithStorage,
  createJSONStorage,
  unstable_withStorageValidator,

  // 重置
  atomWithReset,
  useResetAtom,
  RESET,

  // 默认值派生
  atomWithDefault,

  // Family
  atomFamily,

  // 异步
  loadable,
  unwrap,

  // 派生 / 选择
  selectAtom,
  splitAtom,

  // Reducer
  atomWithReducer,

  // 延迟
  atomWithLazy,

  // Observable
  atomWithObservable,

  // SSR
  useHydrateAtoms,

  // 命令式
  useAtomCallback,

  // 其它
  freezeAtom,
  freezeAtomCreator,
  atomWithRefresh,
} from 'jotai/utils'
```

```ts
// from 'jotai-devtools'
import { DevTools } from 'jotai-devtools'
// CSS: import 'jotai-devtools/styles.css'

// from 'jotai-devtools/utils'
import { useAtomDevtools, useAtomsDevtools, useAtomsDebugValue, useAtomsSnapshot, useGotoAtomsSnapshot } from 'jotai-devtools/utils'
```

## 核心 API

### `atom()`

创建一个 atom 配置对象（不持有值、用对象身份作为唯一标识）。

#### 签名

```ts
// 1. Primitive atom
function atom<Value>(initialValue: Value): PrimitiveAtom<Value>

// 2. Read-only derived atom
function atom<Value>(read: (get: Getter) => Value): Atom<Value>

// 3. Writable derived atom（read + write）
function atom<Value, Args extends unknown[], Result>(
  read: (get: Getter) => Value,
  write: (get: Getter, set: Setter, ...args: Args) => Result,
): WritableAtom<Value, Args, Result>

// 4. Write-only atom（read 部分传 null）
function atom<Value, Args extends unknown[], Result>(
  read: Value,
  write: (get: Getter, set: Setter, ...args: Args) => Result,
): WritableAtom<Value, Args, Result>

// 5. Async atom（read 返 Promise）
function atom<Value>(
  read: (get: Getter, options: { signal: AbortSignal }) => Promise<Value>,
): Atom<Promise<Value>>
```

#### 用法

```ts
// Primitive
const countAtom = atom(0)
const messageAtom = atom('hello')

// Read-only derived
const doubledAtom = atom((get) => get(countAtom) * 2)

// Read-write derived
const centsAtom = atom(
  (get) => get(dollarsAtom) * 100,
  (get, set, newCents: number) => set(dollarsAtom, newCents / 100),
)

// Write-only（action）
const incrementAtom = atom(
  null,
  (get, set, delta: number = 1) => set(countAtom, get(countAtom) + delta),
)

// Async
const userAtom = atom(async (get, { signal }) => {
  const id = get(userIdAtom)
  const res = await fetch(`/api/users/${id}`, { signal })
  return res.json()
})
```

#### 可选属性

```ts
const myAtom = atom(0)

// 1. debugLabel：DevTools 中显示
myAtom.debugLabel = 'myCounter'

// 2. onMount：首次被订阅时触发
myAtom.onMount = (setAtom) => {
  console.log('atom mounted')
  setAtom(1) // 设置初始值
  return () => {
    console.log('atom unmounted') // 清理函数（可选）
  }
}
```

**`onMount` 注意事项**：

- 只在 atom 被**订阅**时触发（`useAtom` / `useAtomValue`）
- 不在 `useSetAtom`（不订阅）时触发
- 不在 `useAtomCallback`（不订阅）时触发

### `useAtom()`

React Hook——读 + 写 atom。

#### 签名

```ts
// Writable atom
function useAtom<Value, Args extends unknown[], Result>(
  atom: WritableAtom<Value, Args, Result>,
  options?: { store?: Store; delay?: number },
): [Awaited<Value>, (...args: Args) => Result]

// Read-only atom
function useAtom<Value>(
  atom: Atom<Value>,
  options?: { store?: Store; delay?: number },
): [Awaited<Value>, never]
```

#### 用法

```ts
const [count, setCount] = useAtom(countAtom)
setCount(5)
setCount((c) => c + 1)

// 派生 atom（read-only）
const [doubled] = useAtom(doubledAtom) // _setter 为 never

// 注入 store
const [count] = useAtom(countAtom, { store: myStore })
```

#### 注意

- 返回元组类似 React `useState`
- async atom 自动 await（同步返回最终值）+ throw Promise 触发 Suspense
- 派生 atom 的 setter 类型是 `never`——不要调用

### `useAtomValue()`

只读访问 atom 值（不返回 setter）。

#### 签名

```ts
function useAtomValue<Value>(
  atom: Atom<Value>,
  options?: { store?: Store; delay?: number },
): Awaited<Value>
```

#### 用法

```ts
const count = useAtomValue(countAtom)
const doubled = useAtomValue(doubledAtom)

// 注入 store
const count = useAtomValue(countAtom, { store: myStore })
```

#### 何时用

- 派生 atom（无 setter）
- 只读组件
- 表达意图：「我只读、不改」

### `useSetAtom()`

只返回 setter——不订阅值变化、不触发重渲。

#### 签名

```ts
function useSetAtom<Value, Args extends unknown[], Result>(
  atom: WritableAtom<Value, Args, Result>,
  options?: { store?: Store },
): (...args: Args) => Result
```

#### 用法

```ts
const setCount = useSetAtom(countAtom)
setCount(5)
setCount((c) => c + 1)

// write-only atom 的 setter（action）
const increment = useSetAtom(incrementAtom)
increment(5)
```

#### 何时用

- **只写不读**（性能最优）
- 触发按钮 / 表单提交
- write-only atom（action 模式）

### `useStore()`

返回当前 Provider 上下文中的 store。

#### 签名

```ts
function useStore(options?: { store?: Store }): Store
```

#### 用法

```ts
const store = useStore()

// 命令式读 / 写
store.get(countAtom)
store.set(countAtom, 100)
const unsub = store.sub(countAtom, () => console.log('changed'))
unsub()
```

### `Provider`

为子树提供独立 store。

#### Props

```ts
interface ProviderProps {
  store?: Store
  children?: React.ReactNode
}
```

#### 用法

```tsx
// 不传 store（创建一个新的独立 store）
<Provider>
  <App />
</Provider>

// 注入自定义 store
const myStore = createStore()
<Provider store={myStore}>
  <App />
</Provider>

// 重置：unmount + 重新 mount
<Provider key={resetKey}>
  <Form />
</Provider>
```

#### 注意

- v2 已**移除** `initialValues` / `scope` props
- 注入初值改用 `useHydrateAtoms`
- scope 替代方案：自定义 React Context + 注入 store

### `createStore()`

创建一个独立的 vanilla store。

#### 签名

```ts
function createStore(): Store

interface Store {
  get: <Value>(atom: Atom<Value>) => Value
  set: <Value, Args extends unknown[], Result>(
    atom: WritableAtom<Value, Args, Result>,
    ...args: Args
  ) => Result
  sub: (atom: AnyAtom, listener: () => void) => () => void
}
```

#### 用法

```ts
import { createStore } from 'jotai'
// 或：import { createStore } from 'jotai/vanilla'

const store = createStore()

// 读
const count = store.get(countAtom)

// 写
store.set(countAtom, 100)
store.set(countAtom, (c) => c + 1)

// 订阅（返回 unsubscribe）
const unsub = store.sub(countAtom, () => {
  console.log('count changed to:', store.get(countAtom))
})
unsub()

// 注入到 React
<Provider store={store}>
  <App />
</Provider>
```

### `getDefaultStore()`

返回全局默认 store（不包 Provider 时的隐式 store）。

#### 签名

```ts
function getDefaultStore(): Store
```

#### 用法

```ts
import { getDefaultStore } from 'jotai'

const defaultStore = getDefaultStore()
defaultStore.set(countAtom, 100)

// 在非 React 上下文中读写全局 atom
function someUtil() {
  return defaultStore.get(countAtom)
}
```

> **注意**：全局 store 是单例——多个 import 共享同一个实例。如果应用包了 `<Provider>`，那 Provider 内的 atom 与 `getDefaultStore()` 是**两个独立 store**。

## 持久化

### `atomWithStorage()`

#### 签名

```ts
function atomWithStorage<Value>(
  key: string,
  initialValue: Value,
  storage?: SyncStorage<Value> | AsyncStorage<Value>,
  options?: { getOnInit?: boolean },
): WritableAtom<Value, [SetStateAction<Value>], void>
```

#### 选项

| 选项 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `key` | `string` | 必填 | storage key（唯一） |
| `initialValue` | `Value` | 必填 | 初始值（storage 无值时使用） |
| `storage` | `SyncStorage \| AsyncStorage` | localStorage + JSON | 存储介质 |
| `options.getOnInit` | `boolean` | `false` | 启动时立即从 storage 读（避免 fallback 闪烁） |

#### Storage 接口

```ts
interface SyncStorage<Value> {
  getItem: (key: string, initialValue: Value) => Value
  setItem: (key: string, newValue: Value) => void
  removeItem: (key: string) => void
  subscribe?: (
    key: string,
    callback: (value: Value) => void,
    initialValue: Value,
  ) => () => void
}

interface AsyncStorage<Value> {
  getItem: (key: string, initialValue: Value) => Promise<Value>
  setItem: (key: string, newValue: Value) => Promise<void>
  removeItem: (key: string) => Promise<void>
  subscribe?: SyncStorage<Value>['subscribe']
}
```

#### 用法

```ts
import { atomWithStorage, createJSONStorage } from 'jotai/utils'

// localStorage（默认）
const themeAtom = atomWithStorage('theme', 'light')

// sessionStorage
const draftAtom = atomWithStorage(
  'draft',
  '',
  createJSONStorage(() => sessionStorage),
)

// AsyncStorage + getOnInit
const tokenAtom = atomWithStorage(
  'token',
  '',
  createJSONStorage(() => AsyncStorage),
  { getOnInit: true },
)
```

### `createJSONStorage()`

把任何符合 `getItem` / `setItem` / `removeItem` 接口的对象包装为 JSON 序列化的 storage。

#### 签名

```ts
function createJSONStorage<Value>(
  getStringStorage?: () => {
    getItem: (key: string) => string | null | Promise<string | null>
    setItem: (key: string, value: string) => void | Promise<void>
    removeItem: (key: string) => void | Promise<void>
  },
  options?: {
    reviver?: (key: string, value: unknown) => unknown
    replacer?: (key: string, value: unknown) => unknown
  },
): SyncStorage<Value> | AsyncStorage<Value>
```

#### 用法

```ts
// 默认 localStorage
createJSONStorage()

// sessionStorage
createJSONStorage(() => sessionStorage)

// 自定义（如 cookie / URL hash）
createJSONStorage(() => ({
  getItem: (key) => cookies.get(key) ?? null,
  setItem: (key, val) => cookies.set(key, val),
  removeItem: (key) => cookies.remove(key),
}))
```

## 重置

### `atomWithReset()`

可重置的 primitive atom（接受 `RESET` 特殊值）。

#### 签名

```ts
function atomWithReset<Value>(
  initialValue: Value,
): WritableAtom<Value, [SetStateAction<Value> | typeof RESET], void>
```

#### 用法

```ts
import { atomWithReset, RESET } from 'jotai/utils'

const draftAtom = atomWithReset({ title: '', body: '' })

const [draft, setDraft] = useAtom(draftAtom)
setDraft({ title: 'Hi', body: '...' })
setDraft(RESET) // 重置回 { title: '', body: '' }
```

### `RESET`

```ts
const RESET: unique symbol
```

特殊符号——可在 `atomWithReset` / `atomWithDefault` / 自定义可重置 atom 中作为 setter 参数。

### `useResetAtom()`

#### 签名

```ts
function useResetAtom<Value, Args extends [typeof RESET, ...unknown[]]>(
  atom: WritableAtom<Value, Args, unknown>,
): () => void
```

#### 用法

```ts
import { useResetAtom } from 'jotai/utils'

const resetDraft = useResetAtom(draftAtom)
;<button onClick={resetDraft}>Reset</button>
```

## 默认值派生

### `atomWithDefault()`

默认值由 read 函数派生（同时可被覆盖、可重置）。

#### 签名

```ts
function atomWithDefault<Value>(
  read: (get: Getter) => Value | Promise<Value>,
): WritableAtom<Value, [SetStateAction<Value> | typeof RESET], void>
```

#### 用法

```ts
import { atomWithDefault, RESET } from 'jotai/utils'

const count1Atom = atom(1)
const count2Atom = atomWithDefault((get) => get(count1Atom) * 2)

// count2 默认 = count1 * 2
// setCount2(99) → 覆盖（不再派生）
// setCount2(RESET) → 重置回派生
```

## Family

### `atomFamily()`

> ⚠️ Jotai v3 将移除——届时迁移到 [`jotai-family`](https://github.com/jotaijs/jotai-family) 包。

#### 签名

```ts
function atomFamily<Param, AtomType>(
  initializeAtom: (param: Param) => AtomType,
  areEqual?: (a: Param, b: Param) => boolean,
): AtomFamily<Param, AtomType>

interface AtomFamily<Param, AtomType> {
  (param: Param): AtomType
  getParams(): Iterable<Param>
  remove(param: Param): void
  setShouldRemove(
    shouldRemove: ((createdAt: number, param: Param) => boolean) | null,
  ): void
  unstable_listen(callback: (event: { type: 'CREATE' | 'REMOVE'; param: Param; atom: AtomType }) => void): () => void
}
```

#### 用法

```ts
import { atomFamily } from 'jotai/utils'
import deepEqual from 'fast-deep-equal'

const todoFamily = atomFamily(
  (id: number) => atom({ id, text: '', done: false }),
)

// 深比较参数
const userFamily = atomFamily(
  (params: { id: number; type: string }) => atom(params),
  deepEqual,
)

// 内存管理
todoFamily.remove(1)
todoFamily.setShouldRemove((createdAt) => Date.now() - createdAt > 30 * 60 * 1000)
for (const p of todoFamily.getParams()) console.log(p)
```

## 异步包装

### `loadable()`

把 async atom 包装为「同步」atom——返回 `{ state, data, error }`。

#### 签名

```ts
function loadable<Value>(
  anAtom: Atom<Promise<Value>>,
): Atom<
  | { state: 'loading' }
  | { state: 'hasError'; error: unknown }
  | { state: 'hasData'; data: Value }
>
```

#### 用法

```ts
import { loadable } from 'jotai/utils'

const userAtom = atom(async (get) => fetch('/api/user').then((r) => r.json()))
const userLoadableAtom = loadable(userAtom)

const result = useAtomValue(userLoadableAtom)
if (result.state === 'loading') return <p>Loading...</p>
if (result.state === 'hasError') return <p>{String(result.error)}</p>
return <p>{result.data.name}</p>
```

### `unwrap()`

把 async atom 同步化——加载期间返回 fallback。

#### 签名

```ts
function unwrap<Value, PendingValue = undefined>(
  anAtom: Atom<Promise<Value>>,
  fallback?: (prev?: Awaited<Value>) => PendingValue,
): Atom<Awaited<Value> | PendingValue>
```

#### 用法

```ts
import { unwrap } from 'jotai/utils'

const userAtom = atom(async (get) => fetch('/api/user').then((r) => r.json()))

// 加载期间返回 undefined
const unwrappedA = unwrap(userAtom)

// 加载期间返回 fallback（保留上一次结果）
const unwrappedB = unwrap(userAtom, (prev) => prev ?? { name: 'Anonymous' })
```

## 派生 / 选择

### `selectAtom()`

派生 + 自定义 equality。

#### 签名

```ts
function selectAtom<Value, Slice>(
  anAtom: Atom<Value>,
  selector: (v: Awaited<Value>, prevSlice?: Slice) => Slice,
  equalityFn?: (a: Slice, b: Slice) => boolean,
): Atom<Slice>
```

#### 用法

```ts
import { selectAtom } from 'jotai/utils'
import deepEqual from 'fast-deep-equal'

const userAtom = atom({ id: 1, name: 'Alice', age: 30, email: 'a@x.com' })

const userNameAtom = selectAtom(
  userAtom,
  (user) => ({ id: user.id, name: user.name }),
  deepEqual,
)
```

### `splitAtom()`

数组每元素一个 atom（性能优化必备）。

#### 签名

```ts
function splitAtom<Item, Key = unknown>(
  arrayAtom: PrimitiveAtom<Item[]>,
  keyExtractor?: (item: Item) => Key,
): WritableAtom<PrimitiveAtom<Item>[], [SplitAtomAction<Item>], void>

type SplitAtomAction<Item> =
  | { type: 'remove'; atom: PrimitiveAtom<Item> }
  | { type: 'insert'; value: Item; before?: PrimitiveAtom<Item> }
  | { type: 'move'; atom: PrimitiveAtom<Item>; before?: PrimitiveAtom<Item> }
```

#### 用法

```ts
import { splitAtom } from 'jotai/utils'

const todosAtom = atom<Todo[]>([])
const todoAtomsAtom = splitAtom(todosAtom, (t) => t.id)

const [todoAtoms, dispatch] = useAtom(todoAtomsAtom)

// 删除
dispatch({ type: 'remove', atom: someTodoAtom })

// 插入
dispatch({ type: 'insert', value: { id: 3, text: 'new', done: false } })

// 移动
dispatch({ type: 'move', atom: a, before: b })
```

## Reducer / 延迟 / Observable

### `atomWithReducer()`

```ts
function atomWithReducer<Value, Action>(
  initialValue: Value,
  reducer: (prev: Value, action: Action) => Value,
): WritableAtom<Value, [Action], void>
```

```ts
import { atomWithReducer } from 'jotai/utils'

const countAtom = atomWithReducer(0, (prev, action: { type: 'inc' | 'dec' }) => {
  if (action.type === 'inc') return prev + 1
  if (action.type === 'dec') return prev - 1
  return prev
})

const [count, dispatch] = useAtom(countAtom)
dispatch({ type: 'inc' })
```

### `atomWithLazy()`

```ts
function atomWithLazy<Value>(
  initialize: () => Value,
): PrimitiveAtom<Value>
```

```ts
import { atomWithLazy } from 'jotai/utils'

// 第一次订阅时才执行 initialize
const expensiveAtom = atomWithLazy(() => computeHeavyData())
```

### `atomWithObservable()`

RxJS Observable 包装。

```ts
function atomWithObservable<Value>(
  getObservable: (get: Getter) => Subscribable<Value>,
  options?: { initialValue?: Value | (() => Value); unstable_timeout?: number },
): WritableAtom<Value, [Value], void>
```

```ts
import { atomWithObservable } from 'jotai/utils'
import { interval } from 'rxjs'

const tickAtom = atomWithObservable(() => interval(1000))
```

## SSR

### `useHydrateAtoms()`

#### 签名

```ts
function useHydrateAtoms<AtomValuesTuple>(
  values: AtomValuesTuple,
  options?: {
    store?: Store
    dangerouslyForceHydrate?: boolean
  },
): void

// 也接受 Map / 数组
function useHydrateAtoms(
  values: Iterable<readonly [Atom<unknown>, unknown]>,
  options?: { store?: Store; dangerouslyForceHydrate?: boolean },
): void
```

#### 用法

```tsx
'use client'
import { useHydrateAtoms } from 'jotai/utils'

function HydrateAtoms({ initialValues, children }) {
  useHydrateAtoms(initialValues)
  return children
}

// 注入多个 atom 初值
useHydrateAtoms([
  [countAtom, 42],
  [userAtom, { name: 'Alice' }],
])

// 使用 Map
useHydrateAtoms(new Map([
  [countAtom, 42],
  [userAtom, { name: 'Alice' }],
]))

// 指定 store
useHydrateAtoms([[countAtom, 42]], { store: myStore })

// 强制重新 hydrate（concurrent 模式下慎用）
useHydrateAtoms([[countAtom, 42]], { dangerouslyForceHydrate: true })
```

#### 注意

- 默认每个 store 中每个 atom 只 hydrate 一次
- 必须在 client component 中调用（Next.js 加 `'use client'`）
- TypeScript ES5 目标可能需要 `as const` 或 Map

## 命令式

### `useAtomCallback()`

#### 签名

```ts
function useAtomCallback<Result, Args extends unknown[]>(
  callback: (get: Getter, set: Setter, ...args: Args) => Result,
  options?: { store?: Store },
): (...args: Args) => Result
```

#### 用法

```tsx
import { useCallback } from 'react'
import { useAtomCallback } from 'jotai/utils'

function MyComponent() {
  // 注意：必须用 useCallback 包裹
  const readCount = useAtomCallback(
    useCallback((get) => get(countAtom), []),
  )

  useEffect(() => {
    const timer = setInterval(() => {
      console.log('count:', readCount())
    }, 1000)
    return () => clearInterval(timer)
  }, [readCount])

  return null
}
```

## 类型

### `Atom&lt;Value&gt;`

只读 atom（基础类型）。

```ts
interface Atom<Value> {
  toString(): string
  read: (get: Getter) => Value
  debugLabel?: string
}
```

### `PrimitiveAtom&lt;Value&gt;`

`atom(initialValue)` 创建的基础可写 atom。是 `WritableAtom` 的特化。

```ts
type PrimitiveAtom<Value> = WritableAtom<Value, [SetStateAction<Value>], void>
```

### `WritableAtom&lt;Value, Args, Result&gt;`

可写 atom。

```ts
interface WritableAtom<Value, Args extends unknown[], Result> extends Atom<Value> {
  write: (get: Getter, set: Setter, ...args: Args) => Result
  onMount?: (setAtom: (...args: Args) => Result) => void | (() => void)
}
```

### `Getter` / `Setter`

```ts
type Getter = <Value>(atom: Atom<Value>) => Value

interface Setter {
  <Value, Args extends unknown[], Result>(
    atom: WritableAtom<Value, Args, Result>,
    ...args: Args
  ): Result
}
```

### `SetStateAction&lt;Value&gt;`

setter 参数类型（与 React 一致）。

```ts
type SetStateAction<Value> = Value | ((prev: Value) => Value)
```

### `ExtractAtomValue&lt;AtomType&gt;`

提取 atom 的值类型。

```ts
type ExtractAtomValue<AtomType> = AtomType extends Atom<infer V> ? V : never
```

```ts
const userAtom = atom<User | null>(null)
type UserValue = ExtractAtomValue<typeof userAtom> // User | null
```

### `ExtractAtomArgs&lt;AtomType&gt;`

提取 writable atom 的 args 元组。

```ts
type ExtractAtomArgs<AtomType> = AtomType extends WritableAtom<unknown, infer Args, unknown> ? Args : never
```

### `ExtractAtomResult&lt;AtomType&gt;`

提取 writable atom 的 write 返回类型。

```ts
type ExtractAtomResult<AtomType> = AtomType extends WritableAtom<unknown, unknown[], infer Result> ? Result : never
```

## Store 接口

```ts
interface Store {
  get: <Value>(atom: Atom<Value>) => Value
  set: <Value, Args extends unknown[], Result>(
    atom: WritableAtom<Value, Args, Result>,
    ...args: Args
  ) => Result
  sub: (atom: AnyAtom, listener: () => void) => () => void
}
```

| 方法 | 说明 |
|---|---|
| `store.get(atom)` | 读取当前 atom 值（不订阅、不触发依赖追踪） |
| `store.set(atom, ...args)` | 写入 atom（触发订阅者） |
| `store.sub(atom, listener)` | 订阅 atom 变化、返回 unsubscribe |

## DevTools

### `<DevTools />` 组件

```tsx
import { DevTools } from 'jotai-devtools'
import 'jotai-devtools/styles.css'

interface DevToolsProps {
  isInitialOpen?: boolean
  store?: Store
  theme?: 'dark' | 'light'
  options?: {
    shouldShowPrivateAtoms?: boolean
    shouldExpandJsonTreeViewInitially?: boolean
    snapshotHistoryLimit?: number
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  }
}
```

### `useAtomDevtools()`

```ts
function useAtomDevtools<Value>(
  atom: WritableAtom<Value, [Value], void>,
  options?: { name?: string; store?: Store; enabled?: boolean },
): void
```

### `useAtomsDevtools()`

```ts
function useAtomsDevtools(
  name: string,
  options?: { store?: Store; enabled?: boolean },
): void
```

### `useAtomsSnapshot()` / `useGotoAtomsSnapshot()`

```ts
function useAtomsSnapshot(options?: { store?: Store }): AtomsSnapshot
function useGotoAtomsSnapshot(options?: { store?: Store }): (snapshot: AtomsSnapshot) => void

type AtomsSnapshot = {
  values: Map<AnyAtom, unknown>
  dependents: Map<AnyAtom, Set<AnyAtom>>
}
```

### `useAtomsDebugValue()`

```ts
function useAtomsDebugValue(options?: { store?: Store }): void
```

在 React DevTools Hooks 标签页显示所有当前 atom 值（依赖 `debugLabel`）。

## Import 来源速查

| Import | 来源 |
|---|---|
| `atom` | `jotai` 或 `jotai/vanilla` |
| `useAtom` / `useAtomValue` / `useSetAtom` / `useStore` | `jotai` |
| `Provider` | `jotai` |
| `createStore` / `getDefaultStore` | `jotai` 或 `jotai/vanilla` |
| 类型（`Atom` / `PrimitiveAtom` / `WritableAtom` / `Getter` / `Setter`） | `jotai` |
| `atomWithStorage` / `createJSONStorage` | `jotai/utils` |
| `atomWithReset` / `RESET` / `useResetAtom` | `jotai/utils` |
| `atomWithDefault` / `atomFamily` / `atomWithReducer` / `atomWithLazy` / `atomWithObservable` | `jotai/utils` |
| `loadable` / `unwrap` / `selectAtom` / `splitAtom` | `jotai/utils` |
| `useHydrateAtoms` / `useAtomCallback` | `jotai/utils` |
| `DevTools` 组件 | `jotai-devtools` |
| `useAtomDevtools` 等 | `jotai-devtools/utils` |

## v1 → v2 迁移要点速查

### Provider props 变化

| v1 | v2 |
|---|---|
| `<Provider initialValues={...}>` | `<Provider>` + `useHydrateAtoms(...)` |
| `<Provider scope={...}>` | 自定义 React Context + 注入 store |

### async atom 行为

| v1 | v2 |
|---|---|
| `atom((get) => get(asyncAtom).x)` | `atom(async (get) => (await get(asyncAtom)).x)` |
| `useAtom(asyncAtom)` 自动 await | `useAtom(asyncAtom)` 自动 await（不变） |

### 移除的 utils

| v1 | v2 替代 |
|---|---|
| `abortableAtom` | atom 第二参数 `{ signal }` |
| `waitForAll([a, b])` | `Promise.all([get(a), get(b)])` |

### 新增 API

- `createStore()` / `getDefaultStore()` —— vanilla store
- `useStore()` —— 在组件中拿到当前 store
- `jotai/vanilla` 子包

### 类型签名变化

| v1 | v2 |
|---|---|
| `WritableAtom&lt;Value, Update, Result&gt;` | `WritableAtom&lt;Value, Args extends unknown[], Result&gt;` |

## 相关包

| 包 | 用途 |
|---|---|
| [`jotai`](https://github.com/pmndrs/jotai) | 核心 |
| [`jotai-devtools`](https://github.com/jotaijs/jotai-devtools) | DevTools |
| [`jotai-tanstack-query`](https://github.com/jotaijs/jotai-tanstack-query) | TanStack Query 集成 |
| [`jotai-immer`](https://github.com/jotaijs/jotai-immer) | Immer 集成 |
| [`jotai-xstate`](https://github.com/jotaijs/jotai-xstate) | XState 集成 |
| [`jotai-redux`](https://github.com/jotaijs/jotai-redux) | Redux 互操作 |
| [`jotai-zustand`](https://github.com/jotaijs/jotai-zustand) | Zustand 互操作 |
| [`jotai-trpc`](https://github.com/jotaijs/jotai-trpc) | tRPC 集成 |
| [`jotai-effect`](https://github.com/jotaijs/jotai-effect) | 副作用 atom |
| [`jotai-family`](https://github.com/jotaijs/jotai-family) | atomFamily v3 替代 |
| [`jotai/babel`](https://github.com/pmndrs/jotai/tree/main/packages/babel) | Babel 插件（auto debugLabel + Fast Refresh） |
| [`@swc-jotai/debug-label`](https://github.com/pmndrs/swc-jotai) | SWC 插件（auto debugLabel） |
| [`@swc-jotai/react-refresh`](https://github.com/pmndrs/swc-jotai) | SWC 插件（Fast Refresh） |
