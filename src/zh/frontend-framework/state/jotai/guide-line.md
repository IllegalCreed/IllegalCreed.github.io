---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Jotai 2.x。包含 atom Primitives 全谱、三大 hook 选用决策、Provider 与多 store 隔离、Async atom 与 Suspense 完整模式、所有 utils、SSR + Next.js 集成、测试、DevTools 与常见踩坑。

## 速查

- **atom 5 形态**：primitive / derived read-only / derived read-write / write-only（action）/ async
- **三大 hook**：`useAtom`（读 + 写）/ `useAtomValue`（只读，节省解构）/ `useSetAtom`（只写，**不订阅值变化**，性能最优）
- **atom 创建**：必须**模块顶层**或 `useMemo(() => atom(...), deps)`；组件内直接 `atom()` 会无限循环
- **Provider 可选**：默认全局 store（`getDefaultStore`）；需要隔离时 `<Provider store={createStore()}>`
- **async atom**：read 返 Promise + 包 `<Suspense>` + `<ErrorBoundary>`；不想 Suspense 用 `loadable`
- **派生 atom**：`atom((get) => ...)`——`get` 调用自动建立依赖
- **write-only atom**：`atom(null, (get, set, payload) => ...)`——action 模式
- **utils**：`atomWithStorage` / `atomWithReset` + `useResetAtom` / `atomFamily` / `atomWithDefault` / `loadable` / `unwrap` / `selectAtom` / `splitAtom` / `atomWithReducer` / `atomWithLazy`
- **SSR**：`<Provider store={...}>` + `useHydrateAtoms` 注水
- **DevTools**：`jotai-devtools` 包 + Babel/SWC 插件自动 `debugLabel`
- **测试**：每个测试创建新 `createStore()` + `<Provider store={...}>` 包裹

## Atom Primitives 全谱

Jotai 的核心抽象只有一个 `atom()` 函数——但**它有 5 种使用形态**，对应不同的业务模式。

### 1. Primitive Atom（基础 atom）

最简单——传入初始值即可：

```ts
import { atom } from 'jotai'

const countAtom = atom(0)
const messageAtom = atom('hello')
const userAtom = atom({ id: 1, name: 'Alice' })
const todosAtom = atom<Todo[]>([])
```

特点：

- **可读可写**：组件中可以 `useAtom` 解构 setter
- **持有真实值**：第一次被订阅时初始化为 `initialValue`
- **类型自动推导**：`atom(0)` → `PrimitiveAtom&lt;number&gt;`

### 2. Derived Atom（read-only / 只读派生）

read 函数 + `get` 自动追踪依赖：

```ts
const countAtom = atom(10)
const priceAtom = atom(100)

// 单依赖
const doubledAtom = atom((get) => get(countAtom) * 2)

// 多依赖（自动追踪两个）
const tax = 0.08
const totalAtom = atom((get) => {
  const price = get(priceAtom)
  return price * (1 + tax) * get(countAtom)
})
```

特点：

- **只读**：组件中只能用 `useAtomValue`
- **惰性**：只有被订阅时 `read` 才执行、`get` 才建立依赖
- **自动重算**：任意依赖变化触发重新计算

### 3. Derived Atom（read-write / 读写派生）

read + write 两参数：

```ts
const dollarsAtom = atom(10)

const centsAtom = atom(
  (get) => get(dollarsAtom) * 100, // read
  (get, set, newCents: number) => {
    set(dollarsAtom, newCents / 100) // write
  },
)

// 组件中：
const [cents, setCents] = useAtom(centsAtom)
setCents(500) // 内部 set(dollarsAtom, 5) → cents 派生为 500
```

特点：

- **读 + 写两端可解耦**：可以做单位换算 / 数据转换层
- **write 中 `get` 不建立依赖**：只是临时读取
- **可在 write 中 set 多个 atom**

### 4. Write-only Atom（action 模式）

第一个参数传 `null`、第二个参数是 action 函数：

```ts
const countAtom = atom(0)
const logsAtom = atom<string[]>([])

const incrementAtom = atom(
  null, // ← 约定：read 部分传 null
  (get, set, delta: number = 1) => {
    set(countAtom, get(countAtom) + delta)
    set(logsAtom, [...get(logsAtom), `+${delta}`])
  },
)

// 组件中：
const increment = useSetAtom(incrementAtom)
;<button onClick={() => increment(5)}>+5</button>
```

特点：

- **action 模式**：业务逻辑沉淀到 atom、组件只触发
- **可异步**：write 函数可以是 async
- **组件用 `useSetAtom`**（不订阅值变化 → 不重渲）

### 5. Async Atom（异步 atom + Suspense）

read 返 Promise：

```ts
const userIdAtom = atom(1)

const userAtom = atom(async (get, { signal }) => {
  const id = get(userIdAtom)
  const res = await fetch(`/api/users/${id}`, { signal })
  return res.json()
})

// 组件中（必须包 Suspense）：
function UserName() {
  const user = useAtomValue(userAtom)
  return <div>{user.name}</div>
}
```

特点：

- **read 函数 async**
- **Suspense 一等公民**：自动 throw Promise / 触发 Suspense fallback
- **AbortController 内置**：read 函数第二参数 `{ signal }`、依赖变化时自动 abort 上一次请求
- **依赖切换自动重新请求**：`userIdAtom` 变化 → `userAtom` 重新发请求 → 旧请求 abort

## 三大 Hook 选用决策

Jotai 提供三个核心 hook——根据「**是否读 / 是否订阅值变化 / 是否写**」三个维度选用：

| Hook | 读值 | 订阅值变化（值变触发重渲） | 写入 | 典型场景 |
|---|---|---|---|---|
| `useAtom` | ✅ | ✅ | ✅ | 类比 `useState`、读 + 写一体 |
| `useAtomValue` | ✅ | ✅ | ❌ | 只读组件、派生 atom 展示 |
| `useSetAtom` | ❌ | ❌ | ✅ | 触发按钮、action atom、性能优化 |

### 使用 `useAtom`（读 + 写）

最直观——类比 `useState`：

```tsx
import { useAtom } from 'jotai'

function Counter() {
  const [count, setCount] = useAtom(countAtom)
  return (
    <button onClick={() => setCount((c) => c + 1)}>
      Count: {count}
    </button>
  )
}
```

### 使用 `useAtomValue`（只读，意图清晰）

派生 atom（无 setter）或只读组件：

```tsx
import { useAtomValue } from 'jotai'

function Display() {
  // ✅ 派生 atom 必须用 useAtomValue
  const doubled = useAtomValue(doubledAtom)
  return <p>Doubled: {doubled}</p>
}

// ❌ 不推荐：派生 atom 用 useAtom，setter 是 never 但代码意图模糊
const [doubled, _setter] = useAtom(doubledAtom)
```

### 使用 `useSetAtom`（只写，性能最优）

**最关键的性能优化点**——只触发不读值时：

```tsx
import { useSetAtom } from 'jotai'

function ResetButton() {
  // ✅ 只拿 setter，不订阅 countAtom 的值变化
  const setCount = useSetAtom(countAtom)
  return <button onClick={() => setCount(0)}>Reset</button>
}
```

**对比**：

```tsx
// ❌ 性能差：组件订阅了 countAtom，count 变化时也会重渲
function BadResetButton() {
  const [_count, setCount] = useAtom(countAtom) // 不需要 count 但订阅了
  return <button onClick={() => setCount(0)}>Reset</button>
}

// ✅ 性能好：组件不订阅 countAtom，count 变化时不重渲
function GoodResetButton() {
  const setCount = useSetAtom(countAtom)
  return <button onClick={() => setCount(0)}>Reset</button>
}
```

> **核心原则**：「**只写不读** → `useSetAtom`」「**只读不写** → `useAtomValue`」「**读 + 写** → `useAtom`」。意图清晰 + 性能最优。

### `useStore` Hook（拿到当前 store）

在组件树中拿到当前 Provider 的 store（用于命令式调用）：

```tsx
import { useStore } from 'jotai'

function ManualReader() {
  const store = useStore()
  // 命令式读 / 写 atom（不订阅）
  const handleClick = () => {
    const value = store.get(countAtom)
    store.set(countAtom, value + 1)
    console.log('Direct manipulation:', value)
  }
  return <button onClick={handleClick}>Bump</button>
}
```

## Provider 与 Store 隔离

### 默认全局 Store

不包 Provider 时，所有 atom 共享一个**全局 store**：

```tsx
function App() {
  return (
    <>
      <Counter /> {/* 这里读 countAtom */}
      <Display /> {/* 这里也读 countAtom — 同一个值 */}
    </>
  )
}
```

### 单 Provider（隔离单一子树）

```tsx
import { Provider } from 'jotai'

function App() {
  return (
    <>
      <Counter /> {/* 全局 store 中的 countAtom */}
      <Provider>
        <Counter /> {/* 独立 store 中的 countAtom —— 不同值 */}
      </Provider>
    </>
  )
}
```

### 多 Provider（多子树隔离）

```tsx
function App() {
  return (
    <div className="panels">
      <Provider>
        <Panel name="A" />
      </Provider>
      <Provider>
        <Panel name="B" />
      </Provider>
    </div>
  )
}
// Panel A / B 中的 countAtom 互不影响
```

### 注入自定义 Store（带初始值）

```tsx
import { createStore, Provider } from 'jotai'

const myStore = createStore()
myStore.set(countAtom, 100)
myStore.set(userAtom, { id: 1, name: 'Alice' })

function App() {
  return (
    <Provider store={myStore}>
      <Counter /> {/* count 一开始就是 100 */}
    </Provider>
  )
}
```

### Provider 重置（unmount 清空）

```tsx
function ResettablePanel() {
  const [key, setKey] = useState(0)
  return (
    <>
      <button onClick={() => setKey((k) => k + 1)}>Reset</button>
      {/* key 变化 → Provider unmount + 重新 mount → 内部所有 atom 重置 */}
      <Provider key={key}>
        <ComplexForm />
      </Provider>
    </>
  )
}
```

> Provider 的「unmount 即重置」是 Jotai 重置整个状态树的最快方法——比手动 reset 每个 atom 更直观。

### `useHydrateAtoms`（注入初始值，v2 替代 `initialValues`）

v2 移除 Provider 的 `initialValues` 属性——改用 `useHydrateAtoms` hook：

```tsx
import { Provider, useAtomValue } from 'jotai'
import { useHydrateAtoms } from 'jotai/utils'

interface HydrateAtomsProps {
  initialValues: Iterable<readonly [Atom<any>, any]>
  children: React.ReactNode
}

function HydrateAtoms({ initialValues, children }: HydrateAtomsProps) {
  useHydrateAtoms(initialValues)
  return children
}

function App() {
  return (
    <Provider>
      <HydrateAtoms initialValues={[
        [countAtom, 42],
        [userAtom, { id: 1, name: 'Alice' }],
      ]}>
        <Counter />
      </HydrateAtoms>
    </Provider>
  )
}
```

特点：

- **只 hydrate 一次**：默认 atom 在同一个 store 中只接受一次初始值（避免 SSR 与 client 冲突）
- **支持 Map**：`useHydrateAtoms(new Map([[atom, value]]))`
- **`dangerouslyForceHydrate`**：强制重新 hydrate（concurrent 模式下慎用）

## Atom 创建时机

### 模块级声明（默认推荐）

```ts
// src/atoms/counter.ts
import { atom } from 'jotai'

// ✅ 模块顶层，引用稳定
export const countAtom = atom(0)
export const doubledAtom = atom((get) => get(countAtom) * 2)
```

### 组件内动态 atom（必须 `useMemo`）

```tsx
import { useMemo } from 'react'
import { atom, useAtom } from 'jotai'

function ParametrizedCounter({ initialValue }: { initialValue: number }) {
  // ✅ useMemo 锁定 atom 引用（除非 initialValue 变化）
  const countAtom = useMemo(() => atom(initialValue), [initialValue])
  const [count, setCount] = useAtom(countAtom)
  return (
    <button onClick={() => setCount((c) => c + 1)}>
      {count}
    </button>
  )
}
```

> **绝对禁止**：组件内直接 `const a = atom(...)` 而不包 `useMemo`——每次渲染都创建新 atom → `useAtom` 看到不同 atom → 无限循环重渲。

### 在 list / map 内为每项动态创建 atom

不推荐——建议用 `atomFamily`（详见后文）。

## Async Atom 与 Suspense

### 基础异步 read

```ts
const userIdAtom = atom(1)

const userAtom = atom(async (get, { signal }) => {
  const id = get(userIdAtom)
  const res = await fetch(`/api/users/${id}`, { signal })
  if (!res.ok) throw new Error('Failed to fetch user')
  return res.json()
})
```

### Suspense + ErrorBoundary 完整模式

```tsx
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { useAtomValue } from 'jotai'

function UserName() {
  const user = useAtomValue(userAtom) // 自动 await
  return <div>{user.name}</div>
}

export default function App() {
  return (
    <ErrorBoundary fallback={<p>Error loading user</p>}>
      <Suspense fallback={<p>Loading user...</p>}>
        <UserName />
      </Suspense>
    </ErrorBoundary>
  )
}
```

### AbortController（自动取消旧请求）

```ts
const userAtom = atom(async (get, { signal }) => {
  const id = get(userIdAtom)
  const res = await fetch(`/api/users/${id}`, { signal })
  return res.json()
})

// 当 userIdAtom 变化时：
// 1. userAtom 重新计算 → 发起新请求
// 2. 上一次请求的 signal 自动 abort → fetch 取消
// 3. 新请求 resolve → UI 更新
```

### 不想 Suspense？用 `loadable`

`loadable` 把 async atom 包装为 `{ state, data, error }` 形式：

```ts
import { atom } from 'jotai'
import { loadable } from 'jotai/utils'

const userAtom = atom(async (get) => fetch(`/api/users/1`).then((r) => r.json()))

// 包一层 loadable
const userLoadableAtom = loadable(userAtom)

function UserPanel() {
  const result = useAtomValue(userLoadableAtom)

  if (result.state === 'loading') return <p>Loading...</p>
  if (result.state === 'hasError') return <p>Error: {String(result.error)}</p>
  return <p>User: {result.data.name}</p>
}
```

### 同步化：`unwrap`（fallback 值）

`unwrap` 把 async atom 同步化——加载期间用 fallback：

```ts
import { unwrap } from 'jotai/utils'

const userAtom = atom(async (get) => fetch(`/api/users/1`).then((r) => r.json()))

// 加载期间返回 undefined
const unwrapped = unwrap(userAtom)

// 加载期间返回 fallback 值（也保留上一次结果）
const unwrappedWithFallback = unwrap(userAtom, (prev) => prev ?? { name: 'Anonymous' })
```

### 派生 atom vs write 模式选择

**派生 atom 适合**：

- 数据派生（如 `userNameAtom` 派生自 `userAtom`）
- 自动响应依赖变化（声明式）
- 与 Suspense 协同（loading 通过 `<Suspense fallback>` 体现）

**write 模式适合**：

- 命令式触发（按钮点击 / 表单提交）
- 需要手动 loading / error 字段（不走 Suspense）
- 副作用（如 POST API、文件上传）

```ts
// ✅ 派生模式：声明式获取
const userAtom = atom(async (get) => {
  const id = get(userIdAtom)
  return fetch(`/api/users/${id}`).then((r) => r.json())
})

// ✅ write 模式：命令式提交
const submitFormAtom = atom(null, async (get, set, formData: FormData) => {
  set(isSubmittingAtom, true)
  try {
    await fetch('/api/submit', { method: 'POST', body: formData })
    set(successAtom, true)
  } catch (err) {
    set(errorAtom, (err as Error).message)
  } finally {
    set(isSubmittingAtom, false)
  }
})
```

## Utils 工具集

Jotai 的 `jotai/utils` 子包提供大量工具——按需引入。

### `atomWithStorage`（持久化）

最常用工具——atom + localStorage（或其它 storage）自动同步：

```ts
import { atomWithStorage } from 'jotai/utils'

// 默认 localStorage + JSON.stringify
const darkModeAtom = atomWithStorage('darkMode', false)
const settingsAtom = atomWithStorage('settings', { theme: 'dark', lang: 'zh' })

// 组件中用法与普通 atom 一致
const [darkMode, setDarkMode] = useAtom(darkModeAtom)
```

#### 自定义 storage（sessionStorage / async / IndexedDB）

```ts
import { atomWithStorage, createJSONStorage } from 'jotai/utils'

// sessionStorage
const draftAtom = atomWithStorage(
  'draft',
  '',
  createJSONStorage(() => sessionStorage),
)

// AsyncStorage（React Native）
import AsyncStorage from '@react-native-async-storage/async-storage'
const tokenAtom = atomWithStorage(
  'token',
  '',
  createJSONStorage(() => AsyncStorage),
  { getOnInit: true }, // ← 启动时立即读取（避免 SSR fallback）
)

// IndexedDB（用 idb-keyval）
import { get, set, del, subscribe } from 'idb-keyval'

const idbStorage = {
  getItem: async (key: string) => (await get(key)) ?? null,
  setItem: async (key: string, value: string) => set(key, value),
  removeItem: async (key: string) => del(key),
  subscribe: (key: string, callback: (value: any) => void) => {
    return subscribe(key, (value) => callback(value))
  },
}

const cacheAtom = atomWithStorage('cache', {}, idbStorage)
```

#### `getOnInit` 选项

```ts
// 默认 false：先返回 initialValue → 再异步读取 storage → 更新
const atom1 = atomWithStorage('key', 'default')

// true：立即返回 storage 的值（不经过 initialValue）
const atom2 = atomWithStorage('key', 'default', undefined, { getOnInit: true })
```

> **何时用 `getOnInit: true`**？避免「先显示 default → 再 flash 为 storage 值」的闪烁。SSR 场景下需配合 `<ClientOnly>` 包裹避免 hydration mismatch。

#### 跨 tab 同步

`atomWithStorage` 默认监听 `storage` event——一个 tab 修改 → 其它 tab 同步：

```ts
// Tab A 中：
setDarkMode(true)

// Tab B 中（自动同步）：
// darkModeAtom 值变为 true → UI 重新渲染
```

### `atomWithReset` + `useResetAtom`

基础重置 atom：

```ts
import { atomWithReset, useResetAtom, RESET } from 'jotai/utils'

const draftAtom = atomWithReset({
  title: '',
  body: '',
})

function Form() {
  const [draft, setDraft] = useAtom(draftAtom)
  const resetDraft = useResetAtom(draftAtom)

  // 方法 1：通过 hook 重置
  return (
    <>
      <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
      <button onClick={resetDraft}>Reset</button>
      <button onClick={() => setDraft(RESET)}>Reset via RESET</button>
    </>
  )
}
```

`RESET` 符号也可在派生 atom 中传递：

```ts
const centsAtom = atom(
  (get) => get(dollarsAtom) * 100,
  (get, set, newValue: number | typeof RESET) => {
    set(dollarsAtom, newValue === RESET ? newValue : newValue / 100)
  },
)
```

### `atomWithDefault`（动态默认值）

默认值由 read 函数派生（同时可重置）：

```ts
import { atomWithDefault, useResetAtom } from 'jotai/utils'

const count1Atom = atom(1)
// 默认值 = count1Atom * 2 —— 但可以独立 set 覆盖
const count2Atom = atomWithDefault((get) => get(count1Atom) * 2)

function Demo() {
  const [count1, setCount1] = useAtom(count1Atom)
  const [count2, setCount2] = useAtom(count2Atom)
  const resetCount2 = useResetAtom(count2Atom)

  // 一开始 count1 = 1, count2 = 2（派生）
  // setCount1(10) → count2 = 20（仍派生）
  // setCount2(99) → count2 = 99（覆盖、不再派生）
  // setCount1(100) → count2 = 99（保持覆盖、不再响应）
  // resetCount2() → count2 = 200（重置回派生）
}
```

> **应用场景**：「**用户偏好的默认值由系统配置派生，但用户可覆盖、且可恢复默认**」。

### `atomFamily`（参数化 atom 工厂）

> ⚠️ Jotai v3 将移除 `atomFamily`——届时迁移到 [`jotai-family`](https://github.com/jotaijs/jotai-family) 包（API 兼容）。当前 v2 仍可用。

类似 Recoil 的 `atomFamily`——根据参数生成 atom：

```ts
import { atomFamily } from 'jotai/utils'

// 工厂：根据 todoId 生成对应的 todoAtom
const todoFamily = atomFamily((id: number) =>
  atom({ id, text: '', done: false }),
)

// 使用：
const todo1 = useAtom(todoFamily(1))
const todo2 = useAtom(todoFamily(2))
// todo1 和 todo2 是完全独立的 atom
```

#### 深比较参数

默认用 `Object.is`——对象参数会每次创建新 atom（内存泄漏）。用 `fast-deep-equal`：

```ts
import deepEqual from 'fast-deep-equal'

const todoFamily = atomFamily(
  (params: { id: number; type: string }) => atom({ ...params, done: false }),
  deepEqual,
)
// 现在 todoFamily({ id: 1, type: 'A' }) 和 todoFamily({ id: 1, type: 'A' }) 返回同一个 atom
```

#### 内存管理

`atomFamily` 会**缓存所有创建过的 atom**——长时间运行可能内存泄漏：

```ts
// 手动移除
todoFamily.remove(1)

// 自动清理：基于策略（如「30 分钟未使用就清理」）
todoFamily.setShouldRemove((createdAt, param) => {
  return Date.now() - createdAt > 30 * 60 * 1000
})

// 遍历当前缓存的所有参数
for (const param of todoFamily.getParams()) {
  console.log('Cached param:', param)
}
```

### `selectAtom`（派生 + 自定义 equality）

派生 atom 默认用 `Object.is` 比较——需要自定义比较（深比较 / 业务规则）时用 `selectAtom`：

```ts
import { selectAtom } from 'jotai/utils'
import deepEqual from 'fast-deep-equal'

const userAtom = atom({ id: 1, name: 'Alice', email: 'a@x.com', age: 30 })

// 派生 + 自定义 equality
const userNameAtom = selectAtom(
  userAtom,
  (user) => ({ id: user.id, name: user.name }),
  deepEqual, // 当 id / name 都未变时不触发重渲
)
```

> **注意**：`selectAtom` 的官方文档明确表示它是「**escape hatch**」——大多数场景应优先用 `atom((get) => ...)` 派生 atom。仅当需要自定义 equality 时才用。

### `splitAtom`（数组每元素一个 atom）

性能优化必备——把数组拆成「**atom 数组**」，每元素独立订阅：

```ts
import { atom } from 'jotai'
import { splitAtom } from 'jotai/utils'

interface Todo {
  id: number
  text: string
  done: boolean
}

const todosAtom = atom<Todo[]>([
  { id: 1, text: 'Learn Jotai', done: false },
  { id: 2, text: 'Build app', done: false },
])

// 拆分：每个 todo 一个独立 atom
const todoAtomsAtom = splitAtom(todosAtom, (todo) => todo.id) // keyExtractor 可选但推荐
```

组件中用法：

```tsx
function TodoList() {
  const [todoAtoms, dispatch] = useAtom(todoAtomsAtom)

  return (
    <ul>
      {todoAtoms.map((todoAtom) => (
        // 注意：key 必须稳定 —— 用 String(todoAtom) 或 keyExtractor 派生的 key
        <TodoItem key={`${todoAtom}`} todoAtom={todoAtom} dispatch={dispatch} />
      ))}
    </ul>
  )
}

function TodoItem({ todoAtom, dispatch }: {
  todoAtom: PrimitiveAtom<Todo>
  dispatch: (action: any) => void
}) {
  // 每个 TodoItem 只订阅自己的 todoAtom —— 其它 item 变化不重渲！
  const [todo, setTodo] = useAtom(todoAtom)

  return (
    <li>
      <input
        type="checkbox"
        checked={todo.done}
        onChange={(e) => setTodo({ ...todo, done: e.target.checked })}
      />
      <span>{todo.text}</span>
      <button onClick={() => dispatch({ type: 'remove', atom: todoAtom })}>
        Delete
      </button>
    </li>
  )
}
```

`splitAtom` 的 dispatch 支持：

- `{ type: 'remove', atom: itemAtom }`
- `{ type: 'insert', value: newItem, before?: atom }`
- `{ type: 'move', atom: itemAtom, before?: atom }`

> **核心价值**：100 个 todo 的列表中，勾选某个 todo → 只有那一项重渲，其它 99 项保持不变。

### `atomWithReducer`（reducer 模式）

类似 React `useReducer`：

```ts
import { atomWithReducer } from 'jotai/utils'

type Action = { type: 'inc' } | { type: 'dec' } | { type: 'reset' }

const countReducerAtom = atomWithReducer(0, (prev, action: Action) => {
  switch (action.type) {
    case 'inc': return prev + 1
    case 'dec': return prev - 1
    case 'reset': return 0
    default: throw new Error('unknown action')
  }
})

// 组件中：
const [count, dispatch] = useAtom(countReducerAtom)
dispatch({ type: 'inc' })
```

### `atomWithLazy`（延迟初始化）

初始值计算昂贵 → 延迟到第一次订阅时再算：

```ts
import { atomWithLazy } from 'jotai/utils'

// 不会立即计算 —— 仅在第一次被订阅时执行
const expensiveAtom = atomWithLazy(() => {
  console.log('computing initial value...')
  return computeHeavyDefaultData() // 假设很慢
})
```

特点：

- 创建时 **不计算**——只有第一次被某个组件 `useAtom` 时才执行
- 之后行为类似普通 primitive atom（可写）
- **多 store 场景**：每个 store 独立初始化（如 logout / 切换用户时新 store 重新计算）

### `atomWithObservable`（RxJS 集成）

把 RxJS observable 包装为 atom：

```ts
import { atomWithObservable } from 'jotai/utils'
import { interval } from 'rxjs'
import { map } from 'rxjs/operators'

const counterAtom = atomWithObservable(() =>
  interval(1000).pipe(map((n) => `Tick ${n}`)),
)

// 组件中（需要 Suspense 等待第一个值）
function Ticker() {
  const tick = useAtomValue(counterAtom)
  return <p>{tick}</p>
}
```

### `useAtomCallback`（命令式访问）

非 React 渲染期内、命令式读写 atom：

```tsx
import { useCallback } from 'react'
import { useAtomCallback } from 'jotai/utils'

function Logger() {
  // 必须用 useCallback 包裹（保持稳定引用）
  const readCount = useAtomCallback(
    useCallback((get) => {
      return get(countAtom)
    }, []),
  )

  // 在 setInterval 中读 —— 不会订阅、不触发重渲
  useEffect(() => {
    const timer = setInterval(() => {
      console.log('current count:', readCount())
    }, 1000)
    return () => clearInterval(timer)
  }, [readCount])

  return null
}
```

> **应用场景**：定时器 / 外部事件回调 / 命令式读写 atom 但**不想订阅**值变化触发组件重渲。

## DevTools 与调试

### `jotai-devtools` 包

```bash
pnpm add -D jotai-devtools
```

```tsx
import { DevTools } from 'jotai-devtools'
import 'jotai-devtools/styles.css'

function App() {
  return (
    <>
      <YourApp />
      <DevTools /> {/* 浮动调试面板 */}
    </>
  )
}
```

DevTools 提供：

- **Atom Viewer**：所有当前活跃 atom 列表 + 实时值
- **Atom Graph**：依赖关系可视化
- **Snapshot**：拍照 + 时间旅行
- **History**：所有 atom 变化历史

### `debugLabel`（手动 / 自动）

DevTools 中识别 atom 靠 `debugLabel`：

```ts
// 手动设置
const countAtom = atom(0)
countAtom.debugLabel = 'countAtom'

// 自动设置（推荐）：用 Babel / SWC 插件
```

### Babel / SWC 插件（自动 debugLabel + Fast Refresh）

Babel 用法：

```bash
pnpm add -D @babel/preset-env jotai/babel
```

`babel.config.js`：

```js
module.exports = {
  presets: [
    'jotai/babel/preset', // ← 自动 debugLabel + Fast Refresh
  ],
}
```

SWC 用法（Next.js / Vite SWC）：

```bash
pnpm add -D @swc-jotai/debug-label @swc-jotai/react-refresh
```

`next.config.mjs`：

```js
export default {
  experimental: {
    swcPlugins: [
      ['@swc-jotai/debug-label', {}],
      ['@swc-jotai/react-refresh', {}],
    ],
  },
}
```

效果：

```ts
// 源码
const countAtom = atom(0)

// 编译后
const countAtom = atom(0)
countAtom.debugLabel = 'countAtom'
```

> Fast Refresh 修复：默认 HMR 会让 atom 重新创建 + 丢失状态——SWC/Babel 插件让 atom 保留状态。

### `useAtomDevtools`（单 atom）

集成 Redux DevTools 浏览器扩展（per-atom）：

```tsx
import { useAtomDevtools } from 'jotai-devtools/utils'

function Inspector() {
  useAtomDevtools(countAtom, { name: 'count' })
  return null
}
```

### `useAtomsDevtools`（全部 atom）

```tsx
import { useAtomsDevtools } from 'jotai-devtools/utils'

function GlobalInspector() {
  useAtomsDevtools('myApp')
  return null
}
```

## 集成生态

### `jotai-tanstack-query`（TanStack Query 集成）

```bash
pnpm add jotai-tanstack-query @tanstack/react-query
```

```tsx
import { atomWithQuery } from 'jotai-tanstack-query'

interface User {
  id: number
  name: string
}

const userIdAtom = atom(1)

// 把 TanStack Query 包装为 atom
const userQueryAtom = atomWithQuery((get) => ({
  queryKey: ['user', get(userIdAtom)],
  queryFn: async ({ queryKey: [, id] }) => {
    const res = await fetch(`/api/users/${id}`)
    return res.json() as Promise<User>
  },
}))

// 组件中：拿到的是 TanStack Query 的 result 对象
function UserCard() {
  const [{ data, isPending, isError, error }] = useAtom(userQueryAtom)
  if (isPending) return <p>Loading...</p>
  if (isError) return <p>{(error as Error).message}</p>
  return <p>{data.name}</p>
}
```

#### Setup：QueryClient 注入

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'jotai'
import { useHydrateAtoms } from 'jotai/utils'
import { queryClientAtom } from 'jotai-tanstack-query'

const queryClient = new QueryClient()

function HydrateQueryClient({ children }: { children: React.ReactNode }) {
  useHydrateAtoms([[queryClientAtom, queryClient]])
  return <>{children}</>
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider>
        <HydrateQueryClient>
          <YourApp />
        </HydrateQueryClient>
      </Provider>
    </QueryClientProvider>
  )
}
```

> 还有 `atomWithMutation` / `atomWithInfiniteQuery` / `atomWithSuspenseQuery` 等——见 [jotai-tanstack-query](https://github.com/jotaijs/jotai-tanstack-query)。

### `jotai-immer`（嵌套 mutable 写法）

```bash
pnpm add jotai-immer
```

```ts
import { atomWithImmer } from 'jotai-immer'

const userAtom = atomWithImmer({ name: 'Alice', settings: { theme: 'dark' } })

const [user, updateUser] = useAtom(userAtom)
// 直接 mutate（Immer 内部转换为 immutable update）
updateUser((draft) => {
  draft.settings.theme = 'light'
})
```

### `jotai-xstate`（状态机集成）

```bash
pnpm add jotai-xstate xstate
```

```ts
import { atomWithMachine } from 'jotai-xstate'
import { createMachine } from 'xstate'

const toggleMachine = createMachine({
  id: 'toggle',
  initial: 'inactive',
  states: {
    inactive: { on: { TOGGLE: 'active' } },
    active: { on: { TOGGLE: 'inactive' } },
  },
})

const toggleAtom = atomWithMachine(() => toggleMachine)

function Toggle() {
  const [state, send] = useAtom(toggleAtom)
  return (
    <button onClick={() => send({ type: 'TOGGLE' })}>
      {state.matches('active') ? 'ON' : 'OFF'}
    </button>
  )
}
```

### 其它官方集成

- [`jotai-redux`](https://github.com/jotaijs/jotai-redux)：把 Redux store 转为 atom
- [`jotai-zustand`](https://github.com/jotaijs/jotai-zustand)：atom ↔ Zustand store 互转
- [`jotai-trpc`](https://github.com/jotaijs/jotai-trpc)：tRPC 集成
- [`jotai-effect`](https://github.com/jotaijs/jotai-effect)：副作用 atom

## Next.js 与 SSR

### Provider per-request（避免 store 跨请求泄漏）

Next.js App Router 推荐每次请求一个独立 store：

```tsx
// app/providers.tsx
'use client'
import { Provider, createStore } from 'jotai'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  // 每次客户端 mount 创建独立 store
  const [store] = useState(() => createStore())
  return <Provider store={store}>{children}</Provider>
}

// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### `useHydrateAtoms`（注入服务端数据）

```tsx
'use client'
import { useHydrateAtoms } from 'jotai/utils'
import { userAtom } from '@/atoms/user'

interface HydrateUserProps {
  user: User
  children: React.ReactNode
}

function HydrateUser({ user, children }: HydrateUserProps) {
  useHydrateAtoms([[userAtom, user]])
  return <>{children}</>
}

// app/users/[id]/page.tsx (Server Component)
export default async function UserPage({ params }: { params: { id: string } }) {
  const user = await fetch(`/api/users/${params.id}`).then((r) => r.json())
  return (
    <Providers>
      <HydrateUser user={user}>
        <UserDashboard />
      </HydrateUser>
    </Providers>
  )
}
```

> **注意**：`useHydrateAtoms` 必须在 client component 中调用（顶部加 `'use client'`）。

### SSR 中 async atom 的限制

```ts
// ❌ SSR 中不能 return Promise —— Next.js Server Component 不支持 throw Promise
const userAtom = atom(async (get) => fetch('/api/user').then((r) => r.json()))

// ✅ 改用 useHydrateAtoms 在服务端预取，客户端注入
// （服务端用 fetch + 直接传 props，客户端用 useHydrateAtoms 注入）
```

### `atomWithStorage` 的 SSR

```tsx
// ✅ 默认行为：服务端用 initialValue 渲染、客户端 mount 后读取 storage 替换
const themeAtom = atomWithStorage('theme', 'light')

// 这会导致 hydration mismatch（服务端 'light' → 客户端可能是 'dark'）
// 解决方案：用 <ClientOnly> 包裹依赖该 atom 的组件
```

或者用 `getOnInit: true` + 仅客户端渲染：

```tsx
'use client'
const themeAtom = atomWithStorage('theme', 'light', undefined, { getOnInit: true })

// 配合 dynamic import { ssr: false }
```

## 测试

### 每个测试独立 store

```ts
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider, createStore } from 'jotai'
import { countAtom } from '@/atoms/counter'
import Counter from '@/components/Counter'

describe('Counter', () => {
  it('renders initial count', () => {
    // 每个测试创建独立 store —— 隔离状态
    const store = createStore()
    render(
      <Provider store={store}>
        <Counter />
      </Provider>,
    )
    expect(screen.getByText('Count: 0')).toBeInTheDocument()
  })

  it('renders custom initial count via store', () => {
    const store = createStore()
    store.set(countAtom, 42)
    render(
      <Provider store={store}>
        <Counter />
      </Provider>,
    )
    expect(screen.getByText('Count: 42')).toBeInTheDocument()
  })
})
```

### 通过 `useHydrateAtoms` 注入初值

```tsx
// __tests__/helpers/TestProvider.tsx
import { Provider } from 'jotai'
import { useHydrateAtoms } from 'jotai/utils'

interface TestProviderProps {
  initialValues?: Iterable<readonly [Atom<any>, any]>
  children: React.ReactNode
}

export function TestProvider({ initialValues = [], children }: TestProviderProps) {
  return (
    <Provider>
      <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
    </Provider>
  )
}

function HydrateAtoms({ initialValues, children }: TestProviderProps) {
  useHydrateAtoms(initialValues!)
  return children
}

// 使用：
render(
  <TestProvider initialValues={[[countAtom, 100]]}>
    <Counter />
  </TestProvider>,
)
```

### 测试 atom 自身（不通过组件）

```ts
import { createStore } from 'jotai'
import { countAtom, doubledAtom, incrementAtom } from '@/atoms/counter'

describe('counter atoms', () => {
  it('doubledAtom derives from countAtom', () => {
    const store = createStore()
    store.set(countAtom, 5)
    expect(store.get(doubledAtom)).toBe(10)
    store.set(countAtom, 7)
    expect(store.get(doubledAtom)).toBe(14)
  })

  it('incrementAtom mutates countAtom', () => {
    const store = createStore()
    store.set(countAtom, 0)
    store.set(incrementAtom) // 触发 action
    expect(store.get(countAtom)).toBe(1)
  })
})
```

### `renderHook` 测试 hook 风格

```tsx
import { renderHook, act } from '@testing-library/react'
import { Provider } from 'jotai'
import { useAtom } from 'jotai'

it('useAtom returns count and updates it', () => {
  const wrapper = ({ children }) => <Provider>{children}</Provider>
  const { result } = renderHook(() => useAtom(countAtom), { wrapper })

  expect(result.current[0]).toBe(0)
  act(() => result.current[1](42))
  expect(result.current[0]).toBe(42)
})
```

## 常见踩坑

### 1. atom 在组件内创建 → 无限循环

```tsx
// ❌ 每次渲染都创建新 atom
function Bad() {
  const a = atom(0) // ← 每次渲染是新对象
  const [v] = useAtom(a) // ← useAtom 看到不同 atom → 反复创建 → 无限循环
  return <p>{v}</p>
}

// ✅ 模块顶层或 useMemo
const a = atom(0)
function Good() {
  const [v] = useAtom(a)
  return <p>{v}</p>
}
```

### 2. async atom 在 SSR 中 throw Promise

Next.js Server Components 不支持 `useAtomValue(asyncAtom)`（会 throw Promise）——SSR 必须用：

- `useHydrateAtoms` 在 client 注水（推荐）
- `loadable` 包装为同步
- 客户端 only 渲染（`'use client'` + dynamic import）

### 3. 派生 atom 重新计算时机不可控

```ts
const aAtom = atom(1)
const bAtom = atom(2)
const sumAtom = atom((get) => get(aAtom) + get(bAtom))

// sumAtom 在 aAtom 变化时重新计算
// 也在 bAtom 变化时重新计算
// 这是正确行为 —— 自动依赖追踪
```

> 如果想「**a 变时不重算、只有 b 变时重算**」——用 `selectAtom` + 自定义 equality，或者把 `get(aAtom)` 挪到 write 函数（write 中 `get` 不建立依赖）。

### 4. async atom 重复请求（同一个值多次订阅）

```ts
const userAtom = atom(async (get) => fetch('/api/user').then((r) => r.json()))
```

多个组件同时 `useAtomValue(userAtom)` 时：

- **同一个 store + 同一个 atom** → 共享同一个 Promise → **只发一次请求** ✓
- **不同 Provider** → 不同 store → 各自发请求

> 多次重渲也不会重发——Promise 只在依赖（被 `get(...)` 的其它 atom）变化时才重发。

### 5. 循环依赖（A read B + B read A）

```ts
// ❌ 直接循环依赖
const aAtom = atom((get) => get(bAtom) + 1)
const bAtom = atom((get) => get(aAtom) - 1) // ← 错误：a 还没定义
```

```ts
// ✅ 解决方案：把循环依赖放进 write 函数（不建立依赖）
const aAtom = atom(0)
const bAtom = atom(0)

const syncBFromAAtom = atom(null, (get, set) => {
  set(bAtom, get(aAtom) - 1)
})
const syncAFromBAtom = atom(null, (get, set) => {
  set(aAtom, get(bAtom) + 1)
})
```

### 6. setter 函数引用稳定

setter 不会因为 atom 值变化而创建新引用——可以放心传到 `useEffect` / `useCallback` deps：

```tsx
function Form() {
  const setCount = useSetAtom(countAtom)
  // setCount 引用稳定 —— 跨重渲不变
  useEffect(() => {
    setCount(0) // ✓ 安全
  }, [setCount]) // setCount 不会触发 useEffect 重新执行
}
```

### 7. `useSetAtom` 与 `useAtom` 的性能差距

```tsx
// ❌ 高频 atom 变化 + 组件不需要值 → 浪费性能
function BigList() {
  const [, setCount] = useAtom(countAtom) // 订阅了 countAtom 值变化
  return <button onClick={() => setCount((c) => c + 1)}>+1</button>
}

// ✅ 只拿 setter
function GoodList() {
  const setCount = useSetAtom(countAtom)
  return <button onClick={() => setCount((c) => c + 1)}>+1</button>
}
```

### 8. `splitAtom` 列表项 key 选择

```tsx
// ❌ 用 atom 自身作为 key（每次 splitAtom 重新计算时 atom 引用变化）
{todoAtoms.map((todoAtom) => <TodoItem key={todoAtom} ... />)}

// ✅ 用 keyExtractor 提取的稳定 id
const todoAtomsAtom = splitAtom(todosAtom, (todo) => todo.id)
{todoAtoms.map((todoAtom, idx) => <TodoItem key={String(todoAtom)} ... />)}
```

### 9. atomWithStorage 的 SSR hydration mismatch

```tsx
// ❌ 服务端渲染 default、客户端 mount 后变成 storage 值 → DOM 闪烁 / React 警告
const themeAtom = atomWithStorage('theme', 'light')

// ✅ 方案 1：dynamic import + ssr: false
const ClientThemeProvider = dynamic(() => import('./ThemeProvider'), { ssr: false })

// ✅ 方案 2：useState + useEffect 延迟读取
function useClientOnly<T>(value: T, fallback: T) {
  const [v, setV] = useState(fallback)
  useEffect(() => setV(value), [value])
  return v
}
```

### 10. write 函数中 `get` 不建立依赖

```ts
const countAtom = atom(0)
const xAtom = atom(10)

// 派生 atom：read 中 get(xAtom) 建立依赖
const sumAtom = atom(
  (get) => get(countAtom) + get(xAtom), // xAtom 变化 → sumAtom 重算
  (get, set, n: number) => {
    // write 中 get(xAtom) 不建立依赖（仅临时读）
    set(countAtom, n - get(xAtom))
  },
)
```

理解这点很重要——**避免在 write 中误把临时读取当成依赖**。

## 与其它库的对比

### vs Zustand（同公司 / 不同哲学）

| 维度 | Jotai 2.x | Zustand 5.x |
|---|---|---|
| 心智模型 | bottom-up atom | top-down store |
| atom 标识 | 对象引用 | — |
| 订阅粒度 | atom 级（自动） | store 级（手动 selector） |
| 派生 state | 派生 atom + `get`（自动追踪） | selector 函数（手动） |
| Async | atom + Suspense（声明式） | async action（手动 loading） |
| Bundle | ~2-3KB | ~1KB |
| 学习曲线 | 中（atom 思想） | 低（10 分钟） |
| 适用 | 派生 state 多 / Recoil 迁移 | 单一全局状态 / 中小型 |

**混用场景**：全局 user / theme 用 Zustand、表单局部 / 派生状态用 Jotai。

### vs Recoil（API 思想几乎一致）

Recoil 已 archive、Jotai 是事实继任者：

| 维度 | Jotai 2.x | Recoil |
|---|---|---|
| atom 标识 | **对象引用** | 字符串 key（必须全局唯一） |
| Provider | 可选（默认全局） | `<RecoilRoot>` 必需 |
| 维护 | 活跃 | 已停止维护（Meta archive） |
| Bundle | ~2-3KB | ~10KB |
| API | atom + 派生 atom | atom + selector |

**迁移要点**：

```diff
- import { atom, selector } from 'recoil'
+ import { atom } from 'jotai'

- const countState = atom({ key: 'count', default: 0 })
+ const countAtom = atom(0)  // 移除 key

- const doubledState = selector({
-   key: 'doubled',
-   get: ({ get }) => get(countState) * 2,
- })
+ const doubledAtom = atom((get) => get(countAtom) * 2)
```

### vs Redux Toolkit

- **Redux Toolkit**：严格 reducer + slice + RTK Query 一体化，适合大型企业应用 / 严格审计
- **Jotai**：灵活 atom 组合 + 自动依赖追踪，适合派生 state 复杂的中后台

## 下一步

至此你已掌握 Jotai 的核心——**atom 5 形态** / **三大 hook 选用** / **Provider 多 store 隔离** / **async atom + Suspense + AbortController** / **所有 utils**（atomWithStorage / atomWithReset / atomFamily / atomWithDefault / loadable / unwrap / selectAtom / splitAtom / atomWithReducer / atomWithLazy）/ **集成生态**（jotai-tanstack-query / jotai-immer / jotai-xstate）/ **Next.js + SSR + useHydrateAtoms** / **测试策略** / **DevTools + Babel/SWC 插件** / **常见踩坑**。

继续学习：

- [参考](./reference.md)：**API 速查**——所有 `atom` 重载 / `useAtom` / `useAtomValue` / `useSetAtom` / `useStore` / `Provider` / `createStore` / `getDefaultStore` 完整签名 / 所有 utils 选项 / Store API / TypeScript 类型（`Atom` / `PrimitiveAtom` / `WritableAtom` / `Getter` / `Setter` / `ExtractAtomValue`）/ Import 来源速查 / v1 → v2 迁移要点速查
